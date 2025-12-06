import { test, expect } from "@playwright/test";

/**
 * E2E tests for dashboard access and navigation
 *
 * These tests verify:
 * 1. Unauthenticated users are redirected to /login
 * 2. Authenticated users can access the dashboard
 * 3. Mobile drawer interactions work correctly
 * 4. Session expiration handling (future enhancement)
 */

test.describe("Dashboard Access - Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test.skip("displays dashboard for authenticated users", async ({ page }) => {
    // TODO: Implement after login flow is available
    // Login first (adjust based on your auth flow)
    await page.goto("/login");
    // await page.fill('input[type="email"]', 'test@example.com');
    // await page.fill('input[type="password"]', 'password123');
    // await page.click('button[type="submit"]');

    // Navigate to dashboard
    await page.goto("/dashboard");

    // Should show dashboard content
    await expect(page.locator("h2")).toContainText("Dashboard");
  });
});

test.describe.skip("Dashboard Access - Mobile Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Login before each test
    // await loginHelper(page);
    await page.goto("/dashboard");
  });

  test("opens mobile drawer on hamburger click", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Click hamburger menu
    await page.click('button[aria-label="Open navigation menu"]');

    // Drawer should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.getByText("YourFavs")).toBeVisible();
  });

  test("closes drawer on outside click", async ({ page }) => {
    // Setup: mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open drawer
    await page.click('button[aria-label="Open navigation menu"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click overlay (outside drawer)
    await page.locator("[data-radix-dialog-overlay]").click();

    // Drawer should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("closes drawer on close button click", async ({ page }) => {
    // Setup: mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open drawer
    await page.click('button[aria-label="Open navigation menu"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click close button (X)
    await page.click('button[aria-label="Close"]');

    // Drawer should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
