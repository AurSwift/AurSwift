# Subscription-Based Feature Gating System

## Overview

The desktop POS application implements a robust, scalable subscription-based feature gating system that controls access to features, widgets, and functionalities based on the customer's active subscription plan. The system uses an **additive model** where higher-tier plans (Professional) automatically include all features from lower-tier plans (Basic).

## Architecture

### System Components

```
desktop/packages/renderer/src/features/subscription/
├── config/
│   └── plan-features.ts          # Feature-to-plan mapping and plan hierarchy
├── hooks/
│   └── use-subscription-features.ts  # React hooks for checking feature access
├── utils/
│   └── feature-access.ts         # Core access checking utilities
└── components/
    ├── upgrade-badge.tsx         # Badge component for upgrade prompts
    └── feature-gate.tsx          # Wrapper component for conditional rendering
```

### Key Integration Points

- **License Context** (`features/license/context/license-context.tsx`): Provides current plan ID and available features
- **Feature Registry** (`features/dashboard/registry/feature-registry.ts`): Defines all dashboard features with subscription requirements
- **Feature Visibility Hook** (`features/dashboard/hooks/use-feature-visibility.ts`): Checks both permissions AND subscription access

## Plan Hierarchy

### Basic Plan

**Features:**

- Up to 3 terminals
- Basic reporting
- Product management
- Sales processing
- Receipt printing

### Professional Plan (Additive Model)

**Includes ALL Basic features PLUS:**

- Multi-terminal support
- Advanced reporting & analytics
- Inventory management
- Employee management
- Batch tracking
- Expiry tracking

**Key Principle:** Professional plan automatically includes all Basic features. No need to check for both - if a user has Professional, they have all Basic features.

## Feature Mapping

### Feature Flags (Server-Side)

Features are identified by feature flags that match the server definitions:

```typescript
type ServerFeatureFlag =
  | "single_terminal"
  | "multi_terminal"
  | "basic_reporting"
  | "advanced_reporting"
  | "product_management"
  | "sales_processing"
  | "receipt_printing"
  | "inventory_management"
  | "employee_management"
  | "batch_tracking"
  | "expiry_tracking";
```

### Dashboard Feature Mapping

Dashboard features are mapped to required feature flags:

```typescript
// Example from plan-features.ts
const FEATURE_REQUIREMENTS: Record<string, ServerFeatureFlag[]> = {
  "user-management": ["employee_management"], // Professional only
  "management-actions": [], // Available to all
  "system-settings": [], // Available to all
  "database-management": ["advanced_reporting"], // Professional only
  "quick-actions": [], // Available to all
};
```

## How It Works

### 1. License Activation Flow

1. User activates license key in desktop app
2. Server validates license and returns:
   - `planId`: Current subscription plan ("basic" | "professional")
   - `features`: Array of feature flags available to this plan
3. Desktop app stores activation in local database
4. License context provides plan and features to all components

### 2. Feature Access Check

When a feature needs to be checked:

1. **Permissions Check**: First checks if user has required permissions (RBAC)
2. **Subscription Check**: Then checks if user's plan includes required features
3. **Access Decision**: Feature is accessible only if BOTH checks pass

### 3. UI Display Logic

- **Visible**: Feature card is shown if user has permissions (even if upgrade needed)
- **Accessible**: Feature actions are enabled only if subscription check passes
- **Upgrade Badge**: Shows upgrade badge when subscription check fails
- **Disabled Actions**: Buttons are disabled with upgrade badge visible

## Usage Examples

### Checking Feature Access in Components

#### Using the Feature Visibility Hook

```typescript
import { useFeatureVisibility } from "@/features/dashboard/hooks/use-feature-visibility";
import type { FeatureConfig } from "@/features/dashboard/types/feature-config";

function MyComponent({ feature }: { feature: FeatureConfig }) {
  const visibility = useFeatureVisibility(feature);

  if (!visibility.isVisible) {
    return null; // Hidden (no permissions)
  }

  return (
    <div>
      {visibility.requiresUpgrade && visibility.upgradeInfo && (
        <UpgradeBadge
          message={visibility.upgradeInfo.message}
          planId={visibility.upgradeInfo.planId}
        />
      )}
      {/* Feature content */}
    </div>
  );
}
```

