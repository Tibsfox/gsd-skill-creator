// Phase 47: Dependency Resolver — Public API
export type {
  ResolutionProposal,
  ChangeType,
  BackupRecord,
  RollbackResult,
  ApprovalResult,
  DryRunResult,
} from './types.js';
export { ManifestBackup, createBackup } from './manifest-backup.js';
export { ProposalDryRunner, runProposalDryRun } from './proposal-dry-runner.js';
export { HITLApprovalGate, presentForApproval, formatProposal } from './hitl-approval-gate.js';
export { RollbackEngine, rollback } from './rollback-engine.js';
export { patchManifest } from './manifest-patcher.js';
export {
  ResolverOrchestrator,
  ResolverError,
} from './resolver-orchestrator.js';
export type {
  ResolutionRequest,
  ResolutionOutcome,
} from './resolver-orchestrator.js';
