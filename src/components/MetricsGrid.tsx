"use client";

import React from "react";
import { 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Percent, 
  BarChart, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";
import { QuantMetrics } from "../types/api";

interface MetricsGridProps {
  metrics: QuantMetrics;
  currentPrice: number;
  currency?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  currentPrice,
  currency = "USD",
}) => {
  const is24hPositive = (metrics.price_change_24h_pct || 0) >= 0;
  const isSharpePositive = metrics.sharpe_ratio >= 0;

  // Calculate 52w range position if available
  const high52 = metrics.high_52w || currentPrice * 1.15;
  const low52 = metrics.low_52w || currentPrice * 0.85;
  const rangeSpan = high52 - low52 || 1;
  const rangePercent = Math.min(
    100,
    Math.max(0, ((currentPrice - low52) / rangeSpan) * 100)
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono">
      {/* 1. Spot Price & 24h Change */}
      <div className="bg-terminal-card border border-terminal-border rounded-xl p-3.5 flex flex-col justify-between hover:border-terminal-borderGlow transition">
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span className="flex items-center space-x-1">
            <DollarSign className="h-3.5 w-3.5 text-sky-400" />
            <span>SPOT PRICE</span>
          </span>
          <span className="text-[10px] text-terminal-dim">{currency}</span>
        </div>
        <div className="my-1.5">
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
          <div
            className={`text-xs flex items-center font-semibold mt-0.5 ${
              is24hPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {is24hPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5 inline" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5 inline" />
            )}
            <span>
              {is24hPositive ? "+" : ""}
              {(metrics.price_change_24h_pct || 0).toFixed(2)}% (24h)
            </span>
          </div>
        </div>
        <div className="text-[10px] text-terminal-muted border-t border-terminal-border/60 pt-1.5">
          Log Ret: {(metrics.log_return_24h || 0).toFixed(4)}
        </div>
      </div>

      {/* 2. Annualized Volatility */}
      <div className="bg-terminal-card border border-terminal-border rounded-xl p-3.5 flex flex-col justify-between hover:border-terminal-borderGlow transition">
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span className="flex items-center space-x-1">
            <Activity className="h-3.5 w-3.5 text-amber-400" />
            <span>ANNUALIZED VOL</span>
          </span>
          <span className="text-[10px] text-amber-400/80">30D ROLLING</span>
        </div>
        <div className="my-1.5">
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {(metrics.annualized_volatility * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-terminal-dim mt-0.5">
            {metrics.annualized_volatility > 0.45
              ? "High Volatility Regime"
              : metrics.annualized_volatility < 0.20
              ? "Low Volatility Regime"
              : "Standard Volatility"}
          </div>
        </div>
        <div className="text-[10px] text-terminal-muted border-t border-terminal-border/60 pt-1.5">
          BB Width: {(metrics.bb_width || 0).toFixed(3)}
        </div>
      </div>

      {/* 3. 30-Day Sharpe Ratio */}
      <div className="bg-terminal-card border border-terminal-border rounded-xl p-3.5 flex flex-col justify-between hover:border-terminal-borderGlow transition">
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>SHARPE RATIO</span>
          </span>
          <span className="text-[10px] text-terminal-dim">Rf = 4.5%</span>
        </div>
        <div className="my-1.5">
          <div
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isSharpePositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {metrics.sharpe_ratio.toFixed(2)}
          </div>
          <div className="text-xs text-terminal-dim mt-0.5">
            {metrics.sharpe_ratio >= 1.5
              ? "Strong Risk-Adj Return"
              : metrics.sharpe_ratio >= 0.5
              ? "Moderate Efficiency"
              : "Sub-optimal Risk Profile"}
          </div>
        </div>
        <div className="text-[10px] text-terminal-muted border-t border-terminal-border/60 pt-1.5">
          Hurdle benchmark: US 10Y
        </div>
      </div>

      {/* 4. Maximum Drawdown (MDD) */}
      <div className="bg-terminal-card border border-terminal-border rounded-xl p-3.5 flex flex-col justify-between hover:border-terminal-borderGlow transition">
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span className="flex items-center space-x-1">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>MAX DRAWDOWN</span>
          </span>
          <span className="text-[10px] text-rose-400/80">PEAK-TROUGH</span>
        </div>
        <div className="my-1.5">
          <div className="text-xl sm:text-2xl font-bold text-rose-400 tracking-tight">
            {metrics.max_drawdown !== null && metrics.max_drawdown !== undefined
              ? `${(metrics.max_drawdown * 100).toFixed(2)}%`
              : "N/A"}
          </div>
          <div className="text-xs text-terminal-dim mt-0.5">
            Tail Risk Metric
          </div>
        </div>
        <div className="text-[10px] text-terminal-muted border-t border-terminal-border/60 pt-1.5">
          Worst historical dip in sample
        </div>
      </div>

      {/* 5. RSI 14 Momentum */}
      <div className="bg-terminal-card border border-terminal-border rounded-xl p-3.5 flex flex-col justify-between hover:border-terminal-borderGlow transition">
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span className="flex items-center space-x-1">
            <BarChart className="h-3.5 w-3.5 text-purple-400" />
            <span>RSI (14-DAY)</span>
          </span>
          <span className="text-[10px] text-terminal-dim">WILDER&apos;S</span>
        </div>
        <div className="my-1.5">
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {metrics.rsi_14.toFixed(1)}
          </div>
          <div className="text-xs mt-0.5 font-semibold">
            {metrics.rsi_14 >= 70 ? (
              <span className="text-rose-400">Overbought Zone</span>
            ) : metrics.rsi_14 <= 30 ? (
              <span className="text-emerald-400">Oversold Zone</span>
            ) : (
              <span className="text-amber-400">Equilibrium Zone</span>
            )}
          </div>
        </div>
        <div className="text-[10px] text-terminal-muted border-t border-terminal-border/60 pt-1.5">
          Thresholds: 30 / 70
        </div>
      </div>

      {/* 6. MACD Histogram */}
      <div className="bg-terminal-card border border-terminal-border rounded-xl p-3.5 flex flex-col justify-between hover:border-terminal-borderGlow transition">
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span className="flex items-center space-x-1">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>MACD HISTOGRAM</span>
          </span>
          <span className="text-[10px] text-terminal-dim">12, 26, 9</span>
        </div>
        <div className="my-1.5">
          <div
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              (metrics.macd_hist || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {(metrics.macd_hist || 0).toFixed(3)}
          </div>
          <div className="text-xs text-terminal-dim mt-0.5">
            Signal: {(metrics.macd_signal || 0).toFixed(2)}
          </div>
        </div>
        <div className="text-[10px] text-terminal-muted border-t border-terminal-border/60 pt-1.5">
          Line: {(metrics.macd || 0).toFixed(2)}
        </div>
      </div>

      {/* 7. Bollinger Bands */}
      <div className="bg-terminal-card border border-terminal-border rounded-xl p-3.5 flex flex-col justify-between hover:border-terminal-borderGlow transition">
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span className="flex items-center space-x-1">
            <Percent className="h-3.5 w-3.5 text-indigo-400" />
            <span>BOLLINGER (20, 2)</span>
          </span>
          <span className="text-[10px] text-terminal-dim">2σ BANDS</span>
        </div>
        <div className="my-1.5">
          <div className="text-xs text-emerald-400">
            UP: ${metrics.bb_upper?.toFixed(2) || "N/A"}
          </div>
          <div className="text-xs text-rose-400 mt-0.5">
            LO: ${metrics.bb_lower?.toFixed(2) || "N/A"}
          </div>
        </div>
        <div className="text-[10px] text-terminal-muted border-t border-terminal-border/60 pt-1.5">
          Bandwidth: {((metrics.bb_width || 0) * 100).toFixed(2)}%
        </div>
      </div>

      {/* 8. Period High / Low Range */}
      <div className="bg-terminal-card border border-terminal-border rounded-xl p-3.5 flex flex-col justify-between hover:border-terminal-borderGlow transition">
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span>PERIOD RANGE</span>
          <span className="text-[10px] text-terminal-dim">POS: {rangePercent.toFixed(0)}%</span>
        </div>
        <div className="my-1.5">
          <div className="w-full bg-terminal-bg h-2 rounded-full overflow-hidden border border-terminal-border relative mt-2 mb-1">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full"
              style={{ width: `${rangePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-terminal-dim mt-1">
            <span>L: ${low52.toFixed(1)}</span>
            <span>H: ${high52.toFixed(1)}</span>
          </div>
        </div>
        <div className="text-[10px] text-terminal-muted border-t border-terminal-border/60 pt-1.5">
          Range relative to current spot
        </div>
      </div>
    </div>
  );
};

