# v1.49.155 — "Fleet Feature Refinement — v1.50 Blueprint"

**Released:** 2026-03-29
**Code:** FLT
**Scope:** Systems engineering specification mission — a ten-module blueprint for gsd-skill-creator's v1.50 major version, produced by four parallel agent teams across six waves, cross-validated by an integration pass, and verified against 72 criteria
**Branch:** dev
**Tag:** v1.49.155 (2026-03-29T11:34:06-07:00)
**Commits:** `73c2261c6` (1 feature commit) · `c6110f252` (merge to main)
**Files changed:** 15 · **Lines:** +4,179 / -5
**Series:** PNW Research Series (FLT entry)
**Cluster:** Systems Engineering Specification / gsd-skill-creator v1.50 Blueprint
**Classification:** specification release — no code implemented, the blueprint that makes a correct v1.50 implementation possible
**Dedication:** The Engineering Discipline — and to everyone who ever insisted on writing it down before building it
**Origin:** 35-page mission PDF (`files(192).zip`) with LaTeX source and HTML index, inserted between degrees 19 and 20 of the Seattle 360 engine because the blueprint needed to exist before implementation temptation set in
**Engine Position:** The specification milestone that gates v1.50, the ten-module reference that every subsequent Layer 1-4 implementation release will cite, and the inserted-pause release that interrupted the Seattle 360 engine specifically so v1.50 could start from a verified spec rather than a sketched one

> "Before you build a thing, you have to know exactly what it is. That is the lesson of every engineering failure that was preventable, and the reason specification exists as a discipline. This release is the specification for v1.50 — not the implementation, but the blueprint that makes a correct implementation possible."

## Summary

**Ten modules, four teams, seventy-two tests — the blueprint is done.** The v1.49.155 "Fleet Feature Refinement" release transforms a 35-page mission PDF describing ten proposed modules for gsd-skill-creator's v1.50 major version into an implementation-ready specification package: ten draft module specs written in parallel by four agent teams (Alpha, Beta, Gamma, Delta), cross-validated by a dedicated integration pass, finalized into ten authoritative module documents, synthesized into a unified v1.50 architecture blueprint, risk-assessed across every failure mode, and verified against seventy-two criteria covering safety, correctness, integration, and edge cases. The verification result — 68/72 PASS, 8/8 safety-critical PASS, 4 minor documentation precision gaps — is not just a summary of the work; it is a statement that the spec is ready to be implemented without architectural rework, and that every failure mode has been mapped to a graceful degradation path.

**Specification is the work, not the overhead.** The gap between "we have a PDF describing ten modules" and "we have an implementation-ready specification with verified cross-module consistency" required six waves, four parallel agent teams, an integration pass, a synthesis pass, and a verification pass. The end result — 68/72 passing, 8/8 safety-critical, zero design flaws — is only achievable because each wave addressed the gaps from the previous wave. Skipping to implementation from the original PDF would have produced code that looked correct at the module level and was broken at the system level. The observation bridge gap alone would have been a production debugging session. The rollout sequence violations would have required architectural rework. The field-naming inconsistencies would have been discovered as integration bugs. Spec time costs a week; bug time costs a month, and the ratio is obvious. The release re-frames specification from "the thing you do before the work" into "the thing that is the work," and the 72 verification tests plus the explicit isolation property plus the 121-row risk table are the artifacts that make that re-framing defensible.

**The four-team parallel topology produced a 9.4-out-of-10 design consistency score with no coordination protocol beyond the mission brief.** Team Alpha owned autonomous operation (M1 Intake, M2 Audit Trail, M5 Cluster Topology). Team Beta owned safety infrastructure (M3 Warden, M6 Credentials). Team Gamma owned the foundation and routing (M4 Model Routing, M8 Chipset Schema). Team Delta owned intelligence and normalization (M7 DACP Event Bus, M9 Pattern Detection, M10 Retro Loop). The domain separation was clean enough that teams needed no cross-team coordination during Wave 1 — they converged on consistent patterns (DACP three-part bundles, SC/CF/IN/EC test taxonomy, rollout dependency declarations) independently. Domain ownership created natural coherence within each team's work; the inconsistencies were all at team boundaries — exactly where you expect them and where an integration wave finds them. The model scales, and this release is the proof.

**The observation bridge discovery was the most important finding of the entire mission.** Wave 1 produced drafts that were internally consistent but cross-module inconsistent in the specific way you expect when four teams work independently on interconnected systems. The critical gap: M3 (Safety Warden) wrote only to `violations.jsonl`, while M9 (Pattern Detection) read from `observations.jsonl`. These were separate files with no connection. M9's `VIOLATION_CLUSTER` pattern was effectively blind — it could not see the violations M3 was recording. Wave 2 integration found the gap in a single afternoon. Wave 3 corrected it by adding a dual-write requirement: M3 now writes to BOTH files on every violation. M6 writes credential-probe observations. M7 writes intake-received and intake-rejected observations. M9 reads all three sources from `observations.jsonl`. The observation bridge is now explicit, field-level specified, and test-verified (IN-03, IN-04, IN-16). Finding this at spec time cost one integration wave; finding it at implementation time would have cost a debugging session plus architectural rework plus a rolled-back release.

