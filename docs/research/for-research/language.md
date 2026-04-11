# Modern Fortran Language Reference (2003-2023)

> A deep reference for working programmers. Covers Fortran 2003, 2008, 2018, and 2023 features with runnable examples. Assumes familiarity with at least one systems or scientific language.

Fortran is the oldest high-level programming language still in active production use. The name was originally an acronym (FORmula TRANslation), coined by John Backus's team at IBM in 1954-1957. Modern Fortran — the dialect defined from Fortran 90 onward and refined through Fortran 2003, 2008, 2018, and 2023 — shares almost nothing with the FORTRAN of the punched-card era. It is a free-form, modular, object-capable, strongly typed language with the most sophisticated native array semantics of any mainstream language, native parallelism via coarrays, and direct C interoperability. LAPACK/BLAS, weather and climate models, CFD codes, structural solvers, and much of physics runs on Fortran.

---

## 1. Source Form

### 1.1 Free form vs. fixed form

Fortran has two source forms. **Fixed form** (FORTRAN 77 and earlier, still legal) is column-sensitive: column 1 = `C`, `*`, or `!` marks a comment; columns 1-5 = statement label; column 6 = continuation if non-blank/non-zero; columns 7-72 = the statement; columns 73-80 = historically ignored (card sequence).

```fortran
C     Fixed-form FORTRAN 77. Comments in column 1, statements at column 7.
      PROGRAM HELLO
      INTEGER I, N
      N = 10
      DO 100 I = 1, N
         WRITE (*, 200) I, I*I
  100 CONTINUE
  200 FORMAT (' i=', I3, '  i**2=', I5)
      STOP
      END
```

**Free form** was introduced in Fortran 90 and is what all modern code uses. No column rules, lines up to 132 characters:

```fortran
! Free-form modern Fortran.
program hello
   implicit none
   integer :: i
   integer, parameter :: n = 10
   do i = 1, n
      write(*, '(A, I3, A, I5)') ' i=', i, '  i**2=', i*i
   end do
end program hello
```

Compilers choose source form by extension: `.f`/`.for` means fixed; `.f90`/`.f03`/`.f08`/`.f18` means free. Override with `-ffree-form`/`-ffixed-form` (gfortran) or `-free`/`-fixed` (Intel). Modern projects use free form exclusively.

### 1.2 Comments

Free form: `!` starts a comment and runs to end of line; may appear anywhere on a line. Fixed form: `C` or `*` in column 1, or `!` anywhere (later standardised).

```fortran
! Whole-line comment.
x = 3.14   ! Trailing comment after code.
```

### 1.3 Continuation

In free form, `&` at the end of a line continues onto the next. If the continued line also starts with `&`, continuation resumes after that `&` — needed inside character literals to preserve whitespace:

```fortran
total = a + b + c + d + e + &
        f + g + h + i + j

message = 'This is a very long string that we want to &
          &split across multiple source lines.'
```

In fixed form, continuation is any non-blank, non-zero character in column 6:

```fortran
      TOTAL = A + B + C + D + E +
     &        F + G + H + I + J
```

### 1.4 Case

Fortran is **case insensitive**. `FOO`, `foo`, and `Foo` are the same identifier; same for keywords. Conventions: FORTRAN 77 used UPPERCASE EVERYTHING (only choice on punched cards); modern Fortran uses all lowercase, matching the standard itself; mixed (lowercase identifiers, UPPERCASE keywords) is common in textbooks. Character literals are, of course, case sensitive.

---

## 2. Program Structure

### 2.1 Units of compilation

A Fortran program is built from **program units**: `program` (main entry, exactly one per executable), `module` (reusable collection — the modern unit of encapsulation), `subroutine` (procedure returning nothing, like `void`), `function` (procedure returning a value), `submodule` (Fortran 2008, splits module interface from implementation), and `block data` (obsolete, avoid).

```fortran
program main
   use my_module, only: greet
   implicit none
   call greet('world')
end program main

module my_module
   implicit none
   private
   public :: greet
contains
   subroutine greet(name)
      character(len=*), intent(in) :: name
      print *, 'Hello, ', trim(name), '!'
   end subroutine greet
end module my_module
```

### 2.2 `implicit none`

Fortran's most infamous legacy: by default, variables starting with `I-N` are `integer` and everything else is `real` (the "rule of IJKLMN"). This turns typos into silent bugs. Modern Fortran **always** begins every program unit with `implicit none`, immediately after the `program`/`module`/`subroutine`/`function` header. There is no reason not to use it. Many compilers warn or error if it is missing.

### 2.3 `use` statement

Modules are imported with `use`:

```fortran
use iso_fortran_env                                   ! everything
use iso_fortran_env, only: real64, int64, output_unit
use my_module, only: foo, bar => baz                  ! rename on import
```

The `only:` form is best practice: documents the dependency and protects against collisions. `use` statements must precede `implicit none`, which must precede all declarations, which must precede the first executable statement.

### 2.4 `contains` and internal procedures

A program, module, subroutine, or function can have **internal procedures** introduced by `contains`. Internal procedures have access to the host scope's variables via **host association**:

```fortran
program demo
   implicit none
   integer :: counter = 0
   call increment(); call increment(); call increment()
   print *, 'counter =', counter
contains
   subroutine increment()
      counter = counter + 1          ! host-associated
   end subroutine increment
end program demo
```

Module procedures — defined inside a module after `contains` — are the modern way to structure a library.

### 2.5 `intent(in)`, `intent(out)`, `intent(inout)`

Every dummy argument should declare its **intent**. It is both documentation and a compiler-enforced contract: `intent(in)` is read-only (assigning is an error); `intent(out)` is output-only (value undefined on entry, must be set before return); `intent(inout)` is read and possibly written.

```fortran
subroutine solve_linear(a, b, x, ierr)
   real,    intent(in)  :: a(:,:)
   real,    intent(in)  :: b(:)
   real,    intent(out) :: x(:)
   integer, intent(out) :: ierr
end subroutine solve_linear
```

Without `intent`, Fortran assumes `intent(inout)` and loses both safety and optimisation opportunities. Always declare intents.

---

## 3. Data Types

### 3.1 Intrinsic types

Fortran has five intrinsic types: `integer`, `real`, `complex`, `logical`, `character`.

```fortran
integer           :: i, j, k
real              :: x, y, z
complex           :: c
logical           :: flag
character(len=64) :: name

integer, parameter :: k42 = 42
real,    parameter :: pi  = 3.14159265358979_8    ! _8 = kind 8
complex, parameter :: j   = (0.0, 1.0)            ! 0 + 1i
logical, parameter :: on  = .true.
character(len=*), parameter :: greeting = "hello"
```

### 3.2 `kind` parameters

Fortran does not bake floating-point width into the type keyword. Each intrinsic type has a **kind parameter** — a small integer selecting the precision. Kind numbers are compiler-dependent; use the `iso_fortran_env` named constants for portability:

```fortran
use iso_fortran_env, only: int8, int16, int32, int64, real32, real64, real128
implicit none
integer(int8)    :: tiny_int           ! 1-byte signed
integer(int32)   :: normal_int         ! 4-byte signed
integer(int64)   :: big_int            ! 8-byte signed
real(real32)     :: f32                ! IEEE single
real(real64)     :: f64                ! IEEE double
real(real128)    :: f128               ! IEEE quad (if supported)
complex(real64)  :: z
```

Literal constants should carry a kind suffix matching their variables:

```fortran
real(real64), parameter :: pi = 3.141592653589793_real64
real(real64)            :: x
x = 2.0_real64 * pi
```

For custom precision, `selected_int_kind(r)` and `selected_real_kind(p, r)` return a kind large enough to hold the requested range:

```fortran
integer, parameter :: dp   = selected_real_kind(15, 307)   ! IEEE double
integer, parameter :: qp   = selected_real_kind(33, 4931)  ! IEEE quad
integer, parameter :: i10  = selected_int_kind(10)         ! fits 10**10
real(dp)     :: x
real(qp)     :: ultra_precise
integer(i10) :: large_counter
```

### 3.3 Derived types

Derived types are Fortran's structs — and in modern Fortran they carry methods, inheritance, and generic operators:

```fortran
type :: point
   real :: x, y, z
end type point

type(point) :: p, q
p = point(1.0, 2.0, 3.0)         ! positional constructor
q = point(x=0.0, y=0.0, z=0.0)   ! keyword form
print *, p%x, p%y, p%z           ! % is the component-access operator
```

Default values, plus allocatable and pointer components, are legal:

```fortran
type :: particle
   real    :: mass     = 1.0
   real    :: charge   = 0.0
   real    :: pos(3)   = 0.0
   logical :: active   = .true.
end type particle

type :: node
   integer             :: value
   type(node), pointer :: next => null()     ! linked list
end type node
```

### 3.4 Type-bound procedures

Fortran 2003 added type-bound procedures, turning derived types into objects with methods:

```fortran
module vectors
   implicit none
   type :: vec3
      real :: x, y, z
   contains
      procedure :: norm => vec3_norm
      procedure :: dot  => vec3_dot
   end type vec3
contains
   function vec3_norm(self) result(n)
      class(vec3), intent(in) :: self
      real :: n
      n = sqrt(self%x**2 + self%y**2 + self%z**2)
   end function vec3_norm

   function vec3_dot(self, other) result(d)
      class(vec3), intent(in) :: self, other
      real :: d
      d = self%x*other%x + self%y*other%y + self%z*other%z
   end function vec3_dot
end module vectors

program use_vec3
   use vectors
   implicit none
   type(vec3) :: a, b
   a = vec3(3.0, 4.0, 0.0);  b = vec3(1.0, 0.0, 0.0)
   print *, 'norm a =', a%norm()   ! 5.0
   print *, 'a.b   =', a%dot(b)    ! 3.0
end program use_vec3
```

`class(vec3)` in the method signature means "this type or any extension of it" — enabling polymorphism. See OOP section.

### 3.5 Parameterized derived types (PDT)

