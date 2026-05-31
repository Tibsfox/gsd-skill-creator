# v1.49.922 — Ship-Tooling Cross-Platform Hardening (macOS Lane Green End-to-End)

**Shipped:** 2026-05-30
**Type:** Fix (cross-platform tooling; fix-forward from the v1.49.920/921 macOS CI lane)
**NASA degree:** 1.178 (unchanged — 137 consecutive ships)
**Predecessor:** v1.49.921

## What shipped

The v1.49.921 retro predicted that cross-platform cleanup would be **layered** — that
fixing the macOS lane's vitest step would expose the next layer. It did. This milestone
closes that layer and two latent ship-tooling gate bugs surfaced alongside it, then proves
the macOS lane green **end-to-end** (including the node:test step that had never run on
macOS). Three fixes, one theme: make the ship tooling correct across GNU and BSD.

### 1. perf-assertion-audit git grep — BSD/macOS portability (the lane's "layer 2")

`runAudit()` feeds each `SHAPE_PATTERN.source` to `git grep -E`. The `relative-ratio`
pattern carried two PCRE/JS-only constructs that **BSD (macOS) git grep rejects**:
a lazy `[^)]+?` ("repetition-operator operand invalid"), and a `[\d.+ \-]` whose `\d` the
translator mistranslated into the malformed `[[0-9].+ \-]`. This errored the tools-suite
step on macOS. Fix: de-lazy the pattern, write the class as `[0-9.+ \-]` directly, and
extract a hardened, tested `toPosixEre()` that strips lazy quantifiers defensively.
**Bonus:** the old GNU-mangled ERE was silently under-counting on Linux too — findings went
**75 → 90**, all 15 new ones genuine `N * ident + K` shapes (0 false positives, 0 removed).

### 2. ci-gate workflow pinning

Step 4 of the pre-tag-gate listed runs from **all** workflows on dev and took the
most-recent `.[0]` at the dev-tip SHA. The decoupled, non-blocking `ci-macos.yml` lane can
be `workflow_dispatch`'d onto dev, so two workflows share a dev-tip — and `.[0]` could pick
the macOS lane, reading the wrong conclusion (false ship FAIL). Fix: pin the query with
`gh run list --workflow ci.yml` (overridable via `SC_CI_GATE_WORKFLOW`).

### 3. pre-tag-gate step 17 abort

Under `set -euo pipefail`, the step-17 `latest-shipped-version-drift` grep aborted the
**entire gate** when PROJECT.md WARNed for any *non-drift* reason (grep no-match → exit 1 →
pipefail → `set -e`). Fix: `|| true`, letting the existing empty-result guard handle it.

## Verification

- Full tools-suite green on Linux (**698 tests**); both gate fixes verified by repro
  (clean-child-shell for step 17; live before/after for the ci-gate selection).
- **macOS proof:** the lane was re-dispatched on the fixed SHA — run `26697886385` =
  **success**, all steps including the **node:test step running on macOS for the first time**.

## Engine state

- NASA degree 1.178 (unchanged)
- Counter-cadence count: 18 (unchanged — fix-forward, not a cleanup mission)
- Manifest: 24 domains, 149 lessons (unchanged — two lesson candidates noted, not codified)
- macOS CI lane (v920) is now green **end-to-end** — a fully working cross-platform signal

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)
