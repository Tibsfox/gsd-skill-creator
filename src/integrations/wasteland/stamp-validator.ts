/**
 * Stamp Validator — Automated Completion Validation Pipeline
 *
 * Analyzes unvalidated completions against their wanted item requirements
 * and generates stamp recommendations with evidence-based scoring.
 *
 * Pipeline: Parse Evidence -> Score Valence -> Classify Severity -> Generate Stamp
 *
 * Follows MVR Protocol Spec v0.1 Section 6.5 (Validate operation).
 * Valence uses spec-canonical 1-5 scale for quality, reliability, creativity.
 * Confidence reflects evidence specificity (0.0-1.0).
 * Severity maps from effort level and evidence depth.
 */

import { randomBytes } from 'node:crypto';

// ============================================================================
// Types
// ============================================================================

/** Wanted item as returned from DoltHub API */
export interface WantedItem {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  effort_level: string | null;
  tags: string | null; // JSON string array
  posted_by: string | null;
  status: string | null;
}

/** Completion record from DoltHub API */
export interface CompletionRecord {
  id: string;
  wanted_id: string;
  completed_by: string;
  evidence: string | null;
  completed_at: string | null;
}

/** Parsed evidence signals extracted from evidence text */
export interface EvidenceSignals {
  hasFileReference: boolean;
  hasLineCount: boolean;
  hasPRLink: boolean;
  hasCommitHash: boolean;
  hasURL: boolean;
  hasDescription: boolean;
  fileCount: number;
  lineCount: number;
  descriptionLength: number;
  specificArtifacts: string[];
  tags: string[];
}

/** Valence scores following MVR spec (1-5 scale) */
export interface Valence {
  quality: number;
  reliability: number;
  creativity: number;
}

/** Stamp recommendation produced by the pipeline */
export interface StampRecommendation {
  id: string;
  author: string;
  subject: string;
  valence: Valence;
  confidence: number;
  severity: 'leaf' | 'branch' | 'root';
  context_id: string;
  context_type: 'completion';
  skill_tags: string[];
  message: string;
  prev_stamp_hash: string | null;
  completionId: string;
  wantedId: string;
  wantedTitle: string;
}

/** Validation pipeline configuration */
export interface ValidatorConfig {
  validatorHandle: string;
  minConfidenceThreshold: number;
  dryRun: boolean;
}

/** Result of running the full pipeline */
export interface ValidationResult {
  stamps: StampRecommendation[];
  skipped: Array<{ completionId: string; reason: string }>;
  errors: Array<{ completionId: string; error: string }>;
}

// ============================================================================
// Evidence Parser
// ============================================================================

const FILE_REFERENCE_PATTERN = /(?:^|\s)([\w/.-]+\.\w{1,6})(?:\s|$|—|\u2014)/gm;
const LINE_COUNT_PATTERN = /(\d+)[- ]line/gi;
const PR_LINK_PATTERN = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/gi;
const COMMIT_HASH_PATTERN = /\b[0-9a-f]{7,40}\b/g;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

/**
 * Parse evidence text into structured signals.
 * Extracts file references, line counts, PR links, commit hashes,
 * URLs, and measures description quality.
 */
