// Token tables and display name lookups. Sourced verbatim from SYNTHESIS.md sections 6.1-6.7 and 6.9. The three band lookups (pullBand, feltCostBand, sciBand) are tiny pure functions because their underlying spec definitions are value-range tables, not key tables — keeping them here preserves the principle that token logic lives in one file.

import type {
  DirectionName,
  DomainName,
  QuadrantValue,
  PullQualityValue,
  DomainPresenceValue,
  EnergyBand,
  TimeBand,
  BodyBand,
  PermissionBand,
  LifeTextureBand,
  LifeStageValue,
  PaidWorkRelationshipValue,
  PrimaryLoadValue,
  SocialityValue,
  WeekShapeFlags,
} from '../../engine';

/* ------------------------------------------------------------------ */
/* 6.1 — Direction display names                                      */
/* ------------------------------------------------------------------ */

export const DIRECTION_DISPLAY_NAMES: Record<DirectionName, string> = {
  creator: 'Creator',
  freedom_designer: 'Freedom Designer',
  experience_seeker: 'Experience Seeker',
  relationship_rebuilder: 'Relationship Rebuilder',
  growth_focused: 'Growth Focused',
  contributor: 'Contributor',
};

/* ------------------------------------------------------------------ */
/* 6.2.1 — Pull bands                                                 */
/* ------------------------------------------------------------------ */

export function pullBand(
  value: number,
): 'low' | 'moderate' | 'present' | 'strong' {
  if (value <= 29) return 'low';
  if (value <= 49) return 'moderate';
  if (value <= 69) return 'present';
  return 'strong';
}

/* ------------------------------------------------------------------ */
/* 6.2.2 — Past presence tokens                                       */
/* ------------------------------------------------------------------ */

export const PAST_PRESENCE_TOKENS: Record<'yes' | 'no', string> = {
  yes: 'present',
  no: 'absent',
};

/* ------------------------------------------------------------------ */
/* 6.2.3 — Felt cost bands                                            */
/* ------------------------------------------------------------------ */

export function feltCostBand(value: number): 'low' | 'moderate' | 'high' {
  if (value <= 29) return 'low';
  if (value <= 59) return 'moderate';
  return 'high';
}

/* ------------------------------------------------------------------ */
/* 6.2.4 — Anticipation tokens                                        */
/* ------------------------------------------------------------------ */

export const ANTICIPATION_TOKENS: Record<
  'none' | 'mild' | 'quickening',
  string
> = {
  none: 'none',
  mild: 'mild',
  quickening: 'quickening',
};

/* ------------------------------------------------------------------ */
/* 6.2.5 — Quality composite tokens                                   */
/* ------------------------------------------------------------------ */

export const PULL_QUALITY_TOKENS: Record<PullQualityValue, string> = {
  real: 'real',
  suppressed: 'suppressed',
  phantom: 'desired direction',
  phantom_partial: 'desired direction (partial evidence)',
  saturated: 'soured',
  behaviourally_divergent: 'stated but moving elsewhere',
  ghost: 'ghost',
};

export const EMPTY_PULL_QUALITY_TOKEN: string = 'not yet reading as a pull';

export const QUADRANT_TOKENS: Record<QuadrantValue, string> = {
  active: 'active',
  blocked: 'blocked',
  habit: 'habit',
  quiet: 'quiet',
};

/* ------------------------------------------------------------------ */
/* 6.2.6 — Plain quality rendering (Tier 2 simplified status line)     */
/* ------------------------------------------------------------------ */

/**
 * Plain rendering of pull quality for simplified card status line.
 * Returns the first quality in plain form; multiple qualities are rare
 * and the first is always the primary signal.
 */
export function plainQualityRender(quality: PullQualityValue): string {
  switch (quality) {
    case 'real':
      return 'real';
    case 'suppressed':
      return 'pushed down';
    case 'saturated':
      return 'gone stale';
    case 'behaviourally_divergent':
      return 'named, not lived';
    case 'phantom':
      return 'wanted, never had';
    case 'phantom_partial':
      return 'wanted, never had';
    case 'ghost':
      return 'ghost';
  }
}

/* ------------------------------------------------------------------ */
/* 6.3 — Constraint band tokens and display names                     */
/* ------------------------------------------------------------------ */

export const CONSTRAINT_BAND_TOKENS: {
  energy: Record<EnergyBand, string>;
  time: Record<TimeBand, string>;
  body_capacity: Record<BodyBand, string>;
  permission: Record<PermissionBand, string>;
} = {
  energy: {
    full: 'full',
    moderate: 'moderate',
    heavy_depletion: 'heavy depletion',
  },
  time: {
    open: 'open',
    moderate: 'moderate',
    heavy_time_pressure: 'heavy time pressure',
  },
  body_capacity: {
    full: 'full',
    shifted: 'shifted',
    limited: 'limited',
  },
  permission: {
    present: 'present',
    partial: 'partial',
    blocked: 'blocked',
  },
};

