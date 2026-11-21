/** Browser-safe session access. Keep legacy keys until all existing screens migrate. */
export const SESSION_EVENT = 'calls-session-change';
const SESSION_KEYS = [
  'isLoggedIn',
  'calls_token',
  'userId',
  'staffId',
  'username',
  'staffName',
  'role',
  'mobileNo',
  'active',
  'isClient',
  'clientId',
  'user',
  'menuIds',
  'calls-company',
];
export function readSession() {
  if (typeof window === 'undefined') return null;
  try {
    return {
      token: localStorage.getItem('calls_token') ?? '',
      userId: localStorage.getItem('userId') ?? '',
      username: localStorage.getItem('username') ?? '',
      isClient: localStorage.getItem('isClient') ?? 'N',
      clientId: localStorage.getItem('clientId') ?? '',
      menuIds: localStorage.getItem('menuIds'),
      loggedIn:
        localStorage.getItem('isLoggedIn') === 'true' &&
        !!localStorage.getItem('calls_token'),
    };
  } catch {
    return null;
  }
}
export function clearSession() {
  if (typeof window === 'undefined') return;
  for (const key of SESSION_KEYS) localStorage.removeItem(key);
  window.dispatchEvent(new Event(SESSION_EVENT));
}
export function saveSession(values: Record<string, string | null>) {
  if (typeof window === 'undefined') return;
  // Company context must never survive a change of user.
  localStorage.removeItem('calls-company');
  for (const [key, value] of Object.entries(values)) {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}
