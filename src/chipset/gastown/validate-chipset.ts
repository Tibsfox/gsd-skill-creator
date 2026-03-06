/**
 * Gastown chipset YAML validator.
 *
 * Validates a chipset YAML definition against the JSON schema,
 * checks token budget constraints, enforces agent topology rules,
 * and verifies communication channel integrity.
 *
 * Usage:
 *   import { validateChipset } from './validate-chipset.js';
 *   const result = validateChipset(yamlString, schemaPath);
 *   if (!result.valid) console.error(result.errors);
 */

import * as yaml from 'js-yaml';
import * as fs from 'node:fs';
import _Ajv from 'ajv';
const Ajv = _Ajv.default ?? _Ajv;

// ===========================================================================
// Types
// ===========================================================================

/** Result for a single validation section. */
export interface SectionResult {
  /** Section name (e.g., 'schema', 'token_budget', 'agent_topology'). */
  name: string;
  /** Whether this section passed validation. */
  valid: boolean;
  /** Error messages for this section (empty if valid). */
  errors: string[];
  /** Warning messages for this section. */
  warnings: string[];
}

/** Overall validation result. */
export interface ValidationResult {
  /** Whether the entire chipset definition is valid. */
  valid: boolean;
  /** Per-section validation results. */
  sections: SectionResult[];
  /** All error messages across all sections. */
  errors: string[];
  /** All warning messages across all sections. */
  warnings: string[];
}

// ===========================================================================
// Internal helpers
// ===========================================================================

interface SkillEntry {
  name: string;
  domain: string;
  description: string;
  token_budget_weight: number;
}

interface AgentEntry {
  name: string;
  role: string;
  skills: string[];
  count?: number;
}

interface ChannelEntry {
  name: string;
  type: string;
  filesystem_path: string;
  behavior: string;
}

interface ChipsetData {
  header?: {
    name?: string;
    version?: string;
    archetype?: string;
    description?: string;
    provenance?: string;
  };
  skills?: {
    required?: SkillEntry[];
    recommended?: SkillEntry[];
  };
  agents?: {
    topology?: string;
    agents?: AgentEntry[];
  };
  communication?: {
    channels?: ChannelEntry[];
  };
  dispatch?: {
    strategy?: string;
    max_parallel?: number;
    batch_threshold?: number;
    formula_support?: boolean;
  };
  evaluation?: {
    gates?: {
      pre_deploy?: Array<{
        check: string;
        threshold: number;
        action: string;
      }>;
    };
  };
  runtime?: {
    providers?: Array<{
      name: string;
      capabilities: string[];
    }>;
  };
}

function createSection(
  name: string,
  errors: string[] = [],
  warnings: string[] = [],
): SectionResult {
  return {
    name,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ===========================================================================
// Validation stages
// ===========================================================================

/**
 * Stage 1: Parse YAML and validate against JSON schema.
 */
function validateSchema(
  yamlContent: string,
  schemaPath: string,
): { section: SectionResult; data: ChipsetData | null } {
  // Parse YAML
  let data: unknown;
  try {
    data = yaml.load(yamlContent);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      section: createSection('schema', [`YAML parse error: ${msg}`]),
      data: null,
    };
  }

  if (data === null || data === undefined || typeof data !== 'object' || Array.isArray(data)) {
    return {
      section: createSection('schema', [
        'YAML must parse to an object, got: ' + (data === null ? 'null' : typeof data),
      ]),
      data: null,
    };
  }

  // Validate against JSON schema
  const schemaJson = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schemaJson);
  const valid = validate(data);

  if (!valid && validate.errors) {
    const errors = validate.errors.map((e: { instancePath?: string; message?: string }) => {
      const path = e.instancePath || '/';
      return `Schema violation at ${path}: ${e.message}`;
    });
    return {
      section: createSection('schema', errors),
      data: data as ChipsetData,
    };
  }

  return {
    section: createSection('schema'),
    data: data as ChipsetData,
  };
}

/**
 * Stage 2: Verify token budget weights sum to <= 1.0 (10k tokens).
 */
function validateTokenBudget(data: ChipsetData): SectionResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const required = data.skills?.required ?? [];
  const recommended = data.skills?.recommended ?? [];

  const requiredSum = required.reduce((sum, s) => sum + s.token_budget_weight, 0);
  const recommendedSum = recommended.reduce((sum, s) => sum + s.token_budget_weight, 0);
  const totalWeight = requiredSum + recommendedSum;

  // Use a small epsilon for floating point comparison
  if (totalWeight > 1.0 + 1e-9) {
    errors.push(
      `Total token budget weight (${totalWeight.toFixed(3)}) exceeds 1.0 limit. ` +
        `Required: ${requiredSum.toFixed(3)}, Recommended: ${recommendedSum.toFixed(3)}.`,
    );
  }

  if (totalWeight > 0.9 && totalWeight <= 1.0 + 1e-9) {
    warnings.push(
      `Token budget weight (${totalWeight.toFixed(3)}) is above 90% utilization.`,
    );
  }

  return createSection('token_budget', errors, warnings);
}

