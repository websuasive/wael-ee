<!-- THROWAWAY generic renderer for proving the flow. -->
<!-- Not a real renderer; deliberately plain with dummy controls. -->

<script setup lang="ts">
import { useQuestionnaireStore } from '../../stores/questionnaire';
import type { QuestionDef } from '../types';

const props = defineProps<{
  question: QuestionDef;
}>();

const store = useQuestionnaireStore();

function setPlaceholderAnswer(): void {
  // Handle different answer types based on renderer
  if (props.question.renderer === 'allocation') {
    // For allocation renderer, set a sample allocation map
    store.setAnswer(props.question.id, { creator: 35 });
  } else if (props.question.renderer === 'peace_discriminator') {
    // For peace_discriminator renderer, set a sample peace map
    store.setAnswer(props.question.id, { time_as_yours: 'still_misses' });
  } else {
    // Default placeholder for other renderers
    store.setAnswer(props.question.id, 'placeholder');
  }
}
</script>

<template>
  <div class="stub-renderer">
    <p class="prompt">{{ question.prompt }}</p>
    <p class="question-id">Question ID: {{ question.id }}</p>
    <p v-if="question.help" class="help">{{ question.help }}</p>
    <p v-if="question.required" class="required">Required</p>
    <p v-else class="not-required">Not required</p>
    <p v-if="question.conditionalOn" class="conditional">
      Conditional on: {{ question.conditionalOn }}
    </p>
    <button @click="setPlaceholderAnswer">Set placeholder answer</button>
  </div>
</template>

<style scoped>
.stub-renderer {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
}

.prompt {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.question-id {
  font-family: monospace;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.help {
  font-style: italic;
  color: #555;
  margin-bottom: 0.5rem;
}

.required {
  color: #900;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.not-required {
  color: #090;
  margin-bottom: 0.5rem;
}

.conditional {
  color: #006;
  margin-bottom: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  cursor: pointer;
}
</style>
