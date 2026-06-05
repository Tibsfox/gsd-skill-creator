import type { SkillScope } from '../types/scope.js';
import { getSkillsBasePath } from '../types/scope.js';
import { suggestCommand, suggestionsCommand } from './commands/suggest.js';
import { feedbackCommand } from './commands/feedback.js';
import { refineCommand } from './commands/refine.js';
import { deleteCommand } from './commands/delete.js';
import { invokeCommand } from './commands/invoke.js';
import { agentsCommand } from './commands/agents.js';
import { teamCommand } from './commands/team.js';
import { dacpCommand } from './commands/dacp.js';
import { koopmanCheckCommand } from './commands/koopman-check.js';
import { coherentCheckCommand } from './commands/coherent-check.js';
import { hourglassCheckCommand } from './commands/hourglass-check.js';
import { boundedLearningCommand } from './commands/bounded-learning.js';
import { rollbackCommand } from './commands/rollback.js';
import { skillCommand } from './commands/skill.js';
import { gitCommand } from './commands/git.js';
import { skillInventoryCommand } from './commands/skill-inventory.js';
import { printHelp } from './help.js';
import { createStores, createApplicationContext } from '../index.js';
import { createSkillWorkflow } from '../workflows/create-skill-workflow.js';
import { listSkillsWorkflow, parseScopeFilter } from '../workflows/list-skills-workflow.js';
import { searchSkillsWorkflow } from '../workflows/search-skills-workflow.js';
import { migrateCommand } from './commands/migrate.js';
import { migrateAgentCommand } from './commands/migrate-agent.js';
import { syncReservedCommand } from './commands/sync-reserved.js';
import { testCommand } from './commands/test.js';
import { cartridgeCommand } from './commands/cartridge.js';
import { chipCommand } from './commands/chip.js';
import { keystoreCommand } from './commands/keystore.js';
import { runCoprocessorCli } from '../coprocessor/cli.js';
import { evalCommand } from './commands/eval.js';
import { budgetCommand } from './commands/budget.js';
import { budgetEstimateCommand } from './commands/budget-estimate.js';
import { resolveCommand } from './commands/resolve.js';
import { reloadEmbeddingsCommand } from './commands/reload-embeddings.js';
import { mcpServerCommand } from './commands/mcp-server.js';
import { statusCommand } from './commands/status.js';
import { auditCommand } from './commands/audit.js';
import { teachCliCommand, coEvolutionCliCommand, quintessenceCliCommand } from '../symbiosis/cli.js';
import { validateCommand } from './commands/validate.js';
import { detectConflictsCommand } from './commands/detect-conflicts.js';
import { scoreActivationCommand } from './commands/score-activation.js';
import { simulateCommand, simulateHelp } from './commands/simulate.js';
import { calibrateCommand, calibrateHelp } from './commands/calibrate.js';
import { cadenceCommand } from './commands/cadence.js';
import { publishCommand } from './commands/publish.js';
import { installCommand } from './commands/install.js';
import { critiqueCommand } from './commands/critique.js';
import { sensoriaCommand } from '../sensoria/cli.js';
import { VersionManager } from '../learning/index.js';
import { SkillStore } from '../storage/skill-store.js';
import type { SkillStore as SkillStoreType } from '../storage/skill-store.js';
import { SkillIndex } from '../storage/skill-index.js';
import type { SkillIndex as SkillIndexType } from '../storage/skill-index.js';
import * as p from '@clack/prompts';
import pc from 'picocolors';

function parseThreshold(args: string[]): number | undefined {
  const thresholdArg = args.find((a) => a.startsWith('--threshold='));
  if (thresholdArg) {
    const value = parseFloat(thresholdArg.split('=')[1]);
    if (!isNaN(value)) return value;
  }
  return undefined;
}

function createScopedStoreAndIndex(scope: SkillScope) {
  const skillsDir = getSkillsBasePath(scope);
  const skillStore = new SkillStore(skillsDir);
  const skillIndex = new SkillIndex(skillStore, skillsDir);
  return { skillStore, skillIndex, skillsDir };
}

export interface CliContext {
  args: string[];
  skillStore: SkillStoreType;
  skillIndex: SkillIndexType;
  parseScope: (args: string[]) => SkillScope;
  parseSkillsDir: (args: string[], scope: SkillScope) => string;
  parseStringFlag: (args: string[], name: string) => string | undefined;
}

