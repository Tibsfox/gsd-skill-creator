import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverManifests, ManifestDiscovery } from './manifest-discovery.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'dep-audit-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ─── package.json (npm) ───────────────────────────────────────────────────────

describe('npm — package.json', () => {
  it('discovers dependencies and devDependencies', async () => {
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        dependencies: { react: '^18.2.0', lodash: '4.17.21' },
        devDependencies: { vitest: '~1.0.0', typescript: '5.0.0' },
      }),
    );

    const deps = await discoverManifests(tmpDir);
    const npmDeps = deps.filter((d) => d.ecosystem === 'npm');

    expect(npmDeps).toHaveLength(4);
    const names = npmDeps.map((d) => d.name);
    expect(names).toContain('react');
    expect(names).toContain('lodash');
    expect(names).toContain('vitest');
    expect(names).toContain('typescript');

    const react = npmDeps.find((d) => d.name === 'react')!;
    expect(react.version).toBe('^18.2.0');
    expect(react.ecosystem).toBe('npm');
    expect(react.sourceManifest).toBe(join(tmpDir, 'package.json'));
  });

  it('handles package.json with only dependencies', async () => {
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { express: '4.18.0' } }),
    );

    const deps = await discoverManifests(tmpDir);
    const npmDeps = deps.filter((d) => d.ecosystem === 'npm');
    expect(npmDeps).toHaveLength(1);
    expect(npmDeps[0].name).toBe('express');
  });

  it('handles package.json with no dependency fields', async () => {
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'my-app', version: '1.0.0' }),
    );

    const deps = await discoverManifests(tmpDir);
    const npmDeps = deps.filter((d) => d.ecosystem === 'npm');
    expect(npmDeps).toHaveLength(0);
  });
});

// ─── requirements.txt (pypi) ──────────────────────────────────────────────────

describe('pypi — requirements.txt', () => {
  it('parses pinned and constrained requirements', async () => {
    await writeFile(
      join(tmpDir, 'requirements.txt'),
      [
        '# This is a comment',
        '',
        'requests==2.31.0',
        'flask>=2.0.0',
        'numpy',
        'pandas==2.0.1',
      ].join('\n'),
    );

    const deps = await discoverManifests(tmpDir);
    const pypiDeps = deps.filter((d) => d.ecosystem === 'pypi');

    expect(pypiDeps).toHaveLength(4);
    const requests = pypiDeps.find((d) => d.name === 'requests')!;
    expect(requests.version).toBe('2.31.0');

    const flask = pypiDeps.find((d) => d.name === 'flask')!;
    expect(flask.version).toBe('>=2.0.0');

    const numpy = pypiDeps.find((d) => d.name === 'numpy')!;
    expect(numpy.version).toBe('*');
  });

  it('returns empty array for empty requirements.txt', async () => {
    await writeFile(join(tmpDir, 'requirements.txt'), '# no deps\n\n');

    const deps = await discoverManifests(tmpDir);
    const pypiDeps = deps.filter((d) => d.ecosystem === 'pypi');
    expect(pypiDeps).toHaveLength(0);
  });

  it('returns empty pypi array when requirements.txt is absent', async () => {
    const deps = await discoverManifests(tmpDir);
    const pypiDeps = deps.filter((d) => d.ecosystem === 'pypi');
    expect(pypiDeps).toHaveLength(0);
  });
});

// ─── environment.yml (conda) ─────────────────────────────────────────────────

describe('conda — environment.yml', () => {
  it('parses conda dependencies list', async () => {
    await writeFile(
      join(tmpDir, 'environment.yml'),
      [
        'name: myenv',
        'dependencies:',
        '  - numpy=1.24.0',
        '  - scipy>=1.10.0',
        '  - python=3.11',
      ].join('\n'),
    );

    const deps = await discoverManifests(tmpDir);
    const condaDeps = deps.filter((d) => d.ecosystem === 'conda');

    expect(condaDeps).toHaveLength(3);
    const numpy = condaDeps.find((d) => d.name === 'numpy')!;
    expect(numpy.version).toBe('1.24.0');
    const scipy = condaDeps.find((d) => d.name === 'scipy')!;
    expect(scipy.version).toBe('>=1.10.0');
  });

  it('handles pip subsection inside environment.yml', async () => {
    await writeFile(
      join(tmpDir, 'environment.yml'),
      [
        'name: myenv',
        'dependencies:',
        '  - numpy=1.24.0',
        '  - pip:',
        '    - requests==2.31.0',
        '    - flask>=2.0',
      ].join('\n'),
    );

    const deps = await discoverManifests(tmpDir);
    // conda items
    const condaDeps = deps.filter((d) => d.ecosystem === 'conda');
    expect(condaDeps.map((d) => d.name)).toContain('numpy');

    // pip subsection items are treated as pypi
    const pypiDeps = deps.filter((d) => d.ecosystem === 'pypi');
    expect(pypiDeps.map((d) => d.name)).toContain('requests');
    expect(pypiDeps.map((d) => d.name)).toContain('flask');
  });
});