Fortran 2003 added PDTs: derived types with compile-time (`kind`) or runtime (`len`) parameters, similar to C++ templates but more restricted:

```fortran
type :: matrix(rows, cols, rk)
   integer, len  :: rows, cols               ! runtime parameters
   integer, kind :: rk = kind(1.0)           ! compile-time parameter
   real(rk) :: data(rows, cols) = 0.0_rk
end type matrix

type(matrix(3, 3, kind(1.0d0))) :: m
```

PDT support varies across compilers — check before relying on them heavily.

---

## 4. Arrays — Fortran's Killer Feature

Fortran was designed from day one for numerical arrays, and 70 years of refinement show. Array semantics are integrated at the language level in a way no other mainstream language matches.

### 4.1 Array declarations

Multiple equivalent forms:

```fortran
real :: a(100)                    ! 1D, size 100
real, dimension(100) :: b         ! same, attribute form
real :: c(3, 4)                   ! 2D, 3 rows x 4 cols
real :: e(0:9)                    ! lower bound 0
real :: grid(-10:10, -10:10)      ! 21x21, centred on origin
integer, parameter :: n = 100
real :: f(n)                      ! sized by parameter
```

Fortran arrays are **1-indexed by default** (bites C programmers) and **column-major** — `a(i, j)` stores `i` varying fastest, the opposite of C. The outer loop should iterate over the last index:

```fortran
do j = 1, m                 ! efficient: inner loop is contiguous
   do i = 1, n
      a(i, j) = 0.0
   end do
end do
```

### 4.2 Array slicing

Fortran has first-class slice notation: `a(lo:hi:step)`. Missing `lo` means "from the start"; missing `hi` means "to the end":

```fortran
real :: v(20), m(10, 10)
v(1:10)         ! first 10 elements
v(11:)          ! elements 11 to 20
v(:)            ! all elements
v(1:20:2)       ! odd-indexed: 1, 3, 5, ..., 19
v(::2)          ! every other
v(20:1:-1)      ! reversed
m(1, :)         ! row 1 as a 1D slice
m(:, 5)         ! column 5 as a 1D slice
m(2:4, 6:8)     ! 3x3 subblock
m(::2, ::2)     ! every other row and column
```

Slices can be on either side of an assignment; shapes must conform.

### 4.3 Whole-array operations

Arithmetic on whole arrays is elementwise. No explicit loop:

```fortran
real :: a(1000), b(1000), c(1000)
a = 0.0                      ! set every element to 0
b = [(real(i), i = 1, 1000)]
c = a + b                    ! elementwise add
c = 2.0 * b + 3.0            ! scalar-array ops broadcast
c = sin(b) + exp(-b)         ! elementwise intrinsics
where (c > 1.0) c = 1.0      ! conditional assignment
```

Compilers aggressively vectorise and parallelise these expressions. This is the most important reason people still write numerical kernels in Fortran.

### 4.4 Array constructors

Array literals use brackets. Fortran 2003+ uses `[...]`; older code uses `(/ ... /)`:

```fortran
integer :: v(5)
v = [1, 2, 3, 4, 5]                  ! modern
v = (/ 1, 2, 3, 4, 5 /)              ! older
real :: x(10), y(3)
x = [(real(i)**2, i = 1, 10)]        ! implied do: 1, 4, 9, ..., 100
y = [real :: 1, 2, 3]                ! type-specified
```

### 4.5 `reshape`

`reshape(source, shape)` changes shape; the element count must match:

```fortran
real :: flat(12), matrix(3, 4), cube(2, 2, 3), padded(4, 4)
flat   = [(real(i), i = 1, 12)]
matrix = reshape(flat, [3, 4])            ! column-by-column fill
cube   = reshape(flat, [2, 2, 3])
padded = reshape(flat, [4, 4], pad=[0.0], order=[2, 1])   ! with pad + permute
```

### 4.6 Intrinsic array functions

```fortran
real    :: a(100), b(100), m(10, 10), col_sums(10)
real    :: total, biggest
integer :: loc(1)
total    = sum(a)
biggest  = maxval(a)
loc      = maxloc(a)
print *, dot_product(a, b)
m        = matmul(m, m)
print *, transpose(m)
col_sums = sum(m, dim=1)              ! reduction along a dimension
```

Other frequent intrinsics: `size`, `shape`, `lbound`, `ubound`, `count`, `any`, `all`, `minloc`, `merge`, `pack`, `unpack`, `cshift`, `eoshift`, `spread`, `product`, `minval`.

### 4.7 Allocatable arrays

Dynamic arrays are `allocatable` and explicitly allocated:

```fortran
real, allocatable :: data(:)
integer :: n
read *, n
allocate(data(n))
data = 0.0
! ... use data ...
deallocate(data)
```

Allocatable arrays are **automatically deallocated** when they go out of scope. Assignment to an allocatable auto-(re)allocates (Fortran 2003+):

```fortran
real, allocatable :: x(:)
x = [1.0, 2.0, 3.0]                  ! allocates size 3
x = [x, 4.0]                         ! reallocates to size 4
x = sin([(real(i)*0.1, i=1,100)])    ! reallocates to size 100
```

