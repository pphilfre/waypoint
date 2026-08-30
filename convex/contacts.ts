import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

async function own(ctx: any, id: Id<"contacts">, user: string) {
  const row = await ctx.db.get(id);
  if (!row || row.workosUserId !== user) throw new Error("Contact not found");
  return row;
}

export const list = query({ args: { workosUserId: v.string() }, handler: async (ctx, args) => {
  const rows = await ctx.db.query("contacts").withIndex("by_user_trashed", q => q.eq("workosUserId", args.workosUserId).eq("trashed", false)).collect();
  return Promise.all(rows.map(async contact => ({ ...contact, company: await ctx.db.get(contact.companyId) })));
}});

export const create = mutation({ args: { workosUserId: v.string(), companyId: v.id("companies"), name: v.string(), linkedinUrl: v.optional(v.string()), role: v.optional(v.string()), notes: v.optional(v.string()) }, handler: async (ctx, args) => {
  const company = await ctx.db.get(args.companyId);
  if (!company || company.workosUserId !== args.workosUserId) throw new Error("Company not found");
  return ctx.db.insert("contacts", { ...args, name: args.name.trim(), trashed: false, updatedAt: Date.now() });
}});

export const update = mutation({ args: { workosUserId: v.string(), contactId: v.id("contacts"), companyId: v.optional(v.id("companies")), name: v.optional(v.string()), linkedinUrl: v.optional(v.string()), role: v.optional(v.string()), notes: v.optional(v.string()) }, handler: async (ctx, args) => {
  await own(ctx, args.contactId, args.workosUserId);
  if (args.companyId) {
    const company = await ctx.db.get(args.companyId);
    if (!company || company.workosUserId !== args.workosUserId || company.trashed) throw new Error("Company not found");
  }
  const { contactId, workosUserId: _user, ...patch } = args;
  await ctx.db.patch(contactId, { ...patch, updatedAt: Date.now() });
}});

export const remove = mutation({ args: { workosUserId: v.string(), contactId: v.id("contacts") }, handler: async (ctx, args) => {
  await own(ctx, args.contactId, args.workosUserId);
  await ctx.db.patch(args.contactId, { trashed: true, updatedAt: Date.now() });
}});
