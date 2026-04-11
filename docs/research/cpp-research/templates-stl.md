# C++ Templates, the STL, and the Standard Library

> "Generic programming is about abstracting and classifying algorithms and data structures." — Alexander Stepanov

C++ is a multi-paradigm language, but the feature that most clearly distinguishes it from its contemporaries is its template system. Templates are not merely a convenience for writing type-generic containers; they are a Turing-complete compile-time metalanguage that powers the Standard Template Library (STL), the broader C++ standard library, and an entire ecosystem of generic programming. Understanding templates is understanding modern C++.

This document traces the origins of generic programming, walks through templates as a language feature, surveys the STL and the wider standard library, and ends with a tour of the alternative libraries that compete with — and contribute to — the C++ ecosystem.

---

## 1. Origins of Generic Programming

### Stepanov's long road

Alexander Stepanov is the principal architect of the STL, and the story of how it came to exist is older than C++ itself. Stepanov began thinking about what he later called *generic programming* in the late 1970s while working at the General Electric Research and Development Center in Schenectady, New York. He was reading Euclid, Knuth, and Dijkstra, and he became convinced that algorithms should be specified in terms of the abstract requirements they place on their inputs — not in terms of concrete data types.

His earliest experiments were in *Scheme*, where he and others built a small library of generic operations on sequences. The dynamic typing of Scheme made it easy to write generic algorithms, but he wanted the efficiency of statically compiled code. The next attempt was in *Ada*, which had a generics facility from its 1983 standardization. Stepanov, working at Brooklyn Polytechnic and then at AT&T Bell Labs, used Ada generics extensively in the late 1980s. They worked, but Ada generics were verbose, and the language lacked the operator overloading and lightweight value semantics that he believed generic programming required.

In 1988, Stepanov moved to Hewlett-Packard Laboratories in Palo Alto. He initially tried to keep going with Ada and even with C, but neither matched what he was envisioning. The breakthrough came when his colleague Andrew Koenig persuaded him to look at C++ templates, which had only just been added to the language (the first cfront with templates shipped around 1990). Templates gave Stepanov what he needed: type parameters, operator overloading, value semantics, and zero-overhead instantiation.

### Musser, Lee, and the first STL

Stepanov was joined at HP Labs by **David Musser** and **Meng Lee**. Musser, a long-time collaborator going back to GE, brought decades of work on algebraic specification of programs. Together they spent four years building a library of containers, iterators, and algorithms that could be combined in arbitrary ways. The breakthrough was the iterator concept — a careful taxonomy (input, output, forward, bidirectional, random access) that let algorithms be specified once but execute efficiently against very different data structures.

In 1993, Andrew Koenig saw the in-progress library and urged Stepanov to propose it for inclusion in the upcoming C++ standard. Stepanov delivered a draft proposal to the ISO WG21 committee in **March 1994** in San Diego. The committee, working under tight deadlines for what would become C++98, accepted it almost wholesale. The result became the *Standard Template Library* — a name Stepanov did not love, since it suggested it was just a "library of templates" rather than a coherent design philosophy.

### Elements of Programming

In 2009, Stepanov and Paul McJones published *Elements of Programming*, a slim and famously dense book that lays out the mathematical foundations Stepanov had been chasing since GE. EoP defines what regular types are, how iterator categories correspond to algebraic structures, and why generic algorithms work the way they do. It is not a C++ book in the surface-syntax sense — its examples are written in a deliberately spare subset of the language — but it is the canonical statement of why the STL looks like it does.

Stepanov's later book *From Mathematics to Generic Programming* (2014, with Daniel Rose) makes the same case at a more accessible level, tracing generic programming from Euclid through Noether to modern C++.

---

## 2. What Templates Are

A template in C++ is a recipe for generating code. The compiler accepts a template definition, then *instantiates* it whenever it encounters a use that supplies concrete template arguments. The result is a fresh, fully type-checked piece of code, generated at compile time, with no runtime cost beyond what handwritten code would have.

### Class templates, function templates, variable templates, alias templates

A **class template** is a class parameterized by one or more types or values:

```cpp
template <typename T>
class Stack {
    std::vector<T> data;
public:
    void push(const T& v) { data.push_back(v); }
    T pop() { T v = data.back(); data.pop_back(); return v; }
    bool empty() const { return data.empty(); }
};

Stack<int> s;
s.push(42);
```

A **function template** is a function parameterized similarly:

```cpp
template <typename T>
T max_of(T a, T b) {
    return (a < b) ? b : a;
}

int x = max_of(3, 7);          // T deduced as int
double y = max_of(2.5, 1.1);   // T deduced as double
```

C++14 added **variable templates**, allowing parameterized constants:

```cpp
template <typename T>
constexpr T pi = T(3.1415926535897932385);

double area = pi<double> * r * r;
float  fa   = pi<float>  * fr * fr;
```

