import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

/**
 * Singleton Convex client.
 * A placeholder URL keeps SSR from crashing when env is missing locally.
 */
export const convex = new ConvexReactClient(
  convexUrl && convexUrl.length > 0
    ? convexUrl
    : "https://placeholder.convex.cloud"
);
