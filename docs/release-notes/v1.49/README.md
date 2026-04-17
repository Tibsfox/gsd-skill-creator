# v1.49 — Deterministic Agent Communication Protocol

**Released:** 2026-02-27
**Scope:** DACP — three-part agent handoff bundles (intent + data + code), adaptive fidelity model, retrospective drift analysis
**Branch:** dev → main
**Tag:** v1.49 (2026-02-27T02:49:53-08:00) — "Deterministic Agent Communication Protocol"
**Predecessor:** v1.48 — Physical Infrastructure Engineering Pack
**Successor patches:** v1.49.1, v1.49.2, v1.49.3 (retrospective-patch sequence closing RC-01 through RC-05)
**Classification:** mega-release — the single largest bundled release in the v1.x line after v1.0
**Phases:** 11 (446–456) · **Plans:** 24 · **Requirements:** 68 (65 satisfied, 3 partial)
**Verification:** 263 verification tests + ~450 unit tests · 8/8 safety-critical mandatory-pass · strict TypeScript · 95% fidelity accuracy
**LOC:** ~22.7K across 11 phases · **Commits:** 43

## Summary

**Three-part bundles replace markdown blobs.** v1.49 replaces markdown-only agent handoffs with three-part bundles — human intent plus structured data plus executable scripts — and wraps them in a self-correcting feedback loop. The release's architectural bet is that agent-to-agent communication is not a single problem but three layered problems that need three different representations. Intent is ambiguous and belongs in prose. Data is exact and belongs in validated JSON. Code is executable and belongs in scripts the receiver can run verbatim. Mixing the three into a single markdown blob — which was the v1.48-and-earlier pattern — forces every receiver to re-parse the same ambiguity. DACP ends that. The 8-stage interpreter pipeline (`.complete` marker → manifest schema → fidelity match → file existence → size limits → schema coverage → data-schema validation → provenance) validates each layer independently, so a bundle that fails one layer never contaminates another.

**Adaptive fidelity, not one-size-fits-all.** The adaptive fidelity model is what makes DACP land as a practical protocol rather than an over-engineered one. Level 0 ships prose only, for handoffs where a sentence is enough. Level 1 adds a data payload. Level 2 adds scripts the receiver can run to verify or transform the data. Level 3 is the full bundle — intent, data, code, manifest, provenance, template reference, rationale record. The Assembler's decision model chooses a level based on data complexity, historical drift for the handoff pattern, the skills available at the receiver, the current token budget, and the safety criticality of the task. 95% accuracy across 20 test scenarios, against a target of 85%, means the model rarely over-packages simple handoffs and rarely under-packages safety-critical ones. The one miss in twenty was a borderline verification-request that the model scored a Level 2 instead of Level 3 — and the retrospective analyzer caught it via drift on the next use.

**Drift analyzer closes the loop.** The retrospective analyzer closes the feedback loop — and it is the feature that keeps the protocol honest. Every bundle deployment records a drift score: the composite of how far the receiver's actual execution diverged from the sender's intent, weighted by rework rate (25%), verification failure rate (25%), modification rate (15%), and intent mismatch (35%). Pattern detection groups bundles by handoff_type; when a pattern accumulates drift greater than 0.3 over a cooldown window (7 days), the analyzer recommends promoting its default fidelity level. When drift stays below 0.05 over a 14-day cooldown, it recommends demotion. The cooldowns are asymmetric on purpose: slower to demote than promote, because stability costs less than missed escalations. Append-only JSONL persistence means every drift record, pattern record, and rationale emission is auditable by `tail -f` and `grep` — the v1.0 JSONL primitive holding under v1.49-scale traffic.

**Safety is structural, not advisory.** Eight SAFE requirements ship as executable code rather than policy. `Object.freeze` on every script reference means bundles cannot auto-execute (SAFE-01). The `clampFidelityChange` helper caps any single fidelity adjustment at one level (SAFE-02); no pattern can leap from Level 0 to Level 3 on a single bad drift reading. `ScriptCatalog.addEntry()` rejects entries without a provenance chain (SAFE-03). `tryLoadBundle()` returns null for degraded bundles and `isBundleAvailable()` guards every call site (SAFE-04). Cooldown enforcement at 7d/14d blocks oscillation (SAFE-05). `loadBundle() + validateProvenance()` rejects scripts whose source skill or version cannot be traced (SAFE-06). Size limits of 50 KB data / 10 KB per script / 100 KB total bundle are enforced in the writer (SAFE-07). And the `.msg` fallback means any DACP bundle degrades cleanly to a plain message for systems that don't speak the bundle format (SAFE-08). 8-of-8 safety-critical tests SC-01 through SC-08 pass mandatorily — a failure of any one is a release blocker.

