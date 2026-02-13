/**
 * Tests for the intake bridge module.
 *
 * Validates that confirmWithResources wraps confirmIntake with resource
 * manifest generation, persists the manifest to disk, and records the
 * 'queued' step in the flow state.
 *
 * @module staging/resource/intake-bridge.test
 */

import { describe, it, expect, vi } from 'vitest';
import type { IntakeFlowResult, IntakeDependencies } from '../intake-flow/orchestrator.js';
import type { IntakeFlowStep, IntakeFlowState } from '../intake-flow/step-types.js';
import type { ResourceManifest } from './types.js';
import type { SkillCapability } from '../../capabilities/types.js';
import type { IntakeBridgeDeps } from './intake-bridge.js';
import { confirmWithResources } from './intake-bridge.js';
import { STAGING_DIRS } from '../types.js';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeIntakeResult(overrides?: Partial<IntakeFlowResult>): IntakeFlowResult {
  return {
    route: 'clear',
    assessment: {
      route: 'clear',
      reason: 'Document is clear',
      confidence: 0.9,
      gaps: [],
      sections: ['Overview'],
    },
    hygieneReport: {
      overallRisk: 'info',
      totalFindings: 0,
      surfacedFindings: [],
      suppressedCount: 0,
      summary: { critical: 0, warning: 0, notice: 0, info: 0 },
    } as any,
    step: 'confirmed',
    needsConfirmation: false,
    questions: [],
    message: 'Document is clear and ready to queue',
    ...overrides,
  };
}

