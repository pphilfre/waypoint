import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useConvexAuthKit } from "./use-convex-auth";

const auth = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  loading: false,
  tokenLoading: false,
  getAccessToken: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@workos/authkit-tanstack-react-start/client", () => ({
  useAuth: () => auth,
  useAccessToken: () => ({ ...auth, loading: auth.tokenLoading }),
}));

beforeEach(() => {
  auth.user = { id: "user-1" };
  auth.loading = false;
  auth.tokenLoading = false;
  auth.getAccessToken.mockReset().mockResolvedValue("cached-jwt");
  auth.refresh.mockReset().mockResolvedValue("fresh-jwt");
});
afterEach(cleanup);

describe("AuthKit to Convex bridge", () => {
  it("honors Convex forced refresh instead of returning a rejected cached token", async () => {
    const { result } = renderHook(useConvexAuthKit);
    expect(await result.current.fetchAccessToken({ forceRefreshToken: false })).toBe("cached-jwt");
    expect(await result.current.fetchAccessToken({ forceRefreshToken: true })).toBe("fresh-jwt");
    expect(auth.getAccessToken).toHaveBeenCalledTimes(1);
    expect(auth.refresh).toHaveBeenCalledTimes(1);
  });

  it("keeps the auth callback and subscriptions stable during token refresh and navigation renders", () => {
    const { result, rerender } = renderHook(useConvexAuthKit);
    const first = result.current;
    auth.tokenLoading = true;
    rerender();
    expect(result.current).toBe(first);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("does not treat a transient token error as signing the user out", async () => {
    auth.refresh.mockRejectedValueOnce(new Error("network offline"));
    const { result } = renderHook(useConvexAuthKit);
    await act(async () => {
      expect(await result.current.fetchAccessToken({ forceRefreshToken: true })).toBeNull();
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(await result.current.fetchAccessToken({ forceRefreshToken: true })).toBe("fresh-jwt");
  });

  it("reports session loading and explicit sign-out", () => {
    auth.loading = true;
    const { result, rerender } = renderHook(useConvexAuthKit);
    expect(result.current.isLoading).toBe(true);
    auth.loading = false;
    auth.user = null;
    rerender();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });
});
