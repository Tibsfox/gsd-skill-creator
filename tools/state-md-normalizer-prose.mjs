#!/usr/bin/env node
/**
 * tools/state-md-normalizer-prose.mjs (v1.49.637 C6)
 *
 * Prose-body milestone-drift validator for `.planning/STATE.md`. Extends the
 * existing frontmatter-only `state-md-normalizer.mjs --check` flow with a
 * semantic-coherence check: ensures configured prose sections reference the
 * same milestone the frontmatter declares.
 *
 * Closes v1.49.636 post-ship-review Finding #2 "STATE.md prose body lag"
 * (lab-director-2 observed: frontmatter advanced to v1.49.636 via ship-sync,
 * but prose `### Branch State` still described v1.49.635 state).
 *
 * Behavior:
 *   - Reads frontmatter `milestone:` value.
 *   - Scans configured sections (default `### Branch State` + `### Decisions`)
 *     for `vMAJOR.MINOR.PATCH` references that differ from the frontmatter
 *     value.
 *   - Emits warnings (warn-only by default; pass).
 *   - Hard-fails (`pass: false`) only when `SC_REQUIRE_PROSE_SYNC=1` is set
 *     AND findings are non-empty.
 *
 * Allowlist convention:
 *   - `### Decisions (vX.Y.Z — ...)` headers naming a NEXT milestone (post-
 *     ship in-progress) are recognized but the SECTION CONTENT is still
 *     scanned. The convention is documented at
 *     `.planning/state-md-normalizer-conventions.md`.
 *   - `### Carry-forward` sections are allowlisted by default (they
 *     legitimately reference future cluster milestones, e.g. `v1.49.6XX` /
 *     `v1.49.7XX`).
 *
 * Section parsing:
 *   - ATX-style headers only (`### Section`). Setext-style (`Section\n---`)
 *     is not supported.
 *   - A section spans from its header line to the next `### ` line or EOF.
 *
 * See: .planning/missions/v1-49-637-housekeeping-cluster-4/components/06-state-md-prose-normalizer.md
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jsYaml = require('js-yaml');

export const DEFAULT_SECTIONS = ['### Branch State', '### Decisions'];

/**
 * Sections allowlisted out of the prose-sync check by default. These sections
 * legitimately reference milestones OTHER than the frontmatter milestone:
 *   - `### Carry-forward` — references future cluster milestones
 *   - `### Notes` — free-text section, prose-sync not applicable
 *   - `## Notes` — same as above (parent-level)
 */
export const DEFAULT_ALLOWLISTED_HEADERS = ['### Carry-forward', '### Notes', '## Notes'];

const MILESTONE_RE = /v\d+\.\d+\.\d+/g;
const SEMVER_RE = /^v\d+\.\d+\.\d+$/;

/**
 * @typedef {Object} ProseFinding
 * @property {string} section                 e.g. "### Branch State"
 * @property {string} frontmatterMilestone    e.g. "v1.49.637"
 * @property {string[]} proseReferences       deduped, e.g. ["v1.49.636"]
 */

/**
 * @typedef {Object} ProseValidationResult
 * @property {ProseFinding[]} warnings
 * @property {boolean} pass               true unless hardFail mode + findings
 * @property {boolean} hardFail           true when SC_REQUIRE_PROSE_SYNC=1 + findings
 * @property {string|null} frontmatterMilestone
 */

/**
 * Parse YAML frontmatter and return the parsed object + raw body.
 * Returns { frontmatter: null, body: content } when no frontmatter block.
 */
export function parseFrontmatterAndBody(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }
  const [, fmRaw, body] = match;
  let frontmatter;
  try {
    frontmatter = jsYaml.load(fmRaw) ?? {};
  } catch (err) {
    return { frontmatter: null, body, parseError: err.message };
  }
  return { frontmatter, body };
}

/**
 * Extract the content of an ATX section by exact header string.
 *
 * Example: extractSectionContent(body, "### Branch State") returns the lines
 * between "### Branch State" (exclusive) and the next "### " (or EOF).
 *
 * Matches sections whose header LINE *starts* with the given header string,
 * allowing trailing context (e.g. "### Decisions (v1.49.637 — Cluster #4)").
 *
 * Returns null when the section is absent.
 */
export function extractSectionContent(body, sectionHeader) {
  const lines = body.split('\n');
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(sectionHeader)) {
      // Confirm the next char is end-of-string or whitespace / paren — we
      // don't want "### Branch StateBacklog" to match "### Branch State".
      const remainder = lines[i].slice(sectionHeader.length);
      if (remainder === '' || /^[\s(]/.test(remainder)) {
        startIdx = i;
        break;
      }
    }
  }
  if (startIdx === -1) return null;

  // Find the next section boundary (any ### or ## header) AFTER startIdx.
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^#{2,3}\s/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  // Include the section header line in the returned content so the validator
  // can also inspect parenthetical milestone references in the header
  // itself (e.g. "### Decisions (v1.49.636)").
  return lines.slice(startIdx, endIdx).join('\n');
}

