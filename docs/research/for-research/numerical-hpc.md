# Fortran in High-Performance Computing and Scientific Computing

*PNW Research Series — Computing Heritage Cluster*
*Compiled 2026-04-09*

---

## Prologue: The Language That Refused to Die

In 2026, a young computational scientist walks into a graduate seminar at the University of
Washington. On the projector is a slide from the Community Earth System Model source tree.
Roughly 1.5 million lines of code scroll past — subroutines named `SOLVE_TRIDIAG`,
`INTERP_COLUMN`, `VERTICAL_REMAP`. Every line is Fortran. Some of the comments are dated
1987. The model runs on Frontier at Oak Ridge, the first exascale supercomputer, on GPUs
that weren't even conceivable when the original authors checked in their code.

This is not a museum piece. This model produced the sea surface temperature field that
fed last week's NOAA outlook. It is, in every sense that matters, production infrastructure
for the planet's atmosphere. It is also Fortran, and the people writing the next ten
million lines of it are in their twenties.

There is a persistent myth in software culture that Fortran is a zombie language — kept
alive only by inertia and tenure. The myth is wrong. Fortran is the language the numerical
world never stopped speaking, because no replacement ever matched the combination of
compiler maturity, array semantics, aliasing freedom, and a sixty-year archive of verified
algorithms that Fortran gives for free. This document is about why.

---

## Part I — The Numerical Library Ecosystem

You cannot understand Fortran's position in scientific computing without first understanding
that Fortran *is* the ecosystem. Nearly every numerical library in wide use today either was
written in Fortran, wraps a library written in Fortran, or exposes an interface that exists
because Fortran conventions defined what linear algebra APIs look like. The stack is built
column-major and one-indexed all the way down.

### 1. BLAS — the Basic Linear Algebra Subprograms

The story begins in 1979 with Level 1 BLAS: the first standardized set of vector operations —
dot products, vector norms, scalar-vector multiplies, Givens rotations. Charles Lawson,
Richard Hanson, David Kincaid, and Fred Krogh published the original specification as a
set of Fortran 66 subroutines with names like `SAXPY` (single-precision `a*x + y`), `SDOT`,
`SSWAP`, `SNRM2`. Those names survive today, forty-seven years later, in every BLAS
implementation shipped on Earth. `SAXPY` is, arguably, the most durable API in the history
of computing.

Level 2 BLAS arrived in 1988: matrix-vector operations. `SGEMV` (general matrix-vector
multiply), `STRSV` (triangular solve), rank-1 and rank-2 updates. The addition of matrix
operands exposed a new performance dimension — memory hierarchy. Level 1 was bandwidth-bound
on a simple two-level memory; Level 2 started exploiting the first generation of vector
registers and caches that began shipping on Cray, IBM, and CDC machines in the mid 1980s.

Level 3 BLAS — the real revolution — arrived in 1990. Matrix-matrix operations. `SGEMM`,
`STRSM`, `SSYRK`. The `O(n^3)` arithmetic over `O(n^2)` data meant that a well-tuned GEMM
could reach a substantial fraction of peak floating-point throughput, because the ratio of
compute to memory traffic was finally favorable enough to hide latency. Every dense linear
algebra algorithm that anyone cared about was rewritten in terms of Level 3 BLAS calls.
LAPACK is, in a deep sense, a book of recipes for expressing numerical linear algebra as
sequences of GEMMs. The recipes are the algorithms; the horsepower is in the GEMM.

The Reference BLAS — the one Netlib still distributes — is a clean, portable, unoptimized
Fortran 77 implementation. Nobody runs it in production. Production users run one of:

- **OpenBLAS**, a community fork of the legendary GotoBLAS (Kazushige Goto's hand-tuned
  assembly kernels from the Texas Advanced Computing Center era, later acquired by Microsoft).
  OpenBLAS is the default on most Linux distributions and is typically within a few
  percent of vendor peak on x86-64.
- **Intel MKL** (now part of Intel oneAPI), closed-source but free-as-in-beer for most
  users. On Intel silicon, MKL is the performance gold standard. It ships with sophisticated
  threading, AVX-512 kernels, and special-cased small-matrix paths.
- **ATLAS** (Automatically Tuned Linear Algebra Software), the pioneering auto-tuning
  framework from Clint Whaley. ATLAS generates optimal kernels at install time by
  benchmarking candidate code layouts. Still used on exotic architectures without vendor
  libraries.
- **BLIS** (BLAS-like Library Instantiation Software), from Robert van de Geijn's group at
  UT Austin. BLIS is a ground-up redesign that exposes a micro-kernel interface for
  architecture porting. It is the reference implementation for AMD's AOCL and for most ARM
  server BLAS today.
- **Apple Accelerate**, vendor-optimized for Apple silicon. The M-series Neoverse cores
  reach impressive GEMM throughput through Accelerate's AMX (Apple Matrix eXtensions)
  path.
- **NVIDIA cuBLAS / rocBLAS**, the GPU companions. cuBLAS is the single most widely used
  GEMM kernel on Earth thanks to deep learning, and its hand-tuned kernels from the
  Volta-to-Blackwell generations achieve above 95% of Tensor Core peak on favorable
  shapes.

The interface in all of these is identical. A Fortran program written in 1985 that calls
`DGEMM` can be relinked against any of them, and it will just work. That interface stability
is the miracle. Nothing else in computing has anything like it.

### 2. LAPACK — Linear Algebra PACKage

LAPACK was released in 1992, the successor to two older Netlib packages: LINPACK (for
dense systems) and EISPACK (for eigenvalue problems). The driving motivation was the
memory hierarchy. LINPACK, written in the late 1970s, operated primarily through Level 1
BLAS — vector operations — which was fine for the machines of the era but terrible on the
first generation of cache-based workstations and vector supercomputers. LAPACK rewrote all
the algorithms in terms of block operations that could be expressed with Level 3 BLAS
calls, preserving the numerical properties while getting an order of magnitude more
throughput on modern hardware.

