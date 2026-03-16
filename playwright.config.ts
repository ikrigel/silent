import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration.
 * Runs tests against the Vite dev server (auto-started before tests).
 * See: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory containing test files
  testDir: './tests',

  // Re-run failed tests once before marking them as failed
  retries: 1,

  // Run tests in parallel across files
  fullyParallel: true,

  // Fail the CI build if test.only is accidentally left in source
  forbidOnly: !!process.env.CI,

  // Show one failure per test in CI, full details locally
  reporter: process.env.CI ? 'github' : 'html',

  // Global test timeout - increased to 60s for reCAPTCHA and slower environments
  timeout: 60_000,

  // Shared settings for every test
  use: {
    baseURL: 'http://localhost:5173',

    // Capture trace on first retry — useful for debugging failures
    trace: 'on-first-retry',

    // Capture screenshot on test failure
    screenshot: 'only-on-failure',

    // Increased navigation timeout for slow networks/CI
    navigationTimeout: 30_000,
  },

  // Browser matrix
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Start the Vite dev server automatically before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