**Retrospective patches as a workflow.** v1.49 shipped with three known CLI-layer field-name mismatches as documented tech debt, and the retrospective-patch sequence v1.49.1 through v1.49.3 closed them in days. The mismatches — `dacp-status.ts` reading `pattern` where JSONL records write `handoff_type`, `dacp-history.ts` filtering on `pattern` instead of `handoff_type`, and `dacp-analyze.ts` passing the wrong type to `readDriftHistory()` — were presentation-only; the core library was fully integrated with zero orphaned exports. But shipping them as debt rather than hot-patching the tag established what became the project's standard post-mega-release workflow: tag the big release, track the retrospective items as RC-NN entries, and land a rapid `.1` / `.2` / `.3` sequence of targeted patches within days. v1.49.1 fixed the CLI field alignment and closed RC-04. v1.49.2 wired GSD-OS indicator panels correctly and resolved TypeScript friction. v1.49.3 polished GSD-OS Desktop. Every patch ran the full 19,000-plus test suite against its single-field change, proving the discipline was structural. The pattern — mega-release, retrospective patches, retrospective-tracker state transitioning from `open` through `documented` to `applied` — is now how the project ships anything ambitious. v1.49 is the release that taught the project it needed that workflow.

## Key Features

| Area | What Shipped |
|------|--------------|
| DACP Types & Schemas (Phase 446) | 26 Zod schemas with inferred TypeScript types · 9 JSON Schema files (draft 2020-12) · DriftScore weighted composite (intent 35%, rework 25%, verification 25%, modifications 15%) |
| Bundle Format (Phase 447) | Directory layout: `manifest.json`, `intent.md`, `data/`, `code/` with atomic `.complete` markers · size limits 50 KB data / 10 KB per script / 100 KB total · mandatory `.msg` fallback · 9-point structural validator |
| Assembler & Fidelity Model (Phase 448) | Composes three-part bundles from skill library queries · Level 0 through Level 3 fidelity with 95% accuracy across 20 scenarios · max 1 level change per cycle (SAFE-02) · rationale recording in markdown + JSONL |
| Interpreter (Phase 449) | 8-stage validation pipeline · `Object.freeze` on script references (SAFE-01) · provenance-chain enforcement (SAFE-06) · progressive-disclosure SKILL.md format · no auto-execute by construction |
| Retrospective Analyzer (Phase 450) | Drift scoring with retrospective-tuned weights (40/30/20/10) · pattern detection grouping by handoff_type · promote > 0.3, demote < 0.05 thresholds · 7-day promote / 14-day demote cooldowns (SAFE-05) · append-only JSONL persistence |
| Skill Library Extensions (Phase 451) | Script catalog indexed by function type (parser, validator, transformer, formatter, analyzer, generator) · schema library searchable by data_type / fields / name_pattern · mandatory provenance (SAFE-03) · EMA success tracking (0.7·old + 0.3·new) |
| Bundle Templates (Phase 452) | Registry with CRUD + wildcard search + JSON persistence · 5 starter templates: skill-handoff (L2), phase-transition (L2), agent-spawn (L3), verification-request (L3), error-escalation (L1) · default fidelity + data schema + test fixture refs |
| Bus Integration (Phase 453) | `DACPTransport` routes through the Den filesystem bus with `.msg` + `.bundle` companions · enhanced scanner pairs both sides · orphan detection + bundle cleanup utilities · `tryLoadBundle` / `isBundleAvailable` graceful degradation (SAFE-04) |
| Dashboard Panel (Phase 454) | Drift-score trend renderer with high/low threshold indicators · fidelity distribution horizontal bar chart (proportional widths) · promote/demote recommendation cards · pure render functions, `hp-` CSS prefix, HTML string output |
| CLI Commands (Phase 455) | `dacp status` / `dacp history <pattern>` / `dacp analyze` / `dacp set-level` / `dacp export-templates` · every command supports text / `--json` / `--quiet` output modes |
| Verification (Phase 456) | 263 tests across 15 test files · 8/8 safety-critical mandatory-pass (SC-01 through SC-08) · 95% fidelity accuracy (19/20 scenarios) · bundle round-trip + backward-compatibility tests for all fidelity levels |
| Safety Architecture | 8 SAFE requirements enforced structurally (SAFE-01 no-auto-execute · SAFE-02 bounded change · SAFE-03 provenance · SAFE-04 graceful degradation · SAFE-05 cooldowns · SAFE-06 provenance validation · SAFE-07 size limits · SAFE-08 `.msg` fallback) |

