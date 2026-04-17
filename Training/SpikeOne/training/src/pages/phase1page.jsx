import { useState } from "react";
import Card from "../components/Card";

export default function Phase1Page() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("Hello!");
  const [formValue, setFormValue] = useState("");

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col gap-6">

      {/* Counter Widget */}
      <Card>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">Counter</h2>
          <p className="text-lg">{count}</p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => setCount(count + 1)}
            >
              Increase
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => setCount(count - 1)}
            >
              Decrease
            </button>
          </div>
        </div>
      </Card>

      {/* Text Display Widget */}
      <Card>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">Text Display</h2>
          <p className="text-lg">{text}</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setText("You clicked the button!")}
          >
            Change Text
          </button>
        </div>
      </Card>

      {/* Form Input Widget */}
      <Card>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">Form Input</h2>
          <form
            className="flex flex-col gap-2 items-center"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Submitted: " + formValue);
            }}
          >
            <input
              className="border rounded p-2 w-64"
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="Type something..."
            />
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              type="submit"
            >
              Submit
            </button>
          </form>
        </div>
      </Card>

    </div>
  );
}