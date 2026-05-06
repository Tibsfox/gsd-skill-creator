/**
 * Level-of-detail (LOD) culling.
 *
 * Above 3K visible nodes we drop labels; above 5K we drop edge rendering at
 * far zoom (zoom < 0.4) to keep the frame budget within 16 ms. The thresholds
 * are tuned to keep ≥30 FPS on a 3K symbol-graph (mission performance target).
 *
 * @module atlas/graph-renderer/lod
 */

export interface LODConfig {
  readonly labelMaxNodes: number;
  readonly edgeFarZoomMaxNodes: number;
  readonly edgeFarZoomThreshold: number;
}

export const DEFAULT_LOD: LODConfig = {
  labelMaxNodes: 3000,
  edgeFarZoomMaxNodes: 5000,
  edgeFarZoomThreshold: 0.4,
};

export interface LODFlags {
  readonly drawLabels: boolean;
  readonly drawEdges: boolean;
}

export function computeLOD(
  visibleNodeCount: number,
  zoom: number,
  config: LODConfig = DEFAULT_LOD,
): LODFlags {
  const drawLabels = visibleNodeCount <= config.labelMaxNodes;
  const drawEdges = !(
    visibleNodeCount > config.edgeFarZoomMaxNodes && zoom < config.edgeFarZoomThreshold
  );
  return { drawLabels, drawEdges };
}
