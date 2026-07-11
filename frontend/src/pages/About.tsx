import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Lightbulb,
  FileText,
  LayoutTemplate,
  Database,
  Plug,
  Cloud,
  Rocket,
  GraduationCap,
  Terminal,
  Zap,
  Users,
  Briefcase,
  MessageSquareOff,
  ClipboardList,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";
import SiteNav from "../components/SiteNav";
import GradualBlur from "../components/vendor/GradualBlur";
import { useInView } from "../hooks/useInView";

/* ─── The Forge Process ──────────────────────────────────────────────── */
const PROCESS = [
  { icon: Lightbulb, label: "Idea", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { icon: FileText, label: "Requirements", color: "text-blue-400", bg: "bg-blue-400/10" },
  { icon: LayoutTemplate, label: "Architecture", color: "text-accent2", bg: "bg-accent2/10" },
  { icon: Database, label: "Database", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: Plug, label: "APIs", color: "text-purple-400", bg: "bg-purple-400/10" },
  { icon: Cloud, label: "Deployment", color: "text-sky-400", bg: "bg-sky-400/10" },
  { icon: Rocket, label: "Build", color: "text-accent", bg: "bg-accent/10" },
];

/* ─── Who It's For ───────────────────────────────────────────────────── */
const AUDIENCE = [
  { icon: GraduationCap, label: "Students", desc: "Learn software architecture while planning academic or side projects." },
  { icon: Terminal, label: "Developers", desc: "Generate structured blueprints before writing a single line of code." },
  { icon: Zap, label: "Startup Founders", desc: "Validate technical ideas quickly and build MVPs with confidence." },
  { icon: Briefcase, label: "Freelancers", desc: "Accelerate project planning and impress clients with clear proposals." },
  { icon: Users, label: "Engineering Teams", desc: "Create consistent architectural documentation for every new project." },
];

/* ─── Core Principles ────────────────────────────────────────────────── */
const PRINCIPLES = [
  { icon: MessageSquareOff, title: "Structure Over Conversation", body: "Architecture should be organised and scannable—not buried inside a chat history." },
  { icon: ClipboardList, title: "Practical Recommendations", body: "Every suggestion is grounded in modern software engineering and production-ready technologies." },
  { icon: BrainCircuit, title: "AI as an Assistant", body: "Forge AI helps developers make better architectural decisions while keeping them fully in control." },
];

/* ─── Reveal-on-scroll card ───────────────────────────────────────────
   IMPORTANT: useInView is a hook, so it can only be called from inside a
   component — never directly inside a .map() callback (that breaks React's
   Rules of Hooks). This wrapper is what makes staggered grids like PROCESS,
   AUDIENCE, and PRINCIPLES safe: each card gets its own component instance,
   and the hook lives at that instance's top level. */
function RevealCard({
  children,
  variant = "reveal-up",
  delay = 0,
  threshold = 0.15,
  className = "",
}: {
  children: React.ReactNode;
  variant?: string;
  delay?: number;
  threshold?: number;
  className?: string;
}) {
  const { ref, inView } = useInView(threshold);
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal ${variant} ${inView ? "in-view" : ""} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

function ProcessCard({ step, index }: { step: (typeof PROCESS)[number]; index: number }) {
  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <RevealCard
        variant="reveal-scale"
        delay={index * 0.07}
        threshold={0.2}
        className="glass-hover glass rounded-2xl px-8 py-5 w-full flex items-center gap-5 border border-transparent group"
      >
        <div className={`w-11 h-11 rounded-xl ${step.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform pulse-glow`}>
          <step.icon size={20} className={step.color} />
        </div>
        <div>
          <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-0.5">
            Step {String(index + 1).padStart(2, "0")}
          </p>
          <p className="text-white font-medium text-sm">{step.label}</p>
        </div>
      </RevealCard>
      {index < PROCESS.length - 1 && (
        <div className="flex flex-col items-center my-1 gap-0.5">
          <div className="w-px h-4 bg-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
          <div className="w-px h-4 bg-white/10" />
        </div>
      )}
    </div>
  );
}

function AudienceCard({ item, index }: { item: (typeof AUDIENCE)[number]; index: number }) {
  return (
    <RevealCard
      delay={index * 0.08}
      className="glass-hover glass rounded-2xl p-5 border border-transparent group text-center"
    >
      <div className="w-10 h-10 rounded-xl bg-accent2/10 flex items-center justify-center text-accent2 mb-4 mx-auto group-hover:bg-accent2/20 transition pulse-glow">
        <item.icon size={18} />
      </div>
      <h3 className="text-white text-sm font-semibold mb-1.5">{item.label}</h3>
      <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
    </RevealCard>
  );
}

function PrincipleCard({ p, index }: { p: { icon: LucideIcon; title: string; body: string }; index: number }) {
  return (
    <RevealCard
      delay={index * 0.1}
      className="glass-hover glass rounded-2xl p-7 border border-transparent group"
    >
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-5 group-hover:bg-accent/20 transition pulse-glow">
        <p.icon size={18} />
      </div>
      <h3 className="text-white font-semibold mb-2">{p.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{p.body}</p>
    </RevealCard>
  );
}

export default function About() {
  const navigate = useNavigate();

  const missionLeft = useInView(0.15);
  const missionRight = useInView(0.15);
  const processHead = useInView(0.15);
  const audienceHead = useInView(0.15);
  const principlesHead = useInView(0.15);
  const visionRef = useInView(0.15);
  const ctaRef = useInView(0.15);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] w-full overflow-hidden flex flex-col">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-surface" />
          <div className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full bg-accent/20 blur-[120px] animate-mesh-drift" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] rounded-full bg-accent2/15 blur-[120px] animate-mesh-drift-slow" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <SiteNav />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-3xl animate-fade-up">
            <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-1.5 mb-7 text-xs font-medium uppercase tracking-widest">
              <Sparkles size={13} className="text-accent2 animate-float" />
              <span className="shimmer-text">About Forge AI</span>
            </div>
            <h1 className="font-display text-white text-4xl sm:text-5xl md:text-6xl leading-[1.08] tracking-[-0.02em] font-semibold">
              From an Idea to a
              <br />
              <span className="text-white/50">Production-Ready Blueprint.</span>
            </h1>
            <p className="text-white/60 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto mt-6">
              Forge AI is an AI-powered Solution Architect that transforms ideas into comprehensive technical blueprints—guiding your entire development process from planning to deployment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <button
                onClick={() => navigate("/generator")}
                className="group flex items-center gap-2 px-6 py-3 bg-white text-gray-900 text-sm font-semibold rounded-full hover:bg-white/90 transition"
              >
                Start Building
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#process"
                className="px-6 py-3 liquid-glass rounded-full text-white text-sm font-semibold hover:bg-white/5 transition"
              >
                See the process
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="pb-8 flex justify-center">
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-1.5 rounded-full bg-white/50 animate-bounce" />
          </div>
        </div>

        {/* Smooth blur transition from hero into the content below */}
        <GradualBlur
          target="parent"
          position="bottom"
          height="7rem"
          strength={2}
          divCount={6}
          curve="bezier"
          exponential
          opacity={1}
        />
      </section>

      {/* ── Mission ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-28 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left — text */}
          <div
            ref={missionLeft.ref as React.RefObject<HTMLDivElement>}
            className={`reveal reveal-left ${missionLeft.inView ? "in-view" : ""}`}
          >
            <p className="text-accent2 text-xs font-semibold uppercase tracking-widest mb-4">Our Mission</p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold mb-5 leading-snug">
              Why We Built Forge AI
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
              Every successful software project begins with a well-designed architecture, yet planning is often overlooked. Developers spend hours deciding on technology stacks, designing databases, organising APIs, and figuring out deployment strategies—before writing a single line of code.
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Our mission is to make professional software architecture accessible to everyone by using AI to automate the planning phase while still following modern engineering best practices.
            </p>
          </div>

          {/* Right — decorative glass card */}
          <div
            ref={missionRight.ref as React.RefObject<HTMLDivElement>}
            className={`reveal reveal-right ${missionRight.inView ? "in-view" : ""} glass rounded-3xl p-8 flex flex-col gap-4`}
          >
            {["Plan the build", "Skip the guesswork", "Ship with confidence"].map((t, i) => (
              <div
                key={t}
                className={`flex items-center gap-4 reveal reveal-up ${missionRight.inView ? "in-view" : ""} stagger-${i + 1}`}
              >
                <span className="w-8 h-8 rounded-full bg-accent/15 text-accent2 text-xs font-bold font-display flex items-center justify-center shrink-0 pulse-glow">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-white/80 text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Forge Process ────────────────────────────────────────────── */}
      <section id="process" className="px-6 py-24 sm:py-28 max-w-5xl mx-auto scroll-mt-6">
        <div
          ref={processHead.ref as React.RefObject<HTMLDivElement>}
          className={`reveal reveal-up ${processHead.inView ? "in-view" : ""} text-center mb-14`}
        >
          <p className="text-accent2 text-xs font-semibold uppercase tracking-widest mb-3">The Forge Process</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold">
            From spark to ship
          </h2>
          <p className="text-slate-400 text-sm mt-4 max-w-md mx-auto">
            Every project follows the same structured journey—Forge AI handles the heavy planning so you can focus on building.
          </p>
        </div>

        <div className="relative flex flex-col items-center gap-0">
          {PROCESS.map((step, i) => (
            <ProcessCard key={step.label} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* ── Who It's For ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-28 max-w-5xl mx-auto">
        <div
          ref={audienceHead.ref as React.RefObject<HTMLDivElement>}
          className={`reveal reveal-up ${audienceHead.inView ? "in-view" : ""} text-center mb-14`}
        >
          <p className="text-accent2 text-xs font-semibold uppercase tracking-widest mb-3">Who It's For</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold">
            Built for everyone who builds software
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {AUDIENCE.map((a, i) => (
            <AudienceCard key={a.label} item={a} index={i} />
          ))}
        </div>
      </section>

      {/* ── Core Principles ──────────────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-28 max-w-5xl mx-auto">
        <div
          ref={principlesHead.ref as React.RefObject<HTMLDivElement>}
          className={`reveal reveal-up ${principlesHead.inView ? "in-view" : ""} text-center mb-14`}
        >
          <p className="text-accent2 text-xs font-semibold uppercase tracking-widest mb-3">Core Principles</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold">
            Our philosophy
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {PRINCIPLES.map((p, i) => (
            <PrincipleCard key={p.title} p={p} index={i} />
          ))}
        </div>
      </section>

      {/* ── Vision ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-28 max-w-5xl mx-auto">
        <div
          ref={visionRef.ref as React.RefObject<HTMLDivElement>}
          className={`reveal reveal-scale ${visionRef.inView ? "in-view" : ""} glass rounded-3xl p-10 sm:p-14 border border-accent2/10 relative overflow-hidden`}
        >
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[60%] h-[80%] rounded-full bg-accent2/10 blur-[80px] pointer-events-none" />
          <div className="relative text-center max-w-2xl mx-auto">
            <p className="text-accent2 text-xs font-semibold uppercase tracking-widest mb-4 shimmer-text">Vision</p>
            <h2 className="font-display text-2xl sm:text-3xl text-white font-semibold mb-5">
              The future of software planning
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              We believe the future of software development starts long before code is written. Our vision is to build an intelligent architecture workspace where developers can design, validate, and refine complete software systems using AI—reducing planning time while improving the quality of technical decisions.
            </p>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 sm:pb-28 max-w-3xl mx-auto text-center">
        <div
          ref={ctaRef.ref as React.RefObject<HTMLDivElement>}
          className={`reveal reveal-up ${ctaRef.inView ? "in-view" : ""} glass rounded-3xl p-10 sm:p-14 relative overflow-hidden`}
        >
          <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[70%] h-[80%] rounded-full bg-accent/15 blur-[80px] pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-2xl sm:text-3xl text-white font-semibold mb-4">
              Build Better Before You Build Bigger
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-md mx-auto">
              Every great application starts with a solid blueprint. Forge AI helps you create that foundation—turning ideas into clear, scalable, production-ready software architectures.
            </p>
            <button
              onClick={() => navigate("/generator")}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-accent text-white font-medium shadow-glow hover:brightness-110 transition"
            >
              Start Building
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-slate-600">
        Forge AI — an AI software architect, not a code generator.
      </footer>
    </div>
  );
}
