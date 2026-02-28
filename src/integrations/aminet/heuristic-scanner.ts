/**
 * Heuristic analysis engine for Amiga binary structures.
 *
 * Analyzes parsed HunkFile and BootBlock structures for virus-like patterns
 * that don't match any known signature. Complements signature scanning by
 * detecting structural anomalies and behavioral patterns common in Amiga
 * viruses.
 *
 * Hunk analysis rules:
 * - small-first-hunk: First HUNK_CODE < 256 bytes (link virus prepend)
 * - anomalous-hunk-ordering: HUNK_CODE after HUNK_DATA (hunk insertion)
 * - excessive-relocations: Relocation ratio > 2.0 per longword
 * - suspicious-entry-point: First code hunk starts with JMP (0x4EF9)
 *
 * Boot block analysis rules:
 * - boot-virus-pattern: trackdisk_access + vector_modification (critical)
 * - suspicious-bootcode: custom_bootcode + exec_library_call + invalid checksum
 * - resident-install-bootcode: custom_bootcode + resident_install
 * - trackdisk-without-vector: trackdisk without vector mod (info only)
 *
 * All functions consume parsed structures from hunk-parser.ts and
 * bootblock-parser.ts -- they do NOT re-parse raw binary data.
 */

import type { HunkFile, BootBlock, HeuristicFlag, ScanVerdict } from './types.js';

// ============================================================================
// Hunk file analysis
// ============================================================================

/**
 * Analyze a parsed HunkFile for structural anomalies.
 * Operates on the parsed structure (not raw bytes) from hunk-parser.ts.
 *
 * @param hunkFile - Parsed hunk executable structure
 * @param raw - Raw file bytes (only used for entry point opcode check)
 * @returns Array of heuristic flags (empty if clean)
 */
export function analyzeHunkFile(hunkFile: HunkFile, raw: Uint8Array): HeuristicFlag[] {
  const flags: HeuristicFlag[] = [];

  // Find the first HUNK_CODE block
  const firstCode = hunkFile.hunks.find((h) => h.type === 'HUNK_CODE');

  // Rule 1: small-first-hunk
  // Viruses prepend a small code hunk that jumps to the original entry point.
  if (firstCode && firstCode.dataLength > 0 && firstCode.dataLength < 256) {
    flags.push({
      rule: 'small-first-hunk',
      severity: 'warning',
      description: `Small first code hunk (${firstCode.dataLength} bytes) — possible link virus prepend`,
    });
  }

  // Rule 2: anomalous-hunk-ordering
  // Normal executables have CODE before DATA. Reordering indicates hunk insertion.
  // Check if any HUNK_CODE appears after a HUNK_DATA (ignoring RELOC/SYMBOL/END).
  const contentHunks = hunkFile.hunks.filter(
    (h) => h.type === 'HUNK_CODE' || h.type === 'HUNK_DATA' || h.type === 'HUNK_BSS'
  );
  let sawData = false;
  for (const h of contentHunks) {
    if (h.type === 'HUNK_DATA') {
      sawData = true;
    } else if (h.type === 'HUNK_CODE' && sawData) {
      flags.push({
        rule: 'anomalous-hunk-ordering',
        severity: 'info',
        description: 'HUNK_CODE appears after HUNK_DATA — possible hunk insertion by link virus',
      });
      break; // Only flag once
    }
  }

  // Rule 3: excessive-relocations
  // Viruses that patch code hunks often add many relocations relative to code size.
  for (const h of hunkFile.hunks) {
    if (h.type === 'HUNK_CODE' && h.relocations && h.dataLength > 0) {
      const totalOffsets = h.relocations.reduce((sum, r) => sum + r.offsets.length, 0);
      const longwords = h.dataLength / 4;
      const ratio = totalOffsets / longwords;
      if (ratio > 2.0) {
        flags.push({
          rule: 'excessive-relocations',
          severity: 'warning',
          description: `Excessive relocations on code hunk: ${totalOffsets} offsets for ${h.dataLength} bytes (ratio ${ratio.toFixed(1)})`,
        });
      }
    }
  }

  // Rule 4: suspicious-entry-point
  // Legitimate Amiga executables rarely start with JMP — they start with
  // code that falls through. Viruses use JMP to redirect after payload.
  if (firstCode && firstCode.dataOffset + 1 < raw.length) {
    const byte0 = raw[firstCode.dataOffset];
    const byte1 = raw[firstCode.dataOffset + 1];
    // JMP (xxx).L = 0x4EF9
    if (byte0 === 0x4e && byte1 === 0xf9) {
      flags.push({
        rule: 'suspicious-entry-point',
        severity: 'warning',
        description: 'First code hunk starts with JMP (0x4EF9) — possible virus redirect to original entry point',
      });
    }
  }

  return flags;
}

