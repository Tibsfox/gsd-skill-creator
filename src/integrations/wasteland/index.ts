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

// Stamp Validator
export {
  parseEvidence,
  scoreQuality,
  scoreReliability,
  scoreCreativity,
  computeValence,
  computeConfidence,
  classifySeverity,
  generateStampId,
  generateMessage,
  parseTags,
  buildStamp,
  toSQL,
  toSQLScript,
  validate as validateCompletions,
  createDoltHubProvider,
} from './stamp-validator.js';
export type {
  WantedItem,
  CompletionRecord,
  EvidenceSignals,
  Valence,
  StampRecommendation,
  ValidatorConfig,
  ValidationResult,
  ValidationDataProvider,
} from './stamp-validator.js';

// Centercamp Infrastructure (Phase 1/2)
export {
  sqlEscape,
  screenForInjection,
} from './sql-escape.js';

export {
  createClient,
} from './dolthub-client.js';
export type {
  DoltHubClientConfig,
  QueryResult,
  ExecuteResult,
  DoltClient,
} from './dolthub-client.js';

export {
  renderTable,
  renderBadge,
  smartFit,
} from './formatters.js';

export {
  saveConfig,
  loadConfig,
  HopConfigSchema,
} from './config.js';
export type { HopConfig } from './config.js';

export {
  bootstrap,
} from './bootstrap.js';
export type { BootstrapResult } from './bootstrap.js';

// CLI Utilities (R2.4 — shared flag helpers)
export {
  hasFlag,
  getFlagValue,
  extractPositionalArgs,
} from './cli-utils.js';

// Wasteland Events (R2.1 — core event bus integration)
export {
  emitScanComplete,
  emitTrustEscalation,
  emitStampIssued,
  emitCompletionSubmitted,
} from './wasteland-events.js';
export type { WastelandEventOptions } from './wasteland-events.js';

// Trust Tier Escalation
export {
  RIGS_DDL,
  buildContributorRules,
  buildMaintainerRules,
  evaluateRule,
  evaluateRig,
  scanForEscalation,
  toPromotionSQL,
  toPromotionReport,
  formatEvaluation,
  createDoltHubEscalationProvider,
} from './trust-escalation.js';
export type {
  RigRecord,
  StampSummary,
  CompletionSummary,
  EscalationRule,
  EscalationCriterion,
  EscalationContext,
  CriterionResult,
  EscalationEvaluation,
  EscalationScanResult,
  EscalationDataProvider,
} from './trust-escalation.js';

// Pattern Bridge (R2.3 — wasteland → PatternStore storage)
export {
  storeFeedback,
  storeRecommendation,
  storeMetricSnapshot,
  readFeedback,
  readRecommendations,
  readMetricSnapshots,
} from './wasteland-pattern-bridge.js';

// Observation Bridge (R3 — observation layer adapters)
export {
  DoltHubPatternAdapter,
  TrustScorer,
  StampGatekeeper,
  ValidationLineage,
  TrustDriftMonitor,
  computeBehaviorHash,
} from './observation-bridge.js';
export type { TrustSignals, StampQualitySignals } from './observation-bridge.js';

// Services Bridge (R4 — services layer adapters)
export {
  createWastelandCallbacks,
  evaluateTrustGate,
  TRUST_LEVEL_REQUIREMENTS,
  signalToStamp,
  ScanScheduler,
  DEFAULT_SCAN_CONFIG,
} from './services-bridge.js';
export type {
  WastelandPhaseResult,
  WastelandCallbacks,
  DoltOperations,
  TrustGateDecision,
  CompletionSignalInput,
  ScanSchedulerConfig,
} from './services-bridge.js';

// Educational Layer (R5 — newcomer onboarding)
export { WantedRegistry } from './wanted-registry.js';
export type { WantedEntry, WantedSearchCriteria, WantedDataProvider } from './wanted-registry.js';

export { PackSessionDriver } from './pack-session-driver.js';
export type { PhaseCompletion, PackProgress } from './pack-session-driver.js';

// Federation Dashboard (R6 — topology, metrics, health)
export {
  buildFederationTopology,
  computeRigMetrics,
  computeFederationHealth,
} from './federation-dashboard.js';
export type {
  FederationNode,
  FederationEdge,
  FederationTopology,
  FederationTopologyInput,
  RigMetrics,
  FederationHealth,
} from './federation-dashboard.js';

// Agent Role Converter (R7 — skill-creator ↔ wasteland format bridge)
export {
  convertToWastelandRole,
  convertFromWastelandRole,
  validateWastelandRole,
  serializeWastelandRole,
} from './agent-role-converter.js';
export type {
  WastelandRoleFrontmatter,
  WastelandRoleFile,
} from './agent-role-converter.js';

// Agent Submission Workflow (R7 — skill-creator → wasteland federation)
export {
  AgentSubmissionWorkflow,
  DEFAULT_SUBMISSION_CONFIG,
} from './agent-submission-workflow.js';
export type {
  SubmissionConfig,
  SubmissionResult,
  PendingSubmission,
} from './agent-submission-workflow.js';

// Trust Relationships (Unit Circle Model — interpersonal trust)
export {
  computeVector,
  classifyVector,
  describeVector,
  createContract,
  isContractActive,
  contractTimeRemaining,
  renewContract,
  contractTotalDuration,
  createRelationship,
  computeHarmony,
  getActiveRelationships,
  getRelationshipsForRig,
  aggregateTrustStrength,
  createCharacterSheet,
  getPublicProfile,
  formatRelationship,
} from './trust-relationship.js';
export type {
  TrustVector,
  TrustContractType,
  TrustContract,
  TrustRelationship,
  CharacterSheet,
} from './trust-relationship.js';

