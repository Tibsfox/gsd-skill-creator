import type {
  ClassifiedEvent,
  PatchManifest,
  ImpactManifest,
  Briefing,
  DashboardAlert,
  BriefingTier,
  Severity,
} from './types';

/** Route a severity level to the briefing tiers it should appear in */
export function routeSeverity(severity: Severity): BriefingTier[] {
  switch (severity) {
    case 'P0': return ['flash'];
    case 'P1': return ['flash', 'session'];
    case 'P2': return ['session'];
    case 'P3': return ['weekly'];
  }
}

/** Generate a flash alert from a single classified event */
export function generateFlashAlert(change: ClassifiedEvent): DashboardAlert {
  return {
    id: `flash-${change.id}`,
    tier: 'flash',
    severity: change.severity,
    title: `[${change.severity}] ${change.change_type}: ${change.summary}`,
    summary: change.diff_summary,
    timestamp: change.timestamp,
    action_url: `https://docs.anthropic.com/changelog#${change.id}`,
  };
}

/** Build dashboard alerts for a set of changes based on the target tier */
function buildAlerts(tier: BriefingTier, changes: ClassifiedEvent[]): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  for (const change of changes) {
    const tiers = routeSeverity(change.severity);
    if (tiers.includes(tier) || tier === 'monthly') {
      alerts.push({
        id: `${tier}-${change.id}`,
        tier,
        severity: change.severity,
        title: `[${change.severity}] ${change.change_type}: ${change.summary}`,
        summary: change.diff_summary,
        timestamp: change.timestamp,
      });
    }
  }
  return alerts;
}

/** Generate a briefing for any tier */
export function generateBriefing(
  tier: BriefingTier,
  changes: ClassifiedEvent[],
  patches: PatchManifest[],
  pendingDecisions: ImpactManifest[],
): Briefing {
  return {
    tier,
    date: new Date().toISOString().slice(0, 10),
    changes,
    patches_applied: patches,
    pending_decisions: pendingDecisions,
    dashboard_alerts: buildAlerts(tier, changes),
  };
}

/** Generate a session briefing from changes and patches */
export function generateSessionBriefing(
  changes: ClassifiedEvent[],
  patches: PatchManifest[],
): Briefing {
  return generateBriefing('session', changes, patches, []);
}

/** Generate a weekly digest from changes and patches */
export function generateWeeklyDigest(
  changes: ClassifiedEvent[],
  patches: PatchManifest[],
): Briefing {
  return generateBriefing('weekly', changes, patches, []);
}

/** Generate a monthly report with trend analysis */
export function generateMonthlyReport(
  changes: ClassifiedEvent[],
  patches: PatchManifest[],
): Briefing {
  return generateBriefing('monthly', changes, patches, []);
}

/** Format a briefing as human-readable text */
export function formatBriefingText(briefing: Briefing): string {
  const lines: string[] = [];
  const tierLabel = briefing.tier.charAt(0).toUpperCase() + briefing.tier.slice(1);

  lines.push(`=== ${tierLabel} Briefing (${briefing.date}) ===`);
  lines.push('');

  if (briefing.changes.length === 0) {
    lines.push('No upstream changes detected.');
    return lines.join('\n');
  }

  // Group changes by type
  const byType = new Map<string, ClassifiedEvent[]>();
  for (const change of briefing.changes) {
    const group = byType.get(change.change_type) ?? [];
    group.push(change);
    byType.set(change.change_type, group);
  }

  // Summary overview
  lines.push(`Overview: ${briefing.changes.length} change(s) detected.`);
  lines.push('');

  // Changes by type
  for (const [type, events] of byType) {
    lines.push(`## ${type} (${events.length})`);
    for (const evt of events) {
      lines.push(`  - [${evt.severity}] ${evt.summary} (${evt.channel})`);
    }
    lines.push('');
  }

  // Patches applied
  if (briefing.patches_applied.length > 0) {
    lines.push(`## Patches Applied (${briefing.patches_applied.length})`);
    for (const patch of briefing.patches_applied) {
      lines.push(`  - ${patch.patch_id}: ${patch.target_skill} (${patch.patch_type})`);
    }
    lines.push('');
  }

  // Pending decisions
  if (briefing.pending_decisions.length > 0) {
    lines.push(`## Pending Decisions (${briefing.pending_decisions.length})`);
    for (const decision of briefing.pending_decisions) {
      lines.push(`  - ${decision.change_id}: ${decision.affected_components.length} component(s) affected`);
    }
    lines.push('');
  }

  // Trend analysis for monthly reports
  if (briefing.tier === 'monthly') {
    lines.push('## Trend Summary');
    const bySeverity = new Map<string, number>();
    for (const change of briefing.changes) {
      bySeverity.set(change.severity, (bySeverity.get(change.severity) ?? 0) + 1);
    }
    for (const [sev, count] of bySeverity) {
      lines.push(`  - ${sev}: ${count} change(s)`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
