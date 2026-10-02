import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./auth-return-path";

describe("authentication return paths", () => {
  it("preserves a protected route and its selected record", () => {
    expect(safeReturnPath("/companies?record=company-1")).toBe("/companies?record=company-1");
  });

  it.each([null, "", "https://evil.example", "//evil.example", "/\\evil.example", "/\r\nevil", "/callback?code=secret", "/auth/sign-in", "/a/../auth/sign-up"])(
    "rejects external redirects and auth loops: %s",
    (path) => expect(safeReturnPath(path)).toBe("/"),
  );
});