The design team was a constellation: Jack Dongarra, Jim Demmel, Jack Bunch, Sven Hammarling,
Jeremy Du Croz, Anne Greenbaum, Iain Duff, Susan Ostrouchov, Alan McKenney, Danny Sorensen.
The resulting library is Fortran 77 in its core, with some Fortran 90 features added in
later versions (notably in LAPACK 3.x, starting around 2008). It handles:

- **LU decomposition** for general matrices (`?GETRF` / `?GETRS` / `?GESV`)
- **Cholesky decomposition** for symmetric positive definite matrices (`?POTRF`)
- **QR decomposition** with column pivoting (`?GEQP3`)
- **SVD** (singular value decomposition) for least squares and low-rank approximation (`?GESVD`, `?GESDD`)
- **Symmetric eigenvalue problems** via divide-and-conquer, MRRR, and QR iterations
- **Non-symmetric eigenvalue problems** via Hessenberg reduction and the QR algorithm
- **Generalized eigenvalue and singular value problems**
- **Condition number estimation** and iterative refinement

The naming convention is one of the enduring joys of Fortran numerical culture. Routine names
are five or six characters: a one-letter precision prefix (`S`, `D`, `C`, `Z`), a two-letter
matrix type (`GE` for general, `PO` for positive definite, `SY` for symmetric, `TR` for
triangular, `GB` for general banded), and a two- or three-letter operation code (`TRF` for
triangular factorization, `TRS` for triangular solve, `SV` for full solve, `EV` for
eigenvalues). So `DGESV` is "double-precision, general, solve" and `ZHEEVD` is "double
complex, Hermitian, eigenvalues/eigenvectors, divide-and-conquer". Once you internalize the
convention, the entire library is navigable from first principles.

