import { useEffect, useState } from "react";

const MaxChars = 120;
const TotalTime = 60;

export default function GuessingPage() {
  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(TotalTime);

  const drawnBy = "Lily";
  const isUrgent = timeLeft <= 10;

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = () => {
    if (!guess.trim()) return;
    setGuess("");
  };

  return (
    <div className="background">
        <div className="relative w-full max-w-sm mx-4 bg-white/[0.07] border border-white/[0.14] rounded-2xl p-7">
            <p className="rounds">
                Round 1 of 4</p>
            <h1 className="text-3xl">
                Guess this Drawing
            </h1>
            <p className="text-sm text-black/45 mb-5">Drawn by {drawnBy}</p>
            <div className="w-full h-48 bg-white/[0.14] rounded-lg mb-5" />
            <div className="flex items-center justify-between mb-3">
                <span className={`text-sm ${isUrgent ? "text-red-400" : "text-black/50"}`}>
                    {timeLeft} seconds left
                </span>
            </div>
            <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                maxLength={MaxChars}
                placeholder="What is this drawing?"
            />
            <button
                className={`px-4 py-2 rounded-lg font-semibold ${guess.trim() ? "bg-green-600 hover:bg-green-700" : "bg-gray-500"}`}
                onClick={handleSubmit}
                disabled={!guess.trim()}
            >
                Submit Guess
            </button>
        </div>
    </div>
  );
}

