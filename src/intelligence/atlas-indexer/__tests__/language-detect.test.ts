import { describe, it, expect } from 'vitest';
import { detectAtlasLanguage } from '../language-detect.js';

describe('atlas-indexer language-detect', () => {
  it('maps TS family to "ts"', () => {
    expect(detectAtlasLanguage('src/foo.ts')).toBe('ts');
    expect(detectAtlasLanguage('src/foo.tsx')).toBe('ts');
    expect(detectAtlasLanguage('src/foo.mts')).toBe('ts');
  });

  it('maps JS family to "js"', () => {
    expect(detectAtlasLanguage('src/foo.js')).toBe('js');
    expect(detectAtlasLanguage('src/foo.mjs')).toBe('js');
    expect(detectAtlasLanguage('src/foo.cjs')).toBe('js');
    expect(detectAtlasLanguage('src/foo.jsx')).toBe('js');
  });

  it('maps individual languages', () => {
    expect(detectAtlasLanguage('main.rs')).toBe('rust');
    expect(detectAtlasLanguage('mod.py')).toBe('python');
    expect(detectAtlasLanguage('cmd.go')).toBe('go');
    expect(detectAtlasLanguage('App.java')).toBe('java');
    expect(detectAtlasLanguage('vec.cpp')).toBe('cpp');
    expect(detectAtlasLanguage('build.sh')).toBe('bash');
    expect(detectAtlasLanguage('vert.glsl')).toBe('glsl');
  });

  it('returns null for unknown extensions and extensionless files', () => {
    expect(detectAtlasLanguage('README.md')).toBeNull();
    expect(detectAtlasLanguage('LICENSE')).toBeNull();
    expect(detectAtlasLanguage('image.png')).toBeNull();
    expect(detectAtlasLanguage('data.json')).toBeNull();
  });

  it('case-insensitive on extension', () => {
    expect(detectAtlasLanguage('Foo.TS')).toBe('ts');
    expect(detectAtlasLanguage('Foo.PY')).toBe('python');
  });
});
