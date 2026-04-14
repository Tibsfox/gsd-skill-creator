# Go (Golang) Ecosystem

> PNW Research Series -- Rosetta Cluster: AI & Computation
> Deep research on Go's toolchain, standard library, cloud-native dominance, and ecosystem

---

## 1. The Go Toolchain

Go ships a single binary (`go`) that contains every tool a developer needs. No package manager installer, no build system plugin, no formatter download. This all-in-one philosophy is a deliberate design choice inherited from Plan 9 at Bell Labs, where Rob Pike and Ken Thompson previously worked.

### Core Commands

**go build** -- Compiles packages and dependencies into a binary.

```bash
# Build the current package
go build .

# Build with output name
go build -o myapp ./cmd/server

# Build with linker flags (embed version info)
go build -ldflags "-X main.version=1.2.3 -s -w" -o myapp .
```

The `-s -w` flags strip debug info and DWARF symbols, reducing binary size by 20-30%.

**go run** -- Compiles and runs in one step. Useful for scripts and exploration.

```bash
go run main.go
go run ./cmd/server
```

**go test** -- Runs tests, benchmarks, and fuzz targets. No external test runner needed.

```bash
go test ./...                    # All packages recursively
go test -v ./pkg/auth            # Verbose output for one package
go test -run TestLogin ./...     # Run tests matching regex
go test -bench=. ./...           # Run benchmarks
go test -cover ./...             # Show coverage percentage
go test -coverprofile=cover.out ./...  # Generate coverage file
go tool cover -html=cover.out    # Open coverage in browser
go test -race ./...              # Enable race detector
go test -count=1 ./...           # Disable test caching
```

**go fmt** -- Formats code to the canonical style. There is exactly one correct format. No configuration. No arguments about tabs vs spaces (Go uses tabs). No style guides to write.

```bash
go fmt ./...       # Format all files
gofmt -s -w .      # Simplify + write (lower-level tool)
```

**go vet** -- Static analysis for common mistakes. Catches printf format mismatches, unreachable code, incorrect struct tags, and more.

```bash
go vet ./...
```

**go mod** -- Module management commands.

```bash
go mod init github.com/user/project   # Initialize a new module
go mod tidy                            # Add missing, remove unused deps
go mod vendor                          # Copy deps into vendor/
go mod download                        # Download deps to cache
go mod graph                           # Print dependency graph
go mod why github.com/some/dep         # Explain why a dep is needed
go mod edit -replace=old=new@v1.0.0    # Add replace directive
```

**go generate** -- Runs commands embedded in source comments. Used for code generation (protobuf, stringer, enums, mocks).

```go
//go:generate stringer -type=Status
//go:generate mockgen -source=repo.go -destination=mock_repo.go
//go:generate protoc --go_out=. --go-grpc_out=. service.proto
```

```bash
go generate ./...
```

**go doc** -- Documentation viewer. Go's doc comments are plain text above declarations, no special markup language.

```bash
go doc fmt.Println        # Show doc for a function
go doc net/http.Server    # Show doc for a type
go doc -all net/http      # Show all docs for a package
```

**go install** -- Compiles and installs a binary to `$GOPATH/bin` (or `$GOBIN`).

```bash
go install golang.org/x/tools/gopls@latest           # Install Go LSP server
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

**go work** -- Multi-module workspaces (since Go 1.18). Lets you develop across multiple modules simultaneously without publish-import cycles.

```bash
go work init ./api ./service ./shared
go work use ./new-module
go work sync
```

This creates a `go.work` file:

```
go 1.22

use (
    ./api
    ./service
    ./shared
)
```

### Cross-Compilation

Go cross-compiles with two environment variables. No cross-compiler toolchain to install.

```bash
# Linux AMD64
GOOS=linux GOARCH=amd64 go build -o myapp-linux .

# macOS ARM64 (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o myapp-darwin .

# Windows
GOOS=windows GOARCH=amd64 go build -o myapp.exe .

# Linux ARM (Raspberry Pi)
GOOS=linux GOARCH=arm GOARM=7 go build -o myapp-arm .

# WebAssembly
GOOS=js GOARCH=wasm go build -o main.wasm .
```

Supported GOOS values include: linux, darwin, windows, freebsd, openbsd, netbsd, plan9, js, wasip1, android, ios. Over 20 GOARCH targets including amd64, arm64, arm, 386, mips, ppc64, riscv64, s390x.

---

## 2. Modules

Go modules (introduced Go 1.11, default since Go 1.16) replaced GOPATH-based dependency management. A module is a collection of packages versioned together.

### go.mod

```
module github.com/tibsfox/weather-station

go 1.22

require (
    github.com/gorilla/mux v1.8.1
    github.com/jackc/pgx/v5 v5.5.5
    github.com/prometheus/client_golang v1.19.0
    go.uber.org/zap v1.27.0
    google.golang.org/grpc v1.63.2
)

require (
    // indirect dependencies auto-managed by go mod tidy
    github.com/beorn7/perkins v1.0.1 // indirect
    golang.org/x/net v0.24.0 // indirect
    golang.org/x/sys v0.19.0 // indirect
)
```

### go.sum

The `go.sum` file contains cryptographic checksums (SHA-256) for every module version used, including transitive dependencies. This file is committed to version control and ensures reproducible builds.

```
github.com/gorilla/mux v1.8.1 h1:TuMoUvkRETax...
github.com/gorilla/mux v1.8.1/go.mod h1:AKf9I4...
```

### Module Proxy and Sum Database

- **proxy.golang.org** -- Google-operated module proxy. Caches module versions permanently. Default GOPROXY value is `https://proxy.golang.org,direct`.
- **sum.golang.org** -- Transparency log for module checksums. Prevents tampering. Append-only Merkle tree (inspired by Certificate Transparency).
- **GONOSUMCHECK** -- Bypass sum checking for private modules.
- **GONOSUMDB** -- Bypass the sum database for specific patterns.
- **GOPRIVATE** -- Shorthand that sets both GONOSUMCHECK and GONOSUMDB.

```bash
# Private modules bypass proxy and sum DB
export GOPRIVATE="github.com/mycompany/*,gitlab.internal.com/*"
```

### Semantic Import Versioning

Go's most controversial module decision: major versions v2+ require the major version in the import path.

```go
import "github.com/user/lib"       // v0.x or v1.x
import "github.com/user/lib/v2"    // v2.x
import "github.com/user/lib/v3"    // v3.x
```

This means v1 and v2 of a library can coexist in the same binary -- different import paths, different types, no diamond dependency conflicts.

### Replace Directives

```
// Use a local fork during development
replace github.com/user/lib => ../my-local-lib

// Pin a specific version due to a bug
replace github.com/broken/pkg v1.2.3 => github.com/broken/pkg v1.2.2

// Use a fork permanently
replace github.com/original/pkg => github.com/myfork/pkg v1.0.0
```

### GOPATH Legacy

Before modules, all Go code lived under `$GOPATH/src/`. Dependencies were fetched via `go get` with no versioning -- you got whatever was on the default branch. Reproducible builds required vendoring tools like `dep`, `glide`, or `godep`. This era is over. Module-aware mode is the only supported mode since Go 1.21.

