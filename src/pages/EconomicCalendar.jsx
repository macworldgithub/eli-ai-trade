// import { useState, useEffect } from "react";
// import { Calendar, TrendingUp, RefreshCw } from "lucide-react";
// import { calendarAPI } from "../lib/api";

// const StarsBadge = ({ stars }) => {
//   const color = stars === 3 ? "bg-red-500/15 text-red-400 border-red-500/40" : "bg-amber-500/15 text-amber-400 border-amber-500/40";
//   return (
//     <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm tracking-wider ${color}`}>
//       {Array(stars).fill("★").join("")}
//     </span>
//   );
// };

// const CurrencyBadge = ({ ccy }) => (
//   <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-eli-border/50 text-eli-gold border border-eli-border rounded-sm">
//     {ccy}
//   </span>
// );

// export default function EconomicCalendar() {
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState("ALL");
//   const [ccyFilter, setCcyFilter] = useState("ALL");

//   const load = async () => {
//     setLoading(true);
//     try {
//       const r = await calendarAPI.getEvents();
//       setEvents(r.data.events || []);
//     } catch (e) {
//       console.error(e);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const currencies = Array.from(new Set(events.map((e) => e.currency)));

//   const filtered = events.filter((e) => {
//     if (filter === "HIGH" && e.stars !== 3) return false;
//     if (filter === "MEDIUM" && e.stars !== 2) return false;
//     if (ccyFilter !== "ALL" && e.currency !== ccyFilter) return false;
//     return true;
//   });

//   // Group by date
//   const groups = {};
//   filtered.forEach((e) => {
//     const d = new Date(e.date);
//     const key = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
//     if (!groups[key]) groups[key] = [];
//     groups[key].push(e);
//   });

//   return (
//     <div className="space-y-6" data-testid="calendar-page">
//       <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
//         <div>
//           <div className="flex items-center gap-3">
//             <Calendar className="w-7 h-7 text-eli-gold" />
//             <h1 className="font-heading text-3xl font-bold text-eli-text-white">Economic Calendar</h1>
//           </div>
//           <p className="text-sm text-eli-muted mt-1">
//             Live 2 & 3-star events from Forex Factory · USD · EUR · GBP · JPY · AUD
//           </p>
//         </div>
//         <button
//           onClick={load}
//           disabled={loading}
//           className="flex items-center gap-2 px-4 py-2 bg-eli-border hover:bg-eli-navy-3 text-eli-text-white text-sm rounded-sm transition-colors disabled:opacity-50"
//           data-testid="refresh-calendar-btn"
//         >
//           <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//           Refresh
//         </button>
//       </div>

//       <div className="flex flex-wrap gap-2">
//         {["ALL", "HIGH", "MEDIUM"].map((f) => (
//           <button
//             key={f}
//             onClick={() => setFilter(f)}
//             className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors ${
//               filter === f
//                 ? "bg-eli-gold text-eli-navy border-eli-gold"
//                 : "bg-eli-border/30 text-eli-muted border-eli-border hover:border-eli-gold/50"
//             }`}
//             data-testid={`filter-${f}`}
//           >
//             {f === "ALL" ? "All" : f === "HIGH" ? "★★★ High" : "★★ Medium"}
//           </button>
//         ))}
//         <div className="w-px bg-eli-border mx-1" />
//         <button
//           onClick={() => setCcyFilter("ALL")}
//           className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border ${
//             ccyFilter === "ALL" ? "bg-eli-gold text-eli-navy border-eli-gold" : "bg-eli-border/30 text-eli-muted border-eli-border hover:border-eli-gold/50"
//           }`}
//         >
//           All Ccy
//         </button>
//         {currencies.map((c) => (
//           <button
//             key={c}
//             onClick={() => setCcyFilter(c)}
//             className={`px-2.5 py-1.5 text-xs font-mono font-bold rounded-sm border ${
//               ccyFilter === c ? "bg-eli-gold text-eli-navy border-eli-gold" : "bg-eli-border/30 text-eli-muted border-eli-border hover:border-eli-gold/50"
//             }`}
//           >
//             {c}
//           </button>
//         ))}
//       </div>

