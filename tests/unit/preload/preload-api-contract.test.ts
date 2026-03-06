import { beforeEach, describe, expect, it, vi } from 'vitest'

const exposeInMainWorld = vi.fn()
const invoke = vi.fn()
const on = vi.fn()
const removeListener = vi.fn()
const send = vi.fn()
const removeAllListeners = vi.fn()

async function loadPreloadEntrypoint() {
  vi.resetModules()
  exposeInMainWorld.mockClear()
  invoke.mockClear()
  on.mockClear()
  removeListener.mockClear()
  send.mockClear()
  removeAllListeners.mockClear()

  vi.doMock('electron', () => ({
    contextBridge: { exposeInMainWorld },
    ipcRenderer: {
      invoke,
      on,
      removeListener,
      send,
      removeAllListeners,
    },
    app: {
      getPath: vi.fn(() => '/tmp/test-user-data'),
      getName: vi.fn(() => 'aurswift'),
      getVersion: vi.fn(() => '1.8.0'),
    },
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
      removeHandler: vi.fn(),
    },
  }))

  await import('../../../packages/preload/src/index')
}

describe('preload API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes required APIs on window via contextBridge', async () => {
    await loadPreloadEntrypoint()
    const exposedKeys = exposeInMainWorld.mock.calls.map(([key]) => key)

    expect(exposedKeys).toEqual(
      expect.arrayContaining([
        'authStore',
        'authAPI',
        'timeTrackingAPI',
        'productAPI',
        'categoryAPI',
        'rbacAPI',
        'licenseAPI',
        'appAPI',
        'systemNotificationsAPI',
        'updateAPI',
      ])
    )
  })

  it('exposes API objects with required method shapes', async () => {
    await loadPreloadEntrypoint()
    const exposed = Object.fromEntries(exposeInMainWorld.mock.calls) as Record<string, any>

    expect(exposed.rbacAPI).toEqual(
      expect.objectContaining({
        roles: expect.objectContaining({
          list: expect.any(Function),
          create: expect.any(Function),
          update: expect.any(Function),
          delete: expect.any(Function),
        }),
        userRoles: expect.objectContaining({
          assign: expect.any(Function),
          revoke: expect.any(Function),
          getUserRoles: expect.any(Function),
          setPrimaryRole: expect.any(Function),
        }),
      })
    )

    expect(exposed.licenseAPI).toEqual(
      expect.objectContaining({
        getStatus: expect.any(Function),
        activate: expect.any(Function),
        validate: expect.any(Function),
        deactivate: expect.any(Function),
        onLicenseEvent: expect.any(Function),
      })
    )
  })
})
