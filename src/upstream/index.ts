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
} from './types';

export { getChannels, getChannel, getChannelsByPriority, getChannelsByDomain } from './registry';
export { checkChannel, checkAllChannels, createRateLimiter } from './monitor';
export type { FetchFn, HashFn, ReadStateFn, WriteStateFn, WriteCacheFn, MonitorDeps, RateLimiter } from './monitor';
export { classifyChange, detectChangeType, assignSeverity, assessPatchability } from './classifier';
export { generateBriefing, generateFlashAlert, generateSessionBriefing, generateWeeklyDigest, generateMonthlyReport, routeSeverity, formatBriefingText } from './briefer';
export { validateAlert, formatAlertForTerminal, aggregateAlerts, deduplicateAlerts } from './dashboard-alerts';
export type { AlertValidation, AggregatedAlerts } from './dashboard-alerts';
export { traceImpact, findDirectImpacts, findTransitiveImpacts, buildDependencyGraph, calculateBlastRadius } from './tracer';
export type { ReadDirFn, TracerDeps } from './tracer';
export { applyPatch, calculatePatchSize, createBackup, rollback, validatePatchBounds, checkCooldown, generatePatchContent } from './patcher';
export type { WriteFileFn, CopyFileFn, HashFileFn, RunValidationFn, GetPatchHistoryFn, PatcherDeps, BoundsResult, CooldownResult } from './patcher';
