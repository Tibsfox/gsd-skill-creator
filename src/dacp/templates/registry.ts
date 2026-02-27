/**
 * Bundle template registry with CRUD operations, wildcard search,
 * and JSON file persistence.
 *
 * Templates are reusable blueprints the assembler uses to quickly
 * compose bundles for common handoff types. The registry manages
 * their lifecycle and persists to ~/.gsd/dacp/templates/registry.json.
 *
 * @module dacp/templates/registry
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

import type { BundleTemplate } from '../types.js';
import type { TemplateRegistryPort } from './types.js';

/** Default registry file path. */
const DEFAULT_REGISTRY_PATH = join(
  homedir(),
  '.gsd',
  'dacp',
  'templates',
  'registry.json',
);

/**
 * Convert a wildcard pattern to a RegExp.
 * Supports `*` as a wildcard matching any segment characters.
 */
function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^\\s]*');
  return new RegExp(`^${escaped}$`);
}

/**
 * Bundle template registry managing CRUD, search, and persistence.
 */
export class BundleTemplateRegistry implements TemplateRegistryPort {
  private templates: Map<string, BundleTemplate>;
  private readonly registryPath: string;

  constructor(registryPath?: string) {
    this.templates = new Map();
    this.registryPath = registryPath ?? DEFAULT_REGISTRY_PATH;
  }

  /**
   * Register a new template. Throws if a template with the same id
   * already exists.
   */
  register(template: BundleTemplate): void {
    if (this.templates.has(template.id)) {
      throw new Error(
        `Template already exists with id '${template.id}'`,
      );
    }
    this.templates.set(template.id, { ...template });
  }

  /**
   * Get a template by id. Returns undefined if not found.
   */
  get(id: string): BundleTemplate | undefined {
    const tmpl = this.templates.get(id);
    return tmpl ? { ...tmpl } : undefined;
  }

  /**
   * Get all registered templates.
   */
  getAll(): BundleTemplate[] {
    return Array.from(this.templates.values()).map(t => ({ ...t }));
  }

  /**
   * Update an existing template with partial changes.
   * The `id` field cannot be changed. Throws if id not found.
   */
  update(id: string, updates: Partial<BundleTemplate>): void {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error(`Template not found with id '${id}'`);
    }
    // Prevent id mutation
    const { id: _ignoreId, ...safeUpdates } = updates;
    this.templates.set(id, { ...existing, ...safeUpdates });
  }

  /**
   * Remove a template by id. Throws if id not found.
   */
  remove(id: string): void {
    if (!this.templates.has(id)) {
      throw new Error(`Template not found with id '${id}'`);
    }
    this.templates.delete(id);
  }

  /**
   * Find templates by handoff type. Supports exact match and
   * wildcard patterns using `*` (e.g., `*->executor:*`).
   */
  findByHandoffType(type: string): BundleTemplate[] {
    if (type.includes('*')) {
      const regex = wildcardToRegExp(type);
      return this.getAll().filter(t => regex.test(t.handoff_type));
    }
    return this.getAll().filter(t => t.handoff_type === type);
  }

  /**
   * Persist the current registry state to disk as a JSON array.
   * Creates parent directories if they don't exist.
   */
  async save(): Promise<void> {
    const dir = dirname(this.registryPath);
    await mkdir(dir, { recursive: true });
    const data = JSON.stringify(Array.from(this.templates.values()), null, 2);
    await writeFile(this.registryPath, data, 'utf-8');
  }

  /**
   * Load registry state from disk. If the file doesn't exist,
   * starts with an empty registry (no error thrown).
   */
  async load(): Promise<void> {
    try {
      const content = await readFile(this.registryPath, 'utf-8');
      const data: BundleTemplate[] = JSON.parse(content);
      this.templates = new Map(data.map(t => [t.id, t]));
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        // File doesn't exist — start empty
        this.templates = new Map();
        return;
      }
      throw err;
    }
  }
}
