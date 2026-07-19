# triggering.test.md — semantic-merge-adjudicator

## SHOULD trigger

1. "Two convoy polecats both edited `src/knowledge/index.ts` this rebase and
   refinery-merge marked the MR conflicted — is this a real collision?"
   → Exact fire condition: a write conflict on a shared git tree between parallel
   agents, downstream of a `conflicted` MR.
2. "The merge queue is about to escalate 40 stalled MRs; one is just both agents
   adding different scripts to `package.json`. Can we auto-resolve the false ones?"
   → Byte-overlap that may be `independent`/`redundant`; adjudicate instead of
   blind escalate-everything.
3. "Two worktree agents made overlapping edits to the same section of a shared
   doc — are these semantically the same change or a genuine clash?"
   → Shared project-internal state; classify hunk as redundant vs clash.

## SHOULD NOT trigger

1. "A single agent is editing one file, no other writers." → No concurrency /
   no shared-state contention; nothing to adjudicate.
2. "The only conflicting hunk is in `.planning/STATE.md` (or `.env`)." → Path-gated:
   escalate unconditionally, never classify or auto-compose — do not use this
   skill to resolve it.
3. "Decide which agent's value wins for a shared controlled variable by fixed
   precedence order." → That is `selector-priority-arbitration` (a static control
   law), not the question of whether the writes actually collide.
