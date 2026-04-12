# Lisp: Language Core and Metaprogramming

> "Lisp is worth learning for the profound enlightenment experience you will have when you finally get it. That experience will make you a better programmer for the rest of your days, even if you never actually use Lisp itself." — Eric S. Raymond

Lisp is the oldest high-level programming language still in widespread use. It is also the birthplace of nearly every idea modern programmers take for granted: garbage collection, first-class functions, dynamic typing, interactive development, symbolic computation, conditionals, recursion as a primary control structure, the read-eval-print loop, tree-shaped data, and — most importantly for this document — the notion that a program is a data structure that other programs can read, inspect, rewrite, and execute.

This document treats Lisp not as "one of several languages" but as the genetic ancestor of the entire meta-language family. When somebody says "DSL," "macro," "fluent API," "template," "decorator," "annotation processor," "code generator," or "AI tool use via structured data," they are describing something Lisp handled natively in 1960.

We will go deep on the pieces that matter: S-expressions, the lambda calculus embedded in Lisp, the meta-circular evaluator (the twenty-line interpreter that bootstraps an entire language), macros in every flavor from defmacro to hygienic syntax-rules to Clojure's syntax-quote, CLOS (the most powerful object system ever designed), Common Lisp's numeric tower and condition system, the REPL culture, and the continuations that power everything from generators to effect systems.

This is a reference document. Read it once for the ideas; come back to it when you are building your own Lisp, which — if you follow the path — you will eventually do.

---

## 1. S-expressions and Homoiconicity

### 1.1 The atom and the cons cell

Lisp has two building blocks. That is not an exaggeration.

1. **Atoms** — symbols, numbers, strings, characters, the empty list `nil`, and a few other self-contained values.
2. **Cons cells** — pairs of two things. Written `(a . b)` where `a` is the *car* and `b` is the *cdr*.

From the cons cell you build the list. A list is a chain of cons cells where each `cdr` points to the next cell, and the final `cdr` is `nil`.

```lisp
(cons 1 (cons 2 (cons 3 nil)))   ; => (1 2 3)
(1 . (2 . (3 . nil)))            ; same thing, dotted notation
(1 2 3)                          ; same thing, sugar
```

The list `(1 2 3)` is not a primitive. It is three cons cells chained together, terminated by `nil`. You can tell when somebody really understands Lisp: they stop seeing lists and start seeing cons cells.

A *dotted pair* is a cons cell whose `cdr` is not another cons cell:

```lisp
(cons 1 2)          ; => (1 . 2)
(car '(1 . 2))      ; => 1
(cdr '(1 . 2))      ; => 2
```

This is not a list. It is literally a pair. Lists are a special case of cons-cell chains.

The primitive functions are:

- `cons` — build a pair
- `car` — first of a pair
- `cdr` — second of a pair (pronounced "cudder," from "contents of the decrement register" — a 1959 IBM 704 implementation detail that stuck)
- `null?` — is this nil?
- `eq?` — are these the same object?
- `atom?` — is this an atom (i.e., not a cons cell)?

Given those six primitives plus `lambda`, `quote`, and `cond`, you have a complete programming language. McCarthy proved this in 1960.

### 1.2 The S-expression as universal data structure

An **S-expression** (for "symbolic expression") is recursively defined:

```
sexp ::= atom | (sexp . sexp)
```

An S-expression is either an atom or a cons cell of two S-expressions. That's it. Every Lisp program, every Lisp data structure, every Lisp configuration file, every Lisp AST node is an S-expression. There is no distinction between "source code format" and "data format" and "serialization format" — they are all the same thing.

Compare to the modern world. We have:

- Source code in some language (Python, JavaScript, Rust)
- ASTs in a completely different format (tree of classes with visitor patterns)
- Configuration in YAML, JSON, TOML, INI
- IPC in Protobuf, MessagePack, Thrift, Cap'n Proto
- Query languages in SQL, GraphQL, LINQ
- Build systems in Makefile, Bazel BUILD files, CMake syntax
- Templates in Jinja, ERB, Handlebars

Every one of these is an attempt to reinvent S-expressions badly. Every parser built for each of these is a re-invention of what `read` does for free in Lisp.

### 1.3 QUOTE: the dark room of Lisp

The single most important primitive in Lisp is `quote`. Understanding `quote` is the difference between programming in Lisp and programming in a language that happens to use parentheses.

When you type this in a Lisp REPL:

```lisp
(+ 1 2)
```

The **reader** parses that text into a data structure: a list of three elements, the symbol `+`, the number `1`, and the number `2`. The **evaluator** then looks at that list, sees that `+` is a function, evaluates the arguments, and calls the function. The result is `3`.

But what if you want the *list itself*, not the result of evaluating it? You quote it:

```lisp
(quote (+ 1 2))    ; => (+ 1 2) — a three-element list
'(+ 1 2)           ; same, with reader sugar
```

Quote means "don't evaluate this — give me the data structure the reader built." Everything to the right of the quote is frozen as data.

This is the dark room. When you enter a quoted expression, no evaluation happens. The code becomes data. And that data is a list you can manipulate with `car`, `cdr`, `cons`, `map`, and every other list function.

```lisp
(car '(+ 1 2))     ; => +          (the symbol, not a function call)
(cdr '(+ 1 2))     ; => (1 2)
(length '(+ 1 2))  ; => 3
```

Quote is the wormhole between the two worlds Lisp lives in: **code** (what the evaluator sees) and **data** (what cons cells actually contain). Quote takes you from code to data. `eval` takes you back.

```lisp
(eval '(+ 1 2))    ; => 3
```

You can build a program as data and then run it:

```lisp
(let ((op '+)
      (args '(1 2)))
  (eval (cons op args)))   ; => 3
```

This is the ground floor of metaprogramming.

### 1.4 Homoiconicity defined

A language is **homoiconic** if its source code representation is a primary data structure of the language itself. Lisp is the original homoiconic language. Program text = list data = AST.

Most languages have ASTs. That is not the same thing. In Python, the AST is a separate library (`ast`) that produces objects of classes like `ast.BinOp` that are entirely different from the runtime values (int, list, dict). The AST is a reflection of the code, not the code itself.

In Lisp, there is no separate AST. The reader produces a cons-cell tree. That tree IS the AST. That tree IS also regular data you can cons onto, map over, filter, and pattern-match. The evaluator just walks it.

The consequence: you write programs that write programs using the same tools you use to write programs that manipulate lists. `cons`, `car`, `cdr`, `map`, `filter`, `reduce` — these work on ASTs because ASTs are lists.

Every time you see a modern framework reach for string templating, code generation scripts, macro preprocessors, plugin systems, annotation processors, reflection, or dynamic bytecode emission, you are watching a non-homoiconic language strain to do what Lisp does as a side effect of its data model.

### 1.5 Reader, evaluator, printer

The canonical Lisp pipeline has three stages:

```
text  →  [READER]  →  data  →  [EVALUATOR]  →  value  →  [PRINTER]  →  text
```

The **reader** is a parser that consumes characters and produces cons cells, symbols, and numbers. It is usually exposed as the function `read`.

The **evaluator** takes data (produced by the reader) and reduces it to a value according to the evaluation rules. It is usually exposed as `eval`.

The **printer** takes a value and produces text. It is usually exposed as `print` or `write`.

A REPL is literally:

```lisp
(loop (print (eval (read))))
```

Read, Eval, Print, Loop. The acronym is the implementation. Every piece is an ordinary function you can call, override, replace, or compose.

```lisp
(read (open-input-string "(+ 1 2)"))   ; => (+ 1 2) — a list
(eval '(+ 1 2))                         ; => 3
(write-to-string '(+ 1 2))              ; => "(+ 1 2)"
```

This means you can write a program that reads a Lisp program, transforms it, and evaluates the transformed version — which is the definition of a macro, a compiler, an optimizer, and a partial evaluator.

### 1.6 Self-evaluating, quoted, and evaluated forms

An expression in Lisp falls into one of three categories when handed to the evaluator:

**Self-evaluating forms** — they return themselves. Numbers, strings, booleans, characters, keywords.

```lisp
42         ; => 42
"hello"    ; => "hello"
#t         ; => #t    (true in Scheme)
t          ; => t     (true in Common Lisp)
:name      ; => :name (a keyword)
```

**Quoted forms** — `(quote x)` returns `x` without evaluating it. The reader converts `'x` into `(quote x)`.

```lisp
'hello          ; => hello    (the symbol hello, not its value)
'(1 2 3)        ; => (1 2 3)  (a literal three-element list)
'()             ; => ()       (the empty list)
```

**Evaluated forms** — a list whose first element is a function or special form. The evaluator recursively evaluates the arguments (unless the first element is a special form) and then calls the function or executes the special form.

```lisp
(+ 1 2)            ; => 3
(list 'a 'b 'c)    ; => (a b c)
(if #t 1 2)        ; => 1
```

Symbols by themselves (unquoted) are looked up in the environment and return their value:

```lisp
(define x 10)
x          ; => 10
'x         ; => x (the symbol, not its value)
```

### 1.7 Why XML, JSON, YAML, TOML are failed S-expressions

XML: `<foo attr="value"><bar>baz</bar></foo>` is a tree of nodes. It has two kinds of children (attributes and elements), mandatory closing tags, text vs element distinction, and a schema language (XSD) grafted on.

In Lisp: `(foo (@ (attr "value")) (bar "baz"))`. Or more commonly: `(foo :attr "value" (bar "baz"))`. The structure is the same. The semantics are clearer. And you can manipulate it with `car` and `cdr`.

JSON: `{"foo": {"bar": [1, 2, 3]}}`. A tree. In Lisp: `((foo . ((bar . (1 2 3)))))` or with a cleaner convention `(:foo (:bar 1 2 3))`. JSON has five types (object, array, string, number, bool/null). Lisp has the cons cell and gives you arbitrarily complex data with no schema.

YAML: an attempt to make JSON human-readable by stealing significant whitespace from Python. Famously ambiguous (`NO` parses as `false`), famously slow to parse, famously fragile when you forget a space. All of its complexity exists to avoid typing parentheses.

TOML: an attempt to replace YAML by going back toward INI. Also a tree, also reinvents the wheel, also needs a separate parser.

Every one of these formats needs:

1. A separate parser (YAML parsers are often the largest dependency in a project)
2. A separate serializer
3. A separate schema/validation layer
4. A separate tree-walking API
5. A separate template language if you want computed values
6. A separate way to reference another node

In Lisp, all six of those problems dissolve. `read` parses. `write` serializes. A predicate function validates. `car`/`cdr`/`map` walk the tree. Quasiquote computes values. Symbols reference other nodes. And you don't need a new language to do any of it.

### 1.8 M-expressions: the surface syntax that never was

When McCarthy designed Lisp in 1958, he envisioned two syntaxes:

- **S-expressions** (symbolic) — the data representation
- **M-expressions** (meta) — a more conventional surface syntax for writing programs

M-expressions looked like this:

```
car[cons[A; B]] = A
```

Roughly: function name, square brackets, arguments separated by semicolons. The intent was for programmers to write M-expressions and have them compiled to S-expressions for the interpreter to process.

