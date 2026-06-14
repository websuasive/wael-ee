<template>
  <section
    class="dashboard-card chart-card"
    aria-labelledby="chart-heading"
  >
    <h2
      id="chart-heading"
      class="dashboard-card__label"
    >
      {{ headingText }}<PanelHeadingTooltip term="direction_evidence_panel" />
    </h2>
    <svg
      role="img"
      :aria-label="chartAriaLabel"
      :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
      preserveAspectRatio="xMidYMid meet"
      class="chart__svg"
    >
      <rect
        :x="MARGIN.left"
        :y="MARGIN.top"
        :width="PLOT_WIDTH"
        :height="PLOT_HEIGHT"
        class="chart__plot-area"
      />

      <rect
        :x="MARGIN.left"
        :y="MARGIN.top"
        :width="PLOT_WIDTH / 2"
        :height="PLOT_HEIGHT / 2"
        class="chart__quadrant-bg chart__quadrant-bg--called-not-moving"
      />
      <rect
        :x="MARGIN.left + PLOT_WIDTH / 2"
        :y="MARGIN.top"
        :width="PLOT_WIDTH / 2"
        :height="PLOT_HEIGHT / 2"
        class="chart__quadrant-bg chart__quadrant-bg--called-moving"
      />
      <rect
        :x="MARGIN.left"
        :y="MARGIN.top + PLOT_HEIGHT / 2"
        :width="PLOT_WIDTH / 2"
        :height="PLOT_HEIGHT / 2"
        class="chart__quadrant-bg chart__quadrant-bg--quiet"
      />
      <rect
        :x="MARGIN.left + PLOT_WIDTH / 2"
        :y="MARGIN.top + PLOT_HEIGHT / 2"
        :width="PLOT_WIDTH / 2"
        :height="PLOT_HEIGHT / 2"
        class="chart__quadrant-bg chart__quadrant-bg--moving-without-calling"
      />

      <line
        v-for="t in INTERIOR_X_TICKS"
        :key="`vgrid-${t}`"
        :x1="xScale(t)"
        :y1="MARGIN.top"
        :x2="xScale(t)"
        :y2="MARGIN.top + PLOT_HEIGHT"
        class="chart__gridline"
      />

      <line
        v-for="t in INTERIOR_Y_TICKS"
        :key="`hgrid-${t}`"
        :x1="MARGIN.left"
        :y1="yScale(t)"
        :x2="MARGIN.left + PLOT_WIDTH"
        :y2="yScale(t)"
        class="chart__gridline"
      />

      <text
        v-for="t in X_TICKS"
        :key="`xtick-${t}`"
        :x="xScale(t)"
        :y="MARGIN.top + PLOT_HEIGHT + 18"
        text-anchor="middle"
        class="chart__tick-label"
      >
        {{ t }}
      </text>

      <text
        v-for="t in Y_TICKS"
        :key="`ytick-${t}`"
        :x="MARGIN.left - 8"
        :y="yScale(t) + 4"
        text-anchor="end"
        class="chart__tick-label"
      >
        {{ t }}
      </text>

      <text
        :x="MARGIN.left + PLOT_WIDTH / 2"
        :y="VIEWBOX_HEIGHT - 10"
        text-anchor="middle"
        class="chart__axis-title"
      >
        How much am I doing it
      </text>

      <text
        :x="20"
        :y="MARGIN.top + PLOT_HEIGHT / 2"
        text-anchor="middle"
        class="chart__axis-title"
        :transform="`rotate(-90 20 ${MARGIN.top + PLOT_HEIGHT / 2})`"
      >
        How strongly it&rsquo;s calling
      </text>

      <text
        :x="xScale(25)"
        :y="MARGIN.top - 8"
        text-anchor="middle"
        class="chart__quadrant-label"
      >
        Called, not moving
      </text>
      <text
        :x="xScale(75)"
        :y="MARGIN.top - 8"
        text-anchor="middle"
        class="chart__quadrant-label"
      >
        Called, moving
      </text>
      <text
        :x="xScale(25)"
        :y="MARGIN.top + PLOT_HEIGHT + 36"
        text-anchor="middle"
        class="chart__quadrant-label"
      >
        Quiet
      </text>
      <text
        :x="xScale(75)"
        :y="MARGIN.top + PLOT_HEIGHT + 36"
        text-anchor="middle"
        class="chart__quadrant-label"
      >
        Moving without calling
      </text>

      <g
        v-for="layout in labelLayouts"
        :key="layout.bubble.direction_engine_name"
        class="chart__bubble-group"
      >
        <title>{{ titleFor(layout.bubble) }}</title>
        <circle
          :cx="bubbleX(layout.bubble)"
          :cy="bubbleY(layout.bubble)"
          :r="bubbleRadius(layout.bubble)"
          :class="bubbleClass(layout.bubble)"
          :fill="layout.bubble.is_desired_direction ? 'none' : bubbleFillColor(layout.bubble)"
          :stroke="bubbleFillColor(layout.bubble)"
          :fill-opacity="layout.bubble.is_desired_direction ? 0 : bubbleOpacity(layout.bubble)"
        />
        <text
          v-if="!hideLabels"
          :x="
            layout.side === 'right'
              ? bubbleX(layout.bubble) +
                bubbleRadius(layout.bubble) +
                LABEL_GAP
              : bubbleX(layout.bubble) -
                bubbleRadius(layout.bubble) -
                LABEL_GAP
          "
          :y="bubbleY(layout.bubble) + layout.dy + 4"
          :text-anchor="layout.side === 'right' ? 'start' : 'end'"
          :class="bubbleLabelClass(layout.bubble)"
          :fill="bubbleLabelColor(layout.bubble)"
          :opacity="bubbleLabelOpacity(layout.bubble)"
        >
          {{ layout.bubble.direction_name }}
        </text>
      </g>
    </svg>
  </section>