C++11 added **alias templates**, which are parameterized type aliases:

```cpp
template <typename T>
using vec = std::vector<T>;

vec<int> v;     // same as std::vector<int>
```

### Template parameters

Template parameters come in three flavors:

1. **Type parameters** — `template <typename T>` or `template <class T>`. The two keywords are interchangeable in this context.
2. **Non-type parameters** — integral constants, pointers, references, enumerations, and (since C++20) class types under structural-equality rules. The classic example is `std::array<T, N>`.
3. **Template template parameters** — a template parameter that is itself a template. Used for things like a wrapper that takes any container template.

```cpp
template <typename T, std::size_t N>
class FixedArray {
    T data[N];
};

template <template <typename, typename> class Container, typename T>
class Wrapper {
    Container<T, std::allocator<T>> c;
};
```

### Instantiation

Templates are *not* compiled until they are used. When the compiler sees `Stack<int>`, it instantiates the template by substituting `int` for `T` and type-checking the result. This is **implicit instantiation**.

If you want to force instantiation in a single translation unit (to control link order, or to put a template implementation in a `.cpp` file with a known finite set of types), you can write **explicit instantiation**:

```cpp
template class Stack<int>;        // explicit instantiation definition
extern template class Stack<int>; // explicit instantiation declaration
```

### Specialization

A template can be **fully specialized** for specific arguments:

```cpp
template <typename T>
struct Serializer {
    static std::string to_string(const T& v) { return std::to_string(v); }
};

template <>
struct Serializer<bool> {
    static std::string to_string(bool v) { return v ? "true" : "false"; }
};
```

Class templates also support **partial specialization**, where only some of the parameters are pinned down:

```cpp
template <typename T>
struct Serializer<std::vector<T>> {
    static std::string to_string(const std::vector<T>& v) { /* ... */ }
};
```

Function templates do **not** support partial specialization — only full. Overloading and tag dispatch fill the gap.

### SFINAE

**Substitution Failure Is Not An Error** is the rule that lets templates be conditionally enabled. When the compiler tries to instantiate a template and substitution of the template arguments produces an ill-formed type or expression, that candidate is silently dropped from the overload set rather than raising an error. This lets you write templates that exist only when their arguments satisfy some property:

```cpp
#include <type_traits>

template <typename T,
          typename = std::enable_if_t<std::is_integral_v<T>>>
T half(T x) { return x / 2; }
```

If you call `half(3.5)`, the substitution fails for the integral check, and the function is not considered. Before C++20 concepts, SFINAE was the workhorse of constraint-based generic programming.

### Two-phase name lookup

