import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Activity, Sparkles, Clock, RefreshCw } from "lucide-react";
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
    gold: "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30",
    green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    red: "bg-red-500/15 text-red-400 border-red-500/30",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    navy: "bg-[#1E3A5F]/40 text-[#94A3B8] border-[#1E3A5F]",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase border rounded-sm ${map[color]}`}>
      {children}
    </span>
  );
};

const InstrumentTile = ({ inst, verdict }) => {
  const positive = inst.change_percent >= 0;
  const action = verdict?.verdict?.action;
  const actionColor =
    action === "BUY" ? "green" : action === "SELL" ? "red" : action === "HOLD" ? "amber" : "navy";

  return (
    <div
      className="eli-card eli-card-hover p-4 animate-fade-in"
      data-testid={`tile-${inst.symbol.replace(/[\\/ &]/g, "_")}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white text-sm tracking-tight">{inst.symbol}</span>
            <Pill>{inst.asset_class.toUpperCase()}</Pill>
          </div>
          <p className="text-[10px] text-[#94A3B8] mt-1 truncate max-w-[180px]">{inst.name}</p>
        </div>
        {action && <Pill color={actionColor}>{action}</Pill>}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="font-heading text-2xl font-bold text-white tabular-nums">
          {fmtPrice(inst.price, inst.asset_class)}
        </span>
        <span
          className={`text-xs font-mono tabular-nums flex items-center gap-1 ${
            positive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {positive ? "+" : ""}
          {inst.change_percent?.toFixed(2)}%
        </span>
      </div>

      {verdict && (
        <div className="mt-3 pt-3 border-t border-[#1E3A5F]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#94A3B8] tracking-wider uppercase">AI Confidence</span>
            <span className="text-[#D4AF37] font-mono font-semibold">
              {verdict.verdict?.confidence ?? "-"}%
            </span>
          </div>
          <div className="mt-1 h-1 bg-[#1E3A5F] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4C430]"
              style={{ width: `${verdict.verdict?.confidence ?? 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const SessionsCard = ({ sessions, overlaps }) => {
  const list = [
    { k: "sydney", n: "Sydney" },
    { k: "tokyo", n: "Tokyo" },
    { k: "london", n: "London" },
    { k: "new_york", n: "New York" },
  ];
  return (
    <div className="eli-card p-4" data-testid="sessions-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white">Market Sessions</h3>
        <Clock className="w-4 h-4 text-[#D4AF37]" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {list.map((s) => {
          const isOpen = sessions?.[s.k]?.status === "open";
          return (
            <div
              key={s.k}
              className={`p-2 text-center rounded-sm border ${
                isOpen
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "bg-[#1E3A5F]/30 border-[#1E3A5F] text-[#94A3B8]"
              }`}
            >
              <div className="text-[10px] font-medium">{s.n}</div>
              <div className="text-[9px] uppercase tracking-wider mt-1">{isOpen ? "Open" : "Closed"}</div>
            </div>
          );
        })}
      </div>
      {overlaps?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1E3A5F]">
          <p className="text-[10px] text-[#94A3B8] tracking-wider uppercase mb-1">Active Overlaps</p>
          {overlaps.map((o) => (
            <span key={o} className="text-xs text-[#D4AF37] font-medium">{o}</span>
          ))}
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
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} fill="url(#grd)" />
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
      } catch (e) {
        /* non-critical */
      }
      setLastUpdate(new Date());
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 60000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const refreshAi = async () => {
    setRefreshingAi(true);
    try {
      const r = await aiAPI.refreshVerdicts();
      const vm = {};
      (r.data.verdicts || []).forEach((x) => (vm[x.symbol] = x));
      setVerdicts(vm);
    } catch (e) {
      console.error("refresh ai", e);
    }
    setRefreshingAi(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#94A3B8] text-sm">Loading EliAI Trade...</p>
        </div>
      </div>
    );
  }

  const ticker = instruments;
  const forex = instruments.filter((i) => i.asset_class === "forex");
  const indices = instruments.filter((i) => i.asset_class === "indices");
  const commodities = instruments.filter((i) => i.asset_class === "commodities");

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Live ticker banner */}
      <div className="eli-card overflow-hidden">
        <div className="flex items-stretch">
          <div className="px-4 py-2 bg-[#D4AF37]/10 border-r border-[#1E3A5F] flex items-center gap-2 shrink-0">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Live</span>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex animate-ticker whitespace-nowrap">
              {[...ticker, ...ticker].map((i, idx) => {
                const pos = i.change_percent >= 0;
                return (
                  <div key={`${i.symbol}-${idx}`} className="inline-flex items-center gap-2 px-6 py-2">
                    <span className="font-mono text-sm text-white font-medium">{i.symbol}</span>
                    <span className="font-mono text-sm tabular-nums text-white">
                      {fmtPrice(i.price, i.asset_class)}
                    </span>
                    <span className={`font-mono text-xs tabular-nums ${pos ? "text-emerald-400" : "text-red-400"}`}>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white tracking-tight">
            <span className="eli-gradient-text">Trading</span> Intelligence
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            8 instruments · AI verdicts · {lastUpdate && `updated ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={refreshAi}
          disabled={refreshingAi}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] font-semibold text-sm rounded-sm transition-colors disabled:opacity-50"
          data-testid="refresh-ai-btn"
        >
          <Sparkles className={`w-4 h-4 ${refreshingAi ? "animate-spin" : ""}`} />
          {refreshingAi ? "Generating..." : "Run AI Engine"}
        </button>
      </div>

      {/* Instrument tiles by asset class */}
      <section>
        <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-3">Forex</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forex.map((i) => (
            <InstrumentTile key={i.symbol} inst={i} verdict={verdicts[i.symbol]} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-3">Indices</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {indices.map((i) => (
            <InstrumentTile key={i.symbol} inst={i} verdict={verdicts[i.symbol]} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-3">Commodities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {commodities.map((i) => (
            <InstrumentTile key={i.symbol} inst={i} verdict={verdicts[i.symbol]} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SessionsCard sessions={sessions} overlaps={overlaps} />
        <div className="eli-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Gold · 7-day</h3>
            <Pill color="gold">XAU/USD</Pill>
          </div>
          <MiniChart candles={gold} />
        </div>
      </div>
    </div>
  );
}
