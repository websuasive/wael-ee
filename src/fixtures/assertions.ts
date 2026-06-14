// Assertion runner: walks ExpectedAssertions against an EngineOutput, applies the four matchers, and returns per-assertion pass/fail. Used by both the test harness (step 12) and the inspection UI (step 14).

import type {
  EngineOutput,
  DirectionName,
  DomainName,
  CrossCuttingName,
} from '../engine/types';
import type { ExpectedAssertions } from './types';

export type AssertionMatcherKind = 'exact' | 'between' | 'contains' | 'equals';

export type AssertionResult = {
  path: string;
  matcher: AssertionMatcherKind;
  expected: unknown;
  actual: unknown;
  passed: boolean;
  reason?: string;
};

export type AssertionRunResult = {
  results: AssertionResult[];
  passed: number;
  failed: number;
  total: number;
};

const DIRECTION_ORDER: readonly DirectionName[] = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
];

const DOMAIN_ORDER: readonly DomainName[] = [
  'time_as_yours',
  'energy_as_resource',
  'felt_aliveness',
  'body_physical_aliveness',
  'curiosity',
  'making',
  'conversation_depth',
  'being_known',
  'friendship',
  'intimacy',
  'mattering',
];

const CONSTRAINT_BAND_ORDER = ['energy', 'time', 'body_capacity', 'permission'] as const;

