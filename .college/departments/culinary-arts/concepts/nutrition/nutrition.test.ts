import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from '../../../../college/college-loader.js';

import { macronutrientRoles } from './macronutrient-roles.js';
import { micronutrientBioavailability } from './micronutrient-bioavailability.js';
import { preparationNutrition } from './preparation-nutrition-effects.js';

const concepts = [
  { name: 'macronutrientRoles', concept: macronutrientRoles },
  { name: 'micronutrientBioavailability', concept: micronutrientBioavailability },
  { name: 'preparationNutrition', concept: preparationNutrition },
];

describe('Nutrition wing concepts', () => {
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

  it('CollegeLoader.loadWing returns 3 concepts for nutrition', async () => {
    const loader = new CollegeLoader(join(process.cwd(), '.college', 'departments'));
    const wing = await loader.loadWing('culinary-arts', 'nutrition');
    expect(wing.concepts.length).toBe(3);
  });

  it('macronutrient-roles description includes caloric densities', () => {
    const desc = macronutrientRoles.description;
    expect(desc).toMatch(/4\s*cal\/g|4\s*kcal/i);
    expect(desc).toMatch(/9\s*cal\/g|9\s*kcal/i);
  });

  it('micronutrient-bioavailability description mentions fat-soluble vitamins needing fat', () => {
    expect(micronutrientBioavailability.description).toMatch(/fat-soluble/i);
  });

  it('preparation-nutrition-effects description mentions vitamin C degrading above 70C', () => {
    expect(preparationNutrition.description).toMatch(/70.*C|vitamin\s*C/i);
  });
});
