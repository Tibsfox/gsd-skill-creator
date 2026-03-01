/**
 * Panel Router -- selects the appropriate panel for a given context.
 *
 * Uses a 6-step routing logic that considers explicit format requests,
 * user expertise, task type, exploration novelty, and Complex Plane
 * position to select the best panel for expressing a concept.
 *
 * @module rosetta-core/panel-router
 */

import type { PanelId, ComplexPosition } from './types.js';
import { PanelInterface } from '../panels/panel-interface.js';
import type { PanelCapabilities } from '../panels/panel-interface.js';

// ─── Exported Types ───────────────────────────────────────────────────────────

/**
 * User expertise level, used for routing decisions.
 */
export type ExpertiseLevel = 'novice' | 'intermediate' | 'advanced' | 'expert';

/**
 * Context provided to the Panel Router for panel selection.
 *
 * Describes the user's expertise, preferences, and the current task
 * so the router can select the most pedagogically appropriate panel.
 */
export interface TranslationContext {
  /** User's current expertise level */
  userExpertise: ExpertiseLevel;

  /** Explicit panel request -- overrides all other routing signals */
  requestedFormat?: PanelId;

  /** Current domain context (e.g., 'mathematics', 'cooking') */
  currentDomain: string;

  /** Recently used panels -- exploration avoids these */
  recentPanels: PanelId[];

  /** Optional learning objective description */
  learningObjective?: string;

  /** Type of task being performed */
  taskType: 'explain' | 'implement' | 'compare' | 'debug' | 'explore';

  /** Complex Plane position of the concept (supplied by caller from registry) */
  conceptComplexPosition?: ComplexPosition;
}

/**
 * Result of panel selection, including the chosen panel(s) and rationale.
 */
export interface PanelSelection {
  /** Primary panel selected for the concept */
  primary: PanelId;

  /** Optional secondary panels for comparison or additional perspectives */
  secondary?: PanelId[];

  /** Human-readable explanation of why these panels were selected */
  rationale: string;
}

// ─── Internal Constants ───────────────────────────────────────────────────────

/** Panels oriented toward implementation and systems programming */
const SYSTEMS_PANELS: PanelId[] = ['python', 'cpp', 'java'];

/** Panels oriented toward pedagogical and historical perspectives */
const HERITAGE_PANELS: PanelId[] = ['lisp', 'pascal', 'fortran', 'algol', 'unison'];

/** Expertise-to-panel preference mapping for explanation tasks */
const EXPLAIN_PREFERENCES: Record<ExpertiseLevel, PanelId[]> = {
  novice: ['natural', 'python'],
  intermediate: ['python', 'lisp'],
  advanced: ['lisp', 'pascal'],
  expert: ['cpp', 'fortran', 'algol'],
};

// ─── Panel Router ─────────────────────────────────────────────────────────────

/**
 * Selects the most appropriate panel for expressing a concept.
 *
 * Applies a 6-step routing logic in priority order:
 * 1. Explicit format request (always wins)
 * 2. Implementation task -- prefer systems panels
 * 3. Explanation task -- match expertise level
 * 4. Comparison task -- select diverse panels
 * 5. Exploration task -- avoid recently used panels
 * 6. Complex Plane bias -- angle influences panel category preference
 *
 * Falls back to 'natural' panel when no preferred panel is available.
 */
export class PanelRouter {
  /** Registered panel instances for capability queries */
  private panels: Map<PanelId, PanelInterface> = new Map();

  /**
   * Register a panel instance for routing queries.
   *
   * @param panel - The panel to register
   * @throws Error if a panel with the same ID is already registered
   */
  registerPanel(panel: PanelInterface): void {
    if (this.panels.has(panel.panelId)) {
      throw new Error(`Panel '${panel.panelId}' is already registered in the router`);
    }
    this.panels.set(panel.panelId, panel);
  }

  /**
   * Get the capabilities of a registered panel.
   *
   * @param panelId - The panel ID to query
   * @returns PanelCapabilities, or undefined if the panel is not registered
   */
  getPanelCapabilities(panelId: PanelId): PanelCapabilities | undefined {
    const panel = this.panels.get(panelId);
    return panel ? panel.getCapabilities() : undefined;
  }

