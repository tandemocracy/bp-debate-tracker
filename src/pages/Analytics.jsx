import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const ROLES = ["OG", "OO", "CG", "CO"];
const ROLE_LABELS = { OG: "Opening Govt", OO: "Opening Opp", CG: "Closing Govt", CO: "Closing Opp" };
const ROLE_COLORS = { OG: "#3266ad", OO: "#c0392b", CG: "#1a7a4a", CO: "#8e44ad" };

export default function Analytics({ session }) {
  const [speeches, setSpeeches] = useState([]);

  useEffect(() => {
    supabase.from("speeches").select("score,role,date").eq("user_id", session.user.id)
      .order("date", { ascending: true })
      .then(({ data }) => setSpeeches(data || []));
  }, []);

  const chartData = speeches.map(s => ({ date: s.date?.slice(5), score: s.score }));
  const roleData = ROLES.map(r => {
    const rs = speeches.filter(s => s.role === r);
    return { role: r, count: rs.length, avg: rs.length ? Math.round(rs.reduce((a,s)=>a+s.score,0)/rs.length) : null };
  });

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.25rem" }}>Progress over time</h3>
      {chartData.length < 2 ? <p style={{ color: "var(--color-text-secondary)" }}>Log at least 2 speeches to see your chart.</p> : (
        <div style={{ width: "100%", height: 260, marginBottom: "2rem" }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0,100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3266ad" strokeWidth={2} dot={{ r: 4, fill: "#3266ad" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: "0.75rem" }}>Breakdown by role</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {roleData.map(r => (
          <div key={r.role} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem", borderLeft: `3px solid ${ROLE_COLORS[r.role]}` }}>
            <p style={{ margin: "0 0 2px", fontWeight: 500, fontSize: 15, color: ROLE_COLORS[r.role] }}>{r.role}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{ROLE_LABELS[r.role]}</p>
            <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 500 }}>{r.count}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>speeches{r.avg !== null ? ` · avg ${r.avg}` : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}