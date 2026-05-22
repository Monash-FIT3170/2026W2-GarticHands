import { useState } from "react";
import Card from "../components/Card";

function App() {
  const [count, setCount] = useState(0);
  const [formValue, setFormValue] = useState("");

  return (
    <div className="app-container">
      {/* counter widget */}
      <Card>
        <section className="counter-widget">
          <h1>Counter</h1>
          <button onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </button>
        </section>
      </Card>
      {/* text display section */}
      <Card>
        <section className="display-section">
          <h1>Display Section</h1>
          <p className="display-text">This is a simple text display section.</p>
        </section>
      </Card>
      {/* form input widget */}
      <Card>
        <section className="input-widget">
          <h1>Input Widget</h1>
          <input
            type="text"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            placeholder="Enter some text..."
          />
          <button>Submit</button>
        </section>
      </Card>
    </div>
  );
}

export default App;