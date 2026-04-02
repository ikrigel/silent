import { test, expect } from '@playwright/test';

/**
 * Robot page tests — verify page loads and displays correctly.
 * Tests run on the web view (no Android device needed).
 */

test.describe('Robot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/robot');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /robot/i })).toBeVisible();
  });

  test('shows Android App Required notice on web', async ({ page }) => {
    // Web view should show the notice since Capacitor is not available
    await expect(page.getByText(/android app required/i)).toBeVisible();
  });

  test('shows sign-in prompt when not logged in', async ({ page }) => {
    // Not logged in → should show a button to sign in or download
    const downloadButton = page.getByRole('button').filter({ hasText: /download|sign in/i }).first();
    await expect(downloadButton).toBeVisible({ timeout: 5000 });
  });

  test('page loads without errors', async ({ page }) => {
    // Simply verify the main content area is visible and accessible
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });
});
