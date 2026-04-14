import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { validateTriggeringTestFile, validateTriggeringTestExists, REQUIRED_SECTIONS, MIN_RATIONALIZATION_ROWS } from './triggering-validation.js';

const validFile = `## Naive Prompt
Text here.

## Expected Baseline Failure
Text.

## Expected Skill Activation
Text.

## Rationalization Table
| R | C |
|---|---|
| a | b |
| c | d |
| e | f |
`;

describe('validateTriggeringTestFile', () => {
  it('returns valid for a complete file with 3+ rationalization rows', () => {
    const r = validateTriggeringTestFile(validFile);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.rationalizationRowCount).toBe(3);
  });

  it('returns error when Naive Prompt section is missing', () => {
    const f = validFile.replace('## Naive Prompt\nText here.', '');
    const r = validateTriggeringTestFile(f);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('Naive Prompt'))).toBe(true);
  });

  it('returns error when Expected Baseline Failure section is missing', () => {
    const f = validFile.replace(/## Expected Baseline Failure\nText\./, '');
    const r = validateTriggeringTestFile(f);
    expect(r.errors.some(e => e.includes('Expected Baseline Failure'))).toBe(true);
  });

  it('returns error when Expected Skill Activation section is missing', () => {
    const f = validFile.replace(/## Expected Skill Activation\nText\./, '');
    const r = validateTriggeringTestFile(f);
    expect(r.errors.some(e => e.includes('Expected Skill Activation'))).toBe(true);
  });

  it('returns error when Rationalization Table section is missing', () => {
    const f = validFile.replace(/## Rationalization Table[\s\S]+/, '');
    const r = validateTriggeringTestFile(f);
    expect(r.errors.some(e => e.includes('Rationalization Table'))).toBe(true);
  });

  it('returns error when a section is present but empty', () => {
    const f = `## Naive Prompt\n\n## Expected Baseline Failure\nText.\n\n## Expected Skill Activation\nText.\n\n## Rationalization Table\n| R | C |\n|---|---|\n| a | b |\n| c | d |\n| e | f |`;
    const r = validateTriggeringTestFile(f);
    expect(r.errors.some(e => e.includes('Naive Prompt') && e.includes('empty'))).toBe(true);
  });

  it('returns error when rationalization table has only 2 data rows', () => {
    const f = validFile.replace('| e | f |\n', '');
    const r = validateTriggeringTestFile(f);
    expect(r.valid).toBe(false);
    expect(r.rationalizationRowCount).toBe(2);
  });

  it('returns valid when rationalization table has exactly 3 data rows', () => {
    const r = validateTriggeringTestFile(validFile);
    expect(r.rationalizationRowCount).toBe(3);
    expect(r.valid).toBe(true);
  });

  it('returns valid when rationalization table has 5+ data rows', () => {
    const f = validFile.replace('| e | f |', '| e | f |\n| g | h |\n| i | j |');
    const r = validateTriggeringTestFile(f);
    expect(r.valid).toBe(true);
    expect(r.rationalizationRowCount).toBe(5);
  });

  it('does not count separator rows as data rows', () => {
    // Already covered by validFile (3 not 4)
    expect(validateTriggeringTestFile(validFile).rationalizationRowCount).toBe(3);
  });

  it('does not count header row as a data row', () => {
    // Same fixture — 4 pipe rows total minus header minus separator = 3 data
    expect(validateTriggeringTestFile(validFile).rationalizationRowCount).toBe(3);
  });

  it('ignores extra ## sections beyond the four required', () => {
    const f = validFile + '\n\n## Notes\nExtra content';
    const r = validateTriggeringTestFile(f);
    expect(r.valid).toBe(true);
  });

  it('handles ### sub-headings inside sections without misclassifying', () => {
    const f = validFile.replace('Text here.', 'Text here.\n\n### sub\nmore text');
    const r = validateTriggeringTestFile(f);
    expect(r.valid).toBe(true);
  });

  it('exports REQUIRED_SECTIONS with all 4 expected section names', () => {
    expect(REQUIRED_SECTIONS).toContain('Naive Prompt');
    expect(REQUIRED_SECTIONS).toContain('Expected Baseline Failure');
    expect(REQUIRED_SECTIONS).toContain('Expected Skill Activation');
    expect(REQUIRED_SECTIONS).toContain('Rationalization Table');
    expect(REQUIRED_SECTIONS.length).toBe(4);
  });

  it('exports MIN_RATIONALIZATION_ROWS as 3', () => {
    expect(MIN_RATIONALIZATION_ROWS).toBe(3);
  });
});

describe('validateTriggeringTestExists', () => {
  it('returns error when triggering.test.md does not exist', async () => {
    const r = await validateTriggeringTestExists('/nonexistent/skill/dir');
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('triggering.test.md is required');
  });

  it('delegates to validateTriggeringTestFile when file exists', async () => {
    // Use real tmp dir
    const { mkdtemp, writeFile } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const dir = await mkdtemp(join(tmpdir(), 'triggering-test-'));
    await writeFile(join(dir, 'triggering.test.md'), validFile, 'utf8');
    const r = await validateTriggeringTestExists(dir);
    expect(r.valid).toBe(true);
  });
});