---

## 3. Standard Library

Go's standard library is production-grade. Many Go services run in production with zero third-party dependencies. This is a feature, not a limitation.

### net/http -- Production HTTP Server

```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "time"
)

type HealthResponse struct {
    Status    string `json:"status"`
    Timestamp string `json:"timestamp"`
}

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(HealthResponse{
            Status:    "ok",
            Timestamp: time.Now().UTC().Format(time.RFC3339),
        })
    })

    mux.HandleFunc("POST /api/data", handleData)

    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  120 * time.Second,
    }

    log.Printf("Server starting on %s", server.Addr)
    log.Fatal(server.ListenAndServe())
}

func handleData(w http.ResponseWriter, r *http.Request) {
    // Implementation
}
```

Since Go 1.22, `http.ServeMux` supports method-based routing and path parameters:

```go
mux.HandleFunc("GET /users/{id}", getUser)
mux.HandleFunc("DELETE /users/{id}", deleteUser)
mux.HandleFunc("GET /files/{path...}", serveFile)  // wildcard
```

### encoding/json

```go
type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email,omitempty"`
    CreatedAt time.Time `json:"created_at"`
    Password  string    `json:"-"`  // never marshaled
}

// Marshal
data, err := json.Marshal(user)

// Unmarshal
var user User
err := json.Unmarshal(data, &user)

// Streaming encoder/decoder (more efficient for HTTP)
json.NewEncoder(w).Encode(user)
json.NewDecoder(r.Body).Decode(&user)
```

### context -- Cancellation and Deadlines

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

result, err := db.QueryContext(ctx, "SELECT * FROM users WHERE id = $1", id)
```

### sync -- Concurrency Primitives

```go
var mu sync.Mutex          // Mutual exclusion
var rw sync.RWMutex        // Read-write lock
var once sync.Once         // Execute exactly once
var wg sync.WaitGroup      // Wait for goroutines
var m sync.Map             // Concurrent map (specialized use cases)
var pool sync.Pool         // Object pooling
```

### log/slog -- Structured Logging (since Go 1.21)

```go
import "log/slog"

logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))

logger.Info("request handled",
    slog.String("method", r.Method),
    slog.String("path", r.URL.Path),
    slog.Int("status", 200),
    slog.Duration("latency", elapsed),
)
// Output: {"time":"2025-01-15T10:30:00Z","level":"INFO","msg":"request handled","method":"GET","path":"/api/users","status":200,"latency":"1.234ms"}
```

### embed -- Embed Files in Binary (since Go 1.16)

```go
import "embed"

//go:embed templates/*
var templates embed.FS

//go:embed version.txt
var version string

//go:embed static/logo.png
var logo []byte
```

### Other Key Standard Library Packages

| Package | Purpose |
|---------|---------|
| `crypto/tls` | TLS 1.3 support, certificate management |
| `crypto/sha256` | Hashing |
| `database/sql` | Database interface (driver-based) |
| `html/template` | HTML templates with auto-escaping |
| `text/template` | General text templating |
| `os/exec` | Run external commands |
| `path/filepath` | OS-aware file path manipulation |
| `regexp` | RE2 regular expressions (guaranteed linear time) |
| `sort` | Sorting with `slices.Sort` (since 1.21) |
| `strings` | String manipulation |
| `bytes` | Byte slice manipulation |
| `bufio` | Buffered I/O |
| `io` | Reader/Writer interfaces |
| `maps` | Map operations (since 1.21) |
| `slices` | Slice operations (since 1.21) |
| `errors` | Error wrapping (`errors.Is`, `errors.As`, `fmt.Errorf("%w", err)`) |
| `testing/fstest` | In-memory filesystem for testing |
| `net/http/httptest` | HTTP test server and recorder |
| `net/url` | URL parsing |

---

## 4. Web Frameworks and Routers

### The stdlib-only approach

Many experienced Go developers use only `net/http`. Since Go 1.22 added method+pattern routing to `ServeMux`, the gap between stdlib and third-party routers has narrowed significantly.

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /api/v1/users/{id}", getUser)
mux.HandleFunc("POST /api/v1/users", createUser)

// Middleware is just function composition
handler := loggingMiddleware(authMiddleware(mux))

http.ListenAndServe(":8080", handler)
```

The argument for stdlib-only: no dependency risk, no API churn, no framework lock-in, full control. The `http.Handler` interface is one method: `ServeHTTP(ResponseWriter, *Request)`. Everything composes.

### Third-Party Frameworks

**Gin** -- Most popular Go web framework by GitHub stars. Fast, with a martini-like API.

```go
r := gin.Default()
r.GET("/users/:id", func(c *gin.Context) {
    id := c.Param("id")
    c.JSON(200, gin.H{"id": id})
})
r.Run(":8080")
```

**Echo** -- High-performance, minimalist. Good middleware ecosystem.

```go
e := echo.New()
e.GET("/users/:id", func(c echo.Context) error {
    return c.JSON(200, map[string]string{"id": c.Param("id")})
})
e.Start(":8080")
```

**Chi** -- Lightweight, idiomatic, composable. Uses `net/http` directly. Very popular for its compatibility with the standard library.

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
r.Get("/users/{id}", getUser)
http.ListenAndServe(":8080", r)
```

**Fiber** -- Built on fasthttp (not `net/http`). Express.js-like API. Fast but incompatible with the `net/http` ecosystem.

**Gorilla Mux** -- Archived in December 2022 (maintainer burnout), then unarchived by community. Still widely used in existing codebases but not recommended for new projects.

---

## 5. Popular Libraries

### CLI: Cobra + Viper

Cobra powers kubectl, docker, hugo, gh, and most major Go CLIs.

```go
var rootCmd = &cobra.Command{
    Use:   "myapp",
    Short: "My application",
}

var serveCmd = &cobra.Command{
    Use:   "serve",
    Short: "Start the server",
    RunE: func(cmd *cobra.Command, args []string) error {
        port, _ := cmd.Flags().GetInt("port")
        return startServer(port)
    },
}

func init() {
    serveCmd.Flags().IntP("port", "p", 8080, "server port")
    rootCmd.AddCommand(serveCmd)
}
```

Viper handles configuration from files, env vars, flags, and remote config (etcd, Consul):

```go
viper.SetConfigName("config")
viper.SetConfigType("yaml")
viper.AddConfigPath(".")
viper.AutomaticEnv()
viper.ReadInConfig()

port := viper.GetInt("server.port")
```

### Logging: zap, zerolog, slog

```go
// zap (Uber) -- structured, very fast, zero-allocation
logger, _ := zap.NewProduction()
logger.Info("request", zap.String("method", "GET"), zap.Int("status", 200))

// zerolog -- zero-allocation JSON logger
log := zerolog.New(os.Stdout).With().Timestamp().Logger()
log.Info().Str("method", "GET").Int("status", 200).Msg("request")
```

Since Go 1.21 added `log/slog` to the standard library, many teams are migrating to it. Third-party backends can plug in via the `slog.Handler` interface.