## Safety Architecture

| Safety Requirement | Mechanism | Test |
|---|---|---|
| SAFE-01: No auto-execute | `Object.freeze` on script references | SC-01 |
| SAFE-02: Bounded changes | `clampFidelityChange` (max 1 level) | SC-06 |
| SAFE-03: No unprovenanced data | `ScriptCatalog.addEntry()` rejects empty provenance | catalog tests |
| SAFE-04: Graceful degradation | `tryLoadBundle` returns null, `isBundleAvailable` | SC-08 |
| SAFE-05: Cooldowns | 7-day promote, 14-day demote | SC-03 |
| SAFE-06: Provenance enforcement | `loadBundle` + `validateProvenance` | SC-05 |
| SAFE-07: Size limits | MAX_DATA_SIZE 50 KB, MAX_SCRIPT_SIZE 10 KB | SC-04 |
| SAFE-08: Backward compatibility | `bundleToMsgContent` + `.msg` fallback | SC-02 |

## Wave Execution

- Wave 0 (sequential): 446 → 447
- Wave 1 (parallel): 448 | 449
- Wave 2 (parallel): 450+451 | 452+453
- Wave 3 (parallel): 454+455
- Wave 4 (sequential): 456

## Retrospective

### What Worked

- **Three-part bundle design (intent + data + code) is the right abstraction.** Separating human-readable intent from structured data and executable scripts means each part can be validated independently. The 8-stage interpreter pipeline validates each layer without crossing concerns, and a failure in one layer never contaminates another.
- **Adaptive fidelity model eliminates over-engineering.** Level 0 prose for simple handoffs, Level 3 full bundles for safety-critical ones. The system doesn't force heavyweight scaffolding on lightweight tasks. 95% accuracy across 20 test scenarios validates the decision model in concrete terms.
- **Safety architecture is structural, not advisory.** `Object.freeze` on script references (SAFE-01), mandatory provenance (SAFE-03), bounded fidelity changes (SAFE-02), and cooldown enforcement (SAFE-05) are enforced in code, not policy. 8/8 safety-critical tests passing is a release gate, not a stretch goal.
- **Backward compatibility by design.** The `.msg` fallback (SAFE-08) means DACP bundles degrade to plain messages for systems that don't understand bundles. Migration is incremental, not a flag day. No receiver breaks when a sender upgrades, and vice versa.
- **Wave planning scales to 11 phases.** Sequential Wave 0 (types → format) as the foundation, then three parallel pairs (448|449, 450+451|452+453, 454|455), then sequential Wave 4 for verification. Zero merge conflicts across the parallel waves.
- **Retrospective analyzer built in from day one.** Shipping drift measurement with the protocol — instead of adding it in a follow-up — means fidelity levels self-correct rather than drifting silently. Without Phase 450 the whole fidelity model would be a static guess.

### What Could Be Better

- **Three CLI field-name mismatches shipped as accepted tech debt.** The `pattern` vs `handoff_type` inconsistency across `dacp-status`, `dacp-history`, and `dacp-analyze` is presentation-only but creates confusion when reading code. It should have been caught in Phase 455 before verification. Closed by v1.49.1's shared-schema alignment and backward-compat shim.
- **22.7K LOC across 11 phases is dense for a communication protocol.** Scope grew from bundle format into dashboard, CLI, templates, and bus integration. A tighter scope would have shipped the core protocol faster and layered the extensions as `.1` / `.2` minor releases. The mega-release shape is what forced the retrospective-patch sequence afterwards.
- **RC-01 and RC-05 shipped as documentation checklists, not closures.** v1.49.1's tag message conflated "checklist established" with "item resolved." Future release notes distinguish `documented` from `applied` in the retrospective tracker.
- **No shared Zod schema between CLI and core types.** The three field-name mismatches existed because CLI interfaces and core types were declared in parallel. A single source-of-truth schema imported by both would have made the inconsistency a compile-time error. Scheduled for a future refactor.

