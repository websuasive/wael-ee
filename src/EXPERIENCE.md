# WAEL Experience Layer Specification

## 1. Purpose and North Star

The experience layer takes the architectural reading and offers concrete experiences the man could try. It surfaces things that have a real chance of producing a felt response, weighted toward kinds of aliveness that have gone quiet.

North Star: *make him feel alive.*

Not by matching his stated interests. Not by helping him optimise his life. Not by giving him goals. By offering a thoughtful spread of things to try, anchored in his architectural reading but biased toward expansion. The product trusts him to pick what fits and act on his own terms.

This layer does not retain. The man is expected to come and go. The product succeeds when he stops needing it.

## 2. Inputs

The experience layer reads from three sources.

### 2.1 The active architectural reading

Read from `useActiveReadingStore` (the Pinia store built in the routing refactor). The store carries three top-level objects:

```typescript
interface ActiveReading {
    inputMap: InputMap                          // canonical input contract per ENGINE.md section 3
    engineOutput: EngineOutput                  // engine output per ENGINE.md section 6.6
    renderingInstructions: RenderingInstructions // synthesis output per SYNTHESIS.md
}
```

The experience layer consumes these specific fields:

- `renderingInstructions.experience_candidate_directions`: an array of candidate directions per SYNTHESIS.md section 5.9. Each entry carries a `direction_name` (canonical display name string, e.g. "Creator", "Freedom Designer", used for user-facing surfaces), a `direction_engine_name` (typed `DirectionName` engine value, e.g. `making`, `freedom`, used for algorithmic comparison), a priority (`firing` or `past_presence_only`), and the underlying pull magnitude. The recommendation algorithm reads `direction_engine_name` directly for tier assignment (see section 3.1).
- `renderingInstructions.the_narrowings_panel.bands[]`: the seven narrowing band entries per SYNTHESIS.md section 5.13. Each entry carries a `band_field` (one of `structural`, `experiential`, `psychological`, `identity`, `energetic`, `relational`, `attention`), a `band` (`low` | `moderate` | `high`), and a discrete `intensity` (33, 66, or 100). The recommendation algorithm reads `intensity` values to compute narrowing-fit scores per section 3.2. The bands array always contains seven entries; the engine emits all seven deterministically.
- `engineOutput.constraints`: the `ConstraintsOutput` object per ENGINE.md section 6.6. Specifically:
  - `engineOutput.constraints.sustained_constraint_intensity`: number, 0-100. Retained for diagnostic and inspection use. Does not contribute to recommendation scoring under the algorithm in section 3.2.
  - `engineOutput.constraints.energy.band`: `EnergyBand` (`full` | `moderate` | `heavy_depletion`).
  - `engineOutput.constraints.time.band`: `TimeBand` (`open` | `moderate` | `heavy_time_pressure`).
  - `engineOutput.constraints.body_capacity.band`: `BodyBand` (`full` | `shifted` | `limited`).
  - `engineOutput.constraints.permission.band`: `PermissionBand`.
  - `engineOutput.constraints.permission.sub_shape`: `PermissionSubShape`.
- `inputMap.cross_direction.life_shape_duration`: `recent` | `sustained` | `long` per ENGINE.md section 3. Available for diagnostic use; the section 3.2 algorithm does not consume it directly.

The layer reads constraint state via canonical band tokens, never via display strings. Display labels (e.g. "Heavy depletion") belong to the synthesis and render layers, not to the recommendation algorithm.

**Note on intensity values.** The discrete intensity readings (33, 66, 100) are the synthesis layer's render-convenience derivations from the categorical engine bands (`low`, `moderate`, `high`). The experience layer uses them as an ordering signal that preserves the discrete band readings in additive form. It is not a treatment of intensity as continuous data. The synthesis caveat at SYNTHESIS.md section 5.13 stands; the experience layer's use is consistent with it.

### 2.2 The experience inventory

A JSON file at `src/ui/experience/data/experiences.json` (v3) or a database query (later). The file is bundled with the build in v3, not fetched at runtime. The v3 inventory uses a nested structure: activities contain variants.

The top-level schema is `ActivityInventoryFile`:

```typescript
interface ActivityInventoryFile {
  library_version: string;  // "3" for v3
  activities: Activity[];
}

interface Activity {
  activity_id: string;
  label: string;
  cost_tier: CostTier;
  websites: string[];
  directions: string[];
  interest_domains: string[];
  novelty_index: number;
  variants: Variant[];
}

interface Variant {
  variant_id: string;
  protocol: Protocol;
  pitch: string;
  instruction: string;
  who_with: WhoWith[];
  magnitude: Magnitude;
  friction: number;  // 1-5
  exertion: number;  // 1-5
}
```

Each `Activity` represents a top-level experience concept (e.g. "Cold water, no easing in") with general metadata. Each `Variant` represents a specific way to do that activity (e.g. the "stir" protocol small variant). The `flattenInventory` function transforms the nested structure into a flat `RecommendableVariant[]` for algorithmic consumption by spreading activity-level fields onto each variant.

**Key v3 fields:**
- `protocol`: one of seven values (stir, loophole, slip, catch, trespass, aside, steeping). This is the primary mechanism for narrowing-fit scoring (see §3.2).
- `pitch`: selling copy (shown on cards).
- `instruction`: actionable guidance (shown in detail view).
- `magnitude`: small, medium, or big.
- `friction`: integer 1-5 (low to high bodily resistance).
- `exertion`: integer 1-5 (low to high absolute bodily demand).

**Removed from v2:**
- No `narrowings[]` field. Narrowing is derived from protocol via `PROTOCOL_TO_NARROWING` (see §3.2).
- No `physical` boolean tag. Exertion-based exclusion replaces physical-tag exclusion (see §3.2).
- No `scale` field. Magnitude replaces scale for time-pressure bias (see §3.2).
- No `experience_types` field. Protocol replaces experience_types for diversification (see §3.4).
- No `venue` field in v3 types. The spec describes the intended v3 state; any residual venue data in the JSON is dead data to be removed (tracked as a code TODO).

**Protocol-to-narrowing mapping:** The canonical `PROTOCOL_TO_NARROWING` mapping (see §3.2) derives a single narrowing tag from each variant's protocol. The seven protocols map to the seven narrowing dimensions: stir→energetic, loophole→psychological, slip→identity, catch→structural, trespass→experiential, aside→relational, steeping→attention.

### 2.3 The man's status flags

Per-variant state: `saved`, `booked`, `done`, `not_interested`. Persisted in browser localStorage in v3 with key `wael.experience.status.v3`; later in a database. The interface is swappable behind the storage backend (see section 7). Status records are keyed by `variant_id` (not `experience_id`).

### 2.4 What this layer does not read

The experience layer does not read from sources beyond the three above. It does not call an LLM, fetch live data, generate prose dynamically, or read display strings as semantic tokens.

## 3. The recommendation layer

The recommendation logic is heuristic, deterministic, and anti-narrowing. Same inputs produce the same output (modulo status flag changes). The order of operations is: hard-exclude (per §3.2), score, exclude flagged (per §3.3), sort, diversify, paginate.

### 3.1 Direction-name mapping

Three naming spaces exist in the system, and they must stay in sync:

- **Engine direction name** (per ENGINE.md section 6.6, type `DirectionName`): single-word snake_case identifier. Six values: `contributor`, `experience_seeker`, `freedom_designer`, `growth_focused`, `creator`, `relationship_rebuilder`. Used internally by the engine, by synthesis (via the `direction_engine_name` field on each `experience_candidate_directions` entry), and by the recommendation algorithm.
- **Inventory direction tag** (per the experience JSON schema): single-word identifier used in each experience's `directions` array. Six values: `contribution`, `experience`, `freedom`, `growth`, `creation`, `closeness`. Used by content authors.
- **Display name** (per SYNTHESIS.md): user-facing label. Six values: `Contributor`, `Experience Seeker`, `Freedom Designer`, `Growth Focused`, `Creator`, `Relationship Rebuilder`. Used by the dashboard, the experience layer's user-facing surfaces, and `experience_candidate_directions[].direction_name` (synthesis emits display names alongside engine names so consumers do not have to translate).

