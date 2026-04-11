# Modern Service-Oriented Architecture (2010s–2020s)

*A deep field guide to the stack that actually runs the internet today.*

> "All teams will henceforth expose their data and functionality through service interfaces. There will be no other form of interprocess communication allowed. Anyone who doesn't do this will be fired." — Jeff Bezos, internal Amazon memo, circa 2002 (leaked by Steve Yegge, 2011)

This document covers the modern service-oriented stack: REST, OpenAPI, gRPC, GraphQL, microservices, Kubernetes, service meshes, event streaming, API gateways, serverless, distributed tracing, platform engineering, and the industries that run on all of it. It deliberately avoids SOAP, WSDL, BPEL, and the enterprise-era ESB story — those belong to the companion "Enterprise SOA" thread.

The thesis: between roughly 2011 (when Kafka and Swagger were born) and 2016 (when Kubernetes, gRPC, Envoy, and Linkerd all crystallized), the industry built an entire new substrate for building applications as networks of services. That substrate — cloud-native, container-scheduled, proxy-mediated, stream-connected — is what "modern SOA" actually means in 2026.

---

## 1. REST Done Right and REST Done Wrong

### 1.1 Fielding's dissertation (2000)

Roy Fielding's "Architectural Styles and the Design of Network-based Software Architectures" (UC Irvine, 2000) is the canonical REST source. REST is not a protocol; it is an *architectural style* — a set of constraints that, when applied to a distributed hypermedia system, produce certain desirable properties (scalability, visibility, reliability, evolvability).

Fielding's six constraints:

1. **Client-server** — separation of concerns between UI and data storage.
2. **Stateless** — each request must contain everything the server needs to process it.
3. **Cacheable** — responses must (implicitly or explicitly) declare themselves cacheable or not.
4. **Uniform interface** — the constraint that most people skip:
   - Identification of resources (URIs).
   - Manipulation through representations.
   - Self-descriptive messages.
   - **Hypermedia as the engine of application state (HATEOAS).**
5. **Layered system** — proxies, gateways, and load balancers must be invisible to clients.
6. **Code on demand** (optional) — servers can extend clients with executable code (e.g., JavaScript).

The part almost everyone ignores is the fourth: HATEOAS. In a "truly RESTful" system, a client starts from a single entry URL, is handed a representation, and *follows links* in that representation to discover what it can do next. The client does not know URL templates up-front; it discovers them.

Almost nothing on the public internet is REST in Fielding's original sense. What people call "REST APIs" are better described as "HTTP+JSON APIs organized around resources."

### 1.2 The Richardson Maturity Model (2008)

Leonard Richardson presented the Richardson Maturity Model at QCon San Francisco 2008; Martin Fowler popularized it in a 2010 bliki post. The model describes four levels of "REST maturity":

**Level 0: The Swamp of POX**. A single URI, a single HTTP verb (usually POST), and XML or JSON tunneled through it. SOAP-over-HTTP lives here. It uses HTTP as a transport for RPC, not as an application protocol.

```http
POST /api HTTP/1.1
Content-Type: application/json

{"method": "getUserById", "params": {"id": 42}}
```

**Level 1: Resources**. Multiple URIs, still one verb. You have endpoints like `/users/42` and `/orders/1001`, but every operation is a POST.

```http
POST /users/42 HTTP/1.1
Content-Type: application/json

{"action": "updateEmail", "email": "new@example.com"}
```

**Level 2: HTTP verbs**. Multiple URIs plus the actual HTTP methods (GET, POST, PUT, PATCH, DELETE), plus HTTP status codes for results. This is where 95% of "REST APIs" live.

```http
GET /users/42 HTTP/1.1
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

{"id": 42, "email": "foo@example.com", "name": "Foo"}
```

```http
PATCH /users/42 HTTP/1.1
Content-Type: application/merge-patch+json

{"email": "new@example.com"}

HTTP/1.1 200 OK
```

**Level 3: Hypermedia controls (HATEOAS)**. Responses contain links that tell the client what it can do next. This is what Fielding meant by "REST."

```http
GET /accounts/12345 HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/hal+json

{
  "accountNumber": "12345",
  "balance": { "amount": 1000, "currency": "USD" },
  "status": "open",
  "_links": {
    "self":     { "href": "/accounts/12345" },
    "deposit":  { "href": "/accounts/12345/deposits" },
    "withdraw": { "href": "/accounts/12345/withdrawals" },
    "close":    { "href": "/accounts/12345/close" },
    "transactions": { "href": "/accounts/12345/transactions?page=1" }
  }
}
```

Notice what the hypermedia representation gives you: the server can add or remove actions ("close" disappears if the account is already closed) without clients having to ship a new build. The client discovers the state machine.

### 1.3 HTTP as the REST protocol

Modern REST piggybacks on HTTP semantics. The methods:

| Verb    | Semantic                          | Safe? | Idempotent? | Cacheable? |
|---------|-----------------------------------|-------|-------------|------------|
| GET     | Retrieve a representation         | Yes   | Yes         | Yes        |
| HEAD    | Retrieve headers only             | Yes   | Yes         | Yes        |
| OPTIONS | Describe communication options    | Yes   | Yes         | No         |
| POST    | Create subordinate resource / RPC | No    | No          | Rarely     |
| PUT     | Replace resource at URI           | No    | Yes         | No         |
| PATCH   | Partial update                    | No    | No          | No         |
| DELETE  | Remove resource                   | No    | Yes         | No         |

Status code families:

- **1xx Informational** — rarely seen except 101 Switching Protocols (WebSockets, HTTP/2 upgrade).
- **2xx Success** — 200 OK, 201 Created (with Location header), 202 Accepted (async), 204 No Content, 206 Partial Content (range requests).
- **3xx Redirection** — 301 Moved Permanently, 302 Found, 303 See Other, 304 Not Modified (caching), 307 Temporary Redirect, 308 Permanent Redirect.
- **4xx Client Error** — 400 Bad Request, 401 Unauthorized (authn), 403 Forbidden (authz), 404 Not Found, 405 Method Not Allowed, 409 Conflict (optimistic concurrency), 410 Gone, 412 Precondition Failed, 415 Unsupported Media Type, 422 Unprocessable Entity, 429 Too Many Requests (rate limit).
- **5xx Server Error** — 500 Internal Server Error, 501 Not Implemented, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.

Important REST-relevant headers:

```http
# Content negotiation
Accept: application/json
Accept-Language: en-US
Accept-Encoding: gzip, br

# Caching
Cache-Control: public, max-age=3600, stale-while-revalidate=60
ETag: "686897696a7c876b7e"
Last-Modified: Wed, 21 Oct 2020 07:28:00 GMT
If-None-Match: "686897696a7c876b7e"
If-Modified-Since: Wed, 21 Oct 2020 07:28:00 GMT

# Concurrency control
If-Match: "686897696a7c876b7e"   # optimistic write

# Pagination (link header per RFC 5988)
Link: <https://api.example.com/orders?page=3>; rel="next",
      <https://api.example.com/orders?page=1>; rel="first",
      <https://api.example.com/orders?page=27>; rel="last"

# Idempotency (Stripe's convention, now widely adopted)
Idempotency-Key: 6dc0ad9a-8b9e-4e8f-b7a1-0b5e1a5d0a1e

# Rate limiting
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 738
X-RateLimit-Reset: 1645552860
Retry-After: 42
```

### 1.4 Resource modeling: nouns over verbs

The single most important REST maxim. URLs name **things**, not **actions**. HTTP methods express the action.

Wrong:
```
POST /getUserById
POST /createOrder
POST /cancelOrder?id=1001
GET  /listUsers
```

Right:
```
GET    /users/42
POST   /orders
DELETE /orders/1001          (or POST /orders/1001/cancellations)
GET    /users?limit=50
```

When the action doesn't fit a CRUD pattern, the idiomatic trick is to reify the action as a *resource*:

```
POST /accounts/12345/freezes        # creates a freeze event on the account
POST /orders/1001/cancellations     # creates a cancellation on the order
POST /videos/abc/transcodes         # creates a transcode job
GET  /videos/abc/transcodes/xyz     # check status of that transcode
```

### 1.5 JSON won (even though REST is format-agnostic)

REST doesn't mandate JSON. Fielding's original examples used HTML and XML. But by 2013 the practical default for web APIs was JSON, and it was driven by:

- **Mobile clients**. XML parsers were heavy; JSON maps directly to JavaScript, Swift, and Kotlin types.
- **Browser fetch**. `JSON.parse(await fetch(url).then(r => r.text()))` is one line.
- **curl-debuggability**. You can `curl -s api.example.com/users/42 | jq` and read it.
- **Simplicity**. No namespaces, no schemas required, no XSLT, no SOAP envelope.

The cost: no standardized schema language (OpenAPI filled that gap later), weaker type safety, and no binary-efficient wire format (gRPC filled *that* gap later).

### 1.6 The "we're not really doing REST" moment

Somewhere around 2015 the practitioner community collectively acknowledged that what they were shipping was not REST in the Fielding sense; it was HTTP+JSON+resources. That was fine. The label stuck anyway, and the "truly RESTful = HATEOAS" debate was shelved. HAL, JSON:API, and Siren are the surviving hypermedia format attempts, but they remain niche.

### 1.7 Why REST + JSON won the public API war

1. It runs on the infrastructure you already have: HTTP proxies, CDNs, browser caches, TLS terminators, firewalls.
2. It's debuggable with a web browser.
3. Every language ships a JSON parser and an HTTP client.
4. OAuth 2.0 + Bearer tokens slid into the HTTP header model cleanly.
5. CORS, once the browsers implemented it, made cross-origin REST practical for SPAs.

REST didn't win because it was the best. It won because it was *the cheapest path* to a working, multi-client, web-scale API.

---

## 2. OpenAPI / Swagger

### 2.1 Origin: Tony Tam and Wordnik (2011)

Swagger was created by Tony Tam and a small team at Wordnik, an online dictionary startup, in 2011. They needed to describe their REST API for internal documentation and client-generation. The format was a JSON schema describing endpoints, parameters, and responses, plus a browser-based renderer (Swagger UI).

