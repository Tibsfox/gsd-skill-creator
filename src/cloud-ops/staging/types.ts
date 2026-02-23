/**
 * Type definitions for the OpenStack configuration intake and chipset variant
 * staging pipeline.
 *
 * Covers INTEG-03: staging layer for OpenStack config files and community
 * chipset variants flowing into the cloud-ops crew.
 *
 * @module cloud-ops/staging/types
 */

/**
 * Supported OpenStack configuration file categories.
 *
 * - globals    -- globals.yml (kolla-ansible global configuration)
 * - passwords  -- passwords.yml (service credentials)
 * - inventory  -- Ansible inventory files (host groups, variables)
 * - certificates -- TLS certificates and private keys (.pem, .crt, .key)
 * - custom     -- Any other configuration file that does not match above
 */
export type OpenStackConfigType =
  | 'globals'
  | 'passwords'
  | 'inventory'
  | 'certificates'
  | 'custom';

/**
 * An OpenStack configuration file submitted through the intake pipeline.
 *
 * Created by `stageOpenStackConfig` before writing to the staging inbox.
 */
export interface OpenStackConfigIntake {
  /** Original filename as submitted (e.g., 'globals.yml'). */
  filename: string;
  /** Detected or declared configuration type. */
  configType: OpenStackConfigType;
  /** Raw string content of the configuration file. */
  content: string;
  /** Origin of the submission (e.g., 'cli', 'dashboard', 'api'). */
  source: string;
  /** ISO 8601 timestamp of when intake was initiated. */
  submittedAt: string;
}

/**
 * Result of validating an OpenStack configuration file.
 *
 * Returned by `validateConfigFile`. A file can be valid with warnings
 * (e.g., non-standard section names in an inventory file).
 */
export interface ConfigValidationResult {
  /** Whether the file passed all mandatory checks. */
  valid: boolean;
  /** Error messages that caused validation failure. */
  errors: string[];
  /** Advisory messages that do not block intake. */
  warnings: string[];
  /** The configuration type the file was validated against. */
  configType: OpenStackConfigType;
}

/**
 * Metadata for a community-submitted chipset variant.
 *
 * A chipset variant extends or customises an existing chipset by specifying
 * a different set of skills, agents, or teams. Validated against structural
 * conventions before staging.
 */
export interface ChipsetVariant {
  /** Unique variant name (used as the directory name on disk). */
  name: string;
  /** Human-readable description of what this variant provides. */
  description: string;
  /** Name of the base chipset this variant derives from. */
  basedOn: string;
  /** List of skill names included in or replaced by this variant. */
  skills: string[];
  /** List of agent names activated by this variant. */
  agents: string[];
  /** List of team names configured by this variant. */
  teams: string[];
}

/**
 * A chipset variant file submitted through the intake pipeline.
 *
 * Created by `stageChipsetVariant` before writing to the staging inbox.
 */
export interface ChipsetVariantIntake {
  /** Parsed variant metadata. */
  variant: ChipsetVariant;
  /** Raw YAML string content of the chipset.yaml file. */
  chipsetContent: string;
  /** Origin of the submission (e.g., 'community', 'cli'). */
  source: string;
  /** ISO 8601 timestamp of when intake was initiated. */
  submittedAt: string;
}

/**
 * Summary information for a staged chipset variant.
 *
 * Returned by `listStagedVariants` when scanning the staging inbox.
 */
export interface StagedVariantInfo {
  /** Variant name (derived from directory name). */
  name: string;
  /** Absolute path to the staged chipset.yaml file. */
  path: string;
  /** ISO 8601 timestamp from the companion metadata file. */
  stagedAt: string;
  /** Whether structural validation passed when the variant was staged. */
  validated: boolean;
}
