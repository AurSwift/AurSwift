import '@testing-library/jest-dom'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StartupScreen } from '../../../packages/renderer/src/app/startup/startup-screen'
import { STARTUP_PROGRESS_DURATION_MS } from '../../../packages/renderer/src/app/startup/startup.constants'
import type { StartupState } from '../../../packages/renderer/src/app/startup/startup.types'
import { render, screen } from '../../shared/utils/render-helpers'

function createState(overrides: Partial<StartupState> = {}): StartupState {
  return {
    phase: 'starting-services',
    progress: 45,
    isBlocking: true,
    warning: null,
    startedAt: Date.now(),
    completedAt: null,
    ...overrides,
  }
}

describe('StartupScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders phase label and progress bar values', () => {
    vi.setSystemTime(0)
    const startedAt = 0
    const elapsedFor45Percent = (STARTUP_PROGRESS_DURATION_MS * 45) / 100
    vi.advanceTimersByTime(elapsedFor45Percent)

    render(<StartupScreen state={createState({ startedAt })} />)

    expect(screen.getByTestId('startup-screen')).toBeInTheDocument()
    expect(screen.getByTestId('startup-phase-label')).toHaveTextContent('Starting AurSwiftEpos')
    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByTestId('startup-progress-fill')).toHaveStyle('transform: scaleX(0.45)')
  })

  it('includes reduced-motion fallback styles', () => {
    render(<StartupScreen state={createState()} />)

    expect(screen.getByTestId('startup-motion-styles')).toHaveTextContent(
      'prefers-reduced-motion: reduce'
    )
  })

  it('provides accessible startup status semantics', () => {
    render(<StartupScreen state={createState({ phase: 'restoring-session' })} />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('aria-label', 'Epos Now startup in progress')
    expect(screen.getByAltText('Epos Now logo')).toBeInTheDocument()
  })
})
