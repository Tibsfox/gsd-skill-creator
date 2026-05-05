/**
 * Intelligence Dashboard — IPC-to-HTTP bridge for browser-tab mode.
 *
 * Closes the v1.49.597 spec gap: mission promised "same UI bundle in Tauri shell
 * AND browser tab" but Phase 825's planned WS bridge never landed. This module
 * exposes the same 18 KB commands as the Tauri IPC server, but over HTTP, so
 * scripts/serve-dashboard.mjs can route browser-tab calls to a real KBStore
 * instance.
 *
 * Phase 826.5 follow-on (post-G2 closure on dev).
 */

import { KBStore } from './kb/store.js';
import { getIntelligenceEventBus } from './events/bus.js';
import { installAtlasCommands } from './atlas-bridge.js';
import type { ProjectId, MeetingId, DecisionId, FindingId } from './types.js';

// ─── Command dispatch table ────────────────────────────────────────────────────

type CommandHandler = (kb: KBStore, args: Record<string, unknown>) => Promise<unknown>;

const COMMANDS: Record<string, CommandHandler> = {
  // Project commands
  intelligence_list_projects: (kb, args) =>
    kb.listProjects({ sort: args.sort as 'recent' | 'priority' | 'findings' | undefined }),
  intelligence_get_project: (kb, args) =>
    kb.getProject(args.projectId as ProjectId),
  intelligence_register_project: (kb, args) =>
    kb.registerProject(args.project as Parameters<KBStore['registerProject']>[0]),

  // Briefing commands
  intelligence_get_briefing: (kb, args) =>
    kb.getCurrentBriefing(args.projectId as ProjectId),

  // Findings commands
  intelligence_list_findings: (kb, args) =>
    kb.listOpenFindings(args.projectId as ProjectId),
  intelligence_dismiss_finding: (kb, args) =>
    kb.dismissFinding(args.findingId as FindingId, args.rationale as string | undefined),

  // Meeting commands
  intelligence_start_meeting: async (kb, args) => {
    // start_meeting with no snapshot — caller may pass snapshotId or it's derived
    const snapshotId = (args.snapshotId as string) || `S-${Date.now()}`;
    return kb.startMeeting(args.projectId as ProjectId, snapshotId);
  },
  intelligence_park_meeting: (kb, args) =>
    kb.parkMeeting(args.meetingId as MeetingId),
  intelligence_resume_meeting: async (kb, args) => {
    // KBStore doesn't have explicit resumeMeeting; getMeeting + state check
    const meetingId = args.meetingId as MeetingId;
    const meetings = await (kb as unknown as { listMeetingsByStatus?: (s: string) => Promise<unknown[]> }).listMeetingsByStatus?.('parked');
    if (Array.isArray(meetings)) {
      const found = meetings.find((m): m is { id: string } =>
        typeof m === 'object' && m !== null && 'id' in m && (m as { id: string }).id === meetingId
      );
      if (found) return found;
    }
    throw new Error(`Meeting ${meetingId} not found or not in parked state`);
  },
  intelligence_get_meeting_record: async (_kb, args) => {
    // Meeting record lives at .planning/intelligence/meetings/M-*.md (local-only)
    // Return raw markdown text. Phase 825 / C11 produces this file.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const meetingId = args.meetingId as string;
    // Search for the file matching the meeting ID
    const meetingsDir = path.resolve('.planning/intelligence/meetings');
    if (!fs.existsSync(meetingsDir)) return '';
    const files = fs.readdirSync(meetingsDir).filter((f) => f.endsWith('.md'));
    for (const f of files) {
      const content = fs.readFileSync(path.join(meetingsDir, f), 'utf8');
      if (content.includes(meetingId)) return content;
    }
    return '';
  },

  // Decision commands
  intelligence_add_decision: (kb, args) =>
    kb.addDecision(
      args.meetingId as MeetingId,
      args.draft as Parameters<KBStore['addDecision']>[1]
    ),
  // Phase 827 / C03 — replace 3 throw-stubs with real KBStore method calls
  // (C01 landed editDecision / withdrawDecision / previewBundle on KBStore).
  intelligence_edit_decision: (kb, args) => {
    if (!kb.editDecision) {
      throw new Error('intelligence_edit_decision: KBStore.editDecision not implemented');
    }
    return kb.editDecision(args.decisionId as DecisionId, args.modifications as string[]);
  },
  intelligence_withdraw_decision: (kb, args) => {
    if (!kb.withdrawDecision) {
      throw new Error('intelligence_withdraw_decision: KBStore.withdrawDecision not implemented');
    }
    return kb.withdrawDecision(args.decisionId as DecisionId);
  },
  intelligence_send_now: (kb, args) =>
    kb.promoteToSendNow(args.decisionId as DecisionId),
  intelligence_preview_bundle: (kb, args) => {
    if (!kb.previewBundle) {
      throw new Error('intelligence_preview_bundle: KBStore.previewBundle not implemented');
    }
    return kb.previewBundle(args.meetingId as MeetingId);
  },
  intelligence_commit_bundle: (kb, args) =>
    kb.commitBundle(args.meetingId as MeetingId),

  // Console outbox commands (write to .planning/console/inbox/pending/)
  intelligence_request_briefing_refresh: async (_kb, args) => {
    return queueConsoleRequest('intelligence.refresh_briefing', args);
  },
  intelligence_request_snapshot_diff: async (_kb, args) => {
    return queueConsoleRequest('intelligence.snapshot_diff', args);
  },
};

