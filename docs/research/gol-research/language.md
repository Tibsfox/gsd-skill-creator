# Go (Golang) -- Deep Technical Reference

> *"Less is exponentially more."* -- Rob Pike, June 2012

Go is a statically typed, compiled language designed at Google in 2007 by Robert Griesemer, Rob Pike, and Ken Thompson. First released as open source in November 2009, Go 1.0 shipped in March 2012 with a compatibility promise that remains unbroken.

---

## 1. Design Philosophy

Go was born from frustration with C++ build times and complexity at Google. The designers -- all veterans of Unix, Plan 9, and systems programming -- made deliberate subtractions:

- **No classes.** Structs with methods. Composition, not inheritance.
- **No inheritance.** Embedding provides code reuse without the fragile base class problem.
- **No exceptions.** Errors are values. Every failure path is explicit.
- **No generics (until 1.18).** 13 years without parametric polymorphism. When generics arrived, they were deliberately minimal.
- **No macros.** No preprocessor. What you read is what compiles.
- **No operator overloading.** `+` always means addition or string concatenation.
- **One formatter.** `gofmt` ends all style debates. There is one canonical formatting.
- **Fast compilation.** The entire standard library compiles in seconds.

The philosophy: *reading* code matters more than *writing* code. A team of hundreds must read each other's work without deciphering clever abstractions. Go optimizes for the maintenance programmer, not the original author.

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, %s", r.URL.Path[1:])
    })
    http.ListenAndServe(":8080", nil)
}
```

Key design principles: (1) Orthogonality -- features compose without special cases. (2) No implicit conversions -- all type conversions explicit, even `int32` to `int64`. (3) No unused imports or variables -- compiler rejects them as errors. (4) Dependency management is a language concern.

---

## 2. Types

```go
// Boolean
var alive bool          // zero value: false

// Signed integers
var i int               // platform-dependent: 32 or 64 bits
var i8 int8             // -128 to 127
var i16 int16           // -32768 to 32767
var i32 int32           // -2B to 2B
var i64 int64           // full 64-bit range

// Unsigned integers
var u uint              // platform-dependent
var u8 uint8            // 0 to 255 (alias: byte)
var u32 uint32          // 0 to 4B
var u64 uint64          // 0 to 18.4E

// Floating point
var f32 float32         // IEEE 754 single
var f64 float64         // IEEE 754 double

// Complex numbers
var c64 complex64       // float32 real + float32 imaginary
var c128 complex128     // float64 real + float64 imaginary

// String: immutable UTF-8 byte sequence
var s string            // zero value: ""

// byte = uint8, rune = int32 (Unicode code point)
var b byte
var r rune              // e.g., 'A' = 65, U+4E16 = 19990
```

Every type has a zero value. There is no uninitialized memory: `bool`=`false`, numerics=`0`, `string`=`""`, pointers/slices/maps/channels/interfaces=`nil`, structs=all fields zeroed.

```go
var s []int             // nil (but len=0, cap=0, append works)
var m map[string]int    // nil (reads return zero value, writes panic)
```

---

## 3. Variables and Constants

```go
var name string = "Go"      // full declaration
var name = "Go"              // type inference
name := "Go"                 // short declaration (functions only)

// Multiple declaration
var (
    host  = "localhost"
    port  = 8080
    debug = false
)

x, y := 10, 20
x, y = y, x                 // swap
_, err := someFunction()     // blank identifier discards value

// Constants -- typed or untyped (untyped have 256+ bit precision)
const pi float64 = 3.14159265358979
const e = 2.71828182845904523536   // untyped, adapts to context

// iota: auto-incrementing constant generator
const (
    Read    = 1 << iota // 1
    Write               // 2
    Execute              // 4
)

const (
    _  = iota
    KB = 1 << (10 * iota) // 1024
    MB                     // 1048576
    GB                     // 1073741824
    TB                     // 1099511627776
)
```

---

## 4. Functions

```go
// Multiple return values
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

// Named return values
func parseCoord(s string) (lat, lon float64, err error) {
    parts := strings.Split(s, ",")
    if len(parts) != 2 {
        err = fmt.Errorf("expected lat,lon, got %q", s)
        return // naked return
    }
    lat, err = strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
    if err != nil { return }
    lon, err = strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
    return
}

