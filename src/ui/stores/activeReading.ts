// Pinia store: useActiveReadingStore. Single source of truth for the
// currently-loaded architectural reading. See refactor brief.
//
// Only the fixture loader is fully implemented for v1. The user and
// impersonation loaders are stubs that throw informative errors; the
// surrounding mechanism (state, error handling, getters) is in place so
// the production wiring can drop in when real auth and assessment storage
// are built.

import { defineStore } from 'pinia';
import type { InputMap, EngineOutput } from '../../engine';
import type { RenderingInstructions } from '../../synthesis';
import type { ConsistencyFlag } from '../../assembler/consistency/types';

export type ActiveReadingSource =
  | 'fixture'
  | 'answers'
  | 'user'
  | 'impersonation'
  | null;

export interface ActiveReadingState {
  source: ActiveReadingSource;
  sourceId: string | null;
  assessmentId: string | null;

  inputMap: InputMap | null;
  engineOutput: EngineOutput | null;
  renderingInstructions: RenderingInstructions | null;

  // Flags from assembler (parked in store, not in InputMap — engine stays pure)
  reach_confidence: 'high' | 'low' | null;
  consistency_flags: ConsistencyFlag[];

  loadedAt: Date | null;
  loading: boolean;
  error: Error | null;
}

const STORAGE_KEY = 'wael:activeReading:fixtureId';

function initialState(): ActiveReadingState {
  return {
    source: null,
    sourceId: null,
    assessmentId: null,
    inputMap: null,
    engineOutput: null,
    renderingInstructions: null,
    reach_confidence: null,
    consistency_flags: [],
    loadedAt: null,
    loading: false,
    error: null,
  };
}

function writePersistedReading(source: ActiveReadingSource, id: string | null): void {
  try {
    if (source === null || id === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      const value = JSON.stringify({ source, id });
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // Storage unavailable; non-fatal.
  }
}

export const useActiveReadingStore = defineStore('activeReading', {
  state: (): ActiveReadingState => initialState(),

  getters: {
    isReady: (s): boolean =>
      s.renderingInstructions !== null && !s.loading,
    isEmpty: (s): boolean =>
      s.source === null &&
      s.renderingInstructions === null &&
      !s.loading &&
      s.error === null,
    hasError: (s): boolean => s.error !== null,
    isImpersonating: (s): boolean => s.source === 'impersonation',
    modeLabel: (s): string => {
      if (s.source === 'fixture') {
        return s.sourceId === null ? 'Fixture' : `Fixture: ${s.sourceId}`;
      }
      if (s.source === 'answers') {
        return s.sourceId === null ? 'Answers' : `Answers: ${s.sourceId}`;
      }
      if (s.source === 'user') return 'Your reading';
      if (s.source === 'impersonation') {
        return s.sourceId === null
          ? 'Impersonating'
          : `Impersonating: ${s.sourceId}`;
      }
      return 'No reading loaded';
    },
  },

  actions: {
    async loadFromAnswers(fixtureId: string): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        // Lazy imports to keep the store dependency-light at the type level.
        const [
          { loadAnswersInput },
          { validateQuestionnaireAnswers },
          { runPipelineFromAnswers },
        ] = await Promise.all([
          import('../render/answers_loader'),
          import('../../assembler/validate-answers'),
          import('../render/pipeline'),
        ]);

        const loaded = loadAnswersInput(fixtureId);
        if (!loaded.ok) {
          throw new Error(loaded.reason);
        }

        const validation = validateQuestionnaireAnswers(loaded.answers);
        if (!validation.ok) {
          const messages = validation.errors
            .map((e: any) => `  ${e.code} at "${e.path}": ${e.message}`)
            .join('\n');
          throw new Error(
            `Invalid answers.json for fixture "${fixtureId}":\n${messages}`,
          );
        }

        const pipelineResult = await runPipelineFromAnswers(validation.value, {
          sourceId: fixtureId,
        });

        this.source = 'answers';
        this.sourceId = fixtureId;
        this.assessmentId = null;
        this.inputMap = pipelineResult.inputMap;
        this.engineOutput = pipelineResult.engineOutput;
        this.renderingInstructions = pipelineResult.renderingInstructions;
        this.reach_confidence = pipelineResult.reach_confidence;
        this.consistency_flags = pipelineResult.consistency_flags;
        this.loadedAt = new Date();
        writePersistedReading('answers', fixtureId);
      } catch (err) {
        // Leave previous state intact on failure (per brief).
        this.error = err instanceof Error ? err : new Error(String(err));
      } finally {
        this.loading = false;
      }
    },

    async loadUserLatest(userId: string): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        throw new Error(
          `loadUserLatest not implemented (userId="${userId}"). Real auth and assessment storage are a future task.`,
        );
      } catch (err) {
        this.error = err instanceof Error ? err : new Error(String(err));
      } finally {
        this.loading = false;
      }
    },

    async loadUserAssessment(
      userId: string,
      assessmentId: string,
    ): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        throw new Error(
          `loadUserAssessment not implemented (userId="${userId}", assessmentId="${assessmentId}"). Real auth and assessment storage are a future task.`,
        );
      } catch (err) {
        this.error = err instanceof Error ? err : new Error(String(err));
      } finally {
        this.loading = false;
      }
    },

    async loadImpersonation(
      targetUserId: string,
      assessmentId?: string,
    ): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        throw new Error(
          `loadImpersonation not implemented (targetUserId="${targetUserId}", assessmentId="${assessmentId ?? '<latest>'}"). Real impersonation backend is a future task.`,
        );
      } catch (err) {
        this.error = err instanceof Error ? err : new Error(String(err));
      } finally {
        this.loading = false;
      }
    },

    clear(): void {
      Object.assign(this, initialState());
      writePersistedReading(null, null);
    },

    async restoreFromStorage(): Promise<void> {
      if (!import.meta.env.DEV) return;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null || raw === '') return;
      try {
        const { source, id } = JSON.parse(raw) as { source: ActiveReadingSource; id: string };
        if (source === 'answers') {
          await this.loadFromAnswers(id);
        }
      } catch {
        // Corrupted storage; ignore and start fresh.
      }
    },
  },
});