LAPACK remains the reference implementation for dense linear algebra. Every major vendor
BLAS ships a LAPACK companion (MKL, OpenBLAS's bundled LAPACK, cuSOLVER for GPU). Every
scientific computing environment — MATLAB, NumPy, Julia, R, SciPy, Eigen — eventually
calls down into it.

### 3. ScaLAPACK

ScaLAPACK extends LAPACK to distributed memory via the BLACS (Basic Linear Algebra
Communication Subprograms) layer, which sits on top of MPI. The core data structure is a
block-cyclic distribution of a matrix across a two-dimensional process grid. The design
problem is brutal: preserve LAPACK's algorithmic structure and numerical behavior, but
schedule the block operations across nodes in a way that overlaps communication with
computation. The result is a library that can solve dense linear systems on thousands of
nodes, and whose descendants (Elemental, DPLASMA, SLATE) continue the distributed-memory
dense tradition on modern exascale hardware.

ScaLAPACK's routine names follow the same convention as LAPACK with a `P` prefix: `PDGETRF`
is the distributed double-precision general LU. The `P` stood for "parallel" in the early
nineties, before "parallel" had been claimed by shared-memory threading.

### 4. LINPACK — from library to benchmark

LINPACK the library has been superseded by LAPACK. LINPACK the benchmark lives on. The
original benchmark timed the solution of a 100x100 dense linear system; over the years the
problem size grew to match available hardware, and the "High Performance LINPACK" (HPL)
variant became the canonical supercomputer ranking metric. HPL is the `R_max` number on
TOP500. The benchmark is written in C with MPI, but the numerical core — the Level 3 BLAS
kernels that actually do the work — is almost always a vendor Fortran-or-assembly
implementation.

The arrangement is telling. For forty-five years, the worldwide pecking order of
supercomputers has been determined by how fast a particular block of Fortran numerical
code can be made to run. Marketing dollars, political capital, and billion-dollar capital
expenditure decisions all route through `DGEMM`.

### 5. EISPACK

EISPACK is the eigenvalue package that preceded LAPACK. It was a Fortran translation of
Jim Wilkinson's Algol procedures from *Handbook for Automatic Computation, Vol II: Linear
Algebra* (1971). Nobody links against EISPACK any more, but reading its source is an
education — the balancing routines, the Hessenberg reductions, the implicit-shift QR
iterations. Much of the numerical analysis that LAPACK now implements was first worked out
in EISPACK's source comments.

### 6. NAG Library

The Numerical Algorithms Group, founded in 1971 at the University of Nottingham, has been
selling a commercial numerical library continuously since its founding — the longest
continuous run of any numerical library vendor. The NAG Fortran Library was the original
product; today NAG also ships C, Python, and MATLAB interfaces, but the Fortran core is
still where the new algorithms land first. NAG's routine coverage is broader than LAPACK:
optimization, ODEs, PDEs, statistics, wavelet transforms, sparse solvers, special
functions. The NAG Fortran Compiler is separately a gold-standard conformance and
diagnostics tool.

### 7. IMSL

IMSL — International Mathematics and Statistics Library — is the other old commercial
library, founded in 1970 and now owned by Rogue Wave (itself now owned by Perforce). Like
NAG, it started as a Fortran library and later added C, C#, Java, and Python bindings. Big
financial institutions, aerospace primes, and pharmaceutical analytics shops have long-term
IMSL licenses because their pricing models, risk simulations, and clinical trial statistics
were written against IMSL in the 1980s and have simply never been rewritten.

### 8. NetCDF and HDF5

Scientific data lives in NetCDF and HDF5 files. Both formats were born in the late
1980s / early 1990s specifically to address the needs of numerical simulation output —
self-describing, portable, hierarchical, with strong support for multi-dimensional arrays.
Both ship with first-class Fortran bindings; the NetCDF Fortran 90 bindings in particular
are designed so idiomatically that you almost forget they're wrapping a C library.

Climate models, ocean models, astrophysics simulations, and NWP codes all write NetCDF or
HDF5 as their primary output format. A typical CESM run produces multi-terabyte NetCDF
archives with hundreds of variables per time slice. The Fortran side of the I/O interface
has to be fast enough to not become the bottleneck on a million-rank simulation, and it
generally is.

### 9. MPI — Message Passing Interface

MPI is the lingua franca of distributed-memory parallelism. It was standardized in 1994
(MPI-1) with two reference language bindings: C and Fortran. That duality matters. The
MPI Forum's founding members included Jack Dongarra, Marc Snir, Steve Otto, Tony Skjellum,
Ewing Lusk, and dozens of others from the Fortran-centric national lab community, and the
standard was designed from the first meeting to serve Fortran HPC codes as a first-class
citizen.

Fortran MPI codes tend to be clean — the array semantics of Fortran 90 map nicely onto
MPI's datatype system, and `MPI_Isend` / `MPI_Irecv` / `MPI_Wait` patterns compose
beautifully with Fortran's assumed-shape array arguments. A typical CESM subroutine will
open with a dozen MPI non-blocking sends, do local computation while the wire is flushing,
and close with a wait-all. The entire overlapping-communication pattern that made modern
HPC possible is native to Fortran code bases.

### 10. PETSc, SLEPc, Trilinos — the modern numerical infrastructure

Starting in the 1990s, a new generation of numerical frameworks appeared that were written
primarily in C or C++, designed to compose sparse solvers, preconditioners, and parallel
data structures at a higher level of abstraction than LAPACK. PETSc (Portable, Extensible
Toolkit for Scientific Computation) from Argonne, SLEPc (Scalable Library for Eigenvalue
Problem Computations) from Valencia, and Trilinos from Sandia are the three giants of the
era.

But under the hood, every sparse direct solver in PETSc — MUMPS, SuperLU_DIST, PARDISO —
is Fortran-first. Every eigenvalue solver in SLEPc calls LAPACK. Every Krylov subspace
method in Trilinos is dispatching to BLAS. The C and C++ layers are glue and scheduling;
the floating-point throughput comes from Fortran. PETSc provides a Fortran interface as a
first-class binding because the users writing new physics on top of it are Fortran
programmers.

---

## Part II — Why Fortran is Fast

The superficial answer to "why is Fortran fast?" is "because it's old and well-optimized".
The deeper answer involves language design decisions that were made in 1956 and turned out
to be correct in ways the original designers could not have anticipated.

### 11. Aliasing rules

Fortran's argument-passing semantics assume that procedure arguments do not alias. If you
call `SUBROUTINE FOO(A, B, C)` and then inside `FOO` write to `B` and read from `A`, the
compiler is allowed to assume that writes to `B` do not affect subsequent reads from `A`.
This is not a suggestion or a hint — it is a language rule, enforced by the standard,
which means the compiler can reason about dependencies without conservative assumptions.

C and C++ have the opposite default. A C compiler confronted with `void foo(double *a,
double *b, double *c)` must assume that `a`, `b`, and `c` may alias, because nothing in
the language prevents the caller from passing overlapping pointers. The `restrict` keyword
(C99) is a workaround, but it has to be applied deliberately to each pointer, and a lot of
legacy C code doesn't bother. The result: a C compiler generates more reload-after-store
than a Fortran compiler for identical source-level code, and loses vectorization
opportunities whenever the alias analysis can't prove independence.

On tight numerical kernels — the inner loops of GEMM, stencil kernels, PDE residual
evaluations — this difference routinely shows up as a 10-30% performance gap in favor of
Fortran, even with identical algorithms. It is the single most cited reason for Fortran's
performance reputation in the compiler research community.

### 12. Array semantics

Fortran 90 introduced first-class array types. An array isn't a pointer-plus-stride like it
is in C; it's a true object with a shape, bounds, and stride pattern that the compiler
tracks statically (or dynamically for assumed-shape arguments). You can write `A(1:N,
1:M)` as a sub-array reference, pass it to a subroutine expecting an array of conforming
rank, and the compiler handles descriptor passing and bound checking for you.

This matters because it enables the compiler to see array operations as whole-array
operations, not as individual element loads and stores. A statement like `A = B + C*D`
where all three are arrays is a single line of source code that compiles into an optimized,
vectorized, potentially parallelized loop. The compiler has full information: shapes,
strides, element types, aliasing status. There is no intermediate object, no unnecessary
temporary buffer, no virtual function dispatch — just the loop the programmer intended.

### 13. Mathematical formula expression

If `a`, `b`, and `c` are Fortran arrays, `c = a + b` means "do the element-wise add, in
whatever order and parallelism strategy the compiler chooses, and write the result into
`c`". This is the same semantics a mathematician wants when writing `c = a + b` on a
blackboard. It is also the same semantics a NumPy user expects, and the same semantics a
MATLAB user expects. NumPy and MATLAB both have to route through C extension modules to
get there; Fortran gets there from a single statement in the language.

The consequence for newcomers from Python is that Fortran looks surprisingly comfortable.
A linear-algebra algorithm transcribed from a textbook translates almost one-to-one into
Fortran 90. There is no interpreter overhead, no dtype casting tax, no garbage collector
pause — the code runs at compiled speed from the first line.

### 14. Column-major storage

Fortran stores multi-dimensional arrays in column-major order: the first index varies
fastest. `A(I,J)` is adjacent in memory to `A(I+1,J)`, not to `A(I,J+1)`. This is the
opposite of C's row-major convention.

Column-major happens to match the access pattern of most dense linear algebra algorithms.
When you factor a matrix by Gaussian elimination, you naturally access columns — pivot
columns, trailing update columns, the current active column. Column-major storage means
those access patterns are contiguous in memory, which means caches and prefetchers love
them. Row-major storage forces strided access for the same operations, and strided access
kills bandwidth on every modern cache hierarchy.

This is not a coincidence. Backus's original Fortran team designed column-major to match
the way IBM 704 programmers already wrote matrix code on paper. Seventy years later, it's
still the right choice for linear algebra.

### 15. No undefined behavior in arithmetic

Fortran's arithmetic model is clean. Integer overflow wraps (well-defined modular
arithmetic). Floating-point follows IEEE 754 by default, with well-specified rounding,
NaN propagation, and signed-zero behavior. There are no signed-vs-unsigned implicit
conversions to trip on, no pointer arithmetic that can slide off the end of an array and
produce silent corruption, and no strict-aliasing rules that make `int` and `float`
type-punning undefined.

