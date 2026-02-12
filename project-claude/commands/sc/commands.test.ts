import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const commandDir = dirname(fileURLToPath(import.meta.url));
const statusContent = readFileSync(join(commandDir, 'status.md'), 'utf-8');
const suggestContent = readFileSync(join(commandDir, 'suggest.md'), 'utf-8');
const wrapContent = readFileSync(join(commandDir, 'wrap.md'), 'utf-8');

// ---------------------------------------------------------------------------
// /sc:status (CMD-01)
// ---------------------------------------------------------------------------

describe('/sc:status command structure (CMD-01)', () => {
  it('has YAML frontmatter with name sc:status', () => {
    expect(statusContent).toMatch(/^---\n/);
    expect(statusContent).toContain('name: sc:status');
    expect(statusContent).toContain('description:');
  });

  it('has objective, process, and success_criteria sections', () => {
    expect(statusContent).toContain('<objective>');
    expect(statusContent).toContain('</objective>');
    expect(statusContent).toContain('<process>');
    expect(statusContent).toContain('</process>');
    expect(statusContent).toContain('<success_criteria>');
    expect(statusContent).toContain('</success_criteria>');
  });

  it('references skill budget or token consumption', () => {
    expect(statusContent).toMatch(/budget/i);
    expect(statusContent).toMatch(/token|char/i);
    const hasCliRef = statusContent.includes('skill-creator status');
    const hasBudgetCalc = statusContent.includes('max_percent');
    expect(hasCliRef || hasBudgetCalc).toBe(true);
  });

  it('references suggestions.json for pending count', () => {
    expect(statusContent).toContain('suggestions.json');
    expect(statusContent).toMatch(/pending/i);
  });

  it('includes per-skill breakdown table', () => {
    expect(statusContent).toMatch(/\| Skill/);
    expect(statusContent).toMatch(/sorted by size/i);
  });

  it('includes visual progress bar instructions', () => {
    expect(statusContent).toMatch(/progress bar/i);
    expect(statusContent).toMatch(/Budget.*\[/);
  });

  it('does not contain stub markers', () => {
    expect(statusContent).not.toContain('TODO: Implement');
    expect(statusContent).not.toContain('Stub:');
    expect(statusContent).not.toMatch(/^> Stub:/m);
  });

  it('is at least 50 lines', () => {
    const lineCount = statusContent.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(50);
  });
});

// ---------------------------------------------------------------------------
// /sc:suggest (CMD-02)
// ---------------------------------------------------------------------------

describe('/sc:suggest command structure (CMD-02)', () => {
  it('has YAML frontmatter with name sc:suggest', () => {
    expect(suggestContent).toMatch(/^---\n/);
    expect(suggestContent).toContain('name: sc:suggest');
    expect(suggestContent).toContain('description:');
  });

  it('has objective, process, and success_criteria sections', () => {
    expect(suggestContent).toContain('<objective>');
    expect(suggestContent).toContain('</objective>');
    expect(suggestContent).toContain('<process>');
    expect(suggestContent).toContain('</process>');
    expect(suggestContent).toContain('<success_criteria>');
    expect(suggestContent).toContain('</success_criteria>');
  });

  it('references suggestions.json for loading suggestions', () => {
    expect(suggestContent).toContain('suggestions.json');
    expect(suggestContent).toMatch(/Read.*suggestions\.json|suggestions\.json.*Read/i);
  });

  it('includes accept, dismiss, and defer options', () => {
    expect(suggestContent).toMatch(/accept/i);
    expect(suggestContent).toMatch(/dismiss/i);
    expect(suggestContent).toMatch(/defer/i);
  });

  it('includes stop option for exiting review loop', () => {
    expect(suggestContent).toMatch(/stop/i);
    expect(suggestContent).toMatch(/remaining.*pending|stop reviewing/i);
  });

  it('describes atomic read-modify-write for suggestions.json updates', () => {
    expect(suggestContent).toMatch(/read.*modify.*write|atomic/i);
    expect(suggestContent).toMatch(/Write.*suggestions\.json|write.*back/i);
  });

  it('handles missing suggestions.json gracefully', () => {
    expect(suggestContent).toMatch(/does not exist|missing|not found/i);
    expect(suggestContent).toMatch(/No pending suggestions/i);
  });

  it('presents suggestions one at a time with details', () => {
    expect(suggestContent).toMatch(/one at a time/i);
    expect(suggestContent).toMatch(/occurrences/i);
    expect(suggestContent).toMatch(/confidence/i);
  });

  it('does not contain stub markers', () => {
    expect(suggestContent).not.toContain('TODO: Implement');
    expect(suggestContent).not.toContain('Stub:');
    expect(suggestContent).not.toMatch(/^> Stub:/m);
  });

  it('is at least 60 lines', () => {
    const lineCount = suggestContent.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(60);
  });
});

// ---------------------------------------------------------------------------
// /sc:wrap (CMD-05)
// ---------------------------------------------------------------------------

describe('/sc:wrap command structure (CMD-05)', () => {
  it('has YAML frontmatter with name sc:wrap', () => {
    expect(wrapContent).toMatch(/^---\n/);
    expect(wrapContent).toContain('name: sc:wrap');
    expect(wrapContent).toContain('description:');
  });

  it('has objective, process, and success_criteria sections', () => {
    expect(wrapContent).toContain('<objective>');
    expect(wrapContent).toContain('</objective>');
    expect(wrapContent).toContain('<process>');
    expect(wrapContent).toContain('</process>');
    expect(wrapContent).toContain('<success_criteria>');
    expect(wrapContent).toContain('</success_criteria>');
  });

  it('references all four wrapper commands', () => {
    expect(wrapContent).toContain('wrap:execute');
    expect(wrapContent).toContain('wrap:verify');
    expect(wrapContent).toContain('wrap:plan');
    expect(wrapContent).toContain('wrap:phase');
  });

  it('describes integration levels', () => {
    expect(wrapContent).toMatch(/Level 1/);
    expect(wrapContent).toMatch(/Level 2/);
    expect(wrapContent).toMatch(/Level 3/);
    expect(wrapContent).toMatch(/integration level/i);
  });

  it('references skill-creator.json config', () => {
    expect(wrapContent).toContain('skill-creator.json');
    expect(wrapContent).toMatch(/wrapper_commands/);
  });

  it('explains how to change integration level', () => {
    expect(wrapContent).toMatch(/config.*set|toggle.*features|Edit/i);
    expect(wrapContent).toContain('config validate');
  });

  it('handles disabled wrapper_commands gracefully', () => {
    expect(wrapContent).toMatch(/disabled|false/i);
    expect(wrapContent).toMatch(/enable/i);
  });

  it('does not contain stub markers', () => {
    expect(wrapContent).not.toContain('TODO: Implement');
    expect(wrapContent).not.toContain('Stub:');
    expect(wrapContent).not.toMatch(/^> Stub:/m);
  });

  it('is at least 40 lines', () => {
    const lineCount = wrapContent.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(40);
  });
});
