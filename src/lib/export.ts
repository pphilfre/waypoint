export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map(row => headers.map(key => quote(row[key])).join(","))].join("\n");
}

export function toIcs(events: Array<{ title: string; date: number; description?: string; url?: string }>) {
  const stamp = (value: number) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const escape = (value = "") => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Waypoint//Careers Tracker//EN", ...events.flatMap((event, index) => ["BEGIN:VEVENT", `UID:waypoint-${event.date}-${index}@local`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(event.date)}`, `SUMMARY:${escape(event.title)}`, `DESCRIPTION:${escape(event.description)}`, ...(event.url ? [`URL:${event.url}`] : []), "END:VEVENT"]), "END:VCALENDAR"].join("\r\n");
}
