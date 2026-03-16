import { test, expect } from '@playwright/test';

/**
 * About page tests — developer info, external links, and app info card.
 */

test.describe('About', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /about/i, level: 4 })).toBeVisible();
  });

  test('shows developer name', async ({ page }) => {
    // Developer name appears in an about card
    await expect(page.locator('text=Igal Krigel').first()).toBeVisible();
  });

  test('shows developer title', async ({ page }) => {
    // Title appears in subtitle (more specific selector to avoid duplicates)
    await expect(
      page.getByRole('heading', { name: /full-stack developer.*ai integration specialist/i, level: 6 }).first()
    ).toBeVisible();
  });

  test('shows location', async ({ page }) => {
    await expect(page.getByText(/ramat zvi.*israel/i)).toBeVisible();
  });

  test('GitHub link points to correct URL', async ({ page }) => {
    const link = page.getByRole('link', { name: /github/i }).first();
    await expect(link).toHaveAttribute('href', 'https://github.com/ikrigel?tab=repositories');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('LinkedIn link points to correct URL', async ({ page }) => {
    const link = page.getByRole('link', { name: /linkedin/i }).first();
    await expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/ikrigel/');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('Portfolio link points to correct URL', async ({ page }) => {
    const link = page.getByRole('link', { name: /portfolio/i }).first();
    await expect(link).toHaveAttribute('href', 'https://portfolio-dusky-eight-77.vercel.app/#/');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('shows experience section with two roles', async ({ page }) => {
    // Use heading level to be specific about which Experience we're testing
    await expect(page.getByRole('heading', { name: 'Experience', level: 6 })).toBeVisible();
    await expect(page.getByText(/independent developer.*freelance/i)).toBeVisible();
    await expect(page.getByText(/open source contributions/i)).toBeVisible();
  });

  test('shows skill chips for primary skills', async ({ page }) => {
    for (const skill of ['React', 'TypeScript', 'Node.js', 'Claude API']) {
      await expect(page.getByText(skill).first()).toBeVisible();
    }
  });

  test('shows About Silent app info card', async ({ page }) => {
    await expect(page.getByText(/💤 about silent/i)).toBeVisible();
  });

  test('shows disclaimer card', async ({ page }) => {
    await expect(page.getByText(/important disclaimer/i)).toBeVisible();
    await expect(page.getByText(/emergency alerts exist to save lives/i)).toBeVisible();
  });
});
