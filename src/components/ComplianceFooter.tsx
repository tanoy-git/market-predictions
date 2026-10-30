"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export const ComplianceFooter: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-terminal-border/80 bg-terminal-bg py-8 text-terminal-muted font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Compliance Warning Box */}
        <div className="bg-terminal-card/80 border border-amber-500/20 rounded-xl p-4 flex items-start space-x-3.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <div className="text-white font-bold flex items-center space-x-2">
              <span className="tracking-wide">INSTITUTIONAL QUANTITATIVE RESEARCH & COMPLIANCE DISCLAIMER</span>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                REGULATORY NOTICE
              </span>
            </div>
            <p className="text-[11px] text-terminal-dim leading-relaxed">
              MA-MAP quantitative model outputs, directional forecasts (BULLISH / BEARISH), calibrated probability scores,
              macro sentiment indicators, and risk metrics (Sharpe ratio proxies, annualized volatility, maximum drawdowns)
              are purely algorithmic computational outputs derived from statistical feature engineering of historical OHLCV market data.
              This platform does not provide investment, portfolio management, tax, or legal advice. Capital is subject to severe market risk.
              Algorithmic inferences do not guarantee future returns.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-terminal-border/40 text-[11px] gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span>MA-MAP Architecture v2.0.0 &bull; Micro-Services Monorepo &bull; Docker Containerized</span>
          </div>

          <div className="flex items-center space-x-4 text-terminal-dim">
            <span>FastAPI 0.115+</span>
            <span>Next.js 14 App Router</span>
            <span>PostgreSQL [mamap]</span>
            <span>Redis Caching</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    </svg>
  );
}
