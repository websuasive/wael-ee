// Browser-friendly answers loader using Vite's import.meta.glob. Bundles all /fixtures/<id>/answers.json files into the build at compile time. Synchronous access after initial module load. Mirrors fixture_loader.

export type AnswersLoadResult =
  | { ok: true; fixtureId: string; answers: unknown }
  | { ok: false; fixtureId: string; reason: string };

const answersModules = import.meta.glob('/fixtures/*/answers.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const answersById: Record<string, unknown> = {};
for (const [path, json] of Object.entries(answersModules)) {
  const match = /\/fixtures\/([^/]+)\/answers\.json$/.exec(path);
  if (match !== null && match[1] !== undefined) {
    answersById[match[1]] = json;
  }
}

export function listAvailableAnswers(): string[] {
  return Object.keys(answersById).sort();
}

export function loadAnswersInput(fixtureId: string): AnswersLoadResult {
  const json = answersById[fixtureId];
  if (json === undefined) {
    return {
      ok: false,
      fixtureId,
      reason: `Answers fixture "${fixtureId}" not found. Available: ${listAvailableAnswers().join(', ')}`,
    };
  }
  return { ok: true, fixtureId, answers: json };
}
