// Unit tests for the render-layer foundation utilities and data placeholders.

import { describe, it, expect } from 'vitest';
import { slug } from '@/ui/render/slug';
import { lookupTerm } from '@/ui/render/term_lookup';
import { termIndicatorTargets } from '@/ui/render/term_indicator_targets';
import { staticCopy } from '@/ui/render/static_copy';
import { TERM_EXPLANATIONS } from '@/synthesis/data/term_explanations';

/* ------------------------------------------------------------------ */
/* A — slug                                                            */
/* ------------------------------------------------------------------ */

describe('slug', () => {
  it('Creator → making', () => {
    expect(slug('Creator')).toBe('creator');
  });

  it('Freedom Designer → freedom-designer (spec example)', () => {
    expect(slug('Freedom Designer')).toBe('freedom-designer');
  });

  it('Experience Seeker → experience-seeker', () => {
    expect(slug('Experience Seeker')).toBe('experience-seeker');
  });

  it('Relationship Rebuilder → relationship-rebuilder', () => {
    expect(slug('Relationship Rebuilder')).toBe('relationship-rebuilder');
  });

  it('Growth Focused → growth-focused', () => {
    expect(slug('Growth Focused')).toBe('growth-focused');
  });

  it('Contributor → contribution', () => {
    expect(slug('Contributor')).toBe('contributor');
  });

  it('empty string → empty string', () => {
    expect(slug('')).toBe('');
  });

  it('pure: two calls with identical input return identical output', () => {
    expect(slug('Freedom Designer')).toBe(slug('Freedom Designer'));
  });
});

/* ------------------------------------------------------------------ */
/* B — lookupTerm direct hits                                          */
/* ------------------------------------------------------------------ */

describe('lookupTerm — direct hits', () => {
  it("'capacity strain' returns the entry from TERM_EXPLANATIONS", () => {
    expect(lookupTerm('capacity strain')).toBe(
      TERM_EXPLANATIONS['capacity strain'],
    );
  });

  it("'mattering' returns the entry", () => {
    expect(lookupTerm('mattering')).toBe(TERM_EXPLANATIONS['mattering']);
  });

  it.each(Object.keys(TERM_EXPLANATIONS))(
    'every TERM_EXPLANATIONS key resolves: %s',
    (key) => {
      expect(lookupTerm(key)).toBe(TERM_EXPLANATIONS[key]);
    },
  );
});

/* ------------------------------------------------------------------ */
/* C — lookupTerm parenthetical fallback                              */
/* ------------------------------------------------------------------ */

describe('lookupTerm — parenthetical fallback', () => {
  it("'desired direction (partial evidence)' returns the direct entry, not the stripped fallback", () => {
    expect(lookupTerm('desired direction (partial evidence)')).toBe(
      TERM_EXPLANATIONS['desired direction (partial evidence)'],
    );
  });

  it("'mattering (subjective)' falls back to 'mattering'", () => {
    expect(lookupTerm('mattering (subjective)')).toBe(
      TERM_EXPLANATIONS['mattering'],
    );
  });

  it("'mattering ( subjective )' (whitespace tolerated by the regex) still strips", () => {
    expect(lookupTerm('mattering ( subjective )')).toBe(
      TERM_EXPLANATIONS['mattering'],
    );
  });
});

/* ------------------------------------------------------------------ */
/* D — lookupTerm misses                                              */
/* ------------------------------------------------------------------ */

describe('lookupTerm — misses', () => {
  it("'nonexistent term' → null", () => {
    expect(lookupTerm('nonexistent term')).toBeNull();
  });

  it("'' → null", () => {
    expect(lookupTerm('')).toBeNull();
  });

  it("'unrelated thing (parenthetical)' → null", () => {
    expect(lookupTerm('unrelated thing (parenthetical)')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* E — lookupTerm casing strictness                                   */
/* ------------------------------------------------------------------ */

describe('lookupTerm — casing strictness', () => {
  it("'Capacity Strain' (title case) → null; lookup is case-sensitive", () => {
    expect(lookupTerm('Capacity Strain')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* F — termIndicatorTargets shape                                     */
/* ------------------------------------------------------------------ */

describe('termIndicatorTargets', () => {
  it('is a Set<string> instance', () => {
    expect(termIndicatorTargets).toBeInstanceOf(Set);
  });

  it('has 39 entries (15 v2 + 20 v3 + 4 v4)', () => {
    expect(termIndicatorTargets.size).toBe(39);
  });

  it('every entry exists as a key in TERM_EXPLANATIONS', () => {
    for (const target of termIndicatorTargets) {
      expect(
        Object.prototype.hasOwnProperty.call(TERM_EXPLANATIONS, target),
      ).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */
/* G — staticCopy shape                                               */
/* ------------------------------------------------------------------ */

describe('staticCopy', () => {
  const expectedKeys = [
    'chart_heading',
    'cards_heading',
    'domains_panel_heading',
    'constraints_panel_heading',
    'closing_heading',
    'life_context_panel_heading',
    'life_texture_panel_heading',
    'comparison_surface_panel_heading',
    'the_narrowings_panel_heading',
    'comparison_surface_section_heading_confirmed',
    'comparison_surface_section_heading_quiet',
    'comparison_surface_section_heading_surfaced',
  ];

  it('has the twelve expected keys (5 v2 + 7 v4)', () => {
    expect(Object.keys(staticCopy).sort()).toEqual([...expectedKeys].sort());
  });

  it('all twelve values are non-empty strings', () => {
    for (const key of expectedKeys) {
      const v = staticCopy[key];
      expect(typeof v).toBe('string');
      expect(v!.length).toBeGreaterThan(0);
    }
  });
});
