import React, { useState, useEffect, useCallback } from "react";
import {
  SwingCandidate,
  PortfolioPosition,
  RiskPolicy,
  MarketCalendarStatus,
  AuditTrailItem,
  TradingAnalysisStyle,
  ANALYSIS_STYLE_OPTIONS,
  ModelStatus,
  BacktestResponse,
  AssetMarket
} from "../../types/api";
import {
  fetchSwingCandidates,
  generateSwingCandidates,
  approveSwingCandidate,
  rejectSwingCandidate,
  editSwingCandidate,
  fetchPortfolioPositions,
  recordManualExecution,
  closePortfolioPosition,
  fetchRiskPolicy,
  updateRiskPolicy,
  fetchMarketCalendars,
  fetchAuditTrail,
  fetchSwingModelStatus,
  fetchSwingBacktest
} from "../../services/api";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Play,
  RotateCcw,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Briefcase,
  FileText,
  AlertOctagon,
  Percent,
  Check,
  Info,
  Cpu,
  BarChart2,
  RefreshCw
} from "lucide-react";

export const SwingDashboard: React.FC = () => {
  const [activeMarket, setActiveMarket] = useState<AssetMarket>("US");
  const [activeTab, setActiveTab] = useState<"CANDIDATES" | "RISK" | "VALIDATION" | "PORTFOLIO" | "REGULATORY" | "AUDIT">("CANDIDATES");
  const [candidateFilter, setCandidateFilter] = useState<"ALL" | "BUY" | "APPROVED_REVIEW" | "USER_APPROVED">("ALL");
  const [selectedStyle, setSelectedStyle] = useState<TradingAnalysisStyle>("ALL");

  const [candidates, setCandidates] = useState<SwingCandidate[]>([]);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [riskPolicy, setRiskPolicy] = useState<RiskPolicy | null>(null);
  const [calendars, setCalendars] = useState<MarketCalendarStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditTrailItem[]>([]);

  // ML Ensemble & Backtest state
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [backtestData, setBacktestData] = useState<BacktestResponse | null>(null);
  const [isLoadingBacktest, setIsLoadingBacktest] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modals state
  const [editingCandidate, setEditingCandidate] = useState<SwingCandidate | null>(null);
  const [editStopLoss, setEditStopLoss] = useState<number>(0);
  const [editTargetPrice, setEditTargetPrice] = useState<number>(0);
  const [editShares, setEditShares] = useState<number>(0);

  const [executingCandidate, setExecutingCandidate] = useState<SwingCandidate | null>(null);
  const [execBroker, setExecBroker] = useState<string>("Manual Broker Platform");
  const [execPrice, setExecPrice] = useState<number>(0);
  const [execQty, setExecQty] = useState<number>(0);
  const [execFees, setExecFees] = useState<number>(1.0);
  const [execNotes, setExecNotes] = useState<string>("");

  const [rejectingCandidate, setRejectingCandidate] = useState<SwingCandidate | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  // Feedback notifications
  const [bannerMessage, setBannerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showBanner = (text: string, type: "success" | "error" = "success") => {
    setBannerMessage({ type, text });
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [candData, posData, policyData, calData, auditData] = await Promise.all([
        fetchSwingCandidates(activeMarket),
        fetchPortfolioPositions(activeMarket),
        fetchRiskPolicy(),
        fetchMarketCalendars(),
        fetchAuditTrail(25)
      ]);
      setCandidates(candData);
      setPositions(posData);
      setRiskPolicy(policyData);
      setCalendars(calData);
      setAuditLogs(auditData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showBanner(`Error loading swing trading state: ${msg}`, "error");
    } finally {
      setIsLoading(false);
    }
  }, [activeMarket]);

  const loadBacktestData = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoadingBacktest(true);
    try {
      const [statusRes, backtestRes] = await Promise.all([
        fetchSwingModelStatus(),
        fetchSwingBacktest(activeMarket, forceRefresh)
      ]);
      setModelStatus(statusRes);
      setBacktestData(backtestRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showBanner(`Failed to load model backtest: ${msg}`, "error");
    } finally {
      setIsLoadingBacktest(false);
    }
  }, [activeMarket]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "VALIDATION") {
      loadBacktestData(false);
    }
  }, [activeTab, loadBacktestData]);

  // Handlers
  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const res = await generateSwingCandidates(activeMarket, selectedStyle);
      showBanner(`Scan complete: ${res.count} profiles analyzed for ${activeMarket} market (${selectedStyle === "ALL" ? "All Horizons" : selectedStyle}).`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showBanner(`Scanning error: ${msg}`, "error");
    } finally {
      setIsScanning(false);
    }
  };

  const handleApprove = async (cand: SwingCandidate) => {
    try {
      await approveSwingCandidate(cand.id, "Approved by human trader after technical setup review.");
      showBanner(`Approved ${cand.symbol} for manual broker execution!`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showBanner(msg, "error");
    }
  };

  const handleOpenReject = (cand: SwingCandidate) => {
    setRejectingCandidate(cand);
    setRejectReason("Setup does not meet subjective discretionary criteria.");
  };

  const handleConfirmReject = async () => {
    if (!rejectingCandidate) return;
    try {
      await rejectSwingCandidate(rejectingCandidate.id, rejectReason);
      showBanner(`Rejected candidate ${rejectingCandidate.symbol}.`);
      setRejectingCandidate(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showBanner(msg, "error");
    }
  };

  const handleOpenEdit = (cand: SwingCandidate) => {
    setEditingCandidate(cand);
    setEditStopLoss(cand.stop_loss);
    setEditTargetPrice(cand.target_price);
    setEditShares(cand.suggested_shares);
  };

  const handleSaveEdit = async () => {
    if (!editingCandidate) return;
    try {
      await editSwingCandidate(editingCandidate.id, {
        stop_loss: editStopLoss,
        target_price: editTargetPrice,
        suggested_shares: editShares
      });
      showBanner(`Parameters for ${editingCandidate.symbol} updated successfully.`);
      setEditingCandidate(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showBanner(msg, "error");
    }
  };

  const handleOpenExecute = (cand: SwingCandidate) => {
    setExecutingCandidate(cand);
    setExecPrice(cand.current_price);
    setExecQty(cand.suggested_shares);
    const broker =
      cand.market === "US" ? "Interactive Brokers / Charles Schwab" :
      cand.market === "BD" ? "EBL Securities / LankaBangla (DSE)" :
      cand.market === "COMMODITIES" ? "CME Futures Broker / NinjaTrader" :
      cand.market === "CRYPTO" ? "Coinbase Advanced / Kraken / Binance" :
      "OANDA / Interactive Brokers FX";
    const fees =
      cand.market === "US" ? 1.0 :
      cand.market === "BD" ? 150.0 :
      cand.market === "COMMODITIES" ? 2.5 :
      cand.market === "CRYPTO" ? 0.5 :
      0.0;
    setExecBroker(broker);
    setExecFees(fees);
    setExecNotes("Executed manually in broker terminal outside AI.");
  };

  const handleConfirmExecute = async () => {
    if (!executingCandidate) return;
    try {
      await recordManualExecution({
        candidate_id: executingCandidate.id,
        symbol: executingCandidate.symbol,
        market: executingCandidate.market,
        currency: executingCandidate.currency,
        broker_name: execBroker,
        fill_price: execPrice,
        quantity: execQty,
        stop_loss: executingCandidate.stop_loss,
        target_price: executingCandidate.target_price,
        fees: execFees,
        notes: execNotes
      });
      showBanner(`Execution for ${executingCandidate.symbol} recorded in portfolio tracker!`);
      setExecutingCandidate(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showBanner(msg, "error");
    }
  };

  const handleClosePosition = async (pos: PortfolioPosition) => {
    const exitPriceStr = prompt(`Enter broker fill exit price for ${pos.symbol} (${pos.currency}):`, pos.current_price.toString());
    if (!exitPriceStr) return;
    const exitPrice = parseFloat(exitPriceStr);
    if (isNaN(exitPrice)) return;

    try {
      await closePortfolioPosition(pos.id, exitPrice, activeMarket === "US" ? 1.0 : 150.0);
      showBanner(`Position for ${pos.symbol} closed successfully.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showBanner(msg, "error");
    }
  };

  const handleToggleKillSwitch = async () => {
    if (!riskPolicy) return;
    const nextState = !riskPolicy.kill_switch_active;
    const confirmMsg = nextState
      ? "ENGAGE EMERGENCY KILL-SWITCH? This will immediately reject all new trade proposals and halt recommendations."
      : "DISENGAGE KILL-SWITCH and resume normal risk validations?";
    if (!confirm(confirmMsg)) return;

    try {
      await updateRiskPolicy({ kill_switch_active: nextState });
      showBanner(`Portfolio Kill-Switch is now ${nextState ? "ENGAGED (ACTIVE)" : "DISENGAGED"}.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showBanner(msg, "error");
    }
  };

  // Filtered candidate list based on active style and status filter
  const filteredCandidates = candidates.filter((c) => {
    // 1. Trading Style Filter
    if (selectedStyle !== "ALL") {
      const h = (c.horizon || "").toLowerCase();
      if (selectedStyle === "DAY_TRADING" && !h.includes("day trading")) return false;
      if (selectedStyle === "SWING_TRADING" && !h.includes("swing trading")) return false;
      if (selectedStyle === "POSITION_TRADING" && !h.includes("position trading")) return false;
      if (selectedStyle === "LONG_TERM_INVESTING" && !h.includes("long-term")) return false;
    }
    // 2. Recommendation & Approval Filter
    if (candidateFilter === "BUY") return c.recommendation === "BUY candidate";
    if (candidateFilter === "APPROVED_REVIEW") return c.risk_status === "APPROVED_FOR_REVIEW";
    if (candidateFilter === "USER_APPROVED") return c.approval_status === "APPROVED";
    return true;
  });

  const currencySymbol = activeMarket === "BD" ? "BDT " : (activeMarket === "FOREX" ? "" : "$");
  const activeCalendar = 
    activeMarket === "US" ? calendars?.us :
    activeMarket === "BD" ? calendars?.bd :
    activeMarket === "COMMODITIES" ? calendars?.commodities :
    activeMarket === "CRYPTO" ? calendars?.crypto :
    calendars?.forex;

  return (
    <div className="space-y-6">
      {/* Banner Notifications */}
      {bannerMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between shadow-lg transition animate-fadeIn ${
            bannerMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            {bannerMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertOctagon className="h-4 w-4" />}
            <span>{bannerMessage.text}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="text-terminal-dim hover:text-white">✕</button>
        </div>
      )}

      {/* TOP CONTROL BAR: Multi-Asset Class Switcher, Session Status & Rescan */}
      <div className="bg-terminal-card border border-terminal-border p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Multi-Asset Class Switcher */}
          <div className="inline-flex flex-wrap p-1 bg-terminal-bg rounded-xl border border-terminal-border gap-1">
            <button
              onClick={() => setActiveMarket("US")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                activeMarket === "US"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/60 shadow-md shadow-sky-500/10"
                  : "text-terminal-dim hover:text-white"
              }`}
            >
              <span>🇺🇸 US Equities</span>
              <span className="text-[10px] bg-sky-500/20 px-1 py-0.2 rounded text-sky-300">NYSE/NASDAQ</span>
            </button>

            <button
              onClick={() => setActiveMarket("BD")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                activeMarket === "BD"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-md shadow-emerald-500/10"
                  : "text-terminal-dim hover:text-white"
              }`}
            >
              <span>🇧🇩 BD Equities</span>
              <span className="text-[10px] bg-emerald-500/20 px-1 py-0.2 rounded text-emerald-300">DSE</span>
            </button>

            <button
              onClick={() => setActiveMarket("CRYPTO")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                activeMarket === "CRYPTO"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10"
                  : "text-terminal-dim hover:text-white"
              }`}
            >
              <span>🪙 Crypto</span>
              <span className="text-[10px] bg-amber-500/20 px-1 py-0.2 rounded text-amber-300">24/7 Spot</span>
            </button>

            <button
              onClick={() => setActiveMarket("COMMODITIES")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                activeMarket === "COMMODITIES"
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/60 shadow-md shadow-yellow-500/10"
                  : "text-terminal-dim hover:text-white"
              }`}
            >
              <span>🥇 Commodities</span>
              <span className="text-[10px] bg-yellow-500/20 px-1 py-0.2 rounded text-yellow-300">Gold / Oil</span>
            </button>

            <button
              onClick={() => setActiveMarket("FOREX")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                activeMarket === "FOREX"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-md shadow-purple-500/10"
                  : "text-terminal-dim hover:text-white"
              }`}
            >
              <span>💱 Forex</span>
              <span className="text-[10px] bg-purple-500/20 px-1 py-0.2 rounded text-purple-300">FX / BDT</span>
            </button>
          </div>

          {/* Session Clock Badge */}
          {activeCalendar && (
            <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-terminal-bg border border-terminal-border font-mono text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  activeCalendar.is_open ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-terminal-dim">{activeMarket} Session:</span>
              <span className={activeCalendar.is_open ? "text-emerald-300 font-bold" : "text-amber-300"}>
                {activeCalendar.current_session}
              </span>
            </div>
          )}
        </div>

        {/* Right Controls: Kill-Switch Indicator & Re-Scan Button */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          {/* Emergency Kill Switch Status Pill */}
          <button
            onClick={handleToggleKillSwitch}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 border transition ${
              riskPolicy?.kill_switch_active
                ? "bg-rose-500/20 text-rose-300 border-rose-500/80 animate-pulse ring-2 ring-rose-500/40"
                : "bg-terminal-bg text-terminal-dim hover:text-white border-terminal-border"
            }`}
            title="Emergency Kill-Switch (Safety Principle)"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>KILL-SWITCH: {riskPolicy?.kill_switch_active ? "ENGAGED (HALTED)" : "DISENGAGED"}</span>
          </button>

          {/* Re-Analyze Button */}
          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-black transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Analyzing..." : "Re-Scan Market"}</span>
          </button>
        </div>
      </div>

      {/* ANALYSIS OPTIONS / TRADING HORIZONS SELECTOR */}
      <div className="bg-terminal-card border border-terminal-border p-3 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-2 text-xs font-mono text-terminal-muted">
          <span className="text-white font-bold uppercase tracking-wider text-[11px]">Analysis Options:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs w-full lg:w-auto">
          <button
            onClick={() => setSelectedStyle("ALL")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 border ${
              selectedStyle === "ALL"
                ? "bg-slate-700/90 text-white border-slate-400 font-bold shadow-sm"
                : "bg-terminal-bg text-terminal-dim hover:text-white border-terminal-border"
            }`}
          >
            <span>🌐</span>
            <span>All Horizons</span>
          </button>

          {ANALYSIS_STYLE_OPTIONS.map((style) => {
            const isSelected = selectedStyle === style.id;
            const styleColor =
              style.id === "DAY_TRADING"
                ? isSelected
                  ? "bg-amber-500/25 text-amber-300 border-amber-500/80 shadow-md shadow-amber-500/10 font-bold"
                  : "text-terminal-dim hover:text-amber-300 border-terminal-border"
                : style.id === "SWING_TRADING"
                ? isSelected
                  ? "bg-sky-500/25 text-sky-300 border-sky-500/80 shadow-md shadow-sky-500/10 font-bold"
                  : "text-terminal-dim hover:text-sky-300 border-terminal-border"
                : style.id === "POSITION_TRADING"
                ? isSelected
                  ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/80 shadow-md shadow-emerald-500/10 font-bold"
                  : "text-terminal-dim hover:text-emerald-300 border-terminal-border"
                : isSelected
                ? "bg-purple-500/25 text-purple-300 border-purple-500/80 shadow-md shadow-purple-500/10 font-bold"
                : "text-terminal-dim hover:text-purple-300 border-terminal-border";

            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-2 border bg-terminal-bg ${styleColor}`}
                title={style.description}
              >
                <span>{style.icon}</span>
                <span>{style.label}</span>
                <span className="text-[10px] opacity-80 font-sans px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-semibold">
                  {style.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-terminal-border/80 pb-2 overflow-x-auto scrollbar-none font-mono text-xs">
        <button
          onClick={() => setActiveTab("CANDIDATES")}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "CANDIDATES"
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/60 shadow-sm"
              : "text-terminal-dim hover:text-white hover:bg-terminal-cardHover"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>🎯 Trade Candidates &amp; Human Approval ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("RISK")}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "RISK"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-sm"
              : "text-terminal-dim hover:text-white hover:bg-terminal-cardHover"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>🛡️ Independent Risk Engine</span>
        </button>

        <button
          onClick={() => setActiveTab("VALIDATION")}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "VALIDATION"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-sm"
              : "text-terminal-dim hover:text-white hover:bg-terminal-cardHover"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>🔬 Walk-Forward Backtest &amp; ML Ensemble</span>
        </button>

        <button
          onClick={() => setActiveTab("PORTFOLIO")}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "PORTFOLIO"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-sm"
              : "text-terminal-dim hover:text-white hover:bg-terminal-cardHover"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>💼 Portfolio Tracker &amp; Broker Fills ({positions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("REGULATORY")}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "REGULATORY"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/60 shadow-sm"
              : "text-terminal-dim hover:text-white hover:bg-terminal-cardHover"
          }`}
        >
          <Info className="h-4 w-4" />
          <span>📜 Regulatory &amp; Calendar (FERA / DSE)</span>
        </button>

        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "AUDIT"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-sm"
              : "text-terminal-dim hover:text-white hover:bg-terminal-cardHover"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>🔍 Audit History</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SWING CANDIDATES & HUMAN APPROVAL QUEUE                           */}
      {/* ========================================================================= */}
      {activeTab === "CANDIDATES" && (
        <div className="space-y-4">
          {/* Candidate Filter Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-terminal-card p-3 rounded-xl border border-terminal-border font-mono text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-terminal-muted">Filter Queue:</span>
              {(["ALL", "BUY", "APPROVED_REVIEW", "USER_APPROVED"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setCandidateFilter(f)}
                  className={`px-3 py-1 rounded-md text-xs transition ${
                    candidateFilter === f
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold"
                      : "text-terminal-dim hover:text-white bg-terminal-bg"
                  }`}
                >
                  {f === "ALL" && "All Candidates"}
                  {f === "BUY" && "BUY Candidates"}
                  {f === "APPROVED_REVIEW" && "Risk-Approved Only"}
                  {f === "USER_APPROVED" && "Approved by You"}
                </button>
              ))}
            </div>

            <div className="text-terminal-dim text-[11px] flex items-center space-x-2">
              <span>
                Showing <span className="text-white font-bold">{filteredCandidates.length}</span> of {candidates.length} instruments analyzed
              </span>
              {isLoading && <span className="text-sky-400 animate-pulse text-[10px] bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">Syncing...</span>}
            </div>
          </div>

          {/* Candidate Cards Grid */}
          {filteredCandidates.length === 0 ? (
            <div className="bg-terminal-card border border-terminal-border p-12 rounded-2xl text-center font-mono">
              <p className="text-terminal-muted text-sm">No candidates match the selected filter in {activeMarket} market.</p>
              <button
                onClick={handleTriggerScan}
                className="mt-4 px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-lg"
              >
                Scan Universe Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCandidates.map((c) => {
                const isBuy = c.recommendation === "BUY candidate";
                const isRiskApproved = c.risk_status === "APPROVED_FOR_REVIEW";
                const isExpanded = expandedId === c.id;

                return (
                  <div
                    key={c.id}
                    className={`bg-terminal-card rounded-2xl border transition-all shadow-xl overflow-hidden ${
                      isBuy && isRiskApproved
                        ? "border-emerald-500/40 hover:border-emerald-500/70"
                        : "border-terminal-border hover:border-terminal-border/80"
                    }`}
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-terminal-border/60 flex items-center justify-between bg-terminal-bg/40">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-black font-mono text-white">{c.symbol}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-terminal-surface text-terminal-muted border border-terminal-border">
                            {c.sector}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border inline-flex items-center space-x-1 ${
                              c.horizon.includes("Day Trading")
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                                : c.horizon.includes("Position")
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                                : c.horizon.includes("Long-term")
                                ? "bg-purple-500/15 text-purple-300 border-purple-500/40"
                                : "bg-sky-500/15 text-sky-300 border-sky-500/40"
                            }`}
                          >
                            <span>
                              {c.horizon.includes("Day Trading")
                                ? "⚡"
                                : c.horizon.includes("Position")
                                ? "🎯"
                                : c.horizon.includes("Long-term")
                                ? "🏛️"
                                : "🌊"}
                            </span>
                            <span>{c.horizon}</span>
                          </span>
                        </div>
                        <p className="text-xs text-terminal-muted truncate max-w-xs mt-0.5">{c.asset_name}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-mono font-bold text-white">
                          {currencySymbol}{c.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-block mt-0.5 ${
                            isBuy
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                              : "bg-terminal-surface text-terminal-muted border-terminal-border"
                          }`}
                        >
                          {c.recommendation}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Target, Stop, Probability, Position Size */}
                    <div className="p-4 space-y-3 font-mono text-xs">
                      {/* Price Levels Matrix */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-terminal-bg p-2 rounded-lg border border-terminal-border">
                          <span className="text-[10px] text-terminal-muted block">ENTRY RANGE</span>
                          <span className="font-bold text-sky-300">
                            {c.entry_low.toFixed(1)} – {c.entry_high.toFixed(1)}
                          </span>
                        </div>

                        <div className="bg-terminal-bg p-2 rounded-lg border border-terminal-border">
                          <span className="text-[10px] text-rose-400 block font-semibold">STOP-LOSS</span>
                          <span className="font-bold text-rose-400">
                            {c.currency === "BDT" ? "BDT " : (c.currency === "USD" ? "$" : "")}{c.stop_loss.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-terminal-muted block">
                            (-{(((c.current_price - c.stop_loss) / c.current_price) * 100).toFixed(1)}%)
                          </span>
                        </div>

                        <div className="bg-terminal-bg p-2 rounded-lg border border-terminal-border">
                          <span className="text-[10px] text-emerald-400 block font-semibold">TARGET (R:R {c.reward_risk_ratio}x)</span>
                          <span className="font-bold text-emerald-400">
                            {c.currency === "BDT" ? "BDT " : (c.currency === "USD" ? "$" : "")}{c.target_price.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-emerald-400/80 block">
                            (+{c.expected_return_pct.toFixed(1)}% net)
                          </span>
                        </div>
                      </div>

                      {/* Position Sizing & Probability Row */}
                      <div className="bg-terminal-bg/70 p-2.5 rounded-lg border border-terminal-border flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-terminal-muted block">SUGGESTED POSITION SIZE</span>
                          <span className="font-bold text-white text-sm">
                            {c.suggested_shares > 0 ? (
                              <>
                                {c.market === "CRYPTO"
                                  ? `${c.suggested_shares.toFixed(4)} Coins`
                                  : c.market === "COMMODITIES"
                                  ? `${c.suggested_shares} Contracts`
                                  : c.market === "FOREX"
                                  ? `${c.suggested_shares.toFixed(2)} Lots`
                                  : `${Math.round(c.suggested_shares)} Shares`}{" "}
                                <span className="text-terminal-dim text-[11px] font-normal">
                                  ({c.currency === "BDT" ? "BDT " : (c.currency === "USD" ? "$" : "")}{c.allocated_capital.toLocaleString()})
                                </span>
                              </>
                            ) : (
                              <span className="text-terminal-muted text-xs">0 (Risk Rejection)</span>
                            )}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-terminal-muted block">CALIBRATED PROB</span>
                          <span className="font-black text-sm text-emerald-400">
                            {(c.calibrated_probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Independent Risk Engine Verdict Badge */}
                      <div
                        className={`p-2.5 rounded-lg border flex items-start space-x-2 ${
                          isRiskApproved
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                            : "bg-rose-500/10 border-rose-500/40 text-rose-300"
                        }`}
                      >
                        {isRiskApproved ? (
                          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                        )}
                        <div className="text-[11px] leading-relaxed">
                          <span className="font-bold block">
                            INDEPENDENT RISK ENGINE: {c.risk_status.replace(/_/g, " ")}
                          </span>
                          {c.risk_rejection_reasons && c.risk_rejection_reasons.length > 0 ? (
                            <ul className="list-disc pl-4 mt-1 text-[10px] text-rose-300 space-y-0.5">
                              {c.risk_rejection_reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-[10px] text-emerald-400/90 block">
                              Passed all 9 validation checks: Reward/Risk (2.0+), Stop distance, Turnover &amp; Capital limits.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Human Approval Status / Notes */}
                      {c.approval_status !== "PENDING_REVIEW" && (
                        <div className="p-2 rounded-lg bg-terminal-surface border border-terminal-border flex items-center justify-between text-[11px]">
                          <span className="text-terminal-muted">DECISION STATUS:</span>
                          <span
                            className={`font-bold ${
                              c.approval_status === "APPROVED"
                                ? "text-emerald-400"
                                : c.approval_status === "EXECUTED"
                                ? "text-sky-400"
                                : "text-rose-400"
                            }`}
                          >
                            {c.approval_status}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Collapsible Model Explainability Accordion */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-terminal-border/60 bg-terminal-bg/50 font-mono text-xs space-y-2.5 animate-fadeIn">
                        <div>
                          <span className="text-emerald-400 font-bold text-[11px] block mb-1">
                            SUPPORTING FACTORS (MODEL ENSEMBLE):
                          </span>
                          <ul className="list-disc pl-4 text-[11px] text-terminal-dim space-y-1">
                            {c.supporting_factors.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>

                        {c.opposing_factors && c.opposing_factors.length > 0 && (
                          <div>
                            <span className="text-amber-400 font-bold text-[11px] block mb-1">
                              OPPOSING FACTORS:
                            </span>
                            <ul className="list-disc pl-4 text-[11px] text-terminal-dim space-y-1">
                              {c.opposing_factors.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <span className="text-rose-400 font-bold text-[11px] block mb-1">
                            THESIS INVALIDATION CONDITIONS:
                          </span>
                          <ul className="list-disc pl-4 text-[11px] text-terminal-dim space-y-1">
                            {c.invalidation_rules.map((rule, i) => (
                              <li key={i}>{rule}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 text-[10px] text-terminal-muted border-t border-terminal-border/40 flex flex-wrap justify-between gap-2">
                          <span>Model: {c.model_version}</span>
                          <span className="text-sky-300 font-semibold">
                            Horizon Target: {c.holding_days === 1 ? "Intraday (Square off before bell)" : `${c.holding_days} Days`}
                          </span>
                          <span>20D Turnover: {currencySymbol}{(c.turnover_20d / 1e6).toFixed(1)}M</span>
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div className="p-3 bg-terminal-bg border-t border-terminal-border flex items-center justify-between font-mono text-xs">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className="text-terminal-dim hover:text-white flex items-center space-x-1 text-[11px]"
                      >
                        <span>{isExpanded ? "Hide Details" : "Explain Setup"}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {/* Human Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {c.approval_status === "PENDING_REVIEW" && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-terminal-card hover:bg-terminal-cardHover border border-terminal-border text-terminal-dim hover:text-white transition flex items-center space-x-1"
                              title="Edit stop loss, target, or position shares"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleOpenReject(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition"
                            >
                              Reject
                            </button>

                            <button
                              onClick={() => handleApprove(c)}
                              disabled={!isRiskApproved}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition flex items-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
                              title={isRiskApproved ? "Approve trade proposal" : "Blocked by independent risk engine"}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                              <span>Approve Trade</span>
                            </button>
                          </>
                        )}

                        {c.approval_status === "APPROVED" && (
                          <button
                            onClick={() => handleOpenExecute(c)}
                            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold transition flex items-center space-x-1.5 shadow-md shadow-sky-500/20"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Record Broker Fill</span>
                          </button>
                        )}

                        {c.approval_status === "EXECUTED" && (
                          <span className="text-sky-400 font-bold text-[11px] flex items-center space-x-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Executed in Broker</span>
                          </span>
                        )}

                        {c.approval_status === "REJECTED" && (
                          <span className="text-rose-400 font-bold text-[11px] flex items-center space-x-1">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Rejected by Trader</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INDEPENDENT RISK ENGINE & KILL-SWITCH PANEL                       */}
      {/* ========================================================================= */}
      {activeTab === "RISK" && riskPolicy && (
        <div className="space-y-6 font-mono">
          {/* Core Safety Principle Alert Card */}
          <div className="bg-amber-500/10 border-2 border-amber-500/40 p-5 rounded-2xl flex items-start space-x-3.5 text-xs text-amber-200">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="font-bold text-sm text-amber-300 uppercase tracking-wide">
                Core Safety Principle: Independent Risk Validation
              </h4>
              <p className="text-amber-200/90 leading-relaxed">
                The risk engine operates <strong>completely independently of the AI quantitative ensemble</strong>.
                Even if an AI model produces a 95% directional confidence score, the trade proposal will be strictly
                rejected if it fails liquidity requirements, violates position exposure, carries an excessively wide
                stop-loss, or offers an unfavorable reward/risk ratio after slippage and commissions.
              </p>
            </div>
          </div>

          {/* Sizing Formula Visualization */}
          <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Percent className="h-4 w-4 text-sky-400" />
              <span>Institutional Position Sizing Formula</span>
            </h3>

            <div className="bg-terminal-bg p-4 rounded-xl border border-terminal-border text-center font-mono space-y-2">
              <div className="text-sm sm:text-base text-sky-300 font-bold">
                Position Size (Shares) = (Portfolio Equity × Risk Percentage) / |Entry Price - Stop Price|
              </div>
              <p className="text-xs text-terminal-muted">
                Every trade is sized so that a full stop-out will strictly risk exactly <strong>{riskPolicy.risk_per_trade_pct}%</strong> of portfolio capital.
              </p>
            </div>

            {/* Configurable Risk Parameters Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-terminal-bg p-4 rounded-xl border border-terminal-border">
                <span className="text-[11px] text-terminal-muted block">US PORTFOLIO EQUITY (USD)</span>
                <input
                  type="number"
                  value={riskPolicy.equity_usd}
                  onChange={(e) => setRiskPolicy({ ...riskPolicy, equity_usd: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 bg-terminal-surface border border-terminal-border p-2 rounded text-sm text-white font-mono"
                />
                <span className="text-[10px] text-terminal-dim block mt-1">Configured test balance</span>
              </div>

              <div className="bg-terminal-bg p-4 rounded-xl border border-terminal-border">
                <span className="text-[11px] text-terminal-muted block">BANGLADESH EQUITY (BDT)</span>
                <input
                  type="number"
                  value={riskPolicy.equity_bdt}
                  onChange={(e) => setRiskPolicy({ ...riskPolicy, equity_bdt: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1.5 bg-terminal-surface border border-terminal-border p-2 rounded text-sm text-white font-mono"
                />
                <span className="text-[10px] text-terminal-dim block mt-1">DSE test balance</span>
              </div>

              <div className="bg-terminal-bg p-4 rounded-xl border border-terminal-border">
                <span className="text-[11px] text-terminal-muted block">RISK PER TRADE (%)</span>
                <input
                  type="number"
                  step="0.05"
                  value={riskPolicy.risk_per_trade_pct}
                  onChange={(e) => setRiskPolicy({ ...riskPolicy, risk_per_trade_pct: parseFloat(e.target.value) || 0.5 })}
                  className="w-full mt-1.5 bg-terminal-surface border border-terminal-border p-2 rounded text-sm text-white font-mono"
                />
                <span className="text-[10px] text-terminal-dim block mt-1">Standard: 0.25% – 0.50%</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => updateRiskPolicy(riskPolicy).then(() => showBanner("Risk policy parameters saved!"))}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-lg"
              >
                Save Risk Parameters
              </button>
            </div>
          </div>

          {/* 9-Rule Mandatory Compliance Audit Matrix */}
          <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>9 Mandatory Trade Rejection Checks</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { name: "1. Stale / Corrupted Data", desc: "Rejects instruments with missing trading bars or timestamps older than 4 business days." },
                { name: "2. Liquidity & Minimum Turnover", desc: "Rejects illiquid symbols where average daily turnover falls below required threshold ($30M US / 15M BDT)." },
                { name: "3. Unfavorable Return After Costs", desc: "Ensures expected profit exceeds broker commissions, local DSE exchange taxes, and expected slippage." },
                { name: "4. Capital Concentration Limit", desc: "Caps total position value to max 20% of portfolio equity, preventing single-stock overexposure." },
                { name: "5. Stop Distance Validation", desc: "Ensures stop is neither dangerously tight (< 0.8% whipsaw) nor excessively wide (> 8.5% tail risk)." },
                { name: "6. Sector & Correlation Limits", desc: "Enforces max 5 concurrent open positions to limit sector contagion." },
                { name: "7. Event Risk Checkpoint", desc: "Flags earnings announcements and corporate rights/splits windows within the holding horizon." },
                { name: "8. Circuit Breaker / Trading Halts", desc: "Protects against DSE 10% limit-up/limit-down lockouts and exchange suspensions." },
                { name: "9. Portfolio Emergency Kill-Switch", desc: "Manual or automated override that instantly blocks new recommendation generation upon drawdown breach." }
              ].map((rule, idx) => (
                <div key={idx} className="bg-terminal-bg p-3 rounded-xl border border-terminal-border flex items-start space-x-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-white block">{rule.name}</span>
                    <span className="text-terminal-dim text-[11px]">{rule.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WALK-FORWARD BACKTEST & ML ENSEMBLE VALIDATION (MA-MAP v3.0)        */}
      {/* ========================================================================= */}
      {activeTab === "VALIDATION" && (
        <div className="space-y-6 font-mono">
          {/* Header & Refresh Strip */}
          <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Out-of-Sample Walk-Forward Validation Engine
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40">
                  Zero Lookahead Bias
                </span>
              </div>
              <p className="text-terminal-dim text-xs mt-1">
                Strict rolling historical window evaluation across {activeMarket} universe. Features computed only from past data; trades evaluated net of commissions, spread, and slippage.
              </p>
            </div>

            <button
              onClick={() => loadBacktestData(true)}
              disabled={isLoadingBacktest}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-2 border border-purple-400/40 shadow-lg shadow-purple-600/20 transition"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBacktest ? "animate-spin" : ""}`} />
              <span>{isLoadingBacktest ? "Running Walk-Forward..." : "Re-Run Walk-Forward Backtest"}</span>
            </button>
          </div>

          {/* Model Architecture & Calibration Specifications */}
          {modelStatus && (
            <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <span>Dual-Model ML Ensemble Architecture &amp; Calibration</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/50 font-bold">
                  {modelStatus.status} • {modelStatus.model_version}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-terminal-bg p-3.5 rounded-xl border border-terminal-border space-y-1">
                  <span className="text-[10px] text-terminal-muted block">PREDICTION PIPELINE</span>
                  <span className="font-bold text-white block text-[11px]">
                    LightGBM (120 Trees) + Logistic Regression Baseline
                  </span>
                  <span className="text-terminal-dim text-[10px] block">
                    Features: {modelStatus.feature_count} technical, momentum, volatility &amp; volume drivers
                  </span>
                </div>

                <div className="bg-terminal-bg p-3.5 rounded-xl border border-terminal-border space-y-1">
                  <span className="text-[10px] text-terminal-muted block">PROBABILITY CALIBRATION</span>
                  <span className="font-bold text-emerald-300 block text-[11px]">
                    Platt Scaling (Sigmoid CalibratedClassifierCV)
                  </span>
                  <span className="text-terminal-dim text-[10px] block">
                    Validation Brier Score: {modelStatus.validation_brier_score.toFixed(4)} (Well Calibrated)
                  </span>
                </div>

                <div className="bg-terminal-bg p-3.5 rounded-xl border border-terminal-border space-y-1">
                  <span className="text-[10px] text-terminal-muted block">DATA-DRIVEN THRESHOLD &amp; FRICTION</span>
                  <span className="font-bold text-sky-300 block text-[11px]">
                    Empirical Threshold: {(modelStatus.empirical_optimal_threshold * 100).toFixed(1)}%
                  </span>
                  <span className="text-terminal-dim text-[10px] block">
                    US Friction: {modelStatus.transaction_cost_model.US_round_trip} • BD: {modelStatus.transaction_cost_model.BD_round_trip}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Walk-Forward Summary Metrics */}
          {backtestData && backtestData.summary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-terminal-card border border-terminal-border p-4 rounded-xl">
                  <span className="text-[10px] text-terminal-muted block">TRADES ANALYZED</span>
                  <span className="text-xl font-black text-white">{backtestData.summary.total_trades_analyzed}</span>
                  <span className="text-[10px] text-terminal-dim block mt-0.5">Out-of-sample swing cycles</span>
                </div>

                <div className="bg-terminal-card border border-terminal-border p-4 rounded-xl">
                  <span className="text-[10px] text-terminal-muted block">WIN RATE %</span>
                  <span className={`text-xl font-black ${backtestData.summary.average_win_rate_pct >= 50 ? "text-emerald-400" : "text-amber-400"}`}>
                    {backtestData.summary.average_win_rate_pct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-terminal-dim block mt-0.5">Directional hit rate</span>
                </div>

                <div className="bg-terminal-card border border-terminal-border p-4 rounded-xl">
                  <span className="text-[10px] text-terminal-muted block">PROFIT FACTOR</span>
                  <span className={`text-xl font-black ${backtestData.summary.average_profit_factor >= 1.0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {backtestData.summary.average_profit_factor.toFixed(2)}x
                  </span>
                  <span className="text-[10px] text-terminal-dim block mt-0.5">Gross gains / gross losses</span>
                </div>

                <div className="bg-terminal-card border border-terminal-border p-4 rounded-xl">
                  <span className="text-[10px] text-terminal-muted block">CALIBRATION BRIER SCORE</span>
                  <span className="text-xl font-black text-purple-300">
                    {backtestData.summary.average_brier_score.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-terminal-dim block mt-0.5">0.0 = perfect calibration</span>
                </div>
              </div>

              {/* Symbol-by-Symbol Walk-Forward Results Table */}
              <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl space-y-4 overflow-hidden">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <BarChart2 className="h-4 w-4 text-sky-400" />
                  <span>Out-of-Sample Performance by Symbol (Net of Costs)</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-terminal-bg text-terminal-muted border-b border-terminal-border text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Symbol</th>
                        <th className="p-3">Trades</th>
                        <th className="p-3">Win Rate</th>
                        <th className="p-3">Brier Score</th>
                        <th className="p-3">Profit Factor</th>
                        <th className="p-3">Avg Return</th>
                        <th className="p-3">Strategy Net P&amp;L</th>
                        <th className="p-3">Strategy Sharpe</th>
                        <th className="p-3">Max DD</th>
                        <th className="p-3">Regime Breakdown</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-terminal-border/60">
                      {backtestData.symbols_tested.map((s, idx) => (
                        <tr key={idx} className="hover:bg-terminal-bg/50 transition">
                          <td className="p-3 font-bold text-white">{s.symbol}</td>
                          <td className="p-3 text-terminal-dim">{s.trades_taken}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${s.win_rate_pct >= 50 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                              {s.win_rate_pct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-purple-300">{s.brier_score.toFixed(4)}</td>
                          <td className="p-3 font-bold text-white">{s.profit_factor.toFixed(2)}x</td>
                          <td className={`p-3 font-bold ${s.avg_trade_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {s.avg_trade_return_pct >= 0 ? "+" : ""}{s.avg_trade_return_pct.toFixed(2)}%
                          </td>
                          <td className={`p-3 font-bold ${s.strategy_cumulative_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {s.strategy_cumulative_pct >= 0 ? "+" : ""}{s.strategy_cumulative_pct.toFixed(1)}%
                          </td>
                          <td className="p-3 text-sky-300 font-bold">{s.strategy_sharpe.toFixed(2)}</td>
                          <td className="p-3 text-rose-400">{s.max_drawdown_pct.toFixed(1)}%</td>
                          <td className="p-3 text-[10px] text-terminal-dim">
                            {Object.entries(s.regime_breakdown).map(([r, stats]) => (
                              stats.trades > 0 && (
                                <span key={r} className="inline-block mr-2 px-1.5 py-0.5 bg-terminal-bg rounded border border-terminal-border/60">
                                  {r.replace("TRENDING_", "").replace("_CONSOLIDATION", "")}: {stats.win_rate}% ({stats.trades}t)
                                </span>
                              )
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Market Microstructure Transparency Panel */}
          <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Info className="h-4 w-4 text-sky-400" />
              <span>Dual-Market Data Source &amp; Microstructure Transparency</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-terminal-bg p-4 rounded-xl border border-terminal-border space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🇺🇸</span>
                  <span className="font-bold text-white">US Equities (NYSE / NASDAQ)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                    Live Real-Time Stream
                  </span>
                </div>
                <p className="text-terminal-dim text-[11px]">
                  Real-time OHLCV candles retrieved over direct internet API from Yahoo Finance v8 Chart API and institutional financial gateways. Deducts 0.35% round-trip friction (commission + half-spread + slippage).
                </p>
              </div>

              <div className="bg-terminal-bg p-4 rounded-xl border border-terminal-border space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🇧🇩</span>
                  <span className="font-bold text-white">Bangladesh Equities (DSE)</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                    Calibrated Simulation Microstructure
                  </span>
                </div>
                <p className="text-terminal-dim text-[11px]">
                  Calibrated price series reflecting Dhaka Stock Exchange market microstructure: Sunday–Thursday trading calendar, 10% daily circuit breakers, local turnover dynamics, and 0.75% transaction friction. Live broker execution requires DSE-authorized gateway and BSEC compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BROKER EXECUTION TRACKER & PORTFOLIO                             */}
      {/* ========================================================================= */}
      {activeTab === "PORTFOLIO" && (
        <div className="space-y-4 font-mono">
          <div className="bg-terminal-card p-4 rounded-2xl border border-terminal-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Manual Broker Portfolio Tracker ({activeMarket})
              </h3>
              <p className="text-xs text-terminal-muted mt-0.5">
                Reconciles manual order fills executed outside the AI system. The AI does not submit live broker orders automatically.
              </p>
            </div>

            <button
              onClick={() => {
                setExecutingCandidate(candidates[0] || null);
                setExecPrice(candidates[0]?.current_price || 100);
                setExecQty(candidates[0]?.suggested_shares || 10);
                setExecBroker(activeMarket === "US" ? "Interactive Brokers" : "EBL Securities (DSE)");
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg shadow-lg"
            >
              + Record External Broker Fill
            </button>
          </div>

          {/* Positions Table */}
          {positions.length === 0 ? (
            <div className="bg-terminal-card border border-terminal-border p-12 rounded-2xl text-center">
              <p className="text-terminal-muted text-xs">No active positions currently tracked for {activeMarket} market.</p>
            </div>
          ) : (
            <div className="bg-terminal-card border border-terminal-border rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-terminal-bg text-terminal-muted border-b border-terminal-border text-[11px]">
                  <tr>
                    <th className="p-3">SYMBOL</th>
                    <th className="p-3">SIDE &amp; SHARES</th>
                    <th className="p-3">ENTRY PRICE</th>
                    <th className="p-3">CURRENT SPOT</th>
                    <th className="p-3">STOP / TARGET</th>
                    <th className="p-3">UNREALIZED P&amp;L</th>
                    <th className="p-3">BROKER</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/60">
                  {positions.map((pos) => {
                    const isProfit = pos.unrealized_pnl >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-terminal-bg/50">
                        <td className="p-3 font-bold text-white">{pos.symbol}</td>
                        <td className="p-3">
                          <span className="text-emerald-400 font-bold">{pos.side}</span> {pos.quantity} shs
                        </td>
                        <td className="p-3">{pos.currency} {pos.entry_price.toFixed(2)}</td>
                        <td className="p-3 font-bold text-white">{pos.currency} {pos.current_price.toFixed(2)}</td>
                        <td className="p-3 text-[11px]">
                          <span className="text-rose-400">SL: {pos.stop_loss.toFixed(1)}</span> /{" "}
                          <span className="text-emerald-400">TP: {pos.target_price.toFixed(1)}</span>
                        </td>
                        <td className="p-3 font-bold">
                          <span className={isProfit ? "text-emerald-400" : "text-rose-400"}>
                            {isProfit ? "+" : ""}{pos.currency} {pos.unrealized_pnl.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3 text-terminal-dim text-[11px]">{pos.broker_name}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleClosePosition(pos)}
                            className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold border border-rose-500/40"
                          >
                            Close Position
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REGULATORY & EXCHANGE CALENDAR (FERA & BSEC)                      */}
      {/* ========================================================================= */}
      {activeTab === "REGULATORY" && (
        <div className="space-y-6 font-mono text-xs">
          {/* Bangladesh Foreign Exchange Regulation Act (FERA) Advisory */}
          <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wide">
                Regulatory Checkpoint: Foreign Exchange Regulation Act (FERA, 1947) &amp; Bangladesh Bank
              </h3>
            </div>

            <p className="text-terminal-dim leading-relaxed text-xs">
              If you are a Bangladesh resident planning to fund a foreign brokerage account (e.g. for US equities),
              note that an international broker accepting an online application does <strong>not</strong> automatically mean
              the transfer of funds is authorized under Bangladesh foreign exchange regulations.
            </p>

            <div className="bg-terminal-bg p-4 rounded-xl border border-terminal-border space-y-2 text-[11px] text-amber-200/90">
              <p>
                <strong>1. Outward Remittance Restrictions:</strong> The Foreign Exchange Regulation Act contains restrictions
                on transferring securities or funds abroad without specific permission from Bangladesh Bank.
              </p>
              <p>
                <strong>2. Authorised Dealer Bank:</strong> Always consult an Authorised Dealer (AD) bank branch and a qualified
                foreign-exchange adviser before remitting capital abroad.
              </p>
              <p>
                <strong>3. DSE Domestic Trading:</strong> For domestic Bangladesh equities, trading must be conducted exclusively
                through a TREC-holder broker registered with the <strong>Dhaka Stock Exchange (DSE)</strong> and regulated by the
                <strong> Bangladesh Securities and Exchange Commission (BSEC)</strong>.
              </p>
            </div>
          </div>

          {/* DSE Market Microstructure & Circuit Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-terminal-card border border-terminal-border p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-emerald-400 uppercase text-xs">Dhaka Stock Exchange (DSE) Parameters</h4>
              <ul className="space-y-1.5 text-terminal-dim text-[11px]">
                <li>• <strong>Trading Days:</strong> Sunday – Thursday (Friday &amp; Saturday closed)</li>
                <li>• <strong>Hours:</strong> 10:00 AM – 02:30 PM BST (UTC+6)</li>
                <li>• <strong>Circuit Breakers:</strong> Standard +/- 10% daily price band limits</li>
                <li>• <strong>Settlement Cycle:</strong> T+2 for Category A/B, T+3 for Category Z</li>
                <li>• <strong>Currency:</strong> Bangladeshi Taka (BDT)</li>
              </ul>
            </div>

            <div className="bg-terminal-card border border-terminal-border p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-sky-400 uppercase text-xs">US Equity Markets (NYSE / NASDAQ) Parameters</h4>
              <ul className="space-y-1.5 text-terminal-dim text-[11px]">
                <li>• <strong>Trading Days:</strong> Monday – Friday (Saturday &amp; Sunday closed)</li>
                <li>• <strong>Hours:</strong> 09:30 AM – 04:00 PM EST (14:30 – 21:00 UTC)</li>
                <li>• <strong>Pre/Post Market:</strong> 04:00 AM – 09:30 AM &amp; 04:00 PM – 08:00 PM EST</li>
                <li>• <strong>Settlement Cycle:</strong> T+1 Standard (Accelerated US Settlement)</li>
                <li>• <strong>Currency:</strong> United States Dollar (USD)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "AUDIT" && (
        <div className="bg-terminal-card border border-terminal-border rounded-2xl overflow-hidden font-mono text-xs">
          <div className="p-4 border-b border-terminal-border bg-terminal-bg/40 flex items-center justify-between">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
              <FileText className="h-4 w-4 text-purple-400" />
              <span>Immutable Human Decision &amp; AI Action Audit Log</span>
            </h3>
            <span className="text-[11px] text-terminal-muted">Logged in PostgreSQL schema [mamap]</span>
          </div>

          <div className="divide-y divide-terminal-border/60 max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-terminal-muted">No audit events recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-terminal-bg/50 flex items-start justify-between text-[11px]">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{log.action}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-terminal-surface text-terminal-dim border border-terminal-border">
                        {log.actor}
                      </span>
                      {log.reference_id && (
                        <span className="text-sky-400 font-bold">Ref: {log.reference_id}</span>
                      )}
                    </div>
                    <p className="text-terminal-dim text-[10px]">
                      {JSON.stringify(log.details)}
                    </p>
                  </div>
                  <span className="text-[10px] text-terminal-muted shrink-0 ml-4">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Parameters Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl max-w-md w-full font-mono text-xs space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Edit3 className="h-4 w-4 text-sky-400" />
              <span>Edit Setup Parameters: {editingCandidate.symbol}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-terminal-muted block text-[11px]">STOP-LOSS LEVEL ({editingCandidate.currency}):</label>
                <input
                  type="number"
                  step="0.1"
                  value={editStopLoss}
                  onChange={(e) => setEditStopLoss(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-terminal-bg border border-terminal-border p-2 rounded text-white"
                />
              </div>

              <div>
                <label className="text-terminal-muted block text-[11px]">TARGET PRICE ({editingCandidate.currency}):</label>
                <input
                  type="number"
                  step="0.1"
                  value={editTargetPrice}
                  onChange={(e) => setEditTargetPrice(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-terminal-bg border border-terminal-border p-2 rounded text-white"
                />
              </div>

              <div>
                <label className="text-terminal-muted block text-[11px]">
                  SUGGESTED UNITS ({editingCandidate.market === "CRYPTO" ? "Coins" : editingCandidate.market === "COMMODITIES" ? "Contracts" : editingCandidate.market === "FOREX" ? "Lots" : "Shares"}):
                </label>
                <input
                  type="number"
                  step="any"
                  value={editShares}
                  onChange={(e) => setEditShares(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-terminal-bg border border-terminal-border p-2 rounded text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-terminal-border">
              <button
                onClick={() => setEditingCandidate(null)}
                className="px-3 py-1.5 rounded bg-terminal-bg text-terminal-dim hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded bg-sky-500 text-black font-bold"
              >
                Save &amp; Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Broker Execution Modal */}
      {executingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl max-w-md w-full font-mono text-xs space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-emerald-400" />
              <span>Record Manual Broker Fill: {executingCandidate.symbol}</span>
            </h3>

            <p className="text-terminal-dim text-[11px]">
              Confirm execution details after placing the order manually through your licensed broker terminal.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-terminal-muted block text-[11px]">BROKER PLATFORM NAME:</label>
                <input
                  type="text"
                  value={execBroker}
                  onChange={(e) => setExecBroker(e.target.value)}
                  className="w-full mt-1 bg-terminal-bg border border-terminal-border p-2 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-terminal-muted block text-[11px]">FILL PRICE ({executingCandidate.currency}):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={execPrice}
                    onChange={(e) => setExecPrice(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 bg-terminal-bg border border-terminal-border p-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-terminal-muted block text-[11px]">
                    QUANTITY ({executingCandidate.market === "CRYPTO" ? "Coins" : executingCandidate.market === "COMMODITIES" ? "Contracts" : executingCandidate.market === "FOREX" ? "Lots" : "Shares"}):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={execQty}
                    onChange={(e) => setExecQty(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 bg-terminal-bg border border-terminal-border p-2 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-terminal-muted block text-[11px]">COMMISSION &amp; FEES ({executingCandidate.currency}):</label>
                <input
                  type="number"
                  step="0.5"
                  value={execFees}
                  onChange={(e) => setExecFees(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-terminal-bg border border-terminal-border p-2 rounded text-white"
                />
              </div>

              <div>
                <label className="text-terminal-muted block text-[11px]">NOTES:</label>
                <input
                  type="text"
                  value={execNotes}
                  onChange={(e) => setExecNotes(e.target.value)}
                  className="w-full mt-1 bg-terminal-bg border border-terminal-border p-2 rounded text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-terminal-border">
              <button
                onClick={() => setExecutingCandidate(null)}
                className="px-3 py-1.5 rounded bg-terminal-bg text-terminal-dim hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExecute}
                className="px-4 py-1.5 rounded bg-emerald-500 text-black font-bold"
              >
                Confirm Broker Fill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-terminal-card border border-terminal-border p-6 rounded-2xl max-w-md w-full font-mono text-xs space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
              <XCircle className="h-4 w-4" />
              <span>Reject Candidate: {rejectingCandidate.symbol}</span>
            </h3>

            <div>
              <label className="text-terminal-muted block text-[11px]">REJECTION REASON (SAVED TO AUDIT TRAIL):</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full mt-1.5 bg-terminal-bg border border-terminal-border p-2.5 rounded text-white text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-terminal-border">
              <button
                onClick={() => setRejectingCandidate(null)}
                className="px-3 py-1.5 rounded bg-terminal-bg text-terminal-dim hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded bg-rose-500 text-white font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
