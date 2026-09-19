import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path in tsconfig.json so tests can import like the app does.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Pure-logic tests only; no DOM. Component tests would opt in per file.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