// Trust Relationship Provider (DoltHub-backed storage + escalation bridge)
export {
  TRUST_CONTRACTS_DDL,
  TRUST_RELATIONSHIPS_DDL,
  CHARACTER_SHEETS_DDL,
  generateSchemaDDL,
  createDoltHubTrustProvider,
  computeEscalationBonus,
  relationshipToSQL,
  characterSheetToSQL,
} from './trust-relationship-provider.js';
export type {
  TrustRelationshipDataProvider,
} from './trust-relationship-provider.js';

// Trust Registration (Stage 4 — arrival + Welcome Home badge)
export {
  WELCOME_BADGES_DDL,
  generateRigHandle,
  validateDisplayName,
  issueWelcomeHomeBadge,
  register,
  generateRegistrationSQL,
  announceArrival,
} from './trust-registration.js';
export type {
  WelcomeHomeBadge,
  RegistrationInput,
  RegistrationResult,
  RegistrationDataProvider,
} from './trust-registration.js';

// Trust Graph Intelligence (Unit Circle Model — graph algorithms)
export {
  classifyAsymmetry,
  classifyPair,
  detectBonds,
  computeBridgePotential,
  computeGraphDiversity,
  oldGrowthConnectionFloor,
  assessOldGrowthReadiness,
  describeAsymmetry,
  describeBridge,
} from './trust-graph.js';
export type {
  AsymmetryCategory,
  AsymmetryResult,
  Bond,
  BridgePath,
  GraphDiversity,
  OldGrowthAssessment,
} from './trust-graph.js';

// Trust Hardening (privacy guard, visibility, heartbeat scheduler)
export {
  PRIVATE_TABLES,
  validateDoltPush,
  canViewRelationship,
  findRenewableContracts,
  executeHeartbeatCycle,
} from './trust-hardening.js';
export type {
  RenewalAttempt,
  HeartbeatResult,
} from './trust-hardening.js';

// Trust Relationship Provider — ensureSchema
export {
  ensureSchema,
} from './trust-relationship-provider.js';

// Trust CLI Renderer (Stage 5 — progressive disclosure rendering)
export {
  detailLevel,
  renderTrustBadge,
  renderContractType,
  formatTimeRemaining,
  renderRelationshipCompact,
  renderRelationshipDetail,
  renderRelationshipList,
  renderTrustOverview,
  renderCharacterSheet,
  renderPublicProfile,
  TRUST_HELP,
  CHARACTER_HELP,
  WHO_HELP,
} from './trust-cli-renderer.js';
export type {
  DetailLevel,
  TrustOverviewStats,
} from './trust-cli-renderer.js';

// Trust Federation (Stage 6 — cross-instance protocol)
export {
  DEFAULT_CLOCK_SKEW_MS,
  withinClockSkew,
  adjustForClockOffset,
  measureClockOffset,
  eventTTLFromCalendar,
  isDuringEvent,
  findActiveEvent,
  findNextEvent,
  PUBLIC_EXPORT_FIELDS,
  PRIVATE_EXPORT_FIELDS,
  filterForExport,
  containsPrivateFields,
  createAttestation,
  magnitudeToBucket,
  createBridgeAttestation,
  DEFAULT_MAX_ATTESTATION_AGE_MS,
  validateAttestation,
  computeFederatedBridges,
} from './trust-federation.js';
export type {
  FederationInstance,
  TrustAttestation,
  BridgeAttestation,
  BurnEvent,
  FederatedBridgePath,
} from './trust-federation.js';

// UTC Timestamp Enforcement
export {
  isUTC,
  assertUTC,
  toUTCString,
  parseUTC,
  normalizeToUTC,
} from './utc.js';

// Schema Evolution (version-aware DDL migration)
export {
  getSchemaVersion,
  setSchemaVersion,
  diffSchema,
  generateMigrationSQL,
  migrate,
  findSchema,
  SCHEMA_1_0,
  SCHEMA_1_1,
  SCHEMA_REGISTRY,
} from './schema-evolution.js';
export type {
  ColumnDef,
  TableDef,
  SchemaVersion,
  MigrationOp,
  SchemaDiff,
  MigrationResult,
} from './schema-evolution.js';

// Herald Agent (intelligence briefing composer)
export {
  routeToTiers,
  filterBySeverity,
  filterByAge,
  groupByType,
  countBySeverity,
  renderGlance,
  renderScan,
  renderRead,
  runHerald,
  DEFAULT_HERALD_CONFIG,
} from './herald-agent.js';
export type {
  DisclosureLevel,
  HeraldConfig,
  RenderedBriefing,
  HeraldResult,
  HeraldInput,
} from './herald-agent.js';

// Gas City Role Parser (frontmatter + markdown role file parser)
export {
  GasCityRoleSchema,
  extractFrontmatter,
  parseGasCityRole,
  parseGasCityRoleFile,
  discoverRoles,
  validateRole,
} from './gas-city-role-parser.js';
export type {
  GasCityRoleFrontmatter,
  GasCityRole,
  DiscoveryResult,
  ValidationResult as GasCityValidationResult,
} from './gas-city-role-parser.js';