export const CONSTRAINT_DISPLAY_NAMES: {
  energy: string;
  time: string;
  body_capacity: string;
  permission: string;
} = {
  energy: 'Energy',
  time: 'Time',
  body_capacity: 'Body',
  permission: 'Permission',
};

/* ------------------------------------------------------------------ */
/* 6.4 — Domain value display labels                                  */
/* ------------------------------------------------------------------ */

export const DOMAIN_VALUE_LABELS: Record<DomainPresenceValue, string> = {
  intact: 'Intact',
  reduced_wants_back: 'Reduced, wants back',
  reduced_at_peace: 'Reduced, at peace',
  wants_but_never_had: 'Wants but never had',
  never_been_part_of_his_life: 'Never been part of life',
};

/* ------------------------------------------------------------------ */
/* 6.5 — Domain display names                                         */
/* ------------------------------------------------------------------ */

export const DOMAIN_DISPLAY_NAMES: Record<DomainName, string> = {
  time_as_yours: 'Time as yours',
  energy_as_resource: 'Energy as resource',
  felt_aliveness: 'Felt aliveness',
  body_physical_aliveness: 'Body',
  curiosity: 'Curiosity',
  making: 'Making',
  conversation_depth: 'Conversation depth',
  being_known: 'Being known',
  friendship: 'Friendship',
  intimacy: 'Intimacy',
  mattering: 'Mattering',
  spiritual: 'Spiritual',
};

/* ------------------------------------------------------------------ */
/* 6.6 — Sustained constraint intensity bands                         */
/* ------------------------------------------------------------------ */

export function sciBand(
  sci: number,
  lifeShapeDuration: 'recent' | 'sustained' | 'long',
): string {
  if (sci <= 39) return 'low';
  if (sci <= 59) return 'moderate';
  if (sci <= 69) return 'heavy';
  return lifeShapeDuration === 'long' ? 'heavy and long-running' : 'heavy';
}

/* ------------------------------------------------------------------ */
/* 6.7 — Direction-to-TypeKey mapping                                 */
/* ------------------------------------------------------------------ */

export const DIRECTION_TO_TYPE_KEY: Record<DirectionName, string> = {
  creator: 'creator',
  freedom_designer: 'freedom_designer',
  experience_seeker: 'experience_seeker',
  relationship_rebuilder: 'relationship_rebuilder',
  growth_focused: 'growth_focused',
  contributor: 'contributor',
};

/* ------------------------------------------------------------------ */
/* 6.9 — Engine direction lowercase form                              */
/* ------------------------------------------------------------------ */

export const DIRECTION_LOWERCASE_FORM: Record<DirectionName, string> = {
  creator: 'making',
  freedom_designer: 'freedom',
  experience_seeker: 'experience',
  relationship_rebuilder: 'relationship',
  growth_focused: 'growth',
  contributor: 'contribution',
};

/* ------------------------------------------------------------------ */
/* 6.13 — life_texture_band display labels                            */
/* ------------------------------------------------------------------ */

export const LIFE_TEXTURE_BAND_LABELS: Record<LifeTextureBand, string> = {
  empty: 'Empty',
  depleted: 'Depleted',
  mixed: 'Mixed',
  textured: 'Textured',
};

/* ------------------------------------------------------------------ */
/* 6.14 — Load state composition label                                */
/* ------------------------------------------------------------------ */

export function loadStateLabel(
  workDominates: boolean,
  weekendsConsumed: boolean,
): string {
  if (workDominates && weekendsConsumed) return 'Loaded (work and weekends)';
  if (workDominates) return 'Loaded (work)';
  if (weekendsConsumed) return 'Loaded (weekends)';
  return 'Uncluttered';
}

/* ------------------------------------------------------------------ */
/* 6.15 — Week_shape flag display labels                              */
/* ------------------------------------------------------------------ */

export const WEEK_SHAPE_FLAG_LABELS: Record<keyof WeekShapeFlags, string> = {
  work_dominates: 'Work dominates',
  weekends_consumed: 'Weekends consumed',
  weekly_activity: 'Weekly activity',
  sees_people: 'Sees people',
  makes_things: 'Makes things',
  active_body: 'Active body',
  belongs_to_group: 'Belongs to a group',
  solo_practice: 'Solo practice',
  varied_week: 'Varied week',
};

/**
 * §5.11 — contents flags enumerated on `life_texture_panel.flags_present` and
 * `flags_absent`. The six contents flags exclude load flags (work_dominates,
 * weekends_consumed; covered by load_state_label) and the pattern flag
 * (varied_week; covered by pattern_note).
 */
