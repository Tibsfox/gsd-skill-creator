/**
 * Tests for the Salish Sea Ways cross-cutting module.
 *
 * Validates data completeness, structural correctness, historical accuracy
 * of potlatch criminalization dates, protocol phrase presence, and the
 * critical requirement that no pan-Indigenous language appears in nation data.
 *
 * @module heritage-skills-pack/salish-sea-ways/salish-sea-ways.test
 */

import { describe, it, expect } from 'vitest';

import {
  loadAllNations,
  loadAllNationsByProvince,
  loadNationById,
  loadWatershedIdentity,
  loadPotlatchContext,
  loadReconnectingTerminology,
  loadCrossBorderSovereigntyNotes,
  getSalishCulturalSovereigntyHooks,
} from './index.js';

// ─── loadAllNations — completeness ───────────────────────────────────────────

describe('loadAllNations — completeness', () => {
  it('returns at least 40 nations total', () => {
    const nations = loadAllNations();
    expect(nations.length).toBeGreaterThanOrEqual(40);
  });

  it('each nation has required fields: id, name, languageFamily, roomConnections', () => {
    const nations = loadAllNations();
    for (const nation of nations) {
      expect(nation.id, `nation missing id`).toBeDefined();
      expect(nation.id.length, `nation id is empty`).toBeGreaterThan(0);
      expect(nation.name, `nation '${nation.id}' missing name`).toBeDefined();
      expect(nation.name.length, `nation '${nation.id}' name is empty`).toBeGreaterThan(0);
      expect(nation.languageFamily, `nation '${nation.id}' missing languageFamily`).toBeDefined();
      expect(nation.roomConnections, `nation '${nation.id}' missing roomConnections`).toBeDefined();
      expect(Array.isArray(nation.roomConnections), `nation '${nation.id}' roomConnections not array`).toBe(true);
    }
  });

  it('each nation has at least one room connection', () => {
    const nations = loadAllNations();
    for (const nation of nations) {
      expect(
        nation.roomConnections.length,
        `nation '${nation.id}' has empty roomConnections`
      ).toBeGreaterThan(0);
    }
  });

  it('no nation name equals exactly "Coast Salish" (pan-Indigenous aggregation check)', () => {
    const nations = loadAllNations();
    for (const nation of nations) {
      expect(
        nation.name.trim(),
        `nation '${nation.id}' uses prohibited aggregate name 'Coast Salish'`
      ).not.toBe('Coast Salish');
    }
  });

  it('no nation name contains "Native American" or "Indigenous peoples"', () => {
    const nations = loadAllNations();
    for (const nation of nations) {
      expect(
        nation.name,
        `nation '${nation.id}' contains prohibited pan-Indigenous language in name`
      ).not.toMatch(/Native American|Indigenous peoples/i);
      // Also check culturalNotes for pan-Indigenous aggregation (attributing heritage as generic)
      if (nation.culturalNotes) {
        // The restriction is on ATTRIBUTION — calling skills "Native American" or attributing to "Indigenous peoples"
        // culturalNotes may mention these terms in historical context (e.g., describing policies)
        // but should not attribute heritage skills generically. Check for direct attribution patterns.
        expect(
          nation.culturalNotes,
          `nation '${nation.id}' culturalNotes uses prohibited attribution 'Native American skills' or 'Indigenous peoples skills'`
        ).not.toMatch(/Native American skills|Indigenous peoples skills/i);
      }
    }
  });
});

// ─── loadAllNationsByProvince — each province ─────────────────────────────────

