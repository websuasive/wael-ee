import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it, expect } from 'vitest';
import { runFixturePipeline } from '@/fixtures/run-fixture-pipeline';

const FIXTURE_IDS = ['alan', 'daniel', 'geoffrey', 'mark', 'martin', 'paul', 'raymond'] as const;

describe.each(FIXTURE_IDS)('snapshot: %s', (fixtureId) => {
  it('matches committed snapshot', () => {
    const snapshotPath = path.join(process.cwd(), 'fixtures', fixtureId, 'snapshot.json');

    // Assert snapshot exists
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(
        `no committed snapshot for ${fixtureId} — run the generator (scripts/generate-snapshots.ts)`
      );
    }

    // Read committed snapshot
    const snapshotJson = fs.readFileSync(snapshotPath, 'utf-8');
    const committed = JSON.parse(snapshotJson);

    // Run live pipeline
    const live = runFixturePipeline(fixtureId);

    // Deep-compare each layer separately for localised failure
    expect(live.input_map).toEqual(committed.input_map);
    expect(live.engine_output).toEqual(committed.engine_output);
    expect(live.synthesis_output).toEqual(committed.synthesis_output);
    expect(live.assembler_meta).toEqual(committed.assembler_meta);
  });
});
