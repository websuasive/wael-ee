<template>
  <section
    class="direction-cards"
    aria-labelledby="cards-heading"
  >
    <h2
      id="cards-heading"
      class="direction-cards__heading dashboard-card__label"
    >
      {{ headingText }}
    </h2>
    <div class="direction-cards__grid">
      <DirectionCard
        v-for="card in cardsToRender"
        :key="card.direction_engine_name"
        :card="card"
        :color="cardColors[card.direction_engine_name]"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
// DirectionCards — RENDER.md section 4.6. Section landmark + visible h2.
// All cards flow through a single multi-column auto-fit grid; per-card
// visual_state styling (accent, dot, tonal recession) carries the
// hierarchy. Cards are uniformly expanded so heights compose cleanly.
//
// Per-direction colour is computed here and passed down: 'named' cards
// get the direction's active token; non-named cards get a rank-mapped
// inactive grey, where rank is by Pull intensity descending across the
// non-named set. Mirrors the chart's bubble-fill logic so a card's
// left-edge accent matches its corresponding chart bubble.
import { computed } from 'vue';
import type { DirectionCardOutput } from '../../../synthesis';
import type { DirectionName } from '../../../engine';
import { staticCopy } from '../../render/static_copy';
import DirectionCard from './DirectionCard.vue';

const props = defineProps<{
  cards: DirectionCardOutput[];
  showInactive: boolean;
}>();

const headingText = staticCopy.cards_heading;

const leadCards = computed(() =>
  props.cards.filter((c) => c.visual_state === 'named'),
);

const cardsToRender = computed(() => {
  // Suppressed-man fallback: if no lead cards, always show all.
  if (leadCards.value.length === 0) {
    return props.cards;
  }
  // Otherwise: show all if showInactive is true, lead only if false.
  return props.showInactive ? props.cards : leadCards.value;
});

const ACTIVE_COLOR_TOKENS: Record<DirectionName, string> = {
  creator: 'var(--color-direction-creator-active)',
  freedom_designer: 'var(--color-direction-freedom-designer-active)',
  experience_seeker: 'var(--color-direction-experience-seeker-active)',
  growth_focused: 'var(--color-direction-growth-focused-active)',
  relationship_rebuilder: 'var(--color-direction-relationship-rebuilder-active)',
  contributor: 'var(--color-direction-contributor-active)',
};

const INACTIVE_COLOR_TOKENS: readonly string[] = [
  'var(--color-direction-inactive-1)',
  'var(--color-direction-inactive-2)',
  'var(--color-direction-inactive-3)',
  'var(--color-direction-inactive-4)',
  'var(--color-direction-inactive-5)',
  'var(--color-direction-inactive-6)',
];

function pullIntensity(card: DirectionCardOutput): number {
  return card.fields.find((f) => f.label === 'Pull')?.intensity ?? 0;
}

const cardColors = computed<Record<DirectionName, string>>(() => {
  const inactiveSorted = props.cards
    .filter((c) => c.visual_state !== 'named')
    .slice()
    .sort((a, b) => pullIntensity(b) - pullIntensity(a));

  const colors = {} as Record<DirectionName, string>;
  for (const card of props.cards) {
    if (card.visual_state === 'named') {
      colors[card.direction_engine_name] =
        ACTIVE_COLOR_TOKENS[card.direction_engine_name];
    } else {
      const rank = inactiveSorted.findIndex(
        (c) => c.direction_engine_name === card.direction_engine_name,
      );
      const idx = Math.min(
        Math.max(rank, 0),
        INACTIVE_COLOR_TOKENS.length - 1,
      );
      colors[card.direction_engine_name] = INACTIVE_COLOR_TOKENS[idx]!;
    }
  }
  return colors;
});
</script>

<style scoped>
.direction-cards {
  margin-bottom: var(--space-xl);
}

/* Typography supplied by the shared .dashboard-card__label class.
   Component-scoped block kept in case future tweaks are needed. */
.direction-cards__heading {
  margin: 0 0 var(--space-md) 0;
}

.direction-cards__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  align-items: start;
}
</style>
