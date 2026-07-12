import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { FeedbackStore } from '../../learning/index.js';
import { FeedbackDetector } from '../../learning/feedback-detector.js';
import { CorrectionQuarantineStore } from '../../learning/correction-quarantine.js';
import { SkillStore } from '../../storage/skill-store.js';
import { FileLock } from '../../safety/file-lock.js';
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

    case 'quarantine':
    case 'q':
      return quarantineSubcommand(args, skillsDir, patternsDir, feedbackStore);

    case 'stats':
    case undefined: {
      const count = await feedbackStore.count();
      const pending = await new CorrectionQuarantineStore(patternsDir).countPending();
      p.log.message('');
      p.log.message(pc.bold('Feedback Statistics:'));
      p.log.message(`  Total events: ${count}`);
      if (pending > 0) {
        p.log.message(
          pc.dim(`  ${pending} correction candidate(s) awaiting review — \`feedback quarantine list\``),
        );
      }
      return 0;
    }

    default:
      p.log.error(`Unknown subcommand: ${subcommand}`);
      p.log.message('');
      p.log.message('Usage:');
      p.log.message('  feedback, fb              Show feedback stats');
      p.log.message('  feedback list <skill>     List feedback for a skill');
      p.log.message('  feedback record --skill=<name> --original=<file|-> --corrected=<file|->');
      p.log.message('  feedback quarantine [list|show <id>|accept <id> [--skill]|dismiss <id>]');
      return 1;
  }
}

/**
 * `feedback quarantine` — human review of auto-detected correction candidates.
 *
 * Candidates are auto-detected at session-end into a SEPARATE quarantine ledger
 * that RefinementEngine never reads. `accept` is the ONLY bridge into the live
 * feedback ledger, and it reuses the exact fail-closed skill-exists +
 * significance gates that `feedback record` uses. The detector never attributes
 * a skill (skillName is always null), so a human MUST supply --skill (or pick a
 * hint interactively) to promote — the pipeline never guesses.
 */
