import { useAuth } from "@workos-inc/authkit-react";
import { useConvexAuth } from "convex/react";
import { useRouterState } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SignInScreen } from "@/components/layout/SignInScreen";
import { UserSync } from "@/components/layout/UserSync";
import { Button } from "@/components/ui/button";

export function AppShell() {
  const { user, isLoading, signIn, signOut } = useAuth();
  const { isLoading: isConvexAuthLoading, isAuthenticated } = useConvexAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCallback = pathname === "/callback";

  if ((isLoading || (user && isConvexAuthLoading)) && !isCallback) {
    return <ShellSkeleton />;
  }

  if (!user && !isCallback) {
    return <SignInScreen />;
  }

  // AuthKit can resolve the user before its JWT has reached Convex. Keep
  // authenticated routes unmounted until Convex can authorize their queries.
  if (user && !isAuthenticated && !isCallback) {
    return <AuthConnectionError onSignOut={() => void signOut()} />;
  }

  const userProp = user
    ? {
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          undefined,
        email: user.email,
        avatarUrl: user.profilePictureUrl ?? undefined,
      }
    : null;

  return (
    <div className="workspace-app">
      {user && <UserSync />}
      <Navbar
        user={userProp}
        onSignIn={() => void signIn()}
        onSignOut={() => void signOut()}
      />
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}

function AuthConnectionError({ onSignOut }: { onSignOut: () => void }) {
  return (
    <main className="root-error-page">
      <section className="root-error-card">
        <span className="root-error-icon">
          <TriangleAlert size={19} />
        </span>
        <p className="page-kicker">Sign-in interrupted</p>
        <h1>Waypoint could not verify your session</h1>
        <p>
          We couldn’t connect your session to your workspace. Reload to try
          again, or sign out and start a fresh session.
        </p>
        <div>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> Reload app
          </Button>
          <Button variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}

function ShellSkeleton() {
  return (
    <div
      className="workspace-app shell-loading"
      role="status"
      aria-label="Loading Waypoint"
    >
      <aside className="workspace-sidebar">
        <div className="loading-brand" />
        <div className="loading-nav" />
        <div className="loading-nav" />
        <div className="loading-nav" />
      </aside>
      <div className="workspace-topbar" />
      <main className="app-main">
        <div className="loading-title" />
        <div className="loading-line" />
        <div className="loading-panel" />
      </main>
    </div>
  );
}
