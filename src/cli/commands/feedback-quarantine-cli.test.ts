import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { feedbackCommand } from './feedback.js';
import { FeedbackStore } from '../../learning/feedback-store.js';
import { CorrectionQuarantineStore } from '../../learning/correction-quarantine.js';
import type { CorrectionCandidateInput } from '../../types/learning.js';

// `feedback quarantine accept` is the ONLY bridge from an auto-detected candidate
// into the live feedback ledger. It must reuse the fail-closed skill-exists +
// significance gates and require a human to attribute the skill.
describe('feedback quarantine', () => {
  let root: string;
  let skillsDir: string;
  let patternsDir: string;

  function candidate(over: Partial<CorrectionCandidateInput> = {}): CorrectionCandidateInput {
    return {
      kind: 'correction-candidate',
      schemaVersion: 1,
      sessionId: 'sess',
      transcriptPath: '/t.jsonl',
      signal: 'user-interposed-edit',
      filePath: '/f.ts',
      mistakeAssistantUuid: 'w1',
      fixerAssistantUuid: 'e2',
      skillName: null,
      skillHints: [{ skill: 'my-skill', source: 'session-active-skill', ambient: false }],
      interposingUserText: 'redo this',
      original: 'alpha beta gamma delta epsilon',
      corrected: 'one two three four five six',
      diff: [],
      preSimilarity: 0,
      ...over,
    };
  }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'feedback-quarantine-'));
    skillsDir = join(root, 'skills');
    patternsDir = join(root, 'patterns');
    await mkdir(join(skillsDir, 'my-skill'), { recursive: true });
    await writeFile(join(skillsDir, 'my-skill', 'SKILL.md'), '---\nname: my-skill\ndescription: a test skill\n---\nbody\n');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const q = () => new CorrectionQuarantineStore(patternsDir);
  const feedback = () => new FeedbackStore(patternsDir);
  const accept = (id: string, ...rest: string[]) =>
    feedbackCommand(['feedback', 'quarantine', 'accept', id, ...rest], skillsDir, patternsDir);

  it('refuses to promote against an unknown skill (fail-closed, no write)', async () => {
    const c = await q().add(candidate());
    const code = await accept(c.id, '--skill=does-not-exist');
    expect(code).toBe(1);
    expect(await feedback().count()).toBe(0);
    expect((await q().getById(c.id))!.status).toBe('pending');
  });

  it('refuses to promote an unattributed candidate non-interactively (no --skill)', async () => {
    const c = await q().add(candidate());
    const code = await accept(c.id); // no --skill, skillName null, non-TTY
    expect(code).toBe(1);
    expect(await feedback().count()).toBe(0);
    expect((await q().getById(c.id))!.status).toBe('pending');
  });

  it('promotes a significant candidate into the feedback ledger with the human-chosen skill', async () => {
    const c = await q().add(candidate());
    const code = await accept(c.id, '--skill=my-skill');
    expect(code).toBe(0);

    const corrections = await feedback().getCorrections('my-skill');
    expect(corrections).toHaveLength(1);
    expect(corrections[0].type).toBe('correction');
    expect(corrections[0].skillName).toBe('my-skill');

    const promoted = (await q().getById(c.id))!;
    expect(promoted.status).toBe('promoted');
    expect(promoted.promotedFeedbackId).toBe(corrections[0].id);
  });

  it('dismisses an insignificant candidate at promote time (no ledger write)', async () => {
    const c = await q().add(
      candidate({ original: 'hello world foo', corrected: 'hello world foo' }),
    );
    const code = await accept(c.id, '--skill=my-skill');
    expect(code).toBe(0); // not an error — just nothing to learn from
    expect(await feedback().count()).toBe(0);
    expect((await q().getById(c.id))!.status).toBe('dismissed');
    expect((await q().getById(c.id))!.dismissedReason).toBe('not_significant');
  });

  it('refuses to re-promote an already-promoted candidate', async () => {
    const c = await q().add(candidate());
    expect(await accept(c.id, '--skill=my-skill')).toBe(0);
    expect(await accept(c.id, '--skill=my-skill')).toBe(1);
    expect(await feedback().count()).toBe(1); // still just one write
  });

  it('is idempotent under replay: a crash before the status flip does not double-write', async () => {
    const c = await q().add(candidate());
    // Simulate: accept wrote the correction to the ledger, then crashed BEFORE
    // flipping the candidate to 'promoted' (it is still 'pending').
    const pre = await feedback().record({
      type: 'correction',
      skillName: 'my-skill',
      sessionId: c.sessionId,
      original: c.original,
      corrected: c.corrected,
      sourceCandidateId: c.id,
    });
    expect(await feedback().count()).toBe(1);

    // Re-run accept — must NOT append a second correction.
    const code = await accept(c.id, '--skill=my-skill');
    expect(code).toBe(0);
    expect(await feedback().count()).toBe(1); // still exactly one
    const promoted = (await q().getById(c.id))!;
    expect(promoted.status).toBe('promoted');
    expect(promoted.promotedFeedbackId).toBe(pre.id); // reused the existing event
  });

  it('dismiss records a dismissal and never writes the feedback ledger', async () => {
    const c = await q().add(candidate());
    const code = await feedbackCommand(
      ['feedback', 'quarantine', 'dismiss', c.id, '--reason=not a real correction'],
      skillsDir,
      patternsDir,
    );
    expect(code).toBe(0);
    expect((await q().getById(c.id))!.status).toBe('dismissed');
    expect(await feedback().count()).toBe(0);
  });
});
