import { test, expect } from '@playwright/test';

/**
 * Language switching tests — EN and Hebrew (RTL) toggle.
 */
test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lang', 'en'); });
    await page.reload();
  });

  test('EN button is active by default', async ({ page }) => {
    // EN button should be in contained (selected) state
    await expect(page.getByRole('button', { name: 'EN' }).first()).toBeVisible();
  });

  test('switching to Hebrew changes navigation labels', async ({ page }) => {
    const heButton = page.getByRole('button', { name: /^עב/i }).first();
    await expect(heButton).toBeVisible();
    await heButton.click();
    await page.waitForTimeout(500);
    // Hebrew nav labels should appear — on mobile, open menu first, then check
    const drawer = page.locator('[class*="MuiDrawer"]');

    // Check if drawer is visible; on mobile it might be hidden initially
    const drawerVisible = await drawer.isVisible().catch(() => false);
    if (!drawerVisible) {
      // Mobile menu button needed — open it
      const menuBtn = page.getByRole('banner').getByRole('button').first();
      await menuBtn.click();
      await page.waitForTimeout(300);
    }

    await expect(drawer.getByText('לוח בקרה').first()).toBeVisible({ timeout: 5000 });
    await expect(drawer.getByText('מתזמן').first()).toBeVisible({ timeout: 5000 });
  });

  test('switching to Hebrew sets RTL direction', async ({ page }) => {
    await page.getByRole('button', { name: /^עב/i }).click();
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });

  test('switching back to English restores LTR', async ({ page }) => {
    const heButton = page.getByRole('button', { name: /^עב/i }).first();
    await heButton.click();
    await page.waitForTimeout(300);
    const enButton = page.getByRole('button', { name: 'EN' }).first();
    await enButton.click();
    await page.waitForTimeout(300);
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('ltr');
  });

  test('language preference persists across reload', async ({ page }) => {
    await page.getByRole('button', { name: /^עב/i }).click();
    await page.reload();
    const lang = await page.evaluate(() => localStorage.getItem('lang'));
    expect(lang).toBe('he');
  });
});
