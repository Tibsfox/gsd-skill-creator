/**
 * PositionStore -- JSON persistence for skill positions on the complex plane.
 *
 * Single source of truth for all skill positions. Stores positions in a
 * JSON file at .claude/plane/positions.json (configurable). Creates the
 * directory tree lazily on first save.
 *
 * Validates entries with SkillPositionSchema on load. Invalid entries are
 * silently dropped (graceful degradation).
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { SkillPositionSchema } from './types.js';
import type { SkillPosition } from './types.js';

/**
 * Persistent store for skill positions backed by a JSON file.
 */
export class PositionStore {
  private positions: Map<string, SkillPosition> = new Map();
  private readonly filePath: string;

  /**
   * @param filePath - Path to the JSON positions file
   *                   (default: '.claude/plane/positions.json')
   */
  constructor(filePath = '.claude/plane/positions.json') {
    this.filePath = filePath;
  }

  /**
   * Load positions from the JSON file.
   *
   * If the file does not exist, initializes with an empty map (no throw).
   * If the file contains malformed JSON, initializes with an empty map (no throw).
   * Invalid entries are silently dropped after Zod validation.
   */
  async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);

      this.positions = new Map();

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [key, value] of Object.entries(parsed)) {
          const result = SkillPositionSchema.safeParse(value);
          if (result.success) {
            this.positions.set(key, result.data);
          }
        }
      }
    } catch {
      // File not found, malformed JSON, or other I/O error
      this.positions = new Map();
    }
  }

  /**
   * Save all positions to the JSON file.
   *
   * Creates the directory tree if it does not exist (lazy init).
   * Writes with 2-space indentation for readability.
   */
  async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    const obj: Record<string, SkillPosition> = {};
    for (const [key, value] of this.positions) {
      obj[key] = value;
    }

    await writeFile(this.filePath, JSON.stringify(obj, null, 2), 'utf-8');
  }

  /**
   * Get a skill's position by ID.
   *
   * @returns The position, or null if not found
   */
  get(skillId: string): SkillPosition | null {
    return this.positions.get(skillId) ?? null;
  }

  /**
   * Set (or overwrite) a skill's position.
   */
  set(skillId: string, position: SkillPosition): void {
    this.positions.set(skillId, position);
  }

  /**
   * Get all positions as a new Map (copy -- mutations do not affect the store).
   */
  all(): Map<string, SkillPosition> {
    return new Map(this.positions);
  }

  /**
   * Remove a skill's position.
   *
   * @returns true if the position existed and was removed, false otherwise
   */
  remove(skillId: string): boolean {
    return this.positions.delete(skillId);
  }
}
