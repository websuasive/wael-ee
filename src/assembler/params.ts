// PROVISIONAL — tunable. Domain wanting derivation floor.
export const WANTING_CURRENT_STATE_FLOOR = 30;

// PROVISIONAL — tunable. felt_cost ordered-table rule outputs.
export const FELT_COST_STRONG_QUICKENING = 80; // rule 1
export const FELT_COST_STRONG = 70; // rule 2
export const FELT_COST_EMERGING_NEVER_HELD = 55; // rule 3
export const FELT_COST_NEVER_HELD_FLOOR = 15; // rule 4
export const FELT_COST_ANTICIPATION_NONE = 25; // rule 5
export const FELT_COST_MILD_STOPPED = 50; // rule 6
export const FELT_COST_MILD_ACTIVE = 35; // rule 7
export const FELT_COST_MILD_VITAL = 55; // rule 8
export const FELT_COST_DEFAULT = 40; // rule 9
// PROVISIONAL — tunable. felt_cost in-rule thresholds.
export const FELT_COST_VITALITY_FLOOR = 45; // rule 8: vitality >= 45
export const FELT_COST_MOVEMENT_FLOOR = 60; // rule 7: current_movement >= 60

// PROVISIONAL — tunable. stated_strength ordered-table outputs.
export const STATED_STRENGTH_NONE = 0; // rule 1: anticipation none
export const STATED_STRENGTH_QUICKENING = 64; // rule 2: anticipation quickening
export const STATED_STRENGTH_MILD_SATURATED = 0; // rule 3: mild + movement >= floor (contentment flicker)
export const STATED_STRENGTH_MILD_LIVE = 30; // rule 4: mild + movement < floor
export const STATED_STRENGTH_SPECIFICITY_BONUS = 6; // +6 on rule-4 path when specificity == strong (-> 36)
// PROVISIONAL — tunable. stated_strength "doing plenty" movement split.
// Separate from FELT_COST_MOVEMENT_FLOOR by design: different question, independently tunable.
export const STATED_STRENGTH_MOVEMENT_FLOOR = 60;
// PROVISIONAL — tunable. saturation "established movement" floor.
// Separate constant by design: different question, independently tunable.
export const SATURATION_MOVEMENT_FLOOR = 60;

// PROVISIONAL — tunable. energy_availability bands (Q25 a/b/c/d/e).
export const ENERGY_AVAILABILITY_BANDS = { a: 10, b: 30, c: 50, d: 70, e: 90 } as const;
// PROVISIONAL — tunable. body_capacity bands (Q27 a/b/c/d).
export const BODY_CAPACITY_BANDS = { a: 85, b: 65, c: 45, d: 25 } as const;
// PROVISIONAL — tunable. permission ladder (Q30 a/b/c/d/e). [calibration watch: say 40 vs act 45 near-equal]
export const PERMISSION_LADDER = { a: 70, b: 45, c: 40, d: 25, e: 25 } as const;
