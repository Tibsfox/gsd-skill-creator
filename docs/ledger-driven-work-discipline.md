# Ledger-Driven Work Discipline

**Surface:** Before executing any REVIEW ledger entry or planning artifact written as a sweep summary; when authoring audit rules and audit verdicts.

**Codified at:** v1.49.784 (lesson cluster from v1.49.780-v1.49.783 — three consecutive Tier E architecture milestones where pre-execution recon flipped the ledger's framing).

## Why this discipline exists

REVIEW ledger sweeps are written as best-effort summaries without per-file inspection. They WILL mis-estimate scope, miss already-done work, and conflate distinct failure modes. Three consecutive ships (v780, v781, v782) each surfaced material ledger discrepancies during ~15 minutes of pre-execution recon. The pattern is not coincidence — it's the load-bearing property of sweep summaries.

## Discipline patterns

### Recon-first as default, not optional (Lessons #10409, #10412)

When picking a wedge from a REVIEW ledger or planning artifact written as a sweep, dedicate the first ~15 minutes of the ship to per-file recon. Verify:

1. **Scope** — does the actual file structure match the ledger's description?
2. **Framing** — is the suggested fix the right shape?
3. **Prior-art** — has the work been partly done already?

The cost of recon (10-20 min) is bounded. The cost of executing the wrong refactor (hours to days) is unbounded. Three consecutive milestones validated this as the dominant pattern, not the exception.

**Anti-pattern.** Treating a ledger entry as a directive — "the spec says merge these stores, so merge them." Ledger entries are starting points for investigation, not authoritative work orders.

**Examples.**

- v780 — ledger said "extract dispatcher from 2,132-line cli.ts." Recon: file was now smaller (partially extracted) at v780-open time.
- v781 — ledger said "3 chip-registry.ts files duplicate" + "extract MemoryStore adapter for 7 backends." Recon: 2 files with DIFFERENT classes (filename collision, not class duplication) + interface already existed with 4/9 already conforming + 5 intentionally distinct roles.
- v782 — ledger said "14 disk-loaders, ctx in constructor." Recon: 15 cited, 4 NOT disk-loaders, 10 of 11 are free functions not classes.

### Classify by behavior, not by filename (Lesson #10413)

When authoring an audit rule for "files that do X," classify by the actual behavior signature (e.g. `import.*node:fs` presence), not by filename pattern. The filename is a hint at intent; the import statement is a fact about behavior. Discrepancies are common — at v782, 4 of 15 `*loader*.ts` files had no `node:fs` import at all.

**Anti-pattern.** Writing an audit that says "every `*foo*.ts` file MUST [...] OR have a justification doc comment." Produces false-positive friction for files whose name is incidentally `*foo*`-shaped but whose behavior is not. Worse, it incentivizes future authors to avoid the `*foo*` filename to escape the audit — fragmenting the codebase's naming vocabulary.

**Reference implementation.** `src/security/loader-context-audit.test.ts` filters by `node:fs` import presence, not by filename alone. Use as the template for future audit-rule authoring.

### Three-way audit verdict for interface-conformance (Lesson #10411)

When auditing an interface for conformance across N candidate types, the verdict for each candidate must be one of:

1. **ALREADY CONFORMS** — no action needed; the audit confirms expected state.
2. **SHOULD CONFORM** — gap to close in this or a future ship.
3. **INTENTIONALLY DIFFERENT ROLE** — document the reason at the type site so future audits don't re-flag.

The third verdict is just as load-bearing as the second. Without it, the next audit re-flags the same false positives, and operators learn to ignore the report — degrading the audit's signal.

**Anti-pattern.** Treating non-conformance as always a gap to close. Some types share a name suffix (`Store`, `Loader`, `Registry`) but serve fundamentally different roles; forcing them into a single adapter interface degrades both the interface and the types.

**Reference implementation.** v781's MemoryStore audit: 0 widening + 5 role-boundary doc comments saying "Role: NOT a `MemoryStore` tier."

### Distinguish filename-collisions from class-name-collisions in ledger fields (Lesson #10410)

REVIEW ledger sweeps that flag duplicate `Store`/`Registry`/`Manager`/`Loader` files should report BOTH:

- `filename_dups: ['foo.ts × 3']` — filename-collision; fix is `git mv` per file
- `class_name_dups: [{name: 'FooRegistry', count: 2, paths: [...]}]` — class duplication; fix is merge + refactor

The two are independent failure modes with different fix sizes (~10× delta). Lumping them together produces over-estimates for filename collisions and under-estimates for class duplications.

**Anti-pattern.** Reporting only the filename count when the class names differ. The reader is misled into estimating fix complexity at merge-scale when the actual work is rename-scale (or vice versa).

## When this discipline kicks in

- About to execute a REVIEW ledger entry (any tier).
- About to author an audit rule that operates on N files.
- About to ship a refactor whose scope was estimated from a planning sweep summary, not from a per-file read.
- About to report audit results to an operator who will make a scope decision based on the verdict.

## Anti-pattern summary

- ❌ Treating ledger entries as directives without recon.
- ❌ Filename-based audit classification.
- ❌ Two-state (`PASS`/`FAIL`) interface-conformance verdicts.
- ❌ Lumping filename-collisions and class-name-collisions into a single ledger field.

## Lesson references

- **#10409** — Recon flips scope estimates more often than not. v781 candidate.
- **#10410** — Filename collisions and class-name collisions need separate ledger fields. v781 candidate.
- **#10411** — Interface-conformance audits should report "intentional non-conformance" as a distinct verdict. v781 candidate.
- **#10412** — Recon-first discipline graduates from "candidate" to "default" (three-ship validation). v782 candidate.
- **#10413** — Audit rules must classify by behavior, not by filename. v782 candidate.
