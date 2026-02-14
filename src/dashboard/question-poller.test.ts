/**
 * Tests for dashboard question poller and response script generation.
 *
 * Covers polling empty/populated directories, filtering non-JSON and
 * invalid files, skipping non-pending questions, and the generated
 * client-side response script structure.
 *
 * @module dashboard/question-poller.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { QuestionPoller, renderQuestionResponseScript } from './question-poller.js';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let tmpBase: string;
let questionsDir: string;
let poller: QuestionPoller;

beforeEach(async () => {
  tmpBase = await mkdtemp(join(tmpdir(), 'qpoller-'));
  questionsDir = join(tmpBase, '.planning', 'console', 'outbox', 'questions');
  await mkdir(questionsDir, { recursive: true });
  poller = new QuestionPoller(tmpBase);
});

afterEach(async () => {
  await rm(tmpBase, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validQuestion(
  id: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    question_id: id,
    text: `Question ${id}?`,
    type: 'binary',
    status: 'pending',
    urgency: 'medium',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Polling tests
// ---------------------------------------------------------------------------

describe('QuestionPoller.poll', () => {
  it('returns empty array for empty directory', async () => {
    const result = await poller.poll();
    expect(result).toEqual([]);
  });

  it('returns parsed Question objects for valid files', async () => {
    await writeFile(
      join(questionsDir, '001-question.json'),
      JSON.stringify(validQuestion('q-001')),
    );
    await writeFile(
      join(questionsDir, '002-question.json'),
      JSON.stringify(validQuestion('q-002')),
    );

    const result = await poller.poll();
    expect(result).toHaveLength(2);
    expect(result[0].question_id).toBe('q-001');
    expect(result[1].question_id).toBe('q-002');
  });

  it('ignores non-JSON files', async () => {
    await writeFile(
      join(questionsDir, 'readme.txt'),
      'not a question',
    );
    await writeFile(
      join(questionsDir, '001-question.json'),
      JSON.stringify(validQuestion('q-001')),
    );

    const result = await poller.poll();
    expect(result).toHaveLength(1);
    expect(result[0].question_id).toBe('q-001');
  });

  it('skips invalid JSON files without crashing', async () => {
    await writeFile(
      join(questionsDir, '001-bad.json'),
      '{not valid json!!!}',
    );
    await writeFile(
      join(questionsDir, '002-question.json'),
      JSON.stringify(validQuestion('q-002')),
    );

    const result = await poller.poll();
    expect(result).toHaveLength(1);
    expect(result[0].question_id).toBe('q-002');
  });

  it('skips questions with status other than pending', async () => {
    await writeFile(
      join(questionsDir, '001-answered.json'),
      JSON.stringify(validQuestion('q-001', { status: 'answered' })),
    );
    await writeFile(
      join(questionsDir, '002-pending.json'),
      JSON.stringify(validQuestion('q-002', { status: 'pending' })),
    );

    const result = await poller.poll();
    expect(result).toHaveLength(1);
    expect(result[0].question_id).toBe('q-002');
  });

  it('returns empty array when questions directory does not exist', async () => {
    // Use a base that has no outbox/questions/ directory
    const emptyBase = await mkdtemp(join(tmpdir(), 'qpoller-empty-'));
    const emptyPoller = new QuestionPoller(emptyBase);

    const result = await emptyPoller.poll();
    expect(result).toEqual([]);

    await rm(emptyBase, { recursive: true, force: true });
  });

  it('sorts questions alphabetically by filename', async () => {
    await writeFile(
      join(questionsDir, 'zzz-question.json'),
      JSON.stringify(validQuestion('q-zzz')),
    );
    await writeFile(
      join(questionsDir, 'aaa-question.json'),
      JSON.stringify(validQuestion('q-aaa')),
    );

    const result = await poller.poll();
    expect(result).toHaveLength(2);
    expect(result[0].question_id).toBe('q-aaa');
    expect(result[1].question_id).toBe('q-zzz');
  });

  it('skips schema-invalid JSON files (valid JSON, bad shape)', async () => {
    await writeFile(
      join(questionsDir, '001-bad-shape.json'),
      JSON.stringify({ not_a_question: true }),
    );
    await writeFile(
      join(questionsDir, '002-good.json'),
      JSON.stringify(validQuestion('q-002')),
    );

    const result = await poller.poll();
    expect(result).toHaveLength(1);
    expect(result[0].question_id).toBe('q-002');
  });
});

// ---------------------------------------------------------------------------
// Response script generation tests
// ---------------------------------------------------------------------------

describe('renderQuestionResponseScript', () => {
  it('returns a string containing a submitQuestionResponse function', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    expect(script).toContain('submitQuestionResponse');
  });

  it('uses fetch POST to the helper URL', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    expect(script).toContain("fetch('/api/console/message'");
    expect(script).toContain("method: 'POST'");
  });

  it('references question-response message type', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    expect(script).toContain('question-response');
  });

  it('constructs message envelope with question_id in payload', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    expect(script).toContain('question_id');
    expect(script).toContain('payload');
  });

  it('includes source dashboard in envelope', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    expect(script).toContain("source: 'dashboard'");
  });

  it('includes event delegation for question card buttons', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    expect(script).toContain('question-card-submit');
    expect(script).toContain('question-card-option');
    expect(script).toContain('question-card-confirm');
  });

  it('handles all input types in event delegation', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    // Binary: data-value from button
    expect(script).toContain('data-value');
    // Choice: radio value
    expect(script).toContain('radio');
    // Multi-select: checkbox checked values
    expect(script).toContain('checkbox');
    // Text: textarea value
    expect(script).toContain('textarea');
  });

  it('wraps in a script tag', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    expect(script).toContain('<script>');
    expect(script).toContain('</script>');
  });

  it('constructs envelope with type and timestamp', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    expect(script).toContain("type: 'question-response'");
    expect(script).toContain('toISOString()');
  });

  it('builds subdirectory as inbox/pending', () => {
    const script = renderQuestionResponseScript('/api/console/message');
    expect(script).toContain('inbox/pending');
  });
});
