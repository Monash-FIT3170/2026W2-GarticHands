import { useState } from "react";
import Card from "../components/Card";

function SubmitPage() {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      const res = await fetch("http://localhost:3001/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        setStatus("Submitted!");
        setContent("");
        setTimeout(() => setStatus(""), 2000);
      }
    } catch (err) {
      setStatus("Failed to submit");
    }
  };

  return (
    <Card>
      <div className="text-2xl font-bold mb-4">
        Submission Page
        <form onSubmit={handleSubmit}>
          <input
            className="w-full p-2 border border-gray-300 rounded mb-2"
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter a submission..."
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            type="submit"
          >
            Submit
          </button>
          {status && <p className="mt-2 text-green-600">{status}</p>}
        </form>
      </div>
    </Card>
  );
}

export default SubmitPage;
