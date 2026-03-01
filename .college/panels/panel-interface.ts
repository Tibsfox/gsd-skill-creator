/**
 * Panel Interface contract for the Rosetta Core system.
 *
 * Defines the abstract class that all language panels (Python, C++, Java,
 * Lisp, Pascal, Fortran, Perl, ALGOL, Unison) must implement, plus a
 * PanelRegistry for runtime panel discovery and lookup.
 *
 * @module panels/panel-interface
 */

import type { PanelId, PanelExpression, RosettaConcept } from '../rosetta-core/types.js';

// ─── Panel Capabilities ──────────────────────────────────────────────────────

/**
 * Describes what a panel can do, used by the Panel Router
 * to select the appropriate panel for a given context.
 */
export interface PanelCapabilities {
  /** Domains this panel handles well (e.g., 'mathematics', 'culinary-arts') */
  supportedDomains: string[];

  /** Math libraries available in this panel's language (e.g., 'numpy', 'cmath', 'java.math') */
  mathLibraries: string[];

  /** Whether this panel can generate executable code */
  hasCodeGeneration: boolean;

  /** Whether this panel includes teaching annotations and pedagogical notes */
  hasPedagogicalNotes: boolean;

  /** Output formats this panel supports (e.g., 'code', 'explanation', 'example') */
  expressionFormats: string[];
}

// ─── Panel Interface ─────────────────────────────────────────────────────────

/**
 * Abstract base class that all language panels must implement.
 *
 * A panel translates canonical RosettaConcepts into language-specific
 * expressions. Each panel brings its own pedagogical perspective --
 * Lisp teaches through homoiconicity, Pascal through structured programming,
 * Python through library ecosystems, etc.
 *
 * Panels self-register with the PanelRegistry so the Panel Router can
 * discover them at runtime.
 */
export abstract class PanelInterface {
  /** Unique panel identifier from the PanelId union type */
  abstract readonly panelId: PanelId;

  /** Human-readable panel name (e.g., 'Python Panel', 'Lisp Panel') */
  abstract readonly name: string;

  /** Brief description of this panel's pedagogical focus */
  abstract readonly description: string;

  /**
   * Translate a canonical concept into this panel's expression format.
   *
   * The returned PanelExpression should include the panel's unique
   * perspective -- not just a code translation, but pedagogical notes
   * explaining what exploring this concept in this language teaches.
   *
   * @param concept - The canonical RosettaConcept to translate
   * @returns A PanelExpression with this panel's rendering of the concept
   */
  abstract translate(concept: RosettaConcept): PanelExpression;

  /**
   * Return this panel's capabilities for routing decisions.
   *
   * The Panel Router uses capabilities to select the most appropriate
   * panel for a given context (domain, user preference, requested format).
   *
   * @returns PanelCapabilities describing what this panel can do
   */
  abstract getCapabilities(): PanelCapabilities;

  /**
   * Format a PanelExpression for output delivery.
   *
   * Converts the structured PanelExpression into a formatted string
   * suitable for display to the user. Each panel controls its own
   * output formatting.
   *
   * @param expression - The PanelExpression to format
   * @returns Formatted string representation of the expression
   */
  abstract formatExpression(expression: PanelExpression): string;
}

// ─── Panel Registry ──────────────────────────────────────────────────────────

/**
 * Registry for panel instances, enabling runtime discovery and lookup.
 *
 * Panels self-register during initialization. The Panel Router queries
 * the registry to find panels by ID or list all available panels.
 */
export class PanelRegistry {
  /** Internal storage of registered panels keyed by PanelId */
  private panels: Map<PanelId, PanelInterface> = new Map();

  /**
   * Register a panel instance in the registry.
   *
   * @param panel - The panel to register
   * @throws Error if a panel with the same PanelId is already registered
   */
  register(panel: PanelInterface): void {
    if (this.panels.has(panel.panelId)) {
      throw new Error(`Panel '${panel.panelId}' is already registered`);
    }
    this.panels.set(panel.panelId, panel);
  }

  /**
   * Retrieve a panel by its PanelId.
   *
   * @param id - The PanelId to look up
   * @returns The panel instance, or undefined if not registered
   */
  get(id: PanelId): PanelInterface | undefined {
    return this.panels.get(id);
  }

  /**
   * List all registered panels.
   *
   * @returns Array of all registered panel instances
   */
  getAll(): PanelInterface[] {
    return Array.from(this.panels.values());
  }

  /**
   * Check whether a panel with the given ID is registered.
   *
   * @param id - The PanelId to check
   * @returns true if the panel is registered, false otherwise
   */
  has(id: PanelId): boolean {
    return this.panels.has(id);
  }
}

/**
 * Module-level singleton registry instance.
 *
 * All panels register with this shared instance during initialization.
 * The Panel Router and other consumers query this registry.
 */
export const panelRegistry = new PanelRegistry();
