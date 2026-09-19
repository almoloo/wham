import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Same-origin proxy to the .NET API (frontend spec §2.3): keeps the session
  // cookie first-party and CORS out of the picture. Registered only when
  // WHAM_API_URL is set — with NEXT_PUBLIC_USE_MOCKS the browser never reaches
  // the network for /api/v1/*, and an empty destination fails `next dev`.
  // Next evaluates this at build time, so WHAM_API_URL must be present when
  // `next build` runs, not only when the server starts (the BFF reads it again
  // at runtime). A production build without mocks and without it would ship a
  // server with no /api/v1 proxy — which only shows up later as 404s — so fail
  // the build instead.
  async rewrites() {
    const apiUrl = process.env.WHAM_API_URL;
    if (!apiUrl) {
      if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_USE_MOCKS !== "true") {
        throw new Error(
          "WHAM_API_URL is not set. A production build needs it (the /api/v1 rewrite is baked in at " +
            "`next build`): set it as a build arg, or set NEXT_PUBLIC_USE_MOCKS=true for a backend-less build.",
        );
      }
      return [];
    }
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/v1/:path*` }];
  },
};

export default nextConfig;
