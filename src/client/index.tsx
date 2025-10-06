import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    // physical pixel size of the canvas, UI scales with CSS below
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const BASE = 400; // CSS size
    const PX = Math.floor(BASE * DPR); // backing store size

    let phi = 0;

    const globe = createGlobe(canvas, {
      devicePixelRatio: DPR,
      width: PX,
      height: PX,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 5,            // brighter so it is visible
      baseColor: [0.12, 0.36, 0.72], // rich blue
      markerColor: [0.0, 0.9, 1.0],  // cyan markers
      glowColor: [0.25, 0.65, 1.0],  // cyan glow
      opacity: 0.9,
      onRender: (state) => {
        // keep size in sync every frame
        state.width = PX;
        state.height = PX;

        // markers guard
        state.markers =
          positions.current && positions.current.size
            ? Array.from(positions.current.values())
            : [];

        state.phi = phi;
        phi += 0.008;
      },
    });

    // handle window resize
    const onResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.floor(BASE * dpr);
      canvas.width = px;
      canvas.height = px;
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, []);

  return (
    <div className="App" style={{ textAlign: "center", color: "#ddd" }}>
      <h1>Where's everyone at?</h1>

      {counter !== 0 ? (
        <p>
          <b>{counter}</b> {counter === 1 ? "person" : "people"} connected.
        </p>
      ) : (
        <p>&nbsp;</p>
      )}

      {/* Important: give the canvas real pixel dimensions via attributes */}
      <canvas
        ref={canvasRef as LegacyRef<HTMLCanvasElement>}
        width={800}           // backing store, will be overridden on mount
        height={800}
        style={{
          width: 400,         // CSS size on the page
          height: 400,
          maxWidth: "100%",
          aspectRatio: 1,
          display: "block",
          margin: "0 auto",
        }}
      />

      <p style={{ marginTop: "1em", color: "#aaa", fontSize: "0.9em" }}>
        Luciano's Lab
        <br />
        Spinning thing by <a href="https://cobe.vercel.app/">Cobe</a>
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
