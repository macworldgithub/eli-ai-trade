import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus, Eye, BookOpen } from "lucide-react";
import { aiAPI, marketAPI } from "../lib/api";

const ActionBadge = ({ action }) => {
  const map = {
    BUY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
    SELL: "bg-red-500/15 text-red-400 border-red-500/40",
    HOLD: "bg-amber-500/15 text-amber-400 border-amber-500/40",
    WATCH: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-bold border rounded-sm tracking-wider ${map[action] || map.WATCH}`}>
      {action}
    </span>
  );
};

const VerdictCard = ({ v, onGenerate, generating, livePrice, onLogTrade }) => {
  const ver = v?.verdict || {};
  const ac = v?.asset_class || "";
  const decimals = ac === "forex" ? 5 : 2;
  return (
    <div className="eli-card p-5" data-testid={`verdict-${v?.symbol?.replace(/[\\/ &]/g, "_")}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-xl font-bold text-white">{v?.symbol}</h3>
            <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              {ac}
            </span>
          </div>
          {livePrice != null && (
            <p className="text-xs text-[#94A3B8] mt-1 font-mono">
              Live: <span className="text-white">{livePrice.toFixed(decimals)}</span>
            </p>
          )}
        </div>
        {ver.action && <ActionBadge action={ver.action} />}
      </div>

      {ver.confidence != null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#94A3B8] tracking-wider uppercase">Confidence</span>
            <span className="text-[#D4AF37] font-mono font-bold">{ver.confidence}%</span>
          </div>
          <div className="h-1.5 bg-[#1E3A5F] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4C430]"
              style={{ width: `${ver.confidence}%` }}
            />
          </div>
        </div>
      )}

      {ver.reasoning && (
        <p className="text-sm text-[#CBD5E1] leading-relaxed mb-4">{ver.reasoning}</p>
      )}

      {ver.key_levels && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-[#1E3A5F]/40 rounded-sm py-2">
            <p className="text-[9px] text-[#94A3B8] uppercase tracking-wider">Entry</p>
            <p className="text-xs font-mono text-white tabular-nums">
              {Number(ver.key_levels.entry || 0).toFixed(decimals)}
            </p>
          </div>
          <div className="bg-red-500/10 rounded-sm py-2">
            <p className="text-[9px] text-red-400 uppercase tracking-wider">Stop</p>
            <p className="text-xs font-mono text-red-300 tabular-nums">
              {Number(ver.key_levels.stop_loss || 0).toFixed(decimals)}
            </p>
          </div>
          <div className="bg-emerald-500/10 rounded-sm py-2">
            <p className="text-[9px] text-emerald-400 uppercase tracking-wider">Target</p>
            <p className="text-xs font-mono text-emerald-300 tabular-nums">
              {Number(ver.key_levels.take_profit || 0).toFixed(decimals)}
            </p>
          </div>
        </div>
      )}

      {ver.bias && (
        <div className="flex items-center justify-between pt-3 border-t border-[#1E3A5F]">
          <div className="flex items-center gap-2 text-xs">
            {ver.bias === "BULLISH" ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : ver.bias === "BEARISH" ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : (
              <Minus className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-[#94A3B8] tracking-wider uppercase">{ver.bias}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onGenerate(v.symbol)}
              disabled={generating === v.symbol}
              className="text-xs text-[#94A3B8] hover:text-[#D4AF37] flex items-center gap-1 disabled:opacity-50"
              data-testid={`regen-${v?.symbol?.replace(/[\\/ &]/g, "_")}`}
            >
              <RefreshCw className={`w-3 h-3 ${generating === v.symbol ? "animate-spin" : ""}`} />
              Regenerate
            </button>
            {["BUY", "SELL"].includes(ver.action) && (
              <button
                onClick={() => onLogTrade(v.symbol)}
                className="text-xs font-bold text-[#0A1628] bg-[#D4AF37] hover:bg-[#F4C430] px-3 py-1 rounded-sm flex items-center gap-1"
                data-testid={`log-trade-${v?.symbol?.replace(/[\\/ &]/g, "_")}`}
              >
                <BookOpen className="w-3 h-3" /> Log Trade
              </button>
            )}
          </div>
        </div>
      )}

      {v?.created_at && (
        <p className="text-[10px] text-[#94A3B8]/70 mt-2 font-mono">
          {new Date(v.created_at).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default function TradeSignals() {
  const [verdicts, setVerdicts] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const navigate = useNavigate();

  const logTrade = (symbol) => {
    navigate(`/journal?from_verdict=${encodeURIComponent(symbol)}`);
  };

  const load = useCallback(async () => {
    try {
      const [v, m] = await Promise.all([aiAPI.getAllVerdicts(), marketAPI.getAllMarketData()]);
      setVerdicts(v.data.verdicts || []);
      const lp = {};
      (m.data.instruments || []).forEach((i) => (lp[i.symbol] = i.price));
      setLivePrices(lp);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAll = async () => {
    setGeneratingAll(true);
    try {
      const r = await aiAPI.refreshVerdicts();
      setVerdicts(r.data.verdicts || []);
    } catch (e) {
      console.error(e);
    }
    setGeneratingAll(false);
  };

  const regenOne = async (symbol) => {
    setGenerating(symbol);
    try {
      const r = await aiAPI.getVerdict(symbol);
      setVerdicts((prev) => {
        const next = prev.filter((p) => p.symbol !== symbol);
        return [...next, r.data];
      });
    } catch (e) {
      console.error(e);
    }
    setGenerating(null);
  };

  const filtered =
    filter === "ALL" ? verdicts : verdicts.filter((v) => v?.verdict?.action === filter);

  const counts = {
    ALL: verdicts.length,
    BUY: verdicts.filter((v) => v?.verdict?.action === "BUY").length,
    SELL: verdicts.filter((v) => v?.verdict?.action === "SELL").length,
    HOLD: verdicts.filter((v) => v?.verdict?.action === "HOLD").length,
    WATCH: verdicts.filter((v) => v?.verdict?.action === "WATCH").length,
  };

  return (
    <div className="space-y-6" data-testid="signals-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-[#D4AF37]" />
            <h1 className="font-heading text-3xl font-bold text-white">AI Engine</h1>
          </div>
          <p className="text-sm text-[#94A3B8] mt-1">
            Live Claude Sonnet 4.5 verdicts on all 8 instruments using your strategy framework.
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={generatingAll}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] font-bold text-sm rounded-sm transition-colors disabled:opacity-50"
          data-testid="run-engine-btn"
        >
          <Sparkles className={`w-4 h-4 ${generatingAll ? "animate-spin" : ""}`} />
          {generatingAll ? "Analysing..." : "Run AI Engine"}
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "BUY", "SELL", "HOLD", "WATCH"].map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`px-3 py-1.5 text-xs font-semibold tracking-wider uppercase rounded-sm border transition-colors ${
              filter === a
                ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]"
                : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]/50"
            }`}
            data-testid={`filter-${a}`}
          >
            {a} <span className="opacity-70">({counts[a]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="eli-card p-12 text-center">
          <Eye className="w-12 h-12 text-[#D4AF37]/50 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No verdicts yet</h3>
          <p className="text-sm text-[#94A3B8] mt-1">
            Click <span className="text-[#D4AF37]">Run AI Engine</span> to generate live verdicts for all 8 instruments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((v) => (
            <VerdictCard
              key={v.symbol}
              v={v}
              livePrice={livePrices[v.symbol]}
              onGenerate={regenOne}
              generating={generating}
              onLogTrade={logTrade}
            />
          ))}
        </div>
      )}
    </div>
  );
}
