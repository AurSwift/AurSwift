# Transaction Workflow - Quick Reference Guide

**For Cashiers**  
**Last Updated:** November 5, 2025

---

## 🚀 QUICK START (30 Seconds)

1. **Start Transaction** → Click "New Transaction"
2. **Add Items** → Scan barcodes or click products
3. **Checkout** → Click "Checkout" button
4. **Select Payment** → Click "Cash"
5. **Enter Amount** → Type cash received
6. **Complete** → Click "Complete Transaction"
7. **Receipt Prints** → HP LaserJet prints automatically

---

## 📊 VISUAL WORKFLOW

```
┌──────────────────────────────────────────────────────────┐
│                    START NEW TRANSACTION                   │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│              ADD ITEMS TO CART (Multiple Ways)             │
├──────────────────────────────────────────────────────────┤
│  Option A: Scan Barcode → Auto-adds to cart               │
│  Option B: Click Product Card → Adds to cart              │
│  Option C: Search by Name → Click result                  │
│  Option D: Manual Entry → Enter PLU/SKU                   │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│                    REVIEW CART                             │
├──────────────────────────────────────────────────────────┤
│  • Check items and quantities                              │
│  • Adjust quantities (+/-)                                 │
│  • Remove items if needed                                  │
│  • View totals: Subtotal, Tax, TOTAL                      │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│               CLICK "CHECKOUT" BUTTON                      │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│                SELECT PAYMENT METHOD                       │
├──────────────────────────────────────────────────────────┤
│  [  Cash  ]  [  Card  ]  [  Mobile  ]  [  Voucher  ]     │
└────────────────┬──────────────────────────────────────────┘
                 │
            ┌────┴─────┐
            │          │
         CASH        CARD
            │          │
            ▼          ▼
   ┌────────────┐  ┌────────────┐
   │ Enter Cash │  │ Tap/Insert │
   │  Amount    │  │   Card     │
   └──────┬─────┘  └──────┬─────┘
          │                │
          └────────┬───────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│          CLICK "COMPLETE TRANSACTION"                      │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│                  SYSTEM PROCESSING                         │
├──────────────────────────────────────────────────────────┤
│  1. ✓ Validate payment amount                             │
│  2. ✓ Save transaction to database                        │
│  3. ✓ Generate PDF receipt                                │
│  4. ✓ Send to HP LaserJet printer                         │
│  5. ✓ Print receipt                                        │
│  6. ✓ Update shift statistics                             │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│              ✅ TRANSACTION COMPLETE!                     │
├──────────────────────────────────────────────────────────┤
│  • Show change amount (if cash)                            │
│  • Receipt printing...                                     │
│  • Auto-reset for next customer                            │
└──────────────────────────────────────────────────────────┘
```

---

## 💵 CASH PAYMENT PROCESS

```
1. Customer Total: £15.39
   ↓
2. Cashier enters: £20.00
   ↓
3. System calculates change: £4.61
   ↓
4. Shows on screen: "Change: £4.61"
   ↓
5. Cashier gives change to customer
   ↓
6. Receipt prints with change amount
   ↓
7. Done! ✅
```

### Quick Cash Buttons

```
┌────────┬────────┬────────┬────────┐
│  £5    │  £10   │  £20   │  £50   │
└────────┴────────┴────────┴────────┘
┌───────────────────┬───────────────────┐
│   Exact Amount    │    Round Up       │
└───────────────────┴───────────────────┘
```

- Click **£10** if customer gives £10 note
- Click **Exact Amount** if customer has exact change
- Click **Round Up** to round to next £ (e.g., £15.39 → £16.00)

---

## 🖨️ RECEIPT PRINTING FLOW

```
Transaction Complete
       ↓
Generate PDF Receipt (< 1 second)
       ↓
Send to HP LaserJet (< 1 second)
       ↓
Print Job Queued
       ↓
Printing... (3-5 seconds)
       ↓
Receipt Ready! ✅

If printing fails:
       ↓
Show error message
       ↓
Offer options:
  • Retry Print
  • Email Receipt
  • Skip (reprint later)
```

---

## 🔍 COMMON SCENARIOS

### Scenario 1: Simple Purchase (1 item)

```
1. Scan: Coca Cola (£1.50)
2. Subtotal: £1.50
3. Tax: £0.12
4. Total: £1.62
5. Cash: £2.00
6. Change: £0.38
7. Print receipt
8. Done!
```

### Scenario 2: Multiple Items

```
1. Scan: Coca Cola × 2 (£3.00)
2. Scan: White Bread (£1.20)
3. Scan: Apples 1.5kg (£4.49)
4. Subtotal: £8.69
5. Tax: £0.70
6. Total: £9.39
7. Cash: £10.00
8. Change: £0.61
9. Print receipt
10. Done!
```

### Scenario 3: Weight-Based Product

```
1. Scan: Apples (requires weight)
2. System prompts: "Enter weight in kg"
3. Cashier enters: 1.50
4. Price calculated: 1.50 × £2.99/kg = £4.49
5. Added to cart
6. Continue as normal
```

