import { describe, expect, it } from "vitest";
import { toCsv, toIcs } from "./export";

describe("data exports", () => {
  it("quotes commas and embedded quotes in CSV", () => {
    expect(toCsv([{ name: 'A, B', note: 'Said "hello"' }])).toContain('"A, B","Said ""hello"""');
  });

  it("creates a valid calendar envelope", () => {
    const calendar = toIcs([{ title: "Interview", date: Date.UTC(2026, 8, 12, 9), description: "Panel" }]);
    expect(calendar).toContain("BEGIN:VCALENDAR");
    expect(calendar).toContain("SUMMARY:Interview");
    expect(calendar).toContain("END:VCALENDAR");
  });
});
