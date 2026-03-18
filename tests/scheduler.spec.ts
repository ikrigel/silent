import { test, expect } from '@playwright/test';

/**
 * Scheduler page tests — create, toggle, edit, and delete schedules.
 */

test.describe('Scheduler', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scheduler');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('renders page heading and New Schedule button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /scheduler/i, level: 4 })).toBeVisible();
    await expect(page.getByRole('button', { name: /new schedule/i })).toBeVisible();
  });

  test('shows empty state when no schedules exist', async ({ page }) => {
    await expect(page.getByText(/no schedules yet|no schedules/i)).toBeVisible();
  });

  test('opens create form on button click', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new schedule/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('dialog')).toBeVisible();
    // Check for dialog title specifically
    await expect(page.getByRole('heading', { name: /new schedule/i })).toBeVisible();
  });

  test('creates a new daily schedule', async ({ page }) => {
    // Open form
    await page.getByRole('button', { name: /new schedule/i }).click();

    // Fill in name
    await page.getByLabel(/schedule name/i).fill('Night Silence');

    // Set start/end times
    await page.getByLabel(/start time/i).fill('22:00');
    await page.getByLabel(/end time/i).fill('07:00');

    // Repeat mode already defaults to daily — submit
    await page.getByRole('button', { name: /create/i }).click();

    // Dialog should close and entry should appear in list
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Night Silence')).toBeVisible();
    await expect(page.getByText('22:00 – 07:00')).toBeVisible();
  });

  test('can toggle a schedule on/off', async ({ page }) => {
    // Seed a schedule via localStorage
    const schedule = {
      id: 'toggle-test',
      name: 'Toggle Me',
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
      repeatMode: 'daily',
      daysOfWeek: [],
      createdAt: new Date().toISOString(),
    };
    await page.evaluate((s) => localStorage.setItem('schedules', JSON.stringify([s])), schedule);
    await page.reload();

    const toggle = page.getByRole('checkbox').or(page.locator('input[type="checkbox"]')).first();
    const wasChecked = await toggle.isChecked();
    await toggle.click();
    await expect(toggle).toBeChecked({ checked: !wasChecked });
  });

  test('can delete a schedule', async ({ page }) => {
    // Seed a schedule
    const schedule = {
      id: 'delete-test',
      name: 'Delete Me',
      enabled: true,
      startTime: '10:00',
      endTime: '11:00',
      repeatMode: 'none',
      daysOfWeek: [],
      createdAt: new Date().toISOString(),
    };
    await page.evaluate((s) => localStorage.setItem('schedules', JSON.stringify([s])), schedule);
    await page.reload();

    await expect(page.getByText('Delete Me')).toBeVisible();

    // Click the delete (trash) icon button
    await page.getByRole('button', { name: '' }).last().click();

    await expect(page.getByText('Delete Me')).not.toBeVisible();
    await expect(page.getByText(/no schedules yet/i)).toBeVisible();
  });

  test('form closes on Cancel', async ({ page }) => {
    await page.getByRole('button', { name: /new schedule/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('weekly mode shows day-of-week checkboxes', async ({ page }) => {
    await page.getByRole('button', { name: /new schedule/i }).click();
    // Change repeat mode to weekly
    await page.getByLabel(/repeat/i).click();
    await page.getByRole('option', { name: /weekly/i }).click();
    // Day checkboxes should appear
    await expect(page.getByText('Mon')).toBeVisible();
    await expect(page.getByText('Fri')).toBeVisible();
  });
});
