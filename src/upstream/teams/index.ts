import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Team YAML configuration shape */
export interface TeamYaml {
  name: string;
  topology: string;
  description: string;
  members: string[];
  flow?: string;
  leader?: string;
  routes?: Record<string, string>;
  workers?: string[];
}

/** Injectable file-reading function for testability */
export type ReadFileFn = (path: string) => string;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultReadFile: ReadFileFn = (path: string) => readFileSync(path, 'utf-8');

/**
 * Load and parse a team YAML definition by name.
 * Accepts an injectable ReadFileFn for testing.
 */
export function loadTeamConfig(name: string, readFile: ReadFileFn = defaultReadFile): TeamYaml {
  const filePath = resolve(__dirname, `${name}.yaml`);
  const content = readFile(filePath);
  const parsed = yaml.load(content) as TeamYaml;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid team YAML for "${name}": parsed result is not an object`);
  }
  if (!parsed.name || !parsed.topology || !parsed.description) {
    throw new Error(`Team YAML for "${name}" is missing required fields (name, topology, description)`);
  }
  if (!Array.isArray(parsed.members) || parsed.members.length === 0) {
    throw new Error(`Team YAML for "${name}" must specify at least one member`);
  }

  return parsed;
}