With error checking:

```fortran
real, allocatable :: big(:)
integer :: ierr
character(len=256) :: msg
allocate(big(10**9), stat=ierr, errmsg=msg)
if (ierr /= 0) then
   print *, 'allocation failed: ', trim(msg);  stop 1
end if
```

### 4.8 Assumed-shape arrays

The modern idiom for array arguments is **assumed shape**: the callee writes `a(:)` or `a(:,:)` and the compiler passes an array descriptor so the callee knows size and bounds:

```fortran
module stats
   implicit none
contains
   function mean(a) result(m)
      real, intent(in) :: a(:)           ! assumed shape
      real :: m
      m = sum(a) / size(a)
   end function mean

   subroutine normalize_rows(m)
      real, intent(inout) :: m(:,:)
      integer :: i
      do i = 1, size(m, 1)
         m(i, :) = m(i, :) / sum(m(i, :))
      end do
   end subroutine normalize_rows
end module stats
```

Assumed-shape arguments require an **explicit interface** — the caller must know the signature. Module procedures provide this automatically; external procedures need an `interface` block.

---

## 5. Control Structures

### 5.1 `if` / `then` / `else` / `end if`

```fortran
if (x > 0.0) then
   print *, 'positive'
else if (x < 0.0) then
   print *, 'negative'
else
   print *, 'zero'
end if

if (x < 0.0) x = 0.0         ! single-line form, no `then`

outer: if (ready) then       ! named blocks
   inner: if (count > 0) then
      print *, 'go'
   end if inner
end if outer
```

### 5.2 `do` loops

```fortran
integer :: i
do i = 1, 10;         print *, i;  end do
do i = 1, 100, 2;     print *, i;  end do      ! with step
do i = 100, 1, -1;    print *, i;  end do      ! counting down

real :: residual
residual = huge(1.0)
do while (residual > 1.0e-6)
   call iterate(x, residual)
end do

i = 0
do                                ! infinite with exit / cycle
   i = i + 1
   if (i > 100) exit              ! break
   if (mod(i, 2) == 0) cycle      ! continue
   print *, i
end do

outer: do i = 1, n                ! named loops for non-local exit
   inner: do j = 1, m
      if (bad(i, j)) exit outer
      if (skip(i, j)) cycle inner
      call process(i, j)
   end do inner
end do outer
```

### 5.3 `do concurrent`

Fortran 2008 introduced `do concurrent` — a loop whose iterations are declared independent, letting the compiler parallelise or vectorise without further analysis:

```fortran
do concurrent (i = 1:n)
   c(i) = a(i) + b(i) * 2.0
end do

do concurrent (i = 1:n, j = 1:m, a(i,j) > 0.0)    ! multidim with mask
   a(i, j) = sqrt(a(i, j))
end do
```

Inside `do concurrent`, iterations must not have loop-carried dependencies and may not perform I/O. Fortran 2018 added `locality` clauses (`local`, `local_init`, `shared`, `default(none)`):

```fortran
do concurrent (i = 1:n) local(tmp) shared(a, b)
   tmp  = a(i) * b(i)
   a(i) = tmp + 1.0
end do
```

### 5.4 `select case`

Fortran's switch statement. Each `case` can be a single value, a list, or a range:

```fortran
select case (code)
case (0);        print *, 'zero'
case (1, 2, 3);  print *, 'small'
case (4:9);      print *, 'single digit'
case (10:);      print *, 'big'
case default;    print *, 'negative'
end select
```

Works with integers, characters, and logicals. Not with reals.

### 5.5 `where` / `elsewhere`

Conditional assignment over arrays. The mask must conform to the arrays being assigned:

```fortran
real :: a(100), b(100)
where (a > 0.0)
   b = sqrt(a)
elsewhere (a < 0.0)
   b = -sqrt(-a)
elsewhere
   b = 0.0
end where

where (x /= 0.0) y = 1.0 / x   ! single-statement form
```

### 5.6 `forall`

`forall` is a masked array assignment construct. It was deprecated in Fortran 2018 (use `do concurrent` instead) but still common in existing code:

```fortran
forall (i = 1:n, j = 1:n, i /= j) m(i, j) = 0
forall (i = 1:n) m(i, i) = 1
```

Key difference from `do`: the right-hand side is evaluated for every index before any assignment, so there is no iteration order.

---

## 6. Modules and Interfaces

### 6.1 `module` / `end module`

Modules are the modern unit of reusable code:

```fortran
module constants
   use iso_fortran_env, only: real64
   implicit none
   private
   real(real64), parameter, public :: pi   = 3.141592653589793_real64
   real(real64), parameter, public :: e    = 2.718281828459045_real64
   real(real64), parameter, public :: c_ms = 299792458.0_real64
end module constants
```

### 6.2 `public` / `private`

By default, module entities are `public`. Best practice: set module-wide `private`, then whitelist public names:

