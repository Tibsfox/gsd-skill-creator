/**
 * Plan-vs-Summary differ for completed GSD phases.
 *
 * Parses PLAN.md and SUMMARY.md files and computes a structural
 * diff that identifies scope changes, emergent work, and dropped
 * requirements. This is the core of MON-01.
 *
 * @module integration/monitoring/plan-summary-differ
 */

import type { PlanSummaryDiff, ParsedPlan, ParsedSummary } from './types.js';

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Extract YAML frontmatter content from a markdown file.
 * Returns the text between the first and second `---` markers.
 */
function extractFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
}

/**
 * Extract a simple scalar value from a YAML line like `field: value`.
 */
function extractScalar(frontmatter: string, field: string): string {
  const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : '';
}

/**
 * Extract a YAML array from frontmatter. Handles both inline `[a, b]`
 * and multi-line `\n  - a\n  - b` formats.
 */
function extractArray(frontmatter: string, field: string): string[] {
  // Try inline format: field: [a, b, c]
  const inlineMatch = frontmatter.match(new RegExp(`^${field}:\\s*\\[([^\\]]*)]`, 'm'));
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // Try multi-line format: field:\n  - a\n  - b
  const lines = frontmatter.split('\n');
  const fieldIndex = lines.findIndex((l) => new RegExp(`^${field}:`).test(l));
  if (fieldIndex === -1) return [];

  const result: string[] = [];
  for (let i = fieldIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop at next top-level field (no leading whitespace)
    if (/^\S/.test(line)) break;
    // Collect items: "  - value" or "    - value"
    const itemMatch = line.match(/^\s+-\s+(.+)/);
    if (itemMatch) {
      result.push(itemMatch[1].trim());
    }
  }

  return result;
}

/**
 * Extract section content between a heading and the next heading of same
 * or higher level. Returns the raw text block (including bullet lines).
 */
