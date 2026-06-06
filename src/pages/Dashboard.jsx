import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ROLE_COLORS = { OG: "#3266ad", OO: "#c0392b", CG: "#1a7a4a", CO: "#8e44ad" };
const ROLE_LABELS = { OG: "Opening Govt", OO: "Opening Opp", CG: "Closing Govt", CO: "Closing Opp" };

export default function Dashboard({ session, onEdit, onTranscript, setPage }) {
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("speeches").select("*").eq("user_id", session.user.id)
      .order("date", { ascending: false }).limit(5)
      .then(({ data }) => { setSpeeches(data || []); setLoading(false); });
  }, []);

  const avg = speeches.length ? Math.round(speeches.reduce((a, s) => a + s.score, 0) / speeches.length) : "—";
  const best = speeches.length ? Math.max(...speeches.map(s => s.score)) : "—";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        {[["Speeches logged", speeches.length], ["Average score", avg], ["Best score", best]].map(([label, val]) => (
          <div key={label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem" }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>{val}</p>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: "0.75rem" }}>Recent speeches</h3>
      {loading ? <p style={{ color: "var(--color-text-secondary)" }}>Loading…</p> :
       speeches.length === 0 ? <p style={{ color: "var(--color-text-secondary)" }}>No speeches yet. Log your first one!</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {speeches.map(s => (
            <div key={s.id} onClick={() => s.transcript && onTranscript(s)}
              style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: s.transcript ? "pointer" : "default" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{s.motion}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
                  <span style={{ color: ROLE_COLORS[s.role], fontWeight: 500 }}>{s.role}</span> · {s.date}
                </p>
              </div>
              <span style={{ fontSize: 22, fontWeight: 500, color: s.score >= 80 ? "var(--color-text-success)" : s.score >= 65 ? "var(--color-text-warning)" : "var(--color-text-danger)" }}>{s.score}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setPage("log")} style={{ marginTop: "1rem", padding: "8px 16px" }}>+ Log new speech</button>
    </div>
  );
}