## Lessons Learned

- **Communication protocols need drift measurement built in from day one.** The retrospective analyzer (Phase 450) with weighted drift scores and pattern detection is what makes DACP self-correcting. Without it, fidelity levels would be static guesses and the feedback loop would never close. Every future protocol at this project now ships its own observability alongside the wire format.
- **Cooldown enforcement prevents oscillation.** 7-day promote and 14-day demote cooldowns (SAFE-05) prevent the fidelity model from flip-flopping between levels. The asymmetric window — slower to demote than promote — builds trust in the system's stability by biasing toward keeping scaffolding rather than stripping it early.
- **Wave planning pays off at 11-phase scale.** Five waves with three parallel pairs kept the build on schedule. Sequential Wave 0 (types → format) was the right foundation order; parallel Wave 2 (analyzer+library | templates+bus) had zero merge conflicts because each pair owned its own module boundary.
- **Append-only JSONL persistence is the right default for observability data.** Drift history, pattern records, and assembly rationale all use JSONL. No schema migrations, natural audit trail, trivial to query with grep. The v1.0 primitive holds at v1.49 traffic volumes without modification.
- **Safety requirements belong in code, not in the README.** Eight SAFE requirements map to eight enforcement sites in the codebase and eight mandatory-pass tests. Calling safety "structural, not advisory" is only meaningful when a missing test fails the build. Every SC-NN test is a tripwire.
- **Mega-releases need retrospective patches as a workflow, not an accident.** v1.49 shipped 22.7K LOC across 11 phases; retrospective items RC-01 through RC-05 were tracked before the tag landed. v1.49.1/.2/.3 were planned as the closure sequence, not discovered as firefights. The project's standard post-mega-release pattern was codified here.
- **Backward-compat shims are cheap to land and hard to remove — plan accordingly.** The `.msg` fallback (SAFE-08) and the later v1.49.1 `type`/`handoff_type` reader shim both work forever without maintenance, but every future reader carries the branch. Add shims deliberately, and only when the alternative is breaking a live consumer.
- **Name retrospective-tracker items to make closure auditable.** RC-01 through RC-05 are visible in git history, tag messages, and on-disk tracker state. Every future reader can trace which patch closed which item. The bookkeeping cost is small; the traceability benefit compounds with every mega-release that follows.
- **Full regression runs on every patch, even single-field renames.** v1.49.1 ran all 19,110 tests for a one-file rename. This is expensive but non-negotiable — field-alignment bugs cascade into deserialization failures in ways unit tests don't always see. The discipline is what makes `.1` patches safe to land quickly.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.48](../v1.48/) | Predecessor — Physical Infrastructure Engineering Pack; last release of the pre-DACP handoff era |
| [v1.49.1](../v1.49.1/) | First retrospective patch — DACP CLI Field Alignment (`handoff_type` canonicalization + compat shim), closes RC-04 |
| [v1.49.2](../v1.49.2/) | Second retrospective patch — GSD-OS Indicator Wiring & TypeScript Fixes, continues the RC closure sequence |
| [v1.49.3](../v1.49.3/) | Third retrospective patch — GSD-OS Desktop Polish, third in the v1.49 `.1`/`.2`/`.3` sequence |
| [v1.49.4](../v1.49.4/) | Follow-on patch in the v1.49.x line |
| [v1.49.5](../v1.49.5/) | Follow-on patch in the v1.49.x line |
| [v1.0](../v1.0/) | Foundation release — DACP sits on the v1.0 six-step adaptive loop and the append-only JSONL pattern store |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — fidelity levels echo the v1.37 angular-promotion pipeline structurally |
| [v1.38](../v1.38/) | SSH Agent Security — the provenance-chain enforcement pattern in DACP generalizes v1.38's credential-proxy posture |
| [v1.39](../v1.39/) | GSD-OS Bootstrap — DACP rides the Den filesystem bus introduced here via `DACPTransport` |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG; DACP is the protocol layer the DAG needed for safe cross-node handoffs |
| [v1.28](../v1.28/) | GSD Den Operations — filesystem message bus that Phase 453 extends with `.msg` + `.bundle` companion pattern |
| `src/dacp/` | Core DACP library — types, bundle format, assembler, interpreter, retrospective analyzer |
| `src/dacp/dacp-analyze.ts` | CLI file whose field-name mismatch shipped as RC-04 and closed in v1.49.1 |
| `.planning/retrospective/RC-01.md` → `RC-05.md` | Retrospective tracker items covering the v1.49 → v1.49.3 patch sequence |
| `.planning/MILESTONES.md` | Canonical milestone detail per the v1.49 tag message |
| `test/dacp/` | 15 test files, 263 verification tests, including SC-01 through SC-08 mandatory-pass |

