import * as Dialog from "@radix-ui/react-dialog";
import { useAuth } from "@workos-inc/authkit-react";
import { useMutation, useQuery } from "convex/react";
import { Braces, Check, Download, FileJson, FileSpreadsheet, Info, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

type ImportPreview = { payload: any; fileName: string; counts: Record<string, number>; errors: string[]; updates: number };
const ENTITY_KEYS = ["companies", "opportunities", "applications", "contacts"] as const;

export function DataExchange() {
  const { user } = useAuth(); const uid = user?.id;
  const companies = useQuery(api.companies.list, uid ? { workosUserId: uid } : "skip");
  const opportunities = useQuery(api.opportunities.list, uid ? { workosUserId: uid } : "skip");
  const applications = useQuery(api.applications.list, uid ? { workosUserId: uid } : "skip");
  const contacts = useQuery(api.contacts.list, uid ? { workosUserId: uid } : "skip");
  const criteria = useQuery(api.ratings.listCriteria, uid ? { workosUserId: uid } : "skip");
  const ratingValues = useQuery(api.ratings.listAllValues, uid ? { workosUserId: uid } : "skip");
  const opportunityTypes = useQuery(api.opportunities.listTypes, uid ? { workosUserId: uid } : "skip");
  const applicationStatuses = useQuery(api.applications.listStatuses, uid ? { workosUserId: uid } : "skip");
  const companyViews = useQuery(api.savedViews.list, uid ? { workosUserId: uid, entityType: "companies" } : "skip");
  const opportunityViews = useQuery(api.savedViews.list, uid ? { workosUserId: uid, entityType: "opportunities" } : "skip");
  const importData = useMutation(api.dataExchange.importData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [guideOpen, setGuideOpen] = useState(false);
  const dataset = useMemo(() => {
    const companyIds = new Map((companies ?? []).map(row => [row._id, row.externalId ?? row._id]));
    const opportunityIds = new Map((opportunities ?? []).map(row => [row._id, row.externalId ?? row._id]));
    return {
      schemaVersion: 1, exportedAt: new Date().toISOString(),
      companies: clean(companies ?? []),
      opportunities: clean((opportunities ?? []).map(row => ({ ...row, companyId: companyIds.get(row.companyId) ?? row.companyId }))),
      applications: clean((applications ?? []).map(row => ({ ...row, companyId: companyIds.get(row.companyId) ?? row.companyId, opportunityId: row.opportunityId ? opportunityIds.get(row.opportunityId) ?? row.opportunityId : undefined }))),
      contacts: clean((contacts ?? []).map(row => ({ ...row, companyId: companyIds.get(row.companyId) ?? row.companyId }))),
      opportunityTypes: clean(opportunityTypes ?? []), applicationStatuses: clean(applicationStatuses ?? []), ratingCriteria: clean(criteria ?? []),
      ratingValues: clean((ratingValues ?? []).map(row => ({ ...row, entityId: row.entityType === "company" ? companyIds.get(row.entityId as any) ?? row.entityId : opportunityIds.get(row.entityId as any) ?? row.entityId }))),
      savedViews: clean([...(companyViews ?? []), ...(opportunityViews ?? [])]),
    };
  }, [applicationStatuses, applications, companies, companyViews, contacts, criteria, opportunities, opportunityTypes, opportunityViews, ratingValues]);

  const downloadJson = () => download("waypoint-export.json", JSON.stringify(dataset, null, 2), "application/json");
  const downloadCsv = () => download("waypoint-companies.csv", toCsv((companies ?? []).map(company => ({ id: company.externalId ?? company._id, name: company.name, websiteUrl: company.websiteUrl, overallScore: company.overallScore ?? "", notes: company.notes ?? "" }))), "text/csv");
  const readFile = async (file?: File) => {
    if (!file) return; setMessage("");
    try {
      const text = await file.text(); const payload = file.name.toLowerCase().endsWith(".csv") ? { companies: parseCsv(text) } : JSON.parse(text);
      const errors = validatePayload(payload); const ids = new Set([...(companies ?? []), ...(opportunities ?? []), ...(applications ?? []), ...(contacts ?? [])].flatMap(item => [item._id, item.externalId].filter(Boolean)));
      const counts = Object.fromEntries(ENTITY_KEYS.map(key => [key, Array.isArray(payload[key]) ? payload[key].length : 0]));
      const updates = ENTITY_KEYS.flatMap(key => Array.isArray(payload[key]) ? payload[key] : []).filter((item: any) => ids.has(item.id ?? item._id)).length;
      setPreview({ payload, fileName: file.name, counts, errors, updates });
    } catch { setMessage("That file could not be parsed. Choose valid Waypoint JSON or company CSV."); }
    if (fileRef.current) fileRef.current.value = "";
  };
  const confirm = async () => { if (!uid || !preview || preview.errors.length) return; setBusy(true); try { const result = await importData({ workosUserId: uid, payload: preview.payload }); setMessage(`Import complete · ${result.created} created, ${result.updated} updated`); setPreview(null); } catch (error) { setMessage(error instanceof Error ? error.message : "Import failed"); } finally { setBusy(false); } };

  return <section className="exchange-section">
    <div className="settings-section-heading"><div><h2>Data exchange</h2><p>Portable exports, validated imports, and a schema an AI can follow.</p></div><span><Braces size={13}/> Schema v1</span></div>
    <div className="exchange-grid">
      <article className="exchange-card"><span className="exchange-icon"><Download size={16}/></span><h3>Export your workspace</h3><p>JSON preserves relationships. CSV provides a simple company sheet.</p><div><Button variant="outline" onClick={downloadJson}><FileJson size={14}/> Full JSON</Button><Button variant="outline" onClick={downloadCsv}><FileSpreadsheet size={14}/> Companies CSV</Button></div></article>
      <article className="exchange-card"><span className="exchange-icon"><Upload size={16}/></span><h3>Import with preview</h3><p>Files are parsed and checked before anything is written.</p><input ref={fileRef} hidden type="file" accept=".json,.csv,application/json,text/csv" onChange={event => void readFile(event.target.files?.[0])}/><Button onClick={() => fileRef.current?.click()}><Upload size={14}/> Choose file</Button></article>
      <article className="exchange-card"><span className="exchange-icon"><Info size={16}/></span><h3>AI data format guide</h3><p>Field definitions, relationship rules, enums, and concrete examples.</p><Button variant="outline" onClick={() => setGuideOpen(true)}>Open guide</Button></article>
    </div>
    {message && <p className="exchange-message" role="status"><Check size={13}/>{message}</p>}
    <ImportDialog preview={preview} busy={busy} onClose={() => setPreview(null)} onConfirm={() => void confirm()}/>
    <GuideDialog open={guideOpen} onClose={() => setGuideOpen(false)}/>
  </section>;
}

function ImportDialog({preview,busy,onClose,onConfirm}:{preview:ImportPreview|null;busy:boolean;onClose:()=>void;onConfirm:()=>void}) { return <Dialog.Root open={!!preview} onOpenChange={open => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="record-dialog import-dialog"><div className="dialog-title-row"><div><p className="page-kicker">Validation preview</p><Dialog.Title>{preview?.fileName}</Dialog.Title><Dialog.Description>Review the change set before importing.</Dialog.Description></div><Dialog.Close><X size={17}/></Dialog.Close></div>{preview && <><div className="import-summary">{ENTITY_KEYS.map(key => <div key={key}><strong>{preview.counts[key]}</strong><span>{key}</span></div>)}</div><div className="import-impact"><span><i className="new"/> {Math.max(0,Object.values(preview.counts).reduce((a,b)=>a+b,0)-preview.updates)} new records</span><span><i className="update"/> {preview.updates} possible updates</span></div>{preview.errors.length ? <div className="import-errors">{preview.errors.map(error => <p key={error}>{error}</p>)}</div> : <p className="import-valid"><Check size={14}/> Structure valid. Relationships will be verified during import.</p>}<div className="dialog-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={busy || !!preview.errors.length} onClick={onConfirm}>{busy ? "Importing…" : "Confirm import"}</Button></div></>}</Dialog.Content></Dialog.Portal></Dialog.Root> }

function GuideDialog({open,onClose}:{open:boolean;onClose:()=>void}) { return <Dialog.Root open={open} onOpenChange={value => !value && onClose()}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="company-sheet guide-sheet"><Dialog.Title className="sr-only">AI Data Format Guide</Dialog.Title><div className="sheet-header"><span className="sheet-record-icon"><Braces size={18}/></span><div className="sheet-identity"><strong>AI Data Format Guide</strong><span>Waypoint schema v1</span></div><Dialog.Close className="sheet-close"><X size={18}/></Dialog.Close></div><div className="sheet-body guide-content"><p className="guide-lead">Give this guide with your export to an AI. Ask it to return valid JSON without changing stable IDs.</p><GuideSection title="Envelope"><code>{`{ "schemaVersion": 1, "companies": [], "opportunities": [], "applications": [], "contacts": [] }`}</code></GuideSection><GuideSection title="Companies"><p>Required: <b>name</b>, <b>websiteUrl</b>. Optional: id, notes, overallScore (0–100), and customFields. The website favicon is fetched automatically after import. Existing IDs update records; omitted IDs create records.</p><code>{`{"id":"company-bt-group","name":"BT Group","websiteUrl":"https://www.bt.com/","overallScore":86.8,"customFields":{"Sixth-form score":82,"Internship rank":1}}`}</code><p>Each key inside <b>customFields</b> becomes a company-table column. Top-level extra string, number, or boolean properties are also imported as custom columns. Text embedded inside notes remains notes and cannot become separate columns.</p></GuideSection><GuideSection title="Opportunities"><p>Required: name, companyId. Fields: type, locations[], links[], deadlines[], status, notes, overallScore, isOpen. Each location uses city, country, and optional mode: On-site, Hybrid, or Remote.</p><code>{`{"name":"Cyber Internship","companyId":"…","type":"Internship","locations":[{"city":"London","country":"UK","mode":"Hybrid"}],"deadlines":[{"name":"Apply","date":1789166400000}]}`}</code></GuideSection><GuideSection title="Applications & contacts"><p>Applications require companyId and may include opportunityId, status, deadlines, links, and notes. Contacts require name and companyId; role, linkedinUrl, and notes are optional.</p></GuideSection><GuideSection title="Relationship rules"><p>Keep exported IDs unchanged. Relationships always use stable IDs, never company names. New records can use temporary IDs when every related record uses the same value within the file.</p></GuideSection><GuideSection title="Import behaviour"><p>The preview validates structure first. Existing owned IDs are updated, missing IDs create records, and invalid or missing relationships stop the entire mutation. Dates are Unix milliseconds; URLs must be strings.</p></GuideSection></div></Dialog.Content></Dialog.Portal></Dialog.Root> }
function GuideSection({title,children}:{title:string;children:React.ReactNode}) { return <section><h2>{title}</h2>{children}</section>; }
function clean(rows:any[]) { return rows.map(({_creationTime,company,opportunity,logoUrl,workosUserId,trashed,updatedAt,faviconStorageId,logoStorageId,externalId,...row}) => ({ id: externalId ?? row._id, ...Object.fromEntries(Object.entries(row).filter(([key]) => key !== "_id")) })); }
function download(name:string,content:string,type:string) { const url=URL.createObjectURL(new Blob([content],{type})); const anchor=document.createElement("a"); anchor.href=url; anchor.download=name; anchor.click(); URL.revokeObjectURL(url); }
function toCsv(rows:Record<string,unknown>[]) { if (!rows.length) return "id,name,websiteUrl,overallScore,notes\n"; const headers=Object.keys(rows[0]); const quote=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`; return [headers.join(","),...rows.map(row=>headers.map(key=>quote(row[key])).join(","))].join("\n"); }
function parseCsv(text:string) { const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean); if (!lines.length) throw new Error("Empty CSV"); const parse=(line:string)=>{const cells:string[]=[];let value="",quoted=false;for(let i=0;i<line.length;i++){const char=line[i];if(char==='"'&&quoted&&line[i+1]==='"'){value+='"';i++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){cells.push(value);value="";}else value+=char;}cells.push(value);return cells;}; const headers=parse(lines[0]); return lines.slice(1).map(line=>Object.fromEntries(parse(line).map((value,index)=>[headers[index],headers[index]==="overallScore"&&value?Number(value):value]))); }
function validatePayload(payload:any) { const errors:string[]=[]; if (!payload || typeof payload!=="object") return ["Top-level value must be an object."]; for(const key of ENTITY_KEYS) if(payload[key]!==undefined&&!Array.isArray(payload[key])) errors.push(`${key} must be an array.`); for(const [index,row] of (payload.companies??[]).entries()) { if(!row.name||!row.websiteUrl) errors.push(`Company ${index+1} needs name and websiteUrl.`); if(row.customFields!==undefined&&(!row.customFields||typeof row.customFields!=="object"||Array.isArray(row.customFields))) errors.push(`Company ${index+1} customFields must be an object.`); } for(const [index,row] of (payload.opportunities??[]).entries()) if(!row.name||!row.companyId) errors.push(`Opportunity ${index+1} needs name and companyId.`); for(const [index,row] of (payload.contacts??[]).entries()) if(!row.name||!row.companyId) errors.push(`Contact ${index+1} needs name and companyId.`); return errors.slice(0,8); }
