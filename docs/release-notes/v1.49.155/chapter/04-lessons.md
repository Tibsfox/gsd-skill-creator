# Lessons — v1.49.155

12 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Specification is not overhead. It is the work.**
   The gap between "we have a PDF describing ten modules" and "we have an implementation-ready specification with verified cross-module consistency" required six waves, four parallel agent teams, an integration pass, a synthesis pass, and a verification pass. The end result — 68/72 passing, 8/8 safety-critical, zero design flaws — is only achievable because each wave addressed the gaps from the previous wave. Skipping to implementation from the original PDF would have produced code that looked correct at the module level and was broken at the system level. The observation bridge gap alone would have been a production debugging session. The rollout sequence violations would have required architectural rework. The field naming inconsistencies would have been discovered as integration bugs.…
   _⚙ Status: `investigate` · lesson #938_

2. **Cross-team field naming for shared chipset fields must be coordinated before spec writing begins.**
   `block_paths` vs `blocked_paths`. `on_violation` vs `enforcement_mode`. These are not complex disagreements — they are race conditions in nomenclature. When four teams independently design properties for overlapping fields in the same configuration file, they will name things differently. The fix is a pre-spec field naming registry, not a post-spec reconciliation wave. The reconciliation wave worked but was pure overhead: every renamed field in the Wave 3 final specs is a correction that could have been a first-draft choice.
   _🤖 Status: `investigate` · lesson #939 · needs review_
   > LLM reasoning: Candidate is a music degree entry with no visible field-naming registry or cross-team coordination artifact.

3. **The four-team topology with domain-specific ownership is the right structure for 10-module missions.**
   This mission ran to a 9.4/10 design consistency score across teams that had no coordination protocol beyond the mission brief. Domain ownership (Alpha/Operation, Beta/Safety, Gamma/Foundation+Routing, Delta/Intelligence) created natural coherence within each team's work. The inconsistencies were all at team boundaries — exactly where you expect them and where an integration wave finds them. The model scales.
   _🤖 Status: `investigate` · lesson #940 · needs review_
   > LLM reasoning: HEL mission snippet references the domain but doesn't itself validate or extend the four-team topology claim.

4. **Rollout dependency analysis must be automated.**
   The original sequence from the mission PDF had two violations discoverable in five minutes of topological sort. They were not found before publication because no one ran the sort. Before any future mission publishes a rollout sequence, the sequence should be validated by building a dependency graph from module specs and running topological analysis. This is a 30-line script, not a complex system.
   _🤖 Status: `investigate` · lesson #941 · needs review_
   > LLM reasoning: Candidate v1.49.195 mentions ecosystem/OOPS analysis but no evidence of automated topological sort for rollout sequences.

5. **Dual-store write requirements between safety subsystems must be called out explicitly in the mission brief.**
   The M3/M9 observation bridge gap could not be discovered from the individual module specs. M3's job was enforcement audit. M9's job was pattern analysis. Neither spec, read in isolation, appeared to have a gap. The gap was structural — it only appeared when you asked "how does M9 learn about M3 violations?" The answer ("it reads from the same file M3 writes to") was not in either spec. This category of cross-store dependency must be explicitly listed in the mission brief before teams begin writing specs.
   _🤖 Status: `investigate` · lesson #942 · needs review_
   > LLM reasoning: Candidate v1.49.232 about cross-pollinators is thematic wordplay, not evidence of mission brief structure change.

6. **Pre-implementation spikes for infrastructure gaps should be budgeted as a separate phase.**
   The bus specification, the minimal CAPCOM CLI, and the session lifecycle hook documentation are all pre-implementation work that is not part of any module's spec. If implementation begins without them, the first module to reach a bus write will block. The right structure is: specification mission (complete) → infrastructure spike phase (bus + CAPCOM + session hooks) → implementation. The spike phase is not part of this release. It is the next step before the first module ships code.
   _🤖 Status: `investigate` · lesson #943 · needs review_
   > LLM reasoning: HEL release is a research series on helium/semiconductors, not an infrastructure spike phase for bus/CAPCOM/hooks.

7. **The system can examine itself honestly at scale.**
   The Wave 5 verification pass ran 72 tests against 10 finalized specs, a 827-line blueprint, and a 121-row risk table. It found 4 failures, documented each with specific line references and fix instructions, and accurately characterized all four as documentation precision gaps rather than design flaws. None were minimized ("probably fine"), inflated ("blocking"), or omitted. Self-assessment at this level of precision — where the pass/fail judgment is calibrated correctly and the failure documentation is actionable — is the operational definition of engineering rigor.
---
   _🤖 Status: `investigate` · lesson #944 · needs review_
   > LLM reasoning: Ecosystem Alignment snippet doesn't clearly demonstrate continued self-assessment rigor at the specified scale.

8. **DACP bus infrastructure was assumed, not specified.**
   All ten modules emit bundles to bus channels. The bus is assumed to exist. No module was assigned ownership of the bus specification. This is the largest implementation gap: before any module can be implemented, someone needs to define the minimal bus — directory structure, file naming, consumption protocol, dead-letter handling. The spec produced an accurate accounting of this gap. It did not fill it.
   _🤖 Status: `investigate` · lesson #945 · needs review_
   > LLM reasoning: HEL candidate is a semiconductor research series, not a DACP bus specification filling the identified gap.

9. **CAPCOM agent role referenced but not implemented.**
   Six modules (M3, M4, M7, M9, M10, and the override flow) reference CAPCOM for approval, escalation, and notification. CAPCOM is a conceptual role in the GSD framework. It has no CLI commands. Before implementation, minimal CAPCOM tooling is needed: `gsd:capcom-status`, `gsd:capcom-approve`, `gsd:capcom-clear`. The spec identified this gap accurately. It did not close it.
   _⚙ Status: `investigate` · lesson #946_

10. **Session lifecycle hooks assumed, not documented.**
   M5 (warm/cold start), M6 (credential scrub on session start), and M9 (ANALYST run at wave start) all reference `on_session_start`, `on_session_end`, and `on_wave_start` lifecycle events. The session-awareness skill provides these hooks in practice. Their interface was never formally documented. The implementation will need to formalize what is currently informal.
   _⚙ Status: `investigate` · lesson #947_

11. **Track A/Track B boundaries in Wave 3 were numeric, not domain-aligned.**
   Track A handled M1-M5. Track B handled M6-M10. The numeric split mixed Team Alpha and Team Beta (different domains) in Track A, and Teams Beta, Gamma, and Delta in Track B. Domain-aligned tracks would have been Alpha+Gamma (modules with infrastructure focus) vs Beta+Delta (modules with safety and intelligence focus). The numeric split worked but produced occasional friction at the track boundary. Future missions should align track assignments with team domains.
   _⚙ Status: `investigate` · lesson #948_

12. **M8 sub-object schemas use `additionalProperties: false`, which errors on unknown fields.**
   The test asked whether M8 should warn on unknown fields (for forward compatibility). The spec's strict behavior (error) is actually the safer choice for security-critical configs — a typo in `block_paths` could be silently ignored with warning-mode. But the behavior was not documented explicitly, producing an ambiguity that implementors must resolve. Strict validation with a clear error message is the right answer; the spec just needs to say so.
---
   _⚙ Status: `investigate` · lesson #949_
