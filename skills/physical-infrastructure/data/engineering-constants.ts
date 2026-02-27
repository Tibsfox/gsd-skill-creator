/**
 * Engineering Constants Registry -- Physical Infrastructure Engineering Pack (v1.48)
 *
 * Sources:
 *   NPS_PIPE_SIZES      -- ASME B36.10M (Welded and Seamless Wrought Steel Pipe)
 *   NEC_310_16_AMPACITY -- NEC 2023 Table 310.16 (copper conductors, in conduit, 30C ambient)
 *   FLUID_PROPERTIES    -- ASHRAE Fundamentals Handbook 2021, Chapter 30
 *   MATERIAL_PROPERTIES -- ASME B31.3, AISC Steel Construction Manual
 *
 * All values are reference data only. Verify with current adopted code edition
 * and project-specific conditions before use in construction documents.
 */

// ---------------------------------------------------------------------------
// Type definitions for constant data shapes
// ---------------------------------------------------------------------------

export interface NpsPipeSize {
  nominalSize: string;
  od_in: number;
  schedules: {
    [schedule: string]: {
      wallThickness_in: number;
      id_in: number;
      internalArea_in2: number;
    };
  };
}

export interface AmpacityRecord {
  size: string;
  sizeType: 'AWG' | 'kcmil';
  copper: { temp60C: number; temp75C: number; temp90C: number };
  aluminum: { temp60C: number; temp75C: number; temp90C: number };
}

export interface FluidPropertySet {
  description: string;
  density_kg_m3: number;
  dynamicViscosity_Pa_s: number;
  specificHeat_kJ_kgK: number;
  thermalConductivity_W_mK: number;
  freezePoint_C?: number;
}

export interface MaterialPropertySet {
  description: string;
  tensileStrength_MPa: number;
  yieldStrength_MPa: number;
  thermalExpansion_per_C: number;
  density_kg_m3: number;
  thermalConductivity_W_mK?: number;
}

// ---------------------------------------------------------------------------
// Helper: compute internal area from ID
// ---------------------------------------------------------------------------

function internalArea(id_in: number): number {
  return Math.PI * (id_in / 2) ** 2;
}

// ---------------------------------------------------------------------------
// Section 1: NPS Pipe Sizes -- ASME B36.10M
// ---------------------------------------------------------------------------

function pipeEntry(
  nominalSize: string,
  od_in: number,
  sch40wall: number,
  sch40id: number,
  sch80wall: number,
  sch80id: number,
): NpsPipeSize {
  return {
    nominalSize,
    od_in,
    schedules: {
      '40': { wallThickness_in: sch40wall, id_in: sch40id, internalArea_in2: internalArea(sch40id) },
      '80': { wallThickness_in: sch80wall, id_in: sch80id, internalArea_in2: internalArea(sch80id) },
    },
  };
}

export const NPS_PIPE_SIZES: Record<string, NpsPipeSize> = {
  '0.5':  pipeEntry('0.5',  0.840, 0.109, 0.622, 0.147, 0.546),
  '0.75': pipeEntry('0.75', 1.050, 0.113, 0.824, 0.154, 0.742),
  '1':    pipeEntry('1',    1.315, 0.133, 1.049, 0.179, 0.957),
  '1.25': pipeEntry('1.25', 1.660, 0.140, 1.380, 0.191, 1.278),
  '1.5':  pipeEntry('1.5',  1.900, 0.145, 1.610, 0.200, 1.500),
  '2':    pipeEntry('2',    2.375, 0.154, 2.067, 0.218, 1.939),
  '2.5':  pipeEntry('2.5',  2.875, 0.203, 2.469, 0.276, 2.323),
  '3':    pipeEntry('3',    3.500, 0.216, 3.068, 0.300, 2.900),
  '4':    pipeEntry('4',    4.500, 0.237, 4.026, 0.337, 3.826),
  '6':    pipeEntry('6',    6.625, 0.280, 6.065, 0.432, 5.761),
  '8':    pipeEntry('8',    8.625, 0.322, 7.981, 0.500, 7.625),
  '10':   pipeEntry('10',  10.750, 0.365, 10.020, 0.593, 9.564),
  '12':   pipeEntry('12',  12.750, 0.406, 11.938, 0.687, 11.376),
  '14':   pipeEntry('14',  14.000, 0.375, 13.250, 0.593, 12.814),
  '16':   pipeEntry('16',  16.000, 0.375, 15.250, 0.656, 14.688),
  '18':   pipeEntry('18',  18.000, 0.375, 17.250, 0.750, 16.500),
  '20':   pipeEntry('20',  20.000, 0.375, 19.250, 0.812, 18.376),
  '24':   pipeEntry('24',  24.000, 0.375, 23.250, 0.968, 22.064),
};

