// Engine fixture integration tests. Discovers fixtures from /fixtures/, runs the full parseFixture → runEngine → runAssertions pipeline on each, and fails on any assertion failure. Plus an in-memory smoke test that runs unconditionally.

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runEngine } from '../engine';
import { parseFixture, generateFixtureTemplate } from '../fixtures/loader';
import { runAssertions, formatFailures } from '../fixtures/assertions';
import { runFixturePipeline } from '../fixtures/run-fixture-pipeline';
import type { EngineOutput } from '../engine/types';
import type { ExpectedAssertions } from '../fixtures/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '..', '..', 'fixtures');

type DiscoveredFixture = { id: string; dir: string };

function discoverFixtures(): DiscoveredFixture[] {
  if (!fs.existsSync(FIXTURES_DIR)) return [];
  return fs
    .readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      id: entry.name,
      dir: path.join(FIXTURES_DIR, entry.name),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

const fixtures = discoverFixtures();

describe('integration smoke (in-memory)', () => {
  it('parseFixture → runEngine → runAssertions composes cleanly', () => {
    const { inputJson, storyMd } = generateFixtureTemplate();

    const expectedJsonText = JSON.stringify({
      constraints: {
        permission: {
          value: 0,
          band: 'blocked',
          fires: true,
          sub_shape: 'present',
        },
      },
      cross_cutting: {
        between_shapes: { fires: false },
      },
      domains: {
        curiosity: { fires: true, value: 'never_been_part_of_his_life' },
      },
    });

    const parseResult = parseFixture({
      id: 'smoke',
      inputJsonText: inputJson,
      expectedJsonText,
      storyMdText: storyMd,
    });

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const engineResult = runEngine(parseResult.fixture.inputJson);
    expect(engineResult.ok).toBe(true);
    if (!engineResult.ok) return;

    const assertions = runAssertions(
      parseResult.fixture.expectedJson,
      engineResult.output,
    );

    if (assertions.failed > 0) {
      expect.fail(formatFailures(assertions));
    }

    expect(assertions.total).toBeGreaterThan(0);
    expect(assertions.passed).toBe(assertions.total);
  });
});


describe('engine fixtures (against /fixtures/)', () => {
  if (fixtures.length === 0) {
    it.skip('no fixtures present yet (populated from step 13 onwards)', () => {});
    return;
  }

  describe.each(fixtures)('fixture: $id', ({ id, dir }) => {
    it('runs the assembler pipeline and passes all assertions', () => {
      const expectedPath = path.join(dir, 'expected.json');
      if (!fs.existsSync(expectedPath)) {
        expect.fail(`no expected.json for ${id}`);
        return;
      }
      const expectedJsonText = fs.readFileSync(expectedPath, 'utf-8');
      let expectedJson: ExpectedAssertions;
      try {
        expectedJson = JSON.parse(expectedJsonText) as ExpectedAssertions;
      } catch (err) {
        expect.fail(
          `Failed to parse expected.json for fixture "${id}": ${(err as Error).message}`,
        );
        return;
      }

      let engineOutput: EngineOutput;
      try {
        const pipelineResult = runFixturePipeline(id);
        engineOutput = pipelineResult.engine_output as EngineOutput;
      } catch (err) {
        expect.fail(
          `Pipeline failed for fixture "${id}": ${(err as Error).message}`,
        );
        return;
      }

      const assertions = runAssertions(expectedJson, engineOutput);

      if (assertions.failed > 0) {
        expect.fail(`Fixture "${id}" — ${formatFailures(assertions)}`);
        return;
      }

      expect(assertions.passed).toBe(assertions.total);
    });
  });
});
