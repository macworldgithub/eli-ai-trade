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
  Trash2,
  Download,
  Tag,
  Link as LinkIcon,
} from "lucide-react";
import { tradeAPI, aiAPI, marketAPI } from "../lib/api";
import { toast } from "sonner";
import RiskCalculator from "./RiskCalculator";

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
  <div className="eli-card p-4">
    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">{label}</p>
    <p className={`font-heading text-3xl font-bold mt-1 ${color}`}>{value}</p>
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
    <div className="mt-3 p-4 bg-[#0A1628] border border-[#D4AF37]/30 rounded-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#D4AF37]" />
        <h4 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">
          AI Coach Feedback
        </h4>
        <span className="ml-auto text-sm font-mono text-white">
          Overall: <span className="text-[#D4AF37] font-bold text-lg">{coach.overall_score}/10</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <ScorePill label="Setup Quality" score={s.setup_quality ?? 0} />
        <ScorePill label="Entry Execution" score={s.entry_execution ?? 0} />
        <ScorePill label="Risk Management" score={s.risk_management ?? 0} />
        <ScorePill label="Patience / Discipline" score={s.patience_discipline ?? 0} />
      </div>
      <div className="space-y-3 text-sm">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-sm">
          <span className="text-emerald-400 font-semibold block mb-1">✓ What you did well: </span>
          <span className="text-[#CBD5E1]">{coach.what_you_did_well}</span>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-sm">
          <span className="text-amber-400 font-semibold block mb-1">⚠ Areas to improve: </span>
          <span className="text-[#CBD5E1]">{coach.areas_to_improve}</span>
        </div>
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3 rounded-sm">
          <span className="text-[#D4AF37] font-semibold block mb-1">★ Key lesson: </span>
          <span className="text-[#CBD5E1]">{coach.key_lesson}</span>
        </div>
      </div>
    </div>
  );
};

