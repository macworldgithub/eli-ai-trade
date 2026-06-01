import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { marketAPI } from "../lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const RANGES = [
  { key: "1d", label: "1D" },
  { key: "7d", label: "7D" },
  { key: "1mo", label: "1M" },
];

const TABS = ["forex", "indices", "commodities"];

export default function Markets() {
  const [instruments, setInstruments] = useState([]);
  const [tab, setTab] = useState("forex");
  const [selected, setSelected] = useState(null);
  const [candles, setCandles] = useState([]);
  const [range, setRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);

  const load = useCallback(async () => {
    try {
      const m = await marketAPI.getAllMarketData();
      setInstruments(m.data.instruments || []);
      const first = (m.data.instruments || []).find((i) => i.asset_class === tab);
      if (first && !selected) setSelected(first.symbol);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [tab, selected]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setLoadingChart(true);
    marketAPI
      .getHistorical(selected, range)
      .then((r) => setCandles(r.data.candles || []))
      .catch(() => setCandles([]))
      .finally(() => setLoadingChart(false));
  }, [selected, range]);

  const list = instruments.filter((i) => i.asset_class === tab);
  const current = instruments.find((i) => i.symbol === selected);
  const decimals = current?.asset_class === "forex" ? 5 : 2;
  const chartData = candles.map((c, idx) => ({ idx, t: c.timestamp, price: c.close }));
  const positive = chartData.length > 1 ? chartData[chartData.length - 1].price >= chartData[0].price : true;

  return (
    <div className="space-y-6" data-testid="markets-page">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">Markets</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Live OHLC and charts for the 8 EliAI instruments.</p>
      </div>

      {/* Asset class tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              const first = instruments.find((i) => i.asset_class === t);
              if (first) setSelected(first.symbol);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-sm border tracking-wider uppercase transition-colors ${
              tab === t
                ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]"
                : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]/50"
            }`}
            data-testid={`tab-${t}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Instrument list */}
        <div className="eli-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E3A5F] flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">{tab.toUpperCase()}</h3>
            <span className="text-xs text-[#94A3B8]">{list.length}</span>
          </div>
          <div className="divide-y divide-[#1E3A5F]">
            {loading ? (
              <div className="p-6 text-center text-[#94A3B8] text-sm">Loading...</div>
            ) : list.length === 0 ? (
              <div className="p-6 text-center text-[#94A3B8] text-sm">No instruments</div>
            ) : (
              list.map((i) => {
                const pos = i.change_percent >= 0;
                const isSel = i.symbol === selected;
                return (
                  <button
                    key={i.symbol}
                    onClick={() => setSelected(i.symbol)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-[#1E3A5F]/40 transition-colors text-left ${
                      isSel ? "bg-[#D4AF37]/10 border-l-2 border-[#D4AF37]" : ""
                    }`}
                    data-testid={`market-row-${i.symbol.replace(/[\\/ &]/g, "_")}`}
                  >
                    <div>
                      <p className="font-mono font-semibold text-white text-sm">{i.symbol}</p>
                      <p className="text-[10px] text-[#94A3B8] truncate max-w-[160px]">{i.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-white text-sm tabular-nums">
                        {i.price.toLocaleString(undefined, {
                          minimumFractionDigits: i.asset_class === "forex" ? 4 : 2,
                          maximumFractionDigits: i.asset_class === "forex" ? 5 : 2,
                        })}
                      </p>
                      <p className={`text-xs font-mono ${pos ? "text-emerald-400" : "text-red-400"}`}>
                        {pos ? "+" : ""}
                        {i.change_percent?.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chart + stats */}
        <div className="lg:col-span-2 eli-card p-5">
          {!current ? (
            <div className="text-center text-[#94A3B8] py-12">Select an instrument</div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-white">{current.symbol}</h2>
                  <p className="text-xs text-[#94A3B8]">{current.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-3xl font-bold text-white tabular-nums">
                    {current.price.toLocaleString(undefined, {
                      minimumFractionDigits: decimals - 1,
                      maximumFractionDigits: decimals,
                    })}
                  </p>
                  <p
                    className={`text-sm font-mono flex items-center justify-end gap-1 ${
                      current.change_percent >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {current.change_percent >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {current.change_percent >= 0 ? "+" : ""}
                    {current.change_percent?.toFixed(2)}% ({current.change >= 0 ? "+" : ""}
                    {current.change?.toFixed(decimals)})
                  </p>
                </div>
              </div>

              {/* Range selector */}
              <div className="flex gap-1 mb-4">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${
                      range === r.key
                        ? "bg-[#D4AF37] text-[#0A1628]"
                        : "bg-[#1E3A5F]/30 text-[#94A3B8] hover:text-white"
                    }`}
                    data-testid={`range-${r.key}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="h-72">
                {loadingChart ? (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-[#D4AF37] animate-spin" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#94A3B8] text-sm">
                    No chart data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="mkt-grd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={positive ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={positive ? "#10B981" : "#EF4444"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" />
                      <XAxis dataKey="idx" hide />
                      <YAxis
                        domain={["dataMin", "dataMax"]}
                        tick={{ fill: "#94A3B8", fontSize: 10 }}
                        tickFormatter={(v) => v.toFixed(decimals)}
                      />
                      <Tooltip
                        contentStyle={{ background: "#0E1F36", border: "1px solid #1E3A5F" }}
                        labelStyle={{ color: "#94A3B8" }}
                        formatter={(v) => [v.toFixed(decimals), "Price"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={positive ? "#10B981" : "#EF4444"}
                        strokeWidth={2}
                        fill="url(#mkt-grd)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* OHLC stats */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1E3A5F]">
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Day High</p>
                  <p className="font-mono text-white tabular-nums">{current.high?.toFixed(decimals)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Day Low</p>
                  <p className="font-mono text-white tabular-nums">{current.low?.toFixed(decimals)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Prev Close</p>
                  <p className="font-mono text-white tabular-nums">
                    {current.previous_close?.toFixed(decimals)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
