/** Unit conversion library stub -- implementation in Task 2 */
export type UnitDimension = 'length' | 'mass' | 'pressure' | 'temperature' | 'temperature_delta'
  | 'flow_rate_volumetric' | 'flow_rate_mass' | 'power' | 'energy' | 'voltage' | 'current'
  | 'resistance' | 'area' | 'volume' | 'velocity' | 'density' | 'viscosity_dynamic'
  | 'specific_heat' | 'thermal_conductivity' | 'heat_transfer_coefficient';

export interface DimensionalValue {
  value: number;
  unit: string;
  dimension: UnitDimension;
}

export const UNIT_REGISTRY: Record<string, unknown> = {};

export function convert(_value: number, _fromUnit: string, _toUnit: string): DimensionalValue {
  return { value: 0, unit: _toUnit, dimension: 'length' };
}

export function convertTemperature(_value: number, _from: string, _to: string): DimensionalValue {
  return { value: 0, unit: _to, dimension: 'temperature' };
}

export function assertSameDomain(_a: DimensionalValue, _b: DimensionalValue): void {
  // stub
}
