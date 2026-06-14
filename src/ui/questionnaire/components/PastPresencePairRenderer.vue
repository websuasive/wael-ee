<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue';
import { useQuestionnaireStore } from '../../stores/questionnaire';
import type { PageDef } from '../../questionnaire/types';

const props = defineProps<{
  page: PageDef;
}>();

const store = useQuestionnaireStore();

// Page has exactly two questions: q8 and q9
const q8 = computed(() => props.page.questions[0]!);
const q9 = computed(() => props.page.questions[1]!);

// Read q8 current value from store
const q8Value = computed(() => {
  return store.answers['q8'] as string[] || [];
});

// Read q9 current value from store
const q9Value = computed(() => {
  return store.answers['q9'] as string[] || [];
});

// Compute q9's visible options: only directions currently ticked in q8
const q9VisibleOptions = computed(() => {
  const tickedInQ8 = q8Value.value;
  const options = q9.value.options || [];
  return options.filter((opt) => tickedInQ8.includes(opt.value));
});

// Visibility: q9 only renders when q8 has >=1 tick
const showQ9 = computed(() => q8Value.value.length > 0);

// Ref for scrolling to q9 when it reveals
const q9Ref = ref<HTMLElement | null>(null);

// Scroll to q9 when it reveals
watch(showQ9, async (newVal, oldVal) => {
  if (newVal && !oldVal && q9Ref.value) {
    await nextTick();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    q9Ref.value.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }
});

// LIVE PRUNE: when q8 changes, remove any directions from q9 that are no longer in q8
watch(q8Value, (newQ8) => {
  const currentQ9 = q9Value.value;
  const prunedQ9 = currentQ9.filter((dir) => newQ8.includes(dir));

  // Only write if something was actually pruned
  if (prunedQ9.length !== currentQ9.length) {
    store.setAnswer('q9', prunedQ9);
  }
});

// Toggle q8 option
function toggleQ8(value: string): void {
  const current = q8Value.value;
  if (current.includes(value)) {
    store.setAnswer('q8', current.filter((v) => v !== value));
  } else {
    store.setAnswer('q8', [...current, value]);
  }
}

// Toggle q9 option
function toggleQ9(value: string): void {
  const current = q9Value.value;
  if (current.includes(value)) {
    store.setAnswer('q9', current.filter((v) => v !== value));
  } else {
    store.setAnswer('q9', [...current, value]);
  }
}
</script>

<template>
  <div class="past-presence-pair">
    <!-- Q8: always visible, tick_any over six directions -->
    <div class="past-presence-pair__question">
      <p class="past-presence-pair__prompt">{{ q8.prompt }}</p>
      <p v-if="q8.help" class="past-presence-pair__help">{{ q8.help }}</p>
      <div class="past-presence-pair__options">
        <label
          v-for="option in q8.options"
          :key="option.value"
          class="past-presence-pair__option"
        >
          <input
            type="checkbox"
            class="past-presence-pair__checkbox"
            :checked="q8Value.includes(option.value)"
            @change="toggleQ8(option.value)"
          >
          <span class="past-presence-pair__label-content">
            <span class="past-presence-pair__label">{{ option.label }}</span>
            <span v-if="option.help" class="past-presence-pair__option-help">{{ option.help }}</span>
          </span>
        </label>
      </div>
    </div>

    <!-- Q9: only visible when q8 has >=1 tick, options filtered to q8 ticks -->
    <div v-if="showQ9" ref="q9Ref" class="past-presence-pair__question">
      <p class="past-presence-pair__prompt">{{ q9.prompt }}</p>
      <p v-if="q9.help" class="past-presence-pair__help">{{ q9.help }}</p>
      <div class="past-presence-pair__options">
        <label
          v-for="option in q9VisibleOptions"
          :key="option.value"
          class="past-presence-pair__option"
        >
          <input
            type="checkbox"
            class="past-presence-pair__checkbox"
            :checked="q9Value.includes(option.value as string)"
            @change="toggleQ9(option.value as string)"
          >
          <span class="past-presence-pair__label-content">
            <span class="past-presence-pair__label">{{ option.label }}</span>
            <span v-if="option.help" class="past-presence-pair__option-help">{{ option.help }}</span>
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.past-presence-pair {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.past-presence-pair__question {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.past-presence-pair__prompt {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
  margin: 0;
}

.past-presence-pair__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.past-presence-pair__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.past-presence-pair__option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-xxs) 0;
}

.past-presence-pair__checkbox {
  margin: 0;
  cursor: pointer;
  accent-color: var(--color-accent);
}

.past-presence-pair__label-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.past-presence-pair__label {
  color: var(--color-text-secondary);
}

.past-presence-pair__option-help {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: var(--leading-normal);
  font-style: italic;
}
</style>
