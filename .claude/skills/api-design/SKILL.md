---
name: api-design
description: Provides REST API design best practices, conventions, and patterns. Use when designing APIs, creating endpoints, choosing status codes, or when user mentions 'API', 'REST', 'endpoint', 'HTTP', 'routes', 'API design'.
---

# REST API Design

Comprehensive reference for designing consistent, secure, and developer-friendly REST APIs.

## Endpoint Naming Conventions

### Rules

1. **Use nouns, not verbs** -- Resources are things, HTTP methods are actions
2. **Use plural nouns** -- Collections are plural: `/users`, `/orders`, `/products`
3. **Use kebab-case** -- Multi-word resources: `/user-profiles`, `/order-items`
4. **Nest for relationships** -- `/users/{id}/orders` (orders belonging to a user)
5. **Max 2 levels of nesting** -- Beyond that, use query parameters or top-level resources
6. **No trailing slashes** -- `/users` not `/users/`
7. **No file extensions** -- `/users` not `/users.json`

### Good vs Bad Examples

| Bad | Good | Why |
|-----|------|-----|
| `GET /getUsers` | `GET /users` | Verb in URL; HTTP method already says "get" |
| `POST /createUser` | `POST /users` | POST implies creation |
| `DELETE /deleteUser/5` | `DELETE /users/5` | DELETE method is the verb |
| `GET /user` | `GET /users` | Use plural consistently |
| `GET /Users` | `GET /users` | Lowercase only |
| `GET /user_profiles` | `GET /user-profiles` | Use kebab-case, not snake_case |
| `GET /users/5/orders/3/items/7` | `GET /order-items/7` | Too deeply nested |
| `PUT /users/5/updateEmail` | `PATCH /users/5` with body | No verbs in path |

---

## HTTP Methods

| Method | Purpose | Idempotent | Safe | Request Body |
|--------|---------|------------|------|-------------|
| `GET` | Retrieve resource(s) | Yes | Yes | No |
| `POST` | Create resource | No | No | Yes |
| `PUT` | Replace entire resource | Yes | No | Yes |
| `PATCH` | Partial update | No* | No | Yes |
| `DELETE` | Remove resource | Yes | No | Optional |
| `HEAD` | Same as GET without body | Yes | Yes | No |
| `OPTIONS` | Describe available operations | Yes | Yes | No |

*PATCH can be made idempotent with proper design but is not required to be.

### Method Semantics

```
GET    /users          -- List all users (with pagination)
GET    /users/42       -- Get user 42
POST   /users          -- Create a new user
PUT    /users/42       -- Replace user 42 entirely
PATCH  /users/42       -- Update specific fields of user 42
DELETE /users/42       -- Delete user 42
```

### When PUT vs PATCH

| Scenario | Method | Why |
|----------|--------|-----|
| Updating a user's entire profile | `PUT` | Replacing the whole resource |
| Changing just the email | `PATCH` | Modifying one field |
| Uploading a new avatar image | `PUT` | Replacing the sub-resource entirely |
| Toggling a setting | `PATCH` | Single field change |

---

## Status Codes

### Success (2xx)

| Code | Meaning | Use When |
|------|---------|----------|
| `200 OK` | Request succeeded | GET, PUT, PATCH, DELETE (with body) |
| `201 Created` | Resource created | POST that creates a resource |
| `202 Accepted` | Request accepted, processing async | Long-running operations |
| `204 No Content` | Success, no response body | DELETE, PUT/PATCH with no response body |

### Client Errors (4xx)

| Code | Meaning | Use When |
|------|---------|----------|
| `400 Bad Request` | Malformed request | Invalid JSON, missing required fields, validation errors |
| `401 Unauthorized` | Not authenticated | Missing or invalid auth credentials |
| `403 Forbidden` | Authenticated but not authorized | Valid credentials but insufficient permissions |
| `404 Not Found` | Resource does not exist | ID not found, wrong endpoint |
| `405 Method Not Allowed` | HTTP method not supported | POST to a read-only resource |
| `409 Conflict` | State conflict | Duplicate creation, concurrent edit conflict |
| `410 Gone` | Resource permanently deleted | Known-deleted resources (vs. 404 for never-existed) |
| `415 Unsupported Media Type` | Wrong Content-Type | Sending XML when only JSON accepted |
| `422 Unprocessable Entity` | Semantically invalid | JSON is valid but data doesn't make sense |
| `429 Too Many Requests` | Rate limit exceeded | Client sent too many requests |

