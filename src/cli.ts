#!/usr/bin/env node
import { createRequire } from 'node:module';
import { resolve as pathResolve } from 'node:path';
import { isCliEntrypoint } from './cli/entrypoint-guard.js';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { createStores } from './index.js';
import { validateCommand } from './cli/commands/validate.js';
import { detectConflictsCommand } from './cli/commands/detect-conflicts.js';
import { scoreActivationCommand } from './cli/commands/score-activation.js';
import { simulateCommand, simulateHelp } from './cli/commands/simulate.js';
import { calibrateCommand, calibrateHelp } from './cli/commands/calibrate.js';
import { publishCommand } from './cli/commands/publish.js';
import { installCommand } from './cli/commands/install.js';
import { critiqueCommand } from './cli/commands/critique.js';
import { sensoriaCommand } from './sensoria/cli.js';
import { VersionManager } from './learning/index.js';
import { parseScope, getSkillsBasePath, type SkillScope } from './types/scope.js';
import { SkillStore } from './storage/skill-store.js';
import { SkillIndex } from './storage/skill-index.js';
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
  // Equals form: --skills-dir=<value>
  const eq = args.find((a) => a.startsWith('--skills-dir='));
  if (eq) {
    const value = eq.slice('--skills-dir='.length);
    if (value) return pathResolve(process.cwd(), value);
  }
  // Separated form: --skills-dir <value>
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
  // Equals form: --name=<value>
  const prefix = `${name}=`;
  const eq = args.find((a) => a.startsWith(prefix));
  if (eq) {
    const value = eq.slice(prefix.length);
    return value || undefined;
  }
  // Separated form: --name <value>
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) {
    const value = args[idx + 1]!;
    if (value && !value.startsWith('-')) {
      return value;
    }
  }
  return undefined;
}

function createScopedStoreAndIndex(scope: SkillScope) {
  const skillsDir = getSkillsBasePath(scope);
  const skillStore = new SkillStore(skillsDir);
  const skillIndex = new SkillIndex(skillStore, skillsDir);
  return { skillStore, skillIndex, skillsDir };
}

