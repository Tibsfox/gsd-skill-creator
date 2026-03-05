/**
 * Human-Readable Dashboard — Layer 3, Wave 3
 *
 * Operator oversight dashboard combining data from all pipeline layers.
 * Displays active teams, pending recommendations, failure patterns,
 * and approve/veto interface. Terminal-friendly text rendering.
 */

import type {
  DashboardView,
  TeamDashboardEntry,
  Recommendation,
  FailureSignature,
  MetaLearningInsights,
  TownGraph,
  TeamScore,
  ClusteringOutput,
} from './types.js';

// ============================================================================
// Dashboard Assembly
// ============================================================================

/**
 * Assemble a dashboard view from all pipeline outputs.
 */
export function assembleDashboard(
  teams: TeamDashboardEntry[],
  recommendations: Recommendation[],
  failureSignatures: FailureSignature[],
  metaLearning: MetaLearningInsights,
  topology: TownGraph,
): DashboardView {
  return {
    teams,
    pendingRecommendations: recommendations.filter(r => r.confidence >= 0.7),
    failurePatterns: failureSignatures.sort((a, b) => b.occurrences - a.occurrences),
    metaLearning,
    townTopology: topology,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Convert a TeamScore to a dashboard entry.
 */
export function teamToDashboardEntry(
  score: TeamScore,
  tasksCompleted: number = 0,
  avgSuccessRate: number = 0,
): TeamDashboardEntry {
  return {
    teamId: score.teamId,
    members: score.members,
    score: score.overallScore,
    tasksCompleted,
    avgSuccessRate,
    status: score.confidence > 0.7 ? 'active' : 'pending',
  };
}

// ============================================================================
// Text Rendering (Terminal-Friendly)
// ============================================================================

/**
 * Render the complete dashboard as a terminal-friendly string.
 */
export function renderDashboard(view: DashboardView): string {
  const sections: string[] = [];

  // Header
  sections.push(renderHeader(view));

  // Teams
  sections.push(renderTeamsSection(view.teams));

  // Pending recommendations
  sections.push(renderRecommendationsSection(view.pendingRecommendations));

  // Failure patterns
  sections.push(renderFailurePatternsSection(view.failurePatterns));

  // Meta-learning insights
  sections.push(renderMetaLearningSection(view.metaLearning));

  // Town topology summary
  sections.push(renderTopologySection(view.townTopology));

  return sections.join('\n\n');
}

function renderHeader(view: DashboardView): string {
  return [
    '=' .repeat(72),
    '  WASTELAND FEDERATION DASHBOARD',
    `  Last updated: ${view.lastUpdated}`,
    '='.repeat(72),
  ].join('\n');
}

function renderTeamsSection(teams: TeamDashboardEntry[]): string {
  if (teams.length === 0) return '-- ACTIVE TEAMS --\n  No active teams.';

  const header = '-- ACTIVE TEAMS --';
  const tableHeader = '  Team ID            | Members | Score | Tasks | Success | Status';
  const separator = '  ' + '-'.repeat(68);

  const rows = teams.map(t =>
    `  ${t.teamId.padEnd(20)}| ${String(t.members.length).padEnd(8)}| ` +
    `${t.score.toFixed(2).padEnd(6)}| ${String(t.tasksCompleted).padEnd(6)}| ` +
    `${(t.avgSuccessRate * 100).toFixed(0).padEnd(8)}%| ${t.status}`
  );

  return [header, tableHeader, separator, ...rows].join('\n');
}

function renderRecommendationsSection(recs: Recommendation[]): string {
  if (recs.length === 0) return '-- PENDING RECOMMENDATIONS --\n  No pending recommendations.';

  const header = '-- PENDING RECOMMENDATIONS --';
  const rows = recs.map(r =>
    `  [${r.type}] ${r.reasoning}\n` +
    `    Confidence: ${r.confidence.toFixed(3)} | Evidence: ${r.evidenceChain.length} items`
  );

  return [header, ...rows].join('\n');
}

function renderFailurePatternsSection(signatures: FailureSignature[]): string {
  if (signatures.length === 0) return '-- FAILURE PATTERNS --\n  No failure patterns detected.';

  const header = '-- FAILURE PATTERNS --';
  const rows = signatures.slice(0, 5).map(s =>
    `  [${s.failureClass}] ${s.taskType} (${s.occurrences}x)\n` +
    `    Action: ${s.preventativeAction}`
  );

  return [header, ...rows].join('\n');
}

function renderMetaLearningSection(meta: MetaLearningInsights): string {
  const header = '-- META-LEARNING INSIGHTS --';
  const rows = [
    `  Most impactful type: ${meta.mostImpactfulType}`,
    `  Least reliable type: ${meta.leastReliableType}`,
    `  Pending evaluations: ${meta.pendingEvaluationCount}`,
    `  Expired: ${meta.expiredCount}`,
  ];

  const typeRates = Object.entries(meta.typeSuccessRates)
    .map(([type, rate]) => `    ${type}: ${(rate * 100).toFixed(0)}%`)
    .join('\n');

  if (typeRates) {
    rows.push('  Success rates by type:');
    rows.push(typeRates);
  }

  if (meta.recommendations.length > 0) {
    rows.push('  Recommendations:');
    for (const rec of meta.recommendations) {
      rows.push(`    - ${rec}`);
    }
  }

  return [header, ...rows].join('\n');
}

function renderTopologySection(graph: TownGraph): string {
  const header = '-- TOWN TOPOLOGY --';
  const rows = [
    `  Towns: ${graph.nodes.length} | Edges: ${graph.edges.length}`,
  ];

  // Top 3 towns by centrality
  const sorted = [...graph.nodes].sort((a, b) => b.betweennessCentrality - a.betweennessCentrality);
  if (sorted.length > 0) {
    rows.push('  Highest centrality:');
    for (const node of sorted.slice(0, 3)) {
      rows.push(`    ${node.townId}: ${node.betweennessCentrality.toFixed(3)} ` +
        `(${node.agentCount} agents, ${node.throughput} completed)`);
    }
  }

  return [header, ...rows].join('\n');
}

// ============================================================================
// Approve / Veto Actions
// ============================================================================

/** Action result from approve/veto */
export interface ActionResult {
  recommendationId: string;
  action: 'approved' | 'vetoed';
  timestamp: string;
  reason?: string;
}

/**
 * Approve a recommendation for application.
 */
export function approveRecommendation(
  recommendationId: string,
  reason?: string,
): ActionResult {
  return {
    recommendationId,
    action: 'approved',
    timestamp: new Date().toISOString(),
    reason,
  };
}

/**
 * Veto a recommendation, preventing application.
 */
export function vetoRecommendation(
  recommendationId: string,
  reason: string,
): ActionResult {
  return {
    recommendationId,
    action: 'vetoed',
    timestamp: new Date().toISOString(),
    reason,
  };
}
