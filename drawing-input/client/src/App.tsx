import { useCallback, useRef } from "react";
import "./App.css";
import HandTracking from "./components/HandTracking";
import Canvas, { type CanvasHandle } from "./components/Canvas";
import type { HandLandmark } from "./Models/HandLandmark";
import type { GestureType } from "./gestures/GestureTypes";

function App() {
  const canvasRef = useRef<CanvasHandle>(null);

  const handleFrame = useCallback(
    (landmarks: HandLandmark[] | null, gesture: GestureType) => {
      canvasRef.current?.onFrame(landmarks, gesture);
    },
    [],
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        padding: "24px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <HandTracking onFrame={handleFrame} />
      <Canvas ref={canvasRef} />
    </div>
  );
}

export default App;
