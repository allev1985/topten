import { test, expect } from "@playwright/test";

/**
 * E2E tests for the /dashboard/places page (spec 007-places-management)
 *
 * Current coverage:
 *   1. Unauthenticated redirect — fully implemented
 *
 * Pending coverage (skipped until a shared Playwright login fixture is available):
 *   2. Add a standalone place — US3 acceptance scenarios
 *   3. Edit a place from My Places — US4 acceptance scenarios
 *   4. Delete a place globally — US2 acceptance scenarios
 *
 * When the login fixture lands, replace the `loginAsTestUser` TODO stubs below
 * and remove the `test.skip` wrappers. See docs/decisions/ for context on the
 * planned auth fixture approach.
 */

// ── Access ────────────────────────────────────────────────────────────────────

test.describe("My Places — Access", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/dashboard/places");

    await expect(page).toHaveURL(/\/login/);
  });
});

// ── Authenticated journeys (pending login fixture) ────────────────────────────

test.describe.skip("My Places — Add a place (US3)", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: replace with shared login fixture when available
    // await loginAsTestUser(page);
    await page.goto("/dashboard/places");
  });

  test("add form presents only name and address fields (no list picker)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /new place/i }).click();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/address/i)).toBeVisible();
    await expect(page.getByLabel(/list/i)).not.toBeVisible();
  });

  test("submitting valid name and address creates a place with list count 0", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /new place/i }).click();
    await page.getByLabel(/name/i).fill("Test Cafe");
    await page.getByLabel(/address/i).fill("1 Test Street, London");
    await page.getByRole("button", { name: /add place/i }).click();

    await expect(page.getByText("Test Cafe")).toBeVisible();
    await expect(page.getByText(/not in any list/i)).toBeVisible();
  });

  test("submitting with empty name shows validation error", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /new place/i }).click();
    await page.getByLabel(/address/i).fill("1 Test Street");
    await page.getByRole("button", { name: /add place/i }).click();

    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test("submitting with empty address shows validation error", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /new place/i }).click();
    await page.getByLabel(/name/i).fill("Test Cafe");
    await page.getByRole("button", { name: /add place/i }).click();

    await expect(page.getByText(/address is required/i)).toBeVisible();
  });
});

test.describe.skip("My Places — Edit a place (US4)", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: replace with shared login fixture when available
    // await loginAsTestUser(page);
    await page.goto("/dashboard/places");
  });

  test("edit form is pre-filled with current name and address", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /edit/i }).first().click();

    const nameInput = page.getByLabel(/name/i);
    const addressInput = page.getByLabel(/address/i);
    await expect(nameInput).not.toHaveValue("");
    await expect(addressInput).not.toHaveValue("");
  });

  test("googlePlaceId is not shown in the edit form", async ({ page }) => {
    await page.getByRole("button", { name: /edit/i }).first().click();

    await expect(page.getByLabel(/google/i)).not.toBeVisible();
    await expect(page.getByLabel(/place.?id/i)).not.toBeVisible();
  });

  test("save button is disabled when form is clean", async ({ page }) => {
    await page.getByRole("button", { name: /edit/i }).first().click();

    await expect(page.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  test("changing the name enables save and shows unsaved-changes badge", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /edit/i }).first().click();
    await page.getByLabel(/name/i).fill("Updated Name");

    await expect(page.getByRole("button", { name: /save/i })).toBeEnabled();
    await expect(page.getByText(/unsaved changes/i)).toBeVisible();
  });

  test("saving an updated name persists and is reflected on the page", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /edit/i }).first().click();
    await page.getByLabel(/name/i).fill("Edited Place Name");
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText("Edited Place Name")).toBeVisible();
  });

  test("closing with unsaved changes triggers a confirmation prompt", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /edit/i }).first().click();
    await page.getByLabel(/name/i).fill("Dirty Value");

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should still be open after dismissing the confirm prompt
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe.skip("My Places — Delete a place (US2)", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: replace with shared login fixture when available
    // await loginAsTestUser(page);
    await page.goto("/dashboard/places");
  });

  test("delete affordance opens a confirmation dialog", async ({ page }) => {
    await page
      .getByRole("button", { name: /delete/i })
      .first()
      .click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();
  });

  test("confirmation dialog states how many lists the place belongs to", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /delete/i })
      .first()
      .click();

    // Should mention list count impact (e.g. "1 list" or "0 lists")
    await expect(page.getByText(/list|no lists/i).first()).toBeVisible();
  });

  test("dismissing the confirmation dialog leaves the place intact", async ({
    page,
  }) => {
    const placeNames = await page.getByRole("heading").allTextContents();
    await page
      .getByRole("button", { name: /delete/i })
      .first()
      .click();
    await page.getByRole("button", { name: /cancel/i }).click();

    // Same places still visible
    for (const name of placeNames) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test("confirming deletion removes the place from My Places", async ({
    page,
  }) => {
    const placeName = await page.getByRole("heading").first().textContent();

    await page
      .getByRole("button", { name: /delete/i })
      .first()
      .click();
    await page.getByRole("button", { name: /delete place/i }).click();

    await expect(page.getByText(placeName!)).not.toBeVisible();
  });
});
