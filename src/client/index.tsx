// ui6
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
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let phi = 0;

    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: 520 * 2, // larger than ui4, still fits mobile through CSS sizing
      height: 520 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 5,
      baseColor: [0.12, 0.36, 0.72], // blue base that matches the glow
      markerColor: [0.0, 0.9, 1.0],  // cyan markers
      glowColor: [0.25, 0.65, 1.0],  // cyan glow thickness like ui5
      markers: [],
      opacity: 0.85,
      onRender: (state) => {
        state.markers = Array.from(positions.current.values());
        state.phi = phi;
        phi += prefersReduced ? 0.002 : 0.008; // ui5 rotation speed
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  // subtle gradient background, no noise, no top bar
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "28px 16px 40px",
    color: "rgba(255,255,255,0.92)",
    background:
      "radial-gradient(900px 600px at 50% -10%, #0F1214 0%, rgba(15,18,20,0) 60%), linear-gradient(#0A0B0C, #0F1214)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  };

  const headerWrap: React.CSSProperties = {
    width: "100%",
    maxWidth: 760,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 10,
    marginBottom: 16,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 0.2,
    margin: 0,
    textShadow: "0 2px 16px rgba(72,170,173,0.25)",
  };

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 999,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
  };

  const footerWrap: React.CSSProperties = {
    marginTop: 18,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  };

  const subtlePill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textDecoration: "none",
    transition: "background 180ms ease, outline-color 150ms ease",
    outline: "2px solid transparent",
  };

  const subtlePillHover = {
    background: "linear-gradient(180deg, rgba(72,170,173,0.20), rgba(72,170,173,0.10))",
    outlineColor: "color-mix(in oklab, white 45%, #48AAAD)",
  } as React.CSSProperties;

  const setHover = (el: HTMLAnchorElement | null, on: boolean) => {
    if (!el) return;
    Object.assign(el.style, on ? subtlePillHover : {});
    if (!on) {
      el.style.background = "rgba(255,255,255,0.08)";
      el.style.outlineColor = "transparent";
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerWrap}>
        <h1 style={titleStyle}>You are here.</h1>
        <div style={chipStyle} aria-live="polite">
          <b style={{ marginRight: 6 }}>{counter}</b>{" "}
          {counter === 1 ? "person" : "people"} connected
        </div>
      </div>

      {/* Globe, centered, no container behind it */}
      <canvas
        ref={canvasRef as LegacyRef<HTMLCanvasElement>}
        style={{
          width: "min(92vw, 520px)", // larger than ui4, fits mobile
          height: "auto",
          aspectRatio: 1,
          display: "block",
          margin: "0 auto",
        }}
      />

      {/* Subtle controls under the globe */}
      <div style={footerWrap}>
        <a
          href="https://narno.work"
          target="_blank"
          rel="noreferrer"
          style={subtlePill}
          onMouseEnter={(e) => setHover(e.currentTarget, true)}
          onMouseLeave={(e) => setHover(e.currentTarget, false)}
          aria-label="Back to narno.work"
        >
          ← Back to narno.work
        </a>

        <div style={{ ...subtlePill, fontSize: 13 }}>
          Luciano's Lab • Spinning thing by{" "}
          <a
            href="https://cobe.vercel.app/"
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#52
