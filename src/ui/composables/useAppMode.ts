// useAppMode: returns the current application mode.
//
// Modes:
//   'dev'   - import.meta.env.DEV === true. Fixture picker visible.
//   'admin' - production build with admin role. Impersonation control.
//   'user'  - ordinary logged-in user. No dev or admin chrome.
//
// For v1, real auth detection is stubbed: in production builds the
// user is always treated as an ordinary user (no admin role, null id).
// The mechanism is in place so real auth can drop in later.

export type AppMode = 'dev' | 'admin' | 'user';

interface AuthStub {
  isAdmin: boolean;
  userId: string | null;
}

// Stubbed auth lookup. Real implementation lands when the auth integration
// is built (a separate task). In production today this returns a non-admin
// anonymous user.
function getAuthStub(): AuthStub {
  return { isAdmin: false, userId: null };
}

export function useAppMode(): AppMode {
  if (import.meta.env.DEV) return 'dev';
  const auth = getAuthStub();
  if (auth.isAdmin) return 'admin';
  return 'user';
}

export function getCurrentUserId(): string | null {
  if (import.meta.env.DEV) return null;
  return getAuthStub().userId;
}
