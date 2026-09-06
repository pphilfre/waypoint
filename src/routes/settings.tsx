import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { UserProfile, UserSecurity, UserSessions, WorkOsWidgets } from "@workos-inc/widgets";
import { useMutation, useQuery } from "convex/react";
import { ArrowDown, ArrowUp, Check, Database, Palette, Pencil, Plus, Scale, Shapes, Trash2, UserRound, Workflow } from "lucide-react";
import { useTheme, type ThemeMode, type ColorScheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import { RatingConfiguration } from "@/components/ratings/RatingConfiguration";
import { DataExchange } from "@/components/settings/DataExchange";
import { TrashView } from "@/components/settings/TrashView";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

type SettingsSection = "appearance" | "workflow" | "ratings" | "data" | "trash" | "account";
const SECTIONS: { id: SettingsSection; label: string; icon: ReactNode }[] = [
  { id: "appearance", label: "Appearance", icon: <Palette size={15}/> },
  { id: "workflow", label: "Workflow", icon: <Workflow size={15}/> },
  { id: "ratings", label: "Ratings", icon: <Scale size={15}/> },
  { id: "data", label: "Data", icon: <Database size={15}/> },
  { id: "trash", label: "Trash", icon: <Trash2 size={15}/> },
  { id: "account", label: "Profile & security", icon: <UserRound size={15}/> },
];
const THEMES: { value: ThemeMode; label: string }[] = [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }];
const COLOR_SCHEMES: { value: ColorScheme; label: string; primary: string }[] = [
  { value: "green", label: "Teal", primary: "#19766B" },
  { value: "indigo", label: "Indigo", primary: "#6366f1" },
  { value: "mono", label: "Mono", primary: "#475569" },
  { value: "warm", label: "Warm", primary: "#f97316" },
  { value: "blue", label: "Blue", primary: "#3b82f6" },
];

function SettingsPage() {
  const { mode, colorScheme, setMode, setColorScheme } = useTheme();
  const { user, getAccessToken } = useAuth();
  const [section, setSection] = useState<SettingsSection>("appearance");

  const search = useRouterState({select:s=>s.location.searchStr});
  useEffect(()=>{const requested=new URLSearchParams(search).get("section");if(SECTIONS.some(item=>item.id===requested))setSection(requested as SettingsSection)},[search]);
  return <div className="settings-console">
    <header className="settings-command"><h1>Settings</h1><span>{SECTIONS.find(item => item.id === section)?.label}</span></header>
    <div className="settings-frame">
      <nav className="settings-rail" aria-label="Settings sections">{SECTIONS.map(item => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)} aria-current={section === item.id ? "page" : undefined}>{item.icon}<span>{item.label}</span></button>)}</nav>
      <main className="settings-panel">
        {section === "appearance" && <AppearanceSettings mode={mode} colorScheme={colorScheme} setMode={setMode} setColorScheme={setColorScheme}/>}
        {section === "workflow" && <WorkflowConfiguration workosUserId={user?.id}/>}
        {section === "ratings" && <RatingConfiguration workosUserId={user?.id}/>}
        {section === "data" && <DataExchange/>}
        {section === "trash" && <TrashView workosUserId={user?.id}/>}
        {section === "account" && <AccountSettings getAccessToken={getAccessToken}/>}
      </main>
    </div>
  </div>;
}

function AppearanceSettings({ mode, colorScheme, setMode, setColorScheme }: { mode: ThemeMode; colorScheme: ColorScheme; setMode: (mode: ThemeMode) => void; setColorScheme: (scheme: ColorScheme) => void }) {
  return <section className="appearance-settings">
    <div className="settings-section-heading"><div><h2>Appearance</h2><p>Choose how Waypoint looks on this device.</p></div></div>
    <div className="appearance-group"><span>Theme</span><div className="theme-choice-grid">{THEMES.map(theme => <button key={theme.value} onClick={() => setMode(theme.value)} className={cn(mode === theme.value && "active")}><ThemePreviewSwatch mode={theme.value}/><b>{theme.label}</b>{mode === theme.value && <Check size={13}/>}</button>)}</div></div>
    <div className="appearance-group"><span>Accent</span><div className="scheme-choice-grid">{COLOR_SCHEMES.map(scheme => <button key={scheme.value} onClick={() => setColorScheme(scheme.value)} className={cn(colorScheme === scheme.value && "active")} aria-pressed={colorScheme === scheme.value}><i style={{ backgroundColor: scheme.primary }}/><span>{scheme.label}</span>{colorScheme === scheme.value && <Check size={12}/>}</button>)}</div></div>
    <div className="appearance-preview"><div><span>Waypoint</span><b>Opportunity pipeline</b></div><i/><i/><i/></div>
  </section>;
}

