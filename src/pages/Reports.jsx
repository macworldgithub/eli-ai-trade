import { useEffect, useState, useMemo } from "react";
import { BarChart3, Download, RefreshCw, ArrowUp, ArrowDown, Search } from "lucide-react";
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

const Stat = ({ label, value, color = "white" }) => (
  <div className="eli-card p-3">
    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">{label}</p>
    <p className={`font-heading text-2xl font-bold mt-1 ${color}`}>{value}</p>
  </div>
);

export default function Reports() {
  const [curve, setCurve] = useState([]);
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (!trades.length) return;
    const headers = [
      "id","instrument","direction","session","entry_model","entry_zone",
      "entry_price","exit_price","stop_loss","take_profit","position_size",
      "profit_loss","status","created_at","closed_at","notes",
    ];
    const rows = trades.map((t) => headers.map((h) => {
      const v = t[h] ?? "";
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

  // Performance by instrument
  const byInstrument = {};
  trades.forEach((t) => {
    const k = t.instrument;
    if (!byInstrument[k]) byInstrument[k] = { instrument: k, trades: 0, wins: 0, pnl: 0 };
    byInstrument[k].trades += 1;
    if ((t.profit_loss || 0) > 0) byInstrument[k].wins += 1;
    byInstrument[k].pnl += t.profit_loss || 0;
  });
  const instPerf = Object.values(byInstrument).sort((a, b) => b.pnl - a.pnl);

  // AI coach score trend
  const coachTrend = trades
    .filter((t) => t.ai_coach?.overall_score != null && t.closed_at)
    .sort((a, b) => String(a.closed_at).localeCompare(String(b.closed_at)))
    .map((t, idx) => ({ idx: idx + 1, score: t.ai_coach.overall_score, instrument: t.instrument }));

  const chartData = curve.map((c, idx) => ({ idx: idx + 1, cumulative: c.cumulative, instrument: c.instrument }));

  // ---------- Sortable / searchable trade log ----------
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [allTrades, setAllTrades] = useState([]);

  const sortedFiltered = useMemo(() => {
    let rows = allTrades;
    if (statusFilter !== "ALL") rows = rows.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((t) =>
        [t.instrument, t.direction, t.session, t.entry_model, t.entry_zone, t.notes]
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
        data-testid={`sort-${k}`}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
        </span>
      </th>
    );
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[#D4AF37]" />
            <h1 className="font-heading text-3xl font-bold text-white">Reports</h1>
          </div>
          <p className="text-sm text-[#94A3B8] mt-1">Equity curve, performance by instrument, and AI coach trend.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-[#1E3A5F] text-white text-sm rounded-sm hover:bg-[#14274A] disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={!trades.length} className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] font-bold text-sm rounded-sm disabled:opacity-50" data-testid="export-csv-btn">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Closed Trades" value={stats.closed_trades} />
          <Stat label="Win Rate" value={`${stats.win_rate}%`} color={stats.win_rate >= 50 ? "text-emerald-400" : "text-amber-400"} />
          <Stat label="Net P/L" value={`${stats.total_profit_loss >= 0 ? "+" : ""}$${stats.total_profit_loss}`} color={stats.total_profit_loss >= 0 ? "text-emerald-400" : "text-red-400"} />
          <Stat label="Avg Loss" value={`$${stats.average_loss}`} color="text-red-400" />
        </div>
      )}

      <div className="eli-card p-5">
        <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-3">Equity Curve</h2>
        <div className="h-72">
          {chartData.length < 2 ? (
            <div className="h-full flex items-center justify-center text-[#94A3B8] text-sm">
              Close at least 2 trades to see your equity curve.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" />
                <XAxis dataKey="idx" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#0E1F36", border: "1px solid #1E3A5F" }}
                  labelStyle={{ color: "#94A3B8" }}
                />
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="cumulative" stroke="#D4AF37" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="eli-card p-5">
          <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-3">Performance by Instrument</h2>
          {instPerf.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No closed trades yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[#94A3B8] border-b border-[#1E3A5F]">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-right">Trades</th>
                  <th className="text-right">Win %</th>
                  <th className="text-right">P/L</th>
                </tr>
              </thead>
              <tbody>
                {instPerf.map((p) => (
                  <tr key={p.instrument} className="border-b border-[#1E3A5F]/50 hover:bg-[#1E3A5F]/20">
                    <td className="py-2 font-mono text-white">{p.instrument}</td>
                    <td className="text-right text-[#94A3B8]">{p.trades}</td>
                    <td className="text-right font-mono text-[#D4AF37]">{((p.wins/p.trades)*100).toFixed(0)}%</td>
                    <td className={`text-right font-mono ${p.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="eli-card p-5">
          <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-3">AI Coach Score Trend</h2>
          {coachTrend.length < 2 ? (
            <p className="text-sm text-[#94A3B8]">Score at least 2 trades to see your coach trend.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coachTrend}>
                  <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" />
                  <XAxis dataKey="idx" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#0E1F36", border: "1px solid #1E3A5F" }}
                    labelStyle={{ color: "#94A3B8" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#D4AF37" strokeWidth={2} dot={{ fill: "#D4AF37", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Sortable / searchable trade log */}
      <div className="eli-card p-5" data-testid="trade-log-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase">Trade Log</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search instrument, model, notes..."
                className="pl-7 pr-2 py-1.5 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white text-xs w-64 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                data-testid="log-search"
              />
            </div>
            <div className="flex gap-1">
              {["ALL", "OPEN", "CLOSED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm border ${
                    statusFilter === f
                      ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]"
                      : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F]"
                  }`}
                  data-testid={`log-filter-${f}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sortedFiltered.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-8">No trades match your filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="trade-log-table">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[#94A3B8] border-b border-[#1E3A5F]">
                  <SortHeader k="created_at" label="Date" />
                  <SortHeader k="instrument" label="Symbol" />
                  <SortHeader k="direction" label="Dir" />
                  <SortHeader k="session" label="Session" />
                  <SortHeader k="entry_model" label="Model" />
                  <SortHeader k="entry_price" label="Entry" align="right" />
                  <SortHeader k="exit_price" label="Exit" align="right" />
                  <SortHeader k="profit_loss" label="P/L" align="right" />
                  <SortHeader k="status" label="Status" />
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map((t) => {
                  const dec = t.instrument?.includes("/") && t.instrument !== "XAU/USD" ? 5 : 2;
                  const pnl = t.profit_loss;
                  return (
                    <tr key={t.id} className="border-b border-[#1E3A5F]/50 hover:bg-[#1E3A5F]/20 transition-colors" data-testid={`log-row-${t.id}`}>
                      <td className="py-2 text-[#94A3B8] font-mono text-xs whitespace-nowrap">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="font-mono font-semibold text-white">{t.instrument}</td>
                      <td className={`font-bold ${t.direction === "LONG" ? "text-emerald-400" : "text-red-400"}`}>{t.direction}</td>
                      <td className="text-[#94A3B8] text-xs">{t.session}</td>
                      <td className="text-[#D4AF37] text-xs truncate max-w-[180px]">{t.entry_model}</td>
                      <td className="text-right font-mono text-white tabular-nums">{t.entry_price?.toFixed(dec)}</td>
                      <td className="text-right font-mono text-white tabular-nums">{t.exit_price ? t.exit_price.toFixed(dec) : "—"}</td>
                      <td className={`text-right font-mono font-semibold tabular-nums ${pnl == null ? "text-[#94A3B8]" : pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-sm ${
                          t.status === "OPEN"
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/40"
                            : pnl > 0
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                            : "bg-red-500/15 text-red-400 border-red-500/40"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-[#94A3B8] mt-3">
              Showing {sortedFiltered.length} of {allTrades.length} trade{allTrades.length === 1 ? "" : "s"} · Click any column header to sort
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