async function quarantineSubcommand(
  args: string[],
  skillsDir: string | undefined,
  patternsDir: string,
  feedbackStore: FeedbackStore,
): Promise<number> {
  const store = new CorrectionQuarantineStore(patternsDir);
  const action = args[2];
  const id = args[3];

  switch (action) {
    case 'list':
    case 'ls':
    case undefined: {
      const items = args.includes('--all') ? await store.readAll() : await store.listPending();
      if (items.length === 0) {
        p.log.info('No pending correction candidates.');
        return 0;
      }
      p.log.message('');
      p.log.message(pc.bold('Correction candidates awaiting review:'));
      for (const c of items) {
        const hints = c.skillHints.length
          ? c.skillHints.map((h) => (h.ambient ? `${h.skill}?` : h.skill)).slice(0, 3).join(', ')
          : '(no hints)';
        const sim = `sim=${c.preSimilarity.toFixed(2)}`;
        p.log.message(`  ${pc.bold(c.id)} [${c.status}] ${c.filePath}`);
        p.log.message(
          pc.dim(`    ${c.signal} · ${sim} · hints: ${hints} · "${c.interposingUserText.slice(0, 60)}"`),
        );
      }
      p.log.message(pc.dim('  Promote: feedback quarantine accept <id> --skill=<name>'));
      return 0;
    }

    case 'show': {
      const c = id ? await store.getById(id) : undefined;
      if (!c) {
        p.log.error(`No correction candidate with id '${id}'.`);
        return 1;
      }
      p.log.message('');
      p.log.message(pc.bold(`Candidate ${c.id} [${c.status}]`));
      p.log.message(`  file:    ${c.filePath}`);
      p.log.message(`  signal:  ${c.signal}  (similarity ${c.preSimilarity.toFixed(2)})`);
      p.log.message(`  session: ${c.sessionId}`);
      p.log.message(`  human:   "${c.interposingUserText}"`);
      p.log.message(`  hints:   ${c.skillHints.map((h) => `${h.skill}${h.ambient ? ' (ambient)' : ''} [${h.source}]`).join(', ') || '(none)'}`);
      p.log.message(pc.dim('  --- original ---'));
      p.log.message(c.original);
      p.log.message(pc.dim('  --- corrected ---'));
      p.log.message(c.corrected);
      return 0;
    }

    case 'dismiss': {
      if (!id) {
        p.log.error('Usage: feedback quarantine dismiss <id> [--reason=<text>]');
        return 1;
      }
      const c = await store.getById(id);
      if (!c) {
        p.log.error(`No correction candidate with id '${id}'.`);
        return 1;
      }
      if (c.status !== 'pending') {
        p.log.error(`Candidate '${id}' is already '${c.status}'.`);
        return 1;
      }
      await store.updateStatus(id, {
        status: 'dismissed',
        reviewedAt: new Date().toISOString(),
        dismissedReason: flagValue(args, '--reason') ?? 'dismissed by reviewer',
      });
      p.log.success(`Dismissed candidate '${id}'. Nothing written to the feedback ledger.`);
      return 0;
    }

    case 'accept': {
      if (!id) {
        p.log.error('Usage: feedback quarantine accept <id> --skill=<name>');
        return 1;
      }
      const c = await store.getById(id);
      if (!c) {
        p.log.error(`No correction candidate with id '${id}'.`);
        return 1;
      }
      if (c.status !== 'pending') {
        p.log.error(`Candidate '${id}' is already '${c.status}' — cannot re-promote.`);
        return 1;
      }

      // Human attribution is load-bearing: the detector never guesses. Take
      // --skill; else offer the hints interactively; else refuse.
      let chosen = flagValue(args, '--skill');
      if (!chosen) {
        if (process.stdin.isTTY && c.skillHints.length > 0) {
          const sel = await p.select({
            message: `Attribute correction '${id}' to which skill?`,
            options: c.skillHints.map((h) => ({
              value: h.skill,
              label: h.ambient ? `${h.skill} (ambient — unlikely)` : h.skill,
            })),
          });
          if (p.isCancel(sel)) {
            p.log.info('Cancelled — nothing recorded.');
            return 0;
          }
          chosen = sel as string;
        } else {
          p.log.error(
            `Candidate '${id}' is unattributed — pass --skill=<name> to promote it. ` +
              `The detector never guesses which skill a correction is against; a human must choose.`,
          );
          return 1;
        }
      }

      // Fail-closed skill-exists gate (identical to `feedback record`).
      const skillStore = new SkillStore(skillsDir ?? '.claude/skills');
      let known: boolean;
      try {
        known = await skillStore.exists(chosen);
      } catch (err) {
        p.log.error(`Invalid skill name '${chosen}': ${(err as Error).message}`);
        return 1;
      }
      if (!known) {
        p.log.error(
          `Unknown skill '${chosen}' — refusing to record a correction against a skill that ` +
            `does not exist (fail-closed). Check the name with \`skill-creator list\`.`,
        );
        return 1;
      }

      // Cross-process lock: serialize the promotion critical section so two
      // simultaneous `accept <id>` invocations cannot both write the correction.
      // (The sourceCandidateId idempotency key already covers the crash-replay
      // case; this closes the concurrent-process window.) The read-only exists /
      // attribution work above is intentionally OUTSIDE the lock so user prompts
      // never hold it.
      const lock = new FileLock(join(patternsDir, '.feedback-promotion.lock'));
      let acq = await lock.acquire(`promote:${id}`);
      for (let attempt = 0; attempt < 30 && !acq.acquired; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        acq = await lock.acquire(`promote:${id}`);
      }
      if (!acq.acquired) {
        p.log.error(`Could not acquire the promotion lock — ${acq.message} Try again in a moment.`);
        return 1;
      }

      try {
        // Re-read under the lock: a concurrent review may have already resolved
        // this candidate while we were resolving the attribution above.
        const fresh = await store.getById(id);
        if (!fresh || fresh.status !== 'pending') {
          p.log.info(
            `Candidate '${id}' was already ${fresh?.status ?? 'removed'} by a concurrent review — nothing to do.`,
          );
          return 0;
        }

        // Significance gate re-run at promote time (identical to `feedback record`).
        const detection = new FeedbackDetector().detect(fresh.original, fresh.corrected, chosen);
        if (!detection) {
          await store.updateStatus(id, {
            status: 'dismissed',
            reviewedAt: new Date().toISOString(),
            dismissedReason: 'not_significant',
          });
          p.log.info('Change is not a significant correction — candidate dismissed, nothing recorded.');
          return 0;
        }

        // Live write — the only bridge from quarantine into the feedback ledger.
        // Keyed on the candidate id so a replayed accept (crash between this write
        // and the status flip below) appends exactly once, never double-counting.
        const ev = await feedbackStore.record({
          type: 'correction',
          skillName: chosen,
          sessionId: fresh.sessionId,
          original: fresh.original,
          corrected: fresh.corrected,
          diff: detection.analysis.changes,
          sourceCandidateId: fresh.id,
        });
        await store.updateStatus(id, {
          status: 'promoted',
          reviewedAt: new Date().toISOString(),
          promotedFeedbackId: ev.id,
        });

        const total = await feedbackStore.count(chosen);
        const need = DEFAULT_BOUNDED_CONFIG.minCorrectionsForRefinement;
        p.log.success(`Promoted candidate '${id}' → correction for '${chosen}'.`);
        p.log.message(
          pc.dim(
            total >= need
              ? `  ${total} correction(s) recorded — eligible for a refinement proposal ` +
                  `(run \`skill-creator refine ${chosen}\`).`
              : `  ${total}/${need} correction(s) toward a refinement proposal.`,
          ),
        );
        return 0;
      } finally {
        await acq.release();
      }
    }

    default:
      p.log.error(`Unknown quarantine action: ${action}`);
      p.log.message(
        'Usage: feedback quarantine [list|show <id>|accept <id> [--skill=<name>]|dismiss <id> [--reason=<text>]]',
      );
      return 1;
  }
}