// Variadic functions
func sum(nums ...int) int {
    total := 0
    for _, n := range nums { total += n }
    return total
}
sum(1, 2, 3)
nums := []int{4, 5, 6}
sum(nums...)             // spread

// First-class functions and closures
func counter() func() int {
    n := 0
    return func() int {
        n++
        return n
    }
}
c := counter()
c() // 1
c() // 2

// Defer: LIFO cleanup, guaranteed to run on function return
func readFile(path string) ([]byte, error) {
    f, err := os.Open(path)
    if err != nil { return nil, err }
    defer f.Close()
    return io.ReadAll(f)
}
```

Defer evaluates arguments immediately but executes the call when the enclosing function returns. Multiple defers run in LIFO order.

---

## 5. Structs

```go
type Point struct {
    X, Y float64
}

// Value receiver -- operates on a copy
func (p Point) Distance(q Point) float64 {
    dx := p.X - q.X
    dy := p.Y - q.Y
    return math.Sqrt(dx*dx + dy*dy)
}

// Pointer receiver -- can modify the receiver
func (p *Point) Scale(factor float64) {
    p.X *= factor
    p.Y *= factor
}

// Embedding: composition, not inheritance
type Animal struct {
    Name string
}
func (a Animal) Speak() string {
    return fmt.Sprintf("I am %s", a.Name)
}

type Dog struct {
    Animal        // embedded -- promotes fields and methods
    Breed string
}

d := Dog{Animal: Animal{Name: "Rex"}, Breed: "GSD"}
d.Speak()  // promoted: calls d.Animal.Speak()
d.Name     // promoted field

// Struct tags (JSON, DB, validation)
type User struct {
    ID    int    `json:"id" db:"user_id"`
    Email string `json:"email" validate:"required,email"`
    Pass  string `json:"-"` // omit from JSON
}

// Anonymous structs
point := struct{ X, Y int }{10, 20}
```

**Value vs pointer receivers.** Use pointer when: method modifies receiver, struct is large, or for consistency if any method uses pointer receiver. Value receivers are safe for concurrent use (each call gets a copy).

---

## 6. Interfaces

Interfaces are satisfied *implicitly*. No `implements` keyword. If a type has the methods, it satisfies the interface ("structural typing").

```go
type Shape interface {
    Area() float64
    Perimeter() float64
}

type Circle struct{ Radius float64 }
func (c Circle) Area() float64      { return math.Pi * c.Radius * c.Radius }
func (c Circle) Perimeter() float64 { return 2 * math.Pi * c.Radius }

type Rectangle struct{ Width, Height float64 }
func (r Rectangle) Area() float64      { return r.Width * r.Height }
func (r Rectangle) Perimeter() float64 { return 2 * (r.Width + r.Height) }

// Both satisfy Shape without declaring it
func printShape(s Shape) {
    fmt.Printf("Area: %.2f, Perimeter: %.2f\n", s.Area(), s.Perimeter())
}

// Empty interface / any (Go 1.18+)
func printAnything(v any) { fmt.Println(v) }

// Interface composition
type ReadWriter interface {
    io.Reader
    io.Writer
}

// Type assertion
f, ok := w.(*os.File)

// Type switch
switch v := i.(type) {
case int:    fmt.Printf("int: %d", v)
case string: fmt.Printf("string: %q", v)
default:     fmt.Printf("unknown: %T", v)
}
```

The canonical interfaces: `io.Reader` (Read), `io.Writer` (Write), `fmt.Stringer` (String), `error` (Error). *"The bigger the interface, the weaker the abstraction."* -- Rob Pike

---

## 7. Generics (Go 1.18+)

Go resisted generics for 13 years. The final design prioritizes readability at the call site over power at the definition site.

```go
// Generic function
func Map[T any, U any](s []T, f func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s {
        result[i] = f(v)
    }
    return result
}
doubled := Map([]int{1, 2, 3}, func(n int) int { return n * 2 })

// Type constraints (interfaces as constraints)
type Ordered interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
    ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
    ~float32 | ~float64 | ~string
}

func Min[T Ordered](a, b T) T {
    if a < b { return a }
    return b
}

// ~ means underlying type: named types like `type Celsius float64` match ~float64

// comparable: built-in constraint supporting == and !=
func Contains[T comparable](s []T, target T) bool {
    for _, v := range s {
        if v == target { return true }
    }
    return false
}

// Generic types
type Stack[T any] struct { items []T }