// ─── Cargo.toml (cargo) ───────────────────────────────────────────────────────

describe('cargo — Cargo.toml', () => {
  it('parses [dependencies] and [dev-dependencies]', async () => {
    await writeFile(
      join(tmpDir, 'Cargo.toml'),
      [
        '[package]',
        'name = "my-crate"',
        'version = "0.1.0"',
        '',
        '[dependencies]',
        'serde = "1.0"',
        'tokio = { version = "1.28", features = ["full"] }',
        '',
        '[dev-dependencies]',
        'criterion = "0.5"',
      ].join('\n'),
    );

    const deps = await discoverManifests(tmpDir);
    const cargoDeps = deps.filter((d) => d.ecosystem === 'cargo');

    expect(cargoDeps).toHaveLength(3);
    const names = cargoDeps.map((d) => d.name);
    expect(names).toContain('serde');
    expect(names).toContain('tokio');
    expect(names).toContain('criterion');

    const serde = cargoDeps.find((d) => d.name === 'serde')!;
    expect(serde.version).toBe('1.0');

    const tokio = cargoDeps.find((d) => d.name === 'tokio')!;
    expect(tokio.version).toBe('1.28');
  });

  it('returns empty cargo array when Cargo.toml is absent', async () => {
    const deps = await discoverManifests(tmpDir);
    const cargoDeps = deps.filter((d) => d.ecosystem === 'cargo');
    expect(cargoDeps).toHaveLength(0);
  });
});

// ─── Gemfile (rubygems) ───────────────────────────────────────────────────────

describe('rubygems — Gemfile', () => {
  it('parses gem declarations with and without versions', async () => {
    await writeFile(
      join(tmpDir, 'Gemfile'),
      [
        "source 'https://rubygems.org'",
        '',
        "gem 'rails', '~> 7.0'",
        'gem "devise", "4.9.2"',
        "gem 'puma'",
      ].join('\n'),
    );

    const deps = await discoverManifests(tmpDir);
    const gemDeps = deps.filter((d) => d.ecosystem === 'rubygems');

    expect(gemDeps).toHaveLength(3);
    const rails = gemDeps.find((d) => d.name === 'rails')!;
    expect(rails.version).toBe('~> 7.0');

    const devise = gemDeps.find((d) => d.name === 'devise')!;
    expect(devise.version).toBe('4.9.2');

    const puma = gemDeps.find((d) => d.name === 'puma')!;
    expect(puma.version).toBe('*');
  });
});

// ─── All five ecosystems together ────────────────────────────────────────────

describe('multi-ecosystem discovery', () => {
  it('discovers all deps from all five manifests without configuration', async () => {
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { react: '^18.2.0' } }),
    );
    await writeFile(join(tmpDir, 'requirements.txt'), 'requests==2.31.0\n');
    await writeFile(
      join(tmpDir, 'environment.yml'),
      'name: e\ndependencies:\n  - numpy=1.24.0\n',
    );
    await writeFile(
      join(tmpDir, 'Cargo.toml'),
      '[package]\nname="x"\nversion="0.1"\n\n[dependencies]\nserde="1.0"\n',
    );
    await writeFile(join(tmpDir, 'Gemfile'), "gem 'rails', '~> 7'\n");

    const deps = await discoverManifests(tmpDir);

    const ecosystems = new Set(deps.map((d) => d.ecosystem));
    expect(ecosystems).toContain('npm');
    expect(ecosystems).toContain('pypi');
    expect(ecosystems).toContain('conda');
    expect(ecosystems).toContain('cargo');
    expect(ecosystems).toContain('rubygems');
  });

  it('only returns npm deps when only package.json is present', async () => {
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { lodash: '4.17.21' } }),
    );

    const deps = await discoverManifests(tmpDir);
    const ecosystems = new Set(deps.map((d) => d.ecosystem));
    expect(ecosystems.size).toBe(1);
    expect(ecosystems).toContain('npm');
  });
});

// ─── ManifestDiscovery class ─────────────────────────────────────────────────

describe('ManifestDiscovery class', () => {
  it('discover() returns same results as discoverManifests()', async () => {
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { axios: '1.4.0' } }),
    );

    const md = new ManifestDiscovery({ projectRoot: tmpDir });
    const classDeps = await md.discover();
    const funcDeps = await discoverManifests(tmpDir);

    expect(classDeps).toEqual(funcDeps);
  });
});
