"use client";

export default function StatCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "var(--background-pred)",
        border: "2px solid var(--border-color)",
        borderRadius: 12,
        padding: "1.5rem",
        textAlign: "center",
        boxShadow:
          "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        transition: "transform 0.2s, box-shadow 0.2s",
        flex: "1 1 200px",
        minWidth: "200px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow =
          "0 12px 24px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)";
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: "700",
          color: "var(--gray-less)",
          letterSpacing: "0.05em",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          color: color || "var(--yellow-color)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: "0.875rem",
            color: "var(--gray-less)",
            marginTop: "0.5rem",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
