# C++ — Object-Oriented Programming and Core Language Features

C++ is the language that proved you don't have to choose between abstraction and performance. It is the synthesis of three traditions: the BCPL/C lineage of close-to-the-metal systems programming, the Simula lineage of class-based modeling, and the ALGOL lineage of strong static typing. Bjarne Stroustrup began the project in 1979 at Bell Labs as "C with Classes," renamed it C++ in 1983, standardized it as ISO C++ in 1998, and has watched it evolve through six major standard revisions: C++98, C++03, C++11, C++14, C++17, C++20, and C++23. Each revision has added expressive power without sacrificing the founding promise: zero-overhead abstraction. You don't pay for what you don't use, and what you do use, you couldn't reasonably code by hand any better.

This document covers the object model and the core language features that grew up around it. It is opinionated where the language is opinionated, and it tries to explain not just *what* but *why*.

---

## 1. What Object-Oriented Programming Is (Before C++)

The phrase "object-oriented programming" was coined by Alan Kay in the late 1960s, but the *technique* of bundling data with the procedures that operate on it predates the term. Two languages, born within a few years of each other on opposite sides of the world, defined the two great families of OOP that every later language would inherit from.

### Simula 67 — Norway, classes, inheritance

In Oslo, Kristen Nygaard and Ole-Johan Dahl built Simula at the Norwegian Computing Center as a tool for *simulation* — modeling discrete-event systems where you have many interacting entities with their own state and behavior. Simula I (1962) introduced the idea of an *object* as a stack-allocated record with associated procedures. Simula 67 generalized this with the now-familiar machinery: `class` declarations, member fields and methods, single inheritance via the `class B; B class C` syntax, virtual procedures, and even garbage collection.

Simula was the first language to call them "classes" and "objects." It was the first to have inheritance. It was the first to have virtual functions. Nygaard and Dahl received the 2001 ACM Turing Award for this work, decades after the fact. Stroustrup discovered Simula as a graduate student in Cambridge in the mid-1970s, and the experience permanently shaped his thinking. Simula proved you could *model the problem domain directly* in code, but Simula was slow and the runtime was too heavy for systems work. The dream of "Simula speed for systems programming" became C++.

### Smalltalk — California, messages, "everything is an object"

Across the Pacific, at Xerox PARC in Palo Alto, Alan Kay, Dan Ingalls, and Adele Goldberg built Smalltalk (1972, 1976, and the canonical Smalltalk-80). Kay's vision was radically different. In Smalltalk *everything* is an object, including integers, classes, blocks of code, and even `nil`. Objects communicate by *sending messages*. There is no compile-time type system; method dispatch happens at runtime by name. The system itself is live and reflective — you can inspect any object, recompile any class, and the change takes effect immediately.

Smalltalk gave us message passing, the MVC pattern, the integrated graphical IDE, refactoring tools, and the philosophy that *behavior belongs to objects* rather than to free functions. Where Simula was structural, Smalltalk was behavioral. Kay would later say he "made up the term object-oriented and I can tell you I did not have C++ in mind." The two traditions diverge here.

### Class-based vs prototype-based

Out of these roots grow two families:

