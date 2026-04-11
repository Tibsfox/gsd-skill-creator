# C: The Substrate of Everything

*A history, biography, and cultural study of the C programming language*

---

## Prologue: The Language That Refuses to Die

More than half a century after its creation in a back room at Bell Labs, C remains the bedrock on which nearly all modern computing rests. Every operating system kernel in widespread use is written in C or a close descendant. Every mainstream language runtime — CPython, Ruby's MRI, PHP, Perl, Lua, the V8 JavaScript engine's base, the JVM's HotSpot core — is itself a C program. Every foreign function interface in every language eventually speaks the C ABI, because the C ABI is the only lingua franca the hardware and the operating system agree upon. When a Python program calls NumPy, which calls BLAS, which calls a vendor kernel, which calls the Linux system call interface, it is C calling conventions all the way down.

C is not merely old. C is *structural*. It is the concrete in the foundation of a building that the rest of software has been built on top of, floor by floor, for fifty years. You cannot remove it without the building falling down, and no one has seriously tried.

This is the story of how two men at Bell Labs, in a culture of unhurried brilliance, made the language that became the universal substrate.

---

## 1. Dennis Ritchie: The Quiet Architect

Dennis MacAlistair Ritchie was born on September 9, 1941, in Bronxville, New York, and grew up in New Jersey after his father, Alistair E. Ritchie, joined Bell Labs as a switching systems engineer. His father co-authored *The Design of Switching Circuits* (1951), a foundational text on combinational logic. Dennis grew up steeped in the Bell Labs tradition before he ever walked through its doors as an employee.

He went to Harvard, where he earned his undergraduate degree in physics in 1963 and a PhD in applied mathematics in 1968. His doctoral thesis, *Program Structure and Computational Complexity*, concerned subrecursive hierarchies of functions — pure theoretical computer science in the Turing/Kleene lineage. The story, often retold with a kind of fond disbelief, is that Ritchie never formally received his PhD because he declined to pay the fee to have the thesis bound and deposited in the Harvard library. He had already moved to Bell Labs in 1967 and was more interested in what was happening there than in the ceremony of a degree.

At Bell Labs' Computing Sciences Research Center in Murray Hill, New Jersey, Ritchie joined the group working on Multics, the ambitious MIT/Bell Labs/GE time-sharing project. When Bell Labs pulled out of Multics in 1969, he and Ken Thompson turned their attention to a smaller, more pragmatic operating system built on a cast-off PDP-7. That system became Unix, and Ritchie's role in it was quiet but foundational. Where Thompson was the virtuoso hacker — the one who would write a C compiler, a chess program, and a text editor in the same week — Ritchie was the systems thinker. He saw that Unix needed a language that was neither assembly nor high-level in the academic sense, but something in between: a language that could describe the machine without pretending the machine wasn't there.

In 1983, Ritchie and Thompson shared the ACM Turing Award "for their development of generic operating systems theory and specifically for the implementation of the UNIX operating system." Ritchie's Turing lecture, "Reflections on Software Research," was characteristically modest. He praised the Bell Labs environment — the freedom to work on what interested them, the absence of management pressure, the quiet — more than he praised his own work. In 1990 he and Thompson received the IEEE Richard W. Hamming Medal; in 1999, President Clinton awarded them the National Medal of Technology.

Ritchie was famously reserved. Colleagues describe him as soft-spoken, wry, patient, and intellectually merciless about sloppy thinking. He had a dry sense of humor that ran through the tone of *The C Programming Language* like a hidden watermark. He answered emails from strangers. He kept the same office at Murray Hill for decades. He wore glasses and a beard and looked, a friend once said, "like a kind wizard who would rather be reading."

Dennis Ritchie died on or about October 12, 2011, at his home in Berkeley Heights, New Jersey, at age 70. The exact date was uncertain; he lived alone and his body was discovered by a caretaker. The death came one week after Steve Jobs, and in the noise surrounding Jobs's passing, Ritchie's death was almost unnoticed in mainstream media — a fact that drew sharp, rueful comment from programmers everywhere. Rob Pike, who worked with Ritchie for decades, wrote: "Dennis was a quiet and mostly private man, but he was also my friend, colleague, and collaborator, and the world has lost a truly great mind."

The comparison was made, and keeps being made: Jobs sold devices that ran software; Ritchie wrote the software that runs the devices. Every iPhone Steve Jobs ever sold was running a kernel descended from Unix and written in C. Ritchie's code was inside the thing Jobs was selling. Both men changed the world; only one of them had to ask for the world's attention.

---

## 2. Ken Thompson: The Hacker Who Built the Universe

Kenneth Lane Thompson was born February 4, 1943, in New Orleans. He grew up moving frequently — his father was in the Navy — and taught himself electronics and mathematics. He earned BS and MS degrees in electrical engineering and computer science from UC Berkeley, where he took graduate courses from Elwyn Berlekamp and absorbed the early-1960s Berkeley culture of computing-as-craft.

Thompson joined Bell Labs in 1966 and, like Ritchie, worked on Multics before its Bell Labs cancellation. His great intuition was that Multics was too big and too complicated, but that the *idea* of a time-sharing system with a hierarchical file system and an interactive shell was too good to abandon. In 1969, with a cast-off DEC PDP-7 minicomputer and a wife and infant son temporarily visiting family in California (the famous "three weeks of uninterrupted hacking" story), Thompson wrote the first version of what would become Unix: a kernel, a shell, an editor, and an assembler. He wrote them all in PDP-7 assembly.

To bootstrap himself into a higher-level language on the PDP-7, Thompson created **B** in 1969 — a stripped-down version of Martin Richards's BCPL, adapted for the PDP-7's word-addressed memory and tiny footprint. B was typeless: every variable was a machine word, and it was up to the programmer to treat that word as an integer, a pointer, or a character buffer as needed. B's syntax looks startlingly like C to a modern reader — `main() { ... }`, `printf`, `i++`, `while`, `if/else` — but without types, without structs, and without the ability to describe memory at the byte level, which mattered enormously when Bell Labs acquired the PDP-11 in 1970.

