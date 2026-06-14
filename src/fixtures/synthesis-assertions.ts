// Synthesis-side assertion runner. Mirrors the engine-side runner in src/fixtures/assertions.ts: walks ExpectedSynthesisAssertions against a RenderingInstructions, applies sentinels and matchers, returns per-assertion pass/fail.

import type { RenderingInstructions } from '../synthesis';
import type { SlotName } from '../synthesis/types';
import { shapeSentences } from '../synthesis/data/shape_sentences';
import type { AssertionResult, AssertionRunResult } from './assertions';
import type {
  ExpectedSynthesisAssertions,
  ExpectedHeadlineAssertions,
  ExpectedSlotContentAssertions,
  ExpectedDirectionCardAssertions,
  ExpectedChartBubbleAssertions,
  ExpectedDomainsPanelAssertions,
  ExpectedConstraintLineAssertions,
  ExpectedConstraintsPanelAssertions,
  ExpectedCrossCuttingPanelAssertions,
  ExpectedClosingLineAssertions,
  ExpectedClosingLinesAssertions,
  ExpectedExperienceCandidateAssertions,
  ExpectedExperienceCandidatesAssertions,
  ExpectedLifeTexturePanelAssertions,
  ExpectedLifeContextPanelAssertions,
  ExpectedComparisonSurfacePanelAssertions,
  ExpectedComparisonItemAssertion,
  SentinelMatcher,
} from './types';

export type SynthesisAssertionMatcherKind =
  | 'exact'
  | 'between'
  | 'contains'
  | 'equals'
  | 'sentinel';

const SENTINEL_VALUES: ReadonlySet<string> = new Set([
  '<NON_NULL>',
  '<NULL>',
  '<PRESENT>',
  '<ABSENT>',
]);

