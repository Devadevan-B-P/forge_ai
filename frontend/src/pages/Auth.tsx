import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight, Lock, Mail, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

type Mode = "login" | "signup";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function Auth() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/generator";

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordStrength = PASSWORD_RULES.filter((r) => r.test(password)).length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(null);
    setPassword("");
  };

  return (
    <div className="page-enter min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-accent2/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-display text-3xl font-bold tracking-tight">
            forge<span className="text-accent2">ai</span>
          </span>
          <p className="text-slate-500 text-sm mt-2">
            {mode === "login"
              ? "Welcome back. Sign in to continue."
              : "Create your account to get started."}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-glow">
          {/* Mode Toggle Pills */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-7 gap-1">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => m !== mode && switchMode()}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === m
                    ? "bg-accent text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name field — signup only */}
            {mode === "signup" && (
              <div className="relative">
                <User
                  size={15}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "name" ? "text-accent2" : "text-slate-500"
                  }`}
                />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Full name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-accent2/60 focus:bg-white/8 transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail
                size={15}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  focusedField === "email" ? "text-accent2" : "text-slate-500"
                }`}
              />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="Email address"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-accent2/60 focus:bg-white/8 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                size={15}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  focusedField === "password" ? "text-accent2" : "text-slate-500"
                }`}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="Password"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-11 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-accent2/60 focus:bg-white/8 transition-all"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Password strength indicator — signup only */}
            {mode === "signup" && password.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < passwordStrength
                          ? passwordStrength === 1
                            ? "bg-red-400"
                            : passwordStrength === 2
                            ? "bg-yellow-400"
                            : "bg-emerald-400"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {PASSWORD_RULES.map((rule) => (
                    <span
                      key={rule.label}
                      className={`text-[11px] flex items-center gap-1.5 transition-colors ${
                        rule.test(password) ? "text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[8px] shrink-0 border-current">
                        {rule.test(password) ? "✓" : ""}
                      </span>
                      {rule.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium shadow-glow hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : mode === "login" ? (
                <>
                  <Sparkles size={17} />
                  Sign In
                </>
              ) : (
                <>
                  <ArrowRight size={17} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Switch mode link */}
          <p className="text-center text-xs text-slate-500 mt-6">
            {mode === "login" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-accent2 hover:underline font-medium"
                >
                  Sign up for free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-accent2 hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Security note */}
        <p className="text-center text-[11px] text-slate-600 mt-5 flex items-center justify-center gap-1.5">
          <Lock size={10} />
          Passwords encrypted with bcrypt · Sessions secured via JWT
        </p>
      </div>
    </div>
  );
}