export function parseEvidence(evidence: string | null): EvidenceSignals {
  if (!evidence || evidence.trim().length === 0) {
    return {
      hasFileReference: false,
      hasLineCount: false,
      hasPRLink: false,
      hasCommitHash: false,
      hasURL: false,
      hasDescription: false,
      fileCount: 0,
      lineCount: 0,
      descriptionLength: 0,
      specificArtifacts: [],
      tags: [],
    };
  }

  const text = evidence.trim();
  const files = [...text.matchAll(FILE_REFERENCE_PATTERN)].map(m => m[1]);
  const lineMatches = [...text.matchAll(LINE_COUNT_PATTERN)];
  const totalLines = lineMatches.reduce((sum, m) => sum + parseInt(m[1], 10), 0);
  const prLinks = text.match(PR_LINK_PATTERN) ?? [];
  const commitHashes = text.match(COMMIT_HASH_PATTERN) ?? [];
  const urls = text.match(URL_PATTERN) ?? [];

  // Description quality: text beyond file refs and URLs
  const descriptionText = text
    .replace(FILE_REFERENCE_PATTERN, '')
    .replace(URL_PATTERN, '')
    .replace(LINE_COUNT_PATTERN, '')
    .trim();

  const artifacts = [
    ...files,
    ...prLinks,
    ...commitHashes.filter(h => h.length >= 8),
  ];

  return {
    hasFileReference: files.length > 0,
    hasLineCount: lineMatches.length > 0,
    hasPRLink: prLinks.length > 0,
    hasCommitHash: commitHashes.filter(h => h.length >= 8).length > 0,
    hasURL: urls.length > 0,
    hasDescription: descriptionText.length > 20,
    fileCount: files.length,
    lineCount: totalLines,
    descriptionLength: descriptionText.length,
    specificArtifacts: artifacts,
    tags: [],
  };
}

// ============================================================================
// Valence Scorer
// ============================================================================

/**
 * Score quality (1-5) based on evidence depth and effort match.
 *
 * Heuristics:
 * - File references with line counts = strong evidence
 * - PR links = verifiable artifact
 * - High line count relative to effort = thorough work
 * - Vague descriptions = lower quality signal
 */
export function scoreQuality(signals: EvidenceSignals, effortLevel: string | null): number {
  let score = 3.0; // baseline: meets expectations

  // File references with specifics
  if (signals.hasFileReference && signals.hasLineCount) {
    score += 0.8;
  } else if (signals.hasFileReference) {
    score += 0.4;
  }

  // PR links are verifiable
  if (signals.hasPRLink) {
    score += 0.5;
  }

  // Line count relative to effort
  const effort = effortLevel ?? 'medium';
  const expectedLines: Record<string, number> = {
    trivial: 30,
    small: 100,
    medium: 300,
    large: 600,
    epic: 1000,
  };
  const expected = expectedLines[effort] ?? 300;

  if (signals.lineCount > 0) {
    const ratio = signals.lineCount / expected;
    if (ratio >= 1.5) score += 0.5;
    else if (ratio >= 0.8) score += 0.3;
    else if (ratio < 0.3) score -= 0.5;
  }

  // Rich description adds signal
  if (signals.descriptionLength > 100) {
    score += 0.3;
  } else if (signals.descriptionLength < 20) {
    score -= 0.5;
  }

  return clamp(Math.round(score * 2) / 2, 1, 5); // round to nearest 0.5
}

/**
 * Score reliability (1-5) based on evidence completeness and specificity.
 *
 * Reliability reflects: did the work actually address the wanted item?
 * High specificity (file paths, line counts, PR links) = high reliability signal.
 */
export function scoreReliability(signals: EvidenceSignals): number {
  let score = 3.0;

  // Specific artifacts increase reliability
  const artifactCount = signals.specificArtifacts.length;
  if (artifactCount >= 3) score += 1.0;
  else if (artifactCount >= 1) score += 0.5;

  // Verifiable links
  if (signals.hasPRLink || signals.hasCommitHash) {
    score += 0.5;
  }

  // Has both file refs and descriptions (cross-referenced)
  if (signals.hasFileReference && signals.hasDescription) {
    score += 0.3;
  }

  // Very short evidence = low reliability signal
  if (signals.descriptionLength < 10 && !signals.hasFileReference && !signals.hasPRLink) {
    score -= 1.0;
  }

  return clamp(Math.round(score * 2) / 2, 1, 5);
}

/**
 * Score creativity (1-5) based on evidence of novel approaches.
 *
 * Creativity signals: multiple file types, high description richness,
 * evidence of design work (for design/research types).
 */