function isSentinel(x: unknown): x is SentinelMatcher {
  return typeof x === 'string' && SENTINEL_VALUES.has(x);
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/* ------------------------------------------------------------------ */
/* Replicated equality helpers (kept private to this module).         */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Matcher detection / application                                     */
/* ------------------------------------------------------------------ */

function detectMatcher(
  expected: unknown,
):
  | { kind: 'exact' }
  | { kind: 'sentinel'; sentinel: SentinelMatcher }
  | { kind: 'between'; range: [number, number] }
  | { kind: 'contains'; items: unknown[] }
  | { kind: 'equals'; items: unknown[] } {
  if (isSentinel(expected)) {
    return { kind: 'sentinel', sentinel: expected };
  }
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
  const missing = items.filter((it) => !actual.some((a) => deepEqual(a, it)));
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

function applyLeafSentinel(
  path: string,
  sentinel: SentinelMatcher,
  actual: unknown,
): AssertionResult {
  // Leaf-level sentinels: <NON_NULL> and <NULL>. Use of <PRESENT>/<ABSENT> at a
  // leaf falls through to a definitive failure with a clear reason.
  let passed: boolean;
  let reason: string | undefined;
  switch (sentinel) {
    case '<NON_NULL>':
      passed = actual !== null && actual !== undefined;
      if (!passed) {
        reason = `Expected non-null value, got ${JSON.stringify(actual ?? null)}`;
      }
      break;
    case '<NULL>':
      passed = actual === null;
      if (!passed) {
        reason = `Expected null, got ${JSON.stringify(actual)}`;
      }
      break;
    case '<PRESENT>':
    case '<ABSENT>':
      passed = false;
      reason = `Sentinel ${sentinel} is only valid as a key-membership matcher`;
      break;
  }
  const result: AssertionResult = {
    path,
    matcher: 'sentinel' as unknown as AssertionResult['matcher'],
    expected: sentinel,
    actual,
    passed,
  };
  if (reason !== undefined) result.reason = reason;
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
    case 'sentinel':
      return applyLeafSentinel(path, m.sentinel, actual);
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

/* ------------------------------------------------------------------ */
/* Membership-sentinel result builders                                 */
/* ------------------------------------------------------------------ */

function membershipResult(
  path: string,
  sentinel: '<PRESENT>' | '<ABSENT>',
  exists: boolean,
): AssertionResult {
  const passed = sentinel === '<PRESENT>' ? exists : !exists;
  const result: AssertionResult = {
    path,
    matcher: 'sentinel' as unknown as AssertionResult['matcher'],
    expected: sentinel,
    actual: exists ? '<PRESENT>' : '<ABSENT>',
    passed,
  };
  if (!passed) {
    result.reason =
      sentinel === '<PRESENT>'
        ? `Expected entry to be present, but it was absent`
        : `Expected entry to be absent, but it was present`;
  }
  return result;
}

function missingEntryResult(path: string, key: string): AssertionResult {
  return {
    path,
    matcher: 'sentinel' as unknown as AssertionResult['matcher'],
    expected: '<PRESENT>',
    actual: '<ABSENT>',
    passed: false,
    reason: `Cannot assert sub-fields on missing entry "${key}"`,
  };
}

/* ------------------------------------------------------------------ */
/* Per-block walkers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Reverse-lookup the matched shape-sentence id for a (slot, interpretive_text)
 * pair. Returns the id if a unique entry matches; null when interpretive_text
 * is null (token fallback fired) or when no entry matches.
 */
function resolveMatchedId(
  slot: SlotName,
  interpretive_text: string | null,
): string | null {
  if (interpretive_text === null) return null;
  // Literal match first (fast path for non-interpolated sentences).
  const literal = shapeSentences.find(
    (s) => s.slot === slot && s.sentence === interpretive_text,
  );
  if (literal !== undefined) return literal.id;
  // Template match: library entries containing {placeholder} tokens. Convert
  // to a regex by escaping non-placeholder text and replacing each token with
  // a non-greedy capture. Matches against the actual interpolated text.
  for (const s of shapeSentences) {
    if (s.slot !== slot) continue;
    if (!s.sentence.includes('{')) continue;
    const pattern =
      '^' +
      s.sentence
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\{[^}]+\\\}/g, '.+?') +
      '$';
    if (new RegExp(pattern).test(interpretive_text)) return s.id;
  }
  return null;
}

function walkSlotContent(
  basePath: string,
  expected: ExpectedSlotContentAssertions,
  actual: { interpretive_text: string | null; token_text: string } | undefined,
  results: AssertionResult[],
  slotName?: SlotName,
): void {
  for (const field of Object.keys(expected)) {
    const fieldExpected = (expected as Record<string, unknown>)[field];
    if (field === 'matched_id') {
      // Resolve via reverse-lookup against the shape-sentence library.
      const actualId =
        slotName !== undefined && actual !== undefined
          ? resolveMatchedId(slotName, actual.interpretive_text)
          : undefined;
      results.push(
        applyMatcher(joinPath(basePath, field), fieldExpected, actualId),
      );
      continue;
    }
    const fieldActual = actual
      ? (actual as unknown as Record<string, unknown>)[field]
      : undefined;
    results.push(applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual));
  }
}

function walkHeadline(
  expected: ExpectedHeadlineAssertions,
  actual: RenderingInstructions['headline'],
  results: AssertionResult[],
): void {
  for (const field of Object.keys(expected)) {
    const fieldExpected = (expected as Record<string, unknown>)[field];
    const fieldActual = (actual as unknown as Record<string, unknown>)[field];
    results.push(
      applyMatcher(joinPath('headline', field), fieldExpected, fieldActual),
    );
  }
}

function walkDirectionCards(
  expected: { [k: string]: ExpectedDirectionCardAssertions },
  actual: RenderingInstructions['direction_cards'],
  results: AssertionResult[],
): void {
  for (const key of Object.keys(expected)) {
    const cardExpected = expected[key]!;
    const cardActual = actual.find((c) => c.direction_engine_name === key);
    const basePath = `direction_cards.${key}`;
    if (cardActual === undefined) {
      results.push(missingEntryResult(basePath, key));
      continue;
    }
    for (const field of Object.keys(cardExpected)) {
      const fieldExpected = (cardExpected as Record<string, unknown>)[field];
      if (
        field === 'summary' ||
        field === 'meaning_sentence' ||
        field === 'expression_space_caption'
      ) {
        const slotName: SlotName | undefined =
          field === 'summary'
            ? 'direction_card_summary'
            : field === 'expression_space_caption'
              ? 'expression_space_caption'
              : undefined; // meaning_sentence is built from recognition_sentences (not the shape library)
        walkSlotContent(
          joinPath(basePath, field),
          fieldExpected as ExpectedSlotContentAssertions,
          (cardActual as unknown as Record<string, { interpretive_text: string | null; token_text: string }>)[field],
          results,
          slotName,
        );
      } else {
        const fieldActual = (cardActual as unknown as Record<string, unknown>)[field];
        results.push(
          applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual),
        );
      }
    }
  }
}

