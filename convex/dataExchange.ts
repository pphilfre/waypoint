import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { normalizeWebsiteUrl } from "./url";

const text = (value: unknown, fallback = "") => typeof value === "string" ? value.trim() : fallback;
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
const array = (value: unknown) => Array.isArray(value) ? value : [];
const object = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const COMPANY_FIELDS = new Set(["id", "_id", "externalId", "_creationTime", "workosUserId", "name", "websiteUrl", "notes", "overallScore", "customFields", "trashed", "updatedAt", "faviconStorageId", "logoStorageId", "logoUrl"]);

export const importData = mutation({
  args: { workosUserId: v.string(), payload: v.any() },
  handler: async (ctx, { workosUserId, payload }) => {
    if (!payload || typeof payload !== "object") throw new Error("Import payload must be an object");
    const companies = array(payload.companies);
    const opportunities = array(payload.opportunities);
    const applications = array(payload.applications);
    const contacts = array(payload.contacts);
    const opportunityTypes = array(payload.opportunityTypes);
    const applicationStatuses = array(payload.applicationStatuses);
    const ratingCriteria = array(payload.ratingCriteria);
    const ratingValues = array(payload.ratingValues);
    const savedViews = array(payload.savedViews);
    const idMap = new Map<string, any>();
    let created = 0, updated = 0;

    for (const raw of companies) {
      const row = raw as Record<string, unknown>;
      const name = text(row.name);
      const websiteUrl = text(row.websiteUrl);
      if (!name || !websiteUrl) throw new Error("Every company needs a name and websiteUrl");
      const sourceId = text(row.id) || text(row._id);
      const normalizedId = sourceId ? ctx.db.normalizeId("companies", sourceId) : null;
      const existing = normalizedId ? await ctx.db.get(normalizedId) : sourceId ? await ctx.db.query("companies").withIndex("by_user_external_id", q => q.eq("workosUserId", workosUserId).eq("externalId", sourceId)).unique() : null;
      const normalizedWebsiteUrl = normalizeWebsiteUrl(websiteUrl);
      const inferredFields = Object.fromEntries(Object.entries(row).filter(([key, value]) => !COMPANY_FIELDS.has(key) && ["string", "number", "boolean"].includes(typeof value)));
      const customFields = { ...object(row.customFields), ...inferredFields };
      const hasCustomFields = row.customFields !== undefined || Object.keys(inferredFields).length > 0;
      const values = { name, websiteUrl: normalizedWebsiteUrl, notes: text(row.notes) || undefined, overallScore: number(row.overallScore), ...(hasCustomFields ? { customFields } : {}), trashed: false, updatedAt: Date.now() };
      let importedCompanyId: Id<"companies">;
      if (existing && existing.workosUserId === workosUserId) { await ctx.db.patch(existing._id, values); importedCompanyId = existing._id; if (sourceId) idMap.set(sourceId, existing._id); updated++; }
      else { importedCompanyId = await ctx.db.insert("companies", { workosUserId, ...(sourceId && !normalizedId ? { externalId: sourceId } : {}), ...values }); if (sourceId) idMap.set(sourceId, importedCompanyId); created++; }
      if (!existing?.logoStorageId && (!existing?.faviconStorageId || existing.websiteUrl !== normalizedWebsiteUrl)) {
        await ctx.scheduler.runAfter(0, api.favicon.fetchForCompany, { companyId: importedCompanyId, workosUserId, websiteUrl: normalizedWebsiteUrl });
      }
    }

    const companyId = async (value: unknown) => {
      const key = text(value); const mapped = idMap.get(key) ?? ctx.db.normalizeId("companies", key);
      const company = mapped ? await ctx.db.get(mapped) : null;
      if (!company || company.workosUserId !== workosUserId) throw new Error(`Missing company relationship: ${key || "unknown"}`);
      return company._id as Id<"companies">;
    };
    for (const raw of opportunities) {
      const row = raw as Record<string, unknown>; const name = text(row.name); if (!name) throw new Error("Every opportunity needs a name");
      const sourceId = text(row.id) || text(row._id); const values = { companyId: await companyId(row.companyId), name, type: text(row.type, "Custom"), locations: array(row.locations), links: array(row.links), deadlines: array(row.deadlines), status: text(row.status, "Researching"), notes: text(row.notes) || undefined, overallScore: number(row.overallScore), isOpen: row.isOpen !== false, trashed: false, updatedAt: Date.now() };
      const normalizedId = sourceId ? ctx.db.normalizeId("opportunities", sourceId) : null;
      const existing = normalizedId ? await ctx.db.get(normalizedId) : sourceId ? await ctx.db.query("opportunities").withIndex("by_user_external_id", q => q.eq("workosUserId", workosUserId).eq("externalId", sourceId)).unique() : null;
      if (existing && existing.workosUserId === workosUserId) { await ctx.db.patch(existing._id, values); if (sourceId) idMap.set(sourceId, existing._id); updated++; } else { const id = await ctx.db.insert("opportunities", { workosUserId, ...(sourceId && !normalizedId ? { externalId: sourceId } : {}), ...values } as any); if (sourceId) idMap.set(sourceId, id); created++; }
    }
    for (const raw of applications) {
      const row = raw as Record<string, unknown>; const sourceId = text(row.id) || text(row._id); const opportunityKey = text(row.opportunityId); const opportunityId = opportunityKey ? idMap.get(opportunityKey) ?? ctx.db.normalizeId("opportunities", opportunityKey) ?? undefined : undefined;
      const linkedCompanyId = await companyId(row.companyId);
      if (opportunityId) { const linked = await ctx.db.get(opportunityId as Id<"opportunities">); if (!linked || linked.workosUserId !== workosUserId || linked.companyId !== linkedCompanyId) throw new Error("Application opportunity does not belong to its company"); }
      const values = { companyId: linkedCompanyId, opportunityId, status: text(row.status, "Interested"), notes: text(row.notes) || undefined, deadlines: array(row.deadlines), links: array(row.links), trashed: false, updatedAt: Date.now() };
      const normalizedId = sourceId ? ctx.db.normalizeId("applications", sourceId) : null;
      const existing = normalizedId ? await ctx.db.get(normalizedId) : sourceId ? await ctx.db.query("applications").withIndex("by_user_external_id", q => q.eq("workosUserId", workosUserId).eq("externalId", sourceId)).unique() : null;
      if (existing && existing.workosUserId === workosUserId) { await ctx.db.patch(existing._id, values); if (sourceId) idMap.set(sourceId, existing._id); updated++; } else { const id = await ctx.db.insert("applications", { workosUserId, ...(sourceId && !normalizedId ? { externalId: sourceId } : {}), ...values } as any); if (sourceId) idMap.set(sourceId, id); created++; }
    }
    for (const raw of contacts) {
      const row = raw as Record<string, unknown>; const name = text(row.name); if (!name) throw new Error("Every contact needs a name"); const sourceId = text(row.id) || text(row._id);
      const values = { companyId: await companyId(row.companyId), name, role: text(row.role) || undefined, linkedinUrl: text(row.linkedinUrl) || undefined, notes: text(row.notes) || undefined, trashed: false, updatedAt: Date.now() };
      const normalizedId = sourceId ? ctx.db.normalizeId("contacts", sourceId) : null;
      const existing = normalizedId ? await ctx.db.get(normalizedId) : sourceId ? await ctx.db.query("contacts").withIndex("by_user_external_id", q => q.eq("workosUserId", workosUserId).eq("externalId", sourceId)).unique() : null;
      if (existing && existing.workosUserId === workosUserId) { await ctx.db.patch(existing._id, values); if (sourceId) idMap.set(sourceId, existing._id); updated++; } else { const id = await ctx.db.insert("contacts", { workosUserId, ...(sourceId && !normalizedId ? { externalId: sourceId } : {}), ...values }); if (sourceId) idMap.set(sourceId, id); created++; }
    }
    for (const [index, raw] of opportunityTypes.entries()) { const row=raw as Record<string,unknown>; const name=text(row.name); if(!name) throw new Error("Opportunity type needs a name"); await ctx.db.insert("opportunityTypes",{workosUserId,name,icon:text(row.icon,"BriefcaseBusiness"),color:text(row.color,"#A3B18A"),order:number(row.order)??index}); created++; }
    for (const [index, raw] of applicationStatuses.entries()) { const row=raw as Record<string,unknown>; const name=text(row.name); if(!name) throw new Error("Application status needs a name"); await ctx.db.insert("applicationStatuses",{workosUserId,name,color:text(row.color,"#A3B18A"),order:number(row.order)??index}); created++; }
    for (const [index, raw] of ratingCriteria.entries()) { const row=raw as Record<string,unknown>; const name=text(row.name); const entityType=row.entityType==="opportunity"?"opportunity":"company"; if(!name) throw new Error("Rating criterion needs a name"); const sourceId=text(row.id)||text(row._id); const id=await ctx.db.insert("ratingCriteria",{workosUserId,name,description:text(row.description)||undefined,entityType,maxScore:number(row.maxScore)??100,weight:number(row.weight)??0,order:number(row.order)??index}); if(sourceId)idMap.set(sourceId,id); created++; }
    for (const raw of ratingValues) { const row=raw as Record<string,unknown>; const criterionId=idMap.get(text(row.criterionId))??ctx.db.normalizeId("ratingCriteria",text(row.criterionId)); const entityId=String(idMap.get(text(row.entityId))??text(row.entityId)); if(!criterionId||!entityId) throw new Error("Rating value has a missing relationship"); await ctx.db.insert("ratingValues",{workosUserId,criterionId,entityType:row.entityType==="opportunity"?"opportunity":"company",entityId,score:number(row.score)??0,updatedAt:Date.now()}); created++; }
    for (const raw of savedViews) { const row=raw as Record<string,unknown>; const name=text(row.name); if(!name) throw new Error("Saved view needs a name"); const now=Date.now(); await ctx.db.insert("savedViews",{workosUserId,name,entityType:row.entityType==="opportunities"?"opportunities":"companies",filters:row.filters??{},sorting:row.sorting??[],visibleColumns:array(row.visibleColumns).filter(value=>typeof value==="string"),createdAt:now,updatedAt:now}); created++; }
    return { created, updated };
  },
});