// ---------------------------------------------------------------------------
// Section 2: NEC Table 310.16 -- Conductor Ampacity (NEC 2023)
// Copper and aluminum, 3 temperature ratings, in conduit, 30C ambient
// ---------------------------------------------------------------------------

function ampEntry(
  size: string,
  sizeType: 'AWG' | 'kcmil',
  cu60: number, cu75: number, cu90: number,
  al60: number, al75: number, al90: number,
): AmpacityRecord {
  return {
    size,
    sizeType,
    copper: { temp60C: cu60, temp75C: cu75, temp90C: cu90 },
    aluminum: { temp60C: al60, temp75C: al75, temp90C: al90 },
  };
}

export const NEC_310_16_AMPACITY: Record<string, AmpacityRecord> = {
  '14':   ampEntry('14',  'AWG',   15,  20,  25,   /* al */ -1,  -1,  -1),     // Aluminum not listed for 14 AWG
  '12':   ampEntry('12',  'AWG',   20,  25,  30,   15,  20,  25),
  '10':   ampEntry('10',  'AWG',   30,  35,  40,   25,  30,  35),
  '8':    ampEntry('8',   'AWG',   40,  50,  55,   30,  40,  45),
  '6':    ampEntry('6',   'AWG',   55,  65,  75,   40,  50,  60),
  '4':    ampEntry('4',   'AWG',   70,  85,  95,   55,  65,  75),
  '3':    ampEntry('3',   'AWG',   85, 100, 110,   65,  75,  85),
  '2':    ampEntry('2',   'AWG',   95, 115, 130,   75,  90, 100),
  '1':    ampEntry('1',   'AWG',  110, 130, 150,   85, 100, 115),
  '1/0':  ampEntry('1/0', 'AWG',  125, 150, 170,  100, 120, 135),
  '2/0':  ampEntry('2/0', 'AWG',  145, 175, 195,  115, 135, 150),
  '3/0':  ampEntry('3/0', 'AWG',  165, 200, 225,  130, 155, 175),
  '4/0':  ampEntry('4/0', 'AWG',  195, 230, 260,  150, 180, 205),
  '250':  ampEntry('250', 'kcmil', 215, 255, 290,  170, 205, 230),
  '300':  ampEntry('300', 'kcmil', 240, 285, 320,  190, 230, 255),
  '350':  ampEntry('350', 'kcmil', 260, 310, 350,  210, 250, 280),
  '400':  ampEntry('400', 'kcmil', 280, 335, 380,  225, 270, 305),
  '500':  ampEntry('500', 'kcmil', 320, 380, 430,  260, 310, 350),
};

// ---------------------------------------------------------------------------
// Section 3: Fluid Properties -- ASHRAE Fundamentals 2021
// ---------------------------------------------------------------------------

