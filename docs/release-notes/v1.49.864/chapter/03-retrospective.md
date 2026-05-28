# v1.49.864 — Retrospective

**Wall-clock:** ~10 min from v863 close to v864 close. At the chip-cluster floor.

## What went as expected

- **Hoist-at-top fetch variant transfers cleanly to npm registry search.** Single fetch, single URL, fault-tolerant catch. Drop-in.
- **Early-return bypass for non-npm ecosystems is the right scope.** The check fires only when the URL is actually computed; the non-npm path bypasses cleanly.
- **Cross-audit tool's 7th consecutive clean application.**

## What I noticed

- **Class wrapper threads ctx as additional positional param.** Same pattern as v862's RankerOptions.ctx but as a method parameter instead of an opts field. The class-method-positional-ctx variant matches the function-positional-ctx convention.

## What surprised me

- **Nothing — fully mechanical chip transfer.** Pattern is established.

## Risk that didn't materialize

- **No audit-test regression.** 2052 PASS.
- **No backward-compat break.** EquivalentSearcher.search(dep, meta) still works.

## Carried forward (post-v864)

NEW this ship: 0 below-threshold observations.

REINFORCED:
- Cross-audit tool continuous-verification (v858-v864, 7 instances). Past promotion threshold (5).

## Campaign progress

**8 of ~11 ships shipped.** Track 3 at 2 of ~5.
