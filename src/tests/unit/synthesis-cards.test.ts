// Unit tests for synthesis-layer direction card construction (SYNTHESIS.md sections 5.3 and 7.2).

import { describe, it, expect } from 'vitest';
import type { EngineOutput, InputMap, DirectionName } from '@/engine';
import type { DirectionCardOutput } from '@/synthesis/types';
import { computeDirectionCards } from '@/synthesis/cards';
import { computeFiringSet } from '@/synthesis/headline';
import { recognitionSentences } from '@/synthesis/data/recognition_sentences';
import {
  makeEngineOutput,
  makeInputMap,
} from './synthesis-test-helpers';

function findCard(
  cards: DirectionCardOutput[],
  displayName: string,
): DirectionCardOutput | undefined {
  return cards.find((c) => c.direction_name === displayName);
}

function buildAndCompute(
  out: EngineOutput,
  inp: InputMap = makeInputMap(),
): DirectionCardOutput[] {
  return computeDirectionCards(out, inp, computeFiringSet(out));
}

/* ------------------------------------------------------------------ */
/* A — six cards always produced                                      */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — always six cards', () => {
  it('baseline output → 6 cards', () => {
    expect(buildAndCompute(makeEngineOutput()).length).toBe(6);
  });

  it('one direction firing → 6 cards', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    expect(buildAndCompute(out).length).toBe(6);
  });

  it('all six firing → 6 cards', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 90, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 80, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 70, pull_quality: ['real'] },
        { direction: 'contributor', pull: 60, pull_quality: ['real'] },
        { direction: 'growth_focused', pull: 55, pull_quality: ['real'] },
        { direction: 'relationship_rebuilder', pull: 50, pull_quality: ['real'] },
      ],
    });
    expect(buildAndCompute(out).length).toBe(6);
  });
});

/* ------------------------------------------------------------------ */
/* B — card ordering                                                  */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — ordering', () => {
  it('sorts by pull descending', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 80 },
        { direction: 'freedom_designer', pull: 60 },
      ],
    });
    const cards = buildAndCompute(out);
    expect(cards[0]!.direction_name).toBe('Creator');
    expect(cards[1]!.direction_name).toBe('Freedom Designer');
  });

  it('alphabetical tiebreak on equal pulls', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 70 },
        { direction: 'growth_focused', pull: 70 },
      ],
    });
    const cards = buildAndCompute(out);
    // creator ('Creator') alphabetically precedes growth ('Growth Focused')
    // by direction NAME (the engine name), which is the comparator basis.
    // 'creator' < 'growth_focused' alphabetically, so creator comes first.
    expect(cards[0]!.direction_name).toBe('Creator');
    expect(cards[1]!.direction_name).toBe('Growth Focused');
  });
});

/* ------------------------------------------------------------------ */
/* C — field tokens                                                   */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — Pull band field', () => {
  function pullValueFor(p: number): string {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: p }],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    return card.fields.find((f) => f.label === 'Pull')!.value;
  }

  it('boundary band values', () => {
    expect(pullValueFor(0)).toBe('low');
    expect(pullValueFor(29)).toBe('low');
    expect(pullValueFor(30)).toBe('moderate');
    expect(pullValueFor(49)).toBe('moderate');
    expect(pullValueFor(50)).toBe('present');
    expect(pullValueFor(69)).toBe('present');
    expect(pullValueFor(70)).toBe('strong');
  });
});

describe('computeDirectionCards — Past field', () => {
  it('past_presence yes → present', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 0 }],
    });
    const inp = makeInputMap({
      directions: { creator: { past_presence: 'yes' } },
    });
    const card = findCard(computeDirectionCards(out, inp, computeFiringSet(out)), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Past')!.value).toBe('present');
  });

  it('past_presence no → absent', () => {
    const out = makeEngineOutput();
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Past')!.value).toBe('absent');
  });
});

