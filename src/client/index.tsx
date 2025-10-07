// ui7.5 — simple, centered, no scroll
import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    // Kill the stylesheet’s top padding/background so no “black bar”
    const reset = document.createElement("style");
    reset.innerHTML = `
      body { padding-top:0 !important; background: transparent !important; overflow:hidden; }
    `;
    document.head.appendChild(reset);

    let phi = 0;
    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: 800,
      height: 800,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.5,
      mapSamples: 16000,
      mapBrightness: 6.8,
      baseColor: [0.117, 0.282, 0.423],   // ~#1E486C
      markerColor: [0.322, 0.698, 0.749], // ~#52B2BF
      glowColor: [0.282, 0.667, 0.678],   // #48AAAD
      markers: [],
      opacity: 0.9,
      onRender: (state) => {
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        phi += 0.008; // rotation speed you liked
      },
    });

    return () => {
      globe.destroy();
      reset.remove();
    };
  }, []);

  // Minimal tokens
  const TOK = {
    text: "rgba(255,255,255,0.94)",
    textWeak: "rgba(255,255,255,0.80)",
    border: "rgba(255,255,255,0.18)",
    pillBg: "rgba(255,255,255,0.06)",
    secondary: "#52B2BF",
  } as const;

  // Full-page wrapper: vertically centers stack, prevents scroll
  const app: React.CSSProperties = {
    minHeight: "100vh",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: "8px 12px",
    color: TOK.text,
    textAlign: "center",
    background:
      "radial-gradient(900px 620px at 50% 18%, rgba(15,18,20,0.42), rgba(11,13,15,1) 65%)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  };

  const title: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 800,
    margin: 0,
    textShadow: "0 2px 18px rgba(72,170,173,0.20)",
  };

  // Guaranteed spacing between number and text
  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${TOK.border}`,
    background: TOK.pillBg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: TOK.text,
    fontSize: 15,
  };

  // Canvas sizing: fit viewport height so there’s no scroll.
  // 220px budget for title + pill + buttons + spacing on small screens.
  const canvas: React.CSSProperties = {
    width: "min(88vw, calc(100vh - 220px))",
    maxWidth: 620,
    height: "auto",
    aspectRatio: 1,
    display: "block",
    margin: "0 auto",
    filter: "drop-shadow(0 0 44px rgba(72,170,173,0.35))",
  };

  const back: React.CSSProperties = {
    marginTop: 6,
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    borderRadius: 999,
    border: `1px solid ${TOK.border}`,
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
  };

  const credit: React.CSSProperties = {
    marginTop: 6,
    fontSize: 13,
    color: TOK.textWeak,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${TOK.border}`,
    borderRadius: 999,
    padding: "6px 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    backdropFilter: "blur(8px)",
  };

  return (
    <div style={app}>
      <h1 style={title}>You are here.</h1>

      <div style={pill} aria-live="polite">
        <b>{counter}</b>
        <span>{counter === 1 ? "person" : "people"} connected</span>
      </div>

      <canvas
        ref={canvasRef as LegacyRef<HTMLCanvasElement>}
        style={canvas}
      />

      <a href="https://narno.work" target="_blank" rel="noreferrer" style={back}>
        ← Go to narno.work
      </a>

      <div style={credit}>
        <span>Luciano's Lab • Spinning thing by</span>
        <a
          href="https://cobe.vercel.app/"
          target="_blank"
          rel="noreferrer"
          style={{ color: TOK.secondary, textDecoration: "underline" }}
        >
          Cobe
        </a>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
