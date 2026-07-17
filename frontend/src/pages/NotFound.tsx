import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";
import SiteNav from "../components/SiteNav";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page-enter relative h-screen w-full bg-[#050505] text-white overflow-hidden select-none flex flex-col justify-between">
      {/* Background Atmosphere Overlays */}
      <div className="grain-overlay" />
      <div className="animated-vignette" />
      <div className="radial-bg" />

      {/* Navigation Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <SiteNav />
      </motion.div>

      {/* Main Content Area */}
      <main className="relative flex-1 w-full flex flex-col items-center justify-center z-10 px-6 max-w-7xl mx-auto">
        <div className="text-center flex flex-col items-center max-w-[800px] w-full">
          {/* Animated 404 Visual */}
          <div className="relative mb-6">
            {/* Soft background glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.15, 0.25, 0.15], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 -m-12 bg-gradient-to-r from-violet-500/20 via-cyan-500/10 to-orange-500/20 blur-[100px] rounded-full"
            />
            
            {/* Huge numeric 404 display */}
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-sans text-[120px] sm:text-[160px] md:text-[200px] leading-none font-bold tracking-tighter bg-gradient-to-b from-white via-white/80 to-white/10 bg-clip-text text-transparent select-none filter drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            >
              404
            </motion.h2>

            {/* Scanning line animation */}
            <motion.div 
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Main Error Title */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-3xl sm:text-5xl md:text-6xl tracking-tight font-medium text-white"
            >
              Lost in the Machine.
            </motion.h1>
          </div>

          {/* Subtitle / Explanation */}
          <div className="mt-6 w-full max-w-[500px]">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base text-white/60 leading-relaxed font-sans"
            >
              The blueprint coordinates you requested do not exist in this sector of the Forge, or they have been archived.
            </motion.p>
          </div>

          {/* Action CTAs */}
          <div className="mt-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              {/* Go Home button */}
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 rounded-full bg-white text-black font-sans text-xs font-semibold tracking-wider flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] active:scale-98"
              >
                <Home size={14} />
                Return Home
              </button>

              {/* Back button */}
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-full border border-white/20 bg-transparent text-white font-sans text-xs font-semibold tracking-wider flex items-center gap-2 transition-all duration-300 hover:bg-white/10 hover:border-white/40 hover:scale-105 active:scale-98"
              >
                <ArrowLeft size={14} />
                Go Back
              </button>

              {/* Contact Support button */}
              <button
                onClick={() => navigate("/contact")}
                className="px-6 py-3 rounded-full border border-white/10 bg-white/5 text-white/80 font-sans text-xs font-medium tracking-wider flex items-center gap-2 transition-all duration-300 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-98"
              >
                <HelpCircle size={14} />
                Get Support
              </button>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer copyright indicator */}
      <footer className="relative z-10 w-full py-6 text-center text-[10px] uppercase tracking-widest text-white/30 font-sans">
        © {new Date().getFullYear()} Forge AI. All rights reserved.
      </footer>
    </div>
  );
}
