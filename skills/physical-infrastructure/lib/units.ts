/**
 * Unit Conversion Library -- Physical Infrastructure Engineering Pack (v1.48)
 *
 * Provides safe, dimensionally-tracked unit conversions for all engineering domains.
 * Every conversion returns a DimensionalValue carrying the result, its unit label,
 * and the physical dimension it belongs to. Cross-domain conversions (e.g. pressure
 * to length) are detected and throw descriptive errors.
 *
 * Conversion strategy: all units convert to/from their SI base unit. Converting
 * fromUnit -> toUnit goes: fromUnit -> SI -> toUnit. Temperature is special-cased
 * because it requires offset (not just scaling).
 *
 * Conversion factors from:
 *   NIST SP 811 (Guide for the Use of the International System of Units)
 *   ASHRAE Fundamentals 2021
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/** The physical quantity domains -- used to detect mismatched conversions */
export type UnitDimension =
  | 'length'
  | 'mass'
  | 'pressure'
  | 'temperature'
  | 'temperature_delta'
  | 'flow_rate_volumetric'
  | 'flow_rate_mass'
  | 'power'
  | 'energy'
  | 'voltage'
  | 'current'
  | 'resistance'
  | 'area'
  | 'volume'
  | 'velocity'
  | 'density'
  | 'viscosity_dynamic'
  | 'specific_heat'
  | 'thermal_conductivity'
  | 'heat_transfer_coefficient';

/** A numeric value with its unit label and physical domain */
export interface DimensionalValue {
  value: number;
  unit: string;
  dimension: UnitDimension;
}

/** Unit registry entry -- defines how to convert to/from the SI base unit */
interface UnitEntry {
  symbol: string;
  dimension: UnitDimension;
  toSI: (v: number) => number;
  fromSI: (v: number) => number;
}

// ---------------------------------------------------------------------------
// Unit Registry
// ---------------------------------------------------------------------------

