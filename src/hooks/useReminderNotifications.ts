import { useEffect } from 'react';
import { Reminder } from './useReminders';

const ENABLED_KEY = 'reme:notifications-enabled';
const NOTIFIED_KEY = 'reme:notified-reminders';
const CHECK_INTERVAL_MS = 60 * 1000;

// localStorage can throw (private mode, blocked storage); notifications are a convenience, so fail quietly
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export function getNotificationsEnabled(): boolean {
  return notificationsSupported() && Notification.permission === 'granted' && readStorage(ENABLED_KEY) === 'true';
}

export async function setNotificationsEnabled(enabled: boolean): Promise<boolean> {
  if (!enabled) {
    writeStorage(ENABLED_KEY, 'false');
    return false;
  }
  if (!notificationsSupported()) return false;
  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();
  const granted = permission === 'granted';
  writeStorage(ENABLED_KEY, granted ? 'true' : 'false');
  return granted;
}

/**
 * Shows a browser notification when a reminder comes due while the app is open.
 * Each reminder (keyed by id + due date, so snoozing re-arms it) notifies once.
 */
export function useReminderNotifications(reminders: Reminder[]) {
  useEffect(() => {
    const check = () => {
      if (!getNotificationsEnabled()) return;

      let notified: string[] = [];
      try {
        notified = JSON.parse(readStorage(NOTIFIED_KEY) || '[]');
      } catch {
        notified = [];
      }
      const notifiedSet = new Set(notified);
      const now = new Date();

      const due = reminders.filter(r =>
        !r.completed &&
        new Date(r.due_date) <= now &&
        !notifiedSet.has(`${r.id}:${r.due_date}`)
      );

      const show = (title: string, options: NotificationOptions) => {
        try {
          new Notification(title, { icon: '/vite.svg', ...options });
        } catch {
          // Some mobile browsers only allow notifications via a service worker
        }
      };

      // A backlog (e.g. right after enabling) becomes one summary instead of a burst
      if (due.length > 3) {
        show(`${due.length} follow-ups are due`, {
          body: due.slice(0, 3).map(r => r.title).join(', ') + '…',
          tag: 'reme-due-summary',
        });
      } else {
        for (const reminder of due) {
          const body = reminder.contact?.name
            ? `${reminder.contact.name}${reminder.description ? ` — ${reminder.description}` : ''}`
            : reminder.description || 'Follow-up due';
          show(reminder.title, { body, tag: reminder.id });
        }
      }
      for (const reminder of due) {
        notifiedSet.add(`${reminder.id}:${reminder.due_date}`);
      }

      if (due.length > 0) {
        // Keep the list bounded
        writeStorage(NOTIFIED_KEY, JSON.stringify([...notifiedSet].slice(-500)));
      }
    };

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [reminders]);
}