Timeline:
- **2011** — Swagger 1.0 at Wordnik.
- **2012** — Swagger 1.1, Swagger UI released publicly.
- **2014** — Swagger 2.0 released after a community process. This is the version most "legacy" integrations still carry.
- **2015** — Reverb (Wordnik's successor) donates the spec to the Linux Foundation, forming the **OpenAPI Initiative** (SmartBear, Google, IBM, Microsoft, Atlassian, and others). Swagger 2.0 is renamed **OpenAPI 2.0**. The "Swagger" brand stays with the tooling; "OpenAPI" is the spec.
- **2017** — OpenAPI 3.0 ships with a cleaner component model, better content-type support, links, callbacks.
- **2021** — OpenAPI 3.1, full JSON Schema 2020-12 alignment.

### 2.2 A worked OpenAPI 3.1 example

```yaml
openapi: 3.1.0
info:
  title: Petstore API
  version: 1.0.0
  description: |
    A tiny pet store API, used as the canonical OpenAPI example since 2011.
  contact:
    name: API team
    email: api@petstore.example.com
  license:
    name: Apache-2.0
    identifier: Apache-2.0
servers:
  - url: https://api.petstore.example.com/v1
    description: Production
  - url: https://staging.petstore.example.com/v1
    description: Staging
tags:
  - name: pets
    description: Operations on pets
  - name: orders
    description: Operations on orders

paths:
  /pets:
    get:
      tags: [pets]
      summary: List pets
      operationId: listPets
      parameters:
        - name: limit
          in: query
          description: Max number of items to return
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: cursor
          in: query
          description: Opaque pagination cursor
          required: false
          schema:
            type: string
      responses:
        '200':
          description: A paged list of pets
          headers:
            X-RateLimit-Remaining:
              schema: { type: integer }
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PetList'
              examples:
                typical:
                  value:
                    items:
                      - id: 1
                        name: Fluffy
                        species: cat
                    nextCursor: null
        '429':
          $ref: '#/components/responses/RateLimited'
        default:
          $ref: '#/components/responses/Error'
    post:
      tags: [pets]
      summary: Create a pet
      operationId: createPet
      security:
        - bearerAuth: [write:pets]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewPet'
      responses:
        '201':
          description: Created
          headers:
            Location:
              schema: { type: string, format: uri-reference }
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '400':
          $ref: '#/components/responses/BadRequest'

  /pets/{petId}:
    parameters:
      - name: petId
        in: path
        required: true
        schema:
          type: integer
          format: int64
    get:
      tags: [pets]
      summary: Get a pet by ID
      operationId: getPet
      responses:
        '200':
          description: A pet
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '404':
          $ref: '#/components/responses/NotFound'
    patch:
      tags: [pets]
      summary: Partial update
      operationId: updatePet
      requestBody:
        required: true
        content:
          application/merge-patch+json:
            schema:
              $ref: '#/components/schemas/PetPatch'
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
    delete:
      tags: [pets]
      summary: Delete a pet
      operationId: deletePet
      responses:
        '204':
          description: No Content

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Pet:
      type: object
      required: [id, name, species]
      properties:
        id:
          type: integer
          format: int64
          readOnly: true
        name:
          type: string
          minLength: 1
          maxLength: 200
        species:
          type: string
          enum: [cat, dog, fish, bird, reptile, other]
        tags:
          type: array
          items:
            type: string
          uniqueItems: true
        createdAt:
          type: string
          format: date-time
          readOnly: true
    NewPet:
      type: object
      required: [name, species]
      properties:
        name: { $ref: '#/components/schemas/Pet/properties/name' }
        species: { $ref: '#/components/schemas/Pet/properties/species' }
        tags: { $ref: '#/components/schemas/Pet/properties/tags' }
    PetPatch:
      type: object
      properties:
        name: { $ref: '#/components/schemas/Pet/properties/name' }
        tags: { $ref: '#/components/schemas/Pet/properties/tags' }
    PetList:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/Pet'
        nextCursor:
          type: string
          nullable: true
    Error:
      type: object
      required: [code, message]
      properties:
        code: { type: string }
        message: { type: string }
        details:
          type: object
          additionalProperties: true
  responses:
    BadRequest:
      description: Bad request
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/Error' }
    NotFound:
      description: Not found
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/Error' }
    RateLimited:
      description: Too many requests
      headers:
        Retry-After:
          schema: { type: integer }
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/Error' }
    Error:
      description: Generic error
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/Error' }
```

### 2.3 Tooling

- **Swagger UI** — the in-browser documentation viewer. Most teams have one of these at `/docs` or `/swagger`.
- **Swagger Codegen** — the original code generator. Superseded by…
- **OpenAPI Generator** — community fork (2018) that is now the de facto generator. Supports 50+ languages and frameworks.
- **Stoplight** — commercial design-first studio, forever-free tier.
- **Redocly / Redoc** — alternative docs renderer, nicer aesthetic, enterprise linting tools (`redocly lint`, `redocly join`).
- **SwaggerHub** — SmartBear's commercial collaborative design hub.
- **Prism** (Stoplight) — mock server from an OpenAPI document.
- **Dredd** — contract testing, validates a real server against the spec.
- **Spectral** — OpenAPI linter with custom rulesets (Stoplight, MIT-licensed).
- **OpenAPI DevTools** — Chrome extension that generates OpenAPI from observed network traffic.

### 2.4 Contract-first vs code-first

**Contract-first** (design-first): you write the OpenAPI YAML; then you generate server stubs and client SDKs from it. Stripe, Twilio, Adyen, and most large API providers do this. The spec is the single source of truth, it is reviewed like code, and it is versioned in git.

**Code-first** (annotation-driven): you write the code with decorators/annotations (`@ApiOperation`, `@Get("/users/{id}")`), and a library extracts an OpenAPI document at runtime or build time. Spring's `springdoc-openapi`, FastAPI, NestJS, and Go's `swag` work this way. It's faster for small teams but harder to keep in sync once multiple clients depend on the spec.

Example — FastAPI generates OpenAPI 3.1 automatically:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

app = FastAPI(title="Petstore", version="1.0.0")

class Pet(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=200)
    species: Literal["cat", "dog", "fish", "bird", "reptile", "other"]

@app.get("/pets/{pet_id}", response_model=Pet, tags=["pets"])
def get_pet(pet_id: int) -> Pet:
    pet = db.get(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="not found")
    return pet
```

FastAPI mounts Swagger UI at `/docs` and ReDoc at `/redoc` automatically.

### 2.5 The "API-first" movement

Companies like Stripe, Twilio, SendGrid, Plaid, and Adyen built their whole business model around the API being the product. "API-first" as a philosophy means:

1. Design the API *before* any implementation exists.
2. Treat the spec as the contract with your customers.
3. Version the spec with strict semantic meaning.
4. Ship SDKs generated from the spec in every major language.
5. Documentation, sandbox, and client libraries are part of the API, not afterthoughts.

Stripe's public "API versioning" model is the reference implementation: they version by date (`2024-06-20`), keep old versions working for years, and upgrade customers lazily. Internally they pass every request through a "version compatibility" layer that reshapes responses to match the caller's requested version.

### 2.6 OpenAPI's weaknesses

- **Async**. OpenAPI describes request/response. It has no natural way to describe "client subscribes to Kafka topic X, receives events of shape Y." That gap is what AsyncAPI fills.
- **Streaming**. Server-sent events, long-poll, WebSockets, and gRPC streaming are second-class citizens at best. OpenAPI 3.1's `text/event-stream` support is minimal.
- **Non-HTTP**. MQTT, AMQP, WebSockets, raw TCP — not in scope.
- **Schema reuse across protocols**. If the same event appears as a REST response, a Kafka message, and a gRPC field, you get to write (or generate) it three times.

---

## 3. AsyncAPI — OpenAPI for Async

### 3.1 Origin: Fran Méndez (2016)

Fran Méndez started AsyncAPI in 2016 out of the same frustration: OpenAPI couldn't describe his event-driven systems. He wanted a spec that did for Kafka, MQTT, and AMQP what Swagger did for REST. AsyncAPI 1.0 shipped in 2017; it was intentionally modeled on OpenAPI so humans and tools could recognize the shape.

- **2017** — AsyncAPI 1.x (Slack-style format).
- **2019** — AsyncAPI 2.0 (large refactor, multi-protocol bindings, message traits).
- **2023** — AsyncAPI 3.0 (separate `channels` and `operations`, cleaner model for send/receive direction).
- **2020** — Joins the Linux Foundation as a neutral home.

### 3.2 A worked AsyncAPI 3.0 example

```yaml
asyncapi: 3.0.0
info:
  title: Order Events
  version: 1.0.0
  description: Events published when an order progresses through fulfilment.
servers:
  production:
    host: kafka.prod.svc.cluster.local:9092
    protocol: kafka
    description: Production Kafka cluster
    security:
      - $ref: '#/components/securitySchemes/saslScram'

channels:
  orderCreated:
    address: orders.v1.created
    messages:
      orderCreatedMessage:
        $ref: '#/components/messages/OrderCreated'
    description: |
      Emitted once per new order. Partitioned by customerId to preserve
      per-customer ordering. Retention: 7 days, cleanup.policy=delete.
    bindings:
      kafka:
        topic: orders.v1.created
        partitions: 32
        replicas: 3

  orderShipped:
    address: orders.v1.shipped
    messages:
      orderShippedMessage:
        $ref: '#/components/messages/OrderShipped'

operations:
  publishOrderCreated:
    action: send
    channel:
      $ref: '#/channels/orderCreated'
    summary: Publish an order-created event.
    messages:
      - $ref: '#/channels/orderCreated/messages/orderCreatedMessage'

  consumeOrderCreated:
    action: receive
    channel:
      $ref: '#/channels/orderCreated'
    summary: Consume new-order events for fulfilment.
    messages:
      - $ref: '#/channels/orderCreated/messages/orderCreatedMessage'

components:
  messages:
    OrderCreated:
      name: OrderCreated
      title: Order Created
      contentType: application/cloudevents+json
      headers:
        type: object
        properties:
          ce_id: { type: string, format: uuid }
          ce_source: { type: string, format: uri }
          ce_type: { type: string, const: com.example.orders.created.v1 }
          ce_time: { type: string, format: date-time }
      payload:
        $ref: '#/components/schemas/Order'

    OrderShipped:
      name: OrderShipped
      contentType: application/cloudevents+json
      payload:
        $ref: '#/components/schemas/Shipment'

  schemas:
    Order:
      type: object
      required: [orderId, customerId, total, currency, createdAt]
      properties:
        orderId: { type: string, format: uuid }
        customerId: { type: string }
        total: { type: number, minimum: 0 }
        currency: { type: string, pattern: '^[A-Z]{3}$' }
        items:
          type: array
          items:
            type: object
            required: [sku, quantity, price]
            properties:
              sku: { type: string }
              quantity: { type: integer, minimum: 1 }
              price: { type: number, minimum: 0 }
        createdAt: { type: string, format: date-time }

    Shipment:
      type: object
      required: [orderId, carrier, trackingNumber, shippedAt]
      properties:
        orderId: { type: string, format: uuid }
        carrier: { type: string, enum: [usps, ups, fedex, dhl] }
        trackingNumber: { type: string }
        shippedAt: { type: string, format: date-time }

  securitySchemes:
    saslScram:
      type: scramSha512
```

### 3.3 Tooling

- **AsyncAPI Generator** — code and documentation generator.
- **Studio** — online AsyncAPI editor with live preview.
- **Microcks** — open-source mocking, testing, and contract-validation for OpenAPI + AsyncAPI + gRPC + GraphQL. CNCF sandbox.
- **SpecMesh** — Kafka governance using AsyncAPI as the topic contract.
- **Modelina** — model generator (the core engine powering the Generator).

AsyncAPI's real value is organizational: it gives event-driven teams a review artifact that the "events team" and the "API team" can share. Before AsyncAPI, Kafka topics lived in undocumented tribal knowledge.

---

## 4. gRPC — Google's RPC Framework

### 4.1 Origin: Stubby → gRPC

Google had an internal RPC framework called **Stubby** since approximately 2001, running over a custom TCP protocol and Protocol Buffers. Stubby handled tens of billions of RPCs per second internally but was never shipped externally — it was tied to Google's internal infrastructure.

In 2015, Google released **gRPC** as the public, open-source successor. gRPC kept Stubby's core idea (Protobuf IDL, code generation, first-class deadlines and cancellation, streaming) but put it on HTTP/2 so it could traverse the public internet and interoperate with standard infrastructure. Varun Talwar was the product manager who drove the public launch; Louis Ryan was the tech lead. gRPC joined the CNCF in 2017 and is now a CNCF graduated project.

### 4.2 The four call types

gRPC supports four call shapes, all expressed naturally in a `.proto` file:

1. **Unary** — one request, one response. Like a function call.
2. **Server streaming** — one request, many responses. Good for server-sent updates.
3. **Client streaming** — many requests, one response. Good for uploads.
4. **Bidirectional streaming** — many requests, many responses, interleaved. Good for chat, real-time collaboration, and gaming.

All four run over HTTP/2 streams. HTTP/2's multiplexing means a single TCP connection can carry hundreds of concurrent gRPC calls with no head-of-line blocking.

### 4.3 A worked `.proto` file

```protobuf
syntax = "proto3";

package petstore.v1;

option go_package = "github.com/example/petstore/gen/go/petstore/v1;petstorev1";
option java_multiple_files = true;
option java_package = "com.example.petstore.v1";

import "google/protobuf/timestamp.proto";
import "google/protobuf/field_mask.proto";
import "google/protobuf/empty.proto";

// PetService is the primary service for the pet store.
service PetService {
  // Unary: get a single pet.
  rpc GetPet(GetPetRequest) returns (Pet);

  // Unary: create a pet.
  rpc CreatePet(CreatePetRequest) returns (Pet);

  // Unary: partial update using a FieldMask.
  rpc UpdatePet(UpdatePetRequest) returns (Pet);

  // Server streaming: subscribe to pet events.
  rpc WatchPets(WatchPetsRequest) returns (stream PetEvent);

  // Client streaming: bulk upload pets.
  rpc BulkCreatePets(stream CreatePetRequest) returns (BulkCreateSummary);

  // Bidi streaming: live chat with a veterinarian.
  rpc VetChat(stream ChatMessage) returns (stream ChatMessage);
}

enum Species {
  SPECIES_UNSPECIFIED = 0;
  SPECIES_CAT = 1;
  SPECIES_DOG = 2;
  SPECIES_FISH = 3;
  SPECIES_BIRD = 4;
  SPECIES_REPTILE = 5;
  SPECIES_OTHER = 99;
}

message Pet {
  int64 id = 1;
  string name = 2;
  Species species = 3;
  repeated string tags = 4;
  google.protobuf.Timestamp created_at = 5;
  google.protobuf.Timestamp updated_at = 6;
}

message GetPetRequest {
  int64 id = 1;
}

message CreatePetRequest {
  Pet pet = 1;
}

message UpdatePetRequest {
  Pet pet = 1;
  google.protobuf.FieldMask update_mask = 2;
}

message WatchPetsRequest {
  repeated Species species_filter = 1;
}

message PetEvent {
  enum Kind {
    KIND_UNSPECIFIED = 0;
    KIND_CREATED = 1;
    KIND_UPDATED = 2;
    KIND_DELETED = 3;
  }
  Kind kind = 1;
  Pet pet = 2;
  google.protobuf.Timestamp occurred_at = 3;
}

message BulkCreateSummary {
  int32 created = 1;
  int32 failed = 2;
  repeated string error_messages = 3;
}

message ChatMessage {
  string sender = 1;
  string text = 2;
  google.protobuf.Timestamp sent_at = 3;
}
```

### 4.4 A worked Python gRPC server

```python
# petstore_server.py
import asyncio
from concurrent import futures
import grpc
from google.protobuf import timestamp_pb2

import petstore_pb2 as pb
import petstore_pb2_grpc as rpc

class PetStore(rpc.PetServiceServicer):
    def __init__(self):
        self._pets: dict[int, pb.Pet] = {}
        self._next_id = 1
        self._watchers: list[asyncio.Queue] = []

    async def GetPet(self, request: pb.GetPetRequest, context):
        pet = self._pets.get(request.id)
        if pet is None:
            await context.abort(grpc.StatusCode.NOT_FOUND, f"pet {request.id} not found")
        return pet

    async def CreatePet(self, request: pb.CreatePetRequest, context):
        pet = pb.Pet()
        pet.CopyFrom(request.pet)
        pet.id = self._next_id
        self._next_id += 1
        now = timestamp_pb2.Timestamp()
        now.GetCurrentTime()
        pet.created_at.CopyFrom(now)
        pet.updated_at.CopyFrom(now)
        self._pets[pet.id] = pet
        await self._broadcast(pb.PetEvent(kind=pb.PetEvent.KIND_CREATED, pet=pet, occurred_at=now))
        return pet

    async def WatchPets(self, request: pb.WatchPetsRequest, context):
        queue: asyncio.Queue = asyncio.Queue()
        self._watchers.append(queue)
        try:
            while True:
                # respect cancellation / deadline:
                if context.cancelled():
                    return
                event = await queue.get()
                if request.species_filter and event.pet.species not in request.species_filter:
                    continue
                yield event
        finally:
            self._watchers.remove(queue)

    async def BulkCreatePets(self, request_iterator, context):
        created = 0
        failed = 0
        errors: list[str] = []
        async for req in request_iterator:
            try:
                await self.CreatePet(req, context)
                created += 1
            except Exception as e:
                failed += 1
                errors.append(str(e))
        return pb.BulkCreateSummary(created=created, failed=failed, error_messages=errors)

    async def VetChat(self, request_iterator, context):
        async for msg in request_iterator:
            reply = pb.ChatMessage(sender="vet", text=f"Got: {msg.text}")
            reply.sent_at.GetCurrentTime()
            yield reply

    async def _broadcast(self, event: pb.PetEvent):
        for q in list(self._watchers):
            await q.put(event)


async def serve():
    server = grpc.aio.server()
    rpc.add_PetServiceServicer_to_server(PetStore(), server)
    server.add_insecure_port("[::]:50051")
    await server.start()
    print("gRPC server listening on :50051")
    await server.wait_for_termination()


if __name__ == "__main__":
    asyncio.run(serve())
```

### 4.5 A worked Python gRPC client

```python
# petstore_client.py
import asyncio
import grpc
import petstore_pb2 as pb
import petstore_pb2_grpc as rpc

async def main():
    async with grpc.aio.insecure_channel("localhost:50051") as chan:
        stub = rpc.PetServiceStub(chan)

        # Unary call with a deadline
        pet = await stub.CreatePet(
            pb.CreatePetRequest(pet=pb.Pet(name="Fluffy", species=pb.SPECIES_CAT)),
            timeout=5.0,
            metadata=(("authorization", "Bearer xyz"), ("x-request-id", "abc-123")),
        )
        print("created:", pet.id, pet.name)

        # Server-streaming subscription
        async def subscribe():
            async for event in stub.WatchPets(pb.WatchPetsRequest()):
                print("event:", pb.PetEvent.Kind.Name(event.kind), event.pet.name)
        task = asyncio.create_task(subscribe())

        # Bidi streaming chat
        async def chat_requests():
            for text in ["hi", "my cat is sick", "thanks"]:
                yield pb.ChatMessage(sender="user", text=text)
        async for reply in stub.VetChat(chat_requests()):
            print("vet:", reply.text)

        await asyncio.sleep(2)
        task.cancel()

asyncio.run(main())
```

### 4.6 HTTP/2 as the transport

HTTP/2 brought four critical things that enabled gRPC:

1. **Streams**. A single TCP connection carries many concurrent streams. gRPC maps one RPC to one stream.
2. **Multiplexing without head-of-line blocking**. In HTTP/1.1, a slow response blocked all subsequent requests on the same connection, forcing browsers to open 6+ connections per host. HTTP/2 interleaves frames, so a slow RPC doesn't block a fast one.
3. **HPACK header compression**. Repeated headers (which is most of them in a service-to-service context) are compressed to a few bytes.
4. **Flow control**. Per-stream and per-connection windows let a slow consumer push back on a fast producer without hanging the whole connection.

A gRPC call is literally an HTTP/2 `POST` to `/package.Service/Method` with specific pseudo-headers, a `content-type: application/grpc+proto` header, and length-prefixed Protobuf messages in the body. You can see it on the wire with `h2i`, `nghttp`, or Wireshark.

### 4.7 Deadlines and cancellation

gRPC makes deadlines *mandatory in practice*. Every client call can carry a deadline (wall-clock time), which propagates through the call chain. If service A calls B with a 2s deadline, and B calls C, B must pass a deadline to C that's ≤ the remaining time. If any layer blows the deadline, the call is cancelled at every level, freeing resources upstream. This is the single biggest improvement over ad-hoc HTTP/REST retry loops.

```python
# Every call should have a deadline. "Forever" is almost always a bug.
pet = await stub.GetPet(pb.GetPetRequest(id=1), timeout=2.0)
```

### 4.8 Metadata, interceptors, status codes

Metadata is gRPC's analogue to HTTP headers — key/value pairs carried on each call. Interceptors are the middleware chain; they wrap calls on both client and server for cross-cutting concerns:

```python
class AuthInterceptor(grpc.aio.ServerInterceptor):
    async def intercept_service(self, continuation, handler_call_details):
        md = dict(handler_call_details.invocation_metadata)
        token = md.get("authorization", "")
        if not token.startswith("Bearer "):
            return await self._unauth()
        return await continuation(handler_call_details)
```

gRPC status codes are a fixed enum (OK, CANCELLED, UNKNOWN, INVALID_ARGUMENT, DEADLINE_EXCEEDED, NOT_FOUND, ALREADY_EXISTS, PERMISSION_DENIED, RESOURCE_EXHAUSTED, FAILED_PRECONDITION, ABORTED, OUT_OF_RANGE, UNIMPLEMENTED, INTERNAL, UNAVAILABLE, DATA_LOSS, UNAUTHENTICATED). The HTTP `404 vs 410` argument doesn't happen in gRPC land; you use `NOT_FOUND` or you don't.

### 4.9 gRPC-Web and gRPC Gateway

gRPC can't run directly in browsers because browsers don't expose raw HTTP/2 streams. Two bridges:

- **gRPC-Web** — a translating proxy (Envoy or grpcwebproxy) that accepts a browser-compatible request over HTTP/1.1 or HTTP/2 and forwards it as native gRPC.
- **gRPC Gateway** — a Go library that reads Google API annotations in your `.proto` and generates a REST+JSON facade over your gRPC server:

```protobuf
import "google/api/annotations.proto";

service PetService {
  rpc GetPet(GetPetRequest) returns (Pet) {
    option (google.api.http) = {
      get: "/v1/pets/{id}"
    };
  }
  rpc CreatePet(CreatePetRequest) returns (Pet) {
    option (google.api.http) = {
      post: "/v1/pets"
      body: "pet"
    };
  }
}
```

### 4.10 Connect (buf.build)

Connect is Buf's 2022 "modern gRPC" protocol. It runs on HTTP/1.1 and HTTP/2, works natively in browsers, is wire-compatible with gRPC, and drops some of gRPC's historical baggage (trailers, 1.1 incompatibility). If you're starting a new service in 2026 and your client includes a browser, Connect is easier. If all your clients are other services, stock gRPC is still fine.

### 4.11 Why gRPC won service-to-service

1. Code generation in every language → no hand-written JSON serialization.
2. Binary wire format is ~5x smaller than JSON and much faster to parse.
3. Mandatory deadlines prevent classic "cascading hang" failures.
4. Streaming is first-class, not bolted on.
5. Protobuf schemas enforce backward compatibility by construction (field numbers).
6. It plays nicely with Envoy, Istio, and Kubernetes — the whole cloud-native stack understands it.

REST is still king at the edge (browsers, public APIs, webhooks). gRPC owns the interior.

---

## 5. Protocol Buffers as a Contract Language

### 5.1 Origin

Protobuf started at Google in 2001 as an internal serialization format, open-sourced in 2008 as **proto2**. It was built to solve the same problem as XML Schema and ASN.1: strongly typed structured data that could evolve over time without breaking old clients.

### 5.2 proto2 vs proto3

- **proto2** had explicit `required`, `optional`, and `repeated` modifiers. `required` turned out to be a disaster — once a message had a required field, you could never remove it without breaking every client. Never use `required`.
- **proto3** (2016) removed `required` entirely. All scalar fields are implicitly optional with a default "zero value" (0, "", false). Added native JSON mapping, removed some legacy features.
- **proto3 optional** (2020) re-added explicit `optional` (without the required/not-required distinction) for "field presence" — the ability to distinguish "not set" from "set to zero."

### 5.3 Wire format: field numbers and varints

Every field has a **number** (not a name) that is the identity on the wire. Names are compiler hints; numbers are the contract.

```
field 1 (Pet.id) → wire tag 0x08 (field 1, varint) → followed by varint-encoded value
```

Varint encoding uses 7 bits per byte for the value and the top bit as a continuation flag, so small integers take 1 byte and negative numbers take 10. `sint32` uses zigzag encoding to make small negatives also small on the wire.

Wire types (the low 3 bits of the tag):

- 0: varint (int32, int64, uint32, uint64, bool, enum, sint32, sint64)
- 1: 64-bit fixed (fixed64, sfixed64, double)
- 2: length-delimited (string, bytes, embedded messages, packed repeated)
- 5: 32-bit fixed (fixed32, sfixed32, float)

### 5.4 Backward-compatibility rules

Protobuf's entire value proposition is schema evolution. The rules:

1. **Never change a field's number.** The number is the identity.
2. **Never reuse a removed field's number.** Mark it `reserved`.
3. **Never change a field's type** (with a few safe exceptions: int32↔int64↔uint32↔uint64 for values ≤ 2³¹, fixed32↔sfixed32, fixed64↔sfixed64, bytes↔string iff the bytes are valid UTF-8).
4. **Adding new fields is safe.** Old clients ignore unknown fields.
5. **Removing a field is safe iff you `reserved` its number and name.**
6. **Renaming is safe on the wire but breaks generated code.** Treat it as a source-code break.
7. **Changing between `repeated` and `optional` scalar** is generally unsafe for packed encoding.

```protobuf
message Pet {
  reserved 4, 6 to 8;
  reserved "color", "legacy_tags";

  int64 id = 1;
  string name = 2;
  Species species = 3;
  // field 4 was `string color`, removed 2023-04
  google.protobuf.Timestamp created_at = 5;
  // fields 6,7,8 were the old tags subtree, removed 2024-01
  string owner_email = 9;
}
```

### 5.5 Well-known types

Google ships `google/protobuf/*.proto` with common types you should reuse rather than reinventing:

- `Timestamp`, `Duration` — time and durations.
- `Empty` — for RPCs that need no request or no response.
- `Any` — an escape hatch that carries a type URL + serialized bytes (the polymorphism trapdoor).
- `FieldMask` — a list of field paths, used for `PATCH`-style partial updates.
- `Struct`, `Value`, `ListValue` — dynamic JSON-like structures.
- `BoolValue`, `Int32Value`, `StringValue`, etc. — the "nullable scalar" wrappers, historically used before proto3 optional existed.

FieldMask is important enough to show:

```protobuf
message UpdatePetRequest {
  Pet pet = 1;
  google.protobuf.FieldMask update_mask = 2;
}
```

The client sends `update_mask = ["name", "species"]` and only those fields are written on the server, exactly like HTTP `PATCH` semantics.

### 5.6 buf.build and the Protobuf tooling revival

For a decade, `protoc` was the only game in town, with a painful plugin model and no dependency management. **Buf** (founded by Peter Edge and others, 2019) built a modern toolchain:

- **`buf build`** — compile without needing a protoc binary.
- **`buf lint`** — idiomatic style rules with specific, actionable errors.
- **`buf breaking`** — detects breaking changes by comparing against a reference (e.g., git's `main` branch). Backs the rules in §5.4 with CI enforcement.
- **`buf.gen.yaml`** — a declarative config for code generation across languages.
- **Buf Schema Registry (BSR)** — hosted schema registry with versioning, dependency resolution, and generated SDK publishing.

A typical `buf.yaml`:

```yaml
version: v2
modules:
  - path: proto
lint:
  use:
    - STANDARD
  except:
    - PACKAGE_VERSION_SUFFIX
breaking:
  use:
    - FILE
```

And `buf.gen.yaml`:

```yaml
version: v2
plugins:
  - remote: buf.build/protocolbuffers/go:v1.34.2
    out: gen/go
    opt: paths=source_relative
  - remote: buf.build/grpc/go:v1.5.1
    out: gen/go
    opt: paths=source_relative
  - remote: buf.build/protocolbuffers/python:v27.2
    out: gen/python
  - remote: buf.build/connectrpc/es:v1.5.0
    out: gen/ts
    opt: target=ts
```

In CI:

```bash
buf lint
buf breaking --against '.git#branch=main'
buf build
buf generate
```

### 5.7 Schema registries

When you publish events on Kafka, you want a central place where every producer and consumer agrees on what the message looks like.

- **Confluent Schema Registry** — the original, supports Avro, Protobuf, and JSON Schema, integrates with Kafka clients via the `schema.registry.url` config.
- **Buf Schema Registry** — Protobuf-only, module-versioned, works with both RPC and Kafka.
- **Apicurio** — Red Hat's open-source alternative, API-compatible with Confluent.
- **AWS Glue Schema Registry**, **GCP Schema Registry** — cloud-native alternatives.

The pattern: each message includes a magic byte + 4-byte schema ID as a prefix. Consumers fetch the schema by ID (and cache it) before decoding the payload. This gives you safe schema evolution across producers and consumers that deploy independently.

---

## 6. GraphQL

### 6.1 Origin

Facebook built GraphQL internally in 2012 to solve the "mobile app needs 12 different REST calls to render one screen" problem. Lee Byron, Dan Schafer, and Nick Schrock were the primary designers. It was open-sourced in 2015 (the reference implementation `graphql-js`), moved to the GraphQL Foundation under the Linux Foundation in 2018, and is governed as a spec today.

### 6.2 The core idea

A single endpoint (`POST /graphql`), a typed schema, and the client writes a query describing *exactly* what shape of data it wants. The server walks the query, resolves each field, and returns a matching shape. No over-fetching, no under-fetching, no "give me the 18 fields I asked for and 47 I didn't care about."

### 6.3 A worked schema

```graphql
# schema.graphql

scalar DateTime
scalar UUID

type Pet {
  id: ID!
  name: String!
  species: Species!
  tags: [String!]!
  owner: User
  createdAt: DateTime!
  recentEvents(limit: Int = 10): [PetEvent!]!
}

enum Species {
  CAT
  DOG
  FISH
  BIRD
  REPTILE
  OTHER
}

type User {
  id: ID!
  email: String!
  pets: [Pet!]!
}

type PetEvent {
  id: UUID!
  kind: PetEventKind!
  occurredAt: DateTime!
}

enum PetEventKind {
  CHECKUP
  VACCINATION
  GROOMING
  EMERGENCY
}

type Query {
  pet(id: ID!): Pet
  pets(species: Species, limit: Int = 20, after: String): PetConnection!
  me: User
}

type PetConnection {
  edges: [PetEdge!]!
  pageInfo: PageInfo!
}

type PetEdge {
  node: Pet!
  cursor: String!
}

type PageInfo {
  endCursor: String
  hasNextPage: Boolean!
}

input CreatePetInput {
  name: String!
  species: Species!
  tags: [String!]
}

type CreatePetPayload {
  pet: Pet!
  clientMutationId: String
}

type Mutation {
  createPet(input: CreatePetInput!): CreatePetPayload!
  deletePet(id: ID!): Boolean!
}

type Subscription {
  petEvents(petId: ID!): PetEvent!
}
```

### 6.4 A worked query

```graphql
query PetDashboard($id: ID!) {
  pet(id: $id) {
    id
    name
    species
    tags
    owner {
      email
      pets {            # related pets, in the same request
        id
        name
      }
    }
    recentEvents(limit: 5) {
      kind
      occurredAt
    }
  }
}
```

Variables:

```json
{ "id": "Pet:1" }
```

Response matches the query shape exactly:

```json
{
  "data": {
    "pet": {
      "id": "Pet:1",
      "name": "Fluffy",
      "species": "CAT",
      "tags": ["indoor", "calico"],
      "owner": {
        "email": "alice@example.com",
        "pets": [
          {"id": "Pet:1", "name": "Fluffy"},
          {"id": "Pet:2", "name": "Mittens"}
        ]
      },
      "recentEvents": [
        {"kind": "CHECKUP", "occurredAt": "2025-11-12T14:00:00Z"}
      ]
    }
  }
}
```

### 6.5 The N+1 problem and DataLoader

The N+1 problem: resolving `owner` for 100 pets naively fires 100 database calls (one per pet). GraphQL's resolver model makes this trivially easy to get wrong.

**DataLoader** (Lee Byron, 2016) is the canonical fix: it batches and de-duplicates calls within a single request tick. You register a batch function `fn ids => rows`; DataLoader coalesces all `load(id)` calls in the same tick into one call.

```javascript
// Node.js, Apollo Server
import DataLoader from "dataloader";

const userLoader = new DataLoader(async (ids) => {
  const rows = await db.query(
    "SELECT * FROM users WHERE id = ANY($1::int[])", [ids]
  );
  const byId = new Map(rows.map(r => [r.id, r]));
  return ids.map(id => byId.get(id) || null);
});

const resolvers = {
  Pet: {
    owner: (pet, _args, ctx) => ctx.userLoader.load(pet.ownerId),
  },
};
```

Without DataLoader, GraphQL is unusable at scale. With it, you still have to think about it in every new resolver. This is the hidden operational cost.

### 6.6 GraphQL servers and clients

Servers:
- **Apollo Server** (JS/TS) — the dominant reference.
- **graphql-java**, **Sangria** (Scala), **Juniper** (Rust), **gqlgen** (Go), **Ariadne** / **Strawberry** / **Graphene** (Python).
- **Hasura** — generates a GraphQL API directly from a Postgres schema.
- **PostGraphile** — same idea, also Postgres-first.
- **Netflix DGS** — Spring Boot + GraphQL with strong opinions.
- **WunderGraph** — "composition router," unifies REST/gRPC/GraphQL as one graph.

Clients:
- **Apollo Client**, **Relay** (Meta's original, highly opinionated), **urql**, **graphql-request** (minimalist).

### 6.7 Federation

Microservices break GraphQL's "one schema" model. **Apollo Federation** (2019) is the answer: each service owns a slice of the schema, declares the types it contributes and the external types it extends, and a **router** (the Apollo Router, written in Rust) plans queries across the subgraphs.

```graphql
# Users subgraph
type User @key(fields: "id") {
  id: ID!
  email: String!
}

# Pets subgraph
extend type User @key(fields: "id") {
  id: ID! @external
  pets: [Pet!]!
}

type Pet @key(fields: "id") {
  id: ID!
  name: String!
}
```

The router receives a query that spans both subgraphs, plans which subgraph gets which part, fires the subqueries, and stitches the result.

### 6.8 The honest story on GraphQL

- **Where it wins**: mobile apps with diverse screens, BFF (Backend-for-Frontend) layers, any client that needs to compose data from multiple sources. Netflix, Shopify, GitHub, Facebook, Airbnb.
- **Where it loses**: public APIs (hard to cache at the CDN level because every query is a POST with a unique body), simple CRUD apps, systems that need strong per-field rate limiting, systems where query cost is hard to bound. GitHub's v4 API famously needed a query-complexity calculator to prevent abuse.
- **The operational cost**: query complexity analysis, depth limiting, persisted queries (hash a query, store it server-side, clients send only the hash), field-level authorization, full-request tracing because a single query can touch 30 backend services.

GraphQL is a *specific-case* win, not a REST replacement. Teams that treat it as "REST but better" often regret it.

---

## 7. Microservices — Fowler & Lewis (2014)

### 7.1 The canonical article

Martin Fowler and James Lewis published "Microservices" on martinfowler.com on **March 25, 2014**. It was the moment a decade of scattered practice — Netflix's OSS, Amazon's two-pizza teams, Spotify's "squads," ThoughtWorks' service-oriented consulting — got a shared vocabulary.

The authors explicitly said they were **describing** what they saw, not prescribing a silver bullet. The article's tone is a cautious "here's what this pattern is, here's what it does well, here's what you'll pay for it."

### 7.2 Nine characteristics

1. **Componentization via services.** Services are components with out-of-process boundaries. You can't accidentally share state via a function call.
2. **Organized around business capabilities.** Teams are structured around business domains ("orders," "billing," "recommendations"), not technical layers ("DBAs," "UI," "middleware"). Conway's law is assumed and *used*.
3. **Products not projects.** "You build it, you run it." The team that ships a service owns it in production, forever.
4. **Smart endpoints and dumb pipes.** The anti-ESB principle. Intelligence lives in the services; the network is "just HTTP" (or Kafka, or whatever). No BPEL, no orchestration engines, no XSLT on the wire.
5. **Decentralized governance.** Each team picks the language, framework, and data store that fits their problem. There is no "approved tech stack" committee.
6. **Decentralized data management.** Every service owns its own database. No shared schema. Cross-service consistency is handled with sagas, events, or eventual consistency — not with XA transactions.
7. **Infrastructure automation.** CI/CD, automated tests, blue/green deploys. The operational cost of N services is only manageable if deployment is a non-event.
8. **Design for failure.** Assume every remote call will fail. Retries, circuit breakers, bulkheads, timeouts, fallbacks. Chaos engineering.
9. **Evolutionary design.** Services are expected to be replaced. They are not monuments; they are versioned, decommissioned, split, merged.

### 7.3 "Smart endpoints and dumb pipes" — the anti-ESB principle

The older enterprise SOA world put huge amounts of logic in the "bus" — transformations, orchestration, routing, business rules. Fowler and Lewis explicitly rejected this. The network is a transport. Intelligence belongs in the services themselves.

This is why a modern microservice architecture talks about HTTP, Kafka, and gRPC — transports — and not about BPEL, XSLT pipelines, or ESB workflows.

### 7.4 Adrian Cockcroft and Netflix as the public face

Adrian Cockcroft was Netflix's cloud architect from 2007-2014 and its public evangelist. His QCon and re:Invent talks ("Netflix Cloud Architecture," "Global Netflix Platform," "Monitoring Microservices") gave the industry real-world numbers on a microservice system running at Netflix scale: 700+ services, tens of thousands of instances, millions of requests per second. He moved to Battery Ventures, then AWS as VP of Cloud Architecture Strategy, then retired to OSS advocacy.

### 7.5 Sam Newman "Building Microservices"

Sam Newman's book **Building Microservices** (O'Reilly, 2015; 2nd ed. 2021) is the practitioner's manual. It covers:

- Service boundaries (domain-driven design, bounded contexts)
- Integration styles (REST, gRPC, async events)
- Splitting the monolith (strangler fig pattern)
- Deployment (one service per host, containers, orchestration)
- Testing (unit, integration, contract, end-to-end)
- Monitoring and observability
- Security (service-to-service auth, secrets)
- Conway's law and organizational design

Newman's follow-up, **Monolith to Microservices** (2019), is specifically about migration patterns — the strangler fig, change-data-capture to break the shared database, etc. By the 2021 second edition of *Building Microservices*, Newman was much more cautious, emphasizing that most teams should probably start with a monolith.

---

## 8. The Bezos API Mandate

### 8.1 The memo

In roughly 2002, Jeff Bezos sent an internal memo at Amazon. The most-quoted version (via Steve Yegge's 2011 "Google Platforms Rant" on Google+, now preserved in many places) reads approximately:

> 1. All teams will henceforth expose their data and functionality through service interfaces.
> 2. Teams must communicate with each other through these interfaces.
> 3. There will be no other form of interprocess communication allowed: no direct linking, no direct reads of another team's data store, no shared-memory model, no back-doors whatsoever. The only communication allowed is via service interface calls over the network.
> 4. It doesn't matter what technology they use. HTTP, Corba, Pubsub, custom protocols — doesn't matter.
> 5. All service interfaces, without exception, must be designed from the ground up to be externalizable. That is to say, the team must plan and design to be able to expose the interface to developers in the outside world. No exceptions.
> 6. Anyone who doesn't do this will be fired.
> 7. Thank you; have a nice day!

Steve Yegge clarified later that the exact wording is his recollection, but the *substance* — that Amazon mandated service interfaces, banned back-door database access, and required every interface to be "externalizable" — was real and documented internally.

### 8.2 Why it mattered

Point 5 is the one that changed the world. "Every service must be designed to be externalizable" meant that every internal interface had to handle authentication, authorization, rate limiting, versioning, and be documented well enough that an outsider could use it. That's an enormous engineering tax — and it's exactly what an AWS service looks like from the outside.

So when Amazon wanted to start selling infrastructure to third parties in 2006, they already had everything. S3, EC2, SQS, and DynamoDB were not "new APIs built on top of internal systems." They were the internal systems, exposed. The mandate *was* the AWS roadmap.

Werner Vogels (Amazon CTO from 2004) was the public enforcer. His famous blog post "A Word on Scalability" (2006) and the pattern language around "two-pizza teams" (each team small enough to feed with two pizzas, owning a service end-to-end) cemented the model.

### 8.3 Why this became the industry template

After AWS started printing money (by 2010 it was obviously the future), every serious engineering org studied the Amazon model. The structural pieces — small autonomous teams, each owning a service, each service behind a strong API contract, databases private to the owning team — became the default. "Bezos API Mandate" became shorthand for "we should probably do something like this."

---

## 9. The Netflix Migration (2008–2016)

### 9.1 The triggering incident

In August 2008, Netflix suffered a major database corruption event in its monolithic Oracle-based DVD-shipping system. They were offline for three days. The failure convinced the engineering leadership that they could not scale the monolith and could not rely on vertically scaled databases.

### 9.2 The decision to go to AWS

Netflix started moving to AWS in 2009 and completed the migration of its consumer-facing systems in 2015-2016 (the billing/DVD systems took longer). The decision was made in public through Adrian Cockcroft's talks and the Netflix Tech Blog. The logic was:

- Netflix's peak demand was 10x its trough (streaming peaks in the evenings), so paying for dedicated capacity was wasteful.
- AWS's rapid scale-out matched Netflix's traffic shape.
- Owning the infrastructure was not a differentiator; owning the content and recommendation systems was.

### 9.3 The Netflix OSS stack (circa 2013-2016)

Because AWS in 2011 didn't have mature answers to "how do you do service discovery" or "how do you do client-side load balancing," Netflix built their own and open-sourced them:

- **Eureka** — service registry. Services register themselves, clients look up instances.
- **Ribbon** — client-side load balancer. Picks an instance from Eureka, applies retry and failure policies.
- **Hystrix** — circuit breaker. Wraps a call with a timeout, a fallback, and a breaker that opens on repeated failures.
- **Zuul** — edge gateway. Dynamic routing, filtering, auth, rate limiting at the front door.
- **Archaius** — dynamic configuration. Hot-reloadable properties without restarting.
- **Atlas** — time-series monitoring at Netflix scale.
- **Spectator** — client library for emitting metrics to Atlas.
- **Chaos Monkey** (and later the **Simian Army**: Chaos Kong, Latency Monkey, Conformity Monkey, Janitor Monkey) — deliberately inject failures in production to verify resilience. The origin of chaos engineering as a discipline.

These tools were the *operational pattern* of microservices for 2013-2017. If you worked on a Java-based service team anywhere in tech, you probably used Hystrix.

### 9.4 The 2018+ supersession

Starting around 2018, the Netflix stack was quietly superseded by cloud-native alternatives:

- **Eureka → Kubernetes Services + DNS** (in-cluster service discovery).
- **Ribbon → Envoy / service mesh** (sidecar does the load balancing).
- **Hystrix → Envoy circuit breaker + retry policies** (in the mesh, not in your code).
- **Zuul → Envoy / API gateway / Istio Gateway**.
- **Archaius → Spring Cloud Config / Consul / ConfigMaps**.
- **Atlas → Prometheus + Grafana** (for most teams outside Netflix).

Netflix themselves announced Hystrix was in "maintenance mode" in 2018. The OSS cycle had done its job: the patterns were absorbed into the platform, and the libraries became optional.

---

## 10. Kubernetes as the Substrate

### 10.1 From Borg to Kubernetes

Google has run its production workloads on an internal cluster manager called **Borg** since approximately 2003 (paper published 2015 at EuroSys). Borg schedules hundreds of thousands of jobs across tens of thousands of machines, with tight bin-packing, preemption, and priority classes. A successor project called **Omega** explored a shared-state scheduler design (2013).

In 2014, Joe Beda, Brendan Burns, and Craig McLuckie at Google started an open-source project to take Borg's lessons to the outside world: **Kubernetes**. The name is Greek for "helmsman." The project was announced in June 2014, hit 1.0 in July 2015, and was immediately donated to the newly formed **Cloud Native Computing Foundation (CNCF)** under the Linux Foundation.

### 10.2 The core object model

Kubernetes is a declarative API: you describe the *desired state* as YAML objects, and controllers continuously reconcile the observed state toward the desired state. The fundamental objects:

- **Pod** — the smallest schedulable unit. One or more containers that share a network namespace and a volume set. Almost always 1 container + optional sidecars.
- **Service** — a stable virtual IP + DNS name that load-balances across a set of pods selected by labels.
- **Deployment** — manages a ReplicaSet that manages Pods. Supports rolling updates, rollback, scale.
- **StatefulSet** — like Deployment but for stateful pods with stable network identity and persistent volumes.
- **DaemonSet** — one pod per node (logging agents, node exporters, CNI plugins).
- **Job / CronJob** — one-shot and scheduled batch work.
- **ConfigMap / Secret** — configuration and sensitive data, mounted as env vars or files.
- **Ingress / Gateway** — L7 HTTP(S) entry points from outside the cluster.
- **PersistentVolume / PersistentVolumeClaim** — storage abstraction.
- **Namespace** — logical isolation and RBAC boundary.
- **Node** — a machine (VM or bare metal) running the kubelet.

### 10.3 A worked Deployment + Service + Ingress

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: petstore
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: petstore-api
  namespace: petstore
  labels: { app: petstore-api }
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels: { app: petstore-api }
  template:
    metadata:
      labels: { app: petstore-api }
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      serviceAccountName: petstore-api
      containers:
        - name: api
          image: ghcr.io/example/petstore-api:1.4.2
          ports:
            - { containerPort: 8080, name: http }
            - { containerPort: 9090, name: metrics }
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: petstore-db, key: url }
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef: { name: petstore-config, key: log_level }
          resources:
            requests: { cpu: 100m, memory: 256Mi }
            limits:   { cpu: 1,    memory: 512Mi }
          readinessProbe:
            httpGet: { path: /health/ready, port: http }
            periodSeconds: 5
          livenessProbe:
            httpGet: { path: /health/live, port: http }
            periodSeconds: 30
          startupProbe:
            httpGet: { path: /health/live, port: http }
            failureThreshold: 30
            periodSeconds: 2
          securityContext:
            runAsNonRoot: true
            runAsUser: 10001
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
            capabilities: { drop: ["ALL"] }
---
apiVersion: v1
kind: Service
metadata:
  name: petstore-api
  namespace: petstore
spec:
  type: ClusterIP
  selector: { app: petstore-api }
  ports:
    - { name: http,    port: 80,   targetPort: http }
    - { name: metrics, port: 9090, targetPort: metrics }
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: petstore-api
  namespace: petstore
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.petstore.example.com]
      secretName: petstore-api-tls
  rules:
    - host: api.petstore.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: petstore-api
                port: { name: http }
```

### 10.4 HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: petstore-api
  namespace: petstore
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: petstore-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }
    - type: Pods
      pods:
        metric: { name: http_requests_per_second }
        target: { type: AverageValue, averageValue: "500" }
```

### 10.5 Why Kubernetes became the default

- **Portable across clouds.** The same YAML runs on EKS, GKE, AKS, on-prem, or local kind/minikube.
- **Declarative and reconciling.** You describe the end state; the controllers handle the diff.
- **Extensible via CRDs.** Custom Resource Definitions let every piece of software ship its own controller (cert-manager, ArgoCD, Istio, Crossplane, Kafka operators, Postgres operators).
- **CNCF governance.** Vendor-neutral, huge ecosystem, no one company can take it away.
- **Ops-as-code.** Everything is a YAML file, version-controlled, PR-reviewed.

By 2019 Kubernetes had effectively won the container orchestration war (Docker Swarm, Nomad, and Mesos all faded). By 2022 it was the assumed substrate for new microservice deployments at any company larger than a startup.

### 10.6 The "cloud native" ecosystem

Around Kubernetes grew a whole toolchain:

- **Helm** — package manager for Kubernetes ("charts" = parameterized YAML bundles).
- **Kustomize** — overlay-based YAML patching, built into `kubectl`.
- **Argo CD / Flux** — GitOps controllers that sync a git repo to a cluster.
- **Crossplane** — declarative infrastructure provisioning via Kubernetes CRDs.
- **cert-manager** — automatic TLS certificate issuance.
- **External Secrets Operator** — syncs secrets from Vault, AWS Secrets Manager, etc.
- **KEDA** — event-driven autoscaling (scale from 0 on Kafka lag, queue depth, cron).
- **Karpenter** — fast node autoscaler (replaces cluster-autoscaler for many workloads).

---

## 11. Service Mesh

### 11.1 Origin: Linkerd (2016)

**Linkerd** was announced by Buoyant (William Morgan, CEO; Oliver Gould, CTO) in early 2016. Morgan gets credit for coining "service mesh" as a term. Linkerd 1.x was built on Finagle (the JVM RPC library from Twitter, where both founders had worked) and ran as a per-host proxy. Linkerd 2.x (2018) was a complete rewrite in Rust (data plane) and Go (control plane), optimized for Kubernetes.

### 11.2 The sidecar pattern

Every pod runs two containers: the application, and a small L7 proxy. The proxy is transparently injected into the pod's network namespace so that *all* traffic in and out of the app passes through it. The proxy handles:

- mTLS to other meshed pods (identity from SPIFFE/SPIRE or Kubernetes ServiceAccount)
- Load balancing with weighted routing
- Retries with budget control
- Timeouts
- Circuit breaking
- Rate limiting
- Traffic mirroring
- Fault injection for chaos testing
- Metrics emission (RED — Rate, Errors, Duration — per route)
- Distributed tracing spans

This moves a huge chunk of what Hystrix / Ribbon / Eureka / Zuul used to do *out of the application* and into the platform. Application code just makes a plain HTTP call; the mesh handles the rest.

### 11.3 Istio (2017)

**Istio** was announced by Google, IBM, and Lyft in May 2017. Data plane: **Envoy** (Lyft's proxy, 2016). Control plane: a set of Go services (originally Pilot, Mixer, Citadel, Galley; consolidated into `istiod` in 1.5).

Istio 1.0 shipped in 2018. It was initially very complex — Mixer was a performance bottleneck, the control plane had four components, and upgrades were fragile. The 1.5 consolidation (2020) and the subsequent "Ambient Mesh" redesign (2022) have made it much more manageable.

### 11.4 A worked Istio VirtualService

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: petstore-api
  namespace: petstore
spec:
  hosts:
    - petstore-api
  http:
    # canary: 5% of traffic to v2
    - match:
        - headers:
            x-canary: { exact: "true" }
      route:
        - destination: { host: petstore-api, subset: v2 }
    - route:
        - destination: { host: petstore-api, subset: v1 }
          weight: 95
        - destination: { host: petstore-api, subset: v2 }
          weight: 5
      retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: gateway-error,connect-failure,refused-stream
      timeout: 5s
      fault:
        delay:
          percentage: { value: 0.1 }   # 0.1% of requests get a 2s delay (chaos)
          fixedDelay: 2s
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: petstore-api
  namespace: petstore
spec:
  host: petstore-api
  trafficPolicy:
    connectionPool:
      tcp: { maxConnections: 100 }
      http: { http2MaxRequests: 1000, maxRequestsPerConnection: 10 }
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
    tls: { mode: ISTIO_MUTUAL }
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }
```

### 11.5 mTLS everywhere

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: petstore
spec:
  mtls:
    mode: STRICT    # reject any plaintext traffic inside the mesh
```

And service-to-service authorization:

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: petstore-api-allow
  namespace: petstore
spec:
  selector:
    matchLabels: { app: petstore-api }
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/petstore/sa/petstore-web
              - cluster.local/ns/petstore/sa/petstore-mobile
      to:
        - operation:
            methods: [GET, POST, PATCH]
            paths: ["/v1/*"]
```

### 11.6 Competitors

- **Linkerd** — simpler, Rust data plane, lower resource footprint, CNCF graduated. Preferred by teams that want "just enough mesh."
- **Consul Connect** — HashiCorp's mesh; same Consul is also the service registry.
- **Kuma** — built by Kong, Envoy-based, multi-zone, CNCF sandbox.
- **AWS App Mesh** — managed Envoy mesh (deprecated in 2024 — AWS pushed users toward VPC Lattice and EKS-native service discovery).
- **Cilium Service Mesh** — eBPF-based, no sidecar needed for L4; Envoy for L7. The "second wave."
- **Istio Ambient Mesh** — Istio's sidecar-less redesign. L4 via per-node "ztunnel" proxies, L7 via optional "waypoint" proxies.

### 11.7 The sidecar-less second wave

The sidecar model has real costs: one extra container per pod (CPU, memory, startup latency), complicated pod-level restarts, and a whole `istio-init` dance for iptables rules. The 2022+ trend is to push L4 (mTLS, basic routing, policy enforcement) into eBPF programs attached to the node's network stack, and only instantiate a full Envoy for pods that need L7 features.

Cilium (Isovalent, now Cisco) pioneered this with eBPF. Istio Ambient followed with the ztunnel/waypoint split. For most workloads the result is 50-80% less overhead than classic sidecars.

### 11.8 Why service mesh is controversial

- **Operational complexity.** You're adding a new distributed system (the control plane) on top of your existing distributed system. Upgrades, failure modes, debugging.
- **Latency.** Every hop adds 0.5-2ms. Mostly fine, occasionally not.
- **Overlap with API gateways.** North-south traffic (clients → cluster) goes through an ingress or API gateway; east-west traffic (service → service) goes through the mesh. The boundary is fuzzy.
- **"Do I need this?"** A startup with 5 services probably doesn't. A company with 500 services almost certainly does.

### 11.9 Gateway API

The Kubernetes **Gateway API** (GA in 2023) is the successor to the original Ingress. It's a more expressive, multi-protocol (HTTP, TCP, TLS, gRPC, UDP) resource model with clearer role separation (infrastructure provider, cluster operator, application developer).

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: public-gateway
spec:
  gatewayClassName: envoy
  listeners:
    - name: https
      port: 443
      protocol: HTTPS
      tls:
        mode: Terminate
        certificateRefs:
          - { name: wildcard-example-com }
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: petstore
spec:
  parentRefs:
    - name: public-gateway
  hostnames:
    - api.petstore.example.com
  rules:
    - matches:
        - path: { type: PathPrefix, value: /v1/pets }
      backendRefs:
        - { name: petstore-api, port: 80, weight: 90 }
        - { name: petstore-api-v2, port: 80, weight: 10 }
```

Istio, Linkerd, Kong, Traefik, Contour, Envoy Gateway, and NGINX all implement Gateway API now.

---

## 12. Envoy Proxy — a Deeper Look

### 12.1 Origin: Matt Klein at Lyft (2016)

Matt Klein started Envoy at Lyft in 2015 to replace their ad-hoc mix of NGINX, HAProxy, and home-grown proxies. Lyft was hitting scale problems where each of those had a different configuration language, a different observability story, and a different failure mode. Klein wanted one proxy that did edge (L7 HTTP), east-west (service-to-service), and monitoring, with a universal dynamic configuration API. Envoy was open-sourced in September 2016 and donated to the CNCF in 2017. It graduated in 2018.

### 12.2 What makes Envoy different

- **C++ with modern threading.** High throughput, low latency, low memory per connection. Single-process multi-worker model (not multi-process like NGINX).
- **HTTP/2 and gRPC as first-class.** Envoy was the first production proxy designed around HTTP/2 as the default.
- **xDS API.** Envoy can be entirely configured via a gRPC streaming API (Listener Discovery Service, Route Discovery Service, Cluster Discovery Service, Endpoint Discovery Service, Secret Discovery Service — collectively "xDS"). No config reloads, no file churn. The control plane pushes updates, the data plane applies them.
- **Extensibility.** Filters (HTTP, network, listener) and Lua/WebAssembly extensions.
- **Observability.** Per-route metrics, per-upstream metrics, access logs, built-in stats sinks, native distributed tracing.

### 12.3 A worked static Envoy config

```yaml
static_resources:
  listeners:
    - name: public
      address:
        socket_address: { address: 0.0.0.0, port_value: 8443 }
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                codec_type: AUTO
                route_config:
                  name: local
                  virtual_hosts:
                    - name: petstore
                      domains: ["api.petstore.example.com"]
                      routes:
                        - match: { prefix: "/v1/pets" }
                          route:
                            cluster: petstore_cluster
                            retry_policy:
                              retry_on: 5xx,gateway-error
                              num_retries: 2
                              per_try_timeout: 1s
                            timeout: 5s
                http_filters:
                  - name: envoy.filters.http.jwt_authn
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.jwt_authn.v3.JwtAuthentication
                      providers:
                        auth0:
                          issuer: https://example.auth0.com/
                          audiences: [petstore-api]
                          remote_jwks:
                            http_uri:
                              uri: https://example.auth0.com/.well-known/jwks.json
                              cluster: auth0_jwks
                              timeout: 2s
                            cache_duration: 3600s
                      rules:
                        - match: { prefix: "/v1/" }
                          requires: { provider_name: auth0 }
                  - name: envoy.filters.http.local_ratelimit
                    typed_config:
                      "@type": type.googleapis.com/udpa.type.v1.TypedStruct
                      type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
                      value:
                        stat_prefix: ratelimit
                        token_bucket:
                          max_tokens: 1000
                          tokens_per_fill: 1000
                          fill_interval: 1s
                  - name: envoy.filters.http.router

  clusters:
    - name: petstore_cluster
      connect_timeout: 1s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      http2_protocol_options: {}
      health_checks:
        - timeout: 1s
          interval: 5s
          unhealthy_threshold: 3
          healthy_threshold: 2
          http_health_check: { path: "/health" }
      load_assignment:
        cluster_name: petstore_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address: { address: petstore-api.petstore.svc.cluster.local, port_value: 80 }
      outlier_detection:
        consecutive_5xx: 5
        interval: 10s
        base_ejection_time: 30s

    - name: auth0_jwks
      connect_timeout: 2s
      type: LOGICAL_DNS
      load_assignment:
        cluster_name: auth0_jwks
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address: { address: example.auth0.com, port_value: 443 }
      transport_socket:
        name: envoy.transport_sockets.tls

admin:
  address:
    socket_address: { address: 127.0.0.1, port_value: 9901 }
```

### 12.4 xDS — the universal control plane protocol

xDS is how Envoy receives its configuration from the outside. There's a set of discovery services, each a streaming gRPC API:

- **LDS** — Listener Discovery Service
- **RDS** — Route Discovery Service
- **CDS** — Cluster Discovery Service
- **EDS** — Endpoint Discovery Service
- **SDS** — Secret Discovery Service (certificates)
- **ADS** — Aggregated Discovery Service (all of the above on one stream, ordered)

Istio's `istiod`, Kuma's control plane, and AWS App Mesh all speak xDS to Envoy. The xDS protocol has been proposed as a CNCF standard — anyone can build a control plane that drives Envoy (or any xDS-speaking proxy, like gRPC's own load balancer).

### 12.5 Envoy Gateway

Envoy Gateway (launched 2022) is a standalone Kubernetes ingress controller built on Envoy, implementing the Gateway API. It's what you use when you want Envoy at the edge but don't need the full Istio east-west story.

### 12.6 Envoy Mobile

Envoy can be compiled as a library and embedded into iOS and Android apps, giving mobile clients the same reliability story as server-side services: retries, circuit breaking, metrics. Originally built by Lyft, now open source.

---

## 13. Event-Driven Architectures

### 13.1 The messaging lineage

Before Kafka, the dominant patterns were:

- **JMS** (Java Message Service, 1998) — Java API for enterprise messaging. Implementations: ActiveMQ, IBM MQ, TIBCO EMS. Pub/sub topics and point-to-point queues.
- **AMQP** (Advanced Message Queuing Protocol, 2006) — open wire protocol for message brokers. Primary implementation: **RabbitMQ** (Pivotal, 2007). Exchanges, queues, bindings, routing keys.
- **STOMP** — simple text-oriented protocol, mostly for WebSocket-based pub/sub.
- **MQTT** — lightweight pub/sub, originally IBM for oil-pipeline telemetry, now the de facto IoT protocol. Brokers: Mosquitto, HiveMQ, EMQX.

These all had **queue semantics**: a message is delivered to a consumer and, once acknowledged, is removed from the broker. Replay is typically not supported. For request/response decoupling and "fire-and-forget" workloads, queues are perfect.

### 13.2 RabbitMQ — the queue workhorse

RabbitMQ was born in 2007, built in Erlang, and became the standard open-source AMQP broker. Its model:

- **Publisher** → **Exchange** (fanout, direct, topic, headers) → **Queue(s)** → **Consumer**.
- At-least-once delivery with manual ack.
- Dead-letter queues, TTL, priority, delayed messages via plugin.
- Mirrored queues (classic) or quorum queues (Raft-based) for HA.

```python
import pika
conn = pika.BlockingConnection(pika.ConnectionParameters("rabbitmq"))
ch = conn.channel()
ch.exchange_declare("orders", exchange_type="topic", durable=True)
ch.queue_declare("orders.shipping", durable=True)
ch.queue_bind("orders.shipping", "orders", routing_key="orders.*.created")

def on_msg(channel, method, properties, body):
    try:
        process(body)
        channel.basic_ack(method.delivery_tag)
    except Exception:
        channel.basic_nack(method.delivery_tag, requeue=False)

ch.basic_qos(prefetch_count=10)
ch.basic_consume("orders.shipping", on_msg)
ch.start_consuming()
```

RabbitMQ is still the right answer for many problems in 2026: it's simpler than Kafka, the delivery semantics are easy to reason about, and it handles millions of messages/sec for most workloads.

### 13.3 Kafka — the distributed commit log

**Apache Kafka** was created at LinkedIn by Jay Kreps, Neha Narkhede, and Jun Rao, starting around 2009. It was open-sourced in 2011 and donated to the Apache Foundation. In 2014, the three founders left LinkedIn to start **Confluent**, which became the commercial steward of Kafka.

Kafka's crucial insight: a message broker is really a **distributed commit log**. Instead of deleting messages on ack, append them to a log, partition the log, and let consumers track their own position (offset) in each partition. This changes everything:

- **Replay**. A new consumer can read from any offset — a day ago, a week ago, the beginning of time.
- **Multiple consumers**. Multiple independent consumer groups can read the same topic at their own pace.
- **Throughput**. Sequential log writes are extremely fast (linear I/O, page cache friendly).
- **Ordering**. Within a partition, strict order is guaranteed. Across partitions, no global order.

### 13.4 Kafka topology

- **Topic** — a named, partitioned log.
- **Partition** — a single ordered log segment; the unit of parallelism. A topic has N partitions.
- **Producer** — writes messages to a topic, optionally with a partition key.
- **Consumer group** — a set of consumers that cooperate to read all partitions of a topic. Each partition is assigned to exactly one consumer in the group.
- **Offset** — the consumer's position in a partition.
- **Broker** — a Kafka server. A cluster has many brokers; partitions are replicated across brokers.
- **Replica**, **leader**, **follower**, **ISR** (in-sync replicas) — the replication model.
- **Controller** — elects partition leaders. Was backed by ZooKeeper historically; Kafka 3.3+ supports KRaft (Kafka-native consensus), and ZooKeeper was removed in Kafka 4.0 (2025).

### 13.5 A worked Kafka producer / consumer

Producer (Python, confluent-kafka-python):

```python
from confluent_kafka import Producer
import json, uuid, time

producer = Producer({
    "bootstrap.servers": "kafka-0:9092,kafka-1:9092,kafka-2:9092",
    "client.id": "order-service",
    "acks": "all",           # wait for all ISR
    "enable.idempotence": True,
    "compression.type": "zstd",
    "linger.ms": 5,
    "batch.size": 65536,
})

def delivery_cb(err, msg):
    if err:
        print("delivery failed:", err)
    else:
        print(f"delivered {msg.topic()}[{msg.partition()}]@{msg.offset()}")

event = {
    "specversion": "1.0",
    "id": str(uuid.uuid4()),
    "source": "urn:service:orders",
    "type": "com.example.orders.created.v1",
    "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "data": {
        "orderId": "ord_01H...",
        "customerId": "cus_42",
        "total": 12.95,
        "currency": "USD",
    },
}

producer.produce(
    topic="orders.v1.created",
    key=event["data"]["customerId"].encode(),   # partition by customer for per-customer ordering
    value=json.dumps(event).encode(),
    headers={"ce_type": event["type"], "content-type": "application/cloudevents+json"},
    callback=delivery_cb,
)
producer.flush()
```

Consumer (Python):

```python
from confluent_kafka import Consumer, KafkaError

consumer = Consumer({
    "bootstrap.servers": "kafka-0:9092,kafka-1:9092,kafka-2:9092",
    "group.id": "fulfillment-service",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,
    "isolation.level": "read_committed",
    "max.poll.interval.ms": 300000,
})
consumer.subscribe(["orders.v1.created"])

try:
    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            raise KafkaError(msg.error())
        try:
            handle(msg.value())
            consumer.commit(msg, asynchronous=False)
        except Exception:
            # move to DLQ, keep going
            dlq_producer.produce("orders.v1.created.dlq", key=msg.key(), value=msg.value())
            consumer.commit(msg, asynchronous=False)
finally:
    consumer.close()
```

### 13.6 Kafka patterns and anti-patterns

- **Partition by a stable key** when you need ordering (all events for customer X must be processed in order → key by customer ID).
- **Use consumer groups** for horizontal scaling; each partition is assigned to exactly one consumer in the group.
- **Idempotent consumers.** Events can be replayed (Kafka's superpower) or redelivered (at-least-once). Consumers must be idempotent — keep a "processed" set keyed by event ID, or write to the output store with an upsert keyed by event ID.
- **Avoid very large messages** (> 1MB). Put the payload in object storage and publish the pointer.
- **Don't use Kafka as a database.** Compacted topics are for latest-value snapshots (like a key-value store); you still want a real OLTP database for queries.

### 13.7 Event sourcing and CQRS

**Event sourcing**: instead of storing the current state of an entity, store the sequence of events that produced it. The current state is a projection of the event stream. Advantages: perfect audit, time-travel debugging, replay for bug fixes and new projections. Disadvantages: queries are expensive without projections, schema evolution of old events is painful.

**CQRS** (Command Query Responsibility Segregation, Greg Young): separate the write model (commands → events) from the read model (queries → projections). Often paired with event sourcing: commands produce events appended to a log; projections subscribe to the log and maintain denormalized query views.

```
                ┌──────────┐  commands    ┌───────────┐
    Clients ──► │ Write API│────────────► │Event Store│
                └──────────┘              └─────┬─────┘
                                                │ events
                 ┌─────────┐  queries     ┌─────▼─────┐
    Clients ──►  │ Read API│◄─────────────│Projections│
                 └─────────┘              └───────────┘
```

### 13.8 Saga pattern for distributed transactions

Microservices own their own databases. Cross-service "transactions" can't use two-phase commit in practice (it's slow, fragile, and requires everyone to speak the same protocol). Instead: **sagas**.

A saga is a sequence of local transactions, each of which publishes an event on success. Other services subscribe to events and perform their own local transactions. If any step fails, the saga emits **compensating events** that run local "undo" transactions in earlier services.

Two styles:

- **Choreography**: each service listens for events and decides what to do. No central coordinator. Simple for small sagas, becomes hard to reason about past ~3 steps.
- **Orchestration**: a central "saga orchestrator" knows the sequence, calls each service, handles failures. Easier to reason about, introduces a central dependency.

In 2026 most teams doing orchestration use **Temporal** or **AWS Step Functions** (see §20), which give you durable, code-as-workflow sagas.

### 13.9 Kafka Streams, ksqlDB, Kafka Connect

Around Kafka grew a whole stream-processing ecosystem:

- **Kafka Streams** — Java library for building stateful stream processors in-process. No separate cluster; your app scales via consumer groups.
- **ksqlDB** — SQL on Kafka. Define streams and tables; write SQL that compiles to Kafka Streams topologies.
- **Kafka Connect** — framework for moving data between Kafka and other systems. Source connectors (pull from DB → Kafka) and sink connectors (push from Kafka → DB, S3, Elasticsearch, etc.).
- **Debezium** — change data capture (CDC) via Kafka Connect: tail the MySQL/Postgres/Mongo WAL, emit row-level change events on a Kafka topic. The backbone of many "strangler fig" migrations.
- **Apache Flink** — the other big stream-processing engine. More expressive, better exactly-once, independent cluster. Confluent acquired Immerok (a Flink company) in 2023 and is pushing Flink as Kafka's stream-processing layer.

### 13.10 The cloud alternatives

- **AWS Kinesis Data Streams** — Kafka-lite on AWS. Shards instead of partitions; simpler, lower ceiling.
- **AWS MSK / MSK Serverless** — managed Kafka on AWS.
- **Google Pub/Sub** — not log-based; more like a managed queue with at-least-once, topic/subscription model.
- **Azure Event Hubs** — Kafka-compatible (speaks the Kafka wire protocol), plus its native protocol.
- **NATS** — high-performance pub/sub with JetStream for persistence; simpler than Kafka, very fast.
- **Apache Pulsar** — Yahoo, 2016; separates compute (brokers) from storage (BookKeeper). More cleanly multi-tenant than Kafka, less ecosystem.

### 13.11 CloudEvents

**CloudEvents** (CNCF, 2019) is a spec for a common envelope format for events across systems. It defines a small set of context attributes (`id`, `source`, `specversion`, `type`, `time`, `datacontenttype`, `subject`) and bindings for various protocols (HTTP, Kafka, AMQP, MQTT, NATS). The goal: if you emit CloudEvents, any CloudEvents-aware consumer (Knative Eventing, AWS EventBridge, Dapr, Argo Events) can route and process them. It's the "LSB for events."

```json
{
  "specversion": "1.0",
  "id": "A234-1234-1234",
  "source": "/mycontext",
  "type": "com.example.someevent",
  "datacontenttype": "application/json",
  "time": "2025-12-27T17:31:00Z",
  "data": { "foo": "bar" }
}
```

---

## 14. API Gateways

### 14.1 The role

An API gateway is the single entry point for external (north-south) traffic. It handles:

- TLS termination
- Authentication (API keys, JWT validation, OAuth 2.0, mTLS)
- Authorization and RBAC
- Rate limiting and quota enforcement
- Request/response transformation (JSON↔XML, body shaping, header injection)
- Caching
- Routing to upstream services
- Protocol mediation (REST→gRPC, HTTP/1.1→HTTP/2)
- Request logging and audit
- WAF (web application firewall)
- Billing metering

### 14.2 The players

- **Kong** (2015) — open-source gateway built on OpenResty (NGINX + Lua). Plugin architecture. Commercial Kong Enterprise. Very popular.
- **Apigee** — Google Cloud's enterprise gateway (acquired 2016). Heavy on API product management, analytics, developer portals.
- **AWS API Gateway** — AWS's managed gateway. Integrates tightly with Lambda, IAM, Cognito. REST APIs, HTTP APIs (cheaper, simpler), WebSocket APIs.
- **Azure API Management**, **GCP API Gateway** — the other cloud offerings.
- **Tyk** — open-source gateway, Go-based.
- **Ambassador / Emissary-ingress** — Envoy-based, Kubernetes-native.
- **Traefik** — Go-based, popular for small clusters and Docker Swarm legacies.
- **Envoy Gateway** — see §12.
- **KrakenD** — lightweight aggregator gateway, stateless, config-driven.
- **WSO2 API Manager** — enterprise, open-source-core.

### 14.3 Gateway vs service mesh

- **Gateway** is for north-south traffic (client → cluster). It's visible to external users; it enforces identity, rate limits, and business-facing policies.
- **Service mesh** is for east-west traffic (service → service inside the cluster). It's invisible to users; it enforces mTLS, observability, and platform policies.

In practice the two overlap. Some teams use Envoy Gateway for both (the same data plane, different control config). Others use Kong at the edge and Istio inside. Either is fine.

### 14.4 A Kong example (declarative)

```yaml
# kong.yml (decK)
_format_version: "3.0"
_transform: true

services:
  - name: petstore-api
    url: http://petstore-api.petstore.svc.cluster.local:80
    routes:
      - name: pets
        paths: [/v1/pets]
        strip_path: false
        methods: [GET, POST, PATCH, DELETE]
    plugins:
      - name: rate-limiting
        config:
          minute: 120
          policy: local
      - name: jwt
        config:
          key_claim_name: iss
          claims_to_verify: [exp]
      - name: prometheus
      - name: request-transformer
        config:
          add:
            headers: ["X-Forwarded-For:$(headers['x-forwarded-for'])"]

consumers:
  - username: mobile-app
    jwt_secrets:
      - key: https://example.auth0.com/
        algorithm: RS256
        rsa_public_key: |
          -----BEGIN PUBLIC KEY-----
          MIIB...
          -----END PUBLIC KEY-----
```

---

## 15. Serverless and Function-as-a-Service

### 15.1 AWS Lambda (November 2014)

AWS Lambda, launched at re:Invent 2014 by Tim Wagner and his team, was the first production FaaS platform. The model: upload a function, get a URL (or an event trigger), pay per invocation and per GB-second of memory. No servers, no containers (visible to you), no OS patching.

Within two years, Google Cloud Functions, Azure Functions, and IBM OpenWhisk had all followed. The label "serverless" (somewhat inaccurate — there are still servers, just not yours) stuck.

### 15.2 A worked Lambda example

```python
# handler.py
import json
import os
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["PETS_TABLE"])

def lambda_handler(event, context):
    method = event["httpMethod"]
    pet_id = event["pathParameters"]["id"]

    if method == "GET":
        item = table.get_item(Key={"id": pet_id}).get("Item")
        if not item:
            return {"statusCode": 404, "body": json.dumps({"error": "not found"})}
        return {"statusCode": 200, "body": json.dumps(item)}

    if method == "DELETE":
        table.delete_item(Key={"id": pet_id})
        return {"statusCode": 204, "body": ""}

    return {"statusCode": 405, "body": ""}
```

SAM template (AWS's IaC for serverless):

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31

Resources:
  PetsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - { AttributeName: id, AttributeType: S }
      KeySchema:
        - { AttributeName: id, KeyType: HASH }

  PetsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./
      Handler: handler.lambda_handler
      Runtime: python3.12
      MemorySize: 512
      Timeout: 10
      Environment:
        Variables:
          PETS_TABLE: !Ref PetsTable
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref PetsTable
      Events:
        GetPet:
          Type: HttpApi
          Properties:
            Path: /pets/{id}
            Method: GET
        DeletePet:
          Type: HttpApi
          Properties:
            Path: /pets/{id}
            Method: DELETE
```

### 15.3 Event sources

Lambda's real power is its huge library of event sources — anything in AWS can trigger a function:

- API Gateway (HTTP)
- SQS, SNS, EventBridge (messaging)
- DynamoDB Streams, Kinesis (CDC / streams)
- S3 (object created/deleted)
- CloudWatch Events (cron)
- Cognito (user lifecycle)
- Step Functions (orchestration)
- IoT Core, Alexa, Lex (client)

### 15.4 Knative — Kubernetes-native serverless

**Knative** (Google, 2018) brings a serverless programming model to Kubernetes. Two subprojects:

- **Knative Serving** — scale-to-zero HTTP services. You write a regular container; Knative autoscales from 0 to N based on concurrent requests, does blue/green by revision, handles routing.
- **Knative Eventing** — a CloudEvents-based event mesh. Brokers, triggers, sources, sinks.

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: hello
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "100"
    spec:
      containers:
        - image: ghcr.io/example/hello:1.0
          env:
            - { name: TARGET, value: "world" }
```

Google Cloud Run is Knative under the hood (plus a lot of Google magic). It's the closest the industry has to "serverless but portable."

### 15.5 Other serverless platforms

- **OpenFaaS** — lightweight FaaS on Kubernetes or Docker Swarm.
- **OpenWhisk** — Apache project, IBM Cloud Functions.
- **Kubeless** — Kubernetes CRD-based FaaS (archived 2020).
- **Fermyon Spin / wasmCloud** — WASM-based serverless (see §20).
- **Cloudflare Workers**, **Deno Deploy**, **Fastly Compute@Edge** — edge serverless (see §20).

### 15.6 The pushback

Serverless sounded like it was going to eat the world around 2018. By 2023 the mood had shifted. The operational reality:

- **Cold starts** — first invocation can take 0.5-5s depending on runtime and memory. Provisioned concurrency helps but costs more.
- **Observability** — distributed tracing across 30 Lambdas is harder than tracing across 3 services.
- **Vendor lock-in** — Lambda + DynamoDB + SQS + EventBridge + Step Functions is incredibly productive, and incredibly non-portable.
- **Cost at scale** — Lambda is great at low volume and bursty workloads. Past a certain utilization, containers or EC2 are cheaper.
- **Local dev** — emulators exist (LocalStack, SAM local) but none are perfect.

The 2024-2026 consensus: serverless is fantastic for glue code, infrequent workloads, event handlers, and startup MVPs. For high-QPS stable services, the container + Kubernetes model usually wins on cost and observability.

Amazon's own Prime Video team famously published a blog post in 2023 describing moving a video-quality-monitoring pipeline from Step Functions + Lambda to a monolith running on EC2, and saving 90%. It was widely misread as "serverless bad" when the real lesson was "stateless glue is not the same as a hot loop." See §19.

---

## 16. Distributed Tracing in Practice

### 16.1 Google's Dapper paper (2010)

Ben Sigelman, Luiz André Barroso, Mike Burrows et al. published **"Dapper, a Large-Scale Distributed Systems Tracing Infrastructure"** as a Google technical report in April 2010. It described the system Google had been running internally since roughly 2005. The core ideas:

- **Trace** — a distributed execution graph: one high-level operation (e.g., a search query) that spawns many sub-operations across services.
- **Span** — a single unit of work (one service's handling of one RPC). Has a start time, duration, service name, and key/value annotations.
- **Trace ID** — a globally unique ID that propagates with every call in a trace.
- **Span ID** and **Parent Span ID** — link spans into a tree.
- **Context propagation** — the trace ID and current span ID travel in RPC metadata/headers so each service can emit spans linked to the right trace.
- **Sampling** — you can't store every trace at Google scale. Dapper sampled at 0.01-1% and found this was sufficient for performance analysis.

### 16.2 The OSS descendants

- **Zipkin** (Twitter, 2012) — the first open-source Dapper clone. Java-based collector, Cassandra/Elasticsearch backend, simple UI. Still in use.
- **Jaeger** (Uber, 2015) — written in Go, more scalable than Zipkin, CNCF graduated. Now the default OSS tracer.
- **OpenTracing** (2016) — a vendor-neutral *spec* for instrumentation APIs. Libraries could speak OpenTracing and swap backends.
- **OpenCensus** (Google, 2017) — Google's alternative, covering both tracing and metrics in one library.
- **OpenTelemetry** (2019) — the merger of OpenTracing and OpenCensus, now the dominant standard. An SDK + API + wire protocol (OTLP) + semantic conventions for tracing, metrics, and logs. CNCF incubating, used basically everywhere.
- **W3C Trace Context** (W3C Recommendation, 2020) — standardized HTTP headers for trace propagation: `traceparent` and `tracestate`. Every modern instrumentation library speaks this.

### 16.3 A worked OpenTelemetry example (Python)

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: "petstore-api",
    ResourceAttributes.SERVICE_VERSION: "1.4.2",
    ResourceAttributes.DEPLOYMENT_ENVIRONMENT: "production",
})
provider = TracerProvider(resource=resource)
provider.add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(endpoint="http://otel-collector:4317", insecure=True)
    )
)
trace.set_tracer_provider(provider)

# Auto-instrument common libraries
from fastapi import FastAPI
app = FastAPI()
FastAPIInstrumentor.instrument_app(app)
RequestsInstrumentor().instrument()

tracer = trace.get_tracer(__name__)

@app.get("/pets/{pet_id}")
def get_pet(pet_id: int):
    with tracer.start_as_current_span("lookup_pet") as span:
        span.set_attribute("pet.id", pet_id)
        pet = db.get(pet_id)
        span.set_attribute("pet.found", pet is not None)
        if not pet:
            span.set_status(trace.Status(trace.StatusCode.ERROR, "not found"))
            return {"error": "not found"}
        return pet
```

### 16.4 OpenTelemetry Collector

The OTel Collector is a vendor-neutral agent that receives, processes, and exports telemetry. You run one per node (DaemonSet) or per cluster (Deployment). It speaks OTLP (gRPC and HTTP), Jaeger, Zipkin, Prometheus, Statsd, and dozens of others on both ends.

```yaml
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }

processors:
  batch:
    timeout: 10s
  memory_limiter:
    limit_mib: 512
  resource:
    attributes:
      - { key: cluster, value: prod-us-west, action: upsert }
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 500 }
      - name: random-1pct
        type: probabilistic
        probabilistic: { sampling_percentage: 1 }

exporters:
  otlp/tempo:
    endpoint: tempo.monitoring.svc.cluster.local:4317
    tls: { insecure: true }
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
  loki:
    endpoint: http://loki:3100/loki/api/v1/push

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resource, tail_sampling, batch]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, resource, batch]
      exporters: [prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, resource, batch]
      exporters: [loki]
```

### 16.5 The three pillars

- **Logs** — structured events. Loki, Elasticsearch, Splunk, Datadog.
- **Metrics** — numeric time series. Prometheus, VictoriaMetrics, M3, Datadog.
- **Traces** — distributed request flows. Jaeger, Tempo, Honeycomb, Lightstep, Datadog APM.

Charity Majors (CTO of Honeycomb) has been arguing for years that these three silos are the wrong abstraction and that the future is **structured events** with high cardinality and aggregation on read. Her book **Observability Engineering** (with Liz Fong-Jones and George Miranda, O'Reilly 2022) is the reference.

### 16.6 Common stacks

- **Open source**: Prometheus (metrics) + Loki (logs) + Tempo or Jaeger (traces) + Grafana (visualization). OpenTelemetry for instrumentation. This is the "LGTM stack" from Grafana Labs.
- **Commercial**: Datadog, New Relic, Dynatrace, Splunk Observability — all in one, expensive, very polished.
- **Observability-focused startups**: Honeycomb (high-cardinality events), Lightstep (traces), Chronosphere (metrics at scale).

---

## 17. Platform Engineering (2020s)

### 17.1 From DevOps to Platform Engineering

"DevOps" (c. 2009) started as "developers and operations should collaborate" and turned into "every team runs their own infrastructure." By 2020, many orgs had discovered that "every team runs their own infrastructure" scaled as O(teams × infrastructure complexity), and infrastructure complexity had grown enormously. Every team was now expected to know Kubernetes, Helm, Terraform, Istio, Prometheus, Vault, and a CI/CD pipeline.

**Platform engineering** is the response: build a small **platform team** that treats the infrastructure as a product, and gives other teams a paved road — a curated, opinionated, well-documented internal platform that handles the common cases, so product teams can focus on product.

### 17.2 Team Topologies (2019)

Matthew Skelton and Manuel Pais published **Team Topologies** in 2019. They defined four team types:

1. **Stream-aligned team** — owns an end-to-end slice of the business (a product, a customer journey). The default.
2. **Enabling team** — short-lived, helps stream-aligned teams adopt new skills or tools.
3. **Complicated-subsystem team** — owns a specialized, deep-expertise component (ML platform, payments, query planner).
4. **Platform team** — builds and runs the internal platform that stream-aligned teams consume.

And three interaction modes: **collaboration** (close working), **X-as-a-Service** (consumer → provider), **facilitation** (short-term teaching).

The book became the organizational design reference for platform engineering. It's short. Read it.

### 17.3 The paved road metaphor

The "paved road" (originally from Netflix) is the set of opinionated, blessed, well-supported tools and workflows that a platform team provides. A team that stays on the paved road gets: automated CI/CD, golden Docker base images, observability for free, secret management, SSO, golden Kubernetes manifests. A team that goes off-road is free to, but they own their own ops.

Crucially: the paved road is not mandatory. It's the easiest, best-supported path. Teams opt in by preference.

### 17.4 Internal Developer Platforms (IDPs) and Backstage

**Backstage** was created at Spotify in 2016 and open-sourced in 2020. It's a React-based developer portal framework with a core concept: a **Software Catalog** — a registry of all your services, libraries, websites, and teams, each described by a YAML file checked into its repo.

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: petstore-api
  description: The public Petstore REST API
  annotations:
    github.com/project-slug: example/petstore-api
    backstage.io/techdocs-ref: dir:.
    grafana/dashboard-selector: "service=petstore-api"
    pagerduty.com/integration-key: abc123
  tags: [rest, golang, production]
  links:
    - url: https://petstore-api.example.com/docs
      title: API Docs
spec:
  type: service
  lifecycle: production
  owner: team-petstore
  system: petstore
  providesApis: [petstore-api-rest]
  consumesApis: [payments-api, users-api]
  dependsOn: [resource:petstore-postgres, resource:petstore-redis]
```

Backstage plugins give you per-service views of: CI status, deployments, dashboards, alerts, on-call, tech docs, cost, SLOs, security scans, dependency graphs.

Commercial alternatives to Backstage (for teams that don't want to run it themselves): **Port**, **Cortex**, **Humanitec**, **OpsLevel**, **Configure8**.

### 17.5 Golden paths and templates

Backstage Software Templates let the platform team define "create a new service" wizards that scaffold repos with the paved road baked in:

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: golang-service
  title: Go Microservice
  description: Scaffolds a Go microservice with CI/CD, Dockerfile, Helm chart, OTel
spec:
  owner: platform-team
  type: service
  parameters:
    - title: Basic info
      required: [name, owner]
      properties:
        name: { type: string, pattern: "^[a-z][a-z0-9-]{2,30}$" }
        description: { type: string }
        owner: { type: string, ui:field: OwnerPicker }
  steps:
    - id: fetch
      action: fetch:template
      input:
        url: ./skeleton
        values: { name: "${{ parameters.name }}" }
    - id: publish
      action: publish:github
      input:
        repoUrl: github.com?owner=example&repo=${{ parameters.name }}
    - id: register
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }}
        catalogInfoPath: /catalog-info.yaml
```

A developer clicks "Create Go service" in Backstage, fills in a name, and gets a new repo with a production-grade skeleton already wired to CI, observability, and the service catalog. This is the platform-as-product model in one screenshot.

---

## 18. Modern Industries Running on Service-Oriented

### 18.1 Fintech

- **Stripe** — every API the company ships is service-oriented from the ground up. The "Stripe API" as seen by customers is the tip of an iceberg of internal services: payments, subscriptions, connect, radar, issuing, sigma, climate. Stripe's internal RPC is Twirp-like (plain JSON-over-HTTP), versioned by date, with one of the most studied public API designs in the industry.
- **Square / Block** — from point-of-sale hardware up through Cash App, all API-first.
- **Plaid** — connects apps to bank accounts via institution-specific scrapers and OAuth flows; exposed as a single clean REST API.
- **Adyen** — European payments; service-oriented since the beginning (2006), built on Kubernetes and gRPC internally.
- **Wise (TransferWise)** — cross-border payments as a graph of services.
- **Robinhood** — brokerage infra on AWS with heavy use of Kafka, Kubernetes, and Envoy.

Fintech is particularly service-oriented because **regulation forces boundaries**. KYC, fraud detection, ledger, payments rails, card issuing — each has different compliance requirements, audit scope, and failure modes. Keeping them separate services makes the compliance story tractable.

### 18.2 Cloud

The three hyperscalers are each a constellation of hundreds of SOA boundaries:

- **AWS** — 250+ services as of 2026. Each is (approximately) its own team, its own API, its own SLA. The Bezos mandate in action.
- **Google Cloud** — built on Google's internal Stubby/gRPC substrate; externally exposed via Google APIs (gRPC + REST transcoding).
- **Azure** — a mix of legacy stamp-scoped services and cloud-native Kubernetes-backed services; heavy use of Dapr internally and externally.

### 18.3 Media

- **Netflix** — ~1000 microservices, 2000+ deployments/day across the org, running on EC2 and their own orchestrator (Titus). Trackers: Eureka (legacy), Atlas, Spinnaker, Dispatch.
- **Spotify** — famous for the "squad/tribe/chapter/guild" org model (later disowned as cargo-culted outside Spotify). Thousands of services in Java and Scala on GCP, now also heavy Rust. Backstage came from here.
- **Twitter/X** — Finagle-based JVM services (written by Marius Eriksen and others), later gRPC-and-Envoy for new services.

### 18.4 Travel / ride-share / stays

- **Uber** — one of the most public examples of going *too far* with microservices (reportedly 2200+ services by 2018) and then clawing back ("Domain-Oriented Microservice Architecture," 2020). Uses Jaeger (they created it), Schemaless (their Cassandra-backed storage), Cadence (which became Temporal).
- **Lyft** — Envoy's home. Went all-in on service mesh early.
- **Airbnb** — migrated from a Rails monolith ("the Airbnb monorail") to services between 2017 and 2021. Heavy Kotlin and Kafka.
- **Booking.com** — Perl monolith + service layer; notoriously experimentation-driven.

### 18.5 Commerce

- **Amazon** — the archetype. Two-pizza teams, services behind service interfaces, nothing shared.
- **Shopify** — started as a Rails monolith ("Shopify Core"), still runs on a modular monolith + extracted services. Public proponent of the "majestic monolith" (see §19).
- **eBay** — moved from a Java monolith to services around 2015-2018.

### 18.6 Social

- **Meta / Facebook** — HHVM monolith ("the www tier") plus thousands of backend services in C++ and Python. GraphQL was invented here. Thrift (not gRPC) is the internal RPC.
- **LinkedIn** — Kafka was created here. Rest.li (a Java REST framework) is the internal RPC.
- **Reddit** — moved from a Python monolith to Baseplate (their Python service framework) and then to more Go services.
- **Discord** — heavy Elixir (the Erlang VM), with Rust for hot paths. Famous blog post about moving from Go to Rust for presence.

### 18.7 Gaming and live services

- **Riot Games** — League of Legends backend is a huge constellation of services.
- **Epic** — Fortnite runs on a custom service fabric; the Epic Online Services API is a public abstraction of it.
- **Blizzard** — battle.net is one of the longest-running service-oriented platforms, with an internal RPC called "Bgs.protocol" on HTTP/2.

### 18.8 The pattern

Companies that went service-oriented because they had to (Netflix, Amazon, Twitter around 2010) paid for it in engineering effort, operational pain, and organizational churn. Companies born after 2015 in the cloud era are service-oriented **by default**; they never had a monolith to migrate away from, and the tooling (Kubernetes, Envoy, Kafka, OpenTelemetry) was ready when they arrived. The new normal: "just use the CNCF stack."

---

## 19. The Critique of Microservices

### 19.1 Sam Newman's second thoughts

Newman's 2015 *Building Microservices* was mostly "here is how you do this, here are the tradeoffs." The 2021 second edition is much more cautious: "don't do this unless you know why; start with a monolith; extract services when you can articulate the pain." His later book *Monolith to Microservices* (2019) is framed as "most people should be moving slowly and carefully, and many should not be moving at all."

### 19.2 "Monolith first" (Martin Fowler, 2015)

Fowler's June 2015 bliki post **"MonolithFirst"** argued that even people who are convinced they want microservices should start with a monolith, because:

1. You don't know the service boundaries yet. Get them wrong and you pay the "distributed monolith" tax for years.
2. Monoliths are simpler, faster, and easier to test. All the operational complexity of microservices is *extra cost* until you have a problem that needs it.
3. You can extract services from a monolith later; going the other way (merging services back) is much harder.

Fowler was explicit: the choice isn't "monolith or microservices forever." It's "monolith now, maybe microservices later when you've learned the domain."

### 19.3 The "distributed monolith" anti-pattern

A distributed monolith is what happens when you break a monolith into services but leave the coupling in place:

- Services are deployed together (because any change affects multiple).
- Services share a database (so a schema change breaks many).
- Services are synchronous (because the teams never built async workflows).
- Services call each other in deep chains (10-call request fan-out).
- A failure in one service takes down the whole system (no bulkheads, no circuit breakers).

You get all the operational cost of microservices (N deployments, N observability pipelines, N on-call rotations) and none of the benefits (independent deploys, fault isolation, team autonomy).

Symptoms:
- Release trains ("we ship all services on Tuesdays").
- Shared database migrations.
- Synchronous fan-out that exceeds 3-4 hops.
- "We can't deploy service X without also deploying Y and Z."

### 19.4 The operational cost ceiling

A production microservice stack needs, at minimum:

- **Container registry** (ECR, GCR, Harbor, GHCR)
- **Orchestrator** (Kubernetes and everything around it)
- **Service discovery** (handled by Kubernetes Services or Consul)
- **Load balancing / mesh** (Envoy/Istio/Linkerd)
- **CI/CD** (GitHub Actions, Argo CD, Flux)
- **Secret management** (Vault, SOPS, ESO, cloud-native)
- **Config management** (ConfigMaps, Consul KV, feature flags)
- **Observability** (OTel + Prometheus + Tempo + Loki + Grafana, or Datadog)
- **Error tracking** (Sentry, Rollbar, BugSnag)
- **Alerting and on-call** (PagerDuty, Opsgenie)
- **Service catalog** (Backstage, Port, Cortex)
- **API contracts** (OpenAPI, Protobuf, schema registry)
- **Authorization/identity** (OPA, SPIFFE/SPIRE, Keycloak, Auth0)
- **Database-per-service plus a strategy for cross-service data**
- **Async eventing** (Kafka, NATS, SQS)
- **Experimentation** (LaunchDarkly, Unleash, Flagsmith)

That's a ~$200k+/year platform team's responsibility. If you're a 5-engineer startup, you cannot run this. If you're a 50-engineer startup, you are entirely building platform. The cost only makes sense above a certain scale.

### 19.5 Conway's Law and the organizational cost

Conway's Law (1967): "Any organization that designs a system will produce a design whose structure is a copy of the organization's communication structure." Microservices *bake in* Conway's Law: each service is owned by a team, and inter-service boundaries mirror inter-team boundaries.

That means:

- If your org has the wrong team boundaries, your services will have the wrong boundaries, and refactoring is painful.
- "Microservices are an organizational scaling strategy, not a technical scaling strategy." You adopt them when the engineering org is big enough that coordination between teams on the same codebase becomes the bottleneck.
- A 15-person team with 40 services is usually doing it wrong. A 150-person team with 40 services is usually doing it right.

### 19.6 DHH and the Majestic Monolith

DHH (David Heinemeier Hansson) of Basecamp and Ruby on Rails has been the loudest counter-voice for a decade. His essay **"The Majestic Monolith"** (2016) argued that for many products the monolith is not a compromise — it's the *correct* architecture:

- One code base → one mental model.
- One deployment pipeline → one release per day, atomically.
- One database transaction spanning the whole request.
- No distributed debugging, no service mesh, no event bus.
- Caching and background jobs via simple, boring tools (memcached, Sidekiq).

Basecamp, HEY, and 37signals continue to run as Rails monoliths with tens of millions of users. In 2022-2023 DHH and his team famously "left the cloud," moving workloads from AWS to owned hardware and saving millions. The argument isn't "monoliths win" — it's "don't adopt distributed complexity without an actual reason."

### 19.7 Cases of going back

- **Amazon Prime Video (2023)**. A team migrated their video-quality monitoring pipeline from AWS Step Functions + Lambda to a monolith on EC2 and cut costs by 90%. The Prime Video blog post was widely misunderstood: the original architecture was ill-fit for a hot-loop workload (every 1-2 seconds per stream), not microservices-in-general. It was still a good reminder that "serverless microservices" has a sweet spot.
- **Shopify**. Still mostly a monolith (Shopify Core, "the monolith") with extracted services around it. Public talks by their engineering org emphasize *modular monolith* as the default.
- **Segment**. Famously went from a monolith to hundreds of microservices and then, in 2018, back to a monolith for their customer-data pipeline, citing operational pain.
- **Istio itself**. The control plane started as 4+ microservices (Pilot, Mixer, Citadel, Galley) and consolidated to a single binary `istiod` in 1.5 (2020). The poster child of "maybe just run one binary."

### 19.8 The 2023-2024 pushback summarized

By 2024, the conversation had shifted from "how do we do microservices" to "should we?" The honest answer is:

- **Small team, one product**: monolith. You're not big enough to justify the overhead.
- **Medium team, one product, growing fast**: modular monolith. Enforce module boundaries in code (Domain-Driven Design, `internal/` directories, linting rules), so you can extract services later when you know where the seams are.
- **Large team, multiple products**: microservices. The organizational scaling benefit outweighs the operational cost.
- **Very large org**: you already have microservices, and you're probably fighting the sprawl.

---

## 20. What's Next (2026 and Beyond)

### 20.1 Durable execution

The best new primitive of the late 2010s is **durable execution**: write code that looks like a normal function, and have the runtime guarantee that every step is persisted, retried on failure, and resumable across process crashes. No more hand-rolled sagas; no more "state machine as a 400-line switch statement."

- **Temporal** (2019, founded by the creators of Uber's Cadence) — SaaS and open-source. SDKs in Go, Java, TypeScript, Python, .NET, PHP, Ruby. The leading open-source durable-execution system.
- **Cadence** (Uber, still open source) — Temporal's predecessor, still in use.
- **AWS Step Functions** — JSON state machines, integrates tightly with AWS services.
- **Azure Durable Functions** — C#/JS/Python, orchestration on top of Azure Functions.
- **Inngest** — developer-friendly event-driven durable workflows.
- **Restate** — newer, built around a journal model similar to Temporal.
- **DBOS** — Michael Stonebraker's project, Postgres-as-runtime durable execution.

A Temporal workflow in Python:

```python
from datetime import timedelta
from temporalio import workflow, activity
from temporalio.client import Client
from temporalio.worker import Worker

@activity.defn
async def charge_card(customer_id: str, amount: int) -> str:
    # real world: call Stripe API
    return f"charge_{customer_id}_{amount}"

@activity.defn
async def reserve_inventory(sku: str, qty: int) -> str:
    return f"reservation_{sku}"

@activity.defn
async def ship_order(order_id: str, reservation: str) -> str:
    return f"shipment_{order_id}"

@activity.defn
async def refund(charge_id: str) -> None:
    pass

@activity.defn
async def release_reservation(reservation: str) -> None:
    pass

@workflow.defn
class OrderWorkflow:
    @workflow.run
    async def run(self, order: dict) -> dict:
        charge = await workflow.execute_activity(
            charge_card, order["customer_id"], order["total"],
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=None,  # defaults: exponential backoff
        )
        try:
            reservation = await workflow.execute_activity(
                reserve_inventory, order["sku"], order["qty"],
                start_to_close_timeout=timedelta(seconds=10),
            )
        except Exception:
            await workflow.execute_activity(
                refund, charge, start_to_close_timeout=timedelta(seconds=30)
            )
            raise

        try:
            shipment = await workflow.execute_activity(
                ship_order, order["order_id"], reservation,
                start_to_close_timeout=timedelta(minutes=5),
            )
        except Exception:
            await workflow.execute_activity(
                release_reservation, reservation,
                start_to_close_timeout=timedelta(seconds=30),
            )
            await workflow.execute_activity(
                refund, charge, start_to_close_timeout=timedelta(seconds=30),
            )
            raise

        return {"charge": charge, "reservation": reservation, "shipment": shipment}
```

The workflow function is deterministic replay code: if the worker crashes mid-execution, Temporal replays the history on another worker and the workflow picks up where it left off, with the same in-memory state. Activities are the non-deterministic, external-effect calls. This is the saga pattern with all the bookkeeping automated away.

### 20.2 Actor model revival (Dapr, Akka, Orleans)

The actor model (Carl Hewitt, 1973) was the theoretical basis for Erlang, Akka, and Orleans. It's seeing a practical revival in the 2020s because actors are a natural fit for stateful microservices — each actor is a lightweight addressable entity with private state, processes messages sequentially, and is placed on some node by the runtime.

- **Dapr** — "Distributed Application Runtime," Microsoft's CNCF project. A sidecar that gives any app a set of building blocks: state management, pub/sub, service invocation, actors, bindings, secrets. Language-agnostic.
- **Akka** (Lightbend, JVM) — the OG. Acquired by a new company in 2022 after the Akka license change.
- **Microsoft Orleans** — .NET virtual actors, used in Halo and many Microsoft services.
- **Proto.Actor** — .NET and Go actor framework.

A Dapr actor in C#:

```csharp
public interface IOrderActor : IActor
{
    Task<OrderState> PlaceAsync(OrderCommand cmd);
    Task<OrderState> GetAsync();
    Task CancelAsync();
}

public class OrderActor : Actor, IOrderActor, IRemindable
{
    public OrderActor(ActorHost host) : base(host) { }

    public async Task<OrderState> PlaceAsync(OrderCommand cmd)
    {
        var state = new OrderState { Id = Id.GetId(), Items = cmd.Items, Status = "PLACED" };
        await StateManager.SetStateAsync("order", state);
        await RegisterReminderAsync("auto-cancel", null, TimeSpan.FromMinutes(30), TimeSpan.FromMinutes(30));
        return state;
    }

    public async Task ReceiveReminderAsync(string name, byte[] data, TimeSpan dueTime, TimeSpan period)
    {
        if (name == "auto-cancel") await CancelAsync();
    }

    public async Task CancelAsync()
    {
        var state = await StateManager.GetStateAsync<OrderState>("order");
        state.Status = "CANCELLED";
        await StateManager.SetStateAsync("order", state);
    }
}
```

The actor's identity (`Id`) plus the actor type uniquely addresses it across the cluster; Dapr handles placement, state persistence, and reminders.

### 20.3 WebAssembly on the server

WebAssembly (Wasm) is a sandboxed, portable bytecode format originally built for browsers. On the server it delivers three things:

1. **Small binaries.** A Wasm module for a simple HTTP handler can be 10-100 KB.
2. **Fast cold start.** Wasm modules instantiate in microseconds vs 100ms+ for a container.
3. **Strong sandboxing.** WASI (WebAssembly System Interface) gives capability-based access to the host (no ambient syscalls).

- **wasmCloud** (CNCF) — an actor + capability framework for Wasm. You write actors in any Wasm-capable language (Rust, Go, C#, AssemblyScript), declare the capabilities you need (HTTP server, KV store, logging), and wasmCloud handles routing and scheduling.
- **Fermyon Spin** — Matt Butcher's Wasm-first microframework. "Write a function, run it as a Wasm component."
- **Wasmer** / **Wasmtime** — the two major Wasm runtimes.
- **Cosmonic** — commercial wasmCloud.
- **Component Model** — the W3C-backed Wasm spec for interface types and cross-language linking. The thing that will make Wasm "polyglot" in a real sense.

A Spin HTTP handler in Rust:

```rust
use spin_sdk::http::{IntoResponse, Request, Response};
use spin_sdk::http_component;

#[http_component]
fn handle(req: Request) -> anyhow::Result<impl IntoResponse> {
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(r#"{"message": "hello from wasm"}"#)
        .build())
}
```

Build → 200 KB Wasm module → deploy → cold start in microseconds. The bet: many microservices are "HTTP in → JSON out with a bit of logic," and Wasm is a drastically cheaper substrate for those than containers.

### 20.4 Edge computing

Edge platforms run your code close to the user, at the CDN layer:

- **Cloudflare Workers** — JavaScript and Wasm on V8 isolates, ~0ms cold start, 200+ POPs worldwide. No Node.js — it's a subset of the browser-like `fetch` API.
- **Fastly Compute@Edge** — Wasm-first edge compute on Fastly's CDN.
- **Deno Deploy** — server-side JavaScript on Deno's runtime, edge-scheduled.
- **Vercel Edge Functions** — JS/TS edge compute integrated with their hosting.
- **AWS Lambda@Edge** and **CloudFront Functions** — regular Lambda and stripped-down "Functions" at CloudFront POPs.

A Cloudflare Worker:

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/hello") {
      return new Response(JSON.stringify({ hello: "world" }), {
        headers: { "content-type": "application/json" },
      });
    }
    // Reverse-proxy to origin
    const origin = await fetch(`https://origin.example.com${url.pathname}`, request);
    const resp = new Response(origin.body, origin);
    resp.headers.set("x-edge-pop", request.cf?.colo ?? "unknown");
    return resp;
  },
};
```

Edge compute is service-oriented pushed all the way out: a service is now a function running 50ms from every user on earth. The architectural question of 2026 is "which services belong at the edge, which belong in a region, and which belong in one central place." The answer is usually: edge for auth, routing, and personalization; region for business logic; central for the source-of-truth database.

### 20.5 AI-native services

The newest category: "LLM inference as a service" and everything around it.

- **Model serving** — BentoML, KServe, Triton Inference Server, vLLM, SGLang, TGI.
- **Vector databases** — Pinecone, Weaviate, Qdrant, Milvus, pgvector, Chroma, LanceDB.
- **Embedding services** — OpenAI embeddings, Cohere, Voyage, local models served via llama.cpp or vLLM.
- **Agent frameworks** — LangChain, LlamaIndex, Haystack, DSPy, the Claude Agent SDK, the OpenAI Agents SDK.
- **MCP (Model Context Protocol)** — Anthropic's open standard for LLM tool use. Exactly analogous to gRPC+Protobuf for agents: a typed IDL for "what tools does my LLM have access to."

The interesting architectural observation: AI services fit the classic SOA pattern almost unchanged. An embedding service is a microservice. A vector DB is a specialized data store. An LLM gateway is an API gateway with rate limits and prompt-injection guards. The only really new thing is that the "logic" of the service is often a probabilistic model, not deterministic code, which changes testing and observability but not the architecture.

### 20.6 The pendulum swing

Predicting the future is a fool's game, but the signals in 2026 suggest:

1. **Reasonable monoliths with service interfaces.** Most new products will start as a modular monolith with a clean API boundary, and extract services only when there's a forcing function (team scale, different runtime needs, independent release cadence). The "microservices by default" fashion is over.
2. **Durable execution and actor models for stateful coordination.** Temporal, Dapr, and similar tools are eating the hand-rolled-saga category.
3. **Wasm for the edge and for plugin architectures.** Containers for the hot path, Wasm for the long tail.
4. **Platform engineering as the org unit.** Every company above ~50 engineers has a platform team. Every engineer touches Backstage or its equivalent daily.
5. **The CNCF stack as the default.** Kubernetes + Envoy + OTel + Prometheus + a Kafka-shaped thing. Portable across clouds. Vendor lock-in is increasingly viewed as a design smell.
6. **REST at the edge, gRPC/Connect inside, events for async, GraphQL for aggregators.** No winner; all four coexist per use case.
7. **AI-native services folded into the SOA stack.** An LLM call is just another RPC with different tradeoffs (latency variance, cost per call, non-determinism).

The core insight hasn't changed since Bezos's 2002 memo and Fowler/Lewis's 2014 article: **software is easier to build and operate when it's composed of independent, well-defined services with stable contracts**. The tools we use to ship that insight have changed radically — from SOAP and ESBs to REST and gRPC to meshes and durable workflows — but the insight is what's durable. Everything else is implementation detail.

---

## Further reading (for the HTML archive bibliography)

- Roy Fielding, *Architectural Styles and the Design of Network-based Software Architectures*, Ph.D. dissertation, UC Irvine, 2000.
- Leonard Richardson, *The Richardson Maturity Model*, QCon SF talk 2008; Martin Fowler writeup 2010 (martinfowler.com/articles/richardsonMaturityModel.html).
- Martin Fowler and James Lewis, *Microservices*, March 2014 (martinfowler.com/articles/microservices.html).
- Sam Newman, *Building Microservices*, O'Reilly 1st ed 2015 / 2nd ed 2021.
- Sam Newman, *Monolith to Microservices*, O'Reilly 2019.
- Martin Fowler, *MonolithFirst*, June 2015 (martinfowler.com/bliki/MonolithFirst.html).
- Mark Richards and Neal Ford, *Software Architecture: The Hard Parts*, O'Reilly 2021.
- Ben Sigelman et al., *Dapper, a Large-Scale Distributed Systems Tracing Infrastructure*, Google TR 2010.
- Charity Majors, Liz Fong-Jones, George Miranda, *Observability Engineering*, O'Reilly 2022.
- Matthew Skelton and Manuel Pais, *Team Topologies*, IT Revolution 2019.
- Betsy Beyer et al., *Site Reliability Engineering*, O'Reilly 2016.
- Brendan Burns, Joe Beda, Kelsey Hightower, *Kubernetes: Up and Running*, O'Reilly 2017 and later editions.
- Jay Kreps, *I Heart Logs*, O'Reilly 2014 (the Kafka manifesto).
- OpenAPI Specification 3.1 (spec.openapis.org/oas/v3.1.0).
- AsyncAPI Specification 3.0 (asyncapi.com/docs).
- Protocol Buffers language guide (protobuf.dev).
- gRPC documentation (grpc.io/docs).
- Istio documentation (istio.io/latest/docs).
- Envoy documentation (envoyproxy.io/docs/envoy/latest).
- Kubernetes documentation (kubernetes.io/docs).
- Apache Kafka documentation (kafka.apache.org/documentation).
- OpenTelemetry documentation (opentelemetry.io/docs).
- Backstage documentation (backstage.io/docs).
- Temporal documentation (docs.temporal.io).
- Dapr documentation (docs.dapr.io).
- Steve Yegge, *Google Platforms Rant* (the Bezos mandate source), 2011 (widely reposted).
- Adrian Cockcroft, various QCon and re:Invent talks, 2012–2018.
- Werner Vogels, *All Things Distributed* blog (allthingsdistributed.com).
- DHH, *The Majestic Monolith*, 2016 (signalvnoise.com/svn3/the-majestic-monolith).
- Prime Video engineering blog, *Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%*, March 2023.

---

## Addendum: Model Context Protocol — SOA for the agentic era (2024–2026)

This addendum was added in April 2026 as part of a catalog-wide enrichment
pass. The main body above treats microservices, event-driven architecture,
and service meshes as the current state of SOA practice. The 2024–2025
development that the body does not cover is **Model Context Protocol (MCP)**,
which is the first widely-adopted SOA-style protocol designed specifically
for AI agent access to services, and which has grown into one of the
fastest-moving service-interoperability standards in memory.

### What MCP is

**Model Context Protocol** is an open protocol **introduced by Anthropic
in late 2024** for connecting AI agents (most prominently LLM-backed
agents) to external data sources and tools through a uniform client/server
interface. The protocol is the agentic-era answer to the same question
SOA has been answering since the early 2000s: how do you let one piece of
software use another piece of software's capabilities without coupling
them tightly?

The architecture is deliberately conventional:

- **MCP clients** are the AI agents (or any program that needs access
  to external capabilities).
- **MCP servers** are lightweight connectors that expose a specific
  resource — a database, a repository, an API, a filesystem, a
  message bus — through the MCP standard.
- A single agent can talk to many MCP servers simultaneously, and
  each server can be reused by many agents.
- The wire protocol is JSON-RPC-based, with a well-defined capability
  discovery mechanism and a structured tool/resource/prompt model.

MCP has three explicit design goals: (1) protocol, not framework — the
server side is deliberately thin; (2) open, not vendor-specific —
Anthropic published MCP under an open license and does not control
implementations; (3) agent-aware — the protocol assumes the client is
something like an LLM that needs structured metadata to decide which
tools to call.

**Sources:** [Model Context Protocol (MCP) in Agentic AI: Architecture and Industrial Applications — azhar, Medium](https://medium.com/ai-insights-cobet/model-context-protocol-mcp-in-agentic-ai-architecture-and-industrial-applications-7e18c67e2aa7) · [The Model Context Protocol (MCP): A New Standard for Agentic AI Systems — Tejaswi Kashyap, Medium](https://medium.com/@tejaswi_kashyap/the-model-context-protocol-mcp-a-new-standard-for-agentic-ai-systems-9f0600f4276c) · [AI Spotlight: MCP and Agentic AI systems — Gravitee](https://www.gravitee.io/blog/mcp-model-context-protocol-agentic-ai) · [Build Agents using Model Context Protocol on Azure — Microsoft Learn](https://learn.microsoft.com/en-us/azure/developer/ai/intro-agents-mcp)

### The 2025 adoption curve

MCP's adoption in 2025 was rapid on any normal standards-protocol
timeline:

- **Late 2024** — Anthropic publishes the MCP specification.
- **March 2025** — **OpenAI officially adopts MCP** on its platform.
  This is the moment MCP stopped being "Anthropic's protocol" and
  became an industry standard, because it is the most widely-used LLM
  provider formally signing on to a competitor's protocol.
- **2025** — **Microsoft invests in MCP** across its AI ecosystem
  (Azure AI Foundry, VS Code, Copilot). Microsoft publishes its own
  MCP server libraries and positions MCP as the default
  agent-to-service protocol on Azure.
- **October 2025** — More than **5,500 MCP servers** are listed on
  public registries. The twenty most popular generate over 180,000
  monthly searches; **80% of deployed servers are in remote mode**,
  which is a strong signal of production rather than toy use.

For comparison, the equivalent 2004–2006 SOAP / WS-* adoption curve
was considerably slower and ended with SOAP becoming a cautionary
tale about over-standardization. The current MCP adoption curve is
steeper, the protocol is smaller, and the early production-use
percentage is higher. Whether this means MCP will avoid the SOAP
fate or simply fall into it faster is an open question, but the
curve is empirically striking.

**Sources:** [How MCP Simplifies Enterprise AI Agent Development in 2025 — OneReach.ai](https://onereach.ai/blog/how-mcp-simplifies-ai-agent-development/) · [Revolutionize AI Integration with MCP: The Future of Open Standard Protocols 2025 — Baytech Consulting](https://www.baytechconsulting.com/blog/revolutionize-ai-integration-mcp-2025) · [MCP Architecture: From Monolithic SaaS to Agentic Mesh — Digitalkin](https://digitalkin.com/en/learn/mcp-architecture-mesh-agentique) · [LLM based AI Agent access to Micro-services using Model Context Protocol (MCP) — windshetty.wordpress.com, July 2025](https://windshetty.wordpress.com/2025/07/24/llm-based-ai-agent-access-to-micro-serivces-using-model-context-protocol-mcp/)

### The architectural pattern — MCP as adapter over microservices

The important practitioner framing that emerged in 2025 is that **MCP
servers should not be monolithic applications containing business
logic**. They should be thin adapters that translate between the MCP
protocol spoken by AI agents and the REST, gRPC, or event-bus APIs
spoken by existing microservices. The pattern looks like this:

```
AI Agent (MCP client)
     │  (JSON-RPC over MCP)
     ▼
MCP Server (thin adapter)
     │  (REST / gRPC / event bus)
     ▼
Existing microservices
     │
     ▼
Databases, queues, third-party APIs, etc.
```

This is the **strangler fig** pattern from Fowler-era enterprise
integration, applied at the agent-to-service boundary rather than at
the monolith-to-microservice boundary. Existing microservices do not
need to be rewritten to be agent-accessible; they need a thin MCP
adapter in front of them. Most 2025 production MCP deployments follow
this pattern.

### What this means for the SOA story

The main body of this document narrates SOA from its early-2000s
enterprise-service-bus origins through microservices, service meshes,
and the Kubernetes-era convergence on HTTP/gRPC/event-bus as the three
standard interop patterns. MCP is the **fourth** interop pattern in
that sequence: **agent-accessible services** as a first-class protocol
target, with its own discovery mechanism, its own capability model,
and its own tooling.

The deeper continuity is that the SOA principles the early practitioners
articulated — loose coupling, published interfaces, service
discoverability, autonomy — are all load-bearing for MCP. Anthropic
and the MCP community did not re-derive them; they borrowed them from
the SOA tradition, renamed some of them, and applied them to the new
agent-centric context. The continuities are clean enough that any
practitioner who read Thomas Erl's SOA books in 2005 can read the 2025
MCP specification without feeling unfamiliar territory.

The discontinuity is that the "service consumer" in MCP is not a human
programmer writing integration code. It is an LLM agent deciding at
runtime which services to call based on a natural-language goal. That
shift changes the metadata requirements (MCP's tool/resource/prompt
model is richer than OpenAPI's endpoint schemas), changes the security
model (agent access needs fine-grained scoping in a way that
human-operator access often does not), and changes the economic model
(an agent can make thousands of service calls per user query, which
has billing implications that traditional SOA did not have to think
about).

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — SOA, microservices, MCP, and the whole service-interop space are
  systems-engineering topics. The history of how each generation's
  interop protocol is shaped by the dominant client type is a case
  study in co-evolution.
- [**business**](../../../.college/departments/business/DEPARTMENT.md)
  — SOA is a business-infrastructure topic as much as it is a
  technical one. Enterprise adoption of MCP in 2025, the Amazon
  "Bezos mandate" history, and the role of service architecture in
  M&A integration are all business-oriented themes.
- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  For the implementation side: writing an MCP server, wrapping a
  microservice as an MCP tool, and designing service APIs that
  agents can discover and use are all programming topics.
- [**cloud-systems**](../../../.college/departments/cloud-systems/DEPARTMENT.md)
  — Cloud-native service architecture is cloud-systems department
  territory, and MCP is the newest addition to that stack.

---

*Addendum (Model Context Protocol and the agentic-era SOA) and Related College Departments cross-link added during the Session 018 catalog enrichment pass.*
