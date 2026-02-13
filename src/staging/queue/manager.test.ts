/**
 * Tests for the queue manager facade.
 *
 * Verifies unified API for adding entries, transitioning states,
 * querying the queue, running analysis, and automatic audit logging.
 * Uses mock deps throughout (no real filesystem).
 *
 * @module staging/queue/manager.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQueueManager } from './manager.js';
import type { QueueManagerDeps } from './manager.js';
import type { QueueEntry, QueueAuditEntry, QueueState } from './types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeQueueEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    id: 'q-20240101-001',
    filename: 'vision.md',
    state: 'uploaded',
    milestoneName: 'v1.0 Foundation',
    domain: 'infrastructure',
    tags: ['auth', 'storage'],
    resourceManifestPath: '.planning/staging/ready/vision.manifest.json',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// Mock deps
// ============================================================================

interface MockDeps extends QueueManagerDeps {
  appendedAuditEntries: QueueAuditEntry[];
  writtenFiles: Array<{ path: string; data: string }>;
  fileContents: Map<string, string>;
}

function makeMockDeps(initialState: QueueEntry[] = []): MockDeps {
  const appendedAuditEntries: QueueAuditEntry[] = [];
  const writtenFiles: Array<{ path: string; data: string }> = [];
  const fileContents = new Map<string, string>();

  // Seed queue-state.json
  fileContents.set(
    'queue-state.json',
    JSON.stringify(initialState),
  );

  return {
    appendedAuditEntries,
    writtenFiles,
    fileContents,

    appendAuditEntry: vi.fn(async (entry: QueueAuditEntry) => {
      appendedAuditEntries.push(entry);
    }),

    readAuditLog: vi.fn(async () => appendedAuditEntries),

    readFile: vi.fn(async (path: string) => {
      // Match on the filename portion for flexibility
      for (const [key, value] of fileContents) {
        if (path.endsWith(key)) {
          return value;
        }
      }
      const err = new Error(`ENOENT: ${path}`);
      (err as NodeJS.ErrnoException).code = 'ENOENT';
      throw err;
    }),

    writeFile: vi.fn(async (path: string, data: string) => {
      writtenFiles.push({ path, data });
      // Update the in-memory store so subsequent reads see the write
      for (const key of fileContents.keys()) {
        if (path.endsWith(key)) {
          fileContents.set(key, data);
          return;
        }
      }
      // Store with the full path as key
      fileContents.set(path, data);
    }),

    mkdir: vi.fn(async () => undefined),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('QueueManager', () => {
  let deps: MockDeps;

  beforeEach(() => {
    deps = makeMockDeps();
  });

  // --------------------------------------------------------------------------
  // addEntry
  // --------------------------------------------------------------------------

  describe('addEntry', () => {
    it('creates entry with uploaded state and records audit entry', async () => {
      const manager = createQueueManager({ basePath: '/project' }, deps);

      const entry = await manager.addEntry({
        filename: 'vision.md',
        milestoneName: 'v1.0 Foundation',
        domain: 'infrastructure',
        tags: ['auth', 'storage'],
        resourceManifestPath: '.planning/staging/ready/vision.manifest.json',
      });

      expect(entry.state).toBe('uploaded');
      expect(entry.filename).toBe('vision.md');
      expect(entry.milestoneName).toBe('v1.0 Foundation');
      expect(entry.domain).toBe('infrastructure');
      expect(entry.tags).toEqual(['auth', 'storage']);
      expect(entry.resourceManifestPath).toBe(
        '.planning/staging/ready/vision.manifest.json',
      );
      expect(entry.id).toMatch(/^q-\d{8}-\d+$/);
      expect(entry.createdAt).toBeTruthy();
      expect(entry.updatedAt).toBeTruthy();

      // Verify audit entry recorded
      expect(deps.appendedAuditEntries).toHaveLength(1);
      expect(deps.appendedAuditEntries[0].action).toBe('create');
      expect(deps.appendedAuditEntries[0].fromState).toBeNull();
      expect(deps.appendedAuditEntries[0].toState).toBe('uploaded');
      expect(deps.appendedAuditEntries[0].actor).toBe('system');
      expect(deps.appendedAuditEntries[0].entryId).toBe(entry.id);
    });

    it('generates unique sequential ids', async () => {
      const manager = createQueueManager({ basePath: '/project' }, deps);

      const entry1 = await manager.addEntry({
        filename: 'a.md',
        milestoneName: 'A',
        domain: 'auth',
        tags: [],
        resourceManifestPath: '/a.manifest.json',
      });

      const entry2 = await manager.addEntry({
        filename: 'b.md',
        milestoneName: 'B',
        domain: 'api',
        tags: [],
        resourceManifestPath: '/b.manifest.json',
      });

      expect(entry1.id).not.toBe(entry2.id);
      // Both have the q- prefix
      expect(entry1.id).toMatch(/^q-/);
      expect(entry2.id).toMatch(/^q-/);
    });

    it('persists state to queue-state.json', async () => {
      const manager = createQueueManager({ basePath: '/project' }, deps);

      await manager.addEntry({
        filename: 'vision.md',
        milestoneName: 'v1.0',
        domain: 'infra',
        tags: [],
        resourceManifestPath: '/v.manifest.json',
      });

      // writeFile should have been called with queue-state.json
      expect(deps.writtenFiles.length).toBeGreaterThanOrEqual(1);
      const lastWrite = deps.writtenFiles[deps.writtenFiles.length - 1];
      expect(lastWrite.path).toContain('queue-state.json');
      const parsed = JSON.parse(lastWrite.data);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].filename).toBe('vision.md');
    });
  });

  // --------------------------------------------------------------------------
  // transition
  // --------------------------------------------------------------------------

  describe('transition', () => {
    it('moves entry to valid state and records audit entry', async () => {
      const existing = makeQueueEntry({ id: 'q-20240101-001', state: 'uploaded' });
      deps = makeMockDeps([existing]);
      const manager = createQueueManager({ basePath: '/project' }, deps);

      const updated = await manager.transition(
        'q-20240101-001',
        'checking',
        'user',
        'Start processing',
      );

      expect(updated.state).toBe('checking');
      expect(updated.id).toBe('q-20240101-001');

      // Verify audit entry
      expect(deps.appendedAuditEntries).toHaveLength(1);
      expect(deps.appendedAuditEntries[0].action).toBe('transition');
      expect(deps.appendedAuditEntries[0].fromState).toBe('uploaded');
      expect(deps.appendedAuditEntries[0].toState).toBe('checking');
      expect(deps.appendedAuditEntries[0].actor).toBe('user');
      expect(deps.appendedAuditEntries[0].rationale).toBe('Start processing');
    });

    it('throws for unknown entry id', async () => {
      const manager = createQueueManager({ basePath: '/project' }, deps);

      await expect(
        manager.transition('q-nonexistent', 'checking', 'user', 'test'),
      ).rejects.toThrow(/not found/i);
    });

    it('throws for invalid state transition (delegates to state-machine)', async () => {
      const existing = makeQueueEntry({ id: 'q-20240101-001', state: 'uploaded' });
      deps = makeMockDeps([existing]);
      const manager = createQueueManager({ basePath: '/project' }, deps);

      // uploaded -> executing is not valid
      await expect(
        manager.transition('q-20240101-001', 'executing', 'user', 'skip ahead'),
      ).rejects.toThrow(/invalid/i);
    });

    it('persists updated state to queue-state.json', async () => {
      const existing = makeQueueEntry({ id: 'q-20240101-001', state: 'uploaded' });
      deps = makeMockDeps([existing]);
      const manager = createQueueManager({ basePath: '/project' }, deps);

      await manager.transition('q-20240101-001', 'checking', 'user', 'process');

      const lastWrite = deps.writtenFiles[deps.writtenFiles.length - 1];
      const parsed = JSON.parse(lastWrite.data);
      expect(parsed[0].state).toBe('checking');
    });
  });

  // --------------------------------------------------------------------------
  // getEntry
  // --------------------------------------------------------------------------

  describe('getEntry', () => {
    it('returns entry by id', async () => {
      const existing = makeQueueEntry({ id: 'q-20240101-001' });
      deps = makeMockDeps([existing]);
      const manager = createQueueManager({ basePath: '/project' }, deps);

      // Trigger load by awaiting an async method
      await manager.getAuditLog();

      const entry = manager.getEntry('q-20240101-001');
      expect(entry).toBeDefined();
      expect(entry!.id).toBe('q-20240101-001');
    });

    it('returns undefined for unknown id', async () => {
      const manager = createQueueManager({ basePath: '/project' }, deps);

      // Trigger load by awaiting an async method
      await manager.getAuditLog();

      const entry = manager.getEntry('q-nonexistent');
      expect(entry).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // listEntries
  // --------------------------------------------------------------------------

  describe('listEntries', () => {
    it('returns all entries sorted by createdAt', async () => {
      const entries = [
        makeQueueEntry({ id: 'q-20240101-002', createdAt: '2024-01-02T00:00:00Z' }),
        makeQueueEntry({ id: 'q-20240101-001', createdAt: '2024-01-01T00:00:00Z' }),
        makeQueueEntry({ id: 'q-20240101-003', createdAt: '2024-01-03T00:00:00Z' }),
      ];
      deps = makeMockDeps(entries);
      const manager = createQueueManager({ basePath: '/project' }, deps);

      // Trigger load by awaiting an async method
      await manager.getAuditLog();

      const result = manager.listEntries();
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('q-20240101-001');
      expect(result[1].id).toBe('q-20240101-002');
      expect(result[2].id).toBe('q-20240101-003');
    });

    it('filters by state when filter provided', async () => {
      const entries = [
        makeQueueEntry({ id: 'q-1', state: 'uploaded', createdAt: '2024-01-01T00:00:00Z' }),
        makeQueueEntry({ id: 'q-2', state: 'checking', createdAt: '2024-01-02T00:00:00Z' }),
        makeQueueEntry({ id: 'q-3', state: 'uploaded', createdAt: '2024-01-03T00:00:00Z' }),
      ];
      deps = makeMockDeps(entries);
      const manager = createQueueManager({ basePath: '/project' }, deps);

      // Trigger load by awaiting an async method
      await manager.getAuditLog();

      const result = manager.listEntries({ state: 'uploaded' });
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.state === 'uploaded')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // analyzeQueue
  // --------------------------------------------------------------------------

  describe('analyzeQueue', () => {
    it('calls dependency detector and optimization analyzer', async () => {
      const entries = [
        makeQueueEntry({
          id: 'q-1',
          domain: 'auth',
          milestoneName: 'Auth',
          createdAt: '2024-01-01T00:00:00Z',
        }),
        makeQueueEntry({
          id: 'q-2',
          domain: 'auth',
          milestoneName: 'Auth v2',
          createdAt: '2024-01-02T00:00:00Z',
        }),
      ];
      deps = makeMockDeps(entries);

      // Set up manifest files on disk
      const manifest = {
        visionAnalysis: {
          summary: 'Auth system',
          requirements: [{ category: 'authentication', description: 'login', complexity: 'medium', source: 'test' }],
          complexitySignals: [],
          ambiguityMarkers: [],
          dependencies: [],
        },
        skillMatches: [],
        topology: { topology: 'single', confidence: 0.8, rationale: 'simple' },
        tokenBudget: { total: 1000, categories: [], safetyMargin: 50, utilizationTarget: 0.7 },
        decomposition: { subtasks: [], criticalPath: [], maxParallelism: 1, totalDuration: '1h' },
        hitlPredictions: [],
        queueContext: { priority: 1, estimatedDuration: '1h', tags: ['auth'] },
      };

      deps.fileContents.set(
        'vision.manifest.json',
        JSON.stringify(manifest),
      );

      const manager = createQueueManager({ basePath: '/project' }, deps);
      const analysis = await manager.analyzeQueue();

      expect(analysis).toHaveProperty('dependencies');
      expect(analysis).toHaveProperty('optimizations');
      expect(analysis.dependencies).toHaveProperty('edges');
      expect(analysis.dependencies).toHaveProperty('entryIds');
      expect(Array.isArray(analysis.optimizations)).toBe(true);
    });

    it('handles entries without manifests on disk gracefully', async () => {
      // Use different domains to avoid domain-based batching
      const entries = [
        makeQueueEntry({
          id: 'q-1',
          domain: 'auth',
          resourceManifestPath: '/nonexistent.manifest.json',
          createdAt: '2024-01-01T00:00:00Z',
        }),
        makeQueueEntry({
          id: 'q-2',
          domain: 'storage',
          resourceManifestPath: '/also-nonexistent.manifest.json',
          createdAt: '2024-01-02T00:00:00Z',
        }),
      ];
      deps = makeMockDeps(entries);
      const manager = createQueueManager({ basePath: '/project' }, deps);

      // Should not throw, just skip entries without manifests
      const analysis = await manager.analyzeQueue();
      expect(analysis.dependencies.edges).toEqual([]);
      // No domain batching or shared-setup without manifests (different domains)
      // Parallel lanes can still be detected (independent entries)
      const batchSuggestions = analysis.optimizations.filter((o) => o.type === 'batch');
      const sharedSetupSuggestions = analysis.optimizations.filter((o) => o.type === 'shared-setup');
      expect(batchSuggestions).toEqual([]);
      expect(sharedSetupSuggestions).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // getAuditLog
  // --------------------------------------------------------------------------

  describe('getAuditLog', () => {
    it('returns all audit entries', async () => {
      const auditEntry: QueueAuditEntry = {
        id: 'audit-20240101-120000-001',
        entryId: 'q-1',
        action: 'create',
        fromState: null,
        toState: 'uploaded',
        actor: 'system',
        rationale: 'Initial upload',
        timestamp: '2024-01-01T12:00:00Z',
      };

      deps = makeMockDeps();
      deps.appendedAuditEntries.push(auditEntry);

      const manager = createQueueManager({ basePath: '/project' }, deps);
      const log = await manager.getAuditLog();

      expect(log).toHaveLength(1);
      expect(log[0].action).toBe('create');
    });
  });

  // --------------------------------------------------------------------------
  // DI override
  // --------------------------------------------------------------------------

  describe('dependency injection', () => {
    it('all deps can be overridden independently', async () => {
      const customAppend = vi.fn(async () => {});
      const customReadLog = vi.fn(async () => []);
      const customReadFile = vi.fn(async () => '[]');
      const customWriteFile = vi.fn(async () => {});
      const customMkdir = vi.fn(async () => undefined);

      const manager = createQueueManager({ basePath: '/project' }, {
        appendAuditEntry: customAppend,
        readAuditLog: customReadLog,
        readFile: customReadFile,
        writeFile: customWriteFile,
        mkdir: customMkdir,
      });

      await manager.addEntry({
        filename: 'test.md',
        milestoneName: 'Test',
        domain: 'test',
        tags: [],
        resourceManifestPath: '/test.manifest.json',
      });

      expect(customAppend).toHaveBeenCalled();
      expect(customWriteFile).toHaveBeenCalled();
      expect(customMkdir).toHaveBeenCalled();
    });
  });
});
