/**
 * Intelligence Dashboard — IPC client library.
 *
 * ALLOWED EXCEPTION: this is the ONLY file under `src/intelligence/` that imports
 * from `@tauri-apps/api/core` and `@tauri-apps/api/event`. All other files in
 * `src/intelligence/` and `desktop/intelligence/` route through this module.
 * Documented exception per D-24-02.
 *
 * Dual-mode: works in both Tauri shell (native invoke/listen) and browser-tab mode
 * (same commands exposed via Tauri's built-in WebSocket bridge). Feature-detects
 * `window.__TAURI__` to decide which path to use; in pure browser mode where Tauri
 * is not present, falls back to a fetch-based stub (useful for SSR / testing).
 *
 * Phase 824 / C07.
 */

import type {
  AtlasCallEdge,
  AtlasFilesChanged,
  AtlasMissionProvenance,
  AtlasSymbol,
  AtlasSymbolReference,
  AtlasTypeRelation,
  AtlasLanguage,
  Briefing,
  Bundle,
  BundleId,
  Decision,
  DecisionId,
  Finding,
  FindingId,
  Meeting,
  MeetingId,
  Project,
  ProjectId,
  SnapshotId,
  SymbolId,
  SymbolKind,
} from './types.js';

// ─── Payload types specific to IPC ─────────────────────────────────────────────

export interface RequestIdResult {
  id: string;
}

/** Response from atlas_invalidate_cache (H2 per-project eviction). */
export interface InvalidateCacheResult {
  /** 'project' when a targeted per-project eviction ran; 'all' for a full clear. */
  scope: 'project' | 'all';
  /** Number of connection cache entries actually removed (0..N). */
  evicted_count: number;
}

export interface SendNowResult {
  decision_id: string;
  emission_path: string;
  emitted_at: string;
}

export interface BundlePreview {
  meeting_id: string;
  decision_count: number;
  decisions: Decision[];
}

export interface DecisionDraftPayload {
  kind: 'vision_mission' | 'research_mission' | 'analysis_run' | 'finding_dismissal';
  ai_draft: { title: string; body: string } | null;
  source_findings: FindingId[];
  source_move_rank?: number;
}

export interface ProjectInputPayload {
  name: string;
  path: string;
  branch?: string;
  kind: 'code' | 'manuscript' | 'planning' | 'mixed';
  priority: 'high' | 'med' | 'low';
}

// ─── Status event types ─────────────────────────────────────────────────────────

export type DecisionUIState =
  | 'queued'
  | 'picked_up'
  | 'expanding'
  | 'wave_0'
  | 'wave_1'
  | 'wave_2'
  | 'wave_n'
  | 'blocked'
  | 'complete'
  | 'failed';

export interface StatusUpdateEvent {
  request_id: string;
  decision_id?: string;
  bundle_id?: string;
  project_id: string;
  state: DecisionUIState;
  sub_status?: string;
  wave_progress?: { current: number; total: number };
  result_path?: string;
  block_reason?: string;
  block_findings?: string[];
  error?: string;
  updated_at: string;
}

export interface BriefingReadyEvent {
  project_id: string;
  briefing_id: string;
}

export interface FindingsUpdatedEvent {
  project_id: string;
  snapshot_id: string;
  count: number;
}

export interface MeetingRecordUpdatedEvent {
  meeting_id: string;
  path: string;
}

export interface BundleCompletedEvent {
  bundle_id: string;
  project_id: string;
  summary: string;
}

// ─── Atlas SSE event payload types ─────────────────────────────────────────────

export interface AtlasIndexingStartedEvent {
  snapshot_id: string;
}

export interface AtlasIndexingProgressEvent {
  snapshot_id: string;
  files_done: number;
  files_total: number;
}

export interface AtlasIndexingCompletedEvent {
  snapshot_id: string;
  symbols_count: number;
  calls_count: number;
  files_count: number;
}

export interface AtlasIndexingFailedEvent {
  snapshot_id: string;
  error: string;
}

/** Summary row for listMissionsForFile. */
export interface MissionForFileSummary {
  mission_id: string;
  weight: number;
  line_count: number;
}

// ─── Tauri API imports (guarded) ────────────────────────────────────────────────

// Lazily imported to avoid crashes in non-Tauri environments (tests, SSR).
type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
type ListenFn = <T>(event: string, cb: (e: { payload: T }) => void) => Promise<() => void>;

