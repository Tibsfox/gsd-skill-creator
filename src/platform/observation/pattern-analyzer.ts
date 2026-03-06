/**
 * pattern-analyzer.ts — Pattern Intelligence: Workflow Pattern Detection
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * PatternAnalyzer reads SequenceRecords from PatternStore 'workflows' and produces
 * three kinds of intelligence:
 *
 *   detectPatterns()         — find frequently repeated operation subsequences
 *   recommendReassignments() — suggest cluster moves for bridge-zone-defaulted agents
 *   hubCapacity()            — measure cross-cluster handoff volume and bottlenecks
 *
 * This is Sam's tool: turning raw observation data into actionable routing signals.
 *
 * WHY PATTERN ANALYSIS EXISTS
 * ---------------------------
 * SequenceRecorder observes and stores. PatternAnalyzer makes those observations
 * useful. Without analysis, 105 workflow records are just a JSONL file. With
 * analysis, they become: "ANALYZE→BUILD appears 8 times, mostly by lex-cluster agents,
 * with low transition distance — this is a reliable pattern."
 *
 * From CENTERCAMP-PERSONAL-JOURNAL, "The Story of Creator's Arc":
 * "The pattern was already in the data. PatternAnalyzer just made it visible."
 * This is the philosophy behind detectPatterns(): not inference, but visibility.
 *
 * PATTERN DETECTION ALGORITHM
 * ---------------------------
 * detectPatterns() extracts length-2 and length-3 operation subsequences from arcs.
 *
 * Algorithm:
 *   1. Load all SequenceRecords from PatternStore 'workflows'
 *   2. Group records by sequenceId (each sequenceId is one arc)
 *   3. Sort each arc by step number (restore temporal ordering)
 *   4. Extract all 2-grams and 3-grams from each arc
 *   5. Count occurrences of each unique n-gram key (e.g., "ANALYZE->BUILD")
 *   6. Filter by minCount (default 2 — must appear at least twice to be a pattern)
 *   7. Score each pattern by frequency + inverse risk (high count + low risk = confident)
 *   8. Return sorted by count descending
 *
 * The key insight: Creator's Arc (ANALYZE→DESIGN→BUILD) appeared in Phase 2b data
 * without being pre-specified. The algorithm found it by counting subsequences.
 *
 * CONFIDENCE SCORING
 * ------------------
 * Pattern confidence = min(1.0, (count / (count + 2)) * (1 - meanRisk * 0.3))
 *
 * This formula balances frequency and safety:
 * - count/(count+2) approaches 1.0 as count grows (frequency signal)
 * - (1 - meanRisk * 0.3) reduces confidence for high-risk patterns
 *   (a pattern that often triggers risk flags is less reliable)
 *
 * Result: frequently-observed, low-risk patterns get highest confidence.
 * Rare or high-risk patterns get lower confidence, reducing false promotion signals.
 *
 * CLUSTER REASSIGNMENT
 * --------------------
 * recommendReassignments() identifies agents that default to bridge-zone but
 * consistently perform work characteristic of other clusters.
 *
 * How it works:
 *   - Only evaluates agents currently assigned to bridge-zone (the default)
 *   - Scores each agent's operations against cluster affinity rules:
 *     ANALYZE/DESIGN/BUILD → creative-nexus affinity
 *     SCOUT                → bridge-zone affinity
 *     PROPOSE/VALIDATE/CERTIFY/GOVERN → rigor-spine affinity
 *   - Normalizes scores to [0, 1]
 *   - If best cluster ≠ bridge-zone AND score > 0.5, recommend reassignment
 *
 * This implements the self-calibrating topology vision from Batch 1:
 * "Agents improve by being routed correctly. Routing improves as agents' actual
 * behavior patterns reveal their true cluster affinity."
 *
 * Minimum tasks: 3 (minTasks parameter). Fewer than 3 operations is too little
 * data to make a confident reassignment recommendation.
 *
 * HUB CAPACITY ANALYSIS
 * ---------------------
 * hubCapacity() measures the load on cross-cluster boundaries:
 *   - How many handoffs cross each cluster pair?
 *   - What is the average inter-handoff latency per pair?
 *   - Which pairs are bottlenecks (> 40% of all handoffs)?
 *   - Are any clusters strained (> 50%) or bottlenecks (> 70%)?
 *
 * This is a health monitoring signal: if bridge-zone handles 80% of all
 * cross-cluster handoffs, it may be overwhelmed. The health assessment
 * flags it so operators can route work differently.
 *
 * Note: In Phase 2b, all agents defaulted to bridge-zone (cluster map not extended),
 * so all transitions were intra-cluster (distance=0.0). Hub capacity shows 0 handoffs
 * in this case — normal behavior. Real hub capacity analysis requires extended
 * DEFAULT_CLUSTER_MAP with diverse cluster assignments.
 *
 * READING FROM PATTERNSTORE
 * --------------------------
 * All three methods call getRecords() which reads PatternStore 'workflows'.
 * This means every analysis call reads from disk. For small datasets (< 10K records),
 * this is fine. For large datasets, consider caching getRecords() between calls.
 *
 * @see SequenceRecorder (sequence-recorder.ts) — writes the workflow records analyzed here
 * @see PatternStore (core/storage/pattern-store.ts) — the durable JSONL backing store
 * @see ClusterTranslator (cluster-translator.ts) — translates analysis into human guidance
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "The Story of Creator's Arc" on pattern visibility
 * @see BATCH-3-RETROSPECTIVE.md — Sam's debrief on PatternStore as load-bearing infrastructure
 */

