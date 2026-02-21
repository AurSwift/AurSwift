#!/bin/bash

# Grace Period Testing Menu
# Interactive script to test different grace period scenarios

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="$HOME/Library/Application Support/aurswift/pos_system.db"

clear
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       Aurswift Grace Period Testing Menu                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo "❌ Database not found at: $DB_PATH"
  echo ""
  echo "Please make sure the desktop app has been run at least once"
  echo "to create the database."
  exit 1
fi

# Make scripts executable
chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null

while true; do
  echo ""
  echo "Choose a test scenario:"
  echo ""
  echo "  1) Check current license status"
  echo "  2) Insert expired license (8 days - BLOCKS APP)"
  echo "  3) Insert warning license (2 days left - SHOWS WARNING)"
  echo "  4) Clear all test licenses"
  echo "  5) View testing documentation"
  echo "  6) Exit"
  echo ""
  read -p "Enter choice (1-6): " choice
  
  case $choice in
    1)
      echo ""
      echo "═══════════════════════════════════════════════════════════"
      "$SCRIPT_DIR/test-grace-period.sh"
      echo "═══════════════════════════════════════════════════════════"
      read -p "Press Enter to continue..."
      ;;
    
    2)
      echo ""
      echo "═══════════════════════════════════════════════════════════"
      "$SCRIPT_DIR/insert-expired-license-test.sh"
      echo "═══════════════════════════════════════════════════════════"
      echo ""
      echo "⚠️  IMPORTANT:"
      echo "  • Close the desktop app completely"
      echo "  • Reopen it to see the LICENSE ACTIVATION SCREEN"
      echo "  • All features should be blocked"
      echo ""
      read -p "Press Enter to continue..."
      ;;
    
    3)
      echo ""
      echo "═══════════════════════════════════════════════════════════"
      "$SCRIPT_DIR/insert-grace-period-warning-test.sh"
      echo "═══════════════════════════════════════════════════════════"
      echo ""
      echo "⚠️  IMPORTANT:"
      echo "  • Close the desktop app completely"
      echo "  • Reopen it to see the warning state"
      echo "  • App should work but show '2 days left' warning"
      echo ""
      read -p "Press Enter to continue..."
      ;;
    
    4)
      echo ""
      echo "Clearing all test licenses..."
      sqlite3 "$DB_PATH" "DELETE FROM license_activation WHERE license_key LIKE 'AUR-BAS-V2-TEST%';"
      COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM license_activation WHERE is_active = 1;")
      echo "✅ Test licenses removed"
      echo "Active licenses remaining: $COUNT"
      echo ""
      read -p "Press Enter to continue..."
      ;;
    
    5)
      echo ""
      if [ -f "$SCRIPT_DIR/GRACE_PERIOD_TESTING.md" ]; then
        echo "Opening documentation..."
        open "$SCRIPT_DIR/GRACE_PERIOD_TESTING.md" 2>/dev/null || cat "$SCRIPT_DIR/GRACE_PERIOD_TESTING.md"
      else
        echo "❌ Documentation not found"
      fi
      echo ""
      read -p "Press Enter to continue..."
      ;;
    
    6)
      echo ""
      echo "👋 Goodbye!"
      echo ""
      exit 0
      ;;
    
    *)
      echo ""
      echo "❌ Invalid choice. Please enter 1-6."
      sleep 1
      ;;
  esac
  
  clear
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║       Aurswift Grace Period Testing Menu                 ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
done