/**
 * Main entry point. Pure-functional; no I/O beyond the readFileSync optional
 * path-based form.
 *
 * @param {string} stateContent           raw STATE.md content
 * @param {Object} [options]
 * @param {string[]} [options.sections=DEFAULT_SECTIONS]
 * @param {string[]} [options.allowlistedHeaders=DEFAULT_ALLOWLISTED_HEADERS]
 * @param {boolean} [options.hardFailMode]   override SC_REQUIRE_PROSE_SYNC
 * @returns {ProseValidationResult}
 */
export function validateProseSync(stateContent, options = {}) {
  const sections = options.sections ?? DEFAULT_SECTIONS;
  const allowlistedHeaders = options.allowlistedHeaders ?? DEFAULT_ALLOWLISTED_HEADERS;
  const hardFailMode =
    options.hardFailMode ?? process.env.SC_REQUIRE_PROSE_SYNC === '1';

  const { frontmatter, body } = parseFrontmatterAndBody(stateContent);
  if (!frontmatter || typeof frontmatter.milestone !== 'string') {
    // No frontmatter or no milestone field — silent pass (the existing
    // frontmatter validator owns this concern).
    return {
      warnings: [],
      pass: true,
      hardFail: false,
      frontmatterMilestone: null,
    };
  }

  const currentMilestone = frontmatter.milestone.trim();
  if (!SEMVER_RE.test(currentMilestone)) {
    // Malformed milestone — let the frontmatter validator handle it.
    return {
      warnings: [],
      pass: true,
      hardFail: false,
      frontmatterMilestone: currentMilestone,
    };
  }

  const findings = [];
  for (const sectionHeader of sections) {
    const sectionContent = extractSectionContent(body, sectionHeader);
    if (sectionContent === null) continue;

    // Skip allowlisted sections entirely (e.g., "### Carry-forward" which
    // would happen to share a prefix with one of the scanned sections —
    // defensive even though current defaults don't overlap).
    if (allowlistedHeaders.some((h) => sectionContent.startsWith(h))) continue;

    const allMatches = [...sectionContent.matchAll(MILESTONE_RE)].map((m) => m[0]);
    const others = [...new Set(allMatches.filter((v) => v !== currentMilestone))];
    if (others.length > 0) {
      findings.push({
        section: sectionHeader,
        frontmatterMilestone: currentMilestone,
        proseReferences: others,
      });
    }
  }

  const hardFail = hardFailMode && findings.length > 0;
  return {
    warnings: findings,
    pass: !hardFail,
    hardFail,
    frontmatterMilestone: currentMilestone,
  };
}

/**
 * Convenience path-based wrapper. Reads from disk, validates, returns result.
 */
export function validateProseSyncAtPath(statePath, options = {}) {
  if (!existsSync(statePath)) {
    return {
      warnings: [],
      pass: true,
      hardFail: false,
      frontmatterMilestone: null,
    };
  }
  const content = readFileSync(statePath, 'utf8');
  return validateProseSync(content, options);
}

/**
 * Human-readable formatter for stderr output.
 */
export function formatFindingsForStderr(result) {
  if (result.warnings.length === 0) return '';
  const lines = [
    `[state-md-normalizer-prose] ${result.hardFail ? 'FAIL' : 'WARN'}: prose-body milestone drift detected`,
    `[state-md-normalizer-prose]   frontmatter milestone: ${result.frontmatterMilestone}`,
  ];
  for (const f of result.warnings) {
    lines.push(
      `[state-md-normalizer-prose]   ${f.section}: references ${f.proseReferences.join(', ')}`,
    );
  }
  if (!result.hardFail) {
    lines.push('[state-md-normalizer-prose]   (warn-only by default; set SC_REQUIRE_PROSE_SYNC=1 to hard-fail)');
  }
  lines.push(
    '[state-md-normalizer-prose]   Convention doc: .planning/state-md-normalizer-conventions.md',
  );
  return lines.join('\n');
}

// ─── CLI entry point (for standalone use; integration is via state-md-normalizer.mjs)
function isDirectInvocation() {
  const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
  const thisPath = resolve(new URL(import.meta.url).pathname);
  return invokedPath === thisPath;
}

function cli() {
  const args = new Set(process.argv.slice(2));
  const JSON_OUT = args.has('--json');
  const STATE_PATH = resolve(process.cwd(), '.planning', 'STATE.md');

  const result = validateProseSyncAtPath(STATE_PATH);

  if (JSON_OUT) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.warnings.length > 0) {
    console.error(formatFindingsForStderr(result));
  } else if (result.frontmatterMilestone) {
    console.log(`[state-md-normalizer-prose] PASS — prose sections aligned with frontmatter ${result.frontmatterMilestone}`);
  } else {
    console.log('[state-md-normalizer-prose] PASS — no frontmatter milestone to validate against');
  }

  // Exit 0 unless hardFail.
  process.exit(result.hardFail ? 1 : 0);
}

if (isDirectInvocation()) {
  cli();
}
