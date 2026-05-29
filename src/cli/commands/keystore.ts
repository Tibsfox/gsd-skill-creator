/**
 * CLI command group for the v1.49.636 unified keystore.
 *
 * Hybrid Node-wrapper + standalone-Rust-bin architecture (operator-pinned
 * 2026-05-11): the Node entry point `skill-creator keystore <subcmd>`
 * shells out to the Rust binary `skill-creator-keystore` via
 * `child_process.spawn`, passing through args + stdin + stdout + exit
 * codes.
 *
 * Subcommands:
 *   skill-creator keystore migrate            -- Migrate v1 plaintext → v2
 *   skill-creator keystore migrate --to-keyring
 *                                             -- M3 stub (errors with
 *                                                v1.49.6XX deferral msg)
 *   skill-creator keystore set <account>      -- Store/update credential
 *                                                (reads value from stdin)
 *   skill-creator keystore status             -- Print current state
 *
 * Operators can also invoke the Rust bin directly (`skill-creator-keystore
 * <subcmd>`); both surfaces are documented at `docs/keystore.md`.
 *
 * Exit codes mirror the Rust bin:
 *   0  -- success
 *   1  -- runtime error (migration failed, save failed)
 *   2  -- usage/config error (no stdin value, config dir unresolvable)
 *   3  -- M3 stub: --to-keyring deferral
 *
 * Bin resolution order:
 *   1. KEYSTORE_BIN env var (full path; useful for dev hosts)
 *   2. `skill-creator-keystore` on $PATH (release install)
 *   3. Repo-relative debug path (`src-tauri/target/debug/skill-creator-keystore`)
 *   4. Repo-relative release path (`src-tauri/target/release/skill-creator-keystore`)
 *
 * Returns 127 if no bin can be found (POSIX command-not-found convention).
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ensureProcessAllowed,
  type ProcessContext,
} from '../../security/process-context.js';
import {
  ensureAllowed,
  type LoaderContext,
} from '../../security/loader-context.js';

const LOADER_SOURCE = 'cli/commands/keystore';

export interface KeystoreCommandIO {
  stdout: (chunk: string) => void;
  stderr: (chunk: string) => void;
  stdinPipe?: NodeJS.ReadableStream;
}

const DEFAULT_IO: KeystoreCommandIO = {
  stdout: (chunk) => process.stdout.write(chunk),
  stderr: (chunk) => process.stderr.write(chunk),
};

/**
 * Resolve the `skill-creator-keystore` binary path. See module header for
 * resolution order.
 *
 * Accepts an optional `LoaderContext` (Tier-E security chokepoint, v1.49.782).
 * Sync two-site hoisted-check (#10448 sub-variant): both `existsSync` sites
 * — KEYSTORE_BIN override + candidate-loop — gate independently. Ninth
 * LoaderContext chip at v1.49.903 — NEW sync-existsSync wire shape; sibling
 * of v892 dacp/bus/scanner.ts async two-site hoisted-check.
 */
export function resolveKeystoreBin(loaderCtx?: LoaderContext): string | null {
  const envOverride = process.env.KEYSTORE_BIN;
  if (envOverride) {
    // Site 1: KEYSTORE_BIN override path. Gate before existsSync.
    ensureAllowed(loaderCtx, LOADER_SOURCE, 'exists-check', envOverride);
    if (existsSync(envOverride)) {
      return envOverride;
    }
  }
  // Release install: bin on $PATH. We can't easily check $PATH without
  // spawning `which`/`where`; we rely on `spawn` to surface ENOENT.
  if (envOverride === '') {
    // explicit empty override: fall through to repo-relative paths
  }
  // Try repo-relative debug + release paths (useful for `npm test` and dev).
  const candidates = [
    resolve(process.cwd(), 'src-tauri/target/release/skill-creator-keystore'),
    resolve(process.cwd(), 'src-tauri/target/debug/skill-creator-keystore'),
  ];
  for (const candidate of candidates) {
    // Site 2: candidate-loop. Gate each candidate before existsSync.
    ensureAllowed(loaderCtx, LOADER_SOURCE, 'exists-check', candidate);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  // Falling back to PATH-resolved name.
  return 'skill-creator-keystore';
}

/**
 * Main entry. `args` is the subcommand argv (e.g. ["migrate"], ["set",
 * "anthropic-api-key"], ["status"]).
 */
export async function keystoreCommand(
  args: string[],
  io: KeystoreCommandIO = DEFAULT_IO,
  ctx?: ProcessContext,
  loaderCtx?: LoaderContext,
): Promise<number> {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp(io);
    return 0;
  }

  const subcmd = args[0];
  if (subcmd !== 'migrate' && subcmd !== 'set' && subcmd !== 'status') {
    io.stderr(`error: unknown subcommand '${subcmd}'\n`);
    printHelp(io);
    return 2;
  }

  const bin = resolveKeystoreBin(loaderCtx);
  if (!bin) {
    io.stderr('error: cannot resolve `skill-creator-keystore` binary\n');
    return 127;
  }

  return shellOut(bin, args, io, ctx);
}

function printHelp(io: KeystoreCommandIO): void {
  io.stdout(
    [
      'skill-creator keystore — manage stored credentials',
      '',
      'Usage:',
      '  skill-creator keystore migrate           Migrate v1 plaintext → v2',
      '  skill-creator keystore migrate --to-keyring',
      '                                            Path-2 → Path-1 (stub at v1.49.7XX, M3 deferral)',
      '  skill-creator keystore set <account>     Store/update credential (value on stdin)',
      '  skill-creator keystore status            Print current keystore state',
      '',
      'Backends (auto-detected):',
      '  Path 1: OS keyring (gnome-keyring / macOS Keychain / Windows Credential Manager)',
      '  Path 2: age-encrypted file under ~/.config/gsd-os/credentials.age',
      '',
      'Direct Rust binary invocation also available: `skill-creator-keystore <subcmd>`',
      'See docs/keystore.md for both surfaces and per-OS guarantees.',
      '',
    ].join('\n'),
  );
}

/**
 * Spawn the Rust bin; pass through stdio + exit code. Returns the bin's
 * exit code, or:
 *   127 -- bin not found (ENOENT)
 *   1   -- spawn error other than ENOENT
 */
function shellOut(
  bin: string,
  args: string[],
  io: KeystoreCommandIO,
  ctx?: ProcessContext,
): Promise<number> {
  // Security: hoisted check outside the Promise — synchronous throw of
  // ProcessContextDenied propagates from this function call through the
  // async keystoreCommand wrapper to the CLI dispatcher. The child.on('error')
  // handler below only catches post-spawn errors (ENOENT, etc.), NOT security
  // denials which must be load-bearing per Lesson #10427.
  ensureProcessAllowed(ctx, 'cli/commands/keystore', 'spawn', bin, args);
  return new Promise<number>((resolveExit) => {
    const child = spawn(bin, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    child.stdout?.on('data', (chunk: Buffer) => io.stdout(chunk.toString()));
    child.stderr?.on('data', (chunk: Buffer) => io.stderr(chunk.toString()));

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        io.stderr(
          `error: '${bin}' not found. Install via release artifact, set KEYSTORE_BIN, or run \`cargo build --bin skill-creator-keystore\`.\n`,
        );
        resolveExit(127);
        return;
      }
      io.stderr(`spawn error: ${err.message}\n`);
      resolveExit(1);
    });

    child.on('close', (code: number | null) => {
      resolveExit(code ?? 1);
    });
  });
}