export const UNIT_REGISTRY: Record<string, UnitEntry> = {
  // --- Length (SI base: meter) ---
  'm':   { symbol: 'm',   dimension: 'length', toSI: v => v,            fromSI: v => v },
  'mm':  { symbol: 'mm',  dimension: 'length', toSI: v => v / 1000,     fromSI: v => v * 1000 },
  'cm':  { symbol: 'cm',  dimension: 'length', toSI: v => v / 100,      fromSI: v => v * 100 },
  'km':  { symbol: 'km',  dimension: 'length', toSI: v => v * 1000,     fromSI: v => v / 1000 },
  'in':  { symbol: 'in',  dimension: 'length', toSI: v => v * 0.0254,   fromSI: v => v / 0.0254 },
  'ft':  { symbol: 'ft',  dimension: 'length', toSI: v => v * 0.3048,   fromSI: v => v / 0.3048 },
  'yd':  { symbol: 'yd',  dimension: 'length', toSI: v => v * 0.9144,   fromSI: v => v / 0.9144 },
  'mi':  { symbol: 'mi',  dimension: 'length', toSI: v => v * 1609.344, fromSI: v => v / 1609.344 },

  // --- Mass (SI base: kilogram) ---
  'kg':         { symbol: 'kg',         dimension: 'mass', toSI: v => v,              fromSI: v => v },
  'g':          { symbol: 'g',          dimension: 'mass', toSI: v => v / 1000,       fromSI: v => v * 1000 },
  'lb':         { symbol: 'lb',         dimension: 'mass', toSI: v => v * 0.453592,   fromSI: v => v / 0.453592 },
  'ton_metric': { symbol: 'ton_metric', dimension: 'mass', toSI: v => v * 1000,       fromSI: v => v / 1000 },

  // --- Pressure (SI base: Pascal) ---
  'Pa':  { symbol: 'Pa',  dimension: 'pressure', toSI: v => v,              fromSI: v => v },
  'kPa': { symbol: 'kPa', dimension: 'pressure', toSI: v => v * 1000,       fromSI: v => v / 1000 },
  'MPa': { symbol: 'MPa', dimension: 'pressure', toSI: v => v * 1e6,        fromSI: v => v / 1e6 },
  'bar': { symbol: 'bar', dimension: 'pressure', toSI: v => v * 100000,     fromSI: v => v / 100000 },
  'PSI': { symbol: 'PSI', dimension: 'pressure', toSI: v => v * 6894.76,    fromSI: v => v / 6894.76 },
  'psi': { symbol: 'psi', dimension: 'pressure', toSI: v => v * 6894.76,    fromSI: v => v / 6894.76 },

  // --- Flow rate, volumetric (SI base: m3/s) ---
  'm3/s':  { symbol: 'm3/s',  dimension: 'flow_rate_volumetric', toSI: v => v,                 fromSI: v => v },
  'L/s':   { symbol: 'L/s',   dimension: 'flow_rate_volumetric', toSI: v => v / 1000,          fromSI: v => v * 1000 },
  'L/min': { symbol: 'L/min', dimension: 'flow_rate_volumetric', toSI: v => v / 60000,         fromSI: v => v * 60000 },
  'm3/hr': { symbol: 'm3/hr', dimension: 'flow_rate_volumetric', toSI: v => v / 3600,          fromSI: v => v * 3600 },
  'GPM':   { symbol: 'GPM',   dimension: 'flow_rate_volumetric', toSI: v => v * 6.30902e-5,    fromSI: v => v / 6.30902e-5 },

  // --- Power (SI base: Watt) ---
  'W':      { symbol: 'W',      dimension: 'power', toSI: v => v,               fromSI: v => v },
  'kW':     { symbol: 'kW',     dimension: 'power', toSI: v => v * 1000,        fromSI: v => v / 1000 },
  'MW':     { symbol: 'MW',     dimension: 'power', toSI: v => v * 1e6,         fromSI: v => v / 1e6 },
  'HP':     { symbol: 'HP',     dimension: 'power', toSI: v => v * 745.7,       fromSI: v => v / 745.7 },
  'BTU/hr': { symbol: 'BTU/hr', dimension: 'power', toSI: v => v * 0.293071,    fromSI: v => v / 0.293071 },
  'ton':    { symbol: 'ton',    dimension: 'power', toSI: v => v * 3516.85,     fromSI: v => v / 3516.85 },

  // --- Energy (SI base: Joule) ---
  'J':   { symbol: 'J',   dimension: 'energy', toSI: v => v,              fromSI: v => v },
  'kJ':  { symbol: 'kJ',  dimension: 'energy', toSI: v => v * 1000,       fromSI: v => v / 1000 },
  'kWh': { symbol: 'kWh', dimension: 'energy', toSI: v => v * 3.6e6,      fromSI: v => v / 3.6e6 },
  'BTU': { symbol: 'BTU', dimension: 'energy', toSI: v => v * 1055.06,    fromSI: v => v / 1055.06 },

  // --- Area (SI base: m2) ---
  'm2':  { symbol: 'm2',  dimension: 'area', toSI: v => v,               fromSI: v => v },
  'ft2': { symbol: 'ft2', dimension: 'area', toSI: v => v * 0.092903,    fromSI: v => v / 0.092903 },
  'in2': { symbol: 'in2', dimension: 'area', toSI: v => v * 6.4516e-4,   fromSI: v => v / 6.4516e-4 },

  // --- Volume (SI base: m3) ---
  'm3':     { symbol: 'm3',     dimension: 'volume', toSI: v => v,                fromSI: v => v },
  'L':      { symbol: 'L',      dimension: 'volume', toSI: v => v / 1000,         fromSI: v => v * 1000 },
  'gal_US': { symbol: 'gal_US', dimension: 'volume', toSI: v => v * 3.78541e-3,   fromSI: v => v / 3.78541e-3 },
  'ft3':    { symbol: 'ft3',    dimension: 'volume', toSI: v => v * 0.0283168,    fromSI: v => v / 0.0283168 },

  // --- Velocity (SI base: m/s) ---
  'm/s':  { symbol: 'm/s',  dimension: 'velocity', toSI: v => v,             fromSI: v => v },
  'ft/s': { symbol: 'ft/s', dimension: 'velocity', toSI: v => v * 0.3048,    fromSI: v => v / 0.3048 },

  // --- Density (SI base: kg/m3) ---
  'kg/m3':  { symbol: 'kg/m3',  dimension: 'density', toSI: v => v,              fromSI: v => v },
  'lb/ft3': { symbol: 'lb/ft3', dimension: 'density', toSI: v => v * 16.0185,    fromSI: v => v / 16.0185 },

  // --- Dynamic viscosity (SI base: Pa*s) ---
  'Pa*s': { symbol: 'Pa*s', dimension: 'viscosity_dynamic', toSI: v => v,          fromSI: v => v },
  'cP':   { symbol: 'cP',   dimension: 'viscosity_dynamic', toSI: v => v / 1000,   fromSI: v => v * 1000 },

  // --- Specific heat (SI base: J/(kg*K)) ---
  'J/(kg*K)':     { symbol: 'J/(kg*K)',     dimension: 'specific_heat', toSI: v => v,            fromSI: v => v },
  'kJ/(kg*K)':    { symbol: 'kJ/(kg*K)',    dimension: 'specific_heat', toSI: v => v * 1000,     fromSI: v => v / 1000 },
  'BTU/(lb*F)':   { symbol: 'BTU/(lb*F)',   dimension: 'specific_heat', toSI: v => v * 4186.8,   fromSI: v => v / 4186.8 },

  // --- Thermal conductivity (SI base: W/(m*K)) ---
  'W/(m*K)':        { symbol: 'W/(m*K)',        dimension: 'thermal_conductivity', toSI: v => v,            fromSI: v => v },
  'BTU/(hr*ft*F)':  { symbol: 'BTU/(hr*ft*F)',  dimension: 'thermal_conductivity', toSI: v => v * 1.73073,  fromSI: v => v / 1.73073 },

  // --- Electrical ---
  'V':     { symbol: 'V',     dimension: 'voltage',    toSI: v => v, fromSI: v => v },
  'kV':    { symbol: 'kV',    dimension: 'voltage',    toSI: v => v * 1000, fromSI: v => v / 1000 },
  'A':     { symbol: 'A',     dimension: 'current',    toSI: v => v, fromSI: v => v },
  'mA':    { symbol: 'mA',    dimension: 'current',    toSI: v => v / 1000, fromSI: v => v * 1000 },
  'ohm':   { symbol: 'ohm',   dimension: 'resistance', toSI: v => v, fromSI: v => v },
  'kohm':  { symbol: 'kohm',  dimension: 'resistance', toSI: v => v * 1000, fromSI: v => v / 1000 },
};

