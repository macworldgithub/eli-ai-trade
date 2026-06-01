import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import { tradeAPI, aiAPI, marketAPI } from "../lib/api";
import { toast } from "sonner";

const SESSIONS = ["ASIA", "LONDON", "NEW_YORK", "OVERLAP"];
const DIRECTIONS = ["LONG", "SHORT"];
const DEFAULT_MODELS = [
  "FVG + Liquidity Sweep",
  "Order Block Retest",
  "Breaker Block",
  "CISD Confirmation",
  "Asian Range Sweep",
  "SMT Divergence",
];

const decimalsFor = (sym) =>
  sym?.includes("/") && sym !== "XAU/USD" ? 5 : 2;

const detectSession = () => {
  const h = new Date().getUTCHours();
  if (h >= 13 && h < 17) return "OVERLAP";
  if (h >= 8 && h < 13) return "LONDON";
  if (h >= 13 && h < 22) return "NEW_YORK";
  return "ASIA";
};

// ============== Stat card ==============
const Stat = ({ label, value, color = "text-white" }) => (
  <div className="eli-card p-3">
    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">{label}</p>
    <p className={`font-heading text-2xl font-bold mt-1 ${color}`}>{value}</p>
  </div>
);

const ScorePill = ({ label, score }) => {
  const pct = (score / 10) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-[#94A3B8] uppercase tracking-wider">{label}</span>
        <span className="text-[#D4AF37] font-mono font-bold">{score}/10</span>
      </div>
      <div className="h-1 bg-[#1E3A5F] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4C430]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const CoachBlock = ({ coach }) => {
  if (!coach) return null;
  const s = coach.scores || {};
  return (
    <div className="mt-3 p-3 bg-[#0A1628] border border-[#D4AF37]/30 rounded-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
        <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
          AI Coach Feedback
        </h4>
        <span className="ml-auto text-xs font-mono text-white">
          Overall: <span className="text-[#D4AF37] font-bold">{coach.overall_score}/10</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <ScorePill label="Setup Quality" score={s.setup_quality ?? 0} />
        <ScorePill label="Entry Execution" score={s.entry_execution ?? 0} />
        <ScorePill label="Risk Management" score={s.risk_management ?? 0} />
        <ScorePill label="Patience / Discipline" score={s.patience_discipline ?? 0} />
      </div>
      <div className="space-y-2 text-xs">
        <div>
          <span className="text-emerald-400 font-semibold">✓ What you did well: </span>
          <span className="text-[#CBD5E1]">{coach.what_you_did_well}</span>
        </div>
        <div>
          <span className="text-amber-400 font-semibold">⚠ Areas to improve: </span>
          <span className="text-[#CBD5E1]">{coach.areas_to_improve}</span>
        </div>
        <div>
          <span className="text-[#D4AF37] font-semibold">★ Key lesson: </span>
          <span className="text-[#CBD5E1]">{coach.key_lesson}</span>
        </div>
      </div>
    </div>
  );
};

// ============== Inline Log Form (replaces modal) ==============
const LogTradeForm = ({ instruments, verdicts, prefill, onCreated, onClearPrefill }) => {
  const blank = () => {
    const inst = "EUR/USD";
    const live = instruments.find((i) => i.symbol === inst)?.price;
    const dec = decimalsFor(inst);
    const entry = live ?? "";
    return {
      instrument: inst,
      direction: "LONG",
      session: detectSession(),
      entry_model: DEFAULT_MODELS[0],
      entry_zone: "",
      entry_price: entry ? Number(entry).toFixed(dec) : "",
      stop_loss: entry ? (entry * 0.995).toFixed(dec) : "",
      take_profit: entry ? (entry * 1.01).toFixed(dec) : "",
      position_size: 1,
      risk_amount: "",
      notes: "",
    };
  };

  const [f, setF] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Re-init when instruments first load
  useEffect(() => {
    if (instruments.length > 0 && !f.entry_price) {
      setF(blank());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruments.length]);

  // Apply prefill from AI verdict (URL param)
  useEffect(() => {
    if (!prefill) return;
    const dec = decimalsFor(prefill.instrument);
    const live = instruments.find((i) => i.symbol === prefill.instrument)?.price;
    const dir = prefill.direction || "LONG";
    const entry = prefill.entry_price ?? live ?? 0;
    const sl = prefill.stop_loss ?? (dir === "LONG" ? entry * 0.995 : entry * 1.005);
    const tp = prefill.take_profit ?? (dir === "LONG" ? entry * 1.01 : entry * 0.99);
    setF({
      ...blank(),
      instrument: prefill.instrument,
      direction: dir,
      entry_model: prefill.entry_model || DEFAULT_MODELS[0],
      entry_zone: prefill.entry_zone || "",
      entry_price: entry ? Number(entry).toFixed(dec) : "",
      stop_loss: sl ? Number(sl).toFixed(dec) : "",
      take_profit: tp ? Number(tp).toFixed(dec) : "",
      notes: prefill.notes || "",
    });
    setDetailsOpen(true);
    // Scroll to form
    setTimeout(() => {
      document.querySelector('[data-testid="log-trade-form"]')?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
    onClearPrefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const decimals = decimalsFor(f.instrument);
  const liveOf = (sym) => instruments.find((i) => i.symbol === sym)?.price;
  const live = liveOf(f.instrument);

  const handleInst = (sym) => {
    const dec = decimalsFor(sym);
    const px = liveOf(sym);
    const entry = px ?? f.entry_price;
    const dir = f.direction;
    const sl = entry ? (dir === "LONG" ? entry * 0.995 : entry * 1.005) : f.stop_loss;
    const tp = entry ? (dir === "LONG" ? entry * 1.01 : entry * 0.99) : f.take_profit;
    setF({
      ...f,
      instrument: sym,
      entry_price: entry ? Number(entry).toFixed(dec) : "",
      stop_loss: sl ? Number(sl).toFixed(dec) : "",
      take_profit: tp ? Number(tp).toFixed(dec) : "",
    });
  };

  const handleDir = (dir) => {
    const entry = parseFloat(f.entry_price);
    if (!Number.isFinite(entry)) {
      setF({ ...f, direction: dir });
      return;
    }
    const sl = dir === "LONG" ? entry * 0.995 : entry * 1.005;
    const tp = dir === "LONG" ? entry * 1.01 : entry * 0.99;
    setF({
      ...f,
      direction: dir,
      stop_loss: sl.toFixed(decimals),
      take_profit: tp.toFixed(decimals),
    });
  };

  const snap = () => {
    if (live == null) return;
    setF({ ...f, entry_price: Number(live).toFixed(decimals) });
    toast.success(`Entry → ${Number(live).toFixed(decimals)}`);
  };

  const applyVerdict = (v) => {
    if (!v?.verdict) return;
    const ver = v.verdict;
    const dec = decimalsFor(v.symbol);
    const dir = ver.action === "SELL" ? "SHORT" : "LONG";
    const px = liveOf(v.symbol);
    const entry = ver.key_levels?.entry ?? px ?? v.price_at_verdict;
    const sl = ver.key_levels?.stop_loss ?? (dir === "LONG" ? entry * 0.995 : entry * 1.005);
    const tp = ver.key_levels?.take_profit ?? (dir === "LONG" ? entry * 1.01 : entry * 0.99);
    setF({
      ...f,
      instrument: v.symbol,
      direction: dir,
      entry_model: `AI: ${ver.bias || ver.action}`,
      entry_zone: ver.reasoning ? ver.reasoning.slice(0, 80) : "",
      entry_price: entry ? Number(entry).toFixed(dec) : "",
      stop_loss: sl ? Number(sl).toFixed(dec) : "",
      take_profit: tp ? Number(tp).toFixed(dec) : "",
      notes: `AI verdict (${ver.action} · ${ver.confidence}%): ${ver.reasoning || ""}`.trim(),
    });
    setDetailsOpen(true);
    toast.success(`Filled from ${ver.action} ${v.symbol}`);
  };

  // Live RR
  const e = parseFloat(f.entry_price);
  const sl = parseFloat(f.stop_loss);
  const tp = parseFloat(f.take_profit);
  const rr = (() => {
    if (![e, sl, tp].every(Number.isFinite)) return null;
    const risk = Math.abs(e - sl);
    const reward = Math.abs(tp - e);
    if (risk === 0) return null;
    return {
      risk,
      reward,
      ratio: reward / risk,
      pipMult: f.instrument === "USD/JPY" ? 100 : decimals === 5 ? 10000 : 1,
    };
  })();

  const canSave =
    !saving &&
    Number.isFinite(e) &&
    Number.isFinite(sl) &&
    sl !== e;

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        instrument: f.instrument,
        direction: f.direction,
        session: f.session,
        entry_model: f.entry_model,
        entry_zone: f.entry_zone || null,
        entry_price: e,
        stop_loss: sl,
        take_profit: Number.isFinite(tp) ? tp : f.direction === "LONG" ? e * 1.01 : e * 0.99,
        position_size: Number(f.position_size) || 1,
        risk_amount: f.risk_amount ? Number(f.risk_amount) : null,
        notes: f.notes || null,
      };
      const resp = await tradeAPI.createTrade(payload);
      toast.success(`${f.direction} ${f.instrument} logged`, {
        description: `Entry ${e} · SL ${sl}${rr ? ` · 1:${rr.ratio.toFixed(2)} RR` : ""}`,
      });
      onCreated(resp?.data);
      // Reset form to a fresh blank state (with new live prices)
      setF(blank());
      setDetailsOpen(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to log trade");
    }
    setSaving(false);
  };

  const buyVerdicts = (verdicts || []).filter((v) => ["BUY", "SELL"].includes(v?.verdict?.action));

  return (
    <div className="eli-card border-[#D4AF37]/40" data-testid="log-trade-form">
      <div className="px-5 py-3 border-b border-[#1E3A5F] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Log New Trade</h2>
        </div>
        {live != null && (
          <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] font-mono">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            {f.instrument} <span className="text-emerald-400">{Number(live).toFixed(decimals)}</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* AI verdict quick-fill */}
        {buyVerdicts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap" data-testid="verdict-chips">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Setups
            </span>
            {buyVerdicts.map((v) => (
              <button
                key={v.symbol}
                onClick={() => applyVerdict(v)}
                className={`px-2 py-1 text-[10px] font-bold rounded-sm border ${
                  v.verdict.action === "BUY"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/40 hover:bg-red-500/20"
                }`}
                data-testid={`verdict-chip-${v.symbol.replace(/[\\/ &]/g, "_")}`}
              >
                {v.verdict.action} {v.symbol}
              </button>
            ))}
          </div>
        )}

        {/* Row 1: Instrument · Direction · Entry */}
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1.5fr] gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Instrument</label>
            <select
              value={f.instrument}
              onChange={(ev) => handleInst(ev.target.value)}
              className="w-full px-3 py-2.5 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              data-testid="form-instrument"
            >
              {instruments.map((i) => (
                <option key={i.symbol} value={i.symbol}>{i.symbol}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Direction</label>
            <div className="grid grid-cols-2 gap-1">
              {DIRECTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDir(d)}
                  className={`px-3 py-2.5 text-xs font-bold rounded-sm border transition-colors ${
                    f.direction === d
                      ? d === "LONG"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                        : "bg-red-500/20 text-red-400 border-red-500/50"
                      : "bg-[#1E3A5F]/40 text-[#94A3B8] border-[#1E3A5F]"
                  }`}
                  data-testid={`form-dir-${d}`}
                >
                  {d === "LONG" ? <TrendingUp className="inline w-3 h-3 mr-1" /> : <TrendingDown className="inline w-3 h-3 mr-1" />}
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Entry Price</label>
            <div className="flex gap-1">
              <input
                type="number"
                step="any"
                value={f.entry_price}
                onChange={(ev) => setF({ ...f, entry_price: ev.target.value })}
                placeholder="0.00000"
                className="flex-1 px-3 py-2.5 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                data-testid="form-entry"
              />
              <button
                type="button"
                onClick={snap}
                disabled={live == null}
                title="Snap to live price"
                className="px-2.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded-sm border border-[#D4AF37]/40 disabled:opacity-30"
                data-testid="form-snap"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: SL · TP · RR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-red-400 mb-1">Stop Loss</label>
            <input
              type="number"
              step="any"
              value={f.stop_loss}
              onChange={(ev) => setF({ ...f, stop_loss: ev.target.value })}
              placeholder="0.00000"
              className="w-full px-3 py-2.5 bg-[#1E3A5F]/40 border border-red-500/30 rounded-sm text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              data-testid="form-sl"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Take Profit</label>
            <input
              type="number"
              step="any"
              value={f.take_profit}
              onChange={(ev) => setF({ ...f, take_profit: ev.target.value })}
              placeholder="0.00000"
              className="w-full px-3 py-2.5 bg-[#1E3A5F]/40 border border-emerald-500/30 rounded-sm text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              data-testid="form-tp"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-[10px] uppercase tracking-wider text-[#D4AF37] mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" /> Risk : Reward
            </label>
            <div className="flex-1 bg-[#0A1628] border border-[#D4AF37]/30 rounded-sm px-3 py-2 flex items-center justify-between" data-testid="form-rr">
              {rr ? (
                <>
                  <div className="text-xs">
                    <span className="text-red-400 font-mono">
                      {decimals === 5 ? `${(rr.risk * rr.pipMult).toFixed(0)}p` : rr.risk.toFixed(decimals)}
                    </span>
                    <span className="text-[#94A3B8] mx-1">→</span>
                    <span className="text-emerald-400 font-mono">
                      {decimals === 5 ? `${(rr.reward * rr.pipMult).toFixed(0)}p` : rr.reward.toFixed(decimals)}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      rr.ratio >= 2 ? "text-emerald-400" : rr.ratio >= 1 ? "text-amber-400" : "text-red-400"
                    }`}
                  >
                    1:{rr.ratio.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[#94A3B8]">Fill entry + SL + TP</span>
              )}
            </div>
          </div>
        </div>

        {/* Details collapser */}
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#F4C430] font-semibold"
          data-testid="form-details-toggle"
        >
          {detailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {detailsOpen ? "Hide" : "Show"} session, model, notes
        </button>

        {detailsOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#1E3A5F]" data-testid="form-details">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Session</label>
              <select
                value={f.session}
                onChange={(ev) => setF({ ...f, session: ev.target.value })}
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white text-sm"
                data-testid="form-session"
              >
                {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Entry Model</label>
              <select
                value={f.entry_model}
                onChange={(ev) => setF({ ...f, entry_model: ev.target.value })}
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white text-sm"
                data-testid="form-model"
              >
                {DEFAULT_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                {!DEFAULT_MODELS.includes(f.entry_model) && (
                  <option value={f.entry_model}>{f.entry_model}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Position Size</label>
              <input
                type="number"
                step="any"
                value={f.position_size}
                onChange={(ev) => setF({ ...f, position_size: ev.target.value })}
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono text-sm"
                data-testid="form-size"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Risk Amount ($)</label>
              <input
                type="number"
                step="any"
                value={f.risk_amount}
                onChange={(ev) => setF({ ...f, risk_amount: ev.target.value })}
                placeholder="optional"
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono text-sm"
                data-testid="form-risk"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Entry Zone (POI / Timeframe)</label>
              <input
                type="text"
                value={f.entry_zone}
                onChange={(ev) => setF({ ...f, entry_zone: ev.target.value })}
                placeholder="e.g. Premium OB on H1"
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white text-sm"
                data-testid="form-zone"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Notes</label>
              <textarea
                value={f.notes}
                onChange={(ev) => setF({ ...f, notes: ev.target.value })}
                rows={3}
                placeholder="Reason for entry, market context, mental state..."
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white text-sm"
                data-testid="form-notes"
              />
            </div>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSave}
          className="w-full px-6 py-3 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] font-bold text-sm rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="form-save"
        >
          {saving
            ? "Logging..."
            : !Number.isFinite(e)
            ? "Enter price to log trade"
            : !Number.isFinite(sl)
            ? "Enter stop loss to log trade"
            : sl === e
            ? "Stop loss can't equal entry"
            : `Log ${f.direction} ${f.instrument}`}
        </button>
      </div>
    </div>
  );
};

// ============== Trade row ==============
const TradeRow = ({ trade, onClose, onScore, scoringId, highlight }) => {
  const [showClose, setShowClose] = useState(false);
  const [exitPrice, setExit] = useState("");
  const pnl = trade.profit_loss;
  const isOpen = trade.status === "OPEN";
  const dec = decimalsFor(trade.instrument);

  const handleClose = async () => {
    if (!exitPrice) return;
    await onClose(trade.id, Number(exitPrice));
    setShowClose(false);
  };

  return (
    <div
      className={`eli-card p-4 transition-all duration-500 ${
        highlight ? "border-[#D4AF37] shadow-[0_0_0_2px_rgba(212,175,55,0.3)] bg-[#D4AF37]/5" : ""
      }`}
      data-testid={`trade-${trade.id}`}
    >
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm tracking-wider ${
              trade.direction === "LONG"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                : "bg-red-500/15 text-red-400 border-red-500/40"
            }`}
          >
            {trade.direction === "LONG" ? (
              <TrendingUp className="inline w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="inline w-3 h-3 mr-1" />
            )}
            {trade.direction}
          </span>
          <span className="font-mono font-bold text-white">{trade.instrument}</span>
          <span className="text-xs text-[#94A3B8]">{trade.session}</span>
          <span className="text-xs text-[#D4AF37]">{trade.entry_model}</span>
        </div>
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded-sm ${
            isOpen
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/40"
              : pnl > 0
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
              : pnl < 0
              ? "bg-red-500/15 text-red-400 border border-red-500/40"
              : "bg-amber-500/15 text-amber-400 border border-amber-500/40"
          }`}
        >
          {isOpen
            ? "OPEN"
            : pnl > 0
            ? `WIN +$${pnl}`
            : pnl < 0
            ? `LOSS $${pnl}`
            : "BREAK-EVEN"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-[#94A3B8]">Entry: </span>
          <span className="font-mono text-white">{trade.entry_price?.toFixed(dec)}</span>
        </div>
        <div>
          <span className="text-[#94A3B8]">SL: </span>
          <span className="font-mono text-red-300">{trade.stop_loss?.toFixed(dec)}</span>
        </div>
        <div>
          <span className="text-[#94A3B8]">TP: </span>
          <span className="font-mono text-emerald-300">{trade.take_profit?.toFixed(dec)}</span>
        </div>
        <div>
          <span className="text-[#94A3B8]">Size: </span>
          <span className="font-mono text-white">{trade.position_size}</span>
        </div>
      </div>

      {trade.entry_zone && (
        <p className="text-xs text-[#94A3B8] mt-2">
          <span className="text-[#D4AF37] uppercase tracking-wider mr-1">POI:</span>
          {trade.entry_zone}
        </p>
      )}
      {trade.notes && <p className="text-xs text-[#CBD5E1] mt-2 italic">"{trade.notes}"</p>}

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-[#1E3A5F]">
          {showClose ? (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                  Exit Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice}
                  onChange={(ev) => setExit(ev.target.value)}
                  placeholder={trade.entry_price?.toFixed(dec)}
                  className="w-full px-3 py-1.5 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono text-sm"
                  data-testid={`close-exit-${trade.id}`}
                />
              </div>
              <button
                onClick={handleClose}
                disabled={!exitPrice}
                className="px-4 py-1.5 bg-[#D4AF37] text-[#0A1628] text-sm font-bold rounded-sm disabled:opacity-50"
                data-testid={`confirm-close-${trade.id}`}
              >
                Close
              </button>
              <button onClick={() => setShowClose(false)} className="px-3 py-1.5 text-sm text-[#94A3B8]">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClose(true)}
              className="text-xs text-[#D4AF37] hover:text-[#F4C430] flex items-center gap-1"
              data-testid={`close-btn-${trade.id}`}
            >
              <CheckCircle2 className="w-3 h-3" /> Close Trade
            </button>
          )}
        </div>
      )}

      {!isOpen && (
        <>
          <div className="mt-3 pt-3 border-t border-[#1E3A5F] flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs">
              <span className="text-[#94A3B8]">Exit: </span>
              <span className="font-mono text-white">{trade.exit_price?.toFixed(dec)}</span>
            </div>
            {!trade.ai_coach && (
              <button
                onClick={() => onScore(trade.id)}
                disabled={scoringId === trade.id}
                className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#F4C430] disabled:opacity-50"
                data-testid={`coach-btn-${trade.id}`}
              >
                <Sparkles className={`w-3 h-3 ${scoringId === trade.id ? "animate-spin" : ""}`} />
                {scoringId === trade.id ? "Coaching..." : "Get AI Coach feedback"}
              </button>
            )}
          </div>
          <CoachBlock coach={trade.ai_coach} />
        </>
      )}
    </div>
  );
};

// ============== Main page ==============
export default function TradeJournal() {
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [verdicts, setVerdicts] = useState([]);
  const [scoringId, setScoringId] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const load = useCallback(async () => {
    try {
      const [t, s, m, v] = await Promise.all([
        tradeAPI.getTrades(),
        tradeAPI.getTradeStats(),
        marketAPI.getAllMarketData(),
        aiAPI.getAllVerdicts().catch(() => ({ data: { verdicts: [] } })),
      ]);
      setTrades(t.data || []);
      setStats(s.data);
      setInstruments(m.data.instruments || []);
      setVerdicts(v.data?.verdicts || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Pre-fill from ?from_verdict=SYMBOL
  useEffect(() => {
    const sym = searchParams.get("from_verdict");
    if (!sym || verdicts.length === 0) return;
    const v = verdicts.find((x) => x.symbol === decodeURIComponent(sym));
    if (!v?.verdict) return;
    setPrefill({
      instrument: v.symbol,
      direction: v.verdict.action === "SELL" ? "SHORT" : "LONG",
      entry_price: v.verdict.key_levels?.entry,
      stop_loss: v.verdict.key_levels?.stop_loss,
      take_profit: v.verdict.key_levels?.take_profit,
      entry_model: `AI: ${v.verdict.bias || v.verdict.action}`,
      entry_zone: v.verdict.reasoning ? v.verdict.reasoning.slice(0, 80) : "",
      notes: `AI verdict (${v.verdict.action} · ${v.verdict.confidence}%): ${v.verdict.reasoning || ""}`.trim(),
    });
    const next = new URLSearchParams(searchParams);
    next.delete("from_verdict");
    setSearchParams(next, { replace: true });
  }, [verdicts, searchParams, setSearchParams]);

  const handleCreated = useCallback(
    async (newTrade) => {
      await load();
      if (newTrade?.id) {
        setHighlightId(newTrade.id);
        setTimeout(() => {
          const el = document.querySelector(`[data-testid="trade-${newTrade.id}"]`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
        setTimeout(() => setHighlightId(null), 2500);
      }
    },
    [load]
  );

  const closeTrade = async (id, exit_price) => {
    try {
      await tradeAPI.updateTrade(id, { exit_price, status: "CLOSED" });
      toast.success("Trade closed");
      load();
    } catch (err) {
      toast.error("Failed to close trade");
    }
  };

  const scoreTrade = async (id) => {
    setScoringId(id);
    try {
      await aiAPI.coachScore(id);
      toast.success("AI Coach completed");
      load();
    } catch (err) {
      toast.error("Coach failed");
    }
    setScoringId(null);
  };

  const runPatterns = async () => {
    setLoadingPatterns(true);
    try {
      const r = await aiAPI.coachPatterns();
      setPatterns(r.data);
    } catch (err) {
      toast.error("Pattern analysis failed");
    }
    setLoadingPatterns(false);
  };

  const openTrades = trades.filter((t) => t.status === "OPEN");
  const closedTrades = trades.filter((t) => t.status === "CLOSED");

  return (
    <div className="space-y-6" data-testid="journal-page">
      <div>
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-[#D4AF37]" />
          <h1 className="font-heading text-3xl font-bold text-white">Trade Journal</h1>
        </div>
        <p className="text-sm text-[#94A3B8] mt-1">
          Log every trade. AI Coach scores closed trades against your framework.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" data-testid="trade-stats">
          <Stat label="Total" value={stats.total_trades} />
          <Stat label="Open" value={stats.open_trades} color="text-blue-400" />
          <Stat
            label="Win Rate"
            value={`${stats.win_rate}%`}
            color={stats.win_rate >= 50 ? "text-emerald-400" : "text-amber-400"}
          />
          <Stat
            label="Net P/L"
            value={`${stats.total_profit_loss >= 0 ? "+" : ""}$${stats.total_profit_loss}`}
            color={stats.total_profit_loss >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <Stat label="Best Trade" value={`+$${stats.best_trade}`} color="text-emerald-400" />
        </div>
      )}

      {/* INLINE LOG FORM — replaces modal */}
      <LogTradeForm
        instruments={instruments}
        verdicts={verdicts}
        prefill={prefill}
        onCreated={handleCreated}
        onClearPrefill={() => setPrefill(null)}
      />

      {/* AI Pattern Insight */}
      <div className="eli-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm font-semibold text-white">AI Pattern Insight</h3>
          </div>
          <button
            onClick={runPatterns}
            disabled={loadingPatterns}
            className="text-xs text-[#D4AF37] hover:text-[#F4C430] flex items-center gap-1 disabled:opacity-50"
            data-testid="run-patterns-btn"
          >
            <Sparkles className={`w-3 h-3 ${loadingPatterns ? "animate-spin" : ""}`} />
            {loadingPatterns ? "Analysing..." : "Analyse last 10 trades"}
          </button>
        </div>
        {!patterns ? (
          <p className="text-xs text-[#94A3B8]">
            Run pattern insight to detect dominant habits across your last 10 closed trades.
          </p>
        ) : (
          <div className="space-y-2 text-sm" data-testid="patterns-output">
            <p className="text-[#CBD5E1]">{patterns.patterns}</p>
            {patterns.habits?.length > 0 && (
              <ul className="list-disc list-inside text-xs text-[#94A3B8] space-y-0.5">
                {patterns.habits.map((h, idx) => <li key={idx}>{h}</li>)}
              </ul>
            )}
            {patterns.top_strength && (
              <p className="text-xs">
                <span className="text-emerald-400 font-semibold">Strength: </span>
                <span className="text-[#CBD5E1]">{patterns.top_strength}</span>
              </p>
            )}
            {patterns.top_weakness && (
              <p className="text-xs">
                <span className="text-amber-400 font-semibold">Weakness: </span>
                <span className="text-[#CBD5E1]">{patterns.top_weakness}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Open Positions */}
      <section data-testid="open-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#D4AF37] tracking-wider uppercase flex items-center gap-2">
            <Activity className="w-4 h-4" /> Open Positions
            <span className="text-[#94A3B8] font-mono">({openTrades.length})</span>
          </h2>
        </div>
        {openTrades.length === 0 ? (
          <div className="eli-card p-6 text-center text-sm text-[#94A3B8]">
            No open positions. Log one above.
          </div>
        ) : (
          <div className="space-y-3">
            {openTrades.map((t) => (
              <TradeRow
                key={t.id}
                trade={t}
                onClose={closeTrade}
                onScore={scoreTrade}
                scoringId={scoringId}
                highlight={highlightId === t.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Closed Trades */}
      <section data-testid="closed-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#D4AF37] tracking-wider uppercase flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Closed Trades
            <span className="text-[#94A3B8] font-mono">({closedTrades.length})</span>
          </h2>
        </div>
        {closedTrades.length === 0 ? (
          <div className="eli-card p-6 text-center text-sm text-[#94A3B8]">
            No closed trades yet. Close one above and the AI Coach will score it.
          </div>
        ) : (
          <div className="space-y-3">
            {closedTrades.map((t) => (
              <TradeRow
                key={t.id}
                trade={t}
                onClose={closeTrade}
                onScore={scoreTrade}
                scoringId={scoringId}
                highlight={highlightId === t.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
