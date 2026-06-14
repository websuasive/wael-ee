// Sentence interpolation utility. Implements SYNTHESIS.md section 6.10's literal-replacement substitution. Missing-key-leaves-placeholder-intact is intentional per spec.

export type InterpolationContext = Record<string, string | number>;

const PLACEHOLDER_RE = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

export function interpolate(
  template: string,
  context: InterpolationContext,
): string {
  return template.replace(PLACEHOLDER_RE, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(context, key)) {
      return String(context[key]);
    }
    return match;
  });
}
