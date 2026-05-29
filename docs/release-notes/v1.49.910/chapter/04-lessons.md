# Lessons Emitted — v1.49.910

One NEW lesson promoted to ESTABLISHED (#10459) + eight PARTIAL discipline-coverage entries backfilled into the manifest. Net manifest delta: +9 lessons (99 → 108). Discipline-coverage PARTIAL 8 → 0; UNCODIFIED unchanged at 39.

## NEW — Lesson #10459: Class-multi-method consolidated-gate sub-variant of #10448

**Promoted at:** v1.49.910.

**Status:** ESTABLISHED (3-instance bar).

**Domain:** Architecture-retrofit patterns.

**Canonical doc:** `docs/architecture-retrofit-patterns.md`.

**Evidence (3 instances):**

| Ship | File | LOC | Public read methods | Wrapped scope | Mixed-mode method |
|---|---|---|---|---|---|
| v1.49.902 | `orchestrator/state/state-reader.ts` | 190 | 1 (`read`) | `this.planningDir` | none |
| v1.49.907 | `memory/file-store.ts` | 516 | 5 (`list`, `count`, `has`, `get`, `query`) | `this.memoryDir` | `get()` (read-then-write internally) |
| v1.49.908 | `memory/conversation-store.ts` | 531 | 3 + 1 mixed-external | `this.storePath` | `ingestSessionLog(logPath)` — gates the EXTERNAL path |

**Rule:** When the chip file is a class that wraps a directory/namespace scope with M public read methods (M ≥ 1) fanning into N private fs-op methods (N ≥ 1), hoist `ensureAllowed` ONCE at the top of each public read method on the class-wrapped scope; private fs-ops inherit the gate via transitive call. One audit per public call regardless of internal fan-out (cross-ref #10456 exact-N assertion).

**Distinct from sibling sub-variants:**
- **#10455 class-stored hoist-at-top** (N=1 single fs-op method) — gates at the fs-op *site*; audit target is the file path.
- **class-instance multi-method read-side** (v904, N≥2 parallel public methods) — audit target is a single FILE (`this.filePath`); the consolidated-gate sub-variant wraps a DIRECTORY scope. The audit-granularity decision follows from what the class wraps.

**Mixed-mode handling (v908 contribution):**
- Read-then-write internal → gate the read at the top of the public method; the internal write inherits out-of-scope (v907 `get()` pattern).
- Read from an EXTERNAL path → gate the external path, not the class scope (v908 `ingestSessionLog(logPath)` pattern).

**Why this matters:** The campaign incidentally completed the promotion arc (v902 1-instance → v907 2-instance → v908 3-instance ESTABLISHED) faster than the canonical 7-10 ship codify trigger, because the memory-store family (file-store, conversation-store) shares structural shape. Formalizing the sub-variant in the #10448 catalog gives the next class-wrapping-a-directory chip a named shape to pick rather than re-deriving the gate-at-public-entry-vs-fs-op-site decision.

## DISCIPLINE-COVERAGE BACKFILL — 8 PARTIAL → COVERED

These lessons were each already documented in a canonical doc but absent from any manifest `key_lessons` list (the `check-discipline-coverage.mjs` PARTIAL bucket: "in doc, NOT in manifest"). Wiring each ID to its owning entry — and registering two docs that were not yet canonical — flips all eight to COVERED.

| Lesson | What it is | Manifest entry | Canonical-doc home |
|---|---|---|---|
| #10176 | pre-tag-gate composite as HARD RULE | Ship pipeline | `tools/pre-tag-gate.sh` (registered this ship) |
| #10183 | version-sequence sanity (step 1.5) | Ship pipeline | `tools/pre-tag-gate.sh` |
| #10188 | POSIX-ERE translation at git-grep boundary → depth-audit gate (step 6) | Ship pipeline | `tools/pre-tag-gate.sh` |
| #10364 | SPS cohort-uniqueness audit (step 14) | Mission package framing | `docs/MISSION-PACKAGE-DISCIPLINE.md` |
| #10365 | scaffold-manifest hint validation | Mission package framing | `docs/MISSION-PACKAGE-DISCIPLINE.md` + `docs/scaffold-manifest-discipline.md` (registered this ship) |
| #10373 | STATE.md normalizer drift recurrence closure | Two-layer closure | `tools/pre-tag-gate.sh` step 0.5 |
| #10391 | STORY.md newline-separator discipline | Sub-agent dispatch | `docs/sub-agent-dispatch-discipline.md` |
| #10401 | brief title-line trip-vocab budget | Mission package framing | `docs/MISSION-PACKAGE-DISCIPLINE.md` |

**Rule (the backfill discipline):** A lesson that is documented in a canonical doc but never wired into the manifest is invisible to the rendered CLAUDE.md trigger-line lesson list — the discipline exists in prose but not in the discipline-as-data manifest. The `check-discipline-coverage.mjs` PARTIAL bucket surfaces this asymmetry; the fix is to add the ID to the `key_lessons` of the entry that semantically owns it (and register the doc as canonical if it is not already), NOT to re-author prose.

**Why this matters:** PARTIAL coverage was a standing 8-entry backlog carried unchanged across the entire v903-v909 campaign. The discipline-coverage gate (`--max-uncodified=41`) only blocks on UNCODIFIED count, so PARTIAL drift can accumulate silently. A counter-cadence codify ship is the natural place to drain it — the backfill is cheap (the docs already exist) and restores honesty between the manifest and the canonical docs it claims to index.

## Carry-forward — remaining candidates after v910

The v903-v909 campaign's six promotion-eligible candidates: one (#10459) promoted this ship; the remainder stay below the 3-instance bar:

- **Verdict-as-closing-move** (1 instance v909) — needs 2 more verdict-application instances.
- **Dual-ctx convention** (ProcessContext + LoaderContext on one file; 2 instances v903 keystore + v906 emulated-scanner) — needs 1 more for ESTABLISHED.
- **Class-instance multi-method read-side** (1 instance v904) — needs 2 more.
- **Module-function two-site mixed sync+async** (1 instance v905) — needs 2 more.
- **Sync multi-site same-path** (1 instance v906) — needs 2 more.
- **Sync two-site hoisted-check** (1 instance v903) — needs 2 more; no remaining sync-existsSync candidates on the closed ledger (patience candidate).

Plus the longer-standing carry-forward set unchanged from v909 (live-inspection byte-shape tie-breaking, within-budget closing-move opportunism, `opts.ctx` vs separate ctx param, `module-singleton` wire shape, codify-ship-duration-scales-with-composition, cross-audit tool sanity-fixture coverage, etc.).

The 39 UNCODIFIED lessons (mostly NASA mission-authoring campaign telemetry, #10250-#10401) remain carried forward — a deliberate scope boundary for this ship. Draining them would require either a new "NASA mission authoring" discipline domain or selective promotion of the genuinely-reusable subset (#10367 protected-path bypass, #10378/#10383/#10387 content-filter, #10369/#10388 dispatch cadence) into the existing Sub-agent dispatch entry. Deferred to a dedicated future codify ship.

## Cross-references

- #10448 (Shared-helper hoist sub-variant catalog — #10459 is a NEW catalog entry)
- #10455 (Class-stored hoist-at-top — the N=1 sibling of #10459's M≥1 form)
- #10456 (Audit-record-count assertion — the exact-N test that proves consolidated-gate emits one audit per public call)
- #10457 (Read-side-only chokepoint at write-bearing classes — write-side methods out-of-scope in all #10459 instances)
- #10428 (Meta-cadence codify-axis trigger — this ship's cadence justification)
- #10434 (KNOWN_UNWIRED ledger generalization to per-discipline UNCODIFIED counts — the discipline-coverage ceiling backfilled by this ship's PARTIAL sweep)