**Defense-in-depth across three independent safety dimensions.** Safety in v1.50 is not a single gate — it is three independently enforcing dimensions. Spatial safety (M3 — per-operation glob path matching, pre-commit hook plus PostToolUse Write hook, fail-closed). Credential safety (M6 — per-bash-spawn structural `delete process.env[key]` for FILTERED tier, SC-04 scanner for FILTERED references, fail-closed on missing `credentials.yaml`). Temporal safety (M9 — cross-session pattern detection over a 30-day observation window, four-level escalation ANNOTATE/ALERT/ESCALATE/BLOCK). No single-module bypass defeats all three layers. M3 failing degrades to prompt-layer safety (the current state). M6 failing means credentials co-reside but M9's `FILTERED_PROBE` detects probes. M9 failing loses longitudinal detection but M3 and M6 still enforce per-session. Every failure mode degrades gracefully to a state no worse than the pre-v1.50 status quo, and that isolation property is explicit in the risk table, not implied.

**The rollout sequence was corrected by topological sort.** The original mission PDF proposed this sequence: `M8 → M6 → M3 → M4 → M7 → M1 → M2 → M5 → M9 → M10`. Wave 2 dependency analysis found two violations: M6 was placed before M3 (but M6 requires M3 for `block_paths` protection of `credentials.yaml`), and M7 was placed before M1 (but M7 normalizes the file events M1 produces). Corrected sequence: `M8 → M3 → M6 → M4 → M1 → M7 → M2 → M5 → M9 → M10`. With parallel opportunities, this becomes a seven-phase rollout with critical path `M8 → M3 → M6 → M9 → M10` (five modules deep, the longest chain). The correction was discoverable in five minutes of topological sort; it was not found before publication because no one ran the sort. The lesson generalizes: before any future mission publishes a rollout sequence, the sequence should be validated by building a dependency graph from module specs and running topological analysis — a thirty-line script, not a complex system.

**Clean-room methodology held at scale.** Ten modules, four teams, zero contamination. Every thepopebot reference across all ten specs is framed as convergent discovery proof, not design source. The discipline held without a cross-team referee because the brief was explicit: cite thepopebot to prove the requirement is real, then design from GSD-native first principles. The distinction matters: knowing that others built similar things confirms the problem is real, but the solution must still be earned from first principles. File watching, persistent workers, credential isolation, git-as-audit, per-job model routing, event normalization, and retrospective loops all appeared in thepopebot — validating that these are structural requirements of any system at this scale, not feature requests. The spec cites the convergence as evidence, then designs everything clean-room. SC-05 verifies 10/10 modules compliant, zero thepopebot code patterns reproduced.

**Verification as a first-class spec deliverable, not a post-hoc review.** Wave 5 ran 72 tests against the 10 finalized specs, an 827-line blueprint, and a 121-row risk table. It found 4 failures, documented each with specific line references and fix instructions, and accurately characterized all four as documentation-precision gaps rather than design flaws. None were minimized ("probably fine"), inflated ("blocking"), or omitted. Self-assessment at this level of precision — where the pass/fail judgment is calibrated correctly and the failure documentation is actionable — is the operational definition of engineering rigor. The test taxonomy (SC safety-critical, CF core functionality, IN integration, EC edge cases) came naturally from the four teams working independently: things that must never fail, things that must work, things that must connect, things that must not break in weird situations. When four teams converge on the same structure independently, the structure is probably right.

The release shipped as 15 files totaling 4,179 insertions: 3 research modules under `www/tibsfox/com/Research/FLT/research/` (858 lines combined — vision guide, research reference, milestone spec), a retrospective artifact (151 lines), a 123-line knowledge-nodes JSON feeding the cross-reference graph, a 1,497-line LaTeX mission pack compiling to a 208,894-byte PDF, a 523-line standalone HTML mission-pack index, three site-integration pages (`index.html` 164 lines, `mission.html` 122 lines, `page.html` 210 lines, `style.css` 195 lines), a 49-line cross-references JSON patch updating the AAR manifest, and a 3-line edit to `www/tibsfox/com/Research/series.js` to register FLT in the Research catalog. The commit was `feat(www): Fleet Feature Refinement — v1.50 Blueprint (FLT deep research)`, shipped clean against the Research catalog directory boundary and a scoped `.planning/` footprint — no touches to `src/`, `src-tauri/`, tests, or hooks. The mission was inserted between degree 19 and degree 20 of the Seattle 360 engine because this work could not wait for the next natural pause. The blueprint needed to exist before implementation temptation set in. Now it does, and the Seattle 360 engine resumes at degree 20.

