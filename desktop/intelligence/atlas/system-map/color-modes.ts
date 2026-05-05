/**
 * System Map — color mode definitions.
 *
 * Three modes, each exporting a `colorFor(node, ctx)` function.
 * Uses the W0.5 linearScale for numeric ramps.
 * No D3 / external dependencies.
 */

import { linearScale } from '../../../../src/atlas/scales/index.js';
import type { CircleNode } from '../../../../src/atlas/pack-layout/index.js';
import type { NodePayload } from './layouts.js';

export type ColorMode = 'symbol-density' | 'recent-activity' | 'mission-attribution';

export interface ColorContext {
  /** Maximum symbol count across the entire tree (for normalization). */
  maxSymbolCount: number;
  /** Unix-ms of the most recent activity seen across any file (for normalization). */
  maxActivityAt: number;
  /** Oldest relevant activity cutoff in unix-ms (files older than this are "cold"). */
  minActivityAt: number;
  /** Maximum number of missions touching any single file. */
  maxMissionCount: number;
}

// Tokyo-Night-derived palette using CSS variables as fallbacks.
const COLD = '#24283b';    // --bg-secondary
const WARM_LOW = '#2d4a5f';
const WARM_HIGH = '#7aa2f7'; // --accent-blue
const HOT = '#ff9e64';       // --accent-orange
const FOLDER = '#1f2335';    // --bg-card

// ─── Symbol density (default) ────────────────────────────────────────────────

const densityScale = linearScale([0, 1], [0, 1]).clamp(true);

/** Interpolates between COLD and WARM_HIGH based on symbol density. */
function lerpHex(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const blue = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${blue})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

export function colorBySymbolDensity(
  node: CircleNode<NodePayload>,
  ctx: ColorContext,
): string {
  if (!node.data || node.data.kind === 'folder') return FOLDER;
  const t = densityScale.domain([0, Math.max(1, ctx.maxSymbolCount)])(
    node.data.symbolCount,
  );
  return lerpHex(COLD, WARM_HIGH, t);
}

// ─── Recent activity ─────────────────────────────────────────────────────────

export function colorByRecentActivity(
  node: CircleNode<NodePayload>,
  ctx: ColorContext,
): string {
  if (!node.data || node.data.kind === 'folder') return FOLDER;
  const ts = node.data.recentActivityAt ?? 0;
  if (ts === 0) return COLD;
  const range = Math.max(1, ctx.maxActivityAt - ctx.minActivityAt);
  const t = Math.max(0, Math.min(1, (ts - ctx.minActivityAt) / range));
  if (t < 0.5) return lerpHex(COLD, WARM_LOW, t * 2);
  return lerpHex(WARM_LOW, HOT, (t - 0.5) * 2);
}

// ─── Mission attribution ──────────────────────────────────────────────────────

export function colorByMissionAttribution(
  node: CircleNode<NodePayload>,
  ctx: ColorContext,
): string {
  if (!node.data || node.data.kind === 'folder') return FOLDER;
  const count = node.data.missionIds.length;
  if (count === 0) return COLD;
  const t = Math.max(0, Math.min(1, count / Math.max(1, ctx.maxMissionCount)));
  return lerpHex(WARM_LOW, HOT, t);
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function colorFor(
  mode: ColorMode,
  node: CircleNode<NodePayload>,
  ctx: ColorContext,
): string {
  switch (mode) {
    case 'symbol-density':
      return colorBySymbolDensity(node, ctx);
    case 'recent-activity':
      return colorByRecentActivity(node, ctx);
    case 'mission-attribution':
      return colorByMissionAttribution(node, ctx);
  }
}

/** Build a ColorContext from a flat list of node payloads. */
export function buildColorContext(nodes: Array<NodePayload | undefined>): ColorContext {
  let maxSymbolCount = 0;
  let maxActivityAt = 0;
  let minActivityAt = Number.MAX_SAFE_INTEGER;
  let maxMissionCount = 0;

  for (const n of nodes) {
    if (!n || n.kind === 'folder') continue;
    if (n.symbolCount > maxSymbolCount) maxSymbolCount = n.symbolCount;
    if (n.recentActivityAt && n.recentActivityAt > maxActivityAt) maxActivityAt = n.recentActivityAt;
    if (n.recentActivityAt && n.recentActivityAt < minActivityAt) minActivityAt = n.recentActivityAt;
    if (n.missionIds.length > maxMissionCount) maxMissionCount = n.missionIds.length;
  }

  if (minActivityAt === Number.MAX_SAFE_INTEGER) minActivityAt = 0;

  return { maxSymbolCount, maxActivityAt, minActivityAt, maxMissionCount };
}
