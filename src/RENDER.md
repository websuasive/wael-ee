# WAEL Render Layer Specification

**Status: DRAFT.** This is the merged canonical render specification, consolidating the pre-merge canonical `RENDER.md` with the locked amendment `RENDER_V4.md` (a single combined amendment covering both the v2-final-synthesis catch-up and the v4-synthesis catch-up). Fixture-specific content has been removed per the merge policy; the five worked examples retained at the end of the document have been anonymised. Language and naming cleanup (static_copy default text, label-level mapping table content, panel heading text) is OUT OF SCOPE for this merge; these content categories are preserved as-is from the source amendment for a separate later cleanup pass. Status flips to LOCKED after project lead review. Date of merge: 17 May 2026.

## 1. Purpose and North Star

The render layer turns the synthesis layer's `RenderingInstructions` output into the man-facing dashboard. Its job is to present what the architecture has read, in the visual register the dashboard mockups established: editorial, quiet, recognisable, never coercive.

North Star: *the layer renders what synthesis produces; it makes no architectural decisions.*

This is a presentation layer. It does not interpret data. It does not call the engine, the synthesis layer, or any data source other than the `RenderingInstructions` object passed to it. Visual treatment, interaction behaviour, mobile/desktop responsive rules, and accessibility live here.

The render layer is built in Vue 3 with the Composition API, plain CSS only, consuming the design tokens defined in `src/ui/styles/main.css`. It targets both mobile and desktop in a single responsive build.

**v4 catch-up.** The render layer extends to consume the v2-final and v4 synthesis additions to `RenderingInstructions`. Four new top-level panels join the dashboard (`life_texture_panel`, `life_context_panel`, `comparison_surface_panel`, `the_narrowings_panel`), the existing domains panel extends to render the spiritual domain as the twelfth domain via the standard pipeline, the existing direction card gains the `expression_space_caption` slot, and the term-explanations surface extends to cover the 32 new terms the upstream amendments add. The architecture is unchanged: render still reads what synthesis produces, makes no architectural decisions, and consumes only `RenderingInstructions` plus the term_explanations table.

## 2. Inputs

The render layer's single input remains `RenderingInstructions` from synthesis (per `SYNTHESIS.md` section 2.2). No new input sources are introduced. The new panels and extensions read from fields that synthesis emits.

The render layer consumes the extended `RenderingInstructions` structure. The full shape is specified in `SYNTHESIS.md` §2.2; the relevant surface for render is summarised here for cross-reference:

```typescript
type RenderingInstructions = {
    // Existing fields:
    headline: HeadlineOutput
    recognition_paragraph: SlotContent
    pattern_paragraph: SlotContent                          // extended sentence library; render unchanged
    direction_cards: DirectionCardOutput[]                  // per-card extension below
    direction_evidence_chart: ChartData
    domains_panel: DomainsPanel                             // composition extended; render extended at §4.8
    constraints_panel: ConstraintsPanel
    cross_cutting_panel: CrossCuttingPanel                  // still not rendered in dashboard
    closing_lines: ClosingLine[]
    experience_candidate_directions: ExperienceCandidate[]  // still not rendered in dashboard

    // New (v2-final synthesis):
    life_texture_panel: LifeTexturePanel
    life_context_panel: LifeContextPanel
    comparison_surface_panel: ComparisonSurfacePanel | null

    // New (v4 synthesis):
    the_narrowings_panel: TheNarrowingsPanel
}
```

Per `SYNTHESIS.md` §2.2, `comparison_surface_panel` is nullable. Per `SYNTHESIS.md` §2.2, `the_narrowings_panel` is always present (the seven bands are deterministic derivations). The render treatment for the nullable case is in §4.14 and §8.7.

The render layer also reads from `src/synthesis/data/term_explanations.ts` for the term-explanation popover content. This is the only data source outside of `RenderingInstructions`.

The render layer does NOT read from EngineOutput, InputMap, story content, instrument question text, or any other source. If a reading is not in `RenderingInstructions`, it is not surfaced.

The `cross_cutting_panel` and `experience_candidate_directions` fields remain not rendered in the dashboard per existing §3 discipline.

The graceful-degradation pattern for SlotContent (interpretive_text-or-token_text fallback; empty-SlotContent omits the slot) carries through to all new slots the amendment introduces. The render layer's `shouldRenderSlot` helper and `should_render_slot.ts` utility apply to every new SlotContent: the_narrowings_panel summary, comparison_surface_panel summary, life_texture_panel summary and pattern_note, life_context_panel's three sub-slots, comparison item sentences, expression_space_caption.

## 3. Component tree

The render layer's top-level state is held in `App.vue`. App holds one of three states: `loading`, `error`, or `ready`. App conditionally mounts:

- `<LoadingState />` when state is `loading`
- `<ErrorState />` when state is `error`
- `<Dashboard :rendering="renderingInstructions" />` when state is `ready` (and `renderingInstructions` is guaranteed non-null at this point)

The Dashboard component itself never sees null. State transitions (loading-to-ready, loading-to-error, ready-to-error on render error) live in App.vue.

The four new panels integrate into the dashboard flow in a specific sequence. TheNarrowingsPanel sits immediately below the hero rule, above the DirectionEvidenceChart, as the opening architectural reading after the editorial paragraphs. The contextual zone (the `panel-grid` wrapper) hosts four panels in declared order: `LifeContextPanel`, `LifeTexturePanel`, `ConstraintsPanel`, `DomainsPanel`. The `ComparisonSurfacePanel` sits outside the grid as a standalone section between the contextual zone and `ClosingLines` (omitted entirely when null).