Template definitions are checked twice: once when the template is defined (looking up names that don't depend on template parameters) and once when it is instantiated (resolving the dependent names). This is **two-phase name lookup**, and it is why you sometimes have to write `typename T::value_type` or `this->base_member` inside a template — the compiler can't tell during phase one whether `T::value_type` is a type or a value, and base class members of dependent base types are not visible without qualification.

### Why templates live in headers

In nearly all C++ codebases, template definitions live in header files. The compiler must see the full template body at every instantiation point because each instantiation is a fresh code generation. C++98 included a feature called `export` that was supposed to let you put template definitions in `.cpp` files and have them be instantiated across translation units, but only one compiler (Comeau) ever fully implemented it. The feature was deprecated in C++11 and removed entirely. C++20 modules promise a cleaner solution, but adoption has been gradual.

---

## 3. Template Metaprogramming (TMP)

### Unruh's primality proof

In 1994, **Erwin Unruh** demonstrated at a C++ committee meeting in Sand Diego that C++ templates were Turing-complete by writing a program whose *compile errors* listed the prime numbers. The compiler instantiated a recursive template that, at certain moments, deliberately produced an error message containing each prime less than some bound. This was the first known example of **template metaprogramming** — using the template instantiation engine as a compile-time interpreter.

What started as a curiosity became, in the hands of people like Andrei Alexandrescu, David Vandevoorde, Eric Niebler, and the Boost community, a serious tool for compile-time computation, type computation, and policy-based design.

### Type traits

The `<type_traits>` header (added in C++11, expanded ever since) provides a vocabulary of compile-time type queries and transformations:

```cpp
#include <type_traits>

static_assert(std::is_integral_v<int>);
static_assert(std::is_floating_point_v<double>);
static_assert(std::is_same_v<int, int32_t>);   // platform dependent
static_assert(!std::is_pointer_v<int>);
```

Common members of `<type_traits>`:

- **Predicates**: `is_integral`, `is_floating_point`, `is_pointer`, `is_class`, `is_same`, `is_base_of`, `is_constructible`, `is_invocable`.
- **Transformations**: `remove_const`, `remove_reference`, `add_pointer`, `decay`, `common_type`, `conditional`.
- **Logic helpers**: `conjunction`, `disjunction`, `negation`.
- **Tag types**: `std::integral_constant<T, v>`, `std::true_type`, `std::false_type`.

The most important for SFINAE are `enable_if` and `conditional`:

```cpp
template <typename T>
using IfIntegral = std::enable_if_t<std::is_integral_v<T>>;

template <typename T, typename = IfIntegral<T>>
T twice(T x) { return x * 2; }
```

### `constexpr` as the modern replacement

C++11 introduced `constexpr` for compile-time evaluation, and successive standards (C++14, 17, 20, 23) have made it more powerful. Today, much of what previously required deep TMP can be written as ordinary `constexpr` functions:

```cpp
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

static_assert(factorial(5) == 120);
```

For most arithmetic-style compile-time computation, `constexpr` is now the preferred tool. TMP remains essential for *type* computation, but even there, C++20 concepts and `consteval` have reduced the need for SFINAE acrobatics.

### Boost.MPL, Boost.Hana, Loki

**Boost.MPL** (the Meta-Programming Library, released 2002) was the first general-purpose TMP library. It treated types as values and provided STL-like algorithms over compile-time type sequences. **Boost.Hana**, released 2016 by Louis Dionne, modernized the approach by leveraging C++14 generic lambdas and constexpr to perform metaprogramming with ordinary value-level syntax. Hana made TMP feel more like normal code.

Andrei Alexandrescu's 2001 book ***Modern C++ Design*** introduced **policy-based design** and **typelists** — a way of representing variadic compile-time lists before C++11 added variadic templates. The companion **Loki library** demonstrated factories, smart pointers, visitors, and singletons all parameterized by orthogonal policies. Modern C++ Design changed how an entire generation of C++ programmers thought about templates.

---

## 4. Concepts (C++20)

Concepts are the most important addition to C++ templates since templates themselves. They give templates explicit, named constraints — replacing SFINAE with declarative requirements that the compiler can check, report on, and reason about.

### Why concepts

Pre-concepts template error messages were notoriously bad. A wrong call to a deeply templated algorithm could produce hundreds of lines of error messages, with the actual mistake buried inside the instantiation chain. Concepts give a single, intelligible message: *"this type does not satisfy concept X."*

### Defining concepts

A concept is a named compile-time predicate over types:

```cpp
#include <concepts>

template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T>
T square(T x) { return x * x; }
```

You can also define a concept with a `requires` expression that asserts what operations must be valid:

```cpp
template <typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::same_as<T>;
};
```

### Standard concepts

The `<concepts>` header provides a small but powerful vocabulary:

- **Core**: `same_as`, `derived_from`, `convertible_to`, `common_with`.
- **Arithmetic**: `integral`, `signed_integral`, `unsigned_integral`, `floating_point`.
- **Object lifetime**: `destructible`, `constructible_from`, `default_initializable`, `move_constructible`, `copy_constructible`.
- **Comparison**: `equality_comparable`, `totally_ordered`, `three_way_comparable`.
- **Callable**: `invocable`, `regular_invocable`, `predicate`.
- **Combined**: `movable`, `copyable`, `semiregular`, `regular`.

`std::regular` is the concept Stepanov has been arguing for for decades — a type that behaves like a value: copyable, equality-comparable, default-constructible.

### Constrained templates

Concepts can be applied with several syntaxes:

```cpp
// Type-parameter form
template <std::integral T>
T gcd(T a, T b) { /* ... */ }

// Requires clause
template <typename T>
    requires std::integral<T>
T gcd2(T a, T b) { /* ... */ }

// Trailing requires
template <typename T>
T gcd3(T a, T b) requires std::integral<T> { /* ... */ }

// Abbreviated syntax
auto gcd4(std::integral auto a, std::integral auto b) { /* ... */ }
```

Concepts also affect overload resolution: a more constrained candidate is preferred over a less constrained one. This makes "concept overloading" a clean way to dispatch.

---

## 5. The STL — Containers

The STL container library partitions containers into *sequence containers* (ordered by insertion), *associative containers* (ordered by key), *unordered containers* (hashed by key), and *container adaptors* (implemented in terms of another container).

### Sequence containers

- **`std::vector<T>`** — dynamically sized contiguous array. The default container. Amortized O(1) push_back, O(1) random access.
- **`std::array<T, N>`** (C++11) — fixed-size array with STL interface. Stack-allocated, no dynamic memory.
- **`std::deque<T>`** — double-ended queue, typically a vector of fixed-size chunks. O(1) push_front and push_back, but iterators are not contiguous.
- **`std::list<T>`** — doubly linked list. O(1) splice and insert anywhere given an iterator. Cache-unfriendly; rarely the right choice in practice.
- **`std::forward_list<T>`** (C++11) — singly linked list, slightly more compact than list.

### Associative containers

These are typically implemented as **red-black trees**, providing O(log n) lookup, insertion, and deletion, and ordered iteration:

- `std::set<Key>` — unique sorted keys.
- `std::map<Key, Value>` — unique sorted keys with associated values.
- `std::multiset<Key>` — sorted, duplicates allowed.
- `std::multimap<Key, Value>` — sorted by key, duplicate keys allowed.

### Unordered containers (C++11)

Hash tables — O(1) average lookup, O(n) worst case:

- `std::unordered_set<Key>`
- `std::unordered_map<Key, Value>`
- `std::unordered_multiset<Key>`
- `std::unordered_multimap<Key, Value>`

The hash function and equality predicate are template parameters. Many high-performance codebases bypass these for libraries like `absl::flat_hash_map` because the standard's API forces stable iterators, which prevents the open-addressing layouts used by faster implementations.

### Container adaptors

Adaptors wrap an underlying container and present a restricted interface:

- `std::stack<T>` — LIFO, defaults to `deque`.
- `std::queue<T>` — FIFO, defaults to `deque`.
- `std::priority_queue<T>` — heap, defaults to `vector`.

### Span and mdspan

- **`std::span<T>`** (C++20) — a non-owning view over a contiguous sequence. Like a pointer-and-length pair, but type-safe and with iterator support. Replaces `(T*, size_t)` parameters in modern APIs.
- **`std::mdspan<T, Extents>`** (C++23) — a non-owning multidimensional view. Critical for numerical computing, ML kernels, and graphics. Layouts (row-major, column-major, strided) and accessor policies are template parameters, so you can target GPUs, compressed storage, etc.

### Iterator invalidation

Each container has its own rules about when operations invalidate iterators, references, and pointers. This is one of the most error-prone areas of C++:

- `vector`: any reallocation (push_back beyond capacity, insert, resize) invalidates everything. Erase invalidates from the erase point onward.
- `deque`: any insertion/deletion invalidates all iterators (but references and pointers to non-deleted elements survive insertions at the ends).
- `list`/`forward_list`: only iterators pointing to erased elements are invalidated.
- `map`/`set`: only iterators pointing to erased elements are invalidated.
- `unordered_*`: rehashing (which can be triggered by insertion) invalidates all iterators.

### Allocators and PMR

Every standard container takes an `Allocator` template parameter. The default is `std::allocator<T>`, but C++17 added the **polymorphic memory resource** machinery in `<memory_resource>`:

```cpp
#include <memory_resource>
#include <vector>

std::array<std::byte, 1024> buffer;
std::pmr::monotonic_buffer_resource pool{buffer.data(), buffer.size()};
std::pmr::vector<int> v{&pool};
```

PMR lets you swap allocators at runtime without changing the static type of the container, which solves a long-standing pain point with stateful allocators.

---

## 6. The STL — Iterators

Iterators are the connective tissue between containers and algorithms. Stepanov's insight was that almost every useful algorithm requires only a small subset of operations from its inputs, and those subsets form a hierarchy.

### Iterator categories

Each level adds capabilities:

1. **Input iterator** — single-pass, read-only forward traversal. (`std::istream_iterator`)
2. **Output iterator** — single-pass, write-only forward traversal. (`std::back_insert_iterator`)
3. **Forward iterator** — multi-pass forward traversal.
4. **Bidirectional iterator** — forward + backward. (`std::list::iterator`)
5. **Random-access iterator** — bidirectional + O(1) jump to any position. (`std::deque::iterator`)
6. **Contiguous iterator** (C++17) — random-access + guarantees that elements are stored contiguously in memory. (`std::vector::iterator`, `std::array::iterator`, raw pointers.)

C++20 promoted these from tag-based traits to **concepts**, defined in `<iterator>`:

```cpp
template <std::forward_iterator It>
auto distance_naive(It first, It last) { /* ... */ }
```

### Iterator adaptors

- `std::reverse_iterator` — flips iteration direction. `rbegin()/rend()` give you reverse iterators directly.
- `std::back_insert_iterator` and `std::back_inserter` — turn `*it = v` into `container.push_back(v)`.
- `std::front_insert_iterator` and `std::front_inserter` — same for `push_front`.
- `std::insert_iterator` and `std::inserter` — insert at an arbitrary position.
- `std::istream_iterator<T>` and `std::ostream_iterator<T>` — bridge streams into the algorithm world.
- `std::move_iterator` — turns dereference into rvalue reference, enabling move-instead-of-copy in algorithms.

### `begin`/`end` family

```cpp
v.begin()    // mutable iterator
v.cbegin()   // const iterator (always const, even on a non-const v)
v.rbegin()   // mutable reverse iterator
v.crbegin()  // const reverse iterator
```

Free functions `std::begin(v)`, `std::end(v)`, `std::cbegin(v)`, etc. work on STL containers and on raw arrays. Generic code should prefer the free-function form so it works with both.

---

## 7. The STL — Algorithms

The `<algorithm>` and `<numeric>` headers contain over 100 generic algorithms. Each is parameterized over iterator pairs and (often) a function object. The big idea is **decoupling**: an algorithm is written once and works on any container that provides the right iterator category.

### A representative cross-section

**Non-modifying**: `find`, `find_if`, `find_if_not`, `count`, `count_if`, `all_of`, `any_of`, `none_of`, `mismatch`, `equal`, `search`.

**Modifying**: `copy`, `copy_if`, `move`, `transform`, `replace`, `fill`, `generate`, `remove`, `remove_if`, `unique`, `reverse`, `rotate`, `shuffle`, `sample`.

**Sorting**: `sort` (introsort, O(n log n) guaranteed since C++11), `stable_sort` (mergesort, O(n log n) with stability), `partial_sort`, `nth_element` (O(n) selection), `is_sorted`, `is_sorted_until`.

**Binary search** (require sorted input): `binary_search`, `lower_bound`, `upper_bound`, `equal_range`.

**Set operations** (require sorted input): `set_union`, `set_intersection`, `set_difference`, `set_symmetric_difference`, `includes`, `merge`, `inplace_merge`.

**Heap**: `make_heap`, `push_heap`, `pop_heap`, `sort_heap`, `is_heap`.

**Min/max**: `min`, `max`, `minmax`, `min_element`, `max_element`, `minmax_element`, `clamp` (C++17).

**Numeric** (`<numeric>`): `accumulate`, `inner_product`, `partial_sum`, `adjacent_difference`, `iota`, `gcd` (C++17), `lcm` (C++17), `reduce` (C++17, parallelizable), `transform_reduce` (C++17), `exclusive_scan`, `inclusive_scan`.

### Example: composing algorithms

```cpp
#include <algorithm>
#include <vector>
#include <iostream>
#include <numeric>

int main() {
    std::vector<int> v{5, 2, 8, 1, 9, 3, 7, 4, 6};

    std::sort(v.begin(), v.end());
    auto it = std::lower_bound(v.begin(), v.end(), 5);

    int sum = std::accumulate(v.begin(), v.end(), 0);
    int sum_sq = std::transform_reduce(
        v.begin(), v.end(), 0,
        std::plus<>{},
        [](int x){ return x * x; });

    std::cout << "sum=" << sum << " sum_sq=" << sum_sq << '\n';
}
```

### Parallel algorithms (C++17)

Most standard algorithms gained an optional **execution policy** parameter:

```cpp
#include <execution>
std::sort(std::execution::par, v.begin(), v.end());
```

Policies:

- `std::execution::seq` — sequential, identical to no policy.
- `std::execution::par` — parallel; can run in multiple threads.
- `std::execution::par_unseq` — parallel and vectorized (allows SIMD across iterations).
- `std::execution::unseq` (C++20) — vectorized but single-threaded.

The actual implementation depends on the standard library. libstdc++ uses Intel TBB; MSVC has its own; libc++ historically lagged but has caught up.

### Why "iterators + algorithms" matters

The STL's defining decision was that algorithms operate on iterator ranges, not on container types. Stepanov saw that this single decision multiplies the value of a library: with C containers and A algorithms, instead of writing C × A specialized routines you write C iterator implementations and A generic algorithms. It is the same insight that makes Unix pipes valuable, applied at compile time.

---

## 8. Ranges (C++20)

For two decades after the original STL, generic programmers rebuilt the same wheel: a **range** as a single object holding both ends of a sequence, plus a system of *views* that lazily compose transformations. **Eric Niebler**'s **range-v3** library, started around 2013 and standardized as the basis for C++20 Ranges, was the most influential of these.

### Ranges = iterator pairs, packaged

A range is anything you can call `std::ranges::begin()` and `std::ranges::end()` on. Standard containers are ranges. Arrays are ranges. So are *views* — lightweight non-owning sequence adaptors.

### Views

Views are **lazy** and **non-owning**. They do not store data; they reference a source and produce elements on demand. The cost of constructing a view is constant.

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    auto evens_squared =
        v | std::views::filter([](int n){ return n % 2 == 0; })
          | std::views::transform([](int n){ return n * n; })
          | std::views::take(3);

    for (int x : evens_squared) std::cout << x << ' ';
    // 4 16 36
}
```

The `|` operator is overloaded for views to express composition left-to-right, like Unix pipes. Each stage is lazy: filter doesn't run until you iterate, and transform only runs on the elements that survived the filter.

Standard views in C++20 and C++23:

- `views::all` — wraps any range as a view.
- `views::filter` — keeps elements satisfying a predicate.
- `views::transform` — applies a function elementwise.
- `views::take` / `take_while` — first N elements / elements while predicate holds.
- `views::drop` / `drop_while` — skip first N / skip while predicate holds.
- `views::iota` — infinite or bounded counting sequence.
- `views::reverse` — reverses a bidirectional range.
- `views::join` — flattens a range of ranges.
- `views::split` — splits a range on a delimiter.
- `views::zip` (C++23) — element-wise tuples from multiple ranges.
- `views::enumerate` (C++23) — yields `(index, element)` pairs.
- `views::chunk` / `views::slide` (C++23) — sliding windows.
- `views::adjacent` (C++23) — pairs of adjacent elements.

### Range-constrained algorithms

Every algorithm in `<algorithm>` has a counterpart in `std::ranges` that takes a range and uses concepts:

```cpp
std::ranges::sort(v);
auto it = std::ranges::find(v, 42);
```

The range versions also support **projections**, a function applied to each element before passing it to the algorithm:

```cpp
struct Person { std::string name; int age; };
std::vector<Person> people = ...;
std::ranges::sort(people, {}, &Person::age);  // sort by age
```

### Materializing back into containers

C++23 added `std::ranges::to`, which materializes a view into a concrete container:

```cpp
auto evens = v
    | std::views::filter([](int n){ return n % 2 == 0; })
    | std::ranges::to<std::vector>();
