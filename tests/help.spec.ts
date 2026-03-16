import { test, expect } from '@playwright/test';

/**
 * Help page tests — FAQ accordion and contact form validation.
 */

test.describe('Help', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help');
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /help/i })).toBeVisible();
  });

  test('shows FAQ section', async ({ page }) => {
    await expect(page.getByText(/frequently asked questions/i)).toBeVisible();
  });

  test('FAQ items are collapsed by default', async ({ page }) => {
    // First FAQ answer should not be visible before expanding
    await expect(
      page.getByText(/go to settings.*notifications.*scroll/i)
    ).not.toBeVisible();
  });

  test('FAQ item expands on click', async ({ page }) => {
    // Click the first question
    await page.getByText(/how do i silence emergency alerts on iphone/i).click();
    // Answer should now be visible
    await expect(
      page.getByText(/settings.*notifications.*extreme alert/i)
    ).toBeVisible();
  });

  test('multiple FAQ items can be opened independently', async ({ page }) => {
    await page.getByText(/how do i silence emergency alerts on iphone/i).click();
    await page.getByText(/how do i silence emergency alerts on android/i).click();
    await expect(page.getByText(/safety.*emergency.*wireless emergency alerts/i)).toBeVisible();
  });

  test('shows Contact the Developer section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contact.*developer/i })).toBeVisible();
  });

  test('contact form has all required fields', async ({ page }) => {
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/subject/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
  });

  test('contact form shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /send message/i }).click();
    // react-hook-form should show required errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test('contact form fields accept input', async ({ page }) => {
    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/subject/i).fill('Test Subject');
    await page.getByLabel(/message/i).fill('This is a test message from Playwright.');

    await expect(page.getByLabel(/your name/i)).toHaveValue('Test User');
    await expect(page.getByLabel(/email address/i)).toHaveValue('test@example.com');
    await expect(page.getByLabel(/subject/i)).toHaveValue('Test Subject');
  });

  test('FAQ covers all 7 questions', async ({ page }) => {
    const expectedQuestions = [
      /silence emergency alerts on iphone/i,
      /silence emergency alerts on android/i,
      /what does a schedule do/i,
      /repeat modes/i,
      /time-based theme/i,
      /where is my data stored/i,
      /how do i contact the developer/i,
    ];

    for (const q of expectedQuestions) {
      await expect(page.getByText(q).first()).toBeVisible();
    }
  });

  test('contact form submits and shows success (mocked EmailJS)', async ({ page }) => {
    // Mock the EmailJS API endpoint so no real email is sent
    await page.route('**/api.emailjs.com/**', (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ status: 200, text: 'OK' }) });
    });

    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@playwright.dev');
    await page.getByLabel(/subject/i).fill('Playwright Test');
    await page.getByLabel(/message/i).fill('This is an automated test message.');

    await page.getByRole('button', { name: /send message/i }).click();

    // Success alert should appear
    await expect(page.getByText(/message sent/i)).toBeVisible({ timeout: 10000 });
  });
});
