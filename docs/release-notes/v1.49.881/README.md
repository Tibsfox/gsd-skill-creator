> Following v1.49.880 — _EgressContext singleton chip: src/mcp/skill-installer.ts (Track 5 chip #5)_, v1.49.881 is the **fourteenth ship of the v868-v882 follow-on campaign** and **Track 5 chip #6 (Track 5 CLOSE)** — the final Egress singleton chip. Wires `src/intelligence/ipc.ts` (516 LOC) via the **module-singleton variant of shared-helper hoist**: new `setIpcEgressContext()` setter writes a module-level singleton; `invoke()` reads it for the single fetch in the browser-tab path. Avoids threading ctx? through ~20 exported wrapper functions. **KNOWN_UNWIRED Egress: 1 → 0 — Egress chokepoint fully wired across src/.**

# v1.49.881 — EgressContext singleton chip: `src/intelligence/ipc.ts` (Track 5 CLOSE)

**Shipped:** 2026-05-28

Final chip of Track 5. **KNOWN_UNWIRED Egress: 1 → 0.** Track 5 closes; both ProcessContext and EgressContext chokepoints are now fully wired across `src/`.

## What shipped

- **MODIFIED** `src/intelligence/ipc.ts` (516 LOC):
  - Added imports for `ensureEgressAllowed`, `EgressContext`.
  - Added module-level singleton variable `ipcEgressContext: EgressContext | undefined`.
  - Added new exported setter function `setIpcEgressContext(ctx)` for app-initialization-time configuration.
  - Hoisted `ensureEgressAllowed(ipcEgressContext, 'intelligence/ipc', 'fetch', url)` BEFORE the single fetch in `invoke()`'s browser-tab path.
- **NEW** `src/intelligence/ipc.test.ts` (3 wire test cases) — verifies default permissive behavior, denial propagation, and audit threading.
- **MODIFIED** `src/security/egress-context-audit.test.ts`:
  - Removed `'src/intelligence/ipc.ts'` from `KNOWN_UNWIRED`.
  - Added v1.49.881 block comment documenting the module-singleton wire shape + Track 5 close.
  - **KNOWN_UNWIRED Egress: 1 → 0** ✓

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **99 consecutive ships at 1.178**; widest pressure margin record extended by 1).
Counter-cadence count UNCHANGED at 6. Manifest 23 / Lessons 85 / Wired thresholds 5 of 7 (UNCHANGED).
**KNOWN_UNWIRED Process: 0** (UNCHANGED; closed at v875). **KNOWN_UNWIRED Egress: 1 → 0** ✓ (closed at v881).
UNCODIFIED: 39 ≤ 41 (UNCHANGED).

## Wire shape: module-singleton (NEW variant — first instance)

This is a NEW shared-helper hoist variant: instead of threading ctx? through every function or storing on a class instance, the module declares a `let` variable and an exported setter. Callers configure the variable once at app startup; downstream consumers read it via closure.

**Why this variant for ipc.ts:** the file exports `intelligenceIpc` — a singleton object with ~20 wrapper functions, each delegating to internal `invoke()`. Threading ctx? through every wrapper would be high-churn (~20 signature changes + ~50+ call-site updates). The module-singleton stores ctx in one place and lets all consumers read it.

**Below threshold for promotion** (1 instance). Carry forward; a 2nd module-singleton wire would promote it as a 5th shared-helper variant in the #10444 catalog (joining class-private-method / closure-capture / module-internal-helper / class-instance).

## Track 5 retrospective (6-chip cluster)

| Chip | File | LOC | Wire Shape |
|---|---|---|---|
| v876 | aminet/package-fetcher | 177 | two-site hoisted-check |
| v877 | aminet/index-fetcher | 213 | hoist-at-top inside mirror loop |
| v878 | chips/anthropic-chip | 247 | class-instance two-site hoisted-check |
| v879 | chips/http-client | 350 | class-instance two-site hoisted-check (sibling of v878) |
| v880 | mcp/skill-installer | 401 | hoist-at-top with router-bypass |
| v881 | intelligence/ipc | 516 | **module-singleton (NEW variant)** |

6 chips, 5 distinct wire shapes (v878 + v879 shared the class-instance variant). The size-ascending discipline surfaced one new variant at the upper-LOC band (module-singleton at 516 LOC), confirming again that LOC + spawn-multiplicity + structural-shape determine the wire choice.

## Cross-track summary (v870-v881)

12 chips, 8 distinct wire shape variants across both Process and Egress chokepoints. Total KNOWN_UNWIRED reduction: Process 6→0, Egress 6→0. Both ratchet ledgers fully drained. Total #10427 re-throws applied: ~30 across both tracks.

## What this ship is not

- Not a NASA degree advance (still 1.178; now 99 consecutive ships).
- Not a new discipline domain (manifest 23 entries).
- Not a counter-cadence ship.

## Verification

- `npx vitest run src/intelligence/ipc.test.ts` → 3/3 PASS (new test file).
- `node tools/security/check-stale-known-unwired.mjs` → **Process 0 ✓ + Egress 0 ✓** (both chokepoints fully wired).
- `npm run build` → PASS.
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path post-v881

**Tracks 4+5 CLOSED.** One ship remaining in v868-v882 campaign:
- **v1.49.882** — Verify-overdue forecast scan tool. Lists CalibratableThreshold members + ship counts; flags those past 10-ship verify-axis trigger.

After v882, codify-eligible candidates accumulate for the post-campaign codify ship (~v883-885 window):
- Module-singleton variant (new shared-helper sub-pattern).
- Spawn-site count as primary predictor (refinement of #10444).
- #10427 multi-catch helper (~30 instances total).
- Router-with-conditional-bypass (refinement of #10444).
- Audit target accuracy: execFile vs shell-exec.
