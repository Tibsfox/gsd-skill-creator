// Tree Growth — Nature Simulation
// L-system tree with branching angle parameter.
// Foundation: l-systems
//
// Uses a parametric L-system to grow a tree:
//   Axiom: "F"
//   Rule: "F" -> "FF+[+F-F-F]-[-F+F+F]"
//   Where:
//     F = draw forward
//     + = turn right by angle
//     - = turn left by angle
//     [ = push state (save position + heading)
//     ] = pop state (restore position + heading)
//
// The branching angle parameter controls the tree's shape.
// Season parameter changes colors.

import type { InteractiveParam, FoundationId } from '../../../types/index';
import type { CanvasManager } from '../../canvas';
import { NatureSimulation } from '../framework';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface TurtleState {
  x: number;
  y: number;
  angle: number; // radians
  depth: number;
}

export class TreeGrowth extends NatureSimulation {
  readonly id = 'tree-growth';
  readonly name = 'Tree Growth';
  readonly foundationId: FoundationId = 'l-systems';

  private canvasManager: CanvasManager | null = null;
  private rendererId: string | null = null;

  // Parameters
  private branchAngle = 25; // degrees
  private iterations = 4;
  private branchRatio = 0.7;
  private season: Season = 'summer';
  private growthProgress = 1.0; // 0-1, for animated growth

  // Computed L-system string
  private lSystemString = '';

  init(canvas: CanvasManager, rendererId: string): void {
    this.canvasManager = canvas;
    this.rendererId = rendererId;
    this.computeLSystem();
  }

  /**
   * Generate the L-system string by iterating the production rule.
   * Axiom: "F"
   * Rule: F -> "FF+[+F-F-F]-[-F+F+F]"
   * This produces a deterministic string after N iterations.
   */
  private computeLSystem(): void {
    let current = 'F';

    for (let i = 0; i < this.iterations; i++) {
      let next = '';
      for (const ch of current) {
        if (ch === 'F') {
          next += 'FF+[+F-F-F]-[-F+F+F]';
        } else {
          next += ch;
        }
      }
      current = next;

      // Safety: limit string length to prevent browser hang
      if (current.length > 500000) {
        break;
      }
    }

    this.lSystemString = current;
  }

  update(_deltaTime: number): void {
    // Static — the tree doesn't animate in update, it's re-drawn based on params
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);

    // Background based on season
    const bgColor = this.getSeasonBackground();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Ground
    const groundY = height * 0.88;
    const groundColor = this.getGroundColor();
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Render the L-system tree using turtle graphics
    const startX = width / 2;
    const startY = groundY;

    // Compute step length based on iterations
    const baseLen = height * 0.25 / Math.pow(2, this.iterations - 1);
    const angleRad = (this.branchAngle * Math.PI) / 180;

    const stack: TurtleState[] = [];
    let state: TurtleState = {
      x: startX,
      y: startY,
      angle: -Math.PI / 2, // start pointing up
      depth: 0,
    };

    const maxDepth = this.iterations * 3;
    // How many 'F' characters to draw (for growth animation)
    let fCount = 0;
    let totalF = 0;
    for (const ch of this.lSystemString) {
      if (ch === 'F') totalF++;
    }
    const drawUpToF = Math.floor(totalF * this.growthProgress);

