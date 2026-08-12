/**
 * Page.test.tsx
 *
 * Component tests for Page (client/src/components/ui/Page).
 *
 * Page is the shared layout shell used by most screens. It controls the
 * background colour, overall layout mode (centered vs flow), optional
 * logo, optional top right utility buttons, and padding, then renders
 * whatever children it is given inside that shell.
 *
 * TopRightButtons and Logo are mocked here so this file only tests Page
 * own layout logic (which pieces it decides to render, and with what
 * classes) rather than the internals of those child components.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Page from '../client/src/components/ui/Page'

vi.mock('../client/src/components/ui/TopRightButtons', () => ({
  default: () => <div data-testid="top-right-buttons" />,
}))

vi.mock('../client/src/components/ui/Logo', () => ({
  default: ({ compact }: { compact?: boolean }) => (
    <div data-testid="logo" data-compact={compact ? 'true' : 'false'} />
  ),
}))

describe('Page', () => {
  test('renders its children', () => {
    render(
      <Page>
        <p>Page content</p>
      </Page>,
    )

    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  test('shows the top right buttons by default', () => {
    render(<Page>Content</Page>)

    expect(screen.getByTestId('top-right-buttons')).toBeInTheDocument()
  })

  test('hides the top right buttons when topRight is false', () => {
    render(<Page topRight={false}>Content</Page>)

    expect(screen.queryByTestId('top-right-buttons')).not.toBeInTheDocument()
  })

  test('does not show the logo by default', () => {
    render(<Page>Content</Page>)

    expect(screen.queryByTestId('logo')).not.toBeInTheDocument()
  })

  test('shows the logo when logo is true', () => {
    render(<Page logo>Content</Page>)

    expect(screen.getByTestId('logo')).toBeInTheDocument()
  })

  test('passes compactLogo through to the Logo compact prop', () => {
    render(
      <Page logo compactLogo>
        Content
      </Page>,
    )

    expect(screen.getByTestId('logo')).toHaveAttribute('data-compact', 'true')
  })

  test('logo defaults to non compact when compactLogo is not set', () => {
    render(<Page logo>Content</Page>)

    expect(screen.getByTestId('logo')).toHaveAttribute('data-compact', 'false')
  })

  test('defaults to the centered layout classes', () => {
    const { container } = render(<Page>Content</Page>)

    expect(container.firstChild).toHaveClass('justify-center')
  })

  test('flow variant omits the centered justify class', () => {
    const { container } = render(<Page variant="flow">Content</Page>)

    expect(container.firstChild).toHaveClass('items-center')
    expect(container.firstChild).not.toHaveClass('justify-center')
  })

  test('applies the default background class', () => {
    const { container } = render(<Page>Content</Page>)

    expect(container.firstChild).toHaveClass('bg-[#6FADA0]')
  })

  test('applies a custom background class when given', () => {
    const { container } = render(<Page background="bg-red-500">Content</Page>)

    expect(container.firstChild).toHaveClass('bg-red-500')
    expect(container.firstChild).not.toHaveClass('bg-[#6FADA0]')
  })

  test('applies the default padding classes', () => {
    const { container } = render(<Page>Content</Page>)

    expect(container.firstChild).toHaveClass('px-4', 'py-10')
  })

  test('applies custom padding classes when given', () => {
    const { container } = render(<Page padding="px-8 py-2">Content</Page>)

    expect(container.firstChild).toHaveClass('px-8', 'py-2')
  })

  test('merges an extra className onto the computed classes', () => {
    const { container } = render(<Page className="mt-4">Content</Page>)

    expect(container.firstChild).toHaveClass('mt-4')
    expect(container.firstChild).toHaveClass('min-h-screen')
  })
})