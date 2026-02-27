import type {
  RawChangeEvent,
  ClassifiedEvent,
  ChannelConfig,
  ChangeType,
  Severity,
} from './types.js';

/* ------------------------------------------------------------------ */
/*  Keyword patterns for change type detection                         */
/* ------------------------------------------------------------------ */

interface DetectionRule {
  type: ChangeType;
  patterns: RegExp[];
  weight: number;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    type: 'breaking',
    patterns: [
      /\bbreaking\s*change\b/i,
      /\bremoved?\b/i,
      /\bbackward[s]?\s*incompatible\b/i,
      /\bmigration\s*required\b/i,
    ],
    weight: 0.95,
  },
  {
    type: 'security',
    patterns: [
      /\bsecurity\b/i,
      /\bcve-\d{4}/i,
      /\bvulnerabilit(?:y|ies)\b/i,
      /\bauthenticat(?:ion|ed)\s*bypass\b/i,
      /\bpatch(?:ed)?\s*(?:a\s*)?(?:security|vuln)/i,
    ],
    weight: 0.95,
  },
  {
    type: 'deprecation',
    patterns: [
      /\bdeprecated?\b/i,
      /\bwill\s+be\s+removed\b/i,
      /\bsunset(?:ting)?\b/i,
      /\bend[- ]of[- ]life\b/i,
    ],
    weight: 0.85,
  },
  {
    type: 'enhancement',
    patterns: [
      /\badded\s+(?:support|new)\b/i,
      /\bnew\s+feature\b/i,
      /\bintroduc(?:ed?|ing)\b/i,
      /\bnow\s+(?:supports?|available)\b/i,
    ],
    weight: 0.80,
  },
  {
    type: 'optimization',
    patterns: [
      /\bperformance\b/i,
      /\boptimiz(?:ed?|ation)\b/i,
      /\bfaster\b/i,
      /\bthroughput\b/i,
      /\blatency\b/i,
    ],
    weight: 0.75,
  },
];

/* ------------------------------------------------------------------ */
/*  detectChangeType                                                   */
/* ------------------------------------------------------------------ */

/**
 * Detect the change type from a diff summary and raw content.
 * Scans both text inputs against keyword patterns, returning
 * the highest-confidence match. Falls back to 'informational'.
 */
export function detectChangeType(
  diffSummary: string,
  rawContent: string,
): { type: ChangeType; confidence: number } {
  const combined = `${diffSummary}\n${rawContent}`;

  let bestType: ChangeType = 'informational';
  let bestScore = 0;

  for (const rule of DETECTION_RULES) {
    let matchCount = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(combined)) {
        matchCount += 1;
      }
    }
    if (matchCount > 0) {
      // Score: base weight scaled by proportion of patterns matched
      const score = rule.weight * (matchCount / rule.patterns.length);
      if (score > bestScore) {
        bestScore = score;
        bestType = rule.type;
      }
    }
  }

  // Informational gets a low default confidence
  const confidence = bestType === 'informational' ? 0.4 : Math.min(bestScore + 0.1, 1.0);

  return { type: bestType, confidence };
}

/* ------------------------------------------------------------------ */
/*  assignSeverity                                                     */
/* ------------------------------------------------------------------ */

/** Severity mapping by change type. Security and breaking always P0. */
const SEVERITY_MAP: Record<ChangeType, Severity> = {
  breaking: 'P0',
  security: 'P0',
  deprecation: 'P1',
  enhancement: 'P2',
  optimization: 'P2',
  informational: 'P3',
};

/**
 * Assign severity based on change type and channel config.
 * Security changes always escalate to P0 regardless of channel priority.
 */
export function assignSeverity(changeType: ChangeType, _channel: ChannelConfig): Severity {
  return SEVERITY_MAP[changeType];
}

/* ------------------------------------------------------------------ */
/*  assessPatchability                                                 */
/* ------------------------------------------------------------------ */

/** Non-patchable types require human review */
const NON_PATCHABLE_TYPES: Set<ChangeType> = new Set(['breaking', 'security', 'deprecation']);

/**
 * Determine whether a change can be auto-patched.
 * Breaking, security, and deprecation changes are never auto-patchable.
 * High-severity (P0/P1) changes are also not auto-patchable.
 */
export function assessPatchability(changeType: ChangeType, severity: Severity): boolean {
  if (NON_PATCHABLE_TYPES.has(changeType)) {
    return false;
  }
  if (severity === 'P0' || severity === 'P1') {
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  classifyChange                                                     */
/* ------------------------------------------------------------------ */

/**
 * Full classification pipeline: detect type, assign severity,
 * assess patchability, tag domains, and produce summary.
 */
export function classifyChange(
  event: RawChangeEvent,
  channelConfig: ChannelConfig,
): ClassifiedEvent {
  const { type, confidence } = detectChangeType(event.diff_summary, event.raw_content);
  const severity = assignSeverity(type, channelConfig);
  const autoPatchable = assessPatchability(type, severity);

  const summary = buildSummary(type, event.channel, event.diff_summary);

  return {
    ...event,
    change_type: type,
    severity,
    domains: [...channelConfig.domains],
    auto_patchable: autoPatchable,
    summary,
    confidence,
  };
}

/* ------------------------------------------------------------------ */
/*  Summary builder                                                    */
/* ------------------------------------------------------------------ */

function buildSummary(changeType: ChangeType, channel: string, diffSummary: string): string {
  const typeLabel = changeType.charAt(0).toUpperCase() + changeType.slice(1);
  // Truncate diff summary to keep it concise
  const brief = diffSummary.length > 100 ? diffSummary.slice(0, 97) + '...' : diffSummary;
  return `[${typeLabel}] ${channel}: ${brief}`;
}