The architectural rationale: TheNarrowingsPanel surfaces the foundational compression (how the man's life is constraining across seven dimensions) before the direction-level detail. The contextual zone builds from broad to compressed. Life-shape narrative (LifeContextPanel) reads broadly; week's texture (LifeTexturePanel) reads narrower; resource constraints (ConstraintsPanel) read input-level pressure; domain reductions (DomainsPanel) read at the domain level. The ComparisonSurfacePanel is observational (man-vs-architecture comparison, self-report-leading) and sits after the contextual zone as a closing observational section before ClosingLines.

Panel ordering is treated as architecturally meaningful: the editorial arc identity, directions, context, comparison, closing carries architectural significance and is preserved by the spec.

```
<App>                                     (top-level; holds loading/error/ready state)
  <LoadingState v-if="state === 'loading'" />
  <ErrorState v-if="state === 'error'" />
  <Dashboard v-if="state === 'ready'" :rendering="renderingInstructions" />
</App>

<Dashboard>                               (root: <main role="main" aria-label="Architecture reading">)
  <Headline />                            (consumes headline)
  <RecognitionParagraph />                (consumes recognition_paragraph)
  <PatternParagraph />                    (consumes pattern_paragraph; sentence library extended upstream)
  <hr class="dashboard__hero-rule" />     (hero-zone punctuation; see §4.4.5)
  <TheNarrowingsPanel />                  (consumes the_narrowings_panel; positioned above chart per §4.15.2)
  <DirectionEvidenceChart />              (consumes direction_evidence_chart)
  <DirectionCards>                        (consumes direction_cards array; per-card extension at §4.7)
    <DirectionCard /> × 6                 (consumes one DirectionCardOutput each)
  </DirectionCards>
  <div class="panel-grid">                (contextual zone; four panels)
    <LifeContextPanel />                  (consumes life_context_panel)
    <LifeTexturePanel />                  (consumes life_texture_panel)
    <ConstraintsPanel />                  (consumes constraints_panel)
    <DomainsPanel />                      (consumes domains_panel; spiritual extension at §4.8)
  </div>
  <ClosingLines />                        (consumes closing_lines array)
</Dashboard>

<TermPopover />                           (singleton; mounted at App root; triggered globally)
```

The render layer does not surface `cross_cutting_panel` as its own visible component in the man-facing dashboard. Closing lines (which synthesis derives in part from cross-cutting state) are the man-facing surface of these readings. The `cross_cutting_panel` field remains part of `RenderingInstructions` for the experience layer (downstream) and for the inspection UI (development-time).

The `experience_candidate_directions` field is NOT rendered in the dashboard. It is a synthesis output for the experience-suggestion layer (downstream).

**Note on the panel-grid wrapper.** The existing single-column `panel-grid` wrapper extends to include the new contextual-zone panels in declared order. The grid already stacks at all widths (since Phase 4d-1) and provides consistent gap and container; extending it preserves the visual rhythm of the contextual zone without a second grid region. The `ComparisonSurfacePanel` does not sit inside the grid; it is a standalone section with its own card framing, reflecting its different rhetorical position (observational closing read rather than contextual reading).

**Note on narrowing panel placement.** Bottom-position is selected. The categorical narrowings panel reads as the closing compression of multiple architectural inputs, not as the anchor that the prose articulations detail. This means the man encounters the prose articulations (life-shape narrative, week's texture, constraints, domain reductions) first and the categorical compression last; the categorical reading consolidates rather than anchors.

**Reactivity convention.** When `RenderingInstructions` is recomputed (for example, the user re-runs the questionnaire and synthesis produces a new output), App.vue receives a new object reference and replaces its state. Vue's reactivity propagates the new prop value to Dashboard, which propagates to children. The render layer does not mutate `RenderingInstructions` in place; the synthesis layer is responsible for producing a fresh object on each computation.

## 4. Component specs

**Note on summary-slot placement convention across panels.** The dashboard has two summary-slot patterns across its panels, distinguished by the rhetorical function of the slot in that panel:

- Panels whose summary slot composes a **framing sentence** that introduces the panel's architectural reading render the summary above the data. The three new panels (`LifeTexturePanel` §4.12.3, `ComparisonSurfacePanel` §4.14.3, `TheNarrowingsPanel` §4.15.3) follow this pattern; their summary slots compose interpretive sentences that orient the man on what the panel is reading before he sees the structural data.
- Panels whose summary slot composes a **count footer** condensing the panel's data into a short summarising line render the summary below the data. The canonical `DomainsPanel` (§4.8.6) and `ConstraintsPanel` (§4.9.5) follow this pattern; their summary slots typically read token forms like "10 domains reduced; 1 intact." that compress the data above.

The rule reads: summary placement follows the rhetorical function of the slot in that panel. This divergence from a single placement rule is intentional; the slot name (`summary`) is shared, but the slot's content shape and rhetorical position differ.

### 4.1 Dashboard (top-level container)

**Props:**
```typescript
{
    rendering: RenderingInstructions
}
```

**Behaviour:** Renders each child component in order, passing the relevant slice of `rendering`. Coordinates the shared `showInactive` state that controls visibility of inactive directions in both the DirectionEvidenceChart and DirectionCards sections. The container is the page's `<main>` landmark element; the `.container-dashboard` class from `main.css` supplies max-width and centring.

**Shared inactive-directions toggle:**

Dashboard holds a single `showInactive` ref (default: false) that controls whether inactive directions are visible in both the chart and the cards. A toggle button renders between the chart and cards sections when there are inactive directions to show (i.e., when active count > 0 and active count < total count). The button text reads "Show inactive directions" (collapsed) or "Hide inactive directions" (expanded). Clicking the button updates the shared state, which propagates to both child components via props.

**Structure:**
```vue
<template>
  <main
    class="container-dashboard"
    role="main"
    aria-label="Architecture reading"
  >
    <Headline :data="rendering.headline" />
    <RecognitionParagraph :slot-content="rendering.recognition_paragraph" />
    <PatternParagraph :slot-content="rendering.pattern_paragraph" />
    <hr class="dashboard__hero-rule" />
    <TheNarrowingsPanel :data="rendering.the_narrowings_panel" />
    <DirectionEvidenceChart
      :data="rendering.direction_evidence_chart"
      :show-inactive="showInactive"
    />
    <button
      v-if="shouldShowToggle"
      type="button"
      class="dashboard__inactive-toggle"
      @click="showInactive = !showInactive"
    >
      {{ showInactive ? 'Hide inactive directions' : 'Show inactive directions' }}
    </button>
    <DirectionCards
      :cards="rendering.direction_cards"
      :show-inactive="showInactive"
    />
    <div class="panel-grid">
      <LifeContextPanel :data="rendering.life_context_panel" />
      <LifeTexturePanel :data="rendering.life_texture_panel" />
      <ConstraintsPanel :data="rendering.constraints_panel" />
      <DomainsPanel :data="rendering.domains_panel" />
    </div>
    <ClosingLines :lines="rendering.closing_lines" />
  </main>
</template>
```

The root element is `<main>` (not a `<div>`). It carries an explicit `role="main"` and `aria-label="Architecture reading"`; the explicit role is redundant for `<main>` but kept defensively for older AT. The hero rule between the pattern paragraph and TheNarrowingsPanel is documented in §4.4.5. TheNarrowingsPanel sits immediately below the hero rule, above the chart (per §4.15.2). The toggle button sits between the chart and cards, styled with understated treatment (sans-serif, `var(--text-sm)`, `var(--color-text-tertiary)`, no background/border, underline on hover). The `.panel-grid` wrapper exists in the DOM and stacks the four contextual-zone panels vertically at all widths (see §6.3).

### 4.2 Headline

**Props:**
```typescript
{
    data: HeadlineOutput  // { direction_names: string[], situation_text: string | null }
}
```

**Behaviour:**
- When `direction_names` is non-empty: render direction names as a heading, joined by " · " (middle dot, space-separated).
- When `direction_names` is empty: render `situation_text` as a heading.

**Synthesis guarantee:** synthesis always populates either `direction_names` (non-empty array) or `situation_text` (non-null string), never both empty. The render layer relies on this guarantee; if both were empty, the render layer would render no `<h1>`, which would violate the document structure rule in section 7.1. If both are observed empty in production, this is a synthesis bug; the render layer should capture it via the malformed-RenderingInstructions handling in section 8.6.

**Visual:** `<h1>` element using the editorial-headline treatment introduced in Phase 4d-2:

- Font: `var(--font-serif)`.
- Weight: `var(--font-weight-semibold)` (600).
- Size: `var(--text-5xl)` — 48px on desktop, 32px on mobile via the responsive override at the 600px breakpoint in `main.css`. The token shift is handled by the cascade; no component-level media query is needed.
- Line height: `1.05` — tight, suited to the larger size.
- Letter spacing: `-0.01em` — subtle tightening for editorial feel at large sizes.
- `text-wrap: balance` — for multi-name headlines (e.g., `Creator · Experience Seeker · Relationship Rebuilder`), browsers balance line lengths automatically rather than orphaning the last name.
- Colour: `var(--color-text-primary)`.
- Margin: `0 0 var(--space-md) 0` — tight bottom margin into the recognition paragraph (replaces the previous `var(--space-lg)` generous margin; the hero zone is now a tightly-set sequence rather than three loosely-spaced blocks).

The `--text-5xl` token is added to the typography scale; cross-reference §6.1 for the full token list once that section is refreshed (scope of a separate prompt).

**Accessibility:** `<h1>` is the page's primary heading.

### 4.3 RecognitionParagraph

**Props:**
```typescript
{
    slotContent: SlotContent  // { interpretive_text: string | null, token_text: string }
}
```

**Behaviour:**
- If `interpretive_text` is non-null: render it.
- Else if `token_text` is non-empty: render `token_text`.
- Else (both null/empty): render nothing (return early; no element emitted). This is the empty-SlotContent rule from `SYNTHESIS.md` section 2.3.

**Visual:** Per Phase 4d-2 hero-zone tuning:

- Font: `var(--font-serif)`.
- Size: `var(--text-xl)`.
- Line height: `1.45` (raw value) — slightly tighter than the previous `var(--leading-normal)` (1.55) to compose more deliberately with the larger headline above.
- Colour: `var(--color-text-primary)`.
- Margin: `0 0 var(--space-sm) 0` — tight bottom margin into the pattern paragraph below (replaces the previous `var(--space-lg)` generous margin).

**v-if guard:**
```vue
<template>
  <p
    v-if="shouldRenderSlot(slotContent)"
    class="recognition-paragraph"
  >
    <!-- term-scanner segments rendered here -->
  </p>
</template>
```

Text is routed through the term scanner (§5.4); the rendered prose is `interpretive_text ?? token_text` per the empty-SlotContent rule.

**Accessibility:** Standard `<p>` element. No special ARIA needed.

### 4.4 PatternParagraph

**Props:**
```typescript
{
    slotContent: SlotContent
}
```

**Behaviour:** Same as RecognitionParagraph (interpretive_text, then token_text, then v-if guard via `shouldRenderSlot`; text routed through the term scanner).

**Visual:** Quieter than RecognitionParagraph by font, size, and colour — per Phase 4d-2:

- Font: `var(--font-sans)`.
- Size: `var(--text-sm)` (13px) — quieter than the previous `var(--text-base)` (14px).
- Line height: `var(--leading-normal)`.
- Colour: `var(--color-text-tertiary)` — quieter than the previous `var(--color-text-secondary)`.
- Margin: `0` — the hero rule below (§4.4.5) supplies the spacing transition into the chart, so the paragraph itself contributes no margin.

The visual distinction between RecognitionParagraph (serif, larger, primary) and PatternParagraph (sans, smaller, tertiary) reflects their architectural roles: identity-level (recognition) vs current-reading (pattern). Phase 4d-2 increased that contrast by both shrinking and muting the pattern paragraph.

### 4.4.5 Hero rule

A horizontal rule punctuates the transition from the editorial hero zone (Headline + RecognitionParagraph + PatternParagraph) to the data display below (chart, cards, panels, closing lines).

**Element:** `<hr class="dashboard__hero-rule" />`. The `<hr>` element carries native semantic meaning as a thematic break; no additional ARIA is needed.

**Style** (defined in scoped styles on `Dashboard.vue`):

```css
.dashboard__hero-rule {
  border: none;
  border-top: var(--border-hairline) solid var(--color-border-tertiary);
  margin: var(--space-lg) 0 var(--space-xl);
}
```

- Hairline tertiary stroke top; no other borders, no background tint.
- Margin shorthand resolves to: `var(--space-lg)` top (separates from the pattern paragraph), `0` left/right, `var(--space-xl)` bottom (gives the chart card its own breathing space, since `.dashboard-card` carries no top margin of its own).

The rule is purely punctuation. It does not introduce a new section landmark — the chart, cards, panels, and closing lines each carry their own `<section aria-labelledby>` wrappers (§4.5–§4.15).

### 4.5 DirectionEvidenceChart

**Props:**
```typescript
{
    data: ChartData  // { bubbles: ChartBubble[], caption: SlotContent }
    showInactive: boolean  // controlled by Dashboard's shared toggle
}
```

**Behaviour:** Renders an SVG scatter plot showing active directions by default, or all six directions when the shared `showInactive` state is true. Each bubble's position is determined by `pull` (vertical, 0 at bottom, 100 at top) and `movement` (horizontal, 0 at left, 100 at right). Bubble size is determined by `specificity_size` (0.3 to 1.0; the render layer scales to actual radii).

**Active vs inactive rendering:**

- **Active directions** (`is_named_in_headline: true`): Render always. These are the directions named in the headline (max 3).
- **Inactive directions** (`is_named_in_headline: false`): Render only when `showInactive` is true. The user controls this via the shared toggle button in Dashboard (§4.1).
- **Suppressed-man fallback**: When no active directions exist (active count === 0), the chart renders all six directions regardless of the `showInactive` prop value. This surfaces the architectural finding that nothing is firing.

The chart emphasizes the lead directions without hiding the architectural state entirely. The `showInactive` prop is controlled by Dashboard's shared toggle (§4.1), which coordinates visibility across both the chart and the cards section. Axes, gridlines, quadrant backgrounds, and quadrant labels render unchanged regardless of which directions are visible.

**Visual treatment:**
- Bubbles with `is_desired_direction: true` render with a dashed outline (the "desired direction" treatment from the synthesis spec).
- Other bubbles render with solid outlines.
- Bubble colour: per-direction system. Each direction has a stable identity colour used when the direction is named in the headline (in the headline's top-3 by pull). When not named, directions render in graduated greys mapped by pull strength within the inactive set.
  - *Active set (named in headline, max 3).* Each direction has a fixed muted hue. The colour is stable across fixtures — Creator is always its assigned amber when named; Freedom Designer is always teal when named; etc. The render layer reads the direction's `direction_engine_name` and maps to the corresponding active-colour token.
  - *Inactive set (firing-not-named or not-firing, up to 6).* All inactive directions render in graduated greys. The grey assigned to a direction is dynamic — determined by the direction's pull rank among inactive directions in that fixture. Highest-pull inactive direction gets the darkest grey; lowest-pull gets the lightest. This produces a visual gradient within the inactive set that mirrors the data's pull gradient.
  - *Visual_state nuance.* Within the inactive set, firing-not-named directions render at higher fill-opacity (more present) than not-firing directions (more receded). Both use the same direction-grey token; opacity differs.
  - *Bubble label colour matches bubble colour.* Each label's `fill` is the same per-direction token as the corresponding bubble (active hue for named, rank-mapped inactive grey for non-named); the implementation is a direct pass-through (`bubbleLabelColor` returns `bubbleFillColor`). The earlier spec required clamping inactive labels to `--color-text-tertiary` as a contrast floor; this clamp was never implemented and visual proof across the cohort fixtures shows labels read fine without it. The floor is therefore stricken from the spec; if a future fixture surfaces a contrast issue, the fix lands at the token level (lightening the rank-keyed inactive tokens in §6.1) rather than as a per-label runtime clamp.
  - The render layer reads `bubble.is_named_in_headline` directly from the ChartBubble (populated by the synthesis layer from the firing set's top-3 entries, matching the headline's named directions). This aligns the chart's visual emphasis with the headline's editorial intent: the chart highlights the same directions the headline names. Directions in the firing set but not in the top-3 (which can happen on profiles with 4+ firing directions) render in the inactive grey set alongside non-firing directions; their card `visual_state` remains `firing_not_named` so they're still distinguishable in the card list.
- Lead vs non-lead visual weight: the three lead directions (those named in the headline, identified by `is_named_in_headline: true`) receive visual prominence; the other three recede.
  - *Lead directions (is_named_in_headline: true):* Dot size 1.5x the base radius multiplied by specificity_size; dot fill opacity 100%; label font weight semibold (`var(--font-weight-semibold)`); label opacity 100%.
  - *Non-lead directions (is_named_in_headline: false):* Dot size 0.7x the base radius multiplied by specificity_size; dot fill opacity 50%; label font weight regular; label opacity 60%.
  - The eye lands on the three lead direction dots and labels immediately, with the other three readable but visually quiet.
- Direction labels appear above or below each bubble based on position (avoiding overlap).
- The 50/50 centre crosshair is rendered as part of the gridline system (same stroke as the 25/75 gridlines). It divides the plot into four quadrants, each with a faint coloured background tint.
- Quadrant background tints: each quadrant receives a subtle coloured fill that provides architectural meaning without competing with the data. The colours are non-judgmental (not traffic-light) and render at very low opacity (3–6%) to remain subordinate to dots and labels.
  - *Top-left ("Called, not moving"):* Warm muted amber (`#f59e0b` at 6% opacity). Represents held-back quality — the direction is calling but life hasn't moved that way yet.
  - *Top-right ("Called, moving"):* Soft warm brown (`#92400e` at 5% opacity). Represents active alignment — the direction is calling and the man is doing it.
  - *Bottom-left ("Quiet"):* Cool soft grey (`var(--color-text-tertiary)` at 3% opacity). Represents absence, neutral — the direction is neither calling nor being acted on.
  - *Bottom-right ("Moving without calling"):* Muted cool grey (`#6b7280` at 5% opacity). Represents doing without wanting — the man is acting in this direction but it's not pulling him.
- Quadrant labels: four text labels positioned outside the plot area provide architectural descriptions of what each quadrant means. The top two labels ("Called, not moving" and "Called, moving") render above the chart's top edge, each centred over its quadrant's horizontal midpoint (x ≈ 25 and x ≈ 75). The bottom two labels ("Quiet" and "Moving without calling") render below the chart's bottom edge, positioned between the tick labels and the X-axis title. Each label renders in `var(--font-sans)`, `var(--text-sm)`, `var(--color-text-secondary)`, at full opacity (no transparency needed since they sit outside the data region).

**Plot region and axes:**

The chart renders inside a card container with a hairline border (`var(--border-hairline) solid var(--color-border-tertiary)`) and internal padding. Within the card, the plot region occupies the full available width with a fixed aspect ratio.

*Axes.* The x-axis (movement) and y-axis (pull) each render with tick marks at 0, 25, 50, 75, 100. Tick labels render in `var(--text-xs)`, `var(--color-text-tertiary)`, sans-serif. Axis titles render below the x-axis ("How much am I doing it") and rotated on the left of the y-axis ("How strongly it's calling"), in `var(--text-sm)`, `var(--color-text-secondary)`, sans-serif.

*Gridlines.* Hairline gridlines render at each tick interval (25, 50, 75 — not at 0 or 100, since those are the plot edges). Stroke `var(--color-border-tertiary)` at low opacity. The 50/50 cross is rendered with the same stroke — no longer dashed; the gridlines fold the quadrant-implying cross into the broader grid system.

*Plot area.* The plot region is filled with `var(--color-background-secondary)` (a very faint background tone separating the plot from the surrounding card padding). Each quadrant is overlaid with a faint coloured tint (documented above) that provides architectural meaning without overwhelming the data.

*Bubble labels.* Render to the right of each bubble, vertically centred. Offset by bubble radius + a small consistent gap. Collision avoidance: when two bubbles' label rectangles would overlap, the lower-pull bubble's label moves to the bubble's left side instead. When more than two bubbles cluster within a small radius (defined as `clusterRadius = BASE_RADIUS * 1.5` in plot coordinates), labels are hidden for all bubbles in the cluster except the highest-pull one; hidden labels remain accessible via the `<title>` element for screen readers.

*Card label.* A small heading "Direction evidence" renders inside the card, top-left, in `var(--text-sm)` `var(--color-text-tertiary)` uppercase letterspaced (small caps style via `text-transform: uppercase` and `letter-spacing`).

The implementation uses `d3-scale.scaleLinear` for coordinate mapping (input domain 0..100, output range = plot pixel bounds) and `d3-axis.axisBottom` / `axisLeft` for tick generation. The Vue template renders all resulting SVG elements; D3 generates only the scale functions and tick arrays.

**Caption (removed):** The `data.caption` field is still emitted by the synthesis layer (per `SYNTHESIS.md` §5.4 / chart data) and remains part of the `ChartData` contract for downstream consumers, but the render layer no longer renders it. The chart card stands on its own composition (heading, plot, axes, gridlines, bubbles, labels); the caption duplicated the editorial reading already carried by the recognition and pattern paragraphs. Phase 4d-3 dropped the caption render. The synthesis layer is intentionally unchanged — no contract break, no test rewrites — and the render layer simply ignores the field.

**Section wrapping:** The component is wrapped in a `<section aria-labelledby="chart-heading">` element with an `<h2 id="chart-heading">` inside. The heading text is sourced from `static_copy.ts` (key: `chart_heading`; default: 'Direction evidence'). This provides landmark navigation per section 7.1.

**Interactivity:** Static. No hover, no tap, no click. Visual reference only.

**Mobile:** Chart scales to viewport width with maintained aspect ratio. Direction labels may need to abbreviate or relocate at narrow widths; the render layer handles this via SVG layout logic.

**Accessibility:** SVG has a `role="img"` and `aria-label="Direction evidence chart"`. Bubbles have `<title>` elements for screen reader fallback (direction name, pull value, movement value).

### 4.6 DirectionCards (parent)

**Props:**
```typescript
{
    cards: DirectionCardOutput[]  // always 6 entries, ordered by pull descending
    showInactive: boolean  // controlled by Dashboard's shared toggle
}
```

**Behaviour:** The component splits the `cards` array into lead cards (`visual_state === 'named'`) and inactive cards (all others). Lead cards render always; inactive cards render conditionally based on the `showInactive` prop. The cards array always has 6 entries (per `SYNTHESIS.md` §5.3); the render layer never branches on a "no cards" case.

**Lead vs inactive rendering:**

- **Lead cards** (`visual_state === 'named'`): Always visible. These are the directions named in the headline (max 3).
- **Inactive cards** (all others): Render only when `showInactive` is true. The user controls this via the shared toggle button in Dashboard (§4.1).
- **Suppressed-man fallback**: When no lead cards exist (lead count === 0), all cards render regardless of the `showInactive` prop value.

The `showInactive` prop is controlled by Dashboard's shared toggle (§4.1), which coordinates visibility across both the chart and the cards section. Per-card hierarchy is carried by the card-level treatment described in §4.7.4 (left-edge accent colour, dot, background recession) in addition to the structural visibility split.

**Section wrapping:** The component is wrapped in `<section aria-labelledby="cards-heading">` with a visible `<h2 id="cards-heading" class="dashboard-card__label">` inside. The heading text is sourced from `static_copy.ts` (key: `cards_heading`; default: `Direction cards`). This provides landmark navigation per section 7.1.

**Visual — multi-column auto-fit grid:**

```css
.direction-cards__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  align-items: start;
}
```

- `auto-fit` + `minmax(280px, 1fr)` collapses to a single column on narrow viewports (when one 280px column is the most that fits) and expands to two or three columns on wider viewports as space allows. No component-level media query is needed; the grid responds to container width directly.
- `align-items: start` is deliberate: although every card is fully expanded (Phase 4d-7) and most cards have similar heights, minor variations (e.g., some cards have a `held_attributed_line`, others don't) would otherwise stretch shorter cards to match the tallest in their row. `align-items: start` keeps each card at its natural height and lets the row-baseline relax.

**Per-card colour computation:**

The parent computes a `cardColors: Record<DirectionName, string>` map and passes the appropriate value to each child via `:color`:

- For `card.visual_state === 'named'`: the direction's active token (e.g., `var(--color-direction-creator-active)`, `var(--color-direction-freedom-designer-active)`).
- For all other cards: a rank-mapped inactive token (`var(--color-direction-inactive-{N})` where `N` is 1–6). Rank is computed by sorting the non-named subset of cards by `Pull.intensity` descending and assigning `inactive-1` to the highest-pull non-named card, `inactive-2` to the next, and so on. The same rank logic governs chart bubble fills (§4.5), so a card and its corresponding chart bubble share a colour by construction.

The token catalogue and rationale for the rank-keyed inactive naming are documented in §6.1; the consumer-side details (left-edge border, dot, bar fill) are documented in §4.7.3.

**Mobile:** No layout change beyond what the auto-fit grid already does. On the narrowest viewports (≲ ~280px + container padding), the grid resolves to a single column; otherwise, it widens to multiple columns automatically.

### 4.7 DirectionCard (item)

**Props:**
```typescript
{
    card: DirectionCardOutput
    color: string  // CSS colour value (a `var(--color-direction-*-active)` or `var(--color-direction-inactive-N)` reference) computed by the parent; see 4.7.3.
}
```

The direction card extension adds one slot (`expression_space_caption`) and modifies the content of one existing slot (`held_attributed_line`). The card's structure, visual states, paired bars, per-direction colour, and border treatment are unchanged.

#### 4.7.1 Element structure

```vue
<article
  class="direction-card direction-card--{visual_state}"
  :style="{ borderLeftColor: color, borderLeftWidth: '2px' }"
>
  <header class="direction-card__header" :aria-label="…">
    <span v-if="card.visual_state === 'named'" class="direction-card__dot" :style="{ backgroundColor: color }" aria-label="Named in headline" />
    <span class="direction-card__name">{{ card.direction_name }}</span>
  </header>
  <div class="direction-card__body">
    …
  </div>
</article>
```

The root is an `<article>`. The header is a non-interactive `<header>` element (not a `<button>` — the card no longer toggles state). The body is always present in the DOM.

#### 4.7.2 Always-expanded model

Every card renders its full body regardless of `visual_state`. The previous disclosure model (collapsed-by-default for non-named directions; click-to-expand) was removed in Phase 4d-7.

Rationale: the paired-bar treatment (4.7.6) lets "low pull" cards communicate their state visually through short bar fills. Collapsing them was redundant, broke grid alignment in the multi-column layout (4.6), and added an interaction surface with no informational payoff.

There is therefore no expand/collapse state, no `aria-expanded`, no `aria-controls`, no `inert` body, and no focus-management logic. See 7.2 and 7.3 for the corresponding accessibility cleanup.

#### 4.7.3 Per-direction colour

The parent component (`DirectionCards`, section 4.6) computes a colour per card and passes it via the `color` prop:

- `visual_state === 'named'` → the direction's active token (e.g., `var(--color-direction-creator-active)`).
- `visual_state !== 'named'` → a rank-mapped inactive grey token, `var(--color-direction-inactive-N)` where `N` is 1–6, ranked by Pull intensity descending within the non-named subset (highest-pull non-named card gets `inactive-1`, etc.).

The colour drives three surfaces:

- The 2px left-edge border on every card (applied via inline `:style` so the value is direction-specific without proliferating CSS classes).
- The dot fill (named cards only).
- The bar fill colour (4.7.6): named cards use the direction colour; non-named cards use `var(--color-border-secondary)` for muted bar fills regardless of the per-card grey token, keeping the bar visual register restrained.

Per-card colour mirrors the chart's bubble fill for the same direction within the same fixture, giving the card grid and the chart a shared identity vocabulary.

#### 4.7.4 Visual states

| State | Left edge | Dot | Bar fill | Background | Name colour | Body opacity |
|---|---|---|---|---|---|---|
| `named` | 2px in active hue | visible, same hue | active hue | `var(--color-background-primary)` | `--color-text-primary` | 1 |
| `firing_not_named` | 2px in rank-mapped inactive grey | absent | `--color-border-secondary` | `var(--color-background-primary)` | `--color-text-primary` | 1 |
| `not_firing` | 2px in rank-mapped inactive grey | absent | `--color-border-secondary` | `var(--color-background-tertiary)` (recessed) | `--color-text-secondary` | 0.85 (body only) |

The previous spec used `var(--opacity-muted)` (0.7) on the entire `not_firing` card. That treatment is replaced by the tonal-background approach above: the recessed background, secondary name colour, and 0.85 body opacity together produce a quieter card that still composes cleanly within the grid. The `--opacity-muted` token may remain in `main.css` for other uses; the card no longer references it.

#### 4.7.5 Inline meta row

Above the field bars but below the meaning sentence, an inline meta row renders the abbreviated cost-and-anticipation summary (Phase 4d-3 abbreviation):

```
{felt_cost_value} cost · {anticipation_value}
```

Where `felt_cost_value` is one of `'low' | 'moderate' | 'high'` and `anticipation_value` is one of `'none' | 'mild' | 'quickening'`. The trailing word `cost` follows the felt-cost value; the word `anticipation` is omitted (context makes the value clear). The two segments are joined by a middle-dot separator (`·`).

Style: sans, `var(--text-xs)`, `var(--color-text-tertiary)`. Separator dot in `var(--color-border-tertiary)`.

#### 4.7.6 Field bars (paired bars row)

The card body renders two paired progress bars derived from the synthesis-emitted `fields` array:

| Row label | Source field | `intensity` | Value labels |
|---|---|---|---|
| Wants it | `Pull` | 0–100 (raw `pull`) | `low` / `moderate` / `present` / `strong` |
| Had it | `Past` | 0–100 (banded) | `absent` / `present` |

Each row is a three-column grid: `[label][bar track][value label]`. The bar fill width is `intensity%`; the bar fill colour is per 4.7.3.

The remaining `fields` entries are not rendered as bars:

- `Felt cost` and `Anticipation` are surfaced in the inline meta row (4.7.5).
- `Quality` is surfaced as the quality line (4.7.7).

**Bar transitions.** `.direction-card__bar-fill { transition: width 0.2s ease; }` on mount and update. Under `@media (prefers-reduced-motion: reduce)` the transition is overridden to `none` so bars appear instantly at their final width. See section 7.5.

**Bar accessibility.** Each bar track is `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="{intensity}"`, and `aria-valuetext="Wants it: {value}"` (or `Had it: {value}`) so screen readers receive both the row label and the qualitative value, not just the numeric intensity.

#### 4.7.7 Quality line, expression_space_caption, summary, held line, surfaced finding

The card body's below-bars region renders in synthesis-emission order, with `expression_space_caption` inserted between the quality line and the summary line:

1. **Quality** — the composite token (e.g. `"real, active."`, `"suppressed, quiet."`). Sans, `var(--text-sm)`, `var(--color-text-primary)`. Term scanner applies (Quality tokens commonly contain terms like `suppressed` or `desired direction (partial evidence)`).
2. **expression_space_caption** — SlotContent. Sans italic, `var(--text-xs)`, `var(--color-text-tertiary)`. Matches the inline meta row's tertiary visual register; sits as a small architectural observation between the composite quality reading and the predicate-driven summary. The empty-SlotContent rule applies: per synthesis `SYNTHESIS.md` §5.3, the slot fires only when `expression_space === "no_space"` AND the direction is materially reading; otherwise the slot is empty and the render layer omits it. On most cards on most fixtures, no element renders here. Term scanner applies.
3. **Summary** — the synthesis `summary` slot (`interpretive_text` or `token_text` per the empty SlotContent rule). Italic sans, `var(--text-sm)`, `var(--color-text-secondary)`.
4. **Held attributed line** — when `held_attributed_line` is non-null, rendered as an italic muted line in the same style as summary. Content variants per `SYNTHESIS.md` §5.3:

   | Pull state value | held_attributed_line text |
   |---|---|
   | `held_attributed_with_expression` | "Something specific held in this direction." |
   | `held_attributed_unexpressed` | "Something specific held in this direction, with no current room for it." |

   The render layer reads `card.held_attributed_line` as a string and renders it as an italic muted line in the existing visual register. The content distinction is synthesis-controlled; the render machinery is unchanged.

5. **Surfaced finding** — when `surfaced_finding` is present (optional field), rendered as a final italic muted line in the same style as summary and held_attributed_line. Per `SYNTHESIS.md` §7.17, this field is populated when the architecture surfaces a direction that the man did not name in his self-report. The sentence reads: "You didn't name this one, but the architecture reads it firing." Italic sans, `var(--text-sm)`, `var(--color-text-secondary)`. The surfaced finding sentence uses second-person voice as a deliberate exception to the dashboard's pronoun-free rule; the second-person does recognition work that pronoun-free prose can't carry as naturally.

The empty SlotContent rule applies to `meaning_sentence` and `summary`: when both `interpretive_text` and `token_text` are empty, the slot is omitted (no element).

**Rationale for expression_space_caption position.** The caption sits between the quality line (composite token reading of the fields) and the summary (predicate-driven interpretive reading). The fields region (paired bars plus inline meta row plus quality line) reads the synthesised field data; the expression_space_caption then renders a per-card architectural observation about the week's room for the direction; the summary then renders the predicate-driven interpretive sentence. Inserting the caption between fields-table region and quality line would interleave with the fields-derived reading; inserting after the summary would push the architectural observation past the interpretive close. Between the quality line and the summary, the caption reads as a separate observation cleanly framed by the composite quality token above and the interpretive summary below.

**Rationale for visual register.** Italic small text in tertiary colour matches the inline meta row's register (`var(--text-xs)`, `var(--color-text-tertiary)`) and reads as a quiet architectural annotation rather than as a primary content line. The caption is asymmetric by design (firing only when expression_space === "no_space" AND direction reading materially); a louder visual register would over-emphasise an annotation that is informational by nature.

#### 4.7.8 Border treatment

```css
.direction-card {
  border-top: var(--border-hairline) solid var(--color-border-tertiary);
  border-right: var(--border-hairline) solid var(--color-border-tertiary);
  border-bottom: var(--border-hairline) solid var(--color-border-tertiary);
  /* Placeholder; overridden by inline style for every card. */
  border-left: 2px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-background-primary);
}
```

The inline `:style` from 4.7.1 sets `border-left-color` (and re-asserts `border-left-width: 2px`) per card. The transparent placeholder keeps the box-model stable before the inline style applies.

**Mobile:** Same layout. Header `min-height: var(--control-height-lg)` (48px) for comfortable touch on mobile, relaxed to `var(--control-height-md)` at the 600px breakpoint.

### 4.8 DomainsPanel

**Props:**
```typescript
{
    data: DomainsPanel
}
```

The spiritual domain joins the existing eleven domains as the twelfth domain via the standard reduced-groups pipeline. The composition rule does not change; spiritual follows the same pipeline as the other domains per `SYNTHESIS.md` §5.5.

#### 4.8.1 Data contract

The panel consumes `domains_panel` from synthesis. Per `SYNTHESIS.md` §5.5:

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

Each domain's `intensity` is `100 − engine.current_state` — i.e., how reduced the domain reads. Higher intensity = more reduced (longer bar). The framing matches the panel's "what's reduced" heading: heavily reduced domains read as long bars, barely-reduced domains as short bars.

The empty-SlotContent rule applies to `summary` and `intact_callout`.

#### 4.8.2 Card framing

The panel is wrapped in `<section class="dashboard-card domains-panel" aria-labelledby="domains-heading">`. The h2 inside uses the shared `dashboard-card__label` class (small-caps tertiary). The heading text is sourced from `static_copy.ts` key `domains_panel_heading` (default: `What's reduced`); the same h2 carries `id="domains-heading"` for the section's `aria-labelledby`.

The panel is full container width; it stacks with the other contextual-zone panels at all widths (per the Phase 4d-1 grid convention).

#### 4.8.3 Group rendering

The panel renders three distinct treatments based on group type:

**Reduced groups** (`reduced_wants_back`, `reduced_at_peace`): Each entry renders as a labelled cluster of bar rows.

- **Group label.** The `value_label` rendered above the cluster in sans, `var(--text-sm)`, `var(--color-text-secondary)`, weight 500. Display-name identifier — not routed through the term scanner (see §5.4).
- **Bar row.** 2-column grid `[domain_name (140px)][bar track (1fr)]`. There is no right-hand value cell; the bar itself is the only quantitative surface.
- **Domain name.** Sans, `var(--text-sm)`, `var(--color-text-primary)`. Display-name identifier — not term-scanned. Exception: the "Spiritual" display label is label-level-wrapped in a `<TermIndicator>` per §5.2, mapping to the term key `Spiritual (domain)`. The other eleven domain display labels remain tooltip-bare at this catch-up.
- **Bar.** Track height 6px, `background: var(--color-border-tertiary)`, `border-radius: 3px`, `overflow: hidden`. Fill width = `intensity%`; fill colour per §4.8.4.
- **Bar accessibility.** Track is `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="{intensity}"`, and `aria-valuetext="{domain_name}: {intensity}% reduced"`.

**Non-reduced groups** (`never_been_part_of_his_life`, plus the Intact callout): Each renders with the label-plus-list pattern.

- **Group label.** Small-caps group label on one line, matching the styling of reduced group labels: sans, `var(--text-sm)`, `var(--color-text-secondary)`, weight 500.
- **Domain list.** Comma-separated list of domain names on the next line. Sans, `var(--text-sm)`, `var(--color-text-primary)`. No row structure; no bars. Single domain reads as a single name; multiple domains read comma-separated.
- The list content is routed through the term scanner (§5.4) so terms like "mattering" surface as term indicators when defined.
- No "Intact:" prose prefix; no italic styling. The label is structurally parallel to other group labels in the panel.

Groups are stacked vertically with `var(--space-md)` between groups; within a group, the label and list are separated by `var(--space-xs)`.

**Architectural rationale.** The reduced groups use bars because magnitude is the structural meaning — the bar length communicates how reduced the domain reads. The non-reduced groups use lists because there is no magnitude to display; the list IS the architectural reading. The "Never been part of life" group has no prior state to reduce from, so a bar would render an architecturally false claim. The Intact group lists domains at full strength, where a 100% bar would be visually redundant and compositionally noisy.

#### 4.8.4 Bar colour — shared visual language

The fill colour is `var(--color-constraint-bar)`. This is a shared semantic token used by both `DomainsPanel` and `ConstraintsPanel` — the muted clay tone signals *depletion / reduction / constraint pressure* in a register parallel across the two panels.

Token values (defined in `main.css`):

| Theme | Value | Note |
|---|---|---|
| Light | `#a06850` | muted clay |
| Dark | `#c08870` | clay raised for dark backgrounds |

Both panels deliberately share this colour to communicate the parallel semantic register: bars in *What's reduced* and *What's heavy* both read as "things pulling against the directions" rather than "things supporting the directions." Cross-reference: §4.9.4.

#### 4.8.5 intact_callout

When emitted by synthesis (i.e., `shouldRenderSlot(intact_callout)` is true), it renders using the label-plus-list pattern described in §4.8.3. The group label "Intact" appears on one line; the comma-separated list of domain names (sourced from the §7.8 sentence library output) appears on the next line. The content is routed through the term scanner — terms like "mattering" surface as term indicators when defined. Note: per `SYNTHESIS.md` §7.5 modifications, the synthesis-side predicates for `domains_mattering_intact_with_many_reductions` and `domains_structural_intact` are revised to exclude `never_been_part_of_his_life` from the intact-count thresholds. This is synthesis-side; the render layer reads the resulting intact_callout slot content as-is.

#### 4.8.6 Summary line (not rendered)

The synthesis layer emits `summary` as a SlotContent field containing count data (e.g., "10 domains reduced; 1 intact; 1 other"). The render layer does not display this field. The data is preserved in the `RenderingInstructions` contract for inspection and downstream consumers, but the panel template does not reference it. The count line is architecturally redundant — the panel's visual structure already communicates the group composition, and the count footer added no informational value.

#### 4.8.7 Bar transitions

Bar fills animate via `transition: width 0.2s ease` on mount and update. Under `@media (prefers-reduced-motion: reduce)` the transition is overridden to `none` so bars appear instantly at their final width. This matches the shared transition rule across `DirectionCard` (§4.7.6), `DomainsPanel`, and `ConstraintsPanel` (§4.9). See §7.5.

### 4.9 ConstraintsPanel

**Props:**
```typescript
{
    data: ConstraintsPanel
}
```

#### 4.9.1 Data contract

The panel consumes `constraints_panel` from synthesis. Per `SYNTHESIS.md` §5.6:

```typescript
type ConstraintsPanel = {
    summary: SlotContent
    constraint_lines: ConstraintLine[]
    sustained_constraint_intensity: number
    intact_callout: SlotContent
    permission_sub_shape_text: SlotContent | null
}

type ConstraintLine = {
    constraint_name: string  // e.g. "Energy", "Time", "Body", "Permission"
    band_label: string       // e.g. "moderate", "heavy depletion", "blocked", "shifted", "partial"
    intensity: number        // 0–100, engine constraint value passthrough
}
```

The `sustained_constraint_intensity` field is intentionally not surfaced visually; it is consumed elsewhere in synthesis for the pattern paragraph and shape sentences and remains in the contract for downstream consumers.

The empty-SlotContent rule applies to `summary`, `intact_callout`, and `permission_sub_shape_text`.

#### 4.9.2 Card framing

The panel is wrapped in `<section class="dashboard-card constraints-panel" aria-labelledby="constraints-heading">`. The h2 inside uses the shared `dashboard-card__label` class. The heading text is sourced from `static_copy.ts` key `constraints_panel_heading` (default: `What's heavy`); the same h2 carries `id="constraints-heading"`.

The panel is full container width and stacks with the other contextual-zone panels at all widths.

#### 4.9.3 Line rendering

Each entry in `constraint_lines` renders as a 3-column grid row: `[constraint_name (90px)][bar track (1fr)][band_label (130px)]`.

- **Constraint name.** Sans, `var(--text-sm)`, `var(--color-text-secondary)`, weight 500. Display-name identifier — not routed through the term scanner (see §5.4).
- **Bar.** Identical visual treatment to `DomainsPanel` bars: track height 6px, `background: var(--color-border-tertiary)`, `border-radius: 3px`, `overflow: hidden`. Fill width = `intensity%`; fill colour `var(--color-constraint-bar)` (§4.9.4).
- **Bar accessibility.** Track is `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="{intensity}"`, and `aria-valuetext="{constraint_name}: {band_label}"` (qualitative band rather than a numeric percentage — the band carries the editorial reading).
- **Band label.** Sans, `var(--text-sm)`, `var(--color-text-primary)`, right-aligned. Routed through the term scanner: tokens like *shifted*, *heavy depletion*, *blocked*, *partial* may surface as term indicators when defined in `term_explanations.ts`.

Lines are stacked vertically with `var(--space-sm)` between rows.

#### 4.9.4 Shared visual language

`ConstraintsPanel` and `DomainsPanel` share `var(--color-constraint-bar)` for bar fills, `var(--color-border-tertiary)` for bar tracks, and the 0.2s ease width transition. This shared register is articulated in §4.8.4: both panels read as "things pulling against the directions," and the visual register makes that parallel legible.

#### 4.9.5 Permission sub-shape, intact callout, summary

Below the constraint lines, the panel renders three optional prose blocks (each gated by the empty-SlotContent rule), in this order:

1. **`permission_sub_shape_text`** — when the Permission constraint fires, the synthesis layer emits a sub-shape line describing the particular pattern (per `SYNTHESIS.md` §5.6 / §7.4). Italic sans, `var(--text-sm)`, `var(--color-text-secondary)`. Term scanner applies.
2. **`intact_callout`** — when emitted, listing constraint dimensions reading intact alongside the depletions. Italic sans, `var(--text-sm)`, `var(--color-text-secondary)`. Term scanner applies.
3. **`summary`** — short footnote. Sans, `var(--text-sm)`, `var(--color-text-tertiary)`. Term scanner applies.

#### 4.9.6 Bar transitions

Same rule as `DomainsPanel` (§4.8.7): `transition: width 0.2s ease` with `@media (prefers-reduced-motion: reduce)` overriding to `none`. See §7.5.

### 4.10 ClosingLines

**Props:**
```typescript
{
    lines: ClosingLine[]  // already deduplicated by synthesis layer
}
```

**Behaviour:**

The component first computes `renderableLines` as the subset of `lines` for which `shouldRenderSlot(line.text)` is true (the empty-SlotContent rule applies per line, per `SYNTHESIS.md` §5.8 / §2.3). If `renderableLines.length === 0`, the component renders nothing. Otherwise, it branches on the renderable count:

- `renderableLines.length >= 2` → **card-framed ledger**. Multiple closing observations carry enough collective weight to warrant a "ledger" treatment.
- `renderableLines.length === 1` → **bare epigram**. A lone closing line in a fully-framed card reads as a placeholder; rendering it as italic, centred, editorial prose treats it as a deliberate single observation rather than a half-empty card.

This adaptive framing was introduced in Phase 4d-3.

**Section wrapping:** Either branch wraps the lines in `<section aria-labelledby="closing-heading">` with an `<h2 id="closing-heading">` inside; the section landmark is constant. What varies is whether the heading and the section frame are visible.

**4.10.1 Card-framed ledger (`renderableLines.length >= 2`)**

- Section element receives the `dashboard-card` class (so the standard card frame and padding apply).
- `<h2>` receives the `dashboard-card__label` class — visible heading rendered as small-caps tertiary letterspaced, sourced from `static_copy.ts` key `closing_heading` (default: `Closing observations`).
- Each line renders as `<p class="closing-lines__line">` in:
  - `font-family: var(--font-serif)`
  - `font-size: var(--text-lg)`
  - `line-height: var(--leading-normal)`
  - `color: var(--color-text-primary)`
  - `margin: 0 0 var(--space-md) 0`, with `:last-child { margin-bottom: 0 }` so the trailing line sits flush with the card's bottom padding.

**4.10.2 Bare epigram (`renderableLines.length === 1`)**

- Section element receives the `closing-lines--single` class (no card frame, no card padding).
- `<h2>` receives the `sr-only` class — heading present in the DOM and announced to AT, but visually hidden.
- The single line renders as `<p class="closing-lines__line">` with the single-variant overrides:
  - `font-family: var(--font-serif)`
  - `font-size: var(--text-base)` (smaller than the multi-line `var(--text-lg)`, in keeping with the editorial register)
  - `font-style: italic`
  - `color: var(--color-text-secondary)`
  - `margin: 0`
  - `text-align: center`

The component itself contributes `margin-bottom: var(--space-xl)` below the component.

**Term scanner:** Both variants route each line's `text.interpretive_text ?? text.token_text` through the term scanner (§5.4), so terms like *capacity strain*, *stopped expecting*, or *between shapes* surface as inline indicators wherever they appear.

**Accessibility:** The section's `aria-labelledby` always points to the heading element regardless of which class it carries, so the landmark is announced consistently to AT. In the single-line variant, the visually-hidden heading still contributes the section's accessible name.

### 4.11 Footer

**Status:** Removed from dashboard.

The footer disclaimer text ("This is what the responses read as. The architecture reads patterns; it doesn't tell anyone what to do. The next step is the man's.") has been removed. The `Footer.vue` component is no longer rendered in the dashboard component tree. The dashboard now ends at `ClosingLines` (§4.10).


### 4.12 LifeTexturePanel

**Props:**
```typescript
{
    data: LifeTexturePanel
}
```

#### 4.12.1 Data contract

The panel consumes `life_texture_panel` from synthesis. Per `SYNTHESIS.md` §5.11:

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

`band_label` and `load_state_label` are always populated (token-only fields per synthesis). `flags_present` and `flags_absent` are arrays of display labels (may be empty). `summary` and `pattern_note` are SlotContent; the empty-SlotContent rule applies.

#### 4.12.2 Card framing

The panel is wrapped in `<section class="dashboard-card life-texture-panel" aria-labelledby="life-texture-heading">`. The h2 inside uses the shared `dashboard-card__label` class (small-caps tertiary letterspaced). Heading text is sourced from `static_copy.ts` key `life_texture_panel_heading` (default: `The week's texture`); the same h2 carries `id="life-texture-heading"` for the section's `aria-labelledby`.

The panel is full container width; it stacks with the other contextual-zone panels at all widths (per Phase 4d-1 grid convention).

#### 4.12.3 Panel layout (summary-first)

The panel renders in the following sequence (top to bottom):

1. **Section heading** (h2 from static_copy.ts; see §4.12.2).
2. **summary SlotContent.** The panel's architectural reading line (the headline of the panel). Sans, `var(--text-base)`, `var(--color-text-primary)`. Term scanner applies. When empty, the slot is omitted per the empty-SlotContent rule (the band_label still renders below as the architectural reading via the token form). Summary-above-data placement follows the framing-sentence convention noted at the top of §4.
3. **Annotation row.** A small one-line annotation rendering `band_label` and `load_state_label` joined by a comma. Sans, `var(--text-sm)`, `var(--color-text-secondary)`, weight 500. Example: "Mixed week, loaded by work and weekends." The `band_label` is label-level-wrapped in a `<TermIndicator>` per §5.2 (mapping `empty`/`depleted`/`mixed`/`textured` to the corresponding `... (week)` term keys); the `load_state_label` remains tooltip-bare at this catch-up (no term explanation exists for the joint load state composition labels per `SYNTHESIS.md` §6.14). The annotation row always renders (both labels are always populated per synthesis).
4. **flags_present chip group** (when array is non-empty). Renders as a row of pill-style chips, each chip carrying one display label. Visual: rounded pill (`border-radius: var(--radius-sm)`), background `var(--color-background-secondary)`, border `var(--border-hairline) solid var(--color-border-tertiary)`, padding-inline `var(--space-xs)`, padding-block `var(--space-xxs)`. Text: sans, `var(--text-sm)`, `var(--color-text-primary)`. Display-name identifiers; not term-scanned. The chip group is preceded by a small inline label "Present:" in `var(--color-text-tertiary)`, weight 500, `var(--text-xs)` (or this inline label is omitted in favour of visual register alone if the build prefers; see honest concerns).
5. **flags_absent chip group** (when array is non-empty). Identical chip markup to flags_present but with muted visual register: background unchanged, border `var(--color-border-tertiary)` at lower saturation, text colour `var(--color-text-tertiary)`. Display-name identifiers; not term-scanned. The chip group is preceded by an inline label "Absent:" in `var(--color-text-tertiary)`, weight 500, `var(--text-xs)`. The visual differentiation (saturation drop between present and absent) communicates "what is there" vs "what is not there" without requiring a separate explanatory label.
6. **pattern_note SlotContent** (when not empty). Italic sans, `var(--text-sm)`, `var(--color-text-secondary)`. The panel's closing observational read. Term scanner applies. Empty-SlotContent rule applies.

**Rationale for summary-first.** The architectural reading flow is summary → labels → data → pattern. The man reads the architectural reading line first (so he understands what the panel is saying); the categorical labels annotate the reading; the flag chip groups show the structural data behind it; the pattern observation closes the panel. The summary slot carries the architectural reading the man should encounter first; structural data sits in the middle as supporting detail; the pattern observation is a closing read that benefits from the data being visible.

**Visual register.** The panel adopts a banner-style register (summary headline plus annotation row plus chip groups plus pattern note). This distinguishes it visually from the bar-rendered `ConstraintsPanel` and `DomainsPanel`, from the prose-only `LifeContextPanel`, and from the categorical-pills `TheNarrowingsPanel`. The chip groups in particular are the panel's distinguishing visual element.

#### 4.12.4 Responsive behaviour

New panel follows the existing token-driven responsive pattern. No per-component media queries. Chip groups wrap naturally at narrow widths via CSS `flex-wrap: wrap`. The annotation row may break across two lines on narrow viewports; this is acceptable.

#### 4.12.5 Accessibility

The chip group ARIA treatment uses `role="list"` on the chip group container and `role="listitem"` on each chip, providing screen reader users with structured list navigation across the flag entries. The "Present:" and "Absent:" inline labels read as the list's preceding text via standard reading order; alternative `aria-labelledby` markup is not required.

The annotation row is plain text without ARIA decoration; the `band_label` carries its term-indicator `?` icon per the standard TermIndicator pattern (focusable button; Enter/Space activation; popover). The row reads naturally in document order.

### 4.13 LifeContextPanel

**Props:**
```typescript
{
    data: LifeContextPanel
}
```

#### 4.13.1 Data contract

The panel consumes `life_context_panel` from synthesis. Per `SYNTHESIS.md` §5.12:

```typescript
type LifeContextPanel = {
    life_stage_summary:  SlotContent
    work_load_summary:   SlotContent
    sociality_summary:   SlotContent
}
```

Three SlotContent sub-slots; the empty-SlotContent rule applies to each independently. Per synthesis, each slot has a token fallback so the slots typically fill rather than omit; on rare fixtures a slot may omit.

#### 4.13.2 Card framing

The panel is wrapped in `<section class="dashboard-card life-context-panel" aria-labelledby="life-context-heading">`. The h2 inside uses the shared `dashboard-card__label` class. Heading text from `static_copy.ts` key `life_context_panel_heading` (default: `The current shape`); same h2 carries `id="life-context-heading"`.

The panel is full container width; stacks with the other contextual-zone panels.

#### 4.13.3 Sub-section layout (prose-only stacked)

The panel renders three stacked SlotContent paragraphs in declared order (life_stage_summary, then work_load_summary, then sociality_summary). Each sub-slot renders as one paragraph subject to the term-indicator scanner and the empty-SlotContent rule. Sub-sections stack with `var(--space-md)` between them.

Sub-section structure (per sub-slot):

1. **SlotContent prose.** Sans, `var(--text-base)`, `var(--color-text-primary)`. Term scanner applies. Empty-SlotContent rule: when the slot is empty, the paragraph is omitted (the sub-section collapses entirely).

No visible sub-section labels. The panel body is three short paragraphs in declared order.

**Rationale for prose-only without sub-labels.** The three sub-sections read three concept-distinct architectural readings (life-stage state, work-load joint state, sociality state). The synthesis interpretive sentences for these sub-slots typically carry their own framing within them: per `SYNTHESIS.md` §7.11, five of the seven life_stage values produce sentences that begin "Reading: building." (or consolidating, re_evaluating, transitioning, settled); per §7.12 and §7.13 fallbacks, the token forms read "Paid work reading: Consuming. Primary load: Paid work." and "Sociality reading: Balanced." Adding visible sub-section labels on top would produce triple-framing of the same architectural fact for the majority case. The prose-only-stacked register without sub-labels reads cleanly: the synthesis prefixes orient the man on which reading he is on; the panel composition reads as three short paragraphs.

The two values that compose around the term (`enduring`, `drifting` per `SYNTHESIS.md` §7.11 voice note) compose without explicit framing on this reading; the synthesis sentences for these values read naturally from context within the panel's three-paragraph structure. If post-build review reveals these specific values' panel renderings read as disorienting, the sub-labels can land as a follow-up amendment with a tighter rule (e.g. show sub-labels only for sentences that do not carry their own framing); the conservative read at this catch-up is no sub-labels.

**Visual register.** Prose-only stacked sub-sections distinguish this panel visually from the bar-rendered `ConstraintsPanel` and `DomainsPanel`, from the banner-and-chips `LifeTexturePanel`, and from the categorical-pills `TheNarrowingsPanel`. The prose-only register signals "life-shape narrative summary" before content reads as overlapping with the other panels.

#### 4.13.4 Responsive behaviour

New panel follows the existing token-driven responsive pattern. No per-component media queries. The stacked paragraphs wrap naturally; prose reflows at all viewport widths.

#### 4.13.5 Accessibility

The panel is a single section element; the h2 carries `id="life-context-heading"` for the section's `aria-labelledby`. The three sub-section paragraphs read in document order; no within-panel sub-labels are introduced. The h1 → h2 → content heading hierarchy is preserved.

### 4.14 ComparisonSurfacePanel (REMOVED)

**Status: This panel has been removed from the dashboard.** The Named and Surfaced panel's content has been moved to direction cards as surfaced finding sentences (see §4.7.7 item 5). The synthesis layer may still emit `comparison_surface_panel` data for inspection purposes, but no panel renders it in the dashboard.

The surfaced findings (directions the architecture reads that the man did not name) now appear as closing sentences on the relevant direction cards. See `SYNTHESIS.md` §7.17 for the surfaced finding sentence library and §5.3 for the `surfaced_finding` field on `DirectionCardOutput`.

The Confirmed and Quiet content (named items that match or don't match the architecture) is no longer rendered anywhere on the dashboard.

#### 4.14.1 Data contract (historical reference)

The panel previously consumed `comparison_surface_panel` from synthesis. Per `SYNTHESIS.md` §5.10:

```typescript
type ComparisonSurfacePanel = {
    summary: SlotContent
    confirmed: ComparisonItem[]
    quiet: ComparisonItem[]
    surfaced: ComparisonItem[]
}

type ComparisonItem = {
    sentence: SlotContent
    source: 'self_report' | 'architecture'
    reference: ComparisonReference
}
```

The `source` and `reference` fields are inspection-time data; they do not surface in the dashboard. Each item renders as its `sentence` SlotContent: per-item rendering uses the existing SlotContent pattern (term-scanned prose, empty-SlotContent rule).

The panel renders only when `comparison_surface_panel !== null`; the parent Dashboard component handles the null case via `v-if` (see §3 component tree; see §8.7 nullable panel behaviour for the discipline). Within a non-null panel, individual sections (confirmed, quiet, surfaced) may be empty arrays; per `SYNTHESIS.md` §5.10, empty section headings are omitted.

#### 4.14.2 Card framing

The panel is wrapped in `<section class="dashboard-card comparison-surface-panel" aria-labelledby="comparison-surface-heading">`. The h2 inside uses the shared `dashboard-card__label` class. Heading text from `static_copy.ts` key `comparison_surface_panel_heading` (default: `Named and surfaced`); same h2 carries `id="comparison-surface-heading"`.

The panel sits outside the `panel-grid` wrapper (per §3 component tree). It is a standalone section between the contextual zone and `ClosingLines`. Full container width.

#### 4.14.3 Section layout (three sequential sections, uniform visual register)

The panel renders in the following sequence:

1. **Section heading** (h2 from static_copy.ts; see §4.14.2).
2. **summary SlotContent** (when not empty). Italic sans, `var(--text-sm)`, `var(--color-text-secondary)`. Sits below the section heading and above the three sections. Empty-SlotContent rule applies. Summary-above-data placement follows the framing-sentence convention noted at the top of §4.
3. **Three sequential sections** (Confirmed, Quiet, Surfaced), each rendering only when its corresponding array is non-empty.

Per-section structure:

- **Section sub-heading.** Small-caps tertiary letterspaced label matching `dashboard-card__label` style (sans, `var(--text-xs)`, `var(--color-text-tertiary)`, letter-spacing per existing convention). The three sub-headings are static text from `static_copy.ts` (see §9 static copy extensions). Display-name identifiers; not term-scanned.
- **Items.** Each `ComparisonItem.sentence` renders as a flowing prose paragraph. Sans, `var(--text-base)`, `var(--color-text-primary)`. Term scanner applies per the existing pattern. Items within a section are stacked with `var(--space-xs)` between them.

Sections are stacked vertically with `var(--space-md)` between sections.

Item order within each section follows synthesis emission order (per `SYNTHESIS.md` §5.10.1, the man's named_absences order for Confirmed and Quiet; per §5.10.2, the priority-tiered cap order for Surfaced).

**Empty sections are omitted entirely.** When `confirmed`, `quiet`, or `surfaced` is an empty array, the corresponding section sub-heading and its items are omitted (no element, no heading). Per `SYNTHESIS.md` §5.10: "The render layer omits empty section headings."

**Rationale for uniform visual register.** The three sections have different rhetorical positions (Confirmed: the man named X and the architecture also reads X; Quiet: the man named X but the architecture does not read X; Surfaced: the architecture reads X but the man did not name X). The section sub-headings, labelled clearly, carry the semantic distinction. Adding visual register variation per section (different colours, different typography, two-column layout) risks distracting from the prose; the prose itself, plus the section sub-headings, communicates the architectural meaning.

Two-column layout (named vs surfaced) was considered for surfacing the architectural symmetry but is layout-disruptive; the symmetry reads through the section labels sequentially. Conservative uniform-register treatment preserves the panel's observational tone.

Per-section visual differentiation was considered for surfacing the "different rhetorical position" of each section but risks signalling one section is more important than another. The architectural intent is that the three sections are equally important; uniform treatment respects this.

#### 4.14.4 Responsive behaviour

New panel follows the existing token-driven responsive pattern. Prose paragraphs reflow at all widths.

#### 4.14.5 Accessibility

The panel is one `<section>` with one h2. The three section sub-headings within are not heading elements; they are styled labels matching the existing within-panel sub-label vocabulary. This preserves the heading hierarchy (h1 → h2 → content).

The three sub-sections do not introduce nested landmarks. Screen readers read the panel as a single section with structured content; the sub-headings read as preceding text for each section's items. If post-build review reveals navigation friction (e.g. screen reader users wanting to skip between sections), nested landmarks via additional aria-labelledby on per-section divs can be added then.

### 4.15 TheNarrowingsPanel

**Props:**
```typescript
{
    data: TheNarrowingsPanel
}
```

#### 4.15.1 Data contract

The panel consumes `the_narrowings_panel` from synthesis. Per `SYNTHESIS.md` §5.13:

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
}
```

The `bands` array always contains seven entries (per synthesis, deterministic). The `summary` slot is always populated (token fallback in `SYNTHESIS.md` §5.13.1 guarantees a non-empty form).

**Note on `intensity`.** The `intensity` field remains in the data structure but is not rendered visually. Per `SYNTHESIS.md` §5.13: "The intensity is not an architectural reading; the band value is. Documenting this explicitly avoids implying false precision (the bands are not continuous; the engine emits discrete states)." The render layer adopts the categorical reading. The `intensity` field is reserved for future render-layer use cases (e.g. a future arc that wants to render an aggregate intensity reading) but is not consumed in the current dashboard.

#### 4.15.2 Card framing and position

The panel is wrapped in `<section class="dashboard-card narrowings-panel" aria-labelledby="narrowings-heading">`. The h2 inside uses the shared `dashboard-card__label` class. Heading text from `static_copy.ts` key `the_narrowings_panel_heading` (default: `The Narrowings`); same h2 carries `id="narrowings-heading"`.

The panel sits immediately below the hero rule, above the DirectionEvidenceChart. Full container width. This position surfaces the narrowings as the opening architectural reading after the editorial paragraphs, before the direction-level detail.

#### 4.15.3 Panel layout (observation sentences, intensity-sorted rows)

The panel renders in the following sequence (top to bottom):

1. **Section heading** (h2 from static_copy.ts; see §4.15.2).
2. **summary SlotContent (not rendered).** The synthesis layer emits a summary SlotContent for this panel (per SYNTHESIS.md §7.15). The render layer does not render this slot. The data is preserved in the RenderingInstructions for inspection but the panel renders the band rows directly under the heading without a summary line. The man reads the band values directly; the summary is observable from the rows themselves.

3. **Seven band rows, sorted by intensity.** Each `NarrowingBandEntry` renders as a row. The render layer sorts rows by intensity (high first, then low, then moderate), with canonical narrowing order (Structural, Experiential, Psychological, Identity, Energetic, Relational, Attention) preserved within each intensity group. This surfaces high-intensity narrowings first, drawing the eye to the most pronounced constraints.

Per-band-row structure (three-column grid: label, observation, pill):

- Each row is a three-column grid layout: `[display_name] [observation] [pill]`. Grid template: `auto 1fr auto` with `var(--space-sm)` gap.
- **Display name (left column).** The band's plain name (Structural, Experiential, Psychological, Identity, Energetic, Relational, Attention). Sans, `var(--text-sm)`, `var(--color-text-secondary)`. Wrapped in a per-label `<TermIndicator>` (see §5.2). The panel passes the `band_field` token (the stable identifier: `structural`, `experiential`, `psychological`, `identity`, `energetic`, `relational`, `attention`) as the lookup key; the display label (the adjective) and the lookup key are independent strings that happen to coincide in spelling when lowercased. The display name reads as a tooltip-target label (subtle underline plus `?` icon); tapping/clicking surfaces the term explanation popover for the band (term explanations per `SYNTHESIS.md` §6.20).
- **Observation sentence (middle column, primary content).** The observation sentence from SYNTHESIS.md §7.16, keyed by `{narrowing}_{intensity}`. Sans, `var(--text-base)`, `var(--color-text-primary)`, `var(--leading-normal)`. This is the primary visible content; the label and pill are secondary. The observation describes what the narrowing dimension reads like at this intensity level.
- **Pill (right column).** A pill-shaped element carrying the band state label. Visual: rounded pill (`border-radius: var(--radius-md)`), padding-inline `var(--space-xs)`, padding-block `var(--space-xxs)`. Pill background and text colour vary by band state per the three-state colour coding (see §4.15.4 below). Text content is the band state label per the table below. The pill itself does not carry a tooltip; the band state label reads directly.

Band state label table:

| `band` value | Pill label |
|---|---|
| `low` | "low" |
| `moderate` | "moderate" |
| `high` | "high" |

Pill labels are display-name identifiers (lowercase, observational); not term-scanned. The "low"/"moderate"/"high" tokens have term explanations accessible through their narrowing band `band_field` tokens (e.g., `structural`, `experiential`) but the pill label itself is the state value, not a term key.

Band rows are stacked with `var(--space-sm)` between rows.

**Rationale for categorical pills.** Synthesis `SYNTHESIS.md` §5.13 is explicit that the bands are categorical, not continuous: "the bands are not continuous; the engine emits discrete states." The `intensity` field (33 / 66 / 100) is render-layer convenience, not architectural reading. Bars at the intensity scale would imply continuous reading; categorical pills preserve the discrete state as the architectural reading.

The categorical-pills register also distinguishes `TheNarrowingsPanel` visually from the bar-rendered `ConstraintsPanel` and `DomainsPanel` in the contextual zone. This visual differentiation per concept addresses the five-panel overlap concern from the upstream synthesis amendment (see §12 Honest concerns).

For a profile where energy reads as heavy depletion in `ConstraintsPanel` AND energetic narrowing reads high in `TheNarrowingsPanel`, both panels surface readings about the energy dimension, but the bar visual (input-level constraint) versus the pill visual (categorical compression of multiple inputs into a band) signals "different architectural concept" before content reads as overlapping.

#### 4.15.4 Pill colour coding (three-state)

Pill background and text colour vary by the `band` value. The colour treatment uses the existing colour-token system; the three-state coding maps as follows:

| Band state | Pill background | Pill text | Description |
|---|---|---|---|
| `low` | `var(--color-background-secondary)` | `var(--color-text-secondary)` | Subtle low-emphasis: muted background, secondary text. Signals "the dimension reads light." |
| `moderate` | `var(--color-pill-moderate-bg)` (new token) | `var(--color-pill-moderate-text)` (new token) | Subtle mid-emphasis: tinted background, primary or secondary text per contrast. Signals "the dimension reads in the middle." |
| `high` | `var(--color-pill-high-bg)` (new token) | `var(--color-pill-high-text)` (new token) | Subtle high-emphasis: stronger tinted background, primary text. Signals "the dimension reads pronounced." |

The three states are differentiated by background saturation and text contrast rather than hue rotation; the visual reads as a single dimension of intensity (light to pronounced) within the muted register the dashboard uses. The colour-token system extends to include the four new tokens (`--color-pill-moderate-bg`, `--color-pill-moderate-text`, `--color-pill-high-bg`, `--color-pill-high-text`) with light and dark theme values; specific colour values are determined at build time guided by the existing palette (clay-tone family for constraint-pressure semantics; the moderate-bg and high-bg pull from this family at increasing saturation; the low state reuses the existing background-secondary token).

All three states meet WCAG AA contrast minimums (4.5:1 for body text on the pill background; the tokens are tuned to satisfy this at build).

#### 4.15.5 Responsive behaviour

New panel follows the existing token-driven responsive pattern. No per-component media queries. The band rows render at one-row-per-band at all viewport widths; the display-name-and-pill horizontal layout is comfortable at the narrowest mobile width (320px). If a display name plus pill exceeds available width, the pill wraps to a second line within the row; this is acceptable.

#### 4.15.6 Accessibility

Extends the existing accessibility model to cover this panel.

- The panel section uses `aria-labelledby` referencing the h2 (per existing §7.1 document structure rule).
- The seven band rows form an implicit list; the rows container uses `role="list"` and each row uses `role="listitem"` for structured screen reader navigation.
- Each pill renders as plain text within its row (not as an interactive element; pills do not carry tooltips). Screen readers read pill content as part of the listitem text in document order: "Structure: high", "Variety: moderate", etc.
- Each display name is wrapped in a `<TermIndicator>`; the existing TermIndicator accessibility pattern applies (focusable button for the `?` icon; Enter/Space activation; popover with `role="dialog"`). See §5.2.


## 5. Term explanations UI

The dashboard surfaces architectural terms (for example, 'capacity strain', 'desired direction', 'stopped expecting', 'shifted', 'between shapes') that some readers will not immediately understand. The synthesis layer outputs the explanations in `term_explanations.ts`. The render layer surfaces them via popover.

The render layer applies the indicator pattern by scanning rendered prose strings against a static lookup table (`src/ui/render/term_indicator_targets.ts`). The synthesis layer's output strings are plain prose; the render layer transforms them at render time to wrap matched substrings with `<TermIndicator>` components. The existing prose-scanning pattern is preserved and extended; a label-level wrap pattern is added for display labels that are themselves term-explanation keys (see §5.2).

### 5.1 TermPopover component

A singleton component mounted at app root. Manages popover state for any term in the document. One popover open at a time.

**State:**
```typescript
{
    activeTerm: string | null
    anchorElement: HTMLElement | null
    position: { x: number, y: number }
}
```

**Implementation note.** TermPopover is a singleton. Its state is held in a small reactive store (Vue's `provide`/`inject` or a tiny composable) so that any component containing a TermIndicator can trigger the popover. The store has methods: `openPopover(term, anchorElement)` and `closePopover()`. App.vue mounts a single `<TermPopover />` at the app root level, which subscribes to the store.

**Behaviour:**
- When a term indicator is tapped/clicked, the popover opens anchored to that indicator.
- The popover displays the explanation text from `term_explanations.ts` (looked up by the term key).
- Tap/click outside the popover closes it.
- Tap/click on a different indicator opens that term's popover (closes the previous).
- Escape key closes the popover.

**Visual:**
- Background: `var(--color-background-primary)`.
- Border: `var(--border-thin)` solid `var(--color-border-primary)`.
- Border radius: `var(--radius-md)`.
- Box shadow: `var(--shadow-md)`.
- Padding: `var(--space-md)`.
- Max width: 320px.
- Text: serif (matches the editorial register), `var(--text-base)`, `var(--color-text-primary)`.
- Position: above the anchor on desktop, below on mobile (avoids being cut off by the keyboard or viewport bottom).

**Accessibility:**
- `role="dialog"`. The click-to-reveal pattern is interactive; tooltip semantics don't fit.
- `aria-modal="false"`. The popover does not block interaction with the rest of the page.
- `aria-labelledby` references the popover's heading element when present. For narrowing band tooltips, the heading displays the full narrowing name and character name (e.g., "Structural Narrowing · The Yes Man"); screen readers announce this as the dialog's accessible label. For panel-heading tooltips (terms ending in `_panel`), the heading is suppressed and `aria-labelledby` is omitted; the dialog's accessible name falls back to the explanation text.
- Focus trap: when the popover opens, focus moves to the popover container. Tab cycles through any focusable elements in the popover (typically just a close button). On close, focus returns to the indicator's `?` button.
- Escape key closes the popover.

The singleton popover component, its store, and its behaviour are unchanged by the v4 catch-up. The new term explanations the upstream amendments add (32 entries total) flow through the existing popover machinery.

### 5.2 Term indicator pattern (prose-scanning plus label-level extension)

The existing term indicator pattern wraps matched substrings within rendered prose with a `<TermIndicator>` component. The amendment extends this pattern with a label-level application: a display label is wrapped in a `<TermIndicator>` as a whole-label tooltip target, with the component receiving an explicit term key (which may differ from the displayed label text).

Term indicator markup for prose-scanned terms (emitted by the scanning utility, not hand-authored):

```vue
<span class="term-indicator">
  capacity strain
  <button
    class="term-indicator__icon"
    aria-label="Show explanation for capacity strain"
    @click="openPopover('capacity strain', $event.target)"
  >
    ?
  </button>
</span>
```

The scanning utility produces this markup as a Vue render-function output (or as compiled template fragments) when transforming a synthesis string. Components that consume SlotContent route the text through the scanning utility before final render.

**Visual:**
- The term itself is rendered with subtle underline (dashed, `var(--color-text-tertiary)`) to signal it's interactive.
- Trailing `?` icon: small circle with question mark, `var(--color-text-tertiary)`, font-size `var(--text-xs)`. Margin-left `var(--space-xxs)`.
- Hover state (desktop): underline becomes solid, indicator becomes `var(--color-accent)`.
- Tap target (mobile): minimum 44x44px tap area, centred on the `?` icon (achieved via padding on the `<button>` element so the visual size of the icon stays small but the hit area is generous). Matches WCAG 2.5.5 minimum.

**Label-level wrap pattern.**

The label-level extension applies to display labels that are themselves term-explanation keys, where the label appears as a structural element (a row label, a band label, a chip group label) rather than as a substring within flowing prose.

Applies to:

- **Narrowing band display names** in `TheNarrowingsPanel` (§4.15.3). The seven display names ("Structural", "Experiential", "Psychological", "Identity", "Energetic", "Relational", "Attention") are wrapped with `<TermIndicator>`, passing the `band_field` token as the lookup key and the full narrowing name plus character name as the heading.
- **The spiritual domain display label** in `DomainsPanel` (§4.8.3). The display label "Spiritual" maps to the term key `Spiritual (domain)`. The other eleven domain display labels remain tooltip-bare at this catch-up (no term explanations exist for them).
- **Week-band display labels** in `LifeTexturePanel` (§4.12.3 annotation row, the `band_label` field). The four engine values map to `* (week)` term keys per the mapping table below.
- **Life-stage display labels** in `LifeContextPanel` (when they appear as standalone labels in prose). After §4.13.3's prose-only treatment drops the visible sub-labels, the standalone-label case may reduce in scope; the wrap pattern is specified here as the mechanism for any case where a life-stage label surfaces as a standalone tooltip target (in build, in inspection UI, or in future synthesis sentence revisions that emit the label as a standalone term reference). The seven values map to `* (life-stage)` term keys per the mapping table below.

Label-level wrap markup (narrowing band example):

```vue
<TermIndicator 
  :term="'structural'" 
  :heading="'Structural Narrowing · The Yes Man'"
>
  Structural
</TermIndicator>
```

The `<TermIndicator>` component's existing visual treatment applies (subtle underline plus `?` icon trailing the label). The popover opens on tap/click of the `?` icon; the explanation text is looked up per the existing `lookupTerm` utility (per §5.3). For narrowing bands, three independent strings are in play: the `term` prop (the `band_field` token used for lookup), the `heading` prop (the full narrowing name and character name displayed in the popover header), and the slot content (the adjective display label shown in the row). The lookup key is the stable `band_field` token; the display label and the popover heading are independent presentation strings. The `heading` prop is optional; when provided (as it is for narrowing bands), the popover renders it as a visible heading above the explanation text, and screen readers announce it as the dialog's accessible label via `aria-labelledby`.

**Narrowing-band lookup mechanism:**

The narrowings panel passes the `band_field` token directly as the `term` prop. The seven tokens (`structural`, `experiential`, `psychological`, `identity`, `energetic`, `relational`, `attention`) key directly into `term_explanations.ts` with no suffix or transformation. The `heading` prop carries `full_name · character_name` from the narrowing band metadata (e.g., `"Structural Narrowing · The Yes Man"`), which renders as the popover's heading. The display label (the adjective) is independent of both the lookup key and the heading.

**Spiritual-domain label-key mapping:**

| display_name (from `domains_panel`) | term_explanations.ts key |
|---|---|
| Spiritual | `Spiritual (domain)` |

**Week-band label-key mapping (life_texture_panel `band_label`):**

| engine value | display label | term_explanations.ts key |
|---|---|---|
| `empty` | Empty | `Empty (week)` |
| `depleted` | Depleted | `Depleted (week)` |
| `mixed` | Mixed | `Mixed (week)` |
| `textured` | Textured | `Textured (week)` |

The render layer constructs the term key by appending ` (week)` to the capitalised `band_label`. Synthesis emits `band_label` as a capitalised display label (per SYNTHESIS.md §6.13); the term key matches that capitalisation with the parenthetical qualifier.

**Life-stage label-key mapping (life_context_panel, when surfaced as standalone):**

| engine value | display label | term_explanations.ts key |
|---|---|---|
| `building` | Building | `Building (life-stage)` |
| `consolidating` | Consolidating | `Consolidating (life-stage)` |
| `re_evaluating` | Re-evaluating | `Re-evaluating (life-stage)` |
| `transitioning` | Transitioning | `Transitioning (life-stage)` |
| `settled` | Settled | `Settled (life-stage)` |
| `enduring` | Enduring | `Enduring (life-stage)` |
| `drifting` | Drifting | `Drifting (life-stage)` |

The parenthetical-suffix application is at the render-amendment level (this mapping table), not in the lookup utility. The render component renders the bare display label as the visible text; the wrap supplies the qualified key to the popover for explanation lookup. This pattern applies to week-band labels, life-stage labels, and the spiritual domain label; narrowing bands use a different mechanism (direct `band_field` token lookup with no suffix, per the narrowing-band section above).

**Uniform approach.** The amendment specifies a uniform per-label TermIndicator wrap pattern across all four categories. Alternative options (native browser title attribute, dedicated label-tooltip component, no tooltip on labels) were considered; the per-label TermIndicator wrap composes with the existing popover machinery (same store, same accessibility, same visual register) without introducing a parallel pattern.

### 5.3 Term lookup

A utility function looks up the explanation text for a given term. Most terms have direct matches; some tokens with parenthetical qualifiers fall back to the simpler form (for example, 'desired direction (partial evidence)' falls back to 'desired direction').

```typescript
function lookupTerm(term: string): string | null {
    // Returns the explanation text for the term, or null if no entry exists.
    if (termExplanations[term]) return termExplanations[term]
    // Fallback: strip parenthetical qualifiers
    const stripped = term.replace(/\s*\(.*?\)\s*$/, '')
    return termExplanations[stripped] || null
}
```

If the lookup returns null, the term renders as plain text without the indicator pattern. The `lookupTerm` utility is unchanged by the v4 catch-up; the parenthetical-qualifier fallback already handles the parenthetical-qualified entries when a matched substring includes the qualifier verbatim. The label-level wrap pattern (§5.2) supplies the qualified key directly and does not depend on the fallback.

### 5.4 Term indicator application (extended targets)

The render layer applies the indicator pattern by scanning every rendered prose string from `RenderingInstructions` against the lookup table in `src/ui/render/term_indicator_targets.ts`. Matched substrings are replaced with `<TermIndicator term='[matched key]'>[matched text]</TermIndicator>`.

Matching rules:

- **Case-handling.** Case-sensitive on every character except the first; the first character is matched case-insensitively. See §5.5 for the full rule and rationale. Single-word target keys retain effective case-sensitivity (e.g. 'Creator' is a direction name, not a term; 'creator' will not match), since direction names are not term-indicator targets in the first place. Multi-word keys (e.g. `attention moving without much registering`) admit clause-initial capitalised variants.
- **Word-boundary anchored.** The match must align with word boundaries on both sides. This prevents 'real' inside 'really' from matching the term 'real'.
- **Longest-match wins.** When multiple keys could match overlapping substrings, the longest match is taken. This ensures 'desired direction (partial evidence)' matches its full key rather than the shorter 'desired direction'.
- **First-occurrence-per-string.** Within a single rendered string, only the first occurrence of a given term gets the indicator. Subsequent occurrences in the same string render as plain text. This avoids visual clutter when a term repeats.

The lookup table structure:

```typescript
// src/ui/render/term_indicator_targets.ts
export const termIndicatorTargets: Set<string> = new Set([
    'capacity strain',
    'desired direction',
    'desired direction (partial evidence)',
    'suppressed',
    'shifted',
    'held unattributed',
    'stopped expecting',
    'between shapes',
    'mid-process',
    'past presence',
    'specificity',
    'mattering',
    'soured',
    // ... etc; mirrors term_explanations.ts keys
])
```

The set is curated by the render team; not every key in `term_explanations.ts` automatically becomes an indicator target. The render team decides which terms to surface in the dashboard's prose vs. which to leave as plain text.

**Keys to add for the v4 catch-up.** The `term_indicator_targets.ts` set extends to mirror new entries added to `term_explanations.ts` per `SYNTHESIS.md` §6.20. The keys reflect the v2-final additions (life_stage terms, week_shape terms, and other v2-final-introduced concepts surfaced in prose) and the v4 additions (the `Spiritual (domain)` key and four canonical surfaced phrasings). The seven narrowing band tokens (`structural`, `experiential`, `psychological`, `identity`, `energetic`, `relational`, `attention`) are NOT added to the scanner targets; the narrowings panel passes these terms explicitly via `<TermIndicator>` props, so prose-scanning is not involved for narrowing tooltips.

The new v4 canonical surfaced phrasings, illustrative:

- `Spiritual (domain)`
- `attention moving without much registering`
- `the role is who he is everywhere`
- `wanting running through a filter before it acts`
- `mostly absent in the relationships he has`

The `Spiritual (domain)` key surfaces via the label-level wrap on the spiritual domain display label in DomainsPanel (per §5.2). The four canonical surfaced phrasings surface via the prose-scanning pattern in `pattern_paragraph` and other slots that compose them; the §5.5 case-handling rule admits both lowercase mid-sentence occurrences and capitalised clause-initial occurrences.

**Multi-word canonical phrasings.** The four canonical surfaced phrasings are multi-word phrases of 5 to 7 words each. The existing term-indicator scanner supports multi-word terms via longest-match-wins. The §5.5 case-handling rule additionally admits clause-initial capitalised variants. Uniform treatment is preserved: each phrase renders with the existing underline-plus-`?`-icon visual when matched. If the underlined-and-questioned span reads as visually heavy for the longer phrases during post-build review, a softer treatment (underline only, no `?` icon, for spans above a length threshold) can land as a separate concern; the conservative read at this catch-up is uniform treatment.

**Labels without term explanations.** Some display labels do not have term explanations: paid_work_relationship per-value labels, primary_load per-value labels, week_shape flag display labels, sociality_default per-value labels, the joint load_state composition labels. These labels are tooltip-bare at this catch-up. The deferred questionnaire arc may add explanations later. The `term_indicator_targets.ts` set does not include these labels' keys (the keys do not exist in `term_explanations.ts`).

**Targets the render layer scans:**

- `recognition_paragraph.interpretive_text` and `.token_text`
- `pattern_paragraph.interpretive_text` and `.token_text`
- Each direction card's `summary.interpretive_text`, `summary.token_text`, `meaning_sentence.interpretive_text` (note: meaning_sentence is type-naming voice and rarely contains terms)
- Each direction card's `fields` table values (the Quality field token will commonly contain 'suppressed', 'desired direction (partial evidence)', etc.)
- Each direction card's `expression_space_caption.interpretive_text` and `.token_text`
- Each direction card's `held_attributed_line` string (content is synthesis-controlled per `SYNTHESIS.md` §5.3)
- The constraint band labels in `constraint_lines` ('shifted', 'heavy depletion', etc.)
- Each closing line's `text.interpretive_text` and `.token_text`
- The `intact_callout` slots in DomainsPanel and ConstraintsPanel
- `life_texture_panel.summary` and `life_texture_panel.pattern_note`
- `life_context_panel.life_stage_summary`, `life_context_panel.work_load_summary`, `life_context_panel.sociality_summary`
- `comparison_surface_panel.summary` and each `comparison_surface_panel.confirmed[i].sentence`, `comparison_surface_panel.quiet[i].sentence`, `comparison_surface_panel.surfaced[i].sentence`
- `the_narrowings_panel.summary`

**Targets the render layer does NOT scan:**

- Direction names (Creator, Freedom Designer, etc.): first-class identities, not terms
- Domain names (Time as yours, Mattering, etc.): described by their values
- Static panel headings ('What's reduced', 'What's heavy', etc.)
- `life_texture_panel.band_label` is label-level-wrapped per §5.2 (not prose-scanned, but tooltip-target via per-label TermIndicator)
- `life_texture_panel.load_state_label` remains tooltip-bare at this catch-up (no term explanation exists for the joint load state composition labels per `SYNTHESIS.md` §6.14)
- `life_texture_panel.flags_present[i]` and `life_texture_panel.flags_absent[i]` (chip-rendered) remain tooltip-bare (no term explanations exist for the individual week_shape flag labels)
- `the_narrowings_panel.bands[i].display_name` is label-level-wrapped per §5.2 (not prose-scanned)
- `the_narrowings_panel.bands[i]` pill labels ("low", "moderate", "high") are display-name identifiers without term explanations; not scanned
- The spiritual domain display label in DomainsPanel is label-level-wrapped per §5.2 (not prose-scanned)
- Other domain display labels in DomainsPanel remain tooltip-bare

The lookup table is kept manually in sync with `term_explanations.ts`. A build-time check (warning, not error) flags terms that appear in synthesis output but have no entry in either file.

### 5.5 Scanner case-handling rule

The canonical case-sensitive matching rule prevents `creator`/`Creator` collisions where one is a direction name and the other is unrelated. That purpose is preserved; the rule is refined at this catch-up to admit clause-initial capitalised occurrences of multi-word target keys.

**Rule:** The term scanner performs case-sensitive matching on every character of the target except the first; the first character is matched case-insensitively. This preserves the rule's purpose (preventing collisions like `creator` versus `Creator`) while admitting matches for clause-initial capitalised phrasings (e.g. `attention moving without much registering` matches both lowercase mid-sentence occurrences and `Attention moving without much registering` clause-initial). The matched substring renders with its original case; the lookup uses the target-list key form.

**Rationale.** The canonical rule's example clarified that case-sensitivity is to prevent `creator` matching the direction term `Creator` — a single-word ambiguity case. Multi-word target keys (e.g. `attention moving without much registering`, `the role is who he is everywhere`) do not have this ambiguity: no English sentence is going to produce the literal substring "Attention moving without much registering" except as a deliberate reference to the architectural reading. Admitting case-insensitive first-character matching for multi-word keys preserves the surfacing intent for clause-initial occurrences without reopening the collision risk the rule originally guarded against.

The rule applies uniformly (single-word and multi-word targets); the practical effect is most visible for the multi-word v4 canonical surfaced phrasings, which appear in synthesis sentences at variable positions in prose.

**Prose-case acknowledgement.** A small UX gap remains for parenthetical-qualified terms in flowing prose: synthesis sentences that emit a parenthetical-qualified term in flowing prose (e.g. bare "spiritual" or bare "building" mid-sentence) will not surface the term explanation via the prose scanner, because the scanner looks up the matched substring as-is and the targets list contains only the qualifier-keyed form. The label-level wrap pattern (§5.2) addresses the label surfaces (DomainsPanel spiritual label, LifeTexturePanel band_label, LifeContextPanel life-stage labels when surfaced as standalone) but not bare-in-prose occurrences. Use cases for bare in-prose surfacing are rare in the current synthesis sentence libraries; if post-build review reveals real prose-case surfacing needs, a scanner-mode extension (lookup tries `term`, then `term + " (X)"` for each known qualifier) lands as a small follow-up amendment. The conservative read at this catch-up is the label-level wrap pattern plus the case-handling rule above.


## 6. Mobile and desktop responsive rules

The render layer targets viewports from 320px (small mobile) to 1920px+ (desktop). One responsive build; no separate mobile or desktop bundles.

**Breakpoint:** 600px is the single breakpoint, defined in `main.css`. Below 600px is mobile; 600px and above is desktop.

**Responsive behaviour by component:**

| Component | Mobile (≤ 600px) | Desktop (≥ 600px) |
|---|---|---|
| Dashboard container | 100% width, padding `var(--space-lg)` | max-width 680px, centred |
| Headline | `var(--text-5xl)` (resolves to 32px via mobile override) | `var(--text-5xl)` (resolves to 48px) |
| RecognitionParagraph | `var(--text-xl)` (resolves to 17px) | `var(--text-xl)` (resolves to 18px) |
| PatternParagraph | same on both: `var(--text-sm)` (13px) | same |
| Hero rule (`.dashboard__hero-rule`) | margin `var(--space-lg) 0 var(--space-xl)` | same |
| DirectionEvidenceChart | scaled to viewport width, labels may abbreviate | fixed aspect ratio, labels in full |
| DirectionCards grid | `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`, `align-items: start` — collapses to a single column when the viewport is narrower than ~280px + gutters | same multi-column auto-fit; typically 2–3 columns at desktop widths |
| DirectionCard tap target | header `min-height: var(--control-height-lg)` (48px) | header `min-height: var(--control-height-md)` (40px) at the 600px breakpoint |
| PanelGrid (`.panel-grid`: contextual-zone panels) | stacked, single column (`flex-direction: column`, gap `var(--space-lg)`) | same — stacked at all widths since Phase 4d-1 |
| ClosingLines | same on both: `var(--text-lg)` (16px) | same |
| TermPopover position | below anchor | above anchor |

The `--text-5xl`, `--text-3xl`, `--text-4xl`, and `--text-xl` tokens shift their resolved values inside the mobile media query; component CSS uses the token name and lets the cascade handle the responsive shift. No component-level media queries are needed for type scale.

**Touch targets:** All interactive elements (card headers, term indicators, links) have a minimum touch target of 44x44px on mobile, per WCAG 2.5.5.

**Hover behaviour:** Hover states only render when `(hover: hover)` media query is true (i.e., the user has a pointer device). Mobile users get press-active states instead.

### 6.1 Direction-colour tokens and Phase 4d additions

Twelve direction-colour tokens (six active, six inactive), one shared constraint-bar token, and one Phase 4d type-scale addition.

#### Active set — direction-keyed (6 tokens, light + dark)

Each direction has a single active token. Active tokens are used when the direction is named in the headline (i.e., in the firing set's top-3 by pull). The colours are stable per-direction across fixtures: Creator is always its assigned amber when named; Freedom Designer is always teal when named; etc.

| Token | Light | Dark | Hue note |
|---|---|---|---|
| `--color-direction-creator-active` | `#a87c5a` | `#c89878` | warm amber (Creator) |
| `--color-direction-freedom-designer-active` | `#5a8a9a` | `#7aaab8` | cool teal (Freedom Designer) |
| `--color-direction-experience-seeker-active` | `#7a9a6a` | `#9ab288` | muted moss (Experience Seeker) |
| `--color-direction-growth-focused-active` | `#a89060` | `#c8b080` | warm gold (Growth Focused) |
| `--color-direction-relationship-rebuilder-active` | `#9a7a8a` | `#b89aa8` | dusty mauve (Relationship Rebuilder) |
| `--color-direction-contributor-active` | `#7a5a8a` | `#9a7aa8` | muted plum (Contributor) |

Active tokens are consumed at four surfaces:

- Chart bubble fill (when `bubble.is_named_in_headline`).
- Chart bubble label text.
- DirectionCard left-edge accent (when `visual_state === 'named'`; see §4.7.3).
- DirectionCard dot fill (when `visual_state === 'named'`).
- DirectionCard bar fill (when `visual_state === 'named'`; non-named cards use `var(--color-border-secondary)` per §4.7.3).

Direction colour does not propagate to card name text, prose paragraphs, panels, or any other text-level rendering — it is a structural identity device, not a typographic one.

#### Inactive set — rank-keyed (6 tokens, light + dark)

Inactive directions render in graduated greys. **The token naming is rank-based, not direction-based**: `--color-direction-inactive-{1..6}`, where `1` is the most-present (highest pull within the inactive set) and `6` is the least-present (lowest pull). At render time, `DirectionCards.vue` sorts the non-named directions by `Pull.intensity` descending and maps each direction to the corresponding rank token; the chart applies the same logic for non-named bubbles.

Rationale: an inactive direction has no stable per-direction identity in the way a named direction does — what matters visually is its relative pull-rank within the inactive set on the current fixture. The same direction may rank `inactive-1` on one reading and `inactive-5` on another. Direction-keyed naming would imply a stability the data doesn't carry; rank-keyed naming makes the rendering logic legible at the token level.

| Token | Light | Dark | Rank role |
|---|---|---|---|
| `--color-direction-inactive-1` | `#7a7a78` | `#d0d0ce` | most-present (highest pull within inactive set) |
| `--color-direction-inactive-2` | `#8a8a88` | `#b8b8b6` | |
| `--color-direction-inactive-3` | `#a0a09e` | `#a0a09e` | |
| `--color-direction-inactive-4` | `#b0b0ae` | `#888886` | |
| `--color-direction-inactive-5` | `#c0c0be` | `#707070` | |
| `--color-direction-inactive-6` | `#d0d0ce` | `#585856` | least-present (lowest pull within inactive set) |

Note the dark theme **inverts the lightness order**: `inactive-1` is the lightest grey on the dark background, `inactive-6` the darkest. This keeps "most-present" mapped to the most visually-foregrounded grey on each background, regardless of theme.

Inactive tokens are consumed at:

- Chart bubble fill (when `!bubble.is_named_in_headline`).
- Chart bubble label text.
- DirectionCard left-edge accent for `firing_not_named` and `not_firing` cards (see §4.7.3 / §4.7.4).

Within the inactive set, `firing_not_named` and `not_firing` cards both use the same rank-mapped token; the firing-vs-not-firing distinction is carried by the card background and body opacity (§4.7.4) and, on the chart, by bubble fill-opacity.

#### Constraint-bar token (shared panel semantic)

`--color-constraint-bar` is a single shared token used by both `DomainsPanel` and `ConstraintsPanel` for bar fills (§4.8.4 / §4.9.4). The muted clay tone signals *depletion / reduction / constraint pressure* in a register parallel across the two panels.

| Token | Light | Dark | Note |
|---|---|---|---|
| `--color-constraint-bar` | `#a06850` | `#c08870` | muted clay (light) / clay raised for dark backgrounds |

The token is consumed at:

- DomainsPanel bar fills (`reduced_groups → domains → bar fill`; see §4.8.3).
- ConstraintsPanel bar fills (`constraint_lines → bar fill`; see §4.9.3).

Bar tracks across both panels (and the DirectionCard bars in §4.7.6) share `var(--color-border-tertiary)`.

#### Type-scale additions

Phase 4d-2 added one new type-scale token to `main.css`:

| Token | Light desktop | Mobile (≤600px) | Use |
|---|---|---|---|
| `--text-5xl` | `48px` | `32px` | Editorial headline (§4.2). Mobile shift via the `@media (max-width: 600px)` block in `main.css` section 3. |

The token participates in the existing responsive-shift pattern: component CSS references `var(--text-5xl)` and the cascade resolves the mobile value automatically. No component-level media query is needed.

No other tokens were added or renamed in Phase 4d.

### 6.2 New panel responsive composition

The new panels follow the existing token-driven responsive pattern. Specifically:

- **LifeContextPanel** stacks its three paragraph sub-sections vertically at all widths; prose reflows naturally.
- **LifeTexturePanel** stacks its content vertically; chip groups wrap via `flex-wrap: wrap` at narrow widths.
- **ComparisonSurfacePanel** stacks its three sections vertically at all widths; prose reflows naturally.
- **TheNarrowingsPanel** stacks its seven band rows vertically at all widths; the display-name-and-pill horizontal layout per row is comfortable at the narrowest mobile width (320px), with pill wrapping to a second line within the row if exceeded.

### 6.3 Panel-grid pattern (extended for contextual zone)

The existing single-column `panel-grid` wrapper extends to include the five contextual-zone panels in declared order (`LifeContextPanel`, `LifeTexturePanel`, `ConstraintsPanel`, `DomainsPanel`, `TheNarrowingsPanel`). The grid stacks at all widths (per Phase 4d-1 convention) and provides consistent gap and container.

The `ComparisonSurfacePanel` sits outside the `panel-grid` as a standalone section (per §3 component tree). It has its own card framing and a distinct rhetorical position (observational closing read).

The grid's CSS rules (gap, container, alignment) are unchanged; only the children list extends.

### 6.4 Token additions

Four new colour tokens introduced by `TheNarrowingsPanel` per §4.15.4:

- `--color-pill-moderate-bg`
- `--color-pill-moderate-text`
- `--color-pill-high-bg`
- `--color-pill-high-text`

Each token has light-theme and dark-theme values per the existing dual-theme convention in `main.css`. Specific values are set at build guided by the existing clay-tone palette and the WCAG AA contrast requirement.

No other token additions are introduced. The chip styling in `LifeTexturePanel` reuses existing tokens (`--color-background-secondary`, `--color-border-tertiary`, `--color-text-primary`, `--color-text-tertiary`, `--radius-sm`, etc.).

## 7. Accessibility

### 7.1 Document structure

- One `<h1>` per page (the Headline).
- `<h2>` for section headings within the dashboard (Direction Cards, What's reduced, What's heavy, The current shape, The week's texture, Named and surfaced, The seven dimensions, etc.).
- Logical reading order matches visual order.
- All interactive elements are reachable by keyboard.

Each major dashboard section (the chart, the cards, the panels, the closing lines) is wrapped in a `<section>` element with `aria-labelledby` referencing a heading inside the section. This provides landmark navigation for screen reader users beyond `role="main"`. The headings inside these sections are `<h2>` elements (sub-headings of the page's main `<h1>` headline).

**New section landmarks** introduced by the contextual-zone and comparison-surface panels:

- `<section aria-labelledby="life-context-heading">` (per §4.13.2)
- `<section aria-labelledby="life-texture-heading">` (per §4.12.2)
- `<section aria-labelledby="comparison-surface-heading">` (per §4.14.2)
- `<section aria-labelledby="narrowings-heading">` (per §4.15.2)

The existing landmarks (chart, cards, domains, constraints, closing) are unchanged.

### 7.2 ARIA roles and labels

- The dashboard root has `role="main"` and `aria-label="Architecture reading"`.
- Cards: each card is an `<article>` with a `<header>` and persistent body content. The card no longer toggles state (see 4.7.2), so no `aria-expanded`, no `aria-controls`, and no `<button>` header is required. The implicit `article` role is sufficient; no explicit `role="article"` is set. The dot indicator on named cards carries `aria-label="Named in headline"`; the card's `<header>` carries an `aria-label` of the form `"{direction_name} card, {state_label}"`.
- Chart: SVG with `role="img"` and `aria-label`. Bubbles have `<title>` for screen reader fallback.
- TermPopover: `role="dialog"` with `aria-modal="false"` and `aria-labelledby` referencing the term.
- Closing lines region: `role="region"` with `aria-label="Closing observations"`.

**Additions for the new panels:**

- **Chip groups in LifeTexturePanel.** Each chip group (flags_present, flags_absent) uses `role="list"` on the container and `role="listitem"` on each chip. Chips are non-interactive text containers; no button or focusable element inside.
- **Band rows container in TheNarrowingsPanel.** Uses `role="list"` on the rows container and `role="listitem"` on each band row.
- **Pills in TheNarrowingsPanel.** Plain text within their containing listitem; no separate role. Screen readers read pill content as part of the listitem text in document order.
- **TermIndicator (label-level application).** The existing TermIndicator component's accessibility pattern applies unchanged: the `?` button is focusable, labelled `aria-label="Show explanation for {term}"`, opens the popover on Enter/Space/click. The label-level wrap (per §5.2) does not change TermIndicator's behaviour; the wrap simply applies to a display label rather than to a substring within prose.

### 7.3 Keyboard navigation

- Tab order follows visual order.
- Card headers are not interactive; no keyboard activation is required. Tab order traverses focusable elements *inside* cards (term indicator buttons within the meaning sentence, quality line, summary, and expression_space_caption), not the headers themselves.
- Term indicators are focusable; Enter or Space opens the popover.
- Escape closes any open popover.
- Focus rings use `var(--shadow-focus)` (defined in main.css).

Term indicators within the new panels (LifeContextPanel, LifeTexturePanel, ComparisonSurfacePanel, TheNarrowingsPanel) are focusable per the existing pattern. No new interactive elements are introduced (chips are not interactive; pills are not interactive).

### 7.4 Screen reader behaviour

- Card visual_state is communicated in the screen reader text (for example, "Creator, named in headline" or "Experience Seeker, not currently reading as a pull").
- Chart bubbles read out direction name + pull value + movement value via `<title>` fallbacks.
- Popover content is announced when opened.
- Live regions are not used; the dashboard is static once rendered.

**New panel behaviour:**

- **LifeContextPanel**: read as a single section with three stacked sub-sections; each sub-section reads its prose paragraph in declared order. No within-panel sub-labels; the synthesis sentence framing orients screen reader users on which sub-section reading they are on.
- **LifeTexturePanel**: read in summary-first order. Summary reads first; annotation row reads as "{band_label}, {load_state_label}" with the band_label's term-indicator `?` button encountered as a focusable item when Tab is pressed; chip groups read as lists with "Present:" or "Absent:" preceding text; pattern note reads as a final paragraph.
- **ComparisonSurfacePanel**: read as a single section with three sub-sections in order (Confirmed, Quiet, Surfaced). Each sub-section reads its sub-heading then its items. Empty sub-sections are absent from the DOM; screen readers do not encounter them.
- **TheNarrowingsPanel**: read in summary-then-bands order. Summary reads first; the bands list reads each row as "{display_name with term indicator}: {band state pill label}". The term indicator's `?` button is encountered as a focusable item when Tab is pressed; activating it opens the popover.

### 7.5 Reduced motion

The render layer honours the user's reduced-motion preference (already handled at the token level in `main.css` section 4).

The dashboard's only render-layer motion is the bar-fill width transition used in `DirectionCard` (4.7.6), `DomainsPanel` (4.8), and `ConstraintsPanel` (4.9):

```css
.bar-fill { transition: width 0.2s ease; }

@media (prefers-reduced-motion: reduce) {
  .bar-fill { transition: none; }
}
```

On mount and on data update, bars animate to their target width over 200ms. Under the reduced-motion media query, bars appear instantly at their final width. The dashboard entry itself remains instant (no fade-in); only the bar widths transition.

The new panels do not introduce new animations or transitions. The bar-fill transition rule is unchanged and does not apply to the new panels.

### 7.6 Colour contrast

All text-on-background combinations meet WCAG AA (4.5:1 for body text, 3:1 for large text). The token palette in `main.css` was chosen with this constraint; component CSS must not override colours in ways that break it.

The new pill colour tokens (per §6.4) are tuned at build to meet WCAG AA contrast minimums. All other new visual elements use existing tokens that already satisfy the contrast model.

## 8. Edge cases and error states

### 8.1 Empty SlotContent

When a SlotContent has both `interpretive_text === null` AND `token_text === ''`, the consuming component omits the slot entirely (no element, no blank line). Implemented via `v-if` guards on every SlotContent-consuming component.

The slots subject to this rule, across the full component set, include:

- `recognition_paragraph`, `pattern_paragraph`
- Each direction card's `summary`, `meaning_sentence`, and `expression_space_caption`
- Each domain's `intact_callout`; each constraint line's `intact_callout`
- `life_texture_panel.summary`, `life_texture_panel.pattern_note`
- `life_context_panel.life_stage_summary`, `life_context_panel.work_load_summary`, `life_context_panel.sociality_summary`
- `comparison_surface_panel.summary`, each `confirmed[i].sentence`, each `quiet[i].sentence`, each `surfaced[i].sentence`
- `the_narrowings_panel.summary`
- Each closing line's `text`

Per synthesis fallback rules, most of these slots are typically populated (token fallback fills them); the empty-SlotContent rule is the safety net for asymmetric cases (such as `expression_space_caption`) and for the cross-cohort behaviour of the comparison_surface item slots when no items fire.

### 8.2 Empty firing set

When the firing set is empty, the Headline renders `situation_text` instead of `direction_names`. The RecognitionParagraph renders nothing (its token is empty by design). The PatternParagraph renders the empty-pulls shape sentence. All six cards render with `visual_state: 'not_firing'`. The chart renders all six bubbles in the low-opacity treatment. ClosingLines may still fire (stopped_expecting on individual directions per synthesis spec rules).

This is not an error case; it's a valid architectural reading. The dashboard renders calmly.

**Synthesis guarantee:** the situation-naming case is reserved for the empty firing set. When at least one direction fires, synthesis names directions in the headline (top three, per `SYNTHESIS.md` section 4 step 5: 'If zero directions fire, the headline becomes a situation-naming line'). The render layer relies on this: a non-empty firing set always produces at least one card with `visual_state === 'named'`. Multi-direction profiles (4+ firing directions) get three named cards expanded by default; the remaining firing-but-not-named cards are collapsed.

**Both paragraph slots empty.** If both `recognition_paragraph` and `pattern_paragraph` have empty SlotContent (no `interpretive_text`, no `token_text`), both are omitted per the empty-SlotContent rule. The dashboard then shows the headline directly above the chart with no prose between. This is acceptable; the prose is decorative when the architecture has nothing to add beyond what the headline and chart already convey.

### 8.3 Missing term explanation

When a term has no entry in `term_explanations.ts`, the term renders as plain text without the indicator pattern. No error, no console warning in production. The render layer falls back gracefully.

In development, the lookup utility may emit a console.debug for missing terms to surface coverage gaps; this is removed in production builds.

### 8.4 Loading state

While `RenderingInstructions` is being computed (for example, synthesis layer running, or future LLM-augmented work), the dashboard shows a loading state in place of the full render.

**Visual:**
- Centred container, vertical centring on viewport.
- Single line of serif text: "Reading what's there."
- Below it, a quiet pulse animation (a small horizontal bar that fades in and out on a 1.5s cycle), or an alternative non-spinner indicator. Not a spinner; the editorial register avoids spinners.
- Background: `var(--color-background-secondary)`.
- Text colour: `var(--color-text-secondary)`.

**Behaviour:**
- The loading state shows for any duration the computation takes.
- No timeout in v1. The synthesis layer is heuristic-only and fast (under 100ms typical); a hung loading state implies an upstream bug, not a timeout case to handle. If the user perceives a hung state, refresh is the recovery path.
- Future LLM augmentation may take 10 to 30 seconds; if introduced, a 60-second timeout-to-error transition should be added at that time, with a reference code in the error state for support purposes.
- When `RenderingInstructions` arrives, the dashboard renders instantly (no fade-in animation) and replaces the loading state.

**Implementation:** The dashboard parent component renders `<LoadingState />` while `rendering` prop is null/loading; renders the dashboard tree once `rendering` is non-null.

### 8.5 Error state

If `RenderingInstructions` fails to compute (synthesis layer throws, malformed output, network error in future server-rendered scenarios), the dashboard shows a generic error state.

**Loading-to-error transition.** If synthesis throws while the loading state is showing, the loading state is replaced immediately by the error state (no fade, same instant-swap rule as loading-to-ready). App.vue's state moves from `loading` to `error`; the `v-if` chain in App.vue handles the swap.

**Visual:**
- Centred container.
- Single line: "Something's gone wrong."
- Below: "Refresh and try again, or get in touch if it keeps happening."
- An error reference code (UUID or similar) for support purposes.
- Background and styling match the loading state.

**Behaviour:**
- The error is captured to Sentry (or equivalent error tracking) with context: which fixture / man, which layer threw, the error message.
- The user-facing display does NOT show the error message itself (avoid technical jargon).

**Implementation:** Error handling lives at the App.vue level. App.vue uses Vue 3's `errorCaptured` lifecycle hook to catch render errors from any descendant component (including Dashboard and its children). On capture, App sets state to `error` and renders `<ErrorState />`. The hook returns `false` to halt error propagation. Errors from `LoadingState` and `ErrorState` themselves are not caught at this level; they propagate to `app.config.errorHandler` (registered in `main.ts`).

Synthesis call errors (when `RenderingInstructions` computation throws) are caught via try/catch upstream of App's prop input. App's state transitions: `loading` to `error` on synthesis error; `loading` to `ready` on synthesis success; `ready` to `error` on render error captured by `errorCaptured`.

### 8.6 Malformed RenderingInstructions

If the input object is shaped unexpectedly (for example, a slot is missing, a card has unexpected fields), the render layer's defensive defaults apply:

- Missing top-level fields (for example, `closing_lines` is undefined): treated as empty array or absent. The component v-if guards on field presence.
- Extra fields: ignored.
- Wrong types (for example, a string where an object is expected): the component tries to render and may visibly degrade. Vue's runtime will warn in development; the production behaviour depends on the specific component.

The render layer does not exhaustively validate input shape. Validation lives upstream (synthesis layer's output contract). If malformed input causes a render error, the error boundary in App.vue catches it and transitions to error state per section 8.5.

The synthesis layer's contract is the source of truth; if it produces malformed output, that's a synthesis bug. The render layer's defence-in-depth degrades gracefully but is not a substitute for synthesis correctness.

### 8.7 Nullable top-level panel (comparison_surface_panel)

When `rendering.comparison_surface_panel === null`, the parent Dashboard component omits the `<ComparisonSurfacePanel />` element entirely via `v-if` (per §3 component tree). The subsequent panel (`ClosingLines`) flows up naturally with no gap, placeholder, or empty section markup.

The synthesis-emitted null case is documented in `SYNTHESIS.md`: `comparison_surface_panel` is null if and only if `InputMap.self_report.named_absences.length === 0` AND no Surfaced candidates exist. On every other reading, the panel renders (with possibly some empty sub-sections per §4.14.3 empty-section omission).

## 9. File structure

```
src/ui/
├── App.vue                              # top-level Vue app (already scaffolded)
├── main.ts                              # entry point (already scaffolded)
├── components/
│   ├── dashboard/
│   │   ├── Dashboard.vue                # top-level container
│   │   ├── Headline.vue
│   │   ├── RecognitionParagraph.vue
│   │   ├── PatternParagraph.vue
│   │   ├── DirectionEvidenceChart.vue
│   │   ├── DirectionCards.vue
│   │   ├── DirectionCard.vue
│   │   ├── DomainsPanel.vue
│   │   ├── ConstraintsPanel.vue
│   │   ├── LifeContextPanel.vue
│   │   ├── LifeTexturePanel.vue
│   │   ├── ComparisonSurfacePanel.vue
│   │   ├── TheNarrowingsPanel.vue
│   │   ├── ClosingLines.vue
│   │   └── Footer.vue                   # removed; no longer rendered
│   ├── shared/
│   │   ├── TermPopover.vue              # singleton popover
│   │   ├── TermIndicator.vue            # inline term wrapper with ? icon
│   │   ├── LoadingState.vue
│   │   └── ErrorState.vue
│   └── inspection/                      # existing inspection UI (unchanged)
│       └── (existing files)
├── render/
│   ├── dashboard_app_state.ts           # App-level loading/error/ready state machine; orchestrates synthesis call + error capture
│   ├── fixture_loader.ts                # loads fixture inputs/outputs for dev surfaces (DevFixturePicker, AssessmentView)
│   ├── should_render_slot.ts            # empty-SlotContent guard helper used by every slot-consuming component
│   ├── slug.ts                          # slug utility (lowercase, spaces→hyphens) used for stable element ids
│   ├── static_copy.ts                   # static prose strings that don't come from synthesis (headings)
│   ├── term_indicator_targets.ts        # which strings get the term indicator pattern (§5.4)
│   ├── term_lookup.ts                   # lookup utility per §5.3
│   ├── term_popover_store.ts            # singleton popover store (open/close, active term, anchor element) per §5.1
│   └── term_scanner.ts                  # scans rendered prose against term_indicator_targets and emits term/text segments per §5.4
└── styles/
    └── main.css                         # tokens + base + inspection + dashboard
```

Files added during the render build: `dashboard_app_state.ts`, `fixture_loader.ts`, `should_render_slot.ts`, `slug.ts`, `term_popover_store.ts`, `term_scanner.ts`. Each is a small focused utility extracted to keep components thin and to give specific responsibilities (state machine, slot guard, slugging, popover store, prose scanning) a clear home.

The four new panel components (`LifeContextPanel.vue`, `LifeTexturePanel.vue`, `ComparisonSurfacePanel.vue`, `TheNarrowingsPanel.vue`) each follow the existing conventions (one Vue component per file, `<script setup lang="ts">`, scoped styles where component-specific, types imported from `src/synthesis/types.ts`). The `Dashboard.vue` component is extended to include the new panels in its template per §3 component tree. The `DirectionCard.vue` component is extended to render the `expression_space_caption` slot per §4.7.7.

**Conventions:**
- One Vue component per file.
- Components use `<script setup lang="ts">` syntax.
- Component styles are scoped (`<style scoped>`) when component-specific; tokens consumed via `var(--token-name)`.
- Shared component classes live in `main.css` section 8 (Dashboard) when reusable across multiple components.
- TypeScript types for `RenderingInstructions` and its sub-types are imported from the synthesis layer at `src/synthesis/types.ts`. The render layer does not re-declare these types.

**Render utilities (no new files).** The existing utility files are sufficient for the new panels. `term_indicator_targets.ts` extends per §5.4. `term_scanner.ts` extends per §5.5 (case-handling rule). `static_copy.ts` extends per the static-copy keys list below.

### 9.3 Static copy keys

Static copy keys in `static_copy.ts`:

- `chart_heading` (default: 'Direction evidence')
- `cards_heading` (default: 'Direction cards')
- `domains_panel_heading` (default: 'What's reduced')
- `constraints_panel_heading` (default: 'What's heavy')
- `closing_heading` (default: 'Closing observations')

Four new panel-heading keys:

| Key | Default text |
|---|---|
| `life_context_panel_heading` | `The current shape` |
| `life_texture_panel_heading` | `The week's texture` |
| `comparison_surface_panel_heading` | `Named and surfaced` |
| `the_narrowings_panel_heading` | `The seven dimensions` |

Three sub-heading keys for `ComparisonSurfacePanel` sections (per §4.14.3):

| Key | Default text |
|---|---|
| `comparison_surface_section_heading_confirmed` | `Confirmed` |
| `comparison_surface_section_heading_quiet` | `Quiet` |
| `comparison_surface_section_heading_surfaced` | `Surfaced` |

Inline flag-group labels for `LifeTexturePanel` ("Present:", "Absent:") may be sourced from `static_copy.ts` or hardcoded in the component templates; the spec specifies inline-in-component since these labels are short, structural, and unlikely to vary. (If a build-time decision prefers centralising them, additional keys can be added without spec churn.)

The heading text follows the existing register: short, declarative, observational, no second-person voice. The text matches the small-caps tertiary letterspaced typography (`dashboard-card__label`) of existing panel headings.

**Rationale on heading text choices.** Four short observational phrases were chosen to match the existing register of "What's reduced", "What's heavy", "Closing observations":

- `The current shape` (life_context_panel): observational, names the panel's architectural concept (the current life shape across stage, work-load, sociality) without using second person.
- `The week's texture` (life_texture_panel): observational, names the architectural concept (the week's texture) directly. Matches the synthesis-side naming of the panel.
- `Named and surfaced` (comparison_surface_panel): observational, names the two-sided architectural framing (self-report named, architecture surfaced) compactly.
- `The seven dimensions` (the_narrowings_panel): observational, names the architectural concept (the seven narrowing bands) concretely.

The default text is editorial; it can be revised post-launch without affecting the structural spec.

**Scoped styles convention.** Vue's `<style scoped>` adds component-specific data attributes to selectors but does not affect CSS custom property inheritance. Components reference tokens via `var(--token-name)` in scoped styles; the cascade resolves tokens from `:root` (defined in `main.css`) regardless of scope. No special handling is needed for scoped styles to consume tokens.

## 10. Validation

The render layer is tested in three ways.

### 10.1 Component tests (Vitest)

Each component has a unit test verifying:
- Renders correctly with valid props.
- Honours the empty SlotContent rule (renders nothing when both fields are empty).
- Behaves correctly under edge cases (empty firing set, single-renderable-line closing variant per §4.10.2, malformed slot content).

Each new component (LifeContextPanel, LifeTexturePanel, ComparisonSurfacePanel, TheNarrowingsPanel) receives a unit test per the same convention.

### 10.2 Visual regression tests (against fixtures)

The canonical fixture set is rendered at desktop and mobile viewports. Screenshots are compared against baselines. Visual changes flag for review.

This catches:
- Layout breaks at responsive breakpoints.
- Colour or typography drift if tokens change.
- Component composition regressions.

The visual regression set is extended to cover the architectural shapes the new panels exercise. Recommendations (not hard requirements; the existing canonical fixtures continue to work):

- A textured-week fixture for `LifeTexturePanel` (covers the textured `life_texture_band` and `varied_week === true` case).
- A nothing_really fixture for `ComparisonSurfacePanel` maximum-information case (the most architecturally informative comparison surface: empty Confirmed, empty Quiet, populated Surfaced).
- An all-high narrowing fixture for `TheNarrowingsPanel` (covers all-seven-high categorical reading).
- A spiritual-intact fixture for the `DomainsPanel` spiritual extension (covers the rare intact-spiritual case where the spiritual entry does not fall in the never_been_part_of_his_life group).

The canonical fixture set plus the recommendations above produce a visual regression set that exercises the new panels' architectural extremes. Adding the recommended fixtures during build extends coverage; the canonical fixture set covers the typical case.

### 10.3 Accessibility tests

axe-core or equivalent runs against rendered dashboards covering the canonical fixture set plus any added recommendations. Violations of WCAG AA flag as failures. The new panels' accessibility model per §7 is exercised.

### 10.4 End-to-end tests

A small Playwright suite verifies:
- The canonical fixtures render without errors at desktop and mobile.
- Term popovers open and close, including on the new label-level wraps.
- Keyboard navigation reaches all interactive elements.

**Fixture-agnostic discipline.** The render spec is fixture-agnostic in visual treatment: it does not encode visual assumptions tied to specific fixtures. The spec text refers to architectural shapes (e.g. "the sole-entry spiritual case") and to architectural shapes rather than to specific fixture names.

The render spec composes with the cohort as it stands: fixture-specific verification runs against expected.json and expected_synthesis.json files in the test suite, not against a separate cohort grid document.

## 11. What this layer does not do

- Does not interpret data. The render layer renders what synthesis produced; it does not re-derive readings.
- Does not call the engine, the synthesis layer, or any data source other than `RenderingInstructions` and `term_explanations.ts`.
- Does not generate prose dynamically; all text is from synthesis output or term_explanations.ts.
- Does not animate the dashboard entry. Instant render is the rule.
- Does not persist user state across sessions (for example, an open term popover, scroll position, or theme preference if a toggle is later added). The dashboard re-renders cleanly from `RenderingInstructions` on each load.
- Does not implement an experience-suggestion UI. The `experience_candidate_directions` field is for the experience layer, separate.
- Does not render `cross_cutting_panel` as a visible component in the man-facing dashboard. Closing lines surface those readings observationally. The field stays in `RenderingInstructions` for the experience layer and the inspection UI.
- Does not call an LLM. The render layer is heuristic-only.
- Does not use Tailwind, CSS-in-JS, or utility frameworks. Plain CSS only, consuming tokens from `main.css`. Charting math is the single exception: the render layer uses targeted D3 submodules (`d3-scale`, `d3-axis`, `d3-array`) for coordinate scaling, axis rendering, and tick generation in the `DirectionEvidenceChart` component. D3 is used as a math/utility library only — Vue's template renders all SVG elements; D3's selection API is not used.

## 12. Honest concerns and open questions

- **Term coverage.** The render layer's term indicator pattern depends on the static lookup table (`term_indicator_targets.ts`) being kept in sync with `term_explanations.ts`. If a synthesis sentence introduces a new term, both files need updating. Worth a build-time check that warns on terms in synthesis output that aren't in the lookup table.
- **ChartBubble headline-named field — resolved.** A synthesis-spec amendment added `is_named_in_headline: boolean` to ChartBubble (populated from the firing set's top-3, matching the headline's named directions). The render layer reads this directly. Resolved during render build; chart's visual emphasis now aligns with headline naming. The original ambiguity (chart accent treatment for all firing directions vs. only headline-named) was resolved in favour of headline-named to avoid confusion when 4+ directions fire qualitatively but only 3 are named.
- **Chart rendering on very narrow viewports (≤ 600px).** At narrow widths, all bubble labels are hidden (the existing rule). The `<title>` elements remain for screen readers. Axis titles ("Moving toward it" / "How strongly it's calling") may need to abbreviate or hide on the narrowest viewports (320px) — confirm during build. Tick labels and gridlines remain visible.
- **Loading state animation.** The "quiet pulse" animation is described in plain language; the specific implementation (CSS animation, easing curve, duration) is left to the implementer's judgement, guided by the editorial register. Worth getting visual confirmation during the build.
- **Accessibility coverage of the chart.** SVG accessibility is hard. The `role="img"` + `aria-label` approach is the minimum; whether screen reader users can meaningfully interact with the chart's data is an open question. May need a tabular fallback for screen readers.
- **The footer's copy: resolved.** The footer disclaimer text has been removed. The dashboard ends at `ClosingLines` (§4.10). The `Footer.vue` component is no longer rendered in the dashboard. Disposition settled 17 May 2026.
- **Inspection UI integration.** The render layer's components are man-facing. The inspection UI may want to render the same dashboard components (against fixture data) for development. Whether the dashboard components are reusable in the inspection UI, or whether the inspection UI has its own simpler renders, is an open question.
- **Direction-colour palette evolution — resolved.** RENDER.md previously specified a two-tone treatment (single accent + neutral grey) and listed the per-direction palette as an open question. Phase 4d-7 generalised the accent treatment to apply to every card: named cards take the direction's active token; non-named cards take a rank-mapped inactive grey from `--color-direction-inactive-{1..6}`. Chart bubble fills share the same per-card colours by construction (parent `cardColors` map and the chart's bubble-fill logic both reduce to the same active/rank-keyed token references). The original concern — chart-readability in dense fixtures — is settled; the cross-product theming foundation (experience suggestions tied to specific directions) is in place via the direction-keyed active tokens. The palette is no longer an open question.
- **Malformed-input degradation.** Section 8.6 documents the render layer's defensive defaults. The exact per-component behaviour under malformed input (for example, a card missing its `fields` array; a SlotContent with `interpretive_text` set but `token_text` missing) is not exhaustively specified. Real-world malformation should be rare (synthesis is type-checked); when it surfaces, behaviour is iterated case-by-case rather than spec'd in advance.

---

## Confirmation

This spec defines the render layer that consumes `RenderingInstructions` from the synthesis layer and produces the man-facing dashboard. It is build-ready when:

- The synthesis layer is built and producing valid RenderingInstructions for the cohort fixtures.
- The CSS tokens in `main.css` section 8 are sufficient (or are extended to cover any gaps surfaced during build).
- The term_explanations.ts content is authored to acceptable coverage (the spec is forgiving on missing terms; gaps fall back gracefully).
- The static_copy.ts file is authored with the headings and footer text.
- The term_indicator_targets.ts file is curated to match the synthesis output's term vocabulary.

The render layer build follows the same pattern as the engine and synthesis builds: orchestrator-driven, fixture-validated, audit-clean. Visual fine-tuning (chart layout at narrow viewports, loading state animation specifics, card header heights on mobile) iterates during build against the canonical fixture set at desktop and mobile viewports.

---

## Worked examples

The following illustrative examples show the rendering specification in action. They are not the rendering specification; the spec is in §4 and §5 above. The examples help the reader see how the specification composes.

**Worked example 1: TheNarrowingsPanel for an all-seven-high reading.**

For a profile reading all seven bands at `high`:

```
The seven dimensions

  All seven dimensions reading high.

  Structure[?]      : [high]
  Variety[?]        : [high]
  Wanting[?]        : [high]
  Identity[?]       : [high]
  Energy[?]         : [high]
  Relationships[?]  : [high]
  Attention[?]      : [high]
```

(Where `[?]` indicates the TermIndicator's `?` icon trailing each label, and `[high]` is the high-state pill rendered with `--color-pill-high-bg` background.)

**Worked example 2: DomainsPanel with sole-entry spiritual group.**

For a reading where spiritual.value = `never_been_part_of_his_life`, with several reduced domains plus the spiritual sole-entry:

```
What's reduced

  Reduced, wants back
    Time as yours              [====       ]
    Mattering                  [======     ]

  Reduced, at peace
    Body                       [===        ]

  Never been part of life
    Spiritual[?]               [========   ]
```

The "Never been part of life" group renders identically to the multi-entry groups (group label plus bar row structure), with spiritual as the sole entry. The "Spiritual" display label is label-level-wrapped per §5.2 (mapping to the `Spiritual (domain)` term key). The bar intensity reflects how reduced the architecture reads the domain; spiritual's intensity in the never_been_part group is typically high (the domain reads as reduced relative to the architectural absence) per the existing engine reading pipeline.

**Worked example 3: LifeTexturePanel summary-first layout.**

For a reading with `life_texture_band = mixed`, `load_state = loaded by work and weekends`, and the typical contents flag distribution:

```
The week's texture

  Some texture across the week. The pattern shifts week to week.

  Mixed[?] week, loaded by work and weekends.

  Present: [Sees people] [Belongs to a group]
  Absent:  [Active body] [Makes things] [Solo practice] [Weekly activity]

  Weeks vary from one another.
```

The summary line reads first; the annotation row beneath reads the categorical labels (the band_label is label-level-wrapped per §5.2 mapping to `Mixed (week)`); chip groups follow (present prominent, absent muted); pattern note closes.

**Worked example 4: LifeContextPanel prose-only stacked layout.**

For a reading with `life_stage = building`, `paid_work_relationship = consuming` + `primary_load = paid_work` (token fallback), `sociality_default = balanced` (token fallback):

```
The current shape

  Reading: building. The major moves are still ahead.

  Paid work reading: Consuming. Primary load: Paid work.

  Sociality reading: Balanced.
```

Three prose paragraphs stacked in declared order. No within-panel sub-labels; the synthesis sentence framing orients the man on which reading he is on. The interpretive sentence for the life_stage_summary on this reading carries its own "Reading: building." framing per `SYNTHESIS.md`; the token fallbacks for work_load_summary and sociality_summary carry their concept names in the sentence body.

**Worked example 5: ComparisonSurfacePanel with all three sections populated.**

For a reading where two absences were named and the architecture surfaced additional candidates:

```
Named and surfaced

  What's named partly reads in the architecture; some reads as present.

  Confirmed
    Missing sense of meaning. Architecture reads Mattering as reduced.
    Feeling depleted. Architecture reads Energy too.

  Quiet
    A proper conversation now and then. Architecture reads it as present.

  Surfaced
    Architecture reads Creator firing. Not in the named list.
    Architecture reads Time as yours reduced.
```

Each section renders only when populated; empty sections are absent from the DOM. Section sub-headings use the small-caps tertiary letterspaced label style; item sentences render as flowing prose with the term scanner applied.
