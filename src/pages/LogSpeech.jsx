import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const ROLES = ["OG", "OO", "CG", "CO"];
const ROLE_LABELS = { OG: "Opening Govt", OO: "Opening Opp", CG: "Closing Govt", CO: "Closing Opp" };

const blank = (name = "") => ({ speaker: name, motion: "", role: "OG", date: "", score: "", feedback: "", transcript: "" });

export default function LogSpeech({ session, editSpeech, onSaved, onCancel }) {
  const [form, setForm] = useState(blank(session.user.user_metadata?.full_name || ""));
  const [audioFile, setAudioFile] = useState(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editSpeech) {
      setForm({
        speaker: editSpeech.speaker || "",
        motion: editSpeech.motion || "",
        role: editSpeech.role || "OG",
        date: editSpeech.date || "",
        score: String(editSpeech.score || ""),
        feedback: editSpeech.feedback || "",
        transcript: editSpeech.transcript || "",
      });
      if (editSpeech.audio_path) {
        const { data } = supabase.storage.from("audio").getPublicUrl(editSpeech.audio_path);
        if (data?.publicUrl) setExistingAudioUrl(data.publicUrl);
      }
    } else {
      setForm(blank(session.user.user_metadata?.full_name || ""));
      setAudioFile(null);
      setExistingAudioUrl(null);
    }
  }, [editSpeech]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.motion && !form.date && !form.score && !form.speaker && !form.feedback && !form.transcript && !audioFile) { setError("Please fill in at least one field."); return; }
    setSaving(true); setError("");

    let audio_path = editSpeech?.audio_path || null;

    // Upload new audio if provided
    if (audioFile) {
      const ext = audioFile.name.split(".").pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("audio").upload(path, audioFile);
      if (uploadErr) { setError("Audio upload failed: " + uploadErr.message); setSaving(false); return; }
      // Remove old file if editing
      if (editSpeech?.audio_path) await supabase.storage.from("audio").remove([editSpeech.audio_path]);
      audio_path = path;
    }

    const payload = { ...form, score: Number(form.score), user_id: session.user.id, audio_path };

    let err;
    if (editSpeech) {
      ({ error: err } = await supabase.from("speeches").update(payload).eq("id", editSpeech.id));
    } else {
      ({ error: err } = await supabase.from("speeches").insert(payload));
    }

    if (err) setError(err.message);
    else onSaved();
    setSaving(false);
  }

  const ta = (key, rows, placeholder) => (
    <textarea rows={rows} placeholder={placeholder} value={form[key]} onChange={e => set(key, e.target.value)}
      style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", fontSize: 14, padding: "8px 12px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)" }} />
  );

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.25rem" }}>{editSpeech ? "Edit speech" : "Log a speech"}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        <div><label style={lbl}>Speaker</label><input value={form.speaker} onChange={e => set("speaker", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} /></div>
        <div><label style={lbl}>Motion</label><input placeholder="THW / THBT / TH…" value={form.motion} onChange={e => set("motion", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={lbl}>Role</label>
            <select value={form.role} onChange={e => set("role", e.target.value)} style={{ width: "100%" }}>
              {ROLES.map(r => <option key={r} value={r}>{r} — {ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Date</label><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} /></div>
          <div><label style={lbl}>Score (0–100)</label><input type="number" min="0" max="100" value={form.score} onChange={e => set("score", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} /></div>
        </div>

        <div><label style={lbl}>Feedback / notes</label>{ta("feedback", 3, "Judge comments, personal reflections…")}</div>

        {/* Audio upload */}
        <div>
          <label style={lbl}>Audio recording (optional)</label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--color-background-secondary)", border: "0.5px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: "10px 16px", fontSize: 14, color: "var(--color-text-secondary)", boxSizing: "border-box" }}>
            <span>🎙️</span>
            <span>{audioFile ? audioFile.name : existingAudioUrl ? "Replace existing audio…" : "Upload MP3 file"}</span>
            <input type="file" accept="audio/mpeg,.mp3" onChange={e => { setAudioFile(e.target.files[0] || null); }} style={{ display: "none" }} />
          </label>
          {(audioFile || existingAudioUrl) && (
            <div style={{ marginTop: 8 }}>
              <audio controls style={{ width: "100%", borderRadius: "var(--border-radius-md)" }}>
                <source src={audioFile ? URL.createObjectURL(audioFile) : existingAudioUrl} type="audio/mpeg" />
              </audio>
              <button onClick={() => { setAudioFile(null); setExistingAudioUrl(null); }} style={{ fontSize: 12, padding: "3px 10px", marginTop: 6, color: "var(--color-text-danger)" }}>Remove audio</button>
            </div>
          )}
        </div>

        <div><label style={lbl}>Transcript (optional)</label>{ta("transcript", 6, "Paste your speech transcript here…")}</div>

        {error && <p style={{ color: "var(--color-text-danger)", fontSize: 13, margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px" }}>{saving ? "Saving…" : editSpeech ? "Save changes" : "Log speech"}</button>
          <button onClick={onCancel} style={{ padding: "8px 16px" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const lbl = { fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 };