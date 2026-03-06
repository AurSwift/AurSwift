import '@testing-library/jest-dom'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { UserRolesList } from '../../../../packages/renderer/src/features/rbac/components/user-roles-list'
import { createMockUserRole } from '../../../shared/factories/rbac.fixture'
import { render, screen, userEvent } from '../../../shared/utils/render-helpers'

describe('UserRolesList', () => {
  it('renders empty state when no roles', () => {
    render(<UserRolesList userRoles={[]} onRevoke={vi.fn()} />)
    expect(screen.getByText('No Roles Assigned')).toBeInTheDocument()
    expect(screen.getByText("This user doesn't have any roles assigned yet.")).toBeInTheDocument()
  })

  it('renders role cards with displayName and revoke button', () => {
    const userRole = createMockUserRole({
      role: {
        id: 'r1',
        name: 'manager',
        displayName: 'Store Manager',
        permissions: ['manage:users'],
      },
    })
    render(<UserRolesList userRoles={[userRole]} onRevoke={vi.fn()} />)
    expect(screen.getByText('Store Manager')).toBeInTheDocument()
    expect(screen.getByText('manager')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /revoke role/i })).toBeInTheDocument()
  })

  it('calls onRevoke with userId and roleId when Revoke clicked', async () => {
    const user = userEvent.setup()
    const onRevoke = vi.fn()
    const userRole = createMockUserRole({
      userId: 'u1',
      roleId: 'r1',
      role: { id: 'r1', name: 'manager', displayName: 'Manager', permissions: [] },
    })
    render(<UserRolesList userRoles={[userRole]} onRevoke={onRevoke} />)
    await user.click(screen.getByRole('button', { name: /revoke role/i }))
    expect(onRevoke).toHaveBeenCalledWith('u1', 'r1')
  })

  it('disables revoke button when isRevoking', () => {
    const userRole = createMockUserRole({
      role: { id: 'r1', name: 'r', displayName: 'R', permissions: [] },
    })
    render(<UserRolesList userRoles={[userRole]} onRevoke={vi.fn()} isRevoking={true} />)
    expect(screen.getByRole('button', { name: /revoking/i })).toBeDisabled()
  })
})
