import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/callback")({
  component: CallbackPage,
});

/**
 * WorkOS redirects here after authentication.
 * AuthKit handles the token exchange; we then return to the dashboard.
 */
function CallbackPage() {
  const { isLoading, user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      void navigate({ to: "/" });
    }
  }, [isLoading, user, navigate]);

  if (!isLoading && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Sign-in did not complete.
          </p>
          <Button onClick={() => void signIn()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]" />
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Signing you in…
        </p>
      </div>
    </div>
  );
}
