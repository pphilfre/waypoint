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
  assertPublicHostname(url.hostname);
  return url.toString().replace(/\/$/, "");
}

export function assertPublicHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const privateIpv4 = /^(?:0|10|127)\.|^169\.254\.|^192\.168\.|^172\.(?:1[6-9]|2\d|3[01])\./;
  if (host === "localhost" || host === "::1" || host.endsWith(".local") || privateIpv4.test(host)) {
    throw new Error("Enter a public website URL");
  }
}

export function hostnameFromUrl(websiteUrl: string): string {
  return new URL(websiteUrl).hostname.replace(/^www\./, "");
}
