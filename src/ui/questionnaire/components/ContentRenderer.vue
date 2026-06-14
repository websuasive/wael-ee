<!-- Renderer for non-answering content pages (intro, etc.) -->
<!-- Displays prose with a Begin button to advance to next page -->

<script setup lang="ts">
import { useQuestionnaireFlow } from '../../composables/useQuestionnaireFlow';

const { next } = useQuestionnaireFlow();
</script>

<template>
  <div class="content-page">
    <h2 class="content-heading">Before you start</h2>
    
    <p class="content-paragraph">
      This takes about ten minutes. There are no right answers, and nobody's marking it - so the only thing that makes it work is answering straight.
    </p>
    
    <p class="content-paragraph">
      A few things worth knowing:
    </p>
    
    <p class="content-paragraph">
      <strong>Answer as things actually are, not as you'd like them to be, or think they should be.</strong> The honest picture is the useful one. "Not much," "no one," and "nothing really" are proper answers - tick them when they're true.
    </p>
    
    <p class="content-paragraph">
      <strong>Go with your first reaction.</strong> Most of these are quicker than they look. Don't weigh it up - the gut answer is usually the truer one.
    </p>
    
    <p class="content-paragraph">
      <strong>Some questions will feel similar.</strong> That's deliberate, not a glitch. They're getting at slightly different things, so answer each one fresh.
    </p>
    
    <p class="content-paragraph">
      There's nothing here you can get wrong. Just answer it like it is.
    </p>
    
    <button class="begin-button" @click="next">Begin</button>
  </div>
</template>

<style scoped>
.content-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 0;
}

.content-heading {
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-lg) 0;
  line-height: var(--leading-tight);
}

.content-paragraph {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-md) 0;
  line-height: var(--leading-normal);
}

.content-paragraph strong {
  font-weight: var(--font-weight-semibold);
}

.begin-button {
  margin-top: var(--space-lg);
  padding: var(--space-sm) var(--space-xl);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-on-accent);
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast);
}

.begin-button:hover {
  background: var(--color-accent-hover);
}
</style>
