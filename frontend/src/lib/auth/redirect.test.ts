import { describe, expect, it } from "vitest";
import { postSignInNavigation, resolvePostSignInRoute, sanitizeNext, signInUrl } from "./redirect";

describe("sanitizeNext — accepts paths inside the app", () => {
  it.each([
    ["/app", "/app"],
    ["/app/", "/app/"],
    ["/app/circles", "/app/circles"],
    ["/app/calendar?month=2026-10", "/app/calendar?month=2026-10"],
    ["/app/circles/c_9f2a41d0/join", "/app/circles/c_9f2a41d0/join"],
  ])("%s", (input, expected) => {
    expect(sanitizeNext(input)).toBe(expected);
  });

  it("drops the hash, which never reaches a server", () => {
    expect(sanitizeNext("/app/circles#top")).toBe("/app/circles");
  });
});

describe("sanitizeNext — rejects open-redirect and out-of-app targets", () => {
  it.each([
    ["protocol-relative", "//evil.com"],
    ["protocol-relative under /app", "//evil.com/app"],
    ["absolute https", "https://evil.com/app"],
    ["absolute http", "http://evil.com"],
    ["javascript: scheme", "javascript:alert(1)"],
    ["backslash host", "/\\evil.com"],
    ["backslash inside a path", "/app\\..\\evil"],
    ["tab smuggled into //", "/\t/evil.com"],
    ["newline smuggled into //", "/\n/evil.com"],
    ["encoded // (single-decoded form is //evil.com)", "%2F%2Fevil.com"],
    ["double-encoded //", "%252F%252Fevil.com"],
    ["no leading slash", "app/circles"],
    ["dot segments escaping /app", "/app/../evil"],
    ["encoded dot segments escaping /app", "/app/%2e%2e/evil"],
    ["a public route", "/circles"],
    ["the homepage", "/"],
    ["a prefix that is not a segment", "/application"],
    ["/app-like sibling", "/app-admin"],
    ["empty", ""],
    ["whitespace only", "   "],
  ])("%s", (_label, input) => {
    expect(sanitizeNext(input)).toBeNull();
  });

  it("rejects non-strings and absent values", () => {
    expect(sanitizeNext(null)).toBeNull();
    expect(sanitizeNext(undefined)).toBeNull();
    expect(sanitizeNext(42 as unknown as string)).toBeNull();
  });

  it("rejects an absurdly long value", () => {
    expect(sanitizeNext(`/app/${"a".repeat(3000)}`)).toBeNull();
  });
});

describe("resolvePostSignInRoute", () => {
  it("sends a brand-new wallet to onboarding, whatever next says", () => {
    expect(resolvePostSignInRoute({ user: { firstLogin: true }, next: "/app/calendar" })).toBe("/app/onboarding");
    expect(resolvePostSignInRoute({ user: { firstLogin: true } })).toBe("/app/onboarding");
  });

  it("sends a returning wallet to the page they were headed for", () => {
    expect(resolvePostSignInRoute({ user: { firstLogin: false }, next: "/app/calendar?m=10" })).toBe(
      "/app/calendar?m=10",
    );
  });

  it("falls back to the dashboard for a missing or unsafe next", () => {
    expect(resolvePostSignInRoute({ user: { firstLogin: false } })).toBe("/app");
    expect(resolvePostSignInRoute({ user: { firstLogin: false }, next: null })).toBe("/app");
    expect(resolvePostSignInRoute({ user: { firstLogin: false }, next: "//evil.com" })).toBe("/app");
    expect(resolvePostSignInRoute({ user: { firstLogin: false }, next: "https://evil.com" })).toBe("/app");
  });
});

describe("signInUrl", () => {
  it("builds the homepage sign-in URL with an encoded next", () => {
    expect(signInUrl("/app/calendar")).toBe("/?signin=1&next=%2Fapp%2Fcalendar");
    expect(signInUrl("/app/circles?tab=active")).toBe("/?signin=1&next=%2Fapp%2Fcircles%3Ftab%3Dactive");
  });

  it("round-trips through sanitizeNext", () => {
    const url = new URL(signInUrl("/app/circles?tab=active&page=2"), "http://x");
    expect(sanitizeNext(url.searchParams.get("next"))).toBe("/app/circles?tab=active&page=2");
  });
});

describe("postSignInNavigation", () => {
  const returning = { firstLogin: false };

  it("replaces the history entry when sign-in started from ?signin=1, so Back can't return to it", () => {
    expect(postSignInNavigation({ user: returning, search: "?signin=1&next=%2Fapp%2Fcalendar" })).toEqual({
      to: "/app/calendar",
      method: "replace",
    });
  });

  it("pushes for a plain sign-in with no signin param", () => {
    expect(postSignInNavigation({ user: returning, search: "" })).toEqual({ to: "/app", method: "push" });
  });

  it("sends a new wallet to onboarding whatever next says, still replacing", () => {
    expect(postSignInNavigation({ user: { firstLogin: true }, search: "?signin=1&next=%2Fapp%2Fcalendar" })).toEqual({
      to: "/app/onboarding",
      method: "replace",
    });
  });

  it("falls back to the dashboard for an unsafe next", () => {
    expect(postSignInNavigation({ user: returning, search: "?signin=1&next=%2F%2Fevil.com" })).toEqual({
      to: "/app",
      method: "replace",
    });
  });
});
