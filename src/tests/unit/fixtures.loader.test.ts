import { describe, it, expect } from 'vitest';
import {
  parseFixture,
  validateExpectedSchema,
  generateFixtureTemplate,
} from '@/fixtures/loader';
import type { FixtureLoadError } from '@/fixtures/types';

const template = generateFixtureTemplate();
const validInputJsonText = template.inputJson;
const validExpectedJsonText = JSON.stringify({
  directions: {
    creator: {
      surfaced: true,
      pull: { between: [50, 70] },
      pull_quality: { contains: ['suppressed'] },
      pull_state: { equals: ['held_attributed_with_expression'] },
    },
  },
  domains: {
    curiosity: { fires: true, value: 'reduced_wants_back' },
  },
  constraints: {
    sustained_constraint_intensity: 100,
    permission: {
      value: { between: [0, 40] },
      band: 'blocked',
      fires: true,
      sub_shape: 'say_block',
    },
  },
  cross_cutting: {
    between_shapes: { fires: false },
  },
});

function parseAndExpectErrors(args: {
  id?: string;
  inputJsonText?: string;
  expectedJsonText?: string;
  storyMdText?: string;
}): FixtureLoadError[] {
  const r = parseFixture({
    id: args.id ?? 'test',
    inputJsonText: args.inputJsonText ?? validInputJsonText,
    expectedJsonText: args.expectedJsonText ?? validExpectedJsonText,
    storyMdText: args.storyMdText ?? '',
  });
  expect(r.ok).toBe(false);
  if (r.ok) throw new Error('unreachable');
  return r.errors;
}

function expectSchemaOk(value: unknown): void {
  const r = validateExpectedSchema(value);
  expect(r.ok).toBe(true);
}

function expectSchemaErrors(value: unknown): FixtureLoadError[] {
  const r = validateExpectedSchema(value);
  expect(r.ok).toBe(false);
  if (r.ok) throw new Error('unreachable');
  return r.errors;
}

/* ------------------------------------------------------------------ */

describe('A. parseFixture happy path', () => {
  it('valid inputs → ok with fixture', () => {
    const r = parseFixture({
      id: 'sample',
      inputJsonText: validInputJsonText,
      expectedJsonText: validExpectedJsonText,
      storyMdText: '# Sample\n',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fixture.id).toBe('sample');
      expect(r.fixture.storyMd).toBe('# Sample\n');
      expect(typeof r.fixture.inputJson).toBe('object');
      expect(typeof r.fixture.expectedJson).toBe('object');
    }
  });
});

describe('B. parseFixture — input.json errors', () => {
  it('malformed JSON in input.json', () => {
    const errs = parseAndExpectErrors({ inputJsonText: '{ not json' });
    expect(errs).toHaveLength(1);
    expect(errs[0]!.source).toBe('input.json');
    expect(errs[0]!.code).toBe('invalid_json');
    expect(errs[0]!.path).toBe('');
  });

  it('input.json fails validateInputMap', () => {
    const errs = parseAndExpectErrors({ inputJsonText: '{}' });
    expect(errs.length).toBeGreaterThan(0);
    for (const e of errs) {
      expect(e.source).toBe('input.json');
      expect(e.code).toBe('invalid_input_map');
    }
  });

  it('multiple validation errors all reported', () => {
    const errs = parseAndExpectErrors({ inputJsonText: '{}' });
    expect(errs.length).toBeGreaterThan(1);
  });

  it('when input.json fails, expected.json is not validated', () => {
    // Both broken: only input errors come back.
    const errs = parseAndExpectErrors({
      inputJsonText: '{ not json',
      expectedJsonText: '{ also not json',
    });
    for (const e of errs) {
      expect(e.source).toBe('input.json');
    }
  });
});

describe('C. parseFixture — expected.json errors', () => {
  it('malformed JSON in expected.json', () => {
    const errs = parseAndExpectErrors({ expectedJsonText: '{ broken' });
    expect(errs).toHaveLength(1);
    expect(errs[0]!.source).toBe('expected.json');
    expect(errs[0]!.code).toBe('invalid_json');
  });

  it('schema-invalid expected.json', () => {
    const errs = parseAndExpectErrors({
      expectedJsonText: JSON.stringify({ unknown_top: {} }),
    });
    expect(errs.length).toBeGreaterThan(0);
    for (const e of errs) {
      expect(e.source).toBe('expected.json');
      expect(e.code).toBe('invalid_expected_schema');
    }
  });

  it('valid input + broken expected → only expected errors', () => {
    const errs = parseAndExpectErrors({
      expectedJsonText: JSON.stringify({ unknown_top: {} }),
    });
    for (const e of errs) {
      expect(e.source).toBe('expected.json');
    }
  });
});

