"use client";

import React from "react";

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse font-mono">
      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-terminal-card/60 border border-terminal-border rounded-xl p-4 h-28 flex flex-col justify-between"
          >
            <div className="h-3 bg-terminal-border/80 rounded w-1/2" />
            <div className="h-7 bg-terminal-border/60 rounded w-3/4" />
            <div className="h-2.5 bg-terminal-border/40 rounded w-2/3" />
          </div>
        ))}
      </div>

      {/* Main Prediction & Chart Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-terminal-card/60 border border-terminal-border rounded-xl p-5 h-[480px] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-terminal-border/80 rounded w-1/4" />
            <div className="h-8 bg-terminal-border/60 rounded w-1/3" />
          </div>
          <div className="h-64 bg-terminal-border/20 rounded-lg flex items-center justify-center">
            <span className="text-xs text-terminal-muted animate-pulse">
              Computing institutional feature vectors and indicators...
            </span>
          </div>
          <div className="h-16 bg-terminal-border/30 rounded" />
        </div>

        <div className="bg-terminal-card/60 border border-terminal-border rounded-xl p-5 h-[480px] flex flex-col justify-between">
          <div className="h-4 bg-terminal-border/80 rounded w-1/2" />
          <div className="h-28 bg-terminal-border/40 rounded-xl my-4" />
          <div className="h-24 bg-terminal-border/40 rounded-xl" />
          <div className="h-20 bg-terminal-border/30 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

