import {
  PredictionResponse,
  AssetClassCategory,
  AssetSearchResponse,
  WatchlistItem,
  PredictionAuditItem,
  SystemHealth,
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
