import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SiteNav from "../components/SiteNav";
import Strands from "../components/vendor/Strands";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page-enter relative h-screen w-full bg-[#050505] text-white overflow-hidden select-none">
      {/* Background Atmosphere Overlays */}
      <div className="grain-overlay" />
      <div className="animated-vignette" />
      <div className="radial-bg" />

      {/* Interactive Backgrounds */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-40">
          <Strands
            colors={["#06B6D4", "#7C3AED", "#F97316"]}
            count={4}
            speed={0.4}
            amplitude={1.2}
            waviness={1.0}
            thickness={0.8}
            glow={2.5}
            taper={2}
            spread={1.5}
            intensity={0.6}
            saturation={1.5}
            opacity={0.8}
            scale={1.5}
          />
        </div>
      </div>

      {/* Floating Pill Nav */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        <SiteNav />
      </motion.div>

      {/* Hero container */}
      <main className="relative w-full h-full flex flex-col items-center justify-center z-10 px-6 max-w-7xl mx-auto">
        <div className="text-center flex flex-col items-center max-w-[1000px] w-full">
          {/* Main heading */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[42px] sm:text-[60px] md:text-[86px] lg:text-[96px] leading-[0.9] tracking-[-0.03em] font-medium text-white"
            >
              Forge Intelligence.
              <br />
              <span className="text-white/40">Built Beyond Software.</span>
            </motion.h1>
          </div>

          {/* Subtitle */}
          <div className="mt-8 w-full max-w-[620px]">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0.7 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg md:text-xl text-white/70 leading-relaxed font-sans"
            >
              Build intelligent workflows that think, adapt, and evolve.
            </motion.p>
          </div>

          {/* Interactive CTAs */}
          <div className="mt-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              {/* Primary button */}
              <button
                onClick={() => navigate("/generator")}
                className="px-8 py-3.5 rounded-full bg-white text-black font-sans text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-104 hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] active:scale-98"
              >
                Launch Forge
              </button>

              {/* Secondary button */}
              <button
                onClick={() => navigate("/about")}
                className="px-8 py-3.5 rounded-full border border-white/20 bg-transparent text-white font-sans text-sm font-semibold tracking-wide transition-all duration-300 hover:bg-white/10 hover:border-white/40 hover:scale-104 active:scale-98"
              >
                Watch Demo
              </button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
