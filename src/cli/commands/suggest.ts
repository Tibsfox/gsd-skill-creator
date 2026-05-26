import * as p from '@clack/prompts';
import pc from 'picocolors';
import { SuggestionManager } from '../../detection/index.js';

async function processAction(
  manager: SuggestionManager,
  candidateId: string,
  action: string,
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
      p.log.info("Dismissed - won't suggest again.");
      break;
    }
  }
}

export async function suggestCommand(): Promise<number> {
  const manager = new SuggestionManager();

  p.intro('Analyzing patterns...');

  const result = await manager.runDetection();

  if (result.totalPending === 0) {
    p.log.success('No skill suggestions at this time.');
    p.log.message('Keep using Claude Code - suggestions appear when patterns repeat 3+ times.');
    return 0;
  }

  p.log.info(`Found ${result.newCandidates} new patterns, ${result.totalPending} pending suggestions.`);

  for (const suggestion of result.suggestions) {
    const candidate = suggestion.candidate;

    p.log.message('');
    p.log.message(pc.bold(`Suggestion: ${candidate.suggestedName}`));
    p.log.message(`Type: ${candidate.type}`);
    p.log.message(`Pattern: ${candidate.pattern}`);
    p.log.message(`Seen: ${candidate.occurrences} times`);
    p.log.message(`Confidence: ${(candidate.confidence * 100).toFixed(0)}%`);

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
        { value: 'dismiss', label: "Dismiss - Don't suggest again", hint: 'Pattern ignored' },
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

      const confirmAction = await p.select({
        message: 'Now what?',
        options: [
          { value: 'accept', label: 'Accept - Create this skill' },
          { value: 'defer', label: 'Defer - Ask me later' },
          { value: 'dismiss', label: "Dismiss - Don't suggest again" },
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
  return 0;
}

export async function suggestionsCommand(args: string[]): Promise<number> {
  const subcommand = args[1];
  const manager = new SuggestionManager();

  switch (subcommand) {
    case 'list':
    case 'ls':
    case undefined: {
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
      return 0;
    }

    case 'clear': {
      const cleared = await manager.clearDismissed();
      if (cleared > 0) {
        p.log.success(`Cleared ${cleared} dismissed suggestion(s).`);
      } else {
        p.log.info('No dismissed suggestions to clear.');
      }
      return 0;
    }

    default:
      p.log.error(`Unknown subcommand: ${subcommand}`);
      p.log.message('');
      p.log.message('Usage:');
      p.log.message('  suggestions, sgs         List all suggestions');
      p.log.message('  suggestions list         List all suggestions');
      p.log.message('  suggestions clear        Clear dismissed suggestions');
      return 1;
  }
}
