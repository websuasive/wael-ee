// Unit tests for the domains panel (SYNTHESIS.md section 5.5).

import { describe, it, expect } from 'vitest';
import type { DomainName, DomainPresenceOutput } from '@/engine';
import { computeDomainsPanel } from '@/synthesis/domains_panel';
import {
  makeEngineOutput,
  makeInputMap,
} from './synthesis-test-helpers';

const DOMAIN_NAMES: DomainName[] = [
  'time_as_yours',
  'energy_as_resource',
  'felt_aliveness',
  'body_physical_aliveness',
  'curiosity',
  'making',
  'conversation_depth',
  'being_known',
  'friendship',
  'intimacy',
  'mattering',
  'spiritual',
];

// All 12 domains intact unless overridden. Used as a clean baseline because
// the shared helper's per-domain default is fires=true / value='never_been_part_of_his_life'.
function allIntactDomains(
  overrides: Partial<Record<DomainName, Partial<DomainPresenceOutput>>> = {},
): Partial<Record<DomainName, Partial<DomainPresenceOutput>>> {
  const base: Partial<Record<DomainName, Partial<DomainPresenceOutput>>> = {};
  for (const name of DOMAIN_NAMES) {
    base[name] = { fires: false, value: 'intact' };
  }
  return { ...base, ...overrides };
}

/* ------------------------------------------------------------------ */
/* A — reduced_groups                                                 */
/* ------------------------------------------------------------------ */

describe('computeDomainsPanel — reduced_groups', () => {
  it('no domains firing → []', () => {
    const out = makeEngineOutput({ domains: allIntactDomains() });
    expect(computeDomainsPanel(out, makeInputMap()).reduced_groups).toEqual([]);
  });

  it('one domain reduced_wants_back → one group with one name', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'reduced_wants_back' },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    expect(panel.reduced_groups).toEqual([
      {
        value_label: 'Reduced, wants back',
        value_engine_name: 'reduced_wants_back',
        domains: [{ domain_name: 'Time as yours', intensity: 100 }],
        domain_engine_names: ['time_as_yours'],
      },
    ]);
  });

  it('two domains same value → one group with two names', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'reduced_wants_back' },
        energy_as_resource: { fires: true, value: 'reduced_wants_back' },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    expect(panel.reduced_groups).toHaveLength(1);
    expect(
      panel.reduced_groups[0]!.domains.map((d) => d.domain_name),
    ).toEqual(['Time as yours', 'Energy as resource']);
  });

  it('two different values → two groups in spec value order', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'reduced_at_peace' },
        energy_as_resource: { fires: true, value: 'reduced_wants_back' },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    expect(panel.reduced_groups.map((g) => g.value_label)).toEqual([
      'Reduced, wants back',
      'Reduced, at peace',
    ]);
  });

  it('group order matches spec section 6.4 value order', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'never_been_part_of_his_life' },
        energy_as_resource: { fires: true, value: 'wants_but_never_had' },
        felt_aliveness: { fires: true, value: 'reduced_at_peace' },
        body_physical_aliveness: { fires: true, value: 'reduced_wants_back' },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    expect(panel.reduced_groups.map((g) => g.value_label)).toEqual([
      'Reduced, wants back',
      'Reduced, at peace',
      'Wants but never had',
      'Never been part of life',
    ]);
  });

  it('within a group, domain names use canonical engine domain order', () => {
    // Canonical order has time_as_yours before mattering.
    const out = makeEngineOutput({
      domains: allIntactDomains({
        mattering: { fires: true, value: 'reduced_wants_back' },
        time_as_yours: { fires: true, value: 'reduced_wants_back' },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    expect(
      panel.reduced_groups[0]!.domains.map((d) => d.domain_name),
    ).toEqual(['Time as yours', 'Mattering']);
  });

  it('display names use DOMAIN_DISPLAY_NAMES (e.g., body_physical_aliveness → "Body")', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        body_physical_aliveness: { fires: true, value: 'reduced_wants_back' },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    expect(
      panel.reduced_groups[0]!.domains.map((d) => d.domain_name),
    ).toEqual(['Body']);
  });

  it('domain intensity = 100 - engine current_state (current_state 40 → intensity 60)', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 40,
        },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    expect(panel.reduced_groups[0]!.domains[0]!.intensity).toBe(60);
  });

  it('domain intensity at boundaries (current_state 0 → 100, current_state 100 → 0)', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 0,
        },
        energy_as_resource: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 100,
        },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    const byName = Object.fromEntries(
      panel.reduced_groups[0]!.domains.map((d) => [d.domain_name, d.intensity]),
    );
    expect(byName['Time as yours']).toBe(100);
    expect(byName['Energy as resource']).toBe(0);
  });

  it('domain entries pair domain_name with engine domain key (parallel order to domain_engine_names)', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 30,
        },
        mattering: {
          fires: true,
          value: 'reduced_wants_back',
          current_state: 70,
        },
      }),
    });
    const group = computeDomainsPanel(out, makeInputMap()).reduced_groups[0]!;
    expect(group.domains.map((d) => d.domain_name)).toEqual([
      'Time as yours',
      'Mattering',
    ]);
    expect(group.domain_engine_names).toEqual(['time_as_yours', 'mattering']);
    expect(group.domains.map((d) => d.intensity)).toEqual([70, 30]);
  });

  it('value labels use DOMAIN_VALUE_LABELS (reduced_wants_back → "Reduced, wants back")', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'reduced_wants_back' },
      }),
    });
    expect(
      computeDomainsPanel(out, makeInputMap()).reduced_groups[0]!.value_label,
    ).toBe('Reduced, wants back');
  });
});