```

Before C++23 you had to write the ugly `std::vector<int>(evens.begin(), evens.end())` form.

---

## 9. Utilities and Other Standard Library Components

Beyond containers, iterators, and algorithms, the standard library provides a rich set of utility types and headers.

### Smart pointers

`<memory>` provides ownership-encoding wrappers around raw pointers:

- **`std::unique_ptr<T>`** (C++11) — exclusive ownership, no overhead vs raw pointer. Move-only. The default ownership type.
- **`std::shared_ptr<T>`** (C++11) — reference-counted shared ownership. Atomic refcount makes copy moderately expensive.
- **`std::weak_ptr<T>`** — non-owning observer of a `shared_ptr`. Used to break cycles.
- **`std::auto_ptr<T>`** — the broken predecessor with assignment semantics that transferred ownership. Deprecated in C++11, **removed in C++17**.

```cpp
#include <memory>

auto p = std::make_unique<std::vector<int>>();
p->push_back(42);

auto sp = std::make_shared<int>(7);
auto sp2 = sp;  // refcount = 2

std::weak_ptr<int> wp = sp;
if (auto locked = wp.lock()) { /* still alive */ }
```

`std::make_unique` and `std::make_shared` are preferred over raw `new` because they avoid leaks if argument evaluation throws.

### Sum types and product types

- **`std::optional<T>`** (C++17) — either holds a value of type `T` or is empty. Replaces sentinel values and out-parameters.
- **`std::variant<T1, T2, ...>`** (C++17) — a type-safe tagged union.
- **`std::any`** (C++17) — type-erased single-value container, requires `any_cast` to retrieve.
- **`std::expected<T, E>`** (C++23) — either a value or an error, an explicit alternative to exceptions for fallible operations.
- **`std::tuple<Ts...>`** (C++11) — heterogeneous fixed-size product type.
- **`std::pair<T1, T2>`** — two-element specialization.

```cpp
#include <variant>
#include <iostream>
#include <string>

