import { useState, useEffect, useCallback } from "react";

const ORANGE_STOPS = [
  { id: "place-ogmnl", name: "Oak Grove" },
  { id: "place-mlmnl", name: "Malden Center" },
  { id: "place-welln", name: "Wellington" },
  { id: "place-astao", name: "Assembly" },
  { id: "place-sull", name: "Sullivan Square" },
  { id: "place-ccmnl", name: "Community College" },
  { id: "place-north", name: "North Station" },
  { id: "place-haecl", name: "Haymarket" },
  { id: "place-state", name: "State" },
  { id: "place-dwnxg", name: "Downtown Crossing" },
  { id: "place-chncl", name: "Chinatown" },
  { id: "place-tumnl", name: "Tufts Medical Center" },
  { id: "place-bbsta", name: "Back Bay" },
  { id: "place-masta", name: "Massachusetts Ave" },
  { id: "place-ruggl", name: "Ruggles" },
  { id: "place-rcmnl", name: "Roxbury Crossing" },
  { id: "place-jaksn", name: "Jackson Square" },
  { id: "place-sbmnl", name: "Stony Brook" },
  { id: "place-grnst", name: "Green Street" },
  { id: "place-forhl", name: "Forest Hills" },
];

// Terminal stops don't have departure times, only arrivals
const TERMINAL_STOPS = new Set(["place-ogmnl", "place-forhl"]);

const API_BASE = "https://train.jeffou.io/api";

const DARK = {
  bg:           "#0a0a0f",
  surface:      "rgba(255,255,255,0.025)",
  surfaceAlt:   "rgba(255,255,255,0.02)",
  border:       "rgba(255,255,255,0.06)",
  borderSubtle: "rgba(255,255,255,0.04)",
  borderInput:  "rgba(255,255,255,0.1)",
  btnBg:        "rgba(255,255,255,0.05)",
  btnBgActive:  "rgba(255,255,255,0.1)",
  btnBorder:    "rgba(255,255,255,0.08)",
  dirInactBg:   "rgba(255,255,255,0.03)",
  dirInactBdr:  "rgba(255,255,255,0.08)",
  dirInactClr:  "#94a3b8",
  text:         "#e2e8f0",
  textStrong:   "#f8fafc",
  textMid:      "#94a3b8",
  textMuted:    "#475569",
  textFaint:    "#1e293b",
  textLoading:  "#334155",
  colorScheme:  "dark",
  rowFirst:     "rgba(255,255,255,0.025)",
  rowHover:     "rgba(255,255,255,0.03)",
};

const LIGHT = {
  bg:           "#f8fafc",
  surface:      "rgba(0,0,0,0.025)",
  surfaceAlt:   "rgba(0,0,0,0.015)",
  border:       "rgba(0,0,0,0.08)",
  borderSubtle: "rgba(0,0,0,0.05)",
  borderInput:  "rgba(0,0,0,0.12)",
  btnBg:        "rgba(0,0,0,0.04)",
  btnBgActive:  "rgba(0,0,0,0.08)",
  btnBorder:    "rgba(0,0,0,0.1)",
  dirInactBg:   "rgba(0,0,0,0.02)",
  dirInactBdr:  "rgba(0,0,0,0.1)",
  dirInactClr:  "#64748b",
  text:         "#1e293b",
  textStrong:   "#0f172a",
  textMid:      "#64748b",
  textMuted:    "#94a3b8",
  textFaint:    "#cbd5e1",
  textLoading:  "#94a3b8",
  colorScheme:  "light",
  rowFirst:     "rgba(0,0,0,0.025)",
  rowHover:     "rgba(0,0,0,0.025)",
};

function getTrainStatus(minutes, walkTime) {
  if (minutes <= 0.25) return { label: "Now",   color: "#f97316", bg: "rgba(249,115,22,0.12)" };
  if (minutes < walkTime * 0.7)  return { label: "Run",   color: "#ef4444", bg: "rgba(239,68,68,0.1)"  };
  if (minutes < walkTime * 1.5)  return { label: "Walk",  color: "#eab308", bg: "rgba(234,179,8,0.1)"  };
  return                                 { label: "Relax", color: "#22c55e", bg: "rgba(34,197,94,0.1)"  };
}

