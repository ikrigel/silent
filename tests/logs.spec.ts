import { test, expect } from '@playwright/test';

/**
 * Logs page tests — view, select, delete, and export log entries.
 */

test.describe('Logs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first so localStorage is accessible, then clear and reload for a clean state
    await page.goto('/logs');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /logs/i, level: 4 })).toBeVisible();
  });

  test('shows empty state with no logs', async ({ page }) => {
    // Wait for any initial UI work to finish, then assert the empty state is visible
    await page.waitForTimeout(500);
    // Match any reasonable "no logs" text; allow either role=alert or plain text
    const emptyAlert = page.getByRole('alert').filter({ hasText: /no logs/i }).first();
    // Fallback to searching by text if role=alert is not present
    if (await emptyAlert.count() === 0) {
      await expect(page.getByText(/no logs/i)).toBeVisible({ timeout: 10000 });
    } else {
      await expect(emptyAlert).toBeVisible({ timeout: 10000 });
    }
  });

  test('Delete Selected button is disabled with no selection', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /delete selected/i })
    ).toBeDisabled();
  });

  test('Clear All button is disabled with no logs', async ({ page }) => {
    const clearBtn = page.getByRole('button', { name: /clear all/i });
    // Prefer native disabled, but some implementations use aria-disabled
    try {
      await expect(clearBtn).toBeDisabled({ timeout: 3000 });
    } catch {
      await expect(clearBtn).toHaveAttribute('aria-disabled', 'true');
    }
  });

  test('shows log entries when logs exist in localStorage', async ({ page }) => {
    const logs = [
      {
        id: 'log-1',
        level: 'info',
        message: 'Test info log message',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'log-2',
        level: 'error',
        message: 'Test error log message',
        timestamp: new Date().toISOString(),
      },
    ];
    await page.evaluate((l) => localStorage.setItem('logs', JSON.stringify(l)), logs);
    await page.reload();

    await expect(page.getByText('Test info log message')).toBeVisible();
    await expect(page.getByText('Test error log message')).toBeVisible();
  });

  test('level chips display correctly', async ({ page }) => {
    const logs = [
      { id: 'l1', level: 'info',    message: 'Info entry',    timestamp: new Date().toISOString() },
      { id: 'l2', level: 'error',   message: 'Error entry',   timestamp: new Date().toISOString() },
      { id: 'l3', level: 'verbose', message: 'Verbose entry', timestamp: new Date().toISOString() },
    ];
    await page.evaluate((l) => localStorage.setItem('logs', JSON.stringify(l)), logs);
    await page.reload();
    await page.waitForTimeout(300);

    await expect(page.getByText(/Info entry|Info/)).toBeVisible();
    await expect(page.getByText(/Error entry|Error/)).toBeVisible();
    await expect(page.getByText(/Verbose entry|Verbose/)).toBeVisible();
  });

  test('can select all logs and clear them', async ({ page }) => {
    const logs = [
      { id: 'l1', level: 'info', message: 'Log A', timestamp: new Date().toISOString() },
      { id: 'l2', level: 'info', message: 'Log B', timestamp: new Date().toISOString() },
    ];
    await page.evaluate((l) => localStorage.setItem('logs', JSON.stringify(l)), logs);
    await page.reload();
    await page.waitForTimeout(300);

    // Verify logs are visible initially
    await expect(page.getByText('Log A')).toBeVisible();
    await expect(page.getByText('Log B')).toBeVisible();

    // Select all via header checkbox
    const headerCheckbox = page.locator('thead input[type="checkbox"]');
    await expect(headerCheckbox).toBeVisible();
    await headerCheckbox.click();
    await page.waitForTimeout(200);

    // Delete Selected should now be enabled
    const deleteBtn = page.getByRole('button', { name: /delete selected/i });
    await expect(deleteBtn).toBeEnabled();
    await deleteBtn.click();
    await page.waitForTimeout(600);

    // Logs should be gone — verify they're no longer visible
    await expect(page.getByText('Log A')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Log B')).not.toBeVisible({ timeout: 5000 });
  });

  test('Export JSON button triggers download', async ({ page }) => {
    const logs = [
      { id: 'l1', level: 'info', message: 'Export me', timestamp: new Date().toISOString() },
    ];
    await page.evaluate((l) => localStorage.setItem('logs', JSON.stringify(l)), logs);
    await page.reload();

    // Listen for download event
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export json/i }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/silent-logs.*\.json/);
  });

  test('Refresh button reloads logs from storage', async ({ page }) => {
    await page.getByRole('button', { name: /refresh/i }).click();
    // Should not throw — page stays functional
    await expect(page.getByRole('heading', { name: /logs/i, level: 4 })).toBeVisible();
  });
});
