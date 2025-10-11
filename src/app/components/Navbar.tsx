"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import "@/app/globals.css";
import MenuOption from "./MenuOption";

const navLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.625rem 1.25rem",
  borderRadius: "0.5rem",
  fontSize: "0.9375rem",
  fontWeight: 600,
  background: "var(--nav-button-bg)",
  color: "var(--nav-button-text)",
  textDecoration: "none",
  cursor: "pointer",
  border: "none",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
};

export default function Navbar() {
  const links = [{ href: "/global/2025", label: "Explore Teams" }];

  const [isMobile, setIsMobile] = React.useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [logoHovered, setLogoHovered] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initial = saved === "light" || saved === "dark" ? saved : system;
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  React.useEffect(() => {
    function handleResize() {
      const aspectRatio = window.innerWidth / window.innerHeight;
      setIsMobile(aspectRatio < 1);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav
      style={{
        background: "var(--navbar-background)",
        color: "white",
        boxShadow:
          "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        borderBottom: "1px solid var(--navbar-border)",
        width: "100%",
        zIndex: 10,
        padding: "0.5rem 0",
        paddingTop: "3.5rem",
        position: "relative",
      }}
    >
      <div
        style={{
          maxWidth: "83.5rem",
          margin: "0 auto",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "4rem",
            marginTop: "0.25rem",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <div
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                transition: "transform 0.3s ease",
                transform: logoHovered ? "scale(1.05)" : "scale(1)",
              }}
            >
              <Image
                src="/logo846.png"
                alt="Logo"
                width={42}
                height={47}
                className={`navbar-logo ${logoHovered ? "logo-hovered" : ""}`}
                style={{
                  zIndex: 1000,
                  marginLeft: "0.5rem",
                  transition: "filter 0.3s ease",
                }}
              />
              <p
                style={{
                  marginLeft: "1rem",
                  color: "var(--yellow-color)",
                  fontWeight: "bold",
                  fontSize: "1.5rem",
                  transition: "all 0.3s ease",
                  textShadow: logoHovered
                    ? "0 2px 8px var(--yellow-glow)"
                    : "0 1px 2px rgba(0, 0, 0, 0.08)",
                  letterSpacing: "-0.02em",
                }}
              >
                FunkyStats
              </p>
            </div>
          </Link>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            {!isMobile &&
              links.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                    style={{
                      ...navLinkStyle,
                      transform:
                        hoveredLink === link.href
                          ? "translateY(-1px)"
                          : "translateY(0)",
                      boxShadow:
                        hoveredLink === link.href
                          ? "0 4px 12px var(--nav-button-shadow), 0 2px 4px rgba(0, 0, 0, 0.06)"
                          : "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
                      background:
                        hoveredLink === link.href
                          ? "var(--nav-button-bg-hover)"
                          : "var(--nav-button-bg)",
                    }}
                  >
                    {link.label}
                  </div>
                </Link>
              ))}
            <MenuOption isMobile={isMobile} />
          </div>
        </div>
      </div>
    </nav>
  );
}
