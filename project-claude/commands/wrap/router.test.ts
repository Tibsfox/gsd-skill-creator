import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const commandDir = dirname(fileURLToPath(import.meta.url));
const planContent = readFileSync(join(commandDir, 'plan.md'), 'utf-8');
const phaseContent = readFileSync(join(commandDir, 'phase.md'), 'utf-8');

// ---------------------------------------------------------------------------
// /wrap:plan command structure (WRAP-03)
// ---------------------------------------------------------------------------

describe('/wrap:plan command structure (WRAP-03)', () => {
  it('has YAML frontmatter with name wrap:plan', () => {
    expect(planContent).toMatch(/^---\n[\s\S]*?name:\s*wrap:plan[\s\S]*?---/);
  });

  it('has description in frontmatter', () => {
    expect(planContent).toMatch(/^---\n[\s\S]*?description:[\s\S]*?---/);
  });

  it('has allowed-tools in frontmatter including Task', () => {
    expect(planContent).toMatch(/^---\n[\s\S]*?allowed-tools:[\s\S]*?Task[\s\S]*?---/);
  });

  it('has objective, process, and success_criteria sections', () => {
    expect(planContent).toContain('<objective>');
    expect(planContent).toContain('</objective>');
    expect(planContent).toContain('<process>');
    expect(planContent).toContain('</process>');
    expect(planContent).toContain('<success_criteria>');
    expect(planContent).toContain('</success_criteria>');
  });

  it('references skill-creator.json for config (WRAP-05)', () => {
    expect(planContent).toContain('skill-creator.json');
  });

  it('references GSD plan-phase for delegation', () => {
    expect(planContent).toMatch(/gsd:plan-phase|plan-phase/);
  });

  it('references sessions.jsonl for observation capture', () => {
    expect(planContent).toContain('sessions.jsonl');
  });

  it('describes skill loading', () => {
    expect(planContent).toMatch(/[Ss]kill.*[Ll]oad/);
  });

  it('references prior SUMMARY scanning', () => {
    expect(planContent).toMatch(/SUMMARY/);
  });

  it('includes graceful degradation (WRAP-06)', () => {
    expect(planContent).toMatch(/fail|error|encounter/i);
    expect(planContent).toMatch(/proceed|continue|skip/i);
  });

  it('includes transparency summary (WRAP-07)', () => {
    expect(planContent).toMatch(
      /[Ww]rapper [Ss]ummary|[Tt]ransparency|[Pp]lanning [Cc]ontext/,
    );
  });

  it('references wrapper_commands toggle', () => {
    expect(planContent).toContain('wrapper_commands');
  });

  it('has wrapper_planning type in observation', () => {
    expect(planContent).toContain('wrapper_planning');
  });

  it('does not contain stub markers', () => {
    expect(planContent).not.toMatch(/\bTODO\b/);
    expect(planContent).not.toMatch(/\bStub:/);
  });

  it('is at least 80 lines', () => {
    const lineCount = planContent.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(80);
  });
});

// ---------------------------------------------------------------------------
// /wrap:phase smart router structure (WRAP-04)
// ---------------------------------------------------------------------------

describe('/wrap:phase smart router structure (WRAP-04)', () => {
  it('has YAML frontmatter with name wrap:phase', () => {
    expect(phaseContent).toMatch(/^---\n[\s\S]*?name:\s*wrap:phase[\s\S]*?---/);
  });

  it('has description mentioning router or detect', () => {
    expect(phaseContent).toMatch(/router|detect/i);
  });

  it('has objective, process, and success_criteria sections', () => {
    expect(phaseContent).toContain('<objective>');
    expect(phaseContent).toContain('</objective>');
    expect(phaseContent).toContain('<process>');
    expect(phaseContent).toContain('</process>');
    expect(phaseContent).toContain('<success_criteria>');
    expect(phaseContent).toContain('</success_criteria>');
  });

  it('references skill-creator.json for config (WRAP-05)', () => {
    expect(phaseContent).toContain('skill-creator.json');
  });

  it('references ROADMAP.md for phase state detection', () => {
    expect(phaseContent).toContain('ROADMAP.md');
  });

  it('references STATE.md for current position', () => {
    expect(phaseContent).toContain('STATE.md');
  });

  it('checks for PLAN files', () => {
    expect(phaseContent).toMatch(/PLAN.*file|PLAN\.md/);
  });

  it('checks for SUMMARY files', () => {
    expect(phaseContent).toMatch(/SUMMARY.*file|SUMMARY\.md/);
  });

  it('checks for VERIFICATION file', () => {
    expect(phaseContent).toMatch(/VERIFICATION/);
  });

  it('routes to wrap:plan', () => {
    expect(phaseContent).toContain('wrap:plan');
  });

  it('routes to wrap:execute', () => {
    expect(phaseContent).toContain('wrap:execute');
  });

  it('routes to wrap:verify', () => {
    expect(phaseContent).toContain('wrap:verify');
  });

  it('includes routing decision display (WRAP-07)', () => {
    expect(phaseContent).toMatch(/[Dd]ecision|[Rr]outing/);
  });

  it('includes graceful fallback on detection failure (WRAP-06)', () => {
    expect(phaseContent).toMatch(/[Cc]ould not determine|fallback|fail/i);
  });

  it('references wrapper_commands toggle', () => {
    expect(phaseContent).toContain('wrapper_commands');
  });

  it('does not contain stub markers', () => {
    expect(phaseContent).not.toMatch(/\bTODO\b/);
    expect(phaseContent).not.toMatch(/\bStub:/);
  });

  it('is at least 90 lines', () => {
    const lineCount = phaseContent.split('\n').length;
    expect(lineCount).toBeGreaterThanOrEqual(90);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: WRAP-05/06/07 in plan and phase
// ---------------------------------------------------------------------------

describe('Cross-cutting: WRAP-05/06/07 in plan and phase', () => {
  it('plan.md reads config before executing', () => {
    expect(planContent).toMatch(/[Ss]tep.*[Cc]onfig|[Rr]ead.*config/i);
  });

  it('phase.md reads config before routing', () => {
    expect(phaseContent).toMatch(/[Ss]tep.*[Cc]onfig|[Rr]ead.*config/i);
  });

  it('plan.md skill loading failure does not block GSD', () => {
    expect(planContent).toMatch(/[Pp]roceed.*without|[Cc]ontinue.*without/i);
  });

  it('phase.md detection failure falls back gracefully', () => {
    expect(phaseContent).toMatch(/[Cc]hoose|[Ff]all.*back/i);
  });
});
