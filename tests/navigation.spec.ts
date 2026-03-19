import { test, expect, Page } from '@playwright/test';

/**
 * Navigation tests — verify sidebar routing works for all pages.
 * Handles both desktop and mobile layouts where sidebar is hidden on mobile.
 */

// Helper function to open mobile menu if needed
async function ensureMenuVisible(page: Page) {
  // Find the hamburger menu button in the header/banner (not the "Pin menu" button in sidebar)
  const menuButton = page
    .getByRole('banner')  // Scope to AppBar header
    .getByRole('button')
    .first();  // First button in header is typically the menu
  const isMenuButtonVisible = await menuButton.isVisible().catch(() => false);

  if (isMenuButtonVisible) {
    // Mobile layout — open the menu
    await menuButton.scrollIntoViewIfNeeded();
    await menuButton.click();
    await page.waitForTimeout(300);
  }
}

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the root before each test
    await page.goto('/');
  });

  test('app loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Silent/);
  });

  test('sidebar shows all nav items', async ({ page }) => {
    await ensureMenuVisible(page);
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /scheduler/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /logs/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /help/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /donate/i })).toBeVisible();
  });

  test('navigates to Scheduler page', async ({ page }) => {
    await ensureMenuVisible(page);
    const schedulerLink = page.getByRole('link', { name: /scheduler/i });
    await expect(schedulerLink).toBeVisible();
    await schedulerLink.scrollIntoViewIfNeeded();
    await schedulerLink.click();
    await expect(page).toHaveURL('/scheduler');
    await expect(page.getByRole('heading', { name: /scheduler/i, level: 4 })).toBeVisible();
  });

  test('navigates to Logs page', async ({ page }) => {
    await ensureMenuVisible(page);
    const logsLink = page.getByRole('link', { name: /logs/i });
    await expect(logsLink).toBeVisible();
    await logsLink.scrollIntoViewIfNeeded();
    await logsLink.click();
    await expect(page).toHaveURL('/logs');
    await expect(page.getByRole('heading', { name: /logs/i, level: 4 })).toBeVisible();
  });

  test('navigates to Settings page', async ({ page }) => {
    await ensureMenuVisible(page);
    const settingsLink = page.getByRole('link', { name: /settings/i });
    await expect(settingsLink).toBeVisible();
    await settingsLink.scrollIntoViewIfNeeded();
    await settingsLink.click();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: /settings/i, level: 4 })).toBeVisible();
  });

  test('navigates to About page', async ({ page }) => {
    await ensureMenuVisible(page);
    const aboutLink = page.getByRole('link', { name: /about/i });
    await expect(aboutLink).toBeVisible();
    await aboutLink.scrollIntoViewIfNeeded();
    await aboutLink.click();
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: /about/i, level: 4 })).toBeVisible();
  });

  test('navigates to Help page', async ({ page }) => {
    await ensureMenuVisible(page);
    const helpLink = page.getByRole('link', { name: /help/i });
    await expect(helpLink).toBeVisible();
    await helpLink.scrollIntoViewIfNeeded().catch(() => {}); // Ignore scroll errors on mobile
    await helpLink.click();
    await expect(page).toHaveURL('/help');
    await expect(page.getByRole('heading', { name: /help/i, level: 4 })).toBeVisible();
  });

  test('navigates to Donate page', async ({ page }) => {
    await ensureMenuVisible(page);
    const donateLink = page.getByRole('link', { name: /donate/i });
    await expect(donateLink).toBeVisible();
    await donateLink.scrollIntoViewIfNeeded().catch(() => {}); // Ignore scroll errors on mobile
    await donateLink.click();
    await expect(page).toHaveURL('/donate');
    await expect(page.getByRole('heading', { name: /donate|support/i, level: 4 })).toBeVisible();
  });

  test('header shows app title with emoji', async ({ page }) => {
    // Scope to header/banner to avoid matching sidebar text
    const headerTitle = page.getByRole('banner').getByText(/💤.*Dashboard/);
    await expect(headerTitle).toBeVisible();
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