//       {loading ? (
//         <div className="flex items-center justify-center h-64">
//           <div className="w-8 h-8 border-2 border-eli-gold border-t-transparent rounded-full animate-spin" />
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="eli-card p-12 text-center">
//           <Calendar className="w-12 h-12 text-eli-gold/50 mx-auto mb-3" />
//           <h3 className="text-lg font-bold text-eli-text-white">No upcoming events</h3>
//           <p className="text-sm text-eli-muted mt-1">Try changing the filter or check back later.</p>
//         </div>
//       ) : (
//         <div className="space-y-6">
//           {Object.entries(groups).map(([day, evs]) => (
//             <div key={day}>
//               <h2 className="text-sm font-bold text-eli-gold tracking-wider uppercase mb-2">{day}</h2>
//               <div className="eli-card divide-y divide-eli-border">
//                 {evs.map((e) => (
//                   <div key={e.id} className="px-4 py-3 hover:bg-eli-border/30 transition-colors" data-testid={`event-${e.id}`}>
//                     <div className="flex items-center justify-between gap-3">
//                       <div className="flex items-center gap-3 min-w-0 flex-1">
//                         <span className="text-xs font-mono text-eli-muted tabular-nums w-12 shrink-0">
//                           {new Date(e.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
//                         </span>
//                         <CurrencyBadge ccy={e.currency} />
//                         <StarsBadge stars={e.stars} />
//                         <span className="text-sm text-eli-text-white truncate">{e.title}</span>
//                       </div>
//                       <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-eli-muted shrink-0">
//                         {e.forecast && (
//                           <div>
//                             F: <span className="text-eli-text-white">{e.forecast}</span>
//                           </div>
//                         )}
//                         {e.previous && (
//                           <div>
//                             P: <span className="text-eli-text-white">{e.previous}</span>
//                           </div>
//                         )}
//                         {e.actual && (
//                           <div>
//                             A: <span className="text-eli-gold">{e.actual}</span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  TrendingUp,
  RefreshCw,
  Zap,
  BarChart3,
  Target,
  ExternalLink,
} from "lucide-react";
import { calendarAPI } from "../lib/api";

const StarsBadge = ({ stars }) => {
  const color =
    stars === 3
      ? "bg-red-500/15 text-red-400 border-red-500/40"
      : stars === 2
        ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
        : "bg-blue-500/15 text-blue-400 border-blue-500/40";

  return (
    <span
      className={`px-3 py-0.5 text-xs font-bold border rounded-sm tracking-wider ${color}`}
    >
      {Array(stars).fill("★").join("")}
    </span>
  );
};

const ImpactBadge = ({ impact }) => {
  const colors = {
    HIGH: "bg-red-500/15 text-red-400 border-red-500/40",
    MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/40",
    LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  };
  return (
    <span
      className={`px-3 py-0.5 text-xs font-bold border rounded-sm ${colors[impact] || colors.LOW}`}
    >
      {impact} IMPACT
    </span>
  );
};

