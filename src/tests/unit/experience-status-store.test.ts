// Status store tests. Per EXPERIENCE.md sections 7.3, 11.5, 11.9.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { ExperienceStatus, Flag } from '@/ui/experience/types';
import {
  _resetPersistenceForTesting,
  _setPersistenceForTesting,
  STATUS_STORAGE_KEY,
  localStoragePersistence,
  useExperienceStatusStore,
  type Persistence,
} from '@/ui/experience/status_store';

interface StubPersistence extends Persistence {
  writeOne: ReturnType<typeof vi.fn>;
  removeOne: ReturnType<typeof vi.fn>;
  loadAll: ReturnType<typeof vi.fn>;
}

function makeStubPersistence(seed: Record<string, ExperienceStatus> = {}): StubPersistence {
  const data: Record<string, ExperienceStatus> = { ...seed };
  return {
    loadAll: vi.fn(async () => ({ ...data })),
    writeOne: vi.fn(async (s: ExperienceStatus) => {
      data[s.variant_id] = s;
    }),
    removeOne: vi.fn(async (id: string) => {
      delete data[id];
    }),
  };
}

function makeStatus(id: string, flag: Flag): ExperienceStatus {
  return { variant_id: id, flag, flagged_at: new Date('2026-01-01T00:00:00Z') };
}

