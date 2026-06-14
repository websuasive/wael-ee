// Unit tests for direction evidence chart data (SYNTHESIS.md section 5.4).

import { describe, it, expect } from 'vitest';
import { computeChartData } from '@/synthesis/chart_data';
import { computeFiringSet } from '@/synthesis/headline';
import {
  makeEngineOutput,
  makeInputMap,
} from './synthesis-test-helpers';

function chartFor(
  out = makeEngineOutput(),
  inp = makeInputMap(),
) {
  return computeChartData(out, inp, computeFiringSet(out));
}

describe('computeChartData — bubble count and order', () => {
  it('always produces six bubbles', () => {
    expect(chartFor().bubbles).toHaveLength(6);
  });

  it('sorts by pull desc, alphabetical tiebreak', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 70 },
        { direction: 'growth_focused', pull: 70 },
        { direction: 'freedom_designer', pull: 80 },
      ],
    });
    const bubbles = chartFor(out).bubbles;
    expect(bubbles[0]!.direction_name).toBe('Freedom Designer');
    expect(bubbles[1]!.direction_name).toBe('Creator');
    expect(bubbles[2]!.direction_name).toBe('Growth Focused');
  });
});

describe('computeChartData — bubble fields', () => {
  it('direction_name uses display names', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80 }],
    });
    expect(chartFor(out).bubbles[0]!.direction_name).toBe('Creator');
  });

  it('pull and movement passthrough', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, movement: 55 }],
    });
    const b = chartFor(out).bubbles[0]!;
    expect(b.pull).toBe(80);
    expect(b.movement).toBe(55);
  });

  it('surfaced passthrough', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, surfaced: true }],
    });
    expect(chartFor(out).bubbles[0]!.surfaced).toBe(true);
  });

  it('specificity_size: none → 0.3, partial → 0.6, strong → 1.0', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 90, specificity: 'strong' },
        { direction: 'freedom_designer', pull: 80, specificity: 'partial' },
        { direction: 'experience_seeker', pull: 70, specificity: 'none' },
      ],
    });
    const bubbles = chartFor(out).bubbles;
    expect(bubbles[0]!.specificity_size).toBe(1.0);
    expect(bubbles[1]!.specificity_size).toBe(0.6);
    expect(bubbles[2]!.specificity_size).toBe(0.3);
  });

  it('pull_quality_state = first array element when non-empty', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['suppressed', 'saturated'],
        },
      ],
    });
    expect(chartFor(out).bubbles[0]!.pull_quality_state).toBe('suppressed');
  });

  it('pull_quality_state = "empty" when array is empty', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 0, pull_quality: [] }],
    });
    const b = chartFor(out).bubbles.find(
      (x) => x.direction_name === 'Creator',
    )!;
    expect(b.pull_quality_state).toBe('empty');
  });

  it('is_desired_direction = true when pull_quality contains phantom', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['phantom'] },
      ],
    });
    expect(chartFor(out).bubbles[0]!.is_desired_direction).toBe(true);
  });

  it('is_desired_direction = true when pull_quality contains phantom_partial', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['phantom_partial'] },
      ],
    });
    expect(chartFor(out).bubbles[0]!.is_desired_direction).toBe(true);
  });

  it('is_desired_direction = false otherwise', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    expect(chartFor(out).bubbles[0]!.is_desired_direction).toBe(false);
  });

  it('is_named_in_headline: true only for the headline\u2019s top-3 of the firing set', () => {
    // Five firing directions; top-3 by pull should be named, lower two not.
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 90, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 80, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 70, pull_quality: ['real'] },
        { direction: 'growth_focused', pull: 60, pull_quality: ['real'] },
        { direction: 'relationship_rebuilder', pull: 55, pull_quality: ['real'] },
      ],
    });
    const byEngine = Object.fromEntries(
      chartFor(out).bubbles.map((b) => [
        b.direction_engine_name,
        b.is_named_in_headline,
      ]),
    );
    expect(byEngine['creator']).toBe(true);
    expect(byEngine['freedom_designer']).toBe(true);
    expect(byEngine['experience_seeker']).toBe(true);
    expect(byEngine['growth_focused']).toBe(false);
    expect(byEngine['relationship_rebuilder']).toBe(false);
  });

  it('is_named_in_headline: false for all bubbles when the firing set is empty', () => {
    const bubbles = chartFor().bubbles;
    expect(bubbles).toHaveLength(6);
    expect(bubbles.every((b) => b.is_named_in_headline === false)).toBe(true);
  });

  it('is_named_in_headline: only the firing entries are named when fewer than 3 fire', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
        // Non-firing: low pull, empty quality.
        { direction: 'experience_seeker', pull: 20, pull_quality: [] },
      ],
    });
    const byEngine = Object.fromEntries(
      chartFor(out).bubbles.map((b) => [
        b.direction_engine_name,
        b.is_named_in_headline,
      ]),
    );
    expect(byEngine['creator']).toBe(true);
    expect(byEngine['freedom_designer']).toBe(true);
    expect(byEngine['experience_seeker']).toBe(false);
    // Default (non-firing) directions also remain false.
    expect(byEngine['contributor']).toBe(false);
    expect(byEngine['growth_focused']).toBe(false);
    expect(byEngine['relationship_rebuilder']).toBe(false);
  });

  it('is_named_in_headline: alphabetical tiebreak honoured when selecting top-3', () => {
    // Four firing directions; two tied at pull=70. Alphabetical tiebreak
    // (by engine direction name) selects 'freedom_designer' before 'creator'.
    const out = makeEngineOutput({
      directions: [
        { direction: 'experience_seeker', pull: 80, pull_quality: ['real'] },
        { direction: 'creator', pull: 70, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
        { direction: 'growth_focused', pull: 60, pull_quality: ['real'] },
      ],
    });
    const byEngine = Object.fromEntries(
      chartFor(out).bubbles.map((b) => [
        b.direction_engine_name,
        b.is_named_in_headline,
      ]),
    );
    expect(byEngine['experience_seeker']).toBe(true);
    expect(byEngine['freedom_designer']).toBe(true);
    expect(byEngine['creator']).toBe(true);
    expect(byEngine['growth_focused']).toBe(false);
  });
});