- **Class-based OOP** (Simula → C++ → Java → C# → Swift): types are declared as classes, instances are objects of those classes, inheritance is between classes.
- **Prototype-based OOP** (Self → JavaScript → Lua → Io): there are no classes, only objects; new objects are created by *cloning* existing ones; inheritance is delegation between object instances.

David Ungar and Randall Smith built **Self** at Sun in 1986 specifically as a Smalltalk descendant without classes — radically simpler in concept, surprisingly hard to optimize. The Self group's research on adaptive compilation and inline caching produced techniques that would later power HotSpot, V8, and every JIT compiler that matters.

### Stroustrup's choice

Stroustrup wanted Simula's modeling power without Simula's runtime cost. So he made a series of foundational decisions for C++ that still define the language:

- **Static type system.** Types are checked at compile time. The compiler knows everything it can know before runtime.
- **Class-based, not prototype-based.** A class is a compile-time entity; an object is a runtime instance laid out in a known way.
- **Direct memory layout.** A `class` is fundamentally a `struct` — fields are laid out in declaration order, sizeof is meaningful, you can reinterpret memory.
- **Optional virtual dispatch.** Virtual functions cost a vtable lookup; non-virtual functions cost a direct call. You pay only when you ask for polymorphism.
- **Value semantics by default.** Objects live on the stack or inside other objects. Heap allocation is opt-in. Copies make new objects, not aliases.
- **Deterministic destruction.** When an object goes out of scope, its destructor runs *now*, not whenever the garbage collector feels like it. This single decision is the seed of RAII, exception safety, and modern C++.

Every feature of C++ since 1979 is a refinement, generalization, or fix to these founding choices.

---

## 2. Classes and Objects in C++

A class in C++ is a user-defined type that bundles data members (fields) and member functions (methods) into a single named entity, with access control to enforce encapsulation.

### `class` vs `struct`

In C, a `struct` is a layout specifier for grouping fields. In C++, `struct` and `class` are *the same thing* with one difference: in a `struct`, members default to `public`; in a `class`, they default to `private`. Both can have constructors, destructors, virtual functions, inheritance, and templates. Convention says use `struct` for plain data aggregates and `class` for everything else, but the compiler does not care.

```cpp
struct Point {
    double x;
    double y;  // both public by default
};

class Account {
    double balance;          // private by default
public:
    explicit Account(double initial) : balance(initial) {}
    void deposit(double amount) { balance += amount; }
    double get_balance() const { return balance; }
};
```

### Members, methods, access

A class has *data members* (variables) and *member functions* (functions). The three access specifiers control visibility:

- `public` — accessible from anywhere
- `private` — accessible only from the class itself and its `friend`s
- `protected` — accessible from the class itself, its `friend`s, and its derived classes

These are *compile-time* access controls. The bytes are still there in memory; the compiler just refuses to name them from the wrong context.

### Constructors

A constructor is a special member function that runs when an object comes into existence. It cannot be called directly; the compiler invokes it as part of object creation. C++ has many flavors:

- **Default constructor** — takes no arguments, used for `Foo f;` and array initialization
- **Parameterized constructor** — takes arguments, used for `Foo f(1, 2);`
- **Copy constructor** — `Foo(const Foo& other)`, used when copying
- **Move constructor** — `Foo(Foo&& other) noexcept`, C++11, used when moving from an rvalue
- **Delegating constructor** — C++11, one constructor calls another via the member-init list
- **Inheriting constructor** — C++11, `using Base::Base;` lifts base constructors into the derived class

```cpp
class Vector3 {
    double x_, y_, z_;
public:
    Vector3() : Vector3(0, 0, 0) {}                     // delegating to (0,0,0)
    Vector3(double x, double y, double z) : x_(x), y_(y), z_(z) {}
    Vector3(const Vector3&) = default;                  // compiler-generated copy
    Vector3(Vector3&&) noexcept = default;              // compiler-generated move
};
```

The colon syntax is the **member initializer list** — the *only* way to initialize `const` members, references, and base subobjects, and the *preferred* way to initialize everything because it constructs members directly rather than default-constructing then assigning.

### Destructors and RAII

A destructor `~Foo()` runs when an object's lifetime ends. For automatic (stack) objects this is when they go out of scope. For dynamically allocated objects it is when `delete` is called. For class members, when the enclosing object is destroyed. **Destruction is deterministic and guaranteed**, in reverse order of construction. This guarantee is the cornerstone of RAII.

```cpp
class FileHandle {
    std::FILE* fp_;
public:
    explicit FileHandle(const char* path, const char* mode)
        : fp_(std::fopen(path, mode)) {
        if (!fp_) throw std::runtime_error("fopen failed");
    }
    ~FileHandle() { if (fp_) std::fclose(fp_); }

    // disable copy, allow move
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;
    FileHandle(FileHandle&& other) noexcept : fp_(other.fp_) { other.fp_ = nullptr; }
    FileHandle& operator=(FileHandle&& other) noexcept {
        if (this != &other) { if (fp_) std::fclose(fp_); fp_ = other.fp_; other.fp_ = nullptr; }
        return *this;
    }

    std::FILE* get() const { return fp_; }
};
```

The constructor *acquires* the file handle. The destructor *releases* it. Whether you exit the function normally, by `return`, or by an exception unwinding the stack, the destructor runs and the file is closed. There is no `try`/`finally` because there does not need to be one.

### Compiler-generated special member functions

For any class, the compiler will *implicitly generate* (under varying conditions) up to six special member functions:

| Function | Signature | C++ version |
|---|---|---|
| Default constructor | `T()` | C++98 |
| Destructor | `~T()` | C++98 |
| Copy constructor | `T(const T&)` | C++98 |
| Copy assignment | `T& operator=(const T&)` | C++98 |
| Move constructor | `T(T&&) noexcept` | C++11 |
| Move assignment | `T& operator=(T&&) noexcept` | C++11 |

The rules for *when* the compiler generates each are intricate. Roughly: declaring any of them suppresses some of the others, and that has bitten generations of programmers. C++11 introduced `= default` to *explicitly* request a compiler-generated version, and `= delete` to suppress one entirely.

This led to three guidelines:

- **Rule of Three** (pre-C++11): if you write a destructor, copy constructor, or copy assignment, you almost certainly need to write all three.
- **Rule of Five** (C++11): now that move exists, the same applies to all five (destructor + copy ctor + copy assign + move ctor + move assign).
- **Rule of Zero** (C++11 idiom): write none of them. If your members are all RAII types (`std::string`, `std::vector`, `std::unique_ptr`), the compiler-generated versions are correct, and your class needs no boilerplate.

The Rule of Zero is the goal. The other rules exist because sometimes you cannot achieve it.

### `this`

Inside a non-static member function, `this` is a pointer to the current object. It is implicit; you almost never write it except to disambiguate (`return *this;` for chaining) or in templates with dependent base classes. In a `const` member function, `this` has type `const T*`.

### `const` and `mutable`

A member function declared `const` promises not to modify the observable state of the object: `void print() const;`. The compiler enforces this by treating `this` as `const T*` inside the function body. Calling a non-const method through a const reference is a compile error. This is foundational to writing const-correct interfaces.

Sometimes a member needs to be modifiable even from a const method — caches, mutexes, lazy initialization. The `mutable` keyword exempts a member from `const`-ness:

```cpp
class Cache {
    mutable std::mutex mtx_;
    mutable std::optional<int> cached_;
public:
    int compute() const {
        std::lock_guard lk(mtx_);
        if (!cached_) cached_ = expensive();
        return *cached_;
    }
};
```

### Static members

A `static` data member belongs to the class, not to any instance. It must (usually) be defined outside the class, though C++17 added `inline` static members for header-only definition. A `static` member function has no `this` and can only access static members.

```cpp
class Counter {
    inline static int total_ = 0;  // C++17
public:
    Counter()  { ++total_; }
    ~Counter() { --total_; }
    static int total() { return total_; }
};
```

---

## 3. Inheritance

Inheritance lets a class extend or specialize another class. The derived class inherits all the data members and (most) member functions of its base. C++ supports single inheritance, multiple inheritance, and virtual inheritance to handle the diamond problem.

### Single inheritance

```cpp
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
};

class Circle : public Shape {
    double r_;
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.14159265 * r_ * r_; }
};
```

### Access specifiers on inheritance

The access specifier on the base (`public`, `protected`, `private`) controls how *users of the derived class* can access the inherited members:

- `class Derived : public Base` — public members of `Base` remain public in `Derived`. This models "is-a."
- `class Derived : protected Base` — public and protected members become protected. Less common.
- `class Derived : private Base` — everything from `Base` becomes private. Models "is-implemented-in-terms-of." Often replaced by composition.

### Constructor chaining and initializer lists

A derived constructor must initialize its base class. If the base has a default constructor, this happens implicitly; otherwise you must call it explicitly in the member initializer list:

```cpp
class Animal {
    std::string name_;
public:
    explicit Animal(std::string name) : name_(std::move(name)) {}
};

class Dog : public Animal {
    std::string breed_;
public:
    Dog(std::string name, std::string breed)
        : Animal(std::move(name)), breed_(std::move(breed)) {}
};
```

Bases are constructed before members, in order of declaration. Members are constructed in declaration order, *not* the order they appear in the initializer list — a common bug source that compilers will warn about.

### The slicing problem

If you assign a derived object to a *value* of base type, only the base subobject is copied. The derived parts are sliced off:

```cpp
Circle c(2.0);
Shape s = c;        // ERROR: Shape is abstract; if it weren't, slicing would occur
Shape& sr = c;      // OK: reference to base, no slicing
Shape* sp = &c;     // OK: pointer to base, no slicing
```

Polymorphism in C++ requires you to access objects through references or pointers, not values. This is a constant source of confusion for programmers coming from Java or C#, where all objects are reference types by default.

### Virtual destructors

If you ever delete a derived object through a base pointer, the base's destructor must be `virtual`. Otherwise, only the base destructor runs, derived members leak, and behavior is undefined:

```cpp
class Base { public: virtual ~Base() = default; };  // CORRECT
class Bad  { public: ~Bad() = default; };           // BAD if used polymorphically
```

The rule: any class intended as a base in a polymorphic hierarchy needs a virtual destructor. If the class is not meant to be a base, mark it `final`.

### `override` and `final`

C++11 added two contextual keywords that catch entire categories of bugs:

- `override` on a derived virtual function asserts "this overrides a virtual base function." If the signatures don't match, compile error. Without `override`, a typo silently creates a *new* virtual function.
- `final` on a virtual function says "no further overriding allowed." On a class, "no further inheriting allowed." Enables devirtualization optimizations.

```cpp
struct A { virtual void f(int); };
struct B : A { void f(int) override; };       // OK
struct C : A { void f(long) override; };      // ERROR — wrong signature
struct D final : A { void f(int) final; };    // no further inheritance/override
```

### Multiple inheritance and the diamond

C++ allows a class to inherit from multiple bases. This is powerful but introduces the **diamond problem**: if `D` inherits from `B1` and `B2`, both of which inherit from `A`, then `D` has *two* `A` subobjects unless you say otherwise:

```cpp
struct A { int x; };
struct B1 : A {};
struct B2 : A {};
struct D : B1, B2 {};  // D has TWO A subobjects: D::B1::A::x and D::B2::A::x
```

`virtual` inheritance collapses them into one shared base:

```cpp
struct B1 : virtual A {};
struct B2 : virtual A {};
struct D : B1, B2 {};  // D has ONE A subobject
```

Virtual inheritance has a runtime cost (an extra pointer per object) and complicates construction (`D` is now responsible for constructing the virtual `A`). It is rarely used outside of carefully designed library hierarchies (the `iostream` library is a famous example).

---

## 4. Polymorphism

Polymorphism is the ability of a single interface to operate on many types. C++ supports two distinct forms:

- **Dynamic polymorphism** via virtual functions, resolved at runtime
- **Static polymorphism** via templates, resolved at compile time

### Virtual functions and dynamic dispatch

A `virtual` member function can be overridden by derived classes. When called through a base pointer or reference, the *most derived* override runs. This is the classic "polymorphism" of OOP textbooks.

```cpp
struct Shape {
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual void draw() const = 0;
};

struct Circle : Shape {
    double r;
    explicit Circle(double r_) : r(r_) {}
    double area() const override { return 3.14159 * r * r; }
    void draw() const override { /* ... */ }
};

void render(const Shape& s) {
    s.draw();             // dispatches to the actual derived class
    auto a = s.area();    // same
}
```

### vtables (conceptually)

The C++ standard does not specify how virtual dispatch is implemented, but every major compiler uses a **vtable** (virtual function table). Each polymorphic class has a static array of function pointers — one slot per virtual function. Each instance carries a hidden pointer (the *vptr*) to its class's vtable. A virtual call compiles to: dereference vptr, index by slot, indirect call. Two memory loads and an indirect branch. The cost is fixed and well understood, but it inhibits inlining.

### Pure virtual functions and abstract classes

A `virtual` function declared with `= 0` is **pure virtual**. A class with at least one pure virtual function is *abstract* and cannot be instantiated directly. It exists to define an interface that derived classes must implement.

```cpp
class Drawable {
public:
    virtual ~Drawable() = default;
    virtual void draw() const = 0;     // pure virtual
};
```

You can still provide a body for a pure virtual function (`virtual void f() const = 0;` followed by `void Drawable::f() const { ... }`), useful for shared default behavior that derived classes can call via `Base::f()`.

### `dynamic_cast` and RTTI

Sometimes you have a base pointer and need to know whether the actual object is a particular derived type. `dynamic_cast` performs a runtime-checked downcast:

```cpp
Shape* s = get_shape();
if (auto c = dynamic_cast<Circle*>(s)) {
    use_circle(*c);
} else {
    // not a Circle
}
```

For pointers, failure yields `nullptr`. For references, failure throws `std::bad_cast`. `dynamic_cast` requires RTTI (Run-Time Type Information), which adds metadata to vtables. Some embedded projects disable RTTI to save space and use other dispatch mechanisms instead. `typeid` is the related operator that gives you a `std::type_info` for an expression.

### Covariant return types

When overriding a virtual function, you may return a *more derived* type than the base declared, as long as the return types are pointers or references and the derivation is unambiguous and accessible:

```cpp
struct Animal { virtual Animal* clone() const; };
struct Dog : Animal { Dog* clone() const override; };  // covariant return
```

### Static vs dynamic polymorphism

Templates give you another form of polymorphism that costs nothing at runtime. The compiler instantiates a separate version of the function or class for each type, and dispatch happens at compile time:

```cpp
template <typename Shape>
double total_area(const std::vector<Shape>& shapes) {
    double sum = 0;
    for (const auto& s : shapes) sum += s.area();  // resolved at compile time
    return sum;
}
```

No vtable, no indirection, full inlining. The cost is binary size (one instantiation per type) and compile time.

### CRTP — Curiously Recurring Template Pattern

A class can inherit from a template instantiated *with itself*. This sounds nonsensical but is a powerful form of static polymorphism:

```cpp
template <typename Derived>
class Comparable {
public:
    bool operator<=(const Derived& other) const {
        const auto& self = static_cast<const Derived&>(*this);
        return self < other || self == other;
    }
};

struct Money : Comparable<Money> {
    int cents;
    bool operator<(const Money& o) const { return cents < o.cents; }
    bool operator==(const Money& o) const { return cents == o.cents; }
};
```

CRTP lets the base call into the derived class without virtual dispatch. The compiler resolves `static_cast<const Derived&>(*this)` at compile time, inlines, and produces optimal code. CRTP is used heavily for mixins, expression templates, and policy classes. Its limitation: each instantiation is a distinct type, so you cannot have a heterogeneous container of `Comparable<*>`.

---

## 5. Encapsulation and Abstraction

Encapsulation means that an object's internal state is hidden from the outside world; clients interact through a defined interface. Abstraction means that the interface expresses intent rather than implementation.

### Information hiding via `private`

The most basic form: make data members private, expose them only through methods that maintain invariants.

```cpp
class Temperature {
    double kelvin_;
public:
    explicit Temperature(double k) : kelvin_(k) {
        if (k < 0) throw std::domain_error("temperature below absolute zero");
    }
    double celsius()    const { return kelvin_ - 273.15; }
    double fahrenheit() const { return celsius() * 9 / 5 + 32; }
};
```

The class enforces "kelvin >= 0" as an invariant. Clients cannot violate it because they cannot touch `kelvin_` directly.

### The PIMPL idiom (Pointer to Implementation)

A class declared in a header exposes the *layout* of its private members to anyone who includes it. Even though clients can't *use* the privates, they depend on their *sizes* — change a private member and every translation unit that includes the header must recompile. PIMPL hides the implementation behind a pointer:

```cpp
// widget.hpp
class Widget {
public:
    Widget();
    ~Widget();
    Widget(Widget&&) noexcept;
    Widget& operator=(Widget&&) noexcept;
    void render();
private:
    struct Impl;
    std::unique_ptr<Impl> p_;
};

// widget.cpp
struct Widget::Impl {
    int internal_state;
    std::vector<Vertex> mesh;
    /* ... */
};
Widget::Widget() : p_(std::make_unique<Impl>()) {}
Widget::~Widget() = default;  // must be in .cpp where Impl is complete
Widget::Widget(Widget&&) noexcept = default;
Widget& Widget::operator=(Widget&&) noexcept = default;
void Widget::render() { /* uses p_->... */ }
```

The header now exposes only the pointer. Changing `Impl` does not force clients to recompile. The cost is one extra heap allocation per object and one extra indirection per access.

### Pure-virtual interfaces

Before C++20 concepts, the standard way to express an interface contract was an abstract class with all-pure-virtual methods:

```cpp
class IRenderer {
public:
    virtual ~IRenderer() = default;
    virtual void clear() = 0;
    virtual void draw(const Mesh&) = 0;
    virtual void present() = 0;
};
```

This is dynamic polymorphism with all the trade-offs: virtual dispatch cost, heap allocation typical, runtime extensibility.

### C++20 concepts

Concepts let you express interface requirements as compile-time predicates on types:

```cpp
template <typename T>
concept Renderer = requires(T r, Mesh m) {
    { r.clear() }   -> std::same_as<void>;
    { r.draw(m) }   -> std::same_as<void>;
    { r.present() } -> std::same_as<void>;
};

template <Renderer R>
void render_scene(R& r, const Scene& s) {
    r.clear();
    for (const auto& mesh : s.meshes) r.draw(mesh);
    r.present();
}
```

This is static polymorphism with first-class interface checking. Errors point at the *concept* that failed, not at deep template instantiation noise. No vtable, no heap.

### Friend classes and friend functions

A `friend` declaration grants another class or function access to the private members of this class. Friendship is one-way and not transitive. It is the controlled escape hatch for tightly coupled types — typically test fixtures, factory functions, or paired classes like a container and its iterator.

```cpp
class Wallet {
    int balance_;
    friend class Auditor;                 // Auditor sees balance_
    friend std::ostream& operator<<(std::ostream&, const Wallet&);
public:
    Wallet(int b) : balance_(b) {}
};
```

Use `friend` sparingly. Every friend declaration is a hole in encapsulation.

---

## 6. Operator Overloading

C++ lets you give meaning to most of the built-in operators when applied to your own types. This makes user-defined types feel like built-ins — `Matrix a = b * c + d;` reads naturally if `Matrix` overloads `*` and `+`.

### Which operators can be overloaded

Almost all of them. The exceptions are:

- `.` (member access)
- `.*` (pointer-to-member)
- `::` (scope resolution)
- `?:` (ternary)
- `sizeof`
- `typeid`
- `alignof`

Everything else — arithmetic, relational, bitwise, logical, assignment, increment/decrement, subscript, function call, comma, address-of, dereference, stream operators, conversion operators, `new`/`delete` — can be overloaded.

### Member vs non-member

Some operators *must* be members (`=`, `[]`, `->`, function call). Most can be either. The convention:

- If the left operand is your type and is modified, make it a member.
- If the left operand might be of a different type (e.g., `5 * Matrix`), make it a non-member free function (often a `friend`).

```cpp
class Vec2 {
    double x_, y_;
public:
    Vec2(double x, double y) : x_(x), y_(y) {}
    Vec2& operator+=(const Vec2& o) { x_ += o.x_; y_ += o.y_; return *this; }
    double x() const { return x_; }
    double y() const { return y_; }
};

inline Vec2 operator+(Vec2 a, const Vec2& b) { return a += b; }     // by-value first arg, then +=
inline Vec2 operator*(double s, const Vec2& v) { return {s*v.x(), s*v.y()}; }
inline std::ostream& operator<<(std::ostream& os, const Vec2& v) {
    return os << "(" << v.x() << ", " << v.y() << ")";
}
```

### Canonical patterns

- **Arithmetic:** implement `+=` as a member, then `+` as a free function calling `+=`.
- **Comparison:** before C++20, write all six (`==`, `!=`, `<`, `>`, `<=`, `>=`). After C++20, write `==` and `<=>` and the rest are synthesized.
- **Stream insertion/extraction:** non-member friend, takes `std::ostream&`/`std::istream&` as the left operand.
- **Assignment:** use copy-and-swap or check for self-assignment, return `*this` by reference.
- **Subscript:** `T& operator[](size_t)` and `const T& operator[](size_t) const`. C++23 added multidimensional subscript.
- **Function call:** `operator()` makes a class a *function object* (functor); the basis of `std::function`, lambdas, and the entire STL algorithm interface.
- **Conversion operators:** `operator double() const { return value_; }`. Use `explicit` (C++11) to prevent silent conversions.

### The spaceship operator `<=>` (C++20)

C++20 introduced three-way comparison:

```cpp
#include <compare>

struct Money {
    int cents;
    auto operator<=>(const Money&) const = default;
    bool operator==(const Money&) const = default;
};
```

That gives you `==`, `!=`, `<`, `<=`, `>`, `>=` for free. The return type of `<=>` is one of `std::strong_ordering`, `std::weak_ordering`, or `std::partial_ordering`, depending on the comparison's mathematical structure.

### Overloading vs overriding

Two different concepts that share three letters:

- **Overloading:** multiple functions with the *same name* and *different parameter lists* in the same scope. Resolved at compile time.
- **Overriding:** a derived class providing a new implementation of a *virtual function* declared in a base class. Resolved at runtime (for virtual) or compile time (otherwise).

---

## 7. Value vs Reference Semantics

C++ exposes the underlying machine model directly. There are *value types*, *references*, and *pointers*, and a function signature tells you exactly what you're getting.

### The categories

| Form | Meaning |
|---|---|
| `T x` | Object of type T, owns its storage |
| `T& x` | Lvalue reference; an alias for an existing object |
| `const T& x` | Read-only alias; binds to lvalues *and* temporaries |
| `T&& x` | Rvalue reference (C++11); binds to temporaries; signals "you can move from this" |
| `T* x` | Pointer; can be null, can be reseated, supports arithmetic |
| `const T* x` / `T* const x` | Pointer to const / const pointer |

### Argument passing rules of thumb

- **Pass by value** when the type is cheap to copy (`int`, `double`, small structs) or when you need a local copy anyway.
- **Pass by `const T&`** for non-trivial inputs you don't modify. The classic default.
- **Pass by `T&`** for non-trivial in/out parameters. Document clearly.
- **Pass by `T&&`** when you specifically want to *take ownership* of an rvalue (move-into).
- **Pass by `T*`** when the argument may be null or you specifically want pointer semantics.

### Returning

- **Return by value** for newly constructed objects. Move semantics + RVO/NRVO mean this is essentially free.
- **Return by reference** for accessors that expose existing members. Be careful never to return a reference to a local.
- **Return by pointer** when the result may be absent (`nullptr`) or the caller manages lifetime.

### Dangling references

Returning a reference or pointer to a local variable is undefined behavior:

```cpp
const std::string& bad() {
    std::string s = "hello";
    return s;  // s destroyed at function exit; reference dangles
}
```

The compiler may warn but cannot always detect this. It is one of the most common C++ bugs.

### Value categories: lvalue, xvalue, prvalue (C++11)

C++11 formalized a taxonomy of *expression value categories*:

- **lvalue** — has identity, has a name, has an address, persists. `x`, `*p`, `arr[i]`.
- **prvalue** (pure rvalue) — does not have identity, is not named, is a temporary or literal. `42`, `f()` returning by value, `x + y`.
- **xvalue** (eXpiring value) — has identity but is about to be destroyed; may be moved from. `std::move(x)`, `static_cast<T&&>(x)`, function returning `T&&`.
- **glvalue** = lvalue ∪ xvalue (generalized lvalue, has identity)
- **rvalue** = prvalue ∪ xvalue (can be moved from)

This taxonomy exists to make move semantics work without breaking existing code.

### Reference collapsing and forwarding references

When templates and references combine, you get reference collapsing:

- `T& &` → `T&`
- `T& &&` → `T&`
- `T&& &` → `T&`
- `T&& &&` → `T&&`

A `T&&` where `T` is a *deduced* template parameter is a **forwarding reference** (a.k.a. universal reference, Scott Meyers's term). It binds to anything: lvalues become `T&`, rvalues become `T&&`. Combined with `std::forward<T>(x)`, this is the foundation of perfect forwarding.

---

## 8. Move Semantics (C++11)

Before C++11, returning an expensive object by value meant copying. Even with optimizations, library writers had to choose between expressive APIs (return by value) and efficient APIs (output parameters or pointers). Move semantics resolved this by introducing a new way to transfer ownership of resources: instead of copying, *steal*.

### Why move exists

Consider `std::vector<std::string>`. A vector reallocates its buffer when it grows. With copy-only semantics, every reallocation copies every string. With move semantics, each string's heap pointer is *transferred* to the new buffer in O(1), and the source is left empty.

### `std::move` and rvalue references

`std::move` is not an action — it is a *cast*. It converts an lvalue to an xvalue, signaling "I am done with this object; you may pillage it." The signature is `T&& std::move(T&& x)`.

```cpp
std::string a = "hello";
std::string b = std::move(a);  // b takes a's buffer; a is now valid-but-unspecified
```

After moving, the source object is in a *valid but unspecified state*. You can destroy it, assign to it, or call methods with no preconditions, but you cannot assume anything about its content.

### Move constructor and move assignment

```cpp
class Buffer {
    char* data_;
    std::size_t size_;
public:
    Buffer(std::size_t n) : data_(new char[n]), size_(n) {}
    ~Buffer() { delete[] data_; }

    Buffer(Buffer&& other) noexcept
        : data_(other.data_), size_(other.size_) {
        other.data_ = nullptr;
        other.size_ = 0;
    }

    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }

    Buffer(const Buffer&) = delete;
    Buffer& operator=(const Buffer&) = delete;
};
```

### `noexcept` on moves

`std::vector` and other containers will only *move* their elements during reallocation if the move constructor is `noexcept`; otherwise they *copy*, to preserve the strong exception guarantee. Always mark move constructors and move-assignment operators `noexcept` if possible. Failing to do so can silently destroy your container's performance.

### Perfect forwarding

A function template that takes a forwarding reference and passes the argument to another function should `std::forward<T>` it to preserve value category:

```cpp
template <typename F, typename... Args>
decltype(auto) invoke_logging(F&& f, Args&&... args) {
    log("calling");
    return std::forward<F>(f)(std::forward<Args>(args)...);
}
```

Without `std::forward`, every argument inside the function body becomes an lvalue (because parameters have names) and rvalue-ness is lost. `std::forward<T>` re-casts based on the original deduced `T`.

### Copy elision: RVO, NRVO, and guaranteed elision

Even before move semantics, compilers performed **return value optimization (RVO)** and **named return value optimization (NRVO)** to construct return values directly in the caller's storage rather than copying.

```cpp
std::string make() {
    std::string s = "hello";
    return s;     // NRVO: s constructed directly in caller's storage
}
```

C++17 made certain forms of copy elision *mandatory* — for example, when initializing from a prvalue (`Foo f = Foo{};`). Even classes with deleted copy/move constructors can be returned by value in these cases. This is **guaranteed copy elision**.

The combination of move semantics and copy elision means that returning by value in modern C++ is essentially free. Always prefer it over output parameters.

---

## 9. RAII — The Soul of C++

If you take one idea from C++ to other languages, take this one. RAII — **Resource Acquisition Is Initialization** — is Stroustrup's term and the deepest insight of the language. It says: *tie the lifetime of a resource to the lifetime of an object*. Acquire the resource in the constructor, release it in the destructor, and let scope-based destruction do the rest.

Because C++ guarantees that destructors run when objects go out of scope, regardless of *how* control leaves the scope (normal exit, return, exception, even longjmp in well-defined cases), RAII gives you deterministic cleanup without `try`/`finally` and without garbage collection.

### Why this is profound

Consider what RAII replaces:

- Java/C# `try-finally` blocks for closing resources
- Java's `try-with-resources` (a partial reinvention of RAII)
- Python `with` statements (also a partial reinvention)
- Go `defer` statements (another partial reinvention)
- C's manual `goto cleanup` patterns

In C++, *the type system itself* manages resources. You don't write cleanup code; you put cleanup in the destructor and never think about it again. Exception unwinding works because every stack frame's destructors run as it unwinds. Locks release, files close, sockets disconnect, memory frees — all automatically.

### Standard RAII types

The standard library is full of RAII wrappers:

| Type | Resource |
|---|---|
| `std::unique_ptr<T>` | Owned heap object, single owner |
| `std::shared_ptr<T>` | Owned heap object, reference counted |
| `std::weak_ptr<T>` | Non-owning observer for shared_ptr |
| `std::vector<T>`, `std::string`, `std::map<K,V>` | Heap-allocated collections |
| `std::lock_guard<Mutex>` | A mutex held for the scope |
| `std::unique_lock<Mutex>` | Like lock_guard but transferable / deferable |
| `std::scoped_lock<...>` (C++17) | Multi-mutex deadlock-free locking |
| `std::ifstream`, `std::ofstream` | File handles |
| `std::jthread` (C++20) | A thread joined automatically on destruction |

### `std::unique_ptr` example

```cpp
#include <memory>
struct Connection { /* ... */ };

std::unique_ptr<Connection> connect(const std::string& url) {
    auto conn = std::make_unique<Connection>(url);
    if (!conn->ping()) return nullptr;
    return conn;        // ownership transferred to caller
}

void use() {
    auto c = connect("db://...");
    if (!c) return;
    c->query("SELECT 1");
}  // c destroyed here, Connection destructor runs
```

No `new`, no `delete`, no leaks. If `query` throws, the destructor still runs.

### The Rule of Zero, restated

If your class's only members are RAII types, you don't need to write *any* of the special member functions. The compiler-generated copy/move/destroy do the right thing because each member knows how to copy/move/destroy itself. This is the goal of modern C++ class design: write small classes whose members handle their own resources, then compose.

---

## 10. Exceptions

C++ exceptions are the language's mechanism for *non-local* error reporting. A `throw` propagates up the stack, running destructors as it unwinds, until it hits a matching `catch`. If none is found, `std::terminate` runs and the program aborts.

### Syntax

```cpp
try {
    auto cfg = load_config("app.yml");
    run(cfg);
} catch (const std::ios_base::failure& e) {
    log("config IO error: ", e.what());
} catch (const std::exception& e) {
    log("unexpected error: ", e.what());
} catch (...) {
    log("unknown error");
    throw;     // re-throw
}
```

### Exception hierarchy

`<stdexcept>` defines a hierarchy rooted at `std::exception`:

- `std::exception`
  - `std::logic_error`
    - `std::invalid_argument`
    - `std::domain_error`
    - `std::length_error`
    - `std::out_of_range`
  - `std::runtime_error`
    - `std::range_error`
    - `std::overflow_error`
    - `std::underflow_error`
    - `std::system_error`
  - `std::bad_alloc`
  - `std::bad_cast`
  - `std::bad_typeid`

The convention: `logic_error` for bugs (preconditions violated), `runtime_error` for environmental failures (file missing, network down).

### Exception safety guarantees

David Abrahams formalized four levels:

1. **No-throw guarantee** — the operation never throws. `noexcept`. Required for destructors, swap, move.
2. **Strong guarantee** (commit-or-rollback) — if the operation throws, the program state is unchanged. `std::vector::push_back` provides this when element copy/move is no-throw.
3. **Basic guarantee** — if the operation throws, no resources leak and all invariants still hold, but state may be modified.
4. **No guarantee** — if it throws, anything can happen. Avoid.

Modern C++ aims for at least the basic guarantee, often the strong guarantee, by using RAII and copy-and-swap idioms.

### `noexcept`

`noexcept` (C++11) declares that a function will not throw. The compiler may use this for optimization (especially in containers and `std::move_if_noexcept`). If a `noexcept` function does throw, `std::terminate` is called immediately. Destructors are *implicitly* `noexcept`.

```cpp
void swap(Buffer& a, Buffer& b) noexcept {
    using std::swap;
    swap(a.data_, b.data_);
    swap(a.size_, b.size_);
}
```

### The exceptions debate

Exceptions are controversial. Arguments for:

- Cleaner code paths — happy path not interleaved with error checking
- Cannot be silently ignored
- Constructors can fail without leaving objects in an invalid state
- Combined with RAII, give clean cleanup automatically

Arguments against:

- Hidden control flow
- Binary size and unwind metadata
- Unpredictable timing (some embedded environments)
- Difficulty reasoning about exception safety
- The Google C++ Style Guide famously bans them in Google code (largely for historical compatibility reasons; new projects need not follow this)

The modern alternatives:

- **Error codes** — explicit, composable, but easy to ignore
- **`std::optional<T>`** (C++17) — for "value or nothing"
- **`std::variant<T, E>`** (C++17) — for "value or specific error"
- **`std::expected<T, E>`** (C++23) — Rust-style `Result`, the long-awaited functional alternative

```cpp
std::expected<Config, ConfigError> load_config(const std::string& path);

auto cfg = load_config("app.yml");
if (!cfg) return cfg.error();
run(*cfg);
```

---

## 11. The Big Five (or Six)

| # | Function | Default behavior | When implicitly defined |
|---|---|---|---|
| 1 | `T()` (default ctor) | Default-init members | If no other ctor declared |
| 2 | `~T()` (destructor) | Destroy members | Always, unless deleted |
| 3 | `T(const T&)` (copy ctor) | Member-wise copy | If no move ops declared |
| 4 | `T& operator=(const T&)` (copy assign) | Member-wise copy assign | If no move ops declared |
| 5 | `T(T&&) noexcept` (move ctor) | Member-wise move | If no copy/destructor declared |
| 6 | `T& operator=(T&&) noexcept` (move assign) | Member-wise move assign | If no copy/destructor declared |

The interaction rules are subtle. Declaring a destructor *suppresses* implicit move generation (so you might unintentionally fall back to copies). Declaring a copy operation suppresses moves. The rules of thumb:

- **Rule of Zero:** declare none. Use RAII members. The defaults are correct.
- **Rule of Five:** if you must declare any of #2–#6, declare them all. Often via `= default` or `= delete`.

`= default` and `= delete` (C++11) make intent explicit:

```cpp
class NonCopyable {
public:
    NonCopyable() = default;
    NonCopyable(const NonCopyable&) = delete;
    NonCopyable& operator=(const NonCopyable&) = delete;
    NonCopyable(NonCopyable&&) noexcept = default;
    NonCopyable& operator=(NonCopyable&&) noexcept = default;
};
```

---

## 12. Other Core Features

### `constexpr`, `consteval`, `constinit`

Compile-time computation has expanded enormously:

- **`constexpr`** (C++11, vastly extended in C++14/17/20) — *may* be evaluated at compile time. Functions, variables, member functions, even constructors and destructors (C++20).
- **`consteval`** (C++20) — *must* be evaluated at compile time. The function is an "immediate function."
- **`constinit`** (C++20) — variable must be constant-initialized (no dynamic init), but is not const after that. Solves the static initialization order fiasco.

```cpp
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
constexpr int x = factorial(5);  // computed at compile time

consteval int square(int n) { return n * n; }
constinit int counter = square(3);  // initialized at compile time
```

C++20 allowed `std::vector` and `std::string` to be used in `constexpr` contexts. C++23 expanded this further. The dream is that the same code runs at compile time and runtime.

### Lambdas (C++11+)

A lambda is an anonymous function object. The compiler synthesizes a class with an `operator()`:

```cpp
auto add = [](int a, int b) { return a + b; };
int sum = add(2, 3);

int factor = 10;
auto scale = [factor](int x) { return x * factor; };       // capture by value
auto scale_ref = [&factor](int x) { return x * factor; };  // capture by reference

auto generic = [](auto a, auto b) { return a + b; };       // generic lambda (C++14)
auto templated = []<typename T>(T a, T b) { return a + b; }; // template lambda (C++20)
```

Lambdas combined with the STL algorithms gave C++ a functional flavor. They are the foundation of the ranges library and async APIs.

### Range-based for (C++11)

```cpp
for (const auto& item : container) {
    use(item);
}
```

Works with anything that has `begin()` / `end()`, including arrays, the standard containers, and user types that provide the interface.

### Structured bindings (C++17)

```cpp
std::map<std::string, int> m = {{"a", 1}, {"b", 2}};
for (const auto& [key, value] : m) {
    std::cout << key << " = " << value << "\n";
}

auto [iter, inserted] = m.insert({"c", 3});
```

Decomposes tuples, pairs, arrays, and structs.

### `if constexpr` (C++17)

Compile-time branching inside templates. The non-taken branch is not even type-checked:

```cpp
template <typename T>
auto stringify(const T& v) {
    if constexpr (std::is_arithmetic_v<T>) return std::to_string(v);
    else                                    return std::string(v);
}
```

This replaces a forest of SFINAE tag dispatch with readable code.

### Modules (C++20)

C++ inherited C's textual `#include` model: a header is copied wholesale into every translation unit. This produces colossal compile times and ODR pitfalls. Modules are a true module system:

```cpp
// math.cppm
export module math;
export int add(int a, int b) { return a + b; }

// main.cpp
import math;
int main() { return add(2, 3); }
```

A module is compiled once. Importing it is fast and exposes only what is `export`ed. Adoption has been slow because of build-system complexity, but the trajectory is clear.

### Coroutines (C++20)

Stackless coroutines with `co_await`, `co_yield`, `co_return`. The standard provides only the language hooks; library writers build the coroutine types (generators, tasks, async streams). Used by every modern async I/O library.

### Concepts (C++20)

Already covered in §5. They are also used in the new `<ranges>` header to express constraints clearly.

---

## 13. Design Patterns in C++

### The Gang of Four

In 1994, Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides published *Design Patterns: Elements of Reusable Object-Oriented Software*, cataloging 23 recurring design solutions. The book's examples were in C++ and Smalltalk; its influence on the C++ community was overwhelming. For a decade, "design patterns" became synonymous with object-oriented design itself.

Many patterns from the book are now built into modern languages, or rendered unnecessary by language features. Strategy is `std::function` or a template parameter. Iterator is the STL. Visitor is `std::visit` over `std::variant`. But the vocabulary persists.

### Singleton and the Meyers Singleton

The Singleton pattern: ensure a class has exactly one instance, globally accessible. Scott Meyers showed in *Effective C++* that the simplest correct C++ implementation uses a function-local static:

```cpp
class Logger {
public:
    static Logger& instance() {
        static Logger inst;   // C++11 guarantees thread-safe init
        return inst;
    }
    void log(const std::string& msg);
private:
    Logger() = default;
    ~Logger() = default;
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;
};
```

C++11 made function-local static initialization thread-safe, killing the dozens of pages of double-checked-locking patterns from earlier eras.

### Factory and Abstract Factory

A function or class whose job is to create objects, hiding the actual concrete type from the caller. In modern C++, often returns a `std::unique_ptr<Base>`.

### Observer

A subject maintains a list of observers and notifies them on state changes. In modern C++ this is often implemented with `std::function` callbacks or signal/slot libraries (Boost.Signals2, Qt signals).

### Strategy and Policy-Based Design

Strategy: parameterize an algorithm by a swappable component. In C++ you can do this with a virtual interface (dynamic) or a template parameter (static). Andrei Alexandrescu's *Modern C++ Design* (2001) introduced **policy-based design**, where a class is parameterized by multiple "policy" template parameters that customize its behavior at compile time. The standard's allocator parameter on every container is policy-based design.

### Visitor and `std::visit`

Visitor pattern: separate algorithms from the data structures they operate on. C++17's `std::variant` plus `std::visit` gives you a *closed* sum-type with type-safe visitation, replacing many uses of the classic GoF Visitor:

```cpp
using Shape = std::variant<Circle, Square, Triangle>;
double area(const Shape& s) {
    return std::visit([](const auto& x) { return x.area(); }, s);
}
```

### Type erasure: `std::function`, `std::any`

Type erasure is the technique of hiding the concrete type of an object behind a uniform interface, using internal virtual dispatch or function pointers, while exposing a value-semantic facade. `std::function<Sig>` can hold *any* callable matching `Sig`. `std::any` can hold *any* copyable value. `std::shared_ptr<void>` is a building block. The technique is the C++ answer to Java/C# interfaces with value semantics — a polymorphic value rather than a polymorphic reference.

---

## Summary

C++'s object model is the synthesis of Simula's classes, ALGOL's static typing, and C's machine model. Its distinguishing features — value semantics by default, deterministic destruction, RAII, zero-overhead abstraction, optional virtual dispatch, templates and concepts for static polymorphism, move semantics for ownership transfer — make it possible to write code that is both high-level and as fast as anything you could write by hand.

The language is large and notoriously sharp-edged, but the modern dialect (C++11 and later) is remarkably coherent once the core ideas click: types own resources, lifetimes are scopes, abstractions cost nothing you don't ask for, and everything the compiler can know, the compiler should know.

C++ is now in its fifth decade, used in operating systems, browsers, game engines, financial trading, scientific simulation, embedded systems, and the toolchains of nearly every other language. Stroustrup's bet — that you don't have to choose between abstraction and performance — won.
