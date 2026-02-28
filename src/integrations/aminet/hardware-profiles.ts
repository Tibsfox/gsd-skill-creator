/**
 * Hardware profile library for FS-UAE emulator configuration.
 *
 * Defines the 5 standard Amiga hardware profiles as embedded TypeScript
 * constants with lookup utilities. Each profile maps to an FS-UAE
 * `amiga_model` value with appropriate CPU, chipset, memory, display,
 * and Kickstart ROM configuration.
 *
 * Profiles are the foundation for config generation, ROM selection,
 * and profile auto-selection from package metadata.
 *
 * @module hardware-profiles
 */

// ---------------------------------------------------------------------------
// Types (defined here until 241-01 adds them to types.ts)
// ---------------------------------------------------------------------------

/**
 * Valid hardware profile identifiers.
 */
export type HardwareProfileId =
  | 'a500'
  | 'a1200'
  | 'a1200-030'
  | 'a4000'
  | 'whdload';

/**
 * Amiga chipset generation.
 */
export type ChipsetType = 'OCS' | 'ECS' | 'AGA';

/**
 * A complete hardware profile for FS-UAE emulator configuration.
 */
export interface HardwareProfile {
  /** Profile identifier */
  readonly id: HardwareProfileId;
  /** Human-readable profile name */
  readonly name: string;
  /** FS-UAE amiga_model value */
  readonly amigaModel: string;
  /** Required Kickstart version (e.g., "1.3") */
  readonly kickstartVersion: string;
  /** Required Kickstart revision (e.g., "34.005") */
  readonly kickstartRevision: string;
  /** CPU type (e.g., "68000", "68ec020", "68030", "68040") */
  readonly cpu: string;
  /** Chip memory in KB */
  readonly chipMemoryKb: number;
  /** Slow (ranger) memory in KB */
  readonly slowMemoryKb: number;
  /** Fast (Zorro II/III) memory in KB */
  readonly fastMemoryKb: number;
  /** Chipset generation */
  readonly chipset: ChipsetType;
  /** Display settings */
  readonly display: {
    readonly width: number;
    readonly height: number;
  };
  /** Sound settings */
  readonly sound: {
    readonly stereoSeparation: number;
  };
}

// ---------------------------------------------------------------------------
// Hardware profile constants
// ---------------------------------------------------------------------------

/**
 * The 5 standard Amiga hardware profiles.
 *
 * Values sourced from FS-UAE documentation:
 * - https://fs-uae.net/docs/options/amiga-model/
 * - https://fs-uae.net/docs/kickstart-roms/
 */
export const HARDWARE_PROFILES: Record<HardwareProfileId, HardwareProfile> = {
  a500: {
    id: 'a500',
    name: 'Amiga 500',
    amigaModel: 'A500',
    kickstartVersion: '1.3',
    kickstartRevision: '34.005',
    cpu: '68000',
    chipMemoryKb: 512,
    slowMemoryKb: 512,
    fastMemoryKb: 0,
    chipset: 'OCS',
    display: { width: 720, height: 568 },
    sound: { stereoSeparation: 70 },
  },

  a1200: {
    id: 'a1200',
    name: 'Amiga 1200',
    amigaModel: 'A1200',
    kickstartVersion: '3.1',
    kickstartRevision: '40.068',
    cpu: '68ec020',
    chipMemoryKb: 2048,
    slowMemoryKb: 0,
    fastMemoryKb: 0,
    chipset: 'AGA',
    display: { width: 720, height: 568 },
    sound: { stereoSeparation: 70 },
  },

  'a1200-030': {
    id: 'a1200-030',
    name: 'Amiga 1200 + 68030 Accelerator',
    amigaModel: 'A1200/020',  // FS-UAE value enabling Zorro III
    kickstartVersion: '3.1',
    kickstartRevision: '40.068',
    cpu: '68030',
    chipMemoryKb: 2048,
    slowMemoryKb: 0,
    fastMemoryKb: 8192,
    chipset: 'AGA',
    display: { width: 720, height: 568 },
    sound: { stereoSeparation: 70 },
  },

  a4000: {
    id: 'a4000',
    name: 'Amiga 4000/040',
    amigaModel: 'A4000/040',
    kickstartVersion: '3.1',
    kickstartRevision: '40.068',
    cpu: '68040',
    chipMemoryKb: 2048,
    slowMemoryKb: 0,
    fastMemoryKb: 8192,
    chipset: 'AGA',
    display: { width: 720, height: 568 },
    sound: { stereoSeparation: 70 },
  },

  whdload: {
    id: 'whdload',
    name: 'WHDLoad (A1200 + Fast RAM)',
    amigaModel: 'A1200',
    kickstartVersion: '3.1',
    kickstartRevision: '40.068',
    cpu: '68ec020',
    chipMemoryKb: 2048,
    slowMemoryKb: 0,
    fastMemoryKb: 8192,  // WHDLoad benefits from Fast RAM for preloading
    chipset: 'AGA',
    display: { width: 720, height: 568 },
    sound: { stereoSeparation: 70 },
  },
};

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

/**
 * Look up a hardware profile by ID.
 *
 * Returns a deeply frozen copy to prevent accidental mutation of the
 * canonical profile data. Returns undefined if the ID is not found.
 */
export function getProfile(id: HardwareProfileId): HardwareProfile | undefined {
  const profile = HARDWARE_PROFILES[id];
  if (!profile) return undefined;
  return deepFreeze(structuredClone(profile));
}

/**
 * Return all 5 hardware profiles as an array of frozen copies.
 */
export function getAllProfiles(): HardwareProfile[] {
  return Object.values(HARDWARE_PROFILES).map((p) =>
    deepFreeze(structuredClone(p)),
  );
}

/**
 * Find a profile by its FS-UAE amigaModel string.
 *
 * Useful for reverse-mapping from FS-UAE model identifiers back to
 * our profile system. Returns a frozen copy or undefined.
 */
export function getProfileForModel(amigaModel: string): HardwareProfile | undefined {
  const profile = Object.values(HARDWARE_PROFILES).find(
    (p) => p.amigaModel === amigaModel,
  );
  if (!profile) return undefined;
  return deepFreeze(structuredClone(profile));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Recursively freeze an object and all nested objects.
 */
function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}
