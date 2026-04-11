# Java: History and Evolution

*From the Green Project (1991) through Java 25 LTS (2025)*

---

## 1. Origins and the Green Project (1991-1995)

Java's genesis lies in a small internal Sun Microsystems skunkworks called the **Green Project**, chartered in December 1990 by Patrick Naughton, who had been preparing to leave Sun for NeXT.

Sun co-founder Scott McNealy asked Naughton to write a memo describing everything he thought was wrong with Sun, and to propose a project that would fix it.

The result, nicknamed the "Green Project," was formally launched in early 1991.

Its founding trio was **James Gosling**, **Patrick Naughton**, and **Mike Sheridan**, with additional engineering contributions from **Bill Joy**, **Arthur Van Hoff**, **Jonathan Payne**, **Ed Frank**, **Chris Warth**, and several others who cycled through the group of roughly thirteen engineers.

The Green Team was physically separated from Sun's main campus, working out of an office on Sand Hill Road in Menlo Park.

Their target was not the workstation market that Sun dominated but rather the emerging world of consumer electronic devices — set-top boxes, PDAs, cable TV receivers, and handhelds.

The team believed the proliferation of CPU architectures in consumer devices (SPARC, MIPS, 68k, various 8/16-bit microcontrollers) created demand for a portable, safe, network-aware programming environment that existing languages like C and C++ could not deliver without significant pain.

Gosling initially tried to build what he needed as a C++ extension, but abandoned the effort after concluding that the language's memory model, template system, and header-file mechanics would never be safe for downloadable code running on resource-constrained devices. He later said in interviews that the design decision to start fresh came after "a particularly bad week debugging a piece of C++ that should have worked" [CHECK: paraphrased recollection].

The team's hardware demonstrator was the **\*7** (pronounced "Star Seven"), a handheld wireless PDA-style device built around a SPARC chip, a touchscreen, and an animated agent named **Duke** — Duke would later become Java's official mascot, drawn by Joe Palrang.

The \*7 ran a small window system called "SunDew" and a new language originally called **Oak**, named after an oak tree Gosling could see from his office window at Sun.

Oak's first compiler (written in C by Gosling) and its early runtime targeted embedded systems and were designed for the kind of network-centric, multi-processor, heterogeneous environment Gosling expected to dominate consumer devices.

The "white paper" on the Oak language, dated **August 1991** and later circulated more broadly as *The Java Language Environment* in 1995, laid out eleven buzzwords that became Sun's marketing framework: **simple, object-oriented, distributed, interpreted, robust, secure, architecture-neutral, portable, high-performance, multi-threaded, and dynamic**. These eleven words would appear on Sun marketing slides for the next decade.

Gosling described the motivation in a later interview: "The Java language was not intended to be a radical advance in programming language theory. We wanted to build something that just worked, that was reliable, that would let you write programs for devices you'd hand to your grandmother."

The design borrowed syntax from C and C++ but deliberately removed pointer arithmetic, operator overloading, multiple inheritance, and manual memory management, replacing them with garbage collection, a flat class-based object model, and strong typing.

A central innovation was the **JVM bytecode** instruction set, inspired in part by the P-code of UCSD Pascal and by Gosling's earlier work on Emacs (the Gosling Emacs dialect that became UniPress EMACS). Bytecode allowed programs to be distributed once and executed on any target, sidestepping the cross-compilation nightmare of the embedded world.

The \*7 was finished around September 1992, but Sun could not find a commercial market for it.

A pivot came in 1993 when **Time Warner** solicited bids for a set-top box for interactive television. The Green team — spun out in 1992 as a wholly-owned Sun subsidiary called **FirstPerson, Inc.** under **Wayne Rosing** — bid against Silicon Graphics' offering and lost.

A subsequent deal with 3DO also failed. By mid-1994, FirstPerson was effectively dissolved and folded back into Sun, and the Oak technology was looking for a new purpose.

That purpose appeared when Bill Joy, Naughton, and Gosling recognized that the nascent World Wide Web had almost exactly the properties the Green team had designed Oak for: heterogeneous machines, unreliable networks, executable content, and a security model that assumed the code came from an untrustworthy source.

In the summer of 1994, Naughton and Jonathan Payne wrote **WebRunner**, a web browser in Oak, which was soon renamed **HotJava**. HotJava could download and execute Java bytecode embedded in web pages — the first **applets**.

The applet security model — the **"sandbox"** — was a crucial piece of engineering. Applets ran under a `SecurityManager` that restricted file system access, network connections (typically limited to the host from which the applet was loaded), and access to system properties. The JVM's **bytecode verifier**, designed by Gosling and refined by Frank Yellin, statically proved type safety and stack well-formedness before any code was executed. These were genuinely novel ideas in 1995 for running untrusted code from strangers on the public internet.

Oak could not ship under that name: it was already trademarked by **Oak Technology**, a graphics-chip company.

According to the standard telling, a Sun marketing team led by Kim Polese brainstormed names at a Palo Alto coffee shop, and **Java** — a nod to the coffee Silicon Valley programmers were fueled by — beat out alternatives including "DNA", "Silk", and "Lyric". [CHECK: the coffee-shop detail is widely reported but variously described as happening at Il Fornaio in Palo Alto or a different café.]

The new name was adopted in early 1995. Kim Polese would later co-found Marimba, one of the most prominent early "push technology" Java startups, and became a fixture of the Java commercial ecosystem.

---

## 2. The public launch (1995-1996)

Sun publicly unveiled Java and HotJava at the **SunWorld** conference on **May 23, 1995** in San Francisco.

The most consequential piece of news that day, however, came from a separate announcement: **Marc Andreessen**, then head of Netscape, declared that **Netscape Navigator** would include a Java runtime and be able to execute applets inline in web pages.

That one endorsement transformed Java from yet another Sun research project into what appeared to be the programming language of the Web. Within six months, virtually every major software vendor had announced some kind of Java strategy.

Sun's **John Gage** coined the phrase "**The network is the computer**" around this time, a slogan that Sun had used before but that the Java launch gave genuine content. The idea was that programs, data, and computation itself would move fluidly across networks; Java was the execution fabric that made it possible.

The Java Development Kit **JDK 1.0** was released on **January 23, 1996**.

It contained about 212 classes in eight packages (`java.lang`, `java.io`, `java.net`, `java.util`, `java.awt`, `java.awt.image`, `java.awt.peer`, `java.applet`), an interpreter, a bytecode compiler (`javac`), an applet viewer, and the HotJava browser as a reference application.

The JDK shipped for Solaris and Windows 95/NT first, with Mac OS and other ports following. Binary downloads were distributed from `java.sun.com`, and the Sun website quickly became one of the most heavily trafficked developer resources on the early commercial web.

Java's commercial pitch was captured in Sun's ubiquitous slogan **"Write Once, Run Anywhere"** (WORA). The proposition: a program compiled to Java bytecode would run unchanged on any machine with a conforming Java Virtual Machine (JVM).

The reality, especially across AWT implementations on Windows, Mac OS 7/8, and Motif on Unix, quickly drew the retort **"Write Once, Debug Everywhere"**, a phrase that became so pervasive it appeared in trade press headlines by 1997. Differences in font metrics, window painting, threading model, and native look-and-feel meant that even "pure" Java GUIs needed significant per-platform testing.

