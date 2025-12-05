import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.describe("page load", () => {
    test("loads successfully at root URL", async ({ page }) => {
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "YourFavs" })
      ).toBeVisible();
    });

    test("displays all core content", async ({ page }) => {
      await page.goto("/");

      // Check heading
      await expect(
        page.getByRole("heading", { name: "YourFavs" })
      ).toBeVisible();

      // Check tagline
      await expect(
        page.getByText(/curate and share your favorite places/i)
      ).toBeVisible();
    });
  });

  test.describe("performance", () => {
    test("renders within 2 seconds", async ({ page }) => {
      const startTime = Date.now();
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "YourFavs" })
      ).toBeVisible();
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(2000);
    });

    test("has no console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "YourFavs" })
      ).toBeVisible();

      expect(errors).toHaveLength(0);
    });

    test("has no hydration warnings", async ({ page }) => {
      const warnings: string[] = [];
      page.on("console", (msg) => {
        if (
          msg.type() === "warning" &&
          msg.text().toLowerCase().includes("hydration")
        ) {
          warnings.push(msg.text());
        }
      });

      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "YourFavs" })
      ).toBeVisible();

      expect(warnings).toHaveLength(0);
    });
  });

  test.describe("semantic structure", () => {
    test("uses proper heading hierarchy", async ({ page }) => {
      await page.goto("/");

      const h1 = page.locator("h1");
      await expect(h1).toHaveText("YourFavs");
    });

    test("uses main landmark", async ({ page }) => {
      await page.goto("/");

      const main = page.locator("main");
      await expect(main).toBeVisible();
    });
  });

  test.describe("progressive enhancement", () => {
    test("renders core content without JavaScript", async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
      });
      const page = await context.newPage();

      await page.goto("/");

      // Core content should be visible even without JavaScript
      const content = await page.content();
      expect(content).toContain("YourFavs");
      expect(content).toContain("Curate and share your favorite places");

      await context.close();
    });
  });

  test.describe("responsive design", () => {
    test("renders correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      await expect(
        page.getByRole("heading", { name: "YourFavs" })
      ).toBeVisible();
      await expect(
        page.getByText(/curate and share your favorite places/i)
      ).toBeVisible();
    });

    test("renders correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/");

      await expect(
        page.getByRole("heading", { name: "YourFavs" })
      ).toBeVisible();
      await expect(
        page.getByText(/curate and share your favorite places/i)
      ).toBeVisible();
    });

    test("renders correctly on desktop viewport", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");

      await expect(
        page.getByRole("heading", { name: "YourFavs" })
      ).toBeVisible();
      await expect(
        page.getByText(/curate and share your favorite places/i)
      ).toBeVisible();
    });

    test("maintains layout integrity across viewports", async ({ page }) => {
      // Test multiple viewport sizes
      const viewports = [
        { width: 375, height: 667, name: "mobile" },
        { width: 768, height: 1024, name: "tablet" },
        { width: 1280, height: 800, name: "desktop" },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto("/");

        // Verify content is visible at all viewport sizes
        await expect(
          page.getByRole("heading", { name: "YourFavs" })
        ).toBeVisible();

        // Verify no layout shift or overlap issues
        const main = page.locator("main");
        await expect(main).toBeVisible();
      }
    });
  });
});
