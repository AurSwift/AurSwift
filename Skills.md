## 0) What we’re fixing (observed issues)

From the current Operations Overview screen:

- Feels like a generic SaaS web dashboard (title + marketing subtitle, passive KPIs).
- No EPOS command surface (no obvious actions like Sell/Refund/Open Drawer).
- Weak hierarchy: large empty “Recent Transactions” area; EPOS-critical items (Shift/Inventory) feel secondary.
- KPIs lack EPOS-specific operational signals (refunds, voids, overrides, failed payments).
- Too much whitespace, not optimized for desktop density or fast scanning.
- No alert system or exception-driven workflow.

## 1) Product goal

Turn Operations Overview into a **Store Control Center**:

- Glanceable status in 3–5 seconds
- Immediate next actions (operator + manager)
- EPOS-native language (shift, cash, refunds, drawer, exceptions)
- Calm, premium, industry-standard desktop UI

## 2) Page structure (desktop-first)

### 2.1 Header (replace website-style subtitle)

- Title: “Today” or “Store Operations”
- Context chips (instead of paragraph):
  - Store name • Current time • Shift status • Cash status • Last sync
- Global search + notifications + user role

### 2.2 Left Command Rail (EPOS core)

Persistent quick actions:

- Start Sale
- Refund / Return (role gated)
- Open Cash Drawer (role gated)
- Reprint Receipt
- Stock Receive
- Add Product
  Include shortcuts (e.g., F2 Sell, F4 Refund, Ctrl/Cmd+K command palette)

### 2.3 Main Canvas

**A) Live KPIs (EPOS-specific)**

- Revenue today
- Transactions
- Avg basket
- Refunds/Voids today
- Failed payments (or “Exceptions”)
  Each tile includes:
- metric + delta + tiny trend
- click to drill down
- optional small status icon (monochrome)

**B) Recent Activity (replace empty box with real table/feed)**

- Table with: time, type, operator, amount, status, tags (override/refund/void)
- Row actions: View, Reprint, Refund (role gated)
  Empty state includes CTA: “Start a sale” + “Import transactions” (if relevant)

**C) Alerts & Exceptions (high priority)**

- Severity grouped: Critical / Needs attention / Info
- Each item includes recommended action (button)

**D) Shift & Cash (give more importance)**

- Shift Open/Closed
- Cash expected vs counted
- Drawer status
- Actions: Open shift / Cash up / End shift (role gated)

**E) Inventory Health (actionable)**

- Low stock count + top items list
- Out of stock count
- Quick actions: Create PO / Reorder / Mark received

### 2.4 Optional Right Panel (context)

Shows details when selecting an activity row/alert/product.

## 3) Visual design rules (modern + premium)

- Calm neutral surfaces, subtle borders, strong typography hierarchy
- Two density modes: Comfortable + Compact
- Tables should look “serious” (aligned numbers, tabular numerals)
- Avoid big empty cards; prefer structured tables and lists

## 4) Icon strategy (industry standard)

- Default: monochrome line icons (18–20px)
- Color only for semantic meaning (alerts/states) and primary brand accent
- Never use multi-color icons purely for decoration
- Icons always paired with text for primary actions

## 5) Micro-UX + EPOS ergonomics

- Keyboard-first flows (Esc closes, Enter confirms, Ctrl/Cmd+K palette)
- Scanner-friendly focus management (Sell screen)
- Clear destructive confirmations (refund/void needs reason; manager PIN optional)
- Skeleton loading, purposeful empty states, error recovery

## 6) Acceptance criteria

A redesign is accepted only if:

- User can identify store status + top 3 issues in <5 seconds
- Top 5 actions are reachable in ≤1 click from this page
- Recent activity is actionable (not a dead empty section)
- Shift/Cash and Alerts are clearly visible
- UI reads as EPOS control software, not a generic analytics dashboard