### Testing: testify

```go
import "github.com/stretchr/testify/assert"

func TestAdd(t *testing.T) {
    assert.Equal(t, 4, Add(2, 2))
    assert.NotNil(t, result)
    assert.NoError(t, err)
    assert.Contains(t, output, "success")
}
```

testify also provides `require` (fails immediately) and `suite` (test suites with setup/teardown).

### Database: GORM, Ent, sqlc, pgx

- **GORM** -- Full ORM. Auto-migration, associations, hooks, transactions.
- **Ent** -- Facebook's entity framework. Schema-as-code, code generation, graph traversal.
- **sqlc** -- Generates type-safe Go from SQL queries. You write SQL, it writes Go.
- **pgx** -- Pure Go PostgreSQL driver. High performance, PostgreSQL-specific features.

### Dependency Injection: Wire, Fx

- **Wire** (Google) -- Compile-time DI via code generation. No reflection.
- **Fx** (Uber) -- Runtime DI framework. Uses reflection. Popular for large service codebases.

### OpenTelemetry

```go
import "go.opentelemetry.io/otel"

tracer := otel.Tracer("my-service")
ctx, span := tracer.Start(ctx, "handleRequest")
defer span.End()

span.SetAttributes(attribute.String("user.id", userID))
```

---

## 6. Cloud-Native Infrastructure in Go

Go is the lingua franca of cloud-native infrastructure. This is not an accident -- it is the result of Go's compilation speed, static binaries, goroutine concurrency model, and deployment simplicity converging at exactly the right time (2013-2015).

### The Foundational Projects

| Project | Origin | Year | What It Does |
|---------|--------|------|-------------|
| **Docker** | Solomon Hykes / dotCloud | 2013 | Container runtime that started the container revolution |
| **Kubernetes** | Google (Borg heritage) | 2014 | Container orchestration, now the industry standard |
| **etcd** | CoreOS | 2013 | Distributed key-value store (Raft consensus), K8s backing store |
| **Terraform** | HashiCorp | 2014 | Infrastructure as Code, multi-cloud provisioning |
| **Consul** | HashiCorp | 2014 | Service discovery and mesh networking |
| **Vault** | HashiCorp | 2015 | Secrets management |
| **Nomad** | HashiCorp | 2015 | Workload orchestrator (simpler K8s alternative) |
| **Prometheus** | SoundCloud | 2012 | Metrics collection and alerting, CNCF graduated |
| **Grafana** | Torkel Odegaard | 2014 | Observability dashboards (backend in Go) |
| **CockroachDB** | Cockroach Labs | 2015 | Distributed SQL database (Spanner-inspired) |
| **TiDB** | PingCAP | 2015 | MySQL-compatible distributed database |
| **InfluxDB** | InfluxData | 2013 | Time-series database |
| **Caddy** | Matt Holt | 2015 | HTTPS-by-default web server, automatic certs |
| **Traefik** | Containous | 2015 | Cloud-native reverse proxy and load balancer |
| **Hugo** | Steve Francia | 2013 | Static site generator (fastest in the world) |
| **Gitea** | Community fork of Gogs | 2016 | Self-hosted Git service |
| **MinIO** | MinIO Inc. | 2014 | S3-compatible object storage |
| **CoreDNS** | Miek Gieben | 2016 | DNS server, pluggable, K8s default DNS |
| **containerd** | Docker (donated to CNCF) | 2015 | Container runtime (used by Docker and K8s) |
| **runc** | Open Container Initiative | 2015 | Low-level OCI container runtime |
| **Helm** | Deis (now Microsoft) | 2015 | Kubernetes package manager |
| **Istio** | Google/Lyft/IBM | 2017 | Service mesh (control plane in Go, data plane in Envoy/C++) |
| **Cilium** | Isovalent | 2017 | eBPF-based networking and security for K8s |
| **Linkerd** | Buoyant | 2016 | Service mesh (rewritten from JVM to Go+Rust) |

### Why Go Won Cloud-Native

1. **Static binaries** -- Deploy a single file. No runtime, no interpreter, no dependency hell. Put it in a 5MB scratch container.
2. **Fast compilation** -- Kubernetes (2M+ lines of Go) compiles in under 2 minutes. Try that with C++ or Rust.
3. **Goroutines** -- Thousands of concurrent connections per service with minimal memory. A goroutine starts at ~2KB stack (vs ~1MB per thread in Java/C).
4. **Cross-compilation** -- Build Linux binaries on macOS or Windows with zero setup. Critical for CI/CD pipelines.
5. **Simplicity** -- Infrastructure code must be maintained by large, rotating teams. Go's simplicity (25 keywords, one way to do things) means anyone can read and contribute.
6. **GC that works** -- Sub-millisecond GC pauses since Go 1.8. Good enough for infrastructure. Not competing with Rust for kernel-level code.
7. **Timing** -- Docker arrived in 2013, the same year Go started maturing (1.1-1.2 era). The container revolution and Go's growth fed each other.

---

## 7. CLI Tools Written in Go

Go's static binary compilation and fast startup make it the dominant language for developer CLI tools.

| Tool | Purpose |
|------|---------|
| `kubectl` | Kubernetes CLI |
| `docker` | Container management |
| `terraform` | Infrastructure as Code |
| `hugo` | Static site generation |
| `gh` | GitHub CLI |
| `golangci-lint` | Go linter aggregator |
| `air` | Hot-reload for Go development |
| `ko` | Build Go container images without Docker |
| `goreleaser` | Release automation (cross-compile + publish) |
| `dlv` (Delve) | Go debugger |
| `gopls` | Go language server (LSP) |
| `buf` | Protocol Buffers tooling |
| `k9s` | Terminal UI for Kubernetes |
| `lazygit` | Terminal UI for Git |
| `fzf` | Fuzzy finder |
| `esbuild` | JavaScript/CSS bundler (fastest) |
| `act` | Run GitHub Actions locally |
| `mkcert` | Local HTTPS certificates |
| `dive` | Docker image layer explorer |
| `task` | Task runner (Makefile alternative) |
| `just` | Command runner |

### GoReleaser Example

```yaml
# .goreleaser.yaml
project_name: myapp
builds:
  - env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
      - windows
    goarch:
      - amd64
      - arm64
    ldflags:
      - -s -w -X main.version={{.Version}}
archives:
  - format: tar.gz
    format_overrides:
      - goos: windows
        format: zip
nfpms:
  - homepage: https://github.com/user/myapp
    maintainer: User <user@example.com>
    formats:
      - deb
      - rpm
```

---

## 8. Testing

Go's testing is built into the language and toolchain. The `testing` package and `go test` command handle unit tests, benchmarks, fuzz tests, and examples with zero external dependencies.

### Table-Driven Tests

The idiomatic Go testing pattern. Define cases as data, loop through them.

```go
package math

import "testing"

func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"negative numbers", -1, -2, -3},
        {"zero", 0, 0, 0},
        {"mixed signs", -5, 3, -2},
        {"large numbers", 1000000, 2000000, 3000000},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Add(tt.a, tt.b)
            if got != tt.expected {
                t.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.expected)
            }
        })
    }
}
```

