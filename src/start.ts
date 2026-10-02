import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { authkitMiddleware } from "@workos/authkit-tanstack-react-start";

// Auth responses (including token RPCs) must never be cached by a CDN.
const privateResponses = createMiddleware().server(async ({ next }) => {
  const result = await next();
  result.response.headers.set("Cache-Control", "private, no-store");
  return result;
});

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" }),
    privateResponses,
    authkitMiddleware(),
  ],
}));