func (s *Stack[T]) Push(v T)       { s.items = append(s.items, v) }
func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T
        return zero, false
    }
    v := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return v, true
}
```

No variance, no specialization, no higher-kinded types, no method-level type parameters. Deliberately minimal.

---

## 8. Error Handling

```go
// The error interface
type error interface { Error() string }

// Creating errors
err := errors.New("something went wrong")
err := fmt.Errorf("failed to open %s: %w", filename, os.ErrNotExist) // %w wraps

// The if err != nil pattern
func loadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("reading config: %w", err)
    }
    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return nil, fmt.Errorf("parsing config: %w", err)
    }
    return &cfg, nil
}

// Sentinel errors
var ErrNotFound = errors.New("not found")

// Custom error types
type ValidationError struct {
    Field, Message string
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation: %s: %s", e.Field, e.Message)
}

// errors.Is/As (Go 1.13+) -- traverse wrapped chain
if errors.Is(err, os.ErrNotExist) { /* ... */ }

var valErr *ValidationError
if errors.As(err, &valErr) {
    fmt.Println(valErr.Field)
}

// errors.Join (Go 1.20) -- combine multiple errors
return errors.Join(err1, err2, err3)
```

Go chose explicit error returns over exceptions: (1) every error path is visible, (2) control flow is linear, (3) errors are values you can store, transform, and compare.

---

## 9. Packages and Modules

```go
package main        // executable
package http        // library
package http_test   // external test package (black-box)

import (
    "fmt"                           // stdlib
    "github.com/user/repo/pkg"     // third-party
    myhttp "github.com/user/http"  // alias
    _ "github.com/lib/pq"          // blank: side effects only (init)
)
```

**go.mod** defines the module, Go version, and dependencies. `go mod tidy` syncs imports. `proxy.golang.org` provides immutable, checksummed module caching. Semantic import versioning: v2+ requires path suffix (`import "pkg/v2"`).

**Internal packages:** code in `internal/` is only importable by parent tree. **init functions** run automatically on import, after package-level vars initialize. Multiple `init()` per file allowed.

---

## 10. Slices, Arrays, and Maps

```go
// Arrays: fixed size, value type (copied on assignment)
a := [3]int{1, 2, 3}
b := a    // b is a copy

// Slices: dynamic, reference to underlying array
s := []int{1, 2, 3, 4, 5}
s = append(s, 6)
s2 := make([]int, 0, 100)    // len=0, cap=100

// Slice expressions
s[1:4]         // elements 1,2,3
s[:0]          // empty, keeps underlying array
s[1:3:5]       // three-index: limits capacity

// Copy
dst := make([]int, len(src))
copy(dst, src)

// nil slice vs empty slice
var ns []int       // nil
es := []int{}      // not nil
// Both: len=0, cap=0, append works. Prefer nil.

// Maps: unordered hash table
m := map[string]int{"alice": 32, "bob": 28}
m["carol"] = 35
age, ok := m["dave"]  // comma-ok: ok=false if missing
delete(m, "bob")

// make vs new
s := make([]int, 10)        // initialized slice
m := make(map[string]int)   // initialized map
ch := make(chan int, 5)      // initialized channel
p := new(int)                // *int pointing to zero value (rarely used)
```

---

## 11. Pointers

```go
x := 42
p := &x         // p is *int, points to x
fmt.Println(*p) // 42 (dereference)
*p = 100        // x is now 100

// No pointer arithmetic (unlike C)
// Go is pass-by-value; pointers let you share

func increment(n *int) { *n++ }
increment(&x)

// Constructor pattern
func NewServer(addr string) *Server {
    return &Server{addr: addr, routes: make(map[string]Handler)}
}
```

Use pointers when: struct is large, method must modify receiver, nil is meaningful state. Use values when: small structs, immutable operations, independent copies needed.

---

## 12. Control Flow

```go
// if with init statement
if err := doWork(); err != nil { return err }

// for: the only loop
for i := 0; i < 10; i++ { }    // C-style
for n > 0 { n-- }               // while-style
for { break }                    // infinite

// range
for i, v := range slice { }
for k, v := range myMap { }
for i, r := range "Hello" { }   // yields runes
for msg := range ch { }         // channel
for i := range 10 { }           // Go 1.22+

// switch: no fallthrough by default
switch day {
case "Mon", "Tue", "Wed", "Thu", "Fri": fmt.Println("weekday")
case "Sat", "Sun": fmt.Println("weekend")
}

