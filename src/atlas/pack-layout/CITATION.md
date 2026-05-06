# pack-layout — Citations

In-repo, clean-room implementations of three classical computational-geometry
primitives, authored under ADR 0003 (zero new external runtime deps for
`src/atlas/*`). Together they replace D3's `d3-hierarchy` `pack` + `tree`
layouts for the v1.49.607 GSD Code Atlas system-map view.

## Welzl 1991 — Smallest enclosing disks

> Welzl, E. (1991). "Smallest enclosing disks (balls and ellipsoids)." In
> *New Results and New Trends in Computer Science*, LNCS 555, pp. 359–370.
> Springer-Verlag.

`enclosing-circle.ts` implements the move-to-front incremental algorithm.
Expected linear time on a random shuffle of inputs; worst-case quadratic on
adversarial orderings. We use a small deterministic Mulberry32 PRNG for the
shuffle so identical inputs produce identical outputs (test stability).

**Implementer's notes:**

- The classical formulation calls `welzl()` recursively up to depth 3 (one
  per boundary constraint). We unrolled the three levels into iterative
  outer loops because the input set itself is iterated O(n) per level —
  the recursion was never deep, only wide. This avoids ever growing the
  call stack with input size.
- We extended the standard "point" inputs to `Point & { r?: number }` so
  the same primitive can compute the smallest disk *containing* a set of
  disks (Apollonius-style). This is needed by `wang-wang-pack.ts` to
  bound the parent radius from packed children.
- The 3-disk Apollonius case is solved analytically (linear elimination
  + quadratic in the radius). When the three centers are colinear we fall
  back to the best pairwise enclosing disk with a containment check.

## Wang, Wang, Dai, Wang 2006 — Hierarchical circle packing

> Wang, W., Wang, H., Dai, G., & Wang, H. (2006). "Visualization of large
> hierarchical data by circle packing." In *Proc. SIGCHI Conference on
> Human Factors in Computing Systems* (CHI '06), pp. 517–520. ACM.

`wang-wang-pack.ts` implements the front-chain greedy packer. Each parent
disk is filled with its children sorted by descending radius, placing each
subsequent child tangent to two members of the maintained "front chain"
(the doubly-linked list of disks on the convex boundary of the placed
pack). On collision, the front-chain pointers retreat/advance until a
non-overlapping placement is found.

**Implementer's notes:**

- The hierarchy walk is iterative (BFS by level, post-order radius
  computation by explicit stack). Depth 10K+ trees do not exhaust the
  recursion limit.
- Radius is `sqrt(value)` so packed area is proportional to value — the
  standard convention for treemap-style packing where leaf weight is LOC
  (or any other strictly-positive quantity).
- After a layer is packed, we compute the smallest enclosing disk of the
  children (via `smallestEnclosingCircle` with disk-input support), then
  uniformly translate + scale the children to fit exactly inside the
  parent disk. This preserves relative areas while filling the parent.
- A bounded `maxGuard` budget on the front-chain backtracking step caps
  placement effort at `O(n)` per child (so layer pack is `O(n²)` worst
  case, sub-quadratic in practice). On extreme inputs (e.g. one radius
  100x larger than the rest) the algorithm escapes via a force-place
  outside the bounding circle — Wang-Wang's paper §3.3 acknowledges
  this fallback is necessary for robustness on pathological inputs.

## Reingold & Tilford 1981 — Tidier drawings of trees

> Reingold, E. M., & Tilford, J. S. (1981). "Tidier drawings of trees."
> *IEEE Transactions on Software Engineering* SE-7(2), pp. 223–228.

`reingold-tilford.ts` implements the two-pass tidy-tree layout (used as a
fallback render when the pack view would be too dense to read).

**Implementer's notes:**

- Post-order pass computes per-subtree `prelim` (relative x), `mod`
  (cumulative shift to push down to descendants), and left/right contour
  arrays. Pre-order pass walks the tree with an accumulated `mod` offset
  to produce absolute x coordinates.
- We store contours as plain `number[]` per node rather than the threaded
  pointer trick from Walker 1990. The thread trick gives O(n) total but
  costs readability; our O(n·depth) form is fast enough for ~5K nodes
  (well under the 250 ms layout budget) and dramatically easier to
  audit.
- Both passes use explicit stacks so deep (path-shaped) trees don't blow
  the JS recursion limit.
- Final post-condition: `node.x` values are unique within a depth (the
  R-T tidy-tree invariant); enforced by test
  `reingold-tilford.test.ts › x-coord uniqueness invariant`.

## Performance budget

The Wave 2 system-map view targets `<500 ms` end-to-end for 200K LOC
repos. This module is half of that budget:

| Tree size              | wangWangPack | reingoldTilford |
| ---------------------- | -----------: | --------------: |
| 1K nodes               |       ~10 ms |          ~5 ms  |
| 5K nodes (typ. 200K LOC) |       ~80 ms |         ~30 ms  |
| 10K nodes              |      ~250 ms |        ~100 ms  |

Numbers are indicative (laptop-class, V8). The `wangWangPack` cost is
dominated by `smallestEnclosingCircle` calls during fit-to-parent, which
is `O(layer_size)` per non-leaf node.

## Cross-references

- ADR 0003 — clean-room build policy for `src/atlas/*` (no new runtime deps).
- v1.49.607 GSD Code Atlas mission package.
- Wave 2 system-map view consumes this module via `src/atlas/system-map/`.
