<script setup lang="ts">
import { computed } from 'vue';
import { useQuestionnaireStore } from '../../stores/questionnaire';
import type { QuestionDef } from '../../questionnaire/types';
import { DIRECTION_LABELS, DIRECTION_KEYS } from '../../questionnaire/utils/directionLabels';

const props = defineProps<{
  question: QuestionDef;
}>();

const store = useQuestionnaireStore();

const TOTAL_BUDGET = 70;
const MAX_DIRECTIONS = 3;

// Get current allocation map from store
const currentAllocation = computed(() => {
  const value = store.answers[props.question.id];
  return (value as Record<string, number>) || {};
});

// Compute sum of all allocations
const totalAllocated = computed(() => {
  return Object.values(currentAllocation.value).reduce((sum, amount) => sum + amount, 0);
});

// Compute remaining budget
const remaining = computed(() => {
  return TOTAL_BUDGET - totalAllocated.value;
});

// Count how many directions have positive allocations
const allocatedCount = computed(() => {
  return Object.keys(currentAllocation.value).filter(key => {
    const amount = currentAllocation.value[key];
    return amount !== undefined && amount > 0;
  }).length;
});

// Get amount for a specific direction (0 if not allocated)
function getAmount(direction: string): number {
  return currentAllocation.value[direction] || 0;
}

// Check if a direction can accept input (not at max directions unless already allocated)
function canAllocate(direction: string): boolean {
  const hasAmount = getAmount(direction) > 0;
  return hasAmount || allocatedCount.value < MAX_DIRECTIONS;
}

// Handle input change for a direction
function handleInput(direction: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const rawValue = input.value;
  
  // Empty input means remove from allocation
  if (rawValue === '') {
    removeFromAllocation(direction);
    input.value = '';
    return;
  }
  
  const value = Number(rawValue);
  
  // Validate and clamp
  if (isNaN(value) || value < 0) {
    input.value = String(getAmount(direction));
    return;
  }
  
  // Clamp to 0-70
  const clampedValue = Math.min(Math.max(0, value), TOTAL_BUDGET);
  
  // Check if this would exceed remaining budget
  const currentAmount = getAmount(direction);
  const delta = clampedValue - currentAmount;
  
  if (delta > remaining.value) {
    // Would exceed budget - clamp to remaining
    const maxAllowed = currentAmount + remaining.value;
    setAllocation(direction, maxAllowed);
    input.value = String(maxAllowed);
    return;
  }
  
  // Set allocation (handles 0 by removing from map)
  setAllocation(direction, clampedValue);
  if (clampedValue !== value) {
    input.value = String(clampedValue);
  }
}

// Set allocation for a direction (removes if amount <= 0)
function setAllocation(direction: string, amount: number): void {
  if (amount <= 0) {
    removeFromAllocation(direction);
  } else {
    const updatedMap = {
      ...currentAllocation.value,
      [direction]: amount,
    };
    store.setAnswer(props.question.id, updatedMap);
  }
}

// Remove a direction from allocation
function removeFromAllocation(direction: string): void {
  const updatedMap = { ...currentAllocation.value };
  delete updatedMap[direction];
  store.setAnswer(props.question.id, updatedMap);
}

// Get label for a direction
function getDirectionLabel(direction: string): string {
  return DIRECTION_LABELS[direction] || direction;
}
</script>

<template>
  <div class="allocation">
    <p class="allocation__prompt">{{ question.prompt }}</p>
    <p v-if="question.help" class="allocation__help">{{ question.help }}</p>
    
    <div class="allocation__remaining">
      £{{ remaining }} of £{{ TOTAL_BUDGET }} remaining
    </div>
    
    <div class="allocation__directions">
      <div
        v-for="direction in DIRECTION_KEYS"
        :key="direction"
        class="allocation__direction"
      >
        <label :for="`${question.id}-${direction}`" class="allocation__label">
          {{ getDirectionLabel(direction) }}
        </label>
        <div class="allocation__input-wrapper">
          <span class="allocation__currency">£</span>
          <input
            :id="`${question.id}-${direction}`"
            type="number"
            min="0"
            :max="TOTAL_BUDGET"
            :value="getAmount(direction) || ''"
            :disabled="!canAllocate(direction)"
            class="allocation__input"
            placeholder="0"
            @input="handleInput(direction, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.allocation {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.allocation__prompt {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
  margin: 0;
}

.allocation__help {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin: 0;
}

.allocation__remaining {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-accent);
  line-height: var(--leading-tight);
}

.allocation__directions {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.allocation__direction {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.allocation__label {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
}

.allocation__input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.allocation__currency {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
}

.allocation__input {
  width: 100px;
  padding: var(--space-xs) var(--space-sm);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-sm);
  transition: border-color var(--duration-fast);
}

.allocation__input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.allocation__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.allocation__input::placeholder {
  color: var(--color-text-tertiary);
}
</style>
