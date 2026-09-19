import { beforeEach, describe, expect, it } from "vitest";
import { generateSiweNonce, createSiweMessage } from "viem/siwe";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { APP_CHAIN } from "@/lib/chain";
import { verifyResponseSchema } from "@/lib/schema/auth";
import { parseApi } from "@/lib/schema/common";
import { BackendError, type AuthBackend } from "./backend";
import { createMockAuthBackend } from "./backend.mock";

const DOMAIN = "localhost:3000";
const MINUTE = 60_000;

let clock: Date;
let backend: AuthBackend;

beforeEach(() => {
  clock = new Date("2026-09-20T09:00:00Z");
  backend = createMockAuthBackend({ now: () => clock });
});

const advance = (ms: number) => {
  clock = new Date(clock.getTime() + ms);
};

const newAccount = () => privateKeyToAccount(generatePrivateKey());

function siweMessage(
  address: `0x${string}`,
  nonce: string,
  overrides: Partial<Parameters<typeof createSiweMessage>[0]> = {},
) {
  return createSiweMessage({
    domain: DOMAIN,
    address,
    statement: "Sign in to Wham.",
    uri: `http://${DOMAIN}`,
    version: "1",
    chainId: APP_CHAIN.id,
    nonce,
    issuedAt: clock,
    expirationTime: new Date(clock.getTime() + 10 * MINUTE),
    ...overrides,
  });
}

/** Run the whole happy path for `account`, returning what verify returned. */
async function signIn(account: ReturnType<typeof newAccount>) {
  const { nonce } = await backend.getNonce();
  const message = siweMessage(account.address, nonce);
  const signature = await account.signMessage({ message });
  return backend.verify({ message, signature }, { expectedDomain: DOMAIN });
}

/** Assert a promise rejects with a BackendError carrying `code`. */
async function expectCode(promise: Promise<unknown>, code: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(BackendError);
  expect((error as BackendError).body.error.code).toBe(code);
}

describe("verify — accepts a real signature", () => {
  it("returns a contract-valid session for a correctly signed message", async () => {
    const account = newAccount();
    const result = await signIn(account);

    // The stand-in must honour the same schema the real backend is held to.
    const parsed = parseApi(verifyResponseSchema, result);
    expect(parsed.user.address).toBe(account.address);
    expect(parsed.user.firstLogin).toBe(true);
    expect(new Date(parsed.expiresAt).getTime()).toBe(clock.getTime() + 7 * 24 * 60 * MINUTE);
  });

  it("reports firstLogin on the first sign-in only, and session() agrees", async () => {
    const account = newAccount();
    const first = await signIn(account);
    expect(first.user.firstLogin).toBe(true);
    // Still true when read back — the BFF's redirect decision reads session().
    expect((await backend.session(first.token)).firstLogin).toBe(true);

    const second = await signIn(account);
    expect(second.user.firstLogin).toBe(false);
    expect((await backend.session(second.token)).firstLogin).toBe(false);
    expect((await signIn(newAccount())).user.firstLogin).toBe(true);
  });
});

