import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { parseSiweMessage } from "viem/siwe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_COPY } from "@/lib/copy/auth";
import { APP_CHAIN } from "@/lib/chain";
import type { UserProfile } from "@/types/auth";
import type { Address } from "@/types/common";
import { createWhamAuthAdapter, UnsupportedChainError, type AdapterDeps } from "./adapter";
import type { AuthBackend } from "./backend";
import { createMockAuthBackend } from "./backend.mock";

const HOST = "localhost:3000";
const ORIGIN = `http://${HOST}`;

type Adapter = ReturnType<typeof createWhamAuthAdapter>;
type MessageArgs = Parameters<Adapter["createMessage"]>[0];

/** RainbowKit types createMessage as sync-or-async; ours is sync, so await normalises both. */
const createMessage = async (adapter: Adapter, args: MessageArgs) => await adapter.createMessage(args);

let clock: Date;
let backend: AuthBackend;
let signedIn: UserProfile[];
let endSession: ReturnType<typeof vi.fn<() => Promise<void>>>;

/** The adapter wired straight to the stand-in backend, bypassing only the HTTP hop. */
function makeAdapter(overrides: Partial<AdapterDeps> = {}) {
  return createWhamAuthAdapter({
    getNonce: () => backend.getNonce(),
    verify: async (body) => (await backend.verify(body, { expectedDomain: HOST })).user,
    onSignedIn: (user) => signedIn.push(user),
    endSession,
    location: () => ({ host: HOST, origin: ORIGIN }),
    now: () => clock,
    ...overrides,
  });
}

