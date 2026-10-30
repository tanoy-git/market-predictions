"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Database, 
  Zap, 
  Clock, 
  History, 
  Star,
  RefreshCw
} from "lucide-react";
import { SystemHealth } from "../types/api";
import { fetchSystemHealth } from "../services/api";

interface NavbarProps {
  onOpenAuditLog: () => void;
  onOpenWatchlist: () => void;
  watchlistCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuditLog,
  onOpenWatchlist,
  watchlistCount,
  onRefresh,
  isLoading,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace("T", " ").substring(0, 19) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await fetchSystemHealth();
        setHealth(data);
      } catch {
        // Fallback health state
        setHealth(null);
      }
    };
    checkHealth();
    const healthInterval = setInterval(checkHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  const isDbActive = health?.telemetry.database.connection === "connected";

  return (
    <header className="border-b border-terminal-border bg-terminal-bg/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-indigo-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wider text-white">
                MA-MAP
              </span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                v2.0.0
              </span>
            </div>
            <p className="text-[11px] text-terminal-muted hidden sm:block tracking-tight">
              Multi-Asset Market Prediction & Analytics Platform
            </p>
          </div>
        </div>

        {/* Telemetry Status Strip */}
        <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
          {/* Feed Status */}
          <div className="flex items-center space-x-1.5 bg-terminal-card border border-terminal-border px-2.5 py-1 rounded-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-terminal-dim">DATA FEED:</span>
            <span className="text-emerald-400 font-semibold">LIVE</span>
          </div>

          {/* Database Schema Status */}
          <div className="flex items-center space-x-1.5 bg-terminal-card border border-terminal-border px-2.5 py-1 rounded-md">
            <Database className="h-3 w-3 text-sky-400" />
            <span className="text-terminal-dim">POSTGRES:</span>
            <span
              className={`font-semibold ${
                isDbActive ? "text-sky-400" : "text-amber-400"
              }`}
            >
              SCHEMA [mamap]
            </span>
          </div>

          {/* Caching Tier */}
          <div className="flex items-center space-x-1.5 bg-terminal-card border border-terminal-border px-2.5 py-1 rounded-md">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-terminal-dim">CACHE:</span>
            <span className="text-amber-400 font-semibold">
              {health?.telemetry.caching_tier.redis.includes("active")
                ? "REDIS"
                : "IN-MEMORY TTL"}
            </span>
          </div>

          {/* UTC Clock */}
          <div className="flex items-center space-x-1.5 bg-terminal-card border border-terminal-border px-2.5 py-1 rounded-md text-terminal-dim">
            <Clock className="h-3 w-3 text-terminal-muted" />
            <span>{currentTime || "UTC MARKET CLOCK"}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh quantitative data"
            className="p-2 rounded-md bg-terminal-card hover:bg-terminal-cardHover border border-terminal-border text-terminal-dim hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin text-sky-400" : ""}`}
            />
          </button>

          {/* Audit Log / History Button */}
          <button
            onClick={onOpenAuditLog}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-terminal-card hover:bg-terminal-cardHover border border-terminal-border text-xs font-medium text-terminal-dim hover:text-white transition"
          >
            <History className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Audit Log</span>
          </button>

          {/* Watchlist Toggle */}
          <button
            onClick={onOpenWatchlist}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-terminal-card hover:bg-terminal-cardHover border border-terminal-border text-xs font-medium text-terminal-dim hover:text-white transition relative"
          >
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
            <span className="hidden sm:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono px-1.5 rounded-full">
                {watchlistCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
