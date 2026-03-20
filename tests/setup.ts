import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// server-only throws when imported outside Next.js server context.
// In tests (jsdom) we replace it with a no-op so server modules can be imported.
vi.mock("server-only", () => ({}));

// Provide baseline env vars so modules that import config don't throw.
// Individual tests that need to control env state use vi.resetModules() + dynamic imports.
process.env.AUTH_SECRET ??= "test-secret-32-chars-long-minimum!";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.DATABASE_URL ??= "postgresql://test";

// Cleanup after each test
afterEach(() => {
  cleanup();
});
