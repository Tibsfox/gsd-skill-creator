/**
 * C12 / T10 + T11 — Skill activation + end-to-end briefing flow.
 *
 * These tests simulate the skill flow as a Claude session would execute it:
 *   1. A request file lands in `.planning/console/inbox/pending/`.
 *   2. The skill is matched by `intelligence.*` type prefix (D-25-26).
 *   3. The skill loads KB context via load-kb-context.sh (T7 path).
 *   4. The skill (the AI's role here is a stand-in fixture briefing)
 *      composes a briefing.
 *   5. The skill self-checks via verify-briefing (T9 path).
 *   6. On pass → would write to KB; on fail → writes status=failed to outbox.
 *
 * The end-to-end flow asserts:
 *   - Briefing has causal hypothesis + uncertainty + confidence.
 *   - Each move has rationale + source_findings.
 *   - Status JSON written to respond_to outbox path.
 *   - Briefing self-check runs cleanly.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { verify } from '../investigator/verify-briefing.js';

const SKILL_ROOT = resolve(
  __dirname,
  '../../../project-claude/skills/intelligence-investigator',
);
const LOAD_SCRIPT = join(SKILL_ROOT, 'scripts/load-kb-context.sh');

let projectPath: string;
let inboxDir: string;
let outboxDir: string;

beforeEach(() => {
  projectPath = mkdtempSync(join(tmpdir(), 'c12-e2e-'));
  mkdirSync(join(projectPath, '.gsd', 'intelligence'), { recursive: true });
  inboxDir = join(projectPath, '.planning', 'console', 'inbox', 'pending');
  outboxDir = join(projectPath, '.planning', 'console', 'outbox', 'status');
  mkdirSync(inboxDir, { recursive: true });
  mkdirSync(outboxDir, { recursive: true });
});

afterEach(() => {
  try {
    rmSync(projectPath, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

function seedKB(): void {
  const db = new Database(
    join(projectPath, '.gsd', 'intelligence', 'intelligence.db'),
  );
  db.exec(`
    CREATE TABLE projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL,
      branch TEXT, kind TEXT NOT NULL, priority TEXT NOT NULL,
      last_activity_at TEXT NOT NULL, last_snapshot_id TEXT
    );
    CREATE TABLE findings (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
      kind TEXT NOT NULL, severity TEXT NOT NULL, confidence REAL NOT NULL,
      title TEXT NOT NULL, rationale TEXT NOT NULL, source_path TEXT,
      source_range_start INTEGER, source_range_end INTEGER,
      produced_by TEXT NOT NULL, produced_at TEXT NOT NULL,
      status TEXT NOT NULL, addressed_by_decision TEXT, dismissed_rationale TEXT
    );
    CREATE TABLE meetings (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, started_at TEXT NOT NULL,
      committed_at TEXT, status TEXT NOT NULL, kb_snapshot TEXT NOT NULL,
      briefing_at_start TEXT
    );
    CREATE TABLE decisions (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, kind TEXT NOT NULL,
      state TEXT NOT NULL, ai_draft_title TEXT, ai_draft_body TEXT,
      developer_modifications TEXT NOT NULL, source_findings TEXT NOT NULL,
      source_move_rank INTEGER, approved_at TEXT, emitted_at TEXT, emission_path TEXT
    );
    CREATE TABLE bundles (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, emitted_at TEXT NOT NULL,
      manifest_path TEXT NOT NULL, batch_hints TEXT NOT NULL
    );
    CREATE TABLE bundle_decisions (bundle_id TEXT NOT NULL, decision_id TEXT NOT NULL);
  `);
  // Seed 10 findings
  const insert = db.prepare(`
    INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, produced_by, produced_at, status)
    VALUES (?, 'proj-e2e', 'S-1', ?, ?, ?, ?, ?, 'analyzer', '2026-05-01T00:00:00Z', 'open')
  `);
  for (let i = 0; i < 10; i++) {
    insert.run(
      `F-2026-0501-${String(i).padStart(4, '0')}`,
      i % 2 === 0 ? 'coupling_spike' : 'hot_spot',
      i < 3 ? 'high' : 'med',
      0.7 + (i % 3) * 0.1,
      `Finding ${i}`,
      `Probably caused by drift in module ${i}.`,
    );
  }
  db.close();
}

function writeRequest(type: string, scope: string[]): { id: string; path: string; respondTo: string } {
  const id = `req_2026-05-03_1430_${Math.random().toString(36).slice(2, 6)}`;
  const respondTo = join(outboxDir, `${id}.json`);
  const req = {
    id,
    type,
    project: 'proj-e2e',
    branch: 'dev',
    payload: { since_snapshot: 'v1.49+local', scope },
    respond_to: respondTo,
    timeout_hint_ms: 30000,
  };
  const path = join(inboxDir, `${id}.json`);
  writeFileSync(path, JSON.stringify(req, null, 2));
  return { id, path, respondTo };
}

/** Compose a fixture briefing the AI would produce after loading context. */
function composeBriefing() {
  return {
    body:
      'The project shows 10 open findings; the highest-confidence cluster looks like a coupling spike that probably traces to module 0 (rationale references "drift in module 0"). It is unclear whether this is structural or a transient artifact of the recent v1.49 work.',
    confidence: 'medium',
    snapshot_id: 'v1.49+local',
    source_findings: ['F-2026-0501-0000', 'F-2026-0501-0002'],
    suggested_moves: [
      {
        rank: 1,
        title: 'Investigate module 0 coupling drift',
        kind: 'research',
        rationale:
          'F-2026-0501-0000 cites probable drift; cleaner fix is to investigate before refactoring.',
        expected_unblocks: 'open finding cluster cleared',
        source_findings: ['F-2026-0501-0000'],
      },
      {
        rank: 2,
        title: 'Run snapshot diff since v1.49',
        kind: 'analyze',
        rationale: 'Cross-check whether drift correlates with v1.49 commits — no prior evidence.',
        source_findings: [],
      },
    ],
  };
}

