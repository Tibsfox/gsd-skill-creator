# v1.49.978 — Retrospective

## What went right

- **Recon-first → verify-the-output paid off again.** A 4-agent classify→adversarial-verify workflow disagreed with itself on five modules (cache, components, skill, scan-arxiv, amiga). Adjudicating each against live code — rather than trusting either the classifier or the skeptic — produced the correct verdict every time: `components` really was a dead barrel re-export (0 production importers of `security/index`), `skill`'s only consumer was an unwired CLI command, and the `commands`→`learn`/`scan-arxiv`/`git` chain meant one decision cascaded across four modules.
- **Looking at the target before deleting caught two mis-framed retires.** `health-diagnostician` was described as a "clean leaf" but its `DiagnosisResult`/`DiagnosisReport` types are used by the *kept* `alternative-discoverer`; `components` is half of a TS↔Rust dashboard IPC contract. Both were surfaced to the operator and downgraded to allowlist rather than executing surgery on kept code or orphaning a cross-language contract.
- **The headline invariant is now machine-checked.** Post-ship the "Living but unreachable, non-allowlisted" set is empty, and a drift-guard pins it — so future shelfware of this class can't silently accumulate.

## What went well in process

- The irreversible decisions (which retires, the 10K-LOC `amiga` subsystem, the wire scope) went through two operator round-trips via AskUserQuestion before any deletion; the clear-cut allowlists were executed by default. This kept operator attention on the high-blast-radius calls only.
- New drift-guard landed in an existing suite (`learning-substrate-parked.test.ts`) — no new gate step, denominator stays 20.
- Step-P ran clean (0 confirmed across 5 dimensions) on the first pass — the pre-commit verification (full suite + tsc + live scan) had already caught everything.

## What to watch

- **14 new dated gates (2027-06-05).** The allowlist now carries 32 entries. The dated review gates exist precisely so this cohort doesn't become "the next upstream" — they must actually be reviewed, not auto-renewed.
- **The deferred WIRE cluster.** `commands` + `scan-arxiv` were allowlisted as tooling/standalone-invoked; registering their `sc-learn`/arxiv CLI surface (which would also flip `learn` reachable) is a named follow-up, not done here.
- **`amiga` (10,104 LOC) is parked, not resolved.** A dedicated retire decision is deferred to a future ship if it stays dormant.
- The `upstream-intelligence` retire removed the Gate-G14 composition byte-identical test; the 10 constituent modules retain their individual coverage, but the all-together composition check is gone.
