/**
 * Phase 22: Full Discovery Smoke Test
 *
 * Verifies that all foundational departments created across Phase 22 plans
 * are discoverable via the filesystem pattern (DEPARTMENT.md presence)
 * without any changes to the College framework code.
 *
 * Expected count: 39 departments discoverable (38 content departments + 1 test fixture)
 * - 3 pre-existing: culinary-arts, mathematics, mind-body
 * - 1 pre-existing test fixture: test-department (COLL-05 proof of concept)
 * - 15 from plan 22-01 (core_academic): business, chemistry, coding, communication,
 *   critical-thinking, data-science, digital-literacy, economics, engineering,
 *   environmental, geography, history, languages, logic, materials
 * - 10 from plan 22-02 (applied_practical): math, nutrition, physics, problem-solving,
 *   psychology, reading, science, statistics, technology, writing
 * - 10 from plan 22-03 (specialized): art, astronomy, home-economics, learning, music,
 *   nature-studies, philosophy, physical-education, theology, trades
 *
 * @module departments/discovery-smoke.test
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DEPARTMENTS_DIR = join(process.cwd(), '.college', 'departments');

describe('Phase 22: Full Discovery Smoke Test', () => {
  const departments = readdirSync(DEPARTMENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => existsSync(join(DEPARTMENTS_DIR, d.name, 'DEPARTMENT.md')))
    .map((d) => d.name);

  it('discovers at least 38 departments (3 existing + 35 new)', () => {
    // 38 content departments + 1 test-department fixture = 39 total
    expect(departments.length).toBeGreaterThanOrEqual(38);
  });

  it('has no duplicate department names', () => {
    expect(new Set(departments).size).toBe(departments.length);
  });

  const existingDepts = ['culinary-arts', 'mathematics', 'mind-body'];

  it('all 3 pre-existing departments are still discoverable', () => {
    for (const dept of existingDepts) {
      expect(departments).toContain(dept);
    }
  });

  it('all 10 specialized departments from plan 22-03 are discoverable', () => {
    const specializedDepts = [
      'art',
      'astronomy',
      'home-economics',
      'learning',
      'music',
      'nature-studies',
      'philosophy',
      'physical-education',
      'theology',
      'trades',
    ];
    for (const dept of specializedDepts) {
      expect(departments, `${dept} should be discoverable`).toContain(dept);
    }
  });

  it('all 15 core_academic departments from plan 22-01 are discoverable', () => {
    const coreAcademic = [
      'business',
      'chemistry',
      'coding',
      'communication',
      'critical-thinking',
      'data-science',
      'digital-literacy',
      'economics',
      'engineering',
      'environmental',
      'geography',
      'history',
      'languages',
      'logic',
      'materials',
    ];
    for (const dept of coreAcademic) {
      expect(departments, `${dept} should be discoverable`).toContain(dept);
    }
  });

  it('all 10 applied_practical departments from plan 22-02 are discoverable', () => {
    const appliedPractical = [
      'math',
      'nutrition',
      'physics',
      'problem-solving',
      'psychology',
      'reading',
      'science',
      'statistics',
      'technology',
      'writing',
    ];
    for (const dept of appliedPractical) {
      expect(departments, `${dept} should be discoverable`).toContain(dept);
    }
  });

  // Verify sample DEPARTMENT.md files have required sections
  const sampleDepts = ['physics', 'coding', 'art', 'nutrition', 'astronomy'];
  for (const dept of sampleDepts) {
    it(`${dept}/DEPARTMENT.md has required sections`, () => {
      const mdPath = join(DEPARTMENTS_DIR, dept, 'DEPARTMENT.md');
      expect(existsSync(mdPath), `${dept}/DEPARTMENT.md should exist`).toBe(true);
      const md = readFileSync(mdPath, 'utf-8');
      expect(md).toContain('**Domain:**');
      expect(md).toContain('**Status:**');
      expect(md).toContain('## Wings');
    });
  }

  it('DEPARTMENT.md field validation: all 3 existing departments have required sections', () => {
    for (const dept of existingDepts) {
      const mdPath = join(DEPARTMENTS_DIR, dept, 'DEPARTMENT.md');
      const md = readFileSync(mdPath, 'utf-8');
      // Existing departments use **Domain:** pattern
      expect(md).toContain('**Domain:**');
    }
  });
});
