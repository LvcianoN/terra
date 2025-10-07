// ui6.3
import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  // original working data flow
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

    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: 400 * 2,
      height: 400 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      // 5) dot visibility bump
      mapBrightness: 5.6,
      // 3 & 6) palette tune: deep base, secondary markers, precise primary glow
      baseColor: [0.043, 0.110, 0.165],  // ~ #0B1C2A
      markerColor: [0.322, 0.698, 0.749], // ~ #52B2BF
      glowColor: [0.282, 0.667, 0.678],   // ~ #48AAAD
      markers: [],
      // 5) balance overall light
      opacity: 0.85,
      onRender: (state) => {
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        // 7) ui5 rotation speed kept
        phi += 0.008;
      },
    });

    return () => globe.destroy();
  }, []);

  // tokens
  const COLORS = {
    text: "rgba(255,255,255,0.92)",
    textWeak: "rgba(255,255,255,0.80)",
    border: "rgba(255,255,255,0.18)",
    pillBg: "rgba(255,255,255,0.06)",     // 2) darker pill for contrast
    creditBg: "rgba(255,255,255,0.05)",
    accent: "#48AAAD",
    secondary: "#52B2BF",
  } as const;

  // 2 & 7) background gradient, no noise, no top bar artifact
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    // 1) shift stack slightly upward
    justifyContent: "flex-start",
    padding: "20px 14px 40px",
    background:
      "radial-gradient(1000px 700px at 50% 6%, #0F1214 0%, rgba(15,18,20,0.66) 55%, #0A0B0C 100%)",
    color: COLORS.text,
    textRendering: "optimizeLegibility",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  };

  const headerWrap: React.CSSProperties = {
    textAlign: "center",
    marginBottom: 14, // 1) tighter spacing
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 32,
    lineHeight: 1.15,
    fontWeight: 800,
    margin: 0,
    letterSpacing: 0.2,
    textShadow: "0 2px 18px rgba(72,170,173,0.22)",
  };

  // 2) pill contrast & polish
  const counterPill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.pillBg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: COLORS.text, // stronger text
    fontSize: 15,
  };

  // 0) globe centering guarantee: use a grid wrapper that centers content
  const globeWrap: React.CSSProperties = {
    width: "100%",
    display: "grid",
    placeItems: "center", // horizontal AND vertical centering within area
  };

  const canvasStyle: React.CSSProperties = {
    // bigger than ui4 but mobile-safe
    width: "min(92vw, 580px)",
    height: "auto",
    aspectRatio: 1,
    display: "block",
    margin: "16px auto 0",
    // 6 & 10) glow thickness/hue per ui5
    filter: "drop-shadow(0 0 44px rgba(72,170,173,0.35))",
  };

  // 3 & 5) back link low-elevation, blends until hover
  const backLinkStyle: React.CSSProperties = {
    marginTop: 16,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${COLORS.border}`,
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 500, // reduced from 600
    fontSize: 14,
    outline: "2px solid transparent",
    outlineOffset: 2, // 8) focus comfort
    transition:
      "background 180ms ease, border-color 180ms ease, outline-color 180ms ease",
  };

  const creditStyle: React.CSSProperties = {
    // 4) pull closer to the back link
    marginTop: 8,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.creditBg,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: COLORS.textWeak,
    fontSize: 13,
  };

  const linkAccent: React.CSSProperties = {
    color: COLORS.secondary,
    textDecoration: "underline",
  };

  // simple hover/focus enhancement
  const onHover = (el: HTMLAnchorElement | null, on: boolean) => {
    if (!el) return;
    if (on) {
      el.style.background = "linear-gradient(180deg, rgba(72,170,173,0.18), rgba(72,170,173,0.10))";
      el.style.outlineColor = "color-mix(in oklab, white 45%, #48AAAD)";
      el.style.borderColor = "rgba(255,255,255,0.22)";
    } else {
      el.style.background = "rgba(255,255,255,0.05)";
      el.style.outlineColor = "transparent";
      el.style.borderColor = COLORS.border;
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerWrap}>
        <h1 style={titleStyle}>You are here.</h1>
        <div style={counterPill} aria-live="polite">
          <span>
            <b>{counter}</b> {counter === 1 ? "person" : "people"} connected
          </span>
        </div>
      </div>

      {/* 0) globe perfectly centered */}
      <div style={globeWrap}>
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
