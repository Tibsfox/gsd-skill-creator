/**
 * Trust CLI Renderer — Progressive Disclosure
 *
 * Pure rendering functions for trust system CLI output. No IO, no side
 * effects — takes domain objects and a trust level, returns strings.
 *
 * Progressive disclosure (Willow's design):
 *   Seedling (level 1): Simple text, no numbers. The journey begins.
 *   Sapling (level 2):  Labels and types visible. Growing awareness.
 *   Old Growth (level 3): Full detail — harmony, magnitudes, angles.
 *
 * All functions are pure and deterministic. Colors are applied via
 * picocolors for terminal rendering but the text content is testable
 * independently.
 *
 * @module trust-cli-renderer
 */

import pc from 'picocolors';
import type {
  TrustRelationship,
  CharacterSheet,
} from './trust-relationship.js';
import {
  isContractActive,
  contractTimeRemaining,
  describeVector,
  computeHarmony,
} from './trust-relationship.js';
import type {
  GraphDiversity,
  Bond,
} from './trust-graph.js';
import {
  classifyAsymmetry,
  describeAsymmetry,
} from './trust-graph.js';

// ============================================================================
// Detail Level
// ============================================================================

/** Progressive disclosure levels, mapped from trust level. */
export type DetailLevel = 'seedling' | 'sapling' | 'old-growth';

/** Map a numeric trust level to a disclosure level. */
export function detailLevel(trustLevel: number): DetailLevel {
  if (trustLevel >= 3) return 'old-growth';
  if (trustLevel >= 2) return 'sapling';
  return 'seedling';
}

// ============================================================================
// Trust Level Badge
// ============================================================================

/** Render a colored trust level badge. */
export function renderTrustBadge(trustLevel: number): string {
  switch (trustLevel) {
    case 1: return pc.green('Seedling');
    case 2: return pc.yellow('Sapling');
    case 3: return pc.cyan('Old Growth');
    default: return pc.dim('Outsider');
  }
}

// ============================================================================
// Contract Type Formatting
// ============================================================================

/** Render a contract type with appropriate styling. */
export function renderContractType(type: string): string {
  switch (type) {
    case 'permanent': return pc.bold(type);
    case 'long-term': return type;
    case 'event-scoped': return pc.blue(type);
    case 'project-scoped': return pc.magenta(type);
    case 'ephemeral': return pc.dim(type);
    default: return type;
  }
}

// ============================================================================
// Time Remaining
// ============================================================================

