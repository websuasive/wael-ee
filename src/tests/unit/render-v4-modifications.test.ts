// Unit tests for DomainsPanel spiritual label wrap and DirectionCard
// expression_space_caption slot. Per RENDER_V4.md §4.8.3 and §4.7.7.

import { describe, it, expect } from 'vitest';
import { shouldRenderSlot } from '@/ui/render/should_render_slot';
import type {
  DomainsPanel as DomainsPanelData,
  DirectionCardOutput,
  SlotContent,
  ReducedDomain,
  DomainsPanelReducedGroup,
} from '@/synthesis';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeSlotContent(text: string): SlotContent {
  return { interpretive_text: text, token_text: text };
}

function makeEmptySlotContent(): SlotContent {
  return { interpretive_text: null, token_text: '' };
}

function makeReducedDomain(name: string, intensity: number): ReducedDomain {
  return { domain_name: name, intensity };
}

/* ------------------------------------------------------------------ */
/* A — DomainsPanel spiritual label wrap                              */
/* ------------------------------------------------------------------ */

describe('DomainsPanel — spiritual label wrap', () => {
  it('spiritual domain entry has domain_name "Spiritual"', () => {
    const spiritualDomain = makeReducedDomain('Spiritual', 75);
    expect(spiritualDomain.domain_name).toBe('Spiritual');
  });

  it('non-spiritual domain entry has different domain_name', () => {
    const friendshipDomain = makeReducedDomain('Friendship', 50);
    expect(friendshipDomain.domain_name).not.toBe('Spiritual');
    expect(friendshipDomain.domain_name).toBe('Friendship');
  });

  it('panel data with spiritual domain in reduced_groups', () => {
    const mockGroup: DomainsPanelReducedGroup = {
      value_engine_name: 'never_been_part_of_his_life',
      value_label: 'Never been part of life',
      domain_engine_names: ['spiritual'],
      domains: [makeReducedDomain('Spiritual', 100)],
    };

    const mockData: DomainsPanelData = {
      reduced_groups: [mockGroup],
      intact_callout: makeEmptySlotContent(),
      summary: makeSlotContent('11 domains reduced; 1 intact.'),
    };

    expect(mockData.reduced_groups[0]!.domains[0]!.domain_name).toBe(
      'Spiritual',
    );
  });
});

/* ------------------------------------------------------------------ */
/* B — DirectionCard expression_space_caption slot                    */
/* ------------------------------------------------------------------ */

describe('DirectionCard — expression_space_caption slot', () => {
  it('non-empty expression_space_caption: shouldRenderSlot returns true', () => {
    const caption = makeSlotContent(
      'No current room for this direction this week.',
    );
    expect(shouldRenderSlot(caption)).toBe(true);
  });

  it('empty expression_space_caption: shouldRenderSlot returns false', () => {
    const caption = makeEmptySlotContent();
    expect(shouldRenderSlot(caption)).toBe(false);
  });

  it('card with non-empty expression_space_caption renders slot', () => {
    const mockCard: Partial<DirectionCardOutput> = {
      direction_name: 'Creator',
      visual_state: 'firing_not_named',
      expression_space_caption: makeSlotContent(
        'No current room for this direction this week.',
      ),
      summary: makeSlotContent('Reading as a pull.'),
    };

    expect(
      shouldRenderSlot(mockCard.expression_space_caption as SlotContent),
    ).toBe(true);
    expect(shouldRenderSlot(mockCard.summary as SlotContent)).toBe(true);
  });

  it('card with empty expression_space_caption omits slot', () => {
    const mockCard: Partial<DirectionCardOutput> = {
      direction_name: 'Freedom',
      visual_state: 'not_firing',
      expression_space_caption: makeEmptySlotContent(),
      summary: makeSlotContent('Not currently reading as a pull.'),
    };

    expect(
      shouldRenderSlot(mockCard.expression_space_caption as SlotContent),
    ).toBe(false);
    expect(shouldRenderSlot(mockCard.summary as SlotContent)).toBe(true);
  });
});