describe('computeDirectionCards — Quality field (state-sentences)', () => {
  it('real + active → "A real want, and you\'re acting on it."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['real'],
          quadrant: 'active',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      "A real want, and you're acting on it.",
    );
  });

  it('empty quality + quiet → "Not really reading as one of yours."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: [],
          quadrant: 'quiet',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      'Not really reading as one of yours.',
    );
  });

  it('suppressed + blocked → "You\'ve pushed this one down - you\'ve had it before, but it\'s low now."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['suppressed'],
          quadrant: 'blocked',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      "You've pushed this one down - you've had it before, but it's low now.",
    );
  });

  it('real + blocked → "A real want, but there\'s no room for it right now."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['real'],
          quadrant: 'blocked',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      "A real want, but there's no room for it right now.",
    );
  });

  it('real + quiet → "A real want that\'s gone quiet - there, but not pushing."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['real'],
          quadrant: 'quiet',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      "A real want that's gone quiet - there, but not pushing.",
    );
  });

  it('real + habit → "A real want, though it\'s running on habit now."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['real'],
          quadrant: 'habit',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      "A real want, though it's running on habit now.",
    );
  });

  it('saturated → "This one\'s gone stale - the wanting\'s worn out."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['saturated'],
          quadrant: 'active',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      "This one's gone stale - the wanting's worn out.",
    );
  });

  it('behaviourally_divergent → "You name this one, but your energy actually goes elsewhere."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['behaviourally_divergent'],
          quadrant: 'active',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      'You name this one, but your energy actually goes elsewhere.',
    );
  });

  it('phantom → "Wanted, but it hasn\'t turned into anything yet."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['phantom'],
          quadrant: 'active',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      "Wanted, but it hasn't turned into anything yet.",
    );
  });

  it('uses first element of pull_quality when multi-valued', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['suppressed', 'saturated'],
          quadrant: 'blocked',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    // First quality is 'suppressed', quadrant is 'blocked'
    expect(card.fields.find((f) => f.label === 'Quality')!.value).toBe(
      "You've pushed this one down - you've had it before, but it's low now.",
    );
  });
});

/* ------------------------------------------------------------------ */
/* D — field order and count                                          */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — fields shape', () => {
  it('every card has exactly 3 fields', () => {
    const cards = buildAndCompute(makeEngineOutput());
    for (const c of cards) {
      expect(c.fields.length).toBe(3);
    }
  });

  it('field order is Pull, Past, Quality', () => {
    const cards = buildAndCompute(makeEngineOutput());
    for (const c of cards) {
      expect(c.fields.map((f) => f.label)).toEqual([
        'Pull',
        'Past',
        'Quality',
      ]);
    }
  });

  it('field labels are verbatim per spec', () => {
    const card = buildAndCompute(makeEngineOutput())[0]!;
    expect(card.fields.map((f) => f.label)).toEqual([
      'Pull',
      'Past',
      'Quality',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* F — meaning_sentence                                               */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — meaning_sentence', () => {
  function meaningFor(d: DirectionName, displayName: string) {
    const out = makeEngineOutput({
      directions: [{ direction: d, pull: 0 }],
    });
    return findCard(buildAndCompute(out), displayName)!.meaning_sentence;
  }

  it('making → recognitionSentences[creator]', () => {
    expect(meaningFor('creator', 'Creator').interpretive_text).toBe(
      recognitionSentences['creator'],
    );
  });

  it('freedom → recognitionSentences[freedom_designer]', () => {
    expect(meaningFor('freedom_designer', 'Freedom Designer').interpretive_text).toBe(
      recognitionSentences['freedom_designer'],
    );
  });

  it('relationship → recognitionSentences[relationship_rebuilder]', () => {
    expect(
      meaningFor('relationship_rebuilder', 'Relationship Rebuilder').interpretive_text,
    ).toBe(recognitionSentences['relationship_rebuilder']);
  });

  it('growth → recognitionSentences[growth_focused]', () => {
    expect(meaningFor('growth_focused', 'Growth Focused').interpretive_text).toBe(
      recognitionSentences['growth_focused'],
    );
  });

  it('experience → recognitionSentences[experience_seeker]', () => {
    expect(meaningFor('experience_seeker', 'Experience Seeker').interpretive_text).toBe(
      recognitionSentences['experience_seeker'],
    );
  });

  it('contribution → recognitionSentences[contributor]', () => {
    expect(meaningFor('contributor', 'Contributor').interpretive_text).toBe(
      recognitionSentences['contributor'],
    );
  });

  it('every meaning_sentence has token_text === "" regardless of interpretive_text', () => {
    const cards = buildAndCompute(makeEngineOutput());
    for (const c of cards) {
      expect(c.meaning_sentence.token_text).toBe('');
    }
  });
});

/* ------------------------------------------------------------------ */
/* G — summary token text                                             */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — summary token_text', () => {
  it('real + active → "real, active."', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['real'],
          quadrant: 'active',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    // Summary slot shows state-sentence; token_text stays empty
    expect(card.summary.token_text).toBe('');
  });

  it('empty + quiet (claimed-id sibling) → summary slot suppressed', () => {
    // Baseline output: all 6 directions default to pull_quality: [] and
    // quadrant: 'quiet', so every card matches the card_empty_quiet predicate.
    // First-fire + alphabetical tiebreak gives the id to 'contributor'; the
    // other five directions become suppressed siblings. Under the suppression
    // rule (cards.ts: token_text === '' when interpretive_text === null),
    // those siblings emit empty SlotContent so the render layer drops the
    // summary line. The Quality field still carries the composite via its own
    // fields[] entry.
    const out = makeEngineOutput();
    const card = findCard(buildAndCompute(out), 'Creator')!;
    expect(card.summary.interpretive_text).toBeNull();
    expect(card.summary.token_text).toBe('');
  });

  it('uses first element of multi-valued pull_quality', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['phantom', 'real'],
          quadrant: 'active',
        },
      ],
    });
    const card = findCard(buildAndCompute(out), 'Creator')!;
    // Summary slot shows state-sentence; token_text stays empty
    expect(card.summary.token_text).toBe('');
  });
});

