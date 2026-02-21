# Aurswift Testing Structure & Best Practices

## Overview

This document outlines the comprehensive testing strategy for Aurswift POS System, including project structure, test types, dependencies, and best practices.

> **📘 For the complete industry-standard testing plan with library recommendations, see [BEST_PRACTICE_TESTING_PLAN.md](./BEST_PRACTICE_TESTING_PLAN.md)**

## Technology Stack

- **Main Process**: TypeScript, Electron, Drizzle ORM, better-sqlite3
- **Renderer Process**: React 19, TypeScript, Redux Toolkit, TanStack Query
- **E2E Testing**: Playwright (already implemented)
- **Unit/Integration Testing**: Vitest (recommended)
- **Component Testing**: Vitest + React Testing Library

---

## Test Types & Structure

### 1. **Unit Tests** (`tests/unit/`)

Test individual functions, classes, and utilities in isolation.

**Structure:**

```
tests/
├── unit/
│   ├── main/
│   │   ├── database/
│   │   │   ├── managers/
│   │   │   │   ├── transactionManager.test.ts
│   │   │   │   ├── productManager.test.ts
│   │   │   │   ├── userManager.test.ts
│   │   │   │   └── ...
│   │   │   ├── utils/
│   │   │   │   └── dbInfo.test.ts
│   │   │   └── validation/
│   │   │       └── authSchemas.test.ts
│   │   ├── services/
│   │   │   ├── paymentService.test.ts
│   │   │   ├── thermalPrinterService.test.ts
│   │   │   ├── scaleService.test.ts
│   │   │   └── ...
│   │   ├── modules/
│   │   │   ├── AutoUpdater.test.ts
│   │   │   └── WindowManager.test.ts
│   │   └── utils/
│   │       └── logger.test.ts
│   └── renderer/
│       ├── shared/
│       │   ├── hooks/
│       │   │   ├── use-auth.test.ts
│       │   │   └── use-scale-manager.test.ts
│       │   ├── utils/
│       │   │   └── auth.test.ts
│       │   └── services/
│       │       └── api/
│       │           └── auth-api.test.ts
│       └── features/
│           ├── products/
│           │   ├── utils/
│           │   │   ├── age-restriction.test.ts
│           │   │   └── expiry-calculations.test.ts
│           └── ...
```

**What to Test:**

- Pure functions (calculations, transformations)
- Business logic (validation, formatting)
- Utility functions
- Class methods (with mocked dependencies)

---

### 2. **Integration Tests** (`tests/integration/`)

Test interactions between multiple components/modules.

**Structure:**

```
tests/
├── integration/
│   ├── main/
│   │   ├── database/
│   │   │   ├── transaction-flow.test.ts
│   │   │   ├── inventory-flow.test.ts
│   │   │   └── user-authentication-flow.test.ts
│   │   ├── services/
│   │   │   ├── payment-integration.test.ts
│   │   │   └── printer-integration.test.ts
│   │   └── ipc/
│   │       ├── auth-ipc.test.ts
│   │       └── transaction-ipc.test.ts
│   └── renderer/
│       ├── hooks/
│       │   ├── use-payment-flow.test.ts
│       │   └── use-cart-flow.test.ts
│       └── features/
│           └── cashier/
│               └── transaction-flow.test.ts
```

**What to Test:**

- Database operations with real/test database
- IPC communication between main and renderer
- Service integrations (payment, printer, scale)
- Multi-step workflows (transaction creation, refunds)

---

### 3. **Component Tests** (`tests/components/`)

Test React components in isolation.

**Structure:**

```
tests/
├── components/
│   ├── ui/
│   │   ├── button.test.tsx
│   │   ├── input.test.tsx
│   │   └── ...
│   ├── scale/
│   │   └── ScaleDisplay.test.tsx
│   └── views/
│       ├── auth/
│       │   └── login-form.test.tsx
│       └── dashboard/
│           └── cashier/
│               └── new-transaction/
│                   └── components/
│                       └── product-card.test.tsx
```

**What to Test:**

- Component rendering
- User interactions (clicks, inputs)
- Props handling
- State changes
- Event handlers

---

### 4. **E2E Tests** (`tests/e2e/`)

Test complete user workflows (already exists, but should be organized).

**Structure:**

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login-flow.spec.ts
│   │   └── register-flow.spec.ts
│   ├── cashier/
│   │   ├── transaction-flow.spec.ts
│   │   ├── payment-flow.spec.ts
│   │   └── receipt-printing.spec.ts
│   ├── hardware/
│   │   ├── scale-integration.spec.ts
│   │   ├── printer-integration.spec.ts
│   │   └── payment-terminal.spec.ts
│   └── admin/
│       ├── inventory-management.spec.ts
│       └── user-management.spec.ts
```

**What to Test:**

- Complete user journeys
- Cross-process communication
- Hardware interactions
- Real-world scenarios

---

### 5. **Snapshot Tests** (`tests/snapshots/`)

Visual regression and component snapshot testing.

**Structure:**

```
tests/
├── snapshots/
│   └── components/
│       └── ui/
│           └── button.snap.tsx
```

---

## Test Utilities & Helpers

### Shared Test Utilities (`tests/utils/`)

```
tests/
├── utils/
│   ├── test-helpers.ts          # Common test utilities
│   ├── mock-factory.ts          # Mock data generators
│   ├── db-setup.ts              # Database test setup
│   ├── electron-mock.ts         # Electron API mocks
│   ├── render-helpers.tsx       # React testing helpers
│   └── fixtures/
│       ├── users.ts
│       ├── products.ts
│       ├── transactions.ts
│       └── ...
```

---

## Configuration Files

### 1. **Vitest Configuration** (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.*", "**/dist/"],
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./packages/renderer/src"),
      "@app/main": path.resolve(__dirname, "./packages/main/src"),
    },
  },
});
```

