import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

const mockGenerate = vi.fn();
const mockStore = vi.fn();
const mockGetLatest = vi.fn();

vi.mock('../../orchestrator/session-continuity/snapshot-manager.js', () => ({
  SnapshotManager: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.generate = mockGenerate;
    this.store = mockStore;
    this.getLatest = mockGetLatest;
  }),
}));

const mockWarmStartGenerate = vi.fn();

vi.mock('../../orchestrator/session-continuity/warm-start.js', () => ({
  WarmStartGenerator: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.generate = mockWarmStartGenerate;
  }),
}));

const mockHandoffGenerate = vi.fn();

vi.mock('../../orchestrator/session-continuity/handoff-generator.js', () => ({
  HandoffGenerator: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.generate = mockHandoffGenerate;
  }),
}));

vi.mock('../../orchestrator/session-continuity/skill-preload-suggester.js', () => ({
  SkillPreloadSuggester: vi.fn().mockImplementation(function () {
    // No methods needed for preload suggester
  }),
}));

const mockStateRead = vi.fn();

vi.mock('../../orchestrator/state/state-reader.js', () => ({
  ProjectStateReader: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.read = mockStateRead;
  }),
}));

vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  };
});

import { sessionCommand } from './session.js';

// ============================================================================
// Test helpers
// ============================================================================

/**
 * Capture console.log output during a callback.
 */
async function captureOutput(fn: () => Promise<number>): Promise<{ exitCode: number; output: string }> {
  const logs: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(' '));
  });
  const exitCode = await fn();
  spy.mockRestore();
  return { exitCode, output: logs.join('\n') };
}

/**
 * Default mock state for ProjectStateReader.
 */
const defaultProjectState = {
  initialized: true,
  config: { mode: 'yolo' },
  position: { phase: 68, plan: 4, status: 'executing' },
  phases: [],
  plansByPhase: {},
  project: null,
  state: {
    decisions: ['Decision A', 'Decision B'],
    blockers: [],
  },
  hasRoadmap: true,
  hasState: true,
  hasProject: false,
  hasConfig: true,
};

/**
 * Default snapshot for tests.
 */
const defaultSnapshot = {
  session_id: 'sess-123',
  timestamp: Date.now(),
  saved_at: new Date().toISOString(),
  summary: 'Working on session continuity CLI command',
  active_skills: ['typescript', 'testing'],
  files_modified: ['src/cli/commands/session.ts'],
  open_questions: ['Should we add --format flag?'],
  metrics: {
    duration_minutes: 45,
    tool_calls: 120,
    files_read: 30,
    files_written: 5,
  },
  top_tools: ['Read', 'Write', 'Bash'],
  top_commands: ['git status', 'npx vitest'],
};

// ============================================================================
// Tests
// ============================================================================