The absence of undefined behavior is a correctness story, not a performance story, but it
shows up in performance indirectly. When a Fortran compiler sees a loop, it doesn't need
to worry about whether an integer index might overflow and invoke UB — the behavior is
specified, so the optimizer can transform the loop freely.

### 16. Strong typing

Fortran 90 onwards has strict type rules. You cannot implicitly convert an `INTEGER` to a
`REAL` in an expression — you must write `REAL(I)` explicitly. You cannot mix `REAL*4`
and `REAL*8` in a single expression without explicit conversion. The language enforces
kind-parameters for numerical precision so you can write precision-agnostic generic
subroutines that get specialized at compile time.

Strong typing catches a class of bugs — implicit precision loss — that are endemic in
mixed C/Fortran numerical codes. The old joke that "half of numerical C bugs are secretly
`float` where `double` was meant" does not translate to Fortran, because the Fortran
compiler will refuse to compile the offending expression.

### 17. Compiler maturity

Finally, the boring but overwhelming factor: sixty-nine years of compiler optimization
research applied to Fortran. Every major compiler technique — loop unrolling, loop
interchange, loop fusion, scalar replacement, software pipelining, auto-vectorization,
polyhedral transformation, inter-procedural analysis, profile-guided optimization —
landed in Fortran compilers first, because Fortran was where the customers (HPC) would
pay for it.

The research pipeline runs one-way. A technique is invented in a paper, implemented in
IBM XL Fortran or PGI Fortran or Cray's compiler, shipped to national labs, benchmarked on
real climate codes, tuned, made robust, and then — perhaps — backported to C and C++ a
decade later. By the time the C compiler gets it, the Fortran compiler has already had a
generation of refinement on real production code.

---

## Part III — TOP500 and Supercomputers

### 18. The LINPACK benchmark (HPL)

The TOP500 list, maintained since 1993, ranks supercomputers by their HPL performance —
the measured floating-point throughput when solving a dense linear system using LU
decomposition with partial pivoting. The benchmark is written in C with MPI, but the
inner loop is `DGEMM`, and `DGEMM` is the vendor-optimized hand-tuned Level 3 BLAS kernel
on whatever the machine is.

HPL has been criticized for three decades as an unrepresentative benchmark — real HPC
workloads are rarely dense linear algebra, and HPL rewards memory bandwidth and
floating-point peak in a way that doesn't track application performance. All true. It is
also true that HPL is reproducible, portable, and trivially comparable across generations
of hardware, and those are the properties a benchmark needs to be useful as a ranking
metric.

The 2024 Frontier result: 1.194 exaflops sustained, 1.685 exaflops peak, on a problem
matrix of 24.6 million unknowns. The computation took about two hours of wall clock. The
Fortran BLAS underneath drove the entire run.

### 19. HPCG

HPCG (High Performance Conjugate Gradients), introduced in 2014 by Mike Heroux, Jack
Dongarra, and Piotr Luszczek, is a newer benchmark designed to represent sparse iterative
solvers — the workload of real-world PDE simulation codes. HPCG solves a 3D Poisson problem
via preconditioned conjugate gradients with a symmetric Gauss-Seidel smoother. The
computational profile is memory-bandwidth bound, with irregular memory access patterns and
pipeline stalls that HPL simply doesn't see.

HPCG rankings are dramatically different from HPL rankings. A machine that does 1.2
exaflops on HPL might sustain only 40 teraflops on HPCG — a factor-of-30 gap — because
real sparse-solver workloads cannot saturate modern floating-point units the way dense
matrix multiply can. This gap is why climate modelers and CFD practitioners rolled their
eyes at HPL for thirty years. HPCG is their vindication.

HPCG is written in C++ with MPI, but the reference implementation was shaped by a Fortran
numerical sensibility and the algorithmic structure is identical to what Fortran sparse
solver codes have been doing since the 1980s.

### 20. Notable supercomputers and their Fortran codebases

- **Frontier (ORNL, 2022)**: The first true exascale machine, built on HPE Cray EX with AMD
  Instinct MI250X accelerators. Frontier's allocation profile is dominated by climate
  codes (E3SM, CESM), fusion simulation (GENE, XGC), and materials science (VASP, Quantum
  ESPRESSO). All Fortran-first. When a Frontier node is producing useful science, more
  likely than not it is executing Fortran.
- **Fugaku (RIKEN, 2020)**: The Japanese exascale machine, built on Fujitsu A64FX ARM
  processors. Fugaku's design goal was to serve real application workloads, not HPL peak,
  and the applications it was co-designed with — weather (NICAM), drug design, tsunami
  simulation — are almost all Fortran. Fugaku briefly topped TOP500 in 2020-2021 and is
  still among the most scientifically productive machines on Earth.
- **Summit and Sierra (DOE, 2018)**: IBM Power9 + NVIDIA V100 GPUs. Summit at ORNL for open
  science, Sierra at LLNL for national security. Both ran the full spectrum of DOE codes
  — combustion, turbulence, stellar astrophysics, weapons simulation. Fortran dominated
  the application layer, with CUDA Fortran and OpenACC bridging to the GPUs.
- **Earth Simulator (Japan, 2002)**: The NEC SX-6 vector machine that reclaimed #1 from
  U.S. scalar clusters. Earth Simulator was aggressively Fortran — the entire application
  stack ran on Fortran 90 code compiled by NEC's vectorizing Fortran compiler. The
  machine's technological statement was "vectors are not dead", and its cultural
  statement was "Fortran is the language of climate simulation".

---

## Part IV — Domain Applications

### 21. Climate and weather modeling

The climate and weather community is the single largest user of Fortran in 2026. Every
serious operational weather model and every serious climate model in the world is either
written in Fortran 90/2003/2008 or is being actively maintained in Fortran. The code bases
are enormous and the institutional investment is measured in person-centuries.

