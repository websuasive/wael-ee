<script setup lang="ts">
// ExperienceCardActionMenu. Per EXPERIENCE.md sections 5.1 and 5.3.
//
// Inline popover on desktop (anchored to the menu trigger), full-width bottom
// sheet on mobile per §9. Four options always shown (Save, Mark booked, Mark
// done, Not interested). A fifth (Clear) is visible only when a flag is set.
//
// Selecting an option calls setFlag or clearFlag on the status store and
// emits close. The store handles persistence and optimistic state per §11.5;
// the menu does not await the persistence write before closing because the
// optimistic update is already visible on the card.
//
// Dismissal: a transparent full-page backdrop (Teleported to body) captures
// any click outside the menu and emits close. The host card additionally
// closes the menu on card-body click per the §5.3 interaction-collision
// rule. Clicks inside the menu are stopped from bubbling so they do not
// double-trigger either dismissal path.

import { computed } from 'vue';
import { useExperienceStatusStore } from '../../experience/status_store';
import { experienceCopy } from '../../experience/data/static_copy';
import type { Flag } from '../../experience/types';

const props = defineProps<{
  variantId: string;
  currentFlag: Flag | null;
}>();

const emit = defineEmits<{ close: [] }>();

const statusStore = useExperienceStatusStore();

interface MenuOption {
  flag: Flag | 'clear';
  label: string;
}

const options = computed<MenuOption[]>(() => {
  const items: MenuOption[] = [
    { flag: 'saved', label: experienceCopy.action_save },
    { flag: 'booked', label: experienceCopy.action_mark_booked },
    { flag: 'done', label: experienceCopy.action_mark_done },
    { flag: 'not_interested', label: experienceCopy.action_not_interested },
  ];
  if (props.currentFlag !== null) {
    items.push({ flag: 'clear', label: experienceCopy.action_clear });
  }
  return items;
});

function onSelect(option: MenuOption): void {
  // Fire-and-forget: the store updates optimistic state synchronously, so the
  // card visually updates before the persistence write resolves. Failure
  // reverts via §11.5; surfacing that failure as a toast is deferred to a
  // later phase per the spec's minimal-recovery stance (§11.5).
  if (option.flag === 'clear') {
    void statusStore.clearFlag(props.variantId);
  } else {
    void statusStore.setFlag(props.variantId, option.flag);
  }
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div
      class="experience-action-menu__backdrop"
      @click="emit('close')"
    />
  </Teleport>
  <div
    class="experience-action-menu"
    role="menu"
    @click.stop
  >
    <ul class="experience-action-menu__list">
      <li
        v-for="option in options"
        :key="option.flag"
        role="none"
      >
        <button
          type="button"
          role="menuitem"
          class="experience-action-menu__item"
          :class="{
            'experience-action-menu__item--current':
              option.flag === currentFlag,
          }"
          @click.stop="onSelect(option)"
        >
          {{ option.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.experience-action-menu__backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: transparent;
}

.experience-action-menu {
  position: absolute;
  top: calc(100% + var(--space-xs));
  right: 0;
  z-index: 51;
  background: var(--color-background-primary);
  border: var(--border-hairline) solid var(--color-border-tertiary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  min-width: 180px;
}

.experience-action-menu__list {
  list-style: none;
  margin: 0;
  padding: var(--space-xs) 0;
}

.experience-action-menu__item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background-color var(--duration-fast);
}

.experience-action-menu__item:hover {
  background: var(--color-background-tertiary);
}

.experience-action-menu__item:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: -2px;
}

.experience-action-menu__item--current {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

/* Mobile: full-width bottom sheet per §9. */
@media (max-width: 600px) {
  .experience-action-menu {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    box-shadow: var(--shadow-lg);
    min-width: 0;
  }

  .experience-action-menu__item {
    padding: var(--space-md);
    font-size: var(--text-base);
    min-height: var(--control-height-lg);
  }
}
</style>