function getTauriInvoke(): InvokeFn | null {
  // Feature detection: Tauri injects `__TAURI__` on the global object.
  // Use `globalThis` so this works in both browser/Tauri (window) and
  // Node/vitest test environments (globalThis without window).
  const g = globalThis as Record<string, unknown>;
  if (g.__TAURI__ && typeof g.__TAURI__ === 'object') {
    const tauri = g.__TAURI__ as { core?: { invoke?: InvokeFn } };
    if (tauri.core?.invoke) return tauri.core.invoke;
  }
  return null;
}

function getTauriListen(): ListenFn | null {
  const g = globalThis as Record<string, unknown>;
  if (g.__TAURI__ && typeof g.__TAURI__ === 'object') {
    const tauri = g.__TAURI__ as { event?: { listen?: ListenFn } };
    if (tauri.event?.listen) return tauri.event.listen;
  }
  return null;
}

/** Invoke a Tauri command (Tauri shell) or HTTP-dispatch via the dashboard bridge (browser). */
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const fn = getTauriInvoke();
  if (fn) {
    return fn<T>(cmd, args);
  }
  // Browser-tab mode: dispatch via the Phase 826.5 IPC-to-HTTP bridge served by
  // scripts/serve-dashboard.mjs. Same KBStore instance backs both Tauri and HTTP
  // paths, so behaviour is identical.
  if (typeof globalThis.fetch !== 'function') {
    // No fetch available (Node SSR / vitest before mocks): keep the strict reject
    // so test environments that haven't installed an HTTP stub fail loudly.
    throw new Error(`intelligence-server: not connected (cmd=${cmd})`);
  }
  const resp = await fetch('/api/intelligence/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd, args: args ?? {} }),
  });
  if (!resp.ok) {
    let message = resp.statusText;
    try {
      const errBody = await resp.json();
      if (errBody && typeof errBody === 'object' && 'error' in errBody && typeof errBody.error === 'string') {
        message = errBody.error;
      }
    } catch {
      // body wasn't JSON — keep statusText
    }
    throw new Error(`intelligence-server: ${message} (cmd=${cmd})`);
  }
  return (await resp.json()) as T;
}

/** Subscribe to a Tauri event (Tauri shell) or to an SSE channel (browser). */
async function listen<T>(event: string, cb: (payload: T) => void): Promise<() => void> {
  const fn = getTauriListen();
  if (fn) {
    return fn<T>(event, (e) => cb(e.payload));
  }
  // Browser-tab mode: subscribe to /api/events SSE; messages are JSON envelopes
  // shaped { type: '<event>', payload: T }. The dashboard server's existing
  // EventSource broadcasts both live-reload events AND intelligence events;
  // we filter by type.
  const g = globalThis as unknown as { EventSource?: typeof EventSource };
  if (typeof g.EventSource !== 'function') {
    return () => { /* noop — no EventSource available */ };
  }
  const es = new g.EventSource('/api/events');
  const handler = (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as { type?: string; payload?: T };
      if (data && data.type === event && 'payload' in data) {
        cb(data.payload as T);
      }
    } catch {
      // Non-JSON event (e.g., live-reload heartbeat) — ignore
    }
  };
  es.addEventListener('message', handler);
  return () => {
    es.removeEventListener('message', handler);
    es.close();
  };
}

// ─── Public IPC client ─────────────────────────────────────────────────────────

/**
 * All intelligence dashboard IPC calls. UI components import ONLY from this module —
 * they never call `invoke` or `listen` directly.
 */