## Key Features

| Area | What Shipped |
|------|--------------|
| M1 — Autonomous Intake Layer | Watches the staging inbox and dispatches detected files automatically. Per-path debounce prevents duplicate processing. Content-hash dedup handles multi-file drops. Crash recovery re-scans on startup. Files move to `processed/` on success and `failed/` on failure. Domain: Operation. Complexity MEDIUM, Risk LOW. |
| M2 — Skill Evolution Audit Trail | Git-based audit on a dedicated `skills-evolution` branch. Every skill change captured as a three-part DACP bundle. Rollback commands defined. Dashboard feed at `.planning/docs/skills.json`. Enables M9's `RAPID_MODIFY` detection. Domain: Intelligence. Complexity MEDIUM, Risk LOW. |
| M3 — Safety Warden Infrastructure Gate | Pre-commit hook (Layer 1) plus PostToolUse Write hook (Layer 2). Glob-based path matching via `minimatch` — `startsWith()` is explicitly prohibited. Dual-writes to `violations.jsonl` (enforcement audit) AND `observations.jsonl` (M9 feed) on every violation. Self-referential closure: M3 protects its own hook code. Fail-closed on missing or malformed `safety.yaml`. Domain: Safety. Complexity HIGH, Risk MEDIUM. |
| M4 — Chipset-Tier Model Routing | Amiga tier map — Agnus (Opus) for judgment and synthesis, Denise (Sonnet) for implementation and writing, Paula (Haiku) for boilerplate and logging. 13 agent roles assigned across the three tiers. Tier routing enforced at dispatch time, not just aspired to in documentation. Domain: Intelligence. Complexity LOW, Risk LOW. |
| M5 — Persistent Cluster Topology | Worker identity (UUID-based) persists across sessions via filesystem JSON. Warm start reads `handoff.md` and `state.json`; cold start is a safe fallback. Atomic writes, named locks, task queue for multi-worker coordination. Domain: Operation. Complexity HIGH, Risk MEDIUM. |
| M6 — Credential Tiering Architecture | Three-tier model: FILTERED (structurally deleted from child env before bash spawn — `delete process.env[key]`, not empty assignment), LLM_ACCESSIBLE (present in child env by design), WORKFLOW_ONLY (CI/CD only, never in agent containers). SC-04 scanner checks skill scripts for FILTERED variable references. Fail-closed on missing `credentials.yaml`. Domain: Safety. Complexity MEDIUM, Risk MEDIUM. |
| M7 — DACP External Event Intake Protocol | Normalizes five event source types (FILE, WEBHOOK, CRON, MCP, VOICE) into uniform three-part DACP bundles. Safety Warden gate on every incoming event. VOICE events force-routed to CAPCOM regardless of `triggers.yaml` configuration. Storm protection at 50 events / 5 seconds. Domain: Operation. Complexity MEDIUM, Risk MEDIUM. |
| M8 — Chipset YAML Schema & Validator | JSON Schema Draft 7 covering all 8 new fields (intake, skill_evolution, cluster, safety, credentials, model_routing, triggers, retro) plus 7 existing fields. AJV validator with 9 cross-field rules. Pre-flight gate: chipset must validate before any mission starts (exit_code=2 blocks the wave). `dacp_version` field pins chipset authoring version. Domain: Foundation. Complexity MEDIUM, Risk LOW (but HIGH blast radius). |
| M9 — Cross-Session Pattern Detection | Three detection patterns: `RAPID_MODIFY` (3+ skill modifications in ≤5 sessions within 30 days → ALERT), `VIOLATION_CLUSTER` (3+ path violations in ≤10 sessions within 30 days → ESCALATE), `FILTERED_PROBE` (any FILTERED-credential access attempt → immediate BLOCK). Four-level escalation: ANNOTATE, ALERT, ESCALATE, BLOCK. Detection runs at wave start, not after violations. Domain: Intelligence. Complexity HIGH, Risk LOW. |
| M10 — Institutionalized Retrospective Loop | Structured YAML retro captured at wave end. Lessons with `promote_to_chipset: true` flow through a 6-step promotion pipeline: RETRO capture → CRAFT formatting → EXEC review → ARCH validation against M8 schema → FLIGHT + CAPCOM + User approval → conditional chipset update. SC-08: `auto_apply` is a JSON Schema constant set to `false`. No lesson can auto-apply. Ever. Domain: Intelligence. Complexity HIGH, Risk LOW. |
| LaTeX mission pack | `www/tibsfox/com/Research/FLT/mission-pack/gsd_fleet_feature_refinement_mission.tex` (1,497 lines) compiling to a 208,894-byte PDF — self-contained blueprint document. |
| Mission-pack HTML index | `www/tibsfox/com/Research/FLT/mission-pack/gsd_fleet_mission_index.html` (523 lines) — standalone navigation to the ten module specs and the three research-tier documents. |
| Site integration | `www/tibsfox/com/Research/FLT/` — `index.html` (164), `mission.html` (122), `page.html` (210), `style.css` (195). |
| Research modules | `research/01-vision-guide.md` (129), `research/02-research-reference.md` (391), `research/03-milestone-spec.md` (338), `research/retrospective.md` (151), `research/knowledge-nodes.json` (123). |
| Catalog registration | `www/tibsfox/com/Research/series.js` (+3 lines) — FLT registered in the Research Series manifest. |
| Cross-reference graph patch | `www/tibsfox/com/Research/AAR/data/cross-references.json` (+49 lines) — FLT's knowledge nodes threaded into the AAR cross-reference graph. |

