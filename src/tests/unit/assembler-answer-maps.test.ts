import { describe, it, expect } from 'vitest';
import {
  mapLifeShapeDuration,
  mapRecentLifeShapeChange,
  mapRecentReaching,
  mapPrimaryLoad,
  mapPaidWorkRelationship,
  mapSocialityDefault,
  deriveRoleConsolidation,
  mapAttentionPattern,
  mapRelationalPresence,
  mapCapacityStrain,
} from '@/assembler/answer-maps';
import { makeAnswers } from '@/tests/helpers/make-answers';

describe('mapLifeShapeDuration', () => {
  it('maps a to recent', () => {
    expect(mapLifeShapeDuration('a')).toBe('recent');
  });

  it('maps b to sustained', () => {
    expect(mapLifeShapeDuration('b')).toBe('sustained');
  });

  it('maps c to long', () => {
    expect(mapLifeShapeDuration('c')).toBe('long');
  });
});

describe('mapRecentLifeShapeChange', () => {
  it('maps a to no', () => {
    expect(mapRecentLifeShapeChange('a')).toBe('no');
  });

  it('maps b to yes', () => {
    expect(mapRecentLifeShapeChange('b')).toBe('yes');
  });

  it('maps c to yes (collapse)', () => {
    expect(mapRecentLifeShapeChange('c')).toBe('yes');
  });
});

describe('mapRecentReaching', () => {
  it('maps a to recent_and_awkward', () => {
    expect(mapRecentReaching('a')).toBe('recent_and_awkward');
  });

  it('maps b to mid_stream', () => {
    expect(mapRecentReaching('b')).toBe('mid_stream');
  });

  it('maps c to long_established', () => {
    expect(mapRecentReaching('c')).toBe('long_established');
  });

  it('maps d to no_current_reaching', () => {
    expect(mapRecentReaching('d')).toBe('no_current_reaching');
  });
});

describe('mapPrimaryLoad', () => {
  it('maps a to paid_work', () => {
    expect(mapPrimaryLoad('a')).toBe('paid_work');
  });

  it('maps b to caregiving', () => {
    expect(mapPrimaryLoad('b')).toBe('caregiving');
  });

  it('maps c to household_admin', () => {
    expect(mapPrimaryLoad('c')).toBe('household_admin');
  });

  it('maps d to none', () => {
    expect(mapPrimaryLoad('d')).toBe('none');
  });
});

describe('mapPaidWorkRelationship', () => {
  it('maps a to functional', () => {
    expect(mapPaidWorkRelationship('a')).toBe('functional');
  });

  it('maps b to consuming', () => {
    expect(mapPaidWorkRelationship('b')).toBe('consuming');
  });

  it('maps c to defining', () => {
    expect(mapPaidWorkRelationship('c')).toBe('defining');
  });

  it('maps d to between', () => {
    expect(mapPaidWorkRelationship('d')).toBe('between');
  });

  it('maps e to chosen', () => {
    expect(mapPaidWorkRelationship('e')).toBe('chosen');
  });

  it('maps f to peripheral', () => {
    expect(mapPaidWorkRelationship('f')).toBe('peripheral');
  });

  it('maps g to peripheral (retired maps to peripheral)', () => {
    expect(mapPaidWorkRelationship('g')).toBe('peripheral');
  });
});

describe('mapSocialityDefault', () => {
  it('maps a to solitary_by_default', () => {
    expect(mapSocialityDefault('a')).toBe('solitary_by_default');
  });

  it('maps b to social_by_default', () => {
    expect(mapSocialityDefault('b')).toBe('social_by_default');
  });

  it('maps c to balanced', () => {
    expect(mapSocialityDefault('c')).toBe('balanced');
  });
});

describe('deriveRoleConsolidation', () => {
  it('q31=c ignores activity and returns holds_other_selves', () => {
    const answers = makeAnswers({ q31_role_consolidation: 'c' });
    expect(deriveRoleConsolidation(answers)).toBe('holds_other_selves');
  });

  it('q31=b ignores activity and returns role_inflected', () => {
    const answers = makeAnswers({ q31_role_consolidation: 'b' });
    expect(deriveRoleConsolidation(answers)).toBe('role_inflected');
  });

  it('q31=a with activity present (>=2) returns holds_other_selves', () => {
    const answers = makeAnswers({
      q31_role_consolidation: 'a',
      per_direction_card_a: {
        contributor: 'c',
        experience_seeker: 'd',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
    });
    expect(deriveRoleConsolidation(answers)).toBe('holds_other_selves');
  });

  it('q31=a with activity absent (<2) returns role_consolidated', () => {
    const answers = makeAnswers({
      q31_role_consolidation: 'a',
      per_direction_card_a: {
        contributor: 'b',
        experience_seeker: 'a',
        freedom_designer: 'a',
        growth_focused: 'a',
        creator: 'a',
        relationship_rebuilder: 'a',
      },
    });
    expect(deriveRoleConsolidation(answers)).toBe('role_consolidated');
  });
});

describe('mapAttentionPattern', () => {
  it('maps a to engaged', () => {
    expect(mapAttentionPattern('a')).toBe('engaged');
  });

  it('maps b to intermittent', () => {
    expect(mapAttentionPattern('b')).toBe('intermittent');
  });

  it('maps c to autopilot', () => {
    expect(mapAttentionPattern('c')).toBe('autopilot');
  });
});

describe('mapRelationalPresence', () => {
  it('maps a to present', () => {
    expect(mapRelationalPresence('a')).toBe('present');
  });

  it('maps b to partial', () => {
    expect(mapRelationalPresence('b')).toBe('partial');
  });

  it('maps c to mostly_absent', () => {
    expect(mapRelationalPresence('c')).toBe('mostly_absent');
  });
});

describe('mapCapacityStrain', () => {
  it('maps a to no', () => {
    expect(mapCapacityStrain('a')).toBe('no');
  });

  it('maps b to no (collapse)', () => {
    expect(mapCapacityStrain('b')).toBe('no');
  });

  it('maps c to yes', () => {
    expect(mapCapacityStrain('c')).toBe('yes');
  });
});
