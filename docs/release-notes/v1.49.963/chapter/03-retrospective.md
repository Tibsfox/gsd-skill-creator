# v1.49.963 — Retrospective

## What went right

- **Empirical scoping overturned the handoff abstraction in both directions.**
  Running `astWireFacts` directly on probe inputs showed the parenthesized
  residual was broader than the handoff's single-site description (four
  collect-site attribution points, not one), while the nested self-call —
  which an earlier read had judged "by-design, risky to fix" — turned out to
  have a clean, sound fix once the body-recursion cycle (genuine) was
  distinguished from the argument-resolution recursion (finite). Reading the
  actual code beat trusting the prose.
- **The termination fix is principled, not a patch.** `resolveCallReturn`'s
  single `seen` set was doing double duty; separating the body-return loop
  (keeps `seen`) from the argument loop (`seen` minus the current name) closed
  the bound without weakening any cycle guard. Cloning `seen` rather than using
  a fresh set is what preserves termination for a cycle re-entering through an
  argument — proven by an adversarial test that stack-overflows under the
  fresh-set mutant.
- **The adversarial review earned its keep.** Three lenses across 130+
  empirically-probed inputs found 0 over-reports and 0 hangs, and surfaced one
  completeness nit (parenthesized binding initializers weren't unwrapped) that
  was closed in the same commit — making the paren-unwrap symmetric across all
  attribution and binding sites.

## What went well in process

- A scoping workflow ran in the main tree and one agent left a prototype patch
  behind; it was caught immediately by a probe whose result contradicted a
  fresh code read, then restored. The review workflow was re-run
  additive-probe-only so it could not leak, and the tree was re-verified clean
  before and after. Lesson reinforced: mutation-testing agents need isolation
  or strict additive-only constraints.
- Every fix point was mutation-proven before commit, and the doc comments were
  audited for honesty (no comment overstates what the code does).

## What to watch

- **Recursion-depth ceiling (pre-existing, fail-soft absorbed).** All recursive
  resolver paths (parens, alias chains, return-value dataflow, and now nested
  self-calls) throw `RangeError` at roughly 800 to 1000 levels of nesting. This
  is a catchable throw, not a hang, and `computeWireFacts` absorbs it via its
  documented regex fallback (#10427). Not introduced by this ship; no realistic
  e2e file approaches that depth.
- **Remaining detector residual.** A single name read across genuinely distinct
  lexical scopes is still an accepted under-report (the detector is name-based,
  not fully lexically scoped). Conservative direction; no real file triggers it.
