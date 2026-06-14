// Comparison surface panel composition. Implements SYNTHESIS.md §5.10
// (Confirmed/Quiet/Surfaced composition, cap of 3, priority ordering) and
// §7.9 item templates (with domain-value dispatch on Confirmed and
// first-item-only suffix on Surfaced).

import type {
  EngineOutput,
  InputMap,
  DirectionName,
  DomainName,
  WeekShapeFlags,
} from '../engine';
import type {
  ComparisonSurfacePanel,
  ComparisonItem,
  ComparisonReference,
  SlotContent,
} from './types';
import {
  SELF_REPORT_ITEMS,
  type SelfReportAnchor,
  type SelfReportItem,
} from './data/self_report_items';
import {
  DIRECTION_DISPLAY_NAMES,
  DOMAIN_DISPLAY_NAMES,
  WEEK_SHAPE_FLAG_ABSENCE_PHRASING,
  CONSTRAINT_DISPLAY_NAMES,
} from './data/tokens';
import { interpolate } from './interpolation';
import { isInFiringSet } from './headline';

/** §6.12 architectural-significance order, contents flags only (load flags
 *  and varied_week excluded per §5.10.2). */
const CONTENTS_FLAGS_SIGNIFICANCE: ReadonlyArray<keyof WeekShapeFlags> = [
  'belongs_to_group',
  'weekly_activity',
  'sees_people',
  'makes_things',
  'solo_practice',
  'active_body',
];

const SURFACED_CAP = 3;

/* ------------------------------------------------------------------ */
/* Anchor firing evaluation (§5.10.1)                                 */
/* ------------------------------------------------------------------ */

type AnchorFire = {
  anchor: SelfReportAnchor;
  /** For domain anchors, the specific domain value at firing time. */
  domain_value?:
    | 'reduced_wants_back'
    | 'reduced_at_peace'
    | 'wants_but_never_had'
    | 'never_been_part_of_his_life';
};

function evaluateAnchor(
  anchor: SelfReportAnchor,
  output: EngineOutput,
): AnchorFire | null {
  if (anchor.kind === 'direction') {
    // §5.10.1 fires when the direction is in the §4 step 1 firing set
    // (pull_quality non-empty OR pull >= 50). This is deliberately
    // narrower than engine `surfaced` and excludes empty habits.
    const d = output.directions.find((x) => x.direction === anchor.name);
    if (d !== undefined && isInFiringSet(d)) return { anchor };
    return null;
  }
  if (anchor.kind === 'domain') {
    const m = output.domains.find((x) => x.domain === anchor.name);
    if (m !== undefined && m.fires && m.value !== 'intact') {
      return { anchor, domain_value: m.value };
    }
    return null;
  }
  if (anchor.kind === 'constraint') {
    if (constraintFires(output, anchor.name)) return { anchor };
    return null;
  }
  // week_shape_flag — absence is the firing condition.
  if (output.cross_direction.week_shape[anchor.name] === false) {
    return { anchor };
  }
  return null;
}

function constraintFires(
  output: EngineOutput,
  name: 'energy' | 'time' | 'body' | 'permission',
): boolean {
  if (name === 'body') return output.constraints.body_capacity.fires;
  if (name === 'energy') return output.constraints.energy.fires;
  if (name === 'time') return output.constraints.time.fires;
  return output.constraints.permission.fires;
}

/* ------------------------------------------------------------------ */
/* §7.9 anchor priority for rendered sentence selection               */
/* ------------------------------------------------------------------ */

function anchorKindPriority(kind: SelfReportAnchor['kind']): number {
  switch (kind) {
    case 'direction':
      return 0;
    case 'domain':
      return 1;
    case 'constraint':
      return 2;
    case 'week_shape_flag':
      return 3;
  }
}

function pickGoverningAnchor(fires: AnchorFire[]): AnchorFire {
  return [...fires].sort(
    (a, b) => anchorKindPriority(a.anchor.kind) - anchorKindPriority(b.anchor.kind),
  )[0]!;
}

/* ------------------------------------------------------------------ */
/* §7.9 sentence templates                                            */
/* ------------------------------------------------------------------ */

