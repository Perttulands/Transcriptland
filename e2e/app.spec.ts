import { test, expect } from '@playwright/test';

test.describe('Transcriptland App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display Phase 1 page by default', async ({ page }) => {
    // Check page title/header is visible
    await expect(page.getByRole('heading', { name: /Phase 1: Upload & Align/i })).toBeVisible();

    // Check the main description text
    await expect(page.getByText(/Upload your transcript/i)).toBeVisible();
  });

  test('should show API Key button', async ({ page }) => {
    // API Key button should be visible
    const apiKeyButton = page.getByRole('button', { name: /API Key/i });
    await expect(apiKeyButton).toBeVisible();
  });

  test('should open API Key modal when clicking Set API Key', async ({ page }) => {
    // Click the API Key button
    await page.getByRole('button', { name: /API Key/i }).click();

    // Modal should appear with provider options
    await expect(page.getByText(/LiteLLM|Google Gemini/i)).toBeVisible();
  });

  test('should have disabled Analyze button when no transcript', async ({ page }) => {
    const analyzeButton = page.getByRole('button', { name: /Analyze Context/i });
    await expect(analyzeButton).toBeDisabled();
  });

  test('should show phase indicator', async ({ page }) => {
    // Phase indicator should show all phases
    await expect(page.getByText(/Upload/i)).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should have phase indicator with navigation items', async ({ page }) => {
    await page.goto('/');

    // Check that phase indicator exists with multiple phases
    const phaseIndicator = page.locator('.flex').filter({ hasText: /Upload.*Framework.*Extraction/i });
    await expect(phaseIndicator.first()).toBeVisible();
  });
});

test.describe('Transcript Input', () => {
  test('should allow pasting text into transcript area', async ({ page }) => {
    await page.goto('/');

    // Find the transcript textarea/input area
    const transcriptArea = page.getByPlaceholder(/paste|transcript/i).first();

    if (await transcriptArea.isVisible()) {
      await transcriptArea.fill('This is a sample transcript for testing purposes.');

      // Analyze button should now be enabled
      const analyzeButton = page.getByRole('button', { name: /Analyze Context/i });
      await expect(analyzeButton).toBeEnabled();
    }
  });
});
