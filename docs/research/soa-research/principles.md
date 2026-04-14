# Service-Oriented Programming: Principles and Concepts

*A rigorous treatment of how to think about services — the conceptual core*

---

## Preface: Why This Document Exists

Service-oriented architecture (SOA) is one of those terms that has been so thoroughly abused by vendors, consultants, and conference speakers that its actual meaning has become obscured. When people say "microservices" today, they are usually — whether they know it or not — reaching for ideas that were already well-formed by 2005. When they say "serverless," "event-driven," "distributed systems," "cloud-native," or "platform engineering," they are all working inside the same conceptual frame: **systems built out of independently deployable units that communicate over a network through explicit contracts.**

That frame is what this document is about. It is not about SOAP, ESBs, or WS-*. It is not about REST vs gRPC, or Kubernetes, or service meshes. Those topics belong to the history and technology threads of this research project. This document is about the *principles* — the conceptual scaffolding a working developer needs in order to decompose a system into services competently.

If you finish this document and still do not know the difference between a bounded context and a module, or why loose coupling is a virtue rather than a slogan, or what the CAP theorem actually says (as opposed to what people think it says), we have failed.

---

## Table of Contents

1. What "Service-Oriented" Actually Means
2. The SOA Manifesto (2009) and Its Principles
3. The Eight Core SOA Principles (Thomas Erl)
4. Contract-First Design
5. Loose Coupling — The Fundamental Virtue
6. Service Boundaries and Domain-Driven Design
7. Communication Patterns
8. Orchestration vs Choreography
9. Idempotency
10. Eventual Consistency and CAP
11. Service Discovery
12. Fault Tolerance Patterns
13. Observability — The Three Pillars
14. Distributed Tracing — A Deeper Look
15. API Design Philosophies
16. Versioning and Evolution
17. Service Granularity Debate
18. Statelessness vs State
19. Security
20. The SOA Mental Model

---

## 1. What "Service-Oriented" Actually Means

### 1.1 The core definition

A **service**, in the service-oriented sense, is an *independently deployable, independently scalable, independently evolvable unit of functionality, exposed through an explicit contract, communicating over a network.*

Every word in that definition is doing work. Let's take them one at a time.

**Independently deployable.** You can push a new version of this service to production without coordinating a simultaneous release of any other service. This is the property that distinguishes a service from a library. If your "microservices" have to be deployed together, in lockstep, to avoid breakage, you do not have services — you have a distributed monolith with extra latency.

**Independently scalable.** You can run 100 copies of this service and 2 copies of that one. You can put this service on a GPU box and that one on a cheap ARM node. You can scale them to zero when idle or provision them with burst capacity when a traffic spike hits. Shared-fate scaling is a failure mode: if the checkout service scales with the catalog service because they share a process, you have no service boundary.

**Independently evolvable.** The team that owns this service can change its internal implementation — language, framework, database, memory model — without asking anyone for permission, so long as the contract at the boundary is honored. This is the property that makes service-oriented thinking useful for organizations, not just for machines. Conway's Law cuts both ways: if your org chart demands coordination, your architecture cannot eliminate it.

**Explicit contract.** The only thing outside the service that matters is the promise the service makes about its interface: what it accepts, what it returns, how it behaves under failure. Everything inside the service is private. This is the single most important idea in the whole field, and we will return to it repeatedly.

**Over a network.** The communication channel is a wire. That means bytes on the move, variable latency, packet loss, partial failures, serialization, deserialization, endianness, timeouts, and retries. It is nothing like a function call. Pretending it is (as RPC frameworks have done since Sun RPC in 1984) is the source of an enormous amount of bad architecture.

### 1.2 A service as a boundary

The deepest way to think about a service is as a **boundary** — the fundamental unit of modularity in distributed systems.

All of software engineering is about drawing boundaries well. You draw them between functions, classes, modules, packages, processes, machines, teams, companies. What makes services special is that they draw the boundary at the edge where independent deployment becomes possible. Everything on one side of the boundary can change without telling the other side. Everything on the other side must honor the contract at the seam.

Boundaries compose. A service can be implemented internally as many functions, or one giant procedure, or a cluster of sub-services hidden behind a facade. To its consumers, none of that is visible. The boundary is the thing.

### 1.3 Contrast with other units of decomposition

To understand what a service is, it helps to see what it is not. The following table shows the units of software decomposition and when each becomes "the unit of composition":

| Unit        | Binding time   | Address space | Deploy unit   | Failure domain |
|-------------|----------------|---------------|---------------|----------------|
| Function    | Compile/link   | Same          | Same binary   | Same process   |
| Object      | Runtime        | Same          | Same binary   | Same process   |
| Module      | Compile time   | Same          | Same binary   | Same process   |
| Package     | Build time     | Same          | Same binary*  | Same process   |
| Library     | Link time      | Same          | Co-deployed   | Same process   |
| Process     | OS fork/exec   | Separate      | Same host     | Per-process    |
| Container   | Schedule time  | Separate      | Per-container | Per-container  |
| **Service** | **Runtime**    | **Separate**  | **Independent**| **Independent**|

*\* Packages may or may not be their own build artifacts depending on the ecosystem. Java JARs and Python wheels are closer to libraries.*

The decisive row is the last one: a service is a unit whose deployment is independent of every other service. That independence is what makes it worth paying the network tax for.

### 1.4 The shift from function call to network call

In-process composition looks like this:

```python
total = sum(prices) * (1 + tax_rate)
```

Out-of-process composition looks like this:

```python
# pseudocode
response = http.post(
    "http://pricing-service/v2/totals",
    json={"line_items": line_items, "tax_region": "US-WA"},
    timeout=2.0,
)
if response.status_code == 503:
    # circuit breaker opened upstream; degrade
    return cached_estimate(line_items)
if response.status_code != 200:
    log.warn("pricing degraded", extra={"code": response.status_code})
    return None
total = response.json()["total_cents"]
```

The second version is not just "the first version with more code." It is a qualitatively different operation. It can:

- **Time out.** The pricing service may be alive but slow. You must decide how long to wait.
- **Fail partially.** Your request may reach the service but the response may be lost.
- **Fail non-deterministically.** The same call made twice may give different answers because the service is eventually consistent, or was mid-deploy, or hit a different shard.
- **Return stale data.** The service's own caches may lag reality by seconds or minutes.
- **Disappear entirely.** The service may simply not exist — it was rolled back, renamed, retired.

When you adopt service-oriented thinking, you are committing to make *these* concerns first-class in your design. The function call was the unit of composition in structured programming; the method call in OOP; the pure function in FP. In SOA, **the network call is the unit of composition**, and everything about your architecture follows from taking its properties seriously.

### 1.5 The "8 fallacies of distributed computing"

