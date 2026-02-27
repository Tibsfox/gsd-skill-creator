/**
 * DACP execution context builder.
 *
 * Transforms a LoadedBundle into a structured ExecutionContext with typed
 * data, script references (review-only), and intent summary.
 *
 * SAFE-01: Scripts are presented as frozen plain data objects with NO
 * executable methods, functions, or callables. The entire ExecutionContext
 * is frozen to prevent post-creation mutation that could add execution
 * capabilities.
 *
 * @module interpreter/context-builder
 */

import type { LoadedBundle, ExecutionContext } from './types.js';

/**
 * Format an assembly rationale into a human-readable string.
 *
 * @param fidelityLevel - The fidelity level of the bundle
 * @param rationale - The structured assembly rationale from the manifest
 * @returns Human-readable rationale string
 */
function formatRationale(
  fidelityLevel: number,
  rationale: {
    level_justification: string;
    skills_used: string[];
    generated_artifacts: string[];
    reused_artifacts: string[];
  },
): string {
  const parts = [
    `Level ${fidelityLevel} assigned: ${rationale.level_justification}`,
    rationale.skills_used.length > 0
      ? `Skills used: ${rationale.skills_used.join(', ')}`
      : null,
    rationale.generated_artifacts.length > 0
      ? `Generated: ${rationale.generated_artifacts.join(', ')}`
      : null,
    rationale.reused_artifacts.length > 0
      ? `Reused: ${rationale.reused_artifacts.join(', ')}`
      : null,
  ].filter(Boolean).join('. ') + '.';

  return parts;
}

/**
 * Build a structured execution context from a loaded bundle.
 *
 * The returned ExecutionContext is a frozen plain data object with:
 * - Typed data payloads (parsed JSON objects)
 * - Script references as review-only data (strings/booleans only, NO methods)
 * - Intent summary and full markdown
 * - Assembly rationale as human-readable text
 *
 * SAFE-01: No auto-execute capability. All script references are frozen
 * plain objects containing only string and boolean values.
 *
 * @param bundle - The loaded bundle to transform
 * @returns Frozen ExecutionContext with typed data and review-only script references
 */
export function buildExecutionContext(bundle: LoadedBundle): ExecutionContext {
  const assemblyRationale = formatRationale(
    bundle.fidelityLevel,
    bundle.manifest.assembly_rationale,
  );

  // Build script references as frozen plain data objects (SAFE-01)
  const scriptReferences = bundle.scripts.map(s =>
    Object.freeze({
      name: s.name,
      purpose: s.purpose,
      deterministic: s.deterministic,
      sourceSkill: s.sourceSkill,
      content: s.content,
    }),
  );

  // Return frozen context to prevent post-creation mutation
  return Object.freeze({
    intentSummary: bundle.manifest.intent_summary,
    intentMarkdown: bundle.intent,
    typedData: bundle.data,
    scriptReferences,
    fidelityLevel: bundle.fidelityLevel,
    sourceAgent: bundle.manifest.source_agent,
    targetAgent: bundle.manifest.target_agent,
    assemblyRationale,
  });
}
