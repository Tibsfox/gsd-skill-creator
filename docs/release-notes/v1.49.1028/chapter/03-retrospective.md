# v1.49.1028 — Retrospective

## What went right

- **The deploy went exactly as designed: targeted, never blanket.** All 11 stale files landed; the two
  marker-block agents were never candidates; post-deploy differs == exactly the 2 intentional files. The
  C6 adjudication ("13 differs = 11 stale + 2 intentional; blanket `--force` unsafe") held perfectly at
  execution time.
- **The first real run found real defects — three layers deep.** Populating the index forced the first
  genuine YAML+zod parse of the installed tree, which exposed (1) the validator rejecting the dominant
  in-repo triggers format (a schema-vs-corpus inversion: the data was right, the schema was wrong),
  (2) an abort-on-first-error write path, and (3) two latent YAML frontmatter defects that had been
  silently consumed by the lenient harness loader for months. All three fixed in-ship. This is the
  audit's "deploy layer unobserved" thesis confirmed mechanically: unobserved surfaces accumulate
  invisible rot.
- **Dogfooding closed the loop in-session.** The 2 YAML repairs were redeployed using the `--only` flag
  shipped two commits earlier.
- **The 4-month-flagged item is closed with real numbers, not scaffolding.** `.skill-index.json` went
  from `entries: []` (2026-02-12) to 37 entries with 5 real activation counts sourced from 195 sessions —
  the v1027 co-activation widening's signal now lands in a durable, queryable artifact.

## What went well in process

- Design-pass-first held: `.planning/SHIP-v1.49.1028-DESIGN.md` written before any code; both bounded
  executor dispatches (42 and 47 tool uses) executed it with zero scope drift; the one declared
  deviation (defensive cartridge-dir `--only` guard) was spec-consistent.
- SendMessage follow-on dispatch (the ship-1 pattern) handled the mid-ship fix without a fresh agent:
  executor B retained full context of the command + index code and turned the triggers fix around in one
  bounded pass.
- The adversarial ship review (base `v1.49.1027` — the corrected-args form from the v1027 gotcha) earned
  its keep again: 1 MAJOR confirmed (comment prevalence counts measured pre-repair, stale post-repair),
  fixed in code, zero findings explained away.
- Known-flake protocol applied as written: the retention-substrate failure under concurrent load was
  re-run in isolation (20/20 green) and classified, not hand-waved.

## What to watch

- **The parity drift-guard only enforces where `.claude/` exists** (gitignored → absent on CI). The local
  pre-tag-gate is the enforcement point; if the gate is ever skipped on a ship, deploy drift can re-open
  silently until the next gate run. The audit §10 ship 3 (WARN→BLOCK promotions) is the natural home for
  hardening this further.
- **Activation counts are session-granularity and corpus-derived.** Re-runs are idempotent (SET
  semantics), but the numbers only refresh when `activations --write` runs. Candidate cadence: fold into
  the 5.1c re-audit window (~2026-06-19 → 07-03) alongside the co-activation pair check.
- **9 mined names are not installed skills** (slash commands like `gsd:ns-context`, user-level skills like
  `loop`). If the unknown list grows, the honest widening is mapping command activations to their owning
  surface — not force-fitting them into the skills index.
- **uc-observatory remains the only installed skill with no `triggers` key** — consistent with its
  KEEP-LOCAL status, but worth a glance if it ever gains source-of-truth status.
