/**
 * SCRIBE Round-Trip Viewer — persistence-config.js
 *
 * Configuration for the non-blocking persistence POST emitted after each
 * successful round-trip operation.
 *
 * Default: disabled (file:// safe — no network calls, no errors).
 * Operators turn `enabled: true` when serving the viewer via the
 * dashboard-service (which proxies POST /api/roundtrip/event to PG).
 *
 * Runtime override (set BEFORE viewer.js loads):
 *   window.SCRIBE_PERSISTENCE_OVERRIDE = { enabled: true };
 * OR ship a per-deployment static copy of this file with `enabled: true`.
 *
 * Component 05 (Wave 2 — v1.49.621). CAP-019 / CAP-042.
 */

'use strict';

// Allow runtime override injected before this module loads.
// Pattern: operator sets `window.SCRIBE_PERSISTENCE_OVERRIDE = { enabled: true }`
// in the embedding HTML before <script src="persistence-config.js"> fires.
const _override =
  typeof window !== 'undefined' &&
  window.SCRIBE_PERSISTENCE_OVERRIDE != null &&
  typeof window.SCRIBE_PERSISTENCE_OVERRIDE === 'object'
    ? window.SCRIBE_PERSISTENCE_OVERRIDE
    : {};

/**
 * @type {{ enabled: boolean; endpoint: string }}
 *
 * `enabled`  — when false, the viewer makes ZERO network requests. Safe for
 *              file:// and static hosting where no dashboard-service is running.
 * `endpoint` — the relative URL for the round-trip event POST. When the
 *              viewer is served via the dashboard-service on the same origin,
 *              this resolves to `http://localhost:8088/api/roundtrip/event`.
 */
const PERSISTENCE_CONFIG = Object.freeze({
  enabled: _override.enabled != null ? Boolean(_override.enabled) : false,
  endpoint:
    typeof _override.endpoint === 'string'
      ? _override.endpoint
      : '/api/roundtrip/event',
});
