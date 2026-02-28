/**
 * DACP assembly rationale formatting.
 *
 * Provides two output formats for assembly decisions:
 * 1. Human-readable markdown (for bundle documentation)
 * 2. Single-line JSON (for JSONL observation pipeline)
 *
 * @module dacp/assembler/rationale
 */

import type { AssemblyRationale, FidelityLevel } from '../types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for formatting an assembly observation log entry.
 */
export interface AssemblyLogInput {
  /** Handoff type from taxonomy */
  handoff_type: string;
  /** Fidelity level that was decided */
  fidelity_decided: FidelityLevel;
  /** The input factors that determined fidelity */
  fidelity_inputs: {
    data_complexity: string;
    historical_drift_rate: number;
    available_skills: number;
    token_budget_remaining: number;
    safety_critical: boolean;
  };
  /** Skills used during assembly */
  skills_used: string[];
  /** Number of artifacts reused from catalog */
  artifacts_reused: number;
  /** Number of artifacts generated fresh */
  artifacts_generated: number;
  /** Total bundle size in bytes */
  bundle_size_bytes: number;
  /** Assembly duration in milliseconds */
  assembly_time_ms: number;
}

// ============================================================================
// Formatters
// ============================================================================

/**
 * Format an AssemblyRationale as human-readable markdown.
 *
 * Output format:
 * ```
 * ## Assembly Rationale
 *
 * **Level Justification:** {level_justification}
 *
 * **Skills Used:** {comma-separated list, or "None"}
 *
 * **Generated Artifacts:**
 * - {artifact1}
 * - {artifact2}
 *
 * **Reused Artifacts:**
 * - {artifact1}
 * ```
 *
 * @param rationale - The assembly rationale to format
 * @returns Human-readable markdown string
 */
export function formatRationale(rationale: AssemblyRationale): string {
  const lines: string[] = [
    '## Assembly Rationale',
    '',
    `**Level Justification:** ${rationale.level_justification}`,
    '',
    `**Skills Used:** ${rationale.skills_used.length > 0 ? rationale.skills_used.join(', ') : 'None'}`,
    '',
  ];

  lines.push(`**Generated Artifacts:** ${formatList(rationale.generated_artifacts)}`);
  lines.push('');
  lines.push(`**Reused Artifacts:** ${formatList(rationale.reused_artifacts)}`);

  return lines.join('\n');
}

/**
 * Format a list as either "None" or a bulleted markdown list.
 */
function formatList(items: string[]): string {
  if (items.length === 0) return 'None';
  return '\n' + items.map((item) => `- ${item}`).join('\n');
}

/**
 * Format an assembly observation as a single-line JSON string for JSONL.
 *
 * Output is a valid JSON string with:
 * - event: "dacp_assembly"
 * - timestamp: ISO 8601
 * - All fields from the input
 *
 * No trailing newline (caller adds \n when appending to file).
 *
 * @param input - The assembly log input data
 * @returns Single-line JSON string
 */
export function formatAssemblyLog(input: AssemblyLogInput): string {
  const entry = {
    event: 'dacp_assembly',
    timestamp: new Date().toISOString(),
    ...input,
  };

  return JSON.stringify(entry);
}
