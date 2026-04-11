/**
 * Tests for the SEL Mapping Documentation
 * Validates Neighbors Path to CASEL framework alignment.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const selMapping = JSON.parse(
  readFileSync(resolve(__dirname, 'sel-mapping.json'), 'utf-8')
);

describe('Framing Integrity — Heritage First', () => {
  it('framingStatement exists and references heritage', () => {
    expect(selMapping.framingStatement).toBeTruthy();
    expect(selMapping.framingStatement).toMatch(/heritage/i);
  });

  it('framingStatement does NOT put CASEL as definer or discoverer', () => {
    expect(selMapping.framingStatement).not.toMatch(
      /CASEL.*defined|CASEL.*discovered|modern.*defined/i
    );
  });

  it('educatorNote directs educators to lead with heritage', () => {
    expect(selMapping.educatorNote).toMatch(/lead with the heritage/i);
  });

  it('acknowledgement states practices were not discovered by modern educational psychology', () => {
    expect(selMapping.acknowledgement).toMatch(
      /not.*discovered.*by modern|were not.*discovered/i
    );
  });

  it('acknowledgement contains specific Salish Sea nation names', () => {
    const ack = selMapping.acknowledgement;
    const hasLummi = /Lummi|Lhaq'temish/.test(ack);
    const hasCoastSalish = /Coast Salish/.test(ack);
    const hasKwakwakawakw = /Kwakwaka'wakw/.test(ack);
    expect(hasLummi).toBe(true);
    expect(hasCoastSalish).toBe(true);
    expect(hasKwakwakawakw).toBe(true);
  });

  it('no mapping alignmentRationale starts with "CASEL defines..." or leads with CASEL as authority', () => {
    for (const mapping of selMapping.mappings) {
      expect(mapping.alignmentRationale).not.toMatch(/^CASEL defines/i);
      expect(mapping.alignmentRationale).not.toMatch(/^CASEL discovered/i);
    }
  });

  it('all mappings have non-empty heritageDescription', () => {
    for (const mapping of selMapping.mappings) {
      expect(typeof mapping.heritageDescription).toBe('string');
      expect(mapping.heritageDescription.length).toBeGreaterThan(0);
    }
  });

  it('all mappings have nation-specific attribution — not just "Indigenous" or "First Nations" alone', () => {
    const genericOnly = /^(Indigenous peoples?|First Nations)$/i;
    for (const mapping of selMapping.mappings) {
      expect(mapping.nationAttribution).toBeTruthy();
      // Must contain specific nation names, not ONLY generic terms
      expect(mapping.nationAttribution).not.toMatch(genericOnly);
      // Must reference at least one named nation
      const hasSpecificNation = /Coast Salish|Lummi|Stó:lō|Kwakwaka'wakw|Nuu-chah-nulth|Heiltsuk|Haida|WSÁNEĆ|Saanich/.test(
        mapping.nationAttribution
      );
      expect(hasSpecificNation).toBe(true);
    }
  });
});

describe('Heritage Framework Completeness', () => {
  it('heritageFramework.coreComponents has exactly 6 components', () => {
    expect(selMapping.heritageFramework.coreComponents).toHaveLength(6);
  });

  it('all 6 required component IDs are present', () => {
    const ids = selMapping.heritageFramework.coreComponents.map(
      (c: { id: string }) => c.id
    );
    expect(ids).toContain('neighbor-map');
    expect(ids).toContain('potlatch-as-technology');
    expect(ids).toContain('brothers-fight');
    expect(ids).toContain('emotional-weather');
    expect(ids).toContain('making-right');
    expect(ids).toContain('reef-net-model');
  });

  it('all components have heritageSource with nation-specific attribution', () => {
    for (const component of selMapping.heritageFramework.coreComponents) {
      expect(component.heritageSource).toBeTruthy();
      const hasNation = /Coast Salish|Lummi|Stó:lō|Kwakwaka'wakw|Nuu-chah-nulth|Heiltsuk|Haida|WSÁNEĆ|Saanich/.test(
        component.heritageSource
      );
      expect(hasNation).toBe(true);
    }
  });

  it('all components have a roomModule field', () => {
    for (const component of selMapping.heritageFramework.coreComponents) {
      expect(component.roomModule).toBeTruthy();
      expect(typeof component.roomModule).toBe('string');
    }
  });

  it('heritageFramework.nationAttribution contains "Coast Salish"', () => {
    expect(selMapping.heritageFramework.nationAttribution).toMatch(/Coast Salish/);
  });

  it("heritageFramework.nationAttribution contains \"Kwakwaka'wakw\"", () => {
    expect(selMapping.heritageFramework.nationAttribution).toMatch(/Kwakwaka'wakw/);
  });

  it('heritageFramework.culturalSovereigntyNote references Level 1', () => {
    expect(selMapping.heritageFramework.culturalSovereigntyNote).toMatch(/Level 1/i);
  });

  it('heritageFramework does not use generic "Indigenous peoples" without nation names', () => {
    const frameworkStr = JSON.stringify(selMapping.heritageFramework);
    // "Indigenous peoples" alone (not followed by specific nation names in same sentence) should not appear
    // We check that the field values contain specific nation names when they reference Indigenous peoples
    const genericPhrase = /\bIndigenous peoples\b/;
    if (genericPhrase.test(frameworkStr)) {
      // If the phrase appears, it must be accompanied by specific nation names nearby
      const hasSpecificNations = /Coast Salish|Lummi|Kwakwaka'wakw|Nuu-chah-nulth/.test(
        frameworkStr
      );
      expect(hasSpecificNations).toBe(true);
    }
    // The culturalSovereigntyNote should not be generic only
    expect(selMapping.heritageFramework.culturalSovereigntyNote).not.toMatch(
      /^Indigenous peoples practice/i
    );
  });
});

describe('CASEL Framework Completeness', () => {
  it('selFramework.competencies has exactly 5 competencies', () => {
    expect(selMapping.selFramework.competencies).toHaveLength(5);
  });

  it('all 5 CASEL competency IDs are present', () => {
    const ids = selMapping.selFramework.competencies.map(
      (c: { id: string }) => c.id
    );
    expect(ids).toContain('self-awareness');
    expect(ids).toContain('self-management');
    expect(ids).toContain('social-awareness');
    expect(ids).toContain('relationship-skills');
    expect(ids).toContain('responsible-decision-making');
  });

  it('selFramework.url references casel.org', () => {
    expect(selMapping.selFramework.url).toMatch(/casel\.org/);
  });

  it('selFramework.organizationNote references 1994 (CASEL founding year)', () => {
    expect(selMapping.selFramework.organizationNote).toMatch(/1994/);
  });

  it('all competency definitions (casselDefinition) are non-empty strings', () => {
    for (const competency of selMapping.selFramework.competencies) {
      expect(typeof competency.casselDefinition).toBe('string');
      expect(competency.casselDefinition.length).toBeGreaterThan(0);
    }
  });

  it('selFramework.name references CASEL', () => {
    expect(selMapping.selFramework.name).toMatch(/CASEL/);
  });
});

describe('Mapping Coverage', () => {
  it('mappings array has at least 8 entries', () => {
    expect(selMapping.mappings.length).toBeGreaterThanOrEqual(8);
  });

  it('all 5 CASEL competencies are covered by at least one mapping', () => {
    const covered = new Set(
      selMapping.mappings.map((m: { casselCompetency: string }) => m.casselCompetency)
    );
    expect(covered.has('self-awareness')).toBe(true);
    expect(covered.has('self-management')).toBe(true);
    expect(covered.has('social-awareness')).toBe(true);
    expect(covered.has('relationship-skills')).toBe(true);
    expect(covered.has('responsible-decision-making')).toBe(true);
  });

  it('each CASEL competency appears in at least one mapping casselCompetency field', () => {
    const competencies = [
      'self-awareness',
      'self-management',
      'social-awareness',
      'relationship-skills',
      'responsible-decision-making',
    ];
    for (const competency of competencies) {
      const found = selMapping.mappings.some(
        (m: { casselCompetency: string }) => m.casselCompetency === competency
      );
      expect(found).toBe(true);
    }
  });

  it('emotional-weather component has at least 2 mappings', () => {
    const emotionalWeatherMappings = selMapping.mappings.filter(
      (m: { heritageComponent: string }) => m.heritageComponent === 'emotional-weather'
    );
    expect(emotionalWeatherMappings.length).toBeGreaterThanOrEqual(2);
  });

  it('emotional-weather maps to both self-awareness and self-management', () => {
    const ewMappings = selMapping.mappings.filter(
      (m: { heritageComponent: string }) => m.heritageComponent === 'emotional-weather'
    );
    const competencies = ewMappings.map(
      (m: { casselCompetency: string }) => m.casselCompetency
    );
    expect(competencies).toContain('self-awareness');
    expect(competencies).toContain('self-management');
  });

  it('making-right component has at least 2 mappings', () => {
    const makingRightMappings = selMapping.mappings.filter(
      (m: { heritageComponent: string }) => m.heritageComponent === 'making-right'
    );
    expect(makingRightMappings.length).toBeGreaterThanOrEqual(2);
  });

  it('making-right maps to both responsible-decision-making and relationship-skills', () => {
    const mrMappings = selMapping.mappings.filter(
      (m: { heritageComponent: string }) => m.heritageComponent === 'making-right'
    );
    const competencies = mrMappings.map(
      (m: { casselCompetency: string }) => m.casselCompetency
    );
    expect(competencies).toContain('responsible-decision-making');
    expect(competencies).toContain('relationship-skills');
  });

  it('all mappings have culturalSovereigntyLevel of 1', () => {
    for (const mapping of selMapping.mappings) {
      expect(mapping.culturalSovereigntyLevel).toBe(1);
    }
  });

  it('all mappings have a non-empty educatorApplicationNote', () => {
    for (const mapping of selMapping.mappings) {
      expect(typeof mapping.educatorApplicationNote).toBe('string');
      expect(mapping.educatorApplicationNote.length).toBeGreaterThan(0);
    }
  });

  it('implementationGuidance.curriculumIntegration.approach leads with heritage', () => {
    expect(
      selMapping.implementationGuidance.curriculumIntegration.approach
    ).toMatch(/[Ll]ead with heritage/i);
  });

  it('implementationGuidance.gradeLevel has elementary, middle, and secondary keys', () => {
    const gl = selMapping.implementationGuidance.gradeLevel;
    expect(gl).toHaveProperty('elementary');
    expect(gl).toHaveProperty('middle');
    expect(gl).toHaveProperty('secondary');
  });

  it('implementationGuidance.culturalSovereigntyInPractice requires specific nation attribution', () => {
    expect(
      selMapping.implementationGuidance.culturalSovereigntyInPractice
    ).toMatch(/nation.specific attribution|specific nation/i);
  });
});