function composeConfirmedSentence(
  item: SelfReportItem,
  governing: AnchorFire,
  output: EngineOutput,
): SlotContent {
  const anchor = governing.anchor;
  const item_label = item.label;
  let tpl = '';
  const ctx: Record<string, string> = { item_label };
  if (anchor.kind === 'direction') {
    tpl = '{item_label}. Architecture reads {direction_display} firing.';
    ctx.direction_display = DIRECTION_DISPLAY_NAMES[anchor.name];
  } else if (anchor.kind === 'domain') {
    const v = governing.domain_value;
    if (v === 'wants_but_never_had') {
      tpl =
        '{item_label}. Architecture reads {domain_display} as a want never had.';
    } else if (v === 'never_been_part_of_his_life') {
      tpl =
        '{item_label}. Architecture reads {domain_display} as not part of his life.';
    } else {
      // reduced_wants_back or reduced_at_peace
      tpl = '{item_label}. Architecture reads {domain_display} as reduced.';
    }
    ctx.domain_display = DOMAIN_DISPLAY_NAMES[anchor.name];
    // Suppress unused-var on output when domain branch used.
    void output;
  } else if (anchor.kind === 'constraint') {
    tpl = '{item_label}. Architecture reads {constraint_display} too.';
    const name = anchor.name === 'body' ? 'body_capacity' : anchor.name;
    ctx.constraint_display =
      CONSTRAINT_DISPLAY_NAMES[name as keyof typeof CONSTRAINT_DISPLAY_NAMES];
  } else {
    tpl = '{item_label}. The week reads no {flag_reading}.';
    // Reuse absence phrasing, stripped of its leading "no ".
    const phrasing = WEEK_SHAPE_FLAG_ABSENCE_PHRASING[anchor.name];
    ctx.flag_reading = phrasing.replace(/^no\s+/, '');
  }
  return { interpretive_text: interpolate(tpl, ctx), token_text: '' };
}

function composeQuietSentence(item: SelfReportItem): SlotContent {
  return {
    interpretive_text: interpolate(
      '{item_label}. Architecture reads it as present.',
      { item_label: item.label },
    ),
    token_text: '',
  };
}

type SurfacedCandidate =
  | { reading_type: 'firing_direction'; direction: DirectionName; pull: number }
  | {
      reading_type: 'reduced_domain';
      domain: DomainName;
      current_state: number;
    }
  | { reading_type: 'absent_flag'; flag: keyof WeekShapeFlags };

function composeSurfacedSentence(
  candidate: SurfacedCandidate,
  isFirst: boolean,
): SlotContent {
  let tpl = '';
  const ctx: Record<string, string> = {};
  if (candidate.reading_type === 'firing_direction') {
    tpl = isFirst
      ? 'Architecture reads {direction_display} firing. Not in the named list.'
      : 'Architecture reads {direction_display} firing.';
    ctx.direction_display = DIRECTION_DISPLAY_NAMES[candidate.direction];
  } else if (candidate.reading_type === 'reduced_domain') {
    tpl = isFirst
      ? 'Architecture reads {domain_display} reduced. Not in the named list.'
      : 'Architecture reads {domain_display} reduced.';
    ctx.domain_display = DOMAIN_DISPLAY_NAMES[candidate.domain];
  } else {
    tpl = isFirst
      ? 'Architecture reads {flag_absence_phrasing}. Not in the named list.'
      : 'Architecture reads {flag_absence_phrasing}.';
    ctx.flag_absence_phrasing =
      WEEK_SHAPE_FLAG_ABSENCE_PHRASING[candidate.flag];
  }
  return { interpretive_text: interpolate(tpl, ctx), token_text: '' };
}

/* ------------------------------------------------------------------ */
/* §5.10.2 Surfaced section composition                               */
/* ------------------------------------------------------------------ */

type ExcludedAnchors = {
  directions: Set<DirectionName>;
  domains: Set<DomainName>;
  flags: Set<keyof WeekShapeFlags>;
};

