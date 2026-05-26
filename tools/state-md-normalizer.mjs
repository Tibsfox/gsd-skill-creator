#!/usr/bin/env node
/**
 * state-md-normalizer.mjs — normalize .planning/STATE.md to canonical schema.
 *
 * Closes v1.49.634 HANDOFF open-item §1: STATE.md has dual predecessor_* blocks
 * + stale "Current Position" section.
 *
 * What it does:
 *   1. Reads .planning/STATE.md and parses YAML frontmatter.
 *   2. Collapses flat `predecessor_*` keys into a nested `predecessor:` block.
 *   3. Regenerates "## Current Position" + "## Engine state baseline" sections
 *      from current frontmatter values.
 *   4. Preserves "## Notes" section verbatim.
 *   5. Writes a timestamped backup before any destructive write.
 *
 * CLI flags:
 *   --check        Exit 1 if normalize would change the file; no write.
 *   --write        Perform the normalize (default behavior when no --check).
 *   --prune-stale  Remove top-level keys not in schema (OFF by default).
 *
 * Exit codes:
 *   0  No drift (--check) or normalize succeeded (--write).
 *   1  Drift detected (--check) or fatal error.
 *
 * Idempotency: running twice on a normalized file produces identical output.
 *
 * Schema reference: docs/STATE-MD-SCHEMA.md
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  validateProseSync,
  formatFindingsForStderr,
} from './state-md-normalizer-prose.mjs';

const require = createRequire(import.meta.url);
const jsYaml = require('js-yaml');

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const PRUNE_STALE = args.has('--prune-stale');

// Use process.cwd() so the script works when invoked from any repo root,
// including test harnesses that set cwd to a tmpdir.
const REPO_ROOT = resolve(process.cwd());
const STATE_PATH = resolve(REPO_ROOT, '.planning', 'STATE.md');

// ─── Schema constants ────────────────────────────────────────────────────────

/**
 * Keys that are part of the canonical top-level schema.
 * Used only when --prune-stale is active.
 */
const SCHEMA_TOP_LEVEL_KEYS = new Set([
  'gsd_state_version',
  'milestone',
  'milestone_name',
  'status',
  'counter_cadence',
  'no_engine_state_advance',
  'nasa_degree',
  'predecessor',
  'opened_on',
  'shipped_at',
  'last_updated',
  'mission_package_pattern',
  'progress',
]);

/**
 * Flat predecessor_* key suffixes that collapse into predecessor.* sub-fields.
 * Mapping: flat key -> nested field name.
 *
 * We intentionally include the variants that have appeared in historical
 * STATE.md files (e.g. predecessor_shipped_at vs predecessor_shipped_at_sha,
 * predecessor_degree_advancing_* family).
 */
const PREDECESSOR_FLAT_KEY_MAP = {
  predecessor_milestone: 'milestone',
  predecessor_shipped_at: 'shipped_at',
  predecessor_shipped_at_tag: 'shipped_at_tag',
  predecessor_shipped_at_sha: 'shipped_at_sha',
  predecessor_post_ship_sync_sha: 'post_ship_sync_sha',
  predecessor_counter_cadence: 'counter_cadence',
  predecessor_degree_advancing_milestone: 'degree_advancing_milestone',
  predecessor_degree_advancing_tag: 'degree_advancing_tag',
  predecessor_degree_advancing_sha: 'degree_advancing_sha',
  predecessor_degree_advancing_post_ship_sync_sha: 'degree_advancing_post_ship_sync_sha',
};

// ─── Frontmatter parser ───────────────────────────────────────────────────────

/**
 * Parse STATE.md into { frontmatter (parsed object), frontmatterRaw, body }.
 * Throws on malformed input.
 *
 * YAML duplicate-key handling: js-yaml silently last-write-wins. Since
 * STATE.md may have duplicate top-level keys (that's exactly the bug),
 * we pre-process to collapse duplicates: for each key, the LAST occurrence wins.
 * This is done by scanning raw frontmatter lines before passing to js-yaml.
 */
