/**
 * Shared types for the pack-layout primitives.
 * @module atlas/pack-layout/types
 */

/**
 * Hierarchical input. `value` is the leaf weight (e.g. LOC); for parents it
 * is computed from children when undefined. `data` carries opaque payload
 * the caller wants to round-trip.
 */
export interface HierNode<T = unknown> {
  readonly id: string;
  readonly data?: T;
  readonly value?: number;
  readonly children?: ReadonlyArray<HierNode<T>>;
}

/** A circle in 2D, with payload preserved from input. */
export interface CircleNode<T = unknown> {
  readonly id: string;
  readonly data?: T;
  /** Center x. */
  x: number;
  /** Center y. */
  y: number;
  /** Radius (always positive; min 1e-9 for zero-weight nodes). */
  r: number;
  /** Sum of leaf values under this node. */
  value: number;
  /** Tree depth (root = 0). */
  depth: number;
  /** Children, laid out inside this circle. */
  children?: CircleNode<T>[];
}

/** Configuration for {@link wangWangPack}. */
export interface PackConfig {
  /** Final overall radius. Defaults to 1. Children are scaled to fit. */
  size?: number;
  /** Padding between sibling circles (in final units). Default 0. */
  padding?: number;
  /**
   * RNG for shuffle ops in Welzl. Deterministic by default (seeded). The
   * pack ordering itself is value-descending; only enclosing-circle uses
   * randomization for expected linear time.
   */
  random?: () => number;
}

/** A point in 2D — the input to {@link smallestEnclosingCircle}. */
export interface Point {
  readonly x: number;
  readonly y: number;
  /** Optional radius — when present the result encloses each disk, not just the center point. */
  readonly r?: number;
}

/** Output of {@link smallestEnclosingCircle}. */
export interface Disk {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

/** Tree-layout output for {@link reingoldTilford}. */
export interface TreeNode<T = unknown> {
  readonly id: string;
  readonly data?: T;
  /** Horizontal coordinate (Reingold-Tilford x). */
  x: number;
  /** Vertical coordinate = depth × levelHeight. */
  y: number;
  depth: number;
  children?: TreeNode<T>[];
}

/** Configuration for {@link reingoldTilford}. */
export interface TreeConfig {
  /** Vertical distance between depths. Default 1. */
  levelHeight?: number;
  /** Minimum sibling x-spacing. Default 1. */
  siblingSpacing?: number;
  /** Minimum subtree x-spacing. Default 1. */
  subtreeSpacing?: number;
}
