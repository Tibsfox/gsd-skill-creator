/**
 * Integration tests for the queue submodule barrel index.
 *
 * Verifies all type-only and value exports are importable and
 * have the expected types. Also verifies createQueueManager
 * returns an object with all expected methods.
 *
 * @module staging/queue/index.test
 */

import { describe, it, expect, vi } from 'vitest';
import {
  // Constants
  QUEUE_STATES,
  VALID_QUEUE_TRANSITIONS,
  OPTIMIZATION_TYPES,
  // Functions
  transitionQueueItem,
  appendAuditEntry,
  readAuditLog,
  detectDependencies,
  analyzeOptimizations,
  createQueueManager,
} from './index.js';

import type {
  // Type-only exports
  QueueState,
  QueueEntry,
  QueueAuditEntry,
  AuditLoggerDeps,
  DependencyEdge,
  DependencyGraph,
  OptimizationSuggestion,
  OptimizationType,
  QueueManagerDeps,
} from './index.js';

// ============================================================================
// Value exports
// ============================================================================

describe('queue barrel: value exports', () => {
  it('exports QUEUE_STATES as an array', () => {
    expect(Array.isArray(QUEUE_STATES)).toBe(true);
    expect(QUEUE_STATES.length).toBeGreaterThan(0);
  });

  it('exports VALID_QUEUE_TRANSITIONS as an object', () => {
    expect(typeof VALID_QUEUE_TRANSITIONS).toBe('object');
    expect(VALID_QUEUE_TRANSITIONS).not.toBeNull();
  });

  it('exports OPTIMIZATION_TYPES as an array', () => {
    expect(Array.isArray(OPTIMIZATION_TYPES)).toBe(true);
    expect(OPTIMIZATION_TYPES.length).toBeGreaterThan(0);
  });

  it('exports transitionQueueItem as a function', () => {
    expect(typeof transitionQueueItem).toBe('function');
  });

  it('exports appendAuditEntry as a function', () => {
    expect(typeof appendAuditEntry).toBe('function');
  });

  it('exports readAuditLog as a function', () => {
    expect(typeof readAuditLog).toBe('function');
  });

  it('exports detectDependencies as a function', () => {
    expect(typeof detectDependencies).toBe('function');
  });

  it('exports analyzeOptimizations as a function', () => {
    expect(typeof analyzeOptimizations).toBe('function');
  });

  it('exports createQueueManager as a function', () => {
    expect(typeof createQueueManager).toBe('function');
  });
});

// ============================================================================
// Type-only exports (compile-time verification)
// ============================================================================

describe('queue barrel: type-only exports', () => {
  it('type-only exports are importable', () => {
    // These are compile-time checks. If the imports above succeeded,
    // the types are importable. We verify by using them in type positions.
    const _state: QueueState = 'uploaded';
    const _entry: Partial<QueueEntry> = { id: 'q-1' };
    const _audit: Partial<QueueAuditEntry> = { id: 'audit-1' };
    const _deps: Partial<AuditLoggerDeps> = {};
    const _edge: Partial<DependencyEdge> = {};
    const _graph: Partial<DependencyGraph> = {};
    const _suggestion: Partial<OptimizationSuggestion> = {};
    const _type: OptimizationType = 'batch';
    const _managerDeps: Partial<QueueManagerDeps> = {};

    // Suppress unused variable warnings
    expect(_state).toBe('uploaded');
    expect(_entry.id).toBe('q-1');
    expect(_audit.id).toBe('audit-1');
    expect(_deps).toBeDefined();
    expect(_edge).toBeDefined();
    expect(_graph).toBeDefined();
    expect(_suggestion).toBeDefined();
    expect(_type).toBe('batch');
    expect(_managerDeps).toBeDefined();
  });
});

// ============================================================================
// createQueueManager interface
// ============================================================================

describe('queue barrel: createQueueManager returns expected methods', () => {
  it('returns object with all 6 queue manager methods', () => {
    const manager = createQueueManager({ basePath: '/test' }, {
      appendAuditEntry: vi.fn(async () => {}),
      readAuditLog: vi.fn(async () => []),
      readFile: vi.fn(async () => '[]'),
      writeFile: vi.fn(async () => {}),
      mkdir: vi.fn(async () => undefined),
    });

    expect(typeof manager.addEntry).toBe('function');
    expect(typeof manager.transition).toBe('function');
    expect(typeof manager.getEntry).toBe('function');
    expect(typeof manager.listEntries).toBe('function');
    expect(typeof manager.analyzeQueue).toBe('function');
    expect(typeof manager.getAuditLog).toBe('function');
  });
});
