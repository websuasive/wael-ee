// Unit tests for the constraints panel (SYNTHESIS.md section 5.6).

import { describe, it, expect } from 'vitest';
import { computeConstraintsPanel } from '@/synthesis/constraints_panel';
import {
  makeEngineOutput,
  makeInputMap,
} from './synthesis-test-helpers';

const ALL_FIRING = {
  energy: { value: 0, band: 'heavy_depletion' as const, fires: true },
  time: { value: 0, band: 'heavy_time_pressure' as const, fires: true },
  body_capacity: { value: 0, band: 'limited' as const, fires: true },
  permission: {
    value: 0,
    band: 'blocked' as const,
    sub_shape: 'present' as const,
    fires: true,
  },
};

const ALL_INTACT = {
  energy: { value: 80, band: 'full' as const, fires: false },
  time: { value: 80, band: 'open' as const, fires: false },
  body_capacity: { value: 80, band: 'full' as const, fires: false },
  permission: {
    value: 80,
    band: 'present' as const,
    sub_shape: 'present' as const,
    fires: false,
  },
};

/* ------------------------------------------------------------------ */
/* A — constraint_lines filtering                                     */
/* ------------------------------------------------------------------ */

describe('computeConstraintsPanel — constraint_lines filtering', () => {
  it('all four firing → 4 lines', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 50, ...ALL_FIRING },
    });
    expect(
      computeConstraintsPanel(out, makeInputMap()).constraint_lines,
    ).toHaveLength(4);
  });

  it('only energy + permission firing → 2 lines in canonical order', () => {
    const out = makeEngineOutput({
      constraints: {
        sustained_constraint_intensity: 50,
        ...ALL_INTACT,
        energy: { value: 0, band: 'heavy_depletion', fires: true },
        permission: {
          value: 0,
          band: 'blocked',
          sub_shape: 'present',
          fires: true,
        },
      },
    });
    const lines = computeConstraintsPanel(out, makeInputMap()).constraint_lines;
    expect(lines.map((l) => l.constraint_name)).toEqual([
      'Energy',
      'Permission',
    ]);
  });

  it('none firing → 0 lines', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 0, ...ALL_INTACT },
    });
    expect(
      computeConstraintsPanel(out, makeInputMap()).constraint_lines,
    ).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* B — constraint name and band label                                 */
/* ------------------------------------------------------------------ */

describe('computeConstraintsPanel — constraint name + band label', () => {
  it('energy + heavy_depletion', () => {
    const out = makeEngineOutput({
      constraints: {
        sustained_constraint_intensity: 50,
        ...ALL_INTACT,
        energy: { value: 0, band: 'heavy_depletion', fires: true },
      },
    });
    const line = computeConstraintsPanel(out, makeInputMap()).constraint_lines[0]!;
    expect(line.constraint_name).toBe('Energy');
    expect(line.band_label).toBe('heavy depletion');
  });

  it('time + moderate', () => {
    const out = makeEngineOutput({
      constraints: {
        sustained_constraint_intensity: 50,
        ...ALL_INTACT,
        time: { value: 50, band: 'moderate', fires: true },
      },
    });
    const line = computeConstraintsPanel(out, makeInputMap()).constraint_lines[0]!;
    expect(line.constraint_name).toBe('Time');
    expect(line.band_label).toBe('moderate');
  });

  it('body_capacity + limited → "Body" + "limited"', () => {
    const out = makeEngineOutput({
      constraints: {
        sustained_constraint_intensity: 50,
        ...ALL_INTACT,
        body_capacity: { value: 0, band: 'limited', fires: true },
      },
    });
    const line = computeConstraintsPanel(out, makeInputMap()).constraint_lines[0]!;
    expect(line.constraint_name).toBe('Body');
    expect(line.band_label).toBe('limited');
  });

  it('permission + blocked', () => {
    const out = makeEngineOutput({
      constraints: {
        sustained_constraint_intensity: 50,
        ...ALL_INTACT,
        permission: {
          value: 0,
          band: 'blocked',
          sub_shape: 'present',
          fires: true,
        },
      },
    });
    const line = computeConstraintsPanel(out, makeInputMap()).constraint_lines[0]!;
    expect(line.constraint_name).toBe('Permission');
    expect(line.band_label).toBe('blocked');
  });
});

/* ------------------------------------------------------------------ */
/* C — permission_sub_shape_text                                      */
/* ------------------------------------------------------------------ */

describe('computeConstraintsPanel — permission_sub_shape_text', () => {
  function permissionPanel(sub: 'want_block' | 'say_block' | 'act_block' | 'present') {
    const out = makeEngineOutput({
      constraints: {
        sustained_constraint_intensity: 50,
        ...ALL_INTACT,
        permission: {
          value: 0,
          band: 'blocked',
          sub_shape: sub,
          fires: true,
        },
      },
    });
    return computeConstraintsPanel(out, makeInputMap());
  }

  it('want_block → "Wanting that isn\'t being let in."', () => {
    const panel = permissionPanel('want_block');
    expect(panel.permission_sub_shape_text?.interpretive_text).toBe(
      "Wanting that isn't being let in.",
    );
    expect(panel.permission_sub_shape_text?.token_text).toBe(
      "Wanting that isn't being let in.",
    );
  });

  it('say_block', () => {
    expect(
      permissionPanel('say_block').permission_sub_shape_text?.interpretive_text,
    ).toBe("Wanting something that hasn't been said out loud.");
  });

  it('act_block', () => {
    expect(
      permissionPanel('act_block').permission_sub_shape_text?.interpretive_text,
    ).toBe('Wanting something thought about but not acted on.');
  });

  it('present', () => {
    expect(
      permissionPanel('present').permission_sub_shape_text?.interpretive_text,
    ).toBe('Permission reading partial; nothing specific blocking.');
  });

  it('permission fires → panel.permission_sub_shape_text non-null', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 50, ...ALL_FIRING },
    });
    const panel = computeConstraintsPanel(out, makeInputMap());
    expect(panel.permission_sub_shape_text).not.toBeNull();
  });

  it('permission does not fire → panel.permission_sub_shape_text === null', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 0, ...ALL_INTACT },
    });
    const panel = computeConstraintsPanel(out, makeInputMap());
    expect(panel.permission_sub_shape_text).toBeNull();
  });

  it('constraint_lines no longer carry permission_sub_shape_text', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 50, ...ALL_FIRING },
    });
    const lines = computeConstraintsPanel(out, makeInputMap()).constraint_lines;
    for (const line of lines) {
      expect(
        Object.prototype.hasOwnProperty.call(line, 'permission_sub_shape_text'),
      ).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------ */
/* D — sustained_constraint_intensity                                 */
/* ------------------------------------------------------------------ */

describe('computeConstraintsPanel — sustained_constraint_intensity', () => {
  it('passthrough', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 73.5, ...ALL_INTACT },
    });
    expect(
      computeConstraintsPanel(out, makeInputMap())
        .sustained_constraint_intensity,
    ).toBe(73.5);
  });
});

