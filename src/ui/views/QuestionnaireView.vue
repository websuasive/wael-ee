<!-- Routed view for the questionnaire. Inits store with stub manifest on mount. -->
<!-- Placed in src/ui/views/ to match existing view convention. -->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuestionnaireStore } from '../stores/questionnaire';
import { useQuestionnaireFlow } from '../composables/useQuestionnaireFlow';
import manifest from '../questionnaire/data/manifest';
import { localStorageStub } from '../questionnaire/persistence/localStorageStub';
import StubRenderer from '../questionnaire/components/StubRenderer.vue';
import SingleSelectRenderer from '../questionnaire/components/SingleSelectRenderer.vue';
import FeltRenderer from '../questionnaire/components/FeltRenderer.vue';
import TickAnyRenderer from '../questionnaire/components/TickAnyRenderer.vue';
import SliderRenderer from '../questionnaire/components/SliderRenderer.vue';
import CappedMultiRenderer from '../questionnaire/components/CappedMultiRenderer.vue';
import CardBlockRenderer from '../questionnaire/components/CardBlockRenderer.vue';
import PastPresencePairRenderer from '../questionnaire/components/PastPresencePairRenderer.vue';
import DomainSlidersRenderer from '../questionnaire/components/DomainSlidersRenderer.vue';
import AllocationRenderer from '../questionnaire/components/AllocationRenderer.vue';
import PeaceDiscriminatorRenderer from '../questionnaire/components/PeaceDiscriminatorRenderer.vue';
import ContentRenderer from '../questionnaire/components/ContentRenderer.vue';

const store = useQuestionnaireStore();
const { currentPage, canAdvance, canPrev, progress, next, prev } = useQuestionnaireFlow();

const showResetConfirm = ref(false);

onMounted(async () => {
  store.init(manifest, localStorageStub, 'dev-user');
  await store.hydrate();
});

const rendererComponent = computed(() => {
  return (rendererType: string) => {
    switch (rendererType) {
      case 'single_select':
        return SingleSelectRenderer;
      case 'felt':
        return FeltRenderer;
      case 'tick_any':
        return TickAnyRenderer;
      case 'slider':
        return SliderRenderer;
      case 'capped_multi':
        return CappedMultiRenderer;
      case 'domain_sliders':
        return DomainSlidersRenderer;
      case 'allocation':
        return AllocationRenderer;
      case 'peace_discriminator':
        return PeaceDiscriminatorRenderer;
      case 'card_block':
      default:
        return StubRenderer;
    }
  };
});

async function handleReset(): Promise<void> {
  showResetConfirm.value = false;
  await store.reset();
}

function cancelReset(): void {
  showResetConfirm.value = false;
}
</script>

<template>
  <div class="questionnaire-view">
    <!-- Mode indicator badge -->
    <div class="mode-badge" :class="store.mode">
      <span v-if="store.mode === 'fixture'" class="mode-badge-text">
        FIXTURE: {{ store.fixtureId || 'unknown' }}
      </span>
      <span v-else class="mode-badge-text">LIVE TEST</span>
    </div>

    <div v-if="currentPage" class="page">
      <!-- Content page: render as single unit via ContentRenderer -->
      <ContentRenderer
        v-if="currentPage.kind === 'content'"
        :page="currentPage"
      />

      <!-- Card page: render as single unit via CardBlockRenderer -->
      <CardBlockRenderer
        v-else-if="currentPage.kind === 'card'"
        :page="currentPage"
      />

      <!-- Past presence pair page: render as single unit via PastPresencePairRenderer -->
      <PastPresencePairRenderer
        v-else-if="currentPage.kind === 'past_presence_pair'"
        :page="currentPage"
      />

      <!-- Non-card page: render each question individually -->
      <div
        v-else
        v-for="question in currentPage.questions"
        :key="question.id"
        class="question"
      >
        <component
          v-if="store.isQuestionVisible(question.id)"
          :is="rendererComponent(question.renderer)"
          :question="question"
        />
      </div>
    </div>

    <div v-else class="no-page">
      <p>No page loaded.</p>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progress * 100}%` }"></div>
    </div>

    <div class="navigation">
      <button :disabled="!canPrev" @click="prev">Previous</button>
      <button :disabled="!canAdvance" @click="next">
        {{ store.isComplete ? 'Complete' : 'Next' }}
      </button>
      <button
        type="button"
        class="reset-button"
        @click="showResetConfirm = true"
      >
        Start over
      </button>
    </div>

    <!-- Reset confirmation dialog -->
    <div v-if="showResetConfirm" class="reset-confirm-overlay">
      <div class="reset-confirm-dialog">
        <p class="reset-confirm-message">Start over? This clears your answers.</p>
        <div class="reset-confirm-actions">
          <button type="button" @click="cancelReset">Cancel</button>
          <button type="button" class="reset-confirm-button" @click="handleReset">
            Start over
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.isComplete" class="complete-message">
      <p>Questionnaire complete.</p>
    </div>
  </div>
</template>

<style scoped>
.questionnaire-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.page {
  margin-bottom: 2rem;
}

.question {
  margin-bottom: 1rem;
}

.no-page {
  color: #666;
  margin-bottom: 2rem;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

.navigation {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.navigation button {
  padding: 0.5rem 1.5rem;
  cursor: pointer;
}

.navigation button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.complete-message {
  padding: 1rem;
  background: #e8f5e9;
  border-radius: 4px;
  color: #2e7d32;
}

.reset-button {
  margin-left: auto;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-sm);
  padding: var(--space-xs) var(--space-md);
  cursor: pointer;
  transition: border-color var(--duration-fast);
}

.reset-button:hover {
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
}

.reset-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.reset-confirm-dialog {
  background: var(--color-background-primary);
  border: var(--border-thin) solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  max-width: 400px;
  width: 90%;
}

.reset-confirm-message {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-lg) 0;
  line-height: var(--leading-normal);
}

.reset-confirm-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

.reset-confirm-actions button {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  border: var(--border-thin) solid var(--color-border-primary);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  transition: border-color var(--duration-fast);
}

.reset-confirm-actions button:hover {
  border-color: var(--color-text-tertiary);
}

.reset-confirm-button {
  background: var(--color-accent);
  color: var(--color-text-on-accent);
  border-color: var(--color-accent);
}

.reset-confirm-button:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.mode-badge {
  position: fixed;
  top: var(--space-sm);
  right: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  z-index: 100;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mode-badge.live {
  background: var(--color-background-primary);
  border: var(--border-thin) solid var(--color-border-primary);
  color: var(--color-text-secondary);
}

.mode-badge.fixture {
  background: var(--color-accent);
  border: var(--border-thin) solid var(--color-accent);
  color: var(--color-text-on-accent);
}

.mode-badge-text {
  display: block;
}
</style>
