// Term scanner. Walks a synthesis prose string and emits text/term segments per RENDER.md section 5.4: case-sensitive, word-boundary-anchored, longest-match-wins, first-occurrence-per-string. Consumers iterate the segments and render text vs term segments differently (term segments wrap in <TermIndicator>).

import { termIndicatorTargets } from './term_indicator_targets';

export type TermScanSegment =
  | { kind: 'text'; value: string }
  | { kind: 'term'; value: string };

// Memoised candidate list, sorted longest-first (longest-match-wins).
const CANDIDATES: readonly string[] = [...termIndicatorTargets].sort(
  (a, b) => b.length - a.length,
);

// Word character: [A-Za-z0-9_]. Matches JavaScript regex \w semantics.
function isWordChar(ch: string | undefined): boolean {
  if (ch === undefined) return false;
  return /[A-Za-z0-9_]/.test(ch);
}

function isBoundaryAt(input: string, pos: number, length: number): boolean {
  const before = pos === 0 ? undefined : input[pos - 1];
  const after = pos + length >= input.length ? undefined : input[pos + length];
  return !isWordChar(before) && !isWordChar(after);
}

export function scanTermsInString(input: string): TermScanSegment[] {
  const segments: TermScanSegment[] = [];
  if (input.length === 0) return segments;

  const consumed = new Set<string>();
  let textStart = 0;
  let pos = 0;

  while (pos < input.length) {
    let matched: string | null = null;
    for (const candidate of CANDIDATES) {
      if (consumed.has(candidate)) continue;
      if (candidate.length === 0) continue;
      if (pos + candidate.length > input.length) continue;
      // Case-insensitive first character, case-sensitive remainder (RENDER_V4.md §5.5).
      // Architectural rationale: the canonical case-sensitive rule prevented collisions
      // like creator/Creator. Multi-word target keys (e.g. "attention moving without much
      // registering") do not have this ambiguity; admitting case-insensitive first-character
      // matching preserves the surfacing intent for clause-initial capitalized phrasings
      // without reopening collision risk.
      const inputSubstring = input.substring(pos, pos + candidate.length);
      const firstCharMatch =
        inputSubstring[0]?.toLowerCase() === candidate[0]?.toLowerCase();
      const restMatch =
        candidate.length === 1 ||
        inputSubstring.substring(1) === candidate.substring(1);
      if (!firstCharMatch || !restMatch) continue;
      if (!isBoundaryAt(input, pos, candidate.length)) continue;
      matched = candidate;
      break;
    }

    if (matched !== null) {
      if (pos > textStart) {
        segments.push({ kind: 'text', value: input.substring(textStart, pos) });
      }
      segments.push({ kind: 'term', value: input.substring(pos, pos + matched.length) });
      consumed.add(matched);
      pos += matched.length;
      textStart = pos;
    } else {
      pos += 1;
    }
  }

  if (textStart < input.length) {
    segments.push({ kind: 'text', value: input.substring(textStart) });
  }

  return segments;
}
