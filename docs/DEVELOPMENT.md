# Development

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test src/agents/cluster-detector.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Building

```bash
# Compile TypeScript
npm run build

# Type check without emit
npx tsc --noEmit

# Clean and rebuild
rm -rf dist/ && npm run build
```

## Project Structure

See [FILE-STRUCTURE.md](FILE-STRUCTURE.md) for the complete source code layout.