const CROSS_CUTTING_ORDER: readonly CrossCuttingName[] = [
  'between_shapes',
  'mid_process',
];

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object') {
    if (!isPlainObject(a) || !isPlainObject(b)) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (!deepEqual(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

function multisetEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  const remaining = [...b];
  for (const x of a) {
    const idx = remaining.findIndex((y) => deepEqual(x, y));
    if (idx === -1) return false;
    remaining.splice(idx, 1);
  }
  return true;
}

function detectMatcher(
  expected: unknown,
):
  | { kind: 'exact' }
  | { kind: 'between'; range: [number, number] }
  | { kind: 'contains'; items: unknown[] }
  | { kind: 'equals'; items: unknown[] } {
  if (!isPlainObject(expected)) return { kind: 'exact' };
  if (Object.prototype.hasOwnProperty.call(expected, 'between')) {
    return { kind: 'between', range: expected.between as [number, number] };
  }
  if (Object.prototype.hasOwnProperty.call(expected, 'contains')) {
    return { kind: 'contains', items: expected.contains as unknown[] };
  }
  if (Object.prototype.hasOwnProperty.call(expected, 'equals')) {
    return { kind: 'equals', items: expected.equals as unknown[] };
  }
  return { kind: 'exact' };
}

function applyExact(
  path: string,
  expected: unknown,
  actual: unknown,
): AssertionResult {
  const passed = deepEqual(actual, expected);
  const result: AssertionResult = {
    path,
    matcher: 'exact',
    expected,
    actual,
    passed,
  };
  if (!passed) {
    result.reason = `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
  }
  return result;
}

function applyBetween(
  path: string,
  range: [number, number],
  actual: unknown,
  expectedRaw: unknown,
): AssertionResult {
  const [min, max] = range;
  if (typeof actual !== 'number' || !Number.isFinite(actual)) {
    return {
      path,
      matcher: 'between',
      expected: expectedRaw,
      actual,
      passed: false,
      reason: `Expected number in [${min}, ${max}], got ${JSON.stringify(actual)}`,
    };
  }
  const passed = actual >= min && actual <= max;
  const result: AssertionResult = {
    path,
    matcher: 'between',
    expected: expectedRaw,
    actual,
    passed,
  };
  if (!passed) {
    result.reason = `Expected number in [${min}, ${max}], got ${actual}`;
  }
  return result;
}

function applyContains(
  path: string,
  items: unknown[],
  actual: unknown,
  expectedRaw: unknown,
): AssertionResult {
  if (!Array.isArray(actual)) {
    return {
      path,
      matcher: 'contains',
      expected: expectedRaw,
      actual,
      passed: false,
      reason: `Expected array containing ${JSON.stringify(items)}, got ${JSON.stringify(actual)}`,
    };
  }
  const missing = items.filter(
    (it) => !actual.some((a) => deepEqual(a, it)),
  );
  const passed = missing.length === 0;
  const result: AssertionResult = {
    path,
    matcher: 'contains',
    expected: expectedRaw,
    actual,
    passed,
  };
  if (!passed) {
    result.reason = `Expected array containing ${JSON.stringify(items)}, got ${JSON.stringify(actual)} (missing: ${JSON.stringify(missing)})`;
  }
  return result;
}

function applyEquals(
  path: string,
  items: unknown[],
  actual: unknown,
  expectedRaw: unknown,
): AssertionResult {
  if (!Array.isArray(actual)) {
    return {
      path,
      matcher: 'equals',
      expected: expectedRaw,
      actual,
      passed: false,
      reason: `Expected array equal to ${JSON.stringify(items)} (order-insensitive), got ${JSON.stringify(actual)}`,
    };
  }
  const passed = multisetEqual(actual, items);
  const result: AssertionResult = {
    path,
    matcher: 'equals',
    expected: expectedRaw,
    actual,
    passed,
  };
  if (!passed) {
    result.reason = `Expected array equal to ${JSON.stringify(items)} (order-insensitive), got ${JSON.stringify(actual)}`;
  }
  return result;
}

function applyMatcher(
  path: string,
  expected: unknown,
  actual: unknown,
): AssertionResult {
  const m = detectMatcher(expected);
  switch (m.kind) {
    case 'exact':
      return applyExact(path, expected, actual);
    case 'between':
      return applyBetween(path, m.range, actual, expected);
    case 'contains':
      return applyContains(path, m.items, actual, expected);
    case 'equals':
      return applyEquals(path, m.items, actual, expected);
  }
}

function joinPath(base: string, segment: string): string {
  return base === '' ? segment : `${base}.${segment}`;
}

export function runAssertions(
  expected: ExpectedAssertions,
  actual: EngineOutput,
): AssertionRunResult {
  const results: AssertionResult[] = [];

  // 1. directions
  if (expected.directions) {
    for (const name of DIRECTION_ORDER) {
      const dirExpected = expected.directions[name];
      if (!dirExpected) continue;
      const dirActual = actual.directions.find((d) => d.direction === name);
      const basePath = `directions.${name}`;
      for (const field of Object.keys(dirExpected)) {
        const fieldExpected = (dirExpected as Record<string, unknown>)[field];
        const fieldActual = dirActual
          ? (dirActual as unknown as Record<string, unknown>)[field]
          : undefined;
        results.push(applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual));
      }
    }
  }

  // 2. domains
  if (expected.domains) {
    for (const name of DOMAIN_ORDER) {
      const domExpected = expected.domains[name];
      if (!domExpected) continue;
      const domActual = actual.domains.find((d) => d.domain === name);
      const basePath = `domains.${name}`;
      for (const field of Object.keys(domExpected)) {
        const fieldExpected = (domExpected as Record<string, unknown>)[field];
        const fieldActual = domActual
          ? (domActual as unknown as Record<string, unknown>)[field]
          : undefined;
        results.push(applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual));
      }
    }
  }

  // 3. constraints
  if (expected.constraints) {
    const cExp = expected.constraints;
    const cAct = actual.constraints;
    if (Object.prototype.hasOwnProperty.call(cExp, 'sustained_constraint_intensity')) {
      results.push(
        applyMatcher(
          'constraints.sustained_constraint_intensity',
          cExp.sustained_constraint_intensity,
          cAct.sustained_constraint_intensity,
        ),
      );
    }
    for (const sub of CONSTRAINT_BAND_ORDER) {
      const subExp = cExp[sub];
      if (!subExp) continue;
      const subAct = cAct[sub] as unknown as Record<string, unknown>;
      const basePath = `constraints.${sub}`;
      for (const field of Object.keys(subExp)) {
        const fieldExpected = (subExp as Record<string, unknown>)[field];
        const fieldActual = subAct ? subAct[field] : undefined;
        results.push(applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual));
      }
    }
  }

  // 4. cross_direction (engine extension §6.1a).
  if (expected.cross_direction) {
    const cdExp = expected.cross_direction as Record<string, unknown>;
    const cdAct = actual.cross_direction as unknown as Record<string, unknown>;
    for (const field of Object.keys(cdExp)) {
      results.push(
        applyMatcher(
          `cross_direction.${field}`,
          cdExp[field],
          cdAct ? cdAct[field] : undefined,
        ),
      );
    }
  }

  // 5. cross_cutting
  if (expected.cross_cutting) {
    for (const name of CROSS_CUTTING_ORDER) {
      const ccExpected = expected.cross_cutting[name];
      if (!ccExpected) continue;
      const ccActual = actual.cross_cutting.find((c) => c.output === name);
      const basePath = `cross_cutting.${name}`;
      for (const field of Object.keys(ccExpected)) {
        const fieldExpected = (ccExpected as Record<string, unknown>)[field];
        const fieldActual = ccActual
          ? (ccActual as unknown as Record<string, unknown>)[field]
          : undefined;
        results.push(applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual));
      }
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  return { results, passed, failed: total - passed, total };
}

export function formatFailures(result: AssertionRunResult): string {
  if (result.failed === 0) return '';
  const lines: string[] = [
    `${result.failed} of ${result.total} assertions failed:`,
  ];
  for (const r of result.results) {
    if (!r.passed) {
      lines.push(`  ${r.path}: ${r.reason ?? ''}`);
    }
  }
  return lines.join('\n');
}
