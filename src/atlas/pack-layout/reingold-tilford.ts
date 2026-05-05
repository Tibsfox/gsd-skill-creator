/**
 * Tidy tree layout (Reingold & Tilford 1981).
 *
 * Two-pass algorithm:
 *   1. Post-order: for each node, lay out its children, then shift each
 *      subtree so it doesn't collide with its left sibling. Collision is
 *      tested via left/right "contour" extremes; the shift to clear a
 *      collision is the maximum of (right contour of left subtree -
 *      left contour of right subtree + spacing) over all contour depths.
 *   2. Pre-order: propagate cumulative parent shifts down to absolute x.
 *
 * The classic recursive formulation (Walker 1990's O(n) variant) is the
 * most readable, but recursion depth = tree depth. For path-shaped trees
 * (10K+ depth) that overflows the stack. We implement an iterative
 * post-order driver with an explicit stack to remain safe at scale.
 *
 * @module atlas/pack-layout/reingold-tilford
 */

import type { HierNode, TreeConfig, TreeNode } from './types.js';

interface NodeState<T> {
  output: TreeNode<T>;
  /** x position relative to parent (final pre-order pass adds parent x). */
  prelim: number;
  /** Cumulative shift to add to all descendants. */
  mod: number;
  /** Left/right contour pointers for thread-style traversal. */
  leftContour: number[];   // by relative depth from this node
  rightContour: number[];
}

