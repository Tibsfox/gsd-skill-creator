import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { feedbackCommand } from './feedback.js';
import { FeedbackStore } from '../../learning/feedback-store.js';

// `feedback record` is the fail-closed, human-attributed correction entry point.
// These pin the three load-bearing guarantees: (1) a significant correction
// against a KNOWN skill is persisted as a type:'correction' event; (2) an unknown
// skill is REFUSED (no write); (3) an insignificant edit is dropped.
describe('feedback record', () => {
  let root: string;
  let skillsDir: string;
  let patternsDir: string;

  const args = (...rest: string[]) => ['feedback', 'record', ...rest];

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'feedback-record-'));
    skillsDir = join(root, 'skills');
    patternsDir = join(root, 'patterns');
    await mkdir(join(skillsDir, 'my-skill'), { recursive: true });
    await writeFile(join(skillsDir, 'my-skill', 'SKILL.md'), '---\nname: my-skill\n---\nbody\n');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('records a significant correction against a known skill', async () => {
    const code = await feedbackCommand(
      args(
        '--skill=my-skill',
        '--original-text=foo bar baz qux',
        '--corrected-text=alpha beta gamma delta epsilon',
        '--session-id=test-session',
      ),
      skillsDir,
      patternsDir,
    );
    expect(code).toBe(0);

    const store = new FeedbackStore(patternsDir);
    const corrections = await store.getCorrections('my-skill');
    expect(corrections).toHaveLength(1);
    expect(corrections[0].type).toBe('correction');
    expect(corrections[0].skillName).toBe('my-skill');
    expect(corrections[0].sessionId).toBe('test-session');
    expect(corrections[0].diff).toBeDefined();
  });

  it('REFUSES an unknown skill (fail-closed) and writes nothing', async () => {
    const code = await feedbackCommand(
      args('--skill=does-not-exist', '--original-text=foo bar baz', '--corrected-text=alpha beta gamma'),
      skillsDir,
      patternsDir,
    );
    expect(code).toBe(1);

    const store = new FeedbackStore(patternsDir);
    expect(await store.count()).toBe(0);
  });

  it('drops an insignificant (identical) edit without recording', async () => {
    const code = await feedbackCommand(
      args('--skill=my-skill', '--original-text=same text here', '--corrected-text=same text here'),
      skillsDir,
      patternsDir,
    );
    expect(code).toBe(0); // not an error — just nothing to learn from

    const store = new FeedbackStore(patternsDir);
    expect(await store.count('my-skill')).toBe(0);
  });

  it('rejects a missing --skill or missing correction input', async () => {
    expect(await feedbackCommand(args('--original-text=a', '--corrected-text=b'), skillsDir, patternsDir)).toBe(1);
    expect(await feedbackCommand(args('--skill=my-skill'), skillsDir, patternsDir)).toBe(1);
  });
});
