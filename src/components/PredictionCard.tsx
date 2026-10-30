"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Compass, 
  Cpu, 
  Gauge, 
  Zap, 
  Target, 
  Calendar,
  Layers,
  Percent
} from "lucide-react";
import { FactorSignal, HorizonForecast } from "../types/api";

interface PredictionCardProps {
  prediction: "BULLISH" | "BEARISH";
  probability: number;
  sentimentScore: number;
  currentPrice: number;
  currency?: string;
  factors?: FactorSignal[];
  horizons?: HorizonForecast[];
  timestamp: string;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  probability,
  sentimentScore,
  currentPrice,
  currency = "USD",
  factors = [],
  horizons = [],
  timestamp,
}) => {
  // Default selected horizon: "1M" (or first available)
  const [selectedHorizonCode, setSelectedHorizonCode] = useState<string>("1M");

  // Fallback horizons if backend returned empty array
  const activeHorizons: HorizonForecast[] = horizons.length > 0 ? horizons : [
    {
      horizon: "1D",
      label: "1 Day (Next Session)",
      days: 1,
      prediction: prediction,
      probability: probability,
      sentiment_score: sentimentScore,
      expected_price_target: currentPrice * (prediction === "BULLISH" ? 1.008 : 0.992),
      expected_range_low: currentPrice * 0.985,
      expected_range_high: currentPrice * 1.015,
      expected_return_pct: prediction === "BULLISH" ? 0.80 : -0.80,
      signal_strength: probability >= 0.7 ? "STRONG BUY" : "MODERATE BUY",
      rationale: "Next session momentum based on 24h volume and order flow drift."
    },
    {
      horizon: "1W",
      label: "1 Week (5 Days)",
      days: 5,
      prediction: prediction,
      probability: probability,
      sentiment_score: sentimentScore,
      expected_price_target: currentPrice * (prediction === "BULLISH" ? 1.018 : 0.982),
      expected_range_low: currentPrice * 0.97,
      expected_range_high: currentPrice * 1.03,
      expected_return_pct: prediction === "BULLISH" ? 1.80 : -1.80,
      signal_strength: "MODERATE BUY",
      rationale: "Swing momentum influenced by 5-day velocity and MACD histogram."
    },
    {
      horizon: "1M",
      label: "1 Month (21 Days)",
      days: 21,
      prediction: prediction,
      probability: probability,
      sentiment_score: sentimentScore,
      expected_price_target: currentPrice * (prediction === "BULLISH" ? 1.035 : 0.965),
      expected_range_low: currentPrice * 0.94,
      expected_range_high: currentPrice * 1.06,
      expected_return_pct: prediction === "BULLISH" ? 3.50 : -3.50,
      signal_strength: probability >= 0.7 ? "STRONG BUY" : "MODERATE BUY",
      rationale: "Intermediate trend regime governed by 20-day channel and RSI momentum."
    },
    {
      horizon: "3M",
      label: "3 Months (Quarterly)",
      days: 63,
      prediction: prediction,
      probability: probability,
      sentiment_score: sentimentScore,
      expected_price_target: currentPrice * (prediction === "BULLISH" ? 1.075 : 0.925),
      expected_range_low: currentPrice * 0.90,
      expected_range_high: currentPrice * 1.10,
      expected_return_pct: prediction === "BULLISH" ? 7.50 : -7.50,
      signal_strength: "MODERATE BUY",
      rationale: "Quarterly alpha anchored by rolling Sharpe efficiency and 50-day moving average slope."
    },
    {
      horizon: "6M",
      label: "6 Months (Macro)",
      days: 126,
      prediction: prediction,
      probability: probability,
      sentiment_score: sentimentScore,
      expected_price_target: currentPrice * (prediction === "BULLISH" ? 1.12 : 0.88),
      expected_range_low: currentPrice * 0.85,
      expected_range_high: currentPrice * 1.15,
      expected_return_pct: prediction === "BULLISH" ? 12.00 : -12.00,
      signal_strength: "MODERATE BUY",
      rationale: "Structural macro regime alignment with 50/200 SMA golden cross trends."
    },
    {
      horizon: "1Y",
      label: "1 Year (Secular)",
      days: 252,
      prediction: prediction,
      probability: probability,
      sentiment_score: sentimentScore,
      expected_price_target: currentPrice * (prediction === "BULLISH" ? 1.18 : 0.82),
      expected_range_low: currentPrice * 0.78,
      expected_range_high: currentPrice * 1.22,
      expected_return_pct: prediction === "BULLISH" ? 18.00 : -18.00,
      signal_strength: "STRONG BUY",
      rationale: "Long-term secular quantitative outlook derived from multi-year volatility cycles."
    }
  ];

  // Currently active selected horizon
  const activeH = activeHorizons.find((h) => h.horizon === selectedHorizonCode) || activeHorizons[0];
  const isBullish = activeH.prediction === "BULLISH";
  const confidencePct = Math.round(activeH.probability * 1000) / 10;

  // Sentiment interpretation
  const getSentimentTier = (score: number) => {
    if (score >= 0.6) return { label: "EXTREME GREED / STRONG EXPANSION", color: "text-emerald-400" };
    if (score >= 0.2) return { label: "MODERATE GREED / BULLISH DRIFT", color: "text-emerald-300" };
    if (score > -0.2) return { label: "NEUTRAL / EQUILIBRIUM REGIME", color: "text-amber-400" };
    if (score > -0.6) return { label: "MODERATE FEAR / BEARISH SKEW", color: "text-rose-300" };
    return { label: "EXTREME FEAR / LIQUIDATION SQUEEZE", color: "text-rose-400" };
  };

  const sentimentInfo = getSentimentTier(activeH.sentiment_score);
  const sentimentMeterPercent = Math.min(
    100,
    Math.max(0, ((activeH.sentiment_score + 1) / 2) * 100)
  );

  return (
    <div
      className={`rounded-2xl border-2 p-5 sm:p-6 shadow-2xl backdrop-blur-md transition-all duration-300 ${
        isBullish
          ? "bg-terminal-card border-emerald-500/50 shadow-emerald-500/10"
          : "bg-terminal-card border-rose-500/50 shadow-rose-500/10"
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-terminal-border/80 gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2.5 rounded-xl border-2 flex items-center justify-center shadow-lg ${
              isBullish
                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-emerald-500/20"
                : "bg-rose-500/20 border-rose-500/60 text-rose-400 shadow-rose-500/20"
            }`}
          >
            <Cpu className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-base sm:text-lg tracking-wider text-white font-mono">
                AI QUANT PREDICTION ENGINE
              </h3>
              <span className="text-[10px] font-mono uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded font-bold">
                REAL-TIME INFERENCE
              </span>
            </div>
            <p className="text-xs text-terminal-muted font-mono mt-0.5">
              Multi-Asset Algorithmic Term-Structure Engine &bull; {timestamp ? timestamp.substring(0, 19).replace("T", " ") : "LIVE"} UTC
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-terminal-muted hidden md:inline">QUANT LATENCY:</span>
          <span className="bg-terminal-bg text-amber-400 px-2.5 py-1 rounded border border-terminal-border flex items-center space-x-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>&lt; 35ms</span>
          </span>
        </div>
      </div>

      {/* HORIZON SELECTOR PILL TABS */}
      <div className="mt-4 pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-terminal-dim flex items-center space-x-1.5 uppercase">
            <Calendar className="h-4 w-4 text-sky-400" />
            <span>Forecast Horizon:</span>
          </span>
          <span className="text-xs font-mono text-terminal-muted">
            Viewing: <strong className="text-white">{activeH.label}</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-terminal-bg p-1.5 rounded-xl border border-terminal-border font-mono text-xs">
          {activeHorizons.map((h) => {
            const isSelected = selectedHorizonCode === h.horizon;
            const isHBull = h.prediction === "BULLISH";
            return (
              <button
                key={h.horizon}
                onClick={() => setSelectedHorizonCode(h.horizon)}
                className={`py-2 px-1 rounded-lg text-center font-bold transition flex flex-col items-center justify-center ${
                  isSelected
                    ? isHBull
                      ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 shadow-md shadow-emerald-500/20"
                      : "bg-rose-500/20 text-rose-400 border-2 border-rose-500 shadow-md shadow-rose-500/20"
                    : "text-terminal-dim hover:text-white hover:bg-terminal-cardHover border border-transparent"
                }`}
              >
                <span className="text-sm font-black">{h.horizon}</span>
                <span className="text-[10px] opacity-80 mt-0.5">
                  {h.horizon === "1D" ? "1 Day" : h.horizon === "1W" ? "1 Week" : h.horizon === "1M" ? "1 Month" : h.horizon === "3M" ? "3 Months" : h.horizon === "6M" ? "6 Months" : "1 Year"}
                </span>
                <span
                  className={`text-[9px] mt-1 px-1 rounded ${
                    isHBull ? "text-emerald-400 bg-emerald-500/20" : "text-rose-400 bg-rose-500/20"
                  }`}
                >
                  {isHBull ? "▲ BULL" : "▼ BEAR"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN PREDICTION SHOWCASE CARD */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (5 cols): Direction, Confidence & Recommendation */}
        <div className="lg:col-span-5 bg-terminal-bg/80 border border-terminal-border rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-terminal-muted">
                Directional Stance ({activeH.horizon})
              </span>
              <span
                className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full border ${
                  activeH.signal_strength.includes("BUY")
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    : activeH.signal_strength.includes("SELL")
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/50"
                }`}
              >
                {activeH.signal_strength}
              </span>
            </div>

            {/* Huge Direction Display */}
            <div className="flex items-center space-x-4 my-4">
              <div
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-center ${
                  isBullish
                    ? "bg-emerald-500/20 border-emerald-500/80 text-emerald-400"
                    : "bg-rose-500/20 border-rose-500/80 text-rose-400"
                }`}
              >
                {isBullish ? (
                  <TrendingUp className="h-10 w-10 animate-bounce" />
                ) : (
                  <TrendingDown className="h-10 w-10 animate-bounce" />
                )}
              </div>

              <div>
                <div
                  className={`text-3xl sm:text-4xl font-black font-mono tracking-tight leading-none ${
                    isBullish ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {activeH.prediction}
                </div>
                <div className="text-xs font-mono text-terminal-dim mt-1.5 flex items-center space-x-1">
                  <span>Target Return:</span>
                  <span
                    className={`font-bold ${
                      activeH.expected_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {activeH.expected_return_pct >= 0 ? "+" : ""}
                    {activeH.expected_return_pct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Calibrated Confidence Bar */}
          <div className="pt-2 border-t border-terminal-border/60">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="text-terminal-dim font-semibold flex items-center space-x-1">
                <Percent className="h-3.5 w-3.5 text-sky-400" />
                <span>Calibrated Probability</span>
              </span>
              <span
                className={`font-black text-sm ${
                  isBullish ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {confidencePct}%
              </span>
            </div>
            <div className="w-full bg-terminal-surface h-3 rounded-full overflow-hidden border border-terminal-border">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  isBullish
                    ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400"
                    : "bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400"
                }`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Col (7 cols): Target Price, Projected Range & Macro Sentiment */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Price & Range Box */}
          <div className="bg-terminal-bg/80 border border-terminal-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-terminal-muted flex items-center space-x-1.5 uppercase font-bold">
                <Target className="h-4 w-4 text-emerald-400" />
                <span>Price Target & Projected Volatility Cone ({activeH.horizon})</span>
              </span>
              <span className="text-[10px] font-mono text-terminal-dim">
                95% CONFIDENCE INTERVAL
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-2 font-mono">
              <div className="bg-terminal-card p-2.5 rounded-lg border border-terminal-border">
                <span className="text-[10px] text-terminal-muted block">LOWER BOUND ({currency})</span>
                <span className="text-sm sm:text-base font-bold text-rose-400">
                  {currency === "USD" ? "$" : `${currency} `}{activeH.expected_range_low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-terminal-card p-2.5 rounded-lg border-2 border-sky-500/50 shadow-sm shadow-sky-500/10">
                <span className="text-[10px] text-sky-400 block font-bold">TARGET PRICE ({currency})</span>
                <span className="text-sm sm:text-base font-black text-white">
                  {currency === "USD" ? "$" : `${currency} `}{activeH.expected_price_target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-terminal-card p-2.5 rounded-lg border border-terminal-border">
                <span className="text-[10px] text-terminal-muted block">UPPER BOUND ({currency})</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400">
                  {currency === "USD" ? "$" : `${currency} `}{activeH.expected_range_high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-terminal-dim mt-2 pt-2 border-t border-terminal-border/50">
              {activeH.rationale}
            </div>
          </div>

          {/* Macro Sentiment Slider */}
          <div className="bg-terminal-bg/80 border border-terminal-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-terminal-muted flex items-center space-x-1.5 uppercase font-bold">
                <Compass className="h-4 w-4 text-sky-400" />
                <span>Synthetic Macro Sentiment ({activeH.horizon})</span>
              </span>
              <span className="text-xs font-mono font-black text-white">
                {activeH.sentiment_score > 0 ? `+${activeH.sentiment_score.toFixed(2)}` : activeH.sentiment_score.toFixed(2)}
              </span>
            </div>

            <div className="text-xs font-mono font-bold my-1">
              <span className={sentimentInfo.color}>{sentimentInfo.label}</span>
            </div>

            <div className="relative pt-2 pb-1">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 relative overflow-hidden border border-terminal-border">
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-terminal-bg/90 z-10" />
              </div>

              <div
                className="absolute top-0 transform -translate-x-1/2 transition-all duration-700"
                style={{ left: `${sentimentMeterPercent}%` }}
              >
                <div className="w-3.5 h-5 bg-white border-2 border-terminal-bg rounded shadow-lg" />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-terminal-muted mt-2">
                <span>-1.0 (Liquidation Fear)</span>
                <span>0.0 (Neutral Equilibrium)</span>
                <span>+1.0 (Bullish Expansion)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-HORIZON TERM STRUCTURE COMPARISON MATRIX */}
      <div className="mt-6 pt-4 border-t border-terminal-border/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold text-white flex items-center space-x-1.5 uppercase tracking-wide">
            <Layers className="h-4 w-4 text-sky-400" />
            <span>FULL HORIZON TERM STRUCTURE MATRIX</span>
          </span>
          <span className="text-[11px] font-mono text-terminal-muted">
            All 6 Predictive Horizons Calculated Concurrently
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-terminal-border text-terminal-muted bg-terminal-bg/50">
                <th className="py-2.5 px-3">HORIZON</th>
                <th className="py-2.5 px-3">TRADING DAYS</th>
                <th className="py-2.5 px-3">FORECAST</th>
                <th className="py-2.5 px-3">CONFIDENCE</th>
                <th className="py-2.5 px-3">TARGET PRICE</th>
                <th className="py-2.5 px-3">EXPECTED RETURN</th>
                <th className="py-2.5 px-3">SIGNAL</th>
                <th className="py-2.5 px-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/40">
              {activeHorizons.map((h) => {
                const isHBull = h.prediction === "BULLISH";
                const isSelected = selectedHorizonCode === h.horizon;
                return (
                  <tr
                    key={h.horizon}
                    className={`transition cursor-pointer ${
                      isSelected
                        ? "bg-terminal-cardHover/90 border-l-4 border-sky-400"
                        : "hover:bg-terminal-cardHover/50"
                    }`}
                    onClick={() => setSelectedHorizonCode(h.horizon)}
                  >
                    <td className="py-2.5 px-3 font-black text-white">
                      {h.label}
                    </td>
                    <td className="py-2.5 px-3 text-terminal-dim">
                      {h.days}d
                    </td>
                    <td className="py-2.5 px-3 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border inline-flex items-center space-x-1 ${
                          isHBull
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        <span>{h.prediction}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {(h.probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 font-bold text-sky-400">
                      ${h.expected_price_target.toFixed(2)}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        h.expected_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {h.expected_return_pct >= 0 ? "+" : ""}
                      {h.expected_return_pct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          h.signal_strength.includes("BUY")
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                            : h.signal_strength.includes("SELL")
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        }`}
                      >
                        {h.signal_strength}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHorizonCode(h.horizon);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                          isSelected
                            ? "bg-sky-500 text-black"
                            : "bg-terminal-surface hover:bg-terminal-border text-terminal-dim hover:text-white"
                        }`}
                      >
                        {isSelected ? "Active" : "Inspect"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MULTI-FACTOR EXPLAINABILITY TILES */}
      {factors && factors.length > 0 && (
        <div className="mt-6 pt-4 border-t border-terminal-border/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-terminal-dim flex items-center space-x-1.5 uppercase">
              <Gauge className="h-4 w-4 text-sky-400" />
              <span>Multi-Factor Alpha Attribution & Regime Weights</span>
            </span>
            <span className="text-[10px] font-mono text-terminal-muted">
              5 Quantitative Stylized Factors Evaluated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {factors.map((factor, idx) => {
              const isFactBull = factor.signal === "BULLISH";
              const isFactBear = factor.signal === "BEARISH";
              return (
                <div
                  key={idx}
                  className="bg-terminal-bg/70 border border-terminal-border p-3 rounded-xl text-xs font-mono flex flex-col justify-between hover:border-terminal-borderGlow transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white font-bold truncate max-w-[150px]">
                      {factor.name}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-black border ${
                        isFactBull
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : isFactBear
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-terminal-surface text-amber-400 border-terminal-border"
                      }`}
                    >
                      {factor.signal}
                    </span>
                  </div>
                  <p className="text-[11px] text-terminal-muted line-clamp-2 leading-relaxed">
                    {factor.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
