# v1.49.820 — Context

## Provenance

- **Source:** v815 handoff "Highest-ROI next ship candidates" list, item #8 (first git/core ProcessContext chip).
- **Trigger:** Operator selected the v816-822 chain at session-start; this ship is item #5.
- **Predecessor ship:** v1.49.819 (Batch Chip: aminet Family ProcessContext Wiring); shipped 2026-05-27 ~10:51 UTC.
- **Session boundary:** Chain-mode (same session-retro mission).

## The git/core family

4 sibling files all on the process KNOWN_UNWIRED allowlist:

| File | LOC | Spawn pattern | Wired this ship? |
|---|---|---|---|
| `branch-manager.ts` | 357 | Internal `execGit` helper × 10 callsites | **YES** |
| `repo-manager.ts` | 210 | TBD (future batch) | NO |
| `state-machine.ts` | 276 | TBD (future batch) | NO |
| `sync-manager.ts` | 196 | TBD (future batch) | NO |

Total: 1039 LOC across 4 files. v820 wires the largest one (branch-manager); future batch covers the remaining 3 + brings process KNOWN_UNWIRED from 31 → 28.

## Why first-chip not batch

Per the v815 handoff chain plan, item #8 was sized as "First git/core ProcessContext chip" — explicit single-file scope. v819 demonstrated batching works for sibling families; v820 holds to the chain plan's first-chip framing.

The discipline trade-off:
- **Batch** when family is well-understood + same shape across siblings.
- **First-chip** when establishing the shape for a new family OR when the per-ship scope is operator-pinned.

v820 is first-chip because:
1. The chain plan named it as such.
2. The git/core family's sibling files may have different shapes (no helper, different spawn patterns); first-chip lets us learn this before committing to a batch.
3. Splitting batch vs first-chip across ships gives the chain natural rhythm.

## The wiring pattern

branch-manager has a single internal helper:

```ts
function execGit(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd }, (err, stdout, _stderr) => { ... });
  });
}
```

Wiring touches:
1. Helper signature: `execGit(cmd, args, cwd, ctx?)`
2. Insert `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', cmd, args)` BEFORE the spawn (outside the Promise per #10427).
3. 4 public functions: add `ctx?: ProcessContext` as the last optional param.
4. 10 internal `execGit` callsites: pass `ctx` as the 4th arg.

Total LOC delta: +14.

## The internal-helper advantage

When a file routes ALL spawn calls through one internal helper, the wiring cost is constant w.r.t. spawn count — only the helper changes, plus public-function ctx threading. Compare to files where each public function makes its own direct `execFile` call: each call site needs its own ensure call.

v820 confirms the pattern from v809 (`intelligence/analyzer/git.ts` also used a helper). Two instances; potential generalization at a 3rd.

## KNOWN_UNWIRED ledger

Pre-v820: 32 entries.
Post-v820: 31 entries (branch-manager removed).

Remaining git/core: 3 entries (repo-manager, state-machine, sync-manager) — future batch target.

## Engine state crossover

NASA degree sustains at **1.178** for the 38th consecutive ship. Counter-cadence count UNCHANGED at 6.

The codify ⟂ consume ⟂ calibrate ⟂ observe quadrant:
- **Consume:** consume-axis (chip the KNOWN_UNWIRED ledger by 1).
- **Codify:** N/A this ship.
- **Calibrate:** N/A this ship.
- **Observe:** allowlist comment names the future-batch trajectory (in-source observability for next operator).

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.815-t2.3-high-01-pmtiles-refcount-shipped.md`.

## Forward path post-v820

v821-822 (next 2 ships) = T2.2 Discipline-coverage gate WARN → BLOCK. Audit sized as 2 ships:
- v821: recon + threshold-pick + initial flip + escape valve.
- v822: validation + tightening.

After v822, v823 = T1.3 Ship 2 (ObservationBridge wire, ~55 min). That closes the chain.

The git/core 3-file batch (repo-manager + state-machine + sync-manager) is a future ship beyond this chain.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + Lesson #10184 + Lesson #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- v820 used the v816-fixed `state-md-set-shipped` tool for STATE.md reset.
- Fifth consecutive post-v816 ship with clean colon-handling (colon-name "First Chip: ...").
