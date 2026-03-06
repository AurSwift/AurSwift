import { ipcRenderer } from 'electron'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { licenseAPI } from '../../../packages/preload/src/api/license'
import { rbacAPI } from '../../../packages/preload/src/api/rbac'

describe('preload IPC bridge contract', () => {
  const invoke = vi.mocked(ipcRenderer.invoke)

  beforeEach(() => {
    invoke.mockReset()
  })

  it('maps RBAC create payloads to the expected IPC channel', async () => {
    const envelope = {
      success: true,
      data: { id: 'role-1' },
      message: 'Role created',
    }
    const sessionToken = 'session-token'
    const payload = {
      name: 'cashier',
      displayName: 'Cashier',
      businessId: 'business-1',
      permissions: ['sales.read'],
    }

    invoke.mockResolvedValueOnce(envelope)

    const response = await rbacAPI.roles.create(sessionToken, payload)

    expect(invoke).toHaveBeenCalledWith('roles:create', sessionToken, payload)
    expect(response).toEqual(envelope)
  })

  it('maps user role assignment arguments in-order', async () => {
    const envelope = {
      success: true,
      data: { userId: 'user-1', roleId: 'role-1' },
      message: 'Assigned',
    }

    invoke.mockResolvedValueOnce(envelope)

    const response = await rbacAPI.userRoles.assign('session-token', 'user-1', 'role-1')

    expect(invoke).toHaveBeenCalledWith('userRoles:assign', 'session-token', 'user-1', 'role-1')
    expect(response).toEqual(envelope)
  })

  it('preserves the response envelope from IPC handlers', async () => {
    const envelope = {
      success: true,
      data: { plan: 'pro', active: true },
      message: 'License active',
    }

    invoke.mockResolvedValueOnce(envelope)

    await expect(licenseAPI.getStatus()).resolves.toBe(envelope)
    expect(invoke).toHaveBeenCalledWith('license:getStatus')
  })

  it('fails safely by propagating IPC errors to callers', async () => {
    invoke.mockRejectedValueOnce(new Error('IPC backend unavailable'))

    await expect(rbacAPI.roles.list('session-token', 'business-1')).rejects.toThrow(
      'IPC backend unavailable'
    )
  })
})
