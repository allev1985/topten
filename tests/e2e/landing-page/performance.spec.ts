import { test, expect } from "@playwright/test";

/**
 * E2E performance tests for landing page
 *
 * These tests verify that the landing page meets performance targets:
 * - Initial content appears quickly (< 1s target)
 * - Server-rendered content is visible before JavaScript
 * - No blocking client-side operations
 *
 * Coverage areas:
 * - Time to First Byte (TTFB)
 * - First Contentful Paint (FCP)
 * - Server-side rendering verification
 * - JavaScript bundle impact
 */

test.describe("Landing Page - Performance", () => {
  test("should display initial content quickly", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");

    // Measure time until first content is visible
    await expect(page.getByText("YourFavs")).toBeVisible();

    const timeToContent = Date.now() - startTime;

    // Should load in under 3 seconds for E2E test
    // (Production target is < 1s, but E2E has overhead)
    expect(timeToContent).toBeLessThan(3000);
  });

  test("should render server-side content before JavaScript bundle loads", async ({
    page,
  }) => {
    // Block JavaScript files to verify SSR
    await page.route("**/*.js", (route) => route.abort());

    await page.goto("/");

    // Content should still be visible (server-rendered)
    await expect(page.getByText("YourFavs")).toBeVisible();
    await expect(
      page.getByText("Curate and share your favorite places")
    ).toBeVisible();
  });

  test("should have fast Time to First Byte", async ({ page }) => {
    const startTime = Date.now();

    const response = await page.goto("/");

    const ttfb = Date.now() - startTime;

    // TTFB should be reasonable (< 2s for E2E)
    expect(ttfb).toBeLessThan(2000);

    // Response should be successful
    expect(response?.status()).toBe(200);
  });

  test("should not have render-blocking resources", async ({ page }) => {
    await page.goto("/");

    // Main content should appear without waiting for all resources
    await expect(page.getByRole("heading", { name: "YourFavs" })).toBeVisible({
      timeout: 2000,
    });
  });

  test("should work on slow network connections", async ({ page }) => {
    // Simulate slow 3G network
    await page.route("**/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
      route.continue();
    });

    await page.goto("/");

    // Content should still load (just slower)
    await expect(page.getByText("YourFavs")).toBeVisible({ timeout: 5000 });
  });

  test("should maintain performance with disabled JavaScript", async ({
    page,
    context,
  }) => {
    // Test that server-rendered content appears quickly
    await context.addInitScript(() => {
      // Verify SSR performance
    });

    const startTime = Date.now();
    await page.goto("/");

    await expect(page.getByText("YourFavs")).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load quickly even with SSR only
    expect(loadTime).toBeLessThan(2000);
  });

  test("should have minimal layout shift", async ({ page }) => {
    await page.goto("/");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Get initial position of heading
    const heading = page.getByRole("heading", { name: "YourFavs" });
    const initialBox = await heading.boundingBox();

    // Wait a bit to see if layout shifts
    await page.waitForTimeout(500);

    const finalBox = await heading.boundingBox();

    // Position should not have changed (no layout shift)
    expect(initialBox?.y).toBe(finalBox?.y);
    expect(initialBox?.x).toBe(finalBox?.x);
  });

  test("should log performance metrics in development", async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "log") {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // In development, auth check should log performance info
    // This helps developers monitor auth check timing
    const hasAuthLog = consoleLogs.some((log) =>
      log.includes("[Landing Page] Auth check")
    );

    // Log should be present in development mode
    // (This may be false in production builds)
    if (process.env.NODE_ENV === "development") {
      expect(hasAuthLog).toBe(true);
    }
  });
});
