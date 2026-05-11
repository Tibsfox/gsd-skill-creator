/**
 * render-claude-md.mjs — invariant tests for the CLAUDE.md auto-renderer.
 *
 * Two test layers:
 *   1. Hermetic unit + integration tests in a tmp dir (no dependency on
 *      the live repo state — these test the renderer logic itself).
 *   2. ONE live-invariant test that runs --check against the actual repo
 *      CLAUDE.md. This is the deterministic gate — if anyone edits CLAUDE.md
 *      without updating the source-of-truth manifests (or vice-versa), the
 *      test fails. Future pre-tag-gate integration is a separate phase;
 *      this test guarantees CI catches drift in the meantime.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  render,
  renderEnvVars,
  renderFileLocations,
  composeAgentsBody,
  classifyAgents,
  main,
} from '../render-claude-md.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'render-claude-md.mjs');
const REPO_ROOT = join(HERE, '..', '..');

let tmpRoot;

function setupFixtureRoot({
  agents = [],
  sourceAgents = [],
  fileLocations = null,
  envVars = null,
  agentsCategories = null,
  claudeMd = null,
} = {}) {
  mkdirSync(join(tmpRoot, 'tools', 'render-claude-md'), { recursive: true });
  mkdirSync(join(tmpRoot, '.claude', 'agents'), { recursive: true });
  mkdirSync(join(tmpRoot, 'project-claude', 'agents'), { recursive: true });

  for (const a of agents) {
    writeFileSync(join(tmpRoot, '.claude', 'agents', `${a}.md`), '');
  }
  for (const a of sourceAgents) {
    writeFileSync(join(tmpRoot, 'project-claude', 'agents', `${a}.md`), '');
  }

  if (fileLocations) {
    writeFileSync(
      join(tmpRoot, 'tools', 'render-claude-md', 'file-locations.json'),
      JSON.stringify(fileLocations),
    );
  }
  if (envVars) {
    writeFileSync(
      join(tmpRoot, 'tools', 'render-claude-md', 'env-vars.json'),
      JSON.stringify(envVars),
    );
  }
  if (agentsCategories) {
    writeFileSync(
      join(tmpRoot, 'tools', 'render-claude-md', 'agents.json'),
      JSON.stringify(agentsCategories),
    );
  }
  if (claudeMd !== null) {
    writeFileSync(join(tmpRoot, 'CLAUDE.md'), claudeMd);
  }
}

const NULL_STREAMS = { stdout: { write() {} }, stderr: { write() {} } };

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'render-claude-md-test-'));
});

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

// ----- renderEnvVars -----

describe('renderEnvVars', () => {
  it('renders the header and one row per entry', () => {
    setupFixtureRoot({
      envVars: [
        { name: 'FOO', default_behavior: 'unset → off', override_behavior: '`=1` → on' },
      ],
    });
    expect(renderEnvVars(tmpRoot)).toBe(
      '| Var | Default behavior | Override behavior |\n' +
      '|---|---|---|\n' +
      '| `FOO` | unset → off | `=1` → on |',
    );
  });

  it('appends name_suffix outside the backticks', () => {
    setupFixtureRoot({
      envVars: [
        { name: 'BAR', name_suffix: ' *(deprecated)*', default_behavior: 'ignored', override_behavior: 'maybe' },
      ],
    });
    expect(renderEnvVars(tmpRoot)).toContain('| `BAR` *(deprecated)* | ignored | maybe |');
  });
});

// ----- classifyAgents -----

const MINI_AGENTS_MANIFEST = {
  categories: [
    { label: 'gsd', match_prefix: 'gsd-', label_detail: 'g' },
    { label: 'uc', members: ['capcom', 'flight-ops'], label_detail_format: 'members' },
  ],
};

describe('classifyAgents', () => {
  it('places prefix matches and explicit members into the right buckets', () => {
    const claimed = classifyAgents(MINI_AGENTS_MANIFEST, ['capcom', 'flight-ops', 'gsd-x', 'gsd-y']);
    expect(claimed[0]).toEqual(['gsd-x', 'gsd-y']);
    expect(claimed[1]).toEqual(['capcom', 'flight-ops']);
  });

  it('throws when an agent matches no category', () => {
    expect(() => classifyAgents(MINI_AGENTS_MANIFEST, ['gsd-x', 'random'])).toThrow(/Orphaned agents.*random/);
  });

  it('throws when an explicit member is not on disk', () => {
    expect(() => classifyAgents(MINI_AGENTS_MANIFEST, ['gsd-x', 'capcom'])).toThrow(/flight-ops/);
  });
});

// ----- composeAgentsBody -----

describe('composeAgentsBody', () => {
  it('composes preamble + categories + trailer with live counts', () => {
    setupFixtureRoot({
      agents: ['capcom', 'gsd-a', 'gsd-b', 'v1.50a-x'],
      sourceAgents: ['capcom', 'gsd-a', 'gsd-b'],
      agentsCategories: {
        source_of_truth_dir: 'project-claude/agents',
        preamble_template: '**{TOTAL} agents** ({SOURCE_COUNT} source + {PAUSED_COUNT} paused)',
        trailer_template: 'Source has {SOURCE_COUNT} files.',
        categories: [
          { label: 'GSD', match_prefix: 'gsd-', label_detail: 'gsd-prefixed' },
          { label: 'UC', label_detail_format: 'members', members: ['capcom'] },
          { label: 'paused', match_prefix: 'v1.50a-', label_detail: 'v1.50a', is_paused: true },
        ],
      },
    });
    expect(composeAgentsBody(tmpRoot)).toBe(
      '**4 agents** (3 source + 1 paused): ' +
      '**2 GSD** (gsd-prefixed), ' +
      '**1 UC** (capcom), ' +
      '**1 paused** (v1.50a). ' +
      'Source has 3 files.',
    );
  });

  it('renders the v1.50a-* label as **N v1.50a-*** (literal trailing asterisk)', () => {
    setupFixtureRoot({
      agents: ['v1.50a-only'],
      sourceAgents: [],
      agentsCategories: {
        source_of_truth_dir: 'project-claude/agents',
        preamble_template: '{TOTAL}',
        trailer_template: '',
        categories: [
          { label: 'v1.50a-*', match_prefix: 'v1.50a-', label_detail: 'paused', is_paused: true },
        ],
      },
    });
    expect(composeAgentsBody(tmpRoot)).toContain('**1 v1.50a-*** (paused)');
  });
});

// ----- renderFileLocations -----

describe('renderFileLocations', () => {
  it('renders simple bullets and dispatches the agents-composite entry', () => {
    setupFixtureRoot({
      agents: ['capcom', 'gsd-a'],
      sourceAgents: ['capcom', 'gsd-a'],
      fileLocations: [
        { path: 'src/', description: 'sources' },
        { path: '$REPO/.claude/agents/', kind: 'agents-composite' },
        { path: 'docs/', description: 'docs' },
      ],
      agentsCategories: {
        source_of_truth_dir: 'project-claude/agents',
        preamble_template: '{TOTAL} agents',
        trailer_template: '({SOURCE_COUNT} src)',
        categories: [
          { label: 'gsd', match_prefix: 'gsd-', label_detail: 'g' },
          { label: 'uc', members: ['capcom'], label_detail_format: 'members' },
        ],
      },
    });
    expect(renderFileLocations(tmpRoot)).toBe(
      '- `src/` -- sources\n' +
      '- `$REPO/.claude/agents/` -- 2 agents: **1 gsd** (g), **1 uc** (capcom). (2 src)\n' +
      '- `docs/` -- docs',
    );
  });
});

// ----- render (marker engine) -----

describe('render (marker block engine)', () => {
  it('replaces a marked block in place, preserving surrounding content', () => {
    setupFixtureRoot({
      envVars: [{ name: 'X', default_behavior: 'd', override_behavior: 'o' }],
    });
    const input =
      'top\n\n<!-- AUTO:env-vars:START -->\nstale\n<!-- AUTO:env-vars:END -->\n\nbottom\n';
    const expected =
      'top\n\n<!-- AUTO:env-vars:START -->\n' +
      '| Var | Default behavior | Override behavior |\n|---|---|---|\n| `X` | d | o |\n' +
      '<!-- AUTO:env-vars:END -->\n\nbottom\n';
    expect(render(input, tmpRoot)).toBe(expected);
  });

  it('leaves content without markers untouched', () => {
    setupFixtureRoot({});
    const input = 'plain markdown\nno markers\n';
    expect(render(input, tmpRoot)).toBe(input);
  });

  it('throws on an unknown section name', () => {
    setupFixtureRoot({});
    const input = '<!-- AUTO:bogus:START -->\nx\n<!-- AUTO:bogus:END -->';
    expect(() => render(input, tmpRoot)).toThrow(/Unknown AUTO section.*bogus/);
  });
});

// ----- CLI modes -----

describe('CLI --check', () => {
  it('exits 0 when CLAUDE.md matches the rendered output', () => {
    setupFixtureRoot({
      envVars: [{ name: 'X', default_behavior: 'd', override_behavior: 'o' }],
      claudeMd:
        '<!-- AUTO:env-vars:START -->\n' +
        '| Var | Default behavior | Override behavior |\n|---|---|---|\n| `X` | d | o |\n' +
        '<!-- AUTO:env-vars:END -->\n',
    });
    const exitCode = main(['--check', '--root', tmpRoot], NULL_STREAMS);
    expect(exitCode).toBe(0);
  });

  it('exits 1 when CLAUDE.md is stale', () => {
    setupFixtureRoot({
      envVars: [{ name: 'X', default_behavior: 'd', override_behavior: 'o' }],
      claudeMd: '<!-- AUTO:env-vars:START -->\nSTALE\n<!-- AUTO:env-vars:END -->\n',
    });
    const exitCode = main(['--check', '--root', tmpRoot], NULL_STREAMS);
    expect(exitCode).toBe(1);
  });
});

describe('CLI --dry-run', () => {
  it('does not modify the on-disk CLAUDE.md', () => {
    const claudeMdContent = '<!-- AUTO:env-vars:START -->\nSTALE\n<!-- AUTO:env-vars:END -->\n';
    setupFixtureRoot({
      envVars: [{ name: 'Z', default_behavior: 'd', override_behavior: 'o' }],
      claudeMd: claudeMdContent,
    });
    const captured = [];
    const exitCode = main(['--dry-run', '--root', tmpRoot], {
      stdout: { write: (s) => captured.push(s) },
      stderr: { write() {} },
    });
    expect(exitCode).toBe(0);
    expect(captured.join('')).toContain('| `Z` | d | o |');
    expect(readFileSync(join(tmpRoot, 'CLAUDE.md'), 'utf8')).toBe(claudeMdContent);
  });
});

describe('CLI write mode', () => {
  it('updates CLAUDE.md when stale', () => {
    const claudeMdContent = '<!-- AUTO:env-vars:START -->\nSTALE\n<!-- AUTO:env-vars:END -->\n';
    setupFixtureRoot({
      envVars: [{ name: 'Q', default_behavior: 'd', override_behavior: 'o' }],
      claudeMd: claudeMdContent,
    });
    const exitCode = main(['--root', tmpRoot], NULL_STREAMS);
    expect(exitCode).toBe(0);
    const after = readFileSync(join(tmpRoot, 'CLAUDE.md'), 'utf8');
    expect(after).toContain('| `Q` | d | o |');
    expect(after).not.toContain('STALE');
  });
});

// ----- Absent-CLAUDE.md behavior (post-2026-05-10 untrack) -----

describe('absent CLAUDE.md (gitignored / fresh-clone state)', () => {
  it('--check exits 0 with informational message when CLAUDE.md is absent', () => {
    setupFixtureRoot({
      envVars: [{ name: 'X', default_behavior: 'd', override_behavior: 'o' }],
    });
    // No claudeMd written by setupFixtureRoot
    const captured = [];
    const exitCode = main(['--check', '--root', tmpRoot], {
      stdout: { write: (s) => captured.push(s) },
      stderr: { write() {} },
    });
    expect(exitCode).toBe(0);
    expect(captured.join('')).toMatch(/skipping drift check/i);
    expect(captured.join('')).toMatch(/gitignored/i);
  });

  it('--dry-run still exits 2 when CLAUDE.md is absent (loud signal for dev)', () => {
    setupFixtureRoot({
      envVars: [{ name: 'X', default_behavior: 'd', override_behavior: 'o' }],
    });
    const exitCode = main(['--dry-run', '--root', tmpRoot], NULL_STREAMS);
    expect(exitCode).toBe(2);
  });

  it('write mode still exits 2 when CLAUDE.md is absent (loud signal for dev)', () => {
    setupFixtureRoot({
      envVars: [{ name: 'X', default_behavior: 'd', override_behavior: 'o' }],
    });
    const exitCode = main(['--root', tmpRoot], NULL_STREAMS);
    expect(exitCode).toBe(2);
  });
});

// ----- Live invariant -----

describe('live invariant: repo CLAUDE.md is in sync with manifests', () => {
  it('--check passes against the actual repo (the deterministic gate)', () => {
    const exitCode = main(['--check', '--root', REPO_ROOT], NULL_STREAMS);
    expect(exitCode).toBe(0);
  });
});

// ----- CLI smoke (subprocess) -----

describe('CLI smoke (subprocess execution)', () => {
  it('--check via node works and reports up-to-date for synced fixture', () => {
    setupFixtureRoot({
      envVars: [{ name: 'X', default_behavior: 'd', override_behavior: 'o' }],
      claudeMd:
        '<!-- AUTO:env-vars:START -->\n' +
        '| Var | Default behavior | Override behavior |\n|---|---|---|\n| `X` | d | o |\n' +
        '<!-- AUTO:env-vars:END -->\n',
    });
    const out = execSync(`node "${SCRIPT_PATH}" --check --root "${tmpRoot}"`, { encoding: 'utf8' });
    expect(out).toContain('up to date');
  });

  it('--check via node exits non-zero when stale', () => {
    setupFixtureRoot({
      envVars: [{ name: 'X', default_behavior: 'd', override_behavior: 'o' }],
      claudeMd: '<!-- AUTO:env-vars:START -->\nSTALE\n<!-- AUTO:env-vars:END -->\n',
    });
    let exitCode = 0;
    try {
      execSync(`node "${SCRIPT_PATH}" --check --root "${tmpRoot}"`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (err) {
      exitCode = err.status;
    }
    expect(exitCode).toBe(1);
  });
});
