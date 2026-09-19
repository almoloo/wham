import { describe, expect, it } from "vitest";
import { ApiContractError, parseApi } from "./common";
import {
  nonceResponseSchema,
  refreshResponseSchema,
  userProfileSchema,
  verifyRequestSchema,
  verifyResponseSchema,
} from "./auth";

// Frontend spec §7.1 — POST /v1/auth/verify response, verbatim.
const verifyFixture = () => ({
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIweDdBM2Y...",
  expiresAt: "2026-09-27T09:14:38Z",
  user: {
    address: "0x7A3f9C2e1B4d8A6f0C5e3D9b2A1f4E8c7D6b5A40",
    displayName: null,
    ensName: "sepehr.eth",
    avatarSeed: "7A3f9C2e",
    email: null,
    emailVerified: false,
    telegramHandle: null,
    timezone: "Asia/Tehran",
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
  },
});

describe("verifyResponseSchema", () => {
  it("accepts the spec §7.1 fixture", () => {
    const parsed = parseApi(verifyResponseSchema, verifyFixture());
    expect(parsed.user.firstLogin).toBe(true);
    expect(parsed.user.ensName).toBe("sepehr.eth");
  });

  it("rejects a profile that omits firstLogin", () => {
    const { firstLogin: _omitted, ...user } = verifyFixture().user;
    void _omitted;
    const result = verifyResponseSchema.safeParse({ ...verifyFixture(), user });
    expect(result.success).toBe(false);
  });

  it("names the failing path when the contract is broken", () => {
    const { firstLogin: _omitted, ...user } = verifyFixture().user;
    void _omitted;
    expect(() => parseApi(verifyResponseSchema, { ...verifyFixture(), user }, "verify")).toThrow(
      /verify does not match its contract: user\.firstLogin/,
    );
  });

  it("rejects an empty token", () => {
    expect(verifyResponseSchema.safeParse({ ...verifyFixture(), token: "" }).success).toBe(false);
  });
});

describe("userProfileSchema: null vs absent", () => {
  it("accepts displayName: null", () => {
    expect(userProfileSchema.safeParse(verifyFixture().user).success).toBe(true);
  });

  it("rejects displayName absent", () => {
    const { displayName: _omitted, ...user } = verifyFixture().user;
    void _omitted;
    expect(userProfileSchema.safeParse(user).success).toBe(false);
  });

  it("rejects email absent, telegramHandle absent and ensName absent", () => {
    for (const key of ["email", "telegramHandle", "ensName"] as const) {
      const user: Record<string, unknown> = { ...verifyFixture().user };
      delete user[key];
      expect(userProfileSchema.safeParse(user).success, key).toBe(false);
    }
  });

  it("rejects a locale outside en | fa", () => {
    expect(userProfileSchema.safeParse({ ...verifyFixture().user, locale: "de" }).success).toBe(false);
  });

  it("rejects a malformed address", () => {
    expect(userProfileSchema.safeParse({ ...verifyFixture().user, address: "0x123" }).success).toBe(false);
    expect(userProfileSchema.safeParse({ ...verifyFixture().user, address: "sepehr.eth" }).success).toBe(false);
  });

  it("accepts a UTC offset as well as Z on createdAt", () => {
    const user = { ...verifyFixture().user, createdAt: "2026-09-20T09:14:38+00:00" };
    expect(userProfileSchema.safeParse(user).success).toBe(true);
  });
});

describe("nonceResponseSchema", () => {
  const fixture = {
    nonce: "8jK2mQ9pXvR4tN7wZ3bL",
    issuedAt: "2026-09-20T09:14:02Z",
    expiresAt: "2026-09-20T09:24:02Z",
  };

  it("accepts the spec §7.1 fixture", () => {
    expect(nonceResponseSchema.safeParse(fixture).success).toBe(true);
  });

  it("rejects a nonce that EIP-4361 would refuse", () => {
    expect(nonceResponseSchema.safeParse({ ...fixture, nonce: "short" }).success).toBe(false);
    expect(nonceResponseSchema.safeParse({ ...fixture, nonce: "has spaces in it!" }).success).toBe(false);
  });
});

describe("verifyRequestSchema", () => {
  it("accepts a hex signature and rejects a non-hex one", () => {
    expect(verifyRequestSchema.safeParse({ message: "m", signature: "0xabc123" }).success).toBe(true);
    expect(verifyRequestSchema.safeParse({ message: "m", signature: "not-hex" }).success).toBe(false);
  });

  it("rejects an empty message", () => {
    expect(verifyRequestSchema.safeParse({ message: "", signature: "0xabc123" }).success).toBe(false);
  });
});

describe("refreshResponseSchema", () => {
  it("accepts { token, expiresAt } and rejects a missing expiresAt", () => {
    expect(refreshResponseSchema.safeParse({ token: "t", expiresAt: "2026-09-27T09:14:38Z" }).success).toBe(true);
    expect(refreshResponseSchema.safeParse({ token: "t" }).success).toBe(false);
  });
});

describe("parseApi", () => {
  it("throws ApiContractError, never returns a partial value", () => {
    expect(() => parseApi(verifyResponseSchema, {})).toThrow(ApiContractError);
  });
});
