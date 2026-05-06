/**
 * Atlas graph renderer — public API.
 *
 * In-repo Cytoscape.js replacement (ADR 0003: zero new external runtime deps).
 * Pure-TS layout + Barnes-Hut quadtree + WebGL2 instanced renderer.
 *
 * @module atlas/graph-renderer
 */

export { runFRLayout, mulberry32 } from './layout-fr.js';
export type { LayoutNode, LayoutEdge, FRLayoutConfig, FRLayoutResult } from './layout-fr.js';

export { Quadtree, buildQuadtree, computeBounds } from './quadtree.js';
export type { Body, Bounds } from './quadtree.js';

export {
  createViewport,
  worldToScreen,
  screenToWorld,
  pan,
  zoomAt,
  viewProjectionMatrix,
  DEFAULT_LIMITS,
} from './viewport.js';
export type { Vec2, ViewportState, ViewportLimits } from './viewport.js';

export { buildHitTestIndex, hitTest, hitTestRect } from './hittest.js';
export type { HitNode, HitTestIndex } from './hittest.js';

export { computeLOD, DEFAULT_LOD } from './lod.js';
export type { LODConfig, LODFlags } from './lod.js';

export {
  createRenderer,
  uploadNodes,
  uploadEdges,
  drawFrame,
  disposeRenderer,
} from './renderer-webgl2.js';
export type {
  RendererHandle,
  NodeVertex,
  EdgeVertex,
  DrawFrame,
} from './renderer-webgl2.js';
