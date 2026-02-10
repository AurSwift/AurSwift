#!/usr/bin/env node

/**
 * Grace Period Test Script
 * 
 * This script tests the grace period logic by:
 * 1. Checking the current license activation status
 * 2. Simulating different grace period scenarios
 * 3. Showing what happens on days 1-10 after web server goes down
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path
const DB_PATH = join(homedir(), 'Library/Application Support/aurswift/pos_system.db');

// Grace period constants (matching the app)
const GRACE_PERIOD_DAYS = 7;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

console.log('🔍 AuraSwift Grace Period Test\n');
console.log('=' .repeat(60));

// Connect to database
let db;
try {
  db = new Database(DB_PATH, { readonly: true });
  console.log(`✅ Connected to database: ${DB_PATH}\n`);
} catch (error) {
  console.error(`❌ Failed to connect to database: ${error.message}`);
  process.exit(1);
}

// Get current license activation
const activation = db.prepare(`
  SELECT 
    id,
    license_key,
    terminal_name,
    plan_name,
    business_name,
    is_active,
    subscription_status,
    activated_at,
    last_heartbeat,
    last_validated_at
  FROM license_activation
  WHERE is_active = 1
  LIMIT 1
`).get();

console.log('📊 Current License Status:\n');

if (!activation) {
  console.log('❌ NO ACTIVE LICENSE FOUND');
  console.log('\nThis means:');
  console.log('  • Either the license was never activated');
  console.log('  • Or it has already been deactivated (possibly due to grace period expiration)');
  console.log('  • Or the desktop app is showing cached UI data\n');
  console.log('Expected Behavior:');
  console.log('  ✅ Desktop app should show LICENSE ACTIVATION SCREEN');
  console.log('  ✅ All other pages should be blocked');
  console.log('  ✅ User cannot access POS features until reactivation\n');
} else {
  // Show license details
  console.log(`License Key: ${activation.license_key}`);
  console.log(`Terminal: ${activation.terminal_name}`);
  console.log(`Plan: ${activation.plan_name}`);
  console.log(`Business: ${activation.business_name || 'N/A'}`);
  console.log(`Status: ${activation.subscription_status}`);
  console.log(`Active: ${activation.is_active ? 'YES' : 'NO'}`);
  
  // Convert timestamps
  const activatedAt = new Date(activation.activated_at);
  const lastHeartbeat = new Date(activation.last_heartbeat);
  const now = new Date();
  
  console.log(`\nActivated: ${activatedAt.toLocaleString()}`);
  console.log(`Last Heartbeat: ${lastHeartbeat.toLocaleString()}`);
  console.log(`Current Time: ${now.toLocaleString()}`);
  
  // Calculate grace period
  const gracePeriodEnd = new Date(lastHeartbeat.getTime() + GRACE_PERIOD_MS);
  const msRemaining = gracePeriodEnd.getTime() - now.getTime();
  const hoursRemaining = msRemaining / (1000 * 60 * 60);
  const daysRemaining = Math.ceil(hoursRemaining / 24);
  
  console.log(`\nGrace Period End: ${gracePeriodEnd.toLocaleString()}`);
  console.log(`Time Remaining: ${hoursRemaining.toFixed(1)} hours (${daysRemaining} days)`);
  
  if (msRemaining > 0) {
    console.log('\n✅ WITHIN GRACE PERIOD');
    console.log(`   Desktop app should work normally for ${daysRemaining} more day(s)`);
    
    if (daysRemaining <= 1) {
      console.log('   ⚠️  WARNING: High alert - less than 24 hours remaining!');
    } else if (daysRemaining <= 3) {
      console.log('   ⚠️  WARNING: Low alert - less than 3 days remaining');
    }
  } else {
    console.log('\n❌ GRACE PERIOD EXPIRED');
    console.log('   Desktop app should show LICENSE ACTIVATION SCREEN');
    console.log('   All features should be blocked until reactivation');
    console.log(`   Expired ${Math.abs(daysRemaining)} day(s) ago`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n📅 Simulation: What Happens Each Day?\n');

// Simulate last heartbeat from 10 days ago to show the progression
const simulationStart = new Date();
simulationStart.setDate(simulationStart.getDate() - 10);

for (let day = 0; day <= 10; day++) {
  const testDate = new Date(simulationStart);
  testDate.setDate(testDate.getDate() + day);
  
  const lastHeartbeat = new Date(simulationStart);
  const gracePeriodEnd = new Date(lastHeartbeat.getTime() + GRACE_PERIOD_MS);
  const msRemaining = gracePeriodEnd.getTime() - testDate.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  
  let status;
  let emoji;
  
  if (msRemaining > 0) {
    if (daysRemaining > 3) {
      emoji = '🟢';
      status = `OK (${daysRemaining} days left)`;
    } else if (daysRemaining > 1) {
      emoji = '🟡';
      status = `WARNING: ${daysRemaining} days left`;
    } else {
      emoji = '🔴';
      status = `CRITICAL: ${daysRemaining} day left!`;
    }
  } else {
    emoji = '❌';
    status = `EXPIRED - BLOCKED (${Math.abs(daysRemaining)} days over)`;
  }
  
  console.log(`Day ${day}: ${emoji} ${status}`);
}

console.log('\n' + '='.repeat(60));
console.log('\n🧪 Testing Recommendations:\n');
console.log('1. Current State Check:');
console.log('   • Open the desktop app');
console.log('   • If license is expired, you should see the activation screen');
console.log('   • You should NOT be able to access dashboard, POS, or other features');
console.log('');
console.log('2. To Test Grace Period Expiration:');
console.log('   Option A - Use System Date (Recommended):');
console.log('     • Activate a new license with web server running');
console.log('     • Note the activation timestamp');
console.log('     • Keep web server OFF for 8+ days');
console.log('     • OR change system date to 8+ days in the future');
console.log('     • Open desktop app - should show activation screen');
console.log('');
console.log('   Option B - Database Manipulation (For Quick Testing):');
console.log('     • Insert a test license with last_heartbeat set to 8 days ago');
console.log('     • Open desktop app - should detect expired grace period');
console.log('     • Should show activation screen immediately');
console.log('');
console.log('3. Expected Behavior After Grace Period Expires:');
console.log('   • Desktop app opens to LICENSE ACTIVATION SCREEN');
console.log('   • All routes are blocked (dashboard, POS, settings, etc.)');
console.log('   • User must enter license key to reactivate');
console.log('   • Once web server is back online, reactivation succeeds');
console.log('');

db.close();
console.log('✅ Test complete\n');
