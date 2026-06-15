// Dashboard app state machine. Module-level singleton via Vue refs. Transitions: loading → ready (synthesis success) | loading → error (synthesis throw) | ready → error (downstream render error captured by App.vue's errorCaptured hook). Error reference code auto-generated on transition. Placeholder RenderingInstructions provided for Phase 1c testing; Phase 3 wires the real synthesis pipeline.

import { ref, shallowRef, type Ref } from 'vue';
import type { RenderingInstructions } from '../../synthesis';
import type { DirectionName } from '../../engine';
import { DIRECTION_DISPLAY_NAMES } from '../../synthesis/data/tokens';

export type DashboardState = 'loading' | 'error' | 'ready';

export type DashboardAppState = {
  state: Readonly<Ref<DashboardState>>;
  renderingInstructions: Readonly<Ref<RenderingInstructions | null>>;
  errorReferenceCode: Readonly<Ref<string | null>>;
  transitionToReady: (rendering: RenderingInstructions) => void;
  transitionToError: (error: Error) => void;
};

const state = ref<DashboardState>('loading');
// shallowRef: RenderingInstructions is a deep object; deep reactivity is unnecessary
// (the dashboard treats it as immutable), and shallow tracking preserves identity.
const renderingInstructions = shallowRef<RenderingInstructions | null>(null);
const errorReferenceCode = ref<string | null>(null);

function generateReferenceCode(): string {
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj !== undefined && typeof cryptoObj.randomUUID === 'function') {
    const uuid = cryptoObj.randomUUID();
    // First 8 hex chars of the UUID, formatted xxxx-xxxx.
    const hex = uuid.replace(/-/g, '').slice(0, 8).toLowerCase();
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  }
  // Fallback for environments without crypto.randomUUID.
  const r = (): string =>
    Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, '0');
  return `${r()}-${r()}`;
}

export function useDashboardAppState(): DashboardAppState {
  const transitionToReady = (rendering: RenderingInstructions): void => {
    renderingInstructions.value = rendering;
    errorReferenceCode.value = null;
    state.value = 'ready';
  };

  const transitionToError = (error: Error): void => {
    // eslint-disable-next-line no-console
    console.error('[dashboard_app_state] transitionToError:', error);
    errorReferenceCode.value = generateReferenceCode();
    state.value = 'error';
  };

  return {
    state,
    renderingInstructions,
    errorReferenceCode,
    transitionToReady,
    transitionToError,
  };
}

/* ------------------------------------------------------------------ */
/* Placeholder RenderingInstructions (Phase 1c)                        */
/* ------------------------------------------------------------------ */

const ENGINE_DIRECTIONS: readonly DirectionName[] = [
  'contributor',
  'creator',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'relationship_rebuilder',
];

function emptySlot(): { interpretive_text: null; token_text: '' } {
  return { interpretive_text: null, token_text: '' };
}

export function buildPlaceholderRenderingInstructions(): RenderingInstructions {
  return {
    headline: {
      direction_names: [],
      direction_engine_names: [],
      situation_text: 'Placeholder situation.',
    },
    recognition_paragraph: emptySlot(),
    pattern_paragraph: [],
    direction_cards: ENGINE_DIRECTIONS.map((d) => ({
      direction_name: DIRECTION_DISPLAY_NAMES[d],
      direction_engine_name: d,
      summary: emptySlot(),
      meaning_sentence: emptySlot(),
      fields: [],
      expression_space_caption: emptySlot(),
      held_attributed_line: null,
      visual_state: 'not_firing' as const,
    })),
    direction_evidence_chart: {
      bubbles: ENGINE_DIRECTIONS.map((d) => ({
        direction_name: DIRECTION_DISPLAY_NAMES[d],
        direction_engine_name: d,
        pull: 0,
        movement: 0,
        specificity_size: 0.3,
        surfaced: false,
        pull_quality_state: 'empty',
        is_desired_direction: false,
        is_named_in_headline: false,
      })),
      caption: emptySlot(),
    },
    domains_panel: {
      summary: emptySlot(),
      reduced_groups: [],
      intact_callout: emptySlot(),
    },
    constraints_panel: {
      summary: emptySlot(),
      constraint_lines: [],
      sustained_constraint_intensity: 0,
      intact_callout: emptySlot(),
      permission_sub_shape_text: null,
    },
    cross_cutting_panel: {
      outputs: [
        { name: 'Between shapes', output_engine_name: 'between_shapes' as const, fires: false },
        { name: 'Mid-process', output_engine_name: 'mid_process' as const, fires: false },
      ],
    },
    experience_candidate_directions: [],
    life_texture_panel: {
      summary: emptySlot(),
      band_label: 'Empty',
      flags_present: [],
      flags_absent: [],
      load_state_label: 'Uncluttered',
    },
    life_context_panel: {
      life_stage_summary: emptySlot(),
      work_load_summary: emptySlot(),
      sociality_summary: emptySlot(),
    },
    comparison_surface_panel: null,
    the_narrowings_panel: {
      bands: [],
      summary: emptySlot(),
    },
  };
}

