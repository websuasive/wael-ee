// Unit tests for closing line construction (SYNTHESIS.md sections 5.8 and 7.3).

import { describe, it, expect } from 'vitest';
import type { DirectionName } from '@/engine';
import { computeClosingLines } from '@/synthesis/closing_lines';
import type { ShapeSentenceMatch } from '@/synthesis/predicates';
import {
  makeEngineOutput,
  makeInputMap,
} from './synthesis-test-helpers';

function patternMatch(
  id: string,
  matched_direction: DirectionName | null = null,
): ShapeSentenceMatch {
  return { id, sentence: '<test>', matched_direction };
}

/* ------------------------------------------------------------------ */
/* A — no firing closing lines                                        */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — empty', () => {
  it('baseline output, null pattern → []', () => {
    expect(computeClosingLines(makeEngineOutput(), makeInputMap(), null)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* B — closing_between_shapes                                         */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — closing_between_shapes', () => {
  it('between_shapes firing, null match → emits with id closing_between_shapes', () => {
    const out = makeEngineOutput({ cross_cutting: { between_shapes: true } });
    const lines = computeClosingLines(out, makeInputMap(), null);
    expect(lines.map((l) => l.id)).toEqual(['closing_between_shapes']);
  });

  it('interpretive_text matches section 7.3 sentence', () => {
    const out = makeEngineOutput({ cross_cutting: { between_shapes: true } });
    expect(computeClosingLines(out, makeInputMap(), null)[0]!.text.interpretive_text).toBe(
      "Between shapes; the new shape isn't fully there yet.",
    );
  });

  it('token_text matches section 5.8 token', () => {
    const out = makeEngineOutput({ cross_cutting: { between_shapes: true } });
    expect(computeClosingLines(out, makeInputMap(), null)[0]!.text.token_text).toBe(
      'Recent life shape change; no replacement structure.',
    );
  });

  it('suppressed by between_shapes_clean match', () => {
    const out = makeEngineOutput({ cross_cutting: { between_shapes: true } });
    expect(
      computeClosingLines(out, makeInputMap(), patternMatch('between_shapes_clean')),
    ).toEqual([]);
  });

  it('not suppressed by an unrelated match', () => {
    const out = makeEngineOutput({ cross_cutting: { between_shapes: true } });
    expect(
      computeClosingLines(out, makeInputMap(), patternMatch('saturated')).map(
        (l) => l.id,
      ),
    ).toEqual(['closing_between_shapes']);
  });

  it('between_shapes not firing → no line', () => {
    expect(computeClosingLines(makeEngineOutput(), makeInputMap(), null)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* C — closing_mid_process                                            */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — closing_mid_process', () => {
  it('mid_process firing, null match → emits', () => {
    const out = makeEngineOutput({ cross_cutting: { mid_process: true } });
    expect(
      computeClosingLines(out, makeInputMap(), null).map((l) => l.id),
    ).toEqual(['closing_mid_process']);
  });

  it('text content correct', () => {
    const out = makeEngineOutput({ cross_cutting: { mid_process: true } });
    const line = computeClosingLines(out, makeInputMap(), null)[0]!;
    expect(line.text.interpretive_text).toBe(
      'The reaching is recent and still finding its form.',
    );
    expect(line.text.token_text).toBe(
      'Active quadrant with recent and awkward reaching.',
    );
  });

  it('suppressed by active_going_through_motions match', () => {
    const out = makeEngineOutput({ cross_cutting: { mid_process: true } });
    expect(
      computeClosingLines(
        out,
        makeInputMap(),
        patternMatch('active_going_through_motions'),
      ),
    ).toEqual([]);
  });

  it('not suppressed by between_shapes_clean (different sentence)', () => {
    const out = makeEngineOutput({ cross_cutting: { mid_process: true } });
    expect(
      computeClosingLines(
        out,
        makeInputMap(),
        patternMatch('between_shapes_clean'),
      ).map((l) => l.id),
    ).toEqual(['closing_mid_process']);
  });
});

/* ------------------------------------------------------------------ */
/* D — closing_capacity_strain                                        */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — closing_capacity_strain', () => {
  it('one direction with capacity_strain → one line', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_state: ['capacity_strain'] }],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null).map((l) => l.id),
    ).toEqual(['closing_capacity_strain']);
  });

  it('two directions → pull-desc order', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_state: ['capacity_strain'] },
        { direction: 'freedom_designer', pull: 60, pull_state: ['capacity_strain'] },
      ],
    });
    const lines = computeClosingLines(out, makeInputMap(), null);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.text.token_text).toBe('Capacity strain firing on Creator.');
    expect(lines[1]!.text.token_text).toBe(
      'Capacity strain firing on Freedom Designer.',
    );
  });

  it('token uses display name', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_state: ['capacity_strain'] }],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null)[0]!.text.token_text,
    ).toBe('Capacity strain firing on Creator.');
  });

  it('interpretive uses {direction_lower}', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_state: ['capacity_strain'] }],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null)[0]!.text.interpretive_text,
    ).toBe('Pulling toward more in making, and toward less weight overall.');
  });

  it('active_with_tension on making suppresses making only', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_state: ['capacity_strain'] },
        { direction: 'freedom_designer', pull: 60, pull_state: ['capacity_strain'] },
      ],
    });
    const lines = computeClosingLines(
      out,
      makeInputMap(),
      patternMatch('active_with_tension', 'creator'),
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]!.text.token_text).toBe(
      'Capacity strain firing on Freedom Designer.',
    );
  });

  it('active_with_tension on freedom suppresses freedom only', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_state: ['capacity_strain'] },
        { direction: 'freedom_designer', pull: 60, pull_state: ['capacity_strain'] },
      ],
    });
    const lines = computeClosingLines(
      out,
      makeInputMap(),
      patternMatch('active_with_tension', 'freedom_designer'),
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]!.text.token_text).toBe('Capacity strain firing on Creator.');
  });

  it('non-targeted match (saturated) does not suppress', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_state: ['capacity_strain'] }],
    });
    expect(
      computeClosingLines(out, makeInputMap(), patternMatch('saturated', null)),
    ).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* E — closing_stopped_expecting                                      */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — closing_stopped_expecting', () => {
  it('one direction → one line', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_state: ['stopped_expecting'] },
      ],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null).map((l) => l.id),
    ).toEqual(['closing_stopped_expecting']);
  });

  it('multiple → pull-desc ordered', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_state: ['stopped_expecting'] },
        { direction: 'freedom_designer', pull: 60, pull_state: ['stopped_expecting'] },
      ],
    });
    const lines = computeClosingLines(out, makeInputMap(), null);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.text.token_text).toBe(
      'Stopped expecting firing on making and freedom.',
    );
  });

  it('no deduplication: active_with_tension on making does not suppress stopped_expecting', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_state: ['stopped_expecting'] },
      ],
    });
    expect(
      computeClosingLines(
        out,
        makeInputMap(),
        patternMatch('active_with_tension', 'creator'),
      ),
    ).toHaveLength(1);
  });

  it('token uses display name', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_state: ['stopped_expecting'] },
      ],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null)[0]!.text.token_text,
    ).toBe('Stopped expecting firing on Creator.');
  });

  it('interpretive uses {direction_lower}', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_state: ['stopped_expecting'] },
      ],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null)[0]!.text.interpretive_text,
    ).toBe('Quietly stopped expecting much in making.');
  });
});
/* ------------------------------------------------------------------ */
/* G — closing_phantom                                                */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — closing_phantom', () => {
  it('phantom (firing-set member via pull_quality) → one line', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 0, pull_quality: ['phantom'] }],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null).map((l) => l.id),
    ).toEqual(['closing_phantom']);
  });

  it('phantom_partial → one line', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 0, pull_quality: ['phantom_partial'] },
      ],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null).map((l) => l.id),
    ).toEqual(['closing_phantom']);
  });

  it('two phantom directions → pull-desc ordered', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['phantom'] },
        { direction: 'freedom_designer', pull: 50, pull_quality: ['phantom'] },
      ],
    });
    const lines = computeClosingLines(out, makeInputMap(), null);
    expect(lines).toHaveLength(2);
    expect(lines[0]!.text.token_text).toBe('Creator named as a desired direction.');
    expect(lines[1]!.text.token_text).toBe(
      'Freedom Designer named as a desired direction.',
    );
  });

  it('desired_direction_partial on making suppresses making only', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['phantom_partial'] },
        { direction: 'freedom_designer', pull: 60, pull_quality: ['phantom'] },
      ],
    });
    const lines = computeClosingLines(
      out,
      makeInputMap(),
      patternMatch('desired_direction_partial', 'creator'),
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]!.text.token_text).toBe(
      'Freedom Designer named as a desired direction.',
    );
  });

  it('desired_direction_full on making suppresses making only', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['phantom'] },
        { direction: 'freedom_designer', pull: 60, pull_quality: ['phantom'] },
      ],
    });
    const lines = computeClosingLines(
      out,
      makeInputMap(),
      patternMatch('desired_direction_full', 'creator'),
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]!.text.token_text).toBe(
      'Freedom Designer named as a desired direction.',
    );
  });

  it('phantom direction with low pull still enters firing set via non-empty pull_quality', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 5, pull_quality: ['phantom'] }],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null).map((l) => l.id),
    ).toEqual(['closing_phantom']);
  });

  it('token uses display name', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['phantom'] }],
    });
    expect(
      computeClosingLines(out, makeInputMap(), null)[0]!.text.token_text,
    ).toBe('Creator named as a desired direction.');
  });
});