```fortran
module widgets
   implicit none
   private                                   ! hide everything
   public :: widget, make_widget, run        ! API

   type :: widget
      integer :: id
      real    :: weight
   end type widget
contains
   function make_widget(id, weight) result(w)
      integer, intent(in) :: id
      real,    intent(in) :: weight
      type(widget) :: w
      w%id = id;  w%weight = weight
   end function make_widget

   subroutine run(w)
      type(widget), intent(in) :: w
      print *, 'running widget', w%id
      call internal_helper(w)                ! visible inside the module
   end subroutine run

   subroutine internal_helper(w)             ! private: hidden from users
      type(widget), intent(in) :: w
      print *, '  weight =', w%weight
   end subroutine internal_helper
end module widgets
```

### 6.3 `use` with `only:`

```fortran
use constants, only: pi, e
use widgets,   only: widget, make_widget, run
use stats,     only: mean_fn => mean        ! rename on import
```

### 6.4 `interface` blocks

An **interface block** declares the signature of a procedure so the compiler can type-check calls. Module procedures get interfaces for free. Explicit `interface` blocks are needed for external procedures, function pointers, and generic names.

```fortran
program use_external
   implicit none
   interface
      subroutine legacy_solver(n, a, b, x)
         integer, intent(in)  :: n
         real,    intent(in)  :: a(n, n), b(n)
         real,    intent(out) :: x(n)
      end subroutine legacy_solver
   end interface
   real :: a(3,3), b(3), x(3)
   call legacy_solver(3, a, b, x)
end program use_external
```

### 6.5 Generic interfaces (overloading)

Bind multiple procedures to a single name so calls dispatch on argument type/kind/rank:

```fortran
module my_math
   implicit none
   private
   public :: my_abs
   interface my_abs
      module procedure my_abs_int, my_abs_real, my_abs_real_array
   end interface my_abs
contains
   function my_abs_int(x) result(y)
      integer, intent(in) :: x
      integer :: y
      y = merge(-x, x, x < 0)
   end function my_abs_int

   function my_abs_real(x) result(y)
      real, intent(in) :: x
      real :: y
      y = merge(-x, x, x < 0.0)
   end function my_abs_real

   function my_abs_real_array(x) result(y)
      real, intent(in) :: x(:)
      real :: y(size(x))
      y = merge(-x, x, x < 0.0)
   end function my_abs_real_array
end module my_math
```

### 6.6 Operator overloading

`interface operator(+)` lets a derived type support built-in syntax:

```fortran
module vec2_mod
   implicit none
   private
   public :: vec2, operator(+), operator(*)

   type :: vec2
      real :: x, y
   end type vec2

   interface operator(+)
      module procedure vec2_add
   end interface
   interface operator(*)
      module procedure vec2_scale
   end interface
contains
   pure function vec2_add(a, b) result(c)
      type(vec2), intent(in) :: a, b
      type(vec2) :: c
      c%x = a%x + b%x;  c%y = a%y + b%y
   end function vec2_add

   pure function vec2_scale(s, v) result(w)
      real, intent(in) :: s
      type(vec2), intent(in) :: v
      type(vec2) :: w
      w%x = s * v%x;  w%y = s * v%y
   end function vec2_scale
end module vec2_mod
```

You can overload `+ - * / == /= < <= > >=`, user-named operators (`.dot.`), and `assignment(=)`. Add a second overload for reversed argument order if needed.

---

## 7. Object-Oriented Fortran (2003+)

Fortran 2003 added full object orientation: derived types with methods, single inheritance, polymorphism, abstract types, and finalisers.

### 7.1 Types with type-bound procedures

```fortran
module shapes
   implicit none
   type :: shape_t
      real :: x = 0.0, y = 0.0
   contains
      procedure :: translate => shape_translate
      procedure :: area      => shape_area
   end type shape_t

   type, extends(shape_t) :: circle_t
      real :: radius = 1.0
   contains
      procedure :: area => circle_area        ! override
   end type circle_t
contains
   subroutine shape_translate(self, dx, dy)
      class(shape_t), intent(inout) :: self
      real, intent(in) :: dx, dy
      self%x = self%x + dx;  self%y = self%y + dy
   end subroutine shape_translate

   function shape_area(self) result(a)
      class(shape_t), intent(in) :: self
      real :: a
      a = 0.0
   end function shape_area

   function circle_area(self) result(a)
      class(circle_t), intent(in) :: self
      real :: a
      a = acos(-1.0) * self%radius**2
   end function circle_area
end module shapes
```

### 7.2 `extends`, `class`, polymorphism

`type, extends(parent_t)` creates a subtype inheriting all components and methods; methods can be overridden. A variable declared `class(parent_t)` can hold any value whose dynamic type is `parent_t` or any extension — this is how virtual dispatch works:

```fortran
program use_shapes
   use shapes
   implicit none
   class(shape_t), allocatable :: s
   allocate(circle_t :: s)                    ! polymorphic allocate
   select type (s)
   type is (circle_t)
      s%radius = 2.5
   end select
   print *, 's%area() =', s%area()            ! dispatches to circle_area ~ 19.63
   call s%translate(1.0, 2.0)                 ! inherited from shape_t
end program use_shapes
```

