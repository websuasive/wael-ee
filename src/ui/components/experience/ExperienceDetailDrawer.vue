<script setup lang="ts">
// ExperienceDetailDrawer. Per EXPERIENCE.md sections 6.1, 6.2, 11.4, 11.11.
//
// Slide-in panel from the right on desktop (480px); full-screen overlay on
// mobile per §9. Dismissable via four mechanisms: backdrop click, close
// button, Escape, browser back. The parent (ExperienceLayer) synchronises
// the drawer state with the router, so browser back is wired upstream; this
// component just emits `close` and lets the parent unmount it.
//
// Term scanning: pitch and instruction are scanned with the shared
// render-layer utility (RENDER.md §5.4 — case-sensitive, word-boundary,
// longest-match-wins, first-occurrence-per-string) and term segments wrap
// in <TermIndicator/> so the singleton popover handles explanations.
//
// Body scroll is locked while the drawer is open; restored on unmount.
//
// §11.4 unknown direction tags are silently skipped in the directions row;
// the layer does not validate inventory.

import { computed, onMounted, onUnmounted } from 'vue';
import { useExperienceStatusStore } from '../../experience/status_store';
import { flattenInventory } from '../../experience/flatten';
import inventoryFile from '../../experience/data/experiences.json';
import type {
  ActivityInventoryFile,
  Flag,
  RecommendableVariant,
} from '../../experience/types';
import { experienceCopy } from '../../experience/data/static_copy';
import { valueLabelFor } from '../../experience/data/value_labels';
import { inventoryTagToEngineDirection } from '../../experience/data/direction_mapping';
import {
  scanTermsInString,
  type TermScanSegment,
} from '../../render/term_scanner';
import TermIndicator from '../shared/TermIndicator.vue';

const props = defineProps<{ variantId: string }>();
const emit = defineEmits<{ close: [] }>();

const statusStore = useExperienceStatusStore();
const inventory: readonly RecommendableVariant[] = flattenInventory(
  inventoryFile as ActivityInventoryFile
);

const variant = computed<RecommendableVariant | null>(
  () => inventory.find((v) => v.variant_id === props.variantId) ?? null,
);

const currentFlag = computed(() => {
  const v = variant.value;
  return v === null ? null : statusStore.flagFor(v.variant_id);
});

const pitchSegments = computed<TermScanSegment[]>(() =>
  variant.value === null
    ? []
    : scanTermsInString(variant.value.pitch),
);

const instructionSegments = computed<TermScanSegment[]>(() =>
  variant.value === null
    ? []
    : scanTermsInString(variant.value.instruction),
);

const directionLabels = computed<string[]>(() => {
  const v = variant.value;
  if (v === null) return [];
  const out: string[] = [];
  for (const tag of v.directions) {
    const engine = inventoryTagToEngineDirection[tag];
    if (engine !== undefined) out.push(engine);
  }
  return out;
});

const costLabel = computed<string>(() => {
  const v = variant.value;
  if (v === null) return '';
  if (v.cost_tier === 'free') return experienceCopy.cost_free;
  return lookupOr(`cost_tier_${v.cost_tier}`, v.cost_tier);
});

type CopyLookup = Record<string, string>;
const copyLookup = experienceCopy as unknown as CopyLookup;
function lookupOr(key: string, fallback: string): string {
  return copyLookup[key] ?? fallback;
}

const magnitudeLabel = computed<string>(() => {
  const v = variant.value;
  if (v === null) return '';
  return lookupOr(`magnitude_${v.magnitude}`, v.magnitude);
});

const protocolLabel = computed<string>(() => {
  const v = variant.value;
  if (v === null) return '';
  return lookupOr(`protocol_${v.protocol}`, v.protocol);
});

const exertionLabel = computed<string>(() => {
  const v = variant.value;
  if (v === null) return '';
  return valueLabelFor('exertion', String(v.exertion));
});

const whoWithLabels = computed<string[]>(() => {
  const v = variant.value;
  if (v === null) return [];
  return v.who_with.map((w) => lookupOr(`who_with_${w}`, w));
});


function onSetFlag(flag: Flag): void {
  const v = variant.value;
  if (v === null) return;
  void statusStore.setFlag(v.variant_id, flag);
}