The **Java Virtual Machine Specification**, co-authored by Tim Lindholm and Frank Yellin, was published in 1996 (first edition, Addison-Wesley, ISBN 0-201-63452-X) alongside **The Java Language Specification** (first edition) by James Gosling, Bill Joy, and Guy Steele (Addison-Wesley, ISBN 0-201-63451-1).

These two books formalized the platform in a way that distinguished Java from earlier portable-code systems like UCSD Pascal p-code: the language, the bytecode instruction set, the verifier, the classfile format, and the class loader were specified independently and could be re-implemented by third parties under license.

That tripartite specification — language, VM, class library — remains Java's distinctive architectural choice. It is what makes Scala, Kotlin, and Clojure possible: they target the JVM and class library without touching the Java language itself.

Early licensees of Java technology in 1995-1996 included **Netscape**, **IBM**, **Microsoft**, **Symantec**, **Borland**, **Oracle**, **Silicon Graphics**, and **Apple**.

IBM in particular would become one of the most important Java investors outside Sun, eventually shipping its own JVM (`J9`) and building the **WebSphere** application server business on top of the platform. IBM's investment extended to Eclipse (released 2001, donated to the Eclipse Foundation in 2004), which became the dominant Java IDE for more than a decade.

**Borland's JBuilder** and **Symantec Visual Café** were among the first serious commercial Java IDEs. **JetBrains IntelliJ IDEA**, first released in **January 2001**, would eventually become the dominant commercial Java IDE and the foundation for the company's later success with Kotlin and Android Studio.

---

## 3. Versions 1.0 through 1.4 (1996-2004)

**JDK 1.0 (January 23, 1996)** was minimal but sufficient to launch a developer movement. Its AWT ("Abstract Window Toolkit") wrapped native platform widgets, giving an unmistakable "Java program" look on each OS. Applets became the canonical demo: animated logos, stock tickers, small games, and interactive 3D.

**JDK 1.1 (February 19, 1997)** was a much larger release. It introduced:
- **Inner classes** (a significant language change).
- **JDBC** (Java Database Connectivity), modeled on Microsoft's ODBC.
- **RMI** (Remote Method Invocation), which extended the language with a network-transparent object-to-object call model.
- **JavaBeans**, a component model aimed at tool vendors.
- **Reflection** (`java.lang.reflect`), the ability to inspect and invoke classes and methods at runtime.
- **Serialization**, enabling RMI and persistent object graphs.
- A new event model for AWT based on listeners.
- **Internationalization** support through `java.text` and a cleaned-up character handling model built on Unicode 2.0.
- JAR (Java ARchive) files, the ZIP-based packaging format that remains standard.

**J2SE 1.2** was released on **December 8, 1998**, and rebranded as **"Java 2"** — Sun moved the platform away from the "1.x" numbering at the marketing level while keeping it in the version string.

Java 2 contained two pivotal additions:

1. **The Java Collections Framework**, largely designed by **Joshua Bloch** and influenced by the earlier work of **Doug Lea** (whose `collections` package had been a de facto standard since 1995). The Framework introduced `List`, `Set`, `Map`, and their standard implementations (`ArrayList`, `LinkedList`, `HashSet`, `TreeSet`, `HashMap`, `TreeMap`) along with the `Iterator` and `Comparator` interfaces. Bloch would later enshrine the design rationale in *Effective Java* (first edition 2001, ISBN 0-201-31005-8).
2. **Swing**, a lightweight (fully Java-drawn) GUI toolkit replacing AWT widgets. Swing was delivered through the JFC (Java Foundation Classes) and offered a pluggable look-and-feel system. It was slow initially but made it possible to build serious cross-platform desktop apps.

J2SE 1.2 also introduced a **Just-In-Time (JIT) compiler**, the `strictfp` floating-point keyword (to guarantee IEEE 754 semantics across platforms), Java IDL (CORBA integration), and weak references (`java.lang.ref`).

The Java 2 release also split the platform into three editions: **J2SE** (Standard Edition, the desktop and server baseline), **J2EE** (Enterprise Edition, the server-side stack that would ship in December 1999), and **J2ME** (Micro Edition, the mobile-and-embedded branch that would eventually run on hundreds of millions of feature phones).

J2ME in particular dominated mobile development in the late 1990s and early 2000s. **MIDP** (Mobile Information Device Profile) and **CLDC** (Connected Limited Device Configuration) provided a stripped-down runtime that shipped on Nokia, Motorola, Sony Ericsson, and countless other feature phones. Mobile games like *Snake II* and a generation of J2ME titles ran on this runtime until the iPhone (2007) and Android (2008) relegated it to history.

**J2SE 1.3 (May 8, 2000)** was a tuning release whose single biggest change was making the **HotSpot VM** the default JVM.

HotSpot, originally developed by **Longview Technologies** (founded by former Self researchers, acquired by Sun in 1997), used **adaptive optimization** — interpret first, profile, then aggressively compile hot paths — and largely refuted the "Java is slow" narrative.

The HotSpot C1 (client) and C2 (server) compilers became some of the most sophisticated production JIT compilers in the world. C2 in particular, led by **Cliff Click**, implemented a global value numbering / sea-of-nodes IR that remained state of the art for nearly two decades.

Other 1.3 additions included RMI over IIOP, the JavaSound API, and JNDI.

**J2SE 1.4 (February 6, 2002)** was the first release developed under the Java Community Process, shipped as **JSR 59**. Its highlights:
- `assert` keyword and assertions facility (JSR 41).
- `java.util.regex` — at-long-last built-in regular expressions, based on Perl 5 syntax.
- **NIO** — `java.nio` channels and buffers, including non-blocking sockets (JSR 51). This was Doug Lea's influence again and is the foundation of later high-performance server frameworks like Netty.
- **`java.util.logging`** (JSR 47).
- **JAXP** XML parsing (JSR 63), **XSLT**, and XML Schema support.
- **IPv6** support.
- A new exception chaining model (`Throwable.getCause`).

On the business side, this era was marked by the **Sun-Microsoft lawsuit**.

Sun sued Microsoft in October 1997 over Microsoft's **Visual J++** and **Microsoft JVM**, which had added non-standard language extensions — notably the `delegate` keyword and `J/Direct` for calling Windows APIs — while being marketed as "Java".

Sun argued this violated the trademark license and the "compatibility" requirements of the Java licensing agreement.

After a 2001 settlement, Microsoft paid Sun $20 million and was enjoined from shipping a non-compliant JVM; in January 2003 a second settlement added $1.6 billion and Microsoft effectively exited the Java market.

Microsoft's response was to invest heavily in a from-scratch competitor: **C#** and the **.NET Framework**, led by former Borland/Delphi architect **Anders Hejlsberg**, shipped in 2002. C# initially looked like a Java clone but rapidly diverged, eventually shipping generics with full reification (C# 2.0, 2005), LINQ (3.0, 2007), async/await (5.0, 2012), and other features that would put years of pressure on the Java language team.

Meanwhile, Java was becoming the language of enterprise computing.

**J2EE 1.2** (December 12, 1999) formalized **Servlets**, **JavaServer Pages (JSP)**, **Enterprise JavaBeans (EJB)**, JMS, JTA, and JNDI into a single platform specification.

