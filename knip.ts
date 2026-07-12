import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { KnipConfig } from 'knip';

// Dead-code / unused-export / unused-dependency detector (QUAL-4).
//
// The island ignore-list is derived from the SAME source of truth the adoption
// scanner uses — tools/adoption-scan.allowlist.json — so knip and the adoption
// gate never disagree on which modules are intentionally parked. Add a module
// there (with a reason) and it is excluded from both detectors automatically.
//
// This runs as a non-blocking report (`npm run deadcode`), NOT in the pre-tag
// gate. Baseline + interpretation: docs/audits/2026-07-07-knip-deadcode-baseline.md.

const here = dirname(fileURLToPath(import.meta.url));
const allowlistPath = resolve(here, 'tools/adoption-scan.allowlist.json');

let parkedModules: string[] = [];
try {
  const allowlist = JSON.parse(readFileSync(allowlistPath, 'utf8')) as {
    entries?: Array<{ module?: unknown }>;
  };
  parkedModules = (allowlist.entries ?? [])
    .map((entry) => entry.module)
    .filter((module): module is string => typeof module === 'string' && module.length > 0);
} catch {
  // Allowlist missing/unparseable: fall back to no island ignores. The report is
  // noisier but still honest — better than silently dropping the whole config.
  parkedModules = [];
}

const parkedIgnores = parkedModules.map((module) => `src/${module}/**`);

const config: KnipConfig = {
  // Production roots + every src test file. Code reachable only from tests still
  // counts as used; code reachable from neither surfaces as dead.
  entry: ['src/index.ts', 'src/cli.ts', 'src/**/*.test.ts'],
  project: ['src/**/*.ts'],
  ignore: [
    // Separate webview workspaces — own package.json / dependency sets, own vitest.
    'desktop/**',
    'apps/**',
    'tests/ipc-commands.test.ts',
    // Test fixtures + harness support: intentionally-standalone sample trees the
    // analyzer/intelligence suites read as data or spawn as subprocesses. Not source.
    'src/**/__tests__/**/fixtures/**',
    'src/**/fixtures/**',
    'src/**/__tests__/_harness/**',
    // Nested barrel re-exports (src/<dir>/**/index.ts): library public-API
    // surface that knip reports as "unused file" because nothing imports the
    // barrel directly (callers reach the concrete modules). 60 today, benign per
    // the baseline doc. This does NOT match the top-level entry src/index.ts.
    // Removing the barrel wall makes `npm run deadcode` and the ceiling gate
    // report only genuinely-orphaned modules + unused deps.
    'src/*/**/index.ts',
    // Intentionally-parked research islands (mirrors adoption-scan.allowlist.json).
    ...parkedIgnores,
  ],
  ignoreDependencies: [
    // Consumed by the desktop/ and apps/ webviews (ignored above), not by src/.
    'react',
    'react-dom',
    '@types/react',
    '@types/react-dom',
    // Used outside knip's src/ scope: tools/build-constellation/snapshot-mysql.mjs.
    'mysql2',
    // Reached via a dynamic subpath import cast to string in
    // src/atlas/spatial/flatgeobuf-export.ts (`import('flatgeobuf/dist/...' as string)`),
    // which defeats static resolution. Confirmed reachable through its test.
    'flatgeobuf',
  ],
  ignoreBinaries: [
    // External CLI tools invoked at runtime or in tests — not npm-installed.
    'pdftotext',
    'lean',
    'lake',
    'awk',
    'claude',
    'wetty',
    'tmux',
    'python3',
    'which',
    'skill-creator',
  ],
};

export default config;
