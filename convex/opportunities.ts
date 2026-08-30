import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const location = v.object({ city: v.string(), country: v.string(), mode: v.optional(v.union(v.literal("On-site"), v.literal("Hybrid"), v.literal("Remote"))) });
const link = v.object({ name: v.string(), url: v.string(), type: v.optional(v.string()) });
const deadline = v.object({ name: v.string(), date: v.number(), time: v.optional(v.string()), recurring: v.optional(v.string()), notes: v.optional(v.string()) });

async function owned(ctx: any, id: Id<"opportunities">, user: string) {
  const record = await ctx.db.get(id);
  if (!record || record.workosUserId !== user) throw new Error("Opportunity not found");
  return record;
}
async function ownedCompany(ctx: any, id: Id<"companies">, user: string) {
  const record = await ctx.db.get(id);
  if (!record || record.workosUserId !== user || record.trashed) throw new Error("Company not found");
}

export const list = query({ args: { workosUserId: v.string() }, handler: async (ctx, args) => {
  const rows = await ctx.db.query("opportunities").withIndex("by_user_trashed", q => q.eq("workosUserId", args.workosUserId).eq("trashed", false)).collect();
  return Promise.all(rows.map(async opportunity => ({ ...opportunity, company: await ctx.db.get(opportunity.companyId) })));
}});

export const create = mutation({ args: { workosUserId: v.string(), companyId: v.id("companies"), name: v.string(), type: v.string(), locations: v.array(location), links: v.array(link), deadlines: v.array(deadline) }, handler: async (ctx, args) => {
  await ownedCompany(ctx, args.companyId, args.workosUserId);
  if (!args.name.trim()) throw new Error("Opportunity name is required");
  return ctx.db.insert("opportunities", { ...args, name: args.name.trim(), status: "Researching", isOpen: true, trashed: false, updatedAt: Date.now() });
}});

export const update = mutation({ args: { workosUserId: v.string(), opportunityId: v.id("opportunities"), companyId: v.optional(v.id("companies")), name: v.optional(v.string()), type: v.optional(v.string()), locations: v.optional(v.array(location)), links: v.optional(v.array(link)), deadlines: v.optional(v.array(deadline)), status: v.optional(v.string()), notes: v.optional(v.string()), overallScore: v.optional(v.number()), isOpen: v.optional(v.boolean()) }, handler: async (ctx, args) => {
  await owned(ctx, args.opportunityId, args.workosUserId);
  if (args.companyId) await ownedCompany(ctx, args.companyId, args.workosUserId);
  if (args.name !== undefined && !args.name.trim()) throw new Error("Opportunity name is required");
  const { opportunityId, workosUserId, ...values } = args;
  await ctx.db.patch(opportunityId, { ...values, ...(values.name !== undefined ? { name: values.name.trim() } : {}), updatedAt: Date.now() });
}});

export const remove = mutation({ args: { workosUserId: v.string(), opportunityId: v.id("opportunities") }, handler: async (ctx, args) => {
  await owned(ctx, args.opportunityId, args.workosUserId);
  await ctx.db.patch(args.opportunityId, { trashed: true, updatedAt: Date.now() });
}});

export const listTypes = query({ args: { workosUserId: v.string() }, handler: (ctx, args) => ctx.db.query("opportunityTypes").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect() });
export const createType = mutation({ args: { workosUserId: v.string(), name: v.string(), icon: v.string(), color: v.string() }, handler: async (ctx, args) => {
  const existing = await ctx.db.query("opportunityTypes").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect();
  return ctx.db.insert("opportunityTypes", { ...args, name: args.name.trim(), order: existing.length });
}});
