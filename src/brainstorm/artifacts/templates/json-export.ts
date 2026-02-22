/**
 * JSON export renderer.
 *
 * Pure function that serializes a complete SessionState as formatted JSON.
 * Validates with SessionStateSchema.parse() before serializing to catch
 * any runtime corruption.
 *
 * Returns JSON.stringify(session, null, 2) -- complete SessionState as
 * parseable JSON. The SessionState Zod schema handles all field serialization.
 *
 * No side effects, no filesystem writes. The Scribe agent calls this
 * and handles writing.
 *
 * Only imports from ../../shared/types.js. No imports from den/, vtm/, knowledge/.
 */

import { SessionStateSchema } from '../../shared/types.js';
import type { SessionState } from '../../shared/types.js';

// ============================================================================
// JSON export renderer
// ============================================================================

/**
 * Render a complete session state as formatted JSON.
 *
 * Pure function: takes SessionState, returns a JSON string.
 *
 * Validates the session state with SessionStateSchema.parse() before
 * serializing. This catches any runtime corruption in the session data
 * (e.g., missing required fields, invalid types) and throws a ZodError
 * with detailed error information.
 *
 * The full SessionState is exported -- ideas, questions, clusters,
 * evaluations, action items, metadata, timer state, and all
 * configuration fields.
 */
export function renderJsonExport(session: SessionState): string {
  // Validate session state against Zod schema before serializing.
  // This catches any runtime corruption in the session data.
  const validated = SessionStateSchema.parse(session);

  return JSON.stringify(validated, null, 2);
}
