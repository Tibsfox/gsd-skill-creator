# The Modern Fortran Ecosystem, Tooling, and Community (2026)

## Introduction

Fortran in 2026 is not the Fortran of 1977, 1990, or even 2008. A language
frequently declared dead by outsiders has undergone a quiet but determined
renaissance over the last five years. The emergence of LFortran, the maturation
of the Flang frontend inside LLVM, the steady growth of the fpm package
manager, and the community-driven stdlib project have transformed Fortran
from a legacy numerical workhorse into something that increasingly resembles
a modern programming ecosystem — while retaining the raw floating-point
performance that has kept it embedded in weather models, climate simulations,
and supercomputer benchmarks for half a century.

This document surveys the state of the Fortran ecosystem in 2026: the
compilers you can actually use, the build systems worth learning, the package
management story, the stdlib effort, editors and IDEs, testing and quality
tools, documentation, community channels, interoperability with other
languages, GPU and parallel computing, the canonical modern books, and a
closing assessment of where Fortran thrives, where it struggles, and where
it remains genuinely irreplaceable.

---

## 1. Compilers

The compiler landscape is where the biggest changes have happened. Five years
ago, the default answer was "GFortran, and maybe Intel if you paid for it."
In 2026 there are nine compilers worth knowing about, with two brand-new
LLVM-based frontends (LFortran and Flang) genuinely competing with the
long-established GFortran.

### 1.1 GFortran (GNU Fortran)

GFortran is the Fortran frontend bundled with GCC. It remains the most
widely deployed Fortran compiler on Earth because it ships with every Linux
distribution and every BSD. As of the GCC 15 release in April 2025, the
actively supported versions are GCC 13, 14, and 15.

- Home: <https://gcc.gnu.org/fortran/>
- Source: part of the GCC tree at <https://gcc.gnu.org/git/gcc.git>
- Standards support: full Fortran 95, the overwhelming majority of
  Fortran 2003 and 2008, partial Fortran 2018, and early work on 2023.
- License: GPLv3 with the GCC runtime library exception.
- Strengths: ubiquity, free, works everywhere, solid OpenMP, parallel
  features via OpenCoarrays, massive user base.
- Weaknesses: slower runtime performance than ifx or nvfortran on x86-64
  in many benchmarks, incomplete F2018/2023 coverage (notably some
  coarray teams and collectives, select rank edge cases, some
  parameterized derived type features).

### 1.2 Intel ifort and ifx

Intel historically shipped `ifort` (the Classic Fortran Compiler). Beginning
in 2021, Intel began transitioning to `ifx`, a new LLVM-based Fortran
frontend. The Classic `ifort` was placed in end-of-life status in late 2024.
As of 2026, `ifx` is the recommended Intel Fortran compiler and is the only
one receiving new feature work.

- Home: <https://www.intel.com/content/www/us/en/developer/tools/oneapi/fortran-compiler.html>
- Distribution: Intel oneAPI Base + HPC Toolkit. Free for personal use
  since 2024; commercial support is a paid add-on.
- Standards support: ifx has caught up to ifort on F2003/2008 and is
  considered production-ready for new projects as of the oneAPI 2025
  release.
- Strengths: still the performance leader on x86-64 for a wide range of
  numerical codes, excellent vectorization, auto-parallelization, strong
  OpenMP including target offload for Intel GPUs, integrated with the
  rest of the oneAPI stack (MKL, VTune, Advisor, Inspector).
- Weaknesses: closed source; huge install size; oneAPI licensing is
  easier than it used to be but still more friction than `apt install
  gfortran`.

### 1.3 NAG Fortran Compiler

NAG (Numerical Algorithms Group) is a commercial vendor headquartered in
the United Kingdom whose compiler has a specific role in the ecosystem:
reference-grade standards conformance and diagnostics.

- Home: <https://nag.com/fortran-compiler/>
- Standards support: historically the first compiler to ship new
  standard features; frequently used as the compliance oracle for
  portability testing.
- Role: if you want to know whether your code conforms to the standard
  or depends on a GFortran/Intel extension, you run it through NAG.
- Weaknesses: commercial, not used for production numerical runs, less
  aggressive optimization than ifx or nvfortran.

### 1.4 NVIDIA HPC SDK (nvfortran)

The NVIDIA HPC SDK is the direct successor to the Portland Group (PGI)
compilers NVIDIA acquired in 2013. `nvfortran` is NVIDIA's official Fortran
compiler, built on top of LLVM with NVIDIA's own backends.

- Home: <https://developer.nvidia.com/hpc-sdk>
- License: free for non-commercial use; commercial support is a paid
  add-on.
- Strengths: by far the best story for GPU offloading from Fortran
  today. Supports CUDA Fortran as a language extension, OpenACC as the
  NVIDIA-preferred pragma model, and — most interestingly — can compile
  `do concurrent` loops directly to GPU kernels, enabling
  standards-conforming Fortran code to run on GPUs without any
  vendor-specific annotations.
- Weaknesses: tied to NVIDIA hardware for GPU code; less interesting on
  pure CPU workloads.

### 1.5 AMD AOCC (Flang-based)

AMD's Optimizing C/C++/Fortran Compiler ships a Fortran frontend based on
the upstream Flang project with AMD-specific tuning for Zen cores. It is
the Fortran compiler of choice for EPYC and Ryzen Threadripper HPC nodes
when running on AMD silicon.

- Home: <https://www.amd.com/en/developer/aocc.html>
- Strengths: well-tuned for AMD x86-64 cores; ships with AMD's optimized
  math libraries.
- Weaknesses: smaller user base than Intel's tooling, less mature than
  ifx.

### 1.6 HPE Cray Fortran

Formerly known as Cray Compiling Environment, now part of the HPE Cray
Programming Environment sold with Cray/HPE supercomputers. This is the
compiler behind the scenes on machines like Frontier, Aurora (Cray piece),
and LUMI.

