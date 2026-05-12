# 04 — Lessons: v1.49.640 Housekeeping Cluster #7

## Summary

**2 forward lessons emitted** (#10203, #10204) + **1 lesson first-apply-to-self confirmation** (#10199).

## Lesson #10199 — First apply-to-self confirmation

### Origin

`docs/release-notes/v1.49.639/chapter/04-lessons.md` codified Lesson #10199 — "Multi-cluster carry-forward chains can encode framing errors". The lesson was emitted at retrospective time but had not yet been mechanically applied.

### v1.49.640 first application

v1.49.640 W0 ran mechanical closure-verification probes against all 3 routed CFs BEFORE authoring or dispatching component specs:

| CF | Probe | Outcome | Routing |
|---|---|---|---|
| CF-7 | `npm audit --audit-level=high --json` | exit 1 + 4 catalogued advisories → `still-real` | C1 proceed (path b) |
| CF-9 | `wc -l + content snapshot diff of .planning/cartridge-migration-phase2.md` | unchanged vs predecessor → `unchanged` | carry forward to Cluster #8 |
| CF-8 | operator AskUserQuestion at W0 close | option (b) chosen | engine state UNCHANGED |

### Confirmation

The gate worked as designed:
- CF-7 was correctly NOT falsely retired (probe confirmed still-real)
- CF-9 was correctly NOT re-investigated (probe confirmed unchanged)
- CF-8 was routed via decision rather than speculation

### Forward applicability

Lesson #10199 is now codified at `docs/MISSION-PACKAGE-DISCIPLINE.md`. Future N+k clusters get the gate by default. The mechanical W0 step requirement is now standing discipline, not an ad-hoc reminder.

**Mitigation effectiveness:** The gate's value was confirmed at the v1.49.640 W0 application. Future clusters can cite this confirmation when applying the gate.

## Lesson #10203 — Phantom dependencies: `npm audit fix` can't remove deps not declared in package.json

### Statement

When a transitive dependency surfaces in `npm audit` and is pulled in via a phantom (declared-but-unused) parent dependency, `npm audit fix` will **upgrade or downgrade** the parent dep to clear the advisory but cannot **remove** the parent. If the parent dep has no usage in the codebase, the correct fix is to remove the parent from `package.json` directly — bypassing `npm audit fix` entirely.

### Source incident

v1.49.640 C1 path (b) experience:

1. CF-7 surfaced 2 critical advisories on `@mistralai/mistralai` (transitive via `gsd-pi`) and 2 moderate on `@anthropic-ai/sdk` (transitive via `@anthropic-ai/claude-agent-sdk`)
2. `npm audit fix --dry-run` proposed gsd-pi 2.62.0 → 2.82.0 upgrade (cleaning the @smithy/* + octokit chain)
3. `npm audit fix` applied; resulted in 1 moderate cleared (4→3 vulns)
4. **2 criticals persisted because gsd-pi 2.82.0 STILL pulls in @mistralai/mistralai** as transitive
5. Investigation revealed: gsd-pi has zero source-level usage in this codebase — phantom dep added at commit `1964b4011` for "GSD-2 integration" never wired
6. The fix required REMOVING gsd-pi from `package.json` (path (d)), not upgrading it (path (b))

### Mitigation

For any future CF-7-shaped supply-chain advisory:

1. **Probe with `npm audit` first.** Confirm the advisory chain.
2. **Trace dependency origin.** Use `npm ls <advisory-pkg>` to find the parent that pulls it in.
3. **Check parent usage.** `grep -rn "from '<parent>'" src/ desktop/ src-tauri/ tools/` for direct imports. `grep -E "'<parent>'" package.json` for scripts/bin entries.
4. **If parent has no source usage:** remove parent from `package.json` directly. Do not run `npm audit fix` first; the phantom-dep removal subsumes it.
5. **If parent IS used:** then `npm audit fix` (or `--force`) is the right tool; consider whether the parent dep version range can be tightened to exclude the vulnerable transitive.

### Forward applicability

- Any future supply-chain advisory closure
- Routes alongside Lesson #10199 closure-verification gate as a path-tree refinement
- Add a pre-flight phantom-dep check to `MISSION-PACKAGE-DISCIPLINE.md` §1.3 step 5 routing tree (forward-improvement candidate; not blocking)

## Lesson #10204 — Hidden transitives can be load-bearing: pre-flight grep before path-d removal

### Statement

When a phantom dependency is removed from `package.json`, the entire transitive subtree under it is also uninstalled by `npm install`. If any package within that subtree is **directly imported** by source code in `src/` (or other vitest-included paths), the import will fail at test time. The phantom dep was load-bearing for tests via its transitive subtree; removal breaks them.

### Source incident

v1.49.640 C1 path (d) experience:

1. Removed `gsd-pi ^2.62.0` from `package.json`
2. `npm install` cascaded: 202 packages removed; 0 vulnerabilities; "found 0 vulnerabilities" message
3. Full vitest run: **14 test files FAILED** with `Cannot find package 'fast-xml-parser'`
4. `grep -rn "from 'fast-xml-parser'" src/` confirmed 3 src/ files import it directly
5. `npm install fast-xml-parser --save` added it as direct dep; still 10 test files failing
6. Second probe revealed `Cannot find package 'yaml'`; 6 src/ files import directly
7. `npm install yaml --save` added it; final vitest 0 failures

The fast-xml-parser was a transitive via `gsd-pi → @smithy/* → ?`. The yaml was a transitive via `gsd-pi → @anthropic-ai/* → ?`. Both were satisfied by the phantom dep's subtree; removal broke them.

### Mitigation

Before removing any root dependency from `package.json`:

```bash
# Pre-flight: identify hidden transitives that source code relies on
DEP='<dep-to-remove>'
SUBTREE=$(npm ls "$DEP" --depth=Infinity --json 2>/dev/null \
  | jq -r '.. | objects | .name? // empty' | sort -u | grep -v '^null$')
for pkg in $SUBTREE; do
    if grep -rl "from ['\"]$pkg['\"]" src/ 2>/dev/null | head -1; then
        echo "HIDDEN TRANSITIVE: $pkg used in src/ (currently satisfied via $DEP)"
    fi
done
```

If any output: those packages must be declared as direct deps (`npm install <pkg> --save`) BEFORE removing the root dep. Otherwise vitest fails at the post-removal verification step.

### Apply-to-self

This lesson is added to `docs/test-discipline/cf-closure-verification-templates.md` §"Hidden-transitive guard" as a copy-paste template, alongside the 4 CF-shape probe templates. Future cluster authors get the guard by default.

### Forward applicability

- Any future path-d-style root-dep removal
- Particularly relevant for `npm` deps; cargo and pip have different transitive semantics
- A `scripts/closure-verify-cf.mjs` future tool (per `MISSION-PACKAGE-DISCIPLINE.md` §1.7) could automate the guard

## Cumulative lesson count

| Range | Description | Count |
|---|---|---|
| #10180 | Meta-Lesson — fragile-test discipline (audit underestimates fixture scope) | 1 |
| #10181-10186 | v1.49.636 cluster | 6 |
| #10187-10192 | v1.49.637 cluster | 6 |
| #10193-10198 | v1.49.638 cluster | 6 |
| #10199-10202 | v1.49.639 cluster | 4 |
| #10203-10204 | **v1.49.640 cluster (this milestone)** | 2 |
| Total | | 25 |

(Counts approximate; actual lesson IDs may have gaps.)

## Apply-to-self meta-check

The newly-codified Lesson #10199 (closure-verification gate) was the governing discipline for this entire milestone. v1.49.640 W0 is the canonical example of the gate's application; future N+k clusters can cite it.

The newly-emitted Lessons #10203 + #10204 are forward-applicability extensions of Lesson #10199. They refine the path-tree routing (#10203) and add a pre-flight guard (#10204) that strengthens the gate's effectiveness for path-d-style CFs.

## See also

- `01-overview.md` §Scope-change disclosure — operational context for #10203 + #10204
- `02-walkthrough.md` §C1 — full path-execution trace
- `03-retrospective.md` §What worked / §What burned cycles — pattern observations
- `05-carry-forward.md` §CF-12 — forward-improvement routing
- `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.7 — tooling support forward-direction
- `docs/test-discipline/cf-closure-verification-templates.md` §Hidden-transitive guard — Lesson #10204 codified
