import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

// The type of messages we'll be receiving from the server
import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>();
  const [counter, setCounter] = useState(0);

  // Active marker positions (tracked in a ref to avoid re-render per frame)
  const positions = useRef<
    Map<
      string,
      {
        location: [number, number];
        size: number;
      }
    >
  >(new Map());

  // Connect to PartySocket server
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
    let phi = 0;

    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: 400 * 2,
      height: 400 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 4,
      baseColor: [0.05, 0.2, 0.4],    // deep blue tone
      markerColor: [0.0, 0.9, 1.0],   // cyan markers
      glowColor: [0.2, 0.6, 1.0],     // cool outer glow
      opacity: 0.8,
      onRender: (state) => {
        state.markers = [...positions.current.values()];
        state.phi = phi;
        phi += 0.008; // smooth rotation speed
      },
    });

    return () => globe.destroy();
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

      {/* The canvas where the globe is rendered */}
      <canvas
        ref={canvasRef as LegacyRef<HTMLCanvasElement>}
        style={{
          width: 400,
          height: 400,
          maxWidth: "100%",
          aspectRatio: 1,
        }}
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
