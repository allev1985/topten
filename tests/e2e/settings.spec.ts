import { test, expect } from "@playwright/test";

/**
 * E2E tests for the /dashboard/settings page
 *
 * These tests verify:
 * 1. Unauthenticated users are redirected to /login
 *
 * Authenticated journey tests (slug update, name update, password change) will
 * be added once a shared Playwright login helper/fixture is available.
 * See docs/decisions/ for context on the auth fixture approach.
 */

test.describe("Settings Page — Access", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page).toHaveURL(/\/login/);
  });
});
