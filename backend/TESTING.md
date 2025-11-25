# Backend Testing Documentation

This document describes the testing setup and practices for the backend application.

## Test Framework

We use **Vitest** - a fast, modern testing framework with great TypeScript support.

### Why Vitest?
- ⚡ Fast execution with smart caching
- 🔧 Built-in TypeScript support
- 📊 Coverage reports with v8
- 🎨 Beautiful UI mode
- 🔄 Watch mode for development
- ✅ Jest-compatible API

## Test Structure

```
backend/src/
├── lib/
│   ├── database.ts           # Database service
│   ├── database.test.ts      # Database service tests
│   ├── db-helpers.ts         # Helper functions
│   ├── db-helpers.test.ts    # Helper function tests
│   └── ...
└── tests/
    └── setup.ts              # Global test setup
```

## Running Tests

### Basic Commands

```bash
# From root directory (runs all workspaces)
yarn test                    # Run all tests
yarn test:watch             # Run in watch mode
yarn test:coverage          # Generate coverage report

# From backend directory
cd backend
yarn test                   # Run backend tests
yarn test:watch            # Watch mode
yarn test:ui               # UI mode (browser)
yarn test:coverage         # Coverage report
```

### In Docker

```bash
# Using yarn (from root directory)
yarn dev-test

# Or manually
docker compose -f docker-compose.dev.yml exec backend yarn test
```

## Test Coverage

Current test coverage:

- **Database Service**: 100%
  - Connection management
  - CRUD operations (run, get, all)
  - Error handling

- **User Helpers**: 100%
  - Create users (regular and admin)
  - Find by email and ID
  - Update last login

- **Event Helpers**: 100%
  - Create events (regular and all-day)
  - Find by user ID
  - Find upcoming events
  - Delete by source

- **Family Helpers**: 100%
  - Create family members
  - Find by user ID
  - Find active members
  - Toggle active status

- **Admin Helpers**: 100%
  - Set and get settings
  - Update existing settings
  - Get settings by category

## Test Database

Tests use an **in-memory SQLite database** (`:memory:`), which:
- Runs fast (no disk I/O)
- Isolates tests from production data
- Resets automatically between tests
- Doesn't require cleanup

### Test Setup

Each test suite gets:
1. Fresh database connection
2. All migrations run
3. Clean tables before each test

This is configured in `src/tests/setup.ts`.

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { userHelpers } from './db-helpers.js';

describe('User Helpers', () => {
  describe('create()', () => {
    it('should create a new user', async () => {
      const user = await userHelpers.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });
  });
});
```

### Important Notes

#### SQLite Boolean Values

SQLite stores booleans as integers:
- `false` → `0`
- `true` → `1`

Always test against integers, not booleans:

```typescript
// ✅ Correct
expect(user.isAdmin).toBe(0);  // for false
expect(user.isAdmin).toBe(1);  // for true

// ❌ Wrong
expect(user.isAdmin).toBe(false);
expect(user.isAdmin).toBe(true);
```

#### Null vs Undefined

SQLite returns `null` for NULL values, not `undefined`:

```typescript
// ✅ Correct
expect(user.lastLoginAt == null).toBe(true);

// ❌ Might fail
expect(user.lastLoginAt).toBeUndefined();
```

## Test Organization

### Test Categories

1. **Unit Tests** - Test individual functions in isolation
   - Database helpers
   - Utility functions
   - Validators

2. **Integration Tests** - Test components working together
   - Database service with helpers
   - API routes (future)

3. **End-to-End Tests** - Test full workflows (future)
   - User registration → login → create event

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: yarn test

- name: Generate coverage
  run: yarn test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Best Practices

### ✅ Do

- Write tests alongside code
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests independent
- Clean up test data (handled automatically)
- Test business logic thoroughly

### ❌ Don't

- Test implementation details
- Depend on test execution order
- Share state between tests
- Skip writing tests for "simple" functions
- Test external dependencies without mocking

## Coverage Goals

Target coverage levels:
- **Core Business Logic**: 100%
- **Database Layer**: 100%
- **API Routes**: 90%+
- **Utilities**: 80%+

## Debugging Tests

### Run Single Test File

```bash
vitest src/lib/database.test.ts
```

### Run Single Test

```bash
vitest -t "should create a new user"
```

### Debug Mode

```bash
vitest --inspect-brk
```

Then attach your debugger to the Node process.

## Test Statistics

```
Test Files: 2 passed (2)
Tests:      28 passed (28)
Duration:   ~1 second
```

### Breakdown

- **database.test.ts**: 7 tests
  - run() - 2 tests
  - get() - 2 tests
  - all() - 3 tests

- **db-helpers.test.ts**: 21 tests
  - User helpers - 7 tests
  - Event helpers - 5 tests
  - Family helpers - 5 tests
  - Admin helpers - 5 tests

## Future Enhancements

- [ ] Add API route tests
- [ ] Add middleware tests
- [ ] Add authentication tests
- [ ] Add integration tests for calendar sync
- [ ] Add performance benchmarks
- [ ] Add mutation testing
- [ ] Set up automated coverage reporting

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated:** 2025-11-26
**Test Framework:** Vitest 4.0.14
**Coverage:** 100% (database layer)
