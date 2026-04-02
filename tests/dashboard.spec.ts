import { test, expect } from '@playwright/test';

/**
 * Dashboard page tests — verify status cards, active schedule banner,
 * and darkness indicator render correctly.
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so tests start from a clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('shows "no active reminder" alert when no schedules exist', async ({ page }) => {
    await expect(
      page.getByText(/no active reminder schedules/i)
    ).toBeVisible();
  });

  test('shows schedules count card', async ({ page }) => {
    // Schedules card should show 0 with no data
    await expect(page.getByRole('heading', { name: 'Schedules', level: 6 })).toBeVisible();
    await expect(page.getByText('0 enabled')).toBeVisible();
  });

  test('shows theme darkness percentage card', async ({ page }) => {
    // Darkness card must show a % value (0–100)
    await expect(page.getByText('Theme Darkness')).toBeVisible();
    await expect(page.getByText(/%$/)).toBeVisible();
  });

  test('"Manage Schedules" button navigates to scheduler', async ({ page }) => {
    await page.getByRole('button', { name: /manage schedules/i }).click();
    await expect(page).toHaveURL('/scheduler');
  });

  test('shows active warning when a schedule is currently active', async ({ page }) => {
    // Inject an active schedule directly into localStorage
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    // Set time window to include current time (start 1h ago, end 1h from now)
    const start = `${pad(now.getHours() === 0 ? 23 : now.getHours() - 1)}:00`;
    const end   = `${pad(now.getHours() === 23 ? 0  : now.getHours() + 1)}:00`;

    const schedule = {
      id: 'test-active',
      name: 'Test Active Schedule',
      enabled: true,
      startTime: start,
      endTime: end,
      repeatMode: 'daily',
      daysOfWeek: [],
      createdAt: new Date().toISOString(),
    };

    await page.evaluate((s) => {
      localStorage.setItem('schedules', JSON.stringify([s]));
    }, schedule);

    await page.reload();

    // Banner should switch to warning variant
    await expect(page.getByText(/reminder active/i)).toBeVisible();
    await expect(page.getByText('REMINDER', { exact: true }).first()).toBeVisible();
  });

  test('schedule with restoreOnEnd field saves without error', async ({ page }) => {
    // Verify that new ScheduleEntry fields (restoreOnEnd, unsilenceWEAOnEnd) don't cause issues
    // Use a guaranteed-inactive time window: 03:00–04:00 (unlikely to be current time)
    const schedule = {
      id: 'test-restore',
      name: 'Test Restore State',
      enabled: true,
      startTime: '03:00',
      endTime: '04:00',
      repeatMode: 'daily',
      daysOfWeek: [],
      createdAt: new Date().toISOString(),
      useAirplaneMode: false,
      restoreOnEnd: true,
      unsilenceWEAOnEnd: false,
    };

    await page.evaluate((s) => {
      localStorage.setItem('schedules', JSON.stringify([s]));
    }, schedule);

    await page.reload();

    // Schedules should load without crashing
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    // Active schedules list should be empty (time window 03:00-04:00 doesn't match current time)
    await expect(page.getByText(/no active reminder schedules/i)).toBeVisible();
  });
});
