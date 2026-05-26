#!/usr/bin/env node
import { createRequire } from 'node:module';
import { resolve as pathResolve } from 'node:path';
import { isCliEntrypoint } from './cli/entrypoint-guard.js';
import * as p from '@clack/prompts';
import { createStores } from './index.js';
import { parseScope, getSkillsBasePath, type SkillScope } from './types/scope.js';
import { lookup as dispatchLookup, type CliContext } from './cli/dispatch.js';
import { printHelp } from './cli/help.js';

/**
 * Resolve the skills base path for a CLI invocation.
 * Honors `--skills-dir <path>` and `--skills-dir=<path>`; falls back to the
 * scope default when the flag is absent. Relative paths are resolved against
 * process.cwd() so `examples/skills/coding` works from the repo root.
 *
 * Exported for unit testing in src/cli.test.ts.
 */
export function parseSkillsDir(args: string[], scope: SkillScope): string {
  const eq = args.find((a) => a.startsWith('--skills-dir='));
  if (eq) {
    const value = eq.slice('--skills-dir='.length);
    if (value) return pathResolve(process.cwd(), value);
  }
  const idx = args.indexOf('--skills-dir');
  if (idx >= 0 && idx + 1 < args.length) {
    const value = args[idx + 1]!;
    if (value && !value.startsWith('-')) {
      return pathResolve(process.cwd(), value);
    }
  }
  return getSkillsBasePath(scope);
}

/**
 * Parse a generic string-valued CLI flag.
 * Honors `--name <value>` (separated) and `--name=<value>` (equals form).
 * Returns undefined when the flag is absent, when the next token starts with `-`
 * (meaning the flag value is missing and the next arg is another flag), or when
 * the equals form has an empty value. Never mutates `args`.
 *
 * Exported for unit testing in src/cli.test.ts and shared across case handlers
 * that need single-value flags (critique, publish, etc.).
 */
export function parseStringFlag(args: string[], name: string): string | undefined {
  const prefix = `${name}=`;
  const eq = args.find((a) => a.startsWith(prefix));
  if (eq) {
    const value = eq.slice(prefix.length);
    return value || undefined;
  }
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) {
    const value = args[idx + 1]!;
    if (value && !value.startsWith('-')) {
      return value;
    }
  }
  return undefined;
}

async function printVersion(): Promise<void> {
  const require = createRequire(import.meta.url);
  const pkg = require('../package.json') as { version: string; name: string };

  let tsVersion = 'unknown';
  try {
    const tsPkg = require('typescript/package.json') as { version: string };
    tsVersion = tsPkg.version;
  } catch {
    tsVersion = 'not installed';
  }

  console.log(`skill-creator  v${pkg.version}`);
  console.log(`Node.js        ${process.version}`);
  console.log(`TypeScript     ${tsVersion}`);
  console.log(`Platform       ${process.platform} ${process.arch}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--version' || command === '-V' || args.includes('--version') || args.includes('-V')) {
    await printVersion();
    return;
  }

  const { skillStore, skillIndex } = createStores();

  const handler = dispatchLookup(command);
  if (handler) {
    const ctx: CliContext = {
      args,
      skillStore,
      skillIndex,
      parseScope,
      parseSkillsDir,
      parseStringFlag,
    };
    const exitCode = await handler(ctx);
    if (typeof exitCode === 'number' && exitCode !== 0) {
      process.exit(exitCode);
    }
    return;
  }

  if (command) {
    p.log.error(`Unknown command: ${command}`);
  }
  printHelp();
  process.exit(command ? 1 : 0);
}

if (isCliEntrypoint(import.meta.url)) {
  main().catch((err) => {
    p.log.error(err.message);
    process.exit(1);
  });
}