describe('D. validateExpectedSchema — top level', () => {
  it('empty object → ok', () => {
    expectSchemaOk({});
  });

  it('null → error', () => {
    expectSchemaErrors(null);
  });

  it('array → error', () => {
    expectSchemaErrors([]);
  });

  it('primitive string → error', () => {
    expectSchemaErrors('hello');
  });

  it('unknown top-level key → error with that key path; valid keys still validated', () => {
    const errs = expectSchemaErrors({
      garbage: {},
      directions: { makin: {} }, // also invalid
    });
    expect(errs.some((e) => e.path === 'garbage')).toBe(true);
    expect(errs.some((e) => e.path === 'directions.makin')).toBe(true);
  });

  it('all four valid top-level keys → ok', () => {
    expectSchemaOk({
      directions: {},
      domains: {},
      constraints: {},
      cross_cutting: {},
    });
  });
});

describe('E. validateExpectedSchema — directions', () => {
  it('directions not a plain object → error', () => {
    expectSchemaErrors({ directions: [] });
    expectSchemaErrors({ directions: 'x' });
  });

  it('unknown direction name → error at directions.<name>', () => {
    const errs = expectSchemaErrors({ directions: { makin: {} } });
    expect(errs.some((e) => e.path === 'directions.makin')).toBe(true);
  });

  it('valid direction names accepted', () => {
    expectSchemaOk({
      directions: {
        contributor: {},
        experience_seeker: {},
        freedom_designer: {},
        growth_focused: {},
        creator: {},
        relationship_rebuilder: {},
      },
    });
  });

  it('direction value not a plain object → error', () => {
    expectSchemaErrors({ directions: { creator: 'x' } });
  });

  it('unknown field within direction → error', () => {
    const errs = expectSchemaErrors({
      directions: { creator: { foo: true } },
    });
    expect(errs.some((e) => e.path === 'directions.creator.foo')).toBe(true);
  });

  it('all valid direction field names accepted', () => {
    expectSchemaOk({
      directions: {
        creator: {
          direction: 'creator',
          surfaced: true,
          pull: 50,
          movement: 50,
          quadrant: 'active',
          past_relationship: 'returning',
          was_once_renders: false,
          specificity: 'strong',
          pull_quality: ['real'],
          pull_state: ['held_attributed_with_expression'],
        },
      },
    });
  });
});

describe('F. validateExpectedSchema — domains', () => {
  it('unknown domain name → error', () => {
    const errs = expectSchemaErrors({ domains: { foo: {} } });
    expect(errs.some((e) => e.path === 'domains.foo')).toBe(true);
  });

  it('valid domain names accepted', () => {
    expectSchemaOk({
      domains: {
        time_as_yours: {},
        energy_as_resource: {},
        felt_aliveness: {},
        body_physical_aliveness: {},
        curiosity: {},
        making: {},
        conversation_depth: {},
        being_known: {},
        friendship: {},
        intimacy: {},
        mattering: {},
      },
    });
  });

  it('unknown field within a domain → error', () => {
    const errs = expectSchemaErrors({
      domains: { curiosity: { bogus: true } },
    });
    expect(errs.some((e) => e.path === 'domains.curiosity.bogus')).toBe(true);
  });
});

describe('G. validateExpectedSchema — constraints', () => {
  it('unknown constraint key → error', () => {
    const errs = expectSchemaErrors({ constraints: { foo: 1 } });
    expect(errs.some((e) => e.path === 'constraints.foo')).toBe(true);
  });

  it('sustained_constraint_intensity as bare leaf', () => {
    expectSchemaOk({ constraints: { sustained_constraint_intensity: 42 } });
  });

  it('sustained_constraint_intensity as between matcher', () => {
    expectSchemaOk({
      constraints: { sustained_constraint_intensity: { between: [50, 70] } },
    });
  });

  it('constraints.energy as sub-object with allowed fields', () => {
    expectSchemaOk({
      constraints: {
        energy: { value: 50, band: 'moderate', fires: true },
      },
    });
  });

  it('unknown field within constraints.energy → error', () => {
    const errs = expectSchemaErrors({
      constraints: { energy: { whatever: true } },
    });
    expect(errs.some((e) => e.path === 'constraints.energy.whatever')).toBe(true);
  });

  it('constraints.energy.sub_shape → error (not allowed on energy)', () => {
    const errs = expectSchemaErrors({
      constraints: { energy: { sub_shape: 'present' } },
    });
    expect(
      errs.some((e) => e.path === 'constraints.energy.sub_shape'),
    ).toBe(true);
  });

  it('constraints.permission.sub_shape accepted', () => {
    expectSchemaOk({
      constraints: { permission: { sub_shape: 'say_block' } },
    });
  });
});

