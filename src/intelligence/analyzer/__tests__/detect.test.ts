/**
 * C01 T3 — Language detection tests.
 */

import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../detect.js';

describe('detectLanguage — extension detection', () => {
  it('detects TypeScript from .ts extension', () => {
    expect(detectLanguage('foo.ts')).toBe('typescript');
  });

  it('detects TSX from .tsx extension', () => {
    expect(detectLanguage('component.tsx')).toBe('tsx');
  });

  it('detects JavaScript from .js extension', () => {
    expect(detectLanguage('app.js')).toBe('javascript');
  });

  it('detects JavaScript from .mjs extension', () => {
    expect(detectLanguage('module.mjs')).toBe('javascript');
  });

  it('detects JavaScript from .cjs extension', () => {
    expect(detectLanguage('commonjs.cjs')).toBe('javascript');
  });

  it('detects JSX from .jsx extension', () => {
    expect(detectLanguage('component.jsx')).toBe('jsx');
  });

  it('detects Rust from .rs extension', () => {
    expect(detectLanguage('main.rs')).toBe('rust');
  });

  it('detects Python from .py extension', () => {
    expect(detectLanguage('script.py')).toBe('python');
  });

  it('detects Bash from .sh extension', () => {
    expect(detectLanguage('script.sh')).toBe('bash');
  });

  it('detects Bash from .bash extension', () => {
    expect(detectLanguage('script.bash')).toBe('bash');
  });

  it('detects GLSL from .glsl extension', () => {
    expect(detectLanguage('shader.glsl')).toBe('glsl');
  });

  it('detects GLSL from .vert extension', () => {
    expect(detectLanguage('shader.vert')).toBe('glsl');
  });

  it('detects GLSL from .frag extension', () => {
    expect(detectLanguage('shader.frag')).toBe('glsl');
  });

  it('detects GLSL from .comp extension', () => {
    expect(detectLanguage('shader.comp')).toBe('glsl');
  });

  it('returns null for unknown extension', () => {
    expect(detectLanguage('file.bin')).toBeNull();
  });

  it('returns null for extensionless file with no shebang', () => {
    expect(detectLanguage('Makefile')).toBeNull();
  });
});

describe('detectLanguage — shebang fallback', () => {
  it('detects Python from #!/usr/bin/env python3 shebang', () => {
    expect(detectLanguage('foo', '#!/usr/bin/env python3\nprint("hello")')).toBe('python');
  });

  it('detects Python from #!/usr/bin/python shebang', () => {
    expect(detectLanguage('foo', '#!/usr/bin/python\nprint("hello")')).toBe('python');
  });

  it('detects Bash from #!/bin/bash shebang', () => {
    expect(detectLanguage('foo', '#!/bin/bash\necho hello')).toBe('bash');
  });

  it('detects Bash from #!/bin/sh shebang', () => {
    expect(detectLanguage('foo', '#!/bin/sh\necho hello')).toBe('bash');
  });

  it('returns null when shebang is unrecognized', () => {
    expect(detectLanguage('foo', '#!/usr/bin/perl\nprint "hello"')).toBeNull();
  });

  it('extension takes priority over shebang', () => {
    // A .ts file with a bash shebang → still TypeScript
    expect(detectLanguage('foo.ts', '#!/bin/bash\nexport const x = 1;')).toBe('typescript');
  });
});