function extractSection(content: string, headingPattern: RegExp): string {
  const lines = content.split('\n');
  let collecting = false;
  let sectionLines: string[] = [];

  for (const line of lines) {
    if (headingPattern.test(line)) {
      collecting = true;
      continue;
    }
    if (collecting) {
      // Stop at next ## heading
      if (/^##\s/.test(line)) break;
      sectionLines.push(line);
    }
  }

  return sectionLines.join('\n').trim();
}

/**
 * Extract bullet items from a section of text.
 * Returns array of trimmed bullet text (without the leading `- `).
 */
function extractBullets(text: string): string[] {
  const lines = text.split('\n');
  return lines
    .filter((l) => /^\s*-\s+/.test(l))
    .map((l) => l.replace(/^\s*-\s+/, '').trim());
}

/**
 * Extract file paths from bullet lines in a Files section.
 * Handles formats like:
 * - `path/to/file.ts` - Description
 * - path/to/file.ts - Description
 */
function extractFilePaths(text: string): string[] {
  const bullets = extractBullets(text);
  return bullets.map((b) => {
    // Extract backtick-wrapped path
    const backtickMatch = b.match(/`([^`]+)`/);
    if (backtickMatch) return backtickMatch[1];
    // Otherwise take text up to first ` - ` description separator
    const parts = b.split(/\s+-\s+/);
    return parts[0].trim();
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse a PLAN.md file's key fields from its content string.
 *
 * Extracts phase, plan number, files_modified, and must_have
 * artifacts and truths from the YAML frontmatter.
 *
 * @param content - Raw PLAN.md file content
 * @returns Parsed plan data
 */
export function parsePlanContent(content: string): ParsedPlan {
  const fm = extractFrontmatter(content);

  const phase = extractScalar(fm, 'phase');
  const planStr = extractScalar(fm, 'plan');
  const plan = parseInt(planStr, 10) || 0;

  const filesModified = extractArray(fm, 'files_modified');

  // Extract must_have artifacts (nested under must_haves -> artifacts -> path)
  const mustHaveArtifacts: string[] = [];
  const mustHaveTruths: string[] = [];

  // Find the must_haves section in frontmatter
  const fmLines = fm.split('\n');
  let inMustHaves = false;
  let inTruths = false;
  let inArtifacts = false;

  for (let i = 0; i < fmLines.length; i++) {
    const line = fmLines[i];

    if (/^must_haves:/.test(line)) {
      inMustHaves = true;
      continue;
    }

    if (inMustHaves && /^\S/.test(line)) {
      // Hit next top-level field, stop
      inMustHaves = false;
      inTruths = false;
      inArtifacts = false;
      continue;
    }

    if (inMustHaves) {
      if (/^\s+truths:/.test(line)) {
        inTruths = true;
        inArtifacts = false;
        continue;
      }
      if (/^\s+artifacts:/.test(line)) {
        inArtifacts = true;
        inTruths = false;
        continue;
      }

      if (inTruths) {
        // Truths are "    - "quoted text""
        const truthMatch = line.match(/^\s+-\s+"(.+)"$/);
        if (truthMatch) {
          mustHaveTruths.push(truthMatch[1]);
        }
      }

      if (inArtifacts) {
        // Artifact paths are "      path: "value"" or "    - path: "value""
        const pathMatch = line.match(/\bpath:\s*"?([^"]+)"?/);
        if (pathMatch) {
          mustHaveArtifacts.push(pathMatch[1].trim());
        }
      }
    }
  }

  return {
    phase,
    plan,
    files_modified: filesModified,
    must_have_artifacts: mustHaveArtifacts,
    must_have_truths: mustHaveTruths,
  };
}

/**
 * Parse a SUMMARY.md file's key sections from its content string.
 *
 * Extracts files created/modified, accomplishments, and deviations
 * from markdown headings and bullet lists.
 *
 * @param content - Raw SUMMARY.md file content
 * @returns Parsed summary data
 */
export function parseSummaryContent(content: string): ParsedSummary {
  const fm = extractFrontmatter(content);

  const phase = extractScalar(fm, 'phase');
  const planStr = extractScalar(fm, 'plan');
  const plan = parseInt(planStr, 10) || 0;

  // Extract files from "## Files Created/Modified" or similar heading
  const filesSection = extractSection(content, /^##\s+File/i);
  const allFiles = filesSection ? extractFilePaths(filesSection) : [];

  // Separate into created and modified based on content hints
  // For simplicity, treat all as "modified" unless explicitly labeled "Created"
  // The SUMMARY format typically uses "Files Created/Modified" as a combined section
  const filesCreated: string[] = [];
  const filesModified: string[] = [];

  if (filesSection) {
    const lines = filesSection.split('\n').filter((l) => /^\s*-\s+/.test(l));
    for (const line of lines) {
      const backtickMatch = line.match(/`([^`]+)`/);
      const path = backtickMatch ? backtickMatch[1] : line.replace(/^\s*-\s+/, '').split(/\s+-\s+/)[0].trim();

      if (/\b(?:create|new|added)\b/i.test(line)) {
        filesCreated.push(path);
      } else {
        filesModified.push(path);
      }
    }
  }

  // Extract accomplishments
  const accomplishmentsSection = extractSection(content, /^##\s+Accomplishments/i);
  const accomplishments = accomplishmentsSection ? extractBullets(accomplishmentsSection) : [];

  // Extract deviations
  const deviationsSection = extractSection(content, /^##\s+Deviation/i);
  let deviations: string[] = [];

  if (deviationsSection) {
    const trimmed = deviationsSection.trim();
    // Check for "None" variants
    if (/^none\b/i.test(trimmed)) {
      deviations = [];
    } else {
      // Extract deviation descriptions from headings and bullets
      const devLines = trimmed.split('\n');
      for (const line of devLines) {
        // Match "**N. [Rule X - Type] Description**" pattern
        const deviationMatch = line.match(/\*\*\d+\.\s*(.+)\*\*/);
        if (deviationMatch) {
          deviations.push(deviationMatch[1]);
        }
      }
      // If no structured deviations found, collect bullets
      if (deviations.length === 0) {
        deviations = extractBullets(trimmed);
      }
    }
  }

  return {
    phase,
    plan,
    files_created: filesCreated,
    files_modified: filesModified,
    accomplishments,
    deviations,
  };
}

/**
 * Compute a structural diff between a PLAN.md and its SUMMARY.md.
 *
 * Identifies emergent work (items built but not planned), dropped
 * requirements (items planned but not built), explicit deviations,
 * and classifies the overall scope change.
 *
 * @param planContent - Raw PLAN.md file content
 * @param summaryContent - Raw SUMMARY.md file content
 * @returns Structural diff with scope change classification
 */
export function diffPlanVsSummary(
  planContent: string,
  summaryContent: string,
): PlanSummaryDiff {
  const plan = parsePlanContent(planContent);
  const summary = parseSummaryContent(summaryContent);

  const plannedFiles = plan.files_modified;
  const actualFiles = [...new Set([...summary.files_created, ...summary.files_modified])];

  // Emergent work: files in actual but not in planned
  const emergentFiles = actualFiles.filter((f) => !plannedFiles.includes(f));

  // Dropped items: files in planned but not in actual
  const droppedFiles = plannedFiles.filter((f) => !actualFiles.includes(f));

  // Also check must-have artifact paths against actual files
  const droppedArtifacts = plan.must_have_artifacts.filter(
    (a) => !actualFiles.includes(a) && !droppedFiles.includes(a),
  );

  const emergentWork = [...emergentFiles];
  const droppedItems = [...droppedFiles, ...droppedArtifacts];

  const deviations = summary.deviations;

  // Determine scope change
  let scopeChange: PlanSummaryDiff['scope_change'];
  if (emergentWork.length === 0 && droppedItems.length === 0) {
    scopeChange = 'on_track';
  } else if (emergentWork.length > 0 && droppedItems.length > 0 && emergentWork.length === droppedItems.length) {
    scopeChange = 'shifted';
  } else if (emergentWork.length > droppedItems.length) {
    scopeChange = 'expanded';
  } else if (droppedItems.length > emergentWork.length) {
    scopeChange = 'contracted';
  } else {
    // Equal non-zero counts (already handled above for strict equality)
    scopeChange = 'shifted';
  }

  // Extract phase number from plan.phase string (e.g., "86-wrapper-commands" -> 86)
  const phaseNumber = parseInt(plan.phase.replace(/^(\d+).*/, '$1'), 10) || 0;

  return {
    phase: phaseNumber,
    plan: plan.plan,
    planned_files: plannedFiles,
    actual_files: actualFiles,
    planned_artifacts: plan.must_have_artifacts,
    actual_accomplishments: summary.accomplishments,
    emergent_work: emergentWork,
    dropped_items: droppedItems,
    deviations,
    scope_change: scopeChange,
  };
}
