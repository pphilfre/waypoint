import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ColorScheme = "green" | "indigo" | "mono" | "warm" | "blue";

interface ThemeContextValue {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_THEME = "waypoint-theme";
const STORAGE_SCHEME = "waypoint-color-scheme";

const COLOR_SCHEME_ATTR: Record<ColorScheme, string> = {
  green: "",
  indigo: "indigo",
  mono: "mono",
  warm: "warm",
  blue: "blue",
};

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function isColorScheme(value: string | null): value is ColorScheme {
  return (
    value === "green" ||
    value === "indigo" ||
    value === "mono" ||
    value === "warm" ||
    value === "blue"
  );
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyToDocument(mode: ThemeMode, colorScheme: ColorScheme) {
  const html = document.documentElement;
  const resolved = resolveMode(mode);
  html.classList.remove("light", "dark");
  html.classList.add(resolved);

  const attr = COLOR_SCHEME_ATTR[colorScheme];
  if (attr) {
    html.setAttribute("data-theme", attr);
  } else {
    html.removeAttribute("data-theme");
  }
}

/** Runs before paint so SSR/hydration does not flash the wrong theme. */
export const THEME_INIT_SCRIPT = `(function(){
  try {
    var mode = localStorage.getItem("${STORAGE_THEME}") || "system";
    var scheme = localStorage.getItem("${STORAGE_SCHEME}") || "green";
    var dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(dark ? "dark" : "light");
    var attr = { indigo: "indigo", mono: "mono", warm: "warm", blue: "blue" }[scheme];
    if (attr) html.setAttribute("data-theme", attr);
    else html.removeAttribute("data-theme");
  } catch (e) {}
})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("green");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedMode = localStorage.getItem(STORAGE_THEME);
    const storedScheme = localStorage.getItem(STORAGE_SCHEME);
    if (isThemeMode(storedMode)) setModeState(storedMode);
    if (isColorScheme(storedScheme)) setColorSchemeState(storedScheme);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyToDocument(mode, colorScheme);
    setResolvedMode(resolveMode(mode));
  }, [mode, colorScheme, hydrated]);

  useEffect(() => {
    if (!hydrated || mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyToDocument("system", colorScheme);
      setResolvedMode(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, colorScheme, hydrated]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_THEME, next);
  }, []);

  const setColorScheme = useCallback((next: ColorScheme) => {
    setColorSchemeState(next);
    localStorage.setItem(STORAGE_SCHEME, next);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ mode, colorScheme, resolvedMode, setMode, setColorScheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
