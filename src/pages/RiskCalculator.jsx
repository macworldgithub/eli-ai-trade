import { useState } from "react";
import { Calculator, Target, AlertTriangle } from "lucide-react";
import { riskAPI, marketAPI } from "../lib/api";
import { useEffect } from "react";

export default function RiskCalculator() {
  const [instruments, setInstruments] = useState([]);
  const [form, setForm] = useState({
    symbol: "EUR/USD",
    account_balance: 10000,
    risk_percentage: 2,
    entry_price: 1.1,
    stop_loss: 1.095,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    marketAPI
      .getAllMarketData()
      .then((r) => setInstruments(r.data.instruments || []))
      .catch(() => {});
  }, []);

  const setSymbol = (sym) => {
    const inst = instruments.find((i) => i.symbol === sym);
    const price = inst?.price ?? form.entry_price;
    const stop = inst?.asset_class === "forex" ? price * 0.995 : price * 0.99;
    setForm({
      ...form,
      symbol: sym,
      entry_price: Number(price.toFixed(5)),
      stop_loss: Number(stop.toFixed(5)),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await riskAPI.calculateRisk({
        account_balance: Number(form.account_balance),
        risk_percentage: Number(form.risk_percentage),
        entry_price: Number(form.entry_price),
        stop_loss: Number(form.stop_loss),
        symbol: form.symbol,
      });
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Calculation failed");
      setResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6" data-testid="risk-calculator-page">
      <div>
        <div className="flex items-center gap-3">
          <Calculator className="w-7 h-7 text-[#D4AF37]" />
          <h1 className="font-heading text-3xl font-bold text-white">Risk Calculator</h1>
        </div>
        <p className="text-sm text-[#94A3B8] mt-1">Size positions against your 5%-max-risk rule.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={submit} className="eli-card p-5 space-y-4" data-testid="risk-form">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Instrument
            </label>
            <select
              value={form.symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white"
              data-testid="risk-symbol-select"
            >
              {instruments.map((i) => (
                <option key={i.symbol} value={i.symbol}>{i.symbol} · {i.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Account Balance ($)
              </label>
              <input
                type="number"
                step="any"
                value={form.account_balance}
                onChange={(e) => setForm({ ...form, account_balance: e.target.value })}
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono"
                data-testid="risk-balance"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Risk %
              </label>
              <input
                type="number"
                step="any"
                value={form.risk_percentage}
                onChange={(e) => setForm({ ...form, risk_percentage: e.target.value })}
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono"
                data-testid="risk-percent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Entry Price
              </label>
              <input
                type="number"
                step="any"
                value={form.entry_price}
                onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono"
                data-testid="risk-entry"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Stop Loss
              </label>
              <input
                type="number"
                step="any"
                value={form.stop_loss}
                onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
                className="w-full px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white font-mono"
                data-testid="risk-stop"
              />
            </div>
          </div>

          {Number(form.risk_percentage) > 5 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400">
                EliAI strategy rule: max 5% risk per trade.
              </span>
            </div>
          )}

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] font-bold rounded-sm disabled:opacity-50"
            data-testid="risk-calc-btn"
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
        </form>

        <div className="eli-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-semibold text-white">Result</h3>
          </div>
          {!result ? (
            <p className="text-sm text-[#94A3B8]">Submit the form to see your sizing breakdown.</p>
          ) : (
            <div className="space-y-3" data-testid="risk-result">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#1E3A5F]/40 rounded-sm">
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Risk Amount</p>
                  <p className="font-mono text-2xl font-bold text-[#D4AF37]">${result.risk_amount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-[#1E3A5F]/40 rounded-sm">
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Position Size</p>
                  <p className="font-mono text-2xl font-bold text-white">{result.position_size}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-[#1E3A5F]">
                  <span className="text-[#94A3B8]">Pip Risk</span>
                  <span className="font-mono text-white">{result.pip_risk}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#1E3A5F]">
                  <span className="text-[#94A3B8]">Potential Loss</span>
                  <span className="font-mono text-red-400">−${result.potential_loss.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#1E3A5F]">
                  <span className="text-[#94A3B8]">Profit @ 2R</span>
                  <span className="font-mono text-emerald-400">+${result.potential_profit_2r.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#1E3A5F]">
                  <span className="text-[#94A3B8]">Profit @ 3R</span>
                  <span className="font-mono text-emerald-400">+${result.potential_profit_3r.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[#94A3B8]">Max Position Value</span>
                  <span className="font-mono text-white">${result.max_position_value.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
