# BNF, Context-Free Grammars, and the Chomsky Hierarchy

*ALG (ALGOL) Research Track — Central Document*
*PNW Research Series*

---

## Preface

This document traces the single most consequential notational invention in the history of practical computing: Backus-Naur Form. It is the central track of the ALG project because the ALGOL 60 Report is where a major programming language was, for the first time, defined by a formal grammar rather than by English prose, tables, and hopeful examples. Before the Report, compiler writers read a language manual and guessed. After the Report, they read a grammar and mechanized. The line between those two worlds runs directly through a handful of pages of a UNESCO conference proceedings in Paris in June 1959.

The story is not a neat one. Backus introduced the notation; Naur cleaned it up and used it wall-to-wall in the Report; Knuth named it (twice — first as a correction, then as a renaming). The theoretical backdrop — Post production systems (1943), Chomsky's hierarchy (1956/1959), LR parsing (1965), LALR (1969) — ran on a separate track and only merged with the practical track when Yacc shipped with Unix in 1975. This document covers both tracks and the junctions where they crossed.

---

## 1. Before BNF: How Languages Were Specified

### 1.1 The FORTRAN 0 manual

FORTRAN was designed at IBM by John Backus and his team between 1954 and 1957. The first language definition was the *Programmer's Reference Manual: The FORTRAN Automatic Coding System for the IBM 704 EDPM*, dated October 15, 1956. The manual is ninety-odd pages of prose, examples, and tables. There is no grammar. There is no formal syntax. There are descriptions of statement forms — "A DO statement has the form `DO n i = m1, m2, m3`" — followed by English paragraphs explaining what each piece means and a few worked examples.

The manual is remarkable in what it does not attempt. It does not define "expression" recursively. It does not give productions. It does not state the class of strings that are syntactically legal FORTRAN. The closest it gets to a grammar is a table of statement types and, for each, a syntactic pattern written in a kind of ad hoc mixed notation: uppercase letters stand for themselves, lowercase italicized letters stand for "some value of the named category" (e.g., `n` is a statement number, `i` is a variable name). This notation is not formalized anywhere. The reader is expected to infer what counts as a legal expression by reading examples and mentally generalizing.

The consequence was predictable. Different implementations of FORTRAN, even on different IBM machines, disagreed on edge cases. The question "is `A(I+J*K)` a legal subscript?" could have different answers in different compilers, and there was no document you could point to that would settle the question. A formal definition would have required something that did not yet exist as a widespread tool: a grammar notation.

### 1.2 COBOL and its CAPS/lowercase metalanguage

COBOL, whose specification effort overlapped ALGOL 58's (late 1959 for the initial COBOL spec), took a partial step toward formality. The COBOL specification used what came to be called a metalanguage of conventions: uppercase words were reserved keywords that had to appear literally; lowercase words stood for names the programmer supplied; square brackets denoted optional elements; braces denoted required choices; ellipses denoted repetition. A COBOL statement description might look like:

```
MOVE {identifier-1, literal-1} TO identifier-2 [, identifier-3] ...
```

This is recognizably a grammar fragment. It distinguishes terminals (`MOVE`, `TO`) from non-terminals (`identifier-1`, `literal-1`), it marks optionality and repetition, and it handles alternation via braces. What it does not do is give those non-terminals definitions. `identifier-1` is defined elsewhere by prose. There is no recursive structure — every rule describes a single statement, and expressions are described in separate prose sections. The metalanguage was a notation for single productions, not a grammar. It was enough to make COBOL manuals more regular than FORTRAN manuals, not enough to mechanize.

### 1.3 Flowcharts as universal notation

Through the 1950s, flowcharts served as the closest thing to a universal programming notation. Herman Goldstine and John von Neumann had used them in their 1947 series *Planning and Coding of Problems for an Electronic Computing Instrument*, and the flowchart became the default medium for expressing algorithms in early textbooks. A flowchart could cross language boundaries — you could draw a flowchart for a procedure and have readers implement it in FORTRAN, Autocode, or assembly. What a flowchart could not do was describe a *language*. Flowcharts describe computations, not grammars. There was never a serious attempt to use flowcharts as the specification medium for a programming language's syntax, because the shapes mean nothing about strings.

### 1.4 Iverson's notation (later APL)

Kenneth Iverson's *A Programming Language* (1962) was published three years after Backus's ICIP Paris paper, but Iverson had been developing his notation at Harvard and then IBM since 1957. Iverson's notation was executable mathematics — it was simultaneously a specification language and, eventually, an implementation language (APL shipped in 1966). Iverson used his notation to specify parts of IBM System/360's architecture in the 1962 Blaauw/Brooks/Iverson paper, and IBM briefly standardized on it for architectural documentation. Iverson notation solved a different problem than BNF: it gave you compact functional descriptions of operations, not grammars for strings. The two lines of work never really met.

### 1.5 The pre-BNF world

The pre-BNF world was one where the phrase "the language" was ambiguous. You could mean the intent — what the language designers had in mind. You could mean the manual — what was written down. You could mean the implementation — what the compiler accepted. These three referents routinely disagreed, and there was no way to make them agree, because the only shared medium was English prose, and English prose is too loose to pin down a mechanized artifact.

Compilers of the era handled this by accepting whatever their ad-hoc parsers happened to recognize and rejecting whatever caused the parser to crash. Hand-written recursive descent was the norm. Operator precedence parsing for expressions — Bauer and Samelson's work at Munich in the late 1950s — was the closest thing to a principled technique, and it was used by the first ALGOL 58 compilers. For control structures, the parser was whatever the compiler writer thought of when they sat down with a stack of cards and a pencil.

Against this backdrop, the idea that you could write down a complete, unambiguous, machine-readable specification of a programming language's syntax was not just new. It was a category shift.

---

## 2. Backus's Breakthrough

### 2.1 The man and his moment

John Warner Backus (1924–2007) came out of the IBM Pure Science department, led the FORTRAN development team from 1954, and by 1957 had shipped the first FORTRAN compiler on the IBM 704. FORTRAN succeeded beyond anyone's expectations. It cut programming time for scientific computation by an order of magnitude and it made IBM the dominant force in scientific programming. Backus, by 1958, had standing — the kind of standing that let him speak to international committees about what should come next.

The international committee in question was GAMM (the German Gesellschaft für Angewandte Mathematik und Mechanik) in concert with ACM. In 1958 they produced the preliminary ALGOL 58 report — sometimes called IAL, the International Algebraic Language — at a meeting in Zurich. ALGOL 58 was specified in a mix of English and ad hoc conventions, much like COBOL. Backus attended the Zurich meeting as part of the ACM delegation.

### 2.2 The 1959 ICIP Paris paper

In June 1959, UNESCO convened the International Conference on Information Processing (ICIP) in Paris. Backus presented a paper titled *The Syntax and Semantics of the Proposed International Algebraic Language of the Zurich ACM-GAMM Conference*. The paper appears in the conference proceedings (UNESCO, 1960) and it is the place where BNF first appears in print.

Backus's motivation was concrete. The Zurich report for ALGOL 58 was ambiguous in places. Backus wanted a notation that could describe the syntactic structures of the language precisely enough that two independent readers — or a human and a machine — would agree on what strings were legal. He also wanted a notation in which the semantics could be hung off the syntax, so that a statement's meaning was a function of its parse.

The syntactic notation in the paper has these ingredients:

- **Metavariables** enclosed in angle brackets. A metavariable like `⟨integer⟩` names a class of strings. Today we call these non-terminals.
- **Literal symbols** written as themselves, standing for the characters that appear in the actual language. Today we call these terminals.
- **The metasymbol `:≡`** (in Backus's paper, written as a colon-equivalence; Naur changed it to `::=` in the ALGOL 60 Report). This separates a metavariable from its definition.
- **The metasymbol `or`** between alternatives. Naur replaced this with the vertical bar `|`.
- **Concatenation** by juxtaposition. Writing `⟨a⟩⟨b⟩` means "a string in the class `⟨a⟩` followed by a string in the class `⟨b⟩`."

The paper gives examples like (modernizing Backus's typography to Naur's):

```
⟨digit⟩ ::= 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
⟨integer⟩ ::= ⟨digit⟩ | ⟨integer⟩ ⟨digit⟩
```

The second rule is the critical one. It is recursive: `⟨integer⟩` is defined in terms of itself. Finitely many rules describe infinitely many strings. This was the thing that did not exist in COBOL's metalanguage, and its absence was the reason COBOL's metalanguage could not describe expressions.

Backus also gave the rules for identifiers, for signed and unsigned numbers, for arithmetic expressions with precedence baked into the grammar via layered non-terminals (`⟨primary⟩`, `⟨factor⟩`, `⟨term⟩`, `⟨arithmetic expression⟩`), and for conditional expressions. The whole apparatus fits in about a dozen pages of the proceedings.

### 2.3 Emil Post as the acknowledged precursor

Backus was careful to cite his source. In a footnote in the 1959 paper, Backus credits Emil Post's *Formal Reductions of the General Combinatorial Decision Problem* (American Journal of Mathematics, 1943) for the idea of production systems — rules of the form "if you see this pattern, you can rewrite it as that pattern" — as the formal substrate he was building on. Post had used productions as a tool for undecidability proofs, showing that the word problem for a Post canonical system is in general undecidable. Post's productions were far more general than Backus's: they allowed context on both sides of the rewrite rule and could express any recursively enumerable set. Backus restricted Post's system to a particular shape — rules where the left-hand side is a single non-terminal — and got exactly the class of grammars that Chomsky, three years earlier, had called context-free.

The footnote is a historical hinge. It is the rare case where the practical notation cites the theoretical ancestor, sixteen years back, explicitly. Most programmers who used BNF over the next six decades never read Post's 1943 paper. But Backus had, and he said so.

### 2.4 From Backus to Naur

Peter Naur, a Danish astronomer turned computer scientist, had been involved in the ALGOL 58 effort and was the editor of the committee that produced the ALGOL 60 Report. Naur read Backus's 1959 paper, saw that the notation was exactly what the Report needed, and — crucially — decided to use it throughout. The committee met in Paris in January 1960, and the *Report on the Algorithmic Language ALGOL 60*, edited by Naur with thirteen co-authors, was published later that year in CACM (May 1960) and in Numerische Mathematik.

Naur made several small but consequential cleanups:

- He replaced Backus's `:≡` with `::=`. This is the form that became canonical.
- He replaced Backus's `or` with the vertical bar `|`.
- He standardized the typography — italic angle-bracketed identifiers for non-terminals, Roman typeface for terminals.
- He used the notation *consistently*, for every syntactic class in the language. The Report is the first document where a complete major programming language is given a complete formal grammar.

The ALGOL 60 Report's grammar fits in the middle portion of a roughly 40-page document. Read today, it is startlingly modern. The conditional statement:

```
⟨if statement⟩ ::= ⟨if clause⟩ ⟨unconditional statement⟩
⟨if clause⟩ ::= if ⟨Boolean expression⟩ then
⟨conditional statement⟩ ::= ⟨if statement⟩
                          | ⟨if statement⟩ else ⟨statement⟩
                          | ⟨if clause⟩ ⟨for statement⟩
                          | ⟨label⟩ : ⟨conditional statement⟩
```

These are exactly the rules a modern compiler textbook would write. Notice the dangling-else problem right there in the grammar: the first alternative of `⟨conditional statement⟩` ends with an `⟨if statement⟩`, the second adds an `else`. The grammar is ambiguous and the Report handles the ambiguity by disambiguation commentary in the prose. Ambiguity in the grammar was known and accepted at the time; the engineering reflex to eliminate it came later.

### 2.5 Knuth renames it

The notation in the Report was called "Backus Normal Form" in the first wave of papers that cited the Report — Backus was the originator, and "normal form" was a respectful gesture toward formal language theory. Donald Knuth, then a graduate student at Caltech and already deep in compiler work, wrote a letter to the editor of CACM in December 1964 pointing out that the notation was not a "normal form" in the technical sense (a normal form is a canonical representative of an equivalence class of objects; BNF is not that). Knuth proposed renaming it "Backus Naur Form" to credit Naur's contribution and to drop the inaccurate "normal." The letter was short, two paragraphs, and decisive. By the late 1960s "Backus-Naur Form" was the standard name. Knuth's letter is one of the most-cited two-paragraph communications in the history of computer science.

### 2.6 Why it mattered

Before BNF, writing a compiler for a language meant negotiating with the language's manual. After BNF, for ALGOL 60 and every language defined in the same style afterward, writing a compiler meant mechanically following a grammar. The parser was a direct encoding of the grammar. The question "is this string legal" had a single, precise answer, computable by a machine. Independent implementers could agree. Portability of programs became, for the first time, a property of the language and not just of the programmer's skill.

BNF also enabled something subtler: a way of thinking about languages as mathematical objects. Once a language is a set of strings generated by a grammar, you can prove things about it. You can ask whether two grammars define the same language. You can ask whether a grammar is ambiguous, whether it is LL(1), whether it is LR(k). The theory of parsing became possible because the input to the theory — the grammar — now had a precise form. Chomsky had given that form the theoretical underpinning in 1956; Backus and Naur, independently and practically, had made it the working medium of programming language design.

### 2.7 What the ALGOL 60 Report actually did

A close reading of the Report reveals how thoroughly Naur committed to the grammar as the primary specification medium. Section 1 is introductory; section 2 defines the basic symbols; sections 3 and 4 are the core, and they are structured as: BNF production, then a few sentences of prose semantics, then the next production. The prose does not duplicate the grammar; it explains the meaning of a structure the grammar has already defined. This is an inversion of what every previous language manual had done. In the FORTRAN manual the English came first and examples illustrated the English; in the ALGOL 60 Report the grammar comes first and the English explains what the grammar-defined structures compute.

The Report has 17 pages of BNF in the final CACM version. For comparison, the Java Language Specification (eighth edition, 2015) has approximately 170 pages that contain grammar, about ten times larger — and Java is a much larger language than ALGOL 60. The ratio of grammar to prose in the Report is higher than in almost any modern language specification. The document is almost brutalist in its commitment to the formal description.

The Report also famously pioneered the distinction between the *reference language* (the abstract syntax, the grammar), the *publication language* (what you write in papers, with subscripts and italics and the proper mathematical symbols), and the *hardware representation* (what you type into a specific machine, where `≤` becomes `<=` or `LEQ`). This three-level architecture — the language is abstract, the printed form is one rendering, the machine input is another — has been refined but not fundamentally improved on. Unicode identifiers in modern languages are, essentially, a move toward merging the publication and hardware representations.

### 2.8 Who actually wrote what

The Report has thirteen authors listed on the title page: Backus, Bauer, Green, Katz, McCarthy, Naur, Perlis, Rutishauser, Samelson, Vauquois, Wegstein, van Wijngaarden, and Woodger. Naur is listed as editor. The authors came from Europe and the United States, and the committee meetings in Zurich (1958) and Paris (1960) were multilingual, contentious, and exhaustive. Within this committee, the grammar-first approach was Backus's contribution in method and Naur's in execution. McCarthy contributed to the semantics and would later go on to specify Lisp; Perlis would become the first Turing Award winner; Rutishauser and Samelson had done crucial work on operator precedence at Munich; van Wijngaarden would later invent a far more elaborate two-level grammar system for ALGOL 68 (van Wijngaarden grammars, a cautionary tale in the history of over-engineered specifications). The Report was a collaborative document but the BNF notation, specifically, traces to Backus via Naur.

### 2.9 Van Wijngaarden grammars: the road not taken

A brief aside that belongs in any honest BNF history. The ALGOL 68 committee, several of whose members had been on the ALGOL 60 committee, looked at the Report and decided BNF was not expressive enough. ALGOL 68 needed to describe context-sensitive constraints — most notably, type rules and scope rules — as part of the formal language definition, not as commentary. Aad van Wijngaarden designed a two-level grammar scheme in which a metagrammar (the first level) generated the productions of the object grammar (the second level), allowing context-sensitive constraints to be expressed by parameterizing productions over syntactic categories. Van Wijngaarden grammars (also called W-grammars or two-level grammars) are Turing-complete in their generative power.

The ALGOL 68 Report (1968, revised 1975) is specified entirely in van Wijngaarden grammars. The result was a document widely regarded as unreadable. Many implementers could not parse the specification, let alone a program. ALGOL 68 had some elegant ideas and shipped a few respected compilers, but it never reached the influence of ALGOL 60, and the van Wijngaarden grammar is usually cited as a major reason why. The lesson is historically important: more expressive power in a specification notation is not automatically better. BNF's restricted power — context-free, decidable, mechanizable — is precisely why it has lasted. The ALGOL 68 Report is a monument to the opposite choice, and it stands mostly unread in the library while the ALGOL 60 Report is still being quoted sixty-five years later.

### 2.7 What the ALGOL 60 Report actually did

A close reading of the Report reveals how thoroughly Naur committed to the grammar as the primary specification medium. Section 1 is introductory; section 2 defines the basic symbols; sections 3 and 4 are the core, and they are structured as: BNF production, then a few sentences of prose semantics, then the next production. The prose does not duplicate the grammar; it explains the meaning of a structure the grammar has already defined. This is an inversion of what every previous language manual had done. In the FORTRAN manual the English came first and examples illustrated the English; in the ALGOL 60 Report the grammar comes first and the English explains what the grammar-defined structures compute.

The Report has 17 pages of BNF in the final CACM version. For comparison, the Java Language Specification (eighth edition, 2015) has approximately 170 pages that contain grammar, about ten times larger — and Java is a much larger language than ALGOL 60. The ratio of grammar to prose in the Report is higher than in almost any modern language specification. The document is almost brutalist in its commitment to the formal description.

The Report also famously pioneered the distinction between the *reference language* (the abstract syntax, the grammar), the *publication language* (what you write in papers, with subscripts and italics and the proper mathematical symbols), and the *hardware representation* (what you type into a specific machine, where `≤` becomes `<=` or `LEQ`). This three-level architecture — the language is abstract, the printed form is one rendering, the machine input is another — has been refined but not fundamentally improved on. Unicode identifiers in modern languages are, essentially, a move toward merging the publication and hardware representations.

### 2.8 Who actually wrote what

The Report has thirteen authors listed on the title page: Backus, Bauer, Green, Katz, McCarthy, Naur, Perlis, Rutishauser, Samelson, Vauquois, Wegstein, van Wijngaarden, and Woodger. Naur is listed as editor. The authors came from Europe and the United States, and the committee meetings in Zurich (1958) and Paris (1960) were multilingual, contentious, and exhaustive. Within this committee, the grammar-first approach was Backus's contribution in method and Naur's in execution. McCarthy contributed to the semantics and would later go on to specify Lisp; Perlis would become the first Turing Award winner; Rutishauser and Samelson had done crucial work on operator precedence at Munich; van Wijngaarden would later invent a far more elaborate two-level grammar system for ALGOL 68 (van Wijngaarden grammars, a cautionary tale in the history of over-engineered specifications). The Report was a collaborative document but the BNF notation, specifically, traces to Backus via Naur.

### 2.9 Van Wijngaarden grammars: the road not taken

A brief aside that belongs in any honest BNF history. The ALGOL 68 committee, several of whose members had been on the ALGOL 60 committee, looked at the Report and decided BNF was not expressive enough. ALGOL 68 needed to describe context-sensitive constraints — most notably, type rules and scope rules — as part of the formal language definition, not as commentary. Aad van Wijngaarden designed a two-level grammar scheme in which a metagrammar (the first level) generated the productions of the object grammar (the second level), allowing context-sensitive constraints to be expressed by parameterizing productions over syntactic categories. Van Wijngaarden grammars (also called W-grammars or two-level grammars) are Turing-complete in their generative power.

The ALGOL 68 Report (1968, revised 1975) is specified entirely in van Wijngaarden grammars. The result was a document widely regarded as unreadable. Many implementers could not parse the specification, let alone a program. ALGOL 68 had some elegant ideas and shipped a few respected compilers, but it never reached the influence of ALGOL 60, and the van Wijngaarden grammar is usually cited as a major reason why. The lesson is historically important: more expressive power in a specification notation is not automatically better. BNF's restricted power — context-free, decidable, mechanizable — is precisely why it has lasted. The ALGOL 68 Report is a monument to the opposite choice, and it stands mostly unread in the library while the ALGOL 60 Report is still being quoted sixty-five years later.

### 2.7 What the ALGOL 60 Report actually did

A close reading of the Report reveals how thoroughly Naur committed to the grammar as the primary specification medium. Section 1 is introductory; section 2 defines the basic symbols; sections 3 and 4 are the core, and they are structured as: BNF production, then a few sentences of prose semantics, then the next production. The prose does not duplicate the grammar; it explains the meaning of a structure the grammar has already defined. This is an inversion of what every previous language manual had done. In the FORTRAN manual the English came first and examples illustrated the English; in the ALGOL 60 Report the grammar comes first and the English explains what the grammar-defined structures compute.

The Report has 17 pages of BNF in the final CACM version. For comparison, the Java Language Specification (eighth edition, 2015) has approximately 170 pages that contain grammar, about ten times larger — and Java is a much larger language than ALGOL 60. The ratio of grammar to prose in the Report is higher than in almost any modern language specification. The document is almost brutalist in its commitment to the formal description.

The Report also famously pioneered the distinction between the *reference language* (the abstract syntax, the grammar), the *publication language* (what you write in papers, with subscripts and italics and the proper mathematical symbols), and the *hardware representation* (what you type into a specific machine, where `≤` becomes `<=` or `LEQ`). This three-level architecture — the language is abstract, the printed form is one rendering, the machine input is another — has been refined but not fundamentally improved on. Unicode identifiers in modern languages are, essentially, a move toward merging the publication and hardware representations.

### 2.8 Who actually wrote what

The Report has thirteen authors listed on the title page: Backus, Bauer, Green, Katz, McCarthy, Naur, Perlis, Rutishauser, Samelson, Vauquois, Wegstein, van Wijngaarden, and Woodger. Naur is listed as editor. The authors came from Europe and the United States, and the committee meetings in Zurich (1958) and Paris (1960) were multilingual, contentious, and exhaustive. Within this committee, the grammar-first approach was Backus's contribution in method and Naur's in execution. McCarthy contributed to the semantics and would later go on to specify Lisp; Perlis would become the first Turing Award winner; Rutishauser and Samelson had done crucial work on operator precedence at Munich; van Wijngaarden would later invent a far more elaborate two-level grammar system for ALGOL 68 (van Wijngaarden grammars, discussed in the next subsection). The Report was a collaborative document but the BNF notation, specifically, traces to Backus via Naur.

---

## 3. BNF Formally

### 3.1 Definition of a BNF grammar

A BNF grammar is a 4-tuple G = (V, Σ, P, S) where:

- **V** is a finite set of non-terminal symbols (also called variables or syntactic categories). Conventionally written in angle brackets: `⟨expr⟩`, `⟨stmt⟩`.
- **Σ** is a finite set of terminal symbols (also called the alphabet). These are the characters or tokens that appear in actual strings of the language. V and Σ are disjoint.
- **P** is a finite set of production rules. Each rule has the form A ::= α, where A ∈ V is a single non-terminal and α is a string in (V ∪ Σ)*. In BNF, alternatives for the same A are collected with `|`: A ::= α₁ | α₂ | ... | αₙ.
- **S** ∈ V is the distinguished start symbol.

The language L(G) generated by G is the set of all strings in Σ* that can be derived from S by repeatedly applying productions.

### 3.2 Derivations

A derivation is a sequence of rewrite steps. Write α ⇒ β if β is obtained from α by replacing one occurrence of some non-terminal A in α with the right-hand side of a production A ::= γ. Write α ⇒* β for the reflexive-transitive closure: β is reachable from α by zero or more steps.

L(G) = { w ∈ Σ* | S ⇒* w }

A **leftmost derivation** always rewrites the leftmost non-terminal at each step. A **rightmost derivation** always rewrites the rightmost. Both produce the same set of terminal strings; they differ only in the order of steps.

### 3.3 Parse trees

A parse tree for a derivation is a tree where the root is labeled with S, interior nodes are labeled with non-terminals, leaves are labeled with terminals (or ε), and the children of a node labeled A are, in order, the symbols on the right-hand side of the production used to rewrite that A. The yield of a parse tree — the concatenation of its leaf labels, read left to right — is the derived string. Two different derivations (leftmost versus rightmost) of the same string may produce the same parse tree; the tree abstracts away the order of rewrite steps.

### 3.4 Example: arithmetic expressions

The classic BNF grammar for arithmetic expressions with precedence and left-associativity:

```bnf
⟨expr⟩   ::= ⟨term⟩
           | ⟨expr⟩ "+" ⟨term⟩
           | ⟨expr⟩ "-" ⟨term⟩

⟨term⟩   ::= ⟨factor⟩
           | ⟨term⟩ "*" ⟨factor⟩
           | ⟨term⟩ "/" ⟨factor⟩

⟨factor⟩ ::= ⟨number⟩
           | "(" ⟨expr⟩ ")"

⟨number⟩ ::= ⟨digit⟩ | ⟨number⟩ ⟨digit⟩
⟨digit⟩  ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
```

Three observations about this grammar:

1. **Precedence is stratified.** `⟨factor⟩` is tighter than `⟨term⟩` is tighter than `⟨expr⟩`. The way the grammar forces `*` and `/` to bind tighter than `+` and `-` is that the multiplicative operators live at a deeper non-terminal. A multiplication is inside a term is inside an expression; an addition is not inside a term. When you parse `1 + 2 * 3`, the `*` must be grouped first because the grammar only admits `2 * 3` as a term, and the `+` combines two terms.

2. **Associativity is encoded by recursion direction.** `⟨expr⟩ ::= ⟨expr⟩ "+" ⟨term⟩` is left-recursive. Parsing `1 + 2 + 3` produces a tree where `(1 + 2)` is the left child and `3` is the right child — left-associative. Writing the rule as `⟨expr⟩ ::= ⟨term⟩ "+" ⟨expr⟩` (right-recursion) would make it right-associative.

3. **Left recursion is a problem for top-down parsers.** A recursive-descent parser calling `expr()` that calls `expr()` as its first action will loop forever. Left recursion has to be eliminated before top-down parsing can proceed. Bottom-up parsers (LR and its variants) handle left recursion naturally. This asymmetry is one of the practical dividing lines between parser families.

### 3.5 Recursion and infinity

The combination of finite rules and recursion is what makes BNF expressive. The grammar above has fewer than fifteen productions, but it describes an infinite language: every well-formed arithmetic expression of any length and nesting depth. The parse tree for a deeply nested expression can be arbitrarily tall; the grammar has to be traversed many times to derive it. This is the essential trick of context-free grammars and the reason pushdown automata (which have unbounded stacks) are needed to recognize them.

### 3.6 Ambiguity

A grammar is ambiguous if some string in its language has two distinct parse trees (equivalently, two distinct leftmost derivations). Ambiguity is a property of grammars, not of languages — a language is called "inherently ambiguous" if every grammar for it is ambiguous, which is a rare and subtle condition. Most programming language ambiguities are grammar artifacts and can be removed by rewriting the grammar.

A simple ambiguous grammar for arithmetic:

```bnf
⟨E⟩ ::= ⟨E⟩ "+" ⟨E⟩ | ⟨E⟩ "*" ⟨E⟩ | ⟨number⟩
```

The string `1 + 2 * 3` has two parse trees under this grammar. One groups as `(1 + 2) * 3`, the other as `1 + (2 * 3)`. Both are valid leftmost derivations. The stratified grammar above is a rewrite that eliminates this ambiguity by design.

### 3.7 The dangling else

The most famous ambiguity in programming language grammars is the dangling-else problem. Consider:

```bnf
⟨stmt⟩ ::= "if" ⟨expr⟩ "then" ⟨stmt⟩
         | "if" ⟨expr⟩ "then" ⟨stmt⟩ "else" ⟨stmt⟩
         | ⟨other-stmt⟩
```

The string `if E1 then if E2 then S1 else S2` has two parse trees. In one, the `else` binds to the outer `if` — producing `if E1 then (if E2 then S1) else S2`. In the other, the `else` binds to the inner `if` — producing `if E1 then (if E2 then S1 else S2)`. Both are legitimate parses of the grammar. Most languages resolve the ambiguity by convention ("match each else with the nearest unmatched if") stated in prose, not in the grammar. The ALGOL 60 Report itself had this ambiguity and disambiguated it by commentary. Pascal followed the same convention. Ada eliminated the ambiguity syntactically by requiring `end if` to terminate every `if` statement.

You can rewrite the grammar to eliminate the ambiguity by introducing two non-terminals, one for matched (balanced else) statements and one for unmatched:

```bnf
⟨stmt⟩         ::= ⟨matched⟩ | ⟨unmatched⟩
⟨matched⟩      ::= "if" ⟨expr⟩ "then" ⟨matched⟩ "else" ⟨matched⟩
                 | ⟨other-stmt⟩
⟨unmatched⟩    ::= "if" ⟨expr⟩ "then" ⟨stmt⟩
                 | "if" ⟨expr⟩ "then" ⟨matched⟩ "else" ⟨unmatched⟩
```

This grammar accepts exactly the same strings but unambiguously, with the "match to nearest" convention baked in.

### 3.8 ε (empty) productions

BNF allows productions whose right-hand side is the empty string, written ε:

```bnf
⟨opt-else⟩ ::= "else" ⟨stmt⟩ | ε
```

Empty productions are what let a grammar describe optional elements. They also interact nontrivially with parser-generation algorithms — FIRST and FOLLOW set computation, the handling of nullable non-terminals in LL(1) tables — and are a source of many parser-generator conflicts in practice.

---

## 4. EBNF and Its Variants

### 4.1 Wirth's Extended BNF

Niklaus Wirth, the designer of Pascal, Modula-2, Modula-3, and Oberon, was pragmatically frustrated with pure BNF. Many natural syntactic patterns — optional elements, lists, repetitions — had to be encoded by introducing auxiliary non-terminals, and the resulting grammars were longer than they needed to be and harder to read. Wirth proposed Extended BNF, first in the Pascal User Manual and Report (Jensen and Wirth, 1974) and then more formally in the short but widely-cited CACM paper *What Can We Do About the Unnecessary Diversity of Notation for Syntactic Definitions* (November 1977).

Wirth's additions:

- **`[...]`** — optional element. `[ "else" ⟨stmt⟩ ]` means zero or one occurrences.
- **`{...}`** — zero or more repetitions. `{ "," ⟨expr⟩ }` means a possibly-empty sequence of comma-expression pairs.
- **`(...)`** — grouping, for clarity or to apply `|`, `[ ]`, or `{ }` to a composite.
- **String literals in quotes** for terminals. This removes the need for typographic conventions to distinguish terminals from non-terminals.
- **`=`** instead of `::=` as the production symbol.
- **`.`** or `;` to terminate a production.

The arithmetic grammar in Wirth's EBNF becomes more compact:

```ebnf
expr   = term { ("+" | "-") term } .
term   = factor { ("*" | "/") factor } .
factor = number | "(" expr ")" .
number = digit { digit } .
digit  = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" .
```

Left-recursion has been replaced by iteration via the `{...}` construct. This is not just cosmetic: an EBNF grammar using `{...}` can be translated directly into a recursive-descent parser using a `while` loop, with no ambiguity about associativity (you read the operator and then decide how to fold). EBNF is in this sense more aligned with the way top-down parsers are written by hand.

Wirth's 1977 CACM paper is as much a complaint as a proposal. The first paragraph notes that programming language definitions used "an amazing variety of notations to describe syntax," with no two authors agreeing, and calls for convergence on a single notation. The paper was partly successful — many subsequent language references adopted something very like Wirth's EBNF — and partly not, because ISO later produced a more elaborate EBNF, W3C produced its own, IETF produced ABNF, and the diversity that Wirth had complained about continued.

### 4.2 ISO EBNF (ISO/IEC 14977:1996)

The International Organization for Standardization published ISO/IEC 14977:1996 as "Extended Backus–Naur Form," an attempt to standardize Wirth's idea with more precision and features. ISO EBNF adds:

- **`(*...*)`** for comments.
- **`?...?`** for special sequences (terminal classes defined outside the grammar).
- **`,`** between concatenated elements (explicit concatenation).
- **`;`** to terminate productions.
- **`-`** for exception (set difference): `letter - "Z"`.
- **Integer multipliers**: `3 * digit` means exactly three digits.

```iso-ebnf
expr = term, { ("+" | "-"), term } ;
term = factor, { ("*" | "/"), factor } ;
factor = number | "(", expr, ")" ;
number = digit, { digit } ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

ISO EBNF has been influential in standards documents (parts of the ECMAScript specification have used it) but has never displaced simpler notations for language reference manuals. Its explicit concatenation with commas is particularly divisive — many find it noisy compared to juxtaposition.

### 4.3 W3C EBNF

The W3C XML specification uses its own EBNF variant, defined in the XML spec itself. It is closer to Wirth than to ISO:

- **`::=`** for productions (a nod to BNF).
- **`|`** for alternation.
- **`?`** for optional (postfix).
- **`*`** for zero-or-more (postfix).
- **`+`** for one-or-more (postfix).
- **`(...)`** for grouping.
- **`[a-z]`** for character ranges.
- **`-`** for exclusion.

The XML 1.0 grammar for an element looks like:

```w3c-ebnf
element  ::= EmptyElemTag | STag content ETag
content  ::= CharData? ((element | Reference | CDSect | PI | Comment) CharData?)*
```

The postfix `?`, `*`, `+` come from regular expressions and are more concise than Wirth's braces. W3C EBNF is the variant most web programmers encounter, through XML, RDF, SPARQL, and XPath.

### 4.4 ABNF — RFC 5234

Augmented BNF (ABNF), standardized in RFC 5234 (Crocker and Overell, 2008; it supersedes RFC 2234), is the notation used in Internet protocol specifications. HTTP, SMTP, URIs, JSON, SIP, all specify their grammars in ABNF. ABNF has:

- **`=`** for definition, **`=/`** for extending a previously defined rule (adding alternatives).
- **`/`** for alternation.
- **`*Rule`** for repetition: `*rule` (zero or more), `1*rule` (one or more), `1*4rule` (one to four), `4rule` (exactly four).
- **`[rule]`** for optional.
- **`(...)`** for grouping.
- **`"literal"`** for case-insensitive terminals.
- **`%x41`** for hexadecimal character values, **`%d65`** for decimal.
- **`%x41-5A`** for character ranges.

The grammar for a URI in RFC 3986:

```abnf
URI         = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
hier-part   = "//" authority path-abempty
            / path-absolute
            / path-rootless
            / path-empty
scheme      = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
```

ABNF is the quiet workhorse of the Internet — most people have never written a rule in ABNF, but the protocols they use every minute of every day are defined in it. RFC 5234 itself is short (16 pages) and defines a small set of common rules (ALPHA, DIGIT, CRLF, etc.) as "core rules" that other specifications import.

### 4.5 Railroad diagrams

Wirth, along with Pascal documentation author Kathleen Jensen, popularized **railroad diagrams** (also called syntax diagrams) as a visual representation of EBNF. A railroad diagram is a directed graph in which you can trace valid strings by following tracks from left to right, passing through ovals (terminals) and rectangles (non-terminals). Every EBNF rule corresponds to a diagram, and complex rules get laid out like actual rail lines with branches and loops.

The Pascal User Manual and Report (Jensen and Wirth, 1974) popularized railroad diagrams for a general audience, and they have been reused in the JSON specification on json.org, in the SQLite documentation, and in many language reference manuals since. Their pedagogical value is high: a diagram is immediately comprehensible, and the "trace a path" mental model maps directly onto parsing. Railroad diagrams are not formal — they are a rendering of EBNF — but they are a rendering that has been learned by a very large number of people.

### 4.6 Parsing Expression Grammars (PEG)

Parsing Expression Grammars, introduced by Bryan Ford in *Parsing Expression Grammars: A Recognition-Based Syntactic Foundation* (POPL 2004), are a family of formal grammars that look like EBNF but have importantly different semantics. A PEG rule is a parsing procedure, not a description of a set of strings. The defining differences:

- **Ordered choice `/`** instead of unordered alternation `|`. `A / B` means "try A first; if it succeeds, use it; otherwise try B." This is not the same as `A | B` — ordered choice is deterministic and commits to the first successful alternative.
- **Greedy repetition** `*` and `+` consume as much as possible, with no backtracking into the repetition.
- **Syntactic predicates** `&e` (positive lookahead: matches if e would match, but consumes nothing) and `!e` (negative lookahead: matches if e would not match).

PEGs are unambiguous by construction. Every PEG parses every input in at most one way, because ordered choice removes the possibility of two successful parses. The tradeoff is that PEGs are not equivalent to CFGs — some CFLs are not expressible as PEGs, and some PEG languages are not context-free. PEGs also have a famous footgun: `A ::= A / "x"` in a CFG is `A ::= "x"` after eliminating left recursion, but in a PEG it is an infinite loop (the first alternative calls A, which calls the first alternative, which calls A). Left recursion has to be rewritten out of PEGs by hand.

The PEG formulation of the arithmetic grammar, using Ford's notation:

```peg
Expr   <- Term   (("+" / "-") Term)*
Term   <- Factor (("*" / "/") Factor)*
Factor <- Number / "(" Expr ")"
Number <- [0-9]+
```

PEGs have become popular as the basis for parser libraries — Janet, Lua's LPEG, Rust's `pest` — because they compose cleanly (a PEG rule is a function; parser rules are function compositions) and because the deterministic semantics mean you never need to reason about ambiguity.

---

## 5. The Chomsky Hierarchy

### 5.1 Chomsky's two foundational papers

Noam Chomsky, a linguist at MIT, published *Three Models for the Description of Language* in IRE Transactions on Information Theory in September 1956 and *On Certain Formal Properties of Grammars* in Information and Control in June 1959. These two papers, written for linguists interested in describing natural language, became instead the foundation of the theory of formal languages and of compilers. Chomsky was trying to characterize what kind of grammatical machinery was necessary to describe English syntax. He concluded that finite-state grammars (regular languages) were insufficient because English contained constructions with nested dependencies (center embedding) that a finite-state grammar could not handle. He also concluded that context-free grammars were insufficient because English contained constructions (certain cross-serial dependencies, and some reduplication phenomena in other languages) that could not be expressed context-freely. He proposed a hierarchy of four classes of grammars, increasing in expressive power.

The Chomsky hierarchy, as it came to be known, cuts grammars (and languages, and recognizing machines) into four levels.

### 5.2 Type 0: Recursively enumerable languages

Type 0 grammars place no restrictions on the form of productions. A production is α → β where α ∈ (V ∪ Σ)*V(V ∪ Σ)* (α must contain at least one non-terminal) and β ∈ (V ∪ Σ)*. Both sides can be arbitrary strings containing terminals and non-terminals, with the only constraint that the left-hand side is not empty and contains at least one non-terminal.

The languages generated by Type 0 grammars are exactly the recursively enumerable (RE) languages — the class of languages whose members can be listed by some Turing machine. Equivalently, a language is Type 0 iff there is a Turing machine that accepts it: on input w, the machine halts and accepts if w ∈ L; if w ∉ L, the machine may halt and reject, or it may loop forever.

RE languages include the halting problem's complement (non-RE, actually — RE languages include the halting problem itself, which is RE but not decidable). Any language you can describe by an algorithm that eventually accepts all members is RE. Type 0 grammars are equivalent in power to Turing machines and to Post production systems.

Practical use of Type 0 grammars is rare. They are too powerful — ambiguity, emptiness, equivalence, all are undecidable for Type 0 grammars. You cannot in general tell whether a Type 0 grammar generates any strings at all. They are a theoretical upper bound, useful for proving that certain problems cannot be solved.

### 5.3 Type 1: Context-sensitive languages

Type 1 grammars require that every production αAβ → αγβ satisfies |αAβ| ≤ |αγβ|. The non-terminal A is rewritten to γ, but only in the context of α on the left and β on the right. The length constraint means productions cannot shrink the string (other than a special exception for the start symbol producing ε). Context-sensitive languages are exactly the languages recognized by linear-bounded automata — Turing machines with a tape length bounded by a linear function of the input length.

An equivalent characterization: Type 1 = monotonic grammars = grammars where |LHS| ≤ |RHS| for every production. Kuroda normal form puts every CSG production into one of two shapes: A → BC, AB → CD, A → a, or A → ε (the last only for the start symbol).

Context-sensitivity shows up in programming languages in a small but important set of places. Type checking — "the variable x must have been declared in an enclosing scope before this use" — is a context-sensitive constraint, not a context-free one. No CFG can enforce "the set of declared variables at this point in the program includes x." The classic example in formal language theory is the language {aⁿbⁿcⁿ | n ≥ 0}, which is not context-free (it would require the pushdown automaton to count three things at once using a single stack) but is context-sensitive.

Parsing CSGs is exponential in the general case. Nobody uses pure CSGs for programming language implementation. The context-sensitive parts of real languages are handled in separate phases (semantic analysis, name resolution, type checking) that run after context-free parsing.

### 5.4 Type 2: Context-free languages

Type 2 grammars require that every production has the form A → γ, where A is a single non-terminal and γ is any string in (V ∪ Σ)*. No context on the left-hand side. This is exactly BNF. The class of languages generated by Type 2 grammars is the context-free languages, recognized by nondeterministic pushdown automata (and some CFLs, but not all, by deterministic PDAs — the deterministic CFLs are a proper subclass).

Context-free languages are the sweet spot for programming language syntax. They are expressive enough to handle nested structure (parentheses, block structure, recursive expression) and tractable enough that parsing is polynomial in the general case (O(n³) via the CYK or Earley algorithms) and linear for important subclasses (LL(k) and LR(k) parsers run in O(n)).

### 5.5 Type 3: Regular languages

Type 3 grammars restrict productions to one of two shapes: A → a (a terminal) or A → aB (a terminal followed by a single non-terminal). This is a right-linear grammar. An equivalent class of grammars uses left-linear productions A → Ba | a. Mixing left and right linearity on the same rule takes you out of regular and into context-free.

The languages generated by Type 3 grammars are exactly the regular languages, which are also the languages recognized by deterministic finite automata (DFAs) and nondeterministic finite automata (NFAs), and exactly the languages describable by regular expressions. The equivalence between regular grammars, finite automata, and regular expressions is a foundational theorem — Kleene's theorem, 1956.

Regular languages are used everywhere in programming: lexer tokens, identifier matching, URL patterns, email format checking, log file parsing. The `grep` family, `sed`, `awk`, Perl regexes (mostly — some regex engines add backreferences, which take you out of regular and into something stranger), Rust's `regex` crate, Python's `re` module — all are tools for working with regular languages.

### 5.6 Strict containment

The Chomsky hierarchy is strict: Type 3 ⊊ Type 2 ⊊ Type 1 ⊊ Type 0. Each containment is proper; there exist languages in each higher class that are not in the lower class.

- {aⁿbⁿ | n ≥ 0} is context-free (Type 2) but not regular (Type 3). A DFA cannot count arbitrarily high.
- {aⁿbⁿcⁿ | n ≥ 0} is context-sensitive (Type 1) but not context-free (Type 2). A PDA with one stack cannot track three concurrent counts.
- The halting problem's language (of halting Turing machines) is recursively enumerable (Type 0) but not context-sensitive (Type 1). It is not decidable, but it is RE.

The hierarchy also corresponds to automata:

| Type | Grammar              | Automaton                | Language Class        |
|------|----------------------|--------------------------|-----------------------|
| 0    | Unrestricted         | Turing machine           | Recursively enumerable|
| 1    | Context-sensitive    | Linear-bounded automaton | Context-sensitive     |
| 2    | Context-free         | Pushdown automaton       | Context-free          |
| 3    | Regular              | Finite automaton         | Regular               |

### 5.7 Where programming languages actually live

In theory: programming language syntax is context-free. In practice: mostly.

C has a famous wrinkle. In `A * B;`, is this a multiplication expression-statement (A times B, result discarded) or a declaration (pointer-to-A named B)? The answer depends on whether A is a type name. And whether A is a type name depends on whether there was a `typedef` earlier that defined A as a type. This is a context-sensitive constraint — the surrounding declarations change the meaning of the current phrase — and it cannot be handled by a pure CFG. C parsers handle it with the "lexer hack": the lexer asks the symbol table whether an identifier is a type, and returns different tokens (IDENTIFIER versus TYPE_NAME) based on the answer. The parser stays context-free, but the lexer has side-eye at the symbol table. The whole arrangement is ugly but it works, and it is why C parsers are harder to maintain than Pascal parsers.

Python has indentation-based block structure. Off-side rule languages cannot be described by a pure CFG, because a CFG has no notion of "same indentation as previous line." The usual solution is a preprocessor that inserts virtual INDENT and DEDENT tokens into the token stream. After this preprocessing, the language is context-free. Python's parser, for decades a LL(1) parser generator called pgen, ran on the tokenized-with-indent-markers stream. In 2020 Python switched to a PEG-based parser for reasons of expressiveness (see later section).

Haskell's layout rule (indentation-sensitive block structure) is similar and also handled by preprocessing.

Ruby has operator methods, heredocs, and regex literals that all make parsing context-sensitive in subtle ways. Most Ruby parsers are hand-written and carry extensive special-casing for these features.

The summary: CFGs are the sweet spot, but real languages push on the edges of the class, and real parsers accept small compromises (lexer hacks, preprocessing, hand-coded special cases) to stay inside the context-free box where the tools work.

### 5.8 Chomsky's unintended legacy

Chomsky was working on natural language. He believed that the real grammatical machinery for English was beyond Type 2 — he proposed transformational generative grammar, which is much more powerful, as the minimum for English. He regarded CFGs as a descriptive tool for local constituent structure, not as the final theory. What he could not have anticipated was that his hierarchy, published in two papers three years apart in journals read mostly by linguists and information theorists, would become the taxonomic backbone of compiler construction. Every parsing textbook since the early 1970s opens with the Chomsky hierarchy, and every compiler writer learns the CFG as their working tool without necessarily ever reading a paper of Chomsky's.

The hierarchy gave computer science a vocabulary: "regular" and "context-free" became words you could use without explaining, and problems could be classified by where they lived in the hierarchy. This vocabulary shaped how parser technology evolved over the next sixty years.

---

## 6. Context-Free Grammars in Depth

### 6.1 Formal definition, restated

G = (V, Σ, P, S). V is the non-terminal set, Σ the terminal set, P the finite set of productions A → α where A ∈ V and α ∈ (V ∪ Σ)*, and S ∈ V the start symbol. A string β derives γ in one step (β ⇒ γ) if γ is obtained by replacing one occurrence of a non-terminal A in β with the right-hand side of some production A → α. The relation ⇒* is the reflexive-transitive closure.

L(G) = { w ∈ Σ* | S ⇒* w }.

### 6.2 Leftmost and rightmost derivations

In a leftmost derivation every step rewrites the leftmost non-terminal in the current sentential form. In a rightmost derivation every step rewrites the rightmost. For unambiguous grammars, each string has exactly one leftmost derivation and exactly one rightmost derivation; they are in general different sequences of steps but they yield the same parse tree. Parsers use this: top-down (LL) parsers build leftmost derivations; bottom-up (LR) parsers build rightmost derivations in reverse.

### 6.3 Ambiguous grammars, disambiguation techniques

When a grammar is ambiguous, you have three tools to resolve it:

1. **Rewrite the grammar.** Replace the ambiguous grammar with an equivalent unambiguous one. The stratified arithmetic grammar is the textbook example. The matched/unmatched if-statement grammar is another.

2. **Precedence and associativity annotations.** Many parser generators accept a grammar with ambiguities and a separate block of precedence declarations (e.g., `%left '+' '-'`, `%left '*' '/'` in Yacc). The generator uses the annotations to resolve shift/reduce conflicts at table-construction time. The underlying grammar is ambiguous, but the generated parser is deterministic.

3. **Disambiguation by convention.** Pick one parse tree by convention and document the convention. The dangling else's "match to nearest if" is a convention. Compilers implement the convention, either by rewriting the grammar or by letting the parser generator pick the shift over the reduce.

### 6.4 Left recursion

A non-terminal A is directly left-recursive if there is a production A → Aα. A is indirectly left-recursive if A ⇒* Aβ for some non-empty derivation. Left recursion is fatal for naive top-down parsers: calling `A()` as the first action of `A()` is an unbounded recursion.

The standard transformation to eliminate direct left recursion replaces:

```
A → Aα₁ | Aα₂ | ... | Aαₘ | β₁ | β₂ | ... | βₙ
```

with:

```
A  → β₁ A' | β₂ A' | ... | βₙ A'
A' → α₁ A' | α₂ A' | ... | αₘ A' | ε
```

The new A' is right-recursive — it consumes an α suffix and then either recurses or terminates with ε. The transformation preserves the language but changes the parse tree shape (and therefore associativity if you are not careful). Tools like EBNF `{...}` sidestep the issue by allowing iteration directly.

Indirect left recursion is handled by a three-step procedure: order the non-terminals A₁, ..., Aₙ, substitute each A_i in A_j (j > i) until the grammar has only direct left recursion, then apply the direct transformation. Dragon Book chapter 4 has the algorithm in detail.

### 6.5 Left factoring

Two productions with a common prefix cause trouble for predictive parsers:

```
A → αβ | αγ
```

A top-down parser looking at the current input cannot decide which alternative to take if both start with α. Left factoring transforms the grammar:

```
A  → α A'
A' → β | γ
```

Now the parser reads α, then decides. Left factoring is one of the standard preprocessing steps before feeding a grammar to an LL(1) parser generator.

### 6.6 LL(k) grammars

An LL(k) parser is a top-down parser that reads input Left to right, produces a Leftmost derivation, and uses k tokens of lookahead. LL(1) is the practically important case: at each step, the parser looks at the current non-terminal and the next token, and picks a production uniquely. The choice is made from a parse table indexed by (non-terminal, next-token) and populated using FIRST and FOLLOW sets.

- **FIRST(α)** is the set of terminals that can begin a string derived from α. If ε can be derived from α, ε is also in FIRST(α).
- **FOLLOW(A)** is the set of terminals that can appear immediately after A in some sentential form. FOLLOW is defined for non-terminals, not arbitrary strings.

A grammar is LL(1) iff for every non-terminal A with productions A → α₁ | α₂ | ... | αₙ, (a) FIRST(α_i) ∩ FIRST(α_j) = ∅ for i ≠ j, and (b) if any α_i can derive ε, then FIRST(α_j) ∩ FOLLOW(A) = ∅ for j ≠ i. When these conditions hold, a table-driven LL(1) parser can be generated automatically and runs in linear time.

Recursive descent is the hand-coded version of LL(k). Each non-terminal becomes a function; the function body reads the input, matches against expected tokens, and recurses. Hand-written recursive descent parsers for LL(1) or LL(2) grammars are often the cleanest, most maintainable parsers a language implementation can have. Clang's C++ parser, Roslyn's C# parser, and the Rust compiler's parser are all hand-written recursive descent.

### 6.7 LR(k) grammars

An LR(k) parser reads Left to right, produces a Rightmost derivation (in reverse), and uses k tokens of lookahead. LR parsers are bottom-up: they shift tokens onto a stack and reduce stack suffixes to non-terminals according to the grammar. LR is strictly more powerful than LL — every LL(k) grammar is LR(k), but some LR(k) grammars are not LL(j) for any j. LR parsers handle left recursion naturally, which is the main reason LR is the default technique for mechanically-generated parsers.

Knuth introduced LR(k) parsing in his 1965 paper *On the Translation of Languages from Left to Right*. The result was striking: Knuth showed that any deterministic context-free language can be parsed in linear time using LR(k) for some k, and he gave a mechanical construction of the parse tables. The theoretical power was clear immediately. The practical problem was that LR(k) tables are large. For typical programming languages, an LR(1) parser table is on the order of tens of thousands of entries, and LR(2) tables blow up combinatorially. Knuth's paper gave the theory; it would take four more years to make it practical.

### 6.8 LALR(1): the practical compromise

Frank DeRemer's 1969 MIT PhD thesis, *Practical Translators for LR(k) Languages*, introduced LALR(1) — Lookahead LR(1). DeRemer's insight was that the bloated LR(1) table could be compressed without losing most of its expressive power. LALR(1) builds the same state machine as LR(0) — much smaller than LR(1) — and then computes one-token lookahead sets for each state's reduce actions. The resulting tables are an order of magnitude smaller than LR(1) tables and can handle almost every practical programming language grammar.

LALR(1) is the parser class that Yacc (1975) and all its descendants (Bison, Berkeley Yacc, byacc, and a dozen others) implement. For a grammar writer, the difference between LR(1) and LALR(1) shows up occasionally: some grammars that are LR(1) are not LALR(1), and the parser generator reports a conflict where LR(1) would have built a valid table. These cases are rare in practice, and the workarounds (grammar rewriting, precedence annotations) are usually easy. The compression benefit was enormous and LALR(1) became the dominant parser generator technique for three decades.

### 6.9 LR(k) for k > 1

Parser generators for LR(2), LR(3), and general LR(k) exist but are uncommon. The reason is partly historical inertia (LALR(1) works for almost everything) and partly that the table explosion is severe. For every additional lookahead token, the state space multiplies. LR(1) for a typical language has a few thousand states; LR(2) can easily have hundreds of thousands. Canonical LR(1) — the unmerged version of LALR(1) — is occasionally used when a grammar is LR(1) but not LALR(1); tools like Menhir (for OCaml) support it.

### 6.10 The Dragon Book

*Compilers: Principles, Techniques, and Tools* by Alfred Aho, Ravi Sethi, and Jeffrey Ullman was first published in 1986. A second edition by Aho, Monica Lam, Ravi Sethi, and Jeffrey Ullman came out in 2006. The book is known as the Dragon Book because its covers (both editions) show a knight attacking a dragon labeled "Complexity of Compiler Design." It is the canonical graduate compiler textbook, and the canonical treatment of parsing theory from the LL/LR perspective. Chapters 3–5 of the second edition cover lexical analysis, syntax analysis (LL and LR in detail), and syntax-directed translation (attribute grammars, attribute evaluation). For a generation of compiler writers, the Dragon Book was the introduction to LALR parser generators and the theoretical background for using Yacc and Bison.

The Dragon Book has been both celebrated and criticized. Celebrated because it is thorough, precise, and connects theory to practice throughout. Criticized because it devotes disproportionate space to LR parser theory compared to the other phases of a compiler, and because real compiler writers in the 2000s and 2010s increasingly abandoned parser generators in favor of hand-written recursive descent. Grune and Jacobs's *Parsing Techniques: A Practical Guide* (2008) is the alternative for readers who want the full range of parsing algorithms without the LR-centric emphasis.

---

## 7. Parser Technology Evolution

### 7.1 Hand-written recursive descent: the beginning

The first parsers were hand-written. The FORTRAN 0 parser, ALGOL 58 compilers, the early Lisp readers — all were hand-coded. Recursive descent was the natural pattern: you wrote a function per syntactic category, each function read a bit of input and called other functions to parse sub-structures. The parser mirrored the grammar, with each non-terminal becoming a function and each production becoming a body that matched tokens and made recursive calls.

Recursive descent works beautifully for LL(1) grammars and works well with hand-written backtracking for LL(k) grammars and some non-LL grammars. It produces parsers that are straightforward to read, easy to debug, and easy to add error recovery to. The downside is that every change to the grammar requires a manual change to the parser, and the parser can drift from the grammar over time if discipline slips. But for the first decade of compiler writing, there was no alternative.

### 7.2 Operator precedence parsing

Expression parsing has a natural problem: infix operators with multiple precedence levels and associativity. Recursive descent handles this by stratification (a function per precedence level), but that is verbose. Bauer and Samelson, at the Technische Hochschule München, introduced operator precedence parsing in the late 1950s as a specialized technique for expressions. The idea: assign each operator a precedence number, use a stack to track operators being deferred, and reduce whenever the stack top has higher precedence than the incoming operator.

A related technique, Pratt parsing (Vaughan Pratt, 1973), generalizes operator precedence by associating "binding powers" with tokens and using a simple recursive procedure to parse expressions with arbitrary infix, prefix, and postfix operators. Pratt parsers are still the technique of choice for hand-written expression parsers. The Rust compiler's expression parser is Pratt-based. ESLint's parser uses a Pratt-based approach. Pratt parsing is easy to extend — adding a new operator is just adding a binding power table entry — and it handles associativity cleanly.

### 7.3 Knuth's 1965 LR paper

Donald Knuth's *On the Translation of Languages from Left to Right*, published in Information and Control in 1965, is the paper that founded modern parser theory. Knuth asked: what is the largest class of context-free languages that can be parsed in linear time by a deterministic algorithm using a bounded amount of lookahead? His answer: LR(k), for any fixed k. He gave a constructive algorithm for building the parsing table from the grammar, proved correctness, and established that LR(k) for k ≥ 1 captures exactly the deterministic context-free languages.

The paper is dense — it is one of the Knuth papers you need to read slowly and with a pencil — and it introduced the concepts of item, closure, goto, and LR state that every subsequent parsing treatment has used. It also introduced the observation that k > 1 gives you no more languages than k = 1 (every LR(k) language has an LR(1) grammar, though possibly a different one). The paper was largely theoretical at the time of publication: LR(1) tables were too big to build by hand and too big to store on the computers of 1965. The theory had to wait for better computers and for LALR(1) compression before it became useful.

### 7.4 DeRemer and LALR(1), 1969

Frank DeRemer's MIT PhD thesis, *Practical Translators for LR(k) Languages* (1969), and his subsequent CACM paper *Simple LR(k) Grammars* (1971) introduced two important compressions of Knuth's LR(1): SLR (Simple LR) and LALR (Lookahead LR). SLR uses FOLLOW sets as lookaheads directly; LALR uses item-set-specific lookaheads. LALR is strictly more powerful than SLR but strictly less than canonical LR(1). For real programming languages, LALR(1) is enough. DeRemer's thesis made LR parsing practical by cutting table sizes by an order of magnitude.

### 7.5 Yacc, 1975

Stephen C. Johnson at Bell Labs built Yacc — Yet Another Compiler-Compiler — in the early 1970s and released it with Version 7 Unix in 1975. Yacc takes a grammar with embedded C actions and generates a C-language LALR(1) parser. The grammar file format is immediately recognizable to anyone who has used a Unix-family parser generator:

```yacc
%token NUMBER
%left '+' '-'
%left '*' '/'

%%
expr: expr '+' expr { $$ = $1 + $3; }
    | expr '-' expr { $$ = $1 - $3; }
    | expr '*' expr { $$ = $1 * $3; }
    | expr '/' expr { $$ = $1 / $3; }
    | NUMBER         { $$ = $1; }
    ;
%%
```

The grammar is intentionally ambiguous — two `expr`s joined by `+` is ambiguous as written — and is disambiguated by the `%left` precedence declarations. This was Johnson's choice: let the grammar be simple and handle precedence out-of-band.

Yacc shipped with Unix and was used to build the C compiler, the `awk` interpreter, the original Bourne shell parser, and thousands of programming language implementations over the next three decades. Its influence is hard to overstate. The whole generation of compiler writers learned LALR by writing Yacc grammars.

### 7.6 Lex, 1975

Lex, written by Mike Lesk and Eric Schmidt at Bell Labs around the same time as Yacc, is a lexer generator. It takes a file of regular expression–action pairs and generates a C function that tokenizes input:

```lex
%%
[0-9]+          { yylval = atoi(yytext); return NUMBER; }
[a-zA-Z_][a-zA-Z_0-9]*   { return IDENTIFIER; }
"+"|"-"|"*"|"/" { return yytext[0]; }
[ \t\n]+        ;
.               { return yytext[0]; }
%%
```

Lex and Yacc were designed to work together. The Lex-generated lexer's `yylex()` function is called by the Yacc-generated parser's `yyparse()`. The combination — a scanner of regular tokens feeding a parser of context-free syntax — is the canonical Type 3 → Type 2 pipeline of compiler front-ends, and it worked well enough that the pattern became universal.

### 7.7 Bison, 1985

The GNU project wanted a Yacc replacement that could be distributed under a free license. Robert Corbett at UC Berkeley wrote a Yacc-compatible parser generator for the Berkeley Unix distribution; Richard Stallman took Corbett's work, extended it, and released it as Bison in 1985. Bison is a strict superset of Yacc — every Yacc grammar compiles with Bison — and adds features over time: GLR parsing, better error messages, C++ and Java output modes, a more helpful `--verbose` mode that shows the LALR state machine.

Bison is still in active use. Recent GCC releases use it for parts of their parsers. PostgreSQL's SQL parser is Bison-generated. Many Linux distribution packages ship Bison as a build-time dependency. It has outlived most of its replacements.

### 7.8 ANTLR and PCCTS

Terence Parr, at Purdue and later the University of San Francisco, built PCCTS (Purdue Compiler Construction Tool Set) in the late 1980s. PCCTS used LL(k) top-down parsing instead of LALR, and its output was C or C++. The advantages over Yacc were: error messages were more intuitive (top-down parsers can say "expected X, found Y" naturally), the parser generated looked like the grammar (recursive-descent-style output), and the tool could handle grammars with syntactic predicates for disambiguation.

PCCTS evolved into ANTLR — ANother Tool for Language Recognition — in the mid-1990s. ANTLR 2 and 3 were widely used for Java tooling (Groovy's parser, Hibernate Query Language, many DSLs). ANTLR 4 (2013) introduced LL(*) — Adaptive LL(*) — which effectively does the equivalent of arbitrary-lookahead LL parsing by switching to a DFA-based lookahead strategy when the grammar becomes harder to predict. ANTLR 4 is the most widely used parser generator for Java-family tooling and has targets for Python, JavaScript, C#, Go, Swift, and C++.

An ANTLR 4 grammar for the arithmetic expression example:

```antlr
grammar Expr;

prog  : expr EOF ;

expr  : expr op=('*'|'/') expr    # mulDiv
      | expr op=('+'|'-') expr    # addSub
      | INT                        # int
      | '(' expr ')'               # parens
      ;

INT   : [0-9]+ ;
WS    : [ \t\r\n]+ -> skip ;
```

The grammar uses left recursion, which ANTLR 4 handles by automatic transformation. The labels in `#`-comments become methods on the generated visitor.

### 7.9 SLR, LALR, GLR

Three variations on LR deserve specific mention. SLR (Simple LR, DeRemer 1969) is the weakest practical LR variant: it uses FOLLOW sets as lookaheads directly, which is easy to compute but occasionally causes conflicts that LALR would resolve. SLR is not used much in practice but is pedagogically clean.

LALR we have covered. It is the dominant parser generator class.

GLR — Generalized LR, Masaru Tomita 1986 — parses any context-free grammar, even ambiguous ones, by running multiple LR parsers in parallel through a shared state structure. When a shift/reduce or reduce/reduce conflict is detected, GLR splits and pursues both alternatives, merging states that become identical. The output is a parse forest rather than a parse tree. GLR is used for natural language parsing (where ambiguity is expected) and for some programming languages with genuinely ambiguous grammars (C++, famously, is not LALR(1)-parseable as a whole — the GLR mode of Bison can handle it). GLR is slower than LALR when the grammar is unambiguous (the parallel-parser machinery has overhead) but it never refuses a grammar.

### 7.10 Packrat parsing and PEGs

Bryan Ford's MS thesis at MIT (2002) and POPL 2004 paper introduced packrat parsing, a technique for parsing PEGs in linear time using memoization. The idea: every PEG rule is a deterministic function from input position to either a match or a failure. If you memoize the results — store, for each rule and position, whether it matched and what it consumed — you never do the same work twice. The total work is bounded by the product of the number of rules and the input length, which is O(n) for fixed grammar size.

The memoization table is large (potentially one entry per rule × position), which is the main cost of packrat parsing: it trades memory for time. For small grammars and large inputs, the tradeoff is often worthwhile. Packrat parsers have become popular for parsing configuration files, small DSLs, and situations where determinism and unambiguity matter more than memory efficiency.

Pegasus, PEG.js, parboiled, pest, and LPEG are among the parser libraries built on PEG and packrat ideas. Python's new parser (PEP 617, accepted in 2020 for Python 3.9) is a PEG parser generator that replaced the old pgen LL(1) parser. The Python team cited the ability to express Python's grammar more naturally in PEG — particularly the lookahead needed for features like walrus operators and pattern matching — as the motivation.

### 7.11 Tree-sitter

Max Brunsfeld at GitHub released Tree-sitter in 2018. Tree-sitter is a parser generator producing C parsers, with specific design goals: incremental parsing (re-parsing after an edit touches only the affected region, not the whole file), error recovery (the parser produces a useful tree even for syntactically broken input), and fast enough to run on every keystroke in an editor. Tree-sitter's parsers are GLR-like — they handle ambiguity — but they also have heuristics for error recovery that make them robust against incomplete input.

Tree-sitter is now the parsing layer in Atom (originally), Neovim's modern syntax highlighting, Helix, Zed, and many other editors. GitHub uses it for syntax highlighting on github.com. The library of grammars is large — most popular programming languages have a community-maintained Tree-sitter grammar — and the grammars themselves are written in JavaScript, which the tool then compiles to C.

A Tree-sitter grammar stub:

```javascript
module.exports = grammar({
  name: 'expr',

  rules: {
    source_file: $ => repeat($._expression),

    _expression: $ => choice(
      $.number,
      $.binary_expression,
      $.parenthesized,
    ),

    binary_expression: $ => choice(
      prec.left(1, seq($._expression, '+', $._expression)),
      prec.left(1, seq($._expression, '-', $._expression)),
      prec.left(2, seq($._expression, '*', $._expression)),
      prec.left(2, seq($._expression, '/', $._expression)),
    ),

    parenthesized: $ => seq('(', $._expression, ')'),
    number: $ => /\d+/,
  }
});
```

The `prec.left(N, ...)` annotations give precedence and associativity; the parser generator resolves conflicts using them. Tree-sitter is remarkable for how it has brought parser theory (GLR, incremental parsing) into everyday use for editor developers.

### 7.12 Modern Rust parser libraries

The Rust ecosystem has a rich set of parsing libraries reflecting the full breadth of parser technology:

- **Chumsky** — a parser combinator library for Rust, recursive descent, supports error recovery, used by many hobbyist languages.
- **LALRPOP** — an LR(1) parser generator for Rust. Grammar files look Yacc-like but use Rust actions.
- **nom** — a combinator library emphasizing zero-copy and byte-level parsing. Popular for binary protocol parsers.
- **pest** — a PEG-based parser. Grammar is written in a separate `.pest` file, parser is generated at build time.
- **combine** — another combinator library, inspired by Parsec.
- **lalr** / **glalr** — less widely used but available.

### 7.13 Parser combinators vs parser generators

There are two schools of thought about how to build a parser in modern languages.

**Parser generators** (Yacc, Bison, ANTLR, LALRPOP) take a grammar file and produce parser code at build time. Advantages: the grammar is explicit and separate from the rest of the codebase, the generator can do work at build time (table construction) to make the runtime parser fast, and the grammar can be read as a specification. Disadvantages: build time increases, the grammar file is in a dedicated DSL that doesn't integrate with the host language's tools, and error recovery is often weak.

**Parser combinators** (Parsec, Chumsky, nom, combine, attoparsec) are libraries that provide small parser primitives and higher-order functions to combine them. A parser is a first-class value in the host language; you build complex parsers by composing simple ones. Advantages: full integration with the host language (types, module system, tooling), flexible and easy to extend, and the parser can be modified at runtime. Disadvantages: slower than generated parsers (usually), no global grammar optimization, and no separate grammar specification to read.

Parsec (Daan Leijen, 2001) is the famous Haskell parser combinator library. Its influence is immense — most modern combinator libraries descend from it or from a library inspired by it. The Haskell ecosystem effectively standardized on Parsec and its successor attoparsec for all text-parsing tasks.

### 7.14 Earley parsing — the general CFG algorithm

One parser family that belongs in any thorough treatment but does not fit cleanly into either the LL or LR stories is Earley parsing. Jay Earley's 1968 PhD thesis at Carnegie Mellon, and his 1970 CACM paper *An Efficient Context-Free Parsing Algorithm*, introduced an algorithm that parses any context-free grammar, including ambiguous and left-recursive ones, in O(n³) worst case and O(n²) for unambiguous grammars and O(n) for LR grammars. Earley's algorithm maintains sets of "items" (positions in partially-matched productions) indexed by input position, and it incrementally builds these sets as it reads the input.

Earley parsing is less famous than LR and LL because for most programming languages, the more restrictive LL(1) or LALR(1) is fast enough and its conflict messages are actionable at grammar-design time. Earley's advantage — accepting any CFG — is a liability when what you want is a grammar that is provably deterministic. But Earley parsing has staged a comeback in two places: natural language processing (where grammars are often ambiguous by necessity), and modern parsing libraries that want to support arbitrary user grammars without asking the user to learn LL or LR discipline. Marpa (Jeffrey Kegler), the Python library Lark, and the education-focused parsing library Nearley all use variants of Earley parsing.

CYK — the Cocke-Younger-Kasami algorithm, independently discovered by all three in the 1960s — is another general CFG parser, running in O(n³), that requires the grammar to be in Chomsky Normal Form. CYK is pedagogically clean (it is the standard worked example in formal language theory courses) and occasionally used in practice for NLP, but it is less flexible than Earley because of the CNF requirement.

### 7.15 The long arc from Yacc to Tree-sitter

The arc is visible in hindsight. Yacc (1975) gave compiler writers a way to generate parsers from grammars. ANTLR (1990s) made top-down parsing mechanical and added error messages programmers actually understood. PEG (2004) removed ambiguity as a concept and made composition natural. Tree-sitter (2018) made parsers fast enough and robust enough to run on every keystroke in every file being edited. Each step kept the BNF inheritance visible — grammars are still written in notations descended from Naur's — and each step added a capability the previous tools had lacked.

BNF is the connective tissue. The grammar file in Yacc, in ANTLR, in Tree-sitter, in every parser generator, is a close descendant of the notation in the ALGOL 60 Report. An ALGOL 60 programmer reading a Tree-sitter grammar in 2025 would recognize the shape of it immediately. Sixty-five years of parser technology have not displaced the notation.

### 7.16 Error recovery

A practical matter worth separate treatment: what does a parser do when the input does not match the grammar? The first-generation parser generators (Yacc, early Bison) offered only the most primitive error recovery: the `error` pseudo-token that a grammar writer could use to mark recovery points, followed by token-skipping until the parser found a state it could continue from. The error messages were often unhelpful ("syntax error at line 37") and the recovery was often wrong — a missing semicolon could cascade into dozens of spurious errors downstream.

The second generation (ANTLR, modern Bison) improved on this by using synchronization sets, error productions, and heuristic token insertion and deletion. ANTLR can produce messages like "missing ';' at 'if'" with the right grammar annotations. The hand-written parser in clang takes the technique further: when it sees a token that does not match, it consults a context-specific recovery table and tries to suggest the most likely fix.

Tree-sitter made error recovery a first-class design goal, which is unusual in parser generator history. Because Tree-sitter parses on every keystroke, it cannot refuse to parse syntactically broken input — the user has just typed a character, and the tree has to be ready for highlighting before the next character arrives. Tree-sitter's parser produces an "error node" wherever the grammar cannot be matched, and continues parsing past it. The resulting tree is mostly correct with local damage at the error site, which is exactly what an editor needs for highlighting and navigation. This ability to handle broken input gracefully is one of Tree-sitter's most important contributions — and it is orthogonal to the grammar formalism, which is still a CFG in shape.

---

## 8. BNF in Practice Outside Programming Languages

### 8.1 IETF protocols: ABNF everywhere

Internet protocol specifications are written in ABNF, as defined in RFC 5234. The list of protocols defined this way is long:

- **HTTP** — RFC 7230 (superseded by RFC 9110–9112) specifies HTTP/1.1 message syntax in ABNF, with rules like `request-line = method SP request-target SP HTTP-version CRLF`.
- **SMTP** — RFC 5321 uses ABNF for all mail-transfer syntax.
- **SIP** — RFC 3261, the Session Initiation Protocol used for VoIP and video calls, has a lengthy ABNF grammar for SIP messages.
- **URIs** — RFC 3986 defines URI syntax entirely in ABNF. Every browser, every HTTP library, every URL parser starts from this grammar.
- **MIME** — RFC 2045, 2046, 2047 for MIME headers and bodies.
- **DKIM, SPF, DMARC** — email authentication protocols, all ABNF-specified.
- **LDAP** — the Lightweight Directory Access Protocol's message format is ABNF.
- **XMPP** — the extensible messaging protocol used by Jabber and, originally, Google Talk.

The uniformity is striking. You can open any RFC published in the last 20 years that defines a protocol syntax, and find an ABNF grammar in the specification. This is not an accident — the IETF process requires or strongly encourages formal grammars for protocol syntax, and RFC 5234 is the tool of choice.

### 8.2 XML in W3C EBNF

The XML 1.0 specification (W3C, 1998, many editions since) defines XML syntax in a custom EBNF variant. The grammar is about 80 productions and covers everything: elements, attributes, CDATA sections, processing instructions, DTDs, namespaces. The specification is itself a major use of formal grammars — XML parsers are generated or hand-written from this grammar, and the entire XML tool ecosystem is grounded in it.

Subsequent W3C specifications — XPath, XSLT, XQuery, SVG, MathML — also use W3C EBNF for their syntactic definitions. The notation has become the house style at W3C.

### 8.3 JSON in ABNF and in RFC

JSON's grammar was originally described on json.org in railroad diagrams by Douglas Crockford. The IETF standardization came later: RFC 4627 (2006), superseded by RFC 7159 (2014), then by RFC 8259 (2017). All three RFCs give the JSON grammar in ABNF:

```abnf
JSON-text = ws value ws
value = false / null / true / object / array / number / string
object = begin-object [ member *( value-separator member ) ] end-object
member = string name-separator value
array = begin-array [ value *( value-separator value ) ] end-array
```

JSON's grammar is famously small — about 15 productions — and this smallness is why it won against its competitors. A grammar you can read in ten minutes is easier to implement than one that takes a day. JSON also has the distinction of being slightly *not* context-free at the edges: the spec allows whitespace in various places and the handling of whitespace around numbers interacts with the lexer in ways that most specs gloss over, but the grammar itself is small and tractable.

### 8.4 URI syntax in ABNF

RFC 3986, *Uniform Resource Identifier (URI): Generic Syntax*, is one of the most important protocol specifications on the internet, and it is written entirely in ABNF. The URI grammar is nontrivial — about 30 productions — and handles the subtleties of schemes, authorities, userinfo, hosts, ports, paths, queries, and fragments, all with percent-encoding layered on top. Every web browser's URL parser, every HTTP library's URL class, derives from this grammar. The existence of a single formal specification is why two browsers agree on whether `http://example.com/foo%2Fbar` is a valid URL.

### 8.5 Lua in EBNF

The Lua reference manual includes a complete EBNF grammar for the language. It is a small grammar — Lua is a small language — and it serves both as documentation and as an implementation starting point. Alternative Lua implementations (LuaJIT, Yuescript, Terra) all start from the same EBNF grammar.

### 8.6 Python in modified EBNF

The Python language reference, at docs.python.org/3/reference/grammar.html, publishes the full grammar in a variant of EBNF specific to Python. Before Python 3.9 this grammar was read by pgen, a LL(1) parser generator written specifically for CPython. Since Python 3.9 (PEP 617) the grammar is read by a PEG parser generator. The grammar notation itself has evolved: it now includes PEG-specific constructs like lookahead predicates, but the core shape is still BNF-descended.

### 8.7 SQL in BNF

The SQL standard — ISO/IEC 9075, most recently the 2023 edition — defines SQL syntax in BNF. The SQL standard's BNF is voluminous (thousands of productions), because SQL is a large language with many optional features. It is also notorious for being slightly different from what any particular database implements, because database vendors extend and restrict the standard in various directions. But the ISO standard itself is BNF, and implementations at least reference it as a starting point.

### 8.8 The universality of BNF descendants

Pick any language reference manual from a serious language — Java, C#, Go, Rust, Swift, Kotlin, Haskell, OCaml, Scala, Erlang, Elixir, Clojure — and flip to the grammar section. You will find a grammar in BNF or some EBNF variant. Sometimes the notation is the language's own homegrown flavor (Rust's reference manual uses a custom syntax that is essentially EBNF with some extensions). Sometimes it is ISO EBNF. Sometimes it is unlabeled but visibly BNF-shaped. The notation is universal in a way that almost nothing else in programming language documentation is universal. You do not need to read a tutorial to understand the grammar section of a language manual; you just read it.

---

## 9. Context-Free Grammars and Compiler Theory

### 9.1 Parse trees to ASTs

The parse tree produced by a parser is a faithful record of the derivation. For an LR-like bottom-up parser, the tree has one node per rule application. For a typical programming language, the parse tree is too detailed for subsequent compiler phases. You do not want the type-checker reasoning about which production of `⟨statement⟩` was used; you want it reasoning about the specific kind of statement (assignment, if, while).

The abstract syntax tree (AST) is a distilled parse tree: the non-terminals that exist only to enforce precedence are collapsed away, and each node carries only the semantic information needed for later phases. An assignment node in an AST has two children — the target and the value — and doesn't mention the precedence-encoding non-terminals that the grammar needed. The translation from parse tree to AST is a straightforward tree walk, usually expressed by giving each grammar production a semantic action that builds the desired AST node.

In Yacc or Bison, the semantic action in the grammar directly builds the AST:

```yacc
assignment: IDENTIFIER '=' expr
          { $$ = make_assign_node($1, $3); }
          ;
```

In recursive-descent parsers, the AST is built by the parsing functions directly, with each function returning an AST node.

### 9.2 Semantic analysis as a separate phase

Once you have an AST, the next phase — semantic analysis — checks constraints that the grammar cannot express. These include:

- **Name resolution**: every variable use has a corresponding declaration in scope.
- **Type checking**: every expression has a well-defined type and operators are applied to compatible types.
- **Flow analysis**: return statements match function return types, break/continue are inside loops, variables are initialized before use.

These constraints are context-sensitive in the Chomsky-hierarchy sense, and the compiler front-end accepts the separation: the parser handles the context-free part, the semantic analyzer handles the rest. This separation is not just theoretical neatness — it is the reason that parser generators work at all. If parsing had to also handle name resolution and typing, no parser generator could handle any real language.

### 9.3 Attribute grammars (Knuth 1968)

Donald Knuth's 1968 paper *Semantics of Context-Free Languages* (Mathematical Systems Theory) introduced attribute grammars, a formal mechanism for attaching computed values to parse tree nodes. An attribute grammar is a CFG plus, for each non-terminal, a set of attributes and, for each production, a set of rules computing the attributes of nodes from the attributes of their children (synthesized attributes) or from the attributes of their parent and siblings (inherited attributes).

Attribute grammars let you express semantic analysis declaratively, as a computation over the parse tree. They are the formal underpinning of syntax-directed translation, the technique that runs through the Dragon Book like a spine. In practice, attribute grammars in their full glory are rarely used — the circularity checks and evaluation order are subtle and most compiler writers prefer to write the semantic analyzer as a plain tree walk in their host language — but the underlying idea (each grammar node carries a bundle of computed attributes) is universal in compiler textbook exposition.

### 9.4 The Pascal P-compiler

Niklaus Wirth, with Urs Ammann, released the Pascal-P compiler and its source code in the mid-1970s as a portability aid. The P-compiler was written in Pascal, generated P-code (a portable intermediate representation), and shipped with an implementation of a P-code interpreter. To bring Pascal to a new machine, you implemented the P-code interpreter in whatever language the machine had, and now you had a Pascal compiler.

The P-compiler's parser was hand-written recursive descent, matching the EBNF grammar in the Pascal User Manual and Report. Reading the P-compiler source was a rite of passage for computer science students in the late 1970s and 1980s — it was short enough to read in a week, complete enough to actually compile Pascal programs, and pedagogically exemplary. Many early compiler courses used the P-compiler as a worked example.

### 9.5 SLY, PLY, and David Beazley

David Beazley, the Python expert and long-time PyCon speaker, wrote PLY (Python Lex-Yacc) in 2001 as a Python port of Lex and Yacc. PLY lets you define grammars as Python functions with docstrings:

```python
def p_expression_plus(p):
    'expression : expression PLUS term'
    p[0] = p[1] + p[3]

def p_expression_term(p):
    'expression : term'
    p[0] = p[1]
```

The docstrings are the grammar productions; PLY parses them and generates an LALR(1) parser at import time. This was a clever hack — the grammar specification lives in the Python source file, but the parser generator still works on grammar text.

Beazley later wrote SLY (Sly Lex-Yacc), a cleaner reimplementation using metaclasses and Python 3 features. SLY is small, readable, and teaches parser concepts well. It is a common choice for small DSLs and teaching Python-based compiler courses.

### 9.6 The link to program analysis

Parsing is the first phase of a compiler, but the tree it produces feeds everything downstream: type inference, constant folding, dead code elimination, data flow analysis, register allocation, code generation. Every optimization pass reads and writes the AST (or a lower intermediate representation derived from it). The grammar's structure directly shapes the AST's structure, and the AST's structure directly shapes what the optimizer can see. A grammar that cleanly separates different syntactic categories produces an AST that is easy to analyze; a grammar with lots of ad-hoc alternatives produces an AST with lots of cases the analyzer has to handle.

This is one reason hand-written recursive-descent parsers have become fashionable again for serious compilers. The hand-written parser can produce a custom AST shape optimized for the needs of the downstream phases, with node types that exactly match what the analyzer wants. A Yacc-generated parser produces a parse tree whose shape is tied to the grammar, and while semantic actions can massage it into something else, the ergonomics are worse.

---

## 10. The Post Production System Connection

### 10.1 Emil Post and his 1943 paper

Emil Post (1897–1954) was a Polish-American logician who worked mostly at City College of New York. He did his doctoral work in the 1920s on what are now called Post algebras and tabular representations of propositional logic. In the 1920s he discovered independently (and before Gödel published) something close to the incompleteness of certain formal systems, but he did not publish — a decision he later regretted publicly. In the 1930s and 1940s he worked on recursion theory, computability, and the foundations of formal logic.

His 1943 paper, *Formal Reductions of the General Combinatorial Decision Problem* (American Journal of Mathematics 65, 197–215), introduced what he called "production systems" — formal rewriting systems for strings. A Post production has the form:

```
g₁ α₁ g₂ α₂ ... gₙ αₙ gₙ₊₁  →  h₁ β₁ h₂ β₂ ... hₘ βₘ hₘ₊₁
```

where the g_i and h_j are fixed strings, and the α_i and β_j are variables that match arbitrary strings. The rule applies when the input matches the left-hand-side template; the output is the right-hand side with the matched substrings substituted.

Post production systems can simulate any Turing machine. They are a universal model of computation, first proposed as such in the early 1930s independently of Turing, Church, and Kleene. Post had by 1920 already developed a theory of "canonical systems" that was essentially a formal logic defined by production rules. He did not publish that work and when he returned to the area in the 1940s, Turing and Church had already established their models and the field was moving on.

### 10.2 Post and the direct ancestry of BNF

Backus, in his 1959 ICIP Paris paper, cited Post explicitly. The citation is to Post's 1943 paper, and the acknowledgment is direct: Backus's notation is a restricted form of Post's production rules. Where Post allowed arbitrary context on both sides of a production, Backus restricted the left-hand side to a single non-terminal. Where Post allowed any rewriting pattern, Backus restricted the result to a concatenation of terminals and non-terminals. What remained was exactly the class of productions that generate context-free languages.

This restriction was not arbitrary. Backus's goal was to describe the syntax of a programming language such that independent readers would agree on what was legal, and such that a parser could be mechanically derived from the description. A full Post production system, being Turing-complete, was too powerful — you would not know if a given program was syntactically legal without potentially running an unbounded computation. The restricted form sacrificed expressive power for decidability. Whether a particular string is generated by a CFG is decidable in polynomial time; whether a particular string is generated by a Post system is, in general, undecidable.

Backus's citation of Post is a small piece of intellectual honesty that has been reproduced in compiler textbooks ever since. Most of those textbooks do not engage with Post's work beyond the mention; they treat CFGs as a self-contained object and move on to parsing theory. But the restricted-form-of-Post framing is worth preserving. It locates BNF in the larger space of rewriting systems and clarifies why it has the shape it does.

### 10.3 Post's correspondence problem

In 1946 Post introduced the Post Correspondence Problem (PCP) in the paper *A Variant of a Recursively Unsolvable Problem* (Bulletin of the AMS). PCP is: given a finite collection of dominoes, each with a top string and a bottom string, can you select a sequence of dominoes (with repetition allowed) such that concatenating the top strings equals concatenating the bottom strings? The problem is undecidable — no algorithm can solve it in general — and Post's proof is a classic.

PCP turns out to be a workhorse for undecidability proofs in formal language theory. Many undecidability results about CFGs — whether a CFG is ambiguous, whether two CFGs generate the same language, whether a CFG generates all strings — are proved by reduction from PCP. The Post name echoes through the field at two levels: his production systems gave us BNF (restricted form), and his correspondence problem gave us the proof technique for showing what BNF cannot decide.

### 10.4 The Chomsky/Post overlap

Chomsky's 1956 paper on the hierarchy came out more than a decade after Post's 1943 paper. Chomsky knew Post's work and referenced it. Post's canonical systems were part of the formal background that Chomsky was drawing on, along with Markov's normal algorithms and the broader tradition of string rewriting. Chomsky's contribution was not the idea of rewriting per se — that was in the air, with at least three independent formulations by the 1940s — but the specific taxonomy (the four-level hierarchy) and the connection between grammar types and specific automaton types.

The irony, visible only in retrospect: Post had Turing-equivalent productions; Chomsky had a hierarchy classifying productions by restriction; Backus picked the context-free restriction and used it to describe ALGOL; Naur popularized the usage; Knuth gave LR parsing its theoretical foundation; Yacc made it practical. Every step is a narrowing of scope followed by an expansion of use. Post's general system was used by almost nobody; BNF is used by everyone who has ever specified a programming language.

---

## 11. Parser Generator Code Examples

Grammars side by side in several notations, all describing the same small language: arithmetic expressions with numbers, parentheses, and the four basic operators. Comparing the notations makes the family resemblances visible.

### 11.1 Classic BNF

```bnf
⟨expr⟩   ::= ⟨term⟩
           | ⟨expr⟩ "+" ⟨term⟩
           | ⟨expr⟩ "-" ⟨term⟩

⟨term⟩   ::= ⟨factor⟩
           | ⟨term⟩ "*" ⟨factor⟩
           | ⟨term⟩ "/" ⟨factor⟩

⟨factor⟩ ::= ⟨number⟩
           | "(" ⟨expr⟩ ")"

⟨number⟩ ::= ⟨digit⟩ | ⟨number⟩ ⟨digit⟩
⟨digit⟩  ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
```

### 11.2 Wirth EBNF

```ebnf
expr   = term   { ("+" | "-") term } .
term   = factor { ("*" | "/") factor } .
factor = number | "(" expr ")" .
number = digit { digit } .
digit  = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" .
```

### 11.3 ISO EBNF

```iso-ebnf
expr    = term, { ("+" | "-"), term } ;
term    = factor, { ("*" | "/"), factor } ;
factor  = number | "(", expr, ")" ;
number  = digit, { digit } ;
digit   = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

### 11.4 ABNF (RFC 5234 style)

```abnf
expr    = term *( ("+" / "-") term )
term    = factor *( ("*" / "/") factor )
factor  = number / "(" expr ")"
number  = 1*DIGIT
DIGIT   = %x30-39
```

### 11.5 PEG (Ford 2004)

```peg
Expr    <- Term   (("+" / "-") Term)*
Term    <- Factor (("*" / "/") Factor)*
Factor  <- Number / "(" Expr ")"
Number  <- [0-9]+
```

### 11.6 Yacc/Bison

```yacc
%token NUM
%left '+' '-'
%left '*' '/'

%%

expr
    : expr '+' expr   { $$ = $1 + $3; }
    | expr '-' expr   { $$ = $1 - $3; }
    | expr '*' expr   { $$ = $1 * $3; }
    | expr '/' expr   { $$ = $1 / $3; }
    | '(' expr ')'    { $$ = $2; }
    | NUM             { $$ = $1; }
    ;

%%
```

Note the intentional ambiguity in the grammar: two `expr`s joined by `+` is ambiguous, and is resolved by the precedence declarations.

### 11.7 ANTLR 4

```antlr
grammar Calc;

prog : expr EOF ;

expr : expr op=('*'|'/') expr   # MulDiv
     | expr op=('+'|'-') expr   # AddSub
     | '(' expr ')'              # Parens
     | NUM                       # Num
     ;

NUM : [0-9]+ ;
WS  : [ \t\r\n]+ -> skip ;
```

ANTLR 4 handles the left recursion automatically. The labels after `#` become visitor method names.

### 11.8 Tree-sitter

```javascript
module.exports = grammar({
  name: 'calc',
  rules: {
    source_file: $ => $._expression,

    _expression: $ => choice(
      $.binary_expression,
      $.parenthesized_expression,
      $.number,
    ),

    binary_expression: $ => choice(
      prec.left(2, seq($._expression, '*', $._expression)),
      prec.left(2, seq($._expression, '/', $._expression)),
      prec.left(1, seq($._expression, '+', $._expression)),
      prec.left(1, seq($._expression, '-', $._expression)),
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),
    number: $ => /[0-9]+/,
  }
});
```

### 11.9 Pest (Rust PEG)

```pest
expr    = { term ~ (("+" | "-") ~ term)* }
term    = { factor ~ (("*" | "/") ~ factor)* }
factor  = { number | "(" ~ expr ~ ")" }
number  = @{ ASCII_DIGIT+ }
WHITESPACE = _{ " " | "\t" | "\n" }
```

### 11.10 Parser combinator (Haskell Parsec)

```haskell
expr   = term   `chainl1` addOp
term   = factor `chainl1` mulOp
factor = parens expr <|> number
addOp  = (Add <$ char '+') <|> (Sub <$ char '-')
mulOp  = (Mul <$ char '*') <|> (Div <$ char '/')
number = Num . read <$> many1 digit
```

The `chainl1` combinator handles left-associative infix operators. The grammar reads top-to-bottom like an EBNF file, but it is Haskell code: each name is a parser value, composed with combinators.

### 11.11 Reading across the examples

The kinship is unmistakable. Every one of these notations has the same core: a small number of non-terminals (`expr`, `term`, `factor`, `number`), a precedence stratification, a recursive `factor` for parentheses, and literal characters for terminals. The surface differences — `::=` vs `=` vs `:` vs `<-`, bracket conventions, grouping — are cosmetic. Under the surface, all of them are direct descendants of the notation Backus introduced in 1959 and Naur standardized in 1960.

The differences that do matter: (1) whether left recursion is allowed (yes for BNF and LR-based tools, no for naive PEG and naive LL), (2) whether alternation is ordered (yes for PEG, no for classical BNF), and (3) whether repetition is expressed by recursion or by a dedicated iteration operator. These differences correspond to real choices in parser algorithm design, and they explain why there isn't one universal grammar notation: different parser technologies want slightly different inputs.

---

## 12. Bibliography

### Primary sources

- Backus, John W. "The Syntax and Semantics of the Proposed International Algebraic Language of the Zurich ACM-GAMM Conference." In *Proceedings of the International Conference on Information Processing* (UNESCO, Paris, June 1959), pp. 125–131. Published 1960.

- Naur, Peter, editor. "Report on the Algorithmic Language ALGOL 60." *Communications of the ACM* 3, no. 5 (May 1960): 299–314. Reprinted in *Numerische Mathematik*.

- Knuth, Donald E. "Backus Normal Form vs. Backus Naur Form." Letter to the editor, *Communications of the ACM* 7, no. 12 (December 1964): 735–736.

- Knuth, Donald E. "On the Translation of Languages from Left to Right." *Information and Control* 8, no. 6 (December 1965): 607–639.

- Knuth, Donald E. "Semantics of Context-Free Languages." *Mathematical Systems Theory* 2, no. 2 (June 1968): 127–145. Correction in 5, no. 1 (1971): 95–96.

- Chomsky, Noam. "Three Models for the Description of Language." *IRE Transactions on Information Theory* 2, no. 3 (September 1956): 113–124.

- Chomsky, Noam. "On Certain Formal Properties of Grammars." *Information and Control* 2, no. 2 (June 1959): 137–167.

- Post, Emil L. "Formal Reductions of the General Combinatorial Decision Problem." *American Journal of Mathematics* 65, no. 2 (April 1943): 197–215.

- Post, Emil L. "A Variant of a Recursively Unsolvable Problem." *Bulletin of the American Mathematical Society* 52, no. 4 (1946): 264–268.

- Wirth, Niklaus. "What Can We Do About the Unnecessary Diversity of Notation for Syntactic Definitions?" *Communications of the ACM* 20, no. 11 (November 1977): 822–823.

- DeRemer, Frank L. "Practical Translators for LR(k) Languages." PhD thesis, MIT, 1969.

- DeRemer, Frank L. "Simple LR(k) Grammars." *Communications of the ACM* 14, no. 7 (July 1971): 453–460.

- Tomita, Masaru. *Efficient Parsing for Natural Language: A Fast Algorithm for Practical Systems*. Kluwer Academic Publishers, 1986.

- Ford, Bryan. "Packrat Parsing: a Practical Linear-Time Algorithm with Backtracking." MS thesis, MIT, September 2002.

- Ford, Bryan. "Parsing Expression Grammars: A Recognition-Based Syntactic Foundation." In *Proceedings of the 31st ACM SIGPLAN-SIGACT Symposium on Principles of Programming Languages (POPL)*, Venice, Italy, January 2004: 111–122.

### Standards and RFCs

- ISO/IEC 14977:1996. *Information technology — Syntactic metalanguage — Extended BNF*. International Organization for Standardization, 1996.

- RFC 5234: Crocker, D. and P. Overell. *Augmented BNF for Syntax Specifications: ABNF*. IETF, January 2008.

- RFC 3986: Berners-Lee, T., R. Fielding, and L. Masinter. *Uniform Resource Identifier (URI): Generic Syntax*. IETF, January 2005.

- RFC 8259: Bray, T., editor. *The JavaScript Object Notation (JSON) Data Interchange Format*. IETF, December 2017.

- RFC 9110: Fielding, R., M. Nottingham, and J. Reschke. *HTTP Semantics*. IETF, June 2022.

- W3C Recommendation. *Extensible Markup Language (XML) 1.0 (Fifth Edition)*. World Wide Web Consortium, 26 November 2008.

### Textbooks

- Aho, Alfred V., Ravi Sethi, and Jeffrey D. Ullman. *Compilers: Principles, Techniques, and Tools*. First edition, Addison-Wesley, 1986. "The Dragon Book."

- Aho, Alfred V., Monica S. Lam, Ravi Sethi, and Jeffrey D. Ullman. *Compilers: Principles, Techniques, and Tools*. Second edition, Addison-Wesley, 2006.

- Grune, Dick, and Ceriel J. H. Jacobs. *Parsing Techniques: A Practical Guide*. Second edition, Springer, 2008.

- Hopcroft, John E., Rajeev Motwani, and Jeffrey D. Ullman. *Introduction to Automata Theory, Languages, and Computation*. Third edition, Pearson, 2006.

- Sipser, Michael. *Introduction to the Theory of Computation*. Third edition, Cengage, 2012.

- Parr, Terence. *The Definitive ANTLR 4 Reference*. Second edition, Pragmatic Bookshelf, 2013.

- Appel, Andrew W. *Modern Compiler Implementation in ML* (also in Java and C editions). Cambridge University Press.

- Cooper, Keith D., and Linda Torczon. *Engineering a Compiler*. Second edition, Morgan Kaufmann, 2012.

### Tools and specifications cited

- Yacc (Stephen C. Johnson, Bell Labs, 1975). Distributed with Version 7 Unix.
- Lex (Mike Lesk and Eric Schmidt, Bell Labs, 1975).
- GNU Bison (Robert Corbett, Richard Stallman, and contributors; 1985 onward).
- ANTLR / PCCTS (Terence Parr; PCCTS 1989, ANTLR 2 mid-1990s, ANTLR 4 2013).
- Tree-sitter (Max Brunsfeld and contributors, GitHub; 2018).
- Parsec (Daan Leijen; Haskell; 2001).
- PLY / SLY (David Beazley; Python; 2001 onward).

---

## Appendix A: The ALGOL 60 Report, Read in Its Own Grammar

A short exercise, included here for the ALG project: read a fragment of the ALGOL 60 Report's grammar and parse a one-line ALGOL 60 program by hand. The goal is not to learn ALGOL 60 but to feel the weight of what Backus and Naur produced — a complete, formal, mechanizable description of a major programming language, fitting in a few dozen pages.

The relevant rules (paraphrased from the Report):

```bnf
⟨program⟩            ::= ⟨block⟩ | ⟨compound statement⟩
⟨block⟩              ::= ⟨unlabelled block⟩ | ⟨label⟩ : ⟨block⟩
⟨unlabelled block⟩   ::= ⟨block head⟩ ; ⟨compound tail⟩
⟨block head⟩         ::= begin ⟨declaration⟩
                       | ⟨block head⟩ ; ⟨declaration⟩
⟨compound statement⟩ ::= ⟨unlabelled compound⟩ | ⟨label⟩ : ⟨compound statement⟩
⟨unlabelled compound⟩::= begin ⟨compound tail⟩
⟨compound tail⟩      ::= ⟨statement⟩ end | ⟨statement⟩ ; ⟨compound tail⟩
⟨statement⟩          ::= ⟨unconditional statement⟩
                       | ⟨conditional statement⟩
                       | ⟨for statement⟩
```

And the ALGOL 60 hello-world equivalent (there was no string I/O in the standard; integer output is assumed available):

```algol
begin integer i; for i := 1 step 1 until 10 do outinteger(i) end
```

A parser following the grammar above will produce a parse tree with the outer `⟨program⟩` → `⟨compound statement⟩` → `⟨unlabelled compound⟩` → `begin` `⟨compound tail⟩` `end`, then descend into a `⟨block head⟩` for the declaration and a `⟨statement⟩` for the `for` loop. The parse is mechanical once the grammar is in hand; without the grammar, the same program is only an informal pattern you match by reading a manual.

This is what Backus and Naur gave the world. Not a language — ALGOL 60 never became popular outside Europe and mostly-academic American circles — but a method: define your language as a grammar, write the grammar down, and your readers will agree on what the language is. Every language since that has taken itself seriously has followed this method. The method has a name, and the name is Backus-Naur Form.

---

*End of document.*
