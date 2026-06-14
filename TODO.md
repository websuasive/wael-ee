# WAEL outstanding work

## Status as of 19 May 2026

The experience layer implementation arc (E0 through E3) is complete. The algorithm is correctly implemented, pure, and deterministic. The algorithm's output quality depends on inventory tagging which has not yet happened. Several other workstreams are in different states of readiness.

## Implementation arc: E3 complete

Brief summary of what landed:

- **Spec revision**: `EXPERIENCE.md §3.4` dropped the "Primary direction" subsection and switched to direction-overlap mechanism (set intersection on translated `experience.directions[]`).
- **E3.A**: `diversify.ts` rewritten for direction-overlap. `CANONICAL_DIRECTION_ORDER` removed (no consumers). Three targeted tests pass.
- **E3.C**: Three legacy test files migrated. 4 obsolete describe blocks deleted. `makeScored` helper rebuilt. Direction-overlap assertions replace primary-direction assertions.
- **E3.D**: Fixture tests rewritten to structural assertions. Round 3 purity check confirmed. Fixture-refresh finding captured at `FIXTURE_REFRESH_FINDING.md`.
- **Test suite**: 1328 passing, 1 skipped, 0 failing.
- **tsc**: 5 errors, all Vue module resolution (deferred to hygiene).

## Highest-leverage outstanding work

Two items. Both are content/data workstreams, not code. Both are required before the experience layer produces meaningful output.

### Inventory narrowing tagging

- **Scope**: 182 experiences in `src/ui/experience/data/experiences.json`.
- **Work**: assess each experience against the seven narrowing dimensions (structural, experiential, psychological, identity, energetic, relational, attention) per `EXPERIENCE.md §2.2`. Tag 0 to 3 narrowings per experience.
- **Why it matters**: the algorithm's narrowing-fit score (0-300 range, the dominant within-tier signal) is currently 0 for every experience. Without tagging, the For You feed sorts by id-tiebreak within tier. Functionally indistinguishable from "inventory order, filtered by tier."
- **Evidence of impact**: E3.C sub-chunk produced four fixture top-12 results all with `composite_score` 0 or uniform 40. The flat orderings are a direct consequence of untagged narrowings.
- **Validation**: build-time warning fires when >50% of inventory is untagged (per `EXPERIENCE.md §2.2`).
- **Effort**: editorial work; not estimated.

### Fixture refresh

- **Scope**: re-run Mark, Geoff, Nicholas, Simon fixture inputMaps through current engine and synthesis pipeline.
- **Work**: capture new engine output and rendering instructions; re-snapshot fixture files.
- **Why it matters**: fixture inputMaps pre-date current synthesis output shape. The rendering instructions feeding `recommend()` may not reflect realistic readings. Documented in `FIXTURE_REFRESH_FINDING.md`.
- **Dependency**: independent of inventory tagging; can proceed in parallel.
- **Effort**: ~half day estimated.
- **After both land**: specific-ID snapshot assertions can return to `experience-fixtures.test.ts` (currently using structural assertions only).

## Code hygiene

Small items, none blocking, worth doing in a hygiene sweep.

### Vue module resolution errors

- **Issue**: 5 tsc errors in `src/ui/main.ts` and `src/ui/router/index.ts`.
- **Detail**: Cannot find module `./App.vue`, `../views/AssessmentView.vue`, `../views/ResultsView.vue`, `../views/ExperiencesView.vue`, `../views/InspectionView.vue`.
- **Status**: pre-existing. Probably missing `vue-shims.d.ts` or tsconfig drift.
- **Effort**: small, ~30 minutes.

### Em-dash cleanup across older files

