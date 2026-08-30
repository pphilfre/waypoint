import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { hostnameFromUrl, normalizeWebsiteUrl } from "./url";

async function requireOwnedCompany(
  ctx: { db: { get: (id: Id<"companies">) => Promise<any> } },
  companyId: Id<"companies">,
  workosUserId: string
) {
  const company = await ctx.db.get(companyId);
  if (!company || company.workosUserId !== workosUserId) {
    throw new Error("Company not found");
  }
  return company;
}

async function withLogoUrl<
  T extends {
    logoStorageId?: Id<"_storage">;
    faviconStorageId?: Id<"_storage">;
  },
>(
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  company: T,
) {
  const storageId = company.logoStorageId ?? company.faviconStorageId;
  const logoUrl = storageId ? await ctx.storage.getUrl(storageId) : null;
  return { ...company, logoUrl };
}

export const list = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_user_trashed", (q) =>
        q.eq("workosUserId", args.workosUserId).eq("trashed", false)
      )
      .collect();

    companies.sort((a, b) => a.name.localeCompare(b.name));

    return Promise.all(companies.map((company) => withLogoUrl(ctx, company)));
  },
});

export const get = query({
  args: {
    workosUserId: v.string(),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company || company.workosUserId !== args.workosUserId) {
      return null;
    }
    return withLogoUrl(ctx, company);
  },
});

export const create = mutation({
  args: {
    workosUserId: v.string(),
    name: v.string(),
    websiteUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Company name is required");
    const websiteUrl = normalizeWebsiteUrl(args.websiteUrl);
    const now = Date.now();

    return await ctx.db.insert("companies", {
      workosUserId: args.workosUserId,
      name,
      websiteUrl,
      trashed: false,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    workosUserId: v.string(),
    companyId: v.id("companies"),
    name: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    overallScore: v.optional(v.union(v.number(), v.null())),
    customFields: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const company = await requireOwnedCompany(
      ctx,
      args.companyId,
      args.workosUserId
    );

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) throw new Error("Company name is required");
      patch.name = name;
    }
    if (args.websiteUrl !== undefined) {
      patch.websiteUrl = normalizeWebsiteUrl(args.websiteUrl);
      // Re-fetch favicon when the site changes unless a manual logo is set.
      if (!company.logoStorageId) {
        patch.faviconStorageId = undefined;
      }
    }
    if (args.notes !== undefined) {
      patch.notes = args.notes;
    }
    if (args.overallScore !== undefined) {
      patch.overallScore =
        args.overallScore === null ? undefined : args.overallScore;
    }
    if (args.customFields !== undefined) {
      if (!args.customFields || Array.isArray(args.customFields) || typeof args.customFields !== "object") {
        throw new Error("Custom fields must be an object");
      }
      patch.customFields = args.customFields;
    }

    await ctx.db.patch(args.companyId, patch);
    return { websiteChanged: args.websiteUrl !== undefined };
  },
});

export const trash = mutation({
  args: {
    workosUserId: v.string(),
    companyIds: v.array(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const companyId of args.companyIds) {
      await requireOwnedCompany(ctx, companyId, args.workosUserId);
      await ctx.db.patch(companyId, { trashed: true, updatedAt: now });
      const [opportunities, applications, contacts] = await Promise.all([
        ctx.db.query("opportunities").withIndex("by_company", (q) => q.eq("companyId", companyId)).collect(),
        ctx.db.query("applications").withIndex("by_company", (q) => q.eq("companyId", companyId)).collect(),
        ctx.db.query("contacts").withIndex("by_company", (q) => q.eq("companyId", companyId)).collect(),
      ]);
      for (const record of [...opportunities, ...applications, ...contacts]) {
        if (record.workosUserId === args.workosUserId) {
          await ctx.db.patch(record._id, { trashed: true, updatedAt: now });
        }
      }
    }
  },
});

export const generateUploadUrl = mutation({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) =>
        q.eq("workosUserId", args.workosUserId)
      )
      .unique();
    if (!user) throw new Error("User not found");
    return await ctx.storage.generateUploadUrl();
  },
});

export const renameCustomField = mutation({
  args: {
    workosUserId: v.string(),
    currentName: v.string(),
    nextName: v.string(),
  },
  handler: async (ctx, args) => {
    const currentName = args.currentName.trim();
    const nextName = args.nextName.trim();
    if (!currentName || !nextName) throw new Error("Column name is required");
    if (currentName === nextName) return;
    const companies = await ctx.db.query("companies").withIndex("by_user", q => q.eq("workosUserId", args.workosUserId)).collect();
    if (companies.some(company => {
      const fields = company.customFields as Record<string, unknown> | undefined;
      return fields && Object.prototype.hasOwnProperty.call(fields, nextName);
    })) throw new Error(`A column named “${nextName}” already exists`);
    const now = Date.now();
    for (const company of companies) {
      const fields = company.customFields as Record<string, unknown> | undefined;
      if (!fields || !Object.prototype.hasOwnProperty.call(fields, currentName)) continue;
      const nextFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) nextFields[key === currentName ? nextName : key] = value;
      await ctx.db.patch(company._id, { customFields: nextFields, updatedAt: now });
    }
  },
});

export const setLogo = mutation({
  args: {
    workosUserId: v.string(),
    companyId: v.id("companies"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireOwnedCompany(ctx, args.companyId, args.workosUserId);
    await ctx.db.patch(args.companyId, {
      logoStorageId: args.storageId,
      updatedAt: Date.now(),
    });
  },
});

export const clearLogo = mutation({
  args: {
    workosUserId: v.string(),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    await requireOwnedCompany(ctx, args.companyId, args.workosUserId);
    await ctx.db.patch(args.companyId, {
      logoStorageId: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const attachFavicon = internalMutation({
  args: {
    companyId: v.id("companies"),
    workosUserId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (
      !company ||
      company.trashed ||
      company.workosUserId !== args.workosUserId
    ) {
      return;
    }
    if (company.logoStorageId) return;
    await ctx.db.patch(args.companyId, {
      faviconStorageId: args.storageId,
      updatedAt: Date.now(),
    });
  },
});

export { hostnameFromUrl };
