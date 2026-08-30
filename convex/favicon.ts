"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { hostnameFromUrl } from "./url";

async function fetchAsBlob(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { Accept: "image/*,*/*" },
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size < 32 || blob.size > 512_000) return null;
    return blob;
  } catch {
    return null;
  }
}

/**
 * Fetch a favicon from standard locations, cache it in Convex storage,
 * and attach it to the company (unless a manual logo is already set).
 */
export const fetchForCompany = action({
  args: {
    companyId: v.id("companies"),
    workosUserId: v.string(),
    websiteUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const host = hostnameFromUrl(args.websiteUrl);
    const origin = new URL(args.websiteUrl).origin;

    const candidates = [
      `${origin}/favicon.ico`,
      `${origin}/favicon.png`,
      `${origin}/apple-touch-icon.png`,
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
    ];

    for (const url of candidates) {
      const blob = await fetchAsBlob(url);
      if (!blob) continue;
      const storageId = await ctx.storage.store(blob);
      await ctx.runMutation(internal.companies.attachFavicon, {
        companyId: args.companyId,
        workosUserId: args.workosUserId,
        storageId,
      });
      return { ok: true as const };
    }

    return { ok: false as const };
  },
});