using Value = std::variant<int, double, std::string>;

void print(const Value& v) {
    std::visit([](const auto& x){ std::cout << x << '\n'; }, v);
}

int main() {
    print(42);
    print(3.14);
    print(std::string{"hello"});
}
```

`std::visit` dispatches to the appropriate overload of the visitor based on the active alternative — a clean form of double dispatch built on templates.

### Function objects

- **`std::function<R(Args...)>`** (C++11) — type-erased callable wrapper. Heap-allocates for large captures.
- **`std::bind`** (C++11) — partial application; mostly superseded by lambdas.
- **`std::move_only_function`** (C++23) — non-copyable callable wrapper, lighter than `std::function`.

### `<chrono>`

Type-safe time durations and time points:

```cpp
#include <chrono>
using namespace std::chrono_literals;

auto start = std::chrono::steady_clock::now();
std::this_thread::sleep_for(250ms);
auto elapsed = std::chrono::steady_clock::now() - start;
```

C++20 added a full **calendar and time-zone library** based on Howard Hinnant's *date* library:

```cpp
auto today = std::chrono::year_month_day{
    std::chrono::floor<std::chrono::days>(
        std::chrono::system_clock::now())};
```

### `<filesystem>` (C++17)

Cross-platform file and directory operations, derived from `boost::filesystem`:

```cpp
#include <filesystem>
namespace fs = std::filesystem;

