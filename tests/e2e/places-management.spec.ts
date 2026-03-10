import { test, expect } from "@playwright/test";

/**
 * E2E tests for the /dashboard/places page (spec 007-places-management)
 *
 * These tests verify:
 * 1. Unauthenticated users are redirected to /login
 *
 * Authenticated journey tests (add, edit, delete a place) will be added
 * once a shared Playwright login helper/fixture is available.
 * See docs/decisions/ for context on the auth fixture approach.
 */

test.describe("My Places — Access", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/dashboard/places");

    await expect(page).toHaveURL(/\/login/);
  });
});