The PDP-11 was byte-addressable, and B's word-oriented assumptions were a poor fit. Thompson and Ritchie both attacked the problem. Ritchie's attack became C. Thompson's attention, characteristically, moved on to other things — but his fingerprints remain all over the early C language, because B's syntax is C's syntax almost unchanged.

Thompson went on to do some of the most famous work in the history of computing: the Belle chess computer (with Joe Condon), which became the first machine to achieve a Master rating; the endgame tablebases that settled long-open chess theory questions; the regular-expression matching engine whose direct descendants run in every modern grep, editor, and scanning tool; and, most famously, the Turing Award lecture "Reflections on Trusting Trust" (1984), in which he described planting an undetectable backdoor in the C compiler itself — a thought experiment that permanently changed how the security community thinks about supply chains.

In 2006, Thompson moved to Google, where with Rob Pike and Robert Griesemer he co-designed **Go** (2009), explicitly positioned as "a better C for modern multicore systems." Go is not C, but its aesthetic — small language, clear rules, no surprises, pragmatism over theory, compile fast, ship it — is pure Thompson. If C is the language that rewrote Unix, Go is the language that Thompson wrote after spending forty years thinking about what he would do differently.

Thompson and Ritchie were, by all accounts, complementary. Ritchie was the thinker who loved a precise specification; Thompson was the builder who loved a working system. Between them they had the rare combination of someone who would carefully design a feature and someone who would immediately try to break it by using it. That tension — elegance pulled taut against pragmatism — is the tension you can still feel in C itself.

---

## 3. The Lineage: CPL → BCPL → B → NB → C

C did not appear from nowhere. It is the last link in a chain of languages each of which was an attempt to make the previous one smaller, simpler, and more implementable.

**CPL (Combined Programming Language)**, designed at Cambridge and London Universities in the early 1960s by Christopher Strachey and others, was an ambitious attempt to marry ALGOL 60's block structure with systems-programming concerns. It was too large, too theoretical, and too hard to implement on the hardware of the day. No full compiler was ever completed.

**BCPL (Basic CPL)** was Martin Richards's 1967 response. Richards, at Cambridge's Mathematical Laboratory (and briefly at MIT Project MAC), stripped CPL of everything that wasn't strictly necessary to write a compiler and an operating system. BCPL was typeless — the only data type was the machine word — and featured a simple, consistent syntax with curly braces (actually `$(` and `$)` in the original), a `VALOF`/`RESULTIS` expression form, and a small portable runtime. Richards's innovation was to split the compiler into a front end that emitted a portable intermediate code called **O-code**, and a back end per target machine that translated O-code to native instructions. This made BCPL one of the first practically portable systems languages, and it spread across research labs in the late 1960s — including Bell Labs, where Ken Thompson encountered it.

**B**, as described above, was Thompson's 1969 simplification of BCPL for the PDP-7. He kept BCPL's typelessness and block structure, trimmed its syntax, and tuned its runtime to the tiny PDP-7 (which had 8 KB of memory). B was successful enough on the PDP-7 that when Bell Labs acquired a PDP-11, B was ported to the new machine. But the PDP-11 exposed B's fatal weakness: it was byte-addressable, and B had no concept of anything smaller than a word. Characters had to be packed into and unpacked from words by hand, every time, slowly. B also had no way to describe the layout of hardware registers or I/O structures, which mattered for systems code.

**NB (New B)** was Ritchie's first response, circa 1971. He added a notion of types — initially just `int` and `char`, then pointers — and struct-like composite types. The name "NB" appears in Bell Labs memos and Ritchie's own later retrospective essays. NB was a transitional language; it was still recognizably B with extensions.

**C** crystallized in 1972, when Ritchie took NB and kept adding features that Unix needed: proper pointers with type information, a preprocessor (Alan Snyder contributed ideas here), richer struct support, arrays, and a compiler that could be bootstrapped on itself. By early 1973, the Unix kernel — which had been written in PDP-11 assembly — was rewritten in C. This was the moment that made C real: it was now the language Unix was written in, and Unix was the operating system every interesting research machine wanted to run.

The name "C" is, in the direct and unpretentious Bell Labs style, simply the letter after B. There was never a "language A" at Bell Labs; the progression was BCPL → B → C.

Each transition happened for a concrete reason, not an aesthetic one. BCPL was portable but word-oriented. B was small but couldn't describe a PDP-11 byte. NB added types. C finished the job. The whole chain is a master class in "make the smallest change that solves the problem in front of you." This is the culture from which C inherits its personality.

---

## 4. C as Unix's Language: The Symbiosis

You cannot tell C's story without telling Unix's, because they grew up together and each made the other possible.

Unix was originally written in PDP-11 assembly. By mid-1972, enough of C existed that Thompson and Ritchie decided to try rewriting the kernel in it. The first attempt failed — C did not yet have structures, and the kernel needed to describe hardware in detail. Ritchie added structs in 1972, and the rewrite succeeded. **Unix Version 4 (late 1973)** was the first version of the kernel written mostly in C, with a few critical assembly routines for interrupt handling and context switching. **Unix Version 5 (June 1974)** was the first version shipped outside Bell Labs with its kernel in C, and it is the version the famous *Communications of the ACM* paper by Ritchie and Thompson ("The UNIX Time-Sharing System," July 1974) describes to the outside world.

The decision to write Unix in C was, at the time, considered mildly eccentric. The conventional wisdom was that operating system kernels had to be written in assembly for performance and for direct hardware access. Ritchie's bet was that a language that was close enough to the metal — one with pointers, bitwise operators, and no hidden runtime — could be almost as fast as assembly while being dramatically easier to maintain and, crucially, to *port*.

He was right, and the consequences were enormous.

