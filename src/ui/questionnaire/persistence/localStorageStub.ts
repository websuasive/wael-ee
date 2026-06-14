// SessionPersistence implementation backed by localStorage.
// Dev stub for resume work with no backend.

import type { SessionPersistence, PersistedSession } from '../types';

const STORAGE_KEY_PREFIX = 'wael:questionnaire:session:';

export const localStorageStub: SessionPersistence = {
  async load(userId: string): Promise<PersistedSession | null> {
    const key = STORAGE_KEY_PREFIX + userId;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return null;
      const parsed = JSON.parse(raw) as PersistedSession;
      return parsed;
    } catch {
      return null;
    }
  },

  async save(session: PersistedSession): Promise<void> {
    const key = STORAGE_KEY_PREFIX + session.userId;
    try {
      window.localStorage.setItem(key, JSON.stringify(session));
    } catch {
      // Storage unavailable; non-fatal.
    }
  },
};
