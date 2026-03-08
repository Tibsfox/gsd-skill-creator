# Module 3: Tooling & Developer Workflow

> How Unison developers write, manage, and ship code — from scratch file to published library.

Unison's tooling is unlike any mainstream language. Because code lives in a content-addressed database rather than text files, the traditional edit-compile-run cycle is replaced by a fundamentally different workflow centered on the **Unison Codebase Manager (UCM)**. This module covers every layer of that workflow: the UCM itself, projects and branches, the desktop GUI, AI integration via MCP, editor support, and the complete end-to-end pipeline.

→ See [Module 1](01-language-core.md) for the content-addressed model that makes this tooling possible.
→ See [Module 4](04-distributed-computing.md) for how this workflow extends to cloud deployment.

---

## 3.1 Unison Codebase Manager (UCM)

The UCM is the primary interface for all Unison development. It functions as a combination of REPL, package manager, build tool, test runner, and version control system — roles that in other language ecosystems require separate tools (npm, cargo, ghcup, git, etc.).

### Starting UCM

```bash
$ ucm
```

On launch, UCM opens an interactive session and begins monitoring the current directory for **scratch files** — any file with a `.u` extension. When a scratch file is saved, UCM automatically:

1. **Parses** the file for syntax errors
2. **Typechecks** all definitions against the existing codebase
3. **Reports results** in the UCM console — either errors or a summary of new/changed definitions
4. **Prompts** the developer to add or update definitions

This filesystem watch loop is the heartbeat of Unison development. There is no explicit "compile" step, no build command, no Makefile. Save the file, and UCM reacts.

### Core Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `add` | Add new definitions from scratch file to codebase | `add myFunction` |
| `update` | Replace existing definitions with updated versions | `update` |
| `move` | Rename a definition (preserving all references) | `move oldName newName` |
| `find` | Search for definitions by name | `find "sort"` |
| `view` | Display the source of a definition | `view List.map` |
| `test` | Run test suite | `test` |
| `run` | Execute a program | `run myProgram` |
| `edit` | Load a definition into scratch file for editing | `edit myFunction` |
| `compile` | Package a program into an executable binary | `compile myProgram output.uc` |
| `lib.install` | Install a library from Unison Share | `lib.install @unison/base` |

### The `add` and `update` Distinction

When UCM typechecks a scratch file, it classifies each definition:

- **New definitions** (no existing name match) → prompted to `add`
- **Changed definitions** (name exists, hash differs) → prompted to `update`

The `update` command is particularly powerful. Because Unison tracks dependencies by hash, updating a function automatically identifies all dependents that may need revision. UCM presents a structured refactoring session where you work through each affected definition.

### Watch Expressions

Lines prefixed with `>` in a scratch file are **watch expressions** — they evaluate automatically when the file is saved and display results in the UCM console:

```unison
> List.map (x -> x + 1) [1, 2, 3]
```

Output in UCM:
```
  6 | > List.map (x -> x + 1) [1, 2, 3]
        ⧩
        [2, 3, 4]
```

Watch expressions provide immediate feedback without writing test infrastructure. They are the Unison equivalent of a REPL, but embedded directly in the file you're editing. The constraint: watch expressions cannot run code with unhandled abilities (→ See Module 2 for abilities).

### The `run` Command

For code that requires abilities like `IO`, use the `run` command:

```
.> run myProgram
```

Or with arguments:

```
.> run myProgram "arg1" "arg2"
```

This executes the program within UCM, providing the necessary ability handlers.

### Codebase Web Server

UCM includes a built-in web server for browsing the codebase through a local browser UI:

```
.> ui
```

This launches a browser-based code explorer offering searchable, browsable representation of definitions — functionality typically reserved for full IDEs rather than language tooling.

---

## 3.2 Projects and Branches

Unison projects are organizational units within the codebase, comparable to a repository in the git model but with significant differences.

### Project Fundamentals

```
.> project.create myProject
```

A project represents a library, application, or service. Each project:

- Has a **default `main` branch** created automatically
- Supports **multiple branches** for concurrent workstreams
- Manages **dependencies** through Unison Share
- Supports **pull requests** for collaborative development

### Branching

```
.> branch feature/my-feature
```

Branches in Unison are conceptually similar to git branches but operate on the content-addressed codebase rather than text diffs. Because definitions are identified by hash:

- **Merge conflicts only occur when two branches modify the same definition** — not when two people edit the same file or adjacent lines
- **Renames are conflict-free** — renaming doesn't change the hash, so two branches can independently rename the same definition without conflict
- **No rebase needed** — the hash-based model eliminates the class of conflicts that rebase solves in git

### Dependency Management

Libraries are installed from Unison Share:

```
.> lib.install @unison/base
.> lib.install @unison/base/releases/1.0.0    -- specific version
.> lib.install.local ../other-project          -- local dependency
```

The `lib.install.local` command enables installing local project snapshots as dependencies without network access — useful for multi-project development workflows.

### How This Differs from Git

