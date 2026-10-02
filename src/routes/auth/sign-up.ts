import { createFileRoute } from "@tanstack/react-router";
import { getSignUpUrl } from "@workos/authkit-tanstack-react-start";
import { safeReturnPath } from "@/lib/auth-return-path";

export const Route = createFileRoute("/auth/sign-up")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const returnPathname = safeReturnPath(new URL(request.url).searchParams.get("returnTo"));
        const url = await getSignUpUrl({ data: { returnPathname } });
        return new Response(null, { status: 302, headers: { Location: url } });
      },
    },
  },
});
