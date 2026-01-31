#!/usr/bin/env node
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { createStores, createApplicationContext } from './index.js';
import { createSkillWorkflow } from './workflows/create-skill-workflow.js';
import { listSkillsWorkflow } from './workflows/list-skills-workflow.js';
import { searchSkillsWorkflow } from './workflows/search-skills-workflow.js';
import { migrateCommand } from './cli/commands/migrate.js';
import { validateCommand } from './cli/commands/validate.js';
import { syncReservedCommand } from './cli/commands/sync-reserved.js';
import { budgetCommand } from './cli/commands/budget.js';
import { SuggestionManager } from './detection/index.js';
import { FeedbackStore, RefinementEngine, VersionManager } from './learning/index.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const { skillStore, skillIndex } = createStores();

  switch (command) {
    case 'create':
    case 'c':
      await createSkillWorkflow(skillStore);
      break;

    case 'list':
    case 'ls':
      await listSkillsWorkflow(skillIndex);
      break;

    case 'search':
    case 's':
      await searchSkillsWorkflow(skillIndex);
      break;

    case 'migrate':
    case 'mg': {
      const skillName = args[1];
      await migrateCommand(skillName);
      break;
    }

    case 'validate':
    case 'v': {
      const isAll = args.includes('--all') || args.includes('-a');
      // Filter out flags to get skill name
      const skillArgs = args.slice(1).filter(a => !a.startsWith('-'));
      const skillName = skillArgs[0];
      const exitCode = await validateCommand(
        isAll ? undefined : skillName,
        { all: isAll }
      );
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

    case 'budget':
    case 'bg': {
      const exitCode = await budgetCommand();
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
      const { applicator } = createApplicationContext();
      await applicator.initialize();

      console.log(applicator.getActiveDisplay());

      const report = applicator.getReport();
      if (report.flaggedSkills.length > 0) {
        console.log('');
        console.log('Flagged for review (cost > savings):');
        report.flaggedSkills.forEach(name => console.log(`  - ${name}`));
      }
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

        case 'list':
        case 'ls':
        default: {
          const pending = await manager.getPending();
          if (pending.length === 0) {
            p.log.info('No pending agent suggestions.');
            p.log.message('Run skill-creator agents suggest to analyze patterns.');
          } else {
            p.log.message(pc.bold('Pending Agent Suggestions:'));
            for (const s of pending) {
              p.log.message(`  - ${s.cluster.suggestedName}`);
              p.log.message(pc.dim(`    Skills: ${s.cluster.skills.join(', ')}`));
            }
          }
          break;
        }
      }
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

function showHelp() {
  console.log(`
skill-creator - Manage Claude Code skills

Usage:
  skill-creator <command> [options]

Commands:
  create, c         Create a new skill through guided workflow
  list, ls          List all available skills
  search, s         Search skills by keyword
  validate, v       Validate skill structure and metadata
  migrate, mg       Migrate legacy flat-file skills to subdirectory format
  sync-reserved     Show/update reserved skill names list
  budget, bg        Show character budget usage across all skills
  invoke, i         Manually invoke a skill by name
  status, st        Show active skills and token budget
  suggest, sg       Analyze patterns and review skill suggestions
  suggestions, sgs  List/manage skill suggestions
  feedback, fb      View feedback for skills
  refine, rf        Generate and apply skill refinements
  history, hist     View skill version history
  rollback, rb      Rollback skill to previous version
  agents, ag        Manage agent suggestions from skill clusters
  help, -h          Show this help message

Pattern Detection:
  The suggest command analyzes your Claude Code usage patterns and
  proposes skills when it detects recurring workflows (3+ occurrences).

  Run 'suggest' periodically to discover automation opportunities.

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

Budget Management:
  Claude Code limits skill content to ~15,000 characters per skill and
  ~15,500 characters total. Run 'budget' to see current usage and identify
  large skills that may need optimization.

  Skills exceeding the budget may be silently hidden by Claude Code.

Examples:
  skill-creator create              # Start skill creation wizard
  skill-creator list                # Show all skills
  skill-creator search              # Interactive search
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
  skill-creator agents list         # List pending agent suggestions
  skill-creator budget              # Show budget usage across all skills

Skill Storage:
  Skills are stored in .claude/skills/ and are git-tracked by default.
  Each skill is a SKILL.md file with YAML frontmatter.

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