### Subtests with t.Run

Subtests enable selective test execution and parallel testing:

```go
func TestAPI(t *testing.T) {
    t.Run("CreateUser", func(t *testing.T) {
        t.Parallel()  // Run in parallel with other subtests
        // ...
    })
    t.Run("DeleteUser", func(t *testing.T) {
        t.Parallel()
        // ...
    })
}
```

```bash
go test -run TestAPI/CreateUser ./...   # Run only the CreateUser subtest
```

### Benchmarks

```go
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(2, 3)
    }
}

func BenchmarkJSON(b *testing.B) {
    data := loadTestData()
    b.ResetTimer()  // Exclude setup from measurement
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        json.Marshal(data)
    }
}
```

```bash
go test -bench=BenchmarkJSON -benchmem ./...
# BenchmarkJSON-8    500000    2341 ns/op    1024 B/op    12 allocs/op
```

### Fuzz Testing (since Go 1.18)

Go has built-in fuzz testing. The fuzzer generates random inputs to find edge cases.

```go
func FuzzParseURL(f *testing.F) {
    // Seed corpus
    f.Add("https://example.com")
    f.Add("http://localhost:8080/path?q=1")
    f.Add("")

    f.Fuzz(func(t *testing.T, input string) {
        parsed, err := url.Parse(input)
        if err != nil {
            return  // Invalid input is OK
        }
        // Round-trip: parse then stringify should not lose info
        reparsed, err := url.Parse(parsed.String())
        if err != nil {
            t.Fatalf("failed to re-parse %q: %v", parsed.String(), err)
        }
        if parsed.Host != reparsed.Host {
            t.Errorf("host mismatch: %q vs %q", parsed.Host, reparsed.Host)
        }
    })
}
```

```bash
go test -fuzz=FuzzParseURL -fuzztime=30s ./...
```

### httptest

```go
func TestHealthEndpoint(t *testing.T) {
    handler := http.HandlerFunc(healthHandler)
    req := httptest.NewRequest("GET", "/health", nil)
    w := httptest.NewRecorder()

    handler.ServeHTTP(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("expected 200, got %d", w.Code)
    }

    var resp HealthResponse
    json.NewDecoder(w.Body).Decode(&resp)
    if resp.Status != "ok" {
        t.Errorf("expected status ok, got %s", resp.Status)
    }
}

// Test with a real server
func TestIntegration(t *testing.T) {
    srv := httptest.NewServer(setupRouter())
    defer srv.Close()

    resp, err := http.Get(srv.URL + "/health")
    if err != nil {
        t.Fatal(err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != 200 {
        t.Errorf("expected 200, got %d", resp.StatusCode)
    }
}
```

### Test Fixtures and testdata

Files in a directory named `testdata` are ignored by the Go toolchain but accessible via tests:

```go
func TestParse(t *testing.T) {
    data, err := os.ReadFile("testdata/input.json")
    if err != nil {
        t.Fatal(err)
    }
    // ... use data
}
```

### testing/fstest

```go
func TestReadConfig(t *testing.T) {
    fs := fstest.MapFS{
        "config.yaml": &fstest.MapFile{
            Data: []byte("port: 8080\nhost: localhost"),
        },
    }
    cfg, err := ReadConfig(fs, "config.yaml")
    if err != nil {
        t.Fatal(err)
    }
    if cfg.Port != 8080 {
        t.Errorf("expected port 8080, got %d", cfg.Port)
    }
}
```

---

## 9. Linting and Static Analysis

### go vet (Built-in)

Always run. Catches real bugs that compile fine:

```bash
go vet ./...
```

Detects: printf format mismatches, unreachable code, incorrect struct tags, suspicious shifts, self-assignment, copying mutexes, and more.

### golangci-lint

The standard Go linter aggregator. Runs 100+ linters in parallel with caching. Replaces running individual linters.

```yaml
# .golangci.yml
run:
  timeout: 5m

linters:
  enable:
    - errcheck       # Check error return values
    - govet          # Vet checks
    - staticcheck    # Comprehensive static analyzer
    - unused         # Find unused code
    - gosimple       # Simplifications
    - ineffassign    # Detect ineffective assignments
    - typecheck      # Type checking
    - revive         # Fast, configurable linter (golint successor)
    - gocritic       # Opinionated style checks
    - gosec          # Security checks
    - prealloc       # Suggest preallocations
    - misspell       # Spelling mistakes in comments/strings
    - bodyclose      # HTTP body close checks
    - noctx          # HTTP requests without context

linters-settings:
  govet:
    enable-all: true
  revive:
    rules:
      - name: exported
        severity: warning

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - errcheck
        - gosec
```

```bash
golangci-lint run ./...
golangci-lint run --fix ./...   # Auto-fix where possible
```

### staticcheck

Dominik Honnef's staticcheck is the most respected Go static analysis tool. Finds bugs, performance issues, and simplifications that other tools miss.

```bash
staticcheck ./...
```

### gofmt and goimports

```bash
gofmt -s -w .           # Format + simplify
goimports -w .           # Format + manage imports (adds missing, removes unused)
```

`goimports` is the de facto standard. Most editors run it on save.

---

## 10. Profiling and Observability

Go's built-in profiling tools are among the best in any language. No external agent, no JVM flags, no special build.

### pprof

```go
import _ "net/http/pprof"  // Side-effect import: registers handlers

func main() {
    go func() {
        log.Println(http.ListenAndServe(":6060", nil))
    }()
    // ... rest of application
}
```

Now you can profile a running production service:

```bash
# CPU profile (30 seconds)
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Heap (memory) profile
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine profile (find goroutine leaks)
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Block profile (find contention)
go tool pprof http://localhost:6060/debug/pprof/block

# Mutex profile (find lock contention)
go tool pprof http://localhost:6060/debug/pprof/mutex

# Interactive mode commands
(pprof) top 20         # Top 20 functions by CPU/memory
(pprof) web            # Open flame graph in browser
(pprof) list funcName  # Show annotated source code
(pprof) peek funcName  # Show callers and callees
```

### Programmatic Profiling

```go
import "runtime/pprof"

f, _ := os.Create("cpu.prof")
pprof.StartCPUProfile(f)
defer pprof.StopCPUProfile()

// ... code to profile

// Memory profile
f2, _ := os.Create("mem.prof")
pprof.WriteHeapProfile(f2)
f2.Close()
```

### Execution Tracer

The execution tracer captures goroutine scheduling, network/syscall blocking, GC events, and more. Opens in a browser-based viewer.

```bash
go test -trace=trace.out ./...
go tool trace trace.out
```

```go
import "runtime/trace"

f, _ := os.Create("trace.out")
trace.Start(f)
defer trace.Stop()
```

### Runtime Metrics

```go
import "runtime"

var m runtime.MemStats
runtime.ReadMemStats(&m)

fmt.Printf("Alloc: %d MB\n", m.Alloc/1024/1024)
fmt.Printf("TotalAlloc: %d MB\n", m.TotalAlloc/1024/1024)
fmt.Printf("Sys: %d MB\n", m.Sys/1024/1024)
fmt.Printf("NumGC: %d\n", m.NumGC)
fmt.Printf("Goroutines: %d\n", runtime.NumGoroutine())
```

