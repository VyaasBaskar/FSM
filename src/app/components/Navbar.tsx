"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import "@/app/globals.css";
import MenuOption from "./MenuOption";
import SearchBar from "./SearchBar";

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
  const links = [
    { href: "/global/2025", label: "Explore Teams" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const [isMobile, setIsMobile] = React.useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [logoHovered, setLogoHovered] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isDashboardWithSelections =
    pathname === "/dashboard" &&
    searchParams.get("event") &&
    searchParams.get("team");

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
        overflowX: "hidden",
        overflowY: "visible",
      }}
    >
      <div
        style={{
          maxWidth: "83.5rem",
          margin: "0 auto",
          paddingLeft: isMobile ? "0.75rem" : "1rem",
          paddingRight: isMobile ? "0.75rem" : "1rem",
          overflowX: "hidden",
          overflowY: "visible",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "4rem",
            marginTop: "0.25rem",
            gap: isMobile ? "0.5rem" : "0.75rem",
            minWidth: 0,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
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
                width={isMobile ? 40 : 42}
                height={isMobile ? 44 : 47}
                className={
                  logoHovered ? "navbar-logo logo-hovered" : "navbar-logo"
                }
                style={{
                  zIndex: 1000,
                  marginLeft: isMobile ? "0.25rem" : "0.5rem",
                  transition: "filter 0.3s ease",
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  marginLeft: isMobile ? "0.5rem" : "1rem",
                  color: "var(--yellow-color)",
                  fontWeight: "bold",
                  fontSize: isMobile ? "1.4rem" : "1.5rem",
                  transition: "all 0.3s ease",
                  textShadow: logoHovered
                    ? "0 2px 8px var(--yellow-glow)"
                    : "0 1px 2px rgba(0, 0, 0, 0.08)",
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                FunkyStats
              </p>
            </div>
          </Link>

          {isDashboardWithSelections && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                color: "var(--foreground)",
                fontWeight: "600",
                fontSize: "1.2rem",
                letterSpacing: "-0.01em",
              }}
            >
              Dashboard
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: isMobile ? "0.5rem" : "0.75rem",
              alignItems: "center",
              flexWrap: "nowrap",
              flexShrink: 0,
              minWidth: 0,
              position: "relative",
              maxWidth: isMobile ? "30%" : "none",
            }}
          >
            {!isMobile && <SearchBar isMobile={false} />}
            {!isMobile &&
              links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{ flexShrink: 0 }}
                >
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
