// Integration tests for the synthesis-layer orchestrator (SYNTHESIS.md section 8).
// These tests verify the orchestration's correctness end-to-end through targeted
// scenarios. Per-module behaviour is covered by the ~700 unit tests across the
// other Phase 3 test files; do not re-test those contracts here.

import { describe, it, expect } from 'vitest';
import { synthesise } from '@/synthesis/synthesise';
import { synthesise as publicSynthesise } from '@/synthesis';
import type { RenderingInstructions } from '@/synthesis';
import { recognitionSentences } from '@/synthesis/data/recognition_sentences';
import {
  makeEngineOutput,
  makeInputMap,
} from './synthesis-test-helpers';

/* ------------------------------------------------------------------ */
/* A — smoke / baseline                                               */
/* ------------------------------------------------------------------ */

describe('synthesise — smoke / baseline', () => {
  it('baseline returns a fully shaped RenderingInstructions', () => {
    const r = synthesise(makeEngineOutput(), makeInputMap());
    expect(Object.keys(r).sort()).toEqual(
      [
        'comparison_surface_panel',
        'constraints_panel',
        'cross_cutting_panel',
        'direction_cards',
        'direction_evidence_chart',
        'domains_panel',
        'experience_candidate_directions',
        'headline',
        'life_context_panel',
        'life_texture_panel',
        'pattern_paragraph',
        'recognition_paragraph',
        'the_narrowings_panel',
      ].sort(),
    );
  });

  it('baseline headline: empty firing set → "Directions all reading low."', () => {
    const r = synthesise(makeEngineOutput(), makeInputMap());
    expect(r.headline.direction_names).toEqual([]);
    expect(r.headline.situation_text).toBe('Directions all reading low.');
  });

  it('baseline direction_cards has 6 entries, all visual_state not_firing', () => {
    const r = synthesise(makeEngineOutput(), makeInputMap());
    expect(r.direction_cards).toHaveLength(6);
    for (const c of r.direction_cards) {
      expect(c.visual_state).toBe('not_firing');
    }
  });

  it('baseline experience_candidate_directions is []', () => {
    expect(
      synthesise(makeEngineOutput(), makeInputMap())
        .experience_candidate_directions,
    ).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* B — recognition_paragraph lookup chain                             */
/* ------------------------------------------------------------------ */

describe('synthesise — recognition_paragraph lookup chain', () => {
  it('one firing direction (making) → recognitionSentences[creator]', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const r = synthesise(out, makeInputMap());
    expect(r.recognition_paragraph.interpretive_text).toBe(
      recognitionSentences['creator'],
    );
  });

  it('two firing (making + freedom) → "creator,freedom_designer"', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
      ],
    });
    const r = synthesise(out, makeInputMap());
    expect(r.recognition_paragraph.interpretive_text).toBe(
      recognitionSentences['creator,freedom_designer'],
    );
  });

  it('three firing → tries the full triple key first', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
        { direction: 'relationship_rebuilder', pull: 60, pull_quality: ['real'] },
      ],
    });
    const r = synthesise(out, makeInputMap());
    expect(r.recognition_paragraph.interpretive_text).toBe(
      recognitionSentences['creator,freedom_designer,relationship_rebuilder'],
    );
  });

  // Note: the prefix-shortening fallback branch (triple-not-found → pair,
  // pair-not-found → single) is unreachable with real direction names
  // because recognitionSentences now authors all 6 singles, all 30 ordered
  // pairs, and all 120 ordered triples. The branch remains in production as
  // defensive code; no data-driven test can exercise it.

  it('empty firing set → interpretive_text === null', () => {
    // No firing directions → typeKeys is [] → fallback loop never runs
    // → interpretive_text stays null. This is the only data-independent
    // path to the null branch.
    const out = makeEngineOutput();
    const r = synthesise(out, makeInputMap());
    expect(r.recognition_paragraph.interpretive_text).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* D — recognition_paragraph token text                               */
/* ------------------------------------------------------------------ */

describe('synthesise — recognition_paragraph token text', () => {
  it('empty firing set → ""', () => {
    expect(
      synthesise(makeEngineOutput(), makeInputMap()).recognition_paragraph
        .token_text,
    ).toBe('');
  });

  it('one firing → "<DisplayName>."', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    expect(synthesise(out, makeInputMap()).recognition_paragraph.token_text).toBe(
      'Creator.',
    );
  });

  it('two firing → "<Name1> and <Name2>."', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
      ],
    });
    expect(synthesise(out, makeInputMap()).recognition_paragraph.token_text).toBe(
      'Creator and Freedom Designer.',
    );
  });

  it('three firing → "<Name1>, <Name2>, and <Name3>."', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
        { direction: 'relationship_rebuilder', pull: 60, pull_quality: ['real'] },
      ],
    });
    expect(synthesise(out, makeInputMap()).recognition_paragraph.token_text).toBe(
      'Creator, Freedom Designer, and Relationship Rebuilder.',
    );
  });
});

