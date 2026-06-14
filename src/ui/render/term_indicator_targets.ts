// Terms eligible for the term-indicator pattern. Placeholder content mirrors term_explanations.ts; render team curates the production set per RENDER.md section 5.4. Sync with term_explanations.ts is a manual concern; mismatch produces graceful fallback (term renders as plain text).

// Placeholder content: 46 keys (15 v2 + 20 v3 + 11 v4). Mattering removed from targets to make domain names in Intact callout read uniformly without tooltips.
// Render team curates the production set per RENDER.md section 5.4.
export const termIndicatorTargets: Set<string> = new Set([
  // v2 baseline (15 keys)
  'capacity strain',
  'desired direction',
  'desired direction (partial evidence)',
  'suppressed',
  'shifted (body)',
  'held unattributed',
  'sustained constraint intensity',
  'life shape duration',
  'between shapes',
  'mid-process',
  'stopped expecting',
  'past presence',
  'specificity',
  'soured',
  'stated but moving elsewhere',
  // v3 extension (20 keys)
  'expression space',
  'held attributed with expression',
  'held attributed unexpressed',
  'life texture band',
  'Empty (week)',
  'Depleted (week)',
  'Mixed (week)',
  'Textured (week)',
  'varied week',
  'Building (life-stage)',
  'Consolidating (life-stage)',
  'Re-evaluating (life-stage)',
  'Transitioning (life-stage)',
  'Settled (life-stage)',
  'Drifting (life-stage)',
  'Enduring (life-stage)',
  'paid work (relationship)',
  'primary load',
  'sociality default',
  'comparison surface',
  // v4 extension (4 keys - narrowing terms removed; panel passes term explicitly)
  'attention moving without much registering',
  'the role is who he is everywhere',
  'wanting running through a filter before it acts',
  'mostly absent in the relationships he has',
]);
