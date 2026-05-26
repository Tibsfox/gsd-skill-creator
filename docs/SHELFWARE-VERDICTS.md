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
| `tonnetz` | ALLOWLISTED | v1.49.791 | `tools/adoption-scan.allowlist.json` `tonnetz` entry | Substrate-level reference implementation for the SoPS (Sound of Puget Sound) surface per arXiv:2604.19960 (Boland 2026, MATH-20 Phase 752). The SoPS mapping is the substrate; ALLOWLIST rather than RETIRE because the substrate is preserved, not filtered out. Default-OFF + G6 standard CAPCOM preservation invariants intact. |
| `wasserstein-hebbian` | ALLOWLISTED | v1.49.791 | `tools/adoption-scan.allowlist.json` `wasserstein-hebbian` entry; `docs/substrate-references/wasserstein-hebbian.md` | Substrate-level runtime backing for the canonical reader's reference to arXiv:2604.16052 (Tan 2026, 75pp, MATH-19 Phase 751). Companion to the substrate doc; advisory-only audit-finding emitter; CAPCOM retains gate authority. |
| `koopman-memory` | WIRED | v1.49.792 | `src/cli/commands/koopman-check.ts` | Exposed the three advisory retention invariants (`checkIdentityRetention`, `checkZeroInputRetention`, `checkLipschitzBound`) plus operator construction + spectral-data through a new top-level `skill-creator koopman-check`/`kc` CLI. Three-tier output (text/quiet/JSON). HARD-preservation invariants intact: `src/memory/` runtime untouched; only `import type` references; G8 HARD-preservation gate preserved; advisory-only exit-code 0 invariant. |
| `coherent-functors` | WIRED | v1.49.793 | `src/cli/commands/coherent-check.ts` | Exposed the four coherence predicates (`checkNaturality`, `checkIdentity`, `checkComposition`, `checkDirectSum`) plus the aggregate `checkCoherence` and `identityFunctor` factory through a new top-level `skill-creator coherent-check`/`cc` CLI. Three-tier output (text/quiet/JSON). G6 HARD-preservation gate preserved; advisory-only exit-code 0 invariant. |
| `hourglass-persistence` | WIRED | v1.49.793 | `src/cli/commands/hourglass-check.ts` | Exposed the topological-hole detector + contraction-index computation + waist detection + audit-finding emitter through a new top-level `skill-creator hourglass-check`/`hc` CLI. Canonical fixtures (hourglass / chain / empty) provide no-arg smoke check. Three-tier output (text/quiet/JSON). Standard CAPCOM preservation gate preserved; advisory-only exit-code 0 invariant. |

## Open candidates

The Math Foundations Refresh (v1.49.572) cluster is **fully closed** as of v1.49.793 — all 6 modules verdicted (4 WIRED + 2 ALLOWLISTED).

Future shelfware candidates from non-Math-Foundations clusters should be appended above this section as the adoption-scan surfaces them.

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
