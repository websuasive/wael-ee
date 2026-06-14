// Pinia store: useQuestionnaireStore. Single source of truth for questionnaire state.
// Stores raw answers + per-question validity only. No mapping to assembler fields.

import { defineStore } from 'pinia';
import type {
  AnswerValue,
  Manifest,
  SessionPersistence,
  PersistedSession,
  ConditionalCondition,
} from '../questionnaire/types';
import type { QuestionnaireAnswers, DomainKey, DirectionKey } from '@/assembler/answers';
import { validateQuestionnaireAnswers } from '@/assembler/validate-answers';
import { interpretRelationalDomains } from '@/assembler/domains';
import { runPipelineFromAnswers } from '../render/pipeline';
import { useActiveReadingStore } from './activeReading';

export type QuestionnaireStatus = 'in_progress' | 'complete';
export type QuestionnaireMode = 'live' | 'fixture';

interface QuestionnaireState {
  answers: Record<string, AnswerValue>;
  lastPageId: string | null;
  sessionId: string | null;
  userId: string | null;
  status: QuestionnaireStatus;
  manifest: Manifest | null;
  persistence: SessionPersistence | null;
  mode: QuestionnaireMode;
  fixtureId: string | null;
}

function initialState(): QuestionnaireState {
  return {
    answers: {},
    lastPageId: null,
    sessionId: null,
    userId: null,
    status: 'in_progress',
    manifest: null,
    persistence: null,
    mode: 'live',
    fixtureId: null,
  };
}

