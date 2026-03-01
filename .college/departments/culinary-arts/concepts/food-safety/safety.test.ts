import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from '../../../../college/college-loader.js';

import { temperatureDangerZone } from './temperature-danger-zone.js';
import { crossContamination } from './cross-contamination-prevention.js';
import { safeStorageTimes } from './safe-storage-times.js';
import { allergenManagement } from './allergen-management.js';

const concepts = [
  { name: 'temperatureDangerZone', concept: temperatureDangerZone },
  { name: 'crossContamination', concept: crossContamination },
  { name: 'safeStorageTimes', concept: safeStorageTimes },
  { name: 'allergenManagement', concept: allergenManagement },
];

describe('Food Safety wing concepts', () => {
  it('each concept exports a valid RosettaConcept with id starting with cook-', () => {
    for (const { name, concept } of concepts) {
      expect(concept.id, `${name} id`).toBeDefined();
      expect(concept.id.startsWith('cook-'), `${name} id prefix`).toBe(true);
      expect(concept.name, `${name} name`).toBeTruthy();
      expect(concept.description, `${name} description`).toBeTruthy();
      expect(concept.panels, `${name} panels`).toBeInstanceOf(Map);
      expect(concept.relationships, `${name} relationships`).toBeInstanceOf(Array);
    }
  });

  it('each concept has domain culinary-arts', () => {
    for (const { name, concept } of concepts) {
      expect(concept.domain, `${name} domain`).toBe('culinary-arts');
    }
  });

  it('CollegeLoader.loadWing returns 4 concepts for food-safety', async () => {
    const loader = new CollegeLoader(join(process.cwd(), '.college', 'departments'));
    const wing = await loader.loadWing('culinary-arts', 'food-safety');
    expect(wing.concepts.length).toBe(4);
  });

  it('temperature-danger-zone includes 40-140F range', () => {
    expect(temperatureDangerZone.description).toMatch(/40.*140.*F|4.*60.*C/);
  });

  it('temperature-danger-zone includes minimum internal temps', () => {
    const desc = temperatureDangerZone.description;
    expect(desc).toMatch(/165.*F|74.*C/); // poultry
    expect(desc).toMatch(/160.*F|71.*C/); // ground meat
    expect(desc).toMatch(/145.*F|63.*C/); // whole cuts
  });

  it('allergen-management mentions at least 5 of the Big 9 allergens', () => {
    const desc = allergenManagement.description.toLowerCase();
    const allergens = ['milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soy', 'sesame'];
    const found = allergens.filter(a => desc.includes(a));
    expect(found.length).toBeGreaterThanOrEqual(5);
  });

  it('safe-storage-times includes the 2-hour rule', () => {
    expect(safeStorageTimes.description).toMatch(/2.*hour|two.*hour/i);
  });
});
