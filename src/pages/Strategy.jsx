import { useState, useEffect } from "react";
import { ScrollText, Save, RotateCcw, Sparkles } from "lucide-react";
import { aiAPI } from "../lib/api";
import { toast } from "sonner";

const DEFAULT_HINTS = [
  { label: "Market Structure", desc: "HTF bias · BOS / CHOCH alignment" },
  { label: "Liquidity", desc: "Equal highs/lows · PDH / PDL · sweep before entry" },
  { label: "Premium / Discount", desc: "Fib 50% of recent leg" },
  { label: "POI", desc: "FVG · Order Block · Breaker · IFG · CISD · SMT" },
  { label: "Session Confluence", desc: "Asian sweep → London Open · London → NY continuation" },
  { label: "Risk Management", desc: "Max 5% per trade · 1:2 RR minimum · 3-5 trades/week" },
  { label: "News Filter", desc: "Avoid 15 min before/after 3-star events on traded ccy" },
];

export default function Strategy() {
  const [rules, setRules] = useState("");
  const [original, setOriginal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await aiAPI.getRules();
      setRules(r.data.rules || "");
      setOriginal(r.data.rules || "");
    } catch (e) {
      toast.error("Failed to load rules");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await aiAPI.updateRules(rules);
      setOriginal(rules);
      toast.success("Strategy rules updated · AI Engine & Coach will use these immediately");
    } catch (e) {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const resetEdits = () => setRules(original);

  const dirty = rules !== original;
  const lines = rules.split("\n").length;
  const chars = rules.length;

  return (
    <div className="space-y-6" data-testid="strategy-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <ScrollText className="w-7 h-7 text-eli-gold" />
            <h1 className="font-heading text-3xl font-bold text-eli-text-white">Strategy Framework</h1>
          </div>
          <p className="text-sm text-eli-muted mt-1">
            The rule set the AI Engine applies for verdicts and the AI Coach uses to score every trade.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetEdits}
            disabled={!dirty}
            className="flex items-center gap-2 px-3 py-2 bg-eli-border text-eli-text-white text-sm rounded-sm hover:bg-eli-navy-3 disabled:opacity-30"
            data-testid="reset-edits-btn"
          >
            <RotateCcw className="w-4 h-4" /> Reset Edits
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="flex items-center gap-2 px-5 py-2 bg-eli-gold hover:bg-eli-gold-bright text-eli-navy font-bold text-sm rounded-sm disabled:opacity-50"
            data-testid="save-rules-btn"
          >
            <Save className={`w-4 h-4 ${saving ? "animate-pulse" : ""}`} />
            {saving ? "Saving..." : "Save Rules"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 eli-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-eli-gold" />
              <h3 className="text-sm font-bold text-eli-text-white">Rules (sent as system prompt)</h3>
              {dirty && <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Unsaved</span>}
            </div>
            <div className="text-[10px] font-mono text-eli-muted">{lines} lines · {chars} chars</div>
          </div>
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-eli-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={28}
              className="w-full p-3 bg-eli-navy border border-eli-border rounded-sm text-eli-slate-300 font-mono text-xs leading-relaxed resize-y focus:ring-2 focus:ring-eli-gold/50 focus:outline-none"
              spellCheck={false}
              data-testid="rules-textarea"
            />
          )}
          <p className="text-[10px] text-eli-muted mt-2">
            Tip: Edit this as plain text. Markdown headings are fine — the AI reads it as system context. Changes are live the next time a verdict or coach score is requested.
          </p>
        </div>

        <div className="space-y-3">
          <div className="eli-card p-4">
            <h3 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-3">Framework Pillars</h3>
            <ul className="space-y-3">
              {DEFAULT_HINTS.map((h) => (
                <li key={h.label} className="border-l-2 border-eli-gold/40 pl-3">
                  <p className="text-xs font-bold text-eli-text-white">{h.label}</p>
                  <p className="text-[11px] text-eli-muted mt-0.5">{h.desc}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="eli-card p-4">
            <h3 className="text-sm font-bold text-eli-text-white mb-2">Where these rules are used</h3>
            <ul className="space-y-1.5 text-xs text-eli-muted list-disc list-inside">
              <li>AI Engine verdicts on all 8 instruments</li>
              <li>AI Coach scoring of every closed trade</li>
              <li>AI Pattern Insight across last 10 trades</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
