import { useEffect } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * Syncs the WorkOS profile into Convex on login.
 */
export function UserSync() {
  const { user } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;

    void upsertUser({
      workosUserId: user.id,
      email: user.email,
      name,
      avatarUrl: user.profilePictureUrl ?? undefined,
    }).catch((error: unknown) => {
      console.error("Failed to sync user to Convex", error);
    });
  }, [isAuthenticated, user, upsertUser]);

  return null;
}
