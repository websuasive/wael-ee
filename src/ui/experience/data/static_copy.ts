// Experience-layer UI copy. Verbatim from EXPERIENCE.md section 10.1. These
// strings are observational: no second-person address, no imperatives directed
// at the man. Where an action exists, the label names what the system will do,
// not what the man should do.

export const experienceCopy = {
  // Browse view
  browse_reset_filters: 'Reset filters',

  // Filter facet labels. The `filter_label_region` key was removed in
  // E.3d alongside the region facet; it returns in E.6 under a renamed
  // `setting` facet.
  filter_label_direction: 'Direction',
  filter_label_cost_tier: 'Cost',
  filter_label_interest_domain: 'Interest',
  filter_label_status: 'Status',
  status_filter_unflagged: 'Not yet engaged',

  // Saved view

  // Status flags
  flag_saved: 'Saved',
  flag_booked: 'Booked',
  flag_done: 'Done',
  flag_not_interested: 'Not interested',

  // Action menu (the action labels name what the system will do)
  action_save: 'Save',
  action_mark_booked: 'Mark booked',
  action_mark_done: 'Mark done',
  action_not_interested: 'Not interested',
  action_clear: 'Clear',

  // Detail view
  detail_close: 'Close',
  detail_instruction_label: 'Instruction',
  detail_why_it_works_label: 'Why it works',
  not_found_in_inventory: "That experience isn't in the catalogue.",

  // Empty states for the layer overall
  empty_no_reading: 'No assessment loaded. The assessment is the first step.',
  empty_no_reading_link: 'Go to assessment',
  error_generic: "Something's gone wrong. A refresh may help.",
  error_persist_failed: "Couldn't save that.",

  // Facet display labels — used on card badges and in the detail view. Not
  // verbatim from §10.1; added during Phase E.3a for the card UI. Sensible
  // British defaults; content review may refine.
  cost_free: 'Free',
  cost_low: 'Low',
  cost_medium: 'Medium',
  cost_high: 'High',
  scale_micro: 'Micro',
  scale_day: 'Day',
  scale_anchor: 'Anchor',
  experience_type_disruption: 'Disruption',
  experience_type_hidden_world: 'Hidden world',
  experience_type_expression: 'Expression',
  experience_type_experiment: 'Experiment',
  experience_type_contact: 'Contact',
  experience_type_recovery: 'Recovery',
  experience_type_repeatable: 'Repeatable',
  experience_type_anchor_experience: 'Anchor experience',
  context_solo: 'Solo',
  context_with_partner: 'With partner',
  context_with_young_family: 'With young family',
  context_with_older_family: 'With older family',
  context_with_parents: 'With parents',
  context_with_friends: 'With friends',
  friction_low: 'Low',
  friction_medium: 'Medium',
  friction_high: 'High',

  // Card action menu trigger — aria-label, not a visible label.
  action_menu_trigger_label: 'Open menu',

  // Detail drawer — additions in E.3c. Not in §10.1; sensible defaults.
  detail_status_label: 'Status',
  detail_close_aria: 'Close detail view',
  detail_facets_directions: 'Directions',
  detail_facets_interest_domains: 'Interests',
} as const;

export type ExperienceCopyKey = keyof typeof experienceCopy;
