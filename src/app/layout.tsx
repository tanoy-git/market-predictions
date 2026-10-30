import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MA-MAP | Institutional Multi-Asset Market Prediction & Analytics Platform",
  description:
    "Institutional-grade quantitative analytics, algorithmic directional forecasting, and risk metrics engine for Equities, Crypto, Commodities, and Forex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-terminal-bg text-terminal-text min-h-screen flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
        {children}
      </body>
    </html>
  );
}
