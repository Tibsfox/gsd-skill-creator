#!/usr/bin/env node
import { createRequire } from 'node:module';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { createStores, createApplicationContext } from './index.js';
import { createSkillWorkflow } from './workflows/create-skill-workflow.js';
import { listSkillsWorkflow, parseScopeFilter } from './workflows/list-skills-workflow.js';
import { searchSkillsWorkflow } from './workflows/search-skills-workflow.js';
import { migrateCommand } from './cli/commands/migrate.js';
import { migrateAgentCommand, listAgentsInDir } from './cli/commands/migrate-agent.js';
import { validateAgentFrontmatter } from './validation/agent-validation.js';
import { validateCommand } from './cli/commands/validate.js';
import { detectConflictsCommand } from './cli/commands/detect-conflicts.js';
import { scoreActivationCommand } from './cli/commands/score-activation.js';
import { syncReservedCommand } from './cli/commands/sync-reserved.js';
import { budgetCommand } from './cli/commands/budget.js';
import { budgetEstimateCommand } from './cli/commands/budget-estimate.js';
import { resolveCommand } from './cli/commands/resolve.js';
import { reloadEmbeddingsCommand } from './cli/commands/reload-embeddings.js';
import { testCommand } from './cli/commands/test.js';
import { simulateCommand, simulateHelp } from './cli/commands/simulate.js';
import { calibrateCommand, calibrateHelp } from './cli/commands/calibrate.js';
import { mcpServerCommand } from './cli/commands/mcp-server.js';
import { publishCommand } from './cli/commands/publish.js';
import { installCommand } from './cli/commands/install.js';
import { statusCommand } from './cli/commands/status.js';
import { auditCommand } from './cli/commands/audit.js';
import { SuggestionManager } from './detection/index.js';
import { FeedbackStore, RefinementEngine, VersionManager } from './learning/index.js';
import { parseScope, getSkillsBasePath, type SkillScope } from './types/scope.js';
import { SkillStore } from './storage/skill-store.js';
import { SkillIndex } from './storage/skill-index.js';

/**
 * Create skill store and index for a specific scope.
 */
function createScopedStoreAndIndex(scope: SkillScope) {
  const skillsDir = getSkillsBasePath(scope);
  const skillStore = new SkillStore(skillsDir);
  const skillIndex = new SkillIndex(skillStore, skillsDir);
  return { skillStore, skillIndex, skillsDir };
}

/**
 * Parse threshold value from command-line arguments.
 * Looks for --threshold=N format.
 */
