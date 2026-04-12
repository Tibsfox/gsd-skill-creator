# C++: History and Evolution

> "C++ feels like a new language." — Bjarne Stroustrup, on C++11, *The C++ Programming Language, 4th Edition* (2013)

A primary-source history of C++ from its origins as "C with Classes" in October 1979 through C++26. Covers the people, the standards, the compilers, the canonical books, and the ongoing memory-safety debate.

---

## 1. Origins (1979-1985)

### Bjarne Stroustrup at Bell Labs

Bjarne Stroustrup (born 30 December 1950, Aarhus, Denmark) joined the Computing Science Research Center at AT&T Bell Laboratories in Murray Hill, New Jersey, in 1979. Bell Labs was the same building complex where Dennis Ritchie had created C in 1972 and where Ken Thompson had written Unix. Stroustrup was assigned to the same group (Center 1127, the Computing Sciences Research Center) that gave the world Unix, C, awk, sed, and yacc.

### The Cambridge years and Simula 67

Stroustrup's PhD (1979, University of Cambridge, Computer Laboratory, supervised by David Wheeler) was on the design of distributed systems. He used Simula 67 — the language created by Ole-Johan Dahl and Kristen Nygaard at the Norwegian Computing Center in Oslo, the first language with classes, objects, inheritance, and virtual procedures. Simula made it possible to express the simulation of operating-system-level concurrency cleanly, but the implementation was so slow that link times exceeded the time available on the Cambridge IBM 360/165. Stroustrup later wrote in *The Design and Evolution of C++* (Addison-Wesley, 1994; ISBN 0-201-54330-3, 461 pages), "What saved me from giving up computer science was my decision to copy Simula's facilities into a more efficient language." He also experienced BCPL (Martin Richards, also Cambridge), which gave him an appreciation for low-level control.

### "C with Classes" — October 1979

The first work began in October 1979. Stroustrup needed to analyze the UNIX kernel for distributability and wanted Simula's classes plus C's efficiency. He named the project "C with Classes." The first preprocessor, **Cpre**, was written in 1979-1980 and ran on a DEC PDP-11. Cpre translated C-with-Classes source into ordinary C, which was then compiled by the standard C compiler.

C with Classes shipped to a few internal Bell Labs users in 1980. Features in this earliest form included:

- Classes (with public/private members)
- Derived classes (single inheritance only)
- Public/private access control
- Constructors and destructors
- Friend functions
- Function argument type checking and conversion
- `inline` functions
- Default arguments
- Overloading of the assignment operator
- The `this` pointer

There were **no** virtual functions, no operator overloading beyond `=`, no references, no templates, no exceptions, and no multiple inheritance. The semicolon after a class definition still echoes Simula 67.

### Cfront — 1983

In 1982-1983, Stroustrup rewrote the language and the compiler. The new compiler was called **Cfront**. Cfront was written in C with Classes (then in C++ itself once the language existed), and like Cpre it generated portable C as its target. Cfront 1.0 was released internally in October 1983.

### "C++" — the name

The name "C++" was suggested by Rick Mascitti in the summer of 1983. The `++` in C is the post-increment operator, so "C++" reads as "the next C." It was first used in print in December 1983. Earlier candidate names included "new C" and "C84." Stroustrup notes in *Design and Evolution* (page 47): "The name signifies the evolutionary nature of the changes from C." He also noted that the name is "not C+1" because C++ "is the next step beyond C, not just an increment."

### First commercial release (October 1985)

C++ was first commercially released by AT&T on **14 October 1985**. The same month, Addison-Wesley published the first edition of **"The C++ Programming Language"** by Bjarne Stroustrup (October 1985, 327 pages, ISBN 0-201-12078-X). This first edition is now known to C++ historians as "TC++PL1" and was the de facto language definition for several years. Cfront Release 1.0 was the reference implementation.

The 1985 language added to C with Classes:

- **Virtual functions** (the heart of polymorphism in C++)
- **Function and operator overloading**
- **References** (lvalue references, the `T&` syntax)
- `const` keyword (later adopted into ANSI C)
- `new` and `delete` operators
- Type-safe linkage
- Single-line comments (`//`, borrowed from BCPL)

---

## 2. The pre-standard years (1985-1998)

### Cfront 2.0 (June 1989)

C++ 2.0 was released in June 1989 with Cfront 2.0. It added:

- **Multiple inheritance**
- **Abstract classes** (pure virtual functions, the `= 0` syntax)
- **Static member functions**
- **`const` member functions**
- **`protected` access**
- Pointers to members (the `->*` and `.*` operators)
- Type-safe linkage refinements

Multiple inheritance was controversial from the start; the diamond problem (the same base class inherited via two paths) was solved with virtual base classes, a feature whose implementation cost is still discussed in compiler textbooks.

### Templates (1990) and Exceptions (1990)

Both **templates** and **exceptions** were added to C++ in 1990. Templates were proposed in Stroustrup's paper "Parameterized Types for C++" (USENIX C++ Conference, Denver, October 1988). Exceptions were designed jointly by Stroustrup and Andrew Koenig and were first described in "Exception Handling for C++" (USENIX C++ Conference, San Francisco, April 1990). Cfront 3.0 (1991) was the first compiler to ship templates; exceptions came later in commercial compilers (most by 1993-1994).

### The ARM — 1990

In 1990, Margaret A. Ellis and Bjarne Stroustrup published **"The Annotated C++ Reference Manual"** (Addison-Wesley, 1990, ISBN 0-201-51459-1, 447 pages), known universally as **the ARM**. The ARM was the de facto standard for C++ from 1990 until 1998 when ISO C++ shipped. It described C++ as it stood after the addition of templates and exceptions and included extensive commentary on why decisions were made. The ARM was used as the base document by the ISO/ANSI committee.

### The STL — 1994

Alexander Stepanov had been working on generic programming since the early 1980s, first in Scheme and Ada. By 1992 he was at HP Labs in Palo Alto and, with Meng Lee and David Musser, produced the **Standard Template Library**. The STL was a clean realization of generic programming based on iterators, containers, and algorithms — the famous trio that organized the library. Stepanov presented it to the C++ committee at the November 1993 meeting in San Jose, and after months of debate it was voted into the standard at the **Waterloo, Ontario meeting in July 1994**. Andrew Koenig was Stepanov's strongest committee advocate.

The original STL release was placed in the public domain by HP in August 1994 (HP Labs Tech Report HPL-95-11). Silicon Graphics later took over maintenance under Matt Austern.

### ISO/IEC committee

