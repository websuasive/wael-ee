import * as fs from 'node:fs';
import * as path from 'node:path';
import { assembleFor } from '@/assembler';
import { runEngine } from '@/engine';
import { synthesise } from '@/synthesis';
import type { QuestionnaireAnswers } from '@/assembler';

export interface SnapshotResult {
  input_map: unknown;
  engine_output: unknown;
  synthesis_output: unknown;
  assembler_meta: {
    reach_confidence: 'high' | 'low';
    consistency_flags: unknown[];
  };
}

export function runFixturePipeline(fixtureId: string): SnapshotResult {
  const answersPath = path.join(process.cwd(), 'fixtures', fixtureId, 'answers.json');
  const answersJson = fs.readFileSync(answersPath, 'utf-8');
  const answers: QuestionnaireAnswers = JSON.parse(answersJson);

  // Stage 1: assembler
  const assemblerResult = assembleFor(fixtureId, answers);
  const { input_map, reach_confidence, consistency_flags } = assemblerResult;

  // Stage 2: engine
  const engineResult = runEngine(input_map);
  if (!engineResult.ok) {
    throw new Error(
      `Engine validation failed for fixture ${fixtureId}: ${JSON.stringify(engineResult.errors)}`
    );
  }
  const engine_output = engineResult.output;

  // Stage 3: synthesis
  const synthesis_output = synthesise(engine_output, input_map);

  return {
    input_map,
    engine_output,
    synthesis_output,
    assembler_meta: {
      reach_confidence,
      consistency_flags,
    },
  };
}
