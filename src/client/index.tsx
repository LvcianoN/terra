// ui5
import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  // keep original working refs and logic
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
    // rotation respects reduced motion
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      baseColor: [0.12, 0.36, 0.72], // rich blue base
      markerColor: [0.0, 0.9, 1.0],  // cyan markers
      glowColor: [0.25, 0.65, 1.0],  // cyan glow
      markers: [],
      opacity: 0.85,
      onRender: (state) => {
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        phi += prefersReduced ? 0.002 : 0.008;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  // inline styles to achieve the requested “glass” look without touching CSS
  const tokens = {
    primary: "#48AAAD",
    accentDark: "#016064",
    secondary: "#52B2BF",

    bgStart: "#0A0B0C",
    bgEnd: "#0F1214",

    glassFill: "rgba(255,255,255,0.14)",
    glassBorder: "rgba(255,255,255,0.35)",
    glassBlur: "24px",

    radiusXL: 24,
    radiusLG: 16,
    shadow1: "0 8px 24px rgba(0,0,0,0.12)",
  } as const;

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "32px 16px 48px",
    color: "rgba(255,255,255,0.92)",
    background: `radial-gradient(1200px 800px at 50% -10%, ${tokens.bgEnd}, transparent 60%), linear-gradient(${tokens.bgStart}, ${tokens.bgEnd})`,
  };

  const headerWrap: React.CSSProperties = {
    width: "100%",
    maxWidth: 640,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
    textAlign: "center",
    marginBottom: 16,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    fontSize: 32,
    lineHeight: 1.15,
    letterSpacing: 0.2,
    fontWeight: 800,
    margin: 0,
    textShadow: "0 2px 18px rgba(72,170,173,0.25)",
  };

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 999,
    backdropFilter: `blur(${tokens.glassBlur})`,
    WebkitBackdropFilter: `blur(${tokens.glassBlur})`,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 60%)",
    border: `1px solid ${tokens.glassBorder}`,
    boxShadow: tokens.shadow1,
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
  };

  const globeCard: React.CSSProperties = {
    position: "relative",
    width: "min(92vw, 520px)",
    borderRadius: tokens.radiusXL,
    padding: 20,
    marginTop: 12,
    backdropFilter: `blur(${tokens.glassBlur})`,
    WebkitBackdropFilter: `blur(${tokens.glassBlur})`,
    background: "rgba(255,255,255,0.10)",
    border: `1px solid ${tokens.glassBorder}`,
    boxShadow: tokens.shadow1,
  };

  // soft ring glow around the card
  const ring: React.CSSProperties = {
    position: "absolute",
    inset: -2,
    borderRadius: tokens.radiusXL + 2,
    pointerEvents: "none",
    boxShadow: `0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 60px 8px rgba(72,170,173,0.40)`,
  };

  const footerWrap: React.CSSProperties = {
    marginTop: 28,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  };

  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 999,
    backdropFilter: `blur(${tokens.glassBlur})`,
    WebkitBackdropFilter: `blur(${tokens.glassBlur})`,
    background: "rgba(255,255,255,0.08)",
    border: `1px solid ${tokens.glassBorder}`,
    color: "rgba(255,255,255,0.80)",
    fontSize: 13,
  };

  const linkBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: tokens.radiusLG,
    border: `1px solid rgba(255,255,255,0.22)`,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)",
    color: "#fff",
    fontWeight: 600,
    textDecoration: "none",
    outline: "2px solid transparent",
    transition: "transform 180ms ease, background 180ms ease, outline-color 150ms ease",
  };

  const linkBtnHover: React.CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(72,170,173,0.25) 0%, rgba(72,170,173,0.12) 100%)",
    outlineColor: "color-mix(in oklab, white 45%, #48AAAD)",
  };

  // small helper for hover effect without external CSS
  const setHover = (el: HTMLAnchorElement | null, on: boolean) => {
    if (!el) return;
    Object.assign(el.style, on ? linkBtnHover : {});
    if (!on) {
      // reset inline styles we changed
      el.style.background =
        "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)";
      el.style.outlineColor = "transparent";
    }
  };

  return (
    <div style={pageStyle}>
      {/* Header + chip */}
      <div style={headerWrap}>
        <h1 style={titleStyle}>Where's everyone at?</h1>
        <div style={chipStyle} aria-live="polite">
          <span>
            <b>{counter}</b> {counter === 1 ? "person" : "people"} connected
          </span>
        </div>
      </div>

      {/* Glass card with soft ring glow */}
      <div style={globeCard} role="region" aria-label="Live globe">
        <div style={ring} />
        <canvas
          ref={canvasRef as LegacyRef<HTMLCanvasElement>}
          style={{
            width: "100%",
            height: "auto",
            maxWidth: 480,
            aspectRatio: 1,
            display: "block",
            margin: "0 auto",
          }}
        />
      </div>

      {/* Footer area with nav button and credit pill */}
      <div style={footerWrap}>
        <a
          href="https://narno.work"
          target="_blank"
          rel="noreferrer"
          aria-label="Back to narno.work"
          style={linkBtn}
          onMouseEnter={(e) => setHover(e.currentTarget, true)}
          onMouseLeave={(e) => setHover(e.currentTarget, false)}
        >
          ← Back to narno.work
        </a>

        <div style={pill}>
          <span>Luciano's Lab • Spinning thing by&nbsp;</span>
          <a
            href="https://cobe.vercel.app/"
            target="_blank"
            rel="noreferrer"
            style={{ color: tokens.secondary, textDecoration: "underline" }}
          >
            Cobe
          </a>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
