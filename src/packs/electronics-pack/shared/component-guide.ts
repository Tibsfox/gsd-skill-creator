/**
 * Component Selection Guide
 *
 * Typed arrays and lookup functions for resistors, capacitors, and
 * semiconductor packages. Data sourced from Horowitz & Hill (H&H)
 * and standard manufacturer datasheets.
 *
 * Phase 511 Plan 01 -- ELEC-08
 */

// ============================================================================
// Interfaces
// ============================================================================

/** Resistor type with construction and performance characteristics */
export interface ResistorType {
  name: string;
  construction: string;
  tolerance: string;
  tempCoefficient: string;
  powerRange: string;
  applications: string[];
  avoid: string[];
  costRelative: 'low' | 'medium' | 'high';
}

/** Capacitor type with dielectric and electrical characteristics */
export interface CapacitorType {
  name: string;
  dielectric: string;
  capacitanceRange: string;
  voltageRange: string;
  tolerance: string;
  esr: string;
  applications: string[];
  avoid: string[];
}

/** Semiconductor package with physical and thermal characteristics */
export interface SemiconductorPackage {
  name: string;
  pinCount: number;
  maxPower: number;
  thermalResistance: string;
  footprint: string;
  applications: string[];
}

// ============================================================================
// Resistor Types
// ============================================================================

export const RESISTOR_TYPES: ResistorType[] = [
  {
    name: 'Carbon Film',
    construction: 'Thin carbon film deposited on ceramic substrate, spiral cut for value adjustment',
    tolerance: '5%',
    tempCoefficient: '200-500 ppm/C',
    powerRange: '0.125-2 W',
    applications: [
      'general purpose circuits',
      'pull-up and pull-down resistors',
      'non-critical biasing',
      'hobby and prototyping',
    ],
    avoid: [
      'precision measurement circuits',
      'low-noise audio stages',
      'temperature-sensitive applications',
    ],
    costRelative: 'low',
  },
  {
    name: 'Metal Film',
    construction: 'Thin metal alloy (NiCr) film sputtered on ceramic, laser trimmed',
    tolerance: '1%',
    tempCoefficient: '50-100 ppm/C',
    powerRange: '0.125-1 W',
    applications: [
      'precision analog circuits',
      'instrumentation and measurement',
      'audio signal path',
      'feedback networks',
      'voltage dividers requiring accuracy',
    ],
    avoid: [
      'high-power dissipation',
      'pulse/surge applications',
    ],
    costRelative: 'medium',
  },
  {
    name: 'Wirewound',
    construction: 'Resistance wire (NiCr or CuNi) wound on ceramic core',
    tolerance: '0.01%',
    tempCoefficient: '5-20 ppm/C',
    powerRange: '0.5-300 W',
    applications: [
      'precision current sensing',
      'high-power loads and dummy loads',
      'calibration standards',
      'power supply bleeder resistors',
    ],
    avoid: [
      'high-frequency circuits (inductive parasitics)',
      'compact SMD designs',
      'cost-sensitive mass production',
    ],
    costRelative: 'high',
  },
  {
    name: 'Thick Film SMD',
    construction: 'Thick film resistive paste screen-printed on alumina substrate',
    tolerance: '1-5%',
    tempCoefficient: '100-300 ppm/C',
    powerRange: '0.05-1 W (package dependent)',
    applications: [
      'general SMD circuits',
      'digital pull-ups and terminators',
      'LED current limiting',
      'high-volume production',
    ],
    avoid: [
      'precision analog front-ends',
      'high-power applications (limited by package)',
      'low-noise instrumentation',
    ],
    costRelative: 'low',
  },
  {
    name: 'Thin Film Precision',
    construction: 'Thin NiCr film sputtered on silicon or ceramic, photolithographically patterned',
    tolerance: '0.1%',
    tempCoefficient: '5-25 ppm/C',
    powerRange: '0.05-0.5 W',
    applications: [
      'precision voltage references',
      'DAC and ADC gain setting',
      'instrumentation amplifier feedback',
      'precision measurement bridges',
    ],
    avoid: [
      'high-power applications',
      'cost-sensitive designs where 1% suffices',
      'applications requiring surge handling',
    ],
    costRelative: 'high',
  },
];

