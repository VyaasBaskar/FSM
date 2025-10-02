"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import "@/app/globals.css";
import ThemeToggle from "./ThemeToggle";

const navLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.75rem 1.25rem",
  borderRadius: "0.375rem",
  fontSize: "1.1rem",
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

  return (
    <nav
      style={{
        background: "var(--navbar-background)",
        color: "white",
        boxShadow: "0 2px 4px var(--navbar-highlight)",
        width: "100%",
        zIndex: 50,
        padding: "1.0rem 0",
      }}
    >
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          paddingLeft: "1rem",
          paddingRight: "0.25rem",
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
          <Link href="/">
            <div style={{ display: "flex", alignItems: "center" }}>
              <Image
                src="/logo846.png"
                alt="Logo"
                width={62}
                height={70}
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
                  fontSize: "2.0rem",
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
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <p style={navLinkStyle}>{link.label}</p>
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
