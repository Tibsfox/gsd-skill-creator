/**
 * ROM manager for FS-UAE emulator configuration.
 *
 * Provides CRC32 checksumming (IEEE polynomial, no external dependency),
 * a known ROM database (checksums only -- no ROM data per EMU-10/NFR-05),
 * directory scanning with Cloanto encrypted ROM and overdump support,
 * and profile-based ROM selection for hardware configurations.
 *
 * @module rom-manager
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { KnownRom, DetectedRom, HardwareProfileId } from './types.js';
import { getProfile } from './hardware-profiles.js';

// ---------------------------------------------------------------------------
// CRC32 lookup table (IEEE polynomial 0xEDB88320)
// ---------------------------------------------------------------------------

/**
 * Pre-computed CRC32 lookup table using the IEEE polynomial (reflected).
 * Generated at module load time -- 256 entries, one per possible byte value.
 */
export const CRC32_TABLE = new Uint32Array(256);

for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  CRC32_TABLE[i] = crc;
}

// ---------------------------------------------------------------------------
// CRC32 computation
// ---------------------------------------------------------------------------

/**
 * Compute CRC32 checksum of a byte buffer using the IEEE polynomial.
 *
 * Uses the standard reflected algorithm with polynomial 0xEDB88320
 * (bit-reversed form of 0x04C11DB7). Returns an unsigned 32-bit integer.
 *
 * @param data - Byte buffer to checksum
 * @returns Unsigned 32-bit CRC32 value
 */
export function computeCrc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ---------------------------------------------------------------------------
// Cloanto ROM decryption
// ---------------------------------------------------------------------------

/**
 * Decrypt a Cloanto-encrypted ROM file using cyclic XOR with the rom.key.
 *
 * Cloanto's Amiga Forever distributes encrypted ROM files alongside a
 * `rom.key` file. Decryption is a simple cyclic XOR: each byte of the
 * encrypted ROM is XORed with the corresponding byte of the key (wrapping
 * around when the key is shorter than the data).
 *
 * This operation is its own inverse: decrypt(decrypt(data, key), key) === data.
 *
 * @param encrypted - Encrypted ROM data
 * @param romKey    - Decryption key bytes from rom.key
 * @returns Decrypted ROM data
 */
export function decryptCloantoRom(encrypted: Uint8Array, romKey: Uint8Array): Uint8Array {
  const result = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    result[i] = encrypted[i] ^ romKey[i % romKey.length];
  }
  return result;
}

// ---------------------------------------------------------------------------
// SHA-1 computation (internal helper for FS-UAE cross-verification)
// ---------------------------------------------------------------------------

/**
 * Compute SHA-1 hex digest of a byte buffer.
 * Used for FS-UAE cross-verification alongside CRC32.
 */
function computeSha1(data: Uint8Array): string {
  return createHash('sha1').update(data).digest('hex');
}

// ---------------------------------------------------------------------------
// Known ROM database (checksums only -- no ROM data)
// ---------------------------------------------------------------------------

/**
 * Database of known Amiga Kickstart ROM checksums.
 *
 * Contains only identification metadata (version, revision, model, CRC32,
 * SHA-1, file size). No actual ROM data is embedded, distributed, or
 * stored (EMU-10, NFR-05 compliance).
 *
 * Sources: FS-UAE Kickstart ROM documentation, community ROM databases.
 */
export const KNOWN_ROMS: KnownRom[] = [
  // A500 / A2000 -- Kickstart 1.2
  {
    version: '1.2',
    revision: '33.180',
    model: 'A500',
    crc32: 0xC5839F5E,
    sha1: null,
    size: 262144,
  },
  // A500 -- Kickstart 1.3 (most common)
  {
    version: '1.3',
    revision: '34.005',
    model: 'A500',
    crc32: 0xC4F0F55F,
    sha1: null,
    size: 262144,
  },
  // A500+ -- Kickstart 2.04
  {
    version: '2.04',
    revision: '37.175',
    model: 'A500+',
    crc32: 0xC3BDB112,
    sha1: null,
    size: 524288,
  },
  // A600 -- Kickstart 2.05
  {
    version: '2.05',
    revision: '37.300',
    model: 'A600',
    crc32: 0x83028FB5,
    sha1: null,
    size: 524288,
  },
  // A1200 -- Kickstart 3.0
  {
    version: '3.0',
    revision: '39.106',
    model: 'A1200',
    crc32: 0x6C9B07D2,
    sha1: null,
    size: 524288,
  },
  // A4000 -- Kickstart 3.0
  {
    version: '3.0',
    revision: '39.106',
    model: 'A4000',
    crc32: 0x9E6AC152,
    sha1: null,
    size: 524288,
  },
  // A1200 -- Kickstart 3.1 (40.068)
  {
    version: '3.1',
    revision: '40.068',
    model: 'A1200',
    crc32: 0x1483A091,
    sha1: null,
    size: 524288,
  },
  // A3000 -- Kickstart 3.1
  {
    version: '3.1',
    revision: '40.068',
    model: 'A3000',
    crc32: 0xE0F37258,
    sha1: null,
    size: 524288,
  },
  // A4000 -- Kickstart 3.1 (40.068)
  {
    version: '3.1',
    revision: '40.068',
    model: 'A4000',
    crc32: 0xD6BAE334,
    sha1: null,
    size: 524288,
  },
  // A4000T -- Kickstart 3.1
  {
    version: '3.1',
    revision: '40.070',
    model: 'A4000T',
    crc32: 0x75932C0A,
    sha1: null,
    size: 524288,
  },
  // A1200 -- Kickstart 3.1 Gateway/Escom (40.071)
  {
    version: '3.1',
    revision: '40.071',
    model: 'A1200',
    crc32: 0x08B69382,
    sha1: null,
    size: 524288,
  },
  // A4000 -- Kickstart 3.1 Gateway/Escom
  {
    version: '3.1',
    revision: '40.070',
    model: 'A4000',
    crc32: 0xF2B52B07,
    sha1: null,
    size: 524288,
  },
];

