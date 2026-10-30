export interface CandlePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_hist?: number | null;
  bb_upper?: number | null;
  bb_middle?: number | null;
  bb_lower?: number | null;
  sma_50?: number | null;
  sma_200?: number | null;
}

export interface QuantMetrics {
  annualized_volatility: number;
  sharpe_ratio: number;
  rsi_14: number;
  max_drawdown?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_hist?: number | null;
  bb_upper?: number | null;
  bb_lower?: number | null;
  bb_width?: number | null;
  log_return_24h?: number | null;
  price_change_24h_pct?: number | null;
  high_52w?: number | null;
  low_52w?: number | null;
}

export interface FactorSignal {
  name: string;
  category: string;
  value: number;
  signal: "BULLISH" | "BEARISH" | "NEUTRAL";
  weight: number;
  description: string;
}

export interface HorizonForecast {
  horizon: string; // "1D", "1W", "1M", "3M", "6M", "1Y"
  label: string;
  days: number;
  prediction: "BULLISH" | "BEARISH";
  probability: number;
  sentiment_score: number;
  expected_price_target: number;
  expected_range_low: number;
  expected_range_high: number;
  expected_return_pct: number;
  signal_strength: string;
  rationale: string;
}

export interface MacroRegimeMetrics {
  yield_10y: number;
  dxy_index: number;
  vix_level: number;
  crude_oil: number;
  gold_price: number;
  regime_classification: string;
  macro_bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  macro_confidence: number;
  interest_rate_impact: string;
  dollar_impact: string;
  inflation_shock_risk: string;
}

export interface SeasonalityMetrics {
  current_month: string;
  month_historical_win_rate: number;
  month_avg_return_pct: number;
  seasonal_bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  quarter_end_drift: string;
  weather_climate_regime: string;
  weather_sensitivity_score: number;
  seasonal_cycle_summary: string;
}

export interface AdvancedQuantMetrics {
  hurst_exponent: number;
  hurst_regime: string;
  ou_half_life_days: number;
  ou_mean_level: number;
  ewma_volatility: number;
  var_95_daily: number;
  var_99_daily: number;
  cvar_95_daily: number;
  skewness: number;
  kurtosis: number;
  jump_diffusion_prob: number;
}

export interface PredictionResponse {
  ticker: string;
  asset_name: string;
  asset_class?: string;
  current_price: number;
  currency?: string;
  timestamp: string;
  prediction: "BULLISH" | "BEARISH";
  probability: number;
  sentiment_score: number;
  metrics: QuantMetrics;
  disclaimer: string;
  factors?: FactorSignal[];
  horizons?: HorizonForecast[];
  macro_regime?: MacroRegimeMetrics;
  seasonality?: SeasonalityMetrics;
  advanced_quant?: AdvancedQuantMetrics;
  history?: CandlePoint[];
}

export interface AssetMetadata {
  ticker: string;
  name: string;
  asset_class: string;
  exchange?: string;
  currency?: string;
  is_popular?: boolean;
}

export interface AssetClassCategory {
  category: string;
  assets: AssetMetadata[];
}

export interface AssetSearchResponse {
  query: string;
  total: number;
  results: AssetMetadata[];
}

export interface WatchlistItem {
  id: number;
  ticker: string;
  asset_name: string;
  asset_class: string;
  notes?: string | null;
  created_at: string;
}

export interface PredictionAuditItem {
  id: number;
  ticker: string;
  asset_name: string;
  asset_class: string;
  current_price: number;
  prediction: string;
  probability: number;
  sentiment_score: number;
  annualized_volatility: number;
  sharpe_ratio: number;
  rsi_14: number;
  created_at: string;
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  uptime_seconds: number;
  telemetry: {
    database: {
      connection: string;
      schema: string;
      schema_status: string;
    };
    caching_tier: {
      redis: string;
      ttl_seconds: number;
    };
    quant_engine: {
      model_status: string;
      risk_free_rate: number;
    };
  };
}

