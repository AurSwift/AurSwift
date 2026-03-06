import type { FullConfig } from '@playwright/test'

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  // Intentionally light teardown: artifacts are retained for debugging.
}
