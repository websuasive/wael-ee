// Shared direction labels for allocation and other direction-related questions

export const DIRECTION_LABELS: Record<string, string> = {
  contributor: 'Doing things for others',
  experience_seeker: 'New experiences',
  freedom_designer: 'Time and space that are yours',
  growth_focused: 'Learning, stretching, becoming more capable',
  creator: 'Making or building',
  relationship_rebuilder: 'Rebuilding closeness with someone',
};

export const DIRECTION_KEYS = [
  'contributor',
  'experience_seeker',
  'freedom_designer',
  'growth_focused',
  'creator',
  'relationship_rebuilder',
] as const;