describe('H. validateExpectedSchema — cross_cutting', () => {
  it('unknown cross-cutting name → error', () => {
    const errs = expectSchemaErrors({ cross_cutting: { foo: {} } });
    expect(errs.some((e) => e.path === 'cross_cutting.foo')).toBe(true);
  });

  it('valid names accepted', () => {
    expectSchemaOk({
      cross_cutting: {
        between_shapes: {},
        mid_process: {},
      },
    });
  });

  it('unknown field within cross-cutting entry → error', () => {
    const errs = expectSchemaErrors({
      cross_cutting: { between_shapes: { foo: true } },
    });
    expect(
      errs.some((e) => e.path === 'cross_cutting.between_shapes.foo'),
    ).toBe(true);
  });
});

describe('I. validateExpectedSchema — matchers', () => {
  it('between [50, 70] accepted', () => {
    expectSchemaOk({ directions: { creator: { pull: { between: [50, 70] } } } });
  });

  it('between [70, 50] → error (min > max)', () => {
    expectSchemaErrors({
      directions: { creator: { pull: { between: [70, 50] } } },
    });
  });

  it('between [50] → error (not exactly two)', () => {
    expectSchemaErrors({
      directions: { creator: { pull: { between: [50] } } },
    });
  });

  it('between [50, 70, 100] → error', () => {
    expectSchemaErrors({
      directions: { creator: { pull: { between: [50, 70, 100] } } },
    });
  });

  it('between ["a", "b"] → error', () => {
    expectSchemaErrors({
      directions: { creator: { pull: { between: ['a', 'b'] } } },
    });
  });

  it('between [NaN, 70] → error (constructed object)', () => {
    expectSchemaErrors({
      directions: { creator: { pull: { between: [Number.NaN, 70] } } },
    });
  });

  it('contains [...] accepted', () => {
    expectSchemaOk({
      directions: { creator: { pull_quality: { contains: ['suppressed'] } } },
    });
  });

  it('contains "string" → error', () => {
    expectSchemaErrors({
      directions: { creator: { pull_quality: { contains: 'nope' } } },
    });
  });

  it('equals [...] accepted', () => {
    expectSchemaOk({
      directions: { creator: { pull_state: { equals: ['held_attributed_with_expression'] } } },
    });
  });

  it('equals "string" → error', () => {
    expectSchemaErrors({
      directions: { creator: { pull_state: { equals: 'nope' } } },
    });
  });

  it('between with extra key → error', () => {
    expectSchemaErrors({
      directions: { creator: { pull: { between: [50, 70], extra: 'field' } } },
    });
  });

  it('multiple matcher keys → error', () => {
    expectSchemaErrors({
      directions: {
        creator: { pull: { between: [50, 70], contains: ['x'] } },
      },
    });
  });

  it('bare values at leaf positions accepted', () => {
    expectSchemaOk({
      directions: {
        creator: {
          surfaced: true,
          pull: 50,
          quadrant: 'active',
          pull_quality: ['real'],
          past_relationship: null,
        },
      },
    });
  });

  it('plain object without matcher keys accepted as bare value', () => {
    expectSchemaOk({
      directions: {
        creator: { pull: { foo: 'bar' } },
      },
    });
  });
});

