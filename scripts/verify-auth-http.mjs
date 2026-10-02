import assert from "node:assert/strict";

// Run against the built server. This never supplies credentials or prints cookies.
const base = new URL(process.env.AUTH_TEST_URL || "http://localhost:3000");
const get = (path) => fetch(new URL(path, base), { redirect: "manual" });

const protectedPage = await get("/companies");
assert.equal(protectedPage.status, 200);
assert.match(protectedPage.headers.get("cache-control"), /no-store/);
assert.match(await protectedPage.text(), /Loading Waypoint/);

const missingCode = await get("/callback");
assert.equal(missingCode.status, 302);
assert.equal(new URL(missingCode.headers.get("location"), base).search, "?authError=1");

const missingVerifier = await get("/callback?code=not-a-real-code&state=invalid");
assert.equal(missingVerifier.status, 302);
assert.equal(new URL(missingVerifier.headers.get("location"), base).search, "?authError=1");

const signIn = await get("/auth/sign-in?returnTo=%2Fcompanies");
assert.equal(signIn.status, 302);
assert.match(signIn.headers.get("cache-control"), /no-store/);
const authorization = new URL(signIn.headers.get("location"));
assert.equal(authorization.protocol, "https:");
assert.equal(authorization.pathname, "/user_management/authorize");
assert.equal(authorization.searchParams.get("code_challenge_method"), "S256");
assert.ok(authorization.searchParams.get("state"));
const cookies = signIn.headers.getSetCookie();
assert.ok(cookies.length > 0);
assert.ok(cookies.some((cookie) => /HttpOnly/i.test(cookie) && /SameSite=Lax/i.test(cookie) && /Path=\//i.test(cookie)));
if (base.protocol === "https:") assert.ok(cookies.every((cookie) => /; Secure/i.test(cookie)));
assert.ok(cookies.every((cookie) => !/; Domain=/i.test(cookie)));

console.log("Auth HTTP checks passed: protected SSR, no-store, rejected callbacks, PKCE and host-only HttpOnly/Lax cookies.");
