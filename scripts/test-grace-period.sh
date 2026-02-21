#!/bin/bash

# Grace Period Test Script
# Tests the grace period logic for Aurswift desktop app

DB_PATH="$HOME/Library/Application Support/aurswift/pos_system.db"
GRACE_PERIOD_DAYS=7

echo "🔍 Aurswift Grace Period Test"
echo ""
echo "============================================================"
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo "❌ Database not found at: $DB_PATH"
  exit 1
fi

echo "✅ Connected to database: $DB_PATH"
echo ""

# Get current license activation
echo "📊 Current License Status:"
echo ""

LICENSE_DATA=$(sqlite3 "$DB_PATH" "SELECT license_key, terminal_name, plan_name, business_name, is_active, subscription_status, activated_at, last_heartbeat FROM license_activation WHERE is_active = 1 LIMIT 1;")

if [ -z "$LICENSE_DATA" ]; then
  echo "❌ NO ACTIVE LICENSE FOUND"
  echo ""
  echo "This means:"
  echo "  • Either the license was never activated"
  echo "  • Or it has already been deactivated (possibly due to grace period expiration)"
  echo "  • Or the desktop app database was cleared"
  echo ""
  echo "Expected Behavior:"
  echo "  ✅ Desktop app should show LICENSE ACTIVATION SCREEN"
  echo "  ✅ All other pages should be blocked"
  echo "  ✅ User cannot access POS features until reactivation"
  echo ""
else
  IFS='|' read -r LICENSE_KEY TERMINAL PLAN BUSINESS IS_ACTIVE STATUS ACTIVATED LAST_HEARTBEAT <<< "$LICENSE_DATA"
  
  echo "License Key: $LICENSE_KEY"
  echo "Terminal: $TERMINAL"
  echo "Plan: $PLAN"
  echo "Business: ${BUSINESS:-N/A}"
  echo "Status: $STATUS"
  echo "Active: $([ "$IS_ACTIVE" = "1" ] && echo "YES" || echo "NO")"
  echo ""
  
  # Convert timestamps (milliseconds to seconds for date command)
  ACTIVATED_SEC=$((ACTIVATED / 1000))
  LAST_HEARTBEAT_SEC=$((LAST_HEARTBEAT / 1000))
  NOW_SEC=$(date +%s)
  
  echo "Activated: $(date -r $ACTIVATED_SEC)"
  echo "Last Heartbeat: $(date -r $LAST_HEARTBEAT_SEC)"
  echo "Current Time: $(date)"
  echo ""
  
  # Calculate grace period
  GRACE_PERIOD_SEC=$((GRACE_PERIOD_DAYS * 24 * 60 * 60))
  GRACE_PERIOD_END_SEC=$((LAST_HEARTBEAT_SEC + GRACE_PERIOD_SEC))
  REMAINING_SEC=$((GRACE_PERIOD_END_SEC - NOW_SEC))
  REMAINING_HOURS=$((REMAINING_SEC / 3600))
  REMAINING_DAYS=$(( (REMAINING_SEC + 86399) / 86400 ))  # Round up
  
  echo "Grace Period End: $(date -r $GRACE_PERIOD_END_SEC)"
  echo "Time Remaining: $REMAINING_HOURS hours ($REMAINING_DAYS days)"
  echo ""
  
  if [ $REMAINING_SEC -gt 0 ]; then
    echo "✅ WITHIN GRACE PERIOD"
    echo "   Desktop app should work normally for $REMAINING_DAYS more day(s)"
    
    if [ $REMAINING_DAYS -le 1 ]; then
      echo "   ⚠️  WARNING: High alert - less than 24 hours remaining!"
    elif [ $REMAINING_DAYS -le 3 ]; then
      echo "   ⚠️  WARNING: Low alert - less than 3 days remaining"
    fi
  else
    DAYS_EXPIRED=$(( (-REMAINING_SEC + 86399) / 86400 ))
    echo "❌ GRACE PERIOD EXPIRED"
    echo "   Desktop app should show LICENSE ACTIVATION SCREEN"
    echo "   All features should be blocked until reactivation"
    echo "   Expired $DAYS_EXPIRED day(s) ago"
  fi
fi

echo ""
echo "============================================================"
echo ""
echo "📅 Simulation: What Happens Each Day?"
echo ""
echo "If last heartbeat was 10 days ago and web server stays down:"
echo ""

# Simulate progression
for DAY in {0..10}; do
  DAYS_LEFT=$((GRACE_PERIOD_DAYS - DAY))
  
  if [ $DAYS_LEFT -gt 3 ]; then
    echo "Day $DAY: 🟢 OK ($DAYS_LEFT days left)"
  elif [ $DAYS_LEFT -gt 1 ]; then
    echo "Day $DAY: 🟡 WARNING: $DAYS_LEFT days left"
  elif [ $DAYS_LEFT -ge 0 ]; then
    if [ $DAYS_LEFT -eq 0 ]; then
      echo "Day $DAY: 🔴 CRITICAL: Last day!"
    else
      echo "Day $DAY: 🔴 CRITICAL: $DAYS_LEFT day left!"
    fi
  else
    DAYS_OVER=$((-DAYS_LEFT))
    echo "Day $DAY: ❌ EXPIRED - BLOCKED ($DAYS_OVER days over)"
  fi
done

echo ""
echo "============================================================"
echo ""
echo "🧪 How to Test Grace Period Expiration:"
echo ""
echo "METHOD 1: Manual Testing (Most Realistic)"
echo "  1. Make sure web server is running"
echo "  2. Activate a fresh license in desktop app"
echo "  3. Stop the web server and keep it down"
echo "  4. Wait 7 days (or change system date to +8 days)"
echo "  5. Open desktop app"
echo "  6. ✅ Should show LICENSE ACTIVATION SCREEN"
echo "  7. ✅ All pages should be blocked"
echo ""
echo "METHOD 2: Database Manipulation (Quick Testing)"
echo "  1. Create a test license with last_heartbeat set to 8 days ago"
echo "  2. Open desktop app"
echo "  3. ✅ Should detect expired grace period immediately"
echo ""
echo "CURRENT STATE:"
if [ -z "$LICENSE_DATA" ]; then
  echo "  • No active license found in database"
  echo "  • Desktop app should already be showing activation screen"
  echo "  • If you see the screenshot you shared, it might be cached UI"
else
  echo "  • License is active in database"
  echo "  • Check the status above to see if grace period is valid"
fi
echo ""
echo "✅ Test complete"
echo ""
