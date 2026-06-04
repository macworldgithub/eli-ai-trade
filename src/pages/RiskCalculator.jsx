// import { useState } from "react";
// import { Calculator, Target, AlertTriangle } from "lucide-react";
// import { riskAPI, marketAPI } from "../lib/api";
// import { useEffect } from "react";

// export default function RiskCalculator() {
//   const [instruments, setInstruments] = useState([]);
//   const [form, setForm] = useState({
//     symbol: "EUR/USD",
//     account_balance: 10000,
//     risk_percentage: 2,
//     entry_price: 1.1,
//     stop_loss: 1.095,
//   });
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     marketAPI
//       .getAllMarketData()
//       .then((r) => setInstruments(r.data.instruments || []))
//       .catch(() => {});
//   }, []);

//   const setSymbol = (sym) => {
//     const inst = instruments.find((i) => i.symbol === sym);
//     const price = inst?.price ?? form.entry_price;
//     const stop = inst?.asset_class === "forex" ? price * 0.995 : price * 0.99;
//     setForm({
//       ...form,
//       symbol: sym,
//       entry_price: Number(price.toFixed(5)),
//       stop_loss: Number(stop.toFixed(5)),
//     });
//   };

//   const submit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       const r = await riskAPI.calculateRisk({
//         account_balance: Number(form.account_balance),
//         risk_percentage: Number(form.risk_percentage),
//         entry_price: Number(form.entry_price),
//         stop_loss: Number(form.stop_loss),
//         symbol: form.symbol,
//       });
//       setResult(r.data);
//     } catch (err) {
//       setError(err.response?.data?.detail || "Calculation failed");
//       setResult(null);
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="space-y-6" data-testid="risk-calculator-page">
//       <div>
//         <div className="flex items-center gap-3">
//           <Calculator className="w-7 h-7 text-eli-gold" />
//           <h1 className="font-heading text-3xl font-bold text-eli-text-white">Risk Calculator</h1>
//         </div>
//         <p className="text-sm text-eli-muted mt-1">Size positions against your 5%-max-risk rule.</p>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//         <form onSubmit={submit} className="eli-card p-5 space-y-4" data-testid="risk-form">
//           <div>
//             <label className="block text-xs uppercase tracking-wider text-eli-muted mb-1.5">
//               Instrument
//             </label>
//             <select
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-eli-muted mb-1.5">
//                 Account Balance ($)
//               </label>
//               <input
//                 type="number"
//                 step="any"
//                 value={form.account_balance}
//                 onChange={(e) => setForm({ ...form, account_balance: e.target.value })}
//                 className="w-full px-3 py-2 bg-eli-border/40 border border-eli-border rounded-sm text-eli-text-white font-mono"
//                 data-testid="risk-balance"
//               />
//             </div>
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-eli-muted mb-1.5">
//                 Risk %
//               </label>
//               <input
//                 type="number"
//                 step="any"
//                 value={form.risk_percentage}
//                 onChange={(e) => setForm({ ...form, risk_percentage: e.target.value })}
//                 className="w-full px-3 py-2 bg-eli-border/40 border border-eli-border rounded-sm text-eli-text-white font-mono"
//                 data-testid="risk-percent"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-eli-muted mb-1.5">
//                 Entry Price
//               </label>
//               <input
//                 type="number"
//                 step="any"
//                 value={form.entry_price}
//                 onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
//                 className="w-full px-3 py-2 bg-eli-border/40 border border-eli-border rounded-sm text-eli-text-white font-mono"
//                 data-testid="risk-entry"
//               />
//             </div>
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-eli-muted mb-1.5">
//                 Stop Loss
//               </label>
//               <input
//                 type="number"
//                 step="any"
//                 value={form.stop_loss}
//                 onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
//                 className="w-full px-3 py-2 bg-eli-border/40 border border-eli-border rounded-sm text-eli-text-white font-mono"
//                 data-testid="risk-stop"
//               />
//             </div>
//           </div>

