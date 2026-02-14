/**
 * Terminal CLI command.
 *
 * Provides start/stop/status/restart subcommands for the Wetty
 * terminal service. Spawns wetty as a detached background process
 * and tracks it via a PID file so the CLI can exit immediately
 * while the terminal server keeps running.
 *
 * Prefers running wetty from a local source build (which has bundled
 * client JS) over the global `wetty` binary (which may ship unbundled
 * source due to npm packaging bugs in wetty 2.7.0).
 *
 * @module cli/commands/terminal
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import type { TerminalConfig } from '../../integration/config/terminal-types.js';
import { checkHealth } from '../../terminal/health.js';

// ---------------------------------------------------------------------------
// PID file management
// ---------------------------------------------------------------------------

function pidFilePath(): string {
  return join(process.cwd(), '.planning', '.terminal.pid');
}

function readPid(): number | null {
  const path = pidFilePath();
  if (!existsSync(path)) return null;
  const content = readFileSync(path, 'utf-8').trim();
  const pid = parseInt(content, 10);
  return isNaN(pid) ? null : pid;
}

function writePid(pid: number): void {
  const dir = join(process.cwd(), '.planning');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(pidFilePath(), String(pid), 'utf-8');
}

function removePid(): void {
  const path = pidFilePath();
  if (existsSync(path)) unlinkSync(path);
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: TerminalConfig = {
  port: 11338,
  base_path: '/terminal',
  auth_mode: 'none',
  theme: 'dark',
  session_name: 'dev',
};

function extractFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function resolveConfig(args: string[]): TerminalConfig {
  const portStr = extractFlag(args, 'port');
  const basePath = extractFlag(args, 'base');
  const sessionName = extractFlag(args, 'session');

  return {
    ...DEFAULT_CONFIG,
    ...(portStr !== undefined ? { port: parseInt(portStr, 10) } : {}),
    ...(basePath !== undefined ? { base_path: basePath } : {}),
    ...(sessionName !== undefined ? { session_name: sessionName } : {}),
  };
}

function buildUrl(config: TerminalConfig): string {
  return `http://localhost:${config.port}${config.base_path}`;
}

// ---------------------------------------------------------------------------
// Wetty resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a working wetty installation.
 *
 * The npm-published wetty 2.7.0 ships unbundled client JS that browsers
 * can't load (bare ESM imports). A source build produces a bundled client.
 * This function searches for a working build in these locations:
 *
 * 1. ~/.local/share/wetty/build/main.js (user-installed build)
 * 2. /tmp/wetty-build/build/main.js (build from source clone)
 *
 * Returns {cmd, args_prefix} for spawning, or falls back to global `wetty`.
 */
function resolveWetty(): { cmd: string; prefix: string[]; baseDir: string | null } {
  const candidates = [
    join(homedir(), '.local', 'share', 'wetty', 'build', 'main.js'),
    '/tmp/wetty-build/build/main.js',
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      // baseDir is parent of build/ (e.g. /tmp/wetty-build)
      return { cmd: 'node', prefix: [candidate], baseDir: dirname(dirname(candidate)) };
    }
  }

  // Fallback to global wetty binary
  return { cmd: 'wetty', prefix: [], baseDir: null };
}

/**
 * Apply runtime patches to the wetty source build.
 *
 * Fixes three issues in stock wetty:
 *
 * 1. command.js: Removes root-only guard (`getuid() === 0`) so wetty
 *    spawns a local PTY instead of trying SSH (which requires sshd).
 * 2. env.js: Wraps version parsing in try/catch so non-GNU coreutils
 *    (e.g. uutils) don't crash the process with an uncaught exception.
 * 3. wetty.js: Disables beforeunload "Are you sure?" prompt that
 *    blocks page navigation and iframe refreshes.
 */
function ensureLocalModePatch(baseDir: string): void {
  // Patch 1: Allow local mode for non-root
  const commandJs = join(baseDir, 'build', 'server', 'command.js');
  if (existsSync(commandJs)) {
    const content = readFileSync(commandJs, 'utf-8');
    const rootOnlyCheck = 'process.getuid() === 0 &&';
    if (content.includes(rootOnlyCheck)) {
      writeFileSync(commandJs, content.replace(rootOnlyCheck, ''), 'utf-8');
    }
  }

  // Patch 2: Fix env version crash with non-GNU coreutils
  const envJs = join(baseDir, 'build', 'server', 'spawn', 'env.js');
  if (existsSync(envJs)) {
    const content = readFileSync(envJs, 'utf-8');
    if (content.includes("split(' (GNU coreutils) ')[1].split")) {
      const patched = content.replace(
        /return resolve\(parseInt\(stdout\.split\(\/\\r\?\\n\/\)\[0\]\.split\(' \(GNU coreutils\) '\)\[1\]\.split\('\.'\)\[0\], 10\)\);/,
        `try {
            var line = stdout.split(/\\r?\\n/)[0];
            var parts = line.split(' (GNU coreutils) ');
            if (parts.length < 2) return reject(Error('non-GNU coreutils'));
            return resolve(parseInt(parts[1].split('.')[0], 10));
        } catch (e) { return reject(e); }`,
      );
      writeFileSync(envJs, patched, 'utf-8');
    }
  }

  // Patch 3: Remove "Are you sure you want to leave?" prompt
  const wettyJs = join(baseDir, 'build', 'client', 'wetty.js');
  if (existsSync(wettyJs)) {
    const content = readFileSync(wettyJs, 'utf-8');
    const leavePrompt = 'function fe(i){return i.returnValue="Are you sure?",i.returnValue}';
    if (content.includes(leavePrompt)) {
      writeFileSync(wettyJs, content.replace(leavePrompt, 'function fe(i){return}'), 'utf-8');
    }
  }
}

