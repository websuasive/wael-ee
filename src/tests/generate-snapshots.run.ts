import { describe, it } from 'vitest';
import { generateSnapshots } from '../../scripts/generate-snapshots';

describe('snapshot generation', () => {
  it('regenerates committed snapshots', () => {
    if (!process.env.GENERATE_SNAPSHOTS) {
      console.log('Skipping snapshot generation (set GENERATE_SNAPSHOTS=1 to run)');
      return;
    }

    const targetFixture = process.env.FIXTURE_ID;
    generateSnapshots(targetFixture);
  });
});
