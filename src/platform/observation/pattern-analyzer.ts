import { PatternStore } from '../../core/storage/pattern-store.js';
import type { Pattern } from '../../core/types/pattern.js';
import type { SequenceRecord, ClusterId, OperationType } from './sequence-recorder.js';

/** A detected subsequence pattern with confidence */
export interface DetectedPattern {
  operations: OperationType[];
  count: number;
  confidence: number;
  agents: string[];
  avgTransitionDistance: number;
  clusterPath: ClusterId[];
}

/** Recommendation to reassign an agent from bridge-zone default */
export interface ClusterReassignment {
  agent: string;
  currentCluster: ClusterId;
  recommendedCluster: ClusterId;
  confidence: number;
  evidence: { cluster: ClusterId; score: number }[];
}

/** Hub capacity snapshot */
export interface HubCapacityReport {
  totalHandoffs: number;
  handoffsPerClusterPair: Record<string, number>;
  avgLatencyPerPair: Record<string, number>;
  bottleneckPairs: string[];
  clusterHealth: Record<ClusterId, 'healthy' | 'strained' | 'bottleneck'>;
}

/**
 * Analyzes SequenceRecorder output for high-confidence patterns,
 * cluster reassignment recommendations, and hub capacity metrics.
 *
 * Sam's tool: turns raw observation into actionable routing signals.
 */
export class PatternAnalyzer {
  private store: PatternStore;

  constructor(store: PatternStore) {
    this.store = store;
  }

  /** Extract all SequenceRecords from the workflows category */
  async getRecords(): Promise<SequenceRecord[]> {
    const patterns = await this.store.read('workflows');
    return patterns.map(p => p.data as unknown as SequenceRecord);
  }

  /**
   * Detect frequent operation subsequences (length 2 and 3).
   * Returns patterns sorted by count descending, filtered by minCount.
   */
  async detectPatterns(minCount = 2): Promise<DetectedPattern[]> {
    const records = await this.getRecords();
    if (records.length < 2) return [];

    // Group records by sequenceId to get ordered arcs
    const arcs = new Map<string, SequenceRecord[]>();
    for (const r of records) {
      const arc = arcs.get(r.sequenceId) ?? [];
      arc.push(r);
      arcs.set(r.sequenceId, arc);
    }

    // Sort each arc by step
    for (const arc of arcs.values()) {
      arc.sort((a, b) => a.step - b.step);
    }

    const subsequences = new Map<string, { records: SequenceRecord[][] }>();

    for (const arc of arcs.values()) {
      // Extract length-2 subsequences
      for (let i = 0; i < arc.length - 1; i++) {
        const key = `${arc[i].operationType}->${arc[i + 1].operationType}`;
        const entry = subsequences.get(key) ?? { records: [] };
        entry.records.push([arc[i], arc[i + 1]]);
        subsequences.set(key, entry);
      }

      // Extract length-3 subsequences
      for (let i = 0; i < arc.length - 2; i++) {
        const key = `${arc[i].operationType}->${arc[i + 1].operationType}->${arc[i + 2].operationType}`;
        const entry = subsequences.get(key) ?? { records: [] };
        entry.records.push([arc[i], arc[i + 1], arc[i + 2]]);
        subsequences.set(key, entry);
      }
    }

    const results: DetectedPattern[] = [];

    for (const [key, { records: occurrences }] of subsequences) {
      if (occurrences.length < minCount) continue;

      const operations = key.split('->') as OperationType[];
      const agents = [...new Set(occurrences.flatMap(occ => occ.map(r => r.agent)))];
      const distances = occurrences.flatMap(occ => occ.map(r => r.transitionDistance));
      const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;

      // Confidence: combination of frequency and classification confidence
      const avgRiskConf = occurrences.flatMap(occ => occ.map(r => r.riskConfidence));
      const meanRisk = avgRiskConf.length > 0
        ? avgRiskConf.reduce((a, b) => a + b, 0) / avgRiskConf.length
        : 0;
      // High count + low risk = high confidence pattern
      const confidence = Math.min(1.0, (occurrences.length / (occurrences.length + 2)) * (1 - meanRisk * 0.3));

      // Cluster path from first occurrence
      const clusterPath = [...new Set(occurrences[0].map(r => r.clusterSource))] as ClusterId[];

      results.push({
        operations,
        count: occurrences.length,
        confidence,
        agents,
        avgTransitionDistance: avgDist,
        clusterPath,
      });
    }

    return results.sort((a, b) => b.count - a.count);
  }

