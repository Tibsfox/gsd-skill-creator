/**
 * System Map — layout helpers.
 *
 * Converts IPC response shapes into HierNode trees consumed by wangWangPack.
 * All functions are pure (no side-effects, no I/O).
 */

import type { HierNode } from '../../../../src/atlas/pack-layout/index.js';
import type { AtlasSymbol } from '../../../../src/intelligence/types.js';

/** Payload carried in each node for rendering decisions. */
export interface NodePayload {
  kind: 'folder' | 'file';
  filePath?: string;
  symbolCount: number;
  recentActivityAt?: number;
  missionIds: string[];
  /** Dominant mission id for provenance-overlay coloring; null when not attributed. */
  dominantMissionId: string | null;
  /** Weight of the dominant attribution in the 0..1 range; 0 when not attributed. */
  dominantWeight: number;
}

/** Per-file data aggregated from IPC responses. */
export interface FileData {
  filePath: string;
  symbols: AtlasSymbol[];
  /** unix-ms of most recent mission touching this file (0 if unknown). */
  recentActivityAt: number;
  /** missions that have touched this file. */
  missionIds: string[];
  /** Mission with the highest provenance weight for this file; null if none. */
  dominantMissionId: string | null;
  /** Full attribution list sorted descending by weight. */
  missionAttributions: Array<{ mission_id: string; weight: number; line_count: number }>;
}

/** Options controlling how the hierarchy is built. */
export interface BuildOptions {
  /** Minimum radius (in layout units) below which a label is not rendered. Default: 12. */
  labelCutoffRadius?: number;
  /** Padding between sibling circles. Default: 2. */
  padding?: number;
}

export const DEFAULT_LABEL_CUTOFF_RADIUS = 12;
export const DEFAULT_PADDING = 2;

/**
 * Build a HierNode tree from a flat list of FileData.
 *
 * Folder path segments become intermediate nodes; files become leaves.
 * The value of a leaf is its symbol count (minimum 1 so zero-symbol files
 * still appear).
 */
export function buildFolderTree(files: FileData[]): HierNode<NodePayload> {
  const root: MutableNode = {
    id: '/',
    data: { kind: 'folder', symbolCount: 0, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
    value: undefined,
    children: [],
  };

  for (const file of files) {
    const parts = file.filePath.replace(/^\//, '').split('/');
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const folderId = parts.slice(0, i + 1).join('/');
      let child = current.children.find(c => c.id === folderId);
      if (!child) {
        child = {
          id: folderId,
          data: { kind: 'folder', symbolCount: 0, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
          value: undefined,
          children: [],
        };
        current.children.push(child);
      }
      current = child;
    }

    const fileId = file.filePath;
    const topAttr = file.missionAttributions[0] ?? null;
    const leafData: NodePayload = {
      kind: 'file',
      filePath: file.filePath,
      symbolCount: file.symbols.length,
      recentActivityAt: file.recentActivityAt,
      missionIds: file.missionIds,
      dominantMissionId: file.dominantMissionId,
      dominantWeight: topAttr?.weight ?? 0,
    };
    current.children.push({
      id: fileId,
      data: leafData,
      value: Math.max(1, file.symbols.length),
      children: [],
    });
  }

  return freezeNode(root);
}

interface MutableNode {
  id: string;
  data: NodePayload;
  value: number | undefined;
  children: MutableNode[];
}

function freezeNode(node: MutableNode): HierNode<NodePayload> {
  const children: HierNode<NodePayload>[] = node.children.map(freezeNode);
  return {
    id: node.id,
    data: node.data,
    value: node.value,
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Return a sub-tree rooted at `folderId` by searching the given root
 * tree depth-first. Returns `root` itself when `folderId` is '/' or empty.
 */
export function subTreeAt(
  root: HierNode<NodePayload>,
  folderId: string,
): HierNode<NodePayload> | null {
  if (!folderId || folderId === '/') return root;
  if (root.id === folderId) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = subTreeAt(child, folderId);
    if (found) return found;
  }
  return null;
}

/** Pack config derived from BuildOptions. */
export function packConfig(opts: BuildOptions = {}): { padding: number; size: number } {
  return {
    padding: opts.padding ?? DEFAULT_PADDING,
    size: 500,
  };
}
