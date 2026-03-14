/**
 * Browser Notification Service
 * Fires a Web Push notification reminding the user to MANUALLY silence
 * emergency alerts on their device when a schedule window opens.
 *
 * NOTE: Web apps CANNOT programmatically silence WEA (Wireless Emergency
 * Alerts). These are delivered at modem/radio level and bypass all software,
 * including Do Not Disturb. This service only sends a browser reminder.
 */

/** Request notification permission from the browser */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

/** Fire a browser notification reminding user to manually silence alerts */
export function fireScheduleReminder(scheduleName: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification('💤 Time to silence emergency alerts', {
    body: `Schedule "${scheduleName}" is now active.\nGo to your phone Settings and turn off Extreme Alerts manually.`,
    icon: '/silent.png',
    tag: `silent-reminder-${scheduleName}`,  // prevents duplicate notifications
    requireInteraction: true,                 // stays until user dismisses
  });
}

/** Fire a browser notification when a schedule window ends */
export function fireScheduleEndReminder(scheduleName: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification('🔔 You can re-enable emergency alerts', {
    body: `Schedule "${scheduleName}" has ended.\nRemember to go to Settings and turn Extreme Alerts back on.`,
    icon: '/silent.png',
    tag: `silent-end-${scheduleName}`,
    requireInteraction: true,
  });
}
