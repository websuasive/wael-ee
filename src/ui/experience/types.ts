// Experience layer local types. Per EXPERIENCE.md sections 7.2 and 12. Engine
// and synthesis types (DirectionName, ConstraintsOutput, RenderingInstructions,
// InputMap) are imported from their canonical sources elsewhere; this module
// only declares types local to the experience layer.
//
// Design rule for inventory schema (E.6):
//
//   Typed fields (enum-valued or boolean) are consumed by algorithms and
//   filter UI. The `tags` array is free-form descriptive: author-driven,
//   searchable later for free-text content discovery, NOT consumed by
//   algorithm or facet filter.
//
//   If a future flag is an algorithmic signal, add a typed field. Don't dump
//   it in `tags`. The E.6 migration promoted `physical` out of tags and into
//   a typed `experience.physical: boolean` field for exactly this reason.

/* ------------------------------------------------------------------ */
/* Status flags: section 7.2                                         */
/* ------------------------------------------------------------------ */

export type Flag = 'saved' | 'booked' | 'done' | 'not_interested';

export interface ExperienceStatus {
  variant_id: string;
  flag: Flag;
  flagged_at: Date;
}

/* ------------------------------------------------------------------ */
/* Inventory schema v3                                               */
/* ------------------------------------------------------------------ */

export type CostTier = 'free' | 'low' | 'medium' | 'high';

export type Protocol =
  | 'stir'
  | 'loophole'
  | 'slip'
  | 'catch'
  | 'trespass'
  | 'aside'
  | 'steeping';

export type Magnitude = 'small' | 'medium' | 'big';

export type WhoWith =
  | 'solo'
  | 'with_young_children'
  | 'with_teenagers'
  | 'with_adult_children'
  | 'with_parents'
  | 'with_partner'
  | 'with_friends';

export type NarrowingTag =
  | 'structural'
  | 'experiential'
  | 'psychological'
  | 'identity'
  | 'energetic'
  | 'relational'
  | 'attention';

export const PROTOCOL_TO_NARROWING: Record<Protocol, NarrowingTag> = {
  stir: 'energetic',
  loophole: 'psychological',
  slip: 'identity',
  catch: 'structural',
  trespass: 'experiential',
  aside: 'relational',
  steeping: 'attention',
};

export interface Variant {
  variant_id: string;
  protocol: Protocol;
  pitch: string;
  instruction: string;
  who_with: WhoWith[];
  magnitude: Magnitude;
  friction: number;
  exertion: number;
}

export interface Activity {
  activity_id: string;
  label: string;
  cost_tier: CostTier;
  websites: string[];
  directions: string[];
  interest_domains: string[];
  novelty_index: number;
  variants: Variant[];
}

export interface ActivityInventoryFile {
  library_version: string;
  activities: Activity[];
}

export interface RecommendableVariant extends Variant {
  activity_id: string;
  label: string;
  cost_tier: CostTier;
  websites: string[];
  directions: string[];
  interest_domains: string[];
  novelty_index: number;
}

/* ------------------------------------------------------------------ */
/* Deprecated v2 types (phase-2 cleanup)                             */
/* ------------------------------------------------------------------ */

/**
 * @deprecated v2 schema. Use Activity and Variant (v3) instead.
 */
export type Friction = 'low' | 'medium' | 'high';

/**
 * @deprecated v2 schema. Removed in v3.
 */
export type Scale = 'micro' | 'day' | 'anchor';

/**
 * @deprecated v2 schema. Use WhoWith (v3) instead.
 */
export type ContextValue =
  | 'solo'
  | 'with_partner'
  | 'with_young_family'
  | 'with_older_family'
  | 'with_parents'
  | 'with_friends';

/**
 * @deprecated v2 schema. Removed in v3.
 */
export type ExperienceType =
  | 'disruption'
  | 'hidden_world'
  | 'expression'
  | 'experiment'
  | 'contact'
  | 'recovery'
  | 'repeatable'
  | 'anchor_experience';


/**
 * @deprecated v2 schema. Use Activity and Variant (v3) instead.
 */
export interface Experience {
  id: string;
  name: string;
  directions: string[];
  friction: Friction;
  scale: Scale;
  cost_tier: CostTier;
  cost_max_gbp: number;
  context: ContextValue[];
  physical: boolean;
  tags: string[];
  narrowings?: NarrowingTag[];
  interest_domains: string[];
  description: string;
  why_it_works: string;
  experience_types: ExperienceType[];
  bookable: boolean;
  seasonal: boolean;
}

/**
 * @deprecated v2 schema. Use ActivityInventoryFile (v3) instead.
 */
export interface ExperienceInventoryFile {
  version: string;
  experiences: Experience[];
}
