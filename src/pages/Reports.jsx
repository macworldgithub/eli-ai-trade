import { useEffect, useState, useMemo } from "react";
import { BarChart3, Download, RefreshCw, ArrowUp, ArrowDown, Search, Link as LinkIcon, Tag } from "lucide-react";
import { reportsAPI, tradeAPI } from "../lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const Stat = ({ label, value, color = "white", subtext }) => (
  <div className="eli-card p-4">
    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">{label}</p>
    <p className={`font-heading text-2xl sm:text-3xl font-bold mt-1 ${color}`}>{value}</p>
    {subtext && <p className="text-[10px] text-[#94A3B8] mt-1">{subtext}</p>}
  </div>
);

const PerfTable = ({ data, title, primaryColLabel = "Segment" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="eli-card p-5">
        <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-3">{title}</h2>
        <p className="text-sm text-[#94A3B8]">No data available.</p>
      </div>
    );
  }
  
  return (
    <div className="eli-card p-5">
      <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-3">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[#94A3B8] border-b border-[#1E3A5F]">
              <th className="text-left py-2">{primaryColLabel}</th>
              <th className="text-right">Trades</th>
              <th className="text-right">Win %</th>
              <th className="text-right">Net P/L</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, idx) => (
              <tr key={idx} className="border-b border-[#1E3A5F]/50 hover:bg-[#1E3A5F]/20">
                <td className="py-2 font-mono text-white whitespace-nowrap">{p.segment}</td>
                <td className="text-right text-[#94A3B8] tabular-nums">{p.trades}</td>
                <td className="text-right font-mono text-[#D4AF37] tabular-nums">
                  {p.trades > 0 ? ((p.wins / p.trades) * 100).toFixed(0) : 0}%
                </td>
                <td className={`text-right font-mono tabular-nums ${p.pnl > 0 ? "text-emerald-400" : p.pnl < 0 ? "text-red-400" : "text-white"}`}>
                  {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function Reports() {
  const [curve, setCurve] = useState([]);
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------- Sortable / searchable trade log ----------
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [allTrades, setAllTrades] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, t] = await Promise.all([
        reportsAPI.equityCurve(),
        tradeAPI.getTradeStats(),
        tradeAPI.getTrades(),
      ]);
      setCurve(c.data.curve || []);
      setStats(s.data);
      setAllTrades(t.data || []);
      setTrades((t.data || []).filter((x) => x.status === "CLOSED"));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!allTrades.length) return;
    const headers = [
      "id","instrument","direction","session","entry_model","entry_zone",
      "entry_price","exit_price","stop_loss","take_profit","position_size",
      "profit_loss","status","created_at","closed_at","strategy_tags", "chart_url", "notes",
    ];
    const rows = allTrades.map((t) => headers.map((h) => {
      let v = t[h] ?? "";
      if (h === "strategy_tags" && Array.isArray(v)) {
        v = v.join(";");
      }
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eliai-trades-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Aggregation Helpers
  const aggregatePerf = (dataList, keyFn, segmentNameFn) => {
    const acc = {};
    dataList.forEach((t) => {
      const k = keyFn(t);
      if (!k) return;
      if (!acc[k]) acc[k] = { segment: segmentNameFn ? segmentNameFn(k) : k, trades: 0, wins: 0, pnl: 0 };
      acc[k].trades += 1;
      if ((t.profit_loss || 0) > 0) acc[k].wins += 1;
      acc[k].pnl += t.profit_loss || 0;
    });
    return Object.values(acc).sort((a, b) => b.pnl - a.pnl);
  };

  // Tax Summaries
  const taxSummary = useMemo(() => {
    let grossProfit = 0;
    let grossLoss = 0;
    let totalVolume = 0;
    
    trades.forEach(t => {
      const pnl = t.profit_loss || 0;
      if (pnl > 0) grossProfit += pnl;
      if (pnl < 0) grossLoss += pnl;
      totalVolume += Number(t.position_size) || 0;
    });

    return {
      grossProfit,
      grossLoss,
      net: grossProfit + grossLoss,
      totalVolume,
    };
  }, [trades]);

  // Performance Data
  const instPerf = aggregatePerf(trades, t => t.instrument);
  const sessionPerf = aggregatePerf(trades, t => t.session);
  const directionPerf = aggregatePerf(trades, t => t.direction);
  
  // Strategy Comparison
  const strategyPerf = useMemo(() => {
    const acc = {};
    trades.forEach(t => {
      const tags = (t.strategy_tags && t.strategy_tags.length > 0) ? t.strategy_tags : ["Untagged"];
      tags.forEach(tag => {
        if (!acc[tag]) acc[tag] = { segment: tag, trades: 0, wins: 0, pnl: 0 };
        acc[tag].trades += 1;
        if ((t.profit_loss || 0) > 0) acc[tag].wins += 1;
        acc[tag].pnl += t.profit_loss || 0;
      });
    });
    return Object.values(acc).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  // AI coach score trend
  const coachTrend = trades
    .filter((t) => t.ai_coach?.overall_score != null && t.closed_at)
    .sort((a, b) => String(a.closed_at).localeCompare(String(b.closed_at)))
    .map((t, idx) => ({ idx: idx + 1, score: t.ai_coach.overall_score, instrument: t.instrument }));

  const chartData = curve.map((c, idx) => ({ idx: idx + 1, cumulative: c.cumulative, instrument: c.instrument }));

  const sortedFiltered = useMemo(() => {
    let rows = allTrades;
    if (statusFilter !== "ALL") rows = rows.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((t) =>
        [
          t.instrument, 
          t.direction, 
          t.session, 
          t.entry_model, 
          t.entry_zone, 
          t.notes,
          ...(t.strategy_tags || [])
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [allTrades, sortKey, sortDir, search, statusFilter]);

  const SortHeader = ({ k, label, align = "left" }) => {
    const active = sortKey === k;
    return (
      <th
        onClick={() => {
          if (active) setSortDir(sortDir === "asc" ? "desc" : "asc");
          else {
            setSortKey(k);
            setSortDir("desc");
          }
        }}
        className={`text-${align} py-2 cursor-pointer select-none hover:text-[#D4AF37] transition-colors`}
      >
        <span className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end w-full" : ""}`}>
          {label}
          {active && (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
        </span>
      </th>
    );
  };

  return (
    <div className="space-y-8" data-testid="reports-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="font-heading text-4xl font-bold text-white">Reports</h1>
          </div>
          <p className="text-[#94A3B8] mt-2">
            Performance attribution, strategy comparisons, and tax summaries.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F]/50 text-white border border-[#1E3A5F] rounded-sm hover:bg-[#1E3A5F] transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={!allTrades.length} className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] font-bold rounded-sm disabled:opacity-50 shadow-lg shadow-[#D4AF37]/20 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tax Summary Row */}
      <div>
        <h2 className="text-lg font-bold text-[#D4AF37] tracking-wider uppercase mb-4">Tax & Volume Summary</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Gross Profit" value={`+$${taxSummary.grossProfit.toFixed(2)}`} color="text-emerald-400" subtext="Sum of winning trades" />
          <Stat label="Gross Loss" value={`-$${Math.abs(taxSummary.grossLoss).toFixed(2)}`} color="text-red-400" subtext="Sum of losing trades" />
          <Stat label="Net Profit" value={`${taxSummary.net >= 0 ? "+" : ""}$${taxSummary.net.toFixed(2)}`} color={taxSummary.net >= 0 ? "text-emerald-400" : "text-red-400"} subtext="Total Realized P/L" />
          <Stat label="Total Volume" value={taxSummary.totalVolume.toFixed(2)} subtext="Total lots/position size traded" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="eli-card p-6">
          <h2 className="text-sm font-bold text-[#D4AF37] tracking-wider uppercase mb-4">Equity Curve</h2>
          <div className="h-[300px]">
            {chartData.length < 2 ? (
              <div className="h-full flex items-center justify-center text-[#94A3B8] text-sm">
                Close at least 2 trades to see your equity curve.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="idx" tick={{ fill: "#94A3B8", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#1E3A5F" }} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#1E3A5F" }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{ background: "#0A1628", border: "1px solid #1E3A5F", borderRadius: "2px" }}
                    itemStyle={{ color: "#D4AF37", fontWeight: "bold" }}
                    labelStyle={{ color: "#94A3B8", marginBottom: "4px" }}
                    formatter={(value, name, props) => [`$${value.toFixed(2)}`, props.payload.instrument]}
                  />
                  <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                  <Line type="stepAfter" dataKey="cumulative" stroke="#D4AF37" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#D4AF37" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="eli-card p-6">
          <h2 className="text-sm font-bold text-[#D4AF37] tracking-wider uppercase mb-4">AI Coach Score Trend</h2>
          {coachTrend.length < 2 ? (
            <div className="h-[300px] flex items-center justify-center text-[#94A3B8] text-sm">
              Score at least 2 trades to see your coach trend.
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coachTrend}>
                  <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="idx" tick={{ fill: "#94A3B8", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#1E3A5F" }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#1E3A5F" }} />
                  <Tooltip
                    contentStyle={{ background: "#0A1628", border: "1px solid #1E3A5F", borderRadius: "2px" }}
                    itemStyle={{ color: "#D4AF37", fontWeight: "bold" }}
                    labelStyle={{ color: "#94A3B8", marginBottom: "4px" }}
                    formatter={(value, name, props) => [`${value}/10`, props.payload.instrument]}
                  />
                  <Line type="monotone" dataKey="score" stroke="#D4AF37" strokeWidth={3} dot={{ fill: "#D4AF37", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Performance Attribution Tables */}
      <div>
        <h2 className="text-lg font-bold text-[#D4AF37] tracking-wider uppercase mb-4">Performance Attribution & Strategy Comparisons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <PerfTable data={directionPerf} title="By Direction" primaryColLabel="Direction" />
          <PerfTable data={sessionPerf} title="By Session" primaryColLabel="Session" />
          <PerfTable data={instPerf} title="By Instrument" primaryColLabel="Symbol" />
          <PerfTable data={strategyPerf} title="By Strategy Tag" primaryColLabel="Tag" />
        </div>
      </div>

      {/* Sortable / searchable trade log */}
      <div className="eli-card p-6 border-[#D4AF37]/30" data-testid="trade-log-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-sm font-bold text-[#D4AF37] tracking-wider uppercase">Master Trade Log</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbol, tags, notes..."
                className="pl-9 pr-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all"
              />
            </div>
            <div className="flex gap-1.5 p-1 bg-[#1E3A5F]/30 rounded-sm border border-[#1E3A5F]">
              {["ALL", "OPEN", "CLOSED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                    statusFilter === f
                      ? "bg-[#D4AF37] text-[#0A1628] shadow-sm"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sortedFiltered.length === 0 ? (
          <div className="text-center py-16 bg-[#0A1628] rounded-sm border border-[#1E3A5F]">
            <p className="text-[#94A3B8]">No trades match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[#94A3B8] border-b border-[#1E3A5F]">
                  <SortHeader k="created_at" label="Date" />
                  <SortHeader k="instrument" label="Symbol" />
                  <SortHeader k="direction" label="Dir" />
                  <SortHeader k="session" label="Session" />
                  <SortHeader k="entry_price" label="Entry" align="right" />
                  <SortHeader k="exit_price" label="Exit" align="right" />
                  <SortHeader k="profit_loss" label="P/L" align="right" />
                  <SortHeader k="status" label="Status" />
                  <th className="text-left py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map((t) => {
                  const dec = t.instrument?.includes("/") && t.instrument !== "XAU/USD" ? 5 : 2;
                  const pnl = t.profit_loss;
                  return (
                    <tr key={t.id} className="border-b border-[#1E3A5F]/50 hover:bg-[#1E3A5F]/20 transition-colors">
                      <td className="py-3 text-[#94A3B8] font-mono text-xs whitespace-nowrap">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="font-mono font-bold text-white">{t.instrument}</td>
                      <td className={`font-bold text-xs ${t.direction === "LONG" ? "text-emerald-400" : "text-red-400"}`}>{t.direction}</td>
                      <td className="text-[#94A3B8] text-xs">{t.session}</td>
                      <td className="text-right font-mono text-white tabular-nums">{t.entry_price?.toFixed(dec)}</td>
                      <td className="text-right font-mono text-white tabular-nums">{t.exit_price ? t.exit_price.toFixed(dec) : "—"}</td>
                      <td className={`text-right font-mono font-bold tabular-nums ${pnl == null ? "text-[#94A3B8]" : pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`}
                      </td>
                      <td className="pl-4">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold border rounded-sm ${
                          t.status === "OPEN"
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/40"
                            : pnl > 0
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                            : "bg-red-500/15 text-red-400 border-red-500/40"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="text-xs">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-[120px]">
                          {t.strategy_tags && t.strategy_tags.map(tag => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-[#1E3A5F]/50 text-[#CBD5E1] rounded-sm border border-[#1E3A5F] truncate max-w-[80px]" title={tag}>
                              {tag}
                            </span>
                          ))}
                          {t.chart_url && (
                            <a href={t.chart_url} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:text-white" title="View Chart">
                              <LinkIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="bg-[#0A1628] p-3 border-t border-[#1E3A5F]">
              <p className="text-[10px] text-[#94A3B8] flex justify-between">
                <span>Showing {sortedFiltered.length} of {allTrades.length} trades</span>
                <span>Click column headers to sort</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
