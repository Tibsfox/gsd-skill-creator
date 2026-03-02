/**
 * Teach-forward extractor, injector, and chain integrity verifier.
 *
 * Automates the teach-forward pipeline: extract insights from each journal,
 * write them to a file for the next subversion, load them into agent context,
 * and verify the chain has no gaps at checkpoints.
 *
 * Fixes RC-08: teach-forward chain required manual per-executor discipline
 * in v1.50/v1.51, causing chain breaks when humans forgot.
 *
 * All I/O is injectable via callbacks for testability.
 *
 * @module autonomy/teach-forward
 */

import type { TeachForwardEntry } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of insights to extract per teach-forward entry */
const MAX_INSIGHTS = 5;

// ============================================================================
// Types
// ============================================================================

/** Result of verifying teach-forward chain integrity */
export interface ChainVerificationResult {
  /** Whether the chain is complete (no gaps) */
  complete: boolean;
  /** Total subversions checked in range */
  total: number;
  /** Number of teach-forward files found */
  found: number;
  /** Subversion numbers where teach-forward files are missing */
  gaps: number[];
}

/** Injectable I/O for write operations */
export interface WriteIO {
  writeFile: (path: string, content: string) => Promise<void>;
}

/** Injectable I/O for read operations */
export interface ReadIO {
  readFile: (path: string) => Promise<string>;
}

/** Injectable I/O for existence checks */
export interface ExistsIO {
  fileExists: (path: string) => Promise<boolean>;
}

/** Full I/O for pipeline operations */
export interface FullIO extends WriteIO, ReadIO {}

// ============================================================================
// extractSection
// ============================================================================

/**
 * Extract content between a ## heading and the next ## heading (or EOF).
 *
 * Case-insensitive heading match. Returns empty string if heading not found.
 */
export function extractSection(content: string, heading: string): string {
  if (!content) return '';

  const headingLower = heading.toLowerCase();
  const lines = content.split('\n');
  let capturing = false;
  let startIndex = -1;
  let endIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^##\s+/) && line.replace(/^##\s+/, '').trim().toLowerCase() === headingLower) {
      capturing = true;
      startIndex = i + 1;
      continue;
    }
    if (capturing && line.match(/^##\s+/)) {
      endIndex = i;
      break;
    }
  }

  if (startIndex === -1) return '';

  return lines.slice(startIndex, endIndex).join('\n').trim();
}

// ============================================================================
// parseBulletPoints
// ============================================================================

/**
 * Parse bullet point lines from text.
 *
 * Matches lines starting with "- " or "* " (with optional leading whitespace).
 * Strips markers, trims, and filters empty results.
 */
export function parseBulletPoints(text: string): string[] {
  if (!text) return [];

  return text
    .split('\n')
    .filter(line => /^\s*[-*]\s+/.test(line))
    .map(line => line.replace(/^\s*[-*]\s+/, '').trim())
    .filter(point => point.length > 0);
}

// ============================================================================
// extractTeachForward
// ============================================================================

/**
 * Extract teach-forward insights from journal content.
 *
 * Prefers structured ## Teach-Forward section. Falls back to last 5
 * bullet points from entire journal. Returns max 5 insights.
 */
export function extractTeachForward(journalContent: string): string[] {
  if (!journalContent) return [];

  // Try structured extraction first
  const section = extractSection(journalContent, 'Teach-Forward');
  if (section) {
    const bullets = parseBulletPoints(section);
    return bullets.slice(0, MAX_INSIGHTS);
  }

  // Fallback: last 5 bullet points from entire journal
  const allBullets = parseBulletPoints(journalContent);
  if (allBullets.length === 0) return [];

  return allBullets.slice(-MAX_INSIGHTS);
}

// ============================================================================
// writeTeachForward
// ============================================================================

/**
 * Write a teach-forward file for the next subversion.
 *
 * Creates a markdown file with YAML frontmatter containing structured
 * TeachForwardEntry data and a human-readable bullet list below.
 *
 * File is written to {teachForwardDir}/{toSubversion}.md
 */
export async function writeTeachForward(
  teachForwardDir: string,
  fromSubversion: number,
  insights: string[],
  io: WriteIO,
): Promise<TeachForwardEntry> {
  const toSubversion = fromSubversion + 1;
  const extractedAt = new Date().toISOString();

  const entry: TeachForwardEntry = {
    from_subversion: fromSubversion,
    to_subversion: toSubversion,
    insights,
    extracted_at: extractedAt,
  };

  const bulletList = insights.map(i => `- ${i}`).join('\n');
  const content = [
    '---',
    `from_subversion: ${fromSubversion}`,
    `to_subversion: ${toSubversion}`,
    `extracted_at: "${extractedAt}"`,
    '---',
    '',
    bulletList,
    '',
  ].join('\n');

  const filePath = `${teachForwardDir}${toSubversion}.md`;
  await io.writeFile(filePath, content);

  return entry;
}

// ============================================================================
// loadTeachForward
// ============================================================================

/**
 * Load a teach-forward file and format it for context injection.
 *
 * Returns formatted context block if file exists, empty string if not.
 */
export async function loadTeachForward(
  teachForwardDir: string,
  subversion: number,
  io: ReadIO,
): Promise<string> {
  const filePath = `${teachForwardDir}${subversion}.md`;

  try {
    const content = await io.readFile(filePath);

    // Extract bullet points from the content (after frontmatter)
    const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
    const body = bodyMatch ? bodyMatch[1].trim() : content.trim();
    const bullets = parseBulletPoints(body);

    if (bullets.length === 0) return '';

    const bulletList = bullets.map(b => `- ${b}`).join('\n');
    return `## Context from Prior Subversion\n\n${bulletList}\n\n---`;
  } catch {
    return '';
  }
}

