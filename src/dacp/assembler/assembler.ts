/**
 * DACP Assembler — core engine for three-part bundle composition.
 *
 * The assembler is the "compiler" that transforms ambiguous communication
 * intent into deterministic artifacts. It:
 * 1. Assesses data complexity
 * 2. Queries the skill library for matching components
 * 3. Determines the appropriate fidelity level
 * 4. Composes a three-part bundle: intent (markdown) + data (JSON) + code (scripts)
 * 5. Records assembly rationale for retrospective analysis
 *
 * The assembler does NOT generate code — it selects from existing catalog entries.
 *
 * @module dacp/assembler/assembler
 */

import type {
  FidelityLevel,
  FidelityDecision,
  BundleManifest,
  AssemblyRationale,
  BusOpcode,
} from '../types.js';
import { DACP_VERSION } from '../types.js';
import { determineFidelity, assessDataComplexity, clampFidelityChange } from '../fidelity/decision.js';
import type { CatalogQuery } from './catalog-query.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Request to assemble a DACP bundle.
 */
export interface AssemblyRequest {
  /** Agent assembling/sending the bundle */
  source_agent: string;
  /** Agent that will receive the bundle */
  target_agent: string;
  /** GSD bus operation code */
  opcode: BusOpcode;
  /** Human-readable intent markdown */
  intent: string;
  /** Optional data payload */
  data?: unknown;
  /** Handoff type from taxonomy */
  handoff_type: string;
  /** Historical drift rate for this handoff type (0.0-1.0) */
  historical_drift_rate: number;
  /** Remaining token budget */
  token_budget_remaining: number;
  /** Whether this handoff involves safety-critical operations */
  safety_critical: boolean;
  /** Current fidelity level (for SAFE-02 bounded changes) */
  current_fidelity?: FidelityLevel;
  /** Data types associated with this handoff */
  data_types?: string[];
}

/**
 * Result of assembling a DACP bundle.
 */
export interface AssemblyResult {
  /** The bundle manifest */
  manifest: BundleManifest;
  /** The intent.md content */
  intent_markdown: string;
  /** Data files: filename -> JSON content for data/ */
  data_files: Record<string, unknown>;
  /** Code files: filename -> script content for code/ */
  code_files: Record<string, string>;
  /** Assembly rationale explaining decisions */
  rationale: AssemblyRationale;
}

// ============================================================================
// Assembler
// ============================================================================

/**
 * DACP Assembler composes three-part bundles at the correct fidelity level.
 *
 * Injectable CatalogQuery for testability — no filesystem reads in the
 * assembler itself.
 */
export class DACPAssembler {
  private readonly catalog: CatalogQuery;

  constructor(catalog: CatalogQuery) {
    this.catalog = catalog;
  }