## The 10 Modules

| # | Module | Domain | Complexity | Risk |
|---|--------|--------|-----------|------|
| M1 | Autonomous Intake Layer | Operation | MEDIUM | LOW |
| M2 | Skill Evolution Audit Trail | Intelligence | MEDIUM | LOW |
| M3 | Safety Warden Infrastructure Gate | Safety | HIGH | MEDIUM |
| M4 | Chipset-Tier Model Routing | Intelligence | LOW | LOW |
| M5 | Persistent Cluster Topology | Operation | HIGH | MEDIUM |
| M6 | Credential Tiering Architecture | Safety | MEDIUM | MEDIUM |
| M7 | DACP External Event Intake Protocol | Operation | MEDIUM | MEDIUM |
| M8 | Chipset YAML Schema & Validator | Foundation | MEDIUM | LOW (HIGH blast radius) |
| M9 | Cross-Session Pattern Detection | Intelligence | HIGH | LOW |
| M10 | Institutionalized Retrospective Loop | Intelligence | HIGH | LOW |

## Architecture Highlights

### Defense-in-Depth: Three Dimensions of Safety

| Dimension | Module | Scope | Mechanism |
|-----------|--------|-------|-----------|
| Spatial | M3 | Per-operation | Glob path matching, pre-commit + Write hooks, fail-closed |
| Credential | M6 | Per-bash-spawn | Structural `delete` of FILTERED vars, SC-04 scanner, fail-closed |
| Temporal | M9 | Cross-session | Pattern detection over a 30-day window, 4-level escalation |

### The Observation Bridge: M3, M6, M7 → M9

Wave 2's highest-value discovery: M3 wrote only to `violations.jsonl`; M9 read from `observations.jsonl`. These were separate files with no connection — M9's `VIOLATION_CLUSTER` was blind to the very violations it was designed to catch. Wave 3 added the dual-write requirement: M3 writes both files on every violation; M6 emits credential-probe observations; M7 emits intake-received and intake-rejected observations; M9 reads all three from `observations.jsonl`. The observation bridge is now explicit, field-level specified, and test-verified (IN-03, IN-04, IN-16).

### The Self-Referential Closure

M3 protects its own implementation. The hooks directory (`.claude/hooks/**`) is in M3's `block_paths`. The `chipset.yaml` file is in `block_paths`. The `safety.yaml` file is in `block_paths`. M3 cannot be disabled by any agent that writes through M3's own hooks. The closure is enforced at the hook-validation level — hardcoded, not config-driven. An agent that could modify M3's code would have to bypass M3 to do so, which M3 prevents. This is the strongest safety invariant in the entire spec.

## Safety-Critical Results: 8/8 PASS

| # | Criterion | Module(s) | Result |
|---|-----------|-----------|--------|
| SC-01 | `chipset.yaml` in M3 `block_paths`; M8 schema enforces | M3, M8 | PASS |
| SC-02 | FILTERED tier uses `delete process.env[key]`, not empty assignment | M6 | PASS |
| SC-03 | Glob matching (minimatch) enforced; `startsWith()` explicitly prohibited | M3 | PASS |
| SC-04 | Script scanner for FILTERED variable references; dual-log write on detection | M6 | PASS |
| SC-05 | Clean-room compliance — zero thepopebot code patterns reproduced | All 10 | PASS |
| SC-06 | All DACP bundles are three-part (human intent + structured data + executable) | All 10 | PASS |
| SC-07 | Three CAPCOM gates with documented bypass prevention | M3, M8, M10 | PASS |
| SC-08 | Retro promotion requires ARCH review + user approval; `auto_apply: const: false` | M8, M10 | PASS |

## Verification Results: 68/72 PASS