function makeManifest(overrides?: Partial<ResourceManifest>): ResourceManifest {
  return {
    visionAnalysis: {
      requirements: [],
      complexity: [],
      ambiguities: [],
      dependencies: [],
      overallComplexity: 'low',
      summary: 'Test vision',
    },
    skillMatches: [],
    topology: {
      topology: 'single',
      rationale: 'Simple work',
      confidence: 1.0,
      agentCount: 1,
    },
    tokenBudget: {
      total: 80000,
      categories: {
        'skill-loading': 4000,
        'planning': 12000,
        'execution': 32000,
        'research': 4000,
        'verification': 8000,
        'hitl': 4000,
        'safety-margin': 16000,
      },
      contextWindowSize: 200000,
      utilizationPercent: 40,
    },
    decomposition: {
      subtasks: [],
      criticalPath: [],
      maxParallelism: 0,
      sharedResources: [],
    },
    hitlPredictions: [],
    queueContext: {
      priority: 4,
      estimatedDuration: '0m',
      tags: [],
    },
    generatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSkill(name: string, description: string): SkillCapability {
  return { name, description, scope: 'project', contentHash: 'abc123' };
}

function makeDeps(overrides?: Partial<IntakeBridgeDeps>): IntakeBridgeDeps {
  return {
    confirmIntake: vi.fn().mockResolvedValue(makeIntakeResult()),
    generateResourceManifest: vi.fn().mockReturnValue(makeManifest()),
    readFile: vi.fn().mockResolvedValue('# Vision Document\n\n- Build something'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    recordStep: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('confirmWithResources', () => {
  const basePath = '/tmp/test-project';
  const filename = 'my-doc.md';
  const skills: SkillCapability[] = [
    makeSkill('vitest-runner', 'Runs vitest tests'),
  ];

  it('should run the full confirmation flow: confirm, generate manifest, write, return', async () => {
    const deps = makeDeps();
    const result = await confirmWithResources(
      { basePath, filename, availableSkills: skills },
      deps,
    );

    expect(result.intakeResult).toBeDefined();
    expect(result.manifest).toBeDefined();
    expect(result.manifestPath).toBeDefined();
    expect(deps.confirmIntake).toHaveBeenCalledOnce();
    expect(deps.generateResourceManifest).toHaveBeenCalledOnce();
    expect(deps.writeFile).toHaveBeenCalledOnce();
  });

  it('should write manifest next to metadata file as {filename}.manifest.json in ready dir', async () => {
    const deps = makeDeps();
    const result = await confirmWithResources(
      { basePath, filename, availableSkills: skills },
      deps,
    );

    const expectedPath = join(basePath, STAGING_DIRS.ready, `${filename}.manifest.json`);
    expect(result.manifestPath).toBe(expectedPath);
    expect(deps.writeFile).toHaveBeenCalledWith(expectedPath, expect.any(String));
  });

  it('should read document content from the ready directory after confirmIntake', async () => {
    const deps = makeDeps();
    await confirmWithResources(
      { basePath, filename, availableSkills: skills },
      deps,
    );

    const expectedDocPath = join(basePath, STAGING_DIRS.ready, filename);
    expect(deps.readFile).toHaveBeenCalledWith(expectedDocPath);
  });

  it('should pass available skills through to generateResourceManifest', async () => {
    const multiSkills = [
      makeSkill('vitest-runner', 'Runs vitest tests'),
      makeSkill('git-commit', 'Conventional commits'),
    ];
    const deps = makeDeps();
    await confirmWithResources(
      { basePath, filename, availableSkills: multiSkills },
      deps,
    );

    expect(deps.generateResourceManifest).toHaveBeenCalledWith(
      expect.objectContaining({
        availableSkills: multiSkills,
      }),
    );
  });

  it('should record queued step after manifest generation', async () => {
    const deps = makeDeps();
    await confirmWithResources(
      { basePath, filename, availableSkills: skills },
      deps,
    );

    const expectedMetaPath = join(basePath, STAGING_DIRS.ready, `${filename}.meta.json`);
    expect(deps.recordStep).toHaveBeenCalledWith('queued', expectedMetaPath);
  });

  it('should pass custom context window size to manifest generation', async () => {
    const deps = makeDeps();
    await confirmWithResources(
      { basePath, filename, availableSkills: skills, contextWindowSize: 100000 },
      deps,
    );

    expect(deps.generateResourceManifest).toHaveBeenCalledWith(
      expect.objectContaining({
        contextWindowSize: 100000,
      }),
    );
  });

  it('should forward additional context to confirmIntake', async () => {
    const deps = makeDeps();
    await confirmWithResources(
      { basePath, filename, availableSkills: skills, additionalContext: 'Extra info' },
      deps,
    );

    expect(deps.confirmIntake).toHaveBeenCalledWith(
      expect.objectContaining({
        additionalContext: 'Extra info',
      }),
    );
  });

  it('should allow each dependency to be overridden independently', async () => {
    const customReadFile = vi.fn().mockResolvedValue('custom content');
    const deps = makeDeps({ readFile: customReadFile });
    await confirmWithResources(
      { basePath, filename, availableSkills: skills },
      deps,
    );

    expect(customReadFile).toHaveBeenCalledOnce();
    // Other deps should still be the defaults from makeDeps
    expect(deps.confirmIntake).toHaveBeenCalledOnce();
    expect(deps.generateResourceManifest).toHaveBeenCalledOnce();
  });

  it('should propagate confirmIntake errors without writing manifest', async () => {
    const deps = makeDeps({
      confirmIntake: vi.fn().mockRejectedValue(new Error('Intake failed')),
    });

    await expect(
      confirmWithResources({ basePath, filename, availableSkills: skills }, deps),
    ).rejects.toThrow('Intake failed');

    expect(deps.writeFile).not.toHaveBeenCalled();
    expect(deps.recordStep).not.toHaveBeenCalled();
  });

  it('should write manifest as valid JSON that round-trips through parse', async () => {
    const manifest = makeManifest({ generatedAt: '2026-02-13T00:00:00.000Z' });
    const deps = makeDeps({
      generateResourceManifest: vi.fn().mockReturnValue(manifest),
    });
    await confirmWithResources(
      { basePath, filename, availableSkills: skills },
      deps,
    );

    const writtenJson = (deps.writeFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson);
    expect(parsed).toEqual(manifest);
  });
});