---

## 11. Database Access

### database/sql (Standard Library)

The stdlib provides a driver-based interface. You import a driver; the `database/sql` package provides connection pooling, transactions, and prepared statements.

```go
import (
    "database/sql"
    _ "github.com/lib/pq"  // PostgreSQL driver (side-effect import)
)

db, err := sql.Open("postgres", "postgres://user:pass@localhost/dbname?sslmode=disable")
if err != nil {
    log.Fatal(err)
}
defer db.Close()

// Connection pool settings
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)

// Query
rows, err := db.QueryContext(ctx, "SELECT id, name FROM users WHERE active = $1", true)
if err != nil {
    return err
}
defer rows.Close()

for rows.Next() {
    var id int
    var name string
    if err := rows.Scan(&id, &name); err != nil {
        return err
    }
    // use id, name
}

// Single row
var count int
err = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM users").Scan(&count)

// Execute (INSERT/UPDATE/DELETE)
result, err := db.ExecContext(ctx, "INSERT INTO users (name) VALUES ($1)", "Alice")
id, _ := result.LastInsertId()
affected, _ := result.RowsAffected()

// Transactions
tx, err := db.BeginTx(ctx, nil)
if err != nil {
    return err
}
defer tx.Rollback()  // No-op if committed

_, err = tx.ExecContext(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID)
if err != nil {
    return err
}
_, err = tx.ExecContext(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID)
if err != nil {
    return err
}

return tx.Commit()
```

### pgx -- Native PostgreSQL

pgx is a pure-Go PostgreSQL driver that bypasses `database/sql` for better performance and PostgreSQL-specific features (COPY, LISTEN/NOTIFY, pgvector, custom types).

```go
import "github.com/jackc/pgx/v5/pgxpool"

pool, err := pgxpool.New(ctx, "postgres://user:pass@localhost/db")
defer pool.Close()

rows, err := pool.Query(ctx, "SELECT id, name FROM users")
for rows.Next() {
    // ...
}
```

### sqlc -- Generate Go from SQL

Write SQL, get type-safe Go code.

```sql
-- query.sql
-- name: GetUser :one
SELECT id, name, email FROM users WHERE id = $1;

-- name: ListUsers :many
SELECT id, name, email FROM users ORDER BY name;

-- name: CreateUser :one
INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *;
```

```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "query.sql"
    schema: "schema.sql"
    gen:
      go:
        package: "db"
        out: "internal/db"
```

Running `sqlc generate` produces type-safe Go functions:

```go
// Generated by sqlc
func (q *Queries) GetUser(ctx context.Context, id int64) (User, error)
func (q *Queries) ListUsers(ctx context.Context) ([]User, error)
func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (User, error)
```

### Migrations

- **golang-migrate** -- SQL or Go-based migrations. Supports 20+ databases.
- **goose** -- Simple migration tool. SQL or Go migration files.

```bash
migrate create -ext sql -dir migrations -seq add_users_table
migrate -database "postgres://localhost/db" -path migrations up
```

---

## 12. gRPC

Go has first-class gRPC support. Many internal Google services use gRPC with Go.

### Protocol Buffer Definition

```protobuf
// weather.proto
syntax = "proto3";

package weather;
option go_package = "github.com/tibsfox/weather/pb";

service WeatherService {
    rpc GetCurrentWeather(WeatherRequest) returns (WeatherResponse);
    rpc StreamWeather(WeatherRequest) returns (stream WeatherUpdate);  // Server streaming
}

message WeatherRequest {
    string station_id = 1;
    double latitude = 2;
    double longitude = 3;
}

message WeatherResponse {
    string station_id = 1;
    double temperature_f = 2;
    double humidity = 3;
    string conditions = 4;
    int64 timestamp = 5;
}

message WeatherUpdate {
    WeatherResponse current = 1;
    string alert = 2;
}
```

### Code Generation

```bash
# Install tools
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate Go code
protoc --go_out=. --go-grpc_out=. weather.proto
```

### gRPC Server

```go
type weatherServer struct {
    pb.UnimplementedWeatherServiceServer
}

func (s *weatherServer) GetCurrentWeather(ctx context.Context, req *pb.WeatherRequest) (*pb.WeatherResponse, error) {
    // Fetch from sensors, NWS API, etc.
    return &pb.WeatherResponse{
        StationId:    req.StationId,
        TemperatureF: 52.3,
        Humidity:     78.0,
        Conditions:   "Overcast",
        Timestamp:    time.Now().Unix(),
    }, nil
}

func (s *weatherServer) StreamWeather(req *pb.WeatherRequest, stream pb.WeatherService_StreamWeatherServer) error {
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()
    for {
        select {
        case <-stream.Context().Done():
            return nil
        case <-ticker.C:
            update := &pb.WeatherUpdate{
                Current: &pb.WeatherResponse{ /* ... */ },
            }
            if err := stream.Send(update); err != nil {
                return err
            }
        }
    }
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")
    s := grpc.NewServer()
    pb.RegisterWeatherServiceServer(s, &weatherServer{})
    log.Fatal(s.Serve(lis))
}
```

### gRPC Client

```go
conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
if err != nil {
    log.Fatal(err)
}
defer conn.Close()

client := pb.NewWeatherServiceClient(conn)
resp, err := client.GetCurrentWeather(ctx, &pb.WeatherRequest{StationId: "KPAE"})
```

### gRPC-Gateway

gRPC-Gateway generates a reverse-proxy that translates RESTful JSON API to gRPC. This lets you serve both gRPC and REST from the same service definition.

---

## 13. Containerization

Go and containers are a natural pairing. Static binaries mean minimal container images.

### Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w -X main.version=1.2.3" \
    -o /app/server ./cmd/server

# Stage 2: Runtime
FROM scratch

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy binary
COPY --from=builder /app/server /server

# Non-root user (numeric because scratch has no /etc/passwd)
USER 65534:65534

EXPOSE 8080

ENTRYPOINT ["/server"]
```

The resulting image is typically 5-20 MB. Compare to a Java service at 200-500 MB or a Python service at 100-300 MB.

### Distroless Alternative

```dockerfile
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

Google's distroless images include CA certs and timezone data but no shell, no package manager, no utilities -- reduced attack surface.

### ko -- Build Without Docker

ko builds Go container images without a Dockerfile, without Docker daemon, and pushes directly to a registry.

```bash
# Build and push
KO_DOCKER_REPO=ghcr.io/user ko build ./cmd/server

# Build local (load into Docker daemon)
ko build --local ./cmd/server

# In Kubernetes manifests
ko apply -f k8s/deployment.yaml  # Replaces ko:// image references with built images
```

ko is particularly popular in the Kubernetes ecosystem (used by Knative, Tekton, and Sigstore).

### Static Linking

