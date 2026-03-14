import { test, expect } from '@playwright/test';

/**
 * Navigation tests — verify sidebar routing works for all pages.
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the root before each test
    await page.goto('/');
  });

  test('app loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Silent/);
  });

  test('sidebar shows all nav items', async ({ page }) => {
    const nav = page.getByRole('navigation').or(page.locator('.MuiDrawer-root'));
    await expect(page.getByRole('link', { name: /dashboard/i }).or(
      page.getByText('Dashboard').first()
    )).toBeVisible();
    await expect(page.getByText('Scheduler')).toBeVisible();
    await expect(page.getByText('Logs')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
    await expect(page.getByText('Help')).toBeVisible();
  });

  test('navigates to Scheduler page', async ({ page }) => {
    await page.getByText('Scheduler').first().click();
    await expect(page).toHaveURL('/scheduler');
    await expect(page.getByRole('heading', { name: /scheduler/i })).toBeVisible();
  });

  test('navigates to Logs page', async ({ page }) => {
    await page.getByText('Logs').first().click();
    await expect(page).toHaveURL('/logs');
    await expect(page.getByRole('heading', { name: /logs/i })).toBeVisible();
  });

  test('navigates to Settings page', async ({ page }) => {
    await page.getByText('Settings').first().click();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('navigates to About page', async ({ page }) => {
    await page.getByText('About').first().click();
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: /about/i })).toBeVisible();
  });

  test('navigates to Help page', async ({ page }) => {
    await page.getByText('Help').first().click();
    await expect(page).toHaveURL('/help');
    await expect(page.getByRole('heading', { name: /help/i })).toBeVisible();
  });

  test('header shows app title with emoji', async ({ page }) => {
    await expect(page.getByText(/💤/)).toBeVisible();
  });

  test('theme toggle button is visible in header', async ({ page }) => {
    // Theme toggle cycles light → dark → time
    const themeBtn = page.getByRole('button', { name: /switch to/i });
    await expect(themeBtn).toBeVisible();
  });

  test('clicking theme toggle changes icon', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /switch to/i });
    const titleBefore = await themeBtn.getAttribute('aria-label') ??
      await themeBtn.locator('svg').getAttribute('data-testid') ?? '';
    await themeBtn.click();
    const titleAfter = await themeBtn.getAttribute('aria-label') ??
      await themeBtn.locator('svg').getAttribute('data-testid') ?? '';
    // Title should have changed after cycling
    expect(titleBefore).not.toEqual(titleAfter);
  });
});
