import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

import type { FullConfig } from '@playwright/test'
import { globSync } from 'glob'

function ensureDirectory(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function hasBuiltExecutable(): boolean {
  const executableCandidates = [
    'dist/**/*.exe',
    'dist/**/*.app',
    'dist/**/aurswift*',
    'out/**/*.exe',
    'out/**/*.app',
    'release/**/*.exe',
    'release/**/*.app',
    'dist/main.js',
    'out/main.js',
    'packages/main/dist/index.js',
  ]

  return executableCandidates.some(candidate => {
    if (candidate.includes('*')) {
      return globSync(candidate, { nodir: true }).length > 0
    }
    return existsSync(candidate)
  })
}

function validateLaunchTarget(): void {
  const forcedEntrypoint = process.env.PLAYWRIGHT_E2E_ENTRYPOINT
  if (forcedEntrypoint) {
    if (!existsSync(forcedEntrypoint)) {
      throw new Error(
        `[playwright global-setup] PLAYWRIGHT_E2E_ENTRYPOINT does not exist: ${forcedEntrypoint}`
      )
    }
    return
  }

  const sourceEntrypoint = 'packages/entry-point.mjs'
  if (existsSync(sourceEntrypoint)) {
    return
  }

  if (hasBuiltExecutable()) {
    return
  }

  throw new Error(
    [
      '[playwright global-setup] No valid Electron launch target found.',
      `Expected source entrypoint: ${sourceEntrypoint}`,
      'Or a built artifact under dist/out/release.',
      'Fix by running `npm run build` or ensure the app entrypoint exists.',
    ].join('\n')
  )
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  process.env.PLAYWRIGHT_TEST ??= 'true'
  process.env.NODE_ENV ??= 'test'
  process.env.ELECTRON_DISABLE_GPU ??= '1'
  process.env.ELECTRON_NO_SANDBOX ??= '1'

  validateLaunchTarget()

  ensureDirectory(path.join('test-outputs', 'e2e'))
  ensureDirectory(path.join('test-outputs', 'e2e', 'html'))
  ensureDirectory(path.join('test-outputs', 'e2e', 'artifacts'))
}
