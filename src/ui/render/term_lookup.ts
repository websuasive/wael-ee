// Term explanation lookup. Implements RENDER.md section 5.3's lookup-then-strip-parenthetical rule. Returns null when the term has no entry; consumer renders the term as plain text in that case.

import { TERM_EXPLANATIONS } from '../../synthesis/data/term_explanations';

export function lookupTerm(term: string): string | null {
  const direct = TERM_EXPLANATIONS[term];
  if (direct !== undefined) return direct;

  // Fallback: strip parenthetical qualifiers
  const stripped = term.replace(/\s*\(.*?\)\s*$/, '');
  const fallback = TERM_EXPLANATIONS[stripped];
  return fallback !== undefined ? fallback : null;
}
