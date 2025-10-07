// ui6.2
import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  // keep the original working data flow
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
      mapBrightness: 5,
      // palette per request
      baseColor: [0.043, 0.110, 0.165], // approx #0B1C2A
      markerColor: [0.321, 0.698, 0.748], // approx #52B2BF
      glowColor: [0.282, 0.666, 0.678],   // approx #48AAAD
      markers: [],
      opacity: 0.9,
      onRender: (state) => {
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        phi += 0.008; // ui5 speed
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  // minimal styles in code to avoid touching CSS for this pass
  const bgStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "28px 14px 40px",
    background:
      "radial-gradient(80% 60% at 50% 0%, #0F1214 0%, rgba(15,18,20,0.6) 60%, #0A0B0C 100%)",
    color: "rgba(255,255,255,0.92)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  };

  const headerWrap: React.CSSProperties = {
    textAlign: "center",
    marginBottom: 18,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 32,
    lineHeight: 1.15,
    fontWeight: 800,
    margin: 0,
    letterSpacing: 0.2,
  };

  const counterPill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: "rgba(255,255,255,0.88)",
    fontSize: 15,
  };

  const canvasStyle: React.CSSProperties = {
    width: "min(92vw, 560px)",
    height: "auto",
    aspectRatio: 1,
    display: "block",
    margin: "18px auto 0",
    // subtle outer glow matching ui5 thickness
    filter: "drop-shadow(0 0 40px rgba(72,170,173,0.35))",
  };

  const backLinkStyle: React.CSSProperties = {
    marginTop: 18,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
    transition: "background 180ms ease, border-color 180ms ease",
  };

  const creditStyle: React.CSSProperties = {
    marginTop: 10,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  };

  const linkAccent: React.CSSProperties = {
    color: "#52B2BF",
    textDecoration: "underline",
  };

  return (
    <div style={bgStyle}>
      <div style={headerWrap}>
        <h1 style={titleStyle}>You are here.</h1>
        <div style={counterPill} aria-live="polite">
          <span>
            <b>{counter}</b> {counter === 1 ? "person" : "people"} connected
          </span>
        </div>
      </div>

      {/* globe centered, no container behind it */}
      <canvas
        ref={canvasRef as LegacyRef<HTMLCanvasElement>}
        style={canvasStyle}
      />

      {/* subtle back link and credit, stacked close to globe */}
      <a
        href="https://narno.work"
        target="_blank"
        rel="noreferrer"
        style={backLinkStyle}
      >
        ← Back to narno.work
      </a>

      <div style={creditStyle}>
        <span>Luciano's Lab • Spinning thing by</span>
        <a
          href="https://cobe.vercel.app/"
          target="_blank"
          rel="noreferrer"
          style={linkAccent}
        >
          Cobe
        </a>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
