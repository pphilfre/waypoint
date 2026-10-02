/** Only allow application paths, never external URLs or auth redirect loops. */
export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) {
    return "/";
  }
  const url = new URL(value, "https://waypoint.invalid");
  if (url.pathname === "/callback" || url.pathname.startsWith("/auth/")) return "/";
  return url.pathname + url.search;
}
