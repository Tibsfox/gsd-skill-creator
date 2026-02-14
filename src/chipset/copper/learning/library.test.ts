import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Pipeline } from '../types.js';
import type { LibraryEntry, FeedbackRecord } from './types.js';
import { PipelineLibrary, DEFAULT_LIBRARY_CONFIG } from './library.js';
import type { LibraryConfig, MatchResult } from './library.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Factory for creating a minimal valid Pipeline.
 * Configurable metadata name, confidence, and MOVE instruction names.
 */
function makeList(overrides: {
  name?: string;
  confidence?: number;
  moves?: string[];
  sourcePatterns?: string[];
  tags?: string[];
  version?: number;
} = {}): Pipeline {
  const {
    name = 'learning-wf-test',
    confidence = 0.8,
    moves = ['my-skill'],
    sourcePatterns = [],
    tags = ['learned'],
    version = 1,
  } = overrides;

  return {
    metadata: {
      name,
      description: `Learned list: ${name}`,
      sourcePatterns,
      tokenEstimate: 100,
      priority: 30,
      confidence,
      tags,
      version,
    },
    instructions: [
      { type: 'wait', event: 'phase-start' },
      ...moves.map((m) => ({
        type: 'move' as const,
        target: 'skill' as const,
        name: m,
        mode: 'lite' as const,
      })),
    ],
  };
}

/**
 * Factory for creating a minimal valid LibraryEntry from a list and workflowType.
 */
function makeEntry(overrides: {
  workflowType?: string;
  list?: Pipeline;
  version?: number;
  accuracy?: number;
  executionCount?: number;
  feedbackHistory?: FeedbackRecord[];
} = {}): LibraryEntry {
  const {
    workflowType = 'tdd-vitest-cycle',
    list = makeList(),
    version = 1,
    accuracy = 0.8,
    executionCount = 0,
    feedbackHistory = [],
  } = overrides;

  const now = Date.now();
  return {
    list,
    workflowType,
    version,
    createdAt: now,
    updatedAt: now,
    accuracy,
    executionCount,
    feedbackHistory,
  };
}

// ============================================================================
// PipelineLibrary Tests
// ============================================================================