- Home: <https://cpe.ext.hpe.com/docs/>
- Strengths: deep integration with Cray's network hardware, Cray MPI,
  coarray-native tuning, strongest coarray implementation in the market.
- Where you encounter it: exascale and leadership-class HPC sites; not
  generally available for workstation use.

### 1.7 IBM XL Fortran / IBM Open XL Fortran

IBM's Fortran compiler for Power architectures and AIX. IBM has been
gradually moving from the classic XL front end to an LLVM-based Open XL
Fortran, mirroring what happened with XL C/C++.

- Home: <https://www.ibm.com/products/xl-fortran>
- Role: Power9/Power10 HPC, legacy AIX installations, certain government
  and banking sites.
- Not something you'll encounter on a laptop, but remains important in
  niches where IBM Power is dominant.

### 1.8 LFortran

LFortran is the surprise of the decade. Started in 2018 by Ondřej Čertík
and developed under the Fortran Language Server organization, LFortran is
an LLVM-based Fortran compiler with interactive features borrowed from the
Python ecosystem. It reached a 0.50 release in 2024 and 1.0.0 in late
2025.

- Home: <https://lfortran.org/>
- Source: <https://github.com/lfortran/lfortran>
- Standards target: modern Fortran (F2003 and later). LFortran does not
  attempt to be a drop-in GFortran replacement for FORTRAN 77 legacy
  codebases.
- Distinguishing features:
  - Jupyter kernel for interactive Fortran in notebooks.
  - Lazy compilation: you can type Fortran in a REPL and get a result
    without a full build cycle.
  - Clean LLVM IR generation; you can inspect the IR and the AST easily.
  - Both LLVM and C backends, which makes it usable as a
    "Fortran-to-C" transpiler when needed.
  - Well-defined ASR (Abstract Semantic Representation) layer that makes
    building static analysis tools much easier than with GFortran.
- Role in 2026: the go-to compiler for people trying Fortran for the
  first time in a notebook, for building modern language tooling, and
  for research into compiler architecture. Not yet the right choice for
  a 500 kLOC production climate model — but that gap is closing every
  release.

### 1.9 Flang (LLVM)

Flang is the LLVM project's official Fortran frontend. There were two
successive efforts called Flang; the current one (sometimes called
"Flang-new" or f18-based Flang) became the official LLVM subproject around
2020 and has been steadily maturing since.

- Home: <https://flang.llvm.org/>
- Source: `llvm-project/flang/` in the LLVM monorepo.
- Role: the long-term replacement for GFortran in the LLVM world. AMD's
  AOCC Fortran, ARM Fortran, and Fujitsu's A64FX compiler all derive
  from it. Intel's ifx also shares ancestry with the f18 design.
- Standards support as of 2026: solid Fortran 2003/2008 coverage,
  improving F2018 support, active work on F2023 features.
- Why it matters: consolidating the non-GNU Fortran world on a single
  shared frontend allows vendors to focus their effort on backends and
  optimization rather than maintaining parallel parsers.

### 1.10 Compiler selection in practice

A reasonable default matrix for 2026:

- Linux workstation, general-purpose numerical code: GFortran 14 or 15.
- x86-64 HPC node, performance-critical: Intel ifx.
- AMD EPYC HPC node: AOCC Fortran.
- NVIDIA GPU offload: nvfortran from the NVIDIA HPC SDK.
- Jupyter / teaching / quick experiments: LFortran.
- Standards compliance audit: NAG.
- Legacy Power / AIX: IBM XL / Open XL.
- Portable CI matrix: GFortran + ifx + LFortran (if your code is modern
  enough) + Flang if you can manage the build.

---

## 2. Build Systems

### 2.1 Make

The vast majority of existing Fortran in production today — climate models,
atmospheric chemistry, computational chemistry packages, ocean models,
solid-mechanics codes — builds with hand-written GNU Makefiles.
Dependency tracking between Fortran modules (the `.mod` problem) is
typically solved by one of three tactics: a depend rule that grovels through
sources with a perl or python script, explicit dependency lists maintained
by hand, or a separately-generated `depend.mk` include.

GNU Make remains perfectly serviceable for this. Fortran makefile authors
should know about the `-J` (module output) and `-I` (module search path)
flags; every compiler supports them with identical spelling.

### 2.2 CMake

CMake has become the de facto cross-platform build system for new Fortran
projects that need to integrate with a wider software stack. CMake's
Fortran support has been in-tree for over a decade and handles module
dependency tracking automatically.

- Home: <https://cmake.org/>
- Useful flags: `enable_language(Fortran)`,
  `set(CMAKE_Fortran_MODULE_DIRECTORY ...)`.
- Scientific projects that use CMake for Fortran: Trilinos (the C++
  parts dominate but Fortran is in there), PETSc's interface layer,
  HDF5's Fortran bindings, many stdlib downstream integrations.
- Minimum version worth targeting in 2026: CMake 3.25 or later.

### 2.3 fpm (Fortran Package Manager)

fpm is the single most important tooling development in Fortran since
coarrays. Launched in 2020 under the fortran-lang umbrella, fpm is modeled
explicitly on Rust's Cargo: a TOML manifest, a simple project layout
convention, automatic dependency fetching from Git, and a minimal set of
commands (`fpm build`, `fpm run`, `fpm test`, `fpm install`).

- Home: <https://fpm.fortran-lang.org/>
- Source: <https://github.com/fortran-lang/fpm>
- Manifest file: `fpm.toml`
- Default project layout:
  - `src/` for library modules
  - `app/` for executables
  - `test/` for tests
  - `example/` for example programs
- Version in 2026: approaching 1.0 stability with the 0.11.x series
  considered production-usable.

A minimal `fpm.toml` looks like:

```toml
name = "my_project"
version = "0.1.0"
license = "MIT"
author = "Your Name"

[build]
auto-executables = true
auto-tests = true
auto-examples = true

[dependencies]
stdlib = "*"
test-drive.git = "https://github.com/fortran-lang/test-drive.git"
```

The psychological effect of fpm on the Fortran community has been
substantial. Before fpm, starting a new Fortran project meant writing a
Makefile. After fpm, it means `fpm new my_project` and you're writing
Fortran 60 seconds later. That is the single biggest ergonomic improvement
the language has seen in forty years.

### 2.4 Meson

Meson has good Fortran support and is used in a subset of scientific
projects that want something faster than CMake with a more modern
configuration language. Notable users include some of the SciPy-adjacent
Fortran components.

- Home: <https://mesonbuild.com/>
- Fortran support: enabled by listing `'fortran'` in the `project()`
  languages list.

### 2.5 Legacy options: SCons, Autotools

SCons still exists and still has Fortran support; you will encounter it in
some older scientific projects. Autotools (`./configure && make`) remains
the dominant build system for a handful of mature numerical libraries
(notably LAPACK's reference implementation and BLAS variants). New
projects should not start here.

---

## 3. Package Management

### 3.1 The fpm registry

The fpm registry is the central package index for fpm-compatible Fortran
packages. It lives at <https://fpm.fortran-lang.org/> and functions
analogously to crates.io, though at much smaller scale.

- Packages currently published: several hundred in 2026.
- Distribution model: Git-based; the registry records metadata and fpm
  fetches sources directly from Git tags.
- Notable packages: stdlib, M_strings, json-fortran, fortran-csv-module,
  forlab, fypp (preprocessor), h5fortran (HDF5 wrapper), test-drive,
  neural-fortran (deep learning in pure Fortran).

### 3.2 Conda-forge

Conda-forge has broad Fortran coverage because so many scientific Python
packages depend on Fortran libraries underneath. If you are already in a
Conda-managed environment, `conda install -c conda-forge gfortran` gets
you a compiler and `conda install -c conda-forge fortran-stdlib` gets you
a prebuilt stdlib.

- Home: <https://conda-forge.org/>
- Role: convenient distribution path for Fortran libraries that need to
  coexist with Python, NumPy, SciPy.

### 3.3 Spack

Spack is the HPC-focused package manager developed at Lawrence Livermore
National Laboratory. It was explicitly designed for the needs of people
managing Fortran-heavy scientific software stacks across many compilers
and MPI implementations. If you run a supercomputer site or develop a
climate model, Spack is probably how you build and distribute your
dependency tree.

- Home: <https://spack.io/>
- Source: <https://github.com/spack/spack>
- Strengths: handles compiler/MPI/BLAS variant matrices, multiple
  concurrent builds of the same package with different options, module
  file generation for cluster environments.
- Fortran-relevant packages: MPI, OpenBLAS, LAPACK, SCALAPACK, PETSc,
  Trilinos, HDF5, NetCDF, ESMF, many others.

---

## 4. The stdlib Project

The Fortran standard library — `stdlib` — is a community effort to do
for Fortran what Python's standard library does for Python: provide a
blessed, batteries-included set of modules that every modern Fortran
developer can rely on. The project is housed under the fortran-lang
organization and is arguably the most visible sign that the Fortran
community has modernized its relationship with the rest of the software
world.

- Home: <https://stdlib.fortran-lang.org/>
- Source: <https://github.com/fortran-lang/stdlib>
- License: MIT.
- Build: CMake or fpm.
- Status in 2026: active development with regular tagged releases,
  growing adoption, stable APIs for the longest-standing modules.

### 4.1 What stdlib contains

Selected modules as of 2026:

- `stdlib_io` — text file I/O, TOML-style loading of numeric tables,
  npy/npz (NumPy) loading and saving.
- `stdlib_string_type` and `stdlib_strings` — a modern string type and
  a library of string-manipulation routines (split, join, replace,
  strip, find).
- `stdlib_array` — utilities for array manipulation beyond the built-in
  intrinsics.
- `stdlib_linalg` — BLAS/LAPACK-backed linear algebra with a modern
  interface: matrix inverse, determinant, eigenvalues, SVD, least
  squares, triangular solves, Cholesky.
- `stdlib_stats` — mean, variance, covariance, moments, median,
  quantile, correlation coefficients.
- `stdlib_stats_distribution_*` — random variates from common
  distributions: normal, uniform, exponential, gamma, etc.
- `stdlib_random` — modern PRNG API (xoshiro, PCG variants), replacing
  the compiler-dependent `random_number` intrinsic.
- `stdlib_optval` — ergonomic helper for handling optional arguments
  with default values.
- `stdlib_quadrature` — numerical integration: trapezoidal, Simpson,
  Gauss-Legendre.
- `stdlib_specialfunctions` — gamma, beta, error function, Bessel
  functions, Legendre polynomials.
- `stdlib_bitsets` — dynamic bitsets.
- `stdlib_hash_maps` and `stdlib_hashmap_*` — hash map containers
  (finally).
- `stdlib_logger` — structured logging with levels, handlers, and
  formatters.
- `stdlib_ansi` — terminal color and formatting.
- `stdlib_system` — portable shell-out and environment access.

### 4.2 Why it matters

Historically, every Fortran project had to reinvent the wheel for even
the most basic data structures. Need a hash map? Write it. Need to split
a string? Write it. Need a modern RNG? Wrap `random_number` and cross
your fingers. stdlib fixes this, and in doing so it makes modern Fortran
code look and feel like code in a language designed after 1990.

### 4.3 Using stdlib

With fpm:

```toml
[dependencies]
stdlib = "*"
```

With CMake via `find_package(fortran_stdlib REQUIRED)` after a
system-level install.

---

## 5. Editors and IDEs

### 5.1 VS Code with Modern Fortran

The most popular modern Fortran development environment in 2026 is
Visual Studio Code with the Modern Fortran extension. The extension
bundles syntax highlighting, linting, diagnostics, formatting, and
integrates with fortls for full language-server functionality.

- Marketplace: `fortran-lang.linter-gfortran`
- Maintained by the fortran-lang organization.
- Pairs with fortls (below) for go-to-definition, hover documentation,
  and workspace symbol search.

### 5.2 fortls (Fortran Language Server)

fortls is the Fortran language server, speaking LSP so that any
LSP-capable editor can provide Fortran intelligence.

- Home: <https://fortls.fortran-lang.org/>
- Source: <https://github.com/fortran-lang/fortls>
- Written in Python.
- Provides: symbol navigation, hover documentation, diagnostics,
  completion, signature help, workspace symbols, document symbols.
- Works with VS Code, Neovim, Emacs, Helix, Sublime Text, anything
  that speaks LSP.

### 5.3 Vim / Neovim

Vim and Neovim have long had Fortran syntax support. In 2026 the
recommended setup is Neovim with a built-in LSP client pointing at
fortls, plus tree-sitter-fortran for syntax highlighting.

- Syntax grammar: `tree-sitter-fortran`.
- LSP glue: nvim-lspconfig with an `fortls` entry.

### 5.4 Emacs f90-mode

Emacs has shipped a Fortran 90 mode for decades. Modern users combine
it with eglot or lsp-mode for fortls integration.

### 5.5 Eclipse Photran

Eclipse Photran was once the most capable Fortran IDE available — it
supported refactoring operations specific to Fortran (Extract
Procedure, Rename Module) that no other tool could match. Its decline
tracks Eclipse's general decline in the developer community. As of
2026 it is still maintained but no longer the recommended path for
most users.

- Home: <https://eclipse.dev/photran/>

### 5.6 Visual Studio with Intel Fortran

For Windows-based Fortran development targeting Intel hardware, Intel
still ships a Visual Studio integration as part of the oneAPI HPC
Toolkit. This is the standard environment for Windows-centric HPC
shops, engineering firms using Abaqus-adjacent Fortran user
subroutines, and numerical consultants in the Intel ecosystem.

---

## 6. Testing and Quality

### 6.1 Test frameworks

- **test-drive** — a lightweight unit testing framework built for fpm
  projects. It is now the de facto standard for new modern Fortran
  code. Source: <https://github.com/fortran-lang/test-drive>.
- **pFUnit** — NASA's parallel Fortran unit testing framework. The
  choice for MPI-parallel testing and for projects that have pFUnit
  infrastructure already. Source:
  <https://github.com/Goddard-Fortran-Ecosystem/pFUnit>.
- **vegetables** — another actively maintained framework with an
  emphasis on descriptive, BDD-style tests.
- **FRUIT** (FoRtran UnIt Test) — older, still in use in some
  projects.
- **funit** — the original xUnit-inspired Fortran test runner; now
  mostly superseded by the above.

### 6.2 Static analysis and linting

- **fortls** provides lightweight diagnostics as part of its LSP
  offering.
- **NAG Fortran** remains the gold standard for standards conformance
  audits.
- **fypp** — a Python-based preprocessor for Fortran that enables
  metaprogramming; not a linter but often used alongside linting.
- **stdlib's CI** uses GFortran warnings and Intel warnings as a de
  facto portability lint.

### 6.3 Code coverage

- **gcov / lcov** work directly with GFortran-built Fortran binaries
  and produce line-level coverage reports. This is the standard path.
- **Intel Inspector** covers ifx/ifort builds for coverage, memory
  errors, and threading issues; part of the oneAPI Toolkit.

### 6.4 Formatters

- **findent** — a format-preserving indenter for fixed-form and
  free-form Fortran, useful for cleaning up legacy code.
- **fprettify** — a Python tool that re-indents and normalizes modern
  free-form Fortran. Best suited for codebases that have committed to
  F90-and-later style.

Neither tool approaches the ubiquity of `gofmt`. Fortran does not yet
have a cultural expectation that all code will be auto-formatted, and
some projects resist the idea. This is an area the community is still
working on.

---

## 7. Documentation

### 7.1 FORD (FORtran Documenter)

FORD is the standard Fortran documentation generator, playing the same
role as Doxygen does for C/C++, Sphinx for Python, or rustdoc for Rust.
It understands Fortran's module system, derived types, interfaces, and
generic procedures in ways that Doxygen's retrofitted Fortran mode
cannot match.

- Home: <https://forddocs.readthedocs.io/>
- Source: <https://github.com/Fortran-FOSS-Programmers/ford>
- Input: Fortran source files with structured comments (`!>` or
  `!<`).
- Output: HTML sites with navigation, search, call graphs
  (Graphviz-based), and source cross-references.
- Projects using FORD: stdlib, many fpm-published packages, neural-
  fortran, many of the Fortran-lang incubator projects.

### 7.2 Doxygen

Doxygen has had Fortran support for years and remains the choice for
projects that already use Doxygen for their C++ components and want a
single documentation toolchain. It is less idiomatic than FORD for
pure Fortran projects but it does work.

---

## 8. Community and Resources

### 8.1 fortran-lang.org

The central hub. <https://fortran-lang.org/> hosts tutorials, news,
package registry links, release announcements, and the community
Discourse forum. Before fortran-lang existed, the Fortran web presence
was scattered across old university pages, a handful of vendor sites,
and the Usenet comp.lang.fortran archive. Consolidating everything
behind a single welcoming front door was one of the most impactful
community moves of the last decade.

### 8.2 Fortran Discourse

<https://fortran-lang.discourse.group/> — the primary discussion forum
for modern Fortran. It is where standards proposals get kicked around,
where fpm packages get announced, where compiler bugs get triaged, and
where beginners get answers. Active participation from compiler
vendors (Intel, NAG, NVIDIA staff all post), the J3 committee, stdlib
maintainers, and the LFortran / Flang developers.

### 8.3 r/fortran

<https://www.reddit.com/r/fortran/> — smaller than the Discourse but
still active, with a more beginner-oriented audience.

### 8.4 Fortran Standards Committees (J3 and WG5)

The Fortran standard is maintained jointly by the INCITS PL22.3 / J3
technical committee in the United States and ISO/IEC JTC1/SC22/WG5 at
the international level. Meetings are held several times a year, with
published papers and minutes.

- J3: <https://j3-fortran.org/>
- WG5: <https://wg5-fortran.org/>
- Current standard as of 2026: Fortran 2023 (published as
  ISO/IEC 1539-1:2023).
- Active work: Fortran 202y, the next revision, with proposals for
  enumeration types, improved generics, better interop with C++, and
  tweaks to the coarray model.

### 8.5 Conferences and meetings

- **FortranCon** — held roughly annually since 2020, with locations
  alternating between Europe, the US, and online.
- **Fortran-lang Monthly Calls** — open community calls with
  recordings archived on YouTube.
- **SC (Supercomputing)** — Fortran is a major presence at SC every
  November.
- **J3/WG5 plenaries** — technical, standards-focused, open to
  observers.

---

## 9. Interoperability

One of Fortran's hidden superpowers is that it is almost always called by
other languages, not the other way around. Every major scientific
computing environment — NumPy, SciPy, R, Julia, MATLAB, Octave — relies
on Fortran numerical kernels under the hood. Making that interop pleasant
has become a priority.

### 9.1 ISO_C_BINDING

The standards-blessed, portable way to interoperate between Fortran and C
is `ISO_C_BINDING`. You declare `bind(c)` on your Fortran procedures,
match your argument types to the `iso_c_binding` kinds (`c_int`,
`c_double`, `c_ptr`, etc.), and the resulting symbols have a stable C
ABI. Every modern compiler supports this.

Example:

```fortran
module my_interop
    use, intrinsic :: iso_c_binding
    implicit none
contains
    function c_compatible_sum(n, x) bind(c, name="c_compatible_sum") &
            result(s)
        integer(c_int), value :: n
        real(c_double), intent(in) :: x(n)
        real(c_double) :: s
        s = sum(x)
    end function
end module
```

This is the foundation on which everything else below is built.

### 9.2 f2py (NumPy)

`f2py` is the NumPy-distributed tool that scans Fortran source code and
generates Python extension modules. It is the reason SciPy can have
blisteringly fast linear algebra: SciPy's `scipy.linalg.*` is literally
LAPACK Fortran wrapped with f2py.

- Home: <https://numpy.org/doc/stable/f2py/>
- Works with: GFortran, Intel, most other compilers.
- Input: Fortran 77 or modern Fortran source plus an optional
  signature file.
- Output: a Python C extension module you can `import`.
- In 2026: still widely used, though for new projects people
  increasingly reach for ctypes-based or cffi-based wrappers around
  `ISO_C_BINDING` declarations, which are more portable across build
  systems.

### 9.3 forpy

`forpy` inverts the direction: it lets Fortran code call into Python.
This is useful when you have an established Fortran simulation and you
want to use a Python library (matplotlib, scikit-learn, PyTorch) for
visualization or post-processing without leaving the Fortran driver
program.

- Home: <https://github.com/ylikx/forpy>
- Status: stable, widely used in atmospheric science and visualization
  workflows.

### 9.4 Julia interop

Julia can call Fortran directly via `ccall`:

```julia
function fortran_sum(x::Vector{Float64})
    n = Int32(length(x))
    ccall((:c_compatible_sum, "libmy_interop.so"),
          Float64, (Int32, Ptr{Float64}), n, x)
end
```

Because Julia's numerical roots come partly from calling BLAS/LAPACK
(which are Fortran), this works well. Many Julia packages are thin
wrappers around existing Fortran libraries.

### 9.5 Rust and Fortran

Rust + Fortran is a pattern that has been growing steadily since 2023.
The idea is to use Rust for the safe, high-level application logic and
plumbing while keeping existing Fortran numerical kernels for the parts
where Fortran's array semantics and BLAS/LAPACK hookups dominate. The
`bindgen` crate can consume C header declarations generated from
`ISO_C_BINDING` `bind(c)` exports, so the boundary crossing is the
same shape as Rust-to-C.

This pattern shows up in modern climate modeling, computational physics,
and some financial modeling codebases — people who want Rust's safety
without rewriting thirty years of validated numerics.

---

## 10. GPU and Parallel Computing

### 10.1 CUDA Fortran

CUDA Fortran is NVIDIA's Fortran-native GPU programming extension. It
introduces `attributes(device)`, `attributes(global)`, `<<<grid,block>>>`
kernel launch syntax, and device arrays. It is a proprietary extension
supported only by `nvfortran`.

- Documentation: part of the NVIDIA HPC SDK docs.
- Use case: people who want to write GPU kernels directly in Fortran
  without dropping to C/C++ CUDA.

### 10.2 OpenACC

OpenACC is a directive-based parallel programming model that predates
OpenMP target offload. It started as a PGI/NVIDIA push, and nvfortran
remains its most complete implementation. OpenACC pragmas are
comparatively gentle — you annotate a loop with `!$acc parallel loop`
and the compiler offloads.

- Home: <https://www.openacc.org/>
- State in 2026: mature in nvfortran, partial support in GFortran for
  NVIDIA targets, effectively a dialect of the NVIDIA toolchain.

### 10.3 OpenMP target offload

OpenMP (originally CPU-only) added target offload directives in OpenMP
4.0 back in 2013, and steadily matured through 4.5, 5.0, 5.1, 5.2, and
now 6.0. GFortran, ifx, and nvfortran all support OpenMP target
offload to varying depths. This is the standards-based path forward for
writing GPU-portable Fortran.

- Home: <https://www.openmp.org/>
- Directive of interest: `!$omp target teams distribute parallel do`
- Sweet spot: people who want portability across NVIDIA, AMD, and
  Intel GPUs without committing to vendor-specific syntax.

### 10.4 DO CONCURRENT with GPU offload

`do concurrent` has been part of the Fortran standard since 2008 as a
way to tell the compiler that loop iterations are independent. What
changed recently is that nvfortran (and, increasingly, ifx and Flang)
can take a `do concurrent` loop and compile it directly to a GPU
kernel — no pragma, no library call, no vendor extension.

This is perhaps the most important GPU story in modern Fortran: a
standards-conforming program can run on the CPU or GPU depending on
compiler flags, with no source-level changes. It is the future most
Fortran developers are hoping to see consolidated across all vendors.

### 10.5 Coarrays

Coarrays are Fortran's native parallel programming model, standardized
in Fortran 2008 with major extensions in 2018. The basic idea is that
an array can live on multiple images (processes), and you access a
remote image's data with bracket syntax: `x[2] = y[3]`. Teams and
collectives were added in 2018 to bring coarrays into alignment with
MPI's collective operations model.

- Intel's ifx has a high-quality native coarray implementation over
  its own MPI.
- GFortran supports coarrays via the **OpenCoarrays** library
  (<https://github.com/sourceryinstitute/OpenCoarrays>), which sits on
  top of MPI.
- HPE Cray's Fortran has the most thoroughly optimized coarray
  implementation for supercomputer interconnects.

Coarrays are an interesting case of a feature that is beautiful and
standards-blessed but has struggled to displace raw MPI in practice.
MPI's ubiquity and flexibility keep it dominant. Coarrays remain a
niche-but-elegant option for greenfield HPC work.

---

## 11. Books for Modern Fortran (2003+)

The reading list below covers books focused on Fortran as it exists
today, not the FORTRAN 77 of your grandfather's textbooks.

### 11.1 Modern Fortran Explained (Metcalf, Reid, Cohen)

The canonical reference, continuously updated since the original
*Fortran 90 Explained* in 1990. The latest editions (Oxford University
Press) cover Fortran 2018 and Fortran 2023. If you are going to own
one Fortran book, this is the one. Written by three members of the
standards committee, including Michael Metcalf (long-time convener of
WG5) and John Reid (principal author of many Fortran standards
documents).

### 11.2 Modern Fortran in Practice (Arjen Markus)

Cambridge University Press. A practical, project-oriented book that
shows how to apply modern Fortran to real problems. Less of a language
reference, more of a working programmer's guide. Good complement to
Metcalf/Reid/Cohen.

### 11.3 Modern Fortran: Building Efficient Parallel Applications (Milan Curcic)

Manning. Focused on modern Fortran features for parallel programming:
coarrays, OpenMP, distributed memory computing. The author (Milan
Curcic) is also the creator of the neural-fortran library, so the book
carries real-world parallel programming experience.

### 11.4 Fortran for Scientists and Engineers (Stephen J. Chapman)

McGraw-Hill. The most widely assigned Fortran textbook at the
undergraduate level. Regularly updated. Covers F2003/2008 features in
recent editions. Beginner-friendly, comprehensive, assumes no prior
programming experience.

### 11.5 Numerical Recipes in Fortran 90 (Press, Teukolsky, Vetterling, Flannery)

Cambridge University Press. The classic algorithms reference, famous
for its pedagogical prose and infamous for its licensing. The Fortran
90 edition has not been updated in years but remains a valuable source
for understanding numerical methods at the level of the code.

---

## 12. The State of the Language in 2026

### 12.1 Why use Fortran now?

- **Performance.** On dense numerical workloads, Fortran remains
  competitive with or better than hand-tuned C++ — because its array
  semantics, aliasing rules, and IEEE arithmetic model all line up
  with what numerical compilers want to optimize.
- **Portability.** A well-written modern Fortran program will build
  unchanged on a laptop, an AMD workstation, an Intel HPC node, an
  NVIDIA GPU server, a Cray supercomputer, and an IBM Power system.
  Few other languages can make that claim.
- **Ecosystem depth.** Forty-plus years of published numerical
  algorithms exist as Fortran source. LAPACK, BLAS, MINPACK, QUADPACK,
  SLATEC, NETLIB — all Fortran, all still in active production use.
- **Longevity.** Code you write in Fortran today will still compile
  in twenty years. The standards committee takes backward
  compatibility seriously in a way few other language communities do.
- **IEEE arithmetic.** First-class IEEE floating-point support,
  including signed zeros, NaN handling, rounding modes, and the
  `ieee_arithmetic` intrinsic module.
- **Array semantics.** Whole-array operations, array slicing, array
  intrinsics (matmul, dot_product, sum, maxval, etc.), and a
  well-understood memory layout model.
- **Parallelism as a language feature.** Coarrays and
  `do concurrent` make parallel programming a first-class concern in
  the language itself, not a bolted-on library.

### 12.2 Why not use Fortran?

- **Smaller community.** The absolute community size is smaller than
  C++ or Python. Answers to edge-case questions can take longer to
  find.
- **Limited non-numerical library ecosystem.** Need a web framework?
  A GUI toolkit? A database driver? Fortran has some of these, but
  they are not numerous and they are not as polished as their
  equivalents in other languages.
- **Legacy drag.** Most existing Fortran in production is not modern
  Fortran. Code you inherit is likely to be a mix of FORTRAN 77,
  Fortran 90, and fragments of later standards bolted on, with
  makefile builds, module dependency hazards, and implicit typing
  still lurking in corners.
- **No general-purpose UI or web story.** Fortran does not have a
  React or a SwiftUI or a Django. If your project needs a rich UI, a
  web frontend, or significant string and HTTP work, you are going to
  reach for another language for that layer.
- **Tooling still maturing.** fpm, stdlib, LFortran, and Flang are all
  improving rapidly but none of them are as polished as the Cargo,
  rustdoc, and clippy trio in the Rust world.

### 12.3 Where Fortran is irreplaceable

- **Climate and weather modeling.** NOAA, ECMWF, Met Office, and most
  other national weather services run Fortran models. The global
  climate science community has bet decades of scientific validation
  on Fortran codebases, and that is not going to move.
- **Computational chemistry.** Gaussian, NWChem, VASP, Quantum
  Espresso, and many other quantum chemistry packages are Fortran.
  The cost of rewriting them in another language would be enormous
  and the scientific payoff would be zero.
- **Computational fluid dynamics.** OpenFOAM uses C++, but many of
  the older, well-validated CFD codes in aerospace and automotive are
  Fortran.
- **Dense linear algebra.** BLAS and LAPACK are Fortran. Everyone
  who does serious numerical linear algebra — including Python users
  via NumPy/SciPy — is calling into Fortran whether they know it or
  not.
- **Supercomputing benchmarks.** HPL (High-Performance Linpack, the
  TOP500 benchmark) is Fortran, as are many of the HPC application
  benchmarks used to characterize new systems.
- **Seismology and geophysics.** SPECFEM, many reservoir simulation
  codes, many oil-industry exploration codes.

### 12.4 The trajectory

The overall direction of travel for Fortran in 2026 is clear. The
language is consolidating around three compiler frontends (GFortran,
the LLVM f18/Flang lineage, and LFortran), a single package manager
(fpm), a community standard library (stdlib), and a central community
hub (fortran-lang.org). None of these existed ten years ago. All of
them now exist, work, and are maturing.

The work that remains is mostly about polish and depth, not about
identity. Fortran knows what it is, who uses it, and what problems it
exists to solve. The ecosystem rebuild of the last five years is
about making the experience of writing, building, testing,
documenting, and shipping Fortran code as pleasant as the experience
of doing those things in Rust, Go, or Python — without giving up any
of the performance and portability that made Fortran worth keeping
alive in the first place.

That is a much narrower mission than "take over the world," and it is
a much more achievable one. In 2026 the Fortran community is
measurably closer to finishing it than it was in 2020, and closer
still than it was in 2015. For a language the technology press has
been declaring dead since roughly 1985, that is no small
accomplishment.

---

## Appendix A: Quick URL reference

- Fortran community hub: <https://fortran-lang.org/>
- Fortran Discourse: <https://fortran-lang.discourse.group/>
- fpm: <https://fpm.fortran-lang.org/>
- stdlib: <https://stdlib.fortran-lang.org/>
- fortls: <https://fortls.fortran-lang.org/>
- FORD: <https://forddocs.readthedocs.io/>
- GFortran: <https://gcc.gnu.org/fortran/>
- Intel ifx (oneAPI): <https://www.intel.com/content/www/us/en/developer/tools/oneapi/fortran-compiler.html>
- NAG: <https://nag.com/fortran-compiler/>
- NVIDIA HPC SDK: <https://developer.nvidia.com/hpc-sdk>
- AMD AOCC: <https://www.amd.com/en/developer/aocc.html>
- LFortran: <https://lfortran.org/>
- Flang: <https://flang.llvm.org/>
- OpenCoarrays: <https://github.com/sourceryinstitute/OpenCoarrays>
- test-drive: <https://github.com/fortran-lang/test-drive>
- pFUnit: <https://github.com/Goddard-Fortran-Ecosystem/pFUnit>
- J3: <https://j3-fortran.org/>
- WG5: <https://wg5-fortran.org/>
- Spack: <https://spack.io/>
- Conda-forge: <https://conda-forge.org/>

## Appendix B: Minimum 2026 starter recipe

For a new modern Fortran project in 2026, the recommended starting
point is:

1. Install GFortran 14 or 15 (or ifx if you have it).
2. Install fpm: <https://fpm.fortran-lang.org/install/>
3. `fpm new my_project && cd my_project`
4. Add `stdlib = "*"` to `fpm.toml` under `[dependencies]`.
5. Add `test-drive` as a test dependency.
6. Write your modules in `src/`, your executables in `app/`, your
   tests in `test/`.
7. Use VS Code with the Modern Fortran extension and fortls.
8. Use FORD for documentation.
9. Commit the result to Git; optionally publish to the fpm registry.
10. Let the stdlib, fpm, and fortls trio handle the parts that would
    have taken a week of Makefile archaeology five years ago.

That is, in a sentence, what "modern Fortran" means as a lived
developer experience in 2026.

---

## Addendum: Flang, LFortran, and the parallel runtime story (2025–2026)

This addendum was added in April 2026 as part of a catalog-wide enrichment
pass. The main body above treats Flang and LFortran as in-progress compiler
efforts. That framing was correct when written; it is no longer the whole
story. Three things happened in 2025 that are worth recording.

### Flang's name-change and LLVM 20.1 (March 2025)

The LLVM Fortran compiler that had been called `flang-new` during its
multi-year rewrite officially became just `flang` in March 2025, with the
old upstream Flang (sometimes retroactively called "classic flang")
retired. LLVM 20.1.0 (March 2025) was the first LLVM release that
included `flang` as a shipped binary rather than as an optional build
target. By LLVM 22 (late 2025 / early 2026) the Fortran compiler had
added experimental support for a meaningful subset of Fortran's
multi-image parallel features (coarrays, `CO_BROADCAST`, `CO_SUM`, and
the related intrinsics).

The renaming matters for a reason that is not immediately obvious from
the diff: it marks the end of a multi-year transition in which the LLVM
ecosystem had two competing Fortran front-ends. Before March 2025, a
"which flang" question was genuine; after, it is a compatibility
footnote. Downstream package managers, CI systems, and vendor toolchains
have spent the last year consolidating on the single front-end.

**Source:** [LLVM Fortran Levels Up: Goodbye flang-new, Hello flang! — LLVM Project Blog, 2025-03-11](https://blog.llvm.org/posts/2025-03-11-flang-new/)

### LFortran — the interactive Fortran

LFortran, the independently-developed BSD-licensed Fortran compiler
built directly on LLVM, continued its growth through 2025. The defining
feature that separates it from both GFortran and Flang is that LFortran
is designed to work **interactively** — Jupyter-kernel mode, REPL mode,
and runtime evaluation — in addition to producing native binaries. This
makes it the first serious attempt since the 1970s to treat Fortran as
the kind of language a scientist can sit at a prompt and talk to, the
way Python, MATLAB, or Julia are used.

LFortran's front-end can parse all of Fortran 2018 to its AST, with a
growing subset transformable into its ASR (abstract semantic
representation) intermediate and an even smaller subset compilable via
LLVM to machine code. The project's 2025 work was primarily extending
the "fully compilable" subset — the gap between "LFortran can read your
Fortran" and "LFortran can compile and run your Fortran" is the
interesting delta, and it continues to close.

**Source:** [LFortran — lfortran.org](https://lfortran.org/)

### Caffeine, PRIF, and the parallel runtime answer

The long-running question "how should Fortran's multi-image parallel
features actually run on modern HPC systems" got a concrete answer in
2025. The answer is a two-layer split:

- **PRIF** — the Parallel Runtime Interface for Fortran — a compiler-facing
  API that Fortran compilers target when they lower coarray and
  `do concurrent` features.
- **Caffeine** — a portable parallel runtime library developed at
  Lawrence Berkeley National Laboratory (LBNL) that implements the PRIF
  interface and runs on top of MPI, GASNet, or other underlying
  communication substrates.

Flang 22's experimental multi-image support uses this Flang → PRIF →
Caffeine stack, and the architecture was described in a paper at the
SC '25 workshops (the International Conference for High Performance
Computing, Networking, Storage and Analysis). The significance is that
Fortran's parallel features — coarrays, `do concurrent`, collective
subroutines — are no longer something each compiler implements from
scratch against MPI. They are a standard runtime interface that one
shared library implements, and any compiler can target it.

This is the first time in Fortran's history that parallelism has had
a cross-compiler portable runtime story. The body above describes how
the Cray, Intel, LFortran, LLVM/Flang, and NVIDIA compilers already
auto-parallelize `do concurrent` in shared memory; the Flang + PRIF +
Caffeine work extends that story to distributed memory.

**Sources:** [Flang — Exascale Computing Project](https://www.exascaleproject.org/research-project/flang/) · [Caffeine — BerkeleyLab on GitHub](https://github.com/berkeleylab/caffeine) · [Lowering and Runtime Support for Fortran's Multi-Image Parallel Features using LLVM Flang, PRIF, and Caffeine — SC '25 Workshops, ACM DL](https://dl.acm.org/doi/10.1145/3731599.3767480) · [Compilers — Fortran Programming Language, fortran-lang.org](https://fortran-lang.org/compilers/) · [Intel Fortran Compiler for oneAPI Release Notes 2025](https://www.intel.com/content/www/us/en/developer/articles/release-notes/fortran-compiler/2025.html)

### What this means for "modern Fortran"

The 1–10 checklist above — fpm, stdlib, fortls, VS Code, FORD, GFortran
or ifx, push to Git — captures the modern single-node Fortran
development experience. The 2025 news does not change that experience.
What it changes is the story one layer below it: the set of available
Fortran compilers is now genuinely three broad options (GFortran, Flang,
LFortran) plus two commercial ones (ifx, NVIDIA HPC SDK / NVFortran),
all of them on active roadmaps, all of them competing on code quality
and feature coverage. That is the healthiest Fortran compiler ecosystem
in roughly forty years.

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
  — Fortran is the language that numerical analysis and scientific
  computing were shaped by. The numerical-hpc file in this bucket is
  the entry point for that thread.
- [**science**](../../../.college/departments/science/DEPARTMENT.md) —
  Fortran is the working language of climate modelling, computational
  chemistry, computational biology, and astrophysics simulation. For
  anyone studying the history or practice of computational science,
  Fortran is the substrate.
- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  As a programming language topic, Fortran sits in Programming
  Fundamentals with the rest of the procedural / imperative family.
  Its distinctive concern is numerical correctness rather than
  systems programming.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) —
  Fortran is the first high-level programming language, and its
  seventy-year arc is one of the cleanest case studies in how a
  language can survive by specializing.

---

*Addendum (Flang, LFortran, parallel runtime 2025–2026) and Related College Departments cross-link added during the Session 018 catalog enrichment pass.*

---

## Study Guide — Fortran Modern Ecosystem

### Tools

- **Compilers:** GFortran (GCC), Flang (LLVM), LFortran
  (interactive), Intel oneAPI Fortran, NVIDIA HPC SDK.
- **Package manager:** `fpm` (Fortran Package Manager).
- **Standard library:** `stdlib` at fortran-lang.org.
- **Forums:** fortran-lang Discourse, Intel oneAPI Fortran
  forum.

---

## DIY & TRY

### DIY 1 — Compare compilers

Take the same Fortran program and compile with GFortran,
Flang, and Intel Fortran. Compare executable size, runtime,
and compiler messages. Intel is usually fastest for
numerics.

### DIY 2 — Use LFortran interactively

LFortran has a Jupyter kernel. Try Fortran in a notebook.
This is an unusual experience for a 70-year-old language.

### TRY — Replace one shell script with Fortran

If you have a shell or Python script that does numerical
post-processing of some data, rewrite it in Fortran with
fpm. Measure the speedup.

---

## Related College Departments (Fortran ecosystem)

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
