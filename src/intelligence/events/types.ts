/**
 * Intelligence event-bus types.
 *
 * Phase 827 / C00 — browser-tab parity completion.
 *
 * Defines the in-process event envelope and pub/sub interface that Phase 827
 * uses to bridge KBStore writes to the SSE broadcast channel.
 *
 * Design notes:
 * - Discriminants match the 5 event-name strings the v1.49.597 client listener
 *   already filters on (`src/intelligence/ipc.ts` `intelligenceIpc.on.*`),
 *   so no client-side rewiring is required.
 * - Payloads carry only KB-derivable fields (no auth tokens, no source content)
 *   — this extends S13/S14 safety invariants to the event surface.
 * - This module intentionally does NOT import from `ipc.ts` so the bus can be
 *   used by store-layer code (`src/intelligence/kb/store.ts`) without pulling
 *   in the `@tauri-apps/api` boundary.
 */

import type {
  BriefingId,
  BundleId,
  DecisionId,
  FindingId,
  MeetingId,
  ProjectId,
} from '../types.js';

/**
 * Discriminated union — the 5 legacy event types the v1.49.597 client listener
 * already filters on, plus the 4 atlas indexing SSE events added v1.49.607.
 */
export type IntelligenceEvent =
  // ── v1.49.597 original 5 ────────────────────────────────────────────────────
  | { type: 'intelligence:status_update'; payload: StatusUpdatePayload }
  | { type: 'intelligence:briefing_ready'; payload: BriefingReadyPayload }
  | { type: 'intelligence:findings_updated'; payload: FindingsUpdatedPayload }
  | { type: 'intelligence:meeting_record_updated'; payload: MeetingRecordUpdatedPayload }
  | { type: 'intelligence:bundle_completed'; payload: BundleCompletedPayload }
  // ── v1.49.607 atlas indexing SSE (additive; W1 Track C) ──────────────────────
  | { type: 'atlas:indexing.started'; payload: AtlasIndexingStartedPayload }
  | { type: 'atlas:indexing.progress'; payload: AtlasIndexingProgressPayload }
  | { type: 'atlas:indexing.completed'; payload: AtlasIndexingCompletedPayload }
  | { type: 'atlas:indexing.failed'; payload: AtlasIndexingFailedPayload };

export type IntelligenceEventType = IntelligenceEvent['type'];

export interface StatusUpdatePayload {
  request_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  decision_id?: DecisionId;
  message?: string;
  at: string; // ISO-8601
}

export interface BriefingReadyPayload {
  briefing_id: BriefingId;
  project_id: ProjectId;
  generated_at: string; // ISO-8601
}

export interface FindingsUpdatedPayload {
  project_id: ProjectId;
  added: FindingId[];
  removed: FindingId[];
  at: string; // ISO-8601
}

export interface MeetingRecordUpdatedPayload {
  meeting_id: MeetingId;
  record_path: string;
  at: string; // ISO-8601
}

export interface BundleCompletedPayload {
  bundle_id: BundleId;
  meeting_id: MeetingId;
  manifest_path: string;
  emitted_at: string; // ISO-8601
}

/**
 * Minimal in-process pub/sub interface.
 *
 * Implementations: `IntelligenceEventBus` (singleton, lives in `./bus.ts`,
 * landed in C02). Tests can pass a stub conforming to this interface.
 */
export interface EventBus<E> {
  /** Returns an unsubscribe function. */
  subscribe(cb: (event: E) => void): () => void;
  publish(event: E): void;
}

// ─── Atlas indexing SSE event payloads (v1.49.607 W1 Track C) ────────────────

export interface AtlasIndexingStartedPayload {
  snapshot_id: string;
}

export interface AtlasIndexingProgressPayload {
  snapshot_id: string;
  files_done: number;
  files_total: number;
}

export interface AtlasIndexingCompletedPayload {
  snapshot_id: string;
  symbols_count: number;
  calls_count: number;
  files_count: number;
}

export interface AtlasIndexingFailedPayload {
  snapshot_id: string;
  error: string;
}
