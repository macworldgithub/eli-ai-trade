import { useState, useEffect } from "react";
import { Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { calendarAPI } from "../lib/api";

const StarsBadge = ({ stars }) => {
  const color = stars === 3 ? "bg-red-500/15 text-red-400 border-red-500/40" : "bg-amber-500/15 text-amber-400 border-amber-500/40";
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm tracking-wider ${color}`}>
      {Array(stars).fill("★").join("")}
    </span>
  );
};

const CurrencyBadge = ({ ccy }) => (
  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#1E3A5F]/50 text-[#D4AF37] border border-[#1E3A5F] rounded-sm">
    {ccy}
  </span>
);

export default function EconomicCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [ccyFilter, setCcyFilter] = useState("ALL");

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

  const currencies = Array.from(new Set(events.map((e) => e.currency)));

  const filtered = events.filter((e) => {
    if (filter === "HIGH" && e.stars !== 3) return false;
    if (filter === "MEDIUM" && e.stars !== 2) return false;
    if (ccyFilter !== "ALL" && e.currency !== ccyFilter) return false;
    return true;
  });

  // Group by date
  const groups = {};
  filtered.forEach((e) => {
    const d = new Date(e.date);
    const key = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  return (
    <div className="space-y-6" data-testid="calendar-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#D4AF37]" />
            <h1 className="font-heading text-3xl font-bold text-white">Economic Calendar</h1>
          </div>
          <p className="text-sm text-[#94A3B8] mt-1">
            Live 2 & 3-star events from Forex Factory · USD · EUR · GBP · JPY · AUD
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#14274A] text-white text-sm rounded-sm transition-colors disabled:opacity-50"
          data-testid="refresh-calendar-btn"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "HIGH", "MEDIUM"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm border transition-colors ${
              filter === f
                ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]"
                : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]/50"
            }`}
            data-testid={`filter-${f}`}
          >
            {f === "ALL" ? "All" : f === "HIGH" ? "★★★ High" : "★★ Medium"}
          </button>
        ))}
        <div className="w-px bg-[#1E3A5F] mx-1" />
        <button
          onClick={() => setCcyFilter("ALL")}
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm border ${
            ccyFilter === "ALL" ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]" : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]/50"
          }`}
        >
          All Ccy
        </button>
        {currencies.map((c) => (
          <button
            key={c}
            onClick={() => setCcyFilter(c)}
            className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-sm border ${
              ccyFilter === c ? "bg-[#D4AF37] text-[#0A1628] border-[#D4AF37]" : "bg-[#1E3A5F]/30 text-[#94A3B8] border-[#1E3A5F] hover:border-[#D4AF37]/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="eli-card p-12 text-center">
          <Calendar className="w-12 h-12 text-[#D4AF37]/50 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No upcoming events</h3>
          <p className="text-sm text-[#94A3B8] mt-1">Try changing the filter or check back later.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([day, evs]) => (
            <div key={day}>
              <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-2">{day}</h2>
              <div className="eli-card divide-y divide-[#1E3A5F]">
                {evs.map((e) => (
                  <div key={e.id} className="px-4 py-3 hover:bg-[#1E3A5F]/30 transition-colors" data-testid={`event-${e.id}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xs font-mono text-[#94A3B8] tabular-nums w-12 shrink-0">
                          {new Date(e.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <CurrencyBadge ccy={e.currency} />
                        <StarsBadge stars={e.stars} />
                        <span className="text-sm text-white truncate">{e.title}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-[#94A3B8] shrink-0">
                        {e.forecast && (
                          <div>
                            F: <span className="text-white">{e.forecast}</span>
                          </div>
                        )}
                        {e.previous && (
                          <div>
                            P: <span className="text-white">{e.previous}</span>
                          </div>
                        )}
                        {e.actual && (
                          <div>
                            A: <span className="text-[#D4AF37]">{e.actual}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
