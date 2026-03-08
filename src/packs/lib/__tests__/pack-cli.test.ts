/**
 * PackCLI unit tests.
 *
 * Covers: initPack, listPacks, showPack, validatePack.
 * Uses vi.mock('fs') for synchronous fs operations and vi.mock for PackLoader.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Mock synchronous fs before importing the module under test
// ---------------------------------------------------------------------------

vi.mock('fs');

// ---------------------------------------------------------------------------
// Mock PackLoader — controls listing and loading behaviour per test
// Use vi.hoisted so the mock fns are available when the factory is evaluated
// ---------------------------------------------------------------------------

const { mockListPacks, mockLoadPack } = vi.hoisted(() => ({
  mockListPacks: vi.fn<() => string[]>(),
  mockLoadPack: vi.fn(),
}));

vi.mock('../pack-loader.js', () => {
  const PackLoader = vi.fn(function (this: any) {
    this.listPacks = mockListPacks;
    this.loadPack = mockLoadPack;
  });
  return { PackLoader };
});

// ---------------------------------------------------------------------------
// Import after mocks are hoisted
// ---------------------------------------------------------------------------

import * as fs from 'fs';
import { PackCLI } from '../pack-cli.js';
import { PackDocumentSchema } from '../pack-types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PACKS_DIR = '/test/packs';

/** Minimal valid PackDocument matching PackDocumentSchema */
function makeValidPack(overrides: Partial<ReturnType<typeof PackDocumentSchema.parse>> = {}): ReturnType<typeof PackDocumentSchema.parse> {
  return {
    metadata: {
      id: 'test-pack',
      title: 'Test Pack',
      description: 'A test pack for testing.',
      type: 'mission',
      category: 'test',
      author: 'Tester',
      version: '0.1.0',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      passion_alignment: ['explorers'],
      estimated_duration: { min_hours: 1, max_hours: 3 },
      difficulty: 'beginner',
    },
    mission: {
      goal: 'Learn testing',
      scope: 'Unit tests only',
      success_criteria: ['Tests pass'],
    },
    roles: [
      {
        id: 'learner',
        title: 'Test Learner',
        description: 'You in this pack',
        complex_plane_position: { real: 0.5, imaginary: 0.5 },
        responsibilities: ['Learn', 'Test'],
      },
    ],
    phases: [
      {
        id: 'phase-1-setup',
        title: 'Phase 1: Setup',
        description: 'Get ready',
        estimated_duration_minutes: 15,
        sequence: 1,
        objectives: ['Understand the goal'],
        instructions: '## Phase 1\n\nBegin here.',
        resources: [],
        exit_points: [
          { label: 'Too confusing', safe_retreat: 'Ask for help' },
        ],
        checkpoint: {
          question: 'Are you ready?',
          success_criteria: ['You understand the goal'],
        },
      },
    ],
    assessments: [
      {
        type: 'checkpoint',
        prompt: 'What did you learn?',
        success_indicators: ['Specific example'],
        feedback_template: 'Great work!',
      },
    ],
    safe_reversibility: {
      entry_point: 'Start at Phase 1',
      exit_points: [
        { phase: 1, label: 'Overwhelmed', next_step: 'Talk to Sam' },
      ],
      refuge_point: 'Sam (0.50, 0.50)',
      graceful_failure: 'Ask for help',
    },
    resources: {
      documentation: [{ title: 'BRIEFING.md', path: './BRIEFING.md' }],
      tools: [],
      external_links: [],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PackCLI', () => {
  let cli: PackCLI;
  const mockedFs = vi.mocked(fs);

  beforeEach(() => {
    vi.clearAllMocks();
    cli = new PackCLI(PACKS_DIR);
  });

  // -------------------------------------------------------------------------
  // initPack
  // -------------------------------------------------------------------------

  describe('initPack', () => {
    const OPTIONS = {
      type: 'mission' as const,
      title: 'My Pack',
      description: 'A brand new pack.',
      author: 'Author',
      passion_alignment: ['explorers', 'builders'],
    };

    it('creates pack directory structure and writes PACK.json + BRIEFING.md', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockReturnValue(undefined);
      mockedFs.writeFileSync.mockReturnValue(undefined);

      await cli.initPack('alpha', OPTIONS);

      const expectedPackDir = path.join(PACKS_DIR, 'pack-alpha');

      // Directory creation calls
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(expectedPackDir, { recursive: true });
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(path.join(expectedPackDir, 'RESOURCES'), { recursive: true });
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(path.join(expectedPackDir, 'LOGS'), { recursive: true });

      // PACK.json written
      const packJsonCall = mockedFs.writeFileSync.mock.calls.find(
        ([p]) => String(p) === path.join(expectedPackDir, 'PACK.json'),
      );
      expect(packJsonCall, 'PACK.json should be written').toBeDefined();

      // BRIEFING.md written
      const briefingCall = mockedFs.writeFileSync.mock.calls.find(
        ([p]) => String(p) === path.join(expectedPackDir, 'BRIEFING.md'),
      );
      expect(briefingCall, 'BRIEFING.md should be written').toBeDefined();
    });

    it('throws "Pack already exists" when the pack directory already exists', async () => {
      mockedFs.existsSync.mockReturnValue(true);

      await expect(cli.initPack('alpha', OPTIONS)).rejects.toThrow('Pack already exists: alpha');

      // No directory or file creation should have happened
      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('path traversal — a pack ID with ".." does not write outside the packs directory', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockReturnValue(undefined);
      mockedFs.writeFileSync.mockReturnValue(undefined);

      // Attempt traversal via pack ID
      await cli.initPack('../../escape', OPTIONS);

      // Every path passed to mkdirSync and writeFileSync must start with packsDir
      for (const [writtenPath] of mockedFs.mkdirSync.mock.calls) {
        expect(
          String(writtenPath).startsWith(PACKS_DIR),
          `mkdirSync path "${writtenPath}" escaped packs dir`,
        ).toBe(true);
      }
      for (const [writtenPath] of mockedFs.writeFileSync.mock.calls) {
        expect(
          String(writtenPath).startsWith(PACKS_DIR),
          `writeFileSync path "${writtenPath}" escaped packs dir`,
        ).toBe(true);
      }
    });

    it('generated PACK.json scaffold validates against PackDocumentSchema', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockReturnValue(undefined);
      mockedFs.writeFileSync.mockReturnValue(undefined);

      await cli.initPack('schema-check', OPTIONS);

      const packJsonCall = mockedFs.writeFileSync.mock.calls.find(
        ([p]) => String(p).endsWith('PACK.json'),
      );
      expect(packJsonCall, 'PACK.json must be written').toBeDefined();

      const written = JSON.parse(String(packJsonCall![1]));

      // The scaffold is partial — it must at minimum satisfy the required shape.
      // Inject required fields that scaffold intentionally leaves to the author
      // so the schema parse targets what the code actually writes.
      const result = PackDocumentSchema.safeParse(written);
      // The scaffold includes metadata, roles, phases, assessments, safe_reversibility,
      // resources — all required top-level keys. It should parse cleanly.
      expect(result.success, result.success ? '' : JSON.stringify((result as any).error?.issues)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // listPacks
  // -------------------------------------------------------------------------

  describe('listPacks', () => {
    it('returns list of packs with id, title, and type', async () => {
      mockListPacks.mockReturnValue(['alpha', 'beta']);
      mockLoadPack
        .mockResolvedValueOnce(makeValidPack({ metadata: { ...makeValidPack().metadata, id: 'alpha', title: 'Alpha Pack', type: 'mission' } }))
        .mockResolvedValueOnce(makeValidPack({ metadata: { ...makeValidPack().metadata, id: 'beta', title: 'Beta Pack', type: 'educational' } }));

      const result = await cli.listPacks();

      expect(result).toEqual([
        { id: 'alpha', title: 'Alpha Pack', type: 'mission' },
        { id: 'beta', title: 'Beta Pack', type: 'educational' },
      ]);
    });

    it('returns {id, title: "(error loading)", type: "unknown"} for a corrupt pack', async () => {
      mockListPacks.mockReturnValue(['good', 'corrupt']);
      mockLoadPack
        .mockResolvedValueOnce(makeValidPack({ metadata: { ...makeValidPack().metadata, id: 'good', title: 'Good Pack' } }))
        .mockRejectedValueOnce(new Error('JSON parse error'));

      const result = await cli.listPacks();

      expect(result).toEqual([
        { id: 'good', title: 'Good Pack', type: 'mission' },
        { id: 'corrupt', title: '(error loading)', type: 'unknown' },
      ]);
    });

    it('returns empty array when no packs exist', async () => {
      mockListPacks.mockReturnValue([]);

      const result = await cli.listPacks();

      expect(result).toEqual([]);
      expect(mockLoadPack).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // showPack
  // -------------------------------------------------------------------------

  describe('showPack', () => {
    it('prints pack title, type, duration, description, and phases to console', async () => {
      const pack = makeValidPack();
      mockLoadPack.mockResolvedValue(pack);

      const logged: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logged.push(args.join(' '));
      try {
        await cli.showPack('test-pack');
      } finally {
        console.log = originalLog;
      }

      const output = logged.join('\n');

      expect(output).toContain(pack.metadata.title);
      expect(output).toContain(pack.metadata.type);
      expect(output).toContain(pack.phases[0].title);
    });

    it('propagates errors from PackLoader.loadPack', async () => {
      mockLoadPack.mockRejectedValue(new Error('Pack not found: missing'));

      await expect(cli.showPack('missing')).rejects.toThrow('Pack not found: missing');
    });
  });

  // -------------------------------------------------------------------------
  // validatePack
  // -------------------------------------------------------------------------

  describe('validatePack', () => {
    it('returns { valid: true } for a correctly structured pack', async () => {
      mockLoadPack.mockResolvedValue(makeValidPack());

      const result = await cli.validatePack('test-pack');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('returns { valid: false, errors } for an invalid/malformed pack', async () => {
      // Return a pack that is missing required fields so Zod rejects it.
      // loadPack returns an already-parsed object, but validatePack re-parses with the schema.
      mockLoadPack.mockResolvedValue({
        metadata: {
          id: 'bad',
          title: 'Bad Pack',
          // Missing: description, type, category, author, version, created_at, updated_at,
          // passion_alignment, estimated_duration, difficulty
        },
        // Missing: roles, phases, assessments, safe_reversibility, resources
      } as any);

      const result = await cli.validatePack('bad');

      expect(result.valid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('returns { valid: false, errors } when PackLoader throws', async () => {
      mockLoadPack.mockRejectedValue(new Error('Pack not found: ghost'));

      const result = await cli.validatePack('ghost');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Pack not found: ghost']);
    });
  });
});
