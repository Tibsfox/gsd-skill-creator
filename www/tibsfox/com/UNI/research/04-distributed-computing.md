# Module 4: Distributed Computing & Unison Cloud

> How content-addressed code enables a fundamentally different model for distributed systems — from code mobility to typed cloud deployment.

Traditional distributed computing requires assembling a complex stack: containers, orchestrators, service meshes, serialization frameworks, API gateways, and YAML configurations that often exceed the application code in volume. Unison's content-addressed architecture enables a radically different approach where deployment is a function call and network boundaries are type-checked.

→ See [Module 1](01-language-core.md) for the content-addressed model underlying code mobility.
→ See [Module 3](03-tooling-workflow.md) for the development workflow that produces deployable code.
→ See [Module 5](05-ecosystem-adoption.md) for the ecosystem and adoption context around Unison Cloud.

---

## 4.1 Code Mobility

Code mobility is the foundational mechanism that makes everything else in this module possible. It is a direct consequence of the content-addressed storage model (→ Module 1).

### The Core Mechanism

In Unison, every definition — function, type, value — is identified by a cryptographic hash of its content. This hash serves as a universal, location-independent identifier. When a computation needs to execute on a remote node:

1. **The sender transmits the bytecode tree** along with the hash references for all dependencies
2. **The receiving node inspects incoming hashes** against its local code cache
3. **Missing dependencies are identified** — hashes not found locally
4. **On-demand sync** — the receiver requests only the missing definitions from the sender
5. **Execution proceeds** once all dependencies are locally available

```
Node A                              Node B
┌──────────────────┐                ┌──────────────────┐
│ fn: #abc123      │   ship hash    │ cache check:     │
│ dep: #def456     │───────────────▶│  #abc123 → MISS  │
│ dep: #ghi789     │                │  #def456 → HIT   │
│                  │   request      │  #ghi789 → MISS  │
│                  │◀───────────────│                  │
│ send: #abc123,   │                │                  │
│       #ghi789    │───────────────▶│ cache populated  │
│                  │                │ → execute fn     │
└──────────────────┘                └──────────────────┘
```

### Why This Is Different

In conventional distributed systems, shipping code between nodes requires:

- **Building a container image** with all dependencies
- **Pushing to a container registry** (Docker Hub, ECR, etc.)
- **Pulling on the destination** and launching a new process
- **Managing version conflicts** between different service dependencies

Unison eliminates this entire pipeline. Because functions are identified by hash:

- **No container builds** — the code *is* the deployment artifact
- **No registry** — hashes sync directly between nodes
- **No version conflicts** — hash identity means exact version matching is automatic; two functions depending on different versions of a library simply reference different hashes with no conflict
- **Incremental transfer** — only missing definitions are shipped, not entire images

### Implications

Code mobility enables computations to migrate across a cluster without pre-packaging. A function started on Node A can be suspended, serialized (including its continuation), transmitted to Node B, and resumed — all with type safety preserved. This is not a theoretical capability; it is the foundation of Unison Cloud's deployment model.

---

## 4.2 Unison Cloud Architecture

Unison Cloud is the commercial platform built on top of the language's code mobility capabilities. It is operated by **Unison Computing**, a public benefit corporation.

### Design Philosophy

> Traditional programming languages describe single-OS-process programs. The gap between "single process" and "distributed system" is filled by YAML engineering — containers, orchestrators, service meshes, and configuration files that encode system architecture in untyped formats.

Unison Cloud eliminates this gap by extending the language itself to encompass distributed system concerns:

- **Service boundaries** as first-class language constructs
- **Network effects** tracked through the ability system
- **Distributed state** with compile-time type guarantees

### Key Capabilities

#### Single-Line Deployment

Services deploy via ordinary function calls, not container orchestration:

```unison
deployHttp myService
```

This replaces:
- Dockerfile authoring
- Container image builds
- Registry push/pull
- Kubernetes manifests (Deployment, Service, Ingress, ConfigMap, etc.)
- Helm charts or Kustomize overlays
- CI/CD pipeline configuration

Live services deploy in seconds rather than minutes [VENDOR-CLAIM — self-reported by Unison Computing].

#### Typed RPC Between Services

Service-to-service communication is a typed function call:

```unison
Services.call albumService (Song "title")
```

This call is:
- **Type-checked at compile time** — the request and response types must match the service's interface
- **Automatically serialized** — no JSON schema definitions, protobuf files, or encoder/decoder layers
- **Effect-tracked** — remote calls are visible in the type signature via the `Remote` ability
- **Async-capable** — supports non-blocking invocation patterns

#### Typed Transactional Storage

Storage is a language-native abstraction rather than a separate database layer:

```unison
-- Define a typed table
myTable : OrderedTable UserId UserProfile
myTable = OrderedTable.named "users"

-- Transactional read/write
Cloud.run do
  OrderedTable.write myTable userId profile
  result = OrderedTable.read myTable userId
```

Features:
- **Strongly typed** — compile-time guarantees on data shape
- **ACID transactions** — consistency guarantees across operations
- **No ORM** — no impedance mismatch between domain objects and storage format
- **Automatic serialization** — Unison values serialize directly to storage without manual conversion

Backed by DynamoDB in AWS regions.

#### Adaptive Service Graph Compression

Unison Cloud dynamically analyzes communication patterns between services and co-locates frequently communicating services on the same node to reduce network latency. This optimization happens transparently at runtime — developers write logical service boundaries, and the platform optimizes physical placement.

### LOC Reduction Claims

Unison Computing reports 10-100x reduction in lines of code compared to equivalent applications built with traditional microservice architectures [VENDOR-CLAIM — self-reported by Unison Computing]. This claim reflects the elimination of:

- Serialization/deserialization boilerplate
- Container and orchestration configuration
- API gateway routing rules
- Service mesh configuration
- CI/CD pipeline definitions
- Infrastructure-as-code templates

Independent verification of this claim at scale is limited, as the platform's user base is still growing (→ See Module 5).

---

## 4.3 BYOC (Bring Your Own Cloud)

### Overview

**Launched:** Generally available October 1, 2025.

BYOC (Bring Your Own Cloud) allows organizations to run Unison Cloud on their own infrastructure while maintaining the same developer experience as the managed platform.

### Requirements

- **S3-compatible storage** — for code and data persistence
- **Container launch capability** — ability to run containers (e.g., AWS EKS, any Kubernetes cluster)
- **Optional: DynamoDB table** — required only if using the transactional storage API (OrderedTable)

### Setup

Deployment uses OpenTofu (open-source Terraform fork):

```bash
# Configure variables for your environment
$ tofu init && tofu apply
```

Deployment takes approximately 20 minutes and transforms "any pool of machines into an easily-programmable distributed computing cluster" (Unison Computing, 2025).

### Architecture

BYOC runs a lightweight, multi-tenant control plane on customer infrastructure. Key architectural properties:

- **Infrastructure isolation** — Unison Computing never sees customer data or HTTP requests
- **Dynamic container behavior** — containers adopt service behaviors through Unison's code serialization and runtime code-loading capabilities, eliminating the need to build and deploy new container images for each service
- **Same capabilities** — BYOC supports all features of managed Unison Cloud: typed RPC, Adaptive Service Graph Compression, built-in dependency conflict prevention

### Pricing

| Tier | Limits | Cost |
|------|--------|------|
| **Personal** | Up to 10 nodes / 160 cores | Free |
| **Open Source / Nonprofit / Education** | Varies | Free (qualified applicants) |
| **Commercial trial** | Generous limits | Free (no credit card required) |
| **Commercial** | Unlimited | Licensed (contact Unison Computing) |

### BYOC vs. Managed Cloud

| Aspect | Managed Cloud | BYOC |
|--------|---------------|------|
| **Infrastructure** | Unison Computing operates | Customer operates |
| **Data residency** | Unison Computing's infrastructure | Customer's infrastructure |
| **Data visibility** | Shared with Unison Computing | Customer-only |
| **Feature parity** | Full | Full |
| **Setup effort** | None | ~20 minutes |
| **Pricing** | Usage-based | Node/core-based licensing |

---

## 4.4 Typed RPC and Serialization

### The `Remote` Ability

Distributed computing in Unison is built on the `Remote` ability, which extends the language's effect system to network operations:

```unison
distributeWork : [Task] ->{Remote} [Result]
distributeWork tasks =
  List.map (task -> Remote.fork (processTask task)) tasks
    |> List.map Remote.await
```

The `{Remote}` annotation in the type signature makes it explicit that this function performs distributed operations. This is not a runtime annotation — it is checked at compile time and propagated through the call graph.

### Why No Serialization Boilerplate

In traditional distributed systems, sending data between services requires:

1. **Define a schema** (protobuf, JSON Schema, Avro, etc.)
2. **Generate or write serializers** (encoders/decoders)
3. **Maintain compatibility** (schema evolution, versioning)
4. **Handle failures** (deserialization errors, version mismatches)

Unison eliminates all four steps. Because every type is content-addressed:

- The **hash of a type** serves as its schema identifier
- **Serialization is automatic** — the runtime knows how to serialize any Unison value to bytes
- **Deserialization is type-safe** — the receiving node verifies the hash matches the expected type
- **Version conflicts are impossible** — different versions of a type have different hashes and are treated as different types

