/**
 * Wasteland Integration — Shared Types
 *
 * Cross-component interfaces for the three-layer pipeline:
 * Observe (Layer 1) -> Detect (Layer 2) -> Compose (Layer 3)
 *
 * All types are pure data structures with no runtime dependencies.
 */

// ============================================================================
// Layer 1: Observation Types
// ============================================================================

/** Event types emitted by the Dolt Commons Scanner */
export type ObservationEventType =
  | 'task-posted'
  | 'task-claimed'
  | 'task-completed'
  | 'task-failed'
  | 'task-transferred'
  | 'quality-signal';

/** Core observation event — output of the Dolt Scanner, input to all Layer 1 */
export interface ObservationEvent {
  id: string;
  timestamp: string;
  eventType: ObservationEventType;
  agentId: string;
  taskId: string;
  townId: string;
  metadata: Record<string, unknown>;
  sourceCommit: string;
  sourceBranch: string;
}

/** Scanner configuration */
export interface DoltScannerConfig {
  databasePath: string;
  pollingIntervalMs: number;
  rollingWindowDays: number;
  branchPattern: RegExp;
  maxEventsPerScan: number;
}

/** Result of a single scan cycle */
export interface ScanResult {
  events: ObservationEvent[];
  scannedCommits: number;
  newCheckpoint: string;
  scanDurationMs: number;
  errors: Array<{ branch: string; error: string }>;
}

/** Agent capability vector — output of Agent Profiler */
export interface CapabilityVector {
  agentId: string;
  dimensions: Record<string, number>;
  magnitude: number;
  lastUpdated: string;
  totalTasks: number;
  successRate: number;
}

/** Agent profile with full history context */
export interface AgentProfile {
  agentId: string;
  vector: CapabilityVector;
  taskHistory: TaskHistoryEntry[];
  clusterAssignment?: string;
  specializations: string[];
  gaps: string[];
}

/** Single task history entry for an agent */
export interface TaskHistoryEntry {
  taskId: string;
  taskType: string;
  townId: string;
  outcome: 'completed' | 'failed';
  quality?: number;
  durationMs?: number;
  timestamp: string;
}

// ============================================================================
// Layer 1: Pattern Types
// ============================================================================

/** N-gram pattern from task sequence analysis */
export interface SequencePattern {
  id: string;
  sequence: string[];
  support: number;
  frequency: number;
  avgSuccessRate: number;
  score: number; // frequency * avgSuccessRate
  reworkDetected: boolean;
  townTransitions?: Array<{ from: string; to: string }>;
}

/** Town node in the topology graph */
export interface TownNode {
  townId: string;
  agentCount: number;
  taskQueueDepth: number;
  throughput: number;
  betweennessCentrality: number;
}

/** Directed edge in the town handoff graph */
export interface HandoffEdge {
  fromTown: string;
  toTown: string;
  volume: number;
  avgLatencyMs: number;
  successRate: number;
  failureReasons: string[];
  weight: number; // (1/successRate) * avgLatencyMs
}

/** Town topology graph */
export interface TownGraph {
  nodes: TownNode[];
  edges: HandoffEdge[];
  lastUpdated: string;
}

/** Failure mode classification */
export type FailureClass =
  | 'capability-gap'
  | 'scope-gap'
  | 'dependency-gap'
  | 'timeout'
  | 'communication-failure'
  | 'safety-violation';

/** Failure signature for preventative matching */
export interface FailureSignature {
  id: string;
  failureClass: FailureClass;
  taskType: string;
  conditions: Record<string, unknown>;
  preventativeAction: string;
  occurrences: number;
  lastSeen: string;
}

/** Bayesian failure attribution result */
export interface FailureAttribution {
  taskId: string;
  failureClass: FailureClass;
  agentSideProbability: number;
  taskSideProbability: number;
  confidence: number;
  evidence: string[];
}

// ============================================================================
// Layer 2: Detection Types
// ============================================================================

/** Cluster result from HDBSCAN */
export interface ClusterResult {
  clusterId: string;
  archetype: string;
  members: string[]; // agent IDs
  centroid: Record<string, number>;
  persistence: number;
  size: number;
}

/** Overall clustering output */
export interface ClusteringOutput {
  clusters: ClusterResult[];
  outliers: string[];
  totalAgents: number;
  adjustedRandIndex?: number;
  lastClustered: string;
}

/** Decomposition template generated from sequence patterns */
export interface DecompositionTemplate {
  id: string;
  sourcePatternId: string;
  phases: DecompositionPhase[];
  estimatedDurationMs: number;
  parallelizablePhases: string[][];
  confidence: number;
}

/** Single phase in a decomposition template */
export interface DecompositionPhase {
  name: string;
  taskType: string;
  recommendedArchetype: string;
  estimatedDurationMs: number;
  dependencies: string[];
}

/** Routing rule generated by the Route Optimizer */
export interface RoutingRule {
  id: string;
  taskType: string;
  route: string[]; // ordered town IDs
  weight: number;
  latencyEstimateMs: number;
  successRateEstimate: number;
  abTestActive: boolean;
}

