import { initialAnswers } from '@/lib/profile-schema';

const KEY = 'bordsro-guest';

/** Guest mode is local-only: no account is created and nothing is saved to the cloud. */
export function isGuest(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(KEY) === '1';
}

export function setGuestMode(on: boolean) {
  if (typeof window === 'undefined') return;
  if (on) window.localStorage.setItem(KEY, '1');
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('bordsro-guest-change'));
}

export function guestProfile() {
  return { ...initialAnswers, display_name: 'Gäst', completed: true, reminders_enabled: false, reminder_lead: 5 as const };
}

export function guestToday() {
  return { profile: guestProfile(), meals: [], workouts: [] };
}

export const GUEST_SAVE_MESSAGE = 'Som gäst sparas inget. Logga in eller skapa ett konto för att spara dina val.';
