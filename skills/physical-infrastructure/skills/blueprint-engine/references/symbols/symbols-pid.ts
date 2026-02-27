/**
 * ISA-5.1 P&ID Symbol Library
 *
 * 50 SVG symbol definitions for Piping & Instrumentation Diagrams.
 * Each symbol is an SVG fragment (no <svg> wrapper) designed for use
 * inside an SVG <symbol> element with the specified viewBox.
 *
 * Categories: valve (11), pump (5), heat-exchanger (5), vessel (5),
 *             instrument (15), pipe-fitting (9)
 *
 * Standard: ISA-5.1 Instrumentation Symbols and Identification
 */

export type PidSymbolCategory =
  | 'valve' | 'pump' | 'heat-exchanger' | 'vessel'
  | 'instrument' | 'pipe-fitting' | 'line-type';

export interface PidSymbol {
  id: string;
  name: string;
  category: PidSymbolCategory;
  standard: 'ISA-5.1';
  viewBox: string;
  svgContent: string;
  connectionPoints: { id: string; x: number; y: number }[];
  tags: string[];
}

export interface PidLineType {
  id: string;
  name: string;
  svgStroke: string;
  svgStrokeWidth: number;
  svgStrokeDasharray?: string;
  standard: string;
}

// ---------------------------------------------------------------------------
// Helper: generate an instrument balloon symbol with a two-letter tag
// ---------------------------------------------------------------------------
function instrumentBalloon(id: string, name: string, tag: string, extraTags: string[]): PidSymbol {
  return {
    id,
    name,
    category: 'instrument',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 30',
    svgContent: `
    <circle cx="15" cy="15" r="12" fill="white" stroke="black" stroke-width="1.5"/>
    <text x="15" y="13" text-anchor="middle" font-size="6" font-family="Arial">${tag}</text>
    <line x1="3" y1="15" x2="27" y2="15" stroke="black" stroke-width="1"/>
    <text x="15" y="23" text-anchor="middle" font-size="5" font-family="Arial">---</text>
    `,
    connectionPoints: [
      { id: 'process', x: 50, y: 100 },
      { id: 'signal', x: 50, y: 0 },
    ],
    tags: extraTags,
  };
}

