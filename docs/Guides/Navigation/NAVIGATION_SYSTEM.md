# Navigation System Documentation

## Overview

AuraSwift EPOS uses a centralized, hierarchical navigation system built on top of React. The system provides type-safe navigation, RBAC (Role-Based Access Control) integration, and support for nested views. It replaces traditional React Router patterns for internal app navigation while still using React Router for the top-level route structure.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [File Structure](#file-structure)
4. [Navigation Flow](#navigation-flow)
5. [Components](#components)
6. [Hooks](#hooks)
7. [View Registry](#view-registry)
8. [Feature Integration](#feature-integration)
9. [RBAC Integration](#rbac-integration)
10. [Code Examples](#code-examples)

---

## Architecture Overview

The navigation system follows a centralized registry pattern with context-based state management:

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      App.tsx (Router)                      │ │
│  │  • HashRouter (top-level routes)                          │ │
│  │  • /auth → AuthPage                                       │ │
│  │  • /dashboard → DashboardView (Protected)                 │ │
│  └────────────────────┬───────────────────────────────────────┘ │
└─────────────────────────┼──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                  NAVIGATION PROVIDER LAYER                      │
│  ┌────────────────────────────────────────────────────────────┐│
│  │           NavigationProvider (State Manager)              ││
│  │  • Manages current view                                   ││
│  │  • Maintains view history                                 ││
│  │  • Handles view parameters                                ││
│  │  • Supports nested navigation                             ││
│  └────────────────────┬───────────────────────────────────────┘│
└─────────────────────────┼──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                    NAVIGATION CONTEXT                           │
│  NavigationContext → NavigationContextValue                     │
│  • state: NavigationState                                       │
│  • navigateTo(viewId, params?)                                  │
│  • goBack()                                                     │
│  • goToRoot()                                                   │
│  • canGoBack: boolean                                           │
│  • getNestedNavigation(parentId)                                │
└─────────────────────────┬──────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ useNavigation│  │useNested    │  │useDashboard │
│   Hook      │  │Navigation   │  │Navigation   │
│             │  │   Hook      │  │   Hook      │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                      VIEW REGISTRY                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         VIEW_REGISTRY (Central Registry)                 │ │
│  │  • Inventory Views (inventoryViews)                      │ │
│  │  • Sales Views (salesViews)                              │ │
│  │  • Staff Views (staffViews)                              │ │
│  │  • RBAC Views (rbacViews)                                │ │
│  │  • Settings Views (settingsViews)                        │ │
│  │  • User Views (usersViews)                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Helper Functions:                                              │
│  • getView(viewId) → ViewConfig                                │
│  • getRootViews() → ViewConfig[]                               │
│  • getNestedViews(parentId) → ViewConfig[]                     │
│  • getViewHierarchy(viewId) → ViewConfig[]                     │
│  • canAccessView(viewId, perms, role) → boolean                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────┐
│                  RENDERING LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         NavigationContainer / NestedViewContainer        │ │
│  │  • Renders current view based on state                   │ │
│  │  • Handles view transitions                              │ │
│  │  • Wraps in Suspense + ErrorBoundary                     │ │
│  │  • Passes view parameters                                │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. View Levels

The system supports multiple view hierarchy levels:

```typescript
type ViewLevel = "root" | "nested" | "modal" | "drawer";
```

- **root**: Top-level views (Dashboard, User Management, Sales, etc.)
- **nested**: Child views within a parent view (Product List within Product Management)
- **modal**: Modal dialog views
- **drawer**: Side panel/drawer views

### 2. View Configuration

Each view is defined by a `ViewConfig` object:

```typescript
interface ViewConfig {
  id: string; // Unique identifier
  level: ViewLevel; // Hierarchy level
  parentId?: string; // Parent view ID (for nested views)
  component: ComponentType<any>; // React component to render
  metadata: ViewMetadata; // Display info (title, description, icon)
  chrome?: ViewChromeConfig; // UI chrome settings
  permissions?: string[]; // Required permissions (any of these)
  roles?: string[]; // Required roles (any of these)
  defaultParams?: Record<string, unknown>; // Default parameters
  requiresAuth?: boolean; // Authentication requirement
}
```

### 3. Navigation State

The navigation system maintains state for each navigation context:

```typescript
interface NavigationState {
  currentView: string; // Active view ID
  viewHistory: string[]; // Navigation history
  viewParams: Record<string, unknown>; // Current view parameters
  nestedViews: Record<string, NavigationState>; // Nested navigation states
}
```

### 4. Route Constants

Features define their routes using standardized constants:

```typescript
// Example from inventory feature
export const INVENTORY_ROUTES = {
  DASHBOARD: "inventory:dashboard",
  PRODUCTS: "inventory:products",
  PRODUCT_DETAILS: "inventory:product-details",
  BATCHES: "inventory:batches",
  CATEGORIES: "inventory:categories",
} as const;
```

**Naming Convention**: `{feature}:{view-name}`

---

## File Structure

```
packages/renderer/src/navigation/
├── index.ts                          # Public exports
├── components/
│   ├── index.ts
│   ├── navigation-container.tsx      # Main view renderer
│   ├── nested-view-container.tsx     # Nested view renderer
│   ├── dashboard-page-wrapper.tsx    # Dashboard role routing
│   ├── authenticated-app-shell.tsx   # Authenticated app wrapper
│   ├── protected-app-shell.tsx       # Protected route wrapper
│   └── view-wrapper.tsx              # Generic view wrapper
├── context/
│   ├── index.ts
│   ├── navigation-context.tsx        # Context definition
│   └── navigation-provider.tsx       # Context provider
├── hooks/
│   ├── index.ts
│   ├── use-navigation.ts             # Main navigation hook
│   ├── use-nested-navigation.ts      # Nested navigation hook
│   └── use-dashboard-navigation.ts   # Dashboard-specific hook
├── registry/
│   ├── index.ts
│   ├── view-registry.ts              # Central view registry
│   └── route-mapper.ts               # Legacy route mapping
├── types/
│   ├── index.ts
│   └── navigation.types.ts           # Type definitions
└── utils/
    └── index.ts                      # Utility functions
```

---

## Navigation Flow

### 1. Initial Application Load

```
┌──────────────────┐
│   App Starts     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  HashRouter      │
│  Routes defined  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│  /dashboard route        │
│  Protected by            │
│  ProtectedRoute HOC      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  DashboardView           │
│  Wraps app in            │
│  NavigationProvider      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  NavigationProvider      │
│  initialView="dashboard" │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  AuthenticatedAppShell   │
│  Layout + Header +       │
│  NavigationContainer     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  NavigationContainer     │
│  Renders current view    │
│  based on state          │
└──────────────────────────┘
```

### 2. View Navigation Flow

```
┌──────────────────────────────┐
│  User clicks "Inventory"     │
│  button in dashboard         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  useNavigation().navigateTo()│
│  navigateTo(INVENTORY_ROUTES │
│    .DASHBOARD)               │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  RBAC Check                  │
│  1. Get view config          │
│  2. Check user permissions   │
│  3. Check user role          │
└────────┬─────────────────────┘
         │
    ╱────┴────╲
   ╱           ╲  Access Granted?
  ╱             ╲
 ╱               ╲
│   NO           │   YES      │
└───┬────────    └───┬────────┘
    │                │
    ▼                ▼
┌────────┐      ┌──────────────────┐
│ Toast  │      │ Update Navigation│
│ Error  │      │ State:           │
│ Shown  │      │ • currentView    │
└────────┘      │ • viewHistory    │
                │ • viewParams     │
                └───┬──────────────┘
                    │
                    ▼
                ┌──────────────────┐
                │ NavigationContext│
                │ Triggers Re-     │
                │ render           │
                └───┬──────────────┘
                    │
                    ▼
                ┌──────────────────┐
                │NavigationContainer│
                │ Re-renders with  │
                │ new view         │
                └───┬──────────────┘
                    │
                    ▼
                ┌──────────────────┐
                │ View Component   │
                │ Lazy loaded via  │
                │ Suspense         │
                └──────────────────┘
```

### 3. Nested Navigation Flow

```
┌──────────────────────────────┐
│  Parent View Rendered        │
│  (e.g., Product Management)  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Parent view contains        │
│  NestedViewContainer         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  useNestedNavigation()       │
│  Gets nested navigation      │
│  context for parent          │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  User navigates to nested    │
│  view (e.g., Product List)   │
│  navigateToNested(           │
│    INVENTORY_ROUTES.PRODUCTS)│
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Update Nested State:        │
│  nestedViews[parentId] = {   │
│    currentView: "products",  │
│    viewHistory: [...]        │
│  }                           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  NestedViewContainer         │
│  Re-renders with nested view │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Nested View Component       │
│  Rendered within parent      │
└──────────────────────────────┘
```

### 4. Back Navigation Flow

```
┌──────────────────────────────┐
│  User clicks Back button or  │
│  calls goBack()              │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Check viewHistory length    │
└────────┬─────────────────────┘
         │
    ╱────┴────╲
   ╱           ╲  History > 1?
  ╱             ╲
 ╱               ╲
│   NO           │   YES      │
└───┬────────    └───┬────────┘
    │                │
    ▼                ▼
┌────────┐      ┌──────────────────┐
│ No-op  │      │ Pop current view │
│ Already│      │ from history     │
│ at root│      └───┬──────────────┘
└────────┘          │
                    ▼
                ┌──────────────────┐
                │ Set currentView  │
                │ to previous view │
                │ in history       │
                └───┬──────────────┘
                    │
                    ▼
                ┌──────────────────┐
                │ Clear viewParams │
                └───┬──────────────┘
                    │
                    ▼
                ┌──────────────────┐
                │ Trigger re-render│
                │ with previous    │
                │ view             │
                └──────────────────┘
```

---

## Components

### NavigationProvider

**Location**: `navigation/context/navigation-provider.tsx`

**Purpose**: Provides navigation state and methods to the entire application.

**Props**:

```typescript
interface NavigationProviderProps {
  children: ReactNode;
  initialView?: string; // Default: "dashboard"
}
```

**State Management**:

- Maintains `NavigationState` for all views
- Manages navigation history (max 50 items)
- Supports nested navigation contexts
- Provides context value to consumers

**Example**:

```tsx
<NavigationProvider initialView="dashboard">
  <App />
</NavigationProvider>
```

---

### NavigationContainer

**Location**: `navigation/components/navigation-container.tsx`

**Purpose**: Renders the current active view based on navigation state.

**Features**:

- Gets current view from registry
- Lazy loads view components
- Wraps in Suspense with loading fallback
- Wraps in ErrorBoundary for error handling
- Handles view transitions
- Passes view parameters and `onBack` callback

**Rendering Logic**:

```typescript
1. Get current view ID from navigation state
2. Lookup view config from registry
3. Extract component and parameters
4. Merge default params with current params
5. Render with error/loading boundaries
6. Apply view transitions
```

---

### NestedViewContainer

**Location**: `navigation/components/nested-view-container.tsx`

**Purpose**: Container for nested views within a parent view.

**Props**:

```typescript
interface NestedViewContainerProps {
  parentViewId: string; // Parent view ID
  defaultViewId?: string; // Default nested view
}
```

**Usage Example**:

```tsx
function ProductManagementView() {
  return (
    <div>
      <h1>Product Management</h1>
      <NestedViewContainer parentViewId={INVENTORY_ROUTES.PRODUCT_MANAGEMENT} defaultViewId={INVENTORY_ROUTES.PRODUCT_DASHBOARD} />
    </div>
  );
}
```

---

### AuthenticatedAppShell

**Location**: `navigation/components/authenticated-app-shell.tsx`

**Purpose**: Main layout wrapper for authenticated users.

**Features**:

- Dashboard header (with logo, user menu, notifications)
- Main content area with NavigationContainer
- Handles license activation check
- Force PIN change screen
- Responsive layout

---

### DashboardPageWrapper

**Location**: `navigation/components/dashboard-page-wrapper.tsx`

**Purpose**: Routes to role-specific dashboard views.

**Role Routing**:

- **Admin** → `AdminDashboardView`
- **Manager** → `ManagerDashboardView`
- **Cashier** → Auto-redirects to `NewTransactionView`

---

## Hooks

### useNavigation()

**Location**: `navigation/hooks/use-navigation.ts`

**Purpose**: Main navigation hook with RBAC checks.

**Returns**:

```typescript
{
  state: NavigationState;
  navigateTo: (viewId: string, params?: Record<string, unknown>) => void;
  goBack: () => void;
  goToRoot: () => void;
  canGoBack: boolean;
  currentView: ViewConfig | undefined;
  currentViewId: string;
  currentParams: Record<string, unknown>;
}
```

**Features**:

- Automatic RBAC permission checks
- User-friendly error messages (toast notifications)
- Logging for debugging
- Type-safe view navigation

**Example**:

```tsx
function MyComponent() {
  const { navigateTo, goBack, currentView } = useNavigation();

  return (
    <div>
      <h1>{currentView?.metadata.title}</h1>
      <button onClick={() => navigateTo(USERS_ROUTES.MANAGEMENT)}>Go to Users</button>
      <button onClick={goBack}>Back</button>
    </div>
  );
}
```

---

### useNestedNavigation()

**Location**: `navigation/hooks/use-nested-navigation.ts`

**Purpose**: Navigation hook for nested views within a parent.

**Parameters**:

```typescript
useNestedNavigation(parentViewId: string)
```

**Returns**:

```typescript
{
  navigateToNested: (viewId: string, params?: Record<string, unknown>) => void;
  goBack: () => void;
  canGoBack: boolean;
  currentNestedViewId: string | null;
  currentNestedView: ViewConfig | undefined;
  currentNestedParams: Record<string, unknown>;
}
```

**Example**:

```tsx
function ProductManagementView() {
  const { navigateToNested, currentNestedView } = useNestedNavigation(INVENTORY_ROUTES.PRODUCT_MANAGEMENT);

  return (
    <div>
      <button onClick={() => navigateToNested(INVENTORY_ROUTES.PRODUCTS)}>View Products</button>
      <NestedViewContainer parentViewId={INVENTORY_ROUTES.PRODUCT_MANAGEMENT} />
    </div>
  );
}
```

---

### useDashboardNavigation()

**Location**: `navigation/hooks/use-dashboard-navigation.ts`

**Purpose**: Specialized hook for dashboard feature action navigation.

**Returns**:

```typescript
(featureId: string, actionId: string) => void
```

**Usage**: Dashboard feature cards call actions, which use this hook to navigate.

---

## View Registry

### Central Registry

**Location**: `navigation/registry/view-registry.ts`

The view registry is the **single source of truth** for all views in the application.

**Structure**:

```typescript
export const VIEW_REGISTRY: Record<string, ViewConfig> = {
  dashboard: {
    /* ... */
  },
  ...salesViews,
  ...usersViews,
  ...inventoryViews,
  ...settingsViews,
  ...staffViews,
  ...rbacViews,
};
```

**Registry Functions**:

#### getView(viewId)

```typescript
function getView(viewId: string): ViewConfig | undefined;
```

- Retrieves view configuration by ID
- Automatically maps legacy routes to new routes
- Logs deprecation warnings in development

#### getRootViews()

```typescript
function getRootViews(): ViewConfig[];
```

- Returns all root-level views
- Used for navigation menus

#### getNestedViews(parentId)

```typescript
function getNestedViews(parentId: string): ViewConfig[];
```

- Returns nested views for a parent
- Used to build nested navigation

#### getViewHierarchy(viewId)

```typescript
function getViewHierarchy(viewId: string): ViewConfig[];
```

- Returns breadcrumb trail from root to view
- Used for breadcrumb navigation

#### canAccessView(viewId, userPermissions, userRole)

```typescript
function canAccessView(viewId: string, userPermissions: string[], userRole: string): boolean;
```

- Checks if user can access view
- Validates permissions and roles
- Supports wildcard permissions (`*:*`)

---

### Route Mapper

**Location**: `navigation/registry/route-mapper.ts`

**Purpose**: Maps legacy route identifiers to new standardized routes.

**Example**:

```typescript
export const LEGACY_ROUTE_MAP: Record<string, string> = {
  roleManagement: RBAC_ROUTES.ROLE_MANAGEMENT,
  userManagement: USERS_ROUTES.MANAGEMENT,
  newTransaction: SALES_ROUTES.NEW_TRANSACTION,
};
```

**Usage**: Provides backward compatibility during migration.

---

## Feature Integration

### Feature Structure

Each feature defines its own navigation configuration:

```
features/{feature}/
├── config/
│   ├── navigation.ts        # Route constants
│   ├── permissions.ts       # Permission constants
│   └── feature-config.ts    # View registry export
└── views/
    ├── {feature}-dashboard-view.tsx
    ├── {feature}-list-view.tsx
    └── {feature}-detail-view.tsx
```

### Step-by-Step Integration

#### 1. Define Route Constants

**File**: `features/{feature}/config/navigation.ts`

```typescript
/**
 * {Feature} Navigation Routes
 */
export const {FEATURE}_ROUTES = {
  DASHBOARD: "{feature}:dashboard",
  LIST: "{feature}:list",
  DETAILS: "{feature}:details",
} as const;

export type {Feature}Route =
  typeof {FEATURE}_ROUTES[keyof typeof {FEATURE}_ROUTES];
```

#### 2. Create View Registry

**File**: `features/{feature}/config/feature-config.ts`

```typescript
import { lazy } from "react";
import { {FEATURE}_ROUTES } from "./navigation";
import { {FEATURE}_PERMISSIONS } from "./permissions";
import type { ViewConfig } from "@/navigation/types";

// Lazy load views
const Lazy{Feature}DashboardView = lazy(() =>
  import("../views/{feature}-dashboard-view")
);

const Lazy{Feature}ListView = lazy(() =>
  import("../views/{feature}-list-view")
);

/**
 * View Registry for {Feature}
 */
export const {feature}Views: Record<string, ViewConfig> = {
  [{FEATURE}_ROUTES.DASHBOARD]: {
    id: {FEATURE}_ROUTES.DASHBOARD,
    level: "root",
    component: Lazy{Feature}DashboardView,
    metadata: {
      title: "{Feature} Dashboard",
      description: "Overview of {feature}",
    },
    permissions: [{FEATURE}_PERMISSIONS.READ],
    requiresAuth: true,
  },

  [{FEATURE}_ROUTES.LIST]: {
    id: {FEATURE}_ROUTES.LIST,
    level: "nested",
    parentId: {FEATURE}_ROUTES.DASHBOARD,
    component: Lazy{Feature}ListView,
    metadata: {
      title: "{Feature} List",
      description: "List of all {feature}s",
    },
    permissions: [{FEATURE}_PERMISSIONS.READ],
    requiresAuth: true,
  },
};
```

#### 3. Register in Central Registry

**File**: `navigation/registry/view-registry.ts`

```typescript
import { {feature}Views } from "@/features/{feature}/config/feature-config";

export const VIEW_REGISTRY: Record<string, ViewConfig> = {
  dashboard: { /* ... */ },
  ...{feature}Views,  // Add here
  // ... other features
};
```

#### 4. Use in Components

```tsx
import { useNavigation } from "@/navigation";
import { {FEATURE}_ROUTES } from "@/features/{feature}/config/navigation";

function MyComponent() {
  const { navigateTo } = useNavigation();

  return (
    <button onClick={() => navigateTo({FEATURE}_ROUTES.DASHBOARD)}>
      Go to {Feature}
    </button>
  );
}
```

---

## RBAC Integration

### Permission Checking Flow

```
┌──────────────────────────┐
│  navigateTo(viewId)      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  getView(viewId)         │
│  Get view config         │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Get user info:          │
│  • user (from useAuth)   │
│  • permissions           │
│  • role                  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  canAccessView()         │
│  Check access            │
└────────┬─────────────────┘
         │
    ╱────┴────╲
   ╱           ╲
  ╱   Access?   ╲
 ╱               ╲
│   DENIED       │   GRANTED │
└───┬────────    └───┬────────┘
    │                │
    ▼                ▼
┌────────────┐  ┌──────────────┐
│ toast.error│  │ Navigate to  │
│ "No access"│  │ view         │
└────────────┘  └──────────────┘
```

### Access Control Logic

```typescript
function canAccessView(viewId: string, userPermissions: string[], userRole: string): boolean {
  const view = getView(viewId);
  if (!view) return false;

  // 1. Check authentication requirement
  if (view.requiresAuth && !userPermissions.length && !userRole) {
    return false;
  }

  // 2. Check role-based access
  if (view.roles && view.roles.length > 0) {
    if (!view.roles.includes(userRole)) {
      return false;
    }
  }

  // 3. Check permission-based access
  if (view.permissions && view.permissions.length > 0) {
    // Admin has wildcard permission
    if (userPermissions.includes("*:*")) return true;

    // Check for any matching permission
    const hasPermission = view.permissions.some((perm) => {
      // Exact match
      if (userPermissions.includes(perm)) return true;

      // Wildcard resource match (e.g., "users:*")
      const [resource, action] = perm.split(":");
      if (userPermissions.includes(`${resource}:*`)) return true;

      return false;
    });

    if (!hasPermission) return false;
  }

  return true;
}
```

### View Configuration Examples

#### Public View (No Auth)

```typescript
{
  id: "login",
  level: "root",
  component: LoginView,
  metadata: { title: "Login" },
  requiresAuth: false,  // Anyone can access
}
```

#### Authenticated View (Any Role)

```typescript
{
  id: "dashboard",
  level: "root",
  component: DashboardView,
  metadata: { title: "Dashboard" },
  requiresAuth: true,  // Must be logged in
}
```

#### Role-Restricted View

```typescript
{
  id: "adminPanel",
  level: "root",
  component: AdminPanelView,
  metadata: { title: "Admin Panel" },
  roles: ["admin"],  // Only admins
  requiresAuth: true,
}
```

#### Permission-Restricted View

```typescript
{
  id: "userManagement",
  level: "root",
  component: UserManagementView,
  metadata: { title: "User Management" },
  permissions: ["users:read", "users:manage"],  // Any of these
  requiresAuth: true,
}
```

#### Multi-Constraint View

```typescript
{
  id: "financialReports",
  level: "root",
  component: FinancialReportsView,
  metadata: { title: "Financial Reports" },
  roles: ["admin", "manager"],  // Admin OR Manager
  permissions: ["reports:financial"],  // AND has permission
  requiresAuth: true,
}
```

---

## Code Examples

### Example 1: Basic Navigation

```tsx
import { useNavigation } from "@/navigation";
import { INVENTORY_ROUTES } from "@/features/inventory/config/navigation";

function InventoryButton() {
  const { navigateTo } = useNavigation();

  return <button onClick={() => navigateTo(INVENTORY_ROUTES.DASHBOARD)}>View Inventory</button>;
}
```

### Example 2: Navigation with Parameters

```tsx
import { useNavigation } from "@/navigation";
import { INVENTORY_ROUTES } from "@/features/inventory/config/navigation";

function ProductCard({ productId }: { productId: string }) {
  const { navigateTo } = useNavigation();

  const handleViewDetails = () => {
    navigateTo(INVENTORY_ROUTES.PRODUCT_DETAILS, {
      productId,
      mode: "view",
    });
  };

  return (
    <div onClick={handleViewDetails}>
      <h3>Product {productId}</h3>
    </div>
  );
}
```

### Example 3: Back Navigation

```tsx
import { useNavigation } from "@/navigation";

function DetailView() {
  const { goBack, canGoBack } = useNavigation();

  return (
    <div>
      <button onClick={goBack} disabled={!canGoBack}>
        ← Back
      </button>
      <h1>Details</h1>
    </div>
  );
}
```

### Example 4: Nested Navigation

```tsx
import { useNestedNavigation, NestedViewContainer } from "@/navigation";
import { INVENTORY_ROUTES } from "@/features/inventory/config/navigation";

function ProductManagementView() {
  const { navigateToNested, currentNestedView } = useNestedNavigation(INVENTORY_ROUTES.PRODUCT_MANAGEMENT);

  return (
    <div>
      <nav>
        <button onClick={() => navigateToNested(INVENTORY_ROUTES.PRODUCTS)}>Products</button>
        <button onClick={() => navigateToNested(INVENTORY_ROUTES.CATEGORIES)}>Categories</button>
      </nav>

      <NestedViewContainer parentViewId={INVENTORY_ROUTES.PRODUCT_MANAGEMENT} defaultViewId={INVENTORY_ROUTES.PRODUCTS} />
    </div>
  );
}
```

### Example 5: Custom Navigation Handler

```tsx
import { useNavigation } from "@/navigation";
import { USERS_ROUTES } from "@/features/users/config/navigation";
import { toast } from "sonner";

function UserActionsMenu({ userId }: { userId: string }) {
  const { navigateTo } = useNavigation();

  const handleEditUser = async () => {
    // Perform any pre-navigation logic
    const canEdit = await checkEditPermission(userId);

    if (!canEdit) {
      toast.error("You cannot edit this user");
      return;
    }

    // Navigate with parameters
    navigateTo(USERS_ROUTES.EDIT, {
      userId,
      returnTo: USERS_ROUTES.MANAGEMENT,
    });
  };

  return <button onClick={handleEditUser}>Edit User</button>;
}
```

### Example 6: Programmatic Navigation in Effects

```tsx
import { useEffect } from "react";
import { useNavigation } from "@/navigation";
import { SALES_ROUTES } from "@/features/sales/config/navigation";

function AutoRedirectComponent() {
  const { navigateTo } = useNavigation();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      navigateTo(SALES_ROUTES.NEW_TRANSACTION);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigateTo]);

  return <div>Redirecting to sales...</div>;
}
```

### Example 7: Conditional Navigation

```tsx
import { useNavigation } from "@/navigation";
import { useAuth } from "@/shared/hooks";
import { USERS_ROUTES } from "@/features/users/config/navigation";
import { SALES_ROUTES } from "@/features/sales/config/navigation";

function SmartDashboardButton() {
  const { navigateTo } = useNavigation();
  const { user } = useAuth();

  const handleClick = () => {
    const role = getUserRoleName(user);

    switch (role) {
      case "cashier":
        navigateTo(SALES_ROUTES.NEW_TRANSACTION);
        break;
      case "manager":
      case "admin":
        navigateTo(USERS_ROUTES.MANAGEMENT);
        break;
      default:
        navigateTo("dashboard");
    }
  };

  return <button onClick={handleClick}>Go to My Dashboard</button>;
}
```

### Example 8: View with Params

```tsx
import { ViewComponentProps } from "@/navigation/types";

interface ProductDetailsViewProps extends ViewComponentProps {
  productId?: string;
  mode?: "view" | "edit";
}

function ProductDetailsView({ productId, mode = "view", onBack }: ProductDetailsViewProps) {
  return (
    <div>
      <button onClick={onBack}>← Back</button>
      <h1>Product {productId}</h1>
      <p>Mode: {mode}</p>
    </div>
  );
}

export default ProductDetailsView;
```

---

## Key Benefits

### 1. **Type Safety**

- Route constants prevent typos
- TypeScript ensures correct parameters
- IDE autocomplete for routes

### 2. **Centralized Control**

- Single registry for all views
- Easy to audit and maintain
- Clear view hierarchy

### 3. **RBAC Integration**

- Automatic permission checks
- Role-based access control
- Prevents unauthorized access

### 4. **Better UX**

- User-friendly error messages
- Smooth view transitions
- Loading states and error boundaries

### 5. **Developer Experience**

- Simple API (`navigateTo`, `goBack`)
- Nested navigation support
- Logging for debugging

### 6. **Code Splitting**

- Lazy loading with React.lazy()
- Reduced initial bundle size
- Faster app startup

### 7. **Maintainability**

- Feature-based organization
- Clear separation of concerns
- Easy to add new views

---

## Migration Guide

### From React Router to Navigation System

**Before** (React Router):

```tsx
import { useNavigate } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();

  return <button onClick={() => navigate("/users")}>Users</button>;
}
```

**After** (Navigation System):

```tsx
import { useNavigation } from "@/navigation";
import { USERS_ROUTES } from "@/features/users/config/navigation";

function MyComponent() {
  const { navigateTo } = useNavigation();

  return <button onClick={() => navigateTo(USERS_ROUTES.MANAGEMENT)}>Users</button>;
}
```

### Benefits of Migration

- ✅ Automatic RBAC checks
- ✅ Type-safe route constants
- ✅ Centralized view registry
- ✅ Better error handling
- ✅ Nested navigation support

---

## Best Practices

### 1. **Always Use Route Constants**

```typescript
// ✅ Good
navigateTo(INVENTORY_ROUTES.DASHBOARD);

// ❌ Bad (magic string)
navigateTo("inventory:dashboard");
```

### 2. **Lazy Load Views**

```typescript
// ✅ Good
const LazyProductView = lazy(() => import("../views/product-view"));

// ❌ Bad (increases bundle size)
import ProductView from "../views/product-view";
```

### 3. **Define Permissions in Config**

```typescript
// features/users/config/permissions.ts
export const USERS_PERMISSIONS = {
  READ: "users:read",
  MANAGE: "users:manage",
  DELETE: "users:delete",
} as const;

// Use in view config
permissions: [USERS_PERMISSIONS.READ];
```

### 4. **Use Nested Navigation for Sub-Views**

```typescript
// Parent view
{
  id: "productManagement",
  level: "root",
  // ...
}

// Nested views
{
  id: "productList",
  level: "nested",
  parentId: "productManagement",
  // ...
}
```

### 5. **Provide Descriptive Metadata**

```typescript
metadata: {
  title: "Product Management",
  description: "Manage products, categories, and inventory",
  icon: "Package",
  breadcrumb: "Products",
}
```

### 6. **Handle Navigation Errors Gracefully**

```typescript
const { navigateTo } = useNavigation();

// navigateTo already handles errors with toasts
// Just call it, no try-catch needed
navigateTo(USERS_ROUTES.MANAGEMENT);
```

---

## Troubleshooting

### Issue: "View not found"

**Cause**: View ID not registered in VIEW_REGISTRY  
**Solution**: Add view to feature's `feature-config.ts` and ensure it's imported in `view-registry.ts`

### Issue: "Access denied" toast

**Cause**: User lacks required permissions/role  
**Solution**: Check view's `permissions` and `roles` configuration

### Issue: Navigation history not working

**Cause**: Calling `navigateTo` from outside NavigationProvider  
**Solution**: Ensure component is wrapped in `<NavigationProvider>`

### Issue: Nested navigation not updating

**Cause**: Wrong parent ID or missing nested navigation hook  
**Solution**: Use `useNestedNavigation(parentId)` and verify `parentId` matches

### Issue: View parameters not received

**Cause**: Component doesn't accept parameters  
**Solution**: Extend `ViewComponentProps` in component props interface

---

## Conclusion

The AuraSwift navigation system provides:

✅ **Type-safe routing** with route constants  
✅ **RBAC integration** with automatic permission checks  
✅ **Hierarchical navigation** with nested view support  
✅ **Centralized registry** for easy maintenance  
✅ **Code splitting** with lazy loading  
✅ **Developer-friendly API** with simple hooks  
✅ **User-friendly errors** with toast notifications

By following this system, developers can build scalable, maintainable navigation flows with built-in security and excellent user experience.

For questions or issues, refer to:

- [View Registry](../../packages/renderer/src/navigation/registry/view-registry.ts)
- [Navigation Types](../../packages/renderer/src/navigation/types/navigation.types.ts)
- [Navigation Hooks](../../packages/renderer/src/navigation/hooks/)
