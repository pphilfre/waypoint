# Waypoint

A private, responsive careers opportunity and application tracker built with React, TanStack Start, Convex and WorkOS AuthKit.

## Development

```bash
pnpm install
pnpm dev
```

Run `pnpm test` for unit tests and `pnpm build` for a production bundle.

## Production deployment

Vercel builds the frontend and Convex deploys the backend. A successful `pnpm build` only verifies the frontend/server bundle; it does not deploy or validate the Convex backend.

Configure these variables in their respective production environments:

| Location | Variable | Value |
| --- | --- | --- |
| Vercel | `VITE_WORKOS_CLIENT_ID` | Production WorkOS client ID |
| Vercel | `VITE_WORKOS_REDIRECT_URI` | `https://your-domain/callback` |
| Convex production | `WORKOS_CLIENT_ID` | The same production WorkOS client ID |

Setting a variable in Vercel does not set it in Convex. In particular, `convex/auth.config.ts` requires `WORKOS_CLIENT_ID` on the Convex deployment itself. Set it through the Convex production dashboard or:

```bash
pnpm exec convex env set WORKOS_CLIENT_ID client_YOUR_PRODUCTION_CLIENT_ID --prod
```

With the production Convex deploy key configured in Vercel (directly or through the integration), use this Vercel build command:

```bash
pnpm exec convex deploy --cmd "pnpm build"
```

Convex supplies the frontend deployment URL during the build. Also register the production callback URL and application origin in WorkOS.

If Vercel logs stop after `Ran "pnpm build"` and `Deploying to ...`, inspect the Convex deployment error. The frontend compilation has already completed at that point.
