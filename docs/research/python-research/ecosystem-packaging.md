# Python's Packaging Ecosystem: A Deep Dive

*Research compiled 2026-04-08*

Python's packaging story is one of organic, sometimes painful, evolution: from a fragmented set of incompatible tools in the early 2000s to a federated but increasingly coherent ecosystem driven by PEPs (Python Enhancement Proposals) and the Python Packaging Authority (PyPA). This document covers the historical arc, the current toolchain, and the security and publishing infrastructure underneath it all.

---

## 1. PyPI — The Cheese Shop

The **Python Package Index** is the canonical repository for third-party Python software. It launched in **2003**, originally nicknamed **"the Cheese Shop"** after the [Monty Python sketch](https://en.wikipedia.org/wiki/Cheese_Shop_sketch) ("This is the most tested cheese shop in the district, sir."). The "Cheese Shop" name persisted in URLs and documentation for years before PyPI became the official term.

### Origins and PEP 301
- Proposed by **Richard Jones** in **PEP 301** ("Package Index and Metadata for Distutils"), accepted **2002-10-24**.
- First implementation by Richard Jones using the standard library's `distutils` upload command.
- Hosted at `cheeseshop.python.org`, then moved to `pypi.python.org`, and finally to **`pypi.org`** in **2018** when Warehouse went live.

### Warehouse — The Modern PyPI
- **Warehouse** is the codebase that powers `pypi.org` today. Project began in **2011** by Donald Stufft as a from-scratch rewrite of the legacy PyPI codebase.
- Built on **Pyramid** (web framework), **PostgreSQL**, **Elasticsearch**, **Redis**, and served by **Fastly** as a CDN.
- Went live as the production PyPI on **2018-04-16**, replacing the legacy CheeseShop UI and API.
- Open source, MIT-licensed, repository at `github.com/pypi/warehouse`.
- Funded in part by Mozilla Open Source Support, Facebook, Sloan Foundation, and individual sponsors.

### Scale (as of early 2026)
| Metric | Count |
|---|---|
| Projects | **782,496+** |
| Releases | **8,400,000+** |
| Files (wheels + sdists) | **18,200,000+** |
| Registered users | **1,000,000+** |
| Downloads / month | ~20 billion |
| Bandwidth served | hundreds of TB / day |

### Comparison to Other Ecosystems
| Registry | Language | Approx. packages |
|---|---|---|
| **npm** | JavaScript | 3,000,000+ |
| **PyPI** | Python | **782,000+** |
| **Maven Central** | Java | 600,000+ |
| **Packagist** | PHP | **400,000+** |
| **RubyGems** | Ruby | 185,000+ |
| **CPAN** | Perl | **220,000** distributions / ~43,000 authors |
| **crates.io** | Rust | 165,000+ |
| **Hex** | Elixir/Erlang | 16,000+ |

PyPI is the **second-largest** language package registry by package count (after npm), and is growing faster than CPAN, RubyGems, or Maven. Where CPAN crystallized in the late 1990s with Perl's golden era and Packagist follows the more measured PHP framework cadence, PyPI's growth tracks Python's dominance in data science, ML, scientific computing, and web backend work.

---

## 2. The Packaging Story — A Long, Painful History

Python's packaging timeline is the story of a language that didn't take packaging seriously until the community forced the issue, then iterated through a sequence of "this fixes it" tools — each of which became another layer of legacy.

### Timeline

| Year | Event |
|---|---|
| **1998** | `distutils` first appears (Greg Ward), included in Python 1.6 |
| **2000** | `distutils` officially in stdlib (Python 2.0) |
| **2003** | PyPI launches ("Cheese Shop") |
| **2004** | **setuptools 0.5** by Phillip J. Eby — extends distutils, introduces eggs |
| **2004** | **`easy_install`** ships with setuptools — first real installer |
| **2005** | `.egg` format becomes the de facto distribution form |
| **2007** | setuptools development stalls; community forks become **Distribute** |
| **2008** | **`pip` 0.1** released by Ian Bicking (originally called `pyinstall`) as a replacement for `easy_install` |
| **2011** | **virtualenv** matures as the standard isolation tool |
| **2012** | **PEP 405** — venv added to stdlib (Python 3.3) |
| **2012** | **PEP 427** — **wheel format** (`.whl`) defined by Daniel Holth, replaces `.egg` |
| **2013** | Distribute merged back into setuptools |
| **2013** | **PEP 453** — pip bundled with Python 3.4 via `ensurepip` |
| **2016** | **PEP 518** — `pyproject.toml` introduced ("build-system" table) |
| **2017** | **PEP 517** — pluggable build backends (decouples build from setuptools) |
| **2018** | **PyPI Warehouse** launches at pypi.org |
| **2018** | **Poetry 1.0.0a1** — Sébastien Eustace |
| **2020-10** | **pip 20.3** — new resolver becomes the default (a real backtracking SAT-style resolver) |
| **2021** | **PEP 621** — standardize project metadata in `pyproject.toml` `[project]` table |
| **2022** | `distutils` officially **deprecated** (PEP 632), removed in Python 3.12 |
| **2024-02** | **`uv` 0.1.0** released by Astral (Charlie Marsh) |
| **2024** | **PEP 723** — inline script metadata (`/// script` headers) |
| **2025** | uv adoption explodes; surpasses Poetry in download metrics for many projects |

### The Crisis

For roughly 2010-2018, the Python packaging story was infamous. Common gripes:

- `distutils` was minimal and quietly hostile to anything beyond the trivial case.
- `setuptools` monkey-patched `distutils` and accreted features unpredictably.
- `easy_install` could install but not uninstall, and pulled `.egg` files into a single shared location with version conflicts.
- `pip` solved many of the install/uninstall and isolation pain points, but for a decade did **not have a real dependency resolver** — it would happily install incompatible dependency sets.
- Build configuration was a Python script (`setup.py`) that ran at install time, which meant arbitrary code execution from any package's installer.
- Multiple competing tools (pipenv, poetry, hatch, pdm, pip-tools) split the community.
- Python C extensions on Windows were a nightmare, partially fixed by wheels and `manylinux` PEPs.

Xkcd #1987 ("Python Environment") from 2018 became the canonical illustration of the situation.

### The Resolution (2016-2024)

The packaging community stitched the ecosystem back together via PEPs:

- **PEP 518 (2016)** — `pyproject.toml` lets a project declare its **build-system requirements** before any code runs. Eliminates the chicken-and-egg of "you need setuptools to even read setup.py."
- **PEP 517 (2017)** — defines a **pluggable build backend** API. Now `setuptools`, `flit`, `poetry-core`, `hatchling`, `pdm-backend`, `maturin` (Rust), and `scikit-build-core` (CMake) all conform to one interface.
- **PEP 621 (2021)** — standardizes the `[project]` table so dependencies, metadata, version, authors, and entry points are declared identically across backends.
- **pip's new resolver (2020)** — finally a real backtracking resolver based on `resolvelib`.
- **PEP 660 (2021)** — editable installs (`pip install -e`) standardized for non-setuptools backends.
- **PEP 723 (2024)** — inline script metadata, makes one-file Python scripts self-installing under uv/pipx.

By **2024-2025**, a new project can be `pyproject.toml`-only with no `setup.py`, no `setup.cfg`, no `MANIFEST.in`, and no `requirements.txt` — just one file.

---

## 3. pip — The Canonical Installer

**pip** ("Pip Installs Packages" or "Pip Installs Python") is Python's de facto package installer.

- **Created:** 2008 by **Ian Bicking** (also creator of virtualenv, Paste, WebOb).
- **Original name:** `pyinstall`, renamed to `pip` shortly after.
- **Bundled with Python:** since **Python 3.4** (2014) via `ensurepip` (PEP 453).
- **Maintained by:** the **PyPA** (Python Packaging Authority).
- **License:** MIT.
- **Repository:** `github.com/pypa/pip`.
- **Latest stable (early 2026):** `pip 25.x` series.

### What pip Does
- Resolves dependency trees and downloads packages from PyPI (or any PEP 503/691 index).
- Installs into the **active Python environment** (system, venv, conda, etc.).
- Supports **wheels** (`.whl`, binary, fast) and **sdists** (`.tar.gz`, source, must build).
- Can install from VCS URLs (`pip install git+https://...`), local paths, archives, requirements files.
- Manages an internal install database via `*.dist-info` directories conforming to PEP 376.

### The 2020 Resolver Rewrite
For its first ~12 years, pip's "resolver" was a naive first-come-first-served walker that would happily install `pkg-a` requiring `numpy<1.18` and `pkg-b` requiring `numpy>=1.20` in the same env, only to fail at runtime. The new resolver (pip **20.3**, October 2020):

- Uses **`resolvelib`**, a generic backtracking resolver library from the PyPA.
- Performs proper **constraint satisfaction**: walks the dep graph, backtracks on conflict, errors clearly.
- Funded by a Mozilla Open Source Support grant + Chan Zuckerberg Initiative.
- Made many existing requirements files un-installable until they were fixed — a one-time community pain spike worth the long-term benefit.

### Wheels (PEP 427) — `bdist_wheel`
- Defined in **PEP 427 (2012)** by Daniel Holth.
- A **`.whl`** file is a ZIP archive of the installed layout: pre-built, no execution needed at install time.
- Filename encodes compatibility: `name-version-pythontag-abitag-platformtag.whl`, e.g. `numpy-2.0.1-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl`.
- **`manylinux`** PEPs (513, 571, 599, 600) specify cross-distro Linux ABIs so a single wheel can target most x86_64 Linuxes.
- **`musllinux`** (PEP 656) for Alpine/musl libc.
- **`pyodide`** wheels for in-browser Python (WASM).

### sdist vs bdist
- **sdist** (source distribution) — `.tar.gz`. Contains source + `pyproject.toml`. Requires a build step on the target machine. Slow, may need a C toolchain.
- **bdist** (binary distribution) — usually a wheel. Pre-compiled. Fast install, no toolchain needed.
- pip prefers wheels and falls back to sdist only when no compatible wheel exists.

---

## 4. Virtual Environments

Python has **no namespacing** for installed packages. Without isolation, every project on a machine fights for the same `site-packages`. Virtual environments solve this by giving each project its own `site-packages`, its own `python` interpreter shim, and its own scripts directory.

### virtualenv
- **Created:** 2007 by **Ian Bicking**.
- **Repository:** `github.com/pypa/virtualenv`.
- Works on **Python 2.7 and Python 3.x**, including older Pythons that lack `venv`.
- Faster cold-start than `venv` because it copies a pre-staged Python instead of running `ensurepip`.
- Still maintained — many CI systems still default to it.

### venv (built-in)
- **Added:** Python **3.3** (2012) via **PEP 405**.
- Invocation: `python -m venv .venv`.
- Creates: `.venv/bin/python` (symlink), `.venv/bin/pip`, `.venv/lib/python3.X/site-packages/`, `.venv/pyvenv.cfg`.
- Activated by `source .venv/bin/activate` (POSIX) or `.venv\Scripts\activate.bat` (Windows).

### Why They Exist
1. **Reproducibility** — pin exact versions per project without breaking other projects.
2. **System Python protection** — distros use system Python for OS tooling (`apt`, `dnf`, `yum`); installing into it can break the OS.
3. **Multi-version Python** — different projects can target different interpreter versions.
4. **PEP 668 (2022)** — distros can mark system Pythons as **"externally-managed"** so `pip install` outside a venv is refused. Debian/Ubuntu enforce this since 2023; "every Python project needs a venv" is now policy-level, not just convention.

---

## 5. conda — The Scientific Computing Alternative

**conda** is a parallel, language-agnostic package and environment manager developed by **Continuum Analytics** (now **Anaconda, Inc.**), released **2012**.

### Origins
- Designed by **Travis Oliphant** (creator of NumPy, SciPy) and **Peter Wang**.
- Built because pip+wheels couldn't (in 2012) handle:
  - Non-Python binary dependencies (BLAS/LAPACK, HDF5, FFTW, CUDA, MKL).
  - Cross-platform native libraries with consistent ABIs.
  - Fortran compilers and linker variants.
- conda packages are **`.conda`** or **`.tar.bz2`** archives that include the full binary tree, not just Python.

### Distributions
- **Anaconda** — full distribution, ~3 GB, ~250 curated scientific packages preinstalled.
- **Miniconda** — minimal installer, just `conda` + Python.
- **Miniforge** — community-maintained fork that defaults to **conda-forge** instead of Anaconda's commercial defaults channel. Recommended since Anaconda's 2020 ToS change made `defaults` channel non-free for organizations >200 employees.
- **mamba** — C++ rewrite of conda's resolver (Mamba/Micromamba), 10-50x faster than classic conda. Now bundled inside conda 23.x as the default solver (`libmamba`).

### conda vs pip
| | conda | pip |
|---|---|---|
| Source | conda-forge / defaults / private channels | PyPI |
| Format | `.conda` (binary, includes deps) | `.whl` / `.tar.gz` |
| Non-Python deps | Yes (any binary) | No (Python-only, leans on system libs) |
| Resolver | libmamba (SAT) | resolvelib (backtracking) |
| Speed | mamba: fast; classic: slow | fast |
| Coexists with venv | conda envs replace venvs | pip in venvs |
| Best for | Data science, ML, GPU, HPC | Web, CLI, libraries |

The pragmatic 2026 reality: most data scientists use `conda` (or `mamba`) for environments and `pip` inside the conda env for PyPI-only packages. uv is starting to displace this pattern on machines that don't need GPU/MKL.

### Environment Files
```yaml
# environment.yml
name: myproject
channels:
  - conda-forge
dependencies:
  - python=3.12
  - numpy=2.0.*
  - pytorch=2.4.*
  - pip
  - pip:
    - some-pypi-only-package
```

---

## 6. Poetry — Modern Dependency Manager

**Poetry** was released by **Sébastien Eustace** in **2018** (1.0.0a1) and reached **1.0.0** in **December 2019**. It was the first widely adopted tool to take JavaScript-style lockfile workflows seriously in Python.

### Features
- **`pyproject.toml`-native** — Poetry was the loudest early voice that `pyproject.toml` should hold both metadata *and* dependencies, foreshadowing PEP 621.
- **`poetry.lock`** — content-hashed deterministic lockfile, like `package-lock.json` or `Cargo.lock`.
- **Built-in venv management** — `poetry shell`, `poetry run`, automatic env per project.
- **`poetry-core`** — separate, minimal PEP 517 build backend that other projects can use without dragging in all of Poetry.
- **Publishing** — `poetry publish` uploads to PyPI directly without needing twine.
- **Groups** — `[tool.poetry.group.dev.dependencies]` for dev/test/docs separation, mapped to PEP 735 dependency groups in 2024.

### Limitations / Critiques
- Resolver is correct but **slow** on large dep graphs.
- Pre-PEP 621 Poetry had its own `[tool.poetry]` schema that diverged from the standard `[project]` table — Poetry 2.0 (2024) added PEP 621 support.
- For libraries published to PyPI, Poetry historically generated unusual `dependencies` metadata that confused some tools.

### Latest
- **Poetry 1.8.x** stable through 2024.
- **Poetry 2.0** released **January 2025** with full PEP 621 `[project]` table support and improved interop.

### pytest Integration
Poetry doesn't ship a test runner — it uses `pytest` like everyone else. The integration is just `poetry add --group dev pytest` and then `poetry run pytest`.

---

## 7. uv — The New Hotness

**uv** is a Python package and project manager written in **Rust**, released by **Astral** (the company behind **ruff**) on **2024-02-15** as `uv 0.1.0`. Lead engineer: **Charlie Marsh**.

### Speed Claims
- **10-100x faster than pip** for cold installs.
- **80-115x faster than pip** for warm installs (cached).
- Achieves this via:
  - Rust implementation (no Python startup cost).
  - Global content-addressed cache, hardlinked into venvs.
  - Parallel downloads and extraction.
  - PubGrub-based resolver (same algorithm Dart's pub uses).
  - Zero-copy where the filesystem allows.

### Scope
uv has progressively absorbed the responsibilities of pip, pip-tools, virtualenv, pipx, pyenv, and Poetry into one binary:

| Tool replaced | uv equivalent |
|---|---|
| `pip install` | `uv pip install` |
| `pip-compile` | `uv pip compile` |
| `pip-sync` | `uv pip sync` |
| `virtualenv` / `venv` | `uv venv` |
| `pipx` | `uv tool install`, `uvx` |
| `pyenv` | `uv python install 3.12` |
| `poetry add` | `uv add` |
| `poetry lock` | `uv lock` |
| `poetry run` | `uv run` |
| `poetry build` | `uv build` |
| `poetry publish` | `uv publish` |

### Workflow
```bash
uv init my-project
cd my-project
uv add requests pydantic
uv add --dev pytest ruff
uv run pytest
uv lock
uv sync
```

The single binary, combined with self-contained Python downloads (uv ships its own portable Pythons via the **python-build-standalone** project), means a fresh box can go from "no Python" to "running tests" in seconds with one command.

### Adoption (2024-2026)
- **GitHub Actions** uv setup action adopted broadly within months.
- Replaced **pip** in many CI pipelines for performance reasons.
- Default in some new project templates (FastAPI, LangChain examples).
- **PEP 723 inline scripts** + `uv run script.py` is the killer feature for one-file utilities.
- Growing tension with Poetry as both target the same sweet spot; Astral's velocity is significantly higher.

### Latest (early 2026)
- **uv 0.5.x** — workspace support, build backend (`uv_build`), full PEP 621 + PEP 735 dependency groups.
- License: MIT or Apache-2.0.
- Repository: `github.com/astral-sh/uv`.

---

## 8. Key Ecosystem Packages

The packages every working Python developer ends up with sooner or later. All on PyPI; many shipped in millions of downloads/day.

### HTTP / Networking
- **`requests`** — Kenneth Reitz, 2011. The "HTTP for Humans" library that defined the modern API. ~500M downloads/month.
- **`httpx`** — modern async-capable HTTP client, sync+async API, HTTP/2 support.
- **`aiohttp`** — async HTTP client/server, foundation for async Python web stacks.

### CLI
- **`click`** — Armin Ronacher (Flask author), 2014. Decorator-based CLI framework. Powers Flask CLI, dbt, mlflow, Black.
- **`typer`** — Sebastián Ramírez (FastAPI author), 2019. Click + type hints. Builds CLIs from function signatures.
- **`rich`** — Will McGugan, 2020. Beautiful terminal output, tables, progress bars, syntax highlighting, markdown rendering. Foundation for `textual`, `pip`'s output, `uv`'s output.

### Validation & Data
- **`pydantic`** — Samuel Colvin, 2017. Type-hint-driven data validation. Pydantic v2 (2023) rewrote core in Rust for ~50x speedup. Underpins FastAPI, LangChain, instructor.
- **`attrs`** — earlier inspiration for dataclasses, still popular.
- **`marshmallow`** — earlier serialization library, predates type hints.

### Testing
- **`pytest`** — Holger Krekel et al., 2004 (as `py.test`). Now the de facto standard. Fixtures, parametrization, plugin ecosystem.
- **`unittest`** — stdlib, JUnit-style, less ergonomic but always available.
- **`hypothesis`** — property-based testing.
- **`tox`** / **`nox`** — multi-environment test orchestration.

### Code Quality
- **`black`** — Łukasz Langa, 2018. "Uncompromising code formatter." Killed Python style debates.
- **`ruff`** — Astral, 2022. Rust-based linter/formatter, 10-100x faster than flake8 + isort + pyupgrade combined. Now the dominant linter; replaces flake8, pylint (in many projects), isort, pydocstyle, eradicate, bandit-lite, and more.
- **`mypy`** — Jukka Lehtosalo (now at Microsoft), 2012. The original Python type checker, sponsored by Dropbox during Guido's tenure.
- **`pyright`** / **`pylance`** — Microsoft, fast type checker; powers VS Code's Python support.
- **`pyrefly`** / **`ty`** — Astral's planned Rust type checker (in development through 2025).

### Docs
- **`sphinx`** — Georg Brandl, 2008. Originally built to document Python itself. reStructuredText, autodoc, intersphinx. The CPython docs, NumPy docs, SciPy docs, and most major Python projects use Sphinx.
- **`mkdocs`** + **Material for MkDocs** — modern Markdown-based alternative.

### Templates / Web
- **`jinja2`** — Armin Ronacher, 2008. Template engine, used by Flask, Ansible, Salt, Pelican, mkdocs.
- **`flask`** — Armin Ronacher, 2010. Microframework.
- **`django`** — 2005. Full-stack batteries-included framework. Independent, mature, conservative release model.
- **`fastapi`** — Sebastián Ramírez, 2018. Async, type-hint-driven, OpenAPI auto-gen. Built on Starlette + Pydantic.

### Scientific
- **`numpy`** — 2005, the foundation of scientific Python.
- **`pandas`** — 2008, DataFrames.
- **`scipy`** — 2001, scientific algorithms.
- **`matplotlib`** — 2003, plotting.
- **`scikit-learn`** — 2010, classical ML.
- **`pytorch`** / **`tensorflow`** / **`jax`** — deep learning.

---

## 9. PyPI Security

Like every large open package registry, PyPI is a target for supply chain attacks. The community has steadily layered defenses on, though much of the original architecture was built before supply chain attacks were a serious threat model.

### Threat Categories

#### Typosquatting
Malicious packages with names like `requestes`, `urllib4`, `python-sqlite` (instead of the stdlib `sqlite3`), or `colourama` impersonate popular packages. Once installed, the malicious code can run arbitrary post-install scripts via `setup.py`.

Notable incidents:
- **2017** — security researcher Nikolai Tschacher published 20 typosquatted packages and observed thousands of downloads.
- **2022** — `ctx` (a real, abandoned package) was hijacked via expired domain → maintainer email takeover, replaced with credential-stealing code.
- **2023** — large `colorama` typosquat campaign distributed through fake GitHub repos.
- **2024** — multiple `requests`-impersonating packages distributed crypto-stealing payloads, some with thousands of downloads before takedown.

#### Dependency Confusion
2021 attack class identified by Alex Birsan: publishing a public PyPI package with the same name as an internal company package, hoping the company's installer prefers the public one. Affected Microsoft, Apple, Tesla, Uber and 31 others.

#### Account Takeover
Maintainer accounts hijacked via password reuse, expired domains, or token theft. PyPI now enforces:
- **Mandatory 2FA** for all maintainers of any project in the **top 1%** of downloads (announced 2022, expanded 2023, **mandatory for all uploaders** since **2024-01-01**).
- WebAuthn / hardware security key support since 2019.
- **API tokens** (project-scoped or user-scoped) replaced password uploads in 2019.

#### Build-time Code Execution
Because legacy `setup.py` is arbitrary Python, installing a package can run any code. `pyproject.toml` + PEP 517 backends are a partial mitigation but the build backend itself still runs code.

### Defenses

#### PEP 458 — TUF for PyPI
- Proposed **2014**, accepted **2019**.
- Implements **The Update Framework** (Justin Cappos, NYU), a signed metadata layer that lets clients verify package integrity even if PyPI is fully compromised.
- Uses **offline keys** for top-level metadata, **online keys** for per-project signing.
- Implementation funded by Facebook, Google, Sloan.
- Status (2026): partial deployment; full client-side enforcement still rolling out.

#### PEP 480 — Root Key Management
Companion to PEP 458, defines the offline ceremony for top-level TUF keys.

#### Sigstore Integration
- Sigstore is a Linux Foundation project providing **keyless signing** using OIDC identities (GitHub, Google, etc.) and **Rekor**, a transparency log.
- **PEP 740 (2024)** — defines how PyPI hosts Sigstore attestations attached to releases.
- **Trusted Publishing** (2023) — PyPI accepts uploads via OIDC tokens from GitHub Actions, GitLab CI, Google Cloud, ActiveState, with no API token storage at all. Now the recommended publishing method.

#### Malware Scanning
- PyPI runs automated scanners on uploads (using YARA rules and behavioral heuristics).
- Reports come from researchers, Phylum, Snyk, Socket, Checkmarx, ReversingLabs.
- Hundreds of malicious packages removed weekly.

#### `pip-audit`
- PyPA tool that checks installed packages against the **PyPI Advisory Database** (and OSV).
- Reports known CVEs in your dependency tree.
- Maintained by Trail of Bits.

#### Quarantine and Removal
- PyPI has formal **incident response** for malicious package reports — quarantine, removal, account suspension.
- 2024 saw faster turnaround (often <1 hour) after Phylum/Socket/etc. reports.

### Recent Incidents (2023-2025)
- **PyTorch dependency confusion (Dec 2022)** — `torchtriton` malicious package uploaded to PyPI shadowed PyTorch nightly's intended dependency. Affected nightly users for 5 days. Triggered industrywide review of dependency-confusion defenses.
- **`ultralytics` supply chain compromise (Dec 2024)** — popular YOLO library; compromised release shipped a crypto miner via injected GitHub Actions workflow. Mitigated via Trusted Publishing audit and yanked releases.
- **`colorama` typosquat campaigns (ongoing 2023-2025)** — wave after wave of impersonations; PyPI now uses Levenshtein-distance heuristics to flag suspicious new uploads.
- **`xz`-style long-game social engineering attempts** — multiple maintainer-takeover attempts via fake "helpful contributor" PRs since the xz revelation; community awareness up significantly.

---

## 10. How to Publish to PyPI

### The Modern Flow (2025+)

```toml
# pyproject.toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-package"
version = "0.1.0"
description = "..."
authors = [{name = "Foxy", email = "foxy@example.com"}]
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.10"
dependencies = ["requests>=2.31"]

[project.optional-dependencies]
dev = ["pytest", "ruff"]

[project.urls]
Homepage = "https://github.com/foxy/my-package"
```

### Step 1 — Build
```bash
# Modern PyPA tool
python -m pip install build
python -m build  # produces dist/*.whl and dist/*.tar.gz

# Or with uv
uv build

# Or with Poetry
poetry build
```

### Step 2 — Upload

#### Option A: Trusted Publishing (recommended, 2023+)
Configure GitHub Actions to publish via OIDC. No tokens stored anywhere.
```yaml
# .github/workflows/publish.yml
- uses: pypa/gh-action-pypi-publish@release/v1
```

#### Option B: API token + twine
```bash
python -m pip install twine
python -m twine upload dist/*
```
Twine reads `~/.pypirc` or `TWINE_USERNAME=__token__` + `TWINE_PASSWORD=pypi-...`.

#### Option C: uv or poetry
```bash
uv publish
# or
poetry publish --build
```

### twine
- **`twine`** is the PyPA's secure upload tool. Released **2013** by Donald Stufft.
- Replaces the legacy `python setup.py upload` (which sent passwords in cleartext for years).
- Always uploads over HTTPS, supports API tokens, supports test PyPI.
- Repository: `github.com/pypa/twine`.

### TestPyPI
- `test.pypi.org` — staging instance for trying out a release.
- `twine upload --repository testpypi dist/*`.
- Install with `pip install --index-url https://test.pypi.org/simple/ my-package`.

### PyPA — The Python Packaging Authority
The **Python Packaging Authority** is the working group of maintainers who steward Python packaging tools.

- **Founded:** 2011, informal at first, formalized over time.
- **GitHub org:** `github.com/pypa`.
- **Maintains:** `pip`, `setuptools`, `wheel`, `twine`, `virtualenv`, `pipenv`, `warehouse`, `packaging`, `build`, `cibuildwheel`, `flit`, `hatch`, `pip-audit`, `bandersnatch` (PyPI mirroring), `installer`, `readme_renderer`, `gh-action-pypi-publish`, `trove-classifiers`, and others.
- **Specification governance:** PEPs go through PyPA review and the Packaging category on `discuss.python.org`.
- **`packaging.python.org`** — the official user guide.
- **Funding:** sponsorship + grants from PSF, OTF, Mozilla, Sloan, Bloomberg, Google, Microsoft, Meta, others. Permanent paid roles still rare; most PyPA work is volunteer.

### Discovery and Search
- **PyPI search:** `pypi.org/search/?q=...` — basic but functional.
- **`pypi.org/stats/`** — public download statistics via `pypistats.org` and Google BigQuery.
- **Libraries.io** — third-party metadata.
- **Snyk Advisor** / **Socket** / **Phylum** — third-party security and quality scores.
- **Trove classifiers** — `[project.classifiers]` tags like `Development Status :: 5 - Production/Stable`, `License :: OSI Approved :: MIT License` — used for facet search on PyPI.

---

## Summary — Where the Ecosystem Stands in 2026

The **packaging crisis** that defined Python from roughly 2010-2020 is genuinely over. The pieces that survived:

- **PyPI / Warehouse** as the registry, scaling to 782K+ projects and 8.4M+ releases.
- **`pyproject.toml`** as the single canonical project file, with PEP 517 backends pluggable underneath.
- **pip** as the lowest-common-denominator installer, now with a real resolver.
- **venv** as the baseline isolation tool, **PEP 668** making isolation mandatory on most distros.
- **Poetry** as the mature dependency-manager-with-lockfile choice.
- **uv** as the fast successor that is rapidly becoming the default for new projects.
- **conda / mamba / miniforge** for the scientific computing world that still needs managed binary deps.
- **Trusted Publishing + Sigstore + 2FA** as the modern security baseline for publishers.

The remaining hard problems:
- **Sustainable funding** for PyPA maintainers — still mostly volunteer.
- **Full TUF/PEP 458 deployment** with end-user verification — still in progress.
- **Build backend fragmentation** — five major backends (setuptools, hatchling, flit-core, poetry-core, pdm-backend) plus language-specific (`maturin` for Rust, `scikit-build-core` for CMake) is more than ideal but probably permanent.
- **GPU / native dep ecosystem** — pip + wheels mostly handles this for x86_64 Linux, less well for ARM, Apple Silicon (improved 2023+), Windows, and exotic CUDA combinations. conda still wins here for the moment.

Python's packaging story is now boring in the best sense: the tools work, the standards exist, and a 2026 newcomer can publish a well-formed package without a history lesson.

---

## Study Guide — Python Packaging

### Tool map

- **uv** — the new fast package manager (Astral, Rust).
- **pip** — the oldest, still universal.
- **poetry, pdm, hatch, rye** — pyproject.toml-based.
- **pipx** — for CLI tools.
- **conda / mamba** — scientific / GPU-heavy stacks.
- **Build backends:** setuptools, hatchling, flit-core,
  poetry-core, pdm-backend.
- **Publish:** twine, hatch publish.

## DIY — Migrate from pip+venv to uv

Take any Python project with `requirements.txt`. Run
`uv init`, `uv add` the dependencies. Observe 10-100x
speedup.

## DIY — Publish a package

`uv build && uv publish`. You've just shipped to PyPI.

## TRY — Use Ruff as linter + formatter

Replace flake8 + black with Ruff. Single binary.
100x faster.

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