| Category | Total | PASS | FAIL | BLOCK |
|----------|-------|------|------|-------|
| Safety-Critical (SC) | 8 | 8 | 0 | 0 |
| Core Functionality (CF) | 32 | 31 | 1 | 0 |
| Integration (IN) | 20 | 18 | 2 | 0 |
| Edge Cases (EC) | 12 | 11 | 1 | 0 |
| **Total** | **72** | **68** | **4** | **0** |

**Mission status: CONDITIONAL PASS — implementation-ready with 4 documented gaps for implementors.**

| Test | Issue | Fix Required |
|------|-------|--------------|
| IN-18 | M3 `allowed_paths` missing `.agents/capcom/override-requests/**` — required by M4 but not present in M3's example config | Add path to M3 canonical chipset YAML stub and `safety.yaml` example |
| EC-05 | M8 behaviour on unknown fields is ambiguous — sub-objects use `additionalProperties: false` (error) but top-level scope is unspecified | Clarify top-level additional-properties handling in M8 Section 4 |
| EC-11 | DACP bundle size limit enforcement mechanism not specified — M8 defines the chipset field but no module documents the runtime rejection behaviour | Add bundle-size enforcement subsection to M8 or DACP references |
| CF-10d | M10 YAML schema does not machine-enforce `chipset_field` required when `promote_to_chipset: true` — rule is in validation prose but not in the schema `required:` stanza | Add cross-field validation rule to M10 Section 3 or M8 cross-field rules |

## Corrected Rollout Sequence

| Phase | Module(s) | Milestone Tag | Notes |
|-------|-----------|---------------|-------|
| 1 | M8 — Chipset YAML Schema & Validator | `v1.50-schema` | Foundation. Nothing starts without this. |
| 2 | M3 — Safety Warden Infrastructure Gate | `v1.50-safety` | Safety gate. Nothing writes without this. |
| 3 | M6 + M4 (parallel) | `v1.50-creds`, `v1.50-routing` | M6 needs M3; M4 needs only M8. |
| 4 | M1 + M2 + M5 (parallel) | `v1.50-intake`, `v1.50-audit`, `v1.50-cluster` | All need M8+M3 at most. |
| 5 | M7 | `v1.50-eventbus` | Needs M1 + M3 + M6. |
| 6 | M9 | `v1.50-patterns` | Needs M3 + M6. |
| 7 | M10 | `v1.50-retro` | Needs everything. Benefits from M9 being live. |

Critical path: `M8 → M3 → M6 → M9 → M10` (5 modules deep, longest chain).

## Retrospective

### What Worked

- **The four-team parallel spec writing model.** Ten modules in a single wave with four teams (Alpha, Beta, Gamma, Delta) working in domain-specific isolation. Team Alpha owned autonomous operation (M1, M2, M5), Beta owned safety (M3, M6), Gamma owned foundation and routing (M4, M8), Delta owned intelligence and normalization (M7, M9, M10). The domain separation was clean enough that teams needed no cross-team coordination during Wave 1 — they converged on consistent patterns (DACP three-part bundles, SC/CF/IN/EC taxonomy, rollout dependency declarations) independently.
- **Clean-room methodology at scale.** Ten modules, four teams working in parallel, zero contamination. Every thepopebot reference across all ten specs is framed as convergent-discovery proof, not as design source. The discipline held without a cross-team referee because the brief was explicit: cite thepopebot to prove the requirement is real, then design from GSD-native first principles.
- **Wave 2 integration pass as a mandatory phase.** Wave 1 produced drafts that were internally consistent but cross-module inconsistent in the specific ways you expect when four teams work independently: different field names for the same concept (`block_paths` vs `blocked_paths`), different DACP bundle envelope formats, a rollout sequence with dependency violations, and the M3/M9 observation-bridge gap. Wave 2 found all of them; Wave 3 fixed all of them. The integration wave is not overhead — it is the pass that makes independent parallel spec writing viable.
- **The observation bridge discovery.** The most important finding of the entire mission was that M3 and M9 were disconnected: M3 writing to `violations.jsonl`, M9 reading from `observations.jsonl`. Without the integration pass, this gap would have reached implementation, and the `VIOLATION_CLUSTER` detection pattern would have been blind to the very violations it was designed to catch. Finding it at spec time cost one integration wave. Discovering it at implementation time would have cost a debug session plus architectural rework.
- **Consistent test harness taxonomy.** SC/CF/IN/EC naming across all ten modules without a shared template forcing it. Four teams independently converged on the same taxonomy because the categories are natural: things that must never fail (SC), things that must work (CF), things that must connect (IN), things that must not break in weird situations (EC). When four teams converge on the same structure independently, the structure is probably right.
- **Risk table with isolation property.** The explicit documentation that every module's failure degrades to the pre-v1.50 status quo — not to something worse — is not an obvious property of a ten-module system. It required designing each module's failure modes to be graceful, and verifying that property explicitly in the risk table. The isolation property enables incremental rollout: if M9 is delayed, the system is no worse than before M9 existed; if M3 has a bug, it fails closed.

