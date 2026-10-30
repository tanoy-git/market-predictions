"use client";

import React from "react";
import { X, Trash2, Star, Plus, ExternalLink } from "lucide-react";
import { WatchlistItem } from "../types/api";

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  currentTicker: string;
  onSelectTicker: (ticker: string) => void;
  onAddToWatchlist: () => void;
  onRemoveFromWatchlist: (ticker: string) => void;
  isCurrentInWatchlist: boolean;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  watchlist,
  currentTicker,
  onSelectTicker,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isCurrentInWatchlist,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-terminal-card border-l border-terminal-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-terminal-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400/20" />
            <h3 className="font-bold text-white font-mono text-sm tracking-wide">
              PORTFOLIO WATCHLIST
            </h3>
            <span className="text-[10px] font-mono bg-terminal-surface text-terminal-dim px-2 py-0.5 rounded border border-terminal-border">
              PG [mamap.watchlists]
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-terminal-muted hover:text-white hover:bg-terminal-border transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Ticker Pin Bar */}
        <div className="p-4 bg-terminal-bg/50 border-b border-terminal-border flex items-center justify-between">
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-xs text-terminal-muted">ACTIVE:</span>
            <span className="font-bold text-sm text-sky-400">{currentTicker}</span>
          </div>

          {!isCurrentInWatchlist ? (
            <button
              onClick={onAddToWatchlist}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-mono transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Pin to Watchlist</span>
            </button>
          ) : (
            <span className="text-xs font-mono text-amber-400 flex items-center space-x-1">
              <Star className="h-3 w-3 fill-amber-400" />
              <span>Pinned in DB</span>
            </span>
          )}
        </div>

        {/* Watchlist Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {watchlist.length === 0 ? (
            <div className="text-center py-12 text-terminal-muted font-mono text-xs">
              No assets pinned yet. Click &quot;Pin to Watchlist&quot; to save tickers into PostgreSQL.
            </div>
          ) : (
            watchlist.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border font-mono flex items-center justify-between transition ${
                  currentTicker === item.ticker
                    ? "bg-terminal-cardHover border-sky-500/40 shadow-sm"
                    : "bg-terminal-bg/80 border-terminal-border hover:border-terminal-borderGlow"
                }`}
              >
                <div
                  onClick={() => {
                    onSelectTicker(item.ticker);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">
                      {item.ticker}
                    </span>
                    <span className="text-[10px] text-terminal-dim bg-terminal-surface px-1.5 py-0.5 rounded border border-terminal-border">
                      {item.asset_class}
                    </span>
                  </div>
                  <div className="text-xs text-terminal-muted truncate max-w-[200px] mt-0.5">
                    {item.asset_name}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-2">
                  <button
                    onClick={() => {
                      onSelectTicker(item.ticker);
                      onClose();
                    }}
                    title="Load analysis"
                    className="p-1.5 rounded text-terminal-dim hover:text-sky-400 hover:bg-terminal-surface transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveFromWatchlist(item.ticker)}
                    title="Remove from DB"
                    className="p-1.5 rounded text-terminal-dim hover:text-rose-400 hover:bg-terminal-surface transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-terminal-border text-[11px] font-mono text-terminal-muted text-center bg-terminal-bg">
          PostgreSQL persistence layer active
        </div>
      </div>
    </div>
  );
};
