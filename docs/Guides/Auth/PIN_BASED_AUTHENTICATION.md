# PIN-Based Authentication System

## Overview

The AuraSwift EPOS system uses a PIN-based authentication mechanism for secure, fast user login and verification. This document explains how PIN authentication works throughout the application, the packages involved, and the complete authentication flow.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Packages and Components](#packages-and-components)
3. [Authentication Flows](#authentication-flows)
4. [PIN Management](#pin-management)
5. [Security Considerations](#security-considerations)
6. [API Reference](#api-reference)

---

## Architecture Overview

The PIN authentication system follows Electron's multi-process architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      RENDERER PROCESS                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           React Components (UI Layer)                  │ │
│  │  • AuthPage                                            │ │
│  │  • AuthUserSelection                                   │ │
│  │  • PinEntryScreen                                      │ │
│  │  • LockScreen                                          │ │
│  │  • ChangePinDialog                                     │ │
│  │  • ForcePinChangeScreen                                │ │
│  └─────────────────┬──────────────────────────────────────┘ │
│                    │                                         │
│  ┌─────────────────▼──────────────────────────────────────┐ │
│  │        Auth Context & Hooks (State Management)         │ │
│  │  • AuthProvider (Context Provider)                     │ │
│  │  • useAuth() hook                                      │ │
│  └─────────────────┬──────────────────────────────────────┘ │
│                    │                                         │
│  ┌─────────────────▼──────────────────────────────────────┐ │
│  │           window.authAPI (Preload Bridge)              │ │
│  │  • login()                                             │ │
│  │  • verifyPin()                                         │ │
│  │  • changePin()                                         │ │
│  │  • resetPin()                                          │ │
│  │  • setNewPin()                                         │ │
│  └─────────────────┬──────────────────────────────────────┘ │
└────────────────────┼──────────────────────────────────────────┘
                     │ IPC Communication
┌────────────────────▼──────────────────────────────────────────┐
│                   PRELOAD PROCESS                             │
│  ┌──────────────────────────────────────────────────────────┐│
│  │         Auth API Bridge (Context Bridge)                ││
│  │  • ipcRenderer.invoke() wrapper                         ││
│  │  • Type-safe IPC communication                          ││
│  └─────────────────┬────────────────────────────────────────┘│
└────────────────────┼──────────────────────────────────────────┘
                     │ IPC Main Handlers
┌────────────────────▼──────────────────────────────────────────┐
│                      MAIN PROCESS                             │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              IPC Handlers (auth.handlers.ts)            ││
│  │  • auth:login                                           ││
│  │  • auth:verifyPin                                       ││
│  │  • auth:change-pin                                      ││
│  │  • auth:reset-pin                                       ││
│  │  • auth:set-new-pin                                     ││
│  └─────────────────┬────────────────────────────────────────┘│
│                    │                                          │
│  ┌─────────────────▼────────────────────────────────────────┐│
│  │         UserManager (Business Logic)                    ││
│  │  • authenticateUserByUsernamePin()                      ││
│  │  • verifyPinForUser()                                   ││
│  │  • updateUserPin()                                      ││
│  │  • changeUserPin()                                      ││
│  │  • resetUserPin()                                       ││
│  └─────────────────┬────────────────────────────────────────┘│
│                    │                                          │
│  ┌─────────────────▼────────────────────────────────────────┐│
│  │        Database Layer (SQLite via Drizzle ORM)          ││
│  │  • users table (pinHash, salt, requiresPinChange)       ││
│  │  • bcrypt for PIN hashing and comparison                ││
│  └──────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

---

## Packages and Components

### 1. Renderer Package (`packages/renderer`)

**Location**: `packages/renderer/src/features/auth/`

#### Components

##### **AuthPage** (`views/auth-page.tsx`)

- Main authentication page
- Renders header, user selection, and footer
- Entry point for the login flow

##### **AuthUserSelection** (`components/auth-user-selection.tsx`)

- Displays grid of active users
- Handles user selection
- Manages PIN entry state
- Auto-submits when 4-digit PIN is complete

**Key Features:**

- Loads active users via `window.authAPI.getAllActiveUsers()`
- Assigns color coding by role
- Transitions to PIN entry screen on user selection
- Auto-clears PIN on failed login

##### **PinEntryScreen** (`components/pin-entry-screen.tsx`)

- Visual PIN entry interface with numeric keypad
- Shows 4-dot PIN display (filled/empty circles)
- Provides Back and Delete buttons
- Displays login errors

**Props:**

```typescript
interface PinEntryScreenProps {
  user: UserForLogin;
  pin: string;
  loginError: string;
  isLoading: boolean;
  onPinInput: (digit: string) => void;
  onDeletePin: () => void;
  onBack: () => void;
}
```

##### **LockScreen** (`features/sales/components/lock-screen.tsx`)

- Full-screen overlay when till is locked
- PIN verification to unlock
- Shows active break status and timer
- Automatically ends break on successful unlock

**Usage Scenario:**
When a cashier locks the till for a break, they must re-enter their PIN to unlock.

##### **ChangePinDialog** (`components/change-pin-dialog.tsx`)

- Modal dialog for changing PIN (self-service)
- Requires current PIN verification
- New PIN must be different from current PIN
- Validates PIN format (4 digits)

##### **ForcePinChangeScreen** (`components/force-pin-change-screen.tsx`)

- Full-screen overlay for forced PIN changes
- Shown when `requiresPinChange` flag is true
- Blocks access until new PIN is set
- Triggered after admin resets user's PIN

#### Context & Hooks

##### **AuthProvider** (`context/auth-context.tsx`)

Provides authentication state and methods to the entire application.

**State:**

```typescript
{
  user: User | null;
  sessionToken: string | null;
  requiresPinChange: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}
```

**Methods:**

- `login(username, pin, rememberMe)` - Authenticate user
- `logout()` - End session and clear data
- `register()` - Create new user account
- `createUser()` - Admin creates staff user
- `completeForceChangePIN(newPin)` - Complete forced PIN change

##### **useAuth Hook** (`shared/hooks/use-auth.tsx`)

```typescript
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

**Usage:**

```typescript
const { user, login, logout, isLoading } = useAuth();
```

---

### 2. Preload Package (`packages/preload`)

**Location**: `packages/preload/src/api/auth.ts`

Exposes secure IPC bridge between renderer and main process.

**Auth API:**

```typescript
export const authAPI = {
  // Authentication
  login: (credentials: LoginCredentials) => ipcRenderer.invoke("auth:login", credentials),

  logout: (sessionToken: string, metadata?: LogoutMetadata) => ipcRenderer.invoke("auth:logout", sessionToken, metadata),

  // PIN Verification
  verifyPin: (userId: string, pin: string) => ipcRenderer.invoke("auth:verifyPin", userId, pin),

  // PIN Management
  changePin: (sessionToken: string, currentPin: string, newPin: string) => ipcRenderer.invoke("auth:change-pin", sessionToken, currentPin, newPin),

  resetPin: (sessionToken: string, userId: string) => ipcRenderer.invoke("auth:reset-pin", sessionToken, userId),

  setNewPin: (sessionToken: string, newPin: string) => ipcRenderer.invoke("auth:set-new-pin", sessionToken, newPin),

  // User Management
  getAllActiveUsers: () => ipcRenderer.invoke("auth:getAllActiveUsers"),

  createUser: (sessionToken: string, userData: CreateUserData) => ipcRenderer.invoke("auth:createUser", sessionToken, userData),
};
```

---

### 3. Main Package (`packages/main`)

#### IPC Handlers (`src/ipc/auth.handlers.ts`)

Registers all authentication-related IPC handlers.

**Key Handlers:**

##### **auth:login**

```typescript
ipcMain.handle("auth:login", async (event, credentials) => {
  // 1. Validate credentials
  // 2. Authenticate via UserManager
  // 3. Create session
  // 4. Handle shift/clock-in logic
  // 5. Return user + token
});
```

##### **auth:verifyPin**

```typescript
ipcMain.handle("auth:verifyPin", async (event, userId, pin) => {
  // Verify PIN without creating session
  // Used for till unlock, break confirmation, etc.
  const isValid = await db.users.verifyPinForUser(userId, pin);
  return { success: isValid };
});
```

##### **auth:change-pin**

```typescript
ipcMain.handle("auth:change-pin", async (event, sessionToken, currentPin, newPin) => {
  // 1. Validate session
  // 2. Verify current PIN
  // 3. Update to new PIN
  // 4. Clear requiresPinChange flag
  // 5. Audit log
});
```

##### **auth:reset-pin**

```typescript
ipcMain.handle("auth:reset-pin", async (event, sessionToken, userId) => {
  // Admin/Manager only
  // 1. Validate permission (USERS_MANAGE)
  // 2. Generate temporary 4-digit PIN
  // 3. Set requiresPinChange flag
  // 4. Return temporary PIN to admin
});
```

##### **auth:set-new-pin**

```typescript
ipcMain.handle("auth:set-new-pin", async (event, sessionToken, newPin) => {
  // For forced PIN change
  // 1. Verify requiresPinChange flag is set
  // 2. Update PIN
  // 3. Clear requiresPinChange flag
});
```

#### UserManager (`src/database/managers/userManager.ts`)

Core business logic for user authentication and PIN management.

**Key Methods:**

##### **authenticateUserByUsernamePin()**

```typescript
async authenticateUserByUsernamePin(
  username: string,
  pin: string,
): Promise<User | null> {
  // 1. Get user by username
  // 2. Validate PIN hash exists
  // 3. Compare PIN using bcrypt
  // 4. Return user (without secrets) or null
}
```

##### **verifyPinForUser()**

```typescript
async verifyPinForUser(userId: string, pin: string): Promise<boolean> {
  // 1. Get user by ID
  // 2. Validate PIN hash format
  // 3. Compare PIN using bcrypt
  // 4. Return boolean
}
```

##### **updateUserPin()**

```typescript
async updateUserPin(
  userId: string,
  newPin: string,
): Promise<{ success: boolean; message: string }> {
  // 1. Validate PIN format (4 digits)
  // 2. Generate new hash with bcrypt
  // 3. Update database
}
```

##### **changeUserPin()**

```typescript
async changeUserPin(
  userId: string,
  currentPin: string,
  newPin: string,
): Promise<{ success: boolean; message: string }> {
  // 1. Verify current PIN
  // 2. Validate new PIN format
  // 3. Ensure new PIN differs from current
  // 4. Update PIN
  // 5. Clear requiresPinChange flag
}
```

##### **resetUserPin()**

```typescript
async resetUserPin(
  userId: string,
  requestedByUserId: string,
): Promise<{
  success: boolean;
  temporaryPin?: string;
  message: string;
}> {
  // 1. Verify requester is admin/manager
  // 2. Generate temporary 4-digit PIN
  // 3. Update user's PIN
  // 4. Set requiresPinChange flag
  // 5. Return temporary PIN
}
```

#### Database Schema (`src/database/schema.ts`)

```typescript
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  pinHash: text("pin_hash").notNull(), // bcrypt hash
  salt: text("salt").notNull(),
  requiresPinChange: integer("requires_pin_change", { mode: "boolean" }).notNull().default(false),
  // ... other fields
});
```

---

## Authentication Flows

### 1. Initial Login Flow

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────┐
│ AuthPage Renders            │
│ - AuthUserSelection shown   │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ User Selects Account        │
│ - User card clicked         │
│ - selectedUser state set    │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ PinEntryScreen Renders      │
│ - Shows user info           │
│ - Displays PIN dots         │
│ - Shows numeric keypad      │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ User Enters 4-digit PIN     │
│ - Each digit adds to state  │
│ - Visual feedback (dots)    │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Auto-submit on 4th Digit    │
│ - useEffect triggered       │
│ - Calls useAuth().login()   │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ AuthContext.login()         │
│ - Calls window.authAPI      │
│ - Passes username + PIN     │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ IPC: auth:login             │
│ - Preload bridges to main   │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Main Process Handler                │
│ 1. Get terminal ID, IP address      │
│ 2. Call db.users.login()            │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ UserManager.login()                 │
│ 1. Validate credentials             │
│ 2. authenticateUserByUsernamePin()  │
└────┬────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ authenticateUserByUsernamePin()      │
│ 1. getUserByUsername()               │
│ 2. Verify pinHash exists             │
│ 3. bcrypt.compare(pin, pinHash)      │
│ 4. Return user (without secrets)     │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Back to UserManager.login()          │
│ 1. Create session token              │
│ 2. Handle shift requirement          │
│ 3. Auto clock-in if needed           │
│ 4. Return AuthResponse               │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ IPC Response to Renderer             │
│ { success, user, token, shift, ... } │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ AuthContext Updates State            │
│ 1. Store token in SafeStorage        │
│ 2. Store user in SafeStorage         │
│ 3. Set user state                    │
│ 4. Set sessionToken state            │
│ 5. Check requiresPinChange           │
└────┬─────────────────────────────────┘
     │
     ▼
    ╱ ╲
   ╱   ╲ requiresPinChange?
  ╱     ╲
 ╱       ╲
╱         ╲
│   YES   │         │   NO    │
└────┬────┘         └────┬────┘
     │                   │
     ▼                   ▼
┌─────────────┐   ┌──────────────┐
│ Force PIN   │   │ Redirect to  │
│ Change      │   │ Dashboard    │
│ Screen      │   │              │
└─────────────┘   └──────────────┘
```

### 2. Force PIN Change Flow

```
┌─────────────────────────────┐
│ Login with requiresPinChange│
│ flag = true                 │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ ForcePinChangeScreen Shown  │
│ - Blocks all other access   │
│ - Full-screen overlay       │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ User Enters New PIN         │
│ - 4-digit validation        │
│ - Confirm PIN entry         │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Submit New PIN              │
│ - Calls completeForceChange │
│   PIN(newPin)               │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ IPC: auth:set-new-pin       │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Main Process Handler        │
│ 1. Validate session         │
│ 2. Check requiresPinChange  │
│ 3. Validate PIN format      │
│ 4. updateUserPin()          │
│ 5. Clear requiresPinChange  │
│ 6. Audit log                │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Success Response            │
│ - PIN updated               │
│ - User can now access app   │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ onComplete() called         │
│ - AuthContext refreshes     │
│ - Redirect to dashboard     │
└─────────────────────────────┘
```

### 3. Till Lock/Unlock Flow

```
┌─────────────────────────────┐
│ Cashier on Sales Page       │
│ - Active transaction view   │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Clicks "Lock Till & Break"  │
│ - Opens LockTillBreakDialog │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Confirm Break Type          │
│ - Meal / Rest / Other       │
│ - Click "Start Break"       │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ IPC: startBreak             │
│ - Creates break record      │
│ - Sets isTillLocked = true  │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ LockScreen Overlay Shows    │
│ - Full-screen overlay       │
│ - Shows break timer         │
│ - Shows user info           │
│ - PIN entry keypad          │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ User Enters PIN to Unlock   │
│ - PIN accumulated in state  │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Click "Unlock Till" Button  │
│ - Calls handleUnlock()      │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ IPC: auth:verifyPin         │
│ - Passes lockedByUserId     │
│ - Passes entered PIN        │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Main: verifyPinForUser()    │
│ 1. Get user by ID           │
│ 2. Compare PIN hash         │
│ 3. Return boolean           │
└────┬────────────────────────┘
     │
     ▼
    ╱ ╲
   ╱   ╲ Valid PIN?
  ╱     ╲
 ╱       ╲
│   NO    │         │   YES   │
└────┬────┘         └────┬────┘
     │                   │
     ▼                   ▼
┌─────────┐       ┌──────────────┐
│ Show    │       │ IPC: endBreak│
│ Error   │       │ - Auto-ends  │
│ Message │       │   break      │
└─────────┘       └────┬─────────┘
                       │
                       ▼
                 ┌──────────────┐
                 │ onUnlock()   │
                 │ - Clear lock │
                 │ - Refresh UI │
                 └──────────────┘
```

### 4. Admin PIN Reset Flow

```
┌─────────────────────────────┐
│ Admin/Manager in User Mgmt  │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Click "Reset PIN" on User   │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Confirm Reset Action        │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ IPC: auth:reset-pin         │
│ - sessionToken              │
│ - targetUserId              │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Main Process Handler                │
│ 1. Validate session                 │
│ 2. Check USERS_MANAGE permission    │
│ 3. Verify requester is admin/mgr    │
│ 4. Call resetUserPin()              │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ UserManager.resetUserPin()          │
│ 1. Verify target user exists        │
│ 2. Check requester role             │
│ 3. Generate random 4-digit PIN      │
│ 4. Hash and update database         │
│ 5. Set requiresPinChange = true     │
│ 6. Return temporary PIN             │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Response to Admin                   │
│ { success: true,                    │
│   temporaryPin: "1234",             │
│   message: "..." }                  │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Show Temporary PIN to Admin         │
│ - Display in modal/dialog           │
│ - Admin communicates to user        │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ User Logs In with Temp PIN          │
│ - requiresPinChange flag detected   │
│ - ForcePinChangeScreen shown        │
└─────────────────────────────────────┘
```

### 5. Self-Service PIN Change Flow

```
┌─────────────────────────────┐
│ User in Dashboard           │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Clicks "Change PIN" Button  │
│ - In user menu or settings  │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ ChangePinDialog Opens       │
│ - Modal overlay             │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Enter Current PIN           │
│ - 4-digit field             │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Enter New PIN               │
│ - Must be different         │
│ - 4 digits                  │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Confirm New PIN             │
│ - Must match new PIN        │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Submit Form                 │
│ - Client-side validation    │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ IPC: auth:change-pin        │
│ - sessionToken              │
│ - currentPin                │
│ - newPin                    │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Main Process Handler                │
│ 1. Validate session                 │
│ 2. Call changeUserPin()             │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ UserManager.changeUserPin()         │
│ 1. Verify current PIN               │
│ 2. Validate new PIN format          │
│ 3. Ensure new ≠ current             │
│ 4. Update PIN hash                  │
│ 5. Clear requiresPinChange          │
└────┬────────────────────────────────┘
     │
     ▼
    ╱ ╲
   ╱   ╲ Success?
  ╱     ╲
 ╱       ╲
│   YES   │         │   NO    │
└────┬────┘         └────┬────┘
     │                   │
     ▼                   ▼
┌──────────┐       ┌──────────┐
│ Success  │       │ Error    │
│ Toast    │       │ Message  │
│ Close    │       │ Shown    │
│ Dialog   │       │          │
└──────────┘       └──────────┘
```

---

## PIN Management

### PIN Storage

PINs are **never stored in plain text**. The system uses bcrypt hashing with salt:

```typescript
// Database schema
{
  pinHash: text("pin_hash").notNull(),  // bcrypt hash
  salt: text("salt").notNull(),         // unique salt per user
  requiresPinChange: integer("requires_pin_change", { mode: "boolean" })
    .notNull()
    .default(false)
}
```

### PIN Hashing Process

```typescript
// Creating a new PIN
const salt = await bcrypt.genSalt(10);
const hashedPin = await bcrypt.hash(pin, salt);

// Verifying a PIN
const isValid = await bcrypt.compare(inputPin, storedPinHash);
```

### PIN Validation Rules

1. **Format**: Must be exactly **4 digits** (0-9)
2. **Uniqueness**: New PIN must differ from current PIN
3. **Match**: Confirmation must match new PIN
4. **Security**: Hashed with bcrypt + salt

**Validation Schema:**

```typescript
const pinSchema = z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only numbers");
```

### PIN Change States

#### `requiresPinChange` Flag

When `true`, user is forced to change PIN on next login:

- Admin resets user's PIN → `requiresPinChange = true`
- User completes forced change → `requiresPinChange = false`
- Self-service PIN change → `requiresPinChange = false`

---

## Security Considerations

### 1. **Hash Storage**

- PINs are hashed with bcrypt (cost factor 10)
- Each user has unique salt
- Hash format: `$2a$10$...` (bcrypt identifier)

### 2. **IPC Security**

- Context isolation enabled
- Preload script acts as secure bridge
- No direct Node.js access from renderer
- All IPC calls validated in main process

### 3. **Session Management**

- Tokens stored in Electron SafeStorage (encrypted)
- Session validation on every protected IPC call
- Auto clock-out on logout

### 4. **Rate Limiting**

- Failed login attempts tracked per username/terminal
- Prevents brute force attacks
- Audit trail for failed attempts

### 5. **Permission Checks**

- PIN reset requires `USERS_MANAGE` permission
- Only admin/manager can reset PINs
- Business access validation

### 6. **Data Sanitization**

- PIN values trimmed and validated
- Only digits accepted (via regex)
- Length enforcement (4 digits max)

### 7. **Audit Logging**

- All PIN changes logged
- Reset actions tracked with requester ID
- Method recorded (self_service, admin_reset, forced_change)

---

## API Reference

### Renderer (window.authAPI)

#### `login(credentials)`

**Description:** Authenticate user with username and PIN

**Parameters:**

```typescript
{
  username: string;
  pin: string;
  rememberMe?: boolean;
  terminalId?: string;
  ipAddress?: string;
}
```

**Returns:**

```typescript
{
  success: boolean;
  user?: User;
  token?: string;
  shift?: Shift;
  clockEvent?: ClockEvent;
  message: string;
  errors?: string[];
}
```

---

#### `verifyPin(userId, pin)`

**Description:** Verify PIN for a user (doesn't create session)

**Parameters:**

- `userId: string` - User ID
- `pin: string` - PIN to verify

**Returns:**

```typescript
{
  success: boolean;
  message?: string;
}
```

**Use Cases:**

- Till unlock
- Break confirmation
- Sensitive action verification

---

#### `changePin(sessionToken, currentPin, newPin)`

**Description:** Change user's PIN (self-service)

**Parameters:**

- `sessionToken: string` - Current session token
- `currentPin: string` - Current 4-digit PIN
- `newPin: string` - New 4-digit PIN

**Returns:**

```typescript
{
  success: boolean;
  message: string;
}
```

**Validations:**

- Current PIN must be correct
- New PIN must be 4 digits
- New PIN must differ from current

---

#### `resetPin(sessionToken, userId)`

**Description:** Admin/manager resets user's PIN

**Parameters:**

- `sessionToken: string` - Admin/manager session token
- `userId: string` - Target user ID

**Returns:**

```typescript
{
  success: boolean;
  temporaryPin?: string;  // 4-digit temporary PIN
  message: string;
}
```

**Permissions:** Requires `USERS_MANAGE` permission

---

#### `setNewPin(sessionToken, newPin)`

**Description:** Complete forced PIN change

**Parameters:**

- `sessionToken: string` - Current session token
- `newPin: string` - New 4-digit PIN

**Returns:**

```typescript
{
  success: boolean;
  message: string;
}
```

**Validations:**

- User must have `requiresPinChange = true`
- New PIN must be 4 digits

---

### Main Process (UserManager)

#### `authenticateUserByUsernamePin(username, pin)`

**Description:** Authenticate user with username and PIN

**Returns:** `User | null`

---

#### `verifyPinForUser(userId, pin)`

**Description:** Verify PIN for user by ID

**Returns:** `boolean`

---

#### `updateUserPin(userId, newPin)`

**Description:** Update user's PIN hash

**Returns:**

```typescript
{
  success: boolean;
  message: string;
}
```

---

#### `changeUserPin(userId, currentPin, newPin)`

**Description:** Change user's PIN with verification

**Returns:**

```typescript
{
  success: boolean;
  message: string;
}
```

---

#### `resetUserPin(userId, requestedByUserId)`

**Description:** Reset user's PIN (admin action)

**Returns:**

```typescript
{
  success: boolean;
  temporaryPin?: string;
  message: string;
}
```

---

## Common Use Cases

### Use Case 1: Standard Login

```typescript
// In component
const { login, isLoading } = useAuth();

const handleLogin = async (username: string, pin: string) => {
  const result = await login(username, pin, false);
  if (result.success) {
    // User logged in, redirect to dashboard
  } else {
    // Show error message
    console.error(result.message);
  }
};
```

### Use Case 2: Verify PIN for Sensitive Action

```typescript
// Example: Manager approval for discount
const verifyManagerPin = async (managerId: string, pin: string) => {
  const response = await window.authAPI.verifyPin(managerId, pin);
  return response.success;
};
```

### Use Case 3: Self-Service PIN Change

```typescript
// In ChangePinDialog
const handleChangePin = async (currentPin: string, newPin: string) => {
  const token = await window.authStore.get("token");
  const result = await window.authAPI.changePin(token, currentPin, newPin);

  if (result.success) {
    toast.success("PIN changed successfully");
  } else {
    toast.error(result.message);
  }
};
```

### Use Case 4: Admin Resets User PIN

```typescript
// In user management view
const handleResetPin = async (userId: string) => {
  const token = await window.authStore.get("token");
  const result = await window.authAPI.resetPin(token, userId);

  if (result.success && result.temporaryPin) {
    // Show temporary PIN to admin
    alert(`Temporary PIN: ${result.temporaryPin}`);
  }
};
```

---

## Testing

### E2E Test Example (Playwright)

```typescript
// tests/e2e/page-objects/LoginPage.ts
export class LoginPage extends BasePage {
  async login(username: string, pin: string): Promise<void> {
    // Select user
    await this.selectUser(username);

    // Enter PIN (auto-submits when 4 digits entered)
    await this.enterPin(pin);
  }

  async enterPin(pin: string): Promise<void> {
    await this.waitForPinEntryScreen();

    for (const digit of pin) {
      const button = this.page.locator(`button:has-text("${digit}")`).first();
      await button.click();
    }

    // Wait for login to complete
    await this.page.waitForTimeout(500);
  }
}
```

### Unit Test Example (Vitest)

```typescript
// Mock window.authAPI
beforeEach(() => {
  global.window = {
    authAPI: {
      verifyPin: vi.fn().mockResolvedValue({ success: true }),
      login: vi.fn(),
      changePin: vi.fn(),
    },
  } as any;
});

test("verifies PIN correctly", async () => {
  const isValid = await verifyManagerPin("user-123", "1234");
  expect(isValid).toBe(true);
  expect(window.authAPI.verifyPin).toHaveBeenCalledWith("user-123", "1234");
});
```

---

## Flow Diagram Summary

### Complete PIN Authentication Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                        │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐           │
│  │ Auth Page  │  │ Lock Screen│  │ Change PIN   │           │
│  │ (Login)    │  │ (Unlock)   │  │ Dialog       │           │
│  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘           │
└────────┼───────────────┼────────────────┼───────────────────┘
         │               │                │
         ▼               ▼                ▼
┌──────────────────────────────────────────────────────────────┐
│                      AUTH CONTEXT                             │
│  • login()    • verifyPin()    • changePin()                 │
│  • User state management                                     │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                    PRELOAD BRIDGE (IPC)                       │
│  window.authAPI → ipcRenderer.invoke()                       │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                    MAIN PROCESS HANDLERS                      │
│  • auth:login          • auth:verifyPin                      │
│  • auth:change-pin     • auth:reset-pin                      │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                      USER MANAGER                             │
│  • authenticateUserByUsernamePin()                           │
│  • verifyPinForUser()                                        │
│  • changeUserPin()                                           │
│  • resetUserPin()                                            │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                          │
│  users table: { pinHash, salt, requiresPinChange }           │
│  bcrypt hashing & verification                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Conclusion

The PIN-based authentication system in AuraSwift EPOS provides:

✅ **Secure authentication** with bcrypt hashing  
✅ **Fast login** with numeric keypad (4 digits)  
✅ **Flexible verification** (login, unlock, approvals)  
✅ **Admin controls** (PIN reset with temporary PIN)  
✅ **Self-service** PIN management  
✅ **Forced PIN changes** for security  
✅ **Audit logging** for compliance

The multi-layer architecture ensures security through:

- Context isolation in Electron
- IPC validation in main process
- bcrypt hashing in database
- Session-based access control
- Permission-based operations

For implementation details, refer to the source files in:

- `packages/renderer/src/features/auth/`
- `packages/preload/src/api/auth.ts`
- `packages/main/src/ipc/auth.handlers.ts`
- `packages/main/src/database/managers/userManager.ts`
