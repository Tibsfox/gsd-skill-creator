import type { TemplateData } from './types';

export type TemplateRegistry = Map<string, string>;

/** Load templates from a directory. */
export async function loadTemplates(
  _templateDir: string,
  _readFn?: (path: string) => Promise<string>,
  _walkFn?: (dir: string) => Promise<string[]>,
): Promise<TemplateRegistry> {
  throw new Error('Not implemented');
}

/** Render a template by name with the given data context. */
export function renderTemplate(
  _name: string,
  _data: TemplateData,
  _registry: TemplateRegistry,
): string {
  throw new Error('Not implemented');
}
