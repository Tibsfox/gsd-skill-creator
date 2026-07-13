/**
 * College Observation Adapter -- the src-side boundary that binds the
 * `.college/` CollegeObservationConnector to the real SessionObservation
 * pattern pipeline.
 *
 * The connector lives outside the `src/` rootDir, so it cannot be statically
 * imported; it is pulled in at runtime through a computed dynamic `import()`
 * (mirroring the resolution in `src/cli/commands/college.ts`). This adapter
 * constructs the connector with a sink that forwards each drained
 * CollegeObservationEvent batch -- already collapsed into a SessionObservation
 * via `ObservationBridge.toSessionObservation()` -- into the `PatternStore`
 * that `SessionObserver` writes its own session observations to.
 *
 * Config-gated: forwarding is off unless `enabled` is set, so College usage
 * only becomes pattern signal when the operator opts in. When disabled the
 * connector's `pump()` is a no-op that leaves the bridge buffer intact.
 *
 * The `.college/` surface is described by local `*Like` interfaces rather than
 * imported types, keeping this file free of any cross-rootDir static import.
 *
 * @module observation/college-observation-adapter
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// ─── Structural handles on the .college/ connector surface ──────────────────
// Declared locally because the concrete types live outside src/ rootDir.

/** The ObservationBridge surface the connector drains. */
export interface CollegeBridgeLike {
  flush(): unknown[];
  toSessionObservation(events: unknown[]): Record<string, unknown>;
}

/** The CollegeObservationConnector surface this adapter drives. */
export interface CollegeConnectorLike {
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  pump(): Promise<number>;
}

/** Sink the connector invokes with each converted SessionObservation. */
type CollegeConnectorSink = (
  observation: Record<string, unknown>,
) => void | Promise<void>;

/** Constructor shape of the `.college/` CollegeObservationConnector class. */
export type CollegeConnectorCtor = new (
  bridge: CollegeBridgeLike,
  sink: CollegeConnectorSink,
  config: { enabled?: boolean },
) => CollegeConnectorLike;

/**
 * The pattern-pipeline sink the drained observations land in. `PatternStore`
 * satisfies this shape (`append('sessions', observation)`), which is the same
 * collection `SessionObserver` promotes its own observations into.
 */
export interface CollegePatternSinkLike {
  append(category: string, data: Record<string, unknown>): void | Promise<void>;
}

/** Configuration for the adapter. */
export interface CollegeObservationAdapterConfig {
  /** When true, `pump()` forwards buffered College events. Default false. */
  enabled?: boolean;
  /** Pattern category the observation is appended to. Default `'sessions'`. */
  collection?: string;
}

/** Injection seam so the connector import can be faked in tests. */
export interface CollegeObservationAdapterDeps {
  /** Resolve the `.college/` connector constructor (defaults to dynamic import). */
  loadConnectorCtor?: () => Promise<CollegeConnectorCtor>;
}

// ─── .college/ runtime resolution (mirrors src/cli/commands/college.ts) ─────

function collegeRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  return envRoot && envRoot.length > 0 ? envRoot : process.cwd();
}

function moduleUrl(...relSegments: string[]): string {
  const base = join(collegeRoot(), ...relSegments);
  const tsPath = `${base}.ts`;
  const jsPath = `${base}.js`;
  return pathToFileURL(existsSync(tsPath) ? tsPath : jsPath).href;
}

async function loadConnectorCtorDynamic(): Promise<CollegeConnectorCtor> {
  const mod = (await import(
    moduleUrl('.college', 'integration', 'college-observation-connector')
  )) as { CollegeObservationConnector: CollegeConnectorCtor };
  return mod.CollegeObservationConnector;
}

/**
 * Bind a College ObservationBridge to the SessionObservation pattern pipeline.
 *
 * Constructs the `.college/` CollegeObservationConnector with a sink that
 * appends each converted observation into `sink` under `collection`
 * (default `'sessions'`). Returns the connector so the caller can `pump()` it
 * at a session boundary and toggle it via `setEnabled()`. Forwarding is gated
 * off by default; the connector's own `pump()` no-ops (and preserves the
 * bridge buffer) until enabled.
 */
export async function wireCollegeObservations(
  bridge: CollegeBridgeLike,
  sink: CollegePatternSinkLike,
  config: CollegeObservationAdapterConfig = {},
  deps: CollegeObservationAdapterDeps = {},
): Promise<CollegeConnectorLike> {
  const collection = config.collection ?? 'sessions';
  const load = deps.loadConnectorCtor ?? loadConnectorCtorDynamic;
  const Connector = await load();
  return new Connector(
    bridge,
    async (observation) => {
      await sink.append(collection, observation);
    },
    { enabled: config.enabled ?? false },
  );
}
