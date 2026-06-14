// Term popover state store. Module-level singleton via Vue refs. Components consume via useTermPopover(); the openPopover/closePopover methods are the only mutation interface. RENDER.md section 5.1.

import { ref, shallowRef, type Ref } from 'vue';

export type TermPopoverState = {
  activeTerm: Readonly<Ref<string | null>>;
  activeHeading: Readonly<Ref<string | null>>;
  anchorElement: Readonly<Ref<HTMLElement | null>>;
  openPopover: (term: string, anchor: HTMLElement, heading?: string) => void;
  closePopover: () => void;
};

const activeTerm = ref<string | null>(null);
const activeHeading = ref<string | null>(null);
// shallowRef: HTMLElement is not a reactive-tracked POJO; preserves identity.
const anchorElement = shallowRef<HTMLElement | null>(null);

export function useTermPopover(): TermPopoverState {
  const openPopover = (term: string, anchor: HTMLElement, heading?: string): void => {
    activeTerm.value = term;
    activeHeading.value = heading ?? null;
    anchorElement.value = anchor;
  };

  const closePopover = (): void => {
    activeTerm.value = null;
    activeHeading.value = null;
    anchorElement.value = null;
  };

  return {
    activeTerm,
    activeHeading,
    anchorElement,
    openPopover,
    closePopover,
  };
}
