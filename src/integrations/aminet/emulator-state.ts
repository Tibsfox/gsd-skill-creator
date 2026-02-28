/**
 * Emulator state management: snapshots, save state safety, ROM guidance.
 *
 * Provides FS-UAE snapshot metadata management (9-slot system), directory
 * hard drive detection for save state safety (Research Pitfall 3), and
 * structured missing-ROM guidance with legal acquisition information.
 *
 * Save states are dangerous with directory hard drives because FS-UAE
 * captures RAM state but not host filesystem state. Restoring a snapshot
 * after the host directory has changed causes filesystem corruption.
 *
 * ROM files are NOT distributed -- only checksums and metadata.
 * Legal sources referenced per EMU-10 and NFR-05 compliance.
 *
 * @module emulator-state
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { EmulatorSnapshot, LaunchConfig, LaunchResult, HardwareProfile } from './types.js';
import { EmulatorSnapshotSchema } from './types.js';
import { KNOWN_ROMS } from './rom-manager.js';

// ---------------------------------------------------------------------------
// Save state safety
// ---------------------------------------------------------------------------

/**
 * Determine whether save states should be disabled for a launch config.
 *
 * Returns true if ANY hard drive path does not end with '.hdf', indicating
 * it's a directory hard drive mount. FS-UAE save states capture RAM but
 * not host filesystem state -- restoring while the directory has changed
 * causes corruption (Research Pitfall 3).
 *
 * HDF image files are safe because they're self-contained disk images.
 *
 * @param config - Launch configuration to check
 * @returns true if save states should be disabled
 */
export function shouldDisableSaveStates(config: LaunchConfig): boolean {
  if (!config.hardDrives || config.hardDrives.length === 0) {
    return false;
  }

  return config.hardDrives.some(
    (drive) => !drive.path.toLowerCase().endsWith('.hdf'),
  );
}

// ---------------------------------------------------------------------------
// Snapshot metadata management
// ---------------------------------------------------------------------------

/**
 * Internal: load snapshots metadata from disk.
 */
function loadMetadata(snapshotsDir: string): EmulatorSnapshot[] {
  const metaPath = join(snapshotsDir, 'snapshots.json');
  if (!existsSync(snapshotsDir) || !existsSync(metaPath)) {
    return [];
  }
  try {
    const raw = JSON.parse(readFileSync(metaPath, 'utf-8'));
    if (!Array.isArray(raw)) return [];
    return raw.map((entry: unknown) => EmulatorSnapshotSchema.parse(entry));
  } catch {
    return [];
  }
}

/**
 * Internal: persist snapshots metadata to disk.
 */
function saveMetadata(snapshotsDir: string, snapshots: EmulatorSnapshot[]): void {
  mkdirSync(snapshotsDir, { recursive: true });
  const metaPath = join(snapshotsDir, 'snapshots.json');
  writeFileSync(metaPath, JSON.stringify(snapshots, null, 2), 'utf-8');
}

/**
 * Save a snapshot to the given slot with metadata tracking.
 *
 * FS-UAE supports 9 save state slots (1-9). This function records
 * metadata about the snapshot (slot, timestamp, label, profile) in a
 * snapshots.json file within the snapshots directory.
 *
 * If a snapshot already exists at the given slot, it is overwritten.
 * The snapshots directory is created automatically if it doesn't exist.
 *
 * @param slot         - Slot number (1-9)
 * @param label        - Human-readable description of the snapshot
 * @param profileId    - Hardware profile ID used when snapshot was taken
 * @param snapshotsDir - Directory where snapshot metadata is stored
 * @returns The saved EmulatorSnapshot metadata
 * @throws If slot is outside 1-9 range
 */
