/**
 * Rosetta Core translation engine -- translates concepts across panels.
 *
 * Orchestrates the full translation pipeline: concept lookup from the
 * ConceptRegistry, panel selection via PanelRouter, expression rendering
 * through ExpressionRenderer, and a stub feedback path for the
 * Calibration Engine (Phase 3).
 *
 * @module rosetta-core/engine
 */

import type {
  RosettaConcept,
  PanelId,
  CalibrationDelta,
  CalibrationProfile,
} from './types.js';
import { ConceptRegistry, ConceptNotFoundError } from './concept-registry.js';
import { PanelRouter } from './panel-router.js';
import type { TranslationContext, PanelSelection } from './panel-router.js';
import { ExpressionRenderer } from './expression-renderer.js';
import type { RenderedExpression } from './expression-renderer.js';
import type { PanelInterface } from '../panels/panel-interface.js';
import { CalibrationEngine } from '../calibration/engine.js';
import type { UserFeedback as CalibrationFeedback } from '../calibration/engine.js';
import { InMemoryDeltaStore } from '../calibration/in-memory-delta-store.js';
import { complexityModel, COMPLEXITY_DOMAIN } from '../calibration/models/pedagogy.js';

// Re-export for consumers
export { ConceptNotFoundError } from './concept-registry.js';

// ─── Exported Interfaces ──────────────────────────────────────────────────────

/**
 * The result of a concept translation through the Rosetta Core pipeline.
 *
 * Contains the primary rendered expression, optional secondary expressions
 * for comparison, the original concept, panel selection details, and
 * any loaded dependencies.
 */
export interface Translation {
  /** Unique translation identifier */
  id: string;

  /** Primary rendered expression from the selected panel */
  primary: RenderedExpression;

  /** Optional secondary rendered expressions for comparison views */
  secondary?: RenderedExpression[];

  /** The original concept that was translated */
  concept: RosettaConcept;

  /** Panel selection details including rationale */
  panels: PanelSelection;

  /** Dependency concepts that were loaded during translation */
  dependenciesLoaded: RosettaConcept[];
}

/**
 * User feedback on a translation, used to generate calibration deltas.
 */
export interface UserFeedback {
  /** ID of the translation being rated */
  translationId: string;

  /** User's rating of the translation quality */
  rating: 'helpful' | 'too-simple' | 'too-complex' | 'wrong-panel';

  /** Optional free-text comment */
  comment?: string;
}

/**
 * Configuration options for constructing a RosettaCore instance.
 */
export interface RosettaCoreOptions {
  /** Concept registry for concept lookup */
  registry: ConceptRegistry;

  /** Panel router for panel selection */
  router: PanelRouter;

  /** Expression renderer for output formatting */
  renderer: ExpressionRenderer;

  /** Map of panel instances for rendering */
  panelInstances: Map<PanelId, PanelInterface>;

  /**
   * Calibration engine that turns user feedback into persisted CalibrationDeltas.
   * Optional -- when omitted, an in-memory engine is created. The pedagogical
   * `complexity` model is always (re)registered so processFeedback works
   * regardless of what the injected engine was pre-configured with.
   */
  calibrationEngine?: CalibrationEngine;
}

// ─── Rosetta Core Engine ──────────────────────────────────────────────────────

/**
 * The Rosetta Core translation engine.
 *
 * Wires ConceptRegistry, PanelRouter, and ExpressionRenderer into a
 * unified `translate()` pipeline. Also provides `processFeedback()` as
 * a stub integration point for the Calibration Engine (Phase 3).
 *
 * @example
 * ```typescript
 * const engine = new RosettaCore({ registry, router, renderer, panelInstances });
 * const translation = await engine.translate('exponential-decay', context);
 * console.log(translation.primary.content);
 * ```
 */
export class RosettaCore {
  private readonly registry: ConceptRegistry;
  private readonly router: PanelRouter;
  private readonly renderer: ExpressionRenderer;
  private readonly panelInstances: Map<PanelId, PanelInterface>;
  private readonly calibrationEngine: CalibrationEngine;

  constructor(options: RosettaCoreOptions) {
    this.registry = options.registry;
    this.router = options.router;
    this.renderer = options.renderer;
    this.panelInstances = options.panelInstances;
    this.calibrationEngine =
      options.calibrationEngine ?? new CalibrationEngine(new InMemoryDeltaStore());
    // Guarantee the pedagogical complexity model is available regardless of how
    // an injected engine was configured. replaceModel is idempotent.
    this.calibrationEngine.replaceModel(complexityModel);
  }

  /**
   * Translate a concept through the full Rosetta Core pipeline.
   *
   * Steps:
   * 1. Look up concept in registry
   * 2. Load dependencies
   * 3. Get available panels for the concept
   * 4. Supply concept's Complex Plane position to context
   * 5. Route to select panel(s)
   * 6. Render primary expression (calibrated if profile exists)
   * 7. Render secondary expressions at summary depth
   * 8. Return Translation with generated ID
   *
   * @param conceptId - The ID of the concept to translate
   * @param context - The translation context (user expertise, task type, etc.)
   * @returns A Translation containing the rendered expression(s)
   * @throws ConceptNotFoundError if the concept ID does not exist in the registry
   */
  async translate(
    conceptId: string,
    context: TranslationContext,
  ): Promise<Translation> {
    // Step 1: Look up concept
    const concept = this.registry.get(conceptId);
    if (!concept) {
      throw new ConceptNotFoundError(conceptId);
    }

    // Step 2: Load dependencies
    let dependenciesLoaded: RosettaConcept[] = [];
    try {
      dependenciesLoaded = this.registry.getDependencies(conceptId);
    } catch {
      // Circular dependencies are non-fatal for translation -- continue without deps
      dependenciesLoaded = [];
    }

    // Step 3: Get available panels
    const availablePanelIds = this.registry.getAvailablePanels(conceptId);

    // Step 4: Supply Complex Plane position to context
    const enrichedContext: TranslationContext = {
      ...context,
      conceptComplexPosition: concept.complexPlanePosition,
    };

    // Step 5: Route to select panel(s)
    const panelSelection = this.router.selectPanels(enrichedContext, availablePanelIds);

    // Step 6: Render primary expression
    const primaryPanel = this.panelInstances.get(panelSelection.primary);
    let primary: RenderedExpression;

    const calibration = this.getUserCalibration(concept);
    if (calibration) {
      primary = this.renderer.renderCalibrated(
        concept,
        panelSelection.primary,
        primaryPanel,
        calibration,
      );
    } else {
      primary = this.renderer.render(
        concept,
        panelSelection.primary,
        primaryPanel,
        'active',
      );
    }

    // Step 7: Render secondary expressions at summary depth
    let secondary: RenderedExpression[] | undefined;
    if (panelSelection.secondary && panelSelection.secondary.length > 0) {
      secondary = panelSelection.secondary.map((panelId) => {
        const panel = this.panelInstances.get(panelId);
        return this.renderer.render(concept, panelId, panel, 'summary');
      });
    }

    // Step 8: Build and return Translation
    const translationId = `translation-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return {
      id: translationId,
      primary,
      secondary,
      concept,
      panels: panelSelection,
      dependenciesLoaded,
    };
  }

  /**
   * Process user feedback on a translation through the CalibrationEngine.
   *
   * The rating is mapped to the pedagogical `complexity` domain and run through
   * the universal Observe->Compare->Adjust->Record loop, producing a real,
   * persisted CalibrationDelta on the `complexity` parameter -- the same key
   * ExpressionRenderer.renderCalibrated reads to select a RenderDepth. A
   * too-complex rating steps complexity down (toward summary depth); too-simple
   * steps it up (toward deep); helpful/wrong-panel leave it unchanged.
   *
   * @param translationId - The ID of the translation being rated
   * @param feedback - The user's feedback
   * @returns The persisted CalibrationDelta produced by the CalibrationEngine
   */
  async processFeedback(
    translationId: string,
    feedback: UserFeedback,
  ): Promise<CalibrationDelta> {
    const domainFeedback: CalibrationFeedback = {
      domain: COMPLEXITY_DOMAIN,
      translationId,
      observedResult: this.ratingToObserved(feedback.rating),
      expectedResult: 'helpful',
      parameters: { complexity: 0 },
    };

    return this.calibrationEngine.process(domainFeedback);
  }

  /**
   * Read the accumulated pedagogical CalibrationProfile.
   *
   * Synthesizes every CalibrationDelta recorded through processFeedback into a
   * profile ready to attach to a concept's `calibration` field, which
   * translate() then feeds to renderCalibrated.
   *
   * @param domain - Calibration domain to read (defaults to the complexity domain)
   * @returns The synthesized CalibrationProfile
   */
  async getCalibrationProfile(
    domain: string = COMPLEXITY_DOMAIN,
  ): Promise<CalibrationProfile> {
    return this.calibrationEngine.getProfile('local', domain);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Map a translation rating to an observed-result phrase the CalibrationEngine's
   * comparison stage classifies into an over/under/miss direction.
   */
  private ratingToObserved(rating: UserFeedback['rating']): string {
    switch (rating) {
      case 'too-complex':
        return 'too much complexity';
      case 'too-simple':
        return 'too little complexity';
      default:
        return rating;
    }
  }

  /**
   * Extract the calibration profile from a concept, if present.
   */
  private getUserCalibration(concept: RosettaConcept) {
    return concept.calibration;
  }
}
