// Unit tests for §5.10.2 Surfaced section never_been_part_of_his_life exclusion.

import { describe, it, expect } from 'vitest';
import { buildComparisonSurfaceItems } from '@/synthesis/comparison_surface';
import { makeEngineOutput, makeInputMap } from './synthesis-test-helpers';

describe('§5.10.2 Surfaced section — never_been_part_of_his_life exclusion', () => {
  it('domain with fires=true and value=never_been_part_of_his_life is NOT surfaced', () => {
    const out = makeEngineOutput({
      domains: {
        spiritual: {
          fires: true,
          value: 'never_been_part_of_his_life',
          current_state: 10,
        },
      },
    });
    const input = makeInputMap();

    const items = buildComparisonSurfaceItems(out, input);

    // Spiritual should NOT appear in surfaced (excluded by never_been_part_of_his_life)
    const spiritualSurfaced = items.surfaced.find(
      (item) =>
        item.reference.kind === 'engine_reading' &&
        item.reference.reading_type === 'reduced_domain' &&
        item.reference.target === 'spiritual',
    );
    expect(spiritualSurfaced).toBeUndefined();
  });

  it('domain with fires=true and value=reduced_wants_back IS surfaced', () => {
    const out = makeEngineOutput({
      domains: {
        spiritual: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 10,
        },
      },
    });
    const input = makeInputMap();

    const items = buildComparisonSurfaceItems(out, input);

    // Spiritual SHOULD appear in surfaced (not excluded; reduced_wants_back is a reduction)
    const spiritualSurfaced = items.surfaced.find(
      (item) =>
        item.reference.kind === 'engine_reading' &&
        item.reference.reading_type === 'reduced_domain' &&
        item.reference.target === 'spiritual',
    );
    expect(spiritualSurfaced).toBeDefined();
    if (spiritualSurfaced?.reference.kind === 'engine_reading') {
      expect(spiritualSurfaced.reference.reading_type).toBe('reduced_domain');
      expect(spiritualSurfaced.reference.target).toBe('spiritual');
    }
  });

  it('domain with fires=true and value=reduced_at_peace IS surfaced', () => {
    const out = makeEngineOutput({
      domains: {
        making: {
          fires: true,
          value: 'reduced_at_peace',
          current_state: 15,
        },
      },
    });
    const input = makeInputMap();

    const items = buildComparisonSurfaceItems(out, input);

    // Making SHOULD appear in surfaced (reduced_at_peace is a reduction)
    const makingSurfaced = items.surfaced.find(
      (item) =>
        item.reference.kind === 'engine_reading' &&
        item.reference.reading_type === 'reduced_domain' &&
        item.reference.target === 'making',
    );
    expect(makingSurfaced).toBeDefined();
  });

  it('multiple domains with never_been_part_of_his_life are all excluded', () => {
    const out = makeEngineOutput({
      domains: {
        spiritual: {
          fires: true,
          value: 'never_been_part_of_his_life',
          current_state: 10,
        },
        making: {
          fires: true,
          value: 'never_been_part_of_his_life',
          current_state: 15,
        },
        curiosity: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 20,
        },
      },
    });
    const input = makeInputMap();

    const items = buildComparisonSurfaceItems(out, input);

    // Spiritual and making should NOT appear (never_been_part_of_his_life)
    const spiritualSurfaced = items.surfaced.find(
      (item) =>
        item.reference.kind === 'engine_reading' &&
        item.reference.reading_type === 'reduced_domain' &&
        item.reference.target === 'spiritual',
    );
    const makingSurfaced = items.surfaced.find(
      (item) =>
        item.reference.kind === 'engine_reading' &&
        item.reference.reading_type === 'reduced_domain' &&
        item.reference.target === 'creator',
    );
    expect(spiritualSurfaced).toBeUndefined();
    expect(makingSurfaced).toBeUndefined();

    // Curiosity SHOULD appear (reduced_wants_back)
    const curiositySurfaced = items.surfaced.find(
      (item) =>
        item.reference.kind === 'engine_reading' &&
        item.reference.reading_type === 'reduced_domain' &&
        item.reference.target === 'curiosity',
    );
    expect(curiositySurfaced).toBeDefined();
  });
});