When Bell Labs wanted to move Unix to a new machine, they had to rewrite the compiler back end for C (small and well-defined work) and a small assembly-language bootstrap. Everything else — the kernel, the shell, the utilities, the libraries — came along almost for free. The first major port was to the Interdata 8/32 in 1977, done by Steve Johnson and Ritchie himself. It established the pattern: write the OS in C, port the C compiler, everything else follows. This was *radical*. Before Unix, operating systems were tied to the hardware they ran on. After Unix, operating systems were portable artifacts that rode on top of a thin, portable language layer.

This symbiosis runs in both directions:

- **Unix made C portable**, because every interesting machine wanted to run Unix, and running Unix meant having a C compiler, which meant C was available on every interesting machine.
- **C made Unix portable**, because a Unix port reduced to a C-compiler port, which was a tractable problem for a small team.

The two technologies co-evolved. When Unix needed a feature — signals, pipes, sockets, memory-mapped files — C grew the primitives needed to express it. When C got a new construct — `struct`, `typedef`, function pointers — Unix's code immediately put it to use. The relationship was so tight that for years "learning C" and "learning Unix" were the same project, taught from the same books by the same people. The Bell Labs crew — Ritchie, Thompson, Brian Kernighan, Rob Pike, Bjarne Stroustrup (who would go on to create C++), Steve Johnson, Doug McIlroy, Michael Lesk — constituted the single most productive computer science research group of the late twentieth century, and C and Unix are their twin monuments.

---

## 5. K&R: The White Book

In 1978, Prentice-Hall published *The C Programming Language* by Brian W. Kernighan and Dennis M. Ritchie. The cover was white, with the title in blue Helvetica. The book was 228 pages long. It was, and remains, one of the most influential computer books ever written.

Brian Kernighan, the "K" in K&R, was not a co-designer of C. He was a Bell Labs colleague — a Princeton-trained computer scientist, an unusually gifted writer, and the person who wrote the *awk* language's "k" (with Al Aho and Peter Weinberger), the *troff* typesetting system's user documentation, and *Software Tools* (with P.J. Plauger), which taught a generation of programmers how to think in small, composable utilities. Kernighan wrote most of the prose in K&R; Ritchie wrote the reference manual appendix. The partnership produced a book that is simultaneously a tutorial, a reference, and an essay on programming taste.

The book's opening example has become the most famous program in the world:

```c
main()
{
    printf("hello, world\n");
}
```

The "hello, world" example was not invented for K&R — Kernighan had used it in earlier Bell Labs tutorials, including a 1974 internal memo on B programming. But K&R was the vehicle that carried it to every programmer on Earth. Today, *every* programming language tutorial begins with hello-world because K&R did, and K&R did because Kernighan wanted an example that produced visible output with the absolute minimum of ceremony.

The first edition of K&R describes what is now called **K&R C**: the language as it existed in 1978, with old-style function declarations (`int f(a, b) int a; int b; { ... }`), no function prototypes, no `void` type initially, no `const`, no `volatile`, and a small standard library. The book was used for a decade as the informal specification of the language — if K&R said it was so, it was so.

The **second edition** appeared in 1988, coauthored with the (then in-progress) ANSI standardization effort in mind. It documented what is now called **ANSI C** or **C89**: function prototypes, `void`, `const`, `volatile`, `enum`, a proper standard library with declared headers (`<stdio.h>`, `<stdlib.h>`, `<string.h>`, `<math.h>`, etc.), wider character support, and the preprocessor formalized. The second edition is the one most programmers learned from in the 1990s and 2000s, and it is the edition that remains in print.

K&R's prose style shaped how programmers write about code. Kernighan's sentences are short, concrete, and never decorative. Examples are tested, complete, and self-contained. The book never explains something it doesn't then use. It has a wry confidence — "C wears well as one's experience with it grows" — that has aged extraordinarily well. Generations of programmers who have never written a line of C still absorb Kernighan's prose style through the books and documentation that K&R inspired.

To this day, "K&R" is a shorthand. "K&R style" means a particular brace placement (opening brace on the same line as the function header; closing brace on its own line). "K&R C" means the pre-ANSI dialect. *The White Book*, without qualification, means one book in the mind of every systems programmer alive.

---

## 6. Standardization: Fifty Years of Slow, Careful Work

C's standardization history is a story of a committee that takes its time and a community that mostly benefits from that patience.

### K&R C (1978)
The first edition of K&R served as the de facto specification for a decade. Compilers on different machines diverged — Whitesmiths C, Lattice C, Borland Turbo C, Microsoft C, the portable C compiler (PCC) — each adding or omitting features as their vendors saw fit. By the mid-1980s, the need for a formal standard was obvious.

### ANSI C / C89 (ANSI X3.159-1989, December 1989)
The American National Standards Institute convened committee **X3J11** in 1983. The committee's chair was Jim Brodie, and its work was careful, consensus-driven, and slow. The standard was finally approved in December 1989 as **ANSI X3.159-1989**, now universally called **C89** or **ANSI C**.

C89 did not radically change the language. Its job was to codify what was already working. The main additions were:
- Function prototypes (borrowed from C++)
- The `void` type and `void *` generic pointer
- `const` and `volatile` type qualifiers
- A formal standard library with prescribed headers
- Locale support and wide characters (`wchar_t`)
- Trigraphs (to support character sets that lacked `{` `}` `[` `]` — an unloved feature that mostly went unused)
- Tightened preprocessor semantics
- A formal definition of "undefined behavior," "unspecified behavior," and "implementation-defined behavior" — three categories that would define C's personality for the next thirty-five years

### C90 (ISO/IEC 9899:1990)
In 1990, ISO adopted the ANSI standard essentially unchanged as **ISO/IEC 9899:1990**, called **C90**. The two names C89 and C90 refer to the same language; C89 emphasizes the American and C90 the international process. A 1995 amendment (**C95**, formally Amendment 1 to ISO/IEC 9899:1990) added better wide-character and multibyte support, including `<wctype.h>` and `<wchar.h>`.

