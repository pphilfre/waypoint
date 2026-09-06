import { useMutation, useQuery } from "convex/react";
import { Scale } from "lucide-react";
import { api } from "../../../convex/_generated/api";

export function EntityRatingEditor({ workosUserId, entityType, entityId, overallScore }: { workosUserId: string; entityType: "company" | "opportunity"; entityId: string; overallScore?: number }) {
  const criteria = useQuery(api.ratings.listCriteria, { workosUserId });
  const values = useQuery(api.ratings.listValues, { workosUserId, entityType, entityId });
  const setValue = useMutation(api.ratings.setValue).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.ratings.listValues, { workosUserId: args.workosUserId, entityType: args.entityType, entityId: args.entityId });
    if (!current) return;
    const match = current.find(item => item.criterionId === args.criterionId);
    store.setQuery(api.ratings.listValues, { workosUserId: args.workosUserId, entityType: args.entityType, entityId: args.entityId }, match ? current.map(item => item.criterionId === args.criterionId ? { ...item, score: args.score } : item) : current);
  });
  const relevant = (criteria ?? []).filter(item => item.entityType === entityType).sort((a, b) => a.order - b.order);
  return <section className="sheet-section entity-rating-editor">
    <header><h2><Scale size={14}/> Ratings</h2>{relevant.length > 0 && <span className="rating-overall">{overallScore ?? 0}/100</span>}</header>
    {relevant.length ? <div className="company-ratings">{relevant.map(criterion => {
      const value = values?.find(item => item.criterionId === criterion._id)?.score ?? 0;
      return <label key={criterion._id}><span><strong>{criterion.name}</strong><small>{criterion.weight}% weight · max {criterion.maxScore}</small></span><div><input type="range" min="0" max={criterion.maxScore} value={value} onChange={event => void setValue({ workosUserId, criterionId: criterion._id, entityType, entityId, score: Number(event.target.value) })}/><output>{value}</output></div></label>;
    })}</div> : <div className="sheet-inline-empty">Create {entityType} criteria in Settings to build this scorecard.</div>}
  </section>;
}
