import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const entityType = v.union(v.literal("company"), v.literal("opportunity"));

export const listCriteria = query({ args: { workosUserId: v.string() }, handler: (ctx, args) =>
  ctx.db.query("ratingCriteria").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect()
});

export const listValues = query({ args: { workosUserId: v.string(), entityType, entityId: v.string() }, handler: (ctx, args) =>
  ctx.db.query("ratingValues").withIndex("by_entity", q => q.eq("workosUserId", args.workosUserId).eq("entityType", args.entityType).eq("entityId", args.entityId)).collect()
});
export const listAllValues = query({ args: { workosUserId: v.string() }, handler: (ctx, args) =>
  ctx.db.query("ratingValues").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect()
});

export const createCriterion = mutation({ args: { workosUserId: v.string(), name: v.string(), description: v.optional(v.string()), entityType, maxScore: v.number(), weight: v.number() }, handler: async (ctx, args) => {
  const rows = await ctx.db.query("ratingCriteria").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect();
  return ctx.db.insert("ratingCriteria", { ...args, name: args.name.trim(), maxScore: Math.max(1, args.maxScore), weight: Math.max(0, args.weight), order: rows.length });
}});

export const removeCriterion = mutation({ args: { workosUserId: v.string(), criterionId: v.id("ratingCriteria") }, handler: async (ctx, args) => {
  const row = await ctx.db.get(args.criterionId);
  if (!row || row.workosUserId !== args.workosUserId) throw new Error("Rating criterion not found");
  const values = await ctx.db.query("ratingValues").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect();
  await Promise.all(values.filter(value => value.criterionId === args.criterionId).map(value => ctx.db.delete(value._id)));
  await ctx.db.delete(args.criterionId);
}});

export const setValue = mutation({ args: { workosUserId: v.string(), criterionId: v.id("ratingCriteria"), entityType, entityId: v.string(), score: v.number() }, handler: async (ctx, args) => {
  const criterion = await ctx.db.get(args.criterionId);
  if (!criterion || criterion.workosUserId !== args.workosUserId || criterion.entityType !== args.entityType) throw new Error("Rating criterion not found");
  const entity = await ctx.db.get(args.entityId as any);
  if (!entity || entity.workosUserId !== args.workosUserId) throw new Error("Rated record not found");
  const existing = await ctx.db.query("ratingValues").withIndex("by_entity", q => q.eq("workosUserId", args.workosUserId).eq("entityType", args.entityType).eq("entityId", args.entityId)).collect();
  const match = existing.find(value => value.criterionId === args.criterionId);
  const score = Math.max(0, Math.min(criterion.maxScore, args.score));
  if (match) await ctx.db.patch(match._id, { score, updatedAt: Date.now() });
  else await ctx.db.insert("ratingValues", { workosUserId: args.workosUserId, criterionId: args.criterionId, entityType: args.entityType, entityId: args.entityId, score, updatedAt: Date.now() });
  const criteria = await ctx.db.query("ratingCriteria").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect();
  const nextValues = new Map(existing.map(value => [String(value.criterionId), value.score])); nextValues.set(String(args.criterionId), score);
  const relevant = criteria.filter(item => item.entityType === args.entityType && nextValues.has(String(item._id)));
  const weights = relevant.reduce((sum, item) => sum + item.weight, 0);
  const overall = weights ? Math.round(relevant.reduce((sum, item) => sum + ((nextValues.get(String(item._id)) ?? 0) / item.maxScore) * item.weight, 0) / weights * 100) : undefined;
  if (args.entityType === "company" && overall !== undefined) await ctx.db.patch(args.entityId as any, { overallScore: overall, updatedAt: Date.now() });
  if (args.entityType === "opportunity" && overall !== undefined) await ctx.db.patch(args.entityId as any, { overallScore: overall, updatedAt: Date.now() });
  return overall;
}});
