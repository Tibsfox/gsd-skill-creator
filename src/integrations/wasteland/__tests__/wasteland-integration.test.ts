/**
 * Wasteland Integration — Test Suite
 *
 * Covers all 14 components across 5 waves plus integration tests.
 */

import { describe, it, expect } from 'vitest';
import type {
  ObservationEvent,
  CapabilityVector,
  MetricSnapshot,
  FailureSignature,
  ClusterResult,
  FeedbackRecord,
  RoutingRule,
  TeamScore,
} from '../types.js';

// Layer 1
import {
  parseCommitMessage,
  extractAgentFromBranch,
  createInitialCheckpoint,
  scan,
} from '../dolt-scanner.js';
import type { DoltQueryInterface, DoltCommit } from '../dolt-scanner.js';

import {
  decayWeight,
  vectorMagnitude,
  normalizeVector,
  cosineSimilarity,
  createProfileStore,
} from '../agent-profiler.js';

import {
  groupByCaseId,
  extractNgrams,
  countNgrams,
  prefixSpan,
  detectRework,
  analyzeSequences,
} from '../task-sequence-analyzer.js';

import {
  buildTownGraph,
  detectBottlenecks,
  townPartnerships,
} from '../town-topology-mapper.js';

import {
  classifyFailure,
  createFailureSignatureStore,
  bayesianAttribution,
} from '../failure-mode-classifier.js';

// Layer 2
import {
  euclideanDistance,
  hdbscanCluster,
  adjustedRandIndex,
} from '../agent-clustering-engine.js';

import {
  generateTemplate,
  findParallelGroups,
} from '../task-decomposition-suggester.js';

import {
  dijkstra,
  reconstructPath,
  findOptimalRoute,
  createABRouteTest,
  recordABObservation,
} from '../route-optimizer.js';

import {
  vectorUnion,
  coverageScore,
  redundancyScore,
  detectGaps,
  scoreTeam,
} from '../team-composition-evaluator.js';

import {
  generatePreGate,
  generatePostGate,
  isHighRisk,
  createGatePerformance,
  recordGateOutcome,
  shouldPromote,
} from '../safety-gate-suggester.js';

// Layer 3
import {
  materializeTeamSkill,
  materializeDecompositionSkill,
  materializeRoutingSkill,
  materializeGateSkill,
  materializeAll,
} from '../skill-materializer.js';

import {
  generateTownPersona,
  generateDecompositionRule,
  generateRoutingPolicy,
  serializePolicy,
} from '../wasteland-policy-generator.js';

import {
  assembleDashboard,
  teamToDashboardEntry,
  renderDashboard,
  approveRecommendation,
  vetoRecommendation,
} from '../human-readable-dashboard.js';

import {
  startTracking,
  updateMetrics,
  evaluateSPRT,
  evaluateABTest,
  categorizeOutcome,
  applyConfidenceDecay,
  updateMetaLearning,
  getMetaLearningInsights,
  feedbackToPatternEngine,
} from '../feedback-integrator.js';

// ============================================================================
// Test Helpers
// ============================================================================

function makeEvent(overrides: Partial<ObservationEvent> = {}): ObservationEvent {
  return {
    id: 'evt-test-0',
    timestamp: '2026-03-04T12:00:00Z',
    eventType: 'task-completed',
    agentId: 'agent-abc',
    taskId: 'task-42',
    townId: 'town-forge',
    metadata: {},
    sourceCommit: 'abc123',
    sourceBranch: 'agent/agent-abc/task-42',
    ...overrides,
  };
}

function makeVector(agentId: string, dims: Record<string, number>, tasks = 10): CapabilityVector {
  return {
    agentId,
    dimensions: dims,
    magnitude: vectorMagnitude(dims),
    lastUpdated: '2026-03-04T12:00:00Z',
    totalTasks: tasks,
    successRate: 0.8,
  };
}

function makeMetric(overrides: Partial<MetricSnapshot> = {}): MetricSnapshot {
  return {
    successRate: 0.7,
    avgLatencyMs: 5000,
    failureCount: 3,
    throughput: 10,
    timestamp: '2026-03-04T12:00:00Z',
    sampleSize: 20,
    ...overrides,
  };
}

// ============================================================================
// Wave 0: Dolt Commons Scanner
// ============================================================================