- **CESM (Community Earth System Model)**. Developed at the National Center for
  Atmospheric Research in Boulder, with contributions from DOE and university partners.
  CESM is approximately 1.5 million lines of Fortran spread across atmosphere (CAM), ocean
  (POP and MOM6), sea ice (CICE), land (CLM), and river transport components, all glued
  together by a coupler (CPL7/CMEPS). The code is modular, well-tested, and runs on every
  major DOE machine. CESM experiments form the backbone of U.S. contributions to the
  IPCC assessment reports.
- **WRF (Weather Research and Forecasting Model)**. The workhorse mesoscale model used by
  NOAA, NCAR, the Air Force, and thousands of universities and private weather companies
  worldwide. WRF is Fortran 90 with a Fortran build system (the Registry) that generates
  boilerplate subroutines from a declarative state description. The Registry is a small
  marvel — a homegrown DSL that predated most modern code-generation tools and still
  works better than most of them.
- **ECMWF IFS (Integrated Forecast System)**. The European Centre for Medium-Range Weather
  Forecasts' flagship global model, producing the deterministic and ensemble forecasts
  that much of the world's meteorology relies on. IFS is Fortran 90/2003 with a
  distinctive code style — heavy use of array syntax, module-level type definitions, and
  a strict parallelism discipline that scales to tens of thousands of MPI ranks.
- **NEMO (Nucleus for European Modelling of the Ocean)**. The European ocean model used
  in CMIP simulations, Copernicus Marine services, and a dozen national forecasting
  centers. Fortran 90, roughly 400,000 lines, with a clean modular structure.
- **GEOS (Goddard Earth Observing System)**. NASA's atmospheric model, Fortran throughout,
  used for operational data assimilation and reanalysis.
- **GFDL AM4 / CM4 / OM4**. NOAA GFDL's climate and ocean models. Fortran, heavily
  refactored in the last decade for modern architectures, with GPU porting via OpenACC.

### 22. Computational fluid dynamics

- **NASA OVERFLOW**. NASA's production overset-grid CFD code, used for aerodynamics of
  everything from the Shuttle orbiter to the Mars Helicopter (Ingenuity) rotor. Fortran.
- **NASA FUN3D**. An unstructured-grid CFD code with adjoint-based optimization. Fortran.
- **NASA CART3D**. Cartesian cut-cell CFD, used for launch vehicle aerodynamics. Fortran
  core with C glue.
- **OpenFOAM**. C++, not Fortran — the famous counterexample. But OpenFOAM's numerical
  algorithms were all first developed in Fortran form in the finite-volume research
  literature, and many of its solver choices trace directly back to Ferziger and Peric's
  Fortran-based textbook.

### 23. Computational chemistry

- **Gaussian**. The most widely used quantum chemistry package in the world, written by
  John Pople's group starting in 1970. Originally Fortran 66, now Fortran 77 with some
  modernization, famously impenetrable and famously fast. Pople won the Nobel Prize in
  1998 in part for the work that Gaussian embodies.
- **NWChem**. Massively parallel quantum chemistry from Pacific Northwest National
  Laboratory, built on the Global Arrays toolkit. Fortran throughout. NWChem pioneered
  many one-sided communication patterns for chemistry kernels that later influenced MPI-3.
- **CP2K**. Electronic structure and molecular dynamics, Fortran 2003/2008, one of the
  most actively maintained modern Fortran codebases. CP2K is heavily used for materials
  research in Europe and the U.S.
- **VASP (Vienna Ab initio Simulation Package)**. Commercial plane-wave DFT code. Fortran,
  reputed to be the single most cited piece of scientific software in materials science.
- **Quantum ESPRESSO**. Open-source DFT and pseudopotential calculations. Fortran 95/2003.

### 24. Astrophysics and cosmology

- **GADGET / GADGET-4**. Cosmological N-body + SPH simulations from Volker Springel.
  Fortran/C, with Fortran dominating the physics kernels.
- **FLASH**. Adaptive-mesh-refinement hydrodynamics from the University of Chicago's ASCI
  center. Fortran 90, used for supernova simulation, ICF, and astrophysical fluid dynamics.
- **ENZO**. Cosmological AMR simulations. Originally Fortran + C; the hydro solvers are
  Fortran.
- **Athena / Athena++**. Astrophysical MHD. Originally Fortran, later ported to C++ for
  Athena++, with the numerical heritage intact.

### 25. Finance

Large-scale quant libraries at banks and hedge funds often have Fortran roots. Monte Carlo
simulations for derivative pricing, American option exercise boundaries, credit risk, and
stress testing were all written in Fortran in the 1980s and 1990s and many have never been
rewritten. A Bloomberg-terminal anecdote: Bloomberg's analytics backend still includes
Fortran code paths for yield curve bootstrapping and certain bond valuation calculations,
inherited from pre-Bloomberg acquisitions.

### 26. Oil and gas

Seismic migration (Kirchhoff, reverse time migration), reservoir simulation (Schlumberger's
ECLIPSE, ExxonMobil's EM POWERS, Chevron's CHEARS), and full-waveform inversion are all
Fortran-dominated. The wavefield simulations are some of the largest floating-point
workloads outside national labs, and the code bases are carefully protected intellectual
property. If you work at a seismic processing shop in Houston, you are writing Fortran.

### 27. NASA legacy

NASA's Fortran lineage goes all the way back to the IBM 704 code that Mary Jackson,
Katherine Johnson, and Dorothy Vaughan were calculating by hand before there was a
compiler. Fortran replaced hand calculation at Langley in 1958-1959, and much of the
trajectory, guidance, and atmospheric modeling infrastructure written in the 1960s and
1970s still runs. Apollo-era orbital mechanics codes have been ported from Fortran 66 to
Fortran 77 to Fortran 90, but the algorithms, the variable names, and sometimes the exact
numerical constants are unchanged. They work, they are verified, and nobody is going to
rewrite a lunar-injection calculation in Rust just to prove it can be done.

