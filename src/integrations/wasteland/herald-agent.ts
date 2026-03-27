/**
 * Herald Agent Prototype — Wasteland Intelligence Briefing Composer
 *
 * The herald is the final stage of the upstream intelligence pipeline.
 * It takes classified events, patch manifests, and impact traces, then
 * composes multi-tier briefings (flash, session, weekly, monthly) with
 * progressive disclosure. Routes output to terminal and/or Dolt storage.
 *
 * Three disclosure tiers per briefing:
 * - glance: one-line summary (terminal badge)
 * - scan: grouped overview with counts
 * - read: full detail with diffs and recommendations
 *
 * @module herald-agent
 */

import type {
  ClassifiedEvent,
  PatchManifest,
  ImpactManifest,
  Briefing,
  BriefingTier,
  Severity,
  DashboardAlert,
} from '../upstream/types.js';

// ============================================================================
// Types
// ============================================================================

/** Disclosure depth for rendered output */
export type DisclosureLevel = 'glance' | 'scan' | 'read';

/** Herald configuration */
export interface HeraldConfig {
  /** Minimum severity to trigger flash alerts */
  flashThreshold: Severity;
  /** Include patch diffs in read-level output */
  includeDiffs: boolean;
  /** Maximum age in days for events included in weekly/monthly digests */
  maxEventAgeDays: number;
  /** Enable Dolt persistence for briefings */
  persistToDolt: boolean;
}

/** A rendered briefing at a specific disclosure level */
export interface RenderedBriefing {
  tier: BriefingTier;
  level: DisclosureLevel;
  text: string;
  alertCount: number;
  patchCount: number;
  pendingCount: number;
}

/** Herald run result */
export interface HeraldResult {
  briefings: RenderedBriefing[];
  flashAlerts: DashboardAlert[];
  totalEvents: number;
  totalPatches: number;
  totalPending: number;
}

/** Input data for a herald run */
export interface HeraldInput {
  events: ClassifiedEvent[];
  patches: PatchManifest[];
  impacts: ImpactManifest[];
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_HERALD_CONFIG: HeraldConfig = {
  flashThreshold: 'P1',
  includeDiffs: false,
  maxEventAgeDays: 30,
  persistToDolt: false,
};

const SEVERITY_RANK: Record<Severity, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Determine which briefing tiers an event should appear in
 * based on its severity.
 */
export function routeToTiers(severity: Severity): BriefingTier[] {
  switch (severity) {
    case 'P0': return ['flash', 'session', 'weekly', 'monthly'];
    case 'P1': return ['flash', 'session', 'weekly', 'monthly'];
    case 'P2': return ['session', 'weekly', 'monthly'];
    case 'P3': return ['weekly', 'monthly'];
  }
}

/**
 * Filter events by severity threshold.
 * Returns events at or above the given severity.
 */
export function filterBySeverity(
  events: ClassifiedEvent[],
  threshold: Severity,
): ClassifiedEvent[] {
  const rank = SEVERITY_RANK[threshold];
  return events.filter(e => SEVERITY_RANK[e.severity] <= rank);
}

/**
 * Filter events by maximum age in days.
 */
export function filterByAge(
  events: ClassifiedEvent[],
  maxAgeDays: number,
  now: Date = new Date(),
): ClassifiedEvent[] {
  const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  return events.filter(e => new Date(e.timestamp).getTime() >= cutoff);
}

/**
 * Group events by change type for summary rendering.
 */
export function groupByType(
  events: ClassifiedEvent[],
): Map<string, ClassifiedEvent[]> {
  const groups = new Map<string, ClassifiedEvent[]>();
  for (const event of events) {
    const group = groups.get(event.change_type) ?? [];
    group.push(event);
    groups.set(event.change_type, group);
  }
  return groups;
}

/**
 * Count events by severity for summary stats.
 */
export function countBySeverity(
  events: ClassifiedEvent[],
): Record<Severity, number> {
  const counts: Record<Severity, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const event of events) {
    counts[event.severity]++;
  }
  return counts;
}

// ============================================================================
// Rendering
// ============================================================================

/**
 * Render a briefing at glance level — one-line summary.
 */
export function renderGlance(
  tier: BriefingTier,
  events: ClassifiedEvent[],
  patches: PatchManifest[],
  pending: ImpactManifest[],
): string {
  if (events.length === 0) return `[${tier}] No upstream changes.`;

  const counts = countBySeverity(events);
  const parts: string[] = [];
  if (counts.P0 > 0) parts.push(`${counts.P0} P0`);
  if (counts.P1 > 0) parts.push(`${counts.P1} P1`);
  if (counts.P2 > 0) parts.push(`${counts.P2} P2`);
  if (counts.P3 > 0) parts.push(`${counts.P3} P3`);

  const patchNote = patches.length > 0 ? `, ${patches.length} patched` : '';
  const pendingNote = pending.length > 0 ? `, ${pending.length} pending` : '';

  return `[${tier}] ${events.length} change(s): ${parts.join(', ')}${patchNote}${pendingNote}`;
}