| Aspect | Git | Unison Projects |
|--------|-----|----------------|
| **Storage** | Text file diffs | Content-addressed definition database |
| **Merge conflicts** | Line-level text collisions | Only when same definition is modified |
| **Renames** | Detected heuristically | Free (hash unchanged) |
| **Dependencies** | Separate tool (npm, pip, etc.) | Built into UCM (`lib.install`) |
| **Build step** | Separate (make, cargo, etc.) | None — typechecked on save |
| **History** | Commit log of text diffs | Branch history with definition-level changes |

---

## 3.3 UCM Desktop App

The UCM Desktop application provides a rich graphical interface for working with Unison codebases.

### Overview

Released initially in January 2025 and continuously updated (latest v1.2.2 as of early 2026), UCM Desktop offers visual codebase exploration that complements the CLI:

- **Namespace tree browsing** — click through the hierarchical structure of types and functions, visualized as a directory tree
- **Click-through definitions** — select any definition to view its source, type signature, and documentation
- **API documentation rendering** — Unison's computable documentation format renders inline with evaluated code examples
- **Inter-definition links** — click references within a definition to navigate to their source
- **Tooltips** — hover over terms for type information
- **Search** — find definitions across the entire codebase

### Visual Features

- Improved light and dark mode with accessible contrasts
- Overlay menus for quick navigation
- Keyboard shortcut reference modal (accessible via settings)
- Focus indication for accessibility

### Use Case

UCM Desktop is particularly valuable for:

- **Onboarding** — new team members can visually explore an unfamiliar codebase
- **Code review** — browsing definitions with full type context
- **Documentation** — rendered doc annotations with live evaluated examples
- **Exploration** — when you're not sure what you're looking for and want to browse rather than search

The desktop app reads from the same codebase database as the CLI UCM, so changes made in either tool are immediately reflected in the other.

---

## 3.4 MCP Server and AI Integration

Unison's UCM includes an embedded **Model Context Protocol (MCP)** server, making it one of the first programming languages to build native AI agent tooling into its core development environment.

### What the MCP Server Enables

The MCP server allows AI agents and programming assistants to:

- **Typecheck Unison code** — submit code for validation and receive type errors or success confirmation
- **Browse documentation** — access rendered documentation for any definition in the codebase
- **Search Unison Share** — discover libraries and definitions across the ecosystem
- **Inspect project dependencies** — analyze the dependency graph of the current project
- **Navigate the codebase** — programmatically browse namespaces, view definitions, and understand code structure

### Why Content-Addressed Code Matters for AI

The content-addressed model provides unique advantages for AI-assisted development:

1. **Unambiguous references** — every definition has a unique hash, eliminating the ambiguity of name-based references across versions
2. **Complete dependency graphs** — the hash tree provides a complete, machine-readable dependency structure
3. **No build state** — AI agents don't need to manage build configurations, environment variables, or compilation flags
4. **Semantic operations** — agents can work at the definition level rather than the text-line level

### Integration Workflow

Developers configure their AI tool (Claude, Cursor, etc.) to connect to UCM's MCP endpoint. The AI agent can then:

1. Read and understand existing codebase definitions
2. Write new Unison code in scratch files
3. Request UCM to typecheck the code
4. Iterate on type errors with full context
5. Add validated definitions to the codebase

This creates a tighter feedback loop than traditional AI coding assistants, which typically rely on heuristic linting rather than full type system validation.

---

## 3.5 Editor Support (LSP)

Unison provides editor integration through the **Language Server Protocol (LSP)**, with primary support for Visual Studio Code.

### VS Code Integration

The Unison VS Code extension provides:

- **Syntax highlighting** — Unison-specific grammar coloring
- **Autocomplete** — type-aware completion suggestions
- **Error highlighting** — inline display of typecheck errors
- **Type-on-hover** — hover over any term to see its type signature
- **Documentation previews** — rendered doc annotations on hover
- **Go-to-definition** — navigate to any referenced definition

### Other Editors

Community contributions extend support to additional editors, though VS Code remains the primary supported platform. The LSP protocol means any editor with LSP support can potentially integrate with Unison.

### Code Formatting Is Not a Concern

A fundamental difference from other languages: **Unison has no code formatter debate**.

Because code is stored as a content-addressed syntax tree (not text), UCM **pretty-prints** definitions on display. When you `view` or `edit` a definition, UCM renders it in a canonical format. This means:

- Every developer sees the same formatting for every definition
- There is no `prettier`, `black`, `rustfmt`, or equivalent
- Formatting preferences don't create merge conflicts
- Code style guides are unnecessary for layout concerns

When you `edit` a function, UCM "renders a textual representation of the function, using the names that are currently associated with the function's hash, into the scratch file" (SoftwareMill, 2024). You modify this rendering, save, and UCM ingests the changes back into the database — the text representation is transient.

---

## 3.6 End-to-End Workflow: Scratch to Publish

This section documents the complete development pipeline from initial code to published library. This is the fundamental workflow every Unison developer uses.

