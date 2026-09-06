import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./auth";

const applicationDeadline = v.object({ name: v.string(), date: v.number() });
const applicationLink = v.object({ name: v.string(), url: v.string() });
const checklistItem = v.object({ label: v.string(), done: v.boolean() });
const documentRef = v.object({ name: v.string(), url: v.optional(v.string()) });

async function own(ctx: any, id: Id<"applications">, user: string) {
  const row = await ctx.db.get(id);
  if (!row || row.workosUserId !== user) throw new Error("Application not found");
  return row;
}

export const list = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    await requireUserId(ctx, args.workosUserId);
    const rows = await ctx.db.query("applications").withIndex("by_user_trashed", q => q.eq("workosUserId", args.workosUserId).eq("trashed", false)).collect();
    return Promise.all(rows.map(async application => ({ ...application, company: await ctx.db.get(application.companyId), opportunity: application.opportunityId ? await ctx.db.get(application.opportunityId) : null })));
  },
});

export const create = mutation({
  args: { workosUserId: v.string(), companyId: v.id("companies"), opportunityId: v.optional(v.id("opportunities")), status: v.string(), notes: v.optional(v.string()), deadlines: v.optional(v.array(applicationDeadline)), links: v.optional(v.array(applicationLink)), nextAction: v.optional(v.string()), nextActionDue: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireUserId(ctx, args.workosUserId);
    const company = await ctx.db.get(args.companyId);
    if (!company || company.workosUserId !== args.workosUserId || company.trashed) throw new Error("Company not found");
    if (args.opportunityId) {
      const opportunity = await ctx.db.get(args.opportunityId);
      if (!opportunity || opportunity.workosUserId !== args.workosUserId || opportunity.companyId !== args.companyId || opportunity.trashed) throw new Error("Opportunity does not belong to this company");
    }
    const now = Date.now();
    return ctx.db.insert("applications", { ...args, deadlines: args.deadlines ?? [], links: args.links ?? [], checklist: [], documentRefs: [], stageHistory: [{ status: args.status, changedAt: now }], archived: false, trashed: false, updatedAt: now });
  },
});

export const update = mutation({
  args: { workosUserId: v.string(), applicationId: v.id("applications"), companyId: v.optional(v.id("companies")), opportunityId: v.optional(v.union(v.id("opportunities"), v.null())), status: v.optional(v.string()), notes: v.optional(v.string()), deadlines: v.optional(v.array(applicationDeadline)), links: v.optional(v.array(applicationLink)), customFields: v.optional(v.any()), nextAction: v.optional(v.string()), nextActionDue: v.optional(v.union(v.number(), v.null())), checklist: v.optional(v.array(checklistItem)), documentRefs: v.optional(v.array(documentRef)), archived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireUserId(ctx, args.workosUserId);
    const current = await own(ctx, args.applicationId, args.workosUserId);
    const companyId = (args.companyId ?? current.companyId) as Id<"companies">;
    const company = await ctx.db.get(companyId);
    if (!company || company.workosUserId !== args.workosUserId || company.trashed) throw new Error("Company not found");
    if (args.opportunityId) {
      const opportunity = await ctx.db.get(args.opportunityId);
      if (!opportunity || opportunity.workosUserId !== args.workosUserId || opportunity.companyId !== companyId || opportunity.trashed) throw new Error("Opportunity does not belong to this company");
    }
    if (args.customFields !== undefined && (!args.customFields || typeof args.customFields !== "object" || Array.isArray(args.customFields))) throw new Error("Custom fields must be an object");
    const { applicationId, workosUserId, opportunityId, nextActionDue, ...patch } = args;
    const now = Date.now();
    const stageHistory = args.status && args.status !== current.status ? [...(current.stageHistory ?? []), { status: args.status, changedAt: now }] : current.stageHistory;
    await ctx.db.patch(applicationId, { ...patch, ...(opportunityId !== undefined ? { opportunityId: opportunityId ?? undefined } : {}), ...(nextActionDue !== undefined ? { nextActionDue: nextActionDue ?? undefined } : {}), ...(stageHistory ? { stageHistory } : {}), updatedAt: now });
  },
});

export const remove = mutation({ args: { workosUserId: v.string(), applicationId: v.id("applications") }, handler: async (ctx, args) => { await requireUserId(ctx, args.workosUserId); await own(ctx, args.applicationId, args.workosUserId); await ctx.db.patch(args.applicationId, { trashed: true, updatedAt: Date.now() }); } });

export const listStatuses = query({ args: { workosUserId: v.string() }, handler: async (ctx, args) => { await requireUserId(ctx, args.workosUserId); return ctx.db.query("applicationStatuses").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect(); } });
export const createStatus = mutation({ args: { workosUserId: v.string(), name: v.string(), color: v.string() }, handler: async (ctx, args) => { await requireUserId(ctx, args.workosUserId); const statuses = await ctx.db.query("applicationStatuses").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect(); const name = args.name.trim(); if (!name) throw new Error("Status name is required"); if (statuses.some(item => item.name.toLowerCase() === name.toLowerCase())) throw new Error("A status with that name already exists"); return ctx.db.insert("applicationStatuses", { ...args, name, order: statuses.length }); } });
export const updateStatus = mutation({ args: { workosUserId: v.string(), statusId: v.id("applicationStatuses"), name: v.optional(v.string()), color: v.optional(v.string()), order: v.optional(v.number()) }, handler: async (ctx, args) => { await requireUserId(ctx, args.workosUserId); const row = await ctx.db.get(args.statusId); if (!row || row.workosUserId !== args.workosUserId) throw new Error("Status not found"); const { statusId, workosUserId, ...patch } = args; await ctx.db.patch(statusId, { ...patch, ...(patch.name ? { name: patch.name.trim() } : {}) }); } });
export const removeStatus = mutation({ args: { workosUserId: v.string(), statusId: v.id("applicationStatuses") }, handler: async (ctx, args) => { await requireUserId(ctx, args.workosUserId); const row = await ctx.db.get(args.statusId); if (!row || row.workosUserId !== args.workosUserId) throw new Error("Status not found"); const inUse = await ctx.db.query("applications").withIndex("by_user_trashed", q => q.eq("workosUserId", args.workosUserId).eq("trashed", false)).collect(); if (inUse.some(item => item.status === row.name)) throw new Error("Move applications out of this status before deleting it"); await ctx.db.delete(args.statusId); } });
