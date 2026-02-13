/**
 * Tests for the kernel orchestrator.
 *
 * Validates kernel lifecycle (idle -> running -> stopped), tick cycle
 * with scheduler integration, message routing through inbound ports,
 * budget tracking via BudgetManager, sleep/wake delegation to
 * scheduler, and getState snapshot.
 */

import { describe, it, expect } from 'vitest';
import { ExecKernel } from './kernel.js';
import type { KernelConfig, KernelState } from './kernel.js';
import { createDefaultRegistry } from '../teams/chip-registry.js';
import { createMessage } from './messages.js';

// ============================================================================
// Helper: create a default kernel config
// ============================================================================

function defaultConfig(): KernelConfig {
  return {
    registry: createDefaultRegistry(),
    totalBudget: 100000,
  };
}

// ============================================================================
// ExecKernel -- initialization
// ============================================================================

describe('ExecKernel -- initialization', () => {
  it('creates kernel with engine registry', () => {
    const kernel = new ExecKernel(defaultConfig());
    const state = kernel.getState();
    expect(state.state).toBe('idle');
  });

  it('kernel state lifecycle: idle -> running -> stopped', () => {
    const kernel = new ExecKernel(defaultConfig());
    expect(kernel.getState().state).toBe('idle');

    kernel.start();
    expect(kernel.getState().state).toBe('running');

    kernel.stop();
    expect(kernel.getState().state).toBe('stopped');
  });
});

// ============================================================================
// ExecKernel -- tick cycle
// ============================================================================

describe('ExecKernel -- tick cycle', () => {
  it('tick() returns scheduled team order', () => {
    const kernel = new ExecKernel(defaultConfig());
    kernel.start();

    const result = kernel.tick();
    expect(result.scheduled).toBeInstanceOf(Array);
    expect(result.scheduled.length).toBe(4);
    expect(result.scheduled[0]).toBe('context-engine'); // highest priority (60)
    expect(result.tickCount).toBe(1);
  });

  it('tick() on idle kernel throws', () => {
    const kernel = new ExecKernel(defaultConfig());
    expect(() => kernel.tick()).toThrow('Kernel not running');
  });

  it('tick() on stopped kernel throws', () => {
    const kernel = new ExecKernel(defaultConfig());
    kernel.start();
    kernel.stop();
    expect(() => kernel.tick()).toThrow('Kernel not running');
  });
});

// ============================================================================
// ExecKernel -- message routing
// ============================================================================

describe('ExecKernel -- message routing', () => {
  it('sendMessage routes through kernel', () => {
    const kernel = new ExecKernel(defaultConfig());
    kernel.start();

    const message = createMessage({
      type: 'render-request',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: { format: 'markdown' },
      tokenCost: 100,
    });

    kernel.sendMessage(message);
    expect(kernel.getPendingMessages('render-engine')).toBe(1);
  });

  it('receiveMessages returns pending messages for an engine', () => {
    const kernel = new ExecKernel(defaultConfig());
    kernel.start();

    const message = createMessage({
      type: 'render-request',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: { format: 'markdown' },
      tokenCost: 100,
    });

    kernel.sendMessage(message);

    const received = kernel.receiveMessages('render-engine');
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('render-request');
    expect(received[0].sender).toBe('context-engine');

    // Calling again returns empty (messages consumed)
    const again = kernel.receiveMessages('render-engine');
    expect(again).toHaveLength(0);
  });
});

// ============================================================================
// ExecKernel -- budget integration
// ============================================================================

describe('ExecKernel -- budget integration', () => {
  it('tick reports budget status for all engines', () => {
    const kernel = new ExecKernel(defaultConfig());
    kernel.start();

    // Send a message with tokenCost 1000 -- sender pays
    const message = createMessage({
      type: 'render-request',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: {},
      tokenCost: 1000,
    });
    kernel.sendMessage(message);
    kernel.tick();

    const status = kernel.getBudgetStatus('context-engine');
    expect(status.spent).toBe(1000);
  });

  it('spending tracks via kernel.spend()', () => {
    const kernel = new ExecKernel(defaultConfig());
    kernel.start();

    kernel.spend('context-engine', 5000);
    const status = kernel.getBudgetStatus('context-engine');
    expect(status.spent).toBe(5000);
  });
});

// ============================================================================
// ExecKernel -- sleep/wake through kernel
// ============================================================================

describe('ExecKernel -- sleep/wake through kernel', () => {
  it('kernel.sleep() puts team to sleep', () => {
    const kernel = new ExecKernel(defaultConfig());
    kernel.start();

    kernel.sleep('render-engine');
    const result = kernel.tick();
    expect(result.scheduled).not.toContain('render-engine');
    expect(result.scheduled).toContain('context-engine');
  });

  it('kernel.wake() wakes team', () => {
    const kernel = new ExecKernel(defaultConfig());
    kernel.start();

    kernel.sleep('render-engine');
    kernel.wake('render-engine');
    const result = kernel.tick();
    expect(result.scheduled).toContain('render-engine');
  });
});

// ============================================================================
// ExecKernel -- getState
// ============================================================================

describe('ExecKernel -- getState', () => {
  it('getState returns kernel state snapshot', () => {
    const kernel = new ExecKernel(defaultConfig());
    kernel.start();

    // Do some work
    kernel.spend('context-engine', 1000);
    kernel.tick();

    const state = kernel.getState();
    expect(state.state).toBe('running');
    expect(state.tickCount).toBe(1);
    expect(state.engines).toBeInstanceOf(Array);
    expect(state.engines.length).toBe(4);

    // Find context-engine in the engines array
    const contextStatus = state.engines.find((c) => c.engineName === 'context-engine');
    expect(contextStatus).toBeDefined();
    expect(contextStatus!.spent).toBe(1000);
  });
});
