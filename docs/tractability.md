# Tractability Classifier — ME-1

**Component:** ME-1  
**Register:** Frontmatter / authoring  
**Source:** Zhang et al. 2026, §4.2–4.3; Thread E (this repository)  
**Path:** `src/tractability/`  
**Opt-in flag:** `SKILL_CREATOR_TRACTABILITY` environment variable or `tractability.classifier` config key

---

## What It Is

The tractability classifier is a pure function that reads a skill's frontmatter and returns one of three classes:

| Class | Meaning |
|-------|---------|
| `tractable` | The skill declares an exploitable output structure; optimisation effort is justified. |
| `coin-flip` | The skill is prose-commentary; Zhang et al. 2026 §4.2 shows optimisation runs fall below zero-shot ~49% of the time in this regime. |
| `unknown` | The skill has not yet been migrated by ME-5, or its `output_structure` field is absent or malformed. |

The classification is derived from the `output_structure` and `output_schema` fields that ME-5 adds to skill frontmatter. It is a compile-time, static analysis of the skill's declared intent — not a runtime measurement of outcomes. The ME-3 A/B harness (a future wave) provides empirical validation; ME-1 provides the authoring-time gate.

The classifier is the keystone of the Living Sensoria refinement wave. Nine downstream methods across the actor-critic, stability, and temperature subgraphs read the tractability class to decide whether adaptation is justified before running it (Zhang 2026 §4.3, "can but doesn't" pattern; SUMMARY.md §8, this repository).

---

## The Three Classes in Detail

**`tractable`** — Assigned when `output_structure` is `'structured'`, or when `output_structure` is `'hybrid'` and an `output_schema` is present. These skills declare that their output has an exploitable structure: a JSON schema, a markdown template, or another format the model can produce but does not default to. Zhang 2026 §4.3 lines 341–351 establish that this pattern ("can but doesn't") is the only regime in which prompt-level optimisation reliably improves outcomes. The HelpSteer2 benchmark (+6.8 points, structured JSON rubric) is the reference case (§4.3, headroom test, lines 362–371).

**`coin-flip`** — Assigned when `output_structure` is `'prose'`. Per Zhang 2026 §4.2 (lines 303–330), 49% of 72 optimisation runs on free-form natural language tasks fall below the zero-shot baseline; the binomial p-value is 0.91 — the sign of the effect is statistically random at the run level. The "other tasks fail" paragraph (§4.3, lines 353–361) covers Feedback-Bench, WildBench, and XSum: mean Δ within the noise floor. Declaring a skill `prose` is declaring it coin-flip by construction.

**`unknown`** — Assigned when the frontmatter is malformed, the `output_structure` field is absent, or `output_structure` is `'hybrid'` without an `output_schema`. Unknown is treated as coin-flip-equivalent in all downstream gating decisions, but is surfaced distinctly in the audit report so authors can act on it.

---

## How ME-5 Output-Structure Feeds the Classifier

ME-5 adds two fields to the frontmatter schema:

```yaml
output_structure: structured | prose | hybrid   # required for new skills post-ME-5
output_schema: "path/to/schema.json"             # required when output_structure is 'structured'
```

The classifier function reads these fields and returns a `TractabilityClass`:

```typescript
export function classifyTractability(fm: SkillFrontmatter): TractabilityClass {
  if (!fm.output_structure) return 'unknown';
  if (fm.output_structure === 'structured') return 'tractable';
  if (fm.output_structure === 'hybrid' && fm.output_schema) return 'tractable';
  if (fm.output_structure === 'hybrid') return 'unknown';   // hybrid without schema
  return 'coin-flip';   // prose
}
```

The function is a pure function: referential transparency is tested by CF-ME1-04. It never throws; malformed frontmatter returns `'unknown'` (CF-ME1-05).

---

## The `skill-creator tractability` CLI

```bash
# Classify a single skill
skill-creator tractability <skill-name>

# Example output:
# skill: test-generator
# output_structure: structured
# output_schema: schemas/test-output.json
# tractability: tractable

# Run the audit over all skills
skill-creator audit --tractability

# Example audit output:
# Scanned: 128 skills (47 packaged, 81 user)
#   tractable: 54 (42.2%)
#   coin-flip: 49 (38.3%)
#   unknown:   25 (19.5%)
# Classified ratio:  103/128 (80.5%)
# Tractable ratio:   54/103  (52.4%)
#
# Unclassified (25):
#   - gsd-workflow          [missing output_structure]
#   - session-awareness     [missing output_structure]
```

The audit also lists prose skills targeted by teach entries — the operational handoff to ME-4's coin-flip warning.

### The `--audit` Flag

`skill-creator audit --tractability` walks `.claude/skills/`, `.college/departments/`, and package-installed cartridges. It emits `classified_ratio` and `tractable_ratio` on every run without silent exclusions (CF-ME1-03). Adding `--strict` makes the command exit non-zero if any skills remain `unknown` — useful as a CI gate once the corpus has been fully migrated.

---

## How the Classifier Gates M5 and M8 Behaviour

**M5 Agentic Orchestration (selector weights):** The MA-2 actor-critic wire scales its TD error by a tractability weight — `1.0` for tractable, `0.6` for unknown, `0.3` for coin-flip — before applying the weight update to the M5 selector. Skills in coin-flip regimes still contribute to the learning signal; they contribute at 30% magnitude. Gating to zero would discard directional information (Sutton & Barto 2018 §11); weighting preserves it at reduced scale.

**M8 Symbiosis (teach warnings):** ME-4 calls the classifier at teach-entry commit time. For coin-flip skills, the commit succeeds but the entry is annotated with `coinflip_warning: true` and `expected_effect: 'unmeasurable'`. The annotation is informational, never blocking. MA-6's `refinement-accept` emission scales the event magnitude by the same {1.0, 0.6, 0.3} table, ensuring the reinforcement channel reflects tractability at the point of observation.

---

## Feature Flag

With `tractability.classifier = false` (or `SKILL_CREATOR_TRACTABILITY=false`), the audit command exits cleanly with "classifier disabled" and no skill file is modified (SC-ME1-01). The refinement wave as a whole has a master flag — `SC-REF-FLAG-OFF` verified over 50 sessions that the entire wave produces byte-identical selector output when all flags are off.

---

## Primary Sources

- Zhang, X., Wang, G., Cui, Y., Qiu, W., Li, Z., Zhu, B., He, P. (2026). "Prompt Optimization Is a Coin Flip: Diagnosing When It Helps in Compound AI Systems." arXiv:2604.14585v1. §4.2 (lines 303–330); §4.3 "The 'can but doesn't' pattern" (lines 341–351); §4.3 headroom test (lines 362–371); §4.3 "the other tasks fail" (lines 353–361).
- Sutton, R. S., & Barto, A. G. (2018). *Reinforcement Learning: An Introduction* (2nd ed.). MIT Press. §11 (adjusting step-size as the correct response to noisy reward in function-approximation settings).

---

## See Also

- `docs/reinforcement-taxonomy.md` — MA-6 canonical reinforcement channels that consume tractability weighting
- `docs/actor-critic.md` — MA-2 TD-error wire that scales updates by tractability class
- `docs/refinement-wave.md` — end-to-end overview of the refinement wave
- `docs/EXTENSIONS.md` — `SKILL_CREATOR_TRACTABILITY` flag documentation
