# Question-layer map (step 1 of 5) - corrected revision

Per-question cross-layer trace of the WAEL questionnaire. Read-only artefact. Built by tracing
`src/ui/questionnaire/data/manifest.ts` through the assembler, engine, synthesis, render, experience,
and validation layers. This revision merges three verified findings: (A) the experience-layer code
trace at `src/ui/experience/`, (B) the q10b/q10c wiring verdict (WIRED), and (C) the final four-layer
verdict on `sociality_default`.

## Method and caveats

- Manifest read in full: `@/home/mark/WAEL/wael-ee/src/ui/questionnaire/data/manifest.ts:1-900`.
- Assembler builders, engine, and synthesis read in full.
- **Experience layer: VERIFIED AGAINST CODE** at `src/ui/experience/` (recommend.ts, diversify.ts,
  filter.ts, types.ts, inventory.ts, status_store.ts, validation.ts, data/direction_mapping.ts). An
  earlier revision of this map had traced the experience layer against `EXPERIENCE.md` (section 2,
  Inputs) only and marked those rows MEDIUM; that caveat is now retired.
- **KEY ARCHITECTURAL FACT (verified):** the experience layer does NOT read InputMap fields directly.
  It reads only SYNTHESIS outputs (`experience_candidate_directions`, `the_narrowings_panel.bands`)
  and ENGINE outputs (`ConstraintsOutput` - the energy/time/body bands), plus static inventory data
  (variant fields) and user status flags (status_store). A question therefore influences
  recommendations ONLY via what the engine/synthesis derive, never directly.
- Experience rows below name which of the THREE ROUTES (if any) each question's fields feed:
  - **R1** = `experience_candidate_directions` (via the synthesis firing-set / pull; read at
    `recommend.ts:228`, mapped in buildCandidateMap, drives tier assignment).
  - **R2** = `the_narrowings_panel.bands` (read at `recommend.ts:229`, drives narrowingFitScore).
  - **R3** = a `ConstraintsOutput` band (read at `recommend.ts:230`; body_capacity.band -> exertion
    pre-filter at `recommend.ts:71-78`; energy.band and time.band -> constraint biases at
    `recommend.ts:185-206`).
- The `influences_experience_layer` flag in `self_report_items.ts` has NO code consumer in the
  experience layer (verified). It is a spec-level intention, not wired.
- Every field traced by searching the field name AND any derived value. Indirect reads are noted.

## Cross-cutting findings used repeatedly below

1. **The six direction cards are a strict matched set.** card-a / card-b / card-c per direction share
   renderer, value mapping, gate, and assembler treatment; they differ only by `directionKey` and
   (some) option surface wording. The consumer trace is identical per direction; stated once on the
   contributor card and referenced.

2. **Q10 / Q10b / Q10c are the TRIAD** (manifest `:496-501`, re-noted `:702`, `:849`). Surface wording
   varies deliberately; values/constructs/order identical. Do not re-unify.

3. **RESOLVED: q10b/q10c are WIRED.** An earlier revision flagged a CODE/DOC DISAGREEMENT here. The
   verified verdict: the `@/home/mark/WAEL/wael-ee/src/assembler/answers.ts:48-53` comment ("does NOT
   populate an engine field") is STALE/INCORRECT. The real path: q10b/q10c -> `interpretQ10` ->
   `cross_direction.reach_retrospective` / `reach_counterfactual`
   (`@/home/mark/WAEL/wael-ee/src/assembler/cross-direction.ts:37-52`) -> read by the engine in
   `computeReachConfidence` and `computeReachState`
   (`@/home/mark/WAEL/wael-ee/src/engine/derivations.ts:462-549`) and in ghost detection
   (`@/home/mark/WAEL/wael-ee/src/engine/scoring/direction.ts:178-188`). The triad triangulation IS
   real and the three-arm repetition is justified. What the triad computes: `reach_state` =
   **'numb'** (all three rest/none) / **'buried_but_alive'** (Q10a rest/none but the retrospective or
   counterfactual arm names a direction) / **'surfaced'**. The 'buried_but_alive' state is the
   detector for the man whose want is alive but buried under fatigue. The answers.ts comment should
   be fixed in code.

4. **SETTLED: `sociality_default` four-layer verdict.** Engine scoring: **DEAD** - passed to
   `computeRelationalNarrowingBand` (`derivations.ts:388`) but never referenced in the body
   (`:393-415`) (DEAD-PARAM). Experience layer: **NOT READ** (verified against code; no sociality
   reference anywhere in `src/ui/experience`). Synthesis: **LOAD-BEARING** - drives the 11
   sociality_summary prose sentences (`life_context_panel.ts:60-66`), distinguishing e.g. "solitary
   and content" from "solitary but the absence still registers". Schema: **REQUIRED** (in
   CROSS_DIRECTION_REQUIRED; non-optional in the InputMap type; categorical validity check,
   `validation.ts:135,642-648`). Net: **Q7 is NOT cuttable.** It does not score and does not drive
   recommendations, but it is schema-required and drives synthesis prose. Code-hygiene note for the
   build thread: the unused `sociality_default` (and `belongs_to_group`) PARAMETERS on
   `computeRelationalNarrowingBand` are dead-param cruft - remove the unused params, OR wire
   temperament into the relational narrowing band if that was the original intent.

5. **`MergedDirectionView` carries raw direction inputs its predicates mostly ignore.**
   `@/home/mark/WAEL/wael-ee/src/synthesis/data/shape_sentences.ts:20-45` merges nine input fields;
   only `felt_cost` (`:295`) and `past_presence` are read by any shape-sentence predicate. The rest
   (`stated_strength, anticipation, current_movement, recent_action, would_reach_for, saturation,
   stopped_expecting`) reach prose only via engine outputs.

6. **`computePull` weights** (`@/home/mark/WAEL/wael-ee/src/engine/derivations.ts:71-79`):
   `0.3*stated_strength + 0.2*felt_cost + 0.2*anticipation + 0.2*recent_action + 0.1*specificity`.
   `would_reach_for`, `saturation`, `stopped_expecting`, `past_presence`, `current_movement`,
   `stated_allocation` are NOT in pull; they act via movement, pull_quality, pull_state, or validation.

7. **Experience-layer architecture (verified).** The experience layer consumes only:
   `experience_candidate_directions` (synthesis), `the_narrowings_panel.bands` (synthesis),
   `ConstraintsOutput` (engine: body_capacity.band for exertion exclusion, energy.band and time.band
   for constraint biases), inventory variant fields (directions, protocol, exertion, friction,
   magnitude, cost_tier; who_with is validation-only), and user status flags. No InputMap field is
   read directly; no orphan fields were found in the experience layer.

---

# Part A - Pages 1-7 (cross-cutting and texture)

## q1a - weekly activity texture (Q1, page 1)

1. **Prompt:** "In the average week and when not at work, tick whatever is typically true." (`:15`).
   Options (value -> label -> mapped letter): `a` "I do a regular activity outside home"
   (weekly_activity); `b` "I see friends and people I actually like" (sees_people); `c` "I make
   things and build stuff" (makes_things); `d` "I'm physically active" (active_body); `e` "I belong
   to a group or club" (belongs_to_group); `f` "I do things on my own for the sake of it"
   (solo_practice). `multiSelect`, `required:false` (`:14-26`).

2. **InputMap fields written:** `cross_direction.week_shape.{weekly_activity, sees_people,
   makes_things, active_body, belongs_to_group, solo_practice}` booleans, in
   `@/home/mark/WAEL/wael-ee/src/assembler/week-shape.ts:11-21` (a->weekly_activity, b->sees_people,
   c->makes_things, d->active_body, e->belongs_to_group, f->solo_practice). q1a and q1b share one
   `q1_week_shape_ticked` array (`answers.ts:68`).

3. **Engine consumers:** `computeLifeTextureBand` (texture flags, `derivations.ts:93-121`, band);
   `computeExpressionSpace` per direction (`derivations.ts:127-155`, affects expression_space label
   and pull_state held_attributed split); `computeExperientialNarrowingBand` contents count
   (`derivations.ts:212-258`, band); `computeRelationalNarrowingBand` is passed `sees_people` and
   `belongs_to_group` (`engine.ts:110-111`) - NOTE: per the settled verdict (cross-cutting finding 4),
   `belongs_to_group` is a DEAD-PARAM there (passed, never read in the body); `sees_people` is read.
   All band/label; none alter pull number directly. Confidence HIGH.

4. **Synthesis consumers:** life_texture_panel flags_present/absent + load_state
   (`life_texture_panel.ts:21-31`); comparison_surface absent-flag anchors
   (`comparison_surface.ts:84,257-260`); CONDITIONAL life_texture_summary / pattern_note sentences.
   Confidence HIGH.

5. **Render layer:** `tick_any` multi-select, not gated.

6. **Experience layer:** does not reach the experience layer directly (verified architecture).
   Routes: **R2** via the experiential and relational narrowing bands its flags feed (sees_people ->
   relational band; contents flags -> experiential band). The self-report items that anchor
   week_shape flags (`self_report_items.ts:46,83,93,112,122`) carry `influences_experience_layer:true`
   but that flag has NO code consumer in the experience layer (verified; spec-level intention only).
   Confidence HIGH.

7. **Schema / validation:** `week_shape` REQUIRED with all nine boolean flags
   (`validation.ts:133,149-159,745-773`). Removal -> validation FAILS.

8. **Locked-to:** nine-flag week_shape set (q1a six contents flags). Confidence HIGH.

**Confidence:** HIGH. **Note:** `belongs_to_group` dead-param on the relational band (hygiene flag,
finding 4).

## q1b - week load / variability (Q1, page 2)

1. **Prompt:** "For the week overall, which of these are true?" (`:36`). `g` "Work takes up a lot of
   my time" (work_dominates); `h` "Weekends are mostly spoken for" (weekends_consumed); `i` "No two
   weeks look the same" (varied_week). `multiSelect`, `required:false` (`:34-44`).

2. **InputMap fields written:** `cross_direction.week_shape.{work_dominates, weekends_consumed,
   varied_week}` (`week-shape.ts:12,13,20`).

3. **Engine consumers:** work_dominates/weekends_consumed = the two LOAD_FLAGS for life_texture_band
   (`derivations.ts:102-117`) and structural narrowing load count (`derivations.ts:164-209`, band).
   varied_week -> experiential band (`derivations.ts:232,254`), attention band
   (`derivations.ts:419-438`), and experience_seeker expression_space (`derivations.ts:140`).
   Band/label. Confidence HIGH.

4. **Synthesis consumers:** life_texture_panel load_state_label (`:28-31`) and pattern_note
   (varied_week). Confidence HIGH.

5. **Render layer:** `tick_any`, not gated.