/* ------------------------------------------------------------------ */
/* B — intact_callout                                                 */
/* ------------------------------------------------------------------ */

describe('computeDomainsPanel — intact_callout', () => {
  it('no intact domains → interpretive_text null, token empty', () => {
    // Helper baseline: all 12 domains firing with non-intact value.
    const panel = computeDomainsPanel(makeEngineOutput(), makeInputMap());
    expect(panel.intact_callout.interpretive_text).toBeNull();
    expect(panel.intact_callout.token_text).toBe('');
  });

  it('one intact domain → "<name>."', () => {
    const out = makeEngineOutput({
      domains: { mattering: { fires: false, value: 'intact' } },
    });
    expect(
      computeDomainsPanel(out, makeInputMap()).intact_callout.token_text,
    ).toBe('Mattering.');
  });

  it('three intact domains → comma-joined in canonical order', () => {
    const out = makeEngineOutput({
      domains: {
        time_as_yours: { fires: false, value: 'intact' },
        curiosity: { fires: false, value: 'intact' },
        mattering: { fires: false, value: 'intact' },
        // Other 8 keep helper baseline (firing, non-intact) — not relevant here.
      },
    });
    expect(
      computeDomainsPanel(out, makeInputMap()).intact_callout.token_text,
    ).toBe('Time as yours, Curiosity, Mattering.');
  });

  it('mattering intact + 8+ firing domains → domains_mattering_intact_with_many_reductions interpretive set', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        // Set all 11 non-mattering domains to firing
        time_as_yours: { fires: true, value: 'reduced_wants_back' },
        energy_as_resource: { fires: true, value: 'reduced_wants_back' },
        felt_aliveness: { fires: true, value: 'reduced_wants_back' },
        body_physical_aliveness: { fires: true, value: 'reduced_wants_back' },
        curiosity: { fires: true, value: 'reduced_wants_back' },
        making: { fires: true, value: 'reduced_wants_back' },
        conversation_depth: { fires: true, value: 'reduced_wants_back' },
        being_known: { fires: true, value: 'reduced_wants_back' },
        friendship: { fires: true, value: 'reduced_wants_back' },
        intimacy: { fires: true, value: 'reduced_wants_back' },
        spiritual: { fires: true, value: 'never_been_part_of_his_life' },
        // mattering intact (allIntactDomains sets all to intact by default)
        mattering: { fires: false, value: 'intact' },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    expect(panel.intact_callout.interpretive_text).toBe(
      'Mattering reading intact alongside multiple reductions.',
    );
    expect(panel.intact_callout.token_text).toBe('Mattering.');
  });
});

/* ------------------------------------------------------------------ */
/* C — summary                                                        */
/* ------------------------------------------------------------------ */

