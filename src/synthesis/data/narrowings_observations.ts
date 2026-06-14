// Narrowings observation library. Per SYNTHESIS.md §7.16.
// Each narrowing band has three observation sentences, one per intensity level.
// Keyed by {narrowing}_{intensity}.

export const NARROWINGS_OBSERVATIONS: Record<string, string> = {
  psychological_high: 'Wants and desires get heavily filtered. They often get ignored or set aside.',
  psychological_moderate: 'Some wants get acted on, others get filtered out. Depends on the cost.',
  psychological_low: 'Wants and desires are typically acted upon.',

  structural_high: 'Days disappear into work and obligations. The diary fills itself; one thing follows the next.',
  structural_moderate: 'Some weeks the diary fills itself. Others have more room to choose.',
  structural_low: 'Days have room. What happens when is mostly chosen.',

  experiential_high: 'Most days look the same. Same rhythm, same shape, week after week.',
  experiential_moderate: 'The week has some texture, but a lot of it repeats.',
  experiential_low: "Days have different shapes. The week doesn't run on a fixed pattern.",

  identity_high: 'The role at work has become who he is everywhere. Old friends, family, on his own. The same person across all of them.',
  identity_moderate: "The role colours things outside work, but he's still recognisable as someone separate from it.",
  identity_low: 'The role at work is something he does, not who he is. Other contexts have other versions of him.',

  energetic_high: 'Running on fumes. The body is depleted and the aliveness has gone quiet.',
  energetic_moderate: 'Energy holds most of the time, but aliveness comes and goes.',
  energetic_low: 'Energy is there. Things feel alive.',

  relational_high: 'Contact has thinned. Even the close ones feel more managed than present.',
  relational_moderate: 'Some relationships have presence; others are more about keeping things ticking over.',
  relational_low: "Relationships have contact and presence in them. He's there when he's there.",

  attention_high: 'Attention is on the next thing, the task list, what needs doing. Days pass without much registering.',
  attention_moderate: 'Attention is sometimes in the moment, sometimes on the next task.',
  attention_low: 'Attention sits where he is. The moments register.',
};