/* ------------------------------------------------------------------ */
/* H — output ordering across types                                   */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — output ordering', () => {
  it('multiple types fire simultaneously → fixed section 5.8 order', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['phantom'],
          pull_state: ['capacity_strain'],
        },
      ],
      cross_cutting: { between_shapes: true, mid_process: true },
    });
    const ids = computeClosingLines(out, makeInputMap(), null).map((l) => l.id);
    expect(ids).toEqual([
      'closing_between_shapes',
      'closing_mid_process',
      'closing_capacity_strain',
      'closing_phantom',
    ]);
  });

});

/* ------------------------------------------------------------------ */
/* I — null pattern match                                             */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — null pattern match', () => {
  it('no suppression applies', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['phantom'],
          pull_state: ['capacity_strain'],
        },
      ],
      cross_cutting: { between_shapes: true, mid_process: true },
    });
    const ids = computeClosingLines(out, makeInputMap(), null).map((l) => l.id);
    expect(ids).toEqual([
      'closing_between_shapes',
      'closing_mid_process',
      'closing_capacity_strain',
      'closing_phantom',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* I.b — direction_engine_name parallel field                          */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — direction_engine_name', () => {
  it('cross-cutting lines have direction_engine_name === null', () => {
    const out = makeEngineOutput({
      cross_cutting: {
        between_shapes: true,
        mid_process: true,
      },
    });
    const lines = computeClosingLines(out, makeInputMap(), null);
    const byId = new Map(lines.map((l) => [l.id, l]));
    expect(byId.get('closing_between_shapes')?.direction_engine_name).toBeNull();
    expect(byId.get('closing_mid_process')?.direction_engine_name).toBeNull();
  });

  it('per-direction lines carry the matching direction engine name', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['phantom'],
          pull_state: ['capacity_strain', 'stopped_expecting'],
        },
      ],
    });
    const lines = computeClosingLines(out, makeInputMap(), null);
    const capacity = lines.find((l) => l.id === 'closing_capacity_strain');
    const stopped = lines.find((l) => l.id === 'closing_stopped_expecting');
    const phantom = lines.find((l) => l.id === 'closing_phantom');
    expect(capacity?.direction_engine_name).toBe('creator');
    expect(stopped?.direction_engine_name).toBeNull();
    expect(phantom?.direction_engine_name).toBe('creator');
  });

  it('two per-direction lines on different directions → distinct engine names', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_state: ['capacity_strain'] },
        { direction: 'freedom_designer', pull: 60, pull_state: ['capacity_strain'] },
      ],
    });
    const lines = computeClosingLines(out, makeInputMap(), null);
    expect(lines.map((l) => l.direction_engine_name)).toEqual([
      'creator',
      'freedom_designer',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* J — purity                                                         */
/* ------------------------------------------------------------------ */

describe('computeClosingLines — purity', () => {
  it('two calls with identical inputs return deep-equal results', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['phantom'] }],
      cross_cutting: { between_shapes: true },
    });
    const inp = makeInputMap();
    const m = patternMatch('saturated');
    const a = computeClosingLines(out, inp, m);
    const b = computeClosingLines(out, inp, m);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('does not mutate output, input, or patternParagraphMatch', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['phantom'],
          pull_state: ['capacity_strain'],
        },
      ],
      cross_cutting: { between_shapes: true },
    });
    const inp = makeInputMap();
    const m = patternMatch('active_with_tension', 'creator');
    const outBefore = JSON.stringify(out);
    const inpBefore = JSON.stringify(inp);
    const mBefore = JSON.stringify(m);
    computeClosingLines(out, inp, m);
    expect(JSON.stringify(out)).toBe(outBefore);
    expect(JSON.stringify(inp)).toBe(inpBefore);
    expect(JSON.stringify(m)).toBe(mBefore);
  });
});
