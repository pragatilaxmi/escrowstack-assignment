// src/components/FullScreenChart.jsx
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import "./FullScreenChart.css";

function FullScreenChart({ ticker, history, onClose }) {
  // Enrich raw history with trend, volume, VWAP
  const enriched = useMemo(() => {
    if (!history || history.length === 0) return [];

    let cumPV = 0;
    let cumVol = 0;

    return history.map((p, idx) => {
      const prevPrice = idx > 0 ? history[idx - 1].price : p.price;
      const trend = p.price >= prevPrice ? "up" : "down";

      const volume = Math.floor(3000 + Math.random() * 9000);

      cumPV += p.price * volume;
      cumVol += volume;
      const vwap = cumPV / cumVol;

      return {
        ...p,
        trend,
        volume,
        vwap,
        priceUp: trend === "up" ? p.price : null,
        priceDown: trend === "down" ? p.price : null,
      };
    });
  }, [history]);

  // Simple 14-period RSI
  const rsiData = useMemo(() => {
    const period = 14;
    if (!enriched || enriched.length <= period) return [];

    let gains = 0;
    let losses = 0;
    const result = [];

    for (let i = 1; i < enriched.length; i++) {
      const diff = enriched[i].price - enriched[i - 1].price;
      if (diff >= 0) gains += diff;
      else losses -= diff;

      if (i >= period) {
        const avgGain = gains / period;
        const avgLoss = losses / period || 1e-6;
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);

        result.push({
          time: enriched[i].time,
          rsi,
        });
      }
    }
    return result;
  }, [enriched]);

  // Basic stats for header (LTP, change, high, low)
  const stats = useMemo(() => {
    if (!enriched || enriched.length === 0) return null;
    const prices = enriched.map((p) => p.price);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const change = last - first;
    const changePct = (change / first) * 100;

    return { first, last, high, low, change, changePct };
  }, [enriched]);

  if (!enriched || enriched.length === 0 || !stats) return null;

  const changePositive = stats.change >= 0;

  return (
    <div className="fullscreen-chart-overlay">
      <div className="fullscreen-chart-box">
        {/* Header */}
        <div className="fullscreen-chart-header">
          <div className="fs-left">
            <div className="fs-title-row">
              <h2>{ticker} – Full Chart</h2>
              <span
                className={`fs-change-pill ${
                  changePositive ? "fs-up" : "fs-down"
                }`}
              >
                {changePositive ? "▲" : "▼"} ₹
                {Math.abs(stats.change).toFixed(2)} (
                {stats.changePct.toFixed(2)}%)
              </span>
            </div>
            <div className="fs-stats-row">
              <span>LTP: ₹{stats.last.toFixed(2)}</span>
              <span>Open: ₹{stats.first.toFixed(2)}</span>
              <span>High: ₹{stats.high.toFixed(2)}</span>
              <span>Low: ₹{stats.low.toFixed(2)}</span>
            </div>
            <div className="fs-legend-row">
              <span className="fs-legend fs-leg-price">
                <span className="fs-dot" /> Price
              </span>
              <span className="fs-legend fs-leg-vwap">
                <span className="fs-dot" /> VWAP
              </span>
              <span className="fs-legend fs-leg-vol">
                <span className="fs-dot" /> Volume
              </span>
              <span className="fs-legend fs-leg-rsi">
                <span className="fs-dot" /> RSI
              </span>
            </div>
          </div>

          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        {/* PRICE + VWAP */}
        <div className="chart-section chart-main">
          <div className="chart-section-title">Price & VWAP</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={enriched}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                stroke="rgba(148,163,184,0.15)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                minTickGap={20}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `₹${Math.round(v)}`}
                domain={[
                  (min) => min - min * 0.01,
                  (max) => max + max * 0.01,
                ]}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "vwap")
                    return [`₹${value.toFixed(2)}`, "VWAP"];
                  if (name === "priceUp" || name === "priceDown")
                    return [`₹${value.toFixed(2)}`, "Price"];
                  if (name === "price")
                    return [`₹${value.toFixed(2)}`, "Price"];
                  return [value, name];
                }}
                labelFormatter={(label) => `Time: ${label}`}
              />

              {/* VWAP */}
              <Line
                type="monotone"
                dataKey="vwap"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />

              {/* Price up segments (green) */}
              <Line
                type="monotone"
                dataKey="priceUp"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />

              {/* Price down segments (red) */}
              <Line
                type="monotone"
                dataKey="priceDown"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />

              {/* Soft area under full price */}
              <Area
                type="monotone"
                dataKey="price"
                stroke="none"
                fill="url(#priceGradient)"
                fillOpacity={0.6}
              />

              <defs>
                <linearGradient
                  id="priceGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#22c55e"
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor="#22c55e"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* VOLUME */}
        <div className="chart-section chart-volume">
          <div className="chart-section-title">Volume</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={enriched}
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <CartesianGrid
                stroke="rgba(148,163,184,0.15)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <Bar dataKey="volume">
                {enriched.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.trend === "up"
                        ? "rgba(34,197,94,0.7)"
                        : "rgba(239,68,68,0.7)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RSI */}
        <div className="chart-section chart-rsi">
          <div className="chart-section-title">RSI (14)</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rsiData}
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <CartesianGrid
                stroke="rgba(148,163,184,0.15)"
                strokeDasharray="3 3"
              />

              {/* overbought/oversold guide lines */}
              <ReferenceLine
                y={70}
                stroke="#ef4444"
                strokeDasharray="4 4"
              />
              <ReferenceLine
                y={30}
                stroke="#22c55e"
                strokeDasharray="4 4"
              />

              <Line
                type="monotone"
                dataKey="rsi"
                stroke="#eab308"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default FullScreenChart;
