/**
 * Learn Mode Sidebar UI Component
 *
 * Renders a structured panel for progressive content disclosure.
 * Users select a depth level and see topic content at that complexity.
 *
 * Imports the learn mode engine from learn-mode.ts and produces
 * structured SidebarPanel output with level selector and filtered
 * depth markers.
 */

import { DepthLevel, DepthMarker, filterByDepth, getModuleMarkers } from './learn-mode';

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

/** State of the sidebar component */
export interface SidebarState {
  moduleId: string;
  currentLevel: DepthLevel;
}

/** A section within the sidebar panel, one per visible depth level */
export interface SidebarSection {
  level: DepthLevel;
  levelName: string;
  markers: Array<{ content: string; citation: string }>;
}

/** Complete sidebar panel output */
export interface SidebarPanel {
  title: string;
  moduleId: string;
  currentLevel: DepthLevel;
  levelOptions: Array<{ level: DepthLevel; name: string; selected: boolean }>;
  sections: SidebarSection[];
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Human-readable module titles keyed by module directory ID */
const MODULE_TITLES: Record<string, string> = {
  '01-the-circuit': 'The Circuit',
  '02-passive-components': 'Passive Components',
  '03-the-signal': 'The Signal',
  '04-diodes': 'Diodes',
  '05-transistors': 'Transistors',
  '06-op-amps': 'Op-Amps',
  '07-power-supplies': 'Power Supplies',
  '07a-logic-gates': 'Logic Gates',
  '08-sequential-logic': 'Sequential Logic',
  '09-data-conversion': 'Data Conversion',
  '10-dsp': 'Digital Signal Processing',
  '11-microcontrollers': 'Microcontrollers',
  '12-sensors-actuators': 'Sensors and Actuators',
  '13-plc': 'Programmable Logic Controllers',
  '14-off-grid-power': 'Off-Grid Power Systems',
  '15-pcb-design': 'PCB Design',
};

/** Human-readable names for each depth level */
const LEVEL_NAMES: Record<DepthLevel, string> = {
  [DepthLevel.Practical]: 'Practical',
  [DepthLevel.Reference]: 'Reference',
  [DepthLevel.Mathematical]: 'Mathematical',
};

/** All depth levels in order */
const ALL_LEVELS: DepthLevel[] = [
  DepthLevel.Practical,
  DepthLevel.Reference,
  DepthLevel.Mathematical,
];

// ---------------------------------------------------------------------------
// renderSidebar
// ---------------------------------------------------------------------------

/**
 * Render a sidebar panel for the given module and depth level.
 *
 * The panel includes:
 * - Module title
 * - Level selector with 3 options (Practical, Reference, Mathematical)
 * - Sections for each visible depth level, containing filtered markers
 *
 * Unknown module IDs produce a panel with title "Unknown Module" and
 * empty sections, but valid levelOptions.
 */
export function renderSidebar(state: SidebarState): SidebarPanel {
  const title = MODULE_TITLES[state.moduleId] ?? 'Unknown Module';
  const allMarkers = getModuleMarkers(state.moduleId);
  const filtered = filterByDepth(allMarkers, state.currentLevel);

  // Build level options: always show all 3, mark selected
  const levelOptions = ALL_LEVELS.map((level) => ({
    level,
    name: LEVEL_NAMES[level],
    selected: level === state.currentLevel,
  }));

  // Group filtered markers by level into sections
  const sections: SidebarSection[] = [];
  for (const level of ALL_LEVELS) {
    if (level > state.currentLevel) break;
    const levelMarkers = filtered.filter((m) => m.level === level);
    if (levelMarkers.length === 0) continue;
    sections.push({
      level,
      levelName: LEVEL_NAMES[level],
      markers: levelMarkers.map((m) => ({
        content: m.content,
        citation: m.hhCitation,
      })),
    });
  }

  return {
    title,
    moduleId: state.moduleId,
    currentLevel: state.currentLevel,
    levelOptions,
    sections,
  };
}
