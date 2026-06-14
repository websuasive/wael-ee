// Realistic constraints scoring. Implements spec section 5.3, producing the ConstraintsOutput from section 6.6.

import type {
  InputMap,
  ConstraintsOutput,
  EnergyBand,
  TimeBand,
  BodyBand,
  PermissionBand,
} from '../types';

function bandEnergy(v: number): EnergyBand {
  if (v >= 70) return 'full';
  if (v >= 40) return 'moderate';
  return 'heavy_depletion';
}

function bandTime(v: number): TimeBand {
  if (v >= 70) return 'open';
  if (v >= 40) return 'moderate';
  return 'heavy_time_pressure';
}

function bandBody(v: number): BodyBand {
  if (v >= 70) return 'full';
  if (v >= 40) return 'shifted';
  return 'limited';
}

function bandPermission(v: number): PermissionBand {
  if (v >= 70) return 'present';
  if (v >= 40) return 'partial';
  return 'blocked';
}

export function computeRealisticConstraintsOutputs(
  input: InputMap,
  sustainedConstraintIntensity: number,
): ConstraintsOutput {
  const c = input.constraints;
  const energyBand = bandEnergy(c.energy_availability);
  const timeBand = bandTime(c.time_availability);
  const bodyBand = bandBody(c.body_capacity);
  const permissionBand = bandPermission(c.permission);

  return {
    sustained_constraint_intensity: sustainedConstraintIntensity,
    energy: {
      value: c.energy_availability,
      band: energyBand,
      fires: energyBand !== 'full',
    },
    time: {
      value: c.time_availability,
      band: timeBand,
      fires: timeBand !== 'open',
    },
    body_capacity: {
      value: c.body_capacity,
      band: bodyBand,
      fires: bodyBand !== 'full',
    },
    permission: {
      value: c.permission,
      band: permissionBand,
      sub_shape: c.permission_sub_shape,
      fires: c.permission < 70,
    },
  };
}