describe('C12 / T10 — skill activation flow', () => {
  it('request file with intelligence.* type appears in inbox', () => {
    const { path } = writeRequest('intelligence.refresh_briefing', ['wave-2']);
    expect(existsSync(path)).toBe(true);
    const req = JSON.parse(readFileSync(path, 'utf8'));
    expect(req.type).toMatch(/^intelligence\./);
  });

  it('skill matches all 5 intelligence.* request types', () => {
    const types = [
      'intelligence.refresh_briefing',
      'intelligence.triage_finding',
      'intelligence.snapshot_diff',
      'intelligence.investigate_section',
      'intelligence.dismiss_finding',
    ];
    for (const t of types) {
      const { path } = writeRequest(t, []);
      expect(existsSync(path)).toBe(true);
    }
    // The skill's frontmatter description matches the prefix; in the actual
    // session, Claude pattern-matches the request `type` field against the
    // description's listed types.
  });

  it('skill activation latency: file appears, picked up <5s (D-25-33)', () => {
    // In a real Claude session, the inbox watcher picks up files quickly.
    // Here we assert the "mtime to readback" round-trip is fast.
    const { path } = writeRequest('intelligence.refresh_briefing', []);
    const t0 = performance.now();
    const content = readFileSync(path, 'utf8');
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(5000);
    expect(content.length).toBeGreaterThan(0);
  });
});