export function scoreCreativity(
  signals: EvidenceSignals,
  wantedType: string | null,
): number {
  let score = 3.0;

  // Design and research work tends to be more creative
  if (wantedType === 'design' || wantedType === 'research') {
    score += 0.5;
  }

  // Rich descriptions suggest thoughtful work
  if (signals.descriptionLength > 150) {
    score += 0.5;
  }

  // Multiple files suggest breadth
  if (signals.fileCount >= 3) {
    score += 0.3;
  }

  // Very high line counts for non-trivial work suggest depth
  if (signals.lineCount > 500) {
    score += 0.3;
  }

  // Community work is inherently creative
  if (wantedType === 'community') {
    score += 0.3;
  }

  return clamp(Math.round(score * 2) / 2, 1, 5);
}

/**
 * Compute full valence from evidence signals and wanted item context.
 */
export function computeValence(
  signals: EvidenceSignals,
  effortLevel: string | null,
  wantedType: string | null,
): Valence {
  return {
    quality: scoreQuality(signals, effortLevel),
    reliability: scoreReliability(signals),
    creativity: scoreCreativity(signals, wantedType),
  };
}

// ============================================================================
// Confidence Scorer
// ============================================================================

/**
 * Compute confidence (0.0-1.0) in the automated stamp.
 *
 * Confidence reflects how much the pipeline trusts its own assessment.
 * High confidence: many verifiable signals. Low confidence: vague evidence.
 */
export function computeConfidence(signals: EvidenceSignals): number {
  let confidence = 0.5; // baseline for any non-empty evidence

  // Verifiable artifacts boost confidence
  if (signals.hasPRLink) confidence += 0.15;
  if (signals.hasCommitHash) confidence += 0.1;
  if (signals.hasFileReference) confidence += 0.1;
  if (signals.hasLineCount) confidence += 0.05;

  // Rich description cross-referenced with artifacts
  if (signals.hasDescription && signals.hasFileReference) {
    confidence += 0.1;
  }

  // Very thin evidence caps confidence
  if (!signals.hasFileReference && !signals.hasPRLink && !signals.hasCommitHash) {
    confidence = Math.min(confidence, 0.4);
  }

  // No description at all
  if (signals.descriptionLength === 0) {
    confidence -= 0.15;
  }

  return clamp(Math.round(confidence * 100) / 100, 0.1, 0.95);
}

// ============================================================================
// Severity Classifier
// ============================================================================

/**
 * Classify stamp severity based on effort level and evidence depth.
 *
 * - leaf: routine work (trivial/small effort, or thin evidence for any effort)
 * - branch: significant contribution (medium/large effort with solid evidence)
 * - root: foundational work (epic effort or large with exceptional evidence)
 */
export function classifySeverity(
  effortLevel: string | null,
  signals: EvidenceSignals,
): 'leaf' | 'branch' | 'root' {
  const effort = effortLevel ?? 'medium';
  const hasStrongEvidence = signals.lineCount > 300 || signals.specificArtifacts.length >= 3;

  if (effort === 'epic' && hasStrongEvidence) return 'root';
  if (effort === 'large' && signals.lineCount > 800) return 'root';
  if ((effort === 'medium' || effort === 'large') && hasStrongEvidence) return 'branch';
  if (effort === 'trivial' || effort === 'small') return 'leaf';

  return 'branch';
}

// ============================================================================
// Stamp Generator
// ============================================================================

/** Generate a random stamp ID following MVR convention */
export function generateStampId(): string {
  return `s-${randomBytes(5).toString('hex')}`;
}

/**
 * Generate a human-readable stamp message summarizing the validation.
 */
export function generateMessage(
  wantedTitle: string,
  signals: EvidenceSignals,
  valence: Valence,
): string {
  const avgScore = (valence.quality + valence.reliability + valence.creativity) / 3;

  let qualifier: string;
  if (avgScore >= 4.5) qualifier = 'Exceptional';
  else if (avgScore >= 4.0) qualifier = 'Strong';
  else if (avgScore >= 3.5) qualifier = 'Solid';
  else if (avgScore >= 3.0) qualifier = 'Adequate';
  else qualifier = 'Partial';

  const artifacts: string[] = [];
  if (signals.lineCount > 0) artifacts.push(`${signals.lineCount} lines`);
  if (signals.fileCount > 0) artifacts.push(`${signals.fileCount} file${signals.fileCount > 1 ? 's' : ''}`);
  if (signals.hasPRLink) artifacts.push('PR linked');

  const detail = artifacts.length > 0 ? ` (${artifacts.join(', ')})` : '';
  return `${qualifier} completion: ${wantedTitle}${detail}`;
}

