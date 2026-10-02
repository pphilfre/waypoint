# Web authentication repair

## Diagnosis

The original web client used `@workos-inc/authkit-react` 0.16.2 and
`@workos-inc/authkit-js` 0.20.2 with no `apiHostname`. That SDK defaults to
`api.workos.com`; only localhost/127.0.0.1 automatically enable development
refresh-token storage. At the public `waypoint.freddiephilpot.dev` hostname it
used cookies. There was no custom Authentication API domain. The authorization
code exchange could populate in-memory user/token state, but the application
could not reliably restore or refresh that session on its own origin. The SDK
initialization explicitly checks a readable `workos-has-session` cookie before
restoring cookie-based sessions. A cookie from api.workos.com is not readable on
freddiephilpot.dev. Enabling development token storage on a public deployment
would hide the architecture error instead of fixing it.

The root provider already lived above route content and navigation already used
TanStack Links. No route code cleared the session. Protected pages waited for
both AuthKit and Convex; they did not have an SSR-authenticated session. The
existing `@convex-dev/workos` 0.0.3 adapter also discarded Convex's forced-refresh
flag. This was a separate refresh-contract defect, not evidence that navigation
itself was calling sign-out.

During real local testing, Convex development trusted client
`client_01M1F75GP6SFC46JWH8D25TGEE`, while the existing local WorkOS credentials
used `client_01M16YC01GWWC4K8H6YS30JNXQ`. This rejected authenticated requests.
The development variable was corrected and `convex dev --once` deployed the
existing backend/auth configuration. Production's client ID already matched;
its configuration was read but not changed.

## Architecture

The official WorkOS TanStack Start SDK 0.11.1 now owns authorization initiation,
PKCE/state verification, callback exchange, encrypted session cookies, renewal
and logout. The browser calls same-origin server functions for access tokens;
the refresh token remains in the encrypted HTTP-only session. Convex still
validates WorkOS JWTs using the existing issuer/JWKS configuration and every
protected data function still checks ownership.

- `src/start.ts`: AuthKit request middleware, server-function CSRF protection,
  and private/no-store responses.
- `/auth/sign-in` and `/auth/sign-up`: create PKCE only on a navigation action;
  validate the return path to prevent external redirects and auth loops.
- `/callback`: server route sets the session before redirecting to the requested
  page. Missing/invalid callback parameters return to a visible error state.
- Root AuthKit/Convex providers remain mounted across client navigation.
- The Convex bridge maps forced refresh to the SDK's `refresh()` and does not
  interpret token-refresh loading as losing the user session.
- Sign-out clears the cookie and notifies other open tabs through a credential-free
  BroadcastChannel. Other tabs reread the cookie and unmount protected content.

Cookie defaults: `wos-session`, host-only Domain, Path `/`, HttpOnly, SameSite
`lax`, Secure for HTTPS callback URLs. The SDK's default cookie maximum age is
400 days; actual access/session validity remains governed by WorkOS. Leave
`WORKOS_COOKIE_DOMAIN` unset. Use one stable cookie secret for all instances of
an environment. Neither tokens nor secrets are placed in localStorage.

The supported SDK requires TanStack Start >=1.168.25. Start/router dependencies
were updated and pinned. Real testing exposed the old Nitro 3.0.1-alpha.0 request
adapter aborting POSTs on request-body close; it broke refresh and sign-out RPCs.
Nitro was updated to 3.0.260903-beta and its obsolete alpha-only Windows patch
removed. The new runtime completed both operations in browser testing.

## Verification performed (2 October 2026)

Using a real WorkOS login in the locally served **production build**:

- Existing session opened Overview and client navigation to Applications.
- Browser refresh retained authentication.
- Opening `/companies` directly in another tab restored the same account.
- Restarting the built server retained the browser session.
- Explicit account-menu sign-out completed, the other tab showed sign-in, and
  direct `/companies` navigation after logout showed sign-in.
- Real Convex queries were authorized; the development account's empty lists
  were rendered normally. No test company/application records were created.
- 32 Vitest tests passed, including new navigation/auth-loading/refresh/ownership
  and redirect tests. `pnpm typecheck` and `pnpm build` passed.
- `node scripts/verify-auth-http.mjs` passed against the built server: no-store
  protected SSR, rejection of missing/invalid callbacks, PKCE, and host-only,
  HTTP-only, SameSite=Lax verifier cookies. Set `AUTH_TEST_URL` to test HTTPS.
- Full `pnpm lint` reports 182 errors and 120 warnings in existing UI code.
  A clean HEAD snapshot also fails lint (168 errors without dependency-aware
  analysis). New authentication modules/tests pass targeted lint. No global
  lint rules were disabled to claim success.

The public deployment has **not** received this code. Follow the exact runtime
environment/WorkOS settings in the root README, deploy, then repeat the browser
checks on HTTPS and target browsers (especially Safari). Local verification does
not establish that Vercel's environment variables or HTTPS cookie settings have
been applied. The WorkOS logout configuration currently returns to the public
homepage even from localhost; add the intended local logout redirect when testing.

## Official references

- [WorkOS React SDK](https://workos.com/docs/sdks/authkit-react)
- [WorkOS TanStack Start SDK](https://github.com/workos/authkit-tanstack-start)
- [WorkOS session resilience](https://workos.com/docs/authkit/session-resilience)
- [Convex WorkOS integration](https://docs.convex.dev/auth/authkit/)

Never add an authentication bypass to verify the UI. An authenticated shell is
not proof of backend authorization; check that Convex data actually loads.
