/**
 * Mock panel smoke tests proving the PanelInterface contract is implementable.
 *
 * These tests create a real MockPanel extending PanelInterface,
 * exercise all abstract methods, and verify PanelRegistry behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PanelInterface, PanelRegistry, panelRegistry } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type {
  RosettaConcept,
  PanelExpression,
  PanelId,
} from '../rosetta-core/types.js';

// ─── Mock Panel Implementation ───────────────────────────────────────────────

/**
 * A concrete panel implementation for testing the PanelInterface contract.
 * Uses 'natural' as its PanelId since it's a general-purpose test panel.
 */
class MockPanel extends PanelInterface {
  readonly panelId: PanelId = 'natural';
  readonly name = 'Mock Panel';
  readonly description = 'Test panel for contract verification';

  translate(concept: RosettaConcept): PanelExpression {
    return {
      panelId: this.panelId,
      explanation: `${concept.name}: ${concept.description}`,
      examples: [`Example of ${concept.name}`],
      pedagogicalNotes: `Exploring ${concept.name} in natural language`,
    };
  }

  getCapabilities(): PanelCapabilities {
    return {
      supportedDomains: ['test', 'general'],
      mathLibraries: [],
      hasCodeGeneration: false,
      hasPedagogicalNotes: true,
      expressionFormats: ['explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];
    if (expression.explanation) {
      parts.push(expression.explanation);
    }
    if (expression.examples && expression.examples.length > 0) {
      parts.push(`Examples: ${expression.examples.join(', ')}`);
    }
    return parts.join('\n');
  }
}

// ─── Test Data ───────────────────────────────────────────────────────────────

/** Minimal valid RosettaConcept for testing translate() */
const testConcept: RosettaConcept = {
  id: 'test-concept',
  name: 'Test Concept',
  domain: 'test',
  description: 'A concept for testing panel translation',
  panels: new Map(),
  relationships: [],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PanelInterface', () => {
  it('MockPanel implements PanelInterface', () => {
    const panel = new MockPanel();

    expect(panel).toBeInstanceOf(PanelInterface);
    expect(panel.panelId).toBe('natural');
    expect(panel.name).toBe('Mock Panel');
    expect(panel.description).toBe('Test panel for contract verification');
  });

  it('MockPanel.translate() returns valid PanelExpression', () => {
    const panel = new MockPanel();
    const expression = panel.translate(testConcept);

    expect(expression.panelId).toBe('natural');
    expect(expression.explanation).toContain('Test Concept');
    expect(expression.examples).toBeDefined();
    expect(expression.examples!.length).toBeGreaterThan(0);
    expect(expression.pedagogicalNotes).toContain('Test Concept');
  });

  it('MockPanel.getCapabilities() returns valid capabilities', () => {
    const panel = new MockPanel();
    const capabilities = panel.getCapabilities();

    expect(capabilities.supportedDomains).toContain('test');
    expect(capabilities.supportedDomains).toContain('general');
    expect(capabilities.hasCodeGeneration).toBe(false);
    expect(capabilities.hasPedagogicalNotes).toBe(true);
    expect(capabilities.expressionFormats).toContain('explanation');
    expect(capabilities.mathLibraries).toEqual([]);
  });

  it('MockPanel.formatExpression() returns formatted string', () => {
    const panel = new MockPanel();
    const expression = panel.translate(testConcept);
    const formatted = panel.formatExpression(expression);

    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toContain('Test Concept');
  });
});

describe('PanelRegistry', () => {
  let registry: PanelRegistry;

  beforeEach(() => {
    // Fresh registry for each test to avoid cross-test pollution
    registry = new PanelRegistry();
  });

  it('PanelRegistry accepts and retrieves panel', () => {
    const panel = new MockPanel();
    registry.register(panel);

    const retrieved = registry.get('natural');
    expect(retrieved).toBeDefined();
    expect(retrieved).toBe(panel);
    expect(retrieved!.panelId).toBe('natural');
  });

  it('PanelRegistry.has() returns correct boolean', () => {
    const panel = new MockPanel();
    registry.register(panel);

    expect(registry.has('natural')).toBe(true);
    expect(registry.has('python')).toBe(false);
    expect(registry.has('lisp')).toBe(false);
  });

  it('PanelRegistry.getAll() returns all registered panels', () => {
    expect(registry.getAll()).toHaveLength(0);

    const panel = new MockPanel();
    registry.register(panel);

    const all = registry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toBe(panel);
  });

  it('PanelRegistry.get() returns undefined for unregistered panel', () => {
    expect(registry.get('python')).toBeUndefined();
  });

  it('PanelRegistry rejects duplicate registration', () => {
    const panel1 = new MockPanel();
    const panel2 = new MockPanel();
    registry.register(panel1);

    expect(() => registry.register(panel2)).toThrowError(
      "Panel 'natural' is already registered"
    );
  });

  it('module-level panelRegistry singleton exists', () => {
    expect(panelRegistry).toBeInstanceOf(PanelRegistry);
  });
});