function parseStateMd(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    console.error('[state-md-normalizer] FATAL: STATE.md is missing YAML frontmatter (expected ---...--- block)');
    process.exit(1);
  }

  const [, frontmatterRaw, body] = match;

  // Deduplicate top-level keys: last occurrence wins.
  // We do a line-by-line scan rather than relying solely on js-yaml because
  // js-yaml in non-strict mode picks first-occurrence by default on some versions.
  const deduped = deduplicateTopLevelKeys(frontmatterRaw);

  // Sanitize: quote unquoted string values that contain '#' (which YAML treats
  // as a comment character), and normalize gsd_state_version to keep ".0" suffix.
  const sanitized = sanitizeRawFrontmatter(deduped);

  let frontmatter;
  try {
    frontmatter = jsYaml.load(sanitized) ?? {};
  } catch (err) {
    console.error(`[state-md-normalizer] FATAL: YAML parse error in frontmatter: ${err.message}`);
    process.exit(1);
  }

  return { frontmatter, frontmatterRaw: sanitized, body };
}

/**
 * Deduplicate top-level YAML keys in a raw frontmatter string.
 * Identifies top-level key-value lines (not indented, contain ':'),
 * and for each key keeps the LAST occurrence (including its block/multiline
 * continuation lines).
 */
function deduplicateTopLevelKeys(raw) {
  const lines = raw.split('\n');
  // Segments: each segment is { key, lines[] } or { key: null, lines[] } for non-key lines.
  const segments = [];
  let current = null;

  for (const line of lines) {
    // A top-level key line: not indented, has content, matches "key: value" or "key:"
    const isTopLevelKey = /^[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(line);
    if (isTopLevelKey) {
      const key = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:/)[1];
      current = { key, lines: [line] };
      segments.push(current);
    } else if (current) {
      // Continuation of current key (indented or blank lines within a block)
      current.lines.push(line);
    } else {
      // Before any key (shouldn't happen in valid frontmatter, but be safe)
      segments.push({ key: null, lines: [line] });
    }
  }

  // For each key, keep only the LAST segment with that key.
  const seen = new Set();
  const keepMap = new Map(); // key -> last segment index
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].key !== null) {
      keepMap.set(segments[i].key, i);
    }
  }

  const kept = new Set(keepMap.values());
  const resultLines = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].key === null || kept.has(i)) {
      resultLines.push(...segments[i].lines);
    }
  }

  return resultLines.join('\n');
}

/**
 * Sanitize raw YAML frontmatter string to handle values that js-yaml would
 * misparse without quoting:
 *   - Unquoted string values containing '#' (YAML comment character).
 *   - 'gsd_state_version: 1.0' — YAML parses as float 1, losing ".0".
 *
 * We only fix top-level key: value lines (not indented blocks).
 */