EJB's complexity later became a cautionary tale, but in 1999 its promise of transactional, distributed, container-managed business objects made Java the natural successor to CORBA and DCOM for big-money back-end systems.

The J2EE ecosystem gave rise to a set of commercial application servers — **BEA WebLogic**, **IBM WebSphere**, **Oracle Application Server**, **Borland AppServer**, **JBoss** (open source, founded by Marc Fleury in 1999, later acquired by Red Hat in 2006) — that defined "enterprise Java" for a generation and made Java the default language of insurance companies, banks, airlines, and telecom back ends.

Alongside the official J2EE stack, the period 2002-2005 saw the rise of the "lightweight" backlash: **Rod Johnson's** book *Expert One-on-One J2EE Design and Development* (Wrox, 2002, ISBN 0-7645-4385-7) articulated the case against EJB 2.x and presented a simpler dependency-injection approach that became the **Spring Framework** (first release 1.0, March 2004). Spring, along with **Hibernate** (object-relational mapping, by Gavin King, 2001) and a handful of other POJO-based libraries, eventually displaced EJB as the dominant Java server programming model.

---

## 4. Java 5 Tiger (September 30, 2004) — the first major language overhaul

**J2SE 5.0**, codenamed **Tiger**, was released on **September 30, 2004**.

Sun took the opportunity to rename the marketing version from "1.5" to "5.0", though the `java.version` string remained "1.5.0" for many years to preserve tooling compatibility.

Tiger was the largest language change since Java 1.1 and arguably the largest of Java's entire history until Java 8. Its core feature set was tracked as **JSR 176** (the umbrella "Java SE 5 Platform" JSR).

**Generics (JSR 14)** were the marquee feature.

The design was led by **Gilad Bracha**, **Neal Gafter**, **Martin Odersky**, and **David Stoutamire**, building on Odersky and Phil Wadler's earlier **GJ** (Generic Java) prototype (Odersky and Wadler had published *Pizza into Java: Translating theory into practice* at POPL 1997).

Java generics are implemented via **type erasure** — generic type parameters are checked at compile time and erased to their bounds (usually `Object`) at runtime.

This choice preserved binary compatibility with pre-5 JARs at the cost of the runtime reification present in C# 2.0's generics, and gave rise to endless debates and the `ClassCastException`-in-disguise problem that Bracha himself later called "one of the worst language features in existence… that we had to ship." [CHECK: quotation paraphrased from Bracha's 2007 blog post "The Puzzler"]

The erasure decision would echo across the next twenty years of Java design: it made the wildcard type system (`List<? extends Number>`) necessary, it prevented array covariance from interacting cleanly with generics, and it motivated much of Project Valhalla's later "primitive classes" work.

The other Tiger headliners were:
- **Annotations (JSR 175)** — metadata on classes, methods, fields, parameters. `@Override`, `@Deprecated`, `@SuppressWarnings` were standard; user-defined annotations enabled an entire generation of frameworks (Spring, JPA, JUnit 4).
- **Enhanced for loop** — `for (String s : list)`, shorthand over `Iterable`.
- **Autoboxing / unboxing** — automatic conversion between `int` and `Integer`, etc.
- **Varargs** — `method(Object... args)`.
- **Enums** — proper `enum` classes (unlike C/C++ integer enums), each value a singleton instance with methods and fields.
- **Static imports** — `import static java.lang.Math.*`.
- **`java.util.concurrent` (JSR 166)** — Doug Lea's crown jewel. Executors, thread pools, `ConcurrentHashMap`, `CountDownLatch`, `Semaphore`, `CyclicBarrier`, `Future`, atomic variables, and the foundation of every multithreaded Java program since. Lea's book *Concurrent Programming in Java* (second edition, Addison-Wesley 1999, ISBN 0-201-31009-0) remains a reference text.
- **Scanner** class for simple input parsing.
- **`printf`** / formatted output (`String.format`).
- **JMX** (Java Management Extensions) standardized.

---

## 5. Java 6 (December 11, 2006) and Java 7 (July 28, 2011) — the Sun-to-Oracle transition

**Java SE 6 "Mustang"** (December 11, 2006) was a platform-polishing release with few language changes — Sun had learned from Tiger and chose to stabilize rather than stack more language features. Mustang's headline additions included:
- **Scripting (JSR 223)**, with the **Rhino** JavaScript engine bundled as the reference implementation.
- **JAX-WS (JSR 224)** for SOAP web services and **JAXB 2.0** (JSR 222) for XML binding.
- **JDBC 4.0** (JSR 221) with auto-driver-loading.
- **Compiler API (JSR 199)** — `javac` exposed as a library, enabling runtime compilation.
- **Pluggable annotation processing (JSR 269)**.
- **JConsole** moved into the JDK, and significant JVM monitoring improvements.
- Major garbage collector and HotSpot performance work.

At this point Sun was financially unwell. The dot-com crash had hit its workstation business hard; customers were migrating from Solaris/SPARC to Linux on commodity x86; and the strategy of "own the enterprise stack" struggled against free software. In **November 2006** Sun announced that it would release the JDK under the **GNU General Public License v2 with the Classpath exception**, giving birth to **OpenJDK**. The source went out in phases through 2006-2008. Red Hat then launched **IcedTea**, a downstream effort to build OpenJDK on a fully free toolchain, replacing the handful of proprietary "encumbered" components that Sun had not yet been able to release.

Sun's decline accelerated. On **April 20, 2009**, Oracle announced it would acquire Sun for approximately **$7.4 billion**; the deal closed on **January 27, 2010**. Java — along with Solaris, MySQL, ZFS, and Sun's SPARC business — became Oracle property. James Gosling resigned from Oracle on **April 2, 2010**, writing on his blog "I apologize to everyone. I cannot answer… There are too many issues." He later described the Oracle culture as incompatible with his own.

**Java SE 7 "Dolphin"** was released on **July 28, 2011**, the first Java release under Oracle. The six-year gap between Java 6 and 7 was the longest in Java's history and was caused by the Sun-to-Oracle transition, JCP politics, and the sheer scope of what had been queued up. Its language changes came under the umbrella of **Project Coin (JSR 334)**, which had solicited small language proposals from the community:
- **`try`-with-resources** — automatic resource management for `AutoCloseable` objects.
- **Diamond operator** — `new HashMap<>()` instead of repeating type parameters.
- **Multi-catch** — `catch (IOException | SQLException e)`.
- **Strings in `switch`**.
- **Underscores in numeric literals** — `1_000_000`.
- **Binary literals** — `0b1010`.
- **Simplified varargs warnings**.

Java 7 also introduced the **`invokedynamic`** bytecode (JSR 292, designed by **John Rose**), originally motivated by non-Java languages on the JVM (JRuby, Groovy) but foundational for Java 8's lambdas. Other 7 additions: the **Fork/Join framework** in `java.util.concurrent` (Doug Lea again), **NIO.2** (`java.nio.file`, the long-awaited fix for `java.io.File`'s flaws), and the **G1 garbage collector** (introduced experimentally).

The Oracle era also opened with a lawsuit: **Oracle v. Google**, filed **August 12, 2010**, alleged that Android's implementation of the Java APIs infringed Oracle's copyrights and patents. The case would wind through the courts for eleven years.

---

## 6. Java 8 (March 18, 2014) — the lambda revolution

