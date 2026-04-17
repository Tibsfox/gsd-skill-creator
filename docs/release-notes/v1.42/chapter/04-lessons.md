# Lessons — v1.42

4 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Git workflow skills need repository context, not just command knowledge.**
   A skill that knows "git rebase" is less useful than one that knows "this repository uses merge commits on main and rebases on feature branches." The git module types with Zod validation capture this context structurally.
   _🤖 Status: `investigate` · lesson #223 · needs review_
   > LLM reasoning: Candidate v1.43 is a Gource visualization pack, unrelated to git repository-context skills.

2. **Adding coverage tooling is a foundation investment.**
   @vitest/coverage-v8 may not have produced reportable numbers in this release, but it enables coverage-gated quality checks in future releases. The payoff is downstream.
   _⚙ Status: `investigate` · lesson #224_

3. **272 tests across 51 files is a thin ratio for a module that parses git state.**
   Git repositories have enormous state diversity (detached HEAD, merge conflicts, rebases in progress, submodules, worktrees). The edge case surface is large.
   _⚙ Status: `applied` (applied in `v1.46`) · lesson #225_

4. **Coverage reporting was added (@vitest/coverage-v8) but no coverage numbers are reported.**
   Adding the tool without reporting the baseline means coverage can't be tracked over time.
   _⚙ Status: `investigate` · lesson #226_