6. **Experience layer:** does not reach the experience layer directly. Routes: **R2** via the
   structural, experiential, and attention narrowing bands. The `something_to_look_forward_to`
   anchor on varied_week (`self_report_items.ts:93`) is spec-only (`influences_experience_layer`
   unwired, verified). Confidence HIGH.

7. **Schema / validation:** same week_shape requirement. Removal -> FAILS.

8. **Locked-to:** nine-flag week_shape set. Confidence HIGH.

**Confidence:** HIGH.

## q2 - primary_load (page 2)

1. **Prompt:** "What's taking the most out of you at the moment?" (`:56`). `a` Work (paid_work); `b`
   Looking after someone (caregiving); `c` The house and the admin (household_admin); `d` Nothing
   much has a real claim on me (none). `required:true` (`:54-65`).

2. **InputMap field:** `cross_direction.primary_load`. `mapPrimaryLoad` (`answer-maps.ts:44-55`).
   Wired `cross-direction.ts:64`.

3. **Engine consumers:** `computeStructuralNarrowingBand` (`derivations.ts:178-206`, isLoadPrimary +
   low/moderate gates, band). Not in pull. Confidence HIGH.

4. **Synthesis consumers:** life_context_panel work_load_summary token (`life_context_panel.ts:47-57`,
   PRIMARY_LOAD_LABELS); CONDITIONAL pattern_paragraph sentence reads
   `input.cross_direction.primary_load === 'caregiving' || 'paid_work'` (`shape_sentences.ts:118-119`).
   Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** does not reach the experience layer directly. Route: **R2** via the
   structural narrowing band. Confidence HIGH.

7. **Schema / validation:** REQUIRED (`validation.ts:137`), categorical (`:656-662`). Removal -> FAILS.

8. **Locked-to:** none. Confidence HIGH.

**Confidence:** HIGH.

## q3 - paid_work_relationship (page 3)

1. **Prompt:** "Thinking about work, select which describes your situation best." (`:76`). `a` "It
   stays at work" (functional); `b` "It follows me home..." (consuming); `c` "It takes up most of my
   waking life" (defining); `d` "I am between things..." (between); `e` "It is mine by choice"
   (chosen); `f` "It is just a job on the side" (peripheral); `g` "Retired or no longer working"
   (peripheral). `required:true` (`:74-86`).

2. **InputMap field:** `cross_direction.paid_work_relationship`. `mapPaidWorkRelationship`
   (`answer-maps.ts:57-77`); g collapses to peripheral, engine `endured` never produced (comment
   `:74`). Wired `cross-direction.ts:63`.

3. **Engine consumers:** `computeIdentityNarrowingBand` (`derivations.ts:313,322-343`, band). Not in
   pull. Confidence HIGH.

4. **Synthesis consumers:** life_context_panel work_load_summary token (`PAID_WORK_RELATIONSHIP_LABELS`,
   `:51-52`); CONDITIONAL pattern_paragraph sentences read `=== 'consuming'` (`shape_sentences.ts:140,
   150`) and `=== 'functional'` (`:160`). Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** does not reach the experience layer directly. Route: **R2** via the
   identity narrowing band. Confidence HIGH.

7. **Schema / validation:** REQUIRED (`validation.ts:136`), categorical (`:649-655`). Removal -> FAILS.

8. **Locked-to:** none, but `endured` enum unreachable from manifest+mapper.

**Confidence:** HIGH. **CHECK-AGAIN:** `endured` enum never produced (possible dead enum / reserved).

## q4 - life_shape_duration (page 4)

1. **Prompt:** "How long has your life been roughly the shape it's in now?" (`:98`). `a` recent; `b`
   sustained; `c` long. `required:true` (`:96-105`).

2. **InputMap field:** `cross_direction.life_shape_duration`. `mapLifeShapeDuration`
   (`answer-maps.ts:7-16`). Wired `cross-direction.ts:59`. ALSO feeds `deriveLifeStage`
   (`life-stage.ts:30,48`).

3. **Engine consumers:** `computePullQuality` suppressed-standard/deep branches read it
   (`direction.ts:163,169`) - affects pull_quality label / firing set. Structural band
   (`derivations.ts:182-183`) and identity band (`:328-329`). Feeds life_stage Rule 1
   (`life-stage.ts:47-50`). Confidence HIGH.

4. **Synthesis consumers:** read DIRECTLY in `buildPatternParagraph` for sci_band + duration_band
   (`synthesise.ts:85-86,122`); CONDITIONAL shape sentences (`shape_sentences.ts:171,182,281,299`).
   Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** NOT read directly (verified architecture; the experience layer reads no
   InputMap field). `EXPERIENCE.md:40` lists `inputMap.cross_direction.life_shape_duration` as a
   diagnostic-only input, but no read site exists in the verified code trace of `src/ui/experience/` -
   spec-level listing only (see flagged-for-human list). Routes: **R2** via the structural and
   identity narrowing bands; **R1** insofar as its pull_quality branches alter the firing set.
   Confidence HIGH on the architecture.

7. **Schema / validation:** REQUIRED (`validation.ts:132`), categorical (`:626-632`). Removal -> FAILS.

8. **Locked-to:** feeds both life_shape_duration and life_stage. Confidence HIGH.

**Confidence:** HIGH.

## q5 - recent_life_shape_change + replacement_structure_exists (page 5)

1. **Prompt:** "In the last three years, has a big part of your life ended or changed?" (`:117`). `a`
   "Nothing much has ended or changed" (no / no-replacement); `b` "Something ended, and something has
   grown in its place" (yes / replacement yes); `c` "Something ended, and I'm still in the
   in-between" (yes / replacement no). `required:true` (`:115-124`).

2. **InputMap fields (TWO from one answer):** `cross_cutting.recent_life_shape_change`
   (`mapRecentLifeShapeChange`, `answer-maps.ts:18-27`: a->no, b->yes, c->yes) AND
   `cross_cutting.replacement_structure_exists` (`interpretQ5`, `cross-cutting.ts:14-28`: a->no,
   b->yes, c->no). Wired `cross-cutting.ts:42-43`.

3. **Engine consumers:** `computeCrossCuttingOutputs` `between_shapes` = recent_life_shape_change yes
   && replacement_structure_exists no (`crossCutting.ts:15-17`, output/gate). recent_life_shape_change
   feeds life_stage Rule 1 (`life-stage.ts:31,48`). Confidence HIGH.

4. **Synthesis consumers:** cross_cutting_panel between_shapes (`synthesise.ts:156-162`);
   closing_between_shapes line (`closing_lines.ts:84-90`). CONDITIONAL. Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** does not reach the experience layer. Routes: none (between_shapes and
   life_stage are not among the consumed outputs). Confidence HIGH.

7. **Schema / validation:** both REQUIRED (`validation.ts:244-245`), categorical (`:870-883`).
   Removal -> FAILS (two fields).

8. **Locked-to:** paired helper `interpretQ5`; a/c both -> recent_life_shape_change yes but differ on
   replacement (`cross-cutting.ts:10-12`). Confidence HIGH.

**Confidence:** HIGH.

## q6 - capacity_strain (page 6)

1. **Prompt:** "Right now, is there more being asked of you than you can comfortably manage?" (`:136`).
   `a` "No, I have got the room..." (no); `b` "Tight, but I manage" (no); `c` "Yes, more than I can
   keep up with" (yes). `required:true` (`:134-143`).

2. **InputMap field:** `cross_direction.capacity_strain`. `mapCapacityStrain` (`answer-maps.ts:144-153`).
   Wired `cross-direction.ts:58`.

3. **Engine consumers:** `computePullState` adds `capacity_strain` when capacity_strain yes &&
   livePull >= 50 (`direction.ts:85`); pull_state label, does not change pull number. Confidence HIGH.

4. **Synthesis consumers:** closing_capacity_strain per-direction line (`closing_lines.ts:100-115`);
   `active_with_tension` matched-direction sentence reads `pull_state.includes('capacity_strain')`
   (`predicates.ts:47-55`). CONDITIONAL. Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** does not reach the experience layer. Routes: none (it affects only the
   pull_state label, not pull, not a narrowing band, not a ConstraintsOutput band). Confidence HIGH.

7. **Schema / validation:** REQUIRED (`validation.ts:131`), categorical (`:619-625`). Removal -> FAILS.

8. **Locked-to:** a/b both -> no (3->2 collapse). Confidence HIGH.

**Confidence:** HIGH.

## q7 - sociality_default (page 7)

1. **Prompt:** "Left to yourself, do you lean towards people or towards your own company?" (`:155`).
   `a` "I'm mostly happiest in my own company" (solitary_by_default); `b` "...around people I like"
   (social_by_default); `c` "A genuine mix..." (balanced). `required:true` (`:153-162`).

2. **InputMap field:** `cross_direction.sociality_default`. `mapSocialityDefault`
   (`answer-maps.ts:79-88`). Wired `cross-direction.ts:62`.

3. **Engine consumers:** **DEAD** for scoring (settled verdict, finding 4). Passed to
   `computeRelationalNarrowingBand` (`engine.ts:109`, `derivations.ts:388`) but NOT referenced in the
   body (`:393-415`) - DEAD-PARAM. Passed through to
   `EngineOutput.cross_direction.sociality_default` (`engine.ts:136`). Confidence HIGH.

4. **Synthesis consumers:** **LOAD-BEARING** (settled verdict). sociality_summary token reads
   `output.cross_direction.sociality_default` via SOCIALITY_LABELS (`life_context_panel.ts:60-66`)
   and drives the 11 sociality_summary prose sentences, distinguishing e.g. "solitary and content"
   from "solitary but the absence still registers". Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** **NOT READ** (settled verdict, verified against code: no sociality reference
   anywhere in `src/ui/experience`). Routes: none. Confidence HIGH.

7. **Schema / validation:** **REQUIRED** (in CROSS_DIRECTION_REQUIRED, `validation.ts:135`;
   non-optional in the InputMap type; categorical validity check `:642-648`). Cannot be removed
   without schema/validation edits; removal also strips sociality_summary of its token.

8. **Locked-to:** none. Confidence HIGH.

**Confidence:** HIGH. **SETTLED VERDICT: Q7 is NOT cuttable.** It does not score and does not drive
recommendations, but it is schema-required and drives synthesis prose. Code-hygiene note for the
build thread: the unused `sociality_default` (and `belongs_to_group`) parameters on
`computeRelationalNarrowingBand` are dead-param cruft - remove the unused params, OR wire temperament
into the relational narrowing band if that was the original intent.

---

# Part B - Pages 8-13 (the six direction cards, matched set)

