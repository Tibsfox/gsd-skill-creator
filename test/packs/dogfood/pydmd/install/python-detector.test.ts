import { describe, it, expect } from 'vitest';
import type { PythonProjectInfo, DependencySpec } from '../../../../../src/dogfood/pydmd/types.js';
import { detectPythonProject } from '../../../../../src/dogfood/pydmd/install/python-detector.js';

// --- Factories ---

function makeFiles(overrides: Record<string, string> = {}): Record<string, string> {
  return { ...overrides };
}

function makeDirEntries(entries: string[] = []): string[] {
  return entries;
}

const PYPROJECT_SETUPTOOLS = `[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "pydmd"
requires-python = ">=3.9"
dependencies = [
    "numpy>=1.20",
    "scipy>=1.5",
    "matplotlib>=3.0",
]

[project.optional-dependencies]
test = [
    "pytest>=7.0",
    "pytest-cov",
]
dev = [
    "black",
    "ruff",
]
docs = [
    "sphinx>=5.0",
    "sphinx-rtd-theme",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
`;

const PYPROJECT_FLIT = `[build-system]
requires = ["flit_core>=3.4"]
build-backend = "flit_core.buildapi"

[project]
name = "mylib"
requires-python = ">=3.8"
dependencies = ["requests>=2.28"]
`;

const PYPROJECT_HATCH = `[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "mylib"
requires-python = ">=3.10"
dependencies = ["httpx>=0.24"]
`;

const PYPROJECT_POETRY = `[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[project]
name = "mylib"
requires-python = ">=3.9"
dependencies = ["click>=8.0"]
`;

const SETUP_PY = `from setuptools import setup, find_packages

setup(
    name="mylib",
    version="0.1.0",
    packages=find_packages(),
    install_requires=["numpy>=1.20"],
    python_requires=">=3.8",
)
`;

const SETUP_CFG = `[metadata]
name = mylib
version = 0.1.0

[options]
packages = find:
install_requires =
    numpy>=1.20
python_requires = >=3.8
`;

