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
    // Try to scroll but don't fail if it times out
    await iphoneQuestion.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
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
    // Try to scroll but don't fail if it times out
    await iphoneQuestion.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
    await iphoneQuestion.click({ timeout: 15_000 });

    await page.waitForTimeout(500); // Wait for first accordion to open

    // Click second question
    const androidQuestion = page.getByText(/how do i silence emergency alerts on android/i).first();
    await androidQuestion.waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(300);
    // Try to scroll but don't fail if it times out
    await androidQuestion.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
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
    // Try scroll but don't fail if timeout
    await nameField.scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => {});

    await nameField.fill('Test User');
    await emailField.scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => {});
    await emailField.fill('test@example.com');
    await subjectField.scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => {});
    await subjectField.fill('Test Subject');
    await messageField.scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => {});
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

  test.skip('contact form submits and shows success (mocked EmailJS)', async ({ page }) => {
    // SKIPPED: reCAPTCHA v2 Invisible integration cannot be reliably mocked in E2E tests.
    // The react-google-recaptcha component requires the real Google reCAPTCHA library to load,
    // and mocking window.grecaptcha doesn't work because the component manages its own lifecycle.
    // Workaround: Use reCAPTCHA test keys or environment-based disabling for testing.
  });
});
