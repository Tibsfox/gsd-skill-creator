import { describe, it, expect, beforeEach } from 'vitest';
import {
  SkillPipeline,
  createEmptyContext,
  type PipelineStage,
  type PipelineContext,
} from './skill-pipeline.js';

describe('SkillPipeline', () => {
  let pipeline: SkillPipeline;

  beforeEach(() => {
    pipeline = new SkillPipeline();
  });

  describe('process', () => {
    it('should return context unchanged for empty pipeline', async () => {
      const ctx = createEmptyContext({ intent: 'test' });
      const result = await pipeline.process(ctx);
      expect(result).toBe(ctx);
      expect(result.intent).toBe('test');
    });

    it('should call single stage process once', async () => {
      let callCount = 0;
      pipeline.addStage({
        name: 'only',
        process: async (ctx) => {
          callCount++;
          return ctx;
        },
      });

      await pipeline.process(createEmptyContext());
      expect(callCount).toBe(1);
    });

    it('should process two stages in order', async () => {
      const order: string[] = [];

      pipeline.addStage({
        name: 'first',
        process: async (ctx) => { order.push('first'); return ctx; },
      });
      pipeline.addStage({
        name: 'second',
        process: async (ctx) => { order.push('second'); return ctx; },
      });

      await pipeline.process(createEmptyContext());
      expect(order).toEqual(['first', 'second']);
    });

    it('should process three stages in order', async () => {
      const order: string[] = [];

      pipeline.addStage({
        name: 'first',
        process: async (ctx) => { order.push('first'); return ctx; },
      });
      pipeline.addStage({
        name: 'second',
        process: async (ctx) => { order.push('second'); return ctx; },
      });
      pipeline.addStage({
        name: 'third',
        process: async (ctx) => { order.push('third'); return ctx; },
      });

      await pipeline.process(createEmptyContext());
      expect(order).toEqual(['first', 'second', 'third']);
    });

    it('should still call all stages when earlyExit is set', async () => {
      const order: string[] = [];

      pipeline.addStage({
        name: 'stage1',
        process: async (ctx) => {
          order.push('stage1');
          ctx.earlyExit = true;
          return ctx;
        },
      });
      pipeline.addStage({
        name: 'stage2',
        process: async (ctx) => {
          order.push('stage2');
          return ctx;
        },
      });

      const result = await pipeline.process(createEmptyContext());
      // Pipeline runner does NOT check earlyExit — it always runs all stages
      expect(order).toEqual(['stage1', 'stage2']);
      expect(result.earlyExit).toBe(true);
    });

    it('should allow context mutation between stages', async () => {
      pipeline.addStage({
        name: 'stage1',
        process: async (ctx) => {
          ctx.loaded.push('skill-a');
          return ctx;
        },
      });
      pipeline.addStage({
        name: 'stage2',
        process: async (ctx) => {
          // stage2 sees what stage1 modified
          ctx.loaded.push('skill-b');
          return ctx;
        },
      });

      const result = await pipeline.process(createEmptyContext());
      expect(result.loaded).toEqual(['skill-a', 'skill-b']);
    });
  });

  describe('insertBefore', () => {
    it('should insert stage before the target', () => {
      pipeline.addStage({ name: 'a', process: async (ctx) => ctx });
      pipeline.addStage({ name: 'c', process: async (ctx) => ctx });
      pipeline.insertBefore('c', { name: 'b', process: async (ctx) => ctx });

      expect(pipeline.getStageNames()).toEqual(['a', 'b', 'c']);
    });

    it('should throw if target stage not found', () => {
      pipeline.addStage({ name: 'a', process: async (ctx) => ctx });

      expect(() => {
        pipeline.insertBefore('nonexistent', { name: 'b', process: async (ctx) => ctx });
      }).toThrow('nonexistent');
    });
  });

  describe('insertAfter', () => {
    it('should insert stage after the target', () => {
      pipeline.addStage({ name: 'a', process: async (ctx) => ctx });
      pipeline.addStage({ name: 'c', process: async (ctx) => ctx });
      pipeline.insertAfter('a', { name: 'b', process: async (ctx) => ctx });

      expect(pipeline.getStageNames()).toEqual(['a', 'b', 'c']);
    });

    it('should throw if target stage not found', () => {
      pipeline.addStage({ name: 'a', process: async (ctx) => ctx });

      expect(() => {
        pipeline.insertAfter('nonexistent', { name: 'b', process: async (ctx) => ctx });
      }).toThrow('nonexistent');
    });
  });

  describe('getStageNames', () => {
    it('should return stage names in order', () => {
      pipeline.addStage({ name: 'score', process: async (ctx) => ctx });
      pipeline.addStage({ name: 'resolve', process: async (ctx) => ctx });
      pipeline.addStage({ name: 'load', process: async (ctx) => ctx });

      expect(pipeline.getStageNames()).toEqual(['score', 'resolve', 'load']);
    });

    it('should return empty array for empty pipeline', () => {
      expect(pipeline.getStageNames()).toEqual([]);
    });
  });
});

describe('createEmptyContext', () => {
  it('should return all defaults with no arguments', () => {
    const ctx = createEmptyContext();

    expect(ctx.intent).toBeUndefined();
    expect(ctx.file).toBeUndefined();
    expect(ctx.context).toBeUndefined();
    expect(ctx.matches).toEqual([]);
    expect(ctx.scoredSkills).toEqual([]);
    expect(ctx.resolvedSkills).toEqual([]);
    expect(ctx.loaded).toEqual([]);
    expect(ctx.skipped).toEqual([]);
    expect(ctx.earlyExit).toBe(false);
    expect(ctx.conflicts).toEqual({
      hasConflict: false,
      conflictingSkills: [],
      resolution: 'priority',
    });
    expect(typeof ctx.getReport).toBe('function');
  });

  it('should return empty SessionReport from default getReport', () => {
    const ctx = createEmptyContext();
    const report = ctx.getReport();

    expect(report.activeSkills).toEqual([]);
    expect(report.totalTokens).toBe(0);
    expect(report.budgetLimit).toBe(0);
    expect(report.budgetUsedPercent).toBe(0);
    expect(report.remainingBudget).toBe(0);
    expect(report.tokenTracking).toEqual([]);
    expect(report.flaggedSkills).toEqual([]);
  });

  it('should merge overrides onto defaults', () => {
    const ctx = createEmptyContext({
      intent: 'build',
      context: 'typescript',
      earlyExit: true,
    });

    expect(ctx.intent).toBe('build');
    expect(ctx.context).toBe('typescript');
    expect(ctx.earlyExit).toBe(true);
    // Non-overridden fields remain default
    expect(ctx.file).toBeUndefined();
    expect(ctx.matches).toEqual([]);
    expect(ctx.loaded).toEqual([]);
  });

  it('should allow overriding getReport', () => {
    const customReport = {
      activeSkills: [],
      totalTokens: 100,
      budgetLimit: 6000,
      budgetUsedPercent: 1.67,
      remainingBudget: 5900,
      tokenTracking: [],
      flaggedSkills: [],
    };

    const ctx = createEmptyContext({
      getReport: () => customReport,
    });

    expect(ctx.getReport()).toBe(customReport);
    expect(ctx.getReport().totalTokens).toBe(100);
  });
});
