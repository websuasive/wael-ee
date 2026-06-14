// Card body id slug helper. Implements RENDER.md section 4.7's slug rule: lowercase + spaces-to-hyphens. Used to generate card body ids and aria-controls references.

// Reverse mapping for single-word display names to direction names
const DISPLAY_NAME_TO_DIRECTION: Record<string, string> = {
  'Creator': 'creator',
  'Contributor': 'contributor',
};

export function slug(displayName: string): string {
  // Single-word display names map to their direction equivalents
  if (DISPLAY_NAME_TO_DIRECTION[displayName]) {
    return DISPLAY_NAME_TO_DIRECTION[displayName]!;
  }
  // Multi-word display names: lowercase + spaces to hyphens
  return displayName.toLowerCase().replace(/ /g, '-');
}
