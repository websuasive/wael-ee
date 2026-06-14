<script setup lang="ts">
// AssessmentView (stub for v1). In dev mode this acts as a fast-path
// "take the assessment" surface: pick a fixture, store loads it, navigate
// to /results. In production this will be replaced by the real
// questionnaire UI.
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useActiveReadingStore } from '../stores/activeReading';
import { listAvailableAnswers } from '../render/answers_loader';
import { useAppMode } from '../composables/useAppMode';

const router = useRouter();
const store = useActiveReadingStore();
const mode = useAppMode();

const fixtures = computed<string[]>(() => listAvailableAnswers());

async function pick(id: string): Promise<void> {
  await store.loadFromAnswers(id);
  if (!store.hasError) {
    await router.push('/results');
  }
}
</script>

<template>
  <main class="view view-assessment">
    <header class="view-header">
      <h1>Assessment</h1>
      <p
        v-if="mode === 'dev'"
        class="view-subtitle"
      >
        Dev fixture list. Pick a fixture to simulate completing the
        assessment and view the resulting dashboard.
      </p>
      <p
        v-else
        class="view-subtitle"
      >
        The questionnaire will live here. Coming soon.
      </p>
    </header>

    <section
      v-if="mode === 'dev'"
      class="fixture-list"
    >
      <ul>
        <li
          v-for="id in fixtures"
          :key="id"
        >
          <button
            type="button"
            class="fixture-list-item"
            :disabled="store.loading"
            @click="pick(id)"
          >
            {{ id }}
          </button>
        </li>
      </ul>
    </section>

    <p
      v-if="store.hasError"
      class="view-error"
    >
      {{ store.error?.message }}
    </p>
  </main>
</template>