beforeEach(() => {
  clock = new Date("2026-09-20T09:00:00Z");
  backend = createMockAuthBackend({ now: () => clock });
  signedIn = [];
  endSession = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("createWhamAuthAdapter — the whole flow against the real backend checks", () => {
  it("signs in: getNonce → createMessage → wallet signs → verify", async () => {
    const adapter = makeAdapter();
    const account = privateKeyToAccount(generatePrivateKey());

    const nonce = await adapter.getNonce();
    const message = await createMessage(adapter, { nonce, address: account.address, chainId: APP_CHAIN.id });
    const signature = await account.signMessage({ message });

    await expect(adapter.verify({ message, signature })).resolves.toBe(true);
    expect(signedIn).toHaveLength(1);
    expect(signedIn[0].address).toBe(account.address);
    expect(signedIn[0].firstLogin).toBe(true);
  });

  it("accepts a lower-cased address from the wallet and signs as the checksummed one", async () => {
    const adapter = makeAdapter();
    const account = privateKeyToAccount(generatePrivateKey());
    const nonce = await adapter.getNonce();
    const message = await createMessage(adapter, { nonce, address: account.address.toLowerCase() as Address, chainId: APP_CHAIN.id });

    expect(parseSiweMessage(message).address).toBe(account.address);
    const signature = await account.signMessage({ message });
    await expect(adapter.verify({ message, signature })).resolves.toBe(true);
  });

  it("refuses an address that is not an address", async () => {
    const adapter = makeAdapter();
    await expect(
      createMessage(adapter, { nonce: "abcdefgh1234", address: "not-an-address" as Address, chainId: APP_CHAIN.id }),
    ).rejects.toThrow();
  });

  it("refuses to build a message on an unsupported chain (§3.3)", async () => {
    const adapter = makeAdapter();
    const account = privateKeyToAccount(generatePrivateKey());
    const nonce = await adapter.getNonce();
    const unsupported = APP_CHAIN.id === 421614 ? 42161 : 421614; // the OTHER Arbitrum chain
    for (const chainId of [1, 10, unsupported]) {
      await expect(createMessage(adapter, { nonce, address: account.address, chainId })).rejects.toBeInstanceOf(
        UnsupportedChainError,
      );
    }
  });
});

describe("createMessage — the message the backend will validate (spec §3.2)", () => {
  async function build(over: { chainId?: number } = {}) {
    const adapter = makeAdapter();
    const account = privateKeyToAccount(generatePrivateKey());
    const nonce = await adapter.getNonce();
    const message = await createMessage(adapter, { nonce, address: account.address, chainId: over.chainId ?? APP_CHAIN.id });
    return { message, nonce, account, parsed: parseSiweMessage(message) };
  }

  it("carries the verbatim, load-bearing statement", async () => {
    const { parsed } = await build();
    expect(parsed.statement).toBe(AUTH_COPY.siweStatement);
    expect(parsed.statement).toBe(
      "Sign in to Wham. This signature proves you control this wallet. It does not authorise any transaction or move any funds.",
    );
  });

  it("sets domain, uri, version, chain and nonce from the page and the wallet", async () => {
    const { parsed, nonce } = await build();
    expect(parsed.domain).toBe(HOST);
    expect(parsed.uri).toBe(ORIGIN);
    expect(parsed.version).toBe("1");
    expect(parsed.chainId).toBe(APP_CHAIN.id);
    expect(parsed.nonce).toBe(nonce);
  });

  it("expires exactly when the nonce does, so the message never outlives it", async () => {
    const { parsed } = await build();
    expect(parsed.issuedAt?.toISOString()).toBe(clock.toISOString());
    expect(parsed.expirationTime?.getTime()).toBe(clock.getTime() + 10 * 60_000);
  });

  it("does not stretch expiry when the nonce was issued minutes ago", async () => {
    const adapter = makeAdapter();
    const account = privateKeyToAccount(generatePrivateKey());
    const nonce = await adapter.getNonce(); // expires 09:10
    clock = new Date(clock.getTime() + 4 * 60_000); // the user dawdles 4 minutes
    const { expirationTime } = parseSiweMessage(
      await createMessage(adapter, { nonce, address: account.address, chainId: APP_CHAIN.id }),
    );
    expect(expirationTime?.getTime()).toBe(new Date("2026-09-20T09:10:00Z").getTime());
  });

  it("falls back to a 10-minute lifetime for a nonce it never saw", async () => {
    const adapter = makeAdapter();
    const account = privateKeyToAccount(generatePrivateKey());
    const { expirationTime } = parseSiweMessage(
      await createMessage(adapter, { nonce: "neverIssued1234", address: account.address, chainId: APP_CHAIN.id }),
    );
    expect(expirationTime?.getTime()).toBe(clock.getTime() + 10 * 60_000);
  });
});

describe("verify — RainbowKit is only ever told yes or no", () => {
  it("returns false, does not throw, and does not sign in, when the backend refuses", async () => {
    const adapter = makeAdapter();
    const claimed = privateKeyToAccount(generatePrivateKey());
    const attacker = privateKeyToAccount(generatePrivateKey());
    const nonce = await adapter.getNonce();
    const message = await createMessage(adapter, { nonce, address: claimed.address, chainId: APP_CHAIN.id });
    const signature = await attacker.signMessage({ message });

    await expect(adapter.verify({ message, signature })).resolves.toBe(false);
    expect(signedIn).toHaveLength(0);
  });

  it("returns false for a signature that is not hex", async () => {
    const adapter = makeAdapter();
    await expect(adapter.verify({ message: "m", signature: "not-hex" })).resolves.toBe(false);
    expect(signedIn).toHaveLength(0);
  });

  it("returns false when the request itself fails", async () => {
    const adapter = makeAdapter({ verify: () => Promise.reject(new Error("network down")) });
    await expect(adapter.verify({ message: "m", signature: "0xabc123" })).resolves.toBe(false);
  });
});

describe("signOut", () => {
  it("ends the session — RainbowKit calls this on disconnect but won't flip the status itself", async () => {
    await makeAdapter().signOut();
    expect(endSession).toHaveBeenCalledTimes(1);
  });
});