/**
 * Parse tags from a JSON string or return empty array.
 */
export function parseTags(tagsJson: string | null): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Build a stamp recommendation from a completion and its wanted item.
 */
export function buildStamp(
  completion: CompletionRecord,
  wanted: WantedItem,
  validatorHandle: string,
  prevStampHash: string | null,
): StampRecommendation {
  const signals = parseEvidence(completion.evidence);
  const valence = computeValence(signals, wanted.effort_level, wanted.type);
  const confidence = computeConfidence(signals);
  const severity = classifySeverity(wanted.effort_level, signals);
  const skillTags = parseTags(wanted.tags);
  const message = generateMessage(wanted.title, signals, valence);

  return {
    id: generateStampId(),
    author: validatorHandle,
    subject: completion.completed_by,
    valence,
    confidence,
    severity,
    context_id: completion.id,
    context_type: 'completion',
    skill_tags: skillTags,
    message,
    prev_stamp_hash: prevStampHash,
    completionId: completion.id,
    wantedId: wanted.id,
    wantedTitle: wanted.title,
  };
}

// ============================================================================
// SQL Generator
// ============================================================================

/** Escape a string for SQL single-quote context */
function sqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Generate the SQL statements for a stamp validation.
 * Returns INSERT for stamp, UPDATE for completion, UPDATE for wanted.
 */
export function toSQL(stamp: StampRecommendation): string {
  const valenceJson = JSON.stringify(stamp.valence);
  const skillTagsJson = JSON.stringify(stamp.skill_tags);
  const prevHash = stamp.prev_stamp_hash ? `'${sqlEscape(stamp.prev_stamp_hash)}'` : 'NULL';

  const lines = [
    `-- Validate: ${stamp.completionId} for ${stamp.wantedId}`,
    `INSERT INTO stamps (id, author, subject, valence, confidence, severity, context_id, context_type, skill_tags, message, prev_stamp_hash, created_at)`,
    `VALUES ('${sqlEscape(stamp.id)}', '${sqlEscape(stamp.author)}', '${sqlEscape(stamp.subject)}', '${sqlEscape(valenceJson)}', ${stamp.confidence}, '${stamp.severity}', '${sqlEscape(stamp.context_id)}', '${stamp.context_type}', '${sqlEscape(skillTagsJson)}', '${sqlEscape(stamp.message)}', ${prevHash}, NOW());`,
    ``,
    `UPDATE completions SET validated_by = '${sqlEscape(stamp.author)}', stamp_id = '${sqlEscape(stamp.id)}', validated_at = NOW()`,
    `WHERE id = '${sqlEscape(stamp.completionId)}';`,
    ``,
    `UPDATE wanted SET status = 'completed', updated_at = NOW()`,
    `WHERE id = '${sqlEscape(stamp.wantedId)}';`,
  ];

  return lines.join('\n');
}

/**
 * Generate a full SQL script for all stamps in a validation result.
 */
