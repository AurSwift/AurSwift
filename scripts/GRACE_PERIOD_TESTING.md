# Grace Period Testing Guide

## Overview

This guide explains how to test the **7-day grace period** mechanism that protects users when the web server is down or unreachable.

## How It Works

### Grace Period Logic

1. **Duration**: 7 days from the last successful heartbeat
2. **Tracking**: Stored in SQLite database (`last_heartbeat` field)
3. **Calculation**: `gracePeriodEnd = lastHeartbeat + 7 days`
4. **Enforcement**: Checked on:
   - App startup
   - Every heartbeat attempt
   - Continuous session monitoring (every 15 minutes)

### Warning Levels

| Days Remaining | Status | UI Indicator |
|---------------|--------|--------------|
| 7-4 days | 🟢 OK | Normal operation |
| 3-2 days | 🟡 WARNING | Low alert |
| 1 day | 🔴 CRITICAL | High alert |
| 0 days (expired) | ❌ BLOCKED | Activation screen only |

### What Happens When Grace Period Expires

On day 8+ (after 7 full days without web server):

1. ✅ App detects expired grace period at startup
2. ✅ License is deactivated locally
3. ✅ All routes are blocked
4. ✅ **LICENSE ACTIVATION SCREEN** is shown
5. ✅ User cannot access:
   - Dashboard
   - POS
   - Settings
   - Reports
   - Any other features

## Current Status

Based on your system:

```bash
$ ./scripts/test-grace-period.sh
```

**Result**: ❌ NO ACTIVE LICENSE FOUND

This means:
- Either the license was already deactivated (grace period may have expired)
- Or the desktop app was never activated
- Or the database was cleared

**Expected Behavior**: Desktop app should **already be showing the license activation screen** and blocking all other pages.

## Testing Methods

### Method 1: Manual Testing (Most Realistic)

This tests the real-world scenario:

1. **Start Web Server**
   ```bash
   cd /path/to/web
   npm run dev
   ```

2. **Activate Fresh License**
   - Open desktop app
   - Enter a valid license key
   - Verify activation succeeds

3. **Stop Web Server**
   ```bash
   # Stop the web server and KEEP IT DOWN
   ```

4. **Wait or Fast-Forward Time**
   
   **Option A**: Wait 7+ real days
   - Keep web server down
   - Desktop app will work normally until day 7
   - On day 8, grace period expires
   
   **Option B**: Change system date (faster)
   ```bash
   # macOS: System Settings > General > Date & Time
   # Set date to 8+ days in the future
   
   # Or via command line (requires sudo):
   sudo systemsetup -setdate MM:DD:YYYY
   sudo systemsetup -settime HH:MM:SS
   ```

5. **Test Expiration**
   - Close desktop app completely
   - Reopen desktop app
   - ✅ **Should show LICENSE ACTIVATION SCREEN**
   - ✅ **All pages should be blocked**

6. **Test Reactivation**
   - Start web server again
   - Enter license key in activation screen
   - ✅ Should reactivate successfully

### Method 2: Database Manipulation (Quick Testing)

This simulates an expired license without waiting:

#### Test Expired Grace Period (8 days)

```bash
cd /Users/admin/Documents/Developer/FullStackDev/AuraSwift/desktop
chmod +x scripts/insert-expired-license-test.sh
./scripts/insert-expired-license-test.sh
```

This inserts a test license with `last_heartbeat` set to 8 days ago.

**Expected Result**:
1. Close desktop app
2. Reopen desktop app
3. ✅ **Should show LICENSE ACTIVATION SCREEN**
4. ✅ **All features blocked**

#### Test Grace Period Warning (2 days left)

```bash
cd /Users/admin/Documents/Developer/FullStackDev/AuraSwift/desktop
chmod +x scripts/insert-grace-period-warning-test.sh
./scripts/insert-grace-period-warning-test.sh
```

This inserts a test license with `last_heartbeat` set to 5 days ago (2 days remaining).

**Expected Result**:
1. Close desktop app
2. Reopen desktop app
3. ✅ **App works normally**
4. ✅ **Warning indicators showing "2 days left"**
5. ✅ **Grace period countdown visible in UI**

### Method 3: Verify Current Implementation

Check the grace period logic in code:

```typescript
// Desktop: /packages/main/src/ipc/license.handlers.ts

// Grace period constant (line 40)
const OFFLINE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

// Grace period check function (line 315)
function isWithinGracePeriod(lastHeartbeat: Date | null): boolean {
  if (!lastHeartbeat) return false;
  const gracePeriodEnd = new Date(
    lastHeartbeat.getTime() + OFFLINE_GRACE_PERIOD_MS
  );
  return now < gracePeriodEnd;
}

// Continuous monitoring (line 470)
if (activation && !isWithinGracePeriod(activation.lastHeartbeat)) {
  logger.warn("Grace period expired during long-running session - disabling license");
  await deactivateLocalLicense(activation.id, "grace_period_expired", true);
  emitLicenseEvent("license:disabled", { gracePeriodExpired: true });
  return;
}

// Startup validation (line 1752)
if (!withinGracePeriod) {
  logger.warn("Startup validation failed and grace period expired");
  await deactivateLocalLicense(activation.id);
  return { success: false, isActivated: false };
}
```

## Verification Checklist