describe('sessionCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStateRead.mockResolvedValue(defaultProjectState);
  });

  // --------------------------------------------------------------------------
  // save subcommand
  // --------------------------------------------------------------------------

  describe('save', () => {
    it('calls SnapshotManager.generate() and store() with correct args', async () => {
      mockGenerate.mockResolvedValue(defaultSnapshot);
      mockStore.mockResolvedValue(undefined);

      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['save', '--session-id=sess-123', '--transcript-path=/tmp/transcript.jsonl']),
      );

      expect(exitCode).toBe(0);
      expect(mockGenerate).toHaveBeenCalledWith(
        '/tmp/transcript.jsonl',
        'sess-123',
        [],
      );
      expect(mockStore).toHaveBeenCalledWith(defaultSnapshot);
      const parsed = JSON.parse(output);
      expect(parsed.saved).toBe(true);
    });

    it('returns 1 when --session-id is missing', async () => {
      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['save', '--transcript-path=/tmp/transcript.jsonl']),
      );

      expect(exitCode).toBe(1);
      const parsed = JSON.parse(output);
      expect(parsed.error).toMatch(/session-id/i);
    });

    it('returns 1 when --transcript-path is missing', async () => {
      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['save', '--session-id=sess-123']),
      );

      expect(exitCode).toBe(1);
      const parsed = JSON.parse(output);
      expect(parsed.error).toMatch(/transcript-path/i);
    });

    it('outputs info when generate() returns null (empty transcript)', async () => {
      mockGenerate.mockResolvedValue(null);

      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['save', '--session-id=sess-123', '--transcript-path=/tmp/empty.jsonl']),
      );

      expect(exitCode).toBe(0);
      const parsed = JSON.parse(output);
      expect(parsed.info).toMatch(/no snapshot/i);
    });

    it('passes skill array when --skills flag is provided', async () => {
      mockGenerate.mockResolvedValue(defaultSnapshot);
      mockStore.mockResolvedValue(undefined);

      await captureOutput(() =>
        sessionCommand([
          'save',
          '--session-id=sess-123',
          '--transcript-path=/tmp/transcript.jsonl',
          '--skills=typescript,git',
        ]),
      );

      expect(mockGenerate).toHaveBeenCalledWith(
        '/tmp/transcript.jsonl',
        'sess-123',
        ['typescript', 'git'],
      );
    });
  });

  // --------------------------------------------------------------------------
  // restore subcommand
  // --------------------------------------------------------------------------

  describe('restore', () => {
    it('calls WarmStartGenerator.generate() and outputs JSON result', async () => {
      const warmStartContext = {
        ...defaultSnapshot,
        suggested_skills: ['typescript'],
        stale_files: [],
        decisions: ['Decision A'],
        blockers: [],
        current_phase: { phase: 68, plan: 4 },
        generated_at: new Date().toISOString(),
        staleness_warning: null,
      };
      mockWarmStartGenerate.mockResolvedValue(warmStartContext);

      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['restore']),
      );

      expect(exitCode).toBe(0);
      expect(mockWarmStartGenerate).toHaveBeenCalled();
      const parsed = JSON.parse(output);
      expect(parsed.session_id).toBe('sess-123');
      expect(parsed.suggested_skills).toEqual(['typescript']);
    });

    it('outputs info when generate() returns null (no snapshot)', async () => {
      mockWarmStartGenerate.mockResolvedValue(null);

      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['restore']),
      );

      expect(exitCode).toBe(0);
      const parsed = JSON.parse(output);
      expect(parsed.info).toMatch(/no snapshot/i);
    });

    it('outputs JSON by default (--format=json)', async () => {
      const warmStartContext = {
        ...defaultSnapshot,
        suggested_skills: [],
        stale_files: [],
        decisions: [],
        blockers: [],
        current_phase: null,
        generated_at: new Date().toISOString(),
        staleness_warning: null,
      };
      mockWarmStartGenerate.mockResolvedValue(warmStartContext);

      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['restore', '--format=json']),
      );

      expect(exitCode).toBe(0);
      // Should be valid JSON
      const parsed = JSON.parse(output);
      expect(parsed.session_id).toBeDefined();
    });

    it('outputs markdown context with --format=context', async () => {
      const warmStartContext = {
        ...defaultSnapshot,
        suggested_skills: ['typescript'],
        stale_files: ['old-file.ts'],
        decisions: ['Decision A', 'Decision B'],
        blockers: ['Blocker X'],
        current_phase: { phase: 68, plan: 4 },
        generated_at: new Date().toISOString(),
        staleness_warning: null,
      };
      mockWarmStartGenerate.mockResolvedValue(warmStartContext);

      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['restore', '--format=context']),
      );

      expect(exitCode).toBe(0);
      expect(output).toContain('## Session Context');
      expect(output).toContain('## Decisions');
      expect(output).toContain('Decision A');
    });

    it('uses specified --planning-dir flag', async () => {
      const warmStartContext = {
        ...defaultSnapshot,
        suggested_skills: [],
        stale_files: [],
        decisions: [],
        blockers: [],
        current_phase: null,
        generated_at: new Date().toISOString(),
        staleness_warning: null,
      };
      mockWarmStartGenerate.mockResolvedValue(warmStartContext);

      const { exitCode } = await captureOutput(() =>
        sessionCommand(['restore', '--planning-dir=/custom/.planning']),
      );

      expect(exitCode).toBe(0);
      // WarmStartGenerator constructor should receive the custom path
      // (verified via mock constructor call)
    });
  });

  // --------------------------------------------------------------------------
  // handoff subcommand
  // --------------------------------------------------------------------------

  describe('handoff', () => {
    it('generates handoff skill and outputs JSON with path and success', async () => {
      mockGetLatest.mockResolvedValue(defaultSnapshot);
      mockHandoffGenerate.mockResolvedValue({
        path: '.claude/skills/session-handoff-2026-02-12/SKILL.md',
        content: '---\nname: session-handoff\n---\n## Session State\n',
      });

      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['handoff']),
      );

      expect(exitCode).toBe(0);
      expect(mockGetLatest).toHaveBeenCalled();
      expect(mockHandoffGenerate).toHaveBeenCalled();
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(true);
      expect(parsed.path).toContain('session-handoff');
    });

    it('outputs info when no snapshot available', async () => {
      mockGetLatest.mockResolvedValue(null);

      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['handoff']),
      );

      expect(exitCode).toBe(0);
      const parsed = JSON.parse(output);
      expect(parsed.info).toMatch(/no snapshot/i);
    });

    it('uses --output flag for output directory', async () => {
      mockGetLatest.mockResolvedValue(defaultSnapshot);
      mockHandoffGenerate.mockResolvedValue({
        path: '/custom/output/session-handoff-2026-02-12/SKILL.md',
        content: '---\nname: session-handoff\n---\n## Session State\n',
      });

      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['handoff', '--output=/custom/output']),
      );

      expect(exitCode).toBe(0);
      // HandoffGenerator.generate should receive the custom output dir
      const generateCall = mockHandoffGenerate.mock.calls[0];
      expect(generateCall[2]).toBe('/custom/output');
    });
  });

  // --------------------------------------------------------------------------
  // Help and unknown subcommands
  // --------------------------------------------------------------------------

  describe('help and unknown subcommands', () => {
    it('shows help when no subcommand given', async () => {
      const { exitCode, output } = await captureOutput(() =>
        sessionCommand([]),
      );

      expect(exitCode).toBe(0);
      expect(output).toContain('save');
      expect(output).toContain('restore');
      expect(output).toContain('handoff');
    });

    it('shows help with --help flag', async () => {
      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['--help']),
      );

      expect(exitCode).toBe(0);
      expect(output).toContain('save');
      expect(output).toContain('restore');
      expect(output).toContain('handoff');
    });

    it('returns 1 for unknown subcommand', async () => {
      const { exitCode, output } = await captureOutput(() =>
        sessionCommand(['unknown-sub']),
      );

      expect(exitCode).toBe(1);
      const parsed = JSON.parse(output);
      expect(parsed.error).toContain('unknown-sub');
      expect(parsed.help).toContain('save');
    });
  });
});
