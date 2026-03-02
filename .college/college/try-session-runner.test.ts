/**
 * Tests for TrySessionRunner -- interactive session lifecycle with
 * step navigation, concept tracking, and completion status.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  TrySessionRunner,
  type TrySessionDefinition,
  type TryStep,
} from './try-session-runner.js';
import { CollegeLoader } from './college-loader.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const testSession: TrySessionDefinition = {
  id: 'your-first-function',
  title: 'Your First Function',
  description: 'Learn to define and call a mathematical function',
  estimatedMinutes: 15,
  prerequisites: ['math-variables'],
  steps: [
    {
      instruction: 'Define a function f(x) = 2x + 1',
      expectedOutcome: 'A function that doubles input and adds one',
      hint: 'Start with the keyword "function" or "def"',
      conceptsExplored: ['math-functions', 'math-variables'],
    },
    {
      instruction: 'Call f(3) and verify the result',
      expectedOutcome: 'f(3) returns 7',
      conceptsExplored: ['math-evaluation'],
    },
    {
      instruction: 'Graph the function for x from -5 to 5',
      expectedOutcome: 'A straight line with slope 2 and y-intercept 1',
      hint: 'This is a linear function -- the graph is always a straight line',
      conceptsExplored: ['math-graphing', 'math-linear-functions'],
    },
  ],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TrySessionRunner', () => {
  it('start() initializes session state at step 0 with status active', () => {
    const runner = TrySessionRunner.start(testSession);
    const state = runner.getState();

    expect(state.sessionId).toBe('your-first-function');
    expect(state.title).toBe('Your First Function');
    expect(state.status).toBe('active');
    expect(state.currentStep).toBe(0);
    expect(state.totalSteps).toBe(3);
  });

  it('getCurrentStep() returns the current TryStep with instruction, expectedOutcome, and hint', () => {
    const runner = TrySessionRunner.start(testSession);
    const step = runner.getCurrentStep();

    expect(step.instruction).toBe('Define a function f(x) = 2x + 1');
    expect(step.expectedOutcome).toBe('A function that doubles input and adds one');
    expect(step.hint).toBe('Start with the keyword "function" or "def"');
    expect(step.conceptsExplored).toEqual(['math-functions', 'math-variables']);
  });

  it('nextStep() advances to the next step; returns null when at the last step', () => {
    const runner = TrySessionRunner.start(testSession);

    const step2 = runner.nextStep();
    expect(step2).not.toBeNull();
    expect(step2!.instruction).toBe('Call f(3) and verify the result');

    const step3 = runner.nextStep();
    expect(step3).not.toBeNull();
    expect(step3!.instruction).toBe('Graph the function for x from -5 to 5');

    const beyond = runner.nextStep();
    expect(beyond).toBeNull();
  });

  it('previousStep() goes back one step; returns null when at step 0', () => {
    const runner = TrySessionRunner.start(testSession);

    // Go to step 1
    runner.nextStep();
    expect(runner.getState().currentStep).toBe(1);

    // Go back to step 0
    const prev = runner.previousStep();
    expect(prev).not.toBeNull();
    expect(prev!.instruction).toBe('Define a function f(x) = 2x + 1');

    // Can't go back further
    const beyond = runner.previousStep();
    expect(beyond).toBeNull();
  });

  it('goToStep(n) jumps to specific step; throws RangeError for out-of-bounds', () => {
    const runner = TrySessionRunner.start(testSession);

    const step = runner.goToStep(2);
    expect(step.instruction).toBe('Graph the function for x from -5 to 5');

    expect(() => runner.goToStep(-1)).toThrow(RangeError);
    expect(() => runner.goToStep(3)).toThrow(RangeError);
  });

  it('getProgress() returns currentStep, totalSteps, and percentComplete', () => {
    const runner = TrySessionRunner.start(testSession);

    expect(runner.getProgress()).toEqual({
      currentStep: 0,
      totalSteps: 3,
      percentComplete: 0,
    });

    runner.completeStep(); // completes step 0, advances to step 1
    expect(runner.getProgress()).toEqual({
      currentStep: 1,
      totalSteps: 3,
      percentComplete: 33,
    });
  });

  it('conceptsExplored accumulates across steps without duplicates', () => {
    const runner = TrySessionRunner.start(testSession);

    // Step 0: math-functions, math-variables
    runner.nextStep(); // Step 1: math-evaluation
    runner.nextStep(); // Step 2: math-graphing, math-linear-functions

    const explored = runner.getConceptsExplored();
    expect(explored).toContain('math-functions');
    expect(explored).toContain('math-variables');
    expect(explored).toContain('math-evaluation');
    expect(explored).toContain('math-graphing');
    expect(explored).toContain('math-linear-functions');
    // No duplicates
    expect(new Set(explored).size).toBe(explored.length);
  });

  it('completeStep() marks current as complete and auto-advances; completing last step sets status to completed', () => {
    const runner = TrySessionRunner.start(testSession);

    // Complete step 0 -> advance to step 1
    const next1 = runner.completeStep();
    expect(next1).not.toBeNull();
    expect(runner.getState().currentStep).toBe(1);
    expect(runner.getState().stepsCompleted[0]).toBe(true);

    // Complete step 1 -> advance to step 2
    const next2 = runner.completeStep();
    expect(next2).not.toBeNull();
    expect(runner.getState().currentStep).toBe(2);

    // Complete step 2 (last step) -> status changes to completed
    const next3 = runner.completeStep();
    expect(next3).toBeNull();
    expect(runner.getState().status).toBe('completed');
    expect(runner.getState().completedAt).toBeDefined();
  });

  it('getState() returns full TrySessionState with metadata, position, concepts, and completion', () => {
    const runner = TrySessionRunner.start(testSession);
    runner.nextStep();

    const state = runner.getState();
    expect(state.sessionId).toBe('your-first-function');
    expect(state.title).toBe('Your First Function');
    expect(state.status).toBe('active');
    expect(state.currentStep).toBe(1);
    expect(state.totalSteps).toBe(3);
    expect(state.stepsCompleted).toEqual([false, false, false]);
    expect(state.conceptsExplored).toBeDefined();
    expect(state.startedAt).toBeInstanceOf(Date);
  });

  it('getPrerequisites() returns session prerequisites', () => {
    const runner = TrySessionRunner.start(testSession);
    expect(runner.getPrerequisites()).toEqual(['math-variables']);
  });

  describe('loadSession', () => {
    let sessionTempDir: string;

    beforeAll(() => {
      sessionTempDir = mkdtempSync(join(tmpdir(), 'try-session-test-'));

      const deptDir = join(sessionTempDir, 'test-dept');
      mkdirSync(join(deptDir, 'try-sessions'), { recursive: true });

      writeFileSync(
        join(deptDir, 'DEPARTMENT.md'),
        '# Test Department\n\n## Wings\n\n- Basics\n\n## Entry Point\n\ntest-intro\n',
      );

      writeFileSync(
        join(deptDir, 'try-sessions', 'getting-started.json'),
        JSON.stringify({
          id: 'getting-started',
          title: 'Getting Started',
          description: 'An introductory session',
          estimatedMinutes: 5,
          prerequisites: [],
          steps: [
            {
              instruction: 'Read the intro',
              expectedOutcome: 'Understanding',
              conceptsExplored: ['test-intro'],
            },
          ],
        }),
      );
    });

    afterAll(() => {
      rmSync(sessionTempDir, { recursive: true, force: true });
    });

    it('loadSession reads session definition from department try-sessions/ directory', async () => {
      const loader = new CollegeLoader(sessionTempDir);
      const runner = await TrySessionRunner.loadSession(loader, 'test-dept', 'getting-started');

      const state = runner.getState();
      expect(state.sessionId).toBe('getting-started');
      expect(state.title).toBe('Getting Started');
      expect(state.totalSteps).toBe(1);
    });
  });
});
