// import { useState, useEffect, useCallback } from "react";
// import {
//   TrendingUp,
//   TrendingDown,
//   Activity,
//   Sparkles,
//   Clock,
//   RefreshCw,
// } from "lucide-react";
// import { marketAPI, sessionAPI, aiAPI } from "../lib/api";
// import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

// const fmtPrice = (p, ac) =>
//   typeof p === "number"
//     ? p.toLocaleString(undefined, {
//         minimumFractionDigits: ac === "forex" ? 4 : 2,
//         maximumFractionDigits: ac === "forex" ? 5 : 2,
//       })
//     : "-";

// const Pill = ({ children, color = "navy" }) => {
//   const map = {
//     gold: "bg-eli-gold/15 text-eli-gold border-eli-gold/30",
//     green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
//     red: "bg-red-500/15 text-red-400 border-red-500/30",
//     amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
//     navy: "bg-eli-border/40 text-eli-muted border-eli-border",
//   };
//   return (
//     <span
//       className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border rounded-sm ${map[color]}`}
//     >
//       {children}
//     </span>
//   );
// };

// const InstrumentTile = ({ inst, verdict }) => {
//   const positive = inst.change_percent >= 0;
//   const action = verdict?.verdict?.action;
//   const actionColor =
//     action === "BUY"
//       ? "green"
//       : action === "SELL"
//         ? "red"
//         : action === "HOLD"
//           ? "amber"
//           : "navy";

//   return (
//     <div
//       className="eli-card eli-card-hover p-4 animate-fade-in"
//       data-testid={`tile-${inst.symbol.replace(/[\\/ &]/g, "_")}`}
//     >
//       <div className="flex items-start justify-between mb-3">
//         <div>
//           <div className="flex items-center gap-2">
//             <span className="font-mono font-bold text-eli-text-white text-sm tracking-tight">
//               {inst.symbol}
//             </span>
//             <Pill>{inst.asset_class.toUpperCase()}</Pill>
//           </div>
//           <p className="text-[10px] text-eli-muted mt-1 truncate max-w-[180px]">
//             {inst.name}
//           </p>
//         </div>
//         {action && <Pill color={actionColor}>{action}</Pill>}
//       </div>

//       <div className="flex items-baseline justify-between">
//         <span className="font-heading text-2xl font-bold text-eli-text-white tabular-nums">
//           {fmtPrice(inst.price, inst.asset_class)}
//         </span>
//         <span
//           className={`text-xs font-mono tabular-nums flex items-center gap-1 ${
//             positive ? "text-emerald-400" : "text-red-400"
//           }`}
//         >
//           {positive ? (
//             <TrendingUp className="w-3 h-3" />
//           ) : (
//             <TrendingDown className="w-3 h-3" />
//           )}
//           {positive ? "+" : ""}
//           {inst.change_percent?.toFixed(2)}%
//         </span>
//       </div>