#### Using Subscription Hooks Directly

```typescript
import { useCanAccessFeature, useHasSubscriptionFeature } from "@/features/subscription";

function MyFeature() {
  // Check if user can access a specific dashboard feature
  const access = useCanAccessFeature("user-management");

  if (!access.canAccess) {
    return <UpgradeBadge message={access.reason} planId={access.upgradePlan!} />;
  }

  // Or check a specific feature flag
  const hasEmployeeManagement = useHasSubscriptionFeature("employee_management");

  return (
    <div>
      {hasEmployeeManagement ? (
        <EmployeeManagementPanel />
      ) : (
        <UpgradePrompt />
      )}
    </div>
  );
}
```

#### Using Feature Gate Component

```typescript
import { FeatureGate } from "@/features/subscription";

function Dashboard() {
  return (
    <div>
      {/* Show feature with upgrade badge if not accessible */}
      <FeatureGate
        featureId="user-management"
        showWithBadge={true}
        showUpgradeBadge={true}
      >
        <UserManagementCard />
      </FeatureGate>

      {/* Or hide completely if not accessible */}
      <FeatureGate
        featureId="database-management"
        fallback={<div>Feature not available</div>}
      >
        <DatabaseManagementCard />
      </FeatureGate>
    </div>
  );
}
```

### Feature Card Component (Automatic Integration)

The `FeatureCard` component automatically handles subscription checks:

```typescript
import { FeatureCard } from "@/features/dashboard/components/feature-card";
import { FEATURE_REGISTRY } from "@/features/dashboard/registry/feature-registry";

function Dashboard() {
  return (
    <div>
      {FEATURE_REGISTRY.map((feature) => (
        <FeatureCard key={feature.id} feature={feature} />
      ))}
    </div>
  );
}
```

The `FeatureCard` will:

- Show/hide based on permissions
- Display upgrade badge if subscription check fails
- Disable action buttons if subscription check fails
- Show all features (even with upgrade badges) to encourage upgrades

## Adding New Features

### Step 1: Define Feature Flag (if needed)

If your feature requires a new feature flag, update both web and desktop:

**Web** (`web/lib/license/validator.ts`):

```typescript
export function getPlanFeatures(planId: string): string[] {
  const basicFeatures: string[] = [
    // ... existing features
    "new_feature_flag", // Add new flag
  ];

  // Or add to professional-only features
  const professionalAdditionalFeatures: string[] = [
    // ... existing features
    "new_professional_feature", // Professional only
  ];
  // ...
}
```

**Desktop** (`desktop/packages/renderer/src/features/subscription/config/plan-features.ts`):

```typescript
export type ServerFeatureFlag =
  | // ... existing flags
  | "new_feature_flag"           // Add new flag
  | "new_professional_feature";  // Add professional-only flag

const PROFESSIONAL_ADDITIONAL_FEATURES: ServerFeatureFlag[] = [
  // ... existing features
  "new_professional_feature",  // Add to professional list
];
```

### Step 2: Add Feature to Feature Registry

Update `desktop/packages/renderer/src/features/dashboard/registry/feature-registry.ts`:

```typescript
{
  id: "my-new-feature",
  title: "My New Feature",
  description: "Description of the feature",
  icon: MyIcon,
  permissions: [PERMISSIONS.REQUIRED_PERMISSION],
  category: "management",
  order: 6,

  // Subscription requirements
  requiredPlan: "professional",  // Or "basic" or undefined (all plans)
  requiredFeatures: ["new_professional_feature"] as ServerFeatureFlag[],  // Required feature flags
  upgradePrompt: {
    message: "Upgrade to Professional to access this feature",
    planId: "professional",
  },

  actions: [
    // ... feature actions
  ],
}
```

### Step 3: Map Feature to Requirements (if using custom mapping)

If you're using custom feature requirements, update `FEATURE_REQUIREMENTS` in `plan-features.ts`:

```typescript
const FEATURE_REQUIREMENTS: Record<string, ServerFeatureFlag[]> = {
  // ... existing mappings
  "my-new-feature": ["new_professional_feature"], // Add mapping
};
```