### 2. **Playwright Configuration** (`playwright.config.ts` - update existing)

Add separate test directories and better organization.

### 3. **Test Setup File** (`tests/setup.ts`)

```typescript
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock Electron APIs
global.window.electron = {
  // Add your electron API mocks
} as any;

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

---

## Dependencies

### Root Package.json (devDependencies)

```json
{
  "devDependencies": {
    "@playwright/test": "^1.55.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitest/ui": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    "jsdom": "^25.0.0",
    "msw": "^2.6.0",
    "vitest": "^2.1.0"
  }
}
```

### Renderer Package.json (devDependencies)

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^5.0.2"
  }
}
```

### Main Package.json (devDependencies)

```json
{
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0"
  }
}
```

---

## Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",

    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:components": "vitest run tests/components",

    "test:main": "vitest run tests/unit/main tests/integration/main",
    "test:renderer": "vitest run tests/unit/renderer tests/components",

    "test:e2e": "playwright test tests/e2e",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",

    "test:all": "npm run test:run && npm run test:e2e",
    "test:all:clean": "npm run db:dev:clean && npm run test:all",

    "test:hardware": "playwright test tests/hardware-integration.spec.ts"
  }
}
```

---

## Best Practices

### 1. **Test Organization**

- Mirror source structure in test directories
- Group related tests in describe blocks
- Use descriptive test names (should/when/then pattern)

### 2. **Mocking Strategy**

- Mock external dependencies (database, hardware, APIs)
- Use MSW (Mock Service Worker) for API mocking
- Create reusable mock factories

### 3. **Database Testing**

- Use in-memory SQLite for unit tests
- Use test database files for integration tests
- Always clean up test data

### 4. **Electron-Specific Testing**

- Mock Electron APIs in unit/integration tests
- Use Playwright for E2E tests (real Electron)
- Test IPC communication separately

### 5. **Hardware Testing**

- Use simulation mode for unit/integration tests
- Test hardware APIs in isolation
- Use real hardware only in E2E tests (with flags)

### 6. **Coverage Goals**

- Aim for 80%+ coverage on business logic
- Focus on critical paths (payments, transactions)
- Don't aim for 100% (UI components can be lower)

### 7. **Test Data Management**

- Use factories for generating test data
- Keep fixtures in separate files
- Use builders for complex objects

### 8. **Performance**

- Keep unit tests fast (< 100ms each)
- Integration tests can be slower (< 1s)
- E2E tests can be slowest (< 10s)

---

## Example Test Patterns

### Unit Test Example (Manager)

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TransactionManager } from "@app/main/database/managers/transactionManager";
import { createMockDB, createMockUUID } from "../utils/test-helpers";

describe("TransactionManager", () => {
  let manager: TransactionManager;
  let mockDB: any;
  let mockUUID: any;

  beforeEach(() => {
    mockDB = createMockDB();
    mockUUID = createMockUUID();
    manager = new TransactionManager(mockDB, mockUUID);
  });

  describe("createTransaction", () => {
    it("should create a transaction with valid data", async () => {
      const transactionData = {
        businessId: "business-1",
        shiftId: "shift-1",
        type: "sale" as const,
        subtotal: 100,
        tax: 10,
        total: 110,
        paymentMethod: "cash" as const,
        status: "completed" as const,
        receiptNumber: "R001",
        timestamp: new Date(),
      };

      const result = await manager.createTransaction(transactionData);

      expect(result).toBeDefined();
      expect(result.total).toBe(110);
      expect(mockDB.insert).toHaveBeenCalled();
    });
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '@/views/dashboard/pages/cashier/new-transaction/components/product-selection/product-card';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 10.99,
    stock: 100,
  };

  it('should render product information', () => {
    render(<ProductCard product={mockProduct} onSelect={vi.fn()} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$10.99')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<ProductCard product={mockProduct} onSelect={onSelect} />);

    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockProduct.id);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestDB, teardownTestDB } from "../utils/db-setup";
import { TransactionManager } from "@app/main/database/managers/transactionManager";
import { ProductManager } from "@app/main/database/managers/productManager";

describe("Transaction Flow Integration", () => {
  let db: any;
  let transactionManager: TransactionManager;
  let productManager: ProductManager;

  beforeAll(async () => {
    db = await setupTestDB();
    transactionManager = new TransactionManager(db, mockUUID);
    productManager = new ProductManager(db, mockUUID);
  });

  afterAll(async () => {
    await teardownTestDB(db);
  });

  it("should create a complete transaction with products", async () => {
    // Create product
    const product = await productManager.createProduct({
      name: "Test Product",
      price: 10.99,
      // ... other fields
    });

    // Create transaction
    const transaction = await transactionManager.createTransaction({
      // ... transaction data
    });

    // Add items
    await transactionManager.addTransactionItem({
      transactionId: transaction.id,
      productId: product.id,
      quantity: 2,
      unitPrice: 10.99,
    });

    // Verify
    const result = await transactionManager.getTransactionById(transaction.id);
    expect(result?.items).toHaveLength(1);
  });
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Unit Tests
  run: npm run test:unit

- name: Run Integration Tests
  run: npm run test:integration

- name: Run Component Tests
  run: npm run test:components

- name: Generate Coverage
  run: npm run test:coverage

- name: Run E2E Tests
  run: npm run test:e2e
```

---

## Migration Plan

1. **Phase 1**: Set up Vitest and basic structure
2. **Phase 2**: Write unit tests for critical business logic
3. **Phase 3**: Add integration tests for key workflows
4. **Phase 4**: Add component tests for UI components
5. **Phase 5**: Reorganize existing E2E tests
6. **Phase 6**: Set up coverage reporting and CI integration

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