function onClearFlag(): void {
  const v = variant.value;
  if (v === null) return;
  void statusStore.clearFlag(v.variant_id);
}

function onClose(): void {
  emit('close');
}

function onEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault();
    emit('close');
  }
}

onMounted(() => {
  document.addEventListener('keydown', onEscape);
  // Lock body scroll while drawer is open.
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.removeEventListener('keydown', onEscape);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div
      class="variant-drawer-backdrop"
      @click="onClose"
    >
      <aside
        class="variant-drawer"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="variant !== null ? 'variant-drawer-title' : undefined"
        @click.stop
      >
        <button
          type="button"
          class="variant-drawer__close"
          :aria-label="experienceCopy.detail_close_aria"
          @click="onClose"
        >
          <span aria-hidden="true">&times;</span>
        </button>

        <div
          v-if="variant === null"
          class="variant-drawer__not-found"
        >
          <p>{{ experienceCopy.not_found_in_inventory }}</p>
          <button
            type="button"
            class="variant-drawer__close-text"
            @click="onClose"
          >
            {{ experienceCopy.detail_close }}
          </button>
        </div>

        <div
          v-else
          class="variant-drawer__content"
        >
          <h2
            id="variant-drawer-title"
            class="variant-drawer__name"
          >
            {{ variant.label }}
          </h2>

          <p class="variant-drawer__description">
            <template
              v-for="(seg, i) in pitchSegments"
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

          <aside class="variant-drawer__instruction">
            <p class="variant-drawer__section-label">
              {{ experienceCopy.detail_instruction_label }}
            </p>
            <p class="variant-drawer__instruction-text">
              <template
                v-for="(seg, i) in instructionSegments"
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
          </aside>

          <dl class="variant-drawer__facets">
            <div
              v-if="directionLabels.length > 0"
              class="variant-drawer__facet-row"
            >
              <dt>{{ experienceCopy.detail_facets_directions }}</dt>
              <dd>
                <span
                  v-for="d in directionLabels"
                  :key="d"
                  class="variant-drawer__facet-badge"
                >{{ d }}</span>
              </dd>
            </div>
            <div class="variant-drawer__facet-row">
              <dt>Cost</dt>
              <dd>
                <span class="variant-drawer__facet-badge">{{ costLabel }}</span>
              </dd>
            </div>
            <div class="variant-drawer__facet-row">
              <dt>Magnitude</dt>
              <dd>
                <span class="variant-drawer__facet-badge">{{ magnitudeLabel }}</span>
              </dd>
            </div>
            <div class="variant-drawer__facet-row">
              <dt>Protocol</dt>
              <dd>
                <span class="variant-drawer__facet-badge">{{ protocolLabel }}</span>
              </dd>
            </div>
            <div class="variant-drawer__facet-row">
              <dt>Exertion</dt>
              <dd>
                <span class="variant-drawer__facet-badge">{{ exertionLabel }}</span>
              </dd>
            </div>
            <div
              v-if="whoWithLabels.length > 0"
              class="variant-drawer__facet-row"
            >
              <dt>Who with</dt>
              <dd>
                <span
                  v-for="w in whoWithLabels"
                  :key="w"
                  class="variant-drawer__facet-badge"
                >{{ w }}</span>
              </dd>
            </div>
            <div
              v-if="variant.interest_domains.length > 0"
              class="variant-drawer__facet-row"
            >
              <dt>{{ experienceCopy.detail_facets_interest_domains }}</dt>
              <dd>
                <span
                  v-for="d in variant.interest_domains"
                  :key="d"
                  class="variant-drawer__facet-badge"
                >{{ d }}</span>
              </dd>
            </div>
          </dl>

          <section
            v-if="variant.websites.length > 0"
            class="variant-drawer__websites"
          >
            <h3 class="variant-drawer__section-heading">
              Websites
            </h3>
            <ul class="variant-drawer__website-list">
              <li
                v-for="(url, idx) in variant.websites"
                :key="idx"
              >
                <a
                  :href="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="variant-drawer__website-link"
                >{{ url }}</a>
              </li>
            </ul>
          </section>

          <section class="variant-drawer__status">
            <h3 class="variant-drawer__section-heading">
              {{ experienceCopy.detail_status_label }}
            </h3>
            <div class="variant-drawer__status-buttons">
              <button
                type="button"
                class="variant-drawer__status-button"
                :class="{ 'variant-drawer__status-button--active': currentFlag?.flag === 'saved' }"
                @click="onSetFlag('saved')"
              >
                {{ experienceCopy.action_save }}
              </button>
              <button
                type="button"
                class="variant-drawer__status-button"
                :class="{ 'variant-drawer__status-button--active': currentFlag?.flag === 'booked' }"
                @click="onSetFlag('booked')"
              >
                {{ experienceCopy.action_mark_booked }}
              </button>
              <button
                type="button"
                class="variant-drawer__status-button"
                :class="{ 'variant-drawer__status-button--active': currentFlag?.flag === 'done' }"
                @click="onSetFlag('done')"
              >
                {{ experienceCopy.action_mark_done }}
              </button>
              <button
                type="button"
                class="variant-drawer__status-button"
                :class="{ 'variant-drawer__status-button--active': currentFlag?.flag === 'not_interested' }"
                @click="onSetFlag('not_interested')"
              >
                {{ experienceCopy.action_not_interested }}
              </button>
              <button
                v-if="currentFlag !== null"
                type="button"
                class="variant-drawer__status-button variant-drawer__status-button--clear"
                @click="onClearFlag"
              >
                {{ experienceCopy.action_clear }}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.variant-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-background-overlay);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.variant-drawer {
  width: var(--drawer-width);
  max-width: 100%;
  height: 100%;
  background: var(--color-background-primary);
  overflow-y: auto;
  padding: var(--space-xl) var(--space-lg);
  position: relative;
  animation: variant-drawer-slide-in 200ms var(--easing-standard);
  box-shadow: var(--shadow-lg);
}

@keyframes variant-drawer-slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .variant-drawer {
    animation: none;
  }
}

