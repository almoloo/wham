import { NextRequest, type NextResponse } from "next/server";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getNonce } from "@/app/api/bff/nonce/route";
import { POST as postLogout } from "@/app/api/bff/logout/route";
import { GET as getSession } from "@/app/api/bff/session/route";
import { POST as postVerify } from "@/app/api/bff/verify/route";
import { AUTH_COPY } from "@/lib/copy/auth";
import { APP_CHAIN } from "@/lib/chain";
import { apiErrorSchema } from "@/lib/schema/common";
import { nonceResponseSchema, userProfileSchema } from "@/lib/schema/auth";
import { NONCE_COOKIE, SESSION_COOKIE, SESSION_EXPIRY_COOKIE } from "./constants";
import { needsRefresh } from "./session-cookie";

const ORIGIN = "http://localhost:3000";
const HOUR = 3_600_000;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  // A fresh stand-in per test: it is cached on globalThis so route handlers share it.
  Reflect.deleteProperty(globalThis, "__whamAuthBackend");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const request = (path: string, init: { method?: string; cookies?: Record<string, string>; body?: unknown } = {}) =>
  new NextRequest(`${ORIGIN}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      ...(init.cookies
        ? { cookie: Object.entries(init.cookies).map(([k, v]) => `${k}=${v}`).join("; ") }
        : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

/** Every Set-Cookie on a response, parsed into name → { value, attrs }. */
function setCookies(response: NextResponse) {
  const out: Record<string, { value: string; raw: string }> = {};
  for (const raw of response.headers.getSetCookie()) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    out[pair.slice(0, eq)] = { value: pair.slice(eq + 1), raw };
  }
  return out;
}

async function errorCode(response: NextResponse) {
  return apiErrorSchema.parse(await response.json()).error.code;
}

/** Nonce → sign → verify, exactly as the browser would. */
async function signIn(overrides: { message?: (nonce: string, address: `0x${string}`) => string } = {}) {
  const account = privateKeyToAccount(generatePrivateKey());
  const nonceRes = await getNonce(request("/api/bff/nonce"));
  const { nonce } = nonceResponseSchema.parse(await nonceRes.json());
  const cookies = { [NONCE_COOKIE]: setCookies(nonceRes)[NONCE_COOKIE].value };

  const message =
    overrides.message?.(nonce, account.address) ??
    createSiweMessage({
      domain: "localhost:3000",
      address: account.address,
      statement: "Sign in to Wham.",
      uri: ORIGIN,
      version: "1",
      chainId: APP_CHAIN.id,
      nonce,
      expirationTime: new Date(Date.now() + 10 * 60_000),
    });
  const signature = await account.signMessage({ message });
  const response = await postVerify(request("/api/bff/verify", { method: "POST", cookies, body: { message, signature } }));
  return { account, cookies, response };
}

describe("GET /api/bff/nonce", () => {
  it("returns the §7.1 nonce JSON, no-store, and remembers it in an httpOnly cookie", async () => {
    const response = await getNonce(request("/api/bff/nonce"));
    const body = nonceResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const cookie = setCookies(response)[NONCE_COOKIE];
    expect(cookie.value).toBe(body.nonce);
    expect(cookie.raw).toMatch(/HttpOnly/i);
    expect(cookie.raw).toMatch(/SameSite=lax/i);
    expect(cookie.raw).toMatch(/Path=\/api\/bff/);
  });
});

describe("POST /api/bff/verify", () => {
  it("sets an httpOnly wham_session cookie and never returns the token", async () => {
    const { account, response } = await signIn();
    const cookies = setCookies(response);
    const body = (await response.json()) as { user: unknown };

    expect(response.status).toBe(200);
    expect(userProfileSchema.parse(body.user).address).toBe(account.address);
    expect(JSON.stringify(body)).not.toContain(cookies[SESSION_COOKIE].value);

    expect(cookies[SESSION_COOKIE].raw).toMatch(/HttpOnly/i);
    expect(cookies[SESSION_COOKIE].raw).toMatch(/SameSite=lax/i);
    expect(cookies[SESSION_COOKIE].raw).toMatch(/Path=\//);
    // 7 days, give or take the seconds this test took to run.
    const maxAge = Number(/Max-Age=(\d+)/i.exec(cookies[SESSION_COOKIE].raw)?.[1]);
    expect(maxAge).toBeGreaterThan(7 * 24 * 3600 - 60);
    expect(maxAge).toBeLessThanOrEqual(7 * 24 * 3600);
    // The single-use nonce cookie is retired.
    expect(cookies[NONCE_COOKIE].raw).toMatch(/Max-Age=0/i);
  });

  it("marks the cookies Secure in production only", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const secure = setCookies((await signIn()).response)[SESSION_COOKIE].raw;
    expect(secure).toMatch(/Secure/);

    vi.stubEnv("NODE_ENV", "development");
    Reflect.deleteProperty(globalThis, "__whamAuthBackend");
    const insecure = setCookies((await signIn()).response)[SESSION_COOKIE].raw;
    expect(insecure).not.toMatch(/Secure/);
  });

  it("rejects a message whose nonce is not the one issued to this browser", async () => {
    const { response } = await signIn({
      message: (_nonce, address) =>
        createSiweMessage({
          domain: "localhost:3000",
          address,
          uri: ORIGIN,
          version: "1",
          chainId: APP_CHAIN.id,
          nonce: "someOtherNonce123",
          expirationTime: new Date(Date.now() + 60_000),
        }),
    });

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe("NONCE_INVALID");
    expect(setCookies(response)[SESSION_COOKIE]).toBeUndefined();
  });

  it("rejects a request with no nonce cookie at all", async () => {
    const nonceRes = await getNonce(request("/api/bff/nonce"));
    const { nonce } = nonceResponseSchema.parse(await nonceRes.json());
    const account = privateKeyToAccount(generatePrivateKey());
    const message = createSiweMessage({
      domain: "localhost:3000",
      address: account.address,
      uri: ORIGIN,
      version: "1",
      chainId: APP_CHAIN.id,
      nonce,
      expirationTime: new Date(Date.now() + 60_000),
    });
    const signature = await account.signMessage({ message });

    const response = await postVerify(request("/api/bff/verify", { method: "POST", body: { message, signature } }));
    expect(await errorCode(response)).toBe("NONCE_INVALID");
  });

  it("returns VALIDATION_FAILED for a body that is not { message, signature }", async () => {
    const response = await postVerify(request("/api/bff/verify", { method: "POST", body: { message: "x" } }));
    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe("VALIDATION_FAILED");
  });

  it("relays the stand-in's ADDRESS_MISMATCH for a signature from the wrong wallet", async () => {
    const nonceRes = await getNonce(request("/api/bff/nonce"));
    const { nonce } = nonceResponseSchema.parse(await nonceRes.json());
    const cookies = { [NONCE_COOKIE]: setCookies(nonceRes)[NONCE_COOKIE].value };
    const claimed = privateKeyToAccount(generatePrivateKey());
    const attacker = privateKeyToAccount(generatePrivateKey());
    const message = createSiweMessage({
      domain: "localhost:3000",
      address: claimed.address,
      uri: ORIGIN,
      version: "1",
      chainId: APP_CHAIN.id,
      nonce,
      expirationTime: new Date(Date.now() + 60_000),
    });
    const signature = await attacker.signMessage({ message });

    const response = await postVerify(request("/api/bff/verify", { method: "POST", cookies, body: { message, signature } }));
    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe("ADDRESS_MISMATCH");
    expect(setCookies(response)[SESSION_COOKIE]).toBeUndefined();
  });
});

describe("GET /api/bff/session", () => {
  it("is 401 UNAUTHENTICATED in the §6.10 envelope with no cookie", async () => {
    const response = await getSession(request("/api/bff/session"));
    expect(response.status).toBe(401);
    const { error } = apiErrorSchema.parse(await response.json());
    expect(error.code).toBe("UNAUTHENTICATED");
    expect(error.message).toBe(AUTH_COPY.signInRequired);
  });

  it("returns the profile for a signed-in cookie", async () => {
    const { account, response: verified } = await signIn();
    const cookies = Object.fromEntries(Object.entries(setCookies(verified)).map(([k, v]) => [k, v.value]));

    const response = await getSession(request("/api/bff/session", { cookies }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const user = userProfileSchema.parse(await response.json());
    expect(user.address).toBe(account.address);
    // The redirect decision reads this: a brand-new wallet is still firstLogin.
    expect(user.firstLogin).toBe(true);
  });

  it("clears the cookies when the backend says the session is dead", async () => {
    const response = await getSession(
      request("/api/bff/session", { cookies: { [SESSION_COOKIE]: "mock.not-a-real-token" } }),
    );
    expect(response.status).toBe(401);
    const cookies = setCookies(response);
    expect(cookies[SESSION_COOKIE].raw).toMatch(/Max-Age=0/i);
    expect(cookies[SESSION_EXPIRY_COOKIE].raw).toMatch(/Max-Age=0/i);
  });

  describe("§3.3 sliding renewal", () => {
    async function sessionWithExpiry(expiresAt: number | null) {
      const { response: verified } = await signIn();
      const token = setCookies(verified)[SESSION_COOKIE].value;
      const cookies: Record<string, string> = { [SESSION_COOKIE]: token };
      if (expiresAt !== null) cookies[SESSION_EXPIRY_COOKIE] = new Date(expiresAt).toISOString();
      return { token, response: await getSession(request("/api/bff/session", { cookies })) };
    }

    it("re-issues the token when less than 24h remain", async () => {
      const { token, response } = await sessionWithExpiry(Date.now() + HOUR);
      expect(response.status).toBe(200);
      const renewed = setCookies(response)[SESSION_COOKIE];
      expect(renewed.value).not.toBe(token);
      expect(renewed.raw).toMatch(/HttpOnly/i);
      expect(setCookies(response)[SESSION_EXPIRY_COOKIE]).toBeDefined();
    });

    it("leaves the cookie alone when more than 24h remain", async () => {
      const { response } = await sessionWithExpiry(Date.now() + 5 * 24 * HOUR);
      expect(response.status).toBe(200);
      expect(setCookies(response)[SESSION_COOKIE]).toBeUndefined();
    });

    it("renews when the expiry cookie is missing, to re-establish it", async () => {
      const { response } = await sessionWithExpiry(null);
      expect(setCookies(response)[SESSION_EXPIRY_COOKIE]).toBeDefined();
    });
  });
});

describe("needsRefresh", () => {
  const now = Date.parse("2026-09-20T09:00:00Z");
  it("is due inside 24h, not outside it, and when the expiry is unknown", () => {
    expect(needsRefresh(now + 23 * HOUR, now)).toBe(true);
    expect(needsRefresh(now + 24 * HOUR, now)).toBe(false);
    expect(needsRefresh(now + 6 * 24 * HOUR, now)).toBe(false);
    expect(needsRefresh(null, now)).toBe(true);
  });
});

describe("POST /api/bff/logout", () => {
  it("is 204, expires every cookie, and the session no longer works", async () => {
    const { response: verified } = await signIn();
    const cookies = Object.fromEntries(Object.entries(setCookies(verified)).map(([k, v]) => [k, v.value]));

    const response = await postLogout(request("/api/bff/logout", { method: "POST", cookies }));
    expect(response.status).toBe(204);
    const cleared = setCookies(response);
    expect(cleared[SESSION_COOKIE].raw).toMatch(/Max-Age=0/i);
    expect(cleared[SESSION_EXPIRY_COOKIE].raw).toMatch(/Max-Age=0/i);
    expect(cleared[NONCE_COOKIE].raw).toMatch(/Max-Age=0/i);

    // The old cookie, replayed, is rejected: the token was revoked, not just forgotten.
    const replay = await getSession(request("/api/bff/session", { cookies }));
    expect(replay.status).toBe(401);
  });

  it("still signs the user out when there is nothing to revoke", async () => {
    const response = await postLogout(request("/api/bff/logout", { method: "POST" }));
    expect(response.status).toBe(204);
  });

  it("still clears the cookies when the backend is down", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
    vi.stubEnv("WHAM_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postLogout(
      request("/api/bff/logout", { method: "POST", cookies: { [SESSION_COOKIE]: "tok" } }),
    );
    expect(response.status).toBe(204);
    expect(setCookies(response)[SESSION_COOKIE].raw).toMatch(/Max-Age=0/i);
  });
});

describe("when the .NET backend is unreachable", () => {
  it("answers with the calm INTERNAL envelope, not a bare 500", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
    vi.stubEnv("WHAM_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await getNonce(request("/api/bff/nonce"));
    expect(response.status).toBe(502);
    const { error } = apiErrorSchema.parse(await response.json());
    expect(error.code).toBe("INTERNAL");
    expect(error.message).toBe(AUTH_COPY.backendUnavailable);
  });

  it("does not sign the user out over a transient backend fault", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
    vi.stubEnv("WHAM_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await getSession(request("/api/bff/session", { cookies: { [SESSION_COOKIE]: "tok" } }));
    expect(response.status).toBe(502);
    expect(setCookies(response)[SESSION_COOKIE]).toBeUndefined(); // cookie left intact
  });
});