describe('computeDomainsPanel — summary', () => {
  it('no domains_summary sentences → interpretive_text always null', () => {
    expect(
      computeDomainsPanel(makeEngineOutput(), makeInputMap()).summary
        .interpretive_text,
    ).toBeNull();
  });

  it('12 reduced, 0 intact, 0 other → drops third clause', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'reduced_wants_back' },
        energy_as_resource: { fires: true, value: 'reduced_wants_back' },
        felt_aliveness: { fires: true, value: 'reduced_wants_back' },
        body_physical_aliveness: { fires: true, value: 'reduced_wants_back' },
        curiosity: { fires: true, value: 'reduced_wants_back' },
        making: { fires: true, value: 'reduced_wants_back' },
        conversation_depth: { fires: true, value: 'reduced_wants_back' },
        being_known: { fires: true, value: 'reduced_wants_back' },
        friendship: { fires: true, value: 'reduced_wants_back' },
        intimacy: { fires: true, value: 'reduced_wants_back' },
        mattering: { fires: true, value: 'reduced_wants_back' },
        spiritual: { fires: true, value: 'reduced_wants_back' },
      }),
    });
    expect(
      computeDomainsPanel(out, makeInputMap()).summary.token_text,
    ).toBe('12 domains reduced; 0 intact.');
  });

  it('all 12 intact → "0 domains reduced; 12 intact."', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: false, value: 'intact' },
        energy_as_resource: { fires: false, value: 'intact' },
        felt_aliveness: { fires: false, value: 'intact' },
        body_physical_aliveness: { fires: false, value: 'intact' },
        curiosity: { fires: false, value: 'intact' },
        making: { fires: false, value: 'intact' },
        conversation_depth: { fires: false, value: 'intact' },
        being_known: { fires: false, value: 'intact' },
        friendship: { fires: false, value: 'intact' },
        intimacy: { fires: false, value: 'intact' },
        mattering: { fires: false, value: 'intact' },
        spiritual: { fires: false, value: 'intact' },
      }),
    });
    expect(
      computeDomainsPanel(out, makeInputMap()).summary.token_text,
    ).toBe('0 domains reduced; 12 intact.');
  });

  it('mixed 5 reduced, 4 intact, 3 other → all three clauses', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        // 5 reduced
        time_as_yours: { fires: true, value: 'reduced_wants_back' },
        energy_as_resource: { fires: true, value: 'reduced_wants_back' },
        felt_aliveness: { fires: true, value: 'reduced_at_peace' },
        body_physical_aliveness: { fires: true, value: 'reduced_at_peace' },
        curiosity: { fires: true, value: 'reduced_wants_back' },
        // 4 intact
        making: { fires: false, value: 'intact' },
        conversation_depth: { fires: false, value: 'intact' },
        being_known: { fires: false, value: 'intact' },
        friendship: { fires: false, value: 'intact' },
        // 3 other
        intimacy: { fires: true, value: 'wants_but_never_had' },
        mattering: { fires: true, value: 'never_been_part_of_his_life' },
        spiritual: { fires: true, value: 'never_been_part_of_his_life' },
      }),
    });
    expect(
      computeDomainsPanel(out, makeInputMap()).summary.token_text,
    ).toBe('5 domains reduced; 4 intact; 3 other.');
  });

  it('o > 0 triggers third clause; o === 0 drops it (sanity sweep)', () => {
    const noOther = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'reduced_wants_back' },
      }),
    });
    expect(
      computeDomainsPanel(noOther, makeInputMap()).summary.token_text.includes(
        'other',
      ),
    ).toBe(false);

    const withOther = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'wants_but_never_had' },
      }),
    });
    expect(
      computeDomainsPanel(withOther, makeInputMap()).summary.token_text.includes(
        'other',
      ),
    ).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* D — purity                                                         */
/* ------------------------------------------------------------------ */

describe('computeDomainsPanel — value_engine_name', () => {
  it('group carries the value engine name parallel to value_label', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'reduced_at_peace' },
      }),
    });
    const panel = computeDomainsPanel(out, makeInputMap());
    expect(panel.reduced_groups[0]?.value_engine_name).toBe('reduced_at_peace');
  });
});

describe('computeDomainsPanel — purity', () => {
  it('two calls return deep-equal', () => {
    const out = makeEngineOutput({
      domains: allIntactDomains({
        time_as_yours: { fires: true, value: 'reduced_wants_back' },
        mattering: { fires: false, value: 'intact' },
      }),
    });
    const a = computeDomainsPanel(out, makeInputMap());
    const b = computeDomainsPanel(out, makeInputMap());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
