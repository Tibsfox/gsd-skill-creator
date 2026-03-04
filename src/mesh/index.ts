/**
 * Mesh module barrel exports.
 *
 * Re-exports all public types, schemas, constants, and service classes for:
 * - Mesh node discovery and heartbeat monitoring (Phase 52, Plan 02)
 * - DACP bundle provenance tracking (Phase 52, Plan 03)
 * - Fidelity-adaptive compression (Phase 52, Plan 03)
 * - Mesh bundle transport with routing and relay (Phase 52, Plan 03)
 * - Routing types, scoring, and cost-aware policy (Phase 53, Plan 01)
 * - MeshCoordinator with dispatch and failover (Phase 53, Plan 02)
 * - Wave planner and multi-model optimizer (Phase 53, Plan 03)
 * - Context types, transcript summarizer, and result ingestion (Phase 54, Plan 01)
 * - Mesh worktree manager and proxy committer (Phase 54, Plan 02)
 * - Skill manifest and packager (Phase 54, Plan 03)
 * - Skill Creator MCP Server (Phase 54, Plan 04)
 */

// Types and schemas
export {
  NodeCapabilitySchema,
  MeshNodeSchema,
  HeartbeatConfigSchema,
  MeshEventTypeSchema,
  MeshEventSchema,
  // IMP-03 constants
  DEFAULT_HEARTBEAT_INTERVAL_MS,
  MAX_MISSED_HEARTBEATS,
  DEFAULT_CHECK_INTERVAL_MS,
  MESH_EVENT_LOG_VERSION,
} from './types.js';

export type {
  NodeCapability,
  MeshNode,
  HeartbeatConfig,
  MeshEventType,
  MeshEvent,
} from './types.js';

// Event log
export {
  buildMeshEvent,
  writeMeshEvent,
  readMeshEvents,
  MeshEventLog,
} from './event-log.js';

export type { WriteMeshEventInput } from './event-log.js';

// Discovery service
export {
  DiscoveryService,
  createDiscoveryService,
} from './discovery.js';

export type { RegisterNodeInput } from './discovery.js';

// Provenance tracking
export {
  ProvenanceHeaderSchema,
  createProvenanceHeader,
  addHop,
  getTotalHops,
  serializeProvenance,
  parseProvenance,
} from './provenance.js';

export type { ProvenanceHeader, HopEntry } from './provenance.js';

// Fidelity adapter
export {
  TransportConditionSchema,
  assessTransportCondition,
  compressBundle,
  decompressBundle,
  // IMP-03 constants
  LOCAL_LATENCY_THRESHOLD_MS,
  MESH_LATENCY_THRESHOLD_MS,
} from './fidelity-adapter.js';

export type { TransportCondition, CompressionResult } from './fidelity-adapter.js';

// Mesh transport
export {
  TransportResultSchema,
  MeshTransport,
  createMeshTransport,
} from './transport.js';

export type { TransportResult, TransportPayload, ReceiveResult } from './transport.js';

// Routing types (Phase 53, Plan 01)
export {
  RoutingRequestSchema,
  NodeScoreSchema,
  RoutingDecisionSchema,
} from './routing-types.js';

export type {
  RoutingRequest,
  NodeScore,
  RoutingDecision,
} from './routing-types.js';

// Scoring (Phase 53, Plan 01)
export {
  scoreNode,
  rankNodes,
  selectWithFallback,
  // IMP-03 constants
  CAPABILITY_WEIGHT,
  LOAD_WEIGHT,
  PERFORMANCE_WEIGHT,
} from './scoring.js';

// Routing policy (Phase 53, Plan 01)
export {
  applyCostPolicy,
  // IMP-03 constants
  LOCAL_PASS_RATE_THRESHOLD,
} from './routing-policy.js';

// Coordinator (Phase 53, Plan 02)
export {
  MeshCoordinator,
  createMeshCoordinator,
  DispatchResultSchema,
} from './coordinator.js';

export type { DispatchResult, PipelineStage, PipelineResult } from './coordinator.js';

// Wave planner (Phase 53, Plan 03)
export {
  WaveTaskSchema,
  AnnotatedTaskSchema,
  MeshWavePlanSchema,
  planMeshWave,
} from './wave-planner.js';

export type {
  WaveTask,
  AnnotatedTask,
  MeshWavePlan,
} from './wave-planner.js';

// Multi-model optimizer (Phase 53, Plan 03)
export {
  ModelGuidanceSchema,
  MultiModelReportSchema,
  generateModelGuidance,
  generateMultiModelReport,
  deriveTier,
  deriveStatus,
  buildRecommendations,
  // IMP-03 constants
  MARGINAL_PASS_RATE_THRESHOLD,
} from './multi-model-optimizer.js';

export type { ModelGuidance, MultiModelReport, Tier, Status } from './multi-model-optimizer.js';

// Context types (Phase 54, Plan 01)
export {
  DecisionRecordSchema,
  ContextSummarySchema,
  MeshExecutionResultSchema,
  GsdStateEntrySchema,
} from './context-types.js';

export type {
  DecisionRecord,
  ContextSummary,
  MeshExecutionResult,
  GsdStateEntry,
} from './context-types.js';

// Transcript summarizer (Phase 54, Plan 01)
export {
  MAX_DIGEST_LENGTH,
  extractDecisions,
  compressSteps,
  summarizeTranscript,
} from './transcript-summarizer.js';

// Result ingestion (Phase 54, Plan 01)
export {
  buildContextSummary,
  ingestMeshResult,
} from './result-ingestion.js';

// Mesh worktree manager (Phase 54, Plan 02)
export {
  buildBranchName,
  MeshBranchInfoSchema,
  MeshWorktreeManager,
  createMeshWorktreeManager,
} from './mesh-worktree.js';

export type { MeshBranchInfo, GitExecutor } from './mesh-worktree.js';

// Proxy committer (Phase 54, Plan 02)
export {
  buildProxyCommitMessage,
  ProxyCommitter,
  createProxyCommitter,
} from './proxy-committer.js';

export type { ProxyCommitResult, Artifact } from './proxy-committer.js';

// Skill manifest (Phase 54, Plan 03)
export {
  TestedModelSchema,
  MeshHintsSchema,
  SkillManifestSchema,
  buildSkillManifest,
} from './skill-manifest.js';

export type { TestedModel, MeshHints, SkillManifest } from './skill-manifest.js';

// Skill packager (Phase 54, Plan 03)
export {
  VariantEntrySchema,
  BenchmarkEntrySchema,
  SkillPackageSchema,
  packageSkill,
} from './skill-packager.js';

export type { VariantEntry, BenchmarkEntry, SkillPackage } from './skill-packager.js';

// Skill Creator MCP Server (Phase 54, Plan 04)
export {
  SkillCreatorMcpServer,
  SKILL_CREATOR_TOOLS,
  createSkillCreatorMcpServer,
} from './skill-creator-mcp.js';
