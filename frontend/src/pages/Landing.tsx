import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  Network,
  Cloud,
  Container,
  ShieldCheck,
  ListChecks,
  Code2,
} from "lucide-react";
import SiteNav from "../components/SiteNav";

const STEPS = [
  {
    n: "01",
    title: "Describe your idea",
    body: "One or two sentences is enough — \"a food delivery app where users order, restaurants manage menus, and agents track deliveries.\"",
  },
  {
    n: "02",
    title: "Set your preferences",
    body: "Pick architecture style, database, backend/frontend framework, cloud provider, and project size — or leave the sensible defaults.",
  },
  {
    n: "03",
    title: "Get the full blueprint",
    body: "Features, tech stack, schema, APIs, folder structure, AWS & Docker architecture, roadmap, and security — generated in one pass.",
  },
];

const FEATURES = [
  { icon: Layers, label: "Tech Stack", desc: "Frontend, backend, auth, storage, CI/CD" },
  { icon: Database, label: "Database Schema", desc: "Tables, columns, keys, relationships" },
  { icon: Network, label: "REST APIs", desc: "Routes, auth, sample req/response" },
  { icon: Cloud, label: "AWS Architecture", desc: "Hosting, CDN, load balancer, flow" },
  { icon: Container, label: "Docker Setup", desc: "Container layout and data flow" },
  { icon: ListChecks, label: "Roadmap", desc: "Phased plan with day estimates" },
  { icon: ShieldCheck, label: "Security Checklist", desc: "Auth, HTTPS, validation, CORS" },
  { icon: Code2, label: "Code Generators", desc: "SQL DDL and per-endpoint handlers" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-screen w-full overflow-hidden flex flex-col">
        {/* Animated mesh background instead of a video — keeps things light
            and on-brand without pulling in an external media asset. */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-surface" />
          <div className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-accent/20 blur-[120px] animate-mesh-drift" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full bg-accent2/15 blur-[120px] animate-mesh-drift-slow" />
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
            <div className="inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-1.5 mb-7 text-accent2 text-xs font-medium uppercase tracking-widest">
              <Sparkles size={13} />
              AI Software Architect
            </div>
            <h1 className="font-display text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.02em] font-semibold">
              Plan the build.
              <br />
              <span className="text-white/50">Skip the</span>
              <br />
              <span className="text-white/50">guesswork.</span>
            </h1>
            <p className="text-white/70 text-sm sm:text-base md:text-lg leading-relaxed max-w-md mx-auto mt-6 sm:mt-8">
              Forge AI turns a one-line idea into a complete software
              architecture blueprint — tech stack, schema, APIs, and a
              roadmap — so you start coding instead of researching.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
              <button
                onClick={() => navigate("/generator")}
                className="group flex items-center gap-2 px-6 py-3 bg-white text-gray-900 text-sm font-semibold rounded-full hover:bg-white/90 transition"
              >
                Start Building
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#how-it-works"
                className="px-6 py-3 liquid-glass rounded-full text-white text-sm font-semibold hover:bg-white/5 transition"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>

        <div className="pb-8 flex justify-center">
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-1.5 rounded-full bg-white/50 animate-bounce" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24 sm:py-28 max-w-5xl mx-auto scroll-mt-6">
        <div className="text-center mb-14">
          <p className="text-accent2 text-xs font-semibold uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold">
            Three steps to a full architecture
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-6 hover:border-accent/30 border border-transparent transition">
              <span className="font-display text-3xl text-white/15 font-semibold">{s.n}</span>
              <h3 className="text-white font-medium mt-3 mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section id="what-you-get" className="px-6 py-24 sm:py-28 max-w-5xl mx-auto scroll-mt-6">
        <div className="text-center mb-14">
          <p className="text-accent2 text-xs font-semibold uppercase tracking-widest mb-3">
            What you get
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold">
            A blueprint, not just a chat reply
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="glass rounded-2xl p-5 hover:border-accent/30 border border-transparent transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent2 mb-4 group-hover:bg-accent/20 transition">
                <f.icon size={17} />
              </div>
              <h3 className="text-white text-sm font-medium mb-1">{f.label}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-6 pb-24 sm:pb-28 max-w-3xl mx-auto text-center">
        <div className="glass rounded-3xl p-10 sm:p-14">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-semibold mb-4">
            Describe it. Forge it.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Go from a one-line idea to a structured, presentable blueprint in
            under a minute.
          </p>
          <button
            onClick={() => navigate("/generator")}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-accent text-white font-medium shadow-glow hover:brightness-110 transition"
          >
            Start Building
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-slate-600">
        Forge AI — an AI software architect, not a code generator.
      </footer>
    </div>
  );
}