// ============================================================================
// Capacitor Types
// ============================================================================

export const CAPACITOR_TYPES: CapacitorType[] = [
  {
    name: 'Ceramic (MLCC)',
    dielectric: 'NPO/C0G (stable) or X7R/X5R (high-K)',
    capacitanceRange: '1 pF - 10 uF',
    voltageRange: '6.3 V - 1 kV',
    tolerance: '5-20% (X7R), 1-5% (NPO)',
    esr: 'Very low (< 100 mOhm at 1 MHz)',
    applications: [
      'power supply decoupling and bypass',
      'high-frequency filtering',
      'timing circuits (NPO only)',
      'RF matching networks (NPO)',
      'SMPS input/output filtering',
    ],
    avoid: [
      'bulk energy storage',
      'audio coupling (X7R exhibits piezoelectric microphonics)',
      'precision timing (X7R loses capacitance with DC bias)',
    ],
  },
  {
    name: 'Electrolytic (Aluminum)',
    dielectric: 'Aluminum oxide (Al2O3) on etched foil',
    capacitanceRange: '0.1 uF - 10000 uF',
    voltageRange: '6.3 V - 450 V',
    tolerance: '20%',
    esr: 'Moderate (50 mOhm - 5 Ohm)',
    applications: [
      'bulk power supply filtering',
      'energy storage and hold-up',
      'audio coupling in non-critical paths',
      'motor start capacitors',
    ],
    avoid: [
      'high-frequency decoupling (poor ESR/ESL)',
      'precision timing circuits',
      'reverse voltage applications (polarized)',
      'high-temperature environments (electrolyte dries out)',
    ],
  },
  {
    name: 'Film (Polyester)',
    dielectric: 'Polyester (PET/Mylar) or Polypropylene (PP)',
    capacitanceRange: '1 nF - 10 uF',
    voltageRange: '50 V - 1 kV',
    tolerance: '5-10%',
    esr: 'Low (< 500 mOhm)',
    applications: [
      'audio signal coupling and filtering',
      'snubber circuits for power electronics',
      'timing circuits',
      'sample-and-hold circuits',
      'crossover networks',
    ],
    avoid: [
      'miniaturized designs (physically large)',
      'high-frequency RF applications',
      'bulk energy storage',
    ],
  },
  {
    name: 'Tantalum',
    dielectric: 'Tantalum pentoxide (Ta2O5) on sintered slug',
    capacitanceRange: '0.1 uF - 1000 uF',
    voltageRange: '2.5 V - 50 V',
    tolerance: '10-20%',
    esr: 'Low-moderate (50-500 mOhm)',
    applications: [
      'compact power filtering where size matters',
      'voltage regulator output capacitors',
      'portable and space-constrained designs',
    ],
    avoid: [
      'circuits with voltage spikes (tantalum ignition risk)',
      'applications without current limiting on charge path',
      'cost-sensitive high-volume designs',
      'reverse voltage conditions (catastrophic failure)',
    ],
  },
  {
    name: 'Mica',
    dielectric: 'Natural or synthetic mica sheets with silver electrodes',
    capacitanceRange: '1 pF - 10 nF',
    voltageRange: '100 V - 5 kV',
    tolerance: '1-5%',
    esr: 'Extremely low',
    applications: [
      'RF resonant circuits',
      'precision oscillators',
      'high-voltage coupling',
      'transmitter tank circuits',
    ],
    avoid: [
      'bulk storage (tiny capacitance values only)',
      'cost-sensitive applications (expensive)',
      'physically constrained designs (large for value)',
    ],
  },
];

// ============================================================================
// Semiconductor Packages
// ============================================================================

