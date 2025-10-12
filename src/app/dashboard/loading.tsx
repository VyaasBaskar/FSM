"use client";

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        color: "var(--foreground)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            border: "4px solid var(--border-color)",
            borderTop: "4px solid var(--yellow-color)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ fontSize: "1.1rem", fontWeight: "600" }}>
          Loading Dashboard...
        </p>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