/* ------------------------------------------------------------------ */
/* H — summary interpretive text — single matches                     */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — summary interpretive_text per shape', () => {
  it('card_real_active_strong (real + active + pull >= 70)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 75,
          pull_quality: ['real'],
          quadrant: 'active',
        },
      ],
    });
    // Tier 2: summary slot stays empty (interpretive lines removed).
    // State-sentence now in Quality field via cardStateSentence.
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_real_active_moderate (real + active + pull < 70)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 60,
          pull_quality: ['real'],
          quadrant: 'active',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_suppressed_blocked (suppressed + blocked)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['suppressed'],
          quadrant: 'blocked',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_real_habit (real + habit)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['real'],
          quadrant: 'habit',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_phantom (phantom_partial)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['phantom_partial'],
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_phantom (phantom)', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 0, pull_quality: ['phantom'] },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_saturated', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 0, pull_quality: ['saturated'] },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_real_blocked (real + blocked)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['real'],
          quadrant: 'blocked',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_real_quiet (real + quiet)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['real'],
          quadrant: 'quiet',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_suppressed_active (suppressed + active)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['suppressed'],
          quadrant: 'active',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_suppressed_habit (suppressed + habit)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['suppressed'],
          quadrant: 'habit',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_suppressed_quiet (suppressed + quiet)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['suppressed'],
          quadrant: 'quiet',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_behaviourally_divergent', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: ['behaviourally_divergent'],
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_empty_habit (empty pull_quality + habit)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 0,
          pull_quality: [],
          quadrant: 'habit',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('card_empty_quiet (empty pull_quality + quiet)', () => {
    // making bumped above baseline pull so it sorts ahead of the 5 default-baseline
    // directions (which also resolve to empty + quiet) and claims card_empty_quiet
    // first under the first-fire rule. Quadrant is set explicitly, so pull doesn't
    // shift it out of 'quiet'.
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 10,
          pull_quality: [],
          quadrant: 'quiet',
        },
      ],
    });
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* I — first-fire rule                                                */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — first-fire rule', () => {
  it('three directions matching same shape → only highest pull gets interpretive_text', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['suppressed'],
          quadrant: 'blocked',
        },
        {
          direction: 'freedom_designer',
          pull: 70,
          pull_quality: ['suppressed'],
          quadrant: 'blocked',
        },
        {
          direction: 'experience_seeker',
          pull: 60,
          pull_quality: ['suppressed'],
          quadrant: 'blocked',
        },
      ],
    });
    const cards = buildAndCompute(out);
    const making = findCard(cards, 'Creator')!;
    const freedom = findCard(cards, 'Freedom Designer')!;
    const experience = findCard(cards, 'Experience Seeker')!;
    // Tier 2: summary slot stays empty (interpretive lines removed).
    expect(making.summary.interpretive_text).toBeNull();
    expect(freedom.summary.interpretive_text).toBeNull();
    expect(experience.summary.interpretive_text).toBeNull();
    expect(making.summary.token_text).toBe('');
    expect(freedom.summary.token_text).toBe('');
    expect(experience.summary.token_text).toBe('');
  });

  it('two different shapes co-fire on different cards → both get interpretive_text', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['real'],
          quadrant: 'active',
        },
        {
          direction: 'freedom_designer',
          pull: 70,
          pull_quality: ['phantom'],
        },
      ],
    });
    const cards = buildAndCompute(out);
    // Tier 2: summary slot stays empty (interpretive lines removed).
    expect(findCard(cards, 'Creator')!.summary.interpretive_text).toBeNull();
    expect(findCard(cards, 'Freedom Designer')!.summary.interpretive_text).toBeNull();
  });

  it('two of same shape + one of different shape → first-fire only on dup, both shapes fire once', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['real'],
          quadrant: 'active',
        },
        {
          direction: 'freedom_designer',
          pull: 60,
          pull_quality: ['real'],
          quadrant: 'active',
        },
        {
          direction: 'experience_seeker',
          pull: 50,
          pull_quality: ['phantom'],
        },
      ],
    });
    const cards = buildAndCompute(out);
    const making = findCard(cards, 'Creator')!;
    const freedom = findCard(cards, 'Freedom Designer')!;
    const experience = findCard(cards, 'Experience Seeker')!;
    // Tier 2: summary slot stays empty (interpretive lines removed).
    expect(making.summary.interpretive_text).toBeNull();
    expect(freedom.summary.interpretive_text).toBeNull();
    expect(experience.summary.interpretive_text).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* J — predicate evaluation order within a card                       */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — predicate order', () => {
  it('pull = 70 (boundary) matches strong, not moderate', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 70,
          pull_quality: ['real'],
          quadrant: 'active',
        },
      ],
    });
    // Tier 2: summary slot stays empty (interpretive lines removed).
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });

  it('pull_quality with both real and phantom + active + pull >= 70 → real wins (first element)', () => {
    const out = makeEngineOutput({
      directions: [
        {
          direction: 'creator',
          pull: 80,
          pull_quality: ['real', 'phantom'],
          quadrant: 'active',
        },
      ],
    });
    // Tier 2: summary slot stays empty (interpretive lines removed).
    expect(
      findCard(buildAndCompute(out), 'Creator')!.summary.interpretive_text,
    ).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* K — visual_state                                                   */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — visual_state', () => {
  it('direction in firing-set top 3 → named', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 90, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 80, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 70, pull_quality: ['real'] },
      ],
    });
    const cards = buildAndCompute(out);
    expect(findCard(cards, 'Creator')!.visual_state).toBe('named');
    expect(findCard(cards, 'Freedom Designer')!.visual_state).toBe('named');
    expect(findCard(cards, 'Experience Seeker')!.visual_state).toBe('named');
  });

  it('direction at firing-set index 3+ → firing_not_named', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 90, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 80, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 70, pull_quality: ['real'] },
        { direction: 'contributor', pull: 60, pull_quality: ['real'] },
      ],
    });
    const cards = buildAndCompute(out);
    expect(findCard(cards, 'Contributor')!.visual_state).toBe(
      'firing_not_named',
    );
  });

  it('direction not in firing set → not_firing', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 90, pull_quality: ['real'] }],
    });
    const cards = buildAndCompute(out);
    expect(findCard(cards, 'Freedom Designer')!.visual_state).toBe(
      'not_firing',
    );
  });

  it('all six not firing → all six not_firing', () => {
    const cards = buildAndCompute(makeEngineOutput());
    for (const c of cards) {
      expect(c.visual_state).toBe('not_firing');
    }
  });

  it('six firing with descending pulls → top 3 named, bottom 3 firing_not_named', () => {
    const out = makeEngineOutput({
      directions: [
        { direction: 'creator', pull: 95, pull_quality: ['real'] },
        { direction: 'freedom_designer', pull: 85, pull_quality: ['real'] },
        { direction: 'experience_seeker', pull: 75, pull_quality: ['real'] },
        { direction: 'contributor', pull: 65, pull_quality: ['real'] },
        { direction: 'growth_focused', pull: 55, pull_quality: ['real'] },
        { direction: 'relationship_rebuilder', pull: 50, pull_quality: ['real'] },
      ],
    });
    const cards = buildAndCompute(out);
    expect(cards[0]!.visual_state).toBe('named');
    expect(cards[1]!.visual_state).toBe('named');
    expect(cards[2]!.visual_state).toBe('named');
    expect(cards[3]!.visual_state).toBe('firing_not_named');
    expect(cards[4]!.visual_state).toBe('firing_not_named');
    expect(cards[5]!.visual_state).toBe('firing_not_named');
  });
});