export default function EconomicCalendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // Impact Level
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await calendarAPI.getEvents();
      const apiEvents = r.data.events || [];

      // Inject Mock Indices Events (S&P 500, NASDAQ, FTSE, ASX)
      const now = new Date();
      const mockIndicesEvents = [
        {
          id: "idx-spx",
          title: "S&P 500 E-mini Rollover",
          date: new Date(new Date().setHours(now.getHours() + 2, 0, 0)).toISOString(),
          stars: 3,
          impact: "HIGH",
          currency: "SPX",
          symbol: "SPX",
          description: "Quarterly futures contract rollover affecting S&P 500 liquidity and volume.",
          aiVolatility: 1.2,
          relatedSymbol: "S&P 500"
        },
        {
          id: "idx-ndx",
          title: "NASDAQ Tech Sector Earnings",
          date: new Date(new Date().setHours(now.getHours() + 5, 0, 0)).toISOString(),
          stars: 3,
          impact: "HIGH",
          currency: "NDX",
          symbol: "NDX",
          description: "Key earnings reports from major NASDAQ 100 constituents expected after market close.",
          aiVolatility: 2.5,
          relatedSymbol: "NAS100"
        },
        {
          id: "idx-ftse",
          title: "FTSE 100 Rebalancing",
          date: new Date(new Date().setHours(now.getHours() + 18, 0, 0)).toISOString(),
          stars: 2,
          impact: "MEDIUM",
          currency: "UKX",
          symbol: "UKX",
          description: "Index weighting adjustments for UK large caps taking effect at open.",
          aiVolatility: 0.8,
          relatedSymbol: "FTSE 100"
        },
        {
          id: "idx-asx",
          title: "ASX 200 Financials Review",
          date: new Date(new Date().setHours(now.getHours() + 12, 0, 0)).toISOString(),
          stars: 2,
          impact: "MEDIUM",
          currency: "ASX",
          symbol: "ASX",
          description: "Quarterly review of banking sector capital requirements.",
          aiVolatility: 0.6,
          relatedSymbol: "ASX 200"
        }
      ];

      const generateMockChart = () => {
        return Array.from({ length: 24 }).map(() => {
          const isUp = Math.random() > 0.45;
          return {
            height: 10 + Math.random() * 50,
            bottomOffset: 5 + Math.random() * 30,
            isUp,
          };
        });
      };

      const allEvents = [...apiEvents, ...mockIndicesEvents].map(e => ({
        ...e,
        historic: e.historic || {
          move: (Math.random() * 1.5 + 0.3).toFixed(2),
          direction: Math.random() > 0.5 ? "up" : "down",
          chart: generateMockChart()
        }
      })).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      setEvents(allEvents);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const assetClasses = ["ALL", "FOREX", "INDICES", "COMMODITIES"];

  const filtered = events.filter((e) => {
    const impactMatch =
      filter === "ALL" ||
      (filter === "HIGH" && e.impact === "HIGH") ||
      (filter === "MEDIUM" && e.impact === "MEDIUM");

    const assetMatch =
      assetFilter === "ALL" ||
      (assetFilter === "FOREX" &&
        ["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD"].includes(
          e.currency,
        )) ||
      (assetFilter === "INDICES" &&
        ["SPX", "NDX", "UKX", "ASX", "DAX"].includes(e.currency || e.symbol));

    return impactMatch && assetMatch;
  });

  // Group by date
  const groups = {};
  filtered.forEach((e) => {
    const d = new Date(e.date);
    const key = d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const openReferencedMarket = (event) => {
    const symbol =
      event.relatedSymbol ||
      (event.currency === "USD"
        ? "EUR/USD"
        : event.currency
          ? `${event.currency}/USD`
          : null);

    if (symbol) {
      navigate(`/markets?symbol=${encodeURIComponent(symbol)}`);
    } else {
      setSelectedEvent(event);
    }
  };

  const openRiskCalculator = (event) => {
    navigate(`/risk-calculator?event=${encodeURIComponent(event.title)}&impact=${event.impact}`);
  };

  return (
    <div className="space-y-6" data-testid="calendar-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-eli-gold" />
            <h1 className="font-heading text-4xl font-bold text-eli-text-white">
              Economic Calendar
            </h1>
          </div>
          <p className="text-eli-muted mt-1">
            High-impact events with AI Volatility Forecast • Forex &amp; Indices
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-eli-gold hover:bg-eli-gold-bright text-eli-navy font-bold rounded-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {["ALL", "HIGH", "MEDIUM"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-sm border transition-all ${filter === f
              ? "bg-eli-gold text-eli-navy border-eli-gold"
              : "bg-eli-border/30 text-eli-muted border-eli-border hover:border-eli-gold"
              }`}
          >
            {f === "ALL"
              ? "All Events"
              : f === "HIGH"
                ? "★★★ High Impact"
                : "★★ Medium Impact"}
          </button>
        ))}

        <div className="w-px bg-eli-border mx-2 self-center" />

        {assetClasses.map((asset) => (
          <button
            key={asset}
            onClick={() => setAssetFilter(asset)}
            className={`px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-sm border transition-all ${assetFilter === asset
              ? "bg-eli-gold text-eli-navy border-eli-gold"
              : "bg-eli-border/30 text-eli-muted border-eli-border hover:border-eli-gold"
              }`}
          >
            {asset}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="w-9 h-9 border-4 border-eli-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="eli-card p-16 text-center">
          <Calendar className="w-16 h-16 text-eli-gold/40 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-eli-text-white">
            No matching events
          </h3>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([day, evs]) => (
            <div key={day}>
              <h2 className="text-lg font-bold text-eli-gold tracking-wider mb-3">
                {day}
              </h2>
              <div className="eli-card divide-y divide-eli-border">
                {evs.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className="px-6 py-5 hover:bg-eli-border/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5 flex-1">
                        <div className="font-mono text-sm text-eli-muted w-20 shrink-0">
                          {new Date(e.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(ev) => {
                                ev.stopPropagation();
                                openReferencedMarket(e);
                              }}
                              className="font-bold text-eli-text-white text-[15px] hover:text-eli-gold transition-colors text-left flex items-center gap-1.5"
                            >
                              {e.title}
                              <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                            </button>
                            {e.currency && (
                              <span className="text-eli-gold font-mono">
                                ({e.currency})
                              </span>
                            )}
                          </div>
                          {e.description && (
                            <p className="text-xs text-eli-muted mt-1 line-clamp-1">
                              {e.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StarsBadge stars={e.stars || 2} />
                        <ImpactBadge impact={e.impact || "MEDIUM"} />

                        {e.aiVolatility && assetFilter === "INDICES" && (
                          <div className="text-xs px-3 py-1 bg-eli-border rounded-sm font-mono text-emerald-400">
                            AI ±{e.aiVolatility}%
                          </div>
                        )}

                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              openReferencedMarket(e);
                            }}
                            className="text-xs flex items-center gap-1.5 bg-eli-gold/10 hover:bg-eli-gold/20 text-eli-gold px-3 py-2 rounded-sm transition-colors"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Market
                          </button>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              openRiskCalculator(e);
                            }}
                            className="text-xs flex items-center gap-1.5 bg-eli-gold/10 hover:bg-eli-gold/20 text-eli-gold px-3 py-2 rounded-sm transition-colors"
                          >
                            <Target className="w-4 h-4" />
                            Risk
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="eli-card max-w-2xl w-full max-h-[92vh] overflow-auto">
            <div className="p-6 border-b border-eli-border flex items-center justify-between sticky top-0 bg-eli-navy z-10">
              <div>
                <h2 className="text-2xl font-bold text-eli-text-white">
                  {selectedEvent.title}
                </h2>
                <p className="text-eli-muted mt-1">
                  {new Date(selectedEvent.date).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-4xl leading-none text-eli-muted hover:text-eli-text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-7">
              <div className="flex flex-wrap gap-3">
                <StarsBadge stars={selectedEvent.stars} />
                <ImpactBadge impact={selectedEvent.impact} />
                {selectedEvent.aiVolatility && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-sm">
                    <Zap className="w-5 h-5" />
                    AI Predicted Volatility:{" "}
                    <span className="font-bold">
                      ±{selectedEvent.aiVolatility}%
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-eli-navy-3 border border-eli-border rounded-sm p-4 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-eli-muted mb-1">Previous</div>
                  <div className="font-mono text-lg font-bold text-eli-text-white">{selectedEvent.previous || "—"}</div>
                </div>
                <div className="bg-eli-navy-3 border border-eli-border rounded-sm p-4 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-eli-gold/10 rotate-45 transform translate-x-4 -translate-y-4" />
                  <div className="text-[10px] uppercase tracking-wider text-eli-muted mb-1">Forecast</div>
                  <div className="font-mono text-lg font-bold text-eli-gold">{selectedEvent.forecast || "—"}</div>
                </div>
                <div className="bg-eli-navy-3 border border-eli-border rounded-sm p-4 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-eli-muted mb-1">Actual</div>
                  <div className="font-mono text-lg font-bold text-eli-text-white">{selectedEvent.actual || "TBD"}</div>
                </div>
              </div>

              {selectedEvent.description && (
                <p className="text-eli-slate-300 leading-relaxed text-[15px] bg-eli-border/20 p-5 rounded-sm border border-eli-border/50">
                  {selectedEvent.description}
                </p>
              )}

              {/* Historic Reaction */}
              {selectedEvent.historic && (
                <div className="bg-eli-border/40 border border-eli-border rounded-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="uppercase text-xs font-bold tracking-wider text-eli-muted flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-eli-gold" />
                      Historical Market Reaction
                    </h4>
                    <span className={`font-mono text-sm font-bold px-3 py-1 rounded-sm ${selectedEvent.historic.direction === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {selectedEvent.historic.direction === 'up' ? '+' : '-'}{selectedEvent.historic.move}%
                      <span className="text-xs text-eli-muted ml-1 font-normal uppercase tracking-wider">avg move (2h)</span>
                    </span>
                  </div>

                  <div className="h-44 mt-4 bg-eli-navy-3/80 border border-eli-border rounded flex items-end justify-between px-3 pt-6 pb-2 relative group cursor-crosshair">
                    <div className="absolute top-2 left-3 text-[10px] text-eli-muted font-mono tracking-widest uppercase">
                      {selectedEvent.relatedSymbol || `${selectedEvent.currency || 'USD'}`} • 5m Post-Event Snapshot
                    </div>
                    {/* Grid lines */}
                    <div className="absolute inset-0 border-y border-eli-border/30 border-dashed pointer-events-none" style={{ top: '33%', height: '33%' }} />

                    {selectedEvent.historic.chart.map((candle, i) => (
                      <div key={i} className="flex flex-col items-center justify-end w-3 h-full relative">
                        {/* Wick */}
                        <div className={`w-[1px] absolute top-2 bottom-2 ${candle.isUp ? 'bg-emerald-500/30' : 'bg-red-500/30'}`} />
                        {/* Body */}
                        <div
                          className={`w-full z-10 rounded-sm shadow-sm transition-all duration-300 hover:brightness-125 ${candle.isUp ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ height: `${candle.height}%`, marginBottom: `${candle.bottomOffset}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-eli-border">
                <button
                  onClick={() => openReferencedMarket(selectedEvent)}
                  className="flex-1 py-3.5 rounded-sm font-bold border border-eli-overlay-20 hover:bg-eli-overlay-10 flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Open in Markets
                </button>
                <button
                  onClick={() => openRiskCalculator(selectedEvent)}
                  className="flex-1 bg-eli-gold hover:bg-eli-gold-bright text-eli-navy py-3.5 rounded-sm font-bold flex items-center justify-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Risk Calculator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
