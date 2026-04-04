import { useState } from "react";
import "./App.css";

function App() {
  // --- Counter ---
  const [count, setCount] = useState(0);

  // --- Text Display ---
  const [text, setText] = useState("Hello!");

  // --- Form Input ---
  const [formValue, setFormValue] = useState("");

  return (
    <div className="app-container">

      {/* Counter Widget */}
      <div className="counter-widget">
        <h2>Counter</h2>
        <p>{count}</p>
        <button onClick={() => setCount(count + 1)}>Increase</button>
        <button onClick={() => setCount(count - 1)}>Decrease</button>
      </div>

      {/* Text Display Widget */}
      <div className="text-widget">
        <h2>Text Display</h2>
        <p>{text}</p>
        <button onClick={() => setText("You clicked the button!")}>
          Change Text
        </button>
      </div>

      {/* Form Input Widget */}
      <div className="form-widget">
        <h2>Form Input</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Submitted: " + formValue);
          }}
        >
          <input
            type="text"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            placeholder="Type something..."
          />
          <button type="submit">Submit</button>
        </form>
      </div>

    </div>
  );
}

export default App;