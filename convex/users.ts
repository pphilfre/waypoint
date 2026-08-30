import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Upsert a user record on login.
 * Called from the client after WorkOS authenticates.
 */
export const upsertUser = mutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", args.workosUserId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      workosUserId: args.workosUserId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
    });
  },
});

/**
 * Get the current user's profile.
 */
export const getMe = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", args.workosUserId))
      .unique();
  },
});

/**
 * Update user preferences (theme, colour scheme).
 */
export const updatePreferences = mutation({
  args: {
    workosUserId: v.string(),
    theme: v.optional(v.string()),
    colorScheme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", args.workosUserId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      theme: args.theme,
      colorScheme: args.colorScheme,
    });
  },
});