/**
 * Write an executable entry-point script for wetty's --command flag.
 *
 * Wetty's local mode runs `/usr/bin/env <command>` where command is a
 * single token (no shell interpretation). A wrapper script lets us run
 * the compound tmux attach-or-create command.
 */
function writeEntryScript(baseDir: string, sessionName: string): string {
  const scriptPath = join(baseDir, 'terminal-entry.sh');
  const content = [
    '#!/bin/bash',
    `exec tmux new-session -A -s ${sessionName}`,
    '',
  ].join('\n');
  writeFileSync(scriptPath, content, 'utf-8');
  chmodSync(scriptPath, 0o755);
  return scriptPath;
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export async function terminalCommand(args: string[]): Promise<number> {
  const subcommand = args[0];

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    showTerminalHelp();
    return 0;
  }

  const handlerArgs = args.slice(1);
  const config = resolveConfig(handlerArgs);

  switch (subcommand) {
    case 'start':
      return handleStart(config);
    case 'stop':
      return handleStop(config);
    case 'status':
      return handleStatus(config);
    case 'restart':
      return handleRestart(config);
    default:
      console.log(JSON.stringify({
        error: `Unknown terminal subcommand: ${subcommand}`,
        help: 'Available: start, stop, status, restart',
      }, null, 2));
      return 1;
  }
}

// ---------------------------------------------------------------------------
// Subcommand handlers
// ---------------------------------------------------------------------------

async function handleStart(config: TerminalConfig): Promise<number> {
  const existingPid = readPid();
  if (existingPid !== null && isProcessAlive(existingPid)) {
    const url = buildUrl(config);
    const health = await checkHealth(url);
    console.log(JSON.stringify({
      action: 'start',
      process: 'running',
      pid: existingPid,
      url,
      healthy: health.healthy,
      message: 'Terminal already running',
    }, null, 2));
    return 0;
  }

  const wettyArgs: string[] = [
    '--port', String(config.port),
    '--base', config.base_path,
    '--allow-iframe',
  ];

  try {
    const { cmd, prefix, baseDir } = resolveWetty();

    // For source builds: patch local mode and generate entry script
    if (baseDir !== null) {
      ensureLocalModePatch(baseDir);
      const entryScript = writeEntryScript(baseDir, config.session_name ?? 'dev');
      wettyArgs.push('--command', entryScript);
    }

    const spawnArgs = [...prefix, ...wettyArgs];

    const child = spawn(cmd, spawnArgs, {
      detached: true,
      stdio: 'ignore',
    });

    if (child.pid == null) {
      console.log(JSON.stringify({
        action: 'start',
        error: 'Failed to spawn wetty process',
      }, null, 2));
      return 1;
    }

    child.unref();
    writePid(child.pid);

    const url = buildUrl(config);
    const source = prefix.length > 0 ? prefix[0] : cmd;
    console.log(JSON.stringify({
      action: 'start',
      process: 'running',
      pid: child.pid,
      url,
      healthy: false,
      source,
      message: 'Terminal started (health check may take a moment)',
    }, null, 2));
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ action: 'start', error: message }, null, 2));
    return 1;
  }
}

async function handleStop(config: TerminalConfig): Promise<number> {
  const pid = readPid();

  if (pid === null || !isProcessAlive(pid)) {
    removePid();
    console.log(JSON.stringify({
      action: 'stop',
      process: 'stopped',
      message: 'Terminal is not running',
    }, null, 2));
    return 0;
  }

  try {
    process.kill(pid, 'SIGTERM');

    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && isProcessAlive(pid)) {
      await new Promise(r => setTimeout(r, 200));
    }

    if (isProcessAlive(pid)) {
      process.kill(pid, 'SIGKILL');
    }

    removePid();
    console.log(JSON.stringify({
      action: 'stop',
      process: 'stopped',
      pid,
      message: 'Terminal stopped',
    }, null, 2));
    return 0;
  } catch (err) {
    removePid();
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ action: 'stop', error: message }, null, 2));
    return 1;
  }
}

async function handleStatus(config: TerminalConfig): Promise<number> {
  const pid = readPid();
  const url = buildUrl(config);

  if (pid === null || !isProcessAlive(pid)) {
    removePid();
    console.log(JSON.stringify({
      action: 'status',
      process: 'stopped',
      pid: null,
      url,
      healthy: false,
    }, null, 2));
    return 0;
  }

  const health = await checkHealth(url);
  console.log(JSON.stringify({
    action: 'status',
    process: 'running',
    pid,
    url,
    healthy: health.healthy,
  }, null, 2));
  return 0;
}

async function handleRestart(config: TerminalConfig): Promise<number> {
  await handleStop(config);
  return handleStart(config);
}

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

function showTerminalHelp(): void {
  console.log(`
skill-creator terminal - Manage the Wetty terminal server

Usage:
  skill-creator terminal <subcommand> [options]
  skill-creator term <subcommand> [options]

Subcommands:
  start     Launch the Wetty terminal server (background)
  stop      Gracefully shut down the terminal server
  status    Show current terminal service status
  restart   Stop then start the terminal server

Options:
  --port=<number>       Wetty server port (default: 11338)
  --base=<path>         URL base path (default: /terminal)
  --session=<name>      tmux session name (default: dev)

Examples:
  skill-creator terminal start
  skill-creator term start --port=4000
  skill-creator terminal stop
  skill-creator terminal status
  skill-creator term restart
`);
}