function sanitizeRawFrontmatter(raw) {
  const lines = raw.split('\n');
  return lines.map(line => {
    // Only operate on top-level key: value lines (not indented).
    const topLevelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (!topLevelMatch) return line;

    const [, key, value] = topLevelMatch;

    // gsd_state_version: fix "1.0" → quoted "1.0" so it stays as string "1.0"
    if (key === 'gsd_state_version') {
      const trimmed = value.trim();
      // If not already quoted, quote it to preserve exact string form.
      if (trimmed && !trimmed.startsWith('"') && !trimmed.startsWith("'")) {
        return `${key}: "${trimmed}"`;
      }
      return line;
    }

    // String values with '#': quote them if unquoted.
    const trimmed = value.trim();
    if (
      trimmed &&
      trimmed.includes('#') &&
      !trimmed.startsWith('"') &&
      !trimmed.startsWith("'")
    ) {
      // Escape any existing double quotes in the value, then wrap in double quotes.
      const escaped = trimmed.replace(/"/g, '\\"');
      return `${key}: "${escaped}"`;
    }

    return line;
  }).join('\n');
}

// ─── Normalization logic ──────────────────────────────────────────────────────

/**
 * Normalize the parsed frontmatter object in place:
 * 1. Collapse flat predecessor_* keys into nested predecessor block.
 * 2. Optionally prune stale top-level keys (--prune-stale).
 */
function normalizeFrontmatter(fm) {
  // Build or merge nested predecessor block from flat keys.
  const predecessor = fm.predecessor ?? {};

  let didCollapse = false;
  for (const [flatKey, nestedField] of Object.entries(PREDECESSOR_FLAT_KEY_MAP)) {
    if (Object.prototype.hasOwnProperty.call(fm, flatKey)) {
      // Only write the nested field if it doesn't already have a value,
      // or if we're in additive mode (flat key overrides if nested is absent).
      if (predecessor[nestedField] === undefined) {
        predecessor[nestedField] = fm[flatKey];
      }
      delete fm[flatKey];
      didCollapse = true;
    }
  }

  // Remove legacy variants that appeared in historical STATE.md files
  // (e.g., predecessor_milestone_v632, v632_opening_commit_on_dev, status_old).
  // These are always pruned when we detect they're historical noise fields.
  const historicalNoise = [
    'predecessor_milestone_v632',
    'predecessor_shipped_at_tag_v632',
    'predecessor_shipped_at_sha_v632',
    'v632_opening_commit_on_dev',
    'status_old',
    'opening_commit_on_dev',
    'state_md_recovery_note',
  ];
  for (const key of historicalNoise) {
    if (Object.prototype.hasOwnProperty.call(fm, key)) {
      delete fm[key];
      didCollapse = true;
    }
  }

  if (didCollapse || Object.keys(predecessor).length > 0) {
    fm.predecessor = predecessor;
  }

  // Prune unknown top-level keys (opt-in).
  if (PRUNE_STALE) {
    for (const key of Object.keys(fm)) {
      if (!SCHEMA_TOP_LEVEL_KEYS.has(key)) {
        delete fm[key];
      }
    }
  }

  return fm;
}

// ─── Body section generators ──────────────────────────────────────────────────

/**
 * Generate the ## Current Position section body from frontmatter.
 * Lines for absent fields are skipped (no UNKNOWN placeholder).
 * Emits Shipped: line when status === 'shipped' and shipped_at is set.
 */
function generateCurrentPosition(fm) {
  const milestone = fm.milestone ?? 'UNKNOWN';
  const milestoneName = fm.milestone_name;
  const status = fm.status;
  const openedOn = fm.opened_on;
  const shippedAt = fm.shipped_at;
  const isShipped = typeof status === 'string' && status.toLowerCase() === 'shipped';

  const milestoneLine = milestoneName
    ? `Milestone: **${milestone} — ${milestoneName}**`
    : `Milestone: **${milestone}**`;

  const lines = [
    `## Current Position`,
    ``,
    milestoneLine,
    status ? `Status: ${status.toUpperCase()}` : null,
    openedOn ? `Opened: ${openedOn}` : null,
    isShipped && shippedAt ? `Shipped: ${shippedAt}` : null,
    ``,
  ].filter(line => line !== null);

  return lines.join('\n');
}

/**
 * Generate the ## Engine state baseline section from predecessor block + nasa_degree.
 * Lines for absent fields are skipped (no UNKNOWN placeholder).
 */
function generateEngineStateBaseline(fm) {
  const milestone = fm.milestone ?? 'UNKNOWN';
  const pred = fm.predecessor ?? {};
  const nasaDegree = fm.nasa_degree;
  const predMilestone = pred.milestone;
  const predTag = pred.shipped_at_tag;
  const predSha = pred.shipped_at_sha;
  const predSync = pred.post_ship_sync_sha ?? null;
  // Default counter_cadence to false when absent — most milestones are not
  // counter-cadence, and the line is load-bearing for normalized-form match
  // against historical fixtures.
  const predCounterCadence = pred.counter_cadence ?? false;
  const predDegreeAdvancing = pred.degree_advancing_milestone ?? null;

  // Build the predecessor milestone line dynamically — only include the parts
  // (tag, sha) that are actually present, so hand-authored frontmatter with
  // partial detail round-trips without "UNKNOWN" drift.
  let predecessorLine = null;
  if (predMilestone) {
    const detailParts = [];
    if (predTag) detailParts.push(`tag: ${predTag}`);
    if (predSha) detailParts.push(`sha: ${predSha}`);
    predecessorLine = detailParts.length > 0
      ? `- **Predecessor milestone:** ${predMilestone} (${detailParts.join(', ')})`
      : `- **Predecessor milestone:** ${predMilestone}`;
  }

  const lines = [
    `## Engine state baseline at ${milestone} open`,
    ``,
    predecessorLine,
    predSync ? `- **Post-ship sync sha:** ${predSync}` : null,
    `- **Predecessor counter-cadence:** ${predCounterCadence}`,
    predDegreeAdvancing ? `- **Last degree-advancing milestone:** ${predDegreeAdvancing}` : null,
    nasaDegree !== undefined ? `- **NASA degree at open:** ${nasaDegree}` : null,
    ``,
  ].filter(line => line !== null);

  return lines.join('\n');
}

// ─── Body rebuilder ───────────────────────────────────────────────────────────

/**
 * Strip a markdown section by H2 heading prefix.
 * Section runs from the matched heading line up to (but not including) the
 * next H2 heading or end-of-input. Returns the body with the section removed.
 * Replaces the regex pattern `(?=^##|\Z)` which JS does not support — `\Z`
 * was being parsed as a literal `Z` character, causing premature termination
 * when a Z appeared in section prose.
 */
function stripSection(body, headingPrefix) {
  const lines = body.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(headingPrefix)) {
      start = i;
      break;
    }
  }
  if (start === -1) return body;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  }
  return [...lines.slice(0, start), ...lines.slice(end)].join('\n');
}

