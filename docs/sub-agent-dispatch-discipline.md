# Sub-Agent Dispatch Discipline

**Surface:** W2/W3 sub-agent dispatch prompts; parallel build-agent spawning; per-dispatch token-budget sizing.

**Codified at:** v1.49.654 (FA-652-11 C08 lesson codification).

## Architectural facts

1. **Sub-agents lack SendMessage** in their toolkit. The model is
   spawn-task-return-result, not continuous-peer messaging
   (**Lesson #10193**, v1.49.637 cluster). Author dispatches assuming
   one-way input and one-shot deliverable return.

2. **Sub-agents hit a ~60-70 tool-use ceiling per dispatch** before
   they terminate mid-flight (**Lesson #10194** token-ceiling). Bound
   each dispatch to a scope of ~1 component / 30-50 wall-clock minutes
   worth of work. Anything larger gets split.

3. **The 64K output-token cap on each dispatch** means HTML + JSON
   deliverables exceeding ~50K combined characters must be pre-split
   into separate dispatches per file-type (**Lesson #10214**, applied
   v1.49.648 W2-NASA at obs#2 reaffirm).

4. **Chunked Write+Edit append pattern** is the canonical pattern for
   producing >32K HTML deliverables in a single dispatch
   (**Lesson #10240**, v1.49.651). The dispatch begins with a Write of
   the first ~30K, then repeated Edits append further sections.

5. **Transient API errors during W3 stages** recover via identical-prompt
   retry as the first-resort recovery strategy (**Lesson #10215**). The
   dispatch author should NOT modify the prompt on first retry — the
   error is API-side, not prompt-side.

## Dispatch-author checklist

When spawning a sub-agent dispatch:

- [ ] Scope sized to ~1 component / ≤50 min
- [ ] Output-format budget: HTML and JSON split if combined ≥50K
- [ ] Commit-between-deliverables instruction embedded in prompt
      (Lesson #10200: dispatches with self-correction stages need ≥2
      internal commit boundaries)
- [ ] No reliance on inter-agent SendMessage (Lesson #10193)
- [ ] Prompt includes the no-Co-Authored-By-Claude reminder (v1.49.621
      policy; see Ship pipeline discipline)
- [ ] Retry-policy noted if W3-stage and API-error-prone

## Cross-references

- Memory: `sub-agent-token-ceiling-iterative-dispatch.md`
- Ship pipeline discipline: apply-to-self enforcement, no-Co-Authored-By
- Mission package framing: scope-sizing for component-decomposition

## Lesson #10244 — 7-parallel-agent W3 dispatch reproducibility

**Operational standard:** parallel-agent W3 dispatches at obs#3 (three
consecutive degree reproducibility) is the established cadence. The
v1.49.651 + v1.49.652 W3-stage runs landed 7 parallel agents in single
cluster windows without regression.

Apply: counter-cadence milestones authoring W3 wave plans can size up to
7 parallel dispatches without exceeding reproducibility bounds. Larger
wave plans must declare new substrate (forward-shadow at obs#1).
