/**
 * DACP byte-identical preservation test (Phase 767, CAPCOM Gate G11).
 *
 * This is the **critical hard-preservation test**. It enumerates every
 * file under `src/dacp/`, hashes each with SHA-256 to capture a baseline,
 * exercises the activation-steering surface in passthrough mode (flag
 * off), and re-hashes. The two hash maps MUST be identical.
 *
 * Additionally, a simulated DACP three-part-bundle round-trip is exercised
 * with the flag off vs on. The flag-off path must produce a result whose
 * `vector` field is byte-equal to the input — confirming the passthrough
 * invariant declared in `index.ts`.
 *
 * @module activation-steering/__tests__/dacp-byte-identical
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { steer } from '../index.js';
import { buildTarget } from '../craft-role-mapper.js';

// ---------------------------------------------------------------------------
// Helper: recursively enumerate every file under a directory (sorted).
// ---------------------------------------------------------------------------
function walkAllFiles(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    const entries = readdirSync(dir);
    entries.sort();
    for (const name of entries) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        stack.push(p);
      } else if (st.isFile()) {
        out.push(p);
      }
    }
  }
  out.sort();
  return out;
}

function hashFile(path: string): string {
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
}

function snapshotDir(dir: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of walkAllFiles(dir)) {
    m.set(f, hashFile(f));
  }
  return m;
}

const DACP_DIR = join(process.cwd(), 'src', 'dacp');

describe('DACP byte-identical preservation (CAPCOM Gate G11)', () => {
  let preSnapshot: Map<string, string>;

  beforeAll(() => {
    preSnapshot = snapshotDir(DACP_DIR);
    // Baseline must not be empty; the test would be vacuously true otherwise.
    expect(preSnapshot.size).toBeGreaterThan(0);
  });

  afterAll(() => {
    // Final post-snapshot verification — re-hash and compare.
    const post = snapshotDir(DACP_DIR);
    expect(post.size).toBe(preSnapshot.size);
    for (const [path, hash] of preSnapshot.entries()) {
      expect(post.get(path)).toBe(hash);
    }
  });

  it('enumerates a non-empty src/dacp/ tree at baseline', () => {
    expect(preSnapshot.size).toBeGreaterThan(10);
    // Sanity: known files must exist.
    const names = Array.from(preSnapshot.keys()).map((p) =>
      p.replace(DACP_DIR, ''),
    );
    expect(names.some((n) => n.endsWith('types.ts'))).toBe(true);
    expect(names.some((n) => n.endsWith('bundle.ts'))).toBe(true);
    expect(names.some((n) => n.endsWith('index.ts'))).toBe(true);
  });

  it('passthrough (flag off) is byte-equal to the input vector', () => {
    const input = [0.1, 0.2, -0.3, 0.4, -0.5, 0.6, 0.7, 0.8];
    const target = buildTarget('Architect', 'Sonnet', input.length);
    const result = steer(input, 'Architect', target, { forceEnabled: false });
    expect(result.disabled).toBe(true);
    expect(Array.from(result.vector)).toEqual(input);
    // Byte-level: serialise both and compare.
    const inJSON = JSON.stringify(input);
    const outJSON = JSON.stringify(Array.from(result.vector));
    expect(outJSON).toBe(inJSON);
    // Delta is zero-vector.
    expect(result.delta.every((d) => d === 0)).toBe(true);
    expect(result.deltaNorm).toBe(0);
  });

  it('simulates a DACP three-part-bundle round-trip with flag off vs on', () => {
    // The "bundle" is an opaque shape; the steering layer never touches its
    // (intent / data / code) structure — only the activation-vector channel
    // that runs alongside. This test exercises the full surface with both
    // flag states and confirms the flag-off path emits a passthrough.
    const bundle = {
      intent: 'design a reactor controller',
      data: { reactorId: 'R-1', tempK: 298 },
      code: ['function ctrl() { return 0; }'],
      activationVector: [0.5, -0.5, 0.25, -0.25, 0.0, 0.0, 0.1, -0.1],
    };
    const target = buildTarget('Forger', 'Haiku', bundle.activationVector.length);

    const off = steer(bundle.activationVector, 'Forger', target, {
      forceEnabled: false,
    });
    const on = steer(bundle.activationVector, 'Forger', target, {
      forceEnabled: true,
      gain: 0.5,
    });

    // Flag-off: bundle.activationVector survives byte-for-byte.
    expect(off.disabled).toBe(true);
    expect(JSON.stringify(Array.from(off.vector))).toBe(
      JSON.stringify(bundle.activationVector),
    );
    // Flag-on: a non-trivial delta is applied (target ≠ input).
    expect(on.disabled).toBe(false);
    expect(on.deltaNorm).toBeGreaterThan(0);
    // The three-part-bundle structure itself is never mutated by steering.
    expect(bundle.intent).toBe('design a reactor controller');
    expect(bundle.data.reactorId).toBe('R-1');
    expect(bundle.code.length).toBe(1);
  });

  it('hashes src/dacp/ before and after exercising the steering surface', () => {
    // Run the full surface with both flag states.
    const v = [0, 0, 0, 0];
    const t = buildTarget('Coordinator', 'Opus', v.length);
    steer(v, 'Coordinator', t, { forceEnabled: false });
    steer(v, 'Coordinator', t, { forceEnabled: true });

    const post = snapshotDir(DACP_DIR);
    expect(post.size).toBe(preSnapshot.size);
    for (const [path, hash] of preSnapshot.entries()) {
      expect(post.get(path)).toBe(hash);
    }
  });

  it('SteeringResult JSON round-trip preserves shape', () => {
    const v = [1, 2, 3, 4];
    const t = buildTarget('Tactician', 'Opus', v.length);
    const r = steer(v, 'Tactician', t, { forceEnabled: false });
    const json = JSON.stringify(r);
    const parsed = JSON.parse(json);
    expect(parsed.disabled).toBe(true);
    expect(parsed.vector).toEqual([1, 2, 3, 4]);
    expect(parsed.delta).toEqual([0, 0, 0, 0]);
    expect(parsed.deltaNorm).toBe(0);
    expect(parsed.gain).toBe(0);
    expect(parsed.targetLabel).toBe('tactician@opus');
  });
});