// Tagless switch (replaces if/else chains)
switch {
case temp < 0:  fmt.Println("freezing")
case temp < 20: fmt.Println("cold")
default:        fmt.Println("warm")
}

// select: channel multiplexer
select {
case msg := <-ch1: process(msg)
case ch2 <- val:   fmt.Println("sent")
case <-time.After(5 * time.Second): fmt.Println("timeout")
default: fmt.Println("non-blocking")
}
```

---

## 13. Strings and Unicode

```go
s := "Hello, world"
len(s)         // 13 bytes, not characters
s[0]           // 72 (byte 'H')

// range yields runes with byte offset
for i, r := range "\u4e16\u754c" {
    fmt.Printf("byte %d: %c (U+%04X)\n", i, r, r)
}

utf8.RuneCountInString("\u4e16\u754c") // 2 runes
len("\u4e16\u754c")                     // 6 bytes

// Raw string literals (backticks)
query := `SELECT * FROM users WHERE active = true`

// Efficient string building
var b strings.Builder
for i := 0; i < 1000; i++ {
    fmt.Fprintf(&b, "item %d\n", i)
}
result := b.String()

// Key packages: strings, strconv, fmt, unicode, unicode/utf8
```

---

## 14. Concurrency Primitives

> *"Don't communicate by sharing memory; share memory by communicating."*

```go
// Goroutines
go processRequest(req)
go func() { fmt.Println("concurrent") }()

// Channels
ch := make(chan int)       // unbuffered (synchronous)
ch := make(chan int, 100)  // buffered
ch <- 42                   // send
val := <-ch                // receive
close(ch)

// Directional channels
func producer(out chan<- int) { }  // send-only
func consumer(in <-chan int)  { }  // receive-only

// WaitGroup
var wg sync.WaitGroup
for _, url := range urls {
    wg.Add(1)
    go func(u string) {
        defer wg.Done()
        fetch(u)
    }(url)
}
wg.Wait()

// Mutex
var mu sync.Mutex
mu.Lock()
defer mu.Unlock()
count++

// RWMutex, Once, sync/atomic
var once sync.Once
once.Do(func() { instance = &Singleton{} })
atomic.AddInt64(&counter, 1)
```

---

## 15. Goroutines In Depth

Goroutines are lightweight, cooperatively scheduled units. ~4 KB initial stack (grows dynamically). M:N scheduling: goroutines multiplexed onto OS threads via the GMP model (Goroutine, Machine/OS thread, Processor/logical CPU). Since Go 1.14, goroutines are preemptible at any safe point.

```go
runtime.GOMAXPROCS(4)          // set P count (defaults to CPU cores)
fmt.Println(runtime.NumGoroutine()) // active goroutine count

// main() is a goroutine. When it returns, all goroutines die immediately.
// Always synchronize:
done := make(chan struct{})
go func() {
    defer close(done)
    work()
}()
<-done
```

---

## 16. Channel Patterns

```go
// Pipeline
func generator(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums { out <- n }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in { out <- n * n }
        close(out)
    }()
    return out
}

// generator -> square -> print
for v := range square(generator(2, 3, 4)) {
    fmt.Println(v) // 4, 9, 16
}

// Fan-in: merge multiple channels into one
func fanIn(channels ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    merged := make(chan int)
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c { merged <- v }
        }(ch)
    }
    go func() { wg.Wait(); close(merged) }()
    return merged
}

// Done channel: signal shutdown
done := make(chan struct{})
close(done)  // all goroutines doing <-done receive immediately
```

---

## 17. Context

`context.Context` propagates cancellation, deadlines, timeouts, and request-scoped values through call trees.

```go
ctx := context.Background()              // root, never canceled
ctx := context.TODO()                     // placeholder

// Cancellation
ctx, cancel := context.WithCancel(ctx)
defer cancel()

// Timeout
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()

// Deadline
ctx, cancel := context.WithDeadline(ctx, time.Now().Add(30*time.Second))
defer cancel()

// Check in long operations
select {
case <-ctx.Done():
    return ctx.Err() // Canceled or DeadlineExceeded
default:
}

// Request-scoped values
type contextKey string
const userKey contextKey = "user"