---

## Part V — The Modern Performance Story

### 28. Vectorization

Auto-vectorization — the compiler's ability to transform a scalar loop into a SIMD loop —
is where Fortran's language-level array semantics pay off most visibly. A loop of the form

```fortran
do i = 1, n
   c(i) = a(i) + b(i) * s
end do
```

compiles, on any modern x86-64 target, into AVX-512 FMAs processing 8 doubles at a time.
The compiler can prove the loop is vectorizable because the language's aliasing rules
guarantee `a`, `b`, and `c` don't overlap (unless the programmer explicitly broke that
contract with a TARGET or POINTER attribute). The equivalent C loop requires `restrict`
on all three pointers, and even then the compiler has to do more work.

On AVX-512 targets, well-written Fortran kernels routinely achieve 80-90% of peak single-core
throughput on BLAS-like workloads. On ARM SVE (Fugaku, Grace), Fortran compilers target
scalable vectors natively.

### 29. OpenMP

OpenMP, the shared-memory parallelism standard, was created in 1997 by a committee that
was dominated by Fortran users — KAI, SGI, Cray, IBM, and the DOE labs. The original
specification was essentially a standardization of the `!$OMP PARALLEL DO` directives that
SGI's Power Fortran Accelerator and KAI's KAP/Pro toolset had been shipping for years. C
and C++ bindings came second, and were designed to match what Fortran was already doing.

Modern OpenMP (5.0+ and 6.0) has grown into a full task-based parallelism and
heterogeneous programming system, but the directive style and the loop-centric mental
model are still Fortran-native. A Fortran program with `!$OMP PARALLEL DO` reduction
clauses reads like Fortran; a C program with `#pragma omp parallel for reduction`
clauses reads like a C program with stuff bolted on. The difference is cultural and
slight, but it is felt by every Fortran programmer who has tried to maintain both.

### 30. Coarrays

Fortran 2008 introduced coarrays — a native parallel programming model built into the
language. A coarray is an array with an extra "codimension" that distinguishes between
images (processes). Writing `A(:)[2] = B(:)` means "copy the contents of `B` on this image
to `A` on image 2" — a one-sided put, expressed in standard Fortran syntax. There are
synchronization statements (`SYNC ALL`, `SYNC IMAGES`), collective operations (`CO_SUM`,
`CO_MAX`), and critical sections, all as language features.

Coarrays were designed by Robert Numrich and John Reid as a descendant of the Cray F--
extension and the CAF (Co-Array Fortran) research project at Rice University. The idea
predated MPI's one-sided communication support and is arguably cleaner than MPI-3 RMA.
Coarrays never fully displaced MPI in practice — the existing MPI code base is too large
— but they remain the only standardized parallel programming model embedded in a
mainstream language, and they continue to see use in greenfield projects and in
performance-portability studies.

### 31. GPU offloading

Three paths to GPU execution from Fortran:

- **OpenACC**. Directive-based, similar spirit to OpenMP. `!$ACC PARALLEL LOOP` marks a
  loop for GPU execution; the compiler handles data movement through `!$ACC DATA` regions.
  OpenACC was developed by PGI, Cray, and NVIDIA in 2011-2012 and became the default GPU
  path for Fortran climate codes through the 2010s.
- **OpenMP target offload**. OpenMP 4.5+ added `!$OMP TARGET` directives for GPU
  execution, generalizing the OpenACC model into the OpenMP standard. Most compilers
  now support both; OpenMP target is the portable choice.
- **CUDA Fortran**. A proprietary extension from PGI (now NVIDIA HPC SDK) that exposes
  CUDA kernels, device memory, and streams as Fortran language features. You write
  `attributes(global) subroutine my_kernel(...)` and call it with a `<<<blocks,threads>>>`
  launch. CUDA Fortran is the only non-C way to write CUDA code and remains popular in
  weather and chemistry communities that have invested deeply in NVIDIA hardware.

NVIDIA's HPC SDK (formerly the Portland Group / PGI compilers) is the reference GPU
Fortran toolchain. It ships `nvfortran`, which supports auto-offload of `DO CONCURRENT`
loops (see below) as well as OpenACC, OpenMP, and CUDA Fortran paths, all in a single
compiler.

### 32. DO CONCURRENT

`DO CONCURRENT`, introduced in Fortran 2008 and extended in Fortran 2018 with `LOCAL`,
`SHARED`, and `REDUCE` clauses, is the forward-looking way to express parallelism in
pure standard Fortran. A `DO CONCURRENT` loop tells the compiler "this loop has no
iteration dependencies and no ordering constraints — run it in whatever order or in
parallel, however you like".

```fortran
do concurrent (i = 1:n, j = 1:m) local(tmp) reduce(+:total)
   tmp = a(i,j) * b(i,j)
   total = total + tmp
end do
```

The genius of `DO CONCURRENT` is that the same source code can be compiled to serial,
SIMD-vectorized, OpenMP-parallel, or GPU-offloaded execution depending on the compiler
flags. `nvfortran -stdpar=gpu` will offload `DO CONCURRENT` loops to CUDA with automatic
unified memory management. This is as close as any language has come to the holy grail
of "write once, run on any parallel hardware", and it is Fortran that got there first.

---

## Part VI — Modern Tooling

### 33. GFortran

GFortran is the GNU Fortran compiler, part of GCC. It is free, GPL, and available on
every Unix platform and most Windows environments. For the last twenty years, GFortran has
been the default Fortran compiler for most non-commercial users — academic researchers,
open-source projects, Linux distributions, Conda environments. It supports Fortran
77/90/95/2003/2008 and most of 2018, with ongoing work on 2023.

GFortran is not the fastest compiler on any given benchmark — Intel ifort typically beats
it by 10-20% on x86-64 numerical kernels — but it is the most accessible, the most
portable, and the most compatible. If you want your Fortran code to build on a student's
laptop and on a supercomputer login node with no configuration differences, you target
GFortran.