// ============================================================================
// Phase-level teach-forward types
// ============================================================================

/** Result of writing a phase-level teach-forward file */
export interface PhaseTeachForwardResult {
  from_phase: number;
  to_phase: number;
  insights: string[];
  extracted_at: string;
}

// ============================================================================
// extractPhaseTeachForward
// ============================================================================

/**
 * Extract teach-forward insights from a phase SUMMARY.md document.
 *
 * Tries sections in priority order: 'Key Findings', 'Accomplishments',
 * 'What Was Built'. On first match with >0 bullets, returns up to 5.
 * Falls back to last 5 bullet points from entire document.
 */
export function extractPhaseTeachForward(summaryContent: string): string[] {
  if (!summaryContent) return [];

  const prioritySections = ['Key Findings', 'Accomplishments', 'What Was Built'];

  for (const heading of prioritySections) {
    const section = extractSection(summaryContent, heading);
    if (section) {
      const bullets = parseBulletPoints(section);
      if (bullets.length > 0) {
        return bullets.slice(0, MAX_INSIGHTS);
      }
    }
  }

  // Fallback: last 5 bullet points from entire document
  const allBullets = parseBulletPoints(summaryContent);
  if (allBullets.length === 0) return [];

  return allBullets.slice(-MAX_INSIGHTS);
}

// ============================================================================
// writePhaseTeachForward
// ============================================================================

/**
 * Write a phase-level teach-forward file for the next phase.
 *
 * Creates {phasesDir}/{toPhase}-TEACH-FORWARD.md with YAML frontmatter
 * containing from_phase, to_phase, extracted_at, and a bullet list of insights.
 *
 * File is written to phasesDir root (not inside a phase subdirectory)
 * because the next phase directory may not exist yet.
 */
export async function writePhaseTeachForward(
  phasesDir: string,
  fromPhase: number,
  insights: string[],
  io: WriteIO,
): Promise<PhaseTeachForwardResult> {
  const toPhase = fromPhase + 1;
  const extractedAt = new Date().toISOString();

  const result: PhaseTeachForwardResult = {
    from_phase: fromPhase,
    to_phase: toPhase,
    insights,
    extracted_at: extractedAt,
  };

  const bulletList = insights.map(i => `- ${i}`).join('\n');
  const content = [
    '---',
    `from_phase: ${fromPhase}`,
    `to_phase: ${toPhase}`,
    `extracted_at: "${extractedAt}"`,
    '---',
    '',
    bulletList,
    '',
  ].join('\n');

  const filePath = `${phasesDir}/${toPhase}-TEACH-FORWARD.md`;
  await io.writeFile(filePath, content);

  return result;
}

// ============================================================================
// loadPhaseTeachForward
// ============================================================================

/**
 * Load a phase-level teach-forward file and format it for context injection.
 *
 * Reads {phasesDir}/{phaseNum}-TEACH-FORWARD.md, extracts bullets after
 * frontmatter, and returns a formatted context block with
 * "## Context from Prior Phase" heading. Returns empty string on error.
 */
export async function loadPhaseTeachForward(
  phasesDir: string,
  phaseNum: number,
  io: ReadIO,
): Promise<string> {
  const filePath = `${phasesDir}/${phaseNum}-TEACH-FORWARD.md`;

  try {
    const content = await io.readFile(filePath);

    // Extract bullet points from the content (after frontmatter)
    const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
    const body = bodyMatch ? bodyMatch[1].trim() : content.trim();
    const bullets = parseBulletPoints(body);

    if (bullets.length === 0) return '';

    const bulletList = bullets.map(b => `- ${b}`).join('\n');
    return `## Context from Prior Phase\n\n${bulletList}\n\n---`;
  } catch {
    return '';
  }
}

// ============================================================================
// verifyTeachForwardChain
// ============================================================================

/**
 * Verify teach-forward chain integrity across a subversion range.
 *
 * Checks that each subversion N in range [from+1, to] has a teach-forward file.
 * Returns structured result with gap list and completeness flag.
 */
export async function verifyTeachForwardChain(
  teachForwardDir: string,
  fromSubversion: number,
  toSubversion: number,
  io: ExistsIO,
): Promise<ChainVerificationResult> {
  const total = toSubversion - fromSubversion;
  if (total <= 0) {
    return { complete: true, total: 0, found: 0, gaps: [] };
  }

  const gaps: number[] = [];
  let found = 0;

  for (let sub = fromSubversion + 1; sub <= toSubversion; sub++) {
    const filePath = `${teachForwardDir}${sub}.md`;
    const exists = await io.fileExists(filePath);
    if (exists) {
      found++;
    } else {
      gaps.push(sub);
    }
  }

  return {
    complete: gaps.length === 0,
    total,
    found,
    gaps,
  };
}

// ============================================================================
// processJournal
// ============================================================================

/**
 * Process a journal file through the full teach-forward pipeline.
 *
 * Reads journal content, extracts insights, writes teach-forward file
 * for the next subversion, and returns the TeachForwardEntry.
 */
export async function processJournal(
  journalPath: string,
  teachForwardDir: string,
  subversion: number,
  io: FullIO,
): Promise<TeachForwardEntry> {
  const journalContent = await io.readFile(journalPath);
  const insights = extractTeachForward(journalContent);
  return writeTeachForward(teachForwardDir, subversion, insights, io);
}
