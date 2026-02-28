/**
 * Self-Improvement Lifecycle -- changelog watch skill.
 *
 * Detects Claude Code version via CLI, parses markdown changelogs, and
 * classifies features into LEVERAGE_NOW / PLAN_FOR / WATCH categories.
 * The classification drives retrospective feature alignment sections and
 * feeds into action item generation.
 *
 * Side effects isolated to detectVersion() (calls execSync). All other
 * functions are pure.
 *
 * @module retro/changelog-watch
 */

import { execSync } from 'child_process';
import type { ChangelogEntry, ChangelogWatchResult } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Keywords that indicate a feature is available now and should be leveraged.
 */
const LEVERAGE_NOW_KEYWORDS = [
  'available',
  'released',
  'stable',
  'ga',
  'general availability',
  'shipped',
  'now supports',
  'added support',
];

/**
 * Keywords that indicate a feature is coming and should be planned for.
 */
const PLAN_FOR_KEYWORDS = [
  'beta',
  'preview',
  'experimental',
  'early access',
  'opt-in',
  'coming',
];

/**
 * Keywords that indicate a feature is future/planned and should be watched.
 */
const WATCH_KEYWORDS = [
  'planned',
  'roadmap',
  'future',
  'under development',
  'rfc',
];

// ============================================================================
// Version detection
// ============================================================================

/**
 * Detect the current Claude Code version by running `claude --version`.
 *
 * Returns the parsed version string (e.g., "2.1.5") or 'unknown' if the
 * CLI is not available or output cannot be parsed.
 */
export function detectVersion(): string {
  try {
    const output = execSync('claude --version', {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const match = output.match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

// ============================================================================
// Changelog parsing
// ============================================================================

/**
 * Parse a markdown changelog and extract features as ChangelogEntry[].
 *
 * Looks for version headers (## or ### with version pattern) and extracts
 * bullet points as features. Feature names are extracted from bold text
 * (**Name**) or the first sentence.
 *
 * If sinceVersion is provided, only returns features from versions after
 * sinceVersion (lexicographic comparison).
 *
 * Returns entries with empty classification (to be filled by classifyFeatures).
 */
export function parseChangelog(
  markdown: string,
  sinceVersion?: string,
): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = markdown.split('\n');

  let currentVersion: string | undefined;
  let skipVersion = false;

  for (const line of lines) {
    // Check for version headers: ## v2.1.5 or ### 2.1.0
    const versionMatch = line.match(/^#{2,3}\s+v?(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      currentVersion = versionMatch[1];
      // If sinceVersion given, skip versions <= sinceVersion
      if (sinceVersion && compareVersions(currentVersion, sinceVersion) <= 0) {
        skipVersion = true;
      } else {
        skipVersion = false;
      }
      continue;
    }

    // Skip lines that aren't bullet features
    if (skipVersion || !currentVersion) continue;

    const bulletMatch = line.match(/^-\s+(.+)/);
    if (!bulletMatch) continue;

    const bulletText = bulletMatch[1].trim();

    // Extract feature name from bold text or first sentence
    const boldMatch = bulletText.match(/\*\*([^*]+)\*\*/);
    const name = boldMatch ? boldMatch[1] : bulletText.split(/[:.]/)[0].trim();

    // Extract impact: everything after the bold name or the whole text
    const impact = boldMatch
      ? bulletText.replace(/\*\*[^*]+\*\*:?\s*/, '').trim()
      : bulletText;

    entries.push({
      name,
      classification: 'WATCH', // Default; classifyFeatures updates this
      impact,
      action: '',
      version: currentVersion,
    });
  }

  return entries;
}

/**
 * Compare two semver strings. Returns:
 * - negative if a < b
 * - 0 if a === b
 * - positive if a > b
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const diff = (aParts[i] || 0) - (bParts[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// ============================================================================
// Feature classification
// ============================================================================

/**
 * Classify changelog entries into LEVERAGE_NOW / PLAN_FOR / WATCH.
 *
 * Applies keyword-based classification rules. Checks both name and impact
 * fields (case-insensitive). First match wins in priority order:
 * LEVERAGE_NOW > PLAN_FOR > WATCH.
 *
 * Returns a new array with updated classification fields (does not mutate input).
 */
export function classifyFeatures(entries: ChangelogEntry[]): ChangelogEntry[] {
  return entries.map((entry) => {
    const searchText = `${entry.name} ${entry.impact}`.toLowerCase();

    // Check LEVERAGE_NOW keywords first (highest priority)
    if (LEVERAGE_NOW_KEYWORDS.some((kw) => searchText.includes(kw))) {
      return { ...entry, classification: 'LEVERAGE_NOW' as const };
    }

    // Check PLAN_FOR keywords second
    if (PLAN_FOR_KEYWORDS.some((kw) => searchText.includes(kw))) {
      return { ...entry, classification: 'PLAN_FOR' as const };
    }

    // Check WATCH keywords third
    if (WATCH_KEYWORDS.some((kw) => searchText.includes(kw))) {
      return { ...entry, classification: 'WATCH' as const };
    }

    // Default: WATCH
    return { ...entry, classification: 'WATCH' as const };
  });
}

// ============================================================================
// Orchestrator
// ============================================================================

/**
 * Run a complete changelog watch cycle.
 *
 * Composes detectVersion, parseChangelog, and classifyFeatures into a single
 * result. Accepts optional overrides for testing.
 */
export function runChangelogWatch(opts?: {
  versionStart?: string;
  changelogText?: string;
}): ChangelogWatchResult {
  const versionEnd = detectVersion();
  const versionStart = opts?.versionStart ?? 'unknown';

  let features: ChangelogEntry[] = [];
  if (opts?.changelogText) {
    features = parseChangelog(opts.changelogText, versionStart !== 'unknown' ? versionStart : undefined);
    features = classifyFeatures(features);
  }

  return {
    version_start: versionStart,
    version_end: versionEnd,
    checked_at: new Date().toISOString(),
    features,
  };
}
