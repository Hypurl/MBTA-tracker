import { useState, useEffect, useCallback } from "react";
import { LINES, LINE_KEYS, GREEN_BRANCHES } from "./lines";

// ─── Themes ──────────────────────────────────────────────────────────
const DARK = {
  bg: "#0a0a0f", surface: "rgba(255,255,255,0.025)", surfaceAlt: "rgba(255,255,255,0.02)",
  border: "rgba(255,255,255,0.06)", borderSubtle: "rgba(255,255,255,0.04)",
  borderInput: "rgba(255,255,255,0.1)", btnBg: "rgba(255,255,255,0.05)",
  btnBgActive: "rgba(255,255,255,0.1)", btnBorder: "rgba(255,255,255,0.08)",
  dirInactBg: "rgba(255,255,255,0.03)", dirInactBdr: "rgba(255,255,255,0.08)",
  dirInactClr: "#94a3b8", text: "#e2e8f0", textStrong: "#f8fafc", textMid: "#94a3b8",
  textMuted: "#475569", textFaint: "#1e293b", textLoading: "#334155",
  colorScheme: "dark", rowFirst: "rgba(255,255,255,0.025)", rowHover: "rgba(255,255,255,0.03)",
};
const LIGHT = {
  bg: "#f8fafc", surface: "rgba(0,0,0,0.025)", surfaceAlt: "rgba(0,0,0,0.015)",
  border: "rgba(0,0,0,0.08)", borderSubtle: "rgba(0,0,0,0.05)",
  borderInput: "rgba(0,0,0,0.12)", btnBg: "rgba(0,0,0,0.04)",
  btnBgActive: "rgba(0,0,0,0.08)", btnBorder: "rgba(0,0,0,0.1)",
  dirInactBg: "rgba(0,0,0,0.02)", dirInactBdr: "rgba(0,0,0,0.1)",
  dirInactClr: "#64748b", text: "#1e293b", textStrong: "#0f172a", textMid: "#64748b",
  textMuted: "#94a3b8", textFaint: "#cbd5e1", textLoading: "#94a3b8",
  colorScheme: "light", rowFirst: "rgba(0,0,0,0.025)", rowHover: "rgba(0,0,0,0.025)",
};

// ─── Helpers ─────────────────────────────────────────────────────────
const API_BASE = "https://train.jeffou.io/api";

