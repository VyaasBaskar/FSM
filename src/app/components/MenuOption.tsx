import React, { useState, useRef, useEffect } from "react";
import "@/app/globals.css";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";

const menOps0 = [{ label: "Home", value: "/" }];
const mobileOptions = [{ label: "Explore Teams", value: "/global/2025" }];

interface MenuOptionProps {
  isMobile?: boolean;
}

const MenuOption: React.FC<MenuOptionProps> = ({ isMobile }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const menuOptions = [...menOps0];

  if (isMobile) {
    menuOptions.push(...mobileOptions);
  }

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        display: "inline-block",
      }}
      onClick={() => setOpen((prev) => !prev)}
    >
      <button
        aria-label="Menu"
        style={{
          background: "none",
          border: "none",
          padding: isMobile ? 16 : 8,
          cursor: "pointer",
          outline: "none",
        }}
      >
        <div
          style={{
            width: isMobile ? 32 : 24,
            height: isMobile ? 32 : 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              height: 3,
              background: "var(--menu-color)",
              borderRadius: 2,
            }}
          />
          <span
            style={{
              height: 3,
              background: "var(--menu-color)",
              borderRadius: 2,
            }}
          />
          <span
            style={{
              height: 3,
              background: "var(--menu-color)",
              borderRadius: 2,
            }}
          />
        </div>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: isMobile ? 60 : 50,
            right: 0,
            background: "var(--option-bg)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            borderRadius: 6,
            padding: isMobile ? 20 : 12,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            zIndex: 100000,
            justifyContent: "center",
            alignItems: "center",
            minWidth: isMobile ? 180 : undefined,
          }}
        >
          {menuOptions.map((option) => (
            <Link
              key={option.value}
              style={{
                padding: isMobile ? "12px 12px" : "8px 8px",
                border: "none",
                background: "var(--button-bg)",
                borderRadius: 4,
                fontSize: isMobile ? 18 : 16,
                textDecoration: "underline",
                cursor: "pointer",
              }}
              href={option.value}
            >
              {option.label}
            </Link>
          ))}
          <ThemeToggle />
          <p style={{ fontStyle: "italic", fontSize: 12, marginTop: 4 }}>
            Developed by team 846
          </p>
        </div>
      )}
    </div>
  );
};

export default MenuOption;