import { PatternStore } from '../../core/storage/pattern-store.js';
import type { Pattern } from '../../core/types/pattern.js';
import type { SequenceRecord, ClusterId, OperationType } from './sequence-recorder.js';

/**
 * A detected subsequence pattern with confidence.
 * operations: the sequence of operation types (e.g., ['ANALYZE', 'BUILD'])
 * count: how many times this subsequence appeared across all arcs
 * confidence: composite score (frequency + inverse risk) — higher is more reliable
 * agents: which agents exhibited this pattern
 * avgTransitionDistance: mean cluster distance within this pattern's occurrences
 * clusterPath: which clusters were involved (from first occurrence)
 */
export interface DetectedPattern {
  operations: OperationType[];
  count: number;
  confidence: number;
  agents: string[];
  avgTransitionDistance: number;
  clusterPath: ClusterId[];
}

/**
 * Recommendation to reassign an agent from bridge-zone default to a more
 * appropriate cluster based on observed operation type behavior.
 *
 * confidence: affinity score for recommendedCluster (0 to 1, must be > 0.5)
 * evidence: scored rankings for all clusters (for transparency)
 */
export interface ClusterReassignment {
  agent: string;
  currentCluster: ClusterId;
  recommendedCluster: ClusterId;
  confidence: number;
  evidence: { cluster: ClusterId; score: number }[];
}

/**
 * Hub capacity snapshot for the current workflow records.
 * Measures load distribution across cluster pair boundaries.
 *
 * bottleneckPairs: pairs where a single cluster pair handles > 40% of all handoffs
 * clusterHealth: 'healthy' | 'strained' | 'bottleneck' per cluster
 */
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
 *
 * Stateless analysis: each method call reads fresh data from PatternStore.
 * No internal state — safe to use as a singleton.
 */
export class PatternAnalyzer {
  private store: PatternStore;

  constructor(store: PatternStore) {
    this.store = store;
  }

  /**
   * Extract all SequenceRecords from the workflows category.
   * All analysis methods start here — shared data loading.
   */
  async getRecords(): Promise<SequenceRecord[]> {
    const patterns = await this.store.read('workflows');
    return patterns.map(p => p.data as unknown as SequenceRecord);
  }

