import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const applicationDeadline = v.object({ name: v.string(), date: v.number() });
const applicationLink = v.object({ name: v.string(), url: v.string() });
async function own(ctx: any, id: Id<"applications">, user: string) {
  const row = await ctx.db.get(id);
  if (!row || row.workosUserId !== user) throw new Error("Application not found");
  return row;
}

export const list = query({ args: { workosUserId: v.string() }, handler: async (ctx, args) => {
  const rows = await ctx.db.query("applications").withIndex("by_user_trashed", q => q.eq("workosUserId", args.workosUserId).eq("trashed", false)).collect();
  return Promise.all(rows.map(async application => ({ ...application, company: await ctx.db.get(application.companyId), opportunity: application.opportunityId ? await ctx.db.get(application.opportunityId) : null })));
}});

export const create = mutation({ args: { workosUserId: v.string(), companyId: v.id("companies"), opportunityId: v.optional(v.id("opportunities")), status: v.string(), notes: v.optional(v.string()) }, handler: async (ctx, args) => {
  const company = await ctx.db.get(args.companyId);
  if (!company || company.workosUserId !== args.workosUserId) throw new Error("Company not found");
  if (args.opportunityId) { const opportunity = await ctx.db.get(args.opportunityId); if (!opportunity || opportunity.workosUserId !== args.workosUserId || opportunity.companyId !== args.companyId) throw new Error("Opportunity does not belong to this company"); }
  return ctx.db.insert("applications", { ...args, deadlines: [], links: [], trashed: false, updatedAt: Date.now() });
}});

export const update = mutation({ args: { workosUserId: v.string(), applicationId: v.id("applications"), companyId: v.optional(v.id("companies")), opportunityId: v.optional(v.union(v.id("opportunities"), v.null())), status: v.optional(v.string()), notes: v.optional(v.string()), deadlines: v.optional(v.array(applicationDeadline)), links: v.optional(v.array(applicationLink)) }, handler: async (ctx, args) => {
  const current = await own(ctx, args.applicationId, args.workosUserId);
  const companyId = (args.companyId ?? current.companyId) as Id<"companies">;
  const company = await ctx.db.get(companyId);
  if (!company || company.workosUserId !== args.workosUserId || company.trashed) throw new Error("Company not found");
  if (args.opportunityId) {
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity || opportunity.workosUserId !== args.workosUserId || opportunity.companyId !== companyId) throw new Error("Opportunity does not belong to this company");
  }
  const { applicationId, workosUserId, opportunityId, ...patch } = args;
  await ctx.db.patch(applicationId, { ...patch, ...(opportunityId !== undefined ? { opportunityId: opportunityId ?? undefined } : {}), updatedAt: Date.now() });
}});

export const remove = mutation({ args: { workosUserId: v.string(), applicationId: v.id("applications") }, handler: async (ctx, args) => { await own(ctx, args.applicationId, args.workosUserId); await ctx.db.patch(args.applicationId, { trashed: true, updatedAt: Date.now() }); } });
export const listStatuses = query({ args: { workosUserId: v.string() }, handler: (ctx, args) => ctx.db.query("applicationStatuses").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect() });
export const createStatus = mutation({ args: { workosUserId: v.string(), name: v.string(), color: v.string() }, handler: async (ctx, args) => { const statuses = await ctx.db.query("applicationStatuses").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect(); return ctx.db.insert("applicationStatuses", { ...args, name: args.name.trim(), order: statuses.length }); } });