func WithUser(ctx context.Context, u *User) context.Context {
    return context.WithValue(ctx, userKey, u)
}
func UserFromContext(ctx context.Context) (*User, bool) {
    u, ok := ctx.Value(userKey).(*User)
    return u, ok
}
```

Rules: (1) Never store context in a struct -- pass as first param. (2) Always call cancel. (3) Never pass nil -- use `context.TODO()`. (4) WithValue is for request-scoped data only.

---

## 18. Defer, Panic, Recover

```go
// Defer: guaranteed cleanup, LIFO order
func writeFile(path string, data []byte) error {
    f, err := os.Create(path)
    if err != nil { return err }
    defer f.Close()
    _, err = f.Write(data)
    return err
}

// Panic: unrecoverable errors (programmer bugs, impossible states)
func MustCompile(pattern string) *regexp.Regexp {
    re, err := regexp.Compile(pattern)
    if err != nil { panic("invalid regexp: " + pattern) }
    return re
}

// Recover: catch panic in deferred function
func safeDiv(a, b int) (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("caught panic: %v", r)
        }
    }()
    return a / b, nil
}

// HTTP server recovery middleware
func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("panic: %v\n%s", err, debug.Stack())
                http.Error(w, "Internal Server Error", 500)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

Panic is NOT for expected runtime errors. The recover pattern is intentionally awkward -- Go wants errors for expected failures.

---

## 19. Testing

```go
// File: math_test.go
package math

import "testing"

func TestAdd(t *testing.T) {
    if got := Add(2, 3); got != 5 {
        t.Errorf("Add(2, 3) = %d, want 5", got)
    }
}

// Table-driven tests -- the idiomatic pattern
func TestFibonacci(t *testing.T) {
    tests := []struct {
        name string
        n    int
        want int
    }{
        {"zero", 0, 0},
        {"one", 1, 1},
        {"ten", 10, 55},
        {"twenty", 20, 6765},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if got := Fibonacci(tt.n); got != tt.want {
                t.Errorf("Fibonacci(%d) = %d, want %d", tt.n, got, tt.want)
            }
        })
    }
}

// Benchmarks
func BenchmarkFibonacci(b *testing.B) {
    for i := 0; i < b.N; i++ { Fibonacci(20) }
}

// Fuzz testing (Go 1.18+)
func FuzzReverse(f *testing.F) {
    f.Add("hello")
    f.Fuzz(func(t *testing.T, s string) {
        rev := Reverse(s)
        if s != Reverse(rev) {
            t.Errorf("double reverse mismatch: %q", s)
        }
    })
}
```

Commands: `go test ./...`, `go test -race -v`, `go test -bench=. -benchmem`, `go test -cover`, `go test -fuzz=FuzzReverse`.

---

## 20. Embedding and Composition

Go has no inheritance. Embedding promotes fields and methods -- composition with syntactic convenience.

```go
// Struct embedding
type Logger struct{ Prefix string }
func (l Logger) Log(msg string) { fmt.Printf("[%s] %s\n", l.Prefix, msg) }

type Server struct {
    Logger          // promoted: Server.Log() calls Logger.Log()
    Addr string
}

s := Server{Logger: Logger{Prefix: "HTTP"}, Addr: ":8080"}
s.Log("starting")  // promoted method

// Shadowing (not overriding)
func (s Server) Log(msg string) {
    fmt.Printf("SERVER [%s] %s\n", s.Prefix, msg)
}
s.Log("x")           // Server.Log
s.Logger.Log("x")    // Logger.Log (still accessible)

// Interface embedding
type ReadWriteCloser interface {
    io.Reader
    io.Writer
    io.Closer
}

// Embedding for interface satisfaction
type CountingWriter struct {
    io.Writer
    BytesWritten int64
}

func (cw *CountingWriter) Write(p []byte) (int, error) {
    n, err := cw.Writer.Write(p)
    cw.BytesWritten += int64(n)
    return n, err
}
```

Why composition over inheritance: (1) no fragile base class problem, (2) explicit delegation, (3) interface satisfaction decoupled from hierarchy, (4) shallow hierarchies are structurally encouraged.

---

## Comprehensive Example: Worker Pool

