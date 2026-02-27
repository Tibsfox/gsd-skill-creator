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
