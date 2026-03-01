/**
 * Gate evaluation tests for the autonomy execution engine.
 *
 * Tests checkpoint (every 10), half-transition (midpoint),
 * and graduation (final) gates that fire at specific subversion
 * boundaries during autonomous execution.
 *
 * Uses real filesystem I/O in temp directories.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isCheckpointSubversion,
  isHalfTransition,
  isGraduation,
  GateEvaluator,
} from './gates.js';
import { createExecutionState, transition } from './state-machine.js';
import { writeExecutionState, readExecutionState } from './persistence.js';
import type { ExecutionState } from './types.js';

describe('gates', () => {
  let tempDir: string;
  let outputDir: string;
  let statePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'autonomy-gates-'));
    outputDir = join(tempDir, 'output');
    statePath = join(tempDir, 'execution-state.json');
    await mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // =========================================================================
  // isCheckpointSubversion
  // =========================================================================
  describe('isCheckpointSubversion', () => {
    it('returns true for subversion 9 (10th completion, 0-indexed)', () => {
      expect(isCheckpointSubversion(9)).toBe(true);
    });

    it('returns true for subversion 19', () => {
      expect(isCheckpointSubversion(19)).toBe(true);
    });

    it('returns true for subversion 29', () => {
      expect(isCheckpointSubversion(29)).toBe(true);
    });

    it('returns true for subversion 49', () => {
      expect(isCheckpointSubversion(49)).toBe(true);
    });

    it('returns true for subversion 99', () => {
      expect(isCheckpointSubversion(99)).toBe(true);
    });

    it('returns false for subversion 0', () => {
      expect(isCheckpointSubversion(0)).toBe(false);
    });

    it('returns false for subversion 5', () => {
      expect(isCheckpointSubversion(5)).toBe(false);
    });

    it('returns false for subversion 10', () => {
      expect(isCheckpointSubversion(10)).toBe(false);
    });

    it('supports custom interval', () => {
      expect(isCheckpointSubversion(4, 5)).toBe(true);
      expect(isCheckpointSubversion(9, 5)).toBe(true);
      expect(isCheckpointSubversion(3, 5)).toBe(false);
    });
  });

  // =========================================================================
  // isHalfTransition
  // =========================================================================
  describe('isHalfTransition', () => {
    it('returns true for subversion 49 (midpoint of 100)', () => {
      expect(isHalfTransition(49)).toBe(true);
    });

    it('returns false for subversion 50', () => {
      expect(isHalfTransition(50)).toBe(false);
    });

    it('returns false for subversion 48', () => {
      expect(isHalfTransition(48)).toBe(false);
    });

    it('returns true for subversion 24 with total=50', () => {
      expect(isHalfTransition(24, 50)).toBe(true);
    });

    it('returns true for subversion 4 with total=10', () => {
      expect(isHalfTransition(4, 10)).toBe(true);
    });
  });

  // =========================================================================
  // isGraduation
  // =========================================================================
  describe('isGraduation', () => {
    it('returns true for subversion 99 (final of 100)', () => {
      expect(isGraduation(99)).toBe(true);
    });

    it('returns false for subversion 98', () => {
      expect(isGraduation(98)).toBe(false);
    });

    it('returns false for subversion 100', () => {
      expect(isGraduation(100)).toBe(false);
    });

    it('returns true for subversion 49 with total=50', () => {
      expect(isGraduation(49, 50)).toBe(true);
    });
  });

  // =========================================================================
  // GateEvaluator — checkpoint gate
  // =========================================================================
  describe('GateEvaluator — checkpoint', () => {
    it('returns null for non-gate subversion (e.g., 5)', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      await writeExecutionState(state, statePath);

      const result = await evaluator.evaluateGates(5, state);
      expect(result.result).toBeNull();
    });

    it('transitions to CHECKPOINTING at subversion 9', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      await writeExecutionState(state, statePath);

      // Create checkpoint artifact
      await writeFile(join(outputDir, 'checkpoint-10.md'), '# Checkpoint 10\n\nSynthesis content here.');

      const result = await evaluator.evaluateGates(9, state);
      // Should have transitioned through CHECKPOINTING back to RUNNING
      expect(result.state.transitions.some(t => t.to === 'CHECKPOINTING')).toBe(true);
    });

    it('returns passed GateResult when artifact exists', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      await writeExecutionState(state, statePath);

      await writeFile(join(outputDir, 'checkpoint-10.md'), '# Checkpoint 10\n\nSynthesis content.');

      const result = await evaluator.evaluateGates(9, state);
      expect(result.result).not.toBeNull();
      expect(result.result!.passed).toBe(true);
      expect(result.result!.gate_type).toBe('checkpoint');
    });

    it('returns failed GateResult when artifact missing', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      await writeExecutionState(state, statePath);

      const result = await evaluator.evaluateGates(9, state);
      expect(result.result).not.toBeNull();
      expect(result.result!.passed).toBe(false);
      expect(result.result!.gate_type).toBe('checkpoint');
    });

    it('adds subversion to checkpoints array', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      await writeExecutionState(state, statePath);

      await writeFile(join(outputDir, 'checkpoint-10.md'), '# Checkpoint 10\nContent.');

      const result = await evaluator.evaluateGates(9, state);
      expect(result.state.checkpoints).toContain(9);
    });

    it('transitions back to RUNNING after checkpoint', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      await writeExecutionState(state, statePath);

      await writeFile(join(outputDir, 'checkpoint-10.md'), '# Checkpoint 10\nContent.');

      const result = await evaluator.evaluateGates(9, state);
      expect(result.state.status).toBe('RUNNING');
    });

    it('persists state after checkpoint gate', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      await writeExecutionState(state, statePath);

      await writeFile(join(outputDir, 'checkpoint-10.md'), '# Checkpoint 10\nContent.');

      await evaluator.evaluateGates(9, state);

      const persisted = await readExecutionState(statePath);
      expect(persisted.success).toBe(true);
      if (persisted.success) {
        expect(persisted.data.checkpoints).toContain(9);
      }
    });
  });

  // =========================================================================
  // GateEvaluator — half-transition gate
  // =========================================================================
  describe('GateEvaluator — half-transition', () => {
    it('transitions to PAUSED when synthesis report missing', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 49 };
      await writeExecutionState(state, statePath);

      const result = await evaluator.evaluateGates(49, state);
      expect(result.state.status).toBe('PAUSED');
    });

    it('sets resume_from when pausing at half-transition', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 49 };
      await writeExecutionState(state, statePath);

      const result = await evaluator.evaluateGates(49, state);
      expect(result.state.resume_from).toBe(50);
    });

    it('returns failed GateResult when synthesis too small', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 49 };
      await writeExecutionState(state, statePath);

      // Write a tiny synthesis file (< 100 bytes)
      await writeFile(join(outputDir, 'half-transition-synthesis.md'), 'too small');

      const result = await evaluator.evaluateGates(49, state);
      expect(result.result!.passed).toBe(false);
      expect(result.state.status).toBe('PAUSED');
    });

    it('returns passed GateResult when synthesis adequate', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 49 };
      await writeExecutionState(state, statePath);

      // Write adequate synthesis (>= 100 bytes)
      const content = '# Half-Transition Synthesis\n\n' + 'A'.repeat(100);
      await writeFile(join(outputDir, 'half-transition-synthesis.md'), content);

      const result = await evaluator.evaluateGates(49, state);
      expect(result.result!.passed).toBe(true);
      expect(result.result!.gate_type).toBe('half_transition');
      expect(result.state.status).toBe('RUNNING');
    });
  });

  // =========================================================================
  // GateEvaluator — graduation gate
  // =========================================================================
  describe('GateEvaluator — graduation', () => {
    it('transitions to COMPLETING at subversion 99', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 99 };
      await writeExecutionState(state, statePath);

      // Create adequate graduation synthesis
      const content = '# Graduation Synthesis\n\n' + 'A'.repeat(600);
      await writeFile(join(outputDir, 'graduation-synthesis.md'), content);

      const result = await evaluator.evaluateGates(99, state);
      // Should have gone through COMPLETING
      expect(result.state.transitions.some(t => t.to === 'COMPLETING')).toBe(true);
    });

    it('transitions to DONE when graduation synthesis adequate', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 99 };
      await writeExecutionState(state, statePath);

      const content = '# Graduation Synthesis\n\n' + 'A'.repeat(600);
      await writeFile(join(outputDir, 'graduation-synthesis.md'), content);

      const result = await evaluator.evaluateGates(99, state);
      expect(result.state.status).toBe('DONE');
      expect(result.result!.passed).toBe(true);
      expect(result.result!.gate_type).toBe('graduation');
    });

    it('stays in COMPLETING when graduation synthesis missing', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 99 };
      await writeExecutionState(state, statePath);

      const result = await evaluator.evaluateGates(99, state);
      expect(result.state.status).toBe('COMPLETING');
      expect(result.result!.passed).toBe(false);
    });

    it('stays in COMPLETING when graduation synthesis too small', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 99 };
      await writeExecutionState(state, statePath);

      // Write undersized synthesis (< 500 bytes)
      await writeFile(join(outputDir, 'graduation-synthesis.md'), '# Too short\n\nNot enough.');

      const result = await evaluator.evaluateGates(99, state);
      expect(result.state.status).toBe('COMPLETING');
      expect(result.result!.passed).toBe(false);
    });

    it('returns GateResult with gate_type graduation', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 99 };
      await writeExecutionState(state, statePath);

      const content = '# Graduation\n\n' + 'A'.repeat(600);
      await writeFile(join(outputDir, 'graduation-synthesis.md'), content);

      const result = await evaluator.evaluateGates(99, state);
      expect(result.result!.gate_type).toBe('graduation');
    });
  });

  // =========================================================================
  // GateEvaluator — gate priority (half-transition and graduation also match checkpoint)
  // =========================================================================
  describe('GateEvaluator — gate priority', () => {
    it('evaluates half-transition gate at subversion 49 (not just checkpoint)', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 49 };
      await writeExecutionState(state, statePath);

      const content = '# Half-Transition Synthesis\n\n' + 'A'.repeat(100);
      await writeFile(join(outputDir, 'half-transition-synthesis.md'), content);

      const result = await evaluator.evaluateGates(49, state);
      // Should identify as half_transition, not just checkpoint
      expect(result.result!.gate_type).toBe('half_transition');
    });

    it('evaluates graduation gate at subversion 99 (not just checkpoint)', async () => {
      const evaluator = new GateEvaluator({ outputDir, statePath });
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 99 };
      await writeExecutionState(state, statePath);

      const content = '# Graduation\n\n' + 'A'.repeat(600);
      await writeFile(join(outputDir, 'graduation-synthesis.md'), content);

      const result = await evaluator.evaluateGates(99, state);
      expect(result.result!.gate_type).toBe('graduation');
    });
  });
});