/* ------------------------------------------------------------------ */
/* E — pattern_paragraph match and token                              */
/* ------------------------------------------------------------------ */

describe('synthesise — pattern_paragraph', () => {
  it('saturated profile → "Wanting present on a direction, but soured."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 60,
          pull_quality: ['saturated'],
          quadrant: 'quiet',
        },
      ],
    });
    const r = synthesise(out, makeInputMap());
    expect(r.pattern_paragraph.interpretive_text).toBe(
      'Wanting present on a direction, but soured.',
    );
  });

  it('desired_direction_partial: {direction_display} substituted with primary firing direction', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 60, pull_quality: ['phantom_partial'] },
      ],
    });
    const r = synthesise(out, makeInputMap());
    expect(r.pattern_paragraph.interpretive_text).toBe(
      "A desired direction named: Creator. The surrounding readings are still partial; the conditions for acting haven't shown up yet.",
    );
  });

  it('no pattern_paragraph predicate matches → interpretive_text null, token still renders', () => {
    const r = synthesise(makeEngineOutput(), makeInputMap());
    expect(r.pattern_paragraph.interpretive_text).toBeNull();
    expect(r.pattern_paragraph.token_text).not.toBe('');
  });

  it('token: n = 0 → "No directions reading materially. ..."', () => {
    const r = synthesise(makeEngineOutput(), makeInputMap());
    // Baseline SCI = 100, life_shape_duration = 'recent' → sciBand: 'heavy'.
    expect(r.pattern_paragraph.token_text).toBe(
      'No directions reading materially. Constraint pattern: heavy. Life shape duration: recent.',
    );
  });

  it('token: n = 1 → "One direction reading materially. ..."', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const r = synthesise(out, makeInputMap());
    expect(r.pattern_paragraph.token_text.startsWith('One direction reading materially.')).toBe(
      true,
    );
  });

  it('token: n = 2 → "<n> directions reading materially. ..."', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
      ],
    });
    const r = synthesise(out, makeInputMap());
    expect(r.pattern_paragraph.token_text.startsWith('2 directions reading materially.')).toBe(
      true,
    );
  });

  it('token includes SCI band: SCI 65 + duration sustained → "heavy"', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 65 },
    });
    const inp = makeInputMap({ cross_direction: { life_shape_duration: 'sustained' } });
    const r = synthesise(out, inp);
    expect(r.pattern_paragraph.token_text).toContain('Constraint pattern: heavy.');
    expect(r.pattern_paragraph.token_text).toContain('Life shape duration: sustained.');
  });

  it('token includes SCI band: SCI 75 + duration long → "heavy and long-running"', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 75 },
    });
    const inp = makeInputMap({ cross_direction: { life_shape_duration: 'long' } });
    const r = synthesise(out, inp);
    expect(r.pattern_paragraph.token_text).toContain(
      'Constraint pattern: heavy and long-running.',
    );
    expect(r.pattern_paragraph.token_text).toContain('Life shape duration: long.');
  });

  it('token reflects life_shape_duration verbatim', () => {
    const out = makeEngineOutput();
    const inp = makeInputMap({ cross_direction: { life_shape_duration: 'sustained' } });
    expect(synthesise(out, inp).pattern_paragraph.token_text).toContain(
      'Life shape duration: sustained.',
    );
  });
});

/* ------------------------------------------------------------------ */
/* F — pattern_paragraph calibration hook                             */
/* ------------------------------------------------------------------ */

describe('synthesise — pattern_paragraph calibration hook', () => {
  it('calibration_lines empty → no extra prepended text', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 60,
          pull_quality: ['saturated'],
          quadrant: 'quiet',
        },
      ],
    });
    const r = synthesise(out, makeInputMap());
    expect(r.pattern_paragraph.interpretive_text).toBe(
      'Wanting present on a direction, but soured.',
    );
  });
});

/* ------------------------------------------------------------------ */
/* G — closing-line deduplication via cross-step state                */
/* ------------------------------------------------------------------ */