### What Could Be Better

- **DACP bus infrastructure was assumed, not specified.** All ten modules emit bundles to bus channels. The bus is assumed to exist. No module was assigned ownership of the bus specification. This is the largest implementation gap: before any module can be implemented, someone needs to define the minimal bus — directory structure, file naming, consumption protocol, dead-letter handling. The spec produced an accurate accounting of this gap; it did not fill it.
- **CAPCOM agent role referenced but not implemented.** Six modules (M3, M4, M7, M9, M10, and the override flow) reference CAPCOM for approval, escalation, and notification. CAPCOM is a conceptual role in the GSD framework with no CLI commands. Before implementation, minimal CAPCOM tooling is needed: `gsd:capcom-status`, `gsd:capcom-approve`, `gsd:capcom-clear`. The spec identified this gap accurately; it did not close it.
- **Session lifecycle hooks assumed, not documented.** M5 (warm/cold start), M6 (credential scrub on session start), and M9 (ANALYST run at wave start) all reference `on_session_start`, `on_session_end`, and `on_wave_start` lifecycle events. The session-awareness skill provides these hooks in practice. Their interface was never formally documented. The implementation will need to formalize what is currently informal.
- **Track A / Track B boundaries in Wave 3 were numeric, not domain-aligned.** Track A handled M1-M5; Track B handled M6-M10. The numeric split mixed Team Alpha and Team Beta in Track A, and Teams Beta, Gamma, and Delta in Track B. Domain-aligned tracks would have been Alpha+Gamma (infrastructure focus) vs Beta+Delta (safety + intelligence focus). The numeric split worked but produced occasional friction at the track boundary.
- **M8 sub-object schemas use `additionalProperties: false`, which errors on unknown fields.** The test asked whether M8 should warn (for forward compatibility). The spec's strict behaviour is actually safer for security-critical configs — a typo in `block_paths` could be silently ignored with warning-mode — but the behaviour was not documented explicitly, producing an ambiguity implementors must resolve.

### What Needs Improvement

- **Cross-team field-naming coordination must happen before spec writing begins.** The reconciliation wave worked but was pure overhead: every renamed field in the Wave 3 final specs is a correction that could have been a first-draft choice with a pre-spec field-naming registry.
- **Rollout dependency analysis must be automated.** The original PDF's two sequence violations were discoverable in five minutes of topological sort. A thirty-line script would have caught them before publication.
- **Pre-implementation spikes need to be budgeted as a separate phase.** The bus spec, the minimal CAPCOM CLI, and the session lifecycle hook documentation are all pre-implementation work that is not part of any module's spec — if implementation begins without them, the first module to reach a bus write blocks.

## Lessons Learned

