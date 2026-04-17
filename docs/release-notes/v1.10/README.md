# v1.10 — Security Hardening

**Released:** 2026-02-12
**Scope:** security hardening — 16 findings from comprehensive audit across 6 domains, no new user features
**Branch:** dev → main
**Tag:** v1.10 (2026-02-12T05:01:00-08:00) — "Security Hardening"
**Predecessor:** v1.9 — Ecosystem Alignment & Advanced Orchestration
**Successor:** v1.11 — GSD Integration Layer
**Classification:** hardening release — pure remediation, zero new user-visible features
**Phases:** 71–81 (11 phases) · **Plans:** 24 · **Requirements:** 39
**Stats:** 51 commits · 92 files · 12,278 LOC added
**Verification:** path traversal blocked at every store · YAML deserialization safe via Zod · JSONL entries SHA-256 checksummed · `npm audit --audit-level=high` wired into CI

## Summary

**v1.10 is the second "pause-and-audit" release in the project's history, after v1.8.1.** Where v1.8.1 ran a broad adversarial code-quality audit and caught 11 findings in 6 categories, v1.10 ran a focused security audit and caught 16 findings in 6 security domains. The scope difference is meaningful: v1.8.1 fixed tests, types, and structure; v1.10 fixed attack surfaces. Eleven phases, twenty-four plans, thirty-nine requirements, fifty-one commits, and twelve thousand lines of code later, the system that stepped off the v1.9 feature pipeline with orchestration and ecosystem alignment stepped back on at v1.11 with a threat model, a CI security gate, and defense-in-depth guards wired through every store, every deserializer, every inter-agent message, and every destructive operation. The release shipped no new user features — the release philosophy was discipline, and every one of the thirty-nine requirements hardens something that already existed.

**Path traversal prevention is defense-in-depth, not a single check.** v1.8.1 introduced `assertSafePath` as a shared helper and wired it into `SkillStore`, `AgentGenerator`, and `TeamStore` — the three stores that existed at that time. v1.10 added a second layer: `validateSafeName` catches malformed names before they reach path construction, and `assertSafePath` catches malformed paths before they reach the filesystem. Names and paths are checked at different layers so that bypassing one does not bypass the other. New stores landing after v1.10 inherit the pattern by convention; the README now documents the requirement and SECURITY.md makes it normative.

**YAML safe deserialization rejecting dangerous tags with Zod schema validation closes an often-overlooked class of attack.** Skill frontmatter is YAML. A malicious skill file with `!!js/function` or similar exotic tags could execute arbitrary code on load under a naive parser. v1.10 wired safe-mode YAML deserialization at every read site and followed it with Zod schema validation so that even a structurally valid but semantically unexpected document is rejected before any field is trusted. Schema-first parsing means the shape of the data is the gate, not a downstream validator that an attacker might route around.

**JSONL integrity added SHA-256 checksums on top of the v1.0 append-only primitive.** The pattern store's append-only JSONL, shipped at v1.0, gave audit trail and crash recovery for free. v1.10 adds tamper detection: every appended record carries a SHA-256 of its content, and scans can now verify that nothing has been mutated after the fact. Combined with schema validation, rate limiting, anomaly detection, periodic compaction, and the new `skill-creator purge` CLI, the pattern store becomes a lightweight audit log that an operator can inspect, compact, and verify on demand. The `purge` command (new in this release) is a 176-line CLI with JSON output, dry-run mode, configurable retention, and per-file reporting — the kind of operational tool that signals the pattern store is now treated as production data.

**Learning safety emerged as a distinct security domain in this release.** Traditional security protects the system from external threats: inputs, files, network, deserialization. Learning safety protects the system from itself — from accumulating contradictory feedback, drifting beyond recognition over many small refinements, or being manipulated by a long tail of coordinated corrections. The 20% per-refinement bound from v1.0 is a per-step limit; it does not prevent the aggregate effect of many compliant steps. v1.10 added a cumulative drift tracker with a 60% threshold, a contradictory-feedback detector that flags conflicts at capture time, and the `skill-creator audit <skill>` command that shows a diff between a skill's original state and its current state. Framing learning safety as a first-class domain alongside input validation and access control is the conceptual contribution of this release — the code is the embodiment, the framing is the work.

