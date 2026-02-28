/**
 * Scope/privilege coherence checker.
 *
 * Detects mismatches between a content's declared purpose and the
 * tools/permissions it requests. A skill that claims to "format markdown"
 * but requests Bash and WebFetch access is suspicious.
 *
 * @module staging/hygiene/scope-coherence
 */

import type { HygieneSeverity } from './types.js';

/** What the content declares it does. */
export interface ScopeDeclaration {
  /** Declared purpose or description (e.g., "formats markdown files"). */
  purpose: string;
  /** Tools/permissions requested (e.g., ['Read', 'Write', 'Bash', 'WebFetch']). */
  requestedTools: string[];
  /** Optional: explicitly declared scope keywords extracted from content. */
  scopeKeywords?: string[];
}

/** A single coherence finding. */
export interface CoherenceFinding {
  /** Which tool or permission is incoherent with declared purpose. */
  tool: string;
  /** Severity of the incoherence. */
  severity: HygieneSeverity;
  /** Human-readable explanation of why this is suspicious. */
  reason: string;
}

/** Result of scope coherence analysis. */
export interface CoherenceResult {
  /** Whether the scope is coherent (no suspicious mismatches). */
  isCoherent: boolean;
  /** List of incoherence findings. */
  findings: CoherenceFinding[];
  /** Overall risk level (highest severity among findings, or 'info' if clean). */
  riskLevel: HygieneSeverity;
}

/**
 * Mapping of tool names to the purpose keywords that justify their use,
 * and the severity level when the tool is unjustified.
 *
 * Tools NOT in this map (Read, Edit, Glob, Grep, and any unknown tools)
 * are considered safe and never flagged.
 */
const TOOL_PURPOSE_MAP: Record<string, { keywords: string[]; severity: HygieneSeverity }> = {
  Bash: {
    keywords: [
      'shell', 'terminal', 'command', 'script', 'build', 'test',
      'deploy', 'install', 'run', 'execute', 'compile', 'lint',
    ],
    severity: 'high',
  },
  Write: {
    keywords: [
      'write', 'create', 'generate', 'output', 'save', 'template',
      'scaffold', 'modify', 'edit', 'update',
    ],
    severity: 'medium',
  },
  WebFetch: {
    keywords: [
      'web', 'fetch', 'http', 'api', 'download', 'url', 'remote',
      'external', 'network', 'request',
    ],
    severity: 'medium',
  },
  WebSearch: {
    keywords: [
      'search', 'web', 'find', 'lookup', 'query', 'research', 'internet',
    ],
    severity: 'medium',
  },
  NotebookEdit: {
    keywords: [
      'notebook', 'jupyter', 'ipynb', 'data', 'analysis', 'science',
    ],
    severity: 'low',
  },
};

/** Severity ordering from highest to lowest. */
const SEVERITY_ORDER: HygieneSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

/**
 * Check whether a content's declared purpose is consistent with the
 * tools and permissions it requests.
 *
 * Logic:
 * 1. For each requestedTool, look up in TOOL_PURPOSE_MAP.
 * 2. If the tool is in the map, check whether the purpose string
 *    (lowercased) contains any of the tool's keywords. Also check
 *    scopeKeywords if provided.
 * 3. If no keyword match is found, create a CoherenceFinding.
 * 4. isCoherent = findings.length === 0
 * 5. riskLevel = highest severity among findings, or 'info' if clean.
 *
 * @param declaration - The scope declaration to check
 * @returns Coherence analysis result
 */
export function checkScopeCoherence(declaration: ScopeDeclaration): CoherenceResult {
  const findings: CoherenceFinding[] = [];
  const purposeLower = declaration.purpose.toLowerCase();
  const scopeKeywordsLower = (declaration.scopeKeywords ?? []).map((k) => k.toLowerCase());

  for (const tool of declaration.requestedTools) {
    const mapping = TOOL_PURPOSE_MAP[tool];

    // Tools not in the map are considered safe
    if (!mapping) {
      continue;
    }

    // Check if any keyword matches in purpose or scopeKeywords
    const hasMatch = mapping.keywords.some(
      (keyword) =>
        purposeLower.includes(keyword) ||
        scopeKeywordsLower.some((sk) => sk.includes(keyword)),
    );

    if (!hasMatch) {
      findings.push({
        tool,
        severity: mapping.severity,
        reason: `Tool "${tool}" is not consistent with declared purpose "${declaration.purpose}". `
          + `Expected purpose to mention one of: ${mapping.keywords.join(', ')}.`,
      });
    }
  }

  const isCoherent = findings.length === 0;
  const riskLevel = isCoherent
    ? 'info'
    : highestSeverity(findings.map((f) => f.severity));

  return { isCoherent, findings, riskLevel };
}

/**
 * Return the highest severity from a list of severities.
 */
function highestSeverity(severities: HygieneSeverity[]): HygieneSeverity {
  for (const level of SEVERITY_ORDER) {
    if (severities.includes(level)) {
      return level;
    }
  }
  return 'info';
}
