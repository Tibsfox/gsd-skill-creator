## SHOULD trigger

- "What's Foxy's background?" and retrieval returns `foxy-origins-private.md` as the top Grove hit — about to integrate a never-surface personal-origins record; perfect relevance, no in-context authorization → BLOCK.
- Answering a public-facing strategy question and pgvector surfaces a `.planning/fox-companies/` IP record — HARD-RULE never-publish class, appropriateness miss despite a high similarity score.
- About to quote a `MEMORY.md` line carrying credential variable names or a `center-camp.md` trust rule into a reply — credential / consent-governed class, gate fires before it reaches output.

## SHOULD NOT trigger

- User says "show me current state" and you surface a `STATE.md` line they explicitly asked for — project-internal, no never-surface marker, explicit authorization present.
- `intent-router` choosing which retriever/strategy to run before any fetch — that is the fetch-WHAT/HOW decision, orthogonal and upstream, not a surfacing decision.
- Counting how many memory records match a query for internal routing without emitting their content — no long-term-memory content enters output, so there is nothing to warrant.
