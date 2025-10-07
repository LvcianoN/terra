// ui8 — minimal, same geometry/centering as ui4
import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  // keep ui4’s simple centering behavior
  const canvasRef = useRef<HTMLCanvasElement>();
  const [counter, setCounter] = useState(0);

  const positions = useRef<
    Map<string, { location: [number, number]; size: number }>
  >(new Map());

  usePartySocket({
    room: "default",
    party: "globe",
    onMessage(evt) {
      const message = JSON.parse(evt.data as string) as OutgoingMessage;
      if (message.type === "add-marker") {
        positions.current.set(message.position.id, {
          location: [message.position.lat, message.position.lng],
          size: message.position.id === (message as any).id ? 0.1 : 0.05,
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

    // same dimensions as ui4, just brighter palette
    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: 400 * 2,
      height: 400 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.3,
      mapSamples: 16000,
      mapBrightness: 6.2,                 // brighter dots
      baseColor: [0.117, 0.282, 0.423],   // deep blue
      markerColor: [0.322, 0.698, 0.749], // teal
      glowColor: [0.282, 0.667, 0.678],   // teal halo
      markers: [],
      opacity: 0.88,
      onRender: (state) => {
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        phi += 0.008;                     // speed you liked
      },
    });

    return () => globe.destroy();
  }, []);

  return (
    <div className="App">
      <h1>You are here.</h1>

      {/* explicit gap so “1 person” never jams */}
      <p style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
        <b>{counter}</b>
        <span>{counter === 1 ? "person" : "people"} connected.</span>
      </p>

      {/* canvas centered by the same simple flow as ui4 */}
      <canvas
        ref={canvasRef as LegacyRef<HTMLCanvasElement>}
        style={{ width: 400, height: 400, maxWidth: "100%", aspectRatio: 1 }}
      />

      {/* small link above footer, minimal styling */}
      <p style={{ marginTop: 10 }}>
        <a href="https://narno.work" target="_blank" rel="noreferrer">
          Go to narno.work
        </a>
      </p>

      {/* footer credit */}
      <p>
        Luciano's Lab
        <br />
        Spinning thing by <a href="https://cobe.vercel.app/">Cobe</a>
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
