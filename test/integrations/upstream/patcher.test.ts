import { describe, it, expect } from 'vitest';
import type { ClassifiedEvent, AffectedComponent, ImpactManifest, PatchManifest } from '../../../src/upstream/types';
import {
  applyPatch,
  calculatePatchSize,
  createBackup,
  rollback,
  validatePatchBounds,
  checkCooldown,
  generatePatchContent,
} from '../../../src/upstream/patcher';

/** Helper: build a minimal ClassifiedEvent */
function makeEvent(overrides: Partial<ClassifiedEvent> = {}): ClassifiedEvent {
  return {
    id: 'evt-patch-001',
    channel: 'anthropic-docs',
    timestamp: '2026-02-26T00:00:00Z',
    content_hash_before: 'aaa',
    content_hash_after: 'bbb',
    diff_summary: 'Updated skill format',
    raw_content: 'content',
    change_type: 'enhancement',
    severity: 'P2',
    domains: ['skills'],
    auto_patchable: true,
    summary: 'Enhancement to skill format',
    confidence: 0.85,
    ...overrides,
  };
}

/** Helper: build a minimal AffectedComponent */
function makeComponent(overrides: Partial<AffectedComponent> = {}): AffectedComponent {
  return {
    component: 'skills/workflow/SKILL.md',
    impact: 'direct',
    status: 'active',
    blast_radius: 'workflow execution',
    action: 'update skill description',
    patchable: true,
    ...overrides,
  };
}

/** Helper: build a minimal ImpactManifest */
function makeManifest(overrides: Partial<ImpactManifest> = {}): ImpactManifest {
  return {
    change_id: 'evt-patch-001',
    classification: makeEvent(),
    affected_components: [makeComponent()],
    total_blast_radius: 1,
    ...overrides,
  };
}

/** Helper: generate realistic skill content long enough to keep patches under 20% */
function makeSkillContent(): string {
  return [
    '---',
    'version: 1.2.0',
    '---',
    '# GSD Workflow Skill',
    '',
    '## Description',
    'This skill manages the GSD workflow lifecycle including planning,',
    'execution, verification, and milestone completion phases.',
    '',
    '## Activation',
    'Activates when user requests project management or workflow operations.',
    '',
    '## Instructions',
    '1. Check current project state via STATE.md',
    '2. Route to appropriate GSD command based on user intent',
    '3. Execute the command with full context loading',
    '4. Update state after completion',
    '',
    '## Examples',
    '- "Plan the next phase" -> /gsd:plan-phase',
    '- "Build phase 3" -> /gsd:execute-phase 3',
    '- "Verify the work" -> /gsd:verify-work',
    '',
    '## Notes',
    'Always check ROADMAP.md before execution.',
    'Respect token budgets and context window limits.',
  ].join('\n');
}

