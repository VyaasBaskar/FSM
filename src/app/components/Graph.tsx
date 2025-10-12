"use client";

import { useState, useEffect, memo } from "react";

type DataPoint = {
  year: number;
  normFSM: number;
};

type InteractiveChartProps = {
  allStats: DataPoint[];
  minPossibleFSM: number;
  maxPossibleFSM: number;
};

function InteractiveChart({
  allStats,
  minPossibleFSM,
  maxPossibleFSM,
}: InteractiveChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;
      const isMobile = screenWidth < 768;

      if (isMobile) {
        setDimensions({
          width: Math.min(screenWidth - 60, 400),
          height: 300,
        });
      } else {
        setDimensions({
          width: screenWidth * 0.95,
          height: 600,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const { width, height } = dimensions;
  const isMobile = width < 500;
  const leftPadding =
    maxPossibleFSM > 999 ? (isMobile ? 50 : 60) : isMobile ? 40 : 50;
  const rightPadding = isMobile ? 15 : 30;
  const topPadding = 30;
  const bottomPadding = isMobile ? 40 : 35;

  const adjustedMinFSM = Math.min(minPossibleFSM, 1450);
  const adjustedMaxFSM = Math.max(maxPossibleFSM, 1550);

  const filteredStats =
    allStats.length > 1
      ? allStats.filter(
          (s) => s.normFSM !== Math.min(...allStats.map((d) => d.normFSM))
        )
      : allStats;

  const avgFSM =
    filteredStats.length > 0
      ? Math.sqrt(
          filteredStats.reduce((sum, s) => sum + s.normFSM * s.normFSM, 0) /
            filteredStats.length
        )
      : 0;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePos({
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      });
    }
  };

  const handlePointInteraction = (
    point: DataPoint,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    setHoveredPoint(point);
    const rect = e.currentTarget.getBoundingClientRect();

    if ("touches" in e && e.touches.length > 0) {
      setMousePos({
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      });
    } else if ("clientX" in e) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "95%",
        margin: "0 auto",
        padding: "0 20px",
      }}
    >
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        style={{
          display: "block",
          maxWidth: "100%",
          height: "auto",
          touchAction: "manipulation",
        }}
      >
        {Array.from(
          { length: (adjustedMaxFSM - adjustedMinFSM) / 50 + 1 },
          (_, i) => {
            const v = adjustedMinFSM + i * 50;
            const y =
              height -
              bottomPadding -
              ((v - adjustedMinFSM) / (adjustedMaxFSM - adjustedMinFSM)) *
                (height - topPadding - bottomPadding);
            const fontSize = isMobile ? "10" : "12";
            return (
              <g key={v}>
                <line
                  x1={leftPadding}
                  y1={y}
                  x2={width - rightPadding}
                  y2={y}
                  stroke="#bbb"
                  strokeWidth="0.5"
                />
                <text
                  x={leftPadding - 8}
                  y={y + 4}
                  fontSize={fontSize}
                  textAnchor="end"
                  fill="#fff"
                >
                  {v}
                </text>
              </g>
            );
          }
        )}

        <text
          x={leftPadding - 40}
          y={height / 2 - 5}
          fontSize={isMobile ? "10" : "18"}
          textAnchor="middle"
          fill="#fff"
          transform={`rotate(-90,${leftPadding - 40},${height / 2})`}
        >
          Normalized FSM
        </text>

        {allStats.length > 0 && (
          <>
            <line
              x1={leftPadding}
              x2={width - rightPadding}
              y1={
                height -
                bottomPadding -
                ((avgFSM - adjustedMinFSM) /
                  (adjustedMaxFSM - adjustedMinFSM)) *
                  (height - topPadding - bottomPadding)
              }
              y2={
                height -
                bottomPadding -
                ((avgFSM - adjustedMinFSM) /
                  (adjustedMaxFSM - adjustedMinFSM)) *
                  (height - topPadding - bottomPadding)
              }
              stroke="yellow"
              strokeDasharray="5,3"
              strokeWidth="1.5"
            />
          </>
        )}

        {1500 >= adjustedMinFSM && 1500 <= adjustedMaxFSM && (
          <>
            <line
              x1={leftPadding}
              x2={width - rightPadding}
              y1={
                height -
                bottomPadding -
                ((1500 - adjustedMinFSM) / (adjustedMaxFSM - adjustedMinFSM)) *
                  (height - topPadding - bottomPadding)
              }
              y2={
                height -
                bottomPadding -
                ((1500 - adjustedMinFSM) / (adjustedMaxFSM - adjustedMinFSM)) *
                  (height - topPadding - bottomPadding)
              }
              stroke="red"
              strokeDasharray="5,3"
              strokeWidth="1.5"
            />
            <text
              x={width - rightPadding - 5}
              y={
                height -
                bottomPadding -
                ((1500 - adjustedMinFSM) / (adjustedMaxFSM - adjustedMinFSM)) *
                  (height - topPadding - bottomPadding) -
                5
              }
              textAnchor="end"
              fontSize={isMobile ? "10" : "12"}
              fill="red"
            >
              Baseline
            </text>
          </>
        )}

        <path
          fill="none"
          stroke="#0070f3"
          strokeWidth="3"
          d={(() => {
            if (allStats.length === 0) return "";
            if (allStats.length === 1) {
              const x = leftPadding;
              const y =
                height -
                bottomPadding -
                ((allStats[0].normFSM - adjustedMinFSM) /
                  (adjustedMaxFSM - adjustedMinFSM || 1)) *
                  (height - topPadding - bottomPadding);
              return `M ${x},${y}`;
            }

            let path = "";
            const coords = allStats.map((s, i) => ({
              x:
                leftPadding +
                (i * (width - leftPadding - rightPadding)) /
                  (allStats.length - 1),
              y:
                height -
                bottomPadding -
                ((s.normFSM - adjustedMinFSM) /
                  (adjustedMaxFSM - adjustedMinFSM || 1)) *
                  (height - topPadding - bottomPadding),
            }));

            path += `M ${coords[0].x},${coords[0].y}`;

            for (let i = 1; i < coords.length; i++) {
              const prev = coords[i - 1];
              const curr = coords[i];
              const next = coords[i + 1];

              const tension = 0.15;
              const dx1 = next
                ? (next.x - prev.x) * tension
                : (curr.x - prev.x) * tension;
              const dy1 = next
                ? (next.y - prev.y) * tension
                : (curr.y - prev.y) * tension;

              const cp1x = prev.x + dx1;
              const cp1y = prev.y + dy1;
              const cp2x = curr.x - dx1;
              const cp2y = curr.y - dy1;

              path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
            }

            return path;
          })()}
        />

        <line
          x1={leftPadding}
          y1={height - bottomPadding}
          x2={width - rightPadding}
          y2={height - bottomPadding}
          stroke="#bbb"
        />
        <line
          x1={leftPadding}
          y1={topPadding}
          x2={leftPadding}
          y2={height - bottomPadding}
          stroke="#bbb"
        />

        {allStats.map((s, i) => {
          const x =
            leftPadding +
            (i * (width - leftPadding - rightPadding)) / (allStats.length - 1);
          const y =
            height -
            bottomPadding -
            ((s.normFSM - adjustedMinFSM) /
              (adjustedMaxFSM - adjustedMinFSM || 1)) *
              (height - topPadding - bottomPadding);
          const radius = isMobile ? 5 : 6;
          const hoverRadius = isMobile ? 7 : 8;
          const touchAreaRadius = isMobile ? 15 : 10;

          return (
            <g key={s.year}>
              <circle
                cx={x}
                cy={y}
                r={touchAreaRadius}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint(s)}
                onMouseLeave={() => setHoveredPoint(null)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handlePointInteraction(s, e);
                }}
                onTouchEnd={() => {
                  if (isMobile) {
                    setTimeout(() => setHoveredPoint(null), 2000);
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handlePointInteraction(s, e);
                  if (isMobile) {
                    setTimeout(() => setHoveredPoint(null), 2000);
                  }
                }}
              />
              <circle
                cx={x}
                cy={y}
                r={hoveredPoint?.year === s.year ? hoverRadius : radius}
                fill="#0070f3"
                stroke="#fff"
                strokeWidth="2"
                style={{ pointerEvents: "none" }}
              />
            </g>
          );
        })}

        {allStats.map((s, i) => {
          const x =
            leftPadding +
            (i * (width - leftPadding - rightPadding)) / (allStats.length - 1);
          const fontSize = isMobile ? "10" : "13";
          return (
            <text
              key={s.year}
              x={x}
              y={height - bottomPadding + 15}
              fontSize={fontSize}
              textAnchor="middle"
              fill="#fff"
            >
              {(s.year % 100).toString().padStart(2, "0")}
            </text>
          );
        })}
      </svg>

      {hoveredPoint && (
        <div
          style={{
            position: "absolute",
            left: mousePos.x + 10,
            top: mousePos.y - 10,
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            pointerEvents: "none",
            zIndex: 1000,
            whiteSpace: "nowrap",
          }}
        >
          <div>
            <strong>{hoveredPoint.year}</strong>
          </div>
          <div>Normalized FSM: {hoveredPoint.normFSM.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
}

export default memo(InteractiveChart);
