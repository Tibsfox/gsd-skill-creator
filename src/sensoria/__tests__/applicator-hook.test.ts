/**
 * Applicator-hook tests — SC-FLAG-OFF + feature-flag semantics.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readSensoriaEnabledFlag,
  decideActivation,
  createSensoriaStage,
} from '../applicator-hook.js';
import { DesensitisationStore } from '../desensitisation.js';
import { DEFAULT_SENSORIA } from '../frontmatter.js';
import type { ScoredSkill } from '../../types/application.js';
import type { PipelineContext } from '../../application/skill-pipeline.js';

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'sensoria-hook-'));
});
afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function writeSettings(content: unknown): string {
  const path = join(tmpRoot, 'settings.json');
  writeFileSync(path, JSON.stringify(content), 'utf8');
  return path;
}

describe('readSensoriaEnabledFlag — SC-FLAG-OFF default', () => {
  it('returns false when file does not exist', () => {
    expect(readSensoriaEnabledFlag(join(tmpRoot, 'missing.json'))).toBe(false);
  });

  it('returns false when file is not JSON', () => {
    const p = join(tmpRoot, 'bad.json');
    writeFileSync(p, 'not json', 'utf8');
    expect(readSensoriaEnabledFlag(p)).toBe(false);
  });

  it('returns false when gsd-skill-creator.sensoria.enabled missing', () => {
    const p = writeSettings({});
    expect(readSensoriaEnabledFlag(p)).toBe(false);
  });

  it('returns false when enabled is not boolean true', () => {
    const p = writeSettings({ 'gsd-skill-creator': { sensoria: { enabled: 'true' } } });
    expect(readSensoriaEnabledFlag(p)).toBe(false);
  });

  it('returns true only when enabled === true', () => {
    const p = writeSettings({ 'gsd-skill-creator': { sensoria: { enabled: true } } });
    expect(readSensoriaEnabledFlag(p)).toBe(true);
  });
});

describe('decideActivation — feature flag', () => {
  it('via m5-fallback when flag is off', () => {
    const d = decideActivation('s', 1, { enabled: false });
    expect(d.via).toBe('m5-fallback');
    expect(d.shouldActivate).toBe(false);
  });

  it('via m5-fallback when skill.disabled=true even if flag on', () => {
    const d = decideActivation('s', 1, {
      enabled: true,
      resolveBlock: () => ({ ...DEFAULT_SENSORIA, disabled: true }),
    });
    expect(d.via).toBe('m5-fallback');
  });

  it('via netshift when flag on and ΔR_H > theta', () => {
    const d = decideActivation('s', 1, {
      enabled: true,
      resolveBlock: () => ({ ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, theta: 0.01 }),
      desensitisation: new DesensitisationStore(),
      now: () => 0,
    });
    expect(d.via).toBe('netshift');
    expect(d.shouldActivate).toBe(true);
    expect(d.deltaR_H).toBeGreaterThan(0);
  });

  it('via netshift but shouldActivate=false when ΔR_H ≤ theta', () => {
    const d = decideActivation('s', 0.0001, {
      enabled: true,
      resolveBlock: () => ({ ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, theta: 0.5 }),
      desensitisation: new DesensitisationStore(),
      now: () => 0,
    });
    expect(d.via).toBe('netshift');
    expect(d.shouldActivate).toBe(false);
  });
});

describe('createSensoriaStage — SC-FLAG-OFF byte-identical pass-through', () => {
  function scored(name: string, s: number): ScoredSkill {
    return {
      name,
      score: s,
      matchType: 'intent',
    };
  }

  function ctxWith(list: ScoredSkill[]): PipelineContext {
    return {
      intent: 'x',
      file: undefined,
      context: undefined,
      matches: [],
      scoredSkills: [...list],
      resolvedSkills: [...list],
      conflicts: { hasConflict: false, conflictingSkills: [], resolution: 'priority' },
      loaded: [],
      skipped: [],
      budgetSkipped: [],
      budgetWarnings: [],
      contentCache: new Map(),
      modelProfile: undefined,
      sessionId: 'test',
      earlyExit: false,
      getReport: () => ({
        activeSkills: [],
        tokensUsed: 0,
        tokensSaved: 0,
        totalLoads: 0,
        budgetRemaining: 0,
      } as unknown as ReturnType<PipelineContext['getReport']>),
    };
  }

  it('flag off: stage does not mutate context at all (byte-identical)', async () => {
    const stage = createSensoriaStage({} as never, { enabled: false });
    const before = ctxWith([scored('a', 1), scored('b', 0.5)]);
    const snapshot = JSON.stringify({
      scored: before.scoredSkills,
      resolved: before.resolvedSkills,
      skipped: before.skipped,
    });
    const after = await stage.process(before);
    const now = JSON.stringify({
      scored: after.scoredSkills,
      resolved: after.resolvedSkills,
      skipped: after.skipped,
    });
    expect(now).toBe(snapshot);
  });

  it('flag off: 10-session byte-identical fixture (SC-FLAG-OFF evidence)', async () => {
    const stage = createSensoriaStage({} as never, { enabled: false });
    const traces: string[] = [];
    for (let s = 0; s < 10; s += 1) {
      const ctx = ctxWith([
        scored(`skill-${s}-a`, Math.random()),
        scored(`skill-${s}-b`, Math.random()),
        scored(`skill-${s}-c`, Math.random()),
      ]);
      const before = JSON.stringify(ctx.scoredSkills);
      const after = await stage.process(ctx);
      const afterStr = JSON.stringify(after.scoredSkills);
      traces.push(`${before} === ${afterStr}`);
      expect(afterStr).toBe(before);
      expect(after.skipped).toEqual([]);
    }
    expect(traces.length).toBe(10);
  });

  it('flag on: sub-threshold skills are dropped and recorded in skipped', async () => {
    const stage = createSensoriaStage({} as never, {
      enabled: true,
      resolveBlock: () => ({ ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, theta: 100 }), // unreachable theta
      desensitisation: new DesensitisationStore(),
      now: () => 0,
    });
    const ctx = ctxWith([scored('a', 1), scored('b', 0.5)]);
    const after = await stage.process(ctx);
    expect(after.scoredSkills).toEqual([]);
    expect(after.resolvedSkills).toEqual([]);
    expect(after.skipped).toContain('a');
    expect(after.skipped).toContain('b');
  });

  it('flag on: per-skill disabled bypasses gate', async () => {
    const stage = createSensoriaStage({} as never, {
      enabled: true,
      resolveBlock: () => ({ ...DEFAULT_SENSORIA, disabled: true }),
      desensitisation: new DesensitisationStore(),
      now: () => 0,
    });
    const ctx = ctxWith([scored('a', 1)]);
    const after = await stage.process(ctx);
    expect(after.scoredSkills.length).toBe(1);
    expect(after.skipped).toEqual([]);
  });
});