The **ISO/IEC JTC1/SC22/WG21** working group was formed in 1990 (sometimes 1989, depending on source [CHECK]) to standardize C++. The corresponding U.S. national body is **ANSI X3J16** (later INCITS/PL22.16). Committee meetings have run roughly three per year since then. The first meeting of WG21 was held jointly with X3J16 at the **Doubletree Hotel in Somerset, New Jersey, in March 1990**, with about thirty attendees, chaired by Dmitry Lenkov of Hewlett-Packard.

---

## 3. C++98 (ISO/IEC 14882:1998)

The first International Standard for C++ was published as **ISO/IEC 14882:1998** on **1 September 1998**, after eight years of committee work. The standard was 776 pages. The chair of WG21 at the time of publication was Tom Plum (Plum Hall). The project editor was Andrew Koenig.

### What C++98 included

- The full STL (containers, iterators, algorithms, function objects)
- Templates with partial specialization, member templates, and template-template parameters
- Exceptions with the `try`/`catch`/`throw` syntax
- **Namespaces** (the `namespace` keyword and `using` declarations)
- **Run-Time Type Information (RTTI)**: `dynamic_cast`, `typeid`, `<typeinfo>`
- The four named casts: `static_cast`, `dynamic_cast`, `const_cast`, `reinterpret_cast`
- The `bool` type
- `<iostream>` (replacing the older `<iostream.h>`)
- `<string>` (the `std::string` class)
- The new-style headers without `.h`
- `wchar_t`
- The `mutable` keyword
- `explicit` constructors

C++98 was a *very* hard delivery — committee members joked that it took longer than the Apollo program. Stroustrup remarked at the time that the language was "no worse than C++98 deserved."

### C++03 — bug fix release

**ISO/IEC 14882:2003** was published in **October 2003**. This was a Technical Corrigendum, not a new feature release. The major change was **value initialization** semantics. The single substantial library addition was the `std::vector<bool>` clarification. Most C++ programmers do not distinguish C++98 from C++03 in casual conversation.

A separate **Library Technical Report 1 (TR1)** was published in 2005 (ISO/IEC TR 19768:2007), shipping `tr1::shared_ptr`, `tr1::function`, `tr1::tuple`, regular expressions, hash tables (`tr1::unordered_map`), and a random number library — most of which became `std::` in C++11.

---

## 4. The Lost Decade (2003-2011) and C++11

### Why C++0x dragged on

The committee began work on a new revision in 2003, code-named **C++0x** because the committee believed it would ship in 200x — perhaps 2007, perhaps 2009. It did not. Concepts (a major proposed feature for constraining templates) consumed years of committee time and was eventually voted out at the **Frankfurt meeting in July 2009** after the realization that the design was not implementable in time. Stroustrup wrote a paper titled "The Removal of Concepts" (N2906, July 2009) describing the decision as "the most disappointing thing I have experienced in 20 years of standards work."

The standard was finally voted out at the **Madrid meeting on 12 August 2011** and published as **ISO/IEC 14882:2011** later that year. The standard was 1,338 pages — nearly double C++98. The C in C++0x was finally pronounced as hexadecimal: **0xB**.

### Stroustrup's quote

> "Surprisingly, C++11 feels like a new language: The pieces just fit together better than they used to and I find a higher-level style of programming more natural than before and as efficient as ever." — Bjarne Stroustrup, *C++11 FAQ*, 2011 (still published at stroustrup.com/C++11FAQ.html)

### What landed in C++11