**Java SE 8** shipped on **March 18, 2014** and is the release where, for many developers, Java finally "felt modern." The headline feature was **lambda expressions (JSR 335)**, work that Brian Goetz famously called the most invasive language change in Java's history. Lambdas had been discussed for nearly a decade; early community proposals (BGGA, CICE, FCM) in 2006-2008 had tried to solve the problem and all been contentious. Neal Gafter's BGGA proposal in particular drove a bruising community debate that contributed to his departure from Sun.

Mark Reinhold eventually restarted the effort under Oracle with Goetz as the lead language architect, and **JSR 335** (Lambda Expressions for the Java Programming Language) was approved. The final design used:
- **Functional interfaces**, single-abstract-method interfaces marked `@FunctionalInterface`.
- **Lambda syntax** `(x, y) -> x + y` that desugars via `invokedynamic` and `LambdaMetafactory` (no anonymous inner class allocation per invocation).
- **Method references** `String::length`, `System.out::println`.
- **Default methods on interfaces**, required so that `Collection.stream()` could be added to `java.util.Collection` without breaking every existing implementation. Goetz called default methods "interface evolution" — a deliberate tradeoff of purity for pragmatism.

Built on top of lambdas was the **Stream API (`java.util.stream`)**: lazy, potentially parallel pipelines of operations on collections. `list.stream().filter(...).map(...).collect(Collectors.toList())` became the new idiomatic Java. The related `Optional<T>` type offered a null-safe container, though its restricted API (no `Optional.get()` without checking) was a deliberate counter to Kotlin-style nullable types.

Java 8 also shipped **JSR 310: Date and Time**, a total replacement for the dysfunctional `java.util.Date` and `java.util.Calendar`. The API was designed by **Stephen Colebourne**, author of the excellent **Joda-Time** open-source library. `java.time.*` introduced `LocalDate`, `LocalTime`, `LocalDateTime`, `ZonedDateTime`, `Instant`, `Duration`, and `Period`, with explicit immutability and a clean separation of machine time from human time.

Other Java 8 features:
- **Nashorn**, a new high-performance JavaScript engine replacing Rhino.
- **`java.util.function`** — `Function`, `Predicate`, `Supplier`, `Consumer`, and so on.
- **`Map.forEach`**, `computeIfAbsent`, `merge`, and the rest of the Map default-method additions.
- **PermGen removal** — the HotSpot permanent generation was finally replaced by Metaspace, ending one of the most common sources of `OutOfMemoryError: PermGen space`.
- **Type annotations (JSR 308)** — annotations at any type position, enabling projects like the Checker Framework.

For the next decade Java 8 would remain the single most widely deployed version of Java in enterprise production, outliving multiple LTS releases in usage surveys and forcing library authors to maintain Java 8 compatibility well past its official end of public update support.

---

## 7. Java 9 (September 21, 2017) — the modules moment

If Java 8 was a triumph, **Java 9** was a painful and necessary transformation. Its headline feature was **Project Jigsaw**, delivered as the **Java Platform Module System (JPMS)** in **JSR 376** and a set of companion JEPs (Java Enhancement Proposals) starting with **JEP 200** (The Modular JDK) and **JEP 261** (Module System). Jigsaw had been in development since **2008** and had slipped Java 7 and Java 8; the Java 9 delivery was itself delayed by nine months and by a close-run rejection at the JCP Executive Committee in May 2017 before finally passing.

The module system introduced `module-info.java` descriptors, `requires`, `exports`, `opens`, and `uses`/`provides`, and split the JDK itself into about **95 modules**. It enforced strong encapsulation: code in a module could not see the internals of another module even via reflection without explicit `opens`. This had immediate consequences for existing libraries that had relied on reflective access into `sun.misc.*` and other internals, causing one of the largest adoption frictions Java ever experienced. The Jigsaw backlash — "nobody asked for this", in the common phrasing on `java-dev` and Hacker News — persisted for years. Libraries like ASM, Byte Buddy, Lombok, and most of the Spring ecosystem needed updates, and tools like Maven and Gradle needed significant rework.

Java 9 also delivered:
- **JShell (JEP 222)** — a real read-eval-print loop for Java, bringing the kind of interactive scratchpad that Python and Ruby had offered for decades.
- **Compact Strings (JEP 254)** — internal `String` storage changed from `char[]` (two bytes per char) to `byte[]` + encoding flag, saving memory for Latin-1 strings.
- **G1 as the default garbage collector (JEP 248)**.
- **Private methods on interfaces**.
- **Try-with-resources improvements** — final effectively-final variables usable directly.
- **Stream improvements** — `takeWhile`, `dropWhile`, `iterate` with predicate, `Optional.stream`.
- **Process API updates (JEP 102)** — `ProcessHandle`.
- **New HTTP/2 client (incubating)**.
- **Multi-release JARs (JEP 238)**.

The version scheme changed: Java 9 was officially `9.0.0`, not `1.9.0`. Mark Reinhold wrote up the new scheme in **JEP 223**.

---

## 8. The 6-month cadence (Java 10, 2018 onwards)

On **September 6, 2017**, just before Java 9 shipped, Mark Reinhold announced that Oracle would change Java's release cadence from "major release every few years" to a strict **six-month train schedule**. The text of the announcement (on mail.openjdk.java.net) described the motivation: "Developers want new features faster. Enterprises want stability longer. The only way to give both is to separate the two release streams."

Under the new model:
- A **feature release** ships every six months (March and September).
- Every **three years** (i.e., every sixth feature release) is designated an **LTS (Long Term Support)** release, receiving paid commercial support from Oracle for at least eight years.
- Oracle dropped major version numbers entirely: 10, 11, 12, 13, 14, 15, 16, …

The LTS releases to date are:
- **Java 11** — September 25, 2018
- **Java 17** — September 14, 2021
- **Java 21** — September 19, 2023
- **Java 25** — September 16, 2025 [CHECK: exact date]

In 2021 Oracle also reduced the LTS interval from three years to two years starting with Java 21, so Java 25 arrived after two years rather than three.

Non-LTS feature releases (10, 12, 13, 14, 15, 16, 18, 19, 20, 22, 23, 24) are production-quality but only supported until the next feature release, making them primarily a vehicle for **preview features** and **incubator modules**.

A preview feature is fully specified and implemented but subject to change in a future release; developers opt in with `--enable-preview`.

An incubator module is a non-final API in a `jdk.incubator.*` package — the API may change or disappear entirely.

Together these mechanisms let Oracle ship complex features (records, sealed classes, pattern matching, virtual threads, foreign function API) incrementally, gather feedback, and revise, without committing to permanent API shape until multiple releases later.

The preview mechanism was itself delivered through **JEP 12 (Preview Language and VM Features)**, which formalized the rules: a preview feature must be fully implemented, must survive at least one review cycle, and can only be marked final after Oracle is confident the community has had time to evaluate it.

---

## 9. Modern Java features (Java 11-25)

**Java 10 (March 20, 2018)** introduced **`var` local-variable type inference (JEP 286)**, a long-requested ergonomic improvement.

Parallel full GC for G1, application class-data sharing, and the experimental **Epsilon** no-op GC also shipped.

Java 10 was also the first release under the six-month cadence, a proof of concept that Oracle could actually ship a feature release on time.

