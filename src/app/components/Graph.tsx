"use client";

import { useState } from "react";

type DataPoint = {
  year: number;
  normFSM: number;
};

type InteractiveChartProps = {
  allStats: DataPoint[];
  width: number;
  height: number;
  leftPadding: number;
  rightPadding: number;
  topPadding: number;
  bottomPadding: number;
  minPossibleFSM: number;
  maxPossibleFSM: number;
};

export default function InteractiveChart({
  allStats,
  width,
  height,
  leftPadding,
  rightPadding,
  topPadding,
  bottomPadding,
  minPossibleFSM,
  maxPossibleFSM,
}: InteractiveChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height} onMouseMove={handleMouseMove}>
        {Array.from({length: (maxPossibleFSM-minPossibleFSM)/50+1}, (_, i) => {
          const v = minPossibleFSM + i*50;
          const y = height - bottomPadding - ((v - minPossibleFSM) / (maxPossibleFSM - minPossibleFSM)) * (height - topPadding - bottomPadding);
          return (
            <g key={v}>
              <line x1={leftPadding} y1={y} x2={width-rightPadding} y2={y} stroke="#bbb" strokeWidth="0.5" />
              <text x={leftPadding-12} y={y+5} fontSize="13" textAnchor="end" fill="#fff">{v}</text>
            </g>
          );
        })}
        
        <text x={leftPadding-45} y={height/2 - 10} fontSize="14" textAnchor="middle" fill="#fff" transform={`rotate(-90,${leftPadding-45},${height/2})`}>Normalized FSM</text>
        
        <path
          fill="none"
          stroke="#0070f3"
          strokeWidth="3"
          d={(() => {
            if (allStats.length === 0) return "";
            if (allStats.length === 1) {
              const x = leftPadding;
              const y = height - bottomPadding - ((allStats[0].normFSM - minPossibleFSM) / (maxPossibleFSM - minPossibleFSM || 1)) * (height - topPadding - bottomPadding);
              return `M ${x},${y}`;
            }
            
            let path = "";
            const coords = allStats.map((s, i) => ({
              x: leftPadding + (i * (width - leftPadding - rightPadding)) / (allStats.length-1),
              y: height - bottomPadding - ((s.normFSM - minPossibleFSM) / (maxPossibleFSM - minPossibleFSM || 1)) * (height - topPadding - bottomPadding)
            }));
            
            path += `M ${coords[0].x},${coords[0].y}`;
            
            for (let i = 1; i < coords.length; i++) {
              const prev = coords[i - 1];
              const curr = coords[i];
              const next = coords[i + 1];
              
              const tension = 0.15;
              const dx1 = next ? (next.x - prev.x) * tension : (curr.x - prev.x) * tension;
              const dy1 = next ? (next.y - prev.y) * tension : (curr.y - prev.y) * tension;
              
              const cp1x = prev.x + dx1;
              const cp1y = prev.y + dy1;
              const cp2x = curr.x - dx1;
              const cp2y = curr.y - dy1;
              
              path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
            }
            
            return path;
          })()}
        />
        
        <line x1={leftPadding} y1={height-bottomPadding} x2={width-rightPadding} y2={height-bottomPadding} stroke="#bbb" />
        <line x1={leftPadding} y1={topPadding} x2={leftPadding} y2={height-bottomPadding} stroke="#bbb" />
        
        {allStats.map((s, i) => {
          const x = leftPadding + (i * (width - leftPadding - rightPadding)) / (allStats.length-1);
          const y = height - bottomPadding - ((s.normFSM - minPossibleFSM) / (maxPossibleFSM - minPossibleFSM || 1)) * (height - topPadding - bottomPadding);
          return (
            <circle
              key={s.year}
              cx={x}
              cy={y}
              r={hoveredPoint?.year === s.year ? 8 : 6}
              fill="#0070f3"
              stroke="#fff"
              strokeWidth="2"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredPoint(s)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}
        
        {allStats.map((s, i) => {
          const x = leftPadding + (i * (width - leftPadding - rightPadding)) / (allStats.length-1);
          return <text key={s.year} x={x} y={height-bottomPadding+20} fontSize="15" textAnchor="middle" fill="#fff">{(s.year % 100).toString().padStart(2, '0')}</text>;
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
          <div><strong>{hoveredPoint.year}</strong></div>
          <div>Normalized FSM: {hoveredPoint.normFSM.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
}
