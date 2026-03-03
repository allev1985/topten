/**
 * Test helper functions for Auth Service tests
 *
 * Provides utility functions for common test setup, assertions,
 * and validation patterns.
 */

import { expect } from "vitest";
import type { Mock } from "vitest";
import { AuthServiceError } from "@/lib/auth/service/errors";

/**
 * Helper to assert that a function throws an AuthServiceError with expected properties
 */
export async function expectAuthServiceError(
  fn: () => Promise<unknown>,
  expectedCode: string,
  expectedMessagePattern?: string | RegExp
) {
  await expect(fn()).rejects.toThrow(AuthServiceError);
  try {
    await fn();
  } catch (error) {
    if (error instanceof AuthServiceError) {
      expect(error.code).toBe(expectedCode);
      if (expectedMessagePattern) {
        if (typeof expectedMessagePattern === "string") {
          expect(error.message).toContain(expectedMessagePattern);
        } else {
          expect(error.message).toMatch(expectedMessagePattern);
        }
      }
    }
  }
}

/**
 * Helper to verify email masking in console logs
 */
export function expectEmailMasked(
  consoleSpy: Mock,
  email: string,
  shouldBeMasked = true
) {
  const calls = consoleSpy.mock.calls.flat().join(" ");

  if (shouldBeMasked) {
    // Should not contain the full email
    expect(calls).not.toContain(email);
    // Should contain masked version
    const masked = email.replace(/@.+$/, "@***");
    expect(calls).toContain(masked.substring(0, 3));
  } else {
    expect(calls).toContain(email);
  }
}

/**
 * Helper to setup console spies for testing logging
 */
export function setupConsoleSpy() {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  return {
    infoSpy,
    errorSpy,
    restore: () => {
      infoSpy.mockRestore();
      errorSpy.mockRestore();
    },
  };
}
