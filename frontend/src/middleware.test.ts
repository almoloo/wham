import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { sanitizeNext } from "@/lib/auth/redirect";
import { config, middleware } from "./middleware";

const call = (path: string, cookie?: string) =>
  middleware(new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie } } : undefined));

describe("middleware", () => {
  it("only guards /app and /app/*, leaving every public route open", () => {
    expect(config.matcher).toEqual(["/app/:path*"]);
  });

  it("redirects a visitor with no session cookie to the homepage sign-in", () => {
    const response = call("/app/calendar");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost:3000/?signin=1&next=%2Fapp%2Fcalendar");
  });

  it("guards the dashboard root itself", () => {
    const response = call("/app");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost:3000/?signin=1&next=%2Fapp");
  });

  it("keeps the query string in `next`", () => {
    const response = call("/app/circles?tab=active&page=2");
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/?signin=1&next=%2Fapp%2Fcircles%3Ftab%3Dactive%26page%3D2",
    );
  });

  it("produces a `next` that sanitizeNext round-trips unchanged", () => {
    const location = new URL(call("/app/circles?tab=active").headers.get("location")!);
    expect(sanitizeNext(location.searchParams.get("next"))).toBe("/app/circles?tab=active");
  });

  it("lets a request with a session cookie through", () => {
    const response = call("/app/calendar", `${SESSION_COOKIE}=some-token`);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("treats an empty session cookie as no session", () => {
    // The BFF clears cookies by setting them to "" with Max-Age=0; a client
    // that still sends the empty value must not count as signed in.
    expect(call("/app", `${SESSION_COOKIE}=`).status).toBe(302);
  });

  it("does not treat the other auth cookies as a session", () => {
    expect(call("/app", "wham_nonce=abc; wham_session_exp=2026-09-27T00:00:00Z").status).toBe(302);
  });
});
