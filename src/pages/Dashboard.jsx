// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import FullScreenChart from "../components/FullScreenChart";
import "./Dashboard.css";

const STOCKS = ["TATA", "RELIANCE", "ADANI", "MRF", "JSW"];
const BASE_PRICE = 1500;

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [subscribed, setSubscribed] = useState([]); // ["TATA", ...]
  const [prices, setPrices] = useState({}); // { TATA: { value, up } }
  const [history, setHistory] = useState({}); // { TATA: [{time, price}, ...] }
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [selectedStock, setSelectedStock] = useState(null);
  const [showFullChart, setShowFullChart] = useState(false);

  // ---------------------- AUTH CHECK ----------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/login");
      } else {
        setUser(u);
      }
    });
    return () => unsub();
  }, [navigate]);

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // ---------------------- PRICE ENGINE ----------------------
  useEffect(() => {
    if (!user || !isLive || subscribed.length === 0) return;

    const interval = setInterval(() => {
      const tickPrices = {}; // latest price per ticker for this tick

      // 1) Update prices
      setPrices((prev) => {
        const next = { ...prev };

        subscribed.forEach((t) => {
          const prevVal = prev[t]?.value ?? BASE_PRICE;
          const delta = (Math.random() - 0.5) * 20; // -10 to +10
          const newPrice = +(prevVal + delta).toFixed(2);
          const up = newPrice >= prevVal;

          next[t] = { value: newPrice, up };
          tickPrices[t] = newPrice;
        });

        return next;
      });

      // 2) Append to history – without mutating arrays
      setHistory((prev) => {
        const next = { ...prev };
        const time = new Date().toLocaleTimeString();

        subscribed.forEach((t) => {
          const prevArr = prev[t] || [];
          const lastPrice =
            prevArr.length > 0 ? prevArr[prevArr.length - 1].price : BASE_PRICE;

          const newPoint = {
            time,
            price: tickPrices[t] ?? lastPrice,
          };

          const updatedArr = [...prevArr, newPoint]; // new array
          next[t] = updatedArr.slice(-120); // keep last 120 points
        });

        return next;
      });

      setLastUpdate(new Date());
    }, 900);

    return () => clearInterval(interval);
  }, [user, isLive, subscribed]);

  // ---------------------- HELPERS ----------------------
  const toggleSubscribed = (ticker) => {
    setSubscribed((prev) =>
      prev.includes(ticker) ? prev.filter((x) => x !== ticker) : [...prev, ticker]
    );
  };

  const subscribeAll = () => setSubscribed(STOCKS);
  const clearAll = () => setSubscribed([]);
  const toggleLive = () => setIsLive((prev) => !prev);

  // Market snapshot: counts and total value
  const marketSummary = useMemo(() => {
    let rising = 0;
    let falling = 0;
    let flat = 0;
    let total = 0;

    subscribed.forEach((t) => {
      const info = prices[t];
      if (!info) return;
      total += info.value;

      if (info.up === true) rising += 1;
      else if (info.up === false) falling += 1;
      else flat += 1;
    });

    return { rising, falling, flat, total };
  }, [subscribed, prices]);

  if (!user) return null;

  // ---------------------- UI ----------------------
  return (
    <div className="dash">
      {/* FULLSCREEN CHART MODAL */}
      {showFullChart && selectedStock && (
        <FullScreenChart
          ticker={selectedStock}
          history={history[selectedStock] || []}
          onClose={() => setShowFullChart(false)}
        />
      )}

      {/* HEADER */}
      <header className="dash-header">
        <div className="dash-brand">
          <div className="brand-top">EscrowStack • Broker</div>
          <h1>Trading Dashboard</h1>
          <p className="brand-sub">Simulated Indian Market · Live Updates</p>
        </div>

        <div className="dash-right-header">
          <div className="dash-header-top-row">
            <div className={`live-pill ${isLive ? "live" : "paused"}`}>
              <span className="live-dot" />
              {isLive ? "LIVE FEED" : "PAUSED"}
            </div>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>

          <div className="dash-user-tag">
            Signed in as <span>{user.email}</span>
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="dash-body">
        {/* LEFT SIDEBAR */}
        <aside className="sidebar">
          <h2>Watchlist</h2>

          <div className="sidebar-buttons">
            <button className="btn-sub-all" onClick={subscribeAll}>
              Subscribe All
            </button>
            <button className="btn-clear" onClick={clearAll}>
              Clear
            </button>
          </div>

          <div className="watchlist-items">
            {STOCKS.map((s) => (
              <label key={s} className="wl-item">
                <input
                  type="checkbox"
                  checked={subscribed.includes(s)}
                  onChange={() => toggleSubscribed(s)}
                />
                <span>{s}</span>
              </label>
            ))}
          </div>

          {/* Small market snapshot in sidebar */}
          <div className="sidebar-summary">
            <div className="ss-row">
              <span>Subscribed</span>
              <strong>
                {subscribed.length} / {STOCKS.length}
              </strong>
            </div>
            <div className="ss-row">
              <span>Rising</span>
              <span className="ss-pill up">{marketSummary.rising}</span>
            </div>
            <div className="ss-row">
              <span>Falling</span>
              <span className="ss-pill down">{marketSummary.falling}</span>
            </div>
            <div className="ss-row">
              <span>Last Tick</span>
              <strong>
                {lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}
              </strong>
            </div>
          </div>

          <button className="live-toggle" onClick={toggleLive}>
            {isLive ? "⏸ Pause Feed" : "▶ Resume Feed"}
          </button>
        </aside>

        {/* RIGHT MARKET VIEW */}
        <section className="market">
          <div className="market-header-row">
            <h2>Live Market View</h2>
            {subscribed.length > 0 && (
              <div className="market-total-pill">
                Approx. basket value:{" "}
                <span>₹{marketSummary.total.toFixed(2)}</span>
              </div>
            )}
          </div>

          {subscribed.length === 0 && (
            <p className="market-empty">
              No stocks selected. Use the watchlist on the left to subscribe.
            </p>
          )}

          {subscribed.map((t) => {
            const info = prices[t];
            const hist = history[t] || [];
            const price = info?.value ?? BASE_PRICE;
            const isUp = info?.up ?? true;

            // change vs first recorded price (session-based)
            const openPrice =
              hist.length > 0 ? hist[0].price : price;
            const change = price - openPrice;
            const changePct =
              openPrice !== 0 ? (change / openPrice) * 100 : 0;

            let mood = "Neutral";
            if (changePct > 0.5) mood = "Bullish";
            else if (changePct < -0.5) mood = "Bearish";

            return (
              <div
                key={t}
                className="stock-card"
                onClick={() => {
                  setSelectedStock(t);
                  setShowFullChart(true);
                }}
              >
                <div className="sc-head">
                  <div>
                    <div className="sc-title">{t}</div>
                    <div className="sc-mood">{mood}</div>
                  </div>
                  <div className="sc-price-block">
                    <div className={`sc-price ${isUp ? "up" : "down"}`}>
                      ₹{price.toFixed(2)}
                    </div>
                    <div
                      className={`sc-change ${
                        change >= 0 ? "up" : "down"
                      }`}
                    >
                      {change >= 0 ? "▲" : "▼"} ₹
                      {Math.abs(change).toFixed(2)} (
                      {Math.abs(changePct).toFixed(2)}%)
                    </div>
                  </div>
                </div>

                {/* MINI CHART */}
                <div className="sc-chart">
                  {hist.length > 1 && (
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={hist}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" hide />
                        <YAxis
                          hide
                          domain={[
                            (min) => min - min * 0.02,
                            (max) => max + max * 0.02,
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#4ade80"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Area
                          dataKey="price"
                          stroke="none"
                          fill={`url(#miniGradient-${t})`}
                        />
                        <defs>
                          <linearGradient
                            id={`miniGradient-${t}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#4ade80"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="100%"
                              stopColor="#4ade80"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="sc-footer">
                  <span>
                    Updated:{" "}
                    {lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}
                  </span>
                  <span className="sc-link">View full chart →</span>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
