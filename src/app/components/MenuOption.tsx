import React, { useState, useRef, useEffect } from "react";
import "@/app/globals.css";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import { getCacheManager } from "@/app/lib/cache";

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

  const handleClearCache = async () => {
    if (
      confirm(
        "Are you sure you want to clear the cache? This will remove all locally stored data and reload the page."
      )
    ) {
      try {
        const cache = getCacheManager();
        await cache.clear();
        alert("Cache cleared successfully! The page will reload.");
        window.location.reload();
      } catch (error) {
        console.error("Error clearing cache:", error);
        alert("Failed to clear cache");
      }
    }
  };

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

  const [menuHovered, setMenuHovered] = useState(false);

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
        onMouseEnter={() => setMenuHovered(true)}
        onMouseLeave={() => setMenuHovered(false)}
        style={{
          background:
            menuHovered || open ? "var(--menu-hover-bg)" : "transparent",
          border: "2px solid",
          borderColor:
            menuHovered || open ? "var(--yellow-color)" : "rgba(0, 0, 0, 0.1)",
          padding: isMobile ? 12 : 8,
          cursor: "pointer",
          outline: "none",
          borderRadius: "0.5rem",
          transition: "all 0.3s ease",
          transform: menuHovered ? "scale(1.05)" : "scale(1)",
          boxShadow: open ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none",
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
              transition: "all 0.3s ease",
              transform: open ? "rotate(45deg) translateY(7px)" : "none",
            }}
          />
          <span
            style={{
              height: 3,
              background: "var(--menu-color)",
              borderRadius: 2,
              transition: "all 0.3s ease",
              opacity: open ? 0 : 1,
            }}
          />
          <span
            style={{
              height: 3,
              background: "var(--menu-color)",
              borderRadius: 2,
              transition: "all 0.3s ease",
              transform: open ? "rotate(-45deg) translateY(-7px)" : "none",
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
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--navbar-border)",
            borderRadius: 12,
            padding: isMobile ? 20 : 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            zIndex: 100000,
            justifyContent: "center",
            alignItems: "center",
            minWidth: isMobile ? 180 : 200,
            animation: "slideDown 0.3s ease",
          }}
        >
          {menuOptions.map((option, index) => (
            <Link
              key={option.value}
              style={{
                padding: isMobile ? "12px 20px" : "10px 16px",
                border: "none",
                background: "transparent",
                borderRadius: 8,
                fontSize: isMobile ? 17 : 15,
                textDecoration: "none",
                cursor: "pointer",
                color: "var(--option-text)",
                width: "100%",
                textAlign: "center",
                fontWeight: 500,
                transition: "all 0.2s ease",
                animation: `slideIn 0.3s ease ${index * 0.05}s both`,
              }}
              href={option.value}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--menu-item-hover-bg)";
                e.currentTarget.style.color = "var(--yellow-color)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--option-text)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              {option.label}
            </Link>
          ))}
          <ThemeToggle />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClearCache();
            }}
            style={{
              padding: isMobile ? "12px 16px" : "10px 14px",
              border: "2px solid var(--clear-cache-border)",
              background: "var(--clear-cache-bg)",
              borderRadius: 8,
              fontSize: isMobile ? 15 : 14,
              cursor: "pointer",
              color: "var(--clear-cache-text)",
              fontWeight: "600",
              transition: "all 0.3s ease",
              width: "100%",
              animation: "slideIn 0.3s ease 0.15s both",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--clear-cache-hover-bg)";
              e.currentTarget.style.borderColor = "#ff4444";
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(255, 68, 68, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--clear-cache-bg)";
              e.currentTarget.style.borderColor = "var(--clear-cache-border)";
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            ✖ Clear Cache
          </button>
          <p
            style={{
              fontStyle: "italic",
              fontSize: 12,
              marginTop: 4,
              color: "var(--option-text)",
            }}
          >
            Developed by team 846
          </p>
        </div>
      )}
    </div>
  );
};

export default MenuOption;
