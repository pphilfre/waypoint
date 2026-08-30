import type { ReactNode } from "react";
import {
  HeadContent,
  Scripts,
  createRootRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { AuthKitProvider } from "@workos-inc/authkit-react";
import { ConvexProvider } from "convex/react";
import { AppShell } from "@/components/layout/AppShell";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/context/theme-context";
import { convex } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Waypoint – Careers Tracker" },
      {
        name: "description",
        content: "Your personal careers opportunity tracker",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;650;700&family=IBM+Plex+Mono:wght@500&display=swap",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: AppShell,
  errorComponent: RootErrorComponent,
});

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const isMissingConvexFunction = error.message.includes("Could not find public function");
  return (
    <main className="root-error-page">
      <section className="root-error-card">
        <span className="root-error-icon"><TriangleAlert size={19} /></span>
        <p className="page-kicker">Waypoint interrupted</p>
        <h1>{isMissingConvexFunction ? "The data service is updating" : "Something went off course"}</h1>
        <p>
          {isMissingConvexFunction
            ? "The browser is connected to an older Convex deployment. Restart the development server, then try again."
            : "Your data is safe. Retry the page, or reload if the problem continues."}
        </p>
        <div>
          <Button onClick={reset}><RefreshCw size={14} /> Try again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>Reload app</Button>
        </div>
        {import.meta.env.DEV && <details><summary>Developer details</summary><pre>{error.message}</pre></details>}
      </section>
    </main>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ConvexProvider client={convex}>
          <AuthKitProvider
            clientId={import.meta.env.VITE_WORKOS_CLIENT_ID ?? ""}
            redirectUri={
              import.meta.env.VITE_WORKOS_REDIRECT_URI ??
              "http://localhost:3000/callback"
            }
          >
            <ThemeProvider>{children}</ThemeProvider>
          </AuthKitProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  );
}