//       {verdict && (
//         <div className="mt-3 pt-3 border-t border-eli-border">
//           <div className="flex items-center justify-between text-[10px]">
//             <span className="text-eli-muted tracking-wider uppercase">
//               AI Confidence
//             </span>
//             <span className="text-eli-gold font-mono font-bold">
//               {verdict.verdict?.confidence ?? "-"}%
//             </span>
//           </div>
//           <div className="mt-1 h-1 bg-eli-border rounded-full overflow-hidden">
//             <div
//               className="h-full bg-gradient-to-r from-eli-gold to-eli-gold-bright"
//               style={{ width: `${verdict.verdict?.confidence ?? 0}%` }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const SessionsCard = ({ sessions, overlaps }) => {
//   const list = [
//     { k: "sydney", n: "Sydney" },
//     { k: "tokyo", n: "Tokyo" },
//     { k: "london", n: "London" },
//     { k: "new_york", n: "New York" },
//   ];
//   return (
//     <div className="eli-card p-4" data-testid="sessions-card">
//       <div className="flex items-center justify-between mb-3">
//         <h3 className="text-sm font-medium text-eli-text-white">Market Sessions</h3>
//         <Clock className="w-4 h-4 text-eli-gold" />
//       </div>
//       <div className="grid grid-cols-4 gap-2">
//         {list.map((s) => {
//           const isOpen = sessions?.[s.k]?.status === "open";
//           return (
//             <div
//               key={s.k}
//               className={`p-2 text-center rounded-sm border ${
//                 isOpen
//                   ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
//                   : "bg-eli-border/30 border-eli-border text-eli-muted"
//               }`}
//             >
//               <div className="text-[10px] font-medium">{s.n}</div>
//               <div className="text-[9px] uppercase tracking-wider mt-1">
//                 {isOpen ? "Open" : "Closed"}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//       {overlaps?.length > 0 && (
//         <div className="mt-3 pt-3 border-t border-eli-border">
//           <p className="text-[10px] text-eli-muted tracking-wider uppercase mb-1">
//             Active Overlaps
//           </p>
//           {overlaps.map((o) => (
//             <span key={o} className="text-xs text-eli-gold font-medium">
//               {o}
//             </span>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// const MiniChart = ({ candles }) => {
//   if (!candles || candles.length === 0) return null;
//   const data = candles.map((c) => ({ price: c.close }));
//   const first = data[0].price;
//   const last = data[data.length - 1].price;
//   const positive = last >= first;
//   const color = positive ? "#10B981" : "#EF4444";
//   return (
//     <div className="h-24">
//       <ResponsiveContainer width="100%" height="100%">
//         <AreaChart data={data}>
//           <defs>
//             <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor={color} stopOpacity={0.4} />
//               <stop offset="100%" stopColor={color} stopOpacity={0} />
//             </linearGradient>
//           </defs>
//           <YAxis domain={["dataMin", "dataMax"]} hide />
//           <Area
//             type="monotone"
//             dataKey="price"
//             stroke={color}
//             strokeWidth={1.5}
//             fill="url(#grd)"
//           />
//         </AreaChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default function Dashboard() {
//   const [instruments, setInstruments] = useState([]);
//   const [verdicts, setVerdicts] = useState({});
//   const [sessions, setSessions] = useState(null);
//   const [overlaps, setOverlaps] = useState([]);
//   const [gold, setGold] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshingAi, setRefreshingAi] = useState(false);
//   const [lastUpdate, setLastUpdate] = useState(null);

//   const fetchAll = useCallback(async () => {
//     try {
//       const [m, s, v] = await Promise.all([
//         marketAPI.getAllMarketData(),
//         sessionAPI.getStatus(),
//         aiAPI.getAllVerdicts(),
//       ]);
//       setInstruments(m.data.instruments || []);
//       setSessions(s.data.sessions);
//       setOverlaps(s.data.active_overlaps || []);
//       const vm = {};
//       (v.data.verdicts || []).forEach((x) => (vm[x.symbol] = x));
//       setVerdicts(vm);
//       try {
//         const h = await marketAPI.getHistorical("XAU/USD", "7d");
//         setGold(h.data.candles);
//       } catch (e) {
//         /* non-critical */
//       }
//       setLastUpdate(new Date());
//       setLoading(false);
//     } catch (e) {
//       console.error(e);
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchAll();
//     const t = setInterval(fetchAll, 60000);
//     return () => clearInterval(t);
//   }, [fetchAll]);

//   const refreshAi = async () => {
//     setRefreshingAi(true);
//     try {
//       const r = await aiAPI.refreshVerdicts();
//       const vm = {};
//       (r.data.verdicts || []).forEach((x) => (vm[x.symbol] = x));
//       setVerdicts(vm);
//     } catch (e) {
//       console.error("refresh ai", e);
//     }
//     setRefreshingAi(false);
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="flex flex-col items-center gap-4">
//           <div className="w-8 h-8 border-2 border-eli-gold border-t-transparent rounded-full animate-spin" />
//           <p className="text-eli-muted text-sm">Loading EliAI Trade...</p>
//         </div>
//       </div>
//     );
//   }

//   const ticker = instruments;
//   const forex = instruments.filter((i) => i.asset_class === "forex");
//   const indices = instruments.filter((i) => i.asset_class === "indices");
//   const commodities = instruments.filter(
//     (i) => i.asset_class === "commodities",
//   );

//   return (
//     <div className="space-y-6" data-testid="dashboard-page">
//       {/* Live ticker banner */}
//       <div className="eli-card overflow-hidden">
//         <div className="flex items-stretch">
//           <div className="px-4 py-2 bg-eli-gold/10 border-r border-eli-border flex items-center gap-2 shrink-0">
//             <Activity className="w-4 h-4 text-eli-gold" />
//             <span className="text-xs font-bold text-eli-gold uppercase tracking-wider">
//               Live
//             </span>
//           </div>
//           <div className="overflow-hidden flex-1">
//             <div className="flex animate-ticker whitespace-nowrap">
//               {[...ticker, ...ticker].map((i, idx) => {
//                 const pos = i.change_percent >= 0;
//                 return (
//                   <div
//                     key={`${i.symbol}-${idx}`}
//                     className="inline-flex items-center gap-2 px-6 py-2"
//                   >
//                     <span className="font-mono text-sm text-eli-text-white font-medium">
//                       {i.symbol}
//                     </span>
//                     <span className="font-mono text-sm tabular-nums text-eli-text-white">
//                       {fmtPrice(i.price, i.asset_class)}
//                     </span>
//                     <span
//                       className={`font-mono text-xs tabular-nums ${pos ? "text-emerald-400" : "text-red-400"}`}
//                     >
//                       {pos ? "+" : ""}
//                       {i.change_percent?.toFixed(2)}%
//                     </span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
//         <div>
//           <h1 className="font-heading text-3xl lg:text-4xl font-bold text-eli-text-white tracking-tight">
//             <span className="eli-gradient-text">Trading</span> Intelligence
//           </h1>
//           <p className="text-sm text-eli-muted mt-1">
//             8 instruments · AI verdicts ·{" "}
//             {lastUpdate && `updated ${lastUpdate.toLocaleTimeString()}`}
//           </p>
//         </div>
//         <button
//           onClick={refreshAi}
//           disabled={refreshingAi}
//           className="flex items-center gap-2 px-4 py-2 bg-eli-gold hover:bg-eli-gold-bright text-eli-navy font-bold text-sm rounded-sm transition-colors disabled:opacity-50"
//           data-testid="refresh-ai-btn"
//         >
//           <Sparkles
//             className={`w-4 h-4 ${refreshingAi ? "animate-spin" : ""}`}
//           />
//           {refreshingAi ? "Generating..." : "Run AI Engine"}
//         </button>
//       </div>

//       {/* Instrument tiles by asset class */}
//       <section>
//         <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-3">
//           Forex
//         </h2>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {forex.map((i) => (
//             <InstrumentTile
//               key={i.symbol}
//               inst={i}
//               verdict={verdicts[i.symbol]}
//             />
//           ))}
//         </div>
//       </section>

//       <section>
//         <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-3">
//           Indices
//         </h2>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           {indices.map((i) => (
//             <InstrumentTile
//               key={i.symbol}
//               inst={i}
//               verdict={verdicts[i.symbol]}
//             />
//           ))}
//         </div>
//       </section>

