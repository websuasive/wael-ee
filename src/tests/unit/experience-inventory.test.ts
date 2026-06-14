import { describe, it, expect } from 'vitest';
import { loadInventory } from '@/ui/experience/inventory';

describe('loadInventory', () => {
  it('returns a non-empty flattened variant array', () => {
    const variants = loadInventory();
    expect(Array.isArray(variants)).toBe(true);
    expect(variants.length).toBeGreaterThan(0);
  });

  it('returns variants carrying both variant-level and activity-level fields', () => {
    const variants = loadInventory();
    const v = variants[0]!;
    // variant-level
    expect(typeof v.variant_id).toBe('string');
    expect(typeof v.protocol).toBe('string');
    // activity-level (spread on by flattenInventory)
    expect(typeof v.activity_id).toBe('string');
    expect(typeof v.label).toBe('string');
    expect(typeof v.cost_tier).toBe('string');
  });

  it('returns a stable count across calls (pure read)', () => {
    expect(loadInventory().length).toBe(loadInventory().length);
  });
});
