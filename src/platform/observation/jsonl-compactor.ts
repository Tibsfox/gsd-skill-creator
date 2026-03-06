// ============================================================================
// jsonl-compactor.ts — Data Lifecycle: Physical JSONL File Cleanup
// ============================================================================
//
// WHAT THIS FILE DOES
// -------------------
// JsonlCompactor physically rewrites JSONL files, removing three categories
// of problematic entries:
//   - Expired entries (timestamp older than maxAgeDays)
//   - Malformed entries (failed schema validation — corrupt JSON or wrong structure)
//   - Tampered entries (failed _checksum verification — integrity violation)
//
// It uses atomic write (temp file + rename) to prevent data loss if the process
// crashes during compaction.
//
// WHY COMPACTION IS DIFFERENT FROM PRUNING
// -----------------------------------------
// RetentionManager.prune() handles age and count limits — it removes entries
// based on time and volume policies.
//
// JsonlCompactor handles data integrity — it removes entries that are structurally
// broken or proven tampered with. Compaction is a security and health operation;
// pruning is a space management operation.
//
// Together, they form the complete data lifecycle:
//   EphemeralStore + PatternStore   — write new data
//   RetentionManager                — prune by age/count
//   JsonlCompactor                  — remove corrupted/tampered/expired data
//
// COMPACTION PIPELINE
// -------------------
// For each line in the JSONL file, compaction applies 4 checks in order:
//
//   Step 1: Schema validation (validateJsonlEntry)
//     Checks that the line is valid JSON with required fields (timestamp, category, data).
//     If invalid AND dropMalformed=true: malformed++, skip.
//     If invalid AND dropMalformed=false: retained as-is (for manual inspection).
//
//   Step 2: Parse JSON
//     We know it's valid from step 1, but we need the object for subsequent checks.
//
//   Step 3: Expiry check
//     timestamp < cutoffMs → expired, removed++, skip.
//     This removes entries older than maxAgeDays regardless of other fields.
//
//   Step 4: Checksum verification (optional)
//     Only if validateChecksums=true AND entry has _checksum field.
//     Verifies the checksum matches the entry content (tamper detection).
//     If verification fails: tampered++, skip.
//
//   Else: retained.
//
// The order matters: schema validation first (cheapest check), then parsing,
// then expiry, then checksum (most expensive — crypto operation).
//
// ATOMIC WRITE
// ------------
// Compaction uses the same atomic write pattern as RetentionManager:
//   1. Write compacted content to .compact-<timestamp>-<random>.tmp in same dir
//   2. rename() the temp file over the original file
//
// rename() is atomic on the same filesystem — the file is either the old content
// or the new content, never a partial write. Using the same directory ensures
// the temp file is on the same filesystem.
//
// This is the "boring is reliable" storage principle from CENTERCAMP-PERSONAL-JOURNAL:
// "Good storage design is boring. Boring is reliable."
// Atomic writes are boring. They also prevent data loss under crashes.
//
// COMPACTION RESULT
// -----------------
// CompactionResult reports four counts:
//   retained: entries that passed all checks and were kept
//   removed: entries removed by expiry check
//   malformed: entries removed by schema validation failure
//   tampered: entries removed by checksum verification failure
//
// These counts enable monitoring: if tampered > 0, something is wrong.
// If malformed > 0 consistently, the write path has a bug.
// If removed is large, the maxAgeDays setting may be too aggressive.
//
// CHECKSUM VALIDATION
// -------------------
// Not all JSONL entries have _checksum fields. EphemeralStore writes checksummed
// entries. PatternStore writes non-checksummed entries (plain JSON envelopes).
//
// The compactor's checksum check only fires when:
//   validateChecksums=true (default) AND typeof entry._checksum === 'string'
//
// This means non-checksummed entries pass the checksum check by default.
// They are still subject to schema validation and expiry checks.
//
// This design is intentional: adding checksums retroactively would require
// rewriting all existing data. Instead, the compactor handles the mixed reality:
// some entries are checksummed, some are not, both are valid.
//
// ERROR HANDLING
// --------------
// If the file doesn't exist: returns empty CompactionResult (retained=0, all counts=0).
// If the file can't be read for other reasons: returns CompactionResult with error field.
// If the file exists but is empty: writes empty file and returns (retained=0).
//
// The error field in CompactionResult signals that compaction could not proceed —
// the caller should handle this (log, alert, or retry).
//
// See also:
// @see RetentionManager (retention-manager.ts) — age/count-based pruning complement
// @see EphemeralStore (ephemeral-store.ts) — produces checksummed entries
// @see core/validation/jsonl-safety.ts — checksum and schema validation utilities
// @see DEFAULT_COMPACTION_CONFIG — default configuration values

