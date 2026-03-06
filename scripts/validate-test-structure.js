import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const root = 'tests'
const allowedTopLevel = new Set([
  'unit',
  'component',
  'integration',
  'e2e',
  'shared',
  'setup.ts',
  'README.md',
])

const vitestPattern = /\.test\.(ts|tsx)$/
const e2ePattern = /\.e2e\.spec\.ts$/
const legacySpecPattern = /\.spec\.(ts|tsx)$/

const issues = []
const testFiles = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      walk(fullPath)
      continue
    }

    if (vitestPattern.test(entry) || e2ePattern.test(entry) || legacySpecPattern.test(entry)) {
      testFiles.push(fullPath)
    }
  }
}

for (const entry of readdirSync(root)) {
  if (!allowedTopLevel.has(entry)) {
    issues.push(`Disallowed top-level tests entry: ${path.join(root, entry)}`)
  }
}

walk(root)

for (const file of testFiles) {
  const normalized = file.split(path.sep).join('/')

  if (legacySpecPattern.test(normalized) && !e2ePattern.test(normalized)) {
    issues.push(`Legacy spec naming is not allowed for Vitest: ${normalized}`)
  }

  if (e2ePattern.test(normalized) && !normalized.startsWith('tests/e2e/specs/')) {
    issues.push(`E2E spec must live under tests/e2e/specs: ${normalized}`)
  }

  if (vitestPattern.test(normalized)) {
    const inAllowedLayer =
      normalized.startsWith('tests/unit/') ||
      normalized.startsWith('tests/component/') ||
      normalized.startsWith('tests/integration/')

    if (!inAllowedLayer) {
      issues.push(`Vitest test must be in unit/component/integration: ${normalized}`)
    }

    if (normalized.startsWith('tests/unit/')) {
      const inAllowedUnitPackage =
        normalized.startsWith('tests/unit/main/') ||
        normalized.startsWith('tests/unit/preload/') ||
        normalized.startsWith('tests/unit/renderer/')
      if (!inAllowedUnitPackage) {
        issues.push(`Unit tests must be in tests/unit/main|preload|renderer: ${normalized}`)
      }
    }

    if (normalized.startsWith('tests/integration/')) {
      const inAllowedIntegrationPackage =
        normalized.startsWith('tests/integration/main/') ||
        normalized.startsWith('tests/integration/preload/') ||
        normalized.startsWith('tests/integration/renderer/')
      if (!inAllowedIntegrationPackage) {
        issues.push(
          `Integration tests must be in tests/integration/main|preload|renderer: ${normalized}`
        )
      }
    }

    if (normalized.startsWith('tests/component/')) {
      const inAllowedComponentArea =
        normalized.startsWith('tests/component/app/') ||
        normalized.startsWith('tests/component/features/') ||
        normalized.startsWith('tests/component/license/')
      if (!inAllowedComponentArea) {
        issues.push(
          `Component tests must be in tests/component/app|features|license: ${normalized}`
        )
      }
    }
  }
}

const requiredDirectories = [
  'tests/unit/main',
  'tests/unit/preload',
  'tests/unit/renderer',
  'tests/integration/main',
  'tests/integration/preload',
  'tests/integration/renderer',
  'tests/component/app',
  'tests/component/features',
  'tests/component/license',
  'tests/e2e/specs',
  'tests/e2e/fixtures',
  'tests/e2e/pages',
  'tests/e2e/support',
  'tests/shared/factories',
  'tests/shared/mocks',
  'tests/shared/utils',
  'tests/shared/fixtures',
]

for (const dir of requiredDirectories) {
  try {
    if (!statSync(dir).isDirectory()) {
      issues.push(`Required directory is not a directory: ${dir}`)
    }
  } catch {
    issues.push(`Missing required directory: ${dir}`)
  }
}

if (issues.length > 0) {
  console.error('Test structure validation failed:\n')
  for (const issue of issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log('Test structure validation passed.')