function selectSurfaced(
  output: EngineOutput,
  excluded: ExcludedAnchors,
): SurfacedCandidate[] {
  // §5.10.2 step 1 enumerates over the §4 step 1 firing set, not engine
  // `surfaced`. Empty habits are excluded; quiet pull-quality directions
  // below pull 50 are included.
  const firingDirs: SurfacedCandidate[] = output.directions
    .filter((d) => isInFiringSet(d) && !excluded.directions.has(d.direction))
    .sort(
      (a, b) => b.pull - a.pull || a.direction.localeCompare(b.direction),
    )
    .map((d) => ({
      reading_type: 'firing_direction' as const,
      direction: d.direction,
      pull: d.pull,
    }));
  const reducedDomains: SurfacedCandidate[] = output.domains
    .filter(
      (m) =>
        m.fires &&
        m.value !== 'intact' &&
        m.value !== 'never_been_part_of_his_life' &&
        !excluded.domains.has(m.domain),
    )
    .sort(
      (a, b) =>
        a.current_state - b.current_state || a.domain.localeCompare(b.domain),
    )
    .map((m) => ({
      reading_type: 'reduced_domain' as const,
      domain: m.domain,
      current_state: m.current_state,
    }));
  const absentFlags: SurfacedCandidate[] = CONTENTS_FLAGS_SIGNIFICANCE.filter(
    (f) =>
      output.cross_direction.week_shape[f] === false && !excluded.flags.has(f),
  ).map((flag) => ({ reading_type: 'absent_flag' as const, flag }));

  // Priority fills: P1 ≤ 2, P2 ≤ 2, P3 ≤ 1. Cap 3. Underfill spills to next
  // priority's pool (§5.10.2 step 3).
  const budget = SURFACED_CAP;
  let remaining = budget;
  const picked: SurfacedCandidate[] = [];
  const p1 = firingDirs.slice(0, Math.min(2, remaining));
  picked.push(...p1);
  remaining -= p1.length;
  const p2 = reducedDomains.slice(0, Math.min(2, remaining));
  picked.push(...p2);
  remaining -= p2.length;
  const p3 = absentFlags.slice(0, Math.min(1, remaining));
  picked.push(...p3);
  remaining -= p3.length;

  // Underfill spillover: spec says "if any priority underfills its budget,
  // fill from the next priority's pool." Interpret as: if total < budget,
  // consume extras from lower-priority pools in order.
  if (remaining > 0) {
    const extraP2 = reducedDomains.slice(2);
    const take = Math.min(remaining, extraP2.length);
    picked.push(...extraP2.slice(0, take));
    remaining -= take;
  }
  if (remaining > 0) {
    const extraP3 = absentFlags.slice(1);
    const take = Math.min(remaining, extraP3.length);
    picked.push(...extraP3.slice(0, take));
    remaining -= take;
  }
  if (remaining > 0) {
    const extraP1 = firingDirs.slice(2);
    const take = Math.min(remaining, extraP1.length);
    picked.push(...extraP1.slice(0, take));
    remaining -= take;
  }
  return picked;
}

function makeSurfacedReference(
  c: SurfacedCandidate,
): ComparisonReference {
  if (c.reading_type === 'firing_direction') {
    return {
      kind: 'engine_reading',
      reading_type: 'firing_direction',
      target: c.direction,
    };
  }
  if (c.reading_type === 'reduced_domain') {
    return {
      kind: 'engine_reading',
      reading_type: 'reduced_domain',
      target: c.domain,
    };
  }
  return {
    kind: 'engine_reading',
    reading_type: 'absent_flag',
    target: c.flag,
  };
}

/* ------------------------------------------------------------------ */
/* First pass — Confirmed / Quiet / Surfaced item composition          */
/* ------------------------------------------------------------------ */

export type ComparisonSurfaceItems = {
  confirmed: ComparisonItem[];
  quiet: ComparisonItem[];
  surfaced: ComparisonItem[];
};

/**
 * §5.10.1 + §5.10.2 — item composition. Pure over (EngineOutput, InputMap,
 * self_report items metadata). Does not compose the summary slot; that is
 * the second pass against the built items (see
 * `buildComparisonSurfacePanelSummary`).
 */
export function buildComparisonSurfaceItems(
  output: EngineOutput,
  input: InputMap,
): ComparisonSurfaceItems {
  const named = input.self_report.named_absences;

  const confirmed: ComparisonItem[] = [];
  const quiet: ComparisonItem[] = [];
  const excluded: ExcludedAnchors = {
    directions: new Set<DirectionName>(),
    domains: new Set<DomainName>(),
    flags: new Set<keyof WeekShapeFlags>(),
  };

  for (const id of named) {
    if (id === 'nothing_really') continue;
    const item = SELF_REPORT_ITEMS.find((it) => it.id === id);
    if (item === undefined) continue;

    // Evaluate all anchors; record which fired.
    const fires: AnchorFire[] = [];
    for (const anchor of item.architectural_anchors) {
      const fire = evaluateAnchor(anchor, output);
      if (fire !== null) fires.push(fire);
    }

    // F2 (v2 decision): exclusion from Surfaced is on anchor *membership*
    // in the named item's anchor list, regardless of whether the anchor
    // fired. Supports v2 cross-kind anchor design in §6.11.
    for (const anchor of item.architectural_anchors) {
      if (anchor.kind === 'direction') excluded.directions.add(anchor.name);
      else if (anchor.kind === 'domain') excluded.domains.add(anchor.name);
      else if (anchor.kind === 'week_shape_flag')
        excluded.flags.add(anchor.name);
    }

    const reference: ComparisonReference = {
      kind: 'self_report_item',
      id: item.id,
    };
    if (fires.length > 0) {
      const governing = pickGoverningAnchor(fires);
      confirmed.push({
        sentence: composeConfirmedSentence(item, governing, output),
        source: 'self_report',
        reference,
      });
    } else {
      quiet.push({
        sentence: composeQuietSentence(item),
        source: 'self_report',
        reference,
      });
    }
  }

  const surfacedCandidates = selectSurfaced(output, excluded);
  const surfaced: ComparisonItem[] = surfacedCandidates.map((c, idx) => ({
    sentence: composeSurfacedSentence(c, idx === 0),
    source: 'architecture',
    reference: makeSurfacedReference(c),
  }));

  return { confirmed, quiet, surfaced };
}