The recommendation algorithm operates internally on engine direction names. Synthesis already emits the typed engine name on each candidate (`direction_engine_name`), so the algorithm reads it directly without translation. The inventory's direction tags are still translated, because content authors write tags that diverge from engine names on two of the six directions. One mapping is needed:

```typescript
// src/ui/experience/data/direction_mapping.ts

import type { DirectionName } from '@/engine/types'

export const inventoryTagToEngineDirection: Record<string, DirectionName> = {
    "contribution": "contributor",
    "experience":   "experience_seeker",
    "freedom":      "freedom_designer",
    "growth":       "growth_focused",
    "creation":     "creator",
    "closeness":    "relationship_rebuilder",
}
```

The recommendation algorithm's first step is to translate each experience's `directions[]` (inventory tags) into engine direction names via `inventoryTagToEngineDirection`. Comparison against `experience_candidate_directions[].direction_engine_name` is then direct.

A build-time check scans the inventory and warns if any direction tag is not in `inventoryTagToEngineDirection`. A direction tag found in the inventory but absent from its map is treated as a non-match (the experience scores zero for direction fit but remains in the inventory). Display name handling on the user-facing surfaces uses `direction_name` from synthesis directly; no separate display-name mapping or build-time check is required on the experience side, because synthesis owns the display name emission.

### 3.2 Scoring

The scoring algorithm is lexicographic by direction tier. Each variant is assigned a direction tier (primary sort key) and a within-tier composite score (secondary sort key). Stable inventory order resolves any remaining ties. The algorithm uses no negative magnitudes; matching variants receive boosts, non-matching variants are not penalised.

**Hard exclusions.** Two exclusion rules apply before tier assignment and remove variants from the candidate set entirely, based on the variant's `exertion` field:

- If `constraints.body_capacity.band === "limited"`: any variant with `exertion >= 3` is removed from the candidate set.
- If `constraints.body_capacity.band === "shifted"`: any variant with `exertion >= 4` is removed from the candidate set.

These thresholds are canonical: limited excludes variants with moderate or higher bodily demand (3+), shifted excludes variants with high or very high bodily demand (4+). The `exertion` field is an integer 1-5 representing absolute bodily demand, replacing the v2 `physical` boolean tag.

Status flag exclusion runs separately, after scoring (see section 3.3).

**Direction tier assignment.** Each variant receives one of four direction tiers, computed against the man's translated `experience_candidate_directions`:

- `firing`: at least one of the variant's translated directions (from its parent activity's `directions` array) appears in the candidate list with priority `firing`.
- `past_presence_only`: not firing, and at least one of the variant's translated directions appears in the candidate list with priority `past_presence_only`.
- `anchored_stretch`: neither firing nor past_presence_only on its named directions, but at least one of its directions did appear in the candidate list. This is the case where a variant's tag matched an entry in the list but at no qualifying priority (in practice, this tier is rarely populated because the candidate list contains only firing and past_presence_only entries; the slot exists for symmetry with the previous spec's anchored-stretch concept and reserved against future synthesis additions).
- `none`: none of the variant's translated directions appears in the candidate list.

The four tiers sort: `firing` > `past_presence_only` > `anchored_stretch` > `none`.

**Multi-direction tier rule.** A variant whose parent activity is tagged with multiple directions takes the highest tier present in the man's reading. An activity tagged `directions: [creation, growth]` where `growth_focused` is in the firing set and `creator` (the engine name for `creation`) is in the past_presence_only set takes `firing` as its tier. The rule is the most permissive treatment: any single direction match into a higher tier lifts the variant into that tier.

**Within-tier composite score.** Inside each tier, variants sort by a composite of narrowing-fit plus constraint biases:

```
composite_score = narrowing_fit_score + sum_of_matching_constraint_biases
```

The two components:

*Narrowing-fit score.* The variant's `protocol` field maps to a single narrowing tag via the canonical `PROTOCOL_TO_NARROWING` mapping. The narrowing tag is then looked up in `renderingInstructions.the_narrowings_panel.bands[]` by matching `band_field === narrowing_tag`, and the band's `intensity` value (33, 66, or 100) is the narrowing-fit score.

```
narrowing_fit_score =
    PROTOCOL_TO_NARROWING[variant.protocol]
        |> narrowing_tag
        |> renderingInstructions.the_narrowings_panel.bands
            .find(b => b.band_field === narrowing_tag)
            .intensity
```

The canonical `PROTOCOL_TO_NARROWING` mapping:

| Protocol | Narrowing Tag |
|----------|---------------|
| stir | energetic |
| loophole | psychological |
| slip | identity |
| catch | structural |
| trespass | experiential |
| aside | relational |
| steeping | attention |

The intensity values are discrete (33 for low-band, 66 for moderate-band, 100 for high-band). The maximum narrowing-fit score is 100 (a single protocol mapping to a high-band reading). This differs from v2, which summed over multiple narrowings entries; v3 derives a single narrowing from protocol.

If the mapped narrowing band is not found among the seven bands (which should not occur given the canonical enum), the score is 0. Defensive lookup with a development-mode error log; the production runtime behaviour is degrade-not-crash.

*Constraint biases.* Two positive biases apply based on the man's constraint reading. Both are additive when the relevant condition fires; matching variants receive a boost, non-matching variants are not penalised:

| Condition | Bias |
|---|---|
| `constraints.energy.band === "heavy_depletion"` | +20 to variants with `friction <= 2` |
| `constraints.time.band === "heavy_time_pressure"` | +20 to variants with `magnitude === "small"` |

A variant matching both conditions receives +40 (both biases stack). The maximum biases contribution to composite is +40; the maximum total composite is therefore 140 (high-band narrowing 100 plus both biases 40).

The +20 magnitude is one fifth of a single max-narrowing match (20 / 100 = 0.2). The biases are initial and tuneable; their relative weight against narrowing-fit can be adjusted post-build without restructuring the algorithm. See section 15.

No other constraint state contributes to scoring. The body-capacity bands act as hard filters above; permission state is read elsewhere in the architecture (synthesis sentences, dashboard) but the experience scoring does not consume it; `sustained_constraint_intensity` is retained on the input contract for diagnostic use but does not feed scoring.

**Sort within tier.** Within each tier, variants sort by `composite_score` descending. Ties on `composite_score` resolve by stable inventory order (ascending by variant_id). The complete sort composition is therefore lexicographic:

1. Direction tier (primary): `firing` first, then `past_presence_only`, then `anchored_stretch`, then `none`.
2. Composite score (secondary, descending within tier): `narrowing_fit_score + matching_biases`.
3. Stable inventory order (tertiary, ascending by variant_id): final tiebreak.

Direction tier dominates. A `past_presence_only` variant with the maximum possible composite (140) ranks below the lowest-scoring `firing` variant.

**Worked example.** For a reading with two firing directions (`growth` and `making`); `the_narrowings_panel.bands[]` reading `structural: high (100)`, `energetic: high (100)`, `relational: moderate (66)`, `identity: moderate (66)`, with `psychological`, `experiential`, and `attention` all low (33 each); `constraints.energy.band` of `heavy_depletion`; `constraints.time.band` of `moderate`. Consider five variants:

- *A*: directions `[creation]` (engine name `making`, firing), protocol `stir` (maps to energetic, high band 100), friction 2 (≤2, matches energy bias), magnitude `medium`. Tier: firing. Narrowing-fit: 100. Energy bias: +20. Time bias: +0. Composite: 120.
- *B*: directions `[growth]` (firing), protocol `catch` (maps to structural, high band 100), friction 2 (≤2, matches energy bias), magnitude `small`. Tier: firing. Narrowing-fit: 100. Energy bias: +20. Time bias: +20. Composite: 140.
- *C*: directions `[creation]` (firing), protocol `loophole` (maps to psychological, low band 33), friction 3 (>2, no energy bias), magnitude `small`. Tier: firing. Narrowing-fit: 33. Energy bias: +0. Time bias: +20. Composite: 53.
- *D*: directions `[creation]` (firing), protocol `slip` (maps to identity, moderate band 66), friction 2 (≤2, matches energy bias), magnitude `big`. Tier: firing. Narrowing-fit: 66. Energy bias: +20. Time bias: +0. Composite: 86.
- *E*: directions `[closeness]` (engine name `relationship`, past_presence_only), protocol `catch` (maps to structural, high band 100), friction 2 (≤2, matches energy bias), magnitude `small`. Tier: past_presence_only. Narrowing-fit: 100. Energy bias: +20. Time bias: +20. Composite: 140.

Sort result: B (140, firing), A (120, firing), D (86, firing), C (53, firing), E (140, past_presence). E sits below D because tier dominates the composite score: a past_presence variant with the same composite as a firing variant never outranks it.

This example is illustrative, not normative. Real inventory shapes produce richer feeds and the diversification pass in section 3.4 reshapes the top 12.

### 3.3 Status flag exclusion

After scoring, before sorting:

- Variants flagged as `not_interested`: removed from the For You candidate set entirely. Still visible in Browse and Saved with the flag.
- Variants flagged as `done`: removed from the For You candidate set entirely. Still visible in Browse and Saved with the flag.
- Variants flagged as `saved` or `booked`: remain in the For You candidate set. The flag is shown on the card so the man knows he's already engaged with it.

Status flags are keyed by `variant_id` (per §2.3).

### 3.4 Sort and diversify

After scoring and exclusion, the candidate set is sorted lexicographically per the composition in section 3.2: direction tier first, then composite score (descending within tier), then stable inventory order (ascending by id). This guarantees a deterministic ordering.

Diversification is a separate re-ranking pass that operates on the sorted list. It enforces variety in the top 12 cards the man sees, with explicit step ordering and resolution rules so two implementers reading this section produce the same result.

The pass reads each experience's `directions` array directly when checking direction overlap, translating inventory tags to engine direction names via `inventoryTagToEngineDirection` on the fly.

#### Diversification pass

The pass operates on the sorted list and applies these steps in order. Two helper definitions used by the pseudocode:

- **Canonical facet order.** For each spread target T, when multiple absent values must be ordered, they are ordered by canonical lookup:
  - `protocol`: `stir, loophole, slip, catch, trespass, aside, steeping`.
  - `cost_tier`: `free, low, medium, high`.
- **Spread preservation predicate.** A candidate r in top12 "preserves spread for target T" if top12's count of distinct values for T's facet would not decrease when r is removed. (Equivalently: r's value for T's facet is shared by at least one other entry in top12.)

```
LET top24 = candidates sorted lexicographically per section 3.2, first 24 items
LET halfTopScore = composite_score(top24[1]) / 2
# halfTopScore is the score floor used by both step 1 and step 2.
# It is defined on the within-tier composite of rank 1, not on tier.
# No swap-in candidate may have a composite below this floor.

# Step 1: enforce no-three-in-a-row over the top 12 by direction overlap.
# Three consecutive experiences sharing at least one direction in common
# constitute a violation. The loop starts at p=3 because no three-in-a-row
# is possible at p<3.
#
# Each experience's directions[] is translated to engine direction names via
# inventoryTagToEngineDirection before the check. Let directionSet(e) denote
# the resulting set of engine direction names for experience e. An
# experience with no directions has directionSet(e) = empty set; no
# intersection containing it is non-empty, so malformed entries never
# trigger violations.
#
# The swap criterion mirrors the violation condition: q is admissible when
# it does not share a direction with both p-1 and p-2 simultaneously. Q
# sharing one direction with either neighbour alone is fine; the three-way
# intersection is what defines the violation.
FOR position p from 3 to 12:
    LET shared = directionSet(top24[p]) ∩ directionSet(top24[p-1])
                                          ∩ directionSet(top24[p-2])
    IF shared is non-empty:
        FIND the highest-ranked candidate q in top24[p+1..24]
            where directionSet(q) ∩ directionSet(top24[p-1])
                                  ∩ directionSet(top24[p-2]) is empty
            AND composite_score(q) >= halfTopScore
        IF q exists:
            SWAP top24[p] with q  # q moves to p; the displaced entry
                                   # moves to q's old position
        ELSE:
            # No suitable swap available; leave the violation in place.
            CONTINUE

# Step 2: enforce spread targets over the top 12 (after step 1).
# Each target T is attempted at most once (single-shot). If a single
# swap does not bring top12 to satisfy T, the algorithm moves to the
# next target without looping.
LET top12 = top24[1..12]
FOR each spread target T in this order:
    1. 3+ different protocols
    2. 2+ different cost_tier bands

    IF top12 does not satisfy T:
        LET missingValues = facet values for T's facet
                            that are absent from top12
        LET missing = the first value in missingValues
                      by canonical facet order
        FIND the highest-ranked candidate q in top24[13..24]
            with facet value = missing
            AND composite_score(q) >= halfTopScore
        IF q exists:
            FIND the lowest-ranked candidate r in top12
                that preserves spread for T
                (r's facet value for T's facet is shared
                 by at least one other entry in top12)
            IF r exists:
                SWAP r and q
            ELSE:
                # No safe swap-out exists; leave T unsatisfied.
                CONTINUE
        ELSE:
            CONTINUE

# Step 3: accept the resulting top 12.
RETURN top24[1..12]
```

Step 2 may introduce a no-three-in-a-row violation in the top 12. This is accepted: spread targets win over the consecutive-direction rule when they conflict. The diversification pass does not iterate; steps 1, 2, and 3 each run once, and the per-target inner loop in step 2 attempts at most one swap per target.

**Diversification and tier boundaries.** Step 1 and step 2 swaps select the highest-ranked qualifying candidate from `top24[p+1..24]` (or `top24[13..24]` for step 2). Under the lexicographic sort, this candidate may sit in a lower tier than the entry being displaced. The `halfTopScore` floor (half the composite of rank 1, where rank 1 is in the highest tier present) acts as a quality gate: a cross-tier swap-in must have a strong composite to qualify. In practice, swaps within the same tier dominate; cross-tier swaps happen only when the higher tier is too direction-narrow to satisfy spread targets and the lower tier holds a high-composite candidate. This is a deliberate trade-off: spread quality wins over strict tier order when the floor permits, mirroring the spread-over-consecutive-direction trade-off.

When the candidate set has fewer than 12 entries, all entries are returned in lexicographic order; the diversification pass is skipped.

When the candidate set has fewer than 24 entries, the same algorithm runs against whatever exists; the depth caps and score floors are applied to the available set.

### 3.5 Pagination

The feed surfaces the top 12 after diversification. A "Show more" control reveals the next 12, and so on, until the ranked list is exhausted. Pagination is the mechanic, not reshuffle: the same ranking, with lower-ranked items appearing as pages are revealed. The diversification rules ensure the first 12 already span direction, protocol, cost, and friction.

There is no quality threshold: pagination continues to the end of the ranked, reading-scored, exclusion-filtered list. (The v2 quality-threshold gate was removed; the feed paginates the full available set.)

### 3.6 Determinism

Same active reading + same status flags + same inventory = same For You feed every time. No randomness. No date-based shuffling. Sort ties broken deterministically by variant_id. The system is predictable, debuggable, and inspectable.

If the active reading changes (the man retakes the assessment), the For You feed naturally changes because the inputs differ.

