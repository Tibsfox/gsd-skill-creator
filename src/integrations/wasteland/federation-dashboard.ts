/**
 * federation-dashboard.ts — Phase 6: Dashboard + Visibility
 *
 * Two adapters connecting the dashboard layer to wasteland federation:
 *
 * R6.1: buildFederationTopology — converts rigs/trust/towns into
 *       TopologyData-compatible graph for the dashboard renderer.
 *
 * R6.2: computeRigMetrics — rig activity metrics (heartbeat, timeline,
 *       emergent ratio) for federation health visualization.
 *
 * @module federation-dashboard
 */

// ============================================================================
// R6.1: Federation Topology Graph
// ============================================================================

/**
 * A rig node in the federation topology.
 */
export interface FederationNode {
  id: string;
  handle: string;
  trustLevel: number;
  rigType: 'human' | 'agent' | 'org';
  active: boolean;
}

/**
 * A relationship edge in the federation topology.
 */
export interface FederationEdge {
  from: string;
  to: string;
  relationship: 'stamped' | 'endorsed' | 'collaborated';
  weight: number;
}

/**
 * Federation topology data for dashboard rendering.
 */
export interface FederationTopology {
  nodes: FederationNode[];
  edges: FederationEdge[];
  trustDistribution: Record<number, number>;
  activeCount: number;
  totalCount: number;
}

/**
 * Input data for building federation topology.
 */
export interface FederationTopologyInput {
  rigs: Array<{
    handle: string;
    trustLevel: number;
    rigType: 'human' | 'agent' | 'org';
    lastSeen?: string;
  }>;
  stamps: Array<{
    author: string;
    completedBy: string;
  }>;
  activeDays?: number;
}

/**
 * Build a federation topology graph from rig and stamp data.
 *
 * Maps to the dashboard's TopologyData shape:
 * - Rigs become nodes (positioned by trust level)
 * - Stamps become edges (author → completedBy)
 * - Active status determined by recency (default: 7 days)
 */
export function buildFederationTopology(input: FederationTopologyInput): FederationTopology {
  const activeDays = input.activeDays ?? 7;
  const cutoff = Date.now() - activeDays * 24 * 60 * 60 * 1000;

  const nodes: FederationNode[] = input.rigs.map(rig => ({
    id: `rig:${rig.handle}`,
    handle: rig.handle,
    trustLevel: rig.trustLevel,
    rigType: rig.rigType,
    active: rig.lastSeen ? new Date(rig.lastSeen).getTime() > cutoff : false,
  }));

  // Build edges from stamp relationships
  const edgeMap = new Map<string, FederationEdge>();
  for (const stamp of input.stamps) {
    const key = `${stamp.author}→${stamp.completedBy}`;
    const existing = edgeMap.get(key);
    if (existing) {
      existing.weight++;
    } else {
      edgeMap.set(key, {
        from: `rig:${stamp.author}`,
        to: `rig:${stamp.completedBy}`,
        relationship: 'stamped',
        weight: 1,
      });
    }
  }

  // Trust distribution
  const trustDistribution: Record<number, number> = {};
  for (const node of nodes) {
    trustDistribution[node.trustLevel] = (trustDistribution[node.trustLevel] ?? 0) + 1;
  }

  return {
    nodes,
    edges: [...edgeMap.values()],
    trustDistribution,
    activeCount: nodes.filter(n => n.active).length,
    totalCount: nodes.length,
  };
}

// ============================================================================
// R6.2: Rig Activity Metrics
// ============================================================================

/**
 * Activity metrics for a single rig.
 */
export interface RigMetrics {
  handle: string;
  completionsTotal: number;
  stampsReceived: number;
  stampsGiven: number;
  avgValence: number;
  daysSinceLastActivity: number;
  heartbeatStatus: 'active' | 'idle' | 'dormant';
  activityTimeline: Array<{ date: string; count: number }>;
}

/**
 * Federation-wide health metrics.
 */
export interface FederationHealth {
  totalRigs: number;
  activeRigs: number;
  totalCompletions: number;
  totalStamps: number;
  avgTrustLevel: number;
  healthScore: number;
  emergentRatio: number;
}

/**
 * Compute activity metrics for a single rig.
 */
export function computeRigMetrics(data: {
  handle: string;
  completions: Array<{ completedAt: string }>;
  stampsReceived: Array<{ valence?: Record<string, number> }>;
  stampsGiven: number;
}): RigMetrics {
  const now = Date.now();

  // Find most recent activity
  const timestamps = data.completions.map(c => new Date(c.completedAt).getTime());
  const lastActivity = timestamps.length > 0 ? Math.max(...timestamps) : 0;
  const daysSinceLastActivity = lastActivity > 0
    ? Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000))
    : Infinity;

  // Heartbeat status
  let heartbeatStatus: 'active' | 'idle' | 'dormant';
  if (daysSinceLastActivity <= 7) heartbeatStatus = 'active';
  else if (daysSinceLastActivity <= 30) heartbeatStatus = 'idle';
  else heartbeatStatus = 'dormant';

  // Average valence across all received stamps
  const valenceValues: number[] = [];
  for (const stamp of data.stampsReceived) {
    if (stamp.valence) {
      const dims = Object.values(stamp.valence);
      if (dims.length > 0) {
        valenceValues.push(dims.reduce((a, b) => a + b, 0) / dims.length);
      }
    }
  }
  const avgValence = valenceValues.length > 0
    ? valenceValues.reduce((a, b) => a + b, 0) / valenceValues.length
    : 0;

  // Activity timeline (last 30 days, grouped by date)
  const timelineMap = new Map<string, number>();
  for (const c of data.completions) {
    const date = c.completedAt.slice(0, 10); // YYYY-MM-DD
    timelineMap.set(date, (timelineMap.get(date) ?? 0) + 1);
  }
  const activityTimeline = [...timelineMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    handle: data.handle,
    completionsTotal: data.completions.length,
    stampsReceived: data.stampsReceived.length,
    stampsGiven: data.stampsGiven,
    avgValence,
    daysSinceLastActivity,
    heartbeatStatus,
    activityTimeline,
  };
}

/**
 * Compute federation-wide health metrics.
 *
 * Emergent ratio: proportion of active rigs that have given stamps
 * (contributing back to the community, not just consuming).
 */
export function computeFederationHealth(data: {
  rigs: Array<{ trustLevel: number; active: boolean }>;
  completionsTotal: number;
  stampsTotal: number;
  activeGivers: number;
}): FederationHealth {
  const totalRigs = data.rigs.length;
  const activeRigs = data.rigs.filter(r => r.active).length;
  const avgTrustLevel = totalRigs > 0
    ? data.rigs.reduce((sum, r) => sum + r.trustLevel, 0) / totalRigs
    : 0;

  // Emergent ratio: how many active rigs are giving back
  const emergentRatio = activeRigs > 0
    ? data.activeGivers / activeRigs
    : 0;

  // Health score: weighted combination
  const activityScore = totalRigs > 0 ? activeRigs / totalRigs : 0;
  const trustScore = avgTrustLevel / 3; // Normalize to 0-1
  const engagementScore = emergentRatio;
  const healthScore = Math.min(1, activityScore * 0.4 + trustScore * 0.3 + engagementScore * 0.3);

  return {
    totalRigs,
    activeRigs,
    totalCompletions: data.completionsTotal,
    totalStamps: data.stampsTotal,
    avgTrustLevel: Math.round(avgTrustLevel * 100) / 100,
    healthScore: Math.round(healthScore * 100) / 100,
    emergentRatio: Math.round(emergentRatio * 100) / 100,
  };
}