export const intelligenceIpc = {
  // ── Project commands ────────────────────────────────────────────────────────

  listProjects(sort?: 'recent' | 'priority' | 'findings'): Promise<Project[]> {
    return invoke<Project[]>('intelligence_list_projects', { sort: sort ?? null });
  },

  getProject(projectId: ProjectId): Promise<Project | null> {
    return invoke<Project | null>('intelligence_get_project', { projectId });
  },

  registerProject(project: ProjectInputPayload): Promise<Project> {
    return invoke<Project>('intelligence_register_project', { project });
  },

  // ── Briefing commands ────────────────────────────────────────────────────────

  getBriefing(projectId: ProjectId): Promise<Briefing | null> {
    return invoke<Briefing | null>('intelligence_get_briefing', { projectId });
  },

  requestBriefingRefresh(
    projectId: ProjectId,
    branch?: string,
    conversationText?: string,
  ): Promise<RequestIdResult> {
    return invoke<RequestIdResult>('intelligence_request_briefing_refresh', {
      projectId,
      branch: branch ?? null,
      conversationText: conversationText ?? null,
    });
  },

  requestSnapshotDiff(projectId: ProjectId, branch?: string): Promise<RequestIdResult> {
    return invoke<RequestIdResult>('intelligence_request_snapshot_diff', {
      projectId,
      branch: branch ?? null,
    });
  },

  // ── Finding commands ─────────────────────────────────────────────────────────

  listFindings(projectId: ProjectId): Promise<Finding[]> {
    return invoke<Finding[]>('intelligence_list_findings', { projectId });
  },

  dismissFinding(findingId: FindingId, rationale?: string): Promise<Finding> {
    return invoke<Finding>('intelligence_dismiss_finding', {
      findingId,
      rationale: rationale ?? null,
    });
  },

  // ── Meeting commands ─────────────────────────────────────────────────────────

  startMeeting(projectId: ProjectId): Promise<Meeting> {
    return invoke<Meeting>('intelligence_start_meeting', { projectId });
  },

  parkMeeting(meetingId: MeetingId): Promise<Meeting> {
    return invoke<Meeting>('intelligence_park_meeting', { meetingId });
  },

  resumeMeeting(meetingId: MeetingId): Promise<Meeting> {
    return invoke<Meeting>('intelligence_resume_meeting', { meetingId });
  },

  getMeetingRecord(meetingId: MeetingId): Promise<string> {
    return invoke<string>('intelligence_get_meeting_record', { meetingId });
  },

  // ── Decision commands ────────────────────────────────────────────────────────

  addDecision(meetingId: MeetingId, draft: DecisionDraftPayload): Promise<Decision> {
    return invoke<Decision>('intelligence_add_decision', { meetingId, draft });
  },

  editDecision(decisionId: DecisionId, modifications: string[]): Promise<Decision> {
    return invoke<Decision>('intelligence_edit_decision', { decisionId, modifications });
  },

  withdrawDecision(decisionId: DecisionId): Promise<Decision> {
    return invoke<Decision>('intelligence_withdraw_decision', { decisionId });
  },

  sendNow(decisionId: DecisionId): Promise<SendNowResult> {
    return invoke<SendNowResult>('intelligence_send_now', { decisionId });
  },

  // ── Bundle commands ──────────────────────────────────────────────────────────

  previewBundle(meetingId: MeetingId): Promise<BundlePreview> {
    return invoke<BundlePreview>('intelligence_preview_bundle', { meetingId });
  },

  commitBundle(meetingId: MeetingId): Promise<Bundle> {
    return invoke<Bundle>('intelligence_commit_bundle', { meetingId });
  },

  // ── Atlas commands (v1.49.607 W1 Track C) ────────────────────────────────────

  listSymbolsForFile(snapshotId: SnapshotId, filePath: string): Promise<AtlasSymbol[]> {
    return invoke<AtlasSymbol[]>('atlas_list_symbols_for_file', {
      snapshotId,
      filePath,
    });
  },

  listSymbolsInSnapshot(
    snapshotId: SnapshotId,
    opts?: {
      kindFilter?: SymbolKind[];
      languageFilter?: AtlasLanguage[];
      limit?: number;
      offset?: number;
    },
  ): Promise<AtlasSymbol[]> {
    return invoke<AtlasSymbol[]>('atlas_list_symbols_in_snapshot', {
      snapshotId,
      kindFilter: opts?.kindFilter ?? null,
      languageFilter: opts?.languageFilter ?? null,
      limit: opts?.limit ?? null,
      offset: opts?.offset ?? null,
    });
  },

  getSymbol(id: SymbolId): Promise<AtlasSymbol | null> {
    return invoke<AtlasSymbol | null>('atlas_get_symbol', { id });
  },

  findSymbolsByQualifiedName(
    snapshotId: SnapshotId,
    qn: string,
  ): Promise<AtlasSymbol[]> {
    return invoke<AtlasSymbol[]>('atlas_find_symbols_by_qualified_name', {
      snapshotId,
      qn,
    });
  },

  listCallers(symbolId: SymbolId): Promise<AtlasCallEdge[]> {
    return invoke<AtlasCallEdge[]>('atlas_list_callers', { symbolId });
  },

  listCallees(symbolId: SymbolId): Promise<AtlasCallEdge[]> {
    return invoke<AtlasCallEdge[]>('atlas_list_callees', { symbolId });
  },

  listReferencesForSymbol(symbolId: SymbolId): Promise<AtlasSymbolReference[]> {
    return invoke<AtlasSymbolReference[]>('atlas_list_references_for_symbol', { symbolId });
  },

  listTypeRelationsFrom(symbolId: SymbolId): Promise<AtlasTypeRelation[]> {
    return invoke<AtlasTypeRelation[]>('atlas_list_type_relations_from', { symbolId });
  },

  listTypeRelationsTo(symbolId: SymbolId): Promise<AtlasTypeRelation[]> {
    return invoke<AtlasTypeRelation[]>('atlas_list_type_relations_to', { symbolId });
  },

  listFilesChangedByMission(missionId: string): Promise<AtlasFilesChanged[]> {
    return invoke<AtlasFilesChanged[]>('atlas_list_files_changed_by_mission', { missionId });
  },

  listMissionsForFile(
    snapshotId: SnapshotId,
    filePath: string,
  ): Promise<MissionForFileSummary[]> {
    return invoke<MissionForFileSummary[]>('atlas_list_missions_for_file', {
      snapshotId,
      filePath,
    });
  },

  listProvenanceForLine(
    snapshotId: SnapshotId,
    filePath: string,
    lineNo: number,
  ): Promise<AtlasMissionProvenance[]> {
    return invoke<AtlasMissionProvenance[]>('atlas_list_provenance_for_line', {
      snapshotId,
      filePath,
      lineNo,
    });
  },

  requestIndexSnapshot(snapshotId: SnapshotId): Promise<void> {
    return invoke<void>('atlas_request_index_snapshot', { snapshotId });
  },

  /**
   * Invalidate the Rust-side connection cache after atlas:indexing.completed.
   *
   * Returns `{ scope, evicted_count }` so callers can verify whether a targeted
   * per-project eviction or a full-clear ran (H2 per-project invalidation).
   */
  invalidateCache(projectId?: ProjectId): Promise<InvalidateCacheResult> {
    return invoke<InvalidateCacheResult>('atlas_invalidate_cache', {
      projectId: projectId ?? null,
    });
  },

  // ── Event subscriptions ──────────────────────────────────────────────────────

  on: {
    statusUpdate(cb: (e: StatusUpdateEvent) => void): Promise<() => void> {
      return listen<StatusUpdateEvent>('intelligence:status_update', cb);
    },

    briefingReady(cb: (e: BriefingReadyEvent) => void): Promise<() => void> {
      return listen<BriefingReadyEvent>('intelligence:briefing_ready', cb);
    },

    findingsUpdated(cb: (e: FindingsUpdatedEvent) => void): Promise<() => void> {
      return listen<FindingsUpdatedEvent>('intelligence:findings_updated', cb);
    },

    meetingRecordUpdated(cb: (e: MeetingRecordUpdatedEvent) => void): Promise<() => void> {
      return listen<MeetingRecordUpdatedEvent>('intelligence:meeting_record_updated', cb);
    },

    bundleCompleted(cb: (e: BundleCompletedEvent) => void): Promise<() => void> {
      return listen<BundleCompletedEvent>('intelligence:bundle_completed', cb);
    },

    // ── Atlas SSE events ─────────────────────────────────────────────────────

    atlasIndexingStarted(
      cb: (e: AtlasIndexingStartedEvent) => void,
    ): Promise<() => void> {
      return listen<AtlasIndexingStartedEvent>('atlas:indexing.started', cb);
    },

    atlasIndexingProgress(
      cb: (e: AtlasIndexingProgressEvent) => void,
    ): Promise<() => void> {
      return listen<AtlasIndexingProgressEvent>('atlas:indexing.progress', cb);
    },

    atlasIndexingCompleted(
      cb: (e: AtlasIndexingCompletedEvent) => void,
    ): Promise<() => void> {
      return listen<AtlasIndexingCompletedEvent>('atlas:indexing.completed', cb);
    },

    atlasIndexingFailed(
      cb: (e: AtlasIndexingFailedEvent) => void,
    ): Promise<() => void> {
      return listen<AtlasIndexingFailedEvent>('atlas:indexing.failed', cb);
    },
  },
} as const;

export type IntelligenceIpc = typeof intelligenceIpc;
