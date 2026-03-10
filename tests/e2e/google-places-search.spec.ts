import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Google Places search integration (spec 008-google-places-integration)
 *
 * Current coverage:
 *   1. Unauthenticated redirect — fully implemented
 *
 * Pending coverage (skipped until a shared Playwright login fixture and
 * a test-mode Google Places mock/stub are available):
 *   2. Search + suggestion display
 *   3. Place selection populates form
 *   4. Form submission creates place with Google metadata
 *   5. Edit dialog shows read-only name/address + editable notes
 *
 * To activate these tests:
 *   1. Create a `loginAsTestUser(page)` helper (see existing patterns in e2e/)
 *   2. Configure GOOGLE_PLACES_API_KEY in the test environment or use
 *      a mock server that intercepts https://places.googleapis.com/v1/
 *   3. Remove the `test.describe.skip` wrapper and replace TODO stubs
 */

// ── Access ─────────────────────────────────────────────────────────────────

test.describe("Google Places Search — Access", () => {
  test("redirects unauthenticated users from add-place page to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard/places");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── Authenticated journeys (pending login fixture + API mock) ──────────────

test.describe.skip("Google Places Search — Add Place (US1/US2)", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: replace with shared login fixture when available
    // await loginAsTestUser(page);
    await page.goto("/dashboard/places");
  });

  test("add form shows search input, not name/address fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /new place/i }).click();
    await expect(page.getByLabel(/search for a place/i)).toBeVisible();
    await expect(page.getByLabel(/^name$/i)).not.toBeVisible();
    await expect(page.getByLabel(/^address$/i)).not.toBeVisible();
  });

  test("typing ≥3 chars triggers suggestions dropdown", async ({ page }) => {
    await page.getByRole("button", { name: /new place/i }).click();
    await page.getByLabel(/search for a place/i).fill("Nobu");
    await expect(page.getByRole("listbox", { name: /place suggestions/i })).toBeVisible({
      timeout: 3000,
    });
  });

  test("selecting a suggestion populates hidden fields and enables submit", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /new place/i }).click();
    const searchInput = page.getByLabel(/search for a place/i);
    await searchInput.fill("Nobu");

    const suggestions = page.getByRole("listbox");
    await suggestions.waitFor({ state: "visible", timeout: 3000 });
    await suggestions.getByRole("option").first().click();

    await expect(page.locator("input[name='googlePlaceId']")).not.toHaveValue("");
    await expect(page.getByRole("button", { name: /add place/i })).toBeEnabled();
  });

  test("submitting the form creates the place and closes the dialog", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /new place/i }).click();
    const searchInput = page.getByLabel(/search for a place/i);
    await searchInput.fill("Nobu");

    const suggestions = page.getByRole("listbox");
    await suggestions.waitFor({ state: "visible", timeout: 3000 });
    await suggestions.getByRole("option").first().click();

    await page.getByRole("button", { name: /add place/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe.skip("Google Places Search — Edit Place (immutability)", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: replace with shared login fixture when available
    // await loginAsTestUser(page);
    await page.goto("/dashboard/places");
  });

  test("edit dialog shows name and address as read-only text, not inputs", async ({
    page,
  }) => {
    // TODO: click edit on an existing place
    await expect(
      page.getByRole("textbox", { name: /^name$/i })
    ).not.toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /^address$/i })
    ).not.toBeVisible();
    await expect(page.getByLabel(/notes/i)).toBeVisible();
  });

  test("saving a description update succeeds and reflects on the page", async ({
    page,
  }) => {
    // TODO: implement full edit flow
    await expect(page.getByLabel(/notes/i)).toBeVisible();
  });
});
