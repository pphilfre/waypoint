import { vi } from "vitest";

// jsdom has no layout/scrolling implementation. Keep router navigation real.
window.scrollTo = vi.fn();