describe('computeChartData — caption token interpolation', () => {
  it('empty firing set → "0 directions reading materially. Movement varies."', () => {
    expect(chartFor().caption.token_text).toBe(
      '0 directions reading materially. Movement varies.',
    );
  });

  it('one firing direction → "1 directions reading materially. ..."', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    expect(chartFor(out).caption.token_text).toBe(
      '1 directions reading materially. Movement varies.',
    );
  });

  it('three firing → "3 directions reading materially. ..."', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 70, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 60, pull_quality: ['real'] },
      ],
    });
    expect(chartFor(out).caption.token_text).toBe(
      '3 directions reading materially. Movement varies.',
    );
  });
});

describe('computeChartData — caption interpretive_text', () => {
  it('no chart_caption sentences in library → interpretive_text always null', () => {
    expect(chartFor().caption.interpretive_text).toBeNull();
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80, pull_quality: ['phantom'] },
      ],
    });
    expect(chartFor(out).caption.interpretive_text).toBeNull();
  });
});

describe('computeChartData — direction_engine_name', () => {
  it('each bubble carries the source direction as direction_engine_name', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80 },
        { direction: 'freedom_designer', pull: 60 },
      ],
    });
    const bubbles = chartFor(out).bubbles;
    const byName = Object.fromEntries(
      bubbles.map((b) => [b.direction_name, b.direction_engine_name]),
    );
    expect(byName['Creator']).toBe('creator');
    expect(byName['Freedom Designer']).toBe('freedom_designer');
  });
});

describe('computeChartData — purity', () => {
  it('two calls with identical inputs return deep-equal results', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const inp = makeInputMap();
    const fs = computeFiringSet(out);
    const a = computeChartData(out, inp, fs);
    const b = computeChartData(out, inp, fs);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
