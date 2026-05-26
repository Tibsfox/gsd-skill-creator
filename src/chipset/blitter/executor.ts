/**
 * Offload executor: runs scripts as child processes outside the LLM
 * context window, capturing stdout, stderr, exit code, and timing.
 *
 * Supports bash, node, python, and custom script types. Each execution
 * writes the script to a temp file, spawns an interpreter, and collects
 * results. Timeout enforcement kills long-running scripts.
 *
 * The OffloadExecutor class wraps executeOffloadOp with optional signal
 * bus integration for notifying downstream consumers on completion.
 */

import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { OffloadOperation, OffloadResult } from './types.js';
import { SignalBus, createCompletionSignal } from './signals.js';

// Environment variables passed through to the spawned interpreter. Only
// locale/runtime essentials are inherited from the parent process; offload
// scripts must declare any other vars explicitly via operation.env. Prevents
// the parent's credential/secret env (FTP_PASS, ANTHROPIC_API_KEY, etc.)
// from leaking into child scripts by default.
const SAFE_ENV_ALLOWLIST = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TZ', 'TMPDIR', 'TEMP', 'TMP'];

function safeEnv(extra: Record<string, string>): Record<string, string> {
  const env: Record<string, string> = {};
  for (const key of SAFE_ENV_ALLOWLIST) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  return { ...env, ...extra };
}

/** Map script types to file extensions. */
const SCRIPT_EXTENSIONS: Record<string, string> = {
  bash: '.sh',
  node: '.js',
  python: '.py',
  custom: '.sh',
};

/** Map script types to interpreters. */
const INTERPRETERS: Record<string, string> = {
  bash: 'bash',
  node: 'node',
  python: process.platform === 'win32' ? 'python' : 'python3',
};

/**
 * Execute an OffloadOperation as a child process.
 *
 * Writes the script to a temporary file, spawns the appropriate
 * interpreter, captures stdout/stderr, and enforces the timeout.
 *
 * @param operation - The offload operation to execute
 * @returns Execution result with exit code, output, and timing
 */
export async function executeOffloadOp(operation: OffloadOperation): Promise<OffloadResult> {
  const startTime = Date.now();

  // Reject the legacy 'custom' scriptType. It previously direct-executed
  // the temp file (chmod 0o755) which let any attacker-controlled script
  // payload pick its own kernel-executed shebang. Legitimate consumers use
  // explicit bash/node/python; no production caller relies on 'custom'.
  if ((operation.scriptType as string) === 'custom') {
    return {
      operationId: operation.id,
      exitCode: -1,
      stdout: '',
      stderr: `'custom' scriptType is not supported; use bash, node, or python`,
      durationMs: Date.now() - startTime,
      timedOut: false,
    };
  }

  const interpreter = INTERPRETERS[operation.scriptType];
  const ext = SCRIPT_EXTENSIONS[operation.scriptType];
  if (!interpreter || !ext) {
    return {
      operationId: operation.id,
      exitCode: -1,
      stdout: '',
      stderr: `Unsupported scriptType: ${operation.scriptType}`,
      durationMs: Date.now() - startTime,
      timedOut: false,
    };
  }

  // Create a temp directory for the script file
  let scriptDir: string;
  let scriptPath: string;
  try {
    scriptDir = await mkdtemp(join(tmpdir(), 'offload-exec-'));
    scriptPath = join(scriptDir, `script${ext}`);
    // Write at 0o600 so the kernel never directly executes this; only the
    // named interpreter does, via argv[1].
    await writeFile(scriptPath, operation.script, { mode: 0o600 });
  } catch (err) {
    // Best-effort cleanup if mkdtemp succeeded but writeFile failed
    if (typeof scriptDir! === 'string') {
      await rm(scriptDir, { recursive: true, force: true }).catch(() => {});
    }
    return {
      operationId: operation.id,
      exitCode: -1,
      stdout: '',
      stderr: `Setup failed: ${(err as Error).message}`,
      durationMs: Date.now() - startTime,
      timedOut: false,
    };
  }

  let timedOut = false;

  return new Promise<OffloadResult>((resolve) => {
    const child = spawn(interpreter, [scriptPath], {
      cwd: operation.workingDir || '.',
      env: safeEnv(operation.env),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    // Set up timeout enforcement -- kill the entire process group
    // so that child processes (e.g., sleep) are also terminated
    const timer = setTimeout(() => {
      timedOut = true;
      if (child.pid) {
        try {
          if (process.platform !== 'win32') {
            process.kill(-child.pid, 'SIGTERM');
          } else {
            child.kill('SIGTERM');
          }
        } catch {
          // Process may have already exited
          child.kill('SIGTERM');
        }
      } else {
        child.kill('SIGTERM');
      }
    }, operation.timeout);

    const cleanup = () => rm(scriptDir, { recursive: true, force: true }).catch(() => {});

    child.on('close', (code: number | null) => {
      clearTimeout(timer);
      cleanup();
      resolve({
        operationId: operation.id,
        exitCode: code ?? -1,
        stdout,
        stderr,
        durationMs: Date.now() - startTime,
        timedOut,
      });
    });

    child.on('error', (err: Error) => {
      clearTimeout(timer);
      cleanup();
      resolve({
        operationId: operation.id,
        exitCode: -1,
        stdout,
        stderr: stderr + err.message,
        durationMs: Date.now() - startTime,
        timedOut: false,
      });
    });
  });
}

/**
 * Offload executor with optional signal bus integration.
 *
 * Wraps executeOffloadOp and emits completion signals to an attached
 * SignalBus after each execution finishes. This allows downstream
 * consumers (e.g., Copper synchronization) to react to offload completions
 * without tight coupling.
 */
export class OffloadExecutor {
  private signalBus?: SignalBus;

  /**
   * @param signalBus - Optional bus for emitting completion signals
   */
  constructor(signalBus?: SignalBus) {
    this.signalBus = signalBus;
  }

  /**
   * Execute an offload operation and optionally emit a completion signal.
   *
   * @param operation - The operation to execute
   * @returns Execution result
   */
  async execute(operation: OffloadOperation): Promise<OffloadResult> {
    const result = await executeOffloadOp(operation);

    if (this.signalBus) {
      const signal = createCompletionSignal(result);
      this.signalBus.emit(signal);
    }

    return result;
  }
}
