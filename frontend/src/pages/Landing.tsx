import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SiteNav from "../components/SiteNav";

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen w-full overflow-hidden flex flex-col">

      {/* Animated mesh background — no external video asset, self-contained
          and consistent with the same technique used on the About page. */}
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

      {/* Nav */}
      <div className="relative z-10">
        <SiteNav />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex items-start justify-center pt-16 sm:pt-20 md:pt-24 px-6">
        <div className="text-center max-w-3xl">

          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-1.5 mb-7 text-white/80 text-xs font-medium uppercase tracking-widest">
            AI Software Architect
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-[-0.02em] font-semibold">
            Plan the build.
            <br />
            <span className="text-white/60">Skip the</span>
            <br />
            <span className="text-white/60">guesswork.</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-delay-2 text-white/80 text-sm sm:text-base md:text-lg leading-relaxed max-w-md mx-auto mt-6 sm:mt-8">
            Forge AI turns a one-line idea into a complete software architecture
            blueprint — tech stack, schema, APIs, and a roadmap — so you start
            coding instead of researching.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-delay-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            <button
              onClick={() => navigate("/generator")}
              className="group flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-gray-900 text-sm font-semibold rounded-full hover:bg-white/90 transition"
            >
              Start Building
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/about")}
              className="px-5 sm:px-6 py-2.5 sm:py-3 liquid-glass rounded-full text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              See how it works
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