</template>

<script setup lang="ts">
// DirectionEvidenceChart — RENDER.md section 4.5. Scatter chart with axes,
// tick labels, gridlines, plot-area framing, two-tone bubble treatment, and
// label collision avoidance. d3-scale provides coordinate scaling; Vue's
// template renders all SVG elements (no D3 selection API).
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { scaleLinear } from 'd3-scale';
import type { ChartData, ChartBubble } from '../../../synthesis';
import type { DirectionName } from '../../../engine';
import { staticCopy } from '../../render/static_copy';
import PanelHeadingTooltip from '../shared/PanelHeadingTooltip.vue';

const props = defineProps<{
  data: ChartData;
  showInactive: boolean;
}>();

const ACTIVE_COLOR_TOKENS: Record<DirectionName, string> = {
  creator: 'var(--color-direction-creator-active)',
  freedom_designer: 'var(--color-direction-freedom-designer-active)',
  experience_seeker: 'var(--color-direction-experience-seeker-active)',
  growth_focused: 'var(--color-direction-growth-focused-active)',
  relationship_rebuilder: 'var(--color-direction-relationship-rebuilder-active)',
  contributor: 'var(--color-direction-contributor-active)',
};

// Index 0..5 corresponds to inactive rank 1..6 (darkest to lightest).
const INACTIVE_COLOR_TOKENS: readonly string[] = [
  'var(--color-direction-inactive-1)',
  'var(--color-direction-inactive-2)',
  'var(--color-direction-inactive-3)',
  'var(--color-direction-inactive-4)',
  'var(--color-direction-inactive-5)',
  'var(--color-direction-inactive-6)',
];

const VIEWBOX_WIDTH = 560;
const VIEWBOX_HEIGHT = 440;
const MARGIN = { top: 40, right: 24, bottom: 72, left: 80 };
const PLOT_WIDTH = VIEWBOX_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = VIEWBOX_HEIGHT - MARGIN.top - MARGIN.bottom;
const BASE_RADIUS = 14;
const LABEL_GAP = 8;
const MOBILE_BREAKPOINT = 600;

const X_TICKS = [0, 25, 50, 75, 100];
const Y_TICKS = [0, 25, 50, 75, 100];
const INTERIOR_X_TICKS = [25, 50, 75];
const INTERIOR_Y_TICKS = [25, 50, 75];

const xScale = scaleLinear()
  .domain([0, 100])
  .range([MARGIN.left, MARGIN.left + PLOT_WIDTH]);

const yScale = scaleLinear()
  .domain([0, 100])
  .range([MARGIN.top + PLOT_HEIGHT, MARGIN.top]);

const headingText = staticCopy.chart_heading;
const chartAriaLabel = 'Direction evidence chart';

const activeDirections = computed(() =>
  props.data.bubbles.filter((b) => b.is_named_in_headline),
);

const directionsToRender = computed(() => {
  // Suppressed-man fallback: if no active directions, always show all.
  if (activeDirections.value.length === 0) {
    return props.data.bubbles;
  }
  // Otherwise: show all if showInactive is true, active only if false.
  return props.showInactive ? props.data.bubbles : activeDirections.value;
});

const viewportWidth = ref<number>(
  typeof window !== 'undefined' ? window.innerWidth : 800,
);
const hideLabels = computed<boolean>(
  () => viewportWidth.value < MOBILE_BREAKPOINT,
);

