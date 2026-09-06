type AuthContext = {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
};

/** Require a validated WorkOS JWT and return its user id. */
export async function requireUserId(ctx: AuthContext, claimedUserId?: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  if (claimedUserId && identity.subject !== claimedUserId) {
    throw new Error("Not authorized");
  }
  return identity.subject;
}