export function toSQLScript(result: ValidationResult): string {
  const header = [
    '-- Stamp Validation Pipeline Output',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Stamps: ${result.stamps.length}`,
    `-- Skipped: ${result.skipped.length}`,
    '',
  ];

  const body = result.stamps.map(s => toSQL(s));
  return [...header, ...body].join('\n\n');
}

// ============================================================================
// Pipeline
// ============================================================================

/** Data provider interface for testability (no direct API dependency) */
export interface ValidationDataProvider {
  getUnvalidatedCompletions(): Promise<Array<CompletionRecord & { wanted: WantedItem }>>;
  getLastStampHash(subjectHandle: string): Promise<string | null>;
}

/**
 * Run the full validation pipeline.
 *
 * 1. Fetch unvalidated completions
 * 2. For each: parse evidence, score valence, classify severity
 * 3. Check Yearbook Rule (validator != subject)
 * 4. Build stamp recommendations
 * 5. Return stamps + skipped + errors
 */
export async function validate(
  provider: ValidationDataProvider,
  config: ValidatorConfig,
): Promise<ValidationResult> {
  const stamps: StampRecommendation[] = [];
  const skipped: Array<{ completionId: string; reason: string }> = [];
  const errors: Array<{ completionId: string; error: string }> = [];

  let completions: Array<CompletionRecord & { wanted: WantedItem }>;
  try {
    completions = await provider.getUnvalidatedCompletions();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { stamps: [], skipped: [], errors: [{ completionId: '*', error: `Fetch failed: ${msg}` }] };
  }

  for (const item of completions) {
    try {
      // Yearbook Rule: validator cannot stamp own work
      if (item.completed_by === config.validatorHandle) {
        skipped.push({
          completionId: item.id,
          reason: `Yearbook Rule: validator (${config.validatorHandle}) cannot stamp own work`,
        });
        continue;
      }

      // Empty evidence
      if (!item.evidence || item.evidence.trim().length === 0) {
        skipped.push({
          completionId: item.id,
          reason: 'No evidence provided',
        });
        continue;
      }

      // Get passbook chain link
      const prevHash = await provider.getLastStampHash(item.completed_by);

      // Build stamp
      const stamp = buildStamp(item, item.wanted, config.validatorHandle, prevHash);

      // Confidence threshold check
      if (stamp.confidence < config.minConfidenceThreshold) {
        skipped.push({
          completionId: item.id,
          reason: `Confidence ${stamp.confidence} below threshold ${config.minConfidenceThreshold}`,
        });
        continue;
      }

      stamps.push(stamp);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ completionId: item.id, error: msg });
    }
  }

  return { stamps, skipped, errors };
}

// ============================================================================
// DoltHub API Provider
// ============================================================================

/**
 * Create a ValidationDataProvider backed by DoltHub's REST API.
 */
export function createDoltHubProvider(
  owner: string,
  repo: string,
  branch: string = 'main',
): ValidationDataProvider {
  const baseUrl = `https://www.dolthub.com/api/v1alpha1/${owner}/${repo}/${branch}`;

  async function query(sql: string): Promise<{ rows: Record<string, string>[] }> {
    const url = `${baseUrl}?q=${encodeURIComponent(sql)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`DoltHub API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as { query_execution_status: string; rows: Record<string, string>[] };
    if (data.query_execution_status !== 'Success') {
      throw new Error(`DoltHub query failed: ${data.query_execution_status}`);
    }
    return { rows: data.rows ?? [] };
  }

  return {
    async getUnvalidatedCompletions() {
      const sql = `
        SELECT c.id, c.wanted_id, c.completed_by, c.evidence, c.completed_at,
               w.id as w_id, w.title as w_title, w.description as w_description,
               w.type as w_type, w.effort_level as w_effort_level, w.tags as w_tags,
               w.posted_by as w_posted_by, w.status as w_status
        FROM completions c
        JOIN wanted w ON c.wanted_id = w.id
        WHERE c.validated_by IS NULL
        ORDER BY c.completed_at ASC
      `;
      const result = await query(sql);
      return result.rows.map(row => ({
        id: row.id,
        wanted_id: row.wanted_id,
        completed_by: row.completed_by,
        evidence: row.evidence,
        completed_at: row.completed_at,
        wanted: {
          id: row.w_id,
          title: row.w_title,
          description: row.w_description,
          type: row.w_type,
          effort_level: row.w_effort_level,
          tags: row.w_tags,
          posted_by: row.w_posted_by,
          status: row.w_status,
        },
      }));
    },

    async getLastStampHash(subjectHandle: string) {
      const sql = `
        SELECT block_hash FROM stamps
        WHERE subject = '${subjectHandle.replace(/'/g, "''")}'
        ORDER BY created_at DESC LIMIT 1
      `;
      const result = await query(sql);
      if (result.rows.length === 0) return null;
      return result.rows[0].block_hash || null;
    },
  };
}

// ============================================================================
// Utilities
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
