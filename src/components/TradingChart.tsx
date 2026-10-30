"use client";

import React, { useState, useRef, useMemo } from "react";
import { CandlePoint } from "../types/api";
import { 
  BarChart2, 
  TrendingUp 
} from "lucide-react";

interface TradingChartProps {
  data: CandlePoint[];
  ticker: string;
  assetName: string;
  currency?: string;
  currentPrice?: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  data,
  ticker,
  assetName,
  currency = "USD",
}) => {
  const [chartMode, setChartMode] = useState<"candle" | "line">("candle");
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [activeSubChart, setActiveSubChart] = useState<"rsi" | "macd" | "volume">("volume");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute bounding box metrics
  const { minPrice, maxPrice, maxVolume, minMACD, maxMACD } =
    useMemo(() => {
      if (!data || data.length === 0) {
        return {
          minPrice: 0,
          maxPrice: 100,
          maxVolume: 100,
          minMACD: -1,
          maxMACD: 1,
        };
      }

      let low = Infinity;
      let high = -Infinity;
      let volMax = 0;
      let macdMin = Infinity;
      let macdMax = -Infinity;

      for (const d of data) {
        if (d.low < low) low = d.low;
        if (d.high > high) high = d.high;
        if (showBollinger && d.bb_upper && d.bb_upper > high) high = d.bb_upper;
        if (showBollinger && d.bb_lower && d.bb_lower < low) low = d.bb_lower;
        if (d.volume > volMax) volMax = d.volume;

        if (d.macd !== undefined && d.macd !== null) {
          if (d.macd < macdMin) macdMin = d.macd;
          if (d.macd > macdMax) macdMax = d.macd;
        }
        if (d.macd_signal !== undefined && d.macd_signal !== null) {
          if (d.macd_signal < macdMin) macdMin = d.macd_signal;
          if (d.macd_signal > macdMax) macdMax = d.macd_signal;
        }
      }

      // Add 2% padding to price bounds
      const pricePadding = (high - low) * 0.03 || 1;
      return {
        minPrice: Math.max(0, low - pricePadding),
        maxPrice: high + pricePadding,
        maxVolume: volMax * 1.1 || 1000,
        minMACD: Math.min(-0.1, macdMin),
        maxMACD: Math.max(0.1, macdMax),
      };
    }, [data, showBollinger]);

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-terminal-card border border-terminal-border rounded-xl">
        <span className="text-sm font-mono text-terminal-muted animate-pulse">
          Awaiting historical market series...
        </span>
      </div>
    );
  }

  // Chart dimensions in virtual viewBox
  const width = 1000;
  const mainHeight = 360;
  const subHeight = 110;
  const totalHeight = mainHeight + subHeight + 10;
  const paddingRight = 65;
  const chartWidth = width - paddingRight;

  const pointsCount = data.length;
  const stepX = chartWidth / (pointsCount - 1 || 1);
  const candleWidth = Math.max(2, Math.min(8, (chartWidth / pointsCount) * 0.7));

  // Scale helpers
  const getY = (price: number) => {
    return (
      mainHeight -
      ((price - minPrice) / (maxPrice - minPrice || 1)) * (mainHeight - 30) -
      15
    );
  };

  const getSubY = (val: number, min: number, max: number) => {
    const range = max - min || 1;
    const clamped = Math.max(min, Math.min(max, val));
    return (
      totalHeight -
      ((clamped - min) / range) * (subHeight - 20) -
      10
    );
  };

  // Mouse hover tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = (x / rect.width) * width;
    const clampedX = Math.max(0, Math.min(chartWidth, relativeX));
    const idx = Math.round(clampedX / stepX);
    if (idx >= 0 && idx < pointsCount) {
      setHoverIndex(idx);
    }
  };

  const activePoint = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  // Price Path for Line mode
  const linePoints = data
    .map((d, i) => `${i * stepX},${getY(d.close)}`)
    .join(" ");

  // SMA 50 & 200 paths
  const sma50Points = data
    .filter((d) => d.sma_50 !== null && d.sma_50 !== undefined)
    .map((d, i) => `${i * stepX},${getY(d.sma_50!)}`)
    .join(" ");

  const sma200Points = data
    .filter((d) => d.sma_200 !== null && d.sma_200 !== undefined)
    .map((d, i) => `${i * stepX},${getY(d.sma_200!)}`)
    .join(" ");

  // Bollinger Bands path
  const bbUpperPoints = data
    .filter((d) => d.bb_upper !== null)
    .map((d, i) => `${i * stepX},${getY(d.bb_upper!)}`)
    .join(" ");

  const bbLowerPoints = data
    .filter((d) => d.bb_lower !== null)
    .map((d, i) => `${i * stepX},${getY(d.bb_lower!)}`)
    .join(" ");

  // RSI points
  const rsiPoints = data
    .filter((d) => d.rsi !== null && d.rsi !== undefined)
    .map((d, i) => `${i * stepX},${getSubY(d.rsi!, 0, 100)}`)
    .join(" ");

  // MACD line & signal points
  const macdLinePoints = data
    .filter((d) => d.macd !== null && d.macd !== undefined)
    .map((d, i) => `${i * stepX},${getSubY(d.macd!, minMACD, maxMACD)}`)
    .join(" ");

  const macdSignalPoints = data
    .filter((d) => d.macd_signal !== null && d.macd_signal !== undefined)
    .map((d, i) => `${i * stepX},${getSubY(d.macd_signal!, minMACD, maxMACD)}`)
    .join(" ");

  // Price axis labels (5 levels)
  const priceGridLevels = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const val = minPrice + p * (maxPrice - minPrice);
    return { val, y: getY(val) };
  });

  return (
    <div
      ref={containerRef}
      className="bg-terminal-card border border-terminal-border rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-sm relative"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-terminal-border/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl font-bold tracking-tight text-white font-mono">
              {ticker}
            </h2>
            <span className="text-xs text-terminal-muted truncate max-w-[200px]">
              {assetName}
            </span>
          </div>

          <div className="flex items-center space-x-1 font-mono text-sm">
            <span className="text-white font-bold">
              {currency === "USD" ? "$" : ""}
              {activePoint.close.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}
            </span>
            <span className="text-[11px] text-terminal-muted">{currency}</span>
          </div>
        </div>

        {/* Chart Toolbars */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-terminal-bg p-0.5 rounded-lg border border-terminal-border">
            <button
              onClick={() => setChartMode("candle")}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center space-x-1 ${
                chartMode === "candle"
                  ? "bg-terminal-cardHover text-emerald-400 font-bold"
                  : "text-terminal-muted hover:text-terminal-dim"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Candles</span>
            </button>
            <button
              onClick={() => setChartMode("line")}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center space-x-1 ${
                chartMode === "line"
                  ? "bg-terminal-cardHover text-sky-400 font-bold"
                  : "text-terminal-muted hover:text-terminal-dim"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Line</span>
            </button>
          </div>

          {/* Overlays */}
          <div className="flex items-center space-x-1 bg-terminal-bg p-0.5 rounded-lg border border-terminal-border text-xs font-mono">
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`px-2 py-1 rounded transition ${
                showSMA
                  ? "text-sky-400 bg-sky-500/10 font-bold"
                  : "text-terminal-muted hover:text-terminal-dim"
              }`}
            >
              SMA 50/200
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-1 rounded transition ${
                showBollinger
                  ? "text-purple-400 bg-purple-500/10 font-bold"
                  : "text-terminal-muted hover:text-terminal-dim"
              }`}
            >
              Bollinger
            </button>
          </div>

          {/* Sub-chart toggle */}
          <div className="flex items-center space-x-1 bg-terminal-bg p-0.5 rounded-lg border border-terminal-border text-xs font-mono">
            <button
              onClick={() => setActiveSubChart("volume")}
              className={`px-2 py-1 rounded ${
                activeSubChart === "volume"
                  ? "bg-terminal-cardHover text-white font-bold"
                  : "text-terminal-muted hover:text-terminal-dim"
              }`}
            >
              VOL
            </button>
            <button
              onClick={() => setActiveSubChart("rsi")}
              className={`px-2 py-1 rounded ${
                activeSubChart === "rsi"
                  ? "bg-terminal-cardHover text-amber-400 font-bold"
                  : "text-terminal-muted hover:text-terminal-dim"
              }`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setActiveSubChart("macd")}
              className={`px-2 py-1 rounded ${
                activeSubChart === "macd"
                  ? "bg-terminal-cardHover text-cyan-400 font-bold"
                  : "text-terminal-muted hover:text-terminal-dim"
              }`}
            >
              MACD
            </button>
          </div>
        </div>
      </div>

      {/* Floating Indicator Tooltip Bar */}
      <div className="py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono border-b border-terminal-border/40 text-terminal-dim">
        <div>
          DATE: <span className="text-white font-semibold">{activePoint.timestamp}</span>
        </div>
        <div>
          O: <span className="text-white">{activePoint.open.toFixed(2)}</span>
        </div>
        <div>
          H: <span className="text-emerald-400">{activePoint.high.toFixed(2)}</span>
        </div>
        <div>
          L: <span className="text-rose-400">{activePoint.low.toFixed(2)}</span>
        </div>
        <div>
          C: <span className="text-white font-bold">{activePoint.close.toFixed(2)}</span>
        </div>
        {activePoint.rsi && (
          <div>
            RSI(14): <span className="text-amber-400 font-bold">{activePoint.rsi.toFixed(1)}</span>
          </div>
        )}
        {activePoint.macd !== undefined && activePoint.macd !== null && (
          <div>
            MACD: <span className="text-sky-400">{activePoint.macd.toFixed(3)}</span>
          </div>
        )}
        {showSMA && activePoint.sma_50 && (
          <div className="text-sky-400 hidden sm:block">
            SMA50: {activePoint.sma_50.toFixed(2)}
          </div>
        )}
        {showSMA && activePoint.sma_200 && (
          <div className="text-purple-400 hidden sm:block">
            SMA200: {activePoint.sma_200.toFixed(2)}
          </div>
        )}
      </div>

      {/* SVG Canvas Area */}
      <div className="w-full relative overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${totalHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Background Grid Lines */}
          {priceGridLevels.map((lvl, i) => (
            <g key={i}>
              <line
                x1={0}
                y1={lvl.y}
                x2={chartWidth}
                y2={lvl.y}
                stroke="#1e293b"
                strokeWidth={0.8}
                strokeDasharray="4 4"
              />
              <text
                x={chartWidth + 6}
                y={lvl.y + 3}
                fill="#64748b"
                fontSize={9}
                fontFamily="ui-monospace"
              >
                {lvl.val.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Subchart separator */}
          <line
            x1={0}
            y1={mainHeight + 5}
            x2={width}
            y2={mainHeight + 5}
            stroke="#1e293b"
            strokeWidth={1}
          />

          {/* Bollinger Bands Shaded Area */}
          {showBollinger && bbUpperPoints && bbLowerPoints && (
            <>
              <polyline
                fill="none"
                stroke="rgba(129, 140, 248, 0.4)"
                strokeWidth={1}
                strokeDasharray="2 2"
                points={bbUpperPoints}
              />
              <polyline
                fill="none"
                stroke="rgba(129, 140, 248, 0.4)"
                strokeWidth={1}
                strokeDasharray="2 2"
                points={bbLowerPoints}
              />
            </>
          )}

          {/* Candlesticks or Line */}
          {chartMode === "candle" ? (
            data.map((d, i) => {
              const x = i * stepX;
              const isUp = d.close >= d.open;
              const candleColor = isUp ? "#10b981" : "#f43f5e";
              const openY = getY(d.open);
              const closeY = getY(d.close);
              const highY = getY(d.high);
              const lowY = getY(d.low);
              const rectTop = Math.min(openY, closeY);
              const rectHeight = Math.max(1.5, Math.abs(openY - closeY));

              return (
                <g key={i}>
                  {/* High/Low Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth={1}
                  />
                  {/* Open/Close Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={rectTop}
                    width={candleWidth}
                    height={rectHeight}
                    fill={isUp ? "#10b981" : "#f43f5e"}
                    rx={0.5}
                  />
                </g>
              );
            })
          ) : (
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth={2}
              points={linePoints}
            />
          )}

          {/* SMA Overlays */}
          {showSMA && (
            <>
              {sma50Points && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  points={sma50Points}
                />
              )}
              {sma200Points && (
                <polyline
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth={1.5}
                  points={sma200Points}
                />
              )}
            </>
          )}

          {/* SUB-CHART RENDERING */}
          {activeSubChart === "volume" && (
            // Volume Histogram Bars
            data.map((d, i) => {
              const x = i * stepX;
              const volRatio = d.volume / (maxVolume || 1);
              const barH = volRatio * (subHeight - 25);
              const barY = totalHeight - barH - 8;
              const isUp = d.close >= d.open;
              return (
                <rect
                  key={i}
                  x={x - candleWidth / 2}
                  y={barY}
                  width={candleWidth}
                  height={barH}
                  fill={isUp ? "rgba(16, 185, 129, 0.35)" : "rgba(244, 63, 94, 0.35)"}
                />
              );
            })
          )}

          {activeSubChart === "rsi" && (
            <g>
              {/* 70 / 30 guide lines */}
              <line
                x1={0}
                y1={getSubY(70, 0, 100)}
                x2={chartWidth}
                y2={getSubY(70, 0, 100)}
                stroke="#f43f5e"
                strokeWidth={0.8}
                strokeDasharray="3 3"
              />
              <line
                x1={0}
                y1={getSubY(30, 0, 100)}
                x2={chartWidth}
                y2={getSubY(30, 0, 100)}
                stroke="#10b981"
                strokeWidth={0.8}
                strokeDasharray="3 3"
              />
              <text x={chartWidth + 6} y={getSubY(70, 0, 100) + 3} fill="#f43f5e" fontSize={8}>
                70
              </text>
              <text x={chartWidth + 6} y={getSubY(30, 0, 100) + 3} fill="#10b981" fontSize={8}>
                30
              </text>
              {rsiPoints && (
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  points={rsiPoints}
                />
              )}
            </g>
          )}

          {activeSubChart === "macd" && (
            <g>
              {/* Zero line */}
              <line
                x1={0}
                y1={getSubY(0, minMACD, maxMACD)}
                x2={chartWidth}
                y2={getSubY(0, minMACD, maxMACD)}
                stroke="#334155"
                strokeWidth={1}
              />
              {/* MACD Histogram Bars */}
              {data.map((d, i) => {
                if (d.macd_hist === null || d.macd_hist === undefined) return null;
                const x = i * stepX;
                const zeroY = getSubY(0, minMACD, maxMACD);
                const valY = getSubY(d.macd_hist, minMACD, maxMACD);
                const barTop = Math.min(zeroY, valY);
                const barH = Math.max(1, Math.abs(zeroY - valY));
                const isHistBull = d.macd_hist >= 0;
                return (
                  <rect
                    key={i}
                    x={x - candleWidth / 2}
                    y={barTop}
                    width={candleWidth}
                    height={barH}
                    fill={isHistBull ? "#10b981" : "#f43f5e"}
                    opacity={0.7}
                  />
                );
              })}
              {/* MACD & Signal Lines */}
              {macdLinePoints && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  points={macdLinePoints}
                />
              )}
              {macdSignalPoints && (
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth={1.2}
                  strokeDasharray="2 2"
                  points={macdSignalPoints}
                />
              )}
            </g>
          )}

          {/* Hover Crosshair */}
          {hoverIndex !== null && (
            <g>
              {/* Vertical line across full chart */}
              <line
                x1={hoverIndex * stepX}
                y1={0}
                x2={hoverIndex * stepX}
                y2={totalHeight}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {/* Horizontal line on price */}
              <line
                x1={0}
                y1={getY(activePoint.close)}
                x2={chartWidth}
                y2={getY(activePoint.close)}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {/* Price badge on axis */}
              <rect
                x={chartWidth}
                y={getY(activePoint.close) - 8}
                width={paddingRight}
                height={16}
                fill="#38bdf8"
                rx={2}
              />
              <text
                x={chartWidth + 4}
                y={getY(activePoint.close) + 4}
                fill="#080b11"
                fontSize={9}
                fontFamily="ui-monospace"
                fontWeight="bold"
              >
                {activePoint.close.toFixed(2)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
