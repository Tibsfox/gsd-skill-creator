/**
 * Pack-layout primitives for the GSD Code Atlas system map.
 *
 * Clean-room replacement of D3's hierarchical pack + tree layouts under
 * ADR 0003 (zero new external runtime deps for src/atlas/*).
 *
 * @module atlas/pack-layout
 */

export type {
  CircleNode,
  Disk,
  HierNode,
  PackConfig,
  Point,
  TreeConfig,
  TreeNode,
} from './types.js';

export { mulberry32, smallestEnclosingCircle } from './enclosing-circle.js';
export { wangWangPack } from './wang-wang-pack.js';
export { reingoldTilford } from './reingold-tilford.js';