### Server Errors (5xx)

| Code | Meaning | Use When |
|------|---------|----------|
| `500 Internal Server Error` | Unhandled server error | Unexpected failures (log these) |
| `502 Bad Gateway` | Upstream service failed | Proxy/gateway got bad response |
| `503 Service Unavailable` | Server temporarily down | Maintenance, overload |
| `504 Gateway Timeout` | Upstream timeout | Upstream service too slow |

### Common Mistakes

| Situation | Wrong | Right |
|-----------|-------|-------|
| Validation failed | `400` | `422` (semantically invalid) |
| User not logged in | `403` | `401` (not authenticated) |
| User lacks permission | `401` | `403` (authenticated but forbidden) |
| Resource created | `200` | `201` with Location header |
| Delete succeeded | `200` with empty body | `204` (no content) |
| Async job started | `200` | `202` with status endpoint |

---

## Error Response Format

Use a consistent error format across all endpoints.

### Standard Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address.",
        "code": "INVALID_FORMAT"
      },
      {
        "field": "age",
        "message": "Must be between 0 and 150.",
        "code": "OUT_OF_RANGE"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

### Error Code Registry

Define machine-readable error codes. Do not rely on HTTP status codes alone.

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | One or more fields are invalid |
| `NOT_FOUND` | 404 | Resource does not exist |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CONFLICT` | 409 | Resource state conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Security Rules for Errors

- **Never expose stack traces** in production responses
- **Never reveal database details** (table names, column names, query text)
- **Never confirm existence** of resources the user cannot access (return 404, not 403, for hidden resources)
- **Never include sensitive data** in error messages (passwords, tokens, PII)
- **Always include a request ID** for debugging correlation

---

## Pagination

### Cursor-Based (Recommended)

Best for: real-time data, large datasets, data that changes frequently.

```
GET /users?limit=20&after=eyJpZCI6NDJ9
```

Response:

```json
{
  "data": [...],
  "pagination": {
    "has_next": true,
    "has_previous": true,
    "next_cursor": "eyJpZCI6NjJ9",
    "previous_cursor": "eyJpZCI6NDN9"
  }
}
```

**Pros:** Stable under inserts/deletes, good performance on large tables.
**Cons:** Cannot jump to arbitrary page.

### Offset-Based

Best for: small datasets, admin panels, situations where page jumping is needed.

```
GET /users?page=3&per_page=20
```

Response:

```json
{
  "data": [...],
  "pagination": {
    "page": 3,
    "per_page": 20,
    "total": 245,
    "total_pages": 13
  }
}
```

**Pros:** Simple, supports page jumping.
**Cons:** Slow on large tables (OFFSET is O(n)), unstable under concurrent writes.

### Pagination Comparison

| Factor | Cursor | Offset |
|--------|--------|--------|
| Performance at scale | Good | Degrades |
| Stability under writes | Stable | Items shift |
| Jump to page N | No | Yes |
| Implementation complexity | Medium | Low |
| Use for infinite scroll | Yes | Risky |

### Pagination Rules

- Always set a **maximum page size** (e.g., 100). Never let clients request unlimited results.
- Always set a **default page size** (e.g., 20). Do not require clients to specify it.
- Return pagination metadata in every list response.
- Use consistent parameter names across all endpoints.

---

## Versioning

### Strategies

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| URL path | `/v1/users` | Explicit, easy to route | URL changes on version bump |
| Header | `Accept: application/vnd.api+json;version=1` | Clean URLs | Hidden, easy to forget |
| Query param | `/users?version=1` | Simple | Pollutes query string |

**Recommendation:** URL path versioning (`/v1/`) is the most explicit and easiest to manage. Use it unless you have a specific reason not to.

### Versioning Rules

- Version the API, not individual endpoints
- Support at least N-1 version (current + previous)
- Document deprecation timeline (minimum 6 months)
- Return `Deprecation` header on old versions: `Deprecation: true`
- Never remove fields from a response without a version bump
- Adding fields to a response is NOT a breaking change

### What Is a Breaking Change?

| Change | Breaking? | Action Required |
|--------|-----------|-----------------|
| Adding a response field | No | None |
| Removing a response field | Yes | New version |
| Adding optional request param | No | None |
| Adding required request param | Yes | New version |
| Changing field type | Yes | New version |
| Changing error format | Yes | New version |
| Changing URL structure | Yes | New version |
| Adding a new endpoint | No | None |

---

## Authentication Patterns

### Bearer Token (JWT)

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Best for: SPAs, mobile apps, microservice-to-microservice.

### API Key

```
X-API-Key: sk_live_abc123def456
```

Best for: server-to-server, third-party integrations, public APIs.

### Security Checklist

- [ ] Use HTTPS for all endpoints, no exceptions
- [ ] Tokens expire (short-lived access tokens, longer refresh tokens)
- [ ] API keys are revocable
- [ ] Auth credentials are in headers, never in URLs (URLs are logged)
- [ ] Failed auth returns `401`, not `400` or `500`
- [ ] Rate limit auth endpoints more aggressively (prevent brute force)
- [ ] Log authentication failures for monitoring
- [ ] Use constant-time comparison for token validation (prevent timing attacks)

---

## Rate Limiting

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 67
X-RateLimit-Reset: 1672531200
Retry-After: 30
```

### Rate Limit Response (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "retry_after": 30
  }
}
```

### Rate Limiting Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| Fixed window | N requests per time window | Simple APIs |
| Sliding window | Rolling time window | More accurate limiting |
| Token bucket | Tokens replenish over time | Burst-friendly |
| Per-endpoint | Different limits per route | Mixed-use APIs |
| Per-tier | Limits based on plan/role | SaaS products |

---

## Filtering, Sorting, and Field Selection

### Filtering

```
GET /users?status=active&role=admin
GET /orders?created_after=2024-01-01&total_gt=100
```

### Sorting

```
GET /users?sort=created_at        (ascending, default)
GET /users?sort=-created_at       (descending, prefix with -)
GET /users?sort=-created_at,name  (multi-field)
```

### Field Selection (Sparse Fieldsets)

```
GET /users?fields=id,name,email
```

Reduces payload size. Useful for mobile clients and list views.

### Security Warning

Never allow filtering on sensitive fields. Validate that sort and filter fields are from an allowlist. Reject unknown parameters rather than ignoring them (prevents typo-based bugs).

---

## CORS and Security Headers

### Required Headers

```
Content-Type: application/json
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CORS Configuration

