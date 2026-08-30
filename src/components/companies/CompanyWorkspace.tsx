import * as Dialog from "@radix-ui/react-dialog";
import { useAuth } from "@workos-inc/authkit-react";
import {
  getFilteredRowModel,
  getSortedRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { flexRender, type SortingState } from "@tanstack/react-table";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Briefcase,
  Check,
  ChevronRight,
  ExternalLink,
  ImagePlus,
  Link2,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  Users,
  Scale,
  Bookmark,
  Columns3,
  Download,
  GripVertical,
  ChevronLeft,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Company = Doc<"companies"> & { logoUrl: string | null };
type CompanyPatch = {
  name?: string;
  websiteUrl?: string;
  notes?: string;
  overallScore?: number | null;
  customFields?: Record<string, unknown>;
};

const CORE_COLUMN_LABELS: Record<string, string> = {
  name: "Company",
  opportunities: "Opportunities",
  contacts: "Contacts",
  overallScore: "Score",
  updatedAt: "Updated",
};
const CORE_COLUMN_ORDER = Object.keys(CORE_COLUMN_LABELS);

export function CompanyWorkspace() {
  const { user } = useAuth();
  const workosUserId = user?.id;
  const companies = useQuery(
    api.companies.list,
    workosUserId ? { workosUserId } : "skip",
  );
  const opportunities = useQuery(
    api.opportunities.list,
    workosUserId ? { workosUserId } : "skip",
  );
  const contacts = useQuery(api.contacts.list, workosUserId ? { workosUserId } : "skip");
  const ratingCriteria = useQuery(api.ratings.listCriteria, workosUserId ? { workosUserId } : "skip");
  const savedViews = useQuery(api.savedViews.list, workosUserId ? { workosUserId, entityType: "companies" } : "skip");
  const createCompany = useMutation(api.companies.create);
  const updateCompany = useMutation(api.companies.update);
  const fetchFavicon = useAction(api.favicon.fetchForCompany);
  const trashCompanies = useMutation(api.companies.trash);
  const saveView = useMutation(api.savedViews.save);
  const removeView = useMutation(api.savedViews.remove);
  const renameCustomField = useMutation(api.companies.renameCustomField);
  const [selectedId, setSelectedId] = useState<Id<"companies"> | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Record<string, CompanyPatch>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [viewPanel, setViewPanel] = useState<"filters" | "columns" | "views" | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState(["name","opportunities","contacts","overallScore","updatedAt"]);
  const [columnOrder, setColumnOrder] = useState(CORE_COLUMN_ORDER);

  const customFieldKeys = useMemo(() => [...new Set((companies ?? []).flatMap(company => Object.keys((company.customFields as Record<string, unknown> | undefined) ?? {})))].sort(), [companies]);
  const customFieldSignature = customFieldKeys.join("\u0000");
  useEffect(() => {
    setVisibleColumns(current => {
      const missing = customFieldKeys.map(key => `custom:${key}`).filter(id => !current.includes(id));
      return missing.length ? [...current, ...missing] : current;
    });
  }, [customFieldSignature]);
  useEffect(() => {
    const allowed = new Set([...CORE_COLUMN_ORDER, ...customFieldKeys.map(key => `custom:${key}`)]);
    setColumnOrder(current => {
      const retained = current.filter(id => allowed.has(id));
      const missing = [...allowed].filter(id => !retained.includes(id));
      return missing.length || retained.length !== current.length ? [...retained, ...missing] : current;
    });
  }, [customFieldSignature]);

  const relationshipCounts = useMemo(() => {
    const opportunity = new Map<string, number>();
    const contact = new Map<string, number>();
    for (const item of opportunities ?? []) opportunity.set(item.companyId, (opportunity.get(item.companyId) ?? 0) + 1);
    for (const item of contacts ?? []) contact.set(item.companyId, (contact.get(item.companyId) ?? 0) + 1);
    return { opportunity, contact };
  }, [contacts, opportunities]);

  const data = useMemo(
    () =>
      (companies ?? []).map((company) => {
        const patch = pending[company._id];
        return {
          ...company,
          ...patch,
          overallScore:
            patch?.overallScore === null
              ? undefined
              : patch?.overallScore ?? company.overallScore,
        };
      }),
    [companies, pending],
  );
  const filteredData = useMemo(() => data.filter(company => {
    if ((company.overallScore ?? 0) < minScore) return false;
    const opportunityCount=relationshipCounts.opportunity.get(company._id) ?? 0;
    const contactCount=relationshipCounts.contact.get(company._id) ?? 0;
    return relationshipFilter==="opportunities"?opportunityCount>0:relationshipFilter==="contacts"?contactCount>0:relationshipFilter==="unlinked"?opportunityCount===0&&contactCount===0:true;
  }),[data,minScore,relationshipFilter,relationshipCounts]);
  const deferredSearch = useDeferredValue(search);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2800);
  }, []);

  const update = useCallback(
    async (companyId: Id<"companies">, patch: CompanyPatch) => {
      if (!workosUserId) return;
      setPending((current) => ({
        ...current,
        [companyId]: { ...current[companyId], ...patch },
      }));
      try {
        const result = await updateCompany({ workosUserId, companyId, ...patch });
        setPending((current) => {
          const next = { ...current };
          delete next[companyId];
          return next;
        });
        if (result.websiteChanged) {
          const company = data.find((item) => item._id === companyId);
          const websiteUrl = patch.websiteUrl ?? company?.websiteUrl;
          if (websiteUrl) {
            void fetchFavicon({ companyId, websiteUrl, workosUserId }).then(
              (faviconResult) => {
                if (!faviconResult.ok) {
                  showNotice("No favicon found — upload a logo in company details");
                }
              },
              () => showNotice("Favicon unavailable — you can upload a logo"),
            );
          }
        }
      } catch (error) {
        setPending((current) => {
          const next = { ...current };
          delete next[companyId];
          return next;
        });
        showNotice(error instanceof Error ? error.message : "Could not save changes");
      }
    },
    [data, fetchFavicon, showNotice, updateCompany, workosUserId],
  );

  const create = useCallback(
    async (values: { name: string; websiteUrl: string }) => {
      if (!workosUserId) return;
      const companyId = await createCompany({ workosUserId, ...values });
      setAddOpen(false);
      setSelectedId(companyId);
      showNotice("Company added");
      void fetchFavicon({
        companyId,
        websiteUrl: normalizeClientUrl(values.websiteUrl),
        workosUserId,
      }).then((faviconResult) => {
        if (!faviconResult.ok) {
          showNotice("No favicon found — upload a logo in company details");
        }
      }, () => showNotice("Favicon unavailable — you can upload a logo"));
    },
    [createCompany, fetchFavicon, showNotice, workosUserId],
  );

  const selectedCompany = data.find((company) => company._id === selectedId) ?? null;
  const exportSelected = () => { const rows=data.filter(item=>checkedIds.has(item._id)); const csv=["id,name,websiteUrl,overallScore",...rows.map(item=>[item._id,item.name,item.websiteUrl,item.overallScore??""].map(value=>`"${String(value).replaceAll('"','""')}"`).join(","))].join("\n"); const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); const anchor=document.createElement("a");anchor.href=url;anchor.download="waypoint-companies-selected.csv";anchor.click();URL.revokeObjectURL(url); };
  const storeView = async () => { if(!workosUserId)return; const name=window.prompt("Name this view"); if(!name)return; await saveView({workosUserId,entityType:"companies",name,filters:{search,minScore,relationshipFilter},sorting,visibleColumns,columnOrder}); showNotice("View saved"); };
  const moveColumn = useCallback((sourceId: string, targetId: string) => setColumnOrder(current => {
    const sourceIndex = current.indexOf(sourceId); const targetIndex = current.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current;
    const next = [...current]; const [moved] = next.splice(sourceIndex, 1); next.splice(targetIndex, 0, moved); return next;
  }), []);
  const renameColumn = useCallback(async (currentName: string, nextName: string) => {
    if (!workosUserId) return;
    try {
      await renameCustomField({ workosUserId, currentName, nextName });
      const currentId = `custom:${currentName}`; const nextId = `custom:${nextName}`;
      setVisibleColumns(current => current.map(id => id === currentId ? nextId : id));
      setColumnOrder(current => current.map(id => id === currentId ? nextId : id));
      showNotice(`Column renamed to ${nextName}`);
    } catch (error) { showNotice(error instanceof Error ? error.message : "Could not rename column"); throw error; }
  }, [renameCustomField, showNotice, workosUserId]);

  return (
    <div className="company-workspace">
      <section className="workspace-heading">
        <div>
          <h1>Companies</h1>
        </div>
        <Button onClick={() => setAddOpen(true)} className="add-company-button">
          <Plus size={15} strokeWidth={2.3} /> Add company
        </Button>
      </section>

      <section className="records-shell">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search companies…"
              aria-label="Search companies"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <X size={13} />
              </button>
            )}
          </label>
          <div className="toolbar-meta">
            <span>{checkedIds.size > 0 ? `${checkedIds.size} selected` : `${filteredData.length} ${filteredData.length === 1 ? "company" : "companies"}`}</span>
            <button className={cn("tool-button",viewPanel==="filters"&&"active")} onClick={()=>setViewPanel(viewPanel==="filters"?null:"filters")}><SlidersHorizontal size={14} /> Filter{(minScore>0||relationshipFilter!=="all")&&<i className="filter-count">{(minScore>0?1:0)+(relationshipFilter!=="all"?1:0)}</i>}</button>
            <button className={cn("tool-button",viewPanel==="views"&&"active")} onClick={()=>setViewPanel(viewPanel==="views"?null:"views")}><Bookmark size={14}/> Views</button>
            <button className={cn("tool-button",viewPanel==="columns"&&"active")} onClick={()=>setViewPanel(viewPanel==="columns"?null:"columns")}><Columns3 size={14}/> Columns</button>
          </div>
        </div>
        {viewPanel&&<div className="table-config-panel">
          {viewPanel==="filters"&&<><header><strong>Filter companies</strong><button onClick={()=>{setMinScore(0);setRelationshipFilter("all")}}>Clear all</button></header><div className="filter-grid"><label><span>Minimum score <b>{minScore}</b></span><input type="range" min="0" max="100" step="5" value={minScore} onChange={event=>setMinScore(Number(event.target.value))}/></label><label><span>Relationships</span><select value={relationshipFilter} onChange={event=>setRelationshipFilter(event.target.value)}><option value="all">Any</option><option value="opportunities">Has opportunities</option><option value="contacts">Has contacts</option><option value="unlinked">No linked records</option></select></label></div></>}
          {viewPanel==="columns"&&<><header><strong>Columns</strong><span>{visibleColumns.length} shown · drag to reorder</span></header><ColumnManager order={columnOrder} visibleColumns={visibleColumns} customFieldKeys={customFieldKeys} onVisibilityChange={setVisibleColumns} onMove={moveColumn} onRename={renameColumn}/></>}
          {viewPanel==="views"&&<><header><strong>Saved views</strong><button onClick={()=>void storeView()}>+ Save current</button></header><div className="saved-view-list">{savedViews?.map((view:any)=><div key={view._id}><button onClick={()=>{setSearch(view.filters?.search??"");setMinScore(view.filters?.minScore??0);setRelationshipFilter(view.filters?.relationshipFilter??"all");setSorting(view.sorting??[]);setVisibleColumns(view.visibleColumns??visibleColumns);setColumnOrder(view.columnOrder??columnOrder);setViewPanel(null)}}><Bookmark size={13}/><span>{view.name}</span></button><button aria-label={`Delete ${view.name}`} onClick={()=>workosUserId&&void removeView({workosUserId,viewId:view._id})}><X size={12}/></button></div>)}{savedViews?.length===0&&<p>Save a filter, sort, and column layout for instant reuse.</p>}</div></>}
        </div>}
        {checkedIds.size>0&&<div className="bulk-toolbar"><span><Check size={13}/>{checkedIds.size} selected</span><button onClick={exportSelected}><Download size={13}/> Export CSV</button><button className="danger" onClick={()=>{if(!workosUserId)return;void trashCompanies({workosUserId,companyIds:[...checkedIds] as Id<"companies">[]}).then(()=>{setCheckedIds(new Set());showNotice("Companies moved to trash")})}}><Trash2 size={13}/> Move to trash</button><button onClick={()=>setCheckedIds(new Set())}><X size={13}/></button></div>}

        {companies === undefined ? (
          <CompanyTableSkeleton />
        ) : data.length === 0 ? (
          <CompanyEmptyState onAdd={() => setAddOpen(true)} />
        ) : (
          <CompanyTable
            data={filteredData}
            search={deferredSearch}
            sorting={sorting}
            onSortingChange={setSorting}
            onOpen={setSelectedId}
            onUpdate={update}
            checkedIds={checkedIds}
            onCheckedIdsChange={setCheckedIds}
            visibleColumns={visibleColumns}
            customFieldKeys={customFieldKeys}
            relationshipCounts={relationshipCounts}
            columnOrder={columnOrder}
          />
        )}
      </section>

      <AddCompanyDialog open={addOpen} onOpenChange={setAddOpen} onCreate={create} />
      <CompanySheet
        company={selectedCompany}
        opportunities={(opportunities ?? []).filter((item) => item.companyId === selectedCompany?._id)}
        contacts={(contacts ?? []).filter((item) => item.companyId === selectedCompany?._id)}
        criteria={(ratingCriteria ?? []).filter((item) => item.entityType === "company")}
        open={selectedCompany !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onUpdate={update}
        workosUserId={workosUserId}
        onNotice={showNotice}
      />
      <div className={cn("save-notice", notice && "is-visible")} role="status" aria-live="polite">
        <Check size={14} /> {notice}
      </div>
    </div>
  );
}

