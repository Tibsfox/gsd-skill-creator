/**
 * Wasteland Integration — Federated Agent Orchestration
 *
 * Three-layer pipeline: Observe -> Detect -> Compose
 *
 * Layer 1 (Observe): Dolt Scanner, Agent Profiler, Sequence Analyzer,
 *   Town Mapper, Failure Classifier
 * Layer 2 (Detect): Clustering Engine, Decomposition Suggester,
 *   Route Optimizer, Team Evaluator, Gate Suggester
 * Layer 3 (Compose): Skill Materializer, Policy Generator,
 *   Dashboard, Feedback Integrator
 */

// Types
export type {
  ObservationEvent,
  ObservationEventType,
  DoltScannerConfig,
  ScanResult,
  CapabilityVector,
  AgentProfile,
  TaskHistoryEntry,
  SequencePattern,
  TownNode,
  HandoffEdge,
  TownGraph,
  FailureClass,
  FailureSignature,
  FailureAttribution,
  ClusterResult,
  ClusteringOutput,
  DecompositionTemplate,
  DecompositionPhase,
  RoutingRule,
  TeamScore,
  GateSpec,
  GateResult,
  Recommendation,
  FeedbackRecord,
  MetricSnapshot,
  EvaluationEntry,
  OutcomeCategory,
  SPRTResult,
  ABTestResult,
  MetaLearningRecord,
  ConfidenceDecayConfig,
  PatternFeedbackSignal,
  MetaLearningInsights,
  DashboardView,
  TeamDashboardEntry,
  WastelandPolicy,
} from './types.js';

// Layer 1: Observe
export {
  parseCommitMessage,
  extractAgentFromBranch,
  createInitialCheckpoint,
  scan,
  createScanner,
} from './dolt-scanner.js';
export type { DoltCommit, DoltQueryInterface, CheckpointState, DoltScanner } from './dolt-scanner.js';

export {
  decayWeight,
  vectorMagnitude,
  normalizeVector,
  cosineSimilarity,
  createProfileStore,
} from './agent-profiler.js';
export type { ProfileStore } from './agent-profiler.js';

export {
  groupByCaseId,
  extractSequences,
  extractNgrams,
  countNgrams,
  prefixSpan,
  detectRework,
  scorePatterns,
  analyzeSequences,
} from './task-sequence-analyzer.js';
export type { PrefixSpanResult } from './task-sequence-analyzer.js';

export {
  buildTownGraph,
  computeBetweennessCentrality,
  detectBottlenecks,
  townPartnerships,
} from './town-topology-mapper.js';

export {
  classifyFailure,
  classifyFailures,
  createFailureSignatureStore,
  bayesianAttribution,
} from './failure-mode-classifier.js';
export type { FailureSignatureStore } from './failure-mode-classifier.js';

// Layer 2: Detect
export {
  euclideanDistance,
  distanceMatrix,
  coreDistances,
  mutualReachabilityDistance,
  buildMST,
  hdbscanCluster,
  adjustedRandIndex,
} from './agent-clustering-engine.js';

export {
  generateTemplate,
  findParallelGroups,
  generateTemplates,
} from './task-decomposition-suggester.js';

export {
  dijkstra,
  reconstructPath,
  findOptimalRoute,
  generateRoutingRules,
  createABRouteTest,
  recordABObservation,
  generateBottleneckAlerts,
} from './route-optimizer.js';
export type { DijkstraResult, ABRouteTest, BottleneckAlert } from './route-optimizer.js';

export {
  vectorUnion,
  coverageScore,
  redundancyScore,
  detectGaps,
  scoreTeam,
  suggestTeams,
} from './team-composition-evaluator.js';

export {
  generatePreGate,
  generatePostGate,
  isHighRisk,
  createGatePerformance,
  recordGateOutcome,
  shouldPromote,
  generateGates,
} from './safety-gate-suggester.js';
export type { GatePerformance, PromotionCriteria } from './safety-gate-suggester.js';

// Layer 3: Compose
export {
  materializeTeamSkill,
  materializeDecompositionSkill,
  materializeRoutingSkill,
  materializeGateSkill,
  materializeAll,
} from './skill-materializer.js';
export type { MaterializedSkill } from './skill-materializer.js';

export {
  generateTownPersona,
  generateDecompositionRule,
  generateRoutingPolicy,
  generateActivationGate,
  generateAllPolicies,
  serializePolicy,
} from './wasteland-policy-generator.js';

export {
  assembleDashboard,
  teamToDashboardEntry,
  renderDashboard,
  approveRecommendation,
  vetoRecommendation,
} from './human-readable-dashboard.js';
export type { ActionResult } from './human-readable-dashboard.js';

export {
  startTracking,
  updateMetrics,
  evaluateSPRT,
  evaluateABTest,
  categorizeOutcome,
  applyConfidenceDecay,
  updateMetaLearning,
  getMetaLearningInsights,
  feedbackToPatternEngine,
} from './feedback-integrator.js';

export {
  linearDecay,
  exponentialDecay,
  stepDecay,
  simulateDecay,
  recommendDecayCurve,
} from './decay-simulator.js';
export type { RigType, DecayCurveType, DecayInput, CurveProjection, DecaySimulationResult } from './decay-simulator.js';
