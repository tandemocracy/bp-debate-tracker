import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import LogSpeech from "./pages/LogSpeech";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Transcript from "./pages/Transcript";

window._supabase = supabase;

const PAGES = ["dashboard", "log", "history", "analytics"];

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [editSpeech, setEditSpeech] = useState(null);
  const [transcriptSpeech, setTranscriptSpeech] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  function goEdit(speech) { setEditSpeech(speech); setPage("log"); }
  function goTranscript(speech) { setTranscriptSpeech(speech); setPage("transcript"); }

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-secondary)" }}>Loading…</div>;
  if (!session) return <Auth />;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "1rem" }}>
      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>BP Debate Tracker</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{session.user.email}</p>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          {PAGES.map(pg => (
            <button key={pg} onClick={() => { setPage(pg); setEditSpeech(null); }}
              style={{ background: page === pg ? "var(--color-background-secondary)" : "transparent", border: "none", borderRadius: "var(--border-radius-md)", padding: "6px 12px", cursor: "pointer", color: page === pg ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: page === pg ? 500 : 400, fontSize: 14, textTransform: "capitalize" }}>
              {pg === "log" ? "Log speech" : pg.charAt(0).toUpperCase() + pg.slice(1)}
            </button>
          ))}
          <button onClick={() => supabase.auth.signOut()}
            style={{ background: "transparent", border: "none", padding: "6px 12px", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Pages */}
      {page === "dashboard"   && <Dashboard session={session} onEdit={goEdit} onTranscript={goTranscript} setPage={setPage} />}
      {page === "log"         && <LogSpeech session={session} editSpeech={editSpeech} onSaved={() => { setEditSpeech(null); setPage("history"); }} onCancel={() => { setEditSpeech(null); setPage("history"); }} />}
      {page === "history"     && <History session={session} onEdit={goEdit} onTranscript={goTranscript} />}
      {page === "analytics"   && <Analytics session={session} />}
      {page === "transcript"  && <Transcript session={session} speech={transcriptSpeech} onBack={() => setPage("history")} />}
    </div>
  );
}