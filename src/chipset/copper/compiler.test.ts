/**
 * Tests for Copper List compiler, saver, and loader.
 *
 * The compiler transforms plan metadata into executable Copper Lists.
 * The saver serializes lists to YAML files. The loader reads and validates
 * them back from disk. Together they close the loop from GSD planning
 * artifacts to data-driven Copper List programs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CopperListSchema } from './schema.js';
import { compileCopperList, saveCopperList, loadCopperLists } from './compiler.js';
import type { PlanMetadata, CompilerOptions } from './compiler.js';
import type { CopperList, SkipCondition } from './types.js';

describe('Copper List Compiler', () => {
  // ===========================================================================
  // compileCopperList() tests
  // ===========================================================================

  describe('compileCopperList()', () => {
    it('compiles a basic plan into a Copper List with WAIT and MOVE', () => {
      const metadata: PlanMetadata = {
        phase: '110-copper-executor',
        plan: 1,
        skills: [{ name: 'git-commit', mode: 'sprite' }],
        lifecycle_events: ['phase-start', 'code-complete'],
      };

      const list = compileCopperList(metadata);

      expect(list.metadata.name).toBe('110-copper-executor-01');
      // Should contain WAIT phase-start, MOVE git-commit, WAIT code-complete
      const waitPhaseStart = list.instructions.find(
        (i) => i.type === 'wait' && i.event === 'phase-start',
      );
      const moveGitCommit = list.instructions.find(
        (i) => i.type === 'move' && i.name === 'git-commit',
      );
      const waitCodeComplete = list.instructions.find(
        (i) => i.type === 'wait' && i.event === 'code-complete',
      );
      expect(waitPhaseStart).toBeDefined();
      expect(moveGitCommit).toBeDefined();
      expect(waitCodeComplete).toBeDefined();
      // MOVE should have mode 'sprite'
      expect(moveGitCommit!.type === 'move' && moveGitCommit!.mode).toBe('sprite');
    });

    it('compiles plan with multiple skills into sequential WAIT-MOVE pairs', () => {
      const metadata: PlanMetadata = {
        phase: '108-copper-list',
        plan: 2,
        skills: [{ name: 'lint' }, { name: 'test' }, { name: 'commit' }],
        lifecycle_events: ['phase-start'],
      };

      const list = compileCopperList(metadata);

      // Should have WAIT phase-start, then three MOVEs in order
      expect(list.instructions[0]).toMatchObject({ type: 'wait', event: 'phase-start' });
      const moves = list.instructions.filter((i) => i.type === 'move');
      expect(moves).toHaveLength(3);
      expect(moves[0]).toMatchObject({ type: 'move', name: 'lint', mode: 'full' });
      expect(moves[1]).toMatchObject({ type: 'move', name: 'test', mode: 'full' });
      expect(moves[2]).toMatchObject({ type: 'move', name: 'commit', mode: 'full' });
    });

    it('compiles plan with conditional skills into SKIP-MOVE pairs', () => {
      const condition: SkipCondition = {
        left: 'file:eslint.config.js',
        op: 'exists',
      };
      const metadata: PlanMetadata = {
        phase: '109-blitter',
        plan: 1,
        skills: [{ name: 'lint', conditions: condition }],
        lifecycle_events: ['phase-start'],
      };

      const list = compileCopperList(metadata);

      // Should include a SKIP before the MOVE for lint
      const skipIdx = list.instructions.findIndex((i) => i.type === 'skip');
      expect(skipIdx).toBeGreaterThan(-1);
      const skipInstr = list.instructions[skipIdx];
      expect(skipInstr.type === 'skip' && skipInstr.condition).toMatchObject(condition);
      // The MOVE should follow the SKIP
      const nextInstr = list.instructions[skipIdx + 1];
      expect(nextInstr).toMatchObject({ type: 'move', name: 'lint' });
    });

    it('compiled list validates against CopperListSchema', () => {
      const metadata: PlanMetadata = {
        phase: '110-copper-executor',
        plan: 3,
        skills: [{ name: 'git-commit', mode: 'full' }],
        lifecycle_events: ['phase-start'],
      };

      const list = compileCopperList(metadata);
      const result = CopperListSchema.safeParse(list);

      expect(result.success).toBe(true);
    });

    it('metadata includes source information', () => {
      const metadata: PlanMetadata = {
        phase: '110-copper-executor',
        plan: 1,
        skills: [{ name: 'test' }],
        lifecycle_events: ['phase-start'],
      };

      const list = compileCopperList(metadata);

      expect(list.metadata.sourcePatterns).toContain('110-copper-executor');
      expect(list.metadata.version).toBe(1);
      expect(list.metadata.priority).toBe(50);
    });

    it('compiles plan with no skills into WAIT-only list', () => {
      const metadata: PlanMetadata = {
        phase: '110-copper-executor',
        plan: 5,
        lifecycle_events: ['phase-start', 'code-complete'],
      };

      const list = compileCopperList(metadata);

      // All instructions should be WAITs
      expect(list.instructions.every((i) => i.type === 'wait')).toBe(true);
      expect(list.instructions).toHaveLength(2);
      // List should still be valid (min 1 instruction)
      const result = CopperListSchema.safeParse(list);
      expect(result.success).toBe(true);
    });

    it('compiles plan with no lifecycle_events using default phase-start', () => {
      const metadata: PlanMetadata = {
        phase: '110-copper-executor',
        plan: 6,
        skills: [{ name: 'lint' }],
      };

      const list = compileCopperList(metadata);

      const waitInstr = list.instructions.find(
        (i) => i.type === 'wait' && i.event === 'phase-start',
      );
      expect(waitInstr).toBeDefined();
    });

    it('compiler options allow custom priority and confidence', () => {
      const metadata: PlanMetadata = {
        phase: '110-copper-executor',
        plan: 7,
        skills: [{ name: 'test' }],
        lifecycle_events: ['phase-start'],
      };
      const options: CompilerOptions = { priority: 80, confidence: 0.9 };

      const list = compileCopperList(metadata, options);

      expect(list.metadata.priority).toBe(80);
      expect(list.metadata.confidence).toBe(0.9);
    });
  });

  // ===========================================================================
  // saveCopperList() and loadCopperLists() tests
  // ===========================================================================

  describe('saveCopperList() and loadCopperLists()', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'copper-test-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('saveCopperList writes a YAML file to the specified directory', async () => {
      const metadata: PlanMetadata = {
        phase: '110-copper-executor',
        plan: 1,
        skills: [{ name: 'test', mode: 'full' }],
        lifecycle_events: ['phase-start'],
      };
      const list = compileCopperList(metadata);

      const filePath = await saveCopperList(list, tempDir);

      expect(filePath).toContain('110-copper-executor-01.copper.yaml');
      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('metadata');
      expect(content).toContain('instructions');
    });

    it('loadCopperLists reads all .copper.yaml files from a directory', async () => {
      const list1 = compileCopperList({
        phase: '110-copper-executor',
        plan: 1,
        skills: [{ name: 'test' }],
        lifecycle_events: ['phase-start'],
      });
      const list2 = compileCopperList({
        phase: '110-copper-executor',
        plan: 2,
        skills: [{ name: 'lint' }],
        lifecycle_events: ['phase-start'],
      });
      await saveCopperList(list1, tempDir);
      await saveCopperList(list2, tempDir);

      const loaded = await loadCopperLists(tempDir);

      expect(loaded).toHaveLength(2);
      // Both should validate
      for (const l of loaded) {
        expect(CopperListSchema.safeParse(l).success).toBe(true);
      }
    });

    it('loadCopperLists returns empty array for directory with no copper files', async () => {
      const loaded = await loadCopperLists(tempDir);
      expect(loaded).toEqual([]);
    });

    it('loadCopperLists skips invalid YAML files with warning', async () => {
      // Write malformed content
      await writeFile(join(tempDir, 'bad.copper.yaml'), '{{{{invalid yaml not json}}}}', 'utf-8');
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      const loaded = await loadCopperLists(tempDir);

      expect(loaded).toEqual([]);
      expect(stderrSpy).toHaveBeenCalled();
      stderrSpy.mockRestore();
    });

    it('loadCopperLists filters by phase directory pattern', async () => {
      // Create a subdirectory matching a phase
      const phaseDir = join(tempDir, '110-copper-executor');
      await mkdir(phaseDir, { recursive: true });

      const list = compileCopperList({
        phase: '110-copper-executor',
        plan: 1,
        skills: [{ name: 'test' }],
        lifecycle_events: ['phase-start'],
      });
      await saveCopperList(list, phaseDir);

      // Also save one in the root (should not be loaded with phase filter)
      const otherList = compileCopperList({
        phase: '109-blitter',
        plan: 1,
        skills: [{ name: 'lint' }],
        lifecycle_events: ['phase-start'],
      });
      await saveCopperList(otherList, tempDir);

      const loaded = await loadCopperLists(tempDir, { phase: '110-copper-executor' });

      expect(loaded).toHaveLength(1);
      expect(loaded[0].metadata.name).toBe('110-copper-executor-01');
    });

    it('round-trip: compile, save, load produces identical list', async () => {
      const metadata: PlanMetadata = {
        phase: '110-copper-executor',
        plan: 3,
        skills: [
          { name: 'lint', mode: 'sprite' },
          { name: 'test', mode: 'full' },
        ],
        lifecycle_events: ['phase-start', 'code-complete'],
      };
      const compiled = compileCopperList(metadata);

      await saveCopperList(compiled, tempDir);
      const loaded = await loadCopperLists(tempDir);

      expect(loaded).toHaveLength(1);
      // The loaded list should deeply equal the compiled list
      // (Zod defaults may be applied, so we compare the schema-parsed version)
      const parsedCompiled = CopperListSchema.parse(compiled);
      expect(loaded[0]).toEqual(parsedCompiled);
    });
  });
});