  /**
   * Recommend cluster reassignment for agents currently defaulted to bridge-zone.
   * Looks at their actual operation patterns to determine true cluster affinity.
   */
  async recommendReassignments(minTasks = 3): Promise<ClusterReassignment[]> {
    const records = await this.getRecords();

    // Group by agent
    const agentRecords = new Map<string, SequenceRecord[]>();
    for (const r of records) {
      const list = agentRecords.get(r.agent) ?? [];
      list.push(r);
      agentRecords.set(r.agent, list);
    }

    const reassignments: ClusterReassignment[] = [];

    for (const [agent, recs] of agentRecords) {
      if (recs.length < minTasks) continue;
      if (recs[0].clusterSource !== 'bridge-zone') continue; // Only reassign defaulted agents

      // Score affinity to each cluster based on operation types
      const scores: Record<ClusterId, number> = {
        'creative-nexus': 0,
        'bridge-zone': 0,
        'rigor-spine': 0,
      };

      for (const r of recs) {
        switch (r.operationType) {
          case 'ANALYZE': case 'DESIGN': case 'BUILD':
            scores['creative-nexus'] += 1;
            break;
          case 'SCOUT':
            scores['bridge-zone'] += 1;
            break;
          case 'PROPOSE': case 'VALIDATE': case 'CERTIFY': case 'GOVERN':
            scores['rigor-spine'] += 1;
            break;
        }
      }

      // Normalize to [0, 1]
      const total = Object.values(scores).reduce((a, b) => a + b, 0);
      if (total === 0) continue;
      const normalized = Object.fromEntries(
        Object.entries(scores).map(([k, v]) => [k, v / total])
      ) as Record<ClusterId, number>;

      // Find the best cluster
      const sorted = (Object.entries(normalized) as [ClusterId, number][])
        .sort((a, b) => b[1] - a[1]);
      const [bestCluster, bestScore] = sorted[0];

      // Only recommend if clearly better than bridge-zone and above threshold
      if (bestCluster !== 'bridge-zone' && bestScore > 0.5) {
        reassignments.push({
          agent,
          currentCluster: 'bridge-zone',
          recommendedCluster: bestCluster,
          confidence: bestScore,
          evidence: sorted.map(([cluster, score]) => ({ cluster, score })),
        });
      }
    }

    return reassignments.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Compute hub capacity metrics from workflow records.
   * Measures cross-cluster handoff volume and identifies bottlenecks.
   */
  async hubCapacity(): Promise<HubCapacityReport> {
    const records = await this.getRecords();

    const pairCounts: Record<string, number> = {};
    const pairTimestamps: Record<string, number[]> = {};
    let totalHandoffs = 0;

    for (const r of records) {
      if (r.clusterSource !== r.clusterTarget) {
        const pair = `${r.clusterSource}->${r.clusterTarget}`;
        pairCounts[pair] = (pairCounts[pair] ?? 0) + 1;
        const ts = pairTimestamps[pair] ?? [];
        ts.push(r.timestamp);
        pairTimestamps[pair] = ts;
        totalHandoffs++;
      }
    }

    // Compute average inter-event latency per pair
    const avgLatencyPerPair: Record<string, number> = {};
    for (const [pair, timestamps] of Object.entries(pairTimestamps)) {
      if (timestamps.length < 2) {
        avgLatencyPerPair[pair] = 0;
        continue;
      }
      const sorted = timestamps.sort((a, b) => a - b);
      let totalLatency = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalLatency += sorted[i] - sorted[i - 1];
      }
      avgLatencyPerPair[pair] = totalLatency / (sorted.length - 1);
    }

    // Identify bottleneck pairs: highest volume or highest latency
    const sortedByVolume = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
    const bottleneckPairs = sortedByVolume
      .filter(([, count]) => count > totalHandoffs * 0.4)
      .map(([pair]) => pair);

    // Cluster health based on inbound/outbound balance
    const clusterHealth: Record<ClusterId, 'healthy' | 'strained' | 'bottleneck'> = {
      'creative-nexus': 'healthy',
      'bridge-zone': 'healthy',
      'rigor-spine': 'healthy',
    };

    // A cluster is strained if it appears in >50% of handoff pairs, bottleneck if >70%
    const clusterIds: ClusterId[] = ['creative-nexus', 'bridge-zone', 'rigor-spine'];
    for (const cluster of clusterIds) {
      const involvement = Object.entries(pairCounts)
        .filter(([pair]) => pair.includes(cluster))
        .reduce((sum, [, count]) => sum + count, 0);
      const ratio = totalHandoffs > 0 ? involvement / totalHandoffs : 0;
      if (ratio > 0.7) clusterHealth[cluster] = 'bottleneck';
      else if (ratio > 0.5) clusterHealth[cluster] = 'strained';
    }

    return {
      totalHandoffs,
      handoffsPerClusterPair: pairCounts,
      avgLatencyPerPair,
      bottleneckPairs,
      clusterHealth,
    };
  }
}
