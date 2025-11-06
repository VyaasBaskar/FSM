"use client";

import { useState, useEffect, memo } from "react";

type DataPoint = {
  year: number;
  normFSM: number;
  isPrediction?: boolean;
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

        {(() => {
          if (allStats.length === 0) return null;
          if (allStats.length === 1) {
            const x =
              leftPadding +
              (0 * (width - leftPadding - rightPadding)) /
                (allStats.length - 1);
            const y =
              height -
              bottomPadding -
              ((allStats[0].normFSM - adjustedMinFSM) /
                (adjustedMaxFSM - adjustedMinFSM || 1)) *
                (height - topPadding - bottomPadding);
            return (
              <path
                d={`M ${x},${y}`}
                fill="none"
                stroke={allStats[0].isPrediction ? "#f59e0b" : "#0070f3"}
                strokeWidth={allStats[0].isPrediction ? "2" : "3"}
                strokeDasharray={allStats[0].isPrediction ? "8,4" : "none"}
              />
            );
          }

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
            isPrediction: s.isPrediction || false,
          }));

          const predictionStartIndex = allStats.findIndex(
            (s) => s.isPrediction
          );
          const hasPredictions = predictionStartIndex >= 0;

          const buildPath = (startIdx: number, endIdx: number) => {
            if (startIdx >= endIdx) return "";
            if (startIdx === endIdx - 1) {
              return `M ${coords[startIdx].x},${coords[startIdx].y} L ${coords[endIdx].x},${coords[endIdx].y}`;
            }

            const n = endIdx - startIdx + 1;
            const points = coords.slice(startIdx, endIdx + 1);

            const slopes: number[] = [];
            for (let i = 0; i < n; i++) {
              if (i === 0) {
                slopes.push(
                  (points[1].y - points[0].y) / (points[1].x - points[0].x)
                );
              } else if (i === n - 1) {
                slopes.push(
                  (points[n - 1].y - points[n - 2].y) /
                    (points[n - 1].x - points[n - 2].x)
                );
              } else {
                const dx1 = points[i].x - points[i - 1].x;
                const dx2 = points[i + 1].x - points[i].x;
                const dy1 = points[i].y - points[i - 1].y;
                const dy2 = points[i + 1].y - points[i].y;

                const slope1 = dy1 / dx1;
                const slope2 = dy2 / dx2;

                if (slope1 * slope2 <= 0) {
                  slopes.push(0);
                } else {
                  const w1 = dx2 / (dx1 + dx2);
                  const w2 = dx1 / (dx1 + dx2);
                  slopes.push(w1 * slope1 + w2 * slope2);
                }
              }
            }

            let path = `M ${points[0].x},${points[0].y}`;

            for (let i = 0; i < n - 1; i++) {
              const p0 = points[i];
              const p1 = points[i + 1];
              const m0 = slopes[i];
              const m1 = slopes[i + 1];

              const dx = p1.x - p0.x;
              const dy = p1.y - p0.y;
              const delta = dy / dx;

              if (Math.abs(delta) < 1e-10) {
                path += ` L ${p1.x},${p1.y}`;
                continue;
              }

              const alpha = m0 / delta;
              const beta = m1 / delta;

              if (alpha < 0 || beta < 0 || alpha > 3 || beta > 3) {
                const tau = 1 / 3;
                const cp1x = p0.x + dx * tau;
                const cp1y = p0.y + m0 * dx * tau;
                const cp2x = p1.x - dx * tau;
                const cp2y = p1.y - m1 * dx * tau;
                path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
              } else {
                const tau = 1 / 3;
                const cp1x = p0.x + dx * tau;
                let cp1y = p0.y + m0 * dx * tau;
                const cp2x = p1.x - dx * tau;
                let cp2y = p1.y - m1 * dx * tau;

                if (delta > 0) {
                  cp1y = Math.max(p0.y, Math.min(p1.y, cp1y));
                  cp2y = Math.max(p0.y, Math.min(p1.y, cp2y));
                } else {
                  cp1y = Math.min(p0.y, Math.max(p1.y, cp1y));
                  cp2y = Math.min(p0.y, Math.max(p1.y, cp2y));
                }

                path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
              }
            }

            return path;
          };

          if (!hasPredictions) {
            return (
              <path
                d={buildPath(0, coords.length - 1)}
                fill="none"
                stroke="#0070f3"
                strokeWidth="3"
              />
            );
          }

          return (
            <>
              <path
                d={buildPath(0, coords.length - 1)}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
              {predictionStartIndex > 0 && (
                <path
                  d={buildPath(0, predictionStartIndex)}
                  fill="none"
                  stroke="#0070f3"
                  strokeWidth="3"
                />
              )}
            </>
          );
        })()}

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
          const isPredicted = s.isPrediction === true;
          const pointColor = isPredicted ? "#f59e0b" : "#0070f3";

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
                fill={pointColor}
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
          const isPredicted = s.isPrediction === true;
          return (
            <text
              key={s.year}
              x={x}
              y={height - bottomPadding + 15}
              fontSize={fontSize}
              textAnchor="middle"
              fill={isPredicted ? "#f59e0b" : "#fff"}
              fontWeight={isPredicted ? "bold" : "normal"}
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
            background: hoveredPoint.isPrediction
              ? "rgba(245, 158, 11, 0.95)"
              : "rgba(0, 0, 0, 0.8)",
            color: hoveredPoint.isPrediction ? "#000" : "#fff",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            pointerEvents: "none",
            zIndex: 1000,
            whiteSpace: "nowrap",
            border: hoveredPoint.isPrediction ? "2px solid #f59e0b" : "none",
          }}
        >
          <div>
            <strong>{hoveredPoint.year}</strong>
            {hoveredPoint.isPrediction && (
              <span style={{ marginLeft: "6px", fontSize: "12px" }}>
                (Predicted)
              </span>
            )}
          </div>
          <div>Normalized FSM: {hoveredPoint.normFSM.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
}

export default memo(InteractiveChart);
