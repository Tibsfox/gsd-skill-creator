/**
 * Expression Renderer -- formats panel expressions for output delivery.
 *
 * Takes a RosettaConcept, a panel ID, and a depth level to produce
 * formatted output with token cost accounting. Supports three-tier
 * progressive disclosure (summary ~200 tokens, active ~1K, deep ~5K+)
 * and calibration-adjusted rendering.
 *
 * @module rosetta-core/expression-renderer
 */

import type {
  RosettaConcept,
  PanelId,
  PanelExpression,
  CalibrationProfile,
  ConceptRelationship,
} from './types.js';
import type { PanelInterface } from '../panels/panel-interface.js';

// ─── Exported Types ───────────────────────────────────────────────────────────

/**
 * Depth level for rendering, controlling progressive disclosure tier.
 *
 * - summary: ~200 tokens -- concept name, one-line description, key relationships
 * - active: ~1K tokens -- code/explanation, core examples, immediate cross-references
 * - deep: ~5K+ tokens -- full implementation, pedagogical annotations, historical context
 */
export type RenderDepth = 'summary' | 'active' | 'deep';

/**
 * The rendered output of a concept expression, including content,
 * metadata, and token cost estimate.
 */
export interface RenderedExpression {
  /** The formatted expression content */
  content: string;

  /** Which panel produced this expression */
  panelId: PanelId;

  /** Teaching annotations (included at deep depth) */
  pedagogicalNotes?: string;

  /** IDs of cross-referenced concepts */
  crossReferences?: string[];

  /** Estimated token cost of the content */
  tokenCost: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Approximate characters per token for cost estimation */
const CHARS_PER_TOKEN = 4;

/** Maximum tokens for summary tier */
const SUMMARY_TOKEN_LIMIT = 200;

/** Maximum tokens for active tier */
const ACTIVE_TOKEN_LIMIT = 1000;

// ─── Expression Renderer ──────────────────────────────────────────────────────

/**
 * Renders concept expressions at different depth levels with token cost tracking.
 *
 * The renderer is stateless -- it receives the panel instance (or undefined
 * for fallback rendering) as a parameter rather than looking it up from a
 * registry. This keeps it decoupled and easily testable.
 */
export class ExpressionRenderer {
  /**
   * Render a concept expression at the specified depth level.
   *
   * @param concept - The concept to render
   * @param panelId - The target panel for rendering
   * @param panel - The panel instance (undefined triggers natural-language fallback)
   * @param depth - The rendering depth tier
   * @returns A RenderedExpression with content and token cost
   */
  render(
    concept: RosettaConcept,
    panelId: PanelId,
    panel: PanelInterface | undefined,
    depth: RenderDepth,
  ): RenderedExpression {
    const expression = concept.panels.get(panelId);

    // If no panel instance or no expression for this panel, fall back to natural language
    if (!panel || !expression) {
      return this.buildNaturalFallback(concept, panelId);
    }

    switch (depth) {
      case 'summary':
        return this.buildSummary(concept, panelId);
      case 'active':
        return this.buildActive(concept, panelId, panel, expression);
      case 'deep':
        return this.buildDeep(concept, panelId, panel, expression);
    }
  }