export const useQuestionnaireStore = defineStore('questionnaire', {
  state: (): QuestionnaireState => initialState(),

  getters: {
    isValid: (state) => (id: string): boolean => {
      const question = findQuestionById(state.manifest, id);
      if (!question) return false;
      const answered = state.answers[id] !== undefined && state.answers[id] !== null;
      return question.required ? answered : true;
    },

    isAnswered: (state) => (id: string): boolean => {
      return state.answers[id] !== undefined && state.answers[id] !== null;
    },

    isQuestionVisible: (state) => (id: string): boolean => {
      const question = findQuestionById(state.manifest, id);
      if (!question) return false;
      if (!question.conditionalOn) return true;
      
      // Handle presence form (string)
      if (typeof question.conditionalOn === 'string') {
        const conditionAnswer = state.answers[question.conditionalOn];
        return conditionAnswer !== undefined && conditionAnswer !== null;
      }
      
      // Handle value form (ConditionalCondition)
      const condition = question.conditionalOn as ConditionalCondition;
      const conditionAnswer = state.answers[condition.questionId];
      if (conditionAnswer === undefined || conditionAnswer === null) {
        return condition.operator === 'absent';
      }
      
      switch (condition.operator) {
        case 'equals':
          return conditionAnswer === condition.value;
        case 'not_equals':
          return conditionAnswer !== condition.value;
        case 'present':
          return true;
        case 'absent':
          return false;
        default:
          return true;
      }
    },

    isPageComplete: (state) => (pageId: string): boolean => {
      const page = state.manifest?.pages.find((p) => p.id === pageId);
      if (!page) return false;
      return page.questions.every((q) => {
        const question = findQuestionById(state.manifest, q.id);
        if (!question) return false;
        
        // Get full QuestionDef for renderer-specific logic
        const fullQuestion = state.manifest?.pages
          .flatMap((p) => p.questions)
          .find((fq) => fq.id === q.id);
        
        // Check if question is visible - inline the logic
        if (question.conditionalOn) {
          let isVisible = true;
          if (typeof question.conditionalOn === 'string') {
            const conditionAnswer = state.answers[question.conditionalOn];
            isVisible = conditionAnswer !== undefined && conditionAnswer !== null;
          } else {
            const condition = question.conditionalOn as ConditionalCondition;
            const conditionAnswer = state.answers[condition.questionId];
            if (conditionAnswer === undefined || conditionAnswer === null) {
              isVisible = condition.operator === 'absent';
            } else {
              switch (condition.operator) {
                case 'equals':
                  isVisible = conditionAnswer === condition.value;
                  break;
                case 'not_equals':
                  isVisible = conditionAnswer !== condition.value;
                  break;
                case 'present':
                  isVisible = true;
                  break;
                case 'absent':
                  isVisible = false;
                  break;
                default:
                  isVisible = true;
              }
            }
          }
          if (!isVisible) return true; // Hidden questions don't block completion
        }
        
        // Special handling for peace_discriminator: require field PRESENT (matches validator)
        // Validator requires presence (REQUIRED_FIELDS); accepts empty {}, partial, full
        // Renderer initializes to {} on mount, so no-pick man has present-empty {}
        if (q.id === 'peace_discriminator' && question.required) {
          const peace = state.answers[question.id];
          return peace !== undefined && peace !== null && typeof peace === 'object';
        }
        
        // Special handling for domain_sliders: require all domains in the Record
        if (fullQuestion?.renderer === 'domain_sliders' && question.required) {
          const record = state.answers[question.id] as any;
          if (!record) return false;
          const domains = fullQuestion.config?.domains as any;
          if (!domains) return false;
          // Extract domain keys from either string[] or DomainSliderConfig[]
          const domainKeys: string[] = [];
          for (const d of domains) {
            if (typeof d === 'string') {
              domainKeys.push(d);
            } else if (d && typeof d === 'object' && 'key' in d) {
              domainKeys.push(d.key);
            }
          }
          return domainKeys.every((domain: string) => record[domain] !== undefined && record[domain] !== null);
        }
        
        // Special handling for allocation: check engagement (present object), not non-emptiness
        // Matches validator: empty {} is valid (£70 unallocated is a real answer)
        if (fullQuestion?.renderer === 'allocation' && question.required) {
          const allocation = state.answers[question.id];
          // Gate passes if allocation is a present object (including empty {})
          return allocation !== undefined && allocation !== null && typeof allocation === 'object';
        }

        // Special handling for card-c: require selection when visible
        // Card-c has required: false in manifest but validator requires per_direction_card_c.<dir> to be a string
        // The "Skip" option (value: 'skipped') is the explicit no-specificity choice
        // Enforce selection when card-c is visible (gated on card-b != 'a')
        if (q.id.endsWith('-c') && question.conditionalOn) {
          const condition = question.conditionalOn as ConditionalCondition;
          if (condition.operator === 'not_equals') {
            const conditionAnswer = state.answers[condition.questionId];
            // Card-c is visible when conditionAnswer != condition.value
            const isVisible = conditionAnswer !== undefined && conditionAnswer !== null && conditionAnswer !== condition.value;
            if (isVisible) {
              // Require card-c to have a selection when visible
              const answered = state.answers[q.id] !== undefined && state.answers[q.id] !== null;
              return answered;
            }
            // Card-c not visible - doesn't block completion
            return true;
          }
        }

        // Standard answeredness check for all other questions
        const answered = state.answers[q.id] !== undefined && state.answers[q.id] !== null;
        return question.required ? answered : true;
      });
    },

    isComplete: (state): boolean => {
      return state.status === 'complete';
    },

    progressFraction: (state): number => {
      if (!state.manifest) return 0;
      const totalPages = state.manifest.pages.length;
      if (totalPages === 0) return 0;
      const currentIndex = state.manifest.pages.findIndex(
        (p) => p.id === state.lastPageId,
      );
      if (currentIndex === -1) return 0;
      // Progress = pages completed, not current page position
      // Page 1 (index 0) = 0 completed = empty bar
      // Page 2 (index 1) = 1 completed = first green
      return currentIndex / totalPages;
    },

    toAnswersObject: (state): Partial<QuestionnaireAnswers> => {
      const a = state.answers;

      // Derive relational domain current_state from new questions
      const friendshipLetter = a['q_friendship_count'] as 'a' | 'b' | 'c';
      const depthKnownLetter = a['q_depth_known'] as 'a' | 'b' | 'c';
      const relationalValues = interpretRelationalDomains(friendshipLetter, depthKnownLetter);

      const result: Partial<QuestionnaireAnswers> = {
        // Domain current_state - from domain slider questions (3 pages of 3, grouped by kind)
        domain_current_state: {
          time_as_yours: (a['domain_current_state_resources'] as Record<DomainKey, number>)?.time_as_yours,
          energy_as_resource: (a['domain_current_state_resources'] as Record<DomainKey, number>)?.energy_as_resource,
          body_physical_aliveness: (a['domain_current_state_resources'] as Record<DomainKey, number>)?.body_physical_aliveness,
          felt_aliveness: (a['domain_current_state_felt'] as Record<DomainKey, number>)?.felt_aliveness,
          curiosity: (a['domain_current_state_felt'] as Record<DomainKey, number>)?.curiosity,
          mattering: (a['domain_current_state_felt'] as Record<DomainKey, number>)?.mattering,
          conversation_depth: relationalValues.conversation_depth,
          being_known: relationalValues.being_known,
          friendship: relationalValues.friendship,
          intimacy: (a['domain_current_state_presence'] as Record<DomainKey, number>)?.intimacy,
          making: (a['domain_current_state_presence'] as Record<DomainKey, number>)?.making,
          spiritual: (a['domain_current_state_presence'] as Record<DomainKey, number>)?.spiritual,
        },
        // Q24 past_presence_selection
        past_presence_selection: (a['q24'] ?? []) as DomainKey[],
        // Q1 week_shape_ticked (merged from q1a and q1b)
        q1_week_shape_ticked: [...((a['q1a'] ?? []) as string[]), ...((a['q1b'] ?? []) as string[])] as Array<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i'>,
        // Q2 primary_load
        q2_primary_load: a['q2'] as 'a' | 'b' | 'c' | 'd',
        // Q3 paid_work_relationship
        q3_paid_work_relationship: a['q3'] as 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g',
        // Q4 life_shape_duration
        q4_life_shape_duration: a['q4'] as 'a' | 'b' | 'c',
        // Q5 recent_life_shape_change
        q5_recent_life_shape_change: a['q5'] as 'a' | 'b' | 'c',
        // Q6 capacity_strain
        q6_capacity_strain: a['q6'] as 'a' | 'b' | 'c',
        // Q7 sociality_default
        q7_sociality_default: a['q7'] as 'a' | 'b' | 'c',
        // Q8 past_presence_ticked
        q8_past_presence_ticked: (a['q8'] ?? []) as DirectionKey[],
        // Q9 stopped_expecting_ticked
        q9_stopped_expecting_ticked: (a['q9'] ?? []) as DirectionKey[],
        // Q10 direction_chosen
        q10_direction_chosen: a['q10'] as DirectionKey | 'rest' | 'none',
        // Q10b retrospective (triangulation variant)
        q10b_retrospective: a['q10b'] as DirectionKey | 'rest' | 'none',
        // Q10c counterfactual (triangulation variant)
        q10c_counterfactual: a['q10c'] as DirectionKey | 'rest' | 'none',
        // Q25 energy_availability
        q25_energy_availability: a['q25'] as 'a' | 'b' | 'c' | 'd' | 'e',
        // Q26 time_availability
        q26_time_availability: a['q26'] as number,
        // Q27 body_capacity
        q27_body_capacity: a['q27'] as 'a' | 'b' | 'c' | 'd',
        // Q29 recent_reaching
        q29_recent_reaching: a['q29'] as 'a' | 'b' | 'c' | 'd',
        // Q30 permission
        q30_permission: a['q30'] as 'a' | 'b' | 'c' | 'd',
        // Q31 role_consolidation
        q31_role_consolidation: a['q31'] as 'a' | 'b' | 'c',
        // Q32 attention_pattern
        q32_attention_pattern: a['q32'] as 'a' | 'b' | 'c',
        // Q33 relational_presence
        q33_relational_presence: a['q33'] as 'a' | 'b' | 'c',
        // Q11a/b/c psychological_filtering probes
        q11a_spare_resource: a['q11a_spare_resource'] as 'a' | 'b' | 'c',
        q11b_footprint: a['q11b_footprint'] as 'a' | 'b' | 'c',
        q11c_small_wants: a['q11c_small_wants'] as 'a' | 'b' | 'c',
        // Q_friendship_count — friendship count question
        q_friendship_count: a['q_friendship_count'] as 'a' | 'b' | 'c',
        // Q_depth_known — depth and being known question
        q_depth_known: a['q_depth_known'] as 'a' | 'b' | 'c',
        // Q34 self_report
        q34_self_report: (() => {
          const q34Value = a['q34'];
          if (!q34Value) return { kind: 'nothing_really' as const };
          if (Array.isArray(q34Value)) {
            if (q34Value.includes('nothing_really')) {
              return { kind: 'nothing_really' as const };
            }
            return { kind: 'named' as const, items: q34Value as Exclude<typeof q34Value[number], 'nothing_really'>[] };
          }
          return { kind: 'nothing_really' as const };
        })(),
        // Per-direction card answers
        per_direction_card_a: {
          contributor: a['card-contributor-a'] as 'a' | 'b' | 'c' | 'd',
          experience_seeker: a['card-experience-seeker-a'] as 'a' | 'b' | 'c' | 'd',
          freedom_designer: a['card-freedom-designer-a'] as 'a' | 'b' | 'c' | 'd',
          growth_focused: a['card-growth-focused-a'] as 'a' | 'b' | 'c' | 'd',
          creator: a['card-creator-a'] as 'a' | 'b' | 'c' | 'd',
          relationship_rebuilder: a['card-relationship-rebuilder-a'] as 'a' | 'b' | 'c' | 'd',
        },
        per_direction_card_b: {
          contributor: a['card-contributor-b'] as 'a' | 'b' | 'c',
          experience_seeker: a['card-experience-seeker-b'] as 'a' | 'b' | 'c',
          freedom_designer: a['card-freedom-designer-b'] as 'a' | 'b' | 'c',
          growth_focused: a['card-growth-focused-b'] as 'a' | 'b' | 'c',
          creator: a['card-creator-b'] as 'a' | 'b' | 'c',
          relationship_rebuilder: a['card-relationship-rebuilder-b'] as 'a' | 'b' | 'c',
        },
        per_direction_card_c: {
          contributor: a['card-contributor-c'] as 'a' | 'b' | 'c' | 'skipped',
          experience_seeker: a['card-experience-seeker-c'] as 'a' | 'b' | 'c' | 'skipped',
          freedom_designer: a['card-freedom-designer-c'] as 'a' | 'b' | 'c' | 'skipped',
          growth_focused: a['card-growth-focused-c'] as 'a' | 'b' | 'c' | 'skipped',
          creator: a['card-creator-c'] as 'a' | 'b' | 'c' | 'skipped',
          relationship_rebuilder: a['card-relationship-rebuilder-c'] as 'a' | 'b' | 'c' | 'skipped',
        },
      };

      // Add peace_discriminator and q70_allocation conditionally (only if answered)
      if (a['peace_discriminator'] !== undefined) {
        result.peace_discriminator = a['peace_discriminator'] as any;
      }
      if (a['q70_allocation'] !== undefined) {
        result.q70_allocation = a['q70_allocation'] as any;
      }

      return result;
    },
  },

  actions: {
    init(
      manifest: Manifest,
      persistence: SessionPersistence,
      userId: string,
    ): void {
      this.manifest = manifest;
      this.persistence = persistence;
      this.userId = userId;
      this.sessionId = `${userId}-${Date.now()}`;
      // Initialise to first page on fresh start; hydrate() will override if saved session exists
      const firstPage = manifest.pages[0];
      if (firstPage) {
        this.lastPageId = firstPage.id;
      }
    },

    async hydrate(): Promise<void> {
      if (!this.userId || !this.persistence) return;
      const loaded = await this.persistence.load(this.userId);
      if (loaded) {
        this.answers = loaded.answers;
        this.lastPageId = loaded.lastPageId;
        this.status = loaded.status;
      } else if (this.manifest && this.manifest.pages.length > 0) {
        // Fresh start: initialise to first page so first Next advances to page 2
        const firstPage = this.manifest.pages[0];
        if (firstPage) {
          this.lastPageId = firstPage.id;
        }
      }
    },

    setAnswer(id: string, value: AnswerValue): void {
      this.answers[id] = value;
    },

    advanceTo(pageId: string): void {
      this.lastPageId = pageId;
      this.checkpoint();
    },

    async checkpoint(): Promise<void> {
      if (!this.userId || !this.persistence) return;
      const session: PersistedSession = {
        userId: this.userId,
        answers: this.answers,
        lastPageId: this.lastPageId,
        status: this.status,
      };
      await this.persistence.save(session);
    },

    async markComplete(): Promise<void> {
      // Reshape answers to QuestionnaireAnswers
      const reshaped = this.toAnswersObject;

      // Validate the reshaped answers
      const validation = validateQuestionnaireAnswers(reshaped);
      if (!validation.ok) {
        // Validation failed - surface errors and do NOT proceed to results
        console.error('[markComplete] Validation failed:', validation.errors);
        throw new Error(
          `Questionnaire validation failed: ${validation.errors
            .map((e: any) => `${e.code} at "${e.path}": ${e.message}`)
            .join(', ')}`,
        );
      }

      // Validation passed - run the pipeline
      try {
        const pipelineResult = await runPipelineFromAnswers(validation.value, {
          sourceId: this.userId || 'questionnaire',
        });

        // Populate activeReading store with pipeline results
        const activeReadingStore = useActiveReadingStore();
        activeReadingStore.source = 'answers';
        activeReadingStore.sourceId = this.userId || 'questionnaire';
        activeReadingStore.assessmentId = null;
        activeReadingStore.inputMap = pipelineResult.inputMap;
        activeReadingStore.engineOutput = pipelineResult.engineOutput;
        activeReadingStore.renderingInstructions = pipelineResult.renderingInstructions;
        activeReadingStore.reach_confidence = pipelineResult.reach_confidence;
        activeReadingStore.consistency_flags = pipelineResult.consistency_flags;
        activeReadingStore.loadedAt = new Date();

        // Mark questionnaire as complete
        this.status = 'complete';
        await this.checkpoint();
      } catch (err) {
        console.error('[markComplete] Pipeline failed:', err);
        throw new Error(
          `Pipeline execution failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },

    async reset(): Promise<void> {
      // Clear in-memory state
      this.answers = {};
      this.lastPageId = null;
      this.status = 'in_progress';
      this.mode = 'live';
      this.fixtureId = null;

      // Clear persisted state to prevent old answers returning on reload
      if (this.userId && this.persistence) {
        const key = `wael:questionnaire:session:${this.userId}`;
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Storage unavailable; non-fatal.
        }
      }

      // Regenerate sessionId for fresh session
      if (this.userId) {
        this.sessionId = `${this.userId}-${Date.now()}`;
      }

      // Re-anchor to first page (matches init() behaviour)
      if (this.manifest && this.manifest.pages.length > 0) {
        const firstPage = this.manifest.pages[0];
        if (firstPage) {
          this.lastPageId = firstPage.id;
        }
      }
    },

    async loadFixture(fixtureId: string, answers: Record<string, AnswerValue>): Promise<void> {
      // Load fixture answers into store
      this.answers = answers;
      this.mode = 'fixture';
      this.fixtureId = fixtureId;
      this.status = 'in_progress';
      this.lastPageId = null;
    },
  },
});

function findQuestionById(
  manifest: Manifest | null,
  id: string,
): { id: string; required: boolean; conditionalOn?: string | ConditionalCondition } | null {
  if (!manifest) return null;
  for (const page of manifest.pages) {
    const question = page.questions.find((q) => q.id === id);
    if (question) return question;
  }
  return null;
}