### Scenario 4: Remove/Edit Item

```
1. Added wrong item
2. Click 🗑️ (trash icon) on item
3. Item removed from cart
4. Total recalculated
5. Continue
```

---

## ⚡ KEYBOARD SHORTCUTS

| Action               | Shortcut           |
| -------------------- | ------------------ |
| Focus barcode input  | F1                 |
| Checkout             | F2                 |
| Cash payment         | F3                 |
| Card payment         | F4                 |
| Complete transaction | Enter (when ready) |
| Cancel/Back          | Esc                |

---

## 🚨 ERROR HANDLING

### "Printer Not Found"

**Solution:**

1. Check printer is powered on
2. Check USB/network cable connected
3. Click "Refresh Printers"
4. If still not found, contact supervisor

### "Insufficient Cash"

**Solution:**

- Entered amount must be ≥ total
- Check amount entered correctly
- Button shows: "Need £X.XX More"

### "No Active Shift"

**Solution:**

- You must start shift before processing transactions
- Click "Start Shift" from dashboard
- Enter starting cash amount

### "Receipt Print Failed"

**Options:**

1. Click "Retry Print" (automatic 3 attempts)
2. Transaction already saved - can reprint later
3. Click "Email Receipt" to send to customer
4. Click "Skip" and manually reprint from history

---

## 📱 SCREEN LAYOUT

```
┌─────────────────────────────────────────────────────────┐
│                    TRANSACTION VIEW                       │
├──────────────────────────────┬───────────────────────────┤
│                              │                            │
│   PRODUCT GRID/SEARCH        │      SHOPPING CART         │
│                              │                            │
│  [Product 1] [Product 2]     │  Item 1  Qty: 2  £3.00   │
│  [Product 3] [Product 4]     │  Item 2  Qty: 1  £1.20   │
│  [Product 5] [Product 6]     │                           │
│                              │  ─────────────────────────│
│  Search: [________]          │  Subtotal:        £4.20   │
│                              │  Tax (8%):        £0.34   │
│  Categories:                 │  TOTAL:           £4.54   │
│  • All                       │                           │
│  • Beverages                 │  [ CHECKOUT ]             │
│  • Food                      │                           │
│  • Snacks                    │  ─────────────────────────│
│                              │  PAYMENT:                 │
│                              │  [Cash] [Card] [Mobile]   │
│                              │                           │
│                              │  Cash: £______            │
│                              │  Change: £____            │
│                              │                           │
│                              │  [ COMPLETE ]             │
└──────────────────────────────┴───────────────────────────┘
```

---

## ✅ BEFORE YOU START

**Daily Checklist:**

- [ ] HP LaserJet printer powered on
- [ ] Printer has paper loaded
- [ ] Test print (optional) working
- [ ] Started shift (entered starting cash)
- [ ] Card reader connected (if using)
- [ ] Barcode scanner ready
- [ ] Cash drawer accessible

---

## 📞 NEED HELP?

**Common Questions:**

**Q: How do I void a transaction?**
A: Go to Dashboard → Void Transaction → Select receipt → Enter reason

**Q: How do I reprint a receipt?**
A: Go to Transaction History → Find transaction → Click "Reprint"

**Q: Customer wants refund?**
A: Go to Dashboard → Refund → Scan receipt or enter number

**Q: Cash drawer won't open?**
A: Complete cash transaction → Drawer opens automatically OR click "Open Drawer" button

**Q: How do I end my shift?**
A: Dashboard → End Shift → Count cash → Enter final amount

---

## 📋 RECEIPT SAMPLE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Aurswift POS SYSTEM
   123 Main Street, London
     Phone: 020-1234-5678
      VAT: GB123456789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECEIPT: #RCP-1730891234567
Date: 05/11/2025  Time: 14:30
Cashier: John Smith
Transaction ID: TXN-123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ITEMS
─────────────────────────────────
Coca Cola 330ml
  2 x £1.50                £3.00
  SKU: DRINK-001

Fresh Apples
  Weight: 1.50 kg
  1 x £2.99/kg             £4.49
  SKU: FRUIT-002

White Bread 800g
  1 x £1.20                £1.20
─────────────────────────────────
Subtotal:                  £8.69
Tax (8%):                  £0.70
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                     £9.39
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT: CASH
Cash Received:            £10.00
Change:                    £0.61
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Thank you for shopping!
  Keep this receipt for returns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 TIPS FOR SPEED

1. **Use barcode scanner** - Fastest method
2. **Learn product locations** - Find items quickly
3. **Use quick cash buttons** - Faster than typing
4. **Keep workspace organized** - Less searching
5. **Master keyboard shortcuts** - F2 for checkout
6. **Prepare next transaction while printing** - Multitask

**Target Speed:** 1-2 minutes per customer

---

**Need detailed technical documentation?**  
See: [CASHIER_TRANSACTION_WORKFLOW.md](./CASHIER_TRANSACTION_WORKFLOW.md)

**Printer issues?**  
See: [HP_LASERJET_ANALYSIS.md](./HP_LASERJET_ANALYSIS.md)
