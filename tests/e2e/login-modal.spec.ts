import { test, expect } from "@playwright/test";

test.describe("Login Modal Flow - User Story 1", () => {
  test("opens modal from landing page and logs in successfully", async ({
    page,
  }) => {
    // Navigate to landing page
    await page.goto("http://localhost:3000");

    // Verify modal is not visible
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Click Log In button
    await page.getByRole("button", { name: "Log In" }).click();

    // Verify modal opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Sign In")).toBeVisible();

    // Fill in credentials
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");

    // Submit form
    await page.getByRole("button", { name: "Sign In" }).click();

    // Verify redirect to dashboard (after modal closes)
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Verify modal is closed
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("closes modal when Escape key is pressed", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Open modal
    await page.getByRole("button", { name: "Log In" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("closes modal when clicking outside", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Open modal
    await page.getByRole("button", { name: "Log In" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Click outside modal (on overlay)
    await page.mouse.click(10, 10); // Top-left corner, outside modal

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("returns focus to Log In button after closing", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const loginButton = page.getByRole("button", { name: "Log In" });

    // Open modal
    await loginButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");

    // Focus should return to trigger button
    await expect(loginButton).toBeFocused();
  });
});