/**
 * Render a briefing at scan level — grouped overview.
 */
export function renderScan(
  tier: BriefingTier,
  events: ClassifiedEvent[],
  patches: PatchManifest[],
  pending: ImpactManifest[],
): string {
  const lines: string[] = [];
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  lines.push(`=== ${tierLabel} Briefing ===`);

  if (events.length === 0) {
    lines.push('No upstream changes detected.');
    return lines.join('\n');
  }

  lines.push(`${events.length} change(s), ${patches.length} patched, ${pending.length} pending`);
  lines.push('');

  const groups = groupByType(events);
  for (const [type, group] of groups) {
    lines.push(`${type} (${group.length}):`);
    for (const evt of group) {
      lines.push(`  [${evt.severity}] ${evt.summary}`);
    }
  }

  return lines.join('\n');
}

/**
 * Render a briefing at read level — full detail.
 */
export function renderRead(
  tier: BriefingTier,
  events: ClassifiedEvent[],
  patches: PatchManifest[],
  pending: ImpactManifest[],
  includeDiffs: boolean,
): string {
  const lines: string[] = [];
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const date = new Date().toISOString().slice(0, 10);
  lines.push(`=== ${tierLabel} Briefing (${date}) ===`);
  lines.push('');

  if (events.length === 0) {
    lines.push('No upstream changes detected.');
    return lines.join('\n');
  }

  // Severity summary
  const counts = countBySeverity(events);
  lines.push('Severity: ' + Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${s}=${n}`)
    .join(', '));
  lines.push('');

  // Detailed events
  lines.push('## Changes');
  for (const evt of events) {
    lines.push(`### [${evt.severity}] ${evt.change_type}: ${evt.summary}`);
    lines.push(`Channel: ${evt.channel} | Confidence: ${(evt.confidence * 100).toFixed(0)}%`);
    if (evt.diff_summary) lines.push(`Diff: ${evt.diff_summary}`);
    lines.push('');
  }

  // Patches
  if (patches.length > 0) {
    lines.push('## Patches Applied');
    for (const patch of patches) {
      lines.push(`- ${patch.patch_id}: ${patch.target_skill} (${patch.patch_type})`);
      lines.push(`  Auto-approved: ${patch.auto_approved}`);
      if (includeDiffs && patch.diff.length > 0) {
        for (const d of patch.diff) {
          lines.push(`  File: ${d.path}`);
        }
      }
    }
    lines.push('');
  }

  // Pending decisions
  if (pending.length > 0) {
    lines.push('## Pending Decisions');
    for (const impact of pending) {
      lines.push(`- ${impact.change_id}: ${impact.affected_components.length} component(s)`);
      for (const comp of impact.affected_components) {
        lines.push(`  - ${comp.component}: ${comp.action} (${comp.blast_radius})`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Herald Agent
// ============================================================================

/**
 * Run the herald agent: compose briefings at all relevant tiers
 * and disclosure levels for the given input.
 */
export function runHerald(
  input: HeraldInput,
  config: HeraldConfig = DEFAULT_HERALD_CONFIG,
): HeraldResult {
  const { events, patches, impacts } = input;

  // Filter by age
  const recentEvents = filterByAge(events, config.maxEventAgeDays);

  // Determine which tiers need briefings
  const tiersNeeded = new Set<BriefingTier>();
  for (const event of recentEvents) {
    for (const tier of routeToTiers(event.severity)) {
      tiersNeeded.add(tier);
    }
  }

  // Build flash alerts for high-severity events
  const flashEvents = filterBySeverity(recentEvents, config.flashThreshold);
  const flashAlerts: DashboardAlert[] = flashEvents.map(event => ({
    id: `flash-${event.id}`,
    tier: 'flash' as BriefingTier,
    severity: event.severity,
    title: `[${event.severity}] ${event.change_type}: ${event.summary}`,
    summary: event.diff_summary,
    timestamp: event.timestamp,
  }));

  // Generate rendered briefings at all three disclosure levels
  const briefings: RenderedBriefing[] = [];
  for (const tier of tiersNeeded) {
    const tierEvents = recentEvents.filter(e => routeToTiers(e.severity).includes(tier));

    for (const level of ['glance', 'scan', 'read'] as DisclosureLevel[]) {
      let text: string;
      switch (level) {
        case 'glance':
          text = renderGlance(tier, tierEvents, patches, impacts);
          break;
        case 'scan':
          text = renderScan(tier, tierEvents, patches, impacts);
          break;
        case 'read':
          text = renderRead(tier, tierEvents, patches, impacts, config.includeDiffs);
          break;
      }

      briefings.push({
        tier,
        level,
        text,
        alertCount: tierEvents.length,
        patchCount: patches.length,
        pendingCount: impacts.length,
      });
    }
  }

  return {
    briefings,
    flashAlerts,
    totalEvents: recentEvents.length,
    totalPatches: patches.length,
    totalPending: impacts.length,
  };
}
