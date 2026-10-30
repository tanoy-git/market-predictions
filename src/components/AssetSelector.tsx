"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Check, Globe, Loader2 } from "lucide-react";
import { AssetMetadata } from "../types/api";
import { searchAssets } from "../services/api";

interface AssetSelectorProps {
  currentTicker: string;
  currentTimeframe: string;
  onSelectTicker: (ticker: string) => void;
  onSelectTimeframe: (timeframe: string) => void;
  isLoading: boolean;
}

const CATEGORIES = ["ALL", "EQUITIES", "CRYPTO", "COMMODITIES", "FOREX"];

const LIVE_BENCHMARKS: AssetMetadata[] = [
  // Commodities & Precious Metals
  { ticker: "GC=F", name: "Gold Futures (COMEX)", asset_class: "Commodities", exchange: "COMEX", is_popular: true },
  { ticker: "GLD", name: "SPDR Gold Shares ETF", asset_class: "Commodities", exchange: "NYSE", is_popular: true },
  { ticker: "IAU", name: "iShares Gold Trust", asset_class: "Commodities", exchange: "NYSE", is_popular: true },
  { ticker: "SI=F", name: "Silver Futures", asset_class: "Commodities", exchange: "COMEX", is_popular: true },
  { ticker: "CL=F", name: "Crude Oil WTI", asset_class: "Commodities", exchange: "NYMEX", is_popular: true },
  // Equities
  { ticker: "AAPL", name: "Apple Inc.", asset_class: "Equities", exchange: "NASDAQ" },
  { ticker: "NVDA", name: "NVIDIA Corporation", asset_class: "Equities", exchange: "NASDAQ" },
  { ticker: "MSFT", name: "Microsoft Corporation", asset_class: "Equities", exchange: "NASDAQ" },
  { ticker: "TSLA", name: "Tesla, Inc.", asset_class: "Equities", exchange: "NASDAQ" },
  { ticker: "SPY", name: "S&P 500 ETF", asset_class: "Equities", exchange: "NYSE" },
  // Crypto
  { ticker: "BTC-USD", name: "Bitcoin USD", asset_class: "Crypto", exchange: "Global" },
  { ticker: "ETH-USD", name: "Ethereum USD", asset_class: "Crypto", exchange: "Global" },
  { ticker: "SOL-USD", name: "Solana USD", asset_class: "Crypto", exchange: "Global" },
  // Forex
  { ticker: "EURUSD=X", name: "EUR/USD", asset_class: "Forex", exchange: "FX" },
  { ticker: "GBPUSD=X", name: "GBP/USD", asset_class: "Forex", exchange: "FX" },
  { ticker: "USDJPY=X", name: "USD/JPY", asset_class: "Forex", exchange: "FX" },
];

