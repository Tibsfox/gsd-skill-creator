/**
 * IEEE Standard Electrical Symbol Library
 *
 * 30 SVG symbol definitions for Single-Line Electrical Diagrams (SLDs).
 * Each symbol is an SVG fragment (no <svg> wrapper) designed for use
 * inside an SVG <symbol> element with the specified viewBox.
 *
 * Categories: source (7), protection (6), distribution (6), load (5), instrument (6)
 *
 * Standards: IEEE Std 315-1975, NEMA ICS 19
 */

export type ElecSymbolCategory =
  | 'source' | 'protection' | 'distribution' | 'load' | 'instrument';

export interface ElecSymbol {
  id: string;
  name: string;
  category: ElecSymbolCategory;
  standard: string;
  voltageClass?: string;
  viewBox: string;
  svgContent: string;
  connectionPoints: { id: string; x: number; y: number; phase?: string }[];
  tags: string[];
}

export interface ElecLineType {
  id: string;
  name: string;
  svgStroke: string;
  svgStrokeWidth: number;
  svgStrokeDasharray?: string;
  color?: string;
  standard: string;
}

// ---------------------------------------------------------------------------
// Helper: generate a metering instrument symbol (circle with letter label)
// ---------------------------------------------------------------------------
function meterSymbol(
  id: string, name: string, label: string, extraTags: string[],
): ElecSymbol {
  return {
    id,
    name,
    category: 'instrument',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="0" y1="15" x2="7" y2="15" stroke="black" stroke-width="1.5"/>
    <line x1="23" y1="15" x2="30" y2="15" stroke="black" stroke-width="1.5"/>
    <circle cx="15" cy="15" r="8" fill="white" stroke="black" stroke-width="1.5"/>
    <text x="15" y="19" text-anchor="middle" font-size="8" font-family="Arial" font-weight="bold">${label}</text>
    `,
    connectionPoints: [
      { id: 'in', x: 0, y: 50 },
      { id: 'out', x: 100, y: 50 },
    ],
    tags: extraTags,
  };
}

// ---------------------------------------------------------------------------
// ELEC_SYMBOLS: 30 IEEE electrical symbol definitions
// ---------------------------------------------------------------------------
export const ELEC_SYMBOLS: Record<string, ElecSymbol> = {

  // ========== SOURCES (7) ==========

  'transformer-2winding': {
    id: 'transformer-2winding',
    name: '2-Winding Transformer',
    category: 'source',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 50 30',
    svgContent: `
    <path d="M 5,15 Q 10,8 15,15 Q 20,22 25,15" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="8" x2="25" y2="22" stroke="black" stroke-width="1"/>
    <path d="M 25,15 Q 30,8 35,15 Q 40,22 45,15" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="0" y1="15" x2="5" y2="15" stroke="black" stroke-width="2"/>
    <line x1="45" y1="15" x2="50" y2="15" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'primary', x: 0, y: 50 },
      { id: 'secondary', x: 100, y: 50 },
    ],
    tags: ['transformer', '2-winding', 'isolation', 'step-down', 'step-up'],
  },

  'generator-ac': {
    id: 'generator-ac',
    name: 'AC Generator',
    category: 'source',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 40',
    svgContent: `
    <circle cx="20" cy="20" r="16" fill="none" stroke="black" stroke-width="2"/>
    <text x="20" y="18" text-anchor="middle" font-size="9" font-family="Arial" font-weight="bold">G</text>
    <text x="20" y="28" text-anchor="middle" font-size="7" font-family="Arial">~</text>
    <line x1="20" y1="36" x2="20" y2="40" stroke="black" stroke-width="2"/>
    <line x1="20" y1="0" x2="20" y2="4" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'output', x: 50, y: 0 },
      { id: 'neutral', x: 50, y: 100 },
    ],
    tags: ['generator', 'AC', 'alternator', 'standby', 'prime-mover'],
  },

  'solar-panel': {
    id: 'solar-panel',
    name: 'Solar PV Panel',
    category: 'source',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 30',
    svgContent: `
    <rect x="3" y="3" width="34" height="24" fill="none" stroke="black" stroke-width="2"/>
    <line x1="3" y1="3" x2="37" y2="27" stroke="black" stroke-width="1"/>
    <line x1="3" y1="15" x2="37" y2="15" stroke="black" stroke-width="0.5"/>
    <line x1="20" y1="3" x2="20" y2="27" stroke="black" stroke-width="0.5"/>
    <line x1="20" y1="0" x2="20" y2="3" stroke="black" stroke-width="2"/>
    <line x1="20" y1="27" x2="20" y2="30" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'positive', x: 50, y: 0 },
      { id: 'negative', x: 50, y: 100 },
    ],
    tags: ['solar', 'PV', 'photovoltaic', 'panel', 'renewable', 'DC'],
  },

  'battery-bank': {
    id: 'battery-bank',
    name: 'Battery Bank',
    category: 'source',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 30',
    svgContent: `
    <line x1="0" y1="15" x2="6" y2="15" stroke="black" stroke-width="2"/>
    <line x1="6" y1="5" x2="6" y2="25" stroke="black" stroke-width="2"/>
    <line x1="10" y1="9" x2="10" y2="21" stroke="black" stroke-width="1"/>
    <line x1="14" y1="5" x2="14" y2="25" stroke="black" stroke-width="2"/>
    <line x1="18" y1="9" x2="18" y2="21" stroke="black" stroke-width="1"/>
    <line x1="22" y1="5" x2="22" y2="25" stroke="black" stroke-width="2"/>
    <line x1="26" y1="9" x2="26" y2="21" stroke="black" stroke-width="1"/>
    <line x1="30" y1="5" x2="30" y2="25" stroke="black" stroke-width="2"/>
    <line x1="34" y1="9" x2="34" y2="21" stroke="black" stroke-width="1"/>
    <line x1="34" y1="15" x2="40" y2="15" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'positive', x: 0, y: 50 },
      { id: 'negative', x: 100, y: 50 },
    ],
    tags: ['battery', 'bank', 'energy-storage', 'BESS', 'DC', 'UPS-battery'],
  },

  'utility-service': {
    id: 'utility-service',
    name: 'Utility Service Entry',
    category: 'source',
    standard: 'IEEE Std 315-1975',
    voltageClass: 'MV',
    viewBox: '0 0 40 40',
    svgContent: `
    <polygon points="20,2 36,18 20,34 4,18" fill="none" stroke="black" stroke-width="2"/>
    <text x="20" y="17" text-anchor="middle" font-size="5" font-family="Arial">UTIL</text>
    <text x="20" y="24" text-anchor="middle" font-size="5" font-family="Arial">kV</text>
    <line x1="20" y1="34" x2="20" y2="40" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'service', x: 50, y: 100 },
    ],
    tags: ['utility', 'service', 'entry', 'mains', 'power-company', 'grid'],
  },

  'transformer-3winding': {
    id: 'transformer-3winding',
    name: '3-Winding Transformer',
    category: 'source',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 60 40',
    svgContent: `
    <path d="M 5,12 Q 10,5 15,12 Q 20,19 25,12" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="5" x2="25" y2="35" stroke="black" stroke-width="1"/>
    <path d="M 25,12 Q 30,5 35,12 Q 40,19 45,12" fill="none" stroke="black" stroke-width="1.5"/>
    <path d="M 25,28 Q 30,21 35,28 Q 40,35 45,28" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="0" y1="12" x2="5" y2="12" stroke="black" stroke-width="2"/>
    <line x1="45" y1="12" x2="60" y2="12" stroke="black" stroke-width="2"/>
    <line x1="45" y1="28" x2="60" y2="28" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'primary', x: 0, y: 30 },
      { id: 'secondary-1', x: 100, y: 30 },
      { id: 'secondary-2', x: 100, y: 70 },
    ],
    tags: ['transformer', '3-winding', 'delta-wye-wye', 'multi-secondary'],
  },

  'capacitor-bank': {
    id: 'capacitor-bank',
    name: 'Capacitor Bank',
    category: 'source',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 30 30',
    svgContent: `
    <line x1="15" y1="0" x2="15" y2="10" stroke="black" stroke-width="2"/>
    <line x1="5" y1="10" x2="25" y2="10" stroke="black" stroke-width="2"/>
    <line x1="5" y1="14" x2="25" y2="14" stroke="black" stroke-width="2"/>
    <line x1="15" y1="14" x2="15" y2="24" stroke="black" stroke-width="2"/>
    <text x="15" y="30" text-anchor="middle" font-size="5" font-family="Arial">CAP</text>
    `,
    connectionPoints: [
      { id: 'line', x: 50, y: 0 },
      { id: 'neutral', x: 50, y: 80 },
    ],
    tags: ['capacitor', 'bank', 'power-factor', 'correction', 'VAR'],
  },

  // ========== PROTECTION (6) ==========

  'breaker-1pole': {
    id: 'breaker-1pole',
    name: '1-Pole Circuit Breaker',
    category: 'protection',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 20 40',
    svgContent: `
    <line x1="10" y1="0" x2="10" y2="14" stroke="black" stroke-width="2"/>
    <line x1="5" y1="17" x2="15" y2="23" stroke="black" stroke-width="1.5"/>
    <line x1="15" y1="17" x2="5" y2="23" stroke="black" stroke-width="1.5"/>
    <line x1="10" y1="26" x2="10" y2="40" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'line', x: 50, y: 0 },
      { id: 'load', x: 50, y: 100 },
    ],
    tags: ['breaker', '1-pole', 'MCB', 'overcurrent', 'protection', 'single-phase'],
  },

  'breaker-3pole': {
    id: 'breaker-3pole',
    name: '3-Pole Circuit Breaker',
    category: 'protection',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 50',
    svgContent: `
    <line x1="10" y1="0" x2="10" y2="15" stroke="black" stroke-width="2"/>
    <line x1="20" y1="0" x2="20" y2="15" stroke="black" stroke-width="2"/>
    <line x1="30" y1="0" x2="30" y2="15" stroke="black" stroke-width="2"/>
    <line x1="7" y1="18" x2="13" y2="24" stroke="black" stroke-width="1.5"/>
    <line x1="13" y1="18" x2="7" y2="24" stroke="black" stroke-width="1.5"/>
    <line x1="17" y1="18" x2="23" y2="24" stroke="black" stroke-width="1.5"/>
    <line x1="23" y1="18" x2="17" y2="24" stroke="black" stroke-width="1.5"/>
    <line x1="27" y1="18" x2="33" y2="24" stroke="black" stroke-width="1.5"/>
    <line x1="33" y1="18" x2="27" y2="24" stroke="black" stroke-width="1.5"/>
    <line x1="7" y1="21" x2="33" y2="21" stroke="black" stroke-width="1" stroke-dasharray="2,1"/>
    <line x1="10" y1="24" x2="10" y2="50" stroke="black" stroke-width="2"/>
    <line x1="20" y1="24" x2="20" y2="50" stroke="black" stroke-width="2"/>
    <line x1="30" y1="24" x2="30" y2="50" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'line-A', x: 25, y: 0, phase: 'A' },
      { id: 'line-B', x: 50, y: 0, phase: 'B' },
      { id: 'line-C', x: 75, y: 0, phase: 'C' },
      { id: 'load-A', x: 25, y: 100, phase: 'A' },
      { id: 'load-B', x: 50, y: 100, phase: 'B' },
      { id: 'load-C', x: 75, y: 100, phase: 'C' },
    ],
    tags: ['breaker', '3-pole', 'MCCB', 'MCB', 'overcurrent', 'protection', '3-phase'],
  },

  'fuse': {
    id: 'fuse',
    name: 'Fuse',
    category: 'protection',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 30 20',
    svgContent: `
    <line x1="0" y1="10" x2="8" y2="10" stroke="black" stroke-width="2"/>
    <rect x="8" y="5" width="14" height="10" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="8" y1="10" x2="22" y2="10" stroke="black" stroke-width="1"/>
    <line x1="22" y1="10" x2="30" y2="10" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'line', x: 0, y: 50 },
      { id: 'load', x: 100, y: 50 },
    ],
    tags: ['fuse', 'overcurrent', 'protection', 'cartridge', 'HRC'],
  },

  'disconnect-switch': {
    id: 'disconnect-switch',
    name: 'Disconnect Switch',
    category: 'protection',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 30 40',
    svgContent: `
    <line x1="15" y1="0" x2="15" y2="12" stroke="black" stroke-width="2"/>
    <line x1="15" y1="12" x2="25" y2="26" stroke="black" stroke-width="2"/>
    <circle cx="15" cy="28" r="2" fill="black" stroke="black" stroke-width="1"/>
    <line x1="15" y1="30" x2="15" y2="40" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'line', x: 50, y: 0 },
      { id: 'load', x: 50, y: 100 },
    ],
    tags: ['disconnect', 'switch', 'isolator', 'lockout', 'blade'],
  },

  'gfci-receptacle': {
    id: 'gfci-receptacle',
    name: 'GFCI Receptacle',
    category: 'protection',
    standard: 'NEMA ICS 19',
    viewBox: '0 0 30 30',
    svgContent: `
    <rect x="3" y="3" width="24" height="24" fill="none" stroke="black" stroke-width="1.5"/>
    <text x="15" y="15" text-anchor="middle" font-size="6" font-family="Arial" font-weight="bold">GFCI</text>
    <circle cx="10" cy="21" r="2" fill="none" stroke="black" stroke-width="1"/>
    <circle cx="20" cy="21" r="2" fill="none" stroke="black" stroke-width="1"/>
    <line x1="15" y1="0" x2="15" y2="3" stroke="black" stroke-width="1.5"/>
    `,
    connectionPoints: [
      { id: 'feed', x: 50, y: 0 },
    ],
    tags: ['GFCI', 'receptacle', 'ground-fault', 'outlet', 'safety'],
  },

  'surge-protector': {
    id: 'surge-protector',
    name: 'Surge Protective Device',
    category: 'protection',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 30 40',
    svgContent: `
    <line x1="15" y1="0" x2="15" y2="8" stroke="black" stroke-width="2"/>
    <polygon points="8,8 22,8 15,24" fill="none" stroke="black" stroke-width="1.5"/>
    <text x="15" y="20" text-anchor="middle" font-size="5" font-family="Arial">SPD</text>
    <line x1="8" y1="28" x2="22" y2="28" stroke="black" stroke-width="2"/>
    <line x1="10" y1="31" x2="20" y2="31" stroke="black" stroke-width="1.5"/>
    <line x1="12" y1="34" x2="18" y2="34" stroke="black" stroke-width="1"/>
    <line x1="15" y1="24" x2="15" y2="28" stroke="black" stroke-width="1.5"/>
    `,
    connectionPoints: [
      { id: 'line', x: 50, y: 0 },
      { id: 'ground', x: 50, y: 85 },
    ],
    tags: ['surge', 'protector', 'SPD', 'TVSS', 'lightning', 'transient'],
  },

  // ========== DISTRIBUTION (6) ==========

  'busbar': {
    id: 'busbar',
    name: 'Busbar / Bus Duct',
    category: 'distribution',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 80 20',
    svgContent: `
    <line x1="0" y1="10" x2="80" y2="10" stroke="black" stroke-width="4"/>
    <line x1="15" y1="10" x2="15" y2="20" stroke="black" stroke-width="2"/>
    <line x1="30" y1="10" x2="30" y2="20" stroke="black" stroke-width="2"/>
    <line x1="45" y1="10" x2="45" y2="20" stroke="black" stroke-width="2"/>
    <line x1="60" y1="10" x2="60" y2="20" stroke="black" stroke-width="2"/>
    <line x1="40" y1="0" x2="40" y2="10" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'source', x: 50, y: 0 },
      { id: 'tap-1', x: 19, y: 100 },
      { id: 'tap-2', x: 38, y: 100 },
      { id: 'tap-3', x: 56, y: 100 },
      { id: 'tap-4', x: 75, y: 100 },
    ],
    tags: ['busbar', 'bus', 'bus-duct', 'distribution', 'main'],
  },

  'pdu-rack': {
    id: 'pdu-rack',
    name: 'Rack PDU',
    category: 'distribution',
    standard: 'NEMA ICS 19',
    viewBox: '0 0 30 50',
    svgContent: `
    <rect x="5" y="2" width="20" height="44" fill="none" stroke="black" stroke-width="2"/>
    <text x="15" y="14" text-anchor="middle" font-size="6" font-family="Arial" font-weight="bold">PDU</text>
    <line x1="8" y1="20" x2="22" y2="20" stroke="black" stroke-width="1"/>
    <line x1="8" y1="26" x2="22" y2="26" stroke="black" stroke-width="1"/>
    <line x1="8" y1="32" x2="22" y2="32" stroke="black" stroke-width="1"/>
    <line x1="8" y1="38" x2="22" y2="38" stroke="black" stroke-width="1"/>
    <line x1="15" y1="0" x2="15" y2="2" stroke="black" stroke-width="2"/>
    <line x1="15" y1="46" x2="15" y2="50" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'input', x: 50, y: 0 },
      { id: 'output', x: 50, y: 100 },
    ],
    tags: ['PDU', 'power-distribution', 'rack', 'data-center', 'outlets'],
  },

  'panelboard': {
    id: 'panelboard',
    name: 'Panelboard',
    category: 'distribution',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 50',
    svgContent: `
    <rect x="2" y="2" width="36" height="46" fill="none" stroke="black" stroke-width="2"/>
    <line x1="20" y1="8" x2="20" y2="44" stroke="black" stroke-width="1.5"/>
    <line x1="8" y1="12" x2="20" y2="12" stroke="black" stroke-width="1"/>
    <line x1="20" y1="18" x2="32" y2="18" stroke="black" stroke-width="1"/>
    <line x1="8" y1="24" x2="20" y2="24" stroke="black" stroke-width="1"/>
    <line x1="20" y1="30" x2="32" y2="30" stroke="black" stroke-width="1"/>
    <line x1="8" y1="36" x2="20" y2="36" stroke="black" stroke-width="1"/>
    <line x1="20" y1="42" x2="32" y2="42" stroke="black" stroke-width="1"/>
    <line x1="20" y1="0" x2="20" y2="2" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'main', x: 50, y: 0 },
      { id: 'branch-1', x: 20, y: 24 },
      { id: 'branch-2', x: 80, y: 36 },
    ],
    tags: ['panelboard', 'panel', 'branch-circuits', 'load-center', 'distribution'],
  },

  'switchgear': {
    id: 'switchgear',
    name: 'Switchgear',
    category: 'distribution',
    standard: 'IEEE Std 315-1975',
    voltageClass: 'MV',
    viewBox: '0 0 50 50',
    svgContent: `
    <rect x="2" y="2" width="46" height="46" fill="none" stroke="black" stroke-width="2"/>
    <line x1="5" y1="15" x2="45" y2="15" stroke="black" stroke-width="3"/>
    <line x1="15" y1="15" x2="15" y2="45" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="15" x2="25" y2="45" stroke="black" stroke-width="1.5"/>
    <line x1="35" y1="15" x2="35" y2="45" stroke="black" stroke-width="1.5"/>
    <text x="25" y="10" text-anchor="middle" font-size="5" font-family="Arial">SWGR</text>
    <line x1="25" y1="0" x2="25" y2="2" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'incoming', x: 50, y: 0 },
      { id: 'feeder-1', x: 30, y: 100 },
      { id: 'feeder-2', x: 50, y: 100 },
      { id: 'feeder-3', x: 70, y: 100 },
    ],
    tags: ['switchgear', 'SWGR', 'medium-voltage', 'main', 'distribution'],
  },

  'ats-automatic': {
    id: 'ats-automatic',
    name: 'Automatic Transfer Switch',
    category: 'distribution',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 40',
    svgContent: `
    <rect x="2" y="8" width="36" height="24" fill="none" stroke="black" stroke-width="2"/>
    <text x="20" y="22" text-anchor="middle" font-size="7" font-family="Arial" font-weight="bold">ATS</text>
    <line x1="10" y1="0" x2="10" y2="8" stroke="black" stroke-width="2"/>
    <line x1="30" y1="0" x2="30" y2="8" stroke="black" stroke-width="2"/>
    <line x1="20" y1="32" x2="20" y2="40" stroke="black" stroke-width="2"/>
    <text x="10" y="6" text-anchor="middle" font-size="4" font-family="Arial">N</text>
    <text x="30" y="6" text-anchor="middle" font-size="4" font-family="Arial">E</text>
    `,
    connectionPoints: [
      { id: 'normal', x: 25, y: 0 },
      { id: 'emergency', x: 75, y: 0 },
      { id: 'load', x: 50, y: 100 },
    ],
    tags: ['ATS', 'automatic-transfer', 'transfer-switch', 'redundancy', 'switchover'],
  },

  'sts-static': {
    id: 'sts-static',
    name: 'Static Transfer Switch',
    category: 'distribution',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 40',
    svgContent: `
    <rect x="2" y="8" width="36" height="24" fill="none" stroke="black" stroke-width="2"/>
    <text x="20" y="22" text-anchor="middle" font-size="7" font-family="Arial" font-weight="bold">STS</text>
    <line x1="10" y1="0" x2="10" y2="8" stroke="black" stroke-width="2"/>
    <line x1="30" y1="0" x2="30" y2="8" stroke="black" stroke-width="2"/>
    <line x1="20" y1="32" x2="20" y2="40" stroke="black" stroke-width="2"/>
    <path d="M 16,28 L 20,32 L 24,28" fill="none" stroke="black" stroke-width="1"/>
    `,
    connectionPoints: [
      { id: 'source-a', x: 25, y: 0 },
      { id: 'source-b', x: 75, y: 0 },
      { id: 'load', x: 50, y: 100 },
    ],
    tags: ['STS', 'static-transfer', 'fast-transfer', 'solid-state', 'redundancy'],
  },

  // ========== LOADS (5) ==========

  'motor-3phase': {
    id: 'motor-3phase',
    name: '3-Phase AC Motor',
    category: 'load',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 40',
    svgContent: `
    <circle cx="20" cy="20" r="16" fill="none" stroke="black" stroke-width="2"/>
    <text x="20" y="18" text-anchor="middle" font-size="8" font-family="Arial" font-weight="bold">M</text>
    <text x="20" y="27" text-anchor="middle" font-size="6" font-family="Arial">3ph</text>
    <line x1="12" y1="4" x2="12" y2="0" stroke="black" stroke-width="1.5"/>
    <line x1="20" y1="4" x2="20" y2="0" stroke="black" stroke-width="1.5"/>
    <line x1="28" y1="4" x2="28" y2="0" stroke="black" stroke-width="1.5"/>
    `,
    connectionPoints: [
      { id: 'T1', x: 30, y: 0, phase: 'A' },
      { id: 'T2', x: 50, y: 0, phase: 'B' },
      { id: 'T3', x: 70, y: 0, phase: 'C' },
    ],
    tags: ['motor', '3-phase', 'AC', 'induction', 'load'],
  },

  'electric-heater': {
    id: 'electric-heater',
    name: 'Electric Heater',
    category: 'load',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 30',
    svgContent: `
    <rect x="2" y="5" width="36" height="20" fill="none" stroke="black" stroke-width="1.5"/>
    <polyline points="6,15 10,8 14,22 18,8 22,22 26,8 30,22 34,15" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="2" y1="15" x2="0" y2="15" stroke="black" stroke-width="2"/>
    <line x1="38" y1="15" x2="40" y2="15" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'line-1', x: 0, y: 50 },
      { id: 'line-2', x: 100, y: 50 },
    ],
    tags: ['heater', 'electric', 'resistance', 'heating-element', 'load'],
  },

  'lighting-fixture': {
    id: 'lighting-fixture',
    name: 'Lighting Fixture',
    category: 'load',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 30 30',
    svgContent: `
    <circle cx="15" cy="15" r="10" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="8" y1="8" x2="22" y2="22" stroke="black" stroke-width="1.5"/>
    <line x1="22" y1="8" x2="8" y2="22" stroke="black" stroke-width="1.5"/>
    <line x1="15" y1="0" x2="15" y2="5" stroke="black" stroke-width="1.5"/>
    `,
    connectionPoints: [
      { id: 'feed', x: 50, y: 0 },
    ],
    tags: ['lighting', 'fixture', 'luminaire', 'lamp', 'illumination'],
  },

  'ups-system': {
    id: 'ups-system',
    name: 'UPS System',
    category: 'load',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 50 40',
    svgContent: `
    <rect x="2" y="2" width="46" height="36" fill="none" stroke="black" stroke-width="2"/>
    <text x="25" y="15" text-anchor="middle" font-size="8" font-family="Arial" font-weight="bold">UPS</text>
    <line x1="8" y1="22" x2="8" y2="30" stroke="black" stroke-width="1"/>
    <line x1="4" y1="26" x2="12" y2="26" stroke="black" stroke-width="1.5"/>
    <line x1="6" y1="29" x2="10" y2="29" stroke="black" stroke-width="1"/>
    <text x="30" y="30" text-anchor="middle" font-size="5" font-family="Arial">INV</text>
    <line x1="10" y1="0" x2="10" y2="2" stroke="black" stroke-width="2"/>
    <line x1="40" y1="38" x2="40" y2="40" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'input', x: 20, y: 0 },
      { id: 'output', x: 80, y: 100 },
    ],
    tags: ['UPS', 'uninterruptible', 'battery-backup', 'online', 'double-conversion'],
  },

  'server-rack': {
    id: 'server-rack',
    name: 'Server Rack / IT Load',
    category: 'load',
    standard: 'NEMA ICS 19',
    viewBox: '0 0 30 40',
    svgContent: `
    <rect x="2" y="2" width="26" height="36" fill="none" stroke="black" stroke-width="2"/>
    <text x="15" y="14" text-anchor="middle" font-size="5" font-family="Arial">IT</text>
    <text x="15" y="22" text-anchor="middle" font-size="5" font-family="Arial">LOAD</text>
    <text x="15" y="32" text-anchor="middle" font-size="5" font-family="Arial">kW</text>
    <line x1="15" y1="0" x2="15" y2="2" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'power-a', x: 50, y: 0 },
    ],
    tags: ['server', 'rack', 'IT-load', 'data-center', 'compute'],
  },

  // ========== INSTRUMENTS (6) ==========

  'ammeter': meterSymbol('ammeter', 'Ammeter (Current Meter)', 'A',
    ['ammeter', 'current', 'meter', 'measurement', 'instrument']),

  'voltmeter': meterSymbol('voltmeter', 'Voltmeter (Voltage Meter)', 'V',
    ['voltmeter', 'voltage', 'meter', 'measurement', 'instrument']),

  'wattmeter': meterSymbol('wattmeter', 'Wattmeter (Power Meter)', 'W',
    ['wattmeter', 'power', 'meter', 'measurement', 'kW']),

  'power-factor-meter': meterSymbol('power-factor-meter', 'Power Factor Meter', 'PF',
    ['power-factor', 'PF', 'meter', 'VAR', 'measurement']),

  'reactor-line': {
    id: 'reactor-line',
    name: 'Line Reactor / Inductor',
    category: 'instrument',
    standard: 'IEEE Std 315-1975',
    viewBox: '0 0 40 20',
    svgContent: `
    <line x1="0" y1="12" x2="5" y2="12" stroke="black" stroke-width="2"/>
    <path d="M 5,12 Q 8,4 11,12 Q 14,4 17,12 Q 20,4 23,12 Q 26,4 29,12 Q 32,4 35,12" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="35" y1="12" x2="40" y2="12" stroke="black" stroke-width="2"/>
    `,
    connectionPoints: [
      { id: 'in', x: 0, y: 60 },
      { id: 'out', x: 100, y: 60 },
    ],
    tags: ['reactor', 'inductor', 'coil', 'current-limiting', 'harmonic-filter'],
  },

  'revenue-meter': meterSymbol('revenue-meter', 'Revenue Meter (Energy Meter)', 'kWh',
    ['revenue', 'meter', 'energy', 'kWh', 'billing', 'utility']),

};

// ---------------------------------------------------------------------------
// ELEC_LINE_TYPES: 3 IEEE electrical line type definitions
// ---------------------------------------------------------------------------
export const ELEC_LINE_TYPES: Record<string, ElecLineType> = {

  'power-conductor': {
    id: 'power-conductor',
    name: 'Power Conductor (Hot Leg)',
    svgStroke: '#000000',
    svgStrokeWidth: 2,
    standard: 'IEEE Std 315 -- continuous line, heavier weight',
  },

  'grounding-conductor': {
    id: 'grounding-conductor',
    name: 'Grounding / Equipment Ground',
    svgStroke: '#000000',
    svgStrokeWidth: 1.5,
    svgStrokeDasharray: '6,2',
    color: '#00AA00',
    standard: 'IEEE Std 315 -- dashed or green',
  },

  'control-wiring': {
    id: 'control-wiring',
    name: 'Control and Signal Wiring',
    svgStroke: '#000000',
    svgStrokeWidth: 1,
    svgStrokeDasharray: '3,3',
    standard: 'IEEE Std 315 -- thin dashed line',
  },

};
