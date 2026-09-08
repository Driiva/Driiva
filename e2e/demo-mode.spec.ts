import { test, expect, type Page } from '@playwright/test';

/**
 * CHARACTERISATION — FLOW-08 demo-mode walkthrough.
 * Demo mode (sessionStorage['driiva-demo-mode']) is the app's universal
 * ProtectedRoute bypass and the only fully scriptable auth-free seam.
 * Coverage is deliberately NOT uniform in the app: policy and trip-detail
 * have no demo handling — that asymmetry is pinned here too.
 */

async function enterDemo(page: Page) {
  await page.goto('/demo');
  await page.getByRole('button', { name: /enter demo/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('FLOW-08 demo mode', () => {
  test('dashboard renders the demo driver with score 82', async ({ page }) => {
    await enterDemo(page);
    await expect(page.getByText(/demo/i).first()).toBeVisible();
    await expect(page.getByText('82').first()).toBeVisible({ timeout: 15_000 });
  });

  test('trips list shows the three fabricated demo trips; QUIRK: tapping a demo trip is a dead no-op', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/trips');
    await expect(page.getByText(/3 trips|trips/i).first()).toBeVisible();
    const firstCard = page.locator('[class*="card"], [class*="Card"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/trips$/); // navigation did not happen
  });

  // Re-pinned (Wave B): the demo leaderboard used to be fifteen invented
  // drivers and an invented 1,247-participant count. That fabricated dataset
  // was deleted, so demo mode now reads the same real board as everyone else,
  // and a demo uid cannot read it. Same permission-denied asymmetry as /policy
  // below. The absence assertion is the point: invented figures must not come
  // back.
  test('QUIRK: /leaderboard has no demo dataset any more, so a demo uid gets the read-failure card', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/leaderboard');
    await expect(page.getByText(/the leaderboard did not load/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/1,?247/)).toHaveCount(0);
  });

  test('QUIRK: /policy has no demo handling — demo-uid Firestore subscriptions permission-deny and the page shows the error card', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/policy');
    await expect(page.getByText(/could not load policy details/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });

  test('QUIRK: /permissions is cosmetic — both buttons just route to /dashboard, no permission API touched', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/permissions');
    await page.getByRole('button', { name: /skip/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('demo checkout completes with a fake delay and zero payment API calls', async ({ page }) => {
    await enterDemo(page);
    const apiCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/payments')) apiCalls.push(req.url());
    });
    await page.goto('/checkout');
    // Demo banner is explicit about the simulation:
    await expect(page.getByText(/demo preview|no real card needed/i).first()).toBeVisible();
    // Cross-check of the pricing engine suite: demo profile = £1,210/yr, score 82 → 4% off.
    await expect(page.getByText(/£1,210/).first()).toBeVisible();
    // The real CTA is "Pay £N now" (a looser regex matches the billing toggle first).
    await page.getByRole('button', { name: /pay £.* now/i }).click();
    // Re-pinned (Wave H): a cleared demo card used to render "Policy
    // activated!", which told a demo user they were insured. The demo branch
    // now lands on CoverOutcome kind:'demo', which says the opposite.
    await expect(
      page.getByRole('heading', { name: /demo complete/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/no payment was taken and no policy exists/i)
    ).toBeVisible();
    await expect(page.getByText(/policy activated/i)).toHaveCount(0);
    expect(apiCalls).toEqual([]);
  });
});