  /**
   * Detect frequent operation subsequences (length 2 and 3).
   * Returns patterns sorted by count descending, filtered by minCount.
   *
   * This is the method that found Creator's Arc in Phase 2b:
   * ANALYZE→BUILD (alpha's dominant arc) emerged without being pre-specified.
   * The algorithm counted subsequences and the pattern was already there.
   *
   * minCount = 2 means "must appear at least twice to be a pattern." This
   * prevents one-off sequences from being reported as patterns.
   *
   * @param minCount - Minimum occurrence count for pattern inclusion (default 2)
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

    // Sort each arc by step — restore temporal ordering within each arc
    for (const arc of arcs.values()) {
      arc.sort((a, b) => a.step - b.step);
    }

    // Extract subsequences: both 2-grams and 3-grams
    const subsequences = new Map<string, { records: SequenceRecord[][] }>();

    for (const arc of arcs.values()) {
      // Extract length-2 subsequences (bigrams)
      for (let i = 0; i < arc.length - 1; i++) {
        const key = `${arc[i].operationType}->${arc[i + 1].operationType}`;
        const entry = subsequences.get(key) ?? { records: [] };
        entry.records.push([arc[i], arc[i + 1]]);
        subsequences.set(key, entry);
      }

      // Extract length-3 subsequences (trigrams)
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

      // Confidence: combination of frequency and inverse risk
      // High count + low risk = high confidence pattern
      const avgRiskConf = occurrences.flatMap(occ => occ.map(r => r.riskConfidence));
      const meanRisk = avgRiskConf.length > 0
        ? avgRiskConf.reduce((a, b) => a + b, 0) / avgRiskConf.length
        : 0;
      // count/(count+2) approaches 1.0 as frequency grows; risk factor reduces confidence
      const confidence = Math.min(1.0, (occurrences.length / (occurrences.length + 2)) * (1 - meanRisk * 0.3));

      // Cluster path from first occurrence — shows which clusters this pattern traverses
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
   *
   * Only agents in bridge-zone are considered — agents already in correct clusters
   * don't need reassignment. This is the self-calibrating topology mechanism.
   *
   * Operation type → cluster affinity mapping:
   *   ANALYZE, DESIGN, BUILD → creative-nexus (generative, construction work)
   *   SCOUT                  → bridge-zone (reconnaissance, stays in middle)
   *   PROPOSE, VALIDATE, CERTIFY, GOVERN → rigor-spine (standards, verification)
   *
   * @param minTasks - Minimum operations required for a reassignment recommendation
   */
  async recommendReassignments(minTasks = 3): Promise<ClusterReassignment[]> {
    const records = await this.getRecords();

    // Group by agent for per-agent analysis
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

      // Normalize scores to [0, 1] for comparable confidence values
      const total = Object.values(scores).reduce((a, b) => a + b, 0);
      if (total === 0) continue;
      const normalized = Object.fromEntries(
        Object.entries(scores).map(([k, v]) => [k, v / total])
      ) as Record<ClusterId, number>;

      // Find the best cluster by normalized affinity score
      const sorted = (Object.entries(normalized) as [ClusterId, number][])
        .sort((a, b) => b[1] - a[1]);
      const [bestCluster, bestScore] = sorted[0];

      // Only recommend if clearly better than bridge-zone AND above 0.5 threshold
      // 0.5 means the agent spends > 50% of operations in the best cluster's work type
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
   *
   * Only cross-cluster records (source !== target) contribute to handoff counts.
   * Intra-cluster records (same cluster) represent normal work, not hub load.
   *
   * Bottleneck detection: a pair is a bottleneck if it handles > 40% of total handoffs.
   * Cluster health: strained at > 50% involvement, bottleneck at > 70%.
   *
   * Note: Phase 2b data shows 0 handoffs because all agents defaulted to bridge-zone.
   * Hub capacity becomes meaningful when diverse cluster assignments are in use.
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
    // Latency = mean time between consecutive handoffs on the same pair
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

    // Identify bottleneck pairs: > 40% of all handoffs through one pair
    const sortedByVolume = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
    const bottleneckPairs = sortedByVolume
      .filter(([, count]) => count > totalHandoffs * 0.4)
      .map(([pair]) => pair);

    // Cluster health: based on inbound+outbound handoff involvement ratio
    const clusterHealth: Record<ClusterId, 'healthy' | 'strained' | 'bottleneck'> = {
      'creative-nexus': 'healthy',
      'bridge-zone': 'healthy',
      'rigor-spine': 'healthy',
    };

    // A cluster is strained if it appears in > 50% of handoff pairs,
    // bottleneck if > 70% — these are load signals, not quality signals
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
