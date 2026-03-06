// ─── Tree Growth ────────────────────────────────────────
// Animated tree growing from seed using parametric L-system.
// Season affects color palette; growth is animated over time.

import type { ParamValue } from '../../../types/index.js';
import { NatureSimulation } from '../framework.js';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface Branch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  maxDepth: number;
  thickness: number;
}

interface SeasonPalette {
  trunk: string;
  leafBase: string;
  leafTip: string;
  ground: string;
  hasLeaves: boolean;
}

const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    trunk: '#5a3a1a',
    leafBase: '#88dd44',
    leafTip: '#bbff88',
    ground: '#2a5a2a',
    hasLeaves: true,
  },
  summer: {
    trunk: '#4a2a10',
    leafBase: '#228822',
    leafTip: '#44aa44',
    ground: '#1a4a1a',
    hasLeaves: true,
  },
  fall: {
    trunk: '#5a3a1a',
    leafBase: '#dd6622',
    leafTip: '#ff8844',
    ground: '#5a4a2a',
    hasLeaves: true,
  },
  winter: {
    trunk: '#6a5a4a',
    leafBase: '#6a5a4a',
    leafTip: '#8a7a6a',
    ground: '#ccccdd',
    hasLeaves: false,
  },
};

export class TreeGrowth extends NatureSimulation {
  private branches: Branch[] = [];
  private growthProgress = 0;
  private lastBuildKey = '';

  constructor() {
    super('tree-growth', {
      'growth-speed': 1,
      'branching-angle': 25,
      'branch-ratio': 0.7,
      'season': 'summer',
    });
  }

  /**
   * Generate all branches for the tree recursively.
   */
  private generateTree(
    x: number,
    y: number,
    angle: number,
    length: number,
    depth: number,
    maxDepth: number,
    branchAngle: number,
    branchRatio: number,
  ): void {
    if (depth > maxDepth || length < 2) return;

    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;
    const thickness = Math.max(1, (maxDepth - depth + 1) * 1.5);

    this.branches.push({ x1: x, y1: y, x2, y2, depth, maxDepth, thickness });

    const angleRad = (branchAngle * Math.PI) / 180;
    const childLength = length * branchRatio;

    // Left branch
    this.generateTree(x2, y2, angle - angleRad, childLength, depth + 1, maxDepth, branchAngle, branchRatio);
    // Right branch
    this.generateTree(x2, y2, angle + angleRad, childLength, depth + 1, maxDepth, branchAngle, branchRatio);
    // Sometimes a center branch for more organic look
    if (depth < maxDepth - 2) {
      this.generateTree(
        x2,
        y2,
        angle + (Math.sin(depth * 1.5) * angleRad * 0.3),
        childLength * 0.9,
        depth + 1,
        maxDepth,
        branchAngle,
        branchRatio,
      );
    }
  }

  private rebuildIfNeeded(): void {
    const angle = this.getNumParam('branching-angle');
    const ratio = this.getNumParam('branch-ratio');
    const key = `${angle}-${ratio}-${this.width}-${this.height}`;

    if (key === this.lastBuildKey) return;
    this.lastBuildKey = key;

    const w = this.width || 800;
    const h = this.height || 600;

    this.branches = [];
    const trunkLength = h * 0.22;
    const maxDepth = 8;

    // Start from bottom center, growing upward (angle = -PI/2)
    this.generateTree(w / 2, h * 0.85, -Math.PI / 2, trunkLength, 0, maxDepth, angle, ratio);
  }

  render(time: number, params: Map<string, ParamValue>): void {
    const ctx = this.ctx;
    if (!ctx) return;

    for (const [k, v] of params) {
      if (!this.simulationParams.has(k)) {
        this.simulationParams.set(k, v);
      }
    }

    this.rebuildIfNeeded();

    const growthSpeed = this.getNumParam('growth-speed');
    const season = this.getStringParam('season') as Season;
    const palette = SEASON_PALETTES[season] || SEASON_PALETTES.summer;

    const w = this.width;
    const h = this.height;
    const t = time / 1000;

    // Animate growth: progress goes from 0 to 1
    this.growthProgress = Math.min(1, this.growthProgress + growthSpeed * 0.005);
    const visibleCount = Math.floor(this.branches.length * this.growthProgress);

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (season === 'winter') {
      skyGrad.addColorStop(0, '#8899aa');
      skyGrad.addColorStop(1, '#bbccdd');
    } else {
      skyGrad.addColorStop(0, '#1a1a3e');
      skyGrad.addColorStop(1, '#2a3a5e');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Ground
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, h * 0.83, w, h * 0.17);

    // Draw branches
    for (let i = 0; i < visibleCount && i < this.branches.length; i++) {
      const branch = this.branches[i];
      const depthRatio = branch.depth / branch.maxDepth;

      // Trunk is brown, tips blend to leaf color
      if (depthRatio < 0.5) {
        ctx.strokeStyle = palette.trunk;
      } else {
        // Interpolate trunk → leaf
        const leafBlend = (depthRatio - 0.5) * 2;
        ctx.strokeStyle = palette.hasLeaves
          ? this.lerpColor(palette.trunk, palette.leafBase, leafBlend)
          : palette.trunk;
      }

      ctx.lineWidth = branch.thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(branch.x1, branch.y1);
      ctx.lineTo(branch.x2, branch.y2);
      ctx.stroke();

      // Draw leaves at terminal branches
      if (palette.hasLeaves && branch.depth >= branch.maxDepth - 1 && i < visibleCount) {
        const leafSize = 3 + Math.sin(t * 2 + i * 0.3) * 1;
        ctx.fillStyle = palette.leafTip;
        ctx.beginPath();
        ctx.arc(branch.x2, branch.y2, leafSize, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Gentle leaf sway at tips (animation detail)
    if (palette.hasLeaves && this.growthProgress >= 1) {
      for (let i = Math.max(0, this.branches.length - 50); i < this.branches.length; i++) {
        const branch = this.branches[i];
        if (branch.depth >= branch.maxDepth - 1) {
          const sway = Math.sin(t * 1.5 + i * 0.7) * 2;
          ctx.fillStyle = `rgba(${season === 'fall' ? '220,130,40' : '100,200,80'}, 0.5)`;
          ctx.beginPath();
          ctx.arc(branch.x2 + sway, branch.y2 + sway * 0.5, 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Info
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.fillText(`Season: ${season}  |  Growth: ${(this.growthProgress * 100).toFixed(0)}%`, 10, 20);
    ctx.fillText(
      `Angle: ${this.getNumParam('branching-angle').toFixed(0)} deg  |  Ratio: ${this.getNumParam('branch-ratio').toFixed(2)}`,
      10,
      36,
    );
    ctx.fillText(`Branches: ${visibleCount} / ${this.branches.length}`, 10, 52);
  }

  /**
   * Simple hex color lerp.
   */
  private lerpColor(a: string, b: string, t: number): string {
    const parseHex = (hex: string): [number, number, number] => {
      const c = hex.replace('#', '');
      return [
        parseInt(c.slice(0, 2), 16),
        parseInt(c.slice(2, 4), 16),
        parseInt(c.slice(4, 6), 16),
      ];
    };

    const [ar, ag, ab] = parseHex(a);
    const [br, bg, bb] = parseHex(b);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const blue = Math.round(ab + (bb - ab) * t);

    return `rgb(${r}, ${g}, ${blue})`;
  }
}