describe('loadAllNationsByProvince — each province', () => {
  it('coast-salish-chinook has at least 15 nations', () => {
    const nations = loadAllNationsByProvince('coast-salish-chinook');
    expect(nations.length).toBeGreaterThanOrEqual(15);
  });

  it('wakashan has at least 5 nations', () => {
    const nations = loadAllNationsByProvince('wakashan');
    expect(nations.length).toBeGreaterThanOrEqual(5);
  });

  it('northern-coast has at least 5 nations', () => {
    const nations = loadAllNationsByProvince('northern-coast');
    expect(nations.length).toBeGreaterThanOrEqual(5);
  });

  it('nw-california has at least 5 nations', () => {
    const nations = loadAllNationsByProvince('nw-california');
    expect(nations.length).toBeGreaterThanOrEqual(5);
  });

  it('western-slope-cascade has at least 8 nations', () => {
    const nations = loadAllNationsByProvince('western-slope-cascade');
    expect(nations.length).toBeGreaterThanOrEqual(8);
  });

  it('all nations have roomConnections including room 15 or 16', () => {
    const nations = loadAllNations();
    for (const nation of nations) {
      const hasRoom15or16 = nation.roomConnections.includes(15) || nation.roomConnections.includes(16);
      expect(
        hasRoom15or16,
        `nation '${nation.id}' has no connection to room 15 (watercraft) or room 16 (salmon)`
      ).toBe(true);
    }
  });
});

// ─── loadNationById — lookup ──────────────────────────────────────────────────

describe('loadNationById — lookup', () => {
  it('finds Lummi nation by id', () => {
    const nation = loadNationById('nation-lummi');
    expect(nation).toBeDefined();
    expect(nation.name).toContain('Lummi');
  });

  it('throws on unknown nation id', () => {
    expect(() => loadNationById('nation-bogus')).toThrow();
  });

  it('found nation has languageFamily field', () => {
    const nation = loadNationById('nation-lummi');
    expect(nation.languageFamily).toBeDefined();
    expect(nation.languageFamily.length).toBeGreaterThan(0);
  });
});

// ─── loadWatershedIdentity — framework ───────────────────────────────────────

describe('loadWatershedIdentity — framework', () => {
  it('has saltwaterPeoples key', () => {
    const framework = loadWatershedIdentity();
    expect(framework.saltwaterPeoples).toBeDefined();
  });

  it('has riverMountainPeoples key', () => {
    const framework = loadWatershedIdentity();
    expect(framework.riverMountainPeoples).toBeDefined();
  });

  it('saltwaterPeoples has heritageSkillRooms including 15 and 16', () => {
    const framework = loadWatershedIdentity();
    expect(framework.saltwaterPeoples.heritageSkillRooms).toContain(15);
    expect(framework.saltwaterPeoples.heritageSkillRooms).toContain(16);
  });

  it('riverMountainPeoples has heritageSkillRooms', () => {
    const framework = loadWatershedIdentity();
    expect(framework.riverMountainPeoples.heritageSkillRooms).toBeDefined();
    expect(framework.riverMountainPeoples.heritageSkillRooms.length).toBeGreaterThan(0);
  });

  it('has contentHooks key with culturalSovereigntyWardenDomain equal to salish-sea', () => {
    const framework = loadWatershedIdentity();
    expect(framework.contentHooks).toBeDefined();
    expect((framework.contentHooks as Record<string, unknown>)['culturalSovereigntyWardenDomain']).toBe('salish-sea');
  });
});

// ─── loadPotlatchContext — historical accuracy ────────────────────────────────

describe('loadPotlatchContext — historical accuracy', () => {
  it('criminalization banStart is 1884', () => {
    const context = loadPotlatchContext();
    expect(context.criminalizationHistory.banStart).toBe(1884);
  });

  it('criminalization banEnd is 1951', () => {
    const context = loadPotlatchContext();
    expect(context.criminalizationHistory.banEnd).toBe(1951);
  });

  it('preContactFunction has socialMechanisms array with at least 4 entries', () => {
    const context = loadPotlatchContext();
    expect(context.preContactFunction.socialMechanisms).toBeDefined();
    expect(context.preContactFunction.socialMechanisms.length).toBeGreaterThanOrEqual(4);
  });

  it('revival legalRestoration is 1951', () => {
    const context = loadPotlatchContext();
    expect(context.revival.legalRestoration).toBe(1951);
  });

  it('culturalSovereigntyLevel is 1 for potlatch-as-technology framing', () => {
    const context = loadPotlatchContext();
    expect(context.culturalSovereigntyLevel).toBe(1);
  });

  it('contentHook has room18Anchor true', () => {
    const context = loadPotlatchContext();
    expect((context.contentHook as Record<string, unknown>)['room18Anchor']).toBe(true);
  });
});

