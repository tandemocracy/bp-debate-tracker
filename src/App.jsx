import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import LogSpeech from "./pages/LogSpeech";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Transcript from "./pages/Transcript";

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
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0" }}>
      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", borderBottom: "1px solid var(--color-border-tertiary)", marginBottom: "2.5rem", position: "sticky", top: 0, background: "var(--color-background-primary)", zIndex: 10, backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>BP Speech Tracker</h2>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{session.user.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          {PAGES.map(pg => (
            <button key={pg} onClick={() => { setPage(pg); setEditSpeech(null); }}
              style={{ background: page === pg ? "var(--color-background-secondary)" : "transparent", border: "none", borderRadius: "var(--border-radius-lg)", padding: "7px 14px", cursor: "pointer", color: page === pg ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: page === pg ? 600 : 400, fontSize: 13, textTransform: "capitalize", transition: "all 0.15s ease" }}>
              {pg === "log" ? "Log speech" : pg.charAt(0).toUpperCase() + pg.slice(1)}
            </button>
          ))}
          <div style={{ width: 1, height: 18, background: "var(--color-border-tertiary)", margin: "0 6px" }} />
          <button onClick={() => supabase.auth.signOut()}
            style={{ background: "transparent", border: "none", padding: "7px 14px", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13, borderRadius: "var(--border-radius-lg)" }}>
            Sign out
          </button>
        </div>
      </div>
      <div style={{ padding: "0 2rem 2rem" }}>

      {/* Pages */}
        {page === "dashboard"   && <Dashboard session={session} onEdit={goEdit} onTranscript={goTranscript} setPage={setPage} />}
        {page === "log"         && <LogSpeech session={session} editSpeech={editSpeech} onSaved={() => { setEditSpeech(null); setPage("history"); }} onCancel={() => { setEditSpeech(null); setPage("history"); }} />}
        {page === "history"     && <History session={session} onEdit={goEdit} onTranscript={goTranscript} />}
        {page === "analytics"   && <Analytics session={session} />}
        {page === "transcript"  && <Transcript session={session} speech={transcriptSpeech} onBack={() => setPage("history")} />}
      </div>
    </div>
  );
}