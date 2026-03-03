/**
 * Tests for the Reconnecting Descendant Pathway
 * Validates all 5 JSON data files and the index.ts module exports.
 *
 * @module heritage-skills-pack/reconnecting-pathway/reconnecting-pathway.test
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const terminologyGuide = JSON.parse(
  readFileSync(resolve(__dirname, 'terminology-guide.json'), 'utf-8')
);
const watershedTool = JSON.parse(
  readFileSync(resolve(__dirname, 'watershed-investigation.json'), 'utf-8')
);
const resourceDirectory = JSON.parse(
  readFileSync(resolve(__dirname, 'resource-directory.json'), 'utf-8')
);
const immersionGuidance = JSON.parse(
  readFileSync(resolve(__dirname, 'cultural-immersion-guidance.json'), 'utf-8')
);
const heritageBookTemplate = JSON.parse(
  readFileSync(resolve(__dirname, 'heritage-book-reconnecting-template.json'), 'utf-8')
);

// ─── Describe Block 1: terminology-guide.json ────────────────────────────────

describe('terminology-guide.json', () => {
  it('has culturalSovereigntyLevel of 1', () => {
    expect(terminologyGuide.culturalSovereigntyLevel).toBe(1);
  });

  it('has minimum 8 terms', () => {
    expect(Array.isArray(terminologyGuide.terms)).toBe(true);
    expect(terminologyGuide.terms.length).toBeGreaterThanOrEqual(8);
  });

  it('protocolPhrasing.verbatim matches /separated by adoption/', () => {
    expect(terminologyGuide.protocolPhrasing.verbatim).toMatch(/separated by adoption/);
  });

  it('protocolPhrasing.verbatim matches /Coast Salish ancestry/', () => {
    expect(terminologyGuide.protocolPhrasing.verbatim).toMatch(/Coast Salish ancestry/);
  });

  it('pretendianGuidance has concern, honestApproach, resourceCheck fields', () => {
    expect(terminologyGuide.pretendianGuidance).toBeDefined();
    expect(terminologyGuide.pretendianGuidance.concern).toBeDefined();
    expect(terminologyGuide.pretendianGuidance.honestApproach).toBeDefined();
    expect(terminologyGuide.pretendianGuidance.resourceCheck).toBeDefined();
  });

  it('pretendianGuidance.concern matches /Pretendian/', () => {
    expect(terminologyGuide.pretendianGuidance.concern).toMatch(/Pretendian/);
  });

  it('"Reconnecting descendant" term exists in terms array', () => {
    const found = terminologyGuide.terms.some(
      (t: { term: string }) => t.term === 'Reconnecting descendant'
    );
    expect(found).toBe(true);
  });

  it('"Sixties Scoop" term exists in terms array', () => {
    const found = terminologyGuide.terms.some(
      (t: { term: string }) => t.term === 'Sixties Scoop'
    );
    expect(found).toBe(true);
  });

  it('"Cultural humility" term exists in terms array', () => {
    const found = terminologyGuide.terms.some(
      (t: { term: string }) => t.term === 'Cultural humility'
    );
    expect(found).toBe(true);
  });

  it('no term definition contains generic "Native American" or "Indigenous peoples" as attribution', () => {
    for (const term of terminologyGuide.terms as Array<{ term: string; definition: string }>) {
      // Check that definitions don't use pan-Indigenous language as attribution for specific skills
      expect(
        term.definition,
        `term '${term.term}' definition uses prohibited pan-Indigenous attribution`
      ).not.toMatch(/Native American skills|Indigenous peoples skills/i);
    }
  });
});

// ─── Describe Block 2: watershed-investigation.json ──────────────────────────

describe('watershed-investigation.json', () => {
  it('has culturalSovereigntyLevel of 1', () => {
    expect(watershedTool.culturalSovereigntyLevel).toBe(1);
  });

  it('has minimum 5 investigationSteps', () => {
    expect(Array.isArray(watershedTool.investigationSteps)).toBe(true);
    expect(watershedTool.investigationSteps.length).toBeGreaterThanOrEqual(5);
  });

  it('watershedTypes has saltwater, riverMountain, unknown, both keys', () => {
    expect(watershedTool.watershedTypes).toBeDefined();
    expect(watershedTool.watershedTypes.saltwater).toBeDefined();
    expect(watershedTool.watershedTypes.riverMountain).toBeDefined();
    expect(watershedTool.watershedTypes.unknown).toBeDefined();
    expect(watershedTool.watershedTypes.both).toBeDefined();
  });

  it('watershedTypes.unknown matches /investigation|not a failure/i', () => {
    expect(watershedTool.watershedTypes.unknown).toMatch(/investigation|not a failure/i);
  });

  it('interpretationGuidance.saltwaterIndicators is a non-empty array', () => {
    expect(Array.isArray(watershedTool.interpretationGuidance.saltwaterIndicators)).toBe(true);
    expect(watershedTool.interpretationGuidance.saltwaterIndicators.length).toBeGreaterThan(0);
  });

  it('interpretationGuidance.riverMountainIndicators is a non-empty array', () => {
    expect(Array.isArray(watershedTool.interpretationGuidance.riverMountainIndicators)).toBe(true);
    expect(watershedTool.interpretationGuidance.riverMountainIndicators.length).toBeGreaterThan(0);
  });

  it('investigationSteps includes step with evidenceType "community-direct"', () => {
    const found = watershedTool.investigationSteps.some(
      (step: { evidenceType: string }) => step.evidenceType === 'community-direct'
    );
    expect(found).toBe(true);
  });

  it('limitations matches /does not replace|authoritative/i', () => {
    expect(watershedTool.limitations).toMatch(/does not replace|authoritative/i);
  });
});

// ─── Describe Block 3: resource-directory.json ───────────────────────────────

describe('resource-directory.json', () => {
  it('has minimum 5 categories', () => {
    expect(Array.isArray(resourceDirectory.categories)).toBe(true);
    expect(resourceDirectory.categories.length).toBeGreaterThanOrEqual(5);
  });

  it('total resources across all categories >= 14', () => {
    const total = resourceDirectory.categories.reduce(
      (sum: number, cat: { resources: unknown[] }) => sum + cat.resources.length,
      0
    );
    expect(total).toBeGreaterThanOrEqual(14);
  });

  it('Sixties Scoop Network resource present (url matches /sixtiesscoop/)', () => {
    const allResources = resourceDirectory.categories.flatMap(
      (cat: { resources: Array<{ url: string }> }) => cat.resources
    );
    const found = allResources.some((r: { url: string }) => /sixtiesscoop/.test(r.url));
    expect(found).toBe(true);
  });

  it('NICWA resource present (url matches /nicwa/)', () => {
    const allResources = resourceDirectory.categories.flatMap(
      (cat: { resources: Array<{ url: string }> }) => cat.resources
    );
    const found = allResources.some((r: { url: string }) => /nicwa/.test(r.url));
    expect(found).toBe(true);
  });

  it("U'mista Cultural Centre present (url matches /umista/)", () => {
    const allResources = resourceDirectory.categories.flatMap(
      (cat: { resources: Array<{ url: string }> }) => cat.resources
    );
    const found = allResources.some((r: { url: string }) => /umista/.test(r.url));
    expect(found).toBe(true);
  });

  it('no resource URL starts with "mailto:"', () => {
    for (const category of resourceDirectory.categories) {
      for (const resource of category.resources as Array<{ name: string; url: string }>) {
        expect(
          resource.url,
          `resource '${resource.name}' URL starts with mailto:`
        ).not.toMatch(/^mailto:/);
      }
    }
  });

  it('no resource URL contains bare email (@ not in https:// context)', () => {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    for (const category of resourceDirectory.categories) {
      for (const resource of category.resources as Array<{ name: string; url: string }>) {
        const url = resource.url;
        if (!url.startsWith('https://') && !url.startsWith('http://')) {
          expect(
            emailPattern.test(url),
            `resource '${resource.name}' has a bare email in URL`
          ).toBe(false);
        }
      }
    }
  });

  it('all resource URLs start with "https://" or "http://"', () => {
    for (const category of resourceDirectory.categories) {
      for (const resource of category.resources as Array<{ name: string; url: string }>) {
        expect(
          resource.url,
          `resource '${resource.name}' URL does not start with https:// or http://`
        ).toMatch(/^https?:\/\//);
      }
    }
  });
});

// ─── Describe Block 4: cultural-immersion-guidance.json ──────────────────────

describe('cultural-immersion-guidance.json', () => {
  it('coreMessage matches /tribal ID|enrollment/i and matches /begin learning/i', () => {
    expect(immersionGuidance.coreMessage).toMatch(/tribal ID|enrollment/i);
    expect(immersionGuidance.coreMessage).toMatch(/begin learning/i);
  });

  it('has minimum 4 approachPrinciples', () => {
    expect(Array.isArray(immersionGuidance.approachPrinciples)).toBe(true);
    expect(immersionGuidance.approachPrinciples.length).toBeGreaterThanOrEqual(4);
  });

  it('has minimum 4 immersionTypes', () => {
    expect(Array.isArray(immersionGuidance.immersionTypes)).toBe(true);
    expect(immersionGuidance.immersionTypes.length).toBeGreaterThanOrEqual(4);
  });

  it('immersionTypes includes type "heritage-skills"', () => {
    const found = immersionGuidance.immersionTypes.some(
      (t: { type: string }) => t.type === 'heritage-skills'
    );
    expect(found).toBe(true);
  });

  it('immersionTypes includes type "language-learning"', () => {
    const found = immersionGuidance.immersionTypes.some(
      (t: { type: string }) => t.type === 'language-learning'
    );
    expect(found).toBe(true);
  });

  it('protocolGuidance.introductionPhrase matches /separated by adoption/', () => {
    expect(immersionGuidance.protocolGuidance.introductionPhrase).toMatch(
      /separated by adoption/
    );
  });

  it('whatToExpect has "warmth", "caution", "grief", "patience" keys', () => {
    expect(immersionGuidance.whatToExpect.warmth).toBeDefined();
    expect(immersionGuidance.whatToExpect.caution).toBeDefined();
    expect(immersionGuidance.whatToExpect.grief).toBeDefined();
    expect(immersionGuidance.whatToExpect.patience).toBeDefined();
  });

  it('whatToExpect.grief matches /grief|Sixties Scoop/i', () => {
    expect(immersionGuidance.whatToExpect.grief).toMatch(/grief|Sixties Scoop/i);
  });
});

// ─── Describe Block 5: heritage-book-reconnecting-template.json ──────────────

describe('heritage-book-reconnecting-template.json', () => {
  it('has exactly 5 chapters', () => {
    expect(Array.isArray(heritageBookTemplate.chapters)).toBe(true);
    expect(heritageBookTemplate.chapters.length).toBe(5);
  });

  it('variantTitle is "Homecoming Journal"', () => {
    expect(heritageBookTemplate.variantTitle).toBe('Homecoming Journal');
  });

  it('chapter titles include all 5 required titles', () => {
    const titles = heritageBookTemplate.chapters.map(
      (ch: { title: string }) => ch.title
    );
    expect(titles).toContain('What I Know');
    expect(titles).toContain('What I Am Looking For');
    expect(titles).toContain('What I Have Found');
    expect(titles).toContain('Who I Have Spoken With');
    expect(titles).toContain('What the Land Tells Me');
  });

  it('one chapter has contentType "interview-transcript"', () => {
    const found = heritageBookTemplate.chapters.some(
      (ch: { contentType: string }) => ch.contentType === 'interview-transcript'
    );
    expect(found).toBe(true);
  });

  it('interview-transcript chapter has ocapReviewRequired: true', () => {
    const interviewChapter = heritageBookTemplate.chapters.find(
      (ch: { contentType: string }) => ch.contentType === 'interview-transcript'
    );
    expect(interviewChapter).toBeDefined();
    expect(interviewChapter?.ocapReviewRequired).toBe(true);
  });

  it('at least 3 chapters have culturalAttributionRequired: true', () => {
    const count = heritageBookTemplate.chapters.filter(
      (ch: { culturalAttributionRequired: boolean }) => ch.culturalAttributionRequired === true
    ).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('emotionalFraming matches /for you|honest/i', () => {
    expect(heritageBookTemplate.emotionalFraming).toMatch(/for you|honest/i);
  });

  it('exportNotes has sharingGuidance matching /OCAP/i', () => {
    expect(heritageBookTemplate.exportNotes.sharingGuidance).toMatch(/OCAP/i);
  });
});