```bash
# Pure Go (no C dependencies)
CGO_ENABLED=0 go build -o myapp .

# With CGO (needs musl for static linking)
CGO_ENABLED=1 CC=musl-gcc go build -ldflags="-linkmode external -extldflags -static" -o myapp .
```

`CGO_ENABLED=0` disables cgo, producing a fully statically linked binary. This is the most common approach for containerized Go services.

---

## 14. Performance Characteristics

### Compilation Speed

Go was designed for fast compilation. The compiler processes dependencies exactly once and compiles packages in parallel.

| Project | Lines of Go | Compile Time |
|---------|-------------|-------------|
| Small service | 5K | <1 second |
| Medium project | 50K | 2-5 seconds |
| Large project (K8s-scale) | 2M+ | 1-2 minutes |

Compare to Rust (similar project sizes take 5-20x longer) or C++ (much longer, depending on headers and templates).

### Runtime Performance

Go is a compiled language with an optimizing compiler. Typical performance characteristics:

- **Compute-bound:** ~2-5x slower than C/Rust, ~50-100x faster than Python, ~5-10x faster than Node.js
- **I/O-bound:** Comparable to C/Rust due to goroutine scheduling efficiency
- **JSON processing:** ~3-5x slower than Rust/C++ (due to reflection), ~20x faster than Python
- **HTTP throughput:** Handles 50K-100K+ requests/second on a single machine with stdlib

### Memory

- **Goroutine stack:** Starts at ~2-8 KB, grows dynamically (vs ~1 MB for OS threads)
- **1 million goroutines:** ~2-8 GB RAM (vs 1 TB for 1 million threads)
- **Typical service memory:** 20-100 MB for a production microservice
- **GC pause:** Sub-millisecond (p99) since Go 1.8. The GC targets 25% CPU utilization by default (tunable via `GOGC`).

### Binary Size

| Configuration | Size |
|---------------|------|
| Hello world | ~1.8 MB |
| Typical service | 5-15 MB |
| Large application | 15-30 MB |
| With `-ldflags="-s -w"` | ~30% smaller |
| With UPX compression | ~70% smaller (but slower startup) |

### GOGC and Memory Tuning

```bash
GOGC=100        # Default: trigger GC when heap doubles
GOGC=200        # Less frequent GC, more memory usage
GOGC=50         # More frequent GC, less memory usage
GOMEMLIMIT=1GiB # Hard memory limit (since Go 1.19)
```

`GOMEMLIMIT` (Go 1.19+) is a soft memory limit that makes the GC work harder to stay under the target. This replaced the pattern of tuning `GOGC` alone and prevents OOM kills in containerized environments.

---

## 15. Real-World Adoption

### Companies Using Go in Production

| Company | Use Case |
|---------|----------|
| **Google** | Internal infrastructure, Kubernetes, gVisor, Vitess, many internal services |
| **Uber** | Microservices platform, Peloton (resource scheduler), many backend services |
| **Twitch** | Video processing pipeline, chat infrastructure |
| **Dropbox** | Migrated performance-critical backend from Python to Go |
| **Cloudflare** | Edge computing, DNS, DDoS mitigation, Cloudflare Workers runtime |
| **Netflix** | Some infrastructure services (primarily Java/Python shop) |
| **Stripe** | API infrastructure components |
| **Datadog** | Agent, trace collection, metrics processing |
| **Grafana Labs** | Grafana, Loki, Tempo, Mimir -- entire observability stack |
| **HashiCorp** | Terraform, Vault, Consul, Nomad, Packer, Vagrant (newer parts) |
| **DigitalOcean** | Platform infrastructure, internal tools |
| **Cockroach Labs** | CockroachDB (millions of lines of Go) |
| **PingCAP** | TiDB distributed database |
| **MinIO** | S3-compatible object storage |
| **Vercel** | Infrastructure and routing layer |
| **Canonical** | LXD, Juju, snapd |
| **1Password** | Backend services |
| **American Express** | Payment processing services |
| **Monzo** | Core banking platform (1,500+ microservices in Go) |
| **Mercado Libre** | Latin America's largest e-commerce platform |
| **Alibaba** | Internal infrastructure |
| **Baidu** | BFE (Baidu Front End), open-source load balancer |

### Survey Data and Rankings

- **Stack Overflow 2024 Developer Survey:** Go is the 10th most popular language and consistently in the top 5 for "most wanted" languages.
- **TIOBE Index:** Go has been in the top 10 since 2023, rising from 20th place in 2017.
- **Go Developer Survey 2024 (official):** 93% of Go developers are satisfied with the language. Top use cases: API/RPC services (73%), CLI tools (62%), libraries/frameworks (49%), data processing (39%).
- **Salary:** Go developers consistently rank among the highest-paid, alongside Rust and Scala developers.

### The Go Community

- **Gophers Slack:** 70,000+ members
- **GopherCon:** Annual conference (since 2014), largest Go conference
- **GopherCon EU, GopherCon UK, GopherCon India:** Regional conferences
- **golang/go GitHub:** 125,000+ stars, 9,000+ contributors
- **Go blog:** blog.golang.org -- design decisions, release notes, tutorials
- **Go playground:** play.golang.org -- share and run Go code in the browser
- **pkg.go.dev:** Official package documentation and discovery

---

## 16. Comparison to Alternatives

### Go vs Rust

| Dimension | Go | Rust |
|-----------|----|----|
| Memory safety | GC (runtime) | Ownership/borrowing (compile-time) |
| Compilation speed | Very fast (seconds) | Slow (minutes to hours for large projects) |
| Runtime performance | Good (2-5x slower than C) | Excellent (comparable to C) |
| Learning curve | Low (days to productive) | High (weeks to months) |
| Concurrency model | Goroutines + channels | async/await, threads, Rayon |
| Error handling | `if err != nil` (verbose but simple) | `Result<T, E>` + `?` operator |
| Generics | Since 1.18 (limited) | Full parametric polymorphism |
| Ecosystem size | Large (cloud-native) | Growing (systems, WebAssembly, embedded) |
| Binary size | 5-20 MB | 1-10 MB |
| GC pauses | Sub-ms (but they exist) | None |
| Best for | Services, CLI tools, infrastructure | Systems programming, embedded, safety-critical |

**When to choose Go:** You need fast iteration, team productivity, cloud services, and good-enough performance. DevOps, microservices, APIs.

**When to choose Rust:** You need zero-cost abstractions, no GC pauses, memory safety guarantees, embedded/systems work. Browsers, databases, OS components.

### Go vs Java

| Dimension | Go | Java |
|-----------|----|----|
| Startup time | Instant (compiled binary) | Seconds (JVM startup, class loading) |
| Memory footprint | ~20 MB for a service | ~100-300 MB (JVM overhead) |
| Deployment | Single binary | JAR + JVM + dependencies |
| Build speed | Seconds | Minutes (Gradle/Maven) |
| Concurrency | Goroutines (lightweight) | Virtual threads (since Java 21), Platform threads |
| Generics | Limited (since 1.18) | Full (since Java 5, reified since project Valhalla) |
| Ecosystem | Growing, cloud-native focused | Massive, enterprise-grade |
| IDE support | Good (GoLand, VS Code + gopls) | Excellent (IntelliJ, Eclipse) |
| Enterprise adoption | Growing | Dominant |
| Frameworks | Few, minimal | Spring, Jakarta EE, Micronaut, Quarkus |

