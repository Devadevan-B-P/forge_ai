import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SiteNav from "../components/SiteNav";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260703_053131_1ec3dd1c-d627-44fb-ab20-6e1fce41b0d5.mp4";

/** Cross-fades two stacked video elements so the loop appears seamless. */
function useSeamlessLoop() {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const va = refA.current;
    const vb = refB.current;
    if (!va || !vb) return;

    /* How many seconds before the end we start fading */
    const FADE_BEFORE = 1.4;
    /* How long the crossfade lasts in ms — must match the CSS transition */
    const FADE_MS = 1400;

    let crossfading = false;

    const crossfade = (from: HTMLVideoElement, to: HTMLVideoElement) => {
      if (crossfading) return;
      crossfading = true;

      /* Cue the incoming video invisibly, then flip opacities */
      to.currentTime = 0;
      to.play().catch(() => {});
      to.style.opacity = "1";
      from.style.opacity = "0";

      setTimeout(() => {
        from.pause();
        from.currentTime = 0;
        crossfading = false;
      }, FADE_MS);
    };

    const onUpdate = (e: Event) => {
      const vid = e.target as HTMLVideoElement;
      /* Only act when this video is the visible one */
      if (vid.style.opacity !== "1") return;
      const remaining = vid.duration - vid.currentTime;
      if (!isNaN(vid.duration) && remaining > 0 && remaining <= FADE_BEFORE) {
        crossfade(vid, vid === va ? vb : va);
      }
    };

    /* Kick off the first video */
    va.style.opacity = "1";
    vb.style.opacity = "0";
    va.play().catch(() => {});

    va.addEventListener("timeupdate", onUpdate);
    vb.addEventListener("timeupdate", onUpdate);

    return () => {
      va.removeEventListener("timeupdate", onUpdate);
      vb.removeEventListener("timeupdate", onUpdate);
      va.pause();
      vb.pause();
    };
  }, []);

  return { refA, refB };
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const { refA, refB } = useSeamlessLoop();

  return (
    <section className="relative h-screen w-full overflow-hidden flex flex-col">

      {/* ── Two stacked videos for seamless crossfade loop ─────────────── */}
      <video
        ref={refA}
        src={VIDEO_SRC}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 1, transition: "opacity 1.4s ease" }}
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={refB}
        src={VIDEO_SRC}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0, transition: "opacity 1.4s ease" }}
        muted
        playsInline
        preload="auto"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

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