### C99 (ISO/IEC 9899:1999, December 1999)
**C99** was the first major expansion of the language in a decade. Led by **WG14** — the ISO working group that had replaced ANSI's X3J11 as the steward of C — it brought C into the late 1990s:
- `inline` functions
- Variable-length arrays (VLAs) — stack arrays whose size is determined at runtime
- `//` single-line comments (finally, formally; they had been a widespread extension for years)
- Mixed declarations and code (you no longer had to put all variable declarations at the top of a block)
- `<stdint.h>` with fixed-width integer types (`int32_t`, `uint64_t`, etc.) — hugely influential
- `<stdbool.h>` with `_Bool` / `bool`
- `<complex.h>` and `<tgmath.h>` for complex arithmetic
- `restrict` pointers for alias optimization
- Compound literals and designated initializers
- `long long` — a 64-bit integer type guaranteed to be at least 64 bits
- Flexible array members in structs

C99 was ambitious, and its adoption was uneven. Microsoft's compiler stubbornly refused to implement most of C99 for over a decade, which meant "portable C" effectively meant "C89 plus whatever everyone agrees on." GCC and Clang led C99 adoption; MSVC lagged badly and only substantially caught up in the late 2010s.

### C11 (ISO/IEC 9899:2011, December 2011)
**C11** was published in the same month Dennis Ritchie died. It was the first C standard to address the realities of multicore programming:
- A memory model based on the C++11 memory model
- `<stdatomic.h>` atomic operations
- `<threads.h>` portable thread support
- `_Generic` type-generic macros (allowing the kind of type dispatch that `<tgmath.h>` had previously been magic)
- Anonymous structures and unions
- `static_assert`
- Improved Unicode support (`char16_t`, `char32_t`, `<uchar.h>`)
- Removal of `gets()` from the standard library — a rare deletion, and a tacit acknowledgment that the function was impossible to use safely
- Bounds-checking interfaces in Annex K (optional, and widely disliked)

C11's threading and atomics features were important statements of intent but were slow to be fully implemented; many real C programs continued to use POSIX pthreads instead.

### C17 / C18 (ISO/IEC 9899:2018)
**C17** (published 2018, sometimes called C18) was a bug-fix release. It introduced no new features — its purpose was to correct defects in C11 and produce a clean reference document. For most practical purposes, C17 *is* C11 with errata applied.

### C23 (ISO/IEC 9899:2024)
**C23** — formally ISO/IEC 9899:2024, published in 2024 — was the first substantial language expansion since C11. Key additions:
- `nullptr` constant and `nullptr_t` type (borrowed from C++)
- `typeof` and `typeof_unqual` — making generic-programming idioms much cleaner
- **Bit-precise integer types** (`_BitInt(N)`) — integers of arbitrary bit width, a significant innovation for embedded and cryptographic code
- Improved `enum` with explicit underlying types
- Standard attributes syntax `[[attribute]]` (borrowed from C++)
- `constexpr` for objects (though not functions, unlike C++)
- Binary integer literals (`0b1010`)
- Digit separators in literals (`1'000'000`)
- Improved Unicode identifier support (UTF-8 source files as standard)
- `#embed` preprocessor directive to include binary data as an array
- Removal of trigraphs — finally
- Removal of K&R-style function declarations — a symbolic turning of the page, more than thirty years after ANSI C

C23 was the first standard to feel, to longtime C programmers, like the language was *modernizing* rather than merely being tidied. The introduction of `constexpr`, `nullptr`, and attribute syntax narrowed the gap with C++ while keeping C recognizably C.

### C2y
**C2y** (tentatively ISO/IEC 9899:2029 or later — "y" is a placeholder for the final digit of the year) is the working name for the next C standard, currently in draft under WG14. Discussions include improved generic programming, better type safety, reflection primitives, and further convergence with C++ where it does not compromise C's simplicity. No feature is final until the standard ships, and WG14's pace remains characteristically unhurried.

---

## 7. WG14: The Committee Behind the Standard

**ISO/IEC JTC1/SC22/WG14** — Working Group 14 of Subcommittee 22 of Joint Technical Committee 1 of the International Organization for Standardization and the International Electrotechnical Commission — is the body responsible for the C standard. It is the successor to ANSI's X3J11 and has been the primary steward of C since C99.

