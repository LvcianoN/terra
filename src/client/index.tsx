// ui7.3
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
    // HARD override body to eliminate black band before paint
    const cssReset = document.createElement("style");
    cssReset.innerHTML = `
      body {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow-x: hidden;
      }
    `;
    document.head.appendChild(cssReset);

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
      mapBrightness: 6.8, // slightly higher
      baseColor: [0.117, 0.282, 0.423], // #1E486C
      markerColor: [0.322, 0.698, 0.749], // #52B2BF
      glowColor: [0.282, 0.667, 0.678],   // #48AAAD
      markers: [],
      opacity: 0.9,
      onRender: (state) => {
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        phi += 0.008;
      },
    });

    return () => {
      globe.destroy();
      cssReset.remove();
    };
  }, []);

  const TOK = {
    text: "rgba(255,255,255,0.94)",
    textWeak: "rgba(255,255,255,0.80)",
    border: "rgba(255,255,255,0.2)",
    pillBg: "rgba(255,255,255,0.06)",
    creditBg: "rgba(255,255,255,0.04)",
    accent: "#48AAAD",
    secondary: "#52B2BF",
  } as const;

  // Full gradient overlay, fixed to viewport
  const gradientBG: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(1200px 820px at 50% 10%, #0F1214 0%, rgba(15,18,20,0.75) 60%, #0A0B0C 100%)",
    zIndex: 0,
  };

  const pageStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    color: TOK.text,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: 10,
    textShadow: "0 2px 18px rgba(72,170,173,0.25)",
  };

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${TOK.border}`,
    background: TOK.pillBg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: TOK.text,
    fontSize: 15,
    marginBottom: 25,
  };

  // Absolute centering with transform ensures pixel-perfect
  const globeWrapper: React.CSSProperties = {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  };

  const canvasStyle: React.CSSProperties = {
    width: "clamp(320px, 85vw, 620px)",
    height: "auto",
    aspectRatio: 1,
    display: "block",
    margin: "0 auto",
    filter: "drop-shadow(0 0 44px rgba(72,170,173,0.35))",
  };

  const backBtn: React.CSSProperties = {
    marginTop: 24,
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
    transition: "all 200ms ease",
  };

  const creditStyle: React.CSSProperties = {
    marginTop: 8,
    fontSize: 13,
    color: TOK.textWeak,
    background: TOK.creditBg,
    border: `1px solid ${TOK.border}`,
    borderRadius: 999,
    padding: "6px 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    backdropFilter: "blur(8px)",
  };

  return (
    <>
      <div style={gradientBG} />
      <div style={pageStyle}>
        <h1 style={titleStyle}>You are here.</h1>
        <div style={pillStyle}>
          <b>{counter}</b> {counter === 1 ? "person" : "people"} connected
        </div>

        <div style={globeWrapper}>
          <canvas ref={canvasRef as LegacyRef<HTMLCanvasElement>} style={canvasStyle} />
        </div>

        <a href="https://narno.work" target="_blank" rel="noreferrer" style={backBtn}>
          ← Go to narno.work
        </a>

        <div style={creditStyle}>
          <span>Luciano's Lab • Spinning thing by</span>
          <a href="https://cobe.vercel.app/" target="_blank" rel="noreferrer" style={{ color: TOK.secondary, textDecoration: "underline" }}>
            Cobe
          </a>
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
