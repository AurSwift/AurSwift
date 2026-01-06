# AuraSwift Desktop - License & Subscription System Documentation

> **Complete guide to all files and flows related to licensing and subscription management**

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Services (Main Process)](#core-services-main-process)
3. [IPC Handlers (Main Process)](#ipc-handlers-main-process)
4. [Preload API Bridge](#preload-api-bridge)
5. [UI Components (Renderer Process)](#ui-components-renderer-process)
6. [Hooks & Context (Renderer Process)](#hooks--context-renderer-process)
7. [Database Schema & Migrations](#database-schema--migrations)
8. [Utilities & Helpers](#utilities--helpers)
9. [Type Definitions](#type-definitions)
10. [License Activation Flow](#license-activation-flow)
11. [Real-Time Subscription Sync Flow](#real-time-subscription-sync-flow)
12. [Heartbeat & Validation Flow](#heartbeat--validation-flow)
13. [Grace Period & Offline Mode](#grace-period--offline-mode)
14. [Feature Gating Flow](#feature-gating-flow)
15. [Deactivation Flow](#deactivation-flow)

---

## Architecture Overview

The licensing system follows a **layered architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (React Components)                                 │
│  - License activation screen                                 │
│  - License status badge                                      │
│  - Settings UI                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓ (React Hooks)
┌─────────────────────────────────────────────────────────────┐
│  Context & State Management                                  │
│  - License context provider                                  │
│  - useLicense hook                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓ (IPC Calls)
┌─────────────────────────────────────────────────────────────┐
│  Preload API Bridge (Secure IPC Exposure)                   │
│  - licenseAPI object                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓ (Electron IPC)
┌─────────────────────────────────────────────────────────────┐
│  IPC Handlers (Main Process)                                │
│  - license.handlers.ts                                       │
│  - Registers all license-related IPC channels               │
└─────────────────────────────────────────────────────────────┘
                           ↓ (Service Layer)
┌─────────────────────────────────────────────────────────────┐
│  Business Logic Services                                     │
│  - licenseService.ts (HTTP API client)                      │
│  - subscriptionEventClient.ts (SSE real-time sync)          │
│  - machineFingerprint.ts (device identification)            │
└─────────────────────────────────────────────────────────────┘
                           ↓ (HTTP/SSE)
┌─────────────────────────────────────────────────────────────┐
│  Web Backend API (Next.js - /web folder)                    │
│  - /api/license/activate                                     │
│  - /api/license/validate                                     │
│  - /api/license/heartbeat                                    │
│  - /api/license/deactivate                                   │
│  - /api/events/:licenseKey (SSE endpoint)                   │
│                                                               │
│  These endpoints are in:                                     │
│  - web/app/api/license/activate/route.ts                     │
│  - web/app/api/license/validate/route.ts                     │
│  - web/app/api/license/heartbeat/route.ts                     │
│  - web/app/api/license/deactivate/route.ts                  │
│  - web/app/api/events/[licenseKey]/route.ts                   │
└─────────────────────────────────────────────────────────────┘
                           ↓ (PostgreSQL Database)
┌─────────────────────────────────────────────────────────────┐
│  Web App Database (PostgreSQL - Neon/Cloud)                 │
│  - license_keys (license key records)                       │
│  - activations (machine activations)                         │
│  - subscriptions (Stripe subscription data)                  │
│  - customers (customer records)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Desktop App Local Database (SQLite - Local File)           │
│  - license_activation (current activation cache)           │
│  - license_validation_log (audit trail)                     │
│                                                               │
│  Location: desktop/data/pos_system.db                        │
│  Purpose: Offline operation, local caching, audit logs      │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Services (Main Process)

### 1. **licenseService.ts**

**Location:** `packages/main/src/services/licenseService.ts`

**Purpose:** HTTP client for communicating with the web license API

**Key Features:**

- ✅ Automatic retry with exponential backoff (3 attempts)
- ✅ Offline detection and graceful degradation
- ✅ Request/response logging for debugging
- ✅ 90-second timeout (handles Neon DB cold starts)
- ✅ Secure API URL validation (prevents SSRF attacks)
- ✅ Allowed domains whitelist

**Exported Functions:**

| Function                  | Description                                    | Parameters                                  | Returns                |
| ------------------------- | ---------------------------------------------- | ------------------------------------------- | ---------------------- |
| `activateLicense()`       | Activate a license key for this machine        | `licenseKey`, `terminalName`, `apiBaseUrl?` | `ActivationResponse`   |
| `validateLicense()`       | Validate an activated license online           | `licenseKey`, `checkMachine`, `apiBaseUrl?` | `ValidationResponse`   |
| `sendHeartbeat()`         | Send periodic heartbeat to maintain activation | `licenseKey`, `metadata?`, `apiBaseUrl?`    | `HeartbeatResponse`    |
| `deactivateLicense()`     | Deactivate license on this machine             | `licenseKey`, `apiBaseUrl?`                 | `DeactivationResponse` |
| `getMachineFingerprint()` | Get machine fingerprint for display            | -                                           | `string`               |
| `getMachineInfo()`        | Get machine info for UI display                | -                                           | `MachineInfo`          |

**API Endpoints Used:**

- `POST /api/license/activate` - Activate license
- `POST /api/license/validate` - Validate license
- `POST /api/license/heartbeat` - Send heartbeat
- `POST /api/license/deactivate` - Deactivate license

**Security Features:**

- Domain whitelist: `localhost`, `auraswift.io`, `api.auraswift.io`, etc.
- Protocol validation: Only `http://` and `https://` allowed
- Private IP blocking (SSRF protection)
- Production mode restrictions (blocks localhost in production)

---

### 2. **subscriptionEventClient.ts**

**Location:** `packages/main/src/services/subscriptionEventClient.ts`

**Purpose:** Real-time event client using Server-Sent Events (SSE) for instant subscription notifications

**Key Features:**

- ✅ Automatic reconnection with exponential backoff
- ✅ Event deduplication (idempotency)
- ✅ Heartbeat monitoring (expects server heartbeat every 30s, times out after 60s)
- ✅ Graceful degradation to polling if SSE unavailable
- ✅ Native Node.js implementation (no external dependencies)

**Event Types Handled:**

| Event Type                       | Description                            | Handler Action                                       |
| -------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| `subscription_cancelled`         | User cancelled subscription            | Disable license immediately or schedule cancellation |
| `subscription_reactivated`       | Subscription restored                  | Update status, notify UI                             |
| `subscription_updated`           | Status change (active, past_due, etc.) | Update local status, check grace period              |
| `subscription_past_due`          | Payment failed, grace period active    | Show payment required notification                   |
| `subscription_payment_succeeded` | Payment recovered                      | Restore access, show success message                 |
| `license_revoked`                | License disabled by admin              | Deactivate immediately                               |
| `license_reactivated`            | License restored by admin              | Reactivate, update features                          |
| `plan_changed`                   | Plan upgrade/downgrade                 | Update plan, features in database                    |
| `heartbeat_ack`                  | Connection health check                | Reset heartbeat timeout                              |

**Exported Classes & Functions:**

| Name                      | Type     | Description                        |
| ------------------------- | -------- | ---------------------------------- |
| `SubscriptionEventClient` | Class    | SSE client with reconnection logic |
| `initializeSSEClient()`   | Function | Initialize SSE singleton           |
| `getSSEClient()`          | Function | Get current SSE instance           |
| `disconnectSSEClient()`   | Function | Disconnect and cleanup SSE         |

**Configuration Constants:**

- `INITIAL_RECONNECT_DELAY_MS`: 1 second
- `MAX_RECONNECT_DELAY_MS`: 5 minutes
- `HEARTBEAT_TIMEOUT_MS`: 60 seconds
- `EVENT_DEDUP_WINDOW_MS`: 5 minutes

**SSE Endpoint:**

- `GET /api/events/:licenseKey?machineId=:machineIdHash`

---

## IPC Handlers (Main Process)

### 3. **license.handlers.ts**

**Location:** `packages/main/src/ipc/license.handlers.ts`

**Purpose:** Handles all license-related IPC communication between main and renderer processes

**Key Features:**

- ✅ Real-time sync with SSE (Server-Sent Events)
- ✅ Backup polling every 15 minutes
- ✅ Grace period enforcement (7 days offline)
- ✅ Startup validation (blocking)
- ✅ License revocation handling
- ✅ Event-driven UI notifications

**IPC Channels Registered:**

| Channel                  | Description                            | Parameters                    | Returns               |
| ------------------------ | -------------------------------------- | ----------------------------- | --------------------- |
| `license:getStatus`      | Get current activation status          | -                             | License status object |
| `license:activate`       | Activate a license key                 | `licenseKey`, `terminalName?` | Activation result     |
| `license:validate`       | Validate current license (online)      | -                             | Validation result     |
| `license:deactivate`     | Deactivate current license             | -                             | Deactivation result   |
| `license:getMachineInfo` | Get machine info for display           | -                             | Machine info object   |
| `license:hasFeature`     | Check if feature enabled               | `featureName`                 | Boolean + plan info   |
| `license:sendHeartbeat`  | Send manual heartbeat                  | -                             | Heartbeat result      |
| `license:initialize`     | Initialize license system on app start | -                             | Initialization result |
| `license:getSSEStatus`   | Get SSE connection status              | -                             | Connection state      |

**UI Event Notifications (Emitted to Renderer):**

| Event Channel              | Trigger                            | Data                           |
| -------------------------- | ---------------------------------- | ------------------------------ |
| `license:disabled`         | License disabled (expired/revoked) | `reason`, `revoked?`           |
| `license:statusChanged`    | Subscription status changed        | `previousStatus`, `newStatus`  |
| `license:cancelScheduled`  | Cancellation scheduled             | `cancelAt`, `reason`           |
| `license:reactivated`      | License/subscription reactivated   | `subscriptionStatus`, `planId` |
| `license:paymentRequired`  | Payment failed (past_due)          | `gracePeriodEnd`, `amountDue`  |
| `license:paymentSucceeded` | Payment recovered                  | `subscriptionStatus`           |
| `license:planChanged`      | Plan changed (upgrade/downgrade)   | `previousPlanId`, `newPlanId`  |
| `license:connectionIssue`  | Heartbeat failures                 | `failureCount`, `message`      |
| `license:sseConnected`     | SSE connection state               | `connected`                    |

**Helper Functions:**

| Function                   | Description                        |
| -------------------------- | ---------------------------------- |
| `logValidationAttempt()`   | Log license validation to database |
| `getLocalActivation()`     | Get current license from local DB  |
| `storeLocalActivation()`   | Store license activation in DB     |
| `updateHeartbeat()`        | Update last heartbeat timestamp    |
| `deactivateLocalLicense()` | Deactivate license by ID           |
| `isWithinGracePeriod()`    | Check if within 7-day grace period |
| `startHeartbeatTimer()`    | Start 15-minute polling timer      |
| `stopHeartbeatTimer()`     | Stop heartbeat timer               |
| `emitLicenseEvent()`       | Emit event to all renderer windows |
| `handleSSEEvent()`         | Process incoming SSE events        |
| `initializeSSE()`          | Initialize SSE connection          |

**Grace Period Configuration:**

- Offline grace period: **7 days** (`OFFLINE_GRACE_PERIOD_MS`)
- Heartbeat interval: **15 minutes** (`HEARTBEAT_INTERVAL_MS`)
- Max consecutive failures: **5** before notification

---

## Preload API Bridge

### 4. **license.ts (Preload API)**

**Location:** `packages/preload/src/api/license.ts`

**Purpose:** Secure API bridge that exposes license functionality to renderer process

**Exposed API Object:**

```typescript
window.licenseAPI = {
  getStatus: () => Promise<LicenseStatus>
  activate: (licenseKey, terminalName?) => Promise<ActivationResult>
  validate: () => Promise<ValidationResult>
  deactivate: () => Promise<DeactivationResult>
  getMachineInfo: () => Promise<MachineInfo>
  hasFeature: (featureName) => Promise<FeatureCheckResult>
  sendHeartbeat: () => Promise<HeartbeatResult>
  initialize: () => Promise<InitResult>
}
```

**Security:** Uses `contextBridge` to safely expose IPC methods without giving renderer full `ipcRenderer` access.

---

## UI Components (Renderer Process)

### 5. **license-activation-screen.tsx**

**Location:** `packages/renderer/src/features/license/components/license-activation-screen.tsx`

**Purpose:** Full-screen component for license key entry and activation (shown on first launch)

**Features:**

- ✅ Auto-formatted license key input (e.g., `AUR-PRO-V2-XXXXXXXX-XX`)
- ✅ Optional terminal name customization
- ✅ Machine info display
- ✅ Adaptive keyboard support (for touch screens)
- ✅ Real-time validation feedback
- ✅ Success/error state handling
- ✅ Help link to support

**Props:**

- `onActivationSuccess: () => void` - Callback when activation succeeds

**Key Handlers:**

- `handleActivate()` - Activate license via API
- `handleLicenseKeyChange()` - Format and validate input
- `handleKeyboardInput()` - Adaptive keyboard integration

---

### 6. **license-status-badge.tsx**

**Location:** `packages/renderer/src/features/license/components/license-status-badge.tsx`

**Purpose:** Small badge component to show current license status in UI

**Status Types:**

- ✅ `active` - Green badge with checkmark
- ⚠️ `expired` - Amber badge with alert icon
- 🔵 `offline` - Blue badge with offline icon
- ❌ `invalid` - Red badge with X icon
- ⏳ `loading` - Gray badge with loading indicator

**Props:**

- `status: "active" | "expired" | "offline" | "invalid" | "loading"`
- `planName?: string` - Optional plan name to display
- `className?: string` - Custom styling

---

## Hooks & Context (Renderer Process)

### 7. **use-license.ts**

**Location:** `packages/renderer/src/features/license/hooks/use-license.ts`

**Purpose:** React hook providing license state and actions

**Exported Functions:**

| Function           | Description                | Returns                            |
| ------------------ | -------------------------- | ---------------------------------- |
| `getStatus()`      | Get current license status | `Promise<LicenseStatus \| null>`   |
| `activate()`       | Activate a license key     | `Promise<LicenseActivationResult>` |
| `validate()`       | Validate current license   | `Promise<ValidationResult>`        |
| `deactivate()`     | Deactivate current license | `Promise<DeactivationResult>`      |
| `getMachineInfo()` | Get machine info           | `Promise<MachineInfo \| null>`     |
| `hasFeature()`     | Check if feature enabled   | `Promise<boolean>`                 |
| `initialize()`     | Initialize license system  | `Promise<InitResult>`              |

**State:**

- `isLoading: boolean` - Loading state
- `error: string | null` - Error message
- `clearError()` - Clear error state

---

### 8. **license-context.tsx**

**Location:** `packages/renderer/src/features/license/context/license-context.tsx`

**Purpose:** Global license state management via React Context (prevents prop drilling)

**Context Value:**

```typescript
{
  isActivated: boolean;
  isLoading: boolean;
  licenseStatus: LicenseStatus | null;
  refreshStatus: () => Promise<void>;
  activate: (key, name?) => Promise<boolean>;
  deactivate: () => Promise<boolean>;
  hasFeature: (featureName) => Promise<boolean>;
  planId: string | null;
  planName: string | null;
  businessName: string | null;
}
```

**Usage:**

```typescript
import { useLicenseContext } from "@/features/license/context/use-license-context";

function MyComponent() {
  const { isActivated, planName, hasFeature } = useLicenseContext();
  // ...
}
```

---

### 9. **use-license-context.ts**

**Location:** `packages/renderer/src/features/license/context/use-license-context.ts`

**Purpose:** Hook to access license context

**Throws Error:** If used outside `<LicenseProvider>`

---

## Database Schema & Migrations

> **⚠️ Important: Two Separate Databases**
>
> The licensing system uses **two separate databases**:
>
> 1. **Web App Database (PostgreSQL)** - Cloud-hosted (Neon)
>
>    - Location: `web/lib/db/schema.ts`
>    - Tables: `license_keys`, `activations`, `subscriptions`, `customers`
>    - Purpose: Source of truth for all license data, subscription management
>    - Used by: Next.js web application API routes
>
> 2. **Desktop App Database (SQLite)** - Local file on user's machine
>    - Location: `desktop/data/pos_system.db`
>    - Tables: `license_activation`, `license_validation_log`
>    - Purpose: Local cache for offline operation, audit trail
>    - Used by: Electron desktop application
>
> The desktop app syncs with the web app's database via API calls, but maintains its own local cache for offline resilience.

### 10. **schema.ts (License Tables)**

**Location:** `packages/main/src/database/schema.ts`

**Tables:**

#### **license_activation**

Stores the activated license for this installation (only one active at a time)

| Column                | Type                 | Description                                      |
| --------------------- | -------------------- | ------------------------------------------------ |
| `id`                  | INTEGER PRIMARY KEY  | Auto-increment ID                                |
| `license_key`         | TEXT UNIQUE NOT NULL | License key (e.g., AUR-PRO-V2-...)               |
| `machine_id_hash`     | TEXT NOT NULL        | Machine fingerprint hash                         |
| `terminal_name`       | TEXT NOT NULL        | Terminal name (default: "Terminal")              |
| `activation_id`       | TEXT                 | Server-side activation ID                        |
| `plan_id`             | TEXT NOT NULL        | Plan ID (e.g., "basic", "pro", "enterprise")     |
| `plan_name`           | TEXT NOT NULL        | Plan display name                                |
| `max_terminals`       | INTEGER NOT NULL     | Max terminals allowed                            |
| `features`            | TEXT NOT NULL        | JSON array of enabled features                   |
| `business_name`       | TEXT                 | Business name (optional)                         |
| `is_active`           | INTEGER NOT NULL     | Boolean flag (1 = active, 0 = inactive)          |
| `subscription_status` | TEXT NOT NULL        | Status (e.g., "active", "past_due", "cancelled") |
| `expires_at`          | TIMESTAMP            | Expiration date (null = no expiry)               |
| `activated_at`        | TIMESTAMP NOT NULL   | Activation timestamp                             |
| `last_heartbeat`      | TIMESTAMP NOT NULL   | Last successful heartbeat                        |
| `last_validated_at`   | TIMESTAMP NOT NULL   | Last validation timestamp                        |
| `created_at`          | TIMESTAMP NOT NULL   | Record creation timestamp                        |
| `updated_at`          | TIMESTAMP            | Last update timestamp                            |

#### **license_validation_log**

Tracks validation attempts for debugging and auditing

| Column            | Type                | Description                                                 |
| ----------------- | ------------------- | ----------------------------------------------------------- |
| `id`              | INTEGER PRIMARY KEY | Auto-increment ID                                           |
| `action`          | TEXT NOT NULL       | Action type (e.g., "activation", "validation", "heartbeat") |
| `status`          | TEXT NOT NULL       | Status (e.g., "success", "failed", "offline")               |
| `license_key`     | TEXT                | License key (optional)                                      |
| `machine_id_hash` | TEXT                | Machine fingerprint (optional)                              |
| `error_message`   | TEXT                | Error message if failed                                     |
| `server_response` | TEXT                | JSON server response                                        |
| `timestamp`       | TIMESTAMP NOT NULL  | Log timestamp                                               |

**Indexes:**

- `idx_license_validation_log_action` on `action`
- `idx_license_validation_log_timestamp` on `timestamp`

---

### 11. **0001_license_activation.sql**

**Location:** `packages/main/src/database/migrations/0001_license_activation.sql`

**Purpose:** Database migration to create license tables

**SQL:**

- Creates `license_activation` table
- Creates `license_validation_log` table
- Creates indexes for performance

---

## Utilities & Helpers

### 12. **machineFingerprint.ts**

**Location:** `packages/main/src/utils/machineFingerprint.ts`

**Purpose:** Generates a unique, stable machine identifier for license activation

**Version:** `MF2` (Machine Fingerprint v2)

**Stability Tiers:**

| Tier | Identifiers                       | Stability         | Description                             |
| ---- | --------------------------------- | ----------------- | --------------------------------------- |
| 1    | Disk serial, Windows Product ID   | Very stable       | Only changes with hardware/OS reinstall |
| 2    | Platform, CPU model, Architecture | Stable            | Rarely changes                          |
| 3    | Sorted MAC addresses (first 3)    | Moderately stable | Changes with network adapter changes    |

**Exported Functions:**

| Function                             | Description                  | Returns                               |
| ------------------------------------ | ---------------------------- | ------------------------------------- |
| `generateMachineFingerprint()`       | Generate unique machine hash | `string` (e.g., "MF2-{64-char-hex}")  |
| `validateMachineFingerprintFormat()` | Validate fingerprint format  | `boolean`                             |
| `getMachineInfo()`                   | Get machine info for display | `MachineInfo` object                  |
| `compareMachineFingerprints()`       | Compare two fingerprints     | `{ match: boolean, reason?: string }` |

**Platform-Specific Identifiers:**

| Platform | Primary Identifier | Method                                          |
| -------- | ------------------ | ----------------------------------------------- |
| Windows  | Windows Product ID | Registry query                                  |
| Windows  | Disk serial        | WMIC command                                    |
| macOS    | Hardware UUID      | `ioreg` command                                 |
| Linux    | Machine ID         | `/etc/machine-id` or `/var/lib/dbus/machine-id` |

**Security Features:**

- SHA-256 hashing (raw identifiers never stored)
- Virtual adapter filtering (Docker, VirtualBox, etc.)
- Sorted MAC addresses for consistency

---

## Type Definitions

### 13. **license.ts (API Types)**

**Location:** `packages/renderer/src/shared/types/api/license.ts`

**Exported Types:**

```typescript
export interface LicenseStatus {
  /* ... */
}
export interface LicenseActivationResult {
  /* ... */
}
export interface LicenseValidationResult {
  /* ... */
}
export interface MachineInfoResult {
  /* ... */
}
export interface FeatureCheckResult {
  /* ... */
}
export interface HeartbeatResult {
  /* ... */
}
export interface LicenseInitResult {
  /* ... */
}
export interface LicenseAPI {
  /* ... */
}
```

---

### 14. **license-context-types.ts**

**Location:** `packages/renderer/src/features/license/context/license-context-types.ts`

**Exported Types:**

```typescript
export interface LicenseContextValue {
  /* ... */
}
```

---

## License Activation Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters license key in activation screen             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. UI validates format (AUR-XXX-V2-XXXXXXXX-XX)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. useLicense.activate() called                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. IPC call to "license:activate"                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Main process generates machine fingerprint               │
│    - Platform + Arch + CPU                                   │
│    - Windows Product ID / macOS UUID / Linux machine-id     │
│    - Disk serial                                             │
│    - Sorted MAC addresses                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. POST /api/license/activate                                │
│    Body:                                                     │
│    - licenseKey                                              │
│    - machineIdHash                                           │
│    - terminalName                                            │
│    - appVersion                                              │
│    - ipAddress (optional)                                    │
│    - location (platform, arch)                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Web server validates:                                     │
│    - License exists and not revoked                          │
│    - Subscription is active                                  │
│    - Terminal limit not exceeded                             │
│    - Machine not already activated on another device        │
└─────────────────────────────────────────────────────────────┘
                           ↓ (Success)
┌─────────────────────────────────────────────────────────────┐
│ 8. Store activation in local database:                      │
│    - license_activation table                                │
│    - Set is_active = true                                    │
│    - Store plan, features, business name                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Initialize real-time sync:                                │
│    a) Start SSE connection to /api/events/:licenseKey       │
│    b) Start backup heartbeat timer (15 minutes)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. Return success to UI                                     │
│     - Show success message                                   │
│     - Redirect to main app                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Real-Time Subscription Sync Flow

### SSE (Server-Sent Events) Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Desktop App (Electron)                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SSE Client (subscriptionEventClient.ts)                 │ │
│ │ - Native Node.js HTTP client                            │ │
│ │ - Auto-reconnection with exponential backoff            │ │
│ │ - Event deduplication                                   │ │
│ │ - Heartbeat monitoring                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ (GET /api/events/:licenseKey?machineId=:hash)
┌─────────────────────────────────────────────────────────────┐
│ Web Server (Next.js API Route)                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SSE Endpoint (/api/events/[licenseKey]/route.ts)       │ │
│ │ - Validates license + machine                           │ │
│ │ - Sends heartbeat every 30 seconds                      │ │
│ │ - Pushes subscription events in real-time               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ (Webhook events)
┌─────────────────────────────────────────────────────────────┐
│ Stripe Webhooks                                              │
│ - subscription_updated                                       │
│ - customer.subscription.deleted                              │
│ - invoice.payment_failed                                     │
│ - invoice.payment_succeeded                                  │
└─────────────────────────────────────────────────────────────┘
```

### Event Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Stripe webhook received (e.g., subscription.deleted)     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Web server processes webhook, updates database           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SSE endpoint pushes event to connected desktop clients   │
│    Event format:                                             │
│    event: subscription_cancelled                             │
│    data: { cancelledAt, reason, gracePeriodEnd }            │
│    id: unique-event-id                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Desktop receives event (subscriptionEventClient)         │
│    - Parse SSE message                                       │
│    - Deduplicate (check event ID)                            │
│    - Emit to event handlers                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. license.handlers.ts processes event                      │
│    - handleSSEEvent() switch statement                       │
│    - Update local database                                   │
│    - Stop timers if license disabled                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Emit UI notification event                                │
│    - emitLicenseEvent() to all renderer windows             │
│    - e.g., "license:disabled", "license:paymentRequired"    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. UI listens and reacts                                     │
│    - Show toast notification                                 │
│    - Update license badge                                    │
│    - Redirect to activation screen if disabled              │
└─────────────────────────────────────────────────────────────┘
```

### Reconnection Logic

```
Connection Lost → Wait 1s → Retry → Wait 2s → Retry → Wait 4s → ...
                                     ↓
                            Max delay: 5 minutes
                                     ↓
                            Keep retrying forever
```

---

## Heartbeat & Validation Flow

### Dual Sync Strategy

The system uses **two complementary mechanisms** for subscription sync:

1. **SSE (Real-time)** - Primary sync method (instant updates)
2. **Heartbeat Polling (15 min)** - Backup sync (catches missed events)

### Heartbeat Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Timer fires every 15 minutes (+0-5 min randomization)    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /api/license/heartbeat                               │
│    Body:                                                     │
│    - licenseKey                                              │
│    - machineIdHash                                           │
│    - appVersion                                              │
│    - sessionCount (optional)                                 │
│    - transactionCount (optional)                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Server checks:                                            │
│    - License still valid?                                    │
│    - Subscription still active?                              │
│    - Grace period expired?                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Update local database:                                    │
│    - last_heartbeat = NOW()                                  │
│    - subscription_status = response.subscriptionStatus      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Check shouldDisable flag:                                 │
│    If true:                                                  │
│    - Stop heartbeat timer                                    │
│    - Disconnect SSE                                          │
│    - Deactivate license locally                              │
│    - Emit "license:disabled" event                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Track failures:                                           │
│    - Increment consecutiveHeartbeatFailures                  │
│    - After 5 failures → Emit "license:connectionIssue"      │
└─────────────────────────────────────────────────────────────┘
```

### Startup Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. App launches → license:initialize IPC called             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Check local database for activation                      │
│    If no activation → Return { isActivated: false }         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BLOCKING validation (validateLicense)                    │
│    - Check license not revoked                               │
│    - Check subscription still active                         │
│    - Check grace period if offline                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Handle validation result:                                 │
│    a) LICENSE_REVOKED → Deactivate, show error             │
│    b) Success → Continue startup                             │
│    c) Network error + grace period expired → Deactivate     │
│    d) Network error + grace period valid → Continue         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Initialize real-time sync:                                │
│    - Start SSE connection                                    │
│    - Start heartbeat timer                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Return to UI:                                             │
│    - { success: true, isActivated: true, data: {...} }      │
└─────────────────────────────────────────────────────────────┘
```

---

## Grace Period & Offline Mode

### Grace Period Configuration

- **Duration:** 7 days (168 hours)
- **Purpose:** Allow temporary offline operation during network outages
- **Behavior:** License remains valid if last heartbeat within grace period

### Grace Period Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Last successful heartbeat: Day 0                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Day 1-7: Network offline                                     │
│ - Heartbeat fails                                            │
│ - isWithinGracePeriod() returns true                        │
│ - License remains valid                                      │
│ - UI shows "Offline Mode" badge                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Day 8: Grace period expired                                  │
│ - isWithinGracePeriod() returns false                       │
│ - License becomes invalid                                    │
│ - App shows activation screen                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Network restored: Heartbeat succeeds                         │
│ - Grace period resets                                        │
│ - License valid again                                        │
└─────────────────────────────────────────────────────────────┘
```

### Grace Period Calculation

```typescript
function isWithinGracePeriod(lastHeartbeat: Date | null): boolean {
  if (!lastHeartbeat) return false;

  const now = new Date();
  const gracePeriodEnd = new Date(lastHeartbeat.getTime() + OFFLINE_GRACE_PERIOD_MS);

  return now < gracePeriodEnd;
}
```

**Constants:**

- `OFFLINE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000` (7 days)

---

## Feature Gating Flow

### Feature Check Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Component wants to check feature availability             │
│    Example: "inventory_management"                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Call hasFeature("inventory_management")                  │
│    Options:                                                  │
│    a) useLicense().hasFeature()                             │
│    b) useLicenseContext().hasFeature()                      │
│    c) window.licenseAPI.hasFeature()                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. IPC call to "license:hasFeature"                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Main process checks local database:                      │
│    - Get active license                                      │
│    - Check if is_active = true                              │
│    - Check features array includes feature name             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Return result:                                            │
│    { success: true, hasFeature: true/false, planId: "..." } │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. UI conditional rendering:                                 │
│    if (hasFeature) {                                         │
│      <FeatureComponent />                                    │
│    } else {                                                  │
│      <UpgradeCTA />                                          │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Feature List (Example)

| Feature                | Basic Plan | Professional | Enterprise |
| ---------------------- | ---------- | ------------ | ---------- |
| `pos_transactions`     | ✅         | ✅           | ✅         |
| `inventory_management` | ✅         | ✅           | ✅         |
| `multi_terminal`       | ❌         | ✅           | ✅         |
| `advanced_reports`     | ❌         | ✅           | ✅         |
| `api_access`           | ❌         | ❌           | ✅         |
| `white_label`          | ❌         | ❌           | ✅         |

---

## Deactivation Flow

### User-Initiated Deactivation

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Deactivate License" in settings             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Confirmation dialog shown                                 │
│    "Are you sure? This will disable the software."          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. useLicense().deactivate() called                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. IPC call to "license:deactivate"                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. POST /api/license/deactivate                              │
│    Body:                                                     │
│    - licenseKey                                              │
│    - machineIdHash                                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Server removes activation record                          │
│    - Frees up terminal slot                                  │
│    - Logs deactivation event                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Cleanup on desktop:                                       │
│    - Stop heartbeat timer                                    │
│    - Disconnect SSE client                                   │
│    - Update database: is_active = false                      │
│    - Log deactivation                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Return success to UI                                      │
│    - Show success message                                    │
│    - Redirect to activation screen                           │
└─────────────────────────────────────────────────────────────┘
```

### Server-Initiated Deactivation (License Revoked)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin revokes license in web dashboard                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Web server updates license record:                       │
│    - status = "revoked"                                      │
│    - revocation_reason = "Payment chargeback"               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SSE event pushed to desktop:                              │
│    event: license_revoked                                    │
│    data: { reason: "Payment chargeback" }                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Desktop receives event instantly                          │
│    - handleSSEEvent("license_revoked")                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Immediate deactivation:                                   │
│    - Stop all timers                                         │
│    - Disconnect SSE                                          │
│    - Set is_active = false                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. UI notification:                                          │
│    - emitLicenseEvent("license:disabled")                   │
│    - Show error dialog with revocation reason               │
│    - Redirect to activation screen                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary of All Files

### Main Process (Backend)

| File Path                                                           | Purpose                                    | LOC  |
| ------------------------------------------------------------------- | ------------------------------------------ | ---- |
| `packages/main/src/services/licenseService.ts`                      | HTTP API client for license operations     | 568  |
| `packages/main/src/services/subscriptionEventClient.ts`             | SSE client for real-time subscription sync | 516  |
| `packages/main/src/ipc/license.handlers.ts`                         | IPC handlers for license communication     | 1189 |
| `packages/main/src/utils/machineFingerprint.ts`                     | Machine fingerprint generation             | 311  |
| `packages/main/src/database/schema.ts`                              | Database schema (license tables)           | ~50  |
| `packages/main/src/database/migrations/0001_license_activation.sql` | License tables migration                   | 42   |

### Preload (IPC Bridge)

| File Path                             | Purpose                         | LOC |
| ------------------------------------- | ------------------------------- | --- |
| `packages/preload/src/api/license.ts` | Secure API exposure to renderer | 54  |

### Renderer Process (Frontend)

| File Path                                                                         | Purpose                  | LOC |
| --------------------------------------------------------------------------------- | ------------------------ | --- |
| `packages/renderer/src/features/license/components/license-activation-screen.tsx` | License activation UI    | 282 |
| `packages/renderer/src/features/license/components/license-status-badge.tsx`      | Status badge component   | 76  |
| `packages/renderer/src/features/license/hooks/use-license.ts`                     | License React hook       | 217 |
| `packages/renderer/src/features/license/context/license-context.tsx`              | License context provider | 97  |
| `packages/renderer/src/features/license/context/use-license-context.ts`           | Context hook             | ~20 |
| `packages/renderer/src/features/license/context/license-context-types.ts`         | Context type definitions | ~30 |
| `packages/renderer/src/shared/types/api/license.ts`                               | License API types        | 145 |
| `packages/renderer/src/features/license/index.ts`                                 | Feature exports          | ~10 |

**Total Files:** 15 core files
**Total Lines of Code:** ~3,600 lines

---

## Key Design Principles

### 1. **Security First**

- ✅ URL validation prevents SSRF attacks
- ✅ Machine fingerprint uses SHA-256 hashing
- ✅ Context bridge isolation (no direct IPC access)
- ✅ Secure domain whitelist

### 2. **Offline Resilience**

- ✅ 7-day grace period for network outages
- ✅ Local database caching
- ✅ Graceful degradation when offline
- ✅ Automatic recovery when online

### 3. **Real-Time Sync**

- ✅ SSE for instant subscription updates
- ✅ Dual sync (SSE + polling) for redundancy
- ✅ Event deduplication
- ✅ Automatic reconnection

### 4. **Developer Experience**

- ✅ Clean separation of concerns (layers)
- ✅ Type safety with TypeScript
- ✅ React hooks for easy integration
- ✅ Context API for global state

### 5. **Audit Trail**

- ✅ All validation attempts logged
- ✅ Server responses stored
- ✅ Timestamp tracking
- ✅ Debugging-friendly

---

## Testing Checklist

### License Activation

- [ ] Activate with valid license key
- [ ] Activate with invalid license key
- [ ] Activate with expired license
- [ ] Activate with revoked license
- [ ] Activate with terminal limit exceeded
- [ ] Activate offline (should fail gracefully)

### Subscription Changes

- [ ] Subscription cancelled (immediate)
- [ ] Subscription cancelled (scheduled)
- [ ] Subscription reactivated
- [ ] Payment failed (past_due)
- [ ] Payment succeeded after failure
- [ ] Plan upgraded
- [ ] Plan downgraded

### License Revocation

- [ ] License revoked by admin (SSE event)
- [ ] License revoked detected on heartbeat
- [ ] License revoked detected on startup validation

### Offline Mode

- [ ] Activate while online, then go offline
- [ ] Stay offline for 1-6 days (should work)
- [ ] Stay offline for 8+ days (should disable)
- [ ] Go online after grace period expired

### Deactivation

- [ ] User deactivates license
- [ ] Deactivate while offline
- [ ] Terminal slot freed after deactivation

### SSE Real-Time Sync

- [ ] SSE connects on activation
- [ ] SSE reconnects after network outage
- [ ] SSE events trigger UI notifications
- [ ] Heartbeat keeps connection alive

---

## API Endpoints Used

> **📍 All endpoints are in the `/web` folder (Next.js application)**
>
> The desktop app makes HTTP requests to these Next.js API routes:
>
> - `web/app/api/license/activate/route.ts`
> - `web/app/api/license/validate/route.ts`
> - `web/app/api/license/heartbeat/route.ts`
> - `web/app/api/license/deactivate/route.ts`
> - `web/app/api/events/[licenseKey]/route.ts`

| Endpoint                  | Method    | Purpose                       | Web File Path                              |
| ------------------------- | --------- | ----------------------------- | ------------------------------------------ |
| `/api/license/activate`   | POST      | Activate license key          | `web/app/api/license/activate/route.ts`    |
| `/api/license/validate`   | POST      | Validate license              | `web/app/api/license/validate/route.ts`    |
| `/api/license/heartbeat`  | POST      | Send heartbeat                | `web/app/api/license/heartbeat/route.ts`   |
| `/api/license/deactivate` | POST      | Deactivate license            | `web/app/api/license/deactivate/route.ts`  |
| `/api/events/:licenseKey` | GET (SSE) | Real-time subscription events | `web/app/api/events/[licenseKey]/route.ts` |

---

## Environment Variables

| Variable          | Default                 | Description                          |
| ----------------- | ----------------------- | ------------------------------------ |
| `LICENSE_API_URL` | `http://localhost:3000` | Web API base URL                     |
| `NODE_ENV`        | -                       | Environment (development/production) |

---

## Troubleshooting

### License activation fails

1. Check network connectivity
2. Verify API URL is correct
3. Check license key format
4. Review validation logs in database

### SSE connection fails

1. Check firewall/proxy settings
2. Verify web server is running
3. Check SSE endpoint responds
4. Review browser/electron console

### Grace period expired unexpectedly

1. Check system clock is accurate
2. Verify last_heartbeat timestamp
3. Review heartbeat timer status

---

## Future Enhancements

- [ ] License transfer workflow
- [ ] Multi-region API failover
- [ ] License analytics dashboard
- [ ] Automated renewal reminders
- [ ] License usage metrics

---

**Document Version:** 1.0.0  
**Last Updated:** January 6, 2025  
**Author:** AI Assistant  
**License:** Proprietary - AuraSwift EPOS
