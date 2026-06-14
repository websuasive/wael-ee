// Flow controller for the questionnaire. Walks the manifest's pages in order.
// Handles conditionalOn visibility by asking the store. Does not interpret answers.

import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuestionnaireStore } from '../stores/questionnaire';
import type { PageDef } from '../questionnaire/types';
import { computeFadedDomains } from '@/assembler/domains';

export function useQuestionnaireFlow() {
  const router = useRouter();
  const store = useQuestionnaireStore();

  // Helper: check if peace page should be skipped (no faded domains)
  function shouldSkipPeacePage(): boolean {
    const currentAnswers = store.toAnswersObject;
    const fadedDomains = computeFadedDomains(currentAnswers as any);
    return fadedDomains.length === 0;
  }

  // Helper: ensure peace_discriminator is set to {} when skipping the page
  function ensurePeaceDiscriminatorPresent(): void {
    const currentValue = store.answers['peace_discriminator'];
    if (currentValue === undefined || currentValue === null) {
      store.setAnswer('peace_discriminator', {});
    }
  }

  const currentPage = computed((): PageDef | null => {
    if (!store.manifest) return null;
    if (!store.lastPageId) {
      return store.manifest.pages[0] ?? null;
    }
    const index = store.manifest.pages.findIndex((p) => p.id === store.lastPageId);
    if (index === -1) return store.manifest.pages[0] ?? null;
    return store.manifest.pages[index] ?? null;
  });

  const canAdvance = computed((): boolean => {
    if (!currentPage.value) return false;
    return store.isPageComplete(currentPage.value.id);
  });

  const canPrev = computed((): boolean => {
    if (!store.manifest || !store.lastPageId) return false;
    const index = store.manifest.pages.findIndex((p) => p.id === store.lastPageId);
    return index > 0;
  });

  const progress = computed((): number => {
    return store.progressFraction;
  });

  async function next(): Promise<void> {
    if (!store.manifest) return;
    const currentIndex = store.manifest.pages.findIndex(
      (p) => p.id === store.lastPageId,
    );
    if (currentIndex === -1) {
      const firstPage = store.manifest.pages[0];
      if (firstPage) store.advanceTo(firstPage.id);
      return;
    }
    let nextIndex = currentIndex + 1;
    const nextPage = store.manifest.pages[nextIndex];

    if (!nextPage) {
      // End of questionnaire: mark complete and navigate to results
      try {
        await store.markComplete();
        await router.push('/results');
      } catch (err) {
        // Validation or pipeline failed - surface the error
        console.error('[useQuestionnaireFlow] Completion failed:', err);
        // TODO: Show error to user (could navigate to error page or show inline)
        // For now, re-throw so the caller can handle it
        throw err;
      }
      return;
    }

    // Skip peace page if no faded domains
    if (nextPage.id === 'peace-discriminator' && shouldSkipPeacePage()) {
      ensurePeaceDiscriminatorPresent();
      nextIndex++;
      const afterPeacePage = store.manifest.pages[nextIndex];
      if (afterPeacePage) {
        store.advanceTo(afterPeacePage.id);
        return;
      } else {
        // Peace was the last page - mark complete
        try {
          await store.markComplete();
          await router.push('/results');
        } catch (err) {
          console.error('[useQuestionnaireFlow] Completion failed:', err);
          throw err;
        }
        return;
      }
    }

    store.advanceTo(nextPage.id);
  }

  function prev(): void {
    if (!store.manifest || !store.lastPageId) return;
    const currentIndex = store.manifest.pages.findIndex(
      (p) => p.id === store.lastPageId,
    );
    if (currentIndex <= 0) return;

    let prevIndex = currentIndex - 1;
    const prevPage = store.manifest.pages[prevIndex];

    if (!prevPage) return;

    // Skip peace page if no faded domains (when going backward)
    if (prevPage.id === 'peace-discriminator' && shouldSkipPeacePage()) {
      ensurePeaceDiscriminatorPresent();
      prevIndex--;
      const beforePeacePage = store.manifest.pages[prevIndex];
      if (beforePeacePage) {
        store.advanceTo(beforePeacePage.id);
      }
      return;
    }

    store.advanceTo(prevPage.id);
  }

  return {
    currentPage,
    canAdvance,
    canPrev,
    progress,
    next,
    prev,
  };
}
