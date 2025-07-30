"use client";
/* eslint-disable */

import { useState, useEffect, useRef } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = (saved === "light" || saved === "dark") ? saved : system;
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const newTheme = theme === "light" ? "dark" : "light";
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const d = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(window.innerWidth - cx, cy),
        Math.hypot(cx, window.innerHeight - cy),
        Math.hypot(window.innerWidth - cx, window.innerHeight - cy)
      );
      const overlay = document.createElement("div");
      overlay.style.cssText = [
        "position:fixed",
        `width:${d * 2}px`,
        `height:${d * 2}px`,
        `background:${theme === "light" ? "#fff" : "#0a0a0a"}`,
        "border-radius:50%",
        `left:${cx - d}px`,
        `top:${cy - d}px`,
        "z-index:-1",
        "pointer-events:none",
        "transform:scale(1)",
        "transform-origin:center"
      ].join(";");
      document.body.appendChild(overlay);
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      overlay.animate([
        { transform: "scale(1)" },
        { transform: "scale(0)" }
      ], {
        duration: 500,
        easing: "cubic-bezier(0.25,0.46,0.45,0.94)"
      }).addEventListener("finish", () => {
        document.body.removeChild(overlay);
        setIsAnimating(false);
      });
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      disabled={isAnimating}
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 1000,
        background: "var(--foreground)",
        color: "var(--background)",
        border: "none",
        borderRadius: "50%",
        width: 48,
        height: 48,
        cursor: isAnimating ? "not-allowed" : "pointer",
        fontSize: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        opacity: isAnimating ? 0.7 : 1,
        transform: isAnimating ? "scale(0.95)" : "scale(1)"
      }}
    >
      {theme === "light"
        ? <span role="img" aria-label="moon" style={{ fontSize: 32 }}>⏾</span>
        : <span role="img" aria-label="sun" style={{ fontSize: 24 }}>☀︎</span>}
    </button>
  );
}