function walkChartBubbles(
  expected: { [k: string]: ExpectedChartBubbleAssertions },
  actual: RenderingInstructions['direction_evidence_chart']['bubbles'],
  results: AssertionResult[],
): void {
  for (const key of Object.keys(expected)) {
    const bubbleExpected = expected[key]!;
    const bubbleActual = actual.find((b) => b.direction_engine_name === key);
    const basePath = `direction_evidence_chart.bubbles.${key}`;
    if (bubbleActual === undefined) {
      results.push(missingEntryResult(basePath, key));
      continue;
    }
    for (const field of Object.keys(bubbleExpected)) {
      const fieldExpected = (bubbleExpected as Record<string, unknown>)[field];
      const fieldActual = (bubbleActual as unknown as Record<string, unknown>)[
        field
      ];
      results.push(
        applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual),
      );
    }
  }
}

function walkDomainsPanel(
  expected: ExpectedDomainsPanelAssertions,
  actual: RenderingInstructions['domains_panel'],
  results: AssertionResult[],
): void {
  if (expected.summary !== undefined) {
    walkSlotContent('domains_panel.summary', expected.summary, actual.summary, results);
  }
  if (expected.intact_callout !== undefined) {
    walkSlotContent(
      'domains_panel.intact_callout',
      expected.intact_callout,
      actual.intact_callout,
      results,
    );
  }
  if (expected.reduced_groups !== undefined) {
    for (const valueKey of Object.keys(expected.reduced_groups)) {
      const groupExpected = expected.reduced_groups[valueKey]!;
      const groupActual = actual.reduced_groups.find(
        (g) => g.value_engine_name === valueKey,
      );
      const basePath = `domains_panel.reduced_groups.${valueKey}`;
      if (groupActual === undefined) {
        results.push(missingEntryResult(basePath, valueKey));
        continue;
      }
      for (const field of Object.keys(groupExpected)) {
        const fieldExpected = (groupExpected as Record<string, unknown>)[field];
        const fieldActual = (groupActual as unknown as Record<string, unknown>)[
          field
        ];
        results.push(
          applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual),
        );
      }
    }
  }
}

function walkConstraintsPanel(
  expected: ExpectedConstraintsPanelAssertions,
  actual: RenderingInstructions['constraints_panel'],
  results: AssertionResult[],
): void {
  if (expected.summary !== undefined) {
    walkSlotContent(
      'constraints_panel.summary',
      expected.summary,
      actual.summary,
      results,
    );
  }
  if (expected.intact_callout !== undefined) {
    walkSlotContent(
      'constraints_panel.intact_callout',
      expected.intact_callout,
      actual.intact_callout,
      results,
    );
  }
  if (
    Object.prototype.hasOwnProperty.call(expected, 'sustained_constraint_intensity')
  ) {
    results.push(
      applyMatcher(
        'constraints_panel.sustained_constraint_intensity',
        expected.sustained_constraint_intensity,
        actual.sustained_constraint_intensity,
      ),
    );
  }
  if (expected.permission_sub_shape_text !== undefined) {
    const psst = expected.permission_sub_shape_text;
    const path = 'constraints_panel.permission_sub_shape_text';
    if (isSentinel(psst)) {
      results.push(applyLeafSentinel(path, psst, actual.permission_sub_shape_text));
    } else {
      walkSlotContent(
        path,
        psst,
        actual.permission_sub_shape_text ?? undefined,
        results,
      );
    }
  }
  if (expected.constraint_lines !== undefined) {
    for (const key of Object.keys(expected.constraint_lines)) {
      const lineExpected = expected.constraint_lines[key]!;
      const lineActual = actual.constraint_lines.find(
        (l) => l.constraint_engine_name === key,
      );
      const basePath = `constraints_panel.constraint_lines.${key}`;
      if (isSentinel(lineExpected)) {
        if (lineExpected === '<PRESENT>' || lineExpected === '<ABSENT>') {
          results.push(
            membershipResult(basePath, lineExpected, lineActual !== undefined),
          );
        } else {
          results.push(applyLeafSentinel(basePath, lineExpected, lineActual));
        }
        continue;
      }
      if (lineActual === undefined) {
        results.push(missingEntryResult(basePath, key));
        continue;
      }
      const subExpected = lineExpected as ExpectedConstraintLineAssertions;
      for (const field of Object.keys(subExpected)) {
        const fieldExpected = (subExpected as Record<string, unknown>)[field];
        const fieldActual = (lineActual as unknown as Record<string, unknown>)[
          field
        ];
        results.push(
          applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual),
        );
      }
    }
  }
}

