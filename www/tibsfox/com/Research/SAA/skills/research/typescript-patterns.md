---
name: typescript-patterns
description: Provides TypeScript best practices and common patterns. Use when writing TypeScript code, fixing type errors, or when user mentions 'TypeScript', 'types', 'interfaces', 'generics', 'type safety'.
---

# TypeScript Patterns

Best practices and common patterns for writing type-safe, maintainable TypeScript code.

## Type vs Interface

### When to Use Interface

- Defining object shapes
- Extending other interfaces
- Declaration merging (augmenting existing types)

```typescript
// Object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Extending
interface AdminUser extends User {
  permissions: string[];
}

// Declaration merging
interface Window {
  myApp: MyApp;
}
```

### When to Use Type

- Union types
- Tuple types
- Mapped types
- Complex type transformations

```typescript
// Union types
type Status = 'pending' | 'approved' | 'rejected';

// Tuple types
type Point = [number, number];

// Mapped types
type Readonly<T> = { readonly [K in keyof T]: T[K] };

// Complex transformations
type AsyncFunction<T> = () => Promise<T>;
```

### Quick Reference

| Use Case | Prefer |
|----------|--------|
| Object shape | `interface` |
| Union of types | `type` |
| Extending shapes | `interface` |
| Intersection types | `type` |
| Function signature | Either |
| Tuple | `type` |
| Primitives | `type` |

## Discriminated Unions

Model state machines and variants with type safety:

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function processResult<T>(result: Result<T>): T {
  if (result.success) {
    return result.data; // TypeScript knows data exists
  }
  throw result.error; // TypeScript knows error exists
}

// API Response example
type ApiResponse =
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; message: string };

function renderResponse(response: ApiResponse) {
  switch (response.status) {
    case 'loading':
      return <Spinner />;
    case 'success':
      return <UserList users={response.data} />;
    case 'error':
      return <Error message={response.message} />;
  }
}
```

## Type Guards

Narrow types at runtime with proper type narrowing:

```typescript
// typeof guard
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase(); // TypeScript knows it's string
  }
  return value.toFixed(2); // TypeScript knows it's number
}

// Custom type guard
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj
  );
}

// Using the guard
function handleData(data: unknown) {
  if (isUser(data)) {
    console.log(data.email); // TypeScript knows data is User
  }
}

// in operator guard
function hasLength(obj: unknown): obj is { length: number } {
  return typeof obj === 'object' && obj !== null && 'length' in obj;
}
```

## Generic Constraints

Constrain generics for better type safety:

```typescript
// Basic constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Multiple constraints
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

// Conditional constraints
type ArrayElement<T> = T extends Array<infer U> ? U : never;

// Default generic
function createArray<T = string>(length: number, value: T): T[] {
  return Array(length).fill(value);
}
```

## Utility Types

Built-in types for common transformations:

| Utility | Purpose | Example |
|---------|---------|---------|
| `Partial<T>` | Make all properties optional | `Partial<User>` |
| `Required<T>` | Make all properties required | `Required<Options>` |
| `Readonly<T>` | Make all properties readonly | `Readonly<Config>` |
| `Pick<T, K>` | Select specific properties | `Pick<User, 'id' \| 'name'>` |
| `Omit<T, K>` | Remove specific properties | `Omit<User, 'password'>` |
| `Record<K, V>` | Object with specified keys/values | `Record<string, number>` |
| `Extract<T, U>` | Extract types assignable to U | `Extract<Status, 'active'>` |
| `Exclude<T, U>` | Remove types assignable to U | `Exclude<Status, 'deleted'>` |
| `NonNullable<T>` | Remove null and undefined | `NonNullable<string \| null>` |
| `ReturnType<T>` | Get function return type | `ReturnType<typeof fetch>` |
| `Parameters<T>` | Get function parameter types | `Parameters<typeof fn>` |

### Practical Examples

```typescript
// Create update functions
type UserUpdate = Partial<Omit<User, 'id'>>;

// API response handling
type UserResponse = Pick<User, 'id' | 'name' | 'email'>;

// Configuration with defaults
type AppConfig = Required<Partial<Config>>;

// Dictionary types
type UserMap = Record<string, User>;

// Extract from union
type ActiveStatus = Extract<Status, 'active' | 'pending'>;
```

## Error Handling Patterns

### Result Type

Avoid exceptions with explicit error handling:

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { ok: false, error: 'Division by zero' };
  }
  return { ok: true, value: a / b };
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}
```

### Typed Error Classes

Create specific error types:

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(
    public readonly resource: string,
    public readonly id: string
  ) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// Usage
function handleError(error: unknown) {
  if (error instanceof ValidationError) {
    console.log(`Field: ${error.field}, Code: ${error.code}`);
  } else if (error instanceof NotFoundError) {
    console.log(`Missing: ${error.resource}/${error.id}`);
  }
}
```

## Strict Configuration

Enable these compiler options for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `any` overuse | Loses type safety | Use `unknown` and narrow |
| Type assertions | Can hide errors | Use type guards |
| `!` operator | Ignores null checks | Handle null properly |
| Index signatures | Too permissive | Use `Record` or mapped types |
| Missing return types | Implicit any in complex functions | Add explicit return types |

```typescript
// BAD: any loses type safety
function parse(data: any) {
  return data.name; // No error even if wrong
}

// GOOD: unknown requires narrowing
function parse(data: unknown) {
  if (isUser(data)) {
    return data.name; // Safe access
  }
  throw new Error('Invalid data');
}

// BAD: assertion can lie
const user = data as User; // Hope it's a User

// GOOD: guard verifies
if (isUser(data)) {
  const user = data; // Verified User
}
```
