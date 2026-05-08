import React, { useEffect, useRef, useState } from 'react';

const HandTracking: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handDetected, setHandDetected] = useState(false);

  useEffect(() => {
    let hands: any = null;
    let frameId: number;

    // -------------------------
    // RESULTS HANDLER
    // -------------------------
    const onResults = (results: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 640;
      canvas.height = 480;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // mirror canvas
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);

      // draw camera frame
      if (results.image) {
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      }

      // detect hands
      const detected = results.multiHandLandmarks?.length > 0;

      // prevent rerender spam
      setHandDetected((prev) => {
        if (prev !== detected) return detected;
        return prev;
      });

      if (detected) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnections(ctx, landmarks);
          drawLandmarks(ctx, landmarks);
        }
      }

      ctx.restore();
    };

    // -------------------------
    // DRAW LANDMARKS
    // -------------------------
    const drawLandmarks = (
      ctx: CanvasRenderingContext2D,
      landmarks: any[]
    ) => {
      ctx.fillStyle = 'red';

      for (const lm of landmarks) {
        ctx.beginPath();

        ctx.arc(
          lm.x * ctx.canvas.width,
          lm.y * ctx.canvas.height,
          4,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    };

    // -------------------------
    // DRAW CONNECTIONS
    // -------------------------
    const drawConnections = (
      ctx: CanvasRenderingContext2D,
      landmarks: any[]
    ) => {
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],

        [0, 5], [5, 6], [6, 7], [7, 8],

        [5, 9], [9, 10], [10, 11], [11, 12],

        [9, 13], [13, 14], [14, 15], [15, 16],

        [13, 17], [17, 18], [18, 19], [19, 20],

        [0, 17],
      ];

      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;

      for (const [a, b] of connections) {
        const p1 = landmarks[a];
        const p2 = landmarks[b];

        ctx.beginPath();

        ctx.moveTo(
          p1.x * ctx.canvas.width,
          p1.y * ctx.canvas.height
        );

        ctx.lineTo(
          p2.x * ctx.canvas.width,
          p2.y * ctx.canvas.height
        );

        ctx.stroke();
      }
    };

    // -------------------------
    // STARTUP
    // -------------------------
    const start = async () => {
      try {
        console.log('Starting camera...');

        // CAMERA
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
          },
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        await new Promise<void>((resolve) => {
          videoRef.current!.onloadedmetadata = async () => {
            await videoRef.current!.play();
            resolve();
          };
        });

        console.log('Camera ready');

        // MEDIAPIPE GLOBAL
        const Hands = (window as any).Hands;

        if (!Hands) {
          throw new Error(
            'MediaPipe Hands not loaded. Check index.html script.'
          );
        }

        hands = new Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);

        console.log('MediaPipe ready');

        // FRAME LOOP
        const loop = async () => {
          if (
            videoRef.current &&
            hands &&
            videoRef.current.readyState === 4
          ) {
            await hands.send({
              image: videoRef.current,
            });
          }

          frameId = requestAnimationFrame(loop);
        };

        loop();

        setIsLoading(false);
      } catch (err) {
        console.error(err);

        setError(
          'Failed to start hand tracking: ' +
            (err as Error).message
        );

        setIsLoading(false);
      }
    };

    start();

    // -------------------------
    // CLEANUP
    // -------------------------
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      if (hands) {
        hands.close();
      }

      const stream = videoRef.current?.srcObject as MediaStream;

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
      }}
    >
      <h2>Hand Tracking</h2>

      {error && (
        <p style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {!error && (
        <p>
          {isLoading
            ? 'Loading camera and model...'
            : handDetected
            ? '✅ Hand detected'
            : '👋 No hand detected'}
        </p>
      )}

      {/* Hidden raw webcam feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          display: 'none',
          transform: 'scaleX(-1)',
        }}
      />

      {/* Visible rendered canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '640px',
          height: '480px',
          border: '2px solid gray',
          transform: 'scaleX(-1)',
        }}
      />
    </div>
  );
};

export default HandTracking;