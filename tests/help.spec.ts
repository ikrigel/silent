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
    // Click the first question with explicit wait and stability check
    const iphoneQuestion = page.getByText(/how do i silence emergency alerts on iphone/i).first();
    await iphoneQuestion.waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(500); // Wait for any animations
    await iphoneQuestion.click({ timeout: 15_000 });

    // Answer should now be visible
    await expect(
      page.getByText(/settings.*notifications.*extreme alert/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('multiple FAQ items can be opened independently', async ({ page }) => {
    // Click first question
    const iphoneQuestion = page.getByText(/how do i silence emergency alerts on iphone/i).first();
    await iphoneQuestion.waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(300);
    await iphoneQuestion.click({ timeout: 15_000 });

    await page.waitForTimeout(500); // Wait for first accordion to open

    // Click second question
    const androidQuestion = page.getByText(/how do i silence emergency alerts on android/i).first();
    await androidQuestion.waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(300);
    await androidQuestion.click({ timeout: 15_000 });

    await expect(page.getByText(/safety.*emergency.*wireless emergency alerts/i)).toBeVisible({ timeout: 10_000 });
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
    // Wait for form to load and be interactive
    await page.waitForTimeout(1000);

    const submitButton = page.getByRole('button', { name: /send message/i });
    await submitButton.waitFor({ state: 'visible', timeout: 10_000 });
    await submitButton.click({ timeout: 15_000 });

    // react-hook-form should show required errors
    await expect(page.getByText(/name is required/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/email is required/i)).toBeVisible({ timeout: 10_000 });
  });

  test('contact form fields accept input', async ({ page }) => {
    // Wait a moment for reCAPTCHA to load
    await page.waitForTimeout(2000);

    const nameField = page.getByLabel(/your name/i);
    const emailField = page.getByLabel(/email address/i);
    const subjectField = page.getByLabel(/subject/i);
    const messageField = page.getByLabel(/message/i);

    // Wait for fields to be ready
    await nameField.waitFor({ state: 'visible' });

    await nameField.fill('Test User');
    await emailField.fill('test@example.com');
    await subjectField.fill('Test Subject');
    await messageField.fill('This is a test message from Playwright.');

    await expect(nameField).toHaveValue('Test User', { timeout: 10_000 });
    await expect(emailField).toHaveValue('test@example.com', { timeout: 10_000 });
    await expect(subjectField).toHaveValue('Test Subject', { timeout: 10_000 });
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

    // Wait for reCAPTCHA to load
    await page.waitForTimeout(2000);

    const nameField = page.getByLabel(/your name|name/i);
    const emailField = page.getByLabel(/email address|email/i);
    const subjectField = page.getByLabel(/subject/i);
    const messageField = page.getByLabel(/message/i);
    const submitButton = page.getByRole('button', { name: /send/i });

    // Ensure fields are visible and ready
    await nameField.waitFor({ state: 'visible', timeout: 10_000 });
    await submitButton.waitFor({ state: 'visible', timeout: 10_000 });

    await nameField.fill('Test User', { timeout: 10_000 });
    await emailField.fill('test@playwright.dev', { timeout: 10_000 });
    await subjectField.fill('Playwright Test', { timeout: 10_000 });
    await messageField.fill('This is an automated test message.', { timeout: 10_000 });

    // Wait for button to be stable before clicking
    await submitButton.waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(500); // Small delay for DOM to stabilize
    await submitButton.click({ timeout: 15_000 });

    // Success alert should appear (increased timeout for reCAPTCHA validation)
    await expect(page.getByText(/message sent|successfully/i)).toBeVisible({ timeout: 20_000 });
  });
});
