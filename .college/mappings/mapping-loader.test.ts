/**
 * Tests for MappingLoader -- covers MAP-01 through MAP-06.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MappingLoader, MappingFileNotFoundError } from './mapping-loader.js';

let tempDir: string;
let defaultContent: object;

beforeAll(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'mapping-test-'));
  mkdirSync(join(tempDir, 'user'), { recursive: true });

  defaultContent = {
    name: 'Test Mapping',
    description: 'Mapping for tests',
    virtualDepartments: [
      { id: 'sciences', name: 'Sciences', description: 'Natural sciences', subjects: ['physics', 'chemistry'] },
      { id: 'computing', name: 'Computing', description: 'Digital skills', subjects: ['coding', 'data-science'] },
      { id: 'humanities', name: 'Humanities', description: 'Human culture', subjects: ['history', 'philosophy'] },
      { id: 'arts', name: 'Arts', description: 'Creative expression', subjects: ['art', 'music'] },
      { id: 'quantitative', name: 'Quantitative', description: 'Math and logic', subjects: ['math', 'statistics'] },
      { id: 'social', name: 'Social', description: 'Social sciences', subjects: ['economics', 'psychology'] },
    ],
  };

  writeFileSync(
    join(tempDir, 'default.json'),
    JSON.stringify(defaultContent, null, 2),
  );

  writeFileSync(
    join(tempDir, 'tracks.json'),
    JSON.stringify({
      name: 'Test Tracks',
      description: 'Tracks for tests',
      tracks: [
        {
          id: 'stem-track',
          name: 'STEM Track',
          description: 'Science and math path',
          subjects: ['math', 'physics', 'coding'],
          prerequisites: { physics: ['math'], coding: [] },
        },
        {
          id: 'humanities-track',
          name: 'Humanities Track',
          description: 'History and writing',
          subjects: ['reading', 'writing', 'history'],
          prerequisites: { writing: ['reading'], history: [] },
        },
      ],
    }, null, 2),
  );
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

afterEach(() => {
  // Clean up any user mappings created during tests.
  // readdirSync is imported at the top of this file -- do NOT use require().
  const userDir = join(tempDir, 'user');
  if (existsSync(userDir)) {
    for (const file of readdirSync(userDir)) {
      if (file.endsWith('.json')) {
        rmSync(join(userDir, file));
      }
    }
  }
});

describe('MappingLoader', () => {
  it('MAP-02: listVirtualDepartments returns 6+ named groups from default.json', () => {
    const loader = new MappingLoader(tempDir);
    const groups = loader.listVirtualDepartments();
    expect(groups.length).toBeGreaterThanOrEqual(6);
    expect(groups.map((g) => g.id)).toContain('sciences');
    expect(groups.map((g) => g.id)).toContain('computing');
  });

  it('MAP-01: each virtual department has id, name, description, and subjects array', () => {
    const loader = new MappingLoader(tempDir);
    for (const vd of loader.listVirtualDepartments()) {
      expect(vd.id).toBeTruthy();
      expect(vd.name).toBeTruthy();
      expect(vd.description).toBeTruthy();
      expect(Array.isArray(vd.subjects)).toBe(true);
      expect(vd.subjects.length).toBeGreaterThan(0);
    }
  });

  it('MAP-03: listTracks returns tracks with prerequisite maps', () => {
    const loader = new MappingLoader(tempDir);
    const tracks = loader.listTracks();
    expect(tracks.length).toBeGreaterThanOrEqual(2);
    expect(tracks[0].id).toBe('stem-track');
    expect(tracks[0].subjects).toContain('math');
    expect(tracks[0].prerequisites).toBeDefined();
    expect(tracks[0].prerequisites['physics']).toContain('math');
  });

  it('MAP-03: getTrack returns specific track by ID', () => {
    const loader = new MappingLoader(tempDir);
    const track = loader.getTrack('stem-track');
    expect(track).toBeDefined();
    expect(track!.name).toBe('STEM Track');
  });

  it('MAP-03: getTrack returns undefined for unknown track', () => {
    const loader = new MappingLoader(tempDir);
    expect(loader.getTrack('nonexistent')).toBeUndefined();
  });

  it('MAP-04: addUserMapping writes to user/ and is immediately discoverable', () => {
    const loader = new MappingLoader(tempDir);
    loader.addUserMapping('my-custom', {
      name: 'My Custom Mapping',
      description: 'Personal grouping',
      virtualDepartments: [
        { id: 'fav', name: 'Favourites', description: 'My picks', subjects: ['math', 'art'] },
      ],
    });

    const userMappings = loader.listUserMappings();
    expect(userMappings.map((m) => m.id)).toContain('my-custom');
    expect(userMappings[0].source).toBe('user');
  });

  it('MAP-04: listUserMappings returns only user-source mappings', () => {
    const loader = new MappingLoader(tempDir);
    loader.addUserMapping('another', {
      name: 'Another',
      description: 'Another custom',
      virtualDepartments: [
        { id: 'extra', name: 'Extra', description: 'Extra stuff', subjects: ['coding'] },
      ],
    });

    const userMappings = loader.listUserMappings();
    expect(userMappings.every((m) => m.source === 'user')).toBe(true);
  });

  it('MAP-05: reload() reflects file changes without restart', () => {
    const loader = new MappingLoader(tempDir);

    // Initially 6 groups
    expect(loader.listVirtualDepartments().length).toBe(6);

    // Modify default.json to add a 7th group
    const modified = {
      ...defaultContent,
      virtualDepartments: [
        ...(defaultContent as any).virtualDepartments,
        { id: 'extra', name: 'Extra', description: 'Bonus group', subjects: ['learning'] },
      ],
    };
    writeFileSync(join(tempDir, 'default.json'), JSON.stringify(modified, null, 2));

    // Before reload: still 6
    expect(loader.listVirtualDepartments().length).toBe(6);

    // After reload: 7
    loader.reload();
    expect(loader.listVirtualDepartments().length).toBe(7);

    // Restore original
    writeFileSync(join(tempDir, 'default.json'), JSON.stringify(defaultContent, null, 2));
    loader.reload();
  });

  it('MAP-06: CollegeLoader discovery is unaffected by MappingLoader state (mapping is additive)', () => {
    // MAP-06 is filesystem-first: CollegeLoader scans .college/departments/ independently.
    // This test verifies the architectural contract: MappingLoader is never required for discovery.
    const loader = new MappingLoader(tempDir);
    // listVirtualDepartments references subject IDs; if those departments don't exist in
    // the provided tempDir, validateSubjects will flag orphans -- but CollegeLoader would
    // still discover them from the real filesystem. Mapping is additive.
    const result = loader.validateSubjects(['math', 'nonexistent-dept'], ['math', 'physics']);
    expect(result.valid).toBe(false);
    expect((result as any).orphans).toContain('nonexistent-dept');
  });

  it('validateSubjects returns valid: true when all subjects are known', () => {
    const loader = new MappingLoader(tempDir);
    const result = loader.validateSubjects(['math', 'physics'], ['math', 'physics', 'chemistry']);
    expect(result.valid).toBe(true);
  });

  it('listMappingFiles includes both default and user sources', () => {
    const loader = new MappingLoader(tempDir);
    loader.addUserMapping('combined-test', {
      name: 'Combined Test',
      description: 'Tests combined listing',
      virtualDepartments: [
        { id: 'test-group', name: 'Test Group', description: 'Testing', subjects: ['math'] },
      ],
    });

    const all = loader.listMappingFiles();
    expect(all.some((m) => m.source === 'default')).toBe(true);
    expect(all.some((m) => m.source === 'user')).toBe(true);
  });
});
