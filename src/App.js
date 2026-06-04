import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Calculator,
  Calendar,
  BookOpen,
  Menu,
  BarChart3,
  ScrollText,
  Bell,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import "@/App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";
import { toast } from "sonner";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Markets from "./pages/Markets";
import TradeSignals from "./pages/TradeSignals";
import RiskCalculator from "./pages/RiskCalculator";
import EconomicCalendar from "./pages/EconomicCalendar";
import TradeJournal from "./pages/TradeJournal";
import Reports from "./pages/Reports";
import Strategy from "./pages/Strategy";
import Alerts from "./pages/Alerts";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/signals", icon: Sparkles, label: "AI Engine", highlight: true },
  { path: "/markets", icon: TrendingUp, label: "Markets" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/risk-calculator", icon: Calculator, label: "Risk Calculator" },
  { path: "/journal", icon: BookOpen, label: "Trade Journal" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/strategy", icon: ScrollText, label: "Strategy" },
  { path: "/alerts", icon: Bell, label: "Alerts" },
];

const Sidebar = ({ isOpen, setIsOpen, onLogout }) => {
  const location = useLocation();
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-eli-navy border-r border-eli-border z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-eli-border">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="EliAI Trade" className="w-10 h-10" />
              <div>
                <h1 className="font-heading text-lg font-bold tracking-tight">
                  <span className="text-eli-text-white">Eli</span><span className="eli-gradient-text">AI</span>
                  <span className="text-eli-text-white ml-1 font-light">Trade</span>
                </h1>
                <p className="text-[10px] text-eli-gold/70 tracking-[0.18em] uppercase">
                  AI Trading Intelligence
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors duration-200 ${isActive
                    ? "bg-eli-gold/10 text-eli-gold border-l-2 border-eli-gold"
                    : item.highlight
                      ? "text-eli-gold hover:bg-eli-gold/10"
                      : "text-eli-muted hover:bg-eli-border/50 hover:text-eli-text-white"
                    }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/ /g, "-")}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto px-1.5 py-0.5 text-[9px] bg-eli-gold/20 text-eli-gold rounded-sm font-bold tracking-wider">
                      AI
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-eli-border space-y-3">
            <div className="flex items-center gap-2 text-xs text-eli-muted">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Live data · 8 instruments</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-sm transition-colors border border-transparent hover:border-red-500/30"
              data-testid="sidebar-logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const WorldClocks = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (tz) =>
    time.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  return (
    <div className="hidden md:flex items-center gap-4 text-xs font-mono">
      {[
        { tz: "Australia/Sydney", label: "SYD" },
        { tz: "Asia/Tokyo", label: "TYO" },
        { tz: "Europe/London", label: "LON" },
        { tz: "America/New_York", label: "NYC" },
      ].map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          <span className="text-eli-gold/70 tracking-wider">{c.label}</span>
          <span className="text-eli-text-white tabular-nums">{fmt(c.tz)}</span>
        </div>
      ))}
    </div>
  );
};

const Header = ({ setIsOpen, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-30 bg-eli-navy/95 backdrop-blur-sm border-b border-eli-border">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 hover:bg-eli-border rounded-sm transition-colors"
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 lg:flex-none">
          <WorldClocks />
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-eli-border transition-colors"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Ctrl+K)`}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-eli-gold" />
            ) : (
              <Moon className="w-5 h-5 text-eli-gold" />
            )}
          </button>

          {/* Notification bell */}
          <button
            onClick={() => toast("Notification Center opened")}
            className="p-2 rounded-full hover:bg-eli-border transition-colors"
            title="Notifications (Ctrl+M)"
          >
            <Bell className="w-5 h-5 text-eli-gold" />
          </button>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 tracking-wider">LIVE</span>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="p-2 rounded-full hover:bg-red-500/15 transition-colors group"
            title="Logout"
            data-testid="header-logout"
          >
            <LogOut className="w-5 h-5 text-eli-muted group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * Inner component that lives inside BrowserRouter so it can use useNavigate.
 * Keyboard shortcuts and router-dependent hooks go here.
 */
const AppRoutes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+K → toggle theme
      if (e.ctrlKey && !e.shiftKey && e.key === "k") {
        e.preventDefault();
        toggleTheme();
      }
      // Ctrl+L → go to login
      if (e.ctrlKey && !e.shiftKey && e.key === "l") {
        e.preventDefault();
        navigate("/login");
      }
      // Ctrl+M → notification demo
      if (e.ctrlKey && !e.shiftKey && e.key === "m") {
        e.preventDefault();
        toast("Demo notification");
      }
      // Ctrl+Shift+S → submit current form
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, toggleTheme]);

  return (
    <div className="min-h-screen bg-eli-navy">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onLogout={handleLogout} />
      <div className="lg:ml-64">
        <Header setIsOpen={setSidebarOpen} onLogout={handleLogout} />
        <main className="p-4 lg:p-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/signals" element={<ProtectedRoute><TradeSignals /></ProtectedRoute>} />
            <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><EconomicCalendar /></ProtectedRoute>} />
            <Route path="/risk-calculator" element={<ProtectedRoute><RiskCalculator /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><TradeJournal /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/strategy" element={<ProtectedRoute><Strategy /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
