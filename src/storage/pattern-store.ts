import { appendFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { Pattern, PatternCategory } from '../types/pattern.js';

export class PatternStore {
  private patternsDir: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(patternsDir: string = '.planning/patterns') {
    this.patternsDir = patternsDir;
  }

  /**
   * Append a pattern to the category's JSONL file
   * Writes are serialized via queue to prevent race conditions
   */
  async append(category: PatternCategory, data: Record<string, unknown>): Promise<void> {
    const pattern: Pattern = {
      timestamp: Date.now(),
      category,
      data,
    };

    // Serialize writes through the queue
    this.writeQueue = this.writeQueue.then(async () => {
      // Ensure directory exists
      await mkdir(this.patternsDir, { recursive: true });

      // Append JSON line to category file
      const filePath = join(this.patternsDir, `${category}.jsonl`);
      const line = JSON.stringify(pattern) + '\n';
      await appendFile(filePath, line, 'utf-8');
    });

    return this.writeQueue;
  }

  /**
   * Read all patterns from a category's JSONL file
   * Gracefully handles corrupted lines by skipping them
   */
  async read(category: PatternCategory): Promise<Pattern[]> {
    const filePath = join(this.patternsDir, `${category}.jsonl`);

    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');

      const patterns: Pattern[] = [];
      for (const line of lines) {
        try {
          const pattern = JSON.parse(line) as Pattern;
          patterns.push(pattern);
        } catch (parseError) {
          // Skip corrupted lines gracefully
          console.warn(`Skipping corrupted line in ${category}.jsonl:`, line);
        }
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
