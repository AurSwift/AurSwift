import { expect } from '@playwright/test'

import { test } from '../fixtures/electron.fixture'

test.describe('Hardware integration smoke', () => {
  test('hardware APIs are exposed in renderer', async ({ electronApp }) => {
    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')

    await expect
      .poll(
        async () =>
          page.evaluate(() => ({
            printerAPI: typeof (window as any).printerAPI === 'object',
            paymentAPI: typeof (window as any).paymentAPI === 'object',
            databaseAPI: typeof (window as any).databaseAPI === 'object',
          })),
        { timeout: 20000 }
      )
      .toEqual({ printerAPI: true, paymentAPI: true, databaseAPI: true })
  })

  test('hardware APIs expose expected methods', async ({ electronApp }) => {
    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')

    const methods = await page.evaluate(() => ({
      printer: Object.keys((window as any).printerAPI ?? {}),
      payment: Object.keys((window as any).paymentAPI ?? {}),
    }))

    expect(methods.printer).toEqual(
      expect.arrayContaining(['getStatus', 'connect', 'printReceipt'])
    )
    expect(methods.payment).toEqual(
      expect.arrayContaining(['initializeReader', 'getReaderStatus', 'processCardPayment'])
    )
  })
})
