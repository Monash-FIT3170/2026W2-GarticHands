import React, { useRef } from 'react';

interface CanvasProps {
  width?: number;
  height?: number;
}

const Canvas: React.FC<CanvasProps> = ({
  width = 640,
  height = 480,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
      }}
    >
      <h2>Canvas</h2>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          border: '2px solid gray',
          background: 'white',
        }}
      />
    </div>
  );
};

export default Canvas;