export const SEMICONDUCTOR_PACKAGES: SemiconductorPackage[] = [
  {
    name: 'TO-92',
    pinCount: 3,
    maxPower: 0.5,
    thermalResistance: '200 C/W (junction to ambient)',
    footprint: 'Through-hole, 4.2 x 3.8 mm',
    applications: [
      'small-signal transistors (2N2222, 2N3904)',
      'voltage regulators up to 100 mA (78L05)',
      'temperature sensors (LM35, DS18B20)',
      'low-power switching',
    ],
  },
  {
    name: 'TO-220',
    pinCount: 3,
    maxPower: 75,
    thermalResistance: '1.5-3 C/W (junction to case), 50 C/W (junction to ambient without heatsink)',
    footprint: 'Through-hole, 10.2 x 15.9 mm, heatsink tab',
    applications: [
      'power transistors and MOSFETs (IRF540)',
      'voltage regulators (LM7805, LM317)',
      'power supply designs up to several amps',
      'motor drivers and audio power stages',
      'high-power switching',
    ],
  },
  {
    name: 'SOT-23',
    pinCount: 3,
    maxPower: 0.35,
    thermalResistance: '250-350 C/W (junction to ambient)',
    footprint: 'SMD, 2.9 x 1.3 mm',
    applications: [
      'small-signal SMD transistors (MMBT3904)',
      'low-power voltage references',
      'ESD protection diodes',
      'compact switching circuits',
    ],
  },
  {
    name: 'DIP-8',
    pinCount: 8,
    maxPower: 1,
    thermalResistance: '100-150 C/W (junction to ambient)',
    footprint: 'Through-hole, 9.5 x 6.4 mm',
    applications: [
      'op-amps (LM741, NE5532, OPA2134)',
      'timers (555)',
      'comparators (LM393)',
      'prototyping-friendly ICs',
      'EEPROM and serial flash',
    ],
  },
  {
    name: 'SOIC-8',
    pinCount: 8,
    maxPower: 0.5,
    thermalResistance: '125-175 C/W (junction to ambient)',
    footprint: 'SMD, 5.0 x 4.0 mm',
    applications: [
      'SMD op-amps and comparators',
      'voltage regulators (small form factor)',
      'serial memory ICs',
      'gate drivers',
      'production PCB designs replacing DIP-8',
    ],
  },
];

// ============================================================================
// Lookup Functions
// ============================================================================

/**
 * Find resistor types suitable for a given application keyword.
 *
 * Searches the applications array of each resistor type for a
 * case-insensitive match on the keyword.
 *
 * @param application - Keyword to search for (e.g., 'precision', 'general', 'audio')
 * @returns Array of matching ResistorType entries
 */
export function selectResistorType(application: string): ResistorType[] {
  const keyword = application.toLowerCase();
  return RESISTOR_TYPES.filter((r) =>
    r.applications.some((app) => app.toLowerCase().includes(keyword)),
  );
}

/**
 * Find capacitor types suitable for a given application keyword.
 *
 * Searches the applications array of each capacitor type for a
 * case-insensitive match on the keyword.
 *
 * @param application - Keyword to search for (e.g., 'decoupling', 'audio', 'timing')
 * @returns Array of matching CapacitorType entries
 */
export function selectCapacitorType(application: string): CapacitorType[] {
  const keyword = application.toLowerCase();
  return CAPACITOR_TYPES.filter((c) =>
    c.applications.some((app) => app.toLowerCase().includes(keyword)),
  );
}

/**
 * Find semiconductor packages that can handle at least the specified power.
 *
 * Filters packages where maxPower >= powerWatts.
 *
 * @param powerWatts - Required power dissipation in watts
 * @returns Array of matching SemiconductorPackage entries
 */
export function selectPackage(powerWatts: number): SemiconductorPackage[] {
  return SEMICONDUCTOR_PACKAGES.filter((p) => p.maxPower >= powerWatts);
}