`select type` is the type-safe downcast construct. `type is` matches exactly; `class is` matches the type or any extension; `class default` is the fallback.

### 7.3 `deferred` — abstract methods

Deferred type-bound procedures define an interface without an implementation. The containing type must be `abstract`:

```fortran
module animals
   implicit none
   type, abstract :: animal_t
      character(len=32) :: name = ''
   contains
      procedure(speak_iface), deferred :: speak
   end type animal_t

   abstract interface
      subroutine speak_iface(self)
         import :: animal_t
         class(animal_t), intent(in) :: self
      end subroutine speak_iface
   end interface
end module animals

module dogs
   use animals
   implicit none
   type, extends(animal_t) :: dog_t
   contains
      procedure :: speak => dog_speak
   end type dog_t
contains
   subroutine dog_speak(self)
      class(dog_t), intent(in) :: self
      print *, trim(self%name), ': woof'
   end subroutine dog_speak
end module dogs
```

OOP in Fortran is complete but never as fluid as in Smalltalk-descended languages. It is there when you need it; the rest of the time you lean on modules and generic interfaces.

---

## 8. Interoperability with C

### 8.1 `iso_c_binding`

Fortran 2003 added a standard intrinsic module `iso_c_binding` with C-compatible kinds and pointer types: `c_int`, `c_short`, `c_long`, `c_signed_char`, `c_float`, `c_double`, `c_long_double`, `c_bool`, `c_char`, `c_ptr`, `c_funptr`, `c_null_ptr`, plus helpers `c_loc`, `c_f_pointer`, `c_associated`.

### 8.2 `bind(c)` — C-callable procedures

The `bind(c)` attribute makes a Fortran procedure follow the C calling convention and gives it a specific C-visible name:

```fortran
module interop_demo
   use iso_c_binding
   implicit none
contains
   function add_ints(a, b) bind(c, name='add_ints') result(c_sum)
      integer(c_int), value, intent(in) :: a, b
      integer(c_int) :: c_sum
      c_sum = a + b
   end function add_ints

   subroutine scale_array(n, x, factor) bind(c, name='scale_array')
      integer(c_int), value, intent(in)    :: n
      real(c_double),        intent(inout) :: x(n)
      real(c_double), value, intent(in)    :: factor
      x = x * factor
   end subroutine scale_array
end module interop_demo
```

Scalar `intent(in)` arguments use the `value` attribute (Fortran normally passes by reference). From C:

```c
int  add_ints(int a, int b);
void scale_array(int n, double *x, double factor);
```

### 8.3 Calling C from Fortran

Declare the C function with a Fortran `interface` and `bind(c)`:

```fortran
program call_c
   use iso_c_binding
   implicit none
   interface
      function c_strlen(s) bind(c, name='strlen') result(n)
         use iso_c_binding
         character(kind=c_char), intent(in) :: s(*)
         integer(c_size_t) :: n
      end function c_strlen
      subroutine c_free(p) bind(c, name='free')
         use iso_c_binding
         type(c_ptr), value :: p
      end subroutine c_free
   end interface
   character(len=1, kind=c_char), target :: cs(14) = &
      [ 'h','e','l','l','o',',',' ','w','o','r','l','d', c_null_char, ' ' ]
   print *, 'strlen =', c_strlen(cs)
end program call_c
```

C strings are null-terminated arrays of `c_char`; Fortran strings are not. You usually copy between the two using `trim`, `//` concatenation, and `c_null_char`.

### 8.4 Pointers across the boundary

`c_ptr` holds an opaque C pointer. Use `c_loc(x)` to get a C pointer to a Fortran variable, and `c_f_pointer(cp, fp, shape)` to convert a C pointer into a Fortran pointer:

```fortran
real(c_double), allocatable, target :: buf(:)
type(c_ptr) :: cp
real(c_double), pointer :: fp(:)
allocate(buf(1000))
cp = c_loc(buf)                      ! C pointer into Fortran-owned memory
call c_f_pointer(cp, fp, [1000])     ! recover as Fortran pointer
fp = 0.0_c_double                    ! fp and buf alias
```

---

## 9. Parallel Fortran

Fortran has three complementary parallel models: **OpenMP** directives, **coarrays**, and **`do concurrent`**.

### 9.1 OpenMP

OpenMP is a set of directives embedded as Fortran comments (`!$omp`), enabled with `-fopenmp`:

```fortran
program omp_sum
   use omp_lib
   implicit none
   integer, parameter :: n = 10000000
   real :: a(n), total
   integer :: i
   !$omp parallel do
   do i = 1, n
      a(i) = sin(real(i) * 0.001)
   end do
   !$omp end parallel do
   total = 0.0
   !$omp parallel do reduction(+:total)
   do i = 1, n
      total = total + a(i)
   end do
   !$omp end parallel do
   print *, 'sum =', total, '  threads =', omp_get_max_threads()
end program omp_sum
```

OpenMP supports `parallel`, `sections`, `single`, `critical`, `barrier`, `reduction`, `private`, `shared`, and task constructs. It is outside the language proper but the dominant shared-memory tool in Fortran.

