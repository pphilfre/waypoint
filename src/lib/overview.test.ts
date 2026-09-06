import { describe, it, expect } from "vitest";
import { buildFocusQueue, collectDeadlines, relativeDue } from "./overview";
const now = new Date(2026, 8, 6, 12).getTime();
const day = (offset: number) => new Date(2026, 8, 6 + offset, 12).getTime();
const app = {
  _id: "a1",
  status: "Applied",
  company: { name: "Northstar" },
  deadlines: [],
};
describe("overview priorities", () => {
  it("excludes archived and completed work, sorts overdue items first, and includes unscheduled next actions", () => {
    const items = buildFocusQueue(
      [
        { ...app, nextAction: "Send portfolio", nextActionDue: day(-1) },
        { ...app, _id: "a2", status: "Offer" },
        { ...app, _id: "a3", archived: true },
        { ...app, _id: "a4" },
        {
          ...app,
          _id: "a5",
          nextAction: "Wait for reply",
          nextActionDue: day(9),
        },
      ],
      [
        {
          _id: "o1",
          name: "Graduate scheme",
          checkAgainAt: day(2),
          deadlines: [],
        },
      ],
      now,
    );
    expect(items.map((item) => item.recordId)).toEqual(["a1", "o1", "a4"]);
    expect(items[0].overdue).toBe(true);
  });
  it("keeps today's deadlines, omits past and archived ones, and links each to its source record", () => {
    const items = collectDeadlines(
      [
        {
          ...app,
          deadlines: [
            { name: "Submit", date: day(0) },
            { name: "Old", date: day(-1) },
          ],
        },
      ],
      [
        {
          _id: "o1",
          name: "Internship",
          archived: true,
          deadlines: [{ name: "Hidden", date: day(1) }],
        },
      ],
      now,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      recordId: "a1",
      to: "/applications",
      name: "Submit",
    });
  });
  it("uses calendar days for urgency labels", () => {
    expect(relativeDue(day(0), now)).toBe("Today");
    expect(relativeDue(day(1), now)).toBe("Tomorrow");
    expect(relativeDue(day(-2), now)).toBe("2d overdue");
  });
});
