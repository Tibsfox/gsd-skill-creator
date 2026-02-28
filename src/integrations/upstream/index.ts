export type {
  ChangeType,
  Severity,
  BriefingTier,
  ImpactType,
  ComponentStatus,
  RawChangeEvent,
  ClassifiedEvent,
  AffectedComponent,
  ImpactManifest,
  PatchDiff,
  PatchValidation,
  UpstreamReference,
  PatchManifest,
  DashboardAlert,
  Briefing,
  ChannelConfig,
  ChannelState,
} from './types.js';

export { getChannels, getChannel, getChannelsByPriority, getChannelsByDomain } from './registry.js';
export { checkChannel, checkAllChannels, createRateLimiter } from './monitor.js';
export type { FetchFn, HashFn, ReadStateFn, WriteStateFn, WriteCacheFn, MonitorDeps, RateLimiter } from './monitor.js';
export { classifyChange, detectChangeType, assignSeverity, assessPatchability } from './classifier.js';
export { generateBriefing, generateFlashAlert, generateSessionBriefing, generateWeeklyDigest, generateMonthlyReport, routeSeverity, formatBriefingText } from './briefer.js';
export { validateAlert, formatAlertForTerminal, aggregateAlerts, deduplicateAlerts } from './dashboard-alerts.js';
export type { AlertValidation, AggregatedAlerts } from './dashboard-alerts.js';
export { traceImpact, findDirectImpacts, findTransitiveImpacts, buildDependencyGraph, calculateBlastRadius } from './tracer.js';
export type { ReadDirFn, TracerDeps } from './tracer.js';
export { applyPatch, calculatePatchSize, createBackup, rollback, validatePatchBounds, checkCooldown, generatePatchContent } from './patcher.js';
export type { WriteFileFn, CopyFileFn, HashFileFn, RunValidationFn, GetPatchHistoryFn, PatcherDeps, BoundsResult, CooldownResult } from './patcher.js';
export { appendLog, readLog, writeCache, readCache, createRollbackBackup, restoreFromBackup } from './persistence.js';
export type { ReadFileFn, AppendFileFn, MkdirFn, ExistsFn, PersistenceDeps } from './persistence.js';
export { saveChannelState, loadChannelState, loadAllChannelStates, updateHash, markChanged } from './channel-state.js';
export type { ChannelStateDeps } from './channel-state.js';
export { runPipeline, processSingleChannel } from './pipeline.js';
export type { PipelineDeps, PipelineResult, ChannelResult } from './pipeline.js';