**When to choose Go:** New cloud-native services, microservices that need to be light and fast, teams that value simplicity.

**When to choose Java:** Enterprise environments with existing Java investment, need for mature frameworks (Spring), heavy ORM usage, Android development.

### Go vs Python

| Dimension | Go | Python |
|-----------|----|----|
| Speed | Compiled, 50-100x faster | Interpreted (CPython) |
| Typing | Static, compile-time | Dynamic (type hints optional) |
| Concurrency | Goroutines (true parallelism) | GIL limits threading; asyncio for I/O |
| Deployment | Single binary | Python runtime + pip + virtualenv |
| Learning curve | Low | Very low |
| Data science | Minimal ecosystem | NumPy, pandas, scikit-learn, PyTorch |
| Web frameworks | net/http, Gin, Echo | Django, Flask, FastAPI |
| Scripting | Not suited for quick scripts | Excellent for scripting |
| Package management | go mod (built-in, deterministic) | pip + virtualenv (fragmented) |

**When to choose Go:** Production services, anything performance-sensitive, CLI tools, infrastructure.

**When to choose Python:** Data science, ML/AI, scripting, prototyping, automation, teaching programming.

### Go vs Node.js

| Dimension | Go | Node.js |
|-----------|----|----|
| Concurrency model | Goroutines (preemptive, multi-core) | Event loop (cooperative, single-threaded) |
| CPU-bound work | Efficient (compiles to native code) | Poor (blocks the event loop; use worker_threads) |
| Type safety | Static, compile-time | Dynamic (TypeScript adds compile-time checking) |
| Runtime | None (compiled binary) | V8 engine |
| Package ecosystem | Focused (fewer, more stable) | Massive (npm, but quality varies wildly) |
| Deployment | Single binary | node_modules + runtime |
| HTTP performance | ~50-100K req/s (stdlib) | ~15-30K req/s (Express), ~80K (Fastify) |
| Developer pool | Smaller but growing | Very large |
| Isomorphic code | N/A | Share code between frontend and backend |

**When to choose Go:** Backend services requiring high concurrency, CPU-bound work, microservices, infrastructure tools.

**When to choose Node.js:** Full-stack JavaScript teams, real-time applications (WebSocket-heavy), rapid prototyping, SSR with React/Next.js.

---

## Appendix: Quick-Start Code Examples

### Complete go.mod Example

```
module github.com/tibsfox/pnw-weather

go 1.22

require (
    github.com/jackc/pgx/v5 v5.5.5
    github.com/prometheus/client_golang v1.19.0
    go.uber.org/zap v1.27.0
    google.golang.org/grpc v1.63.2
    google.golang.org/protobuf v1.33.0
)

require (
    github.com/beorn7/perkins v1.0.1 // indirect
    github.com/cespare/xxhash/v2 v2.2.0 // indirect
    github.com/jackc/pgpassfile v1.0.0 // indirect
    github.com/jackc/pgservicefile v0.0.0-20231201171823-440d19dc326d // indirect
    github.com/jackc/puddle/v2 v2.2.1 // indirect
    golang.org/x/crypto v0.22.0 // indirect
    golang.org/x/net v0.24.0 // indirect
    golang.org/x/sync v0.7.0 // indirect
    golang.org/x/sys v0.19.0 // indirect
    golang.org/x/text v0.14.0 // indirect
    google.golang.org/genproto/googleapis/rpc v0.0.0-20240415180920-8c6c420018be // indirect
)
```

### Complete HTTP Server with Middleware

```go
package main

import (
    "encoding/json"
    "log/slog"
    "net/http"
    "os"
    "time"
)

type Station struct {
    ID          string  `json:"id"`
    Name        string  `json:"name"`
    Latitude    float64 `json:"latitude"`
    Longitude   float64 `json:"longitude"`
    TempF       float64 `json:"temperature_f"`
    Humidity    float64 `json:"humidity"`
    WindSpeedMPH float64 `json:"wind_speed_mph"`
    UpdatedAt   string  `json:"updated_at"`
}

var logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("GET /api/v1/stations", listStations)
    mux.HandleFunc("GET /api/v1/stations/{id}", getStation)
    mux.HandleFunc("GET /health", healthCheck)

    handler := loggingMiddleware(recoveryMiddleware(mux))

    server := &http.Server{
        Addr:         ":8080",
        Handler:      handler,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  120 * time.Second,
    }

    logger.Info("server starting", slog.String("addr", server.Addr))
    if err := server.ListenAndServe(); err != nil {
        logger.Error("server failed", slog.String("error", err.Error()))
        os.Exit(1)
    }
}

func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        logger.Info("request",
            slog.String("method", r.Method),
            slog.String("path", r.URL.Path),
            slog.Duration("latency", time.Since(start)),
        )
    })
}

func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                logger.Error("panic recovered", slog.Any("error", err))
                http.Error(w, "internal server error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

func listStations(w http.ResponseWriter, r *http.Request) {
    stations := []Station{
        {ID: "KPAE", Name: "Paine Field", Latitude: 47.9063, Longitude: -122.2816,
            TempF: 52.3, Humidity: 78, WindSpeedMPH: 8.5, UpdatedAt: time.Now().Format(time.RFC3339)},
        {ID: "KSEA", Name: "Sea-Tac", Latitude: 47.4502, Longitude: -122.3088,
            TempF: 54.1, Humidity: 72, WindSpeedMPH: 12.0, UpdatedAt: time.Now().Format(time.RFC3339)},
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(stations)
}

func getStation(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    station := Station{ID: id, Name: "Station " + id, TempF: 52.0, UpdatedAt: time.Now().Format(time.RFC3339)}
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(station)
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
```

### Complete Table-Driven Test

```go
package weather

import (
    "math"
    "testing"
)

// WindChill calculates the wind chill index (NWS formula)
// Valid for temperatures <= 50F and wind speeds > 3 mph
func WindChill(tempF, windMPH float64) (float64, error) {
    if tempF > 50 {
        return 0, fmt.Errorf("temperature must be <= 50F, got %.1f", tempF)
    }
    if windMPH <= 3 {
        return tempF, nil // No wind chill effect
    }
    wc := 35.74 + 0.6215*tempF - 35.75*math.Pow(windMPH, 0.16) + 0.4275*tempF*math.Pow(windMPH, 0.16)
    return math.Round(wc*10) / 10, nil
}

func TestWindChill(t *testing.T) {
    tests := []struct {
        name     string
        tempF    float64
        windMPH  float64
        expected float64
        wantErr  bool
    }{
        {
            name:     "calm wind returns temperature",
            tempF:    30.0,
            windMPH:  2.0,
            expected: 30.0,
        },
        {
            name:     "moderate cold with wind",
            tempF:    20.0,
            windMPH:  15.0,
            expected: 6.2,
        },
        {
            name:     "severe cold with high wind",
            tempF:    -10.0,
            windMPH:  30.0,
            expected: -33.0,
        },
        {
            name:     "freezing with light wind",
            tempF:    32.0,
            windMPH:  5.0,
            expected: 27.2,
        },
        {
            name:    "temperature too high",
            tempF:   55.0,
            windMPH: 10.0,
            wantErr: true,
        },
        {
            name:     "zero wind speed",
            tempF:    25.0,
            windMPH:  0.0,
            expected: 25.0,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := WindChill(tt.tempF, tt.windMPH)

            if tt.wantErr {
                if err == nil {
                    t.Error("expected error, got nil")
                }
                return
            }

            if err != nil {
                t.Fatalf("unexpected error: %v", err)
            }

            if math.Abs(got-tt.expected) > 0.15 {
                t.Errorf("WindChill(%.1f, %.1f) = %.1f, want %.1f",
                    tt.tempF, tt.windMPH, got, tt.expected)
            }
        })
    }
}
```

