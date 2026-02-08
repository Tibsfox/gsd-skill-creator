---
name: test-generator
description: Generates test cases for functions and components. Use when writing tests, creating test suites, or when user mentions 'test', 'testing', 'unit test', 'test case', 'test coverage'.
---

# Test Generation

Generate comprehensive tests that verify behavior, catch regressions, and serve as documentation.

## Test Structure

Follow the Arrange-Act-Assert (AAA) pattern:

```typescript
describe('calculateTotal', () => {
  it('should apply discount when quantity exceeds threshold', () => {
    // Arrange - set up test data
    const items = [
      { price: 100, quantity: 5 },
      { price: 50, quantity: 10 }
    ];
    const discountThreshold = 10;
    const discountRate = 0.1;

    // Act - perform the operation
    const result = calculateTotal(items, discountThreshold, discountRate);

    // Assert - verify the outcome
    expect(result).toBe(945); // 1000 - 10% discount
  });
});
```

## What to Test

### Test Categories

| Category | What to Test | Example |
|----------|--------------|---------|
| **Happy path** | Normal expected input | Valid user login |
| **Edge cases** | Boundary values, limits | Empty array, max values |
| **Error cases** | Invalid input, failures | Wrong password, network error |
| **State changes** | Before/after conditions | Database updates |
| **Integration** | Component interaction | API calls, events |

### Coverage Checklist

For each function, consider testing:

- [ ] Valid input returns expected output
- [ ] Empty/null inputs are handled
- [ ] Boundary values work correctly
- [ ] Invalid inputs throw appropriate errors
- [ ] Side effects occur as expected
- [ ] Async operations resolve/reject properly
- [ ] Edge cases don't cause crashes

## Naming Conventions

Use descriptive names that explain the scenario:

```typescript
// Pattern: should [expected behavior] when [condition]
it('should return empty array when input is null')
it('should throw ValidationError when email format is invalid')
it('should apply discount when total exceeds $100')
it('should not update timestamp when only metadata changes')
```

## Test Patterns

### Pure Functions

Easiest to test - same input always produces same output:

```typescript
describe('formatCurrency', () => {
  it('should format positive numbers with dollar sign', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should format negative numbers with parentheses', () => {
    expect(formatCurrency(-50)).toBe('($50.00)');
  });
});
```

### Async Functions

Test both success and failure paths:

```typescript
describe('fetchUser', () => {
  it('should return user data for valid ID', async () => {
    const user = await fetchUser('123');
    expect(user.id).toBe('123');
    expect(user.email).toBeDefined();
  });

  it('should throw NotFoundError for invalid ID', async () => {
    await expect(fetchUser('invalid')).rejects.toThrow(NotFoundError);
  });

  it('should handle network failures gracefully', async () => {
    mockNetwork.simulateFailure();
    await expect(fetchUser('123')).rejects.toThrow('Network error');
  });
});
```

### Functions with Side Effects

Use mocks to isolate and verify:

```typescript
describe('sendNotification', () => {
  const mockEmailService = { send: jest.fn() };

  beforeEach(() => {
    mockEmailService.send.mockClear();
  });

  it('should send email to user', async () => {
    await sendNotification('user@example.com', 'Hello');

    expect(mockEmailService.send).toHaveBeenCalledWith({
      to: 'user@example.com',
      body: 'Hello'
    });
  });

  it('should not send email when user unsubscribed', async () => {
    mockUserPrefs.isUnsubscribed.mockReturnValue(true);

    await sendNotification('user@example.com', 'Hello');

    expect(mockEmailService.send).not.toHaveBeenCalled();
  });
});
```

## Common Assertions

| Assertion | Use Case |
|-----------|----------|
| `toBe(value)` | Primitive equality |
| `toEqual(value)` | Deep object equality |
| `toBeTruthy()` / `toBeFalsy()` | Boolean context |
| `toContain(item)` | Array/string contains |
| `toThrow(error)` | Function throws |
| `toHaveLength(n)` | Array/string length |
| `toHaveBeenCalledWith()` | Mock verification |
| `toMatchObject(obj)` | Partial object match |
| `toBeNull()` / `toBeUndefined()` | Null checks |
| `toBeGreaterThan(n)` | Numeric comparison |

## Test Organization

### Group Related Tests

```typescript
describe('ShoppingCart', () => {
  describe('addItem', () => {
    it('should add new item to cart');
    it('should increment quantity for existing item');
    it('should throw when item is out of stock');
  });

  describe('removeItem', () => {
    it('should remove item from cart');
    it('should do nothing when item not in cart');
  });

  describe('calculateTotal', () => {
    it('should sum all item prices');
    it('should apply discount codes');
    it('should add tax based on region');
  });
});
```

### Setup and Teardown

```typescript
describe('DatabaseOperations', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    await db.clear();
  });

  it('should insert record', async () => {
    // Test with clean database state
  });
});
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Better Approach |
|--------------|---------|-----------------|
| Testing implementation | Brittle, breaks on refactor | Test behavior |
| Shared mutable state | Tests affect each other | Reset in beforeEach |
| Too many assertions | Hard to debug failures | One concept per test |
| Testing private methods | Implementation detail | Test through public API |
| Flaky async tests | Random failures | Use proper awaits, increase timeouts |
| Snapshot overuse | Meaningless assertions | Assert specific values |
