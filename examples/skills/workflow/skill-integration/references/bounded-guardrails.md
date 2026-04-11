# Bounded Learning Guardrails -- Full Reference

## Non-Negotiable Constraints

These six constraints govern all skill refinement. They exist to prevent a self-modifying system from drifting beyond user intent.

1. **Maximum 20% content change per refinement** -- Prevents runaway drift. A skill that changes too much in one step may lose its core purpose. Gradual evolution preserves intent.

2. **Minimum 3 corrections before refinement proposed** -- Single corrections may be context-specific, not general patterns. Waiting for 3 ensures the signal is real, not noise.

3. **7-day cooldown between refinements** -- Prevents over-fitting to a short burst of similar tasks. Ensures refinements reflect sustained patterns, not temporary focus.

4. **All refinements require user confirmation** -- The human-in-the-loop principle. No automated self-modification. Users must review and approve every change to learned behavior.

5. **Skill generation never skips permission checks** -- Even in YOLO mode, even in automated pipelines. Permission checks are the safety boundary for a self-modifying system.

6. **Agent composition requires 5+ co-activations over 7+ days** -- Composing agents from skill clusters is a high-impact operation. The threshold ensures genuine co-activation patterns, not coincidental proximity.

## Enforcement Layers

These guardrails are enforced at TWO levels:

- **Awareness layer** (this skill): Claude knows the rules and follows them in conversation
- **Code layer** (skill-creator source): Hardcoded in the refinement pipeline. The code enforces even if the skill is not loaded.

Both layers must agree. If the skill says "refine" but code says "cooldown active", the code wins.

## Security Context

This is a self-modifying system. Additional security constraints:

- **Path traversal**: Skill names must be sanitized before use in file paths
- **YAML deserialization**: Use safe parsing only, never load arbitrary YAML
- **Data poisoning**: Append-only JSONL files could be manipulated -- validate entries on read
- **Permission skipping**: Never bypass user confirmation for skill application, even in YOLO mode
- **Cross-project leakage**: User-level skills must not expose project-specific patterns to other projects
- **Observation privacy**: `.planning/patterns/` should be in `.gitignore` for shared repos
