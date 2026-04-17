# Retrospective — v1.49.549

## Lessons Learned

1. **Freeze schemas early and defend them with loader normalizers.**
   Every attempt across Waves 1–3 of cartridge-forge to "just add a
   field" was met with "use `metadata` or a loader normalizer." The
   same pattern holds at mission scale: the Grove format and the
   Cartridge schema both stabilized before their first real workload,
   and neither needed a breaking change under real data.

2. **Build escape hatches on day one, not when you need them.**
   `KNOWN_VALIDATION_DEBT` and `--allow-validation-debt` were added in
   Wave 3 because the validator's strictness collided with pre-existing
   debt. If the quarantine pattern had been designed in at Wave 0,
   Waves 1 and 2 wouldn't have hit the false "loosen validator vs.
   skip test" choice. The same applies to cross-file version checks,
   hook presence checks, and gitignored-path walkers — pay for the
   escape hatch before you need it.

3. **Dogfood is the shortest path to format validation.** The
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

5. **Verify state empirically before claiming it.** Multiple incidents
   during the mission (4 tracked in the memory-arena-m1 feedback file
   alone) traced to assertions about git state, file presence, or
   test status made without running a live query. Run the command
   first, then make the claim.