```
Traditional RPC:                    Unison RPC:

Client                             Client
  │ encode(request) → bytes           │ call(service, request)
  │ send(bytes)                       │   ↓ automatic
  ▼                                   ▼
Network                             Network
  │                                   │
  ▼                                   ▼
Server                             Server
  │ receive(bytes)                    │   ↑ automatic
  │ decode(bytes) → request           │ receive(request)
  │ process(request) → response       │ process(request) → response
  │ encode(response) → bytes          │ return(response)
  │ send(bytes)                       │   ↓ automatic
  ▼                                   ▼
Network                             Network
  │                                   │
  ▼                                   ▼
Client                             Client
  │ receive(bytes)                    │   ↑ automatic
  │ decode(bytes) → response          │ receive(response)
```

### Type Safety Across Network Boundaries

The critical guarantee: **if a remote call typechecks, it will not fail due to serialization errors at runtime**. The type system ensures that:

- The request type matches what the service expects
- The response type matches what the caller expects
- All intermediate types in the call chain are compatible

This eliminates an entire category of production bugs — the "it worked in dev but the API contract changed" failure mode.

---

## 4.5 Distributed Data Structures

Unison Cloud provides distributed data structures written in ordinary Unison code, leveraging the language's type system for safety guarantees.

### Core Structures

#### `OrderedTable`

Typed transactional key-value storage with ordering:

```unison
-- Define a table with typed key and value
userProfiles : OrderedTable UserId UserProfile
userProfiles = OrderedTable.named "user-profiles"

-- Transactional operations
Cloud.run do
  OrderedTable.write userProfiles userId profile
  allUsers = OrderedTable.scan userProfiles
```

#### Sorted Maps

Higher-level abstractions built on `OrderedTable`:

```unison
-- Sorted by key with range queries
leaderboard : OrderedTable Score PlayerInfo
leaderboard = OrderedTable.named "leaderboard"

-- Range query: top 10 scores
topPlayers = OrderedTable.scanRange leaderboard (Score 0) (Score maxScore)
  |> List.take 10
```

#### Linearized Event Logs

Append-only event sequences with ordering guarantees:

```unison
eventLog : LinearLog Event
eventLog = LinearLog.named "system-events"
```

#### KNN Indices

Nearest-neighbor search indices for similarity queries, written in ordinary Unison code rather than requiring a separate vector database.

### Volturno: Distributed Stream Processing

Shipped March 2025, **Volturno** (named `Seq` in the API) is a distributed, lazily-evaluated stream processing framework:

- **Distributed computation** — stream processing spans multiple nodes
- **Exactly-once processing** — each event is processed exactly once, with transactional guarantees
- **Lazy evaluation** — data flows through the pipeline without materializing entire datasets in memory
- **Declarative API** — operations compose like ordinary list operations

```unison
-- Declarative stream processing
processEvents : Seq Event ->{Cloud} Seq ProcessedEvent
processEvents events =
  events
    |> Seq.filter isRelevant
    |> Seq.map transform
    |> Seq.groupBy eventType
    |> Seq.reduce aggregate
```

Volturno provides "exactly-once processing and seamless, pain-free ops" with declarative APIs (Unison Computing, 2025) [VENDOR-CLAIM].

### All Written in Unison

A distinguishing property: these distributed data structures are written in ordinary Unison code, not in a systems language with special runtime support. The type system and ability system provide the safety guarantees; the content-addressed model provides the distribution mechanism. This means advanced users can build custom distributed data structures using the same primitives.

---

## 4.6 Deployment Example: Service Definition to Cloud

This section provides a complete deployment example contrasting Unison Cloud with a traditional Docker/Kubernetes approach.

### The Application

A simple user profile service that:
- Accepts HTTP requests to create/read user profiles
- Stores profiles in typed transactional storage
- Calls an email notification service when a profile is created

### Unison Cloud Implementation

