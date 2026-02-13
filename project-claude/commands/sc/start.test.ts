import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const commandDir = dirname(fileURLToPath(import.meta.url));
const content = readFileSync(join(commandDir, 'start.md'), 'utf-8');

describe('/sc:start command structure', () => {
  it('has YAML frontmatter with name and description', () => {
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('name: sc:start');
    expect(content).toContain('description:');
  });

  it('has allowed-tools in frontmatter', () => {
    expect(content).toContain('allowed-tools:');
    expect(content).toContain('Read');
    expect(content).toContain('Bash');
    expect(content).toContain('Glob');
  });

  it('has objective section', () => {
    expect(content).toContain('<objective>');
    expect(content).toContain('</objective>');
  });

  it('has process section with numbered steps', () => {
    expect(content).toContain('<process>');
    expect(content).toContain('</process>');
    // Steps 0-5 are defined
    expect(content).toContain('## Step 0');
    expect(content).toContain('## Step 1');
    expect(content).toContain('## Step 2');
    expect(content).toContain('## Step 3');
    expect(content).toContain('## Step 4');
    expect(content).toContain('## Step 5');
  });

  it('has success_criteria section', () => {
    expect(content).toContain('<success_criteria>');
    expect(content).toContain('</success_criteria>');
  });

  it('references STATE.md for GSD position (SESS-01)', () => {
    expect(content).toContain('STATE.md');
    expect(content).toMatch(/phase/i);
    expect(content).toMatch(/position|current/i);
  });

  it('references sessions.jsonl for recent activity (SESS-02)', () => {
    expect(content).toContain('sessions.jsonl');
    expect(content).toMatch(/recent|activity/i);
  });

  it('references suggestions.json for pending suggestions (SESS-03)', () => {
    expect(content).toContain('suggestions.json');
    expect(content).toMatch(/pending|occurrence/i);
  });

  it('references skill budget or status command (SESS-04)', () => {
    const hasCliRef = content.includes('skill-creator status');
    const hasFileRef = content.includes('.claude/commands');
    expect(hasCliRef || hasFileRef).toBe(true);
    expect(content).toMatch(/budget|token/i);
  });

  it('references integration config for feature toggles', () => {
    expect(content).toContain('skill-creator.json');
    expect(content).toMatch(/suggest_on_session_start|feature|toggle/i);
  });

  it('handles missing file scenarios gracefully', () => {
    const hasFallback =
      content.includes('does not exist') ||
      content.includes('not found') ||
      content.includes('No GSD');
    expect(hasFallback).toBe(true);
  });

  it('does not contain stub markers', () => {
    expect(content).not.toContain('TODO: Implement');
    expect(content).not.toContain('Stub:');
    expect(content).not.toMatch(/^> Stub:/m);
  });

  it('is at least 80 lines', () => {
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(80);
  });
});