/** Tidy tree layout per Reingold & Tilford 1981. */
export function reingoldTilford<T = unknown>(
  root: HierNode<T>,
  config: TreeConfig = {},
): TreeNode<T> {
  const levelHeight = config.levelHeight ?? 1;
  const siblingSpacing = config.siblingSpacing ?? 1;
  const subtreeSpacing = config.subtreeSpacing ?? 1;

  // Build the output tree iteratively (preorder construction).
  type Frame = { input: HierNode<T>; output: TreeNode<T>; parent: TreeNode<T> | null; childIdx: number };
  const outRoot: TreeNode<T> = {
    id: root.id,
    data: root.data,
    x: 0,
    y: 0,
    depth: 0,
  };
  // Map output -> state.
  const states = new Map<TreeNode<T>, NodeState<T>>();
  const initState = (out: TreeNode<T>): NodeState<T> => {
    const s: NodeState<T> = {
      output: out,
      prelim: 0,
      mod: 0,
      leftContour: [0],
      rightContour: [0],
    };
    states.set(out, s);
    return s;
  };
  initState(outRoot);
  // Iterative post-order: build full tree first, then walk it.
  const buildStack: Frame[] = [{ input: root, output: outRoot, parent: null, childIdx: 0 }];
  const postorder: TreeNode<T>[] = [];
  while (buildStack.length > 0) {
    const f = buildStack[buildStack.length - 1];
    const kids = f.input.children;
    if (kids && f.childIdx < kids.length) {
      const kIn = kids[f.childIdx++];
      const kOut: TreeNode<T> = {
        id: kIn.id,
        data: kIn.data,
        x: 0,
        y: (f.output.depth + 1) * levelHeight,
        depth: f.output.depth + 1,
      };
      if (!f.output.children) f.output.children = [];
      f.output.children.push(kOut);
      initState(kOut);
      buildStack.push({ input: kIn, output: kOut, parent: f.output, childIdx: 0 });
    } else {
      postorder.push(f.output);
      buildStack.pop();
    }
  }
  // Process post-order: compute prelim+mod+contours.
  for (const node of postorder) {
    const s = states.get(node)!;
    const kids = node.children;
    if (!kids || kids.length === 0) {
      s.prelim = 0;
      s.mod = 0;
      s.leftContour = [0];
      s.rightContour = [0];
      continue;
    }
    // CONTOUR INVARIANT: C_k[d] = x of leftmost/rightmost descendant at
    // relative depth d, with k placed at x=0 and k.mod already applied to
    // its descendants. Leaf: C = [0]. Internal k:
    //   C_k[d>=1] = min/max over kids j of (j.prelim + k.mod + C_j[d-1])
    // During sibling layout, treat N.mod = 0 (it shifts all kids equally,
    // doesn't affect inter-sibling overlap); apply N.mod when composing
    // N's contour at the end.
    const firstChild = kids[0];
    const fcs = states.get(firstChild)!;
    fcs.prelim = 0;
    // mergedRight[d] = rightmost descendant pos at relative depth d under
    // N, considering all already-placed siblings, in N-frame with N.mod=0.
    // For child j placed at j.prelim: descendants at depth d (rel to N)
    // = j.prelim + C_j[d-1]. Sibling j itself at depth 0 = j.prelim.
    let mergedRight: number[] = [];
    {
      // Initialise mergedRight from first child's contour.
      mergedRight.push(fcs.prelim); // depth 0: position of fc itself
      for (let d = 0; d < fcs.rightContour.length; d++) {
        // C_fc[d] is at relative depth d from fc; that's depth d+1 from N.
        mergedRight.push(fcs.prelim + fcs.rightContour[d]);
      }
      // Drop the redundant final 0 if any (depth-0 from contour duplicates
      // depth-0 we already pushed). Actually fc.rightContour[0] = 0 (fc's
      // own pos in fc-frame), so mergedRight at depth 1 = fc.prelim + 0 =
      // fc.prelim, which equals depth-0. That's wrong — we'd double-count.
      // Fix: skip C_fc[0] since it represents fc itself, already counted.
    }
    // Recompute cleanly: depth 0 = fc.prelim (fc itself); deeper depths
    // come from fc.rightContour starting at index 1.
    mergedRight = [fcs.prelim];
    for (let d = 1; d < fcs.rightContour.length; d++) {
      mergedRight.push(fcs.prelim + fcs.rightContour[d]);
    }
    for (let i = 1; i < kids.length; i++) {
      const k = kids[i];
      const ks = states.get(k)!;
      // k tentatively at prelim=0. k itself in N-frame at depth 0 = 0;
      // descendants at depth d>=1 = ks.leftContour[d] (since ks.leftContour[0]
      // = 0 is k itself, already counted).
      // Required shift to clear mergedRight: at depth 0, sibling spacing;
      // at depth d>=1, subtree spacing.
      let shift = 0;
      // Depth 0:
      if (mergedRight.length > 0) {
        const gap = mergedRight[0] - 0 + siblingSpacing;
        if (gap > shift) shift = gap;
      }
      // Depth d>=1:
      const maxD = Math.min(mergedRight.length, ks.leftContour.length);
      for (let d = 1; d < maxD; d++) {
        const gap = mergedRight[d] - ks.leftContour[d] + subtreeSpacing;
        if (gap > shift) shift = gap;
      }
      ks.prelim = shift;
      // Update mergedRight: at depth 0, max(prev, ks.prelim).
      // At depth d>=1, max(prev[d], ks.prelim + ks.rightContour[d]).
      const newLen = Math.max(mergedRight.length, ks.rightContour.length);
      const newRight: number[] = new Array(newLen);
      for (let d = 0; d < newLen; d++) {
        const a = d < mergedRight.length ? mergedRight[d] : Number.NEGATIVE_INFINITY;
        let b: number;
        if (d === 0) b = ks.prelim;
        else b = d < ks.rightContour.length ? ks.prelim + ks.rightContour[d] : Number.NEGATIVE_INFINITY;
        newRight[d] = Math.max(a, b);
      }
      mergedRight = newRight;
    }
    // Center N over its children.
    const last = kids[kids.length - 1];
    const lastS = states.get(last)!;
    const midpoint = (fcs.prelim + lastS.prelim) / 2;
    s.prelim = 0;
    s.mod = -midpoint;
    // Build N's contour: depth 0 = 0 (N itself). Depth d>=1: descendants
    // are at j.prelim + N.mod + C_j[d-1] in N-frame (with N.mod applied).
    let maxKidContourLen = 0;
    for (const k of kids) {
      const ks = states.get(k)!;
      if (ks.leftContour.length > maxKidContourLen) maxKidContourLen = ks.leftContour.length;
      if (ks.rightContour.length > maxKidContourLen) maxKidContourLen = ks.rightContour.length;
    }
    const totalLen = maxKidContourLen + 1;
    const left: number[] = new Array(totalLen).fill(0);
    const right: number[] = new Array(totalLen).fill(0);
    for (let d = 1; d < totalLen; d++) {
      let lo = Number.POSITIVE_INFINITY;
      let hi = Number.NEGATIVE_INFINITY;
      // Children themselves at relative depth 1 (d=1). For d>=2, descendants
      // come from ks.leftContour[d-1] / ks.rightContour[d-1].
      if (d === 1) {
        for (const k of kids) {
          const ks = states.get(k)!;
          const v = ks.prelim + s.mod;
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      } else {
        for (const k of kids) {
          const ks = states.get(k)!;
          if (ks.leftContour.length > d - 1) {
            const v = ks.prelim + s.mod + ks.leftContour[d - 1];
            if (v < lo) lo = v;
          }
          if (ks.rightContour.length > d - 1) {
            const v = ks.prelim + s.mod + ks.rightContour[d - 1];
            if (v > hi) hi = v;
          }
        }
      }
      left[d] = Number.isFinite(lo) ? lo : 0;
      right[d] = Number.isFinite(hi) ? hi : 0;
    }
    s.leftContour = left;
    s.rightContour = right;
  }
  // Pre-order pass: child.x = parent.x + child.prelim + parent.mod.
  // We pass parentX + parent.mod (the offset to add to each child.prelim).
  type WalkFrame = { node: TreeNode<T>; offset: number };
  const walk: WalkFrame[] = [{ node: outRoot, offset: 0 }];
  while (walk.length > 0) {
    const { node, offset } = walk.pop()!;
    const s = states.get(node)!;
    node.x = s.prelim + offset;
    if (node.children) {
      const childOffset = node.x + s.mod;
      // Push in reverse so leftmost is visited first (preorder semantics).
      for (let i = node.children.length - 1; i >= 0; i--) {
        walk.push({ node: node.children[i], offset: childOffset });
      }
    }
  }
  // Finally, normalize so the leftmost x is at 0 (a Reingold-Tilford
  // post-condition — each x is a non-negative integer multiple of
  // siblingSpacing for unit-spacing inputs).
  let minX = Number.POSITIVE_INFINITY;
  const stack2: TreeNode<T>[] = [outRoot];
  while (stack2.length > 0) {
    const n = stack2.pop()!;
    if (n.x < minX) minX = n.x;
    if (n.children) for (const c of n.children) stack2.push(c);
  }
  if (minX !== 0 && Number.isFinite(minX)) {
    const stack3: TreeNode<T>[] = [outRoot];
    while (stack3.length > 0) {
      const n = stack3.pop()!;
      n.x -= minX;
      if (n.children) for (const c of n.children) stack3.push(c);
    }
  }
  return outRoot;
}
