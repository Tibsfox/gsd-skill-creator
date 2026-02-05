import { readFile, appendFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import type { TestRunResult, TestRunSnapshot } from '../types/test-run.js';
import { getSkillsBasePath, type SkillScope } from '../types/scope.js';

/**
 * Store for persisting test run results to JSONL files.
 *
 * Test results are stored in `~/.claude/skills/<skillName>/results.jsonl` (user scope)
 * or `.claude/skills/<skillName>/results.jsonl` (project scope).
 *
 * Uses JSONL format (one JSON object per line) for efficient append operations
 * and easy streaming reads. Write queue serializes concurrent writes to prevent
 * interleaving of JSON objects.
 */
export class ResultStore {
  private basePath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  /**
   * Create a new ResultStore instance.
   *
   * @param scope - 'user' for ~/.claude/skills or 'project' for .claude/skills
   */
  constructor(scope: SkillScope = 'user') {
    this.basePath = getSkillsBasePath(scope);
  }

  /**
   * Get the path to the results.jsonl file for a skill.
   */
  private getResultsPath(skillName: string): string {
    return join(this.basePath, skillName, 'results.jsonl');
  }

  /**
   * Ensure the skill directory exists.
   */
  private async ensureDir(skillName: string): Promise<void> {
    const resultsPath = this.getResultsPath(skillName);
    await mkdir(dirname(resultsPath), { recursive: true });
  }

  /**
   * Append a line to the JSONL file with write serialization.
   */
  private async appendLine(skillName: string, snapshot: TestRunSnapshot): Promise<void> {
    await this.ensureDir(skillName);

    // Serialize writes to prevent interleaving
    this.writeQueue = this.writeQueue.then(async () => {
      const line = JSON.stringify(snapshot) + '\n';
      await appendFile(this.getResultsPath(skillName), line, 'utf-8');
    });

    await this.writeQueue;
  }

  /**
   * Append a test run result for a skill.
   *
   * Adds id (UUID) and threshold to create a snapshot, then persists to JSONL file.
   * Uses write queue to serialize concurrent writes.
   *
   * @param skillName - Name of the skill
   * @param result - The test run result to store
   * @param threshold - Activation threshold used for the run
   * @returns The stored snapshot with id and threshold
   */
  async append(
    skillName: string,
    result: TestRunResult,
    threshold: number
  ): Promise<TestRunSnapshot> {
    const snapshot: TestRunSnapshot = {
      ...result,
      id: randomUUID(),
      threshold,
    };

    await this.appendLine(skillName, snapshot);
    return snapshot;
  }

  /**
   * List all historical test run snapshots for a skill.
   *
   * @param skillName - Name of the skill
   * @returns Array of test run snapshots, empty if no history exists
   */
  async list(skillName: string): Promise<TestRunSnapshot[]> {
    const resultsPath = this.getResultsPath(skillName);
    try {
      const content = await readFile(resultsPath, 'utf-8');
      const snapshots: TestRunSnapshot[] = [];

      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          snapshots.push(JSON.parse(line) as TestRunSnapshot);
        } catch {
          // Skip corrupted lines but warn
          console.warn(`Skipping corrupted line in results.jsonl for '${skillName}'`);
        }
      }

      return snapshots;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  /**
   * Get the most recent test run snapshot for a skill.
   *
   * Efficiently reads the file and returns the last valid entry
   * for regression comparison.
   *
   * @param skillName - Name of the skill
   * @returns The latest snapshot or null if no history exists
   */
  async getLatest(skillName: string): Promise<TestRunSnapshot | null> {
    const snapshots = await this.list(skillName);
    if (snapshots.length === 0) {
      return null;
    }
    // Return the last (most recent) snapshot
    return snapshots[snapshots.length - 1];
  }

  /**
   * Count the number of historical test runs for a skill.
   *
   * @param skillName - Name of the skill
   * @returns Number of stored test runs
   */
  async count(skillName: string): Promise<number> {
    const snapshots = await this.list(skillName);
    return snapshots.length;
  }
}
