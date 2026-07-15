import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScrollStack, { ScrollStackItem } from "../components/vendor/ScrollStack";
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
import SpotlightCard from "../components/vendor/SpotlightCard";
import BorderGlow from "../components/vendor/BorderGlow";
import BlurText from "../components/vendor/BlurText";
import ShinyText from "../components/vendor/ShinyText";
import AnimatedContent from "../components/vendor/AnimatedContent";
import ShapeBlur from "../components/vendor/ShapeBlur";
import ScrollFloat from "../components/vendor/ScrollFloat";
import VariableProximity from "../components/vendor/VariableProximity";
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


function AudienceCard({ item, index }: { item: (typeof AUDIENCE)[number]; index: number }) {
  return (
    <RevealCard
      delay={index * 0.08}
      className="h-full"
    >
      <SpotlightCard className="h-full flex flex-col items-center text-center p-6 group" spotlightColor="rgba(124, 92, 255, 0.12)">
        <div className="w-10 h-10 rounded-xl bg-accent2/10 flex items-center justify-center text-accent2 mb-4 group-hover:bg-accent2/20 transition pulse-glow">
          <item.icon size={18} />
        </div>
        <h3 className="text-white text-sm font-semibold mb-1.5">{item.label}</h3>
        <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
      </SpotlightCard>
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
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameCount = 151;

  useEffect(() => {
    // 1. Preload images
    const preloadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
      const canvas = ctx.canvas;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgWidth = img.width || 1920;
      const imgHeight = img.height || 1080;

      const imgRatio = imgWidth / imgHeight;
      const canvasRatio = canvasWidth / canvasHeight;

      let drawWidth = canvasWidth;
      let drawHeight = canvasHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvasWidth / imgRatio;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        drawWidth = canvasHeight * imgRatio;
        offsetX = (canvasWidth - drawWidth) / 2;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = `/flower-frames/frame_${i.toString().padStart(3, "0")}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (i === 0 && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) drawImageCover(ctx, img);
        }
      };
      preloadedImages.push(img);
    }
    imagesRef.current = preloadedImages;

    // 2. Setup scroll tracking and smooth loop
    let targetFrame = 0;
    let currentFrame = 0;
    const lerpFactor = 0.15;
    let animationFrameId: number;
    let lastDrawnFrameIndex = -1;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const progress = Math.max(0, Math.min(1, scrollTop / scrollHeight));
      targetFrame = progress * (frameCount - 1);
    };

    const updateCanvas = () => {
      currentFrame += (targetFrame - currentFrame) * lerpFactor;
      
      const frameIndex = Math.round(currentFrame);
      if (frameIndex !== lastDrawnFrameIndex) {
        const img = imagesRef.current[frameIndex];
        const canvas = canvasRef.current;
        if (canvas && img && img.complete) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            drawImageCover(ctx, img);
            lastDrawnFrameIndex = frameIndex;
          }
        }
      }

      animationFrameId = requestAnimationFrame(updateCanvas);
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Force redraw on resize
      lastDrawnFrameIndex = -1;

      const frameIndex = Math.round(currentFrame);
      const img = imagesRef.current[frameIndex];
      if (img && img.complete) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawImageCover(ctx, img);
          lastDrawnFrameIndex = frameIndex;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    
    handleResize();
    handleScroll();
    
    animationFrameId = requestAnimationFrame(updateCanvas);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollToProcess = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("process");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const missionLeft = useInView(0.15);
  const missionRight = useInView(0.15);
  const processHead = useInView(0.15);
  const audienceHead = useInView(0.15);
  const principlesHead = useInView(0.15);
  const visionRef = useInView(0.15);
  const ctaRef = useInView(0.15);

  return (
    <div className="min-h-screen w-full overflow-x-hidden relative">
      {/* Scroll-driven blooming flower background canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none opacity-20"
      />

      {/* Content wrapper */}
      <div className="relative z-10">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[70vh] w-full overflow-hidden flex flex-col">

        <SiteNav />

        <div
          ref={heroContainerRef}
          className="flex-1 flex items-center justify-center px-6 relative z-10 pt-32 pb-16"
        >
          <div className="text-center max-w-3xl animate-fade-up">
            <h1 className="font-display text-white text-4xl sm:text-5xl md:text-6xl leading-[1.08] tracking-[-0.02em] font-semibold">
              <VariableProximity
                label="An Idea to a"
                className="text-white block sm:whitespace-nowrap"
                fromFontVariationSettings="'wght' 400"
                toFontVariationSettings="'wght' 1000"
                containerRef={heroContainerRef}
                radius={120}
                falloff="linear"
              />
              <VariableProximity
                label="Production-Ready Blueprint."
                className="text-white/50 block mt-1 sm:whitespace-nowrap"
                fromFontVariationSettings="'wght' 400"
                toFontVariationSettings="'wght' 1000"
                containerRef={heroContainerRef}
                radius={120}
                falloff="linear"
              />
            </h1>
            <div className="text-white/60 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto mt-6">
              <VariableProximity
                label="Forge AI is an AI-powered Solution Architect that transforms ideas into comprehensive technical blueprints—guiding your entire development process from planning to deployment."
                className="text-white/60 leading-relaxed max-w-2xl mx-auto block"
                fromFontVariationSettings="'wght' 300"
                toFontVariationSettings="'wght' 600"
                containerRef={heroContainerRef}
                radius={100}
                falloff="linear"
              />
            </div>
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
                onClick={scrollToProcess}
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

      </section>

      {/* ── Mission ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-28 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left — text */}
          <div
            ref={missionLeft.ref as React.RefObject<HTMLDivElement>}
            className={`reveal reveal-left ${missionLeft.inView ? "in-view" : ""}`}
          >
            <BlurText
              text="Our Mission"
              animateBy="words"
              direction="bottom"
              delay={80}
              className="text-accent2 text-xs font-semibold uppercase tracking-widest mb-4"
            />
            <BlurText
              text="Why We Built Forge AI"
              animateBy="words"
              direction="bottom"
              delay={100}
              className="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold mb-5 leading-snug"
            />
            <ShinyText
              text="Every successful software project begins with a well-designed architecture, yet planning is often overlooked. Developers spend hours deciding on technology stacks, designing databases, organising APIs, and figuring out deployment strategies—before writing a single line of code."
              className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4 block"
              color="#94a3b8"
              shineColor="#ffffff"
              speed={3.5}
            />
            <ShinyText
              text="Our mission is to make professional software architecture accessible to everyone by using AI to automate the planning phase while still following modern engineering best practices."
              className="text-slate-400 text-sm sm:text-base leading-relaxed block"
              color="#94a3b8"
              shineColor="#ffffff"
              speed={3.5}
            />
          </div>

          {/* Right — decorative glass card */}
          <div
            ref={missionRight.ref as React.RefObject<HTMLDivElement>}
            className={`reveal reveal-right ${missionRight.inView ? "in-view" : ""} glass rounded-3xl p-8 flex flex-col gap-4`}
          >
            {["Plan the build", "Skip the guesswork", "Ship with confidence"].map((t, i) => (
              <AnimatedContent
                key={t}
                distance={40}
                direction="vertical"
                delay={i * 0.15}
                duration={0.8}
                ease="power2.out"
                className="flex items-center gap-4"
              >
                <span className="w-8 h-8 rounded-full bg-accent/15 text-accent2 text-xs font-bold font-display flex items-center justify-center shrink-0 pulse-glow">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-white/80 text-sm font-medium">{t}</span>
              </AnimatedContent>
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
          <ScrollFloat
            animationDuration={0.8}
            ease="power2.out"
            scrollStart="top bottom-=10%"
            scrollEnd="bottom center"
            stagger={0.03}
            containerClassName="w-full flex justify-center"
            textClassName="text-accent2 text-xs font-semibold uppercase tracking-widest mb-3"
          >
            The Forge Process
          </ScrollFloat>
          <ScrollFloat
            animationDuration={0.8}
            ease="power2.out"
            scrollStart="top bottom-=10%"
            scrollEnd="bottom center"
            stagger={0.02}
            containerClassName="w-full flex justify-center"
            textClassName="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold"
          >
            From spark to ship
          </ScrollFloat>
          <ScrollFloat
            animationDuration={0.8}
            ease="power2.out"
            scrollStart="top bottom-=10%"
            scrollEnd="bottom center"
            stagger={0.005}
            containerClassName="w-full flex justify-center mt-4 max-w-xl mx-auto"
            textClassName="text-slate-400 text-sm leading-relaxed"
          >
            Every project follows the same structured journey—Forge AI handles the heavy planning so you can focus on building.
          </ScrollFloat>
        </div>

        <div className="w-full max-w-lg mx-auto">
          <ScrollStack
            useWindowScroll={true}
            itemDistance={50}
            blurAmount={1.5}
            baseScale={0.92}
            itemScale={0.02}
            itemStackDistance={20}
            stackPosition="25%"
            scaleEndPosition="12%"
          >
            {PROCESS.map((step, i) => (
              <ScrollStackItem key={step.label}>
                <div className="glass rounded-[24px] p-6 border border-white/10 flex items-start gap-4 bg-[#12151c]/90 backdrop-blur-md">
                  <div className={`w-11 h-11 rounded-xl ${step.bg} flex items-center justify-center shrink-0 pulse-glow`}>
                    <step.icon size={20} className={step.color} />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-0.5">
                      Step {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-white font-semibold text-sm font-sans">{step.label}</h3>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">
                      {i === 0 && "Define your software idea in simple natural language requirements."}
                      {i === 1 && "AI parses the prompt to define project scale, scopes, and parameters."}
                      {i === 2 && "Delineates the core features, modular dependencies, and structural stack."}
                      {i === 3 && "Models relational database schema tables, fields, and connections."}
                      {i === 4 && "Defines REST API endpoints with inputs, outputs, and JSON payloads."}
                      {i === 5 && "Maps Docker containerization setups and AWS deployment nodes."}
                      {i === 6 && "Generates structured roadmap timelines, security, and boilerplate code."}
                    </p>
                  </div>
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </section>

      {/* ── Who It's For ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-28 max-w-5xl mx-auto">
        <div
          ref={audienceHead.ref as React.RefObject<HTMLDivElement>}
          className={`reveal reveal-up ${audienceHead.inView ? "in-view" : ""} text-center mb-14`}
        >
          <ScrollFloat
            animationDuration={0.8}
            ease="power2.out"
            scrollStart="top bottom-=10%"
            scrollEnd="bottom center"
            stagger={0.03}
            containerClassName="w-full flex justify-center"
            textClassName="text-accent2 text-xs font-semibold uppercase tracking-widest mb-3"
          >
            Who It's For
          </ScrollFloat>
          <ScrollFloat
            animationDuration={0.8}
            ease="power2.out"
            scrollStart="top bottom-=10%"
            scrollEnd="bottom center"
            stagger={0.02}
            containerClassName="w-full flex justify-center"
            textClassName="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold"
          >
            Built for everyone who builds software
          </ScrollFloat>
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
          <ScrollFloat
            animationDuration={0.8}
            ease="power2.out"
            scrollStart="top bottom-=10%"
            scrollEnd="bottom center"
            stagger={0.03}
            containerClassName="w-full flex justify-center"
            textClassName="text-accent2 text-xs font-semibold uppercase tracking-widest mb-3"
          >
            Core Principles
          </ScrollFloat>
          <ScrollFloat
            animationDuration={0.8}
            ease="power2.out"
            scrollStart="top bottom-=10%"
            scrollEnd="bottom center"
            stagger={0.02}
            containerClassName="w-full flex justify-center"
            textClassName="font-display text-2xl sm:text-3xl md:text-4xl text-white font-semibold"
          >
            Our philosophy
          </ScrollFloat>
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
          className={`reveal reveal-scale ${visionRef.inView ? "in-view" : ""}`}
        >
          <BorderGlow
            edgeSensitivity={35}
            glowColor="262 90 70"
            backgroundColor="rgba(18, 21, 28, 0.6)"
            borderRadius={24}
            glowRadius={60}
            glowIntensity={1.2}
            coneSpread={30}
            animated={true}
            colors={['#7c5cff', '#4f9dff', '#5cf0d0']}
            className="w-full"
          >
            <div className="p-10 sm:p-14 relative text-center max-w-2xl mx-auto">
              <p className="text-accent2 text-xs font-semibold uppercase tracking-widest mb-4 shimmer-text">Vision</p>
              <h2 className="font-display text-2xl sm:text-3xl text-white font-semibold mb-5">
                The future of software planning
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                We believe the future of software development starts long before code is written. Our vision is to build an intelligent architecture workspace where developers can design, validate, and refine complete software systems using AI—reducing planning time while improving the quality of technical decisions.
              </p>
            </div>
          </BorderGlow>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 sm:pb-28 max-w-3xl mx-auto text-center">
        <div
          ref={ctaRef.ref as React.RefObject<HTMLDivElement>}
          className={`reveal reveal-up ${ctaRef.inView ? "in-view" : ""} glass rounded-3xl p-10 sm:p-14 relative overflow-hidden`}
        >
          {/* Interactive ShapeBlur shader background */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <ShapeBlur
              variation={0}
              pixelRatioProp={window.devicePixelRatio || 1}
              shapeSize={2.0}
              roundness={0.5}
              borderSize={0.03}
              circleSize={0.4}
              circleEdge={0.8}
            />
          </div>
          <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[70%] h-[80%] rounded-full bg-accent/15 blur-[80px] pointer-events-none" />
          <div className="relative z-10">
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

      {/* Scroll-revealed bottom blur */}
      <GradualBlur
        target="page"
        position="bottom"
        height="8rem"
        strength={3}
        divCount={8}
        curve="bezier"
        exponential
        opacity={1}
        animated="scroll"
      />

      <footer className="px-6 py-8 text-center text-xs text-slate-600">
        Forge AI — an AI software architect, not a code generator.
      </footer>
      </div>
    </div>
  );
}
