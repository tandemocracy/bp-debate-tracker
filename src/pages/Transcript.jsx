import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ROLE_LABELS = { OG: "Opening Govt", OO: "Opening Opp", CG: "Closing Govt", CO: "Closing Opp" };

export default function Transcript({ session, speech, onBack }) {
  const [annotations, setAnnotations] = useState([]);
  const [selectedText, setSelectedText] = useState(null);
  const [annotationNote, setAnnotationNote] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!speech) return;
    fetchAnnotations();
    if (speech.audio_path) {
      const { data } = supabase.storage.from("audio").getPublicUrl(speech.audio_path);
      if (data?.publicUrl) setAudioUrl(data.publicUrl);
    }
  }, [speech]);

  async function fetchAnnotations() {
    const { data } = await supabase.from("annotations").select("*").eq("speech_id", speech.id).order("created_at");
    setAnnotations(data || []);
  }

  function handleTextSelect() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const txt = sel.toString().trim();
    if (txt.length > 0) { setSelectedText(txt); setShowInput(true); setAnnotationNote(""); }
  }

  async function saveAnnotation() {
    if (!selectedText || !annotationNote) return;
    setSaving(true);
    const { data, error } = await supabase.from("annotations").insert({
      speech_id: speech.id, user_id: session.user.id, quote: selectedText, note: annotationNote
    }).select().single();
    if (!error && data) setAnnotations(a => [...a, data]);
    setShowInput(false); setSelectedText(null); setAnnotationNote("");
    window.getSelection()?.removeAllRanges();
    setSaving(false);
  }

  async function deleteAnnotation(id) {
    await supabase.from("annotations").delete().eq("id", id);
    setAnnotations(a => a.filter(x => x.id !== id));
  }

  if (!speech) return null;

  return (
    <div>
      <button onClick={onBack} style={{ fontSize: 13, marginBottom: "1rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: 0 }}>← Back to history</button>
      <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{speech.motion}</h3>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
        {speech.speaker} · {ROLE_LABELS[speech.role]} · {speech.date}
      </p>

      {audioUrl && (
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>🎙️ Speech recording</p>
          <audio controls style={{ width: "100%", borderRadius: "var(--border-radius-md)" }}>
            <source src={audioUrl} type="audio/mpeg" />
          </audio>
        </div>
      )}

      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>Select any text below to add an annotation.</p>
      <div onMouseUp={handleTextSelect}
        style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "1.25rem", lineHeight: 1.8, fontSize: 15, marginBottom: "1.25rem", userSelect: "text", cursor: "text", whiteSpace: "pre-wrap" }}>
        {speech.transcript || <span style={{ color: "var(--color-text-tertiary)" }}>No transcript text added.</span>}
      </div>

      {showInput && (
        <div style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
            Annotating: <em style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>"{selectedText?.slice(0, 80)}{selectedText?.length > 80 ? "…" : ""}"</em>
          </p>
          <textarea rows={2} placeholder="Add your note…" value={annotationNote} onChange={e => setAnnotationNote(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", fontSize: 14, padding: "8px 12px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={saveAnnotation} disabled={saving} style={{ fontSize: 13, padding: "5px 14px" }}>{saving ? "Saving…" : "Save annotation"}</button>
            <button onClick={() => { setShowInput(false); setSelectedText(null); window.getSelection()?.removeAllRanges(); }} style={{ fontSize: 13, padding: "5px 14px" }}>Cancel</button>
          </div>
        </div>
      )}

      {annotations.length > 0 && (
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 500, marginBottom: "0.75rem" }}>Annotations ({annotations.length})</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {annotations.map(a => (
              <div key={a.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderLeft: "3px solid #8e44ad", borderRadius: "var(--border-radius-md)", padding: "10px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic" }}>"{a.quote}"</p>
                <p style={{ margin: 0, fontSize: 14 }}>{a.note}</p>
                <button onClick={() => deleteAnnotation(a.id)} style={{ fontSize: 12, padding: "2px 8px", marginTop: 6, color: "var(--color-text-danger)" }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}