// ============== Inline Log Form ==============
const LogTradeForm = ({ instruments, verdicts, prefill, onCreated, onClearPrefill }) => {
  const blank = () => {
    return {
      instrument: "EUR/USD",
      direction: "LONG",
      session: detectSession(),
      entry_model: DEFAULT_MODELS[0],
      entry_zone: "",
      entry_price: "",
      stop_loss: "",
      take_profit: "",
      position_size: 1,
      risk_amount: "",
      notes: "",
      strategy_tags: "",
      chart_url: "",
    };
  };

  const [f, setF] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showRiskCalc, setShowRiskCalc] = useState(false);

  // Apply prefill from AI verdict (URL param)
  useEffect(() => {
    if (!prefill) return;
    const dec = decimalsFor(prefill.instrument || prefill.symbol);
    const dir = prefill.direction || (prefill.action === "SELL" ? "SHORT" : "LONG");
    
    // Check if prefill contains verdict format (from verdicts array) or direct format
    const levels = prefill.key_levels || prefill.verdict?.key_levels || {};
    const entry = levels.entry || prefill.entry_price || prefill.price_at_verdict || 0;
    
    const sl = levels.stop_loss || prefill.stop_loss || (dir === "LONG" ? entry * 0.995 : entry * 1.005);
    const tp = levels.take_profit || prefill.take_profit || (dir === "LONG" ? entry * 1.01 : entry * 0.99);
    
    const reasoning = prefill.reasoning || prefill.verdict?.reasoning || "";
    const bias = prefill.bias || prefill.verdict?.bias || prefill.action || prefill.verdict?.action || dir;

    setF({
      ...blank(),
      instrument: prefill.symbol || prefill.instrument,
      direction: dir,
      entry_model: `AI: ${bias}`,
      entry_zone: reasoning ? reasoning.slice(0, 80) : "",
      entry_price: entry ? Number(entry).toFixed(dec) : "",
      stop_loss: sl ? Number(sl).toFixed(dec) : "",
      take_profit: tp ? Number(tp).toFixed(dec) : "",
      notes: prefill.notes || `AI verdict: ${reasoning}`.trim(),
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

  // Live RR and Impact calculations
  const e = parseFloat(f.entry_price);
  const sl = parseFloat(f.stop_loss);
  const tp = parseFloat(f.take_profit);
  const posSize = parseFloat(f.position_size) || 0;
  
  const pipMult = f.instrument?.includes("JPY") ? 100 : decimals === 5 ? 10000 : 1;
  const pipDistance = (e && sl) ? Math.abs(e - sl) * pipMult : 0;
  
  // Simplified pip value calculation ($10 per pip per standard lot for majors)
  // This is a rough estimation for UX purposes
  const estPipValue = posSize * 10; 
  const dollarRisk = pipDistance * estPipValue;

  const rr = (() => {
    if (![e, sl, tp].every(Number.isFinite)) return null;
    const risk = Math.abs(e - sl);
    const reward = Math.abs(tp - e);
    if (risk === 0) return null;
    return {
      risk,
      reward,
      ratio: reward / risk,
      pipMult,
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
      // Split and clean tags
      const parsedTags = f.strategy_tags
        ? f.strategy_tags.split(",").map(t => t.trim()).filter(t => t.length > 0)
        : [];

      const payload = {
        instrument: f.instrument,
        direction: f.direction,
        session: f.session,
        entry_model: f.entry_model,
        entry_zone: f.entry_zone || null,
        entry_price: e,
        stop_loss: sl,
        take_profit: Number.isFinite(tp) ? tp : f.direction === "LONG" ? e * 1.01 : e * 0.99,
        position_size: posSize || 1,
        risk_amount: f.risk_amount ? Number(f.risk_amount) : dollarRisk,
        notes: f.notes || null,
        strategy_tags: parsedTags,
        chart_url: f.chart_url || null,
      };
      
      const resp = await tradeAPI.createTrade(payload);
      toast.success(`${f.direction} ${f.instrument} logged`, {
        description: `Entry ${e} · SL ${sl}${rr ? ` · 1:${rr.ratio.toFixed(2)} RR` : ""}`,
      });
      onCreated(resp?.data);
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
      <div className="px-6 py-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#0A1628]">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="font-bold text-white tracking-wider">Log New Trade</h2>
        </div>
        {live != null && (
          <div className="flex items-center gap-2 text-sm text-[#94A3B8] font-mono bg-[#1E3A5F]/30 px-3 py-1 rounded-full border border-[#1E3A5F]">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            {f.instrument} <span className="text-emerald-400 font-bold">{Number(live).toFixed(decimals)}</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* AI verdict quick-fill */}
        {buyVerdicts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap" data-testid="verdict-chips">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1 bg-[#D4AF37]/10 px-2 py-1 rounded-sm border border-[#D4AF37]/30">
              <Sparkles className="w-3 h-3" /> AI Setups
            </span>
            {buyVerdicts.map((v) => (
              <button
                key={v.symbol}
                onClick={() => applyVerdict(v)}
                className={`px-3 py-1 text-xs font-bold rounded-sm border ${
                  v.verdict.action === "BUY"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/40 hover:bg-red-500/20"
                }`}
              >
                {v.verdict.action} {v.symbol}
              </button>
            ))}
          </div>
        )}

        {/* Row 1: Instrument · Direction · Entry */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr] gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">Instrument</label>
            <select
              value={f.instrument}
              onChange={(ev) => handleInst(ev.target.value)}
              className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              {instruments.map((i) => (
                <option key={i.symbol} value={i.symbol}>{i.symbol}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDir(d)}
                  className={`py-3 text-sm font-bold rounded-sm border transition-colors ${
                    f.direction === d
                      ? d === "LONG"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                        : "bg-red-500/20 text-red-400 border-red-500/50"
                      : "bg-[#1E3A5F]/40 text-[#94A3B8] border-[#1E3A5F]"
                  }`}
                >
                  {d === "LONG" ? <TrendingUp className="inline w-4 h-4 mr-1.5" /> : <TrendingDown className="inline w-4 h-4 mr-1.5" />}
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">Entry Price</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={f.entry_price}
                onChange={(ev) => setF({ ...f, entry_price: ev.target.value })}
                placeholder="0.00000"
                className="flex-1 px-4 py-3 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              />
              <button
                type="button"
                onClick={snap}
                disabled={live == null}
                title="Snap to live price"
                className="px-4 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded-sm border border-[#D4AF37]/40 disabled:opacity-30"
              >
                <Zap className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: SL · TP · RR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-red-400 mb-1.5">Stop Loss</label>
            <input
              type="number"
              step="any"
              value={f.stop_loss}
              onChange={(ev) => setF({ ...f, stop_loss: ev.target.value })}
              placeholder="0.00000"
              className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-red-500/30 rounded-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-emerald-400 mb-1.5">Take Profit</label>
            <input
              type="number"
              step="any"
              value={f.take_profit}
              onChange={(ev) => setF({ ...f, take_profit: ev.target.value })}
              placeholder="0.00000"
              className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-emerald-500/30 rounded-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs uppercase tracking-wider text-[#D4AF37] mb-1.5 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Risk : Reward
            </label>
            <div className="flex-1 bg-[#0A1628] border border-[#D4AF37]/30 rounded-sm px-4 py-3 flex items-center justify-between">
              {rr ? (
                <>
                  <div className="text-sm">
                    <span className="text-red-400 font-mono">
                      {decimals === 5 ? `${(rr.risk * rr.pipMult).toFixed(1)}p` : rr.risk.toFixed(decimals)}
                    </span>
                    <span className="text-[#94A3B8] mx-2">→</span>
                    <span className="text-emerald-400 font-mono">
                      {decimals === 5 ? `${(rr.reward * rr.pipMult).toFixed(1)}p` : rr.reward.toFixed(decimals)}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold text-lg ${
                      rr.ratio >= 2 ? "text-emerald-400" : rr.ratio >= 1 ? "text-amber-400" : "text-red-400"
                    }`}
                  >
                    1:{rr.ratio.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-[#94A3B8]">Fill entry + SL + TP</span>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Position Size and Dollar Impact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">Position Size</label>
            <input
              type="number"
              step="0.01"
              value={f.position_size}
              onChange={(ev) => setF({ ...f, position_size: ev.target.value })}
              className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">Dollar Impact ($ Risk)</label>
            <div className="flex-1 bg-[#1E3A5F]/30 border border-[#1E3A5F] rounded-sm px-4 py-3 flex items-center justify-between text-white font-mono">
              <div className="flex flex-col">
                <span className="text-xs text-[#94A3B8] mb-1">~$10/pip per lot approx.</span>
                <span className="text-lg font-bold text-red-400">
                   ${dollarRisk > 0 ? dollarRisk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>
              <div className="text-right flex flex-col">
                 <span className="text-xs text-[#94A3B8] mb-1">Pip Dist.</span>
                 <span className="text-white">{pipDistance.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Calculator Inline Toggle */}
        <button
          type="button"
          onClick={() => setShowRiskCalc(!showRiskCalc)}
          className="text-sm text-[#D4AF37] hover:text-white flex items-center gap-2 font-semibold"
        >
          {showRiskCalc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showRiskCalc ? "Hide" : "Show"} Advanced Risk Calculator
        </button>

        {showRiskCalc && (
          <div className="border border-[#1E3A5F] rounded-sm p-4 bg-[#0A1628]/50">
            <RiskCalculator inline={true} />
          </div>
        )}

        {/* Details collapser */}
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="flex items-center gap-1.5 text-sm text-[#D4AF37] hover:text-white font-semibold pt-2 border-t border-[#1E3A5F]/50 w-full"
        >
          {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {detailsOpen ? "Hide" : "Show"} advanced details (tags, chart, session, notes)
        </button>

        {detailsOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#1E3A5F]">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">Session</label>
              <select
                value={f.session}
                onChange={(ev) => setF({ ...f, session: ev.target.value })}
                className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white"
              >
                {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">Entry Model</label>
              <select
                value={f.entry_model}
                onChange={(ev) => setF({ ...f, entry_model: ev.target.value })}
                className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white"
              >
                {DEFAULT_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                {!DEFAULT_MODELS.includes(f.entry_model) && (
                  <option value={f.entry_model}>{f.entry_model}</option>
                )}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Strategy Tags (comma separated)
              </label>
              <input
                type="text"
                value={f.strategy_tags}
                onChange={(ev) => setF({ ...f, strategy_tags: ev.target.value })}
                placeholder="e.g. Trend Continuation, Counter Trend, News Play"
                className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5" /> Chart URL
              </label>
              <input
                type="url"
                value={f.chart_url}
                onChange={(ev) => setF({ ...f, chart_url: ev.target.value })}
                placeholder="https://tradingview.com/..."
                className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">Entry Zone (POI / Timeframe)</label>
              <input
                type="text"
                value={f.entry_zone}
                onChange={(ev) => setF({ ...f, entry_zone: ev.target.value })}
                placeholder="e.g. Premium OB on H1"
                className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">Notes</label>
              <textarea
                value={f.notes}
                onChange={(ev) => setF({ ...f, notes: ev.target.value })}
                rows={3}
                placeholder="Reason for entry, market context, mental state..."
                className="w-full px-4 py-3 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white"
              />
            </div>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSave}
          className="w-full px-6 py-4 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] font-bold text-lg rounded-sm disabled:opacity-50 transition-colors shadow-lg shadow-[#D4AF37]/20"
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
const TradeRow = ({ trade, onClose, onScore, onDelete, scoringId, highlight }) => {
  const [showClose, setShowClose] = useState(false);
  const [exitPrice, setExit] = useState("");
  const pnl = trade.profit_loss || 0;
  const isOpen = trade.status === "OPEN";
  const dec = decimalsFor(trade.instrument);

  const handleClose = async () => {
    if (!exitPrice) return;
    await onClose(trade.id, Number(exitPrice));
    setShowClose(false);
  };

  return (
    <div
      className={`eli-card p-5 transition-all duration-500 ${
        highlight ? "border-[#D4AF37] shadow-[0_0_0_2px_rgba(212,175,55,0.3)] bg-[#D4AF37]/5" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-2 py-1 text-xs font-bold border rounded-sm tracking-wider flex items-center ${
              trade.direction === "LONG"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                : "bg-red-500/15 text-red-400 border-red-500/40"
            }`}
          >
            {trade.direction === "LONG" ? (
              <TrendingUp className="inline w-3.5 h-3.5 mr-1" />
            ) : (
              <TrendingDown className="inline w-3.5 h-3.5 mr-1" />
            )}
            {trade.direction}
          </span>
          <span className="font-mono text-lg font-bold text-white">{trade.instrument}</span>
          <span className="text-xs text-[#94A3B8] px-2 py-1 bg-[#1E3A5F]/50 rounded-sm">{trade.session}</span>
          <span className="text-xs text-[#D4AF37] px-2 py-1 bg-[#D4AF37]/10 rounded-sm">{trade.entry_model}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-sm ${
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
              ? `WIN +$${pnl.toFixed(2)}`
              : pnl < 0
              ? `LOSS $${pnl.toFixed(2)}`
              : "BREAK-EVEN"}
          </span>
          <button 
            onClick={() => onDelete(trade.id)}
            className="text-red-400/50 hover:text-red-400 transition-colors p-1"
            title="Delete Trade"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-[#0A1628] p-4 rounded-sm border border-[#1E3A5F]/50 mb-3">
        <div>
          <span className="text-[#94A3B8] block text-[10px] uppercase mb-1">Entry Price</span>
          <span className="font-mono text-white text-base">{trade.entry_price?.toFixed(dec)}</span>
        </div>
        <div>
          <span className="text-[#94A3B8] block text-[10px] uppercase mb-1">Stop Loss</span>
          <span className="font-mono text-red-400 text-base">{trade.stop_loss?.toFixed(dec)}</span>
        </div>
        <div>
          <span className="text-[#94A3B8] block text-[10px] uppercase mb-1">Take Profit</span>
          <span className="font-mono text-emerald-400 text-base">{trade.take_profit?.toFixed(dec)}</span>
        </div>
        <div>
          <span className="text-[#94A3B8] block text-[10px] uppercase mb-1">Position Size</span>
          <span className="font-mono text-white text-base">{trade.position_size}</span>
        </div>
      </div>

      {(trade.strategy_tags?.length > 0 || trade.chart_url) && (
        <div className="flex flex-wrap items-center gap-3 mt-3 mb-2">
          {trade.strategy_tags?.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#1E3A5F] text-[#CBD5E1] rounded-sm flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#94A3B8]" /> {tag}
            </span>
          ))}
          {trade.chart_url && (
            <a href={trade.chart_url} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-sm flex items-center gap-1 transition-colors">
              <LinkIcon className="w-3 h-3" /> View Chart
            </a>
          )}
        </div>
      )}

      {trade.entry_zone && (
        <p className="text-sm text-[#94A3B8] mt-2">
          <span className="text-[#D4AF37] uppercase tracking-wider mr-2 text-[10px] font-bold">POI:</span>
          {trade.entry_zone}
        </p>
      )}
      
      {trade.notes && <p className="text-sm text-[#CBD5E1] mt-2 italic border-l-2 border-[#1E3A5F] pl-3 py-1">"{trade.notes}"</p>}

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#1E3A5F]">
          {showClose ? (
            <div className="flex gap-3 items-end bg-[#0A1628] p-3 border border-[#1E3A5F] rounded-sm">
              <div className="flex-1">
                <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Exit Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice}
                  onChange={(ev) => setExit(ev.target.value)}
                  placeholder={trade.entry_price?.toFixed(dec)}
                  className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono text-sm"
                />
              </div>
              <button
                onClick={handleClose}
                disabled={!exitPrice}
                className="px-5 py-2 bg-[#D4AF37] text-[#0A1628] font-bold rounded-sm disabled:opacity-50 hover:bg-[#F4C430] transition-colors"
              >
                Confirm Close
              </button>
              <button onClick={() => setShowClose(false)} className="px-4 py-2 text-sm text-[#94A3B8] hover:text-white">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClose(true)}
              className="text-sm px-4 py-2 bg-[#1E3A5F]/50 text-white hover:bg-[#1E3A5F] rounded-sm flex items-center gap-2 border border-[#1E3A5F]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Close Trade
            </button>
          )}
        </div>
      )}

      {!isOpen && (
        <>
          <div className="mt-4 pt-4 border-t border-[#1E3A5F] flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm bg-[#1E3A5F]/30 px-3 py-1.5 rounded-sm border border-[#1E3A5F]">
              <span className="text-[#94A3B8] mr-2">Exit Price:</span>
              <span className="font-mono text-white font-bold">{trade.exit_price?.toFixed(dec)}</span>
            </div>
            {!trade.ai_coach && (
              <button
                onClick={() => onScore(trade.id)}
                disabled={scoringId === trade.id}
                className="flex items-center gap-2 text-sm px-4 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 rounded-sm transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${scoringId === trade.id ? "animate-spin" : ""}`} />
                {scoringId === trade.id ? "Analyzing Trade..." : "Get AI Coach Feedback"}
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
    
    setPrefill(v);
    
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
      toast.success("Trade closed successfully");
      load();
    } catch (err) {
      toast.error("Failed to close trade");
    }
  };
  
  const deleteTrade = async (id) => {
    if (!confirm("Are you sure you want to delete this trade? This cannot be undone.")) return;
    try {
      await tradeAPI.deleteTrade(id);
      toast.success("Trade deleted");
      load();
    } catch (e) {
      toast.error("Failed to delete trade");
    }
  };

  const scoreTrade = async (id) => {
    setScoringId(id);
    try {
      await aiAPI.coachScore(id);
      toast.success("AI Coach analysis complete");
      load();
    } catch (err) {
      toast.error("AI Coach failed to analyze trade");
    }
    setScoringId(null);
  };

  const runPatterns = async () => {
    setLoadingPatterns(true);
    try {
      const r = await aiAPI.coachPatterns();
      setPatterns(r.data);
      toast.success("Pattern analysis complete");
    } catch (err) {
      toast.error("Pattern analysis failed");
    }
    setLoadingPatterns(false);
  };
  
  const exportToCSV = () => {
    if (!trades || trades.length === 0) {
      toast.info("No trades to export");
      return;
    }
    
    const headers = ["ID", "Instrument", "Direction", "Status", "Entry Price", "Stop Loss", "Take Profit", "Exit Price", "P&L", "Session", "Model", "Tags", "Date"];
    const csvContent = [
      headers.join(","),
      ...trades.map(t => [
        t.id, 
        t.instrument, 
        t.direction, 
        t.status, 
        t.entry_price, 
        t.stop_loss, 
        t.take_profit, 
        t.exit_price || "", 
        t.profit_loss || 0,
        t.session,
        `"${t.entry_model}"`,
        `"${t.strategy_tags ? t.strategy_tags.join(';') : ''}"`,
        t.created_at
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `trade_journal_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openTrades = trades.filter((t) => t.status === "OPEN");
  const closedTrades = trades.filter((t) => t.status === "CLOSED");

  return (
    <div className="space-y-8" data-testid="journal-page">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="font-heading text-4xl font-bold text-white">Trade Journal</h1>
          </div>
          <p className="text-[#94A3B8] mt-2">
            Disciplined trading starts with review. Log and analyze every trade.
          </p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F]/50 hover:bg-[#1E3A5F] text-white border border-[#1E3A5F] rounded-sm transition-colors"
        >
          <Download className="w-4 h-4" /> Export to CSV
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4" data-testid="trade-stats">
          <Stat label="Total Trades" value={stats.total_trades} />
          <Stat label="Open Trades" value={stats.open_trades} color="text-blue-400" />
          <Stat
            label="Win Rate"
            value={`${stats.win_rate}%`}
            color={stats.win_rate >= 50 ? "text-emerald-400" : "text-amber-400"}
          />
          <Stat
            label="Net P/L"
            value={`${stats.total_profit_loss >= 0 ? "+" : ""}$${stats.total_profit_loss?.toFixed(2) || "0.00"}`}
            color={stats.total_profit_loss >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <Stat label="Avg RR" value={stats.avg_rr?.toFixed(2) || "—"} color="text-emerald-400" />
        </div>
      )}

      {/* Log Trade Form */}
      <LogTradeForm
        instruments={instruments}
        verdicts={verdicts}
        prefill={prefill}
        onCreated={handleCreated}
        onClearPrefill={() => setPrefill(null)}
      />

      {/* AI Pattern Insight */}
      <div className="eli-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            <h3 className="text-xl font-bold text-white">AI Pattern Insight</h3>
          </div>
          <button
            onClick={runPatterns}
            disabled={loadingPatterns || closedTrades.length === 0}
            className="px-4 py-2 text-sm bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 rounded-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Sparkles className={`w-4 h-4 ${loadingPatterns ? "animate-spin" : ""}`} />
            {loadingPatterns ? "Analyzing patterns..." : "Analyze Last 10 Trades"}
          </button>
        </div>
        
        {!patterns ? (
          <div className="text-center p-6 bg-[#0A1628] border border-[#1E3A5F] rounded-sm">
            <p className="text-[#94A3B8]">
              Run pattern insight to detect dominant habits and systematic errors across your last 10 closed trades.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0A1628] p-5 border border-[#1E3A5F] rounded-sm">
            <div className="md:col-span-3">
              <p className="text-white text-lg">{patterns.patterns}</p>
            </div>
            {patterns.top_strength && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-sm">
                <span className="text-emerald-400 font-bold block mb-2 uppercase text-xs tracking-wider">Top Strength</span>
                <span className="text-white">{patterns.top_strength}</span>
              </div>
            )}
            {patterns.top_weakness && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-sm">
                <span className="text-amber-400 font-bold block mb-2 uppercase text-xs tracking-wider">Top Weakness</span>
                <span className="text-white">{patterns.top_weakness}</span>
              </div>
            )}
            {patterns.habits?.length > 0 && (
              <div className="bg-[#1E3A5F]/30 border border-[#1E3A5F] p-4 rounded-sm md:col-span-1">
                <span className="text-[#94A3B8] font-bold block mb-2 uppercase text-xs tracking-wider">Observed Habits</span>
                <ul className="list-disc list-inside text-sm text-[#CBD5E1] space-y-1">
                  {patterns.habits.map((h, idx) => <li key={idx}>{h}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Open Positions */}
        <section data-testid="open-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#D4AF37] tracking-wider uppercase flex items-center gap-2">
              <Activity className="w-5 h-5" /> Open Positions
              <span className="text-[#94A3B8] font-mono bg-[#1E3A5F] px-2 py-0.5 rounded-sm text-sm">{openTrades.length}</span>
            </h2>
          </div>
          {openTrades.length === 0 ? (
            <div className="eli-card p-10 text-center flex flex-col items-center justify-center">
              <Activity className="w-10 h-10 text-[#1E3A5F] mb-3" />
              <p className="text-[#94A3B8]">No open positions. Log one above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openTrades.map((t) => (
                <TradeRow
                  key={t.id}
                  trade={t}
                  onClose={closeTrade}
                  onScore={scoreTrade}
                  onDelete={deleteTrade}
                  scoringId={scoringId}
                  highlight={highlightId === t.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Closed Trades */}
        <section data-testid="closed-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#D4AF37] tracking-wider uppercase flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Closed Trades
              <span className="text-[#94A3B8] font-mono bg-[#1E3A5F] px-2 py-0.5 rounded-sm text-sm">{closedTrades.length}</span>
            </h2>
          </div>
          {closedTrades.length === 0 ? (
            <div className="eli-card p-10 text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#1E3A5F] mb-3" />
              <p className="text-[#94A3B8]">No closed trades yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {closedTrades.map((t) => (
                <TradeRow
                  key={t.id}
                  trade={t}
                  onClose={closeTrade}
                  onScore={scoreTrade}
                  onDelete={deleteTrade}
                  scoringId={scoringId}
                  highlight={highlightId === t.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
