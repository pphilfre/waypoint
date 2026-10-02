import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { AppShell } from "./AppShell";

const auth = vi.hoisted(() => ({
  user: { id: "user-1", firstName: "Test", email: "test@example.com" } as object | null,
  isLoading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
const convexAuth = vi.hoisted(() => ({ isLoading: false, isAuthenticated: true }));
vi.mock("@/lib/auth", () => ({ useAuth: () => auth }));
vi.mock("convex/react", () => ({ useConvexAuth: () => convexAuth }));
vi.mock("./UserSync", () => ({ UserSync: () => null }));
vi.mock("./SignInScreen", () => ({ SignInScreen: () => createElement("div", null, "Sign in required") }));
vi.mock("./Navbar", () => ({
  Navbar: ({ onSignOut }: { onSignOut: () => void }) => createElement("button", { type: "button", onClick: onSignOut }, "Sign out"),
}));

async function mount(url = "/companies") {
  const root = createRootRoute({ component: AppShell });
  const children = ["/", "/companies", "/applications"].map((path) => createRoute({
    getParentRoute: () => root,
    path,
    component: () => createElement("div", null, `Protected ${path}`),
  }));
  const router = createRouter({ routeTree: root.addChildren(children), history: createMemoryHistory({ initialEntries: [url] }) });
  render(createElement(RouterProvider, { router }));
  await act(async () => { await router.load(); });
  return router;
}

beforeEach(() => {
  auth.user = { id: "user-1", email: "test@example.com" };
  auth.isLoading = false;
  convexAuth.isLoading = false;
  convexAuth.isAuthenticated = true;
  auth.signOut.mockReset();
});
afterEach(cleanup);

describe("protected workspace", () => {
  it("keeps authenticated content across client navigation and back", async () => {
    const router = await mount();
    expect(screen.getByText("Protected /companies")).toBeTruthy();
    await act(async () => { await router.navigate({ to: "/applications" }); });
    expect(screen.getByText("Protected /applications")).toBeTruthy();
    await act(async () => { router.history.back(); });
    await waitFor(() => expect(screen.getByText("Protected /companies")).toBeTruthy());
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("does not show sign-in or protected content during initial session loading", async () => {
    auth.user = null;
    auth.isLoading = true;
    await mount();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByText("Sign in required")).toBeNull();
    expect(screen.queryByText("Protected /companies")).toBeNull();
  });

  it("waits for Convex to validate the JWT", async () => {
    convexAuth.isLoading = true;
    convexAuth.isAuthenticated = false;
    await mount();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByText("Protected /companies")).toBeNull();
  });

  it("blocks direct protected URLs without a session", async () => {
    auth.user = null;
    convexAuth.isAuthenticated = false;
    await mount("/applications");
    expect(screen.getByText("Sign in required")).toBeTruthy();
    expect(screen.queryByText("Protected /applications")).toBeNull();
  });

  it("shows a connection error without silently signing out a valid AuthKit user", async () => {
    convexAuth.isAuthenticated = false;
    await mount();
    expect(screen.getByText("Waypoint could not verify your session")).toBeTruthy();
    expect(screen.queryByText("Protected /companies")).toBeNull();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("still invokes explicit sign-out", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });
});