### Step 4: Use Feature in Components

Use the feature in your components with automatic subscription checking:

```typescript
import { getFeatureById } from "@/features/dashboard/registry/feature-registry";
import { FeatureCard } from "@/features/dashboard/components/feature-card";

function MyDashboard() {
  const feature = getFeatureById("my-new-feature");

  if (!feature) return null;

  return <FeatureCard feature={feature} />;
}
```

## Access Checking Logic

### Decision Tree

```
1. User accesses feature
   ↓
2. Check User Permissions (RBAC)
   ├─ No permission → Hide feature (return null)
   └─ Has permission → Continue
       ↓
3. Check Subscription Plan
   ├─ No plan → Show upgrade badge, disable actions
   ├─ Basic plan, needs Professional → Show upgrade badge, disable actions
   ├─ Professional plan → Full access
   └─ Feature available to all → Full access
       ↓
4. Render Feature
   ├─ Can access → Enable all actions
   └─ Cannot access → Show upgrade badge, disable actions
```

### Additive Model Implementation

The system uses an additive model where Professional automatically includes Basic features:

```typescript
// In plan-features.ts
const PLAN_FEATURES: Record<PlanId, ServerFeatureFlag[]> = {
  basic: [...BASIC_PLAN_FEATURES],
  professional: [
    ...BASIC_PLAN_FEATURES, // Includes all basic features
    ...PROFESSIONAL_ADDITIONAL_FEATURES, // Plus professional features
  ],
};

// In feature-access.ts
export function canPlanAccessFeature(
  planId: PlanId | null,
  availableFeatures: ServerFeatureFlag[],
  featureId: string,
): boolean {
  // Get all features that the plan should have (additive model)
  const planFeatures = getPlanFeatures(planId);

  // Combine server-provided features with plan-defined features
  // This handles cases where server only sends professional features
  // but professional should include all basic features
  const allAvailableFeatures = [
    ...new Set([...availableFeatures, ...planFeatures]),
  ];

  // Check if all required features are available
  return requiredFeatures.every((feature) =>
    allAvailableFeatures.includes(feature),
  );
}
```

## Upgrade Badge Display

### When Upgrade Badge is Shown

1. **Feature Card Header**: Shows in top-right corner of feature card
2. **Action Buttons**: Buttons are disabled with visual indication
3. **Tooltip**: Hover shows upgrade message and required plan

### Upgrade Badge Behavior