describe('Skill Patcher', () => {
  describe('calculatePatchSize', () => {
    it('calculates diff percentage correctly', () => {
      const before = 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10';
      const after = 'line1\nline2\nLINE3-CHANGED\nline4\nline5\nline6\nline7\nline8\nline9\nline10';

      const size = calculatePatchSize(before, after);

      // 1 of 10 lines changed = ~10%
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(1);
    });

    it('returns 0 for identical content', () => {
      expect(calculatePatchSize('same', 'same')).toBe(0);
    });

    it('returns 1 for completely different content', () => {
      expect(calculatePatchSize('abc', 'xyz')).toBe(1);
    });
  });

  describe('safety-critical invariants', () => {
    it('SC-01: rejects patch exceeding 20% content change', () => {
      const result = validatePatchBounds(0.25, 'P2');
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/20%|bound/i);
    });

    it('SC-02: P0 changes never auto-patched', () => {
      const result = validatePatchBounds(0.05, 'P0');
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/P0|human|approval/i);
    });

    it('SC-03: P1 changes never auto-patched', () => {
      const result = validatePatchBounds(0.05, 'P1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/P1|human|approval/i);
    });

    it('SC-05: rollback restores byte-identical content (SHA-256)', async () => {
      const originalContent = 'Original skill content\nwith multiple lines\nand structure';
      let storedBackup = '';
      let restoredContent = '';

      const deps = {
        readFile: async (path: string): Promise<string> => {
          if (path.includes('backup')) return storedBackup;
          return originalContent;
        },
        writeFile: async (_path: string, content: string): Promise<void> => {
          restoredContent = content;
        },
        copyFile: async (_src: string, _dest: string): Promise<void> => {
          storedBackup = originalContent;
        },
        hashFile: async (_path: string): Promise<string> => 'sha256-abc123',
      };

      // Create backup
      await createBackup('skills/test/SKILL.md', '/rollbacks', deps);

      // Rollback
      await rollback('/rollbacks/backup', 'skills/test/SKILL.md', deps);

      expect(restoredContent).toBe(originalContent);
    });

    it('SC-10: backup created before every patch', async () => {
      let backupCreated = false;
      let patchApplied = false;
      const backupOrder: string[] = [];

      const deps = {
        readFile: async (): Promise<string> => makeSkillContent(),
        writeFile: async (): Promise<void> => {
          patchApplied = true;
          backupOrder.push('write');
        },
        copyFile: async (): Promise<void> => {
          backupCreated = true;
          backupOrder.push('backup');
        },
        hashFile: async (): Promise<string> => 'sha256-match',
        runValidation: async (): Promise<boolean> => true,
        getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [],
      };

      const manifest = makeManifest({
        classification: makeEvent({ severity: 'P2', auto_patchable: true }),
      });
      const component = makeComponent();

      await applyPatch(manifest, component, deps);

      expect(backupCreated).toBe(true);
      expect(backupOrder.indexOf('backup')).toBeLessThan(backupOrder.indexOf('write'));
    });

    it('SC-11: failed post-validation triggers automatic rollback', async () => {
      let rolledBack = false;

      const deps = {
        readFile: async (): Promise<string> => makeSkillContent(),
        writeFile: async (): Promise<void> => { /* patch applied */ },
        copyFile: async (): Promise<void> => { /* backup created */ },
        hashFile: async (): Promise<string> => 'sha256-match',
        runValidation: async (phase: string): Promise<boolean> => {
          if (phase === 'pre') return true;
          // Post-validation fails
          return false;
        },
        getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [],
      };

      const manifest = makeManifest({
        classification: makeEvent({ severity: 'P2', auto_patchable: true }),
      });
      const component = makeComponent();

      // Override writeFile to detect rollback (second write = rollback)
      let writeCount = 0;
      deps.writeFile = async (): Promise<void> => {
        writeCount++;
        if (writeCount > 1) rolledBack = true;
      };

      const result = await applyPatch(manifest, component, deps);

      expect(result.validation.tests_passed).toBe(false);
      expect(rolledBack).toBe(true);
    });

    it('SC-14: 7-day cooldown between re-patching same skill', async () => {
      const recentPatch = new Date();
      recentPatch.setDate(recentPatch.getDate() - 3); // 3 days ago

      const deps = {
        getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [
          { skill: 'skills/workflow/SKILL.md', timestamp: recentPatch.toISOString() },
        ],
      };

      const result = await checkCooldown('skills/workflow/SKILL.md', deps);

      expect(result.allowed).toBe(false);
      expect(result.cooldownUntil).toBeDefined();
    });
  });

  describe('patch operations', () => {
    it('generates complete patch manifest', async () => {
      const deps = {
        readFile: async (): Promise<string> => makeSkillContent(),
        writeFile: async (): Promise<void> => {},
        copyFile: async (): Promise<void> => {},
        hashFile: async (): Promise<string> => 'sha256-test',
        runValidation: async (): Promise<boolean> => true,
        getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [],
      };

      const manifest = makeManifest({
        classification: makeEvent({ severity: 'P2', auto_patchable: true }),
      });
      const component = makeComponent();

      const result = await applyPatch(manifest, component, deps);

      expect(result.patch_id).toBeTruthy();
      expect(result.change_id).toBe('evt-patch-001');
      expect(result.target_skill).toBe('skills/workflow/SKILL.md');
      expect(result.diff).toBeDefined();
      expect(result.backup_path).toBeTruthy();
      expect(result.validation).toBeDefined();
      expect(result.upstream_reference).toBeDefined();
      expect(result.upstream_reference.channel).toBe('anthropic-docs');
    });

    it('pre-validation runs before apply', async () => {
      const callOrder: string[] = [];

      const deps = {
        readFile: async (): Promise<string> => makeSkillContent(),
        writeFile: async (): Promise<void> => { callOrder.push('write'); },
        copyFile: async (): Promise<void> => { callOrder.push('backup'); },
        hashFile: async (): Promise<string> => 'sha256-test',
        runValidation: async (phase: string): Promise<boolean> => {
          callOrder.push(`validate-${phase}`);
          return phase === 'pre' ? false : true; // pre-validation fails
        },
        getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [],
      };

      const manifest = makeManifest({
        classification: makeEvent({ severity: 'P2', auto_patchable: true }),
      });

      const result = await applyPatch(manifest, makeComponent(), deps);

      // Pre-validation should fail and prevent write
      expect(result.validation.tests_passed).toBe(false);
      expect(callOrder).not.toContain('write');
    });

    it('post-validation runs after apply', async () => {
      const callOrder: string[] = [];

      const deps = {
        readFile: async (): Promise<string> => makeSkillContent(),
        writeFile: async (): Promise<void> => { callOrder.push('write'); },
        copyFile: async (): Promise<void> => {},
        hashFile: async (): Promise<string> => 'sha256-test',
        runValidation: async (phase: string): Promise<boolean> => {
          callOrder.push(`validate-${phase}`);
          return true;
        },
        getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [],
      };

      const manifest = makeManifest({
        classification: makeEvent({ severity: 'P2', auto_patchable: true }),
      });

      await applyPatch(manifest, makeComponent(), deps);

      const writeIdx = callOrder.indexOf('write');
      const postIdx = callOrder.indexOf('validate-post');
      expect(postIdx).toBeGreaterThan(writeIdx);
    });

    it('version bump in patched skill metadata', () => {
      const component = makeComponent();
      const currentContent = '---\nversion: 1.2.0\n---\n# Skill\nContent';
      const event = makeEvent();

      const patched = generatePatchContent(component, currentContent, event);

      // Version should be bumped
      expect(patched).toMatch(/version:\s*1\.2\.1/);
    });

    it('P2 enhancement changes ARE auto-patchable when under 20%', () => {
      const result = validatePatchBounds(0.15, 'P2');
      expect(result.allowed).toBe(true);
    });

    it('P3 informational changes are auto-patchable when under 20%', () => {
      const result = validatePatchBounds(0.10, 'P3');
      expect(result.allowed).toBe(true);
    });

    it('cooldown allows patching after 7+ days', async () => {
      const oldPatch = new Date();
      oldPatch.setDate(oldPatch.getDate() - 10); // 10 days ago

      const deps = {
        getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [
          { skill: 'skills/workflow/SKILL.md', timestamp: oldPatch.toISOString() },
        ],
      };

      const result = await checkCooldown('skills/workflow/SKILL.md', deps);

      expect(result.allowed).toBe(true);
      expect(result.cooldownUntil).toBeUndefined();
    });
  });
});
