import { test, expect } from '@playwright/test';

/**
 * Settings page tests — theme mode, log level, EmailJS key, notifications.
 */

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('shows Appearance, Logging, EmailJS, and Notifications sections', async ({ page }) => {
    await expect(page.getByText('Appearance')).toBeVisible();
    await expect(page.getByText('Logging')).toBeVisible();
    await expect(page.getByText('EmailJS')).toBeVisible();
    await expect(page.getByText('Browser Notifications')).toBeVisible();
  });

  test('theme mode select has correct options', async ({ page }) => {
    // Open the Theme Mode dropdown
    await page.getByLabel(/theme mode/i).click();
    await expect(page.getByRole('option', { name: /light/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /dark/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /time-based/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('changing theme mode persists to localStorage', async ({ page }) => {
    await page.getByLabel(/theme mode/i).click();
    await page.getByRole('option', { name: /dark/i }).click();

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('settings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored?.themeMode).toBe('dark');
  });

  test('log level select has correct options', async ({ page }) => {
    await page.getByLabel(/log level/i).click();
    await expect(page.getByRole('option', { name: /none/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /error only/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /info/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /verbose/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('EmailJS public key field accepts input', async ({ page }) => {
    const field = page.getByLabel(/emailjs public key/i);
    await field.fill('test-public-key-123');
    await expect(field).toHaveValue('test-public-key-123');
  });

  test('EmailJS key persists to localStorage', async ({ page }) => {
    const field = page.getByLabel(/emailjs public key/i);
    await field.fill('my-test-key');
    await field.blur();

    // Allow Zustand to debounce/persist
    await page.waitForTimeout(300);

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('settings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored?.emailjsPublicKey).toBe('my-test-key');
  });

  test('Reset button restores defaults', async ({ page }) => {
    // Change something first
    await page.getByLabel(/theme mode/i).click();
    await page.getByRole('option', { name: /dark/i }).click();

    // Reset
    await page.getByRole('button', { name: /reset all settings/i }).click();

    // Theme mode should revert to time-based (default)
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('settings');
      return raw ? JSON.parse(raw) : { themeMode: 'time' };
    });
    expect(stored?.themeMode ?? 'time').toBe('time');
  });

  test('notifications toggle is visible', async ({ page }) => {
    await expect(
      page.getByLabel(/enable schedule change notifications/i)
        .or(page.getByRole('checkbox'))
        .first()
    ).toBeVisible();
  });
});
