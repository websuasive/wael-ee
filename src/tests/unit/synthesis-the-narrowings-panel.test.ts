// Unit tests for the narrowings panel (SYNTHESIS_V4.md section 5.13).

import { describe, it, expect } from 'vitest';
import { computeTheNarrowingsPanel } from '@/synthesis/the_narrowings_panel';
import { makeEngineOutput, makeInputMap } from './synthesis-test-helpers';

/* ------------------------------------------------------------------ */
/* A — Band ordering and metadata mapping                            */
/* ------------------------------------------------------------------ */

describe('computeTheNarrowingsPanel — band ordering and metadata', () => {
  it('produces seven bands in engine declaration order with correct metadata', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'high',
        experiential_narrowing_band: 'low',
        psychological_narrowing_band: 'moderate',
        identity_narrowing_band: 'high',
        energetic_narrowing_band: 'low',
        relational_narrowing_band: 'moderate',
        attention_narrowing_band: 'high',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    expect(panel.bands).toHaveLength(7);
    
    // Verify order matches engine declaration order (structural → experiential → ... → attention)
    expect(panel.bands[0]!.band_field).toBe('structural');
    expect(panel.bands[1]!.band_field).toBe('experiential');
    expect(panel.bands[2]!.band_field).toBe('psychological');
    expect(panel.bands[3]!.band_field).toBe('identity');
    expect(panel.bands[4]!.band_field).toBe('energetic');
    expect(panel.bands[5]!.band_field).toBe('relational');
    expect(panel.bands[6]!.band_field).toBe('attention');
    
    // Verify display names from metadata table
    expect(panel.bands[0]!.display_name).toBe('Structural');
    expect(panel.bands[1]!.display_name).toBe('Experiential');
    expect(panel.bands[2]!.display_name).toBe('Psychological');
    expect(panel.bands[3]!.display_name).toBe('Identity');
    expect(panel.bands[4]!.display_name).toBe('Energetic');
    expect(panel.bands[5]!.display_name).toBe('Relational');
    expect(panel.bands[6]!.display_name).toBe('Attention');
    
    // Verify band values from engine output
    expect(panel.bands[0]!.band).toBe('high');
    expect(panel.bands[1]!.band).toBe('low');
    expect(panel.bands[2]!.band).toBe('moderate');
    expect(panel.bands[3]!.band).toBe('high');
    expect(panel.bands[4]!.band).toBe('low');
    expect(panel.bands[5]!.band).toBe('moderate');
    expect(panel.bands[6]!.band).toBe('high');
  });
});

/* ------------------------------------------------------------------ */
/* B — Intensity mapping                                              */
/* ------------------------------------------------------------------ */

describe('computeTheNarrowingsPanel — intensity mapping', () => {
  it('low → 33, moderate → 66, high → 100', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'low',
        experiential_narrowing_band: 'moderate',
        psychological_narrowing_band: 'high',
        identity_narrowing_band: 'low',
        energetic_narrowing_band: 'moderate',
        relational_narrowing_band: 'high',
        attention_narrowing_band: 'low',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    expect(panel.bands[0]!.intensity).toBe(33);  // low
    expect(panel.bands[1]!.intensity).toBe(66);  // moderate
    expect(panel.bands[2]!.intensity).toBe(100); // high
    expect(panel.bands[3]!.intensity).toBe(33);  // low
    expect(panel.bands[4]!.intensity).toBe(66);  // moderate
    expect(panel.bands[5]!.intensity).toBe(100); // high
    expect(panel.bands[6]!.intensity).toBe(33);  // low
  });
});

/* ------------------------------------------------------------------ */
/* C — Summary slot: sentence matches                                 */
/* ------------------------------------------------------------------ */