function AccountSettings({ getAccessToken }: { getAccessToken: () => Promise<string> }) {
  const { colorScheme } = useTheme();
  const accentColor = colorScheme === "mono" ? "gray" : colorScheme === "warm" ? "orange" : colorScheme;

  return <section className="account-settings">
    <div className="settings-section-heading"><div><h2>Profile &amp; security</h2><p>Manage your identity, active sessions, and sign-in protection.</p></div></div>
    <WorkOsWidgets
      className="account-widgets"
      theme={{ appearance: "inherit", accentColor, radius: "medium", scaling: "90%", fontFamily: "Geist, sans-serif" }}
    >
      <div className="account-widget-stack">
        <UserProfile authToken={getAccessToken}/>
        <UserSessions authToken={getAccessToken}/>
        <UserSecurity authToken={getAccessToken}/>
      </div>
    </WorkOsWidgets>
  </section>;
}

function WorkflowConfiguration({ workosUserId }: { workosUserId?: string }) {
  const types = useQuery(api.opportunities.listTypes, workosUserId ? { workosUserId } : "skip");
  const statuses = useQuery(api.applications.listStatuses, workosUserId ? { workosUserId } : "skip");
  const createType = useMutation(api.opportunities.createType);
  const createStatus = useMutation(api.applications.createStatus);
  const updateType = useMutation(api.opportunities.updateType); const removeType = useMutation(api.opportunities.removeType);
  const updateStatus = useMutation(api.applications.updateStatus); const removeStatus = useMutation(api.applications.removeStatus);
  const [typeName, setTypeName] = useState("");
  const [statusName, setStatusName] = useState("");
  if (!workosUserId) return null;
  return <section className="settings-workflows"><div className="settings-section-heading"><div><h2>Workflow</h2><p>Configure custom types and stages. Built-in values remain protected.</p></div></div><div className="workflow-settings-grid"><ConfigCard icon={<Shapes size={14}/>} title="Opportunity types" hint="Choose a label, colour and icon" values={types ?? []} value={typeName} placeholder="e.g. Spring week" onChange={setTypeName} onSubmit={() => { const name = typeName.trim(); if (!name) return; void createType({ workosUserId, name, icon: "BriefcaseBusiness", color: "#A3B18A" }).then(() => setTypeName("")); }} onUpdate={(item,patch)=>void updateType({workosUserId,typeId:item._id,...patch})} onRemove={item=>void removeType({workosUserId,typeId:item._id})} hasIcons/><ConfigCard icon={<Workflow size={14}/>} title="Application stages" hint="Shape the board around your process" values={statuses ?? []} value={statusName} placeholder="e.g. Phone screen" onChange={setStatusName} onSubmit={() => { const name = statusName.trim(); if (!name) return; void createStatus({ workosUserId, name, color: "#A3B18A" }).then(() => setStatusName("")); }} onUpdate={(item,patch)=>void updateStatus({workosUserId,statusId:item._id,...patch})} onRemove={item=>void removeStatus({workosUserId,statusId:item._id})}/></div></section>;
}

function ConfigCard({ icon, title, hint, values, value, placeholder, onChange, onSubmit, onUpdate, onRemove, hasIcons=false }: { icon: ReactNode; title: string; hint: string; values: any[]; value: string; placeholder: string; onChange: (value: string) => void; onSubmit: () => void; onUpdate:(item:any,patch:any)=>void;onRemove:(item:any)=>void;hasIcons?:boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const sorted = [...values].sort((a, b) => a.order - b.order);
  const move = (index: number, direction: -1 | 1) => {
    const item = sorted[index];
    const target = sorted[index + direction];
    if (!item || !target) return;
    onUpdate(item, { order: target.order });
    onUpdate(target, { order: item.order });
  };

  return <div className="config-card workflow-config-card">
    <header><span>{icon}</span><div><strong>{title}</strong><small>{hint}</small></div></header>
    <div className="workflow-value-list">
      {sorted.map((item, index) => <div key={item._id}>
        <input className="workflow-color" type="color" value={item.color} onChange={event => onUpdate(item, { color: event.target.value })}/>
        {editing === item._id
          ? <input className="workflow-name-input" value={draft} autoFocus onChange={event => setDraft(event.target.value)} onBlur={() => { if (draft.trim()) onUpdate(item, { name: draft.trim() }); setEditing(null); }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setEditing(null); }}/>
          : <strong>{item.name}</strong>}
        {hasIcons && <select value={item.icon} onChange={event => onUpdate(item, { icon: event.target.value })}><option>BriefcaseBusiness</option><option>GraduationCap</option><option>Building2</option><option>Lightbulb</option><option>FlaskConical</option></select>}
        <span className="workflow-row-actions">
          <button disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move up"><ArrowUp size={11}/></button>
          <button disabled={index === sorted.length - 1} onClick={() => move(index, 1)} aria-label="Move down"><ArrowDown size={11}/></button>
          <button onClick={() => { setEditing(item._id); setDraft(item.name); }} aria-label="Edit"><Pencil size={11}/></button>
          <button onClick={() => onRemove(item)} aria-label="Delete"><Trash2 size={11}/></button>
        </span>
      </div>)}
      {values.length === 0 && <em>No custom values yet</em>}
    </div>
    <form onSubmit={event => { event.preventDefault(); onSubmit(); }}><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/><button aria-label={`Add ${title.toLowerCase()}`}><Plus size={14}/></button></form>
  </div>;
}

function ThemePreviewSwatch({ mode }: { mode: ThemeMode }) {
  return <span className={`theme-swatch theme-${mode}`}><i/><i/><i/></span>;
}
