/**
 * Tests for CollegeLoader.populateRegistry and the shared concept parser.
 *
 * Loads the real .college/departments tree and proves that disk-loaded
 * concepts carry their panels Map and complexPlanePosition, that the
 * ConceptRegistry actually gets populated, and that a populated registry
 * makes RosettaCore.translate resolve a real concept.
 */

import { describe, it, expect } from 'vitest';
import { CollegeLoader } from './college-loader.js';
import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import { RosettaCore } from '../rosetta-core/engine.js';
import { PanelRouter } from '../rosetta-core/panel-router.js';
import type { TranslationContext } from '../rosetta-core/panel-router.js';
import { ExpressionRenderer } from '../rosetta-core/expression-renderer.js';
import { PanelInterface } from '../panels/panel-interface.js';
import type { PanelCapabilities } from '../panels/panel-interface.js';
import type { PanelId, PanelExpression, RosettaConcept } from '../rosetta-core/types.js';

class MockPanel extends PanelInterface {
  readonly panelId: PanelId;
  readonly name: string;
  readonly description: string;

  constructor(id: PanelId) {
    super();
    this.panelId = id;
    this.name = `Mock ${id}`;
    this.description = `Test panel for ${id}`;
  }

  translate(concept: RosettaConcept): PanelExpression {
    return concept.panels.get(this.panelId) || { panelId: this.panelId };
  }

  getCapabilities(): PanelCapabilities {
    return {
      supportedDomains: ['mathematics', 'ai-computation'],
      mathLibraries: [],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    return `[${expression.panelId}] ${expression.explanation || expression.code || 'no content'}`;
  }
}

describe('CollegeLoader.populateRegistry', () => {
  it('populates a ConceptRegistry from the real departments tree', () => {
    const loader = new CollegeLoader();
    const registry = new ConceptRegistry();
    const count = loader.populateRegistry(registry);

    expect(count).toBeGreaterThan(0);
    expect(registry.getAll().length).toBe(count);
  });

  it('loads a concept WITH non-empty panels AND a defined complexPlanePosition', () => {
    const loader = new CollegeLoader();
    const registry = new ConceptRegistry();
    loader.populateRegistry(registry);

    const concept = registry.get('ai-computation-bounded-learning-theorem');
    expect(concept).toBeDefined();
    expect(concept!.panels.size).toBeGreaterThan(0);
    expect(concept!.panels.get('python')?.explanation).toBeTruthy();

    const pos = concept!.complexPlanePosition;
    expect(pos).toBeDefined();
    expect(typeof pos!.real).toBe('number');
    expect(typeof pos!.magnitude).toBe('number');
    expect(Number.isFinite(pos!.angle)).toBe(true);
  });

  it('resolves the computed-position family (const theta/radius)', () => {
    const loader = new CollegeLoader();
    const registry = new ConceptRegistry();
    loader.populateRegistry(registry);

    const complexNumbers = registry.get('math-complex-numbers');
    expect(complexNumbers).toBeDefined();
    const pos = complexNumbers!.complexPlanePosition;
    expect(pos).toBeDefined();
    // const theta = Math.PI / 3; const radius = 0.85 -> real = 0.85*cos(pi/3)
    expect(pos!.real).toBeCloseTo(0.85 * Math.cos(Math.PI / 3), 6);
    expect(pos!.imaginary).toBeCloseTo(0.85 * Math.sin(Math.PI / 3), 6);
  });

  it('makes RosettaCore.translate resolve a populated concept', async () => {
    const loader = new CollegeLoader();
    const registry = new ConceptRegistry();
    loader.populateRegistry(registry);

    const router = new PanelRouter();
    const renderer = new ExpressionRenderer();
    const panelInstances = new Map<PanelId, PanelInterface>([
      ['python', new MockPanel('python')],
    ]);
    const engine = new RosettaCore({ registry, router, renderer, panelInstances });

    const context: TranslationContext = {
      userExpertise: 'intermediate',
      currentDomain: 'ai-computation',
      recentPanels: [],
      taskType: 'explain',
      requestedFormat: 'python',
    };

    const translation = await engine.translate(
      'ai-computation-bounded-learning-theorem',
      context,
    );
    expect(translation.concept.id).toBe('ai-computation-bounded-learning-theorem');
    expect(translation.concept.panels.size).toBeGreaterThan(0);
  });
});
