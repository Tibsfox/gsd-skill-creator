# Lisp: A History and Philosophy

*The philosophical spine of the LSP research project. Companion to PCH, PRL, RXX, FOR, and CEE.*

---

## Preface

Lisp is not a programming language. Or rather, Lisp is a programming language in the way that a cathedral is a pile of stones: technically accurate, wildly insufficient. Lisp is an idea about what computation could be, a mathematical object that happened to run on machines, a cultural movement that shaped half a century of computing, and — more quietly — a philosophical stance about the relationship between thought, symbol, and execution. It is the second-oldest high-level programming language still in use. It is the language that invented, or first popularized, more of the features you take for granted than any other: garbage collection, conditional expressions, recursion as a first-class idiom, dynamic typing, first-class functions, the read-eval-print loop, tree data structures as a native representation, self-hosting compilers, metaprogramming, macros, closures, continuations, dynamic dispatch, the interactive development environment, and — most importantly — the idea that a language could be a laboratory for its own design.

This document traces that idea from its roots in Alonzo Church's lambda calculus of the 1930s, through John McCarthy's 1958 memo at MIT, through the MIT AI Lab and the Lisp Machine wars, through the Common Lisp unification and the AI winter, through Paul Graham's startup manifestos and Rich Hickey's Clojure renaissance, and into the long echo that reaches every modern language. It is the longest and most ambitious history we have written in this series so far, because Lisp deserves the depth. Lisp has been declared dead more times than any other language, and every one of those declarations has been premature. Every generation of programmers rediscovers Lisp and reports back that the old-timers were right — that there is something here that the mainstream kept not-quite-copying.

The goal here is not to convert you. Lisp does not need converts. The goal is to tell the story accurately enough that, years from now, you can come back and remember what Lisp was and why it mattered.

---

## 1. Pre-history: The Lambda Calculus

Before there was Lisp, there was a notation. Before there was a notation, there was a problem: what does it mean for a function to be computable? This question had been drifting through mathematical logic since the late nineteenth century, hardened by the crisis of foundations that followed the discovery of Russell's paradox in 1901, and came to a head in the 1930s when three mathematicians — Alonzo Church, Alan Turing, and Kurt Gödel — each produced independent formal answers within a span of about three years. Their answers turned out to be equivalent in power, which is now called the Church-Turing thesis. But the three notations were very different, and the differences mattered. Turing's answer was a machine. Gödel's answer was an encoding scheme for recursive functions. Church's answer was a notation so simple it could be written on a napkin: the lambda calculus.

### Church and Princeton

Alonzo Church was born in Washington, D.C. in 1903. He studied at Princeton under Oswald Veblen, took his doctorate in 1927, and joined the Princeton faculty in 1929. The Princeton mathematics department in the 1930s was, along with Göttingen in Germany and Cambridge in England, one of the three great centers of mathematical logic in the world. Church's colleagues and students included, at various times, John von Neumann, Kurt Gödel (after Gödel fled Austria), Stephen Cole Kleene, J. Barkley Rosser, and the young Alan Turing (who arrived in 1936 as a graduate student). It was an astonishing concentration of talent working on a single problem: the formal foundations of mathematics, post-Hilbert, post-Russell, post-Gödel.

Church's particular obsession was what would later be called the Entscheidungsproblem — David Hilbert's 1928 challenge to produce a decision procedure for first-order logic, an algorithm that could determine, for any given statement in a formal system, whether that statement was a theorem. Hilbert believed such a procedure must exist. By 1930 Gödel had already shown that no complete and consistent formal system could prove its own consistency (the incompleteness theorems), which cast serious doubt on Hilbert's broader program, but the Entscheidungsproblem remained open. Church wanted to settle it.

To settle a question about decidability, you need a formal definition of decidability — a rigorous mathematical account of what it means for something to be "computable by a definite procedure." In the early 1930s, no such account existed. There were intuitions, and Gödel's class of "general recursive functions" gave one candidate, but no one was certain that general recursion captured the full notion of effective computation. Church set out to build his own formalism, one that would let him prove things about functions by manipulating them symbolically. The result, developed between 1932 and 1935, was the lambda calculus.

### The lambda notation

The lambda calculus is astonishing in its simplicity. It has exactly three constructs:

1. **Variables:** `x`, `y`, `z`, and so on.
2. **Abstractions:** `λx.M`, where `M` is any lambda term. This is read "the function that takes `x` and returns `M`." The `λ` (lambda) is a binding operator, like `∀` or `∃` in first-order logic.
3. **Applications:** `(M N)`, where `M` and `N` are lambda terms. This means "apply the function `M` to the argument `N`."

That is the entire syntax. There are no numbers, no booleans, no data structures, no control flow, no types. Everything is a function, and every function takes exactly one argument and returns exactly one value. From this bare foundation, Church and his students showed how to encode the natural numbers (the Church numerals: `0 = λf.λx.x`, `1 = λf.λx.(f x)`, `2 = λf.λx.(f (f x))`, and so on — an integer `n` is a function that takes a function and applies it `n` times), the booleans, pairs, lists, conditionals, and ultimately anything that can be computed. The encoding of `n + 1` in Church numerals is the elegant `λn.λf.λx.(f ((n f) x))`.

The calculus has two rules of computation, called conversions. **Alpha conversion** says that the name of a bound variable does not matter — `λx.x` and `λy.y` are the same function, you can rename bound variables freely as long as you do not collide with free ones. **Beta conversion** — the only real computation rule — says that `((λx.M) N)` reduces to `M` with every free occurrence of `x` replaced by `N`. That is it. That is the entire theory of computation, as a symbol game. You write down a term and you beta-reduce until you cannot reduce further. If you reach a terminal form (a normal form), the function has "returned a value." Some terms never reach normal form; those correspond to nonterminating programs. Church showed that the question "does this term have a normal form?" is undecidable.

Church's 1936 paper, *An Unsolvable Problem of Elementary Number Theory*, used lambda-definability as the formal standard for "effectively calculable" and proved that the Entscheidungsproblem had no solution. A few months later Alan Turing, who had been Church's student for a year by then, published his own proof using a different formalism: an imaginary machine with a tape and a finite-state controller. Turing's paper (*On Computable Numbers, with an Application to the Entscheidungsproblem*, 1936) reached the same negative conclusion. Crucially, Turing also proved that the two formalisms — lambda-definability and Turing-machine computability — defined exactly the same class of functions. Add Gödel's general recursive functions, proved equivalent by Kleene a few years later, and you have what is now called the Church-Turing thesis: all three formalisms capture the same intuitive notion of effective computability, and so (the thesis says) does any other reasonable formalism anyone is ever likely to propose. The thesis has never been disproved. No one has ever found a notion of "computable" that does more than the lambda calculus does.

### Why lambda mattered

It is hard to overstate how abstract the lambda calculus was in 1936. There were no computers. Konrad Zuse was still building mechanical relay machines in Berlin. ENIAC would not be built for another decade. Church was doing pure mathematics — his lambda calculus was a logical symbol game with no physical referent, a notation for talking about functions as objects that could be passed around, composed, and transformed. In retrospect, it was the first programming language. But no one thought of it that way at the time, least of all Church.

What the lambda calculus got right, and what made it the theoretical grandparent of Lisp, were three things that would turn out to be enormously powerful once anyone tried to run it on a machine:

1. **Functions are first-class citizens.** A function is just another term, no different from a variable or an application. You can pass a function as an argument to another function (this is what `((λf.(f f)) (λx.x))` does: it applies the identity function to itself). You can return a function as the result of another function. You can build functions out of other functions. There is no distinction, as there is in later "imperative" languages, between "things the language operates on" and "the operations themselves." Everything is the same kind of thing.

2. **Anonymous functions exist.** A lambda term is a function without a name. In Fortran, which was being designed at roughly the same time Lisp was, every function had to be declared with a name at top level. In the lambda calculus, you could write down a function inline wherever you needed one. This seems trivial and is not; it is the whole reason closures and higher-order programming feel natural in Lisp and painful in languages that lack them.

3. **Binding and substitution are explicit and formal.** Because the calculus has to define beta reduction precisely, it has to handle the scoping of variables precisely. This leads inexorably to the concepts that would later be called lexical scope, alpha-equivalence, and free-versus-bound variables — the bedrock of every language that cares about closures.

Church's formalism sat in the mathematical literature for twenty years, consulted mostly by logicians studying computability theory and by the emerging community of type theorists. Haskell Curry extended Church's work in the 1940s and 1950s into what became combinatory logic. Robert Feys, Joachim Lambek, Dana Scott, and others built on it. It was not the only theoretical model of computation, and it was not even the most popular — Turing machines were more intuitive, recursive function theory was more connected to number theory — but it persisted.

### McCarthy's realization

In 1956 a young mathematician named John McCarthy was at Dartmouth College, three years out of his Princeton PhD (where he had studied partial differential equations under Solomon Lefschetz, but had taken Church's logic courses and absorbed the lambda calculus). McCarthy was working on what he was calling "artificial intelligence" — a term he was about to coin publicly — and specifically on the problem of how a program could represent facts about the world and draw conclusions from them. The target domain was commonsense reasoning: could a machine be given knowledge that "the airport is in San Francisco" and "Palo Alto is forty miles south of San Francisco" and conclude on its own that someone who wanted to fly from Palo Alto needed to go north?

McCarthy wanted a language suited to this kind of reasoning. Fortran was being born at IBM — John Backus had started the project in 1954, and Fortran I would ship in 1957 — but Fortran was designed for numerical computation, for the matrix-and-formula work that occupied most scientific programming at the time. Its data structures were arrays of numbers. Its control flow was GOTO and the DO loop. It had no provision for symbols, for trees, for recursion (early Fortran explicitly forbade recursion, because the runtime model did not support a call stack), or for anything like the logical-deduction reasoning McCarthy needed. McCarthy wanted to manipulate symbolic expressions — formulas, logical assertions, linked data structures, trees — as first-class entities.

He started sketching a list-processing language. The initial motivation was the tree-shaped data; the recursive-function structure of the language came out of the observation that if your data is a tree, your natural processing idiom is a recursive walk over the tree, and if your language does not support recursion you are going to have a bad time. McCarthy had used Church's lambda notation in his own mathematical work, and it occurred to him that lambda was exactly what he needed for describing anonymous recursive functions that walked over tree structures. He could write:

```
(lambda (x) (if (atom x) x (cons (first x) (rest x))))
```

and have a function-without-a-name that could be passed around, applied, and composed, exactly like Church's terms. This was the first moment where anyone seriously proposed using the lambda calculus as a programming notation rather than as a logic. It was not obvious that this should work. The lambda calculus was a mathematical object with no regard for efficiency, environment, or implementation. Nobody had ever tried to run one on a machine.

But McCarthy had a second, stranger idea, one that would turn out to be the real conceptual breakthrough. He noticed that if you used parenthesized lists to represent everything — not just data, but the program itself — then the syntax for writing a program and the syntax for writing the data the program operates on were the same syntax. A program was a tree of lists. A data structure was a tree of lists. You could take a program, treat it as data, manipulate it like data, and then hand it back to the interpreter and run it. This was **homoiconicity**, a word that would not be coined until much later (Calvin Mooers and Peter Deutsch used it in the 1960s in connection with TRAC, another homoiconic language of the era), but the concept was there from the beginning.

McCarthy also realized something that he would only fully appreciate after the fact. If you wrote the interpreter for your language *in the language itself*, then the interpreter was a program, the program was data, and you could study the semantics of the language by studying a short piece of code in the language. You could, in principle, write a Lisp interpreter in Lisp, and that interpreter would both define the language and provide a way to extend it. This is the **meta-circular evaluator**. McCarthy wrote one as part of his 1960 paper, and it fit on roughly a page. Alan Kay, decades later, would call it "the Maxwell's equations of software." Paul Graham would call it "the shortest formal definition of a Turing-complete programming language in existence."

We will return to all of these threads. For now, note only this: the lambda calculus was a pure theoretical object invented for the Entscheidungsproblem. Church did not imagine it as a programming language. No one imagined any theoretical formalism as a programming language, because there were no programming languages to imagine it as. In 1956, McCarthy looked at the lambda calculus and saw, for the first time, that it could be run. The history of Lisp — and a great deal of the history of programming language theory — is the history of what it meant to take Church seriously.

---

## 2. John McCarthy and the Birth of Lisp

### Dartmouth, summer 1956

The story of Lisp proper begins at Dartmouth College in the summer of 1956, at what is now called the Dartmouth Summer Research Project on Artificial Intelligence. John McCarthy, then an assistant professor of mathematics at Dartmouth, had spent the previous year lobbying the Rockefeller Foundation for a two-month workshop to bring together the small group of researchers interested in what he wanted to call "artificial intelligence." The phrase was McCarthy's. He had coined it deliberately, in the 1955 funding proposal, because he wanted a term that was uncoupled from existing academic fields: not "automata studies," not "complex information processing," not "cybernetics," not "thinking machines." Just "artificial intelligence." The proposal, coauthored with Marvin Minsky (Harvard), Nathaniel Rochester (IBM), and Claude Shannon (Bell Labs), opened with what has become one of the most cited sentences in computing history:

> "The study is to proceed on the basis of the conjecture that every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it."

The conference itself, which ran from late June to mid-August 1956, was a disappointment in many ways. The attendees drifted in and out on their own schedules. There was no coordinated agenda. Allen Newell and Herbert Simon showed up from RAND with a working program — the Logic Theorist, which had already proved several theorems from Russell and Whitehead's *Principia Mathematica* — and stole the show, because they were the only ones with running code. The rest of the participants had ideas and no implementations. But the conference coined the term "artificial intelligence," gathered the people who would define the field for the next three decades, and launched McCarthy personally toward the problem that would occupy him for the rest of his career: how to build a language for expressing intelligent programs.

McCarthy left Dartmouth in 1958 for MIT, where Marvin Minsky was now also based. MIT in 1958 was the right place for computer science — the Whirlwind and TX-0 and TX-2 machines were running, the Research Laboratory of Electronics was a hub of early work on time-sharing and interactive computing, and the new IBM 704 at MIT was one of the most powerful machines in the world. McCarthy joined the staff of the RLE and cofounded, with Minsky, what was initially called the MIT Artificial Intelligence Project, later the AI Lab. He began work on his list-processing language almost immediately.

### The 1958 AI memo

The first formal description of Lisp appeared as AI Memo No. 8 of the MIT AI Project, dated September 1958: *An Algebraic Language for the Manipulation of Symbolic Expressions*. It was short. It sketched the syntax (parenthesized lists), the data type (S-expressions, where S was for "symbolic"), and the primitive operations. The full exposition would come in AI Memo No. 1 of a renumbered series, dated March 1959, and the canonical publication was McCarthy's 1960 paper in *Communications of the ACM*: **"Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I."** ("Part II" was planned but never written; the paper was self-contained enough that it did not need a sequel.)

The 1960 paper is one of the great documents of computer science. It is twenty-odd pages long. It defines the S-expression data type, the primitive functions `atom`, `eq`, `car`, `cdr`, and `cons`, the special forms `quote`, `cond`, and `lambda`, and the recursive function definitions built out of these. It then does something unprecedented: it presents the function `eval` — an interpreter for the language, written in the language itself. The entirety of Lisp's semantics is specified by a single recursive function, `eval`, of about a page of code. Apply `eval` to a well-formed S-expression, and you get the value that expression evaluates to. Apply `eval` to a function definition, and you get a callable function. Apply `eval` to the definition of `eval` itself, and you get back `eval`. The definition is self-sustaining. Paul Graham has argued, not unreasonably, that this single page of code is the most influential document in the history of programming languages, because everything that came afterward either adopted its ideas (higher-order functions, recursion, garbage collection, symbolic manipulation) or measured itself against them.

The paper's style is pure mathematics. McCarthy was a mathematician who wanted to describe a language, not an engineer who wanted to build one. The "program" he wrote was a theoretical artifact, something to prove properties about, not something to run. The paper explicitly says as much: "The advantage of LISP over other formalisms is that it is capable of being a programming language as well," and goes on to note that an implementation on the IBM 704 is underway at MIT but is separate from the formalism. For McCarthy, the point of the paper was the formalism. The implementation was a nice side effect.

### Steve Russell and the accident of implementation

The actual implementation of Lisp — what made Lisp run on a machine — happened not because McCarthy decided to build it but because one of his students decided to build it in spite of him. The student was Steve Russell, a graduate student at MIT who is now more famous for writing *Spacewar!*, the first widely-distributed video game, on the PDP-1 in 1962. In 1959-1960, Russell was working for McCarthy on the Lisp project.

McCarthy had written down `eval` in his paper as a piece of mathematics, and Russell was studying it. At some point in the winter of 1959-1960, Russell had a realization: this `eval` function was not just a mathematical curiosity. It was, in principle, a recipe for executing Lisp programs. If you wrote a program in machine code that did what `eval` did — parsed an S-expression, looked up the operator, applied the appropriate primitive, recursed on the arguments — then you had a Lisp interpreter. Russell went to McCarthy and suggested this. McCarthy, in an interview decades later, recalled his response with rueful amusement:

> "Steve Russell said, look, why don't I program this eval, and I said to him, ho, ho, you're confusing theory with practice, this eval is intended for reading, not for computing. But he went ahead and did it. That is, he compiled the eval in my paper into IBM 704 machine code, fixing bugs, and then advertised this as a Lisp interpreter, which it certainly was. So at that point Lisp had essentially the form that it has today."

This is one of the great quotes in computing history, and it captures something important about the character of Lisp. The language was invented twice: once as a mathematical formalism by McCarthy, and then again, a few months later, as a working program by Russell — a program that McCarthy himself had not intended to write. The Russell implementation turned `eval` from a specification into an executable. It was the moment Lisp became a programming language and not just a notation.

Russell's implementation, running on the IBM 704 at MIT, was the first Lisp system. It was followed quickly by implementations on other machines — the IBM 7090, the Q-32 at System Development Corporation, various machines at BBN and elsewhere. By 1962 there was a coherent dialect called LISP 1.5, documented in McCarthy's *Lisp 1.5 Programmer's Manual* (coauthored with Paul Abrahams, Daniel Edwards, Timothy Hart, and Michael Levin — the MIT group that had been working on the system), which became the canonical early Lisp. LISP 1.5 was also the first Lisp to be widely distributed: MIT handed out the manual and the source code, and implementations spread to BBN, Stanford, Carnegie Tech, and Europe. By the mid-1960s, Lisp was in use at essentially every serious AI research site in the world.

### CAR, CDR, and the IBM 704

Everyone who learns Lisp eventually asks: why are the primitive list operations called `car` and `cdr`? These are almost the only things about Lisp that look irrational. `car` returns the first element of a list; `cdr` returns everything else. But nothing about the names "car" and "cdr" suggests "first" or "rest." The names are an accident of hardware.

The IBM 704, the machine on which Lisp was first implemented, had a 36-bit word. Instructions on the 704 included two 15-bit address fields, called the "address" and the "decrement," plus 3-bit prefix and tag fields. When McCarthy and Russell implemented the Lisp cons cell — the fundamental pair from which all lists are built — they used a single 704 word to hold two pointers: one in the address field and one in the decrement field. The primitive to extract the first pointer (the "head" of the pair) was named `car`, for "Contents of the Address part of the Register." The primitive to extract the second pointer (the "tail") was named `cdr`, for "Contents of the Decrement part of the Register." The names were chosen for the hardware, and they stuck even when Lisp was moved to machines that had no such registers. The IBM 704 was retired decades ago. Every Lisp in the world still calls these functions `car` and `cdr`. A few dialects added `first`/`rest` or `head`/`tail` as aliases. Almost nobody uses them. The community keeps the historical names because the historical names are part of what Lisp is.

A side benefit of the 704 word layout was that you could compose `car` and `cdr` arbitrarily into functions like `cadr` (the car of the cdr, i.e. the second element), `cddr` (the cdr of the cdr, i.e. everything after the first two), `caddr` (the third element), and so on. These compound forms are still in Common Lisp and are still idiomatic for short list accesses. `cadr` reads aloud as "cadder," `caddr` as "cad-er," `cadddr` as "cad-dd-er." To an outsider it looks like line noise. To a Lisp programmer it is a terse and precise notation for traversing tree structures. The first time you read `caadr` and realize it means "the car of the car of the cdr" — the first element of the first element of the tail of a list — you either love Lisp or you don't.

### The innovations

Lisp in its first five years invented, or first shipped, a remarkable number of features that had not appeared in any previous programming language and that would spread to virtually every later language:

**Garbage collection.** The original Lisp had to deal with a problem that Fortran did not: cons cells were allocated dynamically as programs ran, and there was no obvious moment at which to reclaim them. McCarthy invented, and the MIT group implemented, the first garbage collector in any programming language: a mark-and-sweep collector that would pause the program when memory ran low, trace all reachable cells from the root environment, mark them as live, and sweep up the rest. McCarthy's 1960 paper describes this in passing as "the erasing problem." Today every mainstream language except C and a few of its close relatives has garbage collection; Lisp had it first.

**Conditional expressions.** Before Lisp, control flow in high-level languages was entirely statement-based. Fortran had `IF` statements and `GOTO`. COBOL had `IF`/`ELSE` blocks. Algol 58 and 60 would add structured `if`/`then`/`else` statements, but they were still statements — they did not return values. McCarthy introduced the idea of a *conditional expression*: an `if` or `cond` form that evaluated to a value, like an arithmetic expression. The form `(cond (test1 value1) (test2 value2) ...)` evaluates each test in turn and returns the value corresponding to the first true test. This is the ancestor of every ternary operator, every pattern match, every `if`-expression in every modern language. It is an innovation so fundamental that programmers today do not even realize it was ever an innovation.

**Recursion as a first-class idiom.** Fortran I did not support recursion. Its stack was flat. A function could not call itself; if you tried, the second invocation would overwrite the activation record of the first, and chaos would ensue. This was not a design mistake — it was a deliberate choice to simplify the runtime. Algol 60, published the same year as McCarthy's Lisp paper, added recursion (this was considered a major and controversial feature), but Lisp had it from the start, and more than that, Lisp was *built around* it. In Lisp, recursion was not an optional feature; it was the default way of writing almost any nontrivial function. If you wanted to walk a list, you recursed on the cdr. If you wanted to build a tree, you recursed into the subtrees. The entire standard library was recursive. Loops were available but were for a long time considered low-level and slightly distasteful. Lisp taught a generation of programmers to think recursively.

**Dynamic typing.** Variables in early Lisp were untyped in the sense that they could hold any kind of value — numbers, symbols, lists, functions — and the type was carried with the value, not with the variable. This was radical at a time when Fortran and COBOL both required every variable to be declared with a fixed type. Lisp's dynamic typing is the ancestor of the dynamic typing in Python, Ruby, JavaScript, Smalltalk, and essentially every other "dynamic language" of the last fifty years.

**First-class functions.** Because Lisp was built on the lambda calculus, functions were values like any other. You could put a function in a variable, pass it to another function, return it from a function, store it in a list. This was new in 1960. It would be new in most other languages for another twenty to forty years. Fortran did not get first-class functions until Fortran 2003 (and then only in a limited form). C still does not have them in any meaningful sense (function pointers exist, but they cannot close over local state). Python added them in 1991. JavaScript had them from the start in 1995, because Brendan Eich had been told to "make it look like Java" but was secretly a Scheme programmer and snuck functional programming in under the covers. The idea that you could pass functions around like data came, in every case, originally from Lisp.

**The read-eval-print loop.** McCarthy's 1960 paper did not explicitly describe a REPL — the interactive loop where you type an expression, the system evaluates it and prints the result, and waits for the next expression. But by 1962 the Lisp 1.5 system at MIT had one. It was the first interactive programming environment in the modern sense. You could sit at a teletype, type a Lisp expression, and immediately see its value. You could define a function and test it. You could redefine a function and run the test again. This was new. Fortran and COBOL were batch languages — you wrote your program, submitted it to be compiled, waited hours or days for your output, and then tried to figure out what you had done wrong. Lisp let you converse with the machine. The feedback loop tightened from days to seconds, and that changed what kind of programs you could write and how you wrote them. Every modern "interactive shell" — Python's REPL, Ruby's irb, JavaScript's console, the bash prompt — is a descendant of the Lisp REPL.

**Self-hosting.** Lisp's `eval` function was written in Lisp. The Lisp compiler, when it was eventually written (the first Lisp compiler was McCarthy's 1962 work with Tim Hart and Mike Levin, and was the first compiler ever written *in its source language*), was written in Lisp. This was another first. Fortran's compiler was written in assembly. COBOL's compiler was written in assembly. Lisp's compiler was written in Lisp, which meant it could be used to improve itself — a bootstrapping loop that became central to Lisp culture. Every modern self-hosting language (Go, Rust, TypeScript, many more) is walking a path Lisp walked first.