**Per-build determinism.** Determinism holds within a build. The inventory bundled at build time is frozen for the session; the algorithm reads from it deterministically. Across builds, the For You feed may shift as the inventory composition changes (new activities or variants added, protocol assignments adjusted). The architectural reading and the algorithm are stable; the data the algorithm runs against changes as content work progresses.

## 4. Surface decomposition

The experience layer is mounted at `/laboratory`. The surface is a hub of eight boxes: seven protocol boxes (Stir, Loophole, Slip, Catch, Trespass, Aside, Steeping) and one For You box. Each box opens a feed.

### 4.1 The hub

`/laboratory` shows the eight boxes in a four-by-four grid (two columns on narrow screens). The seven protocol boxes each link to `/laboratory/:protocol` (e.g. `/laboratory/stir`); the For You box links to `/laboratory/for-you`. The boxes are uniform: protocol intensity is not surfaced visually. A box is disabled when there is no active reading.

### 4.2 Protocol pages

`/laboratory/:protocol` shows a feed scoped to that one protocol: the inventory filtered to the protocol, then scored and ranked by the man's active reading (same scoring as For You, per section 3.2), then paginated. Light filtering is available — the filter facets are shown except the protocol facet, which is hidden (the feed is already scoped to one protocol, so a protocol filter would be redundant). The man can narrow by direction, exertion, cost, interest, and status.

### 4.3 For You

`/laboratory/for-you` shows the unscoped feed: the whole inventory scored and ranked by the man's reading, paginated. All filter facets are shown, including protocol. This is the combined view across every protocol.

### 4.4 Feed behaviour (shared)

Both the protocol pages and For You use one feed component. It ranks once on load, then filtering masks the ranked list rather than re-ranking it: ticking a filter hides non-matching cards in place; the surviving cards keep their ranked order. A "Showing X of Y" line reports the visible count against the available total (Y is the count after the reading's hard exclusions, per section 3.2). A "Show more" control reveals the next page until the list is exhausted. There is no quality threshold on pagination, and no sort controls.

Filter logic: AND across facets, OR within a facet. Filter counts are shown per option, recomputed live, each facet's count computed against the other active facets (the standard faceted-count pattern).

If there is no active reading, the feed shows an empty state with a link to the assessment. If the man has flagged everything visible as `not_interested` or `done`, the feed shows its empty state.

## 5. Card design and interaction

The experience card is the core unit across all three modes. Same component, same data shape, slightly different metadata visibility per mode.

### 5.1 Card content

Each card shows:

- **Name.** The activity label. Serif, `var(--text-lg)`, full opacity.
- **Pitch.** First sentence of the variant's `pitch` field. Sans, `var(--text-base)`, `var(--color-text-secondary)`.
- **Facet badges.** Small inline labels: cost tier (e.g., "Free" or "£60"), magnitude (e.g., "Small"), protocol (e.g., "stir"), exertion (e.g., "Medium"), who_with (first value from the array, e.g., "Solo"). Sans, `var(--text-xs)`, hairline border, generous padding.
- **Status indicator.** When a status flag is set, shown prominently: a small icon plus label ("Saved", "Booked", "Done", "Not interested"). Position: top-right corner of the card.
- **Action menu.** A small unobtrusive control (three dots or similar) opens an action menu. The action menu opens from the card, not from the detail view. The menu options shown depend on the current flag state:
  - When no flag is set: Save, Mark booked, Mark done, Not interested.
  - When a flag is set: the same four options plus a Clear option that removes the flag.

The card does not show the full pitch, the instruction, the full metadata, or related experiences. These live in the detail view.

### 5.2 Card states

**Default (no flag set):** full opacity, full content visible.

**Saved or booked:** the flag indicator is visible. Card stays full opacity (he might still want to revisit details).

**Done:** the flag indicator is visible. Card stays full opacity in all views; he might want to revisit something he's done. Excluded from For You per section 3.3.

**Not interested:** the flag indicator is prominent. In Browse, the card renders at reduced opacity (`var(--opacity-muted)`) so it visually recedes from the rest of the list. Excluded from For You per section 3.3. Visible in Saved with the flag.

Only `not_interested` reduces opacity in Browse. `done` retains full opacity even though both flags exclude the experience from For You; the difference is product-meaningful (something completed is different from something dismissed).

### 5.3 Card interaction

Tapping the card body (anywhere outside the action menu trigger) opens the detail view as a drawer.

Tapping the action menu trigger opens a small popover with status options. Selecting a status updates the flag, persists it, and dismisses the popover. The card visually updates to reflect the new flag.

**Interaction collisions.** When the action menu popover is open and the man taps the card body (rather than a menu option), the action menu closes without opening the drawer. A subsequent tap on the card body then opens the drawer. This single-action-per-tap rule prevents accidental drawer-opens when the man is dismissing the menu.

Tapping outside the card has no effect on the card itself (no implicit dismissal). Tapping outside the action menu popover dismisses the popover.

## 6. Detail view

A drawer (slide-in from right on desktop, full-screen on mobile) showing the full experience detail.

### 6.1 Detail content

- **Name.** Serif, `var(--text-2xl)`. Full activity label.
- **Pitch.** Full pitch text. Sans, `var(--text-base)`, paragraph spacing.
- **Instruction.** The `instruction` field. Italic, sans, `var(--text-base)`. Visually distinct from the pitch (e.g., indented or in a small panel).
- **Facets.** All metadata as readable badges: directions (display names, translated from inventory tags via the engine direction mapping then to display names per SYNTHESIS.md), cost tier, magnitude, protocol, exertion, who_with, interest domains, websites.
- **Status.** Current flag status with controls to change: a row of four buttons (Save, Mark booked, Mark done, Mark not interested) plus a Clear option (shown only when a flag is set). The current state is highlighted; tapping switches to that state. The card's action menu and the detail view's status controls write to the same persistence store; either is reflected in both surfaces immediately.
- **Close button.** Dismisses the drawer.

Term indicators apply to architectural terms in the pitch and instruction prose, same as in the dashboard. Tapping a term opens the term popover (singleton across the app).

### 6.2 Detail view interaction

The drawer opens on tap of any card. Three dismiss mechanisms:

- Tapping outside the drawer (on the dimmed backdrop)
- Pressing the close button
- Pressing Escape

The drawer is driven by local component state on the laboratory page; it does not change the URL and is not deep-linkable. The browser back button does not close the drawer, since opening it does not push a history entry. This is a deliberate simplification for the laboratory surface.

The status flag controls update the underlying store immediately; closing the drawer doesn't undo changes.

The drawer does not include:
- Related experiences (deferred to a later iteration; v1 keeps the surface focused)
- A share button
- A print option
- Any modification of the experience data itself (the inventory is read-only from the man's perspective)

## 7. Status flags and persistence

Four flags, mutually exclusive (one per variant at a time):

- `saved`: he wants to try it.
- `booked`: he's committed to doing it (date or arrangement is on his end; the system doesn't track the date in v1).
- `done`: he's tried it.
- `not_interested`: he's dismissed it.

Plus a fifth virtual state: `unflagged` (no status set, the default).

### 7.1 Transitions

Any flag can transition to any other. The state machine is fully connected. There's no progression rule (he doesn't have to go saved then booked then done; he can mark something done that was never saved).

Marking `not_interested` is reversible. He can undo it by switching to another flag or clearing.

### 7.2 Persistence

In v3: browser localStorage, keyed by variant_id with key `wael.experience.status.v3`. In future production: a database table per user. Same shape, same interface. The storage backend is swappable behind a thin API.

```typescript
type Flag = 'saved' | 'booked' | 'done' | 'not_interested'

interface ExperienceStatus {
    variant_id: string
    flag: Flag                  // never null; an unflagged variant has no record
    flagged_at: Date            // never null; always set when the record exists
}

// Storage key: 'wael.experience.status.v3'
// Value: Record<string, ExperienceStatus>  // keyed by variant_id
```

