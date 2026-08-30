import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const entityType = v.union(
  v.literal("company"),
  v.literal("opportunity"),
  v.literal("application"),
  v.literal("contact"),
);

const TABLES = {
  company: "companies",
  opportunity: "opportunities",
  application: "applications",
  contact: "contacts",
} as const;

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export const list = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    const [companies, opportunities, applications, contacts] = await Promise.all([
      ctx.db.query("companies").withIndex("by_user_trashed", (q) => q.eq("workosUserId", args.workosUserId).eq("trashed", true)).collect(),
      ctx.db.query("opportunities").withIndex("by_user_trashed", (q) => q.eq("workosUserId", args.workosUserId).eq("trashed", true)).collect(),
      ctx.db.query("applications").withIndex("by_user_trashed", (q) => q.eq("workosUserId", args.workosUserId).eq("trashed", true)).collect(),
      ctx.db.query("contacts").withIndex("by_user_trashed", (q) => q.eq("workosUserId", args.workosUserId).eq("trashed", true)).collect(),
    ]);
    const companyNames = new Map(companies.map((company) => [company._id, company.name]));
    for (const record of [...opportunities, ...applications, ...contacts]) {
      if (!companyNames.has(record.companyId)) {
        const company = await ctx.db.get(record.companyId);
        if (company?.workosUserId === args.workosUserId) companyNames.set(company._id, company.name);
      }
    }
    return [
      ...companies.map((row) => ({ id: row._id, entityType: "company" as const, name: row.name, detail: row.websiteUrl, deletedAt: row.updatedAt })),
      ...opportunities.map((row) => ({ id: row._id, entityType: "opportunity" as const, name: row.name, detail: companyNames.get(row.companyId) ?? "Company unavailable", deletedAt: row.updatedAt })),
      ...applications.map((row) => ({ id: row._id, entityType: "application" as const, name: `${companyNames.get(row.companyId) ?? "Company"} application`, detail: row.status, deletedAt: row.updatedAt })),
      ...contacts.map((row) => ({ id: row._id, entityType: "contact" as const, name: row.name, detail: companyNames.get(row.companyId) ?? "Company unavailable", deletedAt: row.updatedAt })),
    ].sort((a, b) => b.deletedAt - a.deletedAt);
  },
});

export const restore = mutation({
  args: { workosUserId: v.string(), entityType, id: v.string() },
  handler: async (ctx, args) => {
    const table = TABLES[args.entityType];
    const id = ctx.db.normalizeId(table, args.id);
    if (!id) throw new Error("Trash item not found");
    const record: any = await ctx.db.get(id as any);
    if (!record || record.workosUserId !== args.workosUserId || !record.trashed) throw new Error("Trash item not found");
    const now = Date.now();
    await ctx.db.patch(id as any, { trashed: false, updatedAt: now });
    if (args.entityType === "company") {
      const companyId = id as Id<"companies">;
      const [opportunities, applications, contacts] = await Promise.all([
        ctx.db.query("opportunities").withIndex("by_company", (q) => q.eq("companyId", companyId)).collect(),
        ctx.db.query("applications").withIndex("by_company", (q) => q.eq("companyId", companyId)).collect(),
        ctx.db.query("contacts").withIndex("by_company", (q) => q.eq("companyId", companyId)).collect(),
      ]);
      for (const child of [...opportunities, ...applications, ...contacts]) {
        if (child.workosUserId === args.workosUserId && child.trashed) await ctx.db.patch(child._id, { trashed: false, updatedAt: now });
      }
    } else if ("companyId" in record) {
      const company = await ctx.db.get(record.companyId as Id<"companies">);
      if (company?.workosUserId === args.workosUserId && company.trashed) {
        await ctx.db.patch(company._id, { trashed: false, updatedAt: now });
      }
    }
  },
});

async function removeRecord(ctx: any, workosUserId: string, type: keyof typeof TABLES, rawId: string) {
  const table = TABLES[type];
  const id = ctx.db.normalizeId(table, rawId);
  if (!id) return;
  const record = await ctx.db.get(id);
  if (!record || record.workosUserId !== workosUserId || !record.trashed) return;

  if (type === "company") {
    const [opportunities, applications, contacts] = await Promise.all([
      ctx.db.query("opportunities").withIndex("by_company", (q: any) => q.eq("companyId", id)).collect(),
      ctx.db.query("applications").withIndex("by_company", (q: any) => q.eq("companyId", id)).collect(),
      ctx.db.query("contacts").withIndex("by_company", (q: any) => q.eq("companyId", id)).collect(),
    ]);
    for (const child of applications) await ctx.db.delete(child._id);
    for (const child of contacts) await ctx.db.delete(child._id);
    for (const child of opportunities) {
      const ratings = await ctx.db.query("ratingValues").withIndex("by_entity", (q: any) => q.eq("workosUserId", workosUserId).eq("entityType", "opportunity").eq("entityId", String(child._id))).collect();
      for (const rating of ratings) await ctx.db.delete(rating._id);
      await ctx.db.delete(child._id);
    }
    const ratings = await ctx.db.query("ratingValues").withIndex("by_entity", (q: any) => q.eq("workosUserId", workosUserId).eq("entityType", "company").eq("entityId", String(id))).collect();
    for (const rating of ratings) await ctx.db.delete(rating._id);
    if (record.logoStorageId) await ctx.storage.delete(record.logoStorageId);
    if (record.faviconStorageId) await ctx.storage.delete(record.faviconStorageId);
  } else if (type === "opportunity") {
    const applications = await ctx.db.query("applications").filter((q: any) => q.eq(q.field("opportunityId"), id)).collect();
    for (const application of applications) await ctx.db.patch(application._id, { opportunityId: undefined });
    const ratings = await ctx.db.query("ratingValues").withIndex("by_entity", (q: any) => q.eq("workosUserId", workosUserId).eq("entityType", "opportunity").eq("entityId", String(id))).collect();
    for (const rating of ratings) await ctx.db.delete(rating._id);
  }
  await ctx.db.delete(id);
}

export const permanentlyRemove = mutation({
  args: { workosUserId: v.string(), entityType, id: v.string() },
  handler: (ctx, args) => removeRecord(ctx, args.workosUserId, args.entityType, args.id),
});

export const empty = mutation({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    for (const type of Object.keys(TABLES) as Array<keyof typeof TABLES>) {
      const table = TABLES[type];
      const rows = await ctx.db.query(table).withIndex("by_user_trashed", (q: any) => q.eq("workosUserId", args.workosUserId).eq("trashed", true)).collect();
      for (const row of rows) await removeRecord(ctx, args.workosUserId, type, String(row._id));
    }
  },
});

export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - RETENTION_MS;
    for (const type of Object.keys(TABLES) as Array<keyof typeof TABLES>) {
      const rows = await ctx.db.query(TABLES[type]).filter((q: any) => q.and(q.eq(q.field("trashed"), true), q.lt(q.field("updatedAt"), cutoff))).collect();
      for (const row of rows) await removeRecord(ctx, row.workosUserId, type, String(row._id));
    }
  },
});
