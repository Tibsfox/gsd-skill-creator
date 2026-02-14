/**
 * Boot sequence data model -- types, chipset definitions, timing, and skip detection.
 *
 * Defines the pure-data foundation for the Amiga-inspired boot animation.
 * Four custom chipsets (Agnus, Denise, Paula, Gary) initialize in sequence
 * with configurable timing. All logic is testable without DOM or WebGL.
 *
 * The renderer (168-03) reads this model to produce visuals. The state
 * machine in chipset.ts drives phase transitions based on elapsed time.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Boot sequence phase progression. */
export type BootPhase = 'init' | 'chipset' | 'ready' | 'complete' | 'skipped';

/** Definition of a single Amiga custom chipset. */
export interface ChipsetDef {
  /** Machine identifier, e.g. 'agnus'. */
  id: string;
  /** Display name, e.g. 'Agnus'. */
  name: string;
  /** Functional role, e.g. 'Graphics DMA'. */
  role: string;
  /** Sequence position (0-3). */
  order: number;
  /** Milliseconds before this chip "initializes". */
  delayMs: number;
}

/** User-configurable boot behavior. */
export interface BootConfig {
  /** Whether to skip the boot animation entirely. From user-style.yaml boot.skip. */
  skip: boolean;
  /** Background rendering mode. From user-style.yaml boot.background. */
  background: 'gradient' | 'flat' | 'disabled';
}

/** Mutable state of the boot sequence at any point in time. */
export interface BootState {
  /** Current phase of the boot sequence. */
  phase: BootPhase;
  /** Milliseconds elapsed within the current phase. */
  elapsedMs: number;
  /** Index into CHIPSETS (-1 during init, 0-3 during chipset phase). */
  activeChipsetIndex: number;
  /** Per-chipset initialization status (true = initialized). */
  chipsetStatuses: boolean[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The four Amiga custom chipsets in initialization order.
 *
 * Total chipset time: 600+800+700+500 = 2600ms.
 * Combined with init (400ms) + ready (800ms) + transition (200ms) = 4000ms,
 * well under the 5-second hard cap.
 */
export const CHIPSETS: readonly ChipsetDef[] = [
  { id: 'agnus', name: 'Agnus', role: 'Graphics DMA', order: 0, delayMs: 600 },
  { id: 'denise', name: 'Denise', role: 'Display Encoder', order: 1, delayMs: 800 },
  { id: 'paula', name: 'Paula', role: 'Audio & I/O', order: 2, delayMs: 700 },
  { id: 'gary', name: 'Gary', role: 'Address Decode', order: 3, delayMs: 500 },
] as const;

/** Timing constants for boot sequence phases. */
export const BOOT_TIMING = {
  /** Blank screen before chipsets start. */
  initDurationMs: 400,
  /** "System Ready" display time after all chipsets initialize. */
  readyDurationMs: 800,
  /** Fade-out transition to desktop. */
  transitionDurationMs: 200,
  /** Hard cap on total boot time. */
  totalMaxMs: 5000,
} as const;

/** Default boot configuration (no skip, gradient background). */
export const DEFAULT_BOOT_CONFIG: BootConfig = {
  skip: false,
  background: 'gradient',
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/** Returns true if the boot animation should be skipped based on config. */
export function shouldSkipBoot(config: BootConfig): boolean {
  return config.skip;
}

/** Creates the initial boot state (init phase, no chipsets initialized). */
export function createBootState(): BootState {
  return {
    phase: 'init',
    elapsedMs: 0,
    activeChipsetIndex: -1,
    chipsetStatuses: [false, false, false, false],
  };
}