describe('PipelineLibrary', () => {
  let library: InstanceType<typeof PipelineLibrary>;
  let tmpDir: string;

  beforeEach(async () => {
    library = new PipelineLibrary();
    tmpDir = await mkdtemp(join(tmpdir(), 'pipeline-library-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  it('add() stores a library entry and retrieves it by workflowType', () => {
    const entry = makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd' }),
    });

    library.add(entry);

    const result = library.get('tdd-vitest-cycle');
    expect(result).toBeDefined();
    expect(result!.workflowType).toBe('tdd-vitest-cycle');
    expect(result!.list.metadata.name).toBe('learning-wf-tdd');
  });

  it('add() throws if entry with same name already exists', () => {
    const entry1 = makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd' }),
    });
    const entry2 = makeEntry({
      workflowType: 'api-test-cycle',
      list: makeList({ name: 'learning-wf-tdd' }),
    });

    library.add(entry1);

    expect(() => library.add(entry2)).toThrow(/duplicate|already exists/i);
  });

  it('get() returns undefined for unknown workflowType', () => {
    const result = library.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('get() returns the latest version when multiple versions exist', () => {
    const entry = makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd-v1' }),
      version: 1,
    });

    library.add(entry);

    // Update to create version 2
    const updated = makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd-v2', confidence: 0.95 }),
      version: 1,
    });

    library.update(updated);

    const result = library.get('tdd-vitest-cycle');
    expect(result).toBeDefined();
    expect(result!.version).toBe(2);
  });

  it('getByName() retrieves by Pipeline metadata name', () => {
    const entry = makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd-vitest' }),
    });

    library.add(entry);

    const result = library.getByName('learning-wf-tdd-vitest');
    expect(result).toBeDefined();
    expect(result!.workflowType).toBe('tdd-vitest-cycle');
  });

  it('getByName() returns undefined for unknown name', () => {
    expect(library.getByName('nonexistent')).toBeUndefined();
  });

  it('update() replaces the entry and increments version', () => {
    const entry = makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd-v1' }),
      version: 1,
      accuracy: 0.7,
    });

    library.add(entry);

    const modified = makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd-updated', confidence: 0.99 }),
      version: 1,
      accuracy: 0.9,
    });

    library.update(modified);

    const result = library.get('tdd-vitest-cycle');
    expect(result).toBeDefined();
    expect(result!.version).toBe(2);
    expect(result!.accuracy).toBe(0.9);
  });

  it('remove() deletes an entry by workflowType', () => {
    const entry = makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd' }),
    });

    library.add(entry);
    library.remove('tdd-vitest-cycle');

    expect(library.get('tdd-vitest-cycle')).toBeUndefined();
  });

  it('remove() returns false for unknown workflowType', () => {
    expect(library.remove('nonexistent')).toBe(false);
  });

  it('list() returns all entries', () => {
    library.add(makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd' }),
    }));
    library.add(makeEntry({
      workflowType: 'api-test-cycle',
      list: makeList({ name: 'learning-wf-api' }),
    }));
    library.add(makeEntry({
      workflowType: 'deploy-workflow',
      list: makeList({ name: 'learning-wf-deploy' }),
    }));

    expect(library.list()).toHaveLength(3);
  });

  it('list() returns empty array when library is empty', () => {
    expect(library.list()).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Version History
  // --------------------------------------------------------------------------

  it('getVersionHistory() returns all versions of a workflowType', () => {
    const entry = makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd-v1' }),
      version: 1,
    });

    library.add(entry);

    // Update twice to create versions 2 and 3
    library.update(makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd-v2' }),
      version: 1,
    }));

    library.update(makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd-v3' }),
      version: 1,
    }));

    const history = library.getVersionHistory('tdd-vitest-cycle');
    expect(history).toHaveLength(3);

    const versions = history.map((e) => e.version);
    expect(versions).toEqual([1, 2, 3]);
  });

  // --------------------------------------------------------------------------
  // Best-Match Retrieval
  // --------------------------------------------------------------------------

  it('findBestMatch() returns the entry with highest tool/command overlap', () => {
    library.add(makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({
        name: 'learning-wf-tdd',
        sourcePatterns: ['vitest', 'Read', 'Write'],
        moves: ['vitest-runner'],
      }),
    }));

    library.add(makeEntry({
      workflowType: 'api-test-cycle',
      list: makeList({
        name: 'learning-wf-api',
        sourcePatterns: ['curl', 'Read', 'Write'],
        moves: ['curl-tester'],
      }),
    }));

    library.add(makeEntry({
      workflowType: 'deploy-workflow',
      list: makeList({
        name: 'learning-wf-deploy',
        sourcePatterns: ['vercel', 'Read'],
        moves: ['deploy-script'],
      }),
    }));

    const match = library.findBestMatch({
      tools: ['vitest', 'Read'],
      commands: ['npx vitest'],
    });

    expect(match).toBeDefined();
    expect(match!.entry.workflowType).toBe('tdd-vitest-cycle');
    expect(match!.score).toBeGreaterThan(0);
  });

  it('findBestMatch() returns undefined when no entries match', () => {
    library.add(makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({
        name: 'learning-wf-tdd',
        sourcePatterns: ['vitest'],
      }),
    }));

    const match = library.findBestMatch({
      tools: ['completely-unknown-tool'],
      commands: ['completely-unknown-command'],
    });

    expect(match).toBeUndefined();
  });

  it('findBestMatch() returns the higher-confidence entry on ties', () => {
    library.add(makeEntry({
      workflowType: 'low-conf-cycle',
      list: makeList({
        name: 'learning-wf-low',
        sourcePatterns: ['vitest', 'Read'],
        confidence: 0.5,
      }),
      accuracy: 0.5,
    }));

    library.add(makeEntry({
      workflowType: 'high-conf-cycle',
      list: makeList({
        name: 'learning-wf-high',
        sourcePatterns: ['vitest', 'Read'],
        confidence: 0.9,
      }),
      accuracy: 0.9,
    }));

    const match = library.findBestMatch({
      tools: ['vitest', 'Read'],
      commands: [],
    });

    expect(match).toBeDefined();
    expect(match!.entry.workflowType).toBe('high-conf-cycle');
  });

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  it('save() persists library to JSON file on disk', async () => {
    library.add(makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd' }),
    }));
    library.add(makeEntry({
      workflowType: 'api-test-cycle',
      list: makeList({ name: 'learning-wf-api' }),
    }));

    const filePath = join(tmpDir, 'library.json');
    await library.save(filePath);

    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);

    expect(data.entries).toHaveLength(2);
  });

  it('load() reads library from JSON file on disk', async () => {
    // Save entries to disk first
    const original = new PipelineLibrary();
    original.add(makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd' }),
    }));
    original.add(makeEntry({
      workflowType: 'api-test-cycle',
      list: makeList({ name: 'learning-wf-api' }),
    }));

    const filePath = join(tmpDir, 'library.json');
    await original.save(filePath);

    // Load into a new library
    const loaded = new PipelineLibrary();
    await loaded.load(filePath);

    expect(loaded.list()).toHaveLength(2);
  });

  it('load() validates lists against PipelineSchema and skips invalid', async () => {
    // Create a JSON file with one valid and one invalid entry
    const validEntry = makeEntry({
      workflowType: 'valid-cycle',
      list: makeList({ name: 'learning-wf-valid' }),
    });

    const invalidEntry = makeEntry({
      workflowType: 'invalid-cycle',
      list: {
        metadata: { name: 'learning-wf-invalid' },
        instructions: [], // Invalid: must have at least one instruction
      } as unknown as Pipeline,
    });

    const data = {
      entries: [
        { workflowType: 'valid-cycle', versions: [validEntry] },
        { workflowType: 'invalid-cycle', versions: [invalidEntry] },
      ],
    };

    const filePath = join(tmpDir, 'library.json');
    const { writeFile } = await import('node:fs/promises');
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    const loaded = new PipelineLibrary();
    await loaded.load(filePath);

    // Only the valid entry should be loaded
    expect(loaded.list()).toHaveLength(1);
    expect(loaded.get('valid-cycle')).toBeDefined();
    expect(loaded.get('invalid-cycle')).toBeUndefined();
  });

  it('load() from nonexistent file is a no-op (no error)', async () => {
    const loaded = new PipelineLibrary();
    await loaded.load('/tmp/nonexistent-pipeline-library-test-12345.json');

    expect(loaded.list()).toEqual([]);
  });

  it('save() then load() round-trips correctly', async () => {
    library.add(makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd', confidence: 0.85 }),
      accuracy: 0.85,
      version: 1,
    }));
    library.add(makeEntry({
      workflowType: 'api-test-cycle',
      list: makeList({ name: 'learning-wf-api', confidence: 0.7 }),
      accuracy: 0.7,
      version: 1,
    }));

    // Update one entry to create version 2
    library.update(makeEntry({
      workflowType: 'tdd-vitest-cycle',
      list: makeList({ name: 'learning-wf-tdd-v2', confidence: 0.95 }),
      accuracy: 0.95,
    }));

    const filePath = join(tmpDir, 'library.json');
    await library.save(filePath);

    const loaded = new PipelineLibrary();
    await loaded.load(filePath);

    // Check entries
    expect(loaded.list()).toHaveLength(2);

    const tdd = loaded.get('tdd-vitest-cycle');
    expect(tdd).toBeDefined();
    expect(tdd!.version).toBe(2);
    expect(tdd!.accuracy).toBe(0.95);

    const api = loaded.get('api-test-cycle');
    expect(api).toBeDefined();
    expect(api!.workflowType).toBe('api-test-cycle');

    // Check version history round-tripped
    const history = loaded.getVersionHistory('tdd-vitest-cycle');
    expect(history).toHaveLength(2);
  });
});
