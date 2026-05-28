/**
 * EgressContext chokepoint audit.
 *
 * Greps every `src/**\/*.ts` file (excluding tests + fixtures) and rejects
 * any file that:
 *
 *   - contains a `fetch(` call site, AND
 *   - does NOT call `ensureEgressAllowed(` at least once, AND
 *   - does NOT carry an explicit `Role: NOT an egress caller` header doc, AND
 *   - is NOT in the `KNOWN_NOT_EGRESS` allowlist (dashboard files that emit
 *     browser-side JS strings; the `fetch(` runs in the browser, not Node), AND
 *   - is NOT in the `KNOWN_UNWIRED` allowlist (existing server-side fetch
 *     callers grandfathered at v1.49.806 — operators chip this list down
 *     ship-by-ship by wiring each module with `ctx?: EgressContext`).
 *
 * Excludes `egress-context.ts` (the interface itself).
 *
 * This test is the runtime enforcement layer for the Tier-E security
 * chokepoint shipped in v1.49.806. Adding a new fetch() caller without
 * threading `EgressContext` AND not in the allowlists will fail this test
 * at CI / pre-tag-gate.
 *
 * Operators wiring a `KNOWN_UNWIRED` entry: thread `ctx?: EgressContext`
 * through the call site, call `ensureEgressAllowed(ctx, source, op, url)`
 * BEFORE the fetch, and remove the file from `KNOWN_UNWIRED` below.
 *
 * @module security/egress-context-audit.test
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');
const SRC = resolve(__dirname, '..', '..', 'src');

/**
 * Server-side fetch callers not yet wired through the EgressContext chokepoint.
 * Grandfathered at v1.49.806. Chip this list down ship-by-ship.
 */
const KNOWN_UNWIRED: ReadonlySet<string> = new Set([
  // src/alternative-discoverer/equivalent-searcher.ts wired v1.49.864 —
  // second Egress chip. ctx?: EgressContext threaded through
  // searchEquivalents + EquivalentSearcher.search; ensureEgressAllowed
  // hoisted OUTSIDE the fault-tolerant try/catch per #10427. Forensic
  // accessory semantics preserved (not-OK / parse / network errors continue
  // to return [] silently); EgressContextDenied propagates.
  'src/alternative-discoverer/fork-finder.ts',
  'src/aminet/index-fetcher.ts',
  // src/aminet/index-freshness.ts wired v1.49.865 — third Egress chip.
  // ctx?: EgressContext threaded through fetchRecent; ensureEgressAllowed
  // hoisted BEFORE the fetch call. Strict-fail surface (HTTP-error throws)
  // unchanged; EgressContextDenied propagates per #10427.
  'src/aminet/package-fetcher.ts',
  'src/chips/anthropic-chip.ts',
  'src/chips/http-client.ts',
  // 5 registry adapters wired through EgressContext: npm.ts at v1.49.809;
  // cargo.ts + conda.ts + pypi.ts + rubygems.ts batch at v1.49.811.
  'src/intelligence/ipc.ts',
  'src/mcp/skill-installer.ts',
  'src/site/deploy.ts',
  // src/terminal/health.ts wired v1.49.863 — first chip of Track 3 (Egress).
  // Optional ctx?: EgressContext threaded through checkHealth as a third
  // positional parameter (after url + timeoutMs); ensureEgressAllowed hoisted
  // OUTSIDE the fault-tolerant try/catch per #10427. Forensic accessory
  // semantics preserved (connection-refused / timeout / status-error continue
  // to return the structured HealthCheckResult silently); EgressContextDenied
  // propagates to the caller.
]);

/**
 * Files where `fetch(` appears inside string-template-emitted browser JS,
 * not as a Node-side egress call. The chokepoint does not apply (browser
 * runs in its own sandbox); the audit exempts these so the literal `fetch(`
 * substring does not trip the regex.
 */
const KNOWN_NOT_EGRESS: ReadonlySet<string> = new Set([
  'src/dashboard/console-settings.ts',
  'src/dashboard/metrics/tier-refresh.ts',
  'src/dashboard/question-poller.ts',
  'src/dashboard/submit-flow.ts',
  'src/dashboard/terminal-panel.ts',
]);

/** Walk `src/` and return absolute paths matching `*.ts`. */
function findTsFiles(): string[] {
  const out: string[] = [];
  const stack = [SRC];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    const entries = readdirSync(dir);
    for (const name of entries) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name === '__tests__' || name === '__fixtures__' || name === 'node_modules') {
          continue;
        }
        stack.push(full);
        continue;
      }
      if (!st.isFile()) continue;
      if (!name.endsWith('.ts')) continue;
      if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue;
      if (name.endsWith('.d.ts')) continue;
      // Skip the chokepoint definition itself.
      if (full === join(SRC, 'security', 'egress-context.ts')) continue;
      out.push(full);
    }
  }
  return out.sort();
}

/** Inspection results for one file. */
interface Inspection {
  path: string;
  hasFetchCall: boolean;
  callsEnsureEgressAllowed: boolean;
  hasRoleBoundary: boolean;
}