// ============================================================================
// Boot block analysis
// ============================================================================

/**
 * Analyze a parsed BootBlock for virus-like patterns.
 * Consumes suspectFlags from bootblock-parser.ts -- does NOT re-parse.
 *
 * @param bootBlock - Parsed boot block structure
 * @returns Array of heuristic flags (empty if clean)
 */
export function analyzeBootBlock(bootBlock: BootBlock): HeuristicFlag[] {
  const flags: HeuristicFlag[] = [];
  const sf = new Set(bootBlock.suspectFlags);

  // No boot code means nothing to analyze
  if (!bootBlock.bootcodePresent || sf.size === 0) {
    return flags;
  }

  // Valid checksum + only custom_bootcode = legitimate bootloader, skip analysis
  if (bootBlock.isValid && sf.size === 1 && sf.has('custom_bootcode')) {
    return flags;
  }

  // Rule 1: boot-virus-pattern (critical)
  // trackdisk_access + vector_modification = definitive boot block virus behavior:
  // direct disk I/O combined with interrupt vector patching.
  if (sf.has('trackdisk_access') && sf.has('vector_modification')) {
    flags.push({
      rule: 'boot-virus-pattern',
      severity: 'critical',
      description: 'Boot block combines trackdisk access with vector modification — boot virus pattern',
    });
  }

  // Rule 2: suspicious-bootcode (warning)
  // custom_bootcode + exec_library_call with invalid checksum = tampered boot block.
  if (sf.has('custom_bootcode') && sf.has('exec_library_call') && !bootBlock.isValid) {
    flags.push({
      rule: 'suspicious-bootcode',
      severity: 'warning',
      description: 'Custom boot code calls Exec library with invalid checksum — possible tampering',
    });
  }

  // Rule 3: resident-install-bootcode (warning)
  // Resident module installation from boot block = virus technique.
  // Normal boot code does not install residents.
  if (sf.has('custom_bootcode') && sf.has('resident_install')) {
    flags.push({
      rule: 'resident-install-bootcode',
      severity: 'warning',
      description: 'Boot block installs resident module — virus installation technique',
    });
  }

  // Rule 4: trackdisk-without-vector (info)
  // trackdisk_access without vector_modification: could be legitimate disk utility
  // or primitive boot virus. Informational only.
  if (sf.has('trackdisk_access') && !sf.has('vector_modification')) {
    flags.push({
      rule: 'trackdisk-without-vector',
      severity: 'info',
      description: 'Boot block accesses trackdisk without vector modification — may be disk utility or primitive virus',
    });
  }

  return flags;
}

// ============================================================================
// Verdict derivation
// ============================================================================

/**
 * Derive a scan verdict from heuristic flags.
 * Uses worst-case semantics:
 * - No flags or only info -> clean
 * - Any warning -> suspicious
 * - Any critical -> infected
 *
 * @param flags - Array of heuristic flags from analysis
 * @returns Scan verdict: 'clean', 'suspicious', or 'infected'
 */
export function deriveHeuristicVerdict(flags: HeuristicFlag[]): ScanVerdict {
  if (flags.length === 0) return 'clean';

  let hasCritical = false;
  let hasWarning = false;

  for (const flag of flags) {
    if (flag.severity === 'critical') hasCritical = true;
    if (flag.severity === 'warning') hasWarning = true;
  }

  if (hasCritical) return 'infected';
  if (hasWarning) return 'suspicious';
  return 'clean';
}
