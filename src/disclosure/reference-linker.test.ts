import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReferenceLinker, CircularReferenceError } from './reference-linker.js';
import type { ReferenceLink, CycleDetectionResult, ValidationResult } from './reference-linker.js';

describe('ReferenceLinker', () => {
  let linker: ReferenceLinker;

  beforeEach(() => {
    linker = new ReferenceLinker();
  });

  describe('generateLink', () => {
    it('should generate link from SKILL.md to references/guidelines.md', () => {
      const link = linker.generateLink('SKILL.md', 'references/guidelines.md');
      expect(link).toBe('@references/guidelines.md');
    });

    it('should generate link from SKILL.md to scripts/setup.sh', () => {
      const link = linker.generateLink('SKILL.md', 'scripts/setup.sh');
      expect(link).toBe('@scripts/setup.sh');
    });

    it('should generate link between references files', () => {
      const link = linker.generateLink('references/a.md', 'references/b.md');
      expect(link).toBe('@references/b.md');
    });

    it('should handle filenames with hyphens and dots', () => {
      const link = linker.generateLink('SKILL.md', 'references/my-guide.v2.md');
      expect(link).toBe('@references/my-guide.v2.md');
    });
  });

  describe('parseReferences', () => {
    it('should extract @references/ links from markdown', () => {
      const content = `# Skill
See @references/guidelines.md for details.
Also check @references/examples.md.`;

      const refs = linker.parseReferences(content);
      expect(refs).toHaveLength(2);
      expect(refs[0]).toEqual({ path: 'references/guidelines.md', line: 2 });
      expect(refs[1]).toEqual({ path: 'references/examples.md', line: 3 });
    });

    it('should extract @scripts/ links from markdown', () => {
      const content = `Run @scripts/setup.sh to start.`;
      const refs = linker.parseReferences(content);
      expect(refs).toHaveLength(1);
      expect(refs[0]).toEqual({ path: 'scripts/setup.sh', line: 1 });
    });

    it('should handle multiple references on same line', () => {
      const content = `Compare @references/a.md with @references/b.md`;
      const refs = linker.parseReferences(content);
      expect(refs).toHaveLength(2);
      expect(refs[0].path).toBe('references/a.md');
      expect(refs[1].path).toBe('references/b.md');
      // Both on line 1
      expect(refs[0].line).toBe(1);
      expect(refs[1].line).toBe(1);
    });

    it('should ignore references inside fenced code blocks', () => {
      const content = `# Skill
See @references/real.md for info.

\`\`\`markdown
This @references/fake.md should be ignored.
\`\`\`

And @references/also-real.md here.`;

      const refs = linker.parseReferences(content);
      expect(refs).toHaveLength(2);
      expect(refs.map(r => r.path)).toEqual([
        'references/real.md',
        'references/also-real.md',
      ]);
    });

    it('should return empty array for content with no references', () => {
      const content = `# Just a plain skill
No references here.`;
      const refs = linker.parseReferences(content);
      expect(refs).toEqual([]);
    });

    it('should handle nested code blocks correctly', () => {
      const content = `Real @references/outside.md

\`\`\`
@references/inside-block.md
\`\`\`

Also real @references/after-block.md`;

      const refs = linker.parseReferences(content);
      expect(refs).toHaveLength(2);
      expect(refs.map(r => r.path)).toEqual([
        'references/outside.md',
        'references/after-block.md',
      ]);
    });
  });

  describe('detectCircularReferences', () => {
    it('should return no cycle for empty file map', () => {
      const fileMap = new Map<string, string>();
      const result = linker.detectCircularReferences(fileMap);
      expect(result.hasCycle).toBe(false);
    });

    it('should return no cycle for linear chain', () => {
      const fileMap = new Map<string, string>([
        ['SKILL.md', 'See @references/a.md'],
        ['references/a.md', 'See @references/b.md'],
        ['references/b.md', 'Leaf content'],
      ]);

      const result = linker.detectCircularReferences(fileMap);
      expect(result.hasCycle).toBe(false);
    });

    it('should detect self-reference', () => {
      const fileMap = new Map<string, string>([
        ['references/a.md', 'See @references/a.md for self'],
      ]);

      const result = linker.detectCircularReferences(fileMap);
      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
      expect(result.cycle).toContain('references/a.md');
    });

    it('should detect direct cycle (A -> B -> A)', () => {
      const fileMap = new Map<string, string>([
        ['references/a.md', 'See @references/b.md'],
        ['references/b.md', 'See @references/a.md'],
      ]);

      const result = linker.detectCircularReferences(fileMap);
      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
      expect(result.cycle).toContain('references/a.md');
      expect(result.cycle).toContain('references/b.md');
    });

    it('should detect multi-hop cycle (A -> B -> C -> A)', () => {
      const fileMap = new Map<string, string>([
        ['references/a.md', 'See @references/b.md'],
        ['references/b.md', 'See @references/c.md'],
        ['references/c.md', 'See @references/a.md'],
      ]);

      const result = linker.detectCircularReferences(fileMap);
      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
      expect(result.cycle!.length).toBe(3);
      expect(result.cycle).toContain('references/a.md');
      expect(result.cycle).toContain('references/b.md');
      expect(result.cycle).toContain('references/c.md');
    });

    it('should return no cycle for tree structure', () => {
      const fileMap = new Map<string, string>([
        ['SKILL.md', 'See @references/a.md and @references/b.md'],
        ['references/a.md', 'Leaf'],
        ['references/b.md', 'See @references/c.md'],
        ['references/c.md', 'Leaf'],
      ]);

      const result = linker.detectCircularReferences(fileMap);
      expect(result.hasCycle).toBe(false);
    });

    it('should treat scripts as leaf nodes (no cycle through scripts)', () => {
      // Scripts never reference back, so they can't form cycles
      const fileMap = new Map<string, string>([
        ['SKILL.md', 'Run @scripts/setup.sh'],
        // scripts/setup.sh is NOT in fileMap (it's not .md, scripts are leaf nodes)
      ]);

      const result = linker.detectCircularReferences(fileMap);
      expect(result.hasCycle).toBe(false);
    });

    it('should handle file with only code block references (ignored)', () => {
      const fileMap = new Map<string, string>([
        ['SKILL.md', '```\n@references/a.md\n```'],
        ['references/a.md', 'See @references/b.md'],
        ['references/b.md', 'Leaf'],
      ]);

      // SKILL.md has no real references (code block), so no edges from it
      const result = linker.detectCircularReferences(fileMap);
      expect(result.hasCycle).toBe(false);
    });
  });

  describe('validateSkillReferences', () => {
    it('should validate skill directory with no circular references', async () => {
      // Mock fs operations by providing fileMap directly
      // For the actual implementation, validateSkillReferences reads from disk
      // We'll test this with a temp directory approach
      const { mkdtemp, writeFile, mkdir } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const os = await import('node:os');

      const tmpDir = await mkdtemp(join(os.default.tmpdir(), 'ref-linker-'));
      await mkdir(join(tmpDir, 'references'), { recursive: true });

      await writeFile(join(tmpDir, 'SKILL.md'), 'See @references/guide.md for info.');
      await writeFile(join(tmpDir, 'references', 'guide.md'), 'Guide content.');

      const result = await linker.validateSkillReferences(tmpDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect circular references in skill directory', async () => {
      const { mkdtemp, writeFile, mkdir } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const os = await import('node:os');

      const tmpDir = await mkdtemp(join(os.default.tmpdir(), 'ref-linker-'));
      await mkdir(join(tmpDir, 'references'), { recursive: true });

      await writeFile(join(tmpDir, 'references', 'a.md'), 'See @references/b.md');
      await writeFile(join(tmpDir, 'references', 'b.md'), 'See @references/a.md');

      const result = await linker.validateSkillReferences(tmpDir);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/circular/i);
    });

    it('should detect dead links as warnings', async () => {
      const { mkdtemp, writeFile, mkdir } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const os = await import('node:os');

      const tmpDir = await mkdtemp(join(os.default.tmpdir(), 'ref-linker-'));
      await mkdir(join(tmpDir, 'references'), { recursive: true });

      // SKILL.md references a file that doesn't exist
      await writeFile(join(tmpDir, 'SKILL.md'), 'See @references/nonexistent.md');

      const result = await linker.validateSkillReferences(tmpDir);
      // Dead links are warnings, not errors
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toMatch(/nonexistent\.md/);
    });

    it('should handle missing referenced files (dead links)', async () => {
      const { mkdtemp, writeFile, mkdir } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const os = await import('node:os');

      const tmpDir = await mkdtemp(join(os.default.tmpdir(), 'ref-linker-'));
      await mkdir(join(tmpDir, 'references'), { recursive: true });

      await writeFile(join(tmpDir, 'SKILL.md'), 'See @references/missing.md and @references/exists.md');
      await writeFile(join(tmpDir, 'references', 'exists.md'), 'Content.');

      const result = await linker.validateSkillReferences(tmpDir);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatch(/missing\.md/);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('CircularReferenceError', () => {
    it('should format cycle in error message', () => {
      const err = new CircularReferenceError(['a.md', 'b.md', 'c.md']);
      expect(err.message).toBe('Circular reference detected: a.md -> b.md -> c.md');
      expect(err.name).toBe('CircularReferenceError');
      expect(err.cycle).toEqual(['a.md', 'b.md', 'c.md']);
    });
  });
});
