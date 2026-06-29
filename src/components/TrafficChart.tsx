import React, { useMemo } from 'react';

interface TrafficChartProps {
  data: { time: string; rx: number; tx: number }[];
  interfaceName: string;
}

export default function TrafficChart({ data, interfaceName }: TrafficChartProps) {
  // Format bytes to readable string (bps)
  const formatSpeed = (bps: number) => {
    if (bps === 0) return '0 bps';
    const k = 1000;
    const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(bps) / Math.log(k));
    return parseFloat((bps / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Find max value to auto-scale chart
  const maxVal = useMemo(() => {
    let m = 1000000; // default minimum scale 1Mbps
    data.forEach(d => {
      if (d.rx > m) m = d.rx;
      if (d.tx > m) m = d.tx;
    });
    return m * 1.15; // 15% padding
  }, [data]);

  const latestRx = data[data.length - 1]?.rx || 0;
  const latestTx = data[data.length - 1]?.tx || 0;

  // Chart Dimensions
  const width = 600;
  const height = 180;
  const paddingLeft = 60;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute SVG Points
  const rxPoints = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.rx / maxVal) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [data, maxVal, chartWidth, chartHeight]);

  const txPoints = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.tx / maxVal) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [data, maxVal, chartWidth, chartHeight]);

  // SVG Area Paths (close the loop to the bottom)
  const rxAreaPath = useMemo(() => {
    if (data.length === 0) return '';
    const firstX = paddingLeft;
    const lastX = paddingLeft + chartWidth;
    const baseY = paddingTop + chartHeight;
    return `M ${firstX},${baseY} L ${rxPoints} L ${lastX},${baseY} Z`;
  }, [rxPoints, chartWidth, chartHeight]);

  const txAreaPath = useMemo(() => {
    if (data.length === 0) return '';
    const firstX = paddingLeft;
    const lastX = paddingLeft + chartWidth;
    const baseY = paddingTop + chartHeight;
    return `M ${firstX},${baseY} L ${txPoints} L ${lastX},${baseY} Z`;
  }, [txPoints, chartWidth, chartHeight]);

  // Horizontal Grid Lines
  const gridLines = useMemo(() => {
    const lines = [];
    const count = 4;
    for (let i = 0; i <= count; i++) {
      const val = (maxVal / count) * i;
      const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
      lines.push({ y, val });
    }
    return lines;
  }, [maxVal, chartHeight]);

  return (
    <div id="traffic-monitor-panel" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
          Trafik Real-time ({interfaceName})
        </h3>
        <div className="flex gap-4 text-[11px] font-bold uppercase">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <span className="w-2 h-2 rounded bg-indigo-500"></span> Download (RX): {formatSpeed(latestRx)}
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2 h-2 rounded bg-sky-500"></span> Upload (TX): {formatSpeed(latestTx)}
          </span>
        </div>
      </div>

      {/* SVG Chart stage */}
      <div className="flex-1 w-full relative min-h-[160px] select-none">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Horizontal Grid lines & labels */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={line.y} 
                x2={width - paddingRight} 
                y2={line.y} 
                stroke="#1e293b" 
                strokeWidth="1"
                strokeDasharray={idx === 0 ? "none" : "3,3"}
              />
              <text 
                x={paddingLeft - 8} 
                y={line.y + 3} 
                textAnchor="end" 
                fill="#64748b" 
                className="text-[9px] font-mono font-medium"
              >
                {formatSpeed(line.val)}
              </text>
            </g>
          ))}

          {/* Time axis labels (First and last) */}
          {data.length > 1 && (
            <>
              <text 
                x={paddingLeft} 
                y={height - 5} 
                fill="#64748b" 
                className="text-[9px] font-mono"
              >
                {data[0].time}
              </text>
              <text 
                x={width - paddingRight} 
                y={height - 5} 
                textAnchor="end" 
                fill="#64748b" 
                className="text-[9px] font-mono"
              >
                {data[data.length - 1].time}
              </text>
            </>
          )}

          {/* Fill Areas */}
          {data.length > 0 && (
            <>
              {/* RX (Download) Area */}
              <path 
                d={rxAreaPath} 
                fill="url(#rxGrad)" 
                opacity="0.15"
              />
              {/* TX (Upload) Area */}
              <path 
                d={txAreaPath} 
                fill="url(#txGrad)" 
                opacity="0.1"
              />

              {/* Stroke Lines */}
              {/* RX (Download) */}
              <polyline 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="2" 
                points={rxPoints} 
              />
              {/* TX (Upload) */}
              <polyline 
                fill="none" 
                stroke="#0ea5e9" 
                strokeWidth="2" 
                points={txPoints} 
              />
            </>
          )}

          {/* SVG Definitions for Gradients */}
          <defs>
            <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mt-2.5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <span>Interval update: 3 detik</span>
        <span>Mikhmon Monitoring Engine</span>
      </div>
    </div>
  );
}
