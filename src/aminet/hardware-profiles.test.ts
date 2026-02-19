/**
 * Hardware profiles tests.
 *
 * Tests cover: all 5 hardware profiles (A500, A1200, A1200+030, A4000, WHDLoad),
 * profile lookup by ID, bulk retrieval, model-based reverse lookup, and
 * immutability of returned profile objects.
 */

import { describe, it, expect } from 'vitest';
import {
  HARDWARE_PROFILES,
  getProfile,
  getAllProfiles,
  getProfileForModel,
} from './hardware-profiles.js';
import type { HardwareProfile } from './hardware-profiles.js';

// ---------------------------------------------------------------------------
// HARDWARE_PROFILES constant
// ---------------------------------------------------------------------------

describe('HARDWARE_PROFILES', () => {
  it('has exactly 5 entries', () => {
    const ids = Object.keys(HARDWARE_PROFILES);
    expect(ids).toHaveLength(5);
  });

  it('contains all 5 profile IDs', () => {
    const ids = Object.keys(HARDWARE_PROFILES);
    expect(ids).toContain('a500');
    expect(ids).toContain('a1200');
    expect(ids).toContain('a1200-030');
    expect(ids).toContain('a4000');
    expect(ids).toContain('whdload');
  });

  it('all entries have consistent shape', () => {
    for (const profile of Object.values(HARDWARE_PROFILES)) {
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('amigaModel');
      expect(profile).toHaveProperty('kickstartVersion');
      expect(profile).toHaveProperty('kickstartRevision');
      expect(profile).toHaveProperty('cpu');
      expect(profile).toHaveProperty('chipMemoryKb');
      expect(profile).toHaveProperty('slowMemoryKb');
      expect(profile).toHaveProperty('fastMemoryKb');
      expect(profile).toHaveProperty('chipset');
      expect(profile).toHaveProperty('display');
      expect(profile.display).toHaveProperty('width');
      expect(profile.display).toHaveProperty('height');
      expect(profile).toHaveProperty('sound');
      expect(profile.sound).toHaveProperty('stereoSeparation');
    }
  });
});

// ---------------------------------------------------------------------------
// A500 profile
// ---------------------------------------------------------------------------

describe('A500 profile', () => {
  it('has correct identity', () => {
    const p = HARDWARE_PROFILES.a500;
    expect(p.id).toBe('a500');
    expect(p.name).toBe('Amiga 500');
    expect(p.amigaModel).toBe('A500');
  });

  it('uses OCS chipset with 68000 CPU', () => {
    const p = HARDWARE_PROFILES.a500;
    expect(p.chipset).toBe('OCS');
    expect(p.cpu).toBe('68000');
  });

  it('has Kickstart 1.3 / 34.005', () => {
    const p = HARDWARE_PROFILES.a500;
    expect(p.kickstartVersion).toBe('1.3');
    expect(p.kickstartRevision).toBe('34.005');
  });

  it('has 512K chip + 512K slow + 0K fast', () => {
    const p = HARDWARE_PROFILES.a500;
    expect(p.chipMemoryKb).toBe(512);
    expect(p.slowMemoryKb).toBe(512);
    expect(p.fastMemoryKb).toBe(0);
  });

  it('has standard display and sound settings', () => {
    const p = HARDWARE_PROFILES.a500;
    expect(p.display.width).toBe(720);
    expect(p.display.height).toBe(568);
    expect(p.sound.stereoSeparation).toBe(70);
  });
});

// ---------------------------------------------------------------------------
// A1200 profile
// ---------------------------------------------------------------------------