When a flag is cleared, the record is removed from storage entirely. This keeps the type clean (no four-state cell of `flag` × `flagged_at` nulls) and matches the conceptual model: a variant either has a flag or it doesn't.

### 7.3 Persistence interface

A Pinia store wraps the storage:

```typescript
interface UseExperienceStatus {
    // Reactive state - card components subscribe to this for flag updates.
    // This is the optimistic state (per section 11.5): always reflects the
    // most recent caller intent. On persistence failure, it reverts to
    // committed state.
    statuses: Readonly<Ref<Record<string, ExperienceStatus>>>

    // Lookups (read from optimistic state).
    flagFor(variantId: string): ExperienceStatus | null
    allFlagged(): ExperienceStatus[]
    flaggedByStatus(flag: Flag): ExperienceStatus[]

    // Mutations.
    // The store updates optimistic state synchronously on call;
    // the returned Promise resolves when persistence completes.
    // On rejection, the store reverts optimistic state to committed
    // state and notifies subscribers (see section 11.5).
    setFlag(variantId: string, flag: Flag): Promise<void>
    clearFlag(variantId: string): Promise<void>
}
```

The recommendation layer reads `statuses` reactively to apply exclusion logic. The card components subscribe to `statuses` so flag changes from any surface (card menu, detail drawer, Saved view) propagate immediately to all visible cards. The action menu and detail view both call `setFlag` and `clearFlag` directly; there is no intermediate mutation queue.

`setFlag` accepts only valid `Flag` values (no null). To clear a flag, callers use `clearFlag`. This is a deliberate API simplification: one method per intent.

### 7.4 Mid-session flag changes

The feed snapshots status flags once when it loads and ranks. If the man flags an experience `not_interested` or `done` while viewing a feed, the card updates to show the flag but is not removed from the visible feed during this session — he sees the consequence without the feed shifting under him. When he navigates away and back, the feed regenerates with the updated flags excluded. This applies whether the flag is set from the card's action menu or the detail drawer.

## 8. Filters (Browse mode)

Filter state lives in component-local state (in the Browse view component). It does not persist across sessions; coming back to Browse starts with all filters cleared.

Filters compose with AND across facets, OR within a facet.

The filter sidebar:

- Has a "Reset filters" button at the top.
- Shows the count of matching experiences for each filter option, recomputed live as the man interacts (per section 4.2).
- Collapsible sections for each facet (initially expanded for Direction; collapsed for the rest).
- On mobile, opens as a full-screen drawer with the same controls.

The filter UI is functional, not decorative. No animations beyond the standard `var(--duration-fast)` transitions.

**Filter facets (v3):**
- **Direction:** multi-select. Filters to variants whose parent activity's translated `directions` include any of the selected.
- **Protocol:** multi-select. Filters to variants with the selected protocol values (stir, loophole, slip, catch, trespass, aside, steeping).
- **Exertion:** multi-select. Filters to variants by exertion, shown as labels Lowest/Low/Medium/High/Highest (underlying integers 1-5).
- **Cost tier:** multi-select. Filters to variants with the selected cost_tier values (free, low, medium, high).
- **Interest domain:** multi-select. Filters to variants whose parent activity's `interest_domains` include any of the selected.
- **Status:** multi-select. The available options are: `unflagged` (no flag set on this variant), `saved`, `booked`, `done`, `not_interested`.

**Removed from v2:** context, friction (string), scale, experience_type, region, setting.

**Sort options (v3):**
- **Default:** score-ranked using the man's active reading (same scoring as For You). The route requires an active reading per section 11.1, so this sort always has a reading to score against.
- **Novelty (low to high):** ascending by `novelty_index`.
- **Novelty (high to low):** descending by `novelty_index`.
- **Friction (low to high):** ascending by friction (1-5).

**Removed from v2:** cost (low to high), scale (small to large).

## 9. Mobile and desktop responsive rules

Single responsive build. Breakpoint at 600px (matches the design system).

| Element | Mobile | Desktop |
|---|---|---|
| Container | 100% width, padding `var(--space-lg)` | max-width `var(--content-max-width)` (680px), centred |
| Card grid | Single column | Single column (deliberate; cards are wide enough that a grid would feel cramped) |
| Filter sidebar | Full-screen drawer triggered by a "Filters" button | Persistent sidebar to the left of the card list |
| Detail view (drawer) | Full-screen overlay | Slide-in panel from right, width `var(--drawer-width)` (480px) |
| Card action menu | Bottom sheet | Inline popover anchored to the menu button |

The drawer width is defined as a CSS custom property (`--drawer-width: 480px`) in `main.css`. Components reference the token rather than hardcoding the value. The drawer is intentionally narrower than the dashboard's content max width (`--content-max-width: 680px`) so the underlying surface remains partially visible behind the backdrop, supporting the back-button-and-return interaction model in section 6.2.

Touch targets meet WCAG 2.5.5 (minimum 44x44px on mobile). All interactive elements are keyboard-accessible.

## 10. Voice and register

Same constraints as the rest of the system (per ARCHITECTURE.md section 13):

- No em-dashes, no en-dashes anywhere.
- British English spellings.
- Plain register; no therapy speak; no self-help; no coach voice.
- No clichés, no hype, no exclamation marks.
- Sceptical adult tone.

The experience layer specifically does not use second-person address or imperatives. This is the deliberate divergence from the engine output prose (which is in second person per ENGINE.md / SYNTHESIS.md). The experience layer is observational: it describes what's there and offers options. It does not address the man directly or tell him what to do.

The experience layer's prose comes from two sources:

**1. The experience inventory.** Each experience's `name`, `description`, `why_it_works`, and venue prose are authored content in the inventory JSON. The voice constraints apply at authoring time. The render layer renders what's there.

The current inventory has not yet been audited against the experience layer's no-second-person rule. A content review pass is a launch precondition: the rule against second-person address and imperatives applies to inventory prose just as it applies to UI copy. Until that pass completes, the dashboard will speak in second person via the rendered inventory text even though the layer code is voice-clean. Section 15 lists this as an open dependency.

**2. UI copy.** Tab labels, filter names, button labels, empty states, status flag names, action menu items. These live in `src/ui/experience/static_copy.ts`. Default values are specified below; refinement is content work.

### 10.1 Static copy defaults

The strings below are observational. No second-person address. No imperatives directed at the man. Where an action exists, the label names what the system will do, not what the man should do.

```typescript
export const experienceCopy = {
    // Tab labels
    tab_for_you: "For you",
    tab_browse: "Browse",
    tab_saved: "Saved",

    // For You feed
    for_you_intro: "Things to try, given what's reading.",
    for_you_show_more: "Show me more",
    for_you_exhausted: "Strong matches done. Browse has the rest.",
    for_you_empty: "Nothing left to suggest. Browse has the rest.",

    // Browse view
    browse_intro: "All experiences. Filters available.",
    browse_filter_button: "Filters",
    browse_no_matches: "No experiences match these filters.",
    browse_reset_filters: "Reset filters",

    // Filter facet labels
    filter_label_direction: "Direction",
    filter_label_protocol: "Protocol",
    filter_label_exertion: "Exertion",
    filter_label_cost_tier: "Cost",
    filter_label_interest_domain: "Interest",
    filter_label_status: "Status",
    status_filter_unflagged: "Not yet engaged",

    // Sort option labels
    sort_label_default: "Best match",
    sort_label_novelty_asc: "Novelty (low to high)",
    sort_label_novelty_desc: "Novelty (high to low)",
    sort_label_friction_asc: "Friction (low to high)",

    // Saved view
    saved_empty: "Nothing here yet. Saving works from For You or Browse.",
    saved_group_booked: "Booked",
    saved_group_saved: "Saved",
    saved_group_done: "Done",
    saved_group_not_interested: "Not interested",
    saved_card_date_format: "d MMMM yyyy",  // British format, e.g. "12 March 2026"

    // Status flags
    flag_saved: "Saved",
    flag_booked: "Booked",
    flag_done: "Done",
    flag_not_interested: "Not interested",

    // Action menu (the action labels name what the system will do)
    action_save: "Save",
    action_mark_booked: "Mark booked",
    action_mark_done: "Mark done",
    action_not_interested: "Not interested",
    action_clear: "Clear",

    // Detail view
    detail_close: "Close",
    detail_instruction_label: "Instruction",
    not_found_in_inventory: "That experience isn't in the catalogue.",

    // Empty states for the layer overall
    empty_no_reading: "No assessment loaded. The assessment is the first step.",
    error_generic: "Something's gone wrong. A refresh may help.",
    error_persist_failed: "Couldn't save that.",
}
```

The "Show me more" string is borderline (first person from the man's implicit perspective, conventionally acceptable as an action label). It is retained because the alternatives ("More", "Next 12") are less clear about intent. If a future content review tightens this, the string changes; the layer's behaviour does not.

These are draft defaults. Content review before launch.

## 11. Edge cases

### 11.1 No active reading

If `useActiveReadingStore` is empty (no fixture loaded in dev, no user logged in in production), `/laboratory` shows an empty state: "No assessment loaded. The assessment is the first step." with a link to `/assessment`.

### 11.2 Empty firing set

The architectural reading has no firing directions. The For You algorithm falls back per the tier composition in section 3.2: experiences whose translated directions appear in `experience_candidate_directions` at `past_presence_only` priority take the `past_presence_only` tier and surface above experiences with no candidate-list overlap. The within-tier sort proceeds as for any other reading: composite_score (narrowing-fit plus matching biases) descending, then stable inventory order. The feed is not empty; it just leans on different signals. The man sees experiences scoped to where his life used to have something.

### 11.3 All experiences in For You are flagged

If the man has flagged every experience that would normally appear in For You as `not_interested` or `done` (unlikely but possible), the feed shows the empty state with a link to Browse.

### 11.4 Malformed or missing experience inventory

In v1 the inventory is bundled with the build, not fetched at runtime. If the build itself fails (malformed JSON), the build fails and the issue surfaces in development. If a runtime JSON parse error somehow occurs, the experience layer shows the generic error state. Vue's error boundary at the App level captures the error and routes through the standard error display.

The experience layer does not validate inventory entries at runtime. Malformed entries (missing fields, invalid direction tags, etc.) are a content problem caught at build time or content review, not a layer concern. The `narrowings[]` build-time validations per section 13 are part of the content build pipeline, not a runtime check.

### 11.5 Status persistence failure

The status store holds two state references for each experience:

- **Committed state.** What is currently persisted in localStorage (or, in production, the database). This is the source of truth.
- **Optimistic state.** What the UI is currently rendering. Initially equal to committed state; mutated synchronously by `setFlag` and `clearFlag` calls; reverts to committed state when a persistence write fails.

When the man taps a flag option:

1. The store's optimistic state for that experience updates synchronously. The UI re-renders showing the new flag immediately.
2. The persistence write begins. On success: committed state is updated to match the optimistic state; subscribers re-render (no visible change since optimistic state already shows the new value).
3. On failure: the store discards the in-flight write's effect on optimistic state and re-syncs optimistic state to committed state. Subscribers re-render, showing the previously-persisted value. An inline message appears next to the action menu trigger: "Couldn't save that." (per `error_persist_failed` in section 10.1).

This naturally handles concurrent writes. Trace: man taps Save (optimistic: saved; Save() begins), then taps Done before Save() returns (optimistic: done; Done() begins), then Save() fails after Done() succeeds. The result: committed state is `done` (from Done's success), optimistic state is `done` (already reflects it). Save's failure does not revert anything because Save's effect on optimistic state was already superseded by Done's mutation. The man sees `done` throughout.

A simpler way to state the rule: the store's optimistic state is always the most recent call's intent; the committed state is always the most recent successful persistence; on any failure, the store re-derives optimistic state from committed state plus any in-flight successful-but-not-yet-acknowledged calls. In v1 with localStorage, "in-flight" is effectively synchronous, so this collapses to: optimistic = latest call, committed = optimistic on success, optimistic reverts to committed on failure.

V1's recovery is deliberately minimal: no retry button, no toast queue, no exponential backoff. The next user action (another flag attempt) starts a fresh attempt.

### 11.6 Direction tag not in mapping

If the experience inventory contains a direction tag not in `inventoryTagToEngineDirection` (e.g., a typo or future addition), the recommendation layer logs a warning in development and treats the unknown tag as a non-match for that direction. The experience may still surface in Browse but does not score for the unrecognised direction in For You. A build-time check (per section 3.1) catches these at build time before they reach runtime.

### 11.7 Term indicators in experience prose

The experience pitch and instruction text may contain architectural terms (e.g., "between shapes", "stopped expecting"). A shared term scanner utility wraps matched terms with TermIndicator components and routes popovers through a single TermPopover singleton. The same utility is consumed by other surfaces that render architectural prose (the dashboard, for example); the experience layer imports the utility rather than re-implementing the scanning logic.

The scanner applies four rules:

- Case-sensitive matching on every character except the first; the first character is matched case-insensitively. This preserves discrimination between similar lowercase and capitalised terms while admitting clause-initial capitalisation of multi-word terms.
- Word-boundary anchored: matches occur only at word boundaries, never inside a longer word.
- Longest-match-wins: when multiple targets could match at the same position, the longest target wins.
- First-occurrence-per-string: each target wraps at most once per scanned string.

The `term_indicator_targets.ts` lookup table and the `term_explanations.ts` lookup are shared across all surfaces that render architectural prose. A build-time check scans inventory prose for terms present in `term_explanations.ts` but absent from `term_indicator_targets.ts`, surfacing any matches as content review items. This catches the case where a new term appears in inventory prose but isn't yet flagged for indicator wrapping.

### 11.8 Slow inventory load

In v1 the inventory is bundled with the build, so load is effectively instant. If a future version fetches the inventory at runtime (per section 2.2), the experience layer should show a loading state during the fetch. The loading state uses the shared `LoadingState` component (the same component used elsewhere in the app for asynchronous loading). For v1, no loading state is needed.

### 11.9 Rapid status flag toggling

If the man rapidly toggles a flag (e.g., taps Save then Done then Clear in quick succession), the persistence interface processes the writes in order. The store's reactive state updates after each write. There is no debouncing; each flag change is a real intention. If localStorage writes are slow enough to cause visible lag, the UI optimistically updates first and reverts on persistence failure (per section 11.5).

### 11.10 Inventory has no experiences for any candidate direction

If the inventory's experiences entirely fail to match any direction in `experience_candidate_directions` (extremely unlikely but possible if the inventory is misconfigured or the man's reading is unusual), every experience falls into the `none` tier. The within-tier sort proceeds by composite_score (narrowing-fit plus matching biases) descending. Scores will be lower across the board (no high-tier candidates). This is correct behaviour: the system is honest that nothing in the inventory strongly matches.

The same applies when the candidate list is itself empty (a man with no firing directions and no past-presence directions on any direction, an edge case theoretically possible if the engine produced an empty `experience_candidate_directions` array, which the synthesis layer's past-presence inclusion rule per SYNTHESIS.md section 5.9 makes very unlikely). All experiences fall into the `none` tier; composite_score is the sole ordering signal; the rank-1-composite-zero handling in section 3.5 engages immediately when no biases contribute.


### 11.13 Direction fires but candidate experiences read low on narrowing-fit

A direction can be firing in the architectural reading while all (or almost all) variants tagged to that direction have protocols whose mapped narrowing tags match low-band readings only. The within-tier composite score for these variants is small (33 if the protocol maps to a low-band narrowing, 66 for moderate, 100 for high).

The algorithm does not exclude these variants. They remain in the firing tier and surface in For You, ordered by composite score (descending) and stable inventory order. They sit lower in the within-tier sort than firing-tier variants whose protocols map to the man's high or moderate bands, but they still surface, and the tier-primary rule keeps them above past_presence_only entries with higher composites.

Mitigation is content-side. When this case occurs at scale (a tier's variants read systematically low on narrowing-fit), the content workstream adjusts protocol assignments to lift their composite scores. The layer's behaviour is correct: it surfaces what's available and orders by what's known. Content quality is the resolution path, not algorithm change.

## 12. File structure

```
src/ui/
├── views/
│   ├── LaboratoryView.vue                 # the hub grid
│   └── LaboratoryDetailView.vue           # per-protocol page and the For You page
├── components/
│   ├── experience/
│   │   ├── ExperienceFeed.vue             # the shared feed: ranks, scopes, filters, paginates
│   │   ├── ExperienceCard.vue             # the card unit
│   │   ├── ExperienceCardActionMenu.vue   # the status-flag action menu
│   │   ├── ExperienceDetailDrawer.vue     # the drawer for full detail view
│   │   └── ExperienceFilters.vue          # the filter sidebar/drawer
│   └── shared/                            # (TermIndicator and TermPopover reused from the render layer)
├── experience/
│   ├── data/
│   │   ├── experiences.json               # the inventory (curated content, v3 ActivityInventoryFile)
│   │   ├── direction_mapping.ts           # inventory-tag-to-engine-direction map (see 3.1)
│   │   └── static_copy.ts                 # experience-layer UI copy (see 10.1)
│   ├── types.ts                           # local types (v3: Activity, Variant, RecommendableVariant, Protocol, Magnitude, WhoWith, NarrowingTag, PROTOCOL_TO_NARROWING; deprecated v2: Experience, ExperienceInventoryFile, Friction, Scale, ContextValue, ExperienceType)
│   ├── recommend.ts                       # the scoring algorithm (see 3.2, 3.3)
│   ├── diversify.ts                       # the diversification re-ranking pass (see 3.4)
│   ├── filter.ts                          # filter logic for the feed filters (see 4, 8)
│   ├── flatten.ts                         # flattens ActivityInventoryFile to RecommendableVariant[] (see 2.2)
│   ├── validation.ts                      # v3 schema validation (see 13)
│   └── status_store.ts                    # Pinia store for status flags + localStorage (see 7)
└── styles/
    └── main.css                           # tokens shared with the rest of the app
```

The experience layer has its own subdirectory under `components/` and its own logic directory at `src/ui/experience/`. The TermIndicator and TermPopover components live in `src/ui/components/shared/` and are imported by the experience layer where prose contains architectural terms. They are shared components used across any surface that renders architectural prose.

The local `types.ts` file declares types used internally by the layer. The v3 section declares `Activity`, `Variant`, `RecommendableVariant`, `Protocol`, `Magnitude`, `WhoWith`, `NarrowingTag`, and the canonical `PROTOCOL_TO_NARROWING` mapping. Deprecated v2 types (`Experience`, `ExperienceInventoryFile`, `Friction`, `Scale`, `ContextValue`, `ExperienceType`) remain pending removal as components complete migration. Engine and synthesis types (`DirectionName`, `ConstraintsOutput`, `RenderingInstructions`, `InputMap`, `NarrowingBandEntry`) are imported from their canonical sources (`src/engine/types.ts`, `src/synthesis/types.ts`) rather than redeclared. The constraint band types (`EnergyBand`, `TimeBand`, `BodyBand`, `PermissionBand`, `PermissionSubShape`) are accessed via the nested type fields on `ConstraintsOutput` (e.g., `ConstraintsOutput["energy"]["band"]`); whether they are also separately exported by `src/engine/types.ts` is an engine-side concern, not an experience-layer requirement.

**Build-time inventory-tag-mapping check:** The spec describes the intended v3 state where the build-time check operates on the v3 activity structure (iterating over `activity.directions` rather than `experience.directions`). The current `findUnmappedInventoryTags` function in `direction_mapping.ts` has a v2 signature (takes `readonly Experience[]`) and needs its signature updated to accept `Activity[]`. This is tracked as a code TODO; the spec describes the intended state.

## 13. Validation

Manual validation against architectural-shape fixtures. The Pinia store's `loadFixture(fixtureId)` action (built in the routing refactor) loads any fixture's input through the engine and synthesis layers and populates the active reading store. The experience layer reads from the store the same way it would in production. The experience layer does not implement its own fixture loading.

For each architectural shape, walk through the resulting For You feed and confirm it reads as a thoughtful spread rather than algorithmic output. Representative shapes:

**A profile reading Creator firing strong with capacity_strain on engine direction `making`:**
- For You surfaces predominantly `making`-tagged experiences (inventory tag `creation`).
- Diversification rules pull in at least 3 different protocols, 2 cost bands.
- The capacity_strain pull state biases composite scores: energy-heavy biases toward friction ≤2; high-friction `making` experiences sit lower in the firing-tier sort but still surface in tier order.
- Expected first 12: a mix of low-friction small `creation` experiences with deliberate spread into other directions for diversification.

**A profile reading five-direction firing with deep suppression:**
- For You surfaces all 5 firing engine directions.
- Heavy depletion (`energy.band === "heavy_depletion"`) biases composite scores: low-friction experiences receive +20. High-friction items sit lower in their tier's composite ordering.
- Diversification's no-three-in-a-row rule and spread targets ensure the 12-card feed isn't dominated by one direction.
- Expected first 12: low-friction starters across multiple directions; few big-magnitude items.

**A profile with an empty firing set:**
- For You falls back to past-presence directions per the tier composition in section 3.2 and the section 11.2 fallback behaviour.
- Feed isn't empty; it's driven by where his life used to have something. Past_presence_only is the highest tier present; all experiences with overlap rank above no-overlap entries.
- Constraint state further influences composite ordering within tier.

**A profile reading Creator phantom_partial as the single firing direction:**
- For You surfaces `making`-tagged experiences as the firing-tier candidates.
- Past-presence directions (per the synthesis output's `experience_candidate_directions`) also appear, in the past_presence_only tier.
- The phantom_partial pull quality signals a desired direction; low-friction creation experiences with strong narrowing-fit should rank well as gentle re-introductions.

For each shape, the For You feed should look like a thoughtful friend's list. Not algorithmic, not generic, not narrow. The "Show more" mechanism reveals more without changing the algorithm.

Browse should work for all shapes (filter by direction, by protocol, by exertion, by cost). Saved view starts empty; manually flag a few experiences to verify the flow.

### 13.1 Build-time checks

In addition to fixture walk-throughs, the build pipeline runs static checks against the v3 inventory (Activity[] structure). These run alongside the existing direction-tag check from section 3.1:

- **Direction tag in mapping** (per section 3.1). Each direction tag in each activity's `directions` array must be present in `inventoryTagToEngineDirection`. An unrecognised tag fails the build with a clear error.
- **Directions length check.** Each activity's `directions` array must have length 0-3. Length 4 or more fails the build.
- **Interest domains check.** Each activity's `interest_domains` array must have length 1-3. Length 0 or 4+ fails the build.
- **Novelty index check.** Each activity's `novelty_index` must be an integer 1-5. Values outside this range fail the build.
- **Protocol check.** Each variant's `protocol` must be one of the seven canonical values (stir, loophole, slip, catch, trespass, aside, steeping). An invalid value fails the build.
- **Friction check.** Each variant's `friction` must be an integer 1-5. Values outside this range fail the build.
- **Exertion check.** Each variant's `exertion` must be an integer 1-5. Values outside this range fail the build.
- **Magnitude check.** Each variant's `magnitude` must be one of the three canonical values (small, medium, big). An invalid value fails the build.
- **WhoWith check.** Each variant's `who_with` array must be non-empty and contain only valid values (solo, with_young_children, with_teenagers, with_adult_children, with_parents, with_partner, with_friends). Empty arrays or invalid values fail the build.
- **Pitch and instruction check.** Each variant's `pitch` and `instruction` must be non-empty strings. Empty strings fail the build.
- **Multi-protocol activity check** (per §13.2). An activity with 3 distinct protocols is allowed but rare (warning). An activity with 4 or more distinct protocols fails the build.
- **Term indicator coverage** (per section 11.7). Inventory prose is scanned for terms present in `term_explanations.ts` but absent from `term_indicator_targets.ts`. Matches surface as content review items, not build errors.

The build checks are a content quality gate. They run before the inventory bundle is committed to the build. Failures block deployment; warnings surface for content review without blocking.

### 13.2 Multi-protocol activity rule

An activity may contain multiple variants with different protocols. However, activities with many distinct protocols are discouraged because they dilute the activity's conceptual focus.

- **Allowed but rare:** An activity with 3 distinct protocols triggers a non-blocking warning. This is permitted but should be uncommon.
- **Error:** An activity with 4 or more distinct protocols fails the build.

This rule ensures that activities remain conceptually coherent while allowing reasonable protocol diversity (e.g., an activity might have stir, loophole, and slip variants for different entry points).

## 14. What this layer does not do

- **Does not generate experience content dynamically.** All names, descriptions, and metadata come from the curated inventory.
- **Does not call an LLM.** No AI-generated explanations, no dynamic ranking based on natural language understanding.
- **Does not learn preferences.** Status flags exclude (don't show me this again) but don't train a preference model. The system does not converge on what he already does.
- **Does not optimise for retention.** No streaks, no notifications, no nudges. The man comes back when he wants to.
- **Does not address the man directly.** Voice stays observational. No "you should try..." imperatives.
- **Does not animate.** No fade-ins, no slide-ups. Cards render instantly.
- **Does not persist filter state.** Each session starts with all filters cleared.
- **Does not display full experience text on the card.** Card shows summary; detail view shows full.
- **Does not include "related experiences" in v1.** Detail view is focused on one experience at a time.
- **Does not validate experience metadata at runtime.** Build-time checks per section 13 catch malformed inventory entries; runtime validation is out of scope.
- **Does not block by region or budget upfront.** The man filters in Browse if he wants to. No gates between architectural reading and experience surface.
- **Does not put filters on the For You feed.** For You is the system's editorial spread; filters live in Browse. Mixing the two dilutes both.
- **Does not reshuffle on "Show more".** The button is pagination, not reshuffle. Same algorithm, lower-ranked items appear.

## 15. Honest concerns and open questions

**Three naming spaces for directions, with one mapping retired.** The system has three naming spaces for directions: engine direction names (used internally by the algorithm and emitted by synthesis as `direction_engine_name`), inventory tags (used by content authors), and display names (emitted by synthesis as `direction_name`, shown to the man). Synthesis now emits both the engine name and the display name on each candidate, so the experience layer no longer maintains a display-name-to-engine-name mapping. The remaining `inventoryTagToEngineDirection` map covers the two divergences between inventory tags and engine names (`making` vs `creation`, `relationship` vs `closeness`); a build-time check catches drift. Fragility is reduced but not eliminated: a future synthesis schema change to `direction_engine_name` would break the algorithm, and inventory tag conventions still depend on author discipline. Worth monitoring.

**The inventory voice has not yet been audited.** The current inventory contains second-person address and imperatives in the majority of entries (a recent audit found 121 of 182 entries contain "you/your" in description or why_it_works). The experience layer code is voice-clean, but the rendered dashboard will speak in second person via inventory text until a content review pass rewrites the inventory. This is an explicit launch precondition.

**Protocol assignment quality matters more than coverage during rollout.** The protocol field is required on every variant, but the inventory is expected to have uneven protocol coverage across activities on initial deployment. During the rollout, any protocol assignment beats a missing one in the within-tier sort: a poorly assigned protocol (chosen without much thought) outranks a peer if its mapped narrowing intensity happens to score. The protocol assignment workstream's quality of judgement matters more than its coverage. Worth bringing editorial discipline to the protocol assignment pass.

**Coarse-grained ordering produces many ties.** The intensity values are discrete (33, 66, 100). Each variant scores exactly one of these three values from its protocol-mapped narrowing. Many composite-score ties exist within each tier, resolved by stable inventory order. The inventory's editorial order is therefore a meaningful determinant of For You feed shape, more so than the lexicographic-by-tier framing might imply at first read. Worth attending to inventory ordering as a quality lever, not just an arbitrary id sequence.

**Per-build determinism.** The algorithm is deterministic per build, but the For You feed can shift across builds as protocol assignments are adjusted or new variants are added. The same man returning after a content release may see a different first-12 set. This is a deliberate consequence of content evolution and is expected behaviour, not a bug. Worth communicating to content review: protocol changes the feed.

**Diversification rules are defensible defaults, not optimised.** "No three in a row" is a starting point. The spread targets ("at least 3 protocols, at least 2 cost tiers in the top 12") are loose given the inventory's facet distribution and likely satisfied naturally most of the time. Real-world use may show that tighter rules produce better feeds. Worth flagging for tuning after deployment.

**The constraint bias magnitudes are initial.** The +20 biases in section 3.2 (energy heavy → friction ≤2; time pressed → magnitude: small) were chosen as one fifth of a single max-narrowing match. The relative weight of biases against narrowing-fit is the tuning knob: if biases dominate too readily (e.g., low-friction variants outranking peers more often than feels right), the +20 magnitude reduces. If biases barely register, it increases. Worth treating as a configurable parameter.

**The recommendation algorithm is sensitive to inventory composition.** If the inventory has 80% Creator experiences and 5% Contributor, the For You feed for any man will skew Creator (mitigated but not fully corrected by diversification). The narrowing-fit signal does not correct for this: it orders within tier, not across tiers. Worth monitoring inventory balance and flagging gaps. A concrete sensitivity case: a body-capacity-limited reading combined with an inventory where the man's firing directions are dominantly high-exertion variants would produce a very thin firing tier after hard exclusion. The algorithm's behaviour is correct (the fallback into lower tiers handles the thin firing tier), but the feed quality depends on the inventory carrying low-exertion alternatives across all directions.

**Cold-start quality is the main quality risk.** The man is unlikely to come back many times. If the first For You feed doesn't land, the product hasn't worked. Worth manually walking through all architectural-shape fixtures during build to confirm each looks like a thoughtful spread, not algorithmic output. The cohort is small enough to do this by eye.

**Region filtering is limited.** Most experiences are tagged "nationwide" but some are specific to regions (Lake District, Wales, Scotland). The man's region isn't captured anywhere yet. He filters in Browse if he cares; For You doesn't filter by region.

**The detail view is informational only in v1.** No booking flow, no calendar integration, no "share with partner" feature. These are deferrable; the core surface is the suggestion plus the status flag.

**No analytics yet.** What experiences are most commonly saved? Most commonly dismissed? Which architectural shapes correlate with which flags? Worth building this in later, but v1 ships without telemetry.

**Family-shape inference is not currently implemented.** A previous draft of the recommendation algorithm included a family-shape counterweight rule that biased toward solo experiences when the man's life is family-shaped. It was removed because the InputMap does not carry household composition signals (per ENGINE.md section 3). If household composition is added to the InputMap in a later revision, this rule can be reinstated.

**The "related experiences" omission is deliberate but worth revisiting.** A man who saves "Build a fire from scratch" might genuinely want to see other low-friction expression experiences. Detail-view related-experiences could help. Held for a later iteration.
