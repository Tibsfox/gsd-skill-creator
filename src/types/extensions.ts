import type { SkillTrigger, SkillLearning } from './skill.js';
import type { SkillEvents } from '../events/types.js';
import type { CacheTier } from '../application/stages/cache-order-stage.js';

export type { CacheTier } from '../application/stages/cache-order-stage.js';

/**
 * Tracking data for force-override of reserved names.
 * Recorded when user bypasses reserved name protection.
 */
export interface ForceOverrideReservedName {
  /** The reserved name that was used */
  reservedName: string;
  /** Category of the reserved name (e.g., 'built-in-commands') */
  category: string;
  /** Reason why the name was reserved */
  reason: string;
  /** ISO timestamp when the override occurred */
  overrideDate: string;
}

/**
 * Tracking data for force-overriding budget limits.
 * Stored when user explicitly chooses to exceed character budget.
 */
export interface ForceOverrideBudget {
  /** Character count at time of override */
  charCount: number;
  /** Budget limit that was exceeded */
  budgetLimit: number;
  /** Usage percentage at time of override */
  usagePercent: number;
  /** ISO date when override was granted */
  overrideDate: string;
}

/**
 * Extension fields managed by gsd-skill-creator.
 * These fields are stored under metadata.extensions['gsd-skill-creator'] in new format,
 * or at the root level in legacy format.
 */
export interface GsdSkillCreatorExtension {
  /** Trigger conditions for auto-activation */
  triggers?: SkillTrigger;

  /** Learning metadata for skill refinement */
  learning?: SkillLearning;

  /** Whether the skill is enabled (default true) */
  enabled?: boolean;

  /** Version number, incremented on updates */
  version?: number;

  /** Parent skill name to inherit from */
  extends?: string;

  /** ISO timestamp of creation */
  createdAt?: string;

  /** ISO timestamp of last update */
  updatedAt?: string;

  /** Tracking data if user force-overrode reserved name protection */
  forceOverrideReservedName?: ForceOverrideReservedName;

  /** Tracking data if user force-overrode budget limits */
  forceOverrideBudget?: ForceOverrideBudget;

  /** Event declarations for inter-skill communication */
  events?: SkillEvents;

  /** Cache tier for prompt cache optimization (static > session > dynamic) */
  cacheTier?: CacheTier;
}

/**
 * Container for all extensions under the metadata field.
 * Follows the official Claude Code pattern: metadata.extensions['namespace']
 */
export interface ExtensionsContainer {
  extensions?: {
    'gsd-skill-creator'?: GsdSkillCreatorExtension;
    /** Preserve unknown extensions from other tools */
    [key: string]: unknown;
  };
}

/** Legacy extension field names that may appear at root level */
const LEGACY_EXTENSION_FIELDS = [
  'triggers',
  'learning',
  'enabled',
  'version',
  'extends',
  'createdAt',
  'updatedAt',
] as const;

/**
 * Detect if metadata is in legacy format (extension fields at root, no metadata.extensions container).
 *
 * @param metadata - Raw metadata object to check
 * @returns true if metadata has extension fields at root AND no metadata.extensions container
 */
export function isLegacyFormat(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  const m = metadata as Record<string, unknown>;

  // Check if new format exists (metadata.extensions container)
  const metadataContainer = m.metadata as Record<string, unknown> | undefined;
  if (metadataContainer?.extensions) {
    return false;
  }

  // Check if any legacy extension fields exist at root
  for (const field of LEGACY_EXTENSION_FIELDS) {
    if (field in m && m[field] !== undefined) {
      return true;
    }
  }

  return false;
}

/**
 * Raw metadata shape for getExtension - accepts both legacy and new format.
 * This is a structural type that matches SkillMetadata without circular import.
 */
interface RawMetadataWithExtensions {
  // Legacy fields at root
  triggers?: SkillTrigger;
  learning?: SkillLearning;
  enabled?: boolean;
  version?: number;
  extends?: string;
  createdAt?: string;
  updatedAt?: string;
  // New format container
  metadata?: {
    extensions?: {
      'gsd-skill-creator'?: GsdSkillCreatorExtension;
    };
  };
}

/**
 * Extract extension data from metadata, handling both legacy and new formats.
 *
 * @param metadata - SkillMetadata object (may be legacy or new format)
 * @returns GsdSkillCreatorExtension object (empty object if no extension data)
 */
export function getExtension(metadata: RawMetadataWithExtensions): GsdSkillCreatorExtension {
  // New format: nested under metadata.extensions['gsd-skill-creator']
  const newFormatExt = metadata.metadata?.extensions?.['gsd-skill-creator'];
  if (newFormatExt) {
    return newFormatExt;
  }

  // Legacy format: extract fields from root level
  const ext: GsdSkillCreatorExtension = {};

  if (metadata.triggers !== undefined) ext.triggers = metadata.triggers;
  if (metadata.learning !== undefined) ext.learning = metadata.learning;
  if (metadata.enabled !== undefined) ext.enabled = metadata.enabled;
  if (metadata.version !== undefined) ext.version = metadata.version;
  if (metadata.extends !== undefined) ext.extends = metadata.extends;
  if (metadata.createdAt !== undefined) ext.createdAt = metadata.createdAt;
  if (metadata.updatedAt !== undefined) ext.updatedAt = metadata.updatedAt;

  return ext;
}

/**
 * Check if extension object has any defined fields.
 * Used to avoid creating empty metadata.extensions containers.
 *
 * @param ext - Extension object to check
 * @returns true if any extension field is defined
 */
export function hasExtensionData(ext: GsdSkillCreatorExtension): boolean {
  return (
    ext.triggers !== undefined ||
    ext.learning !== undefined ||
    ext.enabled !== undefined ||
    ext.version !== undefined ||
    ext.extends !== undefined ||
    ext.createdAt !== undefined ||
    ext.updatedAt !== undefined ||
    ext.forceOverrideReservedName !== undefined ||
    ext.forceOverrideBudget !== undefined ||
    ext.events !== undefined ||
    ext.cacheTier !== undefined
  );
}
