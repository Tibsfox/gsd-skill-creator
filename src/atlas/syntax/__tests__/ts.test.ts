import { describe, it, expect } from 'vitest';
import { parse, tokenize } from '../index.js';

describe('typescript syntax', () => {
  it('highlights keywords, strings, numbers, comments', () => {
    const src = `// hi\nexport const x: number = 42;\nconst s = "hello";`;
    const tokens = tokenize(src, 'typescript');
    const kinds = new Set(tokens.map((t) => t.kind));
    expect(kinds.has('comment')).toBe(true);
    expect(kinds.has('keyword')).toBe(true);
    expect(kinds.has('number')).toBe(true);
    expect(kinds.has('string')).toBe(true);
  });

  it('extracts function and class declarations with one method', () => {
    const src = `
      export function greet(name: string): string { return "hi " + name; }
      export class Greeter {
        say(msg: string) { return msg; }
        async run() { return 1; }
      }
    `;
    const { ast } = parse(src, 'typescript');
    const fns = ast.nodes.filter((n) => n.kind === 'function');
    const classes = ast.nodes.filter((n) => n.kind === 'class');
    const methods = ast.nodes.filter((n) => n.kind === 'method');
    expect(fns.map((n) => n.name)).toContain('greet');
    expect(classes.map((n) => n.name)).toContain('Greeter');
    expect(methods.map((n) => n.name)).toContain('say');
    expect(methods.find((n) => n.name === 'say')?.parent).toBe('Greeter');
  });
});