// W4c: merge in 14 browser-mode atlas commands (13 read + 1 indexer dispatch +
// invalidate). The atlas surface lives in `atlas-bridge.ts` to keep this file
// focused on the core KB-command catalog.
installAtlasCommands(COMMANDS as Record<string, CommandHandler>);

// ─── Console outbox helper ─────────────────────────────────────────────────────

async function queueConsoleRequest(
  type: string,
  payload: Record<string, unknown>,
): Promise<{ id: string }> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const crypto = await import('node:crypto');

  const id = `req_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}_${crypto.randomBytes(2).toString('hex')}`;
  const inboxDir = path.resolve('.planning/console/inbox/pending');
  await fs.mkdir(inboxDir, { recursive: true });

  const content = JSON.stringify(
    {
      id,
      type,
      project: payload.projectId ?? null,
      payload,
      respond_to: `.planning/console/outbox/status/${id}.json`,
      timeout_hint_ms: 30_000,
    },
    null,
    2,
  );

  // Atomic write: tmp then rename (D-25-10 pattern)
  const finalPath = path.join(inboxDir, `${id}.json`);
  const tmpPath = `${finalPath}.tmp`;
  await fs.writeFile(tmpPath, content, 'utf8');
  await fs.rename(tmpPath, finalPath);

  return { id };
}

// ─── Public router factory ─────────────────────────────────────────────────────

interface BridgeRouter {
  /** Try to handle a request. Returns true if handled, false if not. */
  handle: (
    req: { method?: string; url?: string },
    res: { writeHead: (status: number, headers?: Record<string, string>) => unknown; end: (body?: string) => unknown },
    body: string,
  ) => Promise<boolean>;
  /** Close any open KBStore connections. */
  close: () => void;
}

export interface CreateIntelligenceBridgeOptions {
  /** Pre-constructed KBStore instance (for tests). When omitted, a default
   *  KBStore is created and wired to the global IntelligenceEventBus singleton. */
  kb?: KBStore;
}

export function createIntelligenceBridge(
  _cwd?: string,
  opts?: CreateIntelligenceBridgeOptions,
): BridgeRouter {
  const kb = opts?.kb ?? (() => {
    // Phase 827 / C03 — wire the global event bus into the bridge's KBStore
    // so KBStore writes flow to /api/events SSE subscribers.
    const store = new KBStore();
    store.setEventBus(getIntelligenceEventBus());
    return store;
  })();
  let registryReady: Promise<void> | null = null;

  // Lazy-init the registry on first request. Multiple in-flight requests
  // share the same promise (no double-open).
  const ensureReady = (): Promise<void> => {
    if (!registryReady) {
      registryReady = kb.ensureRegistry().catch((err) => {
        // Reset so a future call can retry; surface the failure to the caller.
        registryReady = null;
        throw err;
      });
    }
    return registryReady;
  };

  return {
    async handle(req, res, body) {
      const url = new URL(req.url || '/', 'http://x');
      if (req.method !== 'POST' || url.pathname !== '/api/intelligence/invoke') {
        return false;
      }

      let parsed: { cmd: string; args?: Record<string, unknown> };
      try {
        parsed = JSON.parse(body || '{}');
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `invalid JSON body: ${message}` }));
        return true;
      }

      const handler = COMMANDS[parsed.cmd];
      if (!handler) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `unknown command: ${parsed.cmd}` }));
        return true;
      }

      try {
        await ensureReady();
        const result = await handler(kb, parsed.args ?? {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result ?? null));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message, cmd: parsed.cmd }));
      }
      return true;
    },

    close() {
      kb.close();
    },
  };
}