- **Finding**: sub-chunks A and C found pre-existing em-dashes in `diversify.ts` section comments and across legacy test files.
- **Status**: out of scope for those chunks (rule: don't fix pre-existing issues during scoped chunks). Now worth a sweep.
- **Approach**: `grep -rn "—\|–" src/` produces the list. Replace with colons, full stops, or commas.
- **Effort**: small, ~30 minutes.

### Spec edit application to canonical location

- **Issue**: the revised `EXPERIENCE.md` was produced during E3 phase 1 and saved at `/mnt/user-data/outputs/EXPERIENCE.md`. Confirm it landed at `src/EXPERIENCE.md` in the codebase. If not, copy across.
- **Effort**: trivial.

## Content workstreams

Items that are real work but not algorithm-blocking.

### Inventory narrowing tagging

Cross-referenced from "Highest-leverage outstanding work." Listed here too for completeness.

### static_copy.ts review

- **File**: `src/ui/experience/data/static_copy.ts`.
- **Work**: pub-test pass on the static strings for the experience layer surfaces (empty states, "Show me more" labels, Browse and Saved tabs, etc.).
- **Why**: the layer is functionally complete; the copy quality determines whether it reads right to the audience.
- **Effort**: ~half day editorial.

### Synthesis sentence library reviews

- **Scope**: multiple sentence libraries in `src/synthesis/data/` were drafted under time pressure during the demo prep arc.
- **Work**: worth a structured editorial pass against the voice constraints in `ARCHITECTURE.md §13`.
- **Effort**: ongoing, not estimated.

## Dashboard arc deferred findings

Findings that surfaced during the dashboard demo prep arc and were explicitly deferred. Synthesis/render layer concerns, not experience layer.

### Daniel headline / pattern paragraph contradiction

- **Finding**: `src/synthesis/headline.ts` firing-set logic (lines around 31-42) treats habit-quadrant directions as headline leads, while the pattern paragraph counts only active directions. Produces visible contradiction in the Daniel fixture: Contributor named as lead but pattern paragraph reads "one active direction."
- **Three disposition options** documented during demo prep:
  - A: tighten firing set to exclude habit-quadrant leads.
  - B: variable-count headline.
  - C: rewrite pattern paragraph.
- **Recommendation**: A but needs downstream consequence analysis (which other fixtures and surfaces depend on the current firing-set logic?).
- **Effort**: small implementation, larger consequence-analysis. Estimate after audit.

### Per-card sentence accumulation (Pass D-equivalent)

- **Finding**: when multiple firing readings produce surfaced findings for the same direction card, three or four italic sentences accumulate per card. Editorial pass needed to reduce or restructure.
- **Scope**: synthesis sentence library work plus possibly a per-card sentence selector.
- **Effort**: not estimated.

### Lost reduced surfaced findings

- **Finding**: surfaced findings of the "Architecture reads Intimacy reduced" type (where reduced-state observations are the only architectural signal) have no card to attach to under current cards-by-direction structure. They were previously visible in the now-removed Named and Surfaced panel.
- **Three disposition options** possible: (a) restore a small surfaced findings panel for orphaned readings, (b) attach to a different surface, (c) accept the loss and document.
- **Effort**: not estimated; depends on disposition.

### Subtitles on panel headings

- **Status**: discussion happened during demo prep; not implemented.
- **Concept**: each panel heading gets a sentence-case observational subtitle below the title to orient the reader.
- **Effort**: small render-layer work plus per-panel copy.

## Process and tooling

### Windsurf rules file

- **Status**: in place at `.windsurfrules`. Captures style constraints, discipline rules, spec discipline, reporting format.
- **Purpose**: should reduce friction on every future chunk by codifying patterns that previously had to be re-stated.
- **Verification**: start a fresh Windsurf chat and ask what rules are operating. If it can't articulate them, check the filename and location.

### Workspace rules sharpening

- **Work**: after a few chunks under the new rules file, review what's working and what isn't. Update the rules file based on observed patterns.

## Reference: completed arcs

Brief inventory of what's already done, so the reader knows where the foundations are:

- **Phase 1-2**: v4 engine, v4 synthesis, hygiene chunks H-1 and H-2.
- **Render arc**: R1 through R5, `App.vue` `errorCaptured` hook, inspection page.
- **Demo prep arc**: dashboard cleanup, panel restructure (Narrowings observation library, Surfaced findings moved to direction cards, panel-heading tooltip system), chart improvements, three-voice pronoun principle articulated.
- **Experience implementation arc**: E0 audit, E1 foundation, E1.5 fixture fixes, H2 audit, E2 scoring rewrite, E3 (spec revision + diversification + tests + verification).

Each arc has its own transcript and decision trail; this file is the orientation, not the audit history.