### 34. Intel ifort / ifx

Intel's Fortran compilers have been the gold standard for x86-64 performance since the
late 1990s, when Intel acquired the team behind the KAI compilers. The classic compiler,
`ifort`, is based on the Intel Compiler Classic (ICC) frontend and has been in continuous
refinement for over two decades. The new compiler, `ifx`, is built on LLVM with Intel's
own optimization passes layered on top, and is Intel's strategic direction going forward.

Both are now free for individual and commercial use as part of Intel oneAPI, a policy
change in 2020 that substantially increased the compiler's accessibility. On Intel
silicon (and, increasingly, on AMD Zen), ifort/ifx produces the tightest numerical code
of any Fortran compiler on the market.

### 35. NAG Fortran

The NAG Fortran Compiler, from the Numerical Algorithms Group, is the standard-conformance
reference. It is not the fastest compiler; that is not its purpose. NAG's value
proposition is that it catches standard violations, subtle bugs, and undefined usages
that other compilers silently accept. If your code compiles clean with NAG's strict
checking, it is portable to any other conforming Fortran environment.

NAG's diagnostics are famously detailed — it will flag uninitialized variables, unused
dummy arguments, non-conforming argument passing, and implicit interface usages with
surgical precision. Every serious Fortran shop runs NAG at least as a gate in CI, even
when their production compiler is Intel or GFortran.

### 36. NVIDIA HPC SDK (formerly PGI)

The PGI compilers (Portland Group, Inc., founded 1989, acquired by STMicroelectronics
then by NVIDIA in 2013) were the first commercially successful GPU Fortran compilers.
Rebranded as the NVIDIA HPC SDK in 2020, the suite now includes `nvfortran`,
`nvc`, `nvc++`, plus math libraries (cuBLAS, cuFFT, cuSOLVER), communication libraries
(NVSHMEM, NCCL), and profiling tools (Nsight Systems, Nsight Compute).

`nvfortran` is the only Fortran compiler with production-quality GPU offload via both
directives (OpenACC, OpenMP) and standard language constructs (`DO CONCURRENT`). For
anyone writing new Fortran code that will run on NVIDIA GPUs, `nvfortran` is the default
choice.

### 37. LFortran

LFortran is a modern Fortran compiler built on LLVM by Ondrej Certik and a growing
community. The design goal is interactive Fortran — an REPL, Jupyter kernel integration,
fast incremental compilation, and clean error messages. LFortran uses an abstract semantic
representation (ASR) that enables language services, refactoring tools, and static
analysis in ways the older Fortran compilers never supported.

As of 2026, LFortran is still under active development and is not yet a production
compiler for full-scale HPC codes, but it compiles substantial portions of LAPACK, stdlib,
and fpm-based projects, and its tooling story is already ahead of every other Fortran
compiler. It is the best bet for bringing Fortran into the IDE era.

### 38. Flang

Flang is the LLVM Foundation's official Fortran frontend, developed primarily by NVIDIA,
ARM, and AMD. "Classic Flang" (the original PGI-derived frontend) has been superseded by
"New Flang" (sometimes called `flang-new` or `f18`), which is a ground-up rewrite using
modern LLVM infrastructure and a full Fortran 2018 parser.

Flang is the strategic LLVM Fortran path and will eventually replace GFortran on Apple
platforms (which dropped GCC years ago), on AMD's AOCC, and on ARM's commercial compiler
stack. It is rapidly closing the gap with GFortran and Intel; as of 2026 it is
production-ready for many workflows and under heavy development for the remaining
standard features.

### 39. fpm — Fortran Package Manager

fpm is a modern build tool for Fortran, modeled explicitly on Rust's Cargo. You write a
`fpm.toml` file describing your project, dependencies, and test targets. You type
`fpm build`, `fpm test`, `fpm run`, and the tool handles dependency resolution, build
ordering, and parallel compilation. It is, finally, the thing the Fortran ecosystem has
lacked for forty years — a standard, lightweight, actually-works-out-of-the-box build
system.

fpm's arrival (version 0.1 in 2020, maturing through 2023-2025) has had a disproportionate
effect on Fortran's modernization. It lowered the barrier to starting a new Fortran
project from "configure Makefiles and read CMake manuals" to "type `fpm new myproj` and
go". The number of greenfield Fortran projects on GitHub has grown substantially since
fpm became usable, and the fortran-lang organization has become a gathering point for
the modern community.

### 40. stdlib

stdlib is the Fortran community's ongoing attempt to build a modern standard library —
the batteries-included collection of utility code that every other language ecosystem
takes for granted. Sorting, hash maps, I/O formatters, statistics, string manipulation,
linear algebra wrappers, special functions, random number generators, optimization
primitives. stdlib is written in modern Fortran (2008+), tested with multiple compilers,
and integrates with fpm for one-line installation.

The stdlib project is maintained by the fortran-lang community. Its existence answers a
long-standing criticism of Fortran — "you have to write everything from scratch or roll
your own utility module" — and it is already shipping code that's in active use in
production HPC applications.

---

## Part VII — The Renaissance

### 41. Why Fortran is having a moment in the 2020s

Performance still matters, and it has started to matter more again. Three macro forces:

- **The energy cost of computation.** Data center electricity budgets and the climate
  impact of compute have become first-order concerns. A Fortran implementation of a
  numerical kernel that runs 2x faster than a Python equivalent uses 2x less energy.
  Multiply that across a national lab's annual allocation and you are talking about
  megawatt-years.
- **The AI training squeeze.** Deep learning training runs have put unprecedented pressure
  on floating-point throughput. Much of the modern AI stack (cuBLAS, cuDNN) is built on
  the same Fortran numerical heritage as the HPC stack — and the infrastructure code
  around AI training (data pipelines, communication libraries) has started to rediscover
  the lessons of Fortran HPC.