function CompanyTable({
  data,
  search,
  sorting,
  onSortingChange,
  onOpen,
  onUpdate,
  checkedIds,
  onCheckedIdsChange,
  visibleColumns,
  customFieldKeys,
  relationshipCounts,
  columnOrder,
}: {
  data: Company[];
  search: string;
  sorting: SortingState;
  onSortingChange: Dispatch<SetStateAction<SortingState>>;
  onOpen: (id: Id<"companies">) => void;
  onUpdate: (id: Id<"companies">, patch: CompanyPatch) => Promise<void>;
  checkedIds: Set<string>;
  onCheckedIdsChange: Dispatch<SetStateAction<Set<string>>>;
  visibleColumns: string[];
  customFieldKeys: string[];
  relationshipCounts: { opportunity: Map<string, number>; contact: Map<string, number> };
  columnOrder: string[];
}) {
  const columns = useMemo<LegacyColumnDef<Company>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <input
            className="row-checkbox"
            type="checkbox"
            aria-label="Select all companies"
            checked={data.length > 0 && data.every((company) => checkedIds.has(company._id))}
            onChange={(event) =>
              onCheckedIdsChange(
                event.target.checked
                  ? new Set(data.map((company) => company._id))
                  : new Set(),
              )
            }
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className="row-checkbox"
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            checked={checkedIds.has(row.original._id)}
            onChange={(event) => {
              const id = row.original._id;
              onCheckedIdsChange((current) => {
                const next = new Set(current);
                if (event.target.checked) next.add(id);
                else next.delete(id);
                return next;
              });
            }}
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Company",
        cell: ({ row }) => (
          <div className="company-cell">
            <CompanyAvatar company={row.original} />
            <div className="company-name-stack">
              <InlineValue
                value={row.original.name}
                ariaLabel="Edit company name"
                onSave={(name) => onUpdate(row.original._id, { name })}
              />
              <span>{hostname(row.original.websiteUrl)}</span>
            </div>
          </div>
        ),
      },
      {
        id: "opportunities",
        header: "Opportunities",
        enableSorting: false,
        cell: ({row}) => <span className="contact-count"><Briefcase size={14}/>{relationshipCounts.opportunity.get(row.original._id) ?? 0}</span>,
      },
      {
        id: "contacts",
        header: "Contacts",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="contact-count"><Users size={14} /> {relationshipCounts.contact.get(row.original._id) ?? 0}</span>
        ),
      },
      {
        accessorKey: "overallScore",
        header: "Score",
        cell: ({ row }) => (
          <InlineScore
            value={row.original.overallScore}
            onSave={(overallScore) => onUpdate(row.original._id, { overallScore })}
          />
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => <span className="updated-label">{relativeDate(row.original.updatedAt)}</span>,
      },
      ...customFieldKeys.map((key): LegacyColumnDef<Company> => ({
        id: `custom:${key}`,
        accessorFn: company => (company.customFields as Record<string, unknown> | undefined)?.[key],
        header: key,
        cell: ({ row }) => {
          const fields = (row.original.customFields as Record<string, unknown> | undefined) ?? {};
          const value = fields[key];
          if (/score$/i.test(key) && typeof value === "number") {
            return <InlineScore value={value} onSave={next => next !== null && onUpdate(row.original._id, { customFields: { ...fields, [key]: next } })}/>;
          }
          return <InlineCustomValue label={key} value={value} onSave={next => onUpdate(row.original._id, { customFields: { ...fields, [key]: next } })}/>;
        },
      })),
      {
        id: "open",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="row-open-button"
            onClick={() => onOpen(row.original._id)}
            aria-label={`Open ${row.original.name}`}
          >
            <ChevronRight size={16} />
          </button>
        ),
      },
    ],
    [checkedIds, customFieldKeys, data, onCheckedIdsChange, onOpen, onUpdate, relationshipCounts],
  );

  const table = useLegacyTable({
    data,
    columns,
    state: { sorting, globalFilter: search, columnOrder: ["select", ...columnOrder, "open"], columnVisibility: Object.fromEntries(["name","opportunities","contacts","overallScore","updatedAt",...customFieldKeys.map(key=>`custom:${key}`)].map(id=>[id,visibleColumns.includes(id)])) },
    onSortingChange,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const [visibleCount, setVisibleCount] = useState(30);
  const loadRef = useRef<HTMLDivElement>(null);
  useEffect(() => setVisibleCount(30), [data.length, search, sorting]);
  useEffect(() => {
    const target = loadRef.current;
    if (!target || visibleCount >= rows.length) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) setVisibleCount(current => Math.min(current + 30, rows.length));
    }, { rootMargin: "240px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [rows.length, visibleCount]);
  const visibleRows = rows.slice(0, visibleCount);
  const visibleLeafColumns = table.getVisibleLeafColumns();
  const visibleCustomCount = visibleLeafColumns.filter(column => column.id.startsWith("custom:")).length;

  return (
    <>
      <div className="desktop-company-table">
        <table>
          <colgroup>
            {visibleLeafColumns.map(column => <col key={column.id} style={{ width: columnWidth(column.id, visibleCustomCount) }}/>) }
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const content = flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  );
                  return (
                    <th key={header.id} className={header.column.id.startsWith("custom:") ? "custom-column" : undefined} title={header.column.id.startsWith("custom:") ? String(header.column.columnDef.header) : undefined}>
                      {header.isPlaceholder ? null : (
                        header.column.getCanSort() ? (
                          <button
                            className="table-heading-button"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {content}
                            {sorted === "asc" ? <ArrowUp size={12} /> :
                              sorted === "desc" ? <ArrowDown size={12} /> :
                                <ArrowUpDown size={11} className="sort-idle" />}
                          </button>
                        ) : (
                          <div className="table-heading-button">{content}</div>
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} onDoubleClick={() => onOpen(row.original._id)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={cell.column.id.startsWith("custom:") ? "custom-column" : undefined}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-company-list">
        {visibleRows.map(({ original: company }) => (
          <button key={company._id} className="mobile-company-card" onClick={() => onOpen(company._id)}>
            <CompanyAvatar company={company} />
            <span className="mobile-company-copy">
              <strong>{company.name}</strong>
              <span>{hostname(company.websiteUrl)}</span>
              <small>{relationshipCounts.opportunity.get(company._id) ?? 0} opportunities · {relationshipCounts.contact.get(company._id) ?? 0} contacts</small>
            </span>
            <span className="mobile-company-score">
              {company.overallScore ?? "—"}<ChevronRight size={15} />
            </span>
          </button>
        ))}
      </div>

      {visibleCount < rows.length && <div ref={loadRef} className="table-load-sentinel" role="status">Showing {visibleCount} of {rows.length} · more rows load as you scroll</div>}

      {rows.length === 0 && (
        <div className="no-results"><Search size={18} /><span>No companies match “{search}”</span></div>
      )}
    </>
  );
}

function ColumnManager({ order, visibleColumns, customFieldKeys, onVisibilityChange, onMove, onRename }: {
  order: string[];
  visibleColumns: string[];
  customFieldKeys: string[];
  onVisibilityChange: Dispatch<SetStateAction<string[]>>;
  onMove: (sourceId: string, targetId: string) => void;
  onRename: (currentName: string, nextName: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const touchDrag = useRef<string | null>(null);
  const customIds = new Set(customFieldKeys.map(key => `custom:${key}`));
  const labels = new Map([...Object.entries(CORE_COLUMN_LABELS), ...customFieldKeys.map(key => [`custom:${key}`, key] as const)]);

  const finishRename = async (id: string) => {
    const currentName = id.slice(7); const nextName = draft.trim();
    if (!nextName || nextName === currentName) { setEditingId(null); return; }
    try { await onRename(currentName, nextName); setEditingId(null); } catch { /* notice is shown by the workspace */ }
  };
  const moveOne = (id: string, direction: -1 | 1) => {
    const index = order.indexOf(id); const target = order[index + direction];
    if (target) onMove(id, target);
  };

  return <div className="column-options" role="list" aria-label="Table columns">
    {order.map(id => {
      const label = labels.get(id); if (!label) return null;
      const custom = customIds.has(id); const editing = editingId === id;
      return <div key={id} role="listitem" className={cn("column-option", draggingId === id && "is-dragging")} data-column-id={id} draggable={!editing}
        onDragStart={event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", id); setDraggingId(id); }}
        onDragOver={event => { event.preventDefault(); const source = event.dataTransfer.getData("text/plain") || draggingId; if (source && source !== id) onMove(source, id); }}
        onDragEnd={() => setDraggingId(null)}>
        <button className="column-grip" aria-label={`Drag ${label}`} title="Drag to reorder"
          onPointerDown={event => { if (event.pointerType === "mouse") return; event.preventDefault(); touchDrag.current = id; setDraggingId(id); event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={event => { if (!touchDrag.current) return; const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-column-id]")?.dataset.columnId; if (target && target !== touchDrag.current) onMove(touchDrag.current, target); }}
          onPointerUp={() => { touchDrag.current = null; setDraggingId(null); }}>
          <GripVertical size={13}/>
        </button>
        <input type="checkbox" checked={visibleColumns.includes(id)} onChange={event => onVisibilityChange(current => event.target.checked ? [...current, id] : current.filter(value => value !== id))} aria-label={`Show ${label}`}/>
        {editing ? <input className="column-name-input" value={draft} onChange={event => setDraft(event.target.value)} onBlur={() => void finishRename(id)} onKeyDown={event => { if (event.key === "Enter") void finishRename(id); if (event.key === "Escape") setEditingId(null); }} autoFocus aria-label={`Rename ${label}`}/> : <span title={label}>{label}</span>}
        {custom && !editing && <button className="column-edit" onClick={() => { setDraft(label); setEditingId(id); }} aria-label={`Rename ${label}`}><Pencil size={11}/></button>}
        {editing && <button className="column-edit" onMouseDown={event => event.preventDefault()} onClick={() => void finishRename(id)} aria-label="Save column name"><Check size={11}/></button>}
        <span className="column-mobile-move"><button onClick={() => moveOne(id, -1)} disabled={order[0] === id} aria-label={`Move ${label} left`}><ChevronLeft size={12}/></button><button onClick={() => moveOne(id, 1)} disabled={order.at(-1) === id} aria-label={`Move ${label} right`}><ChevronRight size={12}/></button></span>
      </div>;
    })}
  </div>;
}

function columnWidth(id: string, customCount: number): string | undefined {
  if (id === "select") return "38px";
  if (id === "name") return customCount ? "18%" : "34%";
  if (id === "opportunities") return "105px";
  if (id === "contacts") return "85px";
  if (id === "overallScore") return "72px";
  if (id === "updatedAt") return "90px";
  if (id === "open") return "36px";
  return undefined;
}

function InlineValue({ value, onSave, ariaLabel }: { value: string; onSave: (value: string) => void; ariaLabel: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) onSave(next);
    else setDraft(value);
  };

  if (!editing) {
    return (
      <button className="inline-value" onClick={() => { setDraft(value); setEditing(true); }} aria-label={ariaLabel}>
        {value}<Pencil size={11} />
      </button>
    );
  }

  return (
    <input
      className="inline-input"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      autoFocus
      aria-label={ariaLabel}
    />
  );
}

function InlineScore({ value, onSave }: { value?: number; onSave: (value: number | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? "");
  const save = () => {
    setEditing(false);
    const parsed = draft === "" ? null : Math.max(0, Math.min(100, Number(draft)));
    if (parsed === null || Number.isFinite(parsed)) onSave(parsed);
  };
  if (!editing) {
    return <button className={cn("score-chip", value === undefined && "is-empty")} style={value === undefined ? undefined : scoreColorStyle(value)} onClick={() => { setDraft(value?.toString() ?? ""); setEditing(true); }}>{value ?? "Add"}</button>;
  }
  return <input className="score-input" type="number" min="0" max="100" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} autoFocus aria-label="Company score" />;
}

function scoreColorStyle(value: number): CSSProperties {
  const normalized = Math.max(0, Math.min(100, value));
  const hue = Math.round(normalized <= 50 ? 4 + normalized * .88 : 48 + (normalized - 50) * 1.8);
  return { "--score-hue": hue } as CSSProperties;
}

function InlineCustomValue({ label, value, onSave }: { label: string; value: unknown; onSave: (value: string | number | boolean) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const save = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === String(value ?? "")) return;
    if (typeof value === "number" && trimmed !== "" && Number.isFinite(Number(trimmed))) onSave(Number(trimmed));
    else if (typeof value === "boolean" && /^(true|false)$/i.test(trimmed)) onSave(trimmed.toLowerCase() === "true");
    else onSave(trimmed);
  };
  if (!editing) return <button className="inline-value" onClick={() => { setDraft(String(value ?? "")); setEditing(true); }} aria-label={`Edit ${label}`}>{String(value ?? "—")}<Pencil size={11}/></button>;
  return <input className="inline-input" value={draft} onChange={event => setDraft(event.target.value)} onBlur={save} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setEditing(false); }} autoFocus aria-label={`Edit ${label}`}/>;
}

function CompanyAvatar({ company, large = false }: { company: Company; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("company-avatar", large && "is-large")}>
      {company.logoUrl && !failed ? (
        <img src={company.logoUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <span>{company.name.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}

function AddCompanyDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; onCreate: (values: { name: string; websiteUrl: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setError("Enter a company name"); return; }
    try {
      normalizeClientUrl(websiteUrl);
      setSaving(true);
      await onCreate({ name: name.trim(), websiteUrl });
      setName(""); setWebsiteUrl(""); setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add company");
    } finally { setSaving(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="add-dialog">
          <div className="dialog-kicker"><Building2 size={14} /> New record</div>
          <Dialog.Title>Add a company</Dialog.Title>
          <Dialog.Description>Start with the essentials. Waypoint will look for a favicon automatically.</Dialog.Description>
          <form onSubmit={submit}>
            <label>Company name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cisco" autoFocus /></label>
            <label>Website<input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="cisco.com" inputMode="url" /></label>
            {error && <p className="form-error">{error}</p>}
            <div className="dialog-actions">
              <Dialog.Close asChild><Button type="button" variant="ghost">Cancel</Button></Dialog.Close>
              <Button type="submit" disabled={saving}>{saving && <LoaderCircle className="spin" size={14} />}{saving ? "Adding…" : "Add company"}</Button>
            </div>
          </form>
          <Dialog.Close className="dialog-close" aria-label="Close"><X size={17} /></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CompanySheet({ company, opportunities, contacts, criteria, open, onOpenChange, onUpdate, workosUserId, onNotice }: {
  company: Company | null;
  opportunities: Array<Doc<"opportunities"> & { company: Doc<"companies"> | null }>;
  contacts: any[];
  criteria: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: Id<"companies">, patch: CompanyPatch) => Promise<void>;
  workosUserId?: string;
  onNotice: (message: string) => void;
}) {
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const setLogo = useMutation(api.companies.setLogo);
  const clearLogo = useMutation(api.companies.clearLogo);
  const ratingValues = useQuery(api.ratings.listValues, company && workosUserId ? { workosUserId, entityType: "company", entityId: company._id } : "skip");
  const setRatingValue = useMutation(api.ratings.setValue);
  const [uploading, setUploading] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!company) return null;

  const upload = async (file?: File) => {
    if (!file || !workosUserId) return;
    if (!file.type.startsWith("image/") || file.size > 2_000_000) {
      onNotice("Choose an image smaller than 2 MB"); return;
    }
    try {
      setUploading(true);
      const uploadUrl = await generateUploadUrl({ workosUserId });
      const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = await response.json() as { storageId: Id<"_storage"> };
      await setLogo({ workosUserId, companyId: company._id, storageId });
      onNotice("Logo updated");
    } catch { onNotice("Could not upload that logo"); }
    finally { setUploading(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="company-sheet" onOpenAutoFocus={(event) => event.preventDefault()}>
          <Dialog.Title className="sr-only">{company.name}</Dialog.Title>
          <Dialog.Description className="sr-only">Company details and editing</Dialog.Description>
          <div className="sheet-header">
            <CompanyAvatar company={company} large />
            <div className="sheet-identity">
              <InlineValue value={company.name} ariaLabel="Edit company name" onSave={(name) => void onUpdate(company._id, { name })} />
              <a href={company.websiteUrl} target="_blank" rel="noreferrer">{hostname(company.websiteUrl)} <ExternalLink size={11} /></a>
            </div>
            <Dialog.Close className="sheet-close" aria-label="Close company details"><X size={18} /></Dialog.Close>
          </div>

          <div className="sheet-score-strip">
            <div><span>Overall score</span><InlineScore value={company.overallScore} onSave={(overallScore) => void onUpdate(company._id, { overallScore })} /></div>
            <div><span>Opportunities</span><strong>{opportunities.length}</strong></div>
            <div><span>Contacts</span><strong>{contacts.length}</strong></div>
          </div>

          <div className="sheet-body">
            <SheetSection title="Company profile">
              <label className="sheet-field"><span>Website</span><div><Link2 size={14} /><input defaultValue={company.websiteUrl} onBlur={(e) => e.target.value !== company.websiteUrl && void onUpdate(company._id, { websiteUrl: e.target.value })} /></div></label>
              <div className="logo-control">
                <span>Logo</span>
                <div><Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? <LoaderCircle className="spin" size={13} /> : <Upload size={13} />} Upload image</Button>{company.logoStorageId && <Button size="sm" variant="ghost" onClick={() => workosUserId && void clearLogo({ workosUserId, companyId: company._id }).then(() => onNotice("Using website favicon"))}>Use favicon</Button>}</div>
                <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => void upload(e.target.files?.[0])} />
              </div>
            </SheetSection>

            <SheetSection title="Opportunities">
              {opportunities.length ? <div className="company-opportunity-list">{opportunities.map(item => <div key={item._id}><span><strong>{item.name}</strong><small>{item.type} · {item.locations[0]?.city || "Location unspecified"}</small></span><em>{item.isOpen ? item.status : "Closed"}</em></div>)}</div> : <div className="sheet-empty"><MoreHorizontal size={17} /><div><strong>No opportunities yet</strong><span>This company can still be tracked on its own.</span></div></div>}
            </SheetSection>

            <SheetSection title="Opportunity types">
              {opportunities.length ? <div className="company-type-cloud">{[...new Set(opportunities.map(item => item.type))].map(type => <span key={type}><i />{type}</span>)}</div> : <div className="sheet-inline-empty">No opportunity types recorded.</div>}
            </SheetSection>

            <SheetSection title="Contacts" action={contacts.length ? <span className="phase-tag">{contacts.length}</span> : undefined}>
              {contacts.length ? <div className="company-contact-list">{contacts.map(contact=><div key={contact._id}><span className="contact-mini-avatar">{contact.name.slice(0,1)}</span><span><strong>{contact.name}</strong><small>{contact.role||"Role not added"}</small></span>{contact.linkedinUrl&&<a href={contact.linkedinUrl} target="_blank" rel="noreferrer" aria-label={`Open ${contact.name} on LinkedIn`}><ExternalLink size={12}/></a>}</div>)}</div> : <div className="sheet-inline-empty">No contacts linked to this company.</div>}
            </SheetSection>

            <SheetSection title="Ratings" action={criteria.length ? <span className="rating-overall"><Scale size={11}/>{company.overallScore ?? "—"}/100</span> : undefined}>
              {criteria.length ? <div className="company-ratings">{criteria.sort((a,b)=>a.order-b.order).map(criterion=>{const value=ratingValues?.find(item=>item.criterionId===criterion._id)?.score;return <label key={criterion._id}><span><strong>{criterion.name}</strong><small>Weight {criterion.weight}%</small></span><div><input type="range" min="0" max={criterion.maxScore} defaultValue={value??0} onPointerUp={event=>workosUserId&&void setRatingValue({workosUserId,criterionId:criterion._id,entityType:"company",entityId:company._id,score:Number(event.currentTarget.value)})}/><output>{value??0}</output></div></label>})}</div> : <div className="sheet-inline-empty">Create company rating criteria in Settings to start a weighted scorecard.</div>}
            </SheetSection>

            <SheetSection title="Notes">
              <textarea
                key={`${company._id}-${company.notes ?? ""}`}
                defaultValue={company.notes ?? ""}
                onFocus={(e) => setNotesDraft(e.target.value)}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={() => notesDraft !== (company.notes ?? "") && void onUpdate(company._id, { notes: notesDraft })}
                placeholder="Add context, research, or things worth remembering…"
              />
            </SheetSection>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SheetSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="sheet-section"><header><h2>{title}</h2>{action}</header>{children}</section>;
}

function CompanyEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="company-empty">
      <div className="empty-mark"><Building2 size={22} /><span><ImagePlus size={12} /></span></div>
      <h2>No companies yet</h2>
      <p>Add the first company on your shortlist. It does not need an active opportunity.</p>
      <Button onClick={onAdd}><Plus size={14} /> Add your first company</Button>
    </div>
  );
}

function CompanyTableSkeleton() {
  return <div className="table-skeleton">{Array.from({ length: 6 }).map((_, index) => <div key={index}><i /><span /><b /><em /></div>)}</div>;
}

function hostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function normalizeClientUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a website");
  const value = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(value);
  if (!url.hostname.includes(".")) throw new Error("Enter a valid website");
  return url.toString().replace(/\/$/, "");
}

function relativeDate(timestamp: number) {
  const days = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(timestamp);
}
