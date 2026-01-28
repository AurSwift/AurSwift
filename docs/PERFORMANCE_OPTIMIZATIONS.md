# Performance Optimizations

This document tracks performance issues identified and resolved in the AuraSwift desktop application, focusing on startup time and initialization optimizations.

## Overview

Performance optimizations are critical for providing a responsive user experience, especially during application startup. This document details specific issues found, their impact, and the solutions implemented.

---

## 1. Sequential Service Imports at Startup (Blocking Main Process) 🔴

### Problem

**File:** `packages/main/src/index.ts`

**Issue:** Six hardware services were being loaded sequentially using `await import()`, causing each import to block the next one. This sequential loading pattern significantly delayed application startup time.

**Original Code:**
```typescript
// Initialize thermal printer service after database is ready
await import("./services/thermalPrinterService.js");

// Initialize office printer service for HP LaserJet and similar printers
await import("./services/officePrinterService.js");

// Initialize PDF receipt generation service
await import("./services/pdfReceiptService.js");

// Initialize payment service for BBPOS WisePad 3
await import("./services/paymentService.js");

// Initialize scale hardware service for weight measurement
await import("./services/scaleService.js");

// Initialize Viva Wallet service for payment terminal integration
await import("./services/vivaWallet/index.js");
```

**Impact:**
- Each service import blocks the next import
- Total startup time = sum of all individual import times
- No parallelism, wasting CPU and I/O resources
- Delayed application readiness

### Solution

**Approach:** Load all independent hardware services in parallel using `Promise.all()`.

**Fixed Code:**
```typescript
// Load hardware services in parallel - they're independent
await Promise.all([
  import("./services/thermalPrinterService.js"),
  import("./services/officePrinterService.js"),
  import("./services/pdfReceiptService.js"),
  import("./services/paymentService.js"),
  import("./services/scaleService.js"),
  import("./services/vivaWallet/index.js"),
]);
```

**Benefits:**
- All services load concurrently instead of sequentially
- Total startup time ≈ longest individual import time (not sum)
- Better CPU and I/O utilization
- Faster application initialization

**Why This Works:**
- These services are independent hardware modules with no interdependencies
- They can safely initialize in parallel without race conditions
- `Promise.all()` waits for all imports to complete before proceeding
- Database initialization (which happens before this) ensures shared dependencies are ready

**Location:** `packages/main/src/index.ts` (lines 101-109)

---

## 2. Menu.setApplicationMenu() Called After app.whenReady() 🟡

### Problem

**File:** `packages/main/src/modules/WindowManager.ts`

**Issue:** According to Electron documentation, `Menu.setApplicationMenu()` should be called **before** `app.on("ready")` to prevent Electron from building the default application menu. The original code was setting the menu after `app.whenReady()`, causing Electron to waste time constructing a default menu that would immediately be replaced.

**Original Code:**
```typescript
async enable({ app }: ModuleContext): Promise<void> {
  await app.whenReady();  // ← Menu setup happens AFTER ready
  this.createApplicationMenu();
  // ...
}
```

**Impact:**
- Electron builds the default menu during app initialization
- Default menu is immediately discarded when custom menu is set
- Wasted CPU cycles and memory allocation
- Slight delay in application startup

### Solution

**Approach:** Set the application menu to `null` before `app.whenReady()` in the entry point, preventing Electron from building the default menu.

**Fixed Code:**

**Entry Point (`packages/entry-point.mjs`):**
```javascript
import { app, Menu } from "electron";

// Disable hardware acceleration before app is ready
// This must be called before any other app initialization
app.disableHardwareAcceleration();

// Prevent Electron from building the default menu; WindowManager sets a custom menu after ready
Menu.setApplicationMenu(null);
```

**WindowManager (`packages/main/src/modules/WindowManager.ts`):**
```typescript
async enable({ app }: ModuleContext): Promise<void> {
  await app.whenReady();
  
  // Create minimal application menu with update checking
  // This replaces the null menu set in entry-point.mjs
  this.createApplicationMenu();
  
  // ...
}
```

**Benefits:**
- Electron skips building the default menu entirely
- No wasted CPU cycles or memory allocation
- Faster application initialization
- Custom menu is set immediately after app is ready

**Why This Works:**
- Setting `Menu.setApplicationMenu(null)` before `app.whenReady()` tells Electron not to create a default menu
- The custom menu is still created by `WindowManager.createApplicationMenu()` after the app is ready
- This follows Electron's recommended pattern for custom menu setup
- The null menu is a lightweight placeholder that prevents default menu construction

**Locations:**
- `packages/entry-point.mjs` (line 18)
- `packages/main/src/modules/WindowManager.ts` (unchanged - still creates custom menu after ready)

---

## Performance Impact Summary

### Before Optimizations
- **Service Loading:** Sequential (sum of all import times)
- **Menu Setup:** Default menu built, then replaced
- **Startup Time:** Slower due to blocking operations

### After Optimizations
- **Service Loading:** Parallel (longest import time)
- **Menu Setup:** No default menu built
- **Startup Time:** Faster, more efficient initialization

### Estimated Improvements
- **Service Loading:** ~60-80% reduction in initialization time (depending on number of services)
- **Menu Setup:** Eliminated unnecessary default menu construction
- **Overall Startup:** Noticeably faster application launch

---

## Best Practices Applied

1. **Parallel Loading:** Use `Promise.all()` for independent async operations
2. **Early Initialization:** Set Electron configuration before `app.whenReady()`
3. **Avoid Unnecessary Work:** Prevent Electron from building UI elements that will be replaced
4. **Documentation:** Document performance optimizations for future reference

---

## Future Considerations

When adding new services or initialization code:

1. **Evaluate Dependencies:** Determine if services can load in parallel
2. **Check Electron Lifecycle:** Ensure configuration happens at the right time
3. **Measure Impact:** Profile startup time before and after changes
4. **Document Changes:** Update this document with new optimizations

---

## Related Files

- `packages/main/src/index.ts` - Main process initialization
- `packages/entry-point.mjs` - Application entry point
- `packages/main/src/modules/WindowManager.ts` - Window and menu management

---

## References

- [Electron Menu API Documentation](https://www.electronjs.org/docs/latest/api/menu)
- [Electron App Lifecycle](https://www.electronjs.org/docs/latest/tutorial/lifecycle)
- [Promise.all() MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

---

*Last Updated: January 28, 2026*
