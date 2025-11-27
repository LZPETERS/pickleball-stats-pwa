import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setErr(null);
    setInfo(null);
    if (!email) {
      setErr('Enter your email above, then click “Forgot password?”');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`,
      });
      if (error) throw error;
      setInfo("Check your email for a password reset link.");
    } catch (e: any) {
      setErr(e.message ?? "Couldn’t send reset email.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 border border-white/10 backdrop-blur-sm"
          >
            <span className="text-lg font-semibold text-white">PB Stats</span>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-white/10 bg-white/10 p-8 backdrop-blur-md shadow-2xl">
          <h1 className="text-2xl font-semibold mb-2 text-white">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-slate-300 mb-6">
            {mode === "signin"
              ? "Sign in with your email and password."
              : "Use your email and a strong password."}
          </p>

          {info && (
            <div className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-emerald-200">
              {info}
            </div>
          )}
          {err && (
            <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-rose-200">
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Password</label>
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 px-4 py-2 font-semibold text-white shadow-lg shadow-sky-500/20 transition"
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
            </button>
          </form>

          {/* Forgot password (signin mode only) */}
          {mode === "signin" && (
            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-sky-400 hover:text-sky-300 underline underline-offset-4"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-slate-300">
            {mode === "signin" ? (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-sky-400 hover:text-sky-300 underline underline-offset-4"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-sky-400 hover:text-sky-300 underline underline-offset-4"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
