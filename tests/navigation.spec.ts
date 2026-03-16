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
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /scheduler/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /logs/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /help/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /donate/i })).toBeVisible();
  });

  test('navigates to Scheduler page', async ({ page }) => {
    const schedulerLink = page.getByRole('link', { name: /scheduler/i });
    await expect(schedulerLink).toBeVisible();
    await schedulerLink.click();
    await expect(page).toHaveURL('/scheduler');
    await expect(page.getByRole('heading', { name: /scheduler/i })).toBeVisible();
  });

  test('navigates to Logs page', async ({ page }) => {
    const logsLink = page.getByRole('link', { name: /logs/i });
    await expect(logsLink).toBeVisible();
    await logsLink.click();
    await expect(page).toHaveURL('/logs');
    await expect(page.getByRole('heading', { name: /logs/i })).toBeVisible();
  });

  test('navigates to Settings page', async ({ page }) => {
    const settingsLink = page.getByRole('link', { name: /settings/i });
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('navigates to About page', async ({ page }) => {
    const aboutLink = page.getByRole('link', { name: /about/i });
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: /about/i })).toBeVisible();
  });

  test('navigates to Help page', async ({ page }) => {
    const helpLink = page.getByRole('link', { name: /help/i });
    await expect(helpLink).toBeVisible();
    await helpLink.click();
    await expect(page).toHaveURL('/help');
    await expect(page.getByRole('heading', { name: /help/i })).toBeVisible();
  });

  test('navigates to Donate page', async ({ page }) => {
    const donateLink = page.getByRole('link', { name: /donate/i });
    await expect(donateLink).toBeVisible();
    await donateLink.click();
    await expect(page).toHaveURL('/donate');
    await expect(page.getByRole('heading', { name: /donate|support/i })).toBeVisible();
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
