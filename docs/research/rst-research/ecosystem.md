# Rust Ecosystem — Cargo, Crates, Tooling, and Applications

## 1. Cargo — The Best Package Manager in Systems Programming

Cargo is Rust's build system and package manager rolled into one. It compiles code, downloads dependencies, builds libraries, runs tests, generates documentation, publishes crates, and manages workspaces. It shipped with Rust 1.0 in May 2015 and has been inseparable from the language ever since. In the 2025 Stack Overflow Developer Survey, Cargo was voted the most admired build/infrastructure tool at 71% — higher than any competitor in any language.

Every Rust project starts with `cargo new my_project` (binary) or `cargo new my_lib --lib` (library), generating `Cargo.toml`, `src/main.rs` (or `lib.rs`), and a git repo.

### Cargo.toml — The Manifest

`Cargo.toml` is the project manifest, written in TOML. It declares metadata, dependencies, features, build targets, and profile settings:

```toml
[package]
name = "artemis-telemetry"
version = "0.3.1"
edition = "2024"
authors = ["Foxy <foxy@tibsfox.com>"]
description = "Telemetry ingestion pipeline for Artemis missions"
license = "MIT OR Apache-2.0"
repository = "https://github.com/tibsfox/artemis-telemetry"
rust-version = "1.82"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
axum = "0.8"
tracing = "0.1"
tracing-subscriber = "0.3"
sqlx = { version = "0.8", features = ["runtime-tokio", "postgres"] }
anyhow = "1.0"
chrono = { version = "0.4", features = ["serde"] }

[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }
proptest = "1.4"
tokio-test = "0.4"

[build-dependencies]
tonic-build = "0.12"

[features]
default = ["postgres"]
postgres = ["sqlx/postgres"]
sqlite = ["sqlx/sqlite"]
full = ["postgres", "sqlite"]

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
strip = true

[[bench]]
name = "ingestion_benchmark"
harness = false
```

Key concepts: **editions** (`2015`, `2018`, `2021`, `2024`) allow language evolution without breaking old code — all editions interoperate. **Features** are additive conditional compilation flags resolved at compile time. **Profiles** control optimization: `lto = true` enables cross-crate link-time optimization, `codegen-units = 1` maximizes optimization, `strip = true` removes debug symbols.

### Cargo.lock — Reproducible Builds

`Cargo.lock` records exact dependency versions. Checked into version control for binaries (reproducible builds), excluded for libraries. `cargo update` refreshes to latest compatible versions.

### Core Commands

```bash
cargo build              # debug build (target/debug/)
cargo build --release    # optimized build (target/release/)
cargo run                # build and run
cargo run -- --port 8080 # pass args to the binary
cargo test               # run all tests (unit + integration + doc tests)
cargo test -- --nocapture  # show println! output during tests
cargo bench              # run benchmarks
cargo doc --open         # generate and open HTML documentation
cargo check              # type-check without producing a binary (fast)
cargo clippy             # run the linter
cargo fmt                # format all source files
cargo publish            # publish to crates.io
cargo install ripgrep    # install a binary crate globally
cargo tree               # display the dependency tree
cargo audit              # check for known vulnerabilities
```

`cargo check` runs the full type checker and borrow checker without code generation — much faster than a full build. Most Rust developers bind it to save in their editor.

### Workspaces

Cargo workspaces let multiple related crates share a single `Cargo.lock`, output directory, and CI configuration:

```toml
# Root Cargo.toml
[workspace]
members = ["core", "cli", "server", "shared"]
resolver = "2"

[workspace.package]
version = "0.3.1"
edition = "2024"

[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
```

Member crates inherit workspace metadata: `version.workspace = true`, `serde.workspace = true`.

### Build Scripts (build.rs)

A `build.rs` file at the crate root runs before compilation — generating code, compiling C dependencies, linking native libraries, and setting `cfg` flags:

```rust
// build.rs
fn main() {
    tonic_build::compile_protos("proto/telemetry.proto")
        .expect("Failed to compile protos");
    println!("cargo:rustc-link-lib=sqlite3");
}
```

---

## 2. crates.io — The Package Registry

crates.io is Rust's official package registry, operated by the Rust Foundation. As of late 2025, it hosts over 175,000 crates with cumulative downloads exceeding 75 billion. The broader Rust library index tracked by lib.rs catalogs over 250,000 crates including those not published to the central registry.

Every crate published to crates.io is immutable — once a version is uploaded, it cannot be modified or deleted. Crate owners can **yank** a version, which prevents it from being chosen as a new dependency but does not break existing `Cargo.lock` files that reference it. This policy prioritizes reproducibility: if your project built yesterday, it will build identically tomorrow.

Crates are organized by categories (networking, command-line-interface, database, embedded, etc.) and searchable by keywords. The registry supports semantic versioning and Cargo resolves dependencies using a SAT solver that respects version compatibility ranges.

Key statistics as of early 2026:

| Metric | Value |
|--------|-------|
| Total crates | ~175K+ |
| Total downloads | 75B+ |
| Most downloaded | `syn` (~500M), `quote`, `serde` |
| Daily new crates | ~150-200 |
| Lib.rs index | ~250K crates |

Publishing is straightforward:

```bash
cargo login <api-token>    # authenticate once
cargo publish              # publish the crate
cargo publish --dry-run    # verify without uploading
```

---

## 3. Essential Crates — The Standard Extended Library

Rust's standard library is deliberately small. The ecosystem compensates with a constellation of battle-tested crates that form a de facto extended standard library.

### serde — Serialization Framework (David Tolnay)

`serde` is the serialization/deserialization framework for Rust. Created and maintained by David Tolnay, it uses Rust's trait system and derive macros to generate efficient serialization code at compile time with zero runtime overhead:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Mission {
    name: String,
    crew_size: u32,
    launch_date: String,
    #[serde(default)]
    completed: bool,
    #[serde(rename = "dest")]
    destination: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    notes: Option<String>,
}

