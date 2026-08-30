import { useMutation, useQuery } from "convex/react";
import { RotateCcw, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

type TrashEntity = "company" | "opportunity" | "application" | "contact";

export function TrashView({ workosUserId }: { workosUserId?: string }) {
  const items = useQuery(api.trash.list, workosUserId ? { workosUserId } : "skip");
  const restore = useMutation(api.trash.restore);
  const permanentlyRemove = useMutation(api.trash.permanentlyRemove);
  const empty = useMutation(api.trash.empty);
  if (!workosUserId) return null;
  const remove = (entityType: TrashEntity, id: string, name: string) => {
    if (window.confirm(`Permanently delete “${name}”? This cannot be undone.`)) void permanentlyRemove({ workosUserId, entityType, id });
  };
  return <section className="trash-settings" aria-labelledby="trash-heading">
    <div className="settings-section-heading trash-heading"><div><h2 id="trash-heading">Trash</h2><p>Deleted items are permanently removed after 7 days.</p></div>{!!items?.length && <Button variant="outline" onClick={() => window.confirm("Permanently delete every item in Trash?") && void empty({ workosUserId })}><Trash2 size={13}/> Empty trash</Button>}</div>
    <div className="trash-list">{items === undefined ? <div className="trash-loading" aria-label="Loading trash"><i/><i/><i/></div> : items.length === 0 ? <div className="trash-empty"><Trash2 size={18}/><strong>Trash is empty</strong><span>Deleted records remain recoverable here for seven days.</span></div> : items.map(item => <article key={`${item.entityType}-${item.id}`}><span className="trash-kind">{item.entityType}</span><div><strong>{item.name}</strong><small>{item.detail} · {daysRemaining(item.deletedAt)}</small></div><button onClick={() => void restore({ workosUserId, entityType: item.entityType, id: item.id })} aria-label={`Restore ${item.name}`}><RotateCcw size={13}/> Restore</button><button className="danger" onClick={() => remove(item.entityType, item.id, item.name)} aria-label={`Permanently delete ${item.name}`}><Trash2 size={13}/></button></article>)}</div>
  </section>;
}

function daysRemaining(deletedAt: number) {
  const days = Math.max(0, Math.ceil((deletedAt + 7 * 86_400_000 - Date.now()) / 86_400_000));
  return days === 0 ? "deletes today" : `${days} day${days === 1 ? "" : "s"} remaining`;
}