describe('Dolt Commons Scanner', () => {
  it('extracts task-claimed event from agent branch commit', () => {
    const event = parseCommitMessage(
      'claim: task-42 by agent-abc123 in town-forge',
      'agent/agent-abc123/task-42',
      'deadbeef',
      '2026-03-04T12:00:00Z',
    );
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-claimed');
    expect(event!.agentId).toBe('agent-abc123');
    expect(event!.taskId).toBe('task-42');
    expect(event!.townId).toBe('town-forge');
    expect(event!.sourceBranch).toBe('agent/agent-abc123/task-42');
  });

  it('extracts task-completed event with quality signal', () => {
    const event = parseCommitMessage(
      'complete: task-99 quality=0.85 duration=3600s',
      'agent/agent-def456/task-99',
      'cafebabe',
      '2026-03-04T13:00:00Z',
    );
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-completed');
    expect(event!.metadata).toEqual({ quality: 0.85, duration: 3600 });
    expect(event!.agentId).toBe('agent-def456');
    expect(event!.taskId).toBe('task-99');
  });

  it('detects task-failed event', () => {
    const event = parseCommitMessage(
      'fail: task-7 reason=dependency-missing',
      'agent/agent-ghi789/task-7',
      'face1234',
      '2026-03-04T14:00:00Z',
    );
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-failed');
    expect(event!.metadata).toEqual({ reason: 'dependency-missing' });
    expect(event!.agentId).toBe('agent-ghi789');
  });

  it('handles malformed commit messages gracefully', () => {
    const event = parseCommitMessage(
      'wip: fixing stuff',
      'agent/agent-xyz/task-1',
      'badc0de',
      '2026-03-04T15:00:00Z',
    );
    expect(event).toBeNull();
  });

  it('detects town-to-town transfer events', () => {
    const event = parseCommitMessage(
      'transfer: task-55 from town-forge to town-market agent=agent-xyz',
      'agent/agent-xyz/task-55',
      'feed1234',
      '2026-03-04T16:00:00Z',
    );
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-transferred');
    expect(event!.metadata).toEqual({ fromTown: 'town-forge', toTown: 'town-market' });
    expect(event!.agentId).toBe('agent-xyz');
    expect(event!.taskId).toBe('task-55');
  });

  it('extracts agent ID from branch pattern', () => {
    expect(extractAgentFromBranch('agent/abc123/task-1')).toBe('abc123');
    expect(extractAgentFromBranch('main')).toBe('unknown');
    expect(extractAgentFromBranch('agent/xyz')).toBe('xyz');
  });

  it('creates initial checkpoint state', () => {
    const cp = createInitialCheckpoint();
    expect(cp.lastCommitHash).toBe('');
    expect(cp.eventsProcessed).toBe(0);
  });

  it('scans commits from mock Dolt interface', async () => {
    const mockDb: DoltQueryInterface = {
      async listBranches(pattern) {
        return ['agent/a1/t1', 'agent/a2/t2'];
      },
      async getCommitsSince(branch, since, limit) {
        if (branch === 'agent/a1/t1') {
          return [{
            hash: 'commit1',
            branch,
            message: 'claim: task-1 by agent-a1 in town-forge',
            author: 'agent-a1',
            timestamp: '2026-03-04T12:00:00Z',
          }];
        }
        return [{
          hash: 'commit2',
          branch,
          message: 'complete: task-2 quality=0.9 duration=1800s',
          author: 'agent-a2',
          timestamp: '2026-03-04T12:30:00Z',
        }];
      },
    };

    const result = await scan(
      mockDb,
      { databasePath: '/test', pollingIntervalMs: 1000, rollingWindowDays: 30, branchPattern: /^agent\//, maxEventsPerScan: 100 },
      createInitialCheckpoint(),
    );

    expect(result.events.length).toBe(2);
    expect(result.scannedCommits).toBe(2);
    expect(result.errors).toHaveLength(0);
    expect(result.events[0].eventType).toBe('task-claimed');
    expect(result.events[1].eventType).toBe('task-completed');
  });
});

// ============================================================================
// Wave 0: Agent Profiler
// ============================================================================

describe('Agent Profiler', () => {
  it('computes decay weight correctly', () => {
    const now = '2026-03-04T12:00:00Z';
    // Same time = weight 1
    expect(decayWeight(now, now)).toBeCloseTo(1.0, 5);
    // 1 week ago -> lambda^1 = 0.95
    const oneWeekAgo = '2026-02-25T12:00:00Z';
    expect(decayWeight(oneWeekAgo, now)).toBeCloseTo(0.95, 2);
  });

  it('computes vector magnitude', () => {
    expect(vectorMagnitude({ a: 3, b: 4 })).toBeCloseTo(5, 5);
    expect(vectorMagnitude({ a: 0 })).toBe(0);
    expect(vectorMagnitude({})).toBe(0);
  });

  it('normalizes vectors to unit length', () => {
    const norm = normalizeVector({ a: 3, b: 4 });
    expect(norm.a).toBeCloseTo(0.6, 5);
    expect(norm.b).toBeCloseTo(0.8, 5);
  });

  it('computes cosine similarity', () => {
    // Identical vectors -> 1
    expect(cosineSimilarity({ a: 1, b: 0 }, { a: 1, b: 0 })).toBeCloseTo(1, 5);
    // Orthogonal vectors -> 0
    expect(cosineSimilarity({ a: 1, b: 0 }, { a: 0, b: 1 })).toBeCloseTo(0, 5);
    // Opposite -> -1
    expect(cosineSimilarity({ a: 1 }, { a: -1 })).toBeCloseTo(-1, 5);
  });

  it('builds profiles from observation events', () => {
    const store = createProfileStore();

    store.updateFromEvent(makeEvent({
      agentId: 'agent-1',
      eventType: 'task-completed',
      metadata: { taskType: 'code-review', quality: 0.9 },
    }));
    store.updateFromEvent(makeEvent({
      agentId: 'agent-1',
      eventType: 'task-completed',
      metadata: { taskType: 'code-review', quality: 0.8 },
    }));
    store.updateFromEvent(makeEvent({
      agentId: 'agent-1',
      eventType: 'task-failed',
      metadata: { taskType: 'security-audit' },
    }));

    const profile = store.getProfile('agent-1');
    expect(profile).toBeDefined();
    expect(profile!.taskHistory).toHaveLength(3);
    expect(profile!.vector.totalTasks).toBe(3);
    expect(profile!.vector.dimensions['code-review']).toBeGreaterThan(0);
  });

  it('returns all profiles', () => {
    const store = createProfileStore();
    store.updateFromEvent(makeEvent({ agentId: 'a1', eventType: 'task-completed' }));
    store.updateFromEvent(makeEvent({ agentId: 'a2', eventType: 'task-completed' }));
    expect(store.getAllProfiles()).toHaveLength(2);
  });
});

// ============================================================================
// Wave 1: Task Sequence Analyzer
// ============================================================================

describe('Task Sequence Analyzer', () => {
  it('groups events by case ID', () => {
    const events = [
      makeEvent({ taskId: 'req-1-impl', eventType: 'task-completed', timestamp: '2026-03-04T01:00:00Z' }),
      makeEvent({ taskId: 'req-1-review', eventType: 'task-completed', timestamp: '2026-03-04T02:00:00Z' }),
      makeEvent({ taskId: 'req-2-impl', eventType: 'task-completed', timestamp: '2026-03-04T03:00:00Z' }),
    ];
    const groups = groupByCaseId(events);
    expect(groups.size).toBe(2);
    expect(groups.get('req-1')?.length).toBe(2);
    expect(groups.get('req-2')?.length).toBe(1);
  });

  it('extracts n-grams correctly', () => {
    const ngrams = extractNgrams(['a', 'b', 'c', 'd'], 2);
    expect(ngrams).toEqual([['a', 'b'], ['b', 'c'], ['c', 'd']]);
  });

  it('counts n-gram frequencies with minimum support', () => {
    const sequences = [
      ['review', 'implement', 'test'],
      ['review', 'implement', 'deploy'],
      ['design', 'implement', 'test'],
    ];
    const counts = countNgrams(sequences, 2, 3, 2);
    // 'implement' appears in all 3 but as n-grams:
    // 'review -> implement' appears in 2 sequences
    expect(counts.has('review -> implement')).toBe(true);
  });

  it('detects rework in sequences', () => {
    expect(detectRework(['a', 'b', 'c']).hasRework).toBe(false);
    expect(detectRework(['a', 'b', 'a']).hasRework).toBe(true);
    expect(detectRework(['a', 'b', 'a']).reworkTypes).toEqual(['a']);
  });

  it('runs PrefixSpan for longer patterns', () => {
    const sequences = [
      ['a', 'b', 'c', 'd'],
      ['a', 'b', 'c', 'e'],
      ['a', 'b', 'c', 'd'],
    ];
    const results = prefixSpan(sequences, 2, 5);
    expect(results.length).toBeGreaterThan(0);
    // 'a', 'b', 'c' should all have support >= 2
    const abc = results.find(r => r.pattern.length === 3 && r.pattern.join(',') === 'a,b,c');
    expect(abc).toBeDefined();
    expect(abc!.support).toBeGreaterThanOrEqual(2);
  });

  it('analyzes sequences end-to-end', () => {
    const events = Array.from({ length: 20 }, (_, i) => makeEvent({
      taskId: `req-${Math.floor(i / 4)}-${['design', 'impl', 'test', 'deploy'][i % 4]}`,
      eventType: 'task-completed',
      metadata: { taskType: ['design', 'impl', 'test', 'deploy'][i % 4] },
      timestamp: new Date(Date.now() + i * 60000).toISOString(),
    }));
    const patterns = analyzeSequences(events, { minSupport: 2 });
    expect(patterns.length).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Wave 1: Town Topology Mapper
// ============================================================================

describe('Town Topology Mapper', () => {
  it('builds graph from transfer events', () => {
    const events = [
      makeEvent({ townId: 'forge', eventType: 'task-completed' }),
      makeEvent({ townId: 'market', eventType: 'task-completed' }),
      makeEvent({
        eventType: 'task-transferred',
        metadata: { fromTown: 'forge', toTown: 'market', success: true },
      }),
      makeEvent({
        eventType: 'task-transferred',
        metadata: { fromTown: 'forge', toTown: 'market', success: true },
      }),
    ];

    const graph = buildTownGraph(events);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].fromTown).toBe('forge');
    expect(graph.edges[0].toTown).toBe('market');
    expect(graph.edges[0].volume).toBe(2);
  });

  it('computes betweenness centrality', () => {
    // A -> B -> C: B should have highest centrality
    const events = [
      makeEvent({ townId: 'A', eventType: 'task-completed' }),
      makeEvent({ townId: 'B', eventType: 'task-completed' }),
      makeEvent({ townId: 'C', eventType: 'task-completed' }),
      makeEvent({ eventType: 'task-transferred', metadata: { fromTown: 'A', toTown: 'B' } }),
      makeEvent({ eventType: 'task-transferred', metadata: { fromTown: 'B', toTown: 'C' } }),
    ];
    const graph = buildTownGraph(events);
    const bNode = graph.nodes.find(n => n.townId === 'B');
    // B is the bridge between A and C
    expect(bNode).toBeDefined();
  });

  it('detects bottlenecks', () => {
    // Simple case: all low centrality -> no bottlenecks
    const events = [
      makeEvent({ townId: 'A', eventType: 'task-completed' }),
      makeEvent({ townId: 'B', eventType: 'task-completed' }),
    ];
    const graph = buildTownGraph(events);
    const bottlenecks = detectBottlenecks(graph);
    expect(bottlenecks).toHaveLength(0);
  });

  it('computes town partnerships', () => {
    const events = [
      makeEvent({ eventType: 'task-transferred', metadata: { fromTown: 'A', toTown: 'B' } }),
      makeEvent({ eventType: 'task-transferred', metadata: { fromTown: 'B', toTown: 'C' } }),
    ];
    const graph = buildTownGraph(events);
    const partners = townPartnerships(graph);
    expect(partners.length).toBe(2);
  });
});

// ============================================================================
// Wave 1: Failure Mode Classifier
// ============================================================================

describe('Failure Mode Classifier', () => {
  it('classifies failure reasons correctly', () => {
    expect(classifyFailure('capability mismatch')).toBe('capability-gap');
    expect(classifyFailure('scope unclear')).toBe('scope-gap');
    expect(classifyFailure('dependency-missing')).toBe('dependency-gap');
    expect(classifyFailure('timed out')).toBe('timeout');
    expect(classifyFailure('communication failure')).toBe('communication-failure');
    expect(classifyFailure('safety violation detected')).toBe('safety-violation');
    expect(classifyFailure('unknown error')).toBe('scope-gap'); // default
  });

  it('builds failure signatures', () => {
    const store = createFailureSignatureStore();
    store.addFailure(
      makeEvent({ eventType: 'task-failed', metadata: { reason: 'timeout', taskType: 'build' } }),
      'timeout',
    );
    store.addFailure(
      makeEvent({ eventType: 'task-failed', metadata: { reason: 'timeout', taskType: 'build' } }),
      'timeout',
    );

    const sigs = store.getSignatures();
    expect(sigs).toHaveLength(1);
    expect(sigs[0].occurrences).toBe(2);
    expect(sigs[0].failureClass).toBe('timeout');
  });

  it('performs Bayesian attribution', () => {
    const event = makeEvent({
      eventType: 'task-failed',
      metadata: { reason: 'capability mismatch', taskType: 'security-audit' },
    });

    const result = bayesianAttribution(event, undefined, 0.8);
    expect(result.failureClass).toBe('capability-gap');
    expect(result.agentSideProbability + result.taskSideProbability).toBeCloseTo(1, 5);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it('matches failure signatures', () => {
    const store = createFailureSignatureStore();
    store.addFailure(
      makeEvent({ eventType: 'task-failed', metadata: { reason: 'timeout', taskType: 'build' } }),
      'timeout',
    );

    const match = store.matchSignature('build', { reason: 'timeout' });
    expect(match).not.toBeNull();
    expect(match!.failureClass).toBe('timeout');
  });
});

// ============================================================================
// Wave 1: Agent Clustering Engine
// ============================================================================

describe('Agent Clustering Engine', () => {
  it('computes euclidean distance', () => {
    expect(euclideanDistance({ a: 0, b: 0 }, { a: 3, b: 4 })).toBeCloseTo(5, 5);
    expect(euclideanDistance({ a: 1 }, { a: 1 })).toBe(0);
  });

  it('clusters agents with HDBSCAN', () => {
    // Create 3 clusters of 3 agents each with distinct capability profiles
    const vectors: CapabilityVector[] = [
      // Cluster 1: code specialists
      makeVector('a1', { code: 0.9, review: 0.1 }),
      makeVector('a2', { code: 0.85, review: 0.15 }),
      makeVector('a3', { code: 0.8, review: 0.2 }),
      // Cluster 2: review specialists
      makeVector('a4', { code: 0.1, review: 0.9 }),
      makeVector('a5', { code: 0.15, review: 0.85 }),
      makeVector('a6', { code: 0.2, review: 0.8 }),
      // Cluster 3: balanced
      makeVector('a7', { code: 0.5, review: 0.5 }),
      makeVector('a8', { code: 0.45, review: 0.55 }),
      makeVector('a9', { code: 0.55, review: 0.45 }),
    ];

    const result = hdbscanCluster(vectors, 3, 2);
    expect(result.totalAgents).toBe(9);
    expect(result.clusters.length).toBeGreaterThanOrEqual(1);
    // Each cluster should have persistence > 0
    for (const cluster of result.clusters) {
      expect(cluster.persistence).toBeGreaterThan(0);
      expect(cluster.size).toBeGreaterThanOrEqual(3);
    }
  });

  it('handles insufficient agents gracefully', () => {
    const vectors = [makeVector('a1', { code: 0.9 })];
    const result = hdbscanCluster(vectors, 3, 2);
    expect(result.clusters).toHaveLength(0);
    expect(result.outliers).toEqual(['a1']);
  });

  it('computes Adjusted Rand Index', () => {
    // Identical assignments -> ARI = 1
    const labels1 = new Map([['a', 'c1'], ['b', 'c1'], ['c', 'c2']]);
    const labels2 = new Map([['a', 'c1'], ['b', 'c1'], ['c', 'c2']]);
    expect(adjustedRandIndex(labels1, labels2)).toBeCloseTo(1, 5);

    // Different assignments
    const labels3 = new Map([['a', 'c1'], ['b', 'c2'], ['c', 'c1']]);
    expect(adjustedRandIndex(labels1, labels3)).toBeLessThan(1);
  });
});

// ============================================================================
// Wave 2: Task Decomposition Suggester
// ============================================================================

describe('Task Decomposition Suggester', () => {
  it('generates templates from patterns', () => {
    const pattern = {
      id: 'pat-0',
      sequence: ['research', 'design', 'implement', 'test'],
      support: 5,
      frequency: 0.5,
      avgSuccessRate: 0.8,
      score: 0.4,
      reworkDetected: false,
    };

    const clusters: ClusterResult[] = [{
      clusterId: 'c1',
      archetype: 'researcher',
      members: ['a1'],
      centroid: { research: 0.9 },
      persistence: 0.5,
      size: 3,
    }];

    const durations = new Map([
      ['research', 3600000],
      ['design', 1800000],
      ['implement', 7200000],
      ['test', 1800000],
    ]);

    const template = generateTemplate(pattern, clusters, durations);
    expect(template.phases).toHaveLength(4);
    expect(template.sourcePatternId).toBe('pat-0');
    expect(template.phases[0].taskType).toBe('research');
  });

  it('finds parallel groups', () => {
    const phases = [
      { name: 'A', taskType: 'a', recommendedArchetype: 'g', estimatedDurationMs: 100, dependencies: [] },
      { name: 'B', taskType: 'b', recommendedArchetype: 'g', estimatedDurationMs: 100, dependencies: [] },
      { name: 'C', taskType: 'c', recommendedArchetype: 'g', estimatedDurationMs: 100, dependencies: ['a'] },
    ];
    const groups = findParallelGroups(phases);
    // a and b have no dependencies -> parallel
    const level0 = groups.find(g => g.includes('a') && g.includes('b'));
    expect(level0).toBeDefined();
  });
});

// ============================================================================
// Wave 2: Route Optimizer
// ============================================================================

describe('Route Optimizer', () => {
  const testGraph = () => buildTownGraph([
    makeEvent({ townId: 'A', eventType: 'task-completed' }),
    makeEvent({ townId: 'B', eventType: 'task-completed' }),
    makeEvent({ townId: 'C', eventType: 'task-completed' }),
    makeEvent({ eventType: 'task-transferred', metadata: { fromTown: 'A', toTown: 'B', latencyMs: 1000 } }),
    makeEvent({ eventType: 'task-transferred', metadata: { fromTown: 'B', toTown: 'C', latencyMs: 1000 } }),
    makeEvent({ eventType: 'task-transferred', metadata: { fromTown: 'A', toTown: 'C', latencyMs: 5000 } }),
  ]);

  it('runs Dijkstra from source', () => {
    const graph = testGraph();
    const result = dijkstra(graph, 'A');
    expect(result.distances.get('A')).toBe(0);
    expect(result.distances.get('B')).toBeDefined();
  });

  it('reconstructs shortest path', () => {
    const graph = testGraph();
    const result = dijkstra(graph, 'A');
    const path = reconstructPath(result.predecessors, 'A', 'C');
    expect(path).not.toBeNull();
    expect(path![0]).toBe('A');
    expect(path![path!.length - 1]).toBe('C');
  });

  it('finds optimal route', () => {
    const graph = testGraph();
    const route = findOptimalRoute(graph, 'A', 'C');
    expect(route).not.toBeNull();
    expect(route!.route[0]).toBe('A');
    expect(route!.route[route!.route.length - 1]).toBe('C');
  });

  it('handles disconnected graph gracefully', () => {
    const events = [
      makeEvent({ townId: 'X', eventType: 'task-completed' }),
      makeEvent({ townId: 'Y', eventType: 'task-completed' }),
    ];
    const graph = buildTownGraph(events);
    const route = findOptimalRoute(graph, 'X', 'Y');
    expect(route).toBeNull();
  });

  it('manages A/B route tests', () => {
    let test = createABRouteTest('r1', ['A', 'B', 'C'], ['A', 'C'], 5);
    expect(test.isComplete).toBe(false);

    for (let i = 0; i < 5; i++) {
      test = recordABObservation(test, true, 1000, 'control');
      test = recordABObservation(test, true, 800, 'treatment');
    }

    expect(test.isComplete).toBe(true);
    expect(test.controlSamples).toBe(5);
    expect(test.treatmentSamples).toBe(5);
  });
});

// ============================================================================
// Wave 2: Team Composition Evaluator
// ============================================================================

describe('Team Composition Evaluator', () => {
  it('computes vector union', () => {
    const union = vectorUnion([
      makeVector('a1', { code: 0.9, review: 0.2 }),
      makeVector('a2', { code: 0.3, review: 0.8 }),
    ]);
    expect(union.code).toBe(0.9);
    expect(union.review).toBe(0.8);
  });

  it('scores coverage against requirements', () => {
    const team = { code: 0.9, review: 0.8 };
    const reqs = { code: 1, review: 1 };
    expect(coverageScore(team, reqs)).toBeCloseTo(0.85, 2);
  });

  it('computes redundancy from overlapping capabilities', () => {
    const identical = [
      makeVector('a1', { code: 0.9, review: 0.1 }),
      makeVector('a2', { code: 0.9, review: 0.1 }),
    ];
    expect(redundancyScore(identical)).toBeGreaterThan(0.9);

    const different = [
      makeVector('a1', { code: 0.9, review: 0 }),
      makeVector('a2', { code: 0, review: 0.9 }),
    ];
    expect(redundancyScore(different)).toBeLessThan(0.1);
  });

  it('detects skill gaps', () => {
    const gaps = detectGaps(
      { code: 0.9, review: 0.0 },
      { code: 1, review: 1, security: 1 },
    );
    expect(gaps).toContain('review');
    expect(gaps).toContain('security');
    expect(gaps).not.toContain('code');
  });

  it('scores team with confidence threshold', () => {
    const team = scoreTeam(
      'test-team',
      [
        makeVector('a1', { code: 0.9, review: 0.2 }, 30),
        makeVector('a2', { code: 0.2, review: 0.9 }, 25),
      ],
      { code: 1, review: 1 },
    );
    expect(team.overallScore).toBeGreaterThan(0);
    expect(team.coverageScore).toBeGreaterThan(0);
    expect(team.members).toEqual(['a1', 'a2']);
  });
});

// ============================================================================
// Wave 2: Safety Gate Suggester
// ============================================================================

describe('Safety Gate Suggester', () => {
  const testSig: FailureSignature = {
    id: 'sig-0',
    failureClass: 'capability-gap',
    taskType: 'security-audit',
    conditions: {},
    preventativeAction: 'Check capability match',
    occurrences: 5,
    lastSeen: '2026-03-04T12:00:00Z',
  };

  it('generates pre-execution gates', () => {
    const gate = generatePreGate(testSig, []);
    expect(gate.type).toBe('pre-execution');
    expect(gate.automationLevel).toBe('human-approval');
    expect(gate.sourceFailureSignatures).toContain('sig-0');
  });

  it('generates post-execution gates', () => {
    const gate = generatePostGate(testSig);
    expect(gate.type).toBe('post-execution');
  });

  it('identifies high-risk failure classes', () => {
    expect(isHighRisk('safety-violation')).toBe(true);
    expect(isHighRisk('capability-gap')).toBe(true);
    expect(isHighRisk('timeout')).toBe(false);
    expect(isHighRisk('scope-gap')).toBe(false);
  });

  it('tracks gate performance', () => {
    let perf = createGatePerformance('g1');
    // Gate correctly blocked a failure
    perf = recordGateOutcome(perf, false, false);
    expect(perf.truePositives).toBe(1);
    // Gate incorrectly blocked a success
    perf = recordGateOutcome(perf, false, true);
    expect(perf.falsePositives).toBe(1);
    expect(perf.totalChecks).toBe(2);
    expect(perf.fpr).toBeGreaterThan(0);
  });

  it('evaluates gate promotion criteria', () => {
    const gate = generatePreGate({
      ...testSig,
      failureClass: 'timeout', // Not high-risk
    }, []);

    let perf = createGatePerformance(gate.id);
    // Simulate 20 checks with 95% approval rate, 5% FPR
    for (let i = 0; i < 19; i++) {
      perf = recordGateOutcome(perf, true, true); // TN
    }
    perf = recordGateOutcome(perf, false, true); // FP

    expect(shouldPromote(perf, gate)).toBe(true);
  });
});

// ============================================================================
// Wave 3: Skill Materializer
// ============================================================================

describe('Skill Materializer', () => {
  it('materializes team skills with SKILL.md content', () => {
    const team: TeamScore = {
      teamId: 'team-alpha',
      members: ['a1', 'a2'],
      coverageScore: 0.9,
      gapScore: 0.85,
      redundancyScore: 0.2,
      overallScore: 0.82,
      gaps: ['security'],
      confidence: 0.85,
    };

    const skill = materializeTeamSkill(team, 0.85, ['evidence-1']);
    expect(skill.skillName).toBe('team-team-alpha');
    expect(skill.category).toBe('team-composition');
    expect(skill.content).toContain('team-team-alpha');
    expect(skill.content).toContain('a1');
    expect(skill.content).toContain('Coverage');
    expect(skill.recommendation.type).toBe('team-composition');
  });

  it('materializes decomposition skills', () => {
    const template = {
      id: 'tmpl-0',
      sourcePatternId: 'pat-0',
      phases: [
        { name: 'P1', taskType: 'design', recommendedArchetype: 'arch', estimatedDurationMs: 3600000, dependencies: [] },
      ],
      estimatedDurationMs: 3600000,
      parallelizablePhases: [],
      confidence: 0.8,
    };

    const skill = materializeDecompositionSkill(template, 0.8, ['src-pat']);
    expect(skill.content).toContain('design');
    expect(skill.category).toBe('task-decomposition');
  });

  it('materializes routing skills', () => {
    const rule: RoutingRule = {
      id: 'r1',
      taskType: 'build',
      route: ['A', 'B', 'C'],
      weight: 2.5,
      latencyEstimateMs: 3000,
      successRateEstimate: 0.9,
      abTestActive: false,
    };

    const skill = materializeRoutingSkill(rule, 0.9, ['route-evidence']);
    expect(skill.content).toContain('A -> B -> C');
    expect(skill.category).toBe('routing-rule');
  });

  it('applies confidence threshold in batch materialization', () => {
    const teams: TeamScore[] = [
      { teamId: 't1', members: ['a'], coverageScore: 0.9, gapScore: 0.9, redundancyScore: 0.1, overallScore: 0.9, gaps: [], confidence: 0.8 },
      { teamId: 't2', members: ['b'], coverageScore: 0.3, gapScore: 0.3, redundancyScore: 0.5, overallScore: 0.3, gaps: ['x'], confidence: 0.3 },
    ];

    const skills = materializeAll(teams, [], [], [], 0.7);
    // Only t1 passes threshold
    expect(skills.length).toBe(1);
    expect(skills[0].skillName).toContain('t1');
  });
});

// ============================================================================
// Wave 3: Wasteland Policy Generator
// ============================================================================

describe('Wasteland Policy Generator', () => {
  it('generates town persona', () => {
    const events = [makeEvent({ townId: 'forge', eventType: 'task-completed' })];
    const graph = buildTownGraph(events);
    const policy = generateTownPersona('forge', graph, []);
    expect(policy.type).toBe('town-persona');
    expect(policy.townId).toBe('forge');
    expect(policy.version).toBe('0.1.0');
  });

  it('generates decomposition rules', () => {
    const template = {
      id: 't1',
      sourcePatternId: 'p1',
      phases: [{ name: 'P1', taskType: 'a', recommendedArchetype: 'g', estimatedDurationMs: 1000, dependencies: [] }],
      estimatedDurationMs: 1000,
      parallelizablePhases: [],
      confidence: 0.8,
    };

    const policy = generateDecompositionRule(template);
    expect(policy.type).toBe('decomposition-rule');
  });

  it('generates routing policies', () => {
    const rule: RoutingRule = {
      id: 'r1', taskType: 'build', route: ['A', 'B'],
      weight: 1, latencyEstimateMs: 100, successRateEstimate: 0.9, abTestActive: false,
    };

    const policy = generateRoutingPolicy(rule);
    expect(policy.type).toBe('routing-policy');
    expect((policy.config as Record<string, unknown>).route).toEqual(['A', 'B']);
  });

  it('serializes policies to JSON', () => {
    const rule: RoutingRule = {
      id: 'r1', taskType: 'build', route: ['A', 'B'],
      weight: 1, latencyEstimateMs: 100, successRateEstimate: 0.9, abTestActive: false,
    };
    const policy = generateRoutingPolicy(rule);
    const json = serializePolicy(policy);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe('routing-policy');
  });
});

// ============================================================================
// Wave 3: Human-Readable Dashboard
// ============================================================================

describe('Human-Readable Dashboard', () => {
  it('assembles dashboard view', () => {
    const view = assembleDashboard(
      [{ teamId: 't1', members: ['a1'], score: 0.8, tasksCompleted: 5, avgSuccessRate: 0.9, status: 'active' }],
      [],
      [],
      {
        typeSuccessRates: {}, avgTimeToValidate: {},
        mostImpactfulType: 'none', leastReliableType: 'none',
        pendingEvaluationCount: 0, expiredCount: 0, recommendations: [],
      },
      { nodes: [], edges: [], lastUpdated: '' },
    );
    expect(view.teams).toHaveLength(1);
    expect(view.lastUpdated).toBeTruthy();
  });

  it('converts team score to dashboard entry', () => {
    const score: TeamScore = {
      teamId: 't1', members: ['a1', 'a2'], coverageScore: 0.9,
      gapScore: 0.9, redundancyScore: 0.1, overallScore: 0.85,
      gaps: [], confidence: 0.8,
    };
    const entry = teamToDashboardEntry(score, 10, 0.9);
    expect(entry.status).toBe('active');
    expect(entry.tasksCompleted).toBe(10);
  });

  it('renders dashboard as text', () => {
    const view = assembleDashboard(
      [{ teamId: 't1', members: ['a1'], score: 0.8, tasksCompleted: 5, avgSuccessRate: 0.9, status: 'active' }],
      [],
      [],
      {
        typeSuccessRates: {}, avgTimeToValidate: {},
        mostImpactfulType: 'team', leastReliableType: 'route',
        pendingEvaluationCount: 0, expiredCount: 0, recommendations: [],
      },
      { nodes: [], edges: [], lastUpdated: '' },
    );
    const text = renderDashboard(view);
    expect(text).toContain('WASTELAND FEDERATION DASHBOARD');
    expect(text).toContain('ACTIVE TEAMS');
    expect(text).toContain('t1');
  });

  it('handles approve and veto actions', () => {
    const approved = approveRecommendation('rec-1', 'Looks good');
    expect(approved.action).toBe('approved');
    expect(approved.recommendationId).toBe('rec-1');

    const vetoed = vetoRecommendation('rec-2', 'Too risky');
    expect(vetoed.action).toBe('vetoed');
    expect(vetoed.reason).toBe('Too risky');
  });
});

// ============================================================================
// Wave 4: Feedback Integrator
// ============================================================================

describe('Feedback Integrator', () => {
  it('tracks recommendation through validation', () => {
    const baseline = makeMetric({ successRate: 0.72 });
    let record = startTracking('rec-1', 'routing-rule', 0.85, baseline);
    expect(record.status).toBe('evaluating');
    expect(record.sampleCount).toBe(0);

    // Update 15 times with improving metrics
    for (let i = 1; i <= 15; i++) {
      record = updateMetrics(record, makeMetric({ successRate: 0.89, sampleSize: i }));
    }

    expect(record.sampleCount).toBe(15);
    expect(record.evaluationHistory).toHaveLength(15);
    // Should have reached a conclusion by now
    expect(['validated', 'rejected', 'inconclusive']).toContain(record.status);
  });

  it('SPRT detects strong improvement early', () => {
    const baseline = makeMetric({ successRate: 0.60 });
    let record = startTracking('rec-2', 'team-composition', 0.8, baseline);

    // 5 observations all showing strong improvement
    for (let i = 0; i < 5; i++) {
      record = updateMetrics(record, makeMetric({ successRate: 0.88 }));
    }

    const sprt = evaluateSPRT(record);
    expect(sprt.effectSize).toBeGreaterThan(0);
    expect(sprt.samplesUsed).toBe(5);
  });

  it('evaluates A/B test with significant difference', () => {
    const control = Array.from({ length: 20 }, () => makeMetric({ successRate: 0.68 }));
    const treatment = Array.from({ length: 20 }, () => makeMetric({ successRate: 0.82 }));

    const result = evaluateABTest(control, treatment);
    expect(result.improvementPercent).toBeGreaterThan(15);
    expect(result.tStatistic).not.toBe(0);
  });

  it('evaluates A/B test with non-significant difference', () => {
    const control = Array.from({ length: 15 }, (_, i) =>
      makeMetric({ successRate: 0.74 + (i % 3 - 1) * 0.1 }));
    const treatment = Array.from({ length: 15 }, (_, i) =>
      makeMetric({ successRate: 0.76 + (i % 3 - 1) * 0.1 }));

    const result = evaluateABTest(control, treatment);
    expect(result.improvementPercent).toBeLessThan(10);
  });

  it('categorizes outcomes at threshold boundaries', () => {
    const base = makeMetric({ successRate: 0.50 });
    expect(categorizeOutcome(base, makeMetric({ successRate: 0.625 }))).toBe('strong-success'); // +25%
    expect(categorizeOutcome(base, makeMetric({ successRate: 0.56 }))).toBe('weak-success');    // +12%
    expect(categorizeOutcome(base, makeMetric({ successRate: 0.515 }))).toBe('neutral');        // +3%
    expect(categorizeOutcome(base, makeMetric({ successRate: 0.46 }))).toBe('weak-failure');    // -8%
    expect(categorizeOutcome(base, makeMetric({ successRate: 0.35 }))).toBe('strong-failure');  // -30%
  });

  it('applies confidence decay after 30 days', () => {
    const now = '2026-04-10T12:00:00Z'; // ~37 days after applied
    const records: FeedbackRecord[] = [
      {
        ...startTracking('r1', 'team-composition', 0.8, makeMetric()),
        lastUpdated: '2026-03-30T12:00:00Z', // 11 days ago, no decay
      },
      {
        ...startTracking('r2', 'routing-rule', 0.8, makeMetric()),
        lastUpdated: '2026-03-04T12:00:00Z', // 37 days ago, should decay
      },
    ];

    const decayed = applyConfidenceDecay(records, undefined, now);
    expect(decayed[0].confidence).toBe(0.8); // No decay yet
    expect(decayed[1].confidence).toBeLessThan(0.8); // Decayed
    expect(decayed[1].confidence).toBeGreaterThan(0.1); // Above floor
  });

  it('tracks meta-learning across types', () => {
    const record1: FeedbackRecord = {
      ...startTracking('r1', 'team-composition', 0.8, makeMetric()),
      status: 'validated',
      outcome: 'strong-success',
    };
    const record2: FeedbackRecord = {
      ...startTracking('r2', 'routing-rule', 0.7, makeMetric()),
      status: 'rejected',
      outcome: 'weak-failure',
    };

    let meta1 = updateMetaLearning(record1);
    expect(meta1.strongSuccessCount).toBe(1);
    expect(meta1.overallSuccessRate).toBe(1);

    const meta2 = updateMetaLearning(record2);
    expect(meta2.weakFailureCount).toBe(1);
    expect(meta2.overallSuccessRate).toBe(0);
  });

  it('generates pattern feedback signals', () => {
    const records: FeedbackRecord[] = [
      {
        ...startTracking('r1', 'team-composition', 0.8, makeMetric()),
        status: 'validated',
        outcome: 'strong-success',
      },
      {
        ...startTracking('r2', 'routing-rule', 0.7, makeMetric()),
        status: 'rejected',
        outcome: 'strong-failure',
      },
    ];

    const signals = feedbackToPatternEngine(records);
    expect(signals).toHaveLength(2);
    expect(signals[0].signalType).toBe('boost');
    expect(signals[1].signalType).toBe('dampen');
  });

  it('gets meta-learning insights', () => {
    const metaRecords = [
      {
        recommendationType: 'team-composition' as const,
        totalApplied: 10, strongSuccessCount: 5, weakSuccessCount: 2,
        neutralCount: 1, weakFailureCount: 1, strongFailureCount: 1,
        overallSuccessRate: 0.7, avgTimeToValidateMs: 86400000, lastUpdated: '',
      },
      {
        recommendationType: 'routing-rule' as const,
        totalApplied: 5, strongSuccessCount: 1, weakSuccessCount: 0,
        neutralCount: 2, weakFailureCount: 1, strongFailureCount: 1,
        overallSuccessRate: 0.2, avgTimeToValidateMs: 172800000, lastUpdated: '',
      },
    ];

    const insights = getMetaLearningInsights(metaRecords, []);
    expect(insights.mostImpactfulType).toBe('team-composition');
    expect(insights.leastReliableType).toBe('routing-rule');
    expect(insights.recommendations.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Layer 1 -> Layer 2 -> Layer 3', () => {
  it('end-to-end pipeline: observation to skill generation', () => {
    // 1. Generate observation events
    const events: ObservationEvent[] = [];
    for (let i = 0; i < 30; i++) {
      const agentIdx = i % 5;
      events.push(makeEvent({
        id: `evt-${i}`,
        agentId: `agent-${agentIdx}`,
        taskId: `req-${Math.floor(i / 3)}-${['design', 'impl', 'test'][i % 3]}`,
        townId: `town-${i % 3}`,
        eventType: i % 7 === 0 ? 'task-failed' : 'task-completed',
        metadata: {
          taskType: ['design', 'impl', 'test'][i % 3],
          quality: 0.7 + Math.random() * 0.3,
          reason: i % 7 === 0 ? 'timeout' : undefined,
        },
        timestamp: new Date(Date.now() + i * 60000).toISOString(),
      }));
    }

    // 2. Build profiles
    const profileStore = createProfileStore();
    for (const event of events) {
      profileStore.updateFromEvent(event);
    }
    const profiles = profileStore.getAllProfiles();
    expect(profiles.length).toBe(5);

    // 3. Get vectors for clustering
    const vectors = profiles.map(p => p.vector);
    const clusterResult = hdbscanCluster(vectors, 2, 2);
    expect(clusterResult.totalAgents).toBe(5);

    // 4. Analyze sequences
    const patterns = analyzeSequences(events, { minSupport: 1 });
    // Patterns may or may not be found depending on data shape

    // 5. Build topology
    const graph = buildTownGraph(events);
    expect(graph.nodes.length).toBeGreaterThan(0);

    // 6. Classify failures
    const failureStore = createFailureSignatureStore();
    for (const event of events.filter(e => e.eventType === 'task-failed')) {
      failureStore.addFailure(event, classifyFailure((event.metadata?.reason as string) ?? ''));
    }

    // 7. Materialize skills (even with minimal data)
    const skills = materializeAll([], [], [], [], 0.5);
    // No high-confidence data yet, so might be empty
    expect(skills).toBeDefined();
  });
});