//           {Number(form.risk_percentage) > 5 && (
//             <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-sm">
//               <AlertTriangle className="w-4 h-4 text-amber-400" />
//               <span className="text-xs text-amber-400">
//                 EliAI strategy rule: max 5% risk per trade.
//               </span>
//             </div>
//           )}

//           {error && <div className="text-sm text-red-400">{error}</div>}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full px-4 py-2.5 bg-eli-gold hover:bg-eli-gold-bright text-eli-navy font-bold rounded-sm disabled:opacity-50"
//             data-testid="risk-calc-btn"
//           >
//             {loading ? "Calculating..." : "Calculate"}
//           </button>
//         </form>

//         <div className="eli-card p-5">
//           <div className="flex items-center gap-2 mb-4">
//             <Target className="w-5 h-5 text-eli-gold" />
//             <h3 className="font-bold text-eli-text-white">Result</h3>
//           </div>
//           {!result ? (
//             <p className="text-sm text-eli-muted">Submit the form to see your sizing breakdown.</p>
//           ) : (
//             <div className="space-y-3" data-testid="risk-result">
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="p-3 bg-eli-border/40 rounded-sm">
//                   <p className="text-[10px] text-eli-muted uppercase tracking-wider">Risk Amount</p>
//                   <p className="font-mono text-2xl font-bold text-eli-gold">${result.risk_amount.toLocaleString()}</p>
//                 </div>
//                 <div className="p-3 bg-eli-border/40 rounded-sm">
//                   <p className="text-[10px] text-eli-muted uppercase tracking-wider">Position Size</p>
//                   <p className="font-mono text-2xl font-bold text-eli-text-white">{result.position_size}</p>
//                 </div>
//               </div>
//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center justify-between py-2 border-b border-eli-border">
//                   <span className="text-eli-muted">Pip Risk</span>
//                   <span className="font-mono text-eli-text-white">{result.pip_risk}</span>
//                 </div>
//                 <div className="flex items-center justify-between py-2 border-b border-eli-border">
//                   <span className="text-eli-muted">Potential Loss</span>
//                   <span className="font-mono text-red-400">−${result.potential_loss.toLocaleString()}</span>
//                 </div>
//                 <div className="flex items-center justify-between py-2 border-b border-eli-border">
//                   <span className="text-eli-muted">Profit @ 2R</span>
//                   <span className="font-mono text-emerald-400">+${result.potential_profit_2r.toLocaleString()}</span>
//                 </div>
//                 <div className="flex items-center justify-between py-2 border-b border-eli-border">
//                   <span className="text-eli-muted">Profit @ 3R</span>
//                   <span className="font-mono text-emerald-400">+${result.potential_profit_3r.toLocaleString()}</span>
//                 </div>
//                 <div className="flex items-center justify-between py-2">
//                   <span className="text-eli-muted">Max Position Value</span>
//                   <span className="font-mono text-eli-text-white">${result.max_position_value.toLocaleString()}</span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import {
  Calculator,
  Target,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Info,
} from "lucide-react";
import { riskAPI } from "../lib/api";
import useInstruments from "../hooks/useInstruments";