fn main() -> anyhow::Result<()> {
    let mission = Mission {
        name: "Artemis II".into(),
        crew_size: 4,
        launch_date: "2026-04-01".into(),
        completed: false,
        destination: "Lunar Orbit".into(),
        notes: Some("First crewed Artemis flight".into()),
    };

    // Serialize to JSON
    let json = serde_json::to_string_pretty(&mission)?;
    println!("{json}");

    // Deserialize from TOML
    let toml_str = r#"
        name = "Artemis III"
        crew_size = 4
        launch_date = "2027-09-01"
        dest = "Lunar Surface"
    "#;
    let m: Mission = toml::from_str(toml_str)?;
    println!("{m:?}");

    Ok(())
}
```

serde supports JSON, TOML, YAML, MessagePack, CBOR, bincode, RON, CSV, and dozens more formats via interchangeable backend crates. Tolnay also maintains `syn` (Rust source parsing), `quote` (code generation), and `anyhow` — collectively some of the most downloaded crates in the ecosystem.

### tokio — Async Runtime

Tokio is the dominant async runtime for Rust — multi-threaded work-stealing scheduler, async I/O, timers, channels, and synchronization primitives. It powers axum, reqwest, tonic, sqlx, and hundreds more crates. The `#[tokio::main]` macro transforms `async fn main()` into a runtime-managed entry point:

```rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
    loop {
        let (mut socket, _) = listener.accept().await?;
        tokio::spawn(async move {
            let mut buf = [0u8; 1024];
            if let Ok(n) = socket.read(&mut buf).await {
                let _ = socket.write_all(&buf[..n]).await;
            }
        });
    }
}
```

### Error Handling — anyhow and thiserror

Rust has two dominant error handling crates, both by David Tolnay:

- **`anyhow`** — For applications. Provides a boxed `anyhow::Error` type that wraps any error with context:

```rust
use anyhow::{Context, Result};

fn read_config(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read config from {path}"))?;
    let config: Config = toml::from_str(&content)
        .context("Invalid TOML in config file")?;
    Ok(config)
}
```

- **`thiserror`** — For libraries. Derives `std::error::Error` implementations with custom display messages:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum TelemetryError {
    #[error("sensor {sensor_id} timed out after {timeout_ms}ms")]
    SensorTimeout { sensor_id: u32, timeout_ms: u64 },
    #[error("invalid reading: {0}")]
    InvalidReading(f64),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}
```

### clap — CLI Argument Parsing

`clap` (Command Line Argument Parser) uses derive macros for declarative CLI definitions:

```rust
use clap::Parser;

/// Artemis mission telemetry processor
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Path to the telemetry data file
    #[arg(short, long)]
    input: String,

    /// Output format
    #[arg(short, long, default_value = "json")]
    format: String,

    /// Verbosity level (-v, -vv, -vvv)
    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,

    /// Filter by sensor ID
    #[arg(long)]
    sensor: Option<u32>,
}

