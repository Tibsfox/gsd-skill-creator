# Java: Language Core and Object-Oriented Model

*PNW Research Series — Java, Part 1 of N*

Java is a statically typed, class-based, garbage-collected language designed in the early 1990s at Sun Microsystems by a team led by James Gosling. It was first released publicly in 1995 and has since become one of the most widely deployed languages in the history of computing, running on everything from smart cards to high-frequency trading platforms to Android devices. The language has evolved substantially since then, but its central commitments — portability, safety, and a familiar C-like surface syntax over a disciplined object model — remain recognizable across three decades of releases.

This document covers the core language and its object-oriented model from the ground up. It assumes the reader has seen C or C++ before and is interested in what Java kept, what it discarded, and how its decisions continue to shape the shape of modern Java code.

---

## 1. Design philosophy

When James Gosling and Henry McGilton published *The Java Language Environment* in May 1996, they framed the language with a now-famous list of adjectives: "simple, object-oriented, and familiar; robust and secure; architecture-neutral and portable; high-performance; interpreted, threaded, and dynamic." That white paper is still the clearest single statement of Java's goals, and it reads like a point-by-point reaction to the pain of writing large C++ systems in the late 1980s and early 1990s.

**Simple, object-oriented, and familiar.** Simplicity meant "fewer lurking surprises," not "fewer features." Familiarity meant C-like syntax: curly braces, semicolons, `if`/`while`/`for`, the same operator precedence table. A C programmer should be able to read a Java source file on day one and guess correctly what most of it does. Object-oriented meant classes, single inheritance, interfaces, and dynamic dispatch as the default — not the bolt-on classes of early C++.

**What Java deliberately removed from C++.**

- **Multiple inheritance of implementation.** C++'s diamond problem, virtual bases, and ambiguity rules were judged too complicated for their benefit. Java allows multiple interface inheritance only, deferring implementation inheritance to the single-parent chain.
- **Operator overloading.** Except for `+` on `String`, operators cannot be redefined. Gosling argued that operator overloading made C++ code harder to read because the meaning of `a + b` depended on types that might be off-screen.
- **Explicit pointers.** There is no pointer arithmetic, no `&` address-of, no `*` dereference. Objects are accessed through references, and references cannot be forged from integers.
- **Manual memory management.** No `malloc`, no `free`, no `delete`. The garbage collector reclaims unreachable objects. Destructors were replaced (badly, in retrospect) with `finalize`, now deprecated.
- **Header files and the preprocessor.** No `#include`, no `#define`, no conditional compilation at the source level. Type information lives in `.class` files and is loaded on demand by the class loader.
- **Templates (initially).** Java 1.0 through 1.4 had no generics. They were added in Java 5 via type erasure — a compromise that preserved binary compatibility at the cost of runtime type information.
- **`goto`.** Reserved as a keyword but not implemented. Labeled `break` and `continue` fill the few real use cases.
- **Structs and unions.** Everything is a class or a primitive. There is no unboxed composite until Valhalla's value types arrive.

**What Java deliberately kept.**

