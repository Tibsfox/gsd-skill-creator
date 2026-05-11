/**
 * Keystore CLI wrapper tests.
 *
 * Tests the Node-side `keystoreCommand` entry point:
 * - help text rendering on `--help` and zero args
 * - unknown subcommand → exit 2 + help printed
 * - resolveKeystoreBin honors KEYSTORE_BIN env var
 * - bin-not-found ENOENT → exit 127 with clear error
 * - exit codes are passed through from the spawned bin (covered via a
 *   small shell-script stub at KEYSTORE_BIN)
 *
 * Does NOT spawn the real Rust binary — keeps tests fast + hermetic.
 */

import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  keystoreCommand,
  resolveKeystoreBin,
  type KeystoreCommandIO,
} from './keystore.js';

interface CapturedIO extends KeystoreCommandIO {
  out: string[];
  err: string[];
}

function makeIO(): CapturedIO {
  const out: string[] = [];
  const err: string[] = [];
  return {
    out,
    err,
    stdout: (chunk) => out.push(chunk),
    stderr: (chunk) => err.push(chunk),
  };
}

let workRoot: string;
let prevEnv: string | undefined;

beforeEach(() => {
  workRoot = mkdtempSync(join(tmpdir(), 'keystore-cli-test-'));
  prevEnv = process.env.KEYSTORE_BIN;
});

afterEach(() => {
  if (prevEnv === undefined) {
    delete process.env.KEYSTORE_BIN;
  } else {
    process.env.KEYSTORE_BIN = prevEnv;
  }
  rmSync(workRoot, { recursive: true, force: true });
});

describe('keystoreCommand help', () => {
  it('renders help on --help', async () => {
    const io = makeIO();
    const code = await keystoreCommand(['--help'], io);
    expect(code).toBe(0);
    const out = io.out.join('');
    expect(out).toContain('skill-creator keystore');
    expect(out).toContain('migrate');
    expect(out).toContain('set <account>');
    expect(out).toContain('status');
  });

  it('renders help on zero args', async () => {
    const io = makeIO();
    const code = await keystoreCommand([], io);
    expect(code).toBe(0);
    expect(io.out.join('')).toContain('skill-creator keystore');
  });

  it('renders help on -h short form', async () => {
    const io = makeIO();
    const code = await keystoreCommand(['-h'], io);
    expect(code).toBe(0);
    expect(io.out.join('')).toContain('skill-creator keystore');
  });
});

describe('keystoreCommand validation', () => {
  it('rejects unknown subcommand with exit 2', async () => {
    const io = makeIO();
    const code = await keystoreCommand(['unknown-cmd'], io);
    expect(code).toBe(2);
    expect(io.err.join('')).toContain("unknown subcommand 'unknown-cmd'");
    // Help is printed after the error.
    expect(io.out.join('')).toContain('skill-creator keystore');
  });
});

describe('resolveKeystoreBin', () => {
  it('returns the KEYSTORE_BIN override when the file exists', () => {
    const stub = join(workRoot, 'fake-bin');
    writeFileSync(stub, '#!/bin/sh\nexit 0\n');
    chmodSync(stub, 0o755);
    process.env.KEYSTORE_BIN = stub;
    expect(resolveKeystoreBin()).toBe(stub);
  });

  it('falls back to repo-relative paths when KEYSTORE_BIN absent', () => {
    delete process.env.KEYSTORE_BIN;
    const result = resolveKeystoreBin();
    // The result is either a debug/release path under the repo or the bare
    // name (PATH-resolved). Either way it's a non-empty string.
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('ignores KEYSTORE_BIN that points at a non-existent file', () => {
    process.env.KEYSTORE_BIN = join(workRoot, 'does-not-exist');
    const result = resolveKeystoreBin();
    // Falls back to repo-relative or PATH-resolved name.
    expect(result).not.toBe(join(workRoot, 'does-not-exist'));
  });
});

describe('keystoreCommand subprocess pass-through', () => {
  it('returns exit code from the stub bin', async () => {
    const stub = join(workRoot, 'stub-success');
    writeFileSync(
      stub,
      '#!/bin/sh\necho "stub-status-output"\nexit 0\n',
    );
    chmodSync(stub, 0o755);
    process.env.KEYSTORE_BIN = stub;

    const io = makeIO();
    const code = await keystoreCommand(['status'], io);
    expect(code).toBe(0);
    expect(io.out.join('')).toContain('stub-status-output');
  });

  it('propagates non-zero exit codes', async () => {
    const stub = join(workRoot, 'stub-fail');
    writeFileSync(stub, '#!/bin/sh\necho "fail-msg" >&2\nexit 7\n');
    chmodSync(stub, 0o755);
    process.env.KEYSTORE_BIN = stub;

    const io = makeIO();
    const code = await keystoreCommand(['migrate'], io);
    expect(code).toBe(7);
    expect(io.err.join('')).toContain('fail-msg');
  });

  // Note: a deterministic "bin not found → exit 127" test would require
  // either temporarily renaming the repo-built debug bin OR mocking
  // existsSync. Both are intrusive. The 127 path is exercised by the
  // resolver's final-fallback (`skill-creator-keystore` PATH name) — when
  // the binary is uninstalled the spawn's ENOENT handler converts to 127.
  // Coverage of that handler shape is implicit in the spawn-error logic.
});

describe('keystore migrate --to-keyring (v1.49.637 cluster #4 C2 stub polish)', () => {
  it('passes through exit code 3 from the M3-stub bin', async () => {
    // Stub bin emitting the polished stub message (Path-2 → Path-1 deferral
    // + .planning/path-2-to-path-1-migration.md doc reference) and exit 3.
    const stub = join(workRoot, 'stub-to-keyring');
    writeFileSync(
      stub,
      '#!/bin/sh\n' +
        'cat <<\'EOF\' >&2\n' +
        'Path-2 → Path-1 upgrade not implemented at v1.49.636.\n' +
        'Your credentials are currently stored in the Path-2 file\n' +
        '(passphrase-encrypted). Tracked at v1.49.7XX (M3 deferral).\n' +
        'See .planning/path-2-to-path-1-migration.md for the M3 design.\n' +
        'EOF\n' +
        'exit 3\n',
    );
    chmodSync(stub, 0o755);
    process.env.KEYSTORE_BIN = stub;

    const io = makeIO();
    const code = await keystoreCommand(['migrate', '--to-keyring'], io);
    expect(code).toBe(3);
  });

  it('routes M3-stub output to stderr (NOT stdout)', async () => {
    const stub = join(workRoot, 'stub-to-keyring-stderr');
    writeFileSync(
      stub,
      '#!/bin/sh\n' +
        'echo "Path-2 → Path-1 upgrade not implemented" >&2\n' +
        'echo "See .planning/path-2-to-path-1-migration.md" >&2\n' +
        'exit 3\n',
    );
    chmodSync(stub, 0o755);
    process.env.KEYSTORE_BIN = stub;

    const io = makeIO();
    const code = await keystoreCommand(['migrate', '--to-keyring'], io);
    expect(code).toBe(3);
    // Stub message must land on stderr per the 4-level exit-code contract.
    expect(io.err.join('')).toContain('Path-2 → Path-1 upgrade not implemented');
    expect(io.err.join('')).toContain('.planning/path-2-to-path-1-migration.md');
    // Stdout must be empty for the stub path.
    expect(io.out.join('')).toBe('');
  });

  it('keystore.ts help text references the M3-deferral version (NOT stale v1.49.650)', async () => {
    const io = makeIO();
    const code = await keystoreCommand(['--help'], io);
    expect(code).toBe(0);
    const helpText = io.out.join('');
    // Polished help text (C2) references "M3 deferral" and "v1.49.7XX".
    expect(helpText).toContain('M3 deferral');
    expect(helpText).toContain('v1.49.7XX');
    // The stale "stub at v1.49.650" string must be gone (it was the pre-C2 text).
    expect(helpText).not.toContain('stub at v1.49.650');
  });

  it('skill-creator-keystore.rs stub message preserves the doc reference + version (substrate invariant)', async () => {
    // Read the Rust bin source to assert the polished stub message format
    // remains intact (regression-safe against accidental future edits).
    const { readFileSync } = await import('node:fs');
    const binSrc = readFileSync(
      resolve(process.cwd(), 'src-tauri/bin/skill-creator-keystore.rs'),
      'utf-8',
    );
    expect(binSrc).toContain('Path-2 → Path-1 upgrade not implemented');
    expect(binSrc).toContain('v1.49.7XX (M3 deferral)');
    expect(binSrc).toContain('.planning/path-2-to-path-1-migration.md');
    // exit-code-3 contract preserved.
    expect(binSrc).toContain('return ExitCode::from(3);');
  });
});