/** Team composition score */
export interface TeamScore {
  teamId: string;
  members: string[];
  coverageScore: number;
  gapScore: number;
  redundancyScore: number;
  overallScore: number;
  gaps: string[];
  confidence: number;
}

/** Safety gate specification */
export interface GateSpec {
  id: string;
  name: string;
  type: 'pre-execution' | 'post-execution';
  check: (task: Record<string, unknown>, agent: Record<string, unknown>, context: Record<string, unknown>) => GateResult;
  sourceFailureSignatures: string[];
  automationLevel: 'human-approval' | 'auto-approve';
  truePositiveRate: number;
  falsePositiveRate: number;
}

/** Result of running a gate check */
export interface GateResult {
  pass: boolean;
  reason: string;
  confidence: number;
}

// ============================================================================
// Layer 3: Composition Types
// ============================================================================

/** Recommendation with confidence and evidence */
export interface Recommendation {
  id: string;
  type: 'team-composition' | 'task-decomposition' | 'routing-rule' | 'safety-gate';
  confidence: number;
  evidenceChain: string[];
  reasoning: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** Feedback record for tracking recommendation outcomes */
export interface FeedbackRecord {
  recommendationId: string;
  recommendationType: 'team-composition' | 'task-decomposition' | 'routing-rule' | 'safety-gate';
  confidence: number;
  initialConfidence: number;
  appliedAt: string;
  baselineMetric: MetricSnapshot;
  currentMetric: MetricSnapshot;
  sampleCount: number;
  minSamplesRequired: number;
  status: 'evaluating' | 'validated' | 'rejected' | 'expired' | 'inconclusive';
  outcome?: OutcomeCategory;
  lastUpdated: string;
  evaluationHistory: EvaluationEntry[];
}

/** Metric snapshot for baseline/current comparison */
export interface MetricSnapshot {
  successRate: number;
  avgLatencyMs: number;
  failureCount: number;
  throughput: number;
  timestamp: string;
  sampleSize: number;
}

/** Single evaluation entry in the feedback history */
export interface EvaluationEntry {
  timestamp: string;
  sampleCount: number;
  currentMetric: MetricSnapshot;
  sprtResult?: SPRTResult;
  abTestResult?: ABTestResult;
  confidenceAdjustment: number;
  notes: string;
}

/** Outcome categorization levels */
export type OutcomeCategory =
  | 'strong-success'
  | 'weak-success'
  | 'neutral'
  | 'weak-failure'
  | 'strong-failure';

/** SPRT (Sequential Probability Ratio Test) result */
export interface SPRTResult {
  logLikelihoodRatio: number;
  upperBound: number;
  lowerBound: number;
  decision: 'accept-improvement' | 'accept-no-improvement' | 'continue-sampling';
  samplesUsed: number;
  effectSize: number;
}

/** A/B test result using Welch's t-test */
export interface ABTestResult {
  controlGroup: MetricSnapshot;
  treatmentGroup: MetricSnapshot;
  tStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
  significant: boolean;
  improvementPercent: number;
  confidenceInterval: { lower: number; upper: number };
}

/** Meta-learning record per recommendation type */
export interface MetaLearningRecord {
  recommendationType: 'team-composition' | 'task-decomposition' | 'routing-rule' | 'safety-gate';
  totalApplied: number;
  strongSuccessCount: number;
  weakSuccessCount: number;
  neutralCount: number;
  weakFailureCount: number;
  strongFailureCount: number;
  overallSuccessRate: number;
  avgTimeToValidateMs: number;
  lastUpdated: string;
}

/** Confidence decay configuration */
export interface ConfidenceDecayConfig {
  decayStartDays: number;
  decayRatePerWeek: number;
  minimumConfidence: number;
}

/** Pattern feedback signal from Layer 3 back to Layer 2 */
export interface PatternFeedbackSignal {
  recommendationType: string;
  signalType: 'boost' | 'dampen' | 'neutral';
  magnitude: number;
  reason: string;
  affectedPatterns: string[];
  suggestedConfidenceAdjustment: number;
}

/** Meta-learning insights aggregate */
export interface MetaLearningInsights {
  typeSuccessRates: Record<string, number>;
  avgTimeToValidate: Record<string, number>;
  mostImpactfulType: string;
  leastReliableType: string;
  pendingEvaluationCount: number;
  expiredCount: number;
  recommendations: string[];
}

// ============================================================================
// Dashboard Types
// ============================================================================

/** Dashboard view combining all data sources */
export interface DashboardView {
  teams: TeamDashboardEntry[];
  pendingRecommendations: Recommendation[];
  failurePatterns: FailureSignature[];
  metaLearning: MetaLearningInsights;
  townTopology: TownGraph;
  lastUpdated: string;
}

/** Team entry for dashboard display */
export interface TeamDashboardEntry {
  teamId: string;
  members: string[];
  score: number;
  tasksCompleted: number;
  avgSuccessRate: number;
  status: 'active' | 'pending' | 'disbanded';
}

/** Wasteland policy output format */
export interface WastelandPolicy {
  id: string;
  type: 'town-persona' | 'decomposition-rule' | 'routing-policy' | 'activation-gate';
  townId?: string;
  config: Record<string, unknown>;
  sourceRecommendationId: string;
  createdAt: string;
  version: string;
}