for (auto& e : fs::recursive_directory_iterator("src")) {
    if (e.path().extension() == ".cpp") { /* ... */ }
}
```

### `<format>` and `<print>`

C++20 added `std::format`, a type-safe Python-style formatting facility based on Victor Zverovich's `fmt` library:

```cpp
#include <format>
auto s = std::format("{:>10} = {:.3f}", "pi", 3.14159265);
```

C++23 added `std::print` and `std::println` for direct stream output:

```cpp
#include <print>
std::println("hello, {}!", name);
```

These together replace `printf` (no type safety) and `iostream` (verbose, slow) with something that is both type-safe and fast.

### `<random>`

C++11 introduced a proper random number library. Engines and distributions are separated:

```cpp
#include <random>

std::mt19937 rng{std::random_device{}()};
std::uniform_int_distribution<int> dist{1, 6};
int roll = dist(rng);
```

Engines: `mt19937` (Mersenne Twister, the default), `mt19937_64`, `minstd_rand`, `ranlux24`, `ranlux48`. Distributions: uniform (int and real), normal, exponential, poisson, binomial, gamma, chi-squared, fisher_f, student_t, discrete, piecewise_constant, piecewise_linear.

### Concurrency

- **`<thread>`** — `std::thread`, `std::jthread` (C++20, joins on destruction).
- **`<mutex>`** — `mutex`, `recursive_mutex`, `shared_mutex`, `lock_guard`, `unique_lock`, `scoped_lock`.
- **`<atomic>`** — atomic types and operations, including `std::atomic_ref` (C++20).
- **`<future>`** — `future`, `promise`, `packaged_task`, `async`.
- **`<condition_variable>`** — `condition_variable`, `condition_variable_any`.
- **`<latch>`** (C++20) — single-use countdown synchronization.
- **`<barrier>`** (C++20) — reusable phase-based synchronization.
- **`<semaphore>`** (C++20) — `counting_semaphore`, `binary_semaphore`.
- **`<stop_token>`** (C++20) — cooperative cancellation, used by `jthread`.

### `<coroutine>` (C++20)

C++20 added the *plumbing* for coroutines but no standard library coroutine types. You write your own task/generator types using the `coroutine_handle` and promise type machinery, or you use a third-party library like cppcoro. C++23 added `std::generator`. The senders/receivers proposal (`std::execution`) for structured async is heading toward C++26.

### `<mdspan>` and `<stacktrace>`

C++23 brought:

- **`<mdspan>`** — multidimensional non-owning views with policy-based layout and accessor.
- **`<stacktrace>`** — runtime stack traces, useful for diagnostics.
- **`<expected>`** — the `std::expected<T,E>` type mentioned earlier.

---

## 10. Standard Library Philosophy

### Header-only by necessity

Because templates must be visible at every instantiation point, the bulk of the C++ standard library is header-only. The compiled portion is small: I/O, locale, exceptions, the core RTTI machinery, parts of `<chrono>` and `<filesystem>`, the parallel algorithms backend. Nearly everything else lives in headers and is recompiled in every translation unit that uses it. This makes C++ compilation slow — the price you pay for zero-overhead generic programming.

C++20 modules (`import std;`) promise to fix this by precompiling the standard library once per project, but adoption is still uneven across compilers and build systems.

### The `std::` namespace

Every standard library identifier lives in `std`. Some sub-namespaces exist for organization: `std::chrono`, `std::ranges`, `std::views`, `std::filesystem`, `std::execution`, `std::pmr`, `std::literals`. The committee guards `std` jealously — adding a new name there requires going through the standardization process.

### ABI stability

The three major standard library implementations are:

- **libstdc++** — GNU, ships with GCC. The most widely used on Linux.
- **libc++** — LLVM, ships with Clang. The default on macOS, FreeBSD, and increasingly on embedded.
- **MSVC STL** — Microsoft, ships with Visual Studio. Open source since 2019.

All three preserve **ABI compatibility** across versions: a binary compiled against libstdc++ from 2015 should still link and run against libstdc++ from 2024. This constraint is the single biggest reason the standard library cannot be aggressively optimized — changes to layout, vtables, or member function signatures would break existing binaries. The proposed `std::regex` rewrite, the long-rumored `std::unordered_map` open-addressing rewrite, and even `std::string` small-buffer optimization changes have been blocked by ABI concerns. There is an ongoing debate about whether to break ABI in a future version of the standard.

### "You don't pay for what you don't use"

This is Bjarne Stroustrup's defining principle. Features that aren't used produce no runtime cost. Templates aren't instantiated unless used. Exceptions cost nothing on the happy path (under modern table-driven implementations). RTTI can be disabled. The standard library is opt-in: you pay only for the headers you `#include`.

