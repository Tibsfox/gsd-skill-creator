/**
 * Phase 827 / C03 — dashboard-bridge wiring tests.
 *
 * Verifies the 3 previously-throw-stubbed bridge commands now dispatch to
 * real KBStore methods:
 *   - intelligence_edit_decision
 *   - intelligence_withdraw_decision
 *   - intelligence_preview_bundle
 *
 * Each test constructs an isolated KBStore (custom registryPath in tmpdir),
 * passes it to createIntelligenceBridge, and exercises the HTTP layer via
 * mock req/res.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createIntelligenceBridge } from '../dashboard-bridge.js';
import { KBStore } from '../kb/store.js';
import type { ProjectId } from '../types.js';

interface MockResponse {
  status: number | null;
  headers: Record<string, string>;
  body: string;
  writeHead(s: number, h?: Record<string, string>): MockResponse;
  end(b?: string): MockResponse;
}

function makeRes(): MockResponse {
  const res: MockResponse = {
    status: null,
    headers: {},
    body: '',
    writeHead(s, h) {
      res.status = s;
      if (h) Object.assign(res.headers, h);
      return res;
    },
    end(b) {
      res.body = b ?? '';
      return res;
    },
  };
  return res;
}

interface SeedResult {
  kb: KBStore;
  projectId: ProjectId;
  meetingId: string;
  decisionId: string;
  cleanup: () => void;
}

async function seedKB(): Promise<SeedResult> {
  const tmpDir = mkdtempSync(join(tmpdir(), 'phase-827-c03-'));
  const registryPath = join(tmpDir, 'registry.db');

  const kb = new KBStore({ registryPath });
  await kb.ensureRegistry();

  const projectId = 'P-c03-test' as ProjectId;
  await kb.registerProject({
    id: projectId,
    name: 'C03-Bridge-Test',
    path: tmpDir,
    kind: 'code',
    priority: 'med',
    last_activity_at: new Date().toISOString(),
  });
  await kb.ensureProjectDB(projectId);

  const snap = await kb.writeSnapshot({
    project_id: projectId,
    taken_at: new Date().toISOString(),
    files_scanned: 0,
    loc_total: 0,
  });
  const meeting = await kb.startMeeting(projectId, snap.id);

  const decision = await kb.addDecision(meeting.id, {
    kind: 'analysis_run',
    state: 'pending',
    ai_draft: null,
    source_findings: [],
    developer_modifications: [],
    approved_at: null,
    emitted_at: null,
    emission_path: null,
  });

  return {
    kb,
    projectId,
    meetingId: meeting.id,
    decisionId: decision.id,
    cleanup: () => {
      try {
        kb.close();
      } catch { /* ignore close errors during teardown */ }
      try {
        rmSync(tmpDir, { recursive: true, force: true });
      } catch { /* ignore cleanup errors */ }
    },
  };
}

describe('Phase 827 / C03 — bridge wiring (3 previously-stubbed commands)', () => {
  let seed: SeedResult;

  beforeEach(async () => {
    seed = await seedKB();
  });

  afterEach(() => {
    seed.cleanup();
  });

  it('T1: intelligence_edit_decision returns 200 with updated Decision (modifications appended)', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: seed.kb });
    const res = makeRes();
    const body = JSON.stringify({
      cmd: 'intelligence_edit_decision',
      args: { decisionId: seed.decisionId, modifications: ['fix typo', 'tighten scope'] },
    });

    const handled = await bridge.handle(
      { method: 'POST', url: '/api/intelligence/invoke' },
      res,
      body,
    );

    expect(handled).toBe(true);
    expect(res.status).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.id).toBe(seed.decisionId);
    expect(parsed.developer_modifications).toEqual(['fix typo', 'tighten scope']);
  });

  it('T2: intelligence_withdraw_decision returns 200 with state=withdrawn', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: seed.kb });
    const res = makeRes();
    const body = JSON.stringify({
      cmd: 'intelligence_withdraw_decision',
      args: { decisionId: seed.decisionId },
    });

    const handled = await bridge.handle(
      { method: 'POST', url: '/api/intelligence/invoke' },
      res,
      body,
    );

    expect(handled).toBe(true);
    expect(res.status).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.id).toBe(seed.decisionId);
    expect(parsed.state).toBe('withdrawn');
  });

  it('T3: intelligence_preview_bundle returns 200 with BundlePreview shape', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: seed.kb });
    const res = makeRes();
    const body = JSON.stringify({
      cmd: 'intelligence_preview_bundle',
      args: { meetingId: seed.meetingId },
    });

    const handled = await bridge.handle(
      { method: 'POST', url: '/api/intelligence/invoke' },
      res,
      body,
    );

    expect(handled).toBe(true);
    expect(res.status).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.meeting_id).toBe(seed.meetingId);
    expect(parsed.decision_count).toBe(1);
    expect(Array.isArray(parsed.decisions)).toBe(true);
    expect(parsed.decisions[0].id).toBe(seed.decisionId);
  });

  it('T4: invalid decisionId returns 500 with descriptive error message', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: seed.kb });
    const res = makeRes();
    const body = JSON.stringify({
      cmd: 'intelligence_edit_decision',
      args: { decisionId: 'D-does-not-exist', modifications: ['bad'] },
    });

    const handled = await bridge.handle(
      { method: 'POST', url: '/api/intelligence/invoke' },
      res,
      body,
    );

    expect(handled).toBe(true);
    expect(res.status).toBe(500);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toMatch(/D-does-not-exist|decision/i);
    expect(parsed.cmd).toBe('intelligence_edit_decision');
  });
});
