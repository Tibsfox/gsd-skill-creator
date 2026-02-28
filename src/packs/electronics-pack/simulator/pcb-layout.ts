/**
 * PCB Layout Tool
 *
 * Trace impedance calculations, IPC-2221 trace width, skin depth,
 * crosstalk coupling, design rule checking, EMI assessment,
 * grid-based trace routing, and Gerber layer stack description.
 *
 * No external dependencies -- pure TypeScript calculations.
 *
 * Phase 277 Plan 01.
 */

// ============================================================================
// Types
// ============================================================================

export interface Trace {
  id: string;
  layer: string;
  points: { x: number; y: number }[];
  widthMil: number;
}

export interface Via {
  id: string;
  x: number;
  y: number;
  drillMil: number;
  annularRingMil: number;
}

export interface PCBComponent {
  id: string;
  refDes: string;
  x: number;
  y: number;
  footprint: string;
  pads: { x: number; y: number; widthMil: number; heightMil: number }[];
}

export interface Board {
  width: number;
  height: number;
  layers: number;
  traces: Trace[];
  components: PCBComponent[];
  vias: Via[];
}

export interface DesignRule {
  name: string;
  type: 'clearance' | 'trace_width' | 'via_drill' | 'annular_ring';
  minValue: number;
}

export interface DRCViolation {
  rule: string;
  type: string;
  severity: 'error' | 'warning';
  message: string;
  location: { x: number; y: number };
}

export interface GerberLayer {
  name: string;
  type: 'copper' | 'soldermask' | 'silkscreen' | 'paste' | 'drill';
  side: 'top' | 'bottom' | 'inner' | 'both';
}

export interface EMIResult {
  traceLengthMm: number;
  wavelengthMm: number;
  ratio: number;
  riskLevel: 'low' | 'moderate' | 'high';
  recommendation: string;
}

// ============================================================================
// 1. Microstrip impedance (H&H Ch.12)
// ============================================================================

/**
 * Calculate microstrip trace characteristic impedance.
 *
 * Z0 = (87 / sqrt(er + 1.41)) * ln(5.98 * h / (0.8 * w + t))
 *
 * @param w - trace width in mils
 * @param h - dielectric height in mils
 * @param t - copper thickness in mils
 * @param er - relative dielectric constant
 * @returns impedance in ohms
 */
export function calcMicrostripImpedance(
  w: number,
  h: number,
  t: number,
  er: number,
): number {
  if (w <= 0 || h <= 0 || t <= 0 || er <= 0) return NaN;
  const denom = 0.8 * w + t;
  if (denom <= 0) return NaN;
  const arg = (5.98 * h) / denom;
  if (arg <= 0) return NaN;
  return (87 / Math.sqrt(er + 1.41)) * Math.log(arg);
}

// ============================================================================
// 2. IPC-2221 trace width calculator
// ============================================================================

/**
 * Calculate minimum trace width for current carrying capacity.
 *
 * IPC-2221:
 *   area = (I / (k * dT^0.44))^(1/0.725)  [square mils]
 *   width = area / (thickness * 1.378)      [mils]
 *
 * k = 0.048 external, k = 0.024 internal.
 *
 * @param currentAmps - required current in amps
 * @param tempRiseC - acceptable temperature rise in celsius
 * @param copperThicknessMil - copper thickness in mils (1 oz ~ 1.4 mil)
 * @param isExternal - true for external (outer) layers
 * @returns trace width in mils
 */
export function calcTraceWidth(
  currentAmps: number,
  tempRiseC: number,
  copperThicknessMil: number,
  isExternal: boolean,
): number {
  const k = isExternal ? 0.048 : 0.024;
  const area = Math.pow(
    currentAmps / (k * Math.pow(tempRiseC, 0.44)),
    1 / 0.725,
  );
  return area / (copperThicknessMil * 1.378);
}

// ============================================================================
// 3. Skin depth
// ============================================================================

/**
 * Calculate skin depth for a conductor at a given frequency.
 *
 * delta = sqrt(rho / (pi * f * mu))
 *
 * @param frequencyHz - frequency in Hz
 * @param resistivityOhmM - resistivity in ohm-meters (copper: 1.68e-8)
 * @param permeability - magnetic permeability in H/m (free space: 4*pi*1e-7)
 * @returns skin depth in meters
 */
export function calcSkinDepth(
  frequencyHz: number,
  resistivityOhmM: number,
  permeability: number,
): number {
  return Math.sqrt(resistivityOhmM / (Math.PI * frequencyHz * permeability));
}