### JSON Encoding/Decoding Patterns

```go
package main

import (
    "encoding/json"
    "fmt"
    "time"
)

// Custom JSON marshaling
type Observation struct {
    StationID   string    `json:"station_id"`
    Temperature float64   `json:"temperature"`
    Timestamp   time.Time `json:"timestamp"`
    Tags        []string  `json:"tags,omitempty"`
    RawData     json.RawMessage `json:"raw_data,omitempty"`  // Delay parsing
}

// Custom Unmarshaler for flexible input
type FlexibleFloat float64

func (f *FlexibleFloat) UnmarshalJSON(data []byte) error {
    var v float64
    if err := json.Unmarshal(data, &v); err == nil {
        *f = FlexibleFloat(v)
        return nil
    }
    var s string
    if err := json.Unmarshal(data, &s); err == nil {
        _, err := fmt.Sscanf(s, "%f", &v)
        if err != nil {
            return fmt.Errorf("cannot parse %q as float", s)
        }
        *f = FlexibleFloat(v)
        return nil
    }
    return fmt.Errorf("cannot unmarshal %s into float", string(data))
}

func main() {
    // Marshal
    obs := Observation{
        StationID:   "KPAE",
        Temperature: 52.3,
        Timestamp:   time.Now(),
        Tags:        []string{"metar", "automated"},
    }

    data, _ := json.MarshalIndent(obs, "", "  ")
    fmt.Println(string(data))

    // Unmarshal with unknown structure
    raw := `{"name": "test", "value": 42, "nested": {"a": 1}}`
    var result map[string]any
    json.Unmarshal([]byte(raw), &result)
    fmt.Printf("name=%s value=%.0f\n", result["name"], result["value"])

    // Streaming decoder (efficient for large JSON arrays)
    // decoder := json.NewDecoder(reader)
    // for decoder.More() {
    //     var item Observation
    //     decoder.Decode(&item)
    // }
}
```

### Production Dockerfile

```dockerfile
# === Build Stage ===
FROM golang:1.22-alpine AS builder

# Build arguments
ARG VERSION=dev
ARG COMMIT=unknown

# Install git for VCS info in go build
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Dependencies first (layer caching)
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Source code
COPY . .

# Build with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -trimpath \
    -ldflags="-s -w \
        -X main.version=${VERSION} \
        -X main.commit=${COMMIT} \
        -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    -o /build/server ./cmd/server

# === Runtime Stage ===
FROM scratch

# TLS certificates
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Binary
COPY --from=builder /build/server /server

# Metadata
LABEL org.opencontainers.image.title="PNW Weather Service"
LABEL org.opencontainers.image.source="https://github.com/tibsfox/pnw-weather"

# Run as non-root
USER 65534:65534

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD ["/server", "healthcheck"]

ENTRYPOINT ["/server"]
```

### Project Structure Convention

```
myapp/
    cmd/
        server/         # main.go for the server binary
            main.go
        cli/            # main.go for a CLI binary
            main.go
    internal/           # Private packages (not importable by other modules)
        auth/
        database/
        handler/
        middleware/
        model/
    pkg/                # Public packages (importable by other modules)
        weather/
        geo/
    api/                # API definitions (OpenAPI specs, protobuf files)
        weather.proto
    web/                # Web assets, templates
        templates/
        static/
    migrations/         # Database migrations
    testdata/           # Test fixtures
    scripts/            # Build and deployment scripts
    go.mod
    go.sum
    Dockerfile
    Makefile
    README.md
```

The `internal/` directory is enforced by the Go compiler: packages under `internal/` cannot be imported by code outside the parent of `internal/`. This is a real access control mechanism, not a convention.

### Makefile for Go Projects

```makefile
.PHONY: build test lint run clean docker

VERSION ?= $(shell git describe --tags --always --dirty)
COMMIT  ?= $(shell git rev-parse --short HEAD)
LDFLAGS := -s -w -X main.version=$(VERSION) -X main.commit=$(COMMIT)

build:
	CGO_ENABLED=0 go build -trimpath -ldflags="$(LDFLAGS)" -o bin/server ./cmd/server

test:
	go test -race -coverprofile=coverage.out ./...

bench:
	go test -bench=. -benchmem ./...

lint:
	golangci-lint run ./...

fmt:
	goimports -w .

vet:
	go vet ./...

run:
	go run ./cmd/server

clean:
	rm -rf bin/ coverage.out

docker:
	docker build --build-arg VERSION=$(VERSION) --build-arg COMMIT=$(COMMIT) -t myapp:$(VERSION) .

generate:
	go generate ./...

mod:
	go mod tidy
	go mod verify
```

---

*Research compiled for the PNW Research Series, Rosetta Cluster: AI & Computation. Go's ecosystem represents a deliberate philosophical choice: fewer features, less abstraction, more clarity. The language that powers the cloud was designed to be boring -- and that turned out to be its greatest strength.*

---

## Study Guide — Go Ecosystem

### Tool map

- **go** (the command): build, test, run, mod, generate, vet.
- **gopls** (LSP): editor integration.
- **delve** (dlv): debugger.
- **golangci-lint**: linting.
- **testify**: assertions + mocks.
- **cobra, viper**: CLIs and config.
- **gin, echo, chi, fiber**: HTTP routers.
- **sqlc, ent, gorm**: database layers.

---

## DIY & TRY

### DIY 1 — Build a CLI with cobra

`go install github.com/spf13/cobra-cli@latest`. Generate a
skeleton, add one subcommand. Fifteen minutes.

### DIY 2 — Write table-driven tests

```go
tests := []struct{ in, want string }{
    {"a", "A"}, {"abc", "ABC"},
}
for _, tc := range tests {
    if got := strings.ToUpper(tc.in); got != tc.want {
        t.Errorf("ToUpper(%q) = %q, want %q", tc.in, got, tc.want)
    }
}
```

This is the canonical Go testing style.

### TRY — Ship a real tool

Pick something small that you currently do in a shell
pipeline (log parser, file renamer, report generator).
Rewrite in Go. Cross-compile for three platforms with
`GOOS=linux GOARCH=amd64 go build`. Distribute the binary.

---

## Related College Departments (Go ecosystem)

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