function walkCrossCuttingPanel(
  expected: ExpectedCrossCuttingPanelAssertions,
  actual: RenderingInstructions['cross_cutting_panel'],
  results: AssertionResult[],
): void {
  if (expected.outputs === undefined) return;
  for (const key of Object.keys(expected.outputs)) {
    const fieldExpected = expected.outputs[key];
    const entry = actual.outputs.find((o) => o.output_engine_name === key);
    const basePath = `cross_cutting_panel.outputs.${key}`;
    const fieldActual = entry?.fires;
    results.push(applyMatcher(basePath, fieldExpected, fieldActual));
  }
}

function walkClosingLines(
  expected: ExpectedClosingLinesAssertions,
  actual: RenderingInstructions['closing_lines'],
  results: AssertionResult[],
): void {
  for (const key of Object.keys(expected)) {
    const lineExpected = expected[key]!;
    const lineActual = actual.find((l) => l.id === key);
    const basePath = `closing_lines.${key}`;
    if (isSentinel(lineExpected)) {
      if (lineExpected === '<PRESENT>' || lineExpected === '<ABSENT>') {
        results.push(
          membershipResult(basePath, lineExpected, lineActual !== undefined),
        );
      } else {
        results.push(applyLeafSentinel(basePath, lineExpected, lineActual));
      }
      continue;
    }
    if (lineActual === undefined) {
      results.push(missingEntryResult(basePath, key));
      continue;
    }
    const subExpected = lineExpected as ExpectedClosingLineAssertions;
    for (const field of Object.keys(subExpected)) {
      const fieldExpected = (subExpected as Record<string, unknown>)[field];
      if (field === 'text') {
        walkSlotContent(
          joinPath(basePath, field),
          fieldExpected as ExpectedSlotContentAssertions,
          lineActual.text,
          results,
        );
      } else {
        const fieldActual = (lineActual as unknown as Record<string, unknown>)[
          field
        ];
        results.push(
          applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual),
        );
      }
    }
  }
}

