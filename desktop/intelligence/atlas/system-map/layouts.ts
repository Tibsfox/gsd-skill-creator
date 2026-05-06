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

// W4c tuning: padding 2 → 6 spreads siblings; cutoff 12 → 6 surfaces ~4×
// more labels at the same zoom level. Both still defaults — explicit
// SystemMapOptions overrides win.
export const DEFAULT_LABEL_CUTOFF_RADIUS = 6;
export const DEFAULT_PADDING = 6;

/**
 * Hard limit on projects accepted by buildFolderTreeMulti.
 * Exposed as a constant so callers (picker, tests) can reference it without
 * duplicating the magic number.
 */
export const MAX_MULTI_PROJECTS = 4;

/**
 * Build a HierNode tree from a flat list of FileData.
 *
 * Folder path segments become intermediate nodes; files become leaves.
 * The value of a leaf is its symbol count (minimum 1 so zero-symbol files
 * still appear).
 */
export function buildFolderTree(files: FileData[]): HierNode<NodePayload> {
  return freezeNode(buildMutableTree('/', files));
}

/**
 * Build a union HierNode tree from a Map of projectId → FileData[].
 *
 * Produces a synthetic root with one child pack per project. Each project
 * pack uses the projectId as its label. The per-project subtree is identical
 * to what buildFolderTree would produce for that project's files alone.
 *
 * Safety: returns null and logs a warning when projects.size > MAX_MULTI_PROJECTS.
 * Callers should check for null rather than let a too-large union silently slow
 * down layout. The picker enforces the limit before dispatch, so null here
 * is a defense-in-depth guard.
 */
export function buildFolderTreeMulti(
  projects: Map<string, FileData[]>,
): HierNode<NodePayload> | null {
  if (projects.size > MAX_MULTI_PROJECTS) {
    // eslint-disable-next-line no-console
    console.warn(
      `buildFolderTreeMulti: received ${projects.size} projects; ` +
      `MAX_MULTI_PROJECTS is ${MAX_MULTI_PROJECTS}. Returning null.`,
    );
    return null;
  }

  const syntheticRoot: MutableNode = {
    id: '/',
    data: { kind: 'folder', symbolCount: 0, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
    value: undefined,
    children: [],
  };

  for (const [projectId, files] of projects) {
    // Build the mutable inner tree (not yet frozen) so we can compose it safely.
    const projectInner = buildMutableTree(projectId, files);
    syntheticRoot.children.push(projectInner);
  }

  return freezeNode(syntheticRoot);
}

/** Shared mutable-tree builder used by both buildFolderTree and buildFolderTreeMulti. */
function buildMutableTree(rootId: string, files: FileData[]): MutableNode {
  const root: MutableNode = {
    id: rootId,
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
      // sqrt-mapping flattens the symbol-count disparity: a 100-symbol file
      // gets ~3.2× the area of a 10-symbol file, not 10×. Without this, a
      // single large file (e.g. ipc.ts at ~500 symbols) dominates its
      // sibling cluster and renders all neighbours as 1-pixel dots.
      value: Math.max(1, Math.sqrt(file.symbols.length)),
      children: [],
    });
  }

  return root;
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