### What McCarthy thought he was doing

A final note on the birth of Lisp. McCarthy did not think he was building "a" programming language in the sense that Backus thought he was building Fortran, or Grace Hopper thought she was building COBOL. McCarthy thought he was building a mathematical notation for expressing algorithms, which would happen to be runnable on a machine because Russell had made it so. His ambitions were for AI, not for language design. In a 1978 retrospective, *History of Lisp*, McCarthy wrote:

> "LISP was not the work of a committee, nor was it designed in the sense that Algol was designed. It evolved."

This is the key to understanding why Lisp feels different from every other language. Every other major language of the era — Fortran, COBOL, Algol, PL/I — was designed by a committee, up front, with specifications written before implementations. Lisp was discovered. It emerged from an attempt to make the lambda calculus run on an IBM 704, and it was found to have features that nobody had asked for but that turned out to be indispensable. The recursive `eval` function was not a design decision; it was a mathematical consequence of what McCarthy had written. The garbage collector was not a design decision; it was an engineering response to the mathematical consequence. The REPL was not a design decision; it was what naturally happened when you had a self-hosting interpreter and an interactive terminal. Lisp is a language that was, to a large extent, the result of taking a few simple ideas seriously and following them wherever they led.

This is also the root of the Lisp community's persistent, almost religious conviction that Lisp is a *discovery* rather than an *invention*. Most programming languages are artifacts of their era — they carry the fingerprints of the committees and the hardware and the fashions of their time. Lisp, the Lisp community argues, is something closer to mathematics: a natural object that was found, not built, and that would have been found eventually regardless of who did the finding. You do not need to agree with this claim to notice how strongly it is held. It is a claim that other language communities do not generally make about their languages. Python people do not say Guido van Rossum *discovered* Python. C people do not say Dennis Ritchie *discovered* C. Lisp people say McCarthy discovered Lisp, and the word is chosen with care.

---

## 3. The MIT AI Lab Era

### Tech Square and the ninth floor

By the mid-1960s the MIT Artificial Intelligence Project had outgrown its original home in the Research Laboratory of Electronics and had moved into Technology Square, a complex of buildings at 545 Main Street in Cambridge, across from the main MIT campus. The AI Lab took over the ninth floor of Tech Square (with satellite space elsewhere in the building). This floor — the ninth floor of Tech Square, in a building that has since been demolished — is the geographic center of what you might call classical Lisp culture. Almost everything interesting that happened to Lisp between 1965 and 1985 happened there or radiated out from there.

The AI Lab culture was shaped by a few peculiar conditions. First, the lab had extraordinary resources: DARPA (then ARPA) was funding AI research generously, and the lab had access to some of the best machines in the world (the PDP-6, then the PDP-10, then specialized hardware built in-house). Second, the lab was staffed by a remarkable concentration of young, brilliant hackers, many of them still undergraduates, who treated the machines as extensions of themselves. Third — and this is the part that is hard to convey to anyone who was not there — the lab operated on an ethic of radical openness. The machines were shared. The source code was shared. The doors were unlocked. You could walk into the lab at 3 a.m. and find half a dozen people working. You could sit down at any terminal and use it. If someone had left their login session active, you could read their files; this was not considered rude, it was considered how things worked. If you found a bug in someone's code, you fixed it and left a note. The culture was documented, much later, in Steven Levy's 1984 book *Hackers: Heroes of the Computer Revolution*, which was written partly as an elegy for a world that was already ending by the time Levy reported on it.

### The hackers

The list of people who worked on Lisp at the MIT AI Lab in this era is absurd. In no particular order:

**Richard Greenblatt**, who arrived as an undergraduate in 1962, became one of the lab's most prolific hackers and the lead designer of the first Lisp Machine. Greenblatt's genius was for low-level systems — he was the kind of person who could write a compiler over a weekend and then spend the next week making it two times faster. His chess program, MacHack VI (1967), was the first computer chess program to compete in a human tournament and the first to achieve a tournament rating.

**Bill Gosper**, who arrived around the same time as Greenblatt, became the world's foremost expert on Conway's Game of Life and the APL school of "heavy" mathematical programming. Gosper's contributions to Lisp were more cultural than technical — he was the living example of what it meant to think in mathematics and render that thinking directly into code. His hand-compiled glider guns and his symbolic integration hacks entered lab legend.

**Gerald Jay Sussman**, who arrived as a graduate student in the mid-1960s, became one of the great language designers in computer science. Sussman's work on PLANNER (with Carl Hewitt), CONNIVER (with Drew McDermott), and eventually Scheme (with Guy Steele) defined a whole tradition of how to think about programming language design. His textbook, *Structure and Interpretation of Computer Programs* — SICP, cowritten with Hal Abelson in 1984 — is the most influential computer science textbook ever published, and teaches the foundations of programming using Scheme.

**Guy L. Steele Jr.**, who arrived as a graduate student in the early 1970s and later moved on to Sun Microsystems and the design of Java, is one of the most decorated language designers alive. With Sussman he wrote the Lambda Papers, designed Scheme, and wrote the early Scheme interpreters. He later led the committee that produced *Common Lisp: The Language* and played a central role in Common Lisp, Fortran 90/95, and Java.

**Richard Stallman**, who arrived as an undergraduate in 1971 and found a home in the AI Lab at a moment when the lab's hacker culture was at its peak. Stallman became the lab's dominant Lisp hacker through the 1970s, wrote Emacs (originally as a collection of TECO macros, later in Lisp), and when the lab's culture collapsed in the early 1980s went on to found the GNU Project and the free software movement as a direct response. His GNU Emacs is the longest-surviving and most widely-used Lisp program in the world; its extension language, Emacs Lisp, is the dialect that a majority of working Lisp programmers today actually use daily, whether they think of themselves as Lisp programmers or not.

**Tom Knight**, another long-time lab member, was the other main architect (with Greenblatt) of the MIT Lisp Machine. Knight later cofounded Symbolics and became a professor at MIT. He is also, incidentally, the "Tom" of the "Guru Meditation" humor in AmigaOS — the early Amiga team was full of Lisp-influenced hackers who had absorbed the MIT hacker culture indirectly.

**David Moon**, one of the lead implementers of Maclisp and later a founder of Symbolics, wrote some of the most elegant low-level Lisp implementation code of the era. His internal memo on "Maclisp Reference Manual" was one of the first serious Lisp implementation documents.

**Jon L. White**, another Maclisp principal, later a major figure in Common Lisp standardization.

**Carl Hewitt**, whose work on PLANNER led to the actor model of computation and eventually to languages like Erlang.

**Marvin Minsky**, the lab's cofounder, whose theoretical work on society-of-mind models of intelligence drove much of the lab's agenda.

**Patrick Winston**, who directed the lab from 1972 to 1997 and wrote *Lisp*, one of the canonical Lisp textbooks.

**Peter Szolovits, Gerald Sussman, Chuck Rich, Danny Hillis, Richard Waters, David Marr, Berthold Horn, Rod Brooks**, and many more. At any given moment in the 1970s, the ninth floor of Tech Square contained a critical mass of people who were simultaneously shaping AI research and shaping the programming language they used to do it.

### Maclisp

The MIT dialect of Lisp that grew out of the original LISP 1.5 was called Maclisp, for "MAC Lisp" (the MAC stood for "Man And Computer," or depending on whom you asked, "Machine-Aided Cognition" — it was the name of the MIT computing project that owned the PDP-6 and PDP-10 hardware). Maclisp was developed primarily at the AI Lab starting in 1966, with major contributions from Greenblatt, Moon, White, Steele, and others. Its rival dialect, BBN Lisp (later renamed Interlisp), was developed at Bolt, Beranek, and Newman up the road in Cambridge and later at Xerox PARC. The two camps were friendly but different: Maclisp was tight, fast, low-level, and pragmatic, aimed at people who wanted to write research code quickly on PDP-10s; Interlisp was elaborate, environment-driven, and full of high-level tools like the DWIM ("Do What I Mean") system that would try to correct your typos. The dialect split was the first of what would eventually be called the Lisp Wars.

Maclisp ran on the PDP-6 and later the PDP-10 under the ITS ("Incompatible Timesharing System") operating system, which was itself written at the MIT AI Lab and was one of the most influential operating systems nobody outside a narrow circle has ever heard of. ITS had no security, no user accounts in any meaningful sense, no passwords. Everyone's files were readable by everyone else. The whole ethos was openness, the direct ancestor of the open-source ethos that Stallman would later codify. Maclisp on ITS was how you wrote AI programs at MIT through most of the 1970s.

Major programs written in Maclisp included **Macsyma**, the symbolic mathematics system (started in 1968 by Joel Moses, Bill Martin, Carl Engelman, and others, and still the basis for the modern Maxima system); **SHRDLU**, Terry Winograd's 1970 natural-language understanding program that could converse about a simulated blocks world; **Macsyma's integration engine**, which could symbolically integrate functions that graduate students could not; and dozens of other research systems. Maclisp was the production vehicle for an entire decade of AI research. When people today complain that AI research cannot be reproduced, they should remember that in the 1970s, AI research lived in Lisp source files that anyone with an account at MIT could read and modify.

### PLANNER, CONNIVER, and the failed experiments

Not everything the AI Lab built in Lisp worked. The 1960s and 1970s were also an era of failed experiments, and some of those failures are more interesting than many languages' successes. Two in particular stand out.

**PLANNER** was a language designed by Carl Hewitt around 1969 as a dissertation project. It was a Lisp-like language extended with facilities for logical reasoning: goal-directed backward chaining, assertion-based forward chaining, pattern matching against a database of facts, a notion of "theorems" that could be invoked when certain goals arose. PLANNER was supposed to be the language in which AI programs would naturally be written — you would express your knowledge as assertions and your reasoning as theorems, and the language would figure out what to prove and how. PLANNER was extremely ambitious, and it was never fully implemented. A subset called Micro-PLANNER was implemented by Gerald Sussman, Terry Winograd, and Eugene Charniak in 1971, and it was this subset that SHRDLU used. Full PLANNER remained a paper design. Its influence, however, was enormous: PLANNER's ideas about pattern-directed invocation, automatic backtracking, and logical-deductive control flow fed directly into Prolog (developed in France by Alain Colmerauer in 1972) and, through a long chain, into the entire logic programming tradition.