// No `\s*` between `fetch` and `(` — real call sites are `fetch(...)` with
// no space; the only `fetch (` matches in src/ are inside comments and
// docstrings. Keeping the regex tight avoids comment-stripping logic.
const FETCH_CALL_REGEX = /\bfetch\(/;
const ENSURE_EGRESS_ALLOWED_REGEX = /\bensureEgressAllowed\s*\(/;
const ROLE_BOUNDARY_REGEX = /Role:\s*NOT\s+an\s+egress\s+caller/i;

function inspect(absPath: string): Inspection {
  const content = readFileSync(absPath, 'utf8');
  return {
    path: relative(ROOT, absPath),
    hasFetchCall: FETCH_CALL_REGEX.test(content),
    callsEnsureEgressAllowed: ENSURE_EGRESS_ALLOWED_REGEX.test(content),
    hasRoleBoundary: ROLE_BOUNDARY_REGEX.test(content),
  };
}

describe('EgressContext chokepoint audit', () => {
  const files = findTsFiles();

  it('discovers a non-empty set of src files (sanity check)', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files.map((f) => [relative(ROOT, f), f]))(
    'enforces chokepoint on %s',
    (label, absPath) => {
      const result = inspect(absPath);

      // Files without fetch() calls are out of scope.
      if (!result.hasFetchCall) {
        return;
      }

      // Files in KNOWN_NOT_EGRESS are exempt (string-template-emitted browser JS).
      if (KNOWN_NOT_EGRESS.has(label)) {
        return;
      }

      // Files in KNOWN_UNWIRED are grandfathered at v1.49.806 — track-don't-fail.
      if (KNOWN_UNWIRED.has(label)) {
        return;
      }

      // Files with fetch() calls MUST either route through ensureEgressAllowed
      // or declare themselves explicitly outside the chokepoint.
      const ok = result.callsEnsureEgressAllowed || result.hasRoleBoundary;

      if (!ok) {
        throw new Error(
          `${result.path}: calls fetch() but does not call ensureEgressAllowed() ` +
            `and has no "Role: NOT an egress caller" header doc, and is not in ` +
            `the KNOWN_UNWIRED or KNOWN_NOT_EGRESS allowlists in ` +
            `src/security/egress-context-audit.test.ts. Either thread ` +
            `EgressContext through the caller, add a header doc explaining ` +
            `the exemption, or add the file to the appropriate allowlist with ` +
            `a comment explaining why.`,
        );
      }
    },
  );

  it('rejects files that simultaneously claim to be a caller and a non-caller', () => {
    for (const f of files) {
      const r = inspect(f);
      if (r.callsEnsureEgressAllowed && r.hasRoleBoundary) {
        throw new Error(
          `${r.path}: contradicts itself — calls ensureEgressAllowed() but also ` +
            `claims "Role: NOT an egress caller". Remove one of the two.`,
        );
      }
    }
  });

  it('KNOWN_UNWIRED entries actually exist and contain fetch() calls', () => {
    for (const path of KNOWN_UNWIRED) {
      const abs = join(ROOT, path);
      const exists = (() => {
        try {
          return statSync(abs).isFile();
        } catch {
          return false;
        }
      })();
      if (!exists) {
        throw new Error(
          `KNOWN_UNWIRED entry ${path} does not exist. Remove it from the ` +
            `allowlist (the file was renamed, moved, or deleted).`,
        );
      }
      const content = readFileSync(abs, 'utf8');
      if (!FETCH_CALL_REGEX.test(content)) {
        throw new Error(
          `KNOWN_UNWIRED entry ${path} no longer contains a fetch() call. ` +
            `Remove it from the allowlist.`,
        );
      }
    }
  });

  it('KNOWN_NOT_EGRESS entries actually exist and contain fetch() substring', () => {
    for (const path of KNOWN_NOT_EGRESS) {
      const abs = join(ROOT, path);
      const exists = (() => {
        try {
          return statSync(abs).isFile();
        } catch {
          return false;
        }
      })();
      if (!exists) {
        throw new Error(
          `KNOWN_NOT_EGRESS entry ${path} does not exist. Remove it from the ` +
            `allowlist.`,
        );
      }
    }
  });

  // v1.49.838 — inverse-check (stale-entry detector). Mirrors the
  // process-context-audit.test.ts inverse-check; closes the unidirectional
  // asymmetry that v834 surfaced manually for the ProcessContext family.
  // For EgressContext, the equivalent off-by-one would be a file that calls
  // ensureEgressAllowed but still carries a stale KNOWN_UNWIRED entry. This
  // gate fires deterministically on the next ship after the drift is
  // introduced.
  it('KNOWN_UNWIRED entries do NOT call ensureEgressAllowed (stale-entry detector)', () => {
    const stale: string[] = [];
    for (const path of KNOWN_UNWIRED) {
      const abs = join(ROOT, path);
      const content = readFileSync(abs, 'utf8');
      if (ENSURE_EGRESS_ALLOWED_REGEX.test(content)) {
        stale.push(path);
      }
    }
    if (stale.length > 0) {
      throw new Error(
        `${stale.length} KNOWN_UNWIRED entr${stale.length === 1 ? 'y calls' : 'ies call'} ` +
          `ensureEgressAllowed() — the file${stale.length === 1 ? '' : 's'} ${stale.length === 1 ? 'is' : 'are'} ` +
          `wired but the allowlist ${stale.length === 1 ? 'entry is' : 'entries are'} stale. Remove from ` +
          `KNOWN_UNWIRED:\n  ${stale.join('\n  ')}`,
      );
    }
  });
});
