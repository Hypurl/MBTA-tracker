import { useState, useEffect, useCallback, useRef } from "react";

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

const API_BASE = "https://train.jeffou.io/api";

const STATUS = {
  DILLY: { label: "Dilly Dally", emoji: "🍦", bg: "#0d7a3e", glow: "#10b95c", sub: "You've got all the time in the world" },
  WALK: { label: "Walk", emoji: "🚶", bg: "#b8860b", glow: "#e6a817", sub: "Steady pace, you'll make it" },
  HUSTLE: { label: "Hustle!", emoji: "⚡", bg: "#c4500a", glow: "#e8721f", sub: "Pick up the pace!" },
  RUN: { label: "RUN!", emoji: "🏃", bg: "#b91c1c", glow: "#ef4444", sub: "Go go go!" },
  MISSED: { label: "Missed It", emoji: "😮‍💨", bg: "#4a4458", glow: "#7c6f99", sub: "Catch the next one" },
  ARRIVING: { label: "Arriving!", emoji: "🚇", bg: "#c4500a", glow: "#f97316", sub: "It's pulling in NOW" },
  NO_SERVICE: { label: "No Trains", emoji: "🌙", bg: "#1e1e2e", glow: "#444", sub: "Service may have ended" },
  LOADING: { label: "Loading...", emoji: "⏳", bg: "#1e1e2e", glow: "#555", sub: "Fetching predictions" },
};

function getStatus(minutesToTrain, walkTime) {
  if (minutesToTrain === null) return STATUS.NO_SERVICE;
  if (minutesToTrain <= 0.25) return STATUS.ARRIVING;
  if (minutesToTrain < walkTime * 0.5) return STATUS.MISSED;
  if (minutesToTrain < walkTime * 0.85) return STATUS.RUN;
  if (minutesToTrain < walkTime * 1.3) return STATUS.HUSTLE;
  if (minutesToTrain < walkTime * 2.2) return STATUS.WALK;
  return STATUS.DILLY;
}

function fmt(min) {
  if (min === null || min === undefined) return "--";
  if (min < 1) return "<1 min";
  if (min < 60) return `${Math.floor(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${h}h ${m}m`;
}

function CircleTimer({ pct, color, size = 220, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease, stroke 0.6s ease" }} />
    </svg>
  );
}

function Shoe({ color, bounce }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: 48,
      animation: bounce ? "shoeWalk 0.4s ease infinite alternate" : "none",
      filter: `drop-shadow(0 0 12px ${color})`
    }}>👟</span>
  );
}

