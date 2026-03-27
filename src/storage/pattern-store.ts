import { appendFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { Pattern, PatternCategory } from '../types/pattern.js';
import { createChecksummedEntry, validateJsonlEntry, verifyChecksum } from '../validation/jsonl-safety.js';

export class PatternStore {
  private patternsDir: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(patternsDir: string = '.planning/patterns') {
    this.patternsDir = patternsDir;
  }

  /**
   * Append a pattern to the category's JSONL file
   * Writes are serialized via queue to prevent race conditions
   * Entries are checksummed for tamper detection (INT-01)
   */
  async append(category: PatternCategory, data: Record<string, unknown>): Promise<void> {
    const pattern: Pattern = {
      timestamp: Date.now(),
      category,
      data,
    };

    // Wrap with checksum for tamper-evident storage
    const checksummed = createChecksummedEntry({
      timestamp: pattern.timestamp,
      category: pattern.category,
      data: pattern.data,
    });

    // Serialize writes through the queue
    this.writeQueue = this.writeQueue.then(async () => {
      // Ensure directory exists
      await mkdir(this.patternsDir, { recursive: true });

      // Append checksummed JSON line to category file
      const filePath = join(this.patternsDir, `${category}.jsonl`);
      const line = JSON.stringify(checksummed) + '\n';
      await appendFile(filePath, line, 'utf-8');
    });

    return this.writeQueue;
  }

  /**
   * Read all patterns from a category's JSONL file
   * Validates schema (INT-02) and verifies checksums (INT-01) on read.
   * Skips corrupted, malformed, and tampered entries with warnings.
   */
  async read(category: PatternCategory): Promise<Pattern[]> {
    const filePath = join(this.patternsDir, `${category}.jsonl`);

    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');

      const patterns: Pattern[] = [];
      for (const line of lines) {
        // Schema validation
        const validation = validateJsonlEntry(line);
        if (!validation.valid) {
          console.warn(`Skipping malformed entry in ${category}.jsonl: ${validation.error}`);
          continue;
        }

        // Parse full line for checksum verification
        const parsed = JSON.parse(line) as Record<string, unknown>;

        // Checksum verification (only if entry has _checksum)
        if (typeof parsed._checksum === 'string') {
          const checksumResult = verifyChecksum(parsed);
          if (!checksumResult.valid) {
            console.warn(`Skipping tampered entry in ${category}.jsonl: ${checksumResult.error}`);
            continue;
          }
        }

        patterns.push(parsed as unknown as Pattern);
      }

      return patterns;
    } catch (error) {
      // File doesn't exist or can't be read - return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
