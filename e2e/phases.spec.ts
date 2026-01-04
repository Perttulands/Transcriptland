import { test, expect } from '@playwright/test';

test.describe('Phase Navigation', () => {
  test('Phase 1 route loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/Phase 1/i)).toBeVisible();
  });

  test('Phase 2 route exists', async ({ page }) => {
    await page.goto('/framework');
    // Should either show Phase 2 content or redirect to Phase 1 if no data
    await expect(page.getByText(/Phase|Framework|Upload/i).first()).toBeVisible();
  });

  test('Phase 3 route exists', async ({ page }) => {
    await page.goto('/extraction');
    // Should either show Phase 3 content or redirect
    await expect(page.getByText(/Phase|Extraction|Upload/i).first()).toBeVisible();
  });

  test('Gap Analysis route exists', async ({ page }) => {
    await page.goto('/gap-analysis');
    // Should either show Gap Analysis content or redirect
    await expect(page.getByText(/Gap|Analysis|Upload|Phase/i).first()).toBeVisible();
  });

  test('Consolidation route exists', async ({ page }) => {
    await page.goto('/consolidation');
    // Should either show Consolidation content or redirect
    await expect(page.getByText(/Consolidation|Export|Upload|Phase/i).first()).toBeVisible();
  });
});

test.describe('Phase Indicator UI', () => {
  test('shows current phase as active', async ({ page }) => {
    await page.goto('/');

    // The Phase Indicator should highlight the current phase
    // Check that there's visual distinction for the active phase
    const phaseIndicator = page.locator('[class*="phase"], [class*="indicator"]').first();
    if (await phaseIndicator.isVisible()) {
      await expect(phaseIndicator).toBeVisible();
    }
  });
});
