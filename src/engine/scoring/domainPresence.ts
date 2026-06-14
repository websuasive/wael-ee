// Domain presence scoring. Implements spec section 5.2.

import type {
  InputMap,
  DomainPresenceOutput,
  DomainName,
  DomainPresenceValue,
  PerDomainInputs,
} from '../types';

const CANONICAL_DOMAIN_ORDER: readonly DomainName[] = [
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

function computeOneDomainPresence(
  domain: DomainName,
  inputs: PerDomainInputs,
): DomainPresenceOutput {
  if (inputs.current_state >= 60) {
    return {
      domain,
      current_state: inputs.current_state,
      fires: false,
      value: 'intact',
    };
  }
  const wanting = inputs.wanting ?? 'wants';
  let value: DomainPresenceValue;
  if (inputs.past_presence === 'yes' && wanting === 'wants') {
    value = 'reduced_wants_back';
  } else if (inputs.past_presence === 'yes' && wanting === 'doesnt_want') {
    value = 'reduced_at_peace';
  } else if (inputs.past_presence === 'no' && wanting === 'wants') {
    value = 'wants_but_never_had';
  } else {
    value = 'never_been_part_of_his_life';
  }
  return {
    domain,
    current_state: inputs.current_state,
    fires: true,
    value,
  };
}

export function computeDomainPresenceOutputs(
  input: InputMap,
): DomainPresenceOutput[] {
  return CANONICAL_DOMAIN_ORDER.map((name) =>
    computeOneDomainPresence(name, input.domains[name]),
  );
}