/* ------------------------------------------------------------------ */
/* E — intact_callout                                                 */
/* ------------------------------------------------------------------ */

describe('computeConstraintsPanel — intact_callout', () => {
  it('all four firing (none intact) → null + empty token', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 50, ...ALL_FIRING },
    });
    const panel = computeConstraintsPanel(out, makeInputMap());
    expect(panel.intact_callout.interpretive_text).toBeNull();
    expect(panel.intact_callout.token_text).toBe('');
  });

  it('permission intact, others firing → "Permission reading intact."', () => {
    const out = makeEngineOutput({
      constraints: {
        sustained_constraint_intensity: 50,
        ...ALL_FIRING,
        permission: {
          value: 80,
          band: 'present',
          sub_shape: 'present',
          fires: false,
        },
      },
    });
    expect(
      computeConstraintsPanel(out, makeInputMap()).intact_callout.token_text,
    ).toBe('Permission reading intact.');
  });

  it('energy + body_capacity intact → "Energy, Body reading intact."', () => {
    const out = makeEngineOutput({
      constraints: {
        sustained_constraint_intensity: 50,
        ...ALL_FIRING,
        energy: { value: 80, band: 'full', fires: false },
        body_capacity: { value: 80, band: 'full', fires: false },
      },
    });
    expect(
      computeConstraintsPanel(out, makeInputMap()).intact_callout.token_text,
    ).toBe('Energy, Body reading intact.');
  });

  it('all four intact → "Energy, Time, Body, Permission reading intact."', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 0, ...ALL_INTACT },
    });
    expect(
      computeConstraintsPanel(out, makeInputMap()).intact_callout.token_text,
    ).toBe('Energy, Time, Body, Permission reading intact.');
  });
});

/* ------------------------------------------------------------------ */
/* F — summary spec gap                                               */
/* ------------------------------------------------------------------ */

describe('computeConstraintsPanel — summary (spec gap)', () => {
  it('always { interpretive_text: null, token_text: "" }', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 50, ...ALL_FIRING },
    });
    const panel = computeConstraintsPanel(out, makeInputMap());
    expect(panel.summary).toEqual({ interpretive_text: null, token_text: '' });

    const out2 = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 0, ...ALL_INTACT },
    });
    const panel2 = computeConstraintsPanel(out2, makeInputMap());
    expect(panel2.summary).toEqual({ interpretive_text: null, token_text: '' });
  });
});

/* ------------------------------------------------------------------ */
/* G — purity                                                         */
/* ------------------------------------------------------------------ */

describe('computeConstraintsPanel — constraint_engine_name', () => {
  it('each emitted line carries its engine name', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 50, ...ALL_FIRING },
    });
    const panel = computeConstraintsPanel(out, makeInputMap());
    const byName = Object.fromEntries(
      panel.constraint_lines.map((l) => [l.constraint_engine_name, l]),
    );
    expect(byName.energy?.constraint_engine_name).toBe('energy');
    expect(byName.time?.constraint_engine_name).toBe('time');
    expect(byName.body_capacity?.constraint_engine_name).toBe('body_capacity');
    expect(byName.permission?.constraint_engine_name).toBe('permission');
  });
});

describe('computeConstraintsPanel — intensity passthrough', () => {
  it('each line carries the engine constraint value as intensity', () => {
    const out = makeEngineOutput({
      constraints: {
        sustained_constraint_intensity: 50,
        energy: { value: 75, band: 'heavy_depletion', fires: true },
        time: { value: 60, band: 'heavy_time_pressure', fires: true },
        body_capacity: { value: 45, band: 'limited', fires: true },
        permission: {
          value: 80,
          band: 'blocked',
          sub_shape: 'present',
          fires: true,
        },
      },
    });
    const lines = computeConstraintsPanel(out, makeInputMap()).constraint_lines;
    const byName = Object.fromEntries(
      lines.map((l) => [l.constraint_engine_name, l.intensity]),
    );
    expect(byName.energy).toBe(75);
    expect(byName.time).toBe(60);
    expect(byName.body_capacity).toBe(45);
    expect(byName.permission).toBe(80);
  });
});

describe('computeConstraintsPanel — purity', () => {
  it('two calls return deep-equal', () => {
    const out = makeEngineOutput({
      constraints: { sustained_constraint_intensity: 50, ...ALL_FIRING },
    });
    const a = computeConstraintsPanel(out, makeInputMap());
    const b = computeConstraintsPanel(out, makeInputMap());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