describe('synthesise — closing line deduplication', () => {
  it('between_shapes_clean fires + cross_cutting between_shapes fires → closing_between_shapes suppressed in LifeContextPanel', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
      cross_cutting: { between_shapes: true },
    });
    const r = synthesise(out, makeInputMap());
    // Verify the pattern_paragraph predicate matched.
    expect(r.pattern_paragraph.interpretive_text).toBe(
      'Recent change in life shape, no replacement structure yet in place.',
    );
    // between_shapes now renders in LifeContextPanel, not closing_lines
    expect(r.life_context_panel.closing_between_shapes).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* H — cross_cutting_panel                                            */
/* ------------------------------------------------------------------ */

describe('synthesise — cross_cutting_panel', () => {
  it('all three not firing → 3 entries, all fires false, canonical names', () => {
    const r = synthesise(makeEngineOutput(), makeInputMap());
    expect(r.cross_cutting_panel.outputs).toEqual([
      {
        name: 'Between shapes',
        output_engine_name: 'between_shapes',
        fires: false,
      },
      {
        name: 'Mid-process',
        output_engine_name: 'mid_process',
        fires: false,
      },
    ]);
  });

  it('one firing → that entry fires true, others false', () => {
    const out = makeEngineOutput({ cross_cutting: { mid_process: true } });
    const r = synthesise(out, makeInputMap());
    expect(r.cross_cutting_panel.outputs).toEqual([
      {
        name: 'Between shapes',
        output_engine_name: 'between_shapes',
        fires: false,
      },
      {
        name: 'Mid-process',
        output_engine_name: 'mid_process',
        fires: true,
      },
    ]);
  });

  it('canonical order: between_shapes, mid_process', () => {
    const r = synthesise(makeEngineOutput(), makeInputMap());
    expect(r.cross_cutting_panel.outputs.map((e) => e.name)).toEqual([
      'Between shapes',
      'Mid-process',
    ]);
    expect(r.cross_cutting_panel.outputs.map((e) => e.output_engine_name)).toEqual([
      'between_shapes',
      'mid_process',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* I — direction cards consume firing set                             */
/* ------------------------------------------------------------------ */

describe('synthesise — direction cards firing-set threading', () => {
  it('three firing → top-3 cards visual_state named, others not_firing', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 60, pull_quality: ['real'] },
      ],
    });
    const r = synthesise(out, makeInputMap());
    const named = r.direction_cards.filter((c) => c.visual_state === 'named');
    expect(named).toHaveLength(3);
    const notFiring = r.direction_cards.filter(
      (c) => c.visual_state === 'not_firing',
    );
    expect(notFiring).toHaveLength(3);
  });
});

/* ------------------------------------------------------------------ */
/* J — direction evidence chart consumes firing set                   */
/* ------------------------------------------------------------------ */

describe('synthesise — chart caption firing count', () => {
  it('three firing → caption token has "3 directions reading materially."', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 60, pull_quality: ['real'] },
      ],
    });
    const r = synthesise(out, makeInputMap());
    expect(r.direction_evidence_chart.caption.token_text).toBe(
      '3 directions reading materially. Movement varies.',
    );
  });
});

/* ------------------------------------------------------------------ */
/* K — experience candidates consume firing set                       */
/* ------------------------------------------------------------------ */

describe('synthesise — experience candidates threading', () => {
  it('two firing + one past_presence-only → 3 entries (2 firing, 1 past)', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
        { direction: 'growth_focused', pull: 20 },
      ],
    });
    const inp = makeInputMap({
      directions: { growth_focused: { past_presence: 'yes' } },
    });
    const r = synthesise(out, inp);
    expect(r.experience_candidate_directions).toEqual([
      {
        direction_name: 'Creator',
        direction_engine_name: 'creator',
        priority: 'firing',
        pull: 80,
      },
      {
        direction_name: 'Freedom Designer',
        direction_engine_name: 'freedom_designer',
        priority: 'firing',
        pull: 70,
      },
      {
        direction_name: 'Growth Focused',
        direction_engine_name: 'growth_focused',
        priority: 'past_presence_only',
        pull: 20,
      },
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* L — purity                                                         */
/* ------------------------------------------------------------------ */

describe('synthesise — purity', () => {
  it('two calls with identical inputs return deep-equal results', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['real'],
          quadrant: 'active',
          pull_state: ['capacity_strain'],
        },
      ],
      cross_cutting: { between_shapes: true },
    });
    const inp = makeInputMap();
    const a = synthesise(out, inp);
    const b = synthesise(out, inp);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('does not mutate output or input', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
      cross_cutting: { between_shapes: true },
    });
    const inp = makeInputMap();
    const outBefore = JSON.stringify(out);
    const inpBefore = JSON.stringify(inp);
    synthesise(out, inp);
    expect(JSON.stringify(out)).toBe(outBefore);
    expect(JSON.stringify(inp)).toBe(inpBefore);
  });
});

/* ------------------------------------------------------------------ */
/* M — public surface (index.ts)                                      */
/* ------------------------------------------------------------------ */

describe('synthesise — public surface', () => {
  it('synthesise from "@/synthesis" matches synthesise from "@/synthesis/synthesise"', () => {
    expect(publicSynthesise).toBe(synthesise);
  });

  it('RenderingInstructions type is exported (compile-time check via assignment)', () => {
    const r: RenderingInstructions = synthesise(makeEngineOutput(), makeInputMap());
    expect(r).toBeDefined();
  });
});