function fmt(min) {
  if (min === null || min === undefined) return "--";
  if (min < 1) return "<1 min";
  if (min < 60) return `${Math.floor(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${h}h ${m}m`;
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2"  x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="2"  y1="12" x2="4"  y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("mbta_theme");
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch { return true; }
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      try {
        if (!localStorage.getItem("mbta_theme")) setDark(e.matches);
      } catch { setDark(e.matches); }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem("mbta_theme", next ? "dark" : "light"); } catch {}
  };

  const T = dark ? DARK : LIGHT;

  const [stop, setStop] = useState(() => {
    try { return localStorage.getItem("mbta_stop") || "place-ruggl"; } catch { return "place-ruggl"; }
  });
  const [dir, setDir] = useState(() => {
    try { return localStorage.getItem("mbta_dir") || "0"; } catch { return "0"; }
  });
  const [walkTime, setWalkTime] = useState(() => {
    try { return Number(localStorage.getItem("mbta_walk")) || 5; } catch { return 5; }
  });

  useEffect(() => {
    try {
      localStorage.setItem("mbta_stop", stop);
      localStorage.setItem("mbta_dir", dir);
      localStorage.setItem("mbta_walk", String(walkTime));
    } catch {}
  }, [stop, dir, walkTime]);

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [lastFetch, setLastFetch] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isTerminal = TERMINAL_STOPS.has(stop);

  const fetchPredictions = useCallback(async () => {
    try {
      // Terminal stops: omit direction filter since all trains head one way out
      const dirParam = isTerminal ? "" : `&filter[direction_id]=${dir}`;
      const url = `${API_BASE}/predictions?filter[route]=Orange&filter[stop]=${stop}${dirParam}&sort=arrival_time&page[limit]=10`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      const preds = (json.data || [])
        .filter(p => {
          // For non-terminal stops, require a departure_time to exclude
          // terminal-bound predictions that leak through with null departures
          if (!isTerminal) return p.attributes.departure_time != null;
          // For terminal stops, accept either departure or arrival time
          return p.attributes.departure_time != null || p.attributes.arrival_time != null;
        })
        .map(p => {
          // Prefer departure_time for through-stations, arrival_time for terminals
          const t = p.attributes.departure_time ?? p.attributes.arrival_time;
          return t ? new Date(t).getTime() : null;
        })
        .filter(Boolean)
        .sort((a, b) => a - b)
        .slice(0, 5);
      setPredictions(preds);
      setLastFetch(Date.now());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [stop, dir, isTerminal]);

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
  const stopName = ORANGE_STOPS.find(s => s.id === stop)?.name || stop;
  const dirLabel = dir === "0" ? "Forest Hills" : "Oak Grove";
  
  // Progress calculations
  const secsSinceFetch = lastFetch ? Math.max(0, Math.floor((now - lastFetch) / 1000)) : null;
  const progressPct = lastFetch ? Math.min(100, ((now - lastFetch) / 15000) * 100) : 0;
  const isResetting = progressPct < 5; 

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      color: T.text,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      transition: "background 0.2s, color 0.2s",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        select, input { color-scheme: ${T.colorScheme}; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 1; transform: scale(0.95); } 50% { opacity: 0.5; transform: scale(1.05); } 100% { opacity: 1; transform: scale(0.95); } }
        .train-row { transition: background 0.15s; }
        .train-row:hover { background: ${T.rowHover} !important; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 520, position: "relative" }}>
        
        {/* Top Progress Bar */}
        <div style={{ width: "100%", height: 3, background: T.borderSubtle, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            background: "#f97316",
            width: `${progressPct}%`,
            transition: isResetting ? "none" : "width 1s linear"
          }} />
        </div>

        <div style={{ padding: "0 0 40px" }}>
          {/* Header */}
          <div style={{ padding: "25px 28px 20px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "#f97316", marginBottom: 6,
                }}>
                  MBTA Orange Line
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.textStrong, lineHeight: 1.2 }}>
                  {stopName}
                </div>
                <div style={{ fontSize: 13, color: T.textMid, marginTop: 3 }}>
                  toward {dirLabel}
                  <span style={{ color: T.textMuted, margin: "0 6px" }}>·</span>
                  {walkTime} min walk
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={toggleTheme}
                  title={dark ? "Switch to light mode" : "Switch to dark mode"}
                  style={{
                    background: "none", border: "none",
                    color: T.textMuted, padding: "6px",
                    cursor: "pointer", display: "flex", alignItems: "center", lineHeight: 0,
                    borderRadius: 6,
                  }}
                >
                  {dark ? <SunIcon /> : <MoonIcon />}
                </button>

                <button
                  onClick={() => setSettingsOpen(o => !o)}
                  style={{
                    background: settingsOpen ? T.btnBgActive : "none",
                    border: settingsOpen ? `1px solid ${T.btnBorder}` : "1px solid transparent",
                    borderRadius: 6,
                    color: T.textMuted,
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  Settings
                </button>
              </div>
            </div>
          </div>

          {/* Settings panel */}
          {settingsOpen && (
            <div style={{
              padding: "20px 28px",
              borderBottom: `1px solid ${T.border}`,
              animation: "fadeIn 0.2s ease",
              background: T.surfaceAlt,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: T.textMuted, display: "block", marginBottom: 8,
                  }}>
                    Station
                  </label>
                  <select
                    value={stop}
                    onChange={e => setStop(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 8,
                      border: `1px solid ${T.borderInput}`,
                      background: T.surface, color: T.text,
                      fontSize: 14, outline: "none",
                    }}
                  >
                    {ORANGE_STOPS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: T.textMuted, display: "block", marginBottom: 8,
                  }}>
                    Direction
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[["0", "Forest Hills"], ["1", "Oak Grove"]].map(([d, label]) => (
                      <button
                        key={d}
                        onClick={() => setDir(d)}
                        style={{
                          flex: 1, padding: "10px 0", borderRadius: 8,
                          border: dir === d ? "1px solid rgba(249,115,22,0.4)" : `1px solid ${T.dirInactBdr}`,
                          background: dir === d ? "rgba(249,115,22,0.1)" : T.dirInactBg,
                          color: dir === d ? "#fb923c" : T.dirInactClr,
                          fontSize: 13, fontWeight: dir === d ? 600 : 400, cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: T.textMuted, display: "block", marginBottom: 8,
                  }}>
                    Walk time — <span style={{ color: T.text, textTransform: "none", letterSpacing: 0 }}>{walkTime} min</span>
                  </label>
                  <input
                    type="range" min={1} max={20} value={walkTime}
                    onChange={e => setWalkTime(+e.target.value)}
                    style={{ width: "100%", accentColor: "#f97316" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                    <span>1 min</span><span>20 min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Train list */}
          <div style={{ padding: "8px 0" }}>
            {loading && (
              <div style={{ padding: "40px 28px", color: T.textLoading, fontSize: 14, textAlign: "center" }}>
                Loading predictions...
              </div>
            )}

            {!loading && futurePreds.length === 0 && !error && (
              <div style={{ padding: "40px 28px", color: T.textLoading, fontSize: 14, textAlign: "center" }}>
                No upcoming trains
              </div>
            )}

            {!loading && futurePreds.map((t, i) => {
              const mins = (t - now) / 60000;
              const st = getTrainStatus(mins, walkTime);
              const timeStr = new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
              const isFirst = i === 0;

              return (
                <div
                  key={t}
                  className="train-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "16px 28px",
                    borderBottom: `1px solid ${T.borderSubtle}`,
                    background: isFirst ? T.rowFirst : "transparent",
                    gap: 16,
                  }}
                >
                  <div style={{
                    width: 3, height: 36, borderRadius: 2,
                    background: st.color, flexShrink: 0,
                    opacity: isFirst ? 1 : 0.7,
                  }} />

                  <div style={{
                    minWidth: 80,
                    fontSize: isFirst ? 28 : 22,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: isFirst ? T.textStrong : T.textMid,
                    letterSpacing: "-0.02em",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                  }}>
                    {mins < 1 ? `${Math.max(0, Math.floor(mins * 60))}s` : fmt(mins)}
                  </div>

                  <div style={{ flex: 1, fontSize: 13, color: T.textMuted }}>
                    {timeStr}
                  </div>

                  <div style={{
                    padding: "4px 10px", borderRadius: 6,
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: st.color, background: st.bg,
                    border: `1px solid ${st.color}22`,
                  }}>
                    {st.label}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div style={{
              margin: "8px 28px", padding: "10px 14px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8, fontSize: 12, color: "#f87171",
            }}>
              {error} — retrying
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: "16px 28px 0", fontSize: 12, color: T.textMuted,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px rgba(34, 197, 94, 0.6)",
                animation: "pulse 2s infinite ease-in-out"
              }} />
              <span>Live</span>
            </div>
            <span>
              {secsSinceFetch !== null 
                ? `Updating in ${Math.max(0, 15 - secsSinceFetch)}s` 
                : "Connecting..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}