<template>
  <article
    class="direction-card"
    :class="cardClass"
    :style="{ borderLeftColor: props.color, borderLeftWidth: '2px' }"
  >
    <header
      class="direction-card__header"
      :aria-label="headerAriaLabel"
    >
      <span
        v-if="card.visual_state === 'named'"
        class="direction-card__dot"
        :style="{ backgroundColor: props.color }"
        aria-label="Named in headline"
      />
      <span class="direction-card__name">{{ card.direction_name }}</span>
    </header>
    <div class="direction-card__body">
      <p
        v-if="shouldRenderSlot(card.meaning_sentence)"
        class="direction-card__meaning"
      >
        <template
          v-for="(seg, i) in meaningSegments"
          :key="i"
        >
          <TermIndicator
            v-if="seg.kind === 'term'"
            :term="seg.value"
          />
          <template v-else>
            {{ seg.value }}
          </template>
        </template>
      </p>
      <dl class="direction-card__bars">
        <div class="direction-card__bar-row">
          <dt class="direction-card__bar-label">
            Wants it
          </dt>
          <div
            class="direction-card__bar-track"
            role="progressbar"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="pullIntensity"
            :aria-valuetext="`Wants it: ${pullValue}`"
          >
            <div
              class="direction-card__bar-fill"
              :style="{ width: `${pullIntensity}%`, backgroundColor: barFillColor }"
            />
          </div>
          <dd class="direction-card__bar-value">
            {{ pullValue }}
          </dd>
        </div>
        <div class="direction-card__bar-row">
          <dt class="direction-card__bar-label">
            Had it
          </dt>
          <div
            class="direction-card__bar-track"
            role="progressbar"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="pastIntensity"
            :aria-valuetext="`Had it: ${pastValue}`"
          >
            <div
              class="direction-card__bar-fill"
              :style="{ width: `${pastIntensity}%`, backgroundColor: barFillColor }"
            />
          </div>
          <dd class="direction-card__bar-value">
            {{ pastValue }}
          </dd>
        </div>
      </dl>
      <p class="direction-card__inline-meta">
        <span>{{ feltCostValue }} cost</span>
        <span class="direction-card__inline-meta-separator">·</span>
        <span>{{ anticipationValue }}</span>
      </p>
      <p class="direction-card__quality">
        <template
          v-for="(seg, i) in qualitySegments"
          :key="i"
        >
          <TermIndicator
            v-if="seg.kind === 'term'"
            :term="seg.value"
          />
          <template v-else>
            {{ seg.value }}
          </template>
        </template>
      </p>
      <p
        v-if="shouldRenderSlot(card.expression_space_caption)"
        class="direction-card__expression-space-caption"
      >
        <template
          v-for="(seg, i) in expressionSpaceCaptionSegments"
          :key="i"
        >
          <TermIndicator
            v-if="seg.kind === 'term'"
            :term="seg.value"
          />
          <template v-else>
            {{ seg.value }}
          </template>
        </template>
      </p>
      <p
        v-if="shouldRenderSlot(card.summary)"
        class="direction-card__summary"
      >
        <template
          v-for="(seg, i) in summarySegments"
          :key="i"
        >
          <TermIndicator
            v-if="seg.kind === 'term'"
            :term="seg.value"
          />
          <template v-else>
            {{ seg.value }}
          </template>
        </template>
      </p>
      <p
        v-if="card.held_attributed_line"
        class="direction-card__held"
      >
        {{ card.held_attributed_line }}
      </p>
      <p
        v-if="card.surfaced_finding"
        class="direction-card__surfaced-finding"
      >
        {{ card.surfaced_finding }}
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
// DirectionCard — RENDER.md section 4.7. All cards render fully expanded;
// hierarchy carried by per-state visuals (left-edge accent + dot for named,
// plain frame for firing_not_named, tonal recession for not_firing).
import { computed } from 'vue';
import type { CardField, DirectionCardOutput } from '../../../synthesis';
import { shouldRenderSlot } from '../../render/should_render_slot';
import {
  scanTermsInString,
  type TermScanSegment,
} from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';

const props = defineProps<{
  card: DirectionCardOutput;
  color: string;
}>();

const cardClass = computed(() => ({
  'direction-card--named': props.card.visual_state === 'named',
  'direction-card--firing-not-named':
    props.card.visual_state === 'firing_not_named',
  'direction-card--not-firing': props.card.visual_state === 'not_firing',
}));

