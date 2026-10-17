/**
 * InputPage.test.tsx
 *
 * Component tests for InputPage (client/src/pages/InputPage).
 *
 * InputPage is the first round screen where a player types the prompt
 * that another player will later draw. Submitting posts the prompt,
 * disables further input, and shows a waiting message until the room moves into the draw phase, at which point the page navigates to
 * /draw. If the countdown expires before the player submits, it auto
 * submits whatever prompt has been typed so far.
 *
 * Unlike GuessingPage, the Submit button here is only disabled once
 * submitted is true, not based on whether the input is blank; the blank
 * check happens inside handleSubmit itself, so clicking Submit with an
 * empty input is a safe no op rather than a disabled button state.
 *
 * react router, the room API, and the shared UI kit are all mocked so
 * tests can control what data InputPage receives and assert on its
 * resulting behaviour directly.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InputPage from '../client/src/Pages/inputPage';

type LocationState = {
  state?: { roomCode?: string; playerName?: string };
};

const {
  mockNavigate,
  mockUseLocation,
  mockSubmitPrompt,
  mockUsePhaseAdvance,
  mockGeneratePrompts,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn<() => LocationState>(),
  mockSubmitPrompt: vi.fn(),
  mockUsePhaseAdvance: vi.fn(),
  mockGeneratePrompts: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
}));

vi.mock('../client/src/api/room', () => ({
  submitPrompt: mockSubmitPrompt,
  // The page polls the room to detect AI Mode; a non-AI room keeps the normal flow.
  getRoom: () => Promise.resolve({ success: false }),
  // Real constant re-declared here because the whole module is mocked away:
  // the page compares `data.status === PhaseConflictStatus` on failures.
  PhaseConflictStatus: 409,
}));

// AI prompt suggestions: no network in tests, fixed batches instead.
vi.mock('../client/src/api/ai', () => ({
  generatePrompts: mockGeneratePrompts,
}));

vi.mock('../client/src/hooks/usePhaseAdvance', () => ({
  usePhaseAdvance: mockUsePhaseAdvance,
}));

// Shared UI kit reduced to simple, inspectable markup. CountdownTimer is
// reduced to a clickable stand in so its onExpire callback can be
// triggered directly from a test.
vi.mock('../client/src/components/ui', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  RoundHeader: ({ round, totalRounds }: { round: number; totalRounds: number }) => (
    <p>
      Round {round} of {totalRounds}
    </p>
  ),
  CountdownTimer: ({ onExpire }: { onExpire?: () => void }) => (
    <button data-testid="expire-timer" onClick={onExpire}>
      expire
    </button>
  ),
}));

describe('InputPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({
      state: { roomCode: 'ABC123', playerName: 'Ash' },
    });
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 0,
      room: { round: 1, maxRounds: 4 },
    });
    mockSubmitPrompt.mockResolvedValue({ success: true, room: { phase: 'prompt' } });
    mockGeneratePrompts.mockResolvedValue({
      prompts: ['a dog flying a kite', 'a bear eating pancakes', 'a frog playing guitar'],
      source: 'ai',
    });
  });

  test('redirects to the home page when roomCode is missing', () => {
    mockUseLocation.mockReturnValue({ state: { playerName: 'Ash' } });

    render(<InputPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('redirects to the home page when playerName is missing', () => {
    mockUseLocation.mockReturnValue({ state: { roomCode: 'ABC123' } });

    render(<InputPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('renders the round header using the phase advance room data', () => {
    render(<InputPage />);

    expect(screen.getByText('Round 1 of 4')).toBeInTheDocument();
  });

  test('the submit button starts enabled', () => {
    render(<InputPage />);

    expect(screen.getByText('Submit')).not.toBeDisabled();
  });

  test('clicking submit with a blank input does not call submitPrompt', () => {
    render(<InputPage />);

    fireEvent.click(screen.getByText('Submit'));

    expect(mockSubmitPrompt).not.toHaveBeenCalled();
  });

  test('clicking submit with a whitespace only input does not call submitPrompt', () => {
    render(<InputPage />);

    fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByText('Submit'));

    expect(mockSubmitPrompt).not.toHaveBeenCalled();
  });

  test('submitting sends the trimmed prompt and disables the input', async () => {
    render(<InputPage />);

    fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
      target: { value: '  a flying cat  ' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockSubmitPrompt).toHaveBeenCalledWith('ABC123', 'Ash', 'a flying cat');
    });
    expect(screen.getByPlaceholderText('What should they draw?')).toBeDisabled();
    expect(screen.getByText('Submit')).toBeDisabled();
  });

  test('navigates to draw once the submission moves the room into the draw phase', async () => {
    mockSubmitPrompt.mockResolvedValue({
      success: true,
      room: { phase: 'draw' },
    });

    render(<InputPage />);

    fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
      target: { value: 'a flying cat' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/draw', {
        state: { roomCode: 'ABC123', playerName: 'Ash' },
      });
    });
  });

  test('shows the submission error and re enables the form when submitPrompt fails', async () => {
    mockSubmitPrompt.mockResolvedValue({
      success: false,
      message: 'Room is full.',
    });

    render(<InputPage />);

    fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
      target: { value: 'a flying cat' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Room is full.')).toBeInTheDocument();
    });
    expect(screen.getByText('Submit')).not.toBeDisabled();
    expect(screen.getByPlaceholderText('What should they draw?')).not.toBeDisabled();
  });

  test('shows a waiting message with correct pluralisation after submitting', async () => {
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 3,
      room: { round: 1, maxRounds: 4 },
    });

    render(<InputPage />);

    fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
      target: { value: 'a flying cat' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Waiting for 3 other players...')).toBeInTheDocument();
    });
  });

  test('shows the singular form of the waiting message when exactly one player remains', async () => {
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 1,
      room: { round: 1, maxRounds: 4 },
    });

    render(<InputPage />);

    fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
      target: { value: 'a flying cat' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Waiting for 1 other player...')).toBeInTheDocument();
    });
  });

  test('shows the starting message once nobody else is waited on', async () => {
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 0,
      room: { round: 1, maxRounds: 4 },
    });

    render(<InputPage />);

    fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
      target: { value: 'a flying cat' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Starting drawing phase...')).toBeInTheDocument();
    });
  });

  test('the timer expiring auto submits the typed prompt', async () => {
    render(<InputPage />);

    fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
      target: { value: 'a flying cat' },
    });
    fireEvent.click(screen.getByTestId('expire-timer'));

    await waitFor(() => {
      expect(mockSubmitPrompt).toHaveBeenCalledWith('ABC123', 'Ash', 'a flying cat');
    });
  });

  test('the timer expiring with a blank input does not submit', () => {
    render(<InputPage />);

    fireEvent.click(screen.getByTestId('expire-timer'));

    expect(mockSubmitPrompt).not.toHaveBeenCalled();
  });

  test('the timer expiring after submission does not submit again', async () => {
    render(<InputPage />);

    fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
      target: { value: 'a flying cat' },
    });
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(mockSubmitPrompt).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByTestId('expire-timer'));

    expect(mockSubmitPrompt).toHaveBeenCalledTimes(1);
  });

  test('limits the prompt input to the configured maximum length', () => {
    render(<InputPage />);

    expect(screen.getByPlaceholderText('What should they draw?')).toHaveAttribute(
      'maxLength',
      '120',
    );
  });

  describe('prompt suggestions', () => {
    test('shows AI suggestions when the page loads', async () => {
      render(<InputPage />);

      expect(await screen.findByText('a dog flying a kite')).toBeInTheDocument();
      expect(screen.getByText('a bear eating pancakes')).toBeInTheDocument();
      expect(screen.getByText('a frog playing guitar')).toBeInTheDocument();
      expect(mockGeneratePrompts).toHaveBeenCalledWith(
        expect.objectContaining({ count: 3, difficulty: 'medium' }),
      );
    });

    test('clicking a suggestion fills the input without submitting', async () => {
      render(<InputPage />);

      fireEvent.click(await screen.findByText('a bear eating pancakes'));

      expect(screen.getByPlaceholderText('What should they draw?')).toHaveValue(
        'a bear eating pancakes',
      );
      expect(mockSubmitPrompt).not.toHaveBeenCalled();
    });

    test('a picked suggestion can be submitted like typed text', async () => {
      render(<InputPage />);

      fireEvent.click(await screen.findByText('a frog playing guitar'));
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(mockSubmitPrompt).toHaveBeenCalledWith('ABC123', 'Ash', 'a frog playing guitar');
      });
    });

    test('new ideas replaces the suggestions and excludes the ones already shown', async () => {
      render(<InputPage />);
      await screen.findByText('a dog flying a kite');

      mockGeneratePrompts.mockResolvedValueOnce({
        prompts: ['a snail racing a train', 'a ghost brushing its teeth', 'a cow jumping a fence'],
        source: 'ai',
      });
      fireEvent.click(screen.getByText('↻ New ideas'));

      expect(await screen.findByText('a snail racing a train')).toBeInTheDocument();
      expect(screen.queryByText('a dog flying a kite')).not.toBeInTheDocument();
      expect(mockGeneratePrompts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          exclude: ['a dog flying a kite', 'a bear eating pancakes', 'a frog playing guitar'],
        }),
      );
    });

    test('suggestions and new ideas are disabled after submitting', async () => {
      render(<InputPage />);
      await screen.findByText('a dog flying a kite');

      fireEvent.change(screen.getByPlaceholderText('What should they draw?'), {
        target: { value: 'a flying cat' },
      });
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => expect(screen.getByText('a dog flying a kite')).toBeDisabled());
      expect(screen.getByText('↻ New ideas')).toBeDisabled();
    });
  });
});
