/**
 * Python project detector: identifies build system, dependencies, test framework,
 * and directory layout from in-memory file maps.
 *
 * Part of the PyDMD dogfood install pipeline (Phase 404).
 */

import type { PythonProjectInfo, DependencySpec } from '../types.js';

// --- Simple line-based TOML section parser ---

interface TomlSections {
  [section: string]: string;
}

/**
 * Split TOML content into named sections. Each section's value is the raw
 * text between its header and the next header (or EOF).
 * Top-level content (before any header) goes under key "".
 */
function splitTomlSections(content: string): TomlSections {
  const sections: TomlSections = {};
  let currentSection = '';
  const lines = content.split('\n');
  const sectionBuf: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^\[([^\]]+)\]\s*$/);
    if (headerMatch) {
      sections[currentSection] = sectionBuf.join('\n');
      sectionBuf.length = 0;
      currentSection = headerMatch[1];
    } else {
      sectionBuf.push(line);
    }
  }
  sections[currentSection] = sectionBuf.join('\n');
  return sections;
}

/**
 * Extract a simple key = "value" from a TOML section body.
 */
function getTomlValue(sectionBody: string, key: string): string | null {
  for (const line of sectionBody.split('\n')) {
    const trimmed = line.trim();
    // Match: key = "value" or key = 'value'
    const match = trimmed.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"\\s*$`));
    if (match) return match[1];
    const matchSingle = trimmed.match(new RegExp(`^${key}\\s*=\\s*'([^']*)'\\s*$`));
    if (matchSingle) return matchSingle[1];
    // Match: key = value (unquoted)
    const matchUnquoted = trimmed.match(new RegExp(`^${key}\\s*=\\s*(.+)\\s*$`));
    if (matchUnquoted) {
      const val = matchUnquoted[1].trim();
      // Skip if it looks like an array
      if (val.startsWith('[')) continue;
      return val;
    }
  }
  return null;
}

/**
 * Extract an inline or multi-line array from a TOML section body.
 * Returns the raw string items (with quotes stripped).
 */
function getTomlArray(sectionBody: string, key: string): string[] {
  const lines = sectionBody.split('\n');
  const items: string[] = [];
  let collecting = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!collecting) {
      // Look for key = [...]
      const inlineMatch = trimmed.match(new RegExp(`^${key}\\s*=\\s*\\[(.*)\\]\\s*$`));
      if (inlineMatch) {
        // Inline array: key = ["a", "b"]
        return parseArrayItems(inlineMatch[1]);
      }
      // Multi-line: key = [
      const startMatch = trimmed.match(new RegExp(`^${key}\\s*=\\s*\\[\\s*$`));
      if (startMatch) {
        collecting = true;
        continue;
      }
    } else {
      // Collecting multi-line array items
      if (trimmed === ']') {
        collecting = false;
        break;
      }
      // Each line is a quoted string, possibly with trailing comma
      // Allow escaped quotes inside: "foo \"bar\" baz"
      const itemMatch = trimmed.match(/^"((?:[^"\\]|\\.)*)"[,]?\s*$/);
      if (itemMatch) {
        items.push(itemMatch[1].replace(/\\"/g, '"'));
      }
    }
  }

  return items;
}

