import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const commandDir = dirname(fileURLToPath(import.meta.url));
const observeContent = readFileSync(join(commandDir, 'observe.md'), 'utf-8');
const digestContent = readFileSync(join(commandDir, 'digest.md'), 'utf-8');

// ---------------------------------------------------------------------------
// /sc:observe command structure (CMD-03)
// ---------------------------------------------------------------------------

describe('/sc:observe command structure (CMD-03)', () => {
  it('has YAML frontmatter with name sc:observe', () => {
    expect(observeContent).toMatch(/^---\n[\s\S]*?name:\s*sc:observe[\s\S]*?---/);
  });

  it('has objective, process, and success_criteria sections', () => {
    expect(observeContent).toContain('<objective>');
    expect(observeContent).toContain('</objective>');
    expect(observeContent).toContain('<process>');
    expect(observeContent).toContain('</process>');
    expect(observeContent).toContain('<success_criteria>');
    expect(observeContent).toContain('</success_criteria>');
  });

  it('references git log or git diff for session reconstruction', () => {
    expect(observeContent).toMatch(/git (log|diff)/);
  });

  it('references sessions.jsonl for observation data', () => {
    expect(observeContent).toContain('sessions.jsonl');
  });

  it('describes tool sequences in the output format', () => {
    expect(observeContent).toMatch(/[Tt]ool [Ss]equences/);
  });

  it('describes files touched in the output format', () => {
    expect(observeContent).toMatch(/[Ff]iles [Tt]ouched/);
  });

  it('mentions corrections or correction patterns', () => {
    expect(observeContent).toMatch(/[Cc]orrection/);
  });

  it('references skill-creator.json for config check', () => {
    expect(observeContent).toContain('skill-creator.json');
  });

  it('does not contain stub markers', () => {
    expect(observeContent).not.toMatch(/\bTODO\b/);
    expect(observeContent).not.toMatch(/\bStub:/);
  });

  it('is at least 50 lines', () => {
    const lineCount = observeContent.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(50);
  });
});

// ---------------------------------------------------------------------------
// /sc:digest command structure (CMD-04)
// ---------------------------------------------------------------------------

describe('/sc:digest command structure (CMD-04)', () => {
  it('has YAML frontmatter with name sc:digest', () => {
    expect(digestContent).toMatch(/^---\n[\s\S]*?name:\s*sc:digest[\s\S]*?---/);
  });

  it('has objective, process, and success_criteria sections', () => {
    expect(digestContent).toContain('<objective>');
    expect(digestContent).toContain('</objective>');
    expect(digestContent).toContain('<process>');
    expect(digestContent).toContain('</process>');
    expect(digestContent).toContain('<success_criteria>');
    expect(digestContent).toContain('</success_criteria>');
  });

  it('references sessions.jsonl for loading session data', () => {
    expect(digestContent).toContain('sessions.jsonl');
  });

  it('includes commit type distribution analysis', () => {
    expect(digestContent).toMatch(/[Cc]ommit [Tt]ype [Dd]istribution/);
  });

  it('includes phase activity analysis', () => {
    expect(digestContent).toMatch(/[Pp]hase [Aa]ctivity/);
  });

  it('includes temporal trends or per-date grouping', () => {
    expect(digestContent).toMatch(/[Tt]emporal [Tt]rends/);
  });

  it('includes correction rate analysis', () => {
    expect(digestContent).toMatch(/correction.rate/i);
  });

  it('includes recommendations section', () => {
    expect(digestContent).toMatch(/[Rr]ecommendation/);
  });

  it('references skill-creator.json for config', () => {
    expect(digestContent).toContain('skill-creator.json');
  });

  it('references STATE.md for phase context', () => {
    expect(digestContent).toContain('STATE.md');
  });

  it('handles missing or empty session data gracefully', () => {
    expect(digestContent).toMatch(/No session data available/);
  });

  it('does not contain stub markers', () => {
    expect(digestContent).not.toMatch(/\bTODO\b/);
    expect(digestContent).not.toMatch(/\bStub:/);
  });

  it('is at least 70 lines', () => {
    const lineCount = digestContent.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(70);
  });
});