describe('J. validateExpectedSchema — error path correctness', () => {
  it('malformed between deep in tree includes full path', () => {
    const errs = expectSchemaErrors({
      directions: { creator: { pull: { between: [70, 50] } } },
    });
    expect(
      errs.some((e) => e.path === 'directions.creator.pull.between'),
    ).toBe(true);
  });

  it('multiple errors in different branches all reported', () => {
    const errs = expectSchemaErrors({
      directions: { creator: { pull: { between: [70, 50] } } },
      domains: { curiosity: { foo: true } },
      cross_cutting: { whatever: {} },
    });
    expect(
      errs.some((e) => e.path === 'directions.creator.pull.between'),
    ).toBe(true);
    expect(errs.some((e) => e.path === 'domains.curiosity.foo')).toBe(true);
    expect(errs.some((e) => e.path === 'cross_cutting.whatever')).toBe(true);
  });
});

describe('K. generateFixtureTemplate', () => {
  it('returns three non-empty strings', () => {
    const t = generateFixtureTemplate();
    expect(t.inputJson.length).toBeGreaterThan(0);
    expect(t.expectedJson.length).toBeGreaterThan(0);
    expect(t.storyMd.length).toBeGreaterThan(0);
  });

  it('inputJson parses to valid JSON', () => {
    expect(() => JSON.parse(generateFixtureTemplate().inputJson)).not.toThrow();
  });

  it('parsed input passes validateInputMap', async () => {
    const { validateInputMap } = await import('@/engine/validation');
    const r = validateInputMap(JSON.parse(generateFixtureTemplate().inputJson));
    expect(r.ok).toBe(true);
  });

  it('4 universal-wanting domains lack wanting key', () => {
    const parsed = JSON.parse(generateFixtureTemplate().inputJson) as {
      domains: Record<string, Record<string, unknown>>;
    };
    for (const name of [
      'time_as_yours',
      'energy_as_resource',
      'felt_aliveness',
      'body_physical_aliveness',
    ]) {
      expect(
        Object.prototype.hasOwnProperty.call(parsed.domains[name], 'wanting'),
      ).toBe(false);
    }
  });

  it('7 non-universal-wanting domains have wanting key', () => {
    const parsed = JSON.parse(generateFixtureTemplate().inputJson) as {
      domains: Record<string, Record<string, unknown>>;
    };
    for (const name of [
      'curiosity',
      'making',
      'conversation_depth',
      'being_known',
      'friendship',
      'intimacy',
      'mattering',
    ]) {
      expect(
        Object.prototype.hasOwnProperty.call(parsed.domains[name], 'wanting'),
      ).toBe(true);
    }
  });

  it('expectedJson parses to valid JSON', () => {
    expect(() =>
      JSON.parse(generateFixtureTemplate().expectedJson),
    ).not.toThrow();
  });

  it('parsed expected passes validateExpectedSchema', () => {
    const r = validateExpectedSchema(
      JSON.parse(generateFixtureTemplate().expectedJson),
    );
    expect(r.ok).toBe(true);
  });

  it('expected JSON exercises all four matcher syntaxes', () => {
    const parsed = JSON.parse(generateFixtureTemplate().expectedJson) as Record<
      string,
      unknown
    >;
    let bare = false;
    let between = false;
    let contains = false;
    let equals = false;
    function walk(v: unknown): void {
      if (v === null) {
        bare = true;
        return;
      }
      if (Array.isArray(v)) {
        bare = true;
        return;
      }
      if (typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(o, 'between')) between = true;
        else if (Object.prototype.hasOwnProperty.call(o, 'contains'))
          contains = true;
        else if (Object.prototype.hasOwnProperty.call(o, 'equals'))
          equals = true;
        else for (const k of Object.keys(o)) walk(o[k]);
        return;
      }
      bare = true;
    }
    walk(parsed);
    expect(bare).toBe(true);
    expect(between).toBe(true);
    expect(contains).toBe(true);
    expect(equals).toBe(true);
  });

  it('full parseFixture pipeline using template outputs returns ok', () => {
    const t = generateFixtureTemplate();
    const r = parseFixture({
      id: 'tpl',
      inputJsonText: t.inputJson,
      expectedJsonText: t.expectedJson,
      storyMdText: t.storyMd,
    });
    expect(r.ok).toBe(true);
  });
});

describe('L. parseFixture composition', () => {
  it('end-to-end with template', () => {
    const t = generateFixtureTemplate();
    const r = parseFixture({
      id: 'composed',
      inputJsonText: t.inputJson,
      expectedJsonText: t.expectedJson,
      storyMdText: t.storyMd,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fixture.id).toBe('composed');
      expect(r.fixture.storyMd).toBe(t.storyMd);
    }
  });
});
