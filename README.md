# Waypoint

A private, responsive careers opportunity and application tracker built with React, TanStack Start, Convex and WorkOS AuthKit.

## Development

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and fill in the existing WorkOS and Convex
environment values. Use Node 22.12+ and pnpm 10.20.0. Run `pnpm test`,
`pnpm typecheck`, `pnpm lint`, and `pnpm build` for validation. The repository
currently has pre-existing lint violations; the lint command reports them.

Web authentication uses the official WorkOS TanStack Start SDK. The server owns
an encrypted, HTTP-only `wos-session` cookie; browser storage is not used for
refresh tokens. See [authentication diagnosis and verification](docs/web-authentication.md).

## Production deployment

Vercel builds the frontend and Convex deploys the backend. A successful `pnpm build` only verifies the frontend/server bundle; it does not deploy or validate the Convex backend.

Configure these variables in their respective production environments:

| Location | Variable | Value |
| --- | --- | --- |
| Vercel (server runtime) | `WORKOS_CLIENT_ID` | WorkOS client ID for this environment |
| Vercel (server runtime, sensitive) | `WORKOS_API_KEY` | API key from that same WorkOS environment |
| Vercel (server runtime, sensitive) | `WORKOS_COOKIE_PASSWORD` | Stable random secret, at least 32 characters |
| Vercel (server runtime) | `WORKOS_REDIRECT_URI` | `https://waypoint.freddiephilpot.dev/callback` |
| Vercel (build) | `VITE_CONVEX_URL` | URL of the matching Convex deployment, normally injected by `convex deploy` |
| Convex deployment | `WORKOS_CLIENT_ID` | The **same** client ID used by the Vercel server |

The former `VITE_WORKOS_CLIENT_ID` and `VITE_WORKOS_REDIRECT_URI` are no longer
used. Keep `WORKOS_COOKIE_DOMAIN` unset (host-only cookie), and keep SameSite at
its default `lax`. HTTPS callbacks produce Secure cookies. Do not rotate the
cookie password on every deployment: that invalidates existing sessions.

Setting a variable in Vercel does not set it in Convex. In particular, `convex/auth.config.ts` requires `WORKOS_CLIENT_ID` on the Convex deployment itself. Set it through the Convex production dashboard or:

```bash
pnpm exec convex env set WORKOS_CLIENT_ID client_YOUR_PRODUCTION_CLIENT_ID --prod
```

With the production Convex deploy key configured in Vercel (directly or through the integration), use this Vercel build command:

```bash
pnpm exec convex deploy --cmd "pnpm build"
```

Convex supplies the frontend deployment URL during the build. In the matching
WorkOS environment, register `https://waypoint.freddiephilpot.dev/callback` as a
Redirect URI, `https://waypoint.freddiephilpot.dev/auth/sign-in` as the Initiate
login URI, and `https://waypoint.freddiephilpot.dev/` as an allowed sign-out
redirect/app homepage. Keep `http://localhost:3000/callback` registered for local
verification. Preview hosts need their own exact registered callback URI and
matching `WORKOS_REDIRECT_URI`; do not mix localhost and public callback URLs.

A public deployment can use a WorkOS development environment for testing. It
does not need a custom WorkOS API domain with this server-session integration.
Never put the API key or cookie password into frontend (`VITE_`) variables.

If Vercel logs stop after `Ran "pnpm build"` and `Deploying to ...`, inspect the Convex deployment error. The frontend compilation has already completed at that point.
