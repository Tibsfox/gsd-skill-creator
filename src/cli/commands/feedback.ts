import * as p from '@clack/prompts';
import pc from 'picocolors';
import { FeedbackStore } from '../../learning/index.js';

export async function feedbackCommand(args: string[]): Promise<number> {
  const subcommand = args[1];
  const feedbackStore = new FeedbackStore('.planning/patterns');

  switch (subcommand) {
    case 'list':
    case 'ls': {
      const skillName = args[2];
      if (!skillName) {
        p.log.error('Usage: skill-creator feedback list <skill-name>');
        return 1;
      }

      const corrections = await feedbackStore.getCorrections(skillName);
      if (corrections.length === 0) {
        p.log.info(`No feedback recorded for '${skillName}'.`);
        return 0;
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
      return 0;
    }

    case 'stats':
    case undefined: {
      const count = await feedbackStore.count();
      p.log.message('');
      p.log.message(pc.bold('Feedback Statistics:'));
      p.log.message(`  Total events: ${count}`);
      return 0;
    }

    default:
      p.log.error(`Unknown subcommand: ${subcommand}`);
      p.log.message('');
      p.log.message('Usage:');
      p.log.message('  feedback, fb              Show feedback stats');
      p.log.message('  feedback list <skill>     List feedback for a skill');
      return 1;
  }
}
