/**
 * Learn Mode Sidebar UI -- TDD Test Suite
 *
 * Tests sidebar rendering, level selection, marker display,
 * and content.md depth marker presence for all 16 modules.
 *
 * Covers requirement: LEARN-03
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DepthLevel,
  filterByDepth,
  getModuleMarkers,
  MODULE_MARKERS,
} from '../shared/learn-mode.js';
import {
  renderSidebar,
  SidebarState,
  SidebarPanel,
  SidebarSection,
} from '../shared/learn-mode-ui.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modulesRoot = path.resolve(__dirname, '..', 'modules');

const ALL_MODULES = [
  '01-the-circuit',
  '02-passive-components',
  '03-the-signal',
  '04-diodes',
  '05-transistors',
  '06-op-amps',
  '07-power-supplies',
  '07a-logic-gates',
  '08-sequential-logic',
  '09-data-conversion',
  '10-dsp',
  '11-microcontrollers',
  '12-sensors-actuators',
  '13-plc',
  '14-off-grid-power',
  '15-pcb-design',
];

// ---------------------------------------------------------------------------
// 1. SidebarState and SidebarPanel types
// ---------------------------------------------------------------------------
describe('SidebarState and SidebarPanel types', () => {
  it('SidebarState has moduleId and currentLevel', () => {
    const state: SidebarState = {
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Practical,
    };
    expect(state.moduleId).toBe('01-the-circuit');
    expect(state.currentLevel).toBe(DepthLevel.Practical);
  });

  it('SidebarPanel has required fields', () => {
    const panel: SidebarPanel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Practical,
    });
    expect(panel).toHaveProperty('title');
    expect(panel).toHaveProperty('moduleId');
    expect(panel).toHaveProperty('currentLevel');
    expect(panel).toHaveProperty('levelOptions');
    expect(panel).toHaveProperty('sections');
  });

  it('SidebarSection has level, levelName, and markers', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    expect(panel.sections.length).toBeGreaterThan(0);
    const section = panel.sections[0];
    expect(section).toHaveProperty('level');
    expect(section).toHaveProperty('levelName');
    expect(section).toHaveProperty('markers');
  });
});

// ---------------------------------------------------------------------------
// 2. renderSidebar basic output
// ---------------------------------------------------------------------------
describe('renderSidebar basic output', () => {
  it('returns panel with title containing "Circuit" for 01-the-circuit', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Practical,
    });
    expect(panel.title).toContain('Circuit');
  });

  it('panel moduleId matches input', () => {
    const panel = renderSidebar({
      moduleId: '05-transistors',
      currentLevel: DepthLevel.Reference,
    });
    expect(panel.moduleId).toBe('05-transistors');
  });

  it('panel currentLevel matches input', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Reference,
    });
    expect(panel.currentLevel).toBe(DepthLevel.Reference);
  });

  it('panel levelOptions has exactly 3 entries', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Practical,
    });
    expect(panel.levelOptions).toHaveLength(3);
  });

  it('levelOptions contain Practical, Reference, Mathematical names', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Practical,
    });
    const names = panel.levelOptions.map((o) => o.name);
    expect(names).toContain('Practical');
    expect(names).toContain('Reference');
    expect(names).toContain('Mathematical');
  });

  it('at Practical level, only level 1 option is selected', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Practical,
    });
    const selected = panel.levelOptions.filter((o) => o.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0].level).toBe(DepthLevel.Practical);
  });

  it('at Reference level, only level 2 option is selected', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Reference,
    });
    const selected = panel.levelOptions.filter((o) => o.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0].level).toBe(DepthLevel.Reference);
  });

  it('at Mathematical level, only level 3 option is selected', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    const selected = panel.levelOptions.filter((o) => o.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0].level).toBe(DepthLevel.Mathematical);
  });
});

// ---------------------------------------------------------------------------
// 3. Depth-filtered sections
// ---------------------------------------------------------------------------
describe('Depth-filtered sections', () => {
  it('at Practical: sections has exactly 1 section (Level 1 only)', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Practical,
    });
    expect(panel.sections).toHaveLength(1);
    expect(panel.sections[0].level).toBe(DepthLevel.Practical);
  });

  it('at Reference: sections has exactly 2 sections (Level 1 and Level 2)', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Reference,
    });
    expect(panel.sections).toHaveLength(2);
    expect(panel.sections[0].level).toBe(DepthLevel.Practical);
    expect(panel.sections[1].level).toBe(DepthLevel.Reference);
  });

  it('at Mathematical: sections has exactly 3 sections (all levels)', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    expect(panel.sections).toHaveLength(3);
    expect(panel.sections[0].level).toBe(DepthLevel.Practical);
    expect(panel.sections[1].level).toBe(DepthLevel.Reference);
    expect(panel.sections[2].level).toBe(DepthLevel.Mathematical);
  });

  it('each section has levelName matching the level', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    expect(panel.sections[0].levelName).toBe('Practical');
    expect(panel.sections[1].levelName).toBe('Reference');
    expect(panel.sections[2].levelName).toBe('Mathematical');
  });

  it('each section has non-empty markers array', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    for (const section of panel.sections) {
      expect(section.markers.length).toBeGreaterThan(0);
    }
  });

  it('each marker has non-empty content and citation strings', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    for (const section of panel.sections) {
      for (const marker of section.markers) {
        expect(marker.content.length).toBeGreaterThan(0);
        expect(marker.citation.length).toBeGreaterThan(0);
      }
    }
  });

  it('sections for 02-passive-components at Reference has 2 sections', () => {
    const panel = renderSidebar({
      moduleId: '02-passive-components',
      currentLevel: DepthLevel.Reference,
    });
    expect(panel.sections).toHaveLength(2);
  });

  it('sections for 06-op-amps at Mathematical has 3 sections', () => {
    const panel = renderSidebar({
      moduleId: '06-op-amps',
      currentLevel: DepthLevel.Mathematical,
    });
    expect(panel.sections).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// 4. Marker content from MODULE_MARKERS
// ---------------------------------------------------------------------------
describe('Marker content from MODULE_MARKERS', () => {
  it('markers match getModuleMarkers filtered content for 01-the-circuit', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    const allMarkers = getModuleMarkers('01-the-circuit');
    const filtered = filterByDepth(allMarkers, DepthLevel.Mathematical);
    // Total marker count across all sections should equal filtered markers count
    const totalMarkers = panel.sections.reduce((sum, s) => sum + s.markers.length, 0);
    expect(totalMarkers).toBe(filtered.length);
  });

  it('marker citations start with "H&H" for module 01', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    for (const section of panel.sections) {
      for (const marker of section.markers) {
        expect(marker.citation).toMatch(/^H&H/);
      }
    }
  });

  it('marker citations start with "IEC" for module 13-plc', () => {
    const panel = renderSidebar({
      moduleId: '13-plc',
      currentLevel: DepthLevel.Mathematical,
    });
    for (const section of panel.sections) {
      for (const marker of section.markers) {
        expect(marker.citation).toMatch(/^IEC/);
      }
    }
  });

  it('Level 1 section markers contain plain-language content (no "=" sign)', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    const l1Section = panel.sections.find((s) => s.level === DepthLevel.Practical);
    expect(l1Section).toBeDefined();
    for (const marker of l1Section!.markers) {
      expect(marker.content).not.toContain('=');
    }
  });

  it('Level 3 section markers contain mathematical content (has "=" in at least one marker)', () => {
    const panel = renderSidebar({
      moduleId: '01-the-circuit',
      currentLevel: DepthLevel.Mathematical,
    });
    const l3Section = panel.sections.find((s) => s.level === DepthLevel.Mathematical);
    expect(l3Section).toBeDefined();
    const hasEquals = l3Section!.markers.some((m) => m.content.includes('='));
    expect(hasEquals).toBe(true);
  });

  it('markers for 05-transistors at Mathematical include equations', () => {
    const panel = renderSidebar({
      moduleId: '05-transistors',
      currentLevel: DepthLevel.Mathematical,
    });
    const l3 = panel.sections.find((s) => s.level === DepthLevel.Mathematical);
    expect(l3).toBeDefined();
    const hasEq = l3!.markers.some((m) => m.content.includes('='));
    expect(hasEq).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Edge cases
// ---------------------------------------------------------------------------
describe('Edge cases', () => {
  it('unknown moduleId returns panel with title "Unknown Module"', () => {
    const panel = renderSidebar({
      moduleId: 'nonexistent-module',
      currentLevel: DepthLevel.Practical,
    });
    expect(panel.title).toBe('Unknown Module');
  });

  it('unknown moduleId returns panel with empty sections', () => {
    const panel = renderSidebar({
      moduleId: 'nonexistent-module',
      currentLevel: DepthLevel.Practical,
    });
    expect(panel.sections).toHaveLength(0);
  });

  it('unknown moduleId still has valid levelOptions', () => {
    const panel = renderSidebar({
      moduleId: 'nonexistent-module',
      currentLevel: DepthLevel.Mathematical,
    });
    expect(panel.levelOptions).toHaveLength(3);
    const selected = panel.levelOptions.filter((o) => o.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0].level).toBe(DepthLevel.Mathematical);
  });

  it('renderSidebar handles all 16 module IDs without error', () => {
    for (const moduleId of ALL_MODULES) {
      expect(() => {
        renderSidebar({
          moduleId,
          currentLevel: DepthLevel.Mathematical,
        });
      }).not.toThrow();
    }
  });

  it('all 16 modules produce non-empty sections at Mathematical level', () => {
    for (const moduleId of ALL_MODULES) {
      const panel = renderSidebar({
        moduleId,
        currentLevel: DepthLevel.Mathematical,
      });
      expect(panel.sections.length).toBe(3);
    }
  });

  it('all 16 modules have matching titles (not "Unknown Module")', () => {
    for (const moduleId of ALL_MODULES) {
      const panel = renderSidebar({
        moduleId,
        currentLevel: DepthLevel.Practical,
      });
      expect(panel.title).not.toBe('Unknown Module');
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Content.md depth marker validation (all 16 modules)
// ---------------------------------------------------------------------------
describe('Content.md depth marker validation', () => {
  for (const moduleId of ALL_MODULES) {
    describe(`Module ${moduleId}`, () => {
      let content: string;

      it('content.md exists and is readable', () => {
        const filePath = path.join(modulesRoot, moduleId, 'content.md');
        expect(fs.existsSync(filePath)).toBe(true);
        content = fs.readFileSync(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      });

      it('contains "## Learn Mode Depth Markers" section', () => {
        const filePath = path.join(modulesRoot, moduleId, 'content.md');
        content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('## Learn Mode Depth Markers');
      });

      it('contains "### Level 1: Practical" subsection with real content', () => {
        const filePath = path.join(modulesRoot, moduleId, 'content.md');
        content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('### Level 1: Practical');
        // Should NOT still have only the old placeholder comment
        const afterL1 = content.split('### Level 1: Practical')[1] ?? '';
        const beforeNextSection = afterL1.split('###')[0] ?? '';
        expect(beforeNextSection.trim().length).toBeGreaterThan(0);
        // Should not be just the HTML comment placeholder
        expect(beforeNextSection.trim()).not.toBe('<!-- Level 1: Practical rules -->');
      });

      it('contains "### Level 2: Reference" subsection with real content', () => {
        const filePath = path.join(modulesRoot, moduleId, 'content.md');
        content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('### Level 2: Reference');
        const afterL2 = content.split('### Level 2: Reference')[1] ?? '';
        const beforeNextSection = afterL2.split('###')[0] ?? '';
        expect(beforeNextSection.trim().length).toBeGreaterThan(0);
      });

      it('contains "### Level 3: Mathematical" subsection with real content', () => {
        const filePath = path.join(modulesRoot, moduleId, 'content.md');
        content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('### Level 3: Mathematical');
        const afterL3 = content.split('### Level 3: Mathematical')[1] ?? '';
        expect(afterL3.trim().length).toBeGreaterThan(0);
      });

      it('Level 1 section has citation', () => {
        const filePath = path.join(modulesRoot, moduleId, 'content.md');
        content = fs.readFileSync(filePath, 'utf-8');
        const afterL1 = content.split('### Level 1: Practical')[1] ?? '';
        const l1Content = afterL1.split('###')[0] ?? '';
        // Module 13 uses IEC, all others use H&H
        if (moduleId === '13-plc') {
          expect(l1Content).toContain('IEC');
        } else {
          expect(l1Content).toContain('H&H');
        }
      });

      it('Level 3 section contains equation (has "=")', () => {
        const filePath = path.join(modulesRoot, moduleId, 'content.md');
        content = fs.readFileSync(filePath, 'utf-8');
        const afterL3 = content.split('### Level 3: Mathematical')[1] ?? '';
        expect(afterL3).toContain('=');
      });

      it('does NOT still have only HTML comment placeholders', () => {
        const filePath = path.join(modulesRoot, moduleId, 'content.md');
        content = fs.readFileSync(filePath, 'utf-8');
        // The old placeholder pattern -- should not be the sole content in depth markers section
        const depthSection = content.split('## Learn Mode Depth Markers')[1] ?? '';
        expect(depthSection).not.toMatch(
          /^\s*<!--\s*Level 1:.*?-->\s*<!--\s*Level 2:.*?-->\s*<!--\s*Level 3:.*?-->\s*$/s
        );
      });
    });
  }
});