  /**
   * Render with calibration-adjusted depth selection.
   *
   * Derives the appropriate depth from the calibration profile:
   * - High confidence + negative complexity adjustment -> summary (simplify)
   * - High confidence + positive complexity adjustment -> deep (elaborate)
   * - Otherwise -> active (default)
   *
   * @param concept - The concept to render
   * @param panelId - The target panel for rendering
   * @param panel - The panel instance (undefined triggers fallback)
   * @param calibration - The user's calibration profile for the domain
   * @returns A RenderedExpression with calibration-adjusted depth
   */
  renderCalibrated(
    concept: RosettaConcept,
    panelId: PanelId,
    panel: PanelInterface | undefined,
    calibration: CalibrationProfile,
  ): RenderedExpression {
    const depth = this.deriveDepthFromCalibration(calibration);
    return this.render(concept, panelId, panel, depth);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Build a summary-depth rendering.
   *
   * Produces "{name}: {description}" plus relationship IDs.
   * Truncates to stay within SUMMARY_TOKEN_LIMIT.
   * Does NOT call panel.formatExpression.
   */
  private buildSummary(concept: RosettaConcept, panelId: PanelId): RenderedExpression {
    const relationshipIds = concept.relationships.map((r) => r.targetId);
    let content = `${concept.name}: ${concept.description}`;

    if (relationshipIds.length > 0) {
      content += `\nRelated: ${relationshipIds.join(', ')}`;
    }

    // Truncate to token limit
    const maxChars = SUMMARY_TOKEN_LIMIT * CHARS_PER_TOKEN;
    if (content.length > maxChars) {
      content = content.slice(0, maxChars - 3) + '...';
    }

    const crossReferences = this.extractCrossReferences(concept);

    return {
      content,
      panelId,
      crossReferences: crossReferences.length > 0 ? crossReferences : undefined,
      tokenCost: this.estimateTokens(content),
    };
  }

  /**
   * Build an active-depth rendering.
   *
   * Calls panel.formatExpression, includes explanation and first 2 examples.
   * Truncates to stay within ACTIVE_TOKEN_LIMIT.
   */
  private buildActive(
    concept: RosettaConcept,
    panelId: PanelId,
    panel: PanelInterface,
    expression: PanelExpression,
  ): RenderedExpression {
    const parts: string[] = [];

    // Formatted panel output
    const formatted = panel.formatExpression(expression);
    parts.push(formatted);

    // Explanation
    if (expression.explanation) {
      parts.push(expression.explanation);
    }

    // First 2 examples
    if (expression.examples && expression.examples.length > 0) {
      const examples = expression.examples.slice(0, 2);
      parts.push('Examples:');
      for (const ex of examples) {
        parts.push(`  - ${ex}`);
      }
    }

    let content = parts.join('\n');

    // Truncate to token limit
    const maxChars = ACTIVE_TOKEN_LIMIT * CHARS_PER_TOKEN;
    const truncationMarker = '\n... [truncated at active tier]';
    if (content.length > maxChars) {
      content = content.slice(0, maxChars - truncationMarker.length) + truncationMarker;
    }

    const crossReferences = this.extractCrossReferences(concept);

    return {
      content,
      panelId,
      crossReferences: crossReferences.length > 0 ? crossReferences : undefined,
      tokenCost: this.estimateTokens(content),
    };
  }

  /**
   * Build a deep-depth rendering.
   *
   * Full content -- formatExpression output, all examples, pedagogical notes,
   * all cross-reference IDs. No truncation.
   */
  private buildDeep(
    concept: RosettaConcept,
    panelId: PanelId,
    panel: PanelInterface,
    expression: PanelExpression,
  ): RenderedExpression {
    const parts: string[] = [];

    // Formatted panel output
    const formatted = panel.formatExpression(expression);
    parts.push(formatted);

    // Full explanation
    if (expression.explanation) {
      parts.push(expression.explanation);
    }

    // All examples
    if (expression.examples && expression.examples.length > 0) {
      parts.push('Examples:');
      for (const ex of expression.examples) {
        parts.push(`  - ${ex}`);
      }
    }

    // Pedagogical notes
    if (expression.pedagogicalNotes) {
      parts.push(`Pedagogical Notes: ${expression.pedagogicalNotes}`);
    }

    // Historical context from description
    parts.push(`Context: ${concept.description}`);

    // Cross-references
    const crossReferences = this.extractCrossReferences(concept);
    if (crossReferences.length > 0) {
      parts.push(`Cross-references: ${crossReferences.join(', ')}`);
    }

    const content = parts.join('\n');

    return {
      content,
      panelId,
      pedagogicalNotes: expression.pedagogicalNotes,
      crossReferences: crossReferences.length > 0 ? crossReferences : undefined,
      tokenCost: this.estimateTokens(content),
    };
  }

  /**
   * Build a natural-language fallback rendering.
   *
   * Used when the concept has no expression for the requested panel
   * or when no panel instance is available.
   */
  private buildNaturalFallback(
    concept: RosettaConcept,
    requestedPanelId: PanelId,
  ): RenderedExpression {
    const parts: string[] = [];

    parts.push(`${concept.name}: ${concept.description}`);

    // Include relationships for context
    if (concept.relationships.length > 0) {
      const relDescriptions = concept.relationships.map(
        (r) => `${r.type}: ${r.targetId} (${r.description})`,
      );
      parts.push('Relationships:');
      for (const rel of relDescriptions) {
        parts.push(`  - ${rel}`);
      }
    }

    const content = parts.join('\n');
    const crossReferences = this.extractCrossReferences(concept);

    return {
      content,
      panelId: requestedPanelId,
      crossReferences: crossReferences.length > 0 ? crossReferences : undefined,
      tokenCost: this.estimateTokens(content),
    };
  }

  /**
   * Estimate token count from content length.
   * Uses the ~4 characters per token approximation.
   */
  private estimateTokens(content: string): number {
    return Math.ceil(content.length / CHARS_PER_TOKEN);
  }

  /**
   * Extract cross-reference target IDs from a concept's relationships.
   */
  private extractCrossReferences(concept: RosettaConcept): string[] {
    return concept.relationships
      .filter((r) => r.type === 'cross-reference')
      .map((r) => r.targetId);
  }

  /**
   * Derive rendering depth from a calibration profile.
   *
   * - High confidence (>0.7) + negative complexity -> summary
   * - High confidence (>0.7) + positive complexity -> deep
   * - Otherwise -> active
   */
  private deriveDepthFromCalibration(calibration: CalibrationProfile): RenderDepth {
    if (calibration.confidenceScore > 0.7 && calibration.deltas.length > 0) {
      // Use the most recent delta
      const recentDelta = calibration.deltas[calibration.deltas.length - 1];
      const complexityAdjustment = recentDelta.adjustment.complexity;

      if (complexityAdjustment !== undefined) {
        if (complexityAdjustment < 0) {
          return 'summary';
        }
        if (complexityAdjustment > 0) {
          return 'deep';
        }
      }
    }

    return 'active';
  }
}