- **C-like syntax.** Curly braces, semicolons, familiar control flow.
- **Primitive types.** For arithmetic performance, Java kept `int`, `long`, `float`, `double`, etc., rather than making everything an object.
- **Static typing.** Every expression has a known type at compile time. There is no `auto` that defers to runtime (though Java 10's `var` adds compile-time inference).
- **Class-based OOP.** Not prototypes, not mixins. Classes, methods, and single inheritance.

**Write once, run anywhere.** This was the marketing slogan, but it was also a hard engineering constraint. The Java source compiler emits bytecode (`.class` files) targeting an abstract stack machine — the Java Virtual Machine. The JVM is then implemented on each host platform. Because the bytecode is well-specified and the platform libraries are shipped with the JDK, the same `.jar` file runs on Windows, Linux, macOS, Solaris, and dozens of embedded systems without recompilation. "Write once, debug everywhere" became a rueful joke among early adopters, but the fundamental design held: a Java program written in 1998 can usually still run on a 2025 JVM.

---

## 2. Basic types and the type system

Java's type system has two disjoint worlds: **primitives** and **reference types**. Primitives are unboxed value types that sit directly on the stack or inside objects. Reference types are pointers (internally) to heap-allocated objects.

**Primitive types.**

| Type      | Size     | Range                                           |
|-----------|----------|-------------------------------------------------|
| `byte`    | 8 bits   | -128 to 127                                     |
| `short`   | 16 bits  | -32,768 to 32,767                               |
| `int`     | 32 bits  | -2,147,483,648 to 2,147,483,647                 |
| `long`    | 64 bits  | -9.2 × 10^18 to 9.2 × 10^18                     |
| `float`   | 32 bits  | IEEE 754 single precision                       |
| `double`  | 64 bits  | IEEE 754 double precision                       |
| `char`    | 16 bits  | UTF-16 code unit, 0 to 65,535                   |
| `boolean` | 1 bit    | `true` or `false`                               |

Every primitive has a guaranteed size and range across all JVMs. This was a sharp break from C, where `int` might be 16 or 32 bits depending on the platform.

**Wrapper classes.** Each primitive has a corresponding reference type: `Byte`, `Short`, `Integer`, `Long`, `Float`, `Double`, `Character`, `Boolean`. These are immutable classes that box a single primitive value. Before Java 5, you had to convert manually: `Integer.valueOf(42)` to box, `someInteger.intValue()` to unbox.

**Autoboxing and unboxing (Java 5).** Since 2004, the compiler inserts these conversions automatically: `Integer i = 42;` boxes, `int n = i;` unboxes. Autoboxing makes generics over numeric types usable (`List<Integer>`) but introduces subtle performance and equality traps. `Integer a = 128; Integer b = 128; a == b` is `false` because 128 is outside the cached range; `a.equals(b)` is `true`.

**`String`.** Strings are objects of type `java.lang.String`, immutable, and internally stored as UTF-16 code units until Java 9, when JEP 254 introduced "compact strings" — Latin-1 when possible, UTF-16 otherwise — for a significant memory saving on typical workloads. The `+` operator is overloaded for strings (the only operator overload the language allows) and compiles to `StringBuilder` calls.

**Arrays.** Arrays in Java are objects. `int[] xs = new int[10]` allocates a heap object whose class is (roughly) `int[]`, a direct subclass of `Object`. Arrays carry their length at runtime (`xs.length`), are bounds-checked on every access, and are covariant — `Object[] os = new String[10]` compiles, with a runtime `ArrayStoreException` if you try to store a non-String. This was a famous early mistake: array covariance is unsound but was kept for `Arrays.sort` and similar APIs that predated generics.

**`null` and the billion-dollar mistake.** Tony Hoare called null references his "billion-dollar mistake" — the unchecked null reference, which he invented for ALGOL W in 1965. Java inherited it whole. Any reference variable can be `null`, and dereferencing null throws `NullPointerException`. Decades of Java APIs, including the standard library, use null as a sentinel for "no value." Modern Java has tools (`Optional`, nullability annotations, pattern matching, Valhalla's eventual value classes) that mitigate the problem without removing null.

**`var` — local variable type inference (Java 10).** JEP 286 added `var` for local variable declarations:

```java
var list = new ArrayList<String>();   // inferred as ArrayList<String>
var length = list.size();             // inferred as int
```

`var` is not a dynamic type. The compiler infers the exact static type from the initializer and bakes it into the bytecode. `var` is not allowed for fields, method parameters, or return types — Brian Goetz and the JEP explicitly scoped it to locals to keep API signatures explicit.

**Static typing, no structural typing.** Java is nominally typed: two types are compatible only if one is declared to be a subtype of the other. Duck typing exists only where the compiler can see it at compile time (functional interfaces, pattern matching). The JVM itself is typed — every slot in every stack frame has a known type, and the bytecode verifier rejects classes that violate those types before they ever run.

---

## 3. Classes and objects

Classes are the unit of code organization in Java. A source file `Foo.java` typically declares one public class `Foo` plus any number of package-private helpers. The compiler produces one `.class` file per class.

```java
package com.example.geometry;

public final class Point {
    private final double x;
    private final double y;

    public Point(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public double x() { return x; }
    public double y() { return y; }

    public double distanceTo(Point other) {
        double dx = x - other.x;
        double dy = y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Point p)) return false;
        return Double.compare(x, p.x) == 0 && Double.compare(y, p.y) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }

    @Override
    public String toString() {
        return "Point[x=" + x + ", y=" + y + "]";
    }
}
```

**Fields, methods, constructors.** Fields hold per-instance state. Methods encapsulate behavior. Constructors are special methods (same name as the class, no return type) that initialize new instances.

**Initializer blocks.** A class can have static and instance initializer blocks that run during class loading and object construction, respectively. They are a legacy mechanism mostly replaced by field initializers and constructors, but they remain the only way to do multi-statement static setup without a helper method.

```java
static {
    try {
        System.loadLibrary("native");
    } catch (UnsatisfiedLinkError e) {
        // handle
    }
}
```

**Access modifiers.**

- `public` — visible everywhere
- `protected` — visible to the package and to subclasses (even in other packages)
- *(default, package-private)* — visible only within the package
- `private` — visible only within the enclosing top-level class (including nested classes)

Package-private is the default when no modifier is specified, and it's often the right choice for helper classes. The absence of a "friend" mechanism makes the package the primary unit of encapsulation.

**`this` and `super`.** `this` refers to the current instance. `super` refers to the immediate superclass and is used mainly for calling overridden methods or invoking a superclass constructor.

**Static members.** Fields and methods marked `static` belong to the class, not to instances. `Math.sqrt(2)` is a static method; `System.out` is a static field. Static members are accessed via the class name by convention.

**`final`.** `final` on a field means it can be assigned only once (typically in the constructor); the reference cannot be reseated, though mutable objects reached through it can still change. `final` on a method means it cannot be overridden. `final` on a class means it cannot be subclassed. `String`, `Integer`, and all the wrapper classes are `final`.

**`abstract`.** An abstract class cannot be instantiated directly. It may contain abstract methods — method signatures without bodies — which concrete subclasses must implement. Abstract classes are used for partial implementations shared by multiple concrete subclasses.

**Inner classes.** Java has four flavors of nested class:

- **Static nested classes** — declared inside another class with `static`; behave like top-level classes that happen to live in a namespace.
- **Inner classes** (non-static nested) — carry an implicit reference to an enclosing instance. Commonly used for iterators, listeners, and helpers that need access to the outer state.
- **Local classes** — declared inside a method, visible only within it.
- **Anonymous classes** — declared and instantiated in one expression; used before lambdas for event listeners and the like.

**Method overloading.** A class can have multiple methods with the same name but different parameter lists. Overload resolution happens at compile time based on static types, not dynamic. Return type alone is not enough to distinguish overloads.

**Constructor chaining.** Within a class, `this(...)` as the first statement of a constructor calls another constructor of the same class. `super(...)` calls a superclass constructor. Every constructor implicitly calls `super()` if you don't specify one.

---

## 4. The four pillars, as Java implements them

Object-oriented programming textbooks often list four pillars: encapsulation, inheritance, polymorphism, and abstraction. Java's implementation of each is opinionated.

**Encapsulation.** Java's default idiom is "private fields, public getters and setters" — the JavaBeans convention, codified in 1996. A class hides its state behind an interface of methods, so implementation changes don't break callers. Modern Java has relaxed this discipline (records auto-generate accessors, and many modern APIs expose immutable value objects directly), but the convention still dominates enterprise code.

**Inheritance.** Single inheritance of implementation only. Every class except `Object` has exactly one direct superclass. A class may implement any number of interfaces. This was a deliberate simplification from C++; multiple inheritance of implementation was judged too complex for the use cases it supported.

**Polymorphism.** Dynamic dispatch is the default in Java. Every non-private, non-static, non-final instance method is virtual — the actual method called depends on the runtime type of the receiver, not the declared type. This is the opposite of C++, where methods are non-virtual unless marked `virtual`. Java's approach makes code more uniformly polymorphic but can confuse programmers who expect C++ semantics.

**Abstraction.** Achieved through abstract classes (for partial implementations) and interfaces (for pure contracts). Since Java 8, interfaces can carry default methods, so the boundary between abstract class and interface has blurred.

---

## 5. Inheritance and the class hierarchy

Every class in Java ultimately extends `java.lang.Object`, the root of the hierarchy. `Object` provides a small set of methods that every object inherits:

- `public boolean equals(Object other)` — structural equality; default is reference equality.
- `public int hashCode()` — hash consistent with `equals`.
- `public String toString()` — a string representation, default is `ClassName@hex`.
- `public final Class<?> getClass()` — runtime class token.
- `protected Object clone()` — shallow copy, if `Cloneable` is implemented.
- `protected void finalize()` — called by the GC before reclamation (deprecated since Java 9, slated for removal).
- `public final void wait()`, `notify()`, `notifyAll()` — intrinsic monitor operations.

The contracts on `equals`/`hashCode` are legendary sources of bugs: `equals` must be reflexive, symmetric, transitive, and consistent, and two equal objects must have equal hash codes. Joshua Bloch devoted two entire items of *Effective Java* to these methods.

**Single inheritance via `extends`.**

```java
public class Animal {
    protected String name;
    public Animal(String name) { this.name = name; }
    public String speak() { return "..."; }
}

public class Dog extends Animal {
    public Dog(String name) { super(name); }
    @Override
    public String speak() { return "woof"; }
}
```

**No multiple inheritance of implementation.** You cannot `extends A, B`. If you need behavior from multiple sources, you use interfaces with default methods or delegation.

**`super.methodName()`** calls the base class implementation, useful in overridden methods that want to add to (rather than replace) parent behavior.

**Abstract classes as partial implementations.**

```java
public abstract class Shape {
    public abstract double area();
    public double perimeter() { return 0; } // default if unknown
    @Override
    public String toString() {
        return getClass().getSimpleName() + "(area=" + area() + ")";
    }
}
```

**Initialization order.** When `new Dog("Rex")` runs:
1. Memory is allocated and all fields are zeroed.
2. The superclass constructor chain runs top-down, starting from `Object`.
3. Instance initializer blocks and field initializers run in source order for each class on the way down.
4. The body of the most derived constructor finishes.

Within a constructor, calling a method that's overridden in a subclass can see half-initialized state — one of the subtler Java footguns, and a reason *Effective Java* counsels against calling non-final methods from constructors.

---

## 6. Interfaces

Interfaces are Java's mechanism for multiple inheritance of *type*. A class can `implement` any number of interfaces, and instances can be treated polymorphically through any of them.

```java
public interface Comparable<T> {
    int compareTo(T other);
}

public interface Serializable {}   // marker interface, no methods

public interface Runnable {
    void run();
}
```

**Default methods (Java 8).** Before Java 8, adding a method to an interface was a breaking change — every implementing class had to be updated. Default methods fix this by allowing a method body on the interface itself.

```java
public interface Greeter {
    String name();
    default String greeting() {
        return "Hello, " + name();
    }
}
```

Default methods were added specifically so the `Collection` hierarchy could evolve to support streams without breaking the thousands of existing `Collection` implementations in the wild. `Collection.stream()` is a default method on the `Collection` interface.

**Static methods on interfaces (Java 8).** Interfaces can have static helper methods:

```java
public interface Comparator<T> {
    int compare(T a, T b);
    static <T extends Comparable<T>> Comparator<T> naturalOrder() {
        return Comparable::compareTo;
    }
}
```

**Private methods on interfaces (Java 9).** Default methods often want to share helper code without exposing it. Java 9 allows `private` methods in interfaces for this purpose.

**Marker interfaces.** Interfaces with no methods, used to tag classes: `Serializable`, `Cloneable`, `RandomAccess`. Modern Java prefers annotations for this role, but the classics remain.

**Functional interfaces (Java 8).** An interface with exactly one abstract method is a *functional interface*, which means lambdas and method references can be used anywhere an instance of the interface is expected. The `@FunctionalInterface` annotation makes this explicit and causes a compile error if the SAM (Single Abstract Method) property is violated:

```java
@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);
}
```

The `java.util.function` package ships dozens of standard functional interfaces: `Function<T,R>`, `BiFunction<T,U,R>`, `Predicate<T>`, `Consumer<T>`, `Supplier<T>`, and their primitive specializations.

**Sealed interfaces (Java 17).** A sealed interface restricts which classes or interfaces may implement it:

```java
public sealed interface Shape permits Circle, Square, Triangle {}
```

Combined with pattern matching, sealed interfaces enable exhaustive switches over closed hierarchies.

---

## 7. Generics (Java 5)

Before Java 5, collections held `Object` references, and users were responsible for casting on retrieval. Runtime `ClassCastException`s were everywhere. Generics were added to push that type checking up to compile time.

```java
List<String> names = new ArrayList<String>();
names.add("Ada");
String first = names.get(0); // no cast required
```

**Type erasure.** Java's generics are a compile-time feature. At runtime, `List<String>` and `List<Integer>` are both just `List`. The compiler inserts casts on reads and verifies writes, then erases the type parameters. This was a pragmatic choice: existing `.class` files had to continue working, and erasure let every pre-generics class be generic-compatible without modification. It also means you cannot ask "is this a `List<String>`?" at runtime. You can ask "is this a `List`?" — the erased raw type is all the JVM knows.

**Wildcards.** Sometimes you want "a list of some subtype of Number" or "some supertype of Integer." Wildcards express this:

```java
List<? extends Number> numbers; // can read Number, cannot write
List<? super Integer> sink;     // can write Integer, reads give Object
```

**The PECS rule — Producer Extends, Consumer Super.** Joshua Bloch's mnemonic: if a collection *produces* values you'll read, use `? extends T`; if it *consumes* values you'll write, use `? super T`. Example:

```java
public static <T> void copy(List<? extends T> src, List<? super T> dst) {
    for (T item : src) {
        dst.add(item);
    }
}
```

**Bounded type parameters.**

```java
public static <T extends Comparable<T>> T max(List<T> list) {
    T best = list.get(0);
    for (T x : list) if (x.compareTo(best) > 0) best = x;
    return best;
}
```

**Generic methods.** A method can have its own type parameters independent of the class:

```java
public static <K, V> Map<V, K> invert(Map<K, V> input) { ... }
```

**The diamond operator (Java 7).** Before Java 7: `Map<String, List<Integer>> m = new HashMap<String, List<Integer>>();`. After: `Map<String, List<Integer>> m = new HashMap<>();`. The compiler infers the type arguments from the target type.

**Reification and its limitations.** Because of erasure, you cannot:
- Create an array of a generic type: `new T[10]` is a compile error.
- Use `instanceof` on a parameterized type: `x instanceof List<String>` is not allowed (you can write `x instanceof List<?>`).
- Catch exceptions of a generic type.
- Use primitives as type arguments: `List<int>` is illegal. You must box: `List<Integer>`.

**Who built this.** The generics proposal that Java adopted came primarily from Gilad Bracha, Martin Odersky, David Stoutamire, and Philip Wadler. Odersky's earlier work on GJ (Generic Java) was the direct foundation for JSR 14. Odersky later took what he learned into Scala, which kept the erasure model but added a richer type system on top.

---

## 8. Collections Framework

The Collections Framework, designed primarily by Doug Lea and Joshua Bloch for Java 1.2 (1998), gave Java a consistent set of data structures and algorithms. It replaced the ad-hoc `Vector`, `Hashtable`, and `Enumeration` of Java 1.0 and 1.1 with a clean hierarchy of interfaces, default implementations, and utility methods.

**The core interface hierarchy.**

```
Iterable
  └── Collection
       ├── List       (ordered, index-accessible)
       ├── Set        (no duplicates)
       │    └── SortedSet
       │         └── NavigableSet
       └── Queue
            └── Deque

Map (not a Collection)
 └── SortedMap
      └── NavigableMap
```

`Map` is deliberately *not* a `Collection` — it's a mapping between keys and values, not a collection of elements.

**Standard implementations.**

- `ArrayList` — resizable array. Fast indexed access, amortized O(1) append.
- `LinkedList` — doubly linked list. O(1) insertion/removal at either end, O(n) random access. Rarely the right choice in practice.
- `HashSet` — hash-based set, O(1) average ops.
- `TreeSet` — red-black tree, sorted iteration, O(log n) ops.
- `LinkedHashSet` — hash set that preserves insertion order.
- `HashMap` — the workhorse of Java collections, O(1) average.
- `TreeMap` — sorted map based on red-black trees.
- `LinkedHashMap` — hash map with predictable iteration order; the standard LRU cache base class.
- `ArrayDeque` — array-backed deque, now preferred over `Stack` and `LinkedList` for stack/queue use.
- `PriorityQueue` — binary heap.

**The `Collections` utility class.** Static methods: `sort`, `shuffle`, `reverse`, `binarySearch`, `min`, `max`, `unmodifiableList`, `synchronizedList`, `emptyList`, `singletonList`, `frequency`, `disjoint`.

**Iteration.** Every collection implements `Iterable<T>`, so the enhanced `for` loop works:

```java
for (String name : names) {
    System.out.println(name);
}
```

**Synchronized vs concurrent.** `Collections.synchronizedMap(m)` wraps a map with a single lock around every method — simple, but a bottleneck under contention. `ConcurrentHashMap` uses finer-grained locking (originally lock striping, now CAS-based since Java 8) and scales dramatically better on multi-core systems.

**Fail-fast vs fail-safe iterators.** Standard collection iterators are *fail-fast*: if the collection is structurally modified during iteration (except through the iterator's own `remove`), they throw `ConcurrentModificationException`. `CopyOnWriteArrayList` and `ConcurrentHashMap` provide *weakly consistent* (fail-safe) iterators that tolerate concurrent modification at the cost of potentially missing updates.

---

## 9. Exceptions

Java has a three-level exception hierarchy:

```
Throwable
 ├── Error                  (unchecked, for VM-level problems)
 │    ├── OutOfMemoryError
 │    └── StackOverflowError
 └── Exception
      ├── RuntimeException  (unchecked)
      │    ├── NullPointerException
      │    ├── IllegalArgumentException
      │    └── IndexOutOfBoundsException
      └── ... other checked exceptions (IOException, SQLException, ...)
```

**Checked vs unchecked.** Checked exceptions (anything under `Exception` but not `RuntimeException`) must be either caught or declared in the method's `throws` clause. The compiler enforces this. Unchecked exceptions have no such requirement.

**Syntax.**

```java
try {
    var input = Files.readString(Path.of("config.json"));
    return parse(input);
} catch (NoSuchFileException e) {
    return defaultConfig();
} catch (IOException e) {
    throw new ConfigLoadException("failed to load config", e);
} finally {
    cleanup();
}
```

**Try-with-resources (Java 7).** Any class implementing `AutoCloseable` can be declared in a `try` header and will be closed automatically:

```java
try (var reader = Files.newBufferedReader(path)) {
    return reader.lines().toList();
}
```

**Multi-catch (Java 7).** A single catch clause can handle several exception types:

```java
try { ... }
catch (IOException | SQLException e) { ... }
```

**The checked exception debate.** Java is the only mainstream language that requires checked exceptions to be declared in method signatures. The intent was to make error handling explicit; the reality was that many APIs (especially library-level abstractions) ended up with `throws IOException, SQLException, InterruptedException, ...` clauses that infected every caller. Lambdas made this worse — functional interfaces in `java.util.function` don't declare exceptions, so any checked exception thrown from a lambda must be wrapped. Many working Java programmers and most post-Java languages (Scala, Kotlin, C#) dropped checked exceptions entirely. Within the Java community the consensus is mixed but leans "net mistake."

**Exception chaining.** `throw new MyException("context", cause)` or `e.initCause(cause)` preserves the original exception as a cause. Stack traces print the full chain, which is essential when diagnosing wrapped errors.

---

## 10. Lambda expressions and functional interfaces (Java 8)

Lambdas arrived in March 2014 with Java 8 — Java's biggest language change since generics. A lambda is a compact way to create an instance of a functional interface.

```java
Runnable r = () -> System.out.println("hello");
Comparator<String> byLen = (a, b) -> a.length() - b.length();
Function<Integer, Integer> square = x -> x * x;
```

**Method references.** When a lambda just forwards to an existing method, you can write the reference directly:

```java
names.forEach(System.out::println);
list.sort(String::compareToIgnoreCase);
var ctor = ArrayList<String>::new;
```

The four forms: `Class::staticMethod`, `instance::method`, `Class::instanceMethod` (the first argument becomes the receiver), and `Class::new` (constructor reference).

**Closures over effectively final variables.** A lambda may capture local variables from its enclosing scope, but only if they are *effectively final* — assigned once and never reassigned. This is a cleaner restriction than true closure over mutable state: no shared mutable hazards, and the compiler can lift the variable cleanly.

```java
int threshold = 10;
list.stream().filter(x -> x > threshold).count();
// threshold is never reassigned, so the lambda captures it.
```

**Target typing.** The same lambda can have different types depending on context:

```java
Runnable r = () -> doWork();
Callable<Void> c = () -> { doWork(); return null; };
```

The compiler picks the target type from the assignment, parameter, or return context and checks the lambda against it.

**Passing behavior to streams.** The real point of lambdas was to make stream pipelines readable:

```java
int totalLength = words.stream()
    .filter(w -> !w.isEmpty())
    .mapToInt(String::length)
    .sum();
```

---

## 11. Streams (Java 8)

The Streams API lives in `java.util.stream`. A `Stream<T>` is a lazy pipeline of values that flows from a source through zero or more intermediate operations to a single terminal operation. Streams are not data structures; they do not store elements.

**Stream sources.**

```java
Stream.of("a", "b", "c");
list.stream();
Arrays.stream(new int[]{1, 2, 3});
Stream.generate(Math::random).limit(10);
Stream.iterate(1, x -> x * 2).limit(20);
Files.lines(path);
```

**Intermediate operations** (return a new `Stream`, lazy):

- `filter(predicate)` — keep matching elements
- `map(function)` — transform each element
- `flatMap(function)` — map then flatten nested streams
- `distinct()` — remove duplicates
- `sorted()` / `sorted(comparator)` — sort
- `peek(consumer)` — side effect without changing the stream, mainly for debugging
- `limit(n)` / `skip(n)` — truncate / drop prefix

**Terminal operations** (trigger execution, consume the stream):

- `forEach`, `forEachOrdered`
- `toArray`, `collect`, `toList` (Java 16)
- `reduce`, `min`, `max`, `count`
- `anyMatch`, `allMatch`, `noneMatch`
- `findFirst`, `findAny`

**Collectors.** The `java.util.stream.Collectors` class provides pre-built reductions:

```java
Map<Department, List<Employee>> byDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::department));

Map<Boolean, List<Employee>> partitioned = employees.stream()
    .collect(Collectors.partitioningBy(e -> e.salary() > 100_000));

String csv = names.stream().collect(Collectors.joining(", "));
```

Key collectors: `toList`, `toSet`, `toMap`, `toUnmodifiableList`, `groupingBy`, `partitioningBy`, `joining`, `counting`, `summingInt`, `averagingDouble`, `mapping`, `reducing`.

**Primitive streams.** `IntStream`, `LongStream`, `DoubleStream` avoid the boxing overhead of `Stream<Integer>` for numeric computations and add range factories:

```java
int sum = IntStream.rangeClosed(1, 100).sum();
```

**Parallel streams.** Any stream can be made parallel: `collection.parallelStream()` or `stream.parallel()`. Under the hood, parallel streams use the common `ForkJoinPool` to split the work. They are powerful but trap-laden: they require associative reduction operations, they can deadlock if used inside a FJP task, and they often perform worse than sequential streams for small or irregular workloads.

**Stream gatherers (Java 22).** JEP 461 added `Stream.gather(Gatherer)`, a new kind of user-extensible intermediate operation. Gatherers let library authors write custom stateful transformations (windowing, running totals, deduplication by key) without subclassing.

**What streams are not.** Streams are declarative descriptions of data transformations. They are *not* a replacement for all loops. For single-pass side effects, mutation of external state, or performance-critical hot loops, a traditional `for` is still the right tool. Brian Goetz (the language architect who led stream design) has repeatedly said: use streams when the code reads more clearly as "what" than as "how."

---

## 12. Optional (Java 8)

`Optional<T>` is a container that either holds a value or does not. It was introduced to give APIs a way to express "no result" without returning `null`.

```java
Optional<User> findUser(String id);
```

**Creating.** `Optional.of(x)` throws if `x` is null; `Optional.ofNullable(x)` returns empty for null; `Optional.empty()` returns the shared empty instance.

**Chaining.**

```java
String displayName = findUser(id)
    .map(User::profile)
    .map(Profile::displayName)
    .filter(name -> !name.isEmpty())
    .orElse("anonymous");
```

**Terminal operations.** `get()` (dangerous — throws if empty), `orElse(defaultValue)`, `orElseGet(supplier)` (lazy), `orElseThrow(exceptionSupplier)`, `ifPresent(consumer)`, `ifPresentOrElse(consumer, runnable)` (Java 9).

**Brian Goetz's guidance.** Optional was explicitly designed as a *return type* for methods that may have no result. It was not intended as a field type, not as a parameter type, and not as a general "maybe" wrapper. Using Optional as a field is particularly bad because it isn't Serializable and adds pointer overhead for no benefit — use `null` in fields and return `Optional` when handing the value out.

---

## 13. Records (Java 14 preview, Java 16 standard)

Records, introduced as a preview in Java 14 and finalized in Java 16, are Java's answer to the "data carrier" problem. A record compactly declares an immutable aggregate of named, typed components:

```java
public record Point(double x, double y) {}
```

From this one line, the compiler generates:
- A canonical constructor `Point(double x, double y)`
- Private final fields for `x` and `y`
- Public accessor methods `x()` and `y()` (note: not `getX()`)
- `equals(Object)` based on all components
- `hashCode()` consistent with `equals`
- `toString()` producing `Point[x=1.0, y=2.0]`

**Compact constructors.** For validation or normalization:

```java
public record Range(int low, int high) {
    public Range {
        if (low > high) throw new IllegalArgumentException("low > high");
    }
}
```

The compact constructor has no parameter list — it operates on the implicit parameters and the compiler inserts the field assignments after the body.

**Records are implicitly final.** You cannot extend a record. You can declare a record inside a class, inside a method, or at the top level. Records can implement interfaces but cannot extend other classes (they implicitly extend `java.lang.Record`).

**Use cases.** DTOs, map keys, method return tuples, event envelopes, AST nodes. Combined with sealed interfaces and pattern matching, records enable a lightweight algebraic-data-type style.

```java
public sealed interface Expr permits Num, Add, Mul {}
public record Num(double value) implements Expr {}
public record Add(Expr left, Expr right) implements Expr {}
public record Mul(Expr left, Expr right) implements Expr {}
```

---

## 14. Sealed classes (Java 15 preview, Java 17 standard)

A sealed class or interface restricts which other classes can extend or implement it. The permitted subclasses are listed explicitly:

```java
public sealed class Shape permits Circle, Square, Triangle {}

public final class Circle extends Shape { ... }
public final class Square extends Shape { ... }
public non-sealed class Triangle extends Shape { ... }
```

Each permitted subclass must be declared `final`, `sealed`, or `non-sealed`. `non-sealed` explicitly reopens the hierarchy below that point.

**Why.** Before sealed classes, there was no way to declare "this is a closed set of possibilities." You either had to use an enum (which can't carry per-case data gracefully) or trust that nobody would subclass your abstract class. With sealed classes, the compiler knows the full set of subtypes and can enforce exhaustiveness on pattern-matching switches.

```java
double area(Shape s) {
    return switch (s) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Square q -> q.side() * q.side();
        case Triangle t -> 0.5 * t.base() * t.height();
    };
}
```

No `default` is needed because the compiler can prove the switch is exhaustive over the permitted subclasses.

---

## 15. Pattern matching

Pattern matching in Java arrived incrementally from Java 14 through Java 21, following an amber-themed JEP series (Project Amber).

**`instanceof` patterns (Java 16).** Previously: `if (obj instanceof String) { String s = (String) obj; ... }`. Now:

```java
if (obj instanceof String s && !s.isEmpty()) {
    System.out.println(s.toUpperCase());
}
```

The pattern binding `s` is in scope wherever the compiler can prove the test succeeded.

**Switch expressions (Java 14).** Switches became expressions (returning a value) and gained an arrow syntax that eliminates fall-through:

```java
int days = switch (month) {
    case JAN, MAR, MAY, JUL, AUG, OCT, DEC -> 31;
    case APR, JUN, SEP, NOV -> 30;
    case FEB -> isLeap(year) ? 29 : 28;
};
```

**Switch patterns (Java 21).** `case` labels can now be patterns:

```java
String describe(Object o) {
    return switch (o) {
        case null -> "nothing";
        case Integer i when i < 0 -> "negative int";
        case Integer i -> "int " + i;
        case String s -> "string of length " + s.length();
        case int[] arr -> "int array of length " + arr.length;
        default -> "something else";
    };
}
```

The `when` clause adds a guard: the case matches only if the pattern binds and the guard is true.

**Record deconstruction (Java 21).** Record patterns let you pull components out while matching:

```java
double length(Expr e) {
    return switch (e) {
        case Num(double v) -> v;
        case Add(Expr l, Expr r) -> length(l) + length(r);
        case Mul(Expr l, Expr r) -> length(l) * length(r);
    };
}
```

Patterns can nest: `case Add(Num(double a), Num(double b))` matches only if both sides of the Add are Num records, binding `a` and `b`.

**Null patterns.** A `case null` label is now allowed inside switches that opt in, eliminating the "always throw NPE on null switches" historical quirk.

---

## 16. Enums (Java 5)

Java enums are full-fledged classes with a fixed set of instances:

```java
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS  (4.869e+24, 6.0518e6),
    EARTH  (5.976e+24, 6.37814e6);

    private final double mass;
    private final double radius;

    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    public double surfaceGravity() {
        return 6.67300E-11 * mass / (radius * radius);
    }
}
```

Enum constructors are implicitly private (you cannot create new instances). Each enum automatically gets `values()` (returns all constants in declaration order), `valueOf(String)` (parses a name), `name()`, and `ordinal()` (0-based position).

**Enums with abstract methods.** Each constant can override methods, giving you type-safe strategy-style dispatch:

```java
public enum Operation {
    PLUS  { public double apply(double a, double b) { return a + b; } },
    MINUS { public double apply(double a, double b) { return a - b; } },
    TIMES { public double apply(double a, double b) { return a * b; } };

    public abstract double apply(double a, double b);
}
```

**`EnumSet` and `EnumMap`.** Specialized, extremely efficient collections keyed by enum type. `EnumSet` uses a bit vector; `EnumMap` uses an ordinal-indexed array.

**The enum singleton.** Joshua Bloch recommended enums as the simplest and safest way to implement a singleton — a single-element enum provides serialization safety and protection against reflection attacks for free.

---

## 17. Annotations

Annotations were added in Java 5 (JSR 175). They are metadata that can be attached to declarations and, since Java 8 (JSR 308), to type uses.

**Standard annotations.**

- `@Override` — compile error if the method doesn't actually override anything.
- `@Deprecated` — marks an API as discouraged; the compiler issues warnings.
- `@SuppressWarnings` — silences specific compiler warnings.
- `@FunctionalInterface` — compile error if the interface isn't a valid SAM.
- `@SafeVarargs` — suppresses heap-pollution warnings on generic varargs.

**Retention policies.**

- `SOURCE` — discarded by the compiler, not in the `.class` file. `@Override` is SOURCE.
- `CLASS` — in the class file but not loaded into the JVM at runtime. The default.
- `RUNTIME` — available via reflection at runtime.

**Meta-annotations** (annotations that annotate other annotations):

- `@Target` — where the annotation can appear (`METHOD`, `FIELD`, `TYPE`, `PARAMETER`, ...).
- `@Retention` — which retention policy.
- `@Documented` — include in Javadoc.
- `@Inherited` — subclasses inherit the annotation from their parent.
- `@Repeatable` — allow the same annotation to appear multiple times on a single element.

**Custom annotation.**

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Timed {
    String name() default "";
    boolean warnOnSlow() default false;
}
```

**Standards that matter.** JSR 250 (Common Annotations: `@PostConstruct`, `@PreDestroy`, `@Resource`). JSR 305 (Nullability: `@Nullable`, `@Nonnull` — proposed, widely used, never finalized). JSR 303/380 (Bean Validation: `@NotNull`, `@Size`, `@Pattern`, `@Valid`).

---

## 18. Reflection and MethodHandles

Java's reflection API, `java.lang.reflect`, lets code inspect and modify classes, methods, and fields at runtime. It is the machinery behind frameworks like Spring, Hibernate, and Jackson.

```java
Class<?> c = Class.forName("com.example.Service");
Object instance = c.getDeclaredConstructor().newInstance();
Method m = c.getMethod("process", String.class);
Object result = m.invoke(instance, "hello");
```

**Key types.** `Class<?>` is the class token. `Method`, `Field`, `Constructor`, and `Parameter` represent their named members. `Modifier` decodes access-flag bits.

**`MethodHandle` (Java 7).** `java.lang.invoke.MethodHandle` is a lower-level, typed, JIT-friendly alternative to `Method.invoke()`. Method handles are looked up via `MethodHandles.Lookup` and then invoked via `invokeExact` / `invoke`. They form the foundation of `invokedynamic`, which in turn powers lambda desugaring and string concatenation.

**`VarHandle` (Java 9).** A typed handle to a variable (field, array element, off-heap address) supporting atomic and ordered memory operations: `get`, `set`, `compareAndSet`, `getAcquire`, `setRelease`, etc. `VarHandle` is the modern replacement for the notorious `sun.misc.Unsafe`.

**`Unsafe`.** `sun.misc.Unsafe` was an internal API that exposed low-level memory and concurrency operations. It was never part of the public API but became widely used by frameworks because it was the only way to get the performance they needed. It has been slowly replaced by `VarHandle`, `MemorySegment` (Project Panama), and other sanctioned APIs, but it hasn't fully gone away.

---

## 19. Modules (Java 9)

Project Jigsaw, shipped in Java 9 (September 2017), introduced the Java Platform Module System (JPMS). A module is a named collection of packages with explicit dependencies and exports.

```java
// module-info.java
module com.example.billing {
    requires com.example.core;
    requires java.sql;
    exports com.example.billing.api;
    opens com.example.billing.internal to spring.core;
    provides com.example.billing.spi.Processor with com.example.billing.impl.StripeProcessor;
    uses com.example.billing.spi.Processor;
}
```

**Directives.**

- `requires` — declares a dependency on another module.
- `exports` — makes a package visible to other modules (optionally `to X, Y`).
- `opens` — allows reflective access (for frameworks like Spring).
- `uses` / `provides` — service loader mechanism.

**Automatic modules.** A JAR on the module path without a `module-info.class` becomes an "automatic module" with a name derived from the filename. This eases migration: pre-Jigsaw JARs can be used from modular code.

**The unnamed module.** A JAR on the *classpath* (not the module path) goes into the unnamed module, which can read everything. Legacy code continues to work.

**The JDK as modules.** The JDK itself was modularized. `java.base` is the foundation (no `requires` clause needed), and then `java.sql`, `java.desktop`, `java.xml`, `java.net.http`, `java.logging`, and so on compose the rest. `jlink` lets you build a trimmed runtime containing only the modules your application needs — a big win for container images.

JPMS was and remains controversial. It solved real problems (encapsulation of internal APIs, smaller distributions) but broke many frameworks that relied on reflective access to private members. A lot of ecosystem effort went into making Jigsaw compatible with Maven, Gradle, and the major dependency injection frameworks.

---

## 20. Modern syntactic sugar (Java 10+)

Java's release cadence shifted to every six months in 2017, and with it came a steady trickle of quality-of-life improvements.

**`var` local type inference (Java 10).** Covered in section 2.

**Text blocks (Java 13 preview, Java 15 standard).** Multi-line string literals:

```java
String json = """
        {
            "name": "Ada",
            "born": 1815
        }
        """;
```

The compiler normalizes line endings, strips the common leading whitespace ("incidental white space"), and handles the trailing newline. `\` at end of line suppresses the newline; `\s` is an explicit space.

**Switch expressions (Java 14).** Covered in section 15.

**Helpful NullPointerExceptions (Java 14).** When an NPE fires, the message now tells you exactly which expression was null: `Cannot invoke "String.length()" because "str" is null`.

**Unnamed variables and patterns (Java 21).** The underscore `_` can be used as a placeholder for a variable whose value you don't care about:

```java
try { ... } catch (Exception _) { log("error"); }

for (var _ : items) counter++;

switch (shape) {
    case Circle _ -> "round";
    case Square _ -> "square";
}
```

**Unnamed classes and instance main methods (Java 21 preview).** Aimed at making "hello world" less ceremonial for students:

```java
void main() {
    System.out.println("Hello, world");
}
```

The compiler synthesizes a wrapping class and an appropriate static `main`. This is a preview feature targeted at teaching, explicitly not intended for production code.

---

## Putting it all together

Java today is not the language Gosling published in 1996. It has lambdas, streams, records, sealed classes, pattern matching, modules, and text blocks. What has not changed is the commitment to static typing, class-based OOP, portability, and a relatively small, learnable core. A 1998 Java programmer dropped into a 2025 codebase would recognize most of what they saw — the names of the classes, the structure of packages, the basic rhythm of the code — even if the specific idioms had evolved.

The object-oriented model at the heart of Java is conservative. Single inheritance of implementation, multiple inheritance of types via interfaces, `Object` at the root of every hierarchy, `equals`/`hashCode` contracts, dynamic dispatch as the default. These decisions were made in 1995 and have held up remarkably well. The most recent additions — records, sealed classes, pattern matching — extend that model rather than replace it. Records are classes. Sealed hierarchies use interfaces. Pattern matching dispatches on static types the compiler has always known about.

For researchers, the interesting story is not that Java has added features. It's that the Java language team, under Brian Goetz's stewardship since the mid-2000s, has managed to ship those features without breaking the decades of existing code running in production. Backward compatibility has been the single most disciplined constraint in Java's evolution, and it shows in every JEP. The next wave — Project Valhalla's value classes, Project Loom's virtual threads, Project Babylon's code reflection — will test that discipline again, but the track record suggests the language is in capable hands.

---

*End of Part 1. Subsequent parts in this series cover the JVM and runtime architecture, concurrency (including virtual threads), the standard library, build tooling, and Java's role in the broader JVM ecosystem alongside Kotlin, Scala, Clojure, and Groovy.*