## Engine Position

v1.49 is the largest bundled release in the v1.x line after v1.0. It opens the v1.49.x version line — the hourly-release train that carries the project through 2026, reaching v1.49.500 by the v1.50 cadence boundary and v1.49.559 as of the April 2026 NASA/360 engine work. Every later release inherits v1.49's DACP protocol as the handoff substrate; every mega-release afterwards inherits v1.49's retrospective-patch workflow as the standard shape for landing ambitious scope without destabilizing main. The eight SAFE requirements are load-bearing at every successor. The retrospective analyzer is the first instance of a pattern that becomes ubiquitous: ship the observability with the feature, not after it. The v1.49 → v1.49.1 → v1.49.2 → v1.49.3 sequence is the template the release pipeline follows from here forward.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Phases delivered | 11 (446–456) |
| Plans executed | 24 |
| Requirements satisfied | 65 of 68 (3 partial, tracked as RC-01 through RC-05) |
| Commits in tag window | 43 |
| Lines of code | ~22.7K |
| Verification tests | 263 across 15 test files |
| Unit tests | ~450 |
| Safety-critical tests | 8/8 passing (SC-01 through SC-08) |
| Fidelity model accuracy | 95% (19 of 20 scenarios) |
| Known tech debt at tag | 3 CLI field-name mismatches (closed in v1.49.1) |
| Retrospective patches | 3 planned (v1.49.1, v1.49.2, v1.49.3) |
| Wave count | 5 (Wave 0 sequential, Waves 1–3 parallel, Wave 4 sequential) |

## Taxonomic State

| Layer | v1.49 Additions |
|-------|-----------------|
| Types & schemas | 26 Zod schemas, 9 JSON Schema files (draft 2020-12) |
| Bundle format | manifest.json, intent.md, data/, code/, `.complete` marker, `.msg` fallback |
| Protocol components | Assembler, Interpreter, Retrospective Analyzer, Transport, Template Registry |
| Skill library | Script catalog (6 function types), Schema library (data_type/fields/name_pattern) |
| Bus integration | `.msg`/`.bundle` companion pattern, orphan detection, bundle cleanup |
| Observability | Drift score, pattern detection, promote/demote recommendations, dashboard panel |
| CLI surface | 5 commands (status, history, analyze, set-level, export-templates) × 3 modes |
| Safety enforcement | 8 SAFE requirements mapped 1:1 to SC-01 through SC-08 |

## Files

- `src/dacp/` — core DACP library (types, schemas, bundle format, assembler, interpreter, retrospective analyzer, skill library extensions, templates, transport, CLI)
- `test/dacp/` — 15 test files, 263 verification tests (assembler, bundle-format, bus-integration, cli, dashboard, edge-cases, fidelity-model, integration, interpreter, performance, retrospective, safety-critical, skill-library, templates, types)
- `docs/release-notes/v1.49/README.md` — this file
- `docs/release-notes/v1.49/RETROSPECTIVE.md` — retrospective long-form
- `docs/release-notes/v1.49/LESSONS-LEARNED.md` — lesson records carried forward to the tracker
- `docs/release-notes/v1.49/chapter/` — 00-summary, 03-retrospective, 04-lessons, 99-context chapter files
- `.planning/retrospective/RC-01.md` … `RC-05.md` — retrospective tracker items that drive the v1.49.1/.2/.3 patch sequence
- `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` — bumped to 1.49.0 at tag time
- `README.md`, `docs/FEATURES.md`, `docs/FILE-STRUCTURE.md`, `docs/RELEASE-HISTORY.md` — updated to reflect v1.49 shipping
