/**
 * Coprocessor activation hook.
 *
 * Reads a skill's frontmatter `coprocessor:` block and pre-warms the declared
 * chips on the shared coprocessor client. Called by skill-creator's skill
 * activation pipeline.
 *
 * @module coprocessor/activation
 */

import { CoprocessorClient } from './client.js';
import type { ChipName, CoprocessorActivationSpec } from './types.js';

let sharedClient: CoprocessorClient | null = null;

/**
 * Lazily initialise and return the shared coprocessor client.
 *
 * Honors the `COPROCESSOR_PYTHON` env var so the default-on activation path
 * can target a non-`python3` interpreter (e.g. a venv with `mcp`/`numpy`/
 * `scipy`) on machines where the bare `python3` lacks the server deps.
 */
export async function getSharedClient(): Promise<CoprocessorClient> {
  if (sharedClient) return sharedClient;
  const pythonPath = process.env.COPROCESSOR_PYTHON;
  sharedClient = new CoprocessorClient(pythonPath ? { pythonPath } : {});
  await sharedClient.connect();
  return sharedClient;
}

/** Shut down the shared client. Call on process exit for a clean teardown. */
export async function shutdownSharedClient(): Promise<void> {
  if (sharedClient) {
    await sharedClient.disconnect();
    sharedClient = null;
  }
}

/**
 * Activate a skill's coprocessor requirements.
 *
 * Pre-queries capabilities so the first real tool call doesn't pay the
 * discovery cost. Does not pre-allocate VRAM at the TS layer — that happens
 * inside the Python chip's first call. Returns the set of chips that were
 * successfully reachable.
 */
export async function activateCoprocessor(
  spec: CoprocessorActivationSpec | undefined,
): Promise<{ available: ChipName[]; missing: ChipName[] }> {
  if (!spec || !spec.required || spec.required.length === 0) {
    return { available: [], missing: [] };
  }

  const client = await getSharedClient();
  const caps = await client.capabilities();

  const available: ChipName[] = [];
  const missing: ChipName[] = [];
  for (const chip of spec.required) {
    const info = caps.value.chips[chip];
    if (info && info.enabled) {
      available.push(chip);
    } else {
      missing.push(chip);
    }
  }
  return { available, missing };
}

/**
 * Parse a skill frontmatter block for its coprocessor spec.
 *
 * Accepts either the explicit object form or a short-hand array of chip
 * names (treated as `required`).
 */
export function parseCoprocessorSpec(raw: unknown): CoprocessorActivationSpec | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return { required: raw.filter((x): x is ChipName => typeof x === 'string') as ChipName[] };
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const spec: CoprocessorActivationSpec = {};
    if (Array.isArray(obj.required)) {
      spec.required = obj.required.filter((x: unknown) => typeof x === 'string') as ChipName[];
    }
    if (obj.precision === 'fp32' || obj.precision === 'fp64') {
      spec.precision = obj.precision;
    }
    if (typeof obj.cpu_fallback === 'boolean') {
      spec.cpu_fallback = obj.cpu_fallback;
    }
    return spec;
  }
  return undefined;
}
