// ui7
import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  // keep original data flow
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
      diffuse: 1.35,         // lift dot contrast softly
      mapSamples: 16000,
      mapBrightness: 6.1,    // brighter dots without blowing glow
      // tuned palette: deep blue base, secondary markers, precise teal glow
      baseColor: [0.10, 0.24, 0.36],    // ~ #193D5C slightly brighter than before
      markerColor: [0.322, 0.698, 0.749], // ~ #52B2BF
      glowColor: [0.282, 0.667, 0.678],   // exact #48AAAD
      markers: [],
      opacity: 0.88,         // keeps glow vivid, dots readable
      onRender: (state) => {
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        phi += 0.008;        // ui5 speed
      },
    });

    return () => globe.destroy();
  }, []);

  // design tokens
  const TOK = {
    text: "rgba(255,255,255,0.92)",
    textWeak: "rgba(255,255,255,0.80)",
    border: "rgba(255,255,255,0.18)",
    pillBg: "rgba(255,255,255,0.06)",
    creditBg: "rgba(255,255,255,0.05)",
    accent: "#48AAAD",
    secondary: "#52B2BF",
    bgStart: "#0A0B0C",
    bgMid: "#0F1214",
  } as const;

  // page background, gradient start moved down to remove top band
  const pageStyle: React.CSSProperties = {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "18px 14px 40px",
    background:
      `radial-gradient(1100px 760px at 50% 10%, ${TOK.bgMid} 0%, rgba(15,18,20,0.68) 55%, ${TOK.bgStart} 100%)`,
    color: TOK.text,
    textRendering: "optimizeLegibility",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  };

  // subtle top fade to eliminate any banding against browser chrome
  const topFadeStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    pointerEvents: "none",
    background: `linear-gradient(to bottom, ${TOK.bgMid} 0%, rgba(15,18,20,0.0) 100%)`,
  };

  const headerWrap: React.CSSProperties = {
    textAlign: "center",
    marginBottom: 10, // tighter stack
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 32,
    lineHeight: 1.15,
    fontWeight: 800,
    margin: 0,
    letterSpacing: 0.2,
    textShadow: "0 2px 18px rgba(72,170,173,0.20)",
  };

  // pill with proper contrast
  const counterPill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${TOK.border}`,
    background: TOK.pillBg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: TOK.text,
    fontSize: 15,
  };

  // dedicated wrapper to force perfect horizontal centering
  const globeRow: React.CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center", // exact center horizontally
  };

  const canvasStyle: React.CSSProperties = {
    width: "clamp(320px, 82vw, 620px)", // larger than ui4, still mobile safe
    height: "auto",
    aspectRatio: 1,
    display: "block",
    marginTop: 20,
    filter: "drop-shadow(0 0 44px rgba(72,170,173,0.35))", // ui5 glow thickness
  };

  // low elevation back link
  const backLinkStyle: React.CSSProperties = {
    marginTop: 16,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${TOK.border}`,
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: 14,
    outline: "2px solid transparent",
    outlineOffset: 2,
    transition:
      "background 180ms ease, border-color 180ms ease, outline-color 180ms ease",
  };

  const creditStyle: React.CSSProperties = {
    marginTop: 8, // tighter link to footer
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${TOK.border}`,
    background: TOK.creditBg,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: TOK.textWeak,
    fontSize: 13,
  };

  const linkAccent: React.CSSProperties = {
    color: TOK.secondary,
    textDecoration: "underline",
  };

  // hover and focus polish
  const onHover = (el: HTMLAnchorElement | null, on: boolean) => {
    if (!el) return;
    if (on) {
      el.style.background =
        "linear-gradient(180deg, rgba(72,170,173,0.16), rgba(72,170,173,0.08))";
      el.style.outlineColor = "color-mix(in oklab, white 45%, #48AAAD)";
      el.style.borderColor = "rgba(255,255,255,0.22)";
    } else {
      el.style.background = "rgba(255,255,255,0.04)";
      el.style.outlineColor = "transparent";
      el.style.borderColor = TOK.border;
    }
  };

  return (
    <div style={pageStyle}>
      <div style={topFadeStyle} />
      <div style={headerWrap}>
        <h1 style={titleStyle}>You are here.</h1>
        <div style={counterPill} aria-live="polite">
          <span>
            <b>{counter}</b> {counter === 1 ? "person" : "people"} connected
          </span>
        </div>
      </div>

      {/* perfectly centered globe */}
      <div style={globeRow}>
        <canvas
          ref={canvasRef as LegacyRef<HTMLCanvasElement>}
          style={canvasStyle}
        />
      </div>

      <a
        href="https://narno.work"
        target="_blank"
        rel="noreferrer"
        style={backLinkStyle}
        onMouseEnter={(e) => onHover(e.currentTarget, true)}
        onMouseLeave={(e) => onHover(e.currentTarget, false)}
        onFocus={(e) => onHover(e.currentTarget, true)}
        onBlur={(e) => onHover(e.currentTarget, false)}
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
