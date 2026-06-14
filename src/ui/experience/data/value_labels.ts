// Centralised facet-value display-label lookup. Single source of truth for
// the strings shown to the man for any (facet, raw value) pair: filter
// sidebar, active-filter chips, card badges, drawer panels.
//
// Direction display names mirror DIRECTION_DISPLAY_NAMES in
// src/synthesis/data/tokens.ts verbatim. Other facets read keyed copy
// (e.g. `context_with_young_family` → "With young family") from
// experienceCopy. Any value missing a copy entry falls back to a
// human-readable form (underscores → spaces, leading capital).
//
// The `interest_domain` facet has free-text values (e.g. `lake_district`,
// `food`); they get humanised. When a domain demands a specific label
// (e.g. an acronym), add it to `INTEREST_DOMAIN_OVERRIDES`.

import { experienceCopy } from './static_copy';
import type { FacetKey } from '../filter';

const DIRECTION_LABELS: Record<string, string> = {
  contributor: 'Contributor',
  experience_seeker: 'Experience Seeker',
  freedom_designer: 'Freedom Designer',
  growth_focused: 'Growth Focused',
  creator: 'Creator',
  relationship_rebuilder: 'Relationship Rebuilder',
};

const EXERTION_LABELS: Record<string, string> = {
  '1': 'Lowest',
  '2': 'Low',
  '3': 'Medium',
  '4': 'High',
  '5': 'Highest',
};

// Reserved for future overrides where the humanised form is wrong (e.g.
// acronyms, place names with stylised capitalisation). Empty for now.
const INTEREST_DOMAIN_OVERRIDES: Record<string, string> = {};

type CopyLookup = Record<string, string | undefined>;
const copyLookup = experienceCopy as unknown as CopyLookup;

function humanise(raw: string): string {
  if (raw === '') return raw;
  return raw
    .split('_')
    .map((word) =>
      word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

export function valueLabelFor(facet: FacetKey, value: string): string {
  switch (facet) {
    case 'direction':
      return DIRECTION_LABELS[value] ?? humanise(value);
    case 'protocol':
      return humanise(value);
    case 'exertion':
      return EXERTION_LABELS[value] ?? value;
    case 'cost_tier':
      return copyLookup[`cost_${value}`] ?? humanise(value);
    case 'interest_domain':
      return INTEREST_DOMAIN_OVERRIDES[value] ?? humanise(value);
    case 'status':
      if (value === 'unflagged') return experienceCopy.status_filter_unflagged;
      return copyLookup[`flag_${value}`] ?? humanise(value);
  }
}