**Java 11 (September 25, 2018)** — first LTS under the new cadence.

Finalized the **HTTP Client (JEP 321)** that had been incubating since Java 9. Removed Java EE modules (JAXB, JAX-WS, CORBA, Java Activation) from the JDK. Removed Nashorn (deprecated; fully removed in Java 15).

Added `String.strip`, `String.lines`, `String.repeat`, `Files.readString`, `Files.writeString`. Single-file source launch (`java Hello.java`) for scripting. **ZGC** and **Epsilon GC** became available on Linux.

Java 11 also removed Java Web Start and the browser plugin (JRE deployment infrastructure), closing the chapter on applets as a deployment mechanism.

**Java 12 (March 19, 2019)** — **Switch expressions (preview, JEP 325)** — arrow-form `case` labels, expressions that return a value, no fall-through. **Shenandoah GC** (experimental, contributed by Red Hat).

**Java 13 (September 17, 2019)** — **Text blocks (preview, JEP 355)**, triple-quoted multi-line string literals with automatic incidental-whitespace trimming. Dynamic CDS archives.

**Java 14 (March 17, 2020)** — **Records (preview, JEP 359)**. **Pattern matching for `instanceof` (preview, JEP 305)**. **Switch expressions (final, JEP 361)**. **Helpful NullPointerExceptions (JEP 358)** — the JVM now tells you which variable was null. **Packaging tool (incubator)**. Removal of the CMS garbage collector.

**Java 15 (September 15, 2020)** — **Sealed classes (preview, JEP 360)**. **Text blocks (final)**. **Hidden classes (JEP 371)**. **ZGC production-ready**. Nashorn removed. EdDSA (RFC 8032) support added.

**Java 16 (March 16, 2021)** — **Records (final, JEP 395)**. **Pattern matching for `instanceof` (final, JEP 394)**. **Unix-domain socket channels (JEP 380)**. **Migration of OpenJDK source to Git/GitHub (JEP 369)** — OpenJDK finally moved off Mercurial. Warnings for reflective access to JDK internals were made an error by default.

**Java 17 (September 14, 2021)** — second LTS.

**Sealed classes (final, JEP 409)**. **Pattern matching for `switch` (preview, JEP 406)**. **Strong encapsulation of JDK internals** became final. **Foreign Function & Memory API (incubator)**. Removal of the Applet API (deprecated). Removal of the security manager (deprecated for removal). Removal of the experimental AOT and JIT compiler (Graal integration dropped from OpenJDK 17).

Java 17 was the first LTS of the modern cadence to see broad enterprise adoption and was heavily marketed by Oracle as "the new Java 8".

**Java 18 (March 22, 2022)** — UTF-8 as the default charset (JEP 400), ending a decades-old portability trap. **Simple web server** (`jwebserver`, useful for testing and teaching). Vector API incubator (third round). Code snippets in Javadoc.

**Java 19 (September 20, 2022)** — **Virtual threads (preview, JEP 425)** — the first public preview of Project Loom, by **Ron Pressler** and team. **Structured concurrency (incubator, JEP 428)**. **Pattern matching for `switch` (second preview)**. Foreign Function & Memory API (preview). Linux/RISC-V port.

**Java 20 (March 21, 2023)** — iterative previews of virtual threads, pattern matching for switch, record patterns, and scoped values. A "bridge" release that set up Java 21's major finalizations.

**Java 21 (September 19, 2023)** — third LTS, widely considered the most important LTS since Java 8.

**Virtual threads (final, JEP 444)**. **Pattern matching for `switch` (final, JEP 441)**. **Record patterns (final, JEP 440)**. **Sequenced collections (JEP 431)** — at last a `SequencedCollection` interface that captures ordered-collection semantics (with `getFirst()`, `getLast()`, `reversed()`). **Generational ZGC (JEP 439)**.

**Key encapsulation mechanism API** (post-quantum crypto prep). **Unnamed patterns and variables (preview)**. **Unnamed classes and instance main methods (preview, JEP 445)** — a beginner-friendly `void main()` without a class wrapper. **String templates (preview, JEP 430)**.

Java 21 also delivered 32-bit x86 deprecation, Windows 32-bit removal, and the finalization of the Alpine Linux / musl port.

**Java 22 (March 19, 2024)** — **Foreign Function & Memory API (final, JEP 454)**, the culmination of Project Panama's multi-year incubation. **Unnamed variables and patterns (final, JEP 456)**. **Stream gatherers (preview, JEP 461)** — custom intermediate stream operations, finally filling the gap that `Collectors` could not. **Region pinning for G1 (JEP 423)**. **Statements before `super(...)` (preview)** — a subtle constructor-ordering relaxation.

**Java 23 (September 17, 2024)** — **String templates (removed)** — the preview was withdrawn after community feedback that the design needed more work; Brian Goetz wrote a long explanation on the mailing list about why a second attempt would be needed. **Primitive types in patterns (preview)**. **Module import declarations (preview)**. **Markdown documentation comments (JEP 467)**. ZGC generational mode became the default.

**Java 24 (March 18, 2025)** — continued previews of structured concurrency, scoped values, and the Panama/Valhalla threads of work.

**Key derivation function API (JEP 478)**. **Ahead-of-time class loading and linking (JEP 483)** — a first delivery from **Project Leyden**. Permanent disablement of the security manager. 32-bit x86 support deprecated for removal. Synchronized virtual threads finally stopped pinning carrier threads when entering `synchronized` blocks — a significant Loom performance fix.

**Java 25 (September 2025)** — fourth LTS. [CHECK: specific JEP contents of Java 25. As of this writing the feature list expected includes finalized **compact source files and instance main methods**, additional Leyden AOT work, stable values (JEP 502), and continued Panama finalization.]

---

## 10. Key OpenJDK projects

Major multi-year engineering efforts on the JVM are organized as **OpenJDK Projects**, each with its own mailing list, wiki, and repository line.

### Project Loom

Lightweight user-mode threads (virtual threads), structured concurrency, and scoped values. Led by **Ron Pressler**.

The core insight: most Java "thread-per-request" servers are blocked on I/O, not CPU, so the JVM can multiplex millions of logical threads onto a small pool of **carrier threads** using **continuations** at the bytecode level.

Loom's virtual threads (`Thread.ofVirtual().start(...)`) landed as final in Java 21. **Structured concurrency** (`StructuredTaskScope`) remains in incubator/preview as of Java 24 [CHECK]. **Scoped values** are a replacement for `ThreadLocal` suited to virtual threads.

Loom's design philosophy is "no colored functions" — a reference to Bob Nystrom's famous blog post on the async/await problem. Virtual threads allow ordinary blocking Java code (`InputStream.read()`, `Socket.connect()`, `Thread.sleep()`) to scale without the code looking any different from 1996-era Java I/O code. This is perhaps Loom's biggest philosophical bet: backward-compatible concurrency modernization.

### Project Panama

Native interoperability. Delivers the **Foreign Function & Memory API** (replacement for JNI that is safer, faster, and requires no native glue code), the **Vector API** (SIMD), and improved JNI.

FFM API went final in Java 22 as **JEP 454**. The Vector API remains incubator-only as of Java 24, pending integration with Valhalla's value types.

Panama also includes `jextract`, a tool that parses C headers and emits Java bindings automatically, replacing the traditional JNI-plus-SWIG workflow.

