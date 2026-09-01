/**
 * SettingsPanel.test.tsx
 *
 * Component tests for SettingsPanel
 * (client/src/components/ui/SettingsPanel) and its wiring through Page.
 *
 * SettingsPanel is the popover behind the top-right gear button. While
 * closed it renders nothing at all — that guarantee is what keeps the
 * default-state pages pixel-identical for the us21 visual-regression
 * baselines. While open it exposes a labelled dialog with a radio group
 * of the four colour-vision modes (User Story 25); selecting one updates
 * SettingsContext, which tags <html> and persists to localStorage.
 *
 * The final describe block renders the real Page + TopRightButtons +
 * SettingsPanel stack (inside a SettingsProvider) to check the gear
 * actually toggles the panel end to end.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsPanel from '../client/src/components/ui/SettingsPanel'
import Page from '../client/src/components/ui/Page'
import { SettingsProvider } from '../client/src/state/SettingsContext'

function renderPanel(open: boolean, onClose: () => void = vi.fn()) {
  return render(
    <SettingsProvider>
      <SettingsPanel open={open} onClose={onClose} />
    </SettingsProvider>,
  )
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-color-vision')
  })

  test('renders nothing while closed', () => {
    const { container } = renderPanel(false)

    expect(container).toBeEmptyDOMElement()
  })

  test('a closed panel does not require a SettingsProvider', () => {
    expect(() => render(<SettingsPanel open={false} onClose={vi.fn()} />)).not.toThrow()
  })

  test('renders a labelled dialog with all four colour-vision options', () => {
    renderPanel(true)

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByLabelText('Default')).toBeInTheDocument()
    expect(screen.getByLabelText('Deuteranopia friendly')).toBeInTheDocument()
    expect(screen.getByLabelText('Protanopia friendly')).toBeInTheDocument()
    expect(screen.getByLabelText('Tritanopia friendly')).toBeInTheDocument()
  })

  test('the default mode is selected initially', () => {
    renderPanel(true)

    expect(screen.getByLabelText('Default')).toBeChecked()
    expect(screen.getByLabelText('Deuteranopia friendly')).not.toBeChecked()
  })

  test('selecting a mode checks it, tags <html>, and persists it', () => {
    renderPanel(true)

    fireEvent.click(screen.getByLabelText('Deuteranopia friendly'))

    expect(screen.getByLabelText('Deuteranopia friendly')).toBeChecked()
    expect(screen.getByLabelText('Default')).not.toBeChecked()
    expect(document.documentElement.getAttribute('data-color-vision')).toBe('deuteranopia')
    expect(localStorage.getItem('gartichands.colorVision')).toBe('deuteranopia')
  })

  test('the close button calls onClose', () => {
    const onClose = vi.fn()
    renderPanel(true, onClose)

    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('pressing Escape inside the panel calls onClose', () => {
    const onClose = vi.fn()
    renderPanel(true, onClose)

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Settings' }), { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('SettingsPanel drawing adjustments', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('renders labelled groups for gesture sensitivity and stroke smoothing', () => {
    renderPanel(true)

    expect(screen.getByRole('group', { name: 'Gesture sensitivity' })).toBeInTheDocument()
    expect(screen.getByLabelText('Low')).toBeInTheDocument()
    expect(screen.getByLabelText('Medium (default)')).toBeInTheDocument()
    expect(screen.getByLabelText('High')).toBeInTheDocument()

    expect(screen.getByRole('group', { name: 'Stroke smoothing' })).toBeInTheDocument()
    expect(screen.getByLabelText('Light')).toBeInTheDocument()
    expect(screen.getByLabelText('Balanced (default)')).toBeInTheDocument()
    expect(screen.getByLabelText('Strong')).toBeInTheDocument()
  })

  test('the default levels are selected initially', () => {
    renderPanel(true)

    expect(screen.getByLabelText('Medium (default)')).toBeChecked()
    expect(screen.getByLabelText('Balanced (default)')).toBeChecked()
  })

  test('selecting a sensitivity checks it and persists it', () => {
    renderPanel(true)

    fireEvent.click(screen.getByLabelText('High'))

    expect(screen.getByLabelText('High')).toBeChecked()
    expect(screen.getByLabelText('Medium (default)')).not.toBeChecked()
    expect(localStorage.getItem('gartichands.gestureSensitivity')).toBe('high')
  })

  test('selecting a smoothing level checks it and persists it', () => {
    renderPanel(true)

    fireEvent.click(screen.getByLabelText('Strong'))

    expect(screen.getByLabelText('Strong')).toBeChecked()
    expect(screen.getByLabelText('Balanced (default)')).not.toBeChecked()
    expect(localStorage.getItem('gartichands.strokeSmoothing')).toBe('strong')
  })

  test('the three settings are independent radio groups', () => {
    renderPanel(true)

    fireEvent.click(screen.getByLabelText('High'))

    // Changing sensitivity leaves the other groups on their defaults.
    expect(screen.getByLabelText('Default')).toBeChecked()
    expect(screen.getByLabelText('Balanced (default)')).toBeChecked()
  })
})

describe('Page settings wiring', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-color-vision')
  })

  test('the panel is closed by default and the gear toggles it', () => {
    render(
      <SettingsProvider>
        <Page>Content</Page>
      </SettingsProvider>,
    )

    expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument()
  })

  test('a mode picked via the panel is applied globally', () => {
    render(
      <SettingsProvider>
        <Page>Content</Page>
      </SettingsProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByLabelText('Tritanopia friendly'))

    expect(document.documentElement.getAttribute('data-color-vision')).toBe('tritanopia')
  })
})
