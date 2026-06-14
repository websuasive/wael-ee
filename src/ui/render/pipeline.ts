// Pipeline runner: given a validated QuestionnaireAnswers, run assembler -> engine -> synthesis.
// Extracted from activeReading.loadFromAnswers for reuse by both fixture path and questionnaire flow.

import type { QuestionnaireAnswers } from '@/assembler';
import type { EngineOutput, InputMap } from '@/engine';
import type { RenderingInstructions } from '@/synthesis';
import { assembleFor } from '@/assembler';
import { validateInputMap } from '@/engine';
import { runEngine } from '@/engine';
import { synthesise } from '@/synthesis';

export interface PipelineResult {
  inputMap: InputMap;
  engineOutput: EngineOutput;
  renderingInstructions: RenderingInstructions;
  reach_confidence: 'high' | 'low';
  consistency_flags: import('@/assembler/consistency/types').ConsistencyFlag[];
}

export interface PipelineOptions {
  /** Identifier for the source (e.g., fixtureId, userId, or 'questionnaire') */
  sourceId?: string;
}

/**
 * Run the full pipeline: assembler -> engine -> synthesis.
 * Takes a validated QuestionnaireAnswers (the complete object).
 * Validation must happen BEFORE calling this function.
 */
export async function runPipelineFromAnswers(
  answers: QuestionnaireAnswers,
  options?: PipelineOptions,
): Promise<PipelineResult> {
  const sourceId = options?.sourceId || 'unknown';

  // Assemble InputMap (using sourceId as targetUser for consistency checks)
  const emit = assembleFor(sourceId, answers);

  // Validate InputMap
  const check = validateInputMap(emit.input_map);
  if (!check.ok) {
    const messages = check.errors
      .map((e) => `  ${e.code} at "${e.path}": ${e.message}`)
      .join('\n');
    throw new Error(
      `Assembled InputMap invalid for source "${sourceId}":\n${messages}`,
    );
  }

  // Run engine
  const engineResult = runEngine(emit.input_map);
  if (!engineResult.ok) {
    const messages = engineResult.errors
      .map((e) => `  ${e.code} at "${e.path}": ${e.message}`)
      .join('\n');
    throw new Error(
      `Engine validation failed for source "${sourceId}":\n${messages}`,
    );
  }

  // Synthesise rendering instructions
  const rendering = synthesise(engineResult.output, emit.input_map);

  return {
    inputMap: emit.input_map,
    engineOutput: engineResult.output,
    renderingInstructions: rendering,
    reach_confidence: emit.reach_confidence,
    consistency_flags: emit.consistency_flags,
  };
}
