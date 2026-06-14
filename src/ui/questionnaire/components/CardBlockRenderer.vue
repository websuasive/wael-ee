<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue';
import { useQuestionnaireStore } from '../../stores/questionnaire';
import type { PageDef } from '../../questionnaire/types';
import { resolveGatedC } from '../../questionnaire/utils/cardGateLogic';

const props = defineProps<{
  page: PageDef;
}>();

const store = useQuestionnaireStore();

// Card pages are guaranteed to have 3 sub-questions (a, b, c)
const subA = computed(() => props.page.questions[0]!);
const subB = computed(() => props.page.questions[1]!);
const subC = computed(() => props.page.questions[2]!);

const aValue = computed(() => store.answers[subA.value.id] as string | undefined);
const bValue = computed(() => store.answers[subB.value.id] as string | undefined);
const cValue = computed(() => store.answers[subC.value.id] as string | undefined);

const showB = computed(() => aValue.value !== undefined && aValue.value !== null);
const showC = computed(() => {
  if (!showB.value) return false;
  if (bValue.value === undefined || bValue.value === null) return false;
  // Check the c-gate: conditionalOn says show when b != 'a'
  const gate = subC.value.conditionalOn;
  if (gate && typeof gate !== 'string' && gate.operator === 'not_equals') {
    return bValue.value !== gate.value;
  }
  return true;
});

const subBRef = ref<HTMLElement | null>(null);
const subCRef = ref<HTMLElement | null>(null);

// Scroll to sub-b when it reveals
watch(showB, async (newVal, oldVal) => {
  if (newVal && !oldVal && subBRef.value) {
    await nextTick();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    subBRef.value.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }
});

// Scroll to sub-c when it reveals
watch(showC, async (newVal, oldVal) => {
  if (newVal && !oldVal && subCRef.value) {
    await nextTick();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    subCRef.value.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }
});

// Write 'skipped' when the gate fires (b == gate value)
watch(bValue, (newB, oldB) => {
  const gate = subC.value.conditionalOn;
  if (gate && typeof gate !== 'string' && gate.operator === 'not_equals' && gate.value) {
    const gateValue = gate.value;
    const decision = resolveGatedC(newB, oldB, gateValue, cValue.value);
    
    // Only write when the decision differs from current c
    if (decision !== 'no_change' && decision !== cValue.value) {
      store.setAnswer(subC.value.id, decision as any);
    }
  }
});

function selectOption(questionId: string, value: string): void {
  store.setAnswer(questionId, value);
}
</script>

<template>
  <div class="card-block">
    <!-- Sub-a: always visible -->
    <div class="card-block__sub-question">
      <p class="card-block__prompt">{{ subA!.prompt }}</p>
      <p v-if="subA!.help" class="card-block__help">{{ subA!.help }}</p>
      <div class="card-block__options">
        <button
          v-for="option in subA!.options"
          :key="option.value"
          type="button"
          class="card-block__option"
          :class="{ 'card-block__option--selected': aValue === option.value }"
          :aria-pressed="aValue === option.value"
          @click="selectOption(subA!.id, option.value)"
        >
          <span class="card-block__option-content">
            <span class="card-block__option-label">{{ option.label }}</span>
            <span v-if="option.help" class="card-block__option-help">{{ option.help }}</span>
          </span>
        </button>
      </div>
    </div>

    <!-- Sub-b: progressive reveal, felt register -->
    <div v-if="showB" ref="subBRef" class="card-block__sub-question">
      <p class="card-block__prompt card-block__prompt--felt">{{ subB!.prompt }}</p>
      <p v-if="subB!.help" class="card-block__help">{{ subB!.help }}</p>
      <div class="card-block__options">
        <button
          v-for="option in subB!.options"
          :key="option.value"
          type="button"
          class="card-block__option"
          :class="{ 'card-block__option--selected': bValue === option.value }"
          :aria-pressed="bValue === option.value"
          @click="selectOption(subB!.id, option.value)"
        >
          <span class="card-block__option-content">
            <span class="card-block__option-label">{{ option.label }}</span>
            <span v-if="option.help" class="card-block__option-help">{{ option.help }}</span>
          </span>
        </button>
      </div>
    </div>

    <!-- Sub-c: progressive reveal, gated on b != 'a' -->
    <div v-if="showC" ref="subCRef" class="card-block__sub-question">
      <p class="card-block__prompt">{{ subC!.prompt }}</p>
      <p v-if="subC!.help" class="card-block__help">{{ subC!.help }}</p>
      <div class="card-block__options">
        <button
          v-for="option in subC!.options"
          :key="option.value"
          type="button"
          class="card-block__option"
          :class="{ 'card-block__option--selected': cValue === option.value }"
          :aria-pressed="cValue === option.value"
          @click="selectOption(subC!.id, option.value)"
        >
          <span class="card-block__option-content">
            <span class="card-block__option-label">{{ option.label }}</span>
            <span v-if="option.help" class="card-block__option-help">{{ option.help }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}


.card-block__sub-question {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}


.card-block__prompt {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  margin: 0;
}

.card-block__prompt--felt {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
}

.card-block__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
  font-style: italic;
}

.card-block__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.card-block__option {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  border: var(--border-hairline) solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--duration-fast), background-color var(--duration-fast);
  min-height: var(--control-height-md);
  display: flex;
  align-items: flex-start;
}

.card-block__option-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.card-block__option-label {
  color: var(--color-text-primary);
}

.card-block__option-help {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: var(--leading-normal);
  font-style: italic;
}


.card-block__option:hover {
  border-color: var(--color-text-tertiary);
}

.card-block__option:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.card-block__option--selected {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
  color: var(--color-text-primary);
}
</style>
