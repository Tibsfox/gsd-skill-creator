# Shelfware Verdicts

Per-module wire-or-retire decisions for modules surfaced as test-only by
`tools/adoption-scan.mjs`. A verdict is a one-time decision that takes a
default-OFF substrate module out of the "is this shelfware?" bucket and
records the reasoning in a durable, auditable form.

Established by **T1.2 ship 3/3 (AUDIT-2026-05-26)** at v1.49.789.

---

## Why a per-module verdict log

The adoption telemetry shipped at v1.49.786 + v1.49.787 surfaces shelfware
candidates but does not by itself resolve them. The v786 baseline found
that 6/6 modules in the Math Foundations Refresh (v1.49.572) cluster were
test-only:

- `coherent-functors`
- `hourglass-persistence`
- `koopman-memory`
- `semantic-channel`
- `tonnetz`
- `wasserstein-hebbian`

All six ship default-OFF opt-in flags + HARD-preservation invariants — so
"0 real callers" is intentional substrate, not a bug. The adoption scanner
correctly flags them as test-only; the verdict log records what the
operator decides to do about each, with provenance and reasoning so future
audits inherit the context.

## Verdict types

| Verdict | Effect on the module | Effect on adoption scan |
|---------|---------------------|-------------------------|
| `WIRED` | Module gains ≥1 real (non-test) caller in `src/` / `tools/` / `scripts/` / `src-tauri/` / `desktop/` that respects the opt-in flag. Module remains default-OFF; HARD-preservation invariants must hold. | Status flips `test-only` → `living` on next scan; no allowlist entry needed. |
| `RETIRED` | Module + tests + namespace registrations removed. Companion docs note the retirement and what (if anything) replaced the artifact's purpose. | Module disappears from the scan entirely. |
| `ALLOWLISTED` | Module is intentionally test-only — e.g., a reference implementation, a documentation backing artifact, or a CLI-only surface that the static scanner can't see. | Entry added to `tools/adoption-scan.allowlist.json` with `reason`, `addedAt`, `addedBy`. Status flips `test-only` → `living (allowlisted)`. |

## Verdict format

Each verdict is one row in the table below. The reasoning column should be
short (≤2 sentences) and point to the durable artifact that backs the
decision — a release-notes file, a PROJECT.md GAP closure, an allowlist
entry, or the deletion commit.

## Verdicts

| Module | Verdict | Ship | Backing artifact | Reasoning |
|--------|---------|------|------------------|-----------|
| `semantic-channel` | WIRED | v1.49.789 | `src/cli/commands/dacp-drift-check.ts`; `.planning/PROJECT.md` GAP-6 row | Exposed the read-only adapter, capacity bound, and advisory drift checker through the existing `skill-creator dacp` CLI namespace as a new `drift-check`/`dc` subcommand. First operator-visible surface for the GAP-6 closure artifact; HARD-preservation invariants intact (read-only adapter, advisory-only exit codes, default-OFF opt-in flag). |

## Open candidates (Math Foundations Refresh cluster)

- `coherent-functors` — category-theoretic NN primitive; closes part of GAP-2 (College of Knowledge consumer engine) once wired. Candidate for a future WIRED verdict when the college-of-knowledge consumer engine ships.
- `hourglass-persistence` — contraction/hole alarm. Natural wire site is the skill-DAG observability surface; candidate for WIRED when skill-DAG instrumentation reaches that surface.
- `koopman-memory` — Mamba+Koopman long-context primitive. Candidate for ALLOWLISTED (reference impl backing the substrate doc) OR WIRED (long-context skill activation path) — operator decision pending.
- `tonnetz` — unit-circle lattice for Sound of Puget Sound. Candidate for ALLOWLISTED (SoPS is operator-filtered research-cadence; the module is the durable substrate for that filtered surface) OR RETIRED (if the substrate is itself filtered out).
- `wasserstein-hebbian` — explicitly labeled "reference impl" in its docstring. Strongest ALLOWLISTED candidate.

Each open candidate is one ship-unit of work.

## When to add a verdict

After any ship that converts a test-only module's status (in either
direction): add the row here, link to the backing artifact, write one
sentence of reasoning. Do not add a verdict for transient test-only
status (a module that exists for less than 1 milestone before its first
real caller lands).

## Source of truth

The adoption scanner (`tools/adoption-scan.mjs`) is the source of truth
for whether a module is currently `living`, `test-only`, or `isolated`.
This document is the source of truth for *why* each module's status is
what it is. The two together form the shelfware closure loop.
