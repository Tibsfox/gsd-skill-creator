# v1.49.591 — Forward Lessons Emitted

Four forward lessons emit at v1.49.591 close.

---

## #10201 — gh CLI snap-confinement empirically-verifiable workaround pattern

**Type:** Tooling / discipline. **Severity:** MED. **Substrate transferable:** YES (any snap-confined CLI on Linux).

When a CLI tool is installed via snap (Linux package format with security sandboxing), filesystem access is restricted to declared interfaces. The `home` interface auto-connects `$HOME`/`/home/<user>/` access; other paths require explicit interface plugs (`system-files`, `removable-media`, etc.). For `gh release create --notes-file`, this means: paths under `/home/foxy/` work; paths under `/tmp/` fail with `permission denied`; paths on alternative mounts (e.g. `/media/foxy/...`) fail with `permission denied`.

**3-criterion test for snap-confinement workaround:**
1. Symptom: `permission denied` when path is readable + repo-relative + `cat` works fine
2. Diagnosis: `which <tool>` returns `/snap/bin/...`; `snap connections <tool>` shows no `system-files` plug
3. Fix: copy the file to `$HOME/<filename>` and pass that absolute path

**Forward action:** When a snap-confined CLI is involved in a ship pipeline and reads a file argument, document the `$HOME` fallback. The v1.49.591 CLAUDE.md update at T2.1 establishes this pattern for `gh release create --notes-file`. Future similar tools (e.g. `discord` snap, `slack` snap if used in pipeline) should follow the same pattern.

**Cross-reference:** v1.49.590 #10196 candidate (graduates to numbered as #10201 here). Investigation evidence at `.planning/missions/v1-49-591-apollo-8-first-crewed-translunar/evidence/gh-cli-path-investigation.md`.

---

## #10202 — Two-soak-then-harden discipline for warning-mode gates

**Type:** Process / governance. **Severity:** MED. **Substrate transferable:** YES.

When a deterministic gate is added in WARNING-only mode (gate runs but does not block ship), the soak period before BLOCKER hardening should be **at least 2 milestones with zero FAIL findings**. v1.49.589 introduced depth-audit as step 6 in WARNING mode. v1.49.589 + v1.49.590 = 2 soak milestones with zero FAIL findings → eligible to harden at v1.49.591 (3rd milestone). T2.2 landed the BLOCKER hardening.

**3-criterion test for harden-eligibility:**
1. ≥2 soak milestones with the gate active in WARNING mode
2. Zero FAIL findings during soak (or all findings remediated promptly)
3. Override env var available for legitimate emergency cases

**Forward action:** Future warning-mode gates added to `pre-tag-gate.sh` or other deterministic gates should follow the 2-soak-then-harden discipline. Document the soak start/end milestones and FAIL findings count in the gate's introduction comment block.

**Cross-reference:** Original T2.3 design intent at v1.49.589; soak v1.49.589 + v1.49.590; hardening v1.49.591 T2.2.

---

## #10203 — Source-of-truth canonical-section regex list should propagate to W2-build-agent prompts

**Type:** Tooling / template-discipline. **Severity:** MED. **Substrate transferable:** YES.

`tools/depth-audit.mjs` enforces 7 NASA canonical-section regexes (Three Parallel Threads / Resonance Axes / Founding-Instance Narrative / Forest Contribution / Governance & Chain Declaration / Data Files / Dedication). The W2-build-agent prompt template at `.planning/missions/template-files/W2-build-agent-prompt.md` does NOT enumerate these regexes explicitly — it directs agents to "mirror v1.71" which led the v1.49.591 W2-NASA agent to rename "Three Parallel Threads + Resonance Axes" as a single "Three-Track Resonance" section and to omit "Founding-Instance Narrative + Dedication" entirely. Inline-recovery via 4 targeted Edits added the missing canonical names.

**3-criterion test for canonical-section drift:**
1. Build agent reports "N+ sections" but depth-audit reports M < N matching canonical regexes
2. Section text content is present (semantically equivalent) but heading text doesn't match regex
3. Inline-recovery via Edit operations is feasible (≤4 edits to add missing canonical headings)

**Forward action:** Update `template-files/W2-build-agent-prompt.md` to include the 7 NASA canonical-section regexes as MANDATORY heading text patterns. The agent prompt should specify: "the index.html MUST include h2 (or h3) elements whose text matches these 7 regexes verbatim — do not rename, combine, or omit." Future W2-NASA dispatches will pre-empt the inline-recovery cycle.

**Cross-reference:** Inline-recovery applied this milestone; full investigation in `chapter/03-retrospective.md` §"What didn't work" item 1.

---

## #10204 — NASA W2 build agents lose 10-20% byte depth at scale; predecessor-baseline-comparison may be optimistic

**Type:** Build-agent quality / depth-audit calibration. **Severity:** LOW. **Substrate transferable:** PARTIAL (NASA-specific; MUS + ELC do not exhibit pattern at scale yet).

Two consecutive milestones (v1.49.590 + v1.49.591) showed NASA bytes ratio in WARN borderline (80% + 88%). The pattern: W2-NASA Sonnet build agents reliably hit ≥95% lines but lose ~10-20% bytes vs the gold-standard predecessor. Hypothesis: predecessor v1.71 had Apollo 7 mission with extensive technical detail (8 SPS firings + Schirra mutiny + Block II first-flight + post-fire-recovery narrative) that produces naturally dense prose; v1.72 Apollo 8 narrative is more focused (6 firsts + 6 days + 3 burns) and lands at lower byte density. MUS + ELC do not exhibit the pattern (both at PASS or above-100% bytes).

**3-criterion test for NASA-bytes-WARN diagnosis:**
1. Lines ≥95% predecessor (PASS)
2. Bytes 80-95% predecessor (WARN)
3. Sections 7/7 canonical (PASS)

**Forward action:** Three options to investigate at v1.49.592 (Apollo 9):
- (a) **Adjust depth-audit to weight lines/bytes/sections separately** — currently overall verdict = worst-of-three; may be too strict for NASA byte ratio in particular
- (b) **Direct W2-NASA agents to write more verbose prose** — risks padding; not preferred
- (c) **Compare bytes against a moving 3-milestone baseline** — averages out predecessor density variance

Recommend (c) as the principled fix; (a) is the second-best option if (c) is too complex. Defer (b).

**Cross-reference:** v1.49.590 NASA bytes 80% borderline (logged in v1.49.590 §6 open items #4); v1.49.591 NASA bytes 88% borderline (this milestone); 2-instance soak.

---

## Summary — lesson-emit cadence

| Milestone | Lessons emitted | Total |
|---|---|---|
| v1.49.586 | 4 | — |
| v1.49.587 | 4 | — |
| v1.49.588 | 4 | — |
| v1.49.589 | 3 + 4 candidates | — |
| v1.49.590 | 4 | — |
| v1.49.591 | 4 | — |

Cadence holds at ~4 lessons/milestone in the steady state of three-track-plus-TRS forward cadence.