export const WEEK_SHAPE_CONTENTS_FLAGS: ReadonlyArray<keyof WeekShapeFlags> = [
  'weekly_activity',
  'sees_people',
  'makes_things',
  'active_body',
  'belongs_to_group',
  'solo_practice',
];

/* ------------------------------------------------------------------ */
/* 6.16 — life_stage display labels                                   */
/* ------------------------------------------------------------------ */

export const LIFE_STAGE_LABELS: Record<LifeStageValue, string> = {
  building: 'Building',
  consolidating: 'Consolidating',
  re_evaluating: 'Re-evaluating',
  transitioning: 'Transitioning',
  settled: 'Settled',
  drifting: 'Drifting',
  enduring: 'Enduring',
};

/* ------------------------------------------------------------------ */
/* 6.17 — paid_work_relationship display labels                       */
/* ------------------------------------------------------------------ */

export const PAID_WORK_RELATIONSHIP_LABELS: Record<
  PaidWorkRelationshipValue,
  string
> = {
  defining: 'Defining',
  consuming: 'Consuming',
  functional: 'Functional',
  peripheral: 'Peripheral',
  between: 'Between',
  chosen: 'Chosen',
  endured: 'Endured',
};

/* ------------------------------------------------------------------ */
/* 6.18 — primary_load display labels                                 */
/* ------------------------------------------------------------------ */

export const PRIMARY_LOAD_LABELS: Record<PrimaryLoadValue, string> = {
  paid_work: 'Paid work',
  caregiving: 'Caregiving',
  household_admin: 'Household admin',
  none: 'None',
};

/* ------------------------------------------------------------------ */
/* 6.19 — sociality_default display labels                            */
/* ------------------------------------------------------------------ */

export const SOCIALITY_LABELS: Record<SocialityValue, string> = {
  solitary_by_default: 'Solitary by default',
  balanced: 'Balanced',
  social_by_default: 'Social by default',
};

/* ------------------------------------------------------------------ */
/* 6.20 (v4) — Narrowing band display names                           */
/* ------------------------------------------------------------------ */

/**
 * v4 narrowing band display names per SYNTHESIS_V4.md §6.21. Array preserves
 * engine declaration order (ENGINE_V4.md §4.6). Each entry provides both the
 * band_field identifier (for TheNarrowingsPanel.bands[].band_field) and the
 * man-facing display_name (for TheNarrowingsPanel.bands[].display_name).
 */
export const NARROWING_BAND_METADATA: ReadonlyArray<{
  engine_field: string;
  band_field: 'structural' | 'experiential' | 'psychological' | 'identity' | 'energetic' | 'relational' | 'attention';
  display_name: string;
  full_name: string;
  character_name: string;
}> = [
  { engine_field: 'structural_narrowing_band', band_field: 'structural', display_name: 'Structural', full_name: 'Structural Narrowing', character_name: 'The Yes Man' },
  { engine_field: 'experiential_narrowing_band', band_field: 'experiential', display_name: 'Experiential', full_name: 'Experiential Narrowing', character_name: 'The Shrunk Man' },
  { engine_field: 'psychological_narrowing_band', band_field: 'psychological', display_name: 'Psychological', full_name: 'Psychological Narrowing', character_name: 'The Reasonable Man' },
  { engine_field: 'identity_narrowing_band', band_field: 'identity', display_name: 'Identity', full_name: 'Identity Narrowing', character_name: 'The Cast Man' },
  { engine_field: 'energetic_narrowing_band', band_field: 'energetic', display_name: 'Energetic', full_name: 'Energetic Narrowing', character_name: 'The Dimmed Man' },
  { engine_field: 'relational_narrowing_band', band_field: 'relational', display_name: 'Relational', full_name: 'Relational Narrowing', character_name: 'The Stranger' },
  { engine_field: 'attention_narrowing_band', band_field: 'attention', display_name: 'Attention', full_name: 'Attention Narrowing', character_name: 'The Surface Man' },
];

/* ------------------------------------------------------------------ */
/* 6.21 — Week_shape flag absence phrasing (§7.9 Surfaced templates)  */
/* ------------------------------------------------------------------ */

export const WEEK_SHAPE_FLAG_ABSENCE_PHRASING: Record<
  keyof WeekShapeFlags,
  string
> = {
  belongs_to_group: 'no group belonging',
  sees_people: 'no regular in-person contact',
  makes_things: 'no regular making',
  active_body: 'no body in motion',
  weekly_activity: 'no recurring weekly thing',
  solo_practice: 'no chosen solo practice',
  varied_week: 'weeks running the same',
  // Load flags are not candidates for Surfaced (§5.10.2); phrasings for
  // completeness / future use.
  work_dominates: 'work dominates the week',
  weekends_consumed: 'weekends consumed',
};