**CONNIVER** was Drew McDermott and Gerald Sussman's 1972 response to what they saw as PLANNER's excesses. They wrote a paper, "Why Conniving Is Better Than Planning," arguing that PLANNER's commitment to automatic backtracking had built-in assumptions that would not scale to real problems. CONNIVER made backtracking explicit, gave the programmer direct control over contexts and alternatives, and tried to be a language in which "messy" reasoning could live. It too was eventually abandoned.

The failure of PLANNER and CONNIVER taught the AI Lab a lesson that would come back in a different form a few years later: the big language designs were too big. It was easier to take Lisp and add just one or two well-chosen features than to design a grand new system from scratch. This realization would eventually lead Sussman and Steele to Scheme.

### The Lisp Machine project

By the mid-1970s, Lisp programmers at MIT (and Stanford, and BBN, and CMU) were running into a hard ceiling. The PDP-10 was a great machine, but Lisp wanted more — more memory, better garbage collection support, hardware that understood tagged pointers, specialized instructions for the common Lisp operations. A general-purpose machine forced Lisp to pay for a mismatch between its execution model and the hardware. What if you built a machine whose hardware was designed around Lisp?

The idea had been floating around the lab for years. In 1974 Richard Greenblatt started a serious project to design and build one. Tom Knight joined him. The first prototype, which came to be called the **CONS machine**, was built by 1977. Its successor, the **CADR machine**, was running full Lisp by 1978 and became the immediate ancestor of all the commercial Lisp Machines that followed. The CADR (pronounced "cadder," from the Lisp function `cadr`) had hardware support for tagged data types, hardware garbage collection assistance, a bitmap display (one of the first in any general-purpose computer), and an operating system written entirely in Lisp. The user sat at a Lisp REPL. There was no C. There was no assembler for day-to-day work. Everything, from the window system to the network stack to the file system, was Lisp all the way down.

The CADR was a research project, but its commercial potential was obvious, and here is where the story turns sad. In 1979-1980, the lab split over how to commercialize the Lisp Machine. Greenblatt wanted to found a company that would be owned by the hackers themselves, operated on the principles of the AI Lab, and committed to open source and the MIT hacker ethic. A larger group, led by Russell Noftsker (a former AI Lab administrator) and joined by Knight, Moon, Steele, and most of the senior technical staff, wanted to found a more conventional company with outside investment, a real sales force, and a traditional corporate structure. Greenblatt tried to hold his group together and eventually founded **Lisp Machines, Inc.** (LMI) in 1979. The larger group founded **Symbolics, Inc.** in 1980.

Both companies sold machines that were, in essence, variants of the CADR design (they had both been built by the same people). But the companies were competitors, and competitors needed their own proprietary software. The MIT Lisp Machine operating system, MacLisp, and all the associated software — which had been developed openly at the AI Lab by a community of hackers working on shared code — was now the subject of a commercial tug-of-war. Both Symbolics and LMI licensed the MIT code. Both started making proprietary improvements. The hackers at the lab were forced to choose sides. Richard Stallman, who had been the lab's most productive hacker through the 1970s, watched the community he loved dissolve into a set of non-disclosure agreements. The experience radicalized him. In 1984, as a direct response to the collapse of the lab, he founded the GNU Project and committed to building a complete free software operating system so that no future community would have to watch its code get taken away. The Free Software Foundation and the entire free software movement are downstream of the Lisp Machine wars.

### The hacker ethic

Steven Levy's *Hackers: Heroes of the Computer Revolution* (1984) is the book that introduced the phrase "the hacker ethic" to the public. Levy spent time at the MIT AI Lab in the early 1980s, interviewing the old guard (and the young guard, who by that point were mostly gone) and reconstructing the lab's culture. The hacker ethic, as Levy summarized it, was a set of informal principles:

- Access to computers should be unlimited and total.
- All information should be free.
- Mistrust authority; promote decentralization.
- Hackers should be judged by their hacking, not by bogus criteria like degrees, age, race, or position.
- You can create art and beauty on a computer.
- Computers can change your life for the better.

None of these principles are about Lisp specifically. But it is not a coincidence that they emerged at a Lisp lab. Lisp's design encouraged the lab's culture, and the lab's culture reinforced Lisp's design. A language in which the source code and the running system are the same thing, in which you can redefine any function on the fly, in which the interpreter is written in the language itself — such a language demands, and rewards, a culture of openness and tinkering. You cannot work productively in Lisp in a closed, secretive, top-down environment; the language will fight you. Conversely, if you put smart people in an open environment with Lisp, the kind of culture the MIT AI Lab had is roughly what you will get.

The collapse of the MIT AI Lab in the early 1980s was not caused by Lisp, but it was the moment when Lisp's cultural home died. The physical lab continued to exist (and exists today as CSAIL, the MIT Computer Science and Artificial Intelligence Laboratory). But the ninth-floor culture, the unlocked doors, the shared code, the 3 a.m. coding sessions — that was gone. What survived was the code (eventually, in the form of GNU Emacs and a few other programs) and the stories (in the form of Levy's book and a thousand anecdotes). Lisp itself would survive longer, but it would survive as a diaspora, with no center.

---

## 4. The Lisp Diaspora and Dialect Wars

### Interlisp and the West Coast

While Maclisp was the dominant Lisp on the East Coast through the 1970s, there was a second major Lisp family growing in parallel on the West Coast: **Interlisp**. Interlisp began as **BBN Lisp**, developed at Bolt, Beranek, and Newman in Cambridge in the late 1960s by a group that included Danny Bobrow, Warren Teitelman, and Ronald Kaplan. BBN Lisp was oriented toward what we would now call productivity features: a structure editor (you edited Lisp code as tree structures, not as text), an undo facility, the famous **DWIM** ("Do What I Mean") system that tried to correct your typos automatically, a powerful debugger (the "break package"), and an elaborate programming environment called the **Programmer's Assistant**.

In 1972, Warren Teitelman left BBN for Xerox PARC, which had just opened and was staffing up with some of the best systems researchers in the world. BBN Lisp became **Interlisp** around 1974, and the center of its development moved to PARC. Interlisp-10 ran on the PDP-10; **Interlisp-D** ran on PARC's custom workstations, the Alto, the Dolphin, and the Dorado. Interlisp-D was, in its own way, a Lisp Machine — a workstation whose system software was written in Lisp and that provided a full Lisp programming environment. PARC's culture and MIT's culture were both brilliant but very different: MIT was ITS and the PDP-10 and the wizards working in a smoky lab; PARC was the Xerox offices and the Alto and the cleaner, more business-oriented research environment that would produce the bitmap display, the GUI, the mouse, the laser printer, and Ethernet. Interlisp fit PARC's environment. It was polished. Its documentation was actually good. Its debugger was a showpiece.

The result was two Lisp worlds. A program written in Maclisp would not run under Interlisp, and vice versa. Library code was incompatible. Idioms were different. People who had learned Lisp in one dialect found the other strange. Even the standard list-manipulation functions had different names: Maclisp had `cadar` and `caddar` and `cddadr`, Interlisp was more likely to use `(LIST* ...)` and `(NTH ...)`. The split was not yet a problem because the Lisp community was small and both dialects were internally coherent. But it foreshadowed what was coming.

### Franz Lisp, UCI Lisp, and the others

As Lisp spread through the academic world in the 1970s, every major research site built its own dialect. **UCI Lisp**, at the University of California, Irvine, was developed by Robert Bobrow (no relation to Danny) and was a derivative of Stanford's version of Lisp 1.6, which was in turn a derivative of LISP 1.5. **Stanford Lisp 1.6** was run by John Allen and Lynn Quam at SAIL, the Stanford AI Lab. **Lisp Machine Lisp**, later **ZetaLisp**, was the dialect of the MIT Lisp Machines and its commercial descendants at Symbolics and LMI, and was a kind of supercharged Maclisp with thousands of additional features. **Portable Standard Lisp** at the University of Utah was Anthony Hearn's attempt to build a Lisp that would compile to efficient code on every machine and would serve as the implementation language for the REDUCE computer algebra system. **Standard Lisp** was an earlier attempt, led by Hearn, at a portable specification. **Franz Lisp**, developed at UC Berkeley around 1980 primarily by Richard Fateman, John Foderaro, and Keith Sklower, was named after the composer Franz Liszt (the "z" was later dropped in spelling to avoid confusion, but the pun was deliberate) and was designed to run on the new VAX minicomputers. Franz Lisp became the most widely distributed Unix Lisp of the early 1980s and was one of the vehicles by which Lisp made the jump from PDP-10s to Unix workstations. The company Franz Inc., founded later in the 1980s, still sells a commercial Common Lisp descendant (Allegro CL) today.

By 1981 there were more than a dozen Lisp dialects in active use in North America alone, plus several in Europe. They shared a family resemblance but were mutually incompatible in many details. A program written for one dialect could not, in general, be ported to another without substantial rewriting. This was becoming a serious problem. DARPA, which was funding most of the relevant research, was paying for the same libraries to be rewritten over and over for different dialects. The community needed a standard. But first, two of the most important Lispers at MIT were about to do something that would reshape the entire tradition.

### Scheme: just the good parts

In 1975, Gerald Jay Sussman and Guy L. Steele Jr. were at the MIT AI Lab trying to understand Carl Hewitt's actor model — the computational model that Hewitt had been developing as the theoretical foundation for his work on PLANNER and its descendants. Actors, in Hewitt's sense, were entities that received messages and could respond by sending more messages. Hewitt claimed the actor model was a new foundation for concurrent computation, one that could not be captured by the lambda calculus.

Sussman and Steele, who at the time were trying to implement an actor language in Lisp, had a different hypothesis: what if actors were just closures? What if the entire actor model could be expressed as a small extension to the lambda calculus, and what if a sufficiently clean Lisp could implement actors natively, without any special machinery? To test the hypothesis, they sat down and wrote a small Lisp interpreter that had proper lexical scope, first-class functions, and tail-call optimization (so that a function could call another function "in tail position" without growing the stack, making it safe to express iteration and actor message-passing as recursion). They called the result **Scheme**. The initial interpreter was written in Maclisp, and the name "Scheme" was chosen because at the time operating-system-like Lisp efforts had names like "PLANNER" and "CONNIVER," and Sussman and Steele thought "Scheme" sounded appropriately ambitious. (Steele has said that they originally wanted to call it "Schemer" as a third in a series with Planner and Conniver, but the ITS file system only allowed six-letter names and they had to drop a letter.)

Scheme was small. Its entire specification fit in a few pages. Where Maclisp had accreted thousands of functions over the years, Scheme had a few dozen. Where Maclisp had dynamic scope (variable references were looked up in the calling function's environment, not the defining function's), Scheme had lexical scope (the Algol way, the way the lambda calculus had always implied). Where Maclisp had `function` and `quote` and other complexities around passing functions as values, Scheme treated functions as ordinary values and you just passed them around. Where Maclisp had elaborate control structures, Scheme had one: the function call, plus tail-call optimization so that recursion was as efficient as iteration.

Sussman and Steele discovered — to the surprise of both of them and of Hewitt — that their hypothesis was right. Actors really were just closures. The entire actor model could be expressed in a few lines of Scheme. The result was a series of papers now known as the **Lambda Papers**:

- *Scheme: An Interpreter for Extended Lambda Calculus* (1975)
- *Lambda: The Ultimate Imperative* (1976)
- *Lambda: The Ultimate Declarative* (1976)
- *Debunking the "Expensive Procedure Call" Myth, or, Procedure Call Implementations Considered Harmful, or, Lambda: The Ultimate GOTO* (1977)
- *The Art of the Interpreter, or, the Modularity Complex* (1978)
- *Rabbit: A Compiler for Scheme* (Steele's 1978 master's thesis)
- *Design of LISP-Based Processors, or, SCHEME: A Dielectric LISP, or, Finite Memories Considered Harmful, or, LAMBDA: The Ultimate Opcode* (1979)

The titles are deliberate jokes (the running gag of "Lambda: The Ultimate X" became a Lisp-community meme so durable that the main Lisp news site would later be named Lambda the Ultimate). The content is serious. Between them, the Lambda Papers argued that:

- Lexical scope is correct and dynamic scope is a historical mistake.
- Tail-call optimization makes recursion equivalent to iteration in both expressiveness and efficiency.
- Function calls are (or should be) cheap, and therefore expressing control flow as function calls is fine and even desirable.
- Compilers can produce excellent code for Scheme-style programs using standard techniques.
- Most of the "imperative" control structures of other languages (loops, gotos, assignments) can be expressed elegantly in terms of lambda calculus plus tail calls.

These are ideas that now permeate programming language theory and practice. In 1975-1978 they were radical. Steele's 1978 master's thesis, *Rabbit*, was a Scheme compiler written in Scheme that produced code competitive with hand-written assembly — a demonstration that the "expensive procedure call" myth was in fact a myth, and that the Lisp community had been right all along to lean on recursion and function-based abstractions.

Scheme became enormously influential in academia. It was small enough to be teachable in a single semester. Its semantics were clean enough to be formalizable. Its interpreter could be written in a few hundred lines. MIT adopted Scheme as the teaching language for 6.001, *Structure and Interpretation of Computer Programs*, the introductory computer science course that Abelson and Sussman taught starting in 1980. SICP became the most influential CS textbook of the 1980s and 1990s, and arguably of all time. The book uses Scheme to introduce students not only to programming but to the deepest ideas in computing — abstraction, state, evaluation, compilation, machines. Generations of computer scientists learned to think about programs by writing meta-circular evaluators in Scheme.

Scheme has continued to evolve. The language standards have gone through several major revisions: R2RS (1985), R3RS (1986), R4RS (1991), R5RS (1998), R6RS (2007, which was controversial and split the community), and R7RS (2013, which was written partly as a reconciliation after R6RS). "RnRS" stands for "Revised^n Report on the Algorithmic Language Scheme," a title modeled on Algol's "Revised Report." Each revision has been small enough that the entire language fits in a hundred pages or less. Major Scheme implementations include MIT/GNU Scheme (the original MIT implementation, still maintained), Chicken (which compiles to C), Racket (which started as "PLT Scheme" and has since evolved into its own language ecosystem), Guile (the GNU extension language), Gambit, Bigloo, Chibi, and many more.

### ZetaLisp and the Lisp Machine dialects

Meanwhile, at Symbolics and LMI and on the descendants of the MIT CADR, a different line of development was happening. The Lisp Machine programmers, working on custom hardware with bitmap displays and megabytes of RAM (a luxury in the late 1970s), built the largest and most feature-rich Lisp dialect anyone had yet produced. It was originally called Lisp Machine Lisp; Symbolics called its version **ZetaLisp**. ZetaLisp was enormous. It had thousands of built-in functions, a full window system, a CLOS-like object system (eventually formalized as Flavors, the first object-oriented extension to Lisp), a first-class module system, a network stack, a file system interface, and an editor (Zmacs, an Emacs-alike) all built in and all accessible as Lisp libraries. The Symbolics Genera operating system, which was ZetaLisp's habitat, was widely regarded as the most advanced programming environment in the world for a brief window in the mid-1980s.

ZetaLisp's features were spectacular and its code was incompatible with everything else. A program written in ZetaLisp used Flavors, and Flavors did not exist in Maclisp or Interlisp or Scheme. A program written in ZetaLisp used the Symbolics window system, which did not exist anywhere else. A program written in ZetaLisp used hundreds of built-in functions that were unique to Symbolics. The dialect was a walled garden — not deliberately, but inevitably. And because Symbolics was a commercial company, there was a natural tendency to extend the walls.

### Common Lisp: the grand unification

By 1981 the dialect situation was intolerable. DARPA had been funding multiple groups to build Lisp systems and each group had its own dialect. Software written for one group could not be reused by another. Libraries had to be rewritten. The cost to the research community was enormous. At an ARPA meeting in April 1981, a small group of Lisp implementers met and agreed to try to produce a single standard dialect that would unify the main lines of descent — Maclisp, ZetaLisp, Franz Lisp, and the various other MacLisp derivatives — while being portable across all the major machines. (Scheme and Interlisp were not part of this effort; they were too different in spirit. The standard was an attempt to unify the Maclisp family, not all of Lisp.)

The effort was led by **Guy Steele**, who had the technical authority and the political skill to herd a famously independent community. The committee included (at various times) Steele, Scott Fahlman (CMU), David Moon (Symbolics), Daniel Weinreb (Symbolics), Jon L. White (MIT/Xerox), Richard Gabriel (Stanford and later Lucid), and many others. The process was contentious. Every committee member had their own favorite features from their own favorite dialect and fought to have those features included. The committee met in person, argued over electronic mail (via ARPAnet, one of the first examples of a large-scale technical standards process conducted primarily via email), and eventually produced a draft specification by 1983.

The language was called **Common Lisp**. The word "Common" was chosen to emphasize that this was the language shared by the whole community, not any one group's private dialect. The book that specified the language, *Common Lisp: The Language* by Guy Steele (with contributions from the whole committee), was published by Digital Press in 1984 and became known universally as **CLtL1**. It was a thousand pages long. It described a Lisp that was huge even by ZetaLisp standards: hundreds of functions, multiple namespaces (a variable and a function could have the same name, unlike Scheme), a complex type system, conditions and restarts (the most sophisticated exception-handling system ever put into a language, before or since), a structured macro system with `defmacro` and backquote, a full format-string language for output, and dozens of other features. The language was deliberately a superset of almost everything that was in common use; the theory was that by including everyone's favorite features, nobody could object on the grounds that their dialect had been excluded.

