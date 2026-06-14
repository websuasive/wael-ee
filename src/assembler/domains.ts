import type { InputMap } from '@/engine/types';
import type { QuestionnaireAnswers, DomainKey } from './answers';
import { WANTING_CURRENT_STATE_FLOOR } from './params';

const UNIVERSAL_DOMAINS: Set<DomainKey> = new Set([
  'time_as_yours',
  'energy_as_resource',
  'felt_aliveness',
  'body_physical_aliveness',
]);

const ALL_DOMAINS: DomainKey[] = [
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

// Relational domain current_state derivation from two single-select questions
// Mirrors the q30 interpret pattern: one helper keeps the three outputs paired
export function interpretRelationalDomains(friendshipLetter: 'a' | 'b' | 'c', depthKnownLetter: 'a' | 'b' | 'c'): {
  friendship: number;
  conversation_depth: number;
  being_known: number;
} {
  // Question A (friendship): a->15, b->50, c->80
  const friendshipMap: Record<'a' | 'b' | 'c', number> = {
    a: 15,
    b: 50,
    c: 80,
  };
  const friendship = friendshipMap[friendshipLetter];

  // Question B (depth + being known): a->{25,25}, b->{75,40}, c->{75,80}
  // LOAD-BEARING: b-row has depth intact (75) while being_known reduced (40 fires)
  let conversation_depth: number;
  let being_known: number;

  if (depthKnownLetter === 'a') {
    conversation_depth = 25;
    being_known = 25;
  } else if (depthKnownLetter === 'b') {
    conversation_depth = 75;
    being_known = 40;
  } else {
    conversation_depth = 75;
    being_known = 80;
  }

  return { friendship, conversation_depth, being_known };
}

/**
 * Compute the faded set: domains where past_presence == yes AND current_state < 60.
 * This is display-scoping only: the UI uses this to decide which rows to show the peace question.
 * The assembler owns this derivation; the UI must not compute it itself.
 */
export function computeFadedDomains(answers: QuestionnaireAnswers): DomainKey[] {
  const faded: DomainKey[] = [];
  for (const domain of ALL_DOMAINS) {
    const current_state = answers.domain_current_state[domain];
    const past_presence = answers.past_presence_selection.includes(domain)
      ? 'yes'
      : 'no';
    if (past_presence === 'yes' && current_state < 60) {
      faded.push(domain);
    }
  }
  return faded;
}

function deriveWanting(
  domain: DomainKey,
  current_state: number,
  past_presence: 'yes' | 'no',
  peace_discriminator: 'made_peace' | 'still_misses' | undefined,
): 'wants' | 'doesnt_want' | undefined {
  // Universal domains omit wanting entirely
  if (UNIVERSAL_DOMAINS.has(domain)) {
    return undefined;
  }

  // B9: New route to doesnt_want for at-peace men with history
  // doesnt_want IF past_presence == yes AND peace_discriminator == 'made_peace' AND current_state < 60
  if (
    past_presence === 'yes' &&
    peace_discriminator === 'made_peace' &&
    current_state < 60
  ) {
    return 'doesnt_want';
  }

  // Existing route: doesnt_want IF past_presence == no AND current_state < 30
  if (past_presence === 'no' && current_state < WANTING_CURRENT_STATE_FLOOR) {
    return 'doesnt_want';
  }

  // still_misses or absent peace_discriminator → wants (existing behaviour)
  return 'wants';
}

export function buildDomains(
  answers: QuestionnaireAnswers,
): InputMap['domains'] {
  const domains: InputMap['domains'] = {} as InputMap['domains'];

  for (const domain of ALL_DOMAINS) {
    const current_state = answers.domain_current_state[domain];
    const past_presence = answers.past_presence_selection.includes(domain)
      ? 'yes'
      : 'no';

    const peace_discriminator = answers.peace_discriminator?.[domain];
    const wanting = deriveWanting(domain, current_state, past_presence, peace_discriminator);

    if (wanting === undefined) {
      domains[domain] = {
        current_state,
        past_presence,
      };
    } else {
      domains[domain] = {
        current_state,
        past_presence,
        wanting,
      };
    }

    // Populate peace_discriminator if present in answers
    if (peace_discriminator) {
      domains[domain].peace_discriminator = peace_discriminator;
    }
  }

  return domains;
}