function parseThreshold(args: string[]): number | undefined {
  const thresholdArg = args.find((a) => a.startsWith('--threshold='));
  if (thresholdArg) {
    const value = parseFloat(thresholdArg.split('=')[1]);
    if (!isNaN(value)) return value;
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

  const dispatchHandler = dispatchLookup(command);
  if (dispatchHandler) {
    const ctx: CliContext = {
      args,
      skillStore,
      skillIndex,
      parseScope,
      parseSkillsDir,
      parseStringFlag,
    };
    const exitCode = await dispatchHandler(ctx);
    if (typeof exitCode === 'number' && exitCode !== 0) {
      process.exit(exitCode);
    }
    return;
  }

  switch (command) {
    case 'validate':
    case 'v': {
      const scope = parseScope(args);
      const isAll = args.includes('--all') || args.includes('-a');
      const skillArgs = args.slice(1).filter((a) => !a.startsWith('-'));
      const skillName = skillArgs[0];
      const exitCode = await validateCommand(
        isAll ? undefined : skillName,
        { all: isAll, skillsDir: getSkillsBasePath(scope) },
      );
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'detect-conflicts':
    case 'conflicts':
    case 'dc': {
      if (args.includes('--help') || args.includes('-h')) {
        await detectConflictsCommand('--help', {});
        break;
      }
      const scope = parseScope(args);
      const threshold = parseThreshold(args);
      const quiet = args.includes('--quiet') || args.includes('-q');
      const json = args.includes('--json');
      const skillArgs = args.slice(1).filter((a) => !a.startsWith('-'));
      const skillName = skillArgs[0];
      const exitCode = await detectConflictsCommand(skillName, {
        threshold,
        quiet,
        json,
        skillsDir: getSkillsBasePath(scope),
      });
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'score-activation':
    case 'sa':
    case 'score': {
      if (args.includes('--help') || args.includes('-h')) {
        await scoreActivationCommand('--help', {});
        break;
      }
      const scope = parseScope(args);
      const all = args.includes('--all') || args.includes('-a');
      const verbose = args.includes('--verbose') || args.includes('-v');
      const quiet = args.includes('--quiet') || args.includes('-q');
      const json = args.includes('--json');
      const llm = args.includes('--llm');
      const skillArgs = args.slice(1).filter((a) => !a.startsWith('-'));
      const skillName = skillArgs[0];
      const exitCode = await scoreActivationCommand(skillName, {
        all,
        verbose,
        quiet,
        json,
        llm,
        skillsDir: getSkillsBasePath(scope),
      });
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'simulate':
    case 'sim': {
      if (args.includes('--help') || args.includes('-h')) {
        console.log(simulateHelp());
        break;
      }
      const scope = parseScope(args);
      const verbose = args.includes('--verbose') || args.includes('-v');
      const json = args.includes('--json');
      const thresholdArg = args.find((a) => a.startsWith('--threshold='));
      const threshold = thresholdArg ? parseFloat(thresholdArg.split('=')[1]) : undefined;
      const batchArg = args.find((a) => a.startsWith('--batch='));
      const batch = batchArg?.split('=')[1];
      const promptArgs = args.filter(
        (a) => !a.startsWith('--') && !a.startsWith('-') && a !== 'simulate' && a !== 'sim',
      );
      await simulateCommand(promptArgs, { scope, verbose, threshold, json, batch });
      break;
    }

    case 'critique':
    case 'crit': {
      if (args.includes('--help') || args.includes('-h')) {
        await critiqueCommand(undefined, {});
        break;
      }
      const scope = parseScope(args);
      const skillArgs = args.slice(1).filter((a) => !a.startsWith('-'));
      const skillName = skillArgs[0];
      const maxIterArg = args.find((a) => a.startsWith('--max-iter'));
      const maxIter = maxIterArg
        ? parseInt(
            maxIterArg.includes('=') ? maxIterArg.split('=')[1]! : args[args.indexOf(maxIterArg) + 1]!,
            10,
          )
        : undefined;
      const exitCode = await critiqueCommand(skillName, {
        skillsDir: parseSkillsDir(args, scope),
        maxIter: !isNaN(maxIter!) ? maxIter : undefined,
        checkExternal: args.includes('--check-external'),
        mock: args.includes('--mock'),
      });
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'test-triggering': {
      const scope = parseScope(args);
      const skillName = args.slice(1).filter((a) => !a.startsWith('-'))[0];
      const { testTriggeringCommand } = await import('./cli/commands/test-triggering.js');
      const exitCode = await testTriggeringCommand(skillName, {
        skillsDir: parseSkillsDir(args, scope),
        mock: args.includes('--mock'),
        overrideTriggering: parseStringFlag(args, '--override-triggering'),
      });
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'history':
    case 'hist': {
      const skillName = args[1];
      if (!skillName) {
        p.log.error('Usage: skill-creator history <skill-name>');
        break;
      }
      const versionManager = new VersionManager();
      const history = await versionManager.getHistory(skillName);
      if (history.length === 0) {
        p.log.info(`No version history for '${skillName}'.`);
        p.log.message('The skill may not be tracked in git yet.');
        break;
      }
      p.log.message('');
      p.log.message(pc.bold(`Version History for '${skillName}':`));
      for (const version of history) {
        const date = version.date.toLocaleDateString();
        const versionLabel = version.version ? `v${version.version}` : '';
        p.log.message(`  ${version.shortHash} ${date} ${versionLabel}`);
        p.log.message(pc.dim(`    ${version.message}`));
      }
      break;
    }

    case 'calibrate':
    case 'cal': {
      if (args.includes('--help') || args.includes('-h')) {
        console.log(calibrateHelp());
        break;
      }
      const exitCode = await calibrateCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'benchmark':
    case 'bench': {
      if (args.includes('--help') || args.includes('-h')) {
        console.log(calibrateHelp());
        break;
      }
      const exitCode = await calibrateCommand(['benchmark', ...args.slice(1)]);
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'config':
    case 'cfg': {
      const subcommand = args[1];
      const subArgs = args.slice(2);
      switch (subcommand) {
        case 'validate':
        case 'v': {
          const { configValidateCommand } = await import('./cli/commands/config-validate.js');
          const exitCode = await configValidateCommand(subArgs);
          if (exitCode !== 0) process.exit(exitCode);
          break;
        }
        default:
          p.log.message('');
          p.log.message(pc.bold('Config Management:'));
          p.log.message('');
          p.log.message('  Subcommands:');
          p.log.message(`    ${pc.cyan('config validate')}   Validate GSD configuration against ranges and security policies`);
          p.log.message('');
          p.log.message('  Examples:');
          p.log.message('    skill-creator config validate');
          p.log.message('    skill-creator config validate --json');
          p.log.message('    skill-creator config validate --config=/path/to/config.json');
      }
      break;
    }

    case 'publish':
    case 'pub': {
      const scope = parseScope(args);
      if (args.includes('--help') || args.includes('-h')) {
        await publishCommand(undefined, {});
        break;
      }
      const skillArgs = args.slice(1).filter((a) => !a.startsWith('-'));
      const skillName = skillArgs[0];
      const outputIdx = args.findIndex((a) => a === '--output' || a === '-o');
      const output = outputIdx >= 0 ? args[outputIdx + 1] : undefined;
      const exitCode = await publishCommand(skillName, {
        skillsDir: parseSkillsDir(args, scope),
        output,
        overrideCritique: parseStringFlag(args, '--override-critique'),
        overrideTriggering: parseStringFlag(args, '--override-triggering'),
      });
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'install':
    case 'inst': {
      const scope = parseScope(args);
      if (args.includes('--help') || args.includes('-h')) {
        await installCommand(undefined, {});
        break;
      }
      const installArgs = args.slice(1).filter((a) => !a.startsWith('-'));
      const source = installArgs[0];
      const exitCode = await installCommand(source, {
        skillsDir: getSkillsBasePath(scope),
      });
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'export':
    case 'ex': {
      const { exportCommand } = await import('./cli/commands/export.js');
      const scope = parseScope(args);
      const portable = args.includes('--portable');
      const platformArg = args.find((a) => a.startsWith('--platform='));
      const platformArgIdx = args.indexOf('--platform');
      const platform = platformArg
        ? platformArg.split('=')[1]
        : platformArgIdx >= 0
        ? args[platformArgIdx + 1]
        : undefined;
      const outputArg = args.find((a) => a.startsWith('--output=') || a.startsWith('-o='));
      const outputArgIdx = args.findIndex((a) => a === '--output' || a === '-o');
      const output = outputArg
        ? outputArg.split('=')[1]
        : outputArgIdx >= 0
        ? args[outputArgIdx + 1]
        : undefined;
      const flagValues = new Set([platform, output].filter(Boolean));
      const skillName = args.slice(1).find((a) => !a.startsWith('-') && !flagValues.has(a));
      const exitCode = await exportCommand(skillName, {
        portable,
        platform,
        output,
        skillsDir: getSkillsBasePath(scope),
      });
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'sensoria': {
      const scope = parseScope(args);
      const { skillStore: scopedStore } = createScopedStoreAndIndex(scope);
      const positional = args.slice(1).filter((a) => !a.startsWith('-'));
      const skillName = positional[0];
      const format = parseStringFlag(args, '--format');
      const minStr = parseStringFlag(args, '--min');
      const maxStr = parseStringFlag(args, '--max');
      const pointsStr = parseStringFlag(args, '--points');
      const settingsPath = parseStringFlag(args, '--settings');
      const exitCode = await sensoriaCommand(
        args.includes('--help') || args.includes('-h') ? '--help' : skillName,
        {
          format,
          min: minStr !== undefined ? Number(minStr) : undefined,
          max: maxStr !== undefined ? Number(maxStr) : undefined,
          points: pointsStr !== undefined ? Number(pointsStr) : undefined,
          tachyphylaxis: args.includes('--tachyphylaxis'),
          quiet: args.includes('--quiet') || args.includes('-q'),
          settingsPath,
        },
        { skillStore: scopedStore },
      );
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    default:
      if (command) {
        p.log.error(`Unknown command: ${command}`);
      }
      printHelp();
      process.exit(command ? 1 : 0);
  }
}

if (isCliEntrypoint(import.meta.url)) {
  main().catch((err) => {
    p.log.error(err.message);
    process.exit(1);
  });
}
