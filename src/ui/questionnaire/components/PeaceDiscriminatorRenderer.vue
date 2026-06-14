<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useQuestionnaireStore } from '../../stores/questionnaire';
import type { QuestionDef } from '../../questionnaire/types';
import type { DomainKey } from '@/assembler/answers';
import { computeFadedDomains } from '@/assembler/domains';
import { DOMAIN_LABELS } from '../../questionnaire/utils/domainLabels';

const props = defineProps<{
  question: QuestionDef;
}>();

const store = useQuestionnaireStore();

// Initialize peace_discriminator to {} when page is reached (only if absent)
// This ensures the field is PRESENT (validator requirement) even with no picks
onMounted(() => {
  const currentValue = store.answers[props.question.id];
  if (currentValue === undefined || currentValue === null) {
    // Only set {} if currently absent - preserves existing picks on re-visit
    store.setAnswer(props.question.id, {});
  }
});

// Compute faded domains reactively by calling assembler's computeFadedDomains
const fadedDomains = computed(() => {
  const currentAnswers = store.toAnswersObject;
  return computeFadedDomains(currentAnswers as any);
});

// Get current peace map from store
const currentPeace = computed(() => {
  const value = store.answers[props.question.id];
  return (value as Partial<Record<DomainKey, 'made_peace' | 'still_misses'>>) || {};
});

// Get choice for a specific domain - plain function, reactivity via currentPeace computed
function getChoice(domain: DomainKey): 'made_peace' | 'still_misses' | undefined {
  return currentPeace.value[domain];
}

// Pure function: compute updated peace map
function computeUpdatedPeaceMap(
  currentMap: Partial<Record<DomainKey, 'made_peace' | 'still_misses'>>,
  domain: DomainKey,
  choice: 'made_peace' | 'still_misses',
): Partial<Record<DomainKey, 'made_peace' | 'still_misses'>> {
  return {
    ...currentMap,
    [domain]: choice,
  };
}

// Handle choice change for a domain
function handleChoice(domain: DomainKey, choice: 'made_peace' | 'still_misses'): void {
  const updatedMap = computeUpdatedPeaceMap(currentPeace.value, domain, choice);
  store.setAnswer(props.question.id, updatedMap);
}

// Get label for a domain
function getDomainLabel(domain: DomainKey): string {
  return DOMAIN_LABELS[domain] || domain;
}
</script>

<template>
  <div class="peace-discriminator">
    <p class="peace-discriminator__prompt">{{ question.prompt }}</p>
    <p v-if="question.help" class="peace-discriminator__help">{{ question.help }}</p>
    <div class="peace-rows">
      <div v-for="domain in fadedDomains" :key="domain" class="peace-row">
        <div class="domain-label">{{ getDomainLabel(domain) }}</div>
        <div class="choice-buttons">
          <button
            type="button"
            :class="{ selected: getChoice(domain) === 'made_peace' }"
            @click="handleChoice(domain, 'made_peace')"
          >
            I'm fine without it
          </button>
          <button
            type="button"
            :class="{ selected: getChoice(domain) === 'still_misses' }"
            @click="handleChoice(domain, 'still_misses')"
          >
            I want it back
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.peace-discriminator {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.peace-discriminator__prompt {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
  margin: 0;
}

.peace-discriminator__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.peace-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.peace-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.domain-label {
  font-size: var(--text-md);
  color: var(--color-text-primary);
}

.choice-buttons {
  display: flex;
  gap: var(--space-sm);
}

.choice-buttons button {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border-primary);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-size: var(--text-md);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.choice-buttons button:hover {
  border-color: var(--color-border-secondary);
}

.choice-buttons button.selected {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
  color: var(--color-text-primary);
}
</style>
