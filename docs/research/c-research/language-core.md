# C Language Core: Types, Memory, and Idioms

A deep reference to C's core language features, type system, memory model, and idioms. Covers the standards from C89 through C23.

---

## 1. The Type System

C's type system is deliberately thin: it describes how many bits a value occupies and how the CPU should interpret them. The standard deliberately leaves many sizes implementation-defined so that C can target everything from 8-bit microcontrollers to 64-bit supercomputers.

### 1.1 Primitive integer types

| Type | Minimum range (C standard) | Typical 64-bit Linux |
|---|---|---|
| `char` | at least 8 bits | 8 bits |
| `short` | at least 16 bits | 16 bits |
| `int` | at least 16 bits | 32 bits |
| `long` | at least 32 bits | 64 bits (LP64) / 32 bits (Windows LLP64) |
| `long long` (C99) | at least 64 bits | 64 bits |
| `_Bool` (C99) | 0 or 1 | 8 bits |

The standard only guarantees *minimum* ranges. `sizeof(char) == 1` always (it's the unit of measurement), but a `char` could in principle be more than 8 bits on exotic platforms (DSPs historically used 16- or 32-bit `char`).

Signedness of plain `char` is **implementation-defined**. It may be `signed char` or `unsigned char`. Use explicit `signed char` or `unsigned char` when you care about the representation (e.g., when working with bytes).

```c
char c = 'A';            // signedness unspecified
signed char sc = -1;     // definitely signed
unsigned char uc = 255;  // definitely unsigned, 0..UCHAR_MAX
```

### 1.2 Fixed-width integers (`<stdint.h>`, C99)

When you need predictable sizes across platforms:

```c
#include <stdint.h>

int8_t   a;   // exactly 8 bits, signed
uint16_t b;   // exactly 16 bits, unsigned
int32_t  c;   // exactly 32 bits, signed
uint64_t d;   // exactly 64 bits, unsigned

int_least16_t e;  // at least 16 bits, smallest such type
int_fast32_t  f;  // at least 32 bits, "fastest" such type
intmax_t      g;  // largest available integer
intptr_t      h;  // integer wide enough to hold a pointer
```

The `exact` variants (`int8_t`, etc.) are only defined when the platform provides such a type with no padding bits. Portable code for embedded systems sometimes uses `int_least8_t` instead.

### 1.3 Floating-point

```c
float       f;   // IEEE 754 single (usually 32 bits)
double      d;   // IEEE 754 double (usually 64 bits)
long double ld;  // platform-specific: 80-bit x87, 128-bit IEEE quad, or just 64
```

C99 added `_Complex` and `_Imaginary` types (with convenience macros in `<complex.h>`):

```c
#include <complex.h>
double complex z = 1.0 + 2.0 * I;
double re = creal(z), im = cimag(z);
```

### 1.4 Integer promotion

When a `char` or `short` appears in an expression, it is **promoted** to `int` (or `unsigned int` if `int` can't represent all its values). This is the source of many surprises:

```c
unsigned char a = 200, b = 200;
int sum = a + b;  // 400, NOT 144 (no wraparound because both promoted to int)

unsigned char x = 255;
if (x + 1 == 256) { /* true */ }  // x is promoted to int before +
```

### 1.5 Usual arithmetic conversions

When operands of different types meet in a binary expression, C picks a "common type" via the *usual arithmetic conversions*:

1. If either operand is `long double`, convert the other to `long double`.
2. Otherwise if either is `double`, convert to `double`.
3. Otherwise if either is `float`, convert to `float`.
4. Otherwise apply integer promotions, then:
   - If both are same signedness, convert to the larger-rank type.
   - If unsigned rank ≥ signed rank, convert signed to unsigned.
   - Otherwise if signed type can represent all unsigned values, convert unsigned to signed.
   - Otherwise convert both to the unsigned version of the signed type.

Classic trap:

```c
int i = -1;
unsigned u = 1;
if (i < u) { /* not taken! -1 is converted to UINT_MAX */ }
```

### 1.6 `sizeof` and `size_t`

`sizeof` yields a value of type `size_t` (unsigned), defined in `<stddef.h>`. Always use `size_t` for sizes and array indices:

```c
size_t n = sizeof(arr) / sizeof(arr[0]);
for (size_t i = 0; i < n; i++) { /* ... */ }
```

Mixing signed and unsigned loop counters is a well-known foot-gun; `size_t` makes `i >= 0` always true, so `for (size_t i = n - 1; i >= 0; i--)` is an infinite loop.

---

## 2. Pointers

Pointers are the fundamental abstraction of C: a pointer is the address of an object in memory, annotated with the type of that object so arithmetic and dereference can work.

### 2.1 Basics

```c
int x = 42;
int *p = &x;     // & takes the address of x
int y = *p;      // * dereferences p, yielding the pointed-to value
*p = 100;        // writes through p, x is now 100
```

The declaration `int *p` is parsed as "`*p` is an `int`", which is why the `*` clings to the variable, not the type, and why `int* a, b;` declares `a` as `int*` and `b` as `int` (a style disaster).

### 2.2 Pointer arithmetic

Arithmetic on pointers is scaled by the size of the pointed-to type:

```c
int a[5] = {10, 20, 30, 40, 50};
int *p = a;          // points to a[0]
p++;                 // now points to a[1] (advanced by sizeof(int) bytes)
int diff = &a[4] - &a[0];  // 4, not 16
```

Pointer arithmetic is only defined within a single array (including one-past-the-end). Subtracting pointers into different objects is undefined behavior.

### 2.3 Array-pointer duality

In most contexts, an array name **decays** into a pointer to its first element. This is why `a[i]` and `*(a + i)` are equivalent — and why `i[a]` also works (addition commutes):

```c
int a[10];
int x = a[3];    // equivalent to *(a + 3)
int y = 3[a];    // also valid, equivalent to *(3 + a)
```

The decay is subtle but important: `sizeof(a)` inside the declaring scope gives the whole array size, but passing `a` to a function and taking `sizeof` there gives the pointer size.

```c
void f(int a[10]) {
    // sizeof(a) is sizeof(int *), NOT 10 * sizeof(int)
}
```

### 2.4 `NULL` and `void *`

`NULL` is a null pointer constant, defined in several headers (`<stddef.h>`, `<stdio.h>`, etc.). It is guaranteed to compare unequal to a pointer to any object. Historically `#define NULL ((void *)0)`, in C23 this becomes `nullptr_t` (see §12).

`void *` is a "generic" pointer that can hold any object pointer. It cannot be dereferenced directly and cannot undergo pointer arithmetic (in standard C; GCC extension permits it as byte arithmetic):

```c
void *mem = malloc(1024);
int *ints = mem;       // implicit conversion, fine in C
char *bytes = mem;
```

### 2.5 Pointer to pointer

Useful for output parameters, 2D-ish structures, and modifying pointers in callees:

```c
void alloc_int(int **out) {
    *out = malloc(sizeof(int));
    **out = 42;
}

int *p;
alloc_int(&p);  // p now points to a heap int holding 42
```

### 2.6 Function pointers

Functions can be addressed, stored, and called indirectly:

```c
int add(int a, int b) { return a + b; }

int (*op)(int, int) = add;  // parens are required; without them it's a function returning int*
int result = op(2, 3);      // 5
int also   = (*op)(2, 3);   // equivalent, older style
```

`typedef` saves sanity:

```c
typedef int (*binary_op_t)(int, int);
binary_op_t op = add;
```

### 2.7 Strict aliasing

The **strict aliasing rule** says: an object of type `T` may only be accessed through an lvalue of a compatible type, a `char`-variant, or a few other exceptions. Violating it is undefined behavior and compilers *will* optimize aggressively on that assumption.

```c
// UB: accessing an int through a float lvalue
int i = 0x42280000;
float f = *(float *)&i;   // DON'T DO THIS
```

The safe alternatives:

1. `memcpy` (compilers recognize it and elide the copy):
   ```c
   float f;
   memcpy(&f, &i, sizeof f);
   ```
2. A `union` (reading from a different member than was written is implementation-defined in C89, permitted "type punning" in C99+):
   ```c
   union { int i; float f; } u = { .i = 0x42280000 };
   float f = u.f;
   ```
3. Access through `char *` (always allowed).

### 2.8 `restrict` (C99)

`restrict` is a promise from the programmer to the compiler: for the lifetime of this pointer, the object it points to will only be accessed through this pointer (or pointers derived from it). This enables vectorization and reordering:

```c
void copy(int *restrict dst, const int *restrict src, size_t n) {
    for (size_t i = 0; i < n; i++) dst[i] = src[i];
}
```

Without `restrict`, the compiler has to assume `dst` and `src` might overlap. With it, it can safely unroll and SIMD-ify. `memcpy` is declared with `restrict`; `memmove` is not.

---

## 3. Arrays and Strings

### 3.1 Array declaration

```c
int a[10];                      // uninitialized
int b[5] = {1, 2, 3, 4, 5};     // fully initialized
int c[10] = {1, 2};             // rest zero-initialized
int d[] = {1, 2, 3};            // size deduced: 3
int e[10] = {0};                // idiom: zero-fill
```

Arrays in C have a size that is part of their type. `int[5]` and `int[6]` are distinct types.

### 3.2 Multi-dimensional arrays

C arrays are row-major, contiguous. `int a[3][4]` is 12 ints laid out as `a[0][0], a[0][1], ..., a[0][3], a[1][0], ...`.

```c
int grid[3][4] = {
    {1, 2, 3, 4},
    {5, 6, 7, 8},
    {9,10,11,12},
};
int x = grid[1][2];  // 7
```

Passing multi-dim arrays to functions requires all dimensions except the first:

```c
void print(int g[][4], int rows) { /* ... */ }
```

### 3.3 VLAs — Variable-Length Arrays (C99, optional in C11)

```c
void f(size_t n) {
    int buf[n];              // allocated on the stack at runtime
    int matrix[n][n];        // yes, multi-dim VLAs too
}
```

VLAs were mandatory in C99 but made **optional** in C11 (`__STDC_NO_VLA__` indicates absence). MSVC never implemented them. Stack overflow risk is real for large `n`. Most modern codebases avoid VLAs in favor of `malloc`.

C99 also introduced the `static` and type-qualifier syntax in parameter declarations:

```c
void f(int a[static 10]);  // caller guarantees a has at least 10 elements
```

### 3.4 Strings

A C "string" is a convention, not a type: it's a contiguous sequence of `char` terminated by `'\0'`. Every standard library string function assumes the terminator.

```c
char s[] = "hello";        // sizeof(s) == 6 (5 chars + '\0')
char *p  = "hello";        // pointer to a read-only string literal
```

Writing through `p` is undefined behavior (string literals live in read-only memory on modern systems). Declare string literals with `const char *` to let the compiler catch this.

### 3.5 `<string.h>` essentials

```c
size_t strlen(const char *s);
char  *strcpy(char *dst, const char *src);                   // unsafe
char  *strncpy(char *dst, const char *src, size_t n);        // not what you think
int    strcmp(const char *a, const char *b);
int    strncmp(const char *a, const char *b, size_t n);
char  *strcat(char *dst, const char *src);                   // unsafe
void  *memcpy(void *dst, const void *src, size_t n);
void  *memmove(void *dst, const void *src, size_t n);        // handles overlap
void  *memset(void *dst, int c, size_t n);
```

### 3.6 The `strncpy` debate

`strncpy` is **not a safe `strcpy`**. Its original purpose was fixed-width fields in UNIX directory entries. Its behavior:

- Copies *up to* `n` bytes from `src` to `dst`.
- If `src` is shorter than `n`, the remainder of `dst` is **zero-padded**.
- If `src` is `n` or longer, `dst` is **not null-terminated**.

```c
char dst[10];
strncpy(dst, "this is too long", sizeof dst);
// dst == "this is to" -- no null terminator! strlen(dst) is UB
```

Real safer copies:

- `snprintf(dst, sizeof dst, "%s", src)` — always null-terminates, portable.
- `strlcpy` (BSD, not standard C, but in `<string.h>` on many systems; added to POSIX.1-2024).
- `strcpy_s` (C11 Annex K, but Annex K is essentially dead — only Microsoft implements it, and the design is widely criticized).

Do the length check yourself or use a managed string library.

---

## 4. Structs, Unions, Enums

### 4.1 Structs

```c
struct point {
    double x;
    double y;
};

struct point p1 = {1.0, 2.0};
struct point p2 = {.y = 3.0, .x = 4.0};  // designated init, C99

typedef struct {
    int r, g, b;
} rgb_t;
rgb_t color = {255, 128, 0};
```

Access with `.` on a value, `->` on a pointer: `p1.x`, `pp->x`.

### 4.2 Padding and alignment

The compiler inserts padding between members so each member meets its alignment requirement. Members are laid out in declaration order (guaranteed by the standard); the compiler may **not** reorder them.

```c
struct bad {
    char a;     // 1 byte, then 7 bytes padding
    double b;   // 8 bytes
    char c;     // 1 byte, then 7 bytes trailing padding
};              // sizeof == 24 on typical 64-bit

struct good {
    double b;
    char a;
    char c;     // 6 bytes trailing padding
};              // sizeof == 16
```

Order members largest-to-smallest to minimize padding. `_Alignof(T)` / `alignof` (C11, `<stdalign.h>`) queries alignment. `_Alignas(N)` / `alignas` forces it.

### 4.3 Bit fields

```c
struct flags {
    unsigned ready   : 1;
    unsigned error   : 1;
    unsigned kind    : 3;
    unsigned         : 0;  // force alignment to next unit
    unsigned version : 8;
};
```

Bit field layout is largely implementation-defined (order of bits within a unit, whether they cross unit boundaries, padding). Avoid for wire formats; use explicit shifts and masks.

### 4.4 Unions

All members share storage, starting at the same address. `sizeof(union)` is the size of the largest member (plus any alignment padding).

```c
union value {
    int    as_int;
    float  as_float;
    char   as_bytes[4];
};

union value v;
v.as_int = 0x42280000;
// Reading v.as_float is implementation-defined (type punning), but widely supported.
```

Tagged unions are the classic discriminated-union idiom:

```c
enum tag { TAG_INT, TAG_STR };
struct variant {
    enum tag tag;
    union {
        int   i;
        char *s;
    };  // anonymous union, C11
};

struct variant v = {.tag = TAG_INT, .i = 42};
if (v.tag == TAG_INT) printf("%d\n", v.i);
```

### 4.5 Anonymous structs/unions (C11)

An anonymous member has no name; its fields appear as if they were members of the enclosing type. Great for tagged unions and for flattening nested fields.

### 4.6 Designated initializers (C99)

```c
struct point p = {.x = 1.0, .y = 2.0};
int arr[10] = {[0] = 1, [9] = 10};  // others zero
struct { int a, b, c; } s = {.a = 1, .c = 3};  // b is zero
```

### 4.7 Compound literals (C99)

An unnamed object of a given type, created inline. Has automatic storage duration if it appears at block scope.

```c
// Pass a struct literal directly:
draw_line((struct point){0, 0}, (struct point){10, 10});

// Initialize a pointer to an array:
int *a = (int[]){1, 2, 3, 4};
```

### 4.8 Enums

```c
enum color { RED, GREEN, BLUE };            // 0, 1, 2
enum flags { F_A = 1, F_B = 2, F_C = 4 };
```

Until C23, the underlying type of an enum was always `int` (or a type compatible with some integer large enough to hold all values). C23 permits specifying an explicit underlying type:

```c
enum color : unsigned char { RED, GREEN, BLUE };  // C23
```

Enum **constants** are always `int` (even in enums with non-int underlying type in C23 you get explicit rules). Enumeration **values** assigned to variables of the enum type carry that type.

---

## 5. Memory Management

C distinguishes several **storage durations**: how long an object lives.

### 5.1 Storage durations

| Duration | How declared | Lifetime |
|---|---|---|
| **static** | file-scope or `static` keyword | entire program |
| **automatic** | local variables | block entry to block exit |
| **allocated** | `malloc` et al. | explicit `free` |
| **thread** (C11) | `_Thread_local` / `thread_local` | lifetime of the thread |

```c
static int file_counter;          // static storage

void f(void) {
    int x;                         // automatic
    static int call_count;         // static, but local linkage
    int *heap = malloc(sizeof *heap);  // allocated
    _Thread_local int tls;         // thread (C11)
}
```

### 5.2 The heap API

```c
#include <stdlib.h>

void *malloc(size_t n);                    // n bytes, uninitialized
void *calloc(size_t nmemb, size_t size);   // zero-initialized, overflow-checked
void *realloc(void *p, size_t new_size);   // resize; may move
void  free(void *p);
```

Idioms:

```c
// Type-safe allocation
int *p = malloc(sizeof *p);        // use *p, not int, so it tracks type changes
int *arr = malloc(n * sizeof *arr);

// realloc safely: never assign in place
int *tmp = realloc(arr, new_n * sizeof *arr);
if (!tmp) {
    free(arr);  // original still valid; now free it
    return -1;
}
arr = tmp;

// free(NULL) is legal and does nothing
free(NULL);
```

### 5.3 The classic bugs

**Use-after-free:**
```c
int *p = malloc(sizeof *p);
free(p);
*p = 42;  // UB. Any use including reading is UB, even printing the pointer.
```

**Double free:**
```c
free(p);
free(p);  // UB
```
Defensive: `free(p); p = NULL;` — but this only helps if there's a single pointer.

**Memory leak:**
```c
char *buf = malloc(1024);
if (error) return -1;  // leaked buf
```
Idiomatic solution: single-exit via `goto cleanup`. (See §7.4.)

**Reading uninitialized memory:**
```c
int *p = malloc(sizeof *p);
printf("%d\n", *p);  // UB. Use calloc or initialize explicitly.
```

### 5.4 Stack vs heap tradeoffs

- **Stack** (automatic): free, fast, LIFO, size-limited (~1–8 MB per thread), freed automatically.
- **Heap** (allocated): lifetime flexible, arbitrary sizes, costs a syscall sometimes, manual lifetime management.

Prefer the stack when size is small and lifetime is the function. Use the heap when objects outlive the function or are too large for the stack.

---

## 6. The Preprocessor

The C preprocessor runs before the compiler sees the source. It's a separate, textual language.

### 6.1 `#include`

```c
#include <stdio.h>       // system headers
#include "myheader.h"    // user headers (searches local dirs first)
```

### 6.2 Macros

Object-like:

```c
#define PI          3.14159265358979
#define MAX_BUF     1024
```

Function-like:

```c
#define SQUARE(x)   ((x) * (x))
#define MAX(a, b)   ((a) > (b) ? (a) : (b))
```

Always parenthesize arguments **and** the whole expansion. Otherwise:

```c
#define BAD(x) x * x
int y = BAD(2 + 3);   // expands to 2 + 3 * 2 + 3 == 11, not 25
```

Multi-statement macros use the `do { } while(0)` idiom:

```c
#define LOG(msg) do { fprintf(stderr, "[LOG] %s\n", msg); } while (0)
```

### 6.3 Conditional compilation

```c
#ifdef DEBUG
    puts("debug build");
#endif

#if defined(__linux__) || defined(__APPLE__)
    // POSIX code
#elif defined(_WIN32)
    // Windows code
#else
    #error "Unsupported platform"
#endif
```

### 6.4 Stringification and token pasting

```c
#define STR(x)   #x                 // stringify
#define CAT(a,b) a ## b             // paste tokens

const char *name = STR(hello);      // "hello"
int CAT(foo, bar) = 0;              // int foobar = 0;

#define STR2(x)  STR(x)             // double-expand to stringify a macro value
#define VER 42
const char *v = STR2(VER);          // "42"; STR(VER) would be "VER"
```

### 6.5 Predefined macros

```c
__FILE__     // current source filename
__LINE__     // current line number
__DATE__     // compilation date
__TIME__     // compilation time
__func__     // current function name (C99, technically not a macro but a const char[])
__STDC_VERSION__  // e.g., 199901L, 201112L, 201710L, 202311L
```

### 6.6 Header guards

Every header needs to be safe under multiple inclusion:

```c
#ifndef MYHEADER_H
#define MYHEADER_H
// declarations
#endif
```

Or the non-standard but widely supported `#pragma once`.

### 6.7 Variadic macros (C99)

```c
#define LOG(fmt, ...)  fprintf(stderr, "[%s:%d] " fmt "\n", __FILE__, __LINE__, __VA_ARGS__)
LOG("x = %d", 42);
```

C99 required at least one argument for `...`. C23 (and GCC/Clang extension) allows zero, with `__VA_OPT__` to handle the trailing comma.

---

## 7. Control Flow

### 7.1 `if / else`

```c
if (x > 0) { /* ... */ }
else if (x < 0) { /* ... */ }
else { /* ... */ }
```

Always use braces, even for single statements — "goto fail" (Apple's 2014 TLS bug) is the cautionary tale.

### 7.2 `switch`

```c
switch (op) {
    case '+': r = a + b; break;
    case '-': r = a - b; break;
    case '*':
    case '/':
        r = do_muldiv(a, b, op);
        break;
    default:
        return -1;
}
```

Cases **fall through** by default unless you `break`. Intentional fall-through was historically marked with a `/* FALLTHROUGH */` comment; C23 gives us `[[fallthrough]]`.

Case labels must be integer constant expressions. No ranges (except as GCC extension). No strings, no floats.

### 7.3 Loops

```c
while (cond) { /* ... */ }
do { /* ... */ } while (cond);         // guaranteed one iteration
for (int i = 0; i < n; i++) { /* ... */ }  // C99 allows declaration in init
```

### 7.4 `goto` — the legitimate use

`goto` is maligned but has a canonical legitimate use: **centralized error cleanup** in functions with multiple failure points.

```c
int do_work(void) {
    FILE *f = NULL;
    char *buf = NULL;
    int rc = -1;

    f = fopen("data", "r");
    if (!f) goto out;

    buf = malloc(4096);
    if (!buf) goto out;

    if (fread(buf, 1, 4096, f) < 100) goto out;

    // success path
    rc = 0;

out:
    free(buf);
    if (f) fclose(f);
    return rc;
}
```

The alternative — deeply nested `if`s or repeated cleanup — is worse. The Linux kernel uses this pattern pervasively.

### 7.5 `setjmp` / `longjmp`

Non-local goto: save a continuation, jump to it later, possibly from a deeply nested call.

```c
#include <setjmp.h>

jmp_buf env;

void deep(void) {
    longjmp(env, 1);   // jumps back to setjmp, which returns 1
}

int main(void) {
    if (setjmp(env) == 0) {
        deep();          // never returns normally
    } else {
        puts("caught");
    }
}
```

Used for exception-like control flow, pre-emption, and some interpreters. Has many subtle rules: automatic variables not marked `volatile` may have indeterminate values after a `longjmp`; you can't jump back into a function that has already returned.

### 7.6 Signal handling

```c
#include <signal.h>

volatile sig_atomic_t stop = 0;

void handler(int sig) { stop = 1; }

int main(void) {
    signal(SIGINT, handler);
    while (!stop) { /* ... */ }
}
```

Inside a signal handler, you can only call **async-signal-safe** functions (a short list — not `printf`, not `malloc`). You can only modify objects of type `volatile sig_atomic_t` or (C11) lock-free atomics. POSIX's `sigaction` is preferred over `signal`.

---

## 8. Functions

### 8.1 Declaration vs definition

A **declaration** tells the compiler a function exists with a given signature. A **definition** provides the body. Headers contain declarations; .c files contain definitions.

```c
// header
int add(int a, int b);           // declaration (prototype)

// source
int add(int a, int b) {          // definition
    return a + b;
}
```

### 8.2 K&R vs ANSI style

The original K&R style separated parameter types from the parameter list:

```c
int add(a, b)
    int a;
    int b;
{
    return a + b;
}
```

Prototypes were introduced with C89:

```c
int add(int a, int b) { return a + b; }
```

K&R-style functions did **not** prototype their arguments, so calls were not type-checked and defaults (integer promotion, `float`→`double`) applied. Pre-C23, `int f()` in a declaration meant "unspecified arguments" (K&R-compat); in C23 it finally means `int f(void)` like any sensible language.

**Always** write `void` explicitly for no-arg functions (before C23):

```c
int f(void);    // takes no arguments
int g();        // pre-C23: unspecified; C23: same as g(void)
```

### 8.3 `static` functions

A `static` function at file scope has **internal linkage**: it's invisible outside its translation unit. This is C's primary encapsulation mechanism.

```c
static int helper(int x) { return x * 2; }  // private to this .c file
```

### 8.4 `inline` (C99)

A hint that the compiler may inline calls. In C (unlike C++), `inline` interacts with linkage in a way that trips people up:

```c
// header.h
inline int square(int x) { return x * x; }   // inline definition

// one .c file must also provide an external definition:
extern inline int square(int x);
```

Or use `static inline` in the header, which is simpler and what most real code does.

### 8.5 Variable arguments — `<stdarg.h>`

```c
#include <stdarg.h>

int sum(int count, ...) {
    va_list ap;
    va_start(ap, count);       // start after 'count'
    int total = 0;
    for (int i = 0; i < count; i++)
        total += va_arg(ap, int);
    va_end(ap);
    return total;
}

int s = sum(3, 10, 20, 30);   // 60
```

Each `va_arg` call needs the correct type — no runtime type info. `printf` uses the format string to drive it. C23 removes the requirement for a named parameter before `...`, matching C++.

---

## 9. Undefined Behavior

**Undefined behavior (UB)** is the defining characteristic of C — its greatest asset for optimization and its greatest liability for security.

### 9.1 What UB is

The C standard defines three classes of "something went wrong":

- **Implementation-defined**: behavior the implementation must document (e.g., whether `char` is signed).
- **Unspecified**: behavior with multiple legal possibilities, no documentation required (e.g., order of evaluation of function arguments).
- **Undefined**: no requirements at all. The program could do anything — crash, corrupt data, appear to work, launch missiles. The compiler is allowed to assume UB never occurs and optimize accordingly.

### 9.2 The common dragons

1. **Signed integer overflow.** Unsigned wraps modulo 2^N; signed is UB.
   ```c
   int x = INT_MAX;
   x + 1;  // UB. Compiler may assume x + 1 > x always.
   ```

2. **Strict aliasing violation.** Accessing a `float` through an `int *`, etc.

3. **Reading uninitialized memory.**
   ```c
   int x;
   printf("%d\n", x);  // UB
   ```

4. **Out-of-bounds access.** Beyond-one-past-end for pointers, any index outside the allocated region.

5. **Null pointer dereference.** `*(int*)0 = 42;` — including reads used for side effects.

6. **Dividing by zero.** Integer division by zero is UB; float is implementation-defined.

7. **Shift out of range.** `x << -1`, `x << 32` for a 32-bit `x`.

8. **Data races.** Two threads access the same non-atomic object without synchronization and at least one writes.

9. **Multiple modifications between sequence points.** `i = i++ + 1;` — classic.

10. **Violating library function preconditions.** `memcpy` with overlapping regions, `strcpy` where `dst` is too small.

### 9.3 Why UB exists

Allowing UB lets the compiler assume programmers didn't write nonsense, enabling optimizations:

- Loop-induction variable promotion assumes `i + 1` doesn't wrap.
- `memcpy` vs `memmove` exists because the former promises no overlap.
- Strict aliasing lets load/store scheduling ignore `int*`↔`float*` interference.

### 9.4 Why UB is dangerous

Modern optimizers aggressively exploit UB. The canonical example:

```c
void f(int *p) {
    int x = *p;          // (1) assumes p is non-null
    if (!p) return;      // (2) compiler can delete this check!
    // ... use *p ...
}
```

Because `*p` on line 1 would be UB if `p` were null, the compiler concludes that after line 1, `p` is non-null, and deletes the null check on line 2. Attackers use this pattern to bypass security checks.

The **culture of C**: knowing which code constructs are safe, which are UB, and writing code that survives aggressive optimization. Tools like `-fsanitize=undefined`, `-fsanitize=address`, Valgrind, and static analyzers help, but cannot catch everything.

---

## 10. C99 Improvements

C99 was the first major revision after C89/C90 and added a lot of practical features.

- **`//` comments** — finally, after two decades of C++ envy.
- **`inline`** — see §8.4.
- **VLAs** — see §3.3.
- **`<stdint.h>`** — fixed-width integers, see §1.2.
- **`<stdbool.h>`** — `bool`, `true`, `false` as macros for `_Bool`, `1`, `0`.
- **`restrict`** — see §2.8.
- **`long long`** — at least 64 bits.
- **Compound literals** — see §4.7.
- **Designated initializers** — see §4.6.
- **`for (int i = 0; ...)`** — declarations in `for`-init.
- **Variadic macros** — see §6.7.
- **`__func__`** — implicit `const char[]` naming the enclosing function.
- **Mixed declarations and statements** — you can declare variables after statements in a block.
- **Hex float literals** — `0x1.8p3` == 12.0.
- **`snprintf`** — safe formatted output.
- **`_Complex`, `_Imaginary`** — first-class complex numbers.

---

## 11. C11 Improvements

C11 focused on concurrency and type-system polish.

### 11.1 `_Generic`

Type-generic expressions evaluated at compile time:

```c
#define abs_any(x) _Generic((x), \
    int:    abs,                 \
    long:   labs,                \
    float:  fabsf,                \
    double: fabs,                 \
    default: abs)(x)

double d = abs_any(-3.14);   // calls fabs
```

Used under the hood by `tgmath.h`.

### 11.2 Atomics — `<stdatomic.h>`

```c
#include <stdatomic.h>

atomic_int counter = 0;
atomic_fetch_add(&counter, 1);      // RMW, sequentially consistent by default
int val = atomic_load(&counter);
atomic_store(&counter, 0);

// Memory orders, like C++:
atomic_fetch_add_explicit(&counter, 1, memory_order_relaxed);
```

### 11.3 Threads — `<threads.h>`

A minimal threading API: `thrd_create`, `thrd_join`, `mtx_lock`, `cnd_wait`, `tss_*` (thread-local storage). Optional in C11, so widely missing (glibc added it in 2018, MSVC still hasn't as of recent versions).

### 11.4 Alignment — `<stdalign.h>`

```c
#include <stdalign.h>

alignas(64) char cache_line[64];     // cache-line aligned
size_t a = alignof(double);          // query alignment
```

### 11.5 `_Noreturn`

```c
#include <stdnoreturn.h>

noreturn void die(const char *msg) {
    fprintf(stderr, "%s\n", msg);
    exit(1);
}
```

Deprecated in C23 in favor of the `[[noreturn]]` attribute.

### 11.6 Anonymous structs/unions

See §4.5. Enables clean tagged unions.

### 11.7 `_Static_assert`

```c
_Static_assert(sizeof(void*) == 8, "This code requires a 64-bit target");
static_assert(sizeof(int) >= 4, "int too small");  // via <assert.h>
```

### 11.8 Unicode character types

```c
char16_t c16 = u'A';       // UTF-16 code unit
char32_t c32 = U'𝄞';        // UTF-32 code unit
char     c8[] = u8"héllo"; // UTF-8 literal (type was char, changed to char8_t in C23)
```

---

## 12. C23 Improvements

C23 (ISO/IEC 9899:2024, informally "C23") is the biggest C language revision in a decade.

### 12.1 `nullptr` — finally!

```c
int *p = nullptr;
```

`nullptr` has its own type `nullptr_t`, convertible to any pointer but not to integers. Ends decades of `NULL` being `(void*)0` or `0` depending on implementation.

### 12.2 `typeof` and `typeof_unqual`

Previously a GCC extension, now standard:

```c
int x = 5;
typeof(x) y = 10;       // y is int
typeof(&x) p = &y;      // p is int*

#define SWAP(a, b) do { typeof(a) _t = a; a = b; b = _t; } while (0)
```

### 12.3 Bit-precise integers — `_BitInt(N)`

Arbitrary-width integers, no padding bits:

```c
_BitInt(7)    flags7;       // exactly 7 bits, signed
unsigned _BitInt(128) huge = 0;
```

Great for hardware registers, bit-packed protocols, and big integer math.

### 12.4 Enum with explicit underlying type

```c
enum color : unsigned char { RED, GREEN, BLUE };  // takes 1 byte
```

### 12.5 `constexpr` for objects

```c
constexpr int N = 100;
constexpr double PI = 3.14159265358979;
int arr[N];  // valid, N is a constant expression
```

Unlike C++, C23 `constexpr` only applies to object declarations, not functions.

### 12.6 `auto` type inference

`auto` was a vestigial storage-class keyword from K&R C (meaning "automatic" — the default). C23 repurposes it for type inference:

```c
auto x = 42;           // int
auto s = "hello";      // char *
auto pi = 3.14;        // double
```

### 12.7 `[[attribute]]` syntax

Standardized C++-style attribute syntax:

```c
[[nodiscard]] int compute(void);
[[noreturn]] void die(void);
[[deprecated("use new_api")]] void old_api(void);
[[maybe_unused]] int debug_helper;
[[fallthrough]];   // inside switch
```

### 12.8 `#embed`

Embed binary data directly into source:

```c
const unsigned char icon[] = {
    #embed "icon.png"
};
const size_t icon_size = sizeof icon;
```

Replaces the `xxd -i` convention that every C project reinvented.

### 12.9 Binary literals and digit separators

```c
int mask = 0b1010'1010;     // binary, with ' as digit separator
long big = 1'000'000'000;
```

### 12.10 Other notables

- **`bool`, `true`, `false`** are now real keywords (no `<stdbool.h>` needed).
- **`static_assert`** is a keyword (no `<assert.h>` needed).
- **`thread_local`** is a keyword (no `<threads.h>` needed).
- **UTF-8 character type `char8_t`.**
- **`unreachable()`** macro for telling the optimizer a path is impossible.
- **`memset_explicit`** — a version of `memset` that can't be optimized away (for clearing secrets).
- **Unnamed parameters in function definitions** — `int f(int, int) { ... }` is now allowed.
- **`n` length modifier for `printf`** is removed (was a security hazard).
- **K&R function declarations removed** — `int f()` finally means `int f(void)`.

---

## Appendix: Idioms Worth Internalizing

```c
// Array length (safe only when arr is a real array, not a pointer)
#define COUNTOF(arr) (sizeof(arr) / sizeof((arr)[0]))

// Containerof — get the enclosing struct from a member pointer
#define containerof(ptr, type, member) \
    ((type *)((char *)(ptr) - offsetof(type, member)))

// Min/max with type safety (GCC typeof)
#define MIN(a, b) ({ typeof(a) _a = (a); typeof(b) _b = (b); _a < _b ? _a : _b; })

// Safe allocation
#define NEW(T) ((T *)calloc(1, sizeof(T)))

// Compile-time assertion (C11+)
static_assert(CHAR_BIT == 8, "This code assumes 8-bit bytes");
```

C rewards deep understanding of the machine and punishes surface-level fluency. The language is small; the implications are vast. Learn the rules, learn the optimizations, learn the dragons, and always build with `-Wall -Wextra -Wpedantic -fsanitize=address,undefined` during development.

---

## Study Guide — C Core Language

### Prerequisites

- K&R Chapter 1 (or equivalent).
- Willingness to think about memory layout.

### Key concepts

1. **Undefined behavior is not "anything goes" — it is "the
   compiler is allowed to assume it cannot happen."** Signed
   overflow, null dereference, out-of-bounds access, dangling
   pointers, strict aliasing violations. Every one of these
   lets the optimizer do things you did not expect.
2. **Arrays decay to pointers, but they are not pointers.**
   `sizeof arr` on a local array gives the array size;
   `sizeof arr` on a pointer gives the pointer size. This is
   the single most misunderstood C rule.
3. **`const` is a type qualifier, not a promise.** A
   `const char*` is a pointer to const char; `char* const`
   is a const pointer to char. Read right-to-left.
4. **`restrict` (C99) is a promise to the compiler.** You are
   telling it no other pointer aliases this one. Used
   correctly, it enables optimizations. Used incorrectly, it
   is UB.
5. **Integer promotion rules bite.** `char + char` becomes
   `int`. Comparisons between `signed` and `unsigned` promote
   to `unsigned`. Know the rules or be bitten.

---

## Programming Examples

### Example 1 — A safe wrapper pattern

```c
#include <stdlib.h>
#include <string.h>
typedef struct { char *data; size_t len, cap; } Buf;

int buf_push(Buf *b, char c) {
    if (b->len == b->cap) {
        size_t nc = b->cap ? b->cap * 2 : 16;
        char *nd = realloc(b->data, nc);
        if (!nd) return -1;
        b->data = nd;
        b->cap = nc;
    }
    b->data[b->len++] = c;
    return 0;
}
```

Simple, safe, growable buffer. The pattern generalizes to any
dynamic array in C.

### Example 2 — A state machine with enums and switch

```c
typedef enum { S_INIT, S_RUN, S_DONE, S_ERROR } State;

State step(State s, int event) {
    switch (s) {
    case S_INIT:  return event == 1 ? S_RUN : S_ERROR;
    case S_RUN:   return event == 2 ? S_DONE : S_RUN;
    case S_DONE:  return S_DONE;
    case S_ERROR: return S_ERROR;
    }
    return S_ERROR;
}
```

---

## DIY & TRY

### DIY 1 — Find a buffer overflow

Write a program that reads input into a fixed-size buffer with
`strcpy`. Feed it input longer than the buffer. Observe the
crash under ASan.

### DIY 2 — Explore UB with different compilers

Write a program that has signed integer overflow. Compile it
with `gcc -O0`, `gcc -O2`, `clang -O0`, `clang -O2`. Observe
that the behavior changes with optimization.

### DIY 3 — Read the C standard

The C17 draft is free. Read the section on "Conversions"
(6.3). Twenty pages of careful language that explains every
integer promotion and conversion. You will never guess about
type conversions again.

### TRY — Write a hash map

Implement a hash table from scratch in C. Linear probing,
open addressing, grow-on-load-factor. This is the exercise
that makes you fluent in C's memory model.

---

## Related College Departments (C core)

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