fn main() {
    let args = Args::parse();
    println!("Processing {} with format {}", args.input, args.format);
}
```

```bash
$ artemis-telemetry --input data.bin --format csv -vvv --sensor 42
```

### Other Essential Crates

| Crate | Purpose | Key Detail |
|-------|---------|------------|
| `reqwest` | HTTP client | async/await, TLS, JSON, built on `hyper` |
| `tracing` | Structured logging | Spans, events, subscribers. The modern alternative to `log` |
| `rayon` | Data parallelism | Drop-in parallel iterators: `.par_iter()` replaces `.iter()` |
| `regex` | Regular expressions | By Andrew Gallant (BurntSushi). Guaranteed linear time |
| `rand` | Random number generation | Cryptographic and fast PRNGs, distributions |
| `chrono` / `time` | Date and time | `chrono` is feature-rich; `time` is a lighter alternative |
| `log` / `env_logger` | Logging facade | `log` provides macros; `env_logger` is a simple backend |
| `hyper` | HTTP implementation | Low-level, correct, fast. Foundation for `reqwest` and `axum` |
| `tower` | Middleware framework | Service trait, layers, rate limiting, timeout, retry |
| `tonic` | gRPC | Async gRPC built on `hyper` and `prost` (protobuf) |
| `diesel` | ORM / query builder | Compile-time query validation, migrations, connection pooling |
| `sqlx` | Async SQL | Compile-time checked queries against a real database |
| `sea-orm` | Async ORM | Built on `sqlx`, ActiveRecord-inspired |
| `rusqlite` | SQLite bindings | Synchronous, zero-copy, well-maintained |
| `redis` | Redis client | Async and sync APIs, connection pooling, pub/sub |
| `lapin` | AMQP client | RabbitMQ-compatible, async, connection recovery |

---

## 4. Web Frameworks

Rust's web framework ecosystem has matured into a competitive landscape. The dominant player is axum, backed by the Tokio team, but several alternatives serve different needs.

### axum — The Dominant Framework

axum is a web framework built on `hyper` and `tower` by the Tokio project. It uses Rust's type system for routing and extraction, with no macros for handlers:

```rust
use axum::{extract::{Path, State, Json}, http::StatusCode,
    routing::{get, post}, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
struct AppState { missions: Arc<RwLock<Vec<Mission>>> }

#[derive(Serialize, Deserialize, Clone)]
struct Mission { id: u32, name: String, status: String }

async fn get_mission(
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<Mission>, StatusCode> {
    state.missions.read().await
        .iter().find(|m| m.id == id).cloned()
        .map(Json).ok_or(StatusCode::NOT_FOUND)
}

async fn create_mission(
    State(state): State<AppState>,
    Json(mission): Json<Mission>,
) -> (StatusCode, Json<Mission>) {
    state.missions.write().await.push(mission.clone());
    (StatusCode::CREATED, Json(mission))
}

#[tokio::main]
async fn main() {
    let state = AppState { missions: Arc::new(RwLock::new(vec![])) };
    let app = Router::new()
        .route("/missions", get(|| async { "list" }).post(create_mission))
        .route("/missions/{id}", get(get_mission))
        .with_state(state);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

Handlers are plain async functions. Extractors (`State`, `Path`, `Query`, `Json`) implement `FromRequest`, and Rust's type system does the rest. Tower middleware (rate limiting, CORS, compression, tracing) composes naturally because axum is built directly on the Tower service abstraction.

### Framework Comparison

| Framework | Creator | Runtime | Style | Strengths |
|-----------|---------|---------|-------|-----------|
| **axum** | Tokio team | tokio | Functional extractors | Tower integration, type-safe routing, dominant ecosystem position |
| **actix-web** | Nikolay Kim | actix-rt (tokio) | Actor model | Raw performance (consistently top in TechEmpower benchmarks), mature |
| **warp** | Sean McArthur | tokio | Filter combinators | Composable filters, elegant API, same author as `hyper`/`reqwest` |
| **rocket** | Sergio Benitez | tokio | Attribute macros | Developer ergonomics, fairings (middleware), form handling |
| **poem** | — | tokio | OpenAPI-first | Built-in OpenAPI spec generation, middleware |
| **tide** | async-std team | async-std | Express.js-like | Simple API, alternative to tokio-based frameworks |

actix-web was the original performance champion and remains extremely fast. Its actor model provides natural concurrency primitives. warp pioneered the filter-based composition pattern but has seen slower development. Rocket emphasizes developer happiness with attribute macros like `#[get("/")]` and automatic form parsing. In 2025-2026, axum has emerged as the clear default choice for new Rust web projects, largely because it shares the Tokio team's maintenance resources and integrates seamlessly with the broader Tokio ecosystem.

---

## 5. CLI Tools Written in Rust

One of Rust's most visible impacts has been the wave of command-line tools that outperform their predecessors in speed, correctness, and user experience. The "rewrite it in Rust" movement is not ideological — these tools genuinely represent a generational improvement.

### The Essential Toolkit

| Tool | Replaces | Key Detail |
|------|----------|------------|
| **ripgrep (rg)** | grep, ag, ack | Andrew Gallant. SIMD-accelerated, respects `.gitignore`, Unicode-correct. Powers VS Code search. |
| **fd** | find | Smart case, colorized, `.gitignore`-aware. `fd pattern` replaces `find . -name '*pattern*'` |
| **bat** | cat | Syntax highlighting, Git integration, line numbers, paging via syntect |
| **eza** | ls (successor to exa) | Tree view, Git status, icons, extended attributes |
| **starship** | custom prompts | Cross-shell (bash/zsh/fish/PowerShell/nushell), TOML config, Git + language version display |
| **delta** | diff | Syntax-highlighting pager for `git diff/log/show`, side-by-side, word-level diffs |
| **tokei** | cloc | LOC/comment/blank counter, polyglot-aware, orders of magnitude faster |
| **hyperfine** | time | Statistical benchmarking: warmup, multiple runs, JSON/Markdown export |
| **dust** | du | Visual bar chart of disk usage, sorted by size |
| **bottom (btm)** | htop | TUI process/system monitor: CPU, memory, disk, network, temperatures |
| **zoxide** | cd | Frecency-based directory jumper. `z project` goes to your most-visited match |
| **nushell** | bash/zsh | Structured data shell — pipelines operate on typed tables, not text streams |
| **Alacritty** | terminal | GPU-accelerated (OpenGL), minimal, fastest terminal emulator available |
| **WezTerm** | terminal + tmux | GPU-accelerated with multiplexing, Lua scripting, image protocol, ligatures |

These tools collectively represent a generational improvement in command-line experience. The "rewrite it in Rust" movement succeeded because Rust's combination of performance, safety, and cross-platform compilation produces genuinely better tools — not just ideologically purer ones.

---

## 6. Infrastructure in Rust

Rust has moved from systems programming curiosity to the backbone of critical internet infrastructure. The following projects run in production at enormous scale.

### AWS — Firecracker and Bottlerocket

**Firecracker** is a virtual machine monitor (VMM) that creates and manages microVMs. Written in Rust, it boots a guest in under 125 milliseconds with less than 5 MiB of memory overhead. Every AWS Lambda invocation and every AWS Fargate container runs inside a Firecracker microVM. It handles millions of production workloads per second. Firecracker uses the Linux KVM hypervisor and strips away every device and feature a microVM does not need — no PCI, no USB, no GPU passthrough. Just a virtio network, a virtio block device, and a serial console. This minimalism is both a performance strategy and a security boundary.

**Bottlerocket** is AWS's container-optimized Linux distribution, also written in Rust. Its update mechanism, API server, and system agents are all Rust. It runs only containers — no shell, no package manager, no SSH by default. Immutable root filesystem, automated updates via a dual-partition scheme.

### Cloudflare — Pingora

Pingora is Cloudflare's Rust-based HTTP proxy framework that replaced nginx across their global edge network. It handles over 40 million HTTP requests per second — more than one trillion requests per day — while consuming 70% less CPU and 67% less memory than the nginx deployment it replaced. Cloudflare open-sourced Pingora under the Apache 2.0 license. The multi-threaded architecture (vs. nginx's multi-process model) allows connection pooling across all threads, reducing connection establishment overhead to upstream origins.

### JavaScript Tooling — SWC, Turbopack, Biome, Deno

**SWC** (Speedy Web Compiler) is a Rust-based TypeScript/JavaScript compiler used by Next.js, Deno, and Parcel. It compiles TypeScript 20-70x faster than the official `tsc` compiler. Donny (강동윤) created it as a single developer, and Vercel hired him to maintain it.

**Turbopack** is Vercel's Rust-based bundler, designed as the successor to Webpack. Built on SWC, it uses incremental computation (based on the `turbo-tasks` framework) to recompute only what changed. Vercel claims 700x faster updates than Webpack for large applications.

**Biome** (formerly Rome) is a unified linter and formatter for JavaScript, TypeScript, JSON, CSS, and GraphQL. Written in Rust, it processes files in parallel and produces diagnostics in a single pass. It positions itself as a replacement for ESLint + Prettier.

**Deno** is a JavaScript/TypeScript runtime created by Ryan Dahl (Node.js creator) as a corrective to Node's design mistakes. Its core runtime, HTTP server, and permission system are written in Rust. It uses V8 for JavaScript execution but handles everything else — module loading, TypeScript compilation, permissions — in Rust.

### Database and Search

**TiKV** — A distributed transactional key-value store built by PingCAP. It is the storage layer for TiDB, a NewSQL database compatible with MySQL. Written in Rust for performance and correctness, it implements the Raft consensus protocol and supports ACID transactions across multiple nodes. Donated to the CNCF.

**Meilisearch** — An open-source search engine designed for instant, typo-tolerant search. Written in Rust using the tantivy search library. Deployed as a single binary with no external dependencies.

**tantivy** — A full-text search library inspired by Apache Lucene, implemented in Rust. Powers Meilisearch, Quickwit, and other search projects.

### Observability

**Vector** (Datadog) — A high-performance observability data pipeline. Collects, transforms, and routes logs, metrics, and traces. Written in Rust, it replaces agents like Fluentd, Logstash, and Telegraf with a single binary that uses fewer resources.

### Desktop Applications

**Tauri** — A framework for building desktop applications with web frontends and Rust backends. The Electron alternative: Tauri apps use the system webview instead of bundling Chromium, producing binaries that are 10-100x smaller than their Electron equivalents. Tauri v2 (current) supports iOS and Android in addition to Windows, macOS, and Linux.

---

## 7. Embedded Rust

Rust is making inroads into embedded systems development, challenging C's decades-long dominance. The Rust Embedded Working Group coordinates the ecosystem and maintains the essential abstractions.

### The Foundation: no_std

Embedded Rust programs typically run without the standard library. The `#![no_std]` attribute tells the compiler to link only `core` (the platform-independent subset: types, traits, iterators, math) and optionally `alloc` (heap allocation, `Vec`, `String`, `Box`). No filesystem, no networking, no threads — just the bare minimum for a microcontroller:

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _;

#[entry]
fn main() -> ! {
    let peripherals = stm32f4::Peripherals::take().unwrap();
    let gpioa = &peripherals.GPIOA;

    // Configure PA5 as output (onboard LED on many STM32 boards)
    gpioa.moder.modify(|_, w| w.moder5().output());

    loop {
        gpioa.odr.modify(|_, w| w.odr5().set_bit());
        cortex_m::asm::delay(8_000_000);
        gpioa.odr.modify(|_, w| w.odr5().clear_bit());
        cortex_m::asm::delay(8_000_000);
    }
}
```

### embedded-hal — The Hardware Abstraction Layer

`embedded-hal` defines traits for common hardware interfaces: GPIO, SPI, I2C, UART, PWM, ADC, timers. Any driver written against these traits works on any microcontroller that implements them. This is the single most important architectural decision in embedded Rust — it creates a portable driver ecosystem that C never achieved:

```rust
use embedded_hal::digital::OutputPin;
use embedded_hal::delay::DelayNs;

fn blink<P: OutputPin, D: DelayNs>(pin: &mut P, delay: &mut D) {
    loop {
        pin.set_high().ok();
        delay.delay_ms(500);
        pin.set_low().ok();
        delay.delay_ms(500);
    }
}
```

This function works on an STM32, an nRF52, an ESP32, or a Raspberry Pi Pico without modification. The hardware-specific HAL crate provides the concrete `OutputPin` and `DelayNs` implementations.

### Embassy — Async Embedded

Embassy is the modern async framework for embedded Rust. It replaces traditional RTOS task scheduling with Rust's async/await, compiled into cooperative state machines with zero heap allocation:

Embassy supports:
- **embassy-stm32** — All STM32 microcontroller families
- **embassy-nrf** — Nordic nRF52, nRF53, nRF54, nRF91
- **embassy-rp** — Raspberry Pi RP2040 and RP2350
- **embassy-mspm0** — Texas Instruments MSPM0
- **embassy-mcxa** — NXP MCX-A series

Embassy's async executor runs cooperatively on a single stack, avoiding the per-task stack allocation that traditional RTOSes require. Tasks yield at `.await` points, and the executor puts the CPU to sleep when all tasks are waiting for interrupts. This makes Embassy programs both smaller and more power-efficient than RTOS-based equivalents.

### esp-hal — Espressif Support

The `esp-rs` project provides Rust support for Espressif chips (ESP32, ESP32-S2, ESP32-S3, ESP32-C3, ESP32-C6, ESP32-H2). Two approaches exist: `esp-idf-hal` (wraps the C-based ESP-IDF framework) and `esp-hal` (pure Rust, no_std, bare-metal). The community maintains Wi-Fi and Bluetooth drivers, making Rust viable for IoT development on inexpensive hardware.

### probe-rs — Debug and Flash

`probe-rs` is a Rust-based debugging toolkit that supports ARM and RISC-V targets through CMSIS-DAP, ST-Link, and J-Link probes. It provides `cargo flash` and `cargo embed` commands that integrate flashing and debugging directly into the Cargo workflow. No OpenOCD, no GDB servers — just `cargo run` to flash and debug your embedded target.

---

## 8. WebAssembly (Wasm)

Rust is the premier language for WebAssembly. The compiler's LLVM backend targets `wasm32-unknown-unknown` natively, and the ecosystem provides polished tooling for both browser and server-side Wasm.

### The Compilation Pipeline

```bash
rustup target add wasm32-unknown-unknown   # add Wasm target
cargo install wasm-pack                     # install bundler
wasm-pack build --target web               # build for browser
wasm-pack build --target bundler           # build for webpack/vite
```

`wasm-bindgen` generates JavaScript glue code bridging Rust and JS type systems. `web-sys` binds every Web API (DOM, Canvas, WebGL, Fetch). `js-sys` binds JavaScript built-ins (Array, Date, Promise):

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn create_greeting(name: &str) -> Result<(), JsValue> {
    let document = web_sys::window().unwrap().document().unwrap();
    let element = document.create_element("p")?;
    element.set_text_content(Some(&format!("Hello, {name}!")));
    document.body().unwrap().append_child(&element)?;
    Ok(())
}
```

### Frontend Frameworks

Rust's Wasm support has spawned a generation of frontend frameworks that compile to WebAssembly:

**Leptos** — A fine-grained reactive framework. When state changes, only the affected DOM nodes update — no virtual DOM diffing. Supports server-side rendering with streaming HTML. Produces small Wasm binaries. The most active Rust frontend framework as of 2026, with strong community momentum and a path to 1.0 stability.

**Dioxus** — A React-like framework with a virtual DOM. Its distinguishing feature is universal rendering: the same codebase compiles to web (Wasm), desktop (native window), mobile (iOS/Android), and terminal (TUI). Backed by Y Combinator and used in production by Airbus and the European Space Agency.

**Yew** — The original Rust frontend framework, inspired by Elm and React. Uses a component model with message passing. The most mature option with the longest track record, though Leptos and Dioxus have captured more recent adoption.

### Wasm Outside the Browser

WebAssembly has become a universal binary format beyond the browser:

**Wasmtime** — A standalone Wasm runtime by the Bytecode Alliance (Mozilla, Fastly, Intel, Red Hat). Implements WASI (WebAssembly System Interface), giving Wasm modules portable access to files, sockets, clocks, and random numbers. Written in Rust using the Cranelift compiler backend.

**wasmer** — Another standalone runtime, positioning itself as a universal runtime for any language compiled to Wasm. Supports multiple compiler backends (Cranelift, LLVM, Singlepass).

**WASI** (WebAssembly System Interface) — A standardized system interface for WebAssembly. WASI aims to let Wasm modules run anywhere — server, edge, embedded — with capability-based security. Think of it as POSIX for WebAssembly.

**Edge Computing** — Cloudflare Workers and Fastly Compute run Wasm at the edge. Rust → Wasm is the most common compilation path for these platforms because of Rust's small binary size, fast cold starts, and absence of garbage collection pauses.

---

## 9. Tooling — The Rust Developer Experience

Rust's tooling is often cited as the best in any systems programming language. Every tool is installed and managed through a unified toolchain.

### rustup — Toolchain Manager

`rustup` manages Rust compiler versions and cross-compilation targets:

```bash
rustup update                           # update all toolchains
rustup default stable                   # set default channel
rustup override set nightly             # use nightly in current dir
rustup target add aarch64-unknown-linux-gnu   # add cross-compile target
rustup target add wasm32-unknown-unknown      # add Wasm target
rustup component add rust-src                 # add standard library source
rustup show                                   # show installed toolchains
```

Three release channels: **stable** (every 6 weeks), **beta** (next stable), **nightly** (every night, with unstable features behind `#![feature(...)]` gates).

### rustfmt — Code Formatter

`rustfmt` enforces a consistent code style. Unlike `gofmt` (which has a single style), `rustfmt` is configurable via `rustfmt.toml`:

```toml
# rustfmt.toml
max_width = 100
tab_spaces = 4
use_field_init_shorthand = true
edition = "2024"
```

```bash
cargo fmt                 # format all files
cargo fmt -- --check      # check without modifying (CI mode)
```

### clippy — The Linter

clippy provides over 800 lints organized into categories: correctness, suspicious, style, complexity, perf, pedantic, restriction, nursery, and cargo. It catches everything from unused variables to inefficient patterns:

```bash
cargo clippy                           # default lints
cargo clippy -- -W clippy::pedantic    # enable pedantic lints
cargo clippy -- -D warnings            # treat all warnings as errors
```

Example lint suggestions:

```rust
// clippy suggests: use `if let` instead of `match` with one arm
match result {
    Some(x) => println!("{x}"),
    _ => {}
}
// Becomes:
if let Some(x) = result {
    println!("{x}");
}

// clippy suggests: use `is_empty()` instead of length comparison
if vec.len() == 0 { ... }
// Becomes:
if vec.is_empty() { ... }
```

### rust-analyzer — Language Server

rust-analyzer is the official LSP server for Rust. It provides real-time diagnostics, code completion, go-to-definition, find references, rename refactoring, inlay type hints, and inline error messages. It understands macros, traits, lifetimes, and the borrow checker. rust-analyzer replaced the older RLS (Rust Language Server) and is maintained as an official Rust project. It works with VS Code, Neovim, Emacs, Helix, Zed, and any LSP-compatible editor.

### miri — Undefined Behavior Detector

miri is an interpreter for Rust's Mid-level Intermediate Representation (MIR). It executes Rust code in a sandboxed environment that detects undefined behavior: out-of-bounds access, use-after-free, invalid pointer arithmetic, data races, and violations of Rust's aliasing rules in unsafe code:

```bash
cargo +nightly miri test    # run tests under miri
cargo +nightly miri run     # run the program under miri
```

miri is invaluable for validating `unsafe` code blocks. It catches bugs that are invisible to the compiler and often undetectable by runtime tools like AddressSanitizer.

### Cargo Subcommands

The Cargo ecosystem extends via subcommands installed as binaries:

| Subcommand | Purpose |
|-----------|---------|
| `cargo-expand` | Show expanded macro output |
| `cargo-flamegraph` | Generate CPU flamegraphs from profiled runs |
| `cargo-deny` | Check licenses, advisories, bans, and sources |
| `cargo-audit` | Audit dependencies against the RustSec advisory database |
| `cargo-outdated` | Show outdated dependencies with available updates |
| `cargo-watch` | Re-run commands on file changes: `cargo watch -x test` |
| `cargo-nextest` | Faster test runner with per-test parallelism, retries, and JUnit output |
| `cargo-bloat` | Find what contributes to binary size |
| `cargo-machete` | Detect unused dependencies in `Cargo.toml` |
| `cargo-udeps` | Find unused dependencies (nightly, more thorough) |

---

## 10. Testing

Rust has first-class testing built into the language and build system. No external test framework is required for most use cases.

### Unit Tests

Unit tests live alongside the code they test, inside a `#[cfg(test)]` module:

```rust
pub fn fahrenheit_to_celsius(f: f64) -> f64 {
    (f - 32.0) * 5.0 / 9.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn freezing_point() {
        assert_eq!(fahrenheit_to_celsius(32.0), 0.0);
    }

    #[test]
    fn boiling_point() {
        let celsius = fahrenheit_to_celsius(212.0);
        assert!((celsius - 100.0).abs() < f64::EPSILON);
    }

    #[test]
    #[should_panic(expected = "divide by zero")]
    fn panics_on_bad_input() { let _ = 1 / 0; }

    #[test]
    #[ignore] // only runs with: cargo test -- --ignored
    fn slow_integration_test() {
        std::thread::sleep(std::time::Duration::from_secs(30));
    }
}
```

```bash
cargo test                    # run all tests (unit + integration + doc)
cargo test freezing           # run tests matching "freezing"
cargo test -- --nocapture     # show stdout during tests
cargo test -p artemis-core    # test only one workspace member
```

`#[cfg(test)]` ensures the test module is compiled only when testing — zero overhead in production builds.

### Integration Tests

Integration tests live in a `tests/` directory at the crate root. Each file is compiled as a separate crate that can only access the public API:

```rust
// tests/api_integration.rs
use artemis_telemetry::client::TelemetryClient;

#[tokio::test]
async fn test_full_pipeline() {
    let client = TelemetryClient::new("http://localhost:3000");
    let response = client.submit_reading(42, 98.6).await.unwrap();
    assert_eq!(response.status, "accepted");
}
```

### Doc Tests

Code examples in documentation comments (`///`) are compiled and executed as tests:

```rust
/// Converts degrees to radians.
///
/// # Examples
///
/// ```
/// use artemis_math::degrees_to_radians;
///
/// let rad = degrees_to_radians(180.0);
/// assert!((rad - std::f64::consts::PI).abs() < 1e-10);
/// ```
///
/// ```
/// use artemis_math::degrees_to_radians;
///
/// assert_eq!(degrees_to_radians(0.0), 0.0);
/// ```
pub fn degrees_to_radians(deg: f64) -> f64 {
    deg * std::f64::consts::PI / 180.0
}
```

Doc tests ensure that documentation examples are always correct and up-to-date. Every code block in `///` is a test. This is one of Rust's most underrated features — documentation that lies is caught by CI.

### Property Testing and Benchmarking

**proptest** — Property-based testing that generates random inputs and shrinks failures to minimal reproducing cases:

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn celsius_roundtrip(f in -459.67f64..10000.0) {
        let c = fahrenheit_to_celsius(f);
        let back = c * 9.0 / 5.0 + 32.0;
        prop_assert!((back - f).abs() < 1e-10);
    }
}
```

**criterion** — Statistical benchmarking on stable Rust. Measures execution time with statistical rigor, detects regressions, and generates HTML reports with plots:

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_parser(c: &mut Criterion) {
    let data = include_bytes!("../testdata/large_payload.json");
    c.bench_function("parse_telemetry", |b| {
        b.iter(|| parse_telemetry(black_box(data)))
    });
}

criterion_group!(benches, benchmark_parser);
criterion_main!(benches);
```

**cargo-nextest** — A next-generation test runner that runs each test in its own process, enabling true parallelism, per-test timeouts, retries for flaky tests, and JUnit XML output for CI integration. Significantly faster than the default test runner for large test suites.

---

## 11. Documentation

Rust treats documentation as a first-class language feature. The `///` doc comment syntax supports Markdown, code examples (which are tested), and cross-references.

### Doc Comments

```rust
//! # Artemis Telemetry Library
//!
//! Telemetry ingestion for Artemis mission data.

/// A single sensor reading from the spacecraft.
///
/// # Examples
///
/// ```
/// let reading = Reading::new(42, 98.6);
/// assert_eq!(reading.sensor_id(), 42);
/// ```
///
/// # Errors
///
/// Returns [`ReadingError::InvalidSensor`] if the sensor ID
/// is not in the manifest.
pub struct Reading { /* ... */ }
```

- `///` documents the item that follows; `//!` documents the enclosing module/crate
- Standard sections: `# Examples`, `# Errors`, `# Panics`, `# Safety` (for unsafe functions)
- Intra-doc links: `[`ReadingError::InvalidSensor`]` creates clickable cross-references
- Code examples in `///` are compiled and run as tests by `cargo test`

### cargo doc and docs.rs

`cargo doc --open` generates and opens HTML documentation. **docs.rs** automatically generates and hosts documentation for every crate published to crates.io — within minutes of publishing, full searchable docs are available at `https://docs.rs/crate-name`. Every Rust crate has documentation; the barrier is zero.

---

## 12. Cross-Compilation

Rust's cross-compilation story is one of its strongest differentiators. The compiler supports dozens of targets, and switching between them requires only adding the target and passing a `--target` flag.

### Target Management

```bash
rustup target add aarch64-unknown-linux-gnu     # Linux ARM64
rustup target add x86_64-unknown-linux-musl     # Linux static binary
rustup target add aarch64-apple-darwin           # macOS Apple Silicon
rustup target add x86_64-pc-windows-msvc         # Windows x64
rustup target add wasm32-unknown-unknown         # WebAssembly
rustup target add thumbv7em-none-eabihf          # ARM Cortex-M4F (embedded)
rustup target add riscv32imc-unknown-none-elf    # RISC-V (embedded)
rustup target add aarch64-linux-android          # Android ARM64

cargo build --target aarch64-unknown-linux-gnu --release
```

The `x86_64-unknown-linux-musl` target produces fully static binaries (~5-15 MB) that run on any Linux system with zero dynamic library dependencies.

### The cross Tool

For targets needing a full cross-compilation toolchain, the `cross` tool uses Docker containers — pulls the correct image, mounts source, builds inside the container:

```bash
cargo install cross
cross build --target aarch64-unknown-linux-gnu --release
```

Per-target linker and flags are configured in `.cargo/config.toml`:

```toml
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
rustflags = ["-C", "target-feature=+neon"]
```

---

## 13. Performance

Rust delivers performance comparable to C and C++ — not by accident, but by design. Every abstraction is engineered to compile away to the same machine code a careful C programmer would write by hand.

### Zero-Cost Abstractions

The core principle: abstractions have no runtime cost beyond what you would pay if you implemented the same logic manually. Iterators, closures, generics, traits, and pattern matching all compile to the same code as hand-written loops and switches:

```rust
// This iterator chain:
let sum: i64 = readings
    .iter()
    .filter(|r| r.is_valid())
    .map(|r| r.value as i64)
    .sum();

// Compiles to the same machine code as:
let mut sum: i64 = 0;
for r in readings {
    if r.is_valid() {
        sum += r.value as i64;
    }
}
```

The compiler monomorphizes generics (generates specialized code for each concrete type), inlines small functions, and eliminates virtual dispatch when the concrete type is known. This means `Vec<u32>` generates the same machine code as a hand-written dynamic array of `uint32_t` in C.

### No Runtime, No GC

Rust has no garbage collector, no reference counting (unless explicitly requested with `Rc`/`Arc`), no runtime scheduler, and no green thread system. Memory is allocated and freed deterministically through the ownership system. This means:

- No GC pauses (critical for real-time systems, game engines, audio processing)
- No hidden memory overhead (no object headers, no vtable pointers unless using `dyn Trait`)
- Predictable latency (memory deallocation happens at scope exit, not at arbitrary GC cycles)

### Compiler Optimizations

**LTO** — Link-time optimization across crate boundaries. `lto = "fat"` for maximum optimization; `lto = "thin"` balances speed. **PGO** — Profile-guided optimization: instrument, run workloads, recompile with profile data. **Compiler hints:** `#[inline]`, `#[inline(always)]`, `#[cold]` (unlikely paths), `likely()`/`unlikely()` (branch prediction, nightly).

### Real-World Performance

Rust matches or beats C++ while providing memory safety. TechEmpower benchmarks show axum and actix-web in the top tier. Firecracker boots VMs in under 125ms. Pingora uses 70% less CPU than nginx. ripgrep outperforms GNU grep by 2-10x. These are production systems serving billions of requests, not synthetic benchmarks.

---

## 14. Real-World Adoption

Rust has transitioned from a niche language for systems programming enthusiasts to a strategic choice at every major technology company. The inflection point came in 2022-2024; by 2026, Rust adoption is accelerating across operating systems, cloud infrastructure, and consumer products.

### Operating Systems

**Linux Kernel** — Rust was merged into the Linux kernel in Linux 6.1 (December 2022). Miguel Ojeda leads the Rust for Linux project. In late 2025, the experimental phase was formally declared complete: "Rust is here to stay." Android 16 ships with the memory allocator Ashmem completely rewritten in Rust, meaning millions of consumer devices rely on kernel-level Rust code. The Linux 7.0 kernel marks a new era for Rust integration.

**Android AOSP** — Google's adoption of Rust in Android is the largest-scale Rust deployment in consumer software. Memory safety vulnerability density dropped by 1000x in components rewritten from C/C++ to Rust. Google is expanding Rust's "security and productivity advantages" to kernel, firmware, and critical first-party apps including Nearby Presence and Message Layer Security.

**Windows** — Microsoft has 188,000+ lines of Windows kernel and DirectWrite code rewritten in Rust. DWriteCore, the DirectWrite text rendering engine, is partially rewritten in Rust and ships in Windows. Microsoft has a stated research goal to eliminate C/C++ from its codebase by 2030, though officials emphasize this is aspirational rather than imminent.

**Chromium** — Google has integrated Rust into the Chromium codebase. Parsers for PNG, JSON, and web fonts have been replaced with memory-safe Rust implementations, processing untrusted data from the web with stronger safety guarantees.

**Fuchsia** — Google's capability-based operating system uses Rust extensively for its userspace services, driver framework, and system components.

### Cloud and Infrastructure

| Company | Rust Usage |
|---------|-----------|
| **AWS** | Firecracker (Lambda/Fargate), Bottlerocket OS, S3, EC2, CloudFront |
| **Cloudflare** | Pingora (HTTP proxy, 1T+ req/day), Workers runtime, Oxy proxy |
| **Google** | Android, Fuchsia, Chromium, $1M grant for C++ interop |
| **Microsoft** | Windows kernel, DWriteCore, Azure IoT Edge, VS Code search (ripgrep) |
| **Meta** | Source control (Sapling/Mononoke), Buck2 build system, WhatsApp media |
| **Discord** | Read States service (reduced tail latency from Go rewrite) |
| **Dropbox** | File sync engine (rewrote from Python) |
| **Vercel** | Turbopack, SWC (Next.js compiler) |
| **Figma** | Server-side rendering of collaborative design documents |
| **1Password** | Core crypto and sync engine |
| **npm** | Authorization service (rewrote from Node.js for reliability) |

### Survey Rankings

In the 2025 Stack Overflow Developer Survey, Rust was the **most admired programming language** for the tenth consecutive measurement, with 72% of developers who use it wanting to continue using it. On the TIOBE Index, Rust reached a historic high of #13 in January 2026. JetBrains estimates 2.3 million active Rust developers, with enterprise adoption growing 68.75% year-over-year.

---

## 15. The Rust Foundation

The Rust Foundation was incorporated on February 8, 2021 as an independent nonprofit to steward the Rust programming language and ecosystem. Its founding was a direct response to Mozilla's 2020 layoffs, which eliminated the team that had incubated Rust. The Foundation ensures that Rust's infrastructure, governance, and community have sustainable funding independent of any single company.

### Founding Members

Five platinum members founded the organization: **AWS**, **Google**, **Huawei**, **Microsoft**, and **Mozilla**. Each pledged significant annual funding. Since then, additional members have joined at various tiers, including Meta, Toyota, Shopify, and others.

### Leadership

**Rebecca Rumbul** has served as Executive Director and CEO since 2022. She brought experience from non-profit governance and open-source community management. Under her leadership, the Foundation has focused on infrastructure investment (crates.io operations, CI systems), security initiatives (threat modeling, crate verification), and community grants.

### Budget and Programs

The Foundation manages the infrastructure that the Rust project depends on: crates.io hosting and operations, CI/CD systems, the project's AWS bills, and domain/certificate management. It funds:

- **Community Grants Program** — Fellowships for Rust contributors and project maintainers
- **Security Initiative** — Threat modeling, supply chain security, crate auditing partnerships with organizations like the Open Source Security Foundation
- **Interop Initiative** — Google contributed $1 million specifically for C++ interoperability work

### Trademark Controversy (2023)

In April 2023, a draft trademark policy restricting use of the Rust name/logo drew intense community backlash. The Foundation withdrew the draft, revised it with community input, and adopted a more permissive policy. The episode highlighted the tension between IP protection and open-source norms.

### Governance Structure

The Rust project's governance is separate from the Foundation. The **Leadership Council** (formed 2023, replacing the Core Team) governs technical direction via representatives from each top-level team. The Foundation provides resources; the project makes technical decisions.

---

## 16. Comparison to C++

Rust and C++ occupy the same performance tier — both compile to native code via LLVM, have no garbage collector, and target systems programming. Their approaches to safety, however, are fundamentally different.

### Memory Safety

**C++** relies on discipline. Smart pointers (`std::unique_ptr`, `std::shared_ptr`), RAII, and coding guidelines (the C++ Core Guidelines) help prevent memory errors, but the language cannot enforce them. Raw pointers, manual `new`/`delete`, dangling references, and use-after-free remain possible — and common. Google has reported that approximately 70% of serious security vulnerabilities in Chromium are memory safety issues.

**Rust** enforces memory safety at compile time through the ownership and borrow checker. In safe Rust (the default), the compiler guarantees:

- No use-after-free
- No double-free
- No dangling pointers
- No null pointer dereference (there is no null — `Option<T>` is used instead)
- No buffer overflows from safe indexing
- No data races (the borrow checker prevents shared mutable access across threads)
- No uninitialized memory access

These are not runtime checks — they are compile-time proofs. They cost zero runtime performance.

### Undefined Behavior

**C++** has hundreds of sources of undefined behavior (UB). Signed integer overflow, reading uninitialized memory, violating the strict aliasing rule, iterator invalidation, and data races are all UB. The compiler is permitted to assume UB never occurs, which leads to optimizations that remove bounds checks, reorder code, and eliminate "impossible" branches — often with catastrophic results when UB actually occurs.

**Rust** has no undefined behavior in safe code. Period. Unsafe Rust has a smaller, well-defined set of UB sources (dereferencing raw pointers, calling foreign functions, violating aliasing rules), and tools like `miri` can detect many of them.

### Concurrency

**C++** provides `std::thread`, `std::mutex`, `std::atomic`, and `std::condition_variable`. Data races are possible and common. The programmer must remember to lock, unlock, and avoid sharing mutable state — the compiler will not catch mistakes.

**Rust** makes data races a compile-time error. The `Send` and `Sync` traits ensure data can only be shared across threads if safe. `Mutex<T>` owns its data — you cannot access the value without acquiring the lock. The lock releases when the guard goes out of scope. There is no "forgetting to lock" because the API makes it structurally impossible.

### Error Handling

**C++** uses exceptions (hidden control flow, runtime cost, poor interaction with destructors). Many codebases (Google, LLVM) ban exceptions, relying on return codes or `std::expected` (C++23). **Rust** uses `Result<T, E>` for recoverable errors and `panic!` for unrecoverable ones. The `?` operator propagates errors concisely with no hidden control flow.

### Build Systems and Package Management

**C++** has no standard package manager — CMake, Meson, Bazel, Conan, vcpkg each solve part of the problem. **Rust** has Cargo. One tool. Works everywhere. This alone accounts for much of Rust's developer satisfaction.

### The Trade-Off

Rust's learning curve is steeper initially — the borrow checker rejects code a C++ compiler accepts. However, once a Rust program compiles, entire categories of bugs are eliminated. C++'s long-term maintenance cost (memory leaks, data races, CVEs from buffer overflows) exceeds Rust's upfront learning investment. The total cost of ownership over a system's lifetime is lower.

### Summary Table

| Dimension | C++ | Rust |
|-----------|-----|------|
| Memory safety | By convention (smart pointers) | By compiler (ownership) |
| Null pointers | `nullptr` exists | No null — `Option<T>` |
| Data races | Possible at runtime | Compile-time error |
| Undefined behavior | Hundreds of sources in safe code | Zero in safe code |
| Error handling | Exceptions (often banned) | `Result<T, E>` + `?` |
| Package manager | None standard (CMake, Conan, vcpkg) | Cargo |
| Compilation speed | Slow (templates, headers) | Slow (monomorphization, borrow checker) |
| Ecosystem maturity | 40+ years | 11 years (1.0 in 2015) |
| Learning curve | Moderate entry, hidden complexity | Steep entry, explicit complexity |
| ABI stability | Fragile, platform-dependent | None (by design, enables optimization) |
| Interop with C | Native | Via `extern "C"` and FFI |
| Metaprogramming | Templates (Turing-complete, cryptic errors) | Macros (hygienic, procedural) |
| Industry adoption | Universal | Growing rapidly, strategic for safety-critical |

C++ is not going away. Its forty-year codebase, its dominance in game engines, its presence in every operating system kernel, and its massive developer population ensure decades of continued use. But for new systems programming projects — especially those where memory safety, concurrency safety, and long-term maintenance cost matter — Rust has become the default recommendation from organizations ranging from the NSA to the White House Office of the National Cyber Director. The question is no longer whether Rust is ready for production. It is whether new C++ projects can justify the ongoing cost of memory unsafety when a proven alternative exists.

---

## Study Guide — Rust Ecosystem

### Tool map

- **rustup** — toolchain manager.
- **cargo** — build, test, doc, publish.
- **crates.io** — package registry.
- **clippy** — linter.
- **rustfmt** — formatter.
- **miri** — interpreter with UB detection.
- **rust-analyzer** — LSP.
- **cross** — cross-compilation.

### 1-week plan

- Day 1: Install rustup. `cargo new hello`.
- Day 2: Read *The Rust Book* chapters 1-4.
- Day 3: `cargo add` some dependencies. Build a tiny CLI.
- Day 4: `cargo test`. Write a module with tests.
- Day 5: `cargo doc --open`. Read your own docs.
- Day 6: `cargo bench` with criterion.
- Day 7: Publish to crates.io (your own, or a PR to
  someone else's).

## DIY — Port one C program

Pick a small C program. Rewrite in Rust. Observe the
type system catch bugs the original C didn't.

## TRY — Contribute to an open Rust project

Pick something on ripgrep, rg, rg-like, or exa. Read the
code, fix one small issue, submit PR.

---

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
