// ui4
import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  // match the original working pattern
  const canvasRef = useRef<HTMLCanvasElement>();
  const [counter, setCounter] = useState(0);

  const positions = useRef<
    Map<string, { location: [number, number]; size: number }>
  >(new Map());

  const socket = usePartySocket({
    room: "default",
    party: "globe",
    onMessage(evt) {
      const message = JSON.parse(evt.data as string) as OutgoingMessage;
      if (message.type === "add-marker") {
        positions.current.set(message.position.id, {
          location: [message.position.lat, message.position.lng],
          size: message.position.id === socket.id ? 0.1 : 0.05,
        });
        setCounter((c) => c + 1);
      } else {
        positions.current.delete(message.id);
        setCounter((c) => c - 1);
      }
    },
  });

  useEffect(() => {
    // keep the working behavior, only adjust visuals
    let phi = 0;

    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: 400 * 2,
      height: 400 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 5,                 // a bit brighter than stock
      baseColor: [0.12, 0.36, 0.72],    // rich blue base
      markerColor: [0.0, 0.9, 1.0],     // cyan markers
      glowColor: [0.25, 0.65, 1.0],     // cyan glow
      markers: [],                      // important for first frame
      opacity: 0.85,
      onRender: (state) => {
        // supply markers every frame, same as original logic
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        phi += 0.008; // slightly slower, smooth rotation
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <div className="App">
      <h1>Where's everyone at?</h1>

      {counter !== 0 ? (
        <p>
          <b>{counter}</b> {counter === 1 ? "person" : "people"} connected.
        </p>
      ) : (
        <p>&nbsp;</p>
      )}

      {/* Canvas for the globe */}
      <canvas
        ref={canvasRef as LegacyRef<HTMLCanvasElement>}
        style={{ width: 400, height: 400, maxWidth: "100%", aspectRatio: 1 }}
      />

      {/* Footer */}
      <p>
        Luciano's Lab
        <br />
        Spinning thing by <a href="https://cobe.vercel.app/">Cobe</a>
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