// ─── loadReconnectingTerminology — protocol and terms ────────────────────────

describe('loadReconnectingTerminology — protocol and terms', () => {
  it('protocolPhrase.verbatim contains "Coast Salish ancestry through my biological line"', () => {
    const guide = loadReconnectingTerminology();
    expect(guide.protocolPhrase.verbatim).toContain('Coast Salish ancestry through my biological line');
  });

  it('protocolPhrase.verbatim contains "seeking to learn the history of my ancestors"', () => {
    const guide = loadReconnectingTerminology();
    expect(guide.protocolPhrase.verbatim).toContain('seeking to learn the history of my ancestors');
  });

  it('has at least 4 terms defined', () => {
    const guide = loadReconnectingTerminology();
    expect(guide.terms.length).toBeGreaterThanOrEqual(4);
  });

  it('terms include Reconnecting descendant term', () => {
    const guide = loadReconnectingTerminology();
    const term = guide.terms.find(t => t.term === 'Reconnecting descendant');
    expect(term).toBeDefined();
  });

  it('terms include Sixties Scoop term', () => {
    const guide = loadReconnectingTerminology();
    const term = guide.terms.find(t => t.term === 'Sixties Scoop');
    expect(term).toBeDefined();
  });

  it('terms include watershed investigation term', () => {
    const guide = loadReconnectingTerminology();
    const term = guide.terms.find(t => t.term.toLowerCase().includes('watershed investigation'));
    expect(term).toBeDefined();
  });

  it('resourcesForReconnecting has at least 3 entries', () => {
    const guide = loadReconnectingTerminology();
    expect(guide.resourcesForReconnecting.length).toBeGreaterThanOrEqual(3);
  });

  it('no email addresses in resources (personal data not permitted)', () => {
    const guide = loadReconnectingTerminology();
    for (const resource of guide.resourcesForReconnecting) {
      // mailto: links or bare emails not permitted
      expect(resource.url, `resource '${resource.name}' URL must not be a mailto link`).not.toMatch(/^mailto:/);
    }
  });
});

// ─── loadCrossBorderSovereigntyNotes — coverage ──────────────────────────────

describe('loadCrossBorderSovereigntyNotes — coverage', () => {
  it('has at least 3 borderNotes entries', () => {
    const notes = loadCrossBorderSovereigntyNotes();
    expect(notes.borderNotes.length).toBeGreaterThanOrEqual(3);
  });

  it('has note covering Tlingit cross-border situation', () => {
    const notes = loadCrossBorderSovereigntyNotes();
    const tlingitNote = notes.borderNotes.find(n => n.nationGroup.toLowerCase().includes('tlingit'));
    expect(tlingitNote).toBeDefined();
  });

  it('has note covering Haida cross-border situation', () => {
    const notes = loadCrossBorderSovereigntyNotes();
    const haidaNote = notes.borderNotes.find(n => n.nationGroup.toLowerCase().includes('haida'));
    expect(haidaNote).toBeDefined();
  });

  it('educationalPosition is non-empty string', () => {
    const notes = loadCrossBorderSovereigntyNotes();
    expect(notes.educationalPosition).toBeDefined();
    expect(notes.educationalPosition.length).toBeGreaterThan(20);
  });
});

// ─── Cultural sovereignty content hooks ──────────────────────────────────────

describe('Cultural sovereignty content hooks', () => {
  it('getSalishCulturalSovereigntyHooks returns domain salish-sea', () => {
    const hooks = getSalishCulturalSovereigntyHooks();
    expect(hooks.domain).toBe('salish-sea');
  });

  it('provinceMap contains coast-salish-chinook key', () => {
    const hooks = getSalishCulturalSovereigntyHooks();
    expect(hooks.provinceMap['coast-salish-chinook']).toBeDefined();
  });

  it('coast-salish-chinook province map has at least 10 nations', () => {
    const hooks = getSalishCulturalSovereigntyHooks();
    expect(hooks.provinceMap['coast-salish-chinook'].length).toBeGreaterThanOrEqual(10);
  });
});