function handleResize(): void {
  viewportWidth.value = window.innerWidth;
}

onMounted(() => {
  window.addEventListener('resize', handleResize, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

function bubbleX(bubble: ChartBubble): number {
  return xScale(bubble.movement);
}

function bubbleY(bubble: ChartBubble): number {
  return yScale(bubble.pull);
}

function bubbleRadius(bubble: ChartBubble): number {
  const sizeMultiplier = bubble.is_named_in_headline ? 1.5 : 0.7;
  return BASE_RADIUS * bubble.specificity_size * sizeMultiplier;
}

function bubbleClass(bubble: ChartBubble): Record<string, boolean> {
  return {
    chart__bubble: true,
    'chart__bubble--desired': bubble.is_desired_direction,
  };
}

const inactiveRanks = computed<Map<DirectionName, number>>(() => {
  const inactive = directionsToRender.value
    .filter((b) => !b.is_named_in_headline)
    .sort((a, b) => b.pull - a.pull); // highest pull first
  const ranks = new Map<DirectionName, number>();
  inactive.forEach((b, i) => ranks.set(b.direction_engine_name, i + 1));
  return ranks;
});

function bubbleFillColor(bubble: ChartBubble): string {
  if (bubble.is_named_in_headline) {
    return ACTIVE_COLOR_TOKENS[bubble.direction_engine_name];
  }
  const rank = inactiveRanks.value.get(bubble.direction_engine_name) ?? 6;
  return INACTIVE_COLOR_TOKENS[rank - 1] ?? INACTIVE_COLOR_TOKENS[5]!;
}

function bubbleLabelColor(bubble: ChartBubble): string {
  return bubbleFillColor(bubble);
}

function bubbleLabelClass(bubble: ChartBubble): Record<string, boolean> {
  return {
    'chart__bubble-label': true,
    'chart__bubble-label--lead': bubble.is_named_in_headline,
  };
}

function bubbleLabelOpacity(bubble: ChartBubble): number {
  return bubble.is_named_in_headline ? 1.0 : 0.6;
}

function bubbleOpacity(bubble: ChartBubble): number {
  if (bubble.is_named_in_headline) return 1.0;
  const isFiring =
    bubble.pull_quality_state !== 'empty' || bubble.pull >= 50;
  return isFiring ? 0.5 : 0.5;
}

function titleFor(bubble: ChartBubble): string {
  return `${bubble.direction_name}, pull ${Math.round(bubble.pull)}, movement ${Math.round(bubble.movement)}`;
}

type BubblePosition = {
  bubble: ChartBubble;
  x: number;
  y: number;
  radius: number;
};

type LabelLayout = {
  bubble: ChartBubble;
  side: 'right' | 'left';
  dy: number;
};

type LabelRect = { x1: number; y1: number; x2: number; y2: number };

const LABEL_HEIGHT = 14;
const APPROX_GLYPH_WIDTH = 7;
const VERTICAL_SPACING = 18;
const MAX_OFFSET_STEPS = 4;

function estLabelWidth(name: string): number {
  return name.length * APPROX_GLYPH_WIDTH;
}

function labelRectAt(
  p: BubblePosition,
  side: 'right' | 'left',
  dy: number,
): LabelRect {
  const labelY = p.y + dy;
  const w = estLabelWidth(p.bubble.direction_name);
  if (side === 'right') {
    const x1 = p.x + p.radius + LABEL_GAP;
    return {
      x1,
      y1: labelY - LABEL_HEIGHT / 2,
      x2: x1 + w,
      y2: labelY + LABEL_HEIGHT / 2,
    };
  }
  const x2 = p.x - p.radius - LABEL_GAP;
  return {
    x1: x2 - w,
    y1: labelY - LABEL_HEIGHT / 2,
    x2,
    y2: labelY + LABEL_HEIGHT / 2,
  };
}

function rectsOverlap(a: LabelRect, b: LabelRect): boolean {
  return !(a.x2 < b.x1 || b.x2 < a.x1 || a.y2 < b.y1 || b.y2 < a.y1);
}

type Candidate = { side: 'right' | 'left'; dy: number };

function generateCandidates(p: BubblePosition): Candidate[] {
  const candidates: Candidate[] = [];
  // Tier 0: natural position (no vertical offset).
  candidates.push({ side: 'right', dy: 0 });
  candidates.push({ side: 'left', dy: 0 });

  // Tier 1+: vertical offsets, biased by pull. Strong bubbles (pull > 50)
  // prefer to displace their label upward (negative dy in SVG coords); weak
  // bubbles prefer downward.
  const preferUp = p.bubble.pull > 50;
  for (let step = 1; step <= MAX_OFFSET_STEPS; step++) {
    const offset = step * VERTICAL_SPACING;
    const primaryDy = preferUp ? -offset : +offset;
    const secondaryDy = preferUp ? +offset : -offset;
    candidates.push({ side: 'right', dy: primaryDy });
    candidates.push({ side: 'left', dy: primaryDy });
    candidates.push({ side: 'right', dy: secondaryDy });
    candidates.push({ side: 'left', dy: secondaryDy });
  }
  return candidates;
}

const labelLayouts = computed<LabelLayout[]>(() => {
  // Multi-candidate placement. Each bubble has a candidate set of
  // side × vertical-offset slots. Walking bubbles by descending pull
  // (alphabetical tiebreak), each is placed at the first candidate that
  // fits the plot bounds and doesn't overlap any already-placed rect.
  // If no candidate works, the label is placed at its default slot anyway
  // (last-resort fallback) so every bubble always gets a visible label.
  const positions: BubblePosition[] = directionsToRender.value.map((b) => ({
    bubble: b,
    x: bubbleX(b),
    y: bubbleY(b),
    radius: bubbleRadius(b),
  }));

  const PLOT_LEFT = MARGIN.left;
  const PLOT_RIGHT = MARGIN.left + PLOT_WIDTH;
  const PLOT_TOP = MARGIN.top;
  const PLOT_BOTTOM = MARGIN.top + PLOT_HEIGHT;

  const sorted = [...positions].sort((a, b) => {
    if (b.bubble.pull !== a.bubble.pull) return b.bubble.pull - a.bubble.pull;
    return a.bubble.direction_engine_name.localeCompare(
      b.bubble.direction_engine_name,
    );
  });

  const placedRects: LabelRect[] = [];
  const layoutsByName = new Map<string, LabelLayout>();

  for (const p of sorted) {
    const candidates = generateCandidates(p);
    let placed = false;
    for (const cand of candidates) {
      const rect = labelRectAt(p, cand.side, cand.dy);
      if (rect.x1 < PLOT_LEFT || rect.x2 > PLOT_RIGHT) continue;
      if (rect.y1 < PLOT_TOP || rect.y2 > PLOT_BOTTOM) continue;
      if (placedRects.some((r) => rectsOverlap(rect, r))) continue;
      layoutsByName.set(p.bubble.direction_engine_name, {
        bubble: p.bubble,
        side: cand.side,
        dy: cand.dy,
      });
      placedRects.push(rect);
      placed = true;
      break;
    }
    if (!placed) {
      layoutsByName.set(p.bubble.direction_engine_name, {
        bubble: p.bubble,
        side: 'right',
        dy: 0,
      });
      placedRects.push(labelRectAt(p, 'right', 0));
    }
  }

  // Return in original bubble order so the template's v-for is stable.
  return positions.map(
    (p) => layoutsByName.get(p.bubble.direction_engine_name)!,
  );
});

</script>

<style scoped>
.chart-card {
  margin-bottom: var(--space-lg);
}

.chart__svg {
  display: block;
  width: 100%;
  height: auto;
}

.chart__plot-area {
  fill: var(--color-background-secondary);
}

.chart__gridline {
  stroke: var(--color-border-tertiary);
  stroke-width: 1;
  opacity: 0.6;
}

.chart__tick-label {
  pointer-events: none;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  fill: var(--color-text-tertiary);
}

.chart__axis-title {
  pointer-events: none;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  fill: var(--color-text-secondary);
}

.chart__bubble {
  stroke-width: 1.5;
}

.chart__bubble--desired {
  stroke-dasharray: 4 3;
}

.chart__bubble-label {
  pointer-events: none;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
}

.chart__bubble-label--lead {
  font-weight: var(--font-weight-semibold);
}

.chart__quadrant-label {
  pointer-events: none;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  fill: var(--color-text-tertiary);
  opacity: 0.65;
}

.chart__quadrant-bg {
  pointer-events: none;
}

.chart__quadrant-bg--called-not-moving {
  fill: #f59e0b;
  opacity: 0.06;
}

.chart__quadrant-bg--called-moving {
  fill: #92400e;
  opacity: 0.05;
}

.chart__quadrant-bg--quiet {
  fill: var(--color-text-tertiary);
  opacity: 0.03;
}

.chart__quadrant-bg--moving-without-calling {
  fill: #6b7280;
  opacity: 0.05;
}
</style>
