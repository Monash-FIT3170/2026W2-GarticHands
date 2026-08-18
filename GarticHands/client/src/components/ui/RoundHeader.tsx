interface RoundHeaderProps {
  round: number;
  totalRounds: number;
}

/** Renders the "Round X of Y" label used on `/input`, `/draw`, `/guess`. */
export default function RoundHeader({ round, totalRounds }: RoundHeaderProps) {
  return (
    <p className="rounds">
      Round {round} of {totalRounds}
    </p>
  );
}