/* ------------------------------------------------------------------ */
/* Second pass — §7.10 summary dispatch against composed items         */
/* ------------------------------------------------------------------ */

type ComparisonSummaryId =
  | 'comparison_all_confirmed'
  | 'comparison_all_quiet'
  | 'comparison_confirmed_and_surfaced'
  | 'comparison_surfaced_only_nothing_really'
  | 'comparison_surfaced_only_no_response'
  | 'comparison_mixed';

/** §7.10 sentences, keyed by id. Spec text verbatim. */
const COMPARISON_SUMMARY_SENTENCES: Record<ComparisonSummaryId, string> = {
  comparison_all_confirmed: "What's named reads in the architecture too.",
  comparison_all_quiet: "What's named reads as present in the architecture.",
  comparison_confirmed_and_surfaced:
    "What's named reads in the architecture. Other readings sit alongside.",
  comparison_surfaced_only_nothing_really:
    'Nothing named missing. The architecture reads several things.',
  comparison_surfaced_only_no_response:
    'No self-report entries. The architecture reads several things.',
  comparison_mixed:
    "What's named partly reads in the architecture; some reads as present.",
};

/** §7.10 token fallback. */
const COMPARISON_SUMMARY_TOKEN =
  "What's named and what the architecture reads.";

/** §7.10 first-match-wins predicate dispatch in the spec's table order. */
function resolveSummaryId(
  items: ComparisonSurfaceItems,
  namedAbsences: ReadonlyArray<string>,
): ComparisonSummaryId | null {
  const c = items.confirmed.length;
  const q = items.quiet.length;
  const s = items.surfaced.length;
  if (c >= 1 && q === 0 && s === 0) return 'comparison_all_confirmed';
  if (c === 0 && q >= 1 && s === 0) return 'comparison_all_quiet';
  if (c >= 1 && s >= 1) return 'comparison_confirmed_and_surfaced';
  if (
    s >= 1 &&
    c === 0 &&
    q === 0 &&
    namedAbsences.includes('nothing_really')
  ) {
    return 'comparison_surfaced_only_nothing_really';
  }
  if (s >= 1 && c === 0 && q === 0 && namedAbsences.length === 0) {
    return 'comparison_surfaced_only_no_response';
  }
  if (c >= 1 && q >= 1) return 'comparison_mixed';
  return null;
}

/**
 * §7.10 summary — runs against the composed items + named_absences.
 * Returns both the SlotContent and the stable summary_id for assertion
 * resilience. Token fallback always populated per §5.10.2.
 */
export function buildComparisonSurfacePanelSummary(
  items: ComparisonSurfaceItems,
  namedAbsences: ReadonlyArray<string>,
): { summary: SlotContent; summary_id: string | null } {
  const id = resolveSummaryId(items, namedAbsences);
  const interpretive_text =
    id !== null ? COMPARISON_SUMMARY_SENTENCES[id] : null;
  return {
    summary: { interpretive_text, token_text: COMPARISON_SUMMARY_TOKEN },
    summary_id: id,
  };
}

/* ------------------------------------------------------------------ */
/* Orchestrator — composes items then summary; handles §5.10 null      */
/* ------------------------------------------------------------------ */

export function computeComparisonSurfacePanel(
  output: EngineOutput,
  input: InputMap,
): ComparisonSurfacePanel | null {
  const items = buildComparisonSurfaceItems(output, input);
  const namedAbsences = input.self_report.named_absences;

  // §5.10 / §2.2 panel nullability.
  if (namedAbsences.length === 0 && items.surfaced.length === 0) return null;

  const { summary, summary_id } = buildComparisonSurfacePanelSummary(
    items,
    namedAbsences,
  );
  return {
    summary,
    summary_id,
    confirmed: items.confirmed,
    quiet: items.quiet,
    surfaced: items.surfaced,
  };
}
