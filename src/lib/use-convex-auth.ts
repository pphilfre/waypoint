import { useCallback, useMemo } from "react";
import { useAccessToken, useAuth } from "@workos/authkit-tanstack-react-start/client";

export function useConvexAuthKit() {
  const { user, loading } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        return (await (forceRefreshToken ? refresh() : getAccessToken())) ?? null;
      } catch {
        // Convex owns retry/connection state. A network failure is not sign-out.
        return null;
      }
    },
    [getAccessToken, refresh],
  );
  // Token refresh loading must not tear down authenticated subscriptions.
  return useMemo(
    () => ({ isLoading: loading, isAuthenticated: Boolean(user), fetchAccessToken }),
    [loading, user, fetchAccessToken],
  );
}
