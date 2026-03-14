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
    await expect(page.getByRole('button', { name: 'EN' })).toBeVisible();
  });

  test('switching to Hebrew changes navigation labels', async ({ page }) => {
    await page.getByRole('button', { name: /^עב/i }).click();
    // Hebrew nav labels should appear
    await expect(page.getByText('לוח בקרה')).toBeVisible();
    await expect(page.getByText('מתזמן')).toBeVisible();
  });

  test('switching to Hebrew sets RTL direction', async ({ page }) => {
    await page.getByRole('button', { name: /^עב/i }).click();
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });

  test('switching back to English restores LTR', async ({ page }) => {
    await page.getByRole('button', { name: /^עב/i }).click();
    await page.getByRole('button', { name: 'EN' }).click();
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