describe('A1200 profile', () => {
  it('has correct identity', () => {
    const p = HARDWARE_PROFILES.a1200;
    expect(p.id).toBe('a1200');
    expect(p.name).toBe('Amiga 1200');
    expect(p.amigaModel).toBe('A1200');
  });

  it('uses AGA chipset with 68ec020 CPU', () => {
    const p = HARDWARE_PROFILES.a1200;
    expect(p.chipset).toBe('AGA');
    expect(p.cpu).toBe('68ec020');
  });

  it('has Kickstart 3.1 / 40.068', () => {
    const p = HARDWARE_PROFILES.a1200;
    expect(p.kickstartVersion).toBe('3.1');
    expect(p.kickstartRevision).toBe('40.068');
  });

  it('has 2048K chip + 0K slow + 0K fast', () => {
    const p = HARDWARE_PROFILES.a1200;
    expect(p.chipMemoryKb).toBe(2048);
    expect(p.slowMemoryKb).toBe(0);
    expect(p.fastMemoryKb).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// A1200+030 profile
// ---------------------------------------------------------------------------

describe('A1200+030 profile', () => {
  it('has correct identity', () => {
    const p = HARDWARE_PROFILES['a1200-030'];
    expect(p.id).toBe('a1200-030');
    expect(p.name).toContain('68030');
  });

  it('uses A1200/020 FS-UAE model for Zorro III', () => {
    const p = HARDWARE_PROFILES['a1200-030'];
    expect(p.amigaModel).toBe('A1200/020');
  });

  it('uses 68030 CPU', () => {
    const p = HARDWARE_PROFILES['a1200-030'];
    expect(p.cpu).toBe('68030');
  });

  it('has 8192K fast RAM', () => {
    const p = HARDWARE_PROFILES['a1200-030'];
    expect(p.fastMemoryKb).toBe(8192);
  });

  it('uses AGA chipset with KS 3.1', () => {
    const p = HARDWARE_PROFILES['a1200-030'];
    expect(p.chipset).toBe('AGA');
    expect(p.kickstartVersion).toBe('3.1');
    expect(p.kickstartRevision).toBe('40.068');
  });
});

// ---------------------------------------------------------------------------
// A4000 profile
// ---------------------------------------------------------------------------

describe('A4000 profile', () => {
  it('has correct identity', () => {
    const p = HARDWARE_PROFILES.a4000;
    expect(p.id).toBe('a4000');
    expect(p.name).toContain('4000');
  });

  it('uses A4000/040 FS-UAE model', () => {
    const p = HARDWARE_PROFILES.a4000;
    expect(p.amigaModel).toBe('A4000/040');
  });

  it('uses 68040 CPU with AGA chipset', () => {
    const p = HARDWARE_PROFILES.a4000;
    expect(p.cpu).toBe('68040');
    expect(p.chipset).toBe('AGA');
  });

  it('has 2048K chip + 8192K fast', () => {
    const p = HARDWARE_PROFILES.a4000;
    expect(p.chipMemoryKb).toBe(2048);
    expect(p.fastMemoryKb).toBe(8192);
  });
});

// ---------------------------------------------------------------------------
// WHDLoad profile
// ---------------------------------------------------------------------------

describe('WHDLoad profile', () => {
  it('has correct identity', () => {
    const p = HARDWARE_PROFILES.whdload;
    expect(p.id).toBe('whdload');
    expect(p.name).toContain('WHDLoad');
  });

  it('is A1200-based', () => {
    const p = HARDWARE_PROFILES.whdload;
    expect(p.amigaModel).toBe('A1200');
  });

  it('requires Kickstart 3.1', () => {
    const p = HARDWARE_PROFILES.whdload;
    expect(p.kickstartVersion).toBe('3.1');
    expect(p.kickstartRevision).toBe('40.068');
  });

  it('has 8192K fast RAM for WHDLoad preloading', () => {
    const p = HARDWARE_PROFILES.whdload;
    expect(p.fastMemoryKb).toBe(8192);
  });

  it('uses AGA chipset', () => {
    const p = HARDWARE_PROFILES.whdload;
    expect(p.chipset).toBe('AGA');
  });
});

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------

describe('getProfile', () => {
  it('returns the A500 profile', () => {
    const p = getProfile('a500');
    expect(p).toBeDefined();
    expect(p!.id).toBe('a500');
    expect(p!.name).toBe('Amiga 500');
  });

  it('returns the A1200 profile', () => {
    const p = getProfile('a1200');
    expect(p).toBeDefined();
    expect(p!.id).toBe('a1200');
  });

  it('returns undefined for nonexistent ID', () => {
    const p = getProfile('nonexistent' as any);
    expect(p).toBeUndefined();
  });

  it('returns a frozen copy (mutation does not affect source)', () => {
    const p = getProfile('a500');
    expect(p).toBeDefined();
    // Verify it's frozen or at least a copy
    const original = getProfile('a500');
    expect(Object.isFrozen(p)).toBe(true);
    // Verify source is unaffected even if somehow mutated
    expect(original).toStrictEqual(p);
  });
});

// ---------------------------------------------------------------------------
// getAllProfiles
// ---------------------------------------------------------------------------

describe('getAllProfiles', () => {
  it('returns array of 5 profiles', () => {
    const all = getAllProfiles();
    expect(all).toHaveLength(5);
  });

  it('includes all 5 profile IDs', () => {
    const all = getAllProfiles();
    const ids = all.map((p) => p.id);
    expect(ids).toContain('a500');
    expect(ids).toContain('a1200');
    expect(ids).toContain('a1200-030');
    expect(ids).toContain('a4000');
    expect(ids).toContain('whdload');
  });
});

// ---------------------------------------------------------------------------
// getProfileForModel
// ---------------------------------------------------------------------------

describe('getProfileForModel', () => {
  it('returns A500 profile for model "A500"', () => {
    const p = getProfileForModel('A500');
    expect(p).toBeDefined();
    expect(p!.id).toBe('a500');
  });

  it('returns A1200 profile for model "A1200"', () => {
    const p = getProfileForModel('A1200');
    expect(p).toBeDefined();
    expect(p!.id).toBe('a1200');
  });

  it('returns A4000 profile for model "A4000/040"', () => {
    const p = getProfileForModel('A4000/040');
    expect(p).toBeDefined();
    expect(p!.id).toBe('a4000');
  });

  it('returns A1200-030 profile for model "A1200/020"', () => {
    const p = getProfileForModel('A1200/020');
    expect(p).toBeDefined();
    expect(p!.id).toBe('a1200-030');
  });

  it('returns undefined for unknown model', () => {
    const p = getProfileForModel('Unknown');
    expect(p).toBeUndefined();
  });
});