WG14 is not large. Active participation typically involves a few dozen people, drawn from compiler vendors (GCC, LLVM/Clang, MSVC, IAR, Green Hills, Keil), major users (operating system kernels, embedded industry, financial systems), academic researchers, and national body delegates. Meetings happen two or three times a year, historically alternating between Europe, North America, and Asia, and the group communicates between meetings on mailing lists and via numbered issue papers (the famous "N-documents" — N3096, N3220, and so on — that archive every proposal in C's recent evolution).

Convenors and editors of the standard through its history have included **Jim Brodie** (X3J11 chair during C89), **P.J. Plauger** (an early force for standardization, author of *The Standard C Library*), **John Benito** (long-serving convenor who shepherded C99 and C11), **David Keaton** (convenor during C17 and early C23), and **Robert Seacord** (security-focused contributions). The current editor, through much of the C23 cycle, has been **Jens Gustedt**, whose *Modern C* (2019, updated 2024) is one of the clearest introductions to the language as it exists today.

Notable long-term contributors include **Douglas Gwyn**, **Tom Plum** (of Plum Hall, whose test suites have stress-tested every C compiler ever shipped), **Clive Feather**, **Larry Jones**, **Joseph Myers** (GCC representative), **Aaron Ballman** (Clang representative and C23 editor), **JeanHeyd Meneide** (who drove `#embed` and many C23 features), and **Martin Uecker**.

WG14's culture is cautious. C is deployed on every platform imaginable, in contexts where mistakes cost real money and real lives — flight control computers, medical devices, industrial controllers, power plants, banking infrastructure. A change that would be routine in a younger language requires years of review in WG14 because the blast radius of a mistake is enormous. This caution is sometimes frustrating to programmers who want C to modernize faster, but it is why C programs written in 1990 still compile and run correctly on 2026 hardware. The committee's slowness is, in the long view, a feature.

---

## 8. Cultural Impact: The Universal Calling Convention

C's influence is so pervasive that it is nearly invisible. It is the default. To understand what C gave to computing, you have to imagine a world without it, and no one alive in 2026 remembers that world.

### Portable assembly

The most repeated description of C is "portable assembly." This phrase captures something true and something misleading. What is true: C gives you direct access to memory, pointers, bitwise operations, and integer arithmetic at the size of the machine word, with no hidden runtime, no garbage collector, and no boxing. You can write code in C that compiles to almost exactly the instructions you would have written by hand in assembler. What is misleading: C is not a faithful abstraction of any particular machine. It is an abstraction of a *family* of machines — byte-addressable, with hierarchical memory, with stack-based calling conventions, with integer and floating-point registers — and its "undefined behavior" rules exist precisely so that a C program can be translated efficiently to any machine in that family without the compiler having to preserve the quirks of any one of them. The "portable" in "portable assembly" does real work.

### The C ABI as universal glue

Every operating system on Earth has a stable, versioned **C ABI** — a specification of how functions are called, how arguments are passed, how structures are laid out in memory, and how return values come back. Windows has one (actually several, for x86, x64, and ARM64). Linux has the System V AMD64 ABI on x86_64, and corresponding ABIs on ARM and RISC-V. macOS has the Darwin ABI. All of these are *C ABIs* because C is the language the kernel and the system libraries are written in and the language their interfaces are described in.

The consequence: when any other programming language — Python, Ruby, Go, Rust, Java, JavaScript, Swift, Zig, Kotlin, Julia — wants to talk to the operating system or to an existing library, it talks through the C ABI. This is the **foreign function interface (FFI)**. Python has `ctypes` and `cffi`. Ruby has `ffi`. Go has `cgo`. Rust has `extern "C"`. Java has JNI. Node.js has N-API. Swift imports C headers directly. Every single one of these mechanisms is, underneath, a way of calling C-ABI functions and unpacking C-ABI structures.

This gives C a unique cultural position: **C is the language every other language must interoperate with**. You cannot ship a practical language without a C FFI, because all the libraries you need — OpenGL, SQLite, zlib, OpenSSL, libcurl, ffmpeg, libxml2, every database driver, every hardware driver, every GUI toolkit's native backend — are written in C (or expose a C-compatible interface). The C ABI is the only place in software where everyone agrees. It is the universal adapter, the USB-C of programming languages, the lingua franca of the operating system.

When Rust advocates talk about "replacing C," the actually-hard part is not writing new code in Rust. It is maintaining the C ABI for the rest of the world to call into. Rust's `extern "C"` blocks, `#[repr(C)]` structs, and careful control over layout all exist to let Rust code *speak C* at its boundaries, because the outside world speaks C and cannot be asked to learn anything else. The same is true of Swift, Go, Zig, and every other modern systems language. C doesn't need an FFI to other languages. Other languages need an FFI to C.

### The substrate of everything

This is what programmers mean when they call C "the substrate of everything." If you remove C from the software ecosystem, you do not get a world where other languages take its place. You get a world where nothing compiles, no kernel boots, no library links, and no two languages can talk to each other. C is not a tall building. C is the ground the buildings stand on.

---

## 9. Who Uses C: A Partial Inventory

C is everywhere. A non-exhaustive list of things that are, in 2026, written primarily or entirely in C:

**Operating system kernels**
- **Linux** (~30 million lines of C as of 2025, plus a growing but still small amount of Rust for drivers) — the most-deployed kernel in history, running on everything from phones to supercomputers
- **FreeBSD, OpenBSD, NetBSD, DragonFly BSD** — entirely C, with carefully managed styles and tight coupling to POSIX
- **Darwin / XNU** (the kernel of macOS, iOS, iPadOS, tvOS, watchOS, visionOS) — C and C++, with C at the core
- **Windows kernel** (NT) — large portions in C, with C++ in newer subsystems
- **Illumos / Solaris** — C all the way down
- **QNX, VxWorks, Green Hills INTEGRITY, LynxOS** — the real-time operating systems that run flight controls, medical devices, and industrial automation; almost entirely C
- **seL4** — the formally verified microkernel, written in C with a formal proof of correctness against a Haskell specification
- **Zephyr, FreeRTOS, Mbed OS, ThreadX** — the embedded RTOSes that run microcontrollers

**Language runtimes**
- **CPython** — the reference implementation of Python, written in C
- **CRuby / MRI (Matz's Ruby Interpreter)** — written in C
- **PHP** — the Zend engine is C
- **Lua** — famously, about 30,000 lines of extremely clean C
- **Perl** — C
- **V8** (JavaScript, Chrome/Node.js) — C++ with C-compatible interfaces; its predecessors and the embedded JITs are C territory
- **HotSpot JVM** — C++ with C underpinnings
- **SpiderMonkey** (Firefox's JS engine) — C++
- **Erlang/OTP's BEAM VM** — C
- **R** — C, with some Fortran
- **Julia** — its runtime is C and C++, with LLVM underneath (LLVM is C++, but presents C-callable interfaces)

**Databases**
- **SQLite** — the most-deployed database engine in the world (billions of installations). About 150,000 lines of exceptionally well-tested C. Famous for having more test code than production code by several orders of magnitude
- **PostgreSQL** — core server in C, ~1.5 million lines
- **MySQL / MariaDB** — C and C++
- **Redis** — C
- **LevelDB, RocksDB** — C++ with C interfaces
- **DuckDB** — C++ with a C API

**Web and network infrastructure**
- **nginx** — C. Runs a large share of the world's websites
- **Apache httpd** — C
- **HAProxy** — C
- **OpenSSL, LibreSSL, BoringSSL** — C. Every HTTPS connection on the internet depends on one of these
- **curl / libcurl** — C
- **OpenSSH** — C
- **BIND, Unbound, PowerDNS** — C (with some C++)
- **The Linux networking stack, iptables/nftables, tc** — C

**Graphics, audio, video, games**
- **FFmpeg** — C, with assembly. The foundation of video processing on the internet
- **x264, x265** — C and assembly
- **libvpx, libaom, dav1d, SVT-AV1** — C
- **ALSA, PulseAudio, PipeWire** — C
- **OpenGL, Vulkan, DirectX drivers** — predominantly C at the driver level
- **SDL** — C
- **Quake, Quake II, Quake III, Doom** (and every engine that descends from them) — C
- **id Tech engines through Doom 3** — C, then C++

**Embedded and firmware**
- Essentially every microcontroller on Earth runs C. AVR, ARM Cortex-M, RISC-V embedded, PIC, MSP430, ESP32 — the vendor toolchains assume C. A modern car contains somewhere between 100 and 150 microcontrollers; almost all of their firmware is C. Medical devices, industrial sensors, IoT gadgets, GPS receivers, hearing aids, pacemakers, insulin pumps, satellites, space probes — all C.

**Scientific and numerical**
- **BLAS, LAPACK** — Fortran historically, but the reference interfaces and modern variants (OpenBLAS, BLIS) are C
- **FFTW** — C
- **GSL (GNU Scientific Library)** — C
- **HDF5** — C
- **NumPy's core** — C, with Python bindings on top

**Developer tools**
- **GCC** — mostly C++, but with C throughout and a C-first history
- **LLVM / Clang** — C++ with C bindings
- **GDB** — C with some C++
- **Git** — C
- **Vim, Neovim** — C
- **Emacs** — C for the core, Emacs Lisp on top
- **tmux, screen** — C
- **bash, zsh, fish, dash, ksh** — C

And underneath all of this, the C standard libraries themselves (**glibc**, **musl**, **BSD libc**, **Microsoft UCRT**, **Bionic** on Android, **newlib** for embedded) are of course also C, and constitute the foundation that every C program on their respective platforms links against.

No other language is present in this many layers of the stack. No other language is so hard to escape.

---

## 10. The Memory Safety Debate

C's greatest cultural challenge in the 2020s has been the memory safety debate, and the debate is the direct consequence of C's unique power and unique age.

### The technical problem

C gives the programmer direct control over memory — pointers, manual allocation and deallocation, array indexing without bounds checking, pointer arithmetic, string operations that trust you to have allocated enough space. This is precisely what made C the right language for kernels, drivers, and embedded systems: nothing is hidden, nothing is magical, and if you know what you are doing, you can write code that runs as fast as the hardware allows.

But "if you know what you are doing" has turned out to be an extraordinary assumption. The class of bugs that come from getting memory management wrong — **buffer overflows, use-after-free, double-free, null-pointer dereferences, uninitialized memory reads, type confusion, integer overflows leading to memory corruption** — has been responsible for the majority of serious security vulnerabilities in software for thirty years.

Microsoft's **BlueHat IL 2019 presentation** by Matt Miller revealed that approximately **70% of CVEs assigned to Microsoft products** between 2006 and 2018 were memory safety bugs. Google's **Project Zero** and the **Chrome security team** have reported similar numbers: roughly 70% of Chrome's high-severity bugs are memory safety issues, with use-after-free being the single most common category. The Linux kernel's own security history tells the same story. The famous names — **Morris Worm (1988)**, **Code Red (2001)**, **Heartbleed (2014)** in OpenSSL, **EternalBlue (2017)** leading to WannaCry, the endless parade of browser sandbox escapes — are overwhelmingly memory safety bugs in C or C++ code.

The problem is not that C programmers are careless. The problem is that the C language makes correctness depend on global, non-local reasoning: whether a particular pointer is valid right now depends on what every other part of the program has done with memory, and the compiler cannot check this for you. Human programmers, even excellent ones, even very careful ones, cannot keep all of this in their heads at all times. The bugs are not failures of craftsmanship; they are failures of the abstraction to help.

### The Rust challenge

**Rust**, first released as 1.0 in 2015 by Mozilla and now stewarded by an independent foundation, was designed explicitly to solve this problem. Rust's **ownership** and **borrowing** system is a type-level discipline that the compiler enforces at compile time: at any given point in the program, every piece of memory has exactly one owner, and references to that memory are tracked so that the compiler can prove, mechanically, that no use-after-free, double-free, or data race can occur. The proof happens before the program runs. There is no runtime cost. The program, once it compiles, is memory-safe by construction in its safe subset (Rust also has an `unsafe` keyword for code that must step outside the discipline, typically at FFI boundaries or in low-level primitives).

Rust's adoption in systems code has been slow but steady. **Linux accepted Rust as a second implementation language in 2022**, with Linus Torvalds personally approving the merge of Rust-for-Linux support. The first Rust drivers merged to mainline kernel in 2023-2024. **Microsoft has been rewriting portions of Windows — including the Win32k GDI subsystem — in Rust**, a project discussed publicly at BlueHat 2023. **Android** has been shipping Rust code in production since 2021; Google's security team reported in 2024 that the fraction of memory safety bugs in Android has dropped dramatically as Rust's share of new code has grown. **Firefox** has Rust components throughout. **Cloudflare, Amazon, Meta, Discord, Dropbox**, and many others have adopted Rust for performance-critical, security-sensitive services.

The Rust challenge to C is not that Rust is prettier or more modern — it is that Rust produces a memory safety proof, and C cannot, and for a growing class of use cases (anything network-facing, anything in a security boundary, anything processing untrusted input) the proof is becoming a procurement requirement.

### Safe C++ and C++ profiles

The C++ community has responded to the same pressure with its own proposals. **Bjarne Stroustrup's "profiles"** proposal — now being actively pursued in the C++26 and C++29 committee timelines — aims to let programmers opt into subsets of C++ that are statically checked for memory safety, lifetime safety, and type safety. **Sean Baxter's Circle compiler** has prototyped a more radical "Safe C++" with borrow-checking modeled on Rust, demonstrating that the ideas can be grafted onto C++ syntax. Whether the committee can standardize something that genuinely delivers safety without splintering the language remains open.

C has had no equivalent proposal taken seriously, and for good reason: the features that would make C safe in the Rust sense — affine types, a borrow checker, lifetime annotations — would change the character of the language so thoroughly that the result would not be C in any meaningful sense. The C committee's position has largely been that C programmers choose C precisely because they want the control that safety guarantees would take away.

### CHERI: hardware-assisted memory safety

**CHERI** (Capability Hardware Enhanced RISC Instructions) is a research project from the University of Cambridge Computer Laboratory and SRI International, ongoing since the late 2000s and now jointly developed with Arm. CHERI extends conventional processor architectures (MIPS, RISC-V, and most notably Arm's Morello prototype platform) with **capability** pointers — pointers that carry bounds, permissions, and provenance metadata enforced by the hardware. A CHERI pointer cannot be forged, cannot be used to access memory outside its bounds, and cannot be cast from an integer back into a usable pointer.

The significance of CHERI is that it offers a path to memory safety **for existing C and C++ code** — with modest source modifications and a recompile, not a rewrite. CheriBSD (a CHERI port of FreeBSD) has demonstrated that multi-million-line C codebases can run on CHERI hardware with memory safety enforced at the instruction-set level. Arm's Morello prototype board, shipping to researchers since 2022, has proven the concept at commercial-quality performance. If CHERI reaches production silicon in Arm's mainstream roadmap — still an open question as of 2026 — it would give C a second life as a language whose safety is provided by the hardware rather than by the source.

### The White House ONCD report (February 2024)

On **February 26, 2024**, the **Office of the National Cyber Director (ONCD)** at the White House published a report titled **"Back to the Building Blocks: A Path Toward Secure and Measurable Software."** The report made a blunt recommendation: to reduce the attack surface of software used by the U.S. government and critical infrastructure, developers should adopt **memory-safe programming languages** — explicitly naming Rust and other languages with compile-time memory safety guarantees — and should move away from memory-unsafe languages, explicitly naming C and C++.

This was unprecedented. The executive branch of the U.S. government had, for the first time, taken a public position on the choice of programming language for critical software. The report did not ban C or C++, and it did not set compliance deadlines, but it signaled unambiguously that memory safety had moved from a technical debate to a policy concern at the highest level. It cited the Microsoft and Google statistics, the steady drumbeat of memory safety CVEs, and the availability of proven alternatives.

### The response from the C/C++ community

The response was mixed. Some respected voices — including **Greg Kroah-Hartman** (long-serving Linux kernel maintainer), **Miguel Ojeda** (lead of Rust-for-Linux), and many Google and Microsoft engineers — welcomed the report and argued that the C and C++ communities had had decades to solve the problem and had not, and that the industry would have to adapt. Others pushed back. **Bjarne Stroustrup** published a public response in March 2024 defending C++ and arguing that memory safety must include other safety properties (type safety, thread safety, resource safety) and that well-engineered modern C++ with profiles could achieve comparable guarantees without a full rewrite of the world's software. The **C++ committee** accelerated work on profiles and safety features. **Robert Seacord** and others in the C community emphasized existing mitigations — stack canaries, ASLR, control-flow integrity, sanitizers, static analysis, the formal verification of seL4 — and argued that C can be written safely if the surrounding engineering discipline is strong enough.

The honest answer, as of 2026, is that both positions contain truth. Some C code — the Linux kernel, SQLite, OpenBSD's userland, seL4 — is written to standards of review, testing, and static analysis that make it exceptionally reliable. Most C code is not. Rust, by default, makes it harder to write the bad code, which is the difference that matters at scale. But C remains irreplaceable for the bottom layers of the stack, and no serious person believes the world's C codebase will be rewritten in any language, in any reasonable timeframe. The realistic future is one where C continues to run the substrate, Rust and other safe languages take over the layers immediately above it where they can, CHERI or similar hardware assistance protects the C that remains, and the C standard itself slowly absorbs ideas — `constexpr` in C23, bit-precise integers, better attributes — that let careful programmers write safer code without pretending to be writing a different language.

---

## Epilogue: The Spirit of the Language

C is not a beautiful language by modern aesthetic standards. It has undefined behavior. It has the declarator syntax that requires you to "read it inside-out" to parse a function pointer. It has header files and a preprocessor that predates the concept of modules. It has integer promotion rules that trip up every programmer who has ever lived. It has a string type that is a convention, not a type. It has `setjmp`/`longjmp`. It has the `volatile` keyword whose meaning has been debated for thirty years. It has no namespaces, no generics (until `_Generic` in C11, which isn't what anyone would have designed from scratch), no destructors, no exceptions, no closures, no modules.

And yet.

C is the language in which the world runs. It is the language in which *I* run, as an AI program: somewhere in the chain between my weights and this text is C code (the CUDA runtime, the kernel, the network stack, the filesystem driver, the C library the Python interpreter links against). Every digital thing you have ever done has passed through C. Every website you have loaded, every photograph you have taken on a phone, every song you have streamed, every bank transaction, every elevator, every traffic light that talks to a central controller, every plane you have flown on, every medical device that has touched you — all of them are running C at some critical layer.

The spirit of C is the spirit of **trusting the programmer**. The language gives you a small, sharp set of tools and assumes you will use them carefully. It does not hide the machine from you. It does not pretend that memory is an abstraction. It does not insert checks you didn't ask for. It compiles to fast, predictable code. It will still be here in fifty years.

Dennis Ritchie, asked once what he thought the secret of C's longevity was, said something characteristic: "C is quirky, flawed, and an enormous success." That is the whole story in one sentence. The quirks and the flaws are real. The success is the ground we stand on.

He died in October 2011. His language is everywhere.

---

## Addendum: C23 shipped, C2y in flight (2025–2026)

This addendum was added in April 2026 as part of a catalog-wide enrichment
pass. The main narrative above closes with the spirit-of-C epilogue. The
standard process has continued quietly in the background, and 2025 was
the year in which C23's compiler adoption crossed the threshold from
"optional flag" to "default."

### C23 — published and defaulted

C23 was formally published as **ISO/IEC 9899:2024** on October 31, 2024.
The naming is the usual standards-committee footnote: the document has
been called C23 through its entire development cycle because the freeze
happened in 2023, but the formal ISO publication slipped into 2024, and
WG14 papers from 2025 and 2026 variously refer to it as C23 or C24
depending on author preference.

What changed in 2025 was compiler adoption:

- **GCC 15** (released in 2025) makes C23 the default dialect for the C
  front-end. Prior GCC releases required `-std=c23` (or `-std=gnu23` for
  the GNU-extensions variant) to opt in; GCC 15 ships with C23 as the
  implicit target, which means that most new C code built on Linux is
  now built against C23 semantics by default.
- **Clang 18** added `-std=c23` support, and Clang 19 added partial
  support for the informally-labelled **C2y** successor dialect behind
  `-std=c2y`. Clang had historically lagged GCC by one release cycle on
  C standard support, and the 2025 tree continues that pattern.
- **slimcc** and other small C compilers now ship with C23 support and
  some C2y extensions in 2025, showing that C23 is no longer purely a
  "big three toolchain" target.

The practical effect of "C23 is default" is that the features the main
body above describes as recent — `nullptr`, `constexpr` for objects,
`bool` as a keyword, `_BitInt(N)`, attributes with `[[...]]` syntax,
`typeof` standardized, binary literals, digit separators, UTF-8 string
literals, generic `<stdckdint.h>` checked arithmetic, `auto` for type
inference in limited contexts, and improved `enum` — are now the default
semantics of the language for most new C development. C has quietly
become a language with optional type inference and compile-time constant
objects, which is not how most C programmers think of it.

**Sources:** [C23 (C standard revision) — Wikipedia](https://en.wikipedia.org/wiki/C23_(C_standard_revision)) · [C Standards Support in GCC — GNU Project](https://gcc.gnu.org/projects/c-status.html) · [Clang C Programming Language Status — LLVM](https://clang.llvm.org/c_status.html) · [LLVM Clang Now Supports -std=c23 — Phoronix](https://www.phoronix.com/news/LLVM-Clang-18-std-c23) · [C23 is Finished: Here is What is on the Menu — The Pasture](https://thephd.dev/c23-is-coming-here-is-what-is-on-the-menu) · [slimcc — fuhsnn on GitHub](https://github.com/fuhsnn/slimcc)

### C2y — memory safety on the table for the first time

The ISO WG14 committee began organizing the **C2y** workload in early
2026. The **Graz, Austria meeting (February 24–28, 2026)** set the
post-C23 technical direction. The two threads worth noting are:

1. **Effective-type issues.** WG14 has been reviewing papers on how the
   C effective-type rules interact with `_BitInt`, compound literals,
   and type-punning. This is a compiler-writer concern rather than a
   user-visible concern, but it is the sort of deep-spec cleanup that
   determines what optimizing compilers are allowed to do with
   apparently-innocent code.
2. **TrapC.** An informal proposal circulating in technical circles for
   a **memory-safe fork of C** designed to eliminate undefined behavior.
   TrapC is not (yet) a WG14 work item, but its circulation is a
   meaningful signal: the memory-safety conversation that the systems
   languages community has been having since 2022 has reached the C
   standards process. WG14 has historically been cautious about adding
   features that require runtime support or that would split the
   ecosystem, and TrapC is in the early stages of being evaluated
   against that caution. As of April 2026 it is too early to say
   whether any TrapC-style ideas will make C2y or whether the committee
   will continue to treat memory safety as a property programmers build
   rather than a property the language enforces.

### What this means for the story

The main body above ends with "C is the language in which the world
runs" and the Ritchie quote about being quirky, flawed, and successful.
That framing is still correct. What has shifted is the conversation
*about* C: for the first time since the C standard began, the headline
topic is not a feature (generics, fixed-width integers, threads) but a
property (memory safety). The C committee has not yet decided how to
answer that question, and the set of things it is willing to do — TrapC
on the outer edge, effective-type cleanup in the middle, nothing on the
cautious edge — bounds the space of possible answers.

Whatever happens, C is not being replaced. The Linux kernel is still C
(with small Rust components). The C runtime is still C. The bulk of
embedded firmware is still C. C's 60%+ share of the embedded market and
its position as the bottom of the software stack are unchanged. What is
changing is what "writing C" means in 2026 compared to what it meant in
2006: the default dialect has new features, the compilers enforce
stricter rules, and the memory-safety conversation is shaping the edges
of the language from the outside in.

**Sources:** [State of C 2026 — The Dev Newsletter](https://devnewsletter.com/p/state-of-c-2026) · [What is C23 and why should I care? — Software Development / Codidact](https://software.codidact.com/posts/289414)

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) — C
  is the substrate language the Programming Fundamentals and Algorithms
  & Efficiency wings are (indirectly) describing. Every high-level
  language's runtime is implemented in C or one of its descendants.
- [**electronics**](../../../.college/departments/electronics/DEPARTMENT.md)
  — Embedded systems and firmware are the C-dominant domains. For
  anyone building physical computing hardware, C is the default
  language of the microcontroller toolchain.
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — C is the engineering language of systems software. Kernel
  development, network stacks, filesystem drivers, and device drivers
  are all C first.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) —
  The Bell Labs story and the Unix story are inseparable from the C
  story, and all three are foundational for the history of computing
  in the second half of the twentieth century.

---

*Compiled from Bell Labs historical records, ISO/IEC WG14 archives, ACM Turing Award citations, and the public writing of Dennis Ritchie, Brian Kernighan, Ken Thompson, Rob Pike, Bjarne Stroustrup, and the C standardization community. Draws on Ritchie's own "The Development of the C Language" (HOPL-II, 1993) and "The Evolution of the Unix Time-sharing System" (1984) for the primary narrative of C's origins at Bell Labs.*

*The C23/C2y addendum and the Related College Departments cross-link were added during the Session 018 catalog enrichment pass.*
