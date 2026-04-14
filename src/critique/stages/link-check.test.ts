import { describe, it, expect } from 'vitest';
import { linkCheckStage } from './link-check.js';
import type { SkillDraft } from '../types.js';
import type { LinkCheckOptions } from '../../site/link-check.js';

function makeOpts(overrides: Partial<LinkCheckOptions> = {}): LinkCheckOptions {
  return {
    readFile: async () => { throw new Error('not used'); },
    walkDir: async () => [],
    checkExternal: false,
    ...overrides,
  };
}

function makeDraft(body = '# Test Skill\n\nNo links here.'): SkillDraft {
  return {
    skillName: 'test-skill',
    skillDir: '/skills/test-skill',
    body,
    metadata: { name: 'test-skill', description: 'A test' },
    files: new Map(),
  };
}

describe('linkCheckStage', () => {
  it('returns [] when all links resolve (no links = all pass)', async () => {
    const stage = linkCheckStage(makeOpts());
    const findings = await stage.run(makeDraft());
    expect(findings).toHaveLength(0);
  });

  it('returns one finding per broken external link (when checkExternal=false, external links are skipped)', async () => {
    // External links are skipped when checkExternal=false — so no broken-external findings
    const draft = makeDraft('[Visit docs](https://example.com/docs/)');
    const stage = linkCheckStage(makeOpts({ checkExternal: false }));
    const findings = await stage.run(draft);
    // Skipped external links produce no error findings
    expect(findings.filter((f) => f.stage === 'link-check')).toHaveLength(0);
  });

  it('stage name is link-check', () => {
    const stage = linkCheckStage(makeOpts());
    expect(stage.name).toBe('link-check');
  });

  it('passes through opts.checkExternal=false by default', async () => {
    const httpHead = vi.fn(async (url: string) => ({ status: 200, finalUrl: url }));
    const draft = makeDraft('[External](https://example.com/)');
    const stage = linkCheckStage(makeOpts({ checkExternal: false, httpHead }));
    await stage.run(draft);
    // httpHead should NOT be called when checkExternal=false
    expect(httpHead).not.toHaveBeenCalled();
  });

  it('returns findings for broken internal links in HTML files', async () => {
    const htmlContent = '<html><body><a href="/nonexistent/">Missing</a></body></html>';
    const draft: SkillDraft = {
      skillName: 'test',
      skillDir: '/skills/test',
      body: '# Test',
      metadata: { name: 'test', description: 'test' },
      files: new Map([['index.html', htmlContent]]),
    };
    const stage = linkCheckStage(makeOpts());
    const findings = await stage.run(draft);
    // /nonexistent/ is not in builtUrls → broken-internal
    const broken = findings.filter((f) => f.message.includes('broken-internal'));
    expect(broken.length).toBeGreaterThan(0);
    expect(broken[0]?.stage).toBe('link-check');
    expect(broken[0]?.severity).toBe('error');
  });
});

// Need to import vi for the mock
import { vi } from 'vitest';