export function saveSnapshot(
  slot: number,
  label: string,
  profileId: string,
  snapshotsDir: string,
): EmulatorSnapshot {
  // Build and validate the snapshot
  const snapshot = EmulatorSnapshotSchema.parse({
    slot,
    savedAt: new Date().toISOString(),
    label,
    profileId,
    snapshotDir: snapshotsDir,
  });

  // Load existing metadata
  const existing = loadMetadata(snapshotsDir);

  // Replace entry for same slot, or append new entry
  const filtered = existing.filter((s) => s.slot !== slot);
  filtered.push(snapshot);

  // Persist
  saveMetadata(snapshotsDir, filtered);

  return snapshot;
}

/**
 * List all saved snapshots, sorted by slot number ascending.
 *
 * Returns an empty array if the snapshots directory doesn't exist
 * or contains no snapshots.json file.
 *
 * @param snapshotsDir - Directory containing snapshots.json
 * @returns Array of EmulatorSnapshot sorted by slot
 */
export function listSnapshots(snapshotsDir: string): EmulatorSnapshot[] {
  const snapshots = loadMetadata(snapshotsDir);
  return snapshots.sort((a, b) => a.slot - b.slot);
}

/**
 * Delete a snapshot by slot number.
 *
 * Removes the metadata entry for the given slot from snapshots.json.
 * Returns true if an entry was removed, false if no entry existed.
 *
 * @param slot         - Slot number to delete
 * @param snapshotsDir - Directory containing snapshots.json
 * @returns true if an entry was removed
 */
export function deleteSnapshot(slot: number, snapshotsDir: string): boolean {
  const existing = loadMetadata(snapshotsDir);
  if (existing.length === 0) return false;

  const filtered = existing.filter((s) => s.slot !== slot);
  if (filtered.length === existing.length) return false;

  saveMetadata(snapshotsDir, filtered);
  return true;
}

// ---------------------------------------------------------------------------
// Missing ROM guidance
// ---------------------------------------------------------------------------

/**
 * Map from profile model name patterns to KNOWN_ROMS model strings.
 * Used to find the right ROM entry for a hardware profile.
 */
const PROFILE_MODEL_MAP: Record<string, string> = {
  a500: 'A500',
  a1200: 'A1200',
  'a1200-030': 'A1200',
  a4000: 'A4000',
  whdload: 'A1200',
};

/**
 * Build a structured missing-ROM guidance result for a hardware profile.
 *
 * Produces a LaunchResult with error code 'ROM_MISSING', structured ROM
 * requirement info (version, CRC32 hex, model), and guidance text that:
 * - States ROMs are NOT distributed with this pack (EMU-10, NFR-05)
 * - Recommends Cloanto Amiga Forever as a legal ROM source
 * - Includes the expected CRC32 for identification
 *
 * @param profile - Hardware profile that needs a ROM
 * @returns Structured LaunchResult with ROM guidance
 */
export function buildMissingRomGuidance(profile: HardwareProfile): LaunchResult {
  const modelKey = PROFILE_MODEL_MAP[profile.id] ?? profile.name;

  // Find the matching ROM entry from KNOWN_ROMS
  const rom = KNOWN_ROMS.find(
    (r) =>
      r.model === modelKey &&
      r.revision === profile.kickstartRevision,
  );

  // Build CRC32 hex string
  const crc32Hex = rom
    ? `0x${rom.crc32.toString(16).toUpperCase().padStart(8, '0')}`
    : '0x00000000';

  return {
    success: false,
    error: {
      code: 'ROM_MISSING',
      message: `Kickstart ROM ${profile.kickstartVersion} (rev ${profile.kickstartRevision}) required for ${profile.name}`,
      romRequired: {
        version: profile.kickstartVersion,
        crc32: crc32Hex,
        model: rom?.model ?? profile.name,
      },
      guidance:
        `Required: Kickstart ${profile.kickstartVersion} ROM (CRC32: ${crc32Hex}).\n` +
        `ROM files are NOT distributed with this pack.\n` +
        `Legal sources: Cloanto Amiga Forever (https://www.amigaforever.com/) or original Amiga hardware.\n` +
        `Place ROM files in a directory and configure the ROM search path.`,
    },
  };
}
