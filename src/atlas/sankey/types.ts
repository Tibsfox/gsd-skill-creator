export interface SankeyNode {
  id: string;
  label?: string;
  /** Assigned by layout: 0-based column index. */
  column?: number;
  /** Assigned by layout: pixel y-coordinate of node top. */
  y?: number;
  /** Assigned by layout: pixel x-coordinate of node left. */
  x?: number;
  /** Assigned by layout: pixel height of node rectangle. */
  height?: number;
  /** Assigned by layout: pixel width of node rectangle. */
  width?: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  /** Assigned by layout: pixel thickness of this link. */
  thickness?: number;
  /** Assigned by layout: y offset within source node. */
  sourceY?: number;
  /** Assigned by layout: y offset within target node. */
  targetY?: number;
}

export interface SankeyLayout {
  nodes: SankeyNode[];
  links: SankeyLink[];
  /** Total number of columns. */
  columns: number;
}
