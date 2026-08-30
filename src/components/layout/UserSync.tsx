import { useEffect } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * Syncs the WorkOS profile into Convex on login.
 */
export function UserSync() {
  const { user } = useAuth();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (!user) return;

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
  }, [user, upsertUser]);

  return null;
}
