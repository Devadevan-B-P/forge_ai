import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Github, BookOpen,
  ChevronDown, ArrowRight, CheckCircle2, Loader2,
} from "lucide-react";
import SiteNav from "../components/SiteNav";
import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const CONTACT_TEMPLATE = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID;
const AUTO_REPLY_TEMPLATE = import.meta.env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/* ─── Particle Background ─────────────────────────────────────────────── */
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PARTICLE_COUNT = 90;
    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; blue: boolean;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.4,
        opacity: Math.random() * 0.5 + 0.1,
        blue: Math.random() < 0.35,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.blue
          ? `rgba(95, 169, 255, ${p.opacity})`
          : `rgba(255, 255, 255, ${p.opacity * 0.6})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ─── Contact Card ─────────────────────────────────────────────────────── */
interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  primary: string;
  lines: string[];
  href?: string;
  delay?: number;
}

function ContactCard({ icon, title, primary, lines, href, delay = 0 }: ContactCardProps) {
  const Tag = href ? "a" : "div";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Tag
        {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group block rounded-2xl border border-[#252932] bg-[#101216] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#5FA9FF]/60 hover:shadow-[0_0_32px_rgba(95,169,255,0.12)] cursor-pointer"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#5FA9FF]/10 border border-[#5FA9FF]/20 flex items-center justify-center text-[#5FA9FF] transition-colors group-hover:bg-[#5FA9FF]/20">
            {icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9AA3AF] group-hover:text-[#7AB8FF] transition-colors">
            {title}
          </span>
        </div>
        <p className="text-white font-semibold text-[15px] mb-3 group-hover:text-[#7AB8FF] transition-colors">
          {primary}
        </p>
        <div className="space-y-1">
          {lines.map((l) => (
            <p key={l} className="text-[#9AA3AF] text-sm">{l}</p>
          ))}
        </div>
      </Tag>
    </motion.div>
  );
}

/* ─── FAQ Item ─────────────────────────────────────────────────────────── */
function FAQItem({ q, a, delay = 0 }: { q: string; a: string; delay?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      className="border-b border-[#252932] last:border-0"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={open}
      >
        <span className="font-medium text-white text-[15px] group-hover:text-[#7AB8FF] transition-colors pr-4">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="shrink-0 text-[#9AA3AF] group-hover:text-[#5FA9FF] transition-colors"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-[#9AA3AF] text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Contact Page ────────────────────────────────────────────────── */
type FormState = "idle" | "sending" | "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function Contact() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = {
    success: (msg: string) => {
      const id = Math.random().toString();
      setToasts((prev) => [...prev, { id, message: msg, type: "success" }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    error: (msg: string) => {
      const id = Math.random().toString();
      setToasts((prev) => [...prev, { id, message: msg, type: "error" }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
  };

  // Always scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("EmailJS Setup Status:", {
      serviceId: SERVICE_ID ? "Loaded" : "Missing",
      contactTemplate: CONTACT_TEMPLATE ? "Loaded" : "Missing",
      autoReplyTemplate: AUTO_REPLY_TEMPLATE ? "Loaded" : "Missing",
      publicKey: PUBLIC_KEY && PUBLIC_KEY !== "your_emailjs_public_key_here" ? "Configured" : "Placeholder/Missing",
    });
  }, []);

  // Progress bar animation during sending
  useEffect(() => {
    if (formState !== "sending") { setProgress(0); return; }
    const start = performance.now();
    const duration = 4000;
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      setProgress(Math.min((elapsed / duration) * 90, 90));
      if (formState === "sending") raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [formState]);

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    // Validations
    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }
    if (!trimmedEmail) {
      toast.error("Email is required.");
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!trimmedMessage) {
      toast.error("Message is required.");
      return;
    }

    setFormState("sending");
    setErrorMsg("");

    const templateParams = {
      name: trimmedName,
      email: trimmedEmail,
      project: trimmedSubject,
      message: trimmedMessage,
      time: new Date().toLocaleString(),
    };

    try {
      // Send templates in parallel using EmailJS v4 options object
      await Promise.all([
        emailjs.send(SERVICE_ID, CONTACT_TEMPLATE, templateParams, { publicKey: PUBLIC_KEY }),
        emailjs.send(SERVICE_ID, AUTO_REPLY_TEMPLATE, templateParams, { publicKey: PUBLIC_KEY }),
      ]);

      setProgress(100);
      setTimeout(() => setFormState("success"), 300);
      toast.success("Message sent successfully!");

      // Reset form fields
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");

      setTimeout(() => {
        setFormState("idle");
      }, 5000);
    } catch (error: any) {
      console.error("Detailed EmailJS Error:", error);
      const specificError = error?.text || error?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "Unknown error";
      toast.error(`Failed to send message: ${specificError}`);
      setFormState("error");
      setErrorMsg(`Failed to send message: ${specificError}`);
      setTimeout(() => setFormState("idle"), 5000);
    }
  };

  const inputClass =
    "w-full bg-[#050505] border border-[#252932] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[#9AA3AF]/60 focus:outline-none focus:border-[#5FA9FF] focus:shadow-[0_0_0_3px_rgba(95,169,255,0.12)] transition-all duration-200";

  const faqItems = [
    { q: "How quickly do you reply?", a: "Usually within one business day. For urgent matters, reaching out via Discord often gets the fastest response from the community and team." },
    { q: "Can I request enterprise features?", a: "Absolutely. If you're integrating Forge AI at scale or need custom infrastructure, API access, or SLA guarantees, just reach out — we'd love to talk." },
    { q: "Can I contribute to Forge AI?", a: "Yes! Forge AI is open source. Check our GitHub repo for open issues, contribution guides, and ongoing feature work. All contributors are credited." },
    { q: "Do you have a public API?", a: "A fully documented public API is coming soon. Sign up via the contact form to get early access when it launches." },
  ];

  return (
    <div
      className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Animated Background ─────────────────────────────────── */}
      <ParticleBackground />

      {/* Blue fog blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute rounded-full blur-[140px] opacity-[0.06]"
          style={{ width: 700, height: 700, background: "#5FA9FF", top: "-15%", left: "20%" }}
        />
        <div
          className="absolute rounded-full blur-[100px] opacity-[0.05]"
          style={{ width: 500, height: 500, background: "#3B82F6", bottom: "10%", right: "5%" }}
        />
      </div>

      {/* Grain overlay */}
      <div className="grain-overlay fixed inset-0 z-0 pointer-events-none opacity-[0.03]" />

      {/* ── Navigation ──────────────────────────────────────────── */}
      <SiteNav />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-16">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center max-w-xl"
        >
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4 leading-tight"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Let's Build Together
          </h1>
          <p className="text-[#9AA3AF] text-base md:text-lg leading-relaxed mb-8">
            Whether you're building the next unicorn, integrating Forge AI,
            or just have an idea — we'd love to hear from you.
          </p>
          <motion.button
            onClick={() => {
              document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-2 bg-white text-[#050505] px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all duration-300"
          >
            Contact the Team
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
          </motion.button>
        </motion.div>
      </section>

      {/* ── Two Column: Form + Cards ─────────────────────────────── */}
      <section id="contact-form" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Contact Form (left, wider) ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <div className="bg-[#101216] border border-[#252932] rounded-3xl p-8 md:p-10">
              <h2 className="text-2xl font-semibold mb-1">Send a Message</h2>
              <p className="text-[#9AA3AF] text-sm mb-8">
                Tell us what you're building and we'll be in touch.
              </p>

              <AnimatePresence mode="wait">
                {formState === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center py-16 text-center gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    >
                      <CheckCircle2 size={52} className="text-[#3DD9A4]" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white">
                      ✓ Message Successfully Forged
                    </h3>
                    <p className="text-[#9AA3AF] text-sm max-w-xs">
                      We'll be in touch within one business day.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs text-[#9AA3AF] uppercase tracking-widest font-medium mb-2">
                          Name
                        </label>
                        <input
                          id="contact-name"
                          className={inputClass}
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={formState === "sending"}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9AA3AF] uppercase tracking-widest font-medium mb-2">
                          Email
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          className={inputClass}
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={formState === "sending"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#9AA3AF] uppercase tracking-widest font-medium mb-2">
                        What can we help you build?
                      </label>
                      <input
                        id="contact-subject"
                        className={inputClass}
                        placeholder="Describe your project or question…"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        disabled={formState === "sending"}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#9AA3AF] uppercase tracking-widest font-medium mb-2">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        className={`${inputClass} resize-none`}
                        placeholder="Share the details…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        disabled={formState === "sending"}
                      />
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                      {formState === "error" && (
                        <motion.p
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-red-400 text-sm"
                        >
                          {errorMsg}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Submit button + progress bar */}
                    <div className="space-y-3 pt-1">
                      <motion.button
                        id="contact-submit"
                        type="submit"
                        disabled={formState === "sending"}
                        whileHover={formState === "idle" ? { scale: 1.02 } : {}}
                        whileTap={formState === "idle" ? { scale: 0.98 } : {}}
                        className="w-full py-4 rounded-xl font-semibold text-sm tracking-wide bg-white text-[#050505] disabled:opacity-70 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                      >
                        {formState === "sending" ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Forging Connection…
                          </>
                        ) : (
                          "Send Message"
                        )}
                      </motion.button>

                      {/* Progress bar */}
                      <AnimatePresence>
                        {formState === "sending" && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-0.5 w-full bg-[#252932] rounded-full overflow-hidden"
                          >
                            <motion.div
                              className="h-full bg-gradient-to-r from-[#5FA9FF] to-[#7AB8FF] rounded-full"
                              style={{ width: `${progress}%` }}
                              transition={{ ease: "easeOut" }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Contact Cards (right) ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 flex flex-col gap-4"
          >
            <ContactCard
              icon={<Mail size={18} />}
              title="Email"
              primary="hello@forgeai.dev"
              lines={["Average reply", "< 24 Hours"]}
              href="mailto:hello@forgeai.dev"
              delay={0}
            />
            <ContactCard
              icon={<Github size={18} />}
              title="GitHub"
              primary="Forge AI"
              lines={["Open Source", "Contribute"]}
              href="https://github.com/Devadevan-B-P"
              delay={0.08}
            />
            <ContactCard
              icon={<BookOpen size={18} />}
              title="Documentation"
              primary="Read the Docs"
              lines={["API Reference", "Examples"]}
              href="#"
              delay={0.16}
            />
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#5FA9FF] font-semibold mb-3">
            FAQ
          </p>
          <h2
            className="text-3xl md:text-4xl font-semibold tracking-tight"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Common Questions
          </h2>
        </motion.div>

        <div className="bg-[#101216] border border-[#252932] rounded-3xl px-8 py-2">
          {faqItems.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} delay={i * 0.06} />
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Glow orb */}
          <div className="absolute left-1/2 -translate-x-1/2 w-96 h-40 rounded-full bg-[#5FA9FF] opacity-[0.06] blur-[80px] pointer-events-none" />

          <p className="text-xs uppercase tracking-[0.2em] text-[#5FA9FF] font-semibold mb-4">
            Still curious?
          </p>
          <h2
            className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 leading-tight"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Still Have Questions?
          </h2>
          <p className="text-[#9AA3AF] text-base md:text-lg mb-10">
            We're always happy to help.
          </p>

          <motion.button
            onClick={() => navigate("/generator")}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-2 bg-white text-[#050505] px-9 py-4 rounded-full font-semibold text-sm tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.12)] hover:shadow-[0_0_60px_rgba(255,255,255,0.22)] transition-all duration-300"
          >
            Start Building
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer gradient fade ─────────────────────────────────── */}
      <div className="relative z-10 h-24 bg-gradient-to-t from-[#050505] to-transparent" />
      <footer className="relative z-10 border-t border-[#252932]/50 py-8 px-6 text-center">
        <p className="text-[#9AA3AF] text-xs">
          © {new Date().getFullYear()} Forge AI — Crafted with precision.{" "}
          <span className="text-[#5FA9FF]">Made for builders.</span>
        </p>
      </footer>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-md shadow-2xl pointer-events-auto ${
                t.type === "success"
                  ? "bg-[#101216]/90 border-[#3DD9A4]/30 text-white"
                  : "bg-[#101216]/90 border-red-500/30 text-white"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  t.type === "success" ? "bg-[#3DD9A4]" : "bg-red-500"
                }`}
              />
              <span className="text-xs font-medium tracking-wide leading-relaxed">
                {t.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
