import { describe, it, expect } from 'vitest';
import type { NarrowingBandEntry } from '@/synthesis/types';
import { protocolNarrowingIntensity } from '@/ui/experience/recommend';

// Minimal v3-clean bands fixture. Sets every field the NarrowingBandEntry
// type requires (band_field, display_name, full_name, character_name, band,
// intensity, observation). Stands alone; imports no other test file.
function band(
  band_field: NarrowingBandEntry['band_field'],
  band: NarrowingBandEntry['band'],
  intensity: NarrowingBandEntry['intensity'],
): NarrowingBandEntry {
  return {
    band_field,
    display_name: band_field,
    full_name: band_field,
    character_name: band_field,
    band,
    intensity,
    observation: 'test',
  };
}

describe('protocolNarrowingIntensity', () => {
  const bands: NarrowingBandEntry[] = [
    band('energetic', 'high', 100),
    band('psychological', 'moderate', 66),
    band('identity', 'low', 33),
    band('structural', 'high', 100),
    band('experiential', 'moderate', 66),
    band('relational', 'low', 33),
    band('attention', 'high', 100),
  ];

  it('maps stir to energetic intensity', () => {
    expect(protocolNarrowingIntensity('stir', bands)).toBe(100);
  });

  it('maps loophole to psychological intensity', () => {
    expect(protocolNarrowingIntensity('loophole', bands)).toBe(66);
  });

  it('maps slip to identity intensity', () => {
    expect(protocolNarrowingIntensity('slip', bands)).toBe(33);
  });

  it('maps catch to structural intensity', () => {
    expect(protocolNarrowingIntensity('catch', bands)).toBe(100);
  });

  it('maps trespass to experiential intensity', () => {
    expect(protocolNarrowingIntensity('trespass', bands)).toBe(66);
  });

  it('maps aside to relational intensity', () => {
    expect(protocolNarrowingIntensity('aside', bands)).toBe(33);
  });

  it('maps steeping to attention intensity', () => {
    expect(protocolNarrowingIntensity('steeping', bands)).toBe(100);
  });

  it('returns 0 when the mapped band is absent', () => {
    expect(protocolNarrowingIntensity('stir', [])).toBe(0);
  });

  it('returns 0 when bands omit the protocol\'s narrowing', () => {
    const partial: NarrowingBandEntry[] = [band('structural', 'high', 100)];
    expect(protocolNarrowingIntensity('stir', partial)).toBe(0);
  });
});
