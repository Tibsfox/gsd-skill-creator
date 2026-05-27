/**
 * C12 / T7 + T13 — load-kb-context.sh + S14 secret redaction.
 *
 * Tests the skill's bash helper for:
 *   - Empty KB → emits well-formed empty context
 *   - 50 findings → emits top 30 ordered by severity*confidence
 *   - Findings with secrets in rationale → secrets redacted
 *   - Source paths emitted; raw file contents NOT emitted
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import Database from 'better-sqlite3';

const SCRIPT_PATH = resolve(
  __dirname,
  '../../../project-claude/skills/intelligence-investigator/scripts/load-kb-context.sh',
);

let projectPath: string;

beforeEach(() => {
  projectPath = mkdtempSync(join(tmpdir(), 'c12-kb-'));
  // Create the per-project DB structure the script expects
  mkdirSync(join(projectPath, '.gsd', 'intelligence'), { recursive: true });
});

afterEach(() => {
  try {
    rmSync(projectPath, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

function createDb(): Database.Database {
  const db = new Database(join(projectPath, '.gsd', 'intelligence', 'intelligence.db'));
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
    CREATE TABLE bundle_decisions (
      bundle_id TEXT NOT NULL, decision_id TEXT NOT NULL,
      PRIMARY KEY (bundle_id, decision_id)
    );
  `);
  return db;
}

function runScript(projectId: string): string {
  return execFileSync('bash', [SCRIPT_PATH, projectId, projectPath], {
    encoding: 'utf8',
  });
}

// Subprocess-heavy tests (bash + python3 + sqlite3 chain) can be slow under
// vitest parallel pool when workers race on fork limits. Each test executes
// 4-7 subprocesses serially: per `runScript` call, the bash script spawns
// 4× sqlite3 + 1× python3 + 1× bash itself = ~6 forks. 7 tests in this file
// × ~6 = ~42 forks; concurrent with siblings (c12-end-to-end-flow,
// c12-write-briefing) sharing the same fork-spawn budget, the file can
// time out under heavy suite load even though isolated runs complete in
// ~10s. retry=3 (4 total attempts) makes the flake practically zero;
// per-file pool isolation would require vitest.config.ts project changes
// (deferred per #10416 lightest-wire). Re-flagged at v802; closed v817
// per #10415 deferred-maintenance escalation.
describe('C12 / T7 — load-kb-context.sh', { retry: 3, timeout: 90_000 }, () => {
  it('missing DB → emits well-formed empty context with warning', () => {
    const out = runScript('test-proj');
    const parsed = JSON.parse(out);
    expect(parsed.findings).toEqual([]);
    expect(parsed.meetings).toEqual([]);
    expect(parsed.bundles).toEqual([]);
    expect(parsed.warnings.length).toBeGreaterThan(0);
  });

  it('50 findings → emits top 30 by severity * confidence', () => {
    const db = createDb();
    const insert = db.prepare(`
      INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, produced_by, produced_at, status)
      VALUES (?, 'test-proj', 'S-1', 'dead_code', ?, ?, ?, ?, 'analyzer', '2026-05-01T00:00:00Z', 'open')
    `);
    for (let i = 0; i < 50; i++) {
      const sev = i < 10 ? 'high' : i < 25 ? 'med' : 'low';
      const conf = 0.5 + (i % 10) / 20;
      insert.run(`F-${String(i).padStart(3, '0')}`, sev, conf, `Title ${i}`, `Rationale ${i}`);
    }
    db.close();

    const out = runScript('test-proj');
    const parsed = JSON.parse(out);
    expect(parsed.findings.length).toBe(30);
    // First should be a high-severity finding
    expect(parsed.findings[0].severity).toBe('high');
  });

  it('S14: API key in rationale is redacted', () => {
    const db = createDb();
    db.prepare(`
      INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, produced_by, produced_at, status)
      VALUES (?, 'test-proj', 'S-1', 'hot_spot', 'high', 0.9, ?, ?, 'analyzer', '2026-05-01T00:00:00Z', 'open')
    `).run(
      'F-secret',
      'Hard-coded credential',
      'Found ANTHROPIC_API_KEY=sk-ant-api03-12345678901234567890123456789012abcd in production code',
    );
    db.close();

    const out = runScript('test-proj');
    expect(out).not.toMatch(/sk-ant-api03-12345678901234567890123456789012abcd/);
    expect(out).toMatch(/REDACTED/);
  });

  it('S14: GitHub token in rationale is redacted', () => {
    const db = createDb();
    db.prepare(`
      INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, produced_by, produced_at, status)
      VALUES (?, 'test-proj', 'S-1', 'hot_spot', 'high', 0.9, ?, ?, 'analyzer', '2026-05-01T00:00:00Z', 'open')
    `).run(
      'F-gh-secret',
      'Token leak',
      'Found ghp_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789 in test fixture',
    );
    db.close();

    const out = runScript('test-proj');
    expect(out).not.toMatch(/ghp_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/);
    expect(out).toMatch(/REDACTED-GITHUB-TOKEN|REDACTED/);
  });

  it('source_path is emitted (for finding-location reference)', () => {
    const db = createDb();
    db.prepare(`
      INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, source_path, produced_by, produced_at, status)
      VALUES (?, 'test-proj', 'S-1', 'dead_code', 'med', 0.8, ?, ?, ?, 'analyzer', '2026-05-01T00:00:00Z', 'open')
    `).run('F-loc', 'Finding with location', 'Some rationale.', 'src/old.ts');
    db.close();

    const out = runScript('test-proj');
    expect(out).toMatch(/src\/old\.ts/);
  });

  it('script does NOT emit raw source-file content (file contents not loaded)', () => {
    const db = createDb();
    db.prepare(`
      INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, source_path, produced_by, produced_at, status)
      VALUES (?, 'test-proj', 'S-1', 'dead_code', 'med', 0.8, ?, ?, ?, 'analyzer', '2026-05-01T00:00:00Z', 'open')
    `).run('F-noread', 'Finding', 'Rationale only.', 'src/secret-config.ts');
    db.close();

    // Even if a file existed at that path, the script doesn't read it.
    // We assert that no file-content shape leaks into output (no shebang lines,
    // no import statements, no const declarations).
    const out = runScript('test-proj');
    expect(out).not.toMatch(/^#!/m);
    expect(out).not.toMatch(/^import .* from/m);
    expect(out).not.toMatch(/^const .+ = /m);
  });

  it('meetings + bundles tables populate correctly', () => {
    const db = createDb();
    db.prepare(`
      INSERT INTO meetings (id, project_id, started_at, committed_at, status, kb_snapshot)
      VALUES (?, 'test-proj', '2026-05-01T10:00:00Z', '2026-05-01T11:00:00Z', 'committed', 'S-1')
    `).run('M-test01');
    db.prepare(`
      INSERT INTO bundles (id, meeting_id, emitted_at, manifest_path, batch_hints)
      VALUES (?, 'M-test01', '2026-05-01T11:00:00Z', '/tmp/manifest.yaml', ?)
    `).run('M-test01', '{"parallelizable":[],"shared_context":[],"suggested_order":[]}');
    db.prepare(`
      INSERT INTO decisions (id, meeting_id, kind, state, ai_draft_title, developer_modifications, source_findings)
      VALUES (?, 'M-test01', 'research_mission', 'bundled', ?, '[]', '[]')
    `).run('d-1', 'Investigate something');
    db.prepare(`INSERT INTO bundle_decisions (bundle_id, decision_id) VALUES ('M-test01', 'd-1')`).run();
    db.close();

    const out = runScript('test-proj');
    const parsed = JSON.parse(out);
    expect(parsed.meetings.length).toBe(1);
    expect(parsed.bundles.length).toBe(1);
    expect(parsed.bundles[0].decisions.length).toBe(1);
  });
});