- **Memory safety without sacrificing speed.** Rust gets the headlines, but Fortran has
  been memory-safe (in the sense of no pointer arithmetic, bounds-checkable arrays, and
  no undefined behavior in arithmetic) for decades. The modern systems-programming
  conversation about safety-and-speed has made Fortran look a lot less like a fossil
  and a lot more like a precursor to the memory-safe language movement.

### 42. The new community

fortran-lang.org is the center of the modern Fortran community. It hosts fpm, stdlib,
LFortran collaboration, translation of Fortran wiki content, and a Discourse forum that
has become the real-time meeting place for Fortran users worldwide. A decade ago there was
no such forum; Fortran discussion happened on comp.lang.fortran and in private mailing
lists at national labs. Today it happens in the open, with a mixture of graduate students,
HPC staff, retired scientists, and language standard committee members mingling freely.

The modern toolchain — fpm, LFortran, stdlib, Flang, the community HTML tutorials, the
updated Fortran Wiki — is the first complete, coherent, welcoming toolchain the Fortran
ecosystem has had in decades. Prior generations of Fortran programmers had to learn the
language from whatever out-of-date book happened to be in the lab library. Modern learners
can go to fortran-lang.org and find a fpm-based tutorial, a browser-based playground, and
a working compiler on every major platform within five minutes.

### 43. Why young researchers learn Fortran in 2026

The question comes up in every numerical methods class. "Should I learn Fortran?" The
honest answer in 2026 is: if you are going to do computational science — climate, fluid
dynamics, chemistry, astrophysics, HPC engineering, numerical analysis — yes, absolutely,
because the code you will work on professionally is written in Fortran and will be for the
next thirty years. If you are going to do machine learning, data science, or web
development, no, but you should still know that the GEMM kernel under your PyTorch layer
started life in a Fortran test case in 1988.

The vast existing codebase is the single most important factor. Rewriting CESM in Rust
would take a decade and introduce a thousand bugs. Rewriting Gaussian in Julia would cost
a fortune and lose the accumulated numerical validation of fifty years of chemistry
publications. Rewriting LAPACK in C++ has been attempted multiple times (Eigen, Armadillo,
Blaze), and each time the authors end up calling back into the Fortran LAPACK for the hard
cases. The incumbent position of Fortran in numerical infrastructure is not inertia — it
is the accumulated trust of thousands of careful people who verified that the Fortran
code produces the right answer to fifteen decimal places.

---

## Coda: The Continuous Thread

Start with Backus's team at IBM in 1954. End with a graduate student at UW in 2026,
running a CESM experiment on Frontier to investigate Cascadia subduction zone tsunami
dispersion. The thread from one to the other is unbroken. The same language, the same
column-major convention, the same variable-kind parameters, the same DO-loop construct
(dressed up a little), the same basic understanding that numerical computation is its
own discipline and deserves a language that respects its needs.

Seventy years is a long time. No other programming language has made it this far, let
alone arrived at a point of active renaissance with a new toolchain, a new package manager,
a new community, and an entire generation of young scientists picking it up because it is
the right tool for their work. Fortran is not a zombie. Fortran is the deep infrastructure
of computational science, and it is going to stay that way for as long as we care about
getting numerical answers right.

The people maintaining CESM today were not born when the first CESM subroutine was
written. The people who will maintain it in 2050 are currently in middle school. They will
be writing Fortran. They will be writing good Fortran, by then, because the toolchain is
finally caught up, and because the lessons of sixty-nine years of numerical experience
are finally packaged in a way that a newcomer can absorb without having to reinvent them.

That is the real story of Fortran in HPC and scientific computing. Not survival — succession.
The handoff from one generation of computational scientists to the next, with the language
and its accumulated wisdom intact.

---

*Part of the PNW Research Series on tibsfox.com. See also: ALGOL-60 and the structured
programming tradition; C in systems programming; Unison and content-addressed code;
APL and array languages. For the computational chemistry companion piece, see the
Gaussian and VASP historical notes in the Chemistry cluster.*

---

## Study Guide — Fortran in HPC

### Why read this

HPC is the natural habitat of Fortran. Understanding why
this is still true in 2026 means understanding vector
machines, BLAS, memory-bandwidth bottlenecks, compiler
optimization of array code, and the structure of the
scientific-computing community.

### Key concepts

1. **BLAS/LAPACK.** Basic Linear Algebra Subprograms and its
   higher-level companion. Written in Fortran. Every other
   language wraps it.
2. **MPI.** Message Passing Interface for distributed-memory
   parallelism. Fortran bindings are first-class.
3. **Coarrays.** Fortran 2008+ has distributed-memory
   parallelism in the language itself.

---

## Programming Examples

### Example 1 — BLAS dgemm via Fortran

```fortran
external :: dgemm
real(8) :: A(N,N), B(N,N), C(N,N)
C = 0.0d0
call dgemm('N','N', N,N,N, 1.0d0, A,N, B,N, 0.0d0, C,N)
```

Link with `-lopenblas` or `-llapack`. This is faster than
Python+NumPy on the same hardware.

### Example 2 — A coarray hello world

```fortran
program hello
  implicit none
  integer :: this, total
  this = this_image()
  total = num_images()
  print *, 'image', this, 'of', total
end program
```

Compile and run with 4 images:
```
gfortran -fcoarray=single hello.f90 -o hello
./hello  # or opencoarrays / caf -n 4 ./hello
```

---

## DIY & TRY

### DIY 1 — Benchmark Fortran vs NumPy

Write the same 1000x1000 matrix multiply in Fortran (with
BLAS) and Python+NumPy. Measure. Both wrap the same BLAS,
but the Fortran version avoids Python overhead.

### DIY 2 — Run an MPI job

Install `openmpi`, write a 4-process Fortran MPI program
that computes partial sums. Run with `mpirun -np 4`.

### TRY — Contribute to a weather model

ECMWF's IFS and NCAR's WRF are written in Fortran and
open source. Read one routine. Propose a small improvement.

---

## Related College Departments (Fortran HPC)

- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
