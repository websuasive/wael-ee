import * as fs from 'node:fs';
import * as path from 'node:path';
import { runFixturePipeline } from '@/fixtures/run-fixture-pipeline';

const FIXTURE_IDS = ['alan', 'daniel', 'geoffrey', 'mark', 'martin', 'paul', 'raymond'] as const;

export function generateSnapshots(targetFixture?: string) {
  const fixturesToProcess = targetFixture
    ? [targetFixture]
    : [...FIXTURE_IDS].sort();

  for (const fixtureId of fixturesToProcess) {
    try {
      console.log(`Processing fixture: ${fixtureId}`);
      const result = runFixturePipeline(fixtureId);

      const snapshotPath = path.join(process.cwd(), 'fixtures', fixtureId, 'snapshot.json');
      const snapshotJson = JSON.stringify(result, null, 2) + '\n';
      fs.writeFileSync(snapshotPath, snapshotJson, 'utf-8');

      const stats = fs.statSync(snapshotPath);
      const lineCount = snapshotJson.split('\n').length;
      console.log(`  Wrote ${stats.size} bytes, ${lineCount} lines to ${snapshotPath}`);
    } catch (error) {
      console.error(`  FAILED at stage for fixture ${fixtureId}:`);
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  console.log('\nDone');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSnapshots(process.argv[2]);
}
