import { describe, it, expect } from 'vitest';
import { interpretQ10 } from '@/assembler/q10-interpretation';

describe('interpretQ10', () => {
  it('interprets contributor as direction', () => {
    const result = interpretQ10('contributor');
    expect(result).toEqual({ kind: 'direction', direction: 'contributor' });
  });

  it('interprets experience_seeker as direction', () => {
    const result = interpretQ10('experience_seeker');
    expect(result).toEqual({ kind: 'direction', direction: 'experience_seeker' });
  });

  it('interprets freedom_designer as direction', () => {
    const result = interpretQ10('freedom_designer');
    expect(result).toEqual({ kind: 'direction', direction: 'freedom_designer' });
  });

  it('interprets growth_focused as direction', () => {
    const result = interpretQ10('growth_focused');
    expect(result).toEqual({ kind: 'direction', direction: 'growth_focused' });
  });

  it('interprets creator as direction', () => {
    const result = interpretQ10('creator');
    expect(result).toEqual({ kind: 'direction', direction: 'creator' });
  });

  it('interprets relationship_rebuilder as direction', () => {
    const result = interpretQ10('relationship_rebuilder');
    expect(result).toEqual({ kind: 'direction', direction: 'relationship_rebuilder' });
  });

  it('interprets rest as rest', () => {
    const result = interpretQ10('rest');
    expect(result).toEqual({ kind: 'rest' });
  });

  it('interprets none as none', () => {
    const result = interpretQ10('none');
    expect(result).toEqual({ kind: 'none' });
  });
});