### Step 1: Create a Scratch File

Create any file with a `.u` extension in a directory where UCM is running:

```bash
$ touch mylib.u
```

### Step 2: Write Code

Open the scratch file in your editor and write Unison code:

```unison
-- mylib.u

greet : Text -> Text
greet name = "Hello, " ++ name ++ "!"

double : Nat -> Nat
double n = n * 2

-- Watch expression for quick verification
> greet "World"
> double 21
```

### Step 3: Save — UCM Typechecks Automatically

When you save the file, UCM detects the change and typechecks:

```
  Loading changes detected in mylib.u.

  I found and typechecked these definitions in mylib.u:

    greet  : Text -> Text
    double : Nat -> Nat

  Now evaluating any watch expressions...

    3 | > greet "World"
          ⧩
          "Hello, World!"

    4 | > double 21
          ⧩
          42
```

If there are type errors, UCM reports them immediately with context — no explicit compile step needed.

### Step 4: Add to Codebase

```
.myProject/main> add
```

UCM adds the new definitions to the codebase database. They are now part of your project, addressable by hash, and available as dependencies for other code.

### Step 5: Write and Run Tests

```unison
-- tests.u

test> greet.tests.basic = check (greet "Alice" == "Hello, Alice!")
test> double.tests.basic = check (double 5 == 10)
test> double.tests.zero  = check (double 0 == 0)
```

Save, then add and run:

```
.myProject/main> add
.myProject/main> test
```

UCM discovers and runs all test definitions, reporting pass/fail results.

### Step 6: Push to Unison Share

```
.myProject/main> push
```

This publishes your project to **Unison Share**, Unison's code hosting platform. Other developers can now:

```
.> lib.install @yourname/myProject
```

### The Update Cycle

When modifying existing code, the workflow shifts slightly:

1. **Edit**: `edit greet` — UCM loads the definition into your scratch file
2. **Modify**: Change the implementation in your editor
3. **Save**: UCM typechecks and identifies changed definitions
4. **Update**: `update` — UCM replaces old definitions and identifies dependents needing review
5. **Refactor**: Work through any broken dependents UCM identifies
6. **Test**: `test` — verify everything still passes
7. **Push**: `push` — publish the update

### Handling Dependent Changes

When you update a function's signature, UCM tracks all dependencies:

```
The following definitions were updated:

  greet : Text -> Text -> Text  (was: Text -> Text)

The following definitions need review:

  greetAll : [Text] -> [Text]
    (references old version of greet)
```

During this structured refactoring session, old function versions retain their hashes but lose their human-readable names. In dependent code, references to outdated definitions appear as raw hashes (e.g., `#hmt4gnn927`) until you update them — a visual cue that work remains (SoftwareMill, 2024).

UCM manages incomplete updates using dedicated `-update` branches, preventing disruption to your working branch while refactoring is in progress.

### Complete Pipeline Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  .u scratch │────▶│   UCM parse  │────▶│  Typecheck    │
│    file     │save │   & watch    │auto │  against DB   │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                    ┌──────────────┐     ┌───────▼───────┐
                    │   Codebase   │◀────│  add / update │
                    │   Database   │     │   command     │
                    └──────┬───────┘     └───────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │   test   │ │ compile  │ │   push   │
        │          │ │  (.uc)   │ │ to Share │
        └──────────┘ └──────────┘ └──────────┘
```

---

## 3.7 Comparison with Traditional Toolchains

| Concern | Traditional (e.g., TypeScript) | Unison |
|---------|-------------------------------|--------|
| **Source format** | Text files in filesystem | Content-addressed database |
| **Build system** | webpack, tsc, vite | None — typecheck on save |
| **Package manager** | npm, yarn, pnpm | `lib.install` (built into UCM) |
| **Version control** | git (external tool) | Built-in branches & history |
| **Code hosting** | GitHub, GitLab | Unison Share |
| **Formatting** | prettier, eslint | Automatic (pretty-printed from AST) |
| **Testing** | jest, vitest (external) | Built-in `test` command |
| **REPL** | node, ts-node | Watch expressions + `run` |
| **IDE** | VS Code + extensions | VS Code LSP + UCM Desktop |
| **CI/CD** | GitHub Actions, etc. | Reduced need (no build step) |

The consolidation of responsibilities into UCM means fewer tools to install, configure, and maintain. The tradeoff is that Unison's tooling is a closed ecosystem — you cannot swap in alternative build tools, formatters, or package managers the way you can in languages with separate concerns.

---

## Sources

- Unison Documentation — https://www.unison-lang.org/docs/ (accessed March 2026)
- UCM v0.5.45 Release Notes — https://www.unison-lang.org/blog/ucm0545/ (accessed March 2026)
- "Trying Out Unison, Part 1: Code as Hashes" — SoftwareMill, 2024 — https://softwaremill.com/trying-out-unison-part-1-code-as-hashes/ (accessed March 2026)
- Unison 1.0 Announcement — https://www.unison-lang.org/unison-1-0/ (accessed March 2026)