function getStatus(min, walk) {
  if (min <= 0.25) return { label: "Now", color: "#f97316", bg: "rgba(249,115,22,0.12)" };
  if (min < walk * 0.7) return { label: "Run", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  if (min < walk * 1.5) return { label: "Walk", color: "#eab308", bg: "rgba(234,179,8,0.1)" };
  return { label: "Relax", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
}

function fmt(min) {
  if (min == null) return "--";
  if (min < 1) return "<1 min";
  if (min < 60) return `${Math.floor(min)} min`;
  return `${Math.floor(min / 60)}h ${Math.floor(min % 60)}m`;
}

const Sun = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const Moon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ─── App ─────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem("mbta_theme");
      if (s === "dark") return true;
      if (s === "light") return false;
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = e => { try { if (!localStorage.getItem("mbta_theme")) setDark(e.matches); } catch { setDark(e.matches); } };
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const toggleTheme = () => {
    const n = !dark;
    setDark(n);
    try { localStorage.setItem("mbta_theme", n ? "dark" : "light"); } catch {}
  };

  const T = dark ? DARK : LIGHT;

  const [lineKey, setLineKey] = useState(() => {
    try { const v = localStorage.getItem("mbta_line"); return v && LINES[v] ? v : "Orange"; } catch { return "Orange"; }
  });
  const [stop, setStop] = useState(() => {
    try {
      const saved = localStorage.getItem("mbta_stop");
      const ln = localStorage.getItem("mbta_line");
      const lineData = ln && LINES[ln] ? LINES[ln] : LINES["Orange"];
      if (saved && lineData.stops.some(s => s.id === saved)) return saved;
      return lineData.stops[0].id;
    } catch { return "place-rcmnl"; }
  });
  const [dir, setDir] = useState(() => {
    try { return localStorage.getItem("mbta_dir") || "0"; } catch { return "0"; }
  });
  const [walkTime, setWalkTime] = useState(() => {
    try { return Number(localStorage.getItem("mbta_walk")) || 5; } catch { return 5; }
  });
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [lastFetch, setLastFetch] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("mbta_line", lineKey);
      localStorage.setItem("mbta_stop", stop);
      localStorage.setItem("mbta_dir", dir);
      localStorage.setItem("mbta_walk", String(walkTime));
    } catch {}
  }, [lineKey, stop, dir, walkTime]);

  const line = LINES[lineKey];
  const accent = line.color;
  const isTerminal = line.terminals.has(stop);
  const stopName = line.stops.find(s => s.id === stop)?.name || stop;
  const dirLabel = line.dirs[+dir];

  // When line changes, pick first stop and reset dir
  const changeLine = (k) => {
    setLineKey(k);
    setDir("0");
    setStop(LINES[k].stops[0].id);
  };

  const fetchPredictions = useCallback(async () => {
    try {
      const dirP = isTerminal ? "" : `&filter[direction_id]=${dir}`;
      const url = `${API_BASE}/predictions?filter[route]=${line.route}&filter[stop]=${stop}${dirP}&sort=arrival_time&page[limit]=10`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      const preds = (json.data || [])
        .filter(p => {
          if (!isTerminal) return p.attributes.departure_time != null;
          return p.attributes.departure_time != null || p.attributes.arrival_time != null;
        })
        .map(p => {
          const t = p.attributes.departure_time ?? p.attributes.arrival_time;
          return t ? new Date(t).getTime() : null;
        })
        .filter(Boolean)
        .sort((a, b) => a - b)
        .slice(0, 5);
      setPredictions(preds);
      setLastFetch(Date.now());
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [stop, dir, isTerminal, line.route]);

  useEffect(() => {
    setLoading(true);
    fetchPredictions();
    const id = setInterval(fetchPredictions, 15000);
    return () => clearInterval(id);
  }, [fetchPredictions]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const futurePreds = predictions.filter(t => t > now - 15000);
  const secsSinceFetch = lastFetch ? Math.max(0, Math.floor((now - lastFetch) / 1000)) : null;
  const progressPct = lastFetch ? Math.min(100, ((now - lastFetch) / 15000) * 100) : 0;
  const isResetting = progressPct < 5;

  // Determine which top-level "group" is active (for Green)
  const isGreen = lineKey.startsWith("Green");
  const activeGroup = isGreen ? "Green" : lineKey;

  const lineGroups = [
    { key: "Orange", label: "Orange", color: "#f97316" },
    { key: "Red", label: "Red", color: "#ef4444" },
    { key: "Blue", label: "Blue", color: "#3b82f6" },
    { key: "Green", label: "Green", color: "#22c55e" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.text,
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      transition: "background 0.2s,color 0.2s",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        select,input{color-scheme:${T.colorScheme}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%{opacity:1;transform:scale(.95)}50%{opacity:.5;transform:scale(1.05)}100%{opacity:1;transform:scale(.95)}}
        .train-row{transition:background .15s}
        .train-row:hover{background:${T.rowHover}!important}
        .line-btn{transition:all .15s;cursor:pointer;border:none;font-weight:600;font-size:12px;letter-spacing:.04em;padding:7px 14px;border-radius:8px}
        .branch-btn{transition:all .15s;cursor:pointer;border:none;font-weight:600;font-size:11px;letter-spacing:.06em;padding:5px 12px;border-radius:6px}
      `}</style>

      <div style={{ width: "100%", maxWidth: 520, position: "relative" }}>
        {/* Progress */}
        <div style={{ width: "100%", height: 3, background: T.borderSubtle, overflow: "hidden" }}>
          <div style={{ height: "100%", background: accent, width: `${progressPct}%`, transition: isResetting ? "none" : "width 1s linear" }} />
        </div>

        <div style={{ padding: "0 0 40px" }}>
          {/* Line Selector */}
          <div style={{ padding: "16px 28px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {lineGroups.map(g => {
                const active = activeGroup === g.key;
                return (
                  <button key={g.key} className="line-btn" onClick={() => {
                    if (g.key === "Green") changeLine("Green-B");
                    else changeLine(g.key);
                  }} style={{
                    background: active ? `${g.color}18` : T.btnBg,
                    color: active ? g.color : T.textMuted,
                    border: active ? `1.5px solid ${g.color}40` : `1.5px solid transparent`,
                    flex: 1,
                  }}>
                    {g.label}
                  </button>
                );
              })}
            </div>

            {/* Green branch sub-selector */}
            {isGreen && (
              <div style={{ display: "flex", gap: 4, animation: "fadeIn .2s ease" }}>
                {GREEN_BRANCHES.map(b => {
                  const active = lineKey === b;
                  const branchLetter = b.split("-")[1];
                  return (
                    <button key={b} className="branch-btn" onClick={() => changeLine(b)} style={{
                      background: active ? "rgba(34,197,94,0.15)" : T.btnBg,
                      color: active ? "#22c55e" : T.textMuted,
                      border: active ? "1.5px solid rgba(34,197,94,0.35)" : `1.5px solid transparent`,
                      flex: 1,
                    }}>
                      {branchLetter}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Header */}
          <div style={{ padding: "20px 28px 20px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, marginBottom: 6 }}>
                  MBTA {lineKey.includes("Green") ? `Green Line ${lineKey.split("-")[1]}` : `${lineKey} Line`}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.textStrong, lineHeight: 1.2 }}>{stopName}</div>
                <div style={{ fontSize: 13, color: T.textMid, marginTop: 3 }}>
                  toward {dirLabel}
                  <span style={{ color: T.textMuted, margin: "0 6px" }}>·</span>
                  {walkTime} min walk
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={toggleTheme} title={dark ? "Light mode" : "Dark mode"} style={{
                  background: "none", border: "none", color: T.textMuted, padding: 6, cursor: "pointer",
                  display: "flex", alignItems: "center", lineHeight: 0, borderRadius: 6,
                }}>{dark ? <Sun /> : <Moon />}</button>
                <button onClick={() => setSettingsOpen(o => !o)} style={{
                  background: settingsOpen ? T.btnBgActive : "none",
                  border: settingsOpen ? `1px solid ${T.btnBorder}` : "1px solid transparent",
                  borderRadius: 6, color: T.textMuted, fontSize: 13, fontWeight: 500, padding: "6px 12px", cursor: "pointer",
                }}>Settings</button>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {settingsOpen && (
            <div style={{ padding: "20px 28px", borderBottom: `1px solid ${T.border}`, animation: "fadeIn .2s ease", background: T.surfaceAlt }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: T.textMuted, display: "block", marginBottom: 8 }}>Station</label>
                  <select value={stop} onChange={e => setStop(e.target.value)} style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8,
                    border: `1px solid ${T.borderInput}`, background: T.surface, color: T.text, fontSize: 14, outline: "none",
                  }}>
                    {line.stops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.branch ? ` (${s.branch})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: T.textMuted, display: "block", marginBottom: 8 }}>Direction</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {line.dirs.map((label, i) => {
                      const d = String(i);
                      const active = dir === d;
                      return (
                        <button key={d} onClick={() => setDir(d)} style={{
                          flex: 1, padding: "10px 0", borderRadius: 8,
                          border: active ? `1px solid ${accent}66` : `1px solid ${T.dirInactBdr}`,
                          background: active ? `${accent}1a` : T.dirInactBg,
                          color: active ? accent : T.dirInactClr,
                          fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
                        }}>{label}</button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: T.textMuted, display: "block", marginBottom: 8 }}>
                    Walk time — <span style={{ color: T.text, textTransform: "none", letterSpacing: 0 }}>{walkTime} min</span>
                  </label>
                  <input type="range" min={1} max={20} value={walkTime} onChange={e => setWalkTime(+e.target.value)} style={{ width: "100%", accentColor: accent }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                    <span>1 min</span><span>20 min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Train List */}
          <div style={{ padding: "8px 0" }}>
            {loading && (
              <div style={{ padding: "40px 28px", color: T.textLoading, fontSize: 14, textAlign: "center" }}>Loading predictions...</div>
            )}
            {!loading && futurePreds.length === 0 && !error && (
              <div style={{ padding: "40px 28px", color: T.textLoading, fontSize: 14, textAlign: "center" }}>No upcoming trains</div>
            )}
            {!loading && futurePreds.map((t, i) => {
              const mins = (t - now) / 60000;
              const st = getStatus(mins, walkTime);
              const timeStr = new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
              const isFirst = i === 0;
              return (
                <div key={t} className="train-row" style={{
                  display: "flex", alignItems: "center", padding: "16px 28px",
                  borderBottom: `1px solid ${T.borderSubtle}`,
                  background: isFirst ? T.rowFirst : "transparent", gap: 16,
                }}>
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: st.color, flexShrink: 0, opacity: isFirst ? 1 : 0.7 }} />
                  <div style={{
                    minWidth: 80, fontSize: isFirst ? 28 : 22, fontWeight: 700,
                    fontVariantNumeric: "tabular-nums", color: isFirst ? T.textStrong : T.textMid,
                    letterSpacing: "-0.02em", fontFamily: "'SF Mono','Fira Code',monospace",
                  }}>
                    {mins < 1 ? `${Math.max(0, Math.floor(mins * 60))}s` : fmt(mins)}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: T.textMuted }}>{timeStr}</div>
                  <div style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    letterSpacing: ".08em", textTransform: "uppercase",
                    color: st.color, background: st.bg, border: `1px solid ${st.color}22`,
                  }}>{st.label}</div>
                </div>
              );
            })}
          </div>

          {error && (
            <div style={{
              margin: "8px 28px", padding: "10px 14px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8, fontSize: 12, color: "#f87171",
            }}>{error} — retrying</div>
          )}

          {/* Footer */}
          <div style={{
            padding: "16px 28px 0", fontSize: 12, color: T.textMuted,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
                boxShadow: "0 0 8px rgba(34,197,94,0.6)", animation: "pulse 2s infinite ease-in-out",
              }} />
              <span>Live</span>
            </div>
            <span>{secsSinceFetch != null ? `Updating in ${Math.max(0, 15 - secsSinceFetch)}s` : "Connecting..."}</span>
          </div>
        </div>
      </div>
    </div>
  );
}