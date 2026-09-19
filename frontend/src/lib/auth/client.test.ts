import { describe, expect, it, vi } from "vitest";
import { AUTH_COPY } from "@/lib/copy/auth";
import { AuthRequestError, fetchNonce, fetchSession, postLogout, postVerify } from "./client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const user = {
  address: "0x7A3f9C2e1B4d8A6f0C5e3D9b2a1f4e8c7d6B5A40",
  displayName: null,
  ensName: null,
  avatarSeed: "7A3f9C2e",
  email: null,
  emailVerified: false,
  telegramHandle: null,
  timezone: "UTC",
  locale: "en",
  firstLogin: true,
  createdAt: "2026-09-20T09:14:38Z",
  preferences: {
    notifyPaymentDueHours: [72, 24, 4],
    notifyBidWindow: true,
    notifyRoundSettled: true,
    channelEmail: false,
    channelTelegram: false,
    channelInApp: true,
  },
};

const stub = (response: Response) => vi.fn<typeof fetch>().mockResolvedValue(response);

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (e: unknown) => e,
  );
}

describe("fetchSession", () => {
  it("returns the user for a 200", async () => {
    expect((await fetchSession(stub(json(user))))?.address).toBe(user.address);
  });

  it("returns null — signed out, not an error — for a 401", async () => {
    const body = { error: { code: "UNAUTHENTICATED", message: "Please sign in to continue.", traceId: "t" } };
    await expect(fetchSession(stub(json(body, 401)))).resolves.toBeNull();
  });

  it("throws, rather than reporting signed-out, on a transient 5xx", async () => {
    // A blip must not look like a logout: the caller keeps its last known user.
    const error = await rejection(fetchSession(stub(json({ error: { code: "INTERNAL", message: "Try later.", traceId: "t" } }, 502))));
    expect(error).toBeInstanceOf(AuthRequestError);
    expect((error as AuthRequestError).code).toBe("INTERNAL");
    expect((error as AuthRequestError).message).toBe("Try later.");
  });

  it("throws on a 200 that breaks the contract", async () => {
    const { firstLogin: _omitted, ...drifted } = user;
    void _omitted;
    expect(await rejection(fetchSession(stub(json(drifted))))).toBeInstanceOf(Error);
  });

  it("asks the BFF not to cache", async () => {
    const fetchImpl = stub(json(user));
    await fetchSession(fetchImpl);
    expect(fetchImpl.mock.calls[0]).toEqual(["/api/bff/session", { cache: "no-store" }]);
  });
});

describe("fetchNonce", () => {
  const nonce = { nonce: "8jK2mQ9pXvR4tN7wZ3bL", issuedAt: "2026-09-20T09:14:02Z", expiresAt: "2026-09-20T09:24:02Z" };

  it("parses the §7.1 nonce", async () => {
    expect((await fetchNonce(stub(json(nonce)))).nonce).toBe(nonce.nonce);
  });

  it("surfaces the backend's message when the BFF errors", async () => {
    const error = await rejection(
      fetchNonce(stub(json({ error: { code: "RATE_LIMITED", message: "Slow down a moment.", traceId: "t" } }, 429))),
    );
    expect((error as AuthRequestError).message).toBe("Slow down a moment.");
    expect((error as AuthRequestError).status).toBe(429);
  });

  it("falls back to the calm copy when an error is not a valid envelope", async () => {
    const error = await rejection(fetchNonce(stub(new Response("<html>boom</html>", { status: 500 }))));
    expect((error as AuthRequestError).message).toBe(AUTH_COPY.backendUnavailable);
    expect((error as AuthRequestError).code).toBeNull();
  });
});

describe("postVerify", () => {
  it("POSTs JSON and returns the user — never a token", async () => {
    const fetchImpl = stub(json({ user }));
    const result = await postVerify({ message: "m", signature: "0xabc123" }, fetchImpl);

    expect(result.address).toBe(user.address);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/bff/verify");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ message: "m", signature: "0xabc123" });
  });

  it("throws the backend's own message on a failed verify", async () => {
    const body = { error: { code: "NONCE_INVALID", message: "That sign-in request expired. Please try again.", traceId: "t" } };
    const error = await rejection(postVerify({ message: "m", signature: "0xabc123" }, stub(json(body, 401))));
    expect((error as AuthRequestError).code).toBe("NONCE_INVALID");
    expect((error as AuthRequestError).message).toBe("That sign-in request expired. Please try again.");
  });
});

describe("postLogout", () => {
  it("resolves on 204", async () => {
    await expect(postLogout(stub(new Response(null, { status: 204 })))).resolves.toBeUndefined();
  });

  it("rejects when the BFF is unreachable so the caller can decide", async () => {
    const down = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
    expect(await rejection(postLogout(down))).toBeInstanceOf(TypeError);
  });
});
