import { useState } from "react";
import Card from "../components/Card";
import PhaseLoadingWrapper from "../components/PhaseLoadingWrapper";

function App() {
  const [count, setCount] = useState(0);
  const [formValue, setFormValue] = useState("");

  return (
    <PhaseLoadingWrapper>
      <div className="text-center p-4 mx-auto max-w-2xl font-sans justify-items-center bg-emerald-200">
        {/* counter widget */}
        <Card>
          <section className="border-2 border-blue-500 mx-auto rounded-lg p-4 justify-items-center flex-gap-4">
            <h1 className="text-4xl font-bold text-blue-700">Counter</h1>
            <button
              className="bg-lime-500 cursor-pointer"
              onClick={() => setCount((count) => count + 1)}
            >
              Count is {count}
            </button>
          </section>
        </Card>
        {/* text display section */}
        <Card>
          <section className="border-2 border-blue-500 mx-auto rounded-lg p-4 justify-items-center flex-gap-4">
            <h1 className="text-4xl font-bold text-blue-700">
              Display Section
            </h1>
            <p className="display-text">
              This is a simple text display section.
            </p>
          </section>
        </Card>
        {/* form input widget */}
        <section className="border-2 border-blue-500 mx-auto rounded-lg p-4 justify-items-center flex-gap-4">
          <h1 className="text-4xl font-bold text-blue-700">Input Widget</h1>
          <input
            className="border-2 border-b-cyan-600"
            type="text"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            placeholder="Enter some text..."
          />
          <button
            className="bg-cyan-500 border-b-fuchsia-600 cursor-pointer"
            onClick={() => console.log(formValue)}
          >
            Submit
          </button>
        </section>
      </div>
    </PhaseLoadingWrapper>
  );
}

export default App;