```unison
-- Types
type UserId = UserId Nat
type UserProfile = { name : Text, email : Text }
type EmailRequest = { to : Text, subject : Text, body : Text }

-- Storage
profileTable : OrderedTable UserId UserProfile
profileTable = OrderedTable.named "profiles"

-- Email notification service
emailService : ServiceId EmailRequest ()
emailService = ServiceId.named "email-notifier"

-- Email service implementation
handleEmail : EmailRequest ->{Cloud} ()
handleEmail req =
  -- Send email via cloud-native email ability
  Email.send req.to req.subject req.body

-- Profile service implementation
handleCreateProfile : (UserId, UserProfile) ->{Cloud} ()
handleCreateProfile (userId, profile) =
  -- Store profile (transactional)
  Cloud.run do
    OrderedTable.write profileTable userId profile
  -- Notify via typed RPC (1 line, type-checked)
  Services.call emailService
    (EmailRequest profile.email "Welcome!" "Your profile is ready.")

-- HTTP handler
profileHandler : HttpRequest ->{Cloud} HttpResponse
profileHandler req = match Route.parse req with
  POST /profiles ->
    let (userId, profile) = Json.decode req.body
        handleCreateProfile (userId, profile)
        HttpResponse.ok "Created"
  GET /profiles/{id} ->
    let userId = UserId (Nat.fromText id)
        match Cloud.run (OrderedTable.read profileTable userId) with
          Some profile -> HttpResponse.json (Json.encode profile)
          None -> HttpResponse.notFound

-- Deploy: two services, two lines
main : '{Cloud} ()
main _ =
  deployHttp profileHandler
  deploy emailService handleEmail
```

**Total: ~35 lines of application code. Zero configuration files.**

### Equivalent Docker/Kubernetes Implementation

The same application in a traditional stack requires:

**Application code** (~100-200 lines across two services):
- Express/FastAPI HTTP handlers
- Database client setup and connection pooling
- JSON serialization/deserialization with validation
- HTTP client for inter-service communication
- Error handling for network failures, serialization errors
- Environment variable parsing

**Dockerfile** (per service, ~15-25 lines each):
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**Kubernetes manifests** (~100-200 lines total):
```yaml
# deployment.yaml (per service)
# service.yaml (per service)
# ingress.yaml
# configmap.yaml
# secret.yaml
# hpa.yaml (if autoscaling)
```

**Additional infrastructure**:
- `docker-compose.yml` for local development
- CI/CD pipeline (GitHub Actions, ~50-100 lines)
- Database migration scripts
- API schema definitions (OpenAPI/protobuf)
- Service mesh configuration (if using Istio/Linkerd)

**Estimated total: 500-1000+ lines across 15-25 files.**

### Side-by-Side Comparison

| Concern | Unison Cloud | Docker/K8s |
|---------|-------------|------------|
| **Service definition** | Function | Container image |
| **Deployment** | `deploy` / `deployHttp` | kubectl apply + manifests |
| **Inter-service calls** | `Services.call` (typed) | HTTP client + JSON parsing |
| **Storage** | `OrderedTable` (typed) | Database + ORM + migrations |
| **Serialization** | Automatic | Manual (JSON, protobuf) |
| **Configuration** | None | ConfigMaps, Secrets, env vars |
| **Scaling** | Adaptive (automatic) | HPA + metrics server |
| **Build pipeline** | None | Dockerfile + CI/CD |
| **Files** | 1 | 15-25 |
| **Type safety** | End-to-end | Per-service only |

### Caveats

This comparison illustrates the architectural difference, not a production-ready evaluation. Considerations:

- **Unison Cloud is newer** — fewer battle-tested patterns for edge cases
- **Kubernetes is more flexible** — supports any language, any protocol, any infrastructure
- **Vendor dependency** — Unison Cloud requires the Unison language; Kubernetes is language-agnostic
- **Observability** — Kubernetes has a mature ecosystem of monitoring tools; Unison Cloud's observability is still maturing

---

## 4.7 The Open Source / Proprietary Boundary

A critical distinction for evaluating Unison's distributed computing story:

| Component | License | Status |
|-----------|---------|--------|
| **Unison language** | MIT | Open source |
| **UCM (Codebase Manager)** | MIT | Open source |
| **Unison base libraries** | MIT | Open source |
| **Unison Cloud runtime** | Proprietary | Commercial product |
| **Unison Cloud BYOC** | Proprietary | Commercial product (free tier available) |
| **Unison Share** | Proprietary | Free to use |

The language itself is fully open source — you can write, typecheck, test, and compile Unison programs without any commercial dependency. The distributed computing capabilities (cloud deployment, typed RPC at scale, distributed data structures, adaptive service graph compression) are part of the commercial Unison Cloud platform.

The `Remote` ability and core distributed computing primitives are defined in the language, but the production-grade handlers that execute them across real infrastructure are part of Unison Cloud.

→ See [Module 5](05-ecosystem-adoption.md) for how this boundary affects adoption.

---

## Sources

- "Our Approach" — Unison Cloud — https://www.unison.cloud/our-approach/ (accessed March 2026)
- "Cloud BYOC" — Unison Blog — https://www.unison-lang.org/blog/cloud-byoc/ (accessed March 2026)
- Unison 1.0 Announcement — https://www.unison-lang.org/unison-1-0/ (accessed March 2026)
- Unison Documentation — https://www.unison-lang.org/docs/ (accessed March 2026)