/**
 * Stage 3: Verify agent topology constraints.
 *
 * Rules:
 * - Exactly 1 agent with role "mayor"
 * - At least 1 agent with role "polecat"
 * - At least 1 agent with role "witness"
 * - All agent skill references must exist in the skills manifest
 */
function validateAgentTopology(data: ChipsetData): SectionResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const agents = data.agents?.agents ?? [];

  // Count agents by role
  const roleCounts: Record<string, number> = {};
  for (const agent of agents) {
    roleCounts[agent.role] = (roleCounts[agent.role] ?? 0) + 1;
  }

  // Exactly 1 mayor
  const mayorCount = roleCounts['mayor'] ?? 0;
  if (mayorCount === 0) {
    errors.push('Agent topology requires exactly 1 mayor, found 0.');
  } else if (mayorCount > 1) {
    errors.push(`Agent topology requires exactly 1 mayor, found ${mayorCount}.`);
  }

  // At least 1 polecat (worker)
  const polecatCount = roleCounts['polecat'] ?? 0;
  if (polecatCount === 0) {
    errors.push('Agent topology requires at least 1 polecat (worker), found 0.');
  }

  // At least 1 witness (observer)
  const witnessCount = roleCounts['witness'] ?? 0;
  if (witnessCount === 0) {
    errors.push('Agent topology requires at least 1 witness (observer), found 0.');
  }

  // Verify all skill references exist in the manifest
  const declaredSkills = new Set<string>();
  for (const skill of data.skills?.required ?? []) {
    declaredSkills.add(skill.name);
  }
  for (const skill of data.skills?.recommended ?? []) {
    declaredSkills.add(skill.name);
  }

  for (const agent of agents) {
    for (const skillRef of agent.skills) {
      if (!declaredSkills.has(skillRef)) {
        errors.push(
          `Agent "${agent.name}" references skill "${skillRef}" ` +
            `which is not declared in the skills manifest.`,
        );
      }
    }
  }

  return createSection('agent_topology', errors, warnings);
}

/**
 * Stage 4: Verify communication channels.
 *
 * Checks that channels have valid types and non-empty paths.
 */
function validateCommunication(data: ChipsetData): SectionResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const channels = data.communication?.channels ?? [];
  const validTypesList = ['mail', 'nudge', 'hook', 'handoff'];
  const validTypes = new Set(validTypesList);

  for (const channel of channels) {
    if (!validTypes.has(channel.type)) {
      errors.push(
        `Channel "${channel.name}" has invalid type "${channel.type}". ` +
          `Valid types: ${validTypesList.join(', ')}.`,
      );
    }

    if (!channel.filesystem_path || channel.filesystem_path.trim() === '') {
      errors.push(`Channel "${channel.name}" has empty filesystem_path.`);
    }
  }

  // Warn if fewer than expected channel types are present
  const presentTypes = new Set(channels.map((c) => c.type));
  for (const expected of validTypesList) {
    if (!presentTypes.has(expected)) {
      warnings.push(`No channel of type "${expected}" is defined.`);
    }
  }

  return createSection('communication', errors, warnings);
}

// ===========================================================================
// Public API
// ===========================================================================

/**
 * Validate a chipset YAML definition.
 *
 * @param yamlContent - Raw YAML string to validate.
 * @param schemaPath - Absolute or relative path to the JSON schema file.
 * @returns Structured validation result with per-section details.
 */
export function validateChipset(
  yamlContent: string,
  schemaPath: string,
): ValidationResult {
  const sections: SectionResult[] = [];

  // Stage 1: Schema validation
  const { section: schemaSection, data } = validateSchema(yamlContent, schemaPath);
  sections.push(schemaSection);

  // If parsing/schema failed, short-circuit with remaining sections marked invalid
  if (!data || !schemaSection.valid) {
    const allErrors = sections.flatMap((s) => s.errors);
    const allWarnings = sections.flatMap((s) => s.warnings);
    return { valid: false, sections, errors: allErrors, warnings: allWarnings };
  }

  // Stage 2: Token budget
  sections.push(validateTokenBudget(data));

  // Stage 3: Agent topology
  sections.push(validateAgentTopology(data));

  // Stage 4: Communication channels
  sections.push(validateCommunication(data));

  // Aggregate results
  const allErrors = sections.flatMap((s) => s.errors);
  const allWarnings = sections.flatMap((s) => s.warnings);
  const valid = sections.every((s) => s.valid);

  return { valid, sections, errors: allErrors, warnings: allWarnings };
}
