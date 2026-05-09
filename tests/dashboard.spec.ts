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
    const now = new Date();
    const schedule = {
      id: 'test-restore',
      name: 'Test Restore State',
      enabled: true,
      startTime: '03:00',
      endTime: '04:00',
      repeatMode: 'daily',
      daysOfWeek: [now.getDay()], // Include today so schedule is evaluated
      createdAt: new Date().toISOString(),
      useAirplaneMode: false,
      restoreOnEnd: true,
      unsilenceWEAOnEnd: false,
    };

    await page.evaluate((s) => {
      localStorage.setItem('schedules', JSON.stringify([s]));
    }, schedule);

    // Use goto instead of reload to ensure Zustand store reinitializes with new localStorage data
    await page.goto('/');

    // Schedules should load without crashing
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    // Active schedules list should be empty (time window 03:00-04:00 doesn't match current time)
    await expect(page.getByText(/no active reminder schedules/i)).toBeVisible();
  });

  test('Dashboard scheduler loop runs when active schedule exists', async ({ page }) => {
    // Set log level to ultraverbose to capture scheduler logs
    await page.evaluate(() => {
      localStorage.setItem('settings', JSON.stringify({
        themeMode: 'light',
        logLevel: 'ultraverbose',
        notificationsEnabled: false,
      }));
    });

    // Create a schedule that will be active NOW (2-minute window)
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const endMinute = now.getMinutes() + 2;
    const endHour = endMinute < 60 ? now.getHours() : now.getHours() + 1;
    const endTime = `${pad(endHour)}:${pad(endMinute % 60)}`;

    const schedule = {
      id: 'test-scheduler-loop',
      name: 'Test Scheduler Loop',
      enabled: true,
      startTime,
      endTime,
      repeatMode: 'daily',
      daysOfWeek: [now.getDay()],
      createdAt: new Date().toISOString(),
      silenceWEAOnStart: false,
      useAirplaneMode: false,
    };

    await page.evaluate((s) => {
      localStorage.setItem('schedules', JSON.stringify([s]));
    }, schedule);

    // Navigate to Dashboard
    await page.goto('/');

    // Wait long enough for scheduler to run several tick cycles (5s interval)
    await page.waitForTimeout(7000);

    // Check the active schedules display - if scheduler is running, it should show the active schedule
    const activeWarning = page.getByText(/reminder active/i);
    const activeWarningVisible = await activeWarning.isVisible().catch(() => false);

    console.log('Active schedule warning visible:', activeWarningVisible);

    if (activeWarningVisible) {
      console.log('SUCCESS: Dashboard detected active schedule - scheduler is running!');
      expect(activeWarningVisible).toBe(true);
    } else {
      // If scheduler is not running, the active warning won't show
      console.log('FAILURE: Dashboard did not detect active schedule');
      console.log('This means the scheduler tick loop is NOT running');

      // Go to Logs to check what's happening
      await page.getByRole('link', { name: /logs/i }).click();
      await page.waitForTimeout(1000);

      // Check if ANY scheduler service logs appear
      const schedulerLogs = page.getByText(/isScheduleActive.*is.*active/i);
      const schedulerLogsVisible = await schedulerLogs.isVisible().catch(() => false);

      console.log('Scheduler service logs visible:', schedulerLogsVisible);
      console.log('If scheduler service logs exist but active warning does not, the Dashboard is not receiving updates');

      expect(activeWarningVisible).toBe(true); // Fail and show the problem
    }
  });

  test('schedule with useAirplaneMode is detected as active on Dashboard', async ({ page }) => {
    // Create a schedule with useAirplaneMode ENABLED that starts NOW
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const endMinute = now.getMinutes() + 2;
    const endHour = endMinute < 60 ? now.getHours() : now.getHours() + 1;
    const endTime = `${pad(endHour)}:${pad(endMinute % 60)}`;

    const schedule = {
      id: 'test-robot-airplane-logs',
      name: 'Test Robot Airplane Logs',
      enabled: true,
      startTime,
      endTime,
      repeatMode: 'daily',
      daysOfWeek: [now.getDay()],
      createdAt: new Date().toISOString(),
      useAirplaneMode: true,
      silenceWEAOnStart: false,
      restoreOnEnd: true,
    };

    await page.evaluate((s) => {
      localStorage.setItem('schedules', JSON.stringify([s]));
      localStorage.setItem('settings', JSON.stringify({
        themeMode: 'light',
        logLevel: 'ultraverbose',
        notificationsEnabled: false,
      }));
    }, schedule);

    // Navigate to Dashboard
    await page.goto('/');

    // Wait for scheduler tick to detect the active schedule (need at least one tick cycle)
    await page.waitForTimeout(7000);

    // Verify the active warning banner appears on Dashboard
    const activeWarning = page.getByText(/reminder active/i);
    await expect(activeWarning).toBeVisible();

    console.log('✅ PASSED: Schedule with useAirplaneMode detected as ACTIVE');
    console.log('\n📝 NOTE: Detailed emoji-prefixed logs (⚡, 🚀, 📡, 🔇, etc.) will appear in app Logs page');
    console.log('   when tested on actual APK. Browser tests cannot capture those logs.');
    console.log('   Expected logs on APK:');
    console.log('   • ⚡ Schedule "Test Robot Airplane Logs" JUST ACTIVATED');
    console.log('   • ⚙️ ANDROID CHECK: YES - Will fire robot actions');
    console.log('   • 🚀 CALLING runScheduleActions for "Test Robot Airplane Logs"');
    console.log('   • 📡 AIRPLANE MODE: Starting enable sequence');
    console.log('   • 🏁 ALL ROBOT ACTIONS COMPLETED for "Test Robot Airplane Logs"');
  });
});