@media (max-width: 600px) {
  .variant-drawer {
    width: 100%;
  }
}

.variant-drawer__close {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: transparent;
  border: none;
  font-size: var(--text-3xl);
  color: var(--color-text-tertiary);
  cursor: pointer;
  line-height: 1;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  min-width: var(--control-height-md);
  min-height: var(--control-height-md);
  transition: color var(--duration-fast);
}

.variant-drawer__close:hover {
  color: var(--color-text-primary);
}

.variant-drawer__close:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: -2px;
}

.variant-drawer__not-found {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  font-family: var(--font-sans);
  color: var(--color-text-secondary);
}

.variant-drawer__close-text {
  margin-top: var(--space-md);
  background: transparent;
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-lg);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  cursor: pointer;
}

.variant-drawer__name {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 var(--space-3xl) var(--space-lg) 0;
  line-height: var(--leading-snug);
}

.variant-drawer__description {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
  margin: 0 0 var(--space-lg);
}

.variant-drawer__section-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin: 0 0 var(--space-xs);
}

.variant-drawer__why-it-works-text {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-style: italic;
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.variant-drawer__facets {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin: 0 0 var(--space-lg);
}

.variant-drawer__facet-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--space-sm);
  align-items: baseline;
}

.variant-drawer__facet-row dt {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.variant-drawer__facet-row dd {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.variant-drawer__facet-badge {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  padding: var(--space-xxs) var(--space-sm);
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.variant-drawer__section-heading {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-sm);
  padding-bottom: var(--space-xs);
  border-bottom: var(--border-hairline) solid var(--color-border-tertiary);
}

.variant-drawer__status-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.variant-drawer__status-button {
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-sm);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    border-color var(--duration-fast),
    color var(--duration-fast);
}

.variant-drawer__status-button:hover {
  border-color: var(--color-text-primary);
}

.variant-drawer__status-button:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 1px;
}

.variant-drawer__status-button--active {
  background: var(--color-text-primary);
  color: var(--color-background-primary);
  border-color: var(--color-text-primary);
}

.variant-drawer__status-button--clear {
  color: var(--color-text-tertiary);
}
</style>
