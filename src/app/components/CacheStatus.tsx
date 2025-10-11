"use client";

import { useState, useEffect } from "react";
import { getCacheManager } from "../lib/cache";

export default function CacheStatus() {
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    updateCacheSize();
  }, []);

  const updateCacheSize = async () => {
    try {
      const cache = getCacheManager();
      const keys = await cache.getAllKeys();
      setCacheSize(keys.length);
    } catch (error) {
      console.error("Error getting cache size:", error);
    }
  };

  const clearCache = async () => {
    if (
      confirm(
        "Are you sure you want to clear the cache? This will remove all locally stored data."
      )
    ) {
      try {
        const cache = getCacheManager();
        await cache.clear();
        setCacheSize(0);
        alert("Cache cleared successfully! The page will reload.");
        window.location.reload();
      } catch (error) {
        console.error("Error clearing cache:", error);
        alert("Failed to clear cache");
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
      }}
    >
      {isOpen ? (
        <div
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--foreground)",
            borderRadius: "8px",
            padding: "16px",
            minWidth: "200px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
              Cache Status
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                padding: "0",
                width: "24px",
                height: "24px",
                lineHeight: "1",
              }}
            >
              ×
            </button>
          </div>
          <p style={{ margin: "8px 0", fontSize: "12px" }}>
            Cached items: <strong>{cacheSize}</strong>
          </p>
          <button
            onClick={clearCache}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              marginTop: "8px",
            }}
          >
            Clear Cache
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsOpen(true);
            updateCacheSize();
          }}
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--foreground)",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            cursor: "pointer",
            fontSize: "24px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Cache Status"
        >
          💾
        </button>
      )}
    </div>
  );
}
