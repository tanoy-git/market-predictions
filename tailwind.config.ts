import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#080b11",
          card: "#0d131f",
          cardHover: "#131b2c",
          surface: "#101827",
          border: "#1e293b",
          borderSubtle: "#172033",
          borderGlow: "#334155",
          muted: "#64748b",
          dim: "#94a3b8",
          text: "#f1f5f9",
          bullish: "#10b981",
          bullishSoft: "rgba(16, 185, 129, 0.12)",
          bearish: "#f43f5e",
          bearishSoft: "rgba(244, 63, 94, 0.12)",
          accent: "#38bdf8",
          purple: "#818cf8",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
