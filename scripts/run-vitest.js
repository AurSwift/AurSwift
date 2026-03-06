#!/usr/bin/env node
/**
 * Script to run Vitest with graceful handling of "no tests found" case
 * This allows CI to pass when no unit tests exist yet
 */
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { globSync } from 'glob'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Check if there are any actual Vitest files (not .example files, not Playwright .e2e.spec.ts files)
const testFiles = globSync('tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', {
  cwd: rootDir,
  ignore: ['**/*.example', '**/e2e/**'], // Exclude examples and e2e tests
})

if (testFiles.length === 0) {
  console.log('No unit tests found, skipping...')
  process.exit(0)
}

// Run vitest if test files exist
const vitest = spawn('npx', ['vitest', 'run'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
})

vitest.on('close', code => {
  process.exit(code || 0)
})

vitest.on('error', error => {
  console.error('Failed to run vitest:', error)
  process.exit(1)
})
