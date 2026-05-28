> Following v1.49.849 — _ProcessContext singleton chip: `src/retro/changelog-watch.ts`_, v1.49.850 is the **third ship of the v848-v856 nine-ship campaign** and second of five ProcessContext singleton chip ships. This ship chips `src/orchestrator/extension/extension-detector.ts` — `detectExtension()` Strategy 1 CLI check (`skill-creator --version`) wired through the chokepoint with hoisted check per Lesson #10427. **KNOWN_UNWIRED Process count: 15 → 14.**

# v1.49.850 — ProcessContext singleton chip: `src/orchestrator/extension/extension-detector.ts`

**Shipped:** 2026-05-28

Third ship of the nine-ship v848-v856 campaign; second of five chip ships. The `extension-detector` module's `detectExtension()` runs a two-strategy probe — CLI binary check (Strategy 1: `execSync('skill-creator --version')`) then dist/-directory check (Strategy 2: `access(distPath)`). The CLI check is a forensic accessory (falls through to Strategy 2 on any spawn failure), but security denials are load-bearing per Lesson #10427 — the wire hoists `ensureProcessAllowed` INSIDE the no-override branch BEFORE the try/catch so `ProcessContextDenied` propagates while CLI-not-installed + timeout + parse failure continue to fall through silently.

## What shipped

- **MODIFIED** `src/orchestrator/extension/extension-detector.ts` — imports `ensureProcessAllowed` + `ProcessContext`; `detectExtension(overrides?, ctx?: ProcessContext)` accepts optional `ctx` as a second positional parameter; `ensureProcessAllowed(ctx, 'orchestrator/extension/extension-detector', 'exec', 'skill-creator', ['--version'])` hoisted inside the no-override branch BEFORE the try block per Lesson #10427.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/orchestrator/extension/extension-detector.ts'` from `KNOWN_UNWIRED`, replaced with inline comment documenting the v1.49.850 wire shape.
- **MODIFIED** `src/orchestrator/extension/extension-detector.test.ts` — new `describe('ProcessContext wire (v1.49.850)')` block with 2 test cases: (a) propagates `ProcessContextDenied` when CLI not in allowList AND no override, (b) does NOT invoke ensureProcessAllowed when an override skips Strategy 1.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/orchestrator/extension/extension-detector.test.ts` | +2 | New `ProcessContext wire` describe block (deny + override-skip) |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass; file no longer in `KNOWN_UNWIRED` allowlist |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **68 consecutive ships at 1.178**, new widest pressure margin record by 1 over v849's 67).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED).
Lessons in manifest (unique): **83** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
**KNOWN_UNWIRED Process: 15 → 14.**
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Wire shape variant (per Lesson #10427)

The wire differs from v849 (`changelog-watch`) in one detail: the `ensureProcessAllowed` call is hoisted INSIDE the no-override branch, not at the top of the function. This is because `detectExtension` has a DI-override path (`overrides?.cliAvailable !== undefined`) that early-returns without ever invoking `execSync`. Hoisting at the function top would emit unnecessary audit records on the override-skip path.

The placement is canonical: hoist as close to the spawn surface as possible WITHOUT being inside a swallow-everything try/catch.

## Surface delta

- 3 files modified
- +20 source LOC (8 LOC in `extension-detector.ts` — import + 1 param + 7-line hoisted call; 7 LOC + comment in audit-test KNOWN_UNWIRED swap; ~25 LOC test code)
- 0 new dependencies
- 0 manifest changes
