interface JoinFormProps {
  roomCode: string
  playerName: string
  onRoomCodeChange: (value: string) => void
  onPlayerNameChange: (value: string) => void
  onJoin: () => void
  error: string
}

function JoinForm({ roomCode, playerName, onRoomCodeChange, onPlayerNameChange, onJoin, error }: JoinFormProps) {
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
          Room Code
        </label>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
          placeholder="e.g. ABC123"
          maxLength={6}
          style={{ padding: '8px', width: '100%', fontSize: '16px', letterSpacing: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
          Your Name
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          placeholder="Enter your display name"
          maxLength={20}
          style={{ padding: '8px', width: '100%', fontSize: '16px' }}
        />
      </div>

      {error && (
        <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>
      )}

      <button
        onClick={onJoin}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Join Game
      </button>
    </div>
  )
}

export default JoinForm