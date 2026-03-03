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
