import { useState, useEffect } from "react";
import { Bell, Mail, Plus, Trash2, Send, RefreshCw, CheckCircle2, AlertTriangle, Eye } from "lucide-react";
import { alertsAPI } from "../lib/api";
import { toast } from "sonner";

const SMTPBanner = ({ cfg }) => {
  if (!cfg) return null;
  if (cfg.smtp_configured) {
    return (
      <div className="eli-card p-4 border-emerald-500/40" data-testid="smtp-banner">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-emerald-400">SMTP configured · alerts are live</h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Host: <span className="font-mono text-white">{cfg.smtp_host}</span> · From:{" "}
              <span className="font-mono text-white">{cfg.smtp_from}</span> · Lead:{" "}
              <span className="text-[#D4AF37] font-semibold">{cfg.lead_minutes} min</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="eli-card p-4 border-amber-500/40" data-testid="smtp-banner">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-400">SMTP not configured · alerts are staged but not sent</h3>
          <p className="text-xs text-[#94A3B8] mt-1">
            The scheduler is running and tracks every 3-star event. To start sending real emails, add 4 env vars to{" "}
            <code className="text-[#D4AF37] bg-[#1E3A5F]/50 px-1.5 py-0.5 rounded">/app/backend/.env</code> and restart backend:
          </p>
          <pre className="text-[11px] font-mono text-[#CBD5E1] bg-[#0A1628] border border-[#1E3A5F] rounded-sm p-3 mt-2 overflow-x-auto">
{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@eliai.trade
SMTP_PASS=<gmail-app-password>
SMTP_FROM=alerts@eliai.trade
SMTP_TLS=1`}
          </pre>
          <p className="text-[11px] text-[#94A3B8] mt-2">
            Uses Python <code className="text-[#D4AF37]">smtplib</code> (stdlib) — no third-party SDK. Lead time:{" "}
            <span className="text-[#D4AF37] font-semibold">{cfg.lead_minutes} min</span> · scheduler runs every 5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

const PreviewDrawer = ({ open, onClose, preview }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="eli-card p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="preview-drawer"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-bold text-white">Email Preview</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white text-sm">Close</button>
        </div>
        <p className="text-xs text-[#94A3B8] mb-2 font-mono">Subject: <span className="text-white">{preview?.subject}</span></p>
        <div
          className="bg-white rounded-sm overflow-hidden"
          dangerouslySetInnerHTML={{ __html: preview?.html || "" }}
        />
      </div>
    </div>
  );
};

export default function Alerts() {
  const [cfg, setCfg] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [history, setHistory] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = async () => {
    try {
      const [c, r, h] = await Promise.all([
        alertsAPI.getConfig(),
        alertsAPI.listRecipients(),
        alertsAPI.history(20),
      ]);
      setCfg(c.data);
      setRecipients(r.data.recipients || []);
      setHistory(h.data.history || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addRecipient = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAdding(true);
    try {
      await alertsAPI.addRecipient(email);
      toast.success("Recipient added");
      setNewEmail("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to add");
    }
    setAdding(false);
  };

  const toggle = async (rec) => {
    setBusyId(rec.id);
    try {
      await alertsAPI.toggleRecipient(rec.id, rec.email, !rec.enabled);
      load();
    } catch (e) {
      toast.error("Toggle failed");
    }
    setBusyId(null);
  };

  const remove = async (rec) => {
    if (!window.confirm(`Remove ${rec.email}?`)) return;
    setBusyId(rec.id);
    try {
      await alertsAPI.deleteRecipient(rec.id);
      toast.success("Removed");
      load();
    } catch (e) {
      toast.error("Remove failed");
    }
    setBusyId(null);
  };

  const showPreview = async () => {
    try {
      const r = await alertsAPI.preview();
      setPreview(r.data);
      setPreviewOpen(true);
    } catch (e) {
      toast.error("Preview failed");
    }
  };

  const testSend = async () => {
    setTesting(true);
    try {
      const r = await alertsAPI.testSend();
      if (r.data.sent) {
        toast.success(`Test sent to ${r.data.recipients?.length || 0} recipient(s)`);
      } else {
        toast.message(`SMTP not configured — preview logged for ${r.data.recipients?.length || 0} recipient(s)`);
      }
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Test failed");
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6" data-testid="alerts-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Bell className="w-7 h-7 text-[#D4AF37]" />
            <h1 className="font-heading text-3xl font-bold text-white">Pre-Event Alerts</h1>
          </div>
          <p className="text-sm text-[#94A3B8] mt-1">
            30-minute lead emails for every 3-star calendar event affecting your traded currencies.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={showPreview}
            className="flex items-center gap-2 px-3 py-2 bg-[#1E3A5F] hover:bg-[#14274A] text-white text-sm rounded-sm"
            data-testid="preview-btn"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button
            onClick={testSend}
            disabled={testing || recipients.filter((r) => r.enabled).length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] font-bold text-sm rounded-sm disabled:opacity-50"
            data-testid="test-send-btn"
          >
            <Send className={`w-4 h-4 ${testing ? "animate-pulse" : ""}`} />
            {testing ? "Sending..." : "Test Send"}
          </button>
        </div>
      </div>

      <SMTPBanner cfg={cfg} />

      {/* Recipients */}
      <div className="eli-card p-4">
        <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase mb-3">Recipients</h2>

        <div className="flex gap-2 mb-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="trader@eliai.trade"
            onKeyDown={(e) => e.key === "Enter" && addRecipient()}
            className="flex-1 px-3 py-2 bg-[#1E3A5F]/40 border border-[#1E3A5F] rounded-sm text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            data-testid="new-recipient-input"
          />
          <button
            onClick={addRecipient}
            disabled={adding || !newEmail.includes("@")}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:bg-[#F4C430] text-[#0A1628] text-sm font-bold rounded-sm disabled:opacity-50"
            data-testid="add-recipient-btn"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {recipients.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-4">No recipients yet.</p>
        ) : (
          <div className="divide-y divide-[#1E3A5F]" data-testid="recipients-list">
            {recipients.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="font-mono text-sm text-white truncate">{r.email}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggle(r)}
                    disabled={busyId === r.id}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${
                      r.enabled
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                        : "bg-[#1E3A5F]/40 text-[#94A3B8] border-[#1E3A5F]"
                    }`}
                    data-testid={`toggle-${r.id}`}
                  >
                    {r.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    onClick={() => remove(r)}
                    disabled={busyId === r.id}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-sm"
                    data-testid={`delete-${r.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send history */}
      <div className="eli-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#D4AF37] tracking-wider uppercase">Send History</h2>
          <button onClick={load} className="text-[#94A3B8] hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-[#94A3B8] py-4 text-center">
            No alerts dispatched yet. The scheduler checks every 5 minutes for 3-star events firing within{" "}
            <span className="text-[#D4AF37]">{cfg?.lead_minutes ?? 30} min</span>.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#94A3B8] border-b border-[#1E3A5F]">
                <th className="text-left py-2">Sent</th>
                <th className="text-left">Event</th>
                <th className="text-left">Ccy</th>
                <th className="text-right">Recipients</th>
              </tr>
            </thead>
            <tbody data-testid="history-list">
              {history.map((h, idx) => (
                <tr key={`${h.event_id}-${idx}`} className="border-b border-[#1E3A5F]/50">
                  <td className="py-2 text-[#94A3B8] font-mono text-xs">
                    {new Date(h.sent_at).toLocaleString()}
                  </td>
                  <td className="text-white">{h.title}</td>
                  <td className="text-[#D4AF37] font-mono">{h.currency}</td>
                  <td className="text-right text-[#94A3B8] font-mono">{h.recipients?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} preview={preview} />
    </div>
  );
}