function describeVisualState(
  state: DirectionCardOutput['visual_state'],
): string {
  switch (state) {
    case 'named':
      return 'named in headline';
    case 'firing_not_named':
      return 'reading as a pull';
    case 'not_firing':
      return 'not currently reading as a pull';
  }
}

const headerAriaLabel = computed<string>(() => {
  const stateLabel = describeVisualState(props.card.visual_state);
  return `${props.card.direction_name} card, ${stateLabel}`;
});

const meaningSegments = computed<TermScanSegment[]>(() => {
  const text =
    props.card.meaning_sentence.interpretive_text ??
    props.card.meaning_sentence.token_text;
  return scanTermsInString(text);
});

const summarySegments = computed<TermScanSegment[]>(() => {
  const text =
    props.card.summary.interpretive_text ?? props.card.summary.token_text;
  return scanTermsInString(text);
});

function fieldByLabel(label: string): CardField | undefined {
  return props.card.fields.find((f) => f.label === label);
}

const pullValue = computed<string>(() => fieldByLabel('Pull')?.value ?? '');
const pastValue = computed<string>(() => fieldByLabel('Past')?.value ?? '');
const feltCostValue = computed<string>(
  () => fieldByLabel('Felt cost')?.value ?? '',
);
const anticipationValue = computed<string>(
  () => fieldByLabel('Anticipation')?.value ?? '',
);
const qualityValue = computed<string>(
  () => fieldByLabel('Quality')?.value ?? '',
);

const pullIntensity = computed<number>(
  () => fieldByLabel('Pull')?.intensity ?? 0,
);
const pastIntensity = computed<number>(
  () => fieldByLabel('Past')?.intensity ?? 0,
);

const barFillColor = computed<string>(() =>
  props.card.visual_state === 'named'
    ? props.color
    : 'var(--color-border-secondary)',
);

const qualitySegments = computed<TermScanSegment[]>(() =>
  scanTermsInString(qualityValue.value),
);

const expressionSpaceCaptionSegments = computed<TermScanSegment[]>(() => {
  const text =
    props.card.expression_space_caption.interpretive_text ??
    props.card.expression_space_caption.token_text;
  return scanTermsInString(text);
});

</script>

<style scoped>
.direction-card {
  border-top: var(--border-hairline) solid var(--color-border-tertiary);
  border-right: var(--border-hairline) solid var(--color-border-tertiary);
  border-bottom: var(--border-hairline) solid var(--color-border-tertiary);
  /* 2px left accent applied via inline :style for every card; colour is
     direction's active token for 'named', a rank-mapped inactive grey
     otherwise. The placeholder transparent border keeps the box-model
     stable before the inline style applies. */
  border-left: 2px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-background-primary);
  overflow: hidden;
}

/* firing_not_named: default treatment (no override needed). */

/* Not firing: pale tonal background recession that distinguishes muted
   cards from the page background (which uses --color-background-secondary)
   and from active cards (which use --color-background-primary). */
.direction-card--not-firing {
  background: var(--color-background-tertiary);
}

.direction-card--not-firing .direction-card__name {
  color: var(--color-text-secondary);
}

.direction-card--not-firing .direction-card__body {
  opacity: 0.85;
}

.direction-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  min-height: var(--control-height-lg);
  padding: var(--space-md);
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--color-text-primary);
}

.direction-card__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-pill);
  flex-shrink: 0;
}

.direction-card__name {
  flex: 1;
}

.direction-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: 0 var(--space-md) var(--space-md);
}

.direction-card__meaning {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
}

.direction-card__bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
  padding: 0;
}

.direction-card__bar-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: var(--space-sm);
  align-items: center;
}

.direction-card__bar-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.direction-card__bar-track {
  height: 6px;
  background: var(--color-border-tertiary);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.direction-card__bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  .direction-card__bar-fill {
    transition: none;
  }
}

.direction-card__bar-value {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  margin: 0;
  text-align: right;
}

.direction-card__inline-meta {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0;
  display: flex;
  gap: var(--space-xs);
  align-items: center;
}

.direction-card__inline-meta-separator {
  color: var(--color-border-tertiary);
}

.direction-card__quality {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  margin: 0;
}

.direction-card__expression-space-caption {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-style: italic;
  color: var(--color-text-tertiary);
}

.direction-card__summary,
.direction-card__held,
.direction-card__surfaced-finding {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--color-text-secondary);
}

@media (min-width: 600px) {
  .direction-card__header {
    min-height: var(--control-height-md);
  }
}
</style>