### Project Valhalla

Value types and **primitive classes** (formerly "inline classes"). The design target is closing the gap between object types and primitive arrays in memory layout and cache behavior.

Valhalla has been in development since 2014 and is still in development [CHECK: most recent preview state]. The most user-visible upcoming piece is **B3 / universal generics**, which would allow `List<int>` without boxing.

Brian Goetz has described Valhalla's goal as "codes like a class, works like an int" — value types should feel like ordinary Java classes but compile down to flat memory layouts with no object header and no reference indirection.

### Project Amber

Small-to-medium language evolutions. Amber delivered `var` (Java 10), switch expressions (Java 14), text blocks (Java 15), records (Java 16), sealed classes (Java 17), pattern matching for `instanceof` (Java 16), and pattern matching for `switch` (Java 21).

Amber is Brian Goetz's principal language-design venue. Its cumulative output over seven years has been the single largest language evolution effort since Tiger.

### Project Leyden

Static images and ahead-of-time compilation. Leyden's stated goal is to "shift computation" earlier — from run time into build time and warm-up time — to address Java's cold-start disadvantage.

First deliverables are AOT class loading and linking (Java 24, JEP 483). Mark Reinhold's 2020 proposal document described Leyden as aiming to produce "static images" that trade some of Java's dynamism (custom class loaders, reflection, dynamic agents) for much faster startup and smaller footprints.

### GraalVM

Originally a **research JIT** (Graal compiler, replacing C2) and later an entire polyglot runtime. Developed primarily at Oracle Labs under **Thomas Würthinger**.

**Native Image** (SubstrateVM, Oracle Labs) compiles Java bytecode to a standalone native executable with closed-world assumption, delivering sub-100ms cold starts at the cost of dynamic class loading and some reflection.

Native Image became the de facto solution to Java's "cold start" critique for serverless and CLIs before Leyden's in-JDK solution matured. Frameworks like **Quarkus**, **Micronaut**, and **Helidon** built their serverless-friendly identity around Native Image compatibility.

### Project CRaC (Coordinated Restore at Checkpoint)

Another Java startup approach, based on process-level checkpoint/restore (CRIU on Linux). A running JVM is paused, its state serialized, and then restored instantly in a new environment.

Azul shipped a CRaC-capable JDK; it is available in OpenJDK as well. CRaC, Leyden, and Native Image are complementary rather than competing — they attack the startup problem at different layers.

---

## 11. Key people

