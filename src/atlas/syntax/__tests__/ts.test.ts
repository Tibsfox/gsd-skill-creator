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

  it('captures named-import bindings', () => {
    const { ast } = parse(`import { foo, bar } from './x';`, 'typescript');
    const imp = ast.nodes.find((n) => n.kind === 'import');
    expect(imp?.name).toBe('./x');
    expect(imp?.importedNames).toEqual([
      { local: 'foo', original: 'foo' },
      { local: 'bar', original: 'bar' },
    ]);
  });

  it('captures default-import binding as original=default', () => {
    const { ast } = parse(`import Foo from './x';`, 'typescript');
    const imp = ast.nodes.find((n) => n.kind === 'import');
    expect(imp?.importedNames).toEqual([{ local: 'Foo', original: 'default' }]);
  });

  it('captures aliased named-import as local + original', () => {
    const { ast } = parse(`import { foo, bar as baz } from './x';`, 'typescript');
    const imp = ast.nodes.find((n) => n.kind === 'import');
    expect(imp?.importedNames).toEqual([
      { local: 'foo', original: 'foo' },
      { local: 'baz', original: 'bar' },
    ]);
  });

  it('captures namespace-import binding as original=*', () => {
    const { ast } = parse(`import * as N from './x';`, 'typescript');
    const imp = ast.nodes.find((n) => n.kind === 'import');
    expect(imp?.importedNames).toEqual([{ local: 'N', original: '*' }]);
  });

  it('captures default + named mixed-import bindings', () => {
    const { ast } = parse(`import D, { a, b as c } from './x';`, 'typescript');
    const imp = ast.nodes.find((n) => n.kind === 'import');
    expect(imp?.importedNames).toEqual([
      { local: 'D', original: 'default' },
      { local: 'a', original: 'a' },
      { local: 'c', original: 'b' },
    ]);
  });

  it('side-effect import has no importedNames', () => {
    const { ast } = parse(`import './polyfill';`, 'typescript');
    const imp = ast.nodes.find((n) => n.kind === 'import');
    expect(imp?.name).toBe('./polyfill');
    expect(imp?.importedNames).toBeUndefined();
  });

  it('named re-export carries importedNames on export node with module spec as name', () => {
    const { ast } = parse(`export { foo, bar as baz } from './y';`, 'typescript');
    const reExport = ast.nodes.find((n) => n.kind === 'export' && n.name === './y');
    expect(reExport).toBeDefined();
    expect(reExport?.importedNames).toEqual([
      { local: 'foo', original: 'foo' },
      { local: 'baz', original: 'bar' },
    ]);
  });

  it('named re-export emits individual export symbols for each binding', () => {
    const { ast } = parse(`export { foo, bar as baz } from './y';`, 'typescript');
    const exportNames = ast.nodes.filter((n) => n.kind === 'export').map((n) => n.name);
    expect(exportNames).toContain('foo');
    expect(exportNames).toContain('baz');
  });

  it('star re-export carries sentinel importedNames binding', () => {
    const { ast } = parse(`export * from './y';`, 'typescript');
    const reExport = ast.nodes.find((n) => n.kind === 'export' && n.name === './y');
    expect(reExport).toBeDefined();
    expect(reExport?.importedNames).toEqual([{ local: '*', original: '*' }]);
  });

  it('star-as-namespace re-export emits namespace binding and individual export symbol', () => {
    const { ast } = parse(`export * as NS from './y';`, 'typescript');
    const reExport = ast.nodes.find((n) => n.kind === 'export' && n.name === './y');
    expect(reExport).toBeDefined();
    expect(reExport?.importedNames).toEqual([{ local: 'NS', original: '*' }]);
    const nsExport = ast.nodes.find((n) => n.kind === 'export' && n.name === 'NS');
    expect(nsExport).toBeDefined();
  });

  it('plain export { x } without from clause does not produce re-export import record', () => {
    const { ast } = parse(`const x = 1;\nexport { x };`, 'typescript');
    const withFrom = ast.nodes.filter((n) => n.kind === 'export' && n.importedNames !== undefined);
    expect(withFrom).toHaveLength(0);
  });
});