// ---------------------------------------------------------------------------
// ROM directory scanning
// ---------------------------------------------------------------------------

/** Options for scanRomDirectory (primarily for testing). */
export interface ScanRomOptions {
  /** Override CRC32 function (for test injection). */
  crc32Fn?: (data: Uint8Array) => number;
}

/**
 * Scan a directory for known Amiga Kickstart ROM files.
 *
 * Reads all files at the top level of `dirPath` (no recursion, matching
 * FS-UAE behavior). For each file of valid ROM size (256KB or 512KB):
 *
 * 1. If `rom.key` exists in the same directory, XOR-decrypt before checksumming
 * 2. Compute CRC32 of the full file and match against KNOWN_ROMS
 * 3. If no match and file is 512KB, compute CRC32 of the second 256KB half
 *    (overdump handling: some ROM dumps pad the first half)
 * 4. On match, compute SHA-1 for FS-UAE cross-verification
 *
 * @param dirPath - Directory to scan for ROM files
 * @param options - Optional configuration (crc32Fn for test injection)
 * @returns Array of detected ROM entries
 */
export function scanRomDirectory(dirPath: string, options?: ScanRomOptions): DetectedRom[] {
  const crc32Fn = options?.crc32Fn ?? computeCrc32;
  const results: DetectedRom[] = [];

  if (!existsSync(dirPath)) {
    return results;
  }

  const entries = readdirSync(dirPath, { withFileTypes: true });

  // Check for Cloanto rom.key
  const romKeyPath = join(dirPath, 'rom.key');
  const hasRomKey = existsSync(romKeyPath);
  let romKey: Uint8Array | undefined;
  if (hasRomKey) {
    romKey = new Uint8Array(readFileSync(romKeyPath));
  }

  for (const entry of entries) {
    // Single level only -- skip directories and non-files
    if (!entry.isFile()) continue;
    // Skip the rom.key file itself
    if (entry.name === 'rom.key') continue;

    const filePath = join(dirPath, entry.name);
    const stat = statSync(filePath);
    const fileSize = stat.size;

    // Only process files of valid ROM sizes
    if (fileSize !== 262144 && fileSize !== 524288) continue;

    let data = new Uint8Array(readFileSync(filePath));
    const wasEncrypted = hasRomKey && romKey !== undefined;

    // Decrypt if Cloanto rom.key is present
    if (wasEncrypted) {
      data = decryptCloantoRom(data, romKey!) as Uint8Array<ArrayBuffer>;
    }

    // Try full-file CRC32
    let crc = crc32Fn(data);
    let matched = KNOWN_ROMS.find((r) => r.crc32 === crc && r.size === fileSize);

    // Overdump handling: 512KB file with ROM in second half
    if (!matched && fileSize === 524288) {
      const secondHalf = data.slice(262144);
      crc = crc32Fn(secondHalf);
      matched = KNOWN_ROMS.find((r) => r.crc32 === crc && r.size === 524288);
      // Also check 256KB ROMs in the second half
      if (!matched) {
        matched = KNOWN_ROMS.find((r) => r.crc32 === crc && r.size === 262144);
      }
    }

    if (matched) {
      // Compute SHA-1 for FS-UAE cross-verification
      const sha1 = computeSha1(data);

      results.push({
        path: filePath,
        rom: {
          ...matched,
          sha1,
        },
        wasEncrypted,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Profile-based ROM selection
// ---------------------------------------------------------------------------

/**
 * Map from hardware profile ID to the ROM model(s) that satisfy it.
 *
 * WHDLoad uses A1200 ROMs (same KS3.1 requirement).
 * A1200+030 uses the same ROM as plain A1200.
 */
const PROFILE_ROM_MODEL_MAP: Record<string, string[]> = {
  a500: ['A500'],
  a1200: ['A1200'],
  'a1200-030': ['A1200'],
  a4000: ['A4000'],
  whdload: ['A1200'],
};

/**
 * Select the best ROM for a given hardware profile from a set of detected ROMs.
 *
 * Matching rules:
 * 1. Get the profile's kickstartVersion and acceptable ROM models
 * 2. Filter detected ROMs to those matching the version and model
 * 3. If multiple matches, prefer exact revision match with profile
 * 4. Return best match or undefined if no suitable ROM found
 *
 * @param roms      - Array of detected ROMs from scanRomDirectory
 * @param profileId - Hardware profile identifier
 * @returns Best matching DetectedRom, or undefined
 */
export function selectRomForProfile(
  roms: DetectedRom[],
  profileId: HardwareProfileId,
): DetectedRom | undefined {
  const profile = getProfile(profileId);
  if (!profile) return undefined;

  const acceptableModels = PROFILE_ROM_MODEL_MAP[profileId];
  if (!acceptableModels) return undefined;

  // Filter to ROMs matching the profile's kickstart version and acceptable models
  const candidates = roms.filter(
    (r) =>
      r.rom.version === profile.kickstartVersion &&
      acceptableModels.includes(r.rom.model),
  );

  if (candidates.length === 0) return undefined;

  // Prefer exact revision match
  const exactRevision = candidates.find(
    (r) => r.rom.revision === profile.kickstartRevision,
  );

  return exactRevision ?? candidates[0];
}
