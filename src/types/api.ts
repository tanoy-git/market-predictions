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