// ============================================================================
// 4. Crosstalk coupling coefficient
// ============================================================================

/**
 * Approximate coupling coefficient between adjacent traces.
 *
 * k = 1 / (1 + (d/h)^2)
 *
 * @param traceSpacingMil - center-to-center spacing in mils
 * @param dielectricHeightMil - dielectric height in mils
 * @returns coupling coefficient 0..1
 */
export function calcCrosstalk(
  traceSpacingMil: number,
  dielectricHeightMil: number,
): number {
  const ratio = traceSpacingMil / dielectricHeightMil;
  return 1 / (1 + ratio * ratio);
}

// ============================================================================
// 5. Design rule checker
// ============================================================================

/** Euclidean distance between two points */
function dist(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Minimum distance from point P to line segment AB.
 */
function pointToSegmentDist(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return dist(p, a);

  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const proj = { x: a.x + t * abx, y: a.y + t * aby };
  return dist(p, proj);
}

/**
 * Minimum distance between two line segments.
 */
function segmentToSegmentDist(
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number },
): number {
  return Math.min(
    pointToSegmentDist(a1, b1, b2),
    pointToSegmentDist(a2, b1, b2),
    pointToSegmentDist(b1, a1, a2),
    pointToSegmentDist(b2, a1, a2),
  );
}

/**
 * Check a board against design rules and return violations.
 */
export function checkDesignRules(
  board: Board,
  rules: DesignRule[],
): DRCViolation[] {
  const violations: DRCViolation[] = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'trace_width':
        for (const trace of board.traces) {
          if (trace.widthMil < rule.minValue) {
            const mid = trace.points[Math.floor(trace.points.length / 2)];
            violations.push({
              rule: rule.name,
              type: 'trace_width',
              severity: 'error',
              message: `Trace ${trace.id} width ${trace.widthMil} mil < minimum ${rule.minValue} mil`,
              location: { x: mid.x, y: mid.y },
            });
          }
        }
        break;

      case 'annular_ring':
        for (const via of board.vias) {
          if (via.annularRingMil < rule.minValue) {
            violations.push({
              rule: rule.name,
              type: 'annular_ring',
              severity: 'error',
              message: `Via ${via.id} annular ring ${via.annularRingMil} mil < minimum ${rule.minValue} mil`,
              location: { x: via.x, y: via.y },
            });
          }
        }
        break;

      case 'via_drill':
        for (const via of board.vias) {
          if (via.drillMil < rule.minValue) {
            violations.push({
              rule: rule.name,
              type: 'via_drill',
              severity: 'error',
              message: `Via ${via.id} drill ${via.drillMil} mil < minimum ${rule.minValue} mil`,
              location: { x: via.x, y: via.y },
            });
          }
        }
        break;

      case 'clearance':
        for (let i = 0; i < board.traces.length; i++) {
          for (let j = i + 1; j < board.traces.length; j++) {
            const tA = board.traces[i];
            const tB = board.traces[j];
            if (tA.layer !== tB.layer) continue;

            // Check all segment pairs between the two traces
            for (let si = 0; si < tA.points.length - 1; si++) {
              for (let sj = 0; sj < tB.points.length - 1; sj++) {
                const d = segmentToSegmentDist(
                  tA.points[si],
                  tA.points[si + 1],
                  tB.points[sj],
                  tB.points[sj + 1],
                );
                // Edge-to-edge clearance: subtract half-widths
                const edgeDist = d - (tA.widthMil + tB.widthMil) / 2;
                if (edgeDist < rule.minValue) {
                  const midX = (tA.points[si].x + tB.points[sj].x) / 2;
                  const midY = (tA.points[si].y + tB.points[sj].y) / 2;
                  violations.push({
                    rule: rule.name,
                    type: 'clearance',
                    severity: 'error',
                    message: `Traces ${tA.id} and ${tB.id} clearance ${edgeDist.toFixed(1)} mil < minimum ${rule.minValue} mil`,
                    location: { x: midX, y: midY },
                  });
                }
              }
            }
          }
        }
        break;
    }
  }

  return violations;
}

// ============================================================================
// 6. EMI assessment
// ============================================================================

/**
 * Estimate radiated emission risk based on trace geometry and frequency.
 *
 * A trace becomes a significant radiator when its length approaches
 * lambda/10 (wavelength / 10).
 *
 * @param traceLengthMm - trace length in millimeters
 * @param frequencyHz - signal frequency in Hz
 * @param currentAmps - signal current in amps
 * @returns EMI assessment result
 */
