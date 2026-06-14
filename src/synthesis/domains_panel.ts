// Domains panel construction. Implements SYNTHESIS.md section 5.5.

import type {
  EngineOutput,
  InputMap,
  DomainPresenceValue,
} from '../engine';
import type { DomainsPanel } from './types';
import { DOMAIN_DISPLAY_NAMES, DOMAIN_VALUE_LABELS } from './data/tokens';
import { findFirstMatchingSentence } from './predicates';
import { interpolate } from './interpolation';

const REDUCED_VALUE_ORDER: ReadonlyArray<DomainPresenceValue> = [
  'reduced_wants_back',
  'reduced_at_peace',
  'wants_but_never_had',
  'never_been_part_of_his_life',
];

const REDUCED_VALUES: ReadonlySet<DomainPresenceValue> = new Set<DomainPresenceValue>([
  'reduced_wants_back',
  'reduced_at_peace',
]);

const OTHER_VALUES: ReadonlySet<DomainPresenceValue> = new Set<DomainPresenceValue>([
  'wants_but_never_had',
  'never_been_part_of_his_life',
]);

export function computeDomainsPanel(
  output: EngineOutput,
  input: InputMap,
): DomainsPanel {
  // reduced_groups: filter firing domains, group by value in canonical value order.
  const firing = output.domains.filter((m) => m.fires);
  const reduced_groups = REDUCED_VALUE_ORDER.flatMap((value) => {
    const inGroup = firing.filter((m) => m.value === value);
    if (inGroup.length === 0) return [];
    return [
      {
        value_label: DOMAIN_VALUE_LABELS[value],
        value_engine_name: value,
        domains: inGroup.map((m) => ({
          domain_name: DOMAIN_DISPLAY_NAMES[m.domain],
          intensity: 100 - m.current_state,
        })),
        domain_engine_names: inGroup.map((m) => m.domain),
      },
    ];
  });

  // intact_callout
  const intactNames = output.domains
    .filter((m) => m.value === 'intact')
    .map((m) => DOMAIN_DISPLAY_NAMES[m.domain]);

  const intactMatch = findFirstMatchingSentence(
    'domains_intact_callout',
    output,
    input,
  );
  const intactToken =
    intactNames.length > 0
      ? interpolate('{names}.', { names: intactNames.join(', ') })
      : '';
  const intact_callout = {
    interpretive_text:
      intactMatch !== null
        ? interpolate(intactMatch.sentence, { names: intactNames.join(', ') })
        : null,
    token_text: intactToken,
  };

  // summary
  const r = output.domains.filter((m) => REDUCED_VALUES.has(m.value)).length;
  const n_intact = output.domains.filter((m) => m.value === 'intact').length;
  const o = output.domains.filter((m) => OTHER_VALUES.has(m.value)).length;
  const summaryTemplate =
    o > 0
      ? '{r} domains reduced; {n_intact} intact; {o} other.'
      : '{r} domains reduced; {n_intact} intact.';
  const summaryToken = interpolate(summaryTemplate, { r, n_intact, o });

  const summaryMatch = findFirstMatchingSentence(
    'domains_summary',
    output,
    input,
  );
  const summary = {
    interpretive_text:
      summaryMatch !== null
        ? interpolate(summaryMatch.sentence, { r, n_intact, o })
        : null,
    token_text: summaryToken,
  };

  return { summary, reduced_groups, intact_callout };
}
