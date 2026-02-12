import { readFile, writeFile, rename } from 'fs/promises';
import { dirname, join } from 'path';
import { validateJsonlEntry, verifyChecksum } from '../validation/jsonl-safety.js';

// ============================================================================
// JSONL Compactor
// ============================================================================
// Physical rewrite of JSONL files, removing expired, malformed, and tampered
// entries. Uses atomic write (temp file + rename) to prevent data loss.
// Integrates with jsonl-safety checksum/schema validation (INT-05).

// ---- Config & Types ----

export interface CompactionConfig {
  maxAgeDays: number; // Remove entries older than this
  validateChecksums: boolean; // Verify _checksum on entries that have one
  dropMalformed: boolean; // Drop entries failing schema validation
}

export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  maxAgeDays: 30,
  validateChecksums: true,
  dropMalformed: true,
};

export interface CompactionResult {
  retained: number;
  removed: number; // Expired entries removed
  malformed: number; // Failed schema validation
  tampered: number; // Failed checksum verification
  error?: string; // If compaction could not proceed
}

// ---- Compactor ----

/**
 * JSONL file compactor that physically rewrites files, removing expired,
 * malformed, and tampered entries with atomic write safety.
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
        return { retained: 0, removed: 0, malformed: 0, tampered: 0 };
      }
      return { retained: 0, removed: 0, malformed: 0, tampered: 0, error: String(err) };
    }

    const lines = content.split('\n').filter((line) => line.trim() !== '');
    const cutoffMs = Date.now() - this.config.maxAgeDays * 24 * 60 * 60 * 1000;

    const retained: string[] = [];
    let removed = 0;
    let malformed = 0;
    let tampered = 0;

    for (const line of lines) {
      // Step 1: Schema validation
      const validation = validateJsonlEntry(line);
      if (!validation.valid) {
        if (this.config.dropMalformed) {
          malformed++;
          continue;
        }
        // If not dropping malformed, keep as-is
        retained.push(line);
        continue;
      }

      // Step 2: Parse the full line (we know it's valid JSON from step 1)
      const entry = JSON.parse(line) as Record<string, unknown>;

      // Step 3: Check expiry
      if (validation.entry.timestamp < cutoffMs) {
        removed++;
        continue;
      }

      // Step 4: Checksum verification (only if enabled and entry has _checksum)
      if (this.config.validateChecksums && typeof entry._checksum === 'string') {
        const checksumResult = verifyChecksum(entry);
        if (!checksumResult.valid) {
          tampered++;
          continue;
        }
      }

      // Step 5: Retain the entry
      retained.push(line);
    }

    // Atomic write: temp file in same directory, then rename
    const tempPath = join(
      dirname(filePath),
      `.compact-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`,
    );
    const newContent = retained.length > 0 ? retained.join('\n') + '\n' : '';
    await writeFile(tempPath, newContent, 'utf-8');
    await rename(tempPath, filePath);

    return { retained: retained.length, removed, malformed, tampered };
  }
}