- **Visibility**: Always shown for features requiring upgrade (doesn't hide feature)
- **Position**: Absolute position in top-right of feature card header
- **Style**: Outline variant badge with sparkle and arrow icons
- **Tooltip**: Shows upgrade message on hover

### Customizing Upgrade Messages

Set custom upgrade messages in feature registry:

```typescript
{
  id: "user-management",
  upgradePrompt: {
    message: "Upgrade to Professional to manage users and employees. Get access to advanced user management, role assignments, and staff scheduling.",
    planId: "professional",
  },
}
```

## Testing

### Manual Testing Checklist

#### Basic Plan User

- [ ] Can see all features (even if upgrade needed)
- [ ] Basic features (Management Actions, System Settings, Quick Actions) are fully functional
- [ ] Professional-only features (User Management, Database Management) show upgrade badges
- [ ] Action buttons in Professional-only features are disabled
- [ ] Upgrade badge tooltips show correct messages

#### Professional Plan User

- [ ] All features are accessible (Basic + Professional)
- [ ] No upgrade badges shown
- [ ] All action buttons are enabled
- [ ] Multi-terminal features work correctly

#### No License / Grace Period

- [ ] Features show as "Requires License Activation"
- [ ] Upgrade prompts are appropriate

### Unit Testing Example

```typescript
import {
  checkFeatureAccess,
  getMinimumPlanForFeature,
} from "@/features/subscription/utils/feature-access";

describe("Feature Access", () => {
  it("should allow basic plan access to basic features", () => {
    const result = checkFeatureAccess(
      "basic",
      ["single_terminal", "basic_reporting", "product_management"],
      "management-actions",
    );
    expect(result.canAccess).toBe(true);
  });

  it("should require professional plan for user management", () => {
    const minPlan = getMinimumPlanForFeature("user-management");
    expect(minPlan).toBe("professional");
  });

  it("should allow professional plan access to basic features", () => {
    const result = checkFeatureAccess(
      "professional",
      [
        "single_terminal",
        "multi_terminal",
        "basic_reporting",
        "advanced_reporting",
        "employee_management",
      ],
      "management-actions",
    );
    expect(result.canAccess).toBe(true);
  });
});
```

## Troubleshooting

### Feature Not Showing Upgrade Badge

**Check:**

1. Feature registry has `requiredPlan` or `requiredFeatures` set
2. `upgradePrompt` is defined in feature config
3. License context is providing plan ID correctly
4. Feature visibility hook is being used correctly

### Feature Accessible When Shouldn't Be

**Check:**

1. Plan ID is correct in license status
2. Feature requirements are correctly mapped in `FEATURE_REQUIREMENTS`
3. Additive model is working (Professional includes Basic)
4. Server is returning correct feature flags

### Upgrade Badge Not Clickable

**Expected Behavior:** Upgrade badges are informational only (not clickable). To add click action:

```typescript
<UpgradeBadge
  message={upgradeInfo.message}
  planId={upgradeInfo.planId}
  onClick={() => {
    // Navigate to upgrade page or open modal
    window.open("https://yourwebsite.com/pricing", "_blank");
  }}
/>
```

(Note: This requires extending the `UpgradeBadge` component)

## Best Practices

1. **Always Use Additive Model**: Higher plans include lower plan features
2. **Show, Don't Hide**: Show features with upgrade badges (don't hide completely)
3. **Clear Upgrade Messages**: Use descriptive upgrade prompts
4. **Consistent Feature Flags**: Keep web and desktop feature flags in sync
5. **Test Both Plans**: Always test with both Basic and Professional plans
6. **Graceful Degradation**: Handle missing license gracefully

## Related Files

- **Feature Mapping**: `desktop/packages/renderer/src/features/subscription/config/plan-features.ts`
- **Access Utilities**: `desktop/packages/renderer/src/features/subscription/utils/feature-access.ts`
- **React Hooks**: `desktop/packages/renderer/src/features/subscription/hooks/use-subscription-features.ts`
- **Feature Registry**: `desktop/packages/renderer/src/features/dashboard/registry/feature-registry.ts`
- **Visibility Hook**: `desktop/packages/renderer/src/features/dashboard/hooks/use-feature-visibility.ts`
- **License Context**: `desktop/packages/renderer/src/features/license/context/license-context.tsx`
- **Server Feature Definitions**: `web/lib/license/validator.ts`

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    License Activation                        │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Web API    │────────▶│  Desktop DB  │                 │
│  └──────────────┘         └──────────────┘                 │
│         │                        │                          │
│         ▼                        ▼                          │
│  { planId, features[] }   License Context                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Feature Access Checking                         │
│  ┌─────────────────┐         ┌──────────────────┐         │
│  │ RBAC Permissions│  AND    │ Subscription Plan│         │
│  └─────────────────┘         └──────────────────┘         │
│         │                        │                          │
│         ▼                        ▼                          │
│  ┌────────────────────────────────────────────┐           │
│  │     useFeatureVisibility Hook              │           │
│  │  - Checks permissions                      │           │
│  │  - Checks subscription                     │           │
│  │  - Returns access info                     │           │
│  └────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    UI Rendering                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  FeatureCard Component                           │      │
│  │  - Shows if has permissions                      │      │
│  │  - Shows upgrade badge if subscription fails     │      │
│  │  - Disables actions if subscription fails        │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Summary

The subscription-based feature gating system provides:

✅ **Scalable Architecture**: Easy to add new features and plans  
✅ **Additive Model**: Higher plans automatically include lower plan features  
✅ **User-Friendly**: Shows upgrade opportunities without hiding features  
✅ **Type-Safe**: Full TypeScript support with proper types  
✅ **Integrated**: Works seamlessly with existing RBAC permission system  
✅ **Maintainable**: Centralized configuration and clear separation of concerns

The system is production-ready and follows best practices for subscription-based SaaS applications.