Use this checklist to confirm the grace period mechanism works correctly:

### Day 0-6 (Within Grace Period)
- [ ] Desktop app opens normally
- [ ] All features accessible
- [ ] Dashboard loads
- [ ] POS works
- [ ] Grace period indicator shows days remaining
- [ ] Warning level appropriate (green → yellow → red)

### Day 7 (Last Day)
- [ ] App still works
- [ ] Critical warning visible (🔴 "1 day left")
- [ ] User notified to reconnect

### Day 8+ (Grace Period Expired)
- [ ] **Desktop app opens to LICENSE ACTIVATION SCREEN**
- [ ] **Cannot access dashboard**
- [ ] **Cannot access POS**
- [ ] **Cannot access any other features**
- [ ] **All routes blocked except activation**
- [ ] Error message mentions "grace period expired"
- [ ] User must enter license key to continue

### After Reactivation (Web Server Back Online)
- [ ] Can enter license key
- [ ] Activation succeeds
- [ ] All features restored
- [ ] Grace period reset (7 days from now)

## Code Files Involved

### Desktop (Main Process)
- `packages/main/src/ipc/license.handlers.ts` - Core grace period logic
- `packages/main/src/services/licenseService.ts` - Heartbeat handling
- `packages/main/src/database/managers/licenseManager.ts` - Database operations

### Desktop (Renderer)
- `packages/renderer/src/app/App.tsx` - Route blocking logic
- `packages/renderer/src/features/license/context/license-context.tsx` - License state
- `packages/renderer/src/features/license/hooks/use-license.ts` - License hooks
- `packages/renderer/src/features/license/components/license-activation-screen.tsx` - Activation UI

### Web (Server)
- `web/lib/subscription/grace-period-helpers.ts` - Grace period calculations
- `web/app/api/license/heartbeat/route.ts` - Heartbeat endpoint

## Database Schema

```sql
CREATE TABLE license_activation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT NOT NULL,
  machine_id_hash TEXT NOT NULL,
  terminal_name TEXT DEFAULT 'Terminal' NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,
  subscription_status TEXT DEFAULT 'active' NOT NULL,
  activated_at INTEGER NOT NULL,        -- Timestamp in milliseconds
  last_heartbeat INTEGER NOT NULL,      -- 🔑 KEY FIELD for grace period
  last_validated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);
```

The `last_heartbeat` field is **crucial** - it stores the timestamp (in milliseconds) of the last successful heartbeat, which is used to calculate the 7-day grace period.

## Troubleshooting

### Issue: App still works after 8 days

**Possible causes**:
1. Last heartbeat is more recent than expected (check database)
2. System date was changed and reverted
3. Heartbeat succeeded (web server was briefly online)

**Solution**: Check the actual `last_heartbeat` value:
```bash
sqlite3 "$HOME/Library/Application Support/aurswift/pos_system.db" \
  "SELECT license_key, datetime(last_heartbeat/1000, 'unixepoch') as last_hb \
   FROM license_activation WHERE is_active = 1;"
```

### Issue: No active license in database

**Possible causes**:
1. Grace period already expired and license was deactivated
2. Database was cleared
3. License was never activated

**Solution**: 
- Use test scripts to insert a license with desired state
- Or activate a fresh license with web server running

### Issue: Can't test because web server required for activation

**Solution**: 
1. Start web server briefly to activate license
2. Note the activation timestamp
3. Stop web server
4. Use database manipulation to change `last_heartbeat` to 8 days ago
5. Test expiration behavior

## Summary

The grace period mechanism is **properly implemented** and should work as follows:

| Timeline | Web Server | Desktop App Status |
|----------|-----------|-------------------|
| Day 0 | ✅ Online | ✅ Activated, working |
| Day 1-2 | ❌ Down | ✅ Works normally (5-6 days left) |
| Day 3-4 | ❌ Down | ⚠️ Works with warning (3-4 days left) |
| Day 5-6 | ❌ Down | 🔴 Works with critical warning (1-2 days) |
| Day 7 | ❌ Down | 🔴 Last day! (hours left) |
| **Day 8+** | **❌ Down** | **❌ LICENSE SCREEN - BLOCKED** |
| Day 8+ | ✅ Back online | ✅ Can reactivate |

**Key Takeaway**: After 7 full days without successful heartbeat (Day 8, 9, 10, ... nth day), the desktop app **will block all access** and show only the license activation screen until the web server is back online and the user reactivates.

## Test Scripts

All test scripts are in `/desktop/scripts/`:

1. **`test-grace-period.sh`** - Check current license status
2. **`insert-expired-license-test.sh`** - Insert expired license (8 days old)
3. **`insert-grace-period-warning-test.sh`** - Insert warning license (2 days left)

Run them with:
```bash
cd /Users/admin/Documents/Developer/FullStackDev/AuraSwift/desktop
chmod +x scripts/*.sh
./scripts/test-grace-period.sh
```

## References

- **Documentation**: `/docs/License-Subscription/Scenario1:WebServerNotAvailableButEposAppWithLicenseActivatedRunning.md`
- **Grace Period Diagram**: `/docs/License-Subscription/diagrams/grace-period-decision-tree.svg`
- **License Flow**: `/docs/License-Subscription/LICENSE_ACTIVATION_FLOW.md`
