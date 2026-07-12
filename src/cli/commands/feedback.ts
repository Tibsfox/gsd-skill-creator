import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { FeedbackStore } from '../../learning/index.js';
import { FeedbackDetector } from '../../learning/feedback-detector.js';
import { SkillStore } from '../../storage/skill-store.js';
import { DEFAULT_BOUNDED_CONFIG } from '../../types/learning.js';

/** Read a `--name=value` flag from an argv slice. */
function flagValue(args: string[], name: string): string | undefined {
  const prefix = `${name}=`;
  const hit = args.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

/**
 * Resolve a correction side (`original` / `corrected`) from either an inline
 * `--<base>-text=` flag or a `--<base>=<file>` path (`-` reads stdin).
 * Returns undefined when neither flag is present.
 */
async function resolveText(args: string[], base: string): Promise<string | undefined> {
  const inline = flagValue(args, `--${base}-text`);
  if (inline !== undefined) return inline;
  const file = flagValue(args, `--${base}`);
  if (file === undefined) return undefined;
  if (file === '-') return readFileSync(0, 'utf-8');
  return readFile(file, 'utf-8');
}

export async function feedbackCommand(
  args: string[],
  skillsDir?: string,
  patternsDir = '.planning/patterns',
): Promise<number> {
  const subcommand = args[1];
  const feedbackStore = new FeedbackStore(patternsDir);

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

    case 'record': {
      // Explicit, human-attributed correction capture. This is the fail-closed
      // entry point: a correction is a NEGATIVE signal against ONE named skill,
      // so we REFUSE to write unless --skill names a skill that actually exists
      // (a typo would otherwise poison an unrelated ledger) and the change is a
      // SIGNIFICANT correction per FeedbackDetector (formatting-only / trivial
      // edits are dropped). Corrections feed RefinementEngine (>= 3 → a bounded,
      // human-confirmed refinement) — NOT the create-candidate or retire streams.
      const skillName = flagValue(args, '--skill');
      if (!skillName) {
        p.log.error(
          'Usage: skill-creator feedback record --skill=<name> ' +
            '--original=<file|-> --corrected=<file|-> [--session-id=<id>]',
        );
        p.log.message(pc.dim('  (or --original-text=... --corrected-text=... for inline input)'));
        return 1;
      }

      // Fail-closed attribution: the skill must exist. exists() also guards
      // against path traversal in the name.
      const store = new SkillStore(skillsDir ?? '.claude/skills');
      let known: boolean;
      try {
        known = await store.exists(skillName);
      } catch (err) {
        p.log.error(`Invalid skill name '${skillName}': ${(err as Error).message}`);
        return 1;
      }
      if (!known) {
        p.log.error(
          `Unknown skill '${skillName}' — refusing to record a correction against a ` +
            `skill that does not exist (fail-closed). Check the name with \`skill-creator list\`.`,
        );
        return 1;
      }

      let original: string | undefined;
      let corrected: string | undefined;
      try {
        original = await resolveText(args, 'original');
        corrected = await resolveText(args, 'corrected');
      } catch (err) {
        p.log.error(`Could not read correction input: ${(err as Error).message}`);
        return 1;
      }
      if (original === undefined || corrected === undefined) {
        p.log.error(
          'Both --original and --corrected are required ' +
            '(as =<file>, =- for stdin, or --original-text=/--corrected-text= inline).',
        );
        return 1;
      }

      // Significance gate — drop formatting-only / trivial edits so the ledger
      // only carries corrections worth learning from.
      const detector = new FeedbackDetector();
      const detection = detector.detect(original, corrected, skillName);
      if (!detection) {
        p.log.info(
          'Change is not a significant correction (formatting-only, too few words, ' +
            'or too similar) — nothing recorded.',
        );
        return 0;
      }

      const sessionId = flagValue(args, '--session-id') ?? 'manual';
      await feedbackStore.record({
        type: 'correction',
        skillName,
        sessionId,
        original,
        corrected,
        diff: detection.analysis.changes,
      });

      const total = await feedbackStore.count(skillName);
      const need = DEFAULT_BOUNDED_CONFIG.minCorrectionsForRefinement;
      p.log.success(`Recorded correction for '${skillName}'.`);
      p.log.message(
        pc.dim(
          total >= need
            ? `  ${total} correction(s) recorded — eligible for a refinement proposal ` +
                `(run \`skill-creator refine ${skillName}\`).`
            : `  ${total}/${need} correction(s) toward a refinement proposal.`,
        ),
      );
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
      p.log.message('  feedback record --skill=<name> --original=<file|-> --corrected=<file|->');
      return 1;
  }
}
