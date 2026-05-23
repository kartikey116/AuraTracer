import React, { useState, useRef } from 'react';

export default function AnalyticsChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const containerRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
        No log activities recorded in this timeframe
      </div>
    );
  }

  // Width & height of the SVG viewbox coordinate system
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };

  // Calculate scales
  const maxCount = Math.max(...data.map(d => d.count), 10); // at least 10 scale
  const maxErrors = Math.max(...data.map(d => d.errors), 5);

  const getX = (index) => {
    if (data.length === 1) {
      return padding.left + (width - padding.left - padding.right) / 2;
    }
    if (data.length <= 0) return padding.left;
    const chartWidth = width - padding.left - padding.right;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value) => {
    const chartHeight = height - padding.top - padding.bottom;
    return height - padding.bottom - (value / maxCount) * chartHeight;
  };

  const getErrorY = (value) => {
    const chartHeight = height - padding.top - padding.bottom;
    return height - padding.bottom - (value / maxErrors) * chartHeight;
  };

  // Generate SVG Path for Total Requests
  let totalPath = '';
  let totalArea = '';
  
  if (data.length > 0) {
    const points = data.length === 1
      ? [
          { x: padding.left, y: getY(data[0].count) },
          { x: padding.left + (width - padding.left - padding.right) / 2, y: getY(data[0].count) },
          { x: width - padding.right, y: getY(data[0].count) }
        ]
      : data.map((d, i) => ({ x: getX(i), y: getY(d.count) }));
    
    // Draw smooth bezier curve
    totalPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      totalPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }

    // Complete area path to bottom axis
    totalArea = `${totalPath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
  }

  // Generate SVG Path for Error Requests (Red Line)
  let errorPath = '';
  if (data.length > 0) {
    const points = data.length === 1
      ? [
          { x: padding.left, y: getErrorY(data[0].errors) },
          { x: padding.left + (width - padding.left - padding.right) / 2, y: getErrorY(data[0].errors) },
          { x: width - padding.right, y: getErrorY(data[0].errors) }
        ]
      : data.map((d, i) => ({ x: getX(i), y: getErrorY(d.errors) }));
    
    errorPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      errorPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
  }

  // Helper to format date labels on X axis
  const formatLabel = (dateStr, index) => {
    // Show labels for first, middle, last, or every N elements
    const step = Math.max(Math.floor(data.length / 5), 1);
    if (index % step === 0 || index === data.length - 1) {
      // Split dateStr "2026-05-23 20:00" -> "20:00" or date format
      const parts = dateStr.split(' ');
      return parts[1] || parts[0];
    }
    return '';
  };

  // Generate Y axis gridlines
  const gridLines = [];
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const val = (maxCount / gridCount) * i;
    const y = getY(val);
    gridLines.push({ y, val: Math.round(val) });
  }

  return (
    <div className="relative" ref={containerRef}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        <defs>
          {/* Gradients */}
          <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke="#27272a"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              fill="#71717a"
              fontSize="10"
              textAnchor="end"
              fontWeight="500"
            >
              {line.val}
            </text>
          </g>
        ))}

        {/* Area below total requests */}
        {totalArea && (
          <path d={totalArea} fill="url(#totalGradient)" />
        )}

        {/* Smooth total requests line */}
        {totalPath && (
          <path
            d={totalPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Smooth errors line */}
        {errorPath && (
          <path
            d={errorPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="1 1"
          />
        )}

        {/* X Axis Labels */}
        {data.map((d, i) => {
          const label = formatLabel(d._id, i);
          if (!label) return null;
          return (
            <text
              key={i}
              x={getX(i)}
              y={height - 10}
              fill="#71717a"
              fontSize="10"
              textAnchor="middle"
              fontWeight="500"
            >
              {label}
            </text>
          );
        })}

        {/* Hover guidance vertical line */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={padding.top}
            x2={getX(hoveredIndex)}
            y2={height - padding.bottom}
            stroke="#3f3f46"
            strokeWidth="1.5"
          />
        )}

        {/* Dots on hover */}
        {hoveredIndex !== null && (
          <g>
            <circle
              cx={getX(hoveredIndex)}
              cy={getY(data[hoveredIndex].count)}
              r="5"
              fill="#6366f1"
              stroke="#09090b"
              strokeWidth="2"
            />
            {data[hoveredIndex].errors > 0 && (
              <circle
                cx={getX(hoveredIndex)}
                cy={getErrorY(data[hoveredIndex].errors)}
                r="4.5"
                fill="#ef4444"
                stroke="#09090b"
                strokeWidth="1.5"
              />
            )}
          </g>
        )}

        {/* Invisible vertical rects to catch mouse hover */}
        {data.map((d, i) => {
          const x = getX(i);
          const colWidth = (width - padding.left - padding.right) / Math.max(data.length - 1, 1);
          return (
            <rect
              key={i}
              x={x - colWidth / 2}
              y={padding.top}
              width={colWidth}
              height={height - padding.top - padding.bottom}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-crosshair"
            />
          );
        })}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredIndex !== null && (
        <div 
          className="absolute bg-zinc-900 border border-brand-border rounded-lg p-2.5 shadow-xl text-xs z-20 pointer-events-none"
          style={{
            left: `${(getX(hoveredIndex) / width) * 100}%`,
            top: '10px',
            transform: hoveredIndex > data.length / 2 ? 'translateX(-110%)' : 'translateX(10%)'
          }}
        >
          <div className="font-semibold text-zinc-400 mb-1">
            {data[hoveredIndex]._id}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-brand-accent"></span>
                Total Logs:
              </span>
              <span className="font-bold text-white">{data[hoveredIndex].count}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-brand-cyan"></span>
                Page Views:
              </span>
              <span className="font-bold text-zinc-200">{data[hoveredIndex].pageViews}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-brand-purple"></span>
                Clicks:
              </span>
              <span className="font-bold text-zinc-200">{data[hoveredIndex].clicks}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="h-2 w-2 rounded-full bg-brand-red"></span>
                Errors:
              </span>
              <span className="font-bold text-red-400">{data[hoveredIndex].errors}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