const TIMEFRAMES = [
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
];

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  currentTicker,
  currentTimeframe,
  onSelectTicker,
  onSelectTimeframe,
  isLoading,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<AssetMetadata[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live search debounced directly against global exchange internet API
  const performLiveSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const data = await searchAssets(q.trim());
      setSearchResults(data.results || []);
    } catch {
      // Fallback to local filtering
      const filtered = LIVE_BENCHMARKS.filter(
        (a) =>
          a.ticker.toLowerCase().includes(q.toLowerCase()) ||
          a.name.toLowerCase().includes(q.toLowerCase())
      );
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performLiveSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, performLiveSearch]);

  // Display items: either live search results or category filtered benchmarks
  const displayItems =
    searchQuery.trim().length > 0
      ? searchResults
      : LIVE_BENCHMARKS.filter((asset) => {
          return (
            activeCategory === "ALL" ||
            asset.asset_class.toUpperCase() === activeCategory
          );
        });

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectTicker(searchQuery.trim().toUpperCase());
      setIsDropdownOpen(false);
    }
  };

  const getAssetBadgeColor = (assetClass: string) => {
    switch (assetClass.toUpperCase()) {
      case "EQUITIES":
        return "text-sky-400 bg-sky-500/10 border-sky-500/30";
      case "CRYPTO":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "COMMODITIES":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "FOREX":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
      default:
        return "text-terminal-dim bg-terminal-card border-terminal-border";
    }
  };

  return (
    <div className="bg-terminal-card/80 border border-terminal-border rounded-xl p-4 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Side: Real-Time Search & Combobox */}
        <div className="relative flex-1 max-w-lg" ref={dropdownRef}>
          <form onSubmit={handleCustomSubmit} className="relative">
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400 animate-spin" />
              ) : (
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-muted" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search global exchange tickers (e.g. AAPL, NVDA, BTC-USD, GC=F)..."
                className="w-full bg-terminal-bg border border-terminal-border rounded-lg pl-10 pr-24 py-2.5 text-sm text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 font-mono transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-terminal-surface hover:bg-terminal-border border border-terminal-border rounded text-xs font-mono text-terminal-dim hover:text-white transition"
              >
                Enter ↵
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-terminal-surface border border-terminal-border rounded-lg shadow-2xl z-40 max-h-72 overflow-y-auto divide-y divide-terminal-border/50">
              {displayItems.length > 0 ? (
                displayItems.map((asset) => (
                  <button
                    key={`${asset.ticker}-${asset.exchange}`}
                    onClick={() => {
                      onSelectTicker(asset.ticker);
                      setIsDropdownOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-terminal-cardHover transition ${
                      currentTicker === asset.ticker ? "bg-terminal-cardHover" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-white">
                        {asset.ticker}
                      </span>
                      <span className="text-xs text-terminal-muted truncate max-w-[200px]">
                        {asset.name}
                      </span>
                      {asset.exchange && (
                        <span className="text-[10px] text-terminal-dim font-mono hidden sm:inline">
                          ({asset.exchange})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getAssetBadgeColor(
                          asset.asset_class
                        )}`}
                      >
                        {asset.asset_class}
                      </span>
                      {currentTicker === asset.ticker && (
                        <Check className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-terminal-muted font-mono">
                  No matching exchange assets found. Press <kbd className="text-terminal-text bg-terminal-bg px-1 py-0.5 rounded">Enter</kbd> to query &quot;{searchQuery}&quot; directly from live exchange API.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Category Filter Tabs */}
        <div className="flex items-center space-x-1 bg-terminal-bg p-1 rounded-lg border border-terminal-border overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery("");
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono transition whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-terminal-surface text-sky-400 border border-sky-500/30 shadow-sm"
                  : "text-terminal-muted hover:text-terminal-dim"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right Side: Timeframe Switcher */}
        <div className="flex items-center space-x-1 bg-terminal-bg p-1 rounded-lg border border-terminal-border">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => onSelectTimeframe(tf.value)}
              disabled={isLoading}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                currentTimeframe === tf.value
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-terminal-muted hover:text-terminal-dim"
              } disabled:opacity-50`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Ticker Chips with Featured Gold Predictions */}
      <div className="mt-3 pt-3 border-t border-terminal-border/60 flex items-center space-x-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-mono text-terminal-muted flex items-center space-x-1 shrink-0">
          <Globe className="h-3 w-3 text-sky-400" />
          <span>BENCHMARKS:</span>
        </span>

        {/* Featured Gold Futures Prediction Button */}
        <button
          onClick={() => onSelectTicker("GC=F")}
          disabled={isLoading}
          className={`px-3 py-1 rounded-md text-xs font-mono shrink-0 transition flex items-center space-x-1.5 border ${
            currentTicker === "GC=F"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-md shadow-amber-500/20 font-black ring-1 ring-amber-400/40"
              : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400/90 hover:text-amber-300 border-amber-500/40"
          }`}
          title="Predict Gold Futures (COMEX)"
        >
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>🟡 GOLD (GC=F)</span>
        </button>

        {/* SPDR Gold ETF Button */}
        <button
          onClick={() => onSelectTicker("GLD")}
          disabled={isLoading}
          className={`px-2.5 py-1 rounded-md text-xs font-mono shrink-0 transition border ${
            currentTicker === "GLD"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-md shadow-amber-500/20 font-bold"
              : "bg-terminal-bg hover:bg-terminal-cardHover text-terminal-dim hover:text-white border-terminal-border"
          }`}
          title="Predict SPDR Gold Shares ETF"
        >
          GLD (Gold ETF)
        </button>

        {/* Silver Futures Button */}
        <button
          onClick={() => onSelectTicker("SI=F")}
          disabled={isLoading}
          className={`px-2.5 py-1 rounded-md text-xs font-mono shrink-0 transition border ${
            currentTicker === "SI=F"
              ? "bg-slate-300/20 text-slate-200 border-slate-400/80 shadow-md shadow-slate-400/20 font-bold"
              : "bg-terminal-bg hover:bg-terminal-cardHover text-terminal-dim hover:text-white border-terminal-border"
          }`}
          title="Predict Silver Futures"
        >
          SI=F (Silver)
        </button>

        {/* Standard Asset Chips */}
        {["AAPL", "NVDA", "BTC-USD", "ETH-USD", "CL=F", "EURUSD=X"].map((sym) => (
          <button
            key={sym}
            onClick={() => onSelectTicker(sym)}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded-md text-xs font-mono shrink-0 transition border ${
              currentTicker === sym
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/10 font-bold"
                : "bg-terminal-bg hover:bg-terminal-cardHover text-terminal-dim hover:text-white border-terminal-border"
            }`}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
};
