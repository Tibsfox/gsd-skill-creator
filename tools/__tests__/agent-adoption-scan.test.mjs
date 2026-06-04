/**
 * agent-adoption-scan.test.mjs — invariant tests for the agent adoption scanner.
 *
 * Closes v1.49.975 W?.T? (Ship 2.3 — agent adoption scan + allowlist). Mirrors
 * tools/__tests__/adoption-scan.test.mjs against synthetic fixtures so the
 * classification logic is verified in CI without the gitignored .claude/ tree.
 *
 * Tests:
 *   T1.  Living agent — a workflow file names it; status=living
 *   T2.  Dormant agent — no corpus mention; status=dormant
 *   T3.  Test-only agent — only a __tests__/ corpus file names it; status=test-only
 *   T4.  Command dispatch site counted as a real site
 *   T5.  Skill dispatch site counted as a real site
 *   T6.  Team dispatch site counted as a real site
 *   T7.  Whole-token boundary — prefix/suffix names not false-matched
 *   T8.  Agent-definition files (/agents/) excluded from the corpus
 *   T9.  JSON output mode produces parseable JSON
 *   T10. Dormant threshold triggers exit 1 for a non-allowlisted dormant agent
 *   T11. Allowlist exempts a dormant agent from the threshold gate (exit 0)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'agent-adoption-scan.mjs');

let tmpRoot;
let workDir;

function setupFixture(layout) {
  tmpRoot = mkdtempSync(join(tmpdir(), 'agent-adoption-test-'));
  workDir = join(tmpRoot, 'work');
  mkdirSync(workDir, { recursive: true });
  for (const [relPath, content] of Object.entries(layout)) {
    const abs = join(workDir, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  }
}

function runScript(args = '') {
  const argv = args.length > 0 ? args.split(' ').filter(Boolean) : [];
  const result = spawnSync('node', [SCRIPT_PATH, ...argv], { cwd: workDir, encoding: 'utf8' });
  return { exitCode: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function runScriptJson(args = '--json') {
  const r = runScript(args);
  return { ...r, records: r.exitCode === 0 || r.exitCode === 1 ? JSON.parse(r.stdout) : null };
}

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

describe('agent-adoption-scan', () => {
  it('T1: living agent — a workflow names it', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\n',
      '.claude/get-shit-done/workflows/plan.md': 'launch subagent_type="foo" to plan.\n',
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.agent === 'foo');
    expect(foo.status).toBe('living');
    expect(foo.realRefCount).toBe(1);
    expect(foo.workflowRefs.length).toBe(1);
  });

  it('T2: dormant agent — no corpus mention', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\n',
      '.claude/get-shit-done/workflows/plan.md': 'nothing relevant here.\n',
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.agent === 'foo');
    expect(foo.status).toBe('dormant');
    expect(foo.realRefCount).toBe(0);
    expect(foo.testRefCount).toBe(0);
  });

  it('T3: test-only agent — referenced only from a fixture file', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\n',
      '.claude/skills/x/__tests__/foo.test.md': 'mentions foo as a fixture.\n',
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.agent === 'foo');
    expect(foo.status).toBe('test-only');
    expect(foo.realRefCount).toBe(0);
    expect(foo.testRefCount).toBe(1);
  });

  it('T4: command dispatch site counted', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\n',
      '.claude/commands/gsd/run.md': 'dispatch foo here.\n',
    });
    const { records } = runScriptJson();
    expect(records.find((r) => r.agent === 'foo').commandRefs.length).toBe(1);
  });

  it('T5: skill dispatch site counted', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\n',
      '.claude/skills/team/SKILL.md': 'spawn foo from the team.\n',
    });
    const { records } = runScriptJson();
    expect(records.find((r) => r.agent === 'foo').skillRefs.length).toBe(1);
  });

  it('T6: team dispatch site counted', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\n',
      '.claude/teams/t/config.json': '{ "members": [ { "agentType": "foo" } ] }\n',
    });
    const { records } = runScriptJson();
    expect(records.find((r) => r.agent === 'foo').teamRefs.length).toBe(1);
  });

  it('T7: whole-token boundary — prefix/suffix names not false-matched', () => {
    setupFixture({
      '.claude/agents/doc-linter.md': '---\nname: doc-linter\n---\n',
      '.claude/agents/gsd-doc.md': '---\nname: gsd-doc\n---\n',
      // mentions only the longer names — must NOT count for doc-linter / gsd-doc
      '.claude/get-shit-done/workflows/w.md': 'use doc-linter-extended and gsd-doc-writer.\n',
    });
    const { records } = runScriptJson();
    expect(records.find((r) => r.agent === 'doc-linter').status).toBe('dormant');
    expect(records.find((r) => r.agent === 'gsd-doc').status).toBe('dormant');
  });

  it('T8: agent-definition files are excluded from the corpus', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\nrelated: bar\n',
      // bar is only mentioned inside another agent's .md — not a dispatch site
      '.claude/agents/bar.md': '---\nname: bar\n---\nworks with foo.\n',
    });
    const { records } = runScriptJson();
    expect(records.find((r) => r.agent === 'foo').status).toBe('dormant');
    expect(records.find((r) => r.agent === 'bar').status).toBe('dormant');
  });

  it('T9: JSON output is parseable and complete', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\n',
      '.claude/agents/bar.md': '---\nname: bar\n---\n',
    });
    const { records, exitCode } = runScriptJson();
    expect(exitCode).toBe(0);
    expect(records.map((r) => r.agent).sort()).toEqual(['bar', 'foo']);
  });

  it('T10: dormant threshold triggers exit 1 for a non-allowlisted dormant agent', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\n',
    });
    const { exitCode, stderr } = runScript('--dormant-threshold 1');
    expect(exitCode).toBe(1);
    expect(stderr).toContain('foo');
  });

  it('T11: allowlist exempts a dormant agent from the threshold gate', () => {
    setupFixture({
      '.claude/agents/foo.md': '---\nname: foo\n---\n',
      'tools/agent-adoption-scan.allowlist.json': JSON.stringify({
        version: '1.0',
        entries: [{ agent: 'foo', reason: 'description-dispatched test fixture' }],
      }),
    });
    const { exitCode } = runScript('--dormant-threshold 1');
    expect(exitCode).toBe(0);
    const { records } = runScriptJson();
    const foo = records.find((r) => r.agent === 'foo');
    expect(foo.allowlisted).toBe(true);
    expect(foo.allowlistReason).toContain('description-dispatched');
  });
});
