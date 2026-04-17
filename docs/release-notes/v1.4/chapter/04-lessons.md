# Lessons — v1.4

4 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Member capability declarations are the contract surface for team composition.**
   Without explicit capabilities, the system can't match members to roles -- it would have to infer capabilities from skill content, which is fragile.
   _🤖 Status: `applied` (applied in `v1.8`) · lesson #15 · needs review_
   > LLM reasoning: v1.8 Capability-Aware Planning directly operationalizes member capability declarations for role matching.

2. **CLI management (create/list/validate/run) establishes teams as first-class entities.**
   They're not just configuration files -- they have lifecycle operations, which means they can be tested, versioned, and evolved.
   _🤖 Status: `investigate` · lesson #16 · needs review_
   > LLM reasoning: v1.36 Citation Management is unrelated to team CLI lifecycle operations.

3. **Validation at the team level catches composition errors early.**
   A team with incompatible member capabilities or circular dependencies should fail at creation time, not at runtime.
---
   _🤖 Status: `investigate` · lesson #17 · needs review_
   > LLM reasoning: v1.46 upstream intelligence pack doesn't address team-level composition validation.

4. **GSD workflow templates for team-based execution are speculative at this point.**
   Without real team usage data, the templates are designed from first principles rather than observed patterns. The v1.0 loop hasn't had time to generate the evidence that would inform team design.
   _🤖 Status: `investigate` · lesson #18 · needs review_
   > LLM reasoning: v1.13 session lifecycle coprocessor doesn't clearly address team template evidence gap.
