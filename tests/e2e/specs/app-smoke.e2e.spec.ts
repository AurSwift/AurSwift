import { expect } from '@playwright/test'

import { test } from '../fixtures/electron.fixture'

test.beforeEach(async ({ electronApp }) => {
  const page = await electronApp.firstWindow()
  await page.waitForLoadState('domcontentloaded')

  await page.evaluate(async () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      // ignore storage cleanup errors in constrained environments
    }

    try {
      if ((window as any).authAPI?.logout) {
        await (window as any).authAPI.logout()
      }
    } catch {
      // ignore logout failures in pre-auth launch states
    }
  })
})

test('startup completes and reaches auth or dashboard route', async ({ electronApp }) => {
  const page = await electronApp.firstWindow()
  await page.reload({ waitUntil: 'domcontentloaded' })

  const startupScreen = page.getByTestId('startup-screen')
  await startupScreen.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined)

  const authOrDashboard = page
    .getByTestId('auth-page')
    .or(page.getByTestId('command-center-dashboard'))
  await expect(authOrDashboard).toBeVisible({ timeout: 15000 })
})

test('preload exposes required POS API surface', async ({ electronApp }) => {
  const page = await electronApp.firstWindow()
  await page.waitForLoadState('domcontentloaded')

  const preloadContract = await page.evaluate(() => {
    const requiredObjects = [
      'authAPI',
      'authStore',
      'productAPI',
      'transactionAPI',
      'printerAPI',
      'paymentAPI',
      'databaseAPI',
      'rbacAPI',
    ]

    const authMethods = ['login', 'validateSession', 'logout']

    return {
      missingObjects: requiredObjects.filter(key => typeof (window as any)[key] !== 'object'),
      missingAuthMethods: authMethods.filter(
        method => typeof (window as any).authAPI?.[method] !== 'function'
      ),
    }
  })

  expect(preloadContract.missingObjects).toEqual([])
  expect(preloadContract.missingAuthMethods).toEqual([])
})

test('main window is visible and renderer is not crashed', async ({ electronApp }) => {
  const page = await electronApp.firstWindow()
  const window = await electronApp.browserWindow(page)

  const windowState = await window.evaluate(mainWindow => ({
    isVisible: mainWindow.isVisible(),
    isCrashed: mainWindow.webContents.isCrashed(),
  }))

  expect(windowState.isVisible).toBe(true)
  expect(windowState.isCrashed).toBe(false)
})
