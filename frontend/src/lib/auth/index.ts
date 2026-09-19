import "server-only";
import { createHttpAuthBackend, type AuthBackend } from "./backend";
import { createMockAuthBackend } from "./backend.mock";

export { BackendError, type AuthBackend, type VerifyContext } from "./backend";

/*
 * The single place that decides real API vs in-process stand-in.
 *
 * The instance is cached on `globalThis`, not in a module variable: in
 * `next dev` each route handler can be compiled into its own module graph, so
 * a module-level Map would be empty when /api/bff/verify runs after
 * /api/bff/nonce. That would make the stand-in fail for the wrong reason.
 */
const globalForAuth = globalThis as typeof globalThis & { __whamAuthBackend?: AuthBackend };

export function getAuthBackend(): AuthBackend {
  if (globalForAuth.__whamAuthBackend) return globalForAuth.__whamAuthBackend;

  // TODO(backend): delete this branch and ./backend.mock.ts once /v1/auth/* exists
  // (context/backend-roadmap.md §1).
  // Literal `process.env.NEXT_PUBLIC_*` so Next inlines it at build time.
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    console.warn(
      "[auth] NEXT_PUBLIC_USE_MOCKS is on: using the in-process auth stand-in. " +
        "Signatures are checked, but sessions are NOT real and vanish on restart.",
    );
    return (globalForAuth.__whamAuthBackend = createMockAuthBackend());
  }

  const apiUrl = process.env.WHAM_API_URL;
  if (!apiUrl) {
    throw new Error(
      "WHAM_API_URL is not set. Set it to the .NET API's internal URL, " +
        "or set NEXT_PUBLIC_USE_MOCKS=true to use the in-process auth stand-in.",
    );
  }
  return (globalForAuth.__whamAuthBackend = createHttpAuthBackend(apiUrl));
}