describe('computeTheNarrowingsPanel — summary slot sentence matches', () => {
  it('all seven bands high → "All seven dimensions reading high."', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'high',
        experiential_narrowing_band: 'high',
        psychological_narrowing_band: 'high',
        identity_narrowing_band: 'high',
        energetic_narrowing_band: 'high',
        relational_narrowing_band: 'high',
        attention_narrowing_band: 'high',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    expect(panel.summary.interpretive_text).toBe('All seven areas are reading high.');
  });

  it('all seven bands moderate → "All seven dimensions reading moderate."', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'moderate',
        experiential_narrowing_band: 'moderate',
        psychological_narrowing_band: 'moderate',
        identity_narrowing_band: 'moderate',
        energetic_narrowing_band: 'moderate',
        relational_narrowing_band: 'moderate',
        attention_narrowing_band: 'moderate',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    expect(panel.summary.interpretive_text).toBe('All seven areas are sitting at moderate.');
  });

  it('five bands low → "Most dimensions reading low. Light across the seven."', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'low',
        experiential_narrowing_band: 'low',
        psychological_narrowing_band: 'low',
        identity_narrowing_band: 'low',
        energetic_narrowing_band: 'low',
        relational_narrowing_band: 'moderate',
        attention_narrowing_band: 'moderate',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    expect(panel.summary.interpretive_text).toBe('Most areas are reading low - things are fairly open across the board.');
  });

  it('four bands high (not all) → "Several dimensions reading high; others moderate or low."', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'high',
        experiential_narrowing_band: 'high',
        psychological_narrowing_band: 'high',
        identity_narrowing_band: 'high',
        energetic_narrowing_band: 'moderate',
        relational_narrowing_band: 'moderate',
        attention_narrowing_band: 'low',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    expect(panel.summary.interpretive_text).toBe('Several areas are reading high, others moderate or low.');
  });
});

/* ------------------------------------------------------------------ */
/* D — Summary slot: token fallback                                   */
/* ------------------------------------------------------------------ */

describe('computeTheNarrowingsPanel — summary token fallback', () => {
  it('no sentence match → interpretive_text null, token_text populated', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'high',
        experiential_narrowing_band: 'high',
        psychological_narrowing_band: 'high',
        identity_narrowing_band: 'moderate',
        energetic_narrowing_band: 'moderate',
        relational_narrowing_band: 'moderate',
        attention_narrowing_band: 'moderate',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    expect(panel.summary.interpretive_text).toBe(null);
    expect(panel.summary.token_text).toBe('Bands reading: 3 high, 4 moderate.');
  });

  it('zero-count clauses dropped from token (7 moderate, 0 high, 0 low)', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'moderate',
        experiential_narrowing_band: 'moderate',
        psychological_narrowing_band: 'moderate',
        identity_narrowing_band: 'moderate',
        energetic_narrowing_band: 'moderate',
        relational_narrowing_band: 'moderate',
        attention_narrowing_band: 'moderate',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    // All-moderate case matches a sentence, but verify token fallback still correct
    expect(panel.summary.token_text).toBe('Bands reading: 7 moderate.');
  });

  it('token fallback populated even when sentence matches', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'high',
        experiential_narrowing_band: 'high',
        psychological_narrowing_band: 'high',
        identity_narrowing_band: 'high',
        energetic_narrowing_band: 'high',
        relational_narrowing_band: 'high',
        attention_narrowing_band: 'high',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    // All-high case matches a sentence
    expect(panel.summary.interpretive_text).toBe('All seven areas are reading high.');
    // Token fallback still populated
    expect(panel.summary.token_text).toBe('Bands reading: 7 high.');
  });

  it('mixed bands produce correct token format', () => {
    const out = makeEngineOutput({
      cross_direction: {
        structural_narrowing_band: 'high',
        experiential_narrowing_band: 'high',
        psychological_narrowing_band: 'moderate',
        identity_narrowing_band: 'moderate',
        energetic_narrowing_band: 'moderate',
        relational_narrowing_band: 'low',
        attention_narrowing_band: 'low',
      },
    });
    const panel = computeTheNarrowingsPanel(out, makeInputMap());
    
    expect(panel.summary.token_text).toBe('Bands reading: 2 high, 3 moderate, 2 low.');
  });
});
