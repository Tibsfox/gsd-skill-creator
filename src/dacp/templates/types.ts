/**
 * Template module types and port interfaces.
 *
 * Re-exports BundleTemplate from the DACP core types and defines the
 * TemplateRegistryPort interface for dependency injection.
 *
 * @module dacp/templates/types
 */

export type { BundleTemplate, FidelityLevel } from '../types.js';

/**
 * Port interface for the template registry.
 * Allows dependency injection and testing without filesystem coupling.
 */
export interface TemplateRegistryPort {
  /** Register a new template. Throws if duplicate id. */
  register(template: import('../types.js').BundleTemplate): void;

  /** Get a template by id. Returns undefined if not found. */
  get(id: string): import('../types.js').BundleTemplate | undefined;

  /** Get all registered templates. */
  getAll(): import('../types.js').BundleTemplate[];

  /** Update an existing template. Throws if id not found. */
  update(id: string, updates: Partial<import('../types.js').BundleTemplate>): void;

  /** Remove a template by id. Throws if id not found. */
  remove(id: string): void;

  /** Find templates matching a handoff type (supports wildcard '*'). */
  findByHandoffType(type: string): import('../types.js').BundleTemplate[];

  /** Persist registry to disk. */
  save(): Promise<void>;

  /** Load registry from disk. */
  load(): Promise<void>;
}