function parseThreshold(args: string[]): number | undefined {
  const thresholdArg = args.find(a => a.startsWith('--threshold='));
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

  switch (command) {
    case 'create':
    case 'c': {
      const scope = parseScope(args);
      const { skillStore: scopedStore } = createScopedStoreAndIndex(scope);
      await createSkillWorkflow(scopedStore, scope);
      break;
    }

    case 'list':
    case 'ls': {
      const scopeFilter = parseScopeFilter(args);
      await listSkillsWorkflow(skillIndex, { scopeFilter });
      break;
    }

    case 'search':
    case 's': {
      const allScopes = args.includes('--all') || args.includes('-a');
      const dirsFlag = args.find(a => a.startsWith('--dirs='));
      const pluginDirs = dirsFlag ? dirsFlag.slice('--dirs='.length).split(',') : undefined;
      await searchSkillsWorkflow(skillIndex, { allScopes, pluginDirs });
      break;
    }

    case 'migrate':
    case 'mg': {
      const scope = parseScope(args);
      const skillName = args.filter(a => !a.startsWith('-'))[1];
      await migrateCommand(skillName, { skillsDir: getSkillsBasePath(scope) });
      break;
    }

    case 'validate':
    case 'v': {
      const scope = parseScope(args);
      const isAll = args.includes('--all') || args.includes('-a');
      // Filter out flags to get skill name
      const skillArgs = args.slice(1).filter(a => !a.startsWith('-'));
      const skillName = skillArgs[0];
      const exitCode = await validateCommand(
        isAll ? undefined : skillName,
        { all: isAll, skillsDir: getSkillsBasePath(scope) }
      );
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'detect-conflicts':
    case 'conflicts':
    case 'dc': {
      // Handle help flag specially
      if (args.includes('--help') || args.includes('-h')) {
        const exitCode = await detectConflictsCommand('--help', {});
        break;
      }
      const scope = parseScope(args);
      const threshold = parseThreshold(args);
      const quiet = args.includes('--quiet') || args.includes('-q');
      const json = args.includes('--json');
      const skillArgs = args.slice(1).filter(a => !a.startsWith('-'));
      const skillName = skillArgs[0];

      const exitCode = await detectConflictsCommand(skillName, {
        threshold,
        quiet,
        json,
        skillsDir: getSkillsBasePath(scope),
      });
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'score-activation':
    case 'sa':
    case 'score': {
      // Handle help flag specially
      if (args.includes('--help') || args.includes('-h')) {
        const exitCode = await scoreActivationCommand('--help', {});
        break;
      }
      const scope = parseScope(args);
      const all = args.includes('--all') || args.includes('-a');
      const verbose = args.includes('--verbose') || args.includes('-v');
      const quiet = args.includes('--quiet') || args.includes('-q');
      const json = args.includes('--json');
      const llm = args.includes('--llm');
      const skillArgs = args.slice(1).filter(a => !a.startsWith('-'));
      const skillName = skillArgs[0];

      const exitCode = await scoreActivationCommand(skillName, {
        all,
        verbose,
        quiet,
        json,
        llm,
        skillsDir: getSkillsBasePath(scope),
      });
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'sync-reserved':
    case 'sync': {
      const exitCode = await syncReservedCommand();
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'test':
    case 't': {
      const subArgs = args.slice(1);
      const exitCode = await testCommand(subArgs);
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'simulate':
    case 'sim': {
      // Handle help flag specially
      if (args.includes('--help') || args.includes('-h')) {
        console.log(simulateHelp());
        break;
      }

      const scope = parseScope(args);
      const verbose = args.includes('--verbose') || args.includes('-v');
      const json = args.includes('--json');

      const thresholdArg = args.find(a => a.startsWith('--threshold='));
      const threshold = thresholdArg ? parseFloat(thresholdArg.split('=')[1]) : undefined;

      const batchArg = args.find(a => a.startsWith('--batch='));
      const batch = batchArg?.split('=')[1];

      // Filter out options and command name to get the prompt
      const promptArgs = args.filter(a =>
        !a.startsWith('--') &&
        !a.startsWith('-') &&
        a !== 'simulate' &&
        a !== 'sim'
      );

      await simulateCommand(promptArgs, { scope, verbose, threshold, json, batch });
      break;
    }

    case 'budget':
    case 'bg': {
      const scope = parseScope(args);
      const exitCode = await budgetCommand({ skillsDir: getSkillsBasePath(scope) });
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'capabilities':
    case 'cap': {
      const { capabilitiesCommand } = await import('./cli/commands/capabilities.js');
      const exitCode = await capabilitiesCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'compress-research':
    case 'cr': {
      const { compressResearchCommand } = await import('./cli/commands/compress-research.js');
      const exitCode = await compressResearchCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'generate-collector':
    case 'gc': {
      const { generateCollectorCommand } = await import('./cli/commands/generate-collector.js');
      const exitCode = await generateCollectorCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'budget-estimate':
    case 'be': {
      const agentArg = args.find(a => a.startsWith('--agent='));
      const agent = agentArg?.split('=')[1];
      const scope = parseScope(args);
      const exitCode = await budgetEstimateCommand({
        agent,
        skillsDir: getSkillsBasePath(scope),
      });
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'delete':
    case 'del':
    case 'rm': {
      const scope = parseScope(args);
      const skillName = args.filter(a => !a.startsWith('-'))[1];

      if (!skillName) {
        p.log.error('Usage: skill-creator delete <skill-name> [--project]');
        process.exit(1);
      }

      const { skillStore: scopedStore } = createScopedStoreAndIndex(scope);
      const exists = await scopedStore.exists(skillName);
      if (!exists) {
        p.log.error(`Skill "${skillName}" not found at ${scope} scope.`);
        process.exit(1);
      }

      // Check for version at other scope
      const otherScope: SkillScope = scope === 'user' ? 'project' : 'user';
      const otherStore = new SkillStore(getSkillsBasePath(otherScope));
      const existsAtOther = await otherStore.exists(skillName);

      // Confirm deletion with scope-aware message
      const confirmMsg = existsAtOther
        ? `Delete "${skillName}" from ${scope} scope? (${otherScope}-level version will become active)`
        : `Delete "${skillName}" from ${scope} scope?`;

      const confirm = await p.confirm({
        message: confirmMsg,
        initialValue: false,
      });

      if (p.isCancel(confirm) || !confirm) {
        p.log.info('Deletion cancelled.');
        process.exit(0);
      }

      await scopedStore.delete(skillName);

      if (existsAtOther) {
        p.log.success(`Deleted "${skillName}" from ${scope} scope.`);
        p.log.message(pc.dim(`The ${otherScope}-level version is now active.`));
      } else {
        p.log.success(`Deleted "${skillName}".`);
      }
      break;
    }

    case 'resolve':
    case 'res': {
      const skillName = args.filter(a => !a.startsWith('-'))[1];
      const exitCode = await resolveCommand(skillName);
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'invoke':
    case 'i': {
      const skillName = args[1];

      if (!skillName) {
        console.log('Usage: skill-creator invoke <skill-name>');
        console.log('');
        console.log('Manually invoke a skill and load it into the session.');
        console.log('');
        console.log('Examples:');
        console.log('  skill-creator invoke typescript-patterns');
        console.log('  skill-creator i react-hooks');
        break;
      }

      const { applicator } = createApplicationContext();
      await applicator.initialize();

      const result = await applicator.invoke(skillName);

      if (result.success) {
        console.log(`Skill '${skillName}' loaded successfully.`);
        console.log('');
        console.log('Token usage:', result.loadResult?.tokenCount ?? 'cached');
        console.log('Remaining budget:', result.loadResult?.remainingBudget ?? 'n/a');
        console.log('');
        console.log('Content preview:');
        console.log('─'.repeat(40));
        const preview = result.content?.slice(0, 500) ?? '';
        console.log(preview + (result.content && result.content.length > 500 ? '...' : ''));
      } else {
        console.error(`Failed to invoke skill: ${result.error}`);
        if (result.loadResult?.reason === 'budget_exceeded') {
          console.log('');
          console.log('Tip: Clear some active skills or increase the token budget.');
        }
      }
      break;
    }

    case 'status':
    case 'st': {
      await statusCommand(args);
      break;
    }

    case 'suggest':
    case 'sg': {
      const manager = new SuggestionManager();

      p.intro('Analyzing patterns...');

      const result = await manager.runDetection();

      if (result.totalPending === 0) {
        p.log.success('No skill suggestions at this time.');
        p.log.message('Keep using Claude Code - suggestions appear when patterns repeat 3+ times.');
        break;
      }

      p.log.info(`Found ${result.newCandidates} new patterns, ${result.totalPending} pending suggestions.`);

      // Interactive review loop
      for (const suggestion of result.suggestions) {
        const candidate = suggestion.candidate;

        p.log.message('');
        p.log.message(pc.bold(`Suggestion: ${candidate.suggestedName}`));
        p.log.message(`Type: ${candidate.type}`);
        p.log.message(`Pattern: ${candidate.pattern}`);
        p.log.message(`Seen: ${candidate.occurrences} times`);
        p.log.message(`Confidence: ${(candidate.confidence * 100).toFixed(0)}%`);

        // Show evidence
        const evidence = candidate.evidence;
        p.log.message('');
        p.log.message(pc.dim('Evidence:'));
        p.log.message(pc.dim(`  First seen: ${new Date(evidence.firstSeen).toLocaleDateString()}`));
        p.log.message(pc.dim(`  Last seen: ${new Date(evidence.lastSeen).toLocaleDateString()}`));
        if (evidence.coOccurringFiles.length > 0) {
          p.log.message(pc.dim(`  Common files: ${evidence.coOccurringFiles.slice(0, 3).join(', ')}`));
        }

        const action = await p.select({
          message: 'What would you like to do?',
          options: [
            { value: 'accept', label: 'Accept - Create this skill', hint: 'Generate skill scaffold' },
            { value: 'preview', label: 'Preview - See skill content', hint: 'Preview before accepting' },
            { value: 'defer', label: 'Defer - Ask me later', hint: 'Re-ask in 7 days' },
            { value: 'dismiss', label: 'Dismiss - Don\'t suggest again', hint: 'Pattern ignored' },
            { value: 'skip', label: 'Skip - Next suggestion', hint: 'Leave pending' },
            { value: 'quit', label: 'Quit - Exit review', hint: 'Remaining stay pending' },
          ],
        });

        if (p.isCancel(action)) {
          p.cancel('Cancelled');
          break;
        }

        if (action === 'quit') {
          p.log.message('Exiting review. Remaining suggestions stay pending.');
          break;
        }

        if (action === 'preview') {
          const preview = manager.previewSkill(candidate);
          p.log.message('');
          p.log.message(pc.bold('Skill Preview:'));
          p.log.message('─'.repeat(50));
          p.log.message(preview.body.slice(0, 800) + (preview.body.length > 800 ? '...' : ''));
          p.log.message('─'.repeat(50));

          // Ask again after preview
          const confirmAction = await p.select({
            message: 'Now what?',
            options: [
              { value: 'accept', label: 'Accept - Create this skill' },
              { value: 'defer', label: 'Defer - Ask me later' },
              { value: 'dismiss', label: 'Dismiss - Don\'t suggest again' },
              { value: 'skip', label: 'Skip - Next suggestion' },
            ],
          });

          if (p.isCancel(confirmAction) || confirmAction === 'skip') {
            continue;
          }

          await processAction(manager, candidate.id, confirmAction as string);
          continue;
        }

        if (action === 'skip') {
          continue;
        }

        await processAction(manager, candidate.id, action as string);
      }

      p.outro('Done reviewing suggestions.');
      break;
    }

    case 'suggestions':
    case 'sgs': {
      const subcommand = args[1];
      const manager = new SuggestionManager();

      switch (subcommand) {
        case 'list':
        case 'ls':
        case undefined: {
          // Default to list
          const stats = await manager.getStats();

          p.log.message('');
          p.log.message(pc.bold('Suggestion Stats:'));
          p.log.message(`  Pending:   ${stats.pending}`);
          p.log.message(`  Deferred:  ${stats.deferred}`);
          p.log.message(`  Accepted:  ${stats.accepted}`);
          p.log.message(`  Dismissed: ${stats.dismissed}`);

          const pending = await manager.getPending();
          if (pending.length > 0) {
            p.log.message('');
            p.log.message(pc.bold('Pending Suggestions:'));
            for (const s of pending) {
              const c = s.candidate;
              const state = s.state === 'deferred' ? pc.yellow('(resurfaced)') : '';
              p.log.message(`  - ${c.suggestedName} ${state}`);
              p.log.message(pc.dim(`    ${c.type}: ${c.pattern} (${c.occurrences}x)`));
            }
            p.log.message('');
            p.log.message(`Run ${pc.cyan('skill-creator suggest')} to review.`);
          }
          break;
        }

        case 'clear': {
          const cleared = await manager.clearDismissed();
          if (cleared > 0) {
            p.log.success(`Cleared ${cleared} dismissed suggestion(s).`);
          } else {
            p.log.info('No dismissed suggestions to clear.');
          }
          break;
        }

        default:
          p.log.error(`Unknown subcommand: ${subcommand}`);
          p.log.message('');
          p.log.message('Usage:');
          p.log.message('  suggestions, sgs         List all suggestions');
          p.log.message('  suggestions list         List all suggestions');
          p.log.message('  suggestions clear        Clear dismissed suggestions');
      }
      break;
    }

    case 'feedback':
    case 'fb': {
      const subcommand = args[1];
      const feedbackStore = new FeedbackStore('.planning/patterns');

      switch (subcommand) {
        case 'list':
        case 'ls': {
          const skillName = args[2];
          if (!skillName) {
            p.log.error('Usage: skill-creator feedback list <skill-name>');
            break;
          }

          const corrections = await feedbackStore.getCorrections(skillName);
          if (corrections.length === 0) {
            p.log.info(`No feedback recorded for '${skillName}'.`);
            break;
          }

          p.log.message('');
          p.log.message(pc.bold(`Feedback for '${skillName}':`));
          for (const fb of corrections.slice(-10)) {
            const date = new Date(fb.timestamp).toLocaleDateString();
            const preview = fb.corrected ? fb.corrected.slice(0, 50) : '';
            p.log.message(`  ${date} - ${fb.type}: ${preview}...`);
          }
          if (corrections.length > 10) {
            p.log.message(pc.dim(`  ... and ${corrections.length - 10} more`));
          }
          break;
        }

        case 'stats':
        case undefined: {
          const count = await feedbackStore.count();
          p.log.message('');
          p.log.message(pc.bold('Feedback Statistics:'));
          p.log.message(`  Total events: ${count}`);
          break;
        }

        default:
          p.log.error(`Unknown subcommand: ${subcommand}`);
          p.log.message('');
          p.log.message('Usage:');
          p.log.message('  feedback, fb              Show feedback stats');
          p.log.message('  feedback list <skill>     List feedback for a skill');
      }
      break;
    }

    case 'refine':
    case 'rf': {
      const skillName = args[1];

      if (!skillName) {
        p.log.error('Usage: skill-creator refine <skill-name>');
        break;
      }

      const feedbackStore = new FeedbackStore('.planning/patterns');
      const { skillStore } = createStores();
      const engine = new RefinementEngine(feedbackStore, skillStore);

      // Check eligibility
      p.intro(`Checking refinement eligibility for '${skillName}'...`);

      const eligibility = await engine.checkEligibility(skillName);

      if (!eligibility.eligible) {
        if (eligibility.reason === 'cooldown') {
          p.log.warn(`Skill is in cooldown. ${eligibility.daysRemaining} days remaining.`);
        } else {
          p.log.warn(`Insufficient feedback. Need ${eligibility.correctionsNeeded} more corrections.`);
        }
        break;
      }

      p.log.success(`Eligible for refinement (${eligibility.correctionCount} corrections).`);

      // Generate suggestion
      const suggestion = await engine.generateSuggestion(skillName);

      if (!suggestion) {
        p.log.info('No consistent patterns found in feedback.');
        break;
      }

      p.log.message('');
      p.log.message(pc.bold('Suggested Changes:'));
      for (const change of suggestion.suggestedChanges) {
        p.log.message(`  ${change.section}: ${change.reason}`);
        p.log.message(pc.dim(`    "${change.original.slice(0, 40)}..." → "${change.suggested.slice(0, 40)}..."`));
      }
      p.log.message(`  Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`);

      // Ask for confirmation
      const confirm = await p.confirm({
        message: 'Apply these refinements?',
      });

      if (p.isCancel(confirm) || !confirm) {
        p.log.info('Refinement cancelled.');
        break;
      }

      // Apply refinement
      const result = await engine.applyRefinement(skillName, suggestion, true);

      if (result.success) {
        p.log.success(`Skill refined to version ${result.newVersion}.`);
      } else {
        p.log.error(`Refinement failed: ${result.error}`);
      }
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

    case 'audit':
    case 'au': {
      const skillName = args.filter(a => !a.startsWith('-'))[1];
      const exitCode = await auditCommand(skillName, {});
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'rollback':
    case 'rb': {
      const skillName = args[1];
      const targetHash = args[2];

      if (!skillName) {
        p.log.error('Usage: skill-creator rollback <skill-name> [hash]');
        break;
      }

      const versionManager = new VersionManager();
      const history = await versionManager.getHistory(skillName);

      if (history.length === 0) {
        p.log.error(`No version history for '${skillName}'.`);
        break;
      }

      let selectedHash = targetHash;

      if (!selectedHash) {
        // Interactive selection
        const selected = await p.select({
          message: 'Select version to rollback to:',
          options: history.map(v => ({
            value: v.hash,
            label: `${v.shortHash} - ${v.date.toLocaleDateString()}`,
            hint: v.message.slice(0, 50),
          })),
        });

        if (p.isCancel(selected)) {
          p.cancel('Cancelled');
          break;
        }

        selectedHash = selected as string;
      }

      // Confirm rollback
      const confirm = await p.confirm({
        message: `Rollback '${skillName}' to ${selectedHash.slice(0, 7)}?`,
      });

      if (p.isCancel(confirm) || !confirm) {
        p.log.info('Rollback cancelled.');
        break;
      }

      const result = await versionManager.rollback(skillName, selectedHash);

      if (result.success) {
        p.log.success(`Rolled back to ${selectedHash.slice(0, 7)}.`);
        p.log.message(`Commit: ${result.message}`);
      } else {
        p.log.error(`Rollback failed: ${result.error}`);
      }
      break;
    }

    case 'agents':
    case 'ag': {
      const subcommand = args[1];
      const { skillStore } = createStores();
      const { AgentSuggestionManager } = await import('./agents/index.js');
      const manager = new AgentSuggestionManager('.planning/patterns', skillStore);
      const matter = await import('gray-matter');

      switch (subcommand) {
        case 'suggest':
        case 'sg': {
          p.intro('Analyzing skill co-activations...');

          const result = await manager.analyze();

          if (result.totalPending === 0) {
            p.log.success('No agent suggestions at this time.');
            p.log.message('Keep using skills together - suggestions appear when patterns stabilize.');
            break;
          }

          p.log.info(`Found ${result.newSuggestions} new clusters, ${result.totalPending} pending.`);

          // Interactive review loop
          for (const suggestion of result.suggestions) {
            const cluster = suggestion.cluster;

            p.log.message('');
            p.log.message(pc.bold(`Agent Suggestion: ${cluster.suggestedName}`));
            p.log.message(`Skills: ${cluster.skills.join(', ')}`);
            p.log.message(`Co-activation score: ${(cluster.coActivationScore * 100).toFixed(0)}%`);
            p.log.message(`Stable for: ${cluster.stabilityDays} days`);

            const action = await p.select({
              message: 'What would you like to do?',
              options: [
                { value: 'accept', label: 'Accept - Create this agent' },
                { value: 'preview', label: 'Preview - See agent content' },
                { value: 'defer', label: 'Defer - Ask me later' },
                { value: 'dismiss', label: 'Dismiss - Don\'t suggest again' },
                { value: 'skip', label: 'Skip - Next suggestion' },
                { value: 'quit', label: 'Quit - Exit review' },
              ],
            });

            if (p.isCancel(action) || action === 'quit') break;
            if (action === 'skip') continue;

            if (action === 'preview') {
              const preview = await manager.preview(suggestion.id);
              if (preview) {
                p.log.message(pc.bold('Agent Preview:'));
                p.log.message('─'.repeat(50));
                p.log.message(preview.content.slice(0, 1000));
                p.log.message('─'.repeat(50));
              }
              continue;  // Loop back to ask again
            }

            if (action === 'accept') {
              const acceptResult = await manager.accept(suggestion.id);
              if (acceptResult.success) {
                p.log.success(`Created agent: ${acceptResult.agentName}`);
                p.log.message(`File: .claude/agents/${acceptResult.agentName}.md`);
              } else {
                p.log.error(`Failed: ${acceptResult.error}`);
              }
            } else if (action === 'defer') {
              await manager.defer(suggestion.id);
              p.log.info('Deferred for later.');
            } else if (action === 'dismiss') {
              await manager.dismiss(suggestion.id);
              p.log.info('Dismissed.');
            }
          }

          p.outro('Done reviewing agent suggestions.');
          break;
        }

        case 'validate':
        case 'v': {
          // Validate all agent files for format issues
          const agentsDir = '.claude/agents';
          const agents = await listAgentsInDir(agentsDir);

          if (agents.length === 0) {
            p.log.info(`No agents found in ${agentsDir}`);
            break;
          }

          const { readFile } = await import('fs/promises');
          const { join } = await import('path');

          p.log.message(pc.bold('Agent Validation Results:'));
          p.log.message('');

          let validCount = 0;
          let needsMigrationCount = 0;

          for (const agent of agents) {
            try {
              const content = await readFile(agent.path, 'utf-8');
              const parsed = matter.default(content);
              const validation = validateAgentFrontmatter(parsed.data);

              if (agent.needsMigration) {
                needsMigrationCount++;
                p.log.message(`  ${pc.yellow('!')} ${agent.name}`);
                for (const issue of agent.issues) {
                  p.log.message(`    ${pc.dim(issue)}`);
                }
                p.log.message(`    ${pc.dim('Run: skill-creator migrate-agent ' + agent.name)}`);
              } else if (!validation.valid) {
                needsMigrationCount++;
                p.log.message(`  ${pc.red('x')} ${agent.name}`);
                for (const error of validation.errors) {
                  p.log.message(`    ${pc.red(error)}`);
                }
              } else {
                validCount++;
                // Show warnings even for valid agents
                if (validation.warnings.length > 0) {
                  p.log.message(`  ${pc.green('+')} ${agent.name} ${pc.yellow('(warnings)')}`);
                  for (const warning of validation.warnings) {
                    p.log.message(`    ${pc.dim(warning)}`);
                  }
                } else {
                  p.log.message(`  ${pc.green('+')} ${agent.name}`);
                }
              }
            } catch (err) {
              needsMigrationCount++;
              p.log.message(`  ${pc.red('x')} ${agent.name}`);
              p.log.message(`    ${pc.dim('Could not read or parse file')}`);
            }
          }

          p.log.message('');
          p.log.message(pc.bold('Summary:'));
          p.log.message(`  ${pc.green('Valid:')} ${validCount}`);
          if (needsMigrationCount > 0) {
            p.log.message(`  ${pc.yellow('Needs migration:')} ${needsMigrationCount}`);
            p.log.message('');
            p.log.message(`Run ${pc.cyan('skill-creator migrate-agent')} to fix issues.`);
          }
          break;
        }

        case 'list':
        case 'ls': {
          // Show both pending suggestions AND existing agents with validation status
          const agentsDir = '.claude/agents';
          const agents = await listAgentsInDir(agentsDir);

          // Show existing agents first
          if (agents.length > 0) {
            p.log.message(pc.bold('Agents in .claude/agents/:'));

            const valid = agents.filter(a => !a.needsMigration);
            const needsMigration = agents.filter(a => a.needsMigration);

            if (valid.length > 0) {
              for (const a of valid) {
                p.log.message(`  ${pc.green('+')} ${a.name}`);
              }
            }

            if (needsMigration.length > 0) {
              for (const a of needsMigration) {
                p.log.message(`  ${pc.yellow('!')} ${a.name} ${pc.dim('(needs migration)')}`);
              }
            }
            p.log.message('');
          }

          // Show pending suggestions
          const pending = await manager.getPending();
          if (pending.length > 0) {
            p.log.message(pc.bold('Pending Agent Suggestions:'));
            for (const s of pending) {
              p.log.message(`  - ${s.cluster.suggestedName}`);
              p.log.message(pc.dim(`    Skills: ${s.cluster.skills.join(', ')}`));
            }
          } else if (agents.length === 0) {
            p.log.info('No agents found and no pending suggestions.');
            p.log.message('Run skill-creator agents suggest to analyze patterns.');
          }
          break;
        }

        default: {
          // Show help for agents command
          p.log.message('');
          p.log.message(pc.bold('Agent Management:'));
          p.log.message('');
          p.log.message('  The "agents" command manages agent suggestions from skill clusters.');
          p.log.message('  Generated agents use official Claude Code format with comma-separated');
          p.log.message('  tools field.');
          p.log.message('');
          p.log.message(pc.yellow('  Note: User-level agents (~/.claude/agents/) have a known discovery'));
          p.log.message(pc.yellow('  bug (GitHub #11205). Consider using project-level agents instead.'));
          p.log.message('');
          p.log.message('  Subcommands:');
          p.log.message(`    ${pc.cyan('agents suggest')}    Analyze co-activations, suggest agents`);
          p.log.message(`    ${pc.cyan('agents list')}       List agents with validation status`);
          p.log.message(`    ${pc.cyan('agents validate')}   Check all agent files for format issues`);
          p.log.message('');
          p.log.message('  Examples:');
          p.log.message('    skill-creator agents suggest');
          p.log.message('    skill-creator agents list');
          p.log.message('    skill-creator agents validate');
          break;
        }
      }
      break;
    }

    case 'migrate-agent':
    case 'ma': {
      const dryRun = args.includes('--dry-run') || args.includes('-d');
      const agentName = args.filter(a => !a.startsWith('-'))[1];
      const exitCode = await migrateAgentCommand(agentName, { dryRun });
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'reload-embeddings':
    case 're': {
      const verbose = args.includes('--verbose') || args.includes('-v');
      await reloadEmbeddingsCommand({ verbose });
      break;
    }

    case 'calibrate':
    case 'cal': {
      // Handle help flag
      if (args.includes('--help') || args.includes('-h')) {
        console.log(calibrateHelp());
        break;
      }
      const exitCode = await calibrateCommand(args.slice(1));
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'benchmark':
    case 'bench': {
      // Handle help flag
      if (args.includes('--help') || args.includes('-h')) {
        console.log(calibrateHelp());
        break;
      }
      // Route to calibrate command which handles benchmark subcommand
      const exitCode = await calibrateCommand(['benchmark', ...args.slice(1)]);
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      break;
    }

    case 'team':
    case 'tm': {
      const subcommand = args[1];
      const subArgs = args.slice(2);

      switch (subcommand) {
        case 'create':
        case 'c': {
          const { teamCreateCommand } = await import('./cli/commands/team-create.js');
          const exitCode = await teamCreateCommand(subArgs);
          if (exitCode !== 0) process.exit(exitCode);
          break;
        }

        case 'list':
        case 'l': {
          const { teamListCommand } = await import('./cli/commands/team-list.js');
          const exitCode = await teamListCommand(subArgs);
          if (exitCode !== 0) process.exit(exitCode);
          break;
        }

        case 'validate':
        case 'v': {
          const { teamValidateCommand } = await import('./cli/commands/team-validate.js');
          const exitCode = await teamValidateCommand(subArgs);
          if (exitCode !== 0) process.exit(exitCode);
          break;
        }

        case 'spawn':
        case 'sp': {
          const { teamSpawnCommand } = await import('./cli/commands/team-spawn.js');
          const exitCode = await teamSpawnCommand(subArgs);
          if (exitCode !== 0) process.exit(exitCode);
          break;
        }

        case 'status':
        case 's': {
          const { teamStatusCommand } = await import('./cli/commands/team-status.js');
          const exitCode = await teamStatusCommand(subArgs);
          if (exitCode !== 0) process.exit(exitCode);
          break;
        }

        case 'estimate':
        case 'e': {
          const { teamEstimateCommand } = await import('./cli/commands/team-estimate.js');
          const exitCode = await teamEstimateCommand(subArgs);
          if (exitCode !== 0) process.exit(exitCode);
          break;
        }

        default:
          showTeamHelp();
      }
      break;
    }

    case 'session':
    case 'sess': {
      const { sessionCommand } = await import('./cli/commands/session.js');
      const exitCode = await sessionCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'purge':
    case 'pg': {
      const { purgeCommand } = await import('./cli/commands/purge.js');
      const exitCode = await purgeCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'discover':
    case 'disc': {
      const { discoverCommand } = await import('./cli/commands/discover.js');
      const exitCode = await discoverCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'orchestrator':
    case 'orch': {
      const { orchestratorCommand } = await import('./cli/commands/orchestrator.js');
      const exitCode = await orchestratorCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'workflow':
    case 'wf': {
      const { workflowCommand } = await import('./cli/commands/workflow.js');
      const exitCode = await workflowCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'role':
    case 'rl': {
      const { roleCommand } = await import('./cli/commands/role.js');
      const exitCode = await roleCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'bundle':
    case 'bd': {
      const { bundleCommand } = await import('./cli/commands/bundle.js');
      const exitCode = await bundleCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'event':
    case 'ev': {
      const { eventCommand } = await import('./cli/commands/event.js');
      const exitCode = await eventCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'quality':
    case 'q': {
      const { qualityCommand } = await import('./cli/commands/quality.js');
      const exitCode = await qualityCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'integration':
    case 'int': {
      const subcommand = args[1];
      const subArgs = args.slice(1);

      // If subcommand is a known sub (validate, show), pass from args[1] onward
      // If it's a flag (--help, --json), pass all args after 'integration'
      const { integrationConfigCommand } = await import('./cli/commands/integration-config.js');
      const exitCode = await integrationConfigCommand(subArgs);
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

    case 'graph':
    case 'gr': {
      const { graphCommand } = await import('./cli/commands/graph.js');
      const exitCode = await graphCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'impact':
    case 'imp': {
      const { impactCommand } = await import('./cli/commands/impact.js');
      const exitCode = await impactCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'dashboard':
    case 'db': {
      const { dashboardCommand } = await import('./cli/commands/dashboard.js');
      const exitCode = await dashboardCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'mcp-server': {
      const exitCode = await mcpServerCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'publish':
    case 'pub': {
      const scope = parseScope(args);
      // Handle help flag
      if (args.includes('--help') || args.includes('-h')) {
        await publishCommand(undefined, {});
        break;
      }
      const skillArgs = args.slice(1).filter(a => !a.startsWith('-'));
      const skillName = skillArgs[0];
      // Parse --output flag
      const outputIdx = args.findIndex(a => a === '--output' || a === '-o');
      const output = outputIdx >= 0 ? args[outputIdx + 1] : undefined;
      const exitCode = await publishCommand(skillName, {
        skillsDir: getSkillsBasePath(scope),
        output,
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
      const installArgs = args.slice(1).filter(a => !a.startsWith('-'));
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
      const platformArg = args.find(a => a.startsWith('--platform='));
      const platformArgIdx = args.indexOf('--platform');
      const platform = platformArg
        ? platformArg.split('=')[1]
        : (platformArgIdx >= 0 ? args[platformArgIdx + 1] : undefined);
      const outputArg = args.find(a => a.startsWith('--output=') || a.startsWith('-o='));
      const outputArgIdx = args.findIndex(a => a === '--output' || a === '-o');
      const output = outputArg
        ? outputArg.split('=')[1]
        : (outputArgIdx >= 0 ? args[outputArgIdx + 1] : undefined);
      // Get skill name: first positional arg after 'export' that isn't a flag or flag value
      const flagValues = new Set([platform, output].filter(Boolean));
      const skillName = args.slice(1).find(a => !a.startsWith('-') && !flagValues.has(a));
      const exitCode = await exportCommand(skillName, {
        portable,
        platform,
        output,
        skillsDir: getSkillsBasePath(scope),
      });
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'advise-parallelization':
    case 'ap': {
      const { adviseParallelizationCommand } = await import('./cli/commands/advise-parallelization.js');
      const exitCode = await adviseParallelizationCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'terminal':
    case 'term': {
      const { terminalCommand } = await import('./cli/commands/terminal.js');
      const exitCode = await terminalCommand(args.slice(1));
      if (exitCode !== 0) process.exit(exitCode);
      break;
    }

    case 'help':
    case '-h':
    case '--help':
      showHelp();
      break;

    default:
      if (command) {
        p.log.error(`Unknown command: ${command}`);
      }
      showHelp();
      process.exit(command ? 1 : 0);
  }
}

async function processAction(
  manager: SuggestionManager,
  candidateId: string,
  action: string
): Promise<void> {
  switch (action) {
    case 'accept': {
      const result = await manager.accept(candidateId);
      if (result.success) {
        p.log.success(`Created skill: ${result.skillName}`);
        p.log.message(`Edit at: .claude/skills/${result.skillName}/SKILL.md`);
      } else {
        p.log.error(`Failed: ${result.error}`);
      }
      break;
    }
    case 'defer':
      await manager.defer(candidateId);
      p.log.info('Deferred - will ask again in 7 days.');
      break;
    case 'dismiss': {
      const reason = await p.text({
        message: 'Reason for dismissing (optional):',
        placeholder: 'Press Enter to skip',
      });
      await manager.dismiss(candidateId, p.isCancel(reason) ? undefined : reason || undefined);
      p.log.info('Dismissed - won\'t suggest again.');
      break;
    }
  }
}

function showTeamHelp(): void {
  console.log(`
skill-creator team - Manage agent teams

Usage:
  skill-creator team <command> [options]
  skill-creator tm <command> [options]

Commands:
  create, c     Create a new team (interactive wizard or flags)
  list, l       List all teams with member counts
  validate, v   Validate team config(s) with detailed report
  spawn, sp     Check team readiness (agent resolution)
  status, s     Show team details and validation summary
  estimate, e   Show projected token usage and cost

Examples:
  skill-creator team create                    Interactive team creation
  skill-creator tm c --pattern=leader-worker --name=research
  skill-creator team list                      List all teams
  skill-creator tm l --scope=project           List project teams only
  skill-creator team validate my-team          Validate single team
  skill-creator tm v --all                     Validate all teams
  skill-creator team spawn my-team             Check readiness
  skill-creator tm s my-team                   Show team details

Use 'skill-creator team <command> --help' for command-specific help.
`);
}

function showHelp() {
  console.log(`
skill-creator - Manage Claude Code skills

Usage:
  skill-creator <command> [options]

Commands:
  create, c         Create a new skill through guided workflow
  list, ls          List all available skills with metadata
  search, s         Search skills by keyword (--all for cross-directory)
  delete, del, rm   Delete a skill
  resolve, res      Show which version of a skill is active
  validate, v       Validate skill structure and metadata
  detect-conflicts, dc  Detect semantic conflicts between skills
  score-activation, sa  Score skill activation likelihood
  migrate, mg       Migrate legacy flat-file skills to subdirectory format
  migrate-agent, ma Migrate agents with legacy tools format
  sync-reserved     Show/update reserved skill names list
  test, t           Manage skill test cases
  simulate, sim     Predict which skill would activate for a prompt
  budget, bg        Show character budget usage across all skills
  budget-estimate, be  Show token budget estimates per agent profile
  capabilities, cap  Generate or show capability manifest (CAPABILITIES.md)
  compress-research, cr  Compress research files to distilled skill files
  generate-collector, gc  Generate a read-only collector agent
  advise-parallelization, ap  Analyze plan dependencies for parallel execution
  invoke, i         Manually invoke a skill by name
  status, st        Show active skills and token budget
  suggest, sg       Analyze patterns and review skill suggestions
  suggestions, sgs  List/manage skill suggestions
  feedback, fb      View feedback for skills
  refine, rf        Generate and apply skill refinements
  history, hist     View skill version history
  audit, au         Show skill evolution: drift, contradictions, version diffs
  rollback, rb      Rollback skill to previous version
  agents, ag        Manage agent suggestions from skill clusters
  team, tm          Manage agent teams (create, list, validate, spawn, status)
  reload-embeddings, re  Reload embedding model (retry after fallback)
  calibrate, cal    Optimize activation threshold from calibration data
  benchmark, bench  Measure simulator accuracy vs real activation
  discover, disc    Discover skill candidates from session history
  quality, q        Show per-skill health scores (precision, success rate, efficiency)
  graph, gr         Output Mermaid diagram of skill relationships
  impact, imp       Analyze inheritance impact of modifying a skill
  export, ex        Export skill for other platforms (--portable, --platform)
  publish, pub      Package a skill as .tar.gz for distribution
  install, inst     Install a skill from local file or remote URL
  mcp-server        Start MCP server for skill browsing/installation
  session, sess     Manage session continuity (save, restore, handoff)
  purge, pg         Compact and clean observation JSONL files
  orchestrator, orch  GSD orchestrator (discover, state, classify, lifecycle)
  workflow, wf      Manage skill workflows (create, run, list, status)
  role, rl          Manage skill roles (create, list)
  bundle, bd        Manage work bundles (create, list, activate, deactivate, status)
  integration, int  Manage skill-creator integration config (validate, show)
  config, cfg       Manage GSD configuration (validate)
  event, ev         Manage skill events (list, emit, consume, suggest, expire)
  dashboard, db     Generate GSD Planning Docs Dashboard from .planning/
  terminal, term    Manage Wetty terminal server (start, stop, status, restart)
  help, -h          Show this help message
  --version, -V     Show version information

Scope Options:
  Skills can exist at two scopes:
    - User-level:    ~/.claude/skills/    (default, shared across projects)
    - Project-level: .claude/skills/      (project-specific)

  Project-level skills take precedence over user-level skills with the
  same name. This allows project-specific customization.

  --project, -p     Target project-level scope
                    Without this flag, operations default to user-level
                    Applies to: create, delete, validate, migrate, budget

  --scope=<value>   Filter list output by scope
                    Values: user, project, all (default: all)
                    Only applies to 'list' command

  Examples:
    skill-creator create              # Create at ~/.claude/skills/
    skill-creator create --project    # Create at .claude/skills/
    skill-creator list --scope=user   # Show only user-level skills
    skill-creator delete my-skill -p  # Delete project-level version
    skill-creator resolve my-skill    # Show which version is active

Team Management:
  The 'team' command manages agent teams -- multi-agent configurations
  for coordinated work. Teams use pattern templates (leader-worker,
  pipeline, swarm) and validate member resolution, tool overlap,
  and role coherence.

  Run 'team create' for an interactive wizard, or use flags for
  scripted team creation. Run 'team validate --all' to check all
  teams at once.

Pattern Detection:
  The suggest command analyzes your Claude Code usage patterns and
  proposes skills when it detects recurring workflows (3+ occurrences).

  Run 'suggest' periodically to discover automation opportunities.

Activation Scoring:
  The score-activation command predicts how reliably a skill will
  auto-activate based on its description quality. Scores range from
  0-100 with labels: Reliable (90+), Likely (70-89), Uncertain (50-69),
  Unlikely (<50).

  Run 'score-activation my-skill' for detailed factor breakdown and
  suggestions for improvement. Run '--all' to see scores for all skills.

Learning Loop:
  Skills can be refined based on user corrections. After 3+ corrections
  are recorded, run 'refine' to generate bounded refinement suggestions.

  Refinements are bounded:
    - Requires 3+ corrections before suggesting changes
    - Maximum 20% content change per refinement
    - 7-day cooldown between refinements
    - User confirmation always required

  Use 'rollback' to revert any skill to a previous version if a
  refinement degrades performance.

Agent Composition:
  The 'agents' command analyzes skill co-activation patterns and
  suggests creating composite agents when skills frequently activate
  together.

  Run 'agents suggest' to detect stable clusters and create agents
  that combine related skills into a single invocation.

  Generated agents follow the official Claude Code agent format:
    - name: lowercase letters, numbers, and hyphens
    - description: when Claude should delegate to this agent
    - tools: comma-separated string (e.g., "Read, Write, Bash")
    - model: optional model alias (sonnet, opus, haiku, inherit)

  Run 'agents validate' to check all agents for format issues.
  Run 'migrate-agent' to fix agents with legacy format.

  Note: User-level agents (~/.claude/agents/) have a known discovery
  bug (GitHub #11205). Consider using project-level agents instead.
  Workarounds: use project-level agents, the /agents UI command, or
  pass agents via --agents CLI flag when starting Claude Code.

Workflow Management:
  The 'workflow' command manages skill workflows -- multi-step
  execution pipelines that compose skills into repeatable processes.
  Workflows are defined as .workflow.yaml files in .claude/workflows/.

  Run 'workflow create' for an interactive wizard, or use --name and
  --steps flags for scripted creation. Run 'workflow run <name>' to
  execute a workflow, and 'workflow status <name>' to check progress.
  Interrupted runs can be resumed with 'workflow run <name> --resume'.

Role Management:
  The 'role' command manages agent roles -- behavioral constraint templates
  that define skills, constraints, tools, and model for agent personas.
  Roles are defined as .role.yaml files in .claude/roles/.

  Roles can extend other roles via the extends: field, inheriting
  constraints additively and tools/model with child-wins semantics.

  Run 'role create' for an interactive wizard, or use --name flag
  for scripted creation. Run 'role list' to see all defined roles.

Bundle Management:
  The 'bundle' command manages work bundles -- groups of skills for
  specific project phases. Bundles are defined as .bundle.yaml files
  in .claude/bundles/.

  Activating a bundle gives required skills priority 10 in token
  budget allocation, while optional skills get priority 1.

  Run 'bundle create' for an interactive wizard, or use --name and
  --skills flags for scripted creation. Run 'bundle activate --name=X'
  to set active bundle. Run 'bundle status' to see current state.

Event Management:
  The 'event' command manages inter-skill communication events.
  Skills declare emits/listens in their frontmatter extension fields.
  Events are logged to .planning/patterns/events.jsonl.
  Use 'event emit' to fire events and 'event suggest' to discover
  potential event connections from co-activation patterns.

Pattern Discovery:
  The 'discover' command scans your Claude Code session history for
  recurring tool sequences and bash command patterns. It ranks
  candidates by frequency, cross-project usage, and recency, then
  lets you interactively select which patterns to generate as skills.

  Options:
    --exclude=<projects>  Skip comma-separated project slugs
    --rescan              Force full rescan (ignore watermarks)

  Run 'discover' periodically as your session history grows.

Test Management:
  The 'test' command manages test cases for skill activation testing.
  Test cases define expected behavior: should the skill activate for
  a given prompt?

  Subcommands:
    test add <skill>       Add a test case (interactive or flags)
    test list <skill>      List test cases for a skill
    test edit <skill> <id> Edit an existing test case
    test delete <skill> <id> Delete a test case

  Examples:
    skill-creator test add my-skill
    skill-creator test add my-skill --prompt="commit my changes" --expected=positive
    skill-creator test list my-skill
    skill-creator test list my-skill --expected=negative
    skill-creator test delete my-skill abc123 --force

Activation Simulation:
  The 'simulate' command predicts which skill would activate for a given
  prompt using semantic similarity. Use it to validate skill descriptions
  and identify potential conflicts.

  Options:
    --scope             Scope: user (default) or project
    --verbose, -v       Show all predictions and trace details
    --batch <file>      Test multiple prompts from file (one per line)
    --threshold <n>     Activation threshold (default: 0.75)
    --json              Output results as JSON

  Examples:
    skill-creator simulate "commit my changes"
    skill-creator sim "deploy to production" --verbose
    skill-creator simulate --batch prompts.txt --json
    skill-creator simulate "test" --scope project --threshold 0.8

Budget Management:
  Claude Code limits skill content to ~15,000 characters per skill and
  ~15,500 characters total. Run 'budget' to see current usage and identify
  large skills that may need optimization.

  Skills exceeding the budget may be silently hidden by Claude Code.

Examples:
  skill-creator create              # Create user-level skill (default)
  skill-creator create --project    # Create project-level skill
  skill-creator delete my-skill     # Delete from user scope
  skill-creator delete my-skill -p  # Delete from project scope
  skill-creator resolve my-skill    # Show which version is active
  skill-creator list                # Show all skills (both scopes)
  skill-creator list --scope=user   # Show only user-level skills
  skill-creator search              # Interactive search
  skill-creator search --all        # Search user, project, and plugin directories
  skill-creator search --all --dirs=/path/to/plugins  # Include custom plugin directory
  skill-creator validate my-skill   # Validate a specific skill
  skill-creator validate --all      # Validate all skills
  skill-creator migrate             # Migrate all legacy skills interactively
  skill-creator migrate my-skill    # Migrate a specific skill
  skill-creator invoke my-skill     # Load a specific skill
  skill-creator status              # Show active skills
  skill-creator suggest             # Analyze patterns, review suggestions
  skill-creator feedback my-skill   # View feedback for a skill
  skill-creator refine my-skill     # Apply refinements
  skill-creator history my-skill    # View version history
  skill-creator rollback my-skill   # Rollback to previous version
  skill-creator agents suggest      # Analyze co-activations, suggest agents
  skill-creator agents list         # List agents with validation status
  skill-creator agents validate     # Check all agents for format issues
  skill-creator budget              # Show budget usage for user scope
  skill-creator budget --project    # Show budget usage for project scope
  skill-creator detect-conflicts    # Scan all skills for conflicts
  skill-creator dc my-skill         # Check one skill against others
  skill-creator dc --threshold=0.90 # Use stricter threshold
  skill-creator dc --json           # JSON output for CI/scripting
  skill-creator score-activation my-skill  # Score single skill
  skill-creator sa --all                   # Score all skills
  skill-creator sa --all --verbose         # With factor breakdown
  skill-creator migrate-agent       # Check all agents for legacy format
  skill-creator migrate-agent my-agent  # Migrate specific agent
  skill-creator ma --dry-run        # Preview changes without writing
  skill-creator team create         # Interactive team creation wizard
  skill-creator tm c --pattern=leader-worker --name=my-team
  skill-creator team list           # List all teams
  skill-creator team validate --all # Validate all teams
  skill-creator team spawn my-team  # Check spawn readiness
  skill-creator tm s my-team        # Show team details
  skill-creator discover              # Scan sessions for patterns
  skill-creator disc --rescan         # Force full rescan
  skill-creator discover --exclude=temp  # Skip specific projects
  skill-creator export --portable my-skill    # Portable agentskills.io output
  skill-creator export --platform cursor my-skill  # Cursor-specific variant
  skill-creator workflow create       # Interactive workflow creation
  skill-creator wf c --name=deploy --steps='[{"id":"lint","skill":"linter"}]'
  skill-creator workflow run deploy   # Run a workflow
  skill-creator wf r deploy --resume  # Resume interrupted run
  skill-creator workflow list         # List all workflows
  skill-creator workflow status deploy # Show run progress
  skill-creator role create            # Interactive role creation
  skill-creator rl c --name=reviewer --constraints="Read only,Never delete"
  skill-creator role list              # List all roles
  skill-creator rl l --pretty          # Human-readable list
  skill-creator bundle create          # Interactive bundle creation
  skill-creator bd c --name=frontend --skills=ts,react
  skill-creator bundle list            # List all bundles
  skill-creator bundle activate --name=frontend  # Activate bundle
  skill-creator bundle deactivate      # Deactivate bundle
  skill-creator bundle status          # Show active bundle
  skill-creator compress-research .planning/phases/58-research-compression/58-RESEARCH.md
  skill-creator cr path/to/research.md --dry-run
  skill-creator cr path/to/research.md --project

Skill Storage:
  User-level skills: ~/.claude/skills/ (shared across projects)
  Project-level skills: .claude/skills/ (project-specific, takes precedence)

  Skills are git-tracked by default. Each skill is a SKILL.md file
  with YAML frontmatter inside a named subdirectory.

Pattern Storage:
  Session observations are stored in .planning/patterns/sessions.jsonl.
  Suggestions are stored in .planning/patterns/suggestions.json.
  Feedback is stored in .planning/patterns/feedback.jsonl.
`);
}

main().catch((err) => {
  p.log.error(err.message);
  process.exit(1);
});