describe('experience status store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    _resetPersistenceForTesting();
  });

  it('hydrates from persistence into both optimistic and committed', async () => {
    const seed = { exp_001: makeStatus('exp_001', 'saved') };
    const stub = makeStubPersistence(seed);
    _setPersistenceForTesting(stub);

    const store = useExperienceStatusStore();
    expect(store.flagFor('exp_001')).toBeNull();
    await store.hydrate();
    expect(stub.loadAll).toHaveBeenCalledOnce();
    expect(store.flagFor('exp_001')?.flag).toBe('saved');
    expect(store.allFlagged()).toHaveLength(1);
  });

  it('setFlag — happy path: optimistic updates synchronously, committed on resolve', async () => {
    const stub = makeStubPersistence();
    _setPersistenceForTesting(stub);
    const store = useExperienceStatusStore();
    await store.hydrate();

    const promise = store.setFlag('exp_001', 'saved');
    // Synchronous optimistic update.
    expect(store.flagFor('exp_001')?.flag).toBe('saved');
    await promise;
    expect(stub.writeOne).toHaveBeenCalledOnce();
    expect(stub.writeOne.mock.calls[0]![0].variant_id).toBe('exp_001');
  });

  it('clearFlag — happy path: removes from both refs and calls removeOne', async () => {
    const seed = { exp_001: makeStatus('exp_001', 'saved') };
    const stub = makeStubPersistence(seed);
    _setPersistenceForTesting(stub);
    const store = useExperienceStatusStore();
    await store.hydrate();

    expect(store.flagFor('exp_001')?.flag).toBe('saved');
    const promise = store.clearFlag('exp_001');
    // Synchronous removal from optimistic.
    expect(store.flagFor('exp_001')).toBeNull();
    await promise;
    expect(stub.removeOne).toHaveBeenCalledWith('exp_001');
    expect(store.flagFor('exp_001')).toBeNull();
  });

  it('setFlag — failure reverts optimistic to committed (empty)', async () => {
    const stub = makeStubPersistence();
    stub.writeOne = vi.fn(async () => {
      throw new Error('storage failure');
    });
    _setPersistenceForTesting(stub);
    const store = useExperienceStatusStore();
    await store.hydrate();

    const promise = store.setFlag('exp_001', 'saved');
    expect(store.flagFor('exp_001')?.flag).toBe('saved'); // sync optimistic
    await expect(promise).rejects.toThrow('storage failure');
    expect(store.flagFor('exp_001')).toBeNull(); // reverted
  });

  it('setFlag — failure reverts to previously-committed flag', async () => {
    const seed = { exp_001: makeStatus('exp_001', 'saved') };
    const stub = makeStubPersistence(seed);
    _setPersistenceForTesting(stub);
    const store = useExperienceStatusStore();
    await store.hydrate();

    // Second setFlag will fail; should revert to the seeded 'saved'.
    stub.writeOne = vi.fn(async () => {
      throw new Error('quota');
    });
    const promise = store.setFlag('exp_001', 'done');
    expect(store.flagFor('exp_001')?.flag).toBe('done');
    await expect(promise).rejects.toThrow('quota');
    expect(store.flagFor('exp_001')?.flag).toBe('saved');
  });

  it('four-write race: superseded failure is a no-op on optimistic', async () => {
    // Trace from EXPERIENCE.md section 11.5:
    //   1. setFlag('exp_001', 'saved')  -> promise A, optimistic = saved
    //   2. setFlag('exp_001', 'done')   -> promise B, optimistic = done
    //   3. B resolves first.
    //   4. A rejects after B has resolved.
    //   Expected: optimistic = done, committed = done. A's rejection does
    //   not revert anything because B has already superseded.
    let resolveA: () => void = () => {};
    let rejectA: (err: Error) => void = () => {};
    let resolveB: () => void = () => {};

    const promiseA = new Promise<void>((res, rej) => {
      resolveA = res;
      rejectA = rej;
    });
    const promiseB = new Promise<void>((res) => {
      resolveB = res;
    });

    const seq: Array<Promise<void>> = [promiseA, promiseB];
    const stub: Persistence = {
      async loadAll() {
        return {};
      },
      writeOne: vi.fn(() => seq.shift()!) as Persistence['writeOne'],
      async removeOne() {},
    };
    _setPersistenceForTesting(stub);

    const store = useExperienceStatusStore();
    await store.hydrate();

    const callA = store.setFlag('exp_001', 'saved');
    expect(store.flagFor('exp_001')?.flag).toBe('saved');

    const callB = store.setFlag('exp_001', 'done');
    expect(store.flagFor('exp_001')?.flag).toBe('done');

    // Resolve B first, then reject A.
    resolveB();
    await callB;
    expect(store.flagFor('exp_001')?.flag).toBe('done');

    rejectA(new Error('A failed'));
    await expect(callA).rejects.toThrow('A failed');

    // Final state: A's failure was superseded, optimistic stays 'done'.
    expect(store.flagFor('exp_001')?.flag).toBe('done');
    // Committed reflects B's success.
    void resolveA;
  });

  it('clearFlag — failure restores the previously-committed flag', async () => {
    const seed = { exp_001: makeStatus('exp_001', 'saved') };
    const stub = makeStubPersistence(seed);
    stub.removeOne = vi.fn(async () => {
      throw new Error('cannot remove');
    });
    _setPersistenceForTesting(stub);
    const store = useExperienceStatusStore();
    await store.hydrate();

    const promise = store.clearFlag('exp_001');
    expect(store.flagFor('exp_001')).toBeNull(); // sync optimistic removal
    await expect(promise).rejects.toThrow('cannot remove');
    expect(store.flagFor('exp_001')?.flag).toBe('saved'); // reverted
  });

  it('lookups read from optimistic state before the persistence write resolves', async () => {
    let resolveWrite: () => void = () => {};
    const writePromise = new Promise<void>((res) => {
      resolveWrite = res;
    });
    const stub: Persistence = {
      async loadAll() {
        return {};
      },
      writeOne: vi.fn(() => writePromise) as Persistence['writeOne'],
      async removeOne() {},
    };
    _setPersistenceForTesting(stub);

    const store = useExperienceStatusStore();
    await store.hydrate();

    const promise = store.setFlag('exp_001', 'saved');
    // Before the write resolves, optimistic should already show the value.
    expect(store.flagFor('exp_001')?.flag).toBe('saved');
    expect(store.allFlagged().map((s) => s.variant_id)).toEqual(['exp_001']);
    expect(store.flaggedByStatus('saved').map((s) => s.variant_id)).toEqual([
      'exp_001',
    ]);
    expect(store.flaggedByStatus('done')).toEqual([]);

    resolveWrite();
    await promise;
  });

  it('rapid toggling: final state matches the last call (§11.9)', async () => {
    const stub = makeStubPersistence();
    _setPersistenceForTesting(stub);
    const store = useExperienceStatusStore();
    await store.hydrate();

    const p1 = store.setFlag('exp_001', 'saved');
    const p2 = store.setFlag('exp_001', 'done');
    const p3 = store.clearFlag('exp_001');

    await Promise.all([p1, p2, p3]);
    expect(store.flagFor('exp_001')).toBeNull();
  });

  it('localStorage failure path: real backend, mocked setItem throws', async () => {
    // Use the real localStoragePersistence; install a stub window.localStorage
    // that throws on setItem (mimicking QuotaExceededError / private mode).
    // vitest runs in the node environment, so window is not defined; we
    // install a minimal global window for the duration of this test.
    const storage: Record<string, string> = {
      [STATUS_STORAGE_KEY]: JSON.stringify({
        exp_001: {
          variant_id: 'exp_001',
          flag: 'saved',
          flagged_at: '2026-01-01T00:00:00.000Z',
        },
      }),
    };
    const localStorageStub = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(),
      key: vi.fn(() => null),
      length: 0,
    };
    const g = globalThis as unknown as Record<string, unknown>;
    const had = 'window' in g;
    const prior = g['window'];
    g['window'] = { localStorage: localStorageStub };

    try {
      _setPersistenceForTesting(localStoragePersistence);
      const store = useExperienceStatusStore();
      await store.hydrate();
      expect(store.flagFor('exp_001')?.flag).toBe('saved');

      const promise = store.setFlag('exp_001', 'done');
      // Optimistic update lands synchronously.
      expect(store.flagFor('exp_001')?.flag).toBe('done');
      await expect(promise).rejects.toThrow('QuotaExceededError');
      // Reverted to the previously-committed seed value.
      expect(store.flagFor('exp_001')?.flag).toBe('saved');
    } finally {
      if (had) {
        g['window'] = prior;
      } else {
        delete g['window'];
      }
    }
  });
});