### 9.2 Coarrays

Fortran 2008 added **coarrays**: a variable can have a codimension representing "which image" (process / rank) the copy lives on. Each image runs the same program (SPMD); communication is just indexing into another image's copy:

```fortran
program coarray_hello
   implicit none
   integer :: me, np
   real    :: x[*]              ! scalar coarray, present on every image
   real    :: y(100)[*]         ! 100-element coarray
   me = this_image();  np = num_images()
   x = real(me)
   sync all                     ! barrier
   if (me == 1) then
      print *, 'image 1: x on image 2 =', x[2]
      print *, 'total images =', np
   end if
end program coarray_hello
```

`[*]` means "exists once per image". `x[k]` references image `k`'s copy. Operations across images require explicit synchronisation (`sync all`, `sync images(list)`, `sync memory`).

A tiny halo exchange in a 1D stencil:

```fortran
program stencil
   implicit none
   integer, parameter :: n = 1000
   real :: u(0:n+1)[*]
   integer :: me, np, left, right, iter
   me = this_image();  np = num_images()
   left  = merge(me - 1, np,  me > 1)
   right = merge(me + 1, 1,   me < np)
   u = 0.0
   if (me == 1) u(1) = 1.0
   do iter = 1, 100
      sync all
      u(0)   = u(n)[left]                        ! fetch from left neighbour
      u(n+1) = u(1)[right]                       ! fetch from right neighbour
      u(1:n) = 0.25 * (u(0:n-1) + 2*u(1:n) + u(2:n+1))
   end do
end program stencil
```

Compile with `-fcoarray=lib` (gfortran + libcaf_mpi) or natively on Intel `ifx`. Run via `cafrun -np 4 ./stencil`.

### 9.3 `num_images()` / `this_image()`

`num_images()` is the total image count; `this_image()` is the calling image's 1-based index. Fortran 2018 added **teams** for hierarchical parallelism and collective subroutines:

```fortran
real :: local_total, global_total
local_total = sum(my_data)
global_total = local_total
call co_sum(global_total, result_image=1)
if (this_image() == 1) print *, 'global total =', global_total
```

Other collectives: `co_max`, `co_min`, `co_broadcast`, `co_reduce`.

### 9.4 `do concurrent` revisited

Covered in 5.3. The lowest-friction way to mark a loop parallel-friendly: no new syntax, no directives, compiler decides how to parallelise. Modern compilers can map `do concurrent` to OpenMP, OpenACC, or GPU offload.

---

## 10. Input / Output

Fortran's I/O is statement-based, not library-based. Core statements: `read`, `write`, `print`, `open`, `close`, `rewind`, `backspace`, `inquire`, `endfile`.

### 10.1 `print`, `read`, `write`

```fortran
print *, 'hello', 42, 3.14              ! * = list-directed format
integer :: n
real    :: x
read *, n, x                            ! list-directed from stdin
write(*, *)            'to stdout'      ! default unit, default format
write(6, '(A, I5)')    'n = ', n        ! unit 6 = stdout (historically)
write(unit=u, fmt='(A)') line           ! keyword arguments
```

Modern code uses the named constants from `iso_fortran_env`:

```fortran
use iso_fortran_env, only: input_unit, output_unit, error_unit
write(error_unit, *) 'oh no'
```

### 10.2 `open`, `close`, `rewind`, `backspace`

```fortran
integer :: u, ios
character(len=256) :: msg
open(newunit=u, file='data.txt', status='old', action='read', &
     iostat=ios, iomsg=msg)
if (ios /= 0) then
   write(error_unit, *) 'open failed: ', trim(msg);  stop 1
end if
! ... read loop ...
close(u)
```

`newunit=u` (Fortran 2008+) allocates an unused unit number automatically, avoiding hard-coded clashes with library code. Common `open` specifiers: `file=`, `status='old'|'new'|'replace'|'scratch'|'unknown'`, `action='read'|'write'|'readwrite'`, `form='formatted'|'unformatted'`, `access='sequential'|'direct'|'stream'` (stream = C byte stream, Fortran 2003), `recl=`, `iostat=`, `iomsg=`. `rewind(u)`, `backspace(u)`, `endfile(u)`, `inquire(...)` round out the unit operations.

### 10.3 Format specifiers

Fortran format strings predate printf by a decade. Common edit descriptors:

| Code     | Meaning                                           |
|----------|---------------------------------------------------|
| `I5`     | integer, field width 5                            |
| `I5.3`   | integer, width 5, min 3 digits (zero-pad)         |
| `F10.4`  | real, width 10, 4 decimal places                  |
| `E12.5`  | real, scientific notation                         |
| `ES12.5` | "scientific" — mantissa in [1, 10)                |
| `EN12.5` | engineering — exponent multiple of 3              |
| `G12.5`  | general (F or E, whichever fits)                  |
| `A`/`A20`| character, full length / width 20                 |
| `L1`     | logical, T or F                                   |
| `X`/`2X` | one/two spaces                                    |
| `/`      | newline                                           |
| `'text'` | literal text                                      |
| `2F8.3`  | repeat count: two F8.3 fields                     |
| `(...)`  | grouping, can be repeated                         |

