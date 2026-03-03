import { test, expect } from "@playwright/test";

/**
 * E2E tests for the /dashboard/settings page
 *
 * These tests verify:
 * 1. Unauthenticated users are redirected to /login
 * 2. Authenticated users see all three settings sections
 * 3. Slug update journey (success + validation errors)
 * 4. Name update journey (success + validation errors)
 * 5. Password validation errors (existing PasswordChangeForm behaviour)
 */

test.describe("Settings Page — Access", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe.skip("Settings Page — Authenticated Journey", () => {
  // TODO: Implement once a reusable login helper is available.
  // Each test must call loginHelper(page) before navigating to /dashboard/settings.

  test.beforeEach(async ({ page }) => {
    // Placeholder: authenticate then navigate to settings
    // await loginHelper(page, TEST_USER);
    await page.goto("/dashboard/settings");
  });

  test("renders all three settings sections", async ({ page }) => {
    // Profile URL section
    await expect(page.getByRole("heading", { name: /profile url/i })).toBeVisible();
    // Profile (name) section
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();
    // Security (password) section
    await expect(page.getByRole("heading", { name: /change password/i })).toBeVisible();
  });

  test.describe("Slug update journey", () => {
    test("updates slug successfully and shows confirmation", async ({ page }) => {
      const newSlug = `testslug-${Date.now()}`;

      const slugInput = page.getByRole("textbox", { name: /profile url/i });
      await slugInput.fill(newSlug);
      await page.getByRole("button", { name: /save profile url/i }).click();

      await expect(
        page.getByText("Profile URL updated successfully.")
      ).toBeVisible();

      // Updated preview URL is shown
      await expect(page.getByText(`/${newSlug}`)).toBeVisible();
    });

    test("shows 'URL is already taken' error for a duplicate slug", async ({ page }) => {
      // Assumes "admin" is a slug taken by another user in the test DB fixture
      const slugInput = page.getByRole("textbox", { name: /profile url/i });
      await slugInput.fill("admin");
      await page.getByRole("button", { name: /save profile url/i }).click();

      await expect(
        page.getByText("This URL is already taken. Please choose a different one.")
      ).toBeVisible();
    });

    test("shows inline validation error for invalid characters before server call", async ({ page }) => {
      const slugInput = page.getByRole("textbox", { name: /profile url/i });
      await slugInput.fill("INVALID SLUG!");
      await page.getByRole("button", { name: /save profile url/i }).click();

      // Client-side Zod validation fires before any network call
      await expect(
        page.getByText(/only contain lowercase letters/i)
      ).toBeVisible();
    });
  });

  test.describe("Name update journey", () => {
    test("updates name successfully and shows confirmation", async ({ page }) => {
      const newName = "Jane Doe";

      const nameInput = page.getByRole("textbox", { name: /^name$/i });
      await nameInput.fill(newName);
      await page.getByRole("button", { name: /save name/i }).click();

      await expect(page.getByText("Name updated successfully.")).toBeVisible();
      // Input still shows updated value
      await expect(nameInput).toHaveValue(newName);
    });

    test("shows 'Name is required' validation error for empty name", async ({ page }) => {
      const nameInput = page.getByRole("textbox", { name: /^name$/i });
      await nameInput.fill("");
      await page.getByRole("button", { name: /save name/i }).click();

      await expect(page.getByText("Name is required")).toBeVisible();
    });
  });

  test.describe("Password section journey", () => {
    test("shows error for incorrect current password", async ({ page }) => {
      await page.getByLabel(/current password/i).fill("wrong-password-123!");
      await page.getByLabel(/^new password$/i).fill("NewSecurePass1!");
      await page.getByLabel(/confirm.*password/i).fill("NewSecurePass1!");
      await page.getByRole("button", { name: /change password/i }).click();

      await expect(
        page.getByText("Current password is incorrect")
      ).toBeVisible();
    });

    test("shows mismatch error when new passwords do not match", async ({ page }) => {
      await page.getByLabel(/current password/i).fill("CurrentPass1!");
      await page.getByLabel(/^new password$/i).fill("NewSecurePass1!");
      await page.getByLabel(/confirm.*password/i).fill("DifferentPass2@");
      await page.getByRole("button", { name: /change password/i }).click();

      await expect(page.getByText("Passwords do not match")).toBeVisible();
    });
  });
});
