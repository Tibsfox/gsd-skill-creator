/**
 * Type definitions for the clarity routing system.
 *
 * Defines the three intake paths (clear, gaps, confused), the
 * assessment result structure, and gap detail for targeted
 * clarifying questions.
 *
 * @module staging/intake-flow/types
 */

/** Clarity routing paths for document intake. */
export type ClarityRoute = 'clear' | 'gaps' | 'confused';

/** All clarity routes as a const array for runtime use. */
export const CLARITY_ROUTES = ['clear', 'gaps', 'confused'] as const;

/**
 * A targeted clarifying question about a specific gap in a document.
 *
 * - area: what information is missing (e.g., "success criteria")
 * - question: what to ask the user to fill the gap
 */
export interface GapDetail {
  /** What information is missing. */
  area: string;
  /** Targeted question to ask the user. */
  question: string;
}

/**
 * Result of assessing a document's clarity for routing.
 *
 * Every assessment includes a route, reason, confidence score,
 * detected sections, and any identified gaps. Gaps are only
 * populated for the 'gaps' route.
 */
export interface ClarityAssessment {
  /** Which intake path the document was routed to. */
  route: ClarityRoute;
  /** Human-readable explanation of why this route was chosen. */
  reason: string;
  /** Confidence in the assessment (0.0-1.0). */
  confidence: number;
  /** Identified gaps -- empty for 'clear' and 'confused' routes. */
  gaps: GapDetail[];
  /** Detected section headings in the document. */
  sections: string[];
}