export default function RiskCalculator({ inline = false }) {
  const { instruments, loading: instrumentsLoading } = useInstruments();
  const [form, setForm] = useState({
    symbol: "EUR/USD",
    account_balance: 10000,
    risk_percentage: 1,
    entry_price: 1.085,
    stop_loss: 1.082,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPortfolio, setShowPortfolio] = useState(false);;


  const selectedInstrument = instruments.find((i) => i.symbol === form.symbol);

  const calculatePipDistance = () => {
    if (!selectedInstrument || !form.entry_price || !form.stop_loss) return "0";
    const diff = Math.abs(Number(form.entry_price) - Number(form.stop_loss));
    return selectedInstrument.asset_class === "forex"
      ? (diff * 10000).toFixed(1)
      : diff.toFixed(4);
  };

  const calculatePipValue = () => {
    if (!result || !selectedInstrument) return 0;
    const distance = Number(calculatePipDistance());
    if (distance === 0) return 0;
    return result.risk_amount / distance;
  };





  const pipDistance = calculatePipDistance();
  const pipValue = calculatePipValue();
  const isHighRisk = Number(form.risk_percentage) > 2;
  const setSymbol = (sym) => {
    const inst = instruments.find((i) => i.symbol === sym);
    if (!inst) return;
    const price = Number(inst.price) || form.entry_price;
    const decimals = inst.asset_class === "forex" ? 5 : 2;
    const stopDistance = inst.asset_class === "forex" ? 0.005 : price * 0.015;
    const stop = price - stopDistance;
    setForm({
      ...form,
      symbol: sym,
      entry_price: Number(price.toFixed(decimals)),
      stop_loss: Number(stop.toFixed(decimals)),
    });
    setResult(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        account_balance: Number(form.account_balance),
        risk_percentage: Number(form.risk_percentage),
        entry_price: Number(form.entry_price),
        stop_loss: Number(form.stop_loss),
        symbol: form.symbol,
      };
      const r = await riskAPI.calculateRisk(payload);
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Calculation failed");
      setResult(null);
    }
    setLoading(false);
  };
  return (
    <div className={inline ? "space-y-4" : "space-y-6"} data-testid="risk-calculator-page">
      {!inline && (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-eli-gold" />
              <h1 className="font-heading text-4xl font-bold text-eli-text-white">
                Risk Calculator
              </h1>
            </div>
            <p className="text-eli-muted mt-1">
              Professional position sizing with real-time data
            </p>
          </div>
          <button
            onClick={() => setShowPortfolio(!showPortfolio)}
            className="text-sm flex items-center gap-1.5 text-eli-gold hover:text-eli-text-white"
          >
            <DollarSign className="w-4 h-4" />
            {showPortfolio ? "Hide" : "Show"} Portfolio Overview
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="xl:col-span-5 eli-card p-6">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-eli-muted mb-2">
                Instrument
              </label>
              <select
                value={form.symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-4 py-3 bg-eli-border/50 border border-eli-border rounded-sm text-eli-text-white font-medium"
              >
                {instruments.map((i) => (
                  <option key={i.symbol} value={i.symbol}>
                    {i.symbol} — {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-eli-muted mb-2">
                  Account Balance (USD)
                </label>
                <input
                  type="number"
                  value={form.account_balance}
                  onChange={(e) =>
                    setForm({ ...form, account_balance: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-eli-border/50 border border-eli-border rounded-sm text-eli-text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-eli-muted mb-2">
                  Risk per Trade (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={form.risk_percentage}
                  onChange={(e) =>
                    setForm({ ...form, risk_percentage: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-eli-border/50 border border-eli-border rounded-sm text-eli-text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-eli-muted mb-2">
                  Entry Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.entry_price}
                  onChange={(e) =>
                    setForm({ ...form, entry_price: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-eli-border/50 border border-eli-border rounded-sm text-eli-text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-eli-muted mb-2">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.stop_loss}
                  onChange={(e) =>
                    setForm({ ...form, stop_loss: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-eli-border/50 border border-eli-border rounded-sm text-eli-text-white font-mono"
                />
              </div>
            </div>

            {/* $ Per Pip Field */}
            <div className="bg-eli-border/30 p-4 rounded-sm border border-eli-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-eli-muted flex items-center gap-1">
                  <Info className="w-4 h-4" /> $ Per Pip
                </span>
                <span className="font-mono text-eli-text-white font-bold">
                  ${pipValue.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-eli-muted mt-1">
                Distance to Stop Loss:{" "}
                <span className="font-mono">{pipDistance}</span> pips
              </div>
            </div>

            {isHighRisk && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div className="text-sm text-amber-400">
                  Risk exceeds recommended 2%. EliAI suggests keeping risk ≤
                  1-2% per trade.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-eli-gold hover:bg-eli-gold-bright text-eli-navy font-bold text-lg rounded-sm disabled:opacity-60 transition-all"
            >
              {loading ? "Calculating..." : "Calculate Position Size"}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="xl:col-span-7 eli-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-eli-gold" />
            <h3 className="text-xl font-bold text-eli-text-white">
              Position Sizing Result
            </h3>
          </div>

          {!result ? (
            <div className="h-[480px] flex flex-col items-center justify-center text-center">
              <div className="text-6xl opacity-30 mb-6">📐</div>
              <p className="text-eli-muted">
                Enter details and calculate to see position breakdown
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-gradient-to-br from-eli-border to-eli-navy-4 rounded-sm">
                  <p className="text-xs text-eli-muted">RISK AMOUNT</p>
                  <p className="text-4xl font-bold text-eli-gold mt-1">
                    ${result.risk_amount?.toLocaleString()}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-br from-eli-border to-eli-navy-4 rounded-sm">
                  <p className="text-xs text-eli-muted">POSITION SIZE</p>
                  <p className="text-2xl font-bold text-eli-text-white mt-1">
                    {result.position_size}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-eli-border">
                <p className="text-xs text-eli-muted mb-1">TOTAL TRADE VALUE</p>
                <p className="text-4xl font-bold text-eli-text-white">
                  ${result.max_position_value?.toLocaleString()}
                </p>
                <p className="text-sm text-eli-muted">
                  {(((result.max_position_value || 0) / form.account_balance) * 100).toFixed(
                    2,
                  )}
                  % of account
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-eli-border">
                    <span className="text-eli-muted">Pip Value</span>
                    <span className="font-mono">
                      ${pipValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-eli-border">
                    <span className="text-eli-muted">Pips at Risk</span>
                    <span className="font-mono text-eli-text-white">
                      {pipDistance}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-eli-border">
                    <span className="text-eli-muted">2R Target</span>
                    <span className="font-mono text-emerald-400">
                      +${result.potential_profit_2r?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-eli-border">
                    <span className="text-eli-muted">3R Target</span>
                    <span className="font-mono text-emerald-400">
                      +${result.potential_profit_3r?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Overview (Collapsible) */}
      {!inline && showPortfolio && (
        <div className="eli-card p-6 mt-6 bg-gradient-to-br from-eli-navy to-eli-navy-4 border border-eli-gold/20">
          <h3 className="font-bold text-eli-gold mb-6 flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5" /> Portfolio Risk Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="bg-eli-border/30 p-4 rounded-sm border border-eli-border">
                <p className="text-xs text-eli-muted uppercase tracking-wider mb-1">Total Open Risk</p>
                <p className="text-2xl font-bold text-red-400">4.5% <span className="text-sm font-normal text-eli-muted">($450.00)</span></p>
              </div>
              <div className="bg-eli-border/30 p-4 rounded-sm border border-eli-border">
                <p className="text-xs text-eli-muted uppercase tracking-wider mb-1">Available Risk (of 5% Max)</p>
                <p className="text-2xl font-bold text-emerald-400">0.5% <span className="text-sm font-normal text-eli-muted">($50.00)</span></p>
              </div>
            </div>

            <div className="md:col-span-2 bg-eli-navy-3 border border-eli-border rounded-sm p-4">
              <h4 className="text-xs text-eli-muted uppercase tracking-wider mb-4">Current Exposure by Asset Class</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-eli-text-white font-mono">FOREX (EUR/USD, GBP/USD)</span>
                    <span className="text-eli-gold">3.0%</span>
                  </div>
                  <div className="h-2 w-full bg-eli-border rounded-full overflow-hidden">
                    <div className="h-full bg-eli-gold" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-eli-text-white font-mono">INDICES (SPX)</span>
                    <span className="text-emerald-400">1.5%</span>
                  </div>
                  <div className="h-2 w-full bg-eli-border rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-400 mb-1">Correlation Warning</p>
              <p className="text-xs text-eli-slate-300">You have high USD exposure across multiple pairs. A sudden USD move could trigger multiple stop-losses simultaneously.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