export default function App() {
  const [stop, setStop] = useState(() => {
    try { return localStorage.getItem("mbta_stop") || "place-forhl"; } catch { return "place-forhl"; }
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const intervalRef = useRef(null);

  const fetchPredictions = useCallback(async () => {
    try {
      const url = `${API_BASE}/predictions?filter[route]=Orange&filter[stop]=${stop}&filter[direction_id]=${dir}&sort=departure_time&page[limit]=5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      const preds = (json.data || [])
        .map(p => {
          const t = p.attributes.departure_time || p.attributes.arrival_time;
          return t ? new Date(t).getTime() : null;
        })
        .filter(Boolean)
        .sort((a, b) => a - b);
      setPredictions(preds);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [stop, dir]);

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
  const next = futurePreds[0] || null;
  const after = futurePreds[1] || null;

  const minsToNext = next ? (next - now) / 60000 : null;
  const minsToAfter = after ? (after - now) / 60000 : null;

  const status = loading ? STATUS.LOADING : getStatus(minsToNext, walkTime);
  const isUrgent = status === STATUS.RUN || status === STATUS.HUSTLE || status === STATUS.ARRIVING;
  const ringPct = minsToNext !== null ? Math.min(minsToNext / (walkTime * 3), 1) : 0;

  const dirLabel = dir === "0" ? "→ Oak Grove" : "→ Forest Hills";
  const stopName = ORANGE_STOPS.find(s => s.id === stop)?.name || stop;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      background: status.bg, color: "#fff", fontFamily: "'Segoe UI', system-ui, sans-serif",
      transition: "background 0.8s ease", overflow: "hidden", position: "relative"
    }}>
      <style>{`
        @keyframes shoeWalk { from { transform: translateY(0) rotate(-5deg); } to { transform: translateY(-8px) rotate(5deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        @keyframes urgentPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.03); } }
        @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        * { box-sizing: border-box; }
        select, input { color-scheme: dark; }
      `}</style>

      {/* Top bar */}
      <div style={{
        width: "100%", maxWidth: 480, display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "16px 20px 0"
      }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, opacity: 0.6 }}>MBTA Orange Line</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{stopName} <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 14 }}>{dirLabel}</span></div>
        </div>
        <button onClick={() => setSettingsOpen(!settingsOpen)} style={{
          background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 12, padding: "8px 14px",
          color: "#fff", fontSize: 18, cursor: "pointer"
        }}>⚙️</button>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div style={{
          width: "100%", maxWidth: 480, padding: "16px 20px", animation: "slideUp 0.3s ease",
          background: "rgba(0,0,0,0.25)", borderRadius: 16, margin: "12px 20px 0"
        }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>Station</label>
            <select value={stop} onChange={e => setStop(e.target.value)} style={{
              width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 15, marginTop: 4, outline: "none"
            }}>
              {ORANGE_STOPS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>Direction</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {["0", "1"].map(d => (
                <button key={d} onClick={() => setDir(d)} style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
                  background: dir === d ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
                  color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: dir === d ? 700 : 400
                }}>{d === "0" ? "→ Oak Grove" : "→ Forest Hills"}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>
              Walk to station: <strong style={{ color: "#fff", opacity: 1 }}>{walkTime} min</strong>
            </label>
            <input type="range" min={1} max={20} value={walkTime} onChange={e => setWalkTime(+e.target.value)}
              style={{ width: "100%", marginTop: 6, accentColor: status.glow }} />
          </div>
        </div>
      )}

      {/* Main display */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "20px 20px 40px", width: "100%", maxWidth: 480
      }}>
        {/* Circle + countdown */}
        <div style={{ position: "relative", marginBottom: 20, animation: isUrgent ? "urgentPulse 0.8s ease infinite" : "none" }}>
          <CircleTimer pct={ringPct} color={status.glow} size={220} stroke={10} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>{status.emoji}</div>
            <div style={{
              fontSize: minsToNext !== null && minsToNext < 100 ? 42 : 32,
              fontWeight: 800, fontVariantNumeric: "tabular-nums", marginTop: 4,
              animation: isUrgent ? "pulse 1s ease infinite" : "none"
            }}>
              {minsToNext !== null ? (minsToNext < 1 ? `${Math.max(0, Math.floor(minsToNext * 60))}s` : fmt(minsToNext)) : "--"}
            </div>
          </div>
        </div>

        {/* Status label */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: 36, fontWeight: 900, textTransform: "uppercase", letterSpacing: 3,
            textShadow: `0 0 40px ${status.glow}`, lineHeight: 1.1
          }}>
            {status.label}
          </div>
          <div style={{ fontSize: 14, opacity: 0.6, marginTop: 6 }}>{status.sub}</div>
        </div>

        {/* Shoes animation */}
        {status !== STATUS.NO_SERVICE && status !== STATUS.LOADING && (
          <div style={{ display: "flex", gap: 12, marginBottom: 28, minHeight: 56 }}>
            {(status === STATUS.DILLY) && <Shoe color={status.glow} bounce={false} />}
            {(status === STATUS.WALK) && <><Shoe color={status.glow} bounce={true} /><Shoe color={status.glow} bounce={true} /></>}
            {(status === STATUS.HUSTLE) && <><Shoe color={status.glow} bounce={true} /><Shoe color={status.glow} bounce={true} /><Shoe color={status.glow} bounce={true} /></>}
            {(status === STATUS.RUN || status === STATUS.ARRIVING) && (
              <>{[0,1,2,3].map(i => <Shoe key={i} color={status.glow} bounce={true} />)}</>
            )}
          </div>
        )}

        {/* Next trains cards */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <TrainCard label="Next Train" minutes={minsToNext} time={next} glow={status.glow} primary />
          <TrainCard label="Following Train" minutes={minsToAfter} time={after} glow={status.glow} />
          {futurePreds.length > 2 && (
            <div style={{
              display: "flex", gap: 8, justifyContent: "center", padding: "4px 0", flexWrap: "wrap"
            }}>
              {futurePreds.slice(2).map((t, i) => {
                const m = (t - now) / 60000;
                return (
                  <span key={i} style={{
                    background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "4px 10px",
                    fontSize: 12, opacity: 0.5
                  }}>+{fmt(m)}</span>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: "10px 16px", background: "rgba(239,68,68,0.15)",
            borderRadius: 10, fontSize: 13, opacity: 0.8, textAlign: "center"
          }}>
            ⚠️ {error} — retrying...
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 20px 16px", opacity: 0.3, fontSize: 11, textAlign: "center" }}>
        Live data from MBTA V3 API · Refreshes every 15s
      </div>
    </div>
  );
}

function TrainCard({ label, minutes, time, glow, primary }) {
  const timeStr = time ? new Date(time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--";
  return (
    <div style={{
      background: primary ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
      borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
      border: primary ? `1px solid rgba(255,255,255,0.12)` : "1px solid rgba(255,255,255,0.05)"
    }}>
      <div>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.5 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {minutes !== null ? fmt(minutes) : "—"}
        </div>
      </div>
      <div style={{
        fontSize: 14, opacity: 0.5, background: "rgba(255,255,255,0.06)",
        borderRadius: 8, padding: "4px 10px"
      }}>{timeStr}</div>
    </div>
  );
}