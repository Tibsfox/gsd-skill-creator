/**
 * Bundle manifest YAML composer.
 *
 * Composes the bundle manifest YAML deposited at
 * `.planning/staging/inbox/bundles/<bundle-id>.bundle.yaml` (PRD format,
 * §Bundle Manifest YAML in 10-mission-emitter.md). The YAML carries rich
 * decision objects with title/skill/speed_hint, batch_hints structure, and
 * optional excluded_from_bundle entries — distinct from the schema-shaped
 * Bundle table row used internally by KBStore.
 *
 * Phase 825 / C10 (T5).
 */

import yaml from 'js-yaml';
import type { BundleId, MeetingId, ProjectId, SnapshotId } from '../types.js';

export interface ManifestDecisionEntry {
  request_id: string;
  skill: 'vision-to-mission' | 'research-mission-generator' | 'analyze';
  speed_hint: 'full' | 'fast' | 'mission-only';
  title: string;
}

export interface ManifestExcludedEntry {
  request_id: string;
  title: string;
  reason: 'sent_now' | 'withdrawn';
  sent_at?: string;
}

export interface ManifestBatchHints {
  parallelizable: string[][];
  shared_context: string[];
  suggested_order: string[];
}

export interface BundleManifestData {
  bundle_id: BundleId;
  meeting_id: MeetingId;
  emitted_at: string;
  project: ProjectId;
  branch?: string;
  kb_snapshot: SnapshotId;
  decisions: ManifestDecisionEntry[];
  batch_hints: ManifestBatchHints;
  excluded_from_bundle: ManifestExcludedEntry[];
}

/**
 * Render the bundle manifest as a YAML string suitable for atomic deposit.
 *
 * Structure follows the PRD §Bundle Manifest YAML example exactly. The output
 * is round-trip compatible with `yaml.load()`.
 */
export function composeBundleManifest(data: BundleManifestData): string {
  // Build the canonical structure. Field ordering preserved by passing an
  // ordered object through js-yaml's `sortKeys: false` default.
  const payload: Record<string, unknown> = {
    bundle_id: data.bundle_id,
    meeting_id: data.meeting_id,
    emitted_at: data.emitted_at,
    project: data.project,
  };
  if (data.branch !== undefined) {
    payload.branch = data.branch;
  }
  payload.kb_snapshot = data.kb_snapshot;

  payload.decisions = data.decisions.map((d) => ({
    request_id: d.request_id,
    skill: d.skill,
    speed_hint: d.speed_hint,
    title: d.title,
  }));

  payload.batch_hints = {
    parallelizable: data.batch_hints.parallelizable,
    shared_context: data.batch_hints.shared_context,
    suggested_order: data.batch_hints.suggested_order,
  };

  payload.excluded_from_bundle = data.excluded_from_bundle.map((e) => {
    const entry: Record<string, unknown> = {
      request_id: e.request_id,
      title: e.title,
      reason: e.reason,
    };
    if (e.sent_at) entry.sent_at = e.sent_at;
    return entry;
  });

  return yaml.dump(payload, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}

/**
 * Parse a manifest YAML string back into the structured form. Used by the
 * bundle-pickup format-compliance test (T11).
 */
export function parseBundleManifest(yamlText: string): BundleManifestData {
  const obj = yaml.load(yamlText) as Record<string, unknown>;
  if (typeof obj !== 'object' || obj == null) {
    throw new Error('manifest YAML did not parse to an object');
  }
  return {
    bundle_id: obj.bundle_id as BundleId,
    meeting_id: obj.meeting_id as MeetingId,
    emitted_at: obj.emitted_at as string,
    project: obj.project as ProjectId,
    branch: obj.branch as string | undefined,
    kb_snapshot: obj.kb_snapshot as SnapshotId,
    decisions: (obj.decisions as ManifestDecisionEntry[]) ?? [],
    batch_hints:
      (obj.batch_hints as ManifestBatchHints) ?? {
        parallelizable: [],
        shared_context: [],
        suggested_order: [],
      },
    excluded_from_bundle:
      (obj.excluded_from_bundle as ManifestExcludedEntry[]) ?? [],
  };
}