M-expressions were never implemented. Steve Russell wrote the first Lisp interpreter in 1959 using S-expressions directly, and — critically — programmers realized that S-expressions *were* a perfectly good surface syntax, and that the uniformity of having code-as-data was a feature, not a bug. Macros became possible. Lisp's superpower was born accidentally.

Every few decades somebody tries to reintroduce an M-expression-like skin over Lisp: Dylan, Sweet Expressions, Wisp, Honu. None stick. The lesson is that once you have lived with `(f x y)` for a few months you realize the parentheses are not the friction — they are the steering wheel.

### 1.9 Reader macros: extending the parser

The Lisp reader is not a fixed grammar. You can hook into it and teach it new syntax. These hooks are called **reader macros**, and they are the lowest-level form of metaprogramming Lisp offers.

Reader macros are dispatched on a character. When the reader encounters that character, it calls your function, and whatever your function returns becomes the result of reading that expression.

Common Lisp's `'` (single quote) is a reader macro. It expands `'x` to `(quote x)`. That sugar is a reader macro that any user could have written:

```lisp
(set-macro-character #\'
  (lambda (stream char)
    (declare (ignore char))
    (list 'quote (read stream t nil t))))
```

Common Lisp's backquote is a reader macro. `#(...)` for vectors is a reader macro. `#'fn` for function references is a reader macro. `"string"` is effectively a reader macro.

You can define your own. Want infix math? Write a reader macro. Want SQL-like syntax? Write a reader macro. Want JSON-compatible syntax? Write a reader macro. Racket takes this to the logical extreme with `#lang` directives that let an entire file use a completely different syntax while still compiling to Racket's core language.

---

## 2. The Lambda Calculus in Lisp

### 2.1 Lambda is the universal function constructor

Alonzo Church invented the lambda calculus in the 1930s as a formal system for computation, equivalent to Turing machines but expressed entirely in terms of function abstraction and application. Lisp embeds the lambda calculus almost directly.

```lisp
(lambda (x) (* x x))     ; a function that squares its argument
```

This is an anonymous function. It has a parameter list `(x)` and a body `(* x x)`. You can call it immediately:

```lisp
((lambda (x) (* x x)) 5)     ; => 25
```

Or bind it to a name:

```lisp
(define square (lambda (x) (* x x)))
(square 5)                    ; => 25
```

In fact, `(define (square x) (* x x))` is just sugar for the lambda form. The lambda is the primitive; named functions are lambdas with a label.

### 2.2 Free variables, bound variables, alpha-conversion

In `(lambda (x) (* x y))`, the variable `x` is **bound** — it is a parameter of the lambda. The variable `y` is **free** — it is not bound inside the lambda and must be found in an enclosing scope.

Alpha-conversion is the rule that says you can rename bound variables without changing meaning. `(lambda (x) (* x y))` and `(lambda (z) (* z y))` are the same function. You cannot rename free variables, because they refer to something outside the lambda.

```lisp
(define y 10)
(define f (lambda (x) (* x y)))     ; y is free, refers to the outer y
(f 3)                                ; => 30
```

The free variable `y` is captured from the lexical environment where the lambda is defined. This is the *closure*, and it is the single most important feature Lisp gave to the mainstream.

### 2.3 Beta reduction, eta reduction

**Beta reduction** is what happens when you apply a function. You substitute the argument for the parameter in the body:

```
((lambda (x) (+ x 1)) 5)
=>  (+ 5 1)         ; beta reduce: substitute 5 for x
=>  6               ; evaluate
```

**Eta reduction** is the rule that says `(lambda (x) (f x))` and `f` are equivalent when `f` does not depend on `x` being bound. Eta-converting is the functional-programming name for removing a redundant wrapper:

```lisp
(lambda (x) (print x))   ; equivalent to...
print                     ; ...just print
```

These rules come from the lambda calculus and govern how Lisp's evaluator rewrites expressions.

### 2.4 Church encoding: everything from lambdas

Church showed that you don't need booleans, numbers, pairs, or lists as primitives. You can encode them all with lambdas.

**Booleans**: True is "take the first thing." False is "take the second thing."

```lisp
(define church-true  (lambda (a b) a))
(define church-false (lambda (a b) b))
(define church-if    (lambda (c t f) (c t f)))

(church-if church-true 'yes 'no)    ; => yes
(church-if church-false 'yes 'no)   ; => no
```

**Numerals**: `n` is "apply f n times to x."

```lisp
(define church-zero  (lambda (f x) x))
(define church-one   (lambda (f x) (f x)))
(define church-two   (lambda (f x) (f (f x))))
(define church-three (lambda (f x) (f (f (f x)))))

(define church->int
  (lambda (n) (n (lambda (x) (+ x 1)) 0)))

(church->int church-three)          ; => 3
```

**Successor**: add one more application.

```lisp
(define church-succ
  (lambda (n) (lambda (f x) (f (n f x)))))

(church->int (church-succ church-two))   ; => 3
```

**Pairs**: a pair is a function that takes a selector.

```lisp
(define church-pair
  (lambda (a b) (lambda (selector) (selector a b))))
(define church-first  (lambda (p) (p (lambda (a b) a))))
(define church-second (lambda (p) (p (lambda (a b) b))))

(define p (church-pair 'hello 'world))
(church-first p)    ; => hello
(church-second p)   ; => world
```

**Lists** follow from pairs. This is the point: given only `lambda`, you can build every data structure and every control flow construct. Lisp's primitives (`cons`, `if`, numbers) are conveniences, not necessities.

### 2.5 The Y combinator

How do you write a recursive function without giving it a name? The function needs to reference itself, but if it's anonymous, there's nothing to reference. The solution is the **fixed-point combinator**. The most famous is the Y combinator:

```lisp
(define Y
  (lambda (f)
    ((lambda (x) (f (lambda (v) ((x x) v))))
     (lambda (x) (f (lambda (v) ((x x) v)))))))
```

The Y combinator takes a function `f` that expects its "self" as an argument, and returns a version that recurses properly:

```lisp
(define factorial
  (Y (lambda (fact)
       (lambda (n)
         (if (= n 0)
             1
             (* n (fact (- n 1))))))))

(factorial 5)    ; => 120
```

Notice there is no `define` inside the lambda. The function has no name. Y manufactures self-reference out of pure lambda applications.

The derivation of Y is a rite of passage for every functional programmer. Start with:

```lisp
;; We want: (f f) to call itself
;; Attempt 1: self-application
((lambda (x) (x x)) (lambda (x) (x x)))   ; infinite loop, Omega combinator
```

Then abstract the recursive step, thread it through, eta-expand to delay evaluation in a strict language, and you arrive at Y. The full derivation takes about three pages and is covered in *The Little Schemer*, which teaches it in the most accessible way any textbook ever has.

### 2.6 Closures: the environment model

A closure is a function packaged with the environment in which it was defined. When a lambda references a free variable, the closure remembers where that variable lives and what it was bound to.

```lisp
(define (make-adder n)
  (lambda (x) (+ x n)))

(define add5 (make-adder 5))
(define add10 (make-adder 10))

(add5 3)     ; => 8
(add10 3)    ; => 13
```

`make-adder` returns a lambda that captures `n`. Each call to `make-adder` creates a new environment with its own `n`. The returned lambda closes over that environment. Even after `make-adder` returns, the environment persists as long as something references the closure.

Closures are the reason Lisp has objects for free. An object is just a closure over some state with a dispatcher:

```lisp
(define (make-counter)
  (let ((count 0))
    (lambda (msg)
      (case msg
        ((inc) (set! count (+ count 1)))
        ((dec) (set! count (- count 1)))
        ((get) count)))))

(define c (make-counter))
(c 'inc) (c 'inc) (c 'inc) (c 'dec)
(c 'get)    ; => 2
```

The `count` variable is entirely private. Only the closure has access. This is encapsulation without a class system.

### 2.7 First-class functions and higher-order programming

Lisp treats functions as values. You can pass them as arguments, return them from other functions, store them in variables or data structures, and compare them for identity. This is what "first-class functions" means, and Lisp had it in 1960.

```lisp
(define (compose f g)
  (lambda (x) (f (g x))))

(define inc (lambda (x) (+ x 1)))
(define double (lambda (x) (* x 2)))

(define double-then-inc (compose inc double))
(double-then-inc 5)   ; => 11
```

### 2.8 map, filter, reduce: the functional toolbox

These three higher-order functions dominate functional programming. Lisp had them first.

```lisp
(map (lambda (x) (* x x)) '(1 2 3 4 5))
;; => (1 4 9 16 25)

(filter odd? '(1 2 3 4 5 6))
;; => (1 3 5)

(reduce + 0 '(1 2 3 4 5))
;; => 15
```

`reduce` is sometimes called `fold`. There are two variants:

- `foldl` (fold left): combines from the left. `(foldl - 0 '(1 2 3))` = `(((0-1)-2)-3)` = `-6`
- `foldr` (fold right): combines from the right. `(foldr - 0 '(1 2 3))` = `(1-(2-(3-0)))` = `2`

Fold-right is elegant because it preserves list structure:

```lisp
(define (my-map f lst)
  (foldr (lambda (x acc) (cons (f x) acc)) '() lst))
```

Fold-left is efficient because it is tail-recursive:

```lisp
(define (sum lst)
  (foldl + 0 lst))    ; constant stack space
```

The entire map/filter/reduce toolbox reduces to `foldr` in theory; in practice you use whichever combinator makes your intent clearest.

### 2.9 Tail call optimization

A tail call is a function call in **tail position** — the last thing a function does before returning. In a language with tail-call optimization (TCO), the compiler reuses the current stack frame for the tail call instead of pushing a new one. This means recursion can be used for iteration without blowing the stack.

Scheme mandates TCO in the language spec. Common Lisp doesn't, but all serious implementations provide it. Clojure, running on the JVM, can't guarantee TCO but provides `recur` as an explicit tail call.

```lisp
;; NOT tail-recursive — `*` happens after the recursive call
(define (fact n)
  (if (= n 0) 1 (* n (fact (- n 1)))))

;; Tail-recursive — recursive call is the last thing
(define (fact n)
  (define (loop i acc)
    (if (= i 0) acc (loop (- i 1) (* i acc))))
  (loop n 1))
```

In Scheme, the second version uses constant stack space regardless of `n`. Without TCO, it would be O(n) stack — and for large `n`, it would crash.

TCO is not an optimization in the trivial sense. It is the thing that makes functional iteration possible. Without it, you are forced back to imperative loops. With it, you can write any iteration as a recursive function and rely on the compiler.

### 2.10 call/cc and continuations

Scheme's `call-with-current-continuation` (abbreviated `call/cc`) captures "the rest of the computation" as a first-class function. We will come back to this in Section 8, but it is worth noting here that continuations are a direct extension of the lambda calculus. In continuation-passing style (CPS), every function takes an extra argument — the "what to do next" — and instead of returning, calls that continuation with its result.

```lisp
;; Direct style
(define (add a b) (+ a b))

;; CPS
(define (add-cps a b k) (k (+ a b)))

(add-cps 3 4 (lambda (result) (display result)))
```

Every Lisp (and every language with a compiler) can be rewritten in CPS. The lambda calculus is that flexible.

---

## 3. The Meta-Circular Evaluator

### 3.1 The 1960 paper

In April 1960, John McCarthy published "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I." The paper introduced:

- S-expressions
- Conditional expressions
- Recursive function definitions
- `eval` — a function that takes a Lisp expression (as data) and returns its value

The bombshell was the last one. McCarthy defined `eval` in Lisp itself. An interpreter for the language, written in the language. A twenty-something lines of code. A perfectly recursive definition. Steve Russell read it, realized it could be implemented, and wrote the first actual Lisp interpreter. The rest is history.

This is the **meta-circular evaluator**: a Lisp interpreter written in Lisp. The name "meta-circular" comes from the fact that the language being interpreted and the language doing the interpreting are the same language. The interpreter's recursion mirrors the interpreter's own recursion in the host. It's self-describing.

### 3.2 eval and apply, mutually recursive

The architecture is two mutually recursive functions:

- **`eval`** takes an expression and an environment and returns a value.
- **`apply`** takes a procedure and a list of argument values and returns a value.

`eval` dispatches on the type of expression. If it's a number or string, return it. If it's a symbol, look it up in the environment. If it's a special form (`if`, `quote`, `lambda`, `define`), handle it specially. Otherwise, it's a function call: `eval` each argument, then `apply` the function to the results.

`apply` dispatches on the type of procedure. If it's a built-in primitive, call it. If it's a lambda, extend the environment with the parameter bindings and `eval` the body in that extended environment.

The recursion bottoms out on primitives (for `apply`) and atoms (for `eval`). Everything else is handled by the mutual recursion.

### 3.3 A minimal meta-circular evaluator

Here is a meta-circular Scheme evaluator in under 50 lines. It handles numbers, symbols, lambdas, function application, if, quote, and define.

```lisp
(define (meval exp env)
  (cond
    ((number? exp) exp)                                  ; self-evaluating
    ((string? exp) exp)                                  ; self-evaluating
    ((symbol? exp) (lookup exp env))                     ; variable
    ((eq? (car exp) 'quote) (cadr exp))                  ; quoted form
    ((eq? (car exp) 'if)                                 ; if
     (if (meval (cadr exp) env)
         (meval (caddr exp) env)
         (meval (cadddr exp) env)))
    ((eq? (car exp) 'lambda)                             ; lambda
     (list 'closure (cadr exp) (cddr exp) env))
    ((eq? (car exp) 'define)                             ; define
     (extend-env! (cadr exp) (meval (caddr exp) env) env))
    (else                                                ; application
     (mapply (meval (car exp) env)
             (map (lambda (e) (meval e env)) (cdr exp))))))

(define (mapply proc args)
  (cond
    ((procedure? proc) (apply proc args))                ; host primitive
    ((eq? (car proc) 'closure)
     (let ((params (cadr proc))
           (body   (caddr proc))
           (env    (cadddr proc)))
       (meval-seq body (extend-env params args env))))
    (else (error "unknown procedure" proc))))

(define (meval-seq exps env)
  (if (null? (cdr exps))
      (meval (car exps) env)
      (begin (meval (car exps) env)
             (meval-seq (cdr exps) env))))

(define (lookup sym env)
  (cond ((null? env) (error "unbound" sym))
        ((assq sym (car env)) => cdr)
        (else (lookup sym (cdr env)))))

(define (extend-env params args env)
  (cons (map cons params args) env))

(define (extend-env! sym val env)
  (set-car! env (cons (cons sym val) (car env))))

(define (initial-env)
  (list (list (cons '+ +) (cons '- -) (cons '* *) (cons '/ /)
              (cons '= =) (cons '< <) (cons '> >)
              (cons 'cons cons) (cons 'car car) (cons 'cdr cdr)
              (cons 'null? null?) (cons 'eq? eq?))))
```

You can now evaluate Lisp programs inside Lisp:

```lisp
(meval '((lambda (x) (* x x)) 5) (initial-env))   ; => 25
(meval '(if (= 1 2) 'a 'b) (initial-env))         ; => b
```

This is not a toy. You have just written a Lisp interpreter in Lisp. In 40 lines. The moment you internalize this is the moment everything changes.

### 3.4 Special forms vs function calls

In the evaluator above, notice that `quote`, `if`, `lambda`, and `define` are handled specially — they are not evaluated as function calls. This is because they have non-standard evaluation rules:

- `quote` must NOT evaluate its argument — it returns it as-is.
- `if` must evaluate the condition first, then evaluate only one branch.
- `lambda` must NOT evaluate its body — it packages it up as a closure.
- `define` introduces a new binding into the environment.

Everything else is a function call. Function calls have uniform semantics: evaluate all arguments, then call the function. Special forms break this uniformity, which is why they need to be recognized before the normal dispatch.

In Lisp terminology, things that look like function calls but aren't are called **special forms**. Macros (Section 4) let you define your own special forms without hacking the evaluator.

### 3.5 Environment representations

The environment is how variables get their values. There are two common representations:

**Association list (a-list)**: a list of `(name . value)` pairs. Extending the environment means consing a new pair on the front. Lookup walks the list.

```lisp
'((x . 1) (y . 2) (z . 3))
```

Simple but O(n) lookup. Good for teaching.

**Frame chain**: a list of frames, where each frame is an a-list (or a hash table) representing a lexical scope. Extending a scope means adding to the current frame. Entering a nested scope means pushing a new frame. Lookup walks the frames from innermost to outermost.

```lisp
'(((x . 1)) ((y . 2) (z . 3)))
;; two frames: inner has x, outer has y and z
```

Real Lisp implementations use frame chains because they correctly model lexical scope. Each lambda captures the current frame chain as part of its closure. When you call the lambda, you push a new frame containing the parameter bindings onto that chain.

### 3.6 The shock of fitting on one page

The meta-circular evaluator is almost always a personal watershed. You write it, you test it, it works, and then you realize: this entire thing — the whole language, dispatch, closures, environments, recursion — fits on one page.

Alan Kay, looking at a simple Lisp meta-circular evaluator once, said:

> "Yes, that was the big revelation to me when I was in graduate school — when I finally understood that the half page of code on the bottom of page 13 of the Lisp 1.5 manual was Lisp in itself. These were 'Maxwell's Equations of Software!' This is the whole world of programming in a few lines that I can put my hand over."

That is the feeling. The language is small enough to understand completely. You can hold it in your head. Once you have that feeling, you never look at another language the same way.

### 3.7 Why every Lisper has written their own Lisp

Because it is possible, and because doing it teaches you more about programming languages in a weekend than a whole semester of compiler class.

Writing your own Lisp becomes a rite of passage. There are dozens of educational Lisps:

- Peter Norvig's "Lispy" (lis.py) — a Scheme interpreter in 117 lines of Python
- Anders Hejlsberg's first job was reportedly writing a Pascal compiler, but every Lisp-flavored hacker writes an interpreter, not a compiler, and the distinction teaches you what's essential
- Build Your Own Lisp by Daniel Holden (in C, with a custom parser combinator)
- mal (Make A Lisp) by Joel Martin — a step-by-step guide to building a Clojure-flavored Lisp in any language, with 80+ language ports

After you write your first Lisp, you understand: what a variable is, how scope works, what a closure really is, why tail calls matter, what makes something a "special form," how macros work, what an environment is, and why eval is just a function.

### 3.8 The meta-circular evaluator as pedagogical tool

The meta-circular evaluator is the centerpiece of several landmark textbooks.

**SICP** (*Structure and Interpretation of Computer Programs*) by Abelson and Sussman uses it as Chapter 4's main project. They build an evaluator, then extend it with lazy evaluation, non-deterministic choice, logic programming, streams, and a register-machine implementation. The book is widely considered the best introduction to programming ever written. MIT used it as 6.001 for decades.

**PLAI** (*Programming Languages: Application and Interpretation*) by Shriram Krishnamurthi takes a step-by-step approach, building dozens of tiny interpreters that each add one feature. You start with arithmetic, add identifiers, add functions, add closures, add mutation, add continuations, add types. Each interpreter is small, testable, and teaches one concept clearly.

**EoPL** (*Essentials of Programming Languages*) by Friedman, Wand, and Haynes is the most formal of the three. It covers denotational semantics, explicit vs implicit environments, register machines, and compilers-by-transformation. It is the deep well if you want to go further.

### 3.9 Futamura projections: compilers from interpreters

Yoshihiko Futamura, in 1971, observed something extraordinary. If you have an interpreter for language L written in language H, and you have a **partial evaluator** (a program that specializes another program with respect to some of its inputs), then:

- **First Futamura projection**: Partially evaluate the interpreter with respect to a specific source program. The result is a compiled version of that program in H.
- **Second Futamura projection**: Partially evaluate the partial evaluator with respect to the interpreter. The result is a compiler from L to H.
- **Third Futamura projection**: Partially evaluate the partial evaluator with respect to itself. The result is a *compiler generator* — a program that takes an interpreter and produces a compiler.

This is not an abstraction. It works. The Futamura projections have been implemented in several partial evaluation systems (e.g., PyPy's tracing JIT effectively implements the first and second projections for Python).

The punchline: **a compiler is an interpreter that has been specialized away.** Every language with a meta-circular evaluator is implicitly a compiler too, once you add partial evaluation. This is the theoretical foundation for why interpreters and compilers are not really different things.

---

## 4. Macros — The Power and the Danger

This is the heart of the document. Lisp's macros are what make it meta. If you take nothing else away from this document, take this: **a Lisp macro is a function from code to code that runs at compile time.** Everything else is commentary.

### 4.1 What a macro is

When you call a function, the arguments are evaluated first, then passed to the function. When you call a macro, the arguments are *not* evaluated — they are passed as *unevaluated code*. The macro returns new code. That new code is then compiled and run in place of the original macro call.

Compare:

```lisp
(define (my-func x) (list 'got x))
(my-func (+ 1 2))
;; x is bound to the value 3
;; returns (got 3)

(defmacro my-macro (x) (list 'quote (list 'got x)))
(my-macro (+ 1 2))
;; x is bound to the unevaluated code (+ 1 2)
;; expands to '(got (+ 1 2))
;; returns (got (+ 1 2))
```

A function sees values. A macro sees code. A function returns a value at runtime. A macro returns code at compile time, and that code is then used in place of the macro call.

### 4.2 defmacro

In Common Lisp, you define a macro with `defmacro`:

```lisp
(defmacro when (condition &body body)
  `(if ,condition (progn ,@body)))
```

This defines `when` — a conditional that runs a body if the condition is true, with no else clause. The backtick, comma, and comma-at are *quasiquote* syntax, which we'll cover in the next section.

Now:

```lisp
(when (> x 0)
  (print "positive")
  (print x))

;; expands to:
(if (> x 0)
    (progn (print "positive") (print x)))
```

That expansion happens at compile time, once, when the compiler processes the source file. At runtime there is no `when` — only the `if` it expanded to. There is zero overhead.

### 4.3 Quasiquote, unquote, unquote-splicing

Writing macros that build code by hand gets tedious:

```lisp
(defmacro when (condition &body body)
  (list 'if condition (cons 'progn body)))
```

Quasiquote (backtick) is a smarter quote. It acts like quote by default, but inside a quasiquoted form you can **unquote** (with comma) to insert a computed value, and **unquote-splice** (with comma-at) to insert a list as multiple elements.

```lisp
`(a b c)                      ; => (a b c)         same as '(a b c)
`(a ,(+ 1 2) c)               ; => (a 3 c)         comma evaluates
`(a ,@(list 1 2 3) c)         ; => (a 1 2 3 c)    comma-at splices
```

