# v1.49.808 — S2 Adoption Telemetry Trend Report

**Released:** 2026-05-27
**Type:** tooling ship (new observability surface; no new substrate)
**Predecessor:** v1.49.807 — S5 Normalizer Gate Idempotency + PROJECT.md Drift Cap
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** S2 from `.planning/AUDIT-2026-05-26-core-functions-retrospective.md` — adoption telemetry as design constraint, not afterthought. Closes the last open lever from the 2026-05-26 retrospective.

## Summary

Tooling ship adding `tools/adoption-trends.mjs`, a multi-snapshot trend report that consumes the existing per-version `docs/ADOPTION-BASELINE-v*.json` snapshots written by `tools/adoption-refresh.mjs` since v786. Per the audit § S2: "every substrate module ships with a 'first real caller' timeline + a 30-day adoption-check that the next codification ship reviews." This ship lands the deterministic surface for that adoption-check.

Lightest-wire choice (per #10416): the trends tool consumes existing committed JSON snapshots — no new scanner, no new datastore, no new schema. The first 14 snapshots (v787 → v801) provide an immediate trend window. The report is written to `docs/ADOPTION-TRENDS.md` (committed alongside the baselines) and regenerable via `npm run adoption-report:trends`.

Per #10422 (verdict-pattern surface separation): the observability surface (this tool + the markdown report) is fully separate from the decision surface (operator's per-module wire/allowlist/retire decisions). The tool surfaces; the operator decides.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `tools/adoption-trends.mjs` | NEW | ~250 LOC node.mjs. CLI: `--write` (default), `--check`, `--since=vX.Y.Z`. Env knobs: `SC_ADOPTION_STALE_SHIPS` (default 6; threshold for persistent-shelfware classification), `SC_NEW_MODULE_WATCH_SHIPS` (default 10; window for first-real-caller tracking). |
| `tools/__tests__/adoption-trends.test.mjs` | NEW | 8 vitest tests via spawnSync (#10417) against tmpdir fixtures. Covers status-change detection, shelfware threshold, allowlist exclusion, new-module watch, --check exits, --since filter, idempotency, empty-baseline error path. |
| `docs/ADOPTION-TRENDS.md` | NEW | Initial committed report against the existing 14 baselines (v787 → v801). |
| `vitest.tools.config.mjs` | MODIFIED | Registers the new test file in the `tools` project. |
| `package.json` | MODIFIED | Adds `adoption-report:trends` (regenerate) and `adoption-report:trends:check` (drift check) npm scripts. |
| `docs/release-notes/v1.49.808/` | NEW | 5-file chapter set. |

## Initial trends surfaced

From the 14-snapshot window (v787 → v801):

- **Adoption wins (5):** semantic-channel (v789), koopman-memory (v792), coherent-functors (v793), hourglass-persistence (v793), bounded-learning (v795). All five transitioned from `test-only` → `living` over the audit-driven ship campaign.
- **Population summary trend:** living went 91 → 96 across the window (+5); test-only went 52 → 47 (-5); isolated unchanged at 10; allowlisted 10 → 12 (+2 — the v792 + v793 math-foundations allowlist additions).
- **Persistent shelfware:** 45 modules with ≥6 consecutive non-living snapshots. These are the operator-facing chip-down candidates. Each is one of: needs a real caller wire, needs an allowlist entry with reason, or needs retirement.
- **New-module watch:** empty for this window — every module had already appeared by v787. Future ships will populate this as new substrate ships.

## Lessons applied (no new lesson IDs promoted this ship)

| Lesson | Application |
|---|---|
| #10412 (recon-first) | Read `tools/adoption-scan.mjs` + `tools/adoption-refresh.mjs` + a sample baseline JSON BEFORE writing the trends tool. Recon surfaced: (a) baselines are committed as `docs/ADOPTION-BASELINE-vN.{md,json}`; (b) each JSON is a flat array of module records with `{status, allowlisted, realCallerCount, ...}`; (c) 14 baselines already exist (v787 → v801) — enough for an immediate trend window. |
| #10416 (lightest wire / tolerant-generator) | Resisted: building a new scanner; introducing a database; adding a runtime call-graph (per #10416's "tolerant generators emit skip-the-line over UNKNOWN/TODO/placeholder sentinels"). Chose: consume the existing committed JSON snapshots. |
| #10417 (test-harness uses spawnSync) | Tests use spawnSync (per the discipline) rather than execSync so stderr survives non-zero exits — important for the --check drift test that asserts on stderr content. |
| #10422 (verdict-pattern surface separation) | Observability (this tool + the markdown report) lives in `tools/`. Decision (per-module wire/allowlist/retire) lives in operator memory + future ships. Cleanly separated. |
| #10427 (failure-mode contracts) | The tool fail-LOUDLY on missing baselines (exit 1 with diagnostic). Cleaner than silent no-op which would mask the bootstrap-state-empty case. |

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a new scanner or substrate module. The trends tool is a derived report from existing data.
- Not a pre-tag-gate addition. The trends report is regenerated on demand; future ships may add a `--check` to pre-tag-gate if drift becomes a recurring class.
- Not a wire of any persistent-shelfware module. The report surfaces 45 candidates; chipping them down is operator-cadence work via the natural 5-1-1 alternation pattern per #10430.

## Verification

- `npm run build` → PASS.
- `npx vitest run --config vitest.tools.config.mjs tools/__tests__/adoption-trends.test.mjs` → 8/8 PASS.
- `node tools/adoption-trends.mjs --check` → exits 0 (no drift after `--write`).
- `node tools/adoption-trends.mjs --write` → idempotent across re-runs.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 26 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED).
Open lesson candidate backlog: 0 (UNCHANGED).
Tentative observations carried forward: 8 (UNCHANGED).

## Lever closure

After v808, the 2026-05-26 audit retrospective is **fully closed**:

| Lever | Status |
|---|---|
| S1 | Promoted at v790 (#10417) |
| **S2** | **CLOSED v808** |
| S3 | Promoted at v805 (#10428) |
| S4 | Promoted at v805 (#10429) |
| S5 | Closed v807 |
| S6 | Closed v806 |
| S7 | Promoted at v805 (#10430) |

## Forward path

- **NASA 1.179 forward-cadence** — most visible open item (26 consecutive at 1.178).
- **`KNOWN_UNWIRED` migration cadence** — 16 egress + 38 process callers tracked from v806.
- **Persistent-shelfware chipping** — 45 modules surfaced by `docs/ADOPTION-TRENDS.md`; each is wire/allowlist/retire judgment per ship.
- **T1.3 College of Knowledge consumer engine** — recon next slot per the chain plan.
