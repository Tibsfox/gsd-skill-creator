import { describe, it, expect } from 'vitest';
import { parse, tokenize } from '../index.js';

describe('bash syntax', () => {
  it('tokenizes comments, strings, variable refs', () => {
    const src = `# top\nNAME="world"\necho $NAME`;
    const tokens = tokenize(src, 'bash');
    expect(tokens.some((t) => t.kind === 'comment')).toBe(true);
    expect(tokens.some((t) => t.kind === 'string')).toBe(true);
    expect(tokens.some((t) => t.kind === 'identifier' && t.value === '$NAME')).toBe(true);
  });

  it('extracts function decls (both shapes) and source', () => {
    const src = `
      source ./common.sh
      function greet { echo "hi"; }
      farewell() { echo "bye"; }
    `;
    const { ast } = parse(src, 'bash');
    expect(ast.nodes.find((n) => n.kind === 'function' && n.name === 'greet')).toBeTruthy();
    expect(ast.nodes.find((n) => n.kind === 'function' && n.name === 'farewell')).toBeTruthy();
    expect(ast.nodes.some((n) => n.kind === 'import')).toBe(true);
  });
});