Shared assembler entry points for every `card-{direction}-a/-b/-c`: `buildPerDirectionObservables`
(`@/home/mark/WAEL/wael-ee/src/assembler/per-direction-observable.ts:14-104`) and `buildPerDirections`
(`@/home/mark/WAEL/wael-ee/src/assembler/per-direction.ts:8-60`). `directionKey` in manifest `config`
selects which `directions.<key>` slice each card writes. Full trace given on contributor; the other
five reference it.

## card-contributor-a (card A, page 8)

1. **Prompt:** "Beyond the people you've already got to look after, how much do you do for others by
   choice these days?" (`:178`). `a` "Nothing, really"; `b` "Occasionally but not much"; `c` "Doing a
   bit more of it recently"; `d` "It's something I do regularly". `required:true`,
   `config.directionKey:'contributor'` (`:176-187`).

2. **InputMap fields (TWO from card-a):** `directions.contributor.current_movement` (a=0,b=33,c=67,
   d=100; `per-direction-observable.ts:36-43`) AND `directions.contributor.recent_action`
   (a=none,b=some,c=recent,d=recent; `:45-52`). card-a also feeds assembler-derived `saturation`
   (`saturation.ts:4-8`), `stated_strength` mild-saturated test (`stated-strength.ts:23`), `felt_cost`
   movement rule (`felt-cost.ts:50-53`), and the `vitality` mean is separate (`per-direction.ts:13`).

3. **Engine consumers:** `current_movement` -> `computeMovement` identity (`derivations.ts:85-87`) ->
   quadrant (`direction.ts:50-57`) and `surfaced` rule (`direction.ts:288-298`) - affects rank/
   surfacing. `recent_action` -> `recentActionToNumeric` 0/50/100 in `computePull` (0.2,
   `derivations.ts:76`) - affects pull/rank; phantom condition `recent_action === 'none'`
   (`direction.ts:143,153`). Confidence HIGH.

4. **Synthesis consumers:** both merged into MergedDirectionView (`shape_sentences.ts:39-40`) but no
   predicate reads them directly; reach prose via `movement`, `pull`, `quadrant`, `pull_quality`. Card
   "Pull" field and chart movement (`chart_data.ts:29`). Confidence HIGH.

5. **Render layer:** `single_select` inside `kind:'card'`. Not gated. `directionKey` config drives the
   slice.

6. **Experience layer:** does not reach the experience layer directly. Route: **R1** - pull and
   firing feed `experience_candidate_directions` (`experience_candidates.ts:20-44`), which the
   experience layer reads at `recommend.ts:228` (buildCandidateMap -> tier assignment, firing >
   past_presence_only > anchored_stretch > none). Confidence HIGH.

7. **Schema / validation:** `current_movement` and `recent_action` REQUIRED per direction
   (`validation.ts:107-108`), number / categorical (`:378-383`). Removing card-a -> two required
   fields missing -> FAILS.

8. **Locked-to:** MATCHED SET (card-a). The a/b/c/d rungs and 0/33/67/100 + none/some/recent/recent
   maps are identical across all six cards (manifest inline comments `:181-184`; shared assembler
   maps). Confidence HIGH.

**Confidence:** HIGH.

## card-contributor-b (card B, page 8)

1. **Prompt:** "Picture doing more of it in your life. What's your first reaction?" (`:192`). `a`
   "Does nothing for me" (none); `b` "Wouldn't mind more" (mild); `c` "It's what I genuinely want"
   (quickening). `required:true`, `config.directionKey:'contributor', felt:true` (`:190-200`).

2. **InputMap field:** `directions.contributor.anticipation` (`per-direction-observable.ts:54-60`).
   card-b is ALSO the GATE for specificity (card-c) and feeds `stated_strength`
   (`stated-strength.ts:12-34`), `felt_cost`, `saturation` (`saturation.ts:5`), and `life_stage`
   (`deriveLifeStage` reads card_b via `mapCardBToAnticipation`, `life-stage.ts:18-44,62`).

3. **Engine consumers:** `anticipation` -> `anticipationToNumeric` 0/50/100 in `computePull` (0.2,
   `derivations.ts:75`) - pull/rank. pull_quality phantom (`:142`), suppressed-standard (`:160`),
   ghost (`:184`), saturated (via assembler). Confidence HIGH.

4. **Synthesis consumers:** merged but no predicate reads `anticipation` directly; surfaces as the
   card "Anticipation" field reading `input.directions[d].anticipation` (`cards.ts:195`,
   ANTICIPATION_TOKENS), plus via pull/pull_quality. Confidence HIGH.

5. **Render layer:** `single_select`, `felt:true`. Its answer GATES card-c (`conditionalOn`, `:212`,
   `not_equals 'a'`): card-b == 'a' hides card-c.

6. **Experience layer:** does not reach the experience layer directly. Route: **R1** via pull /
   firing -> `experience_candidate_directions`. Confidence HIGH.

7. **Schema / validation:** `anticipation` REQUIRED (`validation.ts:106`), categorical (`:380-381`).
   Removal -> FAILS.

8. **Locked-to:** MATCHED SET (felt options a/b/c). Confidence HIGH.

**Confidence:** HIGH.

## card-contributor-c (card C, page 8, gated)

1. **Prompt:** "How clear is it? A general pull, or something specific?" (`:204`). `a` "Just a general
   pull, nothing specific" (none); `b` "Something's there, but not pinned down" (partial); `c` "Yes, a
   specific thing I keep coming back to" (strong); `skipped` "Skip" (none). `required:false`,
   `conditionalOn card-contributor-b not_equals 'a'` (`:202-213`).

2. **InputMap field:** `directions.contributor.specificity` (`per-direction-observable.ts:62-77`).
   Gated on DERIVED anticipation: if `anticipation === 'none'` then none regardless of card-c
   (`:64-67`); else a->none, b->partial, c->strong, skipped->none (`:70-76`). Gate is on the felt
   none-state, not the raw card-b button (comment `:62-63`).

3. **Engine consumers:** `specificityToNumeric` 0/50/100 in `computePull` (0.1, `derivations.ts:77`);
   pull_state held_attributed split (`specificity === 'strong'`, `direction.ts:77`); felt_cost rules
   (`felt-cost.ts:20-28`); ghost (`direction.ts:185`); `direction_specificity_none_count` ->
   psychological narrowing band (`engine.ts:48-54`, `derivations.ts:268,273`); output `specificity`
   (`direction.ts:281`). Confidence HIGH.

4. **Synthesis consumers:** chart bubble `specificity_size` (`chart_data.ts:30`);
   `depleted_band_with_held` sentence reads `d.specificity === 'strong'` (`predicates.ts:78-79`).
   Confidence HIGH.

5. **Render layer:** `single_select`, GATED via `conditionalOn` on card-b != 'a' (`:212`); when hidden,
   resolves to none through the assembler gate.

6. **Experience layer:** does not reach the experience layer directly. Routes: **R2** via
   specificity -> specificity_none_count -> psychological narrowing band; **R1** via its 0.1 pull
   weight. Confidence HIGH.

7. **Schema / validation:** `specificity` REQUIRED per direction (`validation.ts:110`), categorical
   (`:386-387`). UI `required:false`, but the assembler always emits a value, so the field is always
   present. Field removal -> FAILS.

8. **Locked-to:** MATCHED SET (specificity options). freedom_designer-c varies surface wording for
   identical values. Gate-on-derived-none is deliberate (`per-direction-observable.ts:62-63`); do not
   revert to `cardB === 'a'`. Confidence HIGH.

**Confidence:** HIGH.

## card-experience-seeker-a / -b / -c (page 9)

Same structure/mapping/gate/validation as the contributor card, writing
`directions.experience_seeker.{current_movement, recent_action, anticipation, specificity}`. Prompts:
a "How much do you actually do that's new these days?" (`:226`); b felt prompt (`:240`); c "How clear
is it?..." (`:252`). Options identical. Gate `card-experience-seeker-b != 'a'` (`:260`).
Direction-specific: `experience_seeker` pull feeds `experience_pull` used by experiential and
attention narrowing bands (`engine.ts:45-47,82,118`); expression_space reads `weekly_activity &&
varied_week` (`derivations.ts:140`). Experience routes: R1 (pull/firing) plus R2 (its pull feeds the
experiential and attention bands). **Confidence:** HIGH. Matched-set member.

## card-freedom-designer-a / -b / -c (page 10)

Same structure writing `directions.freedom_designer.*`. Prompts: a "How often do you get time that's
yours...?" (`:274`); b felt (`:288`); c with **deliberately different option wording**: `a` "Just a
general wish for more time"; `b` "Some sense of what I'm missing"; `c` "I know exactly the time I want
back..." (`:302-304`), values still none/partial/strong. Gate `card-freedom-designer-b != 'a'`
(`:308`). Direction-specific: expression_space reads `solo_practice || (!work_dominates &&
!weekends_consumed)` (`derivations.ts:142-146`); was_once domain map `time_as_yours` (`direction.ts:33`).
Experience routes: R1 as per the contributor card. **Confidence:** HIGH. **Locked-to:** matched set,
but card-c surface wording intentionally varies (same values) - do not unify.

## card-growth-focused-a / -b / -c (page 11)

Same structure writing `directions.growth_focused.*`. Prompts: a "How much is getting better at
something a part of your life these days?" (`:322`); b felt (`:336`); c generic (`:348`). Gate
`card-growth-focused-b != 'a'` (`:356`). Direction-specific: expression_space reads `active_body ||
weekly_activity` (`derivations.ts:147-149`); was_once domain map is `[]` but `computeWasOnceRenders`
returns true for growth_focused regardless (`direction.ts:95`). Experience routes: R1 as per the
contributor card. **Confidence:** HIGH. **CHECK-AGAIN:** growth_focused `was_once_renders`
short-circuits true with empty domain map - confirm intended.

## card-creator-a / -b / -c (page 12)

Same structure writing `directions.creator.*`. Prompts: a "How much is making and fixing things a part
of your life these days?" (`:370`); b felt (`:384`); c generic (`:396`). Gate `card-creator-b != 'a'`
(`:404`). expression_space reads `makes_things` (`derivations.ts:133-135`); was_once map `making`
(`direction.ts:34`); dedicated held-unexpressed card sentence (`cards.ts:33-37`). Experience routes:
R1 as per the contributor card. **Confidence:** HIGH.

## card-relationship-rebuilder-a / -b / -c (page 13)

Same structure writing `directions.relationship_rebuilder.*`. Prompts: a "How much is real time with
the people who matter a part of your life these days?" (`:418`); b felt (`:432`); c generic (`:444`).
Gate `card-relationship-rebuilder-b != 'a'` (`:452`). expression_space reads `sees_people`
(`derivations.ts:136-138`); was_once map `conversation_depth, being_known, friendship, intimacy`
(`direction.ts:36`); dedicated held-unexpressed card sentence (`cards.ts:38-43`). Experience routes:
R1 as per the contributor card. **Confidence:** HIGH.