Now the `when` macro becomes natural:

```lisp
(defmacro when (condition &body body)
  `(if ,condition (progn ,@body)))
```

Read that slowly. We are constructing a piece of code. The template is `(if ,condition (progn ,@body))`. Backtick quotes the whole thing as a list. Comma says "evaluate `condition` here and insert the result." Comma-at says "evaluate `body` (which is a list) and splice its elements in here."

Quasiquote is the macro writer's best friend. Without it, macros would be an unreadable soup of `cons`, `list`, and `append`. With it, macros look almost exactly like the code they produce.

### 4.4 Simple examples

**unless** — opposite of when:

```lisp
(defmacro unless (condition &body body)
  `(if (not ,condition) (progn ,@body)))
```

**swap** — exchanges the values of two variables. Cannot be a function because we need to assign to the *names*, not the *values*:

```lisp
(defmacro swap (a b)
  `(let ((tmp ,a))
     (setf ,a ,b)
     (setf ,b tmp)))

(let ((x 1) (y 2))
  (swap x y)
  (list x y))    ; => (2 1)
```

**with-open-file** — resource management. Opens a file, runs a body, guarantees the file is closed even if an error occurs:

```lisp
(defmacro with-open-file ((var path) &body body)
  `(let ((,var (open ,path)))
     (unwind-protect
          (progn ,@body)
       (close ,var))))

(with-open-file (f "data.txt")
  (read-line f))
```

The pattern "acquire, use, release" cannot be expressed as a plain function in most languages. Python needs `with`. C++ needs RAII. Java needs try-with-resources. Rust needs `Drop`. Common Lisp needs... a three-line macro.

### 4.5 Control-flow macros

Almost everything you think of as "built-in" in other languages is a macro in Lisp.

**dotimes** — integer iteration:

```lisp
(defmacro dotimes ((var limit) &body body)
  `(do ((,var 0 (+ ,var 1)))
       ((>= ,var ,limit))
     ,@body))

(dotimes (i 5) (print i))
```

**dolist** — iterate over a list:

```lisp
(defmacro dolist ((var lst) &body body)
  `(let ((tmp ,lst))
     (while tmp
       (let ((,var (car tmp)))
         ,@body
         (setf tmp (cdr tmp))))))
```

**while** — probably not built in, define it yourself:

```lisp
(defmacro while (condition &body body)
  `(do () ((not ,condition)) ,@body))