// ---------------------------------------------------------------------------
// convert() -- the main conversion function
// ---------------------------------------------------------------------------

/**
 * Convert a value from one unit to another within the same physical dimension.
 * Returns a DimensionalValue with the result, target unit, and dimension tag.
 * Throws if units are from different dimensions or if a unit is unknown.
 */
export function convert(value: number, fromUnit: string, toUnit: string): DimensionalValue {
  const fromEntry = UNIT_REGISTRY[fromUnit];
  if (!fromEntry) {
    throw new Error(
      `Unknown unit: '${fromUnit}'. Available units: ${Object.keys(UNIT_REGISTRY).join(', ')}`,
    );
  }

  const toEntry = UNIT_REGISTRY[toUnit];
  if (!toEntry) {
    throw new Error(
      `Unknown unit: '${toUnit}'. Available units: ${Object.keys(UNIT_REGISTRY).join(', ')}`,
    );
  }

  if (fromEntry.dimension !== toEntry.dimension) {
    throw new Error(
      `Cannot convert ${fromUnit} (${fromEntry.dimension}) to ${toUnit} (${toEntry.dimension}): incompatible dimensions`,
    );
  }

  const siValue = fromEntry.toSI(value);
  const result = toEntry.fromSI(siValue);

  return { value: result, unit: toUnit, dimension: fromEntry.dimension };
}

// ---------------------------------------------------------------------------
// convertTemperature() -- offset-aware temperature conversion
// ---------------------------------------------------------------------------

/**
 * Convert a temperature value between Celsius, Fahrenheit, Kelvin, and Rankine.
 * Uses offset formulae (not just scaling) so 0C = 32F, not 0F.
 */
export function convertTemperature(
  value: number,
  fromUnit: 'C' | 'F' | 'K' | 'R',
  toUnit: 'C' | 'F' | 'K' | 'R',
): DimensionalValue {
  // Step 1: Convert to Kelvin (intermediate)
  let kelvin: number;
  switch (fromUnit) {
    case 'C': kelvin = value + 273.15; break;
    case 'F': kelvin = (value - 32) * 5 / 9 + 273.15; break;
    case 'K': kelvin = value; break;
    case 'R': kelvin = value * 5 / 9; break;
  }

  // Step 2: Convert from Kelvin to target
  let result: number;
  switch (toUnit) {
    case 'C': result = kelvin - 273.15; break;
    case 'F': result = (kelvin - 273.15) * 9 / 5 + 32; break;
    case 'K': result = kelvin; break;
    case 'R': result = kelvin * 9 / 5; break;
  }

  return { value: result, unit: toUnit, dimension: 'temperature' };
}

// ---------------------------------------------------------------------------
// assertSameDomain() -- runtime dimension safety check
// ---------------------------------------------------------------------------

/**
 * Assert that two DimensionalValues have the same physical dimension.
 * Throws a descriptive error if they differ.
 */
export function assertSameDomain(a: DimensionalValue, b: DimensionalValue): void {
  if (a.dimension !== b.dimension) {
    throw new Error(
      `Dimensional mismatch: '${a.unit}' is ${a.dimension}, '${b.unit}' is ${b.dimension}. ` +
      `Cannot combine values of different physical dimensions.`,
    );
  }
}
