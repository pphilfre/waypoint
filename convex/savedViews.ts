import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./auth";

const entityType = v.union(v.literal("companies"), v.literal("opportunities"), v.literal("applications"), v.literal("contacts"));
export const list = query({ args: { workosUserId: v.string(), entityType }, handler: async (ctx, args) => { await requireUserId(ctx, args.workosUserId); return ctx.db.query("savedViews").withIndex("by_user_entity", q => q.eq("workosUserId", args.workosUserId).eq("entityType", args.entityType)).collect(); } });
export const save = mutation({ args: { workosUserId: v.string(), entityType, name: v.string(), filters: v.any(), sorting: v.any(), visibleColumns: v.array(v.string()), columnOrder: v.optional(v.array(v.string())) }, handler: async (ctx, args) => { await requireUserId(ctx, args.workosUserId); const name = args.name.trim(); if (!name) throw new Error("View name is required"); const now = Date.now(); return ctx.db.insert("savedViews", { ...args, name, createdAt: now, updatedAt: now }); } });
export const remove = mutation({ args: { workosUserId: v.string(), viewId: v.id("savedViews") }, handler: async (ctx, args) => { await requireUserId(ctx, args.workosUserId); const view = await ctx.db.get(args.viewId); if (!view || view.workosUserId !== args.workosUserId) throw new Error("Saved view not found"); await ctx.db.delete(args.viewId); } });