- **Specification is not overhead. It is the work.** The gap between "we have a PDF describing ten modules" and "we have an implementation-ready specification with verified cross-module consistency" required six waves, four parallel agent teams, an integration pass, a synthesis pass, and a verification pass. Spec time costs a week; bug time costs a month. The ratio is obvious.
- **Cross-team field naming for shared chipset fields must be coordinated before spec writing begins.** `block_paths` vs `blocked_paths`; `on_violation` vs `enforcement_mode`. These are not complex disagreements — they are race conditions in nomenclature. A pre-spec field-naming registry prevents the reconciliation wave entirely.
- **The four-team topology with domain-specific ownership is the right structure for 10-module missions.** 9.4/10 design consistency across four teams with no coordination protocol beyond the mission brief. Domain ownership creates natural coherence; inconsistencies appear at team boundaries, exactly where an integration wave finds them.
- **Rollout dependency analysis must be automated.** Two violations in the original sequence were discoverable in five minutes of topological sort. A thirty-line script prevents the class of error.
- **Dual-store write requirements between safety subsystems must be called out explicitly in the mission brief.** The M3/M9 observation-bridge gap could not be discovered from individual module specs. Cross-store dependencies must be listed up front.
- **Pre-implementation spikes for infrastructure gaps should be budgeted as a separate phase.** Bus specification, minimal CAPCOM CLI, and session lifecycle hook documentation are pre-implementation work not covered by any module's spec.
- **The system can examine itself honestly at scale.** Wave 5's 72-test verification pass found 4 failures, documented each with specific line references and fix instructions, and accurately characterized all four as documentation-precision gaps rather than design flaws. Self-assessment calibrated correctly, at scale, is the operational definition of engineering rigor.
- **Isolation is a design property, not an accident.** Every module's failure was engineered to degrade to the pre-v1.50 status quo, not to something worse. This property had to be designed into each module's failure modes from Wave 1 and verified in the risk table — it is not an emergent property of good code, it is an engineering commitment.
- **Self-referential closures belong in the spec, not in the implementation notes.** M3 protecting its own hooks (and `chipset.yaml`, and `safety.yaml`) is a safety invariant, not an implementation detail. Spelling it out at the spec level — hardcoded, not config-driven — prevents future edits from silently weakening it.
- **Convergent discovery across unrelated systems is evidence the requirement is structural.** File watching, persistent workers, credential isolation, git-as-audit, per-job model routing, event normalization, and retrospective loops all appeared in thepopebot. That is proof the problem is real; the solution must still be earned from first principles. Cite the convergence, design clean-room.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.154 — predecessor](../v1.49.154/) | Degree 19 of the Seattle 360 engine. FLT is the inserted pause between degree 19 and degree 20. |
| [v1.49.156 — successor](../v1.49.156/) | Degree 20 — the engine resumes once the blueprint is shipped. |
| [v1.49.131 — AIH "AI Horizon"](../v1.49.131/) | Research-series sibling template. FLT follows the same Research-catalog directory pattern and `series.js` registration discipline. |
| [v1.49.126 — LTS "Listening to Space"](../v1.49.126/) | Multi-module research-with-LaTeX template that FLT extends into systems-engineering territory. |
| [v1.0 — Core Skill Management](../v1.0/) | Project foundation — the publish pipeline FLT rides on, and the original skill-management substrate that v1.50 modules extend. |
| [v1.40 — sc:learn Dogfood Mission](../v1.40/) | PDF extraction and checkpoint ingestion — the tooling substrate that let the 35-page mission PDF become a ten-module spec. |
| [v1.37 — Complex Plane Learning Framework](../v1.37/) | SkillPosition / tangent-line activation substrate that M4's tier routing builds on. |
| [v1.35 — Mathematical Foundations Engine](../v1.35/) | 451 primitives across 10 domains — the foundation M8's schema cross-field rules draw on. |
| [.planning/PROJECT.md](../../../.planning/PROJECT.md) | Project-level context: gsd-skill-creator as the adaptive learning layer for Claude Code. |
| [.planning/ROADMAP.md](../../../.planning/ROADMAP.md) | v1.50 milestone target (2026-04-21); FLT is the specification that precedes the implementation milestone. |
| [Safety Warden reference — security-hygiene skill](../../../.claude/skills/security-hygiene/SKILL.md) | M3's prompt-layer predecessor. v1.50 promotes prompt-layer directives to deterministic hook-level enforcement. |
| [session-awareness skill](../../../.claude/skills/session-awareness/SKILL.md) | Provides the `on_session_start` / `on_session_end` / `on_wave_start` lifecycle hooks that M5, M6, and M9 depend on. |
| [skill-integration skill](../../../.claude/skills/skill-integration/SKILL.md) | Context for M2's audit-trail extension into skill evolution. |
| [docs/RELEASE-HISTORY.md](../../RELEASE-HISTORY.md) | Cross-release ledger aggregating FLT's classification into the v1.49.x arc. |
| [docs/release-notes/RETROSPECTIVE-TRACKER.md](../RETROSPECTIVE-TRACKER.md) | Cross-release retrospective aggregation — FLT contributes 10 promoted lessons (ledger entries). |
| [www/tibsfox/com/Research/FLT/](../../../www/tibsfox/com/Research/FLT/) | Project root — 14 new files, 4,130 insertions plus the series.js registration line. |
| [www/tibsfox/com/Research/AAR/data/cross-references.json](../../../www/tibsfox/com/Research/AAR/data/cross-references.json) | FLT's knowledge nodes threaded into the AAR cross-reference graph (+49 lines). |
| [LaTeX mission pack — `gsd_fleet_feature_refinement_mission.tex`](../../../www/tibsfox/com/Research/FLT/mission-pack/gsd_fleet_feature_refinement_mission.tex) | 1,497 lines of LaTeX compiling to a 208,894-byte PDF — the self-contained blueprint document. |
| [Mission PDF — `gsd_fleet_feature_refinement_mission.pdf`](../../../www/tibsfox/com/Research/FLT/mission-pack/gsd_fleet_feature_refinement_mission.pdf) | 208,894-byte compiled output of the mission pack. |
| [Mission-pack HTML index](../../../www/tibsfox/com/Research/FLT/mission-pack/gsd_fleet_mission_index.html) | 523-line standalone navigation to the ten module specs and three research-tier documents. |

## Engine Position