The strategy worked, in the sense that Common Lisp did in fact become the unified dialect. By 1985, all the major Lisp vendors — Symbolics, LMI, Franz, Lucid, Golden Hill, Xerox (eventually), and others — were shipping Common Lisp implementations or adding Common Lisp compatibility layers. ARPA's funding shifted to Common Lisp as the canonical dialect. Research groups adopted it. Textbooks were written for it. Peter Norvig's *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp* (1992) — universally known as PAIP — became the standard reference for how to actually write substantial Common Lisp programs, and is still in print.

A second edition of CLtL, **CLtL2**, was published by Steele in 1990, incorporating the changes that had accumulated during the standardization process that was by then underway. In 1994, after nearly a decade of committee work, the final official specification was ratified as **ANSI X3.226-1994**, and Common Lisp became the first object-oriented programming language (and the first Lisp) with a formal ANSI standard. The ANSI standard includes the **Common Lisp Object System** (**CLOS**), a multiple-inheritance, multimethod, metaclass-based object system designed by a committee including Sonya Keene, Linda DeMichiel, Dick Gabriel, Gregor Kiczales, Jim des Rivières, and Daniel Bobrow. CLOS was the first object-oriented system in any mainstream language to support multiple dispatch (methods that dispatch on the types of more than one argument), and it remains, decades later, one of the most powerful object systems ever designed. Gregor Kiczales and company documented it in *The Art of the Metaobject Protocol* (1991), which argued that any sufficiently flexible object system needs to expose its own implementation to the user as a protocol, and that this principle — reflection and metaobject protocols — is a general principle of language design.

### The Lisp curse

The Common Lisp unification was a triumph, and it was also, in a certain sense, the beginning of the end. It was a triumph because it finally gave the Lisp community a single language. It was a beginning-of-the-end because the language it gave them was enormous, committee-designed, and politically complicated. Common Lisp had all of Maclisp's features, all of ZetaLisp's features, all of the exotic features that various lobbying groups had insisted on, and the sum was a language that was spectacular to use and terrifying to implement. The ANSI specification alone runs to over a thousand pages. Implementing Common Lisp from scratch is the kind of thing you might spend a decade on.

This led to what is now called **the Lisp curse**, a phrase coined in the 2000s by various essayists trying to explain why Lisp had not taken over the world despite its technical advantages. The Lisp curse has several formulations, but the core observation is: Lisp is so powerful that every Lisp programmer builds their own solution to every problem, and so the community cannot converge on shared libraries, frameworks, or standards the way Python or Ruby communities do. In Python, if you want an HTTP library, there is one; it's called `requests`; everyone uses it; it is maintained by a small group with a lot of attention; it is documented and tested and reliable. In Common Lisp, if you want an HTTP library, there are five, each written by a brilliant hacker who thought the other four had deep design flaws, none of them fully compatible with any of the others, and the "best" one is whichever one the person you are talking to happens to use. This is the curse: Lisp's macro system and metaprogramming facilities make it too easy to roll your own. The social pressure to converge on a single shared library is weaker than the technical pressure to build exactly the library you want. So you build your own, and the community fragments.

The Lisp curse is related to, but not the same as, **Greenspun's Tenth Rule**, coined by Philip Greenspun (a Lisp-trained MIT hacker turned entrepreneur) in the early 1990s:

> "Any sufficiently complicated C or Fortran program contains an ad hoc, informally-specified, bug-ridden, slow implementation of half of Common Lisp."

Greenspun's rule is an observation about other languages, not about Lisp. It says that as a C program grows in size, it eventually starts to reinvent the features that Common Lisp has built in: dynamic dispatch, garbage collection, a reflective object system, macro-like facilities, conditionals-as-expressions, etc. The rule has been invoked so many times by so many Lisp enthusiasts that it has become part of the folklore, and it is genuinely hard to argue against once you start looking for examples. The ancient Unix C code that Linus Torvalds works with every day uses `goto` cleanup chains that are structurally identical to `unwind-protect` in Common Lisp. The Apache web server uses module-loading machinery that is a crude version of Lisp's package system. Every database has an internal query language that is, when you squint, a not-quite-Lisp.

### "Worse Is Better"

The single most important document in the Lisp community's attempt to understand its own history is an essay by Richard P. Gabriel, originally delivered as part of a longer talk at the 1989 EuroPAL conference, titled **"The Rise of 'Worse Is Better.'"** Gabriel was a founder of Lucid Inc., one of the major Common Lisp vendors of the 1980s, and a long-time MIT and Stanford Lisp hacker. He wrote the essay as an attempt to explain, to himself and to his community, why Unix and C had crushed Lisp and the Lisp Machines despite Lisp being, by every technical measure he could articulate, the better tool.

Gabriel's answer, boiled down, is that there are two philosophies of system design: the **MIT approach** (also called "the right thing") and the **New Jersey approach** (also called "worse is better"). The MIT approach prioritizes, in order of importance: correctness, consistency, completeness, simplicity. The New Jersey approach prioritizes, in order of importance: simplicity (especially in the implementation, even at the cost of a worse interface), correctness, consistency, completeness. Both philosophies agree that simplicity is important, but they disagree about what kind of simplicity matters. The MIT approach wants the *interface* to be simple, even if the implementation has to be complicated to make it work. The New Jersey approach wants the *implementation* to be simple, even if the interface has to paper over corner cases and force the caller to handle them.

Gabriel's killer example is how the two philosophies handle the PC-loser-ing problem. Imagine an operating system call that can fail partway through (say, a write to a disk that can be interrupted by a signal). The MIT approach is that the operating system should handle the interruption transparently: back out cleanly, retry, and return success. The New Jersey approach is that the OS should return an EINTR error and the user-space program should handle the interruption, loop, and retry. The MIT approach is "correct" in the sense that it does the right thing for the caller. The New Jersey approach is "worse" in the sense that the caller has to write extra code. But the New Jersey approach is *simpler to implement in the OS*, and that simplicity means the OS gets built, it spreads, it gets ported to new hardware, it gets adopted — and eventually the ecosystem around the "worse" system dwarfs the ecosystem around the "right" system. Worse is better.

Gabriel argued that Lisp (and the MIT AI Lab and the Lisp Machine vendors) had consistently chosen the MIT approach, and Unix and C had consistently chosen the New Jersey approach, and the result was that Unix and C had won despite being, in Gabriel's view, technically inferior. The essay is a kind of lament, but also a warning. It is the essay a Lisp community elder had to write in 1989 to explain to his own people why the thing they had built was losing. The essay was followed by a dialog between "Gabriel" and "Gabriel" (the pen name Nickieben Bourbaki used for an internal dialog between Richard Gabriel with himself) that revised and complicated the argument, and then by a series of follow-up essays over the next twenty years in which Gabriel argued with himself about whether "worse is better" was really true. Gabriel has said, in moments of exhaustion, that he no longer knows if his own essay was right. But it captured a mood, and it gave the Lisp community a vocabulary for talking about what had gone wrong.

---

## 5. The AI Winter and Lisp's Fall

### The golden era

The years 1984 to 1988 were the commercial peak of Lisp. Symbolics was a Wall Street darling. Lisp Machines were selling at prices between fifty thousand and a hundred and fifty thousand dollars each — in 1985 dollars, which is roughly double that today. Expert system companies like Intellicorp, Inference, Teknowledge, Carnegie Group, and Aion were raising venture capital and selling expert-system "shells" that ran on Lisp Machines. The expert system hype was reaching the business pages. *Business Week* ran cover stories about AI. Big companies (American Express, Ford, DEC, General Motors) were building in-house AI labs and buying Lisp Machines by the dozen. DEC's XCON system, an expert system that configured VAX computers at the factory, saved DEC tens of millions of dollars a year and became the canonical "AI pays for itself" example. For a brief moment, AI was a real commercial industry, and Lisp was its native language.

At the peak, Symbolics was one of the most admired computer companies in the world. Its machines were beautiful — polished consoles with ergonomic keyboards and bitmap displays, running software that had been developed over a decade at MIT and refined continuously by Symbolics engineers. The Genera operating system was (and arguably still is) the most advanced programming environment ever built. Everything was Lisp. Everything was introspectable. You could click on any value in the debugger and walk the object graph. You could redefine any function while your program was running. You could trace anything. You could, if you wanted, open the source of the kernel and modify it, recompile it, and have the changes take effect on the running system. Nothing like this existed anywhere else, and nothing like it has been built since.

Symbolics' stock price reflected all of this. The company went public in 1984 and its stock performed well. Engineers were paid well. The company built a large facility in Burlington, Massachusetts, and an even larger one in Concord. There were rumors of an expansion into the Japanese market. The Japanese Fifth Generation Computer Systems project (1982-1992), a massive Japanese government initiative to build AI computers, was making Americans nervous about losing the AI race, and Lisp was widely seen as the American answer. Everything was going up.

### The collapse

And then, in about eighteen months between 1987 and 1988, the entire thing fell apart. The proximate causes were multiple. The deeper cause was simple: the hardware economics had turned.

The Lisp Machine existed because in 1980 you needed custom hardware to run Lisp well. A PDP-10 could run Lisp, but slowly. A VAX could run Lisp, but slowly. A 68000-based workstation in 1982 could run Lisp, but slowly. The Lisp Machine had tagged pointers in hardware, microcoded garbage collection, specialized cache structures, megabytes of RAM when everyone else had hundreds of kilobytes. It was four or five times faster than a generic workstation at Lisp workloads, and for AI researchers that four or five times was the difference between "my program runs overnight" and "my program runs while I watch it."

By 1986, Moore's Law had caught up. The new generation of RISC workstations — Sun's SPARCstations, MIPS's R2000, DEC's early Alpha — were faster than the Lisp Machines at running everything, including Lisp. The generic workstations cost ten thousand dollars and the Lisp Machines cost a hundred thousand. Customers did the math. A Sun-3 running Lucid Common Lisp or Franz Allegro Common Lisp was four to ten times cheaper than a Symbolics and about the same speed, and the Sun could also run C and Fortran and all the regular Unix software. The Lisp Machine's only advantage was the Genera programming environment, which was magnificent but not magnificent enough to justify a 10x price premium. Symbolics' revenue cratered. LMI was already dying. By 1988, both companies were in serious trouble. By 1992, LMI was gone and Symbolics was in its first of several bankruptcies. (Symbolics as a corporation technically still exists today, selling Genera as an emulator on modern hardware to a small group of loyal users, but the Symbolics of the 1980s was finished.)

The Lisp Machines were the most visible casualty, but they were not the only one. The expert system companies had been selling systems that worked within limited domains but that did not generalize and did not scale. Customers who had bought expert systems expecting AI found that what they had bought was a very expensive rule-based system that was brittle, hard to maintain, and often less effective than a well-trained human. The hype collapsed into disappointment, and the disappointment got a name: the **AI Winter**. Funding dried up. The DARPA AI budget was cut. Graduate programs in AI shrank. Symbolics laid off most of its staff. Lucid Inc., the best-regarded Common Lisp vendor and the company whose implementation was considered the gold standard, shifted its focus to a C++ development environment called Energize, which was a technical marvel that did not sell and killed the company. Lucid filed for bankruptcy in 1994. Its Common Lisp product was eventually bought by Gensym and other parties and is still sold today as Liquid Common Lisp.

### Was the fall Lisp's fault?

The conventional narrative, in the 1990s and early 2000s, was that Lisp's fall was Lisp's fault. Lisp had failed because Lisp was too weird, too parenthesized, too academic, too hard for normal programmers to learn. Lisp was the language of the ivory tower, and the real world had correctly rejected it in favor of practical languages like C and C++. This was the conventional wisdom, and it was wrong.

The actual cause of Lisp's fall was hardware economics, as described above. Lisp was not rejected because programmers could not handle parentheses. Lisp was rejected because the machines it ran best on cost ten times what the competing machines cost, and once the competing machines were fast enough, there was no reason to pay the premium. When Lucid and Franz and Symbolics ported Common Lisp to generic Unix workstations, the price premium disappeared — but by then, the *market* had moved on. C and C++ had spent the 1980s building a critical mass of applications, libraries, books, training programs, and programmer mindshare, while Lisp had been trapped on expensive proprietary hardware. By 1990, even if Common Lisp on a SPARCstation was technically superior to C++ on the same SPARCstation, the C++ ecosystem was larger, the libraries were more numerous, the tutorials were more accessible, and the hiring pool was deeper.

There is a secondary cause that the Lisp community tends to downplay: Lisp culture genuinely was bad at marketing. The hackers who built Lisp and loved Lisp were, with a few exceptions, temperamentally indisposed to the kind of salesmanship that spreading a language requires. They believed, often correctly, that their tool was better, and they believed, often incorrectly, that being better was sufficient. It is not sufficient. Languages spread through communities, documentation, textbooks, training programs, integrations, libraries, and evangelism, and the Lisp community was mostly too proud or too busy to do that work. Gabriel's "Worse Is Better" essay is in large part an attempt to confront this failure, and the essay does so with genuine pain.

A third cause, which the community talks about even less, is that the Common Lisp unification was in some ways too successful. The language that emerged from the committee process was enormous and weighty and reflected the priorities of the 1980s AI research community. It was not a language you could pick up in a weekend. It was not a language that competed on lightness or elegance with, say, Python (which arrived in 1991 and rode the "simple scripting" wave to enormous success). Common Lisp was the opposite of simple. It was a maximalist language for people who wanted maximalist power. That audience was not large.

### The survivors

Lisp did not die in the fall. Lisp never dies; it just contracts. After 1990, the Lisp world shrank from several thousand commercial users to a much smaller community of enthusiasts, academics, and a few holdout commercial shops. But several Lisps survived in niches that turned out to be surprisingly durable:

**Emacs Lisp.** Richard Stallman's GNU Emacs, released in 1985, became the dominant Emacs implementation and one of the most widely-used programs in the Unix world. Its extension language was a Lisp dialect that Stallman had written from scratch — Emacs Lisp, a simple, dynamically-scoped (until the 2010s) Lisp with some Maclisp heritage. Emacs Lisp is, by some measures, the most widely-used Lisp in the world. Every GNU Emacs user runs Lisp code constantly; the editor is essentially a Lisp virtual machine with a built-in text editor. Every Emacs configuration file is a Lisp program. Every Emacs plugin is a Lisp library. The Emacs Lisp ecosystem is vast and active. Stallman's decision to use Lisp as the extension language was, in retrospect, the single most important thing anyone did to keep Lisp alive through the 1990s and 2000s: it guaranteed that every Unix programmer who used Emacs would learn a little Lisp, and some of them would fall down the rabbit hole and keep going.

**AutoLISP.** Autodesk's AutoCAD, the dominant CAD program of the 1980s and beyond, used a Lisp dialect called AutoLISP as its extension language. AutoLISP was a stripped-down, old-school dynamically-scoped Lisp descended loosely from XLISP, and it was deeply embedded in the workflow of every serious AutoCAD user. Mechanical engineers, architects, civil engineers, and draftsmen wrote AutoLISP scripts to automate CAD tasks. For much of the 1990s, AutoLISP had more working programmers than Common Lisp did. (AutoCAD later added Visual LISP, a more modern Lisp environment with a better debugger, and today the standard extension languages include .NET and Python, but AutoLISP is still supported.)

**Academic Scheme.** Scheme remained the teaching language at MIT (6.001) and at many other universities through the 1990s and 2000s. SICP stayed in print. The R5RS standard was widely adopted. Scheme implementations proliferated. The PLT Scheme project (later Racket), led by Matthias Felleisen and Matthew Flatt, grew into a full-featured language laboratory that explored ideas like contracts, gradual typing, language-oriented programming, and mixed-language modules. Racket is still actively developed today and is one of the most interesting language research projects in the world.

