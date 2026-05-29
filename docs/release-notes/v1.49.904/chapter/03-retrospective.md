# Retrospective — v1.49.904

## What Worked

**Read-then-write methods cleanly fit #10457.** `consume` and `markExpired` are both read-modify-write methods: read the file, transform in-memory, write back. The LoaderContext gate sits at the top of each method, hoisted ABOVE the readFile try/catch AND ABOVE the writeQueue lock. The writeFile at the end is implicitly out-of-scope per #10457 — no special handling needed.

**Transitive read-via-call inherits the gate naturally.** `getPending` calls `readAll`, and that's the only fs touch. No need to re-gate `getPending` — its single audit comes from the `readAll` call. The 5th #10456 variant test exercises exactly this: {readAll + getPending + consume + markExpired} = 4 audits, with getPending counting as 1 via the transitive readAll call.

**Class-instance multi-method shape is a clean extension of #10455.** v890+v896+v897 (the #10455 instances) all gated a single read-side method. v904 extends that to 3 read methods on one class. The wire mechanics are identical: class-stored `private readonly ctx`, hoist at the top of each method. The novelty is just that there are multiple methods, not a different wire shape per method.

## What Could Have Been Better

**The discriminator between v902 (class-multi-method consolidated-gate) and v904 (class-instance multi-method) hinges on a structural property of the class.** v902 has a SINGLE public entry point that calls private internal fs-ops; v904 has MULTIPLE public methods each with its own fs-op. The naming convention "class-multi-method" applies to both, but the wire shape is different. Future chip authors must read the structure, not the name. Carry-forward observation: the catalog entry for v904's shape should be named something more specific, like "class-instance parallel-method" or "class-instance multi-read", to distinguish from v902's "class-multi-method consolidated-gate."

## Lessons Learned

See [04-lessons.md](04-lessons.md). No new manifest-promoted lessons; v904 reinforces #10455 (extended to N>1), #10456 (5th variant), #10457 (multi-method scale instance), and adds a 1-instance candidate for "class-instance multi-method read-side" as a #10448 sub-variant.
