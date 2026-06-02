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
//   <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#1E3A5F]/50 text-[#D4AF37] border border-[#1E3A5F] rounded-sm">
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
//             <Calendar className="w-7 h-7 text-[#D4AF37]" />
//             <h1 className="font-heading text-3xl font-bold text-white">Economic Calendar</h1>
//           </div>
//           <p className="text-sm text-[#94A3B8] mt-1">
//             Live 2 & 3-star events from Forex Factory · USD · EUR · GBP · JPY · AUD
//           </p>
//         </div>
//         <button
//           onClick={load}
//           disabled={loading}
//           className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#14274A] text-white text-sm rounded-sm transition-colors disabled:opacity-50"
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
//             className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm border transition-colors ${
//               filter === f
//                 ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]"
//                 : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]/50"
//             }`}
//             data-testid={`filter-${f}`}
//           >
//             {f === "ALL" ? "All" : f === "HIGH" ? "★★★ High" : "★★ Medium"}
//           </button>
//         ))}
//         <div className="w-px bg-[#1E3A5F] mx-1" />
//         <button
//           onClick={() => setCcyFilter("ALL")}
//           className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm border ${
//             ccyFilter === "ALL" ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]" : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]/50"
//           }`}
//         >
//           All Ccy
//         </button>
//         {currencies.map((c) => (
//           <button
//             key={c}
//             onClick={() => setCcyFilter(c)}
//             className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-sm border ${
//               ccyFilter === c ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]" : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]/50"
//             }`}
//           >
//             {c}
//           </button>
//         ))}
//       </div>

//       {loading ? (
//         <div className="flex items-center justify-center h-64">
//           <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="eli-card p-12 text-center">
//           <Calendar className="w-12 h-12 text-[#D4AF37]/50 mx-auto mb-3" />
//           <h3 className="text-lg font-semibold text-white">No upcoming events</h3>
//           <p className="text-sm text-[#94A3B8] mt-1">Try changing the filter or check back later.</p>
//         </div>
//       ) : (
//         <div className="space-y-6">
//           {Object.entries(groups).map(([day, evs]) => (
//             <div key={day}>
//               <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-2">{day}</h2>
//               <div className="eli-card divide-y divide-[#1E3A5F]">
//                 {evs.map((e) => (
//                   <div key={e.id} className="px-4 py-3 hover:bg-[#1E3A5F]/30 transition-colors" data-testid={`event-${e.id}`}>
//                     <div className="flex items-center justify-between gap-3">
//                       <div className="flex items-center gap-3 min-w-0 flex-1">
//                         <span className="text-xs font-mono text-[#94A3B8] tabular-nums w-12 shrink-0">
//                           {new Date(e.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
//                         </span>
//                         <CurrencyBadge ccy={e.currency} />
//                         <StarsBadge stars={e.stars} />
//                         <span className="text-sm text-white truncate">{e.title}</span>
//                       </div>
//                       <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-[#94A3B8] shrink-0">
//                         {e.forecast && (
//                           <div>
//                             F: <span className="text-white">{e.forecast}</span>
//                           </div>
//                         )}
//                         {e.previous && (
//                           <div>
//                             P: <span className="text-white">{e.previous}</span>
//                           </div>
//                         )}
//                         {e.actual && (
//                           <div>
//                             A: <span className="text-[#D4AF37]">{e.actual}</span>
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
      className={`px-3 py-0.5 text-xs font-semibold border rounded-sm ${colors[impact] || colors.LOW}`}
    >
      {impact} IMPACT
    </span>
  );
};