export function assessEMI(
  traceLengthMm: number,
  frequencyHz: number,
  currentAmps: number,
): EMIResult {
  const wavelengthMm = (3e8 / frequencyHz) * 1000;
  const ratio = traceLengthMm / wavelengthMm;

  let riskLevel: 'low' | 'moderate' | 'high';
  let recommendation: string;

  if (ratio < 0.01) {
    riskLevel = 'low';
    recommendation =
      'Trace is electrically short. Standard routing practices sufficient.';
  } else if (ratio < 0.05) {
    riskLevel = 'moderate';
    recommendation =
      'Consider ground plane and controlled impedance. Keep trace short and direct.';
  } else {
    riskLevel = 'high';
    recommendation =
      'Trace acts as antenna. Use ground plane, matched impedance, and series termination. Consider shielding.';
  }

  return {
    traceLengthMm,
    wavelengthMm,
    ratio,
    riskLevel,
    recommendation,
  };
}

// ============================================================================
// 7. Board creation
// ============================================================================

/**
 * Create an empty PCB board with given dimensions and layer count.
 */
export function createBoard(
  widthMil: number,
  heightMil: number,
  layers: number,
): Board {
  return {
    width: widthMil,
    height: heightMil,
    layers,
    traces: [],
    components: [],
    vias: [],
  };
}

// ============================================================================
// 8. Trace routing
// ============================================================================

/**
 * Route a trace between two points on a given layer.
 *
 * Returns a new board (immutable pattern) with the trace appended,
 * or an error if collision is detected with existing traces.
 */
export function routeTrace(
  board: Board,
  from: { x: number; y: number },
  to: { x: number; y: number },
  widthMil: number,
  layer: string,
): { board: Board; trace: Trace } | { error: string } {
  const traceId = `trace-${board.traces.length + 1}`;

  // Check collision with existing traces on same layer
  for (const existing of board.traces) {
    if (existing.layer !== layer) continue;

    for (let i = 0; i < existing.points.length - 1; i++) {
      const d = segmentToSegmentDist(
        from,
        to,
        existing.points[i],
        existing.points[i + 1],
      );
      const threshold = (existing.widthMil + widthMil) / 2;
      if (d < threshold) {
        return { error: `Trace collision on layer ${layer}` };
      }
    }
  }

  const trace: Trace = {
    id: traceId,
    layer,
    points: [from, to],
    widthMil,
  };

  return {
    board: {
      ...board,
      traces: [...board.traces, trace],
    },
    trace,
  };
}

// ============================================================================
// 9. Component placement
// ============================================================================

/**
 * Place a component on the board (immutable -- returns new board).
 */
export function placeComponent(
  board: Board,
  component: PCBComponent,
): Board {
  return {
    ...board,
    components: [...board.components, component],
  };
}

// ============================================================================
// 10. Gerber layer stack
// ============================================================================

/**
 * Describe the Gerber manufacturing layer stack for a given layer count.
 *
 * 2-layer: top/bottom copper, soldermask, silkscreen, paste, drill.
 * 4+ layer: adds inner copper layers.
 */
export function describeGerberLayers(layerCount: number): GerberLayer[] {
  const layers: GerberLayer[] = [];

  // Top copper
  layers.push({ name: 'top_copper', type: 'copper', side: 'top' });

  // Inner copper layers (for 4+ layer boards)
  if (layerCount > 2) {
    for (let i = 1; i <= layerCount - 2; i++) {
      layers.push({
        name: `inner${i}_copper`,
        type: 'copper',
        side: 'inner',
      });
    }
  }

  // Bottom copper
  layers.push({ name: 'bottom_copper', type: 'copper', side: 'bottom' });

  // Soldermask
  layers.push({ name: 'top_soldermask', type: 'soldermask', side: 'top' });
  layers.push({
    name: 'bottom_soldermask',
    type: 'soldermask',
    side: 'bottom',
  });

  // Silkscreen
  layers.push({ name: 'top_silkscreen', type: 'silkscreen', side: 'top' });
  layers.push({
    name: 'bottom_silkscreen',
    type: 'silkscreen',
    side: 'bottom',
  });

  // Paste
  layers.push({ name: 'top_paste', type: 'paste', side: 'top' });
  layers.push({ name: 'bottom_paste', type: 'paste', side: 'bottom' });

  // Drill
  layers.push({ name: 'drill', type: 'drill', side: 'both' });

  return layers;
}