```fortran
integer :: i = 42, j = 7
real    :: x = 3.14159, y = 2.71828
write(*, '(I5)')             i                ! "   42"
write(*, '(I5.3)')           j                ! "  007"
write(*, '(F10.4)')          x                ! "    3.1416"
write(*, '(ES12.5)')         x                ! " 3.14159E+00"
write(*, '(A, I5, A, F8.3)') 'i=', i, '  x=', x
write(*, '(3F10.3)')         x, y, x+y
write(*, '(A,/,A)')          'line one', 'line two'
```

Formats can be stored as character parameters or statement labels:

```fortran
character(len=*), parameter :: fmt1 = '(A, 3(1X, F10.4))'
write(*, fmt1) 'coords:', 1.0, 2.0, 3.0
write(*, 100) 'coords:', 1.0, 2.0, 3.0        ! legacy FORMAT statement
100 format (A, 3(1X, F10.4))
```

### 10.4 Namelist I/O

Namelists are Fortran's built-in config-file mechanism. Declare a group with `namelist`; `read`/`write` handle serialisation:

```fortran
program config_demo
   implicit none
   integer :: nsteps = 100
   real    :: dt = 0.01
   real    :: gravity(3) = [0.0, 0.0, -9.81]
   logical :: verbose = .false.
   namelist /sim/ nsteps, dt, gravity, verbose
   integer :: u, ios
   open(newunit=u, file='config.nml', status='old', action='read')
   read(u, nml=sim, iostat=ios)
   close(u)
   write(*, nml=sim)                         ! dump to stdout
end program config_demo
```

A matching `config.nml`:

```
&sim
   nsteps = 500,
   dt = 0.005,
   gravity = 0.0, 0.0, -9.81,
   verbose = .true.
/
```

Namelist I/O is delightfully tolerant: missing variables keep their defaults, order is irrelevant, comments are usually ignored. For scientific codes with dozens of knobs, namelists beat hand-rolled parsers every time.

### 10.5 Unformatted and stream I/O

For binary data, use `form='unformatted'` (record-based) or `access='stream'` (byte-based, Fortran 2003):

```fortran
integer :: u
real :: data(1000)
open(newunit=u, file='data.bin', access='stream', form='unformatted', &
     status='replace', action='write')
write(u) data
close(u)
open(newunit=u, file='data.bin', access='stream', form='unformatted', &
     status='old', action='read')
read(u) data
close(u)
```

Stream I/O is the right choice for interop with other languages: no hidden record markers, just the bytes you asked for.

---

## 11. Putting It All Together

A complete 1D heat-equation solver using modules, derived kinds, `do concurrent`, assumed-shape arrays, explicit intents, and modern I/O:

```fortran
module heat
   use iso_fortran_env, only: real64
   implicit none
   integer, parameter :: dp = real64
contains
   subroutine step(u, alpha, dt, dx)
      real(dp), intent(inout) :: u(:)
      real(dp), intent(in)    :: alpha, dt, dx
      real(dp) :: r, u_new(size(u))
      integer  :: i
      r = alpha * dt / dx**2
      u_new = u
      do concurrent (i = 2:size(u)-1)
         u_new(i) = u(i) + r * (u(i-1) - 2.0_dp*u(i) + u(i+1))
      end do
      u = u_new
   end subroutine step
end module heat

program heat_1d
   use heat
   implicit none
   integer,  parameter :: n = 100
   real(dp), parameter :: alpha = 1.0e-4_dp
   real(dp), parameter :: dx = 1.0_dp / real(n-1, dp)
   real(dp), parameter :: dt = 0.4_dp * dx**2 / alpha
   real(dp) :: u(n)
   integer  :: it
   u = 0.0_dp;  u(n/2) = 100.0_dp             ! initial spike
   do it = 1, 500
      call step(u, alpha, dt, dx)
   end do
   print '(A,ES14.6)', 'max after 500 steps: ', maxval(u)
end program heat_1d
```

Compiles on gfortran, ifx, nvfortran, and NAG without modification. The compiler is free to vectorise or parallelise the inner loop because the semantics are explicit.

---

## 12. Further Reading

- **The Fortran 2023 standard** (ISO/IEC 1539-1:2023) — the definitive source.
- **Modern Fortran Explained**, Metcalf, Reid, Cohen — the canonical textbook, updated per standard.
- **fortran-lang.org** — community hub, package manager (fpm), Discourse forum, stdlib project.
- **LAPACK, SciFortran, stdlib** — the major open-source libraries to read for real-world idiomatic Fortran.

Fortran's reputation as a legacy language is misleading. Modern Fortran is a living, evolving standard — Fortran 2023 is less than two years old at time of writing — and remains the language of choice where numerical performance, array semantics, and compiler optimisation matter most. Weather forecasts, climate models, nuclear reactor simulations, aircraft designs, and much physics research run on Fortran written in the last ten years. If your problem is numerical and large, Fortran deserves a serious look.
