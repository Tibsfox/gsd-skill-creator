/**
 * Tests for Pipeline compiler, saver, and loader.
 *
 * The compiler transforms plan metadata into executable Pipelines.
 * The saver serializes lists to YAML files. The loader reads and validates
 * them back from disk. Together they close the loop from GSD planning
 * artifacts to data-driven Pipeline programs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PipelineSchema } from './schema.js';
import { compilePipeline, savePipeline, loadPipelines } from './compiler.js';
import type { PlanMetadata, CompilerOptions } from './compiler.js';
import type { Pipeline, SkipCondition } from './types.js';

describe('Pipeline Compiler', () => {
  // ===========================================================================
  // compilePipeline() tests
  // ===========================================================================

  describe('compilePipeline()', () => {
    it('compiles a basic plan into a Pipeline with WAIT and MOVE', () => {
      const metadata: PlanMetadata = {
        phase: '110-pipeline-executor',
        plan: 1,
        skills: [{ name: 'git-commit', mode: 'lite' }],
        lifecycle_events: ['phase-start', 'code-complete'],
      };

      const list = compilePipeline(metadata);

      expect(list.metadata.name).toBe('110-pipeline-executor-01');
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
      // MOVE should have mode 'lite'
      expect(moveGitCommit!.type === 'move' && moveGitCommit!.mode).toBe('lite');
    });

    it('compiles plan with multiple skills into sequential WAIT-MOVE pairs', () => {
      const metadata: PlanMetadata = {
        phase: '108-pipeline',
        plan: 2,
        skills: [{ name: 'lint' }, { name: 'test' }, { name: 'commit' }],
        lifecycle_events: ['phase-start'],
      };

      const list = compilePipeline(metadata);

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

      const list = compilePipeline(metadata);

      // Should include a SKIP before the MOVE for lint
      const skipIdx = list.instructions.findIndex((i) => i.type === 'skip');
      expect(skipIdx).toBeGreaterThan(-1);
      const skipInstr = list.instructions[skipIdx];
      expect(skipInstr.type === 'skip' && skipInstr.condition).toMatchObject(condition);
      // The MOVE should follow the SKIP
      const nextInstr = list.instructions[skipIdx + 1];
      expect(nextInstr).toMatchObject({ type: 'move', name: 'lint' });
    });

    it('compiled list validates against PipelineSchema', () => {
      const metadata: PlanMetadata = {
        phase: '110-pipeline-executor',
        plan: 3,
        skills: [{ name: 'git-commit', mode: 'full' }],
        lifecycle_events: ['phase-start'],
      };

      const list = compilePipeline(metadata);
      const result = PipelineSchema.safeParse(list);

      expect(result.success).toBe(true);
    });

    it('metadata includes source information', () => {
      const metadata: PlanMetadata = {
        phase: '110-pipeline-executor',
        plan: 1,
        skills: [{ name: 'test' }],
        lifecycle_events: ['phase-start'],
      };

      const list = compilePipeline(metadata);

      expect(list.metadata.sourcePatterns).toContain('110-pipeline-executor');
      expect(list.metadata.version).toBe(1);
      expect(list.metadata.priority).toBe(50);
    });

    it('compiles plan with no skills into WAIT-only list', () => {
      const metadata: PlanMetadata = {
        phase: '110-pipeline-executor',
        plan: 5,
        lifecycle_events: ['phase-start', 'code-complete'],
      };

      const list = compilePipeline(metadata);

      // All instructions should be WAITs
      expect(list.instructions.every((i) => i.type === 'wait')).toBe(true);
      expect(list.instructions).toHaveLength(2);
      // List should still be valid (min 1 instruction)
      const result = PipelineSchema.safeParse(list);
      expect(result.success).toBe(true);
    });

    it('compiles plan with no lifecycle_events using default phase-start', () => {
      const metadata: PlanMetadata = {
        phase: '110-pipeline-executor',
        plan: 6,
        skills: [{ name: 'lint' }],
      };

      const list = compilePipeline(metadata);

      const waitInstr = list.instructions.find(
        (i) => i.type === 'wait' && i.event === 'phase-start',
      );
      expect(waitInstr).toBeDefined();
    });

    it('compiler options allow custom priority and confidence', () => {
      const metadata: PlanMetadata = {
        phase: '110-pipeline-executor',
        plan: 7,
        skills: [{ name: 'test' }],
        lifecycle_events: ['phase-start'],
      };
      const options: CompilerOptions = { priority: 80, confidence: 0.9 };

      const list = compilePipeline(metadata, options);

      expect(list.metadata.priority).toBe(80);
      expect(list.metadata.confidence).toBe(0.9);
    });
  });

  // ===========================================================================
  // savePipeline() and loadPipelines() tests
  // ===========================================================================

  describe('savePipeline() and loadPipelines()', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'pipeline-test-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('savePipeline writes a YAML file to the specified directory', async () => {
      const metadata: PlanMetadata = {
        phase: '110-pipeline-executor',
        plan: 1,
        skills: [{ name: 'test', mode: 'full' }],
        lifecycle_events: ['phase-start'],
      };
      const list = compilePipeline(metadata);

      const filePath = await savePipeline(list, tempDir);

      expect(filePath).toContain('110-pipeline-executor-01.pipeline.yaml');
      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('metadata');
      expect(content).toContain('instructions');
    });

    it('loadPipelines reads all .pipeline.yaml files from a directory', async () => {
      const list1 = compilePipeline({
        phase: '110-pipeline-executor',
        plan: 1,
        skills: [{ name: 'test' }],
        lifecycle_events: ['phase-start'],
      });
      const list2 = compilePipeline({
        phase: '110-pipeline-executor',
        plan: 2,
        skills: [{ name: 'lint' }],
        lifecycle_events: ['phase-start'],
      });
      await savePipeline(list1, tempDir);
      await savePipeline(list2, tempDir);

      const loaded = await loadPipelines(tempDir);

      expect(loaded).toHaveLength(2);
      // Both should validate
      for (const l of loaded) {
        expect(PipelineSchema.safeParse(l).success).toBe(true);
      }
    });

    it('loadPipelines returns empty array for directory with no pipeline files', async () => {
      const loaded = await loadPipelines(tempDir);
      expect(loaded).toEqual([]);
    });

    it('loadPipelines skips invalid YAML files with warning', async () => {
      // Write malformed content
      await writeFile(join(tempDir, 'bad.pipeline.yaml'), '{{{{invalid yaml not json}}}}', 'utf-8');
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      const loaded = await loadPipelines(tempDir);

      expect(loaded).toEqual([]);
      expect(stderrSpy).toHaveBeenCalled();
      stderrSpy.mockRestore();
    });

    it('loadPipelines filters by phase directory pattern', async () => {
      // Create a subdirectory matching a phase
      const phaseDir = join(tempDir, '110-pipeline-executor');
      await mkdir(phaseDir, { recursive: true });

      const list = compilePipeline({
        phase: '110-pipeline-executor',
        plan: 1,
        skills: [{ name: 'test' }],
        lifecycle_events: ['phase-start'],
      });
      await savePipeline(list, phaseDir);

      // Also save one in the root (should not be loaded with phase filter)
      const otherList = compilePipeline({
        phase: '109-blitter',
        plan: 1,
        skills: [{ name: 'lint' }],
        lifecycle_events: ['phase-start'],
      });
      await savePipeline(otherList, tempDir);

      const loaded = await loadPipelines(tempDir, { phase: '110-pipeline-executor' });

      expect(loaded).toHaveLength(1);
      expect(loaded[0].metadata.name).toBe('110-pipeline-executor-01');
    });

    it('round-trip: compile, save, load produces identical list', async () => {
      const metadata: PlanMetadata = {
        phase: '110-pipeline-executor',
        plan: 3,
        skills: [
          { name: 'lint', mode: 'lite' },
          { name: 'test', mode: 'full' },
        ],
        lifecycle_events: ['phase-start', 'code-complete'],
      };
      const compiled = compilePipeline(metadata);

      await savePipeline(compiled, tempDir);
      const loaded = await loadPipelines(tempDir);

      expect(loaded).toHaveLength(1);
      // The loaded list should deeply equal the compiled list
      // (Zod defaults may be applied, so we compare the schema-parsed version)
      const parsedCompiled = PipelineSchema.parse(compiled);
      expect(loaded[0]).toEqual(parsedCompiled);
    });
  });
});
