import {
  PredictionResponse,
  AssetClassCategory,
  AssetSearchResponse,
  WatchlistItem,
  PredictionAuditItem,
  SystemHealth,
  SwingCandidate,
  PortfolioPosition,
  RiskPolicy,
  MarketCalendarStatus,
  AuditTrailItem,
} from "../types/api";

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // In browser: use relative URL so Next.js rewrites proxy seamlessly to backend
    return "";
  }
  // On server (SSR): use internal docker hostname or localhost
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080"
  );
};

const API_PREFIX = "/api/v1";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${API_PREFIX}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMsg = errorData.detail;
        }
      } catch {
        // Fallback to status text
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`API Request failed for ${endpoint}:`, message);
    throw err;
  }
}

export async function fetchPrediction(
  ticker: string,
  timeframe: string = "1y"
): Promise<PredictionResponse> {
  const params = new URLSearchParams({
    ticker: ticker.trim().toUpperCase(),
    timeframe,
  });
  return request<PredictionResponse>(`/predict?${params.toString()}`);
}

export async function fetchAssetCategories(): Promise<AssetClassCategory[]> {
  return request<AssetClassCategory[]>("/assets/categories");
}

export async function searchAssets(query: string): Promise<AssetSearchResponse> {
  const params = new URLSearchParams({ q: query });
  return request<AssetSearchResponse>(`/assets/search?${params.toString()}`);
}

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  return request<WatchlistItem[]>("/watchlist");
}

export async function addToWatchlist(
  ticker: string,
  asset_name: string,
  asset_class: string
): Promise<WatchlistItem> {
  return request<WatchlistItem>("/watchlist", {
    method: "POST",
    body: JSON.stringify({ ticker, asset_name, asset_class }),
  });
}

export async function removeFromWatchlist(ticker: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/watchlist/${encodeURIComponent(ticker)}`, {
    method: "DELETE",
  });
}

export async function fetchPredictionHistory(limit: number = 25): Promise<PredictionAuditItem[]> {
  return request<PredictionAuditItem[]>(`/predict/history?limit=${limit}`);
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  // Directly query the institutional health endpoint via API prefix
  return request<SystemHealth>("/health");
}

// --- DUAL-MARKET SWING TRADING & RISK DECISION APIS ---

export async function fetchSwingCandidates(market?: string, status?: string, style?: string): Promise<SwingCandidate[]> {
  const params = new URLSearchParams();
  if (market) params.append("market", market);
  if (status) params.append("status", status);
  if (style && style !== "ALL") params.append("style", style);
  const q = params.toString() ? `?${params.toString()}` : "";
  return request<SwingCandidate[]>(`/swing/candidates${q}`);
}

export async function generateSwingCandidates(market: string = "ALL", style: string = "ALL"): Promise<{ status: string; count: number; symbols: string[]; message: string }> {
  const params = new URLSearchParams();
  params.append("market", market);
  if (style) params.append("style", style);
  return request<{ status: string; count: number; symbols: string[]; message: string }>(`/swing/generate?${params.toString()}`, {
    method: "POST"
  });
}

export async function approveSwingCandidate(candidateId: number, notes?: string): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>(`/swing/candidates/${candidateId}/approve`, {
    method: "POST",
    body: JSON.stringify({ notes: notes || "Approved by human trader after technical review." })
  });
}

export async function rejectSwingCandidate(candidateId: number, reason?: string): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>(`/swing/candidates/${candidateId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason || "Rejected by human trader." })
  });
}

export async function editSwingCandidate(candidateId: number, data: { stop_loss?: number; target_price?: number; suggested_shares?: number }): Promise<{ status: string; candidate: SwingCandidate }> {
  return request<{ status: string; candidate: SwingCandidate }>(`/swing/candidates/${candidateId}/edit`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function fetchPortfolioPositions(market?: string, status: string = "OPEN"): Promise<PortfolioPosition[]> {
  const params = new URLSearchParams();
  if (market) params.append("market", market);
  if (status) params.append("status", status);
  return request<PortfolioPosition[]>(`/swing/positions?${params.toString()}`);
}

export async function recordManualExecution(data: {
  candidate_id?: number;
  symbol: string;
  market: string;
  currency?: string;
  broker_name: string;
  fill_price: number;
  quantity: number;
  stop_loss?: number;
  target_price?: number;
  fees?: number;
  notes?: string;
}): Promise<{ status: string; position: PortfolioPosition }> {
  return request<{ status: string; position: PortfolioPosition }>("/swing/positions/execute", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function closePortfolioPosition(positionId: number, exitPrice: number, fees: number = 1.0): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>(`/swing/positions/${positionId}/close`, {
    method: "POST",
    body: JSON.stringify({ exit_price: exitPrice, fees })
  });
}

export async function fetchRiskPolicy(): Promise<RiskPolicy> {
  return request<RiskPolicy>("/swing/risk-policy");
}

export async function updateRiskPolicy(data: Partial<RiskPolicy>): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>("/swing/risk-policy", {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function fetchMarketCalendars(): Promise<MarketCalendarStatus> {
  return request<MarketCalendarStatus>("/swing/calendar");
}

export async function fetchAuditTrail(limit: number = 50): Promise<AuditTrailItem[]> {
  return request<AuditTrailItem[]>(`/swing/audit?limit=${limit}`);
}
