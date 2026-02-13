/**
 * Terminal CLI command.
 *
 * Provides start/stop/status/restart subcommands for the Wetty
 * terminal service. Spawns wetty as a detached background process
 * and tracks it via a PID file so the CLI can exit immediately
 * while the terminal server keeps running.
 *
 * Subcommands:
 * - start: Launch the Wetty terminal server (background)
 * - stop: Gracefully shut down the terminal server
 * - status: Show current terminal service status
 * - restart: Stop then start the terminal server
 *
 * @module cli/commands/terminal
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { TerminalConfig } from '../../integration/config/terminal-types.js';
import { checkHealth } from '../../terminal/health.js';
import { buildSessionCommand } from '../../terminal/session.js';

// ---------------------------------------------------------------------------
// PID file management
// ---------------------------------------------------------------------------

/** PID file location: .planning/.terminal.pid */
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

/** Check if a PID is still alive. */
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
  // Check if already running
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

  // Build CLI args
  const wettyArgs: string[] = [
    '--port', String(config.port),
    '--base', config.base_path,
    '--allow-iframe',
  ];

  const command = buildSessionCommand(config.session_name);
  if (command !== undefined) {
    wettyArgs.push('--command', command);
  }

  try {
    const child = spawn('wetty', wettyArgs, {
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

    // Detach so CLI can exit
    child.unref();
    writePid(child.pid);

    const url = buildUrl(config);
    console.log(JSON.stringify({
      action: 'start',
      process: 'running',
      pid: child.pid,
      url,
      healthy: false,
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

    // Wait up to 5s for graceful shutdown
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && isProcessAlive(pid)) {
      await new Promise(r => setTimeout(r, 200));
    }

    // Escalate if still alive
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
