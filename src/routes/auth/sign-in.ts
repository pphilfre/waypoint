import { createFileRoute } from "@tanstack/react-router";
import { getSignInUrl } from "@workos/authkit-tanstack-react-start";
import { safeReturnPath } from "@/lib/auth-return-path";

export const Route = createFileRoute("/auth/sign-in")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const returnPathname = safeReturnPath(new URL(request.url).searchParams.get("returnTo"));
        const url = await getSignInUrl({ data: { returnPathname } });
        return new Response(null, { status: 302, headers: { Location: url } });
      },
    },
  },
});
