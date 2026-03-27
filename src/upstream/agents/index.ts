import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Agent YAML configuration shape */
export interface AgentYaml {
  name: string;
  model: string;
  description: string;
  tools: string[];
  budget_tokens: number;
  trigger_contexts: string[];
}

/** Injectable file-reading function for testability */
export type ReadFileFn = (path: string) => string;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultReadFile: ReadFileFn = (path: string) => readFileSync(path, 'utf-8');

/**
 * Load and parse an agent YAML definition by name.
 * Accepts an injectable ReadFileFn for testing.
 */
export function loadAgentConfig(name: string, readFile: ReadFileFn = defaultReadFile): AgentYaml {
  const filePath = resolve(__dirname, `${name}.yaml`);
  const content = readFile(filePath);
  const parsed = yaml.load(content) as AgentYaml;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid agent YAML for "${name}": parsed result is not an object`);
  }
  if (!parsed.name || !parsed.model || !parsed.description) {
    throw new Error(`Agent YAML for "${name}" is missing required fields (name, model, description)`);
  }
  if (!Array.isArray(parsed.tools) || parsed.tools.length === 0) {
    throw new Error(`Agent YAML for "${name}" must specify at least one tool`);
  }
  if (typeof parsed.budget_tokens !== 'number' || parsed.budget_tokens <= 0) {
    throw new Error(`Agent YAML for "${name}" must have a positive budget_tokens value`);
  }

  return parsed;
}
