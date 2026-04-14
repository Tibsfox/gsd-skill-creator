import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SPEC_REVIEWER_PATH = join(__dirname, 'prompts/spec-reviewer.md');
const QUALITY_REVIEWER_PATH = join(__dirname, 'prompts/quality-reviewer.md');

function readPrompt(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('vendored reviewer prompts', () => {
  it('spec-reviewer.md has VENDORED FROM header', () => {
    const content = readPrompt(SPEC_REVIEWER_PATH);
    expect(content).toContain('VENDORED FROM: obra/superpowers');
  });

  it('quality-reviewer.md has VENDORED FROM header', () => {
    const content = readPrompt(QUALITY_REVIEWER_PATH);
    expect(content).toContain('VENDORED FROM: obra/superpowers');
  });

  it('spec-reviewer.md SOURCE COMMIT SHA is 40-char hex', () => {
    const content = readPrompt(SPEC_REVIEWER_PATH);
    const match = content.match(/SOURCE COMMIT:\s*([0-9a-f]{40})/i);
    expect(match).not.toBeNull();
    expect(match![1]).toHaveLength(40);
  });

  it('quality-reviewer.md SOURCE COMMIT SHA is 40-char hex', () => {
    const content = readPrompt(QUALITY_REVIEWER_PATH);
    const match = content.match(/SOURCE COMMIT:\s*([0-9a-f]{40})/i);
    expect(match).not.toBeNull();
    expect(match![1]).toHaveLength(40);
  });

  it('both files are non-trivial (>500 chars)', () => {
    expect(readPrompt(SPEC_REVIEWER_PATH).length).toBeGreaterThan(500);
    expect(readPrompt(QUALITY_REVIEWER_PATH).length).toBeGreaterThan(500);
  });

  it('both files contain explicit untrusted-content instruction', () => {
    const spec = readPrompt(SPEC_REVIEWER_PATH);
    const quality = readPrompt(QUALITY_REVIEWER_PATH);

    expect(spec).toContain('untrusted_skill_content');
    expect(spec).toContain('untrusted data');

    expect(quality).toContain('untrusted_skill_content');
    expect(quality).toContain('untrusted data');
  });
});