    for (const ch of this.lSystemString) {
      switch (ch) {
        case 'F': {
          fCount++;
          if (fCount > drawUpToF) break;

          const len = baseLen * Math.pow(this.branchRatio, state.depth * 0.5);
          const nx = state.x + Math.cos(state.angle) * len;
          const ny = state.y + Math.sin(state.angle) * len;

          // Color based on depth and season
          const depthRatio = Math.min(1, state.depth / maxDepth);
          const lineColor = this.getBranchColor(depthRatio);
          const lineWidth = Math.max(0.5, (1 - depthRatio) * 4 + 0.5);

          ctx.strokeStyle = lineColor;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.moveTo(state.x, state.y);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          // Draw leaves at branch tips in appropriate seasons
          if (depthRatio > 0.7 && this.season !== 'winter') {
            const leafColor = this.getLeafColor();
            ctx.fillStyle = leafColor;
            ctx.beginPath();
            ctx.arc(nx, ny, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
          }

          state.x = nx;
          state.y = ny;
          break;
        }
        case '+':
          state.angle += angleRad;
          break;
        case '-':
          state.angle -= angleRad;
          break;
        case '[':
          stack.push({ ...state });
          state.depth++;
          break;
        case ']': {
          const popped = stack.pop();
          if (popped) {
            state = popped;
          }
          break;
        }
      }
    }

    // Readout
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Iterations: ${this.iterations}`, 10, 18);
    ctx.fillText(`Branch angle: ${this.branchAngle}\u00B0`, 10, 34);
    ctx.fillText(`String length: ${this.lSystemString.length}`, 10, 50);
    ctx.fillText(`Season: ${this.season}`, 10, 66);
  }

  private getSeasonBackground(): string {
    switch (this.season) {
      case 'spring': return '#1a2a1a';
      case 'summer': return '#0a1a2a';
      case 'fall': return '#2a1a0a';
      case 'winter': return '#1a1a2a';
    }
  }

  private getGroundColor(): string {
    switch (this.season) {
      case 'spring': return '#2d5a1a';
      case 'summer': return '#1a4a1a';
      case 'fall': return '#4a3a1a';
      case 'winter': return '#e8e8f0';
    }
  }

  private getBranchColor(depthRatio: number): string {
    // Trunk is dark brown, branches lighten with depth
    const r = Math.round(80 + depthRatio * 40);
    const g = Math.round(50 + depthRatio * 30);
    const b = Math.round(20 + depthRatio * 20);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private getLeafColor(): string {
    switch (this.season) {
      case 'spring': return `rgba(120, 200, 80, ${0.5 + Math.random() * 0.3})`;
      case 'summer': return `rgba(40, 160, 40, ${0.5 + Math.random() * 0.3})`;
      case 'fall': {
        const hue = 15 + Math.random() * 35; // orange to red
        return `hsla(${hue}, 80%, 50%, ${0.5 + Math.random() * 0.3})`;
      }
      case 'winter': return 'rgba(0,0,0,0)'; // no leaves
    }
  }

  getParams(): InteractiveParam[] {
    return [
      {
        name: 'branchAngle',
        label: 'Branch Angle',
        type: 'slider',
        min: 5,
        max: 60,
        step: 1,
        default: 25,
        unit: '\u00B0',
        description: 'Angle between branches in degrees',
      },
      {
        name: 'iterations',
        label: 'Iterations',
        type: 'slider',
        min: 1,
        max: 6,
        step: 1,
        default: 4,
        description: 'Number of L-system production rule applications',
      },
      {
        name: 'branchRatio',
        label: 'Branch Ratio',
        type: 'slider',
        min: 0.3,
        max: 1.0,
        step: 0.05,
        default: 0.7,
        description: 'Length ratio of child branches to parent',
      },
      {
        name: 'season',
        label: 'Season',
        type: 'select',
        default: 'summer',
        description: 'Visual season affecting colors: spring, summer, fall, winter',
      },
      {
        name: 'growthProgress',
        label: 'Growth',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.01,
        default: 1.0,
        description: 'How much of the tree has grown (0 = seed, 1 = full)',
      },
    ];
  }

  setParam(name: string, value: number | string | boolean): void {
    switch (name) {
      case 'branchAngle':
        if (typeof value === 'number') this.branchAngle = value;
        break;
      case 'iterations':
        if (typeof value === 'number') {
          this.iterations = Math.max(1, Math.min(6, Math.round(value)));
          this.computeLSystem();
        }
        break;
      case 'branchRatio':
        if (typeof value === 'number') this.branchRatio = value;
        break;
      case 'season':
        if (typeof value === 'string' && ['spring', 'summer', 'fall', 'winter'].includes(value)) {
          this.season = value as Season;
        }
        break;
      case 'growthProgress':
        if (typeof value === 'number') this.growthProgress = Math.max(0, Math.min(1, value));
        break;
    }
  }

  cleanup(): void {
    this.canvasManager = null;
    this.rendererId = null;
    this.lSystemString = '';
  }
}