---

# Part C - Pages 14-35 (remaining questions)

## q8 - past_presence ticked directions (page 14)

1. **Prompt:** "Now think back, were any of these ever a real part of your life in the past?" (`:465`).
   Six direction-keyed tick options (contributor, experience_seeker, freedom_designer, growth_focused,
   creator, relationship_rebuilder). `multiSelect`, `required:false` (`:463-477`).

2. **InputMap field:** `directions.<dir>.past_presence` = yes if ticked else no
   (`per-direction-observable.ts:79-80`). One question writes past_presence of all six directions.

3. **Engine consumers:** `computePastRelationship` (`direction.ts:59-67`, returning/was_once/new/never
   label + was_once_renders); pull_quality phantom requires `past_presence === 'no'` (`:145`),
   suppressed requires `'yes'` (`:161,167`). Affects label and (via suppressed) firing. Confidence
   HIGH.

4. **Synthesis consumers:** headline fallback `pastPresenceCount` (`headline.ts:57-59`);
   experience_candidates past_presence_only tier (`experience_candidates.ts:37`); merged-view
   `past_presence` read by suppressed shape sentences (`shape_sentences.ts:278,294`). CONDITIONAL.
   Confidence HIGH.

5. **Render layer:** `tick_any` inside `kind:'past_presence_pair'` page (shared with q9). Not gated.

