import { describe, it, expect } from 'vitest';
import { parse, tokenize } from '../index.js';

describe('go syntax', () => {
  it('tokenizes raw strings, keywords, := operator', () => {
    const src = "package main\nimport \"fmt\"\nfunc main() { x := 1; fmt.Println(x) }";
    const tokens = tokenize(src, 'go');
    expect(tokens.some((t) => t.kind === 'keyword' && t.value === 'func')).toBe(true);
    expect(tokens.some((t) => t.kind === 'operator' && t.value === ':=')).toBe(true);
    expect(tokens.some((t) => t.kind === 'string')).toBe(true);
  });

  it('extracts func, type, package', () => {
    const src = `
      package svc
      import "fmt"
      type User struct { Name string }
      func Hello() string { return "hi" }
      func (u *User) Greet() string { return u.Name }
    `;
    const { ast } = parse(src, 'go');
    expect(ast.nodes.find((n) => n.kind === 'namespace' && n.name === 'svc')).toBeTruthy();
    expect(ast.nodes.find((n) => n.kind === 'struct' && n.name === 'User')).toBeTruthy();
    expect(ast.nodes.find((n) => n.kind === 'function' && n.name === 'Hello')).toBeTruthy();
    expect(ast.nodes.find((n) => n.kind === 'method' && n.name === 'Greet')).toBeTruthy();
  });
});
