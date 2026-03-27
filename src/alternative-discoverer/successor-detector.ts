/**
 * Detects explicit successors from registry deprecated fields and README
 * migration notices. This is the highest-confidence alternative discovery
 * signal — an explicit migration notice is near-definitive evidence.
 *
 * DISC-01 implementation.
 */

import type { DiagnosisResult } from '../health-diagnostician/types.js';
import type { RegistryHealth } from '../dependency-auditor/types.js';
import type { AlternativeReport } from './types.js';

// ─── Package name regex ───────────────────────────────────────────────────────

/**
 * Matches npm package names including scoped packages like @scope/name.
 * Handles: alphanumeric, hyphens, underscores, dots, @, /
 */
const PKG_NAME_RE = /[\w@][\w@/.-]*/;

/**
 * Strip surrounding quotes, backticks, and angle brackets from an extracted
 * package name token.
 */
function cleanName(raw: string): string {
  return raw.replace(/^[`'"<]+|[`'">.]+$/g, '').trim();
}

// ─── Deprecated field patterns ────────────────────────────────────────────────

/**
 * Ordered list of patterns to search in the deprecated message.
 * Each returns the captured package name or null.
 */
const DEPRECATED_PATTERNS: Array<(msg: string) => string | null> = [
  // "Use X instead" / "Use X" at end of message
  (msg) => {
    const m = msg.match(/\buse\s+(`?)([\w@][\w@/.-]*)(`?)\s*instead/i);
    return m ? cleanName(m[2]) : null;
  },
  // "Replaced by X" / "replaced with X"
  (msg) => {
    const m = msg.match(/\b(?:replaced?\s+(?:by|with))\s+(`?)([\w@][\w@/.-]*)(`?)/i);
    return m ? cleanName(m[2]) : null;
  },
  // "Moved to X"
  (msg) => {
    const m = msg.match(/\bmoved?\s+to\s+(`?)([\w@][\w@/.-]*)(`?)/i);
    return m ? cleanName(m[2]) : null;
  },
  // "See X" at start or after punctuation
  (msg) => {
    const m = msg.match(/\bsee\s+(`?)([\w@][\w@/.-]*)(`?)/i);
    return m ? cleanName(m[2]) : null;
  },
  // "X is the new package"
  (msg) => {
    const m = msg.match(/^(`?)([\w@][\w@/.-]*)(`?)\s+is\s+the\s+new/i);
    return m ? cleanName(m[2]) : null;
  },
];

function extractFromDeprecated(msg: string): string | null {
  for (const pattern of DEPRECATED_PATTERNS) {
    const name = pattern(msg);
    if (name && name.length > 0 && name !== msg) return name;
  }
  return null;
}

// ─── README patterns ──────────────────────────────────────────────────────────

const README_PATTERNS: Array<(readme: string) => string | null> = [
  // "migrate to X" / "migrating to X"
  (r) => {
    const m = r.match(/\bmigratt?e?\s+to\s+([`']?)([\w@][\w@/.-]*)([`']?)/i);
    return m ? cleanName(m[2]) : null;
  },
  // "replaced by X" / "replaced with X"
  (r) => {
    const m = r.match(/\b(?:replaced?\s+(?:by|with))\s+([`']?)([\w@][\w@/.-]*)([`']?)/i);
    return m ? cleanName(m[2]) : null;
  },
  // "use X instead"
  (r) => {
    const m = r.match(/\buse\s+([`']?)([\w@][\w@/.-]*)([`']?)\s+instead/i);
    return m ? cleanName(m[2]) : null;
  },
  // "successor: X"
  (r) => {
    const m = r.match(/\bsuccessor:\s*([`']?)([\w@][\w@/.-]*)([`']?)/i);
    return m ? cleanName(m[2]) : null;
  },
];

function extractFromReadme(readme: string): string | null {
  for (const pattern of README_PATTERNS) {
    const name = pattern(readme);
    if (name && name.length > 0) return name;
  }
  return null;
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Processes a list of DiagnosisResults and returns AlternativeReport[] for
 * any deps that have explicit successor signals in their registry metadata.
 *
 * Only processes deps classified as 'stale' (with deprecated flag) or 'abandoned'.
 * Returns an empty array — never throws — when no migration notices are found.
 */
export function detectSuccessors(results: DiagnosisResult[]): AlternativeReport[] {
  const reports: AlternativeReport[] = [];

  for (const result of results) {
    const { classification, signal } = result;

    // Only process stale (deprecated) or abandoned deps
    if (classification !== 'stale' && classification !== 'abandoned') continue;

    const dep = signal.dependency;
    const meta = (signal.registryHealth as RegistryHealth & { _meta?: Record<string, unknown> })._meta;

    // Priority 1: npm-style deprecated message in registryHealth._meta.deprecated
    const deprecatedMsg = typeof meta?.deprecated === 'string' ? meta.deprecated : null;
    if (deprecatedMsg) {
      const extracted = extractFromDeprecated(deprecatedMsg);
      if (extracted) {
        reports.push({
          originalPackage: dep.name,
          originalEcosystem: dep.ecosystem,
          relationship: 'successor',
          alternativeName: extracted,
          evidenceSummary: `Registry deprecated field: '${deprecatedMsg}'`,
          apiCompatibility: 'unknown',
          migrationEffort: 'low',
          confidenceScore: 0.9,
          sourceUrl: null,
        });
        continue; // deprecated field is highest priority — skip README scan
      }
    }

    // Priority 2: README migration notice
    const readme = typeof meta?.readme === 'string' ? meta.readme : null;
    if (readme) {
      const extracted = extractFromReadme(readme);
      if (extracted) {
        reports.push({
          originalPackage: dep.name,
          originalEcosystem: dep.ecosystem,
          relationship: 'successor',
          alternativeName: extracted,
          evidenceSummary: 'README migration notice found',
          apiCompatibility: 'unknown',
          migrationEffort: 'low',
          confidenceScore: 0.7,
          sourceUrl: null,
        });
      }
    }
  }

  return reports;
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper for detectSuccessors, providing a stateful API surface. */
export class SuccessorDetector {
  detect(results: DiagnosisResult[]): AlternativeReport[] {
    return detectSuccessors(results);
  }
}
