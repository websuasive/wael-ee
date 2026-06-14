// Status persistence store. Per EXPERIENCE.md sections 7.2, 7.3, 11.5, 11.9.
//
// Pinia (Composition API setup style) store wrapping localStorage. Holds two
// state references for each experience id:
//
//   - committed: what is currently persisted (source of truth).
//   - optimistic: what the UI is currently rendering.
//
// setFlag and clearFlag update optimistic synchronously and return a Promise
// that resolves on persistence success. On rejection, optimistic is re-synced
// to committed unless a later call has already superseded this call's intent
// (the four-write race trace per section 11.5).
//
// The store is exposed in Options-style spec interface (statuses, flagFor,
// allFlagged, flaggedByStatus, setFlag, clearFlag) but uses the Composition
// API internally because the spec mandates Readonly<Ref<...>> for statuses.
//
// The persistence backend is swappable behind the Persistence interface; the
// default v1 backend wraps localStorage. Tests inject a stub. Production wiring
// (a server-backed store) will conform to the same interface.

import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';
import type { ExperienceStatus, Flag } from './types';

/* ------------------------------------------------------------------ */
/* Persistence interface — section 7.2                                */
/* ------------------------------------------------------------------ */

export interface Persistence {
  loadAll(): Promise<Record<string, ExperienceStatus>>;
  writeOne(status: ExperienceStatus): Promise<void>;
  removeOne(variantId: string): Promise<void>;
}

export const STATUS_STORAGE_KEY = 'wael.experience.status.v3';

interface PersistedRecord {
  variant_id: string;
  flag: Flag;
  flagged_at: string;
}

function reviveRecord(raw: PersistedRecord): ExperienceStatus {
  return {
    variant_id: raw.variant_id,
    flag: raw.flag,
    flagged_at: new Date(raw.flagged_at),
  };
}

function reviveAll(
  raw: Record<string, PersistedRecord>,
): Record<string, ExperienceStatus> {
  const out: Record<string, ExperienceStatus> = {};
  for (const id of Object.keys(raw)) {
    const r = raw[id];
    if (r === undefined) continue;
    out[id] = reviveRecord(r);
  }
  return out;
}

/**
 * v1 backend: localStorage. setItem is synchronous but may throw
 * (QuotaExceededError, private-mode disabled storage); the async wrapper
 * surfaces those as rejected Promises so the store's failure path runs
 * uniformly across backends.
 */
export const localStoragePersistence: Persistence = {
  async loadAll() {
    try {
      const raw = window.localStorage.getItem(STATUS_STORAGE_KEY);
      if (raw === null || raw === '') return {};
      const parsed = JSON.parse(raw) as Record<string, PersistedRecord>;
      return reviveAll(parsed);
    } catch {
      // Malformed JSON or storage unavailable: treat as empty rather than
      // bringing the layer down. Surfaces as "no flags" to the man.
      return {};
    }
  },
  async writeOne(status) {
    const current = await this.loadAll();
    current[status.variant_id] = status;
    window.localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(current));
  },
  async removeOne(variantId) {
    const current = await this.loadAll();
    delete current[variantId];
    window.localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(current));
  },
};

/* ------------------------------------------------------------------ */
/* Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function withEntry(
  map: Record<string, ExperienceStatus>,
  status: ExperienceStatus,
): Record<string, ExperienceStatus> {
  return { ...map, [status.variant_id]: status };
}

function withoutEntry(
  map: Record<string, ExperienceStatus>,
  variantId: string,
): Record<string, ExperienceStatus> {
  if (!(variantId in map)) return map;
  const next = { ...map };
  delete next[variantId];
  return next;
}

/* ------------------------------------------------------------------ */
/* Module-level persistence injection                                 */
/* ------------------------------------------------------------------ */

let activePersistence: Persistence = localStoragePersistence;

/**
 * Test seam: install an alternative persistence backend before instantiating
 * the store. Production code does not call this. The setup-style
 * defineStore factory does not accept parameters, so injection happens via
 * this module-level switch rather than a constructor argument.
 */
export function _setPersistenceForTesting(p: Persistence): void {
  activePersistence = p;
}

/** Restore the default localStorage backend. */
export function _resetPersistenceForTesting(): void {
  activePersistence = localStoragePersistence;
}

/* ------------------------------------------------------------------ */
/* The store                                                          */
/* ------------------------------------------------------------------ */

export const useExperienceStatusStore = defineStore(
  'experienceStatus',
  () => {
    const optimistic = ref<Record<string, ExperienceStatus>>({});
    const committed = ref<Record<string, ExperienceStatus>>({});

    // Supersession token per experience id. Each setFlag / clearFlag call
    // writes a fresh object here at call time and checks for identity on
    // failure. A later call overwrites the token, so an earlier call's
    // failure becomes a no-op on optimistic state (the section 11.5
    // four-write race trace). We cannot identity-compare against ref values
    // directly because Vue wraps object values in a reactive proxy on read.
    const intentTokens = new Map<string, object>();

    async function hydrate(): Promise<void> {
      const loaded = await activePersistence.loadAll();
      // Two independent copies so a later mutation of one does not bleed
      // into the other.
      committed.value = { ...loaded };
      optimistic.value = { ...loaded };
    }

    function flagFor(variantId: string): ExperienceStatus | null {
      return optimistic.value[variantId] ?? null;
    }

    function allFlagged(): ExperienceStatus[] {
      return Object.values(optimistic.value);
    }

    function flaggedByStatus(flag: Flag): ExperienceStatus[] {
      return Object.values(optimistic.value).filter((s) => s.flag === flag);
    }

    async function setFlag(
      variantId: string,
      flag: Flag,
    ): Promise<void> {
      const newStatus: ExperienceStatus = {
        variant_id: variantId,
        flag,
        flagged_at: new Date(),
      };
      const priorCommitted = committed.value[variantId];
      const myToken = {};
      intentTokens.set(variantId, myToken);

      optimistic.value = withEntry(optimistic.value, newStatus);

      try {
        await activePersistence.writeOne(newStatus);
        committed.value = withEntry(committed.value, newStatus);
        if (intentTokens.get(variantId) === myToken) {
          intentTokens.delete(variantId);
        }
      } catch (err) {
        if (intentTokens.get(variantId) === myToken) {
          if (priorCommitted !== undefined) {
            optimistic.value = withEntry(optimistic.value, priorCommitted);
          } else {
            optimistic.value = withoutEntry(optimistic.value, variantId);
          }
          intentTokens.delete(variantId);
        }
        throw err;
      }
    }

    async function clearFlag(variantId: string): Promise<void> {
      const priorCommitted = committed.value[variantId];
      const myToken = {};
      intentTokens.set(variantId, myToken);

      optimistic.value = withoutEntry(optimistic.value, variantId);

      try {
        await activePersistence.removeOne(variantId);
        committed.value = withoutEntry(committed.value, variantId);
        if (intentTokens.get(variantId) === myToken) {
          intentTokens.delete(variantId);
        }
      } catch (err) {
        if (intentTokens.get(variantId) === myToken) {
          if (priorCommitted !== undefined) {
            optimistic.value = withEntry(optimistic.value, priorCommitted);
          }
          intentTokens.delete(variantId);
        }
        throw err;
      }
    }

    return {
      statuses: readonly(optimistic),
      flagFor,
      allFlagged,
      flaggedByStatus,
      setFlag,
      clearFlag,
      hydrate,

      // Internal handles exposed for test inspection. Not part of the §7.3
      // public interface; consumers should use the methods above.
      _committed: readonly(committed),
    };
  },
);
