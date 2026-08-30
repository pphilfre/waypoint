import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

async function owned(ctx: any, id: Id<"savedViews">, user: string) {
  const view = await ctx.db.get(id);
  if (!view || view.workosUserId !== user) throw new Error("Saved view not found");
  return view;
}

export const list = query({
  args: { workosUserId: v.string(), entityType: v.union(v.literal("companies"), v.literal("opportunities")) },
  handler: (ctx, args) => ctx.db.query("savedViews").withIndex("by_user_entity", q => q.eq("workosUserId", args.workosUserId).eq("entityType", args.entityType)).collect(),
});

export const save = mutation({
  args: { workosUserId: v.string(), entityType: v.union(v.literal("companies"), v.literal("opportunities")), name: v.string(), filters: v.any(), sorting: v.any(), visibleColumns: v.array(v.string()), columnOrder: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    if (!args.name.trim()) throw new Error("View name is required");
    const now = Date.now();
    return ctx.db.insert("savedViews", { ...args, name: args.name.trim(), createdAt: now, updatedAt: now });
  },
});

export const remove = mutation({
  args: { workosUserId: v.string(), viewId: v.id("savedViews") },
  handler: async (ctx, args) => { await owned(ctx, args.viewId, args.workosUserId); await ctx.db.delete(args.viewId); },
});
