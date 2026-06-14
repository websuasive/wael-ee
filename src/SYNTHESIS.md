# WAEL Synthesis Layer Specification

**Status: DRAFT** (becomes LOCKED after project lead review).

This document is the merged canonical synthesis specification, consolidating the pre-amendment canonical with the v2-final synthesis amendment (formerly `SYNTHESIS_V3.md`, locked) and the v4 synthesis amendment (formerly `SYNTHESIS_V4.md`, locked post-revision-pass). Fixture-specific content (cohort-distribution counts, named fixture references, coverage matrices keyed to specific fixtures, cohort backfill data) has been removed per the merge policy. Architectural rules, predicates, sentence libraries, term explanations, and display labels are preserved.

Language cleanup of sentence libraries, term explanations, and display labels is out of scope for this merge. Those bodies of text are consolidated as-is from the source amendments for a separate later cleanup pass; coachy register, audience-mismatch, and naming drift in the sentence libraries are deliberately left intact here so the cleanup pass has a complete starting point.

Date of merge: 17 May 2026.

---

## 1. Purpose and North Star

The synthesis layer turns engine output into a structured set of recognitions for display. Its job is to render what the architecture has read in language a man can recognise as his own, without telling him what to think about it.

North Star: *the layer surfaces architectural readings; it does not narrate the man's life or interpret his situation as a person.*

This is a recognition layer, not a diagnosis layer. The man reads what is there. The experience-suggestion layer (later) proposes what to do with it.

**What the synthesis layer surfaces beyond the core readings.** The engine extension adds architectural readings the synthesis layer renders into three additional panels. The `life_texture_panel` names what the man's week contains. The `life_context_panel` reads where he sits in his own arc, his relationship to work, the load he is carrying, and his temperamental orientation toward people. The `comparison_surface_panel` composes the man's own named absences (if he engaged with the self-report channel) against the architectural reading: what he named that the architecture reads too, what he named that the architecture reads as present, and what the architecture reads that did not enter his named list. The comparison surface is observational: the layer names two readings side by side. It does not interpret the gap between them. The man does the interpretation.

**What the narrowing layer surfaces.** The v4 engine amendment adds seven narrowing band readings on `EngineOutput.cross_direction`. The synthesis layer renders them through one panel, `the_narrowings_panel`. The bands compress multi-input architectural readings into categorical low/moderate/high values; the panel surfaces these to the man as seven dimensions of how his life is reading. The v4 amendment also adds the spiritual domain as a twelfth dimension joining the existing eleven; it renders through the existing `domains_panel` machinery with no special-casing. Compression-point pattern_paragraph sentences differentiate profiles whose seven-band signatures match identically (the all-bands-high and all-bands-moderate readings) by reading the underlying cross_direction inputs alongside the bands.

## 2. Inputs and Outputs

### 2.1 Inputs

The synthesis layer reads from:

1. The full validated `InputMap` (per the engine specification)
2. The full `EngineOutput` (per the engine specification)

Synthesis does not read story content, instrument question text, or any data outside the InputMap and EngineOutput. If a reading cannot be derived from these two sources, it is not surfaced.

The new `InputMap.self_report` field is read directly by the comparison surface composition (§5.10); no engine reading is intermediated. The four new `cross_direction` enum fields (`psychological_filtering`, `role_consolidation`, `attention_pattern`, `relational_presence`) sit on `InputMap.cross_direction` and are read directly. The seven new narrowing band fields sit on `EngineOutput.cross_direction` and are read directly. The new `domains.spiritual` entry sits on `InputMap.domains` and is processed through the existing domain pipeline.

### 2.2 Output: RenderingInstructions

Synthesis produces a single `RenderingInstructions` object consumed by the presentation layer. The presentation layer reads this object and renders it visually; it does not make further architectural decisions.

```typescript
type RenderingInstructions = {
    headline: HeadlineOutput
    recognition_paragraph: SlotContent       // direction-combination sentence (identity)
    pattern_paragraph: SlotContent            // shape sentence (current reading)
    direction_cards: DirectionCardOutput[]
    direction_evidence_chart: ChartData
    domains_panel: DomainsPanel
    constraints_panel: ConstraintsPanel
    cross_cutting_panel: CrossCuttingPanel
    closing_lines: ClosingLine[]
    experience_candidate_directions: ExperienceCandidate[]
    life_texture_panel: LifeTexturePanel
    life_context_panel: LifeContextPanel
    comparison_surface_panel: ComparisonSurfacePanel | null
    the_narrowings_panel: TheNarrowingsPanel
}
```

Each field is fully specified in section 5.

`life_texture_panel`, `life_context_panel`, and `the_narrowings_panel` are always present. `comparison_surface_panel` is `null` when `InputMap.self_report.named_absences.length === 0` (the man did not engage with the self-report channel) AND the Surfaced section's candidate count is zero. When the man ticks nothing but the architecture has surfaced candidates, the panel renders with empty Confirmed and Quiet sections and a populated Surfaced section. When he ticks `nothing_really` and the architecture has nothing to surface, the panel also renders to make the symmetry visible. Only the "ticked nothing AND no Surfaced candidates" case omits the panel entirely. The seven narrowing bands inside `the_narrowings_panel` are always emitted regardless of band values (every band is a deterministic derivation that always produces a value).

### 2.3 The graceful-degradation pattern

Every slot that carries text uses the same shape:

```typescript
type SlotContent = {
    interpretive_text: string | null
    token_text: string
}
```

The presentation layer prefers `interpretive_text` if non-null; otherwise renders `token_text`. The synthesis layer always sets `token_text`; `interpretive_text` is set only when a firing condition matches.

This means: every slot always has content. Coverage gaps in the interpretive sentence library never blank the dashboard.

Render contract for empty SlotContent. When a SlotContent has both `interpretive_text = null` AND `token_text = ''` (empty string), the render layer omits the slot entirely (no element, no blank line). When `token_text` is non-empty, the render layer always shows it (or shows `interpretive_text` if non-null per the existing graceful-degradation rule). The empty-string case applies only where the spec explicitly sets it; in all other cases token_text is non-empty by construction.

The graceful-degradation pattern carries through to all panels added beyond the core nine. New slots use the same `interpretive_text | null` + `token_text` shape; empty SlotContent (both null/empty) drops the slot at render per the existing rule.

## 3. The two interpretive sentence layers

Two distinct sentence sources fill `interpretive_text` slots.

### 3.1 Shape-level interpretive sentences

Sentences fired by predicates evaluating EngineOutput patterns. These fill slots like the pattern paragraph, direction card summaries, permission constraint line, and closing lines.

A shape-level sentence is defined as:

```typescript
type ShapeSentence = {
    id: string
    slot: SlotName
    predicate: (output: EngineOutput, input: InputMap) => boolean
    sentence: string
}
```

Sentences are evaluated in registration order per slot; first match wins; non-matching sentences are ignored. If no sentence matches a slot, that slot's `interpretive_text` is null and the token fallback renders.

Sentences live in `src/synthesis/data/shape_sentences.ts`. Adding a sentence is data: define a new entry, ensure its predicate is tighter than (or distinct from) earlier entries in the same slot, no synthesis-logic change required.

### 3.2 Direction-combination recognition sentences

A separate sentence library keyed by direction combinations in strength order. Used specifically for the `recognition_paragraph` slot when the headline displays one or more direction names.

The lookup key is a comma-separated list of TypeKey-form direction names ordered by pull strength (highest first), e.g. directions `[creator, freedom_designer]` (engine names) becomes keys `['creator', 'freedom_designer']` (TypeKeys) becomes lookup string `"creator,freedom_designer"`. See section 6.7 for the mapping table.

Sentences live in `src/synthesis/data/recognition_sentences.ts`, drawn from the existing recognition_sentences map (with em-dashes removed and any other style fixes applied).

Lookup order for the recognition paragraph slot:

1. Try the full key (primary, secondary, tertiary if present)
2. Fall back to the primary, secondary key (if no triple match)
3. Fall back to the primary alone
4. If nothing matches, the slot's `interpretive_text` is null and the token fallback renders. Shape-level work for the current architectural reading is carried by the separate `pattern_paragraph` slot (section 5.2.2).

Note on voice: the synthesis layer renders combination sentences as-is from `src/synthesis/data/recognition_sentences.ts`. Voice consistency across the file is an authorial concern, not a synthesis-layer concern. If the file's voice changes (e.g., second-person to third-person), the dashboard automatically reflects the new voice without synthesis-layer changes.

### 3.3 Per-direction meaning sentences

Each direction card displays a per-direction meaning sentence describing what the type needs as a category. These sentences are keyed by direction TypeKey (section 6.7) in `src/synthesis/data/recognition_sentences.ts`, alongside the combination sentences.

The sentences are written in third-person plural type-naming voice: 'Creators need...', 'Freedom Designers need...', 'Experience Seekers need...', etc. The synthesis layer renders them as-is from the file; no voice manipulation, no hedged variants.

Lookup: take the direction's engine name, map to TypeKey via section 6.7, look up the matching key in the per-direction map. If no entry exists, the card's meaning sentence slot is null (token fallback: blank, since there is no useful token rendering for an absent type description).

Direction cards have a field `meaning_sentence: SlotContent` populated from this lookup (see section 5.3).

**A third sentence data source.** The comparison surface composition (§5.10) reads a separate metadata file at `src/synthesis/data/self_report_items.ts` for architectural-anchors mapping. This data file does not contain sentences; it carries structural metadata used by the comparison surface logic to determine which self-report items map to which engine readings. See §6.11.

## 4. The headline rule

The headline names the directions firing materially. Rule:

1. Compute the set of "firing directions": directions where `pull_quality` is non-empty (contains any of: `'real'`, `'suppressed'`, `'saturated'`, `'behaviourally_divergent'`, `'phantom'`, `'phantom_partial'`), OR `pull >= 50`.

   Note: the synthesis "firing set" is distinct from the engine's `surfaced` boolean (engine 5.1). The engine surfaces a direction when `pull >= 50` OR `movement >= 50`. The synthesis firing set surfaces directions where pull_quality is firing OR `pull >= 50`. The two definitions diverge for low-pull, high-movement habit directions (engine surfaces them; synthesis does not name them in the headline). This is deliberate: the headline names directions where the architecture has a current pull-quality reading, not directions that have habit-level movement without underlying pull.

2. Sort the firing set by `pull` descending. Tie-break alphabetically (matches engine surfacing rule).
3. The headline names the top three directions from the sorted set.
4. If fewer than three directions fire, the headline names however many fire.
5. If zero directions fire, the headline becomes a situation-naming line (see 4.1).

Direction names in the headline use canonical display names (section 6.1).

### 4.1 Situation-naming headlines

When the firing set is empty (no direction has pull_quality firing AND no direction has pull >= 50), the headline reads what the architecture sees instead. Two cases:

- **All-quiet, past presence real:** "Nothing reading as a pull right now." (3+ directions have `past_presence = yes`)
- **Generic fallback:** "Directions all reading low." (none of the above)

These are pinned tokens; no firing predicate library needed. The headline is computed mechanically from the firing direction set. Phantom-quality directions enter the firing set per step 1 above and surface in the headline normally; no separate phantom-only situation headline is needed.


## 5. RenderingInstructions, field by field

### 5.1 headline

```typescript
type HeadlineOutput = {
    direction_names: string[]  // canonical display names, 0-3 entries
    direction_engine_names: DirectionName[]  // typed engine names; render-layer convenience
    situation_text: string | null  // set when direction_names is empty
}
```

`direction_names` lists firing directions (section 4). Empty array means no direction fires; `situation_text` then carries the situation-naming line (section 4.1).

The presentation layer renders `direction_names` joined by " · " when non-empty; otherwise renders `situation_text`.

### 5.2 recognition_paragraph and pattern_paragraph

The dashboard renders two distinct paragraphs in order: `recognition_paragraph` first (identity-level reading via direction-combination sentence), `pattern_paragraph` below (current architectural reading via shape sentence). The two layers serve different purposes and both render.

```typescript
recognition_paragraph: SlotContent
pattern_paragraph: SlotContent
```

#### 5.2.1 recognition_paragraph slot

Fill order:

1. Look up direction-combination sentence by sorted firing direction key (section 3.2). If found, set `interpretive_text`.
2. Otherwise, leave `interpretive_text` null.

`token_text` is always set per the template in section 5.2.3.

#### 5.2.2 pattern_paragraph slot

Fill order:

1. Evaluate shape sentences registered for slot `pattern_paragraph`. First match sets `interpretive_text`.
2. Otherwise, leave `interpretive_text` null.

`token_text` is always set per the template in section 5.2.4.

If a calibration line entry exists in `calibration_lines.ts` and its predicate fires, the calibration sentence prepends to the matched shape sentence's interpretive_text, separated by a single space. Both render together as one paragraph in pattern_paragraph. The current calibration_lines.ts is empty; the mechanism is a forward hook (see section 7.14).

#### 5.2.3 Token template for recognition_paragraph

The token is sparse by design; the headline already names the directions, and the combination sentence (when matched) carries the identity reading.

- When firing set is empty: `''` (empty string; this slot reads as identity-level and a null direction set has no identity)
- When firing set has 1 direction: `"{name1}."`
- When firing set has 2 directions: `"{name1} and {name2}."`
- When firing set has 3 directions: `"{name1}, {name2}, and {name3}."`

#### 5.2.4 Token template for pattern_paragraph

`token_text` is composed from a small, deterministic template with plural handling:

- When n = 0: `"No directions reading materially. Constraint pattern: {sci_band}. Life shape duration: {duration_band}."`
- When n = 1: `"One direction reading materially. Constraint pattern: {sci_band}. Life shape duration: {duration_band}."`
- When n >= 2: `"{n} directions reading materially. Constraint pattern: {sci_band}. Life shape duration: {duration_band}."`

Where `{n}` is the firing direction count, and the constraint intensity and duration values are pulled from EngineOutput / InputMap via the lookup tables in section 6.

### 5.3 direction_cards

```typescript
type DirectionCardOutput = {
    direction_name: string
    direction_engine_name: DirectionName  // typed engine name; render-layer convenience
    summary: SlotContent
    meaning_sentence: SlotContent
    fields: Array<{ label: string, value: string, intensity: number | null }>
    expression_space_caption: SlotContent
    held_attributed_line: string | null
    visual_state: 'named' | 'firing_not_named' | 'not_firing'
    surfaced_finding?: string  // §7.17 surfaced finding sentence when architecture surfaces this direction but man did not name it
}

direction_cards: DirectionCardOutput[]
```

Cards are produced for all six directions. Ordering is by pull descending; ties broken alphabetically by display name. Visual_state distinguishes which cards are named (in the headline), firing-but-not-named (in the firing set but below the top three), or not-firing (not in the firing set). The render layer uses visual_state to determine card prominence: named cards render full with a marker, firing-but-not-named cards render minimised, not-firing cards render minimised at reduced opacity.

`fields` is the per-card token list. Each card always shows the same five fields:

| Label | Source |
|---|---|
| Pull | `pull` value mapped via tokens table 6.2.1 |
| Past | `past_presence` mapped via 6.2.2 |
| Felt cost | `felt_cost` value mapped via 6.2.3 |
| Anticipation | `anticipation` value mapped via 6.2.4 |
| Quality | composite of `pull_quality` and `quadrant` via 6.2.5 |

Each field also carries an `intensity: number | null` (0–100) used by the render layer for visual bar treatments inside direction cards. For Pull, intensity is the engine's raw `pull` value (passthrough). For Past, Felt cost, and Anticipation, the qualitative label maps to a banded numeric. For Quality (a composite token of multiple states), intensity is `null`.

**held_attributed_line.** Fires when `pull_state` contains either `"held_attributed_with_expression"` or `"held_attributed_unexpressed"`. Otherwise null. The two cases produce distinct text:

| Pull state value | held_attributed_line text |
|---|---|
| `held_attributed_with_expression` | "Something specific held in this direction." |
| `held_attributed_unexpressed` | "Something specific held in this direction, with no current room for it." |

Mutual exclusion is guaranteed by the engine (a direction emits exactly one of the two values when `specificity = "strong"`).

**expression_space_caption.** Each direction card gains an `expression_space_caption: SlotContent` slot reading the per-direction `expression_space` boolean. The caption appears below the fields table and above the summary line.