Compiled by Peter Deutsch and others at Sun Microsystems (1994, with #8 added by James Gosling later), the 8 fallacies name the assumptions that first-time distributed systems engineers almost always make:

1. **The network is reliable.** It is not.
2. **Latency is zero.** It is not — it is bounded below by the speed of light and in practice much worse.
3. **Bandwidth is infinite.** It is not.
4. **The network is secure.** It is not.
5. **Topology doesn't change.** It does, constantly, in a cloud environment.
6. **There is one administrator.** There are dozens, working for different companies.
7. **Transport cost is zero.** Serialization, TLS, routing, and egress all cost money and time.
8. **The network is homogeneous.** It is not — every hop has different MTUs, congestion profiles, and failure modes.

Every one of these fallacies, when believed, produces a specific class of bug in a service-oriented system. Service-oriented *thinking* is in large part the habit of not believing them.

---

## 2. The SOA Manifesto (2009) and Its Principles

### 2.1 The setting

By 2009, SOA was in trouble. The term had been captured by enterprise software vendors (IBM, Oracle, SAP, BEA, Software AG, TIBCO) who were selling vast, expensive "SOA platforms" — enterprise service buses, business process engines, registry/repository products — under the banner of Service-Oriented Architecture. The actual engineering discipline had been buried under Gartner hype cycles and consulting engagements that promised business agility but delivered five-year integration projects.

In October 2009, the International SOA Symposium was held in Rotterdam. On October 23, a working group of practitioners drafted a document they called the **SOA Manifesto**, explicitly modeled on the Agile Manifesto of 2001. Their goal was to reclaim the term from the vendor-driven narrative and restate what service orientation was actually for.

### 2.2 The text of the manifesto

The manifesto's preamble reads:

> Service orientation is a paradigm that frames what you do. Service-oriented architecture is a type of architecture that results from applying service orientation. We have been applying service orientation to help organizations consistently deliver sustainable business value, with increased agility and cost effectiveness, in line with changing business needs.

Then it lists six prioritized values, each of the form "X over Y" — acknowledging that Y still has value but X has more:

1. **Business value over technical strategy.**
2. **Strategic goals over project-specific benefits.**
3. **Intrinsic interoperability over custom integration.**
4. **Shared services over specific-purpose implementations.**
5. **Flexibility over optimization.**
6. **Evolutionary refinement over pursuit of initial perfection.**

It then enumerates fourteen "guiding principles" that elaborate on these values. We will unpack the six core values first, then comment on how well they have aged.

### 2.3 The six values, unpacked

**Business value over technical strategy.** SOA is not a goal. You do not build a service-oriented architecture to have one — you build it because it lets the business ship features faster, or reduce cost, or enter new markets. If your technical strategy is inconsistent with business value, the business value wins. This principle was a direct rebuke of the vendor-driven SOA hype, which was selling platforms as ends in themselves.

**Strategic goals over project-specific benefits.** A single project can always win by ignoring the enterprise. Build it fast, ship it, move on. But if every project does this, you end up with an archipelago of point-to-point integrations that the organization has to maintain forever. Service orientation says: take the hit of thinking about the long game. Build capabilities, not projects.

**Intrinsic interoperability over custom integration.** A service should be usable *as-is* by any reasonable consumer. Not "usable after a three-month integration engagement." The contract should be explicit enough that strangers can wire up against it. When interoperability has to be engineered in per-consumer, you have missed the point.

**Shared services over specific-purpose implementations.** Prefer one canonical customer service that the whole enterprise uses over five customer-adjacent modules built inside five different applications. This is the reusability principle — and it is the value most often overstated by SOA proponents and most often criticized in retrospect, because shared services create shared dependencies that couple teams. The modern microservices movement partially walks this one back (see §3 and §17).

**Flexibility over optimization.** Premature optimization kills services the same way it kills programs. A service should first be *easy to change*. Optimization comes later, where measurements show you need it. "Flexibility" here means: evolvability, the ability to refactor, the ability to replace implementations without breaking contracts.

**Evolutionary refinement over pursuit of initial perfection.** You will not get your service boundaries right on the first try. You will not get your contracts right on the first try. The manifesto accepts this and says: that's fine — build something, run it, learn, refine. This is deeply Agile in spirit and stands in sharp contrast to the waterfall-heavy "enterprise architecture" approach the manifesto was rebelling against.

### 2.4 The fourteen guiding principles

The manifesto also lists fourteen guiding principles, which are worth reading but can be summarized:

- Respect the social and power structure of the organization.
- Recognize that SOA ultimately demands change on many levels.
- The scope of SOA adoption can vary — keep efforts manageable and within meaningful boundaries.
- Products and standards alone will give you neither SOA nor the realization of its benefits.
- SOA can be realized through a variety of technologies and standards.
- Establish a uniform set of enterprise standards and policies based on industry, de facto, and community standards.
- Pursue uniformity on the outside while allowing diversity on the inside.
- Identify services through collaboration with business and technology stakeholders.
- Maximize service usage by considering the current and future scope of utilization.
- Verify that services satisfy business requirements and goals.
- Evolve services and their organization in response to real use.
- Separate the different aspects of a system that change at different rates.
- Reduce implicit dependencies and publish all external dependencies to increase robustness and reduce the impact of change.
- At every level of abstraction, organize each service around a cohesive and manageable unit of functionality.

The line that has aged best is: *"Separate the different aspects of a system that change at different rates."* This is basically the modern microservices rationale, and it is also the core of clean architecture, hexagonal architecture, and every other architectural philosophy that values evolvability.

### 2.5 The signatories

The manifesto was signed at the Rotterdam symposium by a working group including:

- **Thomas Erl** — the most prolific SOA author, whose Prentice Hall "Service-Oriented Architecture" series defined the vocabulary for a decade.
- **Anne Thomas Manes** — formerly of Gartner, famous for her January 2009 blog post "SOA is Dead; Long Live Services" which was widely read as the precipitating event for the manifesto.
- **Mark Little** — JBoss/Red Hat, a WS-* standards author.
- **Steve Jones** — Capgemini, author of "Enterprise SOA Adoption Strategies."
- **David Chappell** — Oracle, author of "Enterprise Service Bus."
- **Nicolai Josuttis** — author of "SOA in Practice."
- Dozens of others from consultancies, vendors, and practitioner shops.

The manifesto went online at **soa-manifesto.org**, where it was signed by thousands more readers over the following years. It has not been updated; it was a moment-in-time statement.

### 2.6 How the manifesto was received

The manifesto was simultaneously:

- A rescue attempt — to take SOA back from the vendors.
- An admission of failure — it is hard to imagine the Agile Manifesto being written *after* the community had stopped calling itself Agile.
- A prelude — the term "microservices" was coined around 2011 (Fred George, Adrian Cockcroft, and James Lewis / Martin Fowler's famous 2014 Bliki post). By the time microservices took off, the term SOA had been so tarnished that microservices advocates often actively disavowed it, even though the underlying ideas were the same.

The manifesto's six values all survived into microservices practice. What died was the branding.

---

## 3. The Eight Core SOA Principles (Thomas Erl)

### 3.1 Who Erl is and why this matters

Thomas Erl's book *SOA: Principles of Service Design* (Prentice Hall, 2007, ISBN 0-13-234482-3) was for years the most widely cited catalog of what services should look like. Erl is a prolific systems author — his series spans about ten books — and while his work has been criticized as overly abstract and vendor-adjacent, his eight principles remain the most useful compact checklist for "what makes a service a service."

Below is each principle with its original Erl framing, followed by a modern critique.

### 3.2 The eight principles

**1. Standardized Service Contract.** Services within the same service inventory are in compliance with the same contract design standards. That is: every service in the portfolio looks like every other one, in terms of how it defines its interface, what it returns, what errors it emits, how it authenticates, etc.

*Critique:* This is healthy in a single-enterprise context. It is unhealthy when standardization becomes central committee paralysis. Modern practice is: pick a small number of conventions (e.g., "every internal service speaks gRPC over HTTP/2 with OpenTelemetry traces and returns errors following the google.rpc.Status shape") and enforce them with tooling, not documents.

**2. Service Loose Coupling.** Service contracts impose low consumer coupling requirements and are themselves decoupled from their surrounding environment. Changes in the implementation should not force changes in the consumer.

*Critique:* Survives unchanged. This is the most important principle. See §5 for depth.

**3. Service Abstraction.** Service contracts contain only essential information, and information about services is limited to what is published in service contracts. Nothing about the implementation leaks through the contract.

*Critique:* Survives. This is what "information hiding" meant to Parnas in 1972, translated to a distributed world.

**4. Service Reusability.** Services contain and express agnostic logic and can be positioned as reusable enterprise resources.

*Critique:* This is where Erl's framework has aged worst. The microservices community deliberately rejected "reusability as the north star" on the grounds that pursuing maximum reusability leads to shared services, which become shared dependencies, which create inter-team coupling. Sam Newman wrote in *Building Microservices* that he preferred **"replaceable"** over **"reusable"**. A service that is cheap to replace is more valuable than a service that is maximally reused across the org.

**5. Service Autonomy.** Services exercise a high level of control over their underlying runtime execution environment. They own their own data, their own deployment cadence, their own scaling.

*Critique:* Survives, and is now dogma. The microservices rule is: **one database per service, period.** No sharing the customer table across three services. If you need the data, you ask the service that owns it.

**6. Service Statelessness.** Services minimize resource consumption by deferring the management of state information when necessary.

*Critique:* Partly survives. The HTTP request-handler should be stateless — any node can handle any request. But state has to live *somewhere*, and pretending it doesn't is how you end up with an architecture that shoves all the complexity into a shared database. See §18 for the nuanced view.

**7. Service Discoverability.** Services are supplemented with communicative metadata by which they can be effectively discovered and interpreted.

*Critique:* Survives, in a modernized form. Erl was thinking about UDDI registries — the enterprise discovery servers of the WS-* era. Those failed. What replaced them was: DNS (kubernetes-style cluster DNS), Consul, etcd, service catalogs, API gateways with portal pages. The principle is the same — a new consumer should be able to find and understand your service without asking a human — but the mechanism has shifted.

**8. Service Composability.** Services are effective composition participants, regardless of the size and complexity of the composition.

*Critique:* Survives. This is the reason we are doing this at all — the whole point of splitting a system into services is that you can recompose them into new behaviors. If your services aren't composable, you have just made a distributed monolith.

### 3.3 What Erl missed

The eight principles are a good foundation, but they do not cover:

- **Observability.** Erl mentions monitoring, but the discipline of observability (as distinct from monitoring) had not yet emerged. See §13.
- **Failure-first thinking.** Erl's framework assumes services work. The microservices literature after 2011 treats failure as the default case. See §12.
- **Data ownership as an organizing principle.** Implicit in "autonomy," but not called out. See §6.
- **Org-chart alignment.** Erl's SOA was often aspirationally org-neutral, which meant in practice it was imposed by a central architecture board. Modern service orientation accepts Conway's Law and tries to use it (§20).

---

## 4. Contract-First Design

### 4.1 Why the contract is the most important thing

When you build a service, you have to make a decision about order of operations. Do you build the implementation first and then derive a contract from it (code-first)? Or do you write the contract first and then implement against it (contract-first)?

Contract-first wins, for reasons both technical and sociological.

**Technically**, the contract is the only thing consumers see. If you write the implementation first, you will tend to leak implementation details into the contract — field names that match your database columns, error codes that match your ORM's exceptions, pagination shapes that match your in-memory data structures. Then when you refactor the implementation, you have to either break the contract or do violence to keep it the same. If you write the contract first, the contract is shaped by *consumer needs* rather than *implementation convenience*, and that is what makes it evolvable.

**Sociologically**, the contract is the coordination point between teams. If your team and the consumer team can agree on a contract document before either of you starts coding, you can both build in parallel. That parallelism is the entire reason service decomposition exists as a technique.

### 4.2 Interface Definition Languages — a history

A contract needs to be expressed in some language. The tradition of Interface Definition Languages (IDLs) goes back to before SOA itself:

- **Sun RPC / XDR (1987).** XDR (External Data Representation, RFC 1014) was the first widely used IDL. You wrote a `.x` file describing your procedures and data structures, and a `rpcgen` tool generated C stubs and skeletons. NFS was built on it.
- **CORBA IDL (1991).** The OMG's Common Object Request Broker Architecture defined its own IDL for describing distributed objects. CORBA IDL influenced almost everything that came later. It was rich — it had interfaces, inheritance, exceptions, oneway operations, typedef, enum, sequence, union. It also had "any" (dynamic typing) which was universally regretted.
- **DCOM / MSRPC IDL (1993).** Microsoft's version, derived from DCE IDL, used for COM interfaces.
- **WSDL 1.1 (2001) / 2.0 (2007).** The Web Services Description Language was XML-based, extremely verbose, and coupled tightly to the SOAP protocol and XML Schema. WSDL was the canonical enterprise-SOA IDL.
- **Thrift (2007).** Facebook's open-source IDL and RPC framework, released to Apache in 2007. Thrift files look like C headers. Thrift introduced the concept of a "versioned protocol" as a first-class idea.
- **Protocol Buffers (public release 2008).** Google's internal IDL since 2001, made public in 2008. Protobuf .proto files are the most widely used IDL in the modern world.
- **OpenAPI (née Swagger, 2011).** A JSON/YAML IDL for HTTP APIs. The thing you use when your API is "REST-ish over JSON" rather than RPC.
- **GraphQL SDL (2015).** Facebook's schema definition language for GraphQL. A type system plus query syntax.
- **AsyncAPI (2017).** OpenAPI for event-driven systems — describing Kafka topics, AMQP queues, WebSocket channels.
- **Smithy (2019).** AWS's IDL, used to describe all AWS service APIs. More expressive than OpenAPI, designed to generate multiple protocol serializations from one spec.

Each of these is a different answer to the question "what does a contract look like?" What they all share is the belief that **the contract is a first-class artifact, separate from any implementation, that can be checked, versioned, and shared.**

### 4.3 Example: a Protobuf contract

Here is what an IDL-first contract looks like in Protocol Buffers:

```protobuf
syntax = "proto3";
package pricing.v1;

import "google/protobuf/timestamp.proto";

option go_package = "example.com/api/pricing/v1;pricingv1";
option java_package = "com.example.api.pricing.v1";

// The Pricing service computes tax-inclusive totals for line-item
// carts. It is the canonical source of truth for tax computation
// across all storefronts.
service Pricing {
  // Compute a total for the provided line items.
  // This operation is idempotent when an idempotency_key is provided.
  rpc ComputeTotal(ComputeTotalRequest) returns (ComputeTotalResponse);

  // Stream real-time price updates for a set of SKUs. Used by
  // the live pricing dashboard.
  rpc StreamPriceUpdates(StreamPriceUpdatesRequest)
    returns (stream PriceUpdate);
}

message ComputeTotalRequest {
  // An idempotency key supplied by the client. Identical requests with
  // the same key will return identical responses for 24 hours.
  string idempotency_key = 1;

  // The cart to price.
  repeated LineItem line_items = 2;

  // Tax region in ISO-3166-2 form, e.g. "US-WA".
  string tax_region = 3;

  // ISO-4217 currency code. Defaults to "USD" if unset.
  string currency = 4;
}

message LineItem {
  string sku = 1;
  int64 quantity = 2;
  // Unit price in minor currency units (cents, pence, etc).
  int64 unit_price_minor = 3;
}

message ComputeTotalResponse {
  int64 subtotal_minor = 1;
  int64 tax_minor = 2;
  int64 total_minor = 3;
  string currency = 4;
  google.protobuf.Timestamp computed_at = 5;
  // The tax rule version used. Informational only; not part of
  // the stable contract for equality comparisons.
  string tax_rule_version = 6;
}

message StreamPriceUpdatesRequest {
  repeated string skus = 1;
}

message PriceUpdate {
  string sku = 1;
  int64 unit_price_minor = 2;
  google.protobuf.Timestamp effective_at = 3;
}
```

Observe what this file communicates:

- **The service.** There is a named `Pricing` service in package `pricing.v1`.
- **The operations.** Two RPCs: one unary, one server-streaming.
- **The messages.** Each request and response is a named, typed message.
- **Field numbers.** Every field has an integer tag — 1, 2, 3, etc. These tags are the *on-the-wire identity* of the field. The field name can be renamed without breaking consumers as long as the number stays the same. This is a powerful evolution lever.
- **Semantic commentary.** The doc comments describe contract-level behavior (idempotency, caching, meaning of fields), not implementation details.
- **Version in the package.** `pricing.v1` will be joined by `pricing.v2` when the contract needs a breaking change, and both can coexist.

### 4.4 Example: an OpenAPI contract

The same service in OpenAPI 3.1 would look like:

```yaml
openapi: 3.1.0
info:
  title: Pricing API
  version: 1.0.0
  description: |
    Canonical pricing for cart totals across all storefronts.
servers:
  - url: https://api.example.com/pricing/v1

paths:
  /totals:
    post:
      operationId: computeTotal
      summary: Compute a total for the provided line items.
      description: |
        Idempotent when `Idempotency-Key` header is supplied.
      parameters:
        - in: header
          name: Idempotency-Key
          required: false
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ComputeTotalRequest"
      responses:
        "200":
          description: Computed total.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ComputeTotalResponse"
        "400":
          description: Invalid request.
          content:
            application/problem+json:
              schema:
                $ref: "#/components/schemas/Problem"
        "503":
          description: Degraded — tax engine temporarily unavailable.

components:
  schemas:
    ComputeTotalRequest:
      type: object
      required: [line_items, tax_region]
      properties:
        line_items:
          type: array
          items:
            $ref: "#/components/schemas/LineItem"
        tax_region:
          type: string
          pattern: "^[A-Z]{2}-[A-Z0-9]{1,3}$"
        currency:
          type: string
          default: "USD"
    LineItem:
      type: object
      required: [sku, quantity, unit_price_minor]
      properties:
        sku:
          type: string
        quantity:
          type: integer
          format: int64
          minimum: 1
        unit_price_minor:
          type: integer
          format: int64
    ComputeTotalResponse:
      type: object
      required: [subtotal_minor, tax_minor, total_minor, currency]
      properties:
        subtotal_minor: { type: integer, format: int64 }
        tax_minor:      { type: integer, format: int64 }
        total_minor:    { type: integer, format: int64 }
        currency:       { type: string }
        computed_at:    { type: string, format: date-time }
    Problem:
      type: object
      description: RFC 7807 problem details.
      properties:
        type:    { type: string, format: uri }
        title:   { type: string }
        status:  { type: integer }
        detail:  { type: string }
        instance:{ type: string, format: uri }
```

The OpenAPI version is more verbose, because it is describing HTTP semantics as well — status codes, paths, headers, content types. But the idea is identical: contract first, implementation later.

### 4.5 Schema as contract, not as "the database"

A common confusion is the word "schema." Engineers come to services from relational databases, where "schema" means "the physical layout of tables." In a service context, **the schema is the contract**, not the storage. The two must be kept strictly separate, because they evolve at different rates and for different reasons.

The internal database schema of the Pricing service might have 30 tables, dozens of join tables, materialized views, denormalized hot-paths, and obscure historical cruft from three migrations ago. None of that is the contract. The contract is the Protobuf or OpenAPI document. The contract hides the implementation, and the job of the implementation is to honor the contract.

When you conflate the two, you get the worst anti-pattern in service design: **shared database access.** Team B reaches into Team A's database tables because "the schema is the contract, right?" No. The wire schema is the contract. The database is Team A's private business.

### 4.6 Contract testing — Pact and friends

Writing a contract is not enough; you have to verify that both sides honor it. This is what **contract testing** is for.

Two styles exist:

**Provider-driven (traditional).** The service owner writes a specification, generates test cases from it, and runs them against their implementation. Tools: Spring Cloud Contract, Dredd (for OpenAPI), schemathesis.

**Consumer-driven contracts (CDC).** The consumer writes a "mock" of the interactions it needs from the provider, and that mock is shared back to the provider. The provider then runs tests that verify its implementation satisfies every consumer's expectations. The tool that popularized this was **Pact** (pact.io), originally created at realestate.com.au around 2013 and now a widely used open-source project.

The consumer-driven model has the nice property that the provider team knows, at any moment, exactly which consumer expectations they are honoring and which they would break. If a provider wants to remove a field, they can check: does any consumer currently rely on it? If yes, block the removal. If no, the removal is safe.

An example Pact file (JSON) might look like:

```json
{
  "consumer": { "name": "checkout-ui" },
  "provider": { "name": "pricing-service" },
  "interactions": [
    {
      "description": "compute total for two line items",
      "request": {
        "method": "POST",
        "path": "/v1/totals",
        "headers": { "Content-Type": "application/json" },
        "body": {
          "line_items": [
            { "sku": "ABC", "quantity": 1, "unit_price_minor": 1000 },
            { "sku": "XYZ", "quantity": 2, "unit_price_minor": 500 }
          ],
          "tax_region": "US-WA"
        }
      },
      "response": {
        "status": 200,
        "headers": { "Content-Type": "application/json" },
        "body": {
          "subtotal_minor": 2000,
          "tax_minor": 200,
          "total_minor": 2200,
          "currency": "USD"
        },
        "matchingRules": {
          "$.body.computed_at": { "match": "type" }
        }
      }
    }
  ]
}
```

The matching rules are important: Pact lets you assert "this field must exist and be a string" rather than "this field must equal this exact timestamp," which would be brittle.

### 4.7 Backward compatibility and schema evolution

A contract is a *promise to the future*. The moment a consumer starts depending on your service, you have to assume every field, every endpoint, every error code is someone's load-bearing assumption. You cannot change them freely.

The discipline that makes this tractable is **schema evolution rules**. Different IDLs have different rules, but they share a common shape.

**Protobuf rules:**

1. Do not reuse field numbers. Once a field number is used, it is used forever.
2. You may rename fields. Field *numbers* are the identity, not names.
3. You may add new fields. Old consumers will ignore them.
4. You may remove fields, but only if you first reserve their field number so it cannot be reused.
5. You must not change the type of a field. (Some int↔int conversions are allowed, but most type changes break the wire format.)
6. Optional means "may be absent"; repeated means "zero or more."
7. Do not change `repeated` to single or vice versa.

The *"do not reuse field numbers"* rule is the single most important discipline in Protobuf, and protobuf enforces it: you write `reserved 3;` in your `.proto` file to mark a removed field number, and the compiler refuses to let you assign 3 to something else.

Example of a correct Protobuf deprecation:

```protobuf
message ComputeTotalResponse {
  int64 subtotal_minor = 1;
  int64 tax_minor = 2;
  int64 total_minor = 3;
  string currency = 4;
  google.protobuf.Timestamp computed_at = 5;

  // Removed in v1.4 — was `string legacy_tax_rule_version`.
  reserved 6;
  reserved "legacy_tax_rule_version";

  // New in v1.5.
  TaxBreakdown tax_breakdown = 7;
}
```

**OpenAPI rules** are similar in spirit but weaker in enforcement. OpenAPI lets you add fields freely, mark old ones with `deprecated: true`, and (in 3.1) attach `$comment` metadata. But because OpenAPI is often hand-written, violations are common, and you need a linting tool (Spectral, for example) to catch them.

**GraphQL rules** are unique because GraphQL resolves only the fields the client asks for. You can add new fields freely. You can deprecate fields with the `@deprecated` directive, but the spec says they should still work until explicitly removed. You can never change a field's type without it being a breaking change.

### 4.8 The "additive only" rule

A useful heuristic across all schema systems: **additive changes are safe, destructive changes are dangerous.**

Safe:
- Adding new endpoints, new fields, new enum values (usually), new optional parameters.
- Relaxing constraints (making a required field optional).
- Expanding accepted formats.

Dangerous:
- Removing endpoints, fields, or enum values.
- Tightening constraints (making an optional field required).
- Changing semantics of an existing field.
- Renaming things in wire formats that use names as identity (JSON, GraphQL).

The "additive only" rule works until it doesn't. Eventually, you really do need to remove something, or rename something, or change the meaning of something. That is when you reach for versioning (§16) — a new major version lets you break the contract cleanly while keeping the old one alive for a migration window.

---

## 5. Loose Coupling — The Fundamental Virtue

### 5.1 What loose coupling actually means

Of all the principles in SOA, loose coupling is the one that matters most. Every other principle is really a special case of it.

**Loose coupling** means: the services can evolve independently without breaking each other.

That's it. That's the whole definition. Everything else is mechanism.

The opposite of loose coupling is **tight coupling**, where any change to service A requires a corresponding change to service B. If changing your database schema forces your consumer team to redeploy, you are tightly coupled. If adding a new endpoint requires the API gateway team to release, you are tightly coupled. If you have to deploy the services in a specific order, you are tightly coupled.

Tight coupling is not inherently bad — in-process functions are tightly coupled to their callers, and nobody minds, because they're compiled together. The problem is when you pay the *price* of distribution (latency, complexity, operational overhead) without getting the *benefit* (independent evolvability). That is a distributed monolith, and it is the worst of both worlds.

### 5.2 Axes of coupling

Coupling is not one thing; it is several things, and you can be loosely coupled on some axes and tightly coupled on others. The major axes are:

**Temporal coupling.** Does the caller have to wait for the callee? A synchronous HTTP POST is temporally coupled: if the callee is down, the call fails. An asynchronous message on a queue is temporally decoupled: the caller drops the message and moves on; the callee picks it up whenever.

**Format coupling.** Do the two sides have to agree on the exact wire format? If adding a new optional field breaks old consumers, you are format-coupled. Protobuf with proper discipline is loosely format-coupled. Hand-parsed JSON with strict schema validators is tightly format-coupled.

**Location coupling.** Does the caller need to know *where* the callee is? If you hardcode an IP address, you are tightly location-coupled. If you use DNS or a service registry, you are loosely location-coupled.

**Implementation coupling.** Does the caller need to know what technology the callee uses? If the caller can only work if the callee is a Java service running in the same JVM, you are tightly implementation-coupled. If the caller just sends bytes and the callee could be written in any language, you are loosely implementation-coupled.

**Process coupling.** Does one service's crash take the other down? If service A's out-of-memory error kills service B, you are process-coupled. Separate containers (with bulkheads) are the mitigation.

**Data coupling.** Do the services share a database? If yes, you are tightly data-coupled, because any schema change in the database requires a coordinated update. The fix is strict data ownership — each service owns its data and exposes it only through its API.

A well-designed service-oriented system loosens every one of these axes as far as it can without giving up the properties the business needs (latency, consistency, etc.). The art is in knowing which axis to loosen in which context.

### 5.3 The Tolerant Reader pattern

Formulated by Martin Fowler (*"Tolerant Reader"*, 2011), this pattern says: **when you read data from another service, read only what you need, and ignore what you don't.**

The anti-pattern is the rigid reader: you generate strict classes from a schema and fail if anything in the incoming payload doesn't match. This makes every additive change by the server a breaking change for the client.

The tolerant reader approach:

```python
# Bad — rigid reader
@dataclass
class PricingResponse:
    subtotal_minor: int
    tax_minor: int
    total_minor: int
    currency: str
    computed_at: datetime
    tax_rule_version: str

resp = PricingResponse(**response.json())  # fails if response has new fields

# Good — tolerant reader
payload = response.json()
subtotal = payload["subtotal_minor"]
total    = payload["total_minor"]
currency = payload.get("currency", "USD")
# We don't care about tax_rule_version, computed_at, or any other
# field. If they're there, fine. If they're not, fine. If new fields
# are added later, fine.
```

The tolerant reader treats the incoming payload as an untyped bag and reaches for the keys it needs, with sensible defaults. Consumers written this way are robust to every additive change the server makes.

### 5.4 Postel's Law

Jon Postel wrote, in the TCP specification (RFC 793, 1981):

> Be conservative in what you send, be liberal in what you accept.

This is now known as Postel's Law or the **Robustness Principle**, and it is the slogan version of the tolerant reader pattern. Apply it to:

- **JSON payloads.** Emit exactly-correct JSON with strict formatting, but accept variations in whitespace, field order, and unknown fields.
- **HTTP headers.** Emit only the headers you mean to emit, but accept any extra headers without error.
- **Protobuf messages.** Emit current-version messages, but accept (and ignore) unknown fields in incoming messages.
- **Enums.** Emit only known values, but accept unknown values and treat them as "other."

Postel's Law has its critics. Hammer-Lahav and others have argued that it produces a ratchet of accumulated bug-compatibility over time (e.g., browser HTML parsers, which have to accept every historically-valid variant of broken HTML). The criticism is fair, but the principle is still correct for service boundaries within a single company, where the "liberal in what you accept" side is constrained by agreed-on schemas.

### 5.5 Anti-patterns: what tight coupling looks like

Concrete examples of tight coupling in the wild:

**Shared database.** Two services read and write the same tables in the same database. When Team A adds a column, Team B's queries may break. When Team B needs to add a column, they have to coordinate with Team A. The database is, in effect, a shared private interface — the worst kind.

**Distributed transactions.** Two services coordinate writes using a two-phase commit protocol. Neither service can commit until the other is ready. If one crashes mid-protocol, the transaction hangs. XA/JTA distributed transactions were standard in enterprise Java for a decade, and they are a known-bad pattern in modern service architecture. The replacement is the Saga pattern (see §8).

**Tight API contracts.** Services use an IDL but with strict validation that rejects any unknown field. The moment the server adds a new field, all clients fail to parse responses.

**RPC-as-function-call.** Framework X (e.g., old EJB, old CORBA, even some modern gRPC usage) makes the network call look syntactically like a local call. Developers forget about latency, partial failure, and retries, and write code that falls apart under real network conditions.

**Chatty interfaces.** A workflow that requires 15 round-trips between two services to complete. Each round-trip is a coupling point: the sequence matters, the timing matters, the state between calls matters. The fix is usually a coarser-grained operation that packages the workflow into a single call.

**Shared data models.** Both services import the same package of data classes and pass instances of them around. When one side changes a class, the other side breaks at compile time. This works inside a monolith; it is a disaster across a service boundary.

**Synchronous fan-out.** Service A calls services B, C, D, and E, waiting for all of them. A's latency is now the sum (or max) of the slowest. A's availability is the *product* of theirs — if each is 99.9% up, A is 99.6% up. Fan-out multiplies failure.

### 5.6 The ideal: evolvable services

A loosely coupled service has these properties:

- You can deploy it any time, to any subset of instances, without coordinating with anyone.
- You can change its internal data model without consumers noticing.
- You can rename internal modules, rewrite in a different language, swap databases.
- Consumers can be written months or years later by teams who never talk to you — they just read the contract.
- If you go down, consumers degrade gracefully rather than failing hard.
- If the network partitions, consumers retry and eventually reconcile.

This is the engineering ideal. Most services fall short of it in some dimension. The ones that succeed tend to succeed because their teams treated loose coupling not as a slogan but as a discipline — enforced by code review, by contract tests, by chaos engineering, and by ruthless refusal to take shortcuts that would re-couple things.

---

## 6. Service Boundaries and Domain-Driven Design

### 6.1 Why DDD matters for SOA

Thomas Erl's eight principles tell you *what* a service should look like, but not *where to draw the boundaries*. That is the hardest problem in service-oriented design, and the answer came from a different book altogether: Eric Evans's *Domain-Driven Design: Tackling Complexity in the Heart of Software* (Addison-Wesley, 2003).

Evans did not set out to write about SOA. He was writing about object-oriented design in large enterprise systems, specifically about how to model business domains rigorously. But the conceptual vocabulary he invented — bounded contexts, ubiquitous language, aggregate roots, context maps — turned out to be exactly the right vocabulary for service decomposition.

When the microservices wave hit in 2011-2015, DDD became its organizing intellectual framework. Sam Newman's *Building Microservices* (O'Reilly, 2015, second edition 2021) leans heavily on DDD. Vaughn Vernon's *Implementing Domain-Driven Design* (Addison-Wesley, 2013) is a companion volume to Evans that explicitly covers service-oriented applications. The recipe "draw the service boundaries at the bounded contexts" is now the most widely repeated rule of thumb in the field.

### 6.2 The Ubiquitous Language

Evans starts with the observation that software fails when the business experts, the domain experts, and the developers are all speaking different languages about the same concepts. The business says "customer." The database says "party." The old code says "account holder." The new code says "user." Meetings are a translation exercise and everyone is subtly wrong.

The *ubiquitous language* is the rule: **pick one set of terms, in collaboration with domain experts, and use those terms consistently in code, in documentation, in conversations, in bug reports, and in database schemas.** The team should feel like business people when they discuss the code, and the business people should feel like they understand the code when they read the method names.

For service orientation, this matters because **the vocabulary of a service's contract should be the vocabulary of that service's domain.** If the Orders service exposes an `Order` entity and the Inventory service exposes a `StockItem` entity and the Shipping service exposes a `Shipment` entity, each of those words has a precise meaning inside that service's domain, and the contract should reflect it.

### 6.3 Bounded Contexts

Here is Evans's critical insight: **the same word means different things in different parts of the business.** A "customer" in the sales system is someone who might buy something. A "customer" in the billing system is someone with an invoice. A "customer" in the support system is someone who has filed a ticket. These are the same person, but they are three different concepts, with different fields, different lifecycles, different validation rules, and different owners.

The mistake of the 1990s data modeling era was to try to build "the canonical customer model" that all systems would share. This always failed. Every subsystem needed attributes the canonical model didn't have, or needed subsets of it, or interpreted the same fields differently. You ended up with a giant, hated Customer table with 200 columns, most of which were null for any given row.

Evans's answer: **the bounded context.** A bounded context is a scope within which a particular model is consistent and meaningful. Inside the Sales bounded context, "Customer" means one thing. Inside the Support bounded context, "Customer" means something else. These two Customers may be related by the same underlying person-in-the-world, but the *model* is different, and that's fine — they live in different bounded contexts.

The service-oriented translation: **draw your service boundaries at bounded context boundaries.** The Sales service owns the Sales bounded context. The Support service owns the Support bounded context. The Billing service owns the Billing bounded context. Inside each service, the model is coherent. Across service boundaries, the models translate to each other through explicit, contract-mediated exchanges.

### 6.4 Aggregates and aggregate roots

Within a bounded context, Evans introduced the concept of an **aggregate**: a cluster of related domain objects that must change together, with a single entry point called the aggregate root.

The classic example: an Order and its OrderLines. You cannot meaningfully update an OrderLine without also touching the Order (to recompute totals, invalidate caches, etc.). The Order is the aggregate root; the OrderLines are part of the aggregate. External code never reaches directly into OrderLines — it goes through the Order.

For service design, this matters because **the aggregate root is the natural unit of an API operation.** A well-designed endpoint exposes operations on aggregate roots, not on the inner pieces of an aggregate. `PUT /orders/123` is a fine operation. `PUT /orderlines/456` is usually a mistake — it bypasses the aggregate root and opens up consistency bugs.

### 6.5 Context maps

When you have multiple bounded contexts, you have multiple services, and those services need to talk to each other. Evans introduced the **context map** to describe the relationships between contexts. The relationships come in a small number of flavors:

- **Partnership.** Two teams coordinate closely; changes are negotiated and synchronized.
- **Shared kernel.** Two contexts share a small common model (and the teams must coordinate on changes to it).
- **Customer-supplier.** The downstream service is a customer of the upstream service; the upstream provides what the downstream needs.
- **Conformist.** The downstream just accepts whatever the upstream gives it — no translation, no complaints.
- **Anti-corruption layer (ACL).** The downstream wraps the upstream with a translation layer that protects its own model from the upstream's decisions.
- **Open host service.** The upstream publishes a well-known protocol that any downstream can speak.
- **Published language.** The upstream publishes a well-documented schema (JSON Schema, Protobuf, etc.) as a public artifact.
- **Separate ways.** The two contexts simply do not integrate; they live independent lives.
- **Big ball of mud.** (A descriptive category, not an aspirational one.) The contexts have grown together into an unmaintainable tangle.

Of these, the **anti-corruption layer** is the most practically important for service orientation. When you build a new service that has to integrate with a legacy monolith, you do NOT want the legacy system's ugly concepts leaking into your clean new design. You build an ACL: a layer inside your service whose only job is to translate the legacy's idioms into your new service's ubiquitous language. If the legacy system ever dies, you delete the ACL and your core model is untouched.

### 6.6 Strategic vs tactical DDD

DDD has a "strategic" layer (bounded contexts, context maps, ubiquitous language) and a "tactical" layer (entities, value objects, aggregates, repositories, domain events, domain services). For service orientation, the strategic layer is the one that matters most. You are drawing lines between services; those lines are bounded contexts.

The tactical layer matters *inside* a service. Once you have decided that the Orders service owns the Orders bounded context, you still need to implement it, and Evans's tactical patterns are good guidance for how to structure that implementation. But other teams don't care. The tactical model is private.

### 6.7 Event storming — the practical workshop

Alberto Brandolini's **Event Storming** (ca. 2013) is a workshop technique for discovering bounded contexts. You gather the business people and the engineers in a room (or a Miro board), and you walk through the business process by posting sticky notes of the form "X happened" in time order, left to right. Things like:

- "Customer placed order"
- "Inventory reserved"
- "Payment authorized"
- "Shipment booked"
- "Item shipped"
- "Delivery confirmed"

Then you cluster the events by topic, and — almost magically — the clusters fall into natural bounded contexts. The events that "belong together" are the events inside a context; the events that cross clusters are the points where services must talk to each other.

This is the fastest practical path from "we have a business idea" to "we have a candidate service decomposition." It is widely used in companies that take DDD seriously.

### 6.8 The relationship between DDD and microservices

Sam Newman's rule of thumb: **a microservice's boundary should not be smaller than a bounded context.** It can be equal to one (common case) or coarser (several contexts in one service, if they're small and the team is small). But going *below* the bounded context boundary — splitting a single bounded context across two services — is almost always a mistake. You end up with two services that must evolve in lockstep because they are modeling the same thing; all you have done is add network calls to what should have been in-process function calls.

This leads to the corollary: **if you cannot identify a bounded context, you cannot identify a service.** When teams struggle to draw microservice boundaries, it is often because they have not done the domain modeling work. They haven't figured out where the business concepts live. They can't name the services because they can't name the contexts. The fix is not to pick arbitrary boundaries and hope; it is to go do event storming.

---

## 7. Communication Patterns

### 7.1 Synchronous request-response

The simplest and most common communication pattern. The client calls the service, blocks until a response is returned, and acts on the result.

```
Client ─── request ───> Service
Client <── response ─── Service
```

Implementations: HTTP/REST, gRPC unary, SOAP, Thrift synchronous, CORBA synchronous invocations.

**Strengths:**
- Easy to reason about. The mental model is the function call.
- Errors come back immediately.
- Easy to test with simple tools (curl, Postman, gRPCurl).
- Backpressure is implicit — slow server means slow client.

**Weaknesses:**
- Temporal coupling. The server must be up when the client calls. If it's down, the call fails.
- Latency accumulation. If A calls B calls C calls D, the total latency is the sum. A slow link anywhere in the chain becomes a slow operation everywhere.
- Availability multiplication. If A depends on B (99.9%) and C (99.9%), A's availability is at most 99.8%. Dependency chains compound.
- Hard to fan out. If A needs to notify five services, it has to make five requests and deal with partial failures.

### 7.2 Asynchronous messaging

The client deposits a message in a queue or topic and continues its own work. The server picks up the message when it is ready and processes it. No blocking.

```
Client ── publish ──> [ Queue ] ── consume ──> Service
```

Implementations: RabbitMQ, ActiveMQ, Amazon SQS, Azure Service Bus, IBM MQ, Google Cloud Pub/Sub, NATS, Apache Kafka, Redis Streams.

**Strengths:**
- Temporal decoupling. The service can be down for hours; the queue holds messages until it comes back.
- Load leveling. A traffic spike fills the queue rather than killing the service. The service drains the queue at its own pace.
- Easier fan-out. Topics deliver a single published message to many subscribers.
- Natural retries. If the service fails to process a message, the broker redelivers it.

**Weaknesses:**
- Harder to reason about. There is no immediate response. How do you know the message was processed?
- More moving parts. You now operate a message broker, which is its own service with its own failure modes.
- Eventual consistency everywhere. The world is always a few messages behind.
- Ordering is tricky. Most brokers give you ordering *within a single partition/queue* but not globally.
- Idempotency becomes mandatory (see §9) because the broker will redeliver under failure.

### 7.3 Fire-and-forget (one-way)

A special case of async messaging: the client publishes a message and never cares what happens to it. No acknowledgment, no response.

Used for: telemetry, logs, non-critical events, "hint" messages like "user looked at product X."

```
Client ── publish ──> [ Sink ]
```

The consumer may drop the message, process it, batch it, or archive it. The producer is fully absolved. This is the cheapest possible communication pattern, and it is excellent for high-volume signals where losing a few messages is acceptable.

### 7.4 Request-reply with correlation IDs

Async messaging is fine for fire-and-forget, but sometimes you really do need an answer. The pattern for "ask a question asynchronously and get an answer back later" is **request-reply with correlation IDs.**

```
Client publishes:
  topic=work.requests
  message={request_id: "abc123", payload: ...}
  reply_to: "work.replies.myclient"

Server consumes work.requests, processes, publishes:
  topic=work.replies.myclient
  message={request_id: "abc123", result: ...}

Client consumes work.replies.myclient, matches by request_id.
```

The **request_id** (or correlation_id) is the stitching that connects request to response. It lets the client send 1000 requests in parallel and match each reply to the right waiting caller.

This pattern is used by every RPC-over-messaging system: JMS ReplyTo, AMQP reply queues, NATS request/reply, modern systems like Kafka with compacted reply topics.

### 7.5 Publish-subscribe

One publisher, many subscribers. Each subscriber sees every message (subject to its own subscription filter).

```
                 ┌── Subscriber A
Publisher ──> Topic ──── Subscriber B
                 └── Subscriber C
```

Examples: Kafka consumer groups where each group is a logical subscriber; NATS subjects; Redis pub/sub; MQTT topics; SNS fan-out.

Pub/sub is the natural pattern for **event-driven architecture** (EDA). The publisher emits a domain event ("OrderPlaced") without knowing or caring who consumes it. Subscribers can be added and removed without touching the publisher. This is maximum loose coupling on the temporal and process axes.

### 7.6 Point-to-point queue (competing consumers)

One queue, multiple consumer instances, each message delivered to exactly one consumer. This is the load-balancing pattern.

```
                           ┌── Consumer instance 1
Producer ──> [ Queue ] ────┼── Consumer instance 2
                           └── Consumer instance 3
```

The broker hands each message to whichever consumer grabs it first. You scale horizontally by adding more consumer instances. Messages are processed once (under normal conditions).

This is how SQS, RabbitMQ competing-consumer queues, and Kafka consumer groups (with single-partition caveat) all work.

### 7.7 Message brokers vs log-based streaming: the Kafka difference

Up through about 2011, the mental model of async messaging was the **broker** — a piece of infrastructure that holds messages temporarily, delivers them to consumers, and deletes them once delivered and acknowledged. RabbitMQ, ActiveMQ, and most commercial MQ products work this way.

Kafka (LinkedIn, 2011) introduced a different model: the **log**. A Kafka topic is a durable, replayable, ordered sequence of messages. Messages are not deleted when consumed; they are retained for a configured period (hours, days, weeks, or forever). Consumers track their own position (offset) in the log and can replay from any point.

The consequences are profound:

- **Replayability.** A new consumer can process the entire history of events from day one. A broker can only give you messages that haven't been consumed yet.
- **Multiple consumers read independently.** In Kafka, consumer group A and consumer group B each read the entire topic at their own pace. The topic is a log, not a queue.
- **Event sourcing becomes practical.** You can treat the log as the system of record and rebuild state by replaying it.
- **Stream processing becomes practical.** Tools like Kafka Streams, Flink, ksqlDB treat the log as a real-time SQL table.
- **Exactly-once semantics becomes tractable** (for Kafka-to-Kafka, with transactions).

Kafka is not a strict successor to traditional brokers — the traditional broker model is still correct for many use cases (work queues, temporary routing, load leveling). But the log model enabled a class of architectures (event streaming, event sourcing, log-based microservices) that were impractical before.

### 7.8 Synchronous/asynchronous trade-offs

| Property             | Synchronous        | Asynchronous        |
|----------------------|--------------------|--------------------|
| Latency              | As fast as the chain | Additional hop through broker |
| Coupling             | Temporal + format | Format (temporal decoupled) |
| Failure mode         | Immediate error   | Silent until followed up |
| Back-pressure        | Built in (blocking) | Explicit (queue depth) |
| Operational overhead | None extra        | Broker to run |
| Debuggability        | Easy (one call)   | Harder (correlate by ID) |
| Idempotency required | Only for retries  | Always |
| Scale strategy       | Horizontal replicas | Horizontal consumers |
| Order preservation   | Implicit in client | Per-partition only |
| Fan-out              | Multiple calls     | Single publish |
| Fan-in               | Natural           | Merge streams |

The heuristic: **use synchronous for queries (reads), asynchronous for commands (writes that trigger workflows).** Reads need an answer now and are idempotent. Commands often kick off multi-step processes where "fire and let the workflow run" is a better fit than "wait for the whole thing to finish."

---

## 8. Orchestration vs Choreography

### 8.1 The distinction

When a business process requires coordinating multiple services, there are two ways to manage the coordination:

**Orchestration.** A central coordinator tells each service what to do, in order. The coordinator is the conductor; the services are the musicians; the process is the score.

**Choreography.** Each service watches the world and reacts to events. When event E happens, service A does its thing, which produces event F, which triggers service B to do its thing. No conductor. The process emerges from the ruleset.

```
Orchestration:
  Coordinator → A (do X)
  Coordinator ← A (done)
  Coordinator → B (do Y)
  Coordinator ← B (done)
  Coordinator → C (do Z)

Choreography:
  Client event → A
  A event → B (observing)
  A event → C (observing)
  B event → D (observing)
  C event → D (observing)
```

Both patterns can implement the same business process. The difference is where the coordination logic lives.

### 8.2 Orchestration in detail

In orchestration, you write the process as a program (or a BPMN diagram, or a state machine, or a DAG) that explicitly calls each service and handles each response. Well-known orchestration tools:

- **BPEL (Business Process Execution Language, 2003).** XML-based workflow language from the WS-* era. Execution engines: Oracle BPEL Process Manager, IBM BPM, Apache ODE. Now largely dead outside legacy enterprise.
- **Apache Airflow (2014).** Python-based DAG orchestrator from Airbnb. Originally for data pipelines, now used broadly.
- **Temporal (2019).** Workflow-as-code orchestrator, fork of Uber's Cadence, founded by Maxim Fateev. Lets you write workflows as regular code (Go, Java, TypeScript, Python) and guarantees durability through a replay mechanism.
- **Camunda (BPMN).** Commercial BPMN engine, widely used in enterprise workflows.
- **AWS Step Functions.** Amazon's managed orchestrator, JSON-defined state machines, tightly integrated with Lambda and other AWS services.
- **Netflix Conductor.** Netflix's workflow engine, open-source.

A Temporal workflow, for example, looks like regular code:

```typescript
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { reserveInventory, chargePayment, bookShipment, sendEmail } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '1 minute',
    retry: { maximumAttempts: 3 },
  });

export async function placeOrderWorkflow(order: Order): Promise<void> {
  const reservation = await reserveInventory(order.items);
  try {
    const charge = await chargePayment(order.customer, order.total);
    try {
      const shipment = await bookShipment(order.address, reservation);
      await sendEmail(order.customer, 'Order confirmed', { shipment });
    } catch (err) {
      // Compensation: refund the charge
      await refundPayment(charge);
      throw err;
    }
  } catch (err) {
    await releaseInventory(reservation);
    throw err;
  }
}
```

The magic is that Temporal persists every decision point. If the process crashes after `chargePayment` but before `bookShipment`, it resumes from exactly where it left off when the worker restarts. The workflow is durable.

### 8.3 Choreography in detail

In choreography, there is no central coordinator. Services publish events and subscribe to events. The process emerges from the network of reactions.

```
OrderPlaced event → 
  Inventory service (reserves items) → InventoryReserved event →
    Payment service (charges) → PaymentCharged event →
      Shipping service (books) → ShipmentBooked event →
        Email service (sends confirmation)
```

Each service only knows about its own inputs and outputs. The Inventory service has no idea that a Shipping service exists. It just publishes InventoryReserved, and whoever cares can listen.

Choreography is the native pattern for event-driven architectures with Kafka, EventBridge, NATS JetStream, or any pub/sub backbone. It is deeply decentralized.

### 8.4 Trade-offs

**Orchestration advantages:**
- Central visibility. You can look at the orchestrator and see the state of every workflow.
- Easier debugging. The flow is explicit in one place.
- Explicit error handling. Compensations and retries live in the workflow code.
- Natural place to put business rules about "what to do if X fails."

**Orchestration disadvantages:**
- The orchestrator is a single point of coupling. Every service it talks to is known to it.
- Changes to the process require changing the orchestrator.
- The orchestrator can become a god object with too much logic.
- Scale limits — the orchestrator is on the critical path for every workflow instance.

**Choreography advantages:**
- Decentralized. Each service evolves independently; no central coordinator to coordinate with.
- New behaviors are added by subscribing to existing events — no changes to existing services.
- Natural fit for reactive, real-time systems.
- Scales horizontally by nature.

**Choreography disadvantages:**
- No single place to see the state of a workflow.
- Debugging is hard. "Why didn't the email get sent?" requires tracing through many services.
- Emergent behaviors can surprise you. You added a new subscriber and it breaks an unrelated workflow.
- Compensations (undoing partial work) are harder to express.
- You need excellent distributed tracing to understand what's happening.

### 8.5 The hybrid: orchestrating choreographies

The practical sweet spot is often a **hybrid**: choreography for most things, orchestration for the critical multi-step processes.

- Use events (choreography) for: notifications, analytics, search indexing, email triggers, cache invalidation, audit logs — anywhere "fire and forget" is OK.
- Use workflows (orchestration) for: checkout, onboarding, refund processing, account provisioning — anywhere you need to know the exact state of the process and have explicit compensations for failures.

This keeps the coupling costs low for the many, many side effects that don't need central coordination, while giving you the debuggability and explicit error handling for the handful of processes that do.

### 8.6 The Saga pattern

When a multi-step process crosses service boundaries, you cannot use a distributed transaction (XA/2PC) for the reasons we discussed earlier. Instead, you use a **Saga**: a sequence of local transactions, where if any step fails, the previous steps are *compensated* by explicit inverse operations.

Hector Garcia-Molina and Kenneth Salem introduced the concept in 1987 ("Sagas", SIGMOD '87). It is one of the oldest ideas in distributed databases. The microservices community rediscovered it around 2014-2015.

**Example:** the checkout process above has four steps:
1. Reserve inventory.
2. Charge payment.
3. Book shipment.
4. Send confirmation email.

If step 3 fails (the warehouse is out of stock, say), you need to undo steps 1 and 2. The compensations are:
- Release the inventory reservation (inverse of step 1).
- Refund the payment (inverse of step 2).

A Saga is the sequence of forward steps plus the sequence of compensations. You run forward until success or failure; on failure, you run the compensations in reverse order.

Sagas come in two flavors:

**Orchestrated sagas.** A workflow engine (Temporal, Camunda, Step Functions) runs the forward steps and, on error, invokes the compensating steps. This is the easier pattern — all the logic is in one place.

**Choreographed sagas.** Each service listens for events and acts on them. To compensate, services listen for failure events and run their inverse operations. This is harder to reason about because the logic is distributed.

**The key constraint** on a Saga is that compensations must be **idempotent** and must always succeed (eventually). You cannot have a Saga where the compensation itself might fail permanently. If it does, you need human intervention, and the Saga has to be parked in an error queue for an operator to resolve.

Sagas do not give you ACID isolation. Between step 1 (reserve inventory) and step 2 (charge payment), the world can see a state that is intermediate — the inventory is reserved but the customer hasn't paid yet. Consumers of the Saga must tolerate this. It is a weaker consistency model, but it is the only consistency model that scales across service boundaries.

---

## 9. Idempotency

### 9.1 Why it matters

**Idempotent** means: calling the operation twice has the same effect as calling it once.

In a distributed system, you *will* call operations twice, because:

- The network drops a response, and the client retries.
- A broker redelivers a message after a worker crash.
- A user clicks the "Submit" button twice on a flaky wifi.
- A load balancer reroutes an in-flight request to a new backend.
- A deployment restarts a worker mid-processing.

If your operation is not idempotent, every one of these scenarios causes duplicate side effects: the customer is charged twice, the order is placed twice, the email is sent twice, the warehouse ships twice. In a reliable system, all of these are unacceptable.

Idempotency is not a nice-to-have. **In any distributed system where at-least-once delivery is possible (i.e., all of them), every write operation must be idempotent, period.**

### 9.2 Naturally idempotent operations

Some operations are naturally idempotent:

- **Pure reads.** `GET /users/123` is idempotent; calling it twice returns the same data both times without changing anything.
- **Absolute setters.** `SET temperature = 72` is idempotent; running it twice leaves the temperature at 72.
- **Upserts by ID.** `INSERT OR REPLACE ... WHERE id = 42` is idempotent as long as the "value" you insert is the same both times.
- **Deletes.** `DELETE /users/123` is idempotent in the sense that after running it once, running it again has no effect. (There's a subtlety about 404 vs 204 on the second call, but the state is the same.)

Some operations are not naturally idempotent:

- **Relative updates.** `UPDATE accounts SET balance = balance + 100 WHERE id = 42` is NOT idempotent. Running it twice adds $200.
- **Inserts with auto-generated IDs.** `INSERT INTO orders (customer_id) VALUES (42) RETURNING id` creates a new row every time.
- **External side effects with no dedupe.** "Send email," "charge credit card," "ship package" are not idempotent unless you explicitly make them so.

### 9.3 Idempotency via idempotency keys

The standard pattern for making any operation idempotent is the **idempotency key**: a client-supplied unique ID attached to each write operation. The server remembers which keys it has seen and, on a repeated key, returns the cached result instead of repeating the side effect.

Stripe popularized this pattern with their `Idempotency-Key` HTTP header:

```
POST /v1/charges HTTP/1.1
Host: api.stripe.com
Idempotency-Key: 04f73a8d-d5c5-4fa0-83e2-31baac3c1f11
Authorization: Bearer sk_test_...
Content-Type: application/x-www-form-urlencoded

amount=2000&currency=usd&source=tok_visa
```

The rules:
- The client generates a UUID (or equivalent) for each logical operation.
- The server stores the request hash and the response for that key.
- A repeated request with the same key returns the same response — byte-for-byte — without re-running the side effect.
- The key's storage expires after some window (24 hours for Stripe).

This gives you **effectively-once** semantics on top of an at-least-once transport. If the client retries because it didn't get a response, the second call finds the key in the server's table and returns the cached response. The customer is charged only once.

### 9.4 HTTP idempotent methods

HTTP defines some methods as idempotent by specification:

- **GET** — idempotent. Should never have side effects.
- **HEAD** — idempotent. Like GET but only headers.
- **PUT** — idempotent. "Set the resource to exactly this state."
- **DELETE** — idempotent. "Make the resource not exist."
- **OPTIONS** — idempotent. Informational.
- **POST** — NOT idempotent. "Do something; create something new."
- **PATCH** — NOT idempotent by spec, though many PATCH operations are in practice.

The spec assumes that a well-behaved client can retry any idempotent method safely. Framework retry logic (HTTP clients, service meshes, load balancers) takes advantage of this: they'll retry a GET automatically, but not a POST.

This creates an incentive to use PUT instead of POST where possible, because it opens up retries. The pattern:

```
# Non-idempotent — bad for retry
POST /orders
{ "customer_id": 42, "items": [...] }
→ 201 Created, Location: /orders/98765

# Idempotent — client generates the ID
PUT /orders/client-generated-uuid
{ "customer_id": 42, "items": [...] }
→ 201 Created
```

The client generates a UUID for the new order and PUTs it. If the PUT fails, the client retries with the same UUID. The server handles this correctly: first call creates the order, second call is a no-op that returns the same 201.

### 9.5 At-most-once, at-least-once, exactly-once

These are the three possible delivery guarantees for any messaging system:

- **At-most-once.** Messages may be lost but never duplicated. Simplest to implement (fire and forget, no retries). Acceptable only for telemetry-style data where loss is fine.
- **At-least-once.** Messages may be duplicated but never lost. The broker keeps redelivering until the consumer acknowledges. This is the default for most production message systems.
- **Exactly-once.** Each message is processed exactly once — no loss, no duplication.

Exactly-once is the holy grail, and it is **impossible in the general case**. You cannot have exactly-once semantics across two independent systems in a way that is robust to all network failures. This is a fundamental result — sometimes called the two generals' problem.

What you *can* have is **effectively-once**: at-least-once delivery plus idempotent processing. The broker guarantees the message will arrive (maybe many times), and the consumer guarantees that processing a message multiple times has the same effect as processing it once. Combined, the observable effect is exactly-once.

Kafka has a concept of "exactly-once semantics" (EOS) that is real but scoped: it holds for Kafka-to-Kafka transactions, where the producer is writing to one topic and the consumer is reading from another and committing its offset atomically. It does not extend to arbitrary external side effects. If your consumer sends an email or calls an external API, EOS does not help you; you still need idempotency.

### 9.6 Inbox and outbox patterns

Two related patterns for implementing idempotency in event-driven systems.

**Outbox pattern.** When your service wants to publish an event as a side effect of a database write, do not publish the event directly from your code. Instead, write the event to an `outbox` table in the same database transaction as the main change. A separate process reads the outbox and publishes events to the broker. On publish success, it marks the outbox row as "published."

```sql
BEGIN;
INSERT INTO orders (id, customer_id, total) VALUES (?, ?, ?);
INSERT INTO outbox (id, topic, payload)
  VALUES (uuid(), 'orders.placed', ?);
COMMIT;
```

The separate publisher process:

```python
while True:
    rows = db.query("""
        SELECT id, topic, payload FROM outbox
        WHERE published_at IS NULL
        ORDER BY id LIMIT 100
    """)
    for row in rows:
        broker.publish(row.topic, row.payload)
        db.execute("""
            UPDATE outbox SET published_at = now() WHERE id = ?
        """, row.id)
```

Why? Because a direct "write to database, then publish event" sequence can fail between the two steps: you write the order, crash, and never publish the event. Now the outside world never knows about the order. The outbox guarantees that if the write committed, the event will eventually be published.

**Inbox pattern.** The mirror image: when your service receives a message, write it to an `inbox` table with the message ID, then process it. Before processing a new message, check the inbox: if you've already seen this message ID, skip it. The inbox table gives you idempotent processing of redelivered messages.

```python
def handle_message(msg):
    with db.transaction():
        # Idempotency check
        if db.execute("SELECT 1 FROM inbox WHERE msg_id = ?", msg.id).fetchone():
            return  # already processed
        # Do the work
        process(msg)
        # Record that we processed it
        db.execute("INSERT INTO inbox (msg_id) VALUES (?)", msg.id)
```

Together, inbox and outbox give you end-to-end reliable messaging with idempotency, even when the broker is at-least-once and external systems are flaky.

---

## 10. Eventual Consistency and CAP

### 10.1 The CAP theorem

Eric Brewer conjectured in 2000 (at the ACM Principles of Distributed Computing symposium) that a distributed data store can provide at most two of the following three guarantees at the same time:

- **Consistency (C).** Every read receives the most recent write or an error.
- **Availability (A).** Every request receives a non-error response.
- **Partition tolerance (P).** The system continues to operate despite arbitrary message loss between nodes.

Seth Gilbert and Nancy Lynch proved this formally in 2002 ("Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-tolerant Web Services," ACM SIGACT News).

The theorem is often summarized as "pick any two of three," but that phrasing is misleading. The real statement is: **in the presence of a network partition, you must choose between consistency and availability.** When there is no partition, you can have both. But network partitions happen, and when they do, you must decide.

- **CP system.** Prioritizes consistency. When a partition happens, the system may refuse to serve requests (becomes unavailable) rather than risk returning stale data. Examples: HBase, etcd, Zookeeper, most relational databases in strict modes, MongoDB with majority writes.
- **AP system.** Prioritizes availability. When a partition happens, the system keeps serving requests on both sides of the partition, and reconciles later. Examples: Cassandra, DynamoDB (default), Riak, most eventually-consistent stores.

Not "CA" systems — CA systems exist only in an idealized world without network partitions, which is not the world we live in. If someone tells you their database is "CA," they mean "I am ignoring partitions," which usually means "I don't understand my failure modes."

### 10.2 ACID vs BASE

Relational databases have traditionally offered **ACID** guarantees:

- **Atomicity.** A transaction is all-or-nothing. Either everything commits or nothing does.
- **Consistency.** A transaction takes the database from one valid state to another valid state.
- **Isolation.** Concurrent transactions do not see each other's intermediate states.
- **Durability.** Once committed, a transaction survives crashes.

ACID is expensive. You pay for it in the form of locks, coordination protocols, and limited availability during partitions. Scaling ACID across many nodes is one of the hardest problems in distributed systems.

The alternative framework for eventually-consistent distributed stores is **BASE**:

- **Basically Available.** The system is available most of the time; reads may return stale data, but they return something.
- **Soft state.** State may change over time, even without new input, as the system converges.
- **Eventual consistency.** If no new updates are made, the system will eventually reach a consistent state.

BASE was coined by Dan Pritchett at eBay in the mid-2000s. The tradeoff: BASE systems can be fast, cheap, and highly available at the cost of "reading reality as it was a few seconds ago" most of the time.

Service-oriented systems, which span many databases, inevitably live in the BASE world at the cross-service layer, even if each individual service is internally ACID.

### 10.3 PACELC

Daniel Abadi pointed out (2010) that CAP is incomplete because it only talks about behavior during partitions. In normal operation, there is also a tradeoff between **latency** and **consistency**:

> **If there is a Partition (P), how does the system trade off between Availability (A) and Consistency (C)? Else (E), when the system is running normally, how does it trade off between Latency (L) and Consistency (C)?**

This is **PACELC**. The full characterization of a distributed store is something like "PA/EL" (during partition, prioritize availability; otherwise, prioritize latency) or "PC/EC" (during partition, prioritize consistency; otherwise, prioritize consistency).

- **PA/EL systems:** Cassandra, DynamoDB, Riak. Fast reads, eventually consistent.
- **PC/EC systems:** Spanner, HBase. Strong consistency, slower reads.
- **PA/EC systems:** MongoDB (in some configurations). Available under partition but strict when things are normal.

PACELC is the more complete framework and you should use it when characterizing real systems.

### 10.4 Consistency models

"Consistency" is not a single thing. There is a hierarchy of consistency models, from strongest to weakest:

- **Linearizability (strict serializability).** Every operation appears to happen at a single instant, in the global real-time order. This is the strongest model; it is what you want for financial transactions and coordination primitives.
- **Serializability.** Transactions can be ordered into some equivalent serial execution, but not necessarily matching real-time order.
- **Sequential consistency.** All operations are seen in the same order by all observers, though that order may not match real time.
- **Causal consistency.** If operation A causes operation B, all observers see A before B. Unrelated operations may be seen in different orders.
- **Read-your-writes consistency.** After you write something, you can read it immediately. (You see your own writes, but others may not yet.)
- **Monotonic read consistency.** Once you've seen a value, you will not see an older value on subsequent reads.
- **Eventual consistency.** If writes stop, reads will eventually converge. No time bound.

Pick the weakest model that gives you what you need, because weaker models are cheaper to implement and more available. Strict linearizability is rarely necessary at the service boundary; causal or read-your-writes is usually enough.

### 10.5 CRDTs — conflict-free replicated data types

A CRDT is a data structure designed for eventually-consistent replication. The key property: **any two replicas that have seen the same set of updates (in any order) converge to the same state, without coordination.**

The classic examples:

- **G-Counter (grow-only counter).** Each node has its own counter. Increment only. The total value is the sum of all node counters. Two nodes that see the same increments arrive at the same total.
- **PN-Counter (positive-negative counter).** Two G-Counters, one for increments and one for decrements. Value is the difference.
- **G-Set (grow-only set).** Add only, never remove. Union wins.
- **OR-Set (observed-remove set).** Add and remove, with tombstones. Deletes only remove elements that were seen to be added.
- **LWW-Register (last-write-wins register).** Each write has a timestamp; latest wins. Simple but can lose writes.
- **MV-Register (multi-value register).** Keeps all concurrent values; lets the application resolve.

CRDTs are used in Redis CRDB, Riak, Azure Cosmos DB, Yjs (the CRDT library behind many collaborative editors), Automerge (used by local-first software), and various peer-to-peer systems.

For service orientation, the relevant lesson is: if you have state that needs to be shared across services or replicas, and you can accept eventual consistency, CRDTs let you do it without coordination. They are the mathematically clean way to build AP systems.

### 10.6 Vector clocks and version vectors

To reason about causality in a distributed system, you need a clock that isn't a wall-clock. **Vector clocks** (Mattern 1988, Fidge 1988) give each node its own integer counter; a vector clock is the tuple of all node counters seen so far. When node A sends a message, it includes its vector clock. When B receives, B merges A's vector with its own by taking the max of each component, then increments its own.

```
Node A: [A=1, B=0, C=0]  writes X, sends to B
Node B: [A=1, B=1, C=0]  receives, writes Y
Node C: [A=0, B=0, C=1]  writes Z

Now we can compare:
  A's write happened "before" B's write (A=1 ≤ A=1, B=0 < B=1).
  A's write and C's write are "concurrent" (A=1 > A=0 and C=0 < C=1).
```

Version vectors are the same idea used for replica reconciliation. They let you tell "this write is a successor of that write" vs "these are concurrent writes that need merging."

Services that implement replication or multi-master writes use vector clocks or their cousins (Lamport clocks, hybrid logical clocks, dotted version vectors) under the hood. Dynamo, Riak, and Voldemort all used vector clocks explicitly. Modern systems often use hybrid logical clocks (HLCs), which combine physical time with logical time for better usability.

---

## 11. Service Discovery

### 11.1 The problem

You have 500 services in your system. Service A wants to call service B. How does A know where B is?

The naive answer — "hardcode B's IP address in A's configuration" — works until one of the following happens:

- B moves to a new host.
- B scales from 3 replicas to 30, and now there are 30 IPs.
- A B instance crashes, and the IP A has memorized now points at a dead box.
- You deploy a new version of B to a new host and have to cut over.

The general answer is **service discovery**: a mechanism by which a caller finds the current set of healthy endpoints for a service.

### 11.2 Client-side discovery

In client-side discovery, the calling service consults a registry, gets back a list of instances, and picks one (possibly via a load-balancing algorithm).

```
Client ──query──> Registry
Client <─list──── Registry
Client ──request──> Instance (picked from list)
```

Examples:
- **Netflix Eureka** + Netflix Ribbon (client-side load balancer) — the reference client-side discovery stack from ~2012.
- **Consul** with a client library — Consul has a DNS and HTTP interface; applications can query it directly.
- **gRPC** with its built-in load balancer — the client watches a service resolver and load-balances across endpoints itself.

Advantages: the client picks the backend, so it can use sophisticated strategies (latency-aware, zone-affinity, sticky sessions). No extra network hop through a load balancer.

Disadvantages: every client needs a library. Changes to the load-balancing strategy require updating every client. Non-native-language clients are harder.

### 11.3 Server-side discovery

In server-side discovery, the client makes a request to a well-known endpoint (a load balancer or proxy), which itself looks up the real backends and routes the request.

```
Client ──request──> LB ──> Instance
                    LB consults registry internally
```

Examples:
- **AWS ELB / NLB / ALB** — Amazon's load balancers.
- **Kubernetes Services** — the Service abstraction in Kubernetes is a stable virtual IP that kube-proxy (or an eBPF-based alternative) routes to current pod IPs. This is server-side discovery built into the platform.
- **HAProxy, Envoy, nginx** — layer-7 proxies that can be configured to watch a registry and route accordingly.
- **Istio / Linkerd / Cilium** — service meshes that put a sidecar proxy next to each service, giving you server-side discovery with per-service routing rules.

Advantages: clients are dumb (they just hit one endpoint). Uniform observability at the proxy layer. Routing logic is centralized.

Disadvantages: the extra hop adds latency. The load balancer is another system to operate and monitor.

### 11.4 Registry-based discovery

The registry is the source of truth about which services exist and where their instances are. Examples:

- **Zookeeper.** Apache Zookeeper, an older coordination service used for discovery, config, and leader election. Famous for running HBase, Kafka, and early Hadoop.
- **etcd.** A distributed key-value store with strong consistency (Raft), used as the backing store for Kubernetes. Services register themselves by writing keys with TTLs.
- **Consul.** HashiCorp's service registry + health checker + K/V store. Built-in DNS interface is one of its selling points.
- **Eureka.** Netflix's registry, optimized for AP (high availability during partitions) rather than CP. Used in many Spring Cloud deployments.

The pattern is:
1. At startup, a service instance registers itself with the registry ("I am instance 7 of service billing, my address is 10.0.3.42:8080, heartbeat every 30 seconds").
2. Other services query the registry to find the current instances.
3. The registry runs health checks (or uses heartbeats) and removes instances that fail.

### 11.5 DNS-based discovery

DNS is the original service discovery protocol. Use an A record to map a name to an IP, use an SRV record to map a name to host+port+priority+weight.

```
_grpc._tcp.billing.example.com. 60 IN SRV 0 5 8080 billing-0.example.com.
_grpc._tcp.billing.example.com. 60 IN SRV 0 5 8080 billing-1.example.com.
_grpc._tcp.billing.example.com. 60 IN SRV 0 5 8080 billing-2.example.com.
```

DNS works because it's universal, cachable, and battle-tested. Every language has a DNS client. The limitations are that DNS TTLs are coarse (you can't rotate instances every second) and classic DNS has no health-check integration (a dead instance stays in the record until the TTL expires).

Kubernetes solves this with its own DNS (CoreDNS), which is backed by the cluster's real-time state and uses short TTLs. Inside a Kubernetes cluster, `http://billing/` just works — CoreDNS resolves "billing" to the current set of pod IPs, and kube-proxy load-balances across them.

### 11.6 Health checks and dead service detection

Discovery only works if the registry knows which instances are alive. Two models:

- **Active health checks.** The registry (or load balancer) periodically hits a health endpoint on each instance (usually `GET /healthz`). If the check fails for N consecutive rounds, the instance is removed.
- **Heartbeats.** Each instance periodically sends a "I'm alive" ping to the registry. If no heartbeat is received within a TTL, the instance is considered dead.

Health endpoints should distinguish between:
- **Liveness.** Is the process running and responsive? (If no, restart it.)
- **Readiness.** Is the process ready to serve traffic? (If no, take it out of the load balancer but don't restart.)
- **Startup.** Is the process still starting up? (Useful for slow-starting apps.)

Kubernetes has separate `livenessProbe`, `readinessProbe`, and `startupProbe` for exactly this reason. Getting this distinction wrong is a common operational footgun: if your liveness probe is too strict, any slow request becomes a restart cascade.

---

## 12. Fault Tolerance Patterns

### 12.1 The core insight

In a distributed system, **everything fails, all the time.** The question is not "how do I prevent failures" — you cannot. The question is "how do I ensure that when component X fails, the rest of the system degrades gracefully instead of cascading into a global outage."

The fault tolerance patterns below are tools in the toolbox for achieving that graceful degradation.

### 12.2 The Circuit Breaker

Michael Nygard introduced the Circuit Breaker pattern in *Release It!: Design and Deploy Production-Ready Software* (Pragmatic Bookshelf, 2007, second edition 2018). It is modeled on the electrical circuit breaker.

**The problem:** Service A calls service B. B is failing — every call times out after 5 seconds. A keeps calling B on every new request, every one times out, A's thread pool fills up with waiting threads, A becomes unresponsive itself, A's callers start timing out, the outage cascades.

**The fix:** wrap the call to B in a circuit breaker. The breaker has three states:

- **Closed.** Normal state. Calls pass through to B. The breaker counts recent failures.
- **Open.** If the failure count crosses a threshold, the breaker trips. Calls to B fail *immediately* (without waiting or sending a request). A can degrade gracefully instead of hanging.
- **Half-open.** After a cooldown period, the breaker lets a single call through to B. If it succeeds, the breaker closes. If it fails, the breaker goes back to open.

```
         failure_count > threshold
  CLOSED ────────────────────────> OPEN
     ▲                                │
     │                        cooldown elapsed
     │                                │
     │       success                  ▼
     └──────────────────────── HALF-OPEN
                                      │
                              failure ▼
                                    OPEN
```

The value of the circuit breaker is not just that it prevents A from hanging. It is that it **propagates the failure signal**: A's callers see the failure immediately instead of waiting, and they can decide how to react.

Implementations: Hystrix (Netflix, now retired), Resilience4j (the modern Java choice), polly (.NET), Failsafe, built-in support in Envoy/Istio at the proxy level.

A typical configuration:
- Failure threshold: 50% over a rolling window of 20 requests.
- Timeout: 2 seconds.
- Cooldown: 30 seconds.
- Minimum requests before tripping: 10.

### 12.3 The Bulkhead

Also from Nygard's *Release It!*. The name comes from ship construction: ships have bulkheads that divide the hull into watertight compartments, so a breach in one compartment doesn't sink the ship.

**The problem:** Service A has a pool of 100 threads for handling requests. Service A calls services B, C, and D. If B becomes slow, requests that happen to need B pile up, consuming all 100 threads. Now requests to C and D can't get handled either, because there are no threads. B's slowness has "sunk the ship."

**The fix:** partition A's resources. Give B its own pool of 20 threads, C its own pool of 20, and D its own pool of 20. If B becomes slow, only B's pool fills up. The other 60 threads keep serving C and D. The damage is contained.

Bulkheads can be applied to:
- Thread pools (one pool per downstream dependency).
- Connection pools (one pool per downstream service).
- Semaphores (limit the number of concurrent calls per dependency).
- Container resource limits (so one misbehaving service can't starve its neighbors).
- Kubernetes pods and namespaces.

Hystrix had bulkheads built in. Istio supports bulkheads via connection pool settings on destinations.

### 12.4 Timeouts

Every network call must have a timeout. A call with no timeout is a call that may block forever, and in a distributed system that is the fastest way to turn a local failure into a global one.

**Rules of thumb:**
- Client-side timeouts should be *tighter* than server-side timeouts. If the server will take at most 30 seconds, the client should give up at 25, so the server doesn't waste work on a client who's already left.
- Timeouts should be set from the end-user's perspective. If the user experience goal is "load in under 2 seconds," and your call chain is A→B→C, each link needs a budget significantly smaller than 2 seconds.
- "Deadlines" (absolute time budgets) are better than "timeouts" (relative time budgets) for multi-hop calls. A gRPC client can set a deadline, and every downstream in the call chain inherits the remaining budget; when the budget is exhausted, everyone stops immediately instead of each link adding its own timeout.

### 12.5 Retries and exponential backoff with jitter

When a call fails transiently, the simple thing to do is retry. But naive retries are dangerous: if every client retries immediately after a failure, the thundering herd can take down a recovering service before it has a chance to stabilize.

The fix is **exponential backoff with jitter**:

```python
def retry_with_backoff(call, max_attempts=5, base_ms=100, max_ms=10_000):
    for attempt in range(max_attempts):
        try:
            return call()
        except TransientError:
            if attempt == max_attempts - 1:
                raise
            delay = min(max_ms, base_ms * 2 ** attempt)
            delay_with_jitter = random.uniform(0, delay)
            time.sleep(delay_with_jitter / 1000)
```

Retry attempt 1 waits 0-100ms. Attempt 2 waits 0-200ms. Attempt 3 waits 0-400ms. Etc. The randomness (jitter) prevents all clients from retrying at the same instant.

Marc Brooker at AWS has written extensively on why **full jitter** (random between 0 and the current backoff ceiling) is better than the traditional "backoff + jitter" approach where jitter is a small perturbation. The full jitter strategy maximally de-correlates retries and empirically gives the best recovery characteristics.

### 12.6 Retry budgets

Retries are dangerous in another way: if service A retries a failing call to B, it has *amplified* the load on B by a factor of the retry count. If A normally sends 1000 req/s to B, and every one fails, and A retries 3 times, A is now sending 4000 req/s to an already-failing B. This is called a **retry storm** and it has taken down production systems many times.

The fix is a **retry budget**: a per-client limit on the total volume of retries, expressed as a fraction of the base traffic. For example, "retries may be at most 10% of total calls." Under this rule, even in a total-failure scenario, the retry-amplified load is only 110% of baseline, not 400%.

Google's gRPC supports retry budgets at the LB level. Istio supports them via policy. Netflix's Hystrix enforced them via thread pool limits.

### 12.7 Graceful degradation

When a dependency fails, you have a choice: fail your own request or return something less-good. "Something less-good" is **graceful degradation**, and it is often the right move.

Examples of graceful degradation:
- The recommendations service is down; show a default list of popular items instead.
- The personalization service is down; show unpersonalized content.
- The fraud-check service is down; allow transactions under $100 automatically and queue larger ones for offline review.
- The avatar service is down; show a generic placeholder avatar.
- The currency-exchange service is down; show prices in USD only.

Graceful degradation requires you to **decide in advance** what "less-good" looks like and make sure your code handles it. This is design work, not an afterthought. The services that survive outages are the ones where every call to a dependency has a documented degradation mode.

### 12.8 Chaos engineering

If you want to know whether your system degrades gracefully, you have to test it under failure. The traditional approach — "run a load test in staging" — does not catch most interesting failure modes, because staging is not production and load tests do not include network partitions, clock skew, zombie processes, or Byzantine failures.

**Chaos engineering** is the practice of deliberately injecting failures into production systems to verify that they handle them gracefully. Netflix invented it around 2011 with the **Chaos Monkey**, a tool that randomly terminated instances in production. The idea was: if we do this every day, we'll notice when something is fragile, because it'll break. If we don't do it, we'll find out during a real outage.

Netflix followed up with the **Simian Army**: Chaos Monkey (kill instances), Latency Monkey (inject latency), Chaos Gorilla (kill an entire availability zone), Chaos Kong (kill an entire region), Conformity Monkey (find non-compliant resources), Doctor Monkey (health checks), Janitor Monkey (cleanup), Security Monkey.

The discipline was formalized in *Chaos Engineering* (Casey Rosenthal & Nora Jones, O'Reilly, 2020). The canonical definition is at principlesofchaos.org: **"the discipline of experimenting on a distributed system in order to build confidence in the system's capability to withstand turbulent conditions in production."**

Modern tools: Chaos Mesh, LitmusChaos, Gremlin, AWS Fault Injection Service (FIS). The key shift: from "fail in staging" to "fail in production, on small blast radius, with rollback ready."

---

## 13. Observability — The Three Pillars

### 13.1 Monitoring vs observability

"Monitoring" is what you do to watch systems for known problems. You pre-define the questions and build dashboards that answer them. "CPU usage is too high" is a known problem; you build a CPU dashboard; an alert fires when it crosses 80%.

"Observability" is what you need when you don't know what the question is going to be yet. In a microservices system, the failure modes are emergent: new failures happen that nobody predicted. Your system has to be instrumented well enough that, when something unexpected breaks, you can ask arbitrary questions of the data after the fact and get answers.

**Charity Majors** (Honeycomb) has been the loudest voice articulating this distinction. Her claim: observability is a property of your system, not a tool. A system is observable if you can infer its internal state from its outputs, no matter what question you ask. Prebuilt dashboards are the opposite of observability — they lock you into the questions you already thought of.

The three pillars of observability are: **logs, metrics, and traces.** They are not a complete list — high-cardinality structured events are the fourth thing most observability folks think they need — but they are the conventional taxonomy.

### 13.2 Logs

Logs are time-stamped records of discrete events. "User X logged in at time T." "Request Y failed with error Z." Classical logging produces lines of text in a file; modern logging produces structured records (JSON or similar) that can be indexed and queried.

**Characteristics:**
- High-cardinality, high-detail.
- Good for "what happened to this specific request" questions.
- Bad for "what's the average of X over all requests" questions.
- Expensive to store if volume is high.

**Modern tooling:**
- **ELK stack** (Elasticsearch, Logstash, Kibana). The grandfather of modern log aggregation.
- **Grafana Loki.** Prometheus-style log aggregation, indexed by labels rather than full-text.
- **Splunk.** The commercial giant; expensive but powerful.
- **Datadog Logs.** SaaS aggregation tightly integrated with metrics and traces.
- **Chronicle, Humio (now CrowdStrike Falcon LogScale).** High-volume log analytics.

A well-formed log line in a modern service is structured:

```json
{
  "timestamp": "2026-04-09T12:34:56.789Z",
  "level": "ERROR",
  "service": "pricing",
  "version": "v2.3.1",
  "instance_id": "pricing-7d4f6b9c-x2f9m",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "request_id": "req_abc123",
  "user_id": "user_42",
  "message": "tax engine timeout",
  "tax_region": "US-WA",
  "elapsed_ms": 2013,
  "error": {
    "type": "Timeout",
    "message": "deadline exceeded",
    "stacktrace": "..."
  }
}
```

Every field is a facet you can query. The trace_id ties this log to distributed traces. The request_id ties it to the user's HTTP request. The level, service, and version identify the source. This is the difference between "grep the logs" and actual observability.

### 13.3 Metrics

Metrics are time-series data: numbers that change over time. "Number of requests per second." "99th percentile response time." "Error rate." "CPU utilization."

**Characteristics:**
- Low cardinality, high aggregation.
- Good for dashboards, alerting, capacity planning.
- Bad for "what happened to request X" — metrics are aggregates, they forget individual events.
- Cheap to store because they are aggregated into buckets.

**Modern tooling:**
- **Prometheus.** Open-source, pull-based, time-series database with its own query language (PromQL). The de facto standard in the Kubernetes world.
- **Datadog.** SaaS, push-based, with rich tagging.
- **New Relic.** SaaS, APM-focused.
- **Graphite.** Older open-source, still in use.
- **InfluxDB.** Open-source time-series DB, once a Prometheus rival.
- **Grafana.** Not a metrics store, but the dominant dashboard/visualization tool across all of the above.

Prometheus-style metrics look like:

```
# HELP http_requests_total Total HTTP requests.
# TYPE http_requests_total counter
http_requests_total{service="pricing",method="POST",route="/v1/totals",status="200"} 125643
http_requests_total{service="pricing",method="POST",route="/v1/totals",status="500"} 42

# HELP http_request_duration_seconds HTTP request latency.
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{service="pricing",route="/v1/totals",le="0.1"} 98421
http_request_duration_seconds_bucket{service="pricing",route="/v1/totals",le="0.5"} 122336
http_request_duration_seconds_bucket{service="pricing",route="/v1/totals",le="1.0"} 125043
http_request_duration_seconds_bucket{service="pricing",route="/v1/totals",le="+Inf"} 125685
```

The **label** system (`service=`, `method=`, `route=`, `status=`) is what lets you slice and aggregate. The **histogram** buckets are what let you compute percentiles — p50, p90, p99, p999 — which are the only latency numbers that matter in user-facing systems.

A critical observation: **averages lie.** Average latency of 100ms is meaningless if p99 is 5 seconds, because the users with 5-second latency are screaming on Twitter. Always look at the tail.

### 13.4 Traces

A **trace** is the recorded path of a single request through a distributed system. A trace is composed of **spans**; each span represents one unit of work (a function call, an RPC, a database query). Spans have parents, forming a tree.

```
trace_id=abc (total 450ms)
├── span: "POST /checkout" (450ms)
│   ├── span: "validate cart" (15ms)
│   ├── span: "compute total" (120ms)
│   │   ├── span: "HTTP POST pricing-service" (115ms)
│   │   │   ├── span: "pricing: load tax rules" (30ms)
│   │   │   │   └── span: "SELECT FROM tax_rules" (28ms)
│   │   │   └── span: "pricing: compute" (80ms)
│   ├── span: "reserve inventory" (90ms)
│   │   └── span: "HTTP POST inventory-service" (85ms)
│   ├── span: "charge payment" (200ms)
│   │   └── span: "HTTP POST stripe" (195ms)
│   └── span: "send confirmation" (15ms) [async]
```

A trace tells you:
- How long did this request take?
- Which service was the slowest?
- Where in the call graph was the latency?
- Which calls fanned out in parallel vs sequentially?
- Which span failed, and what was its error?

Distributed tracing is the single most valuable observability tool for microservices systems because it is the only one that shows you the **cross-service** picture. Logs and metrics are per-service by default.

### 13.5 The OpenTelemetry merger

For years, there were two competing open-source tracing standards: **OpenCensus** (Google's) and **OpenTracing** (Cloud Native Computing Foundation). Both had client libraries, both had wire formats, neither had won. This was bad for the ecosystem.

In May 2019, the two projects merged into **OpenTelemetry** under the CNCF. OpenTelemetry is now the canonical standard for collecting telemetry from services: traces, metrics, and logs. It has SDKs for every major language, a common data model, and a collector that can export to any backend (Jaeger, Zipkin, Datadog, Grafana Tempo, Honeycomb, etc.).

Choosing OpenTelemetry means you are not locked into a single vendor's telemetry format. You instrument your code once, and you can change backends later without re-instrumenting.

### 13.6 Correlation IDs and trace propagation

For a trace to span multiple services, the trace context must travel with the request. This is **context propagation**.

The **W3C Trace Context** specification (May 2020) standardized the HTTP headers used for trace propagation:

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
tracestate: rojo=00f067aa0ba902b7,congo=t61rcWkgMzE
```

The `traceparent` header has:
- Version (`00`).
- Trace ID (128-bit).
- Parent span ID (64-bit).
- Trace flags (sampled / not sampled).

Every service in the chain reads this header, uses it to identify the trace and parent span, and creates its own child span under the parent. When it calls a downstream service, it writes a new `traceparent` with its own span as parent.

Before W3C Trace Context, every tracing system had its own headers (`X-B3-TraceId` for Zipkin, `uber-trace-id` for Jaeger, etc.) and they weren't compatible. The W3C standard ended the fragmentation.

### 13.7 SLI / SLO / SLA — the terminology

From the Google SRE book (*Site Reliability Engineering*, O'Reilly, 2016):

- **SLI — Service Level Indicator.** A quantitative measure of some aspect of the service. Examples: request success rate, latency at p99, availability, durability.
- **SLO — Service Level Objective.** A target value or range for an SLI. "Request success rate must be >99.9%." "p99 latency must be <500ms." SLOs are the thing you commit to internally.
- **SLA — Service Level Agreement.** A contract with a customer that promises certain SLOs, usually with financial consequences for violation. "If availability drops below 99.5%, we refund 10% of the month's bill."

The SLO is more important than the SLA, despite the SLA having the contractual weight. SLOs are what engineering teams use day-to-day to make decisions. A team with good SLOs has a shared target for reliability and can trade off feature velocity against reliability in a principled way (via error budgets).

An **error budget** is the inverse of the SLO. If your SLO is 99.9% availability, your error budget is 0.1% — about 43 minutes per month. If you've used 30 minutes of error budget this month, you have 13 minutes left. When the budget is full, you ship features aggressively; when the budget is empty, you slow down and invest in reliability. This is how SRE organizations balance feature work against reliability work without ideology.

### 13.8 Charity Majors on observability as a discipline

Charity Majors, CTO of Honeycomb and one of the most influential voices in modern observability, has argued that "observability" should not be confused with "monitoring + traces + logs." Her position:

> Observability is the ability to ask arbitrary questions of your system's behavior without needing to know in advance what you'd want to ask.

Her practical recommendations:
- **High-cardinality, high-dimensionality events.** Don't store aggregates; store individual events with every dimension you might care about (user ID, feature flag state, build hash, region, upstream service, etc.). Aggregate at query time.
- **Wide events.** A single record per request that includes everything. Better than a forest of narrow logs and detached metrics.
- **Query-time everything.** Don't pre-build dashboards; build query tools that let you slice any way.
- **Testing in production.** Use observability to verify that your production system is doing what you think it's doing. Don't rely on staging.

This is a more radical view than "logs + metrics + traces," but it has been deeply influential in the modern observability movement. Honeycomb, Lightstep (now ServiceNow Cloud Observability), and New Relic's newer products are all moving toward this model.

---

## 14. Distributed Tracing — A Deeper Look

### 14.1 The Dapper paper

The foundational paper for modern distributed tracing is Google's **"Dapper, a Large-Scale Distributed Systems Tracing Infrastructure"** by Sigelman, Barroso, Burrows, Stephenson, Plakal, Beaver, Jaspan, and Shanbhag (Google Technical Report, April 2010).

Dapper was Google's internal tool for tracing requests across thousands of services. The paper described:

- **The tracing model.** Traces are composed of spans. Each span has a start time, end time, name, and parent. Spans form a tree rooted at the initial request. (This is the model we've been using; it comes from Dapper.)
- **Propagation.** Context travels in RPC headers. Every RPC adds to the trace.
- **Sampling.** Google's production traffic was way too high to trace every request, so Dapper sampled. Initially, a fixed fraction (1 in 1024). Later, adaptive sampling.
- **Low overhead.** Dapper had to be cheap enough to leave on in production. The paper reports overhead under 0.5% of CPU and memory at Google scale.
- **Ubiquity.** It had to be in every service, or it was useless. Google shipped it in their core RPC library so every service got it for free.

The Dapper paper inspired every open-source tracing system that followed: Zipkin, Jaeger, Tempo, Lightstep, Honeycomb. The vocabulary of "spans" and "traces" comes from Dapper.

### 14.2 The spans-and-traces model

A **trace** represents one logical operation (a user request, a job, a workflow instance). Within a trace, individual units of work are **spans**. Each span has:

- **trace_id.** 128-bit, unique per trace.
- **span_id.** 64-bit, unique per span.
- **parent_span_id.** The span that caused this one. Root spans have no parent.
- **name.** Human-readable. Usually the operation being performed ("POST /checkout", "db.query", "stripe.charge").
- **start_time / end_time.** When the work started and ended.
- **tags (attributes).** Key-value metadata. "http.status=200", "db.system=postgresql", "user.id=42".
- **events (logs).** Time-stamped annotations within the span. "cache miss", "retrying", "slow query detected".
- **status.** OK, ERROR, or unset.
- **kind.** Client, server, producer, consumer, internal.

A span's **duration** is (end_time - start_time). The trace's overall duration is the root span's duration. Trees of spans reveal the call structure of the request.

### 14.3 Sampling strategies

Tracing every request produces too much data. Real systems sample.

**Head-based sampling** decides at the very start of the trace (in the first service) whether to sample. All downstream services inherit the decision from the `traceparent` header. Simple to implement, but you cannot make the decision based on information that isn't available yet — like "did the request fail" or "was it slow."

**Tail-based sampling** decides at the end of the trace, after all spans are collected. You get to keep interesting traces (errors, slow ones, outliers) and discard boring ones. Much better signal, but much harder to implement — you have to buffer spans until the trace completes, which requires tail-sampling infrastructure like the OpenTelemetry Collector's tail-sampling processor, or dedicated services like Lightstep's.

**Rate-limited sampling.** Sample at most N traces per second, regardless of traffic volume. Useful to bound cost.

**Adaptive sampling.** The rate changes based on traffic volume, error rate, or other signals. Sample more when things look interesting, less when they don't.

**Exemplar sampling.** Instead of trying to capture everything, capture representative traces for each error type, each slow path, etc. Useful for debugging.

### 14.4 Why tracing matters for microservices

In a monolith, you have a stack trace. When something goes wrong, the stack trace shows you exactly which function called which, with what arguments, for this request. Debugging is tractable.

In a microservices system, you do not have a stack trace across service boundaries. A stack trace stops at the HTTP call to the next service. Without distributed tracing, you are debugging blind — you see that the request failed, but you cannot see where.

Distributed tracing gives you back something like a stack trace, but across services. It tells you:
- Which service the request visited.
- In what order.
- How long each visit took.
- Which visits succeeded or failed.
- Which visits were in parallel and which were sequential.
- Which database queries were slow.
- Which downstream was the culprit for a user-visible slowdown.

Without this, debugging a microservices system is essentially impossible at scale. Tracing is not optional.

### 14.5 The evolution of tracing tools

**Zipkin (Twitter, 2012).** The first widely used open-source tracer after Dapper. Written in Java. Uses HTTP or Kafka for transport. Has a web UI for querying traces.

**Jaeger (Uber, 2015).** Uber's tracer, written in Go, released to CNCF. Became the reference implementation for OpenTracing. Supports multiple storage backends (Cassandra, Elasticsearch, memory). More modern than Zipkin; actively developed.

**OpenTracing (CNCF, 2016).** A vendor-neutral API for tracing — lets you instrument your code once and swap tracer implementations. Competed with OpenCensus.

**OpenCensus (Google, 2017).** Google's open-source tracer+metrics library. Similar vocabulary to Dapper. Competed with OpenTracing.

**OpenTelemetry (2019).** The merger of OpenCensus and OpenTracing. Now the canonical standard.

**Tempo (Grafana, 2020).** Grafana's high-scale trace storage, designed to be cheap: write-heavy, indexed only by trace ID, relies on logs and metrics for everything else.

**Honeycomb (2016).** Commercial observability tool built from the ground up on high-cardinality events; not technically a "tracer" but has tracing features and strongly influences the conversation.

**W3C Trace Context (2020).** The web standard for trace propagation. Finally ended the fragmentation of per-tool headers.

### 14.6 Instrumenting a service

OpenTelemetry instrumentation in a Go service looks something like:

```go
import (
    "context"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
)

var tracer = otel.Tracer("pricing-service")

func ComputeTotal(ctx context.Context, req *ComputeTotalRequest) (*ComputeTotalResponse, error) {
    ctx, span := tracer.Start(ctx, "ComputeTotal",
        trace.WithAttributes(
            attribute.String("tax.region", req.TaxRegion),
            attribute.Int("cart.line_items", len(req.LineItems)),
        ))
    defer span.End()

    rules, err := loadTaxRules(ctx, req.TaxRegion)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "failed to load tax rules")
        return nil, err
    }

    total := computeLineItemsTotal(ctx, req.LineItems, rules)
    span.SetAttributes(attribute.Int64("total.cents", total))

    return &ComputeTotalResponse{TotalCents: total}, nil
}
```

The `ctx` carries the trace context. The `tracer.Start` creates a new child span. Attributes attach structured data. Errors are recorded. The span is ended when the function returns. Downstream calls (loadTaxRules, etc.) receive `ctx` and create their own child spans automatically.

Automatic instrumentation libraries exist for common frameworks (HTTP clients, ORMs, Kafka clients) so you often don't write this by hand for boilerplate — only for the service-specific business logic.

---

## 15. API Design Philosophies

### 15.1 Four major styles

There are four major styles of API, each with a different center of gravity. They are not mutually exclusive in a single system — large systems often use all four for different purposes — but each has its own philosophy, its own strengths, and its own trap doors.

1. **RPC-style (operation-centric):** "call this method with these arguments."
2. **Resource-style (noun-centric):** "manipulate these resources with standard verbs."
3. **Query-style:** "ask for exactly the data you want."
4. **Event-style:** "publish and react to domain events."

### 15.2 RPC style

RPC ("Remote Procedure Call") is the oldest style. It models the API as a set of callable procedures, each with typed arguments and typed return values. SOAP, gRPC, Thrift, CORBA, Java RMI, JSON-RPC, XML-RPC are all RPC frameworks. Most real-world "REST APIs" are actually RPC-over-HTTP with JSON.

```protobuf
service UserService {
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  rpc ResetPassword(ResetPasswordRequest) returns (ResetPasswordResponse);
  rpc VerifyEmail(VerifyEmailRequest) returns (VerifyEmailResponse);
  rpc SendWelcomeEmail(SendWelcomeEmailRequest) returns (SendWelcomeEmailResponse);
}
```

**Strengths:**
- Natural for verb-heavy domains ("compute total", "charge card", "send email"). Not all operations fit the "resource" frame.
- Strong typing with code generation (Protobuf, Thrift).
- High performance binary protocols (gRPC over HTTP/2, Thrift compact protocol).
- Easy for developers to understand — it's "just function calls."

**Weaknesses:**
- Tightly coupled to the implementation language concepts; hard to browse with a human tool.
- Verb sprawl: APIs grow many specialized operations instead of composing a few general ones.
- Discoverability is low — without docs, you can't guess what operations exist.
- Does not take advantage of HTTP caching, content negotiation, etc.

### 15.3 REST (resource-centric)

REST ("Representational State Transfer") was defined by Roy Fielding in his 2000 doctoral dissertation ("Architectural Styles and the Design of Network-based Software Architectures," UC Irvine). Fielding was one of the authors of HTTP/1.1, and REST was his attempt to articulate the architectural principles that made the web scale.

Pure REST has five (or six) constraints:
1. **Client-server.** Separation of concerns.
2. **Stateless.** Each request carries all the information needed to process it.
3. **Cacheable.** Responses are explicitly marked cacheable or not.
4. **Uniform interface.** Resources are identified by URIs, manipulated through representations, and the interface is described by hypermedia.
5. **Layered system.** Intermediaries (proxies, caches, gateways) are transparent.
6. **(Optional) Code-on-demand.** The server may send executable code.

The core idea: your API is a set of **resources** (nouns), each identified by a URI, each manipulated through standard HTTP methods (GET, POST, PUT, DELETE, PATCH). The client navigates the API by following links from one resource to another — that's the "hypermedia" constraint, also called **HATEOAS** (Hypermedia As The Engine Of Application State).

```
GET /users/42                        → 200 {user object with links}
GET /users/42/orders                 → 200 {list of order links}
GET /orders/98765                    → 200 {order with link to /users/42}
PUT /orders/98765                    → 200 {modified order}
DELETE /orders/98765                 → 204 (no content)
POST /orders { ... }                 → 201 Location: /orders/98766
```

**Strengths:**
- Leverages HTTP's existing infrastructure: caching, content negotiation, authentication, intermediaries.
- Discoverable through hypermedia.
- Self-describing representations.
- Well-understood evolution patterns.

**Weaknesses:**
- Awkward for action-oriented operations. "Reset this user's password" does not fit cleanly into GET/POST/PUT/DELETE. You end up with ugly URLs like `POST /users/42/password-resets`.
- Most "REST APIs" in the wild are not actually RESTful in Fielding's sense — they use URIs and verbs but not hypermedia. Fielding himself has been vocal about this (his 2008 post "REST APIs must be hypertext-driven" is worth reading).
- Hypermedia discipline is hard to maintain. Few developers have the patience.

Most production "REST APIs" are what Fielding disparagingly called "HTTP RPC" — POST as the verb for everything, no hypermedia, URLs that look like function calls. They are operationally fine, but they are not REST.

### 15.4 GraphQL (query style)

Introduced by Facebook in 2012, released publicly in 2015, standardized in 2018. GraphQL inverts the RPC model: instead of the server defining operations, the server defines a **schema** (a graph of types and fields), and the client issues queries for exactly the data it wants.

```graphql
# Schema (server-defined)
type User {
  id: ID!
  name: String!
  email: String!
  orders(first: Int, after: String): OrderConnection!
}

type Order {
  id: ID!
  placedAt: DateTime!
  total: Money!
  items: [OrderItem!]!
}

type Query {
  user(id: ID!): User
  orders(status: OrderStatus): [Order!]!
}

type Mutation {
  placeOrder(input: PlaceOrderInput!): PlaceOrderPayload
}
```

A client query:
```graphql
query {
  user(id: "42") {
    name
    email
    orders(first: 5) {
      edges {
        node {
          id
          placedAt
          total {
            amountMinor
            currency
          }
        }
      }
    }
  }
}
```

The server returns exactly the fields requested, no more. This solves the "under/over-fetching" problem that REST has (where clients either get too much data or have to make multiple round trips).

**Strengths:**
- Clients get exactly what they need, in one round trip. Excellent for mobile and low-bandwidth clients.
- Strongly typed schema, with automatic documentation.
- Schema evolution is straightforward (add fields freely, deprecate old ones).
- Plays well with component-based UIs — each component declares the data it needs.

**Weaknesses:**
- HTTP caching becomes trickier — every query is a POST to a single endpoint.
- N+1 query problems are easy to introduce on the server side (though solvable with dataloaders).
- Authorization is per-field rather than per-operation, which adds complexity.
- Single endpoint makes observability harder (all traffic looks like `POST /graphql`).
- Rate limiting and cost control require query cost analysis.

GraphQL is especially strong as a BFF (Backend-for-Frontend) layer that aggregates multiple downstream microservices for a single client.

### 15.5 Event-driven / CQRS / Event Sourcing

The event-driven style is qualitatively different: instead of synchronous request-response, you publish events and subscribers react. There is often no "API" in the traditional sense; the "interface" is the event schema.

**CQRS** (Command Query Responsibility Segregation) is an architectural pattern, introduced by Greg Young around 2010, where reads (queries) and writes (commands) use different models. Commands go to a write-optimized store; queries come from a read-optimized store; the two are kept in sync asynchronously (often via events).

**Event Sourcing** is the pattern where you store the history of events (not the current state) as the system of record. Current state is derived by replaying events. This gives you perfect audit trails, time travel, and the ability to build new read projections from historical data. Greg Young also popularized this.

Together, CQRS + Event Sourcing + Event-Driven APIs define a radical redesign of how services communicate:

```
Write side:
  Client → PlaceOrderCommand → Order service → OrderPlacedEvent → Event store

Read side:
  OrderPlacedEvent → Projection service → Read database

Query side:
  Client → GET /orders/98765 → Read database
```

**Strengths:**
- Reads and writes scale independently.
- Event store is an immutable log — perfect for audit, debugging, and time-travel queries.
- Natural fit for event-driven architectures and Kafka-centric systems.
- New projections can be built from historical events without touching the original service.

**Weaknesses:**
- Substantial operational complexity.
- Eventual consistency between write and read sides confuses users ("I placed an order but it's not in my list yet").
- Requires careful thought about schema evolution for events (they live forever).
- Debugging is harder because cause and effect are split across services.

### 15.6 When each style fits

| Style       | Best for                                               |
|-------------|---------------------------------------------------------|
| RPC (gRPC)  | Internal service-to-service calls where type safety, performance, and developer ergonomics matter. |
| REST        | Public APIs where cacheability, discoverability, and HTTP tooling matter. |
| GraphQL     | Client-facing APIs (especially mobile) where over-fetching is a problem, or BFF layers. |
| Event-driven| Workflows spanning many services, audit-heavy domains, real-time systems. |

Real systems use all four. A typical modern architecture might have:
- gRPC for most internal service-to-service calls.
- REST for public APIs exposed to third-party developers.
- GraphQL as a BFF layer for the mobile app and web frontend.
- Kafka-based events for workflows, analytics, and cross-team communication.

The styles are tools in the toolbox, not religious positions.

---

## 16. Versioning and Evolution

### 16.1 The problem

APIs have to change over time. New fields are added. Old fields are removed. Semantics change. Bugs are fixed. The contract you signed in version 1 is not the contract you want for version 2.

At the same time, consumers exist. They have deployed code that depends on v1. You cannot force all of them to upgrade simultaneously — that would defeat the entire purpose of independent deployability.

The question of **versioning** is: how do you evolve an API while keeping old consumers working?

### 16.2 Versioning styles

**URL versioning (path-based).**
```
https://api.example.com/v1/users
https://api.example.com/v2/users
```
Pros: explicit, easy to route, cache-friendly, obvious in logs. Cons: every version gets its own URL space, so hyperlinks embed the version.

**Header versioning (media-type-based).**
```
GET /users/42
Accept: application/vnd.example.user.v2+json
```
Pros: URLs are version-independent. Cons: harder to browse and cache, confusing for humans, most tools don't surface it.

**Query parameter versioning.**
```
GET /users/42?v=2
```
Pros: simple. Cons: cluttered, mixes version with query semantics.

**No versioning (pure schema evolution).** You never release v2; you evolve v1 forever by following additive-only rules. This is what Protobuf-based internal APIs at Google typically do.
Pros: no version proliferation, no migration pain. Cons: you can never make a breaking change; if you need to, you have no escape hatch.

The right answer depends on the API's audience:
- **Internal APIs** (service to service, same company): no versioning or URL v1/v2 folders. Breaking changes are negotiated team-to-team.
- **Public APIs** (third-party developers): URL versioning. Give people a stable endpoint that they can depend on for years.
- **Mobile APIs**: either URL versioning or a BFF layer that shields the mobile apps from backend changes.

### 16.3 Semantic versioning and API versioning

SemVer ("semantic versioning," semver.org) defines a convention: `MAJOR.MINOR.PATCH`, where:

- **MAJOR** increments for breaking changes.
- **MINOR** increments for backward-compatible additions.
- **PATCH** increments for backward-compatible bug fixes.

SemVer is excellent for libraries but maps imperfectly to services. The relevant lesson for APIs is: **major version changes are disruptive, so minimize them.** When you bump the major version, you are asking every consumer to adapt. Do not do it lightly.

A reasonable API versioning policy:
- **Patch and minor:** invisible to the URL. The URL stays `/v1/...` forever as long as the contract is additive.
- **Major:** requires a new URL, `/v2/...`. v1 and v2 run side by side for a deprecation window (6-24 months). Consumers migrate at their own pace. v1 is eventually sunset.

### 16.4 Protobuf's evolution model

Protocol Buffers have the most disciplined approach to wire-format evolution. The rules are:

1. **Field numbers are identity.** Field names are labels; field numbers are the wire format.
2. **Never reuse a field number.** Use `reserved` to mark removed ones.
3. **New fields are optional.** Old readers ignore them.
4. **Removed fields are tolerated by old writers sending the old format.** You handle the case where the field is missing.
5. **Never change a field's type in an incompatible way.** Some type upgrades are allowed (int32 → int64, for example); most are not.
6. **`enum` values must have a zero default.** Unknown values become the zero default on old clients.
7. **`oneof` groups can have members added.** Removing members is harder.
8. **Packages should be versioned.** `example.v1` and `example.v2` can coexist; consumers import the one they want.

These rules let you evolve a Protobuf schema indefinitely without ever cutting a "v2" major version, for most practical purposes. Google's internal APIs have been evolving for 20+ years under these rules.

### 16.5 OpenAPI's deprecation story

OpenAPI supports deprecation with `deprecated: true` on fields, operations, or parameters. You can announce "this field will be removed in six months" without actually removing it. Tools (like Spectral) will lint the schema and warn consumers who use deprecated fields.

```yaml
paths:
  /users/{id}/legacy-profile:
    get:
      operationId: getLegacyProfile
      deprecated: true
      x-deprecation-date: "2026-10-01"
      x-replacement: "/users/{id}/profile"
      # ...
```

The `x-` extensions are OpenAPI's way of adding vendor-specific metadata. Many API platforms extend OpenAPI with custom fields to track deprecation timelines, migration instructions, and breaking-change dates.

### 16.6 The "additive only" rule and where it breaks

For a long time, the received wisdom was: **you can always add, never take away, and you'll be fine.** Additive changes are backward compatible; destructive changes are not; so just be additive.

This works — up to a point. The failures of the "additive only" rule:

1. **Additive changes can still break tolerant readers.** If you add a new required field, old clients won't know to send it, and the server will reject their requests. "Required new field" is a breaking change even though it feels additive.
2. **Adding enum values can break clients.** If a client has a hard-coded switch statement that handles the current enum values, adding a new one causes unexpected fall-through. The fix is to require clients to have a default case.
3. **Semantic changes are invisible to the schema.** If you change what "status=ACTIVE" means from "account is active" to "account has been activated but not yet enabled," no schema rule will catch it, and consumers will break in ways they can't explain.
4. **Accumulation of cruft.** After five years of additive-only evolution, your schema has 47 deprecated fields, three overlapping ways to express the same thing, and a history that nobody remembers. You eventually need to bump the major version to clean up.

In practice, the "additive only" rule is a guideline that buys you time but not permanence. Every API eventually needs a new major version; the question is how long you can defer it.

### 16.7 How APIs actually evolve

The honest story of how APIs evolve in production:

1. You ship v1 with the obvious model you have in mind.
2. You discover you missed something important. You add it as an optional field.
3. A new consumer has different needs. You add another optional field.
4. Someone wants to remove a field. You mark it deprecated and leave it in.
5. A new endpoint gets added that overlaps with an old one. You now have two ways to do the same thing. You deprecate the old one.
6. Someone notices that the response shape is inconsistent across endpoints (some use camelCase, some snake_case). You add a `?format=camel` query parameter rather than break existing clients.
7. Eventually, the accumulated debt is too much. You design v2, spend six months building it, ship it alongside v1, and send a migration plan to consumers with a six-month sunset window.
8. Two years later, you are still maintaining v1 because some customers never migrated. You sunset v1 with executive approval and a big customer announcement. Two customers complain loudly; one churns.

This is the real lifecycle. Versioning is not a one-time design decision; it is a long-running discipline.

---

## 17. Service Granularity Debate

### 17.1 Goldilocks: not too coarse, not too fine

Service granularity is the question "how big should a service be?" The answer is "just right" — which is to say, nobody has a clean formula.

**Too coarse:** the distributed monolith. You have split your system into services, but every new feature requires changes in multiple services, and deployments have to be coordinated, and they share a database, and an outage in one takes down the others. You pay all the costs of distribution (operational overhead, network latency, serialization, partial failure) and get none of the benefits (independent deployment, team autonomy, bounded blast radius). This is the worst failure mode in microservices.

**Too fine:** nanoservices. You have split every function into its own service. Each service does one trivial thing. A single user request now fans out across 50 network calls, each of which adds latency, each of which can fail, each of which has its own deployment. Your operational surface is overwhelming. Your observability is impenetrable. You are debugging through traces instead of stack traces, and the traces are hundreds of spans deep.

The right size is somewhere in between, and it depends on your specific system.

### 17.2 Heuristics for the right size

**Team size (Amazon's two-pizza rule).** Amazon famously introduced the rule: a team should be small enough that two pizzas can feed them (about 6-8 people). And each team should own one or a small number of services. This gives you a default granularity: services are sized such that one small team can own and operate one service. If a service grows too big for one team, split it. If a team is running many services, they might need to be merged.

**Bounded context.** As discussed in §6, a microservice boundary should usually align with a bounded context boundary. If you have three bounded contexts, you should have three services. Don't go finer unless you have a strong reason.

**Independent deployability.** The acid test of a service boundary: can you deploy this service without coordinating with any other team? If yes, the boundary is sharp enough. If no, you have a distributed monolith and the boundary is wrong.

**Business capability alignment.** Think in terms of "what does the business want this part of the system to do?" A service should correspond to a business capability: "ordering," "fulfillment," "customer management," "fraud detection." These are the things the business talks about. Services that don't correspond to a business capability are suspect.

**Rate of change.** If two pieces of code change together every time, they probably belong in the same service. If they change independently, they probably belong in different services. This is sometimes called the "change coupling" metric, and it's measurable from version control history.

**Failure isolation requirement.** If an outage in part A must not take down part B, then A and B must be in different services. If an outage in A naturally affects B anyway (because B is a direct consumer), colocating them adds nothing.

**Technology heterogeneity.** If part of your system has dramatically different technology requirements (GPU vs CPU, Python vs Go, batch vs real-time), that's a signal to split.

### 17.3 Sam Newman's decomposition strategies

Sam Newman's *Building Microservices* (O'Reilly, 1st edition 2015, 2nd edition 2021) is the most widely cited practical reference for microservices decomposition. His specific strategies:

1. **Decompose by business capability.** Start with what the business does, not with the data model. Find the verbs ("place an order," "authorize payment") and draw services around them.

2. **Decompose by bounded context.** Use DDD (§6) to find the seams.

3. **Decompose by transaction boundary.** Where does a single transaction need to be atomic? Keep that inside one service. Splits that cross a transaction boundary will force you into Sagas.

4. **Decompose by domain-driven design aggregates.** Each aggregate root tends to be a natural entry point for a service.

5. **Decompose by rate of change.** Separate things that change at different rates.

6. **Decompose by security boundary.** If one part handles PII and another doesn't, the PII part may need to be its own service for compliance reasons.

7. **Decompose by technology.** Sometimes the technical requirements alone justify a split (ML inference, image processing, video encoding).

Newman's stronger point: **don't start by decomposing.** Start by building a monolith. Understand the domain. Find the real seams. Then extract services when the need becomes clear. The "monolith first" strategy avoids over-committing to boundaries you don't fully understand.

### 17.4 The "distributed monolith" anti-pattern

Specific smells:
- Services share a database.
- Services have to be deployed together.
- A single user action requires deploying multiple services in a specific order.
- Teams have to coordinate releases constantly.
- There is a single shared "models" library that every service depends on.
- Changes in service A routinely break service B at runtime.
- You cannot change a service without running end-to-end tests for the whole system.

Any of these means the decomposition is wrong. The fix is usually: find the real boundaries (go do DDD), consolidate services that are tightly coupled, split services that are hiding multiple bounded contexts.

### 17.5 The nanoservices anti-pattern

Specific smells:
- A single user request fans out to 50+ service calls.
- Every service has the same minimal code structure: accept input, call another service, return output.
- The majority of engineering time goes to operational tooling, not features.
- New engineers take months to understand the system.
- Debugging requires reading trace files with hundreds of spans.
- Latency budgets are so tight that everything is squeezed.
- The team is constantly discussing how to "consolidate" services.

The fix: merge services. The right merge candidates are services that share a single team, change together, deploy together, and have no independent value. Combine them into one service with internal modules.

---

## 18. Statelessness vs State

### 18.1 Why stateless services are easier to scale

A **stateless** service is one where each request can be handled by any instance, in any order, with no dependency on previous requests. All the information the service needs to process a request is either in the request itself or in a shared backing store (database, cache).

Stateless services are easy to scale:
- Add more instances, route traffic to them, done.
- Remove instances, no special handling, done.
- Instance crashes? Replace it, no state lost.
- Rolling deploys? No need to drain connections carefully.
- Autoscaling? Just watch CPU or queue depth and scale based on them.

This is the "cattle, not pets" model: you treat individual instances as disposable. You don't care about any one of them. If it gets sick, you kill it and spin up a replacement. No instance has a name. No instance has a special role.

### 18.2 The 12-Factor App

Published by Adam Wiggins at Heroku in 2011 ([12factor.net](https://12factor.net/)), the 12-Factor App is a set of principles for building scalable, stateless services. The twelve factors:

1. **Codebase** — one codebase tracked in revision control, many deploys.
2. **Dependencies** — explicitly declare and isolate dependencies.
3. **Config** — store config in the environment.
4. **Backing services** — treat backing services as attached resources.
5. **Build, release, run** — strictly separate build and run stages.
6. **Processes** — execute the app as one or more stateless processes.
7. **Port binding** — export services via port binding.
8. **Concurrency** — scale out via the process model.
9. **Disposability** — maximize robustness with fast startup and graceful shutdown.
10. **Dev/prod parity** — keep development, staging, and production as similar as possible.
11. **Logs** — treat logs as event streams.
12. **Admin processes** — run admin/management tasks as one-off processes.

Factor 6 is the critical one for service orientation: **processes must be stateless and share-nothing.** Any state that needs to persist between requests lives in a backing service (a database, a cache, an object store). Local disk is scratch space at best; any data written there may be destroyed at any time.

The 12-Factor app is the operating model behind Heroku, Cloud Foundry, modern Kubernetes deployments, serverless functions, and much of what's called "cloud-native." It works because statelessness eliminates the hardest operational problems of distributed systems.

### 18.3 But state has to live somewhere

Statelessness is not the absence of state — it is the *relocation* of state to specific, managed places. The state still exists; it is just not in your service's process memory.

The places state lives:

- **Databases.** The canonical system of record. Transactions, constraints, durability.
- **Caches.** In-memory stores for hot data (Redis, Memcached, ElastiCache). Not durable; the cache can be rebuilt from the database.
- **Object stores.** Immutable blob storage (S3, GCS, Azure Blob). Good for large files, backups, archives.
- **Distributed coordination stores.** etcd, Zookeeper, Consul — for state that multiple processes need to agree on (leader election, distributed locks, config).
- **Search indexes.** Elasticsearch, Algolia — for denormalized query projections.
- **Event logs.** Kafka as the log-of-truth for event-sourced systems.
- **Stream processing state stores.** Flink, Kafka Streams state stores — for materialized views of event streams.

The service itself is stateless in the sense that no single instance of the process holds unique state that would be lost if the instance died. But the system as a whole is extremely stateful.

### 18.4 When to keep state in the service: the actor model

There is a class of systems where statelessness is the wrong choice: systems where per-entity state is so hot and so write-heavy that a round trip to a shared database for every operation is prohibitive. Games, real-time collaboration, IoT device twins, real-time auctions.

For these, the **actor model** is the alternative. An actor is a small, addressable entity that holds its own private state and processes messages one at a time. Each actor is effectively a tiny stateful service. The actor runtime (Erlang/OTP, Akka, Orleans, Elixir, Ray) takes care of distributing actors across machines, migrating them, recovering them from crashes, and routing messages to them.

```
                       Messages
                          │
                          ▼
    ┌─────────────────────────────────────┐
    │          Actor Runtime              │
    │  ┌──────┐  ┌──────┐  ┌──────┐       │
    │  │ A1   │  │ A2   │  │ A3   │       │
    │  │state │  │state │  │state │       │
    │  └──────┘  └──────┘  └──────┘       │
    └─────────────────────────────────────┘
        Distributed across many hosts
```

The actor has private mutable state. Messages to the actor are serialized by the runtime. The actor processes one message at a time, updates its state, and possibly sends messages to other actors. This gives you the mental model of an object with mutable state, but distributed and resilient.

Microsoft's **Orleans** (used by Halo, Azure services, etc.) pioneered the "virtual actor" model, where actors are logical entities that exist whether or not they are currently loaded, and the runtime materializes them on demand. Dapr (CNCF) brings this model to any language.

Actors and 12-factor stateless services are not contradictory; they are different tools for different problems. The vast majority of services should be stateless. A small number of services, where the hot-path state would overwhelm a shared database, benefit from the actor model.

---

## 19. Security

### 19.1 The "zero trust" model

The traditional security model was the **castle-and-moat**: put firewalls around the network perimeter, and once you're inside, you're trusted. Services inside the firewall could talk to each other without authentication.

This model is dead. Modern cloud systems span multiple networks, involve third-party services, run workloads from untrusted sources, and face attackers who are excellent at breaching perimeters. Once an attacker is inside, a "trust the internal network" model gives them the keys to everything.

The replacement is **zero trust**: **never trust, always verify.** Every service authenticates every request, even from inside the network. Every service authorizes every request, even from peers it trusts. There is no "inside" that is automatically safe. Trust is earned per-call, per-token, per-identity.

Zero trust is not just a philosophy — it drives specific architectural patterns that service-oriented systems now take for granted.

### 19.2 Authentication: OAuth 2.0, OpenID Connect, JWT, mTLS

**Authentication** is the question "who is calling?" There are two broad answer classes in modern service systems:

**Token-based authentication.** The caller presents a token (a signed, time-limited string) that vouches for their identity. The service verifies the token's signature and reads the identity claims from it.

- **OAuth 2.0** (RFC 6749, 2012) is the foundational framework for delegated authorization. A user authorizes a client application to call APIs on their behalf. The client gets an access token and uses it in its API calls.
- **OpenID Connect** (2014) is a thin layer on top of OAuth 2.0 that adds authentication: the token additionally identifies the end user. "OAuth is for authorization, OIDC is for authentication" is the usual summary.
- **JWT (JSON Web Token)** (RFC 7519, 2015) is the format used for most OAuth/OIDC tokens. A JWT is three base64url segments joined by dots: `header.payload.signature`. The payload contains claims: `sub` (subject), `iss` (issuer), `aud` (audience), `exp` (expiration), and whatever custom claims you want.

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjRFZjZiIn0.eyJz...
│                                                      │
header                                                 payload
```

A service receiving an HTTP call with `Authorization: Bearer <JWT>` verifies the signature against the issuer's public key, checks the expiration, checks the audience, and then trusts the claims. No round trip to a central auth server is required, which makes JWTs very scalable.

**Mutual TLS (mTLS).** Both sides of a TLS connection present certificates, and each side verifies the other's. The service knows the caller's identity from the cert's subject field. This is the usual approach for service-to-service authentication in a service mesh.

In a Kubernetes cluster running Istio or Linkerd, every pod gets a short-lived certificate. When pod A calls pod B, mTLS happens automatically via the sidecar proxy. Neither A nor B needs to know anything about certificates — the mesh handles it. This is zero trust in practice: every single service-to-service call is authenticated.

### 19.3 Authorization: RBAC, ABAC, OPA, Zanzibar

**Authorization** is the question "is this caller allowed to do this?" Several models:

**RBAC (Role-Based Access Control).** Users are assigned roles; roles have permissions; permissions allow operations. "User X has the Admin role; the Admin role can delete anything." Simple, coarse, widely used.

**ABAC (Attribute-Based Access Control).** Decisions are made by evaluating attributes of the subject, the resource, and the environment. "Allow if user.department == resource.department AND time.hour >= 9 AND time.hour <= 17." More flexible, more complex.

**OPA (Open Policy Agent).** A general-purpose policy engine with its own declarative language (Rego) that can implement RBAC, ABAC, or anything in between. Policies are hot-loaded; services ask OPA "can X do Y to Z?" and get a yes/no answer. Widely used in Kubernetes admission controllers, service meshes, and API gateways.

```rego
# Example OPA policy for a service API
package pricing.authz

default allow = false

allow {
    input.method == "POST"
    input.path == ["v1", "totals"]
    input.user.role == "service"
    input.user.service == "checkout"
}

allow {
    input.method == "GET"
    input.path = ["v1", "tax_rates", _]
    input.user.role in {"admin", "analyst", "service"}
}
```

**Zanzibar-style relationship-based access control.** Google's Zanzibar paper (2019) described Google's internal authorization system for products like Drive and YouTube. The model is "user X has relation R to object Y" (e.g., "alice is owner of document_42"), with rules for transitive relations ("if you're a member of a group, you inherit the group's access"). Open-source implementations: SpiceDB, OpenFGA, Keto. This model is powerful for apps with complex sharing and collaboration semantics.

### 19.4 API gateway vs per-service auth

Two architectural choices for where authentication/authorization lives:

**At the edge (API gateway).** A single gateway handles auth for the whole system. Internal services trust headers injected by the gateway. The gateway is the only thing that needs to understand JWTs.

```
Internet → [API Gateway] → Internal services
           (auth here)     (trust the gateway)
```

Pros: simple, centralized, single place to update auth logic.
Cons: "perimeter security" — if anything gets inside the gateway, it's trusted. Inconsistent with zero trust.

**Per-service.** Every service verifies every request itself. No blind trust.

```
Internet → Service A (auth) → Service B (auth) → Service C (auth)
```

Pros: zero trust; no implicit trust relationships; defense in depth.
Cons: more code, more CPU, more complexity.

Modern service meshes (Istio, Linkerd, Cilium) compromise: auth is enforced at the sidecar proxy, which is per-service but configured centrally. The service itself doesn't have auth code, but every call is still authenticated at the proxy. This gets you zero trust without per-service duplication.

### 19.5 Secrets management

Services need secrets: database passwords, API keys, signing keys, certificates. Where do secrets live?

**Bad options:**
- Environment variables in a Docker Compose file committed to git.
- Config files on disk.
- Hardcoded in source.
- Copy-pasted via Slack.

**Good options:**
- **HashiCorp Vault.** A dedicated secrets management service. Services authenticate (often via their own identity tokens) and fetch secrets at runtime.
- **AWS Secrets Manager / AWS KMS / AWS Parameter Store.** Cloud-managed secret storage with IAM-based access control.
- **Sealed Secrets (Kubernetes).** Secrets that are encrypted with a cluster key so they can be safely stored in git; the controller decrypts them on-cluster.
- **Short-lived credentials.** Instead of a long-lived password, services get a short-lived token (15 minutes) that's automatically rotated.

The discipline: **secrets are never in source control, never in logs, and never in config files that land on disk.** They are fetched from a secrets store at runtime, held in memory only, and rotated frequently.

### 19.6 Defense in depth

A well-designed service-oriented security posture has multiple layers:

1. **Network isolation.** Private subnets, security groups, network policies. Only the necessary traffic is allowed.
2. **mTLS everywhere.** Every service-to-service connection is mutually authenticated.
3. **Token-based authentication.** Every API call carries a token.
4. **Authorization at multiple layers.** API gateway, service proxy, service code, database row-level security.
5. **Rate limiting and quota.** Protect against abuse and DoS.
6. **Secrets management.** Centralized, audited, rotated.
7. **Audit logging.** Every security-relevant event is logged for forensics.
8. **Vulnerability scanning.** Container images, dependencies, configurations.
9. **Chaos security engineering.** Deliberately attacking your own systems to verify defenses.

No single layer is enough. Any one of them can fail. The goal is that an attacker who defeats one layer still has to defeat the next, and the next.

---

## 20. The SOA Mental Model

### 20.1 Systems as collections of services

The fundamental shift in thinking is that a system is no longer "a program." A system is **a collection of services that cooperate through contracts.** The whole is larger than any one of its parts, and the interesting behavior lives in the interactions.

This has several implications.

**There is no single source of truth about the system's behavior.** No one person can describe what the whole system does. Understanding the system means understanding the services *and* the contracts *and* the communication patterns. You read code in many repositories, you trace requests through many processes, you reason about many failure modes simultaneously.

**Changes are local, not global.** A change to a service can be deployed without touching other services. A refactoring of a service's internals is invisible to its consumers. A new feature that only needs one service's data can ship independently. This is the upside of the decomposition.

**The contract is the world.** To a consumer, a service is its contract and nothing more. Anything the contract doesn't say is not guaranteed. Anything the contract does say is sacred. Services live or die by the quality and stability of their contracts.

### 20.2 Independent lifecycles

Each service has its own lifecycle: its own release cadence, its own deployment schedule, its own version history, its own on-call rotation. The checkout service might release 50 times a day; the tax engine might release once a month. Both are correct, because they are independently evolvable.

This means:
- You cannot assume all services are at the same version.
- You cannot assume all services have the same features.
- You cannot assume all services are deployed together.
- You cannot assume a fix in service A is visible in service B.

You must instead **design for coexistence**: multiple versions of multiple services, all running at once, all talking to each other, all honoring their contracts.

### 20.3 Network calls are first-class

In a monolith, function calls are invisible — you don't think about the cost of calling `total = sum(prices)`. In a service-oriented system, every call to another service is a potential point of failure and a definite contributor to latency, bandwidth, and cost. You have to think about every one.

Before adding a new inter-service call, ask:
- Is this call on the critical path of a user request?
- What is the latency budget?
- What happens if the callee is down?
- What happens if the callee is slow?
- Is the call idempotent?
- Is retrying safe?
- What does the fallback look like?
- Is the data I need worth the round trip, or can I cache it or embed it?

This is extra cognitive load, and it is the tax you pay for the distribution. Good service-oriented engineers internalize the questions so they become automatic.

### 20.4 Data ownership as the organizing principle

The single most important rule in service-oriented design: **each piece of data has exactly one owner, and only the owner can modify it.**

If two services both write to the same data, they are racing with each other, and you have lost data consistency. If two services both read the same data directly from the database, you have tight coupling, and evolving either one's schema is a cross-team negotiation. If no service owns the data, nobody is responsible for its correctness.

The rule:
- One service owns the data.
- That service has the only write path to the data.
- Other services get the data through the owner's API, not by reaching into the database.
- Data that crosses service boundaries does so through explicit contracts (request-response, events, queries).

This rule is what creates the boundaries that make the rest of service orientation work. Without it, you have a distributed ball of mud.

### 20.5 The Inverse Conway Maneuver

Conway's Law (Melvin Conway, 1967): **"Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations."**

In other words: your system's architecture will resemble your org chart. If you have three teams, you'll have three subsystems. If your teams are organized by technology layer (UI team, API team, database team), your architecture will be three horizontal layers. If your teams are organized by business capability (checkout team, catalog team, shipping team), your architecture will be three vertical services.

The **Inverse Conway Maneuver** is the strategy of *deliberately reorganizing your teams to produce the architecture you want.* If you want a microservices architecture with vertical service teams, you reorganize your people into vertical service teams first, and the architecture will follow.

This is why modern platform engineering and team topology work is considered part of service-oriented thinking. The book **Team Topologies** (Skelton and Pais, 2019) is the canonical treatment: it names four team types (stream-aligned, enabling, complicated-subsystem, platform) and three interaction modes (collaboration, X-as-a-service, facilitating). The point is that service architecture and org architecture have to be co-designed.

If you try to adopt microservices while keeping a functional org structure (separate teams for front-end, back-end, and database), you will fail. The org structure will resist the architecture and eventually win.

### 20.6 The two-pizza team as the fundamental unit

Amazon's observation was that the correct unit of ownership is the two-pizza team: 6-8 people who own a service end-to-end. End-to-end means:
- They build it.
- They deploy it.
- They operate it in production.
- They go on call for it.
- They make product decisions about it.
- They control its technology choices.

"You build it, you run it" (Werner Vogels) is the slogan version. The team that builds the code is the team that gets paged when it breaks. This creates strong incentives for reliability: if you ship bad code, you suffer.

Under this model, the architecture mirrors the teams: one team owns one service (or a small number of closely related services), and the team's cognitive load stays bounded. When a service grows too big for a team, it's split. When a service is too small to justify a team, it's merged.

### 20.7 Platform engineering and golden paths

If every team owns their own services end-to-end, and every team has to solve the same operational problems (deployment, monitoring, secrets, networking, compliance), you get enormous duplication. Every team reinvents CI/CD, observability, authentication.

The modern answer is **platform engineering**: a dedicated platform team builds a **golden path** — a set of paved, opinionated, well-supported tools that make the default choice easy. Want a new service? Use the template. Want logging? It's automatic. Want tracing? It's automatic. Want TLS? It's automatic. Want a database? Here's the self-service portal.

The platform team's customers are the product teams. The platform team's product is developer experience. The measure of their success is: how fast can a new team ship a new service? The best platform teams can make "zero to prod" a matter of hours, not weeks.

This is not a return to central architecture committees. The golden path is optional — teams can deviate if they have a good reason. But the default is paved, so the common case is cheap, and the deviations are localized to where they actually matter.

### 20.8 Why service-oriented thinking is org-chart-aware

The final and most important lesson: **you cannot separate the technical architecture from the organization that builds and runs it.** Service orientation is as much an organizational discipline as a technical one. You are drawing lines between teams as much as between processes.

The services that survive are the ones where:
- The team owns the service.
- The team has clear interfaces to neighboring teams.
- The team can evolve the service independently.
- The team's interests align with the service's success.

The services that fail are the ones where:
- Ownership is fuzzy.
- Changes require cross-team coordination on every feature.
- The team has no autonomy.
- The team has no incentive to improve the service.

If you are not thinking about the organization while drawing the service boundaries, you are doing service orientation wrong. The machine-level design and the people-level design are the same design, viewed from two angles.

---

## Epilogue: A Discipline, Not a Technology

Service-oriented programming is not a technology. It is not SOAP, not ESBs, not microservices, not Kubernetes, not service meshes, not event buses. Those are tools and eras — useful to know, useful to study, but replaceable.

The discipline underneath is older and more durable. It is about decomposition: where to draw the lines between parts of a system so that each part is understandable, changeable, and operable independently. The lines have to be drawn in the right places — at bounded contexts, at rate-of-change boundaries, at team boundaries, at business-capability boundaries — and the lines have to be respected by explicit contracts that outlive any individual release.

Everything else follows. Loose coupling follows from respecting the lines. Idempotency follows from treating the network as unreliable. Observability follows from needing to debug across the lines. Versioning follows from the contracts having independent lifecycles. Fault tolerance follows from accepting that anything on the wrong side of a line might disappear at any moment. Security follows from not trusting anyone beyond the line.

The tools will change. In five years, we will have new frameworks, new protocols, new platforms. Those new tools will still be trying to solve the same problems — how to draw the lines, how to make the lines clean, how to evolve the system on each side of the lines without breaking the other.

If you understand the principles in this document, you will understand the new tools when they arrive. If you only understand the tools and miss the principles, you will have to start over.

---

## Selected Sources and Further Reading

- **SOA Manifesto** (2009), soa-manifesto.org.
- Thomas Erl, *SOA: Principles of Service Design* (Prentice Hall, 2007).
- Thomas Erl, *Service-Oriented Architecture: Concepts, Technology, and Design* (Prentice Hall, 2005).
- Roy Fielding, *Architectural Styles and the Design of Network-based Software Architectures* (UC Irvine dissertation, 2000).
- Eric Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software* (Addison-Wesley, 2003).
- Vaughn Vernon, *Implementing Domain-Driven Design* (Addison-Wesley, 2013).
- Sam Newman, *Building Microservices*, 2nd edition (O'Reilly, 2021).
- Sam Newman, *Monolith to Microservices* (O'Reilly, 2019).
- Gregor Hohpe and Bobby Woolf, *Enterprise Integration Patterns* (Addison-Wesley, 2003).
- Michael Nygard, *Release It!*, 2nd edition (Pragmatic Bookshelf, 2018).
- Martin Fowler, bliki articles on "Microservices," "TolerantReader," "BoundedContext," "EventSourcing," "CQRS."
- Betsy Beyer et al., *Site Reliability Engineering* (O'Reilly, 2016).
- Casey Rosenthal and Nora Jones, *Chaos Engineering* (O'Reilly, 2020).
- Matthew Skelton and Manuel Pais, *Team Topologies* (IT Revolution, 2019).
- Sigelman et al., "Dapper, a Large-Scale Distributed Systems Tracing Infrastructure" (Google, 2010).
- Gilbert and Lynch, "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-tolerant Web Services" (ACM SIGACT News, 2002).
- Daniel Abadi, "Consistency Tradeoffs in Modern Distributed Database System Design: CAP is Only Part of the Story" (IEEE Computer, 2012).
- Charity Majors et al., *Observability Engineering* (O'Reilly, 2022).
- Adam Wiggins, "The Twelve-Factor App" (12factor.net, 2011).
- Hector Garcia-Molina and Kenneth Salem, "Sagas" (SIGMOD '87).
- W3C Trace Context specification (W3C Recommendation, 2020).
- Zanzibar paper: Pang et al., "Zanzibar: Google's Consistent, Global Authorization System" (USENIX ATC 2019).
- Greg Young, various talks and writings on CQRS and Event Sourcing.
- Adrian Cockcroft, blog posts and talks on Netflix architecture, "Chaos Monkey," and microservices.
- Fred George, "Micro-Service Architecture" talk (2012).
- James Lewis and Martin Fowler, "Microservices" (Martin Fowler bliki, 2014).

---

## Study Guide — SOA Principles

### Key principles

1. **Loose coupling.** Services know nothing about each
   other's internals.
2. **Autonomy.** Each service owns its data.
3. **Contract-first.** APIs come before implementation.
4. **Idempotency.** Safe to retry.
5. **Observability.** Logs, metrics, traces from day one.

## DIY — Apply 12-factor to a service

Check your own service against the 12-factor app. Note
where you're non-compliant.

## TRY — Design a saga

Distributed transaction across 3 services with
compensating actions. Write the saga out on paper. Run
it in code with failures injected.

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
