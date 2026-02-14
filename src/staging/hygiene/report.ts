/**
 * Trust-filtered hygiene report generator.
 *
 * Combines pattern scan findings and scope coherence results into a
 * structured report. Filters findings by familiarity tier: Home and
 * Neighborhood content passes silently, while Town and Stranger content
 * gets findings surfaced with actionable suggestions.
 *
 * @module staging/hygiene/report
 */

import type { HygieneFinding, HygieneCategory } from './types.js';
import type { CoherenceResult, CoherenceFinding } from './scope-coherence.js';
import type { FamiliarityTier } from './trust-types.js';
import { CRITICAL_PATTERN_IDS } from './trust-types.js';
import type { HygieneSeverity } from './types.js';

/** Importance level for report findings. */
export type ImportanceLevel = 'critical' | 'warning' | 'notice' | 'info';

/** A single finding in the hygiene report with actionable context. */
export interface ReportFinding {
  /** Original finding from pattern scan or coherence check. */
  source: 'pattern' | 'coherence';
  /** Pattern ID (for pattern findings) or tool name (for coherence findings). */
  id: string;
  /** Importance level derived from severity. */
  importance: ImportanceLevel;
  /** Human-readable title. */
  title: string;
  /** Detailed description of what was found. */
  description: string;
  /** Actionable suggestion for the user. */
  suggestion: string;
  /** Whether this is a critical pattern that can never be auto-approved (HYGIENE-11). */
  isCritical: boolean;
  /** Line number if available. */
  line?: number;
  /** Matched text if available. */
  match?: string;
}

/** The complete structured hygiene report. */
export interface HygieneReport {
  /** Familiarity tier of the scanned content. */
  tier: FamiliarityTier;
  /** Whether findings were filtered (true for Home/Neighborhood). */
  filtered: boolean;
  /** Total findings before filtering. */
  totalFindings: number;
  /** Findings surfaced to the user (empty if filtered). */
  findings: ReportFinding[];
  /** Summary counts by importance level. */
  summary: Record<ImportanceLevel, number>;
  /** Overall risk assessment. */
  overallRisk: ImportanceLevel | 'clean';
  /** Timestamp of report generation (ISO 8601). */
  generatedAt: string;
}

/** Options for generating a hygiene report. */
export interface ReportOptions {
  /** Pattern scan findings. */
  findings: HygieneFinding[];
  /** Optional scope coherence result. */
  coherence?: CoherenceResult;
  /** Familiarity tier of the scanned content. */
  tier: FamiliarityTier;
}

/** Tiers where findings are filtered (pass silently). */
const FILTERED_TIERS: ReadonlySet<FamiliarityTier> = new Set(['home', 'neighborhood']);

/** Category-specific suggestions. */
const CATEGORY_SUGGESTIONS: Record<HygieneCategory, string> = {
  'embedded-instructions': 'Review content for prompt injection attempts',
  'hidden-content': 'Inspect for obfuscated or hidden text',
  'config-safety': 'Verify configuration values are safe',
};

/** Importance levels ordered from highest to lowest. */
const IMPORTANCE_ORDER: ImportanceLevel[] = ['critical', 'warning', 'notice', 'info'];

/**
 * Map a hygiene severity to an importance level.
 *
 * - critical -> critical
 * - high -> warning
 * - medium -> notice
 * - low, info -> info
 */
function mapSeverityToImportance(severity: HygieneSeverity): ImportanceLevel {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'warning';
    case 'medium':
      return 'notice';
    case 'low':
    case 'info':
      return 'info';
  }
}

/**
 * Convert a HygieneFinding to a ReportFinding.
 */
function convertPatternFinding(finding: HygieneFinding): ReportFinding {
  const importance = mapSeverityToImportance(finding.severity);
  const isCritical = CRITICAL_PATTERN_IDS.has(finding.patternId);
  const suggestion = CATEGORY_SUGGESTIONS[finding.category];

  return {
    source: 'pattern',
    id: finding.patternId,
    importance,
    title: finding.message,
    description: `Pattern "${finding.patternId}" (${finding.category}): ${finding.message}`,
    suggestion,
    isCritical,
    line: finding.line,
    match: finding.match,
  };
}

/**
 * Convert a CoherenceFinding to a ReportFinding.
 */
function convertCoherenceFinding(finding: CoherenceFinding): ReportFinding {
  const importance = mapSeverityToImportance(finding.severity);

  return {
    source: 'coherence',
    id: finding.tool,
    importance,
    title: `Scope incoherence: ${finding.tool}`,
    description: finding.reason,
    suggestion: `Review whether tool "${finding.tool}" is necessary for the declared purpose`,
    isCritical: false,
  };
}

/**
 * Compute summary counts from surfaced findings.
 */
function computeSummary(findings: ReportFinding[]): Record<ImportanceLevel, number> {
  const summary: Record<ImportanceLevel, number> = {
    critical: 0,
    warning: 0,
    notice: 0,
    info: 0,
  };

  for (const finding of findings) {
    summary[finding.importance]++;
  }

  return summary;
}

/**
 * Determine the highest importance among surfaced findings.
 */
function computeOverallRisk(findings: ReportFinding[]): ImportanceLevel | 'clean' {
  if (findings.length === 0) {
    return 'clean';
  }

  for (const level of IMPORTANCE_ORDER) {
    if (findings.some((f) => f.importance === level)) {
      return level;
    }
  }

  return 'clean';
}

/**
 * Generate a structured hygiene report with trust-based filtering.
 *
 * Converts pattern scan findings and optional coherence results into
 * a unified report. Findings are filtered based on the familiarity
 * tier: Home and Neighborhood tiers pass silently (filtered=true,
 * empty findings array), while Town and Stranger tiers surface all
 * findings.
 *
 * @param options - Report generation options
 * @returns Structured hygiene report
 */
export function generateHygieneReport(options: ReportOptions): HygieneReport {
  const { findings, coherence, tier } = options;

  // Step 1: Convert pattern findings to report findings
  const reportFindings: ReportFinding[] = findings.map(convertPatternFinding);

  // Step 2: Convert coherence findings if provided
  if (coherence && coherence.findings.length > 0) {
    for (const cf of coherence.findings) {
      reportFindings.push(convertCoherenceFinding(cf));
    }
  }

  const totalFindings = reportFindings.length;

  // Step 3: Trust-based filtering
  const isFiltered = FILTERED_TIERS.has(tier);
  const surfacedFindings = isFiltered ? [] : reportFindings;

  // Step 4: Compute summary from surfaced findings only
  const summary = computeSummary(surfacedFindings);

  // Step 5: Compute overall risk from surfaced findings
  const overallRisk = computeOverallRisk(surfacedFindings);

  return {
    tier,
    filtered: isFiltered,
    totalFindings,
    findings: surfacedFindings,
    summary,
    overallRisk,
    generatedAt: new Date().toISOString(),
  };
}