**Prompt injection defense shipped at the team message boundary.** Messages from one agent become prompts for another. If message content is trusted, an attacker (or a compromised skill) can inject instructions by sending a team message. v1.10 added sanitization against thirteen prompt-injection patterns on all inter-agent messages. The team boundary is the security boundary: no message leaves one agent and enters another without passing through the sanitizer. Thirteen patterns is not the final answer; it is the first pass, and like any blocklist it will grow as new patterns are discovered.

**Operational safety rounded out the release with guards on destructive operations and graceful degradation.** Hook error boundaries mean a broken hook logs and continues rather than crashing the session — a principle of operational robustness that the v1.5 and v1.7 hook work did not enforce. Orchestrator confirmation gates force an explicit acknowledgment before destructive operations. Classification audit logging records how skills were categorized so that mis-classifications can be investigated. A 197-line `SECURITY.md` documents the threat model, vulnerability reporting procedure, and in-scope versus out-of-scope concerns. A three-job GitHub Actions workflow runs `npm audit --audit-level=high`, build, and test on push to main or dev and on pull requests to main — the first enforced security gate in the CI pipeline.

**The eleven-phase span (71–81) represents the longest continuous hardening track in the project to date.** That it took eleven phases to address sixteen findings is itself a finding: many of these protections (path traversal, YAML deserialization safety, prompt injection patterns, drift tracking) should have been designed in earlier, not retrofitted after nine feature versions. The silver lining is that the retrofit is now complete, the threat model is explicit, and every subsequent release inherits the hardened substrate. v1.25's ecosystem integration, v1.33's OpenStack cloud platform work, v1.38's SSH agent sandbox, and the memory arena work on artemis-ii all build on the v1.10 baseline.

## Key Features