describe('python-detector', () => {
  describe('INS-01: Build system detection', () => {
    it('detects pyproject.toml with setuptools backend', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'tests/']),
      );

      expect(info.isPython).toBe(true);
      expect(info.buildSystem).toBe('pyproject-setuptools');
    });

    it('detects pyproject.toml with flit backend', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_FLIT }),
        makeDirEntries(['mylib/']),
      );

      expect(info.isPython).toBe(true);
      expect(info.buildSystem).toBe('pyproject-flit');
    });

    it('detects pyproject.toml with hatch backend', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_HATCH }),
        makeDirEntries(['mylib/']),
      );

      expect(info.isPython).toBe(true);
      expect(info.buildSystem).toBe('pyproject-hatch');
    });

    it('detects pyproject.toml with poetry backend', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_POETRY }),
        makeDirEntries(['mylib/']),
      );

      expect(info.isPython).toBe(true);
      expect(info.buildSystem).toBe('pyproject-poetry');
    });

    it('detects setup.py without pyproject.toml', () => {
      const info = detectPythonProject(
        makeFiles({ 'setup.py': SETUP_PY }),
        makeDirEntries(['mylib/']),
      );

      expect(info.isPython).toBe(true);
      expect(info.buildSystem).toBe('setup.py');
    });

    it('detects setup.cfg without pyproject.toml', () => {
      const info = detectPythonProject(
        makeFiles({ 'setup.cfg': SETUP_CFG }),
        makeDirEntries(['mylib/']),
      );

      expect(info.isPython).toBe(true);
      expect(info.buildSystem).toBe('setup.cfg');
    });

    it('detects Python project from __init__.py with unknown build system', () => {
      const info = detectPythonProject(
        makeFiles({}),
        makeDirEntries(['mylib/__init__.py', 'mylib/core.py']),
      );

      expect(info.isPython).toBe(true);
      expect(info.buildSystem).toBe('unknown');
    });

    it('returns isPython false when no Python indicators', () => {
      const info = detectPythonProject(
        makeFiles({}),
        makeDirEntries(['src/index.ts', 'package.json']),
      );

      expect(info.isPython).toBe(false);
    });
  });

  describe('INS-02: Version and test framework detection', () => {
    it('extracts python_requires from pyproject.toml [project] section', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'tests/']),
      );

      expect(info.pythonRequires).toBe('>=3.9');
    });

    it('detects pytest from pytest.ini', () => {
      const info = detectPythonProject(
        makeFiles({ 'pytest.ini': '[pytest]\ntestpaths = tests\n', 'setup.py': SETUP_PY }),
        makeDirEntries(['mylib/', 'tests/']),
      );

      expect(info.testFramework).toBe('pytest');
    });

    it('detects pytest from conftest.py', () => {
      const info = detectPythonProject(
        makeFiles({ 'conftest.py': 'import pytest\n', 'setup.py': SETUP_PY }),
        makeDirEntries(['mylib/', 'tests/']),
      );

      expect(info.testFramework).toBe('pytest');
    });

    it('detects pytest from [tool.pytest.ini_options] in pyproject.toml', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'tests/']),
      );

      expect(info.testFramework).toBe('pytest');
    });

    it('detects pytest from tox.ini with pytest reference', () => {
      const toxIni = `[tox]
envlist = py39

[testenv]
deps = pytest
commands = pytest tests/
`;
      const info = detectPythonProject(
        makeFiles({ 'tox.ini': toxIni, 'setup.py': SETUP_PY }),
        makeDirEntries(['mylib/', 'tests/']),
      );

      expect(info.testFramework).toBe('pytest');
    });

    it('detects unittest when only unittest patterns present', () => {
      const testFile = `import unittest

class TestMyLib(unittest.TestCase):
    def test_basic(self):
        self.assertTrue(True)
`;
      const info = detectPythonProject(
        makeFiles({ 'setup.py': SETUP_PY, 'tests/test_basic.py': testFile }),
        makeDirEntries(['mylib/', 'tests/', 'tests/test_basic.py']),
      );

      expect(info.testFramework).toBe('unittest');
    });

    it('returns unknown when no test indicators', () => {
      const minimalPyproject = `[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[project]
name = "mylib"
`;
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': minimalPyproject }),
        makeDirEntries(['mylib/']),
      );

      expect(info.testFramework).toBe('unknown');
    });
  });

  describe('INS-01: Dependency group extraction', () => {
    it('extracts core deps from [project] dependencies', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'tests/']),
      );

      expect(info.dependencyGroups.core).toHaveLength(3);
      expect(info.dependencyGroups.core[0].name).toBe('numpy');
      expect(info.dependencyGroups.core[0].versionConstraint).toBe('>=1.20');
      expect(info.dependencyGroups.core[1].name).toBe('scipy');
      expect(info.dependencyGroups.core[2].name).toBe('matplotlib');
    });

    it('extracts test deps from [project.optional-dependencies] test', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'tests/']),
      );

      expect(info.dependencyGroups.test).toHaveLength(2);
      expect(info.dependencyGroups.test[0].name).toBe('pytest');
      expect(info.dependencyGroups.test[0].versionConstraint).toBe('>=7.0');
      expect(info.dependencyGroups.test[1].name).toBe('pytest-cov');
      expect(info.dependencyGroups.test[1].versionConstraint).toBeNull();
    });

    it('extracts dev deps from [project.optional-dependencies] dev', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'tests/']),
      );

      expect(info.dependencyGroups.dev).toHaveLength(2);
      expect(info.dependencyGroups.dev[0].name).toBe('black');
      expect(info.dependencyGroups.dev[1].name).toBe('ruff');
    });

    it('extracts extras from other optional-dependency groups', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'tests/']),
      );

      expect(info.dependencyGroups.extras).toHaveProperty('docs');
      expect(info.dependencyGroups.extras['docs']).toHaveLength(2);
      expect(info.dependencyGroups.extras['docs'][0].name).toBe('sphinx');
    });

    it('parses version constraints (>=, ~=, ==)', () => {
      const pyproject = `[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[project]
name = "mylib"
dependencies = [
    "numpy>=1.20",
    "scipy~=1.9.0",
    "exact-lib==4.5.6",
]
`;
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': pyproject }),
        makeDirEntries(['mylib/']),
      );

      expect(info.dependencyGroups.core[0].versionConstraint).toBe('>=1.20');
      expect(info.dependencyGroups.core[1].versionConstraint).toBe('~=1.9.0');
      expect(info.dependencyGroups.core[2].versionConstraint).toBe('==4.5.6');
    });

    it('marks deps with platform markers as optional', () => {
      const pyproject = `[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[project]
name = "mylib"
dependencies = [
    "numpy>=1.20",
    "pywin32>=300; platform_system == \\"Windows\\"",
]
`;
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': pyproject }),
        makeDirEntries(['mylib/']),
      );

      const pywin = info.dependencyGroups.core.find(d => d.name === 'pywin32');
      expect(pywin).toBeDefined();
      expect(pywin!.optional).toBe(true);

      const numpy = info.dependencyGroups.core.find(d => d.name === 'numpy');
      expect(numpy!.optional).toBe(false);
    });
  });

  describe('Directory detection', () => {
    it('detects source and test directories', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'pydmd/__init__.py', 'tests/', 'tests/test_dmd.py']),
      );

      expect(info.directories.source).toBe('pydmd/');
      expect(info.directories.tests).toBe('tests/');
    });

    it('detects tutorials directory', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'tests/', 'tutorials/', 'tutorials/01_basic.py']),
      );

      expect(info.directories.tutorials).toBe('tutorials/');
    });

    it('detects docs directory', () => {
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': PYPROJECT_SETUPTOOLS }),
        makeDirEntries(['pydmd/', 'tests/', 'docs/', 'docs/conf.py']),
      );

      expect(info.directories.docs).toBe('docs/');
    });

    it('detects src/packagename/ layout', () => {
      const pyproject = `[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[project]
name = "mypackage"
`;
      const info = detectPythonProject(
        makeFiles({ 'pyproject.toml': pyproject }),
        makeDirEntries(['src/', 'src/mypackage/', 'src/mypackage/__init__.py', 'tests/']),
      );

      expect(info.directories.source).toBe('src/mypackage/');
    });
  });
});