### Freestanding vs hosted

C++ has two compliance levels:

- **Hosted** — full standard library, requires an OS. The default for application code.
- **Freestanding** — minimal standard library, no requirement for `main`, no I/O, no exceptions, no allocators by default. Used in OS kernels, bootloaders, embedded firmware, and bare-metal real-time systems.

C++23 expanded the freestanding subset substantially, adding `<expected>`, parts of `<ranges>`, much of `<utility>`, and many type traits. This is part of an ongoing effort to make C++ more attractive in embedded and safety-critical domains where heap allocation and exceptions are forbidden.

---

## 11. Alternative and Extension Libraries

### Boost

**Boost** has been the staging ground for new C++ library features since 1998. Founded by Beman Dawes and others (including several committee members), it operates as a peer-reviewed incubator: a library is proposed, reviewed against Boost coding standards, and accepted or rejected by community vote. Many Boost libraries have been adopted into the standard:

- `boost::shared_ptr` → `std::shared_ptr` (C++11)
- `boost::regex` → `std::regex` (C++11)
- `boost::filesystem` → `std::filesystem` (C++17)
- `boost::chrono` (Hinnant's date library) → `std::chrono` (C++11/20)
- `boost::variant` → `std::variant` (C++17, with API changes)
- `boost::optional` → `std::optional` (C++17)
- `boost::any` → `std::any` (C++17)
- `boost::thread` → `std::thread` (C++11)
- `boost::format` → influenced `std::format` (C++20)
- `boost::array` → `std::array` (C++11)
- `boost::tuple` → `std::tuple` (C++11)
- `boost::function`, `boost::bind` → `std::function`, `std::bind` (C++11)

Boost remains relevant for libraries that haven't (yet) been standardized: **Boost.Asio** (the basis for the upcoming networking proposal), **Boost.Spirit** (parser combinators), **Boost.Hana** (modern metaprogramming), **Boost.Geometry**, **Boost.Graph**, **Boost.Multiprecision**, **Boost.Beast** (HTTP/WebSocket on top of Asio), **Boost.PFR** (precise field reflection), and many others.

### Abseil (Google)

**Abseil** is Google's open-source extension to the C++ standard library. It contains the building blocks of Google's internal C++ codebase — what they wished `std::` had. Notable components:

- **`absl::flat_hash_map`**, **`absl::flat_hash_set`**, **`absl::node_hash_map`** — open-addressing hash tables that are 2-5x faster than `std::unordered_map`.
- **`absl::InlinedVector`** — vector with small-buffer optimization.
- **`absl::Cord`** — rope-like string for very large concatenations.
- **`absl::Time`**, **`absl::Duration`** — time types that predate C++20 calendars.
- **`absl::StatusOr<T>`** — Google's expected/result type.
- **`absl::Mutex`** — mutex with thread-safety annotation support.

Abseil has its own ABI policy (incompatible breakage allowed at version boundaries) and tracks the standard, eventually deprecating components when their `std::` equivalents catch up.

### EASTL (Electronic Arts)

**EASTL** is the **Electronic Arts Standard Template Library**, open-sourced in 2016 (originally written around 2007 by Paul Pedriana). Designed for game development, where the standard library's allocator model and ABI constraints get in the way:

- Allocator interface that EA games can specialize per arena.
- Containers tuned for cache-friendly access patterns.
- Aggressive small-buffer optimization on strings and vectors.
- No exception requirement.
- Header style and APIs deliberately mirror `std::` so it can be a near-drop-in replacement.

### Folly (Facebook/Meta)

**Folly** (Facebook Open Source Library) is Meta's collection of C++ utilities, similar in spirit to Abseil but with a different feature set:

- **`folly::fbstring`** — string with multiple SBO modes.
- **`folly::F14`** — F14 hash table family, different design from Abseil.
- **`folly::Future`** and **`folly::Promise`** — composable futures predating C++23 senders.
- **`folly::dynamic`** — JSON-like dynamic value type.
- **`folly::IOBuf`** — efficient zero-copy network buffer chains.
- **`folly::coro`** — coroutine library on top of `<coroutine>`.

### Qt containers

The **Qt** framework provides its own parallel hierarchy of containers and utilities (`QString`, `QList`, `QVector`, `QMap`, `QHash`, `QSharedPointer`). Historically these used **implicit sharing** (copy-on-write), which gave very different performance characteristics from STL containers. As of Qt 6, several Qt containers (notably `QList`) have been redesigned to be closer to `std::vector`, but Qt's strings, signal/slot system, and meta-object compiler remain a distinctive flavor.

---

## Closing Thoughts

The C++ template system exists because Alexander Stepanov needed a vehicle for an idea he had been working on since the late 1970s, and because Bjarne Stroustrup's design of templates happened to be flexible enough to host that idea. The STL became the proof that generic programming could be both efficient and elegant. Three decades later, templates have evolved into a compile-time metaprogramming engine, the standard library has grown to include filesystem, networking primitives, ranges, coroutines, and concepts, and a thriving ecosystem of alternative libraries continues to push the language forward.

What remains constant is the original insight: **algorithms should be written against abstract requirements, and types should satisfy those requirements without paying for anything they don't need**. Iterators, ranges, concepts, and the upcoming reflection facilities are all expressions of that principle. The next decade of C++ — modules, senders/receivers, contracts, pattern matching, static reflection — will continue to extend it.

The story of C++ templates is, in the end, the story of one man's stubborn conviction that generic programming was worth pursuing for forty years until the right language showed up to host it.
