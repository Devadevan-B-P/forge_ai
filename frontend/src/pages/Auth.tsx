import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Eye, EyeOff, Loader2, ArrowRight, Lock, Mail, User, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import SiteNav from "../components/SiteNav";
import SoftAurora from "../components/vendor/SoftAurora";
import ShinyText from "../components/vendor/ShinyText";
import SpotlightCard from "../components/vendor/SpotlightCard";
import { getErrorMessage } from "../services/api";

type Mode = "login" | "signup";

const PASSWORD_RULES = [
  { label: "At least 8 characters",    test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",     test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number",               test: (p: string) => /[0-9]/.test(p) },
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Lock body scroll when Terms Modal is open
  useEffect(() => {
    if (showTermsModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showTermsModal]);

  const passwordStrength = PASSWORD_RULES.filter((r) => r.test(password)).length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && !acceptedTerms) {
      setError("You must accept the Terms and Conditions to sign up.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(null);
    setPassword("");
    setAcceptedTerms(false);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden pt-20 lg:pt-0 bg-[#050505] text-white">
      {/* Floating Pill Nav */}
      <SiteNav />

      {/* Cinematic Background Atmosphere Overlays */}
      <div className="grain-overlay" />
      <div className="animated-vignette" />
      <div className="radial-bg" />

      {/* Interactive Backgrounds */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          <SoftAurora
            speed={0.5}
            scale={1.4}
            brightness={1.0}
            color1="#5FA9FF"
            color2="#3DD9A4"
            noiseFrequency={2.2}
            noiseAmplitude={0.8}
            bandHeight={0.45}
            bandSpread={1.2}
            octaveDecay={0.15}
            layerOffset={0.3}
            colorSpeed={0.8}
            enableMouseInteraction={true}
            mouseInfluence={0.2}
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          CENTERED FORM PANEL
      ──────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center flex-1 relative z-10 px-6 py-12"
      >
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-5">
            <span className="font-serif text-3xl font-medium tracking-tight">
              Forge <span className="font-sans font-semibold text-sm tracking-widest uppercase bg-gradient-to-r from-[#4F9DFF] to-[#7CEEFF] bg-clip-text text-transparent">AI</span>
            </span>
          </div>

          {/* Tagline */}
          <div className="mb-6 flex justify-center">
            <ShinyText
              text={mode === "login" ? "Welcome back. Sign in to continue." : "Create your account to get started."}
              className="text-[#9CA3AF] text-sm text-center font-medium block"
              color="#9CA3AF"
              shineColor="#FFFFFF"
              speed={3.5}
            />
          </div>

          {/* Card */}
          <SpotlightCard className="bg-[#0E1014] rounded-2xl p-7 border border-[#22252B] shadow-[0_0_40px_-10px_rgba(95,169,255,0.15)]" spotlightColor="rgba(95, 169, 255, 0.08)">

            {/* Mode toggle pills */}
            <div className="flex rounded-xl bg-[#050505]/40 p-1 mb-6 gap-1 border border-[#22252B]/40">
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => m !== mode && switchMode()}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === m
                      ? "bg-[#5FA9FF] text-[#050505] shadow-md font-semibold"
                      : "text-[#9CA3AF] hover:text-white"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Name — signup only */}
              <AnimatePresence initial={false}>
                {mode === "signup" && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <User
                        size={14}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === "name" ? "text-[#5FA9FF]" : "text-[#9CA3AF]"
                        }`}
                      />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Full name"
                        className="w-full bg-[#050505]/40 border border-[#22252B] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#9CA3AF]/40 focus:outline-none focus:border-[#5FA9FF] focus:ring-1 focus:ring-[#5FA9FF] transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="relative">
                <Mail
                  size={14}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "email" ? "text-[#5FA9FF]" : "text-[#9CA3AF]"
                  }`}
                />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Email address"
                  className="w-full bg-[#050505]/40 border border-[#22252B] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#9CA3AF]/40 focus:outline-none focus:border-[#5FA9FF] focus:ring-1 focus:ring-[#5FA9FF] transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock
                  size={14}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "password" ? "text-[#5FA9FF]" : "text-[#9CA3AF]"
                  }`}
                />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Password"
                  className="w-full bg-[#050505]/40 border border-[#22252B] rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-[#9CA3AF]/40 focus:outline-none focus:border-[#5FA9FF] focus:ring-1 focus:ring-[#5FA9FF] transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Password strength meter — signup only */}
              <AnimatePresence initial={false}>
                {mode === "signup" && password.length > 0 && (
                  <motion.div
                    key="password-strength"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-2 overflow-hidden"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength
                              ? passwordStrength === 1 ? "bg-red-500/80"
                              : passwordStrength === 2 ? "bg-yellow-500/80"
                              : "bg-[#3DD9A4]"
                              : "bg-white/5"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      {PASSWORD_RULES.map((rule) => (
                        <span
                          key={rule.label}
                          className={`text-[11px] flex items-center gap-1.5 transition-colors ${
                            rule.test(password) ? "text-[#3DD9A4]" : "text-[#9CA3AF]"
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[8px] shrink-0 border-current">
                            {rule.test(password) ? "✓" : ""}
                          </span>
                          {rule.label}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terms & Conditions Checkbox — signup only */}
              <AnimatePresence initial={false}>
                {mode === "signup" && (
                  <motion.div
                    key="terms-checkbox"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <label className="flex gap-2.5 items-start cursor-pointer group mt-1 py-1">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 rounded border border-[#22252B] bg-[#050505]/40 text-[#5FA9FF] focus:ring-0 focus:ring-offset-0 transition-colors cursor-pointer"
                      />
                      <span className="text-[11px] text-[#9CA3AF] leading-relaxed select-none group-hover:text-white transition-colors">
                        I agree to the <span className="text-[#5FA9FF] font-medium hover:underline cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }}>Terms and Conditions</span>
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message */}
              {error && (
                <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#050505] font-semibold hover:bg-[#7AB8FF] transition-all disabled:opacity-60 disabled:cursor-not-allowed h-[46px]"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={mode}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-center gap-2"
                    >
                      {mode === "login" ? (
                        "Sign In"
                      ) : (
                        <><ArrowRight size={16} /> Create Account</>
                      )}
                    </motion.span>
                  </AnimatePresence>
                )}
              </button>
            </form>

            {/* Switch mode */}
            <p className="text-center text-xs text-[#9CA3AF] mt-5">
              {mode === "login" ? (
                <>No account?{" "}
                  <button type="button" onClick={switchMode} className="text-[#5FA9FF] hover:text-[#7AB8FF] hover:underline font-semibold transition-colors">
                    Sign up for free
                  </button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button type="button" onClick={switchMode} className="text-[#5FA9FF] hover:text-[#7AB8FF] hover:underline font-semibold transition-colors">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </SpotlightCard>

          {/* Security note */}
          <p className="text-center text-[11px] text-[#9CA3AF] mt-5 flex items-center justify-center gap-1.5 opacity-60">
            <Lock size={10} />
            Passwords encrypted with bcrypt · Sessions secured via JWT
          </p>
        </div>
      </motion.div>

      {/* ── Terms and Conditions Modal ──────────────────────────── */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#0e1014] border border-[#22252B] rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-[#1c2027] hover:bg-[#252c38] flex items-center justify-center text-[#9AA3AF] hover:text-white transition-colors absolute top-4 right-4"
              >
                <X size={14} />
              </button>

              <h3 className="text-base font-semibold text-white mb-4 pr-6">Terms and Conditions</h3>

              <div className="space-y-3.5 text-xs text-[#9CA3AF] leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
                <p>By signing up to Forge AI, you acknowledge and agree to the following terms:</p>
                <ol className="space-y-3.5 list-decimal pl-4">
                  <li>
                    <strong className="text-white font-medium">Educational & Design Use:</strong> You agree that you are generating architectural blueprints solely for design, planning, and educational purposes.
                  </li>
                  <li>
                    <strong className="text-white font-medium">Fair Use Limits:</strong> All blueprint and code generation runs are subject to standard fair use rate limits to prevent API abuse.
                  </li>
                  <li>
                    <strong className="text-white font-medium">Intellectual Property:</strong> You are responsible for ensuring that your input descriptions and generated architectures do not infringe on any third-party intellectual property.
                  </li>
                  <li>
                    <strong className="text-white font-medium">No Warranties (As-Is):</strong> Forge AI provides recommendations "as is" without warranties of any kind. Implementations should always be audited by human engineers before production deployment.
                  </li>
                </ol>
              </div>

              <button
                onClick={() => setShowTermsModal(false)}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-white text-[#050505] font-semibold text-xs hover:bg-[#7AB8FF] transition-all"
              >
                I Understand & Accept
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