function walkExperienceCandidates(
  expected: ExpectedExperienceCandidatesAssertions,
  actual: RenderingInstructions['experience_candidate_directions'],
  results: AssertionResult[],
): void {
  for (const key of Object.keys(expected)) {
    const candExpected = expected[key]!;
    const candActual = actual.find((c) => c.direction_engine_name === key);
    const basePath = `experience_candidate_directions.${key}`;
    if (isSentinel(candExpected)) {
      if (candExpected === '<PRESENT>' || candExpected === '<ABSENT>') {
        results.push(
          membershipResult(basePath, candExpected, candActual !== undefined),
        );
      } else {
        results.push(applyLeafSentinel(basePath, candExpected, candActual));
      }
      continue;
    }
    if (candActual === undefined) {
      results.push(missingEntryResult(basePath, key));
      continue;
    }
    const subExpected = candExpected as ExpectedExperienceCandidateAssertions;
    for (const field of Object.keys(subExpected)) {
      const fieldExpected = (subExpected as Record<string, unknown>)[field];
      const fieldActual = (candActual as unknown as Record<string, unknown>)[
        field
      ];
      results.push(
        applyMatcher(joinPath(basePath, field), fieldExpected, fieldActual),
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* §5.11 life_texture_panel                                            */
/* ------------------------------------------------------------------ */

function walkLifeTexturePanel(
  expected: ExpectedLifeTexturePanelAssertions,
  actual: RenderingInstructions['life_texture_panel'],
  results: AssertionResult[],
): void {
  if (expected.summary !== undefined) {
    walkSlotContent(
      'life_texture_panel.summary',
      expected.summary,
      actual.summary,
      results,
      'life_texture_summary',
    );
  }
  if (expected.pattern_note !== undefined) {
    walkSlotContent(
      'life_texture_panel.pattern_note',
      expected.pattern_note,
      actual.pattern_note,
      results,
      'life_texture_pattern_note',
    );
  }
  for (const field of ['band_label', 'flags_present', 'flags_absent', 'load_state_label'] as const) {
    if ((expected as Record<string, unknown>)[field] !== undefined) {
      results.push(
        applyMatcher(
          `life_texture_panel.${field}`,
          (expected as Record<string, unknown>)[field],
          (actual as unknown as Record<string, unknown>)[field],
        ),
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* §5.12 life_context_panel                                            */
/* ------------------------------------------------------------------ */

function walkLifeContextPanel(
  expected: ExpectedLifeContextPanelAssertions,
  actual: RenderingInstructions['life_context_panel'],
  results: AssertionResult[],
): void {
  const slotMap: Record<keyof ExpectedLifeContextPanelAssertions, SlotName> = {
    life_stage_summary: 'life_stage_summary',
    work_load_summary: 'work_load_summary',
    sociality_summary: 'sociality_summary',
  };
  for (const field of Object.keys(slotMap) as Array<keyof typeof slotMap>) {
    if (expected[field] !== undefined) {
      walkSlotContent(
        `life_context_panel.${field}`,
        expected[field]!,
        actual[field],
        results,
        slotMap[field],
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* §5.10 comparison_surface_panel                                       */
/* ------------------------------------------------------------------ */

function walkComparisonItem(
  basePath: string,
  expected: ExpectedComparisonItemAssertion,
  actual: { source: string; reference: Record<string, unknown>; sentence: { interpretive_text: string | null; token_text: string } } | undefined,
  results: AssertionResult[],
): void {
  if (actual === undefined) {
    results.push(missingEntryResult(basePath, basePath));
    return;
  }
  if (expected.source !== undefined) {
    results.push(
      applyMatcher(joinPath(basePath, 'source'), expected.source, actual.source),
    );
  }
  if (expected.reference !== undefined) {
    for (const field of Object.keys(expected.reference)) {
      const fieldExpected = (expected.reference as Record<string, unknown>)[
        field
      ];
      const fieldActual = actual.reference[field];
      results.push(
        applyMatcher(
          joinPath(joinPath(basePath, 'reference'), field),
          fieldExpected,
          fieldActual,
        ),
      );
    }
  }
  if (expected.sentence !== undefined) {
    walkSlotContent(
      joinPath(basePath, 'sentence'),
      expected.sentence,
      actual.sentence,
      results,
      // Comparison-item sentences are composed inline in comparison_surface.ts
      // (§7.9 templates), not from shapeSentences — matched_id resolution is
      // not supported here. Asserting matched_id on a comparison item will
      // record an actual of `null` (the resolveMatchedId fallback for an
      // unknown slot context), which will fail loudly if attempted.
      undefined,
    );
  }
}

function walkComparisonSection(
  basePath: string,
  expected: ExpectedComparisonItemAssertion[],
  actual: ReadonlyArray<{ source: string; reference: Record<string, unknown>; sentence: { interpretive_text: string | null; token_text: string } }>,
  results: AssertionResult[],
): void {
  for (let i = 0; i < expected.length; i++) {
    walkComparisonItem(
      `${basePath}[${i}]`,
      expected[i]!,
      actual[i],
      results,
    );
  }
}

function walkComparisonSurfacePanel(
  expected: ExpectedComparisonSurfacePanelAssertions | SentinelMatcher,
  actual: RenderingInstructions['comparison_surface_panel'],
  results: AssertionResult[],
): void {
  // Sentinel form: <NULL> asserts the panel is null per §5.10 nullability.
  if (isSentinel(expected)) {
    results.push(applyLeafSentinel('comparison_surface_panel', expected, actual));
    return;
  }
  // Structured form: panel must be non-null to walk.
  if (actual === null) {
    results.push({
      path: 'comparison_surface_panel',
      matcher: 'exact',
      expected: '<NON_NULL panel>',
      actual: null,
      passed: false,
      reason: 'Expected non-null comparison_surface_panel for structured assertions, got null',
    });
    return;
  }
  if (expected.summary !== undefined) {
    // Summary uses inline dispatch; matched_id NOT resolvable via shape
    // library. Authors should assert summary_id (panel-level field) instead.
    walkSlotContent(
      'comparison_surface_panel.summary',
      expected.summary,
      actual.summary,
      results,
      undefined,
    );
  }
  if (expected.summary_id !== undefined) {
    results.push(
      applyMatcher(
        'comparison_surface_panel.summary_id',
        expected.summary_id,
        actual.summary_id,
      ),
    );
  }
  for (const section of ['confirmed', 'quiet', 'surfaced'] as const) {
    if (expected[section] !== undefined) {
      walkComparisonSection(
        `comparison_surface_panel.${section}`,
        expected[section]!,
        actual[section] as unknown as ReadonlyArray<{ source: string; reference: Record<string, unknown>; sentence: { interpretive_text: string | null; token_text: string } }>,
        results,
      );
    }
    const countKey = `${section}_count` as
      | 'confirmed_count'
      | 'quiet_count'
      | 'surfaced_count';
    if ((expected as Record<string, unknown>)[countKey] !== undefined) {
      results.push(
        applyMatcher(
          `comparison_surface_panel.${countKey}`,
          (expected as Record<string, unknown>)[countKey],
          actual[section].length,
        ),
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Public surface                                                      */
/* ------------------------------------------------------------------ */

export function runSynthesisAssertions(
  expected: ExpectedSynthesisAssertions,
  actual: RenderingInstructions,
): AssertionRunResult {
  const results: AssertionResult[] = [];

  // 1. headline
  if (expected.headline !== undefined) {
    walkHeadline(expected.headline, actual.headline, results);
  }

  // 2. recognition_paragraph
  if (expected.recognition_paragraph !== undefined) {
    walkSlotContent(
      'recognition_paragraph',
      expected.recognition_paragraph,
      actual.recognition_paragraph,
      results,
    );
  }

  // 3. pattern_paragraph
  if (expected.pattern_paragraph !== undefined) {
    walkSlotContent(
      'pattern_paragraph',
      expected.pattern_paragraph,
      actual.pattern_paragraph,
      results,
      'pattern_paragraph',
    );
  }

  // 4. direction_cards
  if (expected.direction_cards !== undefined) {
    walkDirectionCards(expected.direction_cards, actual.direction_cards, results);
  }

  // 5. direction_evidence_chart
  if (expected.direction_evidence_chart !== undefined) {
    const chartExp = expected.direction_evidence_chart;
    if (chartExp.bubbles !== undefined) {
      walkChartBubbles(
        chartExp.bubbles,
        actual.direction_evidence_chart.bubbles,
        results,
      );
    }
    if (chartExp.caption !== undefined) {
      walkSlotContent(
        'direction_evidence_chart.caption',
        chartExp.caption,
        actual.direction_evidence_chart.caption,
        results,
      );
    }
  }

  // 6. domains_panel
  if (expected.domains_panel !== undefined) {
    walkDomainsPanel(expected.domains_panel, actual.domains_panel, results);
  }

  // 7. constraints_panel
  if (expected.constraints_panel !== undefined) {
    walkConstraintsPanel(
      expected.constraints_panel,
      actual.constraints_panel,
      results,
    );
  }

  // 8. cross_cutting_panel
  if (expected.cross_cutting_panel !== undefined) {
    walkCrossCuttingPanel(
      expected.cross_cutting_panel,
      actual.cross_cutting_panel,
      results,
    );
  }

  // 9. closing_lines
  if (expected.closing_lines !== undefined) {
    walkClosingLines(expected.closing_lines, actual.closing_lines, results);
  }

  // 10. experience_candidate_directions
  if (expected.experience_candidate_directions !== undefined) {
    walkExperienceCandidates(
      expected.experience_candidate_directions,
      actual.experience_candidate_directions,
      results,
    );
  }

  // 11. life_texture_panel (§5.11)
  if (expected.life_texture_panel !== undefined) {
    walkLifeTexturePanel(
      expected.life_texture_panel,
      actual.life_texture_panel,
      results,
    );
  }

  // 12. life_context_panel (§5.12)
  if (expected.life_context_panel !== undefined) {
    walkLifeContextPanel(
      expected.life_context_panel,
      actual.life_context_panel,
      results,
    );
  }

  // 13. comparison_surface_panel (§5.10)
  if (expected.comparison_surface_panel !== undefined) {
    walkComparisonSurfacePanel(
      expected.comparison_surface_panel,
      actual.comparison_surface_panel,
      results,
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  return { results, passed, failed: total - passed, total };
}

export function formatSynthesisFailures(result: AssertionRunResult): string {
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
