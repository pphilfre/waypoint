import { describe, expect, it } from "vitest";
import { calculateWeightedScore } from "./scoring";

describe("weighted scoring", () => {
  it("counts unanswered criteria as zero", () => {
    const criteria = [{ id: "career", maxScore: 100, weight: 50 }, { id: "location", maxScore: 100, weight: 50 }];
    expect(calculateWeightedScore(criteria, new Map([["career", 100]]))).toBe(50);
  });
});