- **`auto`** type deduction (reusing an old C keyword)
- **Lambdas**: `[](int x) { return x + 1; }`
- **Rvalue references and move semantics** (Howard Hinnant's design): `T&&`, `std::move`, `std::forward`
- **Smart pointers**: `std::unique_ptr`, `std::shared_ptr`, `std::weak_ptr`
- **Range-based for**: `for (auto x : v)`
- **`nullptr`** (replacing the macro `NULL`)
- **`enum class`** scoped enumerations
- **`constexpr`** functions and variables
- **Variadic templates**
- **Uniform initialization** with braces `{}`
- **`<thread>`, `<mutex>`, `<atomic>`, `<future>`** — the threading library and the C++ memory model
- **`<chrono>`** time library
- **`<random>`** random number library
- **`std::tuple`**, **`std::array`**, **`std::function`**, **`std::bind`**
- **`<unordered_map>` / `<unordered_set>`** hash containers
- **`= default`**, **`= delete`** for special member functions
- **Delegating constructors**
- **`override`** and **`final`** (contextual keywords)
- **`alignof` / `alignas`**
- **`static_assert`**
- Right-angle bracket parsing fix (`>>` in templates)
- **Trailing return types**: `auto f() -> int`
- **Raw string literals**: `R"(...)"`
- Unicode string literal prefixes: `u8`, `u`, `U`

C++11 was such a substantial revision that it spawned the term **"Modern C++"** to distinguish post-C++11 idioms from the C++03 dialect.

---

## 5. The 3-year cadence (C++14, C++17, C++20, C++23, C++26)

After the C++11 marathon, the committee adopted a three-year **train model**: ship whatever is ready on a fixed schedule, leave the rest behind. Herb Sutter, then chair of the ISO C++ committee, formalized this at the **Bristol meeting, April 2013**.

### C++14 (ISO/IEC 14882:2014) — December 2014

A "bug fix and refinement" release of C++11. 1,358 pages.

- **Generic lambdas**: `[](auto x) { ... }`
- **Lambda init capture**: `[x = std::move(p)]`
- **Return type deduction** for normal functions: `auto f() { return 42; }`
- **`constexpr`** relaxed (loops and locals allowed)
- **Variable templates**: `template<typename T> constexpr T pi = T(3.1415926535...);`
- **`std::make_unique`** (correcting the C++11 omission)
- **`std::shared_lock`** for reader-writer locks
- **Binary literals**: `0b101010`
- **Digit separators**: `1'000'000`
- **Deprecated `std::auto_ptr`** (finally removed in C++17)

### C++17 (ISO/IEC 14882:2017) — December 2017

1,605 pages. Voted out at the **Toronto meeting in July 2017**, published December 2017.

- **`std::optional<T>`**
- **`std::variant<Ts...>`** (a type-safe union)
- **`std::any`**
- **Structured bindings**: `auto [x, y] = make_pair(1, 2);`
- **`if constexpr`** (compile-time conditional compilation in templates)
- **`if` and `switch` with initializer**: `if (auto p = m.find(k); p != m.end())`
- **Class template argument deduction (CTAD)**: `std::pair p(1, 2.0);`
- **Fold expressions** for variadic templates: `(args + ...)`
- **`<filesystem>`** library (originally Boost.Filesystem)
- **Parallel algorithms**: `std::execution::par`
- **`std::string_view`**
- **`std::byte`**
- **`[[nodiscard]]`, `[[maybe_unused]]`, `[[fallthrough]]`** attributes
- **Inline variables**
- **Guaranteed copy elision**

### C++20 (ISO/IEC 14882:2020) — December 2020

1,853 pages. Voted out at the **Prague meeting on 15 February 2020**. The "Big Four" features that had been targeted for years finally landed.

- **Concepts** (Andrew Sutton, Gabriel Dos Reis, Bjarne Stroustrup) — constrained templates with `requires` clauses and standard concept library `<concepts>`
- **Modules** (Gabriel Dos Reis, Richard Smith) — alternative to header files
- **Coroutines** (Gor Nishanov, Microsoft) — `co_await`, `co_yield`, `co_return`
- **Ranges** (Eric Niebler) — composable view-based algorithms, `<ranges>`
- **Three-way comparison** (the "spaceship operator" `<=>`)
- **`std::format`** (Victor Zverovich's `{fmt}` library, P0645)
- **`<chrono>` calendar and time zones** (Howard Hinnant's `date.h`)
- **`std::span<T>`**
- **`std::source_location`**
- **`consteval`** (immediate functions)
- **`constinit`**
- **Designated initializers**: `S{.x = 1, .y = 2}`
- **`<bit>`** library (`std::bit_cast`, `std::popcount`, etc.)
- **`std::jthread`** (the joining thread)
- **`std::stop_token`**
- **Atomic smart pointers**
- **`<numbers>`** (`std::numbers::pi`, `e`, etc.)
- Removal of `std::result_of`

### C++23 (ISO/IEC 14882:2024) — published 2024

Voted out at the **Issaquah meeting, February 2023**. Officially published as ISO/IEC 14882:2024 in October 2024 (publication delay is normal).

- **`std::expected<T, E>`** (Rust-style error handling, P0323, Vicente Botet Escribá and JF Bastien)
- **`std::mdspan`** (multi-dimensional span, the precursor to `std::mdarray`, P0009)
- **`std::print` / `std::println`** (Victor Zverovich, P2093)
- **`std::generator`** (a coroutine-based range generator, P2502)
- **Multidimensional subscript operator**: `m[i, j]`
- **`if consteval`**
- **Deducing `this`** ("explicit object parameter," P0847, Gašper Ažman, Sy Brand, Ben Deane, Barry Revzin)
- **`std::flat_map` / `std::flat_set`**
- **Ranges improvements**: `std::ranges::to`, more views (`zip`, `chunk`, `slide`, `join_with`, `cartesian_product`, `enumerate`)
- **`#warning`** standardized
- **Static `operator()` and `operator[]`**
- **`size_t` literals**: `42uz`
- Stack trace library `<stacktrace>`
- **`assume`** attribute: `[[assume(x > 0)]]`

### C++26 (work in progress, target ~2026)

The committee is targeting publication in the **2026 calendar year**. Voted-in features as of recent meetings (St. Louis June 2024, Wrocław November 2024, Hagenberg February 2025) include [CHECK exact dates and statuses]:

- **Reflection** (P2996, "Reflection for C++26," Daveed Vandevoorde, Wyatt Childers, Peter Dimov, Andrew Sutton, Faisal Vali) — voted in at the **St. Louis meeting, June 2024**, the largest single feature added in years
- **Senders/receivers (`std::execution`)** — the asynchronous executors model (P2300, Eric Niebler, Lewis Baker, Lee Howes, Kirk Shoop, Michał Dominiak)
- **Linear algebra** (`<linalg>`, P1673, BLAS-style)
- **Contracts** (P2900, after a long history of false starts going back to C++20)
- **`std::hive`** (a colony container, Matt Bentley, P0447)
- **Pattern matching** (still in flight)
- **Hazard pointers** and **RCU** in `<concurrency>`
- **`std::dims`** for `std::mdspan`
- **`#embed`** (resource embedding, JeanHeyd Meneide)
- **Erroneous behavior** for uninitialized reads (a memory-safety improvement, P2795)

---

## 6. Key people

### Bjarne Stroustrup

Born 1950 in Aarhus, Denmark. MS Mathematics & Computer Science from University of Aarhus (1975). PhD Computer Science from University of Cambridge (1979, advisor David Wheeler — the same David Wheeler who coined "All problems in computer science can be solved by another level of indirection"). At Bell Labs 1979-2002 in the Computing Science Research Center. **Texas A&M University** as the College of Engineering Chair Professor 2002-2014. **Morgan Stanley** in New York as Managing Director and Technology Fellow since 2014. Still active in WG21. Author of *The C++ Programming Language* (4 editions through 2013), *The Design and Evolution of C++* (1994), *Programming: Principles and Practice Using C++* (2 editions, 2008/2014), and *A Tour of C++* (3rd edition 2022, ISBN 978-0136816485, 320 pages). ACM Fellow, IEEE Fellow, member of the U.S. National Academy of Engineering (2004). Awarded the **Charles Stark Draper Prize** in 2018.

### Andrew Koenig

Joined Bell Labs in 1977. AT&T Project Editor for the original C++ standard (C++98). Co-author with Barbara Moo of *Accelerated C++* (2000) and *Ruminations on C++* (1996). Author of *C Traps and Pitfalls* (1989) and **"C++ Gotchas: Avoiding Common Problems in Coding and Design"** (Addison-Wesley, 2004). Was Chief Scientist at AT&T Research after Bell Labs split. Coined the term **"Koenig lookup,"** more formally argument-dependent lookup (ADL).

### Barbara Moo

Bell Labs project lead and educator. Co-author with Stanley Lippman of the canonical *C++ Primer* (now in its 5th edition, 2012, covering C++11). Co-author with Andrew Koenig of *Accelerated C++*. Widely regarded as one of the best C++ educators of her generation.

### Alexander Stepanov

Born 1950 in Moscow, USSR. Trained as a mathematician at Moscow State University. Worked at GE R&D in Schenectady, then **AT&T Bell Labs** (where he met Andy Koenig), then **Polytechnic University of New York**, then **HP Labs** (1988-1995, where he created the STL with Meng Lee), then **Silicon Graphics** (1995-2000, where the SGI STL was the main reference implementation), then **Adobe** (where he wrote *Elements of Programming*, 2009, with Paul McJones). Stepanov's other books include *From Mathematics to Generic Programming* (with Daniel Rose, 2014). He famously preferred Ada to C++ on aesthetic grounds and used C++ "because it has templates."

### Herb Sutter

Long-time chair of the ISO C++ Standards Committee (2002-present, the longest-serving chair in WG21 history). Software architect at Microsoft, where he led the design of C++/CLI and later C++/CX, and where he champions standards-conformant C++. Author of *Exceptional C++* (2000), *More Exceptional C++* (2002), *Exceptional C++ Style* (2005), and *C++ Coding Standards* (with Andrei Alexandrescu, 2004). Founder of the CppCon conference series (first held in **Bellevue, Washington, September 2014**). His blog "Sutter's Mill" at herbsutter.com has been the canonical source of WG21 trip reports for two decades.

### Scott Meyers

Author of the **"Effective C++" series**: *Effective C++* (1st 1991, 2nd 1997, 3rd 2005), *More Effective C++* (1996), *Effective STL* (2001), and the modern follow-up **"Effective Modern C++"** (Addison-Wesley, 2014, ISBN 978-1491903995, 334 pages, covering C++11 and C++14). Meyers retired from C++ work in 2015 after announcing on his "Effective Software Development" blog that he was stepping back from the language. PhD from Brown University. The Effective C++ series taught a generation of programmers what RAII actually means.

### Andrei Alexandrescu

Romanian-born, PhD from University of Washington. Author of **"Modern C++ Design: Generic Programming and Design Patterns Applied"** (Addison-Wesley, 2001, ISBN 978-0201704310, 352 pages). Modern C++ Design introduced the **Loki library** and demonstrated **policy-based design** and template metaprogramming techniques (typelists, TypeTraits) that influenced C++11 features. Co-author of *C++ Coding Standards* with Sutter. Later joined Walter Bright as a principal designer of the **D programming language** before returning to C++ work and joining Facebook.

### David Vandevoorde and Nicolai Josuttis

David Vandevoorde is a long-time committee member, employee of **Edison Design Group** (the EDG front end), and one of the principal authors of the **C++26 reflection** proposal. Nicolai Josuttis is a German consultant and author of *The C++ Standard Library* (2nd edition 2012, ISBN 978-0321623218, 1,128 pages). Together with Douglas Gregor (now at Apple, ex-Indiana University, the original author of the Concepts proposal that was removed from C++0x) they wrote **"C++ Templates: The Complete Guide"** (Addison-Wesley, 2nd edition 2017, ISBN 978-0321714121, 832 pages) — the canonical book on template programming.

### Howard Hinnant

Designer of move semantics in C++11, the `<chrono>` library (including the calendar and time zone extensions in C++20), and the original `std::unique_ptr`. Worked at Apple, Ripple Labs, and others. His paper N1377 (March 2002, "A Proposal to Add Move Semantics Support to the C++ Language") is one of the most influential WG21 papers ever written.

### Gabriel Dos Reis, Andrew Sutton, Eric Niebler, Gor Nishanov

These four are the principal architects of the C++20 "Big Four":

- **Gabriel Dos Reis** (Microsoft) — Modules and Concepts
- **Andrew Sutton** (originally University of Akron, then Lock3 Software) — Concepts
- **Eric Niebler** — Ranges
- **Gor Nishanov** (Microsoft) — Coroutines

### Less central but historically connected

- **Doug Lenat** of Cyc fame had no role in C++ but is sometimes cited because his AI work motivated some object database research that influenced WG21 thinking on persistence [CHECK]
- **Guy Steele** (Sun Microsystems, then Oracle Labs) was a member of the original C++ committee in the early 1990s and contributed to early discussions of templates before moving to Java and Fortress [CHECK]

---

## 7. Compilers and implementers

### Cfront (1983 — mid 1990s)

Stroustrup's original C++ compiler. Wrote out C as its target. Cfront releases:

- **Release 1.0** (October 1983): the original C++
- **Release 2.0** (June 1989): multiple inheritance, abstract classes
- **Release 3.0** (1991): templates
- Cfront never supported exceptions; the architecture (translate to C, then compile) made it impractical. By the mid-1990s, Cfront was retired in favor of native compilers. The last AT&T release was **Release 4.0** [CHECK], at which point AT&T had largely exited the C++ business.

### GCC / G++

GCC's C++ front end is **G++**. The first version of G++ was written by **Michael Tiemann** (later co-founder of Cygnus Solutions, then Red Hat) in 1987. G++ shipped as part of GCC 1.x. For many years G++ trailed Cfront and the EDG-based commercial compilers in conformance, but the rewrite by **Mark Mitchell, Jason Merrill, and Nathan Sidwell** in the late 1990s and early 2000s closed the gap. As of 2025, GCC is at version **15.x** and supports nearly all of C++23 and significant portions of C++26.

### Borland C++ / Turbo C++

Borland released **Turbo C++ 1.0** in May 1990 for MS-DOS, priced at $99.95. Borland C++ 2.0 (1991) added Windows support. The flagship was **Borland C++ 5.0** (1996), with the OWL framework and the Turbo Vision text-mode UI library. The compiler was authored by a team that included Eugene Wang (later at Symantec). Borland's ownership later passed through Inprise to Embarcadero. Turbo C++ 2006 was the last major release. The Borland legacy is responsible for an entire generation of DOS-era programmers learning C++.

### Microsoft C/C++ (MSVC)

Microsoft's C++ compiler began as Microsoft C 7.0 (1992), which added some C++ support. **Visual C++ 1.0** shipped in **February 1993**, including the **Microsoft Foundation Class library (MFC) 2.0**. Major versions:

- VC++ 1.0 (1993) — 16-bit Windows
- VC++ 2.0 (1994) — 32-bit, MFC 3.0
- VC++ 4.0 (1995) — version skipped 3 to align with MFC
- VC++ 5.0 (1997)
- VC++ 6.0 (1998) — the legendary "VC6"
- Visual C++ .NET 2002 / 2003 — added Managed Extensions (later C++/CLI)
- VC++ 2005 / 2008 / 2010 / 2012 / 2013 / 2015 / 2017 / 2019 / 2022
- **Visual Studio 2022** ships **MSVC 19.40+** (the underlying `cl.exe` version), which corresponds to the **"v143" toolset**. As of 2025-2026 builds, MSVC's STL is open-source on GitHub at microsoft/STL under Apache 2.0 (since September 2019) and is led by Stephan T. Lavavej ("STL").

### Comeau C++

**Comeau C++** (Greg Comeau, Comeau Computing in Brooklyn, New York) was for many years the conformance-test compiler of choice. Built on the **EDG front end** with Comeau's own back end. Greg Comeau ran the company essentially as a one-person operation. The compiler was famous for being the first to fully support `export` templates (a C++98 feature that no other vendor implemented and that was removed in C++11). Comeau C++ effectively went dormant after 2008.

### Clang / LLVM

**Clang** is the C/C++/Objective-C front end for **LLVM**. Founded by **Chris Lattner** (then at Apple) in 2007 as an open-source project. The first release supporting C++ was Clang 2.6 (2009). Clang 3.1 (May 2012) was the first to fully support C++11. Apple replaced GCC with Clang as the default compiler on macOS in **Xcode 4.2 (2011)** and removed GCC entirely in **Xcode 5 (2013)**. As of 2025, Clang is at version **20.x** [CHECK exact] and is the reference compiler for many C++ committee proposals because of its rapid feature uptake.

### Intel C++ Compiler (ICC, ICX)

Intel's C++ compiler was originally the Intel Reference Compiler, then ICC, then **OneAPI DPC++/C++ Compiler (ICX)** based on LLVM since around 2020-2021. Known for its aggressive auto-vectorization and the **`#pragma ivdep`** family of pragmas. Used heavily in HPC, scientific computing, and Intel-optimized libraries (MKL, IPP).

### EDG (Edison Design Group)

**Edison Design Group**, founded in 1988 in Belmont, California, by John Spicer, Steve Adamczyk, Daveed Vandevoorde, and others. EDG sells a C++ front end that is licensed by many commercial vendors. EDG-based compilers historically include: Comeau, Intel ICC (until they switched to LLVM), Cray, IBM XL C++, ARM compilers, NVIDIA's `nvcc` host front end, Portland Group (PGI), and the Sony PlayStation 3 SN Systems compiler. EDG is the gold standard for C++ conformance in the industry — they are usually first to support new standard features because Daveed Vandevoorde is on the committee and writes the proposals.

---

## 8. Why C++ matters

C++ is the backbone of performance-critical software. A non-exhaustive inventory of well-known systems written primarily in C++:

### Browsers

- **Chromium** (Google) — the C++ codebase that underlies Chrome, Edge, Brave, Opera, Vivaldi, Arc — over 35 million lines of code
- **WebKit** (Apple) — the rendering engine in Safari and many embedded browsers
- **Gecko** (Mozilla Firefox) — although Mozilla is increasingly migrating to Rust via the Servo work, the bulk of Firefox is still C++
- **V8** (Google's JavaScript engine, embedded in Chromium and Node.js) — pure C++

### Game engines

- **Unreal Engine** (Epic Games) — entirely C++ at the engine level, with Blueprint visual scripting on top. Unreal Engine 5 is approximately 2 million lines of C++.
- **Unity** — engine in C++, scripting in C#
- **id Tech** (id Software, now Bethesda/ZeniMax/Microsoft) — DOOM, Quake, RAGE engines all in C++
- **CryEngine** (Crytek) — Far Cry, Crysis, Hunt: Showdown
- **Godot** — open-source engine in C++, scripting in GDScript
- **Frostbite** (DICE/EA), **Source 2** (Valve), **REDengine** (CD Projekt Red), **Decima** (Guerrilla)

### Databases

- **MySQL** (Oracle) — C and C++ core
- **MongoDB** — C++ core (and one of the loudest "modern C++" shops)
- **ClickHouse** (originally Yandex) — pure modern C++, famous for SIMD optimization
- **DuckDB** — C++ analytical database
- **PostgreSQL** — primarily C, but the FDW ecosystem and several extensions are C++
- **SQLite** — C, but its test suite includes C++ harnesses

### Operating systems

- The **Windows kernel** has substantial C++ in subsystems (the Win32 kernel object manager, COM, the user-mode driver framework, the new Windows Display Driver Model)
- **macOS / iOS / iPadOS** uses the **I/O Kit** driver framework written in **Embedded C++** (a restricted subset)
- **Linux kernel** is C, but in 2024-2025 there have been ongoing patches to allow **Rust** (not C++); the Linux kernel community has historically refused C++

### Financial systems

- **High-Frequency Trading** desks at virtually every quant firm: Citadel, Jane Street (which famously prefers OCaml but has C++ in the latency-critical path), Jump Trading, Hudson River Trading, Two Sigma, Optiver, IMC, Tower, DRW
- **Risk engines** at the major banks: Goldman Sachs (Marquee/SecDB has C++), Morgan Stanley (where Stroustrup himself works), JPMorgan, Deutsche Bank
- **Bloomberg** terminal is approximately 100 million lines of C++

### Scientific and HPC

- **ROOT** (CERN's data analysis framework) — pure C++ with the **Cling** C++ interpreter
- **OpenFOAM** (computational fluid dynamics)
- **GROMACS** and **LAMMPS** (molecular dynamics)
- **TensorFlow** and **PyTorch** internals — pure C++ underneath the Python bindings

### Stats

The **TIOBE Index** has consistently placed C++ in the top 5 programming languages for the past two decades. As of late 2024 and early 2025, TIOBE has C++ at **#2** behind Python, ahead of C, Java, and C#. The annual **Stack Overflow Developer Survey** ranks C++ in the top 10 most-used languages year after year (around 22-25% of professional respondents in recent years [CHECK 2024 survey]).

---

## 9. Philosophy and criticism

### Stroustrup's design rules

Stroustrup has restated his design philosophy many times in *The Design and Evolution of C++* (1994) and in his subsequent books and HOPL papers. The most cited rules:

1. **"C++ should make it possible to write programs that are both efficient and elegant."**
2. **"Trust the programmer."** (The C heritage.)
3. **"Don't pay for what you don't use."** — the **zero-overhead principle**. If you don't use exceptions, exceptions cost you nothing. If you don't use virtual functions, virtual dispatch costs you nothing. If you don't instantiate a template, the template costs you nothing.
4. **"Provide as good support for user-defined types as for built-in types."**
5. **"What you don't know can't hurt you."** — don't surface complexity until the programmer asks for it.
6. **"Make it fit in better; don't build a new language."** — Stroustrup's rationale for keeping C compatibility for so many years.

His often-quoted remark on language design:

> "There are only two kinds of languages: the ones people complain about and the ones nobody uses." — Bjarne Stroustrup, *The C++ Programming Language*, 3rd edition (1997)

### Criticism: complexity, undefined behavior, template errors

C++ is widely acknowledged as the most complex mainstream programming language. The C++23 standard is approximately **2,100 pages**. The criticisms are familiar:

- **Undefined behavior**: signed integer overflow, dereferencing null, accessing freed memory, out-of-bounds array access, data races, and many more — all are UB in C++. UB is what allows aggressive optimization but also what makes C++ memory-unsafe.
- **Template error messages**: a single missing `const` can produce a 200-line error from `<vector>`. Concepts (C++20) help.
- **Compile times**: large C++ projects can take hours to build. Modules (C++20) are intended to help but adoption has been slow.
- **The preprocessor**: still inherited from C, still macro-based.
- **Implicit conversions**: a `int` can silently become a `bool`, and so on. Modern C++ uses `explicit` to mitigate this.

### "C with Classes" dialects

Many shops still write what is effectively "C with Classes" — using C++ as a slightly better C, ignoring templates, RAII, smart pointers, and the STL. The **Linux kernel community** explicitly forbids C++. **Google's C++ style guide** historically banned exceptions and limited template metaprogramming, although this has relaxed over time (Abseil's design embraces modern C++).

### Linus Torvalds' rant

The most famous critic of C++ is **Linus Torvalds**. On the **git mailing list, 6 September 2007**, in response to a suggestion that git could have been written in C++, Torvalds wrote:

> "C++ is a horrible language. It's made more horrible by the fact that a lot of substandard programmers use it, to the point where it's much much easier to generate total and utter crap with it. Quite frankly, even if the choice of C were to do *nothing* but keep the C++ programmers out, that in itself would be a huge reason to use C."

The full message (subject: "Re: [RFC] Convert builtin-mailinfo.c to use The Better String Library") is preserved in the git mailing list archive at marc.info/?l=git&m=118975909430690.

### The memory safety debate

Memory safety has become the dominant criticism of C++ in the 2020s:

- The **NSA Cybersecurity Information Sheet "Software Memory Safety"** (November 2022) recommended that organizations move from C and C++ to memory-safe languages.
- The **U.S. White House Office of the National Cyber Director (ONCD) report "Back to the Building Blocks: A Path Toward Secure and Measurable Software"** (February 2024) explicitly named C and C++ as memory-unsafe and recommended migrating to memory-safe languages such as Rust.
- **CISA's "The Case for Memory Safe Roadmaps"** (December 2023, joint with NSA, FBI, ASD, NCSC) reinforced the same message.

The C++ committee's response has been **the Profiles proposal** (P3081 and successors, championed by Stroustrup and Herb Sutter), which proposes opt-in compile-time safety profiles. Stroustrup wrote a response paper, **"A call to action: Think seriously about safety; then do something sensible about it"** (P3447, January 2025 [CHECK]), arguing that profiles can deliver memory safety without abandoning C++. He has been notably critical of the framing of the U.S. government reports, writing on isocpp.org in early 2024:

> "I find it surprising and disappointing that the report fails to acknowledge the strengths of contemporary C++ and the efforts to provide strong safety guarantees." — Bjarne Stroustrup, isocpp.org, March 2024 [CHECK exact wording]

The **competition with Rust** is the elephant in the room. Rust's **borrow checker** offers memory safety at compile time without garbage collection. Major C++ users (Microsoft, Google, AWS) have publicly committed to writing new components in Rust rather than C++.

### Modern C++ as an answer

Modern C++ proponents argue that C++11 and later, used idiomatically, deliver safety:

- **RAII** ("Resource Acquisition Is Initialization," a term Stroustrup coined in the late 1980s) eliminates almost all manual memory management
- **Smart pointers** (`unique_ptr`, `shared_ptr`) eliminate `new`/`delete`
- **`std::span`** and bounds-checked containers eliminate raw-pointer arithmetic
- **`std::optional` and `std::expected`** eliminate null-pointer indirection patterns
- **`<ranges>`** eliminates iterator pair errors
- **Concepts** eliminate the worst template errors

The Stroustrup line on this:

> "Within C++ is a smaller, simpler, safer language struggling to get out." — Bjarne Stroustrup, *The Design and Evolution of C++* (1994), often paraphrased and reused

---

## 10. Books and canonical texts

The C++ canon is large. The essentials:

### Stroustrup himself

- **"The C++ Programming Language"** — Bjarne Stroustrup
  - 1st edition: October 1985, 327 pages, ISBN 0-201-12078-X
  - 2nd edition: June 1991, 669 pages, ISBN 0-201-53992-6
  - 3rd edition: July 1997, 1,030 pages, ISBN 0-201-88954-4 (covers C++98)
  - 4th edition: May 2013, 1,376 pages, ISBN 978-0321563842 (covers C++11)
- **"The Annotated C++ Reference Manual"** — Margaret Ellis & Bjarne Stroustrup, Addison-Wesley, 1990, ISBN 0-201-51459-1, 447 pages — the ARM
- **"The Design and Evolution of C++"** — Bjarne Stroustrup, Addison-Wesley, 1994, ISBN 0-201-54330-3, 461 pages — the indispensable history
- **"A Tour of C++"** — Bjarne Stroustrup
  - 1st edition: 2013, ISBN 978-0321958310
  - 2nd edition: 2018, ISBN 978-0134997834 (covers C++17)
  - 3rd edition: 2022, ISBN 978-0136816485, 320 pages (covers C++20)
- **"Programming: Principles and Practice Using C++"** — Bjarne Stroustrup, 1st edition 2008 (ISBN 978-0321543721), 2nd edition 2014 (ISBN 978-0321992789), 3rd edition 2024 (covering C++20) — Stroustrup's introductory text, used at Texas A&M and elsewhere

### Scott Meyers

- **"Effective C++"** — 1st 1991, 2nd 1997, 3rd 2005 (the third covers C++03 and is the most-recommended)
- **"More Effective C++"** — 1996
- **"Effective STL"** — 2001
- **"Effective Modern C++"** — Addison-Wesley/O'Reilly, 2014, ISBN 978-1491903995, 334 pages, covering C++11 and C++14

### Andrei Alexandrescu

- **"Modern C++ Design: Generic Programming and Design Patterns Applied"** — Addison-Wesley, 2001, ISBN 978-0201704310, 352 pages — introduced Loki, policy-based design, typelists
- **"C++ Coding Standards: 101 Rules, Guidelines, and Best Practices"** — with Herb Sutter, Addison-Wesley, 2004, ISBN 978-0321113580, 240 pages

### Andrew Koenig & Barbara Moo

- **"Accelerated C++: Practical Programming by Example"** — 2000, Addison-Wesley, ISBN 978-0201703535, 336 pages — the "different way to learn C++" book that started with the STL on page 1
- **"C++ Gotchas"** — Andrew Koenig (sole author), Addison-Wesley, 2004, ISBN 978-0321125187
- **"C Traps and Pitfalls"** — Andrew Koenig, Addison-Wesley, 1989

### Templates, generics, and the deep end

- **"C++ Templates: The Complete Guide"** — David Vandevoorde, Nicolai M. Josuttis, Douglas Gregor — 1st edition 2002, 2nd edition Addison-Wesley 2017, ISBN 978-0321714121, 832 pages
- **"The C++ Standard Library: A Tutorial and Reference"** — Nicolai M. Josuttis — 1st edition 1999, 2nd edition Addison-Wesley 2012, ISBN 978-0321623218, 1,128 pages (covers C++11)
- **"C++17 - The Complete Guide"** — Nicolai M. Josuttis, self-published via Leanpub, 2019
- **"C++20 - The Complete Guide"** — Nicolai M. Josuttis, self-published, 2022
- **"C++ Concurrency in Action"** — Anthony Williams, Manning, 1st edition 2012, 2nd edition 2019, ISBN 978-1617294693 — the canonical reference for the C++11/14/17 threading model

### Stepanov

- **"Elements of Programming"** — Alexander Stepanov & Paul McJones, Addison-Wesley, 2009, ISBN 978-0321635372, 288 pages — terse, mathematical, the philosophical underpinning of the STL
- **"From Mathematics to Generic Programming"** — Alexander Stepanov & Daniel E. Rose, Addison-Wesley, 2014, ISBN 978-0321942043

### Herb Sutter

- **"Exceptional C++"** (2000), **"More Exceptional C++"** (2002), **"Exceptional C++ Style"** (2005) — all Addison-Wesley
- **"C++ Coding Standards"** — with Andrei Alexandrescu, 2004

### Stanley Lippman & Barbara Moo & Josée Lajoie

- **"C++ Primer"** — Stanley B. Lippman, Josée Lajoie, Barbara E. Moo — 1st edition 1989, 5th edition Addison-Wesley 2012, ISBN 978-0321714114, 976 pages, covers C++11 — distinct from Stroustrup's *Programming: Principles and Practice* but often confused

### Online references

- **cppreference.com** — community-maintained reference, the most-used online C++ reference today, far more practical than the standard itself
- **isocpp.org** — the official site of the ISO C++ committee, with the C++ Foundation's Core Guidelines (Stroustrup & Sutter, ongoing)
- **stroustrup.com** — Stroustrup's own page, with the C++11/14/17/20 FAQs
- **eel.is/c++draft** — the live HTML rendering of the latest C++ working draft, maintained by Tim Song
- **wg21.link** — short URLs for committee papers (for example, wg21.link/p2300 for Senders/Receivers)
- **github.com/cplusplus/draft** — the LaTeX source of the standard itself, as managed by the project editor (Thomas Köppe at the time of writing)

### Conference series

- **CppCon** — the annual conference founded by Herb Sutter and the Standard C++ Foundation, first held in **Bellevue, Washington, September 2014**. Aurora, Colorado has been the regular venue since 2018. Talks are released free on YouTube.
- **C++Now** (originally BoostCon) — held annually in **Aspen, Colorado** since 2007. Smaller, more intimate, more academic.
- **Meeting C++** — the European C++ conference, Berlin
- **CPP Russia** — Moscow

### HOPL papers

The **History of Programming Languages** conferences (HOPL I 1978, HOPL II 1993, HOPL III 2007, HOPL IV 2020) commissioned Stroustrup to write definitive history papers for each:

- **"A History of C++: 1979-1991"** (HOPL II, ACM SIGPLAN Notices 28(3), March 1993, pages 271-297)
- **"Evolving a language in and for the real world: C++ 1991-2006"** (HOPL III, San Diego, June 2007, ACM Digital Library, 59 pages)
- **"Thriving in a crowded and changing world: C++ 2006-2020"** (HOPL IV, June 2020, Proceedings of the ACM on Programming Languages 4 (HOPL): 1-168, 168 pages — by far the longest HOPL paper ever written)

These three papers, together with *The Design and Evolution of C++* (1994), are the primary historical sources for everything in this document. They are written by Stroustrup himself and are openly available at stroustrup.com/hopl-almost-final.pdf and similar links on his Texas A&M / Morgan Stanley pages.

---

## Addendum: C++26 shipped (March 2026)

This addendum was added in April 2026 as part of a catalog-wide enrichment
pass. The main history above treated C++23 as the current standard and
C++26 as a work in progress. On **2026-03-29**, Herb Sutter published the
trip report for the March 2026 ISO C++ standards meeting (London Croydon,
UK) with a one-word summary in the title: *C++26 is done.*

### The path to completion

The committee's release cadence going into 2025 was:

- **Kona, Hawaii — November 2024** — feature freeze for C++26.
- **Hagenberg, Austria — February 2025** — national body comment handling.
- **Sofia, Bulgaria — June 2025** — draft feature-complete; the Sofia
  minutes are the public record of which features made the cut.
- **Wrocław, Poland — November 2025** (reported on isocpp.org as Kona at
  one point in some write-ups) — ballot comment resolution.
- **London Croydon, UK — March 2026** — final technical work complete.
  ~210 experts attended (130 in-person, 80 remote). The final approval
  ballot was sent out from this meeting, making C++26 effectively
  published.

The next two meetings — Brno, Czechia in June 2026 and Búzios, Rio de
Janeiro, Brazil in November 2026 — will begin work on C++29.

### The headline features of C++26

Herb Sutter's trip report calls C++26's reflection *"by far the biggest
upgrade for C++ development that we've shipped since the invention of
templates."* The full headline feature list:

- **Static reflection** (P2996). Compile-time introspection of types,
  members, functions, and attributes, plus a mechanism for synthesizing
  code at compile time from reflected information. Introduces the
  `^^` operator (the "cat-ears operator") as the reflection operator.
  This is the end-state of a decades-long sequence of partial
  metaprogramming mechanisms (templates, `constexpr`, `consteval`,
  `std::is_*` traits) being subsumed into a single first-class facility.
- **`std::execution` / sender-receiver** (P2300). The long-delayed
  standardization of an asynchronous-execution framework for C++. The
  model is the "sender-receiver" design originally developed for
  `libunifex` and refined across several standardization cycles. A
  sender represents a unit of async work; a receiver consumes its
  result; schedulers manage where the work runs. The C++26 `<execution>`
  header is the first C++ standard asynchronous programming model that
  handles executors, coroutines, and algorithms in a unified way.
- **Contracts**. Language-level preconditions, postconditions, and
  assertion statements, with a runtime-checking mode that integrates
  with the standard library's hardened bounds-checking facilities. After
  contracts were pulled from C++20 at the last minute, this is the
  committee's first successful landing of the feature.
- **Memory-safety hardening**. Reading an uninitialized local variable
  is no longer undefined behavior. `vector`, `span`, `string`,
  `string_view`, and other common types have bounds-safety enabled in
  hardened mode. This is the C++ committee's first structural response
  to the memory-safety conversation that has dominated the systems
  languages discourse since 2022.
- **Pattern matching** (P2688). Still in the feature set as of the
  Sofia / London trail, though it was the feature most at risk during
  2025 ballot comment handling. Introduces an `inspect` expression for
  structured pattern matching against variants, tuples, and user-defined
  types, in the style of Rust's `match` and Haskell's case expressions.

Compiler support going into 2026 was substantial: both GCC and Clang had
implemented roughly two-thirds of the C++26 feature set during
development. GCC specifically had reflection and contracts merged in
trunk awaiting release as of the March 2026 trip report.

### What changes for the story

The C++ history above runs through C++23 with a "committee in flight"
note about C++26. That note should now be read as historical: C++26 is
the current standard as of mid-2026. The two things that matter for the
larger arc are:

1. **C++ is no longer waiting for reflection.** The template system was
   the 1990s compile-time programming answer, `constexpr` was the 2010s
   answer, and static reflection is the 2020s answer. Library authors
   can now do structurally what they previously had to do by hand or via
   preprocessor tricks, and several widely-used libraries (Boost,
   standard-library implementations, serialization frameworks) are
   already in the process of rewriting their core metaprogramming
   layers on top of P2996.
2. **C++ is finally answering the memory-safety conversation on its own
   terms.** The combination of hardened standard library, no-UB for
   uninitialized reads, and language contracts is not the same as Rust's
   borrow checker — it is incremental rather than structural — but it is
   the first C++ committee release in which memory safety is treated as
   a feature the language has to ship, rather than a property
   programmers have to hand-build.

**Sources:** [C++26 is done! — Trip report: March 2026 ISO C++ standards meeting (London Croydon, UK) — Herb Sutter](https://herbsutter.com/2026/03/29/c26-is-done-trip-report-march-2026-iso-c-standards-meeting-london-croydon-uk/) · [C++26 Draft Finalized with Static Reflection, Contracts, and Sender/Receiver Types — InfoQ, June 2025](https://www.infoq.com/news/2025/06/cpp-26-feature-complete/) · [Reflection for C++26 (P2996r9) — WG21 working paper](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2025/p2996r9.html) · [C++26 — cppreference.com](https://en.cppreference.com/w/cpp/26.html) · [C++26 — Wikipedia](https://en.wikipedia.org/wiki/C++26) · [Reflection in C++26 — Modernes C++ Blog](https://www.modernescpp.com/index.php/reflection-in-c26/) · [C++ Static Reflection: An Overview of the Metaprogramming Paradigm Shift — Massimiliano Bastia, Medium](https://medium.com/@massimiliano.bastia92/c-static-reflection-an-overview-of-the-metaprogramming-paradigm-shift-4cc2ca49a2c6)

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) — C++
  is the canonical multi-paradigm systems language. Programming
  Fundamentals, Algorithms & Efficiency, and Building Projects wings
  all have C++ as a natural worked example.
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — The C++ standardization process is itself a study in how
  engineering committees manage backwards-compatibility, feature
  velocity, and institutional legitimacy. The history of contracts
  (pulled from C++20, relanded in C++26) is a textbook case.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) —
  The C++ story is the longest continuous language-evolution story in
  mainstream computing, and Stroustrup's HOPL papers are one of the
  best primary-source documentations of a language's evolution ever
  written.
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
  — C++'s template and `constexpr` systems, and now static reflection,
  are the most elaborate compile-time computation facilities in any
  mainstream language. Understanding template metaprogramming is a
  working exercise in constructive type theory.

---

*End of history.md. ~700 lines of dense factual prose (original) + ~120 lines of C++26 addendum (Session 018). Citations are primary where possible: ISO standards, Stroustrup HOPL papers, isocpp.org, the original ARM, and dated mailing-list / committee papers. Items marked [CHECK] in the body remain uncertain and should be verified by a fact-checking pass before publication.*

---

## Study Guide — C++ History

### Reading order

Chronological. The file is the history; read it in order. The
one thing you should stop to verify as you read: the dates and
the ISO standard versions. Stroustrup's HOPL paper is the
authoritative source for the pre-2000 period; the C++ committee
papers (`open-std.org/JTC1/SC22/WG21`) are authoritative for
everything after.

### Questions to hold

1. Why did Stroustrup start from C specifically, not Pascal or
   Modula-2?
2. What did Stroustrup mean by "zero-overhead abstraction," and
   how has the committee stayed faithful to it across six
   standards?
3. Why did C++98 templates win over the alternative (generic
   pointers and casts) that Java adopted?
4. What problem did C++11 move semantics solve that could not
   be solved with references?
5. Why did concepts take 20 years to land (C++03 → C++20)?
6. What is C++26 going to look like in 2028 when it actually
   ships?

### 1-week plan

- Days 1-2: read the file in order, slowly.
- Day 3: read Stroustrup's HOPL paper *A History of C++: 1979
  to 1991*.
- Day 4: read the C++11 Wikipedia article *and* the `cppreference`
  overview of C++11 features.
- Day 5: read one committee paper from any year you find
  interesting — the P-numbered papers are at `open-std.org`.
- Day 6: read Sutter's Trip Report from the most recent
  committee meeting (published on his blog after every
  meeting). This is the living history of C++.
- Day 7: write a one-page "what I learned about C++ history"
  note in your own words.

---

## Worked Examples

### Example 1 — Same function, three eras of C++

```cpp
// C++98 style
template<typename T>
void swap(T& a, T& b) {
    T tmp(a);
    a = b;
    b = tmp;
}

// C++11 style with move semantics
template<typename T>
void swap(T& a, T& b) noexcept {
    T tmp(std::move(a));
    a = std::move(b);
    b = std::move(tmp);
}

// C++20 style with concepts
template<std::movable T>
void swap(T& a, T& b) noexcept {
    auto tmp = std::move(a);
    a = std::move(b);
    b = std::move(tmp);
}
```

The three versions look similar but express increasingly precise
semantics: the C++98 version copies, the C++11 version moves,
and the C++20 version documents the requirement in the type
system itself.

---

## DIY & TRY

### DIY 1 — Read three Stroustrup papers

Stroustrup's *The Design and Evolution of C++* (1994) is a book,
but chapters 0, 1, and 2 are freely available as papers. Read
them. They are the closest thing to "why C++ is the way it is"
you will ever find.

### DIY 2 — Follow the committee for one meeting cycle

The C++ committee meets three times a year. For each meeting,
the committee publishes agenda, papers, and a trip report.
Follow one full cycle. You will understand how a language
evolves when it is governed by a committee rather than a single
author.

### TRY — Compile a 1990s C++ program in C++26

Find a C++98 program on GitHub from 2000 or earlier. Compile it
with `g++ -std=c++26`. Fix whatever warnings appear. You will
have performed a 26-year language upgrade in an afternoon.

---

## Related College Departments (C++ history)

- [**history**](../../../.college/departments/history/DEPARTMENT.md)
- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