The caption is informational and asymmetric by design: it fires only when `expression_space === "no_space"`. The `has_space` case is the default architectural state (the week has room for the direction); naming it explicitly on every read direction would be visual noise without information. The `no_space` case is the architecturally informative one (the channel is missing) and earns its own short caption.

Fill order:

1. If `expression_space === "no_space"` AND the direction is materially reading (`pull >= 30 OR pull_quality is non-empty`): fire interpretive_text from §7.7 shape sentences for slot `"expression_space_caption"`.
2. Otherwise (either `expression_space === "has_space"`, OR direction not reading materially): `interpretive_text = null`, `token_text = ''`. The render layer drops the slot per the empty-SlotContent rule.

This means expression_space_caption renders only when the week reads no current room for a direction that is otherwise materially present. The asymmetry reduces visual clutter in the render layer (most directions on most fixtures will not surface a caption) and concentrates the caption's attention on the architecturally significant cases.

**surfaced_finding.** Optional field populated when the architecture surfaces a direction that the man did not name in his self-report. The field holds one of the §7.17 surfaced finding sentences. When the architecture surfaces this direction (direction is in the firing set) AND the direction was not in the man's named list (no self-report item with a matching direction anchor), the synthesis layer attaches the appropriate sentence: "You didn't name this one, but the architecture reads it firing." When the direction is named (confirmed) or quiet, the field is undefined. The render layer displays this as an italic closing sentence on the card, below the existing per-direction observations.

`meaning_sentence` is populated per section 3.3: take the direction's engine name, map to TypeKey via section 6.7, look up in `recognition_sentences.ts`. If an entry exists, set `interpretive_text` to that sentence; `token_text` is the empty string (no useful token rendering for an absent type description). If no entry exists, both are null/empty and the slot renders blank.

`summary` is a one-line interpretive read of the direction's overall state. Fill order:

1. Evaluate shape sentences registered for slot `"direction_card_summary"` against this specific direction. First match sets `interpretive_text`, subject to the first-fire rule below.
2. Otherwise, leave `interpretive_text` null.

`token_text` for the summary is conditional on whether `interpretive_text` was set:

- When `interpretive_text` is non-null (the card claimed a predicate id), `token_text` is the composite of `pull_quality` and `quadrant` in plain language: `"{pull_quality_token}, {quadrant_token}."` (section 6.2.5). It carries the composite as a graceful-degradation backup if the interpretive sentence is ever stripped downstream.
- When `interpretive_text` is `null` (no predicate matched, or the matching id was already claimed by a higher-pull sibling under the first-fire rule below), `token_text` is the empty string `''`. The render layer's `shouldRenderSlot` (section 2.3) drops the summary slot entirely on the empty-SlotContent rule.

The composite quality token (`"{pull_quality_token}, {quadrant_token}."`) still surfaces exactly once per card via the `Quality` entry in `fields[]` regardless of which branch fires; it does not depend on `summary.token_text`.

**Card summary first-fire rule.** Within a single dashboard, each shape sentence in section 7.2 fires its `interpretive_text` only on the first card matching that shape's predicate under the iteration order (`pull` descending, alphabetical tiebreak on `direction_engine_name`). Subsequent cards matching the same predicate have `summary.interpretive_text = null`, and per the rule above their `summary.token_text = ''` so the render layer drops the slot. The previous fallback (emit the composite quality token into `summary.token_text` on suppressed siblings) produced visible duplication with the `Quality` field on the rendered card and has been removed.

Rationale: the card summary sentence is a recognition handle for the shape; once stated on the highest-pull card, repeating it on lower-pull cards adds no information. Emitting the composite quality token into the suppressed siblings' summary slot, as the previous fallback did, duplicated the `Quality` field's value into the body of the card. Suppressing the slot entirely removes that duplication while preserving the `Quality` field as the single composite-token surface.

**Visual state computation:**

- `named`: direction is in the headline (top 3 of firing set per section 4 step 3)
- `firing_not_named`: direction is in the firing set but not in the top 3 named in headline
- `not_firing`: direction is not in the firing set

The render layer maps these to visual treatments (full card with marker, minimised card, minimised card with reduced opacity respectively). Synthesis emits the state; render handles the styling.

**Render order in the card:** meaning_sentence first (serif, larger), then fields table, then expression_space_caption (when present), then summary (italic, muted), then held_attributed_line (when present), then surfaced_finding (when present, italic).

### 5.4 direction_evidence_chart

```typescript
type ChartData = {
    bubbles: ChartBubble[]
    caption: SlotContent
}

type ChartBubble = {
    direction_name: string  // canonical display name
    direction_engine_name: DirectionName  // typed engine name; render-layer convenience
    pull: number  // 0-100
    movement: number  // 0-100
    specificity_size: number  // numeric for visual sizing
    surfaced: boolean
    pull_quality_state: string  // for colour grouping
    is_desired_direction: boolean
    is_named_in_headline: boolean
}
```

All six directions appear as bubbles. Synthesis composes the data; the presentation layer renders the chart.

`specificity_size` maps:
- `"none"` to 0.3
- `"partial"` to 0.6
- `"strong"` to 1.0

These are visual sizing factors, not architectural; the presentation layer scales them to actual bubble radii.

`pull_quality_state` is the first value in `pull_quality` array (or `"empty"` if the array is empty). Used by the presentation layer for colour grouping.

`is_desired_direction` is true when `pull_quality` contains `phantom` or `phantom_partial`. This drives the chart's visual marker for desired directions (see below).

`caption` is a one-line read of the chart shape. Fill order via shape sentences for slot `"chart_caption"`. Token fallback: `"{n} directions reading materially. Movement varies."`

**Bubble visual treatment.** When `is_desired_direction = true`, the render layer displays the bubble with a dashed outline rather than a solid one. The chart legend includes a "Desired direction" marker showing the dashed treatment. This is a render-layer concern; synthesis sets the boolean.

The `is_named_in_headline: boolean` field is populated by the synthesis layer from the headline's top-3 directions (per section 4 step 3, the firing set sliced to its top three by pull, with alphabetical tiebreak). It is `true` when the bubble's direction appears in the headline's named set, `false` otherwise. The render layer consumes this directly to apply named-direction-conditional visual treatments. Bubbles for the headline's named directions render in accent colour at low opacity; other bubbles render in neutral grey. This aligns the chart's visual emphasis with the editorial intent: the chart highlights the directions the headline names.

### 5.5 domains_panel

```typescript
type DomainsPanel = {
    summary: SlotContent
    reduced_groups: Array<{
        value_label: string  // e.g. "Reduced, wants back"
        value_engine_name: DomainPresenceValue  // typed engine name; render-layer convenience
        domains: Array<{ domain_name: string; intensity: number }>
        domain_engine_names: DomainName[]  // typed engine names; render-layer convenience
    }>
    intact_callout: SlotContent
}
```

`reduced_groups` groups domains by their `value` field. Rule:

1. Filter domains where `fires = true`.
2. Group by `value` (e.g. all `"reduced_wants_back"` together, all `"reduced_at_peace"` together).
3. For each group, emit a `domains` array. Each entry pairs the canonical display name (section 6.5) with `intensity = 100 - engine_current_state` (clamped 0–100 by construction since `current_state` is itself 0–100).

The `domains` field replaces the previous `domain_names: string[]`. Each entry is `{ domain_name, intensity }`. Higher intensity means more reduced: a heavily reduced domain (low `current_state`) reads as a long bar, a barely-reduced domain reads as a short bar. This matches the panel's "what's reduced" framing.

The spiritual domain joins the existing eleven via the standard pipeline; no special-casing. For profiles with `spiritual.fires = true`, the spiritual domain renders in the appropriate value group:

- `value = intact`: spiritual joins the intact group (does not appear in reduced_groups).
- `value = reduced_wants_back` or `reduced_at_peace`: spiritual joins those groups alongside other reduced domains.
- `value = wants_but_never_had`: joins that group.
- `value = never_been_part_of_his_life`: joins that group. Under the strict reading per the engine specification, this is the typical group for the spiritual domain; spiritual will often be the sole entry in the "Never been part of life" group, which is architecturally honest.

`intact_callout` is a one-line read of which domains read intact. Fill order:

1. Shape sentences for slot `"domains_intact_callout"` may fire (e.g. "Mattering reading intact alongside multiple reductions").
2. Token fallback: list of intact domain names. `"{names}."`

The `"Intact:"` prefix was retired during the demo prep arc for visual consistency with adjacent panel elements. The render layer uses a label-plus-list pattern for the Intact and Never-been-part-of-life groups; the structural label appears in the render treatment, not in the token text.

`summary` is a one-line read of the domain pattern overall. Fill order via shape sentences for slot `"domains_summary"`.

Token fallback: `"{r} domains reduced; {n_intact} intact; {o} other."`

Where `r` counts domains with value in {`reduced_wants_back`, `reduced_at_peace`}; `n_intact` counts domains with value `intact`; `o` counts the remaining (`wants_but_never_had`, `never_been_part_of_his_life`). If `o` is zero, drop the third clause. Render only the relevant clauses.

### 5.6 constraints_panel

```typescript
type ConstraintsPanel = {
    summary: SlotContent
    constraint_lines: ConstraintLine[]
    sustained_constraint_intensity: number
    intact_callout: SlotContent
    permission_sub_shape_text: SlotContent | null
}

type ConstraintLine = {
    constraint_name: string  // e.g. "Energy"
    constraint_engine_name: 'energy' | 'time' | 'body_capacity' | 'permission'  // typed engine name; render-layer convenience
    band_label: string  // e.g. "Heavy depletion"
    intensity: number    // 0–100, engine constraint value passthrough
}
```

`constraint_lines` lists firing constraints. For each constraint where `fires = true`:

| Constraint | Display name | Band tokens (section 6.3) |
|---|---|---|
| `energy` | "Energy" | full / moderate / heavy depletion |
| `time` | "Time" | open / moderate / heavy time pressure |
| `body_capacity` | "Body" | full / shifted / limited |
| `permission` | "Permission" | present / partial / blocked |

Each `ConstraintLine` also carries an `intensity: number` (0–100) passed through directly from the engine's per-constraint `value`. The render layer uses this for intensity-bar visual treatments inside the constraints panel.

`permission_sub_shape_text` fires whenever the permission constraint fires (i.e., `permission.fires = true`), regardless of `sub_shape` value. The sentence text varies by `sub_shape` per section 7.4. Fill order via shape sentences for slot `"permission_sub_shape"`:

| Sub-shape | Sentence |
|---|---|
| `want_block` | "Wanting that isn't being let in." |
| `say_block` | "Wanting something that hasn't been said out loud." |
| `act_block` | "Wanting something thought about but not acted on." |
| `present` | "Permission reading partial; nothing specific blocking." |

`intact_callout` fires when one or more constraints have `fires = false`. Token fallback: `"{names} reading intact."`

The `permission_sub_shape_text: SlotContent | null` field is populated when the permission constraint fires (i.e., the permission `ConstraintLine` is present in `constraint_lines`). When the permission constraint does not fire, the field is null. The field is sourced from the section 7.4 permission sub-shape shape sentence library, dispatched on the permission's `sub_shape` value. The `ConstraintLine` type itself is now uniform across all four constraints (no per-line specialisation for permission).

### 5.7 cross_cutting_panel

```typescript
type CrossCuttingPanel = {
    outputs: CrossCuttingOutput[]
}

type CrossCuttingOutput = {
    name: string  // "Between shapes" / "Mid-process"
    output_engine_name: CrossCuttingName  // typed engine name; render-layer convenience
    fires: boolean
}
```

This is data-only. The cross-cutting closing lines render in section 5.8, not here. The panel is a structured display of which cross-cutting outputs fire vs don't, for inspection completeness.

### 5.8 closing_lines

```typescript
type ClosingLine = {
    id: string  // one of the canonical IDs declared below
    text: SlotContent
    direction_engine_name: DirectionName | null  // typed engine name; render-layer convenience
}

closing_lines: ClosingLine[]
```

Canonical closing line IDs. The synthesis layer uses these IDs consistently across the closing line firing-order list, deduplication rule, token fallback table, and section 7.3 sentence library:

- `closing_between_shapes`
- `closing_mid_process`
- `closing_capacity_strain`
- `closing_stopped_expecting`
- `closing_phantom`

The `id` field on each ClosingLine in the output uses these canonical forms.

For each firing closing line, fill order is: shape sentences for slot `closing_line_{id}`, then token fallback.

Closing lines fire in this fixed order:

1. `closing_between_shapes` (single line; fires when `cross_cutting.between_shapes.fires = true`)
2. `closing_mid_process` (single line; fires when `cross_cutting.mid_process.fires = true`)
3. `closing_capacity_strain` (one line per direction d where `d.pull_state` contains `"capacity_strain"`, regardless of firing-set membership; ordered by `d.pull` descending)
4. `closing_stopped_expecting` (one line per direction d where `d.pull_state` contains `"stopped_expecting"`, regardless of firing-set membership; ordered by `d.pull` descending)
5. `closing_phantom` (one line per firing direction d where `d.pull_quality` contains `"phantom"` or `"phantom_partial"`, ordered by `d.pull` descending)

Architectural rationale for steps 3 and 4: `stopped_expecting` and `capacity_strain` are pull_state values that fire on direction-level conditions independent of pull magnitude. A man can have `stopped_expecting` on a low-pull quiet direction. The architecture's reading should surface as a closing line; gating it by firing-set membership would drop real signal.

Step 6 (phantom callout) is reachable for phantom-only profiles because phantom and phantom_partial directions enter the firing set per section 4 step 1.

**Closing line deduplication.** When the pattern_paragraph slot's matched shape sentence covers a reading that a closing line would echo, the closing line is suppressed. Two kinds of suppression apply:

*Cross-cutting suppressions* (apply to the entire closing line, regardless of direction):

- When `active_going_through_motions` matches in pattern_paragraph, suppress `closing_mid_process`.
- When `between_shapes_clean` matches in pattern_paragraph, suppress `closing_between_shapes`.

*Per-direction suppressions* (apply only to the closing line for the same direction the shape sentence matched on):

- When `active_with_tension` matches in pattern_paragraph on direction d, suppress `closing_capacity_strain` for direction d only. Other directions with capacity_strain in pull_state still produce closing lines.
- When `desired_direction_partial` or `desired_direction_full` matches in pattern_paragraph on direction d, suppress `closing_phantom` for direction d only. Other phantom or phantom_partial directions still produce closing lines.

The shape sentence at the top of the dashboard carries the reading; the closing line would echo it. The per-direction qualifier matters: a profile with multiple phantom directions still wants `closing_phantom` for the secondary ones, since only the primary appears in the shape sentence.

Token fallbacks per closing line (per-direction lines use a single direction name):

| ID | Token |
|---|---|
| `closing_between_shapes` | "Recent life shape change; no replacement structure." |
| `closing_mid_process` | "Active quadrant with recent and awkward reaching." |
| `closing_capacity_strain` | "Capacity strain firing on {direction_display}." |
| `closing_stopped_expecting` | "Stopped expecting firing on {direction_display}." |
| `closing_phantom` | "{direction_display} named as a desired direction." |

### 5.9 experience_candidate_directions

```typescript
type ExperienceCandidate = {
    direction_name: string  // canonical display name
    direction_engine_name: DirectionName  // typed engine name; render-layer convenience
    priority: 'firing' | 'past_presence_only'
    pull: number  // 0-100
}

experience_candidate_directions: ExperienceCandidate[]
```

A list of directions worth surfacing as candidates for experience suggestions. Computation:

1. All directions in the firing set (section 4 step 1), ordered by pull descending. Priority: `'firing'`.
2. Plus all directions where `past_presence = yes` AND not in the firing set, ordered by pull descending. Priority: `'past_presence_only'`.

The list is for downstream consumption by the experience-suggestion layer. The dashboard does not necessarily render this list; it is a synthesis output for the next layer to use.

When a man's firing set is empty, the list contains all past-presence directions, giving the experience layer a set of candidates to propose experiences across.


### 5.10 comparison_surface_panel

