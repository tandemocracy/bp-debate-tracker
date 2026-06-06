import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [msg, setMsg] = useState({ text: "", error: false });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleLogin() {
    setLoading(true); setMsg({ text: "", error: false });
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) setMsg({ text: error.message, error: true });
    setLoading(false);
  }

  async function handleRegister() {
    if (!form.name) { setMsg({ text: "Please enter your name.", error: true }); return; }
    setLoading(true); setMsg({ text: "", error: false });
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.name } }
    });
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: "Check your email to confirm your account.", error: false });
    setLoading(false);
  }

  async function handleForgot() {
    setLoading(true); setMsg({ text: "", error: false });
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: window.location.origin
    });
    if (error) setMsg({ text: error.message, error: true });
    else setMsg({ text: "Password reset email sent! Check your inbox.", error: false });
    setLoading(false);
  }

  const input = (placeholder, type, key) => (
    <input placeholder={placeholder} type={type} value={form[key]}
      onChange={e => set(key, e.target.value)}
      onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : mode === "register" ? handleRegister() : handleForgot())}
      style={{ width: "100%", boxSizing: "border-box" }} />
  );

  return (
    <div style={{ maxWidth: 400, margin: "5rem auto", padding: "0 1.5rem" }}>
      <div style={{ marginBottom: "0.4rem" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.4px" }}>BP Speech Tracker</h2>
      </div>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: "2rem" }}>
        {mode === "login" ? "Sign in to continue" : mode === "register" ? "Create your account" : "Reset your password"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "register" && input("Full name", "text", "name")}
        {input("Email", "email", "email")}
        {mode !== "forgot" && input("Password", "password", "password")}

        {msg.text && <p style={{ fontSize: 13, margin: 0, color: msg.error ? "var(--color-text-danger)" : "var(--color-text-success)" }}>{msg.text}</p>}

        <button disabled={loading} onClick={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleForgot} style={{ padding: "8px 16px" }}>
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset email"}
        </button>

        {mode === "login" && (
          <p style={{ fontSize: 13, textAlign: "center", margin: 0, color: "var(--color-text-secondary)" }}>
            <span onClick={() => { setMode("forgot"); setMsg({ text: "", error: false }); }} style={{ color: "var(--color-text-info)", cursor: "pointer" }}>Forgot password?</span>
          </p>
        )}

        <p style={{ fontSize: 13, textAlign: "center", margin: 0, color: "var(--color-text-secondary)" }}>
          {mode === "login" ? <>New user? <span onClick={() => { setMode("register"); setMsg({ text: "", error: false }); }} style={{ color: "var(--color-text-info)", cursor: "pointer" }}>Register</span></> :
           mode === "register" ? <>Have an account? <span onClick={() => { setMode("login"); setMsg({ text: "", error: false }); }} style={{ color: "var(--color-text-info)", cursor: "pointer" }}>Sign in</span></> :
           <span onClick={() => { setMode("login"); setMsg({ text: "", error: false }); }} style={{ color: "var(--color-text-info)", cursor: "pointer" }}>Back to sign in</span>}
        </p>
      </div>
    </div>
  );
}