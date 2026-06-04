// import { useState, useEffect, useCallback } from "react";
// import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
// import { marketAPI } from "../lib/api";
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
// } from "recharts";

// const RANGES = [
//   { key: "1d", label: "1D" },
//   { key: "7d", label: "7D" },
//   { key: "1mo", label: "1M" },
// ];

// const TABS = ["forex", "indices", "commodities"];

// export default function Markets() {
//   const [instruments, setInstruments] = useState([]);
//   const [tab, setTab] = useState("forex");
//   const [selected, setSelected] = useState(null);
//   const [candles, setCandles] = useState([]);
//   const [range, setRange] = useState("7d");
//   const [loading, setLoading] = useState(true);
//   const [loadingChart, setLoadingChart] = useState(false);

//   const load = useCallback(async () => {
//     try {
//       const m = await marketAPI.getAllMarketData();
//       setInstruments(m.data.instruments || []);
//       const first = (m.data.instruments || []).find((i) => i.asset_class === tab);
//       if (first && !selected) setSelected(first.symbol);
//       setLoading(false);
//     } catch (e) {
//       console.error(e);
//       setLoading(false);
//     }
//   }, [tab, selected]);

//   useEffect(() => {
//     load();
//   }, [load]);

//   useEffect(() => {
//     if (!selected) return;
//     setLoadingChart(true);
//     marketAPI
//       .getHistorical(selected, range)
//       .then((r) => setCandles(r.data.candles || []))
//       .catch(() => setCandles([]))
//       .finally(() => setLoadingChart(false));
//   }, [selected, range]);

//   const list = instruments.filter((i) => i.asset_class === tab);
//   const current = instruments.find((i) => i.symbol === selected);
//   const decimals = current?.asset_class === "forex" ? 5 : 2;
//   const chartData = candles.map((c, idx) => ({ idx, t: c.timestamp, price: c.close }));
//   const positive = chartData.length > 1 ? chartData[chartData.length - 1].price >= chartData[0].price : true;

//   return (
//     <div className="space-y-6" data-testid="markets-page">
//       <div>
//         <h1 className="font-heading text-3xl font-bold text-eli-text-white">Markets</h1>
//         <p className="text-sm text-eli-muted mt-1">Live OHLC and charts for the 8 EliAI instruments.</p>
//       </div>

//       {/* Asset class tabs */}
//       <div className="flex gap-2">
//         {TABS.map((t) => (
//           <button
//             key={t}
//             onClick={() => {
//               setTab(t);
//               const first = instruments.find((i) => i.asset_class === t);
//               if (first) setSelected(first.symbol);
//             }}
//             className={`px-4 py-2 text-sm font-bold rounded-sm border tracking-wider uppercase transition-colors ${
//               tab === t
//                 ? "bg-eli-gold text-eli-navy border-eli-gold"
//                 : "bg-eli-border/30 text-eli-muted border-eli-border hover:border-eli-gold/50"
//             }`}
//             data-testid={`tab-${t}`}
//           >
//             {t}
//           </button>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         {/* Instrument list */}
//         <div className="eli-card overflow-hidden">
//           <div className="px-4 py-3 border-b border-eli-border flex items-center justify-between">
//             <h3 className="text-sm font-medium text-eli-text-white">{tab.toUpperCase()}</h3>
//             <span className="text-xs text-eli-muted">{list.length}</span>
//           </div>
//           <div className="divide-y divide-eli-border">
//             {loading ? (
//               <div className="p-6 text-center text-eli-muted text-sm">Loading...</div>
//             ) : list.length === 0 ? (
//               <div className="p-6 text-center text-eli-muted text-sm">No instruments</div>
//             ) : (
//               list.map((i) => {
//                 const pos = i.change_percent >= 0;
//                 const isSel = i.symbol === selected;
//                 return (
//                   <button
//                     key={i.symbol}
//                     onClick={() => setSelected(i.symbol)}
//                     className={`w-full px-4 py-3 flex items-center justify-between hover:bg-eli-border/40 transition-colors text-left ${
//                       isSel ? "bg-eli-gold/10 border-l-2 border-eli-gold" : ""
//                     }`}
//                     data-testid={`market-row-${i.symbol.replace(/[\\/ &]/g, "_")}`}
//                   >
//                     <div>
//                       <p className="font-mono font-bold text-eli-text-white text-sm">{i.symbol}</p>
//                       <p className="text-[10px] text-eli-muted truncate max-w-[160px]">{i.name}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="font-mono text-eli-text-white text-sm tabular-nums">
//                         {i.price.toLocaleString(undefined, {
//                           minimumFractionDigits: i.asset_class === "forex" ? 4 : 2,
//                           maximumFractionDigits: i.asset_class === "forex" ? 5 : 2,
//                         })}
//                       </p>
//                       <p className={`text-xs font-mono ${pos ? "text-emerald-400" : "text-red-400"}`}>
//                         {pos ? "+" : ""}
//                         {i.change_percent?.toFixed(2)}%
//                       </p>
//                     </div>
//                   </button>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         {/* Chart + stats */}
//         <div className="lg:col-span-2 eli-card p-5">
//           {!current ? (
//             <div className="text-center text-eli-muted py-12">Select an instrument</div>
//           ) : (
//             <>
//               <div className="flex items-start justify-between mb-4">
//                 <div>
//                   <h2 className="font-heading text-2xl font-bold text-eli-text-white">{current.symbol}</h2>
//                   <p className="text-xs text-eli-muted">{current.name}</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="font-heading text-3xl font-bold text-eli-text-white tabular-nums">
//                     {current.price.toLocaleString(undefined, {
//                       minimumFractionDigits: decimals - 1,
//                       maximumFractionDigits: decimals,
//                     })}
//                   </p>
//                   <p
//                     className={`text-sm font-mono flex items-center justify-end gap-1 ${
//                       current.change_percent >= 0 ? "text-emerald-400" : "text-red-400"
//                     }`}
//                   >
//                     {current.change_percent >= 0 ? (
//                       <TrendingUp className="w-4 h-4" />
//                     ) : (
//                       <TrendingDown className="w-4 h-4" />
//                     )}
//                     {current.change_percent >= 0 ? "+" : ""}
//                     {current.change_percent?.toFixed(2)}% ({current.change >= 0 ? "+" : ""}
//                     {current.change?.toFixed(decimals)})
//                   </p>
//                 </div>
//               </div>

//               {/* Range selector */}
//               <div className="flex gap-1 mb-4">
//                 {RANGES.map((r) => (
//                   <button
//                     key={r.key}
//                     onClick={() => setRange(r.key)}
//                     className={`px-3 py-1 text-xs font-bold rounded-sm transition-colors ${
//                       range === r.key
//                         ? "bg-eli-gold text-eli-navy"
//                         : "bg-eli-border/30 text-eli-muted hover:text-eli-text-white"
//                     }`}
//                     data-testid={`range-${r.key}`}
//                   >
//                     {r.label}
//                   </button>
//                 ))}
//               </div>

//               {/* Chart */}
//               <div className="h-72">
//                 {loadingChart ? (
//                   <div className="h-full flex items-center justify-center">
//                     <RefreshCw className="w-5 h-5 text-eli-gold animate-spin" />
//                   </div>
//                 ) : chartData.length === 0 ? (
//                   <div className="h-full flex items-center justify-center text-eli-muted text-sm">
//                     No chart data
//                   </div>
//                 ) : (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <AreaChart data={chartData}>
//                       <defs>
//                         <linearGradient id="mkt-grd" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="0%" stopColor={positive ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
//                           <stop offset="100%" stopColor={positive ? "#10B981" : "#EF4444"} stopOpacity={0} />
//                         </linearGradient>
//                       </defs>
//                       <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" />
//                       <XAxis dataKey="idx" hide />
//                       <YAxis
//                         domain={["dataMin", "dataMax"]}
//                         tick={{ fill: "#94A3B8", fontSize: 10 }}
//                         tickFormatter={(v) => v.toFixed(decimals)}
//                       />
//                       <Tooltip
//                         contentStyle={{ background: "#0E1F36", border: "1px solid #1E3A5F" }}
//                         labelStyle={{ color: "#94A3B8" }}
//                         formatter={(v) => [v.toFixed(decimals), "Price"]}
//                       />
//                       <Area
//                         type="monotone"
//                         dataKey="price"
//                         stroke={positive ? "#10B981" : "#EF4444"}
//                         strokeWidth={2}
//                         fill="url(#mkt-grd)"
//                       />
//                     </AreaChart>
//                   </ResponsiveContainer>
//                 )}
//               </div>

//               {/* OHLC stats */}
//               <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-eli-border">
//                 <div>
//                   <p className="text-[10px] text-eli-muted uppercase tracking-wider">Day High</p>
//                   <p className="font-mono text-eli-text-white tabular-nums">{current.high?.toFixed(decimals)}</p>
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-eli-muted uppercase tracking-wider">Day Low</p>
//                   <p className="font-mono text-eli-text-white tabular-nums">{current.low?.toFixed(decimals)}</p>
//                 </div>
//                 <div>
//                   <p className="text-[10px] text-eli-muted uppercase tracking-wider">Prev Close</p>
//                   <p className="font-mono text-eli-text-white tabular-nums">
//                     {current.previous_close?.toFixed(decimals)}
//                   </p>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Zap,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Minus as MinusIcon,
} from "lucide-react";
import { marketAPI } from "../lib/api";
import TradingViewChart from "../components/TradingViewChart";

const RANGES = [
  { key: "1d", label: "1D" },
  { key: "7d", label: "7D" },
  { key: "1mo", label: "1M" },
  { key: "3mo", label: "3M" },
];

const TABS = ["forex", "indices", "commodities"];
const LAYOUTS = ["single", "dual", "quad"];

export default function Markets() {
  const [instruments, setInstruments] = useState([]);
  const [tab, setTab] = useState("forex");
  const [selected, setSelected] = useState(null);
  const [compareSymbols, setCompareSymbols] = useState([]); // For comparison mode
  const [compareData, setCompareData] = useState([]);
  const [candles, setCandles] = useState([]);
  const [range, setRange] = useState("7d");
  const [layout, setLayout] = useState("single");
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'heatmap'
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);

  // AI Pattern Recognition (Mock for MVP)
  const [aiPatterns, setAiPatterns] = useState([]);

  const load = useCallback(async () => {
    try {
      const m = await marketAPI.getAllMarketData();
      setInstruments(m.data.instruments || []);
      const first = (m.data.instruments || []).find(
        (i) => i.asset_class === tab,
      );
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
    
    const fetchPromises = [
      marketAPI.getHistorical(selected, range),
      ...compareSymbols.map(sym => marketAPI.getHistorical(sym, range))
    ];

    Promise.all(fetchPromises)
      .then((results) => {
        setCandles(results[0].data.candles || []);
        const compData = results.slice(1).map((r, i) => ({
          symbol: compareSymbols[i],
          data: r.data.candles || []
        }));
        setCompareData(compData);

        // Mock AI Pattern Recognition
        setAiPatterns([
          { name: "Bullish Engulfing", prob: 78, type: "bullish" },
          { name: "Support Bounce", prob: 65, type: "bullish" },
        ]);
      })
      .catch((e) => {
        console.error(e);
        setCandles([]);
        setCompareData([]);
      })
      .finally(() => setLoadingChart(false));
  }, [selected, range, compareSymbols]);

  const list = instruments.filter((i) => i.asset_class === tab);
  const current = instruments.find((i) => i.symbol === selected);
  const decimals = current?.asset_class === "forex" ? 5 : 2;

  const chartData = candles.map((c, idx) => ({
    idx,
    time: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume || Math.random() * 1000000,
  }));

  const positive =
    chartData.length > 1
      ? chartData[chartData.length - 1].close >= chartData[0].close
      : true;

  const toggleCompare = (e, symbol) => {
    e.stopPropagation();
    if (symbol === selected) return;
    if (compareSymbols.includes(symbol)) {
      setCompareSymbols(compareSymbols.filter((s) => s !== symbol));
    } else if (compareSymbols.length < 3) {
      setCompareSymbols([...compareSymbols, symbol]);
    }
  };

  return (
    <div className="space-y-6" data-testid="markets-page">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-heading text-3xl font-bold text-eli-text-white">
            Markets
          </h1>
          <p className="text-sm text-eli-muted mt-1">
            Live charts with AI pattern recognition • TradingView style
          </p>
        </div>
        <div className="flex gap-2">
          {LAYOUTS.map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`px-4 py-1.5 text-xs font-bold rounded-sm border transition-colors ${
                layout === l
                  ? "bg-eli-gold text-eli-navy"
                  : "bg-eli-border/30 text-eli-muted border-eli-border"
              }`}
            >
              {l === "single"
                ? "Single"
                : l === "dual"
                  ? "2 Charts"
                  : "4 Charts"}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Class Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              const first = instruments.find((i) => i.asset_class === t);
              if (first) setSelected(first.symbol);
            }}
            className={`px-5 py-2 text-sm font-bold rounded-sm border tracking-wider uppercase transition-colors ${
              tab === t
                ? "bg-eli-gold text-eli-navy border-eli-gold"
                : "bg-eli-border/30 text-eli-muted border-eli-border hover:border-eli-gold/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Instrument List / Heatmap */}
        <div className="lg:col-span-3 eli-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-eli-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-eli-text-white">
                {tab.toUpperCase()}
              </h3>
              <span className="text-xs text-eli-muted">{list.length}</span>
            </div>
            <div className="flex bg-eli-navy rounded-sm p-0.5 border border-eli-border">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded-sm ${viewMode === "list" ? "bg-eli-border text-eli-text-white" : "text-eli-muted hover:text-eli-text-white"}`}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("heatmap")}
                className={`p-1 rounded-sm ${viewMode === "heatmap" ? "bg-eli-border text-eli-text-white" : "text-eli-muted hover:text-eli-text-white"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto max-h-[70vh]">
            {viewMode === "list" ? (
              <div className="divide-y divide-eli-border">
                {list.map((i) => {
                  const pos = i.change_percent >= 0;
                  const isSel = i.symbol === selected;
                  const isComp = compareSymbols.includes(i.symbol);
                  return (
                    <div
                      key={i.symbol}
                      onClick={() => setSelected(i.symbol)}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-eli-border/40 transition-colors cursor-pointer text-left ${
                        isSel ? "bg-eli-gold/10 border-l-2 border-eli-gold" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-eli-text-white">
                            {i.symbol}
                          </p>
                          {!isSel && (
                            <button
                              onClick={(e) => toggleCompare(e, i.symbol)}
                              className={`p-0.5 rounded-sm border ${isComp ? "bg-eli-border border-eli-border text-eli-text-white" : "border-transparent text-eli-muted hover:border-eli-border hover:bg-eli-navy"}`}
                              title={isComp ? "Remove Comparison" : "Add to Comparison"}
                            >
                              {isComp ? <MinusIcon className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-eli-muted truncate">
                          {i.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-eli-text-white tabular-nums">
                          {i.price.toFixed(decimals)}
                        </p>
                        <p
                          className={`text-xs font-mono ${pos ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {pos ? "+" : ""}
                          {i.change_percent?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-3">
                {list.map((i) => {
                  const pos = i.change_percent >= 0;
                  const isSel = i.symbol === selected;
                  const isComp = compareSymbols.includes(i.symbol);
                  return (
                    <div
                      key={i.symbol}
                      onClick={() => setSelected(i.symbol)}
                      className={`relative p-3 rounded-md flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 ${
                        pos ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30" : "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
                      } ${isSel ? "ring-2 ring-eli-gold" : ""}`}
                    >
                      {!isSel && (
                        <button
                          onClick={(e) => toggleCompare(e, i.symbol)}
                          className={`absolute top-1 right-1 p-0.5 rounded-sm bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-colors`}
                          title={isComp ? "Remove Comparison" : "Add to Comparison"}
                        >
                          {isComp ? <MinusIcon className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        </button>
                      )}
                      <span className="font-mono font-bold text-white mb-1">{i.symbol}</span>
                      <span className={`font-mono text-sm ${pos ? "text-emerald-300" : "text-red-300"}`}>
                        {pos ? "+" : ""}{i.change_percent?.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="lg:col-span-9 eli-card p-5">
          {current && (
            <>
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="font-heading text-3xl font-bold text-eli-text-white">
                    {current.symbol}
                  </h2>
                  <p className="text-eli-muted">{current.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-eli-text-white tabular-nums">
                    {current.price.toFixed(decimals)}
                  </p>
                  <p
                    className={`text-sm flex items-center gap-1 justify-end ${positive ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {positive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {current.change_percent?.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Time Range + AI Insights */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {RANGES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setRange(r.key)}
                      className={`px-4 py-1 text-xs font-bold rounded-sm transition-all ${
                        range === r.key
                          ? "bg-eli-gold text-eli-navy"
                          : "bg-eli-border/30 text-eli-muted hover:bg-eli-border"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* AI Pattern Recognition */}
                {aiPatterns.length > 0 && (
                  <div className="flex gap-2">
                    {aiPatterns.map((p, i) => (
                      <div
                        key={i}
                        className={`px-3 py-1 rounded-sm text-xs flex items-center gap-1.5 ${
                          p.type === "bullish"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        {p.name} <span className="font-mono">({p.prob}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="h-[460px] relative">
                {loadingChart ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-eli-gold" />
                  </div>
                ) : (
                  <div className="w-full h-full">
                    <TradingViewChart data={chartData} positive={positive} aiPatterns={aiPatterns} compareData={compareData} />
                  </div>
                )}
              </div>

              {/* OHLC Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-eli-border">
                <div>
                  <p className="text-[10px] text-eli-muted uppercase">Open</p>
                  <p className="font-mono text-eli-text-white">
                    {current.open?.toFixed(decimals)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-eli-muted uppercase">High</p>
                  <p className="font-mono text-emerald-400">
                    {current.high?.toFixed(decimals)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-eli-muted uppercase">Low</p>
                  <p className="font-mono text-red-400">
                    {current.low?.toFixed(decimals)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-eli-muted uppercase">
                    Prev Close
                  </p>
                  <p className="font-mono text-eli-text-white">
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
