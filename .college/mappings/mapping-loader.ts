/**
 * MappingLoader -- reads virtual department groupings and educational tracks
 * from .college/mappings/ and .college/mappings/user/.
 *
 * Hot-reload: call reload() to re-read all mapping files from disk.
 * No file watcher is started -- reload() is explicit and test-friendly.
 *
 * @module mappings/mapping-loader
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { VirtualDepartment, MappingFile, EducationalTrack, TrackFile } from '../college/types.js';

export class MappingFileNotFoundError extends Error {
  constructor(path: string) {
    super(`Mapping file not found: '${path}'`);
    this.name = 'MappingFileNotFoundError';
  }
}

export class MappingLoader {
  private basePath: string;
  private userPath: string;
  private _mappingFiles: MappingFile[] = [];
  private _tracks: EducationalTrack[] = [];
  private _loaded = false;

  constructor(basePath: string = '.college/mappings') {
    this.basePath = basePath;
    this.userPath = join(basePath, 'user');
  }

  /** Re-read all mapping files from disk. Call after any file change to hot-reload. */
  reload(): void {
    this._mappingFiles = [];
    this._tracks = [];

    // Load default.json
    const defaultPath = join(this.basePath, 'default.json');
    if (existsSync(defaultPath)) {
      try {
        const raw = JSON.parse(readFileSync(defaultPath, 'utf-8'));
        this._mappingFiles.push({
          id: 'default',
          name: raw.name ?? 'Default',
          source: 'default',
          virtualDepartments: raw.virtualDepartments ?? [],
        });
      } catch {
        // Skip malformed default.json
      }
    }

    // Load tracks.json
    const tracksPath = join(this.basePath, 'tracks.json');
    if (existsSync(tracksPath)) {
      try {
        const raw = JSON.parse(readFileSync(tracksPath, 'utf-8')) as TrackFile;
        this._tracks = raw.tracks ?? [];
      } catch {
        // Skip malformed tracks.json
      }
    }

    // Load user/*.json
    if (existsSync(this.userPath)) {
      for (const file of readdirSync(this.userPath)) {
        if (!file.endsWith('.json')) continue;
        const filePath = join(this.userPath, file);
        try {
          const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
          this._mappingFiles.push({
            id: basename(file, '.json'),
            name: raw.name ?? basename(file, '.json'),
            source: 'user',
            virtualDepartments: raw.virtualDepartments ?? [],
          });
        } catch {
          // Skip malformed user mappings
        }
      }
    }

    this._loaded = true;
  }

  private ensureLoaded(): void {
    if (!this._loaded) this.reload();
  }

  /** All mapping files (default + user), with their virtual department lists */
  listMappingFiles(): MappingFile[] {
    this.ensureLoaded();
    return [...this._mappingFiles];
  }

  /** Only user-created mapping files from the user/ subdirectory */
  listUserMappings(): MappingFile[] {
    this.ensureLoaded();
    return this._mappingFiles.filter((m) => m.source === 'user');
  }

  /**
   * All virtual departments merged from all default mapping files.
   * User mappings are NOT included here -- use listMappingFiles() to access them.
   */
  listVirtualDepartments(): VirtualDepartment[] {
    this.ensureLoaded();
    const result: VirtualDepartment[] = [];
    for (const mf of this._mappingFiles) {
      if (mf.source === 'default') {
        result.push(...mf.virtualDepartments);
      }
    }
    return result;
  }

  /** All educational tracks from tracks.json */
  listTracks(): EducationalTrack[] {
    this.ensureLoaded();
    return [...this._tracks];
  }

  /**
   * Get a single track by ID.
   * Returns undefined if not found.
   */
  getTrack(trackId: string): EducationalTrack | undefined {
    this.ensureLoaded();
    return this._tracks.find((t) => t.id === trackId);
  }

  /**
   * Validate that all subjects in a list exist in knownDepts.
   * Returns {valid: true} or {valid: false, orphans: string[]}.
   */
  validateSubjects(
    subjects: string[],
    knownDepts: string[],
  ): { valid: true } | { valid: false; orphans: string[] } {
    const knownSet = new Set(knownDepts);
    const orphans = subjects.filter((s) => !knownSet.has(s));
    if (orphans.length === 0) return { valid: true };
    return { valid: false, orphans };
  }

  /**
   * Write a new user mapping to .college/mappings/user/{id}.json.
   * Creates the user/ directory if it does not exist.
   * Calls reload() after writing so the new mapping is immediately available.
   *
   * @param id - Filename (without .json extension), must match [a-z][a-z0-9-]*
   * @param mapping - The mapping data (name, description, virtualDepartments)
   */
  addUserMapping(
    id: string,
    mapping: { name: string; description: string; virtualDepartments: VirtualDepartment[] },
  ): void {
    if (!existsSync(this.userPath)) {
      mkdirSync(this.userPath, { recursive: true });
    }
    const filePath = join(this.userPath, `${id}.json`);
    writeFileSync(filePath, JSON.stringify(mapping, null, 2), 'utf-8');
    this.reload();
  }
}
