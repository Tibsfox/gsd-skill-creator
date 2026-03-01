import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from '../../../../college/college-loader.js';

import { mealPlanning } from './meal-planning.js';
import { budgetManagement } from './budget-management.js';
import { pantryManagement } from './pantry-management.js';
import { preservationTechniques } from './preservation-techniques.js';

const concepts = [
  { name: 'mealPlanning', concept: mealPlanning },
  { name: 'budgetManagement', concept: budgetManagement },
  { name: 'pantryManagement', concept: pantryManagement },
  { name: 'preservationTechniques', concept: preservationTechniques },
];

describe('Home Economics wing concepts', () => {
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

  it('CollegeLoader.loadWing returns 4 concepts for home-economics', async () => {
    const loader = new CollegeLoader(join(process.cwd(), '.college', 'departments'));
    const wing = await loader.loadWing('culinary-arts', 'home-economics');
    expect(wing.concepts.length).toBe(4);
  });

  it('preservation-techniques mentions at least 3 methods', () => {
    const desc = preservationTechniques.description.toLowerCase();
    const methods = ['canning', 'freezing', 'dehydrat', 'ferment'];
    const found = methods.filter(m => desc.includes(m));
    expect(found.length).toBeGreaterThanOrEqual(3);
  });
});