export default function EconomicCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // Impact Level
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await calendarAPI.getEvents();
      setEvents(r.data.events || []);
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
      window.open(`/markets?symbol=${encodeURIComponent(symbol)}`, "_blank");
    } else {
      setSelectedEvent(event);
    }
  };

  const openRiskCalculator = (event) => {
    window.open(
      `/risk-calculator?event=${encodeURIComponent(event.title)}&impact=${event.impact}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-6" data-testid="calendar-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="font-heading text-4xl font-bold text-white">
              Economic Calendar
            </h1>
          </div>
          <p className="text-[#94A3B8] mt-1">
            High-impact events with AI Volatility Forecast • Forex &amp; Indices
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] font-bold rounded-sm disabled:opacity-50"
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
            className={`px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-sm border transition-all ${
              filter === f
                ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]"
                : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]"
            }`}
          >
            {f === "ALL"
              ? "All Events"
              : f === "HIGH"
                ? "★★★ High Impact"
                : "★★ Medium Impact"}
          </button>
        ))}

        <div className="w-px bg-[#1E3A5F] mx-2 self-center" />

        {assetClasses.map((asset) => (
          <button
            key={asset}
            onClick={() => setAssetFilter(asset)}
            className={`px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-sm border transition-all ${
              assetFilter === asset
                ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]"
                : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]"
            }`}
          >
            {asset}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="w-9 h-9 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="eli-card p-16 text-center">
          <Calendar className="w-16 h-16 text-[#D4AF37]/40 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-white">
            No matching events
          </h3>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([day, evs]) => (
            <div key={day}>
              <h2 className="text-lg font-semibold text-[#D4AF37] tracking-wider mb-3">
                {day}
              </h2>
              <div className="eli-card divide-y divide-[#1E3A5F]">
                {evs.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className="px-6 py-5 hover:bg-[#1E3A5F]/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5 flex-1">
                        <div className="font-mono text-sm text-[#94A3B8] w-20 shrink-0">
                          {new Date(e.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-white text-[15px]">
                              {e.title}
                            </span>
                            {e.currency && (
                              <span className="text-[#D4AF37] font-mono">
                                ({e.currency})
                              </span>
                            )}
                          </div>
                          {e.description && (
                            <p className="text-xs text-[#94A3B8] mt-1 line-clamp-1">
                              {e.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StarsBadge stars={e.stars || 2} />
                        <ImpactBadge impact={e.impact || "MEDIUM"} />

                        {e.aiVolatility && (
                          <div className="text-xs px-3 py-1 bg-[#1E3A5F] rounded-sm font-mono text-emerald-400">
                            AI ±{e.aiVolatility}%
                          </div>
                        )}

                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openReferencedMarket(e);
                          }}
                          className="text-xs flex items-center gap-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-2 rounded-sm"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Market
                        </button>
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
            <div className="p-6 border-b border-[#1E3A5F] flex items-center justify-between sticky top-0 bg-[#0A1628] z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedEvent.title}
                </h2>
                <p className="text-[#94A3B8] mt-1">
                  {new Date(selectedEvent.date).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-4xl leading-none text-[#94A3B8] hover:text-white transition-colors"
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

              {selectedEvent.description && (
                <p className="text-[#CBD5E1] leading-relaxed text-[15px]">
                  {selectedEvent.description}
                </p>
              )}

              {/* Historic Reaction */}
              {selectedEvent.historic && (
                <div className="bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm p-5">
                  <h4 className="uppercase text-xs tracking-wider text-[#94A3B8] mb-3">
                    Historical Market Reaction
                  </h4>
                  <p className="text-emerald-400 font-medium">
                    +{selectedEvent.historic.move}% average move in first 2
                    hours
                  </p>
                  <div className="h-48 mt-4 bg-[#0F172A] rounded flex items-center justify-center text-xs text-[#94A3B8]">
                    [ Post-Event Price Action Snapshot ]
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-[#1E3A5F]">
                <button
                  onClick={() => openReferencedMarket(selectedEvent)}
                  className="flex-1 py-3.5 rounded-sm font-semibold border border-white/20 hover:bg-white/10 flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Open in Markets
                </button>
                <button
                  onClick={() => openRiskCalculator(selectedEvent)}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] py-3.5 rounded-sm font-bold flex items-center justify-center gap-2"
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
