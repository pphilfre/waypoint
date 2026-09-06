import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useOpenFromQuery, useRecordSelection } from "./use-open-from-query";
function Harness() {
  const [open, setOpen] = useOpenFromQuery();
  const [record, setRecord] = useRecordSelection<string>();
  return createElement(
    "div",
    null,
    createElement(
      "output",
      { "data-testid": "state" },
      `${open ? "new" : "closed"}:${record ?? "none"}`,
    ),
    createElement(
      "button",
      { onClick: () => setOpen(false) },
      "Close creation",
    ),
    createElement("button", { onClick: () => setRecord(null) }, "Close record"),
    createElement("button", { onClick: () => { setOpen(false); setRecord("created-company"); } }, "Inspect created company"),
  );
}
afterEach(cleanup);
async function mount(url: string) {
  const router = createRouter({
    routeTree: createRootRoute({ component: Harness }),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  render(createElement(RouterProvider, { router }));
  await act(async () => {
    await router.load();
  });
  return router;
}
describe("workspace navigation", () => {
  it("moves from creation to the new record without reopening the creation dialog", async () => {
    const router = await mount("/?new=1");
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("new:none"));
    fireEvent.click(screen.getByText("Inspect created company"));
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("closed:created-company"));
    expect(router.state.location.searchStr).toBe("?record=created-company");
  });
  it("opens quick creation through the router and can reopen it on the same page", async () => {
    const router = await mount("/");
    await act(async () => {
      await router.navigate({ to: "/", search: { new: 1 } as never });
    });
    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toBe("new:none"),
    );
    fireEvent.click(screen.getByText("Close creation"));
    await waitFor(() => expect(router.state.location.searchStr).toBe(""));
    await act(async () => {
      await router.navigate({ to: "/", search: { new: 1 } as never });
    });
    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toBe("new:none"),
    );
  });
  it("opens a linked record and clears its URL when closed", async () => {
    const router = await mount("/?record=company-1");
    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toBe("closed:company-1"),
    );
    fireEvent.click(screen.getByText("Close record"));
    await waitFor(() => expect(router.state.location.searchStr).toBe(""));
    await act(async () => {
      await router.navigate({
        to: "/",
        search: { record: "company-1" } as never,
      });
    });
    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toBe("closed:company-1"),
    );
  });
});
