"use client";

import React from "react";
import { X, History, RefreshCw, ArrowUpRight, ArrowDownRight, Database } from "lucide-react";
import { PredictionAuditItem } from "../types/api";

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditItems: PredictionAuditItem[];
  onSelectTicker: (ticker: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditItems,
  onSelectTicker,
  onRefresh,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-terminal-card border border-terminal-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-terminal-border flex items-center justify-between bg-terminal-surface">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-mono">
                  QUANT INFERENCE AUDIT TRAIL
                </h3>
                <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30 flex items-center space-x-1">
                  <Database className="h-2.5 w-2.5" />
                  <span>mamap.prediction_logs</span>
                </span>
              </div>
              <p className="text-xs text-terminal-muted font-mono">
                Immutable compliance log of quantitative predictions stored in PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh audit log"
              className="p-1.5 rounded bg-terminal-bg hover:bg-terminal-border text-terminal-dim hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-sky-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-terminal-bg hover:bg-terminal-border text-terminal-dim hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4">
          {auditItems.length === 0 ? (
            <div className="text-center py-16 text-terminal-muted font-mono text-xs">
              No historical predictions logged yet in PostgreSQL. Queries will automatically record here.
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-terminal-border text-terminal-muted">
                  <th className="py-2.5 px-3">TIMESTAMP (UTC)</th>
                  <th className="py-2.5 px-3">TICKER</th>
                  <th className="py-2.5 px-3">CLASS</th>
                  <th className="py-2.5 px-3">SPOT PRICE</th>
                  <th className="py-2.5 px-3">PREDICTION</th>
                  <th className="py-2.5 px-3">CONFIDENCE</th>
                  <th className="py-2.5 px-3">SHARPE</th>
                  <th className="py-2.5 px-3">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border/50">
                {auditItems.map((item) => {
                  const isBull = item.prediction === "BULLISH";
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-terminal-cardHover/60 transition"
                    >
                      <td className="py-2.5 px-3 text-terminal-dim whitespace-nowrap">
                        {item.created_at ? item.created_at.substring(0, 19).replace("T", " ") : "-"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                        {item.ticker}
                      </td>
                      <td className="py-2.5 px-3 text-terminal-muted whitespace-nowrap">
                        {item.asset_class}
                      </td>
                      <td className="py-2.5 px-3 text-white whitespace-nowrap">
                        ${item.current_price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center space-x-1 ${
                            isBull
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {isBull ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          <span>{item.prediction}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-terminal-dim whitespace-nowrap">
                        {(item.probability * 100).toFixed(1)}%
                      </td>
                      <td
                        className={`py-2.5 px-3 font-semibold whitespace-nowrap ${
                          item.sharpe_ratio >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {item.sharpe_ratio.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <button
                          onClick={() => {
                            onSelectTicker(item.ticker);
                            onClose();
                          }}
                          className="px-2 py-1 rounded bg-terminal-surface hover:bg-terminal-border border border-terminal-border text-sky-400 hover:text-white transition text-[11px]"
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-terminal-border bg-terminal-bg text-right text-[11px] font-mono text-terminal-muted">
          Showing up to 25 recent quantitative audits
        </div>
      </div>
    </div>
  );
};