**Scientific Lisp.** Macsyma lived on as Maxima (a GPL'd rewrite), Axiom, and a few other open-source computer algebra systems. These are Lisp all the way down and are still used in serious symbolic mathematics work.

**Enterprise Common Lisp.** A small number of large corporations kept their Common Lisp systems running because they had large custom applications that were too expensive to rewrite. Franz Inc. (with Allegro CL) and LispWorks (with LispWorks) survived as niche commercial vendors, serving clients in defense, aerospace, finance, pharmaceuticals, and academia. Both companies are still in business today, decades after the winter.

**ITA Software.** This deserves its own mention. ITA Software, a Cambridge-based travel-industry startup founded in 1996 by Jeremy Wertheimer and others (mostly MIT-trained Lispers), built the airfare search engine that powered Orbitz, Kayak, and eventually most of the online airline-ticketing industry. The engine was written in Common Lisp, and the reason it was written in Common Lisp was that the problem — searching a combinatorially enormous space of flight combinations, fares, and rules — was exactly the kind of problem Common Lisp was suited to. ITA was acquired by Google in 2010 for $700 million, which was at the time one of the largest exits in Lisp history. The Lisp code continues to run at Google today in some form.

**Academic research.** Programming language researchers, who had learned Lisp and Scheme in graduate school, continued to do their exploratory work in Lisp dialects because Lisp was the fastest way to prototype a new language idea. This is an often-overlooked but genuinely important role: Lisp stayed alive as the "language designer's sketchpad," and most of the language ideas that showed up in mainstream languages between 1990 and 2020 were first tried out in a Lisp somewhere.

### The deep influence

If Lisp itself contracted, Lisp's *ideas* spread everywhere. Every major language designed after 1990 has some Lisp in its bloodline, whether the designers admit it or not:

**Python** (Guido van Rossum, 1991) inherited list comprehensions from Miranda (which was influenced by Lisp), lambdas directly from Lisp, first-class functions from Lisp, garbage collection from Lisp, dynamic typing from Lisp, and the REPL model from Lisp. Guido has said that Python's closures are deliberately limited (to avoid "Lisp-style" functional programming becoming too idiomatic), which is itself a compliment: Python is measuring itself against Lisp.

**Ruby** (Yukihiro Matsumoto, 1995) took blocks — which are closures with slightly awkward syntax — directly from the Lisp tradition, with influence from Smalltalk. Ruby's metaprogramming facilities are the most Lisp-like of any mainstream language, and Matz has said that Lisp was one of his primary inspirations.

**JavaScript** (Brendan Eich, 1995) is, as Eich himself has famously said, "Scheme in C's clothing." Eich was hired at Netscape to build a Scheme interpreter for the browser; management told him to "make it look like Java" and he obliged at the syntactic level while keeping Scheme's semantics underneath. Every JavaScript closure, every `function` expression, every `.map` and `.filter` and `.reduce`, is a direct descendant of Scheme. Douglas Crockford's famous *JavaScript: The Good Parts* (2008) can be read as an argument that the good parts of JavaScript are the parts that came from Scheme and the bad parts are the parts that came from Java.

**Java** (James Gosling et al., 1995) resisted Lisp influence for a decade and then surrendered. Generics, anonymous inner classes, and eventually lambdas (added in Java 8, 2014) are all Lisp ideas arriving late. The Java streams API is essentially a Lisp list-processing library with type annotations.

**C#** followed Java's trajectory, adding closures and LINQ and other Lisp-inflected features in the 2000s. Anders Hejlsberg, C#'s designer, has cited Scheme and Haskell as influences on the language's evolution.

**Perl** (Larry Wall, 1987) added closures in Perl 5 (1994) and was one of the first "practical" scripting languages to treat functions as first-class values — a Lisp idea, as Wall explicitly acknowledged.

**Haskell** (1990) and the whole family of typed functional languages owe their existence to the lambda calculus and to Lisp's demonstration that higher-order functional programming was not a toy.

**Scala** (Martin Odersky, 2004) is an attempt to merge the Lisp tradition with the Java tradition and the ML tradition, and every one of its interesting features — case classes, pattern matching, for-comprehensions, implicits, macros — has a Lisp analog.

**Clojure** (Rich Hickey, 2007) is, of course, a Lisp, and we will return to it.

**Julia** (2012) is a language for scientific computing that is, in essence, a Lisp with math-friendly syntax. Julia's macros, multiple dispatch, and metaprogramming are lifted directly from Common Lisp and CLOS. The Julia designers have been explicit about this.

**Rust** (2010) borrowed closures, iterators, and pattern matching from the ML/Scheme tradition, with the Rust designers explicitly citing OCaml and Scheme as influences.

**Swift** (2014), **Kotlin** (2011), **TypeScript** (2012), **Elixir** (2011) — every modern language has Lisp's fingerprints on it somewhere. The winners of the 1990s-2020s programming language era are the languages that absorbed Lisp's ideas and wrapped them in a curly-brace syntax.

The pattern is so consistent that it has a name in the Lisp community: "Every programming language eventually becomes Lisp, just more slowly and with worse macros." This is a half-joke; the serious version is that a large set of good ideas was discovered in the early Lisp era, and those ideas keep getting rediscovered by every new language, always belatedly, always in partial form. Lisp got there first because Lisp was built on a mathematical foundation that made those ideas inevitable rather than optional.

---

## 6. The Paul Graham Era

### Viaweb

In 1995, a young computer scientist named Paul Graham cofounded (with Robert Morris and Trevor Blackwell) a startup called Viaweb. Graham had an unusual background. He had studied at Cornell (undergraduate in philosophy) and Harvard (PhD in computer science), had written a 1993 book called **On Lisp** on advanced Common Lisp macro programming, and had been an essayist and painter in New York. Morris was an MIT computer scientist famous (or infamous) for having written the Morris worm in 1988, the first major Internet worm. Blackwell was another hacker. The three of them decided that the World Wide Web, then only a few years old, needed a way for ordinary merchants to set up online stores, and they decided to build one.

The decision that would become famous was Graham's insistence that Viaweb be written in Common Lisp. It was 1995. Perl was the dominant web language. Java had just shipped. C and C++ were the serious options for system code. Common Lisp was considered, by most people, a dead or dying language from the AI winter. Graham thought otherwise. Common Lisp, he argued, gave his team a power-per-programmer ratio that no other language could match. The Viaweb Store Editor — the program that let merchants design their online storefronts — was, at its core, a Lisp program that generated HTML. Graham's secret weapon was that he could change the program in response to user feedback within hours, while competitors (writing in C++ or Perl) took weeks. He could do this because Lisp's interactive development environment let him redefine functions in the running system, test them on live data, and roll them out without restarting anything. In a startup race, this speed advantage was enormous.

Viaweb grew. By 1998 it was the dominant online-store platform on the Web. Yahoo bought it for about $49 million in stock, renamed it Yahoo Store, and ran it for years. The Lisp code was eventually rewritten in C++ by Yahoo engineers who did not understand why Lisp mattered, and Graham has been complaining about this rewrite in essays ever since. (The rewrite, by Graham's account, was slower to add features, buggier, and less flexible. Whether this is fair is a matter of perspective, but the anecdote has become part of Lisp folklore.)

### "Beating the Averages"

In 2001, Graham published an essay on his personal website called **"Beating the Averages."** The essay is now considered a classic of the programming-language argument genre. It is Graham's attempt to explain, to entrepreneurs and programmers considering what language to use, why he had chosen Common Lisp for Viaweb and why (in his view) the choice had been decisive. The argument goes, in summary:

- Most programmers assume languages are roughly interchangeable. They are not.
- The right language gives you a power advantage over competitors, and in a startup the power advantage is the difference between winning and losing.
- Lisp is more powerful than its competitors in a specific and measurable way: macros and interactive development let one Lisp programmer do the work of several programmers in a less powerful language.
- Therefore, if you are a startup, you should use Lisp (or another high-powered language).

The essay includes the concept that would become Graham's most-cited idea, **the Blub paradox**. The Blub paradox is a thought experiment. Imagine a language, "Blub," which sits in the middle of the "power continuum" of programming languages. A Blub programmer looks at languages more powerful than Blub and cannot see why they matter — the features of the more powerful languages look pointless or confusing, because Blub already has everything the programmer has ever needed. The Blub programmer looks at languages *less* powerful than Blub and can immediately see that they are less powerful, because they lack features the Blub programmer uses every day. The asymmetry is the trap: you can see down the power continuum, but you cannot see up it. You cannot see the value of a feature you have never used. Therefore, when a Blub programmer says "I have no need for Lisp's features," that statement is not evidence that the features are useless; it is evidence that the programmer does not know what they are missing.

The Blub paradox was a conversation starter and an argument ender in equal measure. It convinced some programmers to try Lisp. It enraged other programmers who felt (not without reason) that they were being called stupid. And it captured, precisely, the social dynamic that had always made it hard for Lisp to spread: you cannot sell a language by telling programmers that their current language is inferior, because they do not believe you, because they have no way to evaluate the claim without first learning the other language, and they have no motivation to learn the other language until they believe the claim. It is a fixed point of resistance.

### On Lisp, ANSI Common Lisp, and Hackers & Painters

Graham's books are a significant part of why Common Lisp has a modern cohort of programmers at all. **On Lisp** (1993) is a book about advanced macro programming in Common Lisp. It was published by Prentice Hall and sold poorly. In the early 2000s, Graham put the PDF online for free, and the book found the audience it had always deserved: a generation of hackers who had heard about Lisp's power and wanted to know how to use it. On Lisp is where most modern Lispers learn about anaphoric macros, continuation-passing macros, partial evaluators, and the kind of code generation that makes Lisp feel genuinely different from other languages. The book's central thesis — that Lisp programs should be built bottom-up, defining a domain-specific language in which the solution is easy to express, and then using that language to express the solution — is one of the most influential programming-style arguments of the last thirty years. Graham's example of bottom-up programming shows you writing a macro, then writing a macro that uses the first macro, then writing a function in the language defined by those macros, and finally realizing that you have designed a new sublanguage suited exactly to your problem. This is what Lisp people mean when they say "programmable programming language."

**ANSI Common Lisp** (1995) is Graham's introductory textbook to Common Lisp. It is shorter and gentler than Peter Norvig's PAIP and covers the language systematically. It is still in print.

**Hackers & Painters: Big Ideas from the Computer Age** (2004) is a collection of Graham's essays, many of them previously published on his website, on topics ranging from programming language design to startup advice to social observations about hackers as a subculture. The book was a minor bestseller and introduced many general readers to Graham's ideas about Lisp. The essays "The Hundred-Year Language" (which argues that there is a fundamental programming language that all practical languages are slowly converging toward, and that it looks a lot like Lisp) and "Revenge of the Nerds" (which retells the "beating the averages" argument in a more polemical form) are the Lisp-adjacent essays most often cited from the book.

### Arc and Y Combinator

Graham's own attempt to build a "better Lisp" was a project called **Arc**. Arc was a Lisp dialect that Graham started designing around 2001 with the explicit goal of being a tool for programming as it is actually done, with all the warts of Common Lisp removed and all the essentials kept. Arc's design principles were short names for common operations, a minimal core, and an emphasis on hacker ergonomics. Graham worked on Arc sporadically for years; the first public release was in 2008, and it is still maintained today, though its user community is small. Arc is best known as the language in which Hacker News — Y Combinator's news aggregator — was originally written, and as far as anyone knows, still is.

**Y Combinator**, the startup accelerator Graham cofounded with Jessica Livingston, Robert Morris, and Trevor Blackwell in 2005, is a more important part of Graham's legacy than Arc itself. Y Combinator has funded over four thousand startups, including Airbnb, Dropbox, Stripe, Reddit, DoorDash, Coinbase, and Instacart, and is now the most influential startup accelerator in the world. Its name — Y Combinator — is a direct reference to the lambda calculus: the Y combinator is the classical fixed-point combinator that lets you define recursive functions in a calculus without explicit recursion, and is one of the most elegant constructions in theoretical computer science. Graham named his accelerator after it as a kind of joke, but also as a signal about the intellectual tradition he came from. Every time a Y Combinator startup gets funded, it is Lisp's shadow falling on Silicon Valley.

The Paul Graham era — roughly 1995 to 2010 — did not restore Lisp to commercial dominance. What it did was create a second generation of Lisp enthusiasts who came to the language not from the MIT AI Lab but from Graham's essays. These were younger programmers, often from the dot-com era, who had absorbed the idea that Lisp was a secret weapon and had gone looking for it. They built new Common Lisp libraries, new Common Lisp implementations (Steel Bank Common Lisp — SBCL — forked from CMU Common Lisp in 2000 and became the dominant open-source Common Lisp of the 2000s and 2010s), new Common Lisp frameworks (Hunchentoot for web, Weblocks, etc.), and new documentation. The Common Lisp community today, small as it is, mostly exists because of Graham's essays and the generation of programmers they recruited.

---

## 7. The Clojure Renaissance

### Rich Hickey

In 2007, a veteran Java programmer named Rich Hickey released the first public version of a language he had been working on privately for two years: **Clojure**. Hickey had been programming professionally for almost twenty years, mostly in C++ and Java and Common Lisp, and had reached a point in his career where he was dissatisfied with all of them. C++ and Java were verbose, impedance-mismatched with the problems he was trying to solve, and fundamentally unfriendly to the kind of concurrent, data-oriented programming he thought the industry was about to need. Common Lisp was powerful but was carrying a lot of 1980s baggage, had weak concurrency support, and could not easily interoperate with the JVM ecosystem that most working programmers now depended on.

Hickey took a sabbatical — he has said he used his own savings to fund two years of full-time language design — and came out with Clojure. Clojure is a Lisp. It has parentheses, macros, first-class functions, a REPL, and most of the features you would expect from a modern Lisp. But Clojure is a Lisp with a very specific set of opinionated choices, and those choices made it the most successful new Lisp in a generation.

### The design decisions

Clojure's design decisions are worth enumerating because they constitute one of the clearest arguments any language has ever made about what matters.

**Run on the JVM.** This is the single most consequential decision. Hickey had concluded — correctly — that a new language in 2007 could not succeed unless it could interoperate with an existing huge library ecosystem. The JVM had the Java ecosystem, which included tens of thousands of open-source libraries and the production infrastructure of most large companies. By building on the JVM, Clojure could use any Java library from day one and could run anywhere Java ran. It also meant Clojure inherited the JVM's runtime performance, its garbage collector, and its debugging tools. A Lisp that had taken its own runtime (like most Common Lisp implementations) would have had to rebuild all of that. A Lisp that ran on the JVM got it for free. (ClojureScript, released in 2011, later made the same bet with JavaScript on the browser.)

**Immutable data structures by default.** Clojure's list, vector, map, and set types are all immutable. You cannot modify a Clojure map; you create a new map that differs from the old one. This sounds catastrophically inefficient, and in a naive implementation it would be, but Clojure uses *persistent data structures* (Hickey credited Chris Okasaki's 1998 book *Purely Functional Data Structures* and Phil Bagwell's work on hash-array-mapped tries as inspirations) that share structure between versions. Updating a map of a million entries to add one new entry does not copy the million entries; it shares the old tree and adds a new branch, using log-base-32 time. The practical effect is that you get the safety of immutability with near-mutable performance, which makes concurrent programming radically simpler: if no one can mutate a data structure, no one can race on it. Clojure's default-immutability was the most important programming-language decision of the 2000s and is now being imitated by every major language in some form.

**Separate identity from state.** This is Hickey's phrase and it is a deep one. In most languages, a variable *is* its current value in some conflated way — you cannot talk about "the variable over time" as a distinct thing from its current state. In Clojure, you talk about *identities* (called refs, atoms, agents, vars, depending on the concurrency model) and their *states* (immutable values). An identity is a conceptual thing — a bank account, a user session, a running process. A state is a particular snapshot of that thing at a point in time. Changing an identity means atomically swapping in a new immutable state. This sounds abstract, but once you internalize it, concurrent programming becomes a different and much easier discipline. Hickey developed this distinction in a series of talks that are now considered required viewing in the Clojure community.

**Concurrency primitives built in.** Clojure has refs (software transactional memory, STM), atoms (compare-and-swap for uncoordinated updates), agents (asynchronous, independent updates), and vars (per-thread dynamic binding). Each is suited to a different concurrency use case. The STM implementation, in particular, was one of the first production-grade STMs in any mainstream language and made writing concurrent code dramatically safer than it was in Java.

**Lisp-1 and lexical scope.** Clojure is a Lisp-1 (a single namespace for functions and variables, like Scheme) rather than a Lisp-2 (separate namespaces, like Common Lisp). It uses lexical scope throughout. These were controversial choices among Common Lisp veterans but made the language feel cleaner and more approachable to newcomers.

**A data-first view of everything.** Clojure's core philosophy is that data is more important than code, and that most programs should be manipulating data in well-defined ways. Hickey's talks argue that the reason object-oriented programming tends to make codebases hard to maintain is that OO hides data inside objects and forces you to interact with it through ad hoc methods, when what you actually want is to see the data directly and operate on it with a small number of general-purpose functions. Clojure's core library is organized around this principle: there are about a hundred functions (map, filter, reduce, assoc, dissoc, merge, etc.) that operate on Clojure's four core data structures, and most application code is written as compositions of these functions.

### The talks

Rich Hickey is one of the most effective communicators any programming language has ever had. He has given a series of conference talks — recorded and available on YouTube and at Clojure's InfoQ and Strange Loop archives — that have become standard references in the broader programming community, not just among Clojure programmers. The most important ones:

**"Simple Made Easy"** (Strange Loop, 2011) is arguably the single most influential programming talk of the 2010s. Hickey argues that the words "simple" and "easy" mean different things — "simple" means un-braided, not compound, not tangled, while "easy" means familiar, near at hand, low-friction. Most of the tools the industry reaches for (object-oriented programming, ORMs, complex frameworks) are *easy* but not *simple*; they feel natural to use but are internally tangled and produce systems that are hard to reason about. Good engineering, Hickey argues, means choosing simple tools over easy ones. The talk is forty-five minutes long and has been watched literally millions of times; it is cited by programmers who have never written a line of Clojure.

**"Hammock Driven Development"** (2010) argues that the most important engineering work happens not at the keyboard but in the hammock — that is, when you are sitting quietly thinking about a problem before you start coding. Hickey makes the case that in the rush to "agile" and "just ship it," the programming community has lost the practice of deep thought, and that the result is systems that are poorly conceived and have to be rewritten over and over.

**"The Value of Values"** (2012) is a philosophical argument for immutable values as a first-class concept. Hickey contrasts "place-oriented programming" (where data lives in mutable places and you update the places) with "value-oriented programming" (where data is immutable and updates mean making new values). The talk is a manifesto for functional programming as a practical discipline rather than a theoretical curiosity.

**"Effective Programs — 10 Years of Clojure"** (2017) is a retrospective on what Hickey got right and wrong in Clojure's first decade, and on the general problem of building programs that work in the long run.

**"Maybe Not"** (2018) is a critique of Haskell's `Maybe` type and, more broadly, of the idea that static types solve all problems. It is a polite but firm argument that the typed-functional-programming community has overcommitted to static types at the expense of runtime flexibility.

**"Spec-ulation"** (2016) introduced `clojure.spec`, Clojure's answer to the static-vs-dynamic-types debate: a runtime contract system that lets you specify the shape of data without making the shapes part of the type system. The talk includes a long argument about versioning and compatibility that has become standard reference material on how libraries should evolve.

These talks matter because they are not just about Clojure. They are about what good software engineering looks like, and they use Clojure as a case study. Hickey has managed to do for Clojure what Graham did for Common Lisp: he has made the language feel like a position in a broader argument about programming, rather than just a tool. Whether or not you agree with the position, you have to engage with it.

### ClojureScript and the spread

**ClojureScript**, released in 2011, is Clojure compiled to JavaScript. It runs in the browser and on Node.js. ClojureScript is important because it brought Lisp to the front-end web developer audience — a group that had never encountered Lisp and was, for the first time in a long time, open to functional programming ideas because of the rise of React and the React-adjacent functional-reactive style. ClojureScript applications typically use a wrapper around React called Reagent or re-frame, which turn the already-functional React programming model into something even more functional and Clojure-native. For several years in the mid-2010s, ClojureScript was the fastest-growing Lisp in the world.

**Datomic**, Rich Hickey's next project after Clojure, is a database built on Clojure principles: immutable data, time as a first-class concept (you can query the database "as of" any point in the past), and a separation of reads from writes. Datomic is commercial and has found a niche in applications where auditability and time-travel queries are critical.

**core.async**, a Clojure library for communicating sequential processes (CSP)-style concurrency, brought Go's channel model to Clojure as a library — without requiring any language changes. The library uses Clojure's macro system to rewrite straight-line code into a state machine that suspends and resumes on channel operations, which is the kind of thing macros are good for and which in most other languages would require compiler support.

**transducers**, introduced in Clojure 1.7 (2015), are a generalization of the map/filter/reduce pattern that separates the transformation from the data source. A transducer is a function that, when composed with a reducing function, produces a new reducing function. This lets you define transformations once and apply them to lists, lazy sequences, channels, or anything else reducible. It is the kind of abstraction that only Lisp macros make practical, and it is one of the clearest demonstrations of why a powerful language lets you build features as libraries that would require language extensions elsewhere.

The Clojure renaissance is still ongoing. Clojure has never become a top-ten mainstream language, and Hickey has said explicitly that he does not want it to — Clojure is for people who are willing to take the ideas seriously, and mass adoption would bring in people who just want a familiar JVM language with less boilerplate, which would dilute the community. But Clojure has a stable, committed community, a mature ecosystem, and a set of ideas that have influenced the broader programming world far out of proportion to the language's market share. It is, in a sense, exactly the kind of Lisp revival that the Lisp community has been waiting for: a Lisp that picks up Lisp's ideas, leaves behind Lisp's historical baggage, and makes a pitch to the mainstream on the mainstream's own terms.

---

## 8. Philosophy: The Greatest Programming Language Ever Designed

This is the philosophical spine of the document. Everything before this was history. This section is an attempt to say, as clearly as possible, what Lisp *is* — what Lisp has always meant and what it continues to mean — and why the Lisp community is right to think that something is different about it.

### Alan Kay's claim

Alan Kay, the computer scientist who invented Smalltalk and coined the phrase "object-oriented programming" and worked at Xerox PARC during its golden age, has said on many occasions some version of the following:

> "Lisp is the greatest single programming language ever designed."

Kay is not a Lisper. He is the creator of a competing tradition — Smalltalk and object-oriented programming. He has every reason, if he were a partisan, to dismiss Lisp. But Kay keeps saying this, and when he elaborates, his reasoning is essentially mathematical: Lisp, Kay says, is the only programming language whose specification fits on a single sheet of paper and which, from that single sheet, generates the full power of computation. Every other language requires a huge manual because every other language is a pile of accreted special cases. Lisp requires only a short document because Lisp is a single idea applied consistently.

Kay's phrase for this is **"the Maxwell's equations of software."** Maxwell's equations, in physics, are four short equations that together describe the entire behavior of the classical electromagnetic field: electricity, magnetism, light, radio, X-rays, everything. They fit on a T-shirt. From those four equations, with enough mathematical manipulation, you can derive every phenomenon in classical electromagnetism. They are the ultimate statement of what "simplicity" means in a scientific law: not "small vocabulary" but "small vocabulary that nonetheless generates everything."

Kay's claim is that McCarthy's `eval` function is software's equivalent. In half a page of Lisp, McCarthy defines a universal interpreter — a program that, given any well-formed program as input, produces the value that program computes. The `eval` function refers to only a handful of primitive operations (quote, atom, eq, car, cdr, cons, cond, lambda), and from those primitives, via recursion, it generates the entire semantics of a Turing-complete programming language. If you believe the Church-Turing thesis, then whatever you can compute, you can compute in Lisp, and the full description of how you compute it in Lisp fits on half a page. No other programming language can claim this. Python's specification is a thousand pages. C's specification is hundreds of pages. Java's specification is longer than most novels. Lisp's specification is half a page of Lisp.

This is not an accident, and it is not a trick of the specification format. It is a consequence of how Lisp was built. Lisp was built *outward* from the lambda calculus, which is itself the most minimal formalism for computation anyone has ever found. Everything in Lisp — functions, data, control flow, iteration — is expressed as the application of a function to arguments. The evaluator only has to know one rule: to evaluate `(f a b c)`, evaluate `f`, evaluate `a`, evaluate `b`, evaluate `c`, and apply the value of `f` to the values of `a`, `b`, and `c`. That's it. That's the whole rule. Everything else — recursion, iteration, conditionals, data structures, control flow, pattern matching, object orientation, exception handling, metaprogramming — is built out of that one rule, plus a small number of special forms (quote, if, lambda, define) that are special because the one rule does not quite work for them.

### Homoiconicity

The word homoiconicity, from the Greek "homo" (same) and "icon" (representation), was coined in the late 1960s to describe languages in which the primary representation of programs is also a primary data structure of the language. Calvin Mooers used the term to describe TRAC, his string-based language. Peter Landin and others used it loosely in discussions of Lisp. The word did not quite stick to Lisp as its canonical name, but the idea is pure Lisp.

In Lisp, a program is a list of lists. When you write `(+ 1 (* 2 3))`, you are writing a list whose first element is the symbol `+`, whose second element is the number 1, and whose third element is a list whose first element is `*`, whose second element is 2, and whose third element is 3. This is a data structure in the normal sense of the word — you can construct it, walk it, modify it, pass it around. It is also a program — you can hand it to `eval` and get back the value 7. The same tree, read in two different modes, is either data (inert, manipulable) or code (active, computable). Lisp makes the transition between these modes explicit: the `quote` operator (or its shorthand `'`) turns a would-be program into data, and `eval` turns data back into a running program. Every Lisp program can write programs. Every Lisp program can read programs. The wall between "code" and "data" that most languages enforce absolutely does not exist in Lisp.

This has enormous consequences. The most visible one is **macros**. A macro in Lisp is a function from code to code: given a piece of source code (as a tree of lists), the macro returns a transformed piece of source code that the compiler then compiles in place of the original. Macros let you extend the language. You can add new control structures (Common Lisp's `loop` macro, which gives you a sublanguage for iteration, is itself implemented as a macro). You can add new abstractions (the `defmacro` system lets you define, for example, a pattern-matching construct that does not exist in the base language). You can build domain-specific languages (Rich Hickey's `core.async` library is a macro-based implementation of a language-level feature, CSP concurrency, that other languages have to add to the compiler). The only thing macros cannot do is break out of the evaluation model entirely, and they rarely need to.

Macros exist in other languages — C has the preprocessor, Rust has `macro_rules!` and procedural macros, Elixir has quote/unquote, Scala has (had) macros, Julia has macros. But in every case, those other languages had to add special support for macros to their compilers, and in every case, the macros are second-class — they have their own syntax, their own semantics, their own debugging story, their own bugs. In Lisp, macros are first-class because they do not need special support: a macro is just a function from lists to lists, and the compiler runs the function before evaluating the result. That is the entire implementation of Lisp macros. Every other language's macro system is catching up with the fact that if you want macros to work this well, your syntax has to be a data structure, and the only practical way to make your syntax a data structure is to use something like S-expressions.

The parentheses that Lisp outsiders complain about are not a mistake. They are the price of homoiconicity. You cannot have a powerful macro system without a regular, parseable syntax. The regular, parseable syntax is parentheses. There are languages that have tried to combine C-like syntax with Lisp-like power (Dylan tried, Honu tried, various others have tried), and they have all either failed or ended up with their own set of notational weirdnesses. Parentheses are Lisp's payment for the most expressive programming model anyone has ever designed. It turns out to be a reasonable price, if you can get past the aesthetic shock, and Lispers pay it gladly.

### The meta-circular evaluator

The **meta-circular evaluator** is the thing you write when you are teaching yourself how Lisp works. The exercise is this: write a Lisp interpreter, in Lisp, that can run Lisp programs. The interpreter is called "meta-circular" because it is written in the same language it interprets — the language is defining itself. Here is a sketch of what one looks like, simplified down for exposition:

```lisp
(define (eval exp env)
  (cond ((number? exp) exp)
        ((symbol? exp) (lookup exp env))
        ((eq? (car exp) 'quote) (cadr exp))
        ((eq? (car exp) 'if)
         (if (eval (cadr exp) env)
             (eval (caddr exp) env)
             (eval (cadddr exp) env)))
        ((eq? (car exp) 'lambda)
         (list 'closure (cadr exp) (caddr exp) env))
        (else
         (apply (eval (car exp) env)
                (map (lambda (e) (eval e env)) (cdr exp))))))

(define (apply proc args)
  (cond ((primitive? proc) (apply-primitive proc args))
        (else
         (eval (caddr proc)
               (extend-env (cadr proc) args (cadddr proc))))))
```

That's it. That is, essentially, the semantics of Lisp. With a few auxiliary functions (`lookup`, `extend-env`, `apply-primitive`, and definitions for the basic types), this is a working Lisp interpreter. You can hand it a Lisp program — quoted, because you want it as data, not as code — and it will evaluate the program and return the value.

The meta-circular evaluator is taught in SICP's fourth chapter, and it is one of the most important exercises in computer science education. Writing a meta-circular evaluator forces you to understand how an interpreter works at the deepest level, because you cannot write one without understanding exactly what "evaluate" and "apply" mean for every kind of expression. Once you have written one, you understand Lisp (and, to a large extent, programming languages in general) in a way that you did not before. SICP says this explicitly: the chapter on the meta-circular evaluator is titled "Metalinguistic Abstraction," and its thesis is that the highest form of programming is the creation of new languages, and that the way you learn to create languages is by writing interpreters for them. Lisp is uniquely suited to this form of education because the interpreter you write fits on a page and because the language you are writing the interpreter in is the same language you are interpreting, so there is no mismatch between the metalanguage and the object language. You are swimming in a pool that is made of the same water as the pool you are swimming in.

### Lambda calculus to AI to ML

There is a through-line from the lambda calculus through Lisp through the early AI era through modern machine learning that is worth drawing out, because the through-line is not accidental. Church's lambda calculus was an attempt to formalize "effectively calculable functions." McCarthy's Lisp was an attempt to use Church's formalism as a programming language for manipulating symbolic expressions, with the goal of building programs that could reason about the world. The MIT AI Lab spent two decades trying to build symbolic reasoning systems in Lisp — expert systems, planners, natural language understanders, vision systems, theorem provers. The symbolic AI program largely did not reach its ultimate goals; we do not have commonsense reasoning, we do not have general problem solvers, and the expert systems of the 1980s did not become general-purpose intelligent systems. In the 1980s and 1990s, the field pivoted toward statistical methods — neural networks, Bayesian learning, eventually deep learning. The symbolic AI tradition receded.

But the symbolic AI tradition did not disappear, and neither did its relationship to Lisp. The tools the symbolic AI people built — languages for expressing and manipulating trees of symbols, algorithms for walking and transforming those trees, representations that could mix data and code — turned out to be exactly the tools you need when you want to build a compiler, a programming language, a program analyzer, or any other kind of meta-program. This is why compiler construction courses often use Lisp or Scheme (or Racket, which is Scheme with more features). It is why Jeremy Siek's work on gradual typing uses Racket. It is why the Scala compiler and the Kotlin compiler and the Rust compiler are all, under the hood, doing things that look suspiciously like what the symbolic AI people were doing in the 1970s.

The relationship goes the other way, too. Modern machine learning, despite being statistical rather than symbolic, depends on computational infrastructure that is deeply influenced by the Lisp tradition. The leading ML frameworks — TensorFlow, PyTorch, JAX — all have computational graphs at their core, and computational graphs are trees of operations that are very much in the Lisp spirit. When you write JAX code, you are writing pure functions that the JAX system traces, transforms, and compiles — using techniques that the Lisp community developed in the 1970s and 1980s for partial evaluation and compiler transforms. The Google Brain team that built TensorFlow included former Lispers who brought their sensibilities with them. Jeff Dean has cited Lisp as an influence on his thinking. The recent surge of interest in "differentiable programming" — programs where every operation is differentiable, so that you can take gradients of entire programs and use them for learning — is, in spirit, a Lisp-style idea: treat the program as data, transform it, and run it.

There is a poetic reading of the history: Church's lambda calculus was the mathematical foundation. Lisp made the lambda calculus computable. Symbolic AI tried to build intelligence on top of Lisp and mostly failed. Statistical ML succeeded where symbolic AI failed, but it succeeded using infrastructure and ideas that the Lisp tradition had been cultivating for decades. The recent fusion of deep learning with compiler technology — the tools that run the models, like JAX and TensorFlow's XLA and PyTorch's torch.compile — is bringing the two traditions back together. You cannot build a modern ML system without, at some level, doing the kind of tree-manipulation and symbolic-reasoning that Lisp was built for. Church and McCarthy are still, seventy-five years later, at the bottom of the stack.

### Every language becomes Lisp

There is a running joke in the Lisp community that goes: "Every sufficiently advanced programming language reinvents Lisp, badly." It is a joke, but it has become one of those jokes that are funny because they are almost entirely true. Consider the pattern of feature addition to mainstream languages over the past three decades:

- **Garbage collection.** Invented by McCarthy for Lisp in 1960. Arrived in Java in 1995, C# in 2002, Python in 1990 (with generational collection in 2000), Ruby at the start, JavaScript at the start. Even C++ has gotten a working GC of sorts in its later standards. Every mainstream language except C eventually got garbage collection.

- **First-class functions.** In Lisp since 1960. Arrived in Python in 1991, JavaScript in 1995, PHP in 2009, C# in 3.0 (2007), Java in 8 (2014), C++ in 11 (2011, via lambdas).

- **Closures.** Implicit in Lisp's scope rules from day one, formalized in Scheme in 1975. Arrived in essentially the same order as first-class functions, sometimes later when the language added them properly.

- **Dynamic typing.** In Lisp since 1960. The entire "dynamic language" movement of the 1990s-2000s (Python, Ruby, PHP, Perl, JavaScript) is a rediscovery of what Lisp already had.

- **Structured exception handling with recovery.** In Common Lisp's condition system, 1984 (more sophisticated than any exception system that has followed). Arrived in Java in 1996 (in a weaker form), C# in 2000, Python in 1991.

- **Macros (of various power).** In Lisp since 1963. Arrived in C (as the preprocessor) in the 1970s (crude), in Scheme's `syntax-rules` in R4RS (1991, safer but weaker), in Dylan in the 1990s, in Scala in 2013 (later removed), in Rust in 2014-present, in Julia in 2012. Every attempt to add macros to a language with non-S-expression syntax is an attempt to get back to what Lisp had from the start.

- **List comprehensions.** In Miranda in 1985, influenced by set-builder notation and by Lisp's `map`/`filter`/`reduce` tradition. Arrived in Python in 2000, JavaScript (array methods) around the same time, Scala as for-comprehensions.

- **Anonymous functions.** In Lisp since 1958 (as `lambda`). Arrived in C++ in 11, in Java in 8, in C# 2.0 (2005).

- **Dynamic dispatch / multiple dispatch.** Multiple dispatch was CLOS's signature feature in 1988. Arrived in Julia as a core feature in 2012. Still not in most mainstream languages.

- **Metaclasses.** A CLOS feature in 1988. Arrived in Python in a limited form in 2.2 (2001), fully in 3.0. Still not in Java or C# in any meaningful form.

- **Reflection.** Lisp had full reflection from the start (because code was data). Java added reflection in 1.1 (1997). C# has had it from the start. Python has it.

- **JIT compilation.** Early Lisp systems had incremental compilers that did something like JIT compilation in the 1970s. Self (Smalltalk-family) had a real JIT in 1991. Java HotSpot shipped in 1999. V8 for JavaScript shipped in 2008. Every major language with dynamic typing eventually gets a JIT.

- **Lazy evaluation, or at least lazy sequences.** In some Lisp dialects since the 1970s, in Haskell as a core feature since 1990, in Clojure since 2007, in Python via generators since 2.2 (2001).

- **Software transactional memory.** Prototyped in Common Lisp in the 1990s, built into Clojure in 2007, added to Haskell around the same time.

- **Domain-specific languages as a first-class concept.** Always a Lisp idiom. Gradually adopted by Ruby (via its metaprogramming), Scala (via its operator overloading and implicits), Rust (via macros), and others.

The pattern is clear: good ideas from Lisp propagate slowly outward to other languages, usually arriving ten to thirty years after they were first developed in Lisp, usually in a form that is weaker or more constrained than the Lisp version. The reason is that most language designers start with a fixed syntax and a fixed parser, and then find that adding "macros" or "metaprogramming" or "first-class functions" to an existing parsed language requires extensive special-case support in the compiler. Lisp's advantage is that the parser is trivial, the syntax is a data structure, and the special cases are not special cases — they are consequences of the one evaluation rule. So Lisp can add features by writing libraries, while other languages have to add them by changing the compiler. Over time, the features accumulate, and every other language slowly approaches the expressive power Lisp already had.

This is what Greenspun's Tenth Rule is really saying. As a C program grows, its author starts needing the features Lisp has: dynamic dispatch, garbage collection, macros, reflection, closures. The C programmer does not know they are reinventing Lisp; they just know that their program has grown a strange function pointer dispatch system, and a custom object model, and a reference counter, and a config-file interpreter that has started to look suspiciously like a programming language. The C programmer has built, by hand, a bad implementation of half of Common Lisp, and they do not know it because they have never used Common Lisp. If they had, they would have reached for the language that already had these features and saved themselves a year of work.

### The parentheses are not the problem

People who have never used Lisp almost universally have one objection to it: the parentheses. There are too many. They are ugly. They make the code hard to read. This objection is wrong, and it is worth explaining why, not because the objection is important but because the wrongness of the objection is revealing.

The parentheses in Lisp are not decoration. They are the syntax. Every Lisp expression is a parenthesized list. The parentheses show you, visually, the tree structure of the expression. In most other languages, the tree structure is hidden inside the operator-precedence rules — you have to know that `*` binds tighter than `+`, that `&&` binds tighter than `||`, that `.` binds tighter than `->`, and so on. In Lisp, there is no operator precedence, because there are no operators in the mathematical sense; everything is a function call, and the parentheses show you which function is being called on which arguments. The tree is visible. This is, once you get used to it, a feature, not a bug.

What programmers who complain about parentheses are really complaining about is unfamiliarity. They are used to infix notation (because they learned arithmetic in school using infix notation), and Lisp uses prefix notation. The switch from infix to prefix is jarring. But the jarring-ness is a one-time cost, not an ongoing one. After a few months of Lisp programming, the parentheses become invisible — they are structural guides that your eyes skip over, the way your eyes skip over indentation in Python. Experienced Lispers do not see parentheses; they see trees. When you ask an experienced Lisper "isn't it hard to keep track of all the parens?", they give you a puzzled look, because they have not been tracking parens for years — their editor tracks parens (every Lisp editor has paren-matching built in), and they have been thinking in terms of the expressions the parens delimit.

The more interesting version of the parens objection, which you hear from more thoughtful critics, is that Lisp's uniform syntax makes it hard to *skim* code. In C or Python, you can skim a file and pick out the control structures visually: `if` statements stand out, loops stand out, function definitions stand out. In Lisp, everything looks the same — every expression is a list with a word at the front — so skimming is harder. This is a real observation, and a real tradeoff. Lisp does lose some skimmability in exchange for its uniformity. But what Lisp gains in exchange is that every structure can be user-defined. If you want your own control structure, you can define it, and it will look exactly like the built-in control structures, because there is no syntactic distinction. In C, you cannot define your own `for` loop. In Lisp, you can, and your new loop looks indistinguishable from the original. This is another form of the same point: Lisp trades a bit of visual variety for a bit of extensibility, and in the long run the extensibility is worth more.

### Constraint thinking

There is a connection between Lisp and the broader tradition of *constraint thinking* — the idea that programming is really about setting up a system of constraints and letting the computer find solutions that satisfy them. The PCH (Punch Cards) philosophy document in this research series explores this idea at length, noting that punch-card-era programmers, because they had to minimize re-runs, became exceptionally good at thinking before coding — at figuring out the constraints of a problem and then writing code that followed from those constraints rather than code that had been iteratively debugged into shape. Lisp has a similar relationship to constraint thinking, but from a different direction.

Lisp encourages you to think about your problem domain before you start writing code. The standard Lisp workflow is to define the data structures first — to figure out what kind of tree you are working with — and then to define the functions that operate on those structures, and then to define the macros that give you a nicer notation for writing those functions. At each level, you are thinking about constraints: what does this data type allow? What must these functions preserve? What does this macro mean in terms of the underlying functions? This is a very different workflow from the "just start coding and see what happens" approach that dominates Python and JavaScript tutorials, and it produces a different kind of program. A well-written Lisp program is a tower of abstraction where each level is built on the level below it, and each level makes the next level cleaner and shorter. A well-written Lisp program is not a sequence of instructions; it is a custom language designed for the problem domain, in which the solution is a short program.

This is what Paul Graham meant by "bottom-up programming." You are not writing a program that solves the problem directly. You are building the tools you need to express the solution, and then using those tools. The Lisp community has been doing this since the 1960s, long before the phrase "domain-specific language" existed, and long before the software engineering mainstream started talking about "language-oriented programming." The culture that produced Lisp believed that computation was a medium for expressing ideas, and that the best way to express a complicated idea was to build, first, a language in which the idea became simple. The meta-circular evaluator is the ultimate example: you express what it means to run Lisp by writing a very short program in Lisp. The Lisp in which you write the program is a language suited to expressing evaluation — so suited that evaluation can be described in half a page.

### Why isn't Lisp more popular?

This is the question Lispers are asked most often by non-Lispers, and it is the question Lispers have been trying to answer, to themselves and to the world, for fifty years. The answers are many and not entirely consistent with each other:

- **Hardware economics killed the Lisp Machine.** The custom-hardware era of Lisp coincided with an era when custom hardware had to pay for itself in speed, and generic workstations caught up in the late 1980s. The Lisp community was left without a viable commercial hardware platform at exactly the moment when the C/Unix/workstation ecosystem was taking off.

- **The language was too large by the time it was standardized.** Common Lisp emerged from committee in 1984 with thousands of features, a specification of over a thousand pages, and the political scars of the standardization fight baked in. It was not a language that could compete with the lightweight scripting languages of the 1990s on approachability.

- **The parentheses are a social barrier.** Even though they are not an actual cognitive barrier after a short adaptation period, they look weird, and "looking weird" is a significant obstacle to mass adoption. Languages that look like C have an unfair advantage in terms of easy adoption by programmers who already know C-like languages.

- **Lisp's culture was bad at evangelism.** Lispers tended to believe that being better was enough. It wasn't.

- **The Lisp curse.** Lisp is so powerful that every Lisp programmer builds their own solution to every problem, and the community cannot converge on shared libraries the way Python or Ruby or Go communities do. This produces a fragmented ecosystem that is hard for newcomers to navigate.

- **Lisp lacked a killer app.** Python had Django and the scientific Python stack (NumPy, SciPy, pandas). Ruby had Rails. JavaScript had the browser. C had Unix. Perl had CGI scripts. Lisp's killer app (symbolic AI) collapsed in the 1980s, and Lisp never found a replacement killer app until Clojure connected it to the JVM and the web in 2007.

- **Lisp's hiring pool is too small.** Because Lisp is not widely known, companies cannot easily hire Lisp programmers, which means they do not use Lisp, which means there are no jobs for Lisp programmers, which means nobody learns Lisp. This is a classic network-effect trap. You can break out of it — some Lisp shops do — but it takes effort.

- **The good ideas from Lisp have spread to other languages, so the marginal benefit of switching has decreased.** In 1980, Lisp's garbage collection and first-class functions and dynamic typing were unique. In 2020, Python has all of those things, and while Lisp still has macros and a more powerful evaluation model, the difference is smaller than it used to be. The gap has narrowed.

All of these answers are partly true, and none of them is the whole truth. The real answer, if there is one, is probably that Lisp is a language for a certain kind of programmer — one who cares about power and expressiveness more than about approachability, one who is willing to think before writing, one who enjoys the discipline of building abstractions from the ground up — and that kind of programmer has always been a minority. Lisp's share of the programming world has never been zero and has never been large. It has hovered in the "significant minority" range for decades, and that is probably where it will stay. The Lisp community has, at various times, held out hope that Lisp would become mainstream, and that hope has always been disappointed. The more mature version of the hope, which you hear from Lispers today, is that Lisp does not need to be mainstream to be important. It just needs to keep existing, keep pushing the envelope, keep being the place where good ideas get tried out ten or twenty years before the mainstream catches up.

### The question that won't go away

Something interesting happens over and over in the history of programming languages: every generation of programmers rediscovers Lisp. Some twentysomething, working in Java or Python or JavaScript or Rust, runs into a problem that feels like it should be simpler than it is. They start reading around, looking for a better way. They stumble across Paul Graham's essays, or Rich Hickey's talks, or the SICP lectures on YouTube, or a GitHub repo that uses Clojure, or an old-timer on Hacker News talking about the MIT AI Lab. They open a Lisp tutorial. They write their first `(+ 1 2)`. And something clicks. They realize that the thing they were struggling with in Java is not a thing in Lisp because Lisp solved it forty years ago and never forgot. They become a new Lisp believer, learn the dialect, argue with people on the Internet about parentheses, and eventually either (a) find a niche where they can use Lisp and stay there, or (b) go back to their day job with a new perspective on what their day job could have been.

This happens every year. It happened to me (the writer of this document) when I read *Hackers & Painters* and then worked through PAIP in a year. It happens to students who take 6.001 at MIT (back when it was still taught in Scheme) and come out changed. It happens to programmers who discover Clojure because their company is using it. It happens to people who read Peter Norvig's essays and go looking for the language he was writing in. The recurring rediscovery of Lisp is one of the most interesting sociological phenomena in programming, and it is worth asking: what does it mean?

One reading is that Lisp really is good, and programmers who find it are having a genuine insight. Another reading is that programmers are romantics, and Lisp is a romantic language, and the rediscovery is more about the mystique of a lost golden age than about the language itself. Both readings are partly right. The golden age was real — the MIT AI Lab really was a special place, the Lisp Machines really were the most advanced programming environments of their time, Common Lisp really is more powerful than Java in ways that matter — but so is the romance, and it would be naive to pretend that the romance is not part of why Lisp keeps finding new converts. Lisp is, among other things, the programming language of a particular nostalgic tradition: the tradition of hackers in the MIT sense, people who love computing for its own sake, who treat code as art, who believe that programming language design is one of the great intellectual pursuits of the twentieth and twenty-first centuries. You come for the power, you stay for the tradition.

What it means, finally, that Lisp keeps getting rediscovered is this: the questions Lisp asks are still interesting. How much can you express with how little? Can code and data be the same kind of thing? Can the interpreter be written in the language it interprets? Can a language be extended by its users without changes to the compiler? Can a program be built bottom-up as a custom language in which the solution is short? These questions are not resolved. They are still, seventy years after McCarthy's first sketch, among the deepest questions in programming language design. Lisp is the language that asked them first, and the language that keeps answering them with the greatest force, and for that reason Lisp will keep mattering as long as people write programs. The parentheses are not a problem. The parentheses are a signal: you are looking at a language that has taken seriously an idea that most languages paper over, and the signal is worth more than the momentary cost of learning to read it.

### A final citation list for this section

The philosophical arguments above draw on a set of classic sources that anyone serious about Lisp should read:

- **Graham, Paul.** *On Lisp* (1993). Prentice Hall. Free PDF at paulgraham.com/onlisp.html. The bible of advanced macro programming in Common Lisp, and one of the clearest statements of the "bottom-up programming" philosophy.
- **Graham, Paul.** *Hackers & Painters: Big Ideas from the Computer Age* (2004). O'Reilly. Contains "Beating the Averages," "The Hundred-Year Language," and "Revenge of the Nerds," the three most-cited Graham essays on Lisp.
- **Norvig, Peter.** *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp* (1992). Morgan Kaufmann. The book that demonstrates, rather than argues, why Common Lisp was the right language for AI research.
- **Abelson, Harold, and Gerald Jay Sussman, with Julie Sussman.** *Structure and Interpretation of Computer Programs* (1984, second edition 1996). MIT Press. The preface to the first edition, in particular, is one of the most eloquent statements ever written about what programming is and what programming languages are for.
- **Gabriel, Richard P.** "The Rise of 'Worse Is Better'" (1989, published 1991 in *AI Expert Magazine*). The essay that the Lisp community has spent three decades arguing with itself about.
- **McCarthy, John.** "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I" (1960). *Communications of the ACM*, 3(4):184-195. The foundational document.
- **Steele, Guy L., and Gerald J. Sussman.** The Lambda Papers (1975-1979). Various MIT AI Lab memos. The mathematical justification for Scheme and, through Scheme, for the modern practice of functional programming.
- **Steele, Guy L., et al.** *Common Lisp: The Language*, second edition (1990). Digital Press. The canonical reference for Common Lisp before ANSI standardization.
- **Kiczales, Gregor, Jim des Rivières, and Daniel G. Bobrow.** *The Art of the Metaobject Protocol* (1991). MIT Press. The book that explains what object-oriented systems can be when you let the users reach into the implementation.

---

## 9. Timeline

A compressed chronology of Lisp, from lambda calculus to the present. Dates are for the first appearance, first release, or first major documentation, as appropriate.

**1928** — Hilbert poses the Entscheidungsproblem at the International Congress of Mathematicians in Bologna.
**1932-1935** — Alonzo Church develops the lambda calculus at Princeton as a foundation for mathematical logic and computation.
**1936** — Church publishes "An Unsolvable Problem of Elementary Number Theory," using lambda-definability to prove the Entscheidungsproblem undecidable. Turing independently publishes "On Computable Numbers," using Turing machines to reach the same conclusion. Kleene proves the three formalisms equivalent, establishing what will become the Church-Turing thesis.
**1956** — John McCarthy organizes the Dartmouth Summer Research Project on Artificial Intelligence. Term "artificial intelligence" is coined.
**1958** — McCarthy moves to MIT. Begins work on a list-processing language. AI Memo No. 8 describes early Lisp.
**1959** — MIT AI Memo No. 1 (renumbered series) describes Lisp. Steve Russell implements `eval` on the IBM 704, creating the first working Lisp interpreter.
**1960** — McCarthy publishes "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I" in *Communications of the ACM*. The foundational document.
**1960** — First Lisp garbage collector implemented by the MIT group.
**1962** — *Lisp 1.5 Programmer's Manual* published (McCarthy, Abrahams, Edwards, Hart, Levin). First widely-distributed Lisp. Steve Russell writes *Spacewar!* on the PDP-1.
**1962** — First Lisp compiler written in Lisp (Hart and Levin). The first compiler ever written in its source language.
**1963** — Hart's macro facility added to Lisp. Macros become first-class.
**1965** — BBN Lisp development begins at Bolt, Beranek, and Newman.
**1966** — Maclisp development begins at the MIT Project MAC.
**1968** — Macsyma symbolic mathematics project begins at MIT under Joel Moses.
**1969** — Carl Hewitt designs PLANNER at MIT.
**1970** — Terry Winograd writes SHRDLU in Micro-PLANNER/Maclisp.
**1972** — Warren Teitelman moves from BBN to Xerox PARC, taking BBN Lisp with him. It becomes Interlisp.
**1972** — Drew McDermott and Gerald Sussman write "Why Conniving Is Better Than Planning." CONNIVER briefly supersedes PLANNER.
**1974** — Richard Greenblatt begins the MIT Lisp Machine project.
**1975** — Sussman and Steele write the first Scheme interpreter at MIT. The Lambda Papers begin.
**1977** — First CONS Lisp Machine operational at MIT.
**1978** — Guy Steele's master's thesis, *Rabbit: A Compiler for Scheme*.
**1978** — CADR Lisp Machine operational at MIT.
**1979** — Richard Greenblatt founds Lisp Machines, Inc. (LMI).
**1980** — Russell Noftsker, Tom Knight, David Moon, Daniel Weinreb, and others found Symbolics, Inc. The Lisp Machine wars begin.
**1980** — MIT 6.001 (Structure and Interpretation of Computer Programs) first taught by Abelson and Sussman in Scheme.
**1981** — ARPA meeting launches the Common Lisp standardization effort. Guy Steele leads.
**1981** — Symbolics ships the LM-2, its first commercial Lisp Machine.
**1982** — Franz Lisp released at UC Berkeley for the VAX.
**1982** — Japanese Fifth Generation Computer Systems project launches, using Prolog rather than Lisp.
**1984** — Richard Stallman announces the GNU Project in response to the collapse of the MIT AI Lab community.
**1984** — Steele publishes *Common Lisp: The Language* (CLtL1). Digital Press.
**1984** — Abelson and Sussman publish *Structure and Interpretation of Computer Programs* (first edition).
**1984** — Steven Levy publishes *Hackers: Heroes of the Computer Revolution*.
**1984** — Symbolics goes public.
**1985** — R2RS (Revised Report on Scheme) published. GNU Emacs released with Emacs Lisp as its extension language.
**1986** — R3RS published.
**1986** — Objective-C added by NeXT. (Not Lisp, but the OO movement gains momentum.)
**1986** — AutoLISP ships with AutoCAD.
**1988** — AI winter begins. Symbolics stock crashes.
**1988** — CLOS (Common Lisp Object System) designed by Keene, DeMichiel, Gabriel, Kiczales, and others. First multiple-dispatch object system in a mainstream language.
**1989** — Richard Gabriel writes "The Rise of 'Worse Is Better.'"
**1990** — Steele publishes *Common Lisp: The Language*, second edition (CLtL2).
**1991** — Kiczales, des Rivières, and Bobrow publish *The Art of the Metaobject Protocol*.
**1991** — Gabriel publishes "Worse Is Better" in *AI Expert*.
**1991** — Python first released. Guido van Rossum cites Lisp as an influence on closures and higher-order functions.
**1991** — R4RS published. Scheme becomes a de facto standard for teaching.
**1992** — Peter Norvig publishes *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp* (PAIP).
**1993** — Paul Graham publishes *On Lisp* (Prentice Hall).
**1994** — ANSI Common Lisp standard (X3.226-1994) ratified. Common Lisp becomes the first ANSI-standardized object-oriented language.
**1994** — Lucid Inc. bankrupt. Its Common Lisp product is acquired by various parties.
**1995** — Paul Graham, Robert Morris, and Trevor Blackwell found Viaweb and write it in Common Lisp.
**1995** — Brendan Eich designs JavaScript at Netscape. "Scheme in C's clothing."
**1995** — Graham publishes *ANSI Common Lisp* (Prentice Hall).
**1996** — Macsyma open-sourced as Maxima.
**1996** — ITA Software founded in Cambridge by Jeremy Wertheimer. Builds its airfare engine in Common Lisp.
**1998** — Yahoo acquires Viaweb for $49 million. Renamed Yahoo Store.
**1998** — R5RS published. The most widely-adopted Scheme standard.
**2000** — SBCL (Steel Bank Common Lisp) forked from CMU Common Lisp. Will become the dominant open-source Common Lisp.
**2001** — Paul Graham publishes "Beating the Averages."
**2004** — Graham publishes *Hackers & Painters: Big Ideas from the Computer Age*.
**2005** — Graham cofounds Y Combinator with Jessica Livingston, Robert Morris, and Trevor Blackwell. Named after the lambda calculus fixed-point combinator.
**2007** — Rich Hickey releases Clojure. Built on the JVM, immutable by default.
**2007** — R6RS published. Controversial. Splits the Scheme community.
**2008** — Graham releases Arc publicly. Hacker News is rewritten in Arc.
**2010** — Google acquires ITA Software for $700 million. One of the largest Lisp-related exits ever.
**2011** — ClojureScript released. Lisp on the browser.
**2011** — Rich Hickey delivers "Simple Made Easy" at Strange Loop.
**2011** — Kotlin first previewed.
**2012** — Julia released. Multiple dispatch, macros, Lisp-family semantics with math-friendly syntax.
**2012** — Rich Hickey launches Datomic.
**2013** — R7RS published. Attempted reconciliation after R6RS.
**2013** — Scala 2.10 ships with macros (later deprecated).
**2014** — Java 8 ships with lambdas and the streams API. Lisp's revenge.
**2015** — Transducers added to Clojure 1.7.
**2015** — Rust 1.0 released. Macros heavily influenced by Scheme.
**2016** — Rich Hickey introduces clojure.spec at Clojure/conj.
**2017** — Hickey delivers "Effective Programs — 10 Years of Clojure."
**2018** — Hickey delivers "Maybe Not."
**2019** — JAX released at Google. Lisp-influenced functional programming for ML.
**2020** — SBCL celebrates 20 years as the dominant open-source Common Lisp. Still actively developed.
**2021** — Racket 8.0 ships with the new Chez Scheme-based backend.
**2022** — Clojure turns 15. Community remains stable.
**2023** — Large language models become mainstream. Interest in program synthesis and symbolic manipulation returns. Lisp-family languages newly relevant.
**2024** — SBCL 2.4 released.
**2025** — Clojure 1.12 released. Clojure's ecosystem crosses 20,000 libraries on Clojars.
**2026** — This document is written. Lisp is 66 years old, 68 if you count from Russell's first implementation, 94 if you count from Church's lambda calculus. It has outlived every announcement of its death and continues to quietly shape the languages that are announced as its replacements.

---

## 10. Bibliography

### Primary sources (papers, books, specifications)

- **Church, Alonzo.** "An Unsolvable Problem of Elementary Number Theory." *American Journal of Mathematics*, 58(2):345-363, 1936.
- **Church, Alonzo.** *The Calculi of Lambda Conversion*. Annals of Mathematics Studies, Princeton University Press, 1941.
- **Turing, Alan.** "On Computable Numbers, with an Application to the Entscheidungsproblem." *Proceedings of the London Mathematical Society*, series 2, 42:230-265, 1936.
- **McCarthy, John.** "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I." *Communications of the ACM*, 3(4):184-195, 1960. The foundational Lisp paper. Available online in many places.
- **McCarthy, John, Paul W. Abrahams, Daniel J. Edwards, Timothy P. Hart, and Michael I. Levin.** *Lisp 1.5 Programmer's Manual*. MIT Press, 1962.
- **McCarthy, John.** "History of Lisp." *ACM SIGPLAN Notices*, 13(8):217-223, 1978. McCarthy's own retrospective on the origins of Lisp.
- **Sussman, Gerald Jay, and Guy L. Steele Jr.** "Scheme: An Interpreter for Extended Lambda Calculus." MIT AI Memo 349, December 1975. The first of the Lambda Papers.
- **Steele, Guy L., and Gerald Jay Sussman.** "Lambda: The Ultimate Imperative." MIT AI Memo 353, March 1976.
- **Steele, Guy L., and Gerald Jay Sussman.** "Lambda: The Ultimate Declarative." MIT AI Memo 379, November 1976.
- **Steele, Guy L.** "Debunking the 'Expensive Procedure Call' Myth, or, Procedure Call Implementations Considered Harmful, or, Lambda: The Ultimate GOTO." MIT AI Memo 443, October 1977.
- **Steele, Guy L.** *Rabbit: A Compiler for Scheme*. MIT AI Technical Report 474 (master's thesis), May 1978.
- **Steele, Guy L.** *Common Lisp: The Language*, first edition. Digital Press, 1984.
- **Steele, Guy L.** *Common Lisp: The Language*, second edition. Digital Press, 1990. Freely available at cs.cmu.edu/Groups/AI/html/cltl/cltl2.html.
- **ANSI X3.226-1994.** American National Standard for Information Systems — Programming Language — Common Lisp. 1994. The definitive specification.
- **Kelsey, Richard, William Clinger, and Jonathan Rees (eds.).** "Revised^5 Report on the Algorithmic Language Scheme." *Higher-Order and Symbolic Computation*, 11(1):7-105, 1998. R5RS.
- **Sperber, Michael, et al.** "Revised^6 Report on the Algorithmic Language Scheme." 2007. R6RS.
- **Shinn, Alex, John Cowan, and Arthur A. Gleckler (eds.).** "Revised^7 Report on the Algorithmic Language Scheme." 2013. R7RS.
- **Abelson, Harold, and Gerald Jay Sussman, with Julie Sussman.** *Structure and Interpretation of Computer Programs*. MIT Press, 1984; second edition 1996. The most influential computer science textbook of the twentieth century. Full text freely available at mitpress.mit.edu.
- **Norvig, Peter.** *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp*. Morgan Kaufmann, 1992. Known universally as PAIP. Still the best book on how to actually write Common Lisp.
- **Graham, Paul.** *On Lisp: Advanced Techniques for Common Lisp*. Prentice Hall, 1993. Free PDF at paulgraham.com/onlisp.html.
- **Graham, Paul.** *ANSI Common Lisp*. Prentice Hall, 1995.
- **Graham, Paul.** *Hackers & Painters: Big Ideas from the Computer Age*. O'Reilly, 2004.
- **Keene, Sonya E.** *Object-Oriented Programming in Common Lisp: A Programmer's Guide to CLOS*. Addison-Wesley, 1988. The definitive introduction to CLOS.
- **Kiczales, Gregor, Jim des Rivières, and Daniel G. Bobrow.** *The Art of the Metaobject Protocol*. MIT Press, 1991.
- **Seibel, Peter.** *Practical Common Lisp*. Apress, 2005. A modern introduction. Free online at gigamonkeys.com/book/.
- **Barski, Conrad.** *Land of Lisp: Learn to Program in Lisp, One Game at a Time!* No Starch Press, 2010.
- **Winston, Patrick Henry, and Berthold Klaus Paul Horn.** *Lisp*, third edition. Addison-Wesley, 1989. The classic MIT AI Lab textbook.
- **Touretzky, David S.** *Common Lisp: A Gentle Introduction to Symbolic Computation*. Benjamin/Cummings, 1990. Free PDF at cs.cmu.edu/~dst/LispBook/.
- **Felleisen, Matthias, Robert Bruce Findler, Matthew Flatt, and Shriram Krishnamurthi.** *How to Design Programs*. MIT Press, 2001; second edition 2018. Free online at htdp.org. The spiritual successor to SICP for the Racket era.

### Secondary sources (essays, talks, retrospectives)

- **Gabriel, Richard P.** "The Rise of 'Worse Is Better.'" Originally part of "LISP: Good News, Bad News, How to Win Big," EuroPAL conference address, 1989; published in *AI Expert*, June 1991. Available at dreamsongs.com/RiseOfWorseIsBetter.html.
- **Gabriel, Richard P.** *Patterns of Software: Tales from the Software Community*. Oxford University Press, 1996. Contains extended meditations on Lisp, "worse is better," and the nature of software as a discipline.
- **Graham, Paul.** "Beating the Averages." 2001. paulgraham.com/avg.html.
- **Graham, Paul.** "Revenge of the Nerds." 2002. paulgraham.com/icad.html.
- **Graham, Paul.** "The Hundred-Year Language." 2003. paulgraham.com/hundred.html.
- **Graham, Paul.** "The Roots of Lisp." 2002. paulgraham.com/rootsoflisp.html. A modern reconstruction of McCarthy's 1960 paper in running Common Lisp code.
- **Steele, Guy L., and Richard P. Gabriel.** "The Evolution of Lisp." *ACM SIGPLAN History of Programming Languages Conference (HOPL II)*, 1993. Reprinted in *History of Programming Languages — II*, ACM Press, 1996. The definitive academic history of Lisp through the early 1990s, written by two of its principal architects.
- **McCarthy, John.** "LISP — Notes on Its Past and Future." Remarks at the 1980 LISP Conference. Reprinted in various collections. A short reflection on what Lisp had become twenty years after it started.
- **Stallman, Richard M.** *Free as in Freedom: Richard Stallman's Crusade for Free Software*, by Sam Williams, O'Reilly, 2002 (second edition 2010 with commentary by Stallman). Contains the story of the MIT AI Lab collapse from Stallman's point of view.
- **Hickey, Rich.** "Simple Made Easy." Strange Loop 2011. infoq.com/presentations/Simple-Made-Easy/.
- **Hickey, Rich.** "Hammock Driven Development." 2010. infoq.com/presentations/Hammock-Driven-Development/.
- **Hickey, Rich.** "The Value of Values." Goto Conference 2012. infoq.com/presentations/Value-Values/.
- **Hickey, Rich.** "Effective Programs — 10 Years of Clojure." Clojure/conj 2017.
- **Hickey, Rich.** "Maybe Not." Clojure/conj 2018.
- **Hickey, Rich.** "Spec-ulation." Clojure/conj 2016.
- **Norvig, Peter.** "Teach Yourself Programming in Ten Years." 2001. norvig.com/21-days.html. Not directly about Lisp, but written by one of its major teachers.

### Historical sources (books on the era and culture)

- **Levy, Steven.** *Hackers: Heroes of the Computer Revolution*. Doubleday, 1984; 25th anniversary edition O'Reilly, 2010. The canonical popular history of the MIT AI Lab and its culture. Levy's interviews with Greenblatt, Gosper, Sussman, Stallman, and others are the main primary-source record of what the ninth floor of Tech Square was actually like.
- **Waldrop, M. Mitchell.** *The Dream Machine: J.C.R. Licklider and the Revolution That Made Computing Personal*. Viking, 2001. A history of the broader ARPA-funded computing research tradition, with extensive material on the MIT AI Lab and its Lisp culture.
- **Roszak, Theodore.** *The Cult of Information*. Pantheon, 1986. A skeptical take on the 1980s AI boom that includes thoughtful material on Lisp and the expert system industry.
- **Crevier, Daniel.** *AI: The Tumultuous History of the Search for Artificial Intelligence*. Basic Books, 1993. A history of AI research that covers the Lisp era in detail.
- **McCorduck, Pamela.** *Machines Who Think*. W. H. Freeman, 1979; second edition A K Peters, 2004. The earliest popular history of AI research, written during the golden era. Contains firsthand interviews with McCarthy, Minsky, and other Lisp pioneers.
- **Nilsson, Nils J.** *The Quest for Artificial Intelligence: A History of Ideas and Achievements*. Cambridge University Press, 2010. A comprehensive academic history of AI that covers Lisp's role throughout.
- **Copeland, B. Jack.** *The Essential Turing: Seminal Writings in Computing, Logic, Philosophy, Artificial Intelligence, and Artificial Life plus the Secrets of Enigma*. Oxford University Press, 2004. The definitive collection of Turing's work, useful for understanding the pre-Lisp foundations.
- **Davis, Martin.** *The Universal Computer: The Road from Leibniz to Turing*. W. W. Norton, 2000. A history of the ideas that led to computability theory and, indirectly, to Lisp.
- **Abelson, Harold, et al.** *The Structure and Interpretation of Computer Programs Video Lectures*. 1986. Recordings of the MIT 6.001 course taught by Abelson and Sussman. Freely available at ocw.mit.edu. One of the most influential sets of lectures in computer science education.

### Communities and living documentation

- **Lambda the Ultimate.** lambda-the-ultimate.org. A blog and discussion forum for programming language research, named after the Lambda Papers, active since 2001.
- **Planet Lisp.** planet.lisp.org. An aggregator of Lisp-related blog posts.
- **The Clojurians Slack.** clojurians.slack.com. The main discussion forum for the Clojure community.
- **Common Lisp HyperSpec.** lispworks.com/documentation/HyperSpec/Front/. The online version of the ANSI Common Lisp specification. The canonical reference.
- **#lisp and #clojure IRC channels on Libera.Chat.** The old-school venues for Lisp discussion, still active.

### Implementations (as of 2026)

**Common Lisp:** SBCL (the dominant open-source implementation, forked from CMU CL in 2000), Clozure CL (CCL), ECL (Embeddable Common Lisp), GNU CLISP, ABCL (Armed Bear Common Lisp, on the JVM), LispWorks (commercial), Allegro CL (commercial, Franz Inc.). SBCL is the default choice for new projects.

**Scheme:** Racket (the most feature-rich and actively developed), Chicken (compiles to C), Chez Scheme (Cisco's production Scheme, now open source), Gambit, Bigloo, Guile (the GNU extension language, used by GNU Guix), MIT/GNU Scheme, Chibi.

**Clojure:** Clojure (on the JVM, the reference implementation), ClojureScript (on JavaScript), ClojureCLR (on .NET, less actively developed), Babashka (fast-starting scripting Clojure).

**Emacs Lisp:** Part of GNU Emacs. The most widely-deployed Lisp in the world by user count, though most users do not think of themselves as Lisp programmers.

**Other significant Lisps:** Fennel (a Lisp that compiles to Lua), Janet (a small embedded Lisp in C), Hy (a Lisp that compiles to Python bytecode), Carp (a statically-typed Lisp for systems programming), LFE (Lisp Flavored Erlang).

---

## Afterword

Lisp is the language you learn when you want to understand what programming languages are. It is not necessarily the language you use every day, though some people do and they are not wrong. It is the language that sits at the intellectual foundation of the field, the reference point against which every other language is, implicitly or explicitly, measured. Every programming language textbook that is serious about its subject eventually gets around to explaining how Lisp works, because without Lisp you cannot explain what a closure is, or what a macro is, or what homoiconicity is, or why the lambda calculus matters, or how to write an interpreter, or why the Church-Turing thesis has teeth. You can learn those things without learning Lisp — people do, every year — but you learn them slower and more painfully, because you are learning them in a language that was designed to hide them from you, and Lisp is the language that was designed to show them to you.

The argument of this document, in one sentence, is that Lisp is the most important programming language in the history of computing because it is the only one that started from mathematical foundations and followed those foundations wherever they led, without compromising for hardware or committees or corporate roadmaps. Every other language is an engineering artifact, designed for some combination of execution speed, ease of learning, hardware compatibility, market adoption, and employer demand. Lisp is those things too, sometimes, but Lisp is, first and foundationally, a mathematical idea that happens to run. That is what Alan Kay meant by "the greatest single programming language ever designed." Kay was not saying Lisp was the most practical or the most popular or the easiest to hire for. He was saying that Lisp was the one language that took the underlying mathematics seriously and let the mathematics drive the design. Every other language is a translation of that mathematics into something more convenient. Lisp is the mathematics.

This is why Lisp keeps getting rediscovered. Every time programmers get lost in the accidental complexity of whatever language they are currently using, someone points back at Lisp and says: look, it does not have to be this way, you can strip out the accidental stuff and leave only the essential, and the essential fits on a page. That demonstration never stops being useful, because programmers keep adding accidental complexity, and someone keeps needing to point back. Lisp is the baseline. It is the null hypothesis. It is the version of programming that would still exist if every commercial language vanished overnight and we had to start over from the mathematical foundations. If you want to know what programming is — not what it has become, not what the market wants, not what your employer pays you to do, but what it *is* in its purest form — read the 1960 McCarthy paper. Read SICP. Write a meta-circular evaluator. You will come out changed. You will come out understanding something about computation that you did not understand before, and that almost nobody in the industry understands, and that will nonetheless be true whether or not the industry understands it.

The parentheses are fine. You will get used to them in a week. The ideas will take longer, and they will be worth it.

---

*End of document. Written for the PNW Research Series LSP project, 2026. Companion to PCH, PRL, RXX, FOR, CEE.*
