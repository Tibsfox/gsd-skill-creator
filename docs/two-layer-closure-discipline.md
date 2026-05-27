# Two-Layer Closure for Procedure-Rooted Drift Classes

**Lesson #10431** — codified at v1.49.814.

## Rule

When a drift class originates from operator-discretion procedure (a multi-step
sequence the operator must remember to execute correctly), complete closure
requires **two layers**:

1. **Source eliminator** — replace the operator-discretion step with a
   deterministic tool. The tool atomically performs the work AND any
   post-condition checks.
2. **Detector gate** — a structural check (pre-commit hook, pre-tag-gate step,
   audit-test) that catches drift if a future operator bypasses the eliminator.

Either layer alone is insufficient:

- **Source eliminator without detector** — if a future operator forgets the
  tool exists or works around it (e.g., emergency hand-edit), the drift can
  re-enter undetected.
- **Detector without source eliminator** — the operator-discretion procedure
  remains the drift origin. The detector only catches it after it lands; the
  human-error window stays open.

## Case study: v805 → v806 STATE.md drift class

The pattern was first observed and named at v1.49.813:

| Layer | Ship | Mechanism |
|---|---|---|
| Source eliminator | v1.49.813 | `tools/state-md-set-shipped.mjs` — atomic-writer takes milestone metadata and emits a fully-normalized STATE.md, replacing the prior hand-edit-then-normalize procedure |
| Detector | v1.49.807 (S5) | pre-tag-gate step 0.5 post-write check on `state-md-normalizer` — catches drift if the source eliminator is bypassed |

The drift originated when an operator hand-edited STATE.md after T14 step 11
("STATE.md normalize") to set up the next milestone, without then re-running
the normalizer. v807 added the detector; v813 added the source eliminator.
Both layers shipped together as a complete closure.

## When to apply

Whenever a retrospective surfaces a drift class with this shape:

- Drift originates from a multi-step operator procedure
- One specific step in the procedure is forgettable / skippable
- The drift only becomes visible at the next pipeline-gate run

Examples in scope:
- STATE.md hand-edit + normalize (closed at v813)
- PROJECT.md "Latest shipped release" hand-edit (open; flagged at v813)
- Release-notes file scaffolding (any drift between v<X> dir and expected
  5-file set; currently caught by completeness check but no source eliminator)

Examples out of scope (single-step procedures or no detector available):
- "Run tests before pushing" — the test is the detector + the procedure;
  no operator-discretion step to eliminate
- "Update CHANGELOG before merging" — the operator step IS the value; no
  way to atomize it without losing the semantic content

## How to apply

When designing a closure for a procedure-rooted drift:

1. **Identify the drift origin step.** What specific operator action introduces
   the drift? (For STATE.md: "hand-edit a fresh STATE.md before next ship".)

2. **Build a source eliminator.** Tool that replaces the discretion step:
   - Takes the same inputs the operator would (via CLI flags or config)
   - Emits the same artifact atomically + canonical-form-checked
   - Documents exit codes and failure modes per #10427
   - Has dedicated unit tests for the content builder + e2e write-check

3. **Add or confirm the detector.** Structural check that catches bypass:
   - Pre-tag-gate step, pre-commit hook, audit-test, or pipeline assertion
   - Fails loudly with clear remediation guidance
   - Has its own tests

4. **Document both layers in T14-SHIP-SEQUENCE.md** or the relevant procedure
   doc, with cross-references between the eliminator's step and the detector's
   step.

5. **Per-ship release notes** record the closure shape: "drift class closed in
   two layers: source (this ship) + detector (prior ship)."

## Anti-patterns

- **Source eliminator that doesn't include the post-condition check.** The
  tool emits the canonical artifact but doesn't verify with the validator/
  normalizer. A future template-vs-validator drift can re-introduce drift
  without breaking the tool's exit code.
- **Detector that fails silently or only WARNs.** If the detector doesn't BLOCK
  (or at minimum FAIL the ship), the drift can land in production. WARN-only
  detectors are useful as ratchet ratchets, not as load-bearing closures.
- **Closure documented as "complete" when only one layer ships.** v807's S5
  retrospective explicitly noted the partial closure status; the operator
  should resist the temptation to call a half-closure done.

## Cross-references

- **#10414 (Gate-not-vigilance)** — this discipline is the structural version
  of gate-not-vigilance applied to procedure-rooted drift specifically.
- **#10427 (Failure-mode contracts)** — both layers must specify their failure
  contracts loudly (the source eliminator's exit codes; the detector's BLOCK/
  WARN semantics).
- **counter-cadence-discipline.md** — counter-cadence ships are the natural
  venue for source-eliminator construction. The detector typically ships earlier
  (as part of a related Strengthening Lever or audit retrospective).

## Open questions

- Should the source eliminator + detector ship together in one ship, or is
  the v807 → v813 separation (6 ships apart) acceptable? Argument for together:
  the closure is atomically complete. Argument for separation: the detector is
  cheap (~few lines of bash); the source eliminator is more substantial
  (~200 LOC + tests). Shipping in separate counter-cadence ships matches the
  size-bound discipline.

## Forward observation

If a 3rd two-layer closure ships in a future counter-cadence ship, this
discipline becomes ESTABLISHED-and-applied (currently 1 case study, this
ship promoting it). Possible future closures the discipline applies to:

- PROJECT.md "Latest shipped release" hand-edit drift
- Release-notes 5-file scaffolding drift (completeness check is the detector;
  no source eliminator yet)
- STATE.md `.backup-*` file accumulation (no detector; would need both layers)