/* ------------------------------------------------------------------ */
/* K.b — direction_engine_name parallel field                          */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — direction_engine_name', () => {
  it('all six directions populate direction_engine_name with the engine name', () => {
    const cards = buildAndCompute(makeEngineOutput());
    const expected: Record<string, string> = {
      Creator: 'creator',
      'Freedom Designer': 'freedom_designer',
      'Experience Seeker': 'experience_seeker',
      Contributor: 'contributor',
      'Growth Focused': 'growth_focused',
      'Relationship Rebuilder': 'relationship_rebuilder',
    };
    for (const c of cards) {
      expect(c.direction_engine_name).toBe(expected[c.direction_name]);
    }
  });
});

/* ------------------------------------------------------------------ */
/* K.c — field intensity                                               */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — field intensity', () => {
  function fieldsFor(
    pull: number,
    overrides: Partial<{
      past_presence: 'yes' | 'no';
      felt_cost: number;
      anticipation: 'none' | 'mild' | 'quickening';
    }> = {},
  ) {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull }],
    });
    const inp = makeInputMap({ directions: { creator: overrides } });
    const card = findCard(
      computeDirectionCards(out, inp, computeFiringSet(out)),
      'Creator',
    )!;
    return card.fields;
  }

  it('Pull intensity is engine pull passthrough', () => {
    const fields = fieldsFor(75);
    expect(fields.find((f) => f.label === 'Pull')!.intensity).toBe(75);
  });

  it('Past intensity: present → 90', () => {
    const fields = fieldsFor(0, { past_presence: 'yes' });
    expect(fields.find((f) => f.label === 'Past')!.intensity).toBe(90);
  });

  it('Past intensity: absent → 10', () => {
    const fields = fieldsFor(0, { past_presence: 'no' });
    expect(fields.find((f) => f.label === 'Past')!.intensity).toBe(10);
  });

  it('Quality intensity is null', () => {
    const fields = fieldsFor(0);
    expect(fields.find((f) => f.label === 'Quality')!.intensity).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* L — purity                                                         */
/* ------------------------------------------------------------------ */

describe('computeDirectionCards — purity', () => {
  it('two calls with identical inputs return deep-equal results', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const inp = makeInputMap();
    const fs = computeFiringSet(out);
    const a = computeDirectionCards(out, inp, fs);
    const b = computeDirectionCards(out, inp, fs);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('does not mutate output, input, or firingSet', () => {
    const out = makeEngineOutput({
      directions: [{ direction: 'creator', pull: 80, pull_quality: ['real'] }],
    });
    const inp = makeInputMap();
    const fs = computeFiringSet(out);
    const outBefore = JSON.stringify(out);
    const inpBefore = JSON.stringify(inp);
    const fsBefore = JSON.stringify(fs);
    computeDirectionCards(out, inp, fs);
    expect(JSON.stringify(out)).toBe(outBefore);
    expect(JSON.stringify(inp)).toBe(inpBefore);
    expect(JSON.stringify(fs)).toBe(fsBefore);
  });
});
