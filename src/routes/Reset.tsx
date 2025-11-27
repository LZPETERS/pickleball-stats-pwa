import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Reset() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg("Password updated. Redirecting to dashboard…");
      setTimeout(() => nav("/dashboard", { replace: true }), 800);
    } catch (e: any) {
      setErr(e.message ?? "Could not update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 backdrop-blur-md">
        <h1 className="text-2xl font-semibold text-white mb-2">Reset password</h1>
        <p className="text-slate-300 mb-6">
          Enter a new password for your account.
        </p>

        <label className="block text-sm text-slate-300 mb-1">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-sky-500"
          required
        />

        <label className="block text-sm text-slate-300 mb-1">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mb-4 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-sky-500"
          required
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 px-4 py-2 font-semibold text-white shadow-lg shadow-sky-500/20 transition"
        >
          {saving ? "Updating…" : "Update password"}
        </button>

        {msg && (
          <div className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-emerald-200">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-rose-200">
            {err}
          </div>
        )}
      </form>
    </div>
  );
}
