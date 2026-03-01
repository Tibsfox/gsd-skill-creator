import { describe, it, expect } from 'vitest';

import { zenPhilosophy } from './zen-philosophy.js';
import { taoismTaoTeChing } from './taoism-tao-te-ching.js';
import { yogaSutrasPatanjali } from './yoga-sutras-patanjali.js';
import { martialVirtuesBushidoWude } from './martial-virtues-bushido-wude.js';
import { mindfulnessDailyLife } from './mindfulness-daily-life.js';
import { beginnersMindShoshin } from './beginners-mind-shoshin.js';
import { allPhilosophyConcepts } from './index.js';

const concepts = [
  { name: 'zenPhilosophy', concept: zenPhilosophy },
  { name: 'taoismTaoTeChing', concept: taoismTaoTeChing },
  { name: 'yogaSutrasPatanjali', concept: yogaSutrasPatanjali },
  { name: 'martialVirtuesBushidoWude', concept: martialVirtuesBushidoWude },
  { name: 'mindfulnessDailyLife', concept: mindfulnessDailyLife },
  { name: 'beginnersMindShoshin', concept: beginnersMindShoshin },
];

describe('Philosophy wing concepts', () => {
  // ─── Structural Validity ──────────────────────────────────────────────────

  it('each concept exports a valid RosettaConcept with id starting with mb-phil-', () => {
    for (const { name, concept } of concepts) {
      expect(concept.id, `${name} should have an id`).toBeDefined();
      expect(concept.id.startsWith('mb-phil-'), `${name} id should start with mb-phil-`).toBe(true);
      expect(concept.name, `${name} should have a name`).toBeTruthy();
      expect(concept.description, `${name} should have a description`).toBeTruthy();
      expect(concept.panels, `${name} should have panels Map`).toBeInstanceOf(Map);
      expect(concept.relationships, `${name} should have relationships array`).toBeInstanceOf(Array);
    }
  });

  it('each concept has domain mind-body', () => {
    for (const { name, concept } of concepts) {
      expect(concept.domain, `${name} domain`).toBe('mind-body');
    }
  });

  it('each concept has at least 1 relationship', () => {
    for (const { name, concept } of concepts) {
      expect(concept.relationships.length, `${name} should have >= 1 relationship`).toBeGreaterThanOrEqual(1);
    }
  });

  it('allPhilosophyConcepts has exactly 6 entries', () => {
    expect(allPhilosophyConcepts).toHaveLength(6);
  });

  it('allPhilosophyConcepts contains all 6 concept objects', () => {
    for (const { concept } of concepts) {
      expect(allPhilosophyConcepts).toContain(concept);
    }
  });

  // ─── Non-Religious Boundary ───────────────────────────────────────────────

  it('each philosophy concept contains the non-religious boundary statement', () => {
    for (const { name, concept } of concepts) {
      const desc = concept.description.toLowerCase();
      const hasBoundary =
        desc.includes('not as religious instruction') ||
        desc.includes('not religious instruction') ||
        desc.includes('techniques and concepts, not religious');
      expect(hasBoundary, `${name} should contain non-religious boundary statement`).toBe(true);
    }
  });

  it('no philosophy concept makes religious claims', () => {
    for (const { name, concept } of concepts) {
      const desc = concept.description.toLowerCase();
      expect(desc, `${name} should not proselytize`).not.toMatch(/you should believe|you must follow|the true path|only way/);
      expect(desc, `${name} should not claim divine authority`).not.toMatch(/god commands|divine truth|sacred duty to/);
    }
  });

  // ─── Zen-Specific ─────────────────────────────────────────────────────────

  it('Zen mentions shoshin (beginner\'s mind)', () => {
    expect(zenPhilosophy.description).toMatch(/shoshin/i);
    expect(zenPhilosophy.description).toMatch(/beginner/i);
  });

  it('Zen cites Suzuki', () => {
    expect(zenPhilosophy.description).toMatch(/Suzuki/);
  });

  it('Zen mentions koans as attention tools', () => {
    expect(zenPhilosophy.description).toMatch(/koan/i);
  });

  it('Zen uses original term \u521d\u5fc3', () => {
    expect(zenPhilosophy.description).toContain('\u521d\u5fc3');
  });

  // ─── Taoism-Specific ──────────────────────────────────────────────────────

  it('Taoism uses original term \u9053 (Dao)', () => {
    expect(taoismTaoTeChing.description).toContain('\u9053');
    expect(taoismTaoTeChing.description).toMatch(/Dao/);
  });

  it('Taoism uses original term \u7121\u70BA (wu wei)', () => {
    expect(taoismTaoTeChing.description).toContain('\u7121\u70BA');
    expect(taoismTaoTeChing.description).toMatch(/wu wei/i);
  });

  it('Taoism uses water metaphor', () => {
    expect(taoismTaoTeChing.description).toMatch(/water/i);
  });

  it('Taoism cites Laozi and Tao Te Ching', () => {
    expect(taoismTaoTeChing.description).toMatch(/Laozi/);
    expect(taoismTaoTeChing.description).toMatch(/Tao Te Ching/);
  });

  // ─── Yoga Sutras-Specific ─────────────────────────────────────────────────

  it('Yoga Sutras lists all 8 limbs', () => {
    const desc = yogaSutrasPatanjali.description.toLowerCase();
    expect(desc).toMatch(/yama/);
    expect(desc).toMatch(/niyama/);
    expect(desc).toMatch(/asana/);
    expect(desc).toMatch(/pranayama/);
    expect(desc).toMatch(/pratyahara/);
    expect(desc).toMatch(/dharana/);
    expect(desc).toMatch(/dhyana/);
    expect(desc).toMatch(/samadhi/);
  });

  it('Yoga Sutras notes asana is only 1 of 8 limbs', () => {
    expect(yogaSutrasPatanjali.description).toMatch(/one of eight|1 of 8|one component|limb three of eight/i);
  });

  it('Yoga Sutras frames system as context not requirement', () => {
    expect(yogaSutrasPatanjali.description).toMatch(/not as a requirement|benefit from.*alone|context/i);
  });

  // ─── Martial Virtues-Specific ─────────────────────────────────────────────

  it('martial virtues covers Bushido (Japanese)', () => {
    expect(martialVirtuesBushidoWude.description).toMatch(/Bushido/);
    expect(martialVirtuesBushidoWude.description).toMatch(/Japan/i);
  });

  it('martial virtues covers Wude (Chinese)', () => {
    expect(martialVirtuesBushidoWude.description).toMatch(/Wude/);
    expect(martialVirtuesBushidoWude.description).toMatch(/Chin/i);
  });

  it('martial virtues covers Mudo (Korean)', () => {
    expect(martialVirtuesBushidoWude.description).toMatch(/Mudo/);
    expect(martialVirtuesBushidoWude.description).toMatch(/Korea/i);
  });

  it('martial virtues uses original Japanese terms with kanji', () => {
    // \u6B66\u58EB\u9053 = Bushido kanji
    expect(martialVirtuesBushidoWude.description).toContain('\u6B66\u58EB\u9053');
  });

  it('martial virtues notes no tradition is superior', () => {
    expect(martialVirtuesBushidoWude.description).toMatch(/no tradition.*superior|not.*superior/i);
  });

  // ─── Daily Mindfulness-Specific ───────────────────────────────────────────

  it('daily mindfulness describes specific informal activities', () => {
    const desc = mindfulnessDailyLife.description.toLowerCase();
    expect(desc).toMatch(/eating/);
    expect(desc).toMatch(/walking/);
    expect(desc).toMatch(/coding/);
  });

  it('daily mindfulness describes formal-to-informal transition', () => {
    expect(mindfulnessDailyLife.description).toMatch(/formal/i);
    expect(mindfulnessDailyLife.description).toMatch(/informal/i);
  });

  // ─── Beginner's Mind-Specific ─────────────────────────────────────────────

  it('beginner\'s mind includes Suzuki quote about possibilities', () => {
    expect(beginnersMindShoshin.description).toMatch(/beginner's mind there are many possibilities/i);
    expect(beginnersMindShoshin.description).toMatch(/expert's mind there are few/i);
  });

  it('beginner\'s mind states pack never graduates user', () => {
    expect(beginnersMindShoshin.description).toMatch(/never graduating|never graduates/i);
  });

  it('beginner\'s mind identifies openness as most valuable quality', () => {
    expect(beginnersMindShoshin.description).toMatch(/most valuable quality/i);
  });

  it('beginner\'s mind uses original term \u521d\u5fc3 (shoshin)', () => {
    expect(beginnersMindShoshin.description).toContain('\u521d\u5fc3');
    expect(beginnersMindShoshin.description).toMatch(/shoshin/i);
  });

  // ─── Relationships ────────────────────────────────────────────────────────

  it('philosophy concepts have relationships connecting to other modules', () => {
    for (const { name, concept } of concepts) {
      const targets = concept.relationships.map(r => r.targetId);
      const crossModule = targets.some(t =>
        t.startsWith('mb-med-') ||
        t.startsWith('mb-relax-') ||
        t.startsWith('mb-martial-') ||
        t.startsWith('mb-tai-') ||
        t.startsWith('mb-yoga-') ||
        t.startsWith('mb-breath-'),
      );
      expect(crossModule, `${name} should have at least one cross-module relationship`).toBe(true);
    }
  });

  // ─── Boundary Tests ───────────────────────────────────────────────────────

  it('each concept acknowledges limitations of simplified presentation', () => {
    for (const { name, concept } of concepts) {
      const desc = concept.description.toLowerCase();
      const acknowledgesLimits =
        desc.includes('simplified') ||
        desc.includes('doorway') ||
        desc.includes('condenses') ||
        desc.includes('loses the depth') ||
        desc.includes('deeper study') ||
        desc.includes('necessarily simplif') ||
        desc.includes('this summary') ||
        desc.includes('this presentation');
      expect(acknowledgesLimits, `${name} should acknowledge presentation limitations`).toBe(true);
    }
  });

  it('each concept acknowledges living traditions', () => {
    for (const { name, concept } of concepts) {
      const desc = concept.description.toLowerCase();
      const acknowledgesLiving =
        desc.includes('living tradition') ||
        desc.includes('practiced by millions') ||
        desc.includes('practiced by hundreds of millions') ||
        desc.includes('practiced by millions of martial');
      expect(acknowledgesLiving, `${name} should acknowledge this is a living tradition`).toBe(true);
    }
  });
});