export const FLUID_PROPERTIES: Record<string, FluidPropertySet> = {
  'water': {
    description: 'Water at 60F (15.6C)',
    density_kg_m3: 999.0,
    dynamicViscosity_Pa_s: 1.12e-3,
    specificHeat_kJ_kgK: 4.187,
    thermalConductivity_W_mK: 0.605,
  },
  'chilled-water': {
    description: 'Chilled water at 45F (7.2C)',
    density_kg_m3: 999.8,
    dynamicViscosity_Pa_s: 1.38e-3,
    specificHeat_kJ_kgK: 4.195,
    thermalConductivity_W_mK: 0.574,
  },
  'glycol-30pct': {
    description: '30% Propylene glycol at 40F (4.4C)',
    density_kg_m3: 1036,
    dynamicViscosity_Pa_s: 3.2e-3,
    specificHeat_kJ_kgK: 3.85,
    thermalConductivity_W_mK: 0.45,
    freezePoint_C: -25,
  },
};

// ---------------------------------------------------------------------------
// Section 4: Material Properties -- ASME/AISC
// ---------------------------------------------------------------------------

export const MATERIAL_PROPERTIES: Record<string, MaterialPropertySet> = {
  'carbon-steel-A53': {
    description: 'Carbon Steel ASTM A53 Grade B',
    tensileStrength_MPa: 414,
    yieldStrength_MPa: 241,
    thermalExpansion_per_C: 11.7e-6,   // 6.5e-6 in/(in*F) * 1.8 = 11.7e-6 per C
    density_kg_m3: 7850,
    thermalConductivity_W_mK: 51.9,
  },
  'stainless-304': {
    description: '304 Stainless Steel (ASTM A240)',
    tensileStrength_MPa: 517,
    yieldStrength_MPa: 207,
    thermalExpansion_per_C: 17.8e-6,   // 9.9e-6 in/(in*F) * 1.8 = 17.8e-6 per C
    density_kg_m3: 8000,
    thermalConductivity_W_mK: 16.2,
  },
  'copper-type-L': {
    description: 'Copper Type L (ASTM B88)',
    tensileStrength_MPa: 207,
    yieldStrength_MPa: 69,
    thermalExpansion_per_C: 16.5e-6,
    density_kg_m3: 8940,
    thermalConductivity_W_mK: 391,
  },
};

// ---------------------------------------------------------------------------
// Section 5: Accessor Functions
// ---------------------------------------------------------------------------

/** Look up pipe dimensions by NPS nominal size and schedule. */
export function getPipeSize(
  nps: string,
  schedule: string,
): NpsPipeSize['schedules'][string] & { od_in: number } {
  const pipe = NPS_PIPE_SIZES[nps];
  if (!pipe) {
    throw new Error(
      `Unknown NPS size: ${nps}. Available: ${Object.keys(NPS_PIPE_SIZES).join(', ')}`,
    );
  }
  const sched = pipe.schedules[schedule];
  if (!sched) {
    throw new Error(
      `Schedule ${schedule} not available for NPS ${nps}. Available: ${Object.keys(pipe.schedules).join(', ')}`,
    );
  }
  return { ...sched, od_in: pipe.od_in };
}

/** Look up conductor ampacity by AWG/kcmil size and temperature rating. */
export function getAmpacity(
  awgOrKcmil: string,
  tempRating: 60 | 75 | 90,
  material: 'copper' | 'aluminum' = 'copper',
): number {
  const entry = NEC_310_16_AMPACITY[awgOrKcmil];
  if (!entry) {
    throw new Error(
      `Unknown conductor size: ${awgOrKcmil}. Available: ${Object.keys(NEC_310_16_AMPACITY).join(', ')}`,
    );
  }
  const key = `temp${tempRating}C` as 'temp60C' | 'temp75C' | 'temp90C';
  return entry[material][key];
}

/** Look up a specific property of a fluid by name. */
export function getFluidProperty(
  fluid: string,
  property: keyof FluidPropertySet,
): number {
  const props = FLUID_PROPERTIES[fluid];
  if (!props) {
    throw new Error(
      `Unknown fluid: ${fluid}. Available: ${Object.keys(FLUID_PROPERTIES).join(', ')}`,
    );
  }
  const val = props[property];
  if (typeof val !== 'number') {
    throw new Error(
      `Property '${String(property)}' is not a numeric value for fluid '${fluid}'`,
    );
  }
  return val;
}
