import { describe, expect, it } from "vitest";
import { requireUserId } from "./auth";
import { assertPublicHostname } from "./url";

describe("security boundaries", () => {
  it("rejects a spoofed user id", async () => {
    const ctx = { auth: { getUserIdentity: async () => ({ subject: "user-a" }) } };
    await expect(requireUserId(ctx, "user-b")).rejects.toThrow("Not authorized");
  });

  it("blocks private favicon targets", () => {
    expect(() => assertPublicHostname("127.0.0.1")).toThrow("public website");
    expect(() => assertPublicHostname("192.168.1.8")).toThrow("public website");
    expect(() => assertPublicHostname("careers.example.com")).not.toThrow();
  });
});