export interface SwingCandidate {
  id: number;
  market: "US" | "BD";
  symbol: string;
  asset_name: string;
  sector: string;
  currency: string;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  recommendation: "BUY candidate" | "HOLD" | "AVOID" | "EXIT candidate";
  horizon: string;
  holding_days: number;
  current_price: number;
  entry_low: number;
  entry_high: number;
  stop_loss: number;
  target_price: number;
  reward_risk_ratio: number;
  expected_return_pct: number;
  calibrated_probability: number;
  atr_14: number;
  turnover_20d: number;
  liquidity_status: "PASS" | "FAIL";
  suggested_shares: number;
  allocated_capital: number;
  risk_amount: number;
  risk_status: "APPROVED_FOR_REVIEW" | "REJECTED";
  risk_rejection_reasons: string[];
  risk_checks_passed: Record<string, boolean>;
  supporting_factors: string[];
  opposing_factors: string[];
  invalidation_rules: string[];
  model_version: string;
  approval_status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EXECUTED" | "EXPIRED";
  user_decision_time?: string | null;
  user_notes?: string | null;
  edited_by_user: boolean;
  expiry?: string | null;
  created_at: string;
}

export interface PortfolioPosition {
  id: number;
  market: "US" | "BD";
  symbol: string;
  currency: string;
  side: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  stop_loss: number;
  target_price: number;
  broker_name: string;
  status: "OPEN" | "CLOSED";
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  realized_pnl: number;
  execution_time: string;
  closed_at?: string | null;
}

export interface RiskPolicy {
  equity_usd: number;
  equity_bdt: number;
  risk_per_trade_pct: number;
  max_open_risk_pct: number;
  max_stock_risk_pct: number;
  min_reward_risk: number;
  max_new_positions: number;
  daily_loss_limit_pct: number;
  weekly_loss_limit_pct: number;
  kill_switch_active: boolean;
  updated_at: string;
}

export interface MarketCalendarStatus {
  us: {
    market: string;
    is_open: boolean;
    current_session: string;
    schedule: string;
    timezone: string;
    next_open: string;
  };
  bd: {
    market: string;
    exchange: string;
    is_open: boolean;
    current_session: string;
    schedule: string;
    weekend: string;
    timezone: string;
    price_circuit_limit: string;
    regulatory_framework: string;
  };
}

export type TradingAnalysisStyle =
  | "ALL"
  | "DAY_TRADING"
  | "SWING_TRADING"
  | "POSITION_TRADING"
  | "LONG_TERM_INVESTING";

export interface AnalysisStyleOption {
  id: TradingAnalysisStyle;
  label: string;
  badge: string;
  description: string;
  icon: string;
}

export const ANALYSIS_STYLE_OPTIONS: AnalysisStyleOption[] = [
  {
    id: "DAY_TRADING",
    label: "Day Trading",
    badge: "intraday",
    description: "Same-day execution; tight ATR stops; mandatory session close exit",
    icon: "⚡"
  },
  {
    id: "SWING_TRADING",
    label: "Swing Trading",
    badge: "1 day – 1 month",
    description: "Multi-day wave capture; EMA alignment; 2:1+ reward-to-risk ratio",
    icon: "🌊"
  },
  {
    id: "POSITION_TRADING",
    label: "Position Trading",
    badge: "1 month – 1 year",
    description: "Intermediate cycles; 50 EMA & 200 SMA support; macro regime confirmation",
    icon: "🎯"
  },
  {
    id: "LONG_TERM_INVESTING",
    label: "Long-term Investing",
    badge: "1 year+",
    description: "Secular compounding; structural valuation floors; multi-quarter trends",
    icon: "🏛️"
  }
];

export interface AuditTrailItem {
  id: number;
  actor: string;
  action: string;
  reference_id?: string | null;
  market: string;
  details: Record<string, unknown>;
  timestamp: string;
}
