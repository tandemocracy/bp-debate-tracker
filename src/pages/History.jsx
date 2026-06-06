import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ROLES = ["OG", "OO", "CG", "CO"];
const ROLE_COLORS = { OG: "#3266ad", OO: "#c0392b", CG: "#1a7a4a", CO: "#8e44ad" };

export default function History({ session, onEdit, onTranscript }) {
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioUrls, setAudioUrls] = useState({});
  const [filter, setFilter] = useState({ role: "", search: "", minScore: "", maxScore: "" });
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => { fetchSpeeches(); }, []);

  async function fetchSpeeches() {
    setLoading(true);
    const { data } = await supabase.from("speeches").select("*").eq("user_id", session.user.id);
    setSpeeches(data || []);
    // Pre-fetch signed URLs for audio
    const urls = {};
    for (const s of (data || [])) {
      if (s.audio_path) {
        const { data: urlData } = await supabase.storage.from("audio").createSignedUrl(s.audio_path, 3600);
        if (urlData) urls[s.id] = urlData.signedUrl;
      }
    }
    setAudioUrls(urls);
    setLoading(false);
  }

  async function handleDelete(s) {
    if (!window.confirm("Delete this speech?")) return;
    if (s.audio_path) await supabase.storage.from("audio").remove([s.audio_path]);
    await supabase.from("speeches").delete().eq("id", s.id);
    setSpeeches(prev => prev.filter(x => x.id !== s.id));
  }

  function handleExport() {
    const rows = [["Speaker","Motion","Role","Date","Score","Feedback"], ...speeches.map(s=>[s.speaker,s.motion,s.role,s.date,s.score,s.feedback])];
    const csv = rows.map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download="speeches.csv"; a.click();
  }

  const filtered = speeches.filter(s => {
    if (filter.role && s.role !== filter.role) return false;
    if (filter.search && !s.motion?.toLowerCase().includes(filter.search.toLowerCase()) && !s.feedback?.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.minScore && s.score < Number(filter.minScore)) return false;
    if (filter.maxScore && s.score > Number(filter.maxScore)) return false;
    return true;
  }).sort((a,b) => sortBy === "date" ? b.date?.localeCompare(a.date) : b.score - a.score);

  const f = (k,v) => setFilter(x=>({...x,[k]:v}));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search motions or feedback…" value={filter.search} onChange={e=>f("search",e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        <select value={filter.role} onChange={e=>f("role",e.target.value)}>
          <option value="">All roles</option>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <input placeholder="Min score" type="number" value={filter.minScore} onChange={e=>f("minScore",e.target.value)} style={{ width: 90 }} />
        <input placeholder="Max score" type="number" value={filter.maxScore} onChange={e=>f("maxScore",e.target.value)} style={{ width: 90 }} />
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="date">Sort: date</option><option value="score">Sort: score</option>
        </select>
        <button onClick={handleExport} style={{ padding: "6px 14px", fontSize: 13 }}>Export CSV</button>
      </div>

      {loading ? <p style={{ color: "var(--color-text-secondary)" }}>Loading…</p> :
       filtered.length === 0 ? <p style={{ color: "var(--color-text-secondary)" }}>No speeches match your filters.</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(s => (
            <div key={s.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{s.motion}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
                    {s.speaker} · <span style={{ color: ROLE_COLORS[s.role], fontWeight: 500 }}>{s.role}</span> · {s.date}
                  </p>
                  {s.feedback && <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>{s.feedback}</p>}
                  {audioUrls[s.id] && (
                    <div style={{ marginTop: 8 }}>
                      <audio controls style={{ width: "100%", maxWidth: 340, height: 36, borderRadius: "var(--border-radius-md)" }}>
                        <source src={audioUrls[s.id]} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: 500, color: s.score>=80?"var(--color-text-success)":s.score>=65?"var(--color-text-warning)":"var(--color-text-danger)" }}>{s.score}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {s.transcript && <button onClick={()=>onTranscript(s)} style={{ fontSize: 12, padding: "4px 10px" }}>Transcript</button>}
                    <button onClick={()=>onEdit(s)} style={{ fontSize: 12, padding: "4px 10px" }}>Edit</button>
                    <button onClick={()=>handleDelete(s)} style={{ fontSize: 12, padding: "4px 10px", color: "var(--color-text-danger)" }}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}