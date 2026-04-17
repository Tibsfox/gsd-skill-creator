# Lessons — v1.49.549

2 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Dogfood is the shortest path to format validation.**
   The
cartridge-forge cartridge forced every schema decision to meet a
real workload early. Half a dozen schema ambiguities collapsed into
obvious answers the moment the forge cartridge had to declare its
own skills, agents, and teams. "Use the system you're building" is
cheaper than "write a test plan for the system you're building."
4. **Parallel workstreams work when they're isolated at the right
boundary.** The `artemis-ii` worktree, the `nasa` branch, the
`wasteland` exclusion, and the live FTP sync pipeline kept eight
concurrent workstreams from interfering with each other. The
boundary of isolation matters more than the count of streams —
pick worktrees and branches that split by *type of churn*, not by
feature.
   _⚙ Status: `investigate` · lesson #1706_

2. **Verify state empirically before claiming it.**
   Multiple incidents
during the mission (4 tracked in the memory-arena-m1 feedback file
alone) traced to assertions about git state, file presence, or
test status made without running a live query. Run the command
first, then make the claim.
   _⚙ Status: `investigate` · lesson #1707_
