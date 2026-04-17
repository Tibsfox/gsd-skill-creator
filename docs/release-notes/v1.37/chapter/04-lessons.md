# Lessons — v1.37

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Mathematical frameworks need migration paths, not just greenfield design.**
   The SkillMigrationAnalyzer that inspects existing skills for trigger/content/history compatibility is what makes the Complex Plane adoption practical. Without it, 451 existing primitives would need manual repositioning.
   _🤖 Status: `investigate` · lesson #197 · needs review_
   > LLM reasoning: PyDMD dogfood concerns knowledge extraction, not a migration analyzer for existing skills.

2. **Versine/exsecant metrics provide geometric health indicators that linear metrics cannot.**
   Versine distribution (grounded/working/frontier) and exsecant reach measure skill health in terms of angular position, not just counts. The choice of trigonometric functions is deliberate -- they measure curvature, not distance.
   _🤖 Status: `investigate` · lesson #198 · needs review_
   > LLM reasoning: PyDMD dogfood does not implement versine/exsecant geometric health metrics.

3. **Chord detection between co-activated skills surfaces composition opportunities automatically.**
   Rather than manually defining which skills compose well, the ChordDetector finds natural pairings from usage patterns. Euler composition (complex multiplication) then provides the mathematical operation for combining them.
   _🤖 Status: `investigate` · lesson #199 · needs review_
   > LLM reasoning: PyDMD knowledge extraction is about learning from docs, not chord detection of co-activated skills.

4. **12 safety-critical tests (SC-01 through SC-12) as a named, numbered set makes safety auditable.**
   Named tests can be referenced in compliance discussions. Unnamed tests disappear into aggregate counts.
---
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #200_

5. **60/40 geometric/semantic weight blending is a magic number.**
   The configurable weight blending between geometric and semantic scoring in tangent activation defaults to 60/40 without documented justification for why this ratio was chosen. Calibration data would strengthen the default.
   _⚙ Status: `investigate` · lesson #201_

6. **Angular velocity clamping parameters (3-correction/7-day/20% rules) are carried forward as constraints.**
   These bounded learning rules from the CONSTRAINT_MAP are preserved but not empirically validated in the Complex Plane context. They may need recalibration.
   _⚙ Status: `investigate` · lesson #202_
