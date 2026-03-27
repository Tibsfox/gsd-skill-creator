import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { VariantGenerator } from './variant-generator.js';

describe('VariantGenerator', () => {
  let tmpDir: string;
  let generator: VariantGenerator;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'variant-gen-'));
    generator = new VariantGenerator();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('fork()', () => {
    it('creates variant directories with SKILL.md copies', async () => {
      const skillPath = path.join(tmpDir, 'my-skill');
      await fs.mkdir(skillPath, { recursive: true });
      await fs.writeFile(path.join(skillPath, 'SKILL.md'), '# My Skill\n\nDo stuff.\n');

      const paths = await generator.fork(skillPath, ['local-small', 'cloud']);

      expect(paths).toHaveLength(2);
      for (const variantPath of paths) {
        const content = await fs.readFile(path.join(variantPath, 'SKILL.md'), 'utf-8');
        expect(content).toBe('# My Skill\n\nDo stuff.\n');
      }
    });

    it('returns array of variant paths', async () => {
      const skillPath = path.join(tmpDir, 'test-skill');
      await fs.mkdir(skillPath, { recursive: true });
      await fs.writeFile(path.join(skillPath, 'SKILL.md'), '# Test\n');

      const paths = await generator.fork(skillPath, ['local-large']);

      expect(paths).toEqual([path.join(skillPath, 'variants', 'local-large')]);
    });
  });

  describe('applyHints()', () => {
    it('creates Model-Specific Guidance section if missing', async () => {
      const variantPath = path.join(tmpDir, 'variant');
      await fs.mkdir(variantPath, { recursive: true });
      await fs.writeFile(path.join(variantPath, 'SKILL.md'), '# My Skill\n\nBase content.\n');

      await generator.applyHints(variantPath, ['Use shorter prompts'], 'local-small');

      const content = await fs.readFile(path.join(variantPath, 'SKILL.md'), 'utf-8');
      expect(content).toContain('## Model-Specific Guidance');
      expect(content).toContain('### For local-small models');
      expect(content).toContain('- Use shorter prompts');
    });

    it('appends to existing Model-Specific Guidance section', async () => {
      const variantPath = path.join(tmpDir, 'variant');
      await fs.mkdir(variantPath, { recursive: true });
      await fs.writeFile(
        path.join(variantPath, 'SKILL.md'),
        '# My Skill\n\n## Model-Specific Guidance\n\n### For cloud models\n\n- Be specific\n',
      );

      await generator.applyHints(variantPath, ['Add examples'], 'local-small');

      const content = await fs.readFile(path.join(variantPath, 'SKILL.md'), 'utf-8');
      expect(content).toContain('### For cloud models');
      expect(content).toContain('- Be specific');
      expect(content).toContain('### For local-small models');
      expect(content).toContain('- Add examples');
    });

    it('appends under existing chip class subsection', async () => {
      const variantPath = path.join(tmpDir, 'variant');
      await fs.mkdir(variantPath, { recursive: true });
      await fs.writeFile(
        path.join(variantPath, 'SKILL.md'),
        '# My Skill\n\n## Model-Specific Guidance\n\n### For local-small models\n\n- Existing hint\n',
      );

      await generator.applyHints(variantPath, ['New hint'], 'local-small');

      const content = await fs.readFile(path.join(variantPath, 'SKILL.md'), 'utf-8');
      expect(content).toContain('- Existing hint');
      expect(content).toContain('- New hint');
    });

    it('deduplicates identical hints', async () => {
      const variantPath = path.join(tmpDir, 'variant');
      await fs.mkdir(variantPath, { recursive: true });
      await fs.writeFile(
        path.join(variantPath, 'SKILL.md'),
        '# My Skill\n\n## Model-Specific Guidance\n\n### For local-small models\n\n- Existing hint\n',
      );

      await generator.applyHints(variantPath, ['Existing hint', 'New hint'], 'local-small');

      const content = await fs.readFile(path.join(variantPath, 'SKILL.md'), 'utf-8');
      const matches = content.match(/- Existing hint/g);
      expect(matches).toHaveLength(1);
      expect(content).toContain('- New hint');
    });

    it('preserves original skill content above guidance section', async () => {
      const variantPath = path.join(tmpDir, 'variant');
      await fs.mkdir(variantPath, { recursive: true });
      const originalContent = '# My Skill\n\nDo amazing things.\n\n## Examples\n\nExample 1.\n';
      await fs.writeFile(path.join(variantPath, 'SKILL.md'), originalContent);

      await generator.applyHints(variantPath, ['Hint 1'], 'cloud');

      const content = await fs.readFile(path.join(variantPath, 'SKILL.md'), 'utf-8');
      expect(content.startsWith(originalContent.trimEnd())).toBe(true);
    });
  });
});
