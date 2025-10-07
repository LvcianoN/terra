// ui7.4
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
    // Neutralize old CSS top padding/background immediately
    const reset = document.createElement("style");
    reset.innerHTML = `
      body { background: transparent !important; padding:0 !important; margin:0 !important; }
    `;
    document.head.appendChild(reset);

    // Globe
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
      mapBrightness: 6.8,                          // brighter dots
      baseColor: [0.117, 0.282, 0.423],            // #1E486C
      markerColor: [0.322, 0.698, 0.749],          // #52B2BF
      glowColor: [0.282, 0.667, 0.678],            // #48AAAD
      markers: [],
      opacity: 0.9,
      onRender: (state) => {
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        phi += 0.008;                               // ui5 speed you liked
      },
    });

    return () => {
      globe.destroy();
      reset.remove();
    };
  }, []);

  // Tokens
  const TOK = {
    text: "rgba(255,255,255,0.94)",
    textWeak: "rgba(255,255,255,0.80)",
    border: "rgba(255,255,255,0.20)",
    pillBg: "rgba(255,255,255,0.06)",
    creditBg: "rgba(255,255,255,0.04)",
    accent: "#48AAAD",
    secondary: "#52B2BF",
  } as const;

  // Subtle full-viewport background, softer ring, no top band
  const bgStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(1200px 820px at 50% 12%, rgba(15,18,20,0.45) 0%, rgba(15,18,20,0.32) 45%, #0B0D0F 100%)",
  };

  const page: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: TOK.text,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  };

  const title: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 800,
    margin: "0 0 10px 0",
    textShadow: "0 2px 18px rgba(72,170,173,0.22)",
  };

  // Pill with explicit gap so “1 person” never runs together
  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,                                           // ← guarantees visible space
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${TOK.border}`,
    background: TOK.pillBg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: TOK.text,
    fontSize: 15,
    marginBottom: 26,
  };

  // Absolute math centering: immune to margins/filters/rounding
  const globeTrack: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "auto",
  };
  const globeCenter: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    top: 0,
  };

  const canvas: React.CSSProperties = {
    width: "clamp(320px, 85vw, 620px)",
    height: "auto",
    aspectRatio: 1,
    display: "block",
    margin: 0,
    filter: "drop-shadow(0 0 44px rgba(72,170,173,0.35))",
  };

  const back: React.CSSProperties = {
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
    transition: "all 180ms ease",
  };

  const credit: React.CSSProperties = {
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
      <div style={bgStyle} />
      <div style={page}>
        <h1 style={title}>You are here.</h1>

        <div style={pill} aria-live="polite">
          <b>{counter}</b>
          <span>{counter === 1 ? "person" : "people"} connected</span>
        </div>

        {/* Guaranteed horizontal centering */}
        <div style={globeTrack}>
          <div style={globeCenter}>
            <canvas
              ref={canvasRef as LegacyRef<HTMLCanvasElement>}
              style={canvas}
            />
          </div>
        </div>

        <a href="https://narno.work" target="_blank" rel="noreferrer" style={back}>
          Go to narno.work
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
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
