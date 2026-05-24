import {useState, useEffect} from "react";

const MaxChars = 120;
const TotalTime = 60;

export default function InputPage() {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TotalTime);

    useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); setSubmitted(true); return 0; }
        return prev - 1;
        });
    }, 1000);
    return () => clearInterval(t);
    }, [submitted]);
    
    const isUrgent = timeLeft <= 10;


    const handleSubmit = () => {
        if (!input.trim() || submitted) return;
        setSubmitted(true);
    };

    return (
        <div className="background">
            <div className="relative w-full max-w-sm mx-4 bg-white/[0.07] border border-white/[0.14] rounded-2xl p-7">
                <p className="rounds">
                    Round 1 of 4</p>
                <h1 className="text-3xl">
                    Write a sentence
                </h1>
                <input
                    type="text"
                    className="text box"
                    maxLength={MaxChars}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={submitted}
                    placeholder="Start typing your prompt here..."
                />
                <div className="flex items-center justify-between mt-3">
                    <span className={`text-sm ${isUrgent ? "text-red-400" : "text-black/50"}`}>
                        {timeLeft}s left
                    </span>
                    <button
                        className={`px-4 py-2 rounded-lg font-semibold ${submitted ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"}`}
                        onClick={handleSubmit}
                        disabled={submitted}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}