  /**
   * Get all registered panel IDs.
   *
   * @returns Array of registered PanelIds
   */
  getRegisteredPanelIds(): PanelId[] {
    return Array.from(this.panels.keys());
  }

  /**
   * Select the best panel(s) for a concept given the translation context.
   *
   * Applies 6-step routing logic in priority order. The availablePanelIds
   * parameter lists which panels have expressions for the concept (supplied
   * by the caller from ConceptRegistry.getAvailablePanels()).
   *
   * @param context - The translation context describing user, task, and concept
   * @param availablePanelIds - Panel IDs that have expressions for the concept
   * @returns PanelSelection with primary panel, optional secondary panels, and rationale
   */
  selectPanels(
    context: TranslationContext,
    availablePanelIds: PanelId[],
  ): PanelSelection {
    // Rule 1: Explicit format request always wins
    if (context.requestedFormat) {
      return {
        primary: context.requestedFormat,
        rationale: `Explicit format requested: ${context.requestedFormat}`,
      };
    }

    // Apply Complex Plane bias to reorder candidates if position is available
    let biasedAvailable = [...availablePanelIds];
    let complexBiasApplied = false;
    if (context.conceptComplexPosition) {
      const biased = this.applyComplexPlaneBias(
        context.conceptComplexPosition.angle,
        biasedAvailable,
      );
      if (biased !== null) {
        biasedAvailable = biased;
        complexBiasApplied = true;
      }
    }

    // Rule 2: Implementation task -- prefer systems panels
    if (context.taskType === 'implement') {
      const candidates = complexBiasApplied
        ? this.biasPreferenceList(SYSTEMS_PANELS, biasedAvailable)
        : SYSTEMS_PANELS;
      const pick = this.pickFromPreference(candidates, biasedAvailable);
      if (pick) {
        return this.buildResult(
          pick,
          undefined,
          complexBiasApplied
            ? `Implementation task: selected ${pick} (systems panel, Complex Plane bias applied)`
            : `Implementation task: selected ${pick} as systems panel for implementation`,
        );
      }
    }

    // Rule 3: Explanation task -- match expertise level
    if (context.taskType === 'explain') {
      const basePreferences = EXPLAIN_PREFERENCES[context.userExpertise];
      const preferences = complexBiasApplied
        ? this.biasPreferenceList(basePreferences, biasedAvailable)
        : basePreferences;
      const pick = this.pickFromPreference(preferences, biasedAvailable);
      if (pick) {
        return this.buildResult(
          pick,
          undefined,
          complexBiasApplied
            ? `Explanation for ${context.userExpertise}: selected ${pick} (expertise match, Complex Plane bias applied)`
            : `Explanation for ${context.userExpertise} user: selected ${pick} for pedagogical fit`,
        );
      }
    }

    // Rule 4: Comparison task -- select diverse panels (systems + heritage)
    if (context.taskType === 'compare') {
      const systemsPick = this.pickFromPreference(SYSTEMS_PANELS, biasedAvailable);
      const heritagePick = this.pickFromPreference(HERITAGE_PANELS, biasedAvailable);
      const primary = systemsPick || heritagePick || biasedAvailable[0] || 'natural';
      const secondary: PanelId[] = [];

      if (systemsPick && heritagePick && systemsPick !== heritagePick) {
        if (primary === systemsPick) {
          secondary.push(heritagePick);
        } else {
          secondary.push(systemsPick);
        }
      }

      // Add a third panel if available and different from primary and secondary
      for (const pid of biasedAvailable) {
        if (pid !== primary && !secondary.includes(pid) && secondary.length < 2) {
          secondary.push(pid);
        }
      }

      return this.buildResult(
        primary,
        secondary.length > 0 ? secondary : undefined,
        `Comparison task: selected ${primary} as primary with ${secondary.length > 0 ? secondary.join(', ') : 'no'} secondary panels for diverse perspectives`,
      );
    }

    // Rule 5: Exploration task -- avoid recent panels
    if (context.taskType === 'explore') {
      const unseenPanels = biasedAvailable.filter(
        (pid) => !context.recentPanels.includes(pid),
      );
      if (unseenPanels.length > 0) {
        const pick = unseenPanels[0];
        return this.buildResult(
          pick,
          undefined,
          `Exploration: selected ${pick} (not in recent panels: ${context.recentPanels.join(', ')})`,
        );
      }
    }

    // Rule 6 / Debug task / General fallback
    // Complex Plane bias already applied to biasedAvailable above
    if (context.taskType === 'debug') {
      const pick = this.pickFromPreference(SYSTEMS_PANELS, biasedAvailable);
      if (pick) {
        return this.buildResult(
          pick,
          undefined,
          `Debug task: selected ${pick} as systems panel for debugging`,
        );
      }
    }

    // Final fallback: use first available or 'natural'
    const fallbackPick = biasedAvailable[0] || 'natural';
    return this.buildResult(
      fallbackPick,
      undefined,
      complexBiasApplied
        ? `Fallback with Complex Plane bias: selected ${fallbackPick}`
        : `Fallback: selected ${fallbackPick} as best available panel`,
    );
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Pick the first panel from candidates that is available for the concept.
   */
  private pickFromPreference(
    candidates: PanelId[],
    available: PanelId[],
  ): PanelId | undefined {
    for (const candidate of candidates) {
      if (available.includes(candidate)) {
        return candidate;
      }
    }
    return undefined;
  }

  /**
   * Apply Complex Plane angle bias to reorder panel candidates.
   *
   * Angle near 0 (concrete, [0, pi/4] or [7pi/4, 2pi]) -> prefer systems panels.
   * Angle near pi/2 (abstract, [pi/4, 3pi/4]) -> prefer heritage panels.
   * Otherwise -> neutral (no reordering).
   *
   * @returns Reordered array, or null if no bias applies
   */
  private applyComplexPlaneBias(
    angle: number,
    candidates: PanelId[],
  ): PanelId[] | null {
    const PI_QUARTER = Math.PI / 4;
    const THREE_PI_QUARTER = (3 * Math.PI) / 4;
    const SEVEN_PI_QUARTER = (7 * Math.PI) / 4;

    // Concrete bias: angle in [0, pi/4] or [7pi/4, 2pi]
    if (angle >= 0 && angle <= PI_QUARTER) {
      return this.reorderWithPreference(candidates, SYSTEMS_PANELS);
    }
    if (angle >= SEVEN_PI_QUARTER && angle <= 2 * Math.PI) {
      return this.reorderWithPreference(candidates, SYSTEMS_PANELS);
    }

    // Abstract bias: angle in [pi/4, 3pi/4]
    if (angle > PI_QUARTER && angle <= THREE_PI_QUARTER) {
      return this.reorderWithPreference(candidates, HERITAGE_PANELS);
    }

    // Neutral zone
    return null;
  }

  /**
   * Reorder candidates so preferred panels come first, followed by the rest.
   */
  private reorderWithPreference(
    candidates: PanelId[],
    preferred: PanelId[],
  ): PanelId[] {
    const inPreferred: PanelId[] = [];
    const notInPreferred: PanelId[] = [];

    for (const pid of candidates) {
      if (preferred.includes(pid)) {
        inPreferred.push(pid);
      } else {
        notInPreferred.push(pid);
      }
    }

    return [...inPreferred, ...notInPreferred];
  }

  /**
   * Reorder a preference list to respect the biased available order.
   *
   * Items that appear earlier in biasedAvailable are promoted to the
   * front of the preference list, ensuring Complex Plane bias influences
   * which candidate from the preference list is picked first.
   */
  private biasPreferenceList(
    preferences: PanelId[],
    biasedAvailable: PanelId[],
  ): PanelId[] {
    // Sort the preference list by position in biasedAvailable
    // Panels earlier in biasedAvailable come first
    return [...preferences].sort((a, b) => {
      const aIdx = biasedAvailable.indexOf(a);
      const bIdx = biasedAvailable.indexOf(b);
      // If not in biasedAvailable, push to end
      const aPos = aIdx === -1 ? Infinity : aIdx;
      const bPos = bIdx === -1 ? Infinity : bIdx;
      return aPos - bPos;
    });
  }

  /**
   * Build a PanelSelection result.
   */
  private buildResult(
    primary: PanelId,
    secondary: PanelId[] | undefined,
    rationale: string,
  ): PanelSelection {
    return { primary, secondary, rationale };
  }
}
