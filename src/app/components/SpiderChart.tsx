"use client";

export interface SpiderChartMetric {
  label: string;
  value: number;
}

interface SpiderChartProps {
  metrics: SpiderChartMetric[];
  size?: number;
  showLabels?: boolean;
  title?: string;
}

export default function SpiderChart({
  metrics,
  size = 240,
  showLabels = true,
  title,
}: SpiderChartProps) {
  const hasData = metrics.length > 0 && metrics.some((m) => m.value > 0);
  if (!hasData) return null;

  const maxVal = Math.max(...metrics.map((m) => m.value), 1);
  const n = metrics.length;
  const cx = 120;
  const cy = 110;
  const R = 80;
  const angleStep = (2 * Math.PI) / n;

  const polyPoints = metrics
    .map((m, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = (m.value / maxVal) * R;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const heightRatio = 230 / 240;
  const displayHeight = Math.round(size * heightRatio);

  return (
    <div
      style={{
        background: "var(--background-pred)",
        border: title || showLabels ? "2px solid var(--border-color)" : "none",
        borderRadius: 12,
        padding: title || showLabels ? "1rem" : "0.25rem",
        textAlign: "center",
      }}
    >
      {title && (
        <h3
          style={{
            color: "var(--foreground)",
            fontSize: "1.1rem",
            fontWeight: "700",
            marginBottom: "0.75rem",
          }}
        >
          {title}
        </h3>
      )}
      <svg
        viewBox="0 0 240 230"
        style={{
          width: size,
          height: displayHeight,
          display: "block",
          margin: "0 auto",
        }}
      >
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={metrics
              .map((_, i) => {
                const angle = -Math.PI / 2 + i * angleStep;
                const r = level * R;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
              })
              .join(" ")}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={0.5}
          />
        ))}
        {metrics.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + R * Math.cos(angle)}
              y2={cy + R * Math.sin(angle)}
              stroke="var(--border-color)"
              strokeWidth={0.5}
            />
          );
        })}
        <polygon
          points={polyPoints}
          fill="rgba(234, 179, 8, 0.25)"
          stroke="var(--yellow-color)"
          strokeWidth={2}
        />
        {metrics.map((m, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const r = (m.value / maxVal) * R;
          return (
            <circle
              key={i}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r={3}
              fill="var(--yellow-color)"
            />
          );
        })}
        {showLabels &&
          metrics.map((m, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const labelR = R + 18;
            return (
              <text
                key={i}
                x={cx + labelR * Math.cos(angle)}
                y={cy + labelR * Math.sin(angle)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={600}
                fill="var(--foreground)"
              >
                {m.label} ({m.value.toFixed(1)})
              </text>
            );
          })}
      </svg>
    </div>
  );
}