/** Format remaining time in human-readable form. */
export function formatTimeRemaining(seconds: number): string {
  if (!Number.isFinite(seconds)) return '';
  if (seconds <= 0) return 'expired';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

// ============================================================================
// Relationship Rendering
// ============================================================================

/**
 * Render a single relationship in compact (one-line) format.
 *
 * Seedling: "fox-042 ↔ cedar-011 — permanent"
 * Sapling:  "fox-042 ↔ cedar-011 — permanent \"family\" ↔ \"family\""
 * Old Growth: "fox-042 ↔ cedar-011 — permanent (harmony=0.95) \"family\" ↔ \"family\""
 */
export function renderRelationshipCompact(
  rel: TrustRelationship,
  level: DetailLevel,
  now: Date = new Date(),
): string {
  const active = isContractActive(rel.contract, now);
  const type = renderContractType(rel.contract.type);
  const renewTag = rel.contract.autoRenew ? ' ♻' : '';
  const status = active ? '' : pc.dim(' [EXPIRED]');

  let line = `${rel.from} ↔ ${rel.to} — ${type}${renewTag}${status}`;

  // Sapling+: show labels
  if (level !== 'seedling') {
    const labels = [];
    if (rel.fromLabel) labels.push(`"${rel.fromLabel}"`);
    if (rel.toLabel) labels.push(`"${rel.toLabel}"`);
    if (labels.length > 0) {
      line += '  ' + labels.join(' ↔ ');
    }
  }

  // Old Growth: show harmony
  if (level === 'old-growth') {
    const h = computeHarmony(rel);
    line += pc.dim(` (harmony=${h.harmony.toFixed(2)})`);
  }

  // Show time remaining for expiring contracts
  if (active && rel.contract.expiresAt) {
    const remaining = contractTimeRemaining(rel.contract, now);
    line += pc.dim(` expires in ${formatTimeRemaining(remaining)}`);
  }

  return line;
}

/**
 * Render a single relationship in detail (multi-line) format.
 */
export function renderRelationshipDetail(
  rel: TrustRelationship,
  level: DetailLevel,
  now: Date = new Date(),
): string {
  const active = isContractActive(rel.contract, now);
  const type = renderContractType(rel.contract.type);
  const renewTag = rel.contract.autoRenew ? ' ♻' : '';
  const renewCount = rel.contract.renewalCount > 0
    ? ` (renewed ${rel.contract.renewalCount}×)`
    : '';
  const statusText = active ? pc.green('ACTIVE') : pc.dim('EXPIRED');

  const lines: string[] = [];
  lines.push(`${rel.from} ↔ ${rel.to} — ${type}${renewTag} [${statusText}]${renewCount}`);

  // Sapling+: show labels
  if (level !== 'seedling') {
    if (rel.fromLabel || rel.toLabel) {
      const from = rel.fromLabel ? `"${rel.fromLabel}"` : '—';
      const to = rel.toLabel ? `"${rel.toLabel}"` : '—';
      lines.push(`  ${from} ↔ ${to}`);
    }
  }

  // Seedling: plain language description only
  if (level === 'seedling') {
    lines.push(`  ${describeAsymmetry(classifyAsymmetry(rel), 1)}`);
  }

  // Sapling: plain language + renewal info
  if (level === 'sapling') {
    lines.push(`  ${describeAsymmetry(classifyAsymmetry(rel), 2)}`);
  }

  // Old Growth: full numerical detail
  if (level === 'old-growth') {
    const asym = classifyAsymmetry(rel);
    lines.push(`  ${describeAsymmetry(asym, 3)}`);
    lines.push(`  ${rel.from}: ${describeVector(rel.fromVector)}`);
    lines.push(`  ${rel.to}: ${describeVector(rel.toVector)}`);
  }

  // Show time remaining
  if (active && rel.contract.expiresAt) {
    const remaining = contractTimeRemaining(rel.contract, now);
    lines.push(`  expires in ${formatTimeRemaining(remaining)}`);
  }

  return lines.join('\n');
}

/**
 * Render a list of relationships with header and summary.
 */
export function renderRelationshipList(
  handle: string,
  relationships: TrustRelationship[],
  level: DetailLevel,
  now: Date = new Date(),
): string {
  const active = relationships.filter(r => isContractActive(r.contract, now));
  const lines: string[] = [];

  if (active.length === 0) {
    lines.push('No active trust connections.');
    if (level === 'seedling') {
      lines.push(pc.dim('Use `wl trust add <handle>` to connect with someone.'));
    }
    return lines.join('\n');
  }

  lines.push(`Trust Connections (${active.length} active)`);
  lines.push('');

  for (const rel of active) {
    lines.push('  ' + renderRelationshipCompact(rel, level, now));
  }

  return lines.join('\n');
}

// ============================================================================
// Trust Overview (top-level summary)
// ============================================================================

/** Stats needed for the trust overview. */
export interface TrustOverviewStats {
  handle: string;
  trustLevel: number;
  activeConnections: number;
  bondCount: number;
  diversity?: GraphDiversity;
}

/**
 * Render the trust overview — the top-level summary a user sees.
 *
 * Seedling: handle, level, connection count
 * Sapling: + bond count, type breakdown
 * Old Growth: + graph diversity score, full stats
 */
export function renderTrustOverview(stats: TrustOverviewStats): string {
  const level = detailLevel(stats.trustLevel);
  const badge = renderTrustBadge(stats.trustLevel);
  const lines: string[] = [];

  lines.push(`${pc.bold(stats.handle)} — ${badge}`);
  lines.push(`${stats.activeConnections} active connection${stats.activeConnections === 1 ? '' : 's'}`);

  // Sapling+: bond count
  if (level !== 'seedling' && stats.bondCount > 0) {
    lines.push(`${stats.bondCount} multi-context bond${stats.bondCount === 1 ? '' : 's'}`);
  }

  // Old Growth: graph diversity
  if (level === 'old-growth' && stats.diversity) {
    const d = stats.diversity;
    lines.push(`Graph diversity: ${d.score.toFixed(2)} (${d.uniqueTypeCount}/5 types: ${d.typesPresent.join(', ')})`);
  }

  return lines.join('\n');
}

// ============================================================================
// Character Sheet Rendering
// ============================================================================

/**
 * Render a character sheet for the owner's view (full detail).
 */
export function renderCharacterSheet(sheet: CharacterSheet): string {
  const lines: string[] = [];

  lines.push(pc.bold(sheet.displayName) + (sheet.icon ? ` ${sheet.icon}` : ''));
  lines.push(pc.dim(`handle: ${sheet.handle}`));

  if (sheet.bio) lines.push(`  ${sheet.bio}`);
  if (sheet.homeCamp) lines.push(`  Camp: ${sheet.homeCamp}`);
  if (sheet.visibleSkills.length > 0) {
    lines.push(`  Skills: ${sheet.visibleSkills.join(', ')}`);
  }

  lines.push(`  Reputation visibility: ${sheet.reputationVisibility}`);

  const customKeys = Object.keys(sheet.customFields);
  if (customKeys.length > 0) {
    for (const key of customKeys) {
      lines.push(`  ${key}: ${sheet.customFields[key]}`);
    }
  }

  lines.push(pc.dim(`  Updated: ${sheet.updatedAt}`));

  return lines.join('\n');
}

/**
 * Render a public profile — what others see when they look someone up.
 *
 * The output respects the sheet's reputationVisibility setting AND
 * the viewer's trust level (progressive disclosure).
 */
export function renderPublicProfile(
  sheet: CharacterSheet,
  viewerTrustLevel: number,
): string {
  const level = detailLevel(viewerTrustLevel);
  const lines: string[] = [];

  lines.push(pc.bold(sheet.displayName) + (sheet.icon ? ` ${sheet.icon}` : ''));

  // Seedling: minimal info
  if (sheet.bio) lines.push(`  ${sheet.bio}`);
  if (sheet.homeCamp) lines.push(`  Camp: ${sheet.homeCamp}`);

  // Sapling+: skills
  if (level !== 'seedling' && sheet.visibleSkills.length > 0) {
    lines.push(`  Skills: ${sheet.visibleSkills.join(', ')}`);
  }

  // Sapling+: custom fields
  if (level !== 'seedling') {
    const customKeys = Object.keys(sheet.customFields);
    for (const key of customKeys) {
      lines.push(`  ${key}: ${sheet.customFields[key]}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Help Text
// ============================================================================

export const TRUST_HELP = `
Usage: wl trust [subcommand] [options]

Subcommands:
  (none)              List active trust connections
  add <handle>        Create a trust connection
  renew <contract-id> Renew an expiring contract
  drop <contract-id>  Archive a trust connection

Options:
  --type <type>       Contract type: permanent, long-term, event-scoped, project-scoped, ephemeral
  --time <0-1>        Shared time value (0 to 1)
  --depth <0-1>       Shared depth value (0 to 1)
  --label <label>     Your label for this connection
  --purge             Hard delete (with 'drop' subcommand)
  --json              Machine-readable output
  --execute           Execute write operations (dry-run by default)
  --help              Show this help
`.trim();

export const CHARACTER_HELP = `
Usage: wl character [subcommand] [options]

Subcommands:
  (none)              Show your character sheet
  set                 Create or update your character sheet

Options:
  --name <name>       Display name (playa name)
  --icon <icon>       Visual identity (emoji or text)
  --bio <bio>         Self-description
  --camp <camp>       Camp affiliation
  --visibility <v>    Reputation visibility: full, summary, minimal
  --execute           Execute write operations (dry-run by default)
  --help              Show this help
`.trim();

export const WHO_HELP = `
Usage: wl who <handle>

Look up a rig's public profile. Shows what they've chosen to share.

Options:
  --json              Machine-readable output
  --help              Show this help
`.trim();
