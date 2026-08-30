/** Normalize a user-entered website into an absolute URL. */
export function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Website URL is required");
  }
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid website URL");
  }
  if (!url.hostname.includes(".")) {
    throw new Error("Enter a valid website URL");
  }
  return url.toString().replace(/\/$/, "");
}

export function hostnameFromUrl(websiteUrl: string): string {
  return new URL(websiteUrl).hostname.replace(/^www\./, "");
}