6. **Experience layer:** does not reach the experience layer directly. Route: **R1** - drives the
   `past_presence_only` priority tier of `experience_candidate_directions`, which the experience
   layer's tier assignment consumes (verified: buildCandidateMap / assignTier, `recommend.ts:50-65,
   97-131`). Confidence HIGH.

7. **Schema / validation:** `past_presence` REQUIRED per direction (`validation.ts:109`), categorical
   (`:384-385`). Removal -> FAILS.

8. **Locked-to:** six direction keys; paired with q9 (past_presence_pair). Confidence HIGH.

**Confidence:** HIGH.

## q9 - stopped_expecting ticked directions (page 14)

1. **Prompt:** "And of those, are there any you always meant to get back to, and somewhere along the
   line stopped thinking you would?..." (`:481`). Six direction-keyed options. `multiSelect`,
   `required:false` (`:479-491`).

2. **InputMap field:** `directions.<dir>.stopped_expecting` = yes if ticked else no
   (`per-direction-observable.ts:82-83`).

3. **Engine consumers:** `computePullState` adds `stopped_expecting` (`direction.ts:84`); felt_cost
   rule 6 reads `stopped_expecting === 'yes'` (`felt-cost.ts:45-48`) - **so it affects felt_cost and
   thus pull**. Confidence HIGH.

4. **Synthesis consumers:** closing_stopped_expecting per-direction line (`closing_lines.ts:117-129`);
   `closing_stopped_expecting` sentence reads `pull_state.includes('stopped_expecting')`
   (`shape_sentences.ts:653-659`). CONDITIONAL. Confidence HIGH.

5. **Render layer:** `tick_any`, past_presence_pair page. No hard render gate (semantically "of those"
   from q8).

6. **Experience layer:** does not reach the experience layer directly. Route: **R1** (weak) via
   felt_cost -> pull -> candidates. Confidence HIGH.

7. **Schema / validation:** `stopped_expecting` REQUIRED per direction (`validation.ts:113`),
   categorical (`:392-393`). Removal -> FAILS.

8. **Locked-to:** six direction keys; paired with q8. Confidence HIGH.

**Confidence:** HIGH.

## q10 - direction_chosen + would_reach_for (TRIAD arm 1, page 16)

1. **Prompt:** "Saturday comes free, what do you actually do with it?" (`:508`). Eight options: six
   directions + `rest` "Nothing in particular. Rest..." + `none` "Could not tell you...". `required:
   true` (`:506-521`).

2. **InputMap fields (from one answer via `interpretQ10`):** `cross_direction.direction_chosen`
   (direction / 'rest' / 'none'; `cross-direction.ts:28-34`) AND `directions.<dir>.would_reach_for`
   (yes for chosen, no for others; rest/none -> all no; `per-direction-observable.ts:85-90`). Also
   feeds `deriveLifeStage` Rule 4 (`life-stage.ts:45,63`).

3. **Engine consumers:** `direction_chosen` -> pull_quality behaviourally_divergent
   (`direction.ts:173-174`), ghost (`:186`), reach triad (`derivations.ts:462-549`: Q10a is the
   first arm of computeReachConfidence / computeReachState). `would_reach_for` -> validation Rule 4
   (`validation.ts:904-946`, GATE) and phantom condition (`direction.ts:144,154`). `would_reach_for`
   NOT in computePull. Confidence HIGH.

4. **Synthesis consumers:** `would_reach_for` merged (`shape_sentences.ts:42`) but no predicate reads
   it directly; reaches prose via phantom/behaviourally_divergent pull_quality. `direction_chosen`
   not read directly by synthesis. Confidence HIGH.

5. **Render layer:** `single_select`, not gated. TRIAD arm.

6. **Experience layer:** does not reach the experience layer directly. Route: **R1** via the firing
   set / candidates (its pull_quality effects, including the ghost/behaviourally_divergent branches,
   alter firing). Confidence HIGH.

7. **Schema / validation:** `direction_chosen` REQUIRED (`validation.ts:130`); `would_reach_for`
   REQUIRED per direction (`:111`). HARD Rule 4 cross-check (`:904-946`): chosen direction must have
   yes and all others no; rest/none -> all no. Removal -> FAILS.

8. **Locked-to:** TRIAD (q10/q10b/q10c, manifest `:496-501`); also locked to would_reach_for via Rule
   4. Confidence HIGH.

**Confidence:** HIGH.

## q11 - psychological_filtering (page 17)

1. **Prompt:** "Think of the last time you wanted something for yourself... What happened to it?"
   (`:532`). `a` "I wanted it and had a go" (does_not_filter); `b` "I knew what I wanted but kept it
   to myself" (filters_some); `c` "I felt something, but it never became anything..." (filters_some);
   `d` "I cannot easily remember the last time I wanted something just for me" (filters_pervasively).
   `required:true` (`:530-539`).

2. **InputMap field:** `cross_direction.psychological_filtering`. `mapPsychologicalFiltering`
   (`answer-maps.ts:90-103`; b and c both -> filters_some). Wired `cross-direction.ts:65`.

3. **Engine consumers:** `computePsychologicalNarrowingBand` (`derivations.ts:272-307`, band). Not in
   pull. Confidence HIGH.

4. **Synthesis consumers:** CONDITIONAL pattern_paragraph sentences read
   `input.cross_direction.psychological_filtering` (`shape_sentences.ts:141,151`); passed through to
   `EngineOutput.cross_direction.psychological_filtering` (`engine.ts:139`). Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** does not reach the experience layer directly. Route: **R2** - main driver of
   the psychological narrowing band, which reaches recommendations via `the_narrowings_panel.bands`
   and narrowingFitScore (`recommend.ts:137-154`). Confidence HIGH.

7. **Schema / validation:** REQUIRED, dedicated rule
   `cross_direction_psychological_filtering_missing` (`validation.ts:664-677`). Removal -> FAILS.

8. **Locked-to:** b/c collapse to filters_some. Confidence HIGH.

**Confidence:** HIGH.

## domain_current_state_e1 - four sliders (page 18)

1. **Prompt:** "For each slider, adjust it to where the item is in your life." help "Left is not,
   right is fully there" (`:554-555`). `renderer: domain_sliders`, `config.domains:
   ['time_as_yours','energy_as_resource','felt_aliveness','body_physical_aliveness']`, 0-100,
   `required:true` (`:552-557`).

2. **InputMap fields (one per slider):** `domains.time_as_yours.current_state`,
   `domains.energy_as_resource.current_state`, `domains.felt_aliveness.current_state`,
   `domains.body_physical_aliveness.current_state` (pass-through into `answers.domain_current_state`
   then `buildDomains`, `domains.ts:81-101`). These four are UNIVERSAL_DOMAINS - `wanting` omitted
   (`domains.ts:53-54,90-94`). The mean of all twelve current_state values is `vitality`
   (`per-direction.ts:13-14`) fed to `deriveFeltCost`.

3. **Engine consumers (per slider):** all four -> `computeDomainPresenceOutputs` (`domainPresence.ts:26-55`:
   >=60 intact, <60 fires + value). `felt_aliveness.fires` -> energetic band (`engine.ts:62,100`) and
   attention band (`:116`). `energy_as_resource.fires` -> energetic band (`:63,101`). All twelve
   current_state -> vitality -> `deriveFeltCost` rule 8 (`felt-cost.ts:55-58`) -> felt_cost -> pull
   (INDIRECT score effect for every slider). Confidence HIGH.

4. **Synthesis consumers:** domains_panel firing groups, intensity = 100 - current_state
   (`domains_panel.ts:35-50,75-82`); intact_callout (`:53-55`); comparison_surface reduced_domain
   anchors/surfaced (`comparison_surface.ts:72-78,240-256`). Confidence HIGH.

5. **Render layer:** `domain_sliders`, four rows, 0-100. Not gated.

6. **Experience layer:** does not reach the experience layer directly. Routes: **R2** via the
   energetic and attention narrowing bands (felt_aliveness / energy_as_resource fires); **R1**
   (indirect) via vitality -> felt_cost -> pull -> candidates. Note: NOT R3 - the ConstraintsOutput
   energy band comes from q25, not these sliders. Confidence HIGH.

7. **Schema / validation:** each domain requires `current_state` (0-100) + `past_presence`
   (`validation.ts:446-457`); universal-wanting domains must not carry non-'wants' wanting
   (`invalid_universal_wanting`, `:462-475`). Removal -> FAILS (four current_state absent).

8. **Locked-to:** E1 = the four universal-wanting domains (`domains.ts:5-10`), locked to the
   no-wanting rule; 0-100 bare-slider scale shared with E2/E3. Confidence HIGH.

**Confidence:** HIGH. Individual sliders `time_as_yours`, `energy_as_resource`, `felt_aliveness`,
`body_physical_aliveness`; the latter two additionally drive narrowing bands.

## domain_current_state_e2 - four sliders (page 19)

1. **Prompt:** "For each one, give it a number from 0 to 100..." (`:572`). `config.domains:
   ['curiosity','making','conversation_depth','being_known']`, 0-100, `required:true` (`:570-574`).

2. **InputMap fields:** `domains.{curiosity, making, conversation_depth, being_known}.current_state`.
   NON-universal domains - `wanting` derived (`domains.ts:46-74`, depends on past_presence/peace).

3. **Engine consumers:** domain presence (`domainPresence.ts`); `curiosity.fires` -> psychological
   band (`engine.ts:64,89`); `conversation_depth`/`being_known` fires -> relational band
   (`engine.ts:67-68,107-108`); `making` -> creator was_once map (`direction.ts:34,97-99`); all feed
   vitality. Confidence HIGH.

4. **Synthesis consumers:** domains_panel, comparison_surface (as E1). Confidence HIGH.

5. **Render layer:** `domain_sliders`, four rows. Not gated.

6. **Experience layer:** does not reach the experience layer directly. Routes: **R2** via the
   psychological and relational narrowing bands; **R1** (indirect) via vitality -> pull. Confidence
   HIGH.

7. **Schema / validation:** each domain requires current_state + past_presence + (non-universal)
   wanting (`validation.ts:446-479`). Removal -> FAILS.

8. **Locked-to:** E2 grouping; 0-100 scale shared. Confidence HIGH.

**Confidence:** HIGH.

## domain_current_state_e3 - four sliders (page 20)

1. **Prompt:** identical 0-100 prompt (`:589`). `config.domains:
   ['friendship','intimacy','mattering','spiritual']`, `required:true` (`:587-591`).

2. **InputMap fields:** `domains.{friendship, intimacy, mattering, spiritual}.current_state`.

3. **Engine consumers:** domain presence; `friendship.fires`/`intimacy.fires` -> relational band
   (`engine.ts:65-66,105-106`); `mattering` -> contributor was_once map (`direction.ts:38`); all feed
   vitality. Confidence HIGH.

4. **Synthesis consumers:** domains_panel, comparison_surface. Confidence HIGH.

5. **Render layer:** `domain_sliders`, four rows. Not gated.

6. **Experience layer:** does not reach the experience layer directly. Routes: **R2** via the
   relational narrowing band; **R1** (indirect) via vitality -> pull. Confidence HIGH.

7. **Schema / validation:** non-universal domains require wanting. **`spiritual` has a STRICTER rule**:
   `validateSpiritualDomain` (`validation.ts:492-559`) makes wanting mandatory; emits
   `domain_spiritual_missing` / `domain_spiritual_malformed`. Removal -> FAILS (dedicated codes).

8. **Locked-to:** E3 grouping; spiritual is the special-cased mandatory-wanting domain. 0-100 scale
   shared. Confidence HIGH.

**Confidence:** HIGH.

## q24 - domain past_presence (page 21)

1. **Prompt:** "And which of these have ever been a real, active part of your life, at any point...?"
   (`:603`). Twelve domain-keyed tick options. `multiSelect`, `required:false` (`:601-620`).

2. **InputMap field:** `domains.<domain>.past_presence` = yes if ticked else no
   (`answers.past_presence_selection` -> `domains.ts:83-85`). Also feeds `computeFadedDomains`
   (`domains.ts:32-44`, the peace-discriminator row set) and `deriveWanting` (`domains.ts:46-74`).

3. **Engine consumers:** domain `value` in `computeDomainPresenceOutputs` depends on past_presence
   (`domainPresence.ts:40-48`: reduced_wants_back / reduced_at_peace / wants_but_never_had / never).
   Affects domain value/label. Confidence HIGH.

4. **Synthesis consumers:** domains_panel reduced groups and comparison_surface read resulting domain
   `value` (`domains_panel.ts:13-50`). CONDITIONAL. Confidence HIGH.

5. **Render layer:** `tick_any`, twelve rows. Not gated. Drives the dynamic peace_discriminator rows
   (faded = past_presence yes + current_state < 60).

6. **Experience layer:** does not reach the experience layer. Routes: none - domain values feed
   domains_panel / comparison_surface, none of which is among the consumed outputs
   (experience_candidate_directions, the_narrowings_panel.bands, ConstraintsOutput). Confidence HIGH.

7. **Schema / validation:** `past_presence` REQUIRED on every domain object (`validation.ts:447,456`).
   But removing q24 -> assembler defaults past_presence='no' for all (empty selection) -> validation
   still PASSES structurally while domain values silently distort. Flagged.

8. **Locked-to:** twelve domain keys mirror E1/E2/E3 sliders; wanting derivation + faded-set depend on
   the q24 / sliders / peace-discriminator pairing. Confidence HIGH.

**Confidence:** HIGH. **CHECK-AGAIN:** q24 removal would NOT fail validation (past_presence defaults
to no) but silently distorts domain values.

## q25 - energy_availability (page 22)

1. **Prompt:** "In a normal week, how many nights have you actually got enough in the tank to do
   something of your own?" (`:632`). a-e None/Maybe one/A couple/Three or four/Most nights
   (10/30/50/70/90). `required:true` (`:630-641`).

2. **InputMap field:** `constraints.energy_availability` via `ENERGY_AVAILABILITY_BANDS`
   (`constraints.ts:30-32`, `params.ts:32`).

3. **Engine consumers:** `computeSustainedConstraintIntensity` 0.2 weight on (100 - energy)
   (`derivations.ts:60`) -> SCI (gates suppressed pull_quality, feeds prose). energy band/fires
   (`realisticConstraints.ts:41,48-52`); energy band -> energetic band (`engine.ts:98`). Confidence
   HIGH.

4. **Synthesis consumers:** constraints_panel energy line + intact_callout (`constraints_panel.ts:25-66`);
   SCI in pattern_paragraph sci_band (`synthesise.ts:84-86`); comparison_surface `more_energy`
   constraint anchor (`self_report_items.ts:74`). Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** **R3, CODE-VERIFIED.** `constraints.energy.band` is read by the experience
   layer at `recommend.ts:185-206` (constraintBiases): when the band is heavy_depletion, variants
   with friction <= 2 get a +20 bias on composite_score. Also feeds R2 indirectly (energy band ->
   energetic narrowing band). Confidence HIGH.

7. **Schema / validation:** REQUIRED, number 0-100 (`validation.ts:236,841-842`). Removal -> FAILS.

8. **Locked-to:** 10/30/50/70/90 band ladder (`params.ts:32`, PROVISIONAL). Confidence HIGH.

**Confidence:** HIGH.

## q26 - time_availability (page 23)

1. **Prompt:** "In a normal week, how much of your time is left over once work, the house, and other
   people have taken their share?" (`:653`). `renderer: slider`, 0-100, minLabel "None left", maxLabel
   "Loads left", `required:true` (`:651-660`).

2. **InputMap field:** `constraints.time_availability` - PASS-THROUGH of the slider value
   (`constraints.ts:47`).

3. **Engine consumers:** `computeSustainedConstraintIntensity` 0.2 weight (100 - time)
   (`derivations.ts:61`); time band/fires (`realisticConstraints.ts:42,53-57`); time band ->
   structural band (`engine.ts:76`, `derivations.ts:187,204`). Confidence HIGH.

4. **Synthesis consumers:** constraints_panel time line; comparison_surface `time` constraint anchor.
   Confidence HIGH.

5. **Render layer:** `slider` (single 0-100), not gated. Slider labels from config.

6. **Experience layer:** **R3, CODE-VERIFIED.** `constraints.time.band` is read at
   `recommend.ts:185-206` (constraintBiases): when the band is heavy_time_pressure, variants with
   small magnitude get a +20 bias on composite_score. Also feeds R2 indirectly (time band ->
   structural narrowing band). Confidence HIGH.

7. **Schema / validation:** REQUIRED, number 0-100 (`validation.ts:237,843-844`). Removal -> FAILS.

8. **Locked-to:** none (raw 0-100 pass-through). Confidence HIGH.

**Confidence:** HIGH.

## q27 - body_capacity (page 24)

1. **Prompt:** "Your body, in practical terms. Which of these is nearest to what you can still
   actually do? (Pick one.)" (`:672`). `a` "Whatever I want" (85); `b` "Most things, though I notice
   it more..." (65); `c` "The everyday is fine, but the demanding stuff is going or gone" (45); `d`
   "It sets real limits on an ordinary day now" (25). `required:true` (`:670-679`).

2. **InputMap field:** `constraints.body_capacity` via `BODY_CAPACITY_BANDS` (`constraints.ts:35-37`,
   `params.ts:34`).

3. **Engine consumers:** `computeSustainedConstraintIntensity` 0.15 weight (100 - body_capacity)
   (`derivations.ts:62`); body band/fires (`realisticConstraints.ts:43,58-62`); body band ->
   energetic band (`engine.ts:99`, `derivations.ts:352,369`). Confidence HIGH.

4. **Synthesis consumers:** constraints_panel body_capacity line; comparison_surface
   `getting_back_in_shape` -> body domain/active_body (not the constraint directly,
   `self_report_items.ts:82-83`). Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** **R3, CODE-VERIFIED.** `constraints.body_capacity.band` is read at
   `recommend.ts:71-78` (excludedByExertion): variants whose exertion exceeds what the band allows
   are HARD-EXCLUDED before scoring. Also feeds R2 indirectly (body band -> energetic narrowing
   band). Confidence HIGH.

7. **Schema / validation:** REQUIRED, number 0-100 (`validation.ts:238,845-846`). Removal -> FAILS.

8. **Locked-to:** 85/65/45/25 band ladder (`params.ts:34`, PROVISIONAL). Confidence HIGH.

**Confidence:** HIGH.

## q28 - general_held_something (page 25)

1. **Prompt:** "Has there been anything on your mind lately you can't quite put your finger on,
   nothing you could pin to any one part of life? (Yes / No.)" (`:691`). `yes` / `no`. `required:true`
   (`:689-696`).

2. **InputMap field:** `cross_cutting.general_held_something` (identity map `mapGeneralHeldSomething`,
   `cross-cutting.ts:31-33,45`).

3. **Engine consumers:** `computeCrossCuttingOutputs` `held_unattributed` = general_held_something yes
   && no attributed holding exists (`crossCutting.ts:29-30`, output/gate). Confidence HIGH.

4. **Synthesis consumers:** cross_cutting_panel held_unattributed (`synthesise.ts:156-162`);
   closing_held_unattributed line (`closing_lines.ts:131-136`). CONDITIONAL. Confidence HIGH.

5. **Render layer:** `single_select` yes/no, not gated.

6. **Experience layer:** does not reach the experience layer. Routes: none (held_unattributed is not
   among the consumed outputs). Confidence HIGH.

7. **Schema / validation:** REQUIRED (`validation.ts:247`), categorical yes/no (`:891-897`). Removal ->
   FAILS.

8. **Locked-to:** none. Confidence HIGH.

**Confidence:** HIGH.

## q10b - reach_retrospective (TRIAD arm 2, page 26)

1. **Prompt:** "Think back to the last time you had a free stretch that was genuinely yours. What did
   you find yourself drawn to, even if you didn't get round to all of it?" (`:709`). Eight options:
   six directions + `rest` + `none` (surface wording varies from q10). `required:true` (`:707-721`).

2. **InputMap field:** `cross_direction.reach_retrospective` (optional engine field). **WIRED
   (verified, HIGH confidence):** q10b -> `interpretQ10` on `q10b_retrospective`
   (`cross-direction.ts:37-43`) -> `cross_direction.reach_retrospective`. The `answers.ts:48-50`
   comment claiming q10b "does NOT populate an engine field" is STALE/INCORRECT and should be fixed
   in code. Does NOT populate would_reach_for or direction_chosen.

3. **Engine consumers (verified):** `computeReachConfidence` (`derivations.ts:462-514`: returns
   'high' when all three triad arms match, or all three are rest/none; 'low' otherwise, including
   the incomplete-triad guard) and `computeReachState` (`derivations.ts:519-549`) read it;
   `computePullQuality` ghost branch reads it (`direction.ts:178-188`) and the surfacing ghost guard
   (`direction.ts:251-259`) - ghost zeroes live-pull, so it DOES affect rank/surfacing when the triad
   is complete. **What the triad computes:** reach_state = 'numb' (all three rest/none) /
   'buried_but_alive' (Q10a rest/none but the retrospective or counterfactual arm names a direction) /
   'surfaced' (otherwise). The 'buried_but_alive' state is the detector for the man whose want is
   alive but buried under fatigue. The triad triangulation IS real; the three-arm repetition is
   justified. Confidence HIGH.

4. **Synthesis consumers:** reach_state / reach_confidence are on `EngineOutput.cross_direction`
   (`engine.ts:152-153`) but no synthesis module reads them (grep of synthesis for `reach_` returned
   none). Confidence MEDIUM.

5. **Render layer:** `single_select`, not gated. TRIAD arm.

6. **Experience layer:** reach_state/reach_confidence are confirmed NOT read by the experience layer
   (verified: the layer consumes only experience_candidate_directions, the_narrowings_panel.bands,
   and ConstraintsOutput). Route: **R1** (indirect) - the ghost pull_quality branch zeroes live-pull,
   altering the firing set and therefore `experience_candidate_directions`. No other route. The
   downstream consumer of reach_state/reach_confidence themselves remains untraced (carried forward;
   see flagged list).

7. **Schema / validation:** OPTIONAL (`CROSS_DIRECTION_OPTIONAL`, `validation.ts:144-147`); categorical
   when present (`:710-717`). Removing q10b -> field absent -> validation still PASSES; engine
   `computeReachConfidence` returns 'low' and `computeReachState` returns null for an incomplete triad
   (`derivations.ts:468-470,525-527`), and ghost cannot fire (triadComplete false,
   `direction.ts:180-181`).

8. **Locked-to:** TRIAD (q10/q10b/q10c). Surface wording deliberately differs (manifest `:702`); do
   not re-unify.

**Confidence:** HIGH (wiring and engine consumption verified). **RESOLVED:** the former CODE/DOC
DISAGREEMENT - verdict WIRED; the answers.ts comment is stale and should be fixed. **Carried
forward:** no consumer of reach_state/reach_confidence beyond the engine has been found (synthesis:
none; experience: confirmed none).

## q29 - recent_reaching (page 27)

1. **Prompt:** "Lately, have you been reaching for something of your own: starting something, trying
   to change something, or picking an old thing back up? (Pick one.)" (`:732`). `a` "...still new and
   unsettled..." (recent_and_awkward); `b` "...settled into a regular part of my life..." (mid_stream);
   `c` "...something from the past I have come back to..." (long_established); `d` "No, nothing like
   that..." (no_current_reaching). `required:true` (`:730-739`).

2. **InputMap field:** `cross_cutting.recent_reaching`. `mapRecentReaching` (`answer-maps.ts:29-42`).
   Wired `cross-cutting.ts:44`. Also feeds `deriveLifeStage` (`life-stage.ts:32,52-69`).

3. **Engine consumers:** `computeCrossCuttingOutputs` `mid_process` = anyActive &&
   `recent_reaching === 'recent_and_awkward'` (`crossCutting.ts:19-20`, output/gate). Drives life_stage
   Rules 2/3/5 (`life-stage.ts:52-69`), which then feeds narrowing bands and pull_quality. Confidence
   HIGH.

4. **Synthesis consumers:** cross_cutting_panel mid_process; closing_mid_process line
   (`closing_lines.ts:92-98`). Indirectly via life_stage in life_context_panel + pattern sentences.
   CONDITIONAL. Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** does not reach the experience layer directly (life_stage is not a consumed
   output). Routes: **R2** (indirect) insofar as life_stage feeds the narrowing bands; **R1**
   (indirect) insofar as life_stage feeds pull_quality and the firing set. Confidence HIGH on the
   architecture.

7. **Schema / validation:** REQUIRED (`validation.ts:246`), categorical (`:884-890`). Removal -> FAILS.

8. **Locked-to:** none. Confidence HIGH.

**Confidence:** HIGH.

## q30 - permission + permission_sub_shape (page 28)

1. **Prompt:** "The last thing you fancied doing but didn't do, big or small. Looking back, what
   actually happened?" (`:751`). `a` "Just did not fancy it..." (70 / present); `b` "I wanted to but I
   never actually got round to it" (45 / act_block); `c` "...never said anything..." (40 / say_block);
   `d` "Barely got as far as thinking about it before 'I do not need that' shut it down" (25 /
   want_block). `required:true` (`:749-758`).

2. **InputMap fields (TWO from one answer via `interpretQ30`):** `constraints.permission` (number via
   `PERMISSION_LADDER` 70/45/40/25, `constraints.ts:15,49`, `params.ts:36`) AND
   `constraints.permission_sub_shape` (present/act_block/say_block/want_block, `constraints.ts:17-25,
   50`).

3. **Engine consumers:** `computeSustainedConstraintIntensity` 0.45 weight on (100 - permission)
   (`derivations.ts:63`, the heaviest SCI term). permission band/fires (`realisticConstraints.ts:44,
   63-68`). `permission_sub_shape` -> structural band (`engine.ts:77`, `derivations.ts:189`) and
   psychological band (`engine.ts:86`, `derivations.ts:280,287,302-303`). Confidence HIGH.

4. **Synthesis consumers:** constraints_panel permission line + permission_sub_shape_text
   (`constraints_panel.ts:29-41`, a shape-sentence slot); CONDITIONAL pattern_paragraph reads
   `input.constraints.permission_sub_shape === 'act_block' || 'want_block'` (`shape_sentences.ts:120-121`).
   Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** routes: **R2** via the structural and psychological narrowing bands
   (verified routes into the_narrowings_panel.bands). On R3: the permission band and sub_shape sit on
   `ConstraintsOutput`, and `EXPERIENCE.md:38-39` lists them as direct inputs, but the verified code
   trace of `recommend.ts` shows reads of only the body_capacity/energy/time bands - NO permission
   read site was named in the verified findings. Treated here as spec-level only pending
   clarification (see flagged-for-human list). Confidence HIGH on R2; OPEN on R3-permission.

7. **Schema / validation:** both REQUIRED (`validation.ts:239,240`); permission number 0-100,
   permission_sub_shape categorical (`:847-855`). Removal -> FAILS (two fields).

8. **Locked-to:** the paired permission/permission_sub_shape helper (`interpretQ30`,
   `constraints.ts:9-10`). The 70/45/40/25 ladder is calibration-watched: comment notes "say 40 vs act
   45 near-equal" (`params.ts:35`). Confidence HIGH.

**Confidence:** HIGH (engine/synthesis/validation); R3-permission consumption OPEN.

## q31 - role_consolidation (page 29)

1. **Prompt:** "Think of old friends who knew you apart from your work, or from before it. With them,
   are you a noticeably different man to the one work brings out, or used to? (Pick one.)" (`:770`).
   `a` "Yes, I'm a different man with them" (holds_other_selves); `b` "A bit, though work still colours
   it" (role_inflected); `c` "Not really. I'm much the same..." (role_consolidated). `required:true`
   (`:768-776`).

2. **InputMap field:** `cross_direction.role_consolidation`. `mapRoleConsolidation`
   (`answer-maps.ts:105-116`). Wired `cross-direction.ts:66`.

3. **Engine consumers:** `computeIdentityNarrowingBand` reads it heavily (`derivations.ts:317,322-343`,
   band). Not in pull. Confidence HIGH.

4. **Synthesis consumers:** passed through to `EngineOutput.cross_direction.role_consolidation`
   (`engine.ts:140`); reaches prose via identity narrowing band observation in the_narrowings_panel
   (`the_narrowings_panel.ts:13-31`). No direct raw read found in synthesis predicates. Confidence
   MEDIUM.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** does not reach the experience layer directly. Route: **R2** via the identity
   narrowing band -> the_narrowings_panel.bands -> narrowingFitScore. Confidence HIGH.

7. **Schema / validation:** REQUIRED, dedicated rule `cross_direction_role_consolidation_missing`
   (`validation.ts:679-692`). Removal -> FAILS.

8. **Locked-to:** none. Confidence HIGH.

**Confidence:** HIGH.

## q32 - attention_pattern (page 30)

1. **Prompt:** "Last weekend. How much of it can you actually call to mind now? (Pick one.)" (`:788`).
   `a` "...most of it... in some detail" (engaged); `b` "I get the gist, but it blurs" (intermittent);
   `c` "...it is a blank. I was on autopilot" (autopilot). `required:true` (`:786-794`).

2. **InputMap field:** `cross_direction.attention_pattern`. `mapAttentionPattern`
   (`answer-maps.ts:118-129`). Wired `cross-direction.ts:67`.

3. **Engine consumers:** `computeAttentionNarrowingBand` reads it (`derivations.ts:420,425-438`, band).
   Not in pull. Confidence HIGH.

4. **Synthesis consumers:** passed through to `EngineOutput.cross_direction.attention_pattern`
   (`engine.ts:141`); reaches prose via attention narrowing band observation
   (`the_narrowings_panel.ts:13-31`). Confidence MEDIUM.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** does not reach the experience layer directly. Route: **R2** via the
   attention narrowing band -> the_narrowings_panel.bands -> narrowingFitScore. Confidence HIGH.

7. **Schema / validation:** REQUIRED, dedicated rule `cross_direction_attention_pattern_missing`
   (`validation.ts:694-707`). Removal -> FAILS.

8. **Locked-to:** none. Confidence HIGH.

**Confidence:** HIGH.

## q33 - relational_presence (page 31)

1. **Prompt:** "The last evening you spent with whoever you're closest to. Where were you, really?
   (Pick one.)" (`:806`). `a` "I was there with them, properly" (present); `b` "...half of me was
   elsewhere" (partial); `c` "I was going through the motions" (mostly_absent). `required:true`
   (`:804-812`).

2. **InputMap field:** `cross_direction.relational_presence`. `mapRelationalPresence`
   (`answer-maps.ts:131-142`). Wired `cross-direction.ts:68`.

3. **Engine consumers:** `computeRelationalNarrowingBand` reads it (`derivations.ts:391,401,407,412`,
   band). Not in pull. Confidence HIGH.

4. **Synthesis consumers:** CONDITIONAL pattern_paragraph sentences read
   `input.cross_direction.relational_presence === 'partial'` (`shape_sentences.ts:122`) and
   `=== 'mostly_absent'` (`:131`); passed through (`engine.ts:142`); relational band observation.
   Confidence HIGH.

5. **Render layer:** `single_select`, not gated.

6. **Experience layer:** does not reach the experience layer directly. Route: **R2** via the
   relational narrowing band -> the_narrowings_panel.bands -> narrowingFitScore. Confidence HIGH.

7. **Schema / validation:** REQUIRED, dedicated rule `cross_direction_relational_presence_missing`
   (`validation.ts:729-742`). Removal -> FAILS.

8. **Locked-to:** none. Confidence HIGH.

**Confidence:** HIGH.

## peace_discriminator (page 32)

1. **Prompt:** "There are things that used to be part of your life that aren't there now. For each
   one: are you honestly at peace with it gone, or do you still miss it?" (`:826`). `renderer:
   peace_discriminator`, `config: {}`, `required:true` (`:824-828`). Per-row choice is `made_peace` or
   `still_misses` (`answers.ts:33-34`). Rows are DYNAMIC: one per faded domain.

2. **InputMap field:** `domains.<domain>.peace_discriminator` (`made_peace` | `still_misses`),
   populated only for domains that have one (`domains.ts:103-106`). It also drives `deriveWanting`:
   `past_presence yes && peace_discriminator made_peace && current_state < 60 -> doesnt_want`
   (`domains.ts:57-65`).

3. **Engine consumers:** via `wanting`, `computeOneDomainPresence` produces `reduced_at_peace`
   (doesnt_want) vs `reduced_wants_back` (wants) (`domainPresence.ts:40-43`). Domain value/label. Not
   pull. Confidence HIGH.

4. **Synthesis consumers:** domains_panel groups `reduced_at_peace` vs `reduced_wants_back` separately
   (`domains_panel.ts:13-23`); comparison_surface reduced-domain dispatch (`comparison_surface.ts:140-150`).
   CONDITIONAL. Confidence HIGH.

5. **Render layer:** `peace_discriminator` renderer (manifest comment: "renderer pending Step B",
   `:817`). Rows computed at render time from the assembler's `computeFadedDomains`
   (`domains.ts:32-44`); manifest comment `:818-819` says the UI must not compute the faded set
   itself. So this question is GATED on q24 (past_presence yes) AND the slider value (current_state <
   60) per domain.

6. **Experience layer:** does not reach the experience layer. Routes: none (domain values are not
   among the consumed outputs). Confidence HIGH.

7. **Schema / validation:** `peace_discriminator` is OPTIONAL on the domain object
   (`validation.ts:451,481-489`), categorical made_peace/still_misses when present. Removal -> the
   B9 doesnt_want route just never fires; with-history reduced domains read as `reduced_wants_back`.
   Validation still PASSES.

8. **Locked-to:** depends on the q24 + slider pairing (faded-set definition). The B9 made_peace route
   is the only path to `reduced_at_peace` for with-history domains. Confidence HIGH.

**Confidence:** HIGH. **CHECK-AGAIN:** renderer marked "pending Step B" in the manifest - confirm the
component exists / matches the dynamic faded-row contract.

## q70_allocation - stated_allocation (page 33)

1. **Prompt:** "Here's £70. Put it toward whichever of these you'd honestly want more of in your life.
   ... Split it across up to three of them, any amounts, no more than £70 in total." (`:841`).
   `renderer: allocation`, `config: {}`, `required:true` (`:839-843`). Up to 3 directions, each 0-70,
   sum <= 70.

2. **InputMap field:** `directions.<dir>.stated_allocation` (optional, 0-100 scale). Normalised in
   `per-direction.ts:40-41`: `(raw£/70)*100`; unchosen default 0.

3. **Engine consumers:** ONLY `computePullQuality` phantom / phantom_partial thresholds
   (`direction.ts:117-156`: ALLOCATION_PHANTOM_HIGH 50, _PARTIAL 35, _FLOOR 30) and the preA admission
   gate (`direction.ts:121`). Affects pull_quality label (phantom/phantom_partial), which affects
   firing/prose. NOT in computePull. Confidence HIGH.

4. **Synthesis consumers:** phantom/phantom_partial pull_quality drives card_phantom
   (`cards.ts:106-110`), chart `is_desired_direction` (`chart_data.ts:33-35`), desired_direction
   shape sentences (`predicates.ts:56-67`), closing_phantom (`closing_lines.ts:138-159`). So
   stated_allocation reaches prose only via phantom labels. Confidence HIGH.

5. **Render layer:** `allocation` renderer (manifest comment: "renderer pending Step B", `:833`). Per-
   direction £ split, up to 3, each 0-70, sum <= 70 (`:834`).

6. **Experience layer:** does not reach the experience layer directly (not a consumed output). Route:
   **R1** (indirect) only insofar as the phantom/phantom_partial pull_quality labels alter the firing
   set and therefore `experience_candidate_directions`. Confidence HIGH.

7. **Schema / validation:** `stated_allocation` is OPTIONAL per direction (`PER_DIRECTION_OPTIONAL`,
   `validation.ts:116-118`), number 0-100 (`:396-412`). Removal -> phantom/phantom_partial can never
   fire (defaults to 0, `direction.ts:121` `?? 0`); validation still PASSES.

8. **Locked-to:** the phantom thresholds are explicitly PROVISIONAL and "No £70 producer exists yet"
   (`direction.ts:112-119`). The normalisation ceiling (~57 for a single direction) is referenced by
   the thresholds.

**Confidence:** HIGH. **CHECK-AGAIN:** the only engine consumer (phantom) is calibrated against a
non-existent producer per the code comment; renderer "pending Step B". Confirm the allocation renderer
exists and the £70 normalisation matches.

## q10c - reach_counterfactual (TRIAD arm 3, page 34)

1. **Prompt:** "Suppose an extra day turned up tomorrow that nobody else knew about. ... What would
   you actually do with it?" (`:856`). Eight options: six directions + `rest` + `none` (surface wording
   varies from q10/q10b). `required:true` (`:854-867`).

2. **InputMap field:** `cross_direction.reach_counterfactual` (optional engine field). **WIRED
   (verified, HIGH confidence):** q10c -> `interpretQ10` on `q10c_counterfactual`
   (`cross-direction.ts:46-52`) -> `cross_direction.reach_counterfactual`. The `answers.ts:51-53`
   comment claiming q10c "does NOT populate an engine field" is STALE/INCORRECT and should be fixed
   in code. Does NOT populate would_reach_for or direction_chosen.

3. **Engine consumers (verified):** same as q10b - `computeReachConfidence` / `computeReachState`
   (`derivations.ts:462-549`) and the ghost pull_quality / surfacing guard
   (`direction.ts:178-188,251-259`). Affects rank/surfacing when the triad is complete. As arm 3 it
   participates in the triad's reach_state computation: 'numb' / 'buried_but_alive' / 'surfaced'
   (see q10b and cross-cutting finding 3). Confidence HIGH.

4. **Synthesis consumers:** none found (reach_state/reach_confidence not read by synthesis; grep of
   synthesis for `reach_` returned none). Confidence MEDIUM.

5. **Render layer:** `single_select`, not gated. TRIAD arm.

6. **Experience layer:** reach_state/reach_confidence confirmed NOT read by the experience layer
   (verified architecture). Route: **R1** (indirect) via the ghost branch's effect on the firing set,
   as q10b. Downstream consumer of reach_state/reach_confidence remains untraced (carried forward).

7. **Schema / validation:** OPTIONAL (`validation.ts:144-147`); categorical when present (`:719-727`).
   Removal -> incomplete triad -> reach_confidence 'low', reach_state null, ghost cannot fire.

8. **Locked-to:** TRIAD (manifest `:849`). Surface wording deliberately differs; do not re-unify.

**Confidence:** HIGH (wiring and engine consumption verified). **RESOLVED:** former CODE/DOC
DISAGREEMENT - verdict WIRED; stale answers.ts comment to fix. **Carried forward:** no consumer of
reach_state/reach_confidence beyond the engine.

## q34 - named_absences (page 35)

1. **Prompt:** "If you had to say what's thin on the ground for you at the moment, what would you
   point to? (Pick up to three, or just 'nothing much' on its own if nothing fits.)" (`:879`).
   `renderer: capped_multi`, ten options (`more_friends, more_time_to_myself, something_just_for_me,
   more_energy, getting_back_in_shape, something_to_look_forward_to, proper_conversation,
   building_or_making, something_im_part_of, nothing_really`), `config: { max: 3, exclusiveKey:
   'nothing_really' }`, `required:false` (`:877-893`).

2. **InputMap field:** `self_report.named_absences` (array of SelfReportItemId). `buildSelfReport`
   (`@/home/mark/WAEL/wael-ee/src/assembler/self-report.ts:10-29`): `nothing_really` -> `['nothing_really']`;
   otherwise the named items (asserts <= 3, throws otherwise, `:22-26`). The option values map 1:1 to
   `SelfReportItemId` (`engine/types.ts:118-128`).

3. **Engine consumers:** NONE that score. The engine reads self_report for VALIDATION ONLY
   (`engine.ts:35-36`, comment; `types.ts:113`). No pull/band/output effect. DEAD for scoring by
   design. Confidence HIGH.

4. **Synthesis consumers:** **This is the unused-by-engine, drives-synthesis case.** comparison_surface
   reads `input.self_report.named_absences` to build Confirmed/Quiet/Surfaced via
   `architectural_anchors` (`comparison_surface.ts:345-405`, `self_report_items.ts:39-132`); cards.ts
   excludes named directions from surfaced_finding (`cards.ts:286-296`). The whole comparison_surface
   panel is null iff named_absences empty AND no surfaced (`comparison_surface.ts:493`). Confidence
   HIGH.

5. **Render layer:** `capped_multi` renderer, max 3, `exclusiveKey: 'nothing_really'` (selecting it
   clears others). Not gated.

6. **Experience layer:** **NOT WIRED (verified).** The `influences_experience_layer` flag on these
   items (`self_report_items.ts:4`, `SYNTHESIS.md:1019`) has NO code consumer in the experience
   layer; comparison_surface output is not among the consumed outputs. The spec-level intention to
   bias recommendations from named absences is not implemented. Routes: none. Confidence HIGH.

7. **Schema / validation:** `self_report.named_absences` REQUIRED array (`validation.ts:233,786`);
   cap of 3 (`self_report_cap_exceeded`, `:811-817`) and `nothing_really` mutual exclusion
   (`self_report_nothing_really_exclusive`, `:819-826`). The assembler also asserts the cap
   (`self-report.ts:22-26`). If q34 were removed and the field absent, validation FAILS
   (`missing_field` on self_report.named_absences); if present-but-empty `[]`, it passes (cap/exclusion
   not triggered) and the comparison surface panel becomes null.

8. **Locked-to:** the ten items are locked to `SelfReportItemId` (`engine/types.ts:118-128`) and to
   `SELF_REPORT_ITEMS` anchors (`self_report_items.ts:39-132`); the cap-3 + nothing_really-exclusive
   rules are enforced in three places (manifest config, assembler, engine validation). Confidence HIGH.

**Confidence:** HIGH. **Note:** the engine does NOT read this field but synthesis is heavily driven
by it (the flagged "unused by engine, drives synthesis" case); experience consumption is now
VERIFIED ABSENT (the flag is unwired), not merely unconfirmed.

---

# Verification summary table

## DEAD-PARAM (passed to a function but unused in its body)

| Field | Where dead | Note |
|---|---|---|
| `sociality_default` | `computeRelationalNarrowingBand` arg, never read in body (`derivations.ts:388` vs `:393-415`) | SETTLED four-layer verdict: engine DEAD, experience NOT READ (code-verified), synthesis LOAD-BEARING (11 sociality_summary sentences), schema REQUIRED. Q7 not cuttable. Engine-dead, not field-dead. |
| `belongs_to_group` | `computeRelationalNarrowingBand` arg (call site `engine.ts:110-111`), never read in body (per verified finding) | Dead-param cruft alongside sociality_default. |
| `would_reach_for` (partial) | Not in `computePull`; only validation Rule 4 + phantom condition | Not a dead param, but commonly mis-assumed to feed pull. Acts as a gate + phantom condition. |

**Code-hygiene flag for the build thread:** remove the unused `sociality_default` and
`belongs_to_group` parameters on `computeRelationalNarrowingBand`, OR wire temperament into the
relational narrowing band if that was the original intent.

## Fields unused by the engine for scoring but driving synthesis (the easy-to-miss case)

| Field | Engine | Synthesis |
|---|---|---|
| `self_report.named_absences` (q34) | validation only, no scoring (`engine.ts:35-36`) | Drives the entire comparison_surface panel + card surfaced exclusion. Experience: verified NOT wired (`influences_experience_layer` has no code consumer). |
| `sociality_default` (q7) | dead in relational band | sociality_summary token + shape sentences. Experience: verified NOT read. |
| `reach_retrospective`/`reach_counterfactual` (q10b/q10c) | WIRED and consumed: reach_confidence, reach_state ('numb'/'buried_but_alive'/'surfaced'), ghost detection | No synthesis read found; experience layer verified NOT to read reach_state/reach_confidence. Consumer beyond the engine remains untraced. |

## RESOLVED in this revision (formerly CHECK-AGAIN)

| Item | Question(s) | Resolution |
|---|---|---|
| CODE/DOC DISAGREEMENT | q10b, q10c | **RESOLVED: WIRED.** The `answers.ts:48-53` comment is STALE/INCORRECT. q10b/q10c -> interpretQ10 -> `reach_retrospective`/`reach_counterfactual` -> engine (computeReachConfidence, computeReachState, ghost detection; `derivations.ts:462-549`, `direction.ts:178-188`). Triad triangulation is real; three-arm repetition justified. ACTION: fix the answers.ts comment in code. |
| sociality_default status | q7 | **RESOLVED (settled four-layer verdict):** engine DEAD-PARAM; experience NOT READ (code-verified); synthesis LOAD-BEARING; schema REQUIRED. Q7 NOT cuttable. Dead-param hygiene flag raised (see above). |
| Experience-layer code not traced | all former "MEDIUM" experience rows | **RESOLVED:** code located and verified at `src/ui/experience/` (recommend.ts, diversify.ts, filter.ts, types.ts, inventory.ts, status_store.ts, validation.ts, data/direction_mapping.ts). The layer reads outputs, not InputMap: experience_candidate_directions, the_narrowings_panel.bands, ConstraintsOutput (body/energy/time bands), inventory data, status flags. All experience rows updated to name routes R1/R2/R3. |
| Experience consumption is spec-only | q1a, q1b, q34 | **PARTIALLY RESOLVED:** confirmed that `influences_experience_layer` has NO code consumer in the experience layer - it is a spec-level intention, not wired. (Whether it should be wired is a product question, not a trace question.) |

## CHECK-AGAIN flags carried forward (not resolved by the three findings)

| Item | Question(s) | Why flagged |
|---|---|---|
| Unconfirmed downstream consumer of reach_state/reach_confidence | q10b, q10c | Emitted by the engine (`engine.ts:152-153`); no synthesis read found; experience layer verified NOT to read them. Who consumes them? (The 'buried_but_alive' detector currently has no traced surface.) |
| `endured` enum unreachable | q3 | `paid_work_relationship` enum has `endured` but the mapper never produces it (g->peripheral, `answer-maps.ts:74`). Dead enum value or reserved. |
| `was_once_renders` short-circuit | card-growth-focused-c (and the card set) | `computeWasOnceRenders` returns true for growth_focused with an empty domain map (`direction.ts:95`). Confirm intended. |
| q24 removal does not fail validation | q24 | past_presence defaults to 'no'; domain values silently distort instead of erroring. |
| `peace_discriminator` renderer | peace_discriminator | manifest says "renderer pending Step B" (`:817`); rows are dynamic from `computeFadedDomains`. Confirm component matches contract. |
| `allocation` renderer + phantom calibration | q70_allocation | renderer "pending Step B" (`:833`); the only engine consumer (phantom) is calibrated against a non-existent £70 producer per `direction.ts:112-119`. |
| ConstraintsOutput permission band/sub_shape | q30 | Spec (`EXPERIENCE.md:38-39`) lists them as direct experience inputs, but the verified code trace names reads of only body_capacity/energy/time bands. No permission read site confirmed. |

## Code/doc disagreements (consolidated)

1. **RESOLVED: q10b/q10c populate engine fields.** Verdict WIRED; the `answers.ts:48-53` comment is
   stale documentation. ACTION for the build thread: update the comment to state that these fields
   DO populate `reach_retrospective` / `reach_counterfactual` in InputMap and are consumed by the
   engine for reach confidence/state computation and ghost detection.
2. **`MergedDirectionView` type vs usage** - `shape_sentences.ts:20-45` merges nine input fields but
   synthesis predicates read only `felt_cost` and `past_presence`; the rest are carried but unused in
   prose. Not a contradiction, but a latent over-spec worth noting before "tidying."
3. **Synthesis type comment on `capacity_strain`** - `types.ts:327-329` notes the spec lists
   capacity_strain under the per-direction view but the engine places it on cross_direction; the type
   follows the engine. Already documented in-code; surfaced here for completeness.
4. **`EXPERIENCE.md` inputs list vs verified code reads** - the spec lists InputMap fields (e.g.
   `life_shape_duration`, EXPERIENCE.md:40) and the permission band/sub_shape (EXPERIENCE.md:38-39)
   as experience inputs; the verified code reads neither InputMap fields nor (per the trace)
   permission. The spec's inputs section overstates what the implementation consumes.

## Notes on completeness

- Every question in the requested order has an entry. Card sub-questions share a single full trace
  (contributor) with per-direction deltas noted.
- Confidence is HIGH for assembler/engine/synthesis/validation traces (code read directly).
- Experience-layer rows are now HIGH confidence: the implementation at `src/ui/experience/` was
  located and verified, and every row names which of the three consumption routes (R1 candidates,
  R2 narrowings bands, R3 ConstraintsOutput bands) applies, or states that none does.
- Items carried forward as open (see CHECK-AGAIN table) were NOT resolved by the three findings and
  no resolution has been invented for them.

---

# Flagged for human

Items the three findings did not cleanly resolve, or places where the existing map and a finding
appear to conflict in a way the findings do not settle. No guesses have been made; verified
conclusions were applied as ground truth throughout.

1. **q30 permission band/sub_shape vs the experience layer.** The existing map (per EXPERIENCE.md:
   38-39) listed `constraints.permission.band` and `.sub_shape` as direct experience inputs. The
   verified trace enumerates ConstraintsOutput sub-fields read as body_capacity.band, energy.band,
   and time.band only - permission is not mentioned, but the finding does not explicitly state that
   permission is NOT read anywhere in the experience code (e.g. filter.ts). Recorded as OPEN on the
   q30 entry; needs a one-line confirmation against filter.ts/diversify.ts.

2. **q4 life_shape_duration "diagnostic" input.** EXPERIENCE.md:40 lists it as a diagnostic-only
   experience input; the verified architecture says no InputMap field is read. The finding covers
   the recommendation path (recommend/diversify/filter); whether some diagnostic display elsewhere
   reads it was not addressed. Recorded as spec-level only on the q4 entry.

3. **reach_state / reach_confidence have no traced consumer beyond the engine.** Now strengthened:
   synthesis does not read them (prior grep) and the experience layer verifiably does not read them
   (Correction A). The 'buried_but_alive' detector - explicitly called out in the findings as
   important design context - therefore currently surfaces nowhere outside EngineOutput. Is wiring
   pending, or is this a gap?

4. **the_narrowings_panel.bands membership assumed.** Per-question R2 routing assumes all narrowing
   bands (structural, psychological, identity, attention, relational, experiential, energetic) are
   present in `the_narrowings_panel.bands` as consumed by narrowingFitScore. The findings name the
   field but do not enumerate which bands it carries. If any band is excluded from the panel, the
   corresponding questions' R2 route would not exist.

5. **belongs_to_group dead-param vs the original q1a row.** The original map's q1a engine row implied
   the relational band consumes `belongs_to_group` (citing the call site `engine.ts:110-111`).
   Correction C declares the parameter dead. The finding was applied as ground truth (q1a row
   amended; dead-param table updated); noted here only because the original line-level body trace
   (`derivations.ts:393-415`) had been read as including it.

6. **`anchored_stretch` tier.** The verified experience trace names a tier ordering of firing >
   past_presence_only > anchored_stretch > none in assignTier. No question entry in this map produces
   an "anchored_stretch" candidate priority and the findings do not say what feeds it. Mentioned in
   the methodology; not integrated per-question.

7. **Diversification inputs (cost_tier spread, no-three-in-a-row) and status flags** affect final
   ranking but trace to inventory data and user state, not to any questionnaire question; they are
   recorded in cross-cutting finding 7 only, as no per-question entry owns them.