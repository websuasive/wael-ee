# WAEL Architecture, Consolidated Build Specification

The Experience Engine. An architecture that reads enough about a man's life to suggest experiences that help him feel alive again.

This document is the single build contract for the engine. It specifies the canonical input map structure, the input variables it contains, the scoring functions that compute outputs, the engine output object structure, and the whole-system computation order. Downstream rendering and experience-suggestion layers build against this contract.

---

**Status: DRAFT.** This document is the merged canonical, absorbing the v3-extension amendment and the v4 amendment into a single specification. Fixture-specific content (cohort-distribution counts, named fixture references, cohort backfill data, coverage matrices keyed to cohort fixtures, fixture-keyed worked examples) has been removed per the merge policy. The amendments `ENGINE_V3.md` and `ENGINE_V4.md` are preserved as locked historical record but are superseded by this document for architectural specification purposes.

**Merge date:** 17 May 2026.

After project lead review, this document's status flips from DRAFT to LOCKED.

---

## 1. Purpose and North Star

**North Star.** This is the Experience Engine. The architecture reads what's needed to suggest experiences that help him feel alive again, nothing more.

The architecture reads observable patterns in his current life and produces engine outputs that drive experience suggestions. Outputs surface in a dashboard not as diagnosis but as recognition: plain readings of what is pulling at him, what has reduced, and what's realistic right now. From those readings the experience layer draws specific things he can try.

**What the system reads.** Observable patterns in his current life, not the causes of those patterns. A reduced domain is a reduced domain whether it came from a death, a role ending, or a slow drift. The architecture reads what's there, not where it came from. The man supplies the why himself.

**What the product is for.** Helping a man feel alive again in his personal life. The architecture stays in the parts of life he can move within: his time, his attention, his relationships, his evenings, his weekends. Work patterns are read only where they explain personal-life patterns or filter what's realistic for him to try.

**What this is not.** Not a diagnostic instrument. Not a personality system. Not a comprehensive psychological assessment. The architecture deliberately reads only what is lever-relevant to the experience-suggestion goal. Diagnostic richness that does not change which experience to suggest is out of scope.

**Conditional questions: limited and by exception.** A small number of conditional questions are permitted where they genuinely improve the instrument; most questions are answered by every man. The default remains to avoid branching and skip logic: where a question may not apply (for example, Permission sub-shape for a man with no permission block, Recent reaching for a man with no current reaching), prefer giving the question itself an explicit "doesn't apply" or equivalent answer option that the architecture reads as a value, rather than conditioning on prior answers. Conditional display is the exception, not the rule.

The single exception: for four Domain presence wanting questions where the answer is structurally always "Wants" (Time as yours, Energy as resource, Felt aliveness, Body/physical aliveness), the architecture defaults to "Wants" and the instrument does not ask. This is not conditional logic. The four defaulted questions are fixed at instrument-design time, the same for every man.

**Architecture principles.**

- The architecture reads what's there, not why.
- Outputs serve recognition, not diagnosis.
- What's intact is surfaced alongside what's reduced. The aim is to help him feel alive, not to enumerate what's wrong.
- The architecture sizes itself to him. Heavier profiles produce more output, sparser profiles produce less. Volume is calibrated to what's actually firing, not to a fixed dashboard length.
- The architecture stays in his personal life. Work is read only where it explains personal-life patterns or filters what's realistic.

**What the engine extension reads.** The architecture extends to read further architectural dimensions: the texture of the man's week (`week_shape`), his sense of where he sits in his own arc (`life_stage`), his temperamental orientation toward people or solitude (`sociality_default`), his subjective relationship to paid work (`paid_work_relationship`), what is most absorbing his time and energy regardless of whether it is paid (`primary_load`), and four internal cognitive-attentional habits operating on him within his life-shape (`psychological_filtering`, `role_consolidation`, `attention_pattern`, `relational_presence`). These dimensions sit in `cross_direction` alongside `capacity_strain`, `life_shape_duration`, and `direction_chosen`. They are architectural in the same sense those existing fields are: stable enough to read; subject to slow change over time; informative about how the current pattern of his life composes.

**On the work split.** The architecture reads paid work and primary load as independent axes. A single `work_relationship` field would implicitly assume paid work and produce silent or false readings for men whose primary load is unpaid (caregiving, dependents, household). With the two-field split, a man with `paid_work_relationship: chosen` and `primary_load: caregiving` reads as "paid work is genuinely his, but it isn't his primary load right now", a real shape the single-field design could not express.

**The self-report channel.** Alongside the architectural inputs, the engine accepts a parallel channel called `self_report`, in which the man names up to three things he feels the absence of, in his own register. The engine does not derive over this channel. No predicate references it. The architectural reading is unchanged by what he names. The data passes through to the synthesis layer, which composes a comparison surface naming what he ticked alongside what the architecture reads. This separation is load-bearing: the comparison is informative because the two readings are independent.

**The narrowing dimensions.** The architecture also reads cognitive-attentional habits that operate on a man within his life-shape: how he treats wants before letting them become action (`psychological_filtering`), how much his role colonises his self-experience across contexts (`role_consolidation`), the texture of his attention as a habit (`attention_pattern`), and the quality of his presence in the relationships he has (`relational_presence`). The engine composes these inputs plus existing readings into seven narrowing bands on `EngineOutput.cross_direction`. The bands feed synthesis composition; the engine itself does not synthesise.

**The spiritual axis.** The domains block reads a twelfth domain alongside the existing eleven: `spiritual`. The axis reads self-identified religious or spiritual orientation. Many men have no relationship to a felt larger frame and have never had one; their meaning comes from specific people and activities. The existing domain value enum accommodates this naturally (`never_been_part_of_his_life` fires more often for `spiritual` than for any other domain). Details and the strict-reading note in §3.5.1.

---

## 2. The Three-Signal Model

Three signals, plus three cross-cutting outputs, plus a synthesis layer that lives downstream.

| Signal | What it reads | What it does for the experience layer |
|---|---|---|
| Direction | Where there is genuine pull | Generates suggestion type (which kind of experience) |
| Domain presence | What's reduced or missing | Refines suggestion specificity (which dimension to address) |
| Realistic constraints | What's realistic for him to do right now | Filters suggestions by what he can actually do |

The three signals together let the experience layer produce a suggestion that is aimed at his current pull, specific to a domain that matters to him, and realistic for his current life.

**The six directions.** Freedom Designer (control over time and decisions), Creator (building or creating something of his own), Experience Seeker (new or different experiences), Relationship Rebuilder (closeness with people who matter), Growth Focused (challenge and being tested), Contributor (being useful where he'd choose to be).

**Cross-cutting outputs.** Between shapes (4.1), Mid-process (4.2), Held unattributed (4.3). These don't belong to any single signal but affect framing of suggestions.

**Synthesis.** Composition of the firing pattern into a single read of where he is standing. This is rendering-layer work, not an engine output. The engine's contribution to synthesis is the firing pattern of all other outputs.

The cross-direction group is extended beyond the original three fields: it carries `week_shape`, `life_stage`, `sociality_default`, `paid_work_relationship`, `primary_load`, `psychological_filtering`, `role_consolidation`, `attention_pattern`, and `relational_presence` (defined in §3.4) alongside the existing cross-direction inputs. The engine derives `life_texture_band` from `week_shape`, `expression_space` per direction from `week_shape` × direction, and seven narrowing bands on `EngineOutput.cross_direction`. See §4 for derivations and §6 for output structure.

---

## 3. Input Variables and Input Map Structure

The engine receives input as a canonical structured object called the InputMap. This section defines both the structure of that input (3.1) and the variables it contains (3.2 through 3.8). Whatever populates the InputMap, whether a questionnaire, a test fixture, a configuration file, or any other source, must produce this structure. The InputMap is the engine's input contract.

The variable definitions in 3.2 through 3.7 use human-readable forms in the tables for clarity (for example "None / Mild / Quickening"). The canonical InputMap (3.1) uses snake_case machine-readable equivalents ("none" / "mild" / "quickening"). The mapping is direct: lowercase the identifier and replace spaces, slashes, hyphens, and parentheses with underscores. Where parentheses enclose a qualifier (e.g. "Phantom (partial)"), the qualifier becomes part of the token: "phantom_partial". Translation table for the less obvious cases:

| Human-readable form | snake_case form |
|---|---|
| "Body / physical aliveness" | "body_physical_aliveness" |
| "Recent-and-awkward" | "recent_and_awkward" |
| "Mid-stream" | "mid_stream" |
| "Long-established" | "long_established" |
| "No-current-reaching" | "no_current_reaching" |
| "want-block" | "want_block" |
| "say-block" | "say_block" |
| "act-block" | "act_block" |
| "Doesn't want" | "doesnt_want" |
| "Wants" | "wants" |

**Variable label gaps.** Variable labels contain deliberate gaps (no D6, no G1, no X3) reflecting the architecture's evolution. Gaps are intentional and do not indicate missing variables.

### 3.1 Input map structure

The engine receives one InputMap per man, structured as follows. All keys are required (with the single exception of the wanting field for the four universal-wanting domains, which may be omitted).

```
type InputMap = {
    directions: {
        contributor:            PerDirectionInputs
        experience_seeker:      PerDirectionInputs
        freedom_designer:       PerDirectionInputs
        growth_focused:         PerDirectionInputs
        creator:                PerDirectionInputs
        relationship_rebuilder: PerDirectionInputs
    }
    cross_direction: {
        direction_chosen:        DirectionChoiceValue
        capacity_strain:         "no" | "yes"
        life_shape_duration:     "recent" | "sustained" | "long"
        week_shape:              WeekShapeFlags
        life_stage:              LifeStageValue
        sociality_default:       SocialityValue
        paid_work_relationship:  PaidWorkRelationshipValue
        primary_load:            PrimaryLoadValue
        psychological_filtering: PsychologicalFilteringValue
        role_consolidation:      RoleConsolidationValue
        attention_pattern:       AttentionPatternValue
        relational_presence:     RelationalPresenceValue
        reach_retrospective?:     DirectionChoiceValue
        reach_counterfactual?:    DirectionChoiceValue
    }
    domains: {
        time_as_yours:           PerDomainInputs
        energy_as_resource:      PerDomainInputs
        felt_aliveness:          PerDomainInputs
        body_physical_aliveness: PerDomainInputs
        curiosity:               PerDomainInputs
        making:                  PerDomainInputs
        conversation_depth:      PerDomainInputs
        being_known:             PerDomainInputs
        friendship:              PerDomainInputs
        intimacy:                PerDomainInputs
        mattering:               PerDomainInputs
        spiritual:               PerDomainInputs
    }
    constraints: {
        energy_availability:  number   // 0-100
        time_availability:    number   // 0-100
        body_capacity:        number   // 0-100
        permission:           number   // 0-100
        permission_sub_shape: "present" | "want_block" | "say_block" | "act_block"
    }
    cross_cutting: {
        recent_life_shape_change:     "yes" | "no"
        replacement_structure_exists: "yes" | "no"
        recent_reaching:              "recent_and_awkward" | "mid_stream" | "long_established" | "no_current_reaching"
    }
    self_report: SelfReport
}

type PerDirectionInputs = {
    stated_strength:   number                       // 0-100
    stated_allocation?: number                      // 0-100, normalised £X/70×100 (B1 phantom side-channel). Optional: when B1 is not implemented (no £70 producer), the field is absent and phantom detection cleanly does not fire via ?? 0.
    felt_cost:         number                       // 0-100
    anticipation:      "none" | "mild" | "quickening"
    current_movement:  number                       // 0-100
    recent_action:     "none" | "some" | "recent"
    past_presence:     "yes" | "no"
    specificity:       "none" | "partial" | "strong"
    would_reach_for:   "yes" | "no"
    saturation:        "yes" | "no"
    stopped_expecting: "yes" | "no"
}

type PerDomainInputs = {
    current_state: number               // 0-100
    past_presence: "yes" | "no"
    wanting?:      "wants" | "doesnt_want" // for the four universal-wanting domains, this field can be omitted; see 3.5. For the spiritual domain, wanting is mandatory and must be elicited; the universal-wanting omission convention does not extend to spiritual.
    peace_discriminator?: "made_peace" | "still_misses" // optional: B9 field for with-history reduced domains. Used in the wanting derivation: doesnt_want if past_presence=yes AND peace_discriminator=made_peace AND current_state<60.
}

type DirectionChoiceValue =
    | "contributor"
    | "experience_seeker"
    | "freedom_designer"
    | "growth_focused"
    | "creator"
    | "relationship_rebuilder"
    | "rest"
    | "none"

type WeekShapeFlags = {
    work_dominates:      boolean
    weekends_consumed:   boolean
    weekly_activity:     boolean
    sees_people:         boolean
    makes_things:        boolean
    active_body:         boolean
    belongs_to_group:    boolean
    solo_practice:       boolean
    varied_week:         boolean
}

type LifeStageValue =
    | "building"
    | "consolidating"
    | "re_evaluating"
    | "transitioning"
    | "settled"
    | "drifting"
    | "enduring"

type SocialityValue =
    | "solitary_by_default"
    | "balanced"
    | "social_by_default"

type PaidWorkRelationshipValue =
    | "defining"
    | "consuming"
    | "functional"
    | "peripheral"
    | "between"
    | "chosen"
    | "endured"

type PrimaryLoadValue =
    | "paid_work"
    | "caregiving"
    | "household_admin"
    | "none"

type PsychologicalFilteringValue =
    | "does_not_filter"
    | "filters_some"
    | "filters_pervasively"

type RoleConsolidationValue =
    | "holds_other_selves"
    | "role_inflected"
    | "role_consolidated"

type AttentionPatternValue =
    | "engaged"
    | "intermittent"
    | "autopilot"

type RelationalPresenceValue =
    | "present"
    | "partial"
    | "mostly_absent"

type SelfReport = {
    named_absences: SelfReportItemId[]   // length 0-3 (see validity rule 9 below)
}

type SelfReportItemId =
    | "more_friends"
    | "more_time_to_myself"
    | "something_just_for_me"
    | "more_energy"
    | "getting_back_in_shape"
    | "something_to_look_forward_to"
    | "proper_conversation"
    | "building_or_making"
    | "something_im_part_of"
    | "nothing_really"
```

**Engine purity for self-report.** This is a load-bearing structural rule:

The engine reads `InputMap.self_report.named_absences` for validation only (validity rule 9, below). No engine predicate, scoring function, derivation, or output computation references `self_report`. The synthesis layer reads `InputMap.self_report` directly to compose the comparison surface. The engine's architectural reading is identical for two InputMaps that differ only in their `self_report` values.

If a future amendment proposes wiring `self_report` into an engine derivation, that amendment must explicitly call out the change and revisit the comparison-surface design, which presumes the two readings are independent.

#### Validity rules

The engine validates the InputMap before scoring. The following rules must hold:

1. **All required fields present.** All keys in InputMap, PerDirectionInputs, and PerDomainInputs are required. Missing fields produce a validation error. The exception is the wanting field for the four universal-wanting domains (time_as_yours, energy_as_resource, felt_aliveness, body_physical_aliveness): these may be omitted, in which case the engine treats them as "wants". The wanting field for the spiritual domain is mandatory and must be elicited; the universal-wanting omission convention does not extend to spiritual.

2. **Numeric values in range.** All number fields (stated_strength, felt_cost, current_movement, current_state, energy_availability, time_availability, body_capacity, permission) must be in 0-100 inclusive. Out-of-range values produce a validation error.

3. **Categorical values from the allowed set.** Each categorical field must be one of its allowed values exactly. Unknown values produce a validation error.

4. **would_reach_for/direction_chosen consistency.** The per-direction would_reach_for values must be consistent with the cross-direction direction_chosen: would_reach_for = "yes" for exactly one direction (the one matching direction_chosen, when direction_chosen is a direction value), would_reach_for = "no" for the other five. When direction_chosen = "rest" or direction_chosen = "none", would_reach_for = "no" for all six directions. Inconsistent would_reach_for/direction_chosen produces a validation error.

5. **wanting field for universal-wanting domains.** If wanting is set explicitly for one of the four universal-wanting domains, it must be "wants". Any other value produces a validation error.

6. **week_shape completeness.** All nine fields of `cross_direction.week_shape` must be present as booleans. Missing fields produce a validation error naming the specific missing field. No silent defaults: absent flags are not interpreted as `false`. This rejects malformed InputMaps explicitly rather than propagating bugs through to downstream consumers.

7. **life_stage, sociality_default, paid_work_relationship, primary_load enum values.** Each must be present and must match its allowed enum exactly. Unknown values produce a validation error. There is no `multiple` value for `primary_load`: when more than one load applies, the questionnaire is responsible for forcing a single primary by wording ("if more than one applies, name the one that's most absorbing"). The engine receives the resolved single value; if a future questionnaire produces multiple selections, those must be collapsed before the InputMap is constructed.

8. **self_report shape.** `self_report.named_absences` must be an array (may be empty). Each entry must be a valid `SelfReportItemId`. Unknown values produce a validation error.

9. **self_report cap and mutual exclusion.**
   - `named_absences.length <= 3`. Longer arrays produce a validation error.
   - If `"nothing_really"` is in `named_absences`, it must be the only entry. A `named_absences` array containing `"nothing_really"` plus any other item produces a validation error.

10. **psychological_filtering value.** `cross_direction.psychological_filtering` must be one of `does_not_filter | filters_some | filters_pervasively`. No defaults; absent field is a validation failure with error code `cross_direction_psychological_filtering_missing`.

11. **role_consolidation value.** `cross_direction.role_consolidation` must be one of `holds_other_selves | role_inflected | role_consolidated`. No defaults; absent field is a validation failure with error code `cross_direction_role_consolidation_missing`.

12. **attention_pattern value.** `cross_direction.attention_pattern` must be one of `engaged | intermittent | autopilot`. No defaults; absent field is a validation failure with error code `cross_direction_attention_pattern_missing`.

13. **relational_presence value.** `cross_direction.relational_presence` must be one of `present | partial | mostly_absent`. No defaults; absent field is a validation failure with error code `cross_direction_relational_presence_missing`.

14. **spiritual domain shape.** `domains.spiritual` must conform to the canonical `PerDomainInputs` shape: `current_state` (integer in [0, 100]), `past_presence` (`yes | no`), `wanting` (`wants | doesnt_want`). Same shape as the existing eleven domain entries. Absent or malformed entry is a validation failure with error code `domain_spiritual_missing` or `domain_spiritual_malformed`. `wanting` is mandatory for the spiritual domain; the universal-wanting omission convention that applies to the four canonical universal-wanting domains does not extend to spiritual.

All fourteen validity rules apply at the input boundary. The engine rejects malformed InputMaps before any scoring runs. The strict-presence pattern (no silent defaults) is consistent across all rules: missing values produce explicit validation errors; type coercion is rejected.

The InputMap can be constructed from any source. The questionnaire is one such source; hand-built test fixtures are another. The engine treats them identically.

### 3.2 Notation

Each input variable is specified with name, type, value range or value set, default (if any), and definition. Per-direction and per-domain variables use array notation: `stated_strength[d]` means "stated_strength for direction d." Categorical values that map to numeric scales for scoring carry the mapping.

The valid directions are:

```
direction d in {Contributor, Experience Seeker, Freedom Designer, Growth Focused, Creator, Relationship Rebuilder}
```

(Listed alphabetically; this order is also the tiebreaker used in the surfacing rule, see 5.1.)

The valid domains are:

```
domain in {
    Time as yours,
    Energy as resource,
    Felt aliveness,
    Body / physical aliveness,
    Curiosity,
    Making,
    Conversation depth,
    Being known,
    Friendship,
    Intimacy,
    Mattering,
    Spiritual
}
```

### 3.3 Per-direction variables

Ten variables per direction. With six directions, this is 60 per-direction variable values.

| Variable | Type | Values | Default | Definition |
|---|---|---|---|---|
| **stated_strength[d]** (D1) | continuous | 0-100 | none | How strongly the man says he wants more of this direction. Derived by the assembler from the per-direction card observations (anticipation, current_movement, specificity); see 5.1. |
| **felt_cost[d]** (D2) | continuous | 0-100 | none | Whether the absence registers as a cost. High = absence registers as real loss; low = absence is unfelt. |
| **anticipation[d]** (D2a) | categorical (3) | None / Mild / Quickening | none | When he imagines this direction in his life, what comes up. None = nothing arrives. Mild = some warmth or light recognition. Quickening = anticipation, body responds, real internal "yes." Mapping for scoring: None=0, Mild=50, Quickening=100. |
| **current_movement[d]** (D3) | continuous | 0-100 | none | How much he is currently doing things in this direction. Recent ongoing pattern; time window typically the past 1-3 months. |
| **recent_action[d]** (D3a) | categorical (3) | None / Some / Recent | none | Whether there has been any action in this direction recently, however small. Distinct from current_movement (pattern); recent_action is whether one or more recent acts exist. Time window: last 1-3 months. Mapping for scoring: None=0, Some=50, Recent=100. |
| **past_presence[d]** (D4) | binary | Yes / No | none | Has this direction ever been a real part of his life at some point in the past. The man works out when himself. |
| **specificity[d]** (D5) | categorical (3) | None / Partial / Strong | none | Whether he has something specific in mind that he can describe and that he has been turning over. No fixed time window; the architecture reads currency, not history. None = wanting without specific object. Partial = something forming. Strong = can describe it clearly and has been holding it. Mapping for scoring: None=0, Partial=50, Strong=100. |
| **would_reach_for[d]** (D7a) | binary | Yes / No | none (derived from forced-choice) | Would he reach for this direction given free time. Derived from the free-time forced-choice question (see 5.1). would_reach_for = Yes for the chosen direction, would_reach_for = No for all others. |
| **saturation[d]** (D8) | binary | Yes / No | No (instrument-side default; the InputMap requires the field to be set explicitly per validity rule 1) | Whether the wanting in this direction has become draining. Read for every direction. |
| **stopped_expecting[d]** (D9) | binary | Yes / No | No (instrument-side default; the InputMap requires the field to be set explicitly per validity rule 1) | Whether the wanting has been withdrawn from rather than abandoned. Read for every direction; in practice strongest on Relationship Rebuilder. No fixed time window; reads felt withdrawal, not a dated event. |


### 3.4 Cross-direction variables

Twelve cross-direction variables, one value per man.

| Variable | Type | Values | Default | Definition |
|---|---|---|---|---|
| **direction_chosen** (D7b) | categorical (8) | Contributor / Experience Seeker / Freedom Designer / Growth Focused / Creator / Relationship Rebuilder / Rest / None | none | From the free-time forced-choice question, which response did he pick. "Rest" is the value when he chose to do nothing in particular. "None" is the value when he was unable to choose. |
| **capacity_strain** (G2) | binary | Yes / No | No | Whether he wants more in life but also wants less on his plate. |
| **life_shape_duration** (G4) | categorical (3) | Recent / Sustained / Long | none | How long the man's current life-shape has been roughly as it is. recent = under 2 years; sustained = 2-5 years; long = 5+ years. Reads structural duration, not subjective duration. |
| **week_shape** (G5) | nine binary flags | true / false per flag | no defaults | The texture of the man's week. Nine flags capturing what his typical week contains (six contents flags), what is absorbing his time (two load flags), and whether the pattern repeats (one pattern flag). See §3.4.1 for per-flag definitions. |
| **life_stage** (G6) | categorical (7) | Building / Consolidating / Re-evaluating / Transitioning / Settled / Drifting / Enduring | none | Where the man reads himself as sitting in his own arc. Not biological age. Self-report. Single value, no derivation. Reads where he sits internally, which for some men is not observable from current life-shape. See questionnaire-design note in §3.4.0. |
| **sociality_default** (G7) | categorical (3) | Solitary by default / Balanced / Social by default | none | His temperamental orientation toward people versus solitude. Not capability. Not loneliness. Not a measure of current social texture. Reads where he sits when given the choice, which for some men is a hypothetical rather than an observable. See §3.4.0. |
| **paid_work_relationship** (G8a) | categorical (7) | Defining / Consuming / Functional / Peripheral / Between / Chosen / Endured | none | His subjective relationship to paid work specifically. Distinct from work hours (captured by `week_shape.work_dominates`) and from capacity_strain (an outcome). Silent for retired men whose paid work has ended; see §3.4.2. |
| **primary_load** (G8b) | categorical (4) | Paid work / Caregiving / Household admin / None | none | What is most absorbing his time and energy currently, regardless of whether it is paid. Single value: the questionnaire forces resolution when multiple loads apply. `none` captures men with no significant primary load. See §3.4.2 for composition with `paid_work_relationship`. |
| **psychological_filtering** (G9) | categorical (3) | Does-not-filter / Filters-some / Filters-pervasively | none | The cognitive habit of utility-checking desire before letting it become action or articulation. See §3.4.4. |
| **role_consolidation** (G10) | categorical (3) | Holds-other-selves / Role-inflected / Role-consolidated | none | The degree to which his self-experience is colonised by his role across contexts. See §3.4.5. |
| **attention_pattern** (G11) | categorical (3) | Engaged / Intermittent / Autopilot | none | The texture of his attention as a habit when moving through ordinary time. See §3.4.6. |
| **relational_presence** (G12) | categorical (3) | Present / Partial / Mostly-absent | none | The quality of his presence in the relationships he has. Distinct from contact and from depth. See §3.4.7. |

(sustained_constraint_intensity (G3) is derived rather than elicited. See section 4.)

**Note on would_reach_for/direction_chosen non-independence.** The per-direction would_reach_for values are fully determined by direction_chosen: would_reach_for = Yes for the chosen direction, would_reach_for = No for the other five (regardless of whether direction_chosen = Rest or None). Holding both is a convenience for scoring: the per-direction Phantom branch reads would_reach_for, the cross-direction Behaviourally divergent branch reads direction_chosen. They are not independent inputs.

#### 3.4.0 Questionnaire-design note for life_stage and sociality_default

Both `life_stage` and `sociality_default` read fields the man's current life-shape may not supply observable evidence for. A man whose life is full of obligation may not be able to point to evidence of his stage-of-arc; a man whose life does not permit non-orienting may not be able to point to evidence of his temperamental sociality.

For both fields, the questionnaire is responsible for surfacing the reading even when the man's current life-shape suppresses the natural observation. The engine accepts the questionnaire's elicited value verbatim; the engine does not penalise or flag answers that lack architectural corroboration.

Example phrasings (final wording in `RENDER.md`):

- For `sociality_default`: *"Imagine you have a free afternoon and no obligations. What's your first inclination: somewhere quiet alone, or somewhere with people you like?"*
- For `life_stage`: *"When you read your own life-shape from the inside, which of these fits best?"* with the seven values offered as plain phrases rather than the enum identifiers.

This note exists in §3.4 because both fields share the same elicitation problem, and the questionnaire designer needs to see them flagged together to avoid producing questions that depend on observable life-texture.

The same elicitation difficulty applies, in different specific shapes, to `psychological_filtering`, `role_consolidation`, `attention_pattern`, `relational_presence`, and the `spiritual` domain. Each of those subsections carries its own elicitation-discipline paragraph.

#### 3.4.1 week_shape per-flag definitions

The nine flags partition into three groups by what they read.

**Contents flags (six).** Each reads whether a particular kind of activity, contact, or practice exists in his typical week with enough regularity to read as a feature of the week, not an occasional event.

| Flag | True when |
|---|---|
| `weekly_activity` | A recurring weekly thing exists outside work and household (a class, club, league, group, regular session). |
| `sees_people` | Regular in-person contact with people he likes, outside the immediate household. |
| `makes_things` | Visible making in his week: building, repairing, writing, drawing, cooking-as-practice, woodworking, music-as-practice. Not "I cooked dinner." |
| `active_body` | Body in motion regularly, not by accident. Walking with intent, cycling, gym, sport, manual labour outside work. |
| `belongs_to_group` | A community, congregation, club, team, mission, or cause that he is currently part of. Not "I used to be in a band." |
| `solo_practice` | A chosen solo activity done for its own sake, regularly: reading deeply, playing an instrument, writing, photography, drawing, gardening as practice, study for its own sake. The "for its own sake" qualifier separates this from background entertainment. |

**Load flags (two).** Each reads what is absorbing his time. These are positive readings of constraint patterns, not negative readings of texture.

| Flag | True when |
|---|---|
| `work_dominates` | Work occupies more than roughly 50 hours per week, and/or work bleeds into evenings and weekends regularly. The combination is captured by a single flag because either alone reads similarly architecturally. |
| `weekends_consumed` | Saturdays and Sundays are mostly absorbed by domestic obligations, family logistics, household admin, or caring responsibilities. |

**Pattern flag (one).** This reads a higher-order property of the week rather than its contents.

| Flag | True when |
|---|---|
| `varied_week` | His weeks contain meaningful variation from one another, rather than the same loop repeating. This is asked relative to himself: if he can describe a typical week and the description applies to almost every week of the last year, `varied_week` reads false; if no single description covers most weeks, it reads true. |

**Grain note.** The contents flags and the load flags differ in grain: contents flags name what fills time positively, load flags name what absorbs time. This asymmetry is deliberate. The underlying questions are different (what kind of activity exists in his time versus what is using up his time) and conflating them would muddy both. The pattern flag `varied_week` sits on a third axis (the shape of the week, not its contents), and the engine treats it asymmetrically in derivations (see §4.4 and §4.5).

**Independence note.** The contents flags are not mutually exclusive and can overlap conceptually. A man whose weekly activity is also the group he belongs to (for example, a church choir) ticks both `weekly_activity` and `belongs_to_group`. The flags are counted independently in `life_texture_band` (§4.4); see that section's "count semantics" note for explicit treatment.

#### 3.4.2 Composing paid_work_relationship and primary_load

The two work fields are independent axes. `paid_work_relationship` reads the man's subjective relationship to paid work as a category; `primary_load` reads what is most absorbing his time and energy in the current pattern. The combinations are architecturally meaningful:

| paid_work_relationship | primary_load | Architectural reading (illustrative; synthesis composes) |
|---|---|---|
| `chosen` | `paid_work` | Paid work is his and it is his primary load. The expected shape for engaged professionals. |
| `chosen` | `caregiving` | Paid work is genuinely his, but it is not what is most absorbing him right now. A man who would identify as engaged in his work but whose energy is going elsewhere. |
| `endured` | `paid_work` | He wants out of paid work and it is what is absorbing him. Compounded difficulty. |
| `endured` | `caregiving` | He wants out of paid work, and the load on him is from caregiving (so even leaving paid work would not free him). A particularly compressed shape. |
| `functional` | `caregiving` | Paid work is neutral. Caregiving is the load. The paid-work field reads silent but accurate; the load field carries the architectural weight. |
| `between` | `none` | He is between paid work commitments; nothing is significantly absorbing. Possibly a transitional or recuperative state. |
| `peripheral` | `paid_work` | He reads paid work as peripheral, yet paid work is what is absorbing him. A tension worth surfacing. |

The engine emits both fields verbatim in `EngineOutput.cross_direction`. Synthesis composes prose across the combination. No engine predicate consumes the combination directly; the combination is for downstream layer use.

**Why no `multiple` value for `primary_load`.** A `multiple` value would let the man dodge the architectural reading. The questionnaire forces a single primary by wording ("if more than one applies, name the one that's most absorbing"). If the resolution is genuinely impossible (the man cannot identify a single primary), the questionnaire should surface that as a separate signal, not pollute `primary_load` with a non-orthogonal value. The architecture treats single-primary as the structural commitment.

**Retirement and the silent paid_work_relationship.** A man whose paid work has ended (retirement, redundancy without re-entry, sustained non-employment) does not have a current `paid_work_relationship` reading in the usual sense. The questionnaire is expected to handle this with `between` (transitional or recent retirement) or via the `primary_load: none / caregiving / household_admin` reading carrying the architectural weight. If a later amendment finds that retired men's paid_work_relationship readings consistently misread, a `retired` value can be added; for now the existing seven values plus the `primary_load` axis cover the range.

#### 3.4.3 life_stage value definitions

The seven values are defined as follows. The man self-reports; the engine accepts the value verbatim.

| Value | Definition |
|---|---|
| `building` | Still constructing his life; the major moves are in front of him. |
| `consolidating` | The architecture is in place; he is actively deepening or refining what is there. |
| `re_evaluating` | He is questioning whether the architecture is right; possibly considering changes. Active questioning, agency present. |
| `transitioning` | A change is happening or imminent: career, relationship, geography, health. |
| `settled` | The architecture works; he is not trying to change it. At-rest contentment. |
| `drifting` | The architecture works in the sense that nothing forces a change; he is not sure it is right. No active direction. |
| `enduring` | The architecture is in place and he is sustaining it under load. Not drifting (there is direction and responsibility), not settled (there is no contentment), not transitioning (no change is happening), not re-evaluating (no active questioning, no agency to question). He is carrying what he carries. |

**Architectural note on `enduring`.** This value names the depleted-but-pinned-by-obligation shape. It is distinct from `settled` (at-rest) because there is no rest, distinct from `drifting` (no direction) because there is direction, and distinct from `consolidating` (active deepening) because there is no active anything. The man who is keeping the show on the road and has been doing so for years.

The synthesis layer composes `enduring × life_shape_duration: long × life_texture_band: depleted` as a distinctive shape with its own prose treatment. See `SYNTHESIS.md` for the composition.

#### 3.4.4 psychological_filtering

Value space:

- `does_not_filter`: the man does not run wants through a justification check before acting on them. Wants either act or are suppressed for other reasons (energy, structure, permission). The cognitive filter habit is absent.
- `filters_some`: the man filters some categories of want, typically wants that read as frivolous, impractical, or non-functional. He still acts on wants that pass his filter; he does not act on wants that read as silly. The filter operates selectively.
- `filters_pervasively`: most wants run through justification. He typically arrives at "I do not need that" or "that is not me anymore" before the want acts. The filter operates almost unconsciously and most prospective wants do not make it past it.

**Architectural concept.** The cognitive habit of utility-checking desire before letting it become action or articulation. Distinct from energy (does he have bandwidth to act); distinct from permission (is acting allowed structurally or socially); distinct from suppression at the pull-quality level (is the want being externally dampened). It reads what he does with wants between their first surfacing and their potential action.

**Validity rule.** See §3.1 rule 10.

**Elicitation discipline.** Self-perception on this dimension is unreliable. A man who filters pervasively may experience "I do not really want anything" as truth rather than as the output of a filter. The questionnaire surface (specified in `RENDER.md`) needs indirect elicitation. The recommended approach: ask about specific recent wants and what happened to them rather than asking "do you filter wants." Triangulation from two-to-three indirect questions is more reliable than a direct question.

#### 3.4.5 role_consolidation

Value space:

- `holds_other_selves`: the man recognises and holds multiple versions of himself. The role is something he does, not who he is across contexts. Behaviour outside work-or-primary-role-context is differently shaped from inside it.
- `role_inflected`: the role colours how he is across contexts, but is not the entirety. He plays the role at work; he is partly the role at home; there are facets that are still separately his.
- `role_consolidated`: the role has become him across contexts. Behaviour aligns to role-expectation continuously; he experiences himself as the role. Other versions of himself are not present in his self-experience.

**Architectural concept.** The degree to which his self-experience is colonised by his role. Distinct from `paid_work_relationship` (which reads work-as-defining versus work-as-functional structurally) and from `life_stage` (which reads the architecture's stability). It reads what is true of him as a person across contexts, not what is true of his structural position.

**Validity rule.** See §3.1 rule 11.

**Interaction with existing fields.** Composes with `paid_work_relationship` and `life_stage`. A man with `paid_work_relationship = defining` AND `role_consolidation = holds_other_selves` reads architecturally differently from one with `paid_work_relationship = defining` AND `role_consolidation = role_consolidated`. The first has the structural state of identity-defining-work but holds breadth elsewhere; the second is colonised across.

**Elicitation discipline.** Like `psychological_filtering`, hard to self-report. A man who is role-consolidated may experience "this is who I am" as truth rather than as colonisation. Recommended elicitation: ask about specific cross-context behaviours (does he behave differently with old friends than at work; does he wear different clothes off-duty; does he make different choices in different settings) rather than asking about role.

#### 3.4.6 attention_pattern

Value space:

- `engaged`: attention is on the interaction or activity he is in. He notices texture; he has felt moments; even within a routine, there is some quality of being-in-it.
- `intermittent`: attention is sometimes on, sometimes on autopilot. He recognises moments where he came back to himself or noticed something. Other times he is operating without noticing.
- `autopilot`: attention is patterned away from self-and-environment toward task-and-responsibility. He moves through days without much registering. He recognises this when prompted; the recognition is the exception.

**Architectural concept.** The texture of his attention as a habit. Distinct from the `felt_aliveness` domain (which reads the outcome of attention plus other factors like depletion and structure) and from energy (which reads bandwidth-for-action). It reads what his attention is doing when he is moving through ordinary time.

**Validity rule.** See §3.1 rule 12.

**Single cross_direction placement.** Attention varies per-context (work, home, chosen activity, domestic) but not per-direction (modes of aliveness). Mapping attention to directions would conflate two distinct architectural concepts. If per-context attention is wanted downstream, that requires a separate structured field, not a per-direction extension.

**Elicitation discipline.** Self-perception is the hardest of the four narrowing inputs because autopilot by definition is not self-registered. Recommended elicitation: ask about recent specific moments (recent commute, recent meal, recent conversation) and what he remembers of the texture, not "are you on autopilot." Indirect elicitation may produce a more reliable reading than direct.

#### 3.4.7 relational_presence

Value space:

- `present`: when he is with others, he is with them. Attention is on the interaction; he is not scanning, managing, or elsewhere. Most of his significant relationships have moments of full presence.
- `partial`: sometimes present, often managing. Depends on the relationship and the day. He recognises moments of being-in-it but they are not the default.
- `mostly_absent`: even in relationships that are nominally close, he is operating, managing, scanning. He recognises this when prompted; he does not usually catch himself in it.

**Architectural concept.** The quality of his presence in the relationships he has. Distinct from contact (who is around, read by `sociality_default`, `sees_people`, `belongs_to_group`) and depth (how rich the relationships are, read by the four relational domains). It reads what he brings to the relationships, not what the relationships are.

**Validity rule.** See §3.1 rule 13.

**Elicitation discipline.** A man who is mostly_absent may experience his relationships as fine, functional, "we catch up." Recommended elicitation: ask about specific recent interactions and where his attention was during them, what he can recall of the texture, rather than asking about relational presence as a concept.


### 3.5 Per-domain variables

Three variables per domain. With 12 domains, this is 36 per-domain variable values. Of these, 4 are defaulted rather than elicited (see the wanting row below), so 32 are actually elicited.

| Variable | Type | Values | Default | Definition |
|---|---|---|---|---|
| **current_state[domain]** (L1) | continuous | 0-100 | none | How present this domain is in his life now. Domain-specific framing per domain. |
| **past_presence[domain]** (L2) | binary | Yes / No | none | Was this domain ever a real part of his life at some point in the past. |
| **wanting[domain]** (L3) | binary | Wants / Doesn't want | Wants for the four universal-wanting domains (Time as yours, Energy as resource, Felt aliveness, Body/physical aliveness); none for the other eight (must be elicited, including for the spiritual domain) | Does he want this domain present in his life. |

The wanting default for the four universal-wanting domains is the single exception to "every man answers every question." The data structure carries the wanting field for all 12 domains; the instrument simply does not ask the four where the answer is structurally Wants. The convention does not extend to the spiritual domain: wanting is elicited explicitly there.

#### 3.5.1 The spiritual domain

The `domains` block reads a twelfth domain alongside the existing eleven (`time_as_yours`, `energy_as_resource`, `felt_aliveness`, `body_physical_aliveness`, `curiosity`, `making`, `conversation_depth`, `being_known`, `friendship`, `intimacy`, `mattering`).

The twelfth domain: `spiritual`.

Domain entry shape, matching the canonical `PerDomainInputs` exactly:

```
spiritual: {
    current_state: integer in [0, 100],
    past_presence: "yes" | "no",
    wanting: "wants" | "doesnt_want"
}
```

The shape conforms to the canonical `PerDomainInputs` (per validity rule 1 and rule 14). Under the strict reading of this axis (see lock-time note below), no `unknown` value is required; the negative branches (`past_presence == no` for the historical question, `wanting == doesnt_want` for the current question) carry the architectural information that an `unknown` value would otherwise carry. The questionnaire surface (specified in `RENDER.md`) generates yes/no answers; the spiritual domain processes through the existing §5.2 domain pipeline with no special-casing.

**Architectural concept.** The felt sense of contact with something beyond the immediate. For some men this is religious in a specific tradition. For others it is contemplative practice without theology, felt presence in nature, sustained engagement with the questions about mortality and meaning, or some texture of inward life that is not easily named. Not social belonging or institutional membership; those dimensions are read by `belongs_to_group`, `sees_people`, the `Contribution` direction, and the `mattering` domain. The `spiritual` domain reads a distinct axis.

The domain is unusual among the twelve in that its presence-or-absence as a salient axis is itself a meaningful architectural reading. Many men have no relationship to a felt larger frame and have never had one; their meaning comes from specific people and activities. The existing domain `value` enum (`intact`, `reduced_wants_back`, `reduced_at_peace`, `wants_but_never_had`, `never_been_part_of_his_life`) accommodates this naturally:

- Active and intact: `intact`
- Once present, has narrowed, wants it back: `reduced_wants_back`
- Once present, has narrowed, at peace with the loss: `reduced_at_peace`
- Aspirational but never present: `wants_but_never_had`
- Not salient and never has been: `never_been_part_of_his_life`

The `never_been_part_of_his_life` value will fire more often for `spiritual` than for any other domain. This is architecturally correct, not a calibration concern. The synthesis layer's domain-template machinery (see `SYNTHESIS.md`) handles this value as one of its standard variants.

**Strict reading of this axis.** The spiritual axis reads self-identified religious or spiritual orientation. The production test is whether the man would say "I am religious" or "I am spiritual." The source can be anything (any tradition, his own private frame), but he has to self-identify as on that axis. A man with a workshop, a photography practice, contemplative reading, or careful walking would not register positively on a question asking whether he is religious or spiritual; he would say "no, that's not me, I just like making things." Downstream specs inherit this strict reading for term explanation and questionnaire wording.

**Validity.** See §3.1 rule 14.

**Elicitation discipline.** Like the four narrowing inputs, self-perception is unreliable. The questionnaire surface needs indirect elicitation. Recommended approach: ask about specific contemplative experiences, religious or philosophical engagement, moments of being-part-of-something-larger, rather than asking "do you have a spiritual side." Triangulation from indirect questions; one direct question is unlikely to produce a reliable `current_state` value.

### 3.6 Realistic constraints variables

Five variables, one per man.

| Variable | Type | Values | Default | Definition |
|---|---|---|---|---|
| **energy_availability** (R1) | continuous | 0-100 | none | How much energy he has beyond what obligations take. Higher = more available. |
| **time_availability** (R2) | continuous | 0-100 | none | How much time isn't already accounted for by obligations. Higher = more available. |
| **body_capacity** (R3) | continuous | 0-100 | none | What his body can do now relative to what it could do at full capacity. Higher = fuller. |
| **permission** (R4) | continuous | 0-100 | none | Whether he feels he has permission to act on what he wants. Higher = more permission. |
| **permission_sub_shape** (R4a) | categorical (4) | Present / Want-block / Say-block / Act-block | present (when no block applies) | Which kind of permission block. want-block: doesn't even let himself want. say-block: wants but won't say. act-block: wants and says but won't act. present: no block. Read for every man; the value "present" is the answer when no block applies. |

### 3.7 Cross-cutting variables

Three variables, one per man.

| Variable | Type | Values | Default | Definition |
|---|---|---|---|---|
| **recent_life_shape_change** (X1) | binary | Yes / No | none | Has a major shape (work, primary role, caregiving) ended in the last roughly 1-3 years. |
| **replacement_structure_exists** (X2) | binary | Yes / No | none (only meaningful when recent_life_shape_change = Yes; if recent_life_shape_change = No, replacement_structure_exists is ignored by 4.1 scoring) | Has a new shape filled the structural void left by the change in recent_life_shape_change. |
| **recent_reaching** (X4) | categorical (4) | Recent-and-awkward / Mid-stream / Long-established / No-current-reaching | none | Whether movement on currently-active directions is recent and awkward, mid-stream, long-established, or whether he has no current reaching. The "No-current-reaching" value preserves the no-conditional-questions principle. |

### 3.8 Variable counts

| Group | Count |
|---|---|
| Per-direction (10 vars × 6 directions) | 60 |
| Cross-direction (12 vars) | 12 |
| Per-domain (3 vars × 12 domains) | 36 |
| Realistic constraints (energy_availability, time_availability, body_capacity, permission, permission_sub_shape) | 5 |
| Cross-cutting (recent_life_shape_change, replacement_structure_exists, recent_reaching) | 3 |
| Self-report (named_absences array of 0-3 item IDs) | 1 |
| **Total elicited input fields** | **118** |

Of the 36 per-domain variables, 4 are defaulted (wanting for the universal-wanting domains), so the effective elicitation count is 114. Derived variables (sustained_constraint_intensity, pull[d], movement[d], life_texture_band, expression_space[d], the seven narrowing bands) are not counted as input variables.

The `cross_direction.week_shape` field expands to 9 booleans, so although it counts as 1 cross-direction variable in the table above, the questionnaire elicits 9 separate flag answers. Similarly, the self-report field is a single array but elicits up to 3 selections.

---

## 4. Derivations

Some values used by the scoring functions are not directly elicited; they are computed from input variables.

would_reach_for (D7a) is also derived (from direction_chosen (D7b), per the rule in section 5.1), but because would_reach_for appears in the InputMap as a per-direction input, its derivation rule is stated where it is consumed (5.1) rather than here.

### 4.1 sustained_constraint_intensity (G3)

Computed from energy_availability (R1), time_availability (R2), body_capacity (R3), and permission (R4). The four R-inputs are availability scores (higher = more available); sustained_constraint_intensity is intensity of constraint (higher = more constrained), so the formula reads (100 minus the availability score) for each.

```
sustained_constraint_intensity = 0.20 * (100 - energy_availability)
                               + 0.20 * (100 - time_availability)
                               + 0.15 * (100 - body_capacity)
                               + 0.45 * (100 - permission)
```

permission carries highest weight because sustained Permission constraint is most associated with Suppressed pull. **Weights are first pass, calibration required.**

### 4.2 pull[d] (per direction)

Triangulated across five inputs.

```
pull[d] = 0.30 * stated_strength[d]
        + 0.20 * felt_cost[d]
        + 0.20 * anticipation[d]
        + 0.20 * recent_action[d]
        + 0.10 * specificity[d]
```

Where anticipation (D2a), recent_action (D3a), and specificity (D5) use their categorical-to-numeric mappings (None/Mild/Quickening = 0/50/100; None/Some/Recent = 0/50/100; None/Partial/Strong = 0/50/100). stated_strength (D1) and felt_cost (D2) are continuous 0-100. **Weights are first pass, calibration required.**

### 4.3 movement[d] (per direction)

```
movement[d] = current_movement[d]
```

Identity. movement is the engine-output-facing name; current_movement (D3) is the input variable name. Both are kept for vocabulary clarity.

### 4.4 life_texture_band

A system-level derivation summarising `week_shape` for synthesis consumption.

**Inputs.** `cross_direction.week_shape`.

**Definition.** Banded into four values reflecting the joint state of texture and load.

```
The texture flags are the six contents flags:
    weekly_activity, sees_people, makes_things,
    active_body, belongs_to_group, solo_practice

The load flags are the two pressure flags:
    work_dominates, weekends_consumed

The pattern flag varied_week is not included in this derivation.
It is read separately by synthesis (§4.5 and synthesis spec).

texture_count   = number of texture flags set to true (range 0-6)
pressure_count  = number of load flags set to true (range 0-2)

life_texture_band:
    "empty"     if texture_count == 0 AND pressure_count == 0
    "depleted"  if texture_count == 0 AND pressure_count >= 1
    "mixed"     if 1 <= texture_count <= 3
    "textured"  if texture_count >= 4
```

**Count semantics.** The count is over flags, not over distinct conceptual categories. A man with both `weekly_activity` and `belongs_to_group` set to true (a man whose weekly activity is the group he belongs to) contributes 2 to `texture_count`, not 1. The architecture deliberately reads breadth of flagged texture rather than orthogonality of categories.

A consequence: a man can reach `textured` band with four flags ticked even if some flags conceptually overlap. This is the right behaviour. The bands name observable density of texture; conceptual overlap is the question designer's problem, not the engine's.

**Band semantics (for synthesis):**

| Band | Architectural reading |
|---|---|
| `empty` | His week contains essentially nothing: not pressure, not texture. Two distinct shapes land here: post-disengagement (retired, between jobs, grief-shaped, withdrawn) and pre-articulation (reaching but not yet landed; direction and pull are present, but no week-shape evidence of expression yet). Synthesis composes which shape is being read from companion signals (recent_reaching, pull patterns, life_shape_duration). |
| `depleted` | His week is absorbed by load with no texture inside the gaps. The "work + chores + asleep on the sofa" pattern. |
| `mixed` | Some texture; week neither blank nor full. The band reads the same for a man with `varied_week: true` and a man with `varied_week: false`; synthesis distinguishes these shapes via the raw flag (see §8). |
| `textured` | His week contains substantial texture across multiple dimensions. |

**Threshold note.** The cutoffs (0, 1, 3, 4 with respect to the 6-flag space) are first pass, calibration required. A six-flag texture space with a 4+ "textured" threshold means a textured man has at least two-thirds of his contents flags ticked, which is a high bar by design. The intent is for `textured` to read as a real architectural shape, not as "doing two things alongside work."

### 4.5 expression_space[d] (per direction)

A per-direction derivation reading whether the man's week has room for direction `d` to express itself.

**Inputs.** `cross_direction.week_shape`.

**Definition.** Per direction `d`, `expression_space[d]` is a boolean computed from a per-direction mapping of week_shape flags.

```
expression_space[d] = true if any of d's mapped flags is true, else false

Mapping per direction:

Creator        -> makes_things
Relationship Rebuilder  -> sees_people
Experience Seeker    -> weekly_activity AND varied_week
Freedom Designer       -> solo_practice OR (NOT work_dominates AND NOT weekends_consumed)
Growth Focused        -> active_body OR weekly_activity
Contributor  -> belongs_to_group OR sees_people
```

**Computation rule.** `expression_space[d]` is computed unconditionally for every direction, regardless of whether `d` surfaces or fires. The boolean is always present in `DirectionOutput.expression_space` (§6.1).

Synthesis predicates that read `expression_space[d]` gate on direction firing themselves; the engine does not gate the derivation. This matches the pattern the engine uses elsewhere for unconditional emission of structural outputs (for example, `pull_quality` is computed and emitted even when its precondition fails; it emits as an empty array, and synthesis predicates read it conditionally).

Beyond synthesis prose composition, `expression_space[d]` is also read by the experience-layer recommendation algorithm and by synthesis predicates that compose readings across non-firing directions (for example, naming the absence of expression for a direction whose pull is below threshold but whose past_presence is yes). These downstream consumers require `expression_space` for non-firing directions, which is why the derivation is unconditional rather than gated on direction firing in the engine.

**Per-mapping notes.**

- **Making → `makes_things`.** Direct: visible making in the week is expression of the Making direction. No alternative flag substitutes.
- **Relationship → `sees_people`.** Direct: regular in-person contact is expression of the Relationship direction. The flag deliberately reads contact with people outside the household; intra-household relationship dynamics are not captured here and are not the architectural target of `expression_space` for Relationship.
- **Experience → `weekly_activity AND varied_week`.** Both required. A man with `weekly_activity = true` but `varied_week = false` has activity, but it's the same activity every week, which is not Experience-direction expression. Experience needs range, not just occurrence. The conjunction encodes this architectural truth in the engine layer rather than only in synthesis prose.
- **Freedom → `solo_practice OR (NOT work_dominates AND NOT weekends_consumed)`.** Two routes. The man has Freedom expression if he has a chosen solo practice (he is making time for himself by structure), OR if his time is not absorbed by load (he has free time available even without a named practice). Either reads as Freedom-direction expression.
- **Growth → `active_body OR weekly_activity`.** Two routes. Growth in this architecture reads as challenge and being tested, not as study or improvement. Body in motion is one route (the body is the testing surface). A weekly activity that is a real commitment (a class, a team, a project) is another route. Either suffices.
- **Contribution → `belongs_to_group OR sees_people`.** Two routes. Contribution requires a context to contribute to. A group provides that context. Regular in-person contact does too, at smaller scale (helping one person regularly is contribution). Either suffices.

**Threshold note.** The mappings above are first pass, calibration required. Fixture authoring is the verification: if a fixture's direction reads as firing-with-expression but the profile clearly has no real expression of that direction, the mapping is wrong. Revise the mapping rather than forcing the fixture.


### 4.6 Narrowing bands

Seven derivations, one per narrowing type. Each derivation produces a value in the enum `low | moderate | high`. Each band reads composition rules over existing engine outputs plus the new inputs introduced in §3.4.4 through §3.4.7.

The bands are emitted as fields on `EngineOutput.cross_direction`:

```
cross_direction.structural_narrowing_band:    "low" | "moderate" | "high"
cross_direction.experiential_narrowing_band:  "low" | "moderate" | "high"
cross_direction.psychological_narrowing_band: "low" | "moderate" | "high"
cross_direction.identity_narrowing_band:      "low" | "moderate" | "high"
cross_direction.energetic_narrowing_band:     "low" | "moderate" | "high"
cross_direction.relational_narrowing_band:    "low" | "moderate" | "high"
cross_direction.attention_narrowing_band:     "low" | "moderate" | "high"
```

**Convention note for §4.6 band rules.** By the existing domain convention (per §5.2), `domain.fires == true` means the domain reads as reduced (its `current_state` is below its firing threshold). `domain.fires == false` means the domain is intact. The band rules below use `fires == true` to read "reduced" and `fires == false` to read "intact." This convention is consistent across all band derivations in §4.6.

Each band's composition rule is deterministic. Each input is named explicitly. Each threshold is explicit. All numeric thresholds in §4.6 are **first pass, calibration required.**

#### 4.6.1 structural_narrowing_band

Inputs:

- `load_flag_count` = count of `week_shape.work_dominates` and `week_shape.weekends_consumed` that are true. Range: 0, 1, or 2.
- `cross_direction.primary_load`: value of the primary_load field.
- `constraints.time.band`: value of the time constraint band.
- `constraints.permission_sub_shape`: value of the permission_sub_shape field.
- `cross_direction.life_stage`: value of the life_stage field.
- `cross_direction.life_shape_duration`: value of the life_shape_duration field.

Composition rule:

```
high
  if load_flag_count == 2
     AND time.band == heavy_time_pressure
     AND primary_load in {paid_work, caregiving, household_admin}
     AND (permission_sub_shape == act_block
          OR (life_stage == enduring AND life_shape_duration == long))

moderate
  if (load_flag_count >= 1
      AND time.band in {moderate, heavy_time_pressure}
      AND primary_load != none)
     OR (NOT high)
     AND (load_flag_count >= 1 OR primary_load != none)

low
  if load_flag_count == 0
     AND time.band == open
     AND primary_load == none
```

Default: `moderate`. If neither high nor low predicates fire, the band is moderate.

#### 4.6.2 experiential_narrowing_band

Inputs:

- `contents_flag_count` = count of `week_shape.weekly_activity`, `week_shape.sees_people`, `week_shape.makes_things`, `week_shape.active_body`, `week_shape.belongs_to_group`, `week_shape.solo_practice` that are true. Range: 0 to 6.
- `cross_direction.week_shape.varied_week`: boolean.
- `cross_direction.life_texture_band`: value of life_texture_band derivation (computed in §4.4).
- `direction.experience.pull`: numeric.

Composition rule:

```
high
  if life_texture_band in {empty, depleted}
     AND contents_flag_count <= 1
     AND varied_week == false
     AND direction.experience.pull < 30

moderate
  if varied_week == false AND (
     life_texture_band == mixed
     OR (contents_flag_count between 2 and 3)
     OR (direction.experience.pull < 50))

low
  if life_texture_band == textured
     OR contents_flag_count >= 4
     OR varied_week == true
```

Precedence: high takes priority over moderate; moderate takes priority over low. If multiple predicates fire across bands, the highest band wins.

**Rationale for the moderate predicate's `varied_week == false` precondition.** Factoring `varied_week == false` as a precondition on the moderate clauses ensures that when `varied_week == true` (the architectural signal for experiential variety), only the low predicate can fire; moderate is gated off. Without the precondition, moderate clauses (mixed life_texture_band, contents in 2-3) could fire alongside low when varied_week=true, producing a precedence conflict that contradicts the intent: a man with a varied week reads as experientially low-narrowed regardless of whether his life_texture_band reads as mixed.

#### 4.6.3 psychological_narrowing_band

Inputs:

- `cross_direction.psychological_filtering`: value of the input from §3.4.4.
- `constraints.permission_sub_shape`: value (canonical placement under `constraints`).
- `direction_specificity_none_count` = count of directions where `direction.specificity == none`. Range: 0 to 6.
- `direction_suppressed_count` = count of directions where `direction.pull_quality` contains `"suppressed"`. Range: 0 to 6.
- `domains.curiosity.fires`: boolean.

Composition rule:

```
high
  if psychological_filtering == filters_pervasively
     OR permission_sub_shape == want_block
     OR (direction_specificity_none_count >= 4
         AND psychological_filtering == filters_some)

Note: The third clause uses filters_some only; filters_pervasively is already covered by the first clause, so including it here would be redundant.

moderate
  if psychological_filtering == filters_some
     OR (permission_sub_shape == say_block AND direction_suppressed_count >= 2)
     OR domains.curiosity.fires == true
     OR (direction_specificity_none_count >= 3
         AND psychological_filtering == does_not_filter)

low
  if psychological_filtering == does_not_filter
     AND permission_sub_shape != want_block
     AND direction_specificity_none_count < 3
```

Default: `moderate`. If neither high nor low fires, moderate.

**Rationale.** The high-band predicate requires either pervasive filtering, want_block permission, or a strong outcome signal (4 or more directions with specificity-none-and-would-not-reach-for) combined with at least some filtering activity. The third clause prevents outcome-only fires that conflate psychological narrowing with structurally-or-energetically produced narrowed outcomes. The moderate band absorbs the cases the prior threshold would otherwise over-fire into high (specifically: a man with 3 or more directions of specificity-none-and-would-not-reach-for AND `psychological_filtering == does_not_filter` reads moderate, not high; outcome present but mechanism absent).

#### 4.6.4 identity_narrowing_band

Inputs:

- `cross_direction.role_consolidation`: value of the input from §3.4.5.
- `cross_direction.paid_work_relationship`: value.
- `cross_direction.life_stage`: value.
- `cross_direction.life_shape_duration`: value.

(`recent_life_shape_change` is not consumed by this composition rule. Its canonical placement is under `cross_cutting`, not `cross_direction`. If a future calibration round determines the field should feed identity narrowing, both the inputs list and the composition rule are updated at that time.)

Composition rule:

```
high
  if role_consolidation == role_consolidated
     OR (paid_work_relationship == defining
         AND role_consolidation in {role_inflected, role_consolidated})

moderate
  if role_consolidation == role_inflected
     OR (paid_work_relationship in {defining, consuming, endured}
         AND life_stage == enduring
         AND life_shape_duration == long)

low
  if role_consolidation == holds_other_selves
     AND (paid_work_relationship not in {defining}
          OR life_stage in {transitioning, re_evaluating, drifting, building})
```

Default: `moderate`.

#### 4.6.5 energetic_narrowing_band

Inputs:

- `constraints.energy.band`: value of energy constraint band.
- `constraints.body.band`: value of body capacity band (`full`, `shifted`, `limited`), banded as in §5 (70/40 cutoffs).
- `domains.felt_aliveness.fires`: boolean.
- `domains.energy_as_resource.fires`: boolean.
- `cross_direction.life_texture_band`: value.

Composition rule:

```
high
  if constraints.energy.band == heavy_depletion
     AND domains.felt_aliveness.fires == true
     AND domains.energy_as_resource.fires == true

moderate
  if (constraints.energy.band == moderate
      AND (domains.felt_aliveness.fires == true
           OR domains.energy_as_resource.fires == true))
     OR life_texture_band == depleted
     OR (constraints.body.band == limited
         AND domains.felt_aliveness.fires == false)

low
  if constraints.energy.band == full
     AND domains.felt_aliveness.fires == false
     AND constraints.body.band != limited
```

Default: `moderate`.

Rationale. The band now reads physical-capacity decline alongside energy-bandwidth and aliveness, so that a man whose physical instrument has dimmed registers as energetically narrowed even when his self-reported energy bandwidth is intact. The body-capacity contribution is conjunctive: `constraints.body.band == limited` only contributes when paired with `domains.felt_aliveness.fires == false` (the new moderate clause), and `constraints.body.band == limited` blocks the low reading. The conjunction is the point. Normal age-related shifted capacity is a common baseline in a 50s to 60s cohort and must not by itself read as narrowing; the band only escalates when limited capacity coincides with dimmed aliveness, which is the reading we want for the target cohort. Interoception is not modelled (no input exists; out of scope).

Thresholds and composition are first pass, calibration required (consistent with §4.6 and §8).

#### 4.6.6 relational_narrowing_band

Inputs:

- `relational_domains_reduced_count` = count of `friendship`, `intimacy`, `conversation_depth`, `being_known` domains where `fires == true`. Range: 0 to 4.
- `cross_direction.sociality_default`: value.
- `cross_direction.week_shape.sees_people`: boolean.
- `cross_direction.week_shape.belongs_to_group`: boolean.
- `cross_direction.relational_presence`: value of the input from §3.4.7.

Composition rule:

```
high
  if relational_domains_reduced_count >= 3
     AND (week_shape.sees_people == false
          OR relational_presence == mostly_absent)

moderate
  if relational_domains_reduced_count between 1 and 2
     OR relational_presence == partial
     OR (week_shape.sees_people == false AND relational_domains_reduced_count >= 1)

low
  if relational_domains_reduced_count == 0
     AND relational_presence == present
```

Default: `moderate`.

The single composite band reads overall relational narrowing intensity. Synthesis and experience layers downstream may differentiate contact-and-depth narrowing from presence-quality narrowing by reading the underlying inputs (the four relational domains plus `sees_people` for contact-and-depth; `relational_presence` for presence-quality) rather than reading the band alone.

#### 4.6.7 attention_narrowing_band

Inputs:

- `cross_direction.attention_pattern`: value of the input from §3.4.6.
- `domains.felt_aliveness.fires`: boolean.
- `cross_direction.week_shape.varied_week`: boolean.
- `direction.experience.pull`: numeric.

Composition rule:

```
high
  if attention_pattern == autopilot
     AND domains.felt_aliveness.fires == true

moderate
  if attention_pattern == intermittent
     OR (attention_pattern == autopilot AND domains.felt_aliveness.fires == false)
     OR (attention_pattern == engaged AND domains.felt_aliveness.fires == true)

low
  if attention_pattern == engaged
     AND domains.felt_aliveness.fires == false
```

Default: `moderate`.

The `attention_pattern × felt_aliveness` composition produces the architecturally significant distinction: autopilot-with-reduced-aliveness reads as attention narrowing's signature (high), while engaged-with-reduced-aliveness reads as attention-intact-but-aliveness-reduced-for-other-reasons (low). The intermediate cases land at moderate.

#### 4.6.8 Determinism and computation order

All seven bands are computed deterministically from the inputs named in each rule. No band reads any other band; the seven derivations are independent of each other. The bands compose from `cross_direction` inputs (existing plus new), from existing direction outputs, from existing domain outputs, from existing constraint outputs, and from existing v3 derivations (`life_texture_band` specifically).

The seven derivations are pure functions. Given the same InputMap, they always produce the same band values. They do not read any synthesis-layer output, do not depend on randomisation, do not have side effects.

See §7 for computation-order placement.

---

## 5. Scoring Functions

How each engine output is computed from input variables and derivations.

All numeric thresholds in this section are **first pass, calibration required.**

**Note on numbering.** Within sections 5, 6, and 7, references of the form "4.1" or "3.1" refer to constraint and cross-cutting *output* indices, not document section numbers. Document sections are referred to explicitly as "section X.Y" (e.g. "section 4.1" for the sustained_constraint_intensity derivation, distinct from constraint output 4.1 "Between shapes"). The collision is unfortunate but established.

### 5.1 Signal 1, Direction

#### stated_allocation (B1) elicitation pattern (the £70/three-slot question)

stated_allocation across all six directions is read in a single question: "If you had £70 to put toward the directions that matter to you, how would you split it? You can allocate to up to three directions, from 0 to 70 each. The total must not exceed 70." The man allocates across up to 3 of the 6 directions, totalling 70 or less.

The £70 figure is deliberately not £100; it reads as a specific sum rather than as obvious proportions, encouraging real consideration over reflexive percentage-thinking. The architecture normalises the allocations to a 0-100 scale via the formula £X/70×100 (for example, £35 of £70 normalises to 50, £40 of £70 normalises to approximately 57). stated_allocation for the chosen directions is the normalised value; stated_allocation for the unchosen directions is 0.

stated_allocation feeds only phantom detection (the Phantom branches and precondition (a)). It does not feed stated_strength or pull. stated_strength is derived by the assembler from the per-direction card observations (anticipation, current_movement, and specificity), not from the £70 question.

#### would_reach_for (D7a) and direction_chosen (D7b) elicitation pattern (the free-time forced-choice question)

A separate question presents concrete behavioural options for what he would reach for given free time. Each option maps to one of the eight direction_chosen values. From his choice, would_reach_for (per direction) and direction_chosen (cross-direction) are derived.

**Placeholder option set and mapping** (final option wording and mapping require joint work between question design and scoring; see honest concerns):

| Option (placeholder wording) | direction_chosen value |
|---|---|
| Work on something of your own | creator |
| Spend time with someone close | relationship_rebuilder |
| Try or learn something new | experience_seeker |
| Do something physical or that tests you | growth_focused |
| Help out where you'd want to | contributor |
| Take time alone with no obligations | freedom_designer |
| Rest or do nothing in particular | Rest |
| (no clear answer) | None |

would_reach_for is derived from direction_chosen: would_reach_for[d] = Yes for the chosen direction d, would_reach_for[d] = No for all other directions (including when direction_chosen = Rest or None).

#### Pull (per direction)

See 4.2.

#### Movement (per direction)

See 4.3.

#### Quadrant (per direction)

```
Active   if pull[d] >= 50 and movement[d] >= 50
Blocked  if pull[d] >= 50 and movement[d] < 50
Habit    if pull[d] < 50  and movement[d] >= 50
Quiet    if pull[d] < 50  and movement[d] < 50
```

#### Past relationship dimension (per direction)

Derived from past_presence (D4) and Pull. Four values.

```
Returning                if pull[d] >= 50 and past_presence[d] = Yes
New                      if pull[d] >= 50 and past_presence[d] = No
Was once                 if pull[d] < 50  and past_presence[d] = Yes
Never been part of life  if pull[d] < 50  and past_presence[d] = No
```

The "Was once" value renders only when the corresponding Domain presence output for the direction fires (Reduced wants back, Reduced at peace, Wants but never had, or Never been part of his life). The direction-to-domain mapping for "Was once" rendering:

| Direction | Corresponding Domain presence outputs | Render rule |
|---|---|---|
| Freedom | Time as yours | "Was once" renders when Domain presence fires for Time as yours |
| Making | Making (domain) | "Was once" renders when Domain presence fires for the Making domain |
| Experience | Curiosity, Felt aliveness | "Was once" renders when Domain presence fires for either Curiosity or Felt aliveness |
| Relationship | Conversation depth, Being known, Friendship, Intimacy | "Was once" renders when Domain presence fires for any of these four |
| Growth | (no direct domain pair) | "Was once" renders when past_presence[d] = Yes and pull[d] < 50, unconditionally |
| Contribution | Mattering | "Was once" renders when Domain presence fires for Mattering |

#### Specificity dimension (per direction)

The Specificity output dimension is the specificity (D5) input variable directly, no computation.

```
Specificity[d] = specificity[d]
```

Three values: None / Partial / Strong.

#### Pull quality (per direction)

The Pull quality output uses a multi-valued data structure that permits co-firing where conditions overlap. **In practice the rules below produce a single value per direction.**

**Precondition.** Pull quality computes for direction d if either of these holds. The deep-suppression precondition (b) reads sustained_constraint_intensity (G3) and life_shape_duration (G4).

```
(a)  pull[d] >= 30 OR stated_strength[d] >= 50 OR stated_allocation[d] >= 30   (standard precondition)
(b)  stated_strength[d] < 50 AND past_presence[d] = Yes AND sustained_constraint_intensity >= 70 AND life_shape_duration = Long  (deep-suppression precondition)
```

If neither holds, Pull quality does not fire for direction d.

If only (b) holds, only the deep sub-branch of Suppressed is evaluated. The standard sub-branch of Suppressed and all other Pull quality branches are skipped.

If (a) holds (whether or not (b) also holds), all branches are evaluated:

```
Saturated   if saturation[d] = Yes

Phantom     if all of:
              stated_allocation[d] >= 50
              felt_cost[d] < 30
              anticipation[d] in {None, Mild}
              recent_action[d] = None
              would_reach_for[d] = No
              past_presence[d] = No
              sustained_constraint_intensity < 50

Phantom (partial)  if all of:
              35 <= stated_allocation[d] < 50
              felt_cost[d] < 30
              anticipation[d] in {None, Mild}
              recent_action[d] = None
              would_reach_for[d] = No
              past_presence[d] = No
              sustained_constraint_intensity < 50

Suppressed  if either of:
              standard branch:
                stated_strength[d] < 50
                AND (felt_cost[d] >= 50 OR anticipation[d] = Quickening)
                AND past_presence[d] = Yes
                AND sustained_constraint_intensity >= 60
                AND life_shape_duration in {Sustained, Long}
              deep branch:
                stated_strength[d] < 50
                AND past_presence[d] = Yes
                AND sustained_constraint_intensity >= 70
                AND life_shape_duration = Long

Behaviourally divergent  if all of:
              stated_strength[d] >= 60
              direction_chosen is in {a direction other than d, Rest}
              AND NOT (Phantom fires for d)
              AND NOT (Phantom (partial) fires for d)
              (direction_chosen = None does not fire this branch)

Ghost       if all of:
              anticipation[d] = Quickening
              AND specificity[d] = Strong
              AND d is NOT in {direction_chosen, reach_retrospective, reach_counterfactual}
              AND reach_retrospective is defined
              AND reach_counterfactual is defined
              (felt_cost does not enter this condition)

Real        if none of the above branches fire and the precondition was satisfied
```

**Ghost label and live-pull rule.** A ghost-labelled direction is excluded from presentation: it does not set surfaced=true on pull alone and does not rank as a top direction. Its raw pull is preserved for synthesis. Any pull consumer classified as presentation uses live-pull (ghost suppressed); synthesis reads raw pull.

#### Pull state (per direction)

Multi-valued. Multiple values may co-fire on the same direction.

```
Held attributed with expression   if specificity[d] = Strong AND expression_space[d] = true

Held attributed unexpressed       if specificity[d] = Strong AND expression_space[d] = false

Stopped expecting                 if stopped_expecting[d] = Yes

Capacity strain                   if capacity_strain = Yes AND pull[d] >= 50
```

**Mutual exclusion.** `Held attributed with expression` and `Held attributed unexpressed` are mutually exclusive. Exactly one fires when `specificity[d] = Strong`; neither fires otherwise. The other two Pull state values (`Stopped expecting`, `Capacity strain`) are independent and can co-fire with either held-attributed value or with each other.

**Rationale for the held_attributed split.** The two states are architecturally distinct: a man who is holding something specific and has space for it in his week, versus a man who is holding something specific and has no space for it. Naming both states symmetrically (rather than naming one as the default and the other as the exception) prevents the asymmetry from reading as accidental and forces synthesis to compose distinct prose for each.

**Downstream reading of attributed_holding_exists.** The §5.4 Held unattributed predicate uses `attributed_holding_exists` as part of its firing condition. `attributed_holding_exists` reads true when either `held_attributed_with_expression` or `held_attributed_unexpressed` is present in any direction's Pull state. The distinction between with-expression and unexpressed is irrelevant for the Held unattributed predicate, which is about whether attributed holding exists at all, not about its expression state.

#### Surfacing rule (which directions fire)

```
Surface direction d if pull[d] >= 50 OR movement[d] >= 50.

If no direction meets that threshold, surface the direction with the highest
Pull. Ties are broken alphabetically over the canonical six-direction list
(Contributor, Creator, Experience Seeker, Freedom Designer, Growth Focused, Relationship Rebuilder).
```

At least one direction always fires.

`expression_space[d]` is computed for every direction regardless of surfacing (see §4.5 computation rule). The surfacing rule does not consume `expression_space`.

### 5.2 Signal 2, Domain presence

```
DomainPresence[domain]:
    if current_state[domain] >= 60:                                                     intact (no fire)
    if current_state[domain] < 60 AND past_presence[domain] = Yes AND wanting[domain] = Wants:           Reduced wants back
    if current_state[domain] < 60 AND past_presence[domain] = Yes AND wanting[domain] = Doesn't want:    Reduced at peace
    if current_state[domain] < 60 AND past_presence[domain] = No  AND wanting[domain] = Wants:           Wants but never had
    if current_state[domain] < 60 AND past_presence[domain] = No  AND wanting[domain] = Doesn't want:    Never been part of his life
```

Each domain reads independently from its three inputs: current_state (L1), past_presence (L2), and wanting (L3). The rule applies uniformly across all 12 domains, including the spiritual domain (which processes through the standard pipeline with no special-casing).

### 5.3 Signal 3, Realistic constraints

Each constraint output is derived directly from its input (energy_availability (R1), time_availability (R2), body_capacity (R3), permission (R4)), banded with half-open intervals. The Permission output also reads permission_sub_shape (R4a).

```
3.1 Energy availability
    full              if energy_availability >= 70
    moderate          if 40 <= energy_availability < 70
    heavy depletion   if energy_availability < 40

3.2 Time availability
    open                  if time_availability >= 70
    moderate              if 40 <= time_availability < 70
    heavy time pressure   if time_availability < 40

3.3 Body / physical capacity
    full     if body_capacity >= 70
    shifted  if 40 <= body_capacity < 70
    limited  if body_capacity < 40

3.4 Permission
    band:
      present   if permission >= 70
      partial   if 40 <= permission < 70
      blocked   if permission < 40
    sub-shape (from permission_sub_shape):
      present / want-block / say-block / act-block
```

**Permission rendering rules.**

The rules below describe the constraint's logical behaviour: when it fires as a constraint, when it does not fire, and what the sub-shape value contributes. These are not engine-output structure rules; the engine output always includes all four constraint fields (raw value, band, sub-shape, fires flag) regardless of whether the constraint fires. See section 6.6 for the engine output object structure.

- permission >= 70 AND permission_sub_shape = Present: no fire as a constraint (renders as "no permission block").
- permission >= 70 AND permission_sub_shape in {Want-block, Say-block, Act-block}: trust permission. No fire as a constraint. (Honest concern: this combination is unexpected and is flagged for instrument review; see section 8.)
- permission < 70 AND permission_sub_shape in {Want-block, Say-block, Act-block}: fire with band and sub-shape; the sub-shape governs the suggestion type.
- permission < 70 AND permission_sub_shape = Present: fire with band only; no sub-shape rendered. (Honest concern: this combination indicates low permission with no specific sub-shape elicited; flagged for instrument review.)

### 5.4 Cross-cutting outputs

The cross-cutting rules read recent_life_shape_change (X1), replacement_structure_exists (X2), and recent_reaching (X4).

```
4.1 Between shapes
    fires if recent_life_shape_change = Yes AND replacement_structure_exists = No

4.2 Mid-process
    fires if at least one direction is in Active quadrant
          AND recent_reaching = Recent-and-awkward
```

---

## 6. Engine Outputs

The full set of outputs the engine produces, with semantics for the downstream rendering and experience-suggestion layers. Section 5 specifies how each is computed; this section specifies what each means.

### 6.1 Signal 1, Direction (per direction that fires)

For each direction that surfaces (rule in 5.1), the engine produces:

| Dimension | Values | What it does for the experience layer |
|---|---|---|
| Pull | continuous 0-100 | Determines suggestion intensity |
| Movement | continuous 0-100 | Determines suggestion intensity |
| Quadrant | Active / Blocked / Habit / Quiet | Active = already part of life; Blocked = wants but no room; Habit = taking time without reaching; Quiet = not in play |
| Past relationship | Returning / New / Was once / Never been part of life | Returning needs different framing from New; "Was once" surfaces conditionally (see 5.1) |
| Specificity | None / Partial / Strong | Strong specificity means the held thing is often the suggestion already |
| Pull quality | Real / Saturated / Phantom / Phantom (partial) / Suppressed / Behaviourally divergent / Ghost | Determines register: Phantom needs different treatment from Real; Saturated suggests easing not adding; Suppressed needs careful entry; Ghost is excluded from presentation |
| Pull state | Held attributed with expression / Held attributed unexpressed / Stopped expecting / Capacity strain (multi-valued) | Held attributed with expression: the specific thing has channel; suggestion can be the holding itself. Held attributed unexpressed: the specific thing exists but has no channel; suggestion must address the channel. Stopped expecting: gentle entry; Capacity strain: easing first |
| Expression space | Has space / No space | Whether the man's week has room for the direction to express itself, per §4.5 |

**Direction tells the experience layer which kind of suggestion to generate.** Pull and Movement determine intensity. Pull quality and Pull state determine register.

### 6.2 Signal 2, Domain presence (per domain)

| Output value | What it means | What it does for the experience layer |
|---|---|---|
| (no fire, intact) | Domain present in his life | No suggestion targeted here |
| Reduced wants back | Was present, has reduced, he wants it back | Active observation; suggestion targets recovery of this domain |
| Reduced at peace | Was present, has reduced, he is at peace without it | Surfaces as context; do not push him to recover what he is at peace without |
| Wants but never had | Never been part of his life, he wants it now | Emerging; suggestion targets new acquisition |
| Never been part of his life | Never present, he doesn't want it now | Surfaces as context; no suggestion |

**Domain presence refines what specifically the suggestion should address.**

Applies uniformly to all 12 domains, including spiritual. The `never_been_part_of_his_life` value fires more often for spiritual than for any other domain (per §3.5.1); downstream synthesis handles this with the same calm registration it gives `intact`.

### 6.3 Signal 3, Realistic constraints (per constraint)

| Output | Values | What it does for the experience layer |
|---|---|---|
| 3.1 Energy availability | full / moderate / heavy depletion | Filters energy-intensive suggestions |
| 3.2 Time availability | open / moderate / heavy time pressure | Filters time-intensive suggestions |
| 3.3 Body / physical capacity | full / shifted / limited | Filters physically demanding suggestions |
| 3.4 Permission, band | present / partial / blocked | Filters suggestions that feel like crossing a line |
| 3.4 Permission, sub-shape | present / want-block / say-block / act-block | Want-block: low-stakes "let yourself want it." Say-block: communication- or naming-shaped. Act-block: small actionable step. Present: standard. |

**Realistic constraints filter out suggestions that aren't realistic for his current life.**

### 6.4 Cross-cutting outputs

| Output | Fires when (see 5.4) | What it does for the experience layer |
|---|---|---|
| 4.1 Between shapes | Life-shape recently changed, next form not formed | Suggestion register is "what shape might this become?" rather than "what could you add to your existing life?" |
| 4.2 Mid-process | He's started reaching, completion not there yet | Suggestion register is reinforcement of what's started, not new things to try |

### 6.5 Synthesis (not an engine output)

Synthesis, the integration of the firing pattern into a single read of where the man is standing, is rendering-layer composition. The engine's contribution to synthesis is the firing pattern of all other outputs plus the cross_direction group (§6.6). The engine itself does not compute a synthesis output.

---

### 6.6 Engine Output Object Structure

The engine returns a single EngineOutput object containing the complete firing pattern from all signals plus cross-cutting outputs plus the cross_direction group. This section specifies the structural contract that the rendering and experience-suggestion layers build against.

The engine speaks in machine-readable identifiers (snake_case enum values and field names). Translation to user-facing strings is the rendering layer's responsibility.

All fields are always present. The engine produces a complete, fully-populated EngineOutput object for every input map, regardless of how many outputs fire. Non-firing outputs return their intact / non-fire state explicitly rather than being omitted. Numeric values are returned alongside banded categorical values so the rendering layer has both raw and banded readings without recomputing.

The TypeScript-flavoured syntax below is illustrative pseudocode making the contract concrete; it does not commit the architecture to TypeScript as the only implementation language.

#### Top-level structure

```
type EngineOutput = {
    directions:      DirectionOutput[]        // always 6 entries, ordered by pull desc
    domains:         DomainPresenceOutput[]   // always 12 entries, in canonical order
    constraints:     ConstraintsOutput
    cross_cutting:   CrossCuttingOutput[]     // always 3 entries, in canonical order
    cross_direction: CrossDirectionOutput
}
```

The engine does NOT emit `self_report` in `EngineOutput`. Synthesis reads `InputMap.self_report` directly. This is intentional and structural: the engine output's contract is the engine's reading; self-report data is the man's reading. Keeping them in separate objects reinforces their independence.

A consequence: any layer that wants to compose engine reading plus self-report (the synthesis layer is the primary such consumer) reads both `EngineOutput` and `InputMap`. This matches the existing synthesis layer contract (synthesis reads both per `SYNTHESIS.md`).

#### DirectionOutput

The directions array always contains exactly 6 entries, one per direction, ordered by pull descending. Ties broken alphabetically (contributor, creator, experience_seeker, freedom_designer, growth_focused, relationship_rebuilder). The `surfaced` boolean indicates whether the surfacing rule in 5.1 selected this direction; renderers may choose to show only surfaced directions, all directions, or both.

```
type DirectionOutput = {
    direction:         DirectionName
    surfaced:          boolean                 // per surfacing rule in 5.1
    pull:              number                  // 0-100, computed per 4.2
    movement:          number                  // 0-100, equal to current_movement[d]
    quadrant:          QuadrantValue
    past_relationship: PastRelationshipValue
    was_once_renders:  boolean                 // true only when "was_once" should surface, per 5.1 mapping table
    specificity:       SpecificityValue
    pull_quality:      PullQualityValue[]      // typically single element; can be empty if precondition not met
    pull_state:        PullStateValue[]        // multi-valued; can be empty array
    expression_space:  ExpressionSpaceValue    // always present; per §4.5
}

type DirectionName =
    | "contributor"
    | "creator"
    | "experience_seeker"
    | "freedom_designer"
    | "growth_focused"
    | "relationship_rebuilder"

type QuadrantValue =
    | "active"
    | "blocked"
    | "habit"
    | "quiet"

type PastRelationshipValue =
    | "returning"
    | "new"
    | "was_once"
    | "never_been_part_of_life"

type SpecificityValue =
    | "none"
    | "partial"
    | "strong"

type PullQualityValue =
    | "real"
    | "saturated"
    | "phantom"
    | "phantom_partial"
    | "suppressed"
    | "behaviourally_divergent"
    | "ghost"

type PullStateValue =
    | "held_attributed_with_expression"
    | "held_attributed_unexpressed"
    | "stopped_expecting"
    | "capacity_strain"

type ExpressionSpaceValue =
    | "has_space"
    | "no_space"
```

When the Pull quality precondition is not satisfied for a direction, `pull_quality` is an empty array. The rendering layer reads this as "no pull quality to report on this direction." `expression_space` is always populated (per §4.5); it never reads as null or absent.

#### DomainPresenceOutput

The domains array always contains exactly 12 entries, one per domain, in the canonical order defined in section 3.2. The `value` field uses `intact` for domains that do not fire (current_state >= 60). The raw current_state value is returned alongside the banded value.

```
type DomainPresenceOutput = {
    domain:        DomainName
    current_state: number               // 0-100, raw current state
    fires:         boolean              // true when value != "intact"
    value:         DomainPresenceValue
}

type DomainName =
    | "time_as_yours"
    | "energy_as_resource"
    | "felt_aliveness"
    | "body_physical_aliveness"
    | "curiosity"
    | "making"
    | "conversation_depth"
    | "being_known"
    | "friendship"
    | "intimacy"
    | "mattering"
    | "spiritual"

type DomainPresenceValue =
    | "intact"
    | "reduced_wants_back"
    | "reduced_at_peace"
    | "wants_but_never_had"
    | "never_been_part_of_his_life"
```

#### ConstraintsOutput

A single object containing all four constraint readings plus the derived sustained_constraint_intensity. All four constraint readings are always present. Each constraint carries the raw input value alongside the banded categorical.

```
type ConstraintsOutput = {
    sustained_constraint_intensity: number   // 0-100, derived per 4.1
    energy: {
        value: number                        // 0-100, raw availability
        band:  EnergyBand
        fires: boolean
    }
    time: {
        value: number
        band:  TimeBand
        fires: boolean
    }
    body_capacity: {
        value: number
        band:  BodyBand
        fires: boolean
    }
    permission: {
        value:     number
        band:      PermissionBand
        sub_shape: PermissionSubShape
        fires:     boolean
    }
}

type EnergyBand =
    | "full"
    | "moderate"
    | "heavy_depletion"

type TimeBand =
    | "open"
    | "moderate"
    | "heavy_time_pressure"

type BodyBand =
    | "full"
    | "shifted"
    | "limited"

type PermissionBand =
    | "present"
    | "partial"
    | "blocked"

type PermissionSubShape =
    | "present"
    | "want_block"
    | "say_block"
    | "act_block"
```

The `fires` boolean follows the rendering rules in 5.3:

- Energy, Time, Body capacity: `fires` is true when the band is not the highest tier (`full` / `open` / `full` respectively).
- Permission: `fires` is true when permission < 70 (regardless of `sub_shape`). Does not fire when permission >= 70, regardless of `sub_shape`.

#### CrossCuttingOutput

The cross_cutting array always contains exactly 2 entries, one per cross-cutting output, in canonical order: between_shapes, mid_process. Each carries a `fires` boolean.

```
type CrossCuttingOutput = {
    output: CrossCuttingName
    fires:  boolean
}

type CrossCuttingName =
    | "between_shapes"
    | "mid_process"
```

#### CrossDirectionOutput

A single object carrying the cross-direction architectural inputs (pass-through, verbatim from InputMap) plus the system-level derivations (`life_texture_band` plus the seven narrowing bands).

```
type CrossDirectionOutput = {
    // Pass-through from InputMap.cross_direction:
    life_stage:              LifeStageValue
    sociality_default:       SocialityValue
    paid_work_relationship:  PaidWorkRelationshipValue
    primary_load:            PrimaryLoadValue
    week_shape:              WeekShapeFlags
    psychological_filtering: PsychologicalFilteringValue
    role_consolidation:      RoleConsolidationValue
    attention_pattern:       AttentionPatternValue
    relational_presence:     RelationalPresenceValue
    // Derived:
    life_texture_band:             LifeTextureBand
    structural_narrowing_band:     NarrowingBand
    experiential_narrowing_band:   NarrowingBand
    psychological_narrowing_band:  NarrowingBand
    identity_narrowing_band:       NarrowingBand
    energetic_narrowing_band:      NarrowingBand
    relational_narrowing_band:     NarrowingBand
    attention_narrowing_band:      NarrowingBand
}

type LifeTextureBand =
    | "empty"
    | "depleted"
    | "mixed"
    | "textured"

type NarrowingBand =
    | "low"
    | "moderate"
    | "high"
```

**Why pass-through fields appear in EngineOutput.** Synthesis already reads `InputMap` directly, so technically these fields could be read from `InputMap.cross_direction`. The engine emits them in `EngineOutput.cross_direction` for two reasons:

1. **Co-location with derived output.** `life_texture_band` is derived from `week_shape`; the seven narrowing bands are derived in part from the new cross_direction inputs; emitting all of them in the same place lets synthesis read the bands and the underlying flags together without crossing input/output boundaries.
2. **Single read surface for synthesis.** Synthesis predicates that compose across `cross_direction` inputs (for example, `life_stage AND life_texture_band`) read from one object rather than reaching back to InputMap.

The pass-through is verbatim. `EngineOutput.cross_direction.life_stage === InputMap.cross_direction.life_stage` for every InputMap; the same equality holds for `sociality_default`, `paid_work_relationship`, `primary_load`, `week_shape`, `psychological_filtering`, `role_consolidation`, `attention_pattern`, and `relational_presence`.

#### Always-present, always-complete

The EngineOutput object is always fully populated:

- 6 entries in `directions`, regardless of which are surfaced
- 12 entries in `domains`, regardless of which fire
- All four constraints plus sustained_constraint_intensity, with raw values, bands, and fires flags
- 3 entries in `cross_cutting`, with fires flags
- 1 `cross_direction` object with all pass-through and derived fields populated

There are no optional fields, no omitted entries, no null values for non-firing outputs. Non-firing outputs are explicit (`fires: false`, `value: "intact"`, `surfaced: false`, etc.). This makes downstream rendering straightforward: the rendering layer can iterate over fixed-size arrays and apply its own filtering logic.

#### Synthesis is not part of EngineOutput

The synthesis paragraph that integrates the firing pattern is rendering-layer work, not engine work. The EngineOutput object plus `InputMap.self_report` is the input to synthesis composition, not the synthesis itself.

---

## 7. Computation Order (whole-system)

```
1.  Input validation: rules 1-14 fire at the input boundary.
    All required fields present and type-correct;
    numeric values in range; categorical values in allowed sets;
    would_reach_for / direction_chosen consistency;
    wanting field constraints for universal-wanting domains
        and for the spiritual domain;
    week_shape completeness (rule 6);
    life_stage, sociality_default, paid_work_relationship, primary_load
        enum values (rule 7);
    self_report shape, cap, and mutual exclusion (rules 8-9);
    psychological_filtering, role_consolidation, attention_pattern,
        relational_presence enum values (rules 10-13);
    spiritual domain shape (rule 14).
    Malformed InputMaps are rejected before any scoring runs.

2.  Realistic constraints inputs (energy_availability, time_availability,
    body_capacity, permission, permission_sub_shape) read directly.
    No dependencies.

3.  sustained_constraint_intensity derived from energy_availability,
    time_availability, body_capacity, permission (formula in section 4.1).

4.  life_shape_duration read directly. No dependencies.

5.  cross_direction architectural inputs read directly:
        week_shape, life_stage, sociality_default,
        paid_work_relationship, primary_load,
        psychological_filtering, role_consolidation,
        attention_pattern, relational_presence.
    No dependencies (validation already complete at step 1).

6.  life_texture_band derived from week_shape (formula in §4.4).
    Depends on step 5.

7.  expression_space[d] derived per direction from week_shape
    (formula in §4.5). Depends on step 5. Computed for all 6 directions
    regardless of surfacing.

8.  self_report read directly from InputMap. Validated at step 1.
    The engine performs no further computation over self_report.

9.  Realistic constraints outputs (3.1-3.4) computed from constraint inputs.
    Can compute in parallel with steps 5-7 and step 10.

10. Domain presence read directly from current_state, past_presence,
    wanting per domain. All 12 domains process through the same pipeline.
    No cross-signal dependencies. Can compute in parallel with steps 5-9.
    Note that step 11 reads Domain presence outputs to compute
    was_once_renders[d], so step 11 depends on step 10.

11. Direction signal computed in full:
        pull[d], movement[d] (formulae 4.2, 4.3)
        Quadrant[d], Past relationship[d], Specificity[d]
        Pull quality[d] (reads sustained_constraint_intensity,
                         life_shape_duration from steps 3 and 4)
        Pull state[d] (reads specificity[d] and expression_space[d]
                       from step 7 for the held_attributed_* values)
        was_once_renders[d] (reads Past relationship[d] from this step
                             plus Domain presence outputs from step 10)
    Surfacing rule applied at end.

12. Seven narrowing bands derived on EngineOutput.cross_direction:
        structural_narrowing_band   (per §4.6.1)
        experiential_narrowing_band (per §4.6.2)
        psychological_narrowing_band(per §4.6.3)
        identity_narrowing_band     (per §4.6.4)
        energetic_narrowing_band    (per §4.6.5)
        relational_narrowing_band   (per §4.6.6)
        attention_narrowing_band    (per §4.6.7)
    Each band reads from already-computed outputs (steps 5-11). The seven
    derivations are independent of each other and can execute in any order.

13. Cross-cutting outputs (4.1-4.2) read recent_life_shape_change,
    replacement_structure_exists, recent_reaching
    plus Direction outputs (Active quadrants for 4.2). Compute after step 11.

14. Synthesis: not computed by engine. Rendering layer composes from
    the firing pattern of all outputs above plus InputMap.self_report.
```

The dependency graph has no cycles. Steps 1-5 are direct reads or simple derivations. Step 11 (Direction signal) reads outputs from steps 3, 4, 7, and 10. Step 12 (narrowing bands) reads outputs from steps 5-11. Step 13 reads outputs from step 11.

---

## 8. Honest Concerns and Open Questions

**Threshold values are first pass.** The numeric thresholds in section 5 (the 50 boundary for Quadrants and surfacing, the 30 floor for Pull quality precondition, the principal Pull quality branch thresholds (70/50/30/60/70 and others), the Domain presence intact threshold 60, the constraint band boundaries 70/40, the Suppressed sustained_constraint_intensity (G3) thresholds 60/70) are first-pass values, alongside the §4.4 life_texture_band cutoffs, the §4.5 expression_space mappings, and the §4.6 narrowing-band thresholds. Calibration against avatar runs and an early live cohort will refine them. Implementers should expect to tune these.

**Pull and sustained_constraint_intensity weightings are first pass.** The Pull formula weights (0.30, 0.20, 0.20, 0.20, 0.10) and the sustained_constraint_intensity formula weights (0.20, 0.20, 0.15, 0.45) are first-pass. Calibration will refine.

**£70/three-slot effect on Pull weighting.** stated_strength (D1) is derived per-direction from the card observations (anticipation, current_movement, specificity). The Pull formula gives stated_strength a 0.30 weight; for unchosen directions, Pull is then driven entirely by felt_cost (D2), anticipation (D2a), recent_action (D3a), and specificity (D5). Calibration target: a direction with stated_strength = 0 but felt_cost = 60 and recent_action = Recent should still register meaningful Pull (stated_strength weight should not be punishingly high when zero); a direction with stated_strength = 50 but felt_cost = 0 and recent_action = None should not register much Pull either (stated_strength alone shouldn't drive Pull). Worth tuning during calibration runs.

**stated_strength and felt_cost individual reliability.** Both depend on direct self-report, which is noisy. Pull triangulates across five inputs to dampen this, but stated_strength and felt_cost individually need careful question design.

**felt_cost and anticipation may correlate strongly.** A man with strong anticipation often has at least small recent action. The architecture treats them as independent inputs but they may correlate. Acceptable noise; revisit if it produces miscalibration.

**Phantom (partial) is a design hypothesis.** Phantom (partial) catches profiles where stated pull is moderate (50 to 70) and surrounding evidence is absent. The branch is included to surface soft-phantom shapes that full Phantom misses. Calibration may move the threshold or merge the branch with full Phantom.

**Deep-suppression branch is a design hypothesis.** The deep-suppression branch lets Suppressed fire when the standard Pull-quality precondition (Pull >= 30 OR stated_strength >= 50) does not hold AND stated_strength is below 50 (i.e., the man's stated wanting itself reads low), on the basis that profiles with sustained heavy constraint, long duration, and prior past-presence may have stated_strength, felt_cost, and anticipation all reading low precisely because the wanting has been suppressed. Without this branch, deeply suppressed pull below the precondition floor is undetectable. Calibration may tighten or loosen the deep-branch thresholds (sustained_constraint_intensity >= 70 and life_shape_duration (G4) = Long are first-pass).

**Pull quality multi-valued data structure.** The Pull quality output is held as a multi-valued data structure to permit co-firing where conditions overlap. In practice the rules in 5.1 produce a single value per direction. The data structure choice does not commit the architecture to producing multiple values per direction; it permits future expansion if calibration finds genuine co-firing patterns.

**direction_chosen option mapping is placeholder.** The free-time question's option set and the option-to-direction_chosen-value mapping in 5.1 are placeholder. The final option wording, the number of options, and the mapping to direction / Rest / None values need joint work between question design and scoring. The placeholder set covers all eight direction_chosen (D7b) values but is not the final question.

**would_reach_for and direction_chosen non-independence.** would_reach_for (D7a) per-direction values are fully determined by direction_chosen. The architecture holds both for scoring convenience. Question design produces only direction_chosen; would_reach_for is computed from it.

**wanting universal-wanting defaults.** The architecture defaults wanting (L3) = Wants for Time as yours, Energy as resource, Felt aliveness, and Body/physical aliveness. If respondent testing reveals men who genuinely don't want one of these (for example, a man so depleted he doesn't want energy because the wanting itself is exhausting), this default would miss them. The risk is low but real; revisit if encountered.

**current_state boundary is sharp.** The Domain presence rule fires Reduced (or Wants but never had, or Never been part of his life) at current_state (L1) < 60 and fires nothing at current_state >= 60. A man at current_state = 59 fires; a man at current_state = 60 does not. Calibration may want to add a soft-edge band (for example, 55 to 65 as marginal) later.

**Permission edge cases.** Two combinations of permission (R4) and permission_sub_shape (R4a) are not the expected pattern:

- permission < 70 with permission_sub_shape = present: low permission band but no specific sub-shape elicited. The architecture renders the band only, no sub-shape. Worth instrument review to confirm the sub-shape question is reaching men whose permission reads as moderate or blocked.
- permission >= 70 with permission_sub_shape in a block value: high permission band but a specific sub-shape selected. The architecture trusts permission and does not fire as a constraint. Worth instrument review to confirm the sub-shape question is not eliciting blocks where permission reads as high.

**Permission sub-shape elicitation.** The four values (present / want-block / say-block / act-block) need careful question design. A forced-choice version: "When you think about acting on something you want, what's most often the case for you? (a) I'd hesitate to want it / (b) I'd want it but not say it / (c) I'd want it and say it but not act / (d) None of these apply."

**recent_reaching's "No-current-reaching" value preserves the no-conditional principle but adds noise.** The instrument needs to distinguish men with no current reaching from men whose reaching is long-established without conditioning on prior answers. Worth careful question design.

**Saturation and Stopped-expecting per direction.** saturation (D8) and stopped_expecting (D9) are binary now (No / Yes). The instrument needs questions that fit each direction's specific content (Saturated Contribution feels different from Saturated Making) without becoming six different questions per dimension.

**Friendship vs Conversation depth distinction.** Both can appear similar in a man's life; the instrument needs questions that specifically separate them.

**Intimacy elicitation sensitivity.** The Intimacy domain reads physical and emotional intimacy with his closest person. The question must read this without pathologising sexless arrangements he is at peace with. wanting captures his peace with the situation.

**Synthesis is downstream.** The architecture deliberately does not specify synthesis. The engine produces the firing pattern; the rendering layer composes the synthesis from that pattern. If synthesis quality is uneven across profiles, that work belongs to the rendering layer, not to the engine.

**life_texture_band thresholds are first pass.** The cutoffs (0, 1, 3, 4 against a 6-flag texture space) are unvalidated against live data. Fixture authoring is the first verification: if fixtures cluster in `mixed` when they should be reading `depleted`, the threshold needs lowering; if no fixture reads `textured` honestly, the threshold needs lowering; if `textured` reads as "exceptional" rather than as "genuinely texture-rich," the threshold needs raising. Calibration target: the band should be a real architectural reading, not a label of last resort.

**life_texture_band may be coarse.** Men with very different shapes can land in the same band: a man with two contents flags and two load flags reads `mixed`, and so does a man with two contents flags and zero load flags. A joint texture × pressure banding (six or eight bands distinguishing loaded-textured from loaded-thin from light-textured from light-thin) is a calibration option worth holding for after first-pass implementation if the four-band scheme conflates meaningfully different shapes downstream.

**life_texture_band: `mixed` conflates structurally distinct shapes.** The band reads the same for a man with `varied_week: true` and a man with `varied_week: false`, but these represent architecturally different shapes. The band's exclusion of varied_week from the count is correct (varied_week is a higher-order property, not a contents flag), but the responsibility for distinguishing the two shapes moves to synthesis. The §4.4 band semantics row for `mixed` explicitly flags this so `SYNTHESIS.md` composes against both signals.

**sees_people definitional ambiguity controls band transitions.** The single `sees_people` flag can control whether a man lands at `empty` versus `mixed`, or `depleted` versus `mixed`. The §3.4.1 definition reads strictly outside-household, but men with frequent intra-household contact are a dominant pattern. The instrument's question wording must firm up whether intra-household frequent contact ticks the flag or not, before fixture authoring locks. Either answer is defensible; the spec must not be ambiguous.

**Contents flag overlap is unbounded.** The six contents flags can overlap conceptually (a man's `weekly_activity` may also be his `belongs_to_group`). The `life_texture_band` derivation counts flags independently (§4.4 count semantics). This is the right behaviour structurally: the engine reads observed density, not orthogonal categories. The risk is that question design produces flags that systematically co-fire (a man who ticks `belongs_to_group` almost always also ticks `weekly_activity` because the question wording leads him), which would inflate `texture_count` artificially. Mitigation lives in question design, not in the engine.

**expression_space mappings are first pass.** The per-direction mappings in §4.5 are design hypotheses. Fixture authoring is the verification: a fixture whose direction reads firing-with-expression but whose profile clearly lacks the expression should expose a wrong mapping. The Experience direction's conjunction (`weekly_activity AND varied_week`) is the most opinionated mapping and the most likely to need revision.

**Pull state split is a design hypothesis.** Splitting `held_attributed` into `held_attributed_with_expression` and `held_attributed_unexpressed` rests on the claim that the expression-space distinction is architecturally significant for held-attributed cases specifically. Calibration target: do profiles with `held_attributed_unexpressed` produce distinctly different synthesis readings than profiles with `held_attributed_with_expression`? If both routes through synthesis produce essentially the same prose, the split is unnecessary and the field should re-collapse.

**Work split (paid_work_relationship + primary_load) replaces a single-field assumption.** The two-field split (§3.4.2) admits the joint state cleanly but introduces a calibration question: does the two-field composition produce meaningfully different synthesis prose across the value combinations? If certain combinations (for example, `peripheral × paid_work`) prove uninformative or always equivalent to another combination, the enums may shrink.

**life_stage `enduring` is a deliberate addition.** The value names the depleted-but-pinned-by-obligation shape. Calibration target: do men landing at `enduring` consistently produce a depleted-but-pinned shape in synthesis prose, distinct from `drifting` (no direction) and `settled` (at-rest)? If `enduring` and `drifting` collapse in synthesis (the prose reads the same), the values may need restructuring.

**Questionnaire-elicitation gap for life_stage, sociality_default, and the four narrowing inputs.** §3.4.0 and §3.4.4 through §3.4.7 document that these fields read interior architectural states the current life-shape may not supply observable evidence for. The questionnaire is responsible for surfacing the readings even when life-shape suppresses observation. This is flagged in the spec so the questionnaire designer sees the fields together; if the questionnaire fails to elicit positively, the engine receives best-guess values and the architectural reading is undersupported. Mitigation is at the questionnaire layer, not in the engine.

**Self-report mutual exclusion enforcement is at validity-rule level, not at UX level.** The engine's validity rule 9 rejects InputMaps where `"nothing_really"` co-occurs with other items. The questionnaire layer is responsible for preventing this state at input time. If the questionnaire produces such a state (a UX bug), the engine rejects the InputMap explicitly rather than silently dropping the conflicting items. This is the right division of responsibility (the engine validates; the UX prevents) but it does mean that questionnaire bugs surface as engine errors rather than as silent data drops. Worth surfacing in instrument design.

**Specificity-strong and missing channel are negatively correlated.** Men who can sharply point at what they hold tend also to have the channel for expressing it; the pointing and the channel co-evolve through use. Men who lack the channel tend to lack the sharp pointing too, because the channel's absence prevents the articulation from sharpening. A permission `want_block` is one mechanism (want_block prevents articulated wanting; specificity-strong requires articulated wanting; the two cannot co-occur). The `held_attributed_unexpressed` branch remains architecturally correct (the case it names, sharp held thing with no channel, is a real archetypal shape), but the negative correlation means the branch is rarer than its counterpart. The correlation itself may be worth reading explicitly in a future amendment.

**attention_pattern and relational_presence correlation watch.** These two inputs are conceptually adjacent. Both read attention texture; the first reads it generally, the second reads it specifically in the relational context. The architectural intent is to admit per-context variation: a man engaged in his workshop and on autopilot in his marriage is a real state. But if the two inputs produce correlated values systematically (a man with `autopilot` general attention almost always reads `mostly_absent` in relationships), one input is doing the work and the other is redundant. The architecture treats them as independent inputs; calibration may revisit if real divergence does not appear.

**Spiritual domain interpretive authoring.** The `spiritual` domain reads a dimension narratives often pass over in silence. The four narrowing inputs read internal habits that have observable correlates in many cohorts; the spiritual domain may not. For inputs whose source narrative is silent on this dimension, the authored value is an architectural choice that affects downstream readings. Where genuinely ambiguous, the value should be flagged for review rather than assigned by default. This is more interpretive work than the four narrowing inputs combined, and worth its own pass during fixture authoring.

**The strict reading of the spiritual axis (added at amendment lock; see §3.5.1).** The axis reads self-identified religious or spiritual orientation, not contemplative-practice-recognition. Under the strict reading, the `never_been_part_of_his_life` value fires more often than for any other domain. This is architecturally correct for a British professional-male audience whose dominant register is post-religious or never-religious. The dashboard treats this value with the same calm registration it gives `intact`.

**Spiritual × mattering composition deferred to synthesis.** The `spiritual` domain emits independently of `mattering`. Both can fire; both can read reduced; they overlap conceptually but read different facets. A man with both reduced is a real architectural state. The engine does no special composition for the spiritual × mattering case; both are emitted as independent domain readings. The synthesis layer handles the prose composition when both reduce. The engine flags this for the synthesis layer to handle and does not pre-empt.

**psychological_narrowing_band high-fire calibration.** The high-band predicate requires either pervasive filtering, want_block permission, or a strong outcome signal (4 or more directions with specificity-none-and-would-not-reach-for) combined with at least some filtering activity. The tightening prevents outcome-only fires that conflate psychological narrowing with structurally-or-energetically produced narrowed outcomes. The moderate band absorbs the cases the prior threshold would otherwise over-fire into high.

**Band-level compression at extremes.** The seven narrowing bands compress to identical signatures at extreme cohort positions: a profile that reads high on all seven bands, and a profile that reads moderate on all seven, both occur across architecturally-distinct underlying shapes. The differentiation across these clusters lives in underlying inputs (`relational_presence`, `energy.band`, `sees_people`, `permission_sub_shape`, `primary_load`, `paid_work_relationship`, `psychological_filtering`, `life_stage`), not in band values. The synthesis layer's prose composition rules must read underlying inputs alongside band values when bands compress across architecturally-distinct profiles. The engine emits both bands and underlying inputs on `EngineOutput.cross_direction` to support this. The compression is honest reflection of the architectural taxonomy, not a calibration concern at the engine level.

**Indirect elicitation budget.** The four narrowing inputs (`psychological_filtering`, `role_consolidation`, `attention_pattern`, `relational_presence`) and the `spiritual` domain's three sub-fields together require indirect elicitation in the downstream questionnaire phase. Each input or sub-field probably needs two-to-three indirect questions to triangulate reliably. The questionnaire surface area for the narrowing layer is larger than the v3 extension required. Worth budgeting for during the `RENDER.md` work that handles questionnaire wording.

**Instrument design is phased.** Build and test the engine against test input maps first, with simple direct questions for elicitation (Likert intensities, binary yes/no, forced-choice categoricals, plus the £70/three-slot pattern for stated_strength and the free-time forced-choice for would_reach_for and direction_chosen). Validate the engine produces coherent reads. Then return to question design to add behavioural anchoring, indirect elicitation, scenario vignettes, and sharper forced-choice patterns where they meaningfully improve fidelity. The architecture is the contract; questions are the implementation. Don't pre-optimise.

**Questions must not be game-able.** Direct self-report questions (stated_strength, felt_cost) are most vulnerable. The architecture triangulates against behavioural anchors to dampen this. Question design must avoid making the "right answer" obvious.

**Questions must be in the man's language.** Concrete situations, not abstract concepts. No therapy-language. No self-help register. Plain, specific, slightly dry, grounded in observable life. Read British, not American. Forced-choice with concrete scenarios where possible, not Likert rating scales.

**Estimated question count.** With no conditional questions:

| Signal | Questions |
|---|---|
| 1. Direction | ~55-65 (saturation and stopped_expecting read for each of 6 directions; £70 collapses six stated_allocation readings into one; free-time question collapses six would_reach_for plus 1 direction_chosen into one) |
| 2. Domain presence | ~20 (current_state + past_presence (L2) for all 12 domains, wanting for 8 only including spiritual) |
| 3. Realistic constraints | ~5 |
| 4. Cross-cutting | ~4 |
| 5. Cross-direction architectural | ~9 (week_shape contains 9 flags but elicited as a compound question or short set; life_stage, sociality_default, paid_work_relationship, primary_load each one question) |
| 6. Cross-direction narrowing inputs | ~10-12 (each of the four inputs needs 2-3 indirect elicitation questions per §8 "Indirect elicitation budget" above) |
| 7. Self-report | ~1 (named_absences as a multi-select up to 3 items) |
| **Total** | **~105-115 questions** |

The architecture trades brevity for orthogonality. Every man answers the same questions.

---

## 9. What This Document Is Not

This document specifies the engine's full input-to-output contract. It does not specify:

- The questionnaire that produces the input data. Question design is downstream and may revise freely as long as it continues to populate the input variables defined in section 3.
- The rendering layer that turns engine outputs into dashboard text.
- The experience-suggestion layer that maps fired outputs to suggested experiences.
- The synthesis composition (rendering-layer work; see 6.5).
- The comparison surface composing engine reading against `self_report.named_absences` (synthesis-layer work; see `SYNTHESIS.md`).
- State management for partial saves, returning users, repeat completions.

These layers each have their own design work. This document fixes the engine's contract so the layers downstream can build against it.
