# 02 — Walkthrough: v1.49.644 Cluster #11 Per-Component Narrative

## W0 — Closure-verification gate

### W0 Step 1: Authoring CF probe specs

After the operator chose option (b) at session open, the audit surfaced 2 candidate CFs. Per the codified discipline at `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.3, both got probe specs at `.planning/cf-probes/cf-{16,17}.yaml`.

`cf-16.yaml` initially carried a defensive routing override (`resolved-upstream: proceed`) because the probe's `--audit-level=high` threshold could have hidden the 2-moderate baseline. The override was a documentation pattern for moderate-only CFs.

`cf-17.yaml` used the `file-snapshot` probe against `.planning/cartridge-migration-phase2.md` — a documentation/inventory check verifying the 7-unfit-chipset roster was still real.

### W0 Step 2: Probe execution + advisory escalation

The probes ran via `node scripts/closure-verify-cf.mjs auto CF-{16,17}`. Mid-execution:

- 15:28:59Z first probe: 2 MODERATE (both protobufjs subtree)
- 15:30:23Z re-run via auto subcommand: 1 HIGH + 1 MODERATE — protobufjs re-rated upstream

The escalation surfaced 2 new GHSA IDs (GHSA-2pr8-phx7-x9h3, GHSA-66ff-xgx4-vchm) appended to the protobufjs aggregate. The probe correctly returned `still-real` on the re-run.

The advisory database update during the W0 window was a fortunate close call: had the original 2-moderate state persisted, the probe would have routed `resolved-upstream` (false-negative). This surfaced **Lesson #10208** (threshold-gap finding).

### W0 Step 3: Mission package authoring

9-file mission package staged at `.planning/missions/v1-49-644-housekeeping-cluster-11/` (gitignored per established practice). Matches the v1.49.640 9-file template shape.

### W0 Step 4: Operator decisions

3 questions:
- C2 path: operator chose **(d) Combination a+b** — full Family A + Family B coverage
- C3 path: operator chose **(i) In-cluster tool fix** — close Lesson #10208 immediately
- G0: **AUTHORIZE** — proceed to W1

## W3 Stage 0 — Absorb v1.49.643 post-ship refresh

First commit of the session: `chore(release): v1.49.643 post-ship refresh — RH+dashboard absorption` (`78391921a`). Absorbed `M dashboard/index.html` (24 lines) + `M docs/RELEASE-HISTORY.md` (5 lines) — the standard 7-milestone-running post-T14 refresh pattern.

## C1 — CF-16 npm audit closure

```
$ npm audit fix
changed 4 packages, and audited 378 packages in 1s
found 0 vulnerabilities
```

15 lockfile lines changed (15 ins / 15 del). No `package.json` changes (transitive resolution sufficed).

Post-fix probe verification returned `resolved-upstream (high+: 0)` and `resolved-upstream (moderate+: 0)`. Both threshold levels confirm clean closure.

Full test suite ran post-fix: 30056/30057 passing. One spurious failure on `v1-49-635-meta-test.test.ts` C6 (STATE.md normalizer idempotency) — surfaced as a pre-existing frontmatter drift in the v1.49.644 W0 STATE.md update; resolved by running `node tools/state-md-normalizer.mjs --write`. Not a regression from C1.

Commit: `7702bb839 chore(deps): npm audit fix — protobufjs advisory closure (CF-16)`.

## C3 — Lesson #10208 closure (threshold-gap finding)

Added `probe_args.severity` field to the `npm-audit` probe in `scripts/closure-verify-cf.mjs`:

1. New `VALID_AUDIT_SEVERITIES` allowlist (`['low', 'moderate', 'high', 'critical']`)
2. `probeNpmAudit(args)` reads severity from `args[1]` (default `high`); validates via the allowlist; threads into `--audit-level=<severity>` and `metadata.vulnerabilities[<thresholdSlice>]` aggregation
3. `buildArgsForProbe('npm-audit', cfId, probeArgs)` passes `probe_args.severity` when present
4. Record body now includes a `Severity threshold:` line for operator audit trail

Apply-to-self: cf-16.yaml updated to use `probe_args: { severity: moderate }`. The routing override is no longer load-bearing; cleaned up to standard `resolved-upstream: retire`.

5 new tests added to `closure-verify-cf.test.ts` (default backward-compat + explicit moderate + low/critical + invalid rejection + auto-subcommand apply-to-self). 19/19 passing.

Commit: `2c63c9a8b feat(scripts): npm-audit probe severity threshold (Lesson #10208)`.

## C2 Path b — Family B discovery-gate surface

The migrate command's `findLegacyChipsets` previously silently dropped chipset.yaml files that didn't match the agents+skills+teams department-shape gate. Operators had no visibility into the 3 Family B chipsets.

Refactored to return classified results:

```ts
interface DiscoveredChipset {
  path: string;
  shape: 'department' | 'not-department';
}
```

Files that fail the shape gate now surface as `status: 'not-department-shape'` records with reason text. `summarizeMigration` includes the new category in tally + per-file display.

Live tree verification: `48 = 41 dry-run + 4 unfit + 3 not-department-shape` matched the v1.49.636 inventory exactly.

5 new tests added to `cartridge-migrate.test.ts` (gastown/math-coprocessor/den-style analogs + text-summary + regression). 17/17 passing.

Commit: `37fdae06a feat(cartridge): surface non-department-shape chipsets in migrate report (CF-17 path b)`.

## C2 Path a — Family A adapter expansion

Family A chipsets nest identity under a `chipset:` sub-tree and serialize skills/agents/teams as arrays. Before this change, the adapter failed at the top-level name check.

New `normalizeFamilyAShape(legacy)` pre-processing in `department-adapter.ts`:

1. **Identity hoist** — if top-level `name` is absent and `chipset.name` exists, hoist `chipset.{name,version,description}` to top level
2. **Skills array → map** — keyed by `skill.name`; synthesized description fallback `Migrated from legacy skill <name>`
3. **Agents array → block** — `{topology: 'router', agents: [...]}` with role fallback (`agent.team` → `'agent'`) and tools-string split (`'Read, Write, Bash'` → `['Read', 'Write', 'Bash']`)
4. **Teams array → map** — keyed by `team.name`; `members` field renamed to `agents`

Fall-through conditions (regression-safe):
- No `chipset:` sub-tree present → not Family A → normalizer returns unchanged
- Top-level `name` present even with `chipset:` sub-tree → top-level wins → normalizer returns unchanged

Live tree result: 48 = 45 dry-run (was 41) + 0 unfit (was 4) + 3 not-department-shape. All 4 Family A chipsets migrate cleanly:
- `agc-educational`
- `aminet-archive`
- `minecraft-knowledge-world`
- `unison-translation`

7 new tests added to `department-adapter.test.ts` (hoist + skills map + description synth + agents wrap + tools split + role fallback + teams members→agents + 2 fall-through). 24/24 passing.

Commit: `2a80ccd65 feat(cartridge): adapter expansion for Family A chipset:-wrapped legacy (CF-17 path a)`.

## W3 Stage 2 — Meta-test

`tests/integration/v1-49-644-meta-test.test.ts` with 6 invariants (5 component invariants + 1 counter-cadence flag check). All pass.

Commit: `711260b3f test(v1-49-644): integration meta-test for cluster #11 — post-bankruptcy resume`.

## W3 Stage 3 — Release notes

This file + 6 chapter siblings. 8-file 7+1 package per established structure.

## W3 Stage 4 — T14 ship

Pending operator G3 authorization. Atomic ship commit with bump + tag + push.
