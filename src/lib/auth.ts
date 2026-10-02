import { useAuth as useAuthKit } from "@workos/authkit-tanstack-react-start/client";
import { useCallback, useEffect } from "react";

const SESSION_CHANNEL = "waypoint-session";

/** Recheck the first-party cookie when another tab explicitly signs out. */
export function SessionSync() {
  const { getAuth } = useAuthKit();
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(SESSION_CHANNEL);
    channel.onmessage = (event) => {
      if (event.data === "signed-out") void getAuth();
    };
    return () => channel.close();
  }, [getAuth]);
  return null;
}

function beginSignIn(screen: "sign-in" | "sign-up") {
  const returnTo = window.location.pathname + window.location.search;
  window.location.assign(`/auth/${screen}?returnTo=${encodeURIComponent(returnTo)}`);
}

const signIn = () => beginSignIn("sign-in");
const signUp = () => beginSignIn("sign-up");

/** Keep feature components independent of the transport that owns the session. */
export function useAuth() {
  const auth = useAuthKit();
  const sdkSignOut = auth.signOut;
  const signOut = useCallback(async () => {
    // WorkOS validates absolute return URLs against the configured redirects.
    await sdkSignOut({ returnTo: window.location.origin + "/" });
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(SESSION_CHANNEL);
      channel.postMessage("signed-out");
      channel.close();
    }
  }, [sdkSignOut]);
  return { ...auth, isLoading: auth.loading, signIn, signUp, signOut };
}