/**
 * Rebuild the body from normalized frontmatter + preserved Notes section.
 *
 * Strategy:
 *   - Regenerate "## Current Position" and "## Engine state baseline ..." sections.
 *   - Preserve verbatim everything from "## Notes" onward (if present).
 *   - Preserve any other sections that appear BEFORE "## Notes" and AFTER the
 *     known generated sections by keeping them verbatim. However, the generated
 *     sections completely replace their counterparts.
 */
function rebuildBody(fm, originalBody) {
  // Extract Notes section verbatim (everything from "## Notes" to EOF).
  const notesMatch = originalBody.match(/^(## Notes\s*\n[\s\S]*)$/m);
  const notesSection = notesMatch ? notesMatch[1] : null;

  let remainingBody = originalBody;

  // Remove known auto-generated sections (Current Position + Engine state baseline).
  // Uses a line-walk rather than regex with \Z (JS has no end-of-string anchor)
  // so the strip works correctly even when the section body contains a literal
  // `Z` character (e.g. ISO-8601 timestamps in inline prose).
  remainingBody = stripSection(remainingBody, '## Current Position');
  remainingBody = stripSection(remainingBody, '## Engine state baseline');

  // Remove the Notes section (we'll re-append it at the end).
  if (notesSection) {
    remainingBody = remainingBody.replace(notesSection, '');
  }

  // Clean up excessive blank lines from the trimming.
  remainingBody = remainingBody.replace(/\n{3,}/g, '\n\n').trim();

  // Build the final body.
  const parts = [];
  parts.push(generateCurrentPosition(fm));
  parts.push(generateEngineStateBaseline(fm));

  // Append any remaining body content (sections we didn't touch).
  if (remainingBody) {
    parts.push(remainingBody);
    parts.push('');
  }

  // Re-append Notes section.
  if (notesSection) {
    parts.push(notesSection);
  }

  return parts.join('\n');
}

// ─── YAML serializer ──────────────────────────────────────────────────────────

/**
 * Serialize frontmatter to YAML, preserving key ordering close to schema order.
 * We use js-yaml dump with sortKeys: false to preserve insertion order.
 */
function serializeFrontmatter(fm) {
  // Reorder keys to match schema order for clean output.
  const ORDERED_KEYS = [
    'gsd_state_version',
    'milestone',
    'milestone_name',
    'status',
    'counter_cadence',
    'no_engine_state_advance',
    'nasa_degree',
    'predecessor',
    'opened_on',
    'shipped_at',
    'last_updated',
    'mission_package_pattern',
    'progress',
  ];

  const ordered = {};
  for (const key of ORDERED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(fm, key)) {
      ordered[key] = fm[key];
    }
  }
  // Append any remaining keys not in the schema ordering.
  for (const key of Object.keys(fm)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) {
      ordered[key] = fm[key];
    }
  }

  return jsYaml.dump(ordered, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  }).trimEnd();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(STATE_PATH)) {
    console.log('[state-md-normalizer] no STATE.md at .planning/STATE.md — no-op');
    process.exit(0);
  }

  const raw = readFileSync(STATE_PATH, 'utf8');
  const { frontmatter, body } = parseStateMd(raw);

  // Validate required field.
  if (!frontmatter.milestone) {
    console.error('[state-md-normalizer] FATAL: STATE.md is missing required `milestone` field');
    process.exit(1);
  }

  // Normalize frontmatter.
  const normalizedFm = normalizeFrontmatter({ ...frontmatter });

  // Rebuild body.
  const normalizedBody = rebuildBody(normalizedFm, body);

  // Serialize. Blank line between `---` close and body for readability.
  const normalizedFrontmatterYaml = serializeFrontmatter(normalizedFm);
  const normalizedContent = `---\n${normalizedFrontmatterYaml}\n---\n\n${normalizedBody}`;

  // Check if anything changed.
  const changed = normalizedContent !== raw;

  if (CHECK_ONLY) {
    // v1.49.637 C6: extended --check also runs the prose-body milestone-drift
    // validator. Warnings go to stderr; exit 1 only when frontmatter drift OR
    // (SC_REQUIRE_PROSE_SYNC=1 AND prose findings).
    const proseResult = validateProseSync(raw);

    if (changed) {
      console.log('[state-md-normalizer] CHECK: drift detected — STATE.md would be changed by normalization');
      console.log('[state-md-normalizer] Run `node tools/state-md-normalizer.mjs --write` to apply.');
      if (proseResult.warnings.length > 0) {
        console.error(formatFindingsForStderr(proseResult));
      }
      process.exit(1);
    }

    // Frontmatter is clean. Emit prose findings (if any) and exit per
    // hardFail policy.
    if (proseResult.warnings.length > 0) {
      console.error(formatFindingsForStderr(proseResult));
      if (proseResult.hardFail) {
        console.error('[state-md-normalizer] CHECK: prose-body milestone drift + SC_REQUIRE_PROSE_SYNC=1 — exiting 1');
        process.exit(1);
      }
      console.log('[state-md-normalizer] CHECK: frontmatter clean; prose-body drift WARNED (see stderr)');
      process.exit(0);
    }

    console.log('[state-md-normalizer] CHECK: no drift — STATE.md is already normalized');
    process.exit(0);
  }

  // --write (default) path.
  if (!changed) {
    console.log('[state-md-normalizer] already normalized — no-op');
    process.exit(0);
  }

  // Write backup before destructive write.
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = resolve(REPO_ROOT, '.planning', `STATE.md.backup-before-normalize-${ts}`);
  writeFileSync(backupPath, raw, 'utf8');
  console.log(`[state-md-normalizer] backup written → ${backupPath}`);

  // Write normalized file.
  writeFileSync(STATE_PATH, normalizedContent, 'utf8');
  console.log(`[state-md-normalizer] NORMALIZED → ${STATE_PATH}`);
  process.exit(0);
}

main();
