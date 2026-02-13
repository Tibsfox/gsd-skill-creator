import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const commandDir = dirname(fileURLToPath(import.meta.url));
const executeContent = readFileSync(join(commandDir, 'execute.md'), 'utf-8');
const verifyContent = readFileSync(join(commandDir, 'verify.md'), 'utf-8');

// ---------------------------------------------------------------------------
// /wrap:execute command structure (WRAP-01)
// ---------------------------------------------------------------------------

describe('/wrap:execute command structure (WRAP-01)', () => {
  it('has YAML frontmatter with name wrap:execute', () => {
    expect(executeContent).toMatch(/^---\n/);
    expect(executeContent).toContain('name: wrap:execute');
  });

  it('has description in frontmatter', () => {
    expect(executeContent).toContain('description:');
  });

  it('has allowed-tools including Task', () => {
    expect(executeContent).toContain('allowed-tools:');
    expect(executeContent).toContain('Task');
  });

  it('has objective, process, and success_criteria sections', () => {
    expect(executeContent).toContain('<objective>');
    expect(executeContent).toContain('</objective>');
    expect(executeContent).toContain('<process>');
    expect(executeContent).toContain('</process>');
    expect(executeContent).toContain('<success_criteria>');
    expect(executeContent).toContain('</success_criteria>');
  });

  it('references skill-creator.json for config reading (WRAP-05)', () => {
    expect(executeContent).toContain('skill-creator.json');
  });

  it('references GSD execute-phase for delegation', () => {
    expect(executeContent).toMatch(/gsd:execute-phase|execute-phase/);
  });

  it('references sessions.jsonl for observation capture', () => {
    expect(executeContent).toContain('sessions.jsonl');
  });

  it('describes skill loading with domain matching', () => {
    expect(executeContent).toMatch(/[Ss]kill.*[Ll]oad/);
    expect(executeContent).toMatch(/domain|topic|keyword/i);
  });

  it('includes graceful degradation for skill loading (WRAP-06)', () => {
    expect(executeContent).toMatch(/fail|error|encounter/i);
    expect(executeContent).toMatch(/proceed|continue|skip/i);
  });

  it('includes graceful degradation for observation capture (WRAP-06)', () => {
    // The observation step must mention error/fail and proceed/continue
    const observationSection = executeContent.slice(
      executeContent.indexOf('## Step 4'),
      executeContent.indexOf('## Step 5')
    );
    expect(observationSection).toMatch(/fail|error|encounter/i);
    expect(observationSection).toMatch(/proceed|continue|skip/i);
  });

  it('includes transparency summary section (WRAP-07)', () => {
    expect(executeContent).toMatch(/[Ww]rapper [Ss]ummary|[Tt]ransparency/);
  });

  it('has wrapper_execution type in observation entry', () => {
    expect(executeContent).toContain('wrapper_execution');
  });

  it('has source wrapper in observation entry', () => {
    expect(executeContent).toContain('"source": "wrapper"');
  });

  it('does not contain stub markers', () => {
    expect(executeContent).not.toContain('TODO: Implement');
    expect(executeContent).not.toContain('Stub:');
    expect(executeContent).not.toMatch(/^> Stub:/m);
  });

  it('is at least 120 lines', () => {
    const lineCount = executeContent.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(120);
  });
});

// ---------------------------------------------------------------------------
// /wrap:verify command structure (WRAP-02)
// ---------------------------------------------------------------------------

