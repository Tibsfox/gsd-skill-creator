import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from '../../../../college/college-loader.js';

import { bakersRatios } from './bakers-ratios.js';
import { glutenDevelopment } from './gluten-development.js';
import { yeastBiology } from './yeast-biology.js';
import { sugarChemistry } from './sugar-chemistry.js';

const concepts = [
  { name: 'bakersRatios', concept: bakersRatios },
  { name: 'glutenDevelopment', concept: glutenDevelopment },
  { name: 'yeastBiology', concept: yeastBiology },
  { name: 'sugarChemistry', concept: sugarChemistry },
];

describe('Baking Science wing concepts', () => {
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

  it('CollegeLoader.loadWing returns 4 concepts for baking-science', async () => {
    const loader = new CollegeLoader(join(process.cwd(), '.college', 'departments'));
    const wing = await loader.loadWing('culinary-arts', 'baking-science');
    expect(wing.concepts.length).toBe(4);
  });

  it('bakers-ratios description mentions flour as 100% base', () => {
    expect(bakersRatios.description).toMatch(/100%/);
    expect(bakersRatios.description).toMatch(/flour/i);
  });

  it('gluten-development description mentions kneading and hydration', () => {
    expect(glutenDevelopment.description).toMatch(/knead/i);
    expect(glutenDevelopment.description).toMatch(/hydration/i);
  });

  it('yeast-biology description mentions active temperature range (35-46C)', () => {
    expect(yeastBiology.description).toMatch(/35.*46|35-46/);
  });

  it('sugar-chemistry description mentions crystallization or spread', () => {
    expect(sugarChemistry.description).toMatch(/crystalliz|spread/i);
  });

  it('flat cookies diagnostic data is present in concepts', () => {
    // bakers-ratios mentions butter ratio affecting spread
    expect(bakersRatios.description).toMatch(/butter/i);
    expect(bakersRatios.description).toMatch(/spread/i);
    // sugar-chemistry mentions sugar type affecting spread
    expect(sugarChemistry.description).toMatch(/spread/i);
    // gluten-development mentions over-mixing
    expect(glutenDevelopment.description).toMatch(/over-mix/i);
  });
});
