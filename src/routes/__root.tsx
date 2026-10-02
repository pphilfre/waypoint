import type { ReactNode } from "react";
import {
  HeadContent,
  Scripts,
  createRootRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { AuthKitProvider } from "@workos/authkit-tanstack-react-start/client";
import { ConvexProviderWithAuth } from "convex/react";
import { useConvexAuthKit } from "@/lib/use-convex-auth";
import { SessionSync } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/context/theme-context";
import { convex } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import appCss from "../styles.css?url";
import workspaceCss from "../workspace.css?url";

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
      { rel: "stylesheet", href: workspaceCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: AppShell,
  errorComponent: RootErrorComponent,
});

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const isMissingConvexFunction = message.includes("Could not find public function");
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
        {import.meta.env.DEV && <details><summary>Developer details</summary><pre>{message}</pre></details>}
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
        <AuthKitProvider>
          <SessionSync />
          <ConvexProviderWithAuth client={convex} useAuth={useConvexAuthKit}>
            <ThemeProvider>{children}</ThemeProvider>
          </ConvexProviderWithAuth>
        </AuthKitProvider>
        <Scripts />
      </body>
    </html>
  );
}
