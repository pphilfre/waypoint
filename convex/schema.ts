import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Waypoint – Careers Tracker schema.
 *
 * All records are scoped to a WorkOS user ID (string).
 * Relationships use Convex _id references where possible.
 */
export default defineSchema({
  // ── Users ─────────────────────────────────────────────────────────────
  users: defineTable({
    workosUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    theme: v.optional(v.string()),
    colorScheme: v.optional(v.string()),
  }).index("by_workos_id", ["workosUserId"]),

  // ── Companies ─────────────────────────────────────────────────────────
  companies: defineTable({
    workosUserId: v.string(),
    externalId: v.optional(v.string()),
    name: v.string(),
    websiteUrl: v.string(),
    faviconStorageId: v.optional(v.id("_storage")),
    logoStorageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    overallScore: v.optional(v.number()),
    customFields: v.optional(v.any()),
    trashed: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user", ["workosUserId"])
    .index("by_user_external_id", ["workosUserId", "externalId"])
    .index("by_user_trashed", ["workosUserId", "trashed"]),

  opportunities: defineTable({
    workosUserId: v.string(),
    externalId: v.optional(v.string()),
    companyId: v.id("companies"),
    name: v.string(),
    type: v.string(),
    locations: v.array(v.object({
      city: v.string(),
      country: v.string(),
      mode: v.optional(v.union(v.literal("On-site"), v.literal("Hybrid"), v.literal("Remote"))),
    })),
    links: v.array(v.object({ name: v.string(), url: v.string(), type: v.optional(v.string()) })),
    deadlines: v.array(v.object({
      name: v.string(),
      date: v.number(),
      time: v.optional(v.string()),
      recurring: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
    status: v.string(),
    notes: v.optional(v.string()),
    overallScore: v.optional(v.number()),
    isOpen: v.boolean(),
    trashed: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user_trashed", ["workosUserId", "trashed"])
    .index("by_user_external_id", ["workosUserId", "externalId"])
    .index("by_company", ["companyId"]),

  opportunityTypes: defineTable({
    workosUserId: v.string(),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    order: v.number(),
  }).index("by_user", ["workosUserId"]),

  applications: defineTable({
    workosUserId: v.string(),
    externalId: v.optional(v.string()),
    companyId: v.id("companies"),
    opportunityId: v.optional(v.id("opportunities")),
    status: v.string(),
    notes: v.optional(v.string()),
    deadlines: v.array(v.object({ name: v.string(), date: v.number() })),
    links: v.array(v.object({ name: v.string(), url: v.string() })),
    trashed: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user_trashed", ["workosUserId", "trashed"])
    .index("by_user_external_id", ["workosUserId", "externalId"])
    .index("by_company", ["companyId"]),

  applicationStatuses: defineTable({
    workosUserId: v.string(),
    name: v.string(),
    color: v.string(),
    order: v.number(),
  }).index("by_user", ["workosUserId"]),

  contacts: defineTable({
    workosUserId: v.string(),
    externalId: v.optional(v.string()),
    companyId: v.id("companies"),
    name: v.string(),
    linkedinUrl: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    trashed: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user_trashed", ["workosUserId", "trashed"])
    .index("by_user_external_id", ["workosUserId", "externalId"])
    .index("by_company", ["companyId"]),

  ratingCriteria: defineTable({
    workosUserId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    entityType: v.union(v.literal("company"), v.literal("opportunity")),
    maxScore: v.number(),
    weight: v.number(),
    order: v.number(),
  }).index("by_user", ["workosUserId"]),

  ratingValues: defineTable({
    workosUserId: v.string(),
    criterionId: v.id("ratingCriteria"),
    entityType: v.union(v.literal("company"), v.literal("opportunity")),
    entityId: v.string(),
    score: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["workosUserId"])
    .index("by_entity", ["workosUserId", "entityType", "entityId"]),

  savedViews: defineTable({
    workosUserId: v.string(),
    entityType: v.union(v.literal("companies"), v.literal("opportunities")),
    name: v.string(),
    filters: v.any(),
    sorting: v.any(),
    visibleColumns: v.array(v.string()),
    columnOrder: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_entity", ["workosUserId", "entityType"]),
});
