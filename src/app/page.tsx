"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { AssetSelector } from "../components/AssetSelector";
import { TradingChart } from "../components/TradingChart";
import { PredictionCard } from "../components/PredictionCard";
import { MetricsGrid } from "../components/MetricsGrid";
import { WatchlistDrawer } from "../components/WatchlistDrawer";
import { AuditLogModal } from "../components/AuditLogModal";
import { ComplianceFooter } from "../components/ComplianceFooter";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { 
  fetchPrediction, 
  fetchWatchlist, 
  addToWatchlist, 
  removeFromWatchlist, 
  fetchPredictionHistory 
} from "../services/api";
import { 
  PredictionResponse, 
  WatchlistItem, 
  PredictionAuditItem 
} from "../types/api";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Home() {
  const [ticker, setTicker] = useState<string>("AAPL");
  const [timeframe, setTimeframe] = useState<string>("1y");
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);

  // Audit modal state
  const [auditItems, setAuditItems] = useState<PredictionAuditItem[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAuditLoading, setIsAuditLoading] = useState<boolean>(false);

  // Load prediction
  const loadPrediction = useCallback(async (sym: string, tf: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPrediction(sym, tf);
      setPredictionData(data);
    } catch (err: unknown) {
      console.error("Failed to load prediction data:", err);
      const msg = err instanceof Error ? err.message : "Failed to fetch quantitative prediction.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPrediction(ticker, timeframe);
  }, [ticker, timeframe, loadPrediction]);

  // Load Watchlist from PostgreSQL on mount
  const loadWatchlistData = useCallback(async () => {
    try {
      const items = await fetchWatchlist();
      setWatchlist(items);
    } catch (err) {
      console.warn("Could not load watchlist from database:", err);
    }
  }, []);

  useEffect(() => {
    loadWatchlistData();
  }, [loadWatchlistData]);

  // Load Audit Log from PostgreSQL
  const loadAuditHistory = useCallback(async () => {
    setIsAuditLoading(true);
    try {
      const items = await fetchPredictionHistory(25);
      setAuditItems(items);
    } catch (err) {
      console.warn("Could not load audit log from database:", err);
    } finally {
      setIsAuditLoading(false);
    }
  }, []);

  const handleOpenAuditModal = () => {
    setIsAuditModalOpen(true);
    loadAuditHistory();
  };

  // Watchlist Actions
  const isCurrentInWatchlist = watchlist.some(
    (w) => w.ticker.toUpperCase() === ticker.toUpperCase()
  );

  const handleAddToWatchlist = async () => {
    if (!predictionData) return;
    try {
      const item = await addToWatchlist(
        predictionData.ticker,
        predictionData.asset_name,
        predictionData.asset_class || "Equities"
      );
      setWatchlist((prev) => [item, ...prev.filter((p) => p.ticker !== item.ticker)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not add to watchlist: ${msg}`);
    }
  };

  const handleRemoveFromWatchlist = async (removeTicker: string) => {
    try {
      await removeFromWatchlist(removeTicker);
      setWatchlist((prev) => prev.filter((p) => p.ticker !== removeTicker));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not remove from watchlist: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-terminal-bg text-terminal-text">
      {/* Top Institutional Header */}
      <Navbar
        onOpenAuditLog={handleOpenAuditModal}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        watchlistCount={watchlist.length}
        onRefresh={() => loadPrediction(ticker, timeframe)}
        isLoading={isLoading}
      />

      {/* Main Terminal Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Asset Class & Ticker Switcher */}
        <AssetSelector
          currentTicker={ticker}
          currentTimeframe={timeframe}
          onSelectTicker={(newTicker) => setTicker(newTicker)}
          onSelectTimeframe={(newTf) => setTimeframe(newTf)}
          isLoading={isLoading}
        />

        {/* Error Alert Display */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between text-rose-400 font-mono text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadPrediction(ticker, timeframe)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded border border-rose-500/40 text-white font-bold transition flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Content Loading State */}
        {isLoading && !predictionData ? (
          <SkeletonLoader />
        ) : predictionData ? (
          <div className="space-y-6">
            {/* Quantitative Metrics Grid */}
            <MetricsGrid
              metrics={predictionData.metrics}
              currentPrice={predictionData.current_price}
              currency={predictionData.currency}
            />

            {/* AI QUANT PREDICTION ENGINE - Prominent High-Visibility Centerpiece */}
            <div className="w-full">
              <PredictionCard
                prediction={predictionData.prediction}
                probability={predictionData.probability}
                sentimentScore={predictionData.sentiment_score}
                currentPrice={predictionData.current_price}
                currency={predictionData.currency}
                factors={predictionData.factors}
                horizons={predictionData.horizons}
                macroRegime={predictionData.macro_regime}
                seasonality={predictionData.seasonality}
                advancedQuant={predictionData.advanced_quant}
                timestamp={predictionData.timestamp}
              />
            </div>

            {/* Interactive Institutional Financial Chart */}
            <div className="w-full">
              <TradingChart
                data={predictionData.history || []}
                ticker={predictionData.ticker}
                assetName={predictionData.asset_name}
                currency={predictionData.currency}
              />
            </div>
          </div>
        ) : null}
      </main>

      {/* Watchlist Side Drawer */}
      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        currentTicker={ticker}
        onSelectTicker={(selected) => setTicker(selected)}
        onAddToWatchlist={handleAddToWatchlist}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        isCurrentInWatchlist={isCurrentInWatchlist}
      />

      {/* Historical Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditItems={auditItems}
        onSelectTicker={(selected) => setTicker(selected)}
        onRefresh={loadAuditHistory}
        isLoading={isAuditLoading}
      />

      {/* Compliance & Risk Banner */}
      <ComplianceFooter />
    </div>
  );
}