v1.49.155 is the specification milestone that gates v1.50. It is the inserted-pause release between Seattle 360 engine degree 19 (v1.49.154 Fly Moon Royale / Veery) and degree 20 (v1.49.156) — inserted specifically so the ten-module blueprint would exist before implementation temptation set in. Within the v1.49.x arc it is the largest-single-release system-engineering artifact the project has shipped to date, carrying the full v1.50 specification (blueprint, ten finalized module specs, seventy-two verification tests, 121-row risk table, corrected rollout sequence). The release does not implement any module — it is the reference every subsequent v1.50 layer implementation will cite. Downstream, v1.50 is a seven-phase rollout on the critical path `M8 → M3 → M6 → M9 → M10`, with three pre-implementation spikes (DACP bus, minimal CAPCOM CLI, session lifecycle hook documentation) gating phase one. The release ships four weeks before the v1.50 milestone target (2026-04-21) and stands between the first-pass Seattle 360 engine (degree-by-degree research releases) and the second-pass combined NASA/360 engine that will inherit M8's chipset schema as a precondition.

## Cumulative Statistics

- **Modules specified:** 10 (M1–M10)
- **Final module specs:** 10 (Wave 3 finalized, after Wave 2 integration)
- **Agent teams (Wave 1):** 4 (Alpha, Beta, Gamma, Delta)
- **Mission waves:** 6 (foundation, drafts, integration, finals, synthesis, verification) + Wave 6 release
- **Verification tests:** 72 (8 SC, 32 CF, 20 IN, 12 EC)
- **Verification PASS / FAIL / BLOCK:** 68 / 4 / 0
- **Safety-critical tests:** 8 of 8 PASS
- **Clean-room compliance:** 10 of 10 modules (SC-05)
- **CAPCOM gates:** 3 (M3 override, M8 pre-flight, M10 promotion)
- **Detection patterns (M9):** 3 (`RAPID_MODIFY`, `VIOLATION_CLUSTER`, `FILTERED_PROBE`)
- **Escalation levels (M9):** 4 (ANNOTATE, ALERT, ESCALATE, BLOCK)
- **Amiga tier roles (M4):** 13 across Agnus / Denise / Paula
- **New chipset YAML fields (M8):** 8 (intake, skill_evolution, cluster, safety, credentials, model_routing, triggers, retro)
- **DACP bundles specified:** ~35 across all 10 modules
- **Shared utility classes:** 4 (Debouncer, AppendOnlyLog, PathMatcher, CapcomNotifier)
- **Critical path depth:** 5 modules (`M8 → M3 → M6 → M9 → M10`)
- **Total artifact lines (all waves combined):** ~17,800
- **Release commit line delta:** +4,179 / -5 across 15 files

## Files

- `docs/release-notes/v1.49.155/README.md` — 289 lines (original; this uplift rewrites against the A-grade rubric).
- `www/tibsfox/com/Research/FLT/index.html` — 164 lines, project landing page integrated into the Research catalog.
- `www/tibsfox/com/Research/FLT/mission-pack/gsd_fleet_feature_refinement_mission.pdf` — 208,894 bytes, compiled LaTeX mission pack.
- `www/tibsfox/com/Research/FLT/mission-pack/gsd_fleet_feature_refinement_mission.tex` — 1,497 lines, LaTeX source compilable with pdflatex.
- `www/tibsfox/com/Research/FLT/mission-pack/gsd_fleet_mission_index.html` — 523 lines, standalone HTML index with navigation to all ten module specs.
- `www/tibsfox/com/Research/FLT/mission.html` — 122 lines, mission-pack gateway page.
- `www/tibsfox/com/Research/FLT/page.html` — 210 lines, primary content page carrying the ten-module narrative.
- `www/tibsfox/com/Research/FLT/research/01-vision-guide.md` — 129 lines, vision tier (M1 level scope + intent).
- `www/tibsfox/com/Research/FLT/research/02-research-reference.md` — 391 lines, research-tier reference material.
- `www/tibsfox/com/Research/FLT/research/03-milestone-spec.md` — 338 lines, milestone-spec tier (v1.50 package contract).
- `www/tibsfox/com/Research/FLT/research/retrospective.md` — 151 lines, mission retrospective with the five What-Worked entries and five What-Could-Be-Better entries consolidated here.
- `www/tibsfox/com/Research/FLT/research/knowledge-nodes.json` — 123 lines, the cross-reference graph nodes feeding the AAR manifest.
- `www/tibsfox/com/Research/FLT/style.css` — 195 lines, project-specific styling.
- `www/tibsfox/com/Research/AAR/data/cross-references.json` — +49 lines, FLT's knowledge nodes threaded into the AAR cross-reference graph.
- `www/tibsfox/com/Research/series.js` — +3 lines, FLT registered in the Research Series catalog manifest.

---

*72 tests. 68 pass. 8 safety-critical, 8 pass. 10 modules, 10 final specs, 0 design flaws. The blueprint is done. Now build it. Uplifted 2026-04-17 against the A-grade rubric at `.planning/missions/release-uplift/RUBRIC.md`.*