```

**cond** — multi-branch conditional. In a truly minimal Lisp, `cond` is a macro over `if`:

```lisp
(defmacro cond (&rest clauses)
  (if (null clauses)
      nil
      (let ((first-clause (car clauses))
            (rest-clauses (cdr clauses)))
        `(if ,(car first-clause)
             (progn ,@(cdr first-clause))
             (cond ,@rest-clauses)))))
```

Notice this is a recursive macro. It expands into nested `if`s. Each clause becomes one level of nesting.

### 4.6 Binding macros

**let** — parallel binding:

```lisp
(defmacro let (bindings &body body)
  `((lambda ,(mapcar #'car bindings) ,@body)
    ,@(mapcar #'cadr bindings)))

(let ((x 1) (y 2)) (+ x y))
;; expands to:
;; ((lambda (x y) (+ x y)) 1 2)
```

**let\*** — sequential binding (each binding can see the previous):

```lisp
(defmacro let* (bindings &body body)
  (if (null bindings)
      `(progn ,@body)
      `(let (,(car bindings))
         (let* ,(cdr bindings) ,@body))))
```

**letrec** — recursive binding (each binding can see all of them, including itself):

```lisp
;; Scheme's letrec, rough sketch
(define-syntax letrec
  (syntax-rules ()
    ((_ ((name val) ...) body ...)
     (let ((name #f) ...)
       (set! name val) ...
       body ...))))
```

Every binding construct in every language is a macro you can write. Let this sink in. In most languages, `let` would be a committee decision, a parser change, a compiler feature, a breaking change to the language standard. In Lisp it is a ten-line macro.

### 4.7 DSL creation

A **domain-specific language** is a small language tailored to a specific problem. Lisp makes DSLs trivial because macros let you bolt new syntax onto the language without changing the parser or the compiler.

Here is an HTML generator DSL:

```lisp
(defmacro html (&body body)
  `(with-output-to-string (*standard-output*)
     ,@(mapcar #'html-form body)))

(defun html-form (form)
  (cond ((stringp form) `(princ ,form))
        ((atom form) `(princ ,form))
        (t (let ((tag (car form))
                 (contents (cdr form)))
             `(progn
                (format t "<~a>" ',tag)
                ,@(mapcar #'html-form contents)
                (format t "</~a>" ',tag))))))

(html
  (html (head (title "Hi"))
        (body (h1 "Welcome")
              (p "Hello, world."))))
```

Or a SQL DSL:

```lisp
(select (name age) from users where (and (> age 18) (= active t)))
;; expands to:
;; "SELECT name, age FROM users WHERE age > 18 AND active = true"
```

Or a state machine DSL, a build system DSL, a routing DSL for a web framework, a matcher DSL for logs, a parser combinator DSL, a test assertion DSL. Lisp programmers build DSLs the way Python programmers build functions — it is the default tool.

### 4.8 Code walking

A **code walker** is a function that traverses a Lisp expression and transforms parts of it. Macros often need to walk their body to find particular forms and rewrite them.

```lisp
(defun walk (form transform)
  (cond ((atom form) (funcall transform form))
        (t (cons (walk (car form) transform)
                 (walk (cdr form) transform)))))

(walk '(+ 1 (* 2 3)) (lambda (x) (if (numberp x) (* x 10) x)))
;; => (+ 10 (* 20 30))
```

Code walking is how you implement things like automatic differentiation, CPS transformation, and macros that need to understand their body's structure (e.g., a macro that knows about `return` statements inside it). It is also where hygiene problems become acute.

### 4.9 Hygiene: the variable capture problem

Consider this macro:

```lisp
(defmacro my-swap (a b)
  `(let ((tmp ,a))
     (setf ,a ,b)
     (setf ,b tmp)))
```

It works fine for normal use:

```lisp
(let ((x 1) (y 2))
  (my-swap x y))   ; => x is 2, y is 1
```

But what happens here?

```lisp
(let ((tmp 100) (x 1))
  (my-swap tmp x))

;; expands to:
(let ((tmp 100) (x 1))
  (let ((tmp tmp))       ; ← captures the outer tmp!
    (setf tmp x)
    (setf x tmp)))
```

The `tmp` introduced by the macro collides with the `tmp` in the user's code. The macro has **captured** a variable from the surrounding scope, which is a bug. The user wanted to swap `tmp` and `x`; the macro silently produced broken code.

This is the **variable capture problem**. It is the fundamental hazard of Lisp macros.

### 4.10 Gensym: Common Lisp's solution

Common Lisp's answer is `gensym` — a function that creates a brand new symbol that is guaranteed not to collide with any existing symbol:

```lisp
(defmacro my-swap (a b)
  (let ((tmp (gensym)))
    `(let ((,tmp ,a))
       (setf ,a ,b)
       (setf ,b ,tmp))))
```

Now each macro expansion introduces a fresh symbol (`#:G12345` or whatever) that cannot collide with user code. The hygiene problem is solved — manually, at the cost of remembering to gensym every temporary.

An idiom called `defmacro/g!` (from Doug Hoyte's *Let Over Lambda*) automatically gensyms any symbol in a macro that starts with `g!`:

```lisp
(defmacro/g! my-swap (a b)
  `(let ((,g!tmp ,a))
     (setf ,a ,b)
     (setf ,b ,g!tmp)))
```

Clean. No manual bookkeeping. The meta-macro handles it.

### 4.11 syntax-rules: R4RS hygienic pattern matching

Scheme took a different path. The R4RS standard introduced `syntax-rules`, a pattern-based macro system that is *automatically* hygienic:

```lisp
(define-syntax swap!
  (syntax-rules ()
    ((swap! a b)
     (let ((tmp a))
       (set! a b)
       (set! b tmp)))))
```

The pattern `(swap! a b)` binds `a` and `b` to whatever was in the call. The template after the pattern is what it expands to. Identifiers introduced by the template (like `tmp`) are automatically renamed to fresh symbols when there's a risk of capture. No gensym needed.

`syntax-rules` is powerful enough for most macros. It supports ellipsis patterns for variadic macros:

```lisp
(define-syntax when
  (syntax-rules ()
    ((when cond body ...)
     (if cond (begin body ...)))))
```

The `body ...` pattern matches zero or more expressions and expands them splicingly in the template. This is pattern-based code generation at its cleanest.

The limitation of `syntax-rules` is that it is purely pattern-based. You cannot compute anything during macro expansion. If you need to decide based on the structure of the input, you need procedural macros.

### 4.12 syntax-case: R6RS procedural hygiene

`syntax-case` (R6RS, 2007) is the procedural version of `syntax-rules`. You get hygiene automatically, but you can also write arbitrary code that runs at compile time to decide what to generate.

```lisp
(define-syntax swap!
  (lambda (stx)
    (syntax-case stx ()
      ((_ a b)
       (with-syntax ((tmp (datum->syntax #'a 'tmp)))
         #'(let ((tmp a)) (set! a b) (set! b tmp)))))))
```

The `#'` reader macro produces a "syntax object" — a piece of code carrying hygiene information. `datum->syntax` lets you deliberately break hygiene when you want to (e.g., for anaphoric macros, which intentionally introduce bindings the user can refer to).

`syntax-case` is the canonical hygienic macro system. It is what Racket uses as its foundation. It gives you the power of defmacro with the safety of syntax-rules.

### 4.13 Clojure's syntax-quote

Clojure (Rich Hickey, 2007) took yet another approach. Clojure's backtick (`syntax-quote`, written with backtick) automatically resolves symbols to their fully qualified namespace at macro expansion time:

```clojure
(defmacro my-when [cond & body]
  `(if ~cond (do ~@body)))

;; Expansion:
(my-when (pos? x) (println x))
;; => (if (user/pos? x) (clojure.core/do (clojure.core/println x)))
```

Notice that `if`, `do`, and `println` get namespaced to `clojure.core`. This prevents accidental capture *of function bindings*, because your local `println` cannot shadow the one the macro intended.

For local bindings (`tmp` in swap), Clojure uses auto-gensym: any symbol ending in `#` inside a syntax-quote is automatically gensymed:

```clojure
(defmacro swap! [a b]
  `(let [tmp# ~a]
     (reset! ~a @~b)
     (reset! ~b tmp#)))
```

Clojure's system is a pragmatic middle ground. It gives you most of the hygiene of `syntax-case` with the syntactic comfort of `defmacro`.

### 4.14 The "macros are evil" vs "macros are the point" debate

Not everyone loves macros. Critics say:

- Macros are harder to understand than functions (you have to think about expansion, not just evaluation).
- Macros compose poorly (two macros that both do the right thing may not combine to do the right thing).
- Macros make refactoring harder (you can't just rename a function; you have to understand what the macro does).
- Macros are often used when a function would do.
- Macros hide control flow, making debugging harder.

Defenders say:

- Macros are the only way to add new syntax without modifying the compiler.
- Macros are what make Lisp Lisp — they are the reason the language has survived 60+ years while absorbing new paradigms.
- Pattern-based macros (syntax-rules) are actually easier to understand than some clever functions.
- Good DSLs make code clearer, not muddier.
- The alternative is boilerplate, and boilerplate is worse.

The mature take: **functions first, macros when you need new evaluation rules.** If your proposed macro does something a function could do, use a function. If it needs to not evaluate an argument (like `if`), or introduce a binding (like `let`), or wrap the body in something (like `with-open-file`), then use a macro. The macro is a tool for shaping code; the function is a tool for shaping values.

### 4.15 When NOT to use macros

Heuristic: if your "macro" calls all its arguments exactly once in order, it should be a function. Macros exist to *not* evaluate arguments, to evaluate them zero or multiple times, to evaluate them in a non-standard order, or to introduce new bindings.

Bad macro:

```lisp
(defmacro add (a b) `(+ ,a ,b))   ; just use +
```

Good macro:

```lisp
(defmacro and (&rest args)
  (cond ((null args) t)
        ((null (cdr args)) (car args))
        (t `(if ,(car args) (and ,@(cdr args)) nil))))
```

`and` short-circuits: it does not evaluate later arguments if an earlier one is false. This requires non-standard evaluation, so it must be a macro (or a special form).

### 4.16 Anaphoric macros

An **anaphoric macro** deliberately captures a variable so the user can refer to it. The name comes from linguistics — an "anaphor" is a pronoun that refers back to an antecedent.

The classic example is `aif`:

```lisp
(defmacro aif (test then &optional else)
  `(let ((it ,test))
     (if it ,then ,else)))

(aif (find-user "foxy")
     (print (user-name it))     ; `it` refers to the result of find-user
     (print "not found"))
```

`aif` introduces `it` on purpose. Hygiene would prevent this — the whole point is that `it` is capturable. In Common Lisp, this just works because `defmacro` is not hygienic. In Scheme, you need to use `datum->syntax` to deliberately break hygiene.

Anaphoric macros are divisive. Some programmers love them (Paul Graham uses them throughout *On Lisp*). Others find the implicit binding confusing. Either way, they illustrate that hygiene is a choice, not a law.

`awhen`, `acond`, `alet` are the rest of the anaphoric family. They all capture `it` (or some other anaphor) as a convenience.

### 4.17 Macro-writing macros

Macros can write macros. `defmacro/g!` above is an example — a macro that expands into a `defmacro` that handles gensym automatically. Here's a sketch:

```lisp
(defmacro defmacro/g! (name args &body body)
  (let* ((syms (remove-duplicates
                (remove-if-not
                 (lambda (s) (and (symbolp s)
                                  (> (length (symbol-name s)) 2)
                                  (string= "G!" (subseq (symbol-name s) 0 2))))
                 (flatten body)))))
    `(defmacro ,name ,args
       (let ,(mapcar (lambda (s) `(,s (gensym ,(symbol-name s)))) syms)
         ,@body))))
```

This walks the macro body, finds any symbols starting with `g!`, and automatically binds them to fresh gensyms. Now you can write macros that look normal but are automatically hygienic:

```lisp
(defmacro/g! my-swap (a b)
  `(let ((,g!tmp ,a))
     (setf ,a ,b)
     (setf ,b ,g!tmp)))
```

Macros writing macros. Tools building tools. This is why Lisp is the meta language — the same mechanism that lets you extend the language also lets you extend the extension mechanism itself. There is no bottom.

### 4.18 Reader macros (again, with feeling)

We saw reader macros briefly in Section 1. They are macros that run during the read phase, before the evaluator or the normal macro expander has seen anything. A reader macro lets you add entirely new surface syntax.

Common Lisp example — #v for a vector (if it didn't already have that):

```lisp
(set-dispatch-macro-character #\# #\v
  (lambda (stream char arg)
    (declare (ignore char arg))
    (let ((lst (read-delimited-list #\] stream t)))
      (coerce lst 'vector))))

;; Now you can write:
#v[1 2 3 4]
;; which reads as #(1 2 3 4)
```

Reader macros are powerful enough to embed JSON, YAML, or entire other languages directly in a Lisp source file. Racket takes this to the extreme: a file starting with `#lang datalog` is read by the Datalog reader, not the Racket reader. The same file could contain multiple languages in different regions, each parsed by its own reader macro.

### 4.19 What macros actually enable

The macros in the Lisp tradition have grown entire families of powerful abstractions:

**Pattern matching**: `match` macros that destructure values against patterns. Standard in Haskell, retrofitted to Scala and Rust, built in a weekend to Common Lisp and Racket.

**ORM/DSL syntax**: Hibernate-like object-relational mappers in twenty lines. Datomic's query language in Clojure is just a DSL on top of Clojure data.

**Parser combinators**: build a parser by combining small parsers with macros.

**Web routing**: `(route "/users/:id" get (show-user id))`. No annotations, no reflection, just a macro.

**Build systems**: Racket's `make` ships as a module you include in a regular Racket file.

**Language implementation**: Racket literally ships languages as libraries. `#lang typed/racket` is Typed Racket. `#lang scribble` is a documentation language. `#lang datalog` is Datalog. `#lang slideshow` is a presentation language. All of these are full-blown languages with their own readers, macros, and compilers, and all of them live side by side in the same system.

If you've ever thought "I wish my language supported X," in Lisp you just... write X. The language is infinitely extensible because the compiler is a library you can call.

### 4.20 Canonical texts

**On Lisp** by Paul Graham (1993) — the canonical macro textbook. Covers macros from the simplest to macro-writing macros, anaphoric macros, read macros, and macro-driven compilers. Out of print; free PDF on Graham's website.

**Let Over Lambda** by Doug Hoyte (2008) — picks up where On Lisp left off. Covers advanced macro techniques, including "macros that write macros that write macros." Polarizing because Hoyte's style is intense, but the material is unique.

**ANSI Common Lisp** by Paul Graham (1996) — a gentler introduction to Common Lisp that still covers macros deeply.

**Practical Common Lisp** by Peter Seibel (2005) — free online, recent, practical. Covers macros in the context of real projects (a binary file parser, an MP3 database, an HTTP server).

**The Scheme Programming Language** by Kent Dybvig (4th edition, 2009) — Scheme's definitive reference, including syntax-rules and syntax-case.

### 4.21 The Racket approach: languages as libraries

Racket (formerly PLT Scheme) has pushed the macro idea further than anyone. In Racket:

- A language is a module that exports `#%module-begin`, `#%app`, `#%datum`, and `#%top` — the forms the reader uses when starting a module, applying a function, encountering a literal, and looking up an identifier.
- By redefining these forms, you can redefine every fundamental operation of the language.
- You can ship a new language as a regular library. Users include `#lang my-language` at the top of their file, and the file is read and compiled using your language's rules.

Racket ships dozens of `#lang`s: `racket`, `typed/racket`, `lazy`, `datalog`, `scribble`, `slideshow`, `pollen`, `r5rs`. Each is a language-as-a-library. They all interoperate because they all compile to Racket's core.

The Racket team has published papers on "Languages as Libraries" and on how to build DSLs with proper binding, scoping, and type checking. The approach is rigorous and production-ready. It is the current state of the art in macro-driven language implementation.

When somebody says "in Lisp you can build your own language," Racket is the existence proof.

---

## 5. Common Lisp's Object System (CLOS)

### 5.1 Multiple dispatch

Most OOP languages have **single dispatch**: a method call `obj.method(args)` looks up the method on `obj`'s class. The dispatch is based on *one* object — the receiver.

CLOS has **multiple dispatch**: a generic function call `(method obj1 obj2 obj3)` looks at the types of all the arguments and picks the most specific matching method. Dispatch is based on *all* the arguments.

This sounds like a small difference. It is not. Multiple dispatch solves a fundamental problem that single dispatch cannot: what if the right method depends on the combination of two types, not just one?

Classic example — a collision detection system:

```lisp
(defgeneric collide (a b))

(defmethod collide ((a asteroid) (b asteroid))
  (print "Two asteroids bump"))

(defmethod collide ((a ship) (b asteroid))
  (print "Ship takes damage"))

(defmethod collide ((a asteroid) (b ship))
  (print "Asteroid takes damage"))

(defmethod collide ((a ship) (b ship))
  (print "Ships exchange fire"))
```

In a single-dispatch language, you'd have to put the logic on `Ship` or `Asteroid`, which means one class has to know about the other. In CLOS, the generic function owns the dispatch, and any combination of classes can have a method. New classes can add methods for existing generic functions without modifying any existing class.

### 5.2 Generic functions vs methods

In CLOS, you don't define methods on classes. You define **generic functions** that stand apart from any class, and each class (or combination of classes) provides a **method** that implements the generic function for that specific case.

```lisp
(defgeneric area (shape))

(defmethod area ((s circle))
  (* pi (expt (circle-radius s) 2)))

(defmethod area ((s rectangle))
  (* (rect-width s) (rect-height s)))
```

`area` is the generic function. There are two methods, one per class. When you call `(area some-shape)`, CLOS dispatches to the method whose parameter types match.

This decouples data from behavior. Classes are just containers for slots. Behavior lives in generic functions that dispatch on class. Adding a new shape means adding a new method; adding a new operation means adding a new generic function. Both are incremental.

### 5.3 Method combinations

CLOS generic functions support **method combinations** — multiple methods that all run as part of a single generic function call. The built-in combinations include:

- **:before** methods run before the primary method, no return value used.
- **:after** methods run after the primary method, no return value used.
- **:around** methods wrap the primary method. They can call `call-next-method` to invoke the inner method.
- **:primary** is the default method.

```lisp
(defmethod draw :before ((s shape)) (log-drawing-start s))
(defmethod draw ((s circle)) (draw-circle s))
(defmethod draw :after ((s shape)) (log-drawing-end s))
(defmethod draw :around ((s shape))
  (with-lock *draw-lock* (call-next-method)))
```

One call to `(draw c)` on a circle runs: :around, then :before, then primary, then :after. This is aspect-oriented programming without the plugin or the annotation processor. It's just CLOS.

Beyond the standard combinations, you can define **method combination types**. `:list`, `:append`, `:and`, `:or`, `:progn` combine all applicable methods' return values in various ways. `(defgeneric foo (x) (:method-combination +))` makes every method add into the result. You can also define your own combinations.

### 5.4 The metaobject protocol (MOP)

CLOS classes are themselves objects. An instance of `point` is an object. The `point` class is also an object — specifically, an instance of the class `standard-class`, which is itself an instance of `standard-class`. It turtles all the way down, bottoming out at a cyclic base case.

The **metaobject protocol** (MOP) is the published API that lets you inspect and modify the behavior of the CLOS implementation. You can:

- Subclass `standard-class` to make a new class type with custom slot access behavior.
- Subclass `standard-generic-function` to change dispatch rules.
- Subclass `standard-method` to add metadata or validation.
- Intercept slot reads and writes.
- Add persistence transparently (every slot write also writes to a database).
- Add type-checking transparently.
- Implement prototype-based objects on top of CLOS classes.

The MOP is the reason CLOS is sometimes called "the most powerful object system ever designed." You can change the rules of objects themselves without modifying the runtime. When Python's descriptors or Ruby's metaprogramming features are praised, they are imitating pieces of CLOS's MOP.

### 5.5 AMOP: The Art of the Metaobject Protocol

*The Art of the Metaobject Protocol* (1991) by Gregor Kiczales, Jim des Rivières, and Daniel Bobrow is the book that introduced the MOP concept to the world. It describes a subset of CLOS called "closette" — a minimal CLOS implementation you can read and understand in full — and then shows how the MOP can be used to extend it in arbitrary ways.

AMOP is also the book that planted the seed for **aspect-oriented programming**. Kiczales moved on from CLOS to PARC and later led the AspectJ project, which brought AOP ideas to Java. The whole AOP movement traces back to watching CLOS users write `:before` and `:after` methods.

AMOP is hard, but it is one of the most important books in the programming languages literature. Every serious language designer has read it.

### 5.6 Influence on other languages

- **Python** borrowed single-dispatch methods and the descriptor protocol from CLOS. The `@property`, `@classmethod`, and the whole attribute-access mechanism is a watered-down MOP. `functools.singledispatch` is a retrofit of CLOS-style dispatch.
- **Ruby** borrowed open classes (reopening a class to add methods) and method-missing (dynamic dispatch) from CLOS ideas.
- **Julia** is essentially CLOS without inheritance-based encapsulation. It has multiple dispatch as its *primary* abstraction mechanism, and its method tables are directly inspired by CLOS generic functions. Julia is what you get if you start with CLOS, strip away the legacy syntax, and add a modern compiler.
- **Dylan** was an attempt to put CLOS into a non-parenthetical syntax. It was Apple's official next-generation language for a while. It had a beautiful design and almost no users.

### 5.7 The expression problem

The **expression problem** (coined by Wadler) is this: you want to be able to add new data types *and* new operations without modifying existing code and without losing static type safety.

In single-dispatch OOP, adding a new type is easy (subclass and add methods), but adding a new operation is hard (you have to modify every class).

In functional programming with pattern matching, adding a new operation is easy (define a new function with a match over the data constructors), but adding a new type is hard (you have to add a new constructor to the data type and update every function that pattern-matches on it).

Multiple dispatch solves this elegantly. Adding a new type is easy (define methods for each generic function that care about the new type). Adding a new operation is easy (define a new generic function with methods for each type). Neither requires modifying existing code. This is one reason multiple dispatch is so powerful.

### 5.8 Julia's CLOS lineage

Julia's design explicitly acknowledges its CLOS roots. Julia has:

- Generic functions (called "functions," because in Julia that's the default)
- Multiple dispatch (on all argument types)
- Types that form a lattice (abstract types, concrete types, union types, parametric types)
- Type inference that lets the JIT generate specialized code per dispatch target

The big difference: Julia has no `:before`, `:after`, `:around`, or class inheritance for data. Julia uses composition (structs with fields) for data and multiple dispatch for behavior. It is CLOS streamlined for numerical computing.

If you want to see CLOS's ideas in a modern, JIT-compiled, performance-focused language, Julia is the answer.

### 5.9 A complete CLOS example

```lisp
(defclass animal ()
  ((name :initarg :name :accessor animal-name)
   (sound :initarg :sound :accessor animal-sound)))

(defclass dog (animal) ())
(defclass cat (animal) ())

(defgeneric greet (a b))

(defmethod greet ((a dog) (b dog))
  (format t "~a and ~a sniff each other~%"
          (animal-name a) (animal-name b)))

(defmethod greet ((a cat) (b cat))
  (format t "~a and ~a ignore each other~%"
          (animal-name a) (animal-name b)))

(defmethod greet ((a dog) (b cat))
  (format t "~a chases ~a~%" (animal-name a) (animal-name b)))

(defmethod greet ((a cat) (b dog))
  (format t "~a hisses at ~a~%" (animal-name a) (animal-name b)))

(defmethod greet :before (a b)
  (format t "[greeting starts]~%"))

(defmethod greet :after (a b)
  (format t "[greeting ends]~%"))

(let ((rex  (make-instance 'dog :name "Rex"))
      (tom  (make-instance 'cat :name "Tom")))
  (greet rex tom))
;; [greeting starts]
;; Rex chases Tom
;; [greeting ends]
```

This is impossible to express cleanly in single-dispatch languages. You'd need visitor patterns, double-dispatch tricks, or tagged unions with giant switch statements. CLOS makes it a one-liner per combination.

---

## 6. Numeric Tower and Data Types

### 6.1 The numeric tower

Common Lisp has a rich hierarchy of numeric types, often called the **numeric tower**:

```
number
├── real
│   ├── rational
│   │   ├── integer
│   │   │   ├── fixnum (small, fits in a machine word)
│   │   │   └── bignum (arbitrary precision)
│   │   └── ratio (exact fractions, e.g., 1/3)
│   └── float
│       ├── short-float
│       ├── single-float
│       ├── double-float
│       └── long-float
└── complex (real + imaginary parts)
```

The operations are defined to preserve exactness when possible and to promote automatically when needed.

```lisp
(+ 1 2)          ; => 3              integer + integer = integer
(+ 1/2 1/3)      ; => 5/6            ratio + ratio = ratio
(+ 1/2 0.5)      ; => 1.0            ratio + float = float
(* 1/3 3)        ; => 1              ratio * integer = integer (exact!)
(sqrt -1)        ; => #C(0 1)        negative sqrt returns complex
(expt 2 100)     ; => 1267650600228229401496703205376  (bignum)
(expt 2 1000)    ; => a number with ~300 digits          (bignum)
```

The numeric tower is one of Common Lisp's unsung features. You can compute with exact rationals without ever touching floating point. `(/ 1 3)` is exactly one-third, not 0.3333... You can multiply 1/3 by 3 and get 1 exactly. No rounding error.

Python got bignums in 3.x. Haskell has them. Scheme has them. Ratios are rarer — Python has `fractions.Fraction`, but you have to opt in. In Common Lisp, you get ratios by default: `(/ 1 2)` returns `1/2`, not `0.5`.

### 6.2 Why this matters

Floating point is fast and convenient but lies about numbers. `0.1 + 0.2 != 0.3` in almost every language because 0.1 is not exactly representable in binary. This is fine for most engineering, but it is catastrophic for anything symbolic — computer algebra, financial calculations, number theory, theorem proving.

With the numeric tower, you can do these computations exactly. Only when you explicitly ask for a float do you get inexact arithmetic.

```lisp
(reduce #'+ (loop repeat 10 collect 1/10))   ; => 1    (exact!)
(reduce #'+ (loop repeat 10 collect 0.1))    ; => 1.0000001  (float error)
```

This is why Common Lisp is still the go-to language for symbolic math and experimental number theory.

### 6.3 Characters, strings, symbols

**Characters** are a distinct type. `#\a` is the character 'a'. `#\Space` is space. `#\Newline` is newline. Characters are not integers, though you can convert with `char-code` and `code-char`.

**Strings** are arrays of characters. They are a composite type, not atoms. You index with `char`, get length with `length`, concatenate with `concatenate`.

**Symbols** are interned names. When the reader sees `foo`, it looks up or creates a symbol object with that name. Two readings of `foo` in the same package give you the same symbol object. Symbols have:

- A **name** (string)
- A **package** (namespace)
- A **value** cell (for global variable bindings)
- A **function** cell (for function bindings — Common Lisp is a Lisp-2)
- A **property list** (arbitrary metadata)

Symbols are the reason Lisp can treat code as data naturally. A variable reference like `x` is just a symbol. A function call like `(foo x)` is just a list of symbols. The reader produces symbols; the evaluator consumes them.

### 6.4 Lisp-1 vs Lisp-2

Scheme has a single namespace for variables and functions: `(define foo 10)` and `(define foo (lambda (x) x))` clobber each other, because `foo` only has one binding. This is called **Lisp-1** (one namespace).

Common Lisp has separate namespaces: `(defvar foo 10)` and `(defun foo (x) x)` coexist peacefully. `foo` as a value is 10, and `(foo x)` calls the function. This is **Lisp-2** (two namespaces).

To pass a function as a value in Common Lisp, you use `#'foo` (read as "function foo") or `(function foo)`. To call a function stored in a variable, you use `(funcall f x)` or `(apply f args)`.

The Lisp-1 vs Lisp-2 debate has raged for decades. Scheme and Clojure are Lisp-1. Common Lisp and Emacs Lisp are Lisp-2. Lisp-1 is simpler; Lisp-2 avoids accidentally shadowing `list` or `map` when you name a variable those things. Both approaches work. Neither is going away.

### 6.5 Packages

Common Lisp's namespace system is called **packages**. A package is a named collection of symbols. When you read `foo`, the symbol gets interned in the current package. Different packages can have different `foo` symbols.

```lisp
(defpackage :my-lib
  (:use :common-lisp)
  (:export :my-function))

(in-package :my-lib)

(defun my-function (x) (* x x))
```

To refer to a symbol in another package: `my-lib:my-function`. For internal (non-exported) symbols: `my-lib::internal-function`.

Packages are functional but primitive compared to modern module systems. They solve name clashes but don't handle versioning, dependencies, or reloading cleanly. Quicklisp (the Common Lisp package manager) sits on top of packages and adds the rest.

### 6.6 Keywords

**Keywords** are symbols in the special `keyword` package. They are written with a leading colon:

```lisp
:name
:red
:door
```

Keywords are self-evaluating and interned globally. They are typically used as option flags, map keys, and enum values:

```lisp
(make-instance 'person :name "Foxy" :age 50)

(sort lst :key #'name :test #'string<)

(case direction
  ((:north) (go-up))
  ((:south) (go-down)))
```

In Clojure, keywords are even more pervasive — they are the canonical map key. In Common Lisp, they are a convenience for named arguments and symbolic constants.

### 6.7 Arrays, vectors, hash tables

Lists are not the only data structure in Lisp, despite the stereotype. Common Lisp has:

**Vectors** — one-dimensional arrays with O(1) indexing. Use when you need random access.

```lisp
(defvar v #(1 2 3 4))
(aref v 2)               ; => 3
```

**Arrays** — multi-dimensional, with fill pointers, adjustable sizes, and specialized element types (unboxed doubles, bit vectors, etc.).

```lisp
(defvar m (make-array '(3 3) :initial-element 0))
(setf (aref m 1 1) 42)
```

**Hash tables** — O(1) key/value lookup.

```lisp
(defvar h (make-hash-table :test 'equal))
(setf (gethash "name" h) "Foxy")
(gethash "name" h)       ; => "Foxy"
```

**Strings** — as noted, arrays of characters.

**Structures** (defstruct) — simple record types with named slots, like lightweight classes without inheritance.

```lisp
(defstruct point x y)
(defvar p (make-point :x 3 :y 4))
(point-x p)              ; => 3
```

**Classes** (CLOS) — for when you need full object-oriented capabilities.

### 6.8 Conditions and restarts

This is the best-kept secret of Common Lisp: its error handling is radically more powerful than what any mainstream language offers. It is not "exceptions, but different." It is a completely different model.

In most languages, when an error occurs, the stack unwinds until something catches the exception. The caller decides how to recover. The code that detected the error is gone by the time recovery happens — it's just a corpse on the stack.

In Common Lisp, when a condition is signaled, the stack *does not unwind immediately*. The condition handler runs in the context of the signaling code and can decide what to do. The handler can:

1. Let the condition propagate (same as rethrowing).
2. Unwind to a specific point (`go` to a tag, `throw` to a block).
3. **Invoke a restart** — a named recovery strategy that the signaling code published.

Restarts let the *callee* say "here are the ways I could recover, if you (the handler) pick one." The handler picks a restart, and the signaling code continues running with that recovery applied. The stack does not unwind unless a restart chooses to.

```lisp
(defun parse-integer-with-default (str default)
  (restart-case (parse-integer str)
    (use-default () default)
    (retry (new-str) (parse-integer-with-default new-str default))))

(handler-bind ((parse-error
                (lambda (c)
                  (declare (ignore c))
                  (invoke-restart 'use-default))))
  (parse-integer-with-default "not a number" 0))
;; => 0
```

When `parse-integer` fails, the condition is signaled. The handler catches it, invokes the `use-default` restart, and execution continues with the default value. The stack between the handler and the signaling point is preserved.

### 6.9 Why restarts matter

This is hard to appreciate until you've lived with it, but restarts enable a workflow you can't get in other languages. When a long-running computation fails deep in its call tree, the interactive debugger pops up showing you the error and the list of restarts. You can:

- Fix the problem (set a variable, edit a function, load missing data).
- Pick a restart to continue.
- The computation resumes from the point of failure, as if the error hadn't happened.

You don't lose hours of computation because of a typo. You don't restart from scratch. You fix the issue and say "continue." This is the image-based development model, and it only works because restarts preserve execution state.

Common Lisp's condition system is also the basis for `with-simple-restart`, `cerror` (continuable errors), `assert` (which offers to let you change the failing value), and interactive debugger integration in SLIME and LispWorks.

No other language has this. Not Python. Not Ruby. Not Java. Not Rust. They all unwind on error. Common Lisp unwinds only when it chooses to, and restarts let the code publish recovery options in advance.

### 6.10 A condition/restart example

```lisp
(define-condition invalid-input (error)
  ((value :initarg :value :accessor invalid-input-value)))

(defun process (x)
  (restart-case
      (if (numberp x)
          (* x 2)
          (error 'invalid-input :value x))
    (use-zero () 0)
    (use-value (v) v)
    (retry-with (new) (process new))))

(handler-bind
    ((invalid-input
      (lambda (c)
        (format t "Got invalid input: ~a~%" (invalid-input-value c))
        (invoke-restart 'retry-with 42))))
  (process "not a number"))
;; Got invalid input: not a number
;; => 84
```

The `process` function signals `invalid-input` if the argument isn't a number. It also publishes three restarts: `use-zero`, `use-value`, and `retry-with`. The handler catches the condition, prints a message, and invokes `retry-with 42`, which retries the function with a valid argument. Result: 84.

Note that the handler is completely decoupled from the restart list. The function offers recovery strategies; the caller picks one based on policy. You can have multiple handlers at different levels, each picking different restarts. This is error handling as a negotiation between caller and callee, not as a unilateral stack unwind.

---

## 7. The REPL Culture

### 7.1 Interactive development

Most languages have a REPL as an afterthought. Lisp invented the REPL and built the entire development workflow around it. In Lisp, you don't edit-compile-run-edit-compile-run. You launch a REPL once, evaluate definitions one at a time, test them, redefine them, and keep the environment alive indefinitely.

```lisp
* (defun square (x) (* x x))
SQUARE
* (square 5)
25
* (defun square (x) (expt x 2))    ; redefine on the fly
SQUARE
* (square 5)
25
```

Each definition is compiled (Common Lisp has a real incremental compiler) and added to the running image. Nothing restarts. The entire application state, including open connections, loaded data, and active threads, remains intact.

### 7.2 Image-based programming

Common Lisp (and Smalltalk) use an **image**: a snapshot of the entire running memory state, including the compiler, the standard library, user code, and any data. You can save the image to disk and restart from exactly where you left off.

```lisp
(save-lisp-and-die "myapp.core" :toplevel #'main)
;; writes a multi-MB file containing the entire Lisp image
```

The image is the deployment artifact. You restart a service by loading the image. No re-compilation. No re-initialization. No cold start.

Naughty Dog reportedly shipped Jak and Daxter (PS2, 2001) using a Common Lisp-based engine where live patches could be pushed to the running game without restarting. That's image-based development at its peak.

### 7.3 SLIME and Emacs

**SLIME** (Superior Lisp Interaction Mode for Emacs) is the canonical development environment for Common Lisp. It connects Emacs to a running Lisp process via a protocol called Swank, and gives you:

- Inline evaluation — `C-x C-e` evaluates the form at the cursor
- Function redefinition — `C-c C-c` compiles and installs a function in the running image
- Interactive debugger — when an error is signaled, SLIME pops up a buffer showing the stack, the condition, and the available restarts
- Inspector — drill into any value in the running image
- Completion — TAB-completes symbols from the live image (not a static index)
- Cross-reference — find all callers of a function by asking the live image

SLIME is what makes the REPL culture work. You never leave Emacs. You never restart Lisp. You build your program incrementally by evaluating definitions and testing them immediately. Errors drop you into a live debugger where you can inspect, patch, and resume.

### 7.4 Hot reload as the default

In modern web development, "hot reload" is a feature frameworks brag about. In Lisp it has been the default since forever. You redefine a function, and every caller of that function immediately uses the new version. You reload a file, and the new definitions overwrite the old ones in place. You never stop the server.

This is especially powerful for:

- Long-running simulations
- Scientific computing where you've loaded gigabytes of data
- Server development where cold starts are expensive
- Any debugging session where you want to fix and continue

Python and JavaScript have bolted on hot reload (via IPython autoreload, webpack HMR, etc.) and it works okay. It breaks when state accumulates in ways the reload system doesn't understand. Lisp's hot reload works because the image *is* the program — there's no separate "source file" that gets re-compiled; there's just the live environment being updated.

### 7.5 Deployed Lisp systems

Common Lisp has been used in production at scale:

- **Viaweb** (Paul Graham, 1995) — online store builder, acquired by Yahoo and became Yahoo Store. Paul Graham's famous "Beating the Averages" essay describes how Lisp gave them a decisive advantage over competitors. They shipped features overnight that took competitors months.
- **ITA Software** — airfare search engine, bought by Google in 2010 for $700M. Handles flight search for Orbitz, Kayak, and Google Flights. The core engine is Common Lisp.
- **Grammarly** (early) — grammar checker. Started in Common Lisp; later migrated.
- **Allegro Common Lisp** — powers countless enterprise applications, especially in aerospace, finance, and biotech.
- **Mirai** (at Izware) — 3D modeling and animation software used for Lord of the Rings. Golem was modeled in Mirai.

Lisp is not dead. It is quietly running in places where image-based development, interactive debugging, and macro-driven DSLs make a real difference.

### 7.6 The system is the environment

The overall worldview: your development environment and your running program are the same thing. You don't edit code and then run it. You edit code *while it is running*. The environment includes the compiler, the debugger, the inspector, the documentation, and the data. Everything is live. Everything is inspectable. Everything can be redefined.

Smalltalk has the same philosophy, taken arguably even further — the entire GUI, including the text editor and file browser, is written in Smalltalk and runs inside the image. You can open any window's inspector and see the objects behind it.

The modern world has mostly abandoned this model in favor of external editors, separate compilers, opaque runtimes, and redeployment as the recovery strategy. It is faster when everything works; it is much slower when anything goes wrong. The image-based model has a higher floor and a higher ceiling.

---

## 8. Continuations and Control Flow

### 8.1 call/cc

Scheme's signature feature is `call-with-current-continuation`, mercifully abbreviated `call/cc`. It captures "the rest of the computation" as a first-class function that you can call later to resume at that point.

```lisp
(+ 1 (call/cc (lambda (k) (* 2 3))))
;; k is a function. If you never call it, you get (+ 1 (* 2 3)) = 7.
;; If you call (k 100), the computation becomes (+ 1 100) = 101.
```

The continuation `k` represents "add 1 to whatever value I get." When you call `(k 100)`, you are saying "jump back to that point with the value 100." It's as if you went back in time, returned 100 from `call/cc`, and let execution continue.

### 8.2 Why it's powerful

Continuations subsume every control flow construct ever invented:

- **Early exit**: capture a continuation at the top of a function, call it anywhere to return.
- **Exceptions**: capture a continuation at a handler, call it from the signaling point.
- **Generators**: capture a continuation inside a loop, return it so the caller can "resume" the loop one step at a time.
- **Coroutines**: two (or more) mutually yielding functions, each resuming the other.
- **Backtracking** (Prolog-style): save continuations at each choice point; when a dead end is reached, call a saved continuation to try the next alternative.
- **Green threads**: capture a continuation, store it, switch to another; later, call the stored continuation to resume.

Everything flows from the single primitive of "grab the rest of the program as a value."

### 8.3 Generators from continuations

```lisp
(define (make-generator lst)
  (let ((k #f))
    (define (next)
      (call/cc
        (lambda (return)
          (if k
              (k return)
              (let loop ((lst lst))
                (if (null? lst)
                    (return 'done)
                    (begin
                      (call/cc
                        (lambda (resume)
                          (set! k resume)
                          (return (car lst))))
                      (loop (cdr lst)))))))))
    next))

(define g (make-generator '(a b c)))
(g)   ; => a
(g)   ; => b
(g)   ; => c
(g)   ; => done
```

This is a generator built from raw `call/cc`. Python's `yield` is much more convenient, but it's specifically designed to do this one thing. Scheme's `call/cc` does this and many more things from one primitive.

### 8.4 Delimited continuations

Plain `call/cc` captures the entire future of the computation up to the top of the program. This is sometimes too much. **Delimited continuations** capture only up to a specified boundary.

The primitives are `shift` and `reset`:

```lisp
(reset (+ 1 (shift k (k 10))))
;; reset marks a boundary. shift captures the continuation up to that boundary.
;; (k 10) resumes with value 10, yielding (+ 1 10) = 11.

(reset (+ 1 (shift k 0)))
;; shift ignores k and returns 0. Final value: 0.
```

Delimited continuations are composable in ways that undelimited continuations are not. They can implement effect systems (like Haskell's algebraic effects) directly. They are the basis of Racket's `prompt` and `control`, and of Oleg Kiselyov's work on extensible effects.

### 8.5 Why Scheme has them, why Common Lisp doesn't

Scheme's minimalism means the language designers were willing to add one powerful primitive (call/cc) and derive everything else from it. Common Lisp prefers to provide specific constructs for specific needs: `block`/`return-from` for early exit, `catch`/`throw` for dynamic exit, `unwind-protect` for cleanup, `handler-case` and restarts for conditions.

Common Lisp's designers explicitly rejected continuations because:

1. They are hard to implement efficiently (every function call must be able to capture the stack).
2. They interact poorly with C interop (foreign functions don't know about them).
3. Restarts + dynamic binding cover most of the practical needs.
4. Performance-sensitive Common Lisp code can't afford the overhead.

Scheme accepted the cost for the elegance. Common Lisp accepted the compromise for the performance. Both answers are defensible.

### 8.6 Continuations and monads

There is a deep relationship between continuations and monads. In fact, the continuation monad is the "universal" monad — every other monad can be expressed in terms of continuations. This is why Scheme programmers find Haskell's monad tutorials unnecessary; they already have the more fundamental concept.

**Continuation-passing style (CPS)** is the programming style where every function takes a continuation as an extra argument and calls it with the result instead of returning. CPS-transforming a program makes every control flow explicit. Compilers often use CPS as an intermediate representation because it simplifies optimization.

Effect systems in Koka, Eff, and more recently OCaml's algebraic effects are all built on delimited continuations. Handlers are just functions that choose which continuation to invoke (or not). Monads, effects, exceptions, and continuations are all the same idea in different skins.

### 8.7 Why "continuation" is both a superpower and a footgun

Continuations let you express any control flow. They also let you express control flow nobody has ever seen before, which is harder for humans to read. Code that captures and re-invokes continuations is notoriously difficult to debug because the "stack trace" is a lie — the current stack doesn't reflect where the computation will go next.

The advice is the same as for macros: use continuations when they are the right tool, not because they're cool. Most of the time, a function or a state machine is clearer.

When you do need them — for generators, for web session state (where each HTTP request resumes a stored continuation), for backtracking search, for implementing a custom effect system — they are irreplaceable.

---

## 9. FizzBuzz in Multiple Lisp Dialects

A small concrete example is sometimes the clearest illustration. Here is FizzBuzz in four Lisp dialects. Notice how similar they are — and how each has its own idioms.

**Common Lisp:**

```lisp
(defun fizzbuzz (n)
  (loop for i from 1 to n do
    (cond ((zerop (mod i 15)) (print "FizzBuzz"))
          ((zerop (mod i 3))  (print "Fizz"))
          ((zerop (mod i 5))  (print "Buzz"))
          (t (print i)))))

(fizzbuzz 20)
```

**Scheme:**

```lisp
(define (fizzbuzz n)
  (let loop ((i 1))
    (when (<= i n)
      (display
        (cond ((zero? (modulo i 15)) "FizzBuzz")
              ((zero? (modulo i 3))  "Fizz")
              ((zero? (modulo i 5))  "Buzz")
              (else i)))
      (newline)
      (loop (+ i 1)))))

(fizzbuzz 20)
```

**Clojure:**

```clojure
(defn fizzbuzz [n]
  (doseq [i (range 1 (inc n))]
    (println
      (cond
        (zero? (mod i 15)) "FizzBuzz"
        (zero? (mod i 3))  "Fizz"
        (zero? (mod i 5))  "Buzz"
        :else i))))

(fizzbuzz 20)
```

**Racket:**

```lisp
#lang racket
(define (fizzbuzz n)
  (for ([i (in-range 1 (+ n 1))])
    (displayln
      (cond [(zero? (modulo i 15)) "FizzBuzz"]
            [(zero? (modulo i 3))  "Fizz"]
            [(zero? (modulo i 5))  "Buzz"]
            [else i]))))

(fizzbuzz 20)
```

Same shape. Different flavors. The Lisp DNA is obvious in all of them.

---

## 10. Bibliography

### Primary Specifications

- **ANSI X3.226-1994** — Common Lisp standard. The canonical reference. Expensive but available.
- **Common Lisp the Language, 2nd Edition (CLtL2)** by Guy L. Steele Jr. (1990) — the standard's precursor; free online.
- **R7RS Small** — Scheme standard (2013). Free PDF from the Scheme Working Group.
- **R6RS** — the larger (and more controversial) Scheme standard (2007). Includes syntax-case hygienic macros.
- **Clojure reference** — clojure.org official docs.
- **The Racket Reference** — docs.racket-lang.org, continuously updated.

### Classics

- **Structure and Interpretation of Computer Programs (SICP)** by Abelson and Sussman (2nd ed, 1996). MIT Press. Free online. The book that changed how programming was taught.
- **Paradigms of Artificial Intelligence Programming (PAIP)** by Peter Norvig (1991). AI classics in Common Lisp. The opening chapters alone are worth the price.
- **On Lisp** by Paul Graham (1993). Out of print; free PDF on paulgraham.com. The canonical macro book.
- **Let Over Lambda** by Doug Hoyte (2008). Advanced macros and macro-writing macros.
- **ANSI Common Lisp** by Paul Graham (1996). A gentler introduction to Common Lisp.
- **The Little Schemer** (4th ed, 1995) and **The Seasoned Schemer** (2nd ed, 1995) by Friedman and Felleisen. Dialogue-style, Socratic teaching of recursion and Scheme.
- **The Reasoned Schemer** (2nd ed, 2018) by Friedman, Byrd, Kiselyov, and Hemann. Introduction to logic programming via miniKanren.
- **The Art of the Metaobject Protocol (AMOP)** by Kiczales, des Rivières, and Bobrow (1991). The MOP bible.

### Modern Books

- **Common Lisp Recipes** by Edi Weitz (2016). Practical how-to for modern Common Lisp.
- **Practical Common Lisp** by Peter Seibel (2005). Free online. Project-driven intro.
- **Land of Lisp** by Conrad Barski (2010). Illustrated, game-driven introduction.
- **Realm of Racket** by Matthias Felleisen et al. (2013). Illustrated introduction to Racket through games.
- **How to Design Programs (HtDP)** by Felleisen, Findler, Flatt, and Krishnamurthi (2nd ed, 2018). Free online. The replacement for SICP in many introductory curricula.
- **Essentials of Programming Languages (EoPL)** by Friedman, Wand, and Haynes (3rd ed, 2008). Deeper PL theory via interpreters.
- **Programming Languages: Application and Interpretation (PLAI)** by Shriram Krishnamurthi. Free online. Step-by-step interpreter construction.
- **The Scheme Programming Language (TSPL)** by Kent Dybvig (4th ed, 2009). Scheme reference and tutorial.

### Clojure

- **Clojure Programming** by Emerick, Carper, and Grand (2012).
- **The Joy of Clojure** (2nd ed, 2014) by Fogus and Houser.
- **Programming Clojure** (3rd ed, 2018) by Miller, Halloway, and Bedra.
- **Clojure for the Brave and True** by Daniel Higginbotham. Free online.

### Papers and Articles

- **"Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I"** by John McCarthy (CACM, April 1960). The founding document. Introduces Lisp, eval, and the meta-circular evaluator.
- **"Lambda: The Ultimate Imperative"** by Steele and Sussman (1976). One of the "Lambda Papers" that laid the groundwork for Scheme.
- **"The Art of the Interpreter"** by Steele and Sussman (1978). Another of the Lambda Papers; still worth reading.
- **"Beating the Averages"** by Paul Graham (2001). Why Lisp gave Viaweb the edge.
- **"The Next 700 Programming Languages"** by Peter Landin (1966). Classic PL paper that shaped how we think about languages, including Lisp's place in the family.
- **"Languages as Libraries"** by Tobin-Hochstadt, St-Amour, Culpepper, Flatt, and Felleisen (PLDI 2011). Racket's approach to language-oriented programming.
- **"Hygienic Macros Through Explicit Renaming"** by William Clinger (1991). How hygiene works.
- **"Macros That Work"** by Clinger and Rees (POPL 1991). Another hygiene paper.

### Online Resources

- **Common Lisp Cookbook** — cl-cookbook.sourceforge.io. Practical recipes.
- **Paul Graham's essays** — paulgraham.com, especially "Revenge of the Nerds" and "What Made Lisp Different."
- **The Scheme wiki** — community.schemewiki.org.
- **Clojure Docs** — clojuredocs.org. Community-annotated Clojure standard library.
- **Racket Package Catalog** — pkgs.racket-lang.org.
- **Quicklisp** — quicklisp.org. The Common Lisp package manager.

---

## Closing Thoughts

Lisp is not "a language." It is a family of languages connected by shared DNA: S-expressions, the lambda calculus, homoiconicity, macros, and the image-based REPL worldview. Each dialect has its own personality — Common Lisp is the industrial tank, Scheme is the minimalist research vehicle, Clojure is the functional data-driven toolkit for the JVM, Racket is the playground for language inventors — but they all share the same core insight.

The insight is this: **code is data**. A program is not a string of characters to be compiled into opaque machine code. A program is a tree of symbols you can manipulate with the same tools you use to manipulate any other tree. The compiler is a library you can call. The runtime is a library you can extend. The evaluator is a function you can redefine. There is no privileged layer.

This is why Lisp is the birthplace of modern AI programming and meta-languages. When you need a system that can reason about its own code — generate it, transform it, verify it, execute it, and generate more based on what it learned — you want a language where code is already a data structure. You want the reader, the evaluator, and the printer to be plain functions. You want macros that run at compile time and functions that run at runtime to share the same substrate. You want to be able to prototype a new language in an afternoon and ship it as a library.

All of this is Lisp. Has been since 1960.

Every generation of programmers rediscovers Lisp and gets excited. Graham in the 90s, Hickey with Clojure in the 2000s, the Racket team with Language-Oriented Programming in the 2010s, the Julia community with CLOS-style multiple dispatch. The ideas keep coming back because the ideas are right. The parentheses are not the problem. The parentheses are the feature: they are what let you write a program that reads another program without a parser, transform it without a visitor pattern, evaluate it without a special runtime, and extend the language without a compiler change.

If you want to understand where programming languages came from, read the 1960 paper. If you want to understand where they are going, read the Racket papers. In between, write your own Lisp. It's the single most educational exercise in the field.

Lisp is the meta-language. Everything else is an approximation.

---

## Study Guide — Lisp Language & Metaprogramming

### Key concepts

1. **S-expressions.** `(f x y)` is both syntax and data.
2. **`eval` and `apply`.** The core of the Lisp interpreter
   fits on one page.
3. **Macros.** Compile-time code transformations written in
   the same language.
4. **Hygienic macros.** Scheme's `syntax-rules` and
   `syntax-case` avoid variable capture.
5. **Continuations.** `call/cc` in Scheme gives you
   first-class control flow.

---

## Programming Examples

### Example 1 — Scheme factorial

```scheme
(define (factorial n)
  (if (<= n 1)
      1
      (* n (factorial (- n 1)))))
```

### Example 2 — A Common Lisp macro

```lisp
(defmacro unless (test &body body)
  `(if (not ,test)
       (progn ,@body)))

(unless (> 5 10)
  (print "five is not greater than ten"))
```

Macros are code transformations, evaluated at compile time.

### Example 3 — Clojure threading

```clojure
(->> (range 100)
     (filter even?)
     (map #(* % %))
     (reduce +))
```

---

## DIY & TRY

### DIY 1 — Write meval

Implement a Lisp interpreter in Lisp. 100 lines of Common
Lisp or Scheme. This is the most educational exercise in
all of programming.

### DIY 2 — Build a hygienic macro

Write `swap!` in Scheme that swaps two variables without
introducing accidental captures. Observe the difference
between `define-syntax` and `defmacro`.

### TRY — Rewrite a Python decorator as a Lisp macro

Pick any Python decorator you've used. Rewrite it as a
Common Lisp macro. Compare: the Lisp macro runs at compile
time and generates code; the Python decorator is a runtime
wrapper.

---

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