```typescript
type ComparisonSurfacePanel = {
    summary: SlotContent
    summary_id: string | null  // stable identifier for test assertions
    confirmed: ComparisonItem[]
    quiet: ComparisonItem[]
    surfaced: ComparisonItem[]
}

type ComparisonItem = {
    // For confirmed and quiet items: the man's self-report item label leads.
    // For surfaced items: the architecture's reading leads.
    sentence: SlotContent
    source: 'self_report' | 'architecture'
    reference: ComparisonReference
}

type ComparisonReference =
    | { kind: 'self_report_item'; id: SelfReportItemId }
    | { kind: 'engine_reading';
        reading_type: 'firing_direction' | 'reduced_domain' | 'absent_flag';
        target: string }  // direction engine name, domain name, or week_shape flag name
```

The panel is `null` if and only if `named_absences.length === 0 AND surfaced.length === 0` (the man did not engage AND the architecture has nothing to surface). Otherwise the panel renders. Empty sections within the panel are valid; the render layer omits empty section headings.

#### 5.10.1 Composition logic for Confirmed and Quiet sections

For each item `i` in `InputMap.self_report.named_absences`:

1. If `i === "nothing_really"`: skip. (The item has no anchors and does not generate Confirmed or Quiet entries. The Surfaced section's composition handles `nothing_really` separately, see §5.10.2.)
2. Look up `i`'s architectural_anchors from `src/synthesis/data/self_report_items.ts` (§6.11).
3. For each anchor, evaluate its firing condition against `EngineOutput`:

   | Anchor kind | Firing condition |
   |---|---|
   | `domain: X` | The domain X has `fires === true` AND `value !== "intact"` (i.e., reads as `reduced_wants_back`, `reduced_at_peace`, `wants_but_never_had`, or `never_been_part_of_his_life`). |
   | `direction: X` | Direction X is in the firing set (per §4 step 1). |
   | `constraint: X` | The constraint X has `fires === true`. |
   | `week_shape_flag: X` | The week_shape flag X has value `false` (absence is the firing condition for week_shape anchors). |

4. If any anchor fires for item `i`: classify `i` as **Confirmed**. Compose the Confirmed sentence per §7.9.
5. If no anchor fires: classify `i` as **Quiet**. Compose the Quiet sentence per §7.9.

The order of items within each section follows the order they appear in `named_absences` (the man's own order of selection, preserved).

#### 5.10.2 Composition logic for Surfaced section

The Surfaced section names architectural readings the man did not name in his self-report. Composition:

1. Enumerate candidate engine readings:
   - **Firing direction candidates.** For each direction in the firing set: if no self-report item with a `direction: X` anchor matching this direction was in `named_absences`, the direction is a candidate. Secondary sort: by `pull` descending; ties broken alphabetically by direction engine name.
   - **Reduced domain candidates.** For each domain with `value !== "intact"` AND `value !== "never_been_part_of_his_life"`: if no self-report item with a `domain: X` anchor matching this domain was in `named_absences`, the domain is a candidate. Secondary sort: by `current_state` ascending (most reduced first); ties broken alphabetically by domain engine name.

     Architectural rationale for excluding `never_been_part_of_his_life`: that value is a baseline reading, not a reduction the architecture has detected the man did not name. Surfacing a domain with this value as "what the architecture reads that he did not name" misreads the Surfaced section's intent. The exclusion preserves the section's meaning, and is particularly important for the spiritual domain where this value is the typical reading.

   - **Absent week_shape contents flag candidates.** For each *contents* flag in week_shape that is `false`: if no self-report item with a `week_shape_flag: X` anchor matching this flag was in `named_absences`, the flag is a candidate. Secondary sort: architectural-significance order per §6.12. **Load flags (`work_dominates`, `weekends_consumed`) are not candidates for Surfaced**: their presence is the typical concern, not their absence. The pattern flag (`varied_week`) flows through `something_to_look_forward_to` anchoring and is not surfaced standalone.
   - **Exclusion logic.** A candidate is excluded if any named item's anchor list contains an anchor matching the candidate's kind and name. Exclusion is on anchor membership, not on whether the anchor fires as Confirmed.

2. Apply the Surfaced cap of **3 items**.

3. Within the 3-item budget, select candidates in priority order:
   - Priority 1: Firing directions (up to 2 entries, highest pull first).
   - Priority 2: Reduced domains (up to 2 entries, most reduced first).
   - Priority 3: Absent week_shape flags (up to 1 entry, architectural-significance order).
   - If any priority underfills its budget, fill from the next priority's pool. The cascade is full-spillover across all tiers until the 3-item cap fills.

4. For each selected item, compose the Surfaced sentence per §7.9.

**Special case: `nothing_really` selected.** When `named_absences === ["nothing_really"]`, no items match the Confirmed/Quiet logic. The Surfaced composition runs as normal but with no exclusion (the `nothing_really` item has no architectural_anchors, so it does not exclude any candidates). This produces the maximum-information case: the panel renders with empty Confirmed and Quiet, and the Surfaced section names what the architecture reads that the man did not name. This is the central design intent of the comparison surface: the most informative case for the man who has stopped naming.

**Summary slot.** The panel's `summary` slot reads the joint state of Confirmed / Quiet / Surfaced counts and composes from §7.10 shape sentences. Token fallback: `"What's named and what the architecture reads."` (single neutral string when no shape sentence fires).

### 5.11 life_texture_panel

```typescript
type LifeTexturePanel = {
    summary: SlotContent
    band_label: string           // display label for life_texture_band
    flags_present: string[]      // display labels of contents flags that are true
    flags_absent: string[]       // display labels of contents flags that are false
    load_state_label: string     // display label for the joint load state
    pattern_note: SlotContent    // varied or uniform reading
}
```

`band_label` and `load_state_label` are token-only (always populated); no graceful-degradation handling needed. Tables in §6.13 and §6.14 map engine values to display labels.

`flags_present` and `flags_absent` enumerate the six contents flags by display label per §6.15. These are mechanical data lists, not prose.

`pattern_note` reads the raw `week_shape.varied_week` boolean and composes via §7.6 shape sentences:
- `varied_week === true`: fires from sentences for slot `"life_texture_pattern_note"` with predicate `week_shape.varied_week === true`
- `varied_week === false`: fires from sentences for slot `"life_texture_pattern_note"` with predicate `week_shape.varied_week === false`

Token fallback for `pattern_note`: `""` (empty; render drops the slot per empty-SlotContent rule). The interpretive sentences carry all the prose here.

`summary` composes via §7.5 shape sentences reading `life_texture_band` and `varied_week` together. Six interpretive cells:
- empty band: one sentence (varied_week irrelevant when no texture exists)
- depleted band: one sentence (same: load fills the gaps)
- mixed × varied_week true: one sentence
- mixed × varied_week false: one sentence
- textured × varied_week true: one sentence
- textured × varied_week false: one sentence

Token fallback: `"Week reads as {band_label}."` always populated.

### 5.12 life_context_panel

```typescript
type LifeContextPanel = {
    life_stage_summary:  SlotContent
    work_load_summary:   SlotContent
    sociality_summary:   SlotContent
}
```

Three sub-slots, each independently composed. The render layer presents them as a stacked panel; synthesis emits each separately.

#### 5.12.1 life_stage_summary

Dispatches on `cross_direction.life_stage`. Seven enum values, each with one interpretive sentence in §7.11.

Token fallback: `"Life-stage reading: {life_stage_label}."` using the display label table §6.16. Always populated.

**Voice note for life_stage_summary.** Per the design memo decision: `building`, `consolidating`, `re_evaluating`, `transitioning`, and `settled` can be named explicitly in prose ("Reading: settled. The architecture is in place; no current change in shape."). `enduring` and `drifting` compose around the term rather than naming it directly, because both are state-of-arc terms the audience may bristle at. Specific prose in §7.11.

#### 5.12.2 work_load_summary

Composes from the joint state of `paid_work_relationship` and `primary_load`. The architecturally meaningful combinations (per the engine specification §3.4.2) are authored as shape sentences in §7.12. Less-common combinations fall back to the token form.

Token fallback: `"Paid work reading: {paid_work_relationship_label}. Primary load: {primary_load_label}."` using §6.17 and §6.18. Always populated.

#### 5.12.3 sociality_summary

Composes from `sociality_default` and the Relationship Rebuilder direction's reading. Specific cases per §7.13 cover the architecturally significant compositions (e.g., social-by-default with quiet Relationship Rebuilder reading reduced relational domains; solitary-by-default with Relationship Rebuilder firing real-and-active).

Token fallback: `"Sociality reading: {sociality_label}."` using §6.19. Always populated.

### 5.13 the_narrowings_panel

```typescript
type TheNarrowingsPanel = {
    bands: NarrowingBandEntry[]
    summary: SlotContent
}

type NarrowingBandEntry = {
    band_field: 'structural' | 'experiential' | 'psychological' | 'identity' | 'energetic' | 'relational' | 'attention'
    display_name: string  // "Structural" / "Experiential" / "Psychological" / "Identity" / "Energetic" / "Relational" / "Attention"
    band: 'low' | 'moderate' | 'high'
    intensity: 33 | 66 | 100  // 33 = low, 66 = moderate, 100 = high
    observation: string  // Observation sentence from §7.16, keyed by {narrowing}_{intensity}
}
```

The `bands` array always contains seven entries, one per narrowing band on `EngineOutput.cross_direction`. The ordering follows the engine declaration order: structural, experiential, psychological, identity, energetic, relational, attention. Display names per §6.22.

The `observation` field carries the observation sentence from §7.16, looked up by `{narrowing}_{intensity}` key. For example, a band with `band_field: 'psychological'` and `band: 'high'` receives the observation sentence keyed as `psychological_high`. The observation sentence is the primary visible content in the render layer; the band value and display name are secondary.

The `band_field` value matches the engine's band field name with the `_narrowing_band` suffix stripped (i.e. `structural_narrowing_band` → `band_field: 'structural'`). The field makes `NarrowingBandEntry` self-describing: the render layer reads `band_field` to dispatch on visual treatment, and the test assertions in `expected_synthesis.json` assert by named field rather than positional index. The positional ordering convention above remains as the rendering order; the data is self-describing.

The `intensity` field is a render-layer convenience derived from the categorical `band` value. The render layer may use it for visual bar treatments or render the categorical state directly. The intensity is not an architectural reading; the band value is. Documenting this explicitly avoids implying false precision (the bands are not continuous; the engine emits discrete states).

The `summary` slot fills via shape sentences for slot `"narrowing_summary"` (§7.15). Token fallback per §5.13.1.

#### 5.13.1 Token fallback for narrowing_summary

```
"Bands reading: {n_high} high, {n_moderate} moderate, {n_low} low."
```

Where `n_high`, `n_moderate`, `n_low` count the bands at each value. The render layer drops any clause with zero count (e.g. if no bands read high, the high clause is omitted). Always populated; the panel summary slot never blanks.


## 6. Lookup tables

### 6.1 Direction display names

| Engine direction | Display name |
|---|---|
| `creator` | Creator |
| `freedom_designer` | Freedom Designer |
| `experience_seeker` | Experience Seeker |
| `relationship_rebuilder` | Relationship Rebuilder |
| `growth_focused` | Growth Focused |
| `contributor` | Contributor |

### 6.2 Direction card field tokens

#### 6.2.1 Pull

| Pull value | Token |
|---|---|
| 0-29 | low |
| 30-49 | moderate |
| 50-69 | present |
| 70-100 | strong |

#### 6.2.2 Past presence

| Value | Token |
|---|---|
| `yes` | present |
| `no` | absent |

#### 6.2.3 Felt cost

| Value | Token |
|---|---|
| 0-29 | low |
| 30-59 | moderate |
| 60-100 | high |

#### 6.2.4 Anticipation

| Value | Token |
|---|---|
| `none` | none |
| `mild` | mild |
| `quickening` | quickening |

#### 6.2.5 Quality (composite)

The Quality field on the card composes pull_quality and quadrant. Format: `"{pull_quality_token}, {quadrant_token}."`

Pull quality tokens (taking first value if array has multiple):

| Value | Token |
|---|---|
| `real` | real |
| `suppressed` | suppressed |
| `phantom` | desired direction |
| `phantom_partial` | desired direction (partial evidence) |
| `saturated` | soured |
| `behaviourally_divergent` | stated but moving elsewhere |
| (empty array) | not yet reading as a pull |

Quadrant tokens:

| Value | Token |
|---|---|
| `active` | active |
| `blocked` | blocked |
| `habit` | habit |
| `quiet` | quiet |

### 6.3 Constraint bands

Already specified in 5.6. For reference:

| Constraint | Band values |
|---|---|
| Energy | full / moderate / heavy depletion |
| Time | open / moderate / heavy time pressure |
| Body | full / shifted / limited |
| Permission | present / partial / blocked |

### 6.4 Domain values

Display labels for the `value` field on each domain:

| Engine value | Display label |
|---|---|
| `intact` | Intact |
| `reduced_wants_back` | Reduced, wants back |
| `reduced_at_peace` | Reduced, at peace |
| `wants_but_never_had` | Wants but never had |
| `never_been_part_of_his_life` | Never been part of life |

### 6.5 Domain display names

| Engine domain | Display name |
|---|---|
| `time_as_yours` | Time as yours |
| `energy_as_resource` | Energy as resource |
| `felt_aliveness` | Felt aliveness |
| `body_physical_aliveness` | Body |
| `curiosity` | Curiosity |
| `making` | Making (in life) |
| `conversation_depth` | Conversation depth |
| `being_known` | Being known |
| `friendship` | Friendship |
| `intimacy` | Intimacy |
| `mattering` | Mattering |
| `spiritual` | Spiritual |

### 6.6 Sustained constraint intensity bands

| SCI value | Band token (when life_shape_duration = "long") | Band token (otherwise) |
|---|---|---|
| 0-39 | low | low |
| 40-59 | moderate | moderate |
| 60-69 | heavy | heavy |
| 70-100 | heavy and long-running | heavy |

The two columns acknowledge that the deep-suppression branch's architectural significance combines SCI >= 70 with life_shape_duration = "long". The token reflects this combination.

### 6.7 Direction-to-TypeKey mapping (for recognition sentence lookup)

| Engine direction | TypeKey |
|---|---|
| `creator` | `creator` |
| `freedom_designer` | `freedom_designer` |
| `experience_seeker` | `experience_seeker` |
| `relationship_rebuilder` | `relationship_rebuilder` |
| `growth_focused` | `growth_focused` |
| `contributor` | `contributor` |

The synthesis layer constructs the recognition sentence lookup key as follows:

1. Take the firing direction set (per section 4 step 1).
2. Sort by pull descending; tie-break alphabetically by engine direction name.
3. Take the top 3 (or fewer, if fewer fire).
4. Map each engine direction to its TypeKey using the table above.
5. Join with commas, no spaces. Example: `["creator", "freedom_designer"]` sorted produces `"creator,freedom_designer"`.
6. Look up the resulting string in recognition_sentences.ts.

### 6.8 Term explanations

Plain-English explanations of architectural terms surfaced in the dashboard. The render layer reads this file and displays explanations in tooltip or popover UI when the user interacts with a term.

Entries cover all terms in sections 6.2 to 6.7 (band tokens, quality tokens, sub-shapes, etc.) plus inline-mentioned terms (capacity strain, mid-process, between shapes, stopped expecting, mattering, sustained constraint intensity, life shape duration, past presence, specificity), the v2-final extension vocabulary (expression space, held-attributed variants, life-texture bands, life-stage values, paid work, primary load, sociality default, comparison surface), and the v4 extension vocabulary (the spiritual domain, the seven narrowing band display names, the four canonical surfaced phrasings for cross_direction inputs).

Each entry maps the term as it appears in the dashboard (e.g., 'capacity strain', 'desired direction (partial evidence)', 'suppressed', 'shifted') to a plain-English explanation. Pronouns are allowed in tooltip explanations; the §7.0 pronoun-free rule applies to dashboard prose elsewhere, not to these tooltips. Length default: one short sentence; two when a disambiguation or recognition handle is genuinely needed; three only with deliberate exception.

| Term | Explanation |
|---|---|
| capacity strain | Pulling toward more in this direction, and pulling toward less in life overall, at the same time. |
| desired direction | A direction he named as wanted. The surrounding evidence hasn't caught up yet. |
| desired direction (partial evidence) | A direction he named as wanted. Some evidence reads in support, but not enough for a current pull. |
| suppressed | A direction that was once present, with low wanting now and conditions against it. |
| shifted (body) | Body capacity has changed from the past. Not at full capacity but not at limit either. |
| sustained constraint intensity | How heavy the energy, time, body, and permission constraints are stacking up. |
| life shape duration | How long the current shape of life has been in place. |
| between shapes | Recent change in life shape. No replacement structure in place yet. |
| mid-process | Active reaching that's recent and still finding its form. |
| stopped expecting | A direction has gone quiet because the wanting has been put down. |
| past presence | Whether this direction was present in earlier life. |
| specificity | How concretely the wanting attaches to a specific shape, person, or activity. |
| mattering | Whether his life feels like it counts to others or to something larger. |
| soured | A wanting that was once present but has gone bitter, tired, or used up. |
| stated but moving elsewhere | Words name one direction; behaviour is in another. |
| `expression space` | Whether the week contains the kind of activity, contact, or practice through which this direction can express itself. |
| `held attributed with expression` | Something specific he's holding, and the week has room for it. |
| `held attributed unexpressed` | Something specific he's holding, with no room in the week for it. |
| `life texture band` | How much texture the week contains and whether load is filling it. |
| `Empty (week)` | The week contains neither pressure nor texture. |
| `Depleted (week)` | The week is filled by load with no texture inside the gaps. |
| `Mixed (week)` | The week contains some texture. Neither empty nor full. |
| `Textured (week)` | The week contains substantial texture across multiple dimensions. |
| `varied week` | The weeks vary in ways that matter, rather than the same loop repeating. |
| `Building (life-stage)` | The major moves are still ahead. Still constructing. |
| `Consolidating (life-stage)` | In place. Deepening or refining what's there. |
| `Re-evaluating (life-stage)` | Active questioning of whether it's right. |
| `Transitioning (life-stage)` | A change is happening or imminent. |
| `Settled (life-stage)` | It works. Not trying to change it. |
| `Drifting (life-stage)` | It works in the sense that nothing forces a change. Not sure it's right. |
| `Enduring (life-stage)` | In place and being sustained under load. |
| `paid work (relationship)` | How paid work sits for him: whether it's chosen, endured, consuming, or just functional. Different from how many hours he works. |
| `primary load` | What's absorbing most of his time and energy right now, whether it's paid work or not. |
| `sociality default` | Where he sits when given the choice: toward people or toward solitude. |
| `comparison surface` | Two readings side by side: what he named and what the dashboard reads back from his answers. |
| `structural` | How much his life itself is pressing in: work load, time pressure, what he's allowed to do, where he is in life. The more these stack up, the heavier it gets. |
| `experiential` | How much genuine variation the week holds, beyond load and routine — or whether the days have flattened into the same shape repeating. |
| `psychological` | What happens to wants between their first surfacing and action. Whether they run through a filter on their way. |
| `identity` | How much the role he plays at work has become who he is everywhere else, including with old friends, family, on his own. |
| `energetic` | How alive the ordinary day still feels, and how much the body and its energy can still do. Whether sensation has dimmed, energy has dropped, or physical capacity has narrowed what's possible. |
| `relational` | The texture of contact and presence across his relationships. Both how thin the contact is and how present he is in it. |
| `attention` | Whether attention is in the moments he's in, or patterned elsewhere toward task. |
| `attention moving without much registering` | Attention is on tasks and responsibilities rather than what's in front of him. He moves through days without much registering. |
| `the role is who he is everywhere` | The role has consolidated into who he is. In and out of work, with old friends and new, the role is who he is. |
| `wanting running through a filter before it acts` | Most wants run through a check before they reach action. He typically arrives at "I do not need that" before the want acts. |
| `mostly absent in the relationships he has` | Even in relationships that are nominally close, attention is on managing or scanning rather than on the relationship. Presence is the exception. |

The four cross_direction canonical phrasings (last four rows above) are the term-explanation keys used by the compression-point pattern_paragraph sentences in §7.1. The phrasings are the man-facing surface vocabulary; the underlying enum values (`autopilot`, `role_consolidated`, `filters_pervasively`, `mostly_absent`) stay in the engine, fixture validation, and predicate code.

The other diagnostic terms from the engine specification that surface only in fixture validation or engine spec (e.g. `engaged`, `intermittent`, `filters_some`, `role_inflected`, `partial`, `present`) do not get term explanations because they do not surface to the man. They are engine-internal.

**Note on the role canonical phrasing.** The canonical phrase is "the role is who he is everywhere". The tooltip-target key in `term_explanations.ts` is this phrase. Pattern_paragraph sentences referencing the role-consolidated input value use this canonical phrase.

Term explanations are seeded in `src/synthesis/data/term_explanations.ts`. The file is a `Record<string, string>` mapping term to explanation. The render layer's UI treatment is decoupled: tooltip on hover, popover on tap, or expandable inline glossary. The data is the same regardless of UI.

### 6.9 Panel-heading explanations

Six major dashboard panels have panel-heading tooltips. Each panel heading displays a ? icon to the right of the heading text; clicking/tapping opens a popover with a short pub-register explanation of what the panel shows.

The six panels and their explanations:

| Panel | Explanation |
|---|---|
| The Narrowings | The seven narrowings and how they impact your life. |
| Direction Evidence | What you want versus the action you're taking. |
| The Current Shape | How work and life are sitting at the moment. |
| The Week's Texture | What your weeks look like. |
| What's Heavy | What feels heavy in your life. |
| What's Reduced | What's reduced in your life. |

**Second-person exception.** These panel-heading explanations use second person ("your life", "your weeks", "you're taking"). This is a deliberate exception to the §7.0 pronoun-free rule. The popover is a different surface from the dashboard prose—it's the system addressing the reader when he asks "what is this?" Direct address fits this specific interaction. The exception is scoped to panel-heading explanations; dashboard prose elsewhere remains pronoun-free.

The explanations are stored in `src/synthesis/data/term_explanations.ts` with keys:
- `the_narrowings_panel`
- `direction_evidence_panel`
- `the_current_shape_panel`
- `the_weeks_texture_panel`
- `whats_heavy_panel`
- `whats_reduced_panel`

The render layer's `PanelHeadingTooltip` component passes the matching key as the `:term` prop; the existing `TermPopover` lookup uses the key to fetch the explanation.

### 6.10 Engine name lowercase form (for sentence interpolation)

Used in closing lines and other inline-interpolated sentences where grammatical fluency matters. Display names (section 6.1) are for headlines, card labels, chart labels, and sentence-initial subjects. Engine name lowercase form is for mid-sentence references in observational lines.

| Engine direction | Lowercase form |
|---|---|
| `creator` | making |
| `freedom_designer` | freedom |
| `experience_seeker` | experience |
| `relationship_rebuilder` | relationship |
| `growth_focused` | growth |
| `contributor` | contribution |

### 6.11 Sentence interpolation

Sentence and token strings in data files may contain placeholders of the form `{name}`. The synthesis layer's logic files (cards.ts, closing_lines.ts, predicates.ts, etc.) substitute placeholders with values built from EngineOutput and InputMap before the sentence is written into the output structure.

Canonical placeholder names:

| Placeholder | Meaning | Source |
|---|---|---|
| `{direction_display}` | Canonical display name (e.g., 'Creator') | section 6.1 |
| `{direction_lower}` | Lowercase engine name for mid-sentence (e.g., 'making') | section 6.9 |
| `{name1}`, `{name2}`, `{name3}` | First, second, third firing direction display name (in pull-descending order) | section 6.1 |
| `{n}` | Firing direction count | section 4 step 1 |
| `{sci_band}` | SCI band token | section 6.6 |
| `{duration_band}` | Life shape duration band | InputMap |
| `{r}`, `{n_intact}`, `{o}` | Domain count tokens (reduced, intact, other) | section 5.5 |
| `{names}` | Comma-joined list of names | context-dependent |

Data files store sentences with placeholders verbatim. The relevant logic file builds an interpolation context per sentence-firing context (e.g., for a per-direction card sentence, the context contains `direction_display` and `direction_lower` for that specific direction) and substitutes.

Substitution is literal text replacement; placeholders not present in the context are left as `{placeholder}` in the output (a visible bug if it ships, intentionally so, to surface coverage gaps in the interpolation context construction).

Data files contain no functions for interpolation; substitution is logic-side only.

### 6.12 Self-report items metadata schema

Self-report items metadata lives in `src/synthesis/data/self_report_items.ts`. The file exports a fixed array of ten items per the engine specification.

```typescript
type SelfReportItem = {
    id: SelfReportItemId
    label: string                       // display label, as the man sees it
    architectural_anchors: Anchor[]
    influences_experience_layer: boolean
}

type Anchor =
    | { kind: 'domain';            name: DomainName }
    | { kind: 'direction';         name: DirectionName }
    | { kind: 'constraint';        name: 'energy' | 'time' | 'body' | 'permission' }
    | { kind: 'week_shape_flag';   name: WeekShapeFlagName }
```

The committed mappings:

| id | label | architectural_anchors | influences_experience_layer |
|---|---|---|---|
| `more_friends` | "More friends" | direction: relationship_rebuilder; domain: friendship; week_shape_flag: sees_people | true |
| `more_time_to_myself` | "More time to myself" | direction: freedom_designer; domain: time_as_yours | true |
| `something_just_for_me` | "Something just for me (a hobby, an interest)" | direction: experience_seeker; direction: creator; domain: curiosity | true |
| `more_energy` | "More energy" | domain: energy_as_resource; constraint: energy | false |
| `getting_back_in_shape` | "Getting back in shape" | domain: body_physical_aliveness; week_shape_flag: active_body | true |
| `something_to_look_forward_to` | "Something to look forward to" | direction: experience_seeker; domain: felt_aliveness; week_shape_flag: varied_week | true |
| `proper_conversation` | "A proper conversation now and then" | domain: conversation_depth; domain: being_known | true |
| `building_or_making` | "Building or making something" | direction: creator; domain: making; week_shape_flag: makes_things | true |
| `something_im_part_of` | "Something I'm part of" | direction: contributor; domain: mattering; week_shape_flag: belongs_to_group | true |
| `nothing_really` | "Nothing really, I'm fine" | (none) | false |

**Cross-kind anchor rule.** Where a self-report item's named absence has architectural overlap across anchor kinds (a man saying "more friends" is naming a reading the architecture would surface across direction, domain, and week_shape_flag readings), the item anchors all three to prevent semantic double-counting in the comparison surface (a Confirmed item via direction anchor + the same architectural fact resurfacing as a Surfaced week_shape_flag candidate). The cross-kind additions cover the cases where architectural overlap is concrete: `more_friends` anchors `sees_people`; `building_or_making` anchors `makes_things`; `getting_back_in_shape` anchors `active_body`. Other items (`something_just_for_me`, `proper_conversation`) have looser architectural-flag overlap (hobby could be solo/group; depth-conversation can read through non-in-person channels) and do not gain flag anchors at this calibration; revision may follow post-launch.

The engine reads `self_report.named_absences` for validation only (per the engine specification). The synthesis layer reads architectural_anchors from this file to compose the comparison surface (§5.10). The experience layer reads `influences_experience_layer` to determine which items bias recommendations (per the experience specification, downstream).

### 6.13 Week_shape flag architectural-significance order

For the Surfaced section's week_shape flag candidates (§5.10.2 priority 3), absent flags are ordered by architectural significance:

| Order | Flag | Significance |
|---|---|---|
| 1 | `belongs_to_group` | Belonging is a strong architectural absence; community/group anchoring carries weight. |
| 2 | `weekly_activity` | A recurring weekly thing outside work and household is core texture evidence; its absence reads architecturally even when other contacts exist. |
| 3 | `sees_people` | In-person contact outside the immediate household is core architectural texture. |
| 4 | `makes_things` | Making absent reads as architectural absence of self-direction. |
| 5 | `solo_practice` | Chosen solo practice absent is informative but less than the above. |
| 6 | `active_body` | Body in motion absent reads architecturally where Growth, Experience, or body-coded readings are firing; otherwise less informative than the above. |

Pressure flags (`work_dominates`, `weekends_consumed`) reading true is not an "absence" and they are not candidates for Surfaced; their presence is the typical concern, not their absence. The pattern flag (`varied_week`) is anchored to `something_to_look_forward_to` so its surfacing flows through that item rather than as a standalone flag candidate.

This is a first-pass ordering; calibration may revise.

### 6.14 life_texture_band display labels

| Engine value | Display label |
|---|---|
| `empty` | Empty |
| `depleted` | Depleted |
| `mixed` | Mixed |
| `textured` | Textured |

### 6.15 Load state composition label

The `load_state_label` on `life_texture_panel` summarises `work_dominates` and `weekends_consumed`:

| Combination | Label |
|---|---|
| Both true | "Loaded (work and weekends)" |
| `work_dominates` true only | "Loaded (work)" |
| `weekends_consumed` true only | "Loaded (weekends)" |
| Both false | "Uncluttered" |

### 6.16 Week_shape flag display labels

| Flag | Display label |
|---|---|
| `work_dominates` | Work dominates |
| `weekends_consumed` | Weekends consumed |
| `weekly_activity` | Weekly activity |
| `sees_people` | Sees people |
| `makes_things` | Makes things |
| `active_body` | Active body |
| `belongs_to_group` | Belongs to a group |
| `solo_practice` | Solo practice |
| `varied_week` | Varied week |

### 6.17 life_stage display labels

| Engine value | Display label |
|---|---|
| `building` | Building |
| `consolidating` | Consolidating |
| `re_evaluating` | Re-evaluating |
| `transitioning` | Transitioning |
| `settled` | Settled |
| `drifting` | Drifting |
| `enduring` | Enduring |

Display labels are for token fallbacks and inspection. The interpretive prose for `enduring` and `drifting` composes around the term rather than naming it directly (§7.11).

### 6.18 paid_work_relationship display labels

| Engine value | Display label |
|---|---|
| `defining` | Defining |
| `consuming` | Consuming |
| `functional` | Functional |
| `peripheral` | Peripheral |
| `between` | Between |
| `chosen` | Chosen |
| `endured` | Endured |

### 6.19 primary_load display labels

| Engine value | Display label |
|---|---|
| `paid_work` | Paid work |
| `caregiving` | Caregiving |
| `household_admin` | Household admin |
| `none` | None |

### 6.20 sociality_default display labels

| Engine value | Display label |
|---|---|
| `solitary_by_default` | Solitary by default |
| `balanced` | Balanced |
| `social_by_default` | Social by default |

### 6.21 Flag absence phrasing

For Surfaced section items naming an absent week_shape flag, the sentence template substitutes a flag-specific phrase per the table below. Used by §7.9 Surfaced templates.

| Flag | Phrasing |
|---|---|
| `belongs_to_group` | "no group belonging" |
| `sees_people` | "no regular in-person contact" |
| `makes_things` | "no regular making" |
| `active_body` | "no body in motion" |
| `weekly_activity` | "no recurring weekly thing" |
| `solo_practice` | "no chosen solo practice" |
| `varied_week` | "no variation in the weeks" |

### 6.22 Narrowing band display names

| Engine band field | `band_field` value | Display name | Full name | Character name |
|---|---|---|---|---|
| `structural_narrowing_band` | `structural` | Structural | Structural Narrowing | The Yes Man |
| `experiential_narrowing_band` | `experiential` | Experiential | Experiential Narrowing | The Shrunk Man |
| `psychological_narrowing_band` | `psychological` | Psychological | Psychological Narrowing | The Reasonable Man |
| `identity_narrowing_band` | `identity` | Identity | Identity Narrowing | The Cast Man |
| `energetic_narrowing_band` | `energetic` | Energetic | Energetic Narrowing | The Dimmed Man |
| `relational_narrowing_band` | `relational` | Relational | Relational Narrowing | The Stranger |
| `attention_narrowing_band` | `attention` | Attention | Attention Narrowing | The Surface Man |

The seven display names are dimension adjectives (Structural, Experiential, Psychological, Identity, Energetic, Relational, Attention). Each names a narrowing dimension the man would recognise: how his life's structure presses in, how much experiential variety his week holds, how psychological filtering operates on his wanting, how his identity consolidates around his role, how energetic capacity and aliveness read, how relational texture and presence compose, how his attention patterns. The full_name field provides the expanded form for tooltip headers; the character_name field provides the narrative character associated with each narrowing.

The `band_field` column corresponds to the self-describing identifier on `NarrowingBandEntry` (per §5.13). The render layer and the test assertions read `band_field` to dispatch on the seven dimensions; the `display_name` remains the man-facing label. The engine's emitted field names (with the `_narrowing_band` suffix) stay on `EngineOutput.cross_direction`; the synthesis layer maps from those to the shorter `band_field` values when composing each `NarrowingBandEntry`.

The term explanation for each is keyed in §6.8 above (keyed by the stable `band_field` token: structural, experiential, psychological, identity, energetic, relational, attention). The narrowings panel passes the `band_field` token directly to the tooltip lookup, decoupling the lookup key from the display label.


## 7. Shape sentences

The sentence library spans the slots enumerated in §7.1 through §7.15. Each sentence has a slot, predicate, and text. They are seeded in `src/synthesis/data/shape_sentences.ts`; the library grows over time. Calibration lines (§7.14) are seeded separately in `src/synthesis/data/calibration_lines.ts`; the file is currently empty and the mechanism is a forward hook.

### 7.0 Predicate notation conventions

Predicates in this section reference per-direction fields using the notation `d.X`. The synthesis layer constructs a merged per-direction view that combines `EngineOutput.directions[i]` with `InputMap.directions[i]` before predicate evaluation, accessed as `d`. The fields available on `d` are:

From EngineOutput (`output.directions[i]`): `pull`, `movement`, `quadrant`, `surfaced`, `past_relationship`, `was_once_renders`, `specificity`, `pull_quality`, `pull_state`, `expression_space`.

From InputMap (`input.directions[i]`): `stated_strength`, `felt_cost`, `anticipation`, `recent_action`, `past_presence`, `would_reach_for`, `saturation`, `stopped_expecting`.

The `capacity_strain` reading surfaces in predicates via the per-direction `pull_state` value (`d.pull_state.includes('capacity_strain')`), not via a separate input field. The cross_direction-side `capacity_strain` is an engine-internal computed state already reflected in the per-direction `pull_state` value the synthesis layer reads.

Cross-cutting fields and top-level fields are accessed by their full names, not via `d`:

- `output.cross_cutting.*` (between_shapes, mid_process)
- `output.sustained_constraint_intensity`
- `output.cross_direction.life_stage`, `output.cross_direction.sociality_default`, `output.cross_direction.paid_work_relationship`, `output.cross_direction.primary_load`, `output.cross_direction.life_texture_band`
- `output.cross_direction.week_shape.*` (varied_week, work_dominates, weekends_consumed, weekly_activity, sees_people, makes_things, active_body, belongs_to_group, solo_practice)
- `output.cross_direction.psychological_filtering`, `output.cross_direction.role_consolidation`, `output.cross_direction.attention_pattern`, `output.cross_direction.relational_presence`
- `output.cross_direction.structural_narrowing_band`, `output.cross_direction.experiential_narrowing_band`, `output.cross_direction.psychological_narrowing_band`, `output.cross_direction.identity_narrowing_band`, `output.cross_direction.energetic_narrowing_band`, `output.cross_direction.relational_narrowing_band`, `output.cross_direction.attention_narrowing_band`
- `input.life_shape_duration`, `input.recent_life_shape_change`, etc.
- `input.self_report.named_absences` (read directly from InputMap by the comparison surface)
- `input.domains.spiritual` (accessed identically to the other eleven domains)

Predicates are pure functions over the merged view plus the cross-cutting and top-level fields. They have no side effects and return boolean.

**Predicate helper.** `allBandsAt(out, value)` returns true if all seven narrowing bands on `out.cross_direction` equal the given value. Pure function, deterministic. Lives in `src/synthesis/predicates.ts` (logic file). Used by the compression-point predicates in §7.1 and the narrowing_summary predicates in §7.15.

```typescript
function allBandsAt(out: EngineOutput, value: 'low' | 'moderate' | 'high'): boolean {
  return (
    out.cross_direction.structural_narrowing_band === value &&
    out.cross_direction.experiential_narrowing_band === value &&
    out.cross_direction.psychological_narrowing_band === value &&
    out.cross_direction.identity_narrowing_band === value &&
    out.cross_direction.energetic_narrowing_band === value &&
    out.cross_direction.relational_narrowing_band === value &&
    out.cross_direction.attention_narrowing_band === value
  )
}
```

The helper is a small reusable predicate. The data/logic separation principle is preserved: shape sentences in `shape_sentences.ts` remain pure functions over named fields; the helper is itself a pure function.

**Voice convention.** Type-naming sentences (per-direction meaning sentences in section 3.3, combination sentences in section 3.2) use third-person plural type voice ("Creators need..."). Observational sentences (shape sentences in 7.1, card summaries in 7.2, closing lines in 7.3, permission sub-shape lines in 7.4, intact callouts in 7.8, calibration lines in 7.14, all panel-summary slots) use pronoun-free voice (gerunds, direct observations, or noun-phrase readings). No second-person "you" anywhere except where the user's own words are quoted back.

### 7.1 Pattern paragraph slot

Sentences in this slot have `slot: 'pattern_paragraph'` in shape_sentences.ts. They fill the `pattern_paragraph` slot per section 5.2.2.

Registration order. Compression-point entries (most specific; test all-seven-bands compositions plus 2-3 input conditions) register first. The v2-final-introduced head-of-registration entries follow. The canonical 10 entries register next. Lower-priority v2-final entries register last.

#### Compression-point entries (register at head)

| ID | Predicate | Sentence |
|---|---|---|
| `compression_high_depletion_driven` | `allBandsAt(out, 'high')` AND `inp.cross_direction.primary_load in {'caregiving', 'paid_work'}` AND `inp.constraints.permission_sub_shape in {'act_block', 'want_block'}` AND `inp.cross_direction.relational_presence === 'partial'` | All seven readings sit at high. The load is the shape of life now. Partly in the relationships he has; contact thin around them. |
| `compression_high_autopilot` | `allBandsAt(out, 'high')` AND `inp.cross_direction.relational_presence === 'mostly_absent'` | All seven readings sit at high. Attention moving without much registering; mostly absent in the relationships he has. |
| `compression_moderate_consuming_unfiltered` | `allBandsAt(out, 'moderate')` AND `inp.cross_direction.paid_work_relationship === 'consuming'` AND `inp.cross_direction.psychological_filtering === 'does_not_filter'` | All seven readings sit at moderate. Work consuming; the wanting reaches toward action without filter. Something running alongside the work. |
| `compression_moderate_consuming_filtered` | `allBandsAt(out, 'moderate')` AND `inp.cross_direction.paid_work_relationship === 'consuming'` AND `inp.cross_direction.psychological_filtering === 'filters_some'` | All seven readings sit at moderate. Work consuming; the wanting passes through some filtering before it acts. Something starting to form alongside. |
| `compression_moderate_functional_enduring` | `allBandsAt(out, 'moderate')` AND `inp.cross_direction.paid_work_relationship === 'functional'` AND `inp.cross_direction.life_stage === 'enduring'` | All seven readings sit at moderate. Work neutral; the shape has been in place a long time. Something held, not currently moving. |

The five compression-point predicates are mutually exclusive by construction (the all-high pair and the all-moderate triple test disjoint input combinations). The all-high and all-moderate predicates are more specific than the broader entries that follow; registering them first ensures the compression-point reading fires when applicable.

The interpolation context for the compression-point sentences is empty: none of the five reads direction-specific values; the sentences read the architectural shape without naming directions.

#### Other head-of-registration entries (register after compression-point, before canonical entries)

| ID | Predicate | Sentence |
|---|---|---|
| `enduring_long_depleted` | `cross_direction.life_stage = "enduring"` AND `life_shape_duration = "long"` AND `cross_direction.life_texture_band = "depleted"` AND there exist 2+ directions d such that `d.surfaced = true` | Several directions reading. The pattern has been long-running, the week reads thin around them. The load is the shape of life now. |
| `enduring_long_mixed` | `cross_direction.life_stage = "enduring"` AND `life_shape_duration = "long"` AND `cross_direction.life_texture_band = "mixed"` AND there exist 2+ directions d such that `d.surfaced = true` | Several directions reading. The pattern has been long-running, with some texture around it. The load is the shape of life now. |
| `drifting_with_pulls` | `cross_direction.life_stage = "drifting"` AND there exist 2+ directions d such that `d.surfaced = true` | Pulls reading without a settled direction. Nothing forcing a change; whether the current shape is right is unresolved. |
| `held_unexpressed_strong` | There exists a direction d such that `d.pull_state` contains `"held_attributed_unexpressed"` AND `d.pull >= 70` | Something specific held in {direction_display}, and the week has no current room for it. |
| `held_unexpressed_moderate` | There exists a direction d such that `d.pull_state` contains `"held_attributed_unexpressed"` AND `d.pull < 70` AND there exist 2+ other directions d' surfaced | Something specific held in {direction_display}, with no current room for it. Other directions are reading too. |
| `mixed_band_uniform_pattern` | `cross_direction.life_texture_band = "mixed"` AND `cross_direction.week_shape.varied_week = false` AND there exist 2+ directions d such that `d.surfaced = true` AND no direction d has `d.pull_state` containing `"capacity_strain"` AND no direction d has `d.pull_state` containing `"held_attributed_with_expression"` or `"held_attributed_unexpressed"` | Several directions reading, with some texture around them. The same pattern, repeating. |
| `depleted_band_with_held` | `cross_direction.life_texture_band = "depleted"` AND there exists a direction d such that `d.specificity = "strong"` AND `d.pull_state` contains `"held_attributed_unexpressed"` | Something specific held in {direction_display}. The week is absorbed by load with no current room for it. |

For all `held_unexpressed_*` sentences and for `depleted_band_with_held`, the interpolation context for `{direction_display}` is set to the highest-pull direction with `held_attributed_unexpressed` firing.

**On the `mixed_band_uniform_pattern` predicate exclusions.** The predicate excludes directions with `capacity_strain` or either held-attributed Pull state value firing. Without these exclusions, the entry would shadow more specific entries (notably `active_with_tension`, which fires on directions with capacity_strain + active quadrant + pull ≥ 70), and the head-of-list registration would pre-empt the existing entries' more specific architectural readings. The exclusions restrict the new entry to cases where the mixed-band + uniform-week reading is genuinely the primary architectural shape, leaving more specific compositions to entries registered later.

#### Canonical entries (register after head entries)

| ID | Predicate | Sentence |
|---|---|---|
| `deep_suppression_multi` | There exist 3+ directions d such that (`d.pull_quality` contains `"suppressed"`) AND (`d.past_presence = yes`), AND `sustained_constraint_intensity >= 70`, AND `life_shape_duration = "long"` | Several directions reading with past presence and stated wanting low. The constraint pattern has been heavy and long-running. |
| `suppressed_standard_multi` | There exist 2+ directions d such that (`d.pull_quality` contains `"suppressed"`) AND (`d.past_presence = yes`) AND (`d.felt_cost >= 50`), AND `60 <= sustained_constraint_intensity < 70`, AND `life_shape_duration != "long"` | Several directions reading with past presence, real felt cost, and stated wanting low. Constraint heavy without being long-running. |
| `active_with_tension` | There exists a direction d such that `d.quadrant = "active"` AND `d.pull >= 70` AND `d.pull_state` contains `"capacity_strain"` | One direction reading active and strong. Capacity strain firing alongside: pull on this and pull toward less weight overall, at the same time. |
| `active_going_through_motions` | There exists a direction d such that `d.quadrant = "active"` AND `d.pull < 70`, AND `cross_cutting.mid_process.fires = true` | One direction reading active. The reaching is recent. |
| `saturated` | There exists a direction d such that `d.pull_quality` contains `"saturated"` | Wanting present on a direction, but soured. |
| `desired_direction_partial` | There exists a direction d such that `d.pull_quality` contains `"phantom_partial"` AND no direction d' has `d'.pull_quality` containing `"real"` or `"suppressed"` or `"saturated"` or `"behaviourally_divergent"` | A desired direction named: {direction_display}. The surrounding readings are still partial; the conditions for acting haven't shown up yet. |
| `desired_direction_full` | There exists a direction d such that `d.pull_quality` contains `"phantom"` AND no direction d' has `d'.pull_quality` containing `"real"` or `"suppressed"` or `"saturated"` or `"behaviourally_divergent"` | A desired direction stated strongly: {direction_display}. The surrounding readings haven't yet caught up. |
| `between_shapes_clean` | `cross_cutting.between_shapes.fires = true`, AND no direction d has `d.pull_quality` contains `"suppressed"` | Recent change in life shape, no replacement structure yet in place. |
| `empty_pulls_past_present_wants` | All 6 directions have empty `pull_quality`, AND there exist 3+ directions d such that `d.past_presence = yes`, AND fewer than 3 domains have `value = "reduced_at_peace"` | No direction reading as a current pull. Several directions register past presence; the wanting has gone quiet. |
| `empty_pulls_past_present_at_peace` | All 6 directions have empty `pull_quality`, AND there exist 3+ directions d such that `d.past_presence = yes`, AND there exist 3+ domains m such that `m.value = "reduced_at_peace"` | No direction reading as a current pull. Several directions register past presence; the wanting reads as having been let go. |

#### Lower-priority entries (register last)

| ID | Predicate | Sentence |
|---|---|---|
| `empty_band_with_phantom` | `cross_direction.life_texture_band = "empty"` AND there exists a direction d such that `d.pull_quality` contains `"phantom"` or `"phantom_partial"` | A direction named: {direction_display}. The week shows little around it yet. |
| `empty_band_reaching` | `cross_direction.life_stage` in `{"re_evaluating", "transitioning"}` AND `cross_direction.life_texture_band = "empty"` AND there exist 1+ directions d such that `d.surfaced = true` | Direction reading without expression in the week. The week shape is still forming. |
| `textured_band_multiple_firing` | `cross_direction.life_texture_band = "textured"` AND there exist 3+ directions d such that `d.surfaced = true` AND no other §7.1 sentence has matched | Several directions reading. The week has texture across multiple dimensions. |

For `empty_band_with_phantom`, `{direction_display}` is the highest-pull phantom direction.

Predicates are evaluated in registration order. First match wins. The direction-combination lookup (section 3.2) fills `recognition_paragraph` independently; these shape sentences fill `pattern_paragraph` and are evaluated regardless of whether a combination sentence matched.

For `desired_direction_partial` and `desired_direction_full`, the interpolation context for `{direction_display}` is set to the display name of the primary firing direction (first in pull-descending order).

### 7.2 Direction card summary slot

Predicates evaluate against the specific direction the card represents. Where d is this card's direction.

Registration order. The four held_attributed_unexpressed entries register before the canonical entries (they take precedence when expression-space is absent on a strong-specificity direction on Making, Relationship, Growth, or Contribution). The card_summary library is extended minimally for held_attributed_unexpressed cases on the four directions where strong specificity without expression is plausible; Freedom and Experience are excluded because their expression_space mappings include the man's own ungated time and varied activity respectively, where strong specificity without expression-space is architecturally improbable.

| ID | Predicate | Sentence |
|---|---|---|
| `card_held_unexpressed_creator` | `d.direction = "creator"` AND `d.pull_state` contains `"held_attributed_unexpressed"` | Specific making held, with no current room for it. |
| `card_held_unexpressed_relationship_rebuilder` | `d.direction = "relationship_rebuilder"` AND `d.pull_state` contains `"held_attributed_unexpressed"` | Specific relational holding, with no current contact for it. |
| `card_held_unexpressed_growth_focused` | `d.direction = "growth_focused"` AND `d.pull_state` contains `"held_attributed_unexpressed"` | Specific growth held, with no current channel for it. |
| `card_held_unexpressed_contributor` | `d.direction = "contributor"` AND `d.pull_state` contains `"held_attributed_unexpressed"` | Specific contribution held, with no current context for it. |
| `card_real_active_strong` | `d.pull_quality` contains `"real"` AND `d.quadrant = "active"` AND `d.pull >= 70` | Wanting and doing reading together. |
| `card_real_active_moderate` | `d.pull_quality` contains `"real"` AND `d.quadrant = "active"` AND `d.pull < 70` | Real pull and movement, both reading present. |
| `card_real_blocked` | `d.pull_quality` contains `"real"` AND `d.quadrant = "blocked"` | Real pull, movement held back. |
| `card_real_quiet` | `d.pull_quality` contains `"real"` AND `d.quadrant = "quiet"` | Real but quiet; neither pressing nor moving much. |
| `card_real_habit` | `d.pull_quality` contains `"real"` AND `d.quadrant = "habit"` | Movement without strong pull underneath. |
| `card_suppressed_blocked` | `d.pull_quality` contains `"suppressed"` AND `d.quadrant = "blocked"` | Past presence with stated wanting low; conditions unfavourable. |
| `card_suppressed_active` | `d.pull_quality` contains `"suppressed"` AND `d.quadrant = "active"` | Activity reading high; the wanting underneath reads suppressed. |
| `card_suppressed_habit` | `d.pull_quality` contains `"suppressed"` AND `d.quadrant = "habit"` | Movement still reading; the wanting underneath has gone quiet. |
| `card_suppressed_quiet` | `d.pull_quality` contains `"suppressed"` AND `d.quadrant = "quiet"` | Past presence reading, current pressure absent. |
| `card_phantom` | `d.pull_quality` contains `"phantom"` or `"phantom_partial"` | A desired direction; the wanting is named, the action hasn't yet followed. |
| `card_saturated` | `d.pull_quality` contains `"saturated"` | The wanting has soured. |
| `card_behaviourally_divergent` | `d.pull_quality` contains `"behaviourally_divergent"` | Stated wanting reading; the chosen direction is elsewhere. |
| `card_empty_habit` | `d.pull_quality` is empty AND `d.quadrant = "habit"` | Movement reading without a wanting underneath. |
| `card_empty_quiet` | `d.pull_quality` is empty AND `d.quadrant = "quiet"` | Not reading as a direction here. |

Predicate evaluation order matches the table order; first match wins per direction. Quality-only predicates (`card_phantom`, `card_saturated`, `card_behaviourally_divergent`) are placed after the quality+quadrant predicates of the same quality so they do not shadow the more specific entries.

**Coverage matrix.** The {`pull_quality[0]` × `quadrant`} type space has 7 quality values (`real`, `suppressed`, `phantom`, `phantom_partial`, `saturated`, `behaviourally_divergent`, plus the empty-array sentinel) × 4 quadrants = 28 nominal cells. The quality+quadrant predicates cover the reachable cells (the three quality-only predicates each cover all 4 quadrants of their quality; the remaining predicates pin a single cell each, with `real × active` further split by pull threshold). **2 cells are unreachable by engine logic**, `(empty) × active` and `(empty) × blocked`, because empty `pull_quality` requires `pull < 30` (per `computePullQuality` in `src/engine/scoring/direction.ts`) and `quadrant ∈ {active, blocked}` requires `pull >= 50`. Those two cells are deliberate gaps, not authoring debt. The remaining reachable cells are all authored, so every reachable {quality, quadrant} combination has a card-summary sentence. The four held_attributed_unexpressed entries operate in a third dimension (Pull state on specific directions) and fire before the standard matrix evaluation, taking precedence when the unexpressed reading is present.

**First-fire rule and suppression contract.** Each predicate id fires its `interpretive_text` only on the first card matching it under the iteration order (`pull` descending, alphabetical tiebreak on `direction_engine_name`). Subsequent cards whose predicate id has already been claimed receive `interpretive_text = null`. So do cards whose direction matches no predicate (in practice only the two unreachable cells above, plus any future quality combinations not yet authored).

When `interpretive_text = null`, synthesis emits `token_text = ''` (empty string) for the card's `summary` slot, **not** the composite quality token. The render layer's `shouldRenderSlot` (section 2.3) drops the slot entirely on the empty-SlotContent rule. The composite quality token (`"{pull_quality_token}, {quadrant_token}."`, per section 6.2.5) still surfaces exactly once per card via the `Quality` entry in `fields[]` (section 5.3); the previous fallback emission of the same composite into `summary.token_text` produced visible duplication on the rendered card and has been removed. See section 5.3 for the asymmetry between the claiming card (which keeps `summary.token_text` set to the composite as a graceful-degradation backup) and the suppressed siblings (which emit `''`).

### 7.3 Closing line slot

Per-direction lines evaluate against the specific direction the line represents. Where d is the direction this line attaches to (when applicable):

| Closing line ID | Predicate | Sentence |
|---|---|---|
| `closing_capacity_strain` | `d.pull_state` contains `"capacity_strain"` (per direction) | Pulling toward more in {direction_lower}, and toward less weight overall. |
| `closing_stopped_expecting` | `d.pull_state` contains `"stopped_expecting"` (per direction) | Quietly stopped expecting in {direction_lower}. |
| `closing_phantom` | `d.pull_quality` contains `"phantom"` or `"phantom_partial"` (per direction) | {direction_display} named as a desired direction. The conditions for acting on it haven't shown up yet. |
| `closing_between_shapes` | `cross_cutting.between_shapes.fires = true` | Between shapes; the new shape isn't fully there yet. |
| `closing_mid_process` | `cross_cutting.mid_process.fires = true` | The reaching is recent and still finding its form. |

Display name vs lowercase engine name: for `closing_phantom`, the direction is the subject of the sentence (sentence-initial) so the display name fits. For `closing_capacity_strain` and `closing_stopped_expecting`, the direction is mid-sentence and the lowercase engine name (section 6.9) reads better.

Suppression rules (per section 5.8):

- `closing_mid_process` is suppressed when `active_going_through_motions` matched in pattern_paragraph.
- `closing_between_shapes` is suppressed when `between_shapes_clean` matched in pattern_paragraph.
- `closing_capacity_strain` for direction d is suppressed when `active_with_tension` matched in pattern_paragraph on direction d.
- `closing_phantom` for direction d is suppressed when `desired_direction_partial` or `desired_direction_full` matched in pattern_paragraph on direction d.

### 7.4 Permission sub-shape slot

Complete enumeration over sub_shape values when permission fires (the firing condition is uniform per section 5.6):

| Sub-shape | Sentence |
|---|---|
| `want_block` | Wanting that isn't being let in. |
| `say_block` | Wanting something that hasn't been said out loud. |
| `act_block` | Wanting something thought about but not acted on. |
| `present` | Permission reading partial; nothing specific blocking. |

### 7.5 Life-texture summary slot

Sentences fill `life_texture_panel.summary`. Six interpretive cells covering `life_texture_band` × `varied_week`.

| ID | Predicate | Sentence |
|---|---|---|
| `life_texture_empty` | `cross_direction.life_texture_band = "empty"` | The week reads empty: nothing absorbing, nothing filling yet. |
| `life_texture_depleted` | `cross_direction.life_texture_band = "depleted"` | The week reads absorbed by load. No texture inside the gaps. |
| `life_texture_mixed_varied` | `cross_direction.life_texture_band = "mixed"` AND `cross_direction.week_shape.varied_week = true` | Some texture across the week. The pattern shifts week to week. |
| `life_texture_mixed_uniform` | `cross_direction.life_texture_band = "mixed"` AND `cross_direction.week_shape.varied_week = false` | Some texture across the week. The same pattern, repeating. |
| `life_texture_textured_varied` | `cross_direction.life_texture_band = "textured"` AND `cross_direction.week_shape.varied_week = true` | Substantial texture across the week, varied week to week. |
| `life_texture_textured_uniform` | `cross_direction.life_texture_band = "textured"` AND `cross_direction.week_shape.varied_week = false` | Substantial texture across the week, in a repeating shape. |

**Coverage matrix.** Four band values × two varied_week values = 8 nominal cells. The two `empty` cells and the two `depleted` cells collapse (varied_week is architecturally irrelevant when there is no texture to vary), so 6 cells are meaningful. All 6 are authored. Complete coverage.

### 7.6 Life-texture pattern note slot

Sentences fill `life_texture_panel.pattern_note`. Two entries reading varied_week directly.

| ID | Predicate | Sentence |
|---|---|---|
| `pattern_varied` | `cross_direction.week_shape.varied_week = true` AND `cross_direction.life_texture_band` in `{"mixed", "textured"}` | Weeks vary from one another. |
| `pattern_uniform` | `cross_direction.week_shape.varied_week = false` AND `cross_direction.life_texture_band` in `{"mixed", "textured"}` | The same shape week after week. |

The predicate excludes `empty` and `depleted` bands because at those bands the texture-summary sentence (section 7.5) handles the reading and a separate pattern_note would duplicate.

### 7.7 Expression space caption slot

Sentences fill `direction_cards[i].expression_space_caption`. Six entries, one per direction, fire only when `expression_space === "no_space"`. The `has_space` case produces null interpretive_text and empty token_text; the render layer drops the slot per the empty-SlotContent rule. The asymmetry is by design (section 5.3 modification rationale): the captions concentrate on the architecturally informative cases.

Each predicate gates additionally on the direction reading materially (`d.pull >= 30 OR d.pull_quality non-empty`); a direction with `expression_space = no_space` AND `pull < 30 AND pull_quality empty` does not surface a caption (the direction itself is not registering enough for an expression-space reading to be meaningful).

| ID | Predicate | Sentence |
|---|---|---|
| `expression_space_creator_no` | `d.direction = "creator"` AND `d.expression_space = "no_space"` AND (`d.pull >= 30` OR `d.pull_quality non-empty`) | The week has no current room for this. |
| `expression_space_relationship_rebuilder_no` | `d.direction = "relationship_rebuilder"` AND `d.expression_space = "no_space"` AND (`d.pull >= 30` OR `d.pull_quality non-empty`) | The contact for this is not in the week. |
| `expression_space_experience_seeker_no` | `d.direction = "experience_seeker"` AND `d.expression_space = "no_space"` AND (`d.pull >= 30` OR `d.pull_quality non-empty`) | The week reads narrow around this. |
| `expression_space_freedom_designer_no` | `d.direction = "freedom_designer"` AND `d.expression_space = "no_space"` AND (`d.pull >= 30` OR `d.pull_quality non-empty`) | No room for this in the week. |
| `expression_space_growth_focused_no` | `d.direction = "growth_focused"` AND `d.expression_space = "no_space"` AND (`d.pull >= 30` OR `d.pull_quality non-empty`) | The week reads no channel for this. |
| `expression_space_contributor_no` | `d.direction = "contributor"` AND `d.expression_space = "no_space"` AND (`d.pull >= 30` OR `d.pull_quality non-empty`) | The context for this is not in the week. |

These read as single observations under the card, not full sentences. Voice: pronoun-free, observational, brief.

**Coverage matrix.** Six direction × no_space cells, all authored. The six direction × has_space cells deliberately produce no caption (architecturally uninformative; the default state needs no naming). The cells where direction is not materially reading (`pull < 30 AND pull_quality empty`) deliberately produce no caption (the direction itself does not warrant the expression-space observation).

### 7.8 Domains intact callout slot

Both predicates exclude domains with `value = never_been_part_of_his_life` from the intact-predicate counts. Never-been-part-of-his-life is a baseline reading, not a reduction the predicate should count toward "intact alongside reductions."

| ID | Predicate | Sentence |
|---|---|---|
| `domains_mattering_intact_with_many_reductions` | mattering domain has `fires=false` (intact), AND there exist 8+ domains m such that `m.fires=true` AND `m.value !== 'never_been_part_of_his_life'` | Mattering reading intact alongside multiple reductions. |
| `domains_structural_intact` | mattering, time_as_yours, AND energy_as_resource domains all have `fires=false` (intact), AND there exist 4+ domains m, distinct from mattering/time_as_yours/energy_as_resource, such that `m.fires=true` AND `m.value !== 'never_been_part_of_his_life'` | Structural domains reading intact alongside reductions. |

### 7.9 Comparison surface item slot

Sentences compose per item across Confirmed, Quiet, and Surfaced sections.

#### Confirmed section templates

Each Confirmed item names what the man named, then names what the architecture reads. The domain anchor templates dispatch on the domain's `value` field to avoid mischaracterising `wants_but_never_had` and `never_been_part_of_his_life` readings as "reduced"; those domain values name architecturally distinct states from `reduced_wants_back` / `reduced_at_peace`.

| Anchor kind that fired | Domain value (if domain anchor) | Template |
|---|---|---|
| Direction (any) | — | "{item_label}. Architecture reads {direction_display} firing." |
| Domain | `reduced_wants_back` or `reduced_at_peace` | "{item_label}. Architecture reads {domain_display} as reduced." |
| Domain | `wants_but_never_had` | "{item_label}. Architecture reads {domain_display} as a want never had." |
| Domain | `never_been_part_of_his_life` | "{item_label}. Architecture reads {domain_display} as not part of his life." |
| Constraint (any) | — | "{item_label}. Architecture reads {constraint_display} too." |
| Week_shape_flag (absence) | — | "{item_label}. {flag_absence_phrasing}." |

When multiple anchors fire for a single item, the highest-priority anchor governs the rendered sentence (priority: direction > domain > constraint > week_shape_flag). The other firing anchors are tracked in the `reference` field for inspection.

The `{item_label}` substitutes the self-report item's display label (per section 6.11 table).

**Composition-logic note for `comparison_surface.ts`.** When the highest-priority firing anchor is a domain anchor, the composition reads the domain's `value` from EngineOutput.domains and dispatches to the appropriate template variant. The variant is selected per the table above; if the domain value is `intact`, the anchor did not fire in the first place (per section 5.10.1 firing condition), so this case never occurs. The four domain values that can fire an anchor (`reduced_wants_back`, `reduced_at_peace`, `wants_but_never_had`, `never_been_part_of_his_life`) all have a template variant.

#### Quiet section templates

| Anchor kind | Template |
|---|---|
| Direction, Domain, Constraint | "{item_label}. Architecture reads it as present." |
| Week_shape_flag | "{item_label}. {flag_absence_phrasing} reads as present." |

The architectural intent: when the man names something but the engine reads no architectural correlate, the reading is "the man is naming a wish; the architecture currently reads it as present in some form." The week_shape_flag variant uses the flag-specific phrasing for grammatical composition.

#### Surfaced section templates

Voice: pronoun-free, with the "Not in the named list." suffix appearing on the **first** Surfaced item only. Items 2 and 3 render as plain architectural observations without the suffix. The summary sentence and the first item together carry the comparison framing; the subsequent items extend the reading without re-asserting the absence.

Three consecutive "Not in the named list." suffixes compound into a tally effect that reads more accusatorily than the pronoun-free design intends. The single-suffix rule preserves the comparison frame while preventing the cumulative tally.

**Templates for the first Surfaced item (with suffix):**

| Reading type | Template |
|---|---|
| `firing_direction` | "Architecture reads {direction_display} firing. Not in the named list." |
| `reduced_domain` | "Architecture reads {domain_display} reduced. Not in the named list." |
| `absent_flag` | "Architecture reads {flag_absence_phrasing}. Not in the named list." |

**Templates for subsequent Surfaced items (items 2 and 3, no suffix):**

| Reading type | Template |
|---|---|
| `firing_direction` | "Architecture reads {direction_display} firing." |
| `reduced_domain` | "Architecture reads {domain_display} reduced." |
| `absent_flag` | "Architecture reads {flag_absence_phrasing}." |

The dispatch is positional: the first item in the Surfaced array (after the priority-ordered selection in section 5.10.2 step 3) receives the suffixed template; items at index 1 and 2 receive the plain template. The composition logic in `comparison_surface.ts` handles the dispatch.

The `{flag_absence_phrasing}` substitutes a flag-specific phrase per section 6.20.

### 7.10 Comparison surface summary slot

The panel's `summary` slot composes from the joint state of Confirmed / Quiet / Surfaced counts. Six interpretive entries.

| ID | Predicate | Sentence |
|---|---|---|
| `comparison_all_confirmed` | `confirmed.length >= 1` AND `quiet.length = 0` AND `surfaced.length = 0` | What's named reads in the architecture too. |
| `comparison_all_quiet` | `confirmed.length = 0` AND `quiet.length >= 1` AND `surfaced.length = 0` | What's named reads as present in the architecture. |
| `comparison_confirmed_and_surfaced` | `confirmed.length >= 1` AND `surfaced.length >= 1` | What's named reads in the architecture. Other readings sit alongside. |
| `comparison_surfaced_only_nothing_really` | `surfaced.length >= 1` AND `confirmed.length = 0` AND `quiet.length = 0` AND `"nothing_really"` in `named_absences` | Nothing named missing. The architecture reads several things. |
| `comparison_surfaced_only_no_response` | `surfaced.length >= 1` AND `confirmed.length = 0` AND `quiet.length = 0` AND `named_absences.length = 0` | No self-report entries. The architecture reads several things. |
| `comparison_mixed` | `confirmed.length >= 1` AND `quiet.length >= 1` | What's named partly reads in the architecture; some reads as present. |

Token fallback: `"What's named and what the architecture reads."` (single neutral string).

### 7.11 Life-stage summary slot

Sentences fill `life_context_panel.life_stage_summary`. Seven entries, one per life_stage value. `enduring` and `drifting` compose around the term; the other five name it explicitly.

| ID | Predicate | Sentence |
|---|---|---|
| `life_stage_building` | `cross_direction.life_stage = "building"` | Reading: building. The major moves are still ahead. |
| `life_stage_consolidating` | `cross_direction.life_stage = "consolidating"` | Reading: consolidating. Deepening what is already in place. |
| `life_stage_re_evaluating` | `cross_direction.life_stage = "re_evaluating"` | Reading: re-evaluating. Whether the current architecture is right remains an open question. |
| `life_stage_transitioning` | `cross_direction.life_stage = "transitioning"` | Reading: transitioning. A change is happening or imminent. |
| `life_stage_settled` | `cross_direction.life_stage = "settled"` | Reading: settled. The architecture is in place; no current change in shape. |
| `life_stage_enduring` | `cross_direction.life_stage = "enduring"` | The architecture is in place. Getting on with it. |
| `life_stage_drifting` | `cross_direction.life_stage = "drifting"` | The architecture is in place. Nothing pushing for change. Not sure it's right. |

### 7.12 Work-load summary slot

Sentences fill `life_context_panel.work_load_summary`. Composes across `paid_work_relationship` × `primary_load`. The architecturally meaningful combinations are authored; the matrix is not exhaustively covered.

| ID | Predicate | Sentence |
|---|---|---|
| `work_load_chosen_paid` | `paid_work_relationship = "chosen"` AND `primary_load = "paid_work"` | Paid work reads chosen. The load is also paid work. |
| `work_load_chosen_caregiving` | `paid_work_relationship = "chosen"` AND `primary_load = "caregiving"` | Paid work reads chosen. The current load is elsewhere, in caring. |
| `work_load_endured_paid` | `paid_work_relationship = "endured"` AND `primary_load = "paid_work"` | Paid work reads endured. The load is paid work. Compressed. |
| `work_load_endured_caregiving` | `paid_work_relationship = "endured"` AND `primary_load = "caregiving"` | Paid work reads endured. The load is caring. Both compress. |
| `work_load_consuming_paid` | `paid_work_relationship = "consuming"` AND `primary_load = "paid_work"` | Paid work reads consuming. It is also the load. |
| `work_load_consuming_caregiving` | `paid_work_relationship = "consuming"` AND `primary_load = "caregiving"` | Paid work reads consuming. The load is caring on top. |
| `work_load_defining_paid` | `paid_work_relationship = "defining"` AND `primary_load = "paid_work"` | Paid work defines the shape. The work is who he is, not what he does. |
| `work_load_functional_paid` | `paid_work_relationship = "functional"` AND `primary_load = "paid_work"` | Paid work reads functional. The load is paid work itself. |
| `work_load_functional_caregiving` | `paid_work_relationship = "functional"` AND `primary_load = "caregiving"` | Paid work reads functional. The load is caring. |
| `work_load_functional_household` | `paid_work_relationship = "functional"` AND `primary_load = "household_admin"` | Paid work reads functional. The load is household administration. |
| `work_load_functional_none` | `paid_work_relationship = "functional"` AND `primary_load = "none"` | Paid work reads functional. No primary load reading. |
| `work_load_between_none` | `paid_work_relationship = "between"` AND `primary_load = "none"` | Between paid work commitments. No primary load reading. |
| `work_load_between_caregiving` | `paid_work_relationship = "between"` AND `primary_load = "caregiving"` | Between paid work commitments. The load is caring. |
| `work_load_peripheral_paid` | `paid_work_relationship = "peripheral"` AND `primary_load = "paid_work"` | Paid work reads peripheral. Yet paid work is what is absorbing. A tension reading. |

**Coverage matrix.** 7 × 4 = 28 nominal cells. 14 cells authored. Remaining 14 cells fall back to the token form. If real-world use produces other combinations consistently, author them.

Token fallback (for unauthored combinations): `"Paid work reading: {paid_work_relationship_label}. Primary load: {primary_load_label}."`

### 7.13 Sociality summary slot

Sentences fill `life_context_panel.sociality_summary`. Composes `sociality_default` × (Relationship direction state OR Contribution direction state). Sociality interacts architecturally with both Relationship (the man's pull toward intimate contact) and Contribution (the man's pull toward shared purpose); a solitary man with firing Contribution and absent group belonging is in a distinct state from a solitary man with firing Relationship. Both compositions are authored.

Eleven entries cover the architecturally significant cases across Relationship × sociality, Contribution × sociality, and balanced-sociality compositions. Evaluation order: Relationship-axis predicates first (more frequently architecturally significant), Contribution-axis predicates second, balanced-axis predicates third, balanced-default fallback last.

| ID | Predicate | Sentence |
|---|---|---|
| `sociality_solitary_relationship_active` | `sociality_default = "solitary_by_default"` AND Relationship direction has `pull_quality` containing `"real"` AND Relationship `quadrant = "active"` | Solitary by default; Relationship reading real and active. The pull is real despite the temperament. |
| `sociality_solitary_relationship_quiet` | `sociality_default = "solitary_by_default"` AND Relationship direction has `pull_quality` empty AND Relationship `quadrant = "quiet"` | Solitary by default; Relationship reading quiet. The two read consistent. |
| `sociality_solitary_relationship_suppressed` | `sociality_default = "solitary_by_default"` AND Relationship direction has `pull_quality` containing `"suppressed"` | Solitary by default. Relationship reading suppressed; the absence registers as felt despite the temperament. |
| `sociality_social_relationship_active` | `sociality_default = "social_by_default"` AND Relationship direction has `pull_quality` containing `"real"` AND Relationship `quadrant = "active"` | Social by default; Relationship reading real and active. The two read consistent. |
| `sociality_social_relationship_quiet_reduced` | `sociality_default = "social_by_default"` AND Relationship `pull_quality` empty AND Relationship `quadrant = "quiet"` AND 3+ relational domains reduced (friendship, intimacy, conversation_depth, being_known) | Social by default; relational domains read reduced. A disconnection pattern. |
| `sociality_solitary_contribution_firing_no_group` | `sociality_default = "solitary_by_default"` AND Contribution direction is in firing set AND `cross_direction.week_shape.belongs_to_group = false` | Solitary by default; Contribution reading firing without a group anchoring. The pull is to contribute, the context for it is not yet in place. |
| `sociality_social_contribution_firing_no_group` | `sociality_default = "social_by_default"` AND Contribution direction is in firing set AND `cross_direction.week_shape.belongs_to_group = false` | Social by default; Contribution reading firing without a group anchoring. The pull and the context don't match. |
| `sociality_social_contribution_quiet_belongs` | `sociality_default = "social_by_default"` AND Contribution direction has `pull_quality` empty AND `cross_direction.week_shape.belongs_to_group = true` | Social by default; group belonging in place but Contribution reading quiet. The structure is there; the pull is not currently. |
| `sociality_balanced_relationship_active` | `sociality_default = "balanced"` AND Relationship direction has `pull_quality` containing `"real"` AND Relationship `quadrant = "active"` | Balanced sociality; Relationship reading real and active. The two read consistent. |
| `sociality_balanced_relationship_reduced` | `sociality_default = "balanced"` AND 3+ relational domains reduced (friendship, intimacy, conversation_depth, being_known) AND no other balanced predicate fires | Balanced sociality; relational domains read thin. The pull is balanced but the texture is reduced. |
| `sociality_balanced_default` | `sociality_default = "balanced"` AND no other predicate fires | Reading: balanced sociality. |

**Coverage note.** Two new balanced entries (`sociality_balanced_relationship_active`, `sociality_balanced_relationship_reduced`) cover the most architecturally significant balanced-sociality cases; the default remains as a final fallback. Experience × sociality is not authored. Solitary-by-default men with firing Experience and Social-by-default men with quiet Experience are architecturally possible compositions but less frequently distinctive than the Relationship and Contribution axes. Flagged in section 12 for post-launch attention if the composition surfaces meaningfully.

Token fallback: `"Sociality reading: {sociality_label}."`

### 7.14 Calibration lines

Calibration lines are an optional layer of short framing sentences that compose with shape sentences in the pattern_paragraph slot. The mechanism exists for cases where a shape sentence's framing needs to be supplemented with confidence-magnitude or context information that the shape sentence itself doesn't carry.

The current cohort does not require calibration. The shape sentences in section 7.1 carry their own framing adequately for the architectural shapes the cohort surfaces. The data file `src/synthesis/data/calibration_lines.ts` is registered but seeded empty.

If real-world deployment surfaces patterns where calibration framing adds something the shape sentence doesn't carry (for example: short life history limiting evidence, very low stated strength across directions, recent life-shape change without supporting context), entries can be added to the file. Each entry has the structure:

```typescript
type CalibrationLine = {
    id: string
    predicate: (output: EngineOutput, input: InputMap) => boolean
    sentence: string
    composition: 'prepend'
}
```

Composition rule: `prepend` only. The calibration sentence renders before the matched shape sentence with a single space separator. The two render together as one paragraph in the pattern_paragraph slot.

When entries are added in future, each predicate must include an explicit non-empty firing-set guard (for example: `firing_set is non-empty AND ...`) to prevent vacuous-truth firing on empty-pulls profiles.

The file's empty state is intentional. The mechanism is available; current dashboards do not use it.

### 7.17 Surfaced finding sentences

Three sentence forms for surfaced findings that move onto direction cards as closing sentences. These replace the Named and Surfaced panel's surfaced content. The sentences surface architectural findings the man did not name.

The forms use second-person ("you didn't name", "your list"). This is a deliberate exception to the dashboard pronoun-free rule per §7.0; the second-person is doing recognition work that pronoun-free prose can't carry as naturally. The exception is scoped to this specific sentence library; other synthesis outputs remain pronoun-free.

| Case | Sentence |
|---|---|
| Firing surfaced (direction reading firing, not in the named list) | "You didn't name this one, but the architecture reads it firing." |
| Reduced surfaced (domain reading reduced, not in the named list) | "Not on your list, but the architecture reads this dropping." |
| Confirmed (named and matching architecture) | No surfaced sentence added — the direction is already named so there's nothing to surface. |

These three forms cover the cases the Surfaced panel currently handles. The synthesis layer attaches the matching sentence to the direction card's `surfaced_finding` field when the architecture surfaces a direction that was not in the man's named list. When the direction is named (confirmed) or quiet, `surfaced_finding` is undefined.

All three sentences are written without em-dashes or en-dashes.

### 7.15 Narrowing summary slot

Sentences fill `the_narrowings_panel.summary`. Four entries covering the major patterns plus a default. The default fallback is the token form per section 5.13.1. All four sentences use band names (high/moderate/low) consistently for register unity.

| ID | Predicate | Sentence |
|---|---|---|
| `narrowing_summary_all_high` | `allBandsAt(out, 'high')` | All seven dimensions reading high. |
| `narrowing_summary_all_moderate` | `allBandsAt(out, 'moderate')` | All seven dimensions reading moderate. |
| `narrowing_summary_mostly_open` | 5+ of the seven bands reading low | Most dimensions reading low. Light across the seven. |
| `narrowing_summary_concentrated_high` | 4 or more bands reading high AND NOT `allBandsAt(out, 'high')` | Several dimensions reading high; others moderate or low. |

The predicate identifiers retain "open" (in `narrowing_summary_mostly_open`) as internal convention; identifiers do not surface to the man. Only the rendered sentence text changes.

**Coverage and default.** The narrowing_summary slot reads major patterns. Token fallback `"Bands reading: {n_high} high, {n_moderate} moderate, {n_low} low."` is informative on its own; predicate-driven sentences cover only the architectural extremes (all-high, all-moderate, mostly-open, concentrated-high). If post-launch evidence surfaces additional patterns worth naming, sentences can be added without affecting the existing entries.

### 7.16 Narrowings observation library

Each narrowing band has three observation sentences, one per intensity level (high, moderate, low). These sentences describe what the narrowing dimension reads like at each level. The sentences are keyed by `{narrowing}_{intensity}` and stored in `src/synthesis/data/narrowings_observations.ts`.

| Key | Observation sentence |
|---|---|
| `psychological_high` | Wants and desires get heavily filtered. They often get ignored or set aside. |
| `psychological_moderate` | Some wants get acted on, others get filtered out. Depends on the cost. |
| `psychological_low` | Wants and desires are typically acted upon. |
| `structural_high` | Days disappear into work and obligations. The diary fills itself; one thing follows the next. |
| `structural_moderate` | Some weeks the diary fills itself. Others have more room to choose. |
| `structural_low` | Days have room. What happens when is mostly chosen. |
| `experiential_high` | Most days look the same. Same rhythm, same shape, week after week. |
| `experiential_moderate` | The week has some texture, but a lot of it repeats. |
| `experiential_low` | Days have different shapes. The week doesn't run on a fixed pattern. |
| `identity_high` | The role at work has become who he is everywhere. Old friends, family, on his own. The same person across all of them. |
| `identity_moderate` | The role colours things outside work, but he's still recognisable as someone separate from it. |
| `identity_low` | The role at work is something he does, not who he is. Other contexts have other versions of him. |
| `energetic_high` | Running on fumes. The body is depleted and the aliveness has gone quiet. |
| `energetic_moderate` | Energy holds most of the time, but aliveness comes and goes. |
| `energetic_low` | Energy is there. Things feel alive. |
| `relational_high` | Contact has thinned. Even the close ones feel more managed than present. |
| `relational_moderate` | Some relationships have presence; others are more about keeping things ticking over. |
| `relational_low` | Relationships have contact and presence in them. He's there when he's there. |
| `attention_high` | Attention is on the next thing, the task list, what needs doing. Days pass without much registering. |
| `attention_moderate` | Attention is sometimes in the moment, sometimes on the next task. |
| `attention_low` | Attention sits where he is. The moments register. |

All 21 sentences are written without em-dashes or en-dashes.

## 8. Computation order

Synthesis runs in this fixed order:

1. Compute firing direction set (section 4)
2. Compose headline (section 5.1)
3. Look up recognition_paragraph: direction-combination lookup (section 5.2.1)
4. Evaluate pattern_paragraph: shape sentences for slot `pattern_paragraph`, then apply calibration line composition if any calibration entry fires (sections 5.2.2 and 7.14). The compression-point shape sentences (section 7.1) registered at the head of the slot evaluate first; the v2-final additions and the original ten entries follow per registration order.
5. Build direction cards for all six directions, applying card summary first-fire rule and visual_state computation (section 5.3). Cards include `expression_space_caption` (section 7.7); the `held_attributed_line` field selects one of two sentences per Pull state value (section 5.3 modification rationale).
6. Compose direction evidence chart data (section 5.4)
7. Build domains panel (section 5.5). The spiritual domain joins the existing eleven via the existing pipeline; no special-casing.
8. Build constraints panel (section 5.6)
9. Build cross-cutting panel (section 5.7)
10. Build closing lines list, applying deduplication against pattern_paragraph matches (section 5.8)
11. Compute experience_candidate_directions (section 5.9)
12. Build life_texture_panel (section 5.11)
13. Build life_context_panel (section 5.12)
14. Build comparison_surface_panel (section 5.10). The Surfaced section's reduced-domain candidates exclude domains with `value = "never_been_part_of_his_life"`.
15. Build the_narrowings_panel (section 5.13)
16. Return assembled `RenderingInstructions`

Each step writes its output into the assembled object. Step 10 reads the matched shape sentence ID and (where applicable) the matched direction from step 4 to apply suppression; this is the only cross-step read in the original eleven steps. Steps 12, 13, 14, 15 read from already-computed engine outputs and InputMap; they do not feed back into earlier synthesis steps. The dependency graph remains acyclic.

**Cross-step state.** Step 4 produces an internal record of which shape sentence ID matched in pattern_paragraph (or null if none) and, for shape sentences whose suppression target is per-direction (`active_with_tension` and `desired_direction_partial`/`desired_direction_full`), the engine name of the matched direction. This record is held as a private value in `synthesise.ts` and passed as an argument to `closing_lines.ts` for the deduplication evaluation in step 10. The record is not surfaced on RenderingInstructions; the SlotContent type stays clean.

**Self-report items metadata.** Step 14 (comparison surface) reads architectural_anchors metadata from `src/synthesis/data/self_report_items.ts` to determine which engine readings are anchored by which self-report items. This is data, not derived state; the data is statically known per the section 6.11 table.

## 9. Validation

The synthesis layer is tested against the cohort fixtures using the same fixture mechanism the engine uses. For each fixture:

1. Run engine on `input.json` to produce EngineOutput
2. Run synthesis on EngineOutput to produce RenderingInstructions
3. Validate against `expected_synthesis.json` (added to each fixture directory)

`expected_synthesis.json` uses the same partial-assertion language as the engine's `expected.json`: bare values for exact match, `{between: [min, max]}` for ranges, `{contains: [...]}` for arrays that must include values, `{equals: [...]}` for arrays that must equal exactly.

Each fixture's expected_synthesis.json asserts:

- The headline directions (or situation text)
- Whether the recognition_paragraph's `interpretive_text` is non-null (and which combination key matched, if interpretive)
- Whether the pattern_paragraph's `interpretive_text` is non-null (and which sentence ID matched)
- Whether a calibration line fired and which one
- Whether each closing line fires (after deduplication)
- Whether each direction card has `held_attributed_line` set, and which of the two variants when applicable
- Each direction card's `visual_state` value
- Each direction card's `expression_space_caption` matched sentence ID (or null)
- Whether the permission sub-shape line fires
- The contents of `experience_candidate_directions` (firing-priority and past_presence_only entries)
- `life_texture_panel.summary` matched sentence ID (or null)
- `life_texture_panel.band_label`
- `life_texture_panel.pattern_note` matched sentence ID (or null)
- `life_context_panel.life_stage_summary` matched sentence ID
- `life_context_panel.work_load_summary` matched sentence ID (or token fallback indicator)
- `life_context_panel.sociality_summary` matched sentence ID
- `comparison_surface_panel`: null or populated; if populated, the items in each section by reference
- `the_narrowings_panel.bands`: ordered array of seven entries, each with display_name, band, intensity
- `the_narrowings_panel.summary` matched sentence ID (or token fallback indicator)
- `domains_panel.reduced_groups`: spiritual domain entry in the appropriate value group

This catches regressions when the synthesis layer is modified: changes to predicates, sentence library, or token tables that break expected fixture readings surface immediately.

## 10. Data and logic separation

The synthesis layer's correctness depends on keeping data (sentences, tokens, lookup tables) separate from logic (predicate evaluation, slot composition, computation order). This permits non-developer revision of the language without touching code.

Required file structure:

```
src/synthesis/
├── data/
│  ├── shape_sentences.ts      : section 7 sentence library, exported as ShapeSentence[]
│  ├── recognition_sentences.ts : section 3.2 direction-combination map and section 3.3 per-direction map, exported as Record<string, string>
│  ├── calibration_lines.ts    : section 7.14 calibration line library, exported as CalibrationLine[] (currently empty)
│  ├── term_explanations.ts    : section 6.8 term explanations library, exported as Record<string, string>
│  ├── tokens.ts               : section 6 lookup tables (display names, bands, value labels, mappings, lowercase engine names, narrowing band display names, life_texture_band labels, load state composition labels, week_shape flag display labels, life_stage labels, paid_work_relationship labels, primary_load labels, sociality_default labels, flag absence phrasings)
│  ├── closing_line_tokens.ts  : section 5.8 token fallback strings
│  └── self_report_items.ts    : section 6.11 self-report items metadata array
├── synthesise.ts              : main entry; reads EngineOutput and InputMap, returns RenderingInstructions
├── predicates.ts              : predicate evaluation logic; iterates shape_sentences and calibration_lines; includes the allBandsAt helper
├── headline.ts                : section 4 logic
├── cards.ts                   : section 5.3 logic, including first-fire rule, visual_state, held_attributed_line dispatch, and expression_space_caption composition
├── domains_panel.ts           : section 5.5 logic (spiritual domain joins via existing pipeline; no logic change)
├── constraints_panel.ts       : section 5.6 logic
├── chart_data.ts              : section 5.4 logic
├── closing_lines.ts           : section 5.8 logic, including deduplication
├── experience_candidates.ts   : section 5.9 logic
├── life_texture_panel.ts      : section 5.11 logic
├── life_context_panel.ts      : section 5.12 logic (composes three sub-slots)
├── comparison_surface.ts      : section 5.10 logic (composition rules, Surfaced cap, domain-value dispatch for Confirmed templates, never_been_part_of_his_life exclusion from Surfaced candidates)
└── the_narrowings_panel.ts    : section 5.13 logic
```

The data files contain only data. They are pure exports of arrays, objects, or maps. They contain no logic, no functions beyond pure constructors, no imports beyond types.

The logic files contain only logic. They import data from the data files but contain no string literals beyond:

- Field labels in the RenderingInstructions structure (e.g., panel headings)
- Structural template scaffolding (e.g., comma-joining direction names)

To add a new shape sentence: append an entry to shape_sentences.ts. To add a calibration line: append an entry to calibration_lines.ts. To add or revise a term explanation: edit term_explanations.ts. To revise a token: edit the relevant table in tokens.ts. To revise a closing line fallback: edit closing_line_tokens.ts. None of these changes require modifying logic files.

The shape_sentences.ts entries have this shape:

```typescript
type ShapeSentence = {
    id: string
    slot: SlotName
    predicate: (output: EngineOutput, input: InputMap) => boolean
    sentence: string
}
```

The calibration_lines.ts entries have this shape:

```typescript
type CalibrationLine = {
    id: string
    predicate: (output: EngineOutput, input: InputMap) => boolean
    sentence: string
    composition: 'prepend'
}
```

Predicates are pure functions; they read EngineOutput and InputMap; they return boolean; they have no side effects. The synthesis layer iterates shape_sentences and calibration_lines for each slot in registration order, applies the first predicate that returns true, and uses that sentence (composed per the calibration line's composition rule, where applicable).

The data files have a consistent shape:

- Each entry is an object with `id`, `predicate` (or `lookup_key`), and `sentence` (or `tokens`).
- Adding an entry is appending to the exported array; no logic change required.
- The synthesis layer iterates these arrays generically; it does not name specific entries.

When the spec is updated (sentence revision, token band adjustment, new direction-combination key, new calibration line, new term explanation), the corresponding data file is the only thing that changes. The logic files are stable across these updates.

## 11. What this layer does not do

- Does not narrate the man's life or interpret his situation as a person
- Does not reach for instrument question text or the £70 question or any other instrument-specific content
- Does not reach for story content from fixture authoring
- Does not propose what the man should do (that's the experience-suggestion layer, separate)
- Does not call an LLM
- Does not generate prose dynamically; all text is from token tables or sentence libraries
- Does not run multiple sentences from the same slot; first match wins
- Does not modify EngineOutput or InputMap; reads only

Adding the comparison surface, the life-texture and life-context panels, and the narrowings panel does not introduce coaching, prescription, or interpretation; each layer names architectural readings, observational in voice.

## 12. Honest concerns and open questions

- **Sentence overlap.** Multiple shape sentences may match a slot; first-match-wins is the rule, but this means sentence ordering is load-bearing. Worth maintaining a comment in shape_sentences.ts noting that order matters and explaining the rationale per sentence.
- **Recognition sentence key collisions.** The direction-combination map uses three direction names in strength order. If two directions have identical pull values, alphabetical tiebreak applies (matching engine surfacing). Worth documenting per-fixture how ties are resolved during fixture authoring.
- **Token vocabulary drift.** Token tables in section 6 are first-pass. Some tokens may need refinement as the man-facing language is tested. The token tables are a single source of truth; changing one token affects every fallback that uses it.
- **The "active going through motions" category may be too coarse.** Worth watching during synthesis testing whether profiles in this category want the same sentence or distinct ones.
- **Sentence library growth.** The seed sentences cover the cohort. The calibration line mechanism is registered but currently empty; entries can be added if real-world deployment surfaces patterns where shape sentences need supplementing.
- **Coverage gap on 2-direction deep-suppression.** A profile with exactly 2 directions in deep-suppression (past_presence yes, SCI >= 70, life_shape_duration = long) matches neither `deep_suppression_multi` (which requires 3+) nor `suppressed_standard_multi` (which requires SCI < 70 and life_shape_duration != long). The pattern_paragraph then renders the token fallback. No fixture in the cohort hits this exact profile; if real-world deployment surfaces it, a `deep_suppression_pair` sentence can be added to shape_sentences.ts without affecting other predicates.
- **Empty-pulls dashboards do not include an exploration framing paragraph.** The synthesis layer's job is to surface what the architecture reads. Suggestions about how to explore (for example, "try experiences across past-presence directions") belong to the experience-suggestion layer, not the synthesis layer's framing. The `experience_candidate_directions` output field (section 5.9) gives the experience layer the data it needs.
- **Card summary first-fire and dashboards with same-shape clusters.** The first-fire rule in section 5.3 prevents repetition when multiple cards match the same shape predicate. Lower-pull cards in such a cluster fall back to the composite quality token. Worth watching whether this reads as intended or whether a distinct "secondary card" sentence is wanted for the second and third matches.
- **Calibration line evaluation timing.** Calibration lines, if added in future, would evaluate against the firing set after the shape sentence has matched; their predicates would restate conditions about the firing set's pull_quality composition. If the calibration line library grows, worth keeping the predicates declarative and ordering-stable so adding new lines doesn't reorder existing matches.
- **Surfaced section cap of 3 is a calibration choice.** Section 5.10.2 caps the Surfaced section at 3 items. The cap prevents overwhelming the panel for men whose architectural reading is rich but who named few absences. If real-world cohorts consistently produce strong Surfaced sections with more than 3 architecturally significant candidates being truncated, raising the cap to 4 or 5 is reasonable. The 3-cap is first-pass; the architectural-significance ordering within candidates is also first-pass.
- **Week_shape architectural-significance order is first-pass.** Section 6.12 orders absent week_shape flags by architectural significance for Surfaced candidate selection. The ordering reflects the design intuition that belonging and contact carry more architectural weight than solo practice and weekly activity, but it has not been validated extensively against real-world deployment.
- **held_attributed_unexpressed card_summary entries are unexercised by the canonical cohort.** Section 7.2 includes four entries for held_attributed_unexpressed on Making, Relationship, Growth, Contribution. Per the engine architecture, strong specificity and missing channel are negatively correlated, so the combination is rare; the four entries are architecturally specified for the archetype and await further fixture evidence.
- **work_load_summary coverage is partial.** Section 7.12 authors 14 of 28 nominal `paid_work_relationship × primary_load` cells. The remaining 14 cells fall back to token form. The `defining × paid_work` cell is now authored; other `defining` and `peripheral` combinations remain uncovered. If real-world use produces other combinations consistently, authoring entries should be added.
- **sociality_summary Experience axis is unauthored.** Section 7.13 composes sociality against Relationship direction state, Contribution direction state, and balanced-sociality compositions. Experience × sociality is a possible composition but less frequently distinctive than the three authored axes. If real-world deployment finds Experience × sociality reading distinctively, additional entries can be authored without restructuring.
- **Comparison surface for `nothing_really` is the design's central test case.** Section 5.10.2 specifies that `nothing_really` produces the maximum-information case (empty Confirmed/Quiet, populated Surfaced). The Surfaced item template revision (suffix on first item only, plain observations on items 2-3) addresses the voice register; the architectural composition is the strongest version of the comparison surface's design intent.
- **life_stage prose for `enduring` and `drifting` composes around the term.** Section 7.11 names the other five life_stage values explicitly in prose ("Reading: building.", and similar) but composes around `enduring` and `drifting` to avoid framings the audience may bristle at. If real-world deployment finds the explicit five reading too clinical or the implicit two reading too soft, the asymmetry can shift toward composing around all seven or naming all seven.
- **expression_space_caption is a new render surface that the dashboard previously did not have.** Sections 5.3 and 7.7 introduce a per-card caption below the fields table. This is a real UI addition with implications for visual density. The amendment specifies synthesis emits the slot; RENDER.md amendment decides placement and styling. If the captions read as visual clutter on direction cards, the slot can be suppressed in render (synthesis still emits the data for inspection).
- **`mixed_band_uniform_pattern` is currently unexercised by the canonical cohort after tightening.** The predicate's exclusions on capacity_strain and held_attributed Pull state values prevent shadowing of more specific entries but leave the predicate without firing on canonical fixtures. The entry is architecturally defensible (it names a real shape: mixed band, uniform week, multiple surfacing directions, no capacity tension, no strong specificity holding); whether it earns its place is a real-world calibration question, not a structural concern.
- **`life_texture_empty` admits two architecturally distinct empty-band cases via the "yet" addition.** Reaching-but-not-landed and post-disengagement compose into the same sentence with "yet" admitting the reaching shape without forking the entry. If real-world deployment produces multiple disengaged-empty cases where "yet" reads false, a structural split lands then.
- **Five-panel overlap on adjacent inputs.** Five of seven narrowing bands share input territory with the v2-final panels (experiential ↔ life_texture_panel; structural ↔ work_load_summary; identity ↔ life_stage_summary + work_load_summary; energetic ↔ constraints_panel + domains_panel; relational ↔ sociality_summary + the four relational domains). Each band composes multiple inputs into a categorical reading; the v2-final panels articulate similar inputs as prose. The architectures coexist by reading different concepts (categorical compression versus prose articulation), but the dashboard's render layout will need to handle the multiple readings of overlapping material without producing a feel of repetition. This is a render-layer concern, not synthesis; logged for the RENDER.md amendment to inherit.
- **The compression-point predicates may need future tightening.** The five compression-point pattern_paragraph predicates fire on `allBandsAt` plus 2-3 input conditions. Post-launch evidence with different cohorts may surface profiles matching the predicates' input conditions but exhibiting a different architectural shape. The predicates may need tightening with Pull state values to handle such cases; evaluating whether Pull state values would support the tightening requires walking the predicates against the current code output.
- **The narrowing_summary default-token rate is moderate.** A meaningful portion of the cohort falls through the four authored sentences to the token fallback. This is by design; the predicate-driven sentences cover the architectural extremes. The token form is informative on its own. If post-launch evidence surfaces additional patterns worth naming, sentences can be added without affecting the existing entries.
- **Spiritual domain concentration on `never_been_part_of_his_life` is honest cohort reflection.** The section 6.5 display name "Spiritual" plus the section 6.4 value label "Never been part of life" combine to read "Spiritual: Never been part of life" for the typical fixture. The two section 7.8 predicate modifications and the section 5.10.2 Surfaced section exclusion preserve the architectural intent (never-been-part-of-his-life as baseline, not as reduction). The honest concentration is preserved in the rendered output; the predicate behaviour is adjusted to read it correctly.
- **Demographic concentration on `sociality_balanced_relationship_reduced` is honest cohort reflection.** A high proportion of fixtures fire this predicate. This is not predicate-breadth and not accidental cohort-bias; it is honest reflection of who the cohort represents: relationally-thin middle-aged single/childless men. The non-firing fixtures demonstrate the section 7.13 library can differentiate when the architecture differs. The fixtures firing the same predicate are architecturally the same on the sociality axis; the panel honestly reads that. Differentiation between those profiles lives in other panels (life_texture, life_context, direction_cards, comparison_surface). This concentration is a feature to be aware of, not a bug to fix. Possible RENDER.md treatment (visual de-emphasis when the panel reads identically across many men) is downstream.