| Area | What Shipped |
|------|--------------|
| Input validation (Phases 71–72) | `validateSafeName` + `assertSafePath` wired into every store; path traversal blocked at both the name-construction and path-use layers |
| Input validation (Phases 71–72) | YAML safe deserialization rejecting dangerous tags (`!!js/function`, etc.) with Zod schema validation at all frontmatter read sites |
| Data integrity (Phase 73) | SHA-256 checksums on JSONL entries + schema validation + rate limiting + anomaly detection + periodic compaction |
| Data integrity (Phase 73) | `skill-creator purge` CLI command (`src/cli/commands/purge.ts`, 176 lines) with `--dry-run`, `--max-age`, `--patterns-dir`, JSON output |
| Information security (Phase 74) | Secret redaction for API keys, tokens, passwords; project allowlist/blocklist for cross-project scanning; structural-only results |
| Information security (Phase 74) | Dangerous bash command deny list (recursive deletes, sudo, piped downloads) and discovery `--dry-run` + `--allow` flags |
| Learning safety (Phase 75) | Cumulative drift tracking with 60% threshold (complements v1.0's per-refinement 20% limit) |
| Learning safety (Phase 75) | Contradictory feedback detection and flagging; `skill-creator audit <skill>` diff between original and current state |
| Access control (Phases 76–79) | Team message sanitization against 13 prompt injection patterns; config range validation with security-aware field registry |
| Access control (Phases 76–79) | Inheritance chain validation (depth limits, circular dependency detection); file integrity monitoring; audit logging; concurrency locks; operation cooldowns |
| Operational safety (Phases 80–81) | Hook error boundaries (broken hooks log and continue, do not crash sessions); orchestrator confirmation gates for destructive operations |
| Operational safety (Phases 80–81) | Classification audit logging; `SECURITY.md` threat model (197 lines, 6 domains); GitHub Actions CI with `npm audit --audit-level=high`, build, test |

## Retrospective

### What Worked

- **Sixteen findings across six security domains is a thorough audit scope.** Input validation, data integrity, information security, learning safety, access control, and operational safety cover the full attack surface of an adaptive learning system. No domain was handwaved; each got its own phase or phases with explicit requirements.
- **No new user features — every change hardens existing code.** This discipline is rare and valuable. The temptation to sneak in features during a security release is strong; resisting it kept v1.10 focused, auditable, and reviewable as a pure hardening track.
- **Cumulative drift tracking with 60% threshold prevents gradual skill corruption.** Individual 20% refinements (from v1.0) compound over time; drift tracking catches the aggregate effect that per-refinement limits cannot detect. Naming learning safety as a distinct domain was the conceptual breakthrough.
- **Hook error boundaries degrade gracefully.** A broken hook should log and continue, not terminate the user's session. Making this explicit in operational safety reflects the philosophy that the system should fail in a way the user can still work through.
- **Shipping `SECURITY.md` and CI security gate together means the threat model has teeth.** A threat model without enforcement is documentation theater; a CI check without a threat model is a box-check. Shipping both forces alignment between what we claim to defend against and what we actually gate on.

### What Could Be Better

- **Eleven phases for security hardening suggests security wasn't deeply integrated during v1.0–v1.9.** A dedicated security release is necessary, but many of these protections (path traversal, YAML deserialization safety, prompt injection patterns) should have been in place earlier. v1.8.1's audit caught three of them (path traversal in particular) but not all.
- **The dangerous bash command deny list is inherently incomplete.** Listing specific commands (recursive deletes, sudo, piped downloads) is a blocklist approach — new dangerous patterns will need to be added as they are discovered. A capability-based allowlist would be stronger but requires more design work.
- **Thirteen prompt-injection patterns is a starting point, not a final answer.** Injection patterns evolve with model capabilities and attacker creativity. v1.10 landed the boundary and the infrastructure; the pattern set itself will need to grow with observed traffic.
- **The audit checkpoint cadence is still ad hoc.** v1.8.1 was the first audit pause; v1.10 was the second, and there was no formal trigger between them. Security reviews should run at defined release boundaries, not when a backlog forces the issue.

## Lessons Learned

1. **Learning safety is a distinct security domain.** Traditional security (input validation, access control) protects the system from external threats. Learning safety protects the system from itself — from accumulating contradictory feedback or drifting beyond recognition through compliant but cumulative edits. The 20% per-refinement bound does not prevent this; the drift tracker does.
2. **Prompt injection defense must be applied at the team message boundary.** Inter-agent communication is an injection vector because messages from one agent become prompts for another. Sanitizing at the boundary is correct; sanitizing at the prompt assembly point is too late.
3. **SHA-256 checksums on JSONL entries give tamper detection for free.** The append-only pattern from v1.0 provides ordering; checksums from v1.10 provide integrity. Together they form a lightweight audit log that an operator can verify without a database.
4. **Defense-in-depth means checking at two layers, not one.** `validateSafeName` catches bad inputs at name construction; `assertSafePath` catches bad paths at filesystem use. Both exist because bypassing one does not bypass the other — a single helper is a single point of failure.
5. **Safe-mode YAML with schema validation closes an often-overlooked attack class.** Skill frontmatter is user-provided data; naive YAML parsers execute tagged constructors. Schema-first parsing rejects unknown shapes before any field is trusted.
6. **Security features should ship with operational tooling.** The `purge` CLI isn't just a hardening feature — it's the operator's interface to the hardened pattern store. Hardening without an inspection tool means nobody can verify that the hardening worked.
7. **`SECURITY.md` and a CI gate belong together.** A threat model without enforcement is theater; a CI check without a threat model is a box-check. Both are cheap; shipping both forces the claim and the check to align.
8. **An eleven-phase remediation is evidence that security must be designed in, not retrofitted.** The cost of retrofitting (eleven phases, twelve thousand lines) is far higher than the cost of shipping hardening alongside feature work. Every subsequent milestone should include security requirements in its own phase plan, not defer them to a future audit.
9. **Audit cadence should be scheduled, not reactive.** v1.8.1 and v1.10 were both pause-and-audit releases triggered by accumulated debt. Future milestones should schedule audit checkpoints at natural boundaries so the cost stays small and incremental.
10. **A hardening release is an acceptable release.** Shipping no user features for an entire version is not a failure mode — it is a signal that the team took security seriously enough to dedicate a release to it. The discipline to not smuggle features into a security release is as important as the hardening itself.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Root cause for some findings (append-only JSONL without checksums, missing paths.ts); substrate that v1.10 hardens |
| [v1.1](../v1.1/) | Semantic conflict detection — inheritance-chain validation in v1.10 extends the conflict detector |
| [v1.5](../v1.5/) | Pattern discovery — the pattern store hardened here was shaped by v1.5's work |
| [v1.7](../v1.7/) | GSD Master Orchestration Agent — orchestrator confirmation gates in v1.10 apply directly to v1.7's agent |
| [v1.8](../v1.8/) | Predecessor of v1.8.1; v1.8 introduced capability-aware planning whose boundary is hardened here |
| [v1.8.1](../v1.8.1/) | First audit checkpoint — caught 11 findings including path-traversal in 3 stores; v1.10 extends that pattern across all boundaries |
| [v1.9](../v1.9/) | Predecessor — ecosystem alignment & advanced orchestration; v1.10 hardens the surface v1.9 expanded |
| [v1.11](../v1.11/) | Successor — GSD integration layer built on hardened substrate |
| [v1.24](../v1.24/) | GSD Conformance Audit — direct descendant of v1.10's hardening discipline, cited as application in the lessons tracker |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG built over the v1.10 security substrate |
| [v1.38](../v1.38/) | SSH Agent Security — OS-level sandbox work that extends v1.10's threat model into process isolation |
| `SECURITY.md` | Canonical threat model, vulnerability reporting, 6-domain coverage — shipped in this release |
| `.github/workflows/ci.yml` | Three-job CI pipeline (audit/build/test) — first enforced security gate |
| `src/cli/commands/purge.ts` | Operator tool for hardened pattern store — new in this release |
| `.planning/MILESTONES.md` | Full v1.10 phase-by-phase detail |

## Engine Position

v1.10 is the project's first dedicated security release and the second pause-and-audit checkpoint after v1.8.1. Where v1.8.1 ran an adversarial code-quality audit and remediated eleven findings, v1.10 ran a focused security audit and remediated sixteen. Together the two audits establish the pause-and-audit cadence that the project has relied on ever since. The v1.10 substrate is load-bearing for every subsequent milestone: v1.11's GSD integration layer assumes safe deserialization, v1.24's conformance audit extends the hardening discipline, v1.25's 20-node ecosystem DAG runs over the sanitized team message boundary, v1.38's SSH agent sandbox builds process isolation on top of v1.10's threat model, and the artemis-ii memory arena work inherits the JSONL integrity model for its pattern journaling. Every version after v1.10 ships with the assumption that input is validated, YAML is safe, pattern journals are checksummed, drift is tracked, messages are sanitized, and the CI gate will refuse high-severity dependency findings. That assumption is the lasting contribution of this release.

## Files

- `SECURITY.md` — 197-line threat model, 6-domain coverage, vulnerability reporting procedure (new in this release)
- `.github/workflows/ci.yml` — 42-line three-job CI (security audit, build, test); first enforced security gate
- `src/cli/commands/purge.ts` + `src/cli/commands/purge.test.ts` — new operator tool (176 + 165 lines) for pattern-store compaction with dry-run, max-age, patterns-dir flags
- `src/cli.ts` — registers `purge` / `pg` commands with help text
- `src/observation/index.ts` — exports `JsonlCompactor` and types for the purge pipeline
- `README.md` — v1.10 content: 5 new capabilities (31–35), version history, Security & Maintenance CLI, discovery flags, bounded-learning drift/contradiction notes, project-structure updates for `safety/`, `hooks/`, `validation/` modules, 39 v1.10 requirements, security section
- `.planning/MILESTONES.md` — canonical v1.10 phase-by-phase detail (phases 71–81, 24 plans, 39 requirements)
- Across phases 71–80: path-traversal guards, YAML safe deserialization, Zod schemas, JSONL checksum/rate-limit/anomaly code, secret redactors, bash deny list, drift tracker, contradiction detector, 13-pattern injection sanitizer, config-range validator, inheritance-chain validator, file integrity monitor, concurrency locks, hook error boundaries, orchestrator confirmation gates, classification audit log — 92 files, 12,278 LOC added across 51 commits