- Specify exact allowed origins (never `*` with credentials)
- Limit allowed methods to those actually used
- Limit allowed headers to those actually needed
- Set appropriate `max-age` for preflight caching

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Verbs in URLs | `/getUser`, `/deleteItem` | Use HTTP methods + noun resources |
| Returning 200 for errors | Client can't distinguish success/failure | Use proper status codes |
| Exposing internal IDs | Sequential IDs leak info (total count, creation rate) | Use UUIDs or opaque IDs |
| No pagination | Unbounded queries crash servers | Always paginate list endpoints |
| Inconsistent naming | `/users` + `/UserProfile` + `/order_items` | Pick one convention, apply everywhere |
| Accepting unused params silently | Typos in params go unnoticed | Return 400 for unknown parameters |
| Version in response body only | Cannot route at infrastructure level | Use URL path versioning |
| Returning HTML errors from JSON API | Breaks client parsers | Always return JSON errors |
| No request ID | Cannot trace issues across services | Include request ID in every response |
| Leaking internals in errors | Exposes attack surface | Sanitize all error messages |

## Design Checklist

Before shipping any API endpoint:

- [ ] URL uses plural nouns, kebab-case, no verbs
- [ ] Correct HTTP method for the operation
- [ ] Proper status codes for success and all error cases
- [ ] Consistent error response format with error codes
- [ ] Pagination on all list endpoints (with max page size)
- [ ] Authentication required (unless intentionally public)
- [ ] Authorization checked (not just authentication)
- [ ] Input validation on all parameters
- [ ] Rate limiting configured
- [ ] CORS headers set correctly
- [ ] No sensitive data in URLs or error messages
- [ ] Request ID in responses for traceability
- [ ] API documentation updated
