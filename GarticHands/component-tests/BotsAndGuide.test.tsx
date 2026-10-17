/**
 * BotsAndGuide.test.tsx
 *
 * Component tests for the AI drawing bots UI and the How to Play guide:
 *  - `<PlayerList />` marks bots and offers the host a remove button.
 *  - `<AiSketch />` sends the typed prompt to `aiDraw` and shows the result.
 *  - `<HowToPlayPage />` has a section, GIF and reduced-motion still per mode.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import PlayerList from '../client/src/components/PlayerList'
import AiSketch from '../client/src/components/AiSketch'
import HowToPlayPage from '../client/src/Pages/howToPlayPage'
import type { Player } from '../client/src/types/room'

vi.mock('../client/src/api/room', () => ({
  aiDraw: vi.fn(),
}))

import { aiDraw } from '../client/src/api/room'

const players: Player[] = [
  { name: 'Ash', status: 'host', isHost: true, ready: true, joinedAt: 1, lastSeen: 1 },
  {
    name: 'Bot Pablo',
    status: 'ready',
    isHost: false,
    ready: true,
    isBot: true,
    joinedAt: 2,
    lastSeen: 2,
  },
]

describe('PlayerList with bots', () => {
  it('marks bots with a robot glyph', () => {
    render(<PlayerList players={players} variant="lobby" />)
    expect(screen.getAllByRole('img', { name: 'Bot' })).toHaveLength(1)
  })

  it('lets the host remove a bot, and only bots', () => {
    const onRemoveBot = vi.fn()
    render(<PlayerList players={players} variant="lobby" onRemoveBot={onRemoveBot} />)

    expect(screen.queryByRole('button', { name: 'Remove Ash' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Bot Pablo' }))
    expect(onRemoveBot).toHaveBeenCalledWith('Bot Pablo')
  })

  it('hides the remove button when no handler is given', () => {
    render(<PlayerList players={players} variant="lobby" />)
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument()
  })
})

describe('AiSketch', () => {
  it('draws the typed prompt and says who drew it', async () => {
    vi.mocked(aiDraw).mockResolvedValue({
      success: true,
      prompt: 'a rocket',
      source: 'template',
      dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
    })

    render(<AiSketch />)
    fireEvent.change(screen.getByLabelText('Prompt for the bot to draw'), {
      target: { value: '  a rocket ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Draw it' }))

    expect(aiDraw).toHaveBeenCalledWith('a rocket')
    const image = await screen.findByRole('img', { name: "A bot's drawing of a rocket" })
    expect(image).toHaveAttribute('src', 'data:image/svg+xml;base64,PHN2Zy8+')
    expect(screen.getByText(/offline sketch bank/)).toBeInTheDocument()
  })

  it('shows the server message when drawing fails', async () => {
    vi.mocked(aiDraw).mockResolvedValue({ success: false, message: 'Slow down' })

    render(<AiSketch />)
    fireEvent.change(screen.getByLabelText('Prompt for the bot to draw'), {
      target: { value: 'a cat' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Draw it' }))

    await waitFor(() => expect(screen.getByText('Slow down')).toBeInTheDocument())
  })
})

describe('HowToPlayPage', () => {
  function renderGuide() {
    render(
      <MemoryRouter>
        <HowToPlayPage />
      </MemoryRouter>,
    )
  }

  it('covers the controls and every game mode', () => {
    renderGuide()
    for (const title of [
      'Drawing with your hand',
      'Classic',
      'Leaderboard',
      'AI Mode — play with bots',
      'Solo',
      'Playground',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
  })

  it('shows a GIF per section with a still for reduced motion', () => {
    const { container } = render(
      <MemoryRouter>
        <HowToPlayPage />
      </MemoryRouter>,
    )
    const gifs = container.querySelectorAll('img[src$=".gif"]')
    const stills = container.querySelectorAll('source[media="(prefers-reduced-motion: reduce)"]')
    expect(gifs).toHaveLength(6)
    expect(stills).toHaveLength(6)
    gifs.forEach((gif) => expect(gif.getAttribute('alt')).toBeTruthy())
  })
})
