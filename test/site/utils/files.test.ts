import { describe, it, expect } from 'vitest';
import {
  walkMarkdownFiles,
  createFileOps,
} from '../../../src/site/utils/files';

/** Helper: build an in-memory directory tree for the walker. */
function mockWalker(tree: Record<string, 'file' | 'dir'>) {
  const readDir = async (dir: string): Promise<string[]> => {
    const prefix = dir.endsWith('/') ? dir : dir + '/';
    const entries = new Set<string>();
    for (const p of Object.keys(tree)) {
      if (p.startsWith(prefix) && p !== prefix) {
        const rest = p.slice(prefix.length);
        const firstSegment = rest.split('/')[0];
        entries.add(firstSegment);
      }
    }
    return [...entries];
  };

  const stat = async (
    fullPath: string,
  ): Promise<{ isDirectory: () => boolean }> => {
    const normalized = fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath;
    const kind = tree[normalized] ?? tree[normalized + '/'] ?? 'file';
    return { isDirectory: () => kind === 'dir' };
  };

  return { readDir, stat };
}

describe('walkMarkdownFiles', () => {
  it('finds all .md files', async () => {
    const { readDir, stat } = mockWalker({
      'root/': 'dir',
      'root/index.md': 'file',
      'root/about.md': 'file',
      'root/logo.png': 'file',
    });

    const result = await walkMarkdownFiles('root', readDir, stat);
    expect(result).toContain('index.md');
    expect(result).toContain('about.md');
    expect(result).not.toContain('logo.png');
  });

  it('ignores directories starting with _', async () => {
    const { readDir, stat } = mockWalker({
      'root/': 'dir',
      'root/page.md': 'file',
      'root/_templates': 'dir',
      'root/_templates/base.md': 'file',
    });

    const result = await walkMarkdownFiles('root', readDir, stat);
    expect(result).toEqual(['page.md']);
  });

  it('returns sorted paths', async () => {
    const { readDir, stat } = mockWalker({
      'root/': 'dir',
      'root/zebra.md': 'file',
      'root/alpha.md': 'file',
      'root/mid.md': 'file',
    });

    const result = await walkMarkdownFiles('root', readDir, stat);
    expect(result).toEqual(['alpha.md', 'mid.md', 'zebra.md']);
  });

  it('handles empty directory', async () => {
    const { readDir, stat } = mockWalker({
      'root/': 'dir',
    });

    const result = await walkMarkdownFiles('root', readDir, stat);
    expect(result).toEqual([]);
  });

  it('handles nested directories', async () => {
    const { readDir, stat } = mockWalker({
      'root/': 'dir',
      'root/top.md': 'file',
      'root/sub': 'dir',
      'root/sub/nested.md': 'file',
      'root/sub/deep': 'dir',
      'root/sub/deep/leaf.md': 'file',
    });

    const result = await walkMarkdownFiles('root', readDir, stat);
    expect(result).toEqual(['sub/deep/leaf.md', 'sub/nested.md', 'top.md']);
  });
});

describe('createFileOps', () => {
  it('readFile and writeFile round-trip with in-memory store', async () => {
    const store = new Map<string, string>();
    const ops = createFileOps({
      readFile: async (p) => {
        const v = store.get(p);
        if (v === undefined) throw new Error('not found');
        return v;
      },
      writeFile: async (p, c) => {
        store.set(p, c);
      },
      ensureDir: async () => {},
      copyDir: async () => {},
    });

    await ops.writeFile('/tmp/test.txt', 'hello world');
    const content = await ops.readFile('/tmp/test.txt');
    expect(content).toBe('hello world');
  });

  it('ensureDir calls through to injected implementation', async () => {
    const dirs: string[] = [];
    const ops = createFileOps({
      readFile: async () => '',
      writeFile: async () => {},
      ensureDir: async (p) => {
        dirs.push(p);
      },
      copyDir: async () => {},
    });

    await ops.ensureDir('/tmp/a/b/c');
    expect(dirs).toEqual(['/tmp/a/b/c']);
  });

  it('copyDir calls through to injected implementation', async () => {
    const copies: Array<{ src: string; dest: string }> = [];
    const ops = createFileOps({
      readFile: async () => '',
      writeFile: async () => {},
      ensureDir: async () => {},
      copyDir: async (s, d) => {
        copies.push({ src: s, dest: d });
      },
    });

    await ops.copyDir('/src', '/dest');
    expect(copies).toEqual([{ src: '/src', dest: '/dest' }]);
  });
});