  /**
   * Assemble a DACP bundle from a request.
   *
   * Steps:
   * 1. Assess data complexity
   * 2. Count available skills from catalog
   * 3. Build FidelityDecision from request + computed values
   * 4. Determine fidelity level (with optional SAFE-02 clamping)
   * 5. Compose bundle artifacts based on fidelity level
   * 6. Record assembly rationale
   * 7. Build manifest with provenance
   *
   * @param request - The assembly request
   * @returns The assembled bundle result
   */
  assemble(request: AssemblyRequest): AssemblyResult {
    const dataTypes = request.data_types ?? [];

    // Step 1: Assess data complexity
    const dataComplexity = assessDataComplexity(request.data);

    // Step 2: Count available skills
    const availableSkills = this.catalog.countAvailableSkills(
      request.handoff_type,
      dataTypes,
    );

    // Step 3: Build fidelity decision input
    const fidelityInput: FidelityDecision = {
      handoff_type: request.handoff_type,
      data_complexity: dataComplexity,
      historical_drift_rate: request.historical_drift_rate,
      available_skills: availableSkills,
      token_budget_remaining: request.token_budget_remaining,
      safety_critical: request.safety_critical,
    };

    // Step 4: Determine fidelity level
    let fidelityLevel = determineFidelity(fidelityInput);

    // SAFE-02: Clamp if current fidelity is provided
    if (request.current_fidelity !== undefined) {
      fidelityLevel = clampFidelityChange(request.current_fidelity, fidelityLevel);
    }

    // Step 5: Compose bundle based on fidelity level
    const dataFiles: Record<string, unknown> = {};
    const codeFiles: Record<string, string> = {};
    const generatedArtifacts: string[] = [];
    const reusedArtifacts: string[] = [];
    const skillsUsed: string[] = [];

    // Level 1+: Include data payload
    if (fidelityLevel >= 1 && request.data !== undefined) {
      dataFiles['payload.json'] = request.data;
      generatedArtifacts.push('data/payload.json');
    }

    // Level 2+: Include schema references
    if (fidelityLevel >= 2) {
      for (const dataType of dataTypes) {
        const schemas = this.catalog.findSchemas(dataType);
        for (const schema of schemas) {
          dataFiles[`schema-${schema.data_type}.json`] = {
            $ref: schema.schema_path,
            source_skill: schema.source_skill,
            version: schema.version,
          };
          reusedArtifacts.push(`data/schema-${schema.data_type}.json`);
          if (!skillsUsed.includes(schema.source_skill)) {
            skillsUsed.push(schema.source_skill);
          }
        }
      }
    }

    // Level 3+: Include matching scripts
    if (fidelityLevel >= 3) {
      // Search for scripts across all standard function types
      const functionTypes = ['parser', 'validator', 'transformer', 'formatter', 'analyzer'];
      for (const funcType of functionTypes) {
        const scripts = this.catalog.findScripts(funcType, dataTypes);
        for (const script of scripts) {
          const filename = `${script.function_type}-${script.id}.sh`;
          codeFiles[filename] = [
            `# Source: ${script.skill_source} v${script.skill_version}`,
            `# Function: ${script.function_type}`,
            `# Path: ${script.script_path}`,
            `# Deterministic: ${script.deterministic}`,
            '',
            `# Script content from ${script.script_path}`,
          ].join('\n');
          reusedArtifacts.push(`code/${filename}`);
          if (!skillsUsed.includes(script.skill_source)) {
            skillsUsed.push(script.skill_source);
          }
        }
      }
    }

    // Always generate intent markdown
    generatedArtifacts.push('intent.md');

    // Step 6: Build rationale
    const rationale: AssemblyRationale = {
      level_justification: this.buildJustification(fidelityLevel, fidelityInput),
      skills_used: skillsUsed,
      generated_artifacts: generatedArtifacts,
      reused_artifacts: reusedArtifacts,
    };

    // Step 7: Build manifest
    const dataManifest: BundleManifest['data_manifest'] = {};
    for (const [filename, content] of Object.entries(dataFiles)) {
      const isSchema = filename.startsWith('schema-');
      dataManifest[filename] = {
        purpose: isSchema ? `Schema reference for ${filename}` : 'Data payload',
        source: isSchema ? 'skill-library' : 'assembly-input',
        schema_ref: isSchema ? filename : undefined,
      };
    }

    const codeManifest: BundleManifest['code_manifest'] = {};
    for (const [filename, content] of Object.entries(codeFiles)) {
      // Extract skill_source from the first line comment
      const sourceMatch = content.match(/# Source: (\S+) v(\S+)/);
      codeManifest[filename] = {
        purpose: `${filename.split('-')[0]} script from skill library`,
        language: 'bash',
        source_skill: sourceMatch?.[1] ?? 'unknown',
        deterministic: content.includes('Deterministic: true'),
      };
    }

    const now = new Date().toISOString();

    const skillVersions: Record<string, string> = {};
    for (const skillName of skillsUsed) {
      skillVersions[skillName] = '1.0.0';
    }

    const manifest: BundleManifest = {
      version: DACP_VERSION,
      fidelity_level: fidelityLevel,
      source_agent: request.source_agent,
      target_agent: request.target_agent,
      opcode: request.opcode,
      intent_summary: request.intent.slice(0, 200),
      human_origin: {
        vision_doc: '',
        planning_phase: '',
        user_directive: request.intent.slice(0, 200),
      },
      data_manifest: dataManifest,
      code_manifest: codeManifest,
      assembly_rationale: rationale,
      provenance: {
        assembled_by: 'dacp-assembler',
        assembled_at: now,
        skill_versions: skillVersions,
      },
    };

    return {
      manifest,
      intent_markdown: request.intent,
      data_files: dataFiles,
      code_files: codeFiles,
      rationale,
    };
  }

  /**
   * Build a human-readable justification for the chosen fidelity level.
   */
  private buildJustification(
    level: FidelityLevel,
    input: FidelityDecision,
  ): string {
    const parts: string[] = [`Level ${level} selected.`];

    if (input.safety_critical) {
      parts.push('Safety-critical handoff requires maximum scaffolding.');
      return parts.join(' ');
    }

    if (input.data_complexity === 'none') {
      parts.push('No structured data; prose-only intent is sufficient.');
      return parts.join(' ');
    }

    if (input.token_budget_remaining < 20_000) {
      parts.push(`Token budget constrained (${input.token_budget_remaining} remaining); capped at Level 1.`);
      return parts.join(' ');
    }

    parts.push(`Data complexity: ${input.data_complexity}.`);

    if (input.historical_drift_rate > 0.3) {
      parts.push(`High drift rate (${input.historical_drift_rate}).`);
    } else if (input.historical_drift_rate > 0.15) {
      parts.push(`Moderate drift rate (${input.historical_drift_rate}).`);
    }

    if (input.available_skills > 0) {
      parts.push(`${input.available_skills} skill(s) available for scaffolding.`);
    } else {
      parts.push('No matching skills in catalog.');
    }

    return parts.join(' ');
  }

  /**
   * Simple hash function for content integrity.
   * Not cryptographic — just for manifest tracking.
   */
  private simpleHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}
