<script setup lang="ts">
import { computed } from 'vue';
import { useQuestionnaireStore } from '../../stores/questionnaire';
import type { QuestionDef, DomainSliderConfig } from '../../questionnaire/types';

const props = defineProps<{
  question: QuestionDef;
}>();

const store = useQuestionnaireStore();

// Extract domains from config - assume new object format
const domains = computed((): DomainSliderConfig[] => {
  const rawDomains = props.question.config?.domains as DomainSliderConfig[] | undefined;
  return rawDomains || [];
});

const sliderMin = computed(() => (props.question.config?.sliderMin as number) || 0);
const sliderMax = computed(() => (props.question.config?.sliderMax as number) || 100);

// Get current Record value for this composite id
const currentRecord = computed(() => {
  const value = store.answers[props.question.id];
  return (value as Record<string, number>) || {};
});

// Check if a domain has been set (exists in the Record)
function isDomainSet(domain: string): boolean {
  return currentRecord.value[domain] !== undefined && currentRecord.value[domain] !== null;
}

// Get value for a specific domain
function getDomainValue(domain: string): number | undefined {
  return currentRecord.value[domain];
}

// Primary write handler: fires when value changes (drag/click/keyboard that moves slider)
function handleInput(domain: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = Number(input.value);
  const updatedRecord = {
    ...currentRecord.value,
    [domain]: value,
  };
  store.setAnswer(props.question.id, updatedRecord);
}

// Settled-event handler: catches deliberate no-change set (click/key at rest position)
function handleChange(domain: string, event: Event): void {
  // Only write if domain not yet set (deliberate first interaction at rest position)
  if (!isDomainSet(domain)) {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    const updatedRecord = {
      ...currentRecord.value,
      [domain]: value,
    };
    store.setAnswer(props.question.id, updatedRecord);
  }
}
</script>

<template>
  <div class="domain-sliders">
    <p class="domain-sliders__instruction">{{ question.prompt }}</p>
    <p v-if="question.help" class="domain-sliders__help">{{ question.help }}</p>

    <div class="domain-sliders__sliders">
      <div
        v-for="domainConfig in domains"
        :key="domainConfig.key"
        class="domain-sliders__slider-group"
      >
        <label :for="`${question.id}-${domainConfig.key}`" class="domain-sliders__label">
          {{ domainConfig.label }}
        </label>
        <input
          :id="`${question.id}-${domainConfig.key}`"
          type="range"
          :min="sliderMin"
          :max="sliderMax"
          :value="getDomainValue(domainConfig.key) ?? 50"
          :data-unset="!isDomainSet(domainConfig.key)"
          class="domain-sliders__slider"
          @input="handleInput(domainConfig.key, $event)"
          @change="handleChange(domainConfig.key, $event)"
        />
        <div v-if="domainConfig.minLabel || domainConfig.maxLabel" class="domain-sliders__labels">
          <span v-if="domainConfig.minLabel" class="domain-sliders__label-text domain-sliders__label-text--left">
            {{ domainConfig.minLabel }}
          </span>
          <span v-if="domainConfig.maxLabel" class="domain-sliders__label-text domain-sliders__label-text--right">
            {{ domainConfig.maxLabel }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.domain-sliders {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.domain-sliders__instruction {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
  margin: 0;
}

.domain-sliders__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.domain-sliders__sliders {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.domain-sliders__slider-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.domain-sliders__label {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
}

.domain-sliders__labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-xs);
}

.domain-sliders__label-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.domain-sliders__label-text--left {
  text-align: left;
}

.domain-sliders__label-text--right {
  text-align: right;
}

.domain-sliders__slider {
  width: 100%;
  height: var(--control-height-sm);
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.domain-sliders__slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: var(--color-border-secondary);
  border-radius: var(--radius-sm);
}

.domain-sliders__slider[data-unset="true"]::-webkit-slider-runnable-track {
  background: var(--color-border-tertiary);
  opacity: 0.5;
}

.domain-sliders__slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  margin-top: -8px;
}

.domain-sliders__slider[data-unset="true"]::-webkit-slider-thumb {
  opacity: 0;
  pointer-events: none;
}

.domain-sliders__slider::-moz-range-track {
  width: 100%;
  height: 4px;
  background: var(--color-border-secondary);
  border-radius: var(--radius-sm);
}

.domain-sliders__slider[data-unset="true"]::-moz-range-track {
  background: var(--color-border-tertiary);
  opacity: 0.5;
}

.domain-sliders__slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: none;
}

.domain-sliders__slider[data-unset="true"]::-moz-range-thumb {
  opacity: 0;
  pointer-events: none;
}

.domain-sliders__slider:focus-visible {
  outline: none;
}

.domain-sliders__slider:focus-visible::-webkit-slider-thumb {
  box-shadow: var(--shadow-focus);
}

.domain-sliders__slider:focus-visible::-moz-range-thumb {
  box-shadow: var(--shadow-focus);
}
</style>