- **James Gosling** — "the father of Java." Canadian, Carnegie Mellon PhD (1983, dissertation on real-time constraints in a signal environment), lead designer of Oak/Java, a Sun Fellow. Left Oracle in 2010; later worked at Liquid Robotics and, since **May 2017**, at **Amazon Web Services** as a Distinguished Engineer. Author of the *Java Language Specification*.
- **Bill Joy** — Sun co-founder, author of `vi` and the BSD networking stack, co-author of *The Java Language Specification* (first edition). Joy contributed the overall "Java Environment" design vision to the Green Project and was a force behind Java's early technical direction.
- **Guy Steele** — Sun Fellow, designer of much of the formal specification of the language, co-author of *The Java Language Specification*. Earlier: **Scheme** (with Gerald Sussman), **Common Lisp** (editor of the standard), and **Fortress**. His 1998 paper *Growing a Language* is a deeply influential language-design meditation.
- **Gilad Bracha** — generics design lead (with Odersky, Gafter, Stoutamire), *Java Language Specification* co-author (second and third editions), later worked on **Dart** at Google, author of **Newspeak**.
- **Neal Gafter** — worked on inner classes, generics, and the BGGA closure proposal at Sun, later joined Microsoft and worked on **C#** language design including LINQ. Co-author of *Java Puzzlers* with Joshua Bloch (Addison-Wesley 2005, ISBN 0-321-33678-X).
- **Doug Lea** — SUNY Oswego professor, author of `java.util.concurrent` (JSR 166), the Fork/Join framework, `ConcurrentHashMap`, the `dlmalloc` allocator, and *Concurrent Programming in Java*. Long-time JCP Executive Committee member.
- **Joshua Bloch** — designed the Collections Framework at Sun, wrote *Effective Java* (first edition 2001, second 2008, third 2018, ISBN 978-0134685991) — still the most widely recommended Java book — and *Java Puzzlers*. Joined Google in 2004 as Chief Java Architect; later joined Carnegie Mellon.
- **Brian Goetz** — Java Language Architect at Oracle since approximately 2010, lead of Project Amber, author of *Java Concurrency in Practice* (Addison-Wesley 2006, ISBN 0-321-34960-1, with Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea). Goetz is the public voice of modern Java language design; his JEP writeups are the standard for language evolution documentation.
- **Mark Reinhold** — Chief Architect of the Java Platform Group at Oracle. Author of **JEP 1** (JEP process), driver of the six-month release cadence, lead of Project Jigsaw. Reinhold has been the most senior Java architect at Sun/Oracle since the mid-2000s.
- **Ron Pressler** — Project Loom lead, Oracle. Joined Oracle from Parallel Universe (maker of Quasar, a fibers library for Java that anticipated much of Loom's design). Pressler's writings on continuations and the problem of "colored functions" are reference material for the async/await debate across languages.
- **Alex Buckley** — JVM Specification and Java Language Specification lead, Oracle. Author of most modern editions of the JLS and JVMS.
- **John Rose** — MethodHandles, `invokedynamic` (JSR 292), the HotSpot server compiler. Leading HotSpot engineer at Sun and then Oracle.
- **Kirk Pepperdine** — performance tuning consultant, author of many Java performance talks and co-author of *Java Performance Tuning* resources, Java Champion.
- **Martin Odersky** — creator of **Scala**, Sun consultant on generics during the GJ era, co-designed Java generics with Bracha and Gafter. EPFL professor.
- **Heinz Kabutz** — publisher of *The Java Specialists' Newsletter* since 2000, Java Champion, a leading popularizer of JVM internals and concurrency subtleties.
- **Stephen Colebourne** — author of Joda-Time and lead designer of JSR 310 (`java.time`).
- **Rod Johnson** — author of *Expert One-on-One J2EE Design and Development* (2002) and founder of the **Spring Framework**, which provided the dependency-injection / POJO alternative to EJB and came to define enterprise Java in the 2000s.

---

## 12. The licensing saga

Java's license history is a pile of lawsuits, pivots, and careful open-source grants.

**1995-2006: proprietary with source available.** Sun published Java under its own licenses: you could read the source and build your own JDK, but commercial distribution required a paid Java license and a passing score on the **TCK (Technology Compatibility Kit)**. This was the legal framework for the Microsoft lawsuit: Microsoft had a license and then shipped a non-compliant runtime.

**2006-2007: GPL-ing.** At JavaOne 2006, Jonathan Schwartz and Rich Green announced that Sun would release Java under the GPL. The first drop was **November 13, 2006**, when Sun released HotSpot and `javac` under GPLv2. Full OpenJDK followed in 2007-2008. The license used is **GPLv2 with the Classpath Exception**, which permits linking non-GPL code against the class library without the viral obligation — necessary for Java to remain usable by proprietary applications.

**Red Hat IcedTea (2007).** Red Hat launched the **IcedTea** project to replace the few remaining "encumbered" components (audio engine, color management, JPEG decoder, graphics rasterizer, SNMP) that Sun had not yet been able to release. IcedTea became the upstream of OpenJDK in Fedora and RHEL, and the default Java in most Linux distributions.

**Apache Harmony (2005-2011).**

The Apache Software Foundation started **Apache Harmony** in 2005 as a clean-room, Apache-licensed Java SE implementation.

Sun refused to grant Harmony a TCK license on terms Apache could accept — Sun's terms prohibited running the TCK on a "field of use" outside certain platforms, which Apache argued violated the JCP rules.

The dispute festered for years. When Oracle acquired Sun and also refused the license, Apache's JCP delegate resigned from the Executive Committee in **December 2010**, publishing a statement that the JCP "is a JSPA violator and… is rendered largely irrelevant."

Harmony was retired in 2011. A significant portion of Harmony's class library, however, had already been forked into **Android**, which is what triggered…

**Oracle v. Google (2010-2021).**

Filed **August 12, 2010**, Oracle alleged that Google had copied the "structure, sequence, and organization" of 37 Java APIs in Android.

The case went to trial in 2012 before Judge William Alsup (who famously taught himself Java during the trial), who ruled that the APIs were not copyrightable.

The Federal Circuit reversed in 2014. A second trial in 2016 ruled that Google's use was **fair use**. The Federal Circuit reversed again in 2018.

The Supreme Court finally took the case and ruled on **April 5, 2021 (Google LLC v. Oracle America, Inc., 593 U.S. ___)**: 6-2 for Google, holding that Google's copying of roughly 11,500 lines of Java API declarations was **fair use** as a matter of law.

The opinion, written by Justice Breyer, explicitly declined to rule on the broader question of whether APIs are copyrightable, leaving that question technically open. The decision was hailed by most of the software industry as preserving the ability to independently reimplement APIs — a principle foundational to everything from GNU reimplementations of Unix to compatibility shims.

**Oracle's 2018 licensing change.**

In September 2018, Oracle changed the licensing of the **Oracle JDK** (its own distribution, as distinct from OpenJDK): Oracle JDK 11 and later were no longer free for commercial production use and required a paid Java SE Subscription. OpenJDK remained free under GPL+Classpath.

This move triggered a surge of interest in alternative OpenJDK distributions — **Eclipse Temurin (formerly AdoptOpenJDK)**, **Amazon Corretto**, **Azul Zulu**, **Red Hat build of OpenJDK**, **Microsoft Build of OpenJDK**, **SapMachine**, **BellSoft Liberica**, and others.

Each of these distributions builds the same OpenJDK source with minor patches and their own support SLAs. **Eclipse Temurin** (the rebranded successor to AdoptOpenJDK under the Eclipse Foundation's Adoptium project) became the de facto community default.

**Oracle's 2021 reversal.** Oracle partially reversed course in September 2021 with the **Oracle No-Fee Terms and Conditions (NFTC)** license, under which **Oracle JDK 17 and later** are free for all use (including commercial production) until one year after the next LTS is released. This means each LTS is effectively free under Oracle JDK for its first ~3 years and requires a subscription for longer support.

**2023 per-employee pricing.** In January 2023 Oracle changed its Java SE Subscription model from per-processor / per-user to **per-employee** — the subscription fee is calculated based on the total employee headcount of the subscriber regardless of how many use Java. This was widely criticized and drove further migration to alternative distributions.

---

## 13. JCP (Java Community Process)

The **Java Community Process** was founded in **December 1998** as Sun's attempt to share Java's evolution with the broader industry. Its core artifact is the **Java Specification Request (JSR)**, a proposal that goes through stages — submission, expert group formation, early draft review, public review, proposed final draft, and final release — and ultimately requires a passing **TCK (Technology Compatibility Kit)** and an **RI (Reference Implementation)**.

The JCP was governed by an **Executive Committee** (historically divided into "Java SE/EE" and "Java ME" committees, unified in 2012). Seats were held by industry representatives (IBM, Red Hat, SAP, Fujitsu, Intel, Nokia) and individuals (Doug Lea, Josh Bloch). The EC voted on every JSR's formal stages.

The JCP's most important structural tension was control: Sun (and then Oracle) always held veto power over the Java brand and the TCK, which meant a JCP vote could not actually force an outcome the steward rejected. This was the issue at the heart of the Apache Harmony dispute: even though the JCP rules said TCKs had to be available on reasonable terms without "field of use" restrictions, Sun attached such restrictions to the Java SE TCK, and the JCP had no mechanism to override that. When Oracle took over and maintained the restrictions, **Apache formally resigned from the JCP Executive Committee on December 9, 2010**, with a statement written by Geir Magnusson Jr.

Starting around **Java 9**, Oracle began routing Java SE evolution through **OpenJDK JEPs** rather than JSRs, with only the umbrella JSR (e.g., JSR 379 for Java SE 9) going through the JCP at the end. This shifted the real locus of design to openjdk.org mailing lists and the **JEP (JDK Enhancement Proposal)** process — defined in **JEP 1** and **JEP 2** by Mark Reinhold. JEPs are the primary planning artifacts for all modern Java changes.

---

## 14. Criticisms

Java has accumulated a durable set of critiques, some fair and some stereotypes.

**Verbosity.**

The canonical "Hello, World" in Java requires a class, a `main` method with full `public static void main(String[] args)` signature, and an import-less `System.out.println` call.

Preview features in Java 21 ("unnamed classes and instance main methods") are an explicit attempt to let beginners write just `void main() { println("hi"); }`. This was a direct response to educators complaining that Python, JavaScript, and even C could teach "print your first line" in a single expression, while Java forced students to confront visibility modifiers, static methods, and argument arrays before they could see output.

**XML configuration hell.**

The early J2EE era (2000-2006) was notorious for requiring thousands of lines of XML (`web.xml`, `ejb-jar.xml`, `application.xml`, `faces-config.xml`, Spring bean XML) for basic operations.

This gave rise to projects like **Spring** (which migrated to annotation-based configuration around 2.5), **Guice** (Bob Lee's lightweight DI framework at Google), and eventually **Spring Boot** (2014), which restored convention over configuration.

The satirical repository **FizzBuzzEnterpriseEdition** on GitHub, which implements FizzBuzz across dozens of classes with factories, strategies, visitors, and XML configuration, is a lasting artifact of this critique.

**Performance (pre-HotSpot).**

The very first Java implementations (JDK 1.0's Sun interpreter) were genuinely slow — ten to a hundred times slower than C — and the perception stuck even after HotSpot's adaptive compiler closed most of the gap in 1999-2001.

Modern Java on HotSpot (or Graal) is within a small factor of C++ for most workloads and faster than most dynamic languages by a wide margin. On CPU-bound numeric benchmarks, HotSpot-compiled Java is typically 1.2x-2x slower than well-tuned C++, and can match or exceed it on code that benefits heavily from inlining and escape analysis.

**Startup time.**

The JVM's cold-start cost (load ~2,000 classes, verify, interpret, warm up the JIT) is a real drawback for CLIs, serverless functions, and short-lived containers.

Solutions: **GraalVM Native Image**, **Project CRaC**, **Class Data Sharing** (CDS/AppCDS), **Project Leyden**, and ahead-of-time compilation. The gap is closing but has driven some workloads to Go or Rust in the 2020s.

**Memory footprint.**

Java's heap-plus-metaspace-plus-code-cache overhead, typically 100-300 MB for even a minimal Spring Boot service, has been another competitive weak spot versus native-compiled languages. Native Image compiled binaries typically use 30-50 MB resident memory for comparable functionality.

**NullPointerException.**

Java's reference types are all nullable, and the resulting `NullPointerException` is the most common exception in production Java logs.

Tony Hoare, who introduced null references in ALGOL W in 1965, called it his "**billion dollar mistake**" in a 2009 talk at QCon London. Kotlin, Scala, and C# have addressed this with non-nullable reference types at the type system level; Java has not yet done so, though the Checker Framework, NullAway, `@Nullable` / `@NonNull` annotations, and JSpecify (2020-present) have provided partial solutions.

**"Enterprise Java" cultural stereotype.**

Java's association with FactoryFactoryBeanProviderFactory patterns, five-layer application architecture, and extremely long class names became an industry joke that obscured the fact that modern Java (Java 8+) can be remarkably concise and functional. The stereotype has persisted longer than the reality warrants, in part because the enterprise codebases it describes are still in production and still being maintained.

**Oracle stewardship concerns.**

Since 2010 there has been ongoing nervousness in the community about Oracle's commercial priorities versus Java's open-source commitments.

The 2018 commercial license change and the 2023 per-employee pricing were the most prominent flashpoints. On the other hand, Oracle has simultaneously delivered the most significant technical modernization in Java's history (the six-month cadence, Loom, Panama, Valhalla, Amber, Leyden), and OpenJDK itself remains firmly free software.

The tension between Oracle's commercial instincts and the JDK's open-source reality defines modern Java's governance: every major release is an OpenJDK release first, a Temurin/Corretto/Zulu release second, and an Oracle commercial release third.

---

## 15. Java today

By 2025, Java is three decades old and sits in a peculiar position: no longer fashionable, more heavily used than ever, and modernizing faster than at any prior point in its history.

**The server.**

Java remains the dominant language for enterprise back-end computing.

**Spring Boot**, **Micronaut**, **Quarkus**, and **Helidon** define the microservices space. Major application servers (WildFly, Open Liberty, WebSphere, WebLogic) continue to run trillions of transactions per day.

Jakarta EE, the successor to Java EE transferred from Oracle to the Eclipse Foundation in 2017, provides the standardized enterprise specs. The rename from "Java EE" to "Jakarta EE" was required because Oracle retained the "Java" trademark; the `javax.*` package namespace moved to `jakarta.*` in Jakarta EE 9 (2020), forcing a coordinated migration across the entire enterprise ecosystem.

**Big data and streaming.**

Essentially all of the open-source big-data ecosystem runs on the JVM: **Hadoop**, **Apache Spark** (Scala on JVM), **Apache Kafka**, **Apache Flink**, **Apache Cassandra**, **Elasticsearch** / **OpenSearch**, **Apache Pulsar**, **Trino/Presto**, **Apache Druid**, **Apache Beam**.

This is probably the single largest production footprint of JVM code outside of traditional enterprise servers. It is also the reason why Java's garbage collectors (G1, ZGC, Shenandoah) receive outsized investment: terabyte heaps, low-pause latency, and long-running JVM processes are the exact workloads these collectors were designed for.

**Android.**

From 2008 to 2017 Java was the primary language of Android app development, though Android used a custom bytecode format (Dalvik, later ART) and its own class library derived from Apache Harmony.

In 2017 Google declared **Kotlin** a first-class Android language at Google I/O, and in 2019 it was declared the **preferred** language for Android.

As of 2025 Kotlin has largely supplanted Java for new Android development, though the underlying runtime remains a Java-compatible VM executing Java-style bytecode.

Google's gradual migration also reflected the Oracle v. Google lawsuit's long shadow: even after the Supreme Court's 2021 fair-use ruling, Google had strong incentives to move off Java APIs onto a language whose ecosystem it effectively controlled via JetBrains.

**Finance.**

High-frequency trading, risk management, and core banking systems run heavily on Java. Firms like Goldman Sachs, Morgan Stanley, Deutsche Bank, Bloomberg, and LMAX (whose **Disruptor** pattern became a case study in low-latency JVM programming) are major Java shops.

Jane Street is the famous OCaml exception; Citadel and Jump Trading use a mix including C++ and Java. LMAX Disruptor publications (Martin Thompson et al.) are foundational reading on mechanical sympathy.

Azul Systems' **Zing** JVM, with its pauseless C4 collector, is widely deployed at financial firms that need single-digit-millisecond worst-case GC pauses on multi-terabyte heaps.

**The multi-language JVM.**

One of Java's most underappreciated successes is its role as a substrate for other languages:
- **Scala** (Martin Odersky, 2003) — statically-typed functional/OO hybrid, powers Spark, Akka, the Twitter tech stack historically.
- **Kotlin** (JetBrains, 2011) — concise, nullable-aware, now the primary Android language.
- **Clojure** (Rich Hickey, 2007) — Lisp dialect, immutable-first, popular in finance and data engineering.
- **Groovy** (James Strachan, 2003) — dynamic language, still used in Gradle builds.
- **JRuby**, **Jython**, **Rhino/Nashorn**, and dozens of smaller languages.
- Even Erlang-style actor systems (Akka) and functional reactive frameworks (Reactor, RxJava) found their best implementations on the JVM.

The **Truffle framework** and **GraalVM** extended this further: Truffle-based language implementations (JavaScript, Python, Ruby, R, WebAssembly, LLVM) run on Graal and can be mixed in a single process.

**Surveys.** Java consistently ranks in the top 3-5 programming languages in industry surveys. The **TIOBE index** has placed Java at #1 for most of the 2000s and 2010s, slipping to #2 or #3 behind Python by the early 2020s. The **Stack Overflow Developer Survey** has consistently reported Java as among the most-used languages, with ~30-35% of professional developers using it. The **JetBrains Developer Ecosystem** survey (2023) reported approximately 9.4 million professional Java developers worldwide, up from ~7 million in 2017. GitHub's Octoverse reports Java as a top-5 language by pull requests every year since the report began.

**The modern Java developer experience.** A 2024-era Java program using records, sealed types, pattern matching, virtual threads, text blocks, the foreign function API, and `var` looks almost nothing like Java 1.4. Many of the stereotypes (verbosity, ceremony, null pointer pain) are being addressed one JEP at a time. Brian Goetz has summarized the modernization philosophy as "moving Java forward without leaving anyone behind" — every change must preserve binary compatibility with decades of existing code, every feature must interoperate with every other feature, and the language must remain teachable.

James Gosling, speaking at JavaOne 2023, summarized his view: "I never would have predicted this. The thing has legs I never imagined. It's because of the people — the community, the engineers, the folks who keep making it better without breaking it. That's the miracle." [CHECK: quotation is reconstructed from reports rather than verbatim transcript.]

Java at 30 is not the language of the Web that Sun promised in 1995. It is something unexpected: the operating system of enterprise computing, the substrate of modern data infrastructure, and — quietly, against all the jokes — a language still evolving at a pace that puts most of its competitors to shame.

---

*End of document.*