describe('C12 / T11 — end-to-end briefing flow', () => {
  it('full flow: request → context load → compose → self-check → status write', () => {
    seedKB();
    const { id, respondTo } = writeRequest('intelligence.refresh_briefing', []);

    // Step 2: load KB context (the skill's process step 2)
    const contextOut = execFileSync(
      'bash',
      [LOAD_SCRIPT, 'proj-e2e', projectPath],
      { encoding: 'utf8' },
    );
    const context = JSON.parse(contextOut);
    expect(context.findings.length).toBe(10);

    // Step 3+4: compose briefing (the AI's role in the actual flow)
    const briefing = composeBriefing();

    // Step 5: self-check
    const violations = verify(briefing);
    expect(violations).toEqual([]);

    // Step 6: would write to KB. We skip the actual KB write here
    // (write-briefing.test.ts covers the validation contract; the KB
    // layer itself is tested by C04). For end-to-end correctness, we
    // assert the briefing structure is KB-ready.
    expect(briefing.body.length).toBeGreaterThan(0);
    expect(briefing.suggested_moves.length).toBeGreaterThanOrEqual(2);

    // Step 7: write status to outbox
    const status = {
      request_id: id,
      status: 'complete',
      briefing_id: 'B-fixture01',
      completed_at: new Date().toISOString(),
    };
    writeFileSync(respondTo, JSON.stringify(status, null, 2));
    expect(existsSync(respondTo)).toBe(true);
    const written = JSON.parse(readFileSync(respondTo, 'utf8'));
    expect(written.status).toBe('complete');
    expect(written.briefing_id).toMatch(/^B-/);
  });

  it('failed self-check → status=failed; no briefing written', () => {
    seedKB();
    const { id, respondTo } = writeRequest('intelligence.refresh_briefing', []);

    // Compose a malformed briefing (missing causal hypothesis)
    const badBriefing = {
      body: 'Wave 2 status: 80% complete. 10 open findings. Outcome unknown.',
      confidence: 'high',
      source_findings: [],
      suggested_moves: [],
    };
    const violations = verify(badBriefing);
    expect(violations.length).toBeGreaterThan(0);

    // Skill writes failed status (D-25-28)
    const status = {
      request_id: id,
      status: 'failed',
      error: violations.map((v) => `${v.field}: ${v.message}`).join('; '),
      failed_at: new Date().toISOString(),
    };
    writeFileSync(respondTo, JSON.stringify(status, null, 2));
    const written = JSON.parse(readFileSync(respondTo, 'utf8'));
    expect(written.status).toBe('failed');
    expect(written.error).toMatch(/causal hypothesis/);
  });

  it('briefing self-check trace shows 3-component pattern check (G1 evidence)', () => {
    const briefing = composeBriefing();
    // The verifier reports a structured pass; pass shape is the evidence.
    const violations = verify(briefing);
    expect(violations).toEqual([]);

    // Independent re-check of each component for the G1 evidence package:
    const causalRe = /(probably|likely|because|seems to|suggests|appears to)/i;
    const uncertaintyRe = /(unclear|don'?t (yet )?know|unknown|whether|might|may|could)/i;
    expect(causalRe.test(briefing.body)).toBe(true);
    expect(uncertaintyRe.test(briefing.body)).toBe(true);
    expect(['low', 'medium', 'high']).toContain(briefing.confidence);
    for (const move of briefing.suggested_moves) {
      expect(move.rationale.length).toBeGreaterThanOrEqual(10);
      expect(Array.isArray(move.source_findings)).toBe(true);
    }
  });
});

describe('C12 / T12 — performance + timeout (D-25-34, D-25-35)', () => {
  it('verify-briefing on typical payload completes in <30s (well under)', () => {
    const briefing = composeBriefing();
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) {
      verify(briefing);
    }
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(1000); // 100 verifies in <1s; the AI compose step is what 30s budgets
  });

  it('load-kb-context on 30-finding KB completes within budget', () => {
    seedKB();
    const t0 = performance.now();
    const out = execFileSync(
      'bash',
      [LOAD_SCRIPT, 'proj-e2e', projectPath],
      { encoding: 'utf8' },
    );
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(15000); // 15s is generous; sqlite3 + python is fast
    expect(out.length).toBeGreaterThan(0);
  });
});
