// Synthesis layer public surface. Exports the orchestrator and the public output contract types per SYNTHESIS.md sections 2.2, 2.3, 5.1, 5.3-5.9. Internal types (ShapeSentence, CalibrationLine, SlotName, MergedDirectionView) are deliberately not re-exported.

export { synthesise } from './synthesise';
export type {
  RenderingInstructions,
  SlotContent,
  HeadlineOutput,
  DirectionCardOutput,
  CardField,
  ChartData,
  ChartBubble,
  DomainsPanel,
  DomainsPanelReducedGroup,
  ReducedDomain,
  ConstraintsPanel,
  ConstraintLine,
  CrossCuttingPanel,
  CrossCuttingPanelEntry,
  ClosingLine,
  ClosingLineId,
  ExperienceCandidate,
  LifeTexturePanel,
  LifeContextPanel,
  ComparisonSurfacePanel,
  ComparisonItem,
  ComparisonReference,
  TheNarrowingsPanel,
  NarrowingBandEntry,
} from './types';
