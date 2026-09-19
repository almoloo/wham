import { describe, expect, it, vi } from "vitest";
import { AUTH_COPY } from "@/lib/copy/auth";
import { BackendError, createHttpAuthBackend } from "./backend";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const profile = {
  address: "0x7A3f9C2e1B4d8A6f0C5e3D9b2A1f4E8c7D6b5A40",
  displayName: null,
  ensName: null,
  avatarSeed: "7A3f9C2e",
  email: null,
  emailVerified: false,
  telegramHandle: null,
  timezone: "UTC",
  locale: "en",
  firstLogin: false,
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

const backendWith = (fetchImpl: typeof fetch) => createHttpAuthBackend("http://api.test/", fetchImpl);

async function caught(promise: Promise<unknown>): Promise<BackendError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(BackendError);
  return error as BackendError;
}

describe("createHttpAuthBackend", () => {
  it("calls /v1/auth/<path> under the base URL with the token as a Bearer header", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json(profile));
    const result = await backendWith(fetchImpl).session("tok_123");

    expect(result.address).toBe(profile.address);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("http://api.test/v1/auth/session");
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer tok_123");
    expect(init?.cache).toBe("no-store");
  });

  it("POSTs the verify body as JSON and sends no Authorization header", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      json({ token: "t", expiresAt: "2026-09-27T09:14:38Z", user: profile }),
    );
    await backendWith(fetchImpl).verify({ message: "m", signature: "0xabc" }, { expectedDomain: "x" });

    const [, init] = fetchImpl.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ message: "m", signature: "0xabc" });
    expect((init?.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it("relays the backend's own §6.10 error envelope untouched, including its status", async () => {
    const envelope = { error: { code: "NONCE_INVALID", message: "Backend copy.", traceId: "t-1" } };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json(envelope, 401));

    const error = await caught(backendWith(fetchImpl).getNonce());
    expect(error.status).toBe(401);
    expect(error.body).toEqual(envelope);
  });

  it("treats logout's 204 as success", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    await expect(backendWith(fetchImpl).logout("tok")).resolves.toBeUndefined();
  });

  describe("failures become a calm INTERNAL envelope", () => {
    const expectInternal = (error: BackendError) => {
      expect(error.status).toBe(502);
      expect(error.body.error.code).toBe("INTERNAL");
      expect(error.body.error.message).toBe(AUTH_COPY.backendUnavailable);
      expect(error.body.error.traceId).toMatch(/^bff-/);
    };

    it("when the backend is unreachable", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
      expectInternal(await caught(backendWith(fetchImpl).getNonce()));
    });

    it("when an error response is not a valid envelope", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("<html>bad gateway</html>", { status: 500 }));
      expectInternal(await caught(backendWith(fetchImpl).getNonce()));
    });

    it("when a 200 response is not JSON", async () => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok", { status: 200 }));
      expectInternal(await caught(backendWith(fetchImpl).getNonce()));
    });

    it("when a 200 response breaks the contract (missing firstLogin)", async () => {
      const { firstLogin: _omitted, ...drifted } = profile;
      void _omitted;
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json(drifted));
      expectInternal(await caught(backendWith(fetchImpl).session("tok")));
    });
  });
});
