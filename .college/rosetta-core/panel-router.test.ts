/**
 * Tests for PanelRouter -- all 6 routing rules, fallback behavior,
 * rationale, and registration errors.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PanelRouter } from './panel-router.js';
import type { TranslationContext, PanelSelection, ExpertiseLevel } from './panel-router.js';
import { PanelInterface } from '../panels/panel-interface.js';
import type { PanelCapabilities } from '../panels/panel-interface.js';
import type { PanelId, PanelExpression, RosettaConcept } from './types.js';

// ─── Mock Panel ───────────────────────────────────────────────────────────────

class MockPanel extends PanelInterface {
  readonly panelId: PanelId;
  readonly name: string;
  readonly description: string;
  private readonly domains: string[];

  constructor(id: PanelId, domains: string[] = ['mathematics']) {
    super();
    this.panelId = id;
    this.name = `Mock ${id}`;
    this.description = `Test panel for ${id}`;
    this.domains = domains;
  }

  translate(concept: RosettaConcept): PanelExpression {
    return { panelId: this.panelId, code: `${this.panelId} code`, explanation: `${this.panelId} explanation` };
  }

  getCapabilities(): PanelCapabilities {
    return {
      supportedDomains: this.domains,
      mathLibraries: [],
      hasCodeGeneration: this.panelId !== 'natural',
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    return `[${expression.panelId}: ${expression.code || expression.explanation}]`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<TranslationContext> = {}): TranslationContext {
  return {
    userExpertise: 'intermediate',
    currentDomain: 'mathematics',
    recentPanels: [],
    taskType: 'explain',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PanelRouter', () => {
  let router: PanelRouter;
  const allPanelIds: PanelId[] = ['python', 'cpp', 'java', 'lisp', 'pascal', 'fortran', 'algol', 'unison', 'natural'];

  beforeEach(() => {
    router = new PanelRouter();
    // Register all mock panels
    for (const id of allPanelIds) {
      router.registerPanel(new MockPanel(id));
    }
  });

  describe('Rule 1: explicit format override', () => {
    it('selects the explicitly requested panel regardless of other signals', () => {
      const context = makeContext({
        requestedFormat: 'lisp',
        userExpertise: 'novice',
        taskType: 'implement',
      });
      const selection = router.selectPanels(context, allPanelIds);

      expect(selection.primary).toBe('lisp');
    });

    it('selects requested format even when not in available panels', () => {
      const context = makeContext({ requestedFormat: 'fortran' });
      const selection = router.selectPanels(context, ['python', 'cpp']);

      expect(selection.primary).toBe('fortran');
    });
  });

  describe('Rule 2: implementation task preference', () => {
    it('selects a systems panel for implementation tasks', () => {
      const context = makeContext({
        taskType: 'implement',
        userExpertise: 'expert',
      });
      const selection = router.selectPanels(context, allPanelIds);

      expect(['python', 'cpp', 'java']).toContain(selection.primary);
    });

    it('prefers python first among systems panels', () => {
      const context = makeContext({ taskType: 'implement' });
      const selection = router.selectPanels(context, allPanelIds);

      expect(selection.primary).toBe('python');
    });
  });

  describe('Rule 3: explanation task expertise matching', () => {
    it('selects natural or python for novice explanations', () => {
      const context = makeContext({
        taskType: 'explain',
        userExpertise: 'novice',
      });
      const selection = router.selectPanels(context, allPanelIds);

      expect(['natural', 'python']).toContain(selection.primary);
    });

    it('selects python or lisp for intermediate explanations', () => {
      const context = makeContext({
        taskType: 'explain',
        userExpertise: 'intermediate',
      });
      const selection = router.selectPanels(context, allPanelIds);

      expect(['python', 'lisp']).toContain(selection.primary);
    });

    it('selects lisp or pascal for advanced explanations', () => {
      const context = makeContext({
        taskType: 'explain',
        userExpertise: 'advanced',
      });
      const selection = router.selectPanels(context, allPanelIds);

      expect(['lisp', 'pascal']).toContain(selection.primary);
    });

    it('selects cpp, fortran, or algol for expert explanations', () => {
      const context = makeContext({
        taskType: 'explain',
        userExpertise: 'expert',
      });
      const selection = router.selectPanels(context, allPanelIds);

      expect(['cpp', 'fortran', 'algol']).toContain(selection.primary);
    });
  });

  describe('Rule 4: comparison task secondary panels', () => {
    it('includes secondary panels for comparison tasks', () => {
      const context = makeContext({ taskType: 'compare' });
      const selection = router.selectPanels(context, allPanelIds);

      expect(selection.secondary).toBeDefined();
      expect(selection.secondary!.length).toBeGreaterThanOrEqual(1);
    });

    it('selects diverse panels (systems + heritage) for comparison', () => {
      const context = makeContext({ taskType: 'compare' });
      const selection = router.selectPanels(context, allPanelIds);

      const systemsPanels = ['python', 'cpp', 'java'];
      const heritagePanels = ['lisp', 'pascal', 'fortran', 'algol', 'unison'];

      const allSelected = [selection.primary, ...(selection.secondary || [])];
      const hasSystem = allSelected.some((p) => systemsPanels.includes(p));
      const hasHeritage = allSelected.some((p) => heritagePanels.includes(p));

      expect(hasSystem).toBe(true);
      expect(hasHeritage).toBe(true);
    });
  });

  describe('Rule 5: exploration avoids recent panels', () => {
    it('selects a panel NOT in recentPanels', () => {
      const context = makeContext({
        taskType: 'explore',
        recentPanels: ['python', 'cpp', 'java', 'lisp'],
      });
      const selection = router.selectPanels(context, allPanelIds);

      expect(context.recentPanels).not.toContain(selection.primary);
    });

    it('falls back when all panels are recent', () => {
      const context = makeContext({
        taskType: 'explore',
        recentPanels: [...allPanelIds],
      });
      const selection = router.selectPanels(context, allPanelIds);

      // Should still return a panel (fallback behavior)
      expect(selection.primary).toBeDefined();
    });
  });

  describe('Rule 6: Complex Plane angle bias', () => {
    it('prefers systems panels for concrete concepts (angle near 0)', () => {
      const context = makeContext({
        taskType: 'explain',
        userExpertise: 'intermediate',
        conceptComplexPosition: { real: 0.9, imaginary: 0.1, magnitude: 0.91, angle: 0.1 },
      });
      const selection = router.selectPanels(context, allPanelIds);

      // With angle=0.1 (concrete), systems panels should be preferred
      // For intermediate explain, preference is python/lisp, but with concrete bias
      // python (a systems panel) should be selected
      expect(['python', 'cpp', 'java']).toContain(selection.primary);
    });

    it('prefers heritage panels for abstract concepts (angle near pi/2)', () => {
      const context = makeContext({
        taskType: 'explain',
        userExpertise: 'intermediate',
        conceptComplexPosition: { real: 0.1, imaginary: 0.9, magnitude: 0.91, angle: 1.4 },
      });
      const selection = router.selectPanels(context, allPanelIds);

      // With angle=1.4 (abstract, near pi/2), heritage panels should be preferred
      // The reordering puts heritage panels first, and explain/intermediate prefers python/lisp
      // Lisp is heritage, so it should be picked
      expect(['lisp', 'pascal', 'fortran', 'algol', 'unison']).toContain(selection.primary);
    });
  });

  describe('fallback behavior', () => {
    it('falls back to natural panel when no preferred panel is available', () => {
      const context = makeContext({
        taskType: 'implement',
      });
      // Only 'natural' and heritage panels available - no systems panels
      const selection = router.selectPanels(context, ['natural', 'lisp']);

      // implement prefers systems panels, none available, so fallback
      expect(selection.primary).toBeDefined();
    });

    it('falls back to natural when availablePanelIds is empty', () => {
      const context = makeContext({ taskType: 'explain' });
      const selection = router.selectPanels(context, []);

      expect(selection.primary).toBe('natural');
    });
  });

  describe('rationale always present', () => {
    it('includes rationale for every selection', () => {
      const testCases: Partial<TranslationContext>[] = [
        { requestedFormat: 'python' },
        { taskType: 'implement' },
        { taskType: 'explain', userExpertise: 'novice' },
        { taskType: 'compare' },
        { taskType: 'explore', recentPanels: ['python'] },
      ];

      for (const overrides of testCases) {
        const context = makeContext(overrides);
        const selection = router.selectPanels(context, allPanelIds);
        expect(selection.rationale).toBeTruthy();
        expect(selection.rationale.length).toBeGreaterThan(0);
      }
    });
  });

  describe('registration errors', () => {
    it('throws when registering duplicate panel', () => {
      const router2 = new PanelRouter();
      router2.registerPanel(new MockPanel('python'));
      expect(() => router2.registerPanel(new MockPanel('python'))).toThrow(/already registered/);
    });

    it('getPanelCapabilities returns undefined for unregistered panel', () => {
      const router2 = new PanelRouter();
      expect(router2.getPanelCapabilities('python')).toBeUndefined();
    });

    it('getRegisteredPanelIds returns all registered IDs', () => {
      const ids = router.getRegisteredPanelIds();
      expect(ids).toHaveLength(allPanelIds.length);
      for (const id of allPanelIds) {
        expect(ids).toContain(id);
      }
    });
  });
});