```go
package taskqueue

import (
    "context"
    "errors"
    "fmt"
    "sync"
    "time"
)

var (
    ErrQueueFull   = errors.New("task queue is full")
    ErrQueueClosed = errors.New("task queue is closed")
)

type TaskError struct {
    TaskID string
    Cause  error
}

func (e *TaskError) Error() string { return fmt.Sprintf("task %s: %v", e.TaskID, e.Cause) }
func (e *TaskError) Unwrap() error { return e.Cause }

type Task interface {
    ID() string
    Execute(ctx context.Context) error
}

type Handler interface {
    OnSuccess(task Task)
    OnFailure(task Task, err error)
}

type Pool struct {
    mu      sync.Mutex
    tasks   chan Task
    handler Handler
    workers int
    closed  bool
    wg      sync.WaitGroup
}

func NewPool(size, queueCap int, h Handler) *Pool {
    return &Pool{tasks: make(chan Task, queueCap), handler: h, workers: size}
}

func (p *Pool) Start(ctx context.Context) {
    for i := 0; i < p.workers; i++ {
        p.wg.Add(1)
        go p.worker(ctx)
    }
}

func (p *Pool) Submit(task Task) error {
    p.mu.Lock()
    defer p.mu.Unlock()
    if p.closed { return ErrQueueClosed }
    select {
    case p.tasks <- task: return nil
    default: return ErrQueueFull
    }
}

func (p *Pool) Shutdown() {
    p.mu.Lock()
    p.closed = true
    p.mu.Unlock()
    close(p.tasks)
    p.wg.Wait()
}

func (p *Pool) worker(ctx context.Context) {
    defer p.wg.Done()
    for task := range p.tasks {
        taskCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
        err := task.Execute(taskCtx)
        cancel()
        if err != nil {
            p.handler.OnFailure(task, &TaskError{TaskID: task.ID(), Cause: err})
        } else {
            p.handler.OnSuccess(task)
        }
    }
}
```

### Table-Driven Test for the Pool

```go
func TestPool(t *testing.T) {
    tests := []struct {
        name        string
        workers     int
        tasks       []mockTask
        wantSuccess int
        wantFail    int
    }{
        {"all succeed", 2, []mockTask{{id: "1"}, {id: "2"}, {id: "3"}}, 3, 0},
        {"some fail", 2, []mockTask{{id: "1"}, {id: "2", err: errors.New("boom")}, {id: "3"}}, 2, 1},
        {"single worker", 1, []mockTask{{id: "a"}, {id: "b"}}, 2, 0},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            h := &recorder{failures: make(map[string]error)}
            p := taskqueue.NewPool(tt.workers, 10, h)
            p.Start(context.Background())
            for i := range tt.tasks {
                if err := p.Submit(&tt.tasks[i]); err != nil {
                    t.Fatal(err)
                }
            }
            p.Shutdown()
            if got := len(h.successes); got != tt.wantSuccess {
                t.Errorf("successes = %d, want %d", got, tt.wantSuccess)
            }
            if got := len(h.failures); got != tt.wantFail {
                t.Errorf("failures = %d, want %d", got, tt.wantFail)
            }
        })
    }
}
```

---

## Go Toolchain Reference

```bash
go build ./...                                          # compile
go run main.go                                          # compile + run
go test -race -v ./...                                  # test with race detector
go vet ./...                                            # static analysis
gofmt -w .                                              # format
go mod tidy                                             # sync dependencies
GOOS=linux GOARCH=amd64 go build -o server              # cross-compile
go test -cpuprofile=cpu.out && go tool pprof cpu.out     # profile
```

## Version History

| Version | Date | Key Feature |
|---------|------|-------------|
| 1.0 | Mar 2012 | Compatibility promise |
| 1.5 | Aug 2015 | Compiler rewritten C to Go |
| 1.11 | Aug 2018 | Modules (experimental) |
| 1.13 | Sep 2019 | errors.Is/As/Unwrap |
| 1.16 | Feb 2021 | embed, io/fs |
| 1.18 | Mar 2022 | Generics, fuzz testing |
| 1.20 | Feb 2023 | errors.Join, PGO |
| 1.21 | Aug 2023 | log/slog, maps/slices packages |
| 1.22 | Feb 2024 | Range-over-int, enhanced net/http routing |
| 1.23 | Aug 2024 | Iterators (iter package), range-over-func |
| 1.24 | Feb 2025 | weak package, Swiss Tables for maps |

## Further Reading

- **Effective Go** -- https://go.dev/doc/effective_go
- **The Go Programming Language** -- Donovan & Kernighan, 2015
- **Go Proverbs** -- https://go-proverbs.github.io/
- **Go spec** -- https://go.dev/ref/spec
