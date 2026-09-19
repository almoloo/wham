import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "@/types/common";
import { addressSchema, apiErrorSchema, hexSchema } from "./common";

describe("apiErrorSchema", () => {
  const fixture = {
    error: { code: "NONCE_INVALID", message: "That sign-in link expired. Try again.", traceId: "abc123" },
  };

  it("accepts a §6.10 envelope, with or without details", () => {
    expect(apiErrorSchema.safeParse(fixture).success).toBe(true);
    expect(
      apiErrorSchema.safeParse({ error: { ...fixture.error, details: { field: "signature" } } }).success,
    ).toBe(true);
  });

  it("accepts every code in the closed union", () => {
    for (const code of API_ERROR_CODES) {
      expect(apiErrorSchema.safeParse({ error: { ...fixture.error, code } }).success, code).toBe(true);
    }
  });

  it("rejects a code outside the union", () => {
    expect(apiErrorSchema.safeParse({ error: { ...fixture.error, code: "TEAPOT" } }).success).toBe(false);
  });

  it("rejects an envelope without a traceId or a message", () => {
    const { traceId: _t, ...noTrace } = fixture.error;
    void _t;
    const { message: _m, ...noMessage } = fixture.error;
    void _m;
    expect(apiErrorSchema.safeParse({ error: noTrace }).success).toBe(false);
    expect(apiErrorSchema.safeParse({ error: noMessage }).success).toBe(false);
  });
});

describe("addressSchema / hexSchema", () => {
  it("requires exactly 20 bytes for an address", () => {
    expect(addressSchema.safeParse("0x7A3f9C2e1B4d8A6f0C5e3D9b2A1f4E8c7D6b5A40").success).toBe(true);
    expect(addressSchema.safeParse("0x7A3f9C2e1B4d8A6f0C5e3D9b2A1f4E8c7D6b5A4").success).toBe(false);
    expect(addressSchema.safeParse("7A3f9C2e1B4d8A6f0C5e3D9b2A1f4E8c7D6b5A40").success).toBe(false);
    expect(addressSchema.safeParse(42).success).toBe(false);
  });

  it("accepts any-length hex for signatures (EIP-1271 sigs are not 65 bytes)", () => {
    expect(hexSchema.safeParse("0x").success).toBe(true);
    expect(hexSchema.safeParse("0xdeadBEEF").success).toBe(true);
    expect(hexSchema.safeParse("0xnothex").success).toBe(false);
  });
});
