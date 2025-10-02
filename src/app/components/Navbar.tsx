"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect } from "react";
import "@/app/globals.css";
import MenuOption from "./MenuOption";

const navLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.75rem 1.25rem",
  borderRadius: "0.375rem",
  fontSize: "0.9rem",
  fontWeight: 500,
  background: "#0070f3",
  color: "white",
  textDecoration: "none",
  cursor: "pointer",
  border: "none",
  outline: "none",
  boxSizing: "border-box",
};

export default function Navbar() {
  const links = [{ href: "/global/2025", label: "Explore Teams" }];

  const [isMobile, setIsMobile] = React.useState(false);

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
        boxShadow: "0 2px 4px var(--navbar-highlight)",
        width: "100%",
        zIndex: 10,
        padding: "0.5rem 0",
        paddingTop: "3.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "83.5rem",
          margin: "0 auto",
          paddingLeft: "0.75rem",
          paddingRight: "0.5rem",
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
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Image
                src="/logo846.png"
                alt="Logo"
                width={42}
                height={47}
                style={{
                  zIndex: 1000,
                  marginLeft: "1rem",
                }}
              />
              <p
                style={{
                  marginLeft: "1rem",
                  color: "var(--yellow-color)",
                  fontWeight: "bold",
                  fontSize: "1.5rem",
                }}
              >
                FunkyStats
              </p>
            </div>
          </Link>
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
            }}
          >
            {!isMobile &&
              links.map((link) => (
                <Link key={link.href} href={link.href}>
                  <p style={navLinkStyle}>{link.label}</p>
                </Link>
              ))}
            <MenuOption isMobile={isMobile} />
          </div>
        </div>
      </div>
    </nav>
  );
}
