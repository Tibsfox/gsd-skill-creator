/**
 * install.cjs dedicated gsd-skill-creator config propagation (CC-6).
 *
 * The harness settings.json is validated against a strict schema that rejects
 * unknown top-level keys, so gsd-skill-creator opt-in flags live under a
 * `gsd-skill-creator` scope in the dedicated .claude/gsd-skill-creator.json
 * (read first by src/settings/read-settings.ts). installSettings only carries
 * hooks + statusLine, so it would drop that scope; install.cjs propagates it
 * into the dedicated file with a NON-CLOBBERING deep merge (add missing keys,
 * never overwrite a hand-set value) and preserves the file on uninstall (it is
 * not ledgered). This pins that behavior end-to-end via the SC_INSTALL_SOURCE_DIR
 * seam against a synthetic manifest + temp project (no real .claude/ needed).
 *
 * Named *.test.ts so the root vitest project runs it every `npx vitest run`.
 * Spawn lives under tests/ (the src/-only ProcessContext audit is unaffected).
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const INSTALL_CJS = join(process.cwd(), 'project-claude', 'install.cjs');
const DEDICATED = '.claude/gsd-skill-creator.json';

const MANIFEST = {
  version: 2,
  files: {
    settings: { source: 'settings.json', target: '.claude/settings.json' },
  },
};

const SOURCE_SETTINGS = {
  hooks: {},
  'gsd-skill-creator': {
    feature_flags: {
      autonomous_phase_execution: false,
      skill_auto_install: false,
    },
  },
};

const dirs: string[] = [];

function makeSource(settings: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'sc-src-'));
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(MANIFEST, null, 2));
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(settings, null, 2));
  dirs.push(dir);
  return dir;
}

function makeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'sc-proj-'));
  mkdirSync(join(dir, '.claude'), { recursive: true });
  dirs.push(dir);
  return dir;
}

function run(project: string, source: string, extraArgs: string[] = []): void {
  spawnSync(process.execPath, [INSTALL_CJS, '--local', '--quiet', ...extraArgs], {
    cwd: project,
    env: { ...process.env, SC_INSTALL_SOURCE_DIR: source },
    encoding: 'utf8',
  });
  // exit code intentionally not asserted — a synthetic manifest trips the
  // hardcoded validateInstallation checklist; files are written before it runs.
}

function readDedicated(project: string): Record<string, any> {
  return JSON.parse(readFileSync(join(project, DEDICATED), 'utf8'));
}

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('install.cjs dedicated gsd-skill-creator config propagation (CC-6)', () => {
  it('creates the dedicated file with the scope when none exists', () => {
    const project = makeProject();
    run(project, makeSource(SOURCE_SETTINGS));
    expect(existsSync(join(project, DEDICATED))).toBe(true);
    const ff = readDedicated(project)['gsd-skill-creator'].feature_flags;
    expect(ff.autonomous_phase_execution).toBe(false);
    expect(ff.skill_auto_install).toBe(false);
  });

  it('does NOT write the scope key into the harness settings.json (schema-safe)', () => {
    const project = makeProject();
    run(project, makeSource(SOURCE_SETTINGS));
    const settings = JSON.parse(
      readFileSync(join(project, '.claude/settings.json'), 'utf8'),
    );
    expect(settings['gsd-skill-creator']).toBeUndefined();
  });

  it('non-clobbering: preserves hand-set flags and hand-authored blocks', () => {
    const project = makeProject();
    // A user has enabled one flag and hand-authored a sensoria block (no tracked source).
    writeFileSync(
      join(project, DEDICATED),
      JSON.stringify(
        {
          'gsd-skill-creator': {
            feature_flags: { autonomous_phase_execution: true },
            sensoria: { enabled: true },
          },
        },
        null,
        2,
      ),
    );
    run(project, makeSource(SOURCE_SETTINGS));
    const scope = readDedicated(project)['gsd-skill-creator'];
    expect(scope.feature_flags.autonomous_phase_execution).toBe(true); // preserved, NOT reset
    expect(scope.feature_flags.skill_auto_install).toBe(false); // added
    expect(scope.sensoria).toEqual({ enabled: true }); // untouched
  });

  it('is idempotent: a second install leaves the file byte-identical', () => {
    const project = makeProject();
    const source = makeSource(SOURCE_SETTINGS);
    run(project, source);
    const first = readFileSync(join(project, DEDICATED), 'utf8');
    run(project, source);
    expect(readFileSync(join(project, DEDICATED), 'utf8')).toBe(first);
  });

  it('preserves the dedicated file on uninstall (not ledgered)', () => {
    const project = makeProject();
    const source = makeSource(SOURCE_SETTINGS);
    run(project, source);
    expect(existsSync(join(project, DEDICATED))).toBe(true);
    run(project, source, ['--uninstall']);
    expect(existsSync(join(project, DEDICATED))).toBe(true);
  });

  it('writes nothing when the source has no gsd-skill-creator scope', () => {
    const project = makeProject();
    run(project, makeSource({ hooks: {} }));
    expect(existsSync(join(project, DEDICATED))).toBe(false);
  });
});