//       <section>
//         <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-3">
//           Commodities
//         </h2>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {commodities.map((i) => (
//             <InstrumentTile
//               key={i.symbol}
//               inst={i}
//               verdict={verdicts[i.symbol]}
//             />
//           ))}
//         </div>
//       </section>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         <SessionsCard sessions={sessions} overlaps={overlaps} />
//         <div className="eli-card p-4 lg:col-span-2">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="text-sm font-medium text-eli-text-white">Gold · 7-day</h3>
//             <Pill color="gold">XAU/USD</Pill>
//           </div>
//           <MiniChart candles={gold} />
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  Clock,
  BookOpen,
  Star,
  Plus,
  Trash2,
} from "lucide-react";
import { marketAPI, sessionAPI, aiAPI } from "../lib/api";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

const fmtPrice = (p, ac) =>
  typeof p === "number"
    ? p.toLocaleString(undefined, {
      minimumFractionDigits: ac === "forex" ? 4 : 2,
      maximumFractionDigits: ac === "forex" ? 5 : 2,
    })
    : "-";

const Pill = ({ children, color = "navy" }) => {
  const map = {
    gold: "bg-eli-gold/15 text-eli-gold border-eli-gold/30",
    green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    red: "bg-red-500/15 text-red-400 border-red-500/30",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    navy: "bg-eli-border/40 text-eli-muted border-eli-border",
  };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border rounded-sm ${map[color]}`}
    >
      {children}
    </span>
  );
};

const InstrumentTile = ({
  inst,
  verdict,
  onToggleWatchlist,
  isInWatchlist,
  onClick,
}) => {
  const positive = inst.change_percent >= 0;
  const action = verdict?.verdict?.action;
  const actionColor =
    action === "BUY" || action === "BULLISH"
      ? "green"
      : action === "SELL" || action === "BEARISH"
        ? "red"
        : action === "HOLD" || action === "NEUTRAL"
          ? "amber"
          : "navy";

  return (
    <div
      className="eli-card eli-card-hover p-4 animate-fade-in group relative cursor-pointer"
      data-testid={`tile-${inst.symbol.replace(/[\\/ &]/g, "_")}`}
      onClick={() => onClick && onClick(inst.symbol)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleWatchlist(inst.symbol);
        }}
        className="absolute top-3 right-3 text-eli-muted hover:text-eli-gold transition-colors"
      >
        <Star
          className={`w-4 h-4 ${isInWatchlist ? "fill-eli-gold text-eli-gold" : ""}`}
        />
      </button>

      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-eli-text-white text-sm tracking-tight">
              {inst.symbol}
            </span>
            <Pill>{inst.asset_class.toUpperCase()}</Pill>
          </div>
          <p className="text-[10px] text-eli-muted mt-1 truncate max-w-[180px]">
            {inst.name}
          </p>
        </div>
        {action && <Pill color={actionColor}>{action}</Pill>}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="font-heading text-2xl font-bold text-eli-text-white tabular-nums">
          {fmtPrice(inst.price, inst.asset_class)}
        </span>
        <span
          className={`text-xs font-mono tabular-nums flex items-center gap-1 ${positive ? "text-emerald-400" : "text-red-400"
            }`}
        >
          {positive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {positive ? "+" : ""}
          {inst.change_percent?.toFixed(2)}%
        </span>
      </div>

      {verdict && (
        <div className="mt-3 pt-3 border-t border-eli-border">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-eli-muted tracking-wider uppercase">
              AI Confidence
            </span>
            <span className="text-eli-gold font-mono font-bold">
              {verdict.verdict?.confidence ?? "-"}%
            </span>
          </div>
          <div className="mt-1 h-1 bg-eli-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-eli-gold to-eli-gold-bright"
              style={{ width: `${verdict.verdict?.confidence ?? 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const WatchlistSection = ({
  watchlistSymbols,
  instruments,
  verdicts,
  onToggleWatchlist,
  onTileClick,
}) => {
  const watchlistInstruments = instruments.filter((i) =>
    watchlistSymbols.includes(i.symbol),
  );

  if (watchlistInstruments.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-4 flex items-center gap-2">
          <Star className="w-4 h-4" /> MY WATCHLIST
        </h2>
        <div className="eli-card p-8 text-center text-eli-muted">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Your watchlist is empty</p>
          <p className="text-xs mt-1">Star any instrument to add it here</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-4 flex items-center gap-2">
        <Star className="w-4 h-4" /> MY WATCHLIST ({watchlistSymbols.length})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {watchlistInstruments.map((i) => (
          <InstrumentTile
            key={i.symbol}
            inst={i}
            verdict={verdicts[i.symbol]}
            onToggleWatchlist={onToggleWatchlist}
            isInWatchlist={true}
            onClick={onTileClick}
          />
        ))}
      </div>
    </section>
  );
};

const SignalSpotlight = ({ verdicts, onLogTrade }) => {
  const highConf = Object.values(verdicts)
    .filter((v) => (v?.verdict?.confidence || 0) >= 70)
    .slice(0, 3);

  if (highConf.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase">
          SIGNAL SPOTLIGHT
        </h2>
        <span className="text-xs text-emerald-400 flex items-center gap-1">
          <Star className="w-3 h-3" /> Ready to Trade
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {highConf.map((v) => {
          const ver = v.verdict;
          return (
            <div
              key={v.symbol}
              className="eli-card p-5 border-l-4 border-eli-gold"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-eli-text-white text-lg">{v.symbol}</h3>
                <Pill
                  color={
                    ver.action === "BUY" || ver.action === "BULLISH"
                      ? "green"
                      : "red"
                  }
                >
                  {ver.action}
                </Pill>
              </div>
              <p className="text-sm text-eli-slate-300 line-clamp-2 mb-4">
                {ver.overview || ver.reasoning || "Strong momentum detected..."}
              </p>
              <button
                onClick={() => onLogTrade(v.symbol)}
                className="w-full bg-eli-gold hover:bg-eli-gold-bright text-eli-navy font-bold py-2.5 rounded-sm text-sm flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Log Trade Now
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const QuickStats = () => {
  const stats = { dailyPnL: "+$248.50", winRate: "68%", openPositions: 3 };

  return (
    <div className="eli-card p-5">
      <h3 className="text-sm font-bold text-eli-text-white mb-4">Quick Stats</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-emerald-400 text-2xl font-bold">
            {stats.dailyPnL}
          </p>
          <p className="text-[10px] text-eli-muted uppercase tracking-wider">
            Daily P&amp;L
          </p>
        </div>
        <div>
          <p className="text-eli-text-white text-2xl font-bold">{stats.winRate}</p>
          <p className="text-[10px] text-eli-muted uppercase tracking-wider">
            Win Rate
          </p>
        </div>
        <div>
          <p className="text-amber-400 text-2xl font-bold">
            {stats.openPositions}
          </p>
          <p className="text-[10px] text-eli-muted uppercase tracking-wider">
            Open Positions
          </p>
        </div>
      </div>
    </div>
  );
};

const AnnouncementsTicker = () => {
  const announcements = [
    "FOMC Interest Rate Decision - Today 19:00 UTC",
    "ECB Press Conference - Tomorrow 13:45 UTC",
    "US Non-Farm Payrolls - Friday 13:30 UTC",
  ];

  return (
    <div className="eli-card overflow-hidden bg-eli-border/30 border border-eli-gold/30">
      <div className="flex items-center gap-2 px-4 py-2 bg-eli-gold/10 border-b border-eli-border">
        <Activity className="w-4 h-4 text-eli-gold" />
        <span className="text-xs font-bold text-eli-gold uppercase tracking-wider">
          Upcoming Events (24h)
        </span>
      </div>
      <div className="overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap py-2 text-sm">
          {[...announcements, ...announcements].map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center px-8 text-eli-muted hover:text-eli-text-white transition-colors"
            >
              📅 {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SessionsCard = ({ sessions, overlaps }) => {
  const list = [
    { k: "sydney", n: "Sydney", time: "22:00 - 07:00 UTC" },
    { k: "tokyo", n: "Tokyo", time: "00:00 - 09:00 UTC" },
    { k: "london", n: "London", time: "08:00 - 17:00 UTC" },
    { k: "new_york", n: "New York", time: "13:00 - 22:00 UTC" },
  ];

  return (
    <div className="eli-card p-5" data-testid="sessions-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-eli-text-white">Market Sessions</h3>
        <Clock className="w-4 h-4 text-eli-gold" />
      </div>
      <div className="space-y-3">
        {list.map((s) => {
          const isOpen = sessions?.[s.k]?.status === "open";
          return (
            <div
              key={s.k}
              className={`flex justify-between items-center p-3 rounded-sm border ${isOpen
                ? "bg-emerald-500/10 border-emerald-500/40"
                : "bg-eli-border/30 border-eli-border"
                }`}
            >
              <div>
                <div className="font-medium text-eli-text-white">{s.n}</div>
                <div className="text-[10px] text-eli-muted">{s.time}</div>
              </div>
              <Pill color={isOpen ? "green" : "navy"}>
                {isOpen ? "OPEN" : "CLOSED"}
              </Pill>
            </div>
          );
        })}
      </div>
      {overlaps?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-eli-border">
          <p className="text-[10px] text-eli-muted uppercase tracking-wider mb-2">
            Active Overlaps
          </p>
          <div className="flex gap-2">
            {overlaps.map((o) => (
              <Pill key={o} color="gold">
                {o}
              </Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MiniChart = ({ candles }) => {
  if (!candles || candles.length === 0) return null;
  const data = candles.map((c) => ({ price: c.close }));
  const first = data[0].price;
  const last = data[data.length - 1].price;
  const positive = last >= first;
  const color = positive ? "#10B981" : "#EF4444";

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#grd)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function Dashboard() {
  const [instruments, setInstruments] = useState([]);
  const [verdicts, setVerdicts] = useState({});
  const [sessions, setSessions] = useState(null);
  const [overlaps, setOverlaps] = useState([]);
  const [gold, setGold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshingAi, setRefreshingAi] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [watchlist, setWatchlist] = useState([]); // Customizable Watchlist

  const navigate = useNavigate();

  const fetchAll = useCallback(async () => {
    try {
      const [m, s, v] = await Promise.all([
        marketAPI.getAllMarketData(),
        sessionAPI.getStatus(),
        aiAPI.getAllVerdicts(),
      ]);

      setInstruments(m.data.instruments || []);
      setSessions(s.data.sessions);
      setOverlaps(s.data.active_overlaps || []);

      const vm = {};
      (v.data.verdicts || []).forEach((x) => (vm[x.symbol] = x));
      setVerdicts(vm);

      try {
        const h = await marketAPI.getHistorical("XAU/USD", "7d");
        setGold(h.data.candles);
      } catch (e) { }

      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 60000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const toggleWatchlist = (symbol) => {
    setWatchlist((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );
  };

  const refreshAi = async () => {
    setRefreshingAi(true);
    try {
      const r = await aiAPI.refreshVerdicts();
      const vm = {};
      (r.data.verdicts || []).forEach((x) => (vm[x.symbol] = x));
      setVerdicts(vm);
    } catch (e) {
      console.error(e);
    }
    setRefreshingAi(false);
  };

  const openAIForSymbol = (symbol) => {
    navigate(`/signals?symbol=${encodeURIComponent(symbol)}`);
  };

  const logTrade = (symbol) => {
    navigate(`/journal?from_verdict=${encodeURIComponent(symbol)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-eli-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-eli-muted">Loading Trading Intelligence...</p>
        </div>
      </div>
    );
  }

  const forex = instruments.filter((i) => i.asset_class === "forex");
  const indices = instruments.filter((i) => i.asset_class === "indices");
  const commodities = instruments.filter(
    (i) => i.asset_class === "commodities",
  );

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Live Ticker */}
      <div className="eli-card overflow-hidden">
        <div className="flex items-stretch">
          <div className="px-4 py-2 bg-eli-gold/10 border-r border-eli-border flex items-center gap-2 shrink-0">
            <Activity className="w-4 h-4 text-eli-gold" />
            <span className="text-xs font-bold text-eli-gold uppercase tracking-wider">
              LIVE
            </span>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex animate-ticker whitespace-nowrap">
              {[...instruments, ...instruments].map((i, idx) => {
                const pos = i.change_percent >= 0;
                return (
                  <div
                    key={`${i.symbol}-${idx}`}
                    className="inline-flex items-center gap-2 px-6 py-2"
                  >
                    <span className="font-mono text-sm text-eli-text-white font-medium">
                      {i.symbol}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-eli-text-white">
                      {fmtPrice(i.price, i.asset_class)}
                    </span>
                    <span
                      className={`font-mono text-xs tabular-nums ${pos ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {pos ? "+" : ""}
                      {i.change_percent?.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AnnouncementsTicker />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl font-bold text-eli-text-white tracking-tight">
            Trading <span className="eli-gradient-text">Intelligence</span>
          </h1>
          <p className="text-eli-muted">
            Real-time AI • 8 Instruments • Last updated{" "}
            {lastUpdate?.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={refreshAi}
          disabled={refreshingAi}
          className="flex items-center gap-2 px-5 py-3 bg-eli-gold hover:bg-eli-gold-bright text-eli-navy font-bold rounded-sm disabled:opacity-50"
        >
          <Sparkles
            className={`w-4 h-4 ${refreshingAi ? "animate-spin" : ""}`}
          />
          {refreshingAi ? "Analysing..." : "Run AI Engine"}
        </button>
      </div>

      <QuickStats />
      <SignalSpotlight verdicts={verdicts} onLogTrade={logTrade} />

      {/* Customizable Watchlist */}
      <WatchlistSection
        watchlistSymbols={watchlist}
        instruments={instruments}
        verdicts={verdicts}
        onToggleWatchlist={toggleWatchlist}
        onTileClick={openAIForSymbol}
      />

      {/* Forex */}
      <section>
        <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-4">
          Forex
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forex.map((i) => (
            <InstrumentTile
              key={i.symbol}
              inst={i}
              verdict={verdicts[i.symbol]}
              onToggleWatchlist={toggleWatchlist}
              isInWatchlist={watchlist.includes(i.symbol)}
              onClick={openAIForSymbol}
            />
          ))}
        </div>
      </section>

      {/* Indices */}
      <section>
        <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-4">
          Indices
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {indices.map((i) => (
            <InstrumentTile
              key={i.symbol}
              inst={i}
              verdict={verdicts[i.symbol]}
              onToggleWatchlist={toggleWatchlist}
              isInWatchlist={watchlist.includes(i.symbol)}
              onClick={openAIForSymbol}
            />
          ))}
        </div>
      </section>

      {/* Commodities */}
      <section>
        <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-4">
          Commodities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {commodities.map((i) => (
            <InstrumentTile
              key={i.symbol}
              inst={i}
              verdict={verdicts[i.symbol]}
              onToggleWatchlist={toggleWatchlist}
              isInWatchlist={watchlist.includes(i.symbol)}
              onClick={openAIForSymbol}
            />
          ))}
        </div>
      </section>

      {/* Sessions + Gold */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SessionsCard sessions={sessions} overlaps={overlaps} />
        <div className="lg:col-span-2 eli-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-eli-text-white">
              Gold (XAU/USD) — 7 Days
            </h3>
            <Pill color="gold">XAU/USD</Pill>
          </div>
          <MiniChart candles={gold} />
        </div>
      </div>
    </div>
  );
}