import { readFile, writeFile, rename } from 'fs/promises';
import { dirname, join } from 'path';
import { validateJsonlEntry, verifyChecksum } from '../../core/validation/jsonl-safety.js';

// ============================================================================
// Config & Types
// ============================================================================

/**
 * Configuration for JSONL compaction.
 * All fields have defaults in DEFAULT_COMPACTION_CONFIG.
 */
export interface CompactionConfig {
  /** Remove entries with timestamp older than this many days */
  maxAgeDays: number;
  /** Verify _checksum on entries that have one — set to false for pure expiry cleanup */
  validateChecksums: boolean;
  /** Drop entries failing schema validation — set to false to inspect malformed entries */
  dropMalformed: boolean;
}

/**
 * Default compaction settings.
 * 30 days retention is shorter than RetentionManager's default (90 days)
 * because compaction is typically run less frequently.
 */
export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  maxAgeDays: 30,
  validateChecksums: true,
  dropMalformed: true,
};

/**
 * Result of a compaction operation.
 * All counts are for entries affected in this run.
 * error is set when compaction could not proceed (file unreadable, disk error, etc.).
 */
export interface CompactionResult {
  retained: number;   // Entries that passed all checks
  removed: number;    // Expired entries removed by age check
  malformed: number;  // Failed schema validation
  tampered: number;   // Failed checksum verification
  error?: string;     // If compaction could not proceed
}

// ============================================================================
// Compactor
// ============================================================================

/**
 * JSONL file compactor that physically rewrites files, removing expired,
 * malformed, and tampered entries with atomic write safety.
 *
 * Implements INT-05 (compaction with checksum/schema validation integration).
 * Complements RetentionManager (age/count pruning) with integrity-focused cleanup.
 */
export class JsonlCompactor {
  private config: CompactionConfig;

  constructor(config: Partial<CompactionConfig> = {}) {
    this.config = { ...DEFAULT_COMPACTION_CONFIG, ...config };
  }

  /**
   * Compact a JSONL file by removing expired, malformed, and tampered entries.
   * Uses atomic write (temp file + rename) to prevent data corruption.
   *
   * Pipeline per line:
   *   1. Schema validation → skip malformed (if dropMalformed)
   *   2. Expiry check → skip expired (timestamp < cutoffMs)
   *   3. Checksum verification → skip tampered (if validateChecksums and has _checksum)
   *   4. Retain
   *
   * @param filePath - Path to the JSONL file to compact
   * @returns Compaction result with counts of retained, removed, malformed, tampered entries
   */
  async compact(filePath: string): Promise<CompactionResult> {
    // Read file content
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist — nothing to compact
        return { retained: 0, removed: 0, malformed: 0, tampered: 0 };
      }
      // Other read error — report and return
      return { retained: 0, removed: 0, malformed: 0, tampered: 0, error: String(err) };
    }

    const lines = content.split('\n').filter((line) => line.trim() !== '');
    const cutoffMs = Date.now() - this.config.maxAgeDays * 24 * 60 * 60 * 1000;

    const retained: string[] = [];
    let removed = 0;
    let malformed = 0;
    let tampered = 0;

    for (const line of lines) {
      // Step 1: Schema validation — cheapest check, done first
      const validation = validateJsonlEntry(line);
      if (!validation.valid) {
        if (this.config.dropMalformed) {
          malformed++;
          continue; // Drop malformed entry
        }
        // If not dropping malformed, retain for manual inspection
        retained.push(line);
        continue;
      }

      // Step 2: Parse the full line (valid from step 1)
      const entry = JSON.parse(line) as Record<string, unknown>;

      // Step 3: Expiry check — remove entries older than maxAgeDays
      if (validation.entry.timestamp < cutoffMs) {
        removed++;
        continue; // Expired entry removed
      }

      // Step 4: Checksum verification (only if enabled and entry has _checksum)
      // Skip entries without _checksum — they're not checksummed entries
      if (this.config.validateChecksums && typeof entry._checksum === 'string') {
        const checksumResult = verifyChecksum(entry);
        if (!checksumResult.valid) {
          tampered++;
          continue; // Tampered entry removed
        }
      }

      // Step 5: Retain the entry — passed all checks
      retained.push(line);
    }

    // Atomic write: temp file in same directory (same filesystem), then rename
    const tempPath = join(
      dirname(filePath),
      `.compact-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`,
    );
    // Empty retained[] → write empty string (valid empty JSONL)
    const newContent = retained.length > 0 ? retained.join('\n') + '\n' : '';
    await writeFile(tempPath, newContent, 'utf-8');
    await rename(tempPath, filePath); // Atomic on same filesystem

    return { retained: retained.length, removed, malformed, tampered };
  }
}