describe('/wrap:verify command structure (WRAP-02)', () => {
  it('has YAML frontmatter with name wrap:verify', () => {
    expect(verifyContent).toMatch(/^---\n/);
    expect(verifyContent).toContain('name: wrap:verify');
  });

  it('has description in frontmatter', () => {
    expect(verifyContent).toContain('description:');
  });

  it('has allowed-tools including Task', () => {
    expect(verifyContent).toContain('allowed-tools:');
    expect(verifyContent).toContain('Task');
  });

  it('has objective, process, and success_criteria sections', () => {
    expect(verifyContent).toContain('<objective>');
    expect(verifyContent).toContain('</objective>');
    expect(verifyContent).toContain('<process>');
    expect(verifyContent).toContain('</process>');
    expect(verifyContent).toContain('<success_criteria>');
    expect(verifyContent).toContain('</success_criteria>');
  });

  it('references skill-creator.json for config reading (WRAP-05)', () => {
    expect(verifyContent).toContain('skill-creator.json');
  });

  it('references GSD verify-work for delegation', () => {
    expect(verifyContent).toMatch(/gsd:verify-work|verify-work/);
  });

  it('references sessions.jsonl for observation capture', () => {
    expect(verifyContent).toContain('sessions.jsonl');
  });

  it('describes skill loading with verification bias', () => {
    expect(verifyContent).toMatch(/verif|test|check/i);
  });

  it('includes graceful degradation (WRAP-06)', () => {
    expect(verifyContent).toMatch(/fail|error|encounter/i);
    expect(verifyContent).toMatch(/proceed|continue|skip/i);
  });

  it('includes transparency summary (WRAP-07)', () => {
    expect(verifyContent).toMatch(/[Ww]rapper [Ss]ummary|[Tt]ransparency/);
  });

  it('has wrapper_verification type in observation entry', () => {
    expect(verifyContent).toContain('wrapper_verification');
  });

  it('has source wrapper in observation entry', () => {
    expect(verifyContent).toContain('"source": "wrapper"');
  });

  it('does not contain stub markers', () => {
    expect(verifyContent).not.toContain('TODO: Implement');
    expect(verifyContent).not.toContain('Stub:');
    expect(verifyContent).not.toMatch(/^> Stub:/m);
  });

  it('is at least 120 lines', () => {
    const lineCount = verifyContent.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(120);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: WRAP-05 config reading
// ---------------------------------------------------------------------------

describe('Cross-cutting: WRAP-05 config reading', () => {
  it('execute.md references wrapper_commands toggle', () => {
    expect(executeContent).toContain('wrapper_commands');
  });

  it('verify.md references wrapper_commands toggle', () => {
    expect(verifyContent).toContain('wrapper_commands');
  });

  it('execute.md references auto_load_skills toggle', () => {
    expect(executeContent).toContain('auto_load_skills');
  });

  it('verify.md references auto_load_skills toggle', () => {
    expect(verifyContent).toContain('auto_load_skills');
  });

  it('execute.md references observe_sessions toggle', () => {
    expect(executeContent).toContain('observe_sessions');
  });

  it('verify.md references observe_sessions toggle', () => {
    expect(verifyContent).toContain('observe_sessions');
  });

  it('execute.md handles missing config with defaults', () => {
    expect(executeContent).toMatch(/missing|not exist|defaults/i);
  });

  it('verify.md handles missing config with defaults', () => {
    expect(verifyContent).toMatch(/missing|not exist|defaults/i);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: WRAP-06 graceful degradation
// ---------------------------------------------------------------------------

describe('Cross-cutting: WRAP-06 graceful degradation', () => {
  it('execute.md has error handling for skill loading', () => {
    const skillSection = executeContent.slice(
      executeContent.indexOf('## Step 2'),
      executeContent.indexOf('## Step 3')
    );
    expect(skillSection).toMatch(/error|fail/i);
    expect(skillSection).toMatch(/proceed|continue/i);
  });

  it('execute.md has error handling for observation capture', () => {
    const observeSection = executeContent.slice(
      executeContent.indexOf('## Step 4'),
      executeContent.indexOf('## Step 5')
    );
    expect(observeSection).toMatch(/error|fail/i);
    expect(observeSection).toMatch(/proceed|continue|skip/i);
  });

  it('verify.md has error handling for skill loading', () => {
    const skillSection = verifyContent.slice(
      verifyContent.indexOf('## Step 2'),
      verifyContent.indexOf('## Step 3')
    );
    expect(skillSection).toMatch(/error|fail/i);
    expect(skillSection).toMatch(/proceed|continue/i);
  });

  it('verify.md has error handling for observation capture', () => {
    const observeSection = verifyContent.slice(
      verifyContent.indexOf('## Step 4'),
      verifyContent.indexOf('## Step 5')
    );
    expect(observeSection).toMatch(/error|fail/i);
    expect(observeSection).toMatch(/proceed|continue|skip/i);
  });

  it('execute.md ensures GSD command is not blocked by failures', () => {
    expect(executeContent).toMatch(/never block|must never block|still runs normally/i);
  });

  it('verify.md ensures GSD command is not blocked by failures', () => {
    expect(verifyContent).toMatch(/never block|must never block|still runs normally/i);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: WRAP-07 transparency logging
// ---------------------------------------------------------------------------

describe('Cross-cutting: WRAP-07 transparency logging', () => {
  it('execute.md lists loaded skills in output', () => {
    expect(executeContent).toMatch(/[Ss]kills [Ll]oaded/);
  });

  it('verify.md lists loaded skills in output', () => {
    expect(verifyContent).toMatch(/[Ss]kills [Ll]oaded/);
  });

  it('execute.md shows observation capture status', () => {
    expect(executeContent).toMatch(/[Oo]bservation captured/i);
  });

  it('verify.md shows observation capture status', () => {
    expect(verifyContent).toMatch(/[Oo]bservation captured/i);
  });
});