function parseArrayItems(inline: string): string[] {
  const items: string[] = [];
  const matches = inline.matchAll(/"((?:[^"\\]|\\.)*)"/g);
  for (const m of matches) {
    // Unescape backslash-escaped quotes
    items.push(m[1].replace(/\\"/g, '"'));
  }
  return items;
}

// --- Dependency parsing ---

function parseDependencySpec(raw: string): DependencySpec {
  // Strip surrounding whitespace
  let dep = raw.trim();

  // Check for platform markers (;)
  let optional = false;
  const markerIdx = dep.indexOf(';');
  if (markerIdx !== -1) {
    optional = true;
    dep = dep.substring(0, markerIdx).trim();
  }

  // Extract version constraint
  const versionMatch = dep.match(/^([a-zA-Z0-9_-]+)\s*(>=|~=|==|<=|!=|<|>)(.+)$/);
  if (versionMatch) {
    return {
      name: versionMatch[1],
      versionConstraint: `${versionMatch[2]}${versionMatch[3].trim()}`,
      optional,
    };
  }

  return {
    name: dep,
    versionConstraint: null,
    optional,
  };
}

// --- Build system detection ---

type BuildSystem = PythonProjectInfo['buildSystem'];

const BUILD_BACKEND_MAP: Record<string, BuildSystem> = {
  'setuptools.build_meta': 'pyproject-setuptools',
  'flit_core.buildapi': 'pyproject-flit',
  'hatchling.build': 'pyproject-hatch',
  'poetry.core.masonry.api': 'pyproject-poetry',
};

function detectBuildSystem(
  files: Record<string, string>,
): { buildSystem: BuildSystem; isPython: boolean } {
  if ('pyproject.toml' in files) {
    const sections = splitTomlSections(files['pyproject.toml']);
    const buildSection = sections['build-system'];
    if (buildSection) {
      const backend = getTomlValue(buildSection, 'build-backend');
      if (backend) {
        const mapped = BUILD_BACKEND_MAP[backend];
        if (mapped) return { buildSystem: mapped, isPython: true };
      }
    }
    // pyproject.toml exists but backend unknown or missing
    return { buildSystem: 'pyproject-setuptools', isPython: true };
  }

  if ('setup.py' in files) return { buildSystem: 'setup.py', isPython: true };
  if ('setup.cfg' in files) return { buildSystem: 'setup.cfg', isPython: true };

  return { buildSystem: 'unknown', isPython: false };
}

// --- Test framework detection ---

function detectTestFramework(
  files: Record<string, string>,
  sections: TomlSections | null,
): PythonProjectInfo['testFramework'] {
  // pytest indicators
  if ('pytest.ini' in files) return 'pytest';
  if ('conftest.py' in files) return 'pytest';

  // [tool.pytest.ini_options] in pyproject.toml
  if (sections && 'tool.pytest.ini_options' in sections) return 'pytest';

  // tox.ini with pytest reference
  if ('tox.ini' in files && files['tox.ini'].includes('pytest')) return 'pytest';

  // unittest patterns in test files
  for (const [path, content] of Object.entries(files)) {
    if (path.includes('test') && content.includes('import unittest')) {
      return 'unittest';
    }
  }

  return 'unknown';
}

// --- Directory detection ---

function detectDirectories(
  dirEntries: string[],
  projectName: string | null,
): PythonProjectInfo['directories'] {
  const dirs = {
    source: '',
    tests: '',
    tutorials: null as string | null,
    docs: null as string | null,
  };

  // Find top-level directories (entries ending with /)
  const topDirs = dirEntries.filter(e => e.endsWith('/') && !e.includes('__'));

  // Check for src/packagename/ layout
  if (projectName) {
    const srcLayout = dirEntries.find(
      e => e === `src/${projectName}/` || e === `src/${projectName}/__init__.py`,
    );
    if (srcLayout) {
      dirs.source = `src/${projectName}/`;
    }
  }

  // If no src layout found, look for package directories
  if (!dirs.source) {
    for (const d of topDirs) {
      const name = d.replace(/\/$/, '');
      if (
        name !== 'tests' && name !== 'test' && name !== 'tutorials' &&
        name !== 'docs' && name !== 'doc' && name !== 'src' &&
        name !== '.venv' && name !== 'venv' && name !== 'build' && name !== 'dist'
      ) {
        // Check if it contains Python files
        const hasPython = dirEntries.some(
          e => e.startsWith(d) && (e.endsWith('.py') || e.endsWith('__init__.py')),
        );
        if (hasPython || dirEntries.some(e => e === `${d}__init__.py`)) {
          dirs.source = d;
          break;
        }
      }
    }
  }

  // Tests directory
  if (topDirs.includes('tests/')) dirs.tests = 'tests/';
  else if (topDirs.includes('test/')) dirs.tests = 'test/';

  // Tutorials
  if (topDirs.includes('tutorials/')) dirs.tutorials = 'tutorials/';

  // Docs
  if (topDirs.includes('docs/')) dirs.docs = 'docs/';
  else if (topDirs.includes('doc/')) dirs.docs = 'doc/';

  return dirs;
}

// --- Main detector ---

export function detectPythonProject(
  files: Record<string, string>,
  dirEntries: string[],
): PythonProjectInfo {
  const defaults: PythonProjectInfo = {
    isPython: false,
    buildSystem: 'unknown',
    pythonRequires: null,
    testFramework: 'unknown',
    dependencyGroups: { core: [], test: [], dev: [], extras: {} },
    directories: { source: '', tests: '', tutorials: null, docs: null },
    entryPoints: [],
  };

  // Step 1: Detect build system
  const { buildSystem, isPython: hasBuildConfig } = detectBuildSystem(files);

  // Check for __init__.py as Python indicator if no build config
  const hasInitPy = dirEntries.some(e => e.endsWith('__init__.py'));
  const hasPyFiles = dirEntries.some(e => e.endsWith('.py'));

  if (!hasBuildConfig && !hasInitPy && !hasPyFiles) {
    return defaults; // Not a Python project
  }

  const result: PythonProjectInfo = {
    ...defaults,
    isPython: true,
    buildSystem,
  };

  // Step 2: Parse pyproject.toml if available
  let sections: TomlSections | null = null;
  let projectName: string | null = null;

  if ('pyproject.toml' in files) {
    sections = splitTomlSections(files['pyproject.toml']);

    const projectSection = sections['project'];
    if (projectSection) {
      // python_requires
      const pythonRequires = getTomlValue(projectSection, 'requires-python');
      if (pythonRequires) result.pythonRequires = pythonRequires;

      // project name
      projectName = getTomlValue(projectSection, 'name');

      // core dependencies
      const coreDeps = getTomlArray(projectSection, 'dependencies');
      result.dependencyGroups.core = coreDeps.map(parseDependencySpec);
    }

    // optional-dependencies
    const knownGroups = ['test', 'dev'];
    for (const [sectionKey, sectionBody] of Object.entries(sections)) {
      if (sectionKey.startsWith('project.optional-dependencies')) {
        // This is a top-level section like [project.optional-dependencies]
        // But our parser splits on exact headers, so we need to check for
        // subsections named "project.optional-dependencies"
        // Actually, TOML has these as a single section with keys for each group
        // Let's parse group arrays from the section body
        const groupLines = sectionBody.split('\n');
        let currentGroup: string | null = null;
        const groupItems: Record<string, string[]> = {};

        for (const line of groupLines) {
          const trimmed = line.trim();

          // Match: groupname = [
          const groupStartMatch = trimmed.match(/^(\w+)\s*=\s*\[\s*$/);
          if (groupStartMatch) {
            currentGroup = groupStartMatch[1];
            groupItems[currentGroup] = [];
            continue;
          }

          // Match: groupname = ["item1", "item2"]
          const inlineGroupMatch = trimmed.match(/^(\w+)\s*=\s*\[(.+)\]\s*$/);
          if (inlineGroupMatch) {
            groupItems[inlineGroupMatch[1]] = parseArrayItems(inlineGroupMatch[2]);
            continue;
          }

          if (currentGroup) {
            if (trimmed === ']') {
              currentGroup = null;
              continue;
            }
            const itemMatch = trimmed.match(/^"([^"]*)"[,]?\s*$/);
            if (itemMatch) {
              groupItems[currentGroup].push(itemMatch[1]);
            }
          }
        }

        // Assign to known groups or extras
        for (const [group, items] of Object.entries(groupItems)) {
          const specs = items.map(parseDependencySpec);
          if (group === 'test') {
            result.dependencyGroups.test = specs;
          } else if (group === 'dev') {
            result.dependencyGroups.dev = specs;
          } else {
            result.dependencyGroups.extras[group] = specs;
          }
        }
      }
    }
  }

  // Step 3: Detect test framework
  result.testFramework = detectTestFramework(files, sections);

  // Step 4: Detect directories
  result.directories = detectDirectories(dirEntries, projectName);

  // Step 5: Entry points
  if (projectName) {
    result.entryPoints = [projectName];
  } else if (result.directories.source) {
    const name = result.directories.source.replace(/\/$/, '').split('/').pop() ?? '';
    if (name) result.entryPoints = [name];
  }

  return result;
}