export type CommandHandler = (ctx: CliContext) => Promise<number | void>;

export interface CommandEntry {
  readonly aliases: readonly string[];
  readonly handler: CommandHandler;
}

// Edit this array to register a new command. Each entry maps a set of
// alias strings (the command word + short aliases) to a single handler.
// Lookup is O(n) over entries; n is small enough that a flat scan beats
// a Map for the constant-factor cost of the few-dozen-command surface.
export const REGISTRY: readonly CommandEntry[] = [
  // ---- skill discovery / authoring ----
  { aliases: ['create', 'c'], handler: async (ctx) => {
    const scope = ctx.parseScope(ctx.args);
    const skillsDir = getSkillsBasePath(scope);
    const { SkillStore } = await import('../storage/skill-store.js');
    const scopedStore = new SkillStore(skillsDir);
    await createSkillWorkflow(scopedStore, scope);
  } },
  { aliases: ['list', 'ls'], handler: async (ctx) => {
    const scopeFilter = parseScopeFilter(ctx.args);
    await listSkillsWorkflow(ctx.skillIndex, { scopeFilter });
  } },
  { aliases: ['search', 's'], handler: async (ctx) => {
    const allScopes = ctx.args.includes('--all') || ctx.args.includes('-a');
    const dirsFlag = ctx.args.find((a) => a.startsWith('--dirs='));
    const pluginDirs = dirsFlag ? dirsFlag.slice('--dirs='.length).split(',') : undefined;
    await searchSkillsWorkflow(ctx.skillIndex, { allScopes, pluginDirs });
  } },
  { aliases: ['migrate', 'mg'], handler: async (ctx) => {
    const scope = ctx.parseScope(ctx.args);
    const skillName = ctx.args.filter((a) => !a.startsWith('-'))[1];
    await migrateCommand(skillName, { skillsDir: getSkillsBasePath(scope) });
  } },
  { aliases: ['migrate-agent', 'ma'], handler: async (ctx) => {
    const dryRun = ctx.args.includes('--dry-run') || ctx.args.includes('-d');
    const agentName = ctx.args.filter((a) => !a.startsWith('-'))[1];
    return migrateAgentCommand(agentName, { dryRun });
  } },
  { aliases: ['migrate-plane', 'mp'], handler: async (ctx) => {
    const { handleMigratePlaneCommand } = await import('../plane/migration.js');
    await handleMigratePlaneCommand({
      dryRun: ctx.args.includes('--dry-run'),
      force: ctx.args.includes('--force'),
      includeHistory: !ctx.args.includes('--no-history'),
      verbose: ctx.args.includes('--verbose') || ctx.args.includes('-v'),
    });
  } },

  // ---- already-extracted ----
  { aliases: ['suggest', 'sg'], handler: () => suggestCommand() },
  { aliases: ['suggestions', 'sgs'], handler: (ctx) => suggestionsCommand(ctx.args) },
  { aliases: ['feedback', 'fb'], handler: (ctx) => feedbackCommand(ctx.args) },
  { aliases: ['refine', 'rf'], handler: (ctx) => refineCommand(ctx.args) },
  { aliases: ['delete', 'del', 'rm'], handler: (ctx) => deleteCommand(ctx.args) },
  { aliases: ['invoke', 'i'], handler: (ctx) => invokeCommand(ctx.args) },
  { aliases: ['agents', 'ag'], handler: (ctx) => agentsCommand(ctx.args) },
  { aliases: ['team', 'tm'], handler: (ctx) => teamCommand(ctx.args) },
  { aliases: ['dacp', 'dp'], handler: (ctx) => dacpCommand(ctx.args) },
  { aliases: ['koopman-check', 'kc'], handler: async (ctx) => {
    const exitCode = await koopmanCheckCommand(ctx.args);
    process.exitCode = exitCode;
  } },
  { aliases: ['coherent-check', 'cc'], handler: async (ctx) => {
    const exitCode = await coherentCheckCommand(ctx.args);
    process.exitCode = exitCode;
  } },
  { aliases: ['hourglass-check', 'hc'], handler: async (ctx) => {
    const exitCode = await hourglassCheckCommand(ctx.args);
    process.exitCode = exitCode;
  } },
  { aliases: ['bounded-learning', 'bl'], handler: async (ctx) => {
    const exitCode = await boundedLearningCommand(ctx.args);
    process.exitCode = exitCode;
  } },
  { aliases: ['cadence', 'cad'], handler: async (ctx) => {
    const exitCode = await cadenceCommand(ctx.args);
    process.exitCode = exitCode;
  } },
  { aliases: ['rollback', 'rb'], handler: (ctx) => rollbackCommand(ctx.args) },
  { aliases: ['skill'], handler: (ctx) => skillCommand(ctx.args, ctx.parseSkillsDir, ctx.parseStringFlag) },
  { aliases: ['git'], handler: async (ctx) => {
    process.exitCode = await gitCommand(ctx.args.slice(1));
  } },
  { aliases: ['skill-inventory', 'inventory', 'inv'], handler: async () => {
    process.exitCode = await skillInventoryCommand();
  } },

  // ---- pure-dispatch with own arg slice ----
  { aliases: ['cartridge'], handler: (ctx) => cartridgeCommand(ctx.args.slice(1)) },
  { aliases: ['keystore'], handler: (ctx) => keystoreCommand(ctx.args.slice(1)) },
  { aliases: ['chip'], handler: async (ctx) => {
    const exitCode = await chipCommand(ctx.args.slice(1));
    process.exitCode = exitCode;
  } },
  { aliases: ['coprocessor', 'cp'], handler: async (ctx) => {
    const exitCode = await runCoprocessorCli(ctx.args.slice(1));
    process.exitCode = exitCode;
  } },
  { aliases: ['eval'], handler: async (ctx) => {
    const exitCode = await evalCommand(ctx.args.slice(1));
    process.exitCode = exitCode;
  } },
  { aliases: ['sync-reserved', 'sync'], handler: () => syncReservedCommand() },
  { aliases: ['test', 't'], handler: (ctx) => testCommand(ctx.args.slice(1)) },
  { aliases: ['mcp-server'], handler: (ctx) => mcpServerCommand(ctx.args.slice(1)) },
  { aliases: ['audit', 'au'], handler: (ctx) => {
    const skillName = ctx.args.filter((a) => !a.startsWith('-'))[1];
    return auditCommand(skillName, {});
  } },
  { aliases: ['reload-embeddings', 're'], handler: async (ctx) => {
    const verbose = ctx.args.includes('--verbose') || ctx.args.includes('-v');
    await reloadEmbeddingsCommand({ verbose });
  } },
  { aliases: ['status', 'st'], handler: async (ctx) => { await statusCommand(ctx.args); } },
  { aliases: ['resolve', 'res'], handler: (ctx) => {
    const skillName = ctx.args.filter((a) => !a.startsWith('-'))[1];
    return resolveCommand(skillName);
  } },
  { aliases: ['budget', 'bg'], handler: (ctx) => {
    const scope = ctx.parseScope(ctx.args);
    return budgetCommand({ skillsDir: getSkillsBasePath(scope) });
  } },
  { aliases: ['budget-estimate', 'be'], handler: (ctx) => {
    const agentArg = ctx.args.find((a) => a.startsWith('--agent='));
    const agent = agentArg?.split('=')[1];
    const scope = ctx.parseScope(ctx.args);
    return budgetEstimateCommand({ agent, skillsDir: getSkillsBasePath(scope) });
  } },
  { aliases: ['teach'], handler: (ctx) => teachCliCommand(ctx.args.slice(1), {}) },
  { aliases: ['co-evolution', 'coevo'], handler: (ctx) => coEvolutionCliCommand(ctx.args.slice(1), {}) },
  { aliases: ['quintessence', 'quint'], handler: (ctx) => quintessenceCliCommand(ctx.args.slice(1), {}) },

  // ---- dynamic-imported per-command modules ----
  { aliases: ['capabilities', 'cap'], handler: async (ctx) => {
    const { capabilitiesCommand } = await import('./commands/capabilities.js');
    return capabilitiesCommand(ctx.args.slice(1));
  } },
  { aliases: ['compress-research', 'cr'], handler: async (ctx) => {
    const { compressResearchCommand } = await import('./commands/compress-research.js');
    return compressResearchCommand(ctx.args.slice(1));
  } },
  { aliases: ['generate-collector', 'gc'], handler: async (ctx) => {
    const { generateCollectorCommand } = await import('./commands/generate-collector.js');
    return generateCollectorCommand(ctx.args.slice(1));
  } },
  { aliases: ['session', 'sess'], handler: async (ctx) => {
    const { sessionCommand } = await import('./commands/session.js');
    return sessionCommand(ctx.args.slice(1));
  } },
  { aliases: ['purge', 'pg'], handler: async (ctx) => {
    const { purgeCommand } = await import('./commands/purge.js');
    return purgeCommand(ctx.args.slice(1));
  } },
  { aliases: ['discover', 'disc'], handler: async (ctx) => {
    const { discoverCommand } = await import('./commands/discover.js');
    return discoverCommand(ctx.args.slice(1));
  } },
  { aliases: ['orchestrator', 'orch'], handler: async (ctx) => {
    const { orchestratorCommand } = await import('./commands/orchestrator.js');
    return orchestratorCommand(ctx.args.slice(1));
  } },
  { aliases: ['workflow', 'wf'], handler: async (ctx) => {
    const { workflowCommand } = await import('./commands/workflow.js');
    return workflowCommand(ctx.args.slice(1));
  } },
  { aliases: ['role', 'rl'], handler: async (ctx) => {
    const { roleCommand } = await import('./commands/role.js');
    return roleCommand(ctx.args.slice(1));
  } },
  { aliases: ['bundle', 'bd'], handler: async (ctx) => {
    const { bundleCommand } = await import('./commands/bundle.js');
    return bundleCommand(ctx.args.slice(1));
  } },
  { aliases: ['event', 'ev'], handler: async (ctx) => {
    const { eventCommand } = await import('./commands/event.js');
    return eventCommand(ctx.args.slice(1));
  } },
  { aliases: ['quality', 'q'], handler: async (ctx) => {
    const { qualityCommand } = await import('./commands/quality.js');
    return qualityCommand(ctx.args.slice(1));
  } },
  { aliases: ['integration', 'int'], handler: async (ctx) => {
    const { integrationConfigCommand } = await import('./commands/integration-config.js');
    return integrationConfigCommand(ctx.args.slice(1));
  } },
  { aliases: ['graph', 'gr'], handler: async (ctx) => {
    const { graphCommand } = await import('./commands/graph.js');
    return graphCommand(ctx.args.slice(1));
  } },
  { aliases: ['impact', 'imp'], handler: async (ctx) => {
    const { impactCommand } = await import('./commands/impact.js');
    return impactCommand(ctx.args.slice(1));
  } },
  { aliases: ['dashboard', 'db'], handler: async (ctx) => {
    const { dashboardCommand } = await import('./commands/dashboard.js');
    return dashboardCommand(ctx.args.slice(1));
  } },
  { aliases: ['gsd-init', 'gi'], handler: async (ctx) => {
    const { gsdInitCommand } = await import('./commands/gsd-init.js');
    return gsdInitCommand(ctx.args.slice(1));
  } },
  { aliases: ['advise-parallelization', 'ap'], handler: async (ctx) => {
    const { adviseParallelizationCommand } = await import('./commands/advise-parallelization.js');
    return adviseParallelizationCommand(ctx.args.slice(1));
  } },
  { aliases: ['predict-next', 'pn'], handler: async (ctx) => {
    const { predictNextCommand } = await import('./commands/predict-next.js');
    return predictNextCommand(ctx.args.slice(1));
  } },
  { aliases: ['terminal', 'term'], handler: async (ctx) => {
    const { terminalCommand } = await import('./commands/terminal.js');
    return terminalCommand(ctx.args.slice(1));
  } },
  { aliases: ['plane-status', 'ps'], handler: async (ctx) => {
    const { planeStatusCommand } = await import('./commands/plane-status.js');
    return planeStatusCommand(ctx.args.slice(1));
  } },
  { aliases: ['project', 'proj'], handler: async (ctx) => {
    const { projectCommand } = await import('../fs/commands/project.js');
    return projectCommand(ctx.args.slice(1));
  } },
  { aliases: ['pack'], handler: async (ctx) => {
    const { packCommand } = await import('../fs/commands/pack.js');
    return packCommand(ctx.args.slice(1));
  } },
  { aliases: ['contrib'], handler: async (ctx) => {
    const { contribCommand } = await import('../fs/commands/contrib.js');
    return contribCommand(ctx.args.slice(1));
  } },
  { aliases: ['www'], handler: async (ctx) => {
    const { wwwCommand } = await import('../fs/commands/www.js');
    return wwwCommand(ctx.args.slice(1));
  } },
  { aliases: ['output-structure', 'os'], handler: async (ctx) => {
    const { outputStructureCommand } = await import('../output-structure/cli.js');
    return outputStructureCommand(ctx.args.slice(1));
  } },
  { aliases: ['tractability', 'tract'], handler: async (ctx) => {
    const { tractabilityCommand } = await import('../tractability/cli.js');
    return tractabilityCommand(ctx.args.slice(1));
  } },
  { aliases: ['representation-audit', 'rep-audit'], handler: async (ctx) => {
    const { representationAuditCommand } = await import('../representation-audit/cli.js');
    return representationAuditCommand(ctx.args.slice(1));
  } },
  { aliases: ['drift'], handler: async (ctx) => {
    const { driftCommand } = await import('../drift/cli.js');
    return driftCommand(ctx.args.slice(1));
  } },
  { aliases: ['model-affinity', 'aff'], handler: async (ctx) => {
    const { modelAffinityCommand } = await import('../model-affinity/cli.js');
    return modelAffinityCommand(ctx.args.slice(1));
  } },
  { aliases: ['ab', 'ab-test'], handler: async (ctx) => {
    const { abCommand } = await import('../ab-harness/cli.js');
    return abCommand(ctx.args.slice(1));
  } },
  { aliases: ['help', '-h', '--help'], handler: async () => {
    printHelp();
  } },

  // ---- inline-arg-parsing cases (formerly in cli.ts switch) ----
  { aliases: ['validate', 'v'], handler: (ctx) => {
    const scope = ctx.parseScope(ctx.args);
    const isAll = ctx.args.includes('--all') || ctx.args.includes('-a');
    const skillArgs = ctx.args.slice(1).filter((a) => !a.startsWith('-'));
    const skillName = skillArgs[0];
    return validateCommand(isAll ? undefined : skillName, { all: isAll, skillsDir: getSkillsBasePath(scope) });
  } },
  { aliases: ['detect-conflicts', 'conflicts', 'dc'], handler: async (ctx) => {
    if (ctx.args.includes('--help') || ctx.args.includes('-h')) {
      return detectConflictsCommand('--help', {});
    }
    const scope = ctx.parseScope(ctx.args);
    const threshold = parseThreshold(ctx.args);
    const quiet = ctx.args.includes('--quiet') || ctx.args.includes('-q');
    const json = ctx.args.includes('--json');
    const skillArgs = ctx.args.slice(1).filter((a) => !a.startsWith('-'));
    const skillName = skillArgs[0];
    return detectConflictsCommand(skillName, { threshold, quiet, json, skillsDir: getSkillsBasePath(scope) });
  } },
  { aliases: ['score-activation', 'sa', 'score'], handler: async (ctx) => {
    if (ctx.args.includes('--help') || ctx.args.includes('-h')) {
      return scoreActivationCommand('--help', {});
    }
    const scope = ctx.parseScope(ctx.args);
    const skillArgs = ctx.args.slice(1).filter((a) => !a.startsWith('-'));
    const skillName = skillArgs[0];
    return scoreActivationCommand(skillName, {
      all: ctx.args.includes('--all') || ctx.args.includes('-a'),
      verbose: ctx.args.includes('--verbose') || ctx.args.includes('-v'),
      quiet: ctx.args.includes('--quiet') || ctx.args.includes('-q'),
      json: ctx.args.includes('--json'),
      llm: ctx.args.includes('--llm'),
      skillsDir: getSkillsBasePath(scope),
    });
  } },
  { aliases: ['simulate', 'sim'], handler: async (ctx) => {
    if (ctx.args.includes('--help') || ctx.args.includes('-h')) {
      console.log(simulateHelp());
      return;
    }
    const scope = ctx.parseScope(ctx.args);
    const thresholdArg = ctx.args.find((a) => a.startsWith('--threshold='));
    const threshold = thresholdArg ? parseFloat(thresholdArg.split('=')[1]) : undefined;
    const batchArg = ctx.args.find((a) => a.startsWith('--batch='));
    const batch = batchArg?.split('=')[1];
    const promptArgs = ctx.args.filter(
      (a) => !a.startsWith('--') && !a.startsWith('-') && a !== 'simulate' && a !== 'sim',
    );
    await simulateCommand(promptArgs, {
      scope,
      verbose: ctx.args.includes('--verbose') || ctx.args.includes('-v'),
      threshold,
      json: ctx.args.includes('--json'),
      batch,
    });
  } },
  { aliases: ['critique', 'crit'], handler: async (ctx) => {
    if (ctx.args.includes('--help') || ctx.args.includes('-h')) {
      return critiqueCommand(undefined, {});
    }
    const scope = ctx.parseScope(ctx.args);
    const skillArgs = ctx.args.slice(1).filter((a) => !a.startsWith('-'));
    const skillName = skillArgs[0];
    const maxIterArg = ctx.args.find((a) => a.startsWith('--max-iter'));
    const maxIter = maxIterArg
      ? parseInt(
          maxIterArg.includes('=')
            ? maxIterArg.split('=')[1]!
            : ctx.args[ctx.args.indexOf(maxIterArg) + 1]!,
          10,
        )
      : undefined;
    return critiqueCommand(skillName, {
      skillsDir: ctx.parseSkillsDir(ctx.args, scope),
      maxIter: !isNaN(maxIter!) ? maxIter : undefined,
      checkExternal: ctx.args.includes('--check-external'),
      mock: ctx.args.includes('--mock'),
    });
  } },
  { aliases: ['test-triggering'], handler: async (ctx) => {
    const scope = ctx.parseScope(ctx.args);
    const skillName = ctx.args.slice(1).filter((a) => !a.startsWith('-'))[0];
    const { testTriggeringCommand } = await import('./commands/test-triggering.js');
    return testTriggeringCommand(skillName, {
      skillsDir: ctx.parseSkillsDir(ctx.args, scope),
      mock: ctx.args.includes('--mock'),
      overrideTriggering: ctx.parseStringFlag(ctx.args, '--override-triggering'),
    });
  } },
  { aliases: ['history', 'hist'], handler: async (ctx) => {
    const skillName = ctx.args[1];
    if (!skillName) {
      p.log.error('Usage: skill-creator history <skill-name>');
      return 1;
    }
    const versionManager = new VersionManager();
    const history = await versionManager.getHistory(skillName);
    if (history.length === 0) {
      p.log.info(`No version history for '${skillName}'.`);
      p.log.message('The skill may not be tracked in git yet.');
      return 0;
    }
    p.log.message('');
    p.log.message(pc.bold(`Version History for '${skillName}':`));
    for (const version of history) {
      const date = version.date.toLocaleDateString();
      const versionLabel = version.version ? `v${version.version}` : '';
      p.log.message(`  ${version.shortHash} ${date} ${versionLabel}`);
      p.log.message(pc.dim(`    ${version.message}`));
    }
    return 0;
  } },
  { aliases: ['calibrate', 'cal'], handler: async (ctx) => {
    if (ctx.args.includes('--help') || ctx.args.includes('-h')) {
      console.log(calibrateHelp());
      return;
    }
    return calibrateCommand(ctx.args.slice(1));
  } },
  { aliases: ['benchmark', 'bench'], handler: async (ctx) => {
    if (ctx.args.includes('--help') || ctx.args.includes('-h')) {
      console.log(calibrateHelp());
      return;
    }
    return calibrateCommand(['benchmark', ...ctx.args.slice(1)]);
  } },
  { aliases: ['config', 'cfg'], handler: async (ctx) => {
    const subcommand = ctx.args[1];
    const subArgs = ctx.args.slice(2);
    switch (subcommand) {
      case 'validate':
      case 'v': {
        const { configValidateCommand } = await import('./commands/config-validate.js');
        return configValidateCommand(subArgs);
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
        return 0;
    }
  } },
  { aliases: ['publish', 'pub'], handler: async (ctx) => {
    const scope = ctx.parseScope(ctx.args);
    if (ctx.args.includes('--help') || ctx.args.includes('-h')) {
      return publishCommand(undefined, {});
    }
    const skillArgs = ctx.args.slice(1).filter((a) => !a.startsWith('-'));
    const skillName = skillArgs[0];
    const outputIdx = ctx.args.findIndex((a) => a === '--output' || a === '-o');
    const output = outputIdx >= 0 ? ctx.args[outputIdx + 1] : undefined;
    return publishCommand(skillName, {
      skillsDir: ctx.parseSkillsDir(ctx.args, scope),
      output,
      overrideCritique: ctx.parseStringFlag(ctx.args, '--override-critique'),
      overrideTriggering: ctx.parseStringFlag(ctx.args, '--override-triggering'),
    });
  } },
  { aliases: ['install', 'inst'], handler: async (ctx) => {
    const scope = ctx.parseScope(ctx.args);
    if (ctx.args.includes('--help') || ctx.args.includes('-h')) {
      return installCommand(undefined, {});
    }
    const installArgs = ctx.args.slice(1).filter((a) => !a.startsWith('-'));
    const source = installArgs[0];
    return installCommand(source, { skillsDir: getSkillsBasePath(scope) });
  } },
  { aliases: ['export', 'ex'], handler: async (ctx) => {
    const { exportCommand } = await import('./commands/export.js');
    const scope = ctx.parseScope(ctx.args);
    const portable = ctx.args.includes('--portable');
    const platformArg = ctx.args.find((a) => a.startsWith('--platform='));
    const platformArgIdx = ctx.args.indexOf('--platform');
    const platform = platformArg
      ? platformArg.split('=')[1]
      : platformArgIdx >= 0
      ? ctx.args[platformArgIdx + 1]
      : undefined;
    const outputArg = ctx.args.find((a) => a.startsWith('--output=') || a.startsWith('-o='));
    const outputArgIdx = ctx.args.findIndex((a) => a === '--output' || a === '-o');
    const output = outputArg
      ? outputArg.split('=')[1]
      : outputArgIdx >= 0
      ? ctx.args[outputArgIdx + 1]
      : undefined;
    const flagValues = new Set([platform, output].filter(Boolean));
    const skillName = ctx.args.slice(1).find((a) => !a.startsWith('-') && !flagValues.has(a));
    return exportCommand(skillName, { portable, platform, output, skillsDir: getSkillsBasePath(scope) });
  } },
  { aliases: ['sensoria'], handler: async (ctx) => {
    const scope = ctx.parseScope(ctx.args);
    const { skillStore: scopedStore } = createScopedStoreAndIndex(scope);
    const positional = ctx.args.slice(1).filter((a) => !a.startsWith('-'));
    const skillName = positional[0];
    const minStr = ctx.parseStringFlag(ctx.args, '--min');
    const maxStr = ctx.parseStringFlag(ctx.args, '--max');
    const pointsStr = ctx.parseStringFlag(ctx.args, '--points');
    return sensoriaCommand(
      ctx.args.includes('--help') || ctx.args.includes('-h') ? '--help' : skillName,
      {
        format: ctx.parseStringFlag(ctx.args, '--format'),
        min: minStr !== undefined ? Number(minStr) : undefined,
        max: maxStr !== undefined ? Number(maxStr) : undefined,
        points: pointsStr !== undefined ? Number(pointsStr) : undefined,
        tachyphylaxis: ctx.args.includes('--tachyphylaxis'),
        quiet: ctx.args.includes('--quiet') || ctx.args.includes('-q'),
        settingsPath: ctx.parseStringFlag(ctx.args, '--settings'),
      },
      { skillStore: scopedStore },
    );
  } },
];

export function lookup(command: string | undefined): CommandHandler | undefined {
  if (!command) return undefined;
  for (const entry of REGISTRY) {
    if (entry.aliases.includes(command)) return entry.handler;
  }
  return undefined;
}

// Suppress unused-warning: createStores + createApplicationContext are
// imported for symmetry with cli.ts; commands that need them call them
// directly inside their own handlers.
void createStores;
void createApplicationContext;
