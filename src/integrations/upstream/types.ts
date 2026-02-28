/** Change type classification for upstream events */
export type ChangeType = 'breaking' | 'deprecation' | 'enhancement' | 'security' | 'optimization' | 'informational';

/** Severity levels for upstream changes */
export type Severity = 'P0' | 'P1' | 'P2' | 'P3';

/** Briefing output tiers */
export type BriefingTier = 'flash' | 'session' | 'weekly' | 'monthly';

/** Impact classification */
export type ImpactType = 'direct' | 'transitive';

/** Component activity status */
export type ComponentStatus = 'active' | 'dormant';

/** Raw change event from channel monitoring (SENTINEL output) */
export interface RawChangeEvent {
  id: string;
  channel: string;
  timestamp: string;
  content_hash_before: string;
  content_hash_after: string;
  diff_summary: string;
  raw_content: string;
}

/** Classified change event with type, severity, and domains (ANALYST output) */
export interface ClassifiedEvent extends RawChangeEvent {
  change_type: ChangeType;
  severity: Severity;
  domains: string[];
  auto_patchable: boolean;
  summary: string;
  confidence: number;
}

/** A component affected by an upstream change */
export interface AffectedComponent {
  component: string;
  impact: ImpactType;
  status: ComponentStatus;
  blast_radius: string;
  action: string;
  patchable: boolean;
  patch_size?: string;
  reason?: string;
}

/** Impact manifest for a single change (TRACER output) */
export interface ImpactManifest {
  change_id: string;
  classification: ClassifiedEvent;
  affected_components: AffectedComponent[];
  total_blast_radius: number;
}

/** Single file diff within a patch */
export interface PatchDiff {
  path: string;
  before: string;
  after: string;
}

/** Patch validation results */
export interface PatchValidation {
  tests_passed: boolean;
  lint_passed: boolean;
  size_within_bounds: boolean;
}

/** Reference to the upstream change that triggered a patch */
export interface UpstreamReference {
  channel: string;
  change_id: string;
  url?: string;
}

/** Complete patch manifest (PATCHER output) */
export interface PatchManifest {
  patch_id: string;
  change_id: string;
  target_skill: string;
  patch_type: string;
  severity: string;
  auto_approved: boolean;
  diff: PatchDiff[];
  backup_path: string;
  validation: PatchValidation;
  upstream_reference: UpstreamReference;
}

/** Dashboard alert for rendering in terminal/UI */
export interface DashboardAlert {
  id: string;
  tier: BriefingTier;
  severity: Severity;
  title: string;
  summary: string;
  timestamp: string;
  action_url?: string;
}

/** Intelligence briefing (HERALD output) */
export interface Briefing {
  tier: BriefingTier;
  date: string;
  changes: ClassifiedEvent[];
  patches_applied: PatchManifest[];
  pending_decisions: ImpactManifest[];
  dashboard_alerts: DashboardAlert[];
}

/** Channel monitoring configuration */
export interface ChannelConfig {
  name: string;
  url: string;
  type: string;
  priority: Severity;
  check_interval_hours: number;
  domains: string[];
}

/** Persisted state for a monitored channel */
export interface ChannelState {
  channel: string;
  last_hash: string;
  last_checked: string;
  last_changed?: string;
  etag?: string;
}