// ---------------------------------------------------------------------------
// PID_SYMBOLS: 50 ISA-5.1 symbol definitions
// ---------------------------------------------------------------------------
export const PID_SYMBOLS: Record<string, PidSymbol> = {

  // ========== VALVES (11) ==========

  'valve-gate': {
    id: 'valve-gate',
    name: 'Gate Valve',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="28" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <polygon points="12,10 28,20 12,30" fill="none" stroke="black" stroke-width="1.5"/>
    <polygon points="28,10 12,20 28,30" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="20" y1="10" x2="20" y2="4" stroke="black" stroke-width="1"/>
    <circle cx="20" cy="3" r="3" fill="none" stroke="black" stroke-width="1"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['gate', 'isolation', 'shutoff', 'manual', 'on-off'],
  },

  'valve-globe': {
    id: 'valve-globe',
    name: 'Globe Valve',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="28" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <circle cx="20" cy="20" r="8" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="12" y1="20" x2="28" y2="20" stroke="black" stroke-width="1"/>
    <line x1="20" y1="12" x2="20" y2="4" stroke="black" stroke-width="1"/>
    <circle cx="20" cy="3" r="3" fill="none" stroke="black" stroke-width="1"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['globe', 'throttling', 'regulating', 'flow-control'],
  },

  'valve-ball': {
    id: 'valve-ball',
    name: 'Ball Valve',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="28" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <polygon points="12,10 28,20 12,30" fill="none" stroke="black" stroke-width="1.5"/>
    <polygon points="28,10 12,20 28,30" fill="none" stroke="black" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="4" fill="black" stroke="black" stroke-width="1"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['ball', 'quarter-turn', 'on-off', 'isolation'],
  },

  'valve-butterfly': {
    id: 'valve-butterfly',
    name: 'Butterfly Valve',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="14" y2="20" stroke="black" stroke-width="2"/>
    <line x1="26" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <path d="M 14,12 Q 20,20 14,28" fill="none" stroke="black" stroke-width="1.5"/>
    <path d="M 26,12 Q 20,20 26,28" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="20" y1="12" x2="20" y2="4" stroke="black" stroke-width="1"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['butterfly', 'quarter-turn', 'throttling', 'large-bore'],
  },

  'valve-check-swing': {
    id: 'valve-check-swing',
    name: 'Check Valve (Swing)',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="28" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <polygon points="12,10 28,20 12,30" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="28" y1="10" x2="28" y2="30" stroke="black" stroke-width="1.5"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['check', 'swing', 'non-return', 'one-way'],
  },

  'valve-check-lift': {
    id: 'valve-check-lift',
    name: 'Check Valve (Lift)',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="28" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <polygon points="12,10 28,20 12,30" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="28" y1="10" x2="28" y2="30" stroke="black" stroke-width="1.5"/>
    <line x1="20" y1="10" x2="20" y2="4" stroke="black" stroke-width="1"/>
    <line x1="16" y1="4" x2="24" y2="4" stroke="black" stroke-width="1.5"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['check', 'lift', 'non-return', 'vertical'],
  },

  'valve-relief': {
    id: 'valve-relief',
    name: 'Relief / Safety Valve',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="28" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <polygon points="12,12 28,20 12,28" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="28" y1="12" x2="28" y2="28" stroke="black" stroke-width="1.5"/>
    <line x1="20" y1="12" x2="20" y2="2" stroke="black" stroke-width="1"/>
    <path d="M 16,6 L 20,2 L 24,6" fill="none" stroke="black" stroke-width="1"/>
    <line x1="16" y1="8" x2="24" y2="8" stroke="black" stroke-width="1"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['relief', 'safety', 'PSV', 'overpressure', 'spring-loaded'],
  },

  'valve-solenoid': {
    id: 'valve-solenoid',
    name: 'Solenoid Valve',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="24" x2="12" y2="24" stroke="black" stroke-width="2"/>
    <line x1="28" y1="24" x2="40" y2="24" stroke="black" stroke-width="2"/>
    <polygon points="12,16 28,24 12,32" fill="none" stroke="black" stroke-width="1.5"/>
    <polygon points="28,16 12,24 28,32" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="20" y1="16" x2="20" y2="10" stroke="black" stroke-width="1"/>
    <rect x="14" y="2" width="12" height="8" fill="none" stroke="black" stroke-width="1.5"/>
    <text x="20" y="9" text-anchor="middle" font-size="5" font-family="Arial">SOL</text>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 60 },
      { id: 'outlet', x: 100, y: 60 },
    ],
    tags: ['solenoid', 'electric', 'actuated', 'on-off', 'fast-acting'],
  },

  'valve-3way': {
    id: 'valve-3way',
    name: '3-Way Ball Valve',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="28" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <line x1="20" y1="28" x2="20" y2="40" stroke="black" stroke-width="2"/>
    <polygon points="12,12 20,20 12,28" fill="none" stroke="black" stroke-width="1.5"/>
    <polygon points="28,12 20,20 28,28" fill="none" stroke="black" stroke-width="1.5"/>
    <polygon points="12,28 20,20 28,28" fill="none" stroke="black" stroke-width="1.5"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet-a', x: 100, y: 50 },
      { id: 'outlet-b', x: 50, y: 100 },
    ],
    tags: ['3-way', 'diverting', 'mixing', 'ball'],
  },

  'valve-needle': {
    id: 'valve-needle',
    name: 'Needle Valve',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="28" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <polygon points="12,12 28,20 12,28" fill="none" stroke="black" stroke-width="1.5"/>
    <polygon points="28,12 12,20 28,28" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="20" y1="12" x2="20" y2="2" stroke="black" stroke-width="1"/>
    <polygon points="18,4 20,12 22,4" fill="black" stroke="black" stroke-width="0.5"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['needle', 'fine-adjustment', 'metering', 'throttling'],
  },

  'valve-plug': {
    id: 'valve-plug',
    name: 'Plug Valve',
    category: 'valve',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="28" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <polygon points="12,10 28,20 12,30" fill="none" stroke="black" stroke-width="1.5"/>
    <polygon points="28,10 12,20 28,30" fill="none" stroke="black" stroke-width="1.5"/>
    <rect x="18" y="14" width="4" height="12" fill="black" stroke="black" stroke-width="0.5"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['plug', 'quarter-turn', 'on-off', 'multi-port'],
  },

  // ========== PUMPS (5) ==========

  'pump-centrifugal': {
    id: 'pump-centrifugal',
    name: 'Centrifugal Pump',
    category: 'pump',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <circle cx="20" cy="22" r="14" fill="none" stroke="black" stroke-width="2"/>
    <line x1="20" y1="8" x2="20" y2="36" stroke="black" stroke-width="1"/>
    <line x1="6" y1="22" x2="34" y2="22" stroke="black" stroke-width="1"/>
    <line x1="0" y1="22" x2="6" y2="22" stroke="black" stroke-width="2"/>
    <line x1="20" y1="0" x2="20" y2="8" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'suction', x: 0, y: 55 },
      { id: 'discharge', x: 50, y: 0 },
    ],
    tags: ['centrifugal', 'pump', 'water', 'cooling', 'circulation'],
  },

  'pump-positive-displacement': {
    id: 'pump-positive-displacement',
    name: 'Positive Displacement Pump',
    category: 'pump',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <rect x="6" y="10" width="28" height="20" fill="none" stroke="black" stroke-width="2"/>
    <line x1="14" y1="14" x2="14" y2="26" stroke="black" stroke-width="1.5"/>
    <line x1="20" y1="14" x2="20" y2="26" stroke="black" stroke-width="1.5"/>
    <line x1="26" y1="14" x2="26" y2="26" stroke="black" stroke-width="1.5"/>
    <line x1="0" y1="20" x2="6" y2="20" stroke="black" stroke-width="2"/>
    <line x1="34" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'suction', x: 0, y: 50 },
      { id: 'discharge', x: 100, y: 50 },
    ],
    tags: ['positive-displacement', 'PD', 'reciprocating', 'metering'],
  },

  'pump-vacuum': {
    id: 'pump-vacuum',
    name: 'Vacuum Pump',
    category: 'pump',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <circle cx="20" cy="22" r="14" fill="none" stroke="black" stroke-width="2"/>
    <text x="20" y="26" text-anchor="middle" font-size="8" font-family="Arial" font-weight="bold">V</text>
    <line x1="0" y1="22" x2="6" y2="22" stroke="black" stroke-width="2"/>
    <line x1="20" y1="0" x2="20" y2="8" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'suction', x: 0, y: 55 },
      { id: 'discharge', x: 50, y: 0 },
    ],
    tags: ['vacuum', 'pump', 'negative-pressure', 'exhaust'],
  },

  'pump-sump': {
    id: 'pump-sump',
    name: 'Sump / Submersible Pump',
    category: 'pump',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 50',
    svgContent: `
    <line x1="0" y1="15" x2="40" y2="15" stroke="black" stroke-width="1" stroke-dasharray="4,2"/>
    <circle cx="20" cy="30" r="12" fill="none" stroke="black" stroke-width="2"/>
    <line x1="20" y1="18" x2="20" y2="42" stroke="black" stroke-width="1"/>
    <line x1="8" y1="30" x2="32" y2="30" stroke="black" stroke-width="1"/>
    <line x1="20" y1="0" x2="20" y2="18" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'discharge', x: 50, y: 0 },
      { id: 'inlet', x: 50, y: 100 },
    ],
    tags: ['sump', 'submersible', 'pit', 'drainage', 'below-grade'],
  },

  'pump-turbine': {
    id: 'pump-turbine',
    name: 'Turbine Pump',
    category: 'pump',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <circle cx="20" cy="22" r="14" fill="none" stroke="black" stroke-width="2"/>
    <path d="M 12,22 Q 16,16 20,22 Q 24,28 28,22" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="0" y1="22" x2="6" y2="22" stroke="black" stroke-width="2"/>
    <line x1="20" y1="0" x2="20" y2="8" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'suction', x: 0, y: 55 },
      { id: 'discharge', x: 50, y: 0 },
    ],
    tags: ['turbine', 'pump', 'deep-well', 'multi-stage'],
  },

  // ========== HEAT EXCHANGERS (5) ==========

  'hx-shell-tube': {
    id: 'hx-shell-tube',
    name: 'Shell-and-Tube Heat Exchanger',
    category: 'heat-exchanger',
    standard: 'ISA-5.1',
    viewBox: '0 0 60 30',
    svgContent: `
    <rect x="2" y="5" width="56" height="20" fill="none" stroke="black" stroke-width="2"/>
    <ellipse cx="2" cy="15" rx="3" ry="10" fill="none" stroke="black" stroke-width="1.5"/>
    <ellipse cx="58" cy="15" rx="3" ry="10" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="5" y1="10" x2="55" y2="10" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="5" y1="15" x2="55" y2="15" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="5" y1="20" x2="55" y2="20" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="0" y1="10" x2="2" y2="10" stroke="black" stroke-width="2"/>
    <line x1="0" y1="20" x2="2" y2="20" stroke="black" stroke-width="2"/>
    <line x1="58" y1="10" x2="60" y2="10" stroke="black" stroke-width="2"/>
    <line x1="58" y1="20" x2="60" y2="20" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'shell-inlet', x: 0, y: 33 },
      { id: 'shell-outlet', x: 0, y: 67 },
      { id: 'tube-inlet', x: 100, y: 33 },
      { id: 'tube-outlet', x: 100, y: 67 },
    ],
    tags: ['heat-exchanger', 'shell-tube', 'TEMA', 'cooling', 'heating'],
  },

  'hx-plate': {
    id: 'hx-plate',
    name: 'Plate Heat Exchanger',
    category: 'heat-exchanger',
    standard: 'ISA-5.1',
    viewBox: '0 0 60 30',
    svgContent: `
    <rect x="10" y="2" width="4" height="26" fill="none" stroke="black" stroke-width="1.5"/>
    <rect x="18" y="2" width="4" height="26" fill="none" stroke="black" stroke-width="1.5"/>
    <rect x="26" y="2" width="4" height="26" fill="none" stroke="black" stroke-width="1.5"/>
    <rect x="34" y="2" width="4" height="26" fill="none" stroke="black" stroke-width="1.5"/>
    <rect x="42" y="2" width="4" height="26" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="0" y1="8" x2="10" y2="8" stroke="black" stroke-width="2"/>
    <line x1="0" y1="22" x2="10" y2="22" stroke="black" stroke-width="2"/>
    <line x1="46" y1="8" x2="60" y2="8" stroke="black" stroke-width="2"/>
    <line x1="46" y1="22" x2="60" y2="22" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'hot-inlet', x: 0, y: 27 },
      { id: 'hot-outlet', x: 0, y: 73 },
      { id: 'cold-inlet', x: 100, y: 27 },
      { id: 'cold-outlet', x: 100, y: 73 },
    ],
    tags: ['heat-exchanger', 'plate', 'compact', 'gasketed', 'brazed'],
  },

  'hx-air-cooled': {
    id: 'hx-air-cooled',
    name: 'Air-Cooled Heat Exchanger',
    category: 'heat-exchanger',
    standard: 'ISA-5.1',
    viewBox: '0 0 60 30',
    svgContent: `
    <rect x="5" y="12" width="50" height="14" fill="none" stroke="black" stroke-width="2"/>
    <line x1="5" y1="18" x2="55" y2="18" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="5" y1="22" x2="55" y2="22" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <path d="M 22,10 L 25,4 L 28,10" fill="none" stroke="black" stroke-width="1.5"/>
    <path d="M 32,10 L 35,4 L 38,10" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="0" y1="15" x2="5" y2="15" stroke="black" stroke-width="2"/>
    <line x1="55" y1="15" x2="60" y2="15" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 100, y: 50 },
    ],
    tags: ['heat-exchanger', 'air-cooled', 'fin-fan', 'dry-cooler'],
  },

  'hx-u-tube': {
    id: 'hx-u-tube',
    name: 'U-Tube Heat Exchanger',
    category: 'heat-exchanger',
    standard: 'ISA-5.1',
    viewBox: '0 0 60 30',
    svgContent: `
    <rect x="2" y="5" width="56" height="20" fill="none" stroke="black" stroke-width="2"/>
    <path d="M 5,10 L 50,10 Q 55,10 55,15 Q 55,20 50,20 L 5,20" fill="none" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="0" y1="10" x2="2" y2="10" stroke="black" stroke-width="2"/>
    <line x1="0" y1="20" x2="2" y2="20" stroke="black" stroke-width="2"/>
    <line x1="58" y1="15" x2="60" y2="15" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'tube-in', x: 0, y: 33 },
      { id: 'tube-out', x: 0, y: 67 },
      { id: 'shell', x: 100, y: 50 },
    ],
    tags: ['heat-exchanger', 'u-tube', 'shell-tube', 'thermal-expansion'],
  },

  'hx-double-pipe': {
    id: 'hx-double-pipe',
    name: 'Double-Pipe Heat Exchanger',
    category: 'heat-exchanger',
    standard: 'ISA-5.1',
    viewBox: '0 0 60 30',
    svgContent: `
    <rect x="5" y="5" width="50" height="20" fill="none" stroke="black" stroke-width="2"/>
    <line x1="5" y1="15" x2="55" y2="15" stroke="black" stroke-width="1.5"/>
    <circle cx="10" cy="15" r="5" fill="none" stroke="black" stroke-width="1"/>
    <circle cx="50" cy="15" r="5" fill="none" stroke="black" stroke-width="1"/>
    <line x1="0" y1="10" x2="5" y2="10" stroke="black" stroke-width="2"/>
    <line x1="0" y1="20" x2="5" y2="20" stroke="black" stroke-width="2"/>
    <line x1="55" y1="10" x2="60" y2="10" stroke="black" stroke-width="2"/>
    <line x1="55" y1="20" x2="60" y2="20" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'inner-inlet', x: 0, y: 33 },
      { id: 'inner-outlet', x: 100, y: 33 },
      { id: 'outer-inlet', x: 0, y: 67 },
      { id: 'outer-outlet', x: 100, y: 67 },
    ],
    tags: ['heat-exchanger', 'double-pipe', 'hairpin', 'concentric'],
  },

  // ========== VESSELS (5) ==========

  'vessel-tank-open': {
    id: 'vessel-tank-open',
    name: 'Open Tank',
    category: 'vessel',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 50',
    svgContent: `
    <rect x="3" y="10" width="24" height="36" fill="none" stroke="black" stroke-width="2"/>
    <line x1="5" y1="25" x2="25" y2="25" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="0" y1="30" x2="3" y2="30" stroke="black" stroke-width="2"/>
    <line x1="27" y1="30" x2="30" y2="30" stroke="black" stroke-width="2"/>
    <line x1="15" y1="46" x2="15" y2="50" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 60 },
      { id: 'outlet', x: 100, y: 60 },
      { id: 'drain', x: 50, y: 100 },
    ],
    tags: ['tank', 'open', 'atmospheric', 'storage', 'reservoir'],
  },

  'vessel-tank-closed': {
    id: 'vessel-tank-closed',
    name: 'Closed / Pressure Tank',
    category: 'vessel',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 50',
    svgContent: `
    <path d="M 3,15 Q 3,5 15,5 Q 27,5 27,15" fill="none" stroke="black" stroke-width="2"/>
    <rect x="3" y="15" width="24" height="30" fill="none" stroke="black" stroke-width="2"/>
    <line x1="0" y1="30" x2="3" y2="30" stroke="black" stroke-width="2"/>
    <line x1="27" y1="30" x2="30" y2="30" stroke="black" stroke-width="2"/>
    <line x1="15" y1="45" x2="15" y2="50" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 60 },
      { id: 'outlet', x: 100, y: 60 },
      { id: 'drain', x: 50, y: 100 },
    ],
    tags: ['tank', 'closed', 'pressure-vessel', 'ASME', 'sealed'],
  },

  'vessel-accumulator': {
    id: 'vessel-accumulator',
    name: 'Accumulator',
    category: 'vessel',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 50',
    svgContent: `
    <path d="M 5,10 Q 5,2 15,2 Q 25,2 25,10" fill="none" stroke="black" stroke-width="2"/>
    <rect x="5" y="10" width="20" height="28" fill="none" stroke="black" stroke-width="2"/>
    <path d="M 5,38 Q 5,46 15,46 Q 25,46 25,38" fill="none" stroke="black" stroke-width="2"/>
    <line x1="0" y1="24" x2="5" y2="24" stroke="black" stroke-width="2"/>
    <line x1="15" y1="46" x2="15" y2="50" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 48 },
      { id: 'drain', x: 50, y: 100 },
    ],
    tags: ['accumulator', 'bladder', 'hydraulic', 'surge', 'pulsation-dampener'],
  },

  'vessel-separator': {
    id: 'vessel-separator',
    name: 'Separator',
    category: 'vessel',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 50',
    svgContent: `
    <rect x="3" y="5" width="24" height="40" fill="none" stroke="black" stroke-width="2"/>
    <line x1="6" y1="18" x2="24" y2="18" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="6" y1="28" x2="24" y2="28" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="0" y1="15" x2="3" y2="15" stroke="black" stroke-width="2"/>
    <line x1="27" y1="12" x2="30" y2="12" stroke="black" stroke-width="2"/>
    <line x1="27" y1="35" x2="30" y2="35" stroke="black" stroke-width="2"/>
    <line x1="15" y1="45" x2="15" y2="50" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 30 },
      { id: 'vapor-outlet', x: 100, y: 24 },
      { id: 'liquid-outlet', x: 100, y: 70 },
      { id: 'drain', x: 50, y: 100 },
    ],
    tags: ['separator', 'knockout', 'phase-separator', 'mist-eliminator'],
  },

  'vessel-strainer': {
    id: 'vessel-strainer',
    name: 'Y-Strainer',
    category: 'vessel',
    standard: 'ISA-5.1',
    viewBox: '0 0 40 40',
    svgContent: `
    <line x1="0" y1="15" x2="15" y2="15" stroke="black" stroke-width="2"/>
    <line x1="25" y1="15" x2="40" y2="15" stroke="black" stroke-width="2"/>
    <line x1="15" y1="15" x2="25" y2="15" stroke="black" stroke-width="2"/>
    <line x1="20" y1="15" x2="20" y2="35" stroke="black" stroke-width="1.5"/>
    <path d="M 14,18 L 20,35 L 26,18" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="16" y1="24" x2="24" y2="24" stroke="black" stroke-width="1" stroke-dasharray="2,1"/>
    <line x1="17" y1="28" x2="23" y2="28" stroke="black" stroke-width="1" stroke-dasharray="2,1"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 38 },
      { id: 'outlet', x: 100, y: 38 },
    ],
    tags: ['strainer', 'y-strainer', 'filter', 'debris', 'screen'],
  },

  'vessel-flash-tank': {
    id: 'vessel-flash-tank',
    name: 'Flash Tank',
    category: 'vessel',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 50',
    svgContent: `
    <rect x="3" y="10" width="24" height="35" fill="none" stroke="black" stroke-width="2"/>
    <line x1="5" y1="22" x2="25" y2="22" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="0" y1="30" x2="3" y2="30" stroke="black" stroke-width="2"/>
    <line x1="15" y1="10" x2="15" y2="5" stroke="black" stroke-width="2"/>
    <path d="M 11,8 Q 15,2 19,8" fill="none" stroke="black" stroke-width="1"/>
    <line x1="15" y1="45" x2="15" y2="50" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 60 },
      { id: 'vapor-out', x: 50, y: 0 },
      { id: 'liquid-out', x: 50, y: 100 },
    ],
    tags: ['flash-tank', 'flash-vessel', 'steam', 'condensate', 'low-pressure'],
  },

  // ========== INSTRUMENTS (15) ==========

  ...Object.fromEntries([
    ['instrument-TI', 'Temperature Indicator', 'TI', ['temperature', 'indicator', 'local', 'TI']],
    ['instrument-TT', 'Temperature Transmitter', 'TT', ['temperature', 'transmitter', 'remote', 'TT']],
    ['instrument-TC', 'Temperature Controller', 'TC', ['temperature', 'controller', 'TC', 'control-loop']],
    ['instrument-PI', 'Pressure Indicator', 'PI', ['pressure', 'indicator', 'gauge', 'PI']],
    ['instrument-PT', 'Pressure Transmitter', 'PT', ['pressure', 'transmitter', 'remote', 'PT']],
    ['instrument-PC', 'Pressure Controller', 'PC', ['pressure', 'controller', 'PC', 'control-loop']],
    ['instrument-FI', 'Flow Indicator', 'FI', ['flow', 'indicator', 'local', 'FI']],
    ['instrument-FT', 'Flow Transmitter', 'FT', ['flow', 'transmitter', 'remote', 'FT']],
    ['instrument-FC', 'Flow Controller', 'FC', ['flow', 'controller', 'FC', 'control-loop']],
    ['instrument-LI', 'Level Indicator', 'LI', ['level', 'indicator', 'local', 'LI']],
    ['instrument-LT', 'Level Transmitter', 'LT', ['level', 'transmitter', 'remote', 'LT']],
    ['instrument-LC', 'Level Controller', 'LC', ['level', 'controller', 'LC', 'control-loop']],
    ['instrument-FCV', 'Flow Control Valve', 'FCV', ['flow', 'control-valve', 'FCV', 'final-element']],
    ['instrument-PCV', 'Pressure Control Valve', 'PCV', ['pressure', 'control-valve', 'PCV', 'final-element']],
    ['instrument-HIC', 'Hand Indicating Controller', 'HIC', ['hand', 'indicating', 'controller', 'HIC', 'manual']],
  ].map(([id, name, tag, tags]) => [id, instrumentBalloon(id, name as string, tag as string, tags as string[])])),

  // ========== PIPE FITTINGS (9) ==========

  'fitting-elbow-90': {
    id: 'fitting-elbow-90',
    name: '90-Degree Elbow',
    category: 'pipe-fitting',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="0" y1="15" x2="15" y2="15" stroke="black" stroke-width="2"/>
    <line x1="15" y1="0" x2="15" y2="15" stroke="black" stroke-width="2"/>
    <path d="M 7,15 Q 15,15 15,7" fill="none" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 50 },
      { id: 'outlet', x: 50, y: 0 },
    ],
    tags: ['elbow', '90-degree', 'bend', 'turn'],
  },

  'fitting-elbow-45': {
    id: 'fitting-elbow-45',
    name: '45-Degree Elbow',
    category: 'pipe-fitting',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="0" y1="20" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="12" y1="20" x2="25" y2="7" stroke="black" stroke-width="2"/>
    <path d="M 8,20 Q 12,20 17,14" fill="none" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'inlet', x: 0, y: 67 },
      { id: 'outlet', x: 83, y: 23 },
    ],
    tags: ['elbow', '45-degree', 'bend', 'gradual'],
  },

  'fitting-tee': {
    id: 'fitting-tee',
    name: 'Tee Junction',
    category: 'pipe-fitting',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="0" y1="15" x2="30" y2="15" stroke="black" stroke-width="2"/>
    <line x1="15" y1="15" x2="15" y2="30" stroke="black" stroke-width="2"/>
    <circle cx="15" cy="15" r="3" fill="black" stroke="black" stroke-width="1"/>
    `,
    connectionPoints: [
      { id: 'run-in', x: 0, y: 50 },
      { id: 'run-out', x: 100, y: 50 },
      { id: 'branch', x: 50, y: 100 },
    ],
    tags: ['tee', 'junction', 'branch', 'T-connection'],
  },

  'fitting-reducer': {
    id: 'fitting-reducer',
    name: 'Concentric Reducer',
    category: 'pipe-fitting',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="0" y1="10" x2="0" y2="20" stroke="black" stroke-width="2"/>
    <line x1="30" y1="12" x2="30" y2="18" stroke="black" stroke-width="2"/>
    <line x1="0" y1="10" x2="30" y2="12" stroke="black" stroke-width="1.5"/>
    <line x1="0" y1="20" x2="30" y2="18" stroke="black" stroke-width="1.5"/>
    `,
    connectionPoints: [
      { id: 'large-end', x: 0, y: 50 },
      { id: 'small-end', x: 100, y: 50 },
    ],
    tags: ['reducer', 'concentric', 'pipe-size-change', 'transition'],
  },

  'fitting-union': {
    id: 'fitting-union',
    name: 'Union',
    category: 'pipe-fitting',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="0" y1="15" x2="12" y2="15" stroke="black" stroke-width="2"/>
    <line x1="18" y1="15" x2="30" y2="15" stroke="black" stroke-width="2"/>
    <line x1="12" y1="10" x2="12" y2="20" stroke="black" stroke-width="2"/>
    <line x1="18" y1="10" x2="18" y2="20" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'side-a', x: 0, y: 50 },
      { id: 'side-b', x: 100, y: 50 },
    ],
    tags: ['union', 'disconnect', 'maintenance', 'separable'],
  },

  'fitting-flange': {
    id: 'fitting-flange',
    name: 'Flanged Connection',
    category: 'pipe-fitting',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="0" y1="15" x2="13" y2="15" stroke="black" stroke-width="2"/>
    <line x1="17" y1="15" x2="30" y2="15" stroke="black" stroke-width="2"/>
    <line x1="13" y1="8" x2="13" y2="22" stroke="black" stroke-width="2.5"/>
    <line x1="17" y1="8" x2="17" y2="22" stroke="black" stroke-width="2.5"/>
    `,
    connectionPoints: [
      { id: 'side-a', x: 0, y: 50 },
      { id: 'side-b', x: 100, y: 50 },
    ],
    tags: ['flange', 'bolted', 'ANSI', 'gasket', 'removable'],
  },

  'fitting-cap': {
    id: 'fitting-cap',
    name: 'Pipe Cap',
    category: 'pipe-fitting',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="0" y1="15" x2="18" y2="15" stroke="black" stroke-width="2"/>
    <path d="M 18,8 Q 26,8 26,15 Q 26,22 18,22" fill="none" stroke="black" stroke-width="2"/>
    <line x1="18" y1="8" x2="18" y2="22" stroke="black" stroke-width="1.5"/>
    `,
    connectionPoints: [
      { id: 'open-end', x: 0, y: 50 },
    ],
    tags: ['cap', 'end-cap', 'dead-end', 'closure'],
  },

  'fitting-blind-flange': {
    id: 'fitting-blind-flange',
    name: 'Blind Flange',
    category: 'pipe-fitting',
    standard: 'ISA-5.1',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="0" y1="15" x2="13" y2="15" stroke="black" stroke-width="2"/>
    <line x1="13" y1="8" x2="13" y2="22" stroke="black" stroke-width="2.5"/>
    <rect x="15" y="8" width="8" height="14" fill="black" stroke="black" stroke-width="1"/>
    `,
    connectionPoints: [
      { id: 'pipe-end', x: 0, y: 50 },
    ],
    tags: ['blind-flange', 'blank', 'isolation', 'dead-end', 'bolted'],
  },

};

// ---------------------------------------------------------------------------
// PID_LINE_TYPES: 3 ISA-5.1 line type definitions
// ---------------------------------------------------------------------------
export const PID_LINE_TYPES: Record<string, PidLineType> = {

  'process-pipe': {
    id: 'process-pipe',
    name: 'Process Pipe / Main Stream',
    svgStroke: '#000000',
    svgStrokeWidth: 2,
    standard: 'ISA-5.1 Figure 1 -- Line Type 1',
  },

  'instrument-signal': {
    id: 'instrument-signal',
    name: 'Instrument Signal (Undefined)',
    svgStroke: '#000000',
    svgStrokeWidth: 1,
    svgStrokeDasharray: '5,3',
    standard: 'ISA-5.1 Figure 1 -- Line Type 2',
  },

  'electrical-signal': {
    id: 'electrical-signal',
    name: 'Electrical Signal',
    svgStroke: '#000000',
    svgStrokeWidth: 1.5,
    svgStrokeDasharray: '2,3,8,3',
    standard: 'ISA-5.1 Figure 1 -- Line Type 3',
  },

};