describe("verify — rejects what the real backend must reject", () => {
  it("(a) rejects a nonce that was never issued", async () => {
    const account = newAccount();
    const message = siweMessage(account.address, generateSiweNonce());
    const signature = await account.signMessage({ message });
    await expectCode(backend.verify({ message, signature }, { expectedDomain: DOMAIN }), "NONCE_INVALID");
  });

  it("rejects a nonce used twice", async () => {
    const account = newAccount();
    const { nonce } = await backend.getNonce();
    const message = siweMessage(account.address, nonce);
    const signature = await account.signMessage({ message });
    await backend.verify({ message, signature }, { expectedDomain: DOMAIN });
    await expectCode(backend.verify({ message, signature }, { expectedDomain: DOMAIN }), "NONCE_INVALID");
  });

  it("rejects a nonce older than 10 minutes", async () => {
    const account = newAccount();
    const { nonce } = await backend.getNonce();
    const message = siweMessage(account.address, nonce, { expirationTime: new Date(clock.getTime() + 60 * MINUTE) });
    const signature = await account.signMessage({ message });
    advance(11 * MINUTE);
    await expectCode(backend.verify({ message, signature }, { expectedDomain: DOMAIN }), "NONCE_INVALID");
  });

  it("(b) rejects a signature from a different address than the message claims", async () => {
    const claimed = newAccount();
    const attacker = newAccount();
    const { nonce } = await backend.getNonce();
    const message = siweMessage(claimed.address, nonce);
    const signature = await attacker.signMessage({ message });
    await expectCode(backend.verify({ message, signature }, { expectedDomain: DOMAIN }), "ADDRESS_MISMATCH");
  });

  it("(c) rejects an expired message even with a live nonce", async () => {
    const account = newAccount();
    const { nonce } = await backend.getNonce();
    const message = siweMessage(account.address, nonce, { expirationTime: new Date(clock.getTime() - 1000) });
    const signature = await account.signMessage({ message });
    await expectCode(backend.verify({ message, signature }, { expectedDomain: DOMAIN }), "SIGNATURE_INVALID");
  });

  it("rejects a message with no expiry", async () => {
    const account = newAccount();
    const { nonce } = await backend.getNonce();
    const message = siweMessage(account.address, nonce, { expirationTime: undefined });
    const signature = await account.signMessage({ message });
    await expectCode(backend.verify({ message, signature }, { expectedDomain: DOMAIN }), "SIGNATURE_INVALID");
  });

  it("rejects the wrong domain", async () => {
    const account = newAccount();
    const { nonce } = await backend.getNonce();
    const message = siweMessage(account.address, nonce, { domain: "evil.example" });
    const signature = await account.signMessage({ message });
    await expectCode(backend.verify({ message, signature }, { expectedDomain: DOMAIN }), "SIGNATURE_INVALID");
  });

  it("rejects the wrong chain", async () => {
    const account = newAccount();
    const { nonce } = await backend.getNonce();
    const message = siweMessage(account.address, nonce, { chainId: 1 });
    const signature = await account.signMessage({ message });
    await expectCode(backend.verify({ message, signature }, { expectedDomain: DOMAIN }), "SIGNATURE_INVALID");
  });

  it("rejects a malformed signature", async () => {
    const account = newAccount();
    const { nonce } = await backend.getNonce();
    const message = siweMessage(account.address, nonce);
    await expectCode(backend.verify({ message, signature: "0x1234" }, { expectedDomain: DOMAIN }), "SIGNATURE_INVALID");
  });

  it("does not burn the nonce on a failed attempt", async () => {
    const account = newAccount();
    const { nonce } = await backend.getNonce();
    const message = siweMessage(account.address, nonce);
    await expectCode(backend.verify({ message, signature: "0x1234" }, { expectedDomain: DOMAIN }), "SIGNATURE_INVALID");
    const signature = await account.signMessage({ message });
    await expect(backend.verify({ message, signature }, { expectedDomain: DOMAIN })).resolves.toBeDefined();
  });
});

describe("session, refresh, logout", () => {
  it("resolves a live token to the profile, and unknown tokens to UNAUTHENTICATED", async () => {
    const account = newAccount();
    const { token } = await signIn(account);
    expect((await backend.session(token)).address).toBe(account.address);
    await expectCode(backend.session("mock.nope"), "UNAUTHENTICATED");
  });

  it("expires a session after 7 days with SESSION_EXPIRED", async () => {
    const { token } = await signIn(newAccount());
    advance(7 * 24 * 60 * MINUTE + 1);
    await expectCode(backend.session(token), "SESSION_EXPIRED");
  });

  it("refresh issues a new token with a later expiry, and leaves the old one valid", async () => {
    const { token, expiresAt } = await signIn(newAccount());
    advance(6 * 24 * 60 * MINUTE);
    const refreshed = await backend.refresh(token);

    expect(refreshed.token).not.toBe(token);
    expect(new Date(refreshed.expiresAt).getTime()).toBeGreaterThan(new Date(expiresAt).getTime());
    // A stateless JWT can't be revoked, and two tabs may refresh at once.
    await expect(backend.session(token)).resolves.toBeDefined();
    await expect(backend.session(refreshed.token)).resolves.toBeDefined();
  });

  it("logout invalidates the token and is idempotent", async () => {
    const { token } = await signIn(newAccount());
    await backend.logout(token);
    await expectCode(backend.session(token), "UNAUTHENTICATED");
    await expect(backend.logout(token)).resolves.toBeUndefined();
  });
});
