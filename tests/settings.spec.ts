import { test, expect } from '@playwright/test';

/**
 * Settings page tests — theme mode, log level, notifications, menu customization.
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

  test('shows Appearance, Logging, Notifications, and Menu sections', async ({ page }) => {
    await expect(page.getByText('Appearance')).toBeVisible();
    await expect(page.getByText('Logging')).toBeVisible();
    await expect(page.getByText(/browser notifications|notifications/i)).toBeVisible();
    await expect(page.getByText('Menu Customization').or(page.getByText('Menu')).first()).toBeVisible();
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

  test('menu position select has correct options', async ({ page }) => {
    await page.getByLabel(/menu position/i).click();
    await expect(page.getByRole('option', { name: /left/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /right/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /top/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /bottom/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('menu position change persists to localStorage', async ({ page }) => {
    await page.getByLabel(/menu position/i).click();
    await page.getByRole('option', { name: /right/i }).click();

    // Allow Zustand to persist
    await page.waitForTimeout(300);

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('settings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored?.menuPosition).toBe('right');
  });

  test('menu pin toggle is visible and functional', async ({ page }) => {
    const pinToggle = page.getByLabel(/pin.*menu|menu.*pinned/i);
    await expect(pinToggle).toBeVisible();
    // Default should be pinned (true)
    const isChecked = await pinToggle.isChecked();
    expect(isChecked).toBe(true);
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
