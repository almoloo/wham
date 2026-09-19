import { UserRejectedRequestError } from "viem";
import { describe, expect, it } from "vitest";
import { signMessageMutationOptions } from "wagmi/query";
import { isUserRejection, SIGN_MESSAGE_MUTATION_KEY } from "./wallet-errors";

describe("isUserRejection", () => {
  it("recognises viem's UserRejectedRequestError", () => {
    expect(isUserRejection(new UserRejectedRequestError(new Error("User rejected the request.")))).toBe(true);
  });

  it("recognises EIP-1193 code 4001 on a plain object or error", () => {
    expect(isUserRejection({ code: 4001 })).toBe(true);
    expect(isUserRejection(Object.assign(new Error("rejected"), { code: 4001 }))).toBe(true);
  });

  it("finds a rejection wrapped in `cause`", () => {
    const wrapped = new Error("Request failed", { cause: Object.assign(new Error("nope"), { code: 4001 }) });
    expect(isUserRejection(wrapped)).toBe(true);
    const doubly = new Error("outer", { cause: new Error("middle", { cause: { name: "UserRejectedRequestError" } }) });
    expect(isUserRejection(doubly)).toBe(true);
  });

  it("does not mistake other failures for a rejection", () => {
    expect(isUserRejection(new Error("network down"))).toBe(false);
    expect(isUserRejection({ code: 4100 })).toBe(false); // unauthorised, not rejected
    expect(isUserRejection({ code: -32603 })).toBe(false); // internal error
    expect(isUserRejection("User rejected the request")).toBe(false);
  });

  it("handles null, undefined and primitives", () => {
    expect(isUserRejection(null)).toBe(false);
    expect(isUserRejection(undefined)).toBe(false);
    expect(isUserRejection(4001)).toBe(false);
  });

  it("terminates on a cyclic cause chain", () => {
    const a: { cause?: unknown } = {};
    const b: { cause?: unknown } = { cause: a };
    a.cause = b;
    expect(isUserRejection(a)).toBe(false);
  });
});

describe("SIGN_MESSAGE_MUTATION_KEY — the wagmi internal useSignInCancelled depends on", () => {
  it("is the key wagmi actually files signature requests under", () => {
    // wagmi's useSignMessage builds its mutation from these options. If an
    // upgrade renames the key, the "Sign-in cancelled" message would silently
    // stop appearing — fail here instead.
    const options = signMessageMutationOptions({} as Parameters<typeof signMessageMutationOptions>[0]);
    expect(options.mutationKey).toEqual([...SIGN_MESSAGE_MUTATION_KEY]);
  });
});
