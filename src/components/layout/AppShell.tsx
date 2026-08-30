import { useAuth } from "@workos-inc/authkit-react";
import { useRouterState } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { SignInScreen } from "@/components/layout/SignInScreen";
import { UserSync } from "@/components/layout/UserSync";

export function AppShell() {
  const { user, isLoading, signIn, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCallback = pathname === "/callback";

  if (isLoading && !isCallback) {
    return <ShellSkeleton />;
  }

  if (!user && !isCallback) {
    return <SignInScreen />;
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
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {user && <UserSync />}
      <Navbar
        user={userProp}
        onSignIn={() => void signIn()}
        onSignOut={() => void signOut()}
      />
      <main className="app-main mx-auto max-w-[1500px] px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="h-12 border-b border-[hsl(var(--nav-border))] bg-[hsl(var(--nav-bg))]">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-3 px-4">
          <div className="h-6 w-6 rounded-[var(--radius-sm)] bg-[hsl(var(--surface-raised))]" />
          <div className="h-4 w-24 rounded bg-[hsl(var(--surface-raised))]" />
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 py-6 animate-pulse">
        <div className="h-7 w-48 rounded bg-[hsl(var(--surface-raised))]" />
        <div className="mt-2 h-4 w-32 rounded bg-[hsl(var(--surface-raised))]" />
      </div>
    </div>
  );
}
