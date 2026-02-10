#!/bin/bash

# Script to insert a test license with expired grace period
# This allows quick testing of the grace period expiration mechanism

DB_PATH="$HOME/Library/Application Support/aurswift/pos_system.db"

echo "🧪 Insert Expired License Test Data"
echo ""
echo "This script will insert a test license with an expired grace period"
echo "to demonstrate the blocking mechanism."
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo "❌ Database not found at: $DB_PATH"
  exit 1
fi

# Calculate timestamps
NOW_MS=$(date +%s)000
ACTIVATED_MS=$(( NOW_MS - (10 * 24 * 60 * 60 * 1000) ))  # 10 days ago
LAST_HEARTBEAT_MS=$(( NOW_MS - (8 * 24 * 60 * 60 * 1000) ))  # 8 days ago (expired!)

echo "Current time: $(date)"
echo "Simulated activation: $(date -r $(( ACTIVATED_MS / 1000 )))"
echo "Simulated last heartbeat: $(date -r $(( LAST_HEARTBEAT_MS / 1000 )))"
echo "Grace period (7 days) expired: $(date -r $(( (LAST_HEARTBEAT_MS / 1000) + (7 * 24 * 60 * 60) )))"
echo ""

# Check if there's already an active license
EXISTING=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM license_activation WHERE is_active = 1;")

if [ "$EXISTING" -gt 0 ]; then
  echo "⚠️  Found $EXISTING active license(s) in database"
  echo ""
  read -p "Do you want to deactivate them and insert test data? (y/n): " -n 1 -r
  echo ""
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
  fi
  
  # Deactivate existing licenses
  sqlite3 "$DB_PATH" "UPDATE license_activation SET is_active = 0;"
  echo "✅ Deactivated existing licenses"
fi

# Insert test license with expired grace period
echo ""
echo "Inserting test license..."

sqlite3 "$DB_PATH" <<EOF
INSERT INTO license_activation (
  license_key,
  machine_id_hash,
  terminal_name,
  activation_id,
  plan_id,
  plan_name,
  max_terminals,
  features,
  business_name,
  is_active,
  subscription_status,
  expires_at,
  trial_end,
  activated_at,
  last_heartbeat,
  last_validated_at,
  created_at,
  updated_at
) VALUES (
  'AUR-BAS-V2-TEST1234-EXPIRED8',
  'test_machine_hash_001',
  'Test Terminal - Expired Grace',
  'test_activation_001',
  'basic_monthly',
  'Basic Plan',
  1,
  '["single_terminal","basic_reporting","sales_processing"]',
  'Test Business - Expired',
  1,
  'active',
  NULL,
  NULL,
  $ACTIVATED_MS,
  $LAST_HEARTBEAT_MS,
  $LAST_HEARTBEAT_MS,
  $NOW_MS,
  $NOW_MS
);
EOF

if [ $? -eq 0 ]; then
  echo "✅ Test license inserted successfully!"
  echo ""
  echo "License Details:"
  echo "  • License Key: AUR-BAS-V2-TEST1234-EXPIRED8"
  echo "  • Last Heartbeat: 8 days ago (GRACE PERIOD EXPIRED)"
  echo "  • Status: Should trigger license activation screen"
  echo ""
  echo "📱 Next Steps:"
  echo "  1. Close the desktop app completely (if running)"
  echo "  2. Reopen the desktop app"
  echo "  3. ✅ You should see the LICENSE ACTIVATION SCREEN"
  echo "  4. ✅ All pages should be blocked"
  echo "  5. ✅ Cannot access dashboard, POS, or other features"
  echo ""
  echo "To remove this test data, run:"
  echo "  sqlite3 \"$DB_PATH\" \"DELETE FROM license_activation WHERE license_key='AUR-BAS-V2-TEST1234-EXPIRED8';\""
  echo ""
else
  echo "❌ Failed to insert test license"
  exit 1
